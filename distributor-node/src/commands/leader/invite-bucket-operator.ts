import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'

export default class LeaderInviteBucketOperator extends AccountsCommandBase {
  static description = `Invite distribution bucket operator (distribution group worker).
  The specified bucket must not have any operator currently.
  Requires distribution working group leader permissions.`

  static flags = {
    bucketId: flags.integer({
      char: 'B',
      description: 'Distribution bucket id',
      required: true,
    }),
    familyId: flags.integer({
      char: 'f',
      description: 'Distribution bucket family id',
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
    const { bucketId, familyId, workerId } = this.parse(LeaderInviteBucketOperator).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log(`Inviting distribution bucket operator (bucket: ${bucketId}, worker: ${workerId})...`)
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.inviteDistributionBucketOperator(familyId, bucketId, workerId)
    )
    this.log('Bucket operator succesfully invited!')
  }
}
