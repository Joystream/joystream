import { flags } from '@oclif/command'
import chalk from 'chalk'
import { IMemberRemarked, MemberRemarked } from '@joystream/metadata-protobuf'
import ExitCodes from '../../ExitCodes'
import { metadataToBytes } from '../../helpers/serialization'
import { getInputJson } from '../../helpers/InputOutput'
import AppCommandBase from '../../base/AppCommandBase'
import { AppInputDetails } from 'src/Types'
import MembershipsCommandBase from '../../base/MembershipsCommandBase'

export default class GenerateAppCreationMessage extends AppCommandBase {
  static description = 'App creation message factory'

  static flags = {
    input: flags.string({
      required: false,
      char: 'i',
      description: `Path to JSON file containing app details`,
    }),
    skip: flags.boolean({
      char: 's',
      description: "If true command won't prompt missing fields",
    }),
    ...MembershipsCommandBase.flags,
  }

  async run(): Promise<void> {
    let createAppRemarked: IMemberRemarked | null
    const { input, skip } = this.parse(GenerateAppCreationMessage).flags
    if (input) {
      const inputBody = await getInputJson<AppInputDetails>(input)
      const name = inputBody.name || (await this.promptAppName())
      const appMetadata = skip ? inputBody : await this.promptAppMetadata(inputBody)

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
    const message = metadataToBytes(MemberRemarked, createAppRemarked)
    const memberId = await this.sendRemark(message)
    this.log(chalk.green(`App created with owner member ID: ${memberId}`))
  }

  async promptAppName(): Promise<string> {
    const name = await this.simplePrompt<string>({ message: 'App name?' })
    if (!name) {
      this.error('Name is required', { exit: ExitCodes.InvalidInput })
    }
    return name
  }
}
