import _ from 'lodash'
import { PalletStorageStorageBucketRecord } from '@polkadot/types/lookup'
import { FinalSummary, Serialized } from 'storage-node/src/services/helpers/bagsUpdate'
import { BaseQueryNodeFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { Api } from '../../Api'
import { assert } from 'chai'
import { StorageCLI } from '../../cli/storage'

export type CopyBagsFixtureParams = {
  from: number[]
  to: number[]
  copies?: number
  expectedStorageIncrease: number
}

export class CopyBagsFixture extends BaseQueryNodeFixture {
  private bucketIds: number[] = []

  constructor(public api: Api, public query: QueryNodeApi, private params: CopyBagsFixtureParams) {
    super(api, query)
  }

  private async setupStorageCLI() {
    const leaderKey = await this.api.getLeadRoleKey('storageWorkingGroup')
    const cli = new StorageCLI(this.api.getSuri(leaderKey))
    return cli
  }

  private async checkResultAgainsExpectations(
    result: Serialized<FinalSummary>,
    storageBucketsBefore: (readonly [number, PalletStorageStorageBucketRecord])[]
  ) {
    const { from, to, copies = 1, expectedStorageIncrease } = this.params
    const expectedStorageUsageBefore = _.sumBy(storageBucketsBefore, ([, b]) => b.voucher.sizeUsed.toNumber())
    const expectedStorageUsageAfter = expectedStorageUsageBefore + expectedStorageIncrease
    assert.equal(result.totalStorageUsage.before, expectedStorageUsageBefore.toString())
    assert.equal(result.totalStorageUsage.after, expectedStorageUsageAfter.toString())
    assert(result.transactions)
    // Expecting 1 batch transaction only!
    const expectedNumUpdates = _.sumBy(storageBucketsBefore, ([id, bucket]) =>
      from.includes(id) ? bucket.assignedBags.toNumber() : 0
    )
    assert.equal(result.transactions[0].failedUpdates.length, 0)
    assert.equal(result.transactions[0].successfulUpdates.length, expectedNumUpdates)
    assert.equal(result.transactions[0].totalStorageUsage.before, expectedStorageUsageBefore.toString())
    assert.equal(result.transactions[0].totalStorageUsage.after, expectedStorageUsageAfter.toString())
    const resultBuckets = result.buckets
    assert(resultBuckets)
    assert.sameMembers(
      resultBuckets.map((b) => b.id),
      [...from, ...to]
    )
    for (const bucketId of from) {
      const [, bucketBefore] = storageBucketsBefore.find(([id]) => id === bucketId) || []
      const resultBucket = resultBuckets.find(({ id }) => id === bucketId)
      assert(bucketBefore)
      assert(resultBucket)
      assert.equal(resultBucket.storageUsed.before, bucketBefore.voucher.sizeUsed.toString())
      assert.equal(resultBucket.storageUsed.after, bucketBefore.voucher.sizeUsed.toString())
      assert.equal(resultBucket.added.bags.length, 0)
      assert.equal(resultBucket.added.totalSize, '0')
      assert.equal(resultBucket.failedToAdd.bags.length, 0)
      assert.equal(resultBucket.failedToAdd.totalSize, '0')
      assert.equal(resultBucket.failedToRemove.bags.length, 0)
      assert.equal(resultBucket.failedToRemove.totalSize, '0')
      assert.equal(resultBucket.removed.bags.length, 0)
      assert.equal(resultBucket.removed.totalSize, '0')
    }
    for (const bucketId of to) {
      const [, bucketBefore] = storageBucketsBefore.find(([id]) => id === bucketId) || []
      const resultBucket = resultBuckets.find(({ id }) => id === bucketId)
      assert(bucketBefore)
      assert(resultBucket)
      assert.equal(resultBucket.storageUsed.before, bucketBefore.voucher.sizeUsed.toString())
      assert.isAtLeast(parseInt(resultBucket.storageUsed.after), parseInt(resultBucket.storageUsed.before))
      assert.isAtLeast(resultBucket.added.bags.length, 0)
      assert.isAtLeast(parseInt(resultBucket.added.totalSize), 0)
      assert.equal(resultBucket.failedToAdd.bags.length, 0)
      assert.equal(resultBucket.failedToAdd.totalSize, '0')
      assert.equal(resultBucket.failedToRemove.bags.length, 0)
      assert.equal(resultBucket.failedToRemove.totalSize, '0')
      assert.equal(resultBucket.removed.bags.length, 0)
      assert.equal(resultBucket.removed.totalSize, '0')
      assert.equal(resultBucket.added.totalSize, _.sum(resultBucket.added.bags.map((b) => parseInt(b.size))).toString())
    }
    assert.equal(
      resultBuckets.reduce((a, b) => a + b.added.bags.length, 0),
      expectedNumUpdates * copies
    )
    assert.equal(
      resultBuckets.reduce((a, b) => a + parseInt(b.added.totalSize), 0),
      expectedStorageIncrease
    )
  }

  private async checkResultAgainstNewChainState(result: Serialized<FinalSummary>): Promise<void> {
    const storageBucketsAfter = await this.fetchBuckets()

    assert.equal(
      result.totalStorageUsage.after,
      storageBucketsAfter.reduce((sum, [, bucket]) => sum + bucket.voucher.sizeUsed.toBigInt(), 0n).toString()
    )

    for (const [bucketId, bucket] of storageBucketsAfter) {
      const resultBucket = result.buckets?.find((b) => b.id === bucketId)
      assert(resultBucket)
      assert.equal(resultBucket.storageUsed.after, bucket.voucher.sizeUsed.toString())
    }
  }

  private async fetchBuckets(): Promise<[number, PalletStorageStorageBucketRecord][]> {
    return (await this.api.query.storage.storageBucketById.multi(this.bucketIds)).map(
      (b, i) => [this.bucketIds[i], b.unwrap()] as [number, PalletStorageStorageBucketRecord]
    )
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    const { from, to, copies = 1 } = this.params
    this.bucketIds = [...from, ...to]

    const storageBucketsBefore = await this.fetchBuckets()
    const storageCli = await this.setupStorageCLI()
    const flags = ['--from', from.join(' '), '--to', to.join(' '), '--copies', copies.toString(), '--skipConfirmation']
    const { out } = await storageCli.run('leader:copy-bags', flags)
    const result: Serialized<FinalSummary> = JSON.parse(out)

    await this.checkResultAgainsExpectations(result, storageBucketsBefore)
    await this.checkResultAgainstNewChainState(result)
  }
}
