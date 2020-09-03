import { Text, u32, Tuple, u8, Vec, Option, Null, Bytes } from '@polkadot/types'
import { bool, u128 } from '@polkadot/types/primitive'
import { BlockNumber, Balance } from '@polkadot/types/interfaces'
import AccountId from '@polkadot/types/generic/AccountId'
import { ThreadId, WorkingGroup, JoyEnum, JoyStructDecorated } from './common'
import { MemberId } from './members'
import { RoleParameters } from './roles'
import { StakeId } from './stake'
import { ElectionParameters } from './council'
import { ActivateOpeningAt, OpeningId, ApplicationId } from './hiring'
import { WorkingGroupOpeningPolicyCommitment, WorkerId, RewardPolicy } from './working-group'

export type IVotingResults = {
  abstensions: u32
  approvals: u32
  rejections: u32
  slashes: u32
}

export class VotingResults extends JoyStructDecorated({
  abstensions: u32,
  approvals: u32,
  rejections: u32,
  slashes: u32,
}) {}

export type ProposalParametersType = {
  // During this period, votes can be accepted
  votingPeriod: BlockNumber
  /* A pause before execution of the approved proposal. Zero means approved proposal would be
     executed immediately. */
  gracePeriod: BlockNumber
  // Quorum percentage of approving voters required to pass the proposal.
  approvalQuorumPercentage: u32
  // Approval votes percentage threshold to pass the proposal.
  approvalThresholdPercentage: u32
  // Quorum percentage of voters required to slash the proposal.
  slashingQuorumPercentage: u32
  // Slashing votes percentage threshold to slash the proposal.
  slashingThresholdPercentage: u32
  // Proposal stake
  requiredStake: Option<Balance>
}

export class ProposalParameters
  extends JoyStructDecorated({
    votingPeriod: u32,
    gracePeriod: u32,
    approvalQuorumPercentage: u32,
    approvalThresholdPercentage: u32,
    slashingQuorumPercentage: u32,
    slashingThresholdPercentage: u32,
    requiredStake: Option.with(u128),
  })
  implements ProposalParametersType {}

export type IProposal = {
  parameters: ProposalParameters
  proposerId: MemberId
  title: Text
  description: Text
  createdAt: BlockNumber
  status: ProposalStatus
  votingResults: VotingResults
}

export const IProposalStatus: { [key: string]: string } = {
  Active: 'Active',
  Canceled: 'Canceled',
  Expired: 'Expired',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Vetoed: 'Vetoed',
  PendingExecution: 'PendingExecution',
  Executed: 'Executed',
  ExecutionFailed: 'ExecutionFailed',
  Finalized: 'Finalized',
  Slashed: 'Slashed',
}

export type IActiveStake = {
  stake_id: StakeId
  source_account_id: AccountId
}
export class ActiveStake extends JoyStructDecorated({ stake_id: StakeId, source_account_id: AccountId })
  implements IActiveStake {}

export class ExecutionFailedStatus extends JoyStructDecorated({
  error: Vec.with(u8),
}) {}

export class ExecutionFailed extends ExecutionFailedStatus {}

export const ApprovedProposalDef = {
  PendingExecution: Null,
  Executed: Null,
  ExecutionFailed,
} as const
export type ApprovedProposalStatuses = keyof typeof ApprovedProposalDef
export class ApprovedProposalStatus extends JoyEnum(ApprovedProposalDef) {}

export class Approved extends ApprovedProposalStatus {}

export const ProposalDecisionStatusesDef = {
  Canceled: Null,
  Vetoed: Null,
  Rejected: Null,
  Slashed: Null,
  Expired: Null,
  Approved,
} as const
export type ProposalDecisionStatuses = keyof typeof ProposalDecisionStatusesDef
export class ProposalDecisionStatus extends JoyEnum(ProposalDecisionStatusesDef) {}

export type IFinalizationData = {
  proposalStatus: ProposalDecisionStatus
  finalizedAt: BlockNumber
  encodedUnstakingErrorDueToBrokenRuntime: Option<Vec<u8>>
  stakeDataAfterUnstakingError: Option<ActiveStake>
}

export class FinalizationData
  // FIXME: Snake case for consistency?
  extends JoyStructDecorated({
    proposalStatus: ProposalDecisionStatus,
    finalizedAt: u32,
    encodedUnstakingErrorDueToBrokenRuntime: Option.with(Vec.with(u8)),
    stakeDataAfterUnstakingError: Option.with(ActiveStake),
  })
  implements IFinalizationData {}

export class Active extends Option.with(ActiveStake) {}
export class Finalized extends FinalizationData {}

export class ProposalStatus extends JoyEnum({
  Active,
  Finalized,
} as const) {}

export const VoteKinds = ['Approve', 'Reject', 'Slash', 'Abstain'] as const
export type VoteKindKey = typeof VoteKinds[number]
export const VoteKindDef = {
  Approve: Null,
  Reject: Null,
  Slash: Null,
  Abstain: Null,
} as const
export class VoteKind extends JoyEnum(VoteKindDef) {}

