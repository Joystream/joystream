import Ajv from 'ajv'
import { SchemaKey, schemas, TypeBySchemaKey } from './schemas'

class ValidationError extends Error {
  public readonly errors: string[]

  public constructor(message: string, errors: string[]) {
    super(message)
    this.errors = errors
  }
}

export class ValidationService {
  private ajv: Ajv

  public constructor() {
    this.ajv = new Ajv({ allErrors: true, schemas })
  }

  validate(schemaKey: SchemaKey, input: unknown): TypeBySchemaKey<SchemaKey> {
    const valid = this.ajv.validate(schemaKey, input) as boolean
    if (!valid) {
      throw new ValidationError(
        `${schemaKey} is not valid`,
        this.ajv.errors?.map((e) => `${e.instancePath}: ${e.message} (${JSON.stringify(e.params)})`) || []
      )
    }
    return input as TypeBySchemaKey<SchemaKey>
  }
}
