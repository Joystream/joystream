import AccountsCommandBase, { ISelectedMember } from '../../base/AccountsCommandBase'
import chalk from 'chalk'
import { flags } from '@oclif/command'
import ExitCodes from '../../ExitCodes'

export default class AccountChoose extends AccountsCommandBase {
  static description = 'Choose default account to use in the CLI'
  static flags = {
    address: flags.string({
      description: 'Select account by address (if available)',
      char: 'a',
      required: false,
    }),
  }

  async run() {
    const { address } = this.parse(AccountChoose).flags

    const memberData = address
      ? await this.selectKnownMember(address)
      : await this.getRequiredMemberContext(undefined, false)

    await this.setSelectedMember(memberData)

    this.log(chalk.greenBright(`\nAccount switched to ${chalk.magentaBright(address)} (MemberId: ${memberData[0]})!`))
  }

  async selectKnownMember(address: string): Promise<ISelectedMember> {
    const knownMembersData = await this.getKnownMembers()
    const memberData = knownMembersData.find(([, member]) => member.controller_account.toString() === address)

    if (!memberData) {
      this.error(`Selected account address not found among known members!`, {
        exit: ExitCodes.AccessDenied,
      })
    }

    return memberData
  }
}
