// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { Option, Vec, bool, u16, u32, u64 } from '@polkadot/types';
import type { Actor, ApplicationId, ApplicationIdToWorkerIdMap, CategoryId, ChannelId, ClassId, ContentId, CuratorApplicationId, CuratorApplicationIdToCuratorIdMap, CuratorGroupId, CuratorId, CuratorOpeningId, DataObjectStorageRelationshipId, DataObjectTypeId, EntityController, EntityCreationVoucher, EntityId, FailedAt, IPNSIdentity, LeadId, MemberId, MintBalanceOf, MintId, Nonce, OpeningId, PostId, PropertyId, ProposalId, ProposalStatus, RationaleText, SchemaId, SideEffect, SideEffects, Status, StorageProviderId, ThreadId, VecMaxLength, VoteKind, WorkerId } from './all';
import type { BalanceStatus } from '@polkadot/types/interfaces/balances';
import type { AuthorityId } from '@polkadot/types/interfaces/consensus';
import type { AuthorityList } from '@polkadot/types/interfaces/grandpa';
import type { Kind, OpaqueTimeSlot } from '@polkadot/types/interfaces/offences';
import type { AccountId, Balance, BlockNumber, Hash } from '@polkadot/types/interfaces/runtime';
import type { IdentificationTuple, SessionIndex } from '@polkadot/types/interfaces/session';
import type { ElectionCompute, EraIndex } from '@polkadot/types/interfaces/staking';
import type { DispatchError, DispatchInfo, DispatchResult } from '@polkadot/types/interfaces/system';
import type { ApiTypes } from '@polkadot/api/types';

