import { PalletStorageStorageBucketRecord } from '@polkadot/types/lookup'
import { FinalSummary, Serialized } from 'storage-node/src/services/helpers/bagsUpdate'
import { BaseQueryNodeFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { Api } from '../../Api'
import { assert } from 'chai'
import { StorageCLI } from '../../cli/storage'

export type EmptyBucketFixtureParams = {
  id: number
}

export class EmptyBucketFixture extends BaseQueryNodeFixture {
  constructor(public api: Api, public query: QueryNodeApi, private params: EmptyBucketFixtureParams) {
    super(api, query)
  }

  private async setupStorageCLI() {
    const leaderKey = await this.api.getLeadRoleKey('storageWorkingGroup')
    const cli = new StorageCLI(this.api.getSuri(leaderKey))
    return cli
  }

  private async checkResultAgainsExpectations(
    result: Serialized<FinalSummary>,
    storageBucketBefore: PalletStorageStorageBucketRecord
  ) {
    const expectedStorageUsageBefore = storageBucketBefore.voucher.sizeUsed.toNumber()
    assert.equal(result.totalStorageUsage.before, expectedStorageUsageBefore.toString())
    assert.equal(result.totalStorageUsage.after, '0')
    assert(result.transactions)
    // Expecting 1 batch transaction only!
    const expectedNumUpdates = storageBucketBefore.assignedBags.toNumber()
    assert.equal(result.transactions[0].failedUpdates.length, 0)
    assert.equal(result.transactions[0].successfulUpdates.length, expectedNumUpdates)
    assert.equal(result.transactions[0].totalStorageUsage.before, expectedStorageUsageBefore.toString())
    assert.equal(result.transactions[0].totalStorageUsage.after, '0')
    assert(result.buckets)
    assert.equal(result.buckets.length, 1)
    const [resultBucket] = result.buckets
    assert.equal(resultBucket.id, this.params.id)
    assert.equal(resultBucket.storageUsed.before, expectedStorageUsageBefore.toString())
    assert.equal(resultBucket.storageUsed.after, '0')
    assert.equal(resultBucket.added.bags.length, 0)
    assert.equal(resultBucket.added.totalSize, '0')
    assert.equal(resultBucket.failedToAdd.bags.length, 0)
    assert.equal(resultBucket.failedToAdd.totalSize, '0')
    assert.equal(resultBucket.failedToRemove.bags.length, 0)
    assert.equal(resultBucket.failedToRemove.totalSize, '0')
    assert.equal(resultBucket.removed.bags.length, expectedNumUpdates)
    assert.equal(resultBucket.removed.totalSize, expectedStorageUsageBefore.toString())
  }

  private async checkResultAgainstNewChainState(result: Serialized<FinalSummary>): Promise<void> {
    const storageBucketAfter = await this.fetchBucket()

    assert.equal(result.totalStorageUsage.after, storageBucketAfter.voucher.sizeUsed.toString())
    assert(result.buckets)
    assert.equal(result.buckets[0].storageUsed.after, storageBucketAfter.voucher.sizeUsed.toString())
  }

  private async fetchBucket(): Promise<PalletStorageStorageBucketRecord> {
    return (await this.api.query.storage.storageBucketById(this.params.id)).unwrap()
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    const { id } = this.params
    const storageBucketBefore = await this.fetchBucket()
    const storageCli = await this.setupStorageCLI()
    const flags = ['--id', id.toString(), '--skipConfirmation']
    const { out } = await storageCli.run('leader:empty-bucket', flags)
    const result: Serialized<FinalSummary> = JSON.parse(out)

    await this.checkResultAgainsExpectations(result, storageBucketBefore)
    await this.checkResultAgainstNewChainState(result)
  }
}
