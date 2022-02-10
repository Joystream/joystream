import MembershipsCommandBase from '../../base/MembershipsCommandBase'
import { MemberDetails } from '../../Types'
import chalk from 'chalk'
import { flags } from '@oclif/command'
import ExitCodes from '../../ExitCodes'

export default class AccountChooseMember extends MembershipsCommandBase {
  static description = 'Choose default member to use in the CLI'
  static flags = {
    memberId: flags.string({
      description: 'Select member (if available)',
      char: 'm',
      required: false,
    }),
    ...MembershipsCommandBase.flags,
  }

  async run() {
    const { memberId } = this.parse(AccountChooseMember).flags

    const selectedMember = memberId
      ? await this.selectKnownMember(memberId)
      : await this.getRequiredMemberContext(false)

    await this.setSelectedMember(selectedMember)

    this.log(
      chalk.greenBright(
        `\nMember switched to id ${chalk.magentaBright(
          selectedMember.id
        )} (account: ${selectedMember.membership.controller_account.toString()})!`
      )
    )
  }

  async selectKnownMember(memberIdString: string): Promise<MemberDetails> {
    const memberId = this.createType('MemberId', memberIdString)
    const members = await this.getApi().membersDetailsByIds([memberId])

    if (!members.length) {
      this.error(`Selected member id not found among known members!`, {
        exit: ExitCodes.AccessDenied,
      })
    }

    const selectedMember = members[0]

    if (!this.isKeyAvailable(selectedMember.membership.controller_account)) {
      this.error(`Selected member's account is not imported to CLI!`, {
        exit: ExitCodes.AccessDenied,
      })
    }

    return selectedMember
  }
}
