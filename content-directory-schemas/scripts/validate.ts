// TODO: Add entity batches validation
import Ajv from 'ajv'
import { FetchedInput, getInputs, InputType, INPUT_TYPES } from './helpers/inputs'
import path from 'path'
import fs from 'fs'

const SCHEMAS_LOCATION = path.join(__dirname, '../schemas')

const ajv = new Ajv({ allErrors: true })
// Add all existing schemas to Ajv to allow them to reference each other
fs.readdirSync(SCHEMAS_LOCATION)
  .filter((subdir) => !subdir.includes('.'))
  .forEach((subdir) => {
    fs.readdirSync(path.join(SCHEMAS_LOCATION, subdir)).forEach((schemaFilename) => {
      ajv.addSchema(JSON.parse(fs.readFileSync(path.join(SCHEMAS_LOCATION, subdir, schemaFilename)).toString()))
    })
  })

const validateJsonSchema = (jsonSchemaShortPath: string, jsonSchema: Record<string, unknown>) => {
  if (!ajv.validateSchema(jsonSchema)) {
    console.log(`\nERROR! ${jsonSchemaShortPath} - schema validation failed!`)
    console.log(ajv.errorsText(undefined, { separator: '\n' }))
    console.log('\n')
    process.exitCode = 100

    return false
  }

  return true
}

const validateInputAgainstSchema = (input: FetchedInput, jsonSchema: Record<string, unknown>) => {
  if (!ajv.validate(jsonSchema, input.data)) {
    console.log(`\nERROR! ${input.fileName} - validation failed!`)
    console.log(ajv.errorsText(undefined, { separator: '\n' }))
    console.log('\n')
    process.exitCode = 100

    return false
  }

  return true
}

const getJsonSchemaForInput = (inputType: InputType, input: FetchedInput) => {
  let schemaLocation = ''
  if (inputType === 'classes') {
    schemaLocation = path.join(SCHEMAS_LOCATION, 'extrinsics', 'CreateClass.schema.json')
  }
  if (inputType === 'schemas') {
    schemaLocation = path.join(SCHEMAS_LOCATION, 'extrinsics', 'AddClassSchema.schema.json')
  }
  if (inputType === 'entityBatches') {
    const jsonSchemaFilename = input.fileName.split('_')[1].replace('.json', '.schema.json')
    schemaLocation = path.join(SCHEMAS_LOCATION, 'entityBatches', jsonSchemaFilename)
  }

  return {
    jsonSchemaPath: schemaLocation,
    jsonSchema: JSON.parse(fs.readFileSync(schemaLocation).toString()),
  }
}

const alreadyValidatedJsonSchemas = new Map<string, boolean>()
INPUT_TYPES.forEach((inputType) => {
  console.log(`Validating inputs/${inputType} and related json-schemas...\n`)
  getInputs(inputType).forEach((input) => {
    const { jsonSchemaPath, jsonSchema } = getJsonSchemaForInput(inputType, input)
    const jsonSchemaShortPath = path.relative(path.join(SCHEMAS_LOCATION, '..'), jsonSchemaPath)
    // Validate the schema itself
    let isJsonSchemaValid = alreadyValidatedJsonSchemas.get(jsonSchemaShortPath)
    if (isJsonSchemaValid === undefined) {
      console.log(`Validating ${jsonSchemaShortPath}...`)
      isJsonSchemaValid = validateJsonSchema(jsonSchemaShortPath, jsonSchema)
      alreadyValidatedJsonSchemas.set(jsonSchemaShortPath, isJsonSchemaValid)
    }
    if (!isJsonSchemaValid) {
      return
    }
    console.log(`Validating inputs/${inputType}/${input.fileName}...`)
    validateInputAgainstSchema(input, jsonSchema)
  })

  console.log('\n\n')
})
