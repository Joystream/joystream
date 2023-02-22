import { flags } from '@oclif/command'
import chalk from 'chalk'
import { IAppMetadata, IMemberRemarked, MemberRemarked } from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'
import { getInputJson } from '../../helpers/InputOutput'
import AppCommandBase from '../../base/AppCommandBase'
import MembershipsCommandBase from '../../base/MembershipsCommandBase'

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
    skip: flags.boolean({
      char: 's',
      description: "If true command won't prompt missing fields",
    }),
    ...MembershipsCommandBase.flags,
  }

  async run(): Promise<void> {
    let updateAppRemarked: IMemberRemarked | null
    const { input, appId, skip } = this.parse(GenerateAppCreationMessage).flags
    if (input) {
      const inputBody = await getInputJson<IAppMetadata>(input)
      const appMetadata = skip ? inputBody : await this.promptAppMetadata(inputBody)

      updateAppRemarked = {
        updateApp: {
          appId,
          appMetadata,
        },
      }
    } else {
      const appMetadata = await this.promptAppMetadata()

      updateAppRemarked = {
        updateApp: {
          appId,
          appMetadata,
        },
      }
    }

    const updateAppMessage = metadataToBytes(MemberRemarked, updateAppRemarked)
    await this.sendRemark(updateAppMessage)
    this.log(chalk.green(`Updated App with ID: ${appId}`))
  }
}
