// A script to be executed post query-node install, that may include workarounds in Hydra node_modules
import fs from 'fs'
import path from 'path'

// FIXME: Temporarly remove broken sanitizeNullCharacter call
const subscribersJsPath = path.resolve(
  __dirname,
  '../../../node_modules/@joystream/hydra-processor/lib/db/subscribers.js'
)
const subscribersJsContent = fs.readFileSync(subscribersJsPath).toString()
fs.writeFileSync(
  subscribersJsPath,
  subscribersJsContent.replace(/sanitizeNullCharacter\(entity, field\);/g, '//sanitizeNullCharacter(entity, field)')
)

// FIXME: Temporarly replace broken relations resolution in @joystream/warthog
const dataLoaderJsPath = path.resolve(
  __dirname,
  '../../../node_modules/@joystream/warthog/dist/middleware/DataLoaderMiddleware.js'
)
const dataLoaderJsContent = fs.readFileSync(dataLoaderJsPath).toString()
const dataLoaderJsContentLines = dataLoaderJsContent.split('\n')
dataLoaderJsContentLines.splice(
  dataLoaderJsContentLines.findIndex((l) => l.match(/return context\.connection\.relationIdLoader/)),
  0,
  `return Promise.all(
    entities.map(entity => context.connection.relationLoader.load(relation, entity))
  ).then(function (results) {
    return results.map(function (related) {
      return (relation.isManyToOne || relation.isOneToOne) ? related[0] : related
    })
  })
  `
)
fs.writeFileSync(dataLoaderJsPath, dataLoaderJsContentLines.join('\n'))
