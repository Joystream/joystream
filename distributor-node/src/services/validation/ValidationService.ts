import Ajv from 'ajv'
import { SchemaKey, schemas, TypeBySchemaKey } from './schemas'

class ValidationError extends Error {
  public readonly errors: string[]

  public constructor(message: string, errors: string[]) {
    super(`${message}\n\n${errors.join('\n')}`)
    this.errors = errors
  }
}

export class ValidationService {
  private ajv: Ajv

  public constructor() {
    this.ajv = new Ajv({ allErrors: true, schemas })
  }

  validate<SK extends SchemaKey>(schemaKey: SK, input: unknown): TypeBySchemaKey<SK> {
    const valid = this.ajv.validate(schemaKey, input) as boolean
    if (!valid) {
      throw new ValidationError(
        `${schemaKey} is not valid`,
        this.ajv.errors?.map((e) => `${e.dataPath}: ${e.message} (${JSON.stringify(e.params)})`) || []
      )
    }
    return input as TypeBySchemaKey<SK>
  }
}
