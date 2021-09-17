import { EventContext, StoreContext, DatabaseManager } from '@dzlzv/hydra-common'
import { bytesToString, genericEventFields } from './common'

import {
  // Council events
  AnnouncingPeriodStartedEvent,
  NotEnoughCandidatesEvent,
  VotingPeriodStartedEvent,
  NewCandidateEvent,
  NewCouncilElectedEvent,
  NewCouncilNotElectedEvent,
  CandidacyStakeReleaseEvent,
  CandidacyWithdrawEvent,
  CandidacyNoteSetEvent,
  RewardPaymentEvent,
  BudgetBalanceSetEvent,
  BudgetRefillEvent,
  BudgetRefillPlannedEvent,
  BudgetIncrementUpdatedEvent,
  CouncilorRewardUpdatedEvent,
  RequestFundedEvent,

  // Referendum events
  ReferendumStartedEvent,
  ReferendumStartedForcefullyEvent,
  RevealingStageStartedEvent,
  ReferendumFinishedEvent,
  VoteCastEvent,
  VoteRevealedEvent,
  StakeReleasedEvent,

  // Council & referendum structures
  ReferendumStageRevealingOptionResult,

  // Misc
  Membership,
} from 'query-node/dist/model'
import { Council, Referendum } from './generated/types'

/////////////////// Council events /////////////////////////////////////////////

export async function council_AnnouncingPeriodStartedEvent({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [] = new Council.AnnouncingPeriodStartedEvent(event).params

  const announcingPeriodStartedEvent = new AnnouncingPeriodStartedEvent({
    ...genericEventFields(event),
  })

  await store.save<AnnouncingPeriodStartedEvent>(announcingPeriodStartedEvent)
}
export async function council_NotEnoughCandidatesEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [] = new Council.NotEnoughCandidatesEvent(event).params

  const notEnoughCandidatesEvent = new NotEnoughCandidatesEvent({
    ...genericEventFields(event),
  })

  await store.save<NotEnoughCandidatesEvent>(notEnoughCandidatesEvent)
}
export async function council_VotingPeriodStartedEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [numOfCandidates] = new Council.VotingPeriodStartedEvent(event).params

  const votingPeriodStartedEvent = new VotingPeriodStartedEvent({
    ...genericEventFields(event),
    numOfCandidates,
  })

  await store.save<VotingPeriodStartedEvent>(votingPeriodStartedEvent)
}
export async function council_NewCandidateEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [memberId, stakingAccount, rewardAccount, balance] = new Council.NewCandidateEvent(event).params
  const member = new Membership({ id: memberId.toString() })

  const newCandidateEvent = new NewCandidateEvent({
    ...genericEventFields(event),
    member,
    stakingAccount: stakingAccount.toString(),
    rewardAccount: rewardAccount.toString(),
    balance,
  })

  await store.save<NewCandidateEvent>(newCandidateEvent)
}
export async function council_NewCouncilElectedEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [memberIds] = new Council.NewCouncilElectedEvent(event).params
  const members = await store.getMany(Membership, { where: { id_in: memberIds.map((item) => item.toString()) } })

  const newCouncilElectedEvent = new NewCouncilElectedEvent({
    ...genericEventFields(event),
    electedMembers: members,
  })

  await store.save<NewCouncilElectedEvent>(newCouncilElectedEvent)
}
export async function council_NewCouncilNotElectedEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [] = new Council.NewCouncilNotElectedEvent(event).params

  const newCouncilNotElectedEvent = new NewCouncilNotElectedEvent({
    ...genericEventFields(event),
  })

  await store.save<NewCouncilNotElectedEvent>(newCouncilNotElectedEvent)
}
export async function council_CandidacyStakeReleaseEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [memberId] = new Council.CandidacyStakeReleaseEvent(event).params
  const member = new Membership({ id: memberId.toString() })

  const candidacyStakeReleaseEvent = new CandidacyStakeReleaseEvent({
    ...genericEventFields(event),
    member,
  })

  await store.save<CandidacyStakeReleaseEvent>(candidacyStakeReleaseEvent)
}
export async function council_CandidacyWithdrawEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [memberId] = new Council.CandidacyWithdrawEvent(event).params
  const member = new Membership({ id: memberId.toString() })

  const candidacyWithdrawEvent = new CandidacyWithdrawEvent({
    ...genericEventFields(event),
    member,
  })

  await store.save<CandidacyWithdrawEvent>(candidacyWithdrawEvent)
}
export async function council_CandidacyNoteSetEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [memberId, note] = new Council.CandidacyNoteSetEvent(event).params
  const member = new Membership({ id: memberId.toString() })

  const candidacyNoteSetEvent = new CandidacyNoteSetEvent({
    ...genericEventFields(event),
    member,
    note: bytesToString(note),
  })

  await store.save<CandidacyNoteSetEvent>(candidacyNoteSetEvent)
}
export async function council_RewardPaymentEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [memberId, rewardAccount, paidBalance, missingBalance] = new Council.RewardPaymentEvent(event).params
  const member = new Membership({ id: memberId.toString() })

  const rewardPaymentEvent = new RewardPaymentEvent({
    ...genericEventFields(event),
    member,
    rewardAccount: rewardAccount.toString(),
    paidBalance,
    missingBalance,
  })

  await store.save<RewardPaymentEvent>(rewardPaymentEvent)
}
export async function council_BudgetBalanceSetEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [balance] = new Council.BudgetBalanceSetEvent(event).params

  const budgetBalanceSetEvent = new BudgetBalanceSetEvent({
    ...genericEventFields(event),
    balance,
  })

  await store.save<BudgetBalanceSetEvent>(budgetBalanceSetEvent)
}
export async function council_BudgetRefillEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [balance] = new Council.BudgetRefillEvent(event).params

  const budgetRefillEvent = new BudgetRefillEvent({
    ...genericEventFields(event),
    balance,
  })

  await store.save<BudgetRefillEvent>(budgetRefillEvent)
}
export async function council_BudgetRefillPlannedEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [] = new Council.BudgetRefillPlannedEvent(event).params

  const budgetRefillPlannedEvent = new BudgetRefillPlannedEvent({
    ...genericEventFields(event),
  })

  await store.save<BudgetRefillPlannedEvent>(budgetRefillPlannedEvent)
}
export async function council_BudgetIncrementUpdatedEvent({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [amount] = new Council.BudgetIncrementUpdatedEvent(event).params

  const budgetIncrementUpdatedEvent = new BudgetIncrementUpdatedEvent({
    ...genericEventFields(event),
    amount,
  })

  await store.save<BudgetIncrementUpdatedEvent>(budgetIncrementUpdatedEvent)
}
export async function council_CouncilorRewardUpdatedEvent({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [rewardAmount] = new Council.CouncilorRewardUpdatedEvent(event).params

  const councilorRewardUpdatedEvent = new CouncilorRewardUpdatedEvent({
    ...genericEventFields(event),
    rewardAmount,
  })

  await store.save<CouncilorRewardUpdatedEvent>(councilorRewardUpdatedEvent)
}
export async function council_RequestFundedEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [account, amount] = new Council.RequestFundedEvent(event).params

  const requestFundedEvent = new RequestFundedEvent({
    ...genericEventFields(event),
    account: account.toString(),
    amount,
  })

  await store.save<RequestFundedEvent>(requestFundedEvent)
}

/////////////////// Referendum events //////////////////////////////////////////

export async function referendum_ReferendumStartedEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [] = new Referendum.ReferendumStartedEvent(event).params

  const referendumStartedEvent = new ReferendumStartedEvent({
    ...genericEventFields(event),
  })

  await store.save<ReferendumStartedEvent>(referendumStartedEvent)
}

