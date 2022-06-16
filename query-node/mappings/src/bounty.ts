import { DatabaseManager, EventContext, StoreContext, SubstrateEvent } from '@joystream/hydra-common'
import { BountyMetadata, BountyWorkData } from '@joystream/metadata-protobuf'
import {
  AssuranceContractType,
  BountyActor,
  BountyId,
  EntryId,
  FundingType,
  OracleWorkEntryJudgment,
} from '@joystream/types/augment'
import { MemberId } from '@joystream/types/common'
import { BN } from '@polkadot/util'
import {
  Bounty,
  BountyCanceledEvent,
  BountyContribution,
  BountyCreatedEvent,
  BountyCreatorCherryWithdrawalEvent,
  BountyEntrantWhitelist,
  BountyEntry,
  BountyEntryStatusPassed,
  BountyEntryStatusRejected,
  BountyEntryStatusWinner,
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
  OracleJudgmentSubmittedEvent,
  WorkEntrantFundsWithdrawnEvent,
  WorkEntryAnnouncedEvent,
  WorkEntrySlashedEvent,
  WorkEntryWithdrawnEvent,
  WorkSubmittedEvent,
} from 'query-node/dist/model'
import { Bounty as BountyEvents } from '../generated/types'
import { asBN, asInt32, bytesToString, deserializeMetadata, genericEventFields, perpareString } from './common'
import { scheduleAtBlock } from './scheduler'

/**
 * Common helpers
 */

async function getBounty(store: DatabaseManager, bountyId: BountyId | string, relations?: string[]): Promise<Bounty> {
  const bounty = await store.get(Bounty, { where: { id: bountyId }, relations })
  if (!bounty) {
    throw new Error(`Bounty not found by id: ${bountyId}`)
  }
  return bounty
}

function getContribution(
  store: DatabaseManager,
  bountyId: BountyId,
  contributorId: string | undefined
): Promise<BountyContribution | undefined> {
  return store.get(BountyContribution, {
    where: { bounty: { id: bountyId }, contributor: { id: contributorId ?? null } },
  })
}

async function getEntry(store: DatabaseManager, entryId: EntryId): Promise<BountyEntry> {
  const entry = await store.get(BountyEntry, { where: { id: entryId } })
  if (!entry) {
    throw new Error(`Entry not found by id: ${entryId}`)
  }
  return entry
}

async function updateBounty(
  store: DatabaseManager,
  event: SubstrateEvent,
  bountyId: BountyId,
  relations: string[],
  changes: (bounty: Bounty) => Partial<Bounty>
) {
  const bounty = await getBounty(store, bountyId, relations)
  bounty.updatedAt = new Date(event.blockTimestamp)
  Object.assign(bounty, changes(bounty))

  await store.save<Bounty>(bounty)

  return bounty
}

async function updateEntry(
  store: DatabaseManager,
  event: SubstrateEvent,
  entryId: EntryId,
  changes: (entry: BountyEntry) => Partial<BountyEntry> = () => ({})
) {
  const entry = await getEntry(store, entryId)
  entry.updatedAt = new Date(event.blockTimestamp)
  Object.assign(entry, changes(entry))

  await store.save<BountyEntry>(entry)

  return entry
}

function bountyActorToMembership(actor: BountyActor): Membership | undefined {
  if (actor.isMember) {
    return new Membership({ id: String(actor.asMember) })
  }
}

export function scheduledFundingEnd(bounty: Bounty, creationBlock: number): number | undefined {
  if ('fundingPeriod' in bounty.fundingType) {
    return creationBlock + bounty.fundingType.fundingPeriod
  }
}

function scheduleBountyStageEnd(
  stage: BountyStage,
  endStage: (store: DatabaseManager, bounty: Bounty, blockNumber: number) => Promise<void>,
  relations: string[] = []
): (bounty: Bounty, blockNumber: number | undefined) => void {
  return (bounty, blockNumber) => {
    if (bounty.stage === stage && typeof blockNumber !== 'undefined') {
      const bountyId = bounty.id

      scheduleAtBlock(blockNumber, async (store) => {
        const bounty = await getBounty(store, bountyId, relations)

        if (bounty.stage === stage) {
          await endStage(store, bounty, blockNumber)
        }
      })
    }
  }
}

function whenDef<T, R>(value: T | null | undefined, fn: (value: T) => R): R | undefined {
  if (value !== null && typeof value !== 'undefined') return fn(value)
}

/**
 * Schedule Periods changes
 */

