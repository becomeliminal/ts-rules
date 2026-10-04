const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");

const pkg = "test/transpiled/lib/pkg";

test("the library runs: TypeScript, JavaScript, JSON and a dependency", () => {
  const { welcome, Mood } = require("@test/transpiled");
  assert.equal(welcome("ada", Mood.Calm), "hello ada, hello ada");
  assert.equal(welcome("ada", Mood.Loud), "HELLO ADA, HELLO ADA");
});

test("the transpiler wrote the JavaScript, and the compiler the declarations", () => {
  // What esbuild writes for an enum and the compiler does not.
  assert.match(fs.readFileSync(`${pkg}/index.js`, "utf8"), /@__PURE__/);
  assert.ok(fs.existsSync("test/transpiled/lib_types/pkg/index.d.ts"), "declarations in the twin");
  assert.ok(!fs.existsSync(`${pkg}/index.d.ts`), "and not in the runtime package");
});

test("the JavaScript and JSON beside the TypeScript are in the package", () => {
  assert.ok(fs.existsSync(`${pkg}/legacy.js`));
  assert.deepEqual(JSON.parse(fs.readFileSync(`${pkg}/limits.json`, "utf8")), { times: 2 });
});

test("the source map points at the TypeScript it came from", () => {
  const map = JSON.parse(fs.readFileSync(`${pkg}/index.js.map`, "utf8"));
  assert.equal(map.file, "index.js");
  assert.equal(map.sources.length, 1);
  assert.ok(map.sources[0].endsWith("test/transpiled/index.ts"), `sources: ${map.sources}`);
  assert.ok(map.mappings.length > 0, "a map with no mappings locates nothing");
  assert.match(fs.readFileSync(`${pkg}/index.js`, "utf8"), /\/\/# sourceMappingURL=index\.js\.map\n$/);
});

test("a transpiler of a repo's own is used like the plugin's", () => {
  const source = fs.readFileSync("test/transpiled/custom/pkg/double.js", "utf8");
  assert.match(source, /^\/\/ written by typescript\.transpileModule\n/);
  assert.equal(require("@test/transpiled-custom").double(21), 42);
});
