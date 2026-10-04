// Emits JavaScript for the comparison's fixtures with swc or esbuild, one file
// at a time, the way either would be used beside a type-checker: no types
// read, nothing known about any file but the one in hand.
//
//   node emit.mjs <swc|esbuild> <esm|cjs> <tsconfig> <root> <out> <file>...
//
// The tsconfig is the one the TypeScript compilers are given, so all four
// emitters work from the same statement of what to produce. This script maps
// it onto each tool's own options, and the mapping is deliberately explicit:
// it is the work a build rule would have to own to use either tool.
import fs from "node:fs";
import path from "node:path";

const [tool, format, configPath, root, out, ...files] = process.argv.slice(2);
if (!["swc", "esbuild"].includes(tool) || !["esm", "cjs"].includes(format) || files.length === 0) {
  console.error("usage: emit.mjs <swc|esbuild> <esm|cjs> <tsconfig> <root> <out> <file>...");
  process.exit(2);
}

const options = JSON.parse(fs.readFileSync(configPath, "utf8")).compilerOptions;
const target = options.target.toLowerCase();
// TypeScript's own default: define semantics from ES2022 on.
const defineFields = options.useDefineForClassFields ?? ["es2022", "es2023", "es2024", "esnext"].includes(target);

async function withSwc(source, filename) {
  const { transform } = await import("@swc/core");
  const result = await transform(source, {
    filename,
    swcrc: false,
    configFile: false,
    isModule: true,
    jsc: {
      target,
      parser: {
        syntax: "typescript",
        tsx: filename.endsWith(".tsx"),
        decorators: options.experimentalDecorators === true,
      },
      transform: {
        legacyDecorator: options.experimentalDecorators === true,
        decoratorMetadata: options.emitDecoratorMetadata === true,
        useDefineForClassFields: defineFields,
        verbatimModuleSyntax: options.verbatimModuleSyntax === true,
        react: { runtime: "classic", pragma: options.jsxFactory },
      },
    },
    module: format === "cjs" ? { type: "commonjs", importInterop: "swc" } : { type: "es6" },
  });
  return result.code;
}

async function withEsbuild(source, filename) {
  const { transform } = await import("esbuild");
  const result = await transform(source, {
    sourcefile: filename,
    loader: filename.endsWith(".tsx") ? "tsx" : "ts",
    format,
    target,
    // esbuild reads these few from a tsconfig itself. emitDecoratorMetadata is
    // passed so the comparison is honest about it: esbuild accepts the option
    // and writes no metadata.
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: options.experimentalDecorators,
        emitDecoratorMetadata: options.emitDecoratorMetadata,
        useDefineForClassFields: defineFields,
        verbatimModuleSyntax: options.verbatimModuleSyntax,
        jsx: options.jsx,
        jsxFactory: options.jsxFactory,
      },
    },
  });
  return result.code;
}

const emit = tool === "swc" ? withSwc : withEsbuild;
// Together rather than in turn: both tools transform off the main thread, and
// a file needs nothing from any other.
await Promise.all(
  files.map(async (file) => {
    const rel = path.relative(root, file).replace(/\.tsx?$/, ".js");
    const dest = path.join(out, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, await emit(fs.readFileSync(file, "utf8"), file));
  }),
);
// What tells node how to read the .js files beside it.
fs.writeFileSync(
  path.join(out, "package.json"),
  JSON.stringify({ type: format === "cjs" ? "commonjs" : "module" }) + "\n",
);
