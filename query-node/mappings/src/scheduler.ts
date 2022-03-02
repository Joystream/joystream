import { In } from 'typeorm'
import { BlockContext, DatabaseManager, StoreContext } from '@joystream/hydra-common'
import { Bounty, BountyStage } from 'query-node/dist/model'
import {
  bountyScheduleWorkSubmissionEnd,
  bountyScheduleFundingEnd,
  bountyScheduleJudgmentEnd,
  scheduledFundingEnd,
} from './bounty'

type Job = (store: DatabaseManager) => Promise<void>

const scheduleRecord: { [n: number]: Job[] } = {}
let isSchedulerRunning = false
let toBeScheduled: [number, Job][] = []

export async function runScheduler({ block, store }: BlockContext & StoreContext): Promise<void> {
  if (!isSchedulerRunning) {
    isSchedulerRunning = true
    await scheduleMissedMappings(store)
  }

  await runScheduledJobs(store, block.height)
}

export function scheduleAtBlock(blockNumber: number, job: Job): void {
  toBeScheduled.push([blockNumber, job])
}

async function runScheduledJobs(store: DatabaseManager, currentBlock: number): Promise<void> {
  // Queue new jobs
  if (toBeScheduled.length) {
    for (const [scheduledFor, job] of toBeScheduled) {
      const blockNumber = Math.max(scheduledFor, currentBlock)
      scheduleRecord[blockNumber] = [...(scheduleRecord[blockNumber] ?? []), job]
    }
    toBeScheduled = []
  }

  // Execute jobs scheduled for the current block
  if (scheduleRecord[currentBlock]) {
    for (const job of scheduleRecord[currentBlock]) {
      await job(store)
    }
    delete scheduleRecord[currentBlock]
  }
}

async function scheduleMissedMappings(store: DatabaseManager): Promise<void> {
  // Reschedule mappings lost while the processor was off

  // Bounty stage updates
  const bounties = await store.getMany(Bounty, {
    where: { stage: In([BountyStage.Funding, BountyStage.WorkSubmission, BountyStage.Judgment]) },
    relations: ['createdInEvent', 'maxFundingReachedEvent'],
  })

  bounties.forEach((bounty) => {
    const scheduledFundingPeriodEnd = scheduledFundingEnd(bounty, bounty.createdInEvent.inBlock)
    const fundingPeriodEnd = bounty.maxFundingReachedEvent?.inBlock ?? scheduledFundingPeriodEnd

    bountyScheduleFundingEnd(bounty, scheduledFundingPeriodEnd)
    bountyScheduleWorkSubmissionEnd(bounty, fundingPeriodEnd)
    bountyScheduleJudgmentEnd(bounty, fundingPeriodEnd && fundingPeriodEnd + bounty.judgingPeriod)
  })
}
