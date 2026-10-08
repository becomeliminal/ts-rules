# js-rules builds its companion tool from source, so its Go plugin is needed
# here too. That is a coupling worth removing: rust-rules ships please_rust as a
# hash-pinned release download for exactly this reason, noting that a from-source
# build also fails under remote execution.
plugin_repo(
    name = "go",
    revision = "v1.31.0",
)

plugin_repo(
    name = "js",
    owner = "becomeliminal",
    plugin = "js-rules",
    revision = "3cc69ed5d50392968f3c98100063b280aeb64fd4",
)

plugin_repo(
    name = "node",
    owner = "becomeliminal",
    plugin = "node-rules",
    revision = "v0.1.0",
)
