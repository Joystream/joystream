import _ from 'lodash'
import { PalletStorageBagIdType as BagId, PalletStorageStorageBucketRecord } from '@polkadot/types/lookup'
import { ParsedBatchCallResult } from '../runtime/extrinsics'
import { stringifyBagId } from './bagTypes'
import { Logger } from 'winston'
import { asStorageSize } from './storageSize'
import { Enum } from '@polkadot/types-codec'

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

type BeforeAfterStats<T> = {
  before: T
  after: T
}

type BagsSummary = {
  totalSize: bigint
  bags: { id: string; size: bigint }[]
}

export type BagUpdate = {
  size: bigint
  bagId: BagId
  bucketsToAdd: Set<number>
  bucketsToRemove: Set<number>
}

type FailedBagUpdate = BagUpdate & { error: string }

export type Serialized<T> = T extends Record<string, unknown>
  ? { [K in keyof T]: undefined extends T[K] ? Serialized<NonNullable<T[K]>> | undefined : Serialized<T[K]> }
  : T extends Set<infer U>
  ? Serialized<U>[]
  : T extends Array<infer U>
  ? Array<Serialized<U>>
  : T extends bigint
  ? string
  : T extends BagId
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
  avgReplicationRate: BeforeAfterStats<number>
  successfulUpdates: BagUpdate[]
  failedUpdates: FailedBagUpdate[]
}

export type FinalSummary = {
  totalStorageUsage: BeforeAfterStats<bigint>
  avgReplicationRate: BeforeAfterStats<number>
  buckets?: BucketUpdateSummary[]
  transactions?: TransactionSummary[]
}

type BagsUpdateSummaryCreatorConfig = {
  logger: Logger
  initAvgReplicationRate: number
  totalBagsNum: number
  storageBucketsMap: Map<number, UpdateableBucket>
  skipBucketsSummary: boolean
  skipTxSummary: boolean
  targetReplicationRate: number
}

export class BagsUpdateSummaryCreator {
  private currentTxSummary?: TransactionSummary
  private perBucketSummaries?: Map<number, BucketUpdateSummary>
  private summary: FinalSummary

  constructor(private config: BagsUpdateSummaryCreatorConfig) {
    this.summary = this.initSummary()
  }

  private formatBeforeAfterStats(stats: BeforeAfterStats<number>, unit = '', decimals = 2): string {
    const change = stats.after - stats.before
    const formatValue = (v: number, addSign = false) =>
      (addSign && v >= 0 ? '+' : '') + v.toFixed(decimals) + (unit ? ` ${unit}` : '')
    return `${formatValue(stats.before)} => ${formatValue(stats.after)} (${formatValue(change, true)})`
  }

  public printExpectedResults(includeBuckets = true): void {
    const { logger, initAvgReplicationRate, targetReplicationRate, storageBucketsMap } = this.config
    const [storageUsageBefore, storageUnit] = asStorageSize(this.summary.totalStorageUsage.before)
    const [storageUsageAfter] = asStorageSize(
      this.summary.totalStorageUsage.before +
        Array.from(storageBucketsMap.values()).reduce((sum, b) => (sum += b.storage.change), 0n),
      storageUnit
    )

    const replicationRateStats = {
      before: initAvgReplicationRate,
      after: targetReplicationRate,
    }
    const storageUsageStats = {
      before: storageUsageBefore,
      after: storageUsageAfter,
    }

    let output = '\n'
    output += `Avg. replication rate: ${this.formatBeforeAfterStats(replicationRateStats)}\n`
    output += `Total storage usage: ${this.formatBeforeAfterStats(storageUsageStats, storageUnit)}\n`
    output += '\n'

    if (includeBuckets) {
      for (const bucket of Array.from(storageBucketsMap.values())) {
        const [storageUsageBefore, storageUsageUnit] = asStorageSize(bucket.storage.usedBefore)
        const [storageUsageAfter] = asStorageSize(bucket.storage.usedAfter, storageUsageUnit)

        const [storageAvailBefore, storageAvailUnit] = asStorageSize(bucket.storage.availableBefore)
        const [storageAvailAfter] = asStorageSize(bucket.storage.availableAfter, storageAvailUnit)

        const storageUsageStats = { before: storageUsageBefore, after: storageUsageAfter }
        const storageAvailStats = { before: storageAvailBefore, after: storageAvailAfter }

        // TODO: Add objects limit
        output += `-- Bucket ${bucket.id}:\n`
        output += `---- Storage usage: ${this.formatBeforeAfterStats(storageUsageStats, storageUsageUnit)}\n`
        output += `---- Storage available: ${this.formatBeforeAfterStats(storageAvailStats, storageAvailUnit)}\n`
        output += `---- Bags to remove: ${bucket.bagsToRemove.size}\n`
        output += `---- Bags to add: ${bucket.bagsToAdd.size}\n`
      }
    }

    logger.info(`Expected results:\n${output}`)
  }

