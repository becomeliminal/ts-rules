const { test } = require("node:test");
const assert = require("node:assert");

// One library, half JavaScript and half TypeScript. A consumer cannot tell.
const { greet } = require("@test/mixed");

test("a half-migrated library is a library like any other", () => {
  assert.equal(greet("please"), "HELLO PLEASE");
});
