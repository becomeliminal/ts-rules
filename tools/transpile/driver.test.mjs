// The driver's decisions, tested through an adapter that makes none: which
// files it transpiles, the format and name each gets, and above all what it
// refuses. Every refusal here is a build that would otherwise have shipped
// JavaScript the tsconfig did not describe or nothing type-checked.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

const HERE = path.resolve("tools/transpile");
// As built: the driver in its directory, beside the tree its lexer is in.
const DRIVER = path.join(HERE, "driver/driver.mjs");
const ECHO = path.join(HERE, "testdata/echo.mjs");

const BASE = { target: "es2022", module: "esnext", isolatedModules: true };

// A library in a temporary directory: its sources, the declarations the
// compiler would have emitted for them, and the resolved config.
function library(files, compilerOptions, { declare = Object.keys(files) } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "driver-"));
  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), content);
  }
  for (const name of declare) {
    const rel = path.relative("src", name).replace(/\.(ts|tsx|js|jsx)$/, ".d.ts").replace(/\.m(ts|js)$/, ".d.mts").replace(/\.c(ts|js)$/, ".d.cts");
    fs.mkdirSync(path.dirname(path.join(dir, "out", rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, "out", rel), "export {};\n");
  }
  fs.writeFileSync(path.join(dir, "resolved.json"), JSON.stringify({ compilerOptions }));
  return dir;
}

function drive(dir, files, extra = [], adapter = ECHO) {
  const adapterArgs = adapter ? ["--adapter", adapter] : [];
  const driver = adapter ? DRIVER : path.join(extra.shift(), "driver/driver.mjs");
  const run = spawnSync(
    process.execPath,
    [driver, "--config", "resolved.json", "--root", "src", "--out", "out", ...adapterArgs, ...extra, "--", ...files],
    { cwd: dir, encoding: "utf8" },
  );
  return { status: run.status, stderr: run.stderr, read: (f) => fs.readFileSync(path.join(dir, "out", f), "utf8") };
}

const refused = (run, ...fragments) => {
  assert.equal(run.status, 1, run.stderr);
  for (const fragment of fragments) assert.match(run.stderr, fragment);
};

test("a source becomes a .js beside its declaration, as an ES module", () => {
  const dir = library({ "src/a.ts": "export const a = 1;\n", "src/deep/b.tsx": "export const b = 2;\n" }, BASE);
  const run = drive(dir, ["src/a.ts", "src/deep/b.tsx"]);
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.read("a.js"), /^\/\/ esm es2022 src\/a\.ts\n/);
  assert.match(run.read("deep/b.js"), /^\/\/ esm /);
});

test("the module setting decides the format", () => {
  for (const [module, moduleType, format] of [
    ["commonjs", "", "cjs"],
    ["esnext", "", "esm"],
    ["preserve", "", "esm"],
    ["nodenext", "", "cjs"],
    ["node16", "commonjs", "cjs"],
  ]) {
    const dir = library({ "src/a.ts": "export {};\n" }, { ...BASE, module });
    const run = drive(dir, ["src/a.ts"], moduleType ? ["--module-type", moduleType] : []);
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.read("a.js"), new RegExp(`^// ${format} `), `module ${module}, type "${moduleType}"`);
  }
});

test("an .mts or .cts source fixes its own format and extension", () => {
  const dir = library({ "src/m.mts": "export {};\n", "src/c.cts": "export {};\n" }, { ...BASE, module: "nodenext" });
  const run = drive(dir, ["src/m.mts", "src/c.cts"]);
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.read("m.mjs"), /^\/\/ esm /);
  assert.match(run.read("c.cjs"), /^\/\/ cjs /);
});

test("preserved JSX keeps the .jsx extension", () => {
  const dir = library({ "src/v.tsx": "export {};\n" }, { ...BASE, jsx: "preserve" });
  const run = drive(dir, ["src/v.tsx"]);
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.read("v.jsx"), /^\/\/ esm /);
});

test("declarations are left alone, and JavaScript is transpiled only under allowJs", () => {
  const files = { "src/a.ts": "export {};\n", "src/types.d.ts": "export {};\n", "src/legacy.js": "export {};\n" };
  const without = library(files, BASE, { declare: ["src/a.ts"] });
  const run = drive(without, Object.keys(files));
  assert.equal(run.status, 0, run.stderr);
  assert.deepEqual(fs.readdirSync(path.join(without, "out")).sort(), ["a.d.ts", "a.js"]);

  const withJs = library(files, { ...BASE, allowJs: true }, { declare: ["src/a.ts", "src/legacy.js"] });
  assert.equal(drive(withJs, Object.keys(files)).status, 0);
  assert.ok(fs.existsSync(path.join(withJs, "out/legacy.js")));
});

