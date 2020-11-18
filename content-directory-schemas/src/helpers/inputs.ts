import path from 'path'
import fs from 'fs'
import { CreateClass, AddClassSchema } from '../../types/extrinsics'
import { EntityBatch } from '../../types/EntityBatch'

export const INPUTS_LOCATION = path.join(__dirname, '../../inputs')
export const INPUT_TYPES = ['classes', 'schemas', 'entityBatches'] as const

export type InputType = typeof INPUT_TYPES[number]
export type FetchedInput<Schema = any> = { fileName: string; data: Schema }

export const getInputsLocation = (inputType: InputType) => path.join(INPUTS_LOCATION, inputType)

export function getInputs<Schema = any>(
  inputType: InputType,
  rootInputsLocation = INPUTS_LOCATION
): FetchedInput<Schema>[] {
  const inputs: FetchedInput<Schema>[] = []
  fs.readdirSync(path.join(rootInputsLocation, inputType)).forEach((fileName) => {
    const inputFilePath = path.join(rootInputsLocation, inputType, fileName)
    if (path.extname(inputFilePath) !== '.json') {
      return
    }
    const inputJson = fs.readFileSync(inputFilePath).toString()
    inputs.push({
      fileName,
      data: JSON.parse(inputJson) as Schema,
    })
  })
  return inputs
}

export function getInitializationInputs(rootInputsLocation = INPUTS_LOCATION) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    classInputs: require('../../inputs/classes/index.js') as CreateClass[],
    schemaInputs: getInputs<AddClassSchema>('schemas').map(({ data }) => data),
    entityBatchInputs: getInputs<EntityBatch>('entityBatches').map(({ data }) => data),
  }
}