export const bountyScheduleFundingEnd = scheduleBountyStageEnd(
  BountyStage.Funding,
  async (store, bounty, fundingPeriodEnd) => {
    if ('minFundingAmount' in bounty.fundingType) {
      const isFunded = bounty.totalFunding.gte(new BN(bounty.fundingType.minFundingAmount))
      await endFundingPeriod(store, bounty, fundingPeriodEnd, isFunded)
    }
  }
)

export const bountyScheduleWorkSubmissionEnd = scheduleBountyStageEnd(BountyStage.WorkSubmission, endWorkingPeriod, [
  'entries',
])

export const bountyScheduleJudgmentEnd = scheduleBountyStageEnd(
  BountyStage.Judgment,
  // Go to Withdrawal Period
  (store, bounty) => goToWithdrawalPeriod(store, bounty, []),
  ['entries']
)

function endFundingPeriod(
  store: DatabaseManager,
  bounty: Bounty,
  blockNumber: number,
  isFunded: boolean,
  updatedAt = new Date()
): Promise<void> {
  if (isFunded) {
    // Go to Working period
    bounty.updatedAt = updatedAt
    bounty.stage = BountyStage.WorkSubmission
    bountyScheduleWorkSubmissionEnd(bounty, blockNumber + bounty.workPeriod)
    return store.save<Bounty>(bounty)
  } else if (bounty.totalFunding.eqn(0)) {
    // Go to Expired Funding Period
    bounty.updatedAt = updatedAt
    bounty.stage = BountyStage.Expired
    return store.save<Bounty>(bounty)
  } else {
    // Go to Withdrawal Period
    return goToWithdrawalPeriod(store, bounty)
  }
}

function endWorkingPeriod(store: DatabaseManager, bounty: Bounty, blockNumber: number): Promise<void> {
  if (bounty.entries?.some((entry) => entry.workSubmitted)) {
    // Go to Judgement Period
    bounty.updatedAt = new Date()
    bounty.stage = BountyStage.Judgment
    bountyScheduleJudgmentEnd(bounty, blockNumber + bounty.judgingPeriod)
    return store.save<Bounty>(bounty)
  } else {
    // Go to Withdrawal Period
    return goToWithdrawalPeriod(store, bounty)
  }
}

