import { DatabaseManager, EventContext, StoreContext, SubstrateEvent } from '@joystream/hydra-common'
import { BountyMetadata } from '@joystream/metadata-protobuf'
import { AssuranceContractType, BountyActor, BountyId, EntryId, FundingType } from '@joystream/types/augment'
import {
  Bounty,
  BountyCanceledEvent,
  BountyContractClosed,
  BountyContractOpen,
  BountyContribution,
  BountyCreatedEvent,
  BountyCreatorCherryWithdrawalEvent,
  BountyEntry,
  BountyEntryStatusCashedOut,
  BountyEntryStatusRejected,
  BountyEntryStatusWithdrawn,
  BountyEntryStatusWorking,
  BountyFundedEvent,
  BountyFundingLimited,
  BountyFundingPerpetual,
  BountyFundingWithdrawalEvent,
  BountyMaxFundingReachedEvent,
  BountyRemovedEvent,
  BountyStage,
  BountyVetoedEvent,
  ForumThread,
  Membership,
  WorkEntrantFundsWithdrawnEvent,
  WorkEntryAnnouncedEvent,
  WorkEntrySlashedEvent,
  WorkEntryWithdrawnEvent,
  WorkSubmittedEvent,
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

async function getEntry(store: DatabaseManager, entryId: EntryId): Promise<BountyEntry> {
  const entry = await store.get(BountyEntry, { where: { id: entryId } })
  if (!entry) {
    throw new Error(`Entry not found by id: ${entryId}`)
  }
  return entry
}

interface BountyEvent {
  ctx: SubstrateEvent
  params: [BountyId, ...any]
}
async function updateBounty(store: DatabaseManager, event: BountyEvent, changes: (bounty: Bounty) => Partial<Bounty>) {
  const [bountyId] = event.params
  const bounty = await getBounty(store, bountyId)
  bounty.updatedAt = new Date(event.ctx.blockTimestamp)
  Object.assign(bounty, changes(bounty))

  await store.save<BountyEntry>(bounty)

  return bounty
}

interface EntryEvent {
  ctx: SubstrateEvent
  params: [any, EntryId, ...any]
}
async function updateEntry(
  store: DatabaseManager,
  event: EntryEvent,
  changes: (bounty: BountyEntry) => Partial<BountyEntry>
) {
  const [, entryId] = event.params
  const entry = await getEntry(store, entryId)
  entry.updatedAt = new Date(event.ctx.blockTimestamp)
  Object.assign(entry, changes(entry))

  await store.save<BountyEntry>(entry)

  return entry
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

  // Create the bounty
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

  // Record the event
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

// Store bounties canceled events
export async function bounty_BountyCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  const bountyCanceledEvent = new BountyEvents.BountyCanceledEvent(event)
  const [bountyId] = bountyCanceledEvent.params

  const bounty = new Bounty({ id: String(bountyId) })
  const canceledEvent = new BountyCanceledEvent({ ...genericEventFields(event), bounty })

  await store.save<BountyCanceledEvent>(canceledEvent)
}

// Store bounties vetoed events
export async function bounty_BountyVetoed({ event, store }: EventContext & StoreContext): Promise<void> {
  const bountyVetoedEvent = new BountyEvents.BountyVetoedEvent(event)
  const [bountyId] = bountyVetoedEvent.params
  const bounty = new Bounty({ id: String(bountyId) })
  const vetoedEvent = new BountyVetoedEvent({ ...genericEventFields(event), bounty })

  await store.save<BountyVetoedEvent>(vetoedEvent)
}

// Store new contributions and add their amount to their bounty totalFunding
export async function bounty_BountyFunded({ event, store }: EventContext & StoreContext): Promise<void> {
  const bountyFundedEvent = new BountyEvents.BountyFundedEvent(event)
  const [, contributorActor, amount] = bountyFundedEvent.params
  const eventTime = new Date(event.blockTimestamp)

  // Update the bounty totalFunding
  const bounty = await updateBounty(store, bountyFundedEvent, (bounty) => ({
    totalFunding: bounty.totalFunding.add(amount),
  }))

  // Create the contribution
  const contribution = new BountyContribution({
    createdAt: eventTime,
    updatedAt: eventTime,
    bounty,
    contributor: bountyActorToMembership(contributorActor),
    amount,
  })
  await store.save<BountyContribution>(contribution)

  // Record the event
  const fundedEvent = new BountyFundedEvent({ ...genericEventFields(event), contribution })
  await store.save<BountyFundedEvent>(fundedEvent)
}

// Start bounties working stage
export async function bounty_BountyMaxFundingReached({ event, store }: EventContext & StoreContext): Promise<void> {
  const maxFundingReachedEvent = new BountyEvents.BountyMaxFundingReachedEvent(event)
  const [bountyId] = maxFundingReachedEvent.params

  // Update the bounty stage
  const bounty = await getBounty(store, bountyId)
  await endFundingPeriod(store, bounty)

  // Record the event
  const maxFundingReachedInEvent = new BountyMaxFundingReachedEvent({ ...genericEventFields(event), bounty })
  await store.save<BountyMaxFundingReachedEvent>(maxFundingReachedInEvent)
}

// Store BountyFundingWithdrawal events (also update the contribution deleteAt time)
export async function bounty_BountyFundingWithdrawal({ event, store }: EventContext & StoreContext): Promise<void> {
  const fundingWithdrawalEvent = new BountyEvents.BountyFundingWithdrawalEvent(event)
  const [bountyId, contributorActor] = fundingWithdrawalEvent.params
  const eventTime = new Date(event.blockTimestamp)

  // Update the contribution
  const contributor = bountyActorToMembership(contributorActor)
  const contribution = await getContribution(store, bountyId, contributor?.id)
  contribution.updatedAt = eventTime
  contribution.deletedAt = eventTime
  await store.save<BountyContribution>(contribution)

  // Update the bounty totalFunding
  await updateBounty(store, fundingWithdrawalEvent, (bounty) => ({
    totalFunding: bounty.totalFunding.sub(contribution.amount),
  }))

  // Record the event
  const withdrawnInEvent = new BountyFundingWithdrawalEvent({ ...genericEventFields(event), contribution })
  await store.save<BountyFundingWithdrawalEvent>(withdrawnInEvent)
}

// Remove the cherries amount from their bounty totalFunding
export async function bounty_BountyCreatorCherryWithdrawal({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const cherryWithdrawalEvent = new BountyEvents.BountyCreatorCherryWithdrawalEvent(event)

  // Update the bounty totalFunding
  const bounty = await updateBounty(store, cherryWithdrawalEvent, (bounty) => ({
    totalFunding: bounty.totalFunding.sub(bounty.cherry),
  }))

  // Record the event
  const withdrawnInEvent = new BountyCreatorCherryWithdrawalEvent({ ...genericEventFields(event), bounty })
  await store.save<BountyCreatorCherryWithdrawalEvent>(withdrawnInEvent)
}

// Terminate removed bounties
export async function bounty_BountyRemoved({ event, store }: EventContext & StoreContext): Promise<void> {
  const bountyRemovedEvent = new BountyEvents.BountyRemovedEvent(event)

  // Terminate the bounty
  const bounty = await updateBounty(store, bountyRemovedEvent, (bounty) => ({
    deletedAt: bounty.updatedAt,
    stage: BountyStage.Terminated,
  }))

  // Record the event
  const removedInEvent = new BountyRemovedEvent({ ...genericEventFields(event), bounty })
  await store.save<BountyRemovedEvent>(removedInEvent)
}

// Store new entries
export async function bounty_WorkEntryAnnounced({ event, store }: EventContext & StoreContext): Promise<void> {
  const entryAnnouncedEvent = new BountyEvents.WorkEntryAnnouncedEvent(event)
  const [bountyId, entryId, memberId, accountId] = entryAnnouncedEvent.params
  const eventTime = new Date(event.blockTimestamp)

  // Create the entry
  const entry = new BountyEntry({
    id: String(entryId),
    createdAt: eventTime,
    updatedAt: eventTime,
    bounty: new Bounty({ id: String(bountyId) }),
    worker: new Membership({ id: String(memberId) }),
    stakingAccount: String(accountId),
    workSubmitted: false,
    status: new BountyEntryStatusWorking(),
  })
  await store.save<BountyEntry>(entry)

  // Record the event
  const announcedEvent = new WorkEntryAnnouncedEvent({ ...genericEventFields(event), entry })
  await store.save<WorkEntryAnnouncedEvent>(announcedEvent)
}

// Change withdrawn entries status to withdrawn
export async function bounty_WorkEntryWithdrawn({ event, store }: EventContext & StoreContext): Promise<void> {
  const entryWithdrawnEvent = new BountyEvents.WorkEntryWithdrawnEvent(event)

  // Update the entry status
  const entry = await updateEntry(store, entryWithdrawnEvent, () => ({
    status: new BountyEntryStatusWithdrawn(),
  }))

  // Record the event
  const withdrawnInEvent = new WorkEntryWithdrawnEvent({ ...genericEventFields(event), entry })
  await store.save<WorkEntryWithdrawnEvent>(withdrawnInEvent)
}

// Store WorkEntrySlashed events
export async function bounty_WorkEntrySlashed({ event, store }: EventContext & StoreContext): Promise<void> {
  const entrySlashedEvent = new BountyEvents.WorkEntrySlashedEvent(event)

  // Update the entry status
  const entry = await updateEntry(store, entrySlashedEvent, () => ({
    status: new BountyEntryStatusRejected(),
  }))

  // Record the event
  const slashedInEvent = new WorkEntrySlashedEvent({ ...genericEventFields(event), entry })
  await store.save<WorkEntrySlashedEvent>(slashedInEvent)
}

// Store WorkSubmitted events
export async function bounty_WorkSubmitted({ event, store }: EventContext & StoreContext): Promise<void> {
  const entrySlashedEvent = new BountyEvents.WorkEntrySlashedEvent(event)

  // Update the entry status
  const entry = await updateEntry(store, entrySlashedEvent, () => ({
    workSubmitted: true,
  }))

  // Record the event
  const submittedInEvent = new WorkSubmittedEvent({ ...genericEventFields(event), entry })
  await store.save<WorkEntrySlashedEvent>(submittedInEvent)
}

// Change cashed out entries status to CashedOut
export async function bounty_WorkEntrantFundsWithdrawn({ event, store }: EventContext & StoreContext): Promise<void> {
  const entrantFundsWithdrawnEvent = new BountyEvents.WorkEntrantFundsWithdrawnEvent(event)

  // Update the entry status
  const entry = await updateEntry(store, entrantFundsWithdrawnEvent, (entry) => {
    const status = new BountyEntryStatusCashedOut()
    if ('reward' in entry.status) {
      status.reward = entry.status.reward
    }
    return { status: new BountyEntryStatusCashedOut() }
  })

  await store.save<BountyEntry>(entry)

  // Record the event
  const cashOutEvent = new WorkEntrantFundsWithdrawnEvent({ ...genericEventFields(event), entry })
  await store.save<WorkEntrantFundsWithdrawnEvent>(cashOutEvent)
}
