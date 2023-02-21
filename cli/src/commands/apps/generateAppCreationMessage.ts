import { flags } from '@oclif/command'
import chalk from 'chalk'
import { IAppMetadata, IMemberRemarked, MemberRemarked } from '@joystream/metadata-protobuf'
import ExitCodes from '../../ExitCodes'
import { metadataToBytes } from '../../helpers/serialization'
import { getInputJson } from '../../helpers/InputOutput'
import AppCommandBase from '../../base/AppCommandBase'

interface AppCreationDetails extends IAppMetadata {
  name: string
}

export default class GenerateAppCreationMessage extends AppCommandBase {
  static description = 'App creation message factory'

  static flags = {
    input: flags.string({
      required: false,
      char: 'i',
      description: `Path to JSON file containing app details`,
    }),
  }

  async run(): Promise<void> {
    let createAppRemarked: IMemberRemarked | null
    const { input } = this.parse(GenerateAppCreationMessage).flags
    if (input) {
      const inputBody = await getInputJson<AppCreationDetails>(input)
      const name = inputBody.name || (await this.promptAppName())
      const appMetadata = await this.promptAppMetadata(inputBody)

      createAppRemarked = {
        createApp: {
          name,
          appMetadata,
        },
      }
    } else {
      const name = await this.promptAppName()
      const appMetadata = await this.promptAppMetadata()

      createAppRemarked = {
        createApp: {
          name,
          appMetadata,
        },
      }
    }
    this.log(chalk.green(`App commitment: ${metadataToBytes(MemberRemarked, createAppRemarked)}`))
  }

  async promptAppName(): Promise<string> {
    const name = await this.simplePrompt<string>({ message: 'App name?' })
    if (!name) {
      this.error('Name is required', { exit: ExitCodes.InvalidInput })
    }
    return name
  }
}
