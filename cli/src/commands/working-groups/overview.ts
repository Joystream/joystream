import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { displayHeader, displayNameValueTable, displayTable, shortAddress } from '../../helpers/display'
import { formatBalance } from '@polkadot/util'

import chalk from 'chalk'

export default class WorkingGroupsOverview extends WorkingGroupsCommandBase {
  static description = 'Shows an overview of given working group (current lead and workers)'
  static flags = {
    ...WorkingGroupsCommandBase.flags,
  }

  async run() {
    const lead = await this.getApi().groupLead(this.group)
    const members = await this.getApi().groupMembers(this.group)

    displayHeader('Group lead')
    if (lead) {
      displayNameValueTable([
        { name: 'Member id:', value: lead.memberId.toString() },
        { name: 'Member handle:', value: lead.profile.handle.toString() },
        { name: 'Role account:', value: lead.roleAccount.toString() },
      ])
    } else {
      this.log(chalk.yellow('No lead assigned!'))
    }

    const accounts = this.fetchAccounts()

    displayHeader('Members')
    const membersRows = members.map((m) => ({
      'Worker id': m.workerId.toString(),
      'Member id': m.memberId.toString(),
      'Member handle': m.profile.handle.toString(),
      Stake: formatBalance(m.stake),
      Earned: formatBalance(m.reward?.totalRecieved),
      'Role account': shortAddress(m.roleAccount),
      '':
        (lead?.workerId.eq(m.workerId) ? '\u{2B50}' : '  ') +
        ' ' +
        (accounts.some((a) => a.address === m.roleAccount.toString()) ? '\u{1F511}' : '  '),
    }))
    displayTable(membersRows, 5)

    displayHeader('Legend')
    this.log('\u{2B50} - Leader')
    this.log('\u{1F511} - Role key available in CLI')
  }
}
