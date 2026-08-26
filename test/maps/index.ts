// A first-party TypeScript library. It is imported by name, exactly as a
// js_library is, and a consumer type-checks against the .d.ts this produces
// rather than recompiling these sources.
export interface Greeting {
    name: string;
    times: number;
}

export function greet({ name, times }: Greeting): string {
    return Array.from({ length: times }, () => `hello ${name}`).join(", ");
}
