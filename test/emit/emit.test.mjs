// One emitter's output for the fixtures, loaded under node and held to the
// same behaviour as every other emitter's. The two places they are known to
// differ -- whether an enum is marked as free of side effects, and whether
// decorator metadata is written -- are stated per emitter below, so a change
// in either is a failing test rather than a surprise.
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const dir = path.resolve(process.env.EMIT_DIR);
const emitter = process.env.EMITTER;
const format = process.env.FORMAT;

const EXPECTED = {
  tsgo: { pureEnums: false, metadata: true },
  tsc5: { pureEnums: false, metadata: true },
  esbuild: { pureEnums: true, metadata: false },
  swc: { pureEnums: true, metadata: true },
}[emitter];
assert.ok(EXPECTED, `no expectations for emitter ${emitter}`);

const require = createRequire(import.meta.url);
const load = (name) => {
  const file = path.join(dir, `${name}.js`);
  return format === "cjs" ? require(file) : import(pathToFileURL(file).href);
};

test("enums hold their values, reverse mappings and const members", async () => {
  const { Color, Level, Flag, usedFlag, usedInternal } = await load("enums");
  assert.equal(Color.Red, "RED");
  assert.equal(Level.Low, 0);
  assert.equal(Level.High, 6);
  assert.equal(Level[5], "Mid");
  // isolatedModules keeps a const enum as an object: another file may import it.
  assert.equal(Flag.On, 1);
  assert.equal(usedFlag, 1);
  assert.equal(usedInternal, "a");
});

test("enums are marked free of side effects, or are not", () => {
  const source = fs.readFileSync(path.join(dir, "enums.js"), "utf8");
  const marks = source.match(/\/\*\s*[#@]__PURE__\s*\*\//g) ?? [];
  // All four enums or none: the annotation is what lets a bundler drop one
  // nobody uses.
  assert.equal(marks.length, EXPECTED.pureEnums ? 4 : 0, source);
});

test("class fields follow define semantics", async () => {
  const { Account, Square } = await load("classes");
  const account = new Account("ada", 10);
  assert.deepEqual(Object.keys(account), ["owner", "limit", "balance", "note"]);
  assert.equal(account.owner, "ada");
  assert.equal(account.balance, 0);
  assert.equal(account.note, undefined);
  assert.equal(account.canSpend(10), true);
  assert.equal(account.canSpend(11), false);
  assert.equal(account.secretLength, 2);
  assert.equal(Account.opened, 1);
  assert.equal(new Square(3).describe(), "area 9");
});

test("decorators run in order, with or without metadata", async () => {
  const metadata = [];
  Reflect.metadata = (key, value) => (_target, property) => {
    metadata.push({ key, property, value });
  };
  const { Service, applied } = await load("decorators");
  delete Reflect.metadata;

  assert.deepEqual(applied, [
    { kind: "property", name: "name" },
    { kind: "method", name: "run" },
    { kind: "class", name: "Service" },
  ]);
  assert.equal(new Service().run("abc", 2), true);

  const of = (property, key) => metadata.find((m) => m.property === property && m.key === key)?.value;
  if (EXPECTED.metadata) {
    assert.equal(of("name", "design:type"), String);
    assert.equal(of("run", "design:type"), Function);
    assert.deepEqual(of("run", "design:paramtypes"), [String, Number]);
    assert.equal(of("run", "design:returntype"), Boolean);
  } else {
    assert.deepEqual(metadata, []);
  }
});

test("a type-only import is dropped and a side-effect import kept", async () => {
  const { size } = await load("imports");
  assert.equal(size({ n: 3 }), 3);
  assert.equal(globalThis.__emitEffectLoaded, true);
  assert.equal(globalThis.__emitSideLoaded, undefined);
});

test("default and named imports of a CommonJS module agree", async () => {
  const { viaNamed, viaDefault } = await load("interop");
  assert.equal(viaNamed, path.join("a", "b"));
  assert.equal(viaDefault, path.join("a", "b"));
});

test("JSX compiles to calls of the named factory", async () => {
  const { view } = await load("view");
  assert.deepEqual(view, {
    tag: "section",
    props: { id: "a" },
    children: [{ tag: "b", props: null, children: ["bold"] }, "text"],
  });
});
