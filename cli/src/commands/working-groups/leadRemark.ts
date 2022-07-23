import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { apiModuleByGroup } from '../../Api'
import chalk from 'chalk'

export default class WorkingGroupsLeadRemark extends WorkingGroupsCommandBase {
  static description = 'Working group lead remarks'
  static args = [
    {
      name: 'message',
      required: true,
      description: 'Remark message',
    },
  ]

  static flags = {
    ...WorkingGroupsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { message } = this.parse(WorkingGroupsLeadRemark).args

    // ensure lead is using this command
    const lead = await this.getRequiredLeadContext()

    await this.sendAndFollowNamedTx(
      await this.getDecodedPair(lead.roleAccount.toString()),
      apiModuleByGroup[this.group],
      'leadRemark',
      [message]
    )

    this.log(chalk.green(`Lead remarked successfully`))
  }
}
