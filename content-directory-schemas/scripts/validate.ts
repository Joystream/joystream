// TODO: Add entity batches validation
import Ajv from 'ajv'
import CreateClassSchema from '../schemas/extrinsics/CreateClass.schema.json'
import AddClassSchemaSchema from '../schemas/extrinsics/AddClassSchema.schema.json'
import { getInputs, InputType } from './helpers/inputs'

type JsonSchema = {
  schemaName: string
  jsonSchema: Record<string, unknown>
  relatedInputType: InputType
}

const schemas: JsonSchema[] = [
  { schemaName: 'CreateClass', jsonSchema: CreateClassSchema, relatedInputType: 'classes' },
  { schemaName: 'AddClassSchema', jsonSchema: AddClassSchemaSchema, relatedInputType: 'schemas' },
]

const ajv = new Ajv({ allErrors: true })

schemas.forEach(({ schemaName, jsonSchema, relatedInputType }) => {
  // Validate the schema itself
  console.log(`Validating schema for ${schemaName}...`)
  if (!ajv.validateSchema(jsonSchema)) {
    console.log(`\nERROR! ${schemaName} - schema validation failed!`)
    console.log(ajv.errorsText(undefined, { separator: '\n' }))
    console.log('\n')
    process.exitCode = 100
    return
  }

  // Validate inputs
  console.log('Validating inputs...')
  getInputs(relatedInputType).forEach(({ fileName, data }) => {
    if (!ajv.validate(jsonSchema, data)) {
      console.log(`\nERROR! ${relatedInputType}/${fileName} - validation failed!`)
      console.log(ajv.errorsText(undefined, { separator: '\n' }))
      console.log('\n')
      process.exitCode = 100
    }
  })

  console.log('\n\n')
})
