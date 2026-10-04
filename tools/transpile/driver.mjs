// Writes a library's JavaScript with a transpiler, beside the declarations the
// compiler has just emitted for the same sources.
//
//   node driver.mjs --config <resolved tsconfig> --root <dir> --out <dir>
//                   [--module-type <package.json type>] [--source-map]
//                   [--adapter <module>] -- <source>...
//
// ts_library runs this after the compiler has type-checked the sources and
// written their declarations into <out>. The compiler stays the only thing
// that reads types; what this replaces is the JavaScript it would have
// written, because an emitter that reads one file at a time can write it
// differently -- esbuild and swc mark an enum as free of side effects, which
// is what lets a bundler drop one nobody uses.
//
// The tsconfig remains the single statement of what to produce. It arrives
// resolved (the compiler's own --showConfig, extends chain and command line
// applied), and this driver, not each transpiler, decides what it means: which
// module format each file gets, which options change the JavaScript, and
// whether the transpiler in hand implements them. An option that changes
// emitted code and is not implemented fails the build. Quietly producing
// different JavaScript from what the tsconfig asks for is the one thing a
// second emitter must never do.
//
// A transpiler is an adapter module: see adapterContract below.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

class Refusal extends Error {}
const refuse = (message) => {
  throw new Refusal(message);
};

// What an adapter module exports. Everything else is this driver's.
//
//   name       how the transpiler is named in messages
//   honours    the compiler options, of those in EMIT_OPTIONS, it implements
//   transpile  ({ filename, source, format, options, sourceMap }) =>
//                { code, map? }
//              format is "esm" or "cjs"; options are the resolved compiler
//              options with target and useDefineForClassFields always set;
//              map is a source map (object or JSON) when sourceMap is true
//   close      optional; called once when every file is written
const adapterContract = ["name", "honours", "transpile"];

// The compiler options that change the JavaScript emitted, each with the value
// that asks for nothing: an option left at that value needs no support from
// the transpiler. ALWAYS marks one whose every value is a request.
//
// Options absent from this table do not change emitted JavaScript: they steer
// type-checking, module resolution or declarations, which stay the compiler's.
// Two are left out deliberately though they touch the output's text.
// removeComments, because comments are not behaviour and no two emitters keep
// the same ones. alwaysStrict, because every module either tool writes is
// strict already.
const ALWAYS = Symbol("always");
const EMIT_OPTIONS = {
  target: ALWAYS,
  jsx: ALWAYS,
  jsxFactory: ALWAYS,
  jsxFragmentFactory: ALWAYS,
  jsxImportSource: ALWAYS,
  reactNamespace: ALWAYS,
  useDefineForClassFields: ALWAYS,
  esModuleInterop: ALWAYS,
  experimentalDecorators: false,
  emitDecoratorMetadata: false,
  verbatimModuleSyntax: false,
  preserveValueImports: false,
  importsNotUsedAsValues: "remove",
  importHelpers: false,
  noEmitHelpers: false,
  downlevelIteration: false,
  rewriteRelativeImportExtensions: false,
  inlineSourceMap: false,
  inlineSources: false,
  sourceRoot: "",
  mapRoot: "",
  newLine: "lf",
  emitBOM: false,
};

// module settings that always mean one format, and the ones that defer to the
// package's own "type", as node does.
const ESM_MODULES = ["es6", "es2015", "es2020", "es2022", "esnext", "preserve"];
const PACKAGE_MODULES = ["node16", "node18", "node20", "nodenext"];

// Each source extension, the extension of what it becomes, and the format it
// fixes whatever the tsconfig says.
const SOURCES = {
  ".ts": { out: ".js" },
  ".tsx": { out: ".js", jsx: true },
  ".mts": { out: ".mjs", format: "esm" },
  ".cts": { out: ".cjs", format: "cjs" },
  ".js": { out: ".js", js: true },
  ".jsx": { out: ".js", js: true, jsx: true },
  ".mjs": { out: ".mjs", js: true, format: "esm" },
  ".cjs": { out: ".cjs", js: true, format: "cjs" },
};
const DECLARATIONS = { ".js": ".d.ts", ".jsx": ".d.ts", ".mjs": ".d.mts", ".cjs": ".d.cts" };

