import { flags } from '@oclif/command'
import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { WorkingGroups } from '../../Types'
import { VerifyValidator, ModeratePost } from '@joystream/metadata-protobuf'
import { metadataToString } from '../../helpers/serialization'

export default class VerifyValidatorAccountCommand extends WorkingGroupsCommandBase {
  static description = 'Membership lead/worker verifies validator membership profile'
  static flags = {
    memberId: flags.string({
      required: true,
      description: 'Membership ID of the validator to verify',
    }),
    isVerified: flags.string({
      required: true,
      description: 'Membership ID of the validator to verify',
    }),

    ...WorkingGroupsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { memberId, isVerified } = this.parse(VerifyValidatorAccountCommand).flags

    const meta = new ModeratePost({
      createVideoCategory: new VerifyValidator({
        memberId,
        isVerified,
      }),
    })
    const message = metadataToString(ModeratePost, meta)

    const nowGroup = this.group;

    await this.setPreservedState({ defaultWorkingGroup: WorkingGroups.Membership })
    const worker = await this.getRequiredWorkerContext()

    if (!worker) {
      this.error('Only membership WG lead/worker can perform this command')
    } else {
      this.getOriginalApi().tx.membershipWorkingGroup.workerRemark(Number(worker), message)
    }

    await this.setPreservedState({ defaultWorkingGroup: nowGroup });
  }
}
