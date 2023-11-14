import { flags } from '@oclif/command'
import chalk from 'chalk'
import { IMemberRemarked, MemberRemarked } from '@joystream/metadata-protobuf'
import ExitCodes from '../../ExitCodes'
import { metadataToBytes } from '../../helpers/serialization'
import { getInputJson } from '../../helpers/InputOutput'
import AppCommandBase from '../../base/AppCommandBase'
import { AppInputDetails } from 'src/Types'
import MembershipsCommandBase from '../../base/MembershipsCommandBase'

export default class CreateApp extends AppCommandBase {
  static description = 'Creates app for current member'

  static flags = {
    input: flags.string({
      required: false,
      char: 'i',
      description: `Path to JSON file containing app details`,
    }),
    skip: flags.boolean({
      char: 's',
      description: "If true command won't prompt missing fields",
      dependsOn: ['input'],
    }),
    ...MembershipsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { input, skip } = this.parse(CreateApp).flags
    await this.getRequiredMemberContext(true)

    const defaults: Partial<AppInputDetails> = input ? await getInputJson<Partial<AppInputDetails>>(input) : {}
    const name = defaults?.name || (await this.promptAppName())
    const appMetadata = skip ? defaults : await this.promptAppMetadata(defaults)
    const createAppRemarked: IMemberRemarked = {
      createApp: {
        name,
        appMetadata,
      },
    }

    this.jsonPrettyPrint(JSON.stringify({ name, ...appMetadata }))
    await this.requireConfirmation('Do you confirm the provided input?', true)

    const message = metadataToBytes(MemberRemarked, createAppRemarked)
    await this.sendRemark(message)
    this.log(chalk.green(`Member remark transaction successful!`))
  }

  async promptAppName(): Promise<string> {
    const name = await this.simplePrompt<string>({ message: 'App name?' })
    if (!name) {
      this.error('Name is required', { exit: ExitCodes.InvalidInput })
    }
    return name
  }
}
