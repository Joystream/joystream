import { flags } from '@oclif/command'
import chalk from 'chalk'
import { IMemberRemarked, MemberRemarked } from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'
import AppCommandBase from '../../base/AppCommandBase'
import MembershipsCommandBase from '../../base/MembershipsCommandBase'

export default class DeleteApp extends AppCommandBase {
  static description = 'Deletes app of given ID'

  static flags = {
    appId: flags.string({
      required: true,
      description: `ID of the app to delete`,
    }),
    ...MembershipsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { appId } = this.parse(DeleteApp).flags
    await this.getRequiredMemberContext(true)

    const deleteAppRemarked: IMemberRemarked = {
      deleteApp: {
        appId,
      },
    }

    await this.requireConfirmation(`Are you sure you want to remove app ${chalk.magentaBright(appId)}?`)

    const deleteAppMessage = metadataToBytes(MemberRemarked, deleteAppRemarked)
    await this.sendRemark(deleteAppMessage)
    this.log(chalk.green(`Member remark transaction successful!`))
  }
}
