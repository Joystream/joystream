import { flags } from '@oclif/command'
import chalk from 'chalk'
import { IAppMetadata, IMemberRemarked, MemberRemarked } from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'
import { getInputJson } from '../../helpers/InputOutput'
import AppCommandBase from '../../base/AppCommandBase'

export default class GenerateAppCreationMessage extends AppCommandBase {
  static description = 'App creation message factory'

  static flags = {
    input: flags.string({
      required: false,
      char: 'i',
      description: `Path to JSON file containing app details`,
    }),
    appId: flags.string({
      required: true,
      description: `ID of the app to update`,
    }),
  }

  async run(): Promise<void> {
    let createAppRemarked: IMemberRemarked | null
    const { input, appId } = this.parse(GenerateAppCreationMessage).flags
    if (input) {
      const inputBody = await getInputJson<IAppMetadata>(input)
      const appMetadata = await this.promptAppMetadata(inputBody)

      createAppRemarked = {
        updateApp: {
          appId,
          appMetadata,
        },
      }
    } else {
      const appMetadata = await this.promptAppMetadata()

      createAppRemarked = {
        updateApp: {
          appId,
          appMetadata,
        },
      }
    }
    this.log(chalk.green(`App commitment: ${metadataToBytes(MemberRemarked, createAppRemarked)}`))
  }
}
