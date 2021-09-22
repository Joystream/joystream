import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'

export default class LeaderRemoveBucketOperator extends AccountsCommandBase {
  static description = `Remove distribution bucket operator (distribution group worker).
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
      description: 'ID of the operator (distribution working group worker) to remove from the bucket',
      required: true,
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { bucketId, familyId, workerId } = this.parse(LeaderRemoveBucketOperator).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log(`Removing distribution bucket operator (bucket: ${bucketId}, worker: ${workerId})...`)
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.removeDistributionBucketOperator(familyId, bucketId, workerId)
    )
    this.log('Bucket operator succesfully removed!')
  }
}
