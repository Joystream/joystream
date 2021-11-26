import { flags } from '@oclif/command'
import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase from '../../command-base/default'

export default class LeaderUpdateBucketStatus extends AccountsCommandBase {
  static description = `Update distribution bucket status ("acceptingNewBags" flag). Requires distribution working group leader permissions.`

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
    acceptingBags: flags.enum<'yes' | 'no'>({
      char: 'a',
      description: 'Whether the bucket should accept new bags',
      options: ['yes', 'no'],
      required: true,
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { bucketId, familyId, acceptingBags } = this.parse(LeaderUpdateBucketStatus).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log(`Updating distribution bucket status (${bucketId}, acceptingNewBags: ${acceptingBags})...`)
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.updateDistributionBucketStatus(familyId, bucketId, acceptingBags === 'yes')
    )
    this.log('Bucket status succesfully updated!')
  }
}
