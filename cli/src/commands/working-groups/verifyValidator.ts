import { flags } from '@oclif/command'
import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { WorkingGroups } from '../../Types'

export default class MembershipValidatorAccountCommand extends WorkingGroupsCommandBase {
  static description = 'Membership lead/worker verifies validator membership profile'
  static flags = {
    message: flags.string({
      required: true,
      description: 'Memberhip ID of the validator to verify',
    }),

    ...WorkingGroupsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { message } = this.parse(MembershipValidatorAccountCommand).flags

    const members = await this.getApi().groupMembers(WorkingGroups.Membership)
    const lead = await this.getApi().groupLead(WorkingGroups.Membership)
    // const lead = await this.getRequiredLeadContext()
    const pairs = this.getPairs()

    const membersRows = members.filter((m) =>
      pairs.find((p) => p.address === m.roleAccount.toString()) ? m.memberId.toString() : undefined
    )

    if (!membersRows || membersRows.length === 0) {
      this.error('Only membership WG lead/worker can perform this command')
    } else {
      if (!lead) {
        this.log("You are lead");
        this.getOriginalApi().tx.membershipWorkingGroup.workerRemark(Number(membersRows[0]), message!)
      } else {
        this.getOriginalApi().tx.membershipWorkingGroup.leadRemark(message)
      }
    }
  }
}
