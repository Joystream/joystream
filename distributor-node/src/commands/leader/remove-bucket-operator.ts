import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'

export default class LeaderRemoveBucketOperator extends AccountsCommandBase {
  static description = `Remove distribution bucket operator (distribution group worker).
  Requires distribution working group leader permissions.`

  static flags = {
    bucketId: flags.bucketId({
      required: true,
    }),
    workerId: flags.integer({
      char: 'w',
      description: 'ID of the operator (distribution working group worker) to remove from the bucket',
      required: true,
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { bucketId, workerId } = this.parse(LeaderRemoveBucketOperator).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log(`Removing distribution bucket operator...`, {
      bucketId: bucketId.toHuman(),
      workerId,
    })
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.removeDistributionBucketOperator(bucketId, workerId)
    )
    this.log('Bucket operator succesfully removed!')
  }
}
