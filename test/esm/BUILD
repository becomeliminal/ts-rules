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

# The other half of the entry-shim claim. The shim is always ESM, and hello_test
# in //test/binary shows it importing a CommonJS package; this shows the same
# shim importing a module one, which is the case that would break if the rule
# ever grew a branch on module type.
ts_library(
    name = "esm_check",
    package = "@test/esm-check",
    srcs = ["check.ts"],
    entry = "check.ts",
    tsconfig = "tsconfig.check.json",
    deps = [":esm"],
    module_type = "module",
    args = ["--module", "esnext", "--moduleResolution", "bundler"],
    test_only = True,
    node_modules = "//third_party/js:consumer",
    tsconfig_deps = ["//:tsconfig.json"],
)

ts_test(
    name = "esm_ts_test",
    lib = ":esm_check",
)
