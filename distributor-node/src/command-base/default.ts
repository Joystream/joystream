import Ajv from 'ajv'
import { JSONSchema4 } from 'json-schema'
import Command from '@oclif/command'
import { CLIError } from '@oclif/errors/lib/errors/cli'

export default abstract class DefaultCommandBase extends Command {
  asValidatedInput<ValidInputType>(schema: JSONSchema4, input: unknown, inputName = 'Input'): ValidInputType {
    const ajv = new Ajv({ allErrors: true })
    const valid = ajv.validate(schema, input) as boolean
    if (!valid) {
      throw new CLIError(
        `${inputName} is not valid:\n` +
          ajv.errors?.map((e) => `${e.instancePath}: ${e.message} (${JSON.stringify(e.params)})`).join('\n')
      )
    }
    return input as ValidInputType
  }
}
