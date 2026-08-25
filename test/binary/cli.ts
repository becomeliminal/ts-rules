import { greet } from "./index.js";

console.log(greet(process.argv[2] ?? "world"));
