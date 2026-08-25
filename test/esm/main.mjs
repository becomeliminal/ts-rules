import { shout } from "@test/esm";
if (shout("ok") !== "OK!") { throw new Error(`unexpected: ${shout("ok")}`); }
console.log("ok  an ESM library loaded and ran");
