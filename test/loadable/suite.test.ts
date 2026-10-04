// The suite shares the library's tsconfig, so it is ES modules too: emitted by
// the transpiler, run by node, importing a helper with no extension and the
// library by name.
import assert from "node:assert";
import { test } from "node:test";
import { describe, lazily } from "@test/loadable-esbuild";
import { SIDE } from "./helper";

test("the library, from a suite that is itself ES modules", async () => {
  assert.equal(describe(SIDE), "9px");
  assert.equal(await lazily(), "px");
});
