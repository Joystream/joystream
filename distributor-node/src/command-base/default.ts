import Command, { flags as oclifFlags } from '@oclif/command'
import inquirer from 'inquirer'
import ExitCodes from './ExitCodes'
import { ReadonlyConfig } from '../types/config'
import { ConfigParserService } from '../services/parsers/ConfigParserService'
import { LoggingService } from '../services/logging'
import { Logger } from 'winston'
import { BagIdParserService } from '../services/parsers/BagIdParserService'
import { BucketIdParserService } from '../services/parsers/BucketIdParserService'

export const flags = {
  ...oclifFlags,
  integerArr: oclifFlags.build({
    parse: (value: string) => {
      const arr: number[] = value.split(',').map((v) => {
        if (!/^-?\d+$/.test(v)) {
          throw new Error(`Expected comma-separated integers, but received: ${value}`)
        }
        return parseInt(v)
      })
      return arr
    },
  }),
  bagId: oclifFlags.build({
    char: 'b',
    parse: (value: string) => {
      const parser = new BagIdParserService(value)
      return parser.parse()
    },
    description: `Bag ID. Format: {bag_type}:{sub_type}:{id}.
    - Bag types: 'static', 'dynamic'
    - Sub types: 'static:council', 'static:wg', 'dynamic:member', 'dynamic:channel'
    - Id:
      - absent for 'static:council'
      - working group name for 'static:wg'
      - integer for 'dynamic:member' and 'dynamic:channel'
    Examples:
    - static:council
    - static:wg:storage
    - dynamic:member:4`,
  }),
  bucketId: oclifFlags.build({
    char: 'B',
    parse: (value: string) => {
      return BucketIdParserService.parseBucketId(value)
    },
    description: `Distribution bucket ID in {familyId}:{bucketIndex} format.`,
  }),
}
export default abstract class DefaultCommandBase extends Command {
  protected appConfig!: ReadonlyConfig
  protected logging!: LoggingService
  protected autoConfirm!: boolean
  private logger!: Logger

  static flags = {
    yes: flags.boolean({
      required: false,
      default: false,
      description: 'Answer "yes" to any prompt, skipping any manual confirmations',
      char: 'y',
    }),
    configPath: flags.string({
      required: false,
      default: process.env.CONFIG_PATH || './config.yml',
      description: 'Path to config JSON/YAML file (relative to current working directory)',
      char: 'c',
    }),
  }

  async init(): Promise<void> {
    const { configPath, yes } = this.parse(this.constructor as typeof DefaultCommandBase).flags
    const configParser = new ConfigParserService(configPath)
    this.appConfig = configParser.parse() as ReadonlyConfig
    this.logging = LoggingService.withCLIConfig()
    this.logger = this.logging.createLogger('CLI')
    this.autoConfirm = !!(process.env.AUTO_CONFIRM === 'true' || parseInt(process.env.AUTO_CONFIRM || '') || yes)
  }

  public log(message: string, ...meta: unknown[]): void {
    this.logger.info(message, ...meta)
  }

  public output(value: unknown): void {
    console.log(value)
  }

  async requireConfirmation(
    message = 'Are you sure you want to execute this action?',
    defaultVal = false
  ): Promise<void> {
    if (this.autoConfirm) {
      return
    }
    const { confirmed } = await inquirer.prompt([{ type: 'confirm', name: 'confirmed', message, default: defaultVal }])
    if (!confirmed) {
      this.exit(ExitCodes.OK)
    }
  }

  async finally(err: unknown): Promise<void> {
    if (!err) this.exit(ExitCodes.OK)
    if (process.env.DEBUG === 'true') {
      console.error(err)
    }
    super.finally(err as Error)
  }
}
