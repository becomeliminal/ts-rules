// Every shape of enum. What each emitter writes for these is the reason this
// comparison exists: a bundler drops an unused enum only if the emitter marks
// the expression that builds it as free of side effects.
export enum Color {
  Red = "RED",
  Green = "GREEN",
}

export enum Level {
  Low,
  Mid = 5,
  High,
}

export const enum Flag {
  Off = 0,
  On = 1,
}

enum Internal {
  A = "a",
}

export const usedFlag: number = Flag.On;
export const usedInternal: string = Internal.A;
