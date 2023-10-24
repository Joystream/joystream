import { flags } from '@oclif/command'
import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { WorkingGroups } from '../../Types'

export default class VerifyValidatorAccountCommand extends WorkingGroupsCommandBase {
  static description = 'Membership lead/worker verifies validator membership profile'
  static flags = {
    memberId: flags.string({
      required: true,
      description: 'Membership ID of the validator to verify',
    }),

    ...WorkingGroupsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { memberId } = this.parse(VerifyValidatorAccountCommand).flags

    const members = await this.getApi().groupMembers(WorkingGroups.Membership)
    const worker = await this.getRequiredWorkerContext()

    const membersRows = members.find(((m) => m === worker))

    if (!membersRows) {
      this.error('Only membership WG lead/worker can perform this command')
    } else {
      this.getOriginalApi().tx.membershipWorkingGroup.workerRemark(Number(membersRows), memberId!)
    }
  }
}
