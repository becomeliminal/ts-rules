subinclude("//build_defs:ts")

# An application's sources, checked against a first-party library's generated
# declarations. This is the target a bundler cannot replace: esbuild strips
# types without reading them, so without this a type error in an application
# reaches production having failed no build.
ts_check(
    name = "check",
    srcs = ["app.ts"],
    deps = ["//test/greeter"],
    tsconfig_deps = ["//:tsconfig.json"],
)
