// An ESM library. The generated package.json must say type: module, or node
// parses this as CommonJS and rejects the export statement.
export const shout = (s: string): string => `${s.toUpperCase()}!`;
