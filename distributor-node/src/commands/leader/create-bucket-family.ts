import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase from '../../command-base/default'

export default class LeaderCreateBucketFamily extends AccountsCommandBase {
  static description = `Create new distribution bucket family. Requires distribution working group leader permissions.`

  static flags = {
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const leadKey = await this.getDistributorLeadKey()

    this.log('Creating new distribution bucket family...')
    const result = await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.createDistributionBucketFamily()
    )
    const event = this.api.getEvent(result, 'storage', 'DistributionBucketFamilyCreated')

    this.log('Bucket family succesfully created!')
    const bucketFamilyId = event.data[0]
    this.output(bucketFamilyId.toString())
  }
}
