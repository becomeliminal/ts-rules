subinclude("//build_defs:ts", "///js//build_defs:js")

# No TypeScript at all. A repo can use these rules for plain JavaScript and get
# declarations and checking out of it, which is the point: js-rules is the layer
# underneath rather than something you have to reach for.
ts_library(
    name = "purejs",
    package = "@test/purejs",
    srcs = ["index.js"],
    entry = "index.js",
    tsconfig_deps = ["//:tsconfig.json"],
)

js_test(
    name = "purejs_test",
    srcs = ["purejs.test.js"],
    deps = [":purejs"],
)
