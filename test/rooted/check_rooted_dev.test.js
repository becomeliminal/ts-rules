const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");

// lib.json is what vite_dev's links are made from: srcDir is where the
// sources live and srcs are their paths within the package. Both must be
// relative to root, or src/index.ts would be linked at src/index.ts while
// the package (and its main) say index.ts.
test("the dev sources are laid out relative to root", () => {
  const lib = JSON.parse(fs.readFileSync("test/rooted/rooted/lib.json", "utf8"));
  assert.strictEqual(lib.srcDir, "test/rooted/src");
  assert.deepStrictEqual(lib.srcs, ["index.ts"]);
  assert.strictEqual(lib.srcEntry, "index.ts");
});
