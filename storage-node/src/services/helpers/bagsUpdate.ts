import _ from 'lodash'
import {
  PalletStorageBagIdType,
  PalletStorageBagRecord,
  PalletStorageStorageBucketRecord,
} from '@polkadot/types/lookup'
import { ParsedBatchCallResult } from '../runtime/extrinsics'
import { cmpBagIds, stringifyBagId } from './bagTypes'
import { Logger } from 'winston'
import { asStorageSize } from './storageSize'
import { createType } from '@joystream/types'
import { ApiPromise } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'

export class UpdateableLimit {
  public readonly limit: bigint
  public readonly usedBefore: bigint
  public change = 0n

  constructor(limit: bigint, usedBefore: bigint) {
    this.limit = limit
    this.usedBefore = usedBefore
  }

  public get usedAfter(): bigint {
    return this.usedBefore + this.change
  }

  public get availableBefore(): bigint {
    return this.limit - this.usedBefore
  }

  public get availableAfter(): bigint {
    return this.limit - this.usedAfter
  }
}

export class UpdateableBucket {
  public readonly id: number
  public readonly storage: UpdateableLimit
  public readonly objects: UpdateableLimit
  public readonly acceptingNewBags: boolean
  public readonly active: boolean
  public readonly bagsToRemove: Set<string>
  public readonly bagsToAdd: Set<string>

  constructor(bucketId: number, storageBucket: PalletStorageStorageBucketRecord) {
    const { sizeLimit, sizeUsed, objectsLimit, objectsUsed } = storageBucket.voucher
    this.id = bucketId
    this.active = storageBucket.operatorStatus.isStorageWorker.valueOf()
    this.acceptingNewBags = storageBucket.acceptingNewBags.valueOf()
    this.storage = new UpdateableLimit(sizeLimit.toBigInt(), sizeUsed.toBigInt())
    this.objects = new UpdateableLimit(objectsLimit.toBigInt(), objectsUsed.toBigInt())
    this.bagsToRemove = new Set<string>()
    this.bagsToAdd = new Set<string>()
  }
}

export type BagUpdateSummary = {
  size: bigint
  bagId: string
  bucketsToAdd: number[]
  bucketsToRemove: number[]
}

type FailedBagUpdate = BagUpdateSummary & { error: string }

export class UpdateableBag {
  public readonly id: PalletStorageBagIdType
  public readonly size: bigint
  public readonly objectsNum: bigint
  public readonly storedBy: Set<number>
  public readonly bucketsToRemove: Set<number>
  public readonly bucketsToAdd: Set<number>

  constructor(bagId: PalletStorageBagIdType, bag: PalletStorageBagRecord) {
    const { objectsTotalSize, objectsNumber, storedBy } = bag
    this.id = bagId
    this.size = objectsTotalSize.toBigInt()
    this.objectsNum = objectsNumber.toBigInt()
    this.storedBy = new Set(Array.from(storedBy.values()).map((bucketId) => bucketId.toNumber()))
    this.bucketsToRemove = new Set<number>()
    this.bucketsToAdd = new Set<number>()
  }

  public removeBucket(bucket: UpdateableBucket): void {
    if (this.storedBy.has(bucket.id)) {
      this.storedBy.delete(bucket.id)
      this.bucketsToRemove.add(bucket.id)
      bucket.storage.change -= this.size
      bucket.objects.change -= this.objectsNum
      bucket.bagsToRemove.add(stringifyBagId(this.id))
    }
  }

  public addBucket(bucket: UpdateableBucket): void {
    if (!this.storedBy.has(bucket.id)) {
      this.storedBy.add(bucket.id)
      this.bucketsToAdd.add(bucket.id)
      bucket.storage.change += this.size
      bucket.objects.change += this.objectsNum
      bucket.bagsToAdd.add(stringifyBagId(this.id))
    }
  }

