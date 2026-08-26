const { test } = require("node:test");
const assert = require("node:assert");

// Two libraries compiled under two same-named tsconfigs extending one base --
// if either config had been staged over the other, one of these would have
// compiled under the wrong options or not at all.
test("both packages compiled under their own config", () => {
  const { celsius } = require("@test/metric");
  const { fahrenheit } = require("@test/imperial");
  assert.strictEqual(celsius(212), 100);
  assert.strictEqual(fahrenheit(100), 212);
});
