import { flags } from '@oclif/command'
import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase from '../../command-base/default'

export default class LeaderCreateBucket extends AccountsCommandBase {
  static description = `Create new distribution bucket. Requires distribution working group leader permissions.`

  static flags = {
    family: flags.integer({
      char: 'f',
      description: 'Distribution bucket family id',
      required: true,
    }),
    acceptBags: flags.boolean({
      char: 'a',
      description: 'Whether the new bucket should accept new bags',
      default: false,
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { family, acceptBags } = this.parse(LeaderCreateBucket).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log('Creating new distribution bucket...')
    const result = await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.createDistributionBucket(family, acceptBags)
    )
    const event = this.api.getEvent(result, 'storage', 'DistributionBucketCreated')

    this.log('Bucket succesfully created!')
    const bucketId = event.data[0]
    this.output(bucketId.toString())
  }
}
