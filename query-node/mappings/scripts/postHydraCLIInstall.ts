// A script to be executed post hydra-cli install, that may include patches for Hydra CLI
import fs from 'fs'
import path from 'path'

// FIXME: Temporary fix for missing JOIN and HAVING conditions in search queries (Hydra)
const searchServiceTemplatePath = path.resolve(
  __dirname,
  '../../codegen/node_modules/@joystream/hydra-cli/lib/src/templates/textsearch/service.ts.mst'
)
const searchServiceTemplateContent = fs.readFileSync(searchServiceTemplatePath).toString()
const searchServiceTemplateContentLines = searchServiceTemplateContent.split('\n')
searchServiceTemplateContentLines.splice(
  searchServiceTemplateContentLines.findIndex((l) => l.match(/Add new query to queryString/)) + 1,
  1, // remove 1 line
  `queries = queries.concat(generateSqlQuery(repositories[index].metadata.tableName, qb.createJoinExpression(), WHERE, qb.createHavingExpression()));`
)
searchServiceTemplateContentLines.splice(
  searchServiceTemplateContentLines.findIndex((l) => l.match(/const generateSqlQuery = /)),
  3, // remove 3 lines
  `const generateSqlQuery = (table: string, joins: string, where: string, having: string) =>
    \`SELECT '\${table}_' || "\${table}"."id" AS unique_id FROM "\${table}" \` + joins + ' ' + where + ' ' + having;`
)
fs.writeFileSync(searchServiceTemplatePath, searchServiceTemplateContentLines.join('\n'))
