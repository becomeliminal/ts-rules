// A default import of a CommonJS module, the case each emitter's CommonJS
// output wraps in its own interop helper.
import path, { join } from "node:path";

export const viaNamed: string = join("a", "b");
export const viaDefault: string = path.join("a", "b");
