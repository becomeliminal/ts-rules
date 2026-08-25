subinclude("//build_defs:ts", "///js//build_defs:js")

# A ts_library depending on another: the compiler resolves test/greeter through
# the same node_modules tree node will, and reads its .d.ts rather than its
# sources.
ts_library(
    name = "consumer",
    package = "@test/consumer",
    srcs = ["main.ts"],
    deps = ["//test/greeter"],
    tsconfig_deps = ["//:tsconfig.json"],
)

# The contract test: an unmodified js_binary from js-rules, consuming compiled
# TypeScript. If this holds, ts_library is a peer of js_library rather than
# something js-rules has to know about.
js_test(
    name = "consumer_test",
    entry_point = ":consumer_entry",
    deps = [":consumer", "//test/greeter"],
)

genrule(
    name = "consumer_entry",
    outs = ["consumer_main.js"],
    cmd = "echo 'require(\"@test/consumer/main.js\")' > $OUT",
)
