import { flags } from '@oclif/command'
import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { WorkingGroups } from '../../Types'
import { createType } from '@joystream/types'
import { VerifyValidator, RemarkMetadataAction } from '@joystream/metadata-protobuf'
import { metadataToString } from '../../helpers/serialization'
import Long from 'long'
export default class VerifyValidatorAccountCommand extends WorkingGroupsCommandBase {
  static description = 'Membership lead/worker verifies validator membership profile'
  static flags = {
    memberId: flags.string({
      required: true,
      description: 'Membership ID of the validator to verify',
    }),
    isVerified: flags.boolean({
      required: true,
      description: 'Verification state of the validator',
    }),

    ...WorkingGroupsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { memberId, isVerified } = this.parse(VerifyValidatorAccountCommand).flags
    const api = this.getOriginalApi()

    const id = Long.fromNumber(memberId);
    const meta = new RemarkMetadataAction({
      verifyValidator: new VerifyValidator({
        memberId: id,
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
      api.tx.membershipWorkingGroup.workerRemark(worker.memberId, message)
    }

    await this.setPreservedState({ defaultWorkingGroup: nowGroup })
  }
}
