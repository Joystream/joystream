import _ from 'lodash'
import fs from 'fs/promises'
import readline from 'node:readline/promises'
import { stderr, stdin } from 'node:process'
import assert from 'node:assert'
import { SingleBar } from 'cli-progress'
import { flags } from '@oclif/command'
import { createType } from '@joystream/types'
import ExitCodes from '../../command-base/ExitCodes'
import LeaderCommandBase from '../../command-base/LeaderCommandBase'
import logger from '../../services/logger'
import { getBatchResults, ParsedBatchCallResult } from '../../services/runtime/extrinsics'
import { cmpBagIds, stringifyBagId } from '../../services/helpers/bagTypes'
import { sendAndFollowNamedTx } from '../../services/runtime/api'
import { BagUpdate, BagsUpdateSummaryCreator, UpdateableBucket } from '../../services/helpers/bagsUpdateSummary'

/**
 * CLI command:
 * Adjusts bag-to-bucket assignments to achieve a given replication rate.
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader priviliges.
 * Shell command: "leader:set-replication"
 */
export default class LeaderSetReplication extends LeaderCommandBase {
  static description = `Adjusts bag-to-bucket assignments to achieve a given replication rate.`

  static flags = {
    rate: flags.integer({
      char: 'r',
      required: true,
      description: 'The target replication rate',
    }),
    activeOnly: flags.boolean({
      char: 'a',
      default: true,
      description: 'Only take active buckets into account when calculating replication rate and updating bags',
    }),
    batchSize: flags.integer({
      char: 'b',
      default: 100,
      description: 'Number of extrinsics to send in a single utility.batch call',
    }),
    dryRun: flags.boolean({
      default: false,
      description: 'Assumes all transactions were successful and generates the summary',
    }),
    skipBucketsSummary: flags.boolean({
      default: false,
      description: 'Whether to skip a summary of changes by each individual bucket in the final result',
    }),
    skipTxSummary: flags.boolean({
      default: false,
      description: 'Whether to skip a summary of changes by each individual batch transaction in the final result',
    }),
    skipConfirmation: flags.boolean({
      default: false,
      description: 'Skips asking for confirmation before sending transactions',
    }),
    output: flags.string({
      char: 'o',
      description: 'Output result to a file (based on the provided path) instead of stdout',
    }),
    ...LeaderCommandBase.flags,
  }

  async promptForConfirmation(): Promise<boolean> {
    const rl = readline.createInterface({ input: stdin, output: stderr })
    const confirmed = await rl.question('Are you sure you want to continue? (y/N) ')
    rl.close()

    return confirmed === 'y'
  }