  public toUpdateSummary(): BagUpdateSummary {
    return {
      bagId: stringifyBagId(this.id),
      bucketsToAdd: Array.from(this.bucketsToAdd),
      bucketsToRemove: Array.from(this.bucketsToRemove),
      size: this.size,
    }
  }
}

type BeforeAfterStats<T> = {
  before: T
  after: T
}

type BagsSummary = {
  totalSize: bigint
  bags: { id: string; size: bigint }[]
}

export type Serialized<T> = T extends Record<string, unknown>
  ? { [K in keyof T]: undefined extends T[K] ? Serialized<NonNullable<T[K]>> | undefined : Serialized<T[K]> }
  : T extends Array<infer U>
  ? Array<Serialized<U>>
  : T extends bigint
  ? string
  : T

type BucketUpdateSummary = {
  id: number
  storageUsed: BeforeAfterStats<bigint>
  removed: BagsSummary
  added: BagsSummary
  failedToRemove: BagsSummary
  failedToAdd: BagsSummary
}

type TransactionSummary = {
  hash: string
  totalStorageUsage: BeforeAfterStats<bigint>
  avgReplicationRate?: BeforeAfterStats<number>
  successfulUpdates: BagUpdateSummary[]
  failedUpdates: FailedBagUpdate[]
}

export type FinalSummary = {
  totalStorageUsage: BeforeAfterStats<bigint>
  avgReplicationRate?: BeforeAfterStats<number>
  buckets?: BucketUpdateSummary[]
  transactions?: TransactionSummary[]
}

type BagsUpdateSummaryCreatorConfig = {
  logger: Logger
  storageBucketsMap: Map<number, UpdateableBucket>
  skipBucketsSummary: boolean
  skipTxSummary: boolean
  replicationRate?: {
    initial: number
    target: number
    totalBagsNum: number
  }
}

export type ExtrinsicWithBagUpdates = [SubmittableExtrinsic<'promise'>, BagUpdateSummary[]]

export class BagsUpdateCreator {
  private storageBucketsMap: Map<number, UpdateableBucket> = new Map()
  private bags: UpdateableBag[] = []
  private modifiedBags: UpdateableBag[] = []
  private api: ApiPromise

  constructor(api: ApiPromise) {
    this.api = api
  }

  public get loadedBucketsCount(): number {
    return this.storageBucketsMap.size
  }

  public get loadedBagsCount(): number {
    return this.bags.length
  }

  public get modifiedBagsCount(): number {
    return this.modifiedBags.length
  }

  public async loadBucketsByIds(ids: number[]): Promise<void> {
    const entries = (await this.api.query.storage.storageBucketById.multi(ids)).map((optBucket, i) => {
      const bucketId = ids[i]
      try {
        const storageBucket = optBucket.unwrap()
        return [bucketId, new UpdateableBucket(bucketId, storageBucket)] as const
      } catch (e) {
        throw new Error(`Couldn't find bucket by id: ${bucketId}`)
      }
    })
    if (ids.length !== entries.length) {
      throw new Error(`Failed to retrieve requested buckets!`)
    }
    this.setStorageBucketsMap(entries)
  }

  public async loadBuckets(activeOnly?: boolean): Promise<void> {
    const entries = (await this.api.query.storage.storageBucketById.entries()).flatMap(([sKey, optBucket]) => {
      const bucketId = sKey.args[0].toNumber()
      const updatableBucket = new UpdateableBucket(bucketId, optBucket.unwrap())
      if (activeOnly && !updatableBucket.active) {
        return []
      }
      return [[bucketId, updatableBucket] as const]
    })

    this.setStorageBucketsMap(entries)
  }

  public async loadBags(filterStoredBy = true): Promise<void> {
    await this.loadBagsBy(() => true, filterStoredBy)
  }

