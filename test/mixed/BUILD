subinclude("//build_defs:ts", "///js//build_defs:js")

# A repo mid-migration: mostly JavaScript, some TypeScript, one library.
ts_library(
    name = "mixed",
    package = "@test/mixed",
    srcs = [
        "index.ts",
        "legacy.js",
    ],
    tsconfig_deps = ["//:tsconfig.json"],
)

js_test(
    name = "mixed_test",
    srcs = ["mixed.test.js"],
    deps = [":mixed"],
)
