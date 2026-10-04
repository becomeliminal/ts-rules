subinclude("//build_defs:ts", "///js//build_defs:js")

# An ES module library that node loads, written the way sources shared with a
# bundler are written: relative imports with no extension, a directory imported
# by its name. The transpile driver writes the file each one means, so one
# build of the library serves a bundler, node and a test suite alike, and the
# suite shares the library's tsconfig.
_SRCS = glob(["src/**/*.ts"])

for transpiler in [
    "esbuild",
    "swc",
]:
    ts_library(
        name = f"lib_{transpiler}",
        package = f"@test/loadable-{transpiler}",
        srcs = _SRCS,
        module_type = "module",
        root = package_name() + "/src",
        transpiler = transpiler,
    )

js_test(
    name = "loadable_test",
    srcs = ["loadable.test.mjs"],
    data = [
        "src/index.ts",
        ":lib_esbuild",
        ":lib_swc",
    ],
    deps = [
        ":lib_esbuild",
        ":lib_swc",
    ],
)

ts_test(
    name = "suite_test",
    srcs = [
        "helper.ts",
        "suite.test.ts",
    ],
    module_type = "module",
    transpiler = "esbuild",
    deps = [":lib_esbuild"],
)
