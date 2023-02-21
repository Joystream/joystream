import { flags } from '@oclif/command'
import chalk from 'chalk'
import { IMemberRemarked, MemberRemarked } from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'
import AppCommandBase from '../../base/AppCommandBase'

export default class GenerateAppCreationMessage extends AppCommandBase {
  static description = 'App creation message factory'

  static flags = {
    appId: flags.string({
      required: true,
      description: `ID of the app to delete`,
    }),
  }

  async run(): Promise<void> {
    const { appId } = this.parse(GenerateAppCreationMessage).flags
    const createAppRemarked: IMemberRemarked = {
      deleteApp: {
        appId,
      },
    }
    this.log(chalk.green(`App commitment: ${metadataToBytes(MemberRemarked, createAppRemarked)}`))
  }
}
