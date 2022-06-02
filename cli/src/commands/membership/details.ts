import { flags } from '@oclif/command'
import chalk from 'chalk'
import AccountsCommandBase from '../../base/AccountsCommandBase'
import { displayCollapsedRow, displayHeader, memberHandle } from '../../helpers/display'

export default class MembershipDetailsCommand extends AccountsCommandBase {
  static description = 'Display membership details by specified memberId.'
  static aliases = ['membership:info', 'membership:inspect', 'membership:show']
  static flags = {
    memberId: flags.integer({
      required: true,
      char: 'm',
      description: 'Member id',
    }),
  }

  async run(): Promise<void> {
    const { memberId } = this.parse(MembershipDetailsCommand).flags
    const details = await this.getApi().expectedMemberDetailsById(memberId)

    displayCollapsedRow({
      'ID': details.id.toString(),
      'Handle': memberHandle(details),
      'IsVerified': details.membership.verified.toString(),
      'Invites': details.membership.invites.toNumber(),
    })

    if (details.meta) {
      displayHeader(`Metadata`)
      displayCollapsedRow({
        'Name': details.meta.name || chalk.gray('NOT SET'),
        'About': details.meta.about || chalk.gray('NOT SET'),
      })
    }

    displayHeader('Keys')
    displayCollapsedRow({
      'Root': details.membership.root_account.toString(),
      'Controller': details.membership.controller_account.toString(),
    })
  }
}
