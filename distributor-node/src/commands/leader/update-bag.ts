import { createType } from '@joystream/types'
import { DistributionBucketIndexSet } from '@joystream/types/storage'
import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'

export default class LeaderUpdateBag extends AccountsCommandBase {
  static description = 'Add/remove distribution buckets from a bag.'

  static flags = {
    bagId: flags.bagId({
      char: 'b',
      required: true,
    }),
    familyId: flags.integer({
      char: 'f',
      description: 'ID of the distribution bucket family',
      required: true,
    }),
    add: flags.integer({
      char: 'a',
      description: 'Index(es) (within the family) of bucket(s) to add to the bag',
      default: [],
      multiple: true,
    }),
    remove: flags.integer({
      char: 'r',
      description: 'Index(es) (within the family) of bucket(s) to remove from the bag',
      default: [],
      multiple: true,
    }),
    ...DefaultCommandBase.flags,
  }

  static examples = [`$ joystream-distributor leader:update-bag -b 1 -f 1 -a 1 2 3 -r 4 5`]

  async run(): Promise<void> {
    const { bagId, familyId, add, remove } = this.parse(LeaderUpdateBag).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log(`Updating distribution buckets for bag...`, { bagId: bagId.toHuman(), familyId, add, remove })
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.updateDistributionBucketsForBag(
        bagId,
        familyId,
        createType<DistributionBucketIndexSet, 'DistributionBucketIndexSet'>('DistributionBucketIndexSet', add),
        createType<DistributionBucketIndexSet, 'DistributionBucketIndexSet'>('DistributionBucketIndexSet', remove)
      )
    )
    this.log('Bag succesfully updated!')
  }
}
