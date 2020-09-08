// Adds Joystream types to /definitions/augment-types.ts allowing better api.createType TS support

import common from '../common'
import members from '../members'
import council from '../council'
import roles from '../roles'
import forum from '../forum'
import stake from '../stake'
import mint from '../mint'
import recurringRewards from '../recurring-rewards'
import hiring from '../hiring'
import versionedStore from '../versioned-store'
import versionedStorePermissions from '../versioned-store/permissions'
import contentWorkingGroup from '../content-working-group'
import workingGroup from '../working-group'
import discovery from '../discovery'
import media from '../media'
import proposals from '../proposals'
import fs from 'fs'
import path from 'path'

const typesByModule = {
  'common': common,
  'members': members,
  'council': council,
  'roles': roles,
  'forum': forum,
  'stake': stake,
  'mint': mint,
  'recurring-rewards': recurringRewards,
  'hiring': hiring,
  'versioned-store': versionedStore,
  'versioned-store/permissions': versionedStorePermissions,
  'content-working-group': contentWorkingGroup,
  'working-group': workingGroup,
  'discovery': discovery,
  'media': media,
  'proposals': proposals,
}

type Imports = { [moduleName: string]: string[] }
type AugmentTypes = { [typeName: string]: string }

const imports: Imports = {}
const augmentTypes: AugmentTypes = {}

const populateFileByTemplateTag = (fileContent: string, tag: string, lines: string[]) => {
  const fileLines = fileContent.split('\n')
  const startIndex = fileLines.findIndex((line) => line.includes(`/** ${tag} **/`))
  const endIndex = fileLines.findIndex((line) => line.includes(`/** /${tag} **/`))

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error(`populateFileByTemplateTag: Invalid tag (${tag})`)
  }

  const whitespaceMatch = fileLines[startIndex].match(/^(\s)+/)
  const whitespace = whitespaceMatch ? whitespaceMatch[0] : ''

  fileLines.splice(startIndex + 1, endIndex - (startIndex + 1), ...lines.map((line) => `${whitespace}${line}`))

  return fileLines.join('\n')
}

const updateAugmentTypesFile = (filePath: string, imports: Imports, augmentTypes: AugmentTypes) => {
  let fileContent = fs.readFileSync(filePath).toString()
  fileContent = populateFileByTemplateTag(
    fileContent,
    'CUSTOMIMPORTS',
    Object.entries(imports).map(
      ([moduleName, importStatements]) =>
        // import as to avoid namespace clashes
        `import { ${importStatements.join(', ')} } from '../${moduleName}'`
    )
  )
  fileContent = populateFileByTemplateTag(
    fileContent,
    'CUSTOMTYPES',
    Object.entries(augmentTypes).map(([typeName, constructorName]) => `"${typeName}": ${constructorName};`)
  )

  fs.writeFileSync(filePath, fileContent)
}

const addAugmentTypes = (typeName: string, constructorName: string) => {
  augmentTypes[typeName] = constructorName
  augmentTypes[`Option<${typeName}>`] = `Option<${constructorName}>`
  augmentTypes[`Vec<${typeName}>`] = `Vec<${constructorName}>`
}

Object.entries(typesByModule).forEach(([moduleName, types]) => {
  console.log('Module: ', moduleName)
  console.log('Types found:', Object.keys(types))
  Object.entries(types).forEach(([typeName, codecOrName]) => {
    if (typeof codecOrName === 'function') {
      const constructorName = codecOrName.name
      if (!constructorName) {
        throw new Error(`Codec constructor doesn't have a name: ${typeName}`)
      }
      const normalizedTypeName = typeName.replace(/[^A-Za-z0-9_]/g, '_')
      // Add "as" to avoid namespace clashes
      const importStatement = `${constructorName} as ${normalizedTypeName}`
      !imports[moduleName] ? (imports[moduleName] = [importStatement]) : imports[moduleName].push(importStatement)
      addAugmentTypes(typeName, normalizedTypeName)
    } else if (typeof codecOrName === 'string') {
      addAugmentTypes(typeName, codecOrName)
    }
  })
})

updateAugmentTypesFile(path.join(__dirname, '../definitions/augment-types.ts'), imports, augmentTypes)
