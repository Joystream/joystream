import { ValidationError, ValidationService } from '../validation/ValidationService'
import { Config } from '../../types'
import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import _ from 'lodash'
import configSchema, { bytesizeUnits } from '../../schemas/configSchema'
import { JSONSchema4, JSONSchema4TypeName } from 'json-schema'

const MIN_CACHE_SIZE = 20 * Math.pow(1024, 3)

export class ConfigParserService {
  validator: ValidationService

  constructor() {
    this.validator = new ValidationService()
  }

  public resolveConfigDirectoryPaths(paths: Config['directories'], configFilePath: string): Config['directories'] {
    return _.mapValues(paths, (v) =>
      typeof v === 'string' ? path.resolve(path.dirname(configFilePath), v) : v
    ) as Config['directories']
  }

  public resolveConfigKeysPaths(keys: Config['keys'], configFilePath: string): Config['keys'] {
    return keys.map((k) =>
      'keyfile' in k ? { keyfile: path.resolve(path.dirname(configFilePath), k.keyfile) } : k
    ) as Config['keys']
  }

  private parseBytesize(bytesize: string) {
    const intValue = parseInt(bytesize)
    const unit = bytesize[bytesize.length - 1]

    return intValue * Math.pow(1024, bytesizeUnits.indexOf(unit))
  }

  private schemaTypeOf(schema: JSONSchema4, path: string[]): JSONSchema4['type'] {
    if (schema.properties && schema.properties[path[0]]) {
      const item = schema.properties[path[0]]
      if (path.length > 1) {
        return this.schemaTypeOf(item, path.slice(1))
      }
      if (item.oneOf) {
        const validTypesSet = new Set<JSONSchema4TypeName>()
        item.oneOf.forEach(
          (s) =>
            Array.isArray(s.type)
              ? s.type.forEach((t) => validTypesSet.add(t))
              : s.type
              ? validTypesSet.add(s.type)
              : undefined // do nothing
        )
        return Array.from(validTypesSet)
      }
      return item.type
    }
  }

  private setConfigEnvValue(
    config: Record<string, unknown>,
    path: string[],
    envKey: string,
    envValue: string | undefined
  ) {
    const schemaType = this.schemaTypeOf(configSchema, path)
    const possibleTypes = Array.isArray(schemaType) ? schemaType : [schemaType]

    for (const i in possibleTypes) {
      try {
        switch (possibleTypes[i]) {
          case undefined:
            // Invalid key - skip
            break
          case 'integer':
            _.set(config, path, parseInt(envValue || ''))
            break
          case 'number':
            _.set(config, path, parseFloat(envValue || ''))
            break
          case 'boolean':
            _.set(config, path, !!envValue)
            break
          case 'array':
          case 'object':
            try {
              const parsed = JSON.parse(envValue || 'undefined')
              _.set(config, path, parsed)
            } catch (e) {
              throw new ValidationError(`Invalid env value of ${envKey}: Not a valid JSON`, null)
            }
            break
          default:
            _.set(config, path, envValue)
        }
        const errors = this.validator.errorsByProperty('Config', path.join('.'), config)
        if (errors) {
          throw new ValidationError(`Invalid env value of ${envKey}`, errors)
        }
        return
      } catch (e) {
        // Only throw if there are no more possible types to test against
        if (parseInt(i) === possibleTypes.length - 1) {
          throw e
        }
      }
    }
  }

  private mergeEnvConfigWith(config: Record<string, unknown>) {
    Object.entries(process.env)
      .filter(([envKey]) => envKey.startsWith('JOYSTREAM_DISTRIBUTOR__'))
      .forEach(([envKey, envValue]) => {
        const configPath = envKey
          .replace('JOYSTREAM_DISTRIBUTOR__', '')
          .split('__')
          .map((key) => _.camelCase(key))
        this.setConfigEnvValue(config, configPath, envKey, envValue)
      })
  }

  public loadConfig(configPath: string): Config {
    let inputConfig: Record<string, unknown> = {}
    // Try to load config from file if exists
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath).toString()
      if (path.extname(configPath) === '.json') {
        inputConfig = JSON.parse(fileContent)
      } else if (path.extname(configPath) === '.yml' || path.extname(configPath) === '.yaml') {
        inputConfig = YAML.parse(fileContent)
      } else {
        throw new Error('Unrecognized config format (use .yml or .json)')
      }
    }

    // Override config with env variables
    this.mergeEnvConfigWith(inputConfig)

    // Validate the config
    const configJson = this.validator.validate('Config', inputConfig)

    // Normalize values
    const directories = this.resolveConfigDirectoryPaths(configJson.directories, configPath)
    const keys = this.resolveConfigKeysPaths(configJson.keys, configPath)
    const storageLimit = this.parseBytesize(configJson.limits.storage)

    if (storageLimit < MIN_CACHE_SIZE) {
      throw new Error('Cache storage limit should be at least 20G!')
    }

    const parsedConfig: Config = {
      ...configJson,
      directories,
      keys,
      limits: {
        ...configJson.limits,
        storage: storageLimit,
      },
    }

    return parsedConfig
  }
}
