const typesVersion = require('@joystream/types/package.json')

const exportedScripts = {}

exportedScripts.example = require('./example.js')
exportedScripts.exportDataDirectory = require('./export-data-directory.js')
exportedScripts.injectDataObjects = require('./inject-data-objects.js')
exportedScripts.listDataDirectory = require('./list-data-directory.js')

module.exports = exportedScripts
