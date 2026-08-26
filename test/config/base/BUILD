subinclude("//build_defs:ts")

# The shared base as a target. Nothing below repeats its path into rules;
# they depend on this and their own tsconfig's extends does the rest.
ts_config(
    name = "base",
    src = "tsconfig.base.json",
    visibility = ["//test/config/..."],
)
