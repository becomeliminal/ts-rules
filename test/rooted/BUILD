subinclude("//build_defs:ts", "///js//build_defs:js")

# A config that declares rootDir, agreeing with the rule: the validator lets
# it through, and src/index.ts emits as index.js rather than src/index.js.
ts_library(
    name = "rooted",
    package = "@test/rooted",
    root = "test/rooted/src",
    srcs = ["src/index.ts"],
    tsconfig = "tsconfig.json",
    tsconfig_deps = ["//:tsconfig.json"],
)

js_test(
    name = "rooted_test",
    srcs = ["check_rooted.test.js"],
    deps = [":rooted"],
)
