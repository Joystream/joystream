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
    add: flags.integerArr({
      char: 'a',
      description: 'IDs of buckets to add to bag',
      default: [],
    }),
    remove: flags.integerArr({
      char: 'r',
      description: 'IDs of buckets to remove from bag',
      default: [],
    }),
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { bagId, familyId, add, remove } = this.parse(LeaderUpdateBag).flags
    const leadKey = await this.getDistributorLeadKey()

    this.log(
      `Updating distribution buckets for bag ${bagId} (adding: ${add.join(',' || 'NONE')}, removing: ${
        remove.join(',') || 'NONE'
      })...`
    )
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.updateDistributionBucketsForBag(
        bagId,
        familyId,
        this.api.createType('DistributionBucketIdSet', add),
        this.api.createType('DistributionBucketIdSet', remove)
      )
    )
    this.log('Bag succesfully updated!')
  }
}
