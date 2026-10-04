subinclude("//build_defs:ts", "///js//build_defs:js")

# What ts_library runs to write a library's JavaScript with a transpiler: the
# driver every transpiler shares, and the two this plugin ships. A ts_transpiler
# is an adapter module beside the tree holding its tool; a repo adds its own
# the same way, and names it as a target.
build_rule(
    name = "driver",
    srcs = {
        "driver": ["driver.mjs"],
        "tree": ["//third_party/js/lexer:node_modules"],
    },
    # The driver beside the tree its own import resolves through: the lexer it
    # finds import specifiers with.
    outs = ["driver"],
    cmd = " && ".join([
        'mkdir "$OUT"',
        'cp "$SRCS_DRIVER" "$OUT/driver.mjs"',
        'cp -R "$SRCS_TREE" "$OUT/node_modules"',
    ]),
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
        "testdata/echo.mjs",
        ":driver",
        ":esbuild",
        ":swc",
    ],
)
