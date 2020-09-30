import path from 'path'
import fs from 'fs'

export const INPUTS_LOCATION = path.join(__dirname, '../../inputs')
export const INPUT_TYPES = ['classes', 'schemas', 'entityBatches'] as const

export type InputType = typeof INPUT_TYPES[number]
export type FetchedInput<Schema = any> = { fileName: string; data: Schema }

export const sortFiles = (filenameA: string, filenameB: string) =>
  parseInt(filenameA.split('_')[0]) - parseInt(filenameB.split('_')[0])

export const getInputsLocation = (inputType: InputType) => path.join(INPUTS_LOCATION, inputType)

export function getInputs<Schema = any>(inputType: InputType): FetchedInput<Schema>[] {
  return fs
    .readdirSync(getInputsLocation(inputType))
    .sort(sortFiles)
    .map((fileName) => {
      const inputJson = fs.readFileSync(path.join(INPUTS_LOCATION, inputType, fileName)).toString()
      return {
        fileName,
        data: JSON.parse(inputJson) as Schema,
      }
    })
}
