import { DatabaseManager, EventContext, StoreContext } from '@joystream/hydra-common'
import { BountyMetadata } from '@joystream/metadata-protobuf'
import { AssuranceContractType, BountyActor, BountyId, FundingType } from '@joystream/types/augment'
import {
  Bounty,
  BountyCanceledEvent,
  BountyContractClosed,
  BountyContractOpen,
  BountyContribution,
  BountyCreatedEvent,
  BountyCreatorCherryWithdrawalEvent,
  BountyFundedEvent,
  BountyFundingLimited,
  BountyFundingPerpetual,
  BountyFundingWithdrawalEvent,
  BountyMaxFundingReachedEvent,
  BountyStage,
  BountyVetoedEvent,
  ForumThread,
  Membership,
} from 'query-node/dist/model'
import { Bounty as BountyEvents } from '../generated/types'
import { deserializeMetadata, genericEventFields } from './common'
import { scheduleAtBlock } from './scheduler'

/**
 * Common helpers
 */

async function getBounty(store: DatabaseManager, bountyId: BountyId): Promise<Bounty> {
  const bounty = await store.get(Bounty, { where: { id: bountyId } })
  if (!bounty) {
    throw new Error(`Bounty not found by id: ${bountyId}`)
  }
  return bounty
}

async function getContribution(
  store: DatabaseManager,
  bountyId: BountyId,
  contributor?: string
): Promise<BountyContribution> {
  const contribution = await store.get(BountyContribution, { where: { bountyId, contributor } })
  if (!contribution) {
    const actorType = typeof contributor === 'undefined' ? 'council' : `member id ${contributor}`
    throw new Error(`Bounty contribution not found by contributor: ${actorType}`)
  }
  return contribution
}

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

export function bountyScheduleFundingEnd(store: DatabaseManager, bounty: Bounty): void {
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

export function bountyScheduleWorkSubmissionEnd(store: DatabaseManager, bounty: Bounty): void {
  if (bounty.stage !== BountyStage.WorkSubmission) return

  const workingPeriodEnd = fundingPeriodEnd(bounty) + bounty.workPeriod
  scheduleAtBlock(workingPeriodEnd, () => {
    if (bounty.stage === BountyStage.WorkSubmission) {
      endWorkingPeriod(store, bounty)
    }
  })
}

export function bountyScheduleJudgementEnd(store: DatabaseManager, bounty: Bounty): void {
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

function endFundingPeriod(store: DatabaseManager, bounty: Bounty, isFunded = true): Promise<void> {
  bounty.updatedAt = new Date()
  if (isFunded) {
    bounty.stage = BountyStage.WorkSubmission
    bountyScheduleWorkSubmissionEnd(store, bounty)
  } else {
    bounty.stage = BountyStage[bounty.contributions?.length ? 'Failed' : 'Expired']
  }
  return store.save<Bounty>(bounty)
}

function endWorkingPeriod(store: DatabaseManager, bounty: Bounty): Promise<void> {
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

// Store new bounties and their creation event
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

// Store bounty canceled events
export async function bounty_BountyCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  const bountyCanceledEvent = new BountyEvents.BountyCanceledEvent(event)
  const [bountyId] = bountyCanceledEvent.params

  const bounty = new Bounty({ id: String(bountyId) })
  const canceledEvent = new BountyCanceledEvent({ ...genericEventFields(event), bounty })

  await store.save<BountyCanceledEvent>(canceledEvent)
}

// Store bounty vetoed events
export async function bounty_BountyVetoed({ event, store }: EventContext & StoreContext): Promise<void> {
  const bountyVetoedEvent = new BountyEvents.BountyVetoedEvent(event)
  const [bountyId] = bountyVetoedEvent.params
  const bounty = new Bounty({ id: String(bountyId) })
  const vetoedEvent = new BountyVetoedEvent({ ...genericEventFields(event), bounty })

  await store.save<BountyVetoedEvent>(vetoedEvent)
}

// Store new contributions and their BountyFunded events
export async function bounty_BountyFunded({ event, store }: EventContext & StoreContext): Promise<void> {
  const bountyFundedEvent = new BountyEvents.BountyFundedEvent(event)
  const [bountyId, contributorActor, amount] = bountyFundedEvent.params
  const eventTime = new Date(event.blockTimestamp)

  const bounty = await getBounty(store, bountyId)

  bounty.updatedAt = eventTime
  bounty.totalFunding = bounty.totalFunding.add(amount)

  await store.save<Bounty>(bounty)

  const contribution = new BountyContribution({
    createdAt: eventTime,
    updatedAt: eventTime,
    bounty,
    contributor: bountyActorToMembership(contributorActor),
    amount,
  })

  await store.save<BountyContribution>(contribution)

  const fundedEvent = new BountyFundedEvent({ ...genericEventFields(event), contribution })

  await store.save<BountyFundedEvent>(fundedEvent)
}

// Store BountyMaxFundingReached event and update the bounty stage
export async function bounty_BountyMaxFundingReached({ event, store }: EventContext & StoreContext): Promise<void> {
  const maxFundingReachedEvent = new BountyEvents.BountyMaxFundingReachedEvent(event)
  const [bountyId] = maxFundingReachedEvent.params

  // Record the event
  const bounty = new Bounty({ id: String(bountyId) })
  const maxFundingReachedInEvent = new BountyMaxFundingReachedEvent({ ...genericEventFields(event), bounty })

  await store.save<BountyMaxFundingReachedEvent>(maxFundingReachedInEvent)

  // Update the bounty stage
  endFundingPeriod(store, bounty)
}

export async function bounty_BountyFundingWithdrawal({ event, store }: EventContext & StoreContext): Promise<void> {
  const fundingWithdrawalEvent = new BountyEvents.BountyFundingWithdrawalEvent(event)
  const [bountyId, contributorActor] = fundingWithdrawalEvent.params
  const eventTime = new Date(event.blockTimestamp)

  const contributor = bountyActorToMembership(contributorActor)
  const contribution = await getContribution(store, bountyId, contributor?.id)

  // Update the bounty totalFunding
  const bounty = await getBounty(store, bountyId)
  bounty.updatedAt = eventTime
  bounty.totalFunding = bounty.totalFunding.sub(contribution.amount)

  await store.save<Bounty>(bounty)

  // Record the event
  const withdrawalInEvent = new BountyFundingWithdrawalEvent({ ...genericEventFields(event), contribution })

  await store.save<BountyFundingWithdrawalEvent>(withdrawalInEvent)
}

export async function bounty_BountyCreatorCherryWithdrawal({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const cherryWithdrawalEvent = new BountyEvents.BountyCreatorCherryWithdrawalEvent(event)
  const [bountyId] = cherryWithdrawalEvent.params
  const eventTime = new Date(event.blockTimestamp)

  // Update the bounty totalFunding
  const bounty = await getBounty(store, bountyId)
  bounty.updatedAt = eventTime
  bounty.totalFunding = bounty.totalFunding.sub(bounty.cherry)

  await store.save<Bounty>(bounty)

  // Record the event
  const withdrawalInEvent = new BountyCreatorCherryWithdrawalEvent({ ...genericEventFields(event), bounty })

  await store.save<BountyCreatorCherryWithdrawalEvent>(withdrawalInEvent)
}
