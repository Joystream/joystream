import fs from 'fs'
import { getInputsLocation } from './inputs'

const schemaInputFilenames = fs.readdirSync(getInputsLocation('schemas'))

type EntitySchemaType = 'Ref' | 'Entity' | 'Batch'

export const schemaFilenameToEntitySchemaName = (inputFilename: string, schemaType?: EntitySchemaType) =>
  inputFilename.split('_')[1].replace('Schema.json', schemaType || '')

export const classIdToEntitySchemaName = (classId: number, schemaType: EntitySchemaType) =>
  schemaFilenameToEntitySchemaName(
    schemaInputFilenames.find((fileName) => fileName.startsWith(`${classId}_`))!,
    schemaType
  )
