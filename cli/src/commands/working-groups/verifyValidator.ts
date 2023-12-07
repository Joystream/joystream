import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { WorkingGroups } from '../../Types'
import { VerifyValidator, RemarkMetadataAction } from '@joystream/metadata-protobuf'
import { metadataToString } from '../../helpers/serialization'

export default class VerifyValidatorAccountCommand extends WorkingGroupsCommandBase {
  static description = 'Membership lead/worker verifies validator membership profile'
  static args = [{
    name: "memberId",
    required: true,
    description: 'Membership ID of the validator to verify',
  },
  {

    name: "isVerified",
    required: true,
    description: 'Verification state of the validator',
  }
  ]

  static flags = {
    ...WorkingGroupsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { memberId, isVerified } = this.parse(VerifyValidatorAccountCommand).args

    const meta = new RemarkMetadataAction({
      verifyValidator: new VerifyValidator({
        memberId,
        isVerified,
      }),
    })
    const message = metadataToString(RemarkMetadataAction, meta)

    const nowGroup = this.group

    await this.setPreservedState({ defaultWorkingGroup: WorkingGroups.Membership })
    const worker = await this.getRequiredWorkerContext()

    if (!worker) {
      this.error('Only membership WG lead/worker can perform this command')
    } else {
      this.getOriginalApi().tx.membershipWorkingGroup.workerRemark(Number(worker), message)
    }

    await this.setPreservedState({ defaultWorkingGroup: nowGroup })
  }
}
