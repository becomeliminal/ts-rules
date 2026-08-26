subinclude("//build_defs:ts", "///js//build_defs:js")

# TypeScript 5.x, alongside the tsgo everything else here compiles with.
#
# This is what the two-tree design was built for and what nothing had tested.
# TypeScript 7 has no stable programmatic API until 7.1, so typescript-eslint,
# ts-jest, ts-morph and the Vue, Svelte and Astro checkers all still need a 5.x
# -- and one node_modules cannot hold two packages both called typescript.
#
# A consumer sets the Compiler config key instead; naming it per target is how a
# repo runs both, and how this repo tests that it can.
ts_library(
    name = "tsc5",
    package = "@test/tsc5",
    srcs = ["index.ts"],
    compiler = "//third_party/js/tsc5:node_modules",
    tsconfig_deps = ["//:tsconfig.json"],
)

js_test(
    name = "tsc5_test",
    srcs = ["tsc5.test.js"],
    deps = [":tsc5"],
)

# The other rule under the other compiler: a type error has to fail here too, or
# switching compilers would quietly stop checking.
ts_check(
    name = "typecheck",
    srcs = ["index.ts"],
    compiler = "//third_party/js/tsc5:node_modules",
    tsconfig_deps = ["//:tsconfig.json"],
)
