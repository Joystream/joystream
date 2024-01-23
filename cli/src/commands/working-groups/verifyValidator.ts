import { flags } from '@oclif/command'
import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { WorkingGroups } from '../../Types'
import { VerifyValidator, RemarkMetadataAction } from '@joystream/metadata-protobuf'
import { metadataToString } from '../../helpers/serialization'
import Long from 'long'
import chalk from 'chalk'

export default class VerifyValidatorCommand extends WorkingGroupsCommandBase {
  static description = 'Membership lead/worker verifies validator membership profile'

  static args = [
    {
      name: 'memberId',
      required: true,
      description: 'Membership ID of the validator to verify',
    },
  ]

  static flags = {
    unverify: flags.boolean({
      default: false,
      description: 'Verification state of the validator',
    }),

    ...WorkingGroupsCommandBase.flags,
  }

  async init(): Promise<void> {
    await super.init()
    this._group = WorkingGroups.Membership
  }

  async run(): Promise<void> {
    const { args, flags } = this.parse(VerifyValidatorCommand)
    const memberId = Long.fromNumber(args.memberId)
    const verifyValidator = !flags.unverify

    const meta = new RemarkMetadataAction({
      verifyValidator: new VerifyValidator({
        memberId,
        isVerified: verifyValidator,
      }),
    })

    const worker = await this.getRequiredWorkerContext()

    if (!worker) {
      return this.error('Only membership workers can perform this command')
    }

    const message = metadataToString(RemarkMetadataAction, meta)

    const keyPair = await this.getDecodedPair(worker.roleAccount)
    await this.sendAndFollowNamedTx(keyPair, 'membershipWorkingGroup', 'workerRemark', [worker.workerId, message])

    this.log(chalk.green(`The validator profile ${args.memberId} is now${verifyValidator ? '' : ' not'} verified`))
  }
}
