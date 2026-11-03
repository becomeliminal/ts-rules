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

# A configured source with a type error must fail under either compiler.
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
    name = "tsgo_extra_input",
    srcs = ["app.ts", "error.ts"],
    deps = ["//test/greeter|types"],
    # error.ts is an action input, but is excluded from this TS project.
    tsconfig = "tsconfig.extra-input.json",
    tsconfig_deps = ["//:tsconfig.json"],
)

ts_check(
    name = "bun_extra_input",
    compiler = "///node//third_party/bun:bun|bun",
    srcs = ["app.ts", "error.ts"],
    deps = ["//test/greeter|types"],
    tsconfig = "tsconfig.extra-input.json",
    tsconfig_deps = ["//:tsconfig.json"],
)
