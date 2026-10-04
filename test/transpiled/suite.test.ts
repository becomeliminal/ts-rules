// A ts_test suite emitted by the transpiler: type-checked like any other, and
// run from JavaScript esbuild wrote.
import assert from "node:assert";
import { test } from "node:test";
import { Mood, welcome } from "@test/transpiled";

test("the transpiled library, from a transpiled suite", () => {
  assert.equal(welcome("lin", Mood.Loud), "HELLO LIN, HELLO LIN");
});
