import { test } from "node:test";
import assert from "node:assert/strict";
import { greet } from "@test/greeter";
import { NAME } from "../helper";

test("a nested compiled test runs too", () => {
  assert.equal(greet({ name: NAME, times: 2 }), "hello ada, hello ada");
});
