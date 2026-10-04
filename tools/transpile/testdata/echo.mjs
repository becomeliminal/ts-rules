// The smallest adapter there is: it returns the source untouched, behind a
// first line saying what the driver asked of it. What a test then reads from
// the output is the driver's decision, not a transpiler's.
export const name = "echo";

export const honours = ["target", "jsx", "useDefineForClassFields", "esModuleInterop"];

export async function transpile({ filename, source, format, options, sourceMap }) {
  return {
    code: `// ${format} ${options.target} ${filename}\n${source}`,
    map: sourceMap ? { version: 3, sources: ["wherever"], mappings: "AAAA", sourcesContent: [source] } : undefined,
  };
}
