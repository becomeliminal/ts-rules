// A transpiler of a repo's own: TypeScript 5's transpileModule, the compiler's
// single-file mode, behind the adapter contract. It is here to show the
// contract is the whole of what a transpiler needs -- this file, and a tree
// holding the tool -- and it marks what it writes so a test can tell it ran.
import ts from "typescript";

export const name = "transpileModule";

// Everything the compiler implements, since it is the compiler.
export const honours = [
  "target",
  "jsx",
  "jsxFactory",
  "jsxFragmentFactory",
  "jsxImportSource",
  "useDefineForClassFields",
  "esModuleInterop",
  "experimentalDecorators",
  "emitDecoratorMetadata",
  "verbatimModuleSyntax",
];

export async function transpile({ filename, source, format, options }) {
  const { outputText } = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget[options.target.toUpperCase()],
      module: format === "cjs" ? ts.ModuleKind.CommonJS : ts.ModuleKind.ESNext,
      esModuleInterop: options.esModuleInterop,
      useDefineForClassFields: options.useDefineForClassFields,
    },
  });
  return { code: `// written by typescript.transpileModule\n${outputText}` };
}
