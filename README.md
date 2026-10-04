# ts-rules

TypeScript rules for the [Please](https://please.build) build system.

Layer 2 of a four-layer stack:

| layer | repo | provides |
|---|---|---|
| 0 | [node-rules](https://github.com/becomeliminal/node-rules) | a pinned, hermetic node |
| 1 | [js-rules](https://github.com/becomeliminal/js-rules) | packages, `node_modules`, running programs |
| 2 | **ts-rules** | compiling and type-checking TypeScript |
| 3 | [js-bundler-rules](https://github.com/becomeliminal/js-bundler-rules) | esbuild, vite, rollup, webpack, terser |

## The shape

`ts_library` is a peer of `js_library`, not something js-rules knows about: it
emits the same package-shaped output (`pkg/` plus a manifest), so a
`js_binary` consumes compiled TypeScript without knowing TypeScript was
involved. The compiler resolves first-party dependencies through the same
`node_modules` node will, reading their generated `.d.ts` rather than their
sources -- which is the point of emitting declarations at all.

Outputs are split per concern: `|pkg` carries the runtime JavaScript, `|types`
carries the declarations and their maps in a package-shaped twin. Please
invalidates per output, so a `ts_check` narrowed to `:lib|types` does not
re-run when only implementation changed -- measured, not assumed.

`ts_check` type-checks an application's sources against its dependencies'
declarations and emits nothing. It exists because bundlers will not do it:
esbuild (and therefore vite) strips types without reading them, so without an
explicit check edge a type error reaches production having failed no build.
The check and the bundle stay separate actions on purpose -- a type error is
not a reason to invalidate a bundle's cache, and an asset change is not a
reason to type-check again.

`ts_config` makes a tsconfig a target that carries its `extends` chain: one
target per config, each file staying in its own package, the chain riding
deps. Consumers write `tsconfig = ":tsconfig"` and carry no knowledge of the
chain.

`ts_test` with `srcs` is a suite: `.test.ts` files written against node's own
test runner (`node:test`, `node:assert`), compiled and type-checked like a
library and run by js-rules' `js_test`, which reports each test by name. The
tests import the library under test by package name, through `deps`.
Nothing is installed: the runner is part of the node runtime, and its types
come from the `NodeTypes` config, as the compiler comes from `Compiler`. With
`lib` instead, a compiled library runs as a program and passes if it exits
cleanly.

## Guard rails

Two flags the rule mirrors over the config -- `rootDir` and `outDir` -- are
validated against the *resolved* config (extends chain included) before
anything compiles. The command line wins over the config, so a disagreement
would otherwise be silently ignored, and the wrong emitted path is import
paths inside `node_modules`. A mismatch fails naming both resolved paths and
who wins.

`root` is passed explicitly rather than inferred, because tsc otherwise
derives it from the common prefix of its inputs -- so adding one file at the
top of a package would shift every emitted path, and therefore every import
path, months after it last worked.

## Compilers

The compiler lives in its own `node_modules` tree, separate from the code
under compilation, so the compiler's dependencies never leak into the
application graph -- and so one repo can run TypeScript 7 (tsgo) and
TypeScript 5.x side by side. Both are tested here; the `Compiler` config key
selects per repo or per rule.

## Emitters, compared

A compiler that type-checks also writes JavaScript, and it is not the only
thing that can. `test/emit` holds the comparison as tests: the same sources
emitted by tsgo (TypeScript 7), tsc 5.9, esbuild and swc, as ES modules and as
CommonJS, each loaded under node and held to the same behaviour. What it
establishes, for the versions pinned here:

- tsgo and tsc 5.9 write byte-identical JavaScript.
- esbuild and swc mark an `enum` as free of side effects, so a bundler drops
  one nobody uses. tsgo and tsc do not.
- tsgo, tsc and swc write decorator metadata (`emitDecoratorMetadata`).
  esbuild accepts the option and writes none.
- Class fields, import elision, CommonJS interop and JSX behave the same under
  all four.

`ts_library` compiles with tsgo or tsc. Nothing here makes esbuild or swc its
emitter; the suite is the evidence for deciding whether something should.

What each costs is a report rather than a test, since a duration is a
measurement:

```sh
plz build //test/emit:timings && cat plz-out/gen/test/emit/timings.md
```

esbuild and swc each have a hash-pinned tree under `third_party/js`,
regenerated like any other (`plz run //third_party/js:update-swc`). swc's is
used through `//third_party/js:swc_modules`, which unpacks its native addon:
from 1.16.12 swc ships the addon compressed and unpacks it into a per-user
cache at load, which a build action does not have. `unpack_swc.mjs` has the
detail.

## Where to look

The tests are the living documentation: source maps, declaration maps,
generate_trace, allowJs, JSON modules, mixed js/ts packages, the shared-base
ts_config arrangement, and the rootDir failure mode all have fixtures under
`test/`. `plz test //...` runs them all.
