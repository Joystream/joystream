import _ from 'lodash'
import { PalletStorageStorageBucketRecord } from '@polkadot/types/lookup'
import { FinalSummary, Serialized } from 'storage-node/src/services/helpers/bagsUpdateSummary'
import { BaseQueryNodeFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { Api } from '../../Api'
import { assert } from 'chai'
import { StorageCLI } from '../../cli/storage'

export type SetReplicationRateFixtureParams = {
  oldRate: number
  newRate: number
  expectedNumUpdates: number
  expectedBuckets: {
    id: number
    removed: { id: string; size: bigint }[]
    added: { id: string; size: bigint }[]
  }[]
}

export class SetReplicationRateFixture extends BaseQueryNodeFixture {
  constructor(public api: Api, public query: QueryNodeApi, private params: SetReplicationRateFixtureParams) {
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
    const { oldRate, newRate, expectedNumUpdates, expectedBuckets } = this.params

    const expectedStorageUsageBefore = storageBucketsBefore.reduce((a, [, b]) => a + b.voucher.sizeUsed.toBigInt(), 0n)
    const expectedStorageUsageAfter = (Number(expectedStorageUsageBefore) * (newRate / oldRate)).toString()

    assert.equal(result.avgReplicationRate.before, oldRate)
    assert.equal(result.avgReplicationRate.after, newRate)
    assert.equal(result.totalStorageUsage.before.toString(), expectedStorageUsageBefore.toString())
    assert.equal(result.totalStorageUsage.after.toString(), expectedStorageUsageAfter.toString())
    assert(result.transactions)
    // Expecting 1 batch transaction only!
    assert.equal(result.transactions[0].avgReplicationRate.before, oldRate)
    assert.equal(result.transactions[0].avgReplicationRate.after, newRate)
    assert.equal(result.transactions[0].failedUpdates.length, 0)
    assert.equal(result.transactions[0].successfulUpdates.length, expectedNumUpdates)
    assert.equal(result.transactions[0].totalStorageUsage.before.toString(), expectedStorageUsageBefore.toString())
    assert.equal(result.transactions[0].totalStorageUsage.after.toString(), expectedStorageUsageAfter.toString())
    const resultBuckets = result.buckets
    assert(resultBuckets)
    assert.equal(resultBuckets.length, expectedBuckets.length)
    for (const i of resultBuckets.keys()) {
      const [, bucketBefore] = storageBucketsBefore.find(([id]) => id === resultBuckets[i].id) || []
      const expectedBucket = expectedBuckets.find((b) => b.id === resultBuckets[i].id)
      assert(bucketBefore)
      assert(expectedBucket)
      assert.equal(resultBuckets[i].storageUsed.before.toString(), bucketBefore.voucher.sizeUsed.toString())
      assert.sameDeepMembers(
        resultBuckets[i].added.bags,
        expectedBucket.added.map((v) => ({ ...v, size: v.size.toString() }))
      )
      assert.sameDeepMembers(
        resultBuckets[i].removed.bags,
        expectedBucket.removed.map((v) => ({ ...v, size: v.size.toString() }))
      )
      assert.equal(
        resultBuckets[i].storageUsed.after.toString(),
        (
          bucketBefore.voucher.sizeUsed.toBigInt() -
          expectedBucket.removed.reduce((sum, b) => sum + b.size, 0n) +
          expectedBucket.added.reduce((sum, b) => sum + b.size, 0n)
        ).toString()
      )
      assert.equal(resultBuckets[i].failedToAdd.bags.length, 0)
      assert.equal(resultBuckets[i].failedToRemove.bags.length, 0)
    }
  }

  private async checkResultAgainstNewChainState(result: Serialized<FinalSummary>): Promise<void> {
    const storageBucketsAfter = (await this.api.query.storage.storageBucketById.entries()).map(([sKey, bucket]) => {
      return [sKey.args[0].toNumber(), bucket.unwrap()] as const
    })
    const storageBagsAfter = (await this.api.query.storage.bags.entries()).map(([sKey, bag]) => {
      return [sKey.args[0], bag] as const
    })

    assert.closeTo(
      result.avgReplicationRate.after,
      _.meanBy(storageBagsAfter, ([, bag]) => bag.storedBy.size),
      1e-6
    )
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

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    const { newRate } = this.params

    const storageBucketsBefore = (await this.api.query.storage.storageBucketById.entries()).map(([sKey, bucket]) => {
      return [sKey.args[0].toNumber(), bucket.unwrap()] as const
    })

    const storageCli = await this.setupStorageCLI()
    const flags = ['--rate', newRate.toString(), '--skipConfirmation']
    const { out } = await storageCli.run('leader:set-replication', flags)
    const result: Serialized<FinalSummary> = JSON.parse(out)

    await this.checkResultAgainsExpectations(result, storageBucketsBefore)
    await this.checkResultAgainstNewChainState(result)
  }
}
