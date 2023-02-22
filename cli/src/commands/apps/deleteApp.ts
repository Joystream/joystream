import { flags } from '@oclif/command'
import chalk from 'chalk'
import { IMemberRemarked, MemberRemarked } from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'
import AppCommandBase from '../../base/AppCommandBase'
import MembershipsCommandBase from '../../base/MembershipsCommandBase'

export default class GenerateAppCreationMessage extends AppCommandBase {
  static description = 'App creation message factory'

  static flags = {
    appId: flags.string({
      required: true,
      description: `ID of the app to delete`,
    }),
    ...MembershipsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { appId } = this.parse(GenerateAppCreationMessage).flags
    const deleteAppRemarked: IMemberRemarked = {
      deleteApp: {
        appId,
      },
    }

    const deleteAppMessage = metadataToBytes(MemberRemarked, deleteAppRemarked)
    await this.sendRemark(deleteAppMessage)
    this.log(chalk.green(`Deleted app with ID: ${appId}`))
  }
}
