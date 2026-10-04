// A library whose JavaScript a transpiler writes: TypeScript, a plain
// JavaScript file, a JSON module and another first-party library, which is
// everything the compiler would otherwise have carried into the package.
import { greet } from "@test/greeter";
import { shout } from "./legacy.js";
import limits from "./limits.json";

export enum Mood {
  Calm = "calm",
  Loud = "loud",
}

export function welcome(name: string, mood: Mood): string {
  const greeting = greet({ name, times: limits.times });
  return mood === Mood.Loud ? shout(greeting) : greeting;
}
