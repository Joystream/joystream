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
      allowNo: true,
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
    const bagsUpdateCreator = new BagsUpdateCreator(api)

    logger.info(`Fetching${activeOnly ? ' active' : ''} storage buckets...`)
    await bagsUpdateCreator.loadBuckets(activeOnly)
    logger.info(`${bagsUpdateCreator.loadedBucketsCount}${activeOnly ? ' active' : ''} storage buckets found.`)

    logger.info(`Fetching storage bags...`)
    await bagsUpdateCreator.loadBags()
    logger.info(`${bagsUpdateCreator.loadedBagsCount} storage bags found.`)

    logger.info(`Preparing storage bag updates...`)
    let avgReplicationRate = 0
    bagsUpdateCreator.prepareUpdates((bag) => {
      avgReplicationRate += bag.storedBy.size / bagsUpdateCreator.loadedBagsCount

      while (bag.storedBy.size > targetReplicationRate) {
        const bucket = bagsUpdateCreator.pickBucketToRemove(bag)
        assert(bucket, `Cannot pick a bucket to remove from bag ${stringifyBagId(bag.id)}`)
        bag.removeBucket(bucket)
      }

      while (bag.storedBy.size < targetReplicationRate) {
        const bucket = bagsUpdateCreator.pickBucketToAdd(bag)
        assert(
          bucket,
          'Storage system capacity too low. Increase some stroage bucket voucher limits or choose a lower replication rate.'
        )
        bag.addBucket(bucket)
      }
    })
    const { modifiedBagsCount } = bagsUpdateCreator
    logger.info(`${modifiedBagsCount} updates prepared.`)

    const summaryCreator = bagsUpdateCreator.getSummaryCreator({
      logger,
      replicationRate: {
        initial: avgReplicationRate,
        target: targetReplicationRate,
        totalBagsNum: bagsUpdateCreator.loadedBagsCount,
      },
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
