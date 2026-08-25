subinclude("//build_defs:ts")

ts_library(
    name = "hello",
    package = "@test/hello",
    srcs = [
        "cli.ts",
        "index.ts",
    ],
    tsconfig_deps = ["//:tsconfig.json"],
    node_modules = "//third_party/js:consumer",
)

# The entry is a subpath of the package rather than its default one, which is
# what a package shipping both a library and a command looks like. It resolves
# through the "./*" entry in the generated exports map.
ts_binary(
    name = "hello_bin",
    lib = ":hello",
    main = "cli.js",
)

# A second library, so the test imports the first by package name exactly as
# any other consumer would rather than reaching into its output.
ts_library(
    name = "check",
    package = "@test/check",
    srcs = ["check.ts"],
    entry = "check.ts",
    deps = [":hello"],
    test_only = True,
    tsconfig_deps = ["//:tsconfig.json"],
    node_modules = "//third_party/js:consumer",
)

ts_test(
    name = "hello_test",
    lib = ":check",
)
