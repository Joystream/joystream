import Ajv from 'ajv'
import { SchemaKey, schemas, TypeBySchemaKey } from '../../schemas'

export class ValidationError extends Error {
  public readonly errors: Ajv['errors']
  public readonly errorMessages: string[]

  public constructor(message: string, errors: Ajv['errors']) {
    const errorMessages: string[] = []
    errors?.forEach((e) => errorMessages.push(`${e.dataPath}: ${e.message} (${JSON.stringify(e.params)})`))
    super(`${message}\n\n${errorMessages.join('\n')}`)
    this.errors = errors
    this.errorMessages = errorMessages
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
      throw new ValidationError(`${schemaKey} is not valid`, this.ajv.errors)
    }
    return input as TypeBySchemaKey<SK>
  }

  errorsByProperty<T>(schemaKey: SchemaKey, path: string, input: T): Ajv['errors'] {
    this.ajv.validate(schemaKey, input)
    return this.ajv.errors?.filter((e) => e.dataPath === `/${path}` || e.dataPath.startsWith(`/${path}/`))
  }
}
