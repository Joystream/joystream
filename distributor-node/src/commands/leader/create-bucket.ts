import { flags } from '@oclif/command'
import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase from '../../command-base/default'

export default class LeaderCreateBucket extends AccountsCommandBase {
  static description = `Create new distribution bucket. Requires distribution working group leader permissions.`

  static flags = {
    familyId: flags.integer({
      char: 'f',
      description: 'Distribution bucket family id',
      required: true,
    }),
    acceptingBags: flags.enum({
      char: 'a',
      description: 'Whether the created bucket should accept new bags',
      options: ['yes', 'no'],
      default: 'no',
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { familyId, acceptingBags } = this.parse(LeaderCreateBucket).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log('Creating new distribution bucket...')
    const result = await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.createDistributionBucket(familyId, acceptingBags === 'yes')
    )
    const event = this.api.getEvent(result, 'storage', 'DistributionBucketCreated')

    this.log('Bucket succesfully created!')
    const bucketId = event.data[2]
    this.output(bucketId.toString())
  }
}
