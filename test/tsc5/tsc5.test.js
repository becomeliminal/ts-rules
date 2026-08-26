const { test } = require("node:test");
const assert = require("node:assert");

// Consumed by package name like any other library. Nothing about a consumer
// changes because a different compiler produced it.
const { greet } = require("@test/tsc5");

test("a library compiled by TypeScript 5 is a library like any other", () => {
  assert.equal(greet({ name: "please", times: 2 }), "hello please, hello please");
});
