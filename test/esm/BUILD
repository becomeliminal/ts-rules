subinclude("//build_defs:ts", "///js//build_defs:js")

# ESM output. The generated package.json carries type: module -- without it node
# reads the emitted export statements as CommonJS and refuses to load them.
ts_library(
    name = "esm",
    srcs = ["index.ts"],
    tsconfig_deps = ["//:tsconfig.json"],
    package = "@test/esm",
    module_type = "module",
    args = ["--module", "esnext", "--moduleResolution", "bundler"],
    visibility = ["//test/..."],
)

js_test(
    name = "esm_test",
    entry_point = "main.mjs",
    deps = [":esm"],
)

