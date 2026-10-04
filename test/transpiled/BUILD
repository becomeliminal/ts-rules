subinclude("//build_defs:ts", "///js//build_defs:js")

# ts_library with a transpiler, held to what the compiler's own output is held
# to elsewhere in test/: a JavaScript file and a JSON module in the package, a
# first-party dependency, a source map that locates its source, and a ts_test
# suite. //test/emit compares what the emitters write; this is the rule around
# them.
ts_library(
    name = "lib",
    package = "@test/transpiled",
    srcs = [
        "index.ts",
        "legacy.js",
        "limits.json",
    ],
    source_map = True,
    transpiler = "esbuild",
    tsconfig_deps = ["//:tsconfig.json"],
    deps = ["//test/greeter"],
)

# A repo's own transpiler: an adapter and the tree holding its tool. Named by
# label where the plugin's are named by word.
ts_transpiler(
    name = "transpile_module",
    adapter = "transpile_module.mjs",
    node_modules = "//third_party/js/tsc5:node_modules",
)

ts_library(
    name = "custom",
    package = "@test/transpiled-custom",
    srcs = ["double.ts"],
    entry = "double.ts",
    transpiler = ":transpile_module",
    tsconfig_deps = ["//:tsconfig.json"],
)

js_test(
    name = "transpiled_test",
    srcs = ["transpiled.test.js"],
    data = [
        ":custom",
        ":lib",
    ],
    deps = [
        ":custom",
        ":lib",
        "//test/greeter",
    ],
)

ts_test(
    name = "suite_test",
    srcs = ["suite.test.ts"],
    transpiler = "esbuild",
    tsconfig_deps = ["//:tsconfig.json"],
    deps = [
        ":lib",
        "//test/greeter",
    ],
)
