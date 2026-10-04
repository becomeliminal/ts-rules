subinclude("///js//build_defs:js")

# ESLint over this repository's own JavaScript and TypeScript: `plz lint`.
# The tree is js-rules', so the plugins lint themselves with one pin.
js_binary(
    name = "eslint",
    srcs = ["eslint.config.mjs"],
    chdir = ".",
    node_modules = "///js//third_party/js/eslint:node_modules",
    runner = "eslint",
    runner_args = [
        "--config",
        "$RUNDIR/eslint.config.mjs",
        "--max-warnings",
        "0",
    ],
)
