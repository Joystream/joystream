### Content directory json schemas and inputs
#### Working in `VSCode`
1. Create `.vscode` folder inside your working directory (if doesn't already exist)
1. Copy `vscode-recommended.settings.json` into `.vscode` directory and rename it to `settings.json` (or merge it with the exsisting `settings.json`)
1. If your working directory is not `content-directory-schema`, modify the `"url"` properties under `"json.schemas"` to match the relative paths from your working directory (ie. if inside root monorepo directory, you will need to add `/content-directory-schema`)
1. Get the benefit of live-validation of files inside `inputs`! (you must follow the `*Class.json`, `*Schema.json` naming pattern)
