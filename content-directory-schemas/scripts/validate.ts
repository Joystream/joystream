import Ajv from 'ajv'
import fs from 'fs'
import path from 'path'
import CreateClassSchema from '../schemas/CreateClass.schema.json'
import AddClassSchemaSchema from '../schemas/AddClassSchema.schema.json'

const INPUTS_LOCATION = path.join(__dirname, '../inputs')

type JsonSchema = {
  schemaName: string
  jsonSchema: Record<string, unknown>
  relatedInputDirectory: string
}

const schemas: JsonSchema[] = [
  { schemaName: 'CreateClass', jsonSchema: CreateClassSchema, relatedInputDirectory: 'classes' },
  { schemaName: 'AddClassSchema', jsonSchema: AddClassSchemaSchema, relatedInputDirectory: 'schemas' },
]

const ajv = new Ajv({ allErrors: true })

schemas.forEach(({ schemaName, jsonSchema, relatedInputDirectory }) => {
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
  fs.readdirSync(path.join(INPUTS_LOCATION, relatedInputDirectory)).forEach((fileName) => {
    const inputRelativePath = path.join(relatedInputDirectory, fileName)
    console.log(`Validating ${inputRelativePath}...`)
    const inputJson = fs.readFileSync(path.join(INPUTS_LOCATION, inputRelativePath)).toString()
    let inputData
    try {
      inputData = JSON.parse(inputJson)
    } catch (e) {
      console.log(`\nERROR: ${inputRelativePath} - cannot parse the json!`)
      console.log('\n')
      process.exitCode = 100
      return
    }

    if (!ajv.validate(jsonSchema, inputData)) {
      console.log(`\nERROR! ${inputRelativePath} - validation failed!`)
      console.log(ajv.errorsText(undefined, { separator: '\n' }))
      console.log('\n')
      process.exitCode = 100
    }
  })

  console.log('\n\n')
})
