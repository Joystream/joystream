import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'

export default class LeaderDeleteBucket extends AccountsCommandBase {
  static description = `Delete distribution bucket. The bucket must have no operators. Requires distribution working group leader permissions.`

  static flags = {
    bucketId: flags.bucketId({
      required: true,
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { bucketId } = this.parse(LeaderDeleteBucket).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log(`Deleting distribution bucket...`, { bucketId: bucketId.toHuman() })
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.deleteDistributionBucket(bucketId)
    )
    this.log('Bucket succesfully deleted!')
  }
}
