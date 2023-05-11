import { flags } from '@oclif/command'
import chalk from 'chalk'
import { IMemberRemarked, MemberRemarked } from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'
import { getInputJson } from '../../helpers/InputOutput'
import AppCommandBase from '../../base/AppCommandBase'
import MembershipsCommandBase from '../../base/MembershipsCommandBase'
import { AppInputDetails } from '../../Types'

export default class UpdateApp extends AppCommandBase {
  static description = 'Updates app of given ID'

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
      dependsOn: ['input'],
    }),
    ...MembershipsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { input, appId, skip } = this.parse(UpdateApp).flags
    await this.getRequiredMemberContext(true)

    const defaults: Partial<AppInputDetails> = input ? await getInputJson<Partial<AppInputDetails>>(input) : {}
    const appMetadata = skip ? defaults : await this.promptAppMetadata(defaults)
    const updateAppRemarked: IMemberRemarked = {
      updateApp: {
        appId,
        appMetadata: {
          ...appMetadata,
        },
      },
    }

    this.jsonPrettyPrint(JSON.stringify(appMetadata))
    await this.requireConfirmation('Do you confirm the provided input?', true)

    const updateAppMessage = metadataToBytes(MemberRemarked, updateAppRemarked)
    await this.sendRemark(updateAppMessage)
    this.log(chalk.green(`Member remark transaction successful!`))
  }
}
