// swc as a ts_library's transpiler: the adapter driver.mjs loads.
//
// swc reads no tsconfig, so every setting is mapped here from the resolved
// compiler options. It implements decorator metadata, which esbuild does not:
// it reconstructs the types from the annotations in the file.
import path from "node:path";
import { transform } from "@swc/core";

export const name = "swc";

export const honours = [
  "target",
  "jsx",
  "jsxFactory",
  "jsxFragmentFactory",
  "jsxImportSource",
  "useDefineForClassFields",
  "experimentalDecorators",
  "emitDecoratorMetadata",
  "verbatimModuleSyntax",
  "esModuleInterop",
  "inlineSources",
];

function react(options) {
  switch (options.jsx) {
    case undefined:
      return undefined;
    case "react":
      return { runtime: "classic", pragma: options.jsxFactory, pragmaFrag: options.jsxFragmentFactory };
    case "react-jsx":
      return { runtime: "automatic", importSource: options.jsxImportSource };
    case "react-jsxdev":
      return { runtime: "automatic", importSource: options.jsxImportSource, development: true };
    default:
      throw new Error(`swc always compiles JSX, and the tsconfig sets jsx to "${options.jsx}", which leaves it in the output`);
  }
}

export async function transpile({ filename, source, format, options, sourceMap }) {
  const ext = path.extname(filename);
  const typescript = [".ts", ".tsx", ".mts", ".cts"].includes(ext);
  const decorators = options.experimentalDecorators === true;
  const result = await transform(source, {
    filename,
    sourceFileName: filename,
    swcrc: false,
    configFile: false,
    isModule: true,
    sourceMaps: sourceMap,
    inlineSourcesContent: options.inlineSources === true,
    jsc: {
      target: options.target,
      parser: typescript
        ? { syntax: "typescript", tsx: ext === ".tsx", decorators }
        : { syntax: "ecmascript", jsx: ext === ".jsx", decorators },
      transform: {
        legacyDecorator: decorators,
        decoratorMetadata: options.emitDecoratorMetadata === true,
        useDefineForClassFields: options.useDefineForClassFields,
        verbatimModuleSyntax: options.verbatimModuleSyntax === true,
        react: react(options),
      },
    },
    module:
      format === "cjs"
        ? { type: "commonjs", importInterop: options.esModuleInterop === false ? "none" : "swc" }
        : { type: "es6" },
  });
  return { code: result.code, map: sourceMap ? result.map : undefined };
}
