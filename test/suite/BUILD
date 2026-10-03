subinclude("//build_defs:ts")

# A suite: .test.ts files on node's own test runner, compiled and type-checked
# like a library, each test reported by name. The tests import the library
# under test by package name and a helper by relative path; never_run.ts is
# compiled but is not a *.test file, and throws if it is ever run. Nothing is
# installed: node:test's types come from the NodeTypes config.
ts_test(
    name = "suite_test",
    srcs = [
        "greeting.test.ts",
        "helper.ts",
        "nested/times.test.ts",
        "never_run.ts",
    ],
    tsconfig_deps = ["//:tsconfig.json"],
    deps = ["//test/greeter"],
)
