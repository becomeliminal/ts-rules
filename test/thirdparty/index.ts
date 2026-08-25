// A first-party library type-checking against a third-party package's types.
// The compiler resolves its own native binary from one tree and @types/node
// from another, and the two resolutions never meet.
import { platform } from "node:process";
import { join } from "node:path";

export function describeHost(): string {
    const where: string = join("on", platform);
    return where;
}