// TypeScript's own default: class fields are defined, not assigned, from
// ES2022 on.
const DEFINES_FIELDS = ["es2022", "es2023", "es2024", "esnext"];

function parseArgs(argv) {
  const args = { files: [], sourceMap: false, moduleType: "" };
  const flags = { "--config": "config", "--root": "root", "--out": "out", "--module-type": "moduleType", "--adapter": "adapter" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--") {
      args.files = argv.slice(i + 1);
      break;
    }
    if (arg === "--source-map") args.sourceMap = true;
    else if (flags[arg]) args[flags[arg]] = argv[++i];
    else refuse(`unknown argument ${arg}`);
  }
  for (const needed of ["config", "out"]) {
    if (!args[needed]) refuse(`--${needed} is required`);
  }
  return args;
}

// The compiler options as the transpiler is to read them: the resolved
// config's, with the two the compiler would default filled in so no adapter
// has to know TypeScript's defaults.
function resolveOptions(config) {
  const options = { ...config.compilerOptions };
  if (options.isolatedModules !== true) {
    refuse(
      "a transpiler writes each file knowing nothing about any other, so the tsconfig must set " +
        '"isolatedModules": true. With it the compiler rejects what a per-file emitter would get ' +
        "wrong -- a re-exported type, an ambient const enum -- so code that type-checks is code " +
        "any transpiler emits the same way.",
    );
  }
  if (options.outFile) refuse("compilerOptions.outFile concatenates modules, which a per-file transpiler cannot do");
  if (!options.target) {
    refuse('the tsconfig must set "target": a transpiler does not share the compiler\'s default');
  }
  if (!options.module) {
    refuse('the tsconfig must set "module": a transpiler does not share the compiler\'s default');
  }
  options.target = options.target.toLowerCase() === "es6" ? "es2015" : options.target.toLowerCase();
  options.module = options.module.toLowerCase();
  options.useDefineForClassFields ??= DEFINES_FIELDS.includes(options.target);
  return options;
}

function checkHonoured(adapter, options) {
  for (const [name, nothing] of Object.entries(EMIT_OPTIONS)) {
    const value = options[name];
    if (value === undefined || value === nothing) continue;
    if (!adapter.honours.includes(name)) {
      refuse(
        `${adapter.name} does not implement compilerOptions.${name}, which the tsconfig sets to ` +
          `${JSON.stringify(value)} and which changes the JavaScript emitted. Unset it, or use a ` +
          "transpiler that implements it (transpiler = \"tsc\" always does).",
      );
    }
  }
}

// The nearest package.json "type" above a source, as node and the compiler
// both read it, or undefined where the staged tree holds none.
function packageType(file) {
  for (let dir = path.dirname(path.resolve(file)); ; dir = path.dirname(dir)) {
    const manifest = path.join(dir, "package.json");
    if (fs.existsSync(manifest)) return JSON.parse(fs.readFileSync(manifest, "utf8")).type ?? "commonjs";
    if (dir === process.cwd() || dir === path.dirname(dir)) return undefined;
  }
}

function formatOf(file, kind, options, moduleType) {
  if (kind.format) return kind.format;
  if (options.module === "commonjs") return "cjs";
  if (ESM_MODULES.includes(options.module)) return "esm";
  if (PACKAGE_MODULES.includes(options.module)) {
    const declared = moduleType === "module" ? "module" : "commonjs";
    // The compiler decided this file's format from the package.json it could
    // see. The rule decided it from module_type. If they differ the
    // JavaScript written here is not the module the compiler checked.
    const seen = packageType(file);
    if (seen !== undefined && seen !== declared) {
      refuse(
        `${file}: the package.json above it has "type": "${seen}", and the rule's module_type makes ` +
          `the package "${declared}". Under module ${options.module} the compiler follows the ` +
          "former, so the two must agree.",
      );
    }
    return declared === "module" ? "esm" : "cjs";
  }
  return refuse(`compilerOptions.module "${options.module}" is not a format a transpiler here writes: use commonjs, an ES module setting, or a node one`);
}

