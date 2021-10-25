import { KeyringPair } from '@polkadot/keyring/types'
import path from 'path'
import { CLI, CommandResult } from './base'
import { tmpJsonFile } from './utils'
import { ChannelInputParameters } from '@joystream/cli/src/Types'

const CLI_ROOT_PATH = path.resolve(__dirname, '../../../../cli')

export class JoystreamCLI extends CLI {
  constructor() {
    super(CLI_ROOT_PATH)
  }

  async importKey(pair: KeyringPair): Promise<CommandResult> {
    const jsonFile = tmpJsonFile(pair.toJson())
    return this.run('account:import', [jsonFile])
  }

  async createChannel(inputData: ChannelInputParameters, args: string[]): Promise<CommandResult> {
    const jsonFile = tmpJsonFile(inputData)
    return this.run('content:createChannel', ['--input', jsonFile, ...args])
  }
}