  public async loadBagsBy(predicate: (b: UpdateableBag) => boolean, filterStoredBy = true): Promise<void> {
    const bags = (await this.api.query.storage.bags.entries()).flatMap(([sKey, bag]) => {
      const bagId = sKey.args[0]
      const updatableBag = new UpdateableBag(bagId, bag)
      if (filterStoredBy) {
        for (const bucketId of updatableBag.storedBy.values()) {
          if (!this.storageBucketsMap.has(bucketId)) {
            updatableBag.storedBy.delete(bucketId)
          }
        }
      }
      if (predicate(updatableBag)) {
        return [updatableBag]
      }
      return []
    })
    this.setBags(bags)
  }

  public getBucket(id: number): UpdateableBucket {
    const bucket = this.storageBucketsMap.get(id)
    if (!bucket) {
      throw new Error(`Bucket ${id} not found in loaded storage buckets map`)
    }
    return bucket
  }

  public getSummaryCreator(
    config: Omit<BagsUpdateSummaryCreatorConfig, 'storageBucketsMap'>
  ): BagsUpdateSummaryCreator {
    return new BagsUpdateSummaryCreator({
      ...config,
      storageBucketsMap: _.cloneDeep(this.storageBucketsMap),
    })
  }

  public pickBucketToAdd(bag: UpdateableBag, choices?: number[]): UpdateableBucket | undefined {
    // Pick a bucket with highest storage available among buckets that DON'T store the bag
    // (taking into account already scheduled updates) and:
    // - have objects.availableAfter >= bag.objectsNum
    // - have storage.availableAfter >= bag.size
    // - have acceptingNewBags == true
    if (!choices) {
      choices = Array.from(this.storageBucketsMap.keys())
    }
    const availableBuckets = choices
      .filter((bucketId) => !bag.storedBy.has(bucketId))
      .map((bucketId) => this.storageBucketsMap.get(bucketId))
      .filter(
        (bucket): bucket is UpdateableBucket =>
          !!bucket &&
          bucket.acceptingNewBags &&
          bucket.objects.availableAfter >= bag.objectsNum &&
          bucket.storage.availableAfter >= bag.size
      )

    return _.maxBy(availableBuckets, (b) => b.storage.availableAfter)
  }

  public pickBucketToRemove(bag: UpdateableBag, choices?: number[]): UpdateableBucket | undefined {
    // Pick a bucket with lowest storage available (taking into account already scheduled updates)
    // among buckets that store the bag
    if (!choices) {
      choices = Array.from(bag.storedBy)
    }
    const candidates = choices
      .filter((bucketId) => bag.storedBy.has(bucketId))
      .map((bucketId) => this.storageBucketsMap.get(bucketId))
      .filter((bucket): bucket is UpdateableBucket => !!bucket)

    return _.minBy(candidates, (b) => b.storage.availableAfter)
  }

  public prepareUpdates(updateFunc: (bag: UpdateableBag) => void): void {
    for (const bag of this.bags) {
      updateFunc(bag)
      if (bag.bucketsToAdd.size || bag.bucketsToRemove.size) {
        this.modifiedBags.push(bag)
      }
    }
  }

  public prepareExtrinsics(batchSize: number): ExtrinsicWithBagUpdates[] {
    const { modifiedBags } = this
    const chunkedBags = _.chunk(modifiedBags, batchSize)
    const extrinsicsWithBagUpdates = chunkedBags.map(
      (chunk) =>
        [
          this.api.tx.utility.forceBatch(
            chunk.map((bag) =>
              this.api.tx.storage.updateStorageBucketsForBag(
                bag.id,
                createType('BTreeSet<u64>', bag.bucketsToAdd),
                createType('BTreeSet<u64>', bag.bucketsToRemove)
              )
            )
          ),
          chunk.map((bag) => bag.toUpdateSummary()),
        ] as ExtrinsicWithBagUpdates
    )
    return extrinsicsWithBagUpdates
  }