function sourceMapFor(map, source, dest, options) {
  const parsed = typeof map === "string" ? JSON.parse(map) : { ...map };
  parsed.file = path.basename(dest);
  // As the compiler writes it: the path from the emitted file to its source.
  parsed.sources = [path.relative(path.dirname(dest), source).split(path.sep).join("/")];
  delete parsed.sourceRoot;
  if (options.inlineSources !== true) delete parsed.sourcesContent;
  return JSON.stringify(parsed);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = args.root || ".";
  const options = resolveOptions(JSON.parse(fs.readFileSync(args.config, "utf8")));

  const adapterPath = args.adapter ?? path.join(path.dirname(new URL(import.meta.url).pathname), "adapter.mjs");
  const adapter = await import(pathToFileURL(path.resolve(adapterPath)).href);
  for (const part of adapterContract) {
    if (adapter[part] === undefined) refuse(`${adapterPath} is not a transpiler adapter: it exports no ${part}`);
  }
  checkHonoured(adapter, options);

  const jobs = [];
  for (const file of args.files) {
    if (/\.d\.[cm]?ts$/.test(file)) continue;
    const ext = path.extname(file);
    const rel = path.relative(root, file);
    const inside = !rel.startsWith("..") && !path.isAbsolute(rel);

    // A JSON module is copied, as the compiler copies one it emits for.
    if (ext === ".json") {
      if (options.resolveJsonModule === true && inside) jobs.push({ copy: file, dest: path.join(args.out, rel) });
      continue;
    }
    const kind = SOURCES[ext];
    if (!kind) continue;
    // JavaScript is part of the program only where the tsconfig says so.
    if (kind.js && options.allowJs !== true) continue;
    if (!inside) refuse(`${file} is outside the root (${root}), so it has no place in the package`);

    const keepsJsx = kind.jsx && ["preserve", "react-native"].includes(options.jsx);
    const outExt = keepsJsx && options.jsx === "preserve" ? ".jsx" : kind.out;
    const dest = path.join(args.out, rel.slice(0, -ext.length) + outExt);

    // Checked means emitted and emitted means checked. The compiler wrote a
    // declaration for every file in its program, so a source without one was
    // never type-checked -- left out by the tsconfig's include, say -- and its
    // JavaScript must not ship as though it had been.
    const declaration = path.join(args.out, rel.slice(0, -ext.length) + DECLARATIONS[kind.out]);
    if (!fs.existsSync(declaration)) {
      refuse(
        `${file} is in srcs, but the compiler emitted no declaration for it, so nothing type-checked ` +
          "it: the tsconfig's files or include leave it out of the program. Include it, or drop it from srcs.",
      );
    }
    jobs.push({ source: file, dest, format: formatOf(file, kind, options, args.moduleType) });
  }

  await Promise.all(
    jobs.map(async (job) => {
      fs.mkdirSync(path.dirname(job.dest), { recursive: true });
      if (job.copy) {
        fs.copyFileSync(job.copy, job.dest);
        return;
      }
      let result;
      try {
        result = await adapter.transpile({
          filename: job.source,
          source: fs.readFileSync(job.source, "utf8"),
          format: job.format,
          options,
          sourceMap: args.sourceMap,
        });
      } catch (error) {
        refuse(`${adapter.name} could not transpile ${job.source}: ${error.message}`);
      }
      let code = result.code;
      if (args.sourceMap) {
        if (!result.map) refuse(`${adapter.name} returned no source map for ${job.source}`);
        fs.writeFileSync(`${job.dest}.map`, sourceMapFor(result.map, job.source, job.dest, options));
        code = `${code.replace(/\n*$/, "\n")}//# sourceMappingURL=${path.basename(job.dest)}.map\n`;
      }
      fs.writeFileSync(job.dest, code);
    }),
  );
  await adapter.close?.();
}

main().catch((error) => {
  if (error instanceof Refusal) {
    console.error(`ts_library: ${error.message}`);
    process.exit(1);
  }
  throw error;
});
