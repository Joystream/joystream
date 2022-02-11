import { KeyringPair } from '@polkadot/keyring/types'
import path from 'path'
import { CLI, CommandResult } from './base'
import { TmpFileManager } from './utils'
import { ChannelCreationInputParameters } from '@joystream/cli/src/Types'

const CLI_ROOT_PATH = path.resolve(__dirname, '../../../../cli')

export class JoystreamCLI extends CLI {
  protected keys: string[] = []
  protected tmpFileManager: TmpFileManager

  constructor(tmpFileManager: TmpFileManager) {
    const defaultEnv = {
      HOME: tmpFileManager.tmpDataDir,
    }
    super(CLI_ROOT_PATH, defaultEnv)
    this.tmpFileManager = tmpFileManager
  }

  async init(): Promise<void> {
    await this.run('api:setUri', [process.env.NODE_URL || 'ws://127.0.0.1:9944'])
    await this.run('api:setQueryNodeEndpoint', [process.env.QUERY_NODE_URL || 'http://127.0.0.1:8081/graphql'])
  }

  async importKey(pair: KeyringPair): Promise<void> {
    const jsonFile = this.tmpFileManager.jsonFile(pair.toJson())
    await this.run('account:import', [
      '--backupFilePath',
      jsonFile,
      '--name',
      `Account${this.keys.length}`,
      '--password',
      '',
    ])
    this.keys.push(pair.address)
  }

  async run(command: string, customArgs: string[] = [], keyLocks?: string[]): Promise<CommandResult> {
    return super.run(command, customArgs, keyLocks || this.keys)
  }

  async createChannel(inputData: ChannelCreationInputParameters, args: string[]): Promise<CommandResult> {
    const jsonFile = this.tmpFileManager.jsonFile(inputData)
    return this.run('content:createChannel', ['--input', jsonFile, ...args])
  }
}
