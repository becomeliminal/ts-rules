/**
 * A repo with no TypeScript in it at all. The JSDoc is optional; without it
 * every parameter is `any` and this still compiles, which is what makes
 * adoption gradual.
 * @param {number} n
 * @returns {number}
 */
export function double(n) {
  return n * 2;
}
