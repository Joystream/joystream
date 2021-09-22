import { flags } from '@oclif/command'
import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase from '../../command-base/default'

export default class LeaderDeleteBucket extends AccountsCommandBase {
  static description = `Delete distribution bucket. The bucket must have no operators. Requires distribution working group leader permissions.`

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
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { bucketId, familyId } = this.parse(LeaderDeleteBucket).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log(`Deleting distribution bucket (${bucketId})...`)
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.deleteDistributionBucket(familyId, bucketId)
    )
    this.log('Bucket succesfully deleted!')
  }
}
