import { ValidationService } from '../validation/ValidationService'
import { Config } from '../../types'
import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import _ from 'lodash'
import configSchema, { bytesizeUnits } from '../validation/schemas/configSchema'
import { JSONSchema4 } from 'json-schema'

const MIN_CACHE_SIZE = 20 * Math.pow(1024, 3)

export class ConfigParserService {
  validator: ValidationService

  constructor() {
    this.validator = new ValidationService()
  }

  public resolveConfigDirectoryPaths(paths: Config['directories'], configFilePath: string): Config['directories'] {
    return _.mapValues(paths, (v) => path.resolve(path.dirname(configFilePath), v))
  }

  private parseBytesize(bytesize: string) {
    const intValue = parseInt(bytesize)
    const unit = bytesize[bytesize.length - 1]

    return intValue * Math.pow(1024, bytesizeUnits.indexOf(unit))
  }

  private schemaTypeOf(schema: JSONSchema4, path: string[]): JSONSchema4['type'] {
    if (path.length === 0) {
      return undefined
    }
    if (schema.properties && schema.properties[path[0]]) {
      const item = schema.properties[path[0]]
      if (item.type === 'object') {
        return this.schemaTypeOf(item, path.slice(1))
      } else {
        return item.type
      }
    }
  }

  private mergeEnvConfigWith(config: Record<string, unknown>) {
    Object.entries(process.env)
      .filter(([k]) => k.startsWith('JOYSTREAM_DISTRIBUTOR__'))
      .forEach(([k, v]) => {
        const path = k
          .replace('JOYSTREAM_DISTRIBUTOR__', '')
          .split('__')
          .map((k) => _.camelCase(k))

        const valueType = this.schemaTypeOf(configSchema, path)
        if (valueType === undefined) {
          // Invalid key - skip
        } else if (valueType === 'integer') {
          _.set(config, path, parseInt(v || ''))
        } else if (valueType === 'number') {
          _.set(config, path, parseFloat(v || ''))
        } else if (valueType === 'boolean') {
          _.set(config, path, !!v)
        } else if (valueType === 'array') {
          try {
            const parsed = JSON.parse(v || 'undefined')
            _.set(config, path, parsed)
          } catch (e) {
            throw new Error(`Env value ${k} is not a valid JSON array`)
          }
        } else {
          _.set(config, path, v)
        }
      })
  }

  public loadConfing(configPath: string): Config {
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
    const storageLimit = this.parseBytesize(configJson.storageLimit)

    if (storageLimit < MIN_CACHE_SIZE) {
      throw new Error('Cache storage limit should be at least 20G!')
    }

    const parsedConfig: Config = {
      ...configJson,
      directories,
      storageLimit,
    }

    return parsedConfig
  }
}
