import { greet, type Greeting } from "@test/greeter";

// Not a library: nothing imports this by name, and no JavaScript is wanted from
// it. Only the checking. The interface comes from the dependency's generated
// declarations, so this file is checked against what ts_library emitted rather
// than against its sources.
export function shout(greeting: Greeting): string {
  return greet(greeting).toUpperCase();
}