  async run(): Promise<void> {
    const {
      flags: {
        rate: targetReplicationRate,
        activeOnly,
        batchSize,
        skipBucketsSummary,
        skipTxSummary,
        output,
        dryRun,
        skipConfirmation,
      },
    } = this.parse(LeaderSetReplication)

    if (output) {
      try {
        await fs.writeFile(output, '')
      } catch (e) {
        logger.error(`Cannot access "${output}" for writing: ${e instanceof Error ? e.message : String(e)}`)
        this.exit(ExitCodes.FileError)
      }
    }

    const api = await this.getApi()

    logger.info(`Fetching${activeOnly ? ' active' : ''} storage buckets...`)

    const storageBucketsMap = new Map<number, UpdateableBucket>(
      (await api.query.storage.storageBucketById.entries())
        .flatMap(([sKey, value]) => {
          const bucketId = sKey.args[0].toNumber()
          const storageBucket = value.unwrap()
          const isActive = storageBucket.operatorStatus.isStorageWorker
          if (!isActive && activeOnly) {
            return []
          }

          return [[bucketId, new UpdateableBucket(bucketId, storageBucket)] as const]
        })
        // Sort entries to ensure deterministic results
        .sort(([idA], [idB]) => idA - idB)
    )

    logger.info(`${storageBucketsMap.size}${activeOnly ? ' active' : ''} storage buckets found.`)

    logger.info(`Fetching storage bags...`)

    const storageBags = (await api.query.storage.bags.entries())
      .map(([sKey, value]) => {
        const bagId = sKey.args[0]
        const bagData = {
          size: value.objectsTotalSize.toBigInt(),
          objectsNum: value.objectsNumber.toBigInt(),
          storedBy: Array.from(value.storedBy.values()).map((v) => v.toNumber()),
        }
        return [bagId, bagData] as const
      })
      // Sort entries to ensure deterministic results
      .sort(([idA], [idB]) => cmpBagIds(idA, idB))

    logger.info(`${storageBags.length} storage bags found.`)

    logger.info(`Preparing storage bag updates...`)

    const bagUpdates: BagUpdate[] = []
    let avgReplicationRate = 0
    for (const [bagId, bag] of storageBags) {
      const bucketsToRemove = new Set<number>()
      const bucketsToAdd = new Set<number>()

      const storedBy = bag.storedBy
        .map((bucketId) => storageBucketsMap.get(bucketId))
        .filter((bucket): bucket is UpdateableBucket => !!bucket)

      avgReplicationRate += storedBy.length / storageBags.length

      while (storedBy.length > targetReplicationRate) {
        // Pick a bucket with lowest storage available (taking into account already scheduled updates)
        // among buckets that store the bag
        const bucket = _.minBy(storedBy, (b) => b.storage.availableAfter)
        assert(bucket)
        bucket.storage.change -= bag.size
        bucket.objects.change -= bag.objectsNum
        bucket.bagsToRemove.add(stringifyBagId(bagId))
        bucketsToRemove.add(bucket.id)
        _.remove(storedBy, (b) => b.id === bucket.id)
      }

      while (storedBy.length < targetReplicationRate) {
        // Pick a bucket with highest storage available among buckets that DON'T store the bag
        // (taking into account already scheduled updates) and:
        // - have objects.availableAfter >= bag.objectsNum
        // - have storage.availableAfter >= bag.size
        // - have acceptingNewBags == true
        const notStoredBy = _.difference(
          Array.from(storageBucketsMap.keys()),
          storedBy.map((b) => b.id)
        )
          .map((bucketId) => storageBucketsMap.get(bucketId))
          .filter(
            (bucket): bucket is UpdateableBucket =>
              !!bucket &&
              bucket.acceptingNewBags &&
              bucket.objects.availableAfter >= bag.objectsNum &&
              bucket.storage.availableAfter >= bag.size
          )
        const bucket = _.maxBy(notStoredBy, (b) => b.storage.availableAfter)
        assert(
          bucket,
          'Storage system capacity too low. Increase some stroage bucket voucher limits or choose a lower replication rate.'
        )
        bucket.storage.change += bag.size
        bucket.objects.change += bag.objectsNum
        bucket.bagsToAdd.add(stringifyBagId(bagId))
        bucketsToAdd.add(bucket.id)
        storedBy.push(bucket)
      }

      if (bucketsToAdd.size || bucketsToRemove.size) {
        bagUpdates.push({
          size: bag.size,
          bagId,
          bucketsToAdd,
          bucketsToRemove,
        })
      }
    }
    logger.info(`${bagUpdates.length} updates prepared.`)

    const summaryCreator = new BagsUpdateSummaryCreator({
      logger,
      initAvgReplicationRate: avgReplicationRate,
      skipBucketsSummary,
      skipTxSummary,
      storageBucketsMap,
      targetReplicationRate,
      totalBagsNum: storageBags.length,
    })

    const chunkedBagUpdates = _.chunk(bagUpdates, batchSize)
    const batchTxs = chunkedBagUpdates.map((updatesBatch) =>
      api.tx.utility.forceBatch(
        updatesBatch.map((args) =>
          api.tx.storage.updateStorageBucketsForBag(
            args.bagId,
            createType('BTreeSet<u64>', args.bucketsToAdd),
            createType('BTreeSet<u64>', args.bucketsToRemove)
          )
        )
      )
    )

    logger.info(
      `Will execute ${bagUpdates.length} storage bag updates in ${batchTxs.length} utility.forceBatch transactions`
    )
    summaryCreator.printExpectedResults()

    const confirmed = skipConfirmation ? true : await this.promptForConfirmation()

    if (confirmed) {
      const progressBar = new SingleBar({ noTTYOutput: true })
      progressBar.start(batchTxs.length, 0, { title: `Executing the transactions...` })
      for (const i in batchTxs) {
        const batchTx = batchTxs[i]
        const batchBagUpdates = chunkedBagUpdates[i]
        const batchResults: ParsedBatchCallResult[] | void = dryRun
          ? Array.from({ length: batchBagUpdates.length }, () => ({ success: true }))
          : await sendAndFollowNamedTx(api, this.getAccount(), batchTx, (result) =>
              getBatchResults(batchTx, api, result)
            )
        assert(batchResults, `Could not parse utility.forceBatch results (tx: ${batchTx.hash.toJSON()})`)
        summaryCreator.updateSummaryWithBatchResults(
          dryRun ? `tx${i}_hash` : batchTx.hash.toJSON(),
          batchResults,
          batchBagUpdates
        )
        progressBar.update(parseInt(i) + 1)
      }
      progressBar.stop()

      const summaryJson = summaryCreator.getSummaryJSON()
      if (output) {
        logger.info(`Writing output to ${output}...`)
        await fs.writeFile(output, summaryJson)
      } else {
        console.log(summaryJson)
      }
    }

    this.exit()
  }
}
