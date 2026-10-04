// A library emitted as ES modules is loaded by node itself: not by a bundler,
// which would have found `./tokens` whatever it was called.
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";

for (const transpiler of ["esbuild", "swc"]) {
  const pkg = `test/loadable/lib_${transpiler}/pkg`;

  test(`${transpiler}: node imports the package by name`, async () => {
    const lib = await import(`@test/loadable-${transpiler}`);
    assert.equal(lib.describe(4), "16px");
    assert.equal(await lib.lazily(), "px");
  });

  test(`${transpiler}: each relative import names the file it means`, () => {
    const index = fs.readFileSync(`${pkg}/index.js`, "utf8");
    assert.match(index, /from ["']\.\/tokens\.js["']/);
    // A directory is its index.
    assert.match(index, /from ["']\.\/shapes\/index\.js["']/);
    assert.match(index, /import\(["']\.\/tokens\.js["']\)/);
    assert.match(fs.readFileSync(`${pkg}/shapes/index.js`, "utf8"), /from ["']\.\/square\.js["']/);
  });

  test(`${transpiler}: the package says it is ES modules`, () => {
    assert.equal(JSON.parse(fs.readFileSync(`${pkg}/package.json`, "utf8")).type, "module");
  });
}

test("the sources say none of it", () => {
  const source = fs.readFileSync("test/loadable/src/index.ts", "utf8");
  assert.match(source, /from "\.\/tokens";/);
  assert.match(source, /from "\.\/shapes";/);
});
