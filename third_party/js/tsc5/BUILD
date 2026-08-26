subinclude("///js//build_defs:npm")

npm_repo(
    name = "typescript_5.9.3",
    hashes = ["10e108c9cf7d5f2879053dff18515fb405abf2ccef63eaaf017d9c571687a1d3"],
    pkg = "typescript",
    version = "5.9.3",
)

npm_link(
    name = "node_modules",
    lock = "pnpm-lock.yaml",
    packages = [":typescript_5.9.3"],
    visibility = ["PUBLIC"],
)