  private initSummary(): FinalSummary {
    const { initAvgReplicationRate, storageBucketsMap, skipBucketsSummary } = this.config
    const initStorageUsage = Array.from(storageBucketsMap.values()).reduce((sum, b) => sum + b.storage.usedBefore, 0n)
    const summary: FinalSummary = {
      totalStorageUsage: {
        before: initStorageUsage,
        after: initStorageUsage,
      },
      avgReplicationRate: {
        before: initAvgReplicationRate,
        after: initAvgReplicationRate,
      },
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
      avgReplicationRate: {
        before: this.summary.avgReplicationRate.after,
        after: this.summary.avgReplicationRate.after,
      },
      totalStorageUsage: {
        before: this.summary.totalStorageUsage.after,
        after: this.summary.totalStorageUsage.after,
      },
      failedUpdates: [],
      successfulUpdates: [],
    }

    if (!this.summary.transactions) {
      this.summary.transactions = []
    }

    this.summary.transactions.push(transactionSummary)
    this.currentTxSummary = transactionSummary
  }

  public handleSuccessfulBagUpdate(bagUpdate: BagUpdate): void {
    this.updateStorageUsage(this.summary.totalStorageUsage, bagUpdate)
    this.updateAvgReplicationRate(this.summary.avgReplicationRate, bagUpdate)
    if (this.currentTxSummary) {
      this.currentTxSummary.successfulUpdates.push(bagUpdate)
    }
    this.updatePerBucketSummaries(bagUpdate)
  }

  private updateBagsSummary(bagsSummary: BagsSummary, bagUpdate: BagUpdate) {
    bagsSummary.totalSize += bagUpdate.size
    bagsSummary.bags.push({ id: stringifyBagId(bagUpdate.bagId), size: bagUpdate.size })
  }

  private updateBagsSummaryOfBucket(
    bucketId: number,
    type: 'added' | 'failedToAdd' | 'removed' | 'failedToRemove',
    bagUpdate: BagUpdate
  ) {
    if (this.perBucketSummaries) {
      const bucketSummary = this.perBucketSummaries.get(bucketId)
      if (bucketSummary) {
        this.updateBagsSummary(bucketSummary[type], bagUpdate)
      }
    }
  }

  private updatePerBucketSummaries(bagUpdate: BagUpdate | FailedBagUpdate): void {
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

  private updateAvgReplicationRate(avgReplicationRate: BeforeAfterStats<number>, bagUpdate: BagUpdate) {
    const { targetReplicationRate, totalBagsNum } = this.config
    const bagPreviousReplicationRate =
      targetReplicationRate + bagUpdate.bucketsToRemove.size - bagUpdate.bucketsToAdd.size
    avgReplicationRate.after -= bagPreviousReplicationRate / totalBagsNum
    avgReplicationRate.after += targetReplicationRate / totalBagsNum
  }

  private updateStorageUsage(stats: BeforeAfterStats<bigint>, bagUpdate: BagUpdate): void {
    stats.after += bagUpdate.size * (BigInt(bagUpdate.bucketsToAdd.size) - BigInt(bagUpdate.bucketsToRemove.size))
  }

  public updateSummaryWithBatchResults(
    txHash: string,
    results: ParsedBatchCallResult[],
    bagUpdates: BagUpdate[]
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
      this.currentTxSummary.avgReplicationRate.after = this.summary.avgReplicationRate.after
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
    this.roundBeforeAfterStat(this.summary.avgReplicationRate)
    if (this.summary.transactions) {
      for (const txSummary of this.summary.transactions) {
        this.roundBeforeAfterStat(txSummary.avgReplicationRate)
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
        if (value instanceof Enum) {
          return stringifyBagId(value as BagId)
        }
        if (value instanceof Set) {
          return Array.from(value)
        }
        return value
      },
      2
    )
  }
}
