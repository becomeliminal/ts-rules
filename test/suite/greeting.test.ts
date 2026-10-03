import { test } from "node:test";
import assert from "node:assert/strict";
import { greet, type Greeting } from "@test/greeter";
import { NAME } from "./helper";

test("a compiled test imports the library under test by name", () => {
  const greeting: Greeting = { name: NAME, times: 1 };
  assert.equal(greet(greeting), "hello ada");
});
