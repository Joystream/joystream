// A script to be executed post query-node install, that may include workarounds in Hydra node_modules
import path from 'path'
import { replaceInFile } from './utils'

// FIXME: Temporarly remove broken sanitizeNullCharacter call
const subscribersJsPath = path.resolve(
  __dirname,
  '../../../node_modules/@joystream/hydra-processor/lib/db/subscribers.js'
)
replaceInFile({
  filePath: subscribersJsPath,
  regex: /sanitizeNullCharacter\(entity, field\);/g,
  newContent: '//sanitizeNullCharacter(entity, field)',
})

// FIXME: Temporarly replace broken relations resolution in @joystream/warthog
const dataLoaderJsPath = path.resolve(
  __dirname,
  '../../../node_modules/@joystream/warthog/dist/middleware/DataLoaderMiddleware.js'
)
replaceInFile({
  filePath: dataLoaderJsPath,
  regex: /return context\.connection\.relationIdLoader[\s\S]+return group\.related;\s+\}\);\s+\}\)/,
  newContent: `return Promise.all(
    entities.map(entity => context.connection.relationLoader.load(relation, entity))
  ).then(function (results) {
    return results.map(function (related) {
      return (relation.isManyToOne || relation.isOneToOne) ? related[0] : related
    })
  })`,
})

// FIXME: Temporary fix for "table name x specified more than once"
const baseServiceJsPath = path.resolve(__dirname, '../../../node_modules/@joystream/warthog/dist/core/BaseService.js')
replaceInFile({
  filePath: baseServiceJsPath,
  regex: /function common\(parameters, localIdColumn, foreignTableName, foreignColumnMap, foreignColumnName\) \{[^}]+\}/,
  newContent: `function common(parameters, localIdColumn, foreignTableName, foreignColumnMap, foreignColumnName) {
    const uuid = require('uuid/v4')
    const foreignTableAlias = uuid().replace('-', '')
    var foreingIdColumn = "\\"" + foreignTableAlias + "\\".\\"" + foreignColumnMap[foreignColumnName] + "\\"";
    parameters.topLevelQb.leftJoin(foreignTableName, foreignTableAlias, localIdColumn + " = " + foreingIdColumn);
    addWhereCondition(parameters, foreignTableAlias, foreignColumnMap);
  }`,
})
