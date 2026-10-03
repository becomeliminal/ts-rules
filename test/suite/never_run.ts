import { test } from "node:test";

// Compiled with the suite but not a *.test file, so it must never run.
test("a non-test source is not run", () => {
  throw new Error("never_run.ts was run as a test");
});
