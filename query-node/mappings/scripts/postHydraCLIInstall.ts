// A script to be executed post hydra-cli install, that may include patches for Hydra CLI
import path from 'path'
import { replaceInFile } from './utils'

// FIXME: Temporary fix for missing JOIN and HAVING conditions in search queries (Hydra)
const searchServiceTemplatePath = path.resolve(
  __dirname,
  '../../codegen/node_modules/@joystream/hydra-cli/lib/src/templates/textsearch/service.ts.mst'
)

replaceInFile({
  filePath: searchServiceTemplatePath,
  regex: /queries = queries\.concat\(generateSqlQuery\(repositories\[index\]\.metadata\.tableName, WHERE\)\);/,
  newContent:
    'queries = queries.concat(generateSqlQuery(repositories[index].metadata.tableName, qb.createJoinExpression(), WHERE, qb.createHavingExpression()));',
})

replaceInFile({
  filePath: searchServiceTemplatePath,
  regex: /const generateSqlQuery =[\s\S]+\+ where;/,
  newContent: `const generateSqlQuery = (table: string, joins: string, where: string, having: string) =>
  \`SELECT '\${table}_' || "\${table}"."id" AS unique_id FROM "\${table}" \` + joins + ' ' + where + ' ' + having;`,
})
