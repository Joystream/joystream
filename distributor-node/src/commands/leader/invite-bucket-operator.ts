import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'

export default class LeaderInviteBucketOperator extends AccountsCommandBase {
  static description = `Invite distribution bucket operator (distribution group worker).
  The specified bucket must not have any operator currently.
  Requires distribution working group leader permissions.`

  static flags = {
    bucketId: flags.bucketId({
      required: true,
    }),
    workerId: flags.integer({
      char: 'w',
      description: 'ID of the distribution group worker to invite as bucket operator',
      required: true,
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { bucketId, workerId } = this.parse(LeaderInviteBucketOperator).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log(`Inviting distribution bucket operator...`, {
      bucketId: bucketId.toHuman(),
      workerId,
    })
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.inviteDistributionBucketOperator(bucketId, workerId)
    )
    this.log('Bucket operator succesfully invited!')
  }
}
