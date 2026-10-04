// esbuild as a ts_library's transpiler: the adapter driver.mjs loads.
//
// esbuild is what vite applies to an application's own sources, so a library
// emitted this way reaches a bundle as it would have had the application
// compiled it itself.
//
// What it does not implement is absent from `honours`, and the driver fails a
// build whose tsconfig asks for it. The one that matters is
// emitDecoratorMetadata: metadata is the types of what a decorator decorates,
// and esbuild reads no types.
import path from "node:path";
import { stop, transform } from "esbuild";

export const name = "esbuild";

export const honours = [
  "target",
  "jsx",
  "jsxFactory",
  "jsxFragmentFactory",
  "jsxImportSource",
  "useDefineForClassFields",
  "experimentalDecorators",
  "verbatimModuleSyntax",
  "esModuleInterop",
  "inlineSources",
];

const LOADERS = {
  ".ts": "ts",
  ".mts": "ts",
  ".cts": "ts",
  ".tsx": "tsx",
  ".js": "js",
  ".mjs": "js",
  ".cjs": "js",
  ".jsx": "jsx",
};

export async function transpile({ filename, source, format, options, sourceMap }) {
  if (format === "cjs" && options.esModuleInterop === false) {
    throw new Error(
      "esbuild's CommonJS output always imports with esModuleInterop's semantics, and the tsconfig sets esModuleInterop to false",
    );
  }
  const result = await transform(source, {
    sourcefile: filename,
    loader: LOADERS[path.extname(filename)],
    format,
    target: options.target,
    // As the compiler writes it: non-ASCII text stays text, not escapes.
    charset: "utf8",
    sourcemap: sourceMap ? "external" : false,
    sourcesContent: options.inlineSources === true,
    // The few settings esbuild reads from a tsconfig itself, handed over
    // resolved rather than left for it to find a file.
    tsconfigRaw: {
      compilerOptions: {
        jsx: options.jsx,
        jsxFactory: options.jsxFactory,
        jsxFragmentFactory: options.jsxFragmentFactory,
        jsxImportSource: options.jsxImportSource,
        useDefineForClassFields: options.useDefineForClassFields,
        experimentalDecorators: options.experimentalDecorators,
        verbatimModuleSyntax: options.verbatimModuleSyntax,
      },
    },
  });
  return { code: result.code, map: sourceMap ? result.map : undefined };
}

// esbuild runs as a child process that outlives the calls made to it.
export async function close() {
  await stop();
}
