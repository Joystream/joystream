import { ValidationService } from '../validation/ValidationService'
import { Config } from '../../types'
import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import _ from 'lodash'
import { bytesizeUnits } from '../validation/schemas/configSchema'

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

  public loadConfing(configPath: string): Config {
    const fileContent = fs.readFileSync(configPath).toString()
    let inputConfig: unknown
    if (path.extname(configPath) === '.json') {
      inputConfig = JSON.parse(fileContent)
    } else if (path.extname(configPath) === '.yml' || path.extname(configPath) === '.yaml') {
      inputConfig = YAML.parse(fileContent)
    } else {
      throw new Error('Unrecognized config format (use .yml or .json)')
    }

    const configJson = this.validator.validate('Config', inputConfig)

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
