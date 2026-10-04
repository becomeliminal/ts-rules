// Import elision. `Sized` is only ever a type here, so the import of side.js
// must not survive -- which a per-file emitter has to conclude without knowing
// what side.js exports.
import "./effect.js";
import { Sized } from "./side.js";

export function size(s: Sized): number {
  return s.n;
}
