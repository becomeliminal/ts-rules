const { test, describe } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");

const pkg = "test/maps/maps/pkg";

describe("maps that locate, not merely exist", () => {
  test("the sourcemap points at the TypeScript it came from", () => {
    const map = JSON.parse(fs.readFileSync(`${pkg}/index.js.map`, "utf8"));
    assert.ok(map.sources.some((s) => s.endsWith("index.ts")), `sources: ${map.sources}`);
    assert.ok(map.mappings.length > 0, "a map with no mappings locates nothing");
  });

  test("the declaration map does the same for go-to-definition", () => {
    // Declarations live in the types twin, and the map travels with the
    // .d.ts that references it -- a dangling sourceMappingURL locates nothing.
    const types = "test/maps/maps_types/pkg";
    assert.ok(fs.existsSync(`${types}/index.d.ts`), "declaration in the twin");
    assert.ok(!fs.existsSync(`${pkg}/index.d.ts`), "and not in the runtime package");
    const map = JSON.parse(fs.readFileSync(`${types}/index.d.ts.map`, "utf8"));
    assert.ok(map.sources.some((s) => s.endsWith("index.ts")));
    assert.ok(map.mappings.length > 0);
  });

  test("the trace is beside the package, not inside it", () => {
    const entries = fs.readdirSync("test/maps/maps/trace");
    assert.ok(entries.some((f) => f.startsWith("trace")), `trace dir holds ${entries}`);
    assert.ok(!fs.existsSync(`${pkg}/trace`), "diagnostics are not package content");
  });
});
