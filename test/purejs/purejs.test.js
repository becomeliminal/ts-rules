const { test } = require("node:test");
const assert = require("node:assert");

// Consumed by package name, the same way any other library is. Nothing about
// this consumer knows the library was written in JavaScript.
const { double } = require("@test/purejs");

test("a library written in plain JavaScript is a library like any other", () => {
  assert.equal(double(21), 42);
});
