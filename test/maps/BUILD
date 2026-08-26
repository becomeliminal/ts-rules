subinclude("//build_defs:ts", "///js//build_defs:js")

ts_library(
    name = "maps",
    package = "@test/maps",
    srcs = ["index.ts"],
    declaration_map = True,
    generate_trace = True,
    source_map = True,
    tsconfig_deps = ["//:tsconfig.json"],
)

js_test(
    name = "maps_test",
    srcs = ["maps.test.js"],
    data = [":maps"],
)