  private setStorageBucketsMap(entries: (readonly [number, UpdateableBucket])[]) {
    this.storageBucketsMap = new Map(
      // Sort entries to ensure deterministic results
      entries.sort(([idA], [idB]) => idA - idB)
    )

    return this.storageBucketsMap
  }

  private setBags(bags: UpdateableBag[]) {
    this.bags = bags
      // Sort entries to ensure deterministic results
      .sort(({ id: idA }, { id: idB }) => cmpBagIds(idA, idB))

    return this.bags
  }
}

export class BagsUpdateSummaryCreator {
  private currentTxSummary?: TransactionSummary
  private perBucketSummaries?: Map<number, BucketUpdateSummary>
  private summary: FinalSummary

  constructor(private config: BagsUpdateSummaryCreatorConfig) {
    this.summary = this.initSummary()
  }

  private formatBigInt(value: bigint, sep = ' ') {
    const maybeSign = value < 0 ? '-' : ''
    return (
      maybeSign +
      _.chunk(Array.from(value.toString().replace('-', '')).reverse(), 3)
        .map((c) => c.reverse().join(''))
        .reverse()
        .join(sep)
    )
  }

  private formatBeforeAfterStats<T extends number | bigint>(
    stats: BeforeAfterStats<T>,
    unit = '',
    decimals = 2
  ): string {
    const change: number | bigint = stats.after - stats.before
    const formatValue = (v: number | bigint, addSign = false) =>
      (addSign && v >= 0 ? '+' : '') +
      (typeof v === 'bigint' ? this.formatBigInt(v) : v.toFixed(decimals)) +
      (unit ? ` ${unit}` : '')
    return `${formatValue(stats.before)} => ${formatValue(stats.after)} (${formatValue(change, true)})`
  }

  public printExpectedResults(includeBuckets = true): void {
    const { logger, replicationRate, storageBucketsMap } = this.config
    const [storageUsageBefore, storageUnit] = asStorageSize(this.summary.totalStorageUsage.before)
    const [storageUsageAfter] = asStorageSize(
      this.summary.totalStorageUsage.before +
        Array.from(storageBucketsMap.values()).reduce((sum, b) => (sum += b.storage.change), 0n),
      storageUnit
    )

    let output = '\n'

    if (replicationRate) {
      const replicationRateStats = {
        before: replicationRate.initial,
        after: replicationRate.target,
      }

      output += `Avg. replication rate: ${this.formatBeforeAfterStats(replicationRateStats)}\n`
    }

    const storageUsageStats = {
      before: storageUsageBefore,
      after: storageUsageAfter,
    }
    output += `Total storage usage (among loaded buckets): ${this.formatBeforeAfterStats(
      storageUsageStats,
      storageUnit
    )}\n`

    if (includeBuckets) {
      for (const bucket of Array.from(storageBucketsMap.values())) {
        const [storageUsageBefore, storageUsageUnit] = asStorageSize(bucket.storage.usedBefore)
        const [storageUsageAfter] = asStorageSize(bucket.storage.usedAfter, storageUsageUnit)

        const [storageAvailBefore, storageAvailUnit] = asStorageSize(bucket.storage.availableBefore)
        const [storageAvailAfter] = asStorageSize(bucket.storage.availableAfter, storageAvailUnit)

        const storageUsageStats = { before: storageUsageBefore, after: storageUsageAfter }
        const storageAvailStats = { before: storageAvailBefore, after: storageAvailAfter }
        const objectsUsageStats = { before: bucket.objects.usedBefore, after: bucket.objects.usedAfter }
        const objectsAvailStats = { before: bucket.objects.availableBefore, after: bucket.objects.availableAfter }

        output += '\n'
        output += `-- Bucket ${bucket.id}:\n`
        if (bucket.bagsToAdd.size || bucket.bagsToRemove.size) {
          output += `---- Storage usage: ${this.formatBeforeAfterStats(storageUsageStats, storageUsageUnit)}\n`
          output += `---- Storage available: ${this.formatBeforeAfterStats(storageAvailStats, storageAvailUnit)}\n`
          output += `---- Objects stored: ${this.formatBeforeAfterStats(objectsUsageStats)}\n`
          output += `---- Objects limit remaining: ${this.formatBeforeAfterStats(objectsAvailStats)}\n`
          output += `---- Bags to remove: ${bucket.bagsToRemove.size}\n`
          output += `---- Bags to add: ${bucket.bagsToAdd.size}\n`
        } else {
          output += '---- NO CHANGES\n'
        }
      }
    }

    logger.info(`Expected results:\n${output}\n`)
  }

