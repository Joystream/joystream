// Creates /augment-codec/augment-types.ts file with api augmentation that allows
// creating custom Joystream "Codec types" with api.createType

import common from '../common'
import members from '../members'
import council from '../council'
import roles from '../roles'
import forum from '../forum'
import stake from '../stake'
import mint from '../mint'
import recurringRewards from '../recurring-rewards'
import hiring from '../hiring'
import contentWorkingGroup from '../content-working-group'
import workingGroup from '../working-group'
import discovery from '../discovery'
import media from '../media'
import proposals from '../proposals'
import contentDirectory from '../content-directory'
import fs from 'fs'
import path from 'path'
import * as defaultDefinitions from '@polkadot/types/interfaces/definitions'
import { generateInterfaceTypes } from '@polkadot/typegen/generate/interfaceRegistry'

const OUTPUT_PATH = path.join(__dirname, '../../augment-codec/augment-types.ts')
const IMPORTS_DIR = '..'

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
  'content-working-group': contentWorkingGroup,
  'working-group': workingGroup,
  'discovery': discovery,
  'media': media,
  'proposals': proposals,
  'content-directory': contentDirectory,
}

type Imports = { [moduleName: string]: string[] }
type AugmentTypes = { [typeName: string]: string }

const imports: Imports = {}
const augmentTypes: AugmentTypes = {}

const CUSTOM_IMPORTS_TAG = 'CUSTOMIMPORTS'
const CUSTOM_TYPES_TAG = 'CUSTOMTYPES'

const populateFileByTemplateTag = (fileContent: string, tag: string, insertLines: string[]) => {
  const fileLines = fileContent.split('\n')
  const startIndex = fileLines.findIndex((line) => line.includes(`/** ${tag} **/`))
  const endIndex = fileLines.findIndex((line) => line.includes(`/** /${tag} **/`))

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error(`populateFileByTemplateTag: Invalid tag (${tag})`)
  }

  const [whitespace] = fileLines[startIndex].match(/^(\s)+/) || ['']
  fileLines.splice(startIndex + 1, endIndex - (startIndex + 1), ...insertLines.map((line) => `${whitespace}${line}`))

  return fileLines.join('\n')
}

const addTagsIfDontExist = (fileContent: string): string => {
  const fileLines = fileContent.split('\n')
  // Custom imports
  if (fileLines.findIndex((line) => line.includes(`/** ${CUSTOM_IMPORTS_TAG} **/`)) === -1) {
    const firstImportIndex = fileLines.findIndex((line) => line.includes('import'))
    fileLines.splice(firstImportIndex, 0, `/** ${CUSTOM_IMPORTS_TAG} **/`, `/** /${CUSTOM_IMPORTS_TAG} **/`)
  }
  // Custom types
  if (fileLines.findIndex((line) => line.includes(`/** ${CUSTOM_TYPES_TAG} **/`)) === -1) {
    const firstTypeIndex = fileLines.findIndex((line) => line.includes('export interface InterfaceTypes')) + 1
    const [whitespace] = fileLines[firstTypeIndex].match(/^(\s)+/) || ['']
    fileLines.splice(
      firstTypeIndex,
      0,
      `${whitespace}/** ${CUSTOM_TYPES_TAG} **/`,
      `${whitespace}/** /${CUSTOM_TYPES_TAG} **/`
    )
  }

  return fileLines.join('\n')
}

const updateAugmentTypesFile = (filePath: string, imports: Imports, augmentTypes: AugmentTypes) => {
  let fileContent = fs.readFileSync(filePath).toString()
  fileContent = addTagsIfDontExist(fileContent)
  fileContent = populateFileByTemplateTag(
    fileContent,
    CUSTOM_IMPORTS_TAG,
    Object.entries(imports).map(
      ([moduleName, importStatements]) =>
        // import as to avoid namespace clashes
        `import { ${importStatements.join(', ')} } from '${IMPORTS_DIR}/${moduleName}'`
    )
  )
  fileContent = populateFileByTemplateTag(
    fileContent,
    CUSTOM_TYPES_TAG,
    Object.entries(augmentTypes).map(([typeName, constructorName]) => `"${typeName}": ${constructorName};`)
  )

  fs.writeFileSync(filePath, fileContent)
}

const addAugmentTypes = (typeName: string, constructorName: string) => {
  augmentTypes[typeName] = constructorName
  augmentTypes[`Option<${typeName}>`] = `Option<${constructorName}>`
  augmentTypes[`Vec<${typeName}>`] = `Vec<${constructorName}>`
}

console.log('Generating default interface types based on current @polkadot/types definitions...')
generateInterfaceTypes({ '@polkadot/types/interfaces': defaultDefinitions }, OUTPUT_PATH)

console.log('Adding custom Joystream types...')
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

updateAugmentTypesFile(OUTPUT_PATH, imports, augmentTypes)
