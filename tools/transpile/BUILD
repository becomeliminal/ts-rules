subinclude("//build_defs:ts", "///js//build_defs:js")

# What ts_library runs to write a library's JavaScript with a transpiler: the
# driver every transpiler shares, and the two this plugin ships. A ts_transpiler
# is an adapter module beside the tree holding its tool; a repo adds its own
# the same way, and names it as a target.
filegroup(
    name = "driver",
    srcs = ["driver.mjs"],
    visibility = ["PUBLIC"],
)

ts_transpiler(
    name = "esbuild",
    adapter = "esbuild.mjs",
    node_modules = "//third_party/js/esbuild:node_modules",
    visibility = ["PUBLIC"],
)

ts_transpiler(
    name = "swc",
    adapter = "swc.mjs",
    # Unpacked: swc ships its native addon in a form a build action cannot
    # load (//third_party/js:swc_modules).
    node_modules = "//third_party/js:swc_modules",
    visibility = ["PUBLIC"],
)

js_test(
    name = "driver_test",
    srcs = ["driver.test.mjs"],
    data = [
        "driver.mjs",
        "testdata/echo.mjs",
        ":esbuild",
        ":swc",
    ],
)