  private initSummary(): FinalSummary {
    const { replicationRate, storageBucketsMap, skipBucketsSummary } = this.config
    const initStorageUsage = Array.from(storageBucketsMap.values()).reduce((sum, b) => sum + b.storage.usedBefore, 0n)
    const summary: FinalSummary = {
      totalStorageUsage: {
        before: initStorageUsage,
        after: initStorageUsage,
      },
    }

    if (replicationRate) {
      summary.avgReplicationRate = {
        before: replicationRate.initial,
        after: replicationRate.initial,
      }
    }

    if (!skipBucketsSummary) {
      this.perBucketSummaries = new Map<number, BucketUpdateSummary>()
      for (const bucket of Array.from(storageBucketsMap.values())) {
        this.perBucketSummaries.set(bucket.id, {
          id: bucket.id,
          storageUsed: {
            before: bucket.storage.usedBefore,
            after: bucket.storage.usedAfter,
          },
          added: { totalSize: 0n, bags: [] },
          removed: { totalSize: 0n, bags: [] },
          failedToAdd: { totalSize: 0n, bags: [] },
          failedToRemove: { totalSize: 0n, bags: [] },
        })
      }
    }

    return summary
  }

  private initTxSummary(txHash: string): void {
    const transactionSummary: TransactionSummary = {
      hash: txHash,
      totalStorageUsage: {
        before: this.summary.totalStorageUsage.after,
        after: this.summary.totalStorageUsage.after,
      },
      failedUpdates: [],
      successfulUpdates: [],
    }

    if (this.summary.avgReplicationRate) {
      transactionSummary.avgReplicationRate = {
        before: this.summary.avgReplicationRate.after,
        after: this.summary.avgReplicationRate.after,
      }
    }

    if (!this.summary.transactions) {
      this.summary.transactions = []
    }

    this.summary.transactions.push(transactionSummary)
    this.currentTxSummary = transactionSummary
  }

  public handleSuccessfulBagUpdate(bagUpdate: BagUpdateSummary): void {
    this.updateStorageUsage(this.summary.totalStorageUsage, bagUpdate)
    if (this.summary.avgReplicationRate) {
      this.updateAvgReplicationRate(this.summary.avgReplicationRate, bagUpdate)
    }
    if (this.currentTxSummary) {
      this.currentTxSummary.successfulUpdates.push(bagUpdate)
    }
    this.updatePerBucketSummaries(bagUpdate)
  }

  private updateBagsSummary(bagsSummary: BagsSummary, bagUpdate: BagUpdateSummary) {
    bagsSummary.totalSize += bagUpdate.size
    bagsSummary.bags.push({ id: bagUpdate.bagId, size: bagUpdate.size })
  }

  private updateBagsSummaryOfBucket(
    bucketId: number,
    type: 'added' | 'failedToAdd' | 'removed' | 'failedToRemove',
    bagUpdate: BagUpdateSummary
  ) {
    if (this.perBucketSummaries) {
      const bucketSummary = this.perBucketSummaries.get(bucketId)
      if (bucketSummary) {
        this.updateBagsSummary(bucketSummary[type], bagUpdate)
      }
    }
  }

