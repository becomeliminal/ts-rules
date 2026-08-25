import { strict as assert } from "node:assert";
import { shout } from "@test/esm";

assert.equal(shout("please"), "PLEASE!");