export type ProposalVotes = [MemberId, VoteKind][]

export class ProposalId extends u32 {}

export class SpendingParams extends Tuple.with(['Balance', 'AccountId']) {}

class SetLeadParams extends Tuple.with([MemberId, AccountId]) {}

export class SetLead extends Option.with(SetLeadParams) {}

export class Proposal
  // FIXME: Snake case for consistency?
  extends JoyStructDecorated({
    // Proposals parameter, characterize different proposal types.
    parameters: ProposalParameters,
    // Identifier of member proposing.
    proposerId: MemberId,
    // Proposal description
    title: Text,
    // Proposal body
    description: Text,
    // When it was created.
    createdAt: u32, // BlockNumber
    /// Current proposal status
    status: ProposalStatus,
    /// Curring voting result for the proposal
    votingResults: VotingResults,
  }) {}

export class ThreadCounter extends JoyStructDecorated({
  author_id: MemberId,
  counter: u32,
}) {}

export class DiscussionThread extends JoyStructDecorated({
  title: Bytes,
  created_at: u32, // BlockNumber
  author_id: MemberId,
}) {}

export class DiscussionPost extends JoyStructDecorated({
  text: Bytes,
  /// When post was added.
  created_at: u32, // BlockNumber
  /// When post was updated last time.
  updated_at: u32, // BlockNumber
  /// Author of the post.
  author_id: MemberId,
  /// Parent thread id for this post
  thread_id: ThreadId,
  /// Defines how many times this post was edited. Zero on creation.
  edition_number: u32,
}) {}

export type IAddOpeningParameters = {
  activate_at: ActivateOpeningAt
  commitment: WorkingGroupOpeningPolicyCommitment
  human_readable_text: Bytes
  working_group: WorkingGroup
}

export class AddOpeningParameters
  extends JoyStructDecorated({
    activate_at: ActivateOpeningAt,
    commitment: WorkingGroupOpeningPolicyCommitment,
    human_readable_text: Bytes,
    working_group: WorkingGroup,
  })
  implements IAddOpeningParameters {}

export type IFillOpeningParameters = {
  opening_id: OpeningId
  successful_application_id: ApplicationId
  reward_policy: Option<RewardPolicy>
  working_group: WorkingGroup
}

export class FillOpeningParameters
  extends JoyStructDecorated({
    opening_id: OpeningId,
    successful_application_id: ApplicationId,
    reward_policy: Option.with(RewardPolicy),
    working_group: WorkingGroup,
  })
  implements IFillOpeningParameters {}

export type ITerminateRoleParameters = {
  worker_id: WorkerId
  rationale: Bytes
  slash: bool
  working_group: WorkingGroup
}

export class TerminateRoleParameters
  extends JoyStructDecorated({
    worker_id: WorkerId,
    rationale: Bytes,
    slash: bool,
    working_group: WorkingGroup,
  })
  implements ITerminateRoleParameters {}

export class ProposalDetails extends JoyEnum({
  Text: Text,
  RuntimeUpgrade: Vec.with(u8),
  SetElectionParameters: ElectionParameters,
  Spending: SpendingParams,
  SetLead: SetLead,
  SetContentWorkingGroupMintCapacity: u128,
  EvictStorageProvider: AccountId,
  SetValidatorCount: u32,
  SetStorageRoleParameters: RoleParameters,
  AddWorkingGroupLeaderOpening: AddOpeningParameters,
  BeginReviewWorkingGroupLeaderApplication: Tuple.with([OpeningId, WorkingGroup]),
  FillWorkingGroupLeaderOpening: FillOpeningParameters,
  SetWorkingGroupMintCapacity: Tuple.with(['Balance', WorkingGroup]),
  DecreaseWorkingGroupLeaderStake: Tuple.with([WorkerId, 'Balance', WorkingGroup]),
  SlashWorkingGroupLeaderStake: Tuple.with([WorkerId, 'Balance', WorkingGroup]),
  SetWorkingGroupLeaderReward: Tuple.with([WorkerId, 'Balance', WorkingGroup]),
  TerminateWorkingGroupLeaderRole: TerminateRoleParameters,
} as const) {}

// export default proposalTypes;
export const proposalsTypes = {
  ProposalId,
  ProposalStatus,
  ProposalOf: Proposal,
  ProposalDetails,
  ProposalDetailsOf: ProposalDetails, // Runtime alias
  VotingResults,
  ProposalParameters,
  VoteKind,
  ThreadCounter,
  DiscussionThread,
  DiscussionPost,
  AddOpeningParameters,
  FillOpeningParameters,
  TerminateRoleParameters,
  // Expose in registry for api.createType purposes:
  ActiveStake,
  FinalizationData,
  ProposalDecisionStatus,
  ExecutionFailed,
}

export default proposalsTypes