declare module '@polkadot/api/types/events' {
  export interface AugmentedEvents<ApiType> {
    balances: {
      /**
       * A balance was set by root. \[who, free, reserved\]
       **/
      BalanceSet: AugmentedEvent<ApiType, [AccountId, Balance, Balance]>;
      /**
       * Some amount was deposited (e.g. for transaction fees). \[who, deposit\]
       **/
      Deposit: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * An account was removed whose balance was non-zero but below ExistentialDeposit,
       * resulting in an outright loss. \[account, balance\]
       **/
      DustLost: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * An account was created with some free balance. \[account, free_balance\]
       **/
      Endowed: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * Some balance was reserved (moved from free to reserved). \[who, value\]
       **/
      Reserved: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * Some balance was moved from the reserve of the first account to the second account.
       * Final argument indicates the destination balance type.
       * \[from, to, balance, destination_status\]
       **/
      ReserveRepatriated: AugmentedEvent<ApiType, [AccountId, AccountId, Balance, BalanceStatus]>;
      /**
       * Transfer succeeded. \[from, to, value\]
       **/
      Transfer: AugmentedEvent<ApiType, [AccountId, AccountId, Balance]>;
      /**
       * Some balance was unreserved (moved from reserved to free). \[who, value\]
       **/
      Unreserved: AugmentedEvent<ApiType, [AccountId, Balance]>;
    };
    contentDirectory: {
      ClassCreated: AugmentedEvent<ApiType, [ClassId]>;
      ClassPermissionsUpdated: AugmentedEvent<ApiType, [ClassId]>;
      ClassSchemaAdded: AugmentedEvent<ApiType, [ClassId, SchemaId]>;
      ClassSchemaStatusUpdated: AugmentedEvent<ApiType, [ClassId, SchemaId, Status]>;
      CuratorAdded: AugmentedEvent<ApiType, [CuratorGroupId, CuratorId]>;
      CuratorGroupAdded: AugmentedEvent<ApiType, [CuratorGroupId]>;
      CuratorGroupRemoved: AugmentedEvent<ApiType, [CuratorGroupId]>;
      CuratorGroupStatusSet: AugmentedEvent<ApiType, [CuratorGroupId, Status]>;
      CuratorRemoved: AugmentedEvent<ApiType, [CuratorGroupId, CuratorId]>;
      EntityCreated: AugmentedEvent<ApiType, [Actor, EntityId]>;
      EntityCreationVoucherCreated: AugmentedEvent<ApiType, [EntityController, EntityCreationVoucher]>;
      EntityCreationVoucherUpdated: AugmentedEvent<ApiType, [EntityController, EntityCreationVoucher]>;
      EntityOwnershipTransfered: AugmentedEvent<ApiType, [EntityId, EntityController, SideEffects]>;
      EntityPermissionsUpdated: AugmentedEvent<ApiType, [EntityId]>;
      EntityPropertyValuesUpdated: AugmentedEvent<ApiType, [Actor, EntityId, SideEffects]>;
      EntityRemoved: AugmentedEvent<ApiType, [Actor, EntityId]>;
      EntitySchemaSupportAdded: AugmentedEvent<ApiType, [Actor, EntityId, SchemaId, SideEffects]>;
      InsertedAtVectorIndex: AugmentedEvent<ApiType, [Actor, EntityId, PropertyId, VecMaxLength, Nonce, SideEffect]>;
      MaintainerAdded: AugmentedEvent<ApiType, [ClassId, CuratorGroupId]>;
      MaintainerRemoved: AugmentedEvent<ApiType, [ClassId, CuratorGroupId]>;
      RemovedAtVectorIndex: AugmentedEvent<ApiType, [Actor, EntityId, PropertyId, VecMaxLength, Nonce, SideEffect]>;
      TransactionCompleted: AugmentedEvent<ApiType, [Actor]>;
      TransactionFailed: AugmentedEvent<ApiType, [Actor, FailedAt]>;
      VectorCleared: AugmentedEvent<ApiType, [Actor, EntityId, PropertyId, SideEffects]>;
    };
    contentDirectoryWorkingGroup: {
      /**
       * Emits on accepting application for the worker opening.
       * Params:
       * - Opening id
       **/
      AcceptedApplications: AugmentedEvent<ApiType, [OpeningId]>;
      /**
       * Emits on terminating the application for the worker/lead opening.
       * Params:
       * - Worker application id
       **/
      ApplicationTerminated: AugmentedEvent<ApiType, [ApplicationId]>;
      /**
       * Emits on withdrawing the application for the worker/lead opening.
       * Params:
       * - Worker application id
       **/
      ApplicationWithdrawn: AugmentedEvent<ApiType, [ApplicationId]>;
      /**
       * Emits on adding the application for the worker opening.
       * Params:
       * - Opening id
       * - Application id
       **/
      AppliedOnOpening: AugmentedEvent<ApiType, [OpeningId, ApplicationId]>;
      /**
       * Emits on beginning the application review for the worker/lead opening.
       * Params:
       * - Opening id
       **/
      BeganApplicationReview: AugmentedEvent<ApiType, [OpeningId]>;
      /**
       * Emits on setting the leader.
       * Params:
       * - Worker id.
       **/
      LeaderSet: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on un-setting the leader.
       * Params:
       **/
      LeaderUnset: AugmentedEvent<ApiType, []>;
      /**
       * Emits on changing working group mint capacity.
       * Params:
       * - mint id.
       * - new mint balance.
       **/
      MintCapacityChanged: AugmentedEvent<ApiType, [MintId, MintBalanceOf]>;
      /**
       * Emits on adding new worker opening.
       * Params:
       * - Opening id
       **/
      OpeningAdded: AugmentedEvent<ApiType, [OpeningId]>;
      /**
       * Emits on filling the worker opening.
       * Params:
       * - Worker opening id
       * - Worker application id to the worker id dictionary
       **/
      OpeningFilled: AugmentedEvent<ApiType, [OpeningId, ApplicationIdToWorkerIdMap]>;
      /**
       * Emits on decreasing the worker/lead stake.
       * Params:
       * - worker/lead id.
       **/
      StakeDecreased: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on increasing the worker/lead stake.
       * Params:
       * - worker/lead id.
       **/
      StakeIncreased: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on slashing the worker/lead stake.
       * Params:
       * - worker/lead id.
       **/
      StakeSlashed: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on terminating the leader.
       * Params:
       * - leader worker id.
       * - termination rationale text
       **/
      TerminatedLeader: AugmentedEvent<ApiType, [WorkerId, RationaleText]>;
      /**
       * Emits on terminating the worker.
       * Params:
       * - worker id.
       * - termination rationale text
       **/
      TerminatedWorker: AugmentedEvent<ApiType, [WorkerId, RationaleText]>;
      /**
       * Emits on exiting the worker.
       * Params:
       * - worker id.
       * - exit rationale text
       **/
      WorkerExited: AugmentedEvent<ApiType, [WorkerId, RationaleText]>;
      /**
       * Emits on updating the reward account of the worker.
       * Params:
       * - Member id of the worker.
       * - Reward account id of the worker.
       **/
      WorkerRewardAccountUpdated: AugmentedEvent<ApiType, [WorkerId, AccountId]>;
      /**
       * Emits on updating the reward amount of the worker.
       * Params:
       * - Id of the worker.
       **/
      WorkerRewardAmountUpdated: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on updating the role account of the worker.
       * Params:
       * - Id of the worker.
       * - Role account id of the worker.
       **/
      WorkerRoleAccountUpdated: AugmentedEvent<ApiType, [WorkerId, AccountId]>;
    };
    contentWorkingGroup: {
      AcceptedCuratorApplications: AugmentedEvent<ApiType, [CuratorOpeningId]>;
      AppliedOnCuratorOpening: AugmentedEvent<ApiType, [CuratorOpeningId, CuratorApplicationId]>;
      BeganCuratorApplicationReview: AugmentedEvent<ApiType, [CuratorOpeningId]>;
      ChannelCreated: AugmentedEvent<ApiType, [ChannelId]>;
      ChannelCreationEnabledUpdated: AugmentedEvent<ApiType, [bool]>;
      ChannelOwnershipTransferred: AugmentedEvent<ApiType, [ChannelId]>;
      ChannelUpdatedByCurationActor: AugmentedEvent<ApiType, [ChannelId]>;
      CuratorApplicationTerminated: AugmentedEvent<ApiType, [CuratorApplicationId]>;
      CuratorApplicationWithdrawn: AugmentedEvent<ApiType, [CuratorApplicationId]>;
      CuratorExited: AugmentedEvent<ApiType, [CuratorId]>;
      CuratorOpeningAdded: AugmentedEvent<ApiType, [CuratorOpeningId]>;
      CuratorOpeningFilled: AugmentedEvent<ApiType, [CuratorOpeningId, CuratorApplicationIdToCuratorIdMap]>;
      CuratorRewardAccountUpdated: AugmentedEvent<ApiType, [CuratorId, AccountId]>;
      CuratorRoleAccountUpdated: AugmentedEvent<ApiType, [CuratorId, AccountId]>;
      CuratorUnstaking: AugmentedEvent<ApiType, [CuratorId]>;
      LeadSet: AugmentedEvent<ApiType, [LeadId]>;
      LeadUnset: AugmentedEvent<ApiType, [LeadId]>;
      MintCapacityDecreased: AugmentedEvent<ApiType, [MintId, MintBalanceOf, MintBalanceOf]>;
      MintCapacityIncreased: AugmentedEvent<ApiType, [MintId, MintBalanceOf, MintBalanceOf]>;
      TerminatedCurator: AugmentedEvent<ApiType, [CuratorId]>;
    };
    council: {
      CouncilTermEnded: AugmentedEvent<ApiType, [BlockNumber]>;
      NewCouncilTermStarted: AugmentedEvent<ApiType, [BlockNumber]>;
    };
    councilElection: {
      AnnouncingEnded: AugmentedEvent<ApiType, []>;
      AnnouncingStarted: AugmentedEvent<ApiType, [u32]>;
      Applied: AugmentedEvent<ApiType, [AccountId]>;
      CouncilElected: AugmentedEvent<ApiType, [BlockNumber]>;
      /**
       * A new election started
       **/
      ElectionStarted: AugmentedEvent<ApiType, []>;
      Revealed: AugmentedEvent<ApiType, [AccountId, Hash, AccountId]>;
      RevealingEnded: AugmentedEvent<ApiType, []>;
      RevealingStarted: AugmentedEvent<ApiType, []>;
      Voted: AugmentedEvent<ApiType, [AccountId, Hash]>;
      VotingEnded: AugmentedEvent<ApiType, []>;
      VotingStarted: AugmentedEvent<ApiType, []>;
    };
    dataDirectory: {
      /**
       * Emits when the storage provider accepts a content.
       * Params:
       * - Id of the relationship.
       * - Id of the storage provider.
       **/
      ContentAccepted: AugmentedEvent<ApiType, [ContentId, StorageProviderId]>;
      /**
       * Emits on adding of the content.
       * Params:
       * - Id of the relationship.
       * - Id of the member.
       **/
      ContentAdded: AugmentedEvent<ApiType, [ContentId, MemberId]>;
      /**
       * Emits when the storage provider rejects a content.
       * Params:
       * - Id of the relationship.
       * - Id of the storage provider.
       **/
      ContentRejected: AugmentedEvent<ApiType, [ContentId, StorageProviderId]>;
    };
    dataObjectStorageRegistry: {
      /**
       * Emits on adding of the data object storage relationship.
       * Params:
       * - Id of the relationship.
       * - Id of the content.
       * - Id of the storage provider.
       **/
      DataObjectStorageRelationshipAdded: AugmentedEvent<ApiType, [DataObjectStorageRelationshipId, ContentId, StorageProviderId]>;
      /**
       * Emits on adding of the data object storage relationship.
       * Params:
       * - Id of the relationship.
       * - Current state of the relationship (True=Active).
       **/
      DataObjectStorageRelationshipReadyUpdated: AugmentedEvent<ApiType, [DataObjectStorageRelationshipId, bool]>;
    };
    dataObjectTypeRegistry: {
      /**
       * Emits on the data object type registration.
       * Params:
       * - Id of the new data object type.
       **/
      DataObjectTypeRegistered: AugmentedEvent<ApiType, [DataObjectTypeId]>;
      /**
       * Emits on the data object type update.
       * Params:
       * - Id of the updated data object type.
       **/
      DataObjectTypeUpdated: AugmentedEvent<ApiType, [DataObjectTypeId]>;
    };
    discovery: {
      /**
       * Emits on removing of the account info.
       * Params:
       * - Id of the storage provider.
       **/
      AccountInfoRemoved: AugmentedEvent<ApiType, [StorageProviderId]>;
      /**
       * Emits on updating of the account info.
       * Params:
       * - Id of the storage provider.
       * - Id of the IPNS.
       **/
      AccountInfoUpdated: AugmentedEvent<ApiType, [StorageProviderId, IPNSIdentity]>;
    };
    forum: {
      /**
       * A category was introduced
       **/
      CategoryCreated: AugmentedEvent<ApiType, [CategoryId]>;
      /**
       * A category with given id was updated.
       * The second argument reflects the new archival status of the category, if changed.
       * The third argument reflects the new deletion status of the category, if changed.
       **/
      CategoryUpdated: AugmentedEvent<ApiType, [CategoryId, Option<bool>, Option<bool>]>;
      /**
       * Given account was set as forum sudo.
       **/
      ForumSudoSet: AugmentedEvent<ApiType, [Option<AccountId>, Option<AccountId>]>;
      /**
       * Post with given id was created.
       **/
      PostAdded: AugmentedEvent<ApiType, [PostId]>;
      /**
       * Post with givne id was moderated.
       **/
      PostModerated: AugmentedEvent<ApiType, [PostId]>;
      /**
       * Post with given id had its text updated.
       * The second argument reflects the number of total edits when the text update occurs.
       **/
      PostTextUpdated: AugmentedEvent<ApiType, [PostId, u64]>;
      /**
       * A thread with given id was created.
       **/
      ThreadCreated: AugmentedEvent<ApiType, [ThreadId]>;
      /**
       * A thread with given id was moderated.
       **/
      ThreadModerated: AugmentedEvent<ApiType, [ThreadId]>;
    };
    grandpa: {
      /**
       * New authority set has been applied. \[authority_set\]
       **/
      NewAuthorities: AugmentedEvent<ApiType, [AuthorityList]>;
      /**
       * Current authority set has been paused.
       **/
      Paused: AugmentedEvent<ApiType, []>;
      /**
       * Current authority set has been resumed.
       **/
      Resumed: AugmentedEvent<ApiType, []>;
    };
    imOnline: {
      /**
       * At the end of the session, no offence was committed.
       **/
      AllGood: AugmentedEvent<ApiType, []>;
      /**
       * A new heartbeat was received from `AuthorityId` \[authority_id\]
       **/
      HeartbeatReceived: AugmentedEvent<ApiType, [AuthorityId]>;
      /**
       * At the end of the session, at least one validator was found to be \[offline\].
       **/
      SomeOffline: AugmentedEvent<ApiType, [Vec<IdentificationTuple>]>;
    };
    members: {
      MemberRegistered: AugmentedEvent<ApiType, [MemberId, AccountId]>;
      MemberSetControllerAccount: AugmentedEvent<ApiType, [MemberId, AccountId]>;
      MemberSetRootAccount: AugmentedEvent<ApiType, [MemberId, AccountId]>;
      MemberUpdatedAboutText: AugmentedEvent<ApiType, [MemberId]>;
      MemberUpdatedAvatar: AugmentedEvent<ApiType, [MemberId]>;
      MemberUpdatedHandle: AugmentedEvent<ApiType, [MemberId]>;
    };
    memo: {
      MemoUpdated: AugmentedEvent<ApiType, [AccountId]>;
    };
    offences: {
      /**
       * There is an offence reported of the given `kind` happened at the `session_index` and
       * (kind-specific) time slot. This event is not deposited for duplicate slashes. last
       * element indicates of the offence was applied (true) or queued (false)
       * \[kind, timeslot, applied\].
       **/
      Offence: AugmentedEvent<ApiType, [Kind, OpaqueTimeSlot, bool]>;
    };
    proposalsDiscussion: {
      /**
       * Emits on post creation.
       **/
      PostCreated: AugmentedEvent<ApiType, [PostId, MemberId]>;
      /**
       * Emits on post update.
       **/
      PostUpdated: AugmentedEvent<ApiType, [PostId, MemberId]>;
      /**
       * Emits on thread creation.
       **/
      ThreadCreated: AugmentedEvent<ApiType, [ThreadId, MemberId]>;
    };
    proposalsEngine: {
      /**
       * Emits on proposal creation.
       * Params:
       * - Member id of a proposer.
       * - Id of a newly created proposal after it was saved in storage.
       **/
      ProposalCreated: AugmentedEvent<ApiType, [MemberId, ProposalId]>;
      /**
       * Emits on proposal status change.
       * Params:
       * - Id of a updated proposal.
       * - New proposal status
       **/
      ProposalStatusUpdated: AugmentedEvent<ApiType, [ProposalId, ProposalStatus]>;
      /**
       * Emits on voting for the proposal
       * Params:
       * - Voter - member id of a voter.
       * - Id of a proposal.
       * - Kind of vote.
       **/
      Voted: AugmentedEvent<ApiType, [MemberId, ProposalId, VoteKind]>;
    };
    session: {
      /**
       * New session has happened. Note that the argument is the \[session_index\], not the block
       * number as the type might suggest.
       **/
      NewSession: AugmentedEvent<ApiType, [SessionIndex]>;
    };
    staking: {
      /**
       * An account has bonded this amount. \[stash, amount\]
       * 
       * NOTE: This event is only emitted when funds are bonded via a dispatchable. Notably,
       * it will not be emitted for staking rewards when they are added to stake.
       **/
      Bonded: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * The era payout has been set; the first balance is the validator-payout; the second is
       * the remainder from the maximum amount of reward.
       * \[era_index, validator_payout, remainder\]
       **/
      EraPayout: AugmentedEvent<ApiType, [EraIndex, Balance, Balance]>;
      /**
       * An old slashing report from a prior era was discarded because it could
       * not be processed. \[session_index\]
       **/
      OldSlashingReportDiscarded: AugmentedEvent<ApiType, [SessionIndex]>;
      /**
       * The staker has been rewarded by this amount. \[stash, amount\]
       **/
      Reward: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * One validator (and its nominators) has been slashed by the given amount.
       * \[validator, amount\]
       **/
      Slash: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * A new solution for the upcoming election has been stored. \[compute\]
       **/
      SolutionStored: AugmentedEvent<ApiType, [ElectionCompute]>;
      /**
       * A new set of stakers was elected with the given \[compute\].
       **/
      StakingElection: AugmentedEvent<ApiType, [ElectionCompute]>;
      /**
       * An account has unbonded this amount. \[stash, amount\]
       **/
      Unbonded: AugmentedEvent<ApiType, [AccountId, Balance]>;
      /**
       * An account has called `withdraw_unbonded` and removed unbonding chunks worth `Balance`
       * from the unlocking queue. \[stash, amount\]
       **/
      Withdrawn: AugmentedEvent<ApiType, [AccountId, Balance]>;
    };
    storageWorkingGroup: {
      /**
       * Emits on accepting application for the worker opening.
       * Params:
       * - Opening id
       **/
      AcceptedApplications: AugmentedEvent<ApiType, [OpeningId]>;
      /**
       * Emits on terminating the application for the worker/lead opening.
       * Params:
       * - Worker application id
       **/
      ApplicationTerminated: AugmentedEvent<ApiType, [ApplicationId]>;
      /**
       * Emits on withdrawing the application for the worker/lead opening.
       * Params:
       * - Worker application id
       **/
      ApplicationWithdrawn: AugmentedEvent<ApiType, [ApplicationId]>;
      /**
       * Emits on adding the application for the worker opening.
       * Params:
       * - Opening id
       * - Application id
       **/
      AppliedOnOpening: AugmentedEvent<ApiType, [OpeningId, ApplicationId]>;
      /**
       * Emits on beginning the application review for the worker/lead opening.
       * Params:
       * - Opening id
       **/
      BeganApplicationReview: AugmentedEvent<ApiType, [OpeningId]>;
      /**
       * Emits on setting the leader.
       * Params:
       * - Worker id.
       **/
      LeaderSet: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on un-setting the leader.
       * Params:
       **/
      LeaderUnset: AugmentedEvent<ApiType, []>;
      /**
       * Emits on changing working group mint capacity.
       * Params:
       * - mint id.
       * - new mint balance.
       **/
      MintCapacityChanged: AugmentedEvent<ApiType, [MintId, MintBalanceOf]>;
      /**
       * Emits on adding new worker opening.
       * Params:
       * - Opening id
       **/
      OpeningAdded: AugmentedEvent<ApiType, [OpeningId]>;
      /**
       * Emits on filling the worker opening.
       * Params:
       * - Worker opening id
       * - Worker application id to the worker id dictionary
       **/
      OpeningFilled: AugmentedEvent<ApiType, [OpeningId, ApplicationIdToWorkerIdMap]>;
      /**
       * Emits on decreasing the worker/lead stake.
       * Params:
       * - worker/lead id.
       **/
      StakeDecreased: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on increasing the worker/lead stake.
       * Params:
       * - worker/lead id.
       **/
      StakeIncreased: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on slashing the worker/lead stake.
       * Params:
       * - worker/lead id.
       **/
      StakeSlashed: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on terminating the leader.
       * Params:
       * - leader worker id.
       * - termination rationale text
       **/
      TerminatedLeader: AugmentedEvent<ApiType, [WorkerId, RationaleText]>;
      /**
       * Emits on terminating the worker.
       * Params:
       * - worker id.
       * - termination rationale text
       **/
      TerminatedWorker: AugmentedEvent<ApiType, [WorkerId, RationaleText]>;
      /**
       * Emits on exiting the worker.
       * Params:
       * - worker id.
       * - exit rationale text
       **/
      WorkerExited: AugmentedEvent<ApiType, [WorkerId, RationaleText]>;
      /**
       * Emits on updating the reward account of the worker.
       * Params:
       * - Member id of the worker.
       * - Reward account id of the worker.
       **/
      WorkerRewardAccountUpdated: AugmentedEvent<ApiType, [WorkerId, AccountId]>;
      /**
       * Emits on updating the reward amount of the worker.
       * Params:
       * - Id of the worker.
       **/
      WorkerRewardAmountUpdated: AugmentedEvent<ApiType, [WorkerId]>;
      /**
       * Emits on updating the role account of the worker.
       * Params:
       * - Id of the worker.
       * - Role account id of the worker.
       **/
      WorkerRoleAccountUpdated: AugmentedEvent<ApiType, [WorkerId, AccountId]>;
    };
    sudo: {
      /**
       * The \[sudoer\] just switched identity; the old key is supplied.
       **/
      KeyChanged: AugmentedEvent<ApiType, [AccountId]>;
      /**
       * A sudo just took place. \[result\]
       **/
      Sudid: AugmentedEvent<ApiType, [DispatchResult]>;
      /**
       * A sudo just took place. \[result\]
       **/
      SudoAsDone: AugmentedEvent<ApiType, [bool]>;
    };
    system: {
      /**
       * `:code` was updated.
       **/
      CodeUpdated: AugmentedEvent<ApiType, []>;
      /**
       * An extrinsic failed. \[error, info\]
       **/
      ExtrinsicFailed: AugmentedEvent<ApiType, [DispatchError, DispatchInfo]>;
      /**
       * An extrinsic completed successfully. \[info\]
       **/
      ExtrinsicSuccess: AugmentedEvent<ApiType, [DispatchInfo]>;
      /**
       * An \[account\] was reaped.
       **/
      KilledAccount: AugmentedEvent<ApiType, [AccountId]>;
      /**
       * A new \[account\] was created.
       **/
      NewAccount: AugmentedEvent<ApiType, [AccountId]>;
    };
    utility: {
      /**
       * Batch of dispatches completed fully with no error.
       **/
      BatchCompleted: AugmentedEvent<ApiType, []>;
      /**
       * Batch of dispatches did not complete fully. Index of first failing dispatch given, as
       * well as the error. \[index, error\]
       **/
      BatchInterrupted: AugmentedEvent<ApiType, [u32, DispatchError]>;
    };
    versionedStore: {
      ClassCreated: AugmentedEvent<ApiType, [ClassId]>;
      ClassSchemaAdded: AugmentedEvent<ApiType, [ClassId, u16]>;
      EntityCreated: AugmentedEvent<ApiType, [EntityId]>;
      EntityPropertiesUpdated: AugmentedEvent<ApiType, [EntityId]>;
      EntitySchemaAdded: AugmentedEvent<ApiType, [EntityId, u16]>;
      /**
       * This is a fake event that uses AccountId type just to make Rust compiler happy to compile this module.
       **/
      FixCompilation: AugmentedEvent<ApiType, [AccountId]>;
    };
  }

  export interface DecoratedEvents<ApiType extends ApiTypes> extends AugmentedEvents<ApiType> {
  }
}
