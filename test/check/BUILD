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
