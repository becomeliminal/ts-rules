// Unpacks swc's native addon inside a built node_modules tree.
//
//   node unpack_swc.mjs <tree>
//
// From 1.16.12, @swc/core's platform packages ship the addon zstd-compressed
// inside a small "carrier" .node, which on first load writes the original into
// a per-user cache and loads it from there (swc-project/swc#12273). A build
// action has no user cache and must not share one, and the carrier refuses a
// cache directory with a group-writable ancestor, which every directory under
// plz-out is on a machine with the common 002 umask. So the tree is given the
// original addon here, once, where this repo decides it goes: in the tree. What
// loads is then an ordinary addon, exactly as swc shipped it before, with no
// cache, no environment variable and no decompression per process.
//
// The carrier's payload is documented in that issue and is self-verifying: a
// header holding the compressed length, the raw length and the SHA-512 of the
// original addon, then one zstd frame. Everything is checked against it, and a
// carrier this script does not understand fails the build rather than being
// left to fail at load.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const PAYLOAD = Buffer.from("SWCNZSTD");
const CARRIER = Buffer.from("SWCNB3V1");
const ZSTD_FRAME = Buffer.from([0x28, 0xb5, 0x2f, 0xfd]);
// The executable formats a native addon can be: ELF, Mach-O (64-bit, either
// byte order, and universal), and PE.
const ADDON_MAGICS = ["7f454c46", "cffaedfe", "feedfacf", "cafebabe", "4d5a"];

function findPayload(carrier) {
  for (let at = carrier.indexOf(PAYLOAD); at >= 0; at = carrier.indexOf(PAYLOAD, at + 1)) {
    if (at + 96 > carrier.length) continue;
    const version = carrier.readUInt16LE(at + 8);
    const headerSize = carrier.readUInt16LE(at + 10);
    if (version !== 1 || headerSize !== 96) continue;
    if (!carrier.subarray(at + headerSize, at + headerSize + 4).equals(ZSTD_FRAME)) continue;
    return {
      compressed: Number(carrier.readBigUInt64LE(at + 16)),
      raw: Number(carrier.readBigUInt64LE(at + 24)),
      sha512: carrier.subarray(at + 32, at + 96),
      start: at + headerSize,
    };
  }
  return null;
}

function unpack(file) {
  const carrier = fs.readFileSync(file);
  const payload = findPayload(carrier);
  if (!payload) {
    if (carrier.includes(CARRIER)) {
      throw new Error(`${file} is an swc carrier whose payload header is not the version 1 this script reads`);
    }
    return "already an ordinary addon";
  }
  if (payload.start + payload.compressed > carrier.length) {
    throw new Error(`${file}: the payload header declares ${payload.compressed} compressed bytes, more than the file holds`);
  }
  const addon = zlib.zstdDecompressSync(carrier.subarray(payload.start, payload.start + payload.compressed));
  if (addon.length !== payload.raw) {
    throw new Error(`${file}: unpacked ${addon.length} bytes where the header declares ${payload.raw}`);
  }
  if (!crypto.createHash("sha512").update(addon).digest().equals(payload.sha512)) {
    throw new Error(`${file}: the unpacked addon does not match the SHA-512 in its header`);
  }
  if (!ADDON_MAGICS.some((magic) => addon.subarray(0, magic.length / 2).toString("hex") === magic)) {
    throw new Error(`${file}: the unpacked payload is not an ELF, Mach-O or PE addon`);
  }
  // Beside it and renamed over it, so the carrier is replaced rather than
  // written through: a staged file can be a hard link to a build output.
  const staged = `${file}.unpacked`;
  fs.writeFileSync(staged, addon, { mode: 0o755 });
  fs.renameSync(staged, file);
  return `unpacked ${carrier.length} -> ${addon.length} bytes, SHA-512 verified`;
}

function addons(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    // Real directories only: the tree's top level is symlinks into its store,
    // and following them would visit every package twice.
    if (entry.isDirectory()) return addons(full);
    return entry.isFile() && entry.name.endsWith(".node") ? [full] : [];
  });
}

const tree = process.argv[2];
const found = addons(tree).filter((file) => file.includes(`${path.sep}@swc${path.sep}core-`));
if (found.length === 0) {
  throw new Error(`no @swc/core native addon under ${tree}: this platform has none in the tree, so swc cannot run here`);
}
for (const file of found) {
  console.log(`${path.relative(tree, file)}: ${unpack(file)}`);
}
