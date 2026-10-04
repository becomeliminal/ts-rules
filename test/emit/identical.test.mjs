// TypeScript 7 (tsgo) and TypeScript 5.9 write the same JavaScript, byte for
// byte, for every fixture here. So the choice between them is about speed and
// API stability, and never about what a bundler is handed.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

for (const format of ["esm", "cjs"]) {
  test(`tsgo and tsc 5.9 emit identical ${format}`, () => {
    const tsgo = path.resolve(process.env.EMIT_ROOT, `tsgo_${format}/pkg`);
    const tsc5 = path.resolve(process.env.EMIT_ROOT, `tsc5_${format}/pkg`);
    const files = fs.readdirSync(tsgo).filter((f) => f.endsWith(".js")).sort();
    // A comparison of nothing would pass.
    assert.equal(files.length, 9);
    for (const file of files) {
      assert.equal(
        fs.readFileSync(path.join(tsgo, file), "utf8"),
        fs.readFileSync(path.join(tsc5, file), "utf8"),
        file,
      );
    }
  });
}
