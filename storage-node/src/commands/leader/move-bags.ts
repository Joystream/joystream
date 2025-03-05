import _ from 'lodash'
import fs from 'fs/promises'
import readline from 'node:readline/promises'
import { stderr, stdin } from 'node:process'
import assert from 'node:assert'
import { SingleBar } from 'cli-progress'
import { flags } from '@oclif/command'
import ExitCodes from '../../command-base/ExitCodes'
import LeaderCommandBase from '../../command-base/LeaderCommandBase'
import logger from '../../services/logger'
import { getBatchResults, ParsedBatchCallResult } from '../../services/runtime/extrinsics'
import { stringifyBagId } from '../../services/helpers/bagTypes'
import { sendAndFollowNamedTx } from '../../services/runtime/api'
import { BagsUpdateCreator } from '../../services/helpers/bagsUpdate'

/**
 * CLI command:
 * Moves all storage bags from a given bucket / set of buckets to a different bucket / set of buckets.
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader priviliges.
 * Shell command: "leader:move-bags"
 */
export default class LeaderMoveBags extends LeaderCommandBase {
  static description = `Move all storage bags from a given bucket / set of buckets to a different bucket / set of buckets`

  static flags = {
    from: flags.integer({
      multiple: true,
      required: true,
      description: 'List of bucket ids to move bags from',
    }),
    to: flags.integer({
      multiple: true,
      required: true,
      description: 'List of bucket ids to move bags to',
    }),
    allowReplicationRateChange: flags.boolean({
      default: false,
      description: 'Disable the safety check and allow the bag replication rates to change (could be dangerous)',
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
        from,
        to,
        batchSize,
        skipBucketsSummary,
        skipTxSummary,
        output,
        dryRun,
        skipConfirmation,
        allowReplicationRateChange,
      },
    } = this.parse(LeaderMoveBags)

    if (output) {
      try {
        await fs.writeFile(output, '')
      } catch (e) {
        logger.error(`Cannot access "${output}" for writing: ${e instanceof Error ? e.message : String(e)}`)
        this.exit(ExitCodes.FileError)
      }
    }

    const api = await this.getApi()

    const bucketsIntersection = _.intersection(from, to).length
    if (bucketsIntersection) {
      this.error(
        `--from and --to arrays cannot intersect! Values: ${JSON.stringify(bucketsIntersection)} appear in both arrays.`
      )
    }

    const bucketsToFetch = [...from, ...to]
    const bagsUpdateCreator = new BagsUpdateCreator(api)

    logger.info(`Fetching storage buckets (${JSON.stringify(bucketsToFetch)})...`)
    await bagsUpdateCreator.loadBucketsByIds(bucketsToFetch)
    logger.info(`${bagsUpdateCreator.loadedBucketsCount} storage buckets fetched.`)

    logger.info(`Fetching storage bags of bucket(s) ${JSON.stringify(from)}...`)
    await bagsUpdateCreator.loadBagsBy((bag) => from.some((bucketId) => bag.storedBy.has(bucketId)))
    logger.info(`${bagsUpdateCreator.loadedBagsCount} storage bags found.`)

    logger.info(`Preparing storage bag updates...`)
    bagsUpdateCreator.prepareUpdates((bag) => {
      for (const bucketToRemoveId of from) {
        bag.removeBucket(bagsUpdateCreator.getBucket(bucketToRemoveId))
      }

      while (true) {
        const bucket = bagsUpdateCreator.pickBucketToAdd(bag, to)
        if (!bucket) {
          if (!allowReplicationRateChange) {
            this.error(
              `Cannot keep replication rate of bag ${stringifyBagId(
                bag.id
              )} intact! Not enough target buckets available.`
            )
          }
          break
        }
        bag.addBucket(bucket)
        if (bag.bucketsToAdd.size === bag.bucketsToRemove.size) {
          break
        }
      }
    })
    const { modifiedBagsCount } = bagsUpdateCreator
    logger.info(`${modifiedBagsCount} updates prepared.`)

    const summaryCreator = bagsUpdateCreator.getSummaryCreator({
      logger,
      skipBucketsSummary,
      skipTxSummary,
    })

    const extrinsicsWithBagUpdates = bagsUpdateCreator.prepareExtrinsics(batchSize)
    logger.info(
      `Will execute ${modifiedBagsCount} storage bag updates in ${extrinsicsWithBagUpdates.length} utility.forceBatch transactions`
    )
    summaryCreator.printExpectedResults()

    const confirmed = skipConfirmation ? true : await this.promptForConfirmation()

    if (confirmed) {
      const progressBar = new SingleBar({ noTTYOutput: true })
      progressBar.start(extrinsicsWithBagUpdates.length, 0, { title: `Executing the transactions...` })
      for (const [i, [batchTx, bagUpdates]] of extrinsicsWithBagUpdates.entries()) {
        const batchResults: ParsedBatchCallResult[] | void = dryRun
          ? Array.from({ length: bagUpdates.length }, () => ({ success: true }))
          : await sendAndFollowNamedTx(api, this.getAccount(), batchTx, (result) =>
              getBatchResults(batchTx, api, result)
            )
        assert(batchResults, `Could not parse utility.forceBatch results (tx: ${batchTx.hash.toJSON()})`)
        summaryCreator.updateSummaryWithBatchResults(
          dryRun ? `tx${i}_hash` : batchTx.hash.toJSON(),
          batchResults,
          bagUpdates
        )
        progressBar.update(i + 1)
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
