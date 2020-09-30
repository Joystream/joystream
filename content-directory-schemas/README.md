### Content directory json schemas and inputs

#### Working in `VSCode`
1. Create `.vscode` folder inside your monorepo working directory (if doesn't already exist)
1. Copy `vscode-recommended.settings.json` into `.vscode` directory and rename it to `settings.json` (or merge it with the exsisting `settings.json`)
1. Get the benefit of live-validation of files inside `inputs`! (you must follow the `*Class.json`, `*Schema.json`, `*{EntityName}Batch` naming pattern)

#### Validate via CLI
Run `yarn workspace cd-schemas validate` or `yarn validate` (if inside `content-directory-schemas`) to validate json schemas and inputs inside the `/inputs` directory.
