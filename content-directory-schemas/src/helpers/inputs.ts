import path from 'path'
import fs from 'fs'
import { CreateClass, AddClassSchema } from '../../types/extrinsics'
import { EntityBatch } from '../../types/EntityBatch'
import { EXPECTED_CLASS_ORDER } from '../consts'

export const INPUTS_LOCATION = path.join(__dirname, '../../inputs')
export const INPUT_TYPES = ['classes', 'schemas', 'entityBatches'] as const

export type InputType = typeof INPUT_TYPES[number]
export type FetchedInput<Schema = any> = { fileName: string; data: Schema }

export const getInputsLocation = (inputType: InputType) => path.join(INPUTS_LOCATION, inputType)

export function getInputs<Schema = any>(
  inputType: InputType,
  rootInputsLocation = INPUTS_LOCATION
): FetchedInput<Schema>[] {
  return fs.readdirSync(path.join(rootInputsLocation, inputType)).map((fileName) => {
    const inputJson = fs.readFileSync(path.join(rootInputsLocation, inputType, fileName)).toString()
    return {
      fileName,
      data: JSON.parse(inputJson) as Schema,
    }
  })
}

export function getSortedClassInputs(rootInputsLocation = INPUTS_LOCATION): FetchedInput<CreateClass>[] {
  return getInputs<CreateClass>('classes', rootInputsLocation).sort((a, b) => {
    if (EXPECTED_CLASS_ORDER.indexOf(a.data.name) === -1) return 1
    if (EXPECTED_CLASS_ORDER.indexOf(b.data.name) === -1) return -1
    return EXPECTED_CLASS_ORDER.indexOf(a.data.name) - EXPECTED_CLASS_ORDER.indexOf(b.data.name)
  })
}

export function getInitializationInputs(rootInputsLocation = INPUTS_LOCATION) {
  return {
    classInputs: getSortedClassInputs(rootInputsLocation).map(({ data }) => data),
    schemaInputs: getInputs<AddClassSchema>('schemas').map(({ data }) => data),
    entityBatchInputs: getInputs<EntityBatch>('entityBatches').map(({ data }) => data),
  }
}
