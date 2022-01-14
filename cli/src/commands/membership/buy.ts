import AccountsCommandBase from '../../base/AccountsCommandBase'
import { flags } from '@oclif/command'
import { IMembershipMetadata, MembershipMetadata } from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'
import chalk from 'chalk'

export default class MembershipBuy extends AccountsCommandBase {
  static description = 'Buy / register a new membership on the Joystream platform.'
  static aliases = ['membership:create', 'membership:register']
  static flags = {
    handle: flags.string({
      required: true,
      description: "Member's handle",
    }),
    name: flags.string({
      required: false,
      description: "Member's first name / full name",
    }),
    avatarUri: flags.string({
      required: false,
      description: "Member's avatar uri",
    }),
    about: flags.string({
      required: false,
      description: "Member's md-formatted about text (bio)",
    }),
    controllerKey: flags.string({
      required: false,
      description: "Member's controller key. Can also be provided interactively.",
    }),
    rootKey: flags.string({
      required: false,
      description: "Member's root key. Can also be provided interactively.",
    }),
    senderKey: flags.string({
      required: false,
      description: 'Tx sender key. If not provided, controllerKey will be used by default.',
    }),
  }

  async run(): Promise<void> {
    const api = this.getOriginalApi()
    let { handle, name, avatarUri, about, controllerKey, rootKey } = this.parse(MembershipBuy).flags
    if (!controllerKey) {
      controllerKey = await this.promptForAnyAddress('Choose member controller key')
    }
    if (!rootKey) {
      rootKey = await this.promptForAnyAddress('Choose member root key')
    }
    const senderKey = this.isKeyAvailable(controllerKey)
      ? controllerKey
      : await this.promptForAccount('Choose tx sender key')

    const metadata: IMembershipMetadata = {
      name,
      about,
      avatarUri,
    }
    this.jsonPrettyPrint(JSON.stringify({ rootKey, controllerKey, senderKey, handle, metadata }))
    await this.requireConfirmation('Do you confirm the provided input?')

    const result = await this.sendAndFollowTx(
      await this.getDecodedPair(senderKey),
      api.tx.members.buyMembership({
        root_account: rootKey,
        controller_account: controllerKey,
        handle,
        metadata: metadataToBytes(MembershipMetadata, metadata),
      })
    )

    const membeId = this.getEvent(result, 'members', 'MembershipBought').data[0]
    this.log(chalk.green(`Membership with id ${chalk.cyanBright(membeId.toString())} successfully created!`))
  }
}
