import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import { CLIError } from '@oclif/errors'
import DefaultCommandBase from '../command-base/default'
import { Config, ReadonlyConfig } from '../types/config'
import { configSchema } from '../validation/schemas'
import { App } from '../app'
import _ from 'lodash'

export default class StartNode extends DefaultCommandBase {
  static description = 'Start the node'

  static examples = [`$ joystream-distributor start /path/to/config.yml`]

  // TODO: Allow overriding config through flags

  static args = [
    {
      name: 'config',
      description: 'Path to YAML configuration file',
      default: './config.yml',
    },
  ]

  resolveDirectoryPaths(paths: Config['directories'], configFilePath: string): Config['directories'] {
    return _.mapValues(paths, (v) => path.resolve(configFilePath, v))
  }

  getConfing(configPath: string): Config {
    const fileContent = fs.readFileSync(configPath).toString()
    let config: unknown
    if (path.extname(configPath) === '.json') {
      config = JSON.parse(fileContent)
    } else if (path.extname(configPath) === '.yml') {
      config = YAML.parse(fileContent)
    } else {
      throw new CLIError('Unrecognized config format (use .yml or .json)')
    }

    return this.asValidatedInput<Config>(configSchema, config, 'Configuration file')
  }

  async run(): Promise<void> {
    const { args } = this.parse(StartNode)
    const configPath = args.config
    const config = this.getConfing(configPath)
    config.directories = this.resolveDirectoryPaths(config.directories, configPath)
    const app = new App(config as ReadonlyConfig)
    app.start()
  }

  async finally(): Promise<void> {
    /* Do nothing */
  }
}
