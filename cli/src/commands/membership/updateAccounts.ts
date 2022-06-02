import { flags } from '@oclif/command'
import chalk from 'chalk'
import MembershipsCommandBase from '../../base/MembershipsCommandBase'

export default class MembershipUpdateAccountsCommand extends MembershipsCommandBase {
  static description = 'Update existing membership accounts/keys (root / controller).'
  static flags = {
    newControllerAccount: flags.string({
      required: false,
      description: "Member's new controller account/key",
    }),
    newRootAccount: flags.string({
      required: false,
      description: "Member's new root account/key",
    }),
    ...MembershipsCommandBase.flags,
  }

  async run(): Promise<void> {
    const api = this.getOriginalApi()
    const { newControllerAccount, newRootAccount } = this.parse(MembershipUpdateAccountsCommand).flags
    const {
      id: memberId,
      membership: { root_account: rootKey },
    } = await this.getRequiredMemberContext(false, undefined, 'root')

    this.jsonPrettyPrint(JSON.stringify({ memberId, newControllerAccount, newRootAccount }))
    await this.requireConfirmation('Do you confirm the provided input?')

    await this.sendAndFollowTx(
      await this.getDecodedPair(rootKey),
      api.tx.members.updateAccounts(memberId, newRootAccount ?? null, newControllerAccount ?? null)
    )

    this.log(chalk.green(`Accounts of member ${chalk.cyanBright(memberId.toString())} successfully updated!`))
  }
}
