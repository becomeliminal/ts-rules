// What each emitter costs, measured through the trees pinned in this repo.
//
//   node timings.mjs <out.md> <emit.mjs> <tsgo tree> <tsc5 tree> <tool dir>
//
// Each figure is the best of seven runs of a whole process, because a build
// action is a whole process: node's startup and the tool's own are part of
// what a rule pays. Two inputs, both generated here so the measurement needs
// nothing but this file: a chain of small modules, each importing the last,
// and one large module shaped like generated API types.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [report, driver, tsgoTree, tsc5Tree, toolDir] = process.argv.slice(2);
const RUNS = 7;

function chained(dir, count) {
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < count; i++) {
    const prev = i - 1;
    fs.writeFileSync(
      path.join(dir, `m${i}.ts`),
      [
        i ? `import { type Model${prev}, make${prev} } from "./m${prev}.js";` : "",
        `export enum Kind${i} { A = "a${i}", B = "b${i}", C = "c${i}" }`,
        `export interface Model${i} { id: number; tags: string[]; kind?: Kind${i}; nested?: ${i ? `Model${prev}` : "null"} }`,
        `export type Patch${i} = Partial<Pick<Model${i}, "tags" | "kind">>;`,
        `export class Store${i}<T extends Model${i} = Model${i}> {`,
        `  private items = new Map<number, T>();`,
        `  constructor(private readonly name: string) {}`,
        `  put(item: T): this { this.items.set(item.id, item); return this; }`,
        `  get(id: number): T | undefined { return this.items.get(id); }`,
        `  patch(id: number, p: Patch${i}): T | undefined {`,
        `    const cur = this.items.get(id); if (!cur) return undefined;`,
        `    const next = { ...cur, ...p } as T; this.items.set(id, next); return next;`,
        `  }`,
        `  label(): string { return \`\${this.name}:\${this.items.size}\`; }`,
        `}`,
        `export function make${i}(seed: number): Model${i} {`,
        `  return { id: seed + ${i}, tags: [String(seed)], kind: Kind${i}.A${i ? `, nested: make${prev}(seed)` : ""} };`,
        `}`,
        "",
      ].join("\n"),
    );
  }
}

function generated(dir, count) {
  fs.mkdirSync(dir, { recursive: true });
  const blocks = [];
  for (let i = 0; i < count; i++) {
    blocks.push(
      [
        `export enum Status${i} {`,
        ...["UNSPECIFIED", "PENDING", "ACTIVE", "SUSPENDED", "CLOSED"].map(
          (s) => `  STATUS${i}_${s} = "STATUS${i}_${s}",`,
        ),
        `}`,
        `export interface Resource${i} {`,
        `  /** Format: uuid */`,
        `  id: string;`,
        `  status?: Status${i};`,
        `  amount?: string;`,
        `  createdAt?: string;`,
        `  labels?: { [key: string]: string };`,
        `  parent?: ${i ? `Resource${i - 1}` : "never"};`,
        `}`,
        `export interface List${i}Response {`,
        `  resources?: Resource${i}[];`,
        `  nextPageToken?: string;`,
        `}`,
      ].join("\n"),
    );
  }
  fs.writeFileSync(path.join(dir, "api.ts"), blocks.join("\n") + "\n");
}

const TSCONFIG = {
  compilerOptions: {
    target: "es2022",
    lib: ["es2022"],
    module: "esnext",
    moduleResolution: "bundler",
    strict: true,
    isolatedModules: true,
    skipLibCheck: true,
    declaration: true,
    types: [],
    rootDir: ".",
  },
  include: ["**/*.ts"],
};

const node = process.execPath;
const tsc = (tree) => {
  const pkg = path.join(tree, "typescript");
  return path.join(pkg, JSON.parse(fs.readFileSync(path.join(pkg, "package.json"), "utf8")).bin.tsc);
};

function best([program, ...args], cwd) {
  let fastest = Infinity;
  for (let i = 0; i < RUNS; i++) {
    const start = process.hrtime.bigint();
    execFileSync(program, args, { cwd, stdio: ["ignore", "ignore", "inherit"] });
    fastest = Math.min(fastest, Number(process.hrtime.bigint() - start) / 1e6);
  }
  return Math.round(fastest);
}

const inputs = [
  { name: "300 chained modules", dir: path.resolve("_chained"), make: (d) => chained(d, 300) },
  { name: "one generated module", dir: path.resolve("_generated"), make: (d) => generated(d, 1200) },
];
for (const input of inputs) {
  input.make(input.dir);
  fs.writeFileSync(path.join(input.dir, "tsconfig.json"), JSON.stringify(TSCONFIG));
  input.files = fs.readdirSync(input.dir).filter((f) => f.endsWith(".ts")).sort();
  input.lines = input.files.reduce((n, f) => n + fs.readFileSync(path.join(input.dir, f), "utf8").split("\n").length, 0);
}

const transpile = (tool) => (input) =>
  [node, path.join(toolDir, tool, path.basename(driver)), tool, "esm", "tsconfig.json", ".", `out-${tool}`, ...input.files];
const compile = (tree, ...flags) => () => [node, tsc(tree), "-p", "tsconfig.json", "--outDir", "out", ...flags];
// esbuild's own executable, with no node in front of it: the package for this
// platform, found beside the esbuild package that depends on it.
const esbuildBinary = () => {
  const esbuild = fs.realpathSync(path.join(toolDir, "esbuild/node_modules/esbuild"));
  const scope = path.join(path.dirname(esbuild), "@esbuild");
  const [platform] = fs.readdirSync(scope).filter((p) => fs.existsSync(path.join(scope, p, "bin/esbuild")));
  if (!platform) throw new Error(`no esbuild executable for this platform under ${scope}`);
  return path.join(scope, platform, "bin/esbuild");
};
const native = (input) => [esbuildBinary(), ...input.files, "--outdir=out-esbuild-native", "--format=esm", "--target=es2022", "--log-level=warning"];

const rows = [
  ["tsgo", "type-check, JS, declarations", compile(tsgoTree)],
  ["tsgo", "type-check, declarations", compile(tsgoTree, "--emitDeclarationOnly")],
  ["tsgo", "type-check only", compile(tsgoTree, "--noEmit")],
  ["tsc 5.9", "type-check, JS, declarations", compile(tsc5Tree)],
  ["tsc 5.9", "type-check, declarations", compile(tsc5Tree, "--emitDeclarationOnly")],
  ["esbuild", "JS only, its own executable", native],
  ["esbuild", "JS only, through its node API", transpile("esbuild")],
  ["swc", "JS only, through its node API", transpile("swc")],
  ["node", "starting, and nothing else", () => [node, "-e", "0"]],
];

const lines = [
  `| Tool | Doing | ${inputs.map((i) => `${i.name} (${i.files.length} files, ${i.lines} lines)`).join(" | ")} |`,
  `|---|---|${inputs.map(() => "---:").join("|")}|`,
  ...rows.map(([tool, doing, args]) => `| ${tool} | ${doing} | ${inputs.map((i) => `${best(args(i), i.dir)}ms`).join(" | ")} |`),
];
fs.writeFileSync(report, lines.join("\n") + "\n");
console.log(lines.join("\n"));
