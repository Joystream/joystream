import { DatabaseManager, EventContext, StoreContext } from '@joystream/hydra-common'
import { BountyMetadata } from '@joystream/metadata-protobuf'
import { AssuranceContractType, BountyActor, FundingType } from '@joystream/types/augment'
import {
  Bounty,
  BountyContractClosed,
  BountyContractOpen,
  BountyCreatedEvent,
  BountyFundingLimited,
  BountyFundingPerpetual,
  BountyStage,
  ForumThread,
  Membership,
} from 'query-node/dist/model'
import { Bounty as BountyEvents } from '../generated/types'
import { deserializeMetadata, genericEventFields } from './common'
import { scheduleAtBlock } from './scheduler'

/**
 * Commons helpers
 */

function bountyActorToMembership(actor: BountyActor): Membership | undefined {
  if (actor.isMember) {
    return new Membership({ id: String(actor.asMember) })
  }
}

function isBountyFundingLimited(
  fundingType: BountyFundingPerpetual | BountyFundingLimited
): fundingType is BountyFundingLimited {
  return fundingType.isTypeOf === BountyFundingLimited.name
}

function fundingPeriodEnd(bounty: Bounty): number {
  return (
    bounty.maxFundingReachedEvent?.inBlock ??
    bounty.createdInEvent.inBlock + (bounty.fundingType as BountyFundingLimited).fundingPeriod
  )
}

/**
 * Schedule Periods changes
 */

export function bountyScheduleFundingEnd(store: DatabaseManager, bounty: Bounty) {
  const { fundingType } = bounty
  if (bounty.stage !== BountyStage.Funding || !isBountyFundingLimited(fundingType)) return

  const fundingPeriodEnd = bounty.createdInEvent.inBlock + fundingType.fundingPeriod
  scheduleAtBlock(fundingPeriodEnd, () => {
    if (bounty.stage === BountyStage.Funding) {
      const isFunded = bounty.totalFunding >= fundingType.minFundingAmount
      endFundingPeriod(store, bounty, isFunded)
    }
  })
}

export function bountyScheduleWorkSubmissionEnd(store: DatabaseManager, bounty: Bounty) {
  if (bounty.stage !== BountyStage.WorkSubmission) return

  const workingPeriodEnd = fundingPeriodEnd(bounty) + bounty.workPeriod
  scheduleAtBlock(workingPeriodEnd, () => {
    if (bounty.stage === BountyStage.WorkSubmission) {
      endWorkingPeriod(store, bounty)
    }
  })
}

export function bountyScheduleJudgementEnd(store: DatabaseManager, bounty: Bounty) {
  if (bounty.stage !== BountyStage.Judgment) return

  const judgementPeriodEnd = fundingPeriodEnd(bounty) + bounty.workPeriod + bounty.judgingPeriod
  scheduleAtBlock(judgementPeriodEnd, () => {
    if (bounty.stage === BountyStage.Funding) {
      bounty.updatedAt = new Date()
      bounty.stage = BountyStage.Failed
      store.save<Bounty>(bounty)
    }
  })
}

function endFundingPeriod(store: DatabaseManager, bounty: Bounty, isFunded = true) {
  bounty.updatedAt = new Date()
  if (isFunded) {
    bounty.stage = BountyStage.WorkSubmission
    bountyScheduleWorkSubmissionEnd(store, bounty)
  } else {
    bounty.stage = BountyStage[bounty.contributions?.length ? 'Failed' : 'Expired']
  }
  return store.save<Bounty>(bounty)
}

function endWorkingPeriod(store: DatabaseManager, bounty: Bounty) {
  bounty.updatedAt = new Date()
  if (bounty.entries?.length) {
    bounty.stage = BountyStage.Judgment
    bountyScheduleJudgementEnd(store, bounty)
  } else {
    bounty.stage = BountyStage.Failed
  }
  return store.save<Bounty>(bounty)
}

/**
 * Event handlers
 */

export async function bounty_BountyCreated({ event, store }: EventContext & StoreContext): Promise<void> {
  const createdEvent = new BountyEvents.BountyCreatedEvent(event)
  const [bountyId, bountyParams, metadataBytes] = createdEvent.params
  const eventTime = new Date(event.blockTimestamp)

  const metadata = deserializeMetadata(BountyMetadata, metadataBytes)

  const bounty = new Bounty({
    id: String(bountyId),
    createdAt: eventTime,
    updatedAt: eventTime,
    title: metadata?.title ?? undefined,
    description: metadata?.description ?? undefined,
    bannerImageUri: metadata?.bannerImageUri ?? undefined,
    cherry: bountyParams.cherry,
    entrantStake: bountyParams.entrant_stake,
    creator: bountyActorToMembership(bountyParams.creator),
    oracle: bountyActorToMembership(bountyParams.oracle),
    fundingType: asFundingType(bountyParams.funding_type),
    contractType: asContractType(bountyParams.contract_type),
    workPeriod: bountyParams.work_period.toNumber(),
    judgingPeriod: bountyParams.judging_period.toNumber(),

    stage: BountyStage.Funding,
    totalFunding: bountyParams.cherry,
    discussionThread: asForumThread(metadata?.discussionThread ?? undefined),
  })

  await store.save<Bounty>(bounty)

  bountyScheduleFundingEnd(store, bounty)

  const createdInEvent = new BountyCreatedEvent({ ...genericEventFields(event), bounty })
  await store.save<BountyCreatedEvent>(createdInEvent)

  function asFundingType(funding: FundingType) {
    if (funding.isPerpetual) {
      const perpetualFunding = new BountyFundingPerpetual()
      perpetualFunding.target = funding.asPerpetual.target
      return perpetualFunding
    } else {
      const limitedFunding = new BountyFundingLimited()
      limitedFunding.maxFundingAmount = funding.asLimited.max_funding_amount
      limitedFunding.minFundingAmount = funding.asLimited.min_funding_amount
      limitedFunding.fundingPeriod = funding.asLimited.funding_period.toNumber()
      return limitedFunding
    }
  }

  function asContractType(assuranceContract: AssuranceContractType) {
    if (assuranceContract.isOpen) {
      return new BountyContractOpen()
    } else {
      const closedContract = new BountyContractClosed()
      closedContract.whitelist = assuranceContract.asClosed.map((id) => new Membership({ id: String(id) }))
      return closedContract
    }
  }

  function asForumThread(threadId: number | undefined) {
    if (typeof threadId === 'number') {
      return new ForumThread({ id: String(threadId) })
    }
  }
}
