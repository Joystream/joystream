// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { BTreeMap, BTreeSet, Bytes, Option, Vec, bool, u32, u64 } from '@polkadot/types';
import type { ApplicationId, ApplicationIdToWorkerIdMap, BagId, CategoryId, Channel, ChannelCategory, ChannelCategoryCreationParameters, ChannelCategoryId, ChannelCategoryUpdateParameters, ChannelCreationParameters, ChannelId, ChannelOwnershipTransferRequest, ChannelOwnershipTransferRequestId, ChannelUpdateParameters, Cid, ContentActor, CuratorGroupId, CuratorId, DataObjectId, DistributionBucketFamilyId, DistributionBucketId, DynamicBagDeletionPrizeRecord, DynamicBagId, DynamicBagType, EntryMethod, IsCensored, MemberId, MintBalanceOf, MintId, NewAssets, OpeningId, PersonCreationParameters, PersonId, PersonUpdateParameters, PlaylistCreationParameters, PlaylistId, PlaylistUpdateParameters, PostId, ProposalId, ProposalStatus, RationaleText, Series, SeriesId, SeriesParameters, StorageBucketId, ThreadId, UploadParameters, VideoCategoryCreationParameters, VideoCategoryId, VideoCategoryUpdateParameters, VideoCreationParameters, VideoId, VideoUpdateParameters, VoteKind, Voucher, WorkerId } from './all';
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
    content: {
      ChannelAssetsRemoved: AugmentedEvent<ApiType, [ContentActor, ChannelId, BTreeSet<DataObjectId>, Channel]>;
      ChannelCategoryCreated: AugmentedEvent<ApiType, [ChannelCategoryId, ChannelCategory, ChannelCategoryCreationParameters]>;
      ChannelCategoryDeleted: AugmentedEvent<ApiType, [ContentActor, ChannelCategoryId]>;
      ChannelCategoryUpdated: AugmentedEvent<ApiType, [ContentActor, ChannelCategoryId, ChannelCategoryUpdateParameters]>;
      ChannelCensorshipStatusUpdated: AugmentedEvent<ApiType, [ContentActor, ChannelId, IsCensored, Bytes]>;
      ChannelCreated: AugmentedEvent<ApiType, [ContentActor, ChannelId, Channel, ChannelCreationParameters]>;
      ChannelDeleted: AugmentedEvent<ApiType, [ContentActor, ChannelId]>;
      ChannelOwnershipTransferred: AugmentedEvent<ApiType, [ContentActor, ChannelOwnershipTransferRequestId]>;
      ChannelOwnershipTransferRequested: AugmentedEvent<ApiType, [ContentActor, ChannelOwnershipTransferRequestId, ChannelOwnershipTransferRequest]>;
      ChannelOwnershipTransferRequestWithdrawn: AugmentedEvent<ApiType, [ContentActor, ChannelOwnershipTransferRequestId]>;
      ChannelUpdated: AugmentedEvent<ApiType, [ContentActor, ChannelId, Channel, ChannelUpdateParameters]>;
      CuratorAdded: AugmentedEvent<ApiType, [CuratorGroupId, CuratorId]>;
      CuratorGroupCreated: AugmentedEvent<ApiType, [CuratorGroupId]>;
      CuratorGroupStatusSet: AugmentedEvent<ApiType, [CuratorGroupId, bool]>;
      CuratorRemoved: AugmentedEvent<ApiType, [CuratorGroupId, CuratorId]>;
      FeaturedVideosSet: AugmentedEvent<ApiType, [ContentActor, Vec<VideoId>]>;
      PersonCreated: AugmentedEvent<ApiType, [ContentActor, PersonId, NewAssets, PersonCreationParameters]>;
      PersonDeleted: AugmentedEvent<ApiType, [ContentActor, PersonId]>;
      PersonUpdated: AugmentedEvent<ApiType, [ContentActor, PersonId, NewAssets, PersonUpdateParameters]>;
      PlaylistCreated: AugmentedEvent<ApiType, [ContentActor, PlaylistId, PlaylistCreationParameters]>;
      PlaylistDeleted: AugmentedEvent<ApiType, [ContentActor, PlaylistId]>;
      PlaylistUpdated: AugmentedEvent<ApiType, [ContentActor, PlaylistId, PlaylistUpdateParameters]>;
      SeriesCreated: AugmentedEvent<ApiType, [ContentActor, SeriesId, NewAssets, SeriesParameters, Series]>;
      SeriesDeleted: AugmentedEvent<ApiType, [ContentActor, SeriesId]>;
      SeriesUpdated: AugmentedEvent<ApiType, [ContentActor, SeriesId, NewAssets, SeriesParameters, Series]>;
      VideoCategoryCreated: AugmentedEvent<ApiType, [ContentActor, VideoCategoryId, VideoCategoryCreationParameters]>;
      VideoCategoryDeleted: AugmentedEvent<ApiType, [ContentActor, VideoCategoryId]>;
      VideoCategoryUpdated: AugmentedEvent<ApiType, [ContentActor, VideoCategoryId, VideoCategoryUpdateParameters]>;
      VideoCensorshipStatusUpdated: AugmentedEvent<ApiType, [ContentActor, VideoId, IsCensored, Bytes]>;
      VideoCreated: AugmentedEvent<ApiType, [ContentActor, ChannelId, VideoId, VideoCreationParameters]>;
      VideoDeleted: AugmentedEvent<ApiType, [ContentActor, VideoId]>;
      VideoUpdated: AugmentedEvent<ApiType, [ContentActor, VideoId, VideoUpdateParameters]>;
    };
    contentWorkingGroup: {
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
      /**
       * Emits on updating the worker storage role.
       * Params:
       * - Id of the worker.
       * - Raw storage field.
       **/
      WorkerStorageUpdated: AugmentedEvent<ApiType, [WorkerId, Bytes]>;
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
    distributionWorkingGroup: {
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
      /**
       * Emits on updating the worker storage role.
       * Params:
       * - Id of the worker.
       * - Raw storage field.
       **/
      WorkerStorageUpdated: AugmentedEvent<ApiType, [WorkerId, Bytes]>;
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
    gatewayWorkingGroup: {
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
      /**
       * Emits on updating the worker storage role.
       * Params:
       * - Id of the worker.
       * - Raw storage field.
       **/
      WorkerStorageUpdated: AugmentedEvent<ApiType, [WorkerId, Bytes]>;
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
      MemberRegistered: AugmentedEvent<ApiType, [MemberId, AccountId, EntryMethod]>;
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
    operationsWorkingGroup: {
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
      /**
       * Emits on updating the worker storage role.
       * Params:
       * - Id of the worker.
       * - Raw storage field.
       **/
      WorkerStorageUpdated: AugmentedEvent<ApiType, [WorkerId, Bytes]>;
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
    storage: {
      /**
       * Bag objects changed.
       * Params
       * - bag id
       * - new total objects size
       * - new total objects number
       **/
      BagObjectsChanged: AugmentedEvent<ApiType, [BagId, u64, u64]>;
      /**
       * Emits on changing the size-based pricing of new objects uploaded.
       * Params
       * - new data size fee
       **/
      DataObjectPerMegabyteFeeUpdated: AugmentedEvent<ApiType, [Balance]>;
      /**
       * Emits on data objects deletion from bags.
       * Params
       * - account ID for the deletion prize
       * - bag ID
       * - data object IDs
       **/
      DataObjectsDeleted: AugmentedEvent<ApiType, [AccountId, BagId, BTreeSet<DataObjectId>]>;
      /**
       * Emits on moving data objects between bags.
       * Params
       * - source bag ID
       * - destination bag ID
       * - data object IDs
       **/
      DataObjectsMoved: AugmentedEvent<ApiType, [BagId, BagId, BTreeSet<DataObjectId>]>;
      /**
       * Emits on uploading data objects.
       * Params
       * - data objects IDs
       * - initial uploading parameters
       **/
      DataObjectsUploaded: AugmentedEvent<ApiType, [Vec<DataObjectId>, UploadParameters]>;
      /**
       * Emits on creating distribution bucket.
       * Params
       * - distribution bucket family ID
       * - accepting new bags
       * - distribution bucket ID
       **/
      DistributionBucketCreated: AugmentedEvent<ApiType, [DistributionBucketFamilyId, bool, DistributionBucketId]>;
      /**
       * Emits on deleting distribution bucket.
       * Params
       * - distribution bucket family ID
       * - distribution bucket ID
       **/
      DistributionBucketDeleted: AugmentedEvent<ApiType, [DistributionBucketFamilyId, DistributionBucketId]>;
      /**
       * Emits on creating distribution bucket family.
       * Params
       * - distribution family bucket ID
       **/
      DistributionBucketFamilyCreated: AugmentedEvent<ApiType, [DistributionBucketFamilyId]>;
      /**
       * Emits on deleting distribution bucket family.
       * Params
       * - distribution family bucket ID
       **/
      DistributionBucketFamilyDeleted: AugmentedEvent<ApiType, [DistributionBucketFamilyId]>;
      /**
       * Emits on setting the metadata by a distribution bucket family.
       * Params
       * - distribution bucket family ID
       * - metadata
       **/
      DistributionBucketFamilyMetadataSet: AugmentedEvent<ApiType, [DistributionBucketFamilyId, Bytes]>;
      /**
       * Emits on accepting a distribution bucket invitation for the operator.
       * Params
       * - worker ID
       * - distribution bucket family ID
       * - distribution bucket ID
       **/
      DistributionBucketInvitationAccepted: AugmentedEvent<ApiType, [WorkerId, DistributionBucketFamilyId, DistributionBucketId]>;
      /**
       * Emits on canceling a distribution bucket invitation for the operator.
       * Params
       * - distribution bucket family ID
       * - distribution bucket ID
       * - operator worker ID
       **/
      DistributionBucketInvitationCancelled: AugmentedEvent<ApiType, [DistributionBucketFamilyId, DistributionBucketId, WorkerId]>;
      /**
       * Emits on setting the metadata by a distribution bucket operator.
       * Params
       * - worker ID
       * - distribution bucket family ID
       * - distribution bucket ID
       * - metadata
       **/
      DistributionBucketMetadataSet: AugmentedEvent<ApiType, [WorkerId, DistributionBucketFamilyId, DistributionBucketId, Bytes]>;
      /**
       * Emits on storage bucket mode update (distributing flag).
       * Params
       * - distribution bucket family ID
       * - distribution bucket ID
       * - distributing
       **/
      DistributionBucketModeUpdated: AugmentedEvent<ApiType, [DistributionBucketFamilyId, DistributionBucketId, bool]>;
      /**
       * Emits on creating a distribution bucket invitation for the operator.
       * Params
       * - distribution bucket family ID
       * - distribution bucket ID
       * - worker ID
       **/
      DistributionBucketOperatorInvited: AugmentedEvent<ApiType, [DistributionBucketFamilyId, DistributionBucketId, WorkerId]>;
      /**
       * Emits on the distribution bucket operator removal.
       * Params
       * - distribution bucket family ID
       * - distribution bucket ID
       * - distribution bucket operator ID
       **/
      DistributionBucketOperatorRemoved: AugmentedEvent<ApiType, [DistributionBucketFamilyId, DistributionBucketId, WorkerId]>;
      /**
       * Emits on changing the "Distribution buckets per bag" number limit.
       * Params
       * - new limit
       **/
      DistributionBucketsPerBagLimitUpdated: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on storage bucket status update (accepting new bags).
       * Params
       * - distribution bucket family ID
       * - distribution bucket ID
       * - new status (accepting new bags)
       **/
      DistributionBucketStatusUpdated: AugmentedEvent<ApiType, [DistributionBucketFamilyId, DistributionBucketId, bool]>;
      /**
       * Emits on updating distribution buckets for bag.
       * Params
       * - bag ID
       * - storage buckets to add ID collection
       * - storage buckets to remove ID collection
       **/
      DistributionBucketsUpdatedForBag: AugmentedEvent<ApiType, [BagId, DistributionBucketFamilyId, BTreeSet<DistributionBucketId>, BTreeSet<DistributionBucketId>]>;
      /**
       * Emits on creating a dynamic bag.
       * Params
       * - dynamic bag ID
       * - optional DynamicBagDeletionPrize instance
       * - assigned storage buckets' IDs
       * - assigned distribution buckets' IDs
       **/
      DynamicBagCreated: AugmentedEvent<ApiType, [DynamicBagId, Option<DynamicBagDeletionPrizeRecord>, BTreeSet<StorageBucketId>, BTreeSet<DistributionBucketId>]>;
      /**
       * Emits on deleting a dynamic bag.
       * Params
       * - account ID for the deletion prize
       * - dynamic bag ID
       **/
      DynamicBagDeleted: AugmentedEvent<ApiType, [AccountId, DynamicBagId]>;
      /**
       * Emits on dynamic bag creation policy update (distribution bucket families).
       * Params
       * - dynamic bag type
       * - families and bucket numbers
       **/
      FamiliesInDynamicBagCreationPolicyUpdated: AugmentedEvent<ApiType, [DynamicBagType, BTreeMap<DistributionBucketFamilyId, u32>]>;
      /**
       * Emits on updating the number of storage buckets in dynamic bag creation policy.
       * Params
       * - dynamic bag type
       * - new number of storage buckets
       **/
      NumberOfStorageBucketsInDynamicBagCreationPolicyUpdated: AugmentedEvent<ApiType, [DynamicBagType, u64]>;
      /**
       * Emits on accepting pending data objects.
       * Params
       * - storage bucket ID
       * - worker ID (storage provider ID)
       * - bag ID
       * - pending data objects
       **/
      PendingDataObjectsAccepted: AugmentedEvent<ApiType, [StorageBucketId, WorkerId, BagId, BTreeSet<DataObjectId>]>;
      /**
       * Emits on creating the storage bucket.
       * Params
       * - storage bucket ID
       * - invited worker
       * - flag "accepting_new_bags"
       * - size limit for voucher,
       * - objects limit for voucher,
       **/
      StorageBucketCreated: AugmentedEvent<ApiType, [StorageBucketId, Option<WorkerId>, bool, u64, u64]>;
      /**
       * Emits on storage bucket deleting.
       * Params
       * - storage bucket ID
       **/
      StorageBucketDeleted: AugmentedEvent<ApiType, [StorageBucketId]>;
      /**
       * Emits on accepting the storage bucket invitation.
       * Params
       * - storage bucket ID
       * - invited worker ID
       **/
      StorageBucketInvitationAccepted: AugmentedEvent<ApiType, [StorageBucketId, WorkerId]>;
      /**
       * Emits on cancelling the storage bucket invitation.
       * Params
       * - storage bucket ID
       **/
      StorageBucketInvitationCancelled: AugmentedEvent<ApiType, [StorageBucketId]>;
      /**
       * Emits on the storage bucket operator invitation.
       * Params
       * - storage bucket ID
       * - operator worker ID (storage provider ID)
       **/
      StorageBucketOperatorInvited: AugmentedEvent<ApiType, [StorageBucketId, WorkerId]>;
      /**
       * Emits on the storage bucket operator removal.
       * Params
       * - storage bucket ID
       **/
      StorageBucketOperatorRemoved: AugmentedEvent<ApiType, [StorageBucketId]>;
      /**
       * Emits on changing the "Storage buckets per bag" number limit.
       * Params
       * - new limit
       **/
      StorageBucketsPerBagLimitUpdated: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on storage bucket status update.
       * Params
       * - storage bucket ID
       * - new status
       **/
      StorageBucketStatusUpdated: AugmentedEvent<ApiType, [StorageBucketId, bool]>;
      /**
       * Emits on updating storage buckets for bag.
       * Params
       * - bag ID
       * - storage buckets to add ID collection
       * - storage buckets to remove ID collection
       **/
      StorageBucketsUpdatedForBag: AugmentedEvent<ApiType, [BagId, BTreeSet<StorageBucketId>, BTreeSet<StorageBucketId>]>;
      /**
       * Emits on changing the "Storage buckets voucher max limits".
       * Params
       * - new objects size limit
       * - new objects number limit
       **/
      StorageBucketsVoucherMaxLimitsUpdated: AugmentedEvent<ApiType, [u64, u64]>;
      /**
       * Emits on setting the storage bucket voucher limits.
       * Params
       * - storage bucket ID
       * - new total objects size limit
       * - new total objects number limit
       **/
      StorageBucketVoucherLimitsSet: AugmentedEvent<ApiType, [StorageBucketId, u64, u64]>;
      /**
       * Emits on setting the storage operator metadata.
       * Params
       * - storage bucket ID
       * - invited worker ID
       * - metadata
       **/
      StorageOperatorMetadataSet: AugmentedEvent<ApiType, [StorageBucketId, WorkerId, Bytes]>;
      /**
       * Emits on updating the blacklist with data hashes.
       * Params
       * - hashes to remove from the blacklist
       * - hashes to add to the blacklist
       **/
      UpdateBlacklist: AugmentedEvent<ApiType, [BTreeSet<Cid>, BTreeSet<Cid>]>;
      /**
       * Emits on changing the size-based pricing of new objects uploaded.
       * Params
       * - new status
       **/
      UploadingBlockStatusUpdated: AugmentedEvent<ApiType, [bool]>;
      /**
       * Emits on changing the voucher for a storage bucket.
       * Params
       * - storage bucket ID
       * - new voucher
       **/
      VoucherChanged: AugmentedEvent<ApiType, [StorageBucketId, Voucher]>;
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
      /**
       * Emits on updating the worker storage role.
       * Params:
       * - Id of the worker.
       * - Raw storage field.
       **/
      WorkerStorageUpdated: AugmentedEvent<ApiType, [WorkerId, Bytes]>;
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
  }

  export interface DecoratedEvents<ApiType extends ApiTypes> extends AugmentedEvents<ApiType> {
  }
}
