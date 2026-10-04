subinclude("//build_defs:ts", "///js//build_defs:js")

# Four emitters, one set of sources, one test.
#
# tsgo (TypeScript 7) and tsc 5.9 are compilers: each type-checks and writes
# the JavaScript itself. esbuild and swc are transpilers: the compiler still
# type-checks, and they write the JavaScript, a file at a time and reading no
# types. All four are ts_library targets, differing only in `compiler` and
# `transpiler`. The fixtures under src/ are the constructs where emitters have
# reason to differ, and each emitter's output is loaded under node, as ES
# modules and as CommonJS, and held to the same behaviour.
#
# The comparison is a set of tests rather than a table in a README so that it
# is true of the versions pinned here, and stops being green when it stops
# being true.
_SRCS = glob([
    "src/*.ts",
    "src/*.tsx",
])

_PKG = package_name()

# compiler tree, transpiler, tsconfig.
_EMITTERS = {
    "tsgo": ("//third_party/js:compiler", "tsc", "tsconfig.json"),
    "tsc5": ("//third_party/js/tsc5:node_modules", "tsc", "tsconfig.json"),
    # esbuild writes no decorator metadata and the rule refuses to pretend
    # otherwise, so its tsconfig is the shared one with the option off.
    "esbuild": ("//third_party/js:compiler", "esbuild", "tsconfig.esbuild.json"),
    "swc": ("//third_party/js:compiler", "swc", "tsconfig.json"),
}

# CommonJS the way a library gets it today: nodenext resolution and no
# "type": "module".
_FORMAT_ARGS = {
    "esm": [],
    "cjs": [
        "--module",
        "nodenext",
        "--moduleResolution",
        "nodenext",
    ],
}

for fmt, args in _FORMAT_ARGS.items():
    for emitter, how in _EMITTERS.items():
        compiler, transpiler, tsconfig = how

        ts_library(
            name = f"{emitter}_{fmt}",
            package = f"@test/emit-{emitter}-{fmt}",
            srcs = _SRCS,
            args = args,
            compiler = compiler,
            module_type = "module" if fmt == "esm" else "",
            root = _PKG + "/src",
            test_only = True,
            transpiler = transpiler,
            tsconfig = tsconfig,
            tsconfig_deps = [] if tsconfig == "tsconfig.json" else ["tsconfig.json"],
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
        "tsgo": ["//third_party/js:compiler"],
        "tsc5": ["//third_party/js/tsc5:node_modules"],
        "esbuild": ["//tools/transpile:esbuild"],
        "swc": ["//tools/transpile:swc"],
    },
    outs = ["timings.md"],
    cmd = " && ".join([
        'NODE=$(readlink -f "$TOOLS_NODE")',
        '"$NODE" "$SRCS_SCRIPT" "$OUT" "$TMP_DIR/$SRCS_TSGO" "$TMP_DIR/$SRCS_TSC5" "$TMP_DIR/$SRCS_ESBUILD" "$TMP_DIR/$SRCS_SWC"',
    ]),
    labels = ["manual"],
    test_only = True,
    tools = {"node": [CONFIG.JS.NODE_TOOL]},
)
