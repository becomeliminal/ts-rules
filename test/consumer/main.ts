// The contract: a ts_library imported by name, type-checked against the .d.ts
// its dependency produced rather than by recompiling that dependency's sources.
import { greet, type Greeting } from "@test/greeter";

const g: Greeting = { name: "please", times: 2 };
const out = greet(g);

if (out !== "hello please, hello please") {
    throw new Error(`unexpected: ${out}`);
}
console.log(`ok  ${out}`);
