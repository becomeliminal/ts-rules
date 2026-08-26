subinclude("//build_defs:ts")

# Two packages, two files named tsconfig.json, one shared base -- the exact
# arrangement that broke the deleted filegroup version of this rule. Each
# config is its own target in its own package, so nothing flattens and
# nothing collides.
ts_config(
    name = "tsconfig",
    deps = ["//test/config/base"],
)

ts_library(
    name = "imperial",
    package = "@test/imperial",
    srcs = ["index.ts"],
    tsconfig = ":tsconfig",
    visibility = ["//test/config/..."],
)