type JudgmentEntries = [EntryId, OracleWorkEntryJudgment][]
async function goToWithdrawalPeriod(
  store: DatabaseManager,
  bounty: Bounty,
  judgementEntries: JudgmentEntries = []
): Promise<void> {
  // Update the bounty status
  const hasWinners = judgementEntries.some(([, judgment]) => judgment.isWinner)
  bounty.updatedAt = new Date()
  bounty.stage = BountyStage[hasWinners ? 'Successful' : 'Failed']
  await store.save<Bounty>(bounty)

  // Update entries statuses
  await Promise.all(
    bounty.entries?.flatMap((entry) => {
      if (entry.status.isTypeOf !== 'BountyEntryStatusWorking') return []

      const judgment = judgementEntries.find(([entryId]) => String(entryId) === entry.id)?.[1]

      if (judgment?.isWinner) {
        const status = new BountyEntryStatusWinner()
        status.reward = asBN(judgment.asWinner.reward)
        entry.status = status
      } else if (judgment?.isRejected) {
        entry.status = new BountyEntryStatusRejected()
      } else {
        entry.status = new BountyEntryStatusPassed()
      }

      return store.save<BountyEntry>(entry)
    }) ?? []
  )
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
  const discussionThread = await whenDef(metadata?.discussionThread, (id) => store.get(ForumThread, { where: { id } }))

  // Create the EntrantWhitelist
  const entrantWhitelist = asEntrantWhitelist(bountyParams.contract_type)
  if (entrantWhitelist) {
    await store.save<BountyEntrantWhitelist>(entrantWhitelist)
  }

  // Create the bounty
  const bounty = new Bounty({
    id: String(bountyId),
    createdAt: eventTime,
    updatedAt: eventTime,
    title: whenDef(metadata?.title, perpareString),
    description: whenDef(metadata?.description, perpareString),
    bannerImageUri: whenDef(metadata?.bannerImageUri, perpareString),
    cherry: bountyParams.cherry,
    entrantStake: bountyParams.entrant_stake,
    creator: bountyActorToMembership(bountyParams.creator),
    oracle: bountyActorToMembership(bountyParams.oracle),
    fundingType: asFundingType(bountyParams.funding_type),
    entrantWhitelist,
    workPeriod: asInt32(bountyParams.work_period),
    judgingPeriod: asInt32(bountyParams.judging_period),

    stage: BountyStage.Funding,
    totalFunding: new BN(0),
    discussionThread,
    isTerminated: false,
  })
  await store.save<Bounty>(bounty)

  bountyScheduleFundingEnd(bounty, scheduledFundingEnd(bounty, event.blockNumber))

  // Record the event
  const createdInEvent = new BountyCreatedEvent({ ...genericEventFields(event), bounty })
  await store.save<BountyCreatedEvent>(createdInEvent)

  function asFundingType(funding: FundingType) {
    if (funding.isPerpetual) {
      const perpetualFunding = new BountyFundingPerpetual()
      perpetualFunding.target = asBN(funding.asPerpetual.target)
      return perpetualFunding
    } else {
      const limitedFunding = new BountyFundingLimited()
      limitedFunding.maxFundingAmount = asBN(funding.asLimited.max_funding_amount)
      limitedFunding.minFundingAmount = asBN(funding.asLimited.min_funding_amount)
      limitedFunding.fundingPeriod = asInt32(funding.asLimited.funding_period)
      return limitedFunding
    }
  }

  function asEntrantWhitelist(assuranceContract: AssuranceContractType): BountyEntrantWhitelist | undefined {
    if (assuranceContract.isClosed) {
      const toMembership = (id: MemberId) => new Membership({ id: String(id) })
      const members = [...assuranceContract.asClosed.values()].map(toMembership)
      return new BountyEntrantWhitelist({ members })
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

// Store new contributions, update the existing ones amounts and add these amounts to their bounty totalFunding
export async function bounty_BountyFunded({ event, store }: EventContext & StoreContext): Promise<void> {
  const bountyFundedEvent = new BountyEvents.BountyFundedEvent(event)
  const [bountyId, contributorActor, amount] = bountyFundedEvent.params
  const eventTime = new Date(event.blockTimestamp)

  // Update the bounty totalFunding
  const bounty = await updateBounty(store, event, bountyId, [], (bounty) => ({
    totalFunding: bounty.totalFunding.add(amount),
  }))

  // Create or update the contribution
  let contribution: BountyContribution
  const contributor = bountyActorToMembership(contributorActor)
  const existing = await getContribution(store, bountyId, contributor?.id)
  if (existing) {
    contribution = existing
    contribution.amount = existing.amount.add(amount)
  } else {
    contribution = new BountyContribution({ createdAt: eventTime, bounty, contributor, amount })
  }
  contribution.updatedAt = eventTime
  await store.save<BountyContribution>(contribution)

  // Record the event
  const fundedEvent = new BountyFundedEvent({ ...genericEventFields(event), contribution })
  await store.save<BountyFundedEvent>(fundedEvent)
}

// Start bounties working stage
export async function bounty_BountyMaxFundingReached({ event, store }: EventContext & StoreContext): Promise<void> {
  const maxFundingReachedEvent = new BountyEvents.BountyMaxFundingReachedEvent(event)
  const [bountyId] = maxFundingReachedEvent.params
  const eventTime = new Date(event.blockTimestamp)

  // Update the bounty stage
  const bounty = await getBounty(store, bountyId)
  await endFundingPeriod(store, bounty, event.blockNumber, true, eventTime)

  // Record the event
  const maxFundingReachedInEvent = new BountyMaxFundingReachedEvent({ ...genericEventFields(event), bounty })
  await store.save<BountyMaxFundingReachedEvent>(maxFundingReachedInEvent)
}

// Store BountyFundingWithdrawal events
export async function bounty_BountyFundingWithdrawal({ event, store }: EventContext & StoreContext): Promise<void> {
  const fundingWithdrawalEvent = new BountyEvents.BountyFundingWithdrawalEvent(event)
  const [bountyId, contributorActor] = fundingWithdrawalEvent.params
  const eventTime = new Date(event.blockTimestamp)

  // Update the contribution
  const contributor = bountyActorToMembership(contributorActor)
  const contribution = await getContribution(store, bountyId, contributor?.id)
  if (!contribution) {
    const actorType = typeof contributor === 'undefined' ? 'council' : `member id ${contributor}`
    throw new Error(`Bounty contribution not found by contributor: ${actorType}`)
  }
  contribution.updatedAt = eventTime
  await store.save<BountyContribution>(contribution)

  // Record the event
  const withdrawnInEvent = new BountyFundingWithdrawalEvent({ ...genericEventFields(event), contribution })
  await store.save<BountyFundingWithdrawalEvent>(withdrawnInEvent)
}

// Store bounties cherry withdrawal events
export async function bounty_BountyCreatorCherryWithdrawal({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const cherryWithdrawalEvent = new BountyEvents.BountyCreatorCherryWithdrawalEvent(event)
  const [bountyId] = cherryWithdrawalEvent.params

  const bounty = new Bounty({ id: String(bountyId) })
  const withdrawnInEvent = new BountyCreatorCherryWithdrawalEvent({ ...genericEventFields(event), bounty })

  await store.save<BountyCreatorCherryWithdrawalEvent>(withdrawnInEvent)
}

// Terminate removed bounties
export async function bounty_BountyRemoved({ event, store }: EventContext & StoreContext): Promise<void> {
  const bountyRemovedEvent = new BountyEvents.BountyRemovedEvent(event)

  // Terminate the bounty
  const bounty = await updateBounty(store, event, bountyRemovedEvent.params[0], [], () => ({ isTerminated: true }))

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
  const entry = await updateEntry(store, event, entryWithdrawnEvent.params[1], () => ({
    status: new BountyEntryStatusWithdrawn(),
  }))

  // Record the event
  const withdrawnInEvent = new WorkEntryWithdrawnEvent({ ...genericEventFields(event), entry })
  await store.save<WorkEntryWithdrawnEvent>(withdrawnInEvent)
}

// Store WorkEntrySlashed events
export async function bounty_WorkEntrySlashed({ event, store }: EventContext & StoreContext): Promise<void> {
  const entrySlashedEvent = new BountyEvents.WorkEntrySlashedEvent(event)
  const [, entryId] = entrySlashedEvent.params

  // Record the event
  const entry = new BountyEntry({ id: String(entryId) })
  const slashedInEvent = new WorkEntrySlashedEvent({ ...genericEventFields(event), entry })
  await store.save<WorkEntrySlashedEvent>(slashedInEvent)
}

// Store WorkSubmitted events
export async function bounty_WorkSubmitted({ event, store }: EventContext & StoreContext): Promise<void> {
  const workSubmittedEvent = new BountyEvents.WorkSubmittedEvent(event)
  const [bountyId, entryId, , metadataBytes] = workSubmittedEvent.params

  // Update the entry
  const entry = await updateEntry(store, event, entryId, () => ({
    workSubmitted: true,
  }))

  // Record the event
  const metadata = deserializeMetadata(BountyWorkData, metadataBytes)
  const submittedInEvent = new WorkSubmittedEvent({
    ...genericEventFields(event),
    bounty: new Bounty({ id: String(bountyId) }),
    entry,
    title: whenDef(metadata?.title, perpareString),
    description: whenDef(metadata?.description, perpareString),
  })

  await store.save<WorkSubmittedEvent>(submittedInEvent)
}

// Start bounties withdrawal period and set entries status to either passed, winner, or rejected
export async function bounty_OracleJudgmentSubmitted({ event, store }: EventContext & StoreContext): Promise<void> {
  const judgmentSubmittedEvent = new BountyEvents.OracleJudgmentSubmittedEvent(event)
  const [bountyId, , bountyJudgment, rationale] = judgmentSubmittedEvent.params

  const bounty = await getBounty(store, bountyId, ['entries'])
  const entryJudgments = Array.from(bountyJudgment.entries())

  // Go to Withdrawal Period (and update entries statuses)
  goToWithdrawalPeriod(store, bounty, entryJudgments)

  // Record the event
  const judgmentEvent = new OracleJudgmentSubmittedEvent({
    ...genericEventFields(event),
    bounty,
    rationale: bytesToString(rationale),
  })

  await store.save<OracleJudgmentSubmittedEvent>(judgmentEvent)
}

// Store entrant funds Withdrawn events
export async function bounty_WorkEntrantFundsWithdrawn({ event, store }: EventContext & StoreContext): Promise<void> {
  const entrantFundsWithdrawnEvent = new BountyEvents.WorkEntrantFundsWithdrawnEvent(event)
  const [, entryId] = entrantFundsWithdrawnEvent.params

  // Update the entry updated at field
  const entry = await updateEntry(store, event, entryId)

  // Record the event
  const cashOutEvent = new WorkEntrantFundsWithdrawnEvent({ ...genericEventFields(event), entry })
  await store.save<WorkEntrantFundsWithdrawnEvent>(cashOutEvent)
}
