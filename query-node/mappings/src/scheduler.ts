import { In } from 'typeorm'
import { DatabaseManager, StoreContext } from '@joystream/hydra-common'
import { eventEmitter, ProcessorEvents } from '@joystream/hydra-processor/lib/start/processor-events'
import { Bounty, BountyStage } from 'query-node/dist/model'
import { bountyScheduleWorkSubmissionEnd, bountyScheduleFundingEnd, bountyScheduleJudgementEnd } from './bounty'

let isSchedulerRunning = false
let toBeScheduled: [number, () => void][] = []

export async function launchScheduler({ store }: StoreContext) {
  if (!isSchedulerRunning) {
    runScheduler()
    await scheduleMissedMappings(store)
  }
}

export function scheduleAtBlock(blockNumber: number, job: () => void) {
  toBeScheduled.push([blockNumber, job])
}

function runScheduler() {
  isSchedulerRunning = true
  const scheduleRecord: { [n: number]: (() => void)[] } = {}

  eventEmitter.on(ProcessorEvents.INDEXER_STATUS_CHANGE, (indexerStatus) => {
    if (toBeScheduled.length) {
      toBeScheduled.forEach(([blockNumber, job]) => {
        if (blockNumber < indexerStatus.chainHeight) {
          job()
        } else {
          scheduleRecord[blockNumber] = [...(scheduleRecord[blockNumber] ?? []), job]
        }
      })
      toBeScheduled = []
    }

    if (scheduleRecord[indexerStatus.chainHeight]) {
      scheduleRecord[indexerStatus.chainHeight].forEach((job) => job())
      delete scheduleRecord[indexerStatus.chainHeight]
    }
  })
}

async function scheduleMissedMappings(store: DatabaseManager) {
  // Reschedule mappings lost while the processor was off

  // Bounty stage updates
  const bounties = await store.getMany(Bounty, {
    where: { stage: In([BountyStage.Funding, BountyStage.WorkSubmission, BountyStage.Judgment]) },
  })
  bounties.forEach((bounty) => {
    bountyScheduleFundingEnd(store, bounty)
    bountyScheduleWorkSubmissionEnd(store, bounty)
    bountyScheduleJudgementEnd(store, bounty)
  })
}