export async function referendum_ReferendumStartedForcefullyEvent({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [winningTargetCount] = new Referendum.ReferendumStartedForcefullyEvent(event).params

  const referendumStartedForcefullyEvent = new ReferendumStartedForcefullyEvent({
    ...genericEventFields(event),
    winningTargetCount,
  })

  await store.save<ReferendumStartedForcefullyEvent>(referendumStartedForcefullyEvent)
}

export async function referendum_RevealingStageStartedEvent({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [] = new Referendum.RevealingStageStartedEvent(event).params

  const revealingStageStartedEvent = new RevealingStageStartedEvent({
    ...genericEventFields(event),
  })

  await store.save<RevealingStageStartedEvent>(revealingStageStartedEvent)
}

export async function referendum_ReferendumFinishedEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [optionResultsRaw] = new Referendum.ReferendumFinishedEvent(event).params

  const members = await store.getMany(Membership, {
    where: { id_in: optionResultsRaw.map((item) => item.option_id.toString()) },
  })

  const referendumFinishedEvent = new ReferendumFinishedEvent({
    ...genericEventFields(event),
    optionResults: optionResultsRaw.map(
      (item, index) =>
        new ReferendumStageRevealingOptionResult({
          votePower: item.vote_power,
          optionId: members[index],
        })
    ),
  })

  await store.save<ReferendumFinishedEvent>(referendumFinishedEvent)
}

export async function referendum_VoteCastEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [account, hash, votePower] = new Referendum.VoteCastEvent(event).params

  const voteCastEvent = new VoteCastEvent({
    ...genericEventFields(event),
    account: account.toString(),
    hash: bytesToString(hash),
    votePower,
  })

  await store.save<VoteCastEvent>(voteCastEvent)
}

export async function referendum_VoteRevealedEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [account, memberId, salt] = new Referendum.VoteRevealedEvent(event).params
  const member = new Membership({ id: memberId.toString() })

  const voteRevealedEvent = new VoteRevealedEvent({
    ...genericEventFields(event),
    account: account.toString(),
    member: member,
    salt: bytesToString(salt),
  })

  await store.save<VoteRevealedEvent>(voteRevealedEvent)
}

export async function referendum_StakeReleasedEvent({ event, store }: EventContext & StoreContext): Promise<void> {
  const [stakingAccount] = new Referendum.StakeReleasedEvent(event).params

  const stakeReleasedEvent = new StakeReleasedEvent({
    ...genericEventFields(event),
    stakingAccount: stakingAccount.toString(),
  })

  await store.save<StakeReleasedEvent>(stakeReleasedEvent)
}
