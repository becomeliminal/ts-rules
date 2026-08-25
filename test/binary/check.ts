import { strict as assert } from "node:assert";
import { greet } from "@test/hello";

assert.equal(greet("Please"), "Hello, Please!");
console.log("ok");
