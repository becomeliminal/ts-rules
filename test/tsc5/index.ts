// Compiled by TypeScript 5.x rather than the tsgo this plugin ships, to prove
// the two-tree design does what it was built for. Nothing here is special: it
// is an ordinary library that happens to name a different compiler.
export interface Greeting {
  name: string;
  times: number;
}

export function greet({ name, times }: Greeting): string {
  return Array.from({ length: times }, () => `hello ${name}`).join(", ");
}
