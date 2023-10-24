import { flags } from '@oclif/command'
import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { WorkingGroups } from '../../Types'
import { u64 } from '@polkadot/types'

export default class VerifyValidatorAccountCommand extends WorkingGroupsCommandBase {
  static description = 'Membership lead/worker verifies validator membership profile'
  static flags = {
    message: flags.string({
      required: true,
      description: 'Membership ID of the validator to verify',
    }),

    ...WorkingGroupsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { message } = this.parse(VerifyValidatorAccountCommand).flags

    const members = await this.getApi().groupMembers(WorkingGroups.Membership)
    const lead = await this.getApi().groupLead(WorkingGroups.Membership)

    const membersRows = members.filter((m) => {
      let arrayValue: u64[] = [m.memberId]
      return this.getRequiredWorkerContext('MemberController', arrayValue)
    })

    if (!membersRows || membersRows.length === 0) {
      this.error('Only membership WG lead/worker can perform this command')
    } else {
      if (!lead) {
        this.getOriginalApi().tx.membershipWorkingGroup.workerRemark(Number(membersRows[0]), message!)
      } else {
        this.getOriginalApi().tx.membershipWorkingGroup.leadRemark(message)
      }
    }
  }
}
