const { test } = require("node:test");
const assert = require("node:assert");

// The agreed rootDir did its job if this resolves: the package's entry is
// index.js at the package root, not src/index.js.
test("src/ was stripped from the emitted layout", () => {
  const { rooted } = require("@test/rooted");
  assert.match(rooted(), /emitted at the package root/);
});
