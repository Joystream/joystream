import { ValidationService } from '../validation/ValidationService'
import { Config } from '../../types'
import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import _ from 'lodash'

export class ConfigParserService {
  validator: ValidationService

  constructor() {
    this.validator = new ValidationService()
  }

  public resolveConfigDirectoryPaths(paths: Config['directories'], configFilePath: string): Config['directories'] {
    return _.mapValues(paths, (v) => path.resolve(path.dirname(configFilePath), v))
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

    const config = this.validator.validate('Config', inputConfig)
    config.directories = this.resolveConfigDirectoryPaths(config.directories, configPath)

    return config
  }
}
