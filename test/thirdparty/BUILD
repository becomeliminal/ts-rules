subinclude("//build_defs:ts")

# The half of the two-tree design the compiler tree cannot exercise: sources
# resolving a third-party package's types, from a tree that is not the one the
# compiler itself lives in.
ts_library(
    name = "thirdparty",
    package = "@test/thirdparty",
    srcs = ["index.ts"],
    tsconfig_deps = ["//:tsconfig.json"],
    node_modules = "//third_party/js:consumer",
    visibility = ["//test/..."],
)
