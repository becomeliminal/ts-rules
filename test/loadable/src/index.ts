// Written the way sources shared with a bundler are written: relative imports
// with no extension, and a directory imported by its name.
import { unit } from "./tokens";
import { area } from "./shapes";

export { area, unit };

export function describe(side: number): string {
  return `${area({ kind: "square", side })}${unit}`;
}

export const lazily = async (): Promise<string> => (await import("./tokens")).unit;
