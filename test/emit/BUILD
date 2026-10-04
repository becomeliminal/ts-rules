subinclude("//build_defs:ts", "///js//build_defs:js")

# Four emitters, one set of sources, one test.
#
# tsgo (TypeScript 7) and tsc 5.9 are the compilers ts_library runs. esbuild
# and swc are what would write a library's JavaScript if a type-checker only
# checked it: they read one file at a time and no types. The fixtures under
# src/ are the constructs where emitters have reason to differ, and each
# emitter's output is loaded under node, as ES modules and as CommonJS, and
# held to the same behaviour.
#
# The comparison is a set of tests rather than a table in a README so that it
# is true of the versions pinned here, and stops being green when it stops
# being true.
_SRCS = glob([
    "src/*.ts",
    "src/*.tsx",
])

_PKG = package_name()

_ROOT = _PKG + "/src"

# What ts_library compiles with, and its tree.
_COMPILERS = {
    "tsgo": "//third_party/js:compiler",
    "tsc5": "//third_party/js/tsc5:node_modules",
}

# The per-file emitters, each driven through its API by emit.mjs from its own
# hash-pinned tree.
_TRANSPILERS = {
    "esbuild": "//third_party/js/esbuild:node_modules",
    "swc": "//third_party/js:swc_modules",
}

# CommonJS the way a library gets it today: nodenext resolution and no
# "type": "module".
_COMPILER_ARGS = {
    "esm": [],
    "cjs": [
        "--module",
        "nodenext",
        "--moduleResolution",
        "nodenext",
    ],
}

for fmt in [
    "esm",
    "cjs",
]:
    for emitter, tree in _COMPILERS.items():
        ts_library(
            name = f"{emitter}_{fmt}",
            package = f"@test/emit-{emitter}-{fmt}",
            srcs = _SRCS,
            args = _COMPILER_ARGS[fmt],
            compiler = tree,
            module_type = "module" if fmt == "esm" else "",
            root = _ROOT,
            test_only = True,
            # interop.ts imports node:path.
            type_roots = ["//third_party/js:node_types"],
        )

        js_test(
            name = f"{emitter}_{fmt}_test",
            srcs = ["emit.test.mjs"],
            data = [f":{emitter}_{fmt}"],
            env = {
                "EMIT_DIR": f"{_PKG}/{emitter}_{fmt}/pkg",
                "EMITTER": emitter,
                "FORMAT": fmt,
            },
        )

    for emitter, tree in _TRANSPILERS.items():
        build_rule(
            name = f"{emitter}_{fmt}",
            srcs = {
                "srcs": _SRCS,
                "driver": ["emit.mjs"],
                "config": ["tsconfig.json"],
                "tree": [tree],
            },
            outs = [f"{emitter}_{fmt}"],
            # The driver beside its tool's tree, so its imports resolve the
            # way any program's do.
            cmd = " && ".join([
                'NODE=$(readlink -f "$TOOLS_NODE")',
                'mkdir _tool && cp "$SRCS_DRIVER" _tool/ && cp -R "$SRCS_TREE" _tool/node_modules',
                f'"$NODE" _tool/emit.mjs {emitter} {fmt} "$SRCS_CONFIG" {_ROOT} "$OUT" $SRCS_SRCS',
            ]),
            test_only = True,
            tools = {"node": [CONFIG.JS.NODE_TOOL]},
        )

        js_test(
            name = f"{emitter}_{fmt}_test",
            srcs = ["emit.test.mjs"],
            data = [f":{emitter}_{fmt}"],
            env = {
                "EMIT_DIR": f"{_PKG}/{emitter}_{fmt}",
                "EMITTER": emitter,
                "FORMAT": fmt,
            },
        )

js_test(
    name = "identical_test",
    srcs = ["identical.test.mjs"],
    data = [
        ":tsc5_cjs",
        ":tsc5_esm",
        ":tsgo_cjs",
        ":tsgo_esm",
    ],
    env = {"EMIT_ROOT": _PKG},
)

# What each emitter costs, as a report:
#   plz build //test/emit:timings && cat plz-out/gen/test/emit/timings.md
# A build output rather than a test, because a duration is a measurement, not
# an assertion: it varies by machine, and a threshold would only be a flake.
# `manual`, so //... does not spend the seconds unless someone asks.
build_rule(
    name = "timings",
    srcs = {
        "script": ["timings.mjs"],
        "driver": ["emit.mjs"],
        "tsgo": [_COMPILERS["tsgo"]],
        "tsc5": [_COMPILERS["tsc5"]],
        "esbuild": [_TRANSPILERS["esbuild"]],
        "swc": [_TRANSPILERS["swc"]],
    },
    outs = ["timings.md"],
    cmd = " && ".join([
        'NODE=$(readlink -f "$TOOLS_NODE")',
        # Each transpiler's driver beside its own tree, as the emit rules
        # above stage them.
        'for t in esbuild swc; do mkdir -p _tools/$t && cp "$SRCS_DRIVER" _tools/$t/; done',
        'cp -R "$SRCS_ESBUILD" _tools/esbuild/node_modules',
        'cp -R "$SRCS_SWC" _tools/swc/node_modules',
        '"$NODE" "$SRCS_SCRIPT" "$OUT" "$SRCS_DRIVER" "$TMP_DIR/$SRCS_TSGO" "$TMP_DIR/$SRCS_TSC5" "$TMP_DIR/_tools"',
    ]),
    labels = ["manual"],
    test_only = True,
    tools = {"node": [CONFIG.JS.NODE_TOOL]},
)
