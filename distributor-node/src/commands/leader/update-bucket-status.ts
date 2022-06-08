import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'

export default class LeaderUpdateBucketStatus extends AccountsCommandBase {
  static description = `Update distribution bucket status ("acceptingNewBags" flag). Requires distribution working group leader permissions.`

  static flags = {
    bucketId: flags.bucketId({
      required: true,
    }),
    acceptingBags: flags.enum<'yes' | 'no'>({
      char: 'a',
      description: 'Whether the bucket should accept new bags',
      options: ['yes', 'no'],
      required: true,
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { bucketId, acceptingBags } = this.parse(LeaderUpdateBucketStatus).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log(`Updating distribution bucket status...`, { bucketId: bucketId.toHuman(), acceptingBags })
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.updateDistributionBucketStatus(bucketId, acceptingBags === 'yes')
    )
    this.log('Bucket status succesfully updated!')
  }
}
