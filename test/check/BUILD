subinclude("//build_defs:ts")

# An application's sources, checked against a first-party library's generated
# declarations. This is the target a bundler cannot replace: esbuild strips
# types without reading them, so without this a type error in an application
# reaches production having failed no build.
ts_check(
    name = "check",
    srcs = ["app.ts"],
    # Narrowed to the declarations on purpose: checking reads .d.ts, never the
    # runtime .js, so an edit to greeter's implementation should leave this
    # target cached. The matching test below proves the narrowing resolves.
    deps = ["//test/greeter|types"],
    tsconfig_deps = ["//:tsconfig.json"],
)

# The native checker has the same target contract as the compiler tree.
ts_check(
    name = "bun_check",
    compiler = "///node//third_party/bun:bun|bun",
    srcs = ["app.ts"],
    deps = ["//test/greeter|types"],
    tsconfig_deps = ["//:tsconfig.json"],
)

# CI builds these targets expecting failure, proving both compiler paths propagate
# type errors and reject a source omitted by the TypeScript project config.
ts_check(
    name = "tsgo_error",
    srcs = ["error.ts"],
    tsconfig = "tsconfig.error.json",
    tsconfig_deps = ["//:tsconfig.json"],
)

ts_check(
    name = "bun_error",
    compiler = "///node//third_party/bun:bun|bun",
    srcs = ["error.ts"],
    tsconfig = "tsconfig.error.json",
    tsconfig_deps = ["//:tsconfig.json"],
)

ts_check(
    name = "tsgo_omitted",
    srcs = ["app.ts", "omitted.ts"],
    deps = ["//test/greeter|types"],
    tsconfig = "tsconfig.omitted.json",
    tsconfig_deps = ["//:tsconfig.json"],
)

ts_check(
    name = "bun_omitted",
    compiler = "///node//third_party/bun:bun|bun",
    srcs = ["app.ts", "omitted.ts"],
    deps = ["//test/greeter|types"],
    tsconfig = "tsconfig.omitted.json",
    tsconfig_deps = ["//:tsconfig.json"],
)
