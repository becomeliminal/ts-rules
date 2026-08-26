// The three TypeScript files someone added this week, importing the rest.
import { shout } from "./legacy.js";

export function greet(who: string): string {
  return shout(who);
}