  private updatePerBucketSummaries(bagUpdate: BagUpdateSummary | FailedBagUpdate): void {
    if (this.perBucketSummaries) {
      if ('error' in bagUpdate) {
        for (const bucketId of bagUpdate.bucketsToAdd) {
          this.updateBagsSummaryOfBucket(bucketId, 'failedToAdd', bagUpdate)
        }
        for (const bucketId of bagUpdate.bucketsToRemove) {
          this.updateBagsSummaryOfBucket(bucketId, 'failedToRemove', bagUpdate)
        }
      } else {
        for (const bucketId of bagUpdate.bucketsToAdd) {
          this.updateBagsSummaryOfBucket(bucketId, 'added', bagUpdate)
        }
        for (const bucketId of bagUpdate.bucketsToRemove) {
          this.updateBagsSummaryOfBucket(bucketId, 'removed', bagUpdate)
        }
      }
    }
  }

  public handleFailedBagUpdate(failedBagUpdate: FailedBagUpdate): void {
    if (this.currentTxSummary) {
      this.currentTxSummary.failedUpdates.push(failedBagUpdate)
    }
    this.updatePerBucketSummaries(failedBagUpdate)
  }

  private updateAvgReplicationRate(avgReplicationRate: BeforeAfterStats<number>, bagUpdate: BagUpdateSummary) {
    if (this.config.replicationRate) {
      const {
        replicationRate: { target: targetReplicationRate, totalBagsNum },
      } = this.config
      const bagPreviousReplicationRate =
        targetReplicationRate + bagUpdate.bucketsToRemove.length - bagUpdate.bucketsToAdd.length
      avgReplicationRate.after -= bagPreviousReplicationRate / totalBagsNum
      avgReplicationRate.after += targetReplicationRate / totalBagsNum
    }
  }

  private updateStorageUsage(stats: BeforeAfterStats<bigint>, bagUpdate: BagUpdateSummary): void {
    stats.after += bagUpdate.size * (BigInt(bagUpdate.bucketsToAdd.length) - BigInt(bagUpdate.bucketsToRemove.length))
  }

  public updateSummaryWithBatchResults(
    txHash: string,
    results: ParsedBatchCallResult[],
    bagUpdates: BagUpdateSummary[]
  ): void {
    if (!this.config.skipTxSummary) {
      this.initTxSummary(txHash)
    }

    for (const i in results) {
      const result = results[i]
      const bagUpdate = bagUpdates[i]
      if ('error' in result) {
        this.handleFailedBagUpdate({ ...bagUpdate, error: result.error })
      } else {
        this.handleSuccessfulBagUpdate(bagUpdate)
      }
    }

    if (this.currentTxSummary) {
      if (this.currentTxSummary.avgReplicationRate && this.summary.avgReplicationRate) {
        this.currentTxSummary.avgReplicationRate.after = this.summary.avgReplicationRate.after
      }
      this.currentTxSummary.totalStorageUsage.after = this.summary.totalStorageUsage.after
    }
  }

  private roundBeforeAfterStat(stat: BeforeAfterStats<number>, precision = 2) {
    stat.before = _.round(stat.before, precision)
    stat.after = _.round(stat.after, precision)
  }

  public getSummary(): FinalSummary {
    if (this.perBucketSummaries) {
      this.summary.buckets = Array.from(this.perBucketSummaries.values())
    }
    if (this.summary.avgReplicationRate) {
      this.roundBeforeAfterStat(this.summary.avgReplicationRate)
      if (this.summary.transactions) {
        for (const txSummary of this.summary.transactions) {
          if (txSummary.avgReplicationRate) {
            this.roundBeforeAfterStat(txSummary.avgReplicationRate)
          }
        }
      }
    }

    return this.summary
  }

  public getSummaryJSON(): string {
    return JSON.stringify(
      this.getSummary(),
      (key, value) => {
        if (typeof value === 'bigint') {
          return value.toString()
        }
        return value
      },
      2
    )
  }
}
