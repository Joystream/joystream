import { flags } from '@oclif/command'
import { CLIError } from '@oclif/errors'
import ExitCodes from '../ExitCodes'
import fs from 'fs'
import path from 'path'
import Ajv from 'ajv'
import { JSONSchema7 } from 'json-schema'
import chalk from 'chalk'

export const IOFlags = {
  input: flags.string({
    char: 'i',
    required: false,
    description: `Path to JSON file to use as input (if not specified - the input can be provided interactively)`,
  }),
  output: flags.string({
    char: 'o',
    required: false,
    description: 'Path where the output JSON file should be placed (can be then reused as input)',
  }),
}

export function getInputJson<T>(inputPath?: string, schema?: JSONSchema7): T | null {
  if (inputPath) {
    let content, jsonObj
    try {
      content = fs.readFileSync(inputPath).toString()
    } catch (e) {
      throw new CLIError(`Cannot access the input file at: ${inputPath}`, { exit: ExitCodes.FsOperationFailed })
    }
    try {
      jsonObj = JSON.parse(content)
    } catch (e) {
      throw new CLIError(`JSON parsing failed for file: ${inputPath}`, { exit: ExitCodes.InvalidInput })
    }
    if (schema) {
      const ajv = new Ajv()
      const valid = ajv.validate(schema, jsonObj)
      if (!valid) {
        throw new CLIError(`Input JSON file is not valid: ${ajv.errorsText()}`)
      }
    }

    return jsonObj as T
  }

  return null
}

export function saveOutputJson(outputPath: string | undefined, fileName: string, data: any): void {
  if (outputPath) {
    let outputFilePath = path.join(outputPath, fileName)
    let postfix = 0
    while (fs.existsSync(outputFilePath)) {
      fileName = fileName.replace(/(_[0-9]+)?\.json/, `_${++postfix}.json`)
      outputFilePath = path.join(outputPath, fileName)
    }
    try {
      fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 4))
    } catch (e) {
      throw new CLIError(`Could not save the output to: ${outputFilePath}. Check directory permissions`, {
        exit: ExitCodes.FsOperationFailed,
      })
    }

    console.log(`${chalk.green('Output succesfully saved to:')} ${chalk.white(outputFilePath)}`)
  }
}
