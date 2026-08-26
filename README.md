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

## Where to look

The tests are the living documentation: source maps, declaration maps,
generate_trace, allowJs, JSON modules, mixed js/ts packages, the shared-base
ts_config arrangement, and the rootDir failure mode all have fixtures under
`test/`. `plz test //...` runs them all.