test("a JSON module is copied when the tsconfig resolves them", () => {
  const files = { "src/a.ts": "export {};\n", "src/data.json": '{"n": 1}\n' };
  const dir = library(files, { ...BASE, resolveJsonModule: true }, { declare: ["src/a.ts"] });
  const run = drive(dir, Object.keys(files));
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.read("data.json"), '{"n": 1}\n');
});

test("a source map names its file and the path back to the source", () => {
  const dir = library({ "src/deep/a.ts": "export const a = 1;\n" }, BASE);
  const run = drive(dir, ["src/deep/a.ts"], ["--source-map"]);
  assert.equal(run.status, 0, run.stderr);
  const map = JSON.parse(run.read("deep/a.js.map"));
  assert.equal(map.file, "a.js");
  assert.deepEqual(map.sources, ["../../src/deep/a.ts"]);
  // Not asked for by inlineSources, so not shipped.
  assert.equal(map.sourcesContent, undefined);
  assert.match(run.read("deep/a.js"), /\n\/\/# sourceMappingURL=a\.js\.map\n$/);
});

// What follows the adapter's first line: the module as the driver wrote it.
const body = (text) => text.slice(text.indexOf("\n") + 1);

test("an ES module's relative imports name the files they mean", () => {
  const files = {
    "src/main.ts": [
      'import { a } from "./a";',
      'import { view } from "./ui/view";',
      'export * from "./parts";',
      "export { deep } from '../src/parts/deep';",
      'import "./effect";',
      'const lazy = () => import("./a");',
      "export { a, view, lazy };",
      "",
    ].join("\n"),
    "src/a.ts": "export const a = 1;\n",
    "src/effect.ts": "export {};\n",
    "src/ui/view.tsx": 'import { a } from "../a";\nexport const view = a;\n',
    "src/parts/index.ts": 'export { deep } from "./deep";\n',
    "src/parts/deep.ts": "export const deep = 2;\n",
  };
  const run = drive(library(files, BASE), Object.keys(files));
  assert.equal(run.status, 0, run.stderr);
  assert.equal(
    body(run.read("main.js")),
    [
      'import { a } from "./a.js";',
      'import { view } from "./ui/view.js";',
      // A directory is its index.
      'export * from "./parts/index.js";',
      "export { deep } from './parts/deep.js';",
      'import "./effect.js";',
      'const lazy = () => import("./a.js");',
      "export { a, view, lazy };",
      "",
    ].join("\n"),
  );
  assert.equal(body(run.read("ui/view.js")), 'import { a } from "../a.js";\nexport const view = a;\n');
  assert.equal(body(run.read("parts/index.js")), 'export { deep } from "./deep.js";\n');
});

test("only an import of a source being emitted is changed", () => {
  const source = [
    'import pkg from "some-package";',
    'import sub from "@scope/pkg/sub";',
    'import styles from "./styles.css";',
    'import already from "./a.js";',
    'import data from "./data.json";',
    'import ghost from "./not-a-source";',
    // Not imports: a string, a comment and a template that read like one.
    'const text = "import x from \'./a\'"; // import y from "./a"',
    'const tpl = `import z from "./a"`;',
    "const computed = (name) => import(name);",
    "export { pkg, sub, styles, already, data, ghost, text, tpl, computed };",
    "",
  ].join("\n");
  const files = { "src/main.ts": source, "src/a.ts": "export default 1;\n" };
  const run = drive(library(files, BASE), Object.keys(files));
  assert.equal(run.status, 0, run.stderr);
  assert.equal(body(run.read("main.js")), source);
});

test("a file outranks a directory of the same name, as the compiler resolves it", () => {
  const files = {
    "src/main.ts": 'export * from "./thing";\n',
    "src/thing.ts": "export const from = 'file';\n",
    "src/thing/index.ts": "export const from = 'directory';\n",
  };
  const run = drive(library(files, BASE), Object.keys(files));
  assert.equal(run.status, 0, run.stderr);
  assert.equal(body(run.read("main.js")), 'export * from "./thing.js";\n');
});

test("an import names the extension its target was emitted with", () => {
  // Preserved JSX is emitted as .jsx, so that is the file to name.
  const files = { "src/main.ts": 'export * from "./view";\n', "src/view.tsx": "export const v = 1;\n" };
  const run = drive(library(files, { ...BASE, jsx: "preserve" }), Object.keys(files));
  assert.equal(run.status, 0, run.stderr);
  assert.equal(body(run.read("main.js")), 'export * from "./view.jsx";\n');
});

test("CommonJS is left as written: require resolves an extension itself", () => {
  const files = { "src/main.ts": 'import { a } from "./a";\nexport { a };\n', "src/a.ts": "export const a = 1;\n" };
  const run = drive(library(files, { ...BASE, module: "commonjs" }), Object.keys(files));
  assert.equal(run.status, 0, run.stderr);
  assert.equal(body(run.read("main.js")), 'import { a } from "./a";\nexport { a };\n');
});

test("refuses a tsconfig without isolatedModules", () => {
  const dir = library({ "src/a.ts": "export {};\n" }, { target: "es2022", module: "esnext" });
  refused(drive(dir, ["src/a.ts"]), /isolatedModules/);
  assert.ok(!fs.existsSync(path.join(dir, "out/a.js")));
});

test("refuses a tsconfig that leaves target or module to the compiler's default", () => {
  refused(drive(library({ "src/a.ts": "" }, { module: "esnext", isolatedModules: true }), ["src/a.ts"]), /must set "target"/);
  refused(drive(library({ "src/a.ts": "" }, { target: "es2022", isolatedModules: true }), ["src/a.ts"]), /must set "module"/);
});

test("refuses an option that changes emitted JavaScript and the adapter does not implement", () => {
  const dir = library({ "src/a.ts": "export {};\n" }, { ...BASE, emitDecoratorMetadata: true });
  refused(drive(dir, ["src/a.ts"]), /echo does not implement compilerOptions\.emitDecoratorMetadata/);
});

test("an option left at the value that asks for nothing is not a request", () => {
  const dir = library({ "src/a.ts": "export {};\n" }, { ...BASE, emitDecoratorMetadata: false, newLine: "lf", strict: true });
  assert.equal(drive(dir, ["src/a.ts"]).status, 0);
});

test("refuses a source the compiler emitted no declaration for", () => {
  const files = { "src/a.ts": "export {};\n", "src/unchecked.ts": "export {};\n" };
  const dir = library(files, BASE, { declare: ["src/a.ts"] });
  refused(drive(dir, Object.keys(files)), /src\/unchecked\.ts is in srcs/, /nothing type-checked/);
});

test("refuses a source outside the root", () => {
  const dir = library({ "src/a.ts": "export {};\n", "elsewhere/b.ts": "export {};\n" }, BASE, { declare: ["src/a.ts"] });
  refused(drive(dir, ["src/a.ts", "elsewhere/b.ts"]), /elsewhere\/b\.ts is outside the root/);
});

test("under a node module setting, the package's type must be what the compiler sees", () => {
  const options = { ...BASE, module: "nodenext" };
  const source = { "src/a.ts": "export {};\n" };
  const esm = { ...source, "package.json": '{"type": "module"}\n' };
  const declared = { declare: ["src/a.ts"] };

  // An ES module package: the compiler sees the package.json, the rule says
  // module_type, and they agree.
  const agreed = drive(library(esm, options, declared), ["src/a.ts"], ["--module-type", "module"]);
  assert.equal(agreed.status, 0, agreed.stderr);
  assert.match(agreed.read("a.js"), /^\/\/ esm /);

  // The package.json says module and the rule does not.
  refused(drive(library(esm, options, declared), ["src/a.ts"]), /checks it as "module"/, /module_type/);

  // The rule says module and no package.json is staged, so the compiler
  // checked CommonJS: it would have passed an import node's ES modules refuse.
  refused(
    drive(library(source, options), ["src/a.ts"], ["--module-type", "module"]),
    /checks it as "commonjs"/,
    /no package\.json is staged/,
  );
});

test("refuses a module that is not an adapter", () => {
  const dir = library({ "src/a.ts": "export {};\n" }, BASE);
  refused(drive(dir, ["src/a.ts"], [], DRIVER), /is not a transpiler adapter/);
});

// The two this plugin ships, run from their ts_transpiler directories exactly
// as ts_library runs them.
test("esbuild refuses emitDecoratorMetadata, which it cannot implement, and swc accepts it", () => {
  const source = "function d(_t: object, _k: string): void {}\nexport class A {\n  @d\n  name: string = \"a\";\n}\n";
  const options = { ...BASE, experimentalDecorators: true, emitDecoratorMetadata: true };

  const esbuild = drive(library({ "src/a.ts": source }, options), ["src/a.ts"], [path.join(HERE, "esbuild")], null);
  refused(esbuild, /esbuild does not implement compilerOptions\.emitDecoratorMetadata/);

  const swc = drive(library({ "src/a.ts": source }, options), ["src/a.ts"], [path.join(HERE, "swc")], null);
  assert.equal(swc.status, 0, swc.stderr);
  assert.match(swc.read("a.js"), /design:type/);
});
