// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { ApiTypes } from '@polkadot/api-base/types';
import type { BTreeMap, BTreeSet, Bytes, Null, Option, Result, U8aFixed, Vec, bool, u128, u32, u64, u8 } from '@polkadot/types-codec';
import type { ITuple } from '@polkadot/types-codec/types';
import type { AccountId32, H256, Perquintill } from '@polkadot/types/interfaces/runtime';
import type { FrameSupportTokensMiscBalanceStatus, FrameSupportWeightsDispatchInfo, PalletBountyBountyActor, PalletBountyBountyParametersBTreeSet, PalletBountyOracleWorkEntryJudgment, PalletCommonBalanceKind, PalletCommonWorkingGroupIterableEnumsWorkingGroup, PalletContentChannelCreationParametersRecord, PalletContentChannelFundsDestination, PalletContentChannelRecord, PalletContentChannelUpdateParametersRecord, PalletContentIterableEnumsChannelActionPermission, PalletContentNftLimitPeriod, PalletContentNftTypesEnglishAuctionParamsRecord, PalletContentNftTypesNftIssuanceParametersRecord, PalletContentNftTypesOpenAuctionParamsRecord, PalletContentPendingTransfer, PalletContentPermissionsContentActor, PalletContentPermissionsCuratorGroupIterableEnumsContentModerationAction, PalletContentPermissionsCuratorGroupIterableEnumsPausableChannelFeature, PalletContentTransferCommitmentParametersBTreeMap, PalletContentUpdateChannelPayoutsParametersRecord, PalletContentVideoCreationParametersRecord, PalletContentVideoUpdateParametersRecord, PalletElectionProviderMultiPhaseElectionCompute, PalletForumExtendedPostIdObject, PalletForumPrivilegedActor, PalletImOnlineSr25519AppSr25519Public, PalletMembershipBuyMembershipParameters, PalletMembershipCreateMemberParameters, PalletMembershipGiftMembershipParameters, PalletMembershipInviteMembershipParameters, PalletMultisigTimepoint, PalletProjectTokenTokenIssuanceParameters, PalletProjectTokenTokenSale, PalletProjectTokenTransferPolicy, PalletProjectTokenValidated, PalletProjectTokenValidatedPayment, PalletProposalsCodexGeneralProposalParams, PalletProposalsCodexProposalDetails, PalletProposalsDiscussionThreadModeBTreeSet, PalletProposalsEngineProposalStatusesExecutionStatus, PalletProposalsEngineProposalStatusesProposalDecision, PalletProposalsEngineProposalStatusesProposalStatus, PalletProposalsEngineVoteKind, PalletReferendumOptionResult, PalletStakingExposure, PalletStakingValidatorPrefs, PalletStorageBagIdType, PalletStorageDistributionBucketIdRecord, PalletStorageDynBagCreationParametersRecord, PalletStorageDynamicBagIdType, PalletStorageDynamicBagType, PalletStorageUploadParametersRecord, PalletStorageVoucher, PalletWorkingGroupApplyOnOpeningParams, PalletWorkingGroupOpeningType, PalletWorkingGroupRewardPaymentType, PalletWorkingGroupStakePolicy, SpFinalityGrandpaAppPublic, SpRuntimeDispatchError } from '@polkadot/types/lookup';

declare module '@polkadot/api-base/types/events' {
  export interface AugmentedEvents<ApiType extends ApiTypes> {
    bagsList: {
      /**
       * Moved an account from one bag to another.
       **/
      Rebagged: AugmentedEvent<ApiType, [who: AccountId32, from: u64, to: u64], { who: AccountId32, from: u64, to: u64 }>;
      /**
       * Updated the score of some account to the given amount.
       **/
      ScoreUpdated: AugmentedEvent<ApiType, [who: AccountId32, newScore: u64], { who: AccountId32, newScore: u64 }>;
    };
    balances: {
      /**
       * A balance was set by root.
       **/
      BalanceSet: AugmentedEvent<ApiType, [who: AccountId32, free: u128, reserved: u128], { who: AccountId32, free: u128, reserved: u128 }>;
      /**
       * Some amount was deposited (e.g. for transaction fees).
       **/
      Deposit: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32, amount: u128 }>;
      /**
       * An account was removed whose balance was non-zero but below ExistentialDeposit,
       * resulting in an outright loss.
       **/
      DustLost: AugmentedEvent<ApiType, [account: AccountId32, amount: u128], { account: AccountId32, amount: u128 }>;
      /**
       * An account was created with some free balance.
       **/
      Endowed: AugmentedEvent<ApiType, [account: AccountId32, freeBalance: u128], { account: AccountId32, freeBalance: u128 }>;
      /**
       * Some balance was reserved (moved from free to reserved).
       **/
      Reserved: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32, amount: u128 }>;
      /**
       * Some balance was moved from the reserve of the first account to the second account.
       * Final argument indicates the destination balance type.
       **/
      ReserveRepatriated: AugmentedEvent<ApiType, [from: AccountId32, to: AccountId32, amount: u128, destinationStatus: FrameSupportTokensMiscBalanceStatus], { from: AccountId32, to: AccountId32, amount: u128, destinationStatus: FrameSupportTokensMiscBalanceStatus }>;
      /**
       * Some amount was removed from the account (e.g. for misbehavior).
       **/
      Slashed: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32, amount: u128 }>;
      /**
       * Transfer succeeded.
       **/
      Transfer: AugmentedEvent<ApiType, [from: AccountId32, to: AccountId32, amount: u128], { from: AccountId32, to: AccountId32, amount: u128 }>;
      /**
       * Some balance was unreserved (moved from reserved to free).
       **/
      Unreserved: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32, amount: u128 }>;
      /**
       * Some amount was withdrawn from the account (e.g. for transaction fees).
       **/
      Withdraw: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32, amount: u128 }>;
    };
    bounty: {
      /**
       * Bounty contributor made a message remark
       * Params:
       * - contributor
       * - bounty id
       * - message
       **/
      BountyContributorRemarked: AugmentedEvent<ApiType, [PalletBountyBountyActor, u64, Bytes]>;
      /**
       * A bounty was created.
       * Params:
       * - bounty ID
       * - creation parameters
       * - bounty metadata
       **/
      BountyCreated: AugmentedEvent<ApiType, [u64, PalletBountyBountyParametersBTreeSet, Bytes]>;
      /**
       * A bounty creator has withdrawn the cherry (member or council).
       * Params:
       * - bounty ID
       * - bounty creator
       **/
      BountyCreatorCherryWithdrawal: AugmentedEvent<ApiType, [u64, PalletBountyBountyActor]>;
      /**
       * A bounty creator has withdrawn the oracle reward (member or council).
       * Params:
       * - bounty ID
       * - bounty creator
       **/
      BountyCreatorOracleRewardWithdrawal: AugmentedEvent<ApiType, [u64, PalletBountyBountyActor]>;
      /**
       * Bounty creator made a message remark
       * Params:
       * - creator
       * - bounty id
       * - message
       **/
      BountyCreatorRemarked: AugmentedEvent<ApiType, [PalletBountyBountyActor, u64, Bytes]>;
      /**
       * Bounty entrant made a message remark
       * Params:
       * - entrant_id
       * - bounty id
       * - entry id
       * - message
       **/
      BountyEntrantRemarked: AugmentedEvent<ApiType, [u64, u64, u64, Bytes]>;
      /**
       * A bounty was funded by a member or a council.
       * Params:
       * - bounty ID
       * - bounty funder
       * - funding amount
       **/
      BountyFunded: AugmentedEvent<ApiType, [u64, PalletBountyBountyActor, u128]>;
      /**
       * A member or a council has withdrawn the funding.
       * Params:
       * - bounty ID
       * - bounty funder
       **/
      BountyFundingWithdrawal: AugmentedEvent<ApiType, [u64, PalletBountyBountyActor]>;
      /**
       * A bounty has reached its target funding amount.
       * Params:
       * - bounty ID
       **/
      BountyMaxFundingReached: AugmentedEvent<ApiType, [u64]>;
      /**
       * Bounty oracle made a message remark
       * Params:
       * - oracle
       * - bounty id
       * - message
       **/
      BountyOracleRemarked: AugmentedEvent<ApiType, [PalletBountyBountyActor, u64, Bytes]>;
      /**
       * A Oracle has withdrawn the oracle reward (member or council).
       * Params:
       * - bounty ID
       * - bounty creator
       * - Oracle Reward
       **/
      BountyOracleRewardWithdrawal: AugmentedEvent<ApiType, [u64, PalletBountyBountyActor, u128]>;
      /**
       * Bounty Oracle Switched by current oracle or council.
       * Params:
       * - bounty ID
       * - switcher
       * - current_oracle,
       * - new oracle
       **/
      BountyOracleSwitched: AugmentedEvent<ApiType, [u64, PalletBountyBountyActor, PalletBountyBountyActor, PalletBountyBountyActor]>;
      /**
       * A bounty was removed.
       * Params:
       * - bounty ID
       **/
      BountyRemoved: AugmentedEvent<ApiType, [u64]>;
      /**
       * A bounty was terminated by council.
       * Params:
       * - bounty ID
       * - bounty terminator
       * - bounty creator
       * - bounty oracle
       **/
      BountyTerminated: AugmentedEvent<ApiType, [u64, PalletBountyBountyActor, PalletBountyBountyActor, PalletBountyBountyActor]>;
      /**
       * A member or a council creator has withdrawn the creator state bloat bond.
       * Params:
       * - bounty ID
       * - bounty creator
       * - Creator State bloat bond amount
       **/
      CreatorStateBloatBondWithdrawn: AugmentedEvent<ApiType, [u64, PalletBountyBountyActor, u128]>;
      /**
       * A member or a council funder has withdrawn the funder state bloat bond.
       * Params:
       * - bounty ID
       * - bounty funder
       * - funder State bloat bond amount
       **/
      FunderStateBloatBondWithdrawn: AugmentedEvent<ApiType, [u64, PalletBountyBountyActor, u128]>;
      /**
       * Submit oracle judgment.
       * Params:
       * - bounty ID
       * - oracle
       * - judgment data
       * - rationale
       **/
      OracleJudgmentSubmitted: AugmentedEvent<ApiType, [u64, PalletBountyBountyActor, BTreeMap<u64, PalletBountyOracleWorkEntryJudgment>, Bytes]>;
      /**
       * Work entry was slashed.
       * Params:
       * - bounty ID
       * - entry ID
       * - entrant member ID
       **/
      WorkEntrantFundsWithdrawn: AugmentedEvent<ApiType, [u64, u64, u64]>;
      /**
       * Work entry stake slashed.
       * Params:
       * - bounty ID
       * - entry ID
       * - stake account
       * - slashed amount
       **/
      WorkEntrantStakeSlashed: AugmentedEvent<ApiType, [u64, u64, AccountId32, u128]>;
      /**
       * Work entry stake unlocked.
       * Params:
       * - bounty ID
       * - entry ID
       * - stake account
       **/
      WorkEntrantStakeUnlocked: AugmentedEvent<ApiType, [u64, u64, AccountId32]>;
      /**
       * Work entry was announced.
       * Params:
       * - bounty ID
       * - created entry ID
       * - entrant member ID
       * - staking account ID
       * - work description
       **/
      WorkEntryAnnounced: AugmentedEvent<ApiType, [u64, u64, u64, AccountId32, Bytes]>;
      /**
       * Work entry was slashed.
       * Params:
       * - bounty ID
       * - oracle (caller)
       **/
      WorkSubmissionPeriodEnded: AugmentedEvent<ApiType, [u64, PalletBountyBountyActor]>;
      /**
       * Submit work.
       * Params:
       * - bounty ID
       * - created entry ID
       * - entrant member ID
       * - work data (description, URL, BLOB, etc.)
       **/
      WorkSubmitted: AugmentedEvent<ApiType, [u64, u64, u64, Bytes]>;
    };
    constitution: {
      /**
       * Emits on constitution amendment.
       * Parameters:
       * - constitution text hash
       * - constitution text
       **/
      ConstutionAmended: AugmentedEvent<ApiType, [H256, Bytes]>;
    };
    content: {
      AuctionBidCanceled: AugmentedEvent<ApiType, [u64, u64]>;
      AuctionBidMade: AugmentedEvent<ApiType, [u64, u64, u128, Option<u64>]>;
      AuctionCanceled: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64]>;
      BidMadeCompletingAuction: AugmentedEvent<ApiType, [u64, u64, Option<u64>]>;
      BuyNowCanceled: AugmentedEvent<ApiType, [u64, PalletContentPermissionsContentActor]>;
      BuyNowPriceUpdated: AugmentedEvent<ApiType, [u64, PalletContentPermissionsContentActor, u128]>;
      CancelChannelTransfer: AugmentedEvent<ApiType, [u64, PalletContentPermissionsContentActor]>;
      ChannelAgentRemarked: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, Bytes]>;
      ChannelAssetsDeletedByModerator: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, BTreeSet<u64>, Bytes]>;
      ChannelAssetsRemoved: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, BTreeSet<u64>, PalletContentChannelRecord]>;
      ChannelCreated: AugmentedEvent<ApiType, [u64, PalletContentChannelRecord, PalletContentChannelCreationParametersRecord, AccountId32]>;
      ChannelDeleted: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64]>;
      ChannelDeletedByModerator: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, Bytes]>;
      ChannelFundsWithdrawn: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, u128, PalletContentChannelFundsDestination]>;
      ChannelNftLimitUpdated: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, PalletContentNftLimitPeriod, u64, u64]>;
      /**
       * Metaprotocols related event
       **/
      ChannelOwnerRemarked: AugmentedEvent<ApiType, [u64, Bytes]>;
      ChannelPausedFeaturesUpdatedByModerator: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsPausableChannelFeature>, Bytes]>;
      ChannelPayoutsUpdated: AugmentedEvent<ApiType, [PalletContentUpdateChannelPayoutsParametersRecord, Option<u64>]>;
      ChannelPrivilegeLevelUpdated: AugmentedEvent<ApiType, [u64, u8]>;
      ChannelRewardClaimedAndWithdrawn: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, u128, PalletContentChannelFundsDestination]>;
      ChannelRewardUpdated: AugmentedEvent<ApiType, [u128, u64]>;
      ChannelStateBloatBondValueUpdated: AugmentedEvent<ApiType, [u128]>;
      ChannelTransferAccepted: AugmentedEvent<ApiType, [u64, PalletContentTransferCommitmentParametersBTreeMap]>;
      ChannelUpdated: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, PalletContentChannelUpdateParametersRecord, BTreeSet<u64>]>;
      ChannelVisibilitySetByModerator: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, bool, Bytes]>;
      CouncilRewardClaimed: AugmentedEvent<ApiType, [u64, u128]>;
      CreatorTokenIssued: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, u64]>;
      CuratorAdded: AugmentedEvent<ApiType, [u64, u64, BTreeSet<PalletContentIterableEnumsChannelActionPermission>]>;
      CuratorGroupCreated: AugmentedEvent<ApiType, [u64]>;
      CuratorGroupPermissionsUpdated: AugmentedEvent<ApiType, [u64, BTreeMap<u8, BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsContentModerationAction>>]>;
      CuratorGroupStatusSet: AugmentedEvent<ApiType, [u64, bool]>;
      CuratorRemoved: AugmentedEvent<ApiType, [u64, u64]>;
      EnglishAuctionSettled: AugmentedEvent<ApiType, [u64, AccountId32, u64]>;
      EnglishAuctionStarted: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, PalletContentNftTypesEnglishAuctionParamsRecord]>;
      GlobalNftLimitUpdated: AugmentedEvent<ApiType, [PalletContentNftLimitPeriod, u64]>;
      InitializedChannelTransfer: AugmentedEvent<ApiType, [u64, PalletContentPermissionsContentActor, PalletContentPendingTransfer]>;
      NftBought: AugmentedEvent<ApiType, [u64, u64]>;
      NftDestroyed: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64]>;
      NftIssued: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, PalletContentNftTypesNftIssuanceParametersRecord]>;
      NftOwnerRemarked: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, Bytes]>;
      NftSellOrderMade: AugmentedEvent<ApiType, [u64, PalletContentPermissionsContentActor, u128]>;
      NftSlingedBackToTheOriginalArtist: AugmentedEvent<ApiType, [u64, PalletContentPermissionsContentActor]>;
      OfferAccepted: AugmentedEvent<ApiType, [u64]>;
      OfferCanceled: AugmentedEvent<ApiType, [u64, PalletContentPermissionsContentActor]>;
      OfferStarted: AugmentedEvent<ApiType, [u64, PalletContentPermissionsContentActor, u64, Option<u128>]>;
      OpenAuctionBidAccepted: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, u64, u128]>;
      OpenAuctionStarted: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, PalletContentNftTypesOpenAuctionParamsRecord, u64]>;
      ToggledNftLimits: AugmentedEvent<ApiType, [bool]>;
      VideoAssetsDeletedByModerator: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, BTreeSet<u64>, bool, Bytes]>;
      VideoCreated: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, u64, PalletContentVideoCreationParametersRecord, BTreeSet<u64>]>;
      VideoDeleted: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64]>;
      VideoDeletedByModerator: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, Bytes]>;
      VideoStateBloatBondValueUpdated: AugmentedEvent<ApiType, [u128]>;
      VideoUpdated: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, PalletContentVideoUpdateParametersRecord, BTreeSet<u64>]>;
      VideoVisibilitySetByModerator: AugmentedEvent<ApiType, [PalletContentPermissionsContentActor, u64, bool, Bytes]>;
    };
    contentWorkingGroup: {
      /**
       * Emits on withdrawing the application for the regular worker/lead opening.
       * Params:
       * - Job application id
       **/
      ApplicationWithdrawn: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on adding the application for the worker opening.
       * Params:
       * - Opening parameteres
       * - Application id
       **/
      AppliedOnOpening: AugmentedEvent<ApiType, [PalletWorkingGroupApplyOnOpeningParams, u64]>;
      /**
       * Emits on setting the budget for the working group.
       * Params:
       * - new budget
       **/
      BudgetSet: AugmentedEvent<ApiType, [u128]>;
      /**
       * Emits on budget from the working group being spent
       * Params:
       * - Receiver Account Id.
       * - Balance spent.
       * - Rationale.
       **/
      BudgetSpending: AugmentedEvent<ApiType, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Emits on setting the group leader.
       * Params:
       * - Group worker id.
       **/
      LeaderSet: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on un-setting the leader.
       **/
      LeaderUnset: AugmentedEvent<ApiType, []>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - message
       **/
      LeadRemarked: AugmentedEvent<ApiType, [Bytes]>;
      /**
       * Emits on reaching new missed reward.
       * Params:
       * - Worker ID.
       * - Missed reward (optional). None means 'no missed reward'.
       **/
      NewMissedRewardLevelReached: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on adding new job opening.
       * Params:
       * - Opening id
       * - Description
       * - Opening Type(Lead or Worker)
       * - Stake Policy for the opening
       * - Reward per block
       **/
      OpeningAdded: AugmentedEvent<ApiType, [u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Emits on canceling the job opening.
       * Params:
       * - Opening id
       **/
      OpeningCanceled: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on filling the job opening.
       * Params:
       * - Worker opening id
       * - Worker application id to the worker id dictionary
       * - Applicationd ids used to fill the opening
       **/
      OpeningFilled: AugmentedEvent<ApiType, [u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
      /**
       * Emits on paying the reward.
       * Params:
       * - Id of the worker.
       * - Receiver Account Id.
       * - Reward
       * - Payment type (missed reward or regular one)
       **/
      RewardPaid: AugmentedEvent<ApiType, [u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
      /**
       * Emits on decreasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeDecreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on increasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeIncreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on slashing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - actual slashed balance.
       * - Requested slashed balance.
       * - Rationale.
       **/
      StakeSlashed: AugmentedEvent<ApiType, [u64, u128, u128, Option<Bytes>]>;
      /**
       * Emits on updating the status text of the working group.
       * Params:
       * - status text hash
       * - status text
       **/
      StatusTextChanged: AugmentedEvent<ApiType, [H256, Option<Bytes>]>;
      /**
       * Emits on terminating the leader.
       * Params:
       * - leader worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedLeader: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on terminating the worker.
       * Params:
       * - worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedWorker: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on exiting the worker.
       * Params:
       * - worker id.
       * - Rationale.
       **/
      WorkerExited: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - worker
       * - message
       **/
      WorkerRemarked: AugmentedEvent<ApiType, [u64, Bytes]>;
      /**
       * Emits on updating the reward account of the worker.
       * Params:
       * - Id of the worker.
       * - Reward account id of the worker.
       **/
      WorkerRewardAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits on updating the reward amount of the worker.
       * Params:
       * - Id of the worker.
       * - Reward per block
       **/
      WorkerRewardAmountUpdated: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on updating the role account of the worker.
       * Params:
       * - Id of the worker.
       * - Role account id of the worker.
       **/
      WorkerRoleAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits when worker started leaving their role.
       * Params:
       * - Worker id.
       * - Rationale.
       **/
      WorkerStartedLeaving: AugmentedEvent<ApiType, [u64, Option<Bytes>]>;
      /**
       * Fund the working group budget.
       * Params:
       * - Member ID
       * - Amount of balance
       * - Rationale
       **/
      WorkingGroupBudgetFunded: AugmentedEvent<ApiType, [u64, u128, Bytes]>;
    };
    council: {
      /**
       * New council was elected
       **/
      AnnouncingPeriodStarted: AugmentedEvent<ApiType, [u32]>;
      /**
       * Budget balance was changed by the root.
       **/
      BudgetBalanceSet: AugmentedEvent<ApiType, [u128]>;
      /**
       * Budget increment has been updated.
       **/
      BudgetIncrementUpdated: AugmentedEvent<ApiType, [u128]>;
      /**
       * Budget balance was increased by automatic refill.
       **/
      BudgetRefill: AugmentedEvent<ApiType, [u128]>;
      /**
       * The next budget refill was planned.
       **/
      BudgetRefillPlanned: AugmentedEvent<ApiType, [u32]>;
      /**
       * The candidate has set a new note for their candidacy
       **/
      CandidacyNoteSet: AugmentedEvent<ApiType, [u64, Bytes]>;
      /**
       * Candidacy stake that was no longer needed was released
       **/
      CandidacyStakeRelease: AugmentedEvent<ApiType, [u64]>;
      /**
       * Candidate has withdrawn his candidacy
       **/
      CandidacyWithdraw: AugmentedEvent<ApiType, [u64]>;
      /**
       * Candidate remark message
       **/
      CandidateRemarked: AugmentedEvent<ApiType, [u64, Bytes]>;
      /**
       * Fund the council budget.
       * Params:
       * - Member ID
       * - Amount of balance
       * - Rationale
       **/
      CouncilBudgetFunded: AugmentedEvent<ApiType, [u64, u128, Bytes]>;
      /**
       * Councilor remark message
       **/
      CouncilorRemarked: AugmentedEvent<ApiType, [u64, Bytes]>;
      /**
       * Councilor reward has been updated.
       **/
      CouncilorRewardUpdated: AugmentedEvent<ApiType, [u128]>;
      /**
       * New candidate announced
       **/
      NewCandidate: AugmentedEvent<ApiType, [u64, AccountId32, AccountId32, u128]>;
      /**
       * New council was elected and appointed
       **/
      NewCouncilElected: AugmentedEvent<ApiType, [Vec<u64>, u32]>;
      /**
       * New council was not elected
       **/
      NewCouncilNotElected: AugmentedEvent<ApiType, [u32]>;
      /**
       * Announcing period can't finish because of insufficient candidtate count
       **/
      NotEnoughCandidates: AugmentedEvent<ApiType, [u32]>;
      /**
       * Request has been funded
       **/
      RequestFunded: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * The whole reward was paid to the council member.
       **/
      RewardPayment: AugmentedEvent<ApiType, [u64, AccountId32, u128, u128]>;
      /**
       * Candidates are announced and voting starts
       **/
      VotingPeriodStarted: AugmentedEvent<ApiType, [u32]>;
    };
    distributionWorkingGroup: {
      /**
       * Emits on withdrawing the application for the regular worker/lead opening.
       * Params:
       * - Job application id
       **/
      ApplicationWithdrawn: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on adding the application for the worker opening.
       * Params:
       * - Opening parameteres
       * - Application id
       **/
      AppliedOnOpening: AugmentedEvent<ApiType, [PalletWorkingGroupApplyOnOpeningParams, u64]>;
      /**
       * Emits on setting the budget for the working group.
       * Params:
       * - new budget
       **/
      BudgetSet: AugmentedEvent<ApiType, [u128]>;
      /**
       * Emits on budget from the working group being spent
       * Params:
       * - Receiver Account Id.
       * - Balance spent.
       * - Rationale.
       **/
      BudgetSpending: AugmentedEvent<ApiType, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Emits on setting the group leader.
       * Params:
       * - Group worker id.
       **/
      LeaderSet: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on un-setting the leader.
       **/
      LeaderUnset: AugmentedEvent<ApiType, []>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - message
       **/
      LeadRemarked: AugmentedEvent<ApiType, [Bytes]>;
      /**
       * Emits on reaching new missed reward.
       * Params:
       * - Worker ID.
       * - Missed reward (optional). None means 'no missed reward'.
       **/
      NewMissedRewardLevelReached: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on adding new job opening.
       * Params:
       * - Opening id
       * - Description
       * - Opening Type(Lead or Worker)
       * - Stake Policy for the opening
       * - Reward per block
       **/
      OpeningAdded: AugmentedEvent<ApiType, [u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Emits on canceling the job opening.
       * Params:
       * - Opening id
       **/
      OpeningCanceled: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on filling the job opening.
       * Params:
       * - Worker opening id
       * - Worker application id to the worker id dictionary
       * - Applicationd ids used to fill the opening
       **/
      OpeningFilled: AugmentedEvent<ApiType, [u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
      /**
       * Emits on paying the reward.
       * Params:
       * - Id of the worker.
       * - Receiver Account Id.
       * - Reward
       * - Payment type (missed reward or regular one)
       **/
      RewardPaid: AugmentedEvent<ApiType, [u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
      /**
       * Emits on decreasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeDecreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on increasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeIncreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on slashing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - actual slashed balance.
       * - Requested slashed balance.
       * - Rationale.
       **/
      StakeSlashed: AugmentedEvent<ApiType, [u64, u128, u128, Option<Bytes>]>;
      /**
       * Emits on updating the status text of the working group.
       * Params:
       * - status text hash
       * - status text
       **/
      StatusTextChanged: AugmentedEvent<ApiType, [H256, Option<Bytes>]>;
      /**
       * Emits on terminating the leader.
       * Params:
       * - leader worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedLeader: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on terminating the worker.
       * Params:
       * - worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedWorker: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on exiting the worker.
       * Params:
       * - worker id.
       * - Rationale.
       **/
      WorkerExited: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - worker
       * - message
       **/
      WorkerRemarked: AugmentedEvent<ApiType, [u64, Bytes]>;
      /**
       * Emits on updating the reward account of the worker.
       * Params:
       * - Id of the worker.
       * - Reward account id of the worker.
       **/
      WorkerRewardAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits on updating the reward amount of the worker.
       * Params:
       * - Id of the worker.
       * - Reward per block
       **/
      WorkerRewardAmountUpdated: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on updating the role account of the worker.
       * Params:
       * - Id of the worker.
       * - Role account id of the worker.
       **/
      WorkerRoleAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits when worker started leaving their role.
       * Params:
       * - Worker id.
       * - Rationale.
       **/
      WorkerStartedLeaving: AugmentedEvent<ApiType, [u64, Option<Bytes>]>;
      /**
       * Fund the working group budget.
       * Params:
       * - Member ID
       * - Amount of balance
       * - Rationale
       **/
      WorkingGroupBudgetFunded: AugmentedEvent<ApiType, [u64, u128, Bytes]>;
    };
    electionProviderMultiPhase: {
      /**
       * The election has been finalized, with `Some` of the given computation, or else if the
       * election failed, `None`.
       **/
      ElectionFinalized: AugmentedEvent<ApiType, [electionCompute: Option<PalletElectionProviderMultiPhaseElectionCompute>], { electionCompute: Option<PalletElectionProviderMultiPhaseElectionCompute> }>;
      /**
       * An account has been rewarded for their signed submission being finalized.
       **/
      Rewarded: AugmentedEvent<ApiType, [account: AccountId32, value: u128], { account: AccountId32, value: u128 }>;
      /**
       * The signed phase of the given round has started.
       **/
      SignedPhaseStarted: AugmentedEvent<ApiType, [round: u32], { round: u32 }>;
      /**
       * An account has been slashed for submitting an invalid signed submission.
       **/
      Slashed: AugmentedEvent<ApiType, [account: AccountId32, value: u128], { account: AccountId32, value: u128 }>;
      /**
       * A solution was stored with the given compute.
       * 
       * If the solution is signed, this means that it hasn't yet been processed. If the
       * solution is unsigned, this means that it has also been processed.
       * 
       * The `bool` is `true` when a previous solution was ejected to make room for this one.
       **/
      SolutionStored: AugmentedEvent<ApiType, [electionCompute: PalletElectionProviderMultiPhaseElectionCompute, prevEjected: bool], { electionCompute: PalletElectionProviderMultiPhaseElectionCompute, prevEjected: bool }>;
      /**
       * The unsigned phase of the given round has started.
       **/
      UnsignedPhaseStarted: AugmentedEvent<ApiType, [round: u32], { round: u32 }>;
    };
    forum: {
      /**
       * An arhical status of category with given id was updated.
       * The second argument reflects the new archival status of the category.
       **/
      CategoryArchivalStatusUpdated: AugmentedEvent<ApiType, [u64, bool, PalletForumPrivilegedActor]>;
      /**
       * A category was introduced
       **/
      CategoryCreated: AugmentedEvent<ApiType, [u64, Option<u64>, Bytes, Bytes]>;
      /**
       * A category was deleted
       **/
      CategoryDeleted: AugmentedEvent<ApiType, [u64, PalletForumPrivilegedActor]>;
      /**
       * A discription of category with given id was updated.
       * The second argument reflects the new description hash of the category.
       **/
      CategoryDescriptionUpdated: AugmentedEvent<ApiType, [u64, H256, PalletForumPrivilegedActor]>;
      /**
       * An moderator ability to moderate a category and its subcategories updated
       **/
      CategoryMembershipOfModeratorUpdated: AugmentedEvent<ApiType, [u64, u64, bool]>;
      /**
       * Sticky thread updated for category
       **/
      CategoryStickyThreadUpdate: AugmentedEvent<ApiType, [u64, BTreeSet<u64>, PalletForumPrivilegedActor]>;
      /**
       * A title of category with given id was updated.
       * The second argument reflects the new title hash of the category.
       **/
      CategoryTitleUpdated: AugmentedEvent<ApiType, [u64, H256, PalletForumPrivilegedActor]>;
      /**
       * Post with given id was created.
       **/
      PostAdded: AugmentedEvent<ApiType, [u64, u64, u64, u64, Bytes, bool]>;
      /**
       * Post with givne id was deleted.
       **/
      PostDeleted: AugmentedEvent<ApiType, [Bytes, u64, BTreeMap<PalletForumExtendedPostIdObject, bool>]>;
      /**
       * Post with givne id was moderated.
       **/
      PostModerated: AugmentedEvent<ApiType, [u64, Bytes, PalletForumPrivilegedActor, u64, u64]>;
      /**
       * Post with given id had its text updated.
       * The second argument reflects the number of total edits when the text update occurs.
       **/
      PostTextUpdated: AugmentedEvent<ApiType, [u64, u64, u64, u64, Bytes]>;
      /**
       * A thread with given id was created.
       * A third argument reflects the initial post id of the thread.
       **/
      ThreadCreated: AugmentedEvent<ApiType, [u64, u64, u64, u64, Bytes, Bytes]>;
      /**
       * A thread was deleted.
       **/
      ThreadDeleted: AugmentedEvent<ApiType, [u64, u64, u64, bool]>;
      /**
       * A thread metadata given id was updated.
       **/
      ThreadMetadataUpdated: AugmentedEvent<ApiType, [u64, u64, u64, Bytes]>;
      /**
       * A thread with given id was moderated.
       **/
      ThreadModerated: AugmentedEvent<ApiType, [u64, Bytes, PalletForumPrivilegedActor, u64]>;
      /**
       * A thread was moved to new category
       **/
      ThreadMoved: AugmentedEvent<ApiType, [u64, u64, PalletForumPrivilegedActor, u64]>;
      /**
       * A thread with given id was updated.
       * The second argument reflects the new archival status of the thread.
       **/
      ThreadUpdated: AugmentedEvent<ApiType, [u64, bool, PalletForumPrivilegedActor, u64]>;
    };
    forumWorkingGroup: {
      /**
       * Emits on withdrawing the application for the regular worker/lead opening.
       * Params:
       * - Job application id
       **/
      ApplicationWithdrawn: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on adding the application for the worker opening.
       * Params:
       * - Opening parameteres
       * - Application id
       **/
      AppliedOnOpening: AugmentedEvent<ApiType, [PalletWorkingGroupApplyOnOpeningParams, u64]>;
      /**
       * Emits on setting the budget for the working group.
       * Params:
       * - new budget
       **/
      BudgetSet: AugmentedEvent<ApiType, [u128]>;
      /**
       * Emits on budget from the working group being spent
       * Params:
       * - Receiver Account Id.
       * - Balance spent.
       * - Rationale.
       **/
      BudgetSpending: AugmentedEvent<ApiType, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Emits on setting the group leader.
       * Params:
       * - Group worker id.
       **/
      LeaderSet: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on un-setting the leader.
       **/
      LeaderUnset: AugmentedEvent<ApiType, []>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - message
       **/
      LeadRemarked: AugmentedEvent<ApiType, [Bytes]>;
      /**
       * Emits on reaching new missed reward.
       * Params:
       * - Worker ID.
       * - Missed reward (optional). None means 'no missed reward'.
       **/
      NewMissedRewardLevelReached: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on adding new job opening.
       * Params:
       * - Opening id
       * - Description
       * - Opening Type(Lead or Worker)
       * - Stake Policy for the opening
       * - Reward per block
       **/
      OpeningAdded: AugmentedEvent<ApiType, [u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Emits on canceling the job opening.
       * Params:
       * - Opening id
       **/
      OpeningCanceled: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on filling the job opening.
       * Params:
       * - Worker opening id
       * - Worker application id to the worker id dictionary
       * - Applicationd ids used to fill the opening
       **/
      OpeningFilled: AugmentedEvent<ApiType, [u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
      /**
       * Emits on paying the reward.
       * Params:
       * - Id of the worker.
       * - Receiver Account Id.
       * - Reward
       * - Payment type (missed reward or regular one)
       **/
      RewardPaid: AugmentedEvent<ApiType, [u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
      /**
       * Emits on decreasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeDecreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on increasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeIncreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on slashing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - actual slashed balance.
       * - Requested slashed balance.
       * - Rationale.
       **/
      StakeSlashed: AugmentedEvent<ApiType, [u64, u128, u128, Option<Bytes>]>;
      /**
       * Emits on updating the status text of the working group.
       * Params:
       * - status text hash
       * - status text
       **/
      StatusTextChanged: AugmentedEvent<ApiType, [H256, Option<Bytes>]>;
      /**
       * Emits on terminating the leader.
       * Params:
       * - leader worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedLeader: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on terminating the worker.
       * Params:
       * - worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedWorker: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on exiting the worker.
       * Params:
       * - worker id.
       * - Rationale.
       **/
      WorkerExited: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - worker
       * - message
       **/
      WorkerRemarked: AugmentedEvent<ApiType, [u64, Bytes]>;
      /**
       * Emits on updating the reward account of the worker.
       * Params:
       * - Id of the worker.
       * - Reward account id of the worker.
       **/
      WorkerRewardAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits on updating the reward amount of the worker.
       * Params:
       * - Id of the worker.
       * - Reward per block
       **/
      WorkerRewardAmountUpdated: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on updating the role account of the worker.
       * Params:
       * - Id of the worker.
       * - Role account id of the worker.
       **/
      WorkerRoleAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits when worker started leaving their role.
       * Params:
       * - Worker id.
       * - Rationale.
       **/
      WorkerStartedLeaving: AugmentedEvent<ApiType, [u64, Option<Bytes>]>;
      /**
       * Fund the working group budget.
       * Params:
       * - Member ID
       * - Amount of balance
       * - Rationale
       **/
      WorkingGroupBudgetFunded: AugmentedEvent<ApiType, [u64, u128, Bytes]>;
    };
    gatewayWorkingGroup: {
      /**
       * Emits on withdrawing the application for the regular worker/lead opening.
       * Params:
       * - Job application id
       **/
      ApplicationWithdrawn: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on adding the application for the worker opening.
       * Params:
       * - Opening parameteres
       * - Application id
       **/
      AppliedOnOpening: AugmentedEvent<ApiType, [PalletWorkingGroupApplyOnOpeningParams, u64]>;
      /**
       * Emits on setting the budget for the working group.
       * Params:
       * - new budget
       **/
      BudgetSet: AugmentedEvent<ApiType, [u128]>;
      /**
       * Emits on budget from the working group being spent
       * Params:
       * - Receiver Account Id.
       * - Balance spent.
       * - Rationale.
       **/
      BudgetSpending: AugmentedEvent<ApiType, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Emits on setting the group leader.
       * Params:
       * - Group worker id.
       **/
      LeaderSet: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on un-setting the leader.
       **/
      LeaderUnset: AugmentedEvent<ApiType, []>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - message
       **/
      LeadRemarked: AugmentedEvent<ApiType, [Bytes]>;
      /**
       * Emits on reaching new missed reward.
       * Params:
       * - Worker ID.
       * - Missed reward (optional). None means 'no missed reward'.
       **/
      NewMissedRewardLevelReached: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on adding new job opening.
       * Params:
       * - Opening id
       * - Description
       * - Opening Type(Lead or Worker)
       * - Stake Policy for the opening
       * - Reward per block
       **/
      OpeningAdded: AugmentedEvent<ApiType, [u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Emits on canceling the job opening.
       * Params:
       * - Opening id
       **/
      OpeningCanceled: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on filling the job opening.
       * Params:
       * - Worker opening id
       * - Worker application id to the worker id dictionary
       * - Applicationd ids used to fill the opening
       **/
      OpeningFilled: AugmentedEvent<ApiType, [u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
      /**
       * Emits on paying the reward.
       * Params:
       * - Id of the worker.
       * - Receiver Account Id.
       * - Reward
       * - Payment type (missed reward or regular one)
       **/
      RewardPaid: AugmentedEvent<ApiType, [u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
      /**
       * Emits on decreasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeDecreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on increasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeIncreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on slashing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - actual slashed balance.
       * - Requested slashed balance.
       * - Rationale.
       **/
      StakeSlashed: AugmentedEvent<ApiType, [u64, u128, u128, Option<Bytes>]>;
      /**
       * Emits on updating the status text of the working group.
       * Params:
       * - status text hash
       * - status text
       **/
      StatusTextChanged: AugmentedEvent<ApiType, [H256, Option<Bytes>]>;
      /**
       * Emits on terminating the leader.
       * Params:
       * - leader worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedLeader: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on terminating the worker.
       * Params:
       * - worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedWorker: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on exiting the worker.
       * Params:
       * - worker id.
       * - Rationale.
       **/
      WorkerExited: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - worker
       * - message
       **/
      WorkerRemarked: AugmentedEvent<ApiType, [u64, Bytes]>;
      /**
       * Emits on updating the reward account of the worker.
       * Params:
       * - Id of the worker.
       * - Reward account id of the worker.
       **/
      WorkerRewardAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits on updating the reward amount of the worker.
       * Params:
       * - Id of the worker.
       * - Reward per block
       **/
      WorkerRewardAmountUpdated: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on updating the role account of the worker.
       * Params:
       * - Id of the worker.
       * - Role account id of the worker.
       **/
      WorkerRoleAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits when worker started leaving their role.
       * Params:
       * - Worker id.
       * - Rationale.
       **/
      WorkerStartedLeaving: AugmentedEvent<ApiType, [u64, Option<Bytes>]>;
      /**
       * Fund the working group budget.
       * Params:
       * - Member ID
       * - Amount of balance
       * - Rationale
       **/
      WorkingGroupBudgetFunded: AugmentedEvent<ApiType, [u64, u128, Bytes]>;
    };
    grandpa: {
      /**
       * New authority set has been applied.
       **/
      NewAuthorities: AugmentedEvent<ApiType, [authoritySet: Vec<ITuple<[SpFinalityGrandpaAppPublic, u64]>>], { authoritySet: Vec<ITuple<[SpFinalityGrandpaAppPublic, u64]>> }>;
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
       * A new heartbeat was received from `AuthorityId`.
       **/
      HeartbeatReceived: AugmentedEvent<ApiType, [authorityId: PalletImOnlineSr25519AppSr25519Public], { authorityId: PalletImOnlineSr25519AppSr25519Public }>;
      /**
       * At the end of the session, at least one validator was found to be offline.
       **/
      SomeOffline: AugmentedEvent<ApiType, [offline: Vec<ITuple<[AccountId32, PalletStakingExposure]>>], { offline: Vec<ITuple<[AccountId32, PalletStakingExposure]>> }>;
    };
    joystreamUtility: {
      /**
       * A runtime upgrade was executed
       * Params:
       * - New code encoded in bytes
       **/
      RuntimeUpgraded: AugmentedEvent<ApiType, [Bytes]>;
      /**
       * A signal proposal was executed
       * Params:
       * - Signal given when creating the corresponding proposal
       **/
      Signaled: AugmentedEvent<ApiType, [Bytes]>;
      /**
       * An account burned tokens
       * Params:
       * - Account Id of the burning tokens
       * - Balance burned from that account
       **/
      TokensBurned: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * An `Update Working Group Budget` proposal was executed
       * Params:
       * - Working group which budget is being updated
       * - Amount of balance being moved
       * - Enum variant with positive indicating funds moved torwards working group and negative
       * and negative funds moving from the working group
       **/
      UpdatedWorkingGroupBudget: AugmentedEvent<ApiType, [PalletCommonWorkingGroupIterableEnumsWorkingGroup, u128, PalletCommonBalanceKind]>;
    };
    members: {
      InitialInvitationBalanceUpdated: AugmentedEvent<ApiType, [u128]>;
      InitialInvitationCountUpdated: AugmentedEvent<ApiType, [u32]>;
      InvitesTransferred: AugmentedEvent<ApiType, [u64, u64, u32]>;
      LeaderInvitationQuotaUpdated: AugmentedEvent<ApiType, [u32]>;
      MemberAccountsUpdated: AugmentedEvent<ApiType, [u64, Option<AccountId32>, Option<AccountId32>]>;
      MemberCreated: AugmentedEvent<ApiType, [u64, PalletMembershipCreateMemberParameters, u32]>;
      MemberInvited: AugmentedEvent<ApiType, [u64, PalletMembershipInviteMembershipParameters]>;
      MemberProfileUpdated: AugmentedEvent<ApiType, [u64, Option<Bytes>, Option<Bytes>]>;
      MemberRemarked: AugmentedEvent<ApiType, [u64, Bytes]>;
      MembershipBought: AugmentedEvent<ApiType, [u64, PalletMembershipBuyMembershipParameters, u32]>;
      MembershipGifted: AugmentedEvent<ApiType, [u64, PalletMembershipGiftMembershipParameters]>;
      MembershipPriceUpdated: AugmentedEvent<ApiType, [u128]>;
      MemberVerificationStatusUpdated: AugmentedEvent<ApiType, [u64, bool, u64]>;
      ReferralCutUpdated: AugmentedEvent<ApiType, [u8]>;
      StakingAccountAdded: AugmentedEvent<ApiType, [AccountId32, u64]>;
      StakingAccountConfirmed: AugmentedEvent<ApiType, [AccountId32, u64]>;
      StakingAccountRemoved: AugmentedEvent<ApiType, [AccountId32, u64]>;
    };
    membershipWorkingGroup: {
      /**
       * Emits on withdrawing the application for the regular worker/lead opening.
       * Params:
       * - Job application id
       **/
      ApplicationWithdrawn: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on adding the application for the worker opening.
       * Params:
       * - Opening parameteres
       * - Application id
       **/
      AppliedOnOpening: AugmentedEvent<ApiType, [PalletWorkingGroupApplyOnOpeningParams, u64]>;
      /**
       * Emits on setting the budget for the working group.
       * Params:
       * - new budget
       **/
      BudgetSet: AugmentedEvent<ApiType, [u128]>;
      /**
       * Emits on budget from the working group being spent
       * Params:
       * - Receiver Account Id.
       * - Balance spent.
       * - Rationale.
       **/
      BudgetSpending: AugmentedEvent<ApiType, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Emits on setting the group leader.
       * Params:
       * - Group worker id.
       **/
      LeaderSet: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on un-setting the leader.
       **/
      LeaderUnset: AugmentedEvent<ApiType, []>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - message
       **/
      LeadRemarked: AugmentedEvent<ApiType, [Bytes]>;
      /**
       * Emits on reaching new missed reward.
       * Params:
       * - Worker ID.
       * - Missed reward (optional). None means 'no missed reward'.
       **/
      NewMissedRewardLevelReached: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on adding new job opening.
       * Params:
       * - Opening id
       * - Description
       * - Opening Type(Lead or Worker)
       * - Stake Policy for the opening
       * - Reward per block
       **/
      OpeningAdded: AugmentedEvent<ApiType, [u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Emits on canceling the job opening.
       * Params:
       * - Opening id
       **/
      OpeningCanceled: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on filling the job opening.
       * Params:
       * - Worker opening id
       * - Worker application id to the worker id dictionary
       * - Applicationd ids used to fill the opening
       **/
      OpeningFilled: AugmentedEvent<ApiType, [u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
      /**
       * Emits on paying the reward.
       * Params:
       * - Id of the worker.
       * - Receiver Account Id.
       * - Reward
       * - Payment type (missed reward or regular one)
       **/
      RewardPaid: AugmentedEvent<ApiType, [u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
      /**
       * Emits on decreasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeDecreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on increasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeIncreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on slashing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - actual slashed balance.
       * - Requested slashed balance.
       * - Rationale.
       **/
      StakeSlashed: AugmentedEvent<ApiType, [u64, u128, u128, Option<Bytes>]>;
      /**
       * Emits on updating the status text of the working group.
       * Params:
       * - status text hash
       * - status text
       **/
      StatusTextChanged: AugmentedEvent<ApiType, [H256, Option<Bytes>]>;
      /**
       * Emits on terminating the leader.
       * Params:
       * - leader worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedLeader: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on terminating the worker.
       * Params:
       * - worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedWorker: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on exiting the worker.
       * Params:
       * - worker id.
       * - Rationale.
       **/
      WorkerExited: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - worker
       * - message
       **/
      WorkerRemarked: AugmentedEvent<ApiType, [u64, Bytes]>;
      /**
       * Emits on updating the reward account of the worker.
       * Params:
       * - Id of the worker.
       * - Reward account id of the worker.
       **/
      WorkerRewardAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits on updating the reward amount of the worker.
       * Params:
       * - Id of the worker.
       * - Reward per block
       **/
      WorkerRewardAmountUpdated: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on updating the role account of the worker.
       * Params:
       * - Id of the worker.
       * - Role account id of the worker.
       **/
      WorkerRoleAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits when worker started leaving their role.
       * Params:
       * - Worker id.
       * - Rationale.
       **/
      WorkerStartedLeaving: AugmentedEvent<ApiType, [u64, Option<Bytes>]>;
      /**
       * Fund the working group budget.
       * Params:
       * - Member ID
       * - Amount of balance
       * - Rationale
       **/
      WorkingGroupBudgetFunded: AugmentedEvent<ApiType, [u64, u128, Bytes]>;
    };
    multisig: {
      /**
       * A multisig operation has been approved by someone.
       **/
      MultisigApproval: AugmentedEvent<ApiType, [approving: AccountId32, timepoint: PalletMultisigTimepoint, multisig: AccountId32, callHash: U8aFixed], { approving: AccountId32, timepoint: PalletMultisigTimepoint, multisig: AccountId32, callHash: U8aFixed }>;
      /**
       * A multisig operation has been cancelled.
       **/
      MultisigCancelled: AugmentedEvent<ApiType, [cancelling: AccountId32, timepoint: PalletMultisigTimepoint, multisig: AccountId32, callHash: U8aFixed], { cancelling: AccountId32, timepoint: PalletMultisigTimepoint, multisig: AccountId32, callHash: U8aFixed }>;
      /**
       * A multisig operation has been executed.
       **/
      MultisigExecuted: AugmentedEvent<ApiType, [approving: AccountId32, timepoint: PalletMultisigTimepoint, multisig: AccountId32, callHash: U8aFixed, result: Result<Null, SpRuntimeDispatchError>], { approving: AccountId32, timepoint: PalletMultisigTimepoint, multisig: AccountId32, callHash: U8aFixed, result: Result<Null, SpRuntimeDispatchError> }>;
      /**
       * A new multisig operation has begun.
       **/
      NewMultisig: AugmentedEvent<ApiType, [approving: AccountId32, multisig: AccountId32, callHash: U8aFixed], { approving: AccountId32, multisig: AccountId32, callHash: U8aFixed }>;
    };
    offences: {
      /**
       * There is an offence reported of the given `kind` happened at the `session_index` and
       * (kind-specific) time slot. This event is not deposited for duplicate slashes.
       * \[kind, timeslot\].
       **/
      Offence: AugmentedEvent<ApiType, [kind: U8aFixed, timeslot: Bytes], { kind: U8aFixed, timeslot: Bytes }>;
    };
    operationsWorkingGroupAlpha: {
      /**
       * Emits on withdrawing the application for the regular worker/lead opening.
       * Params:
       * - Job application id
       **/
      ApplicationWithdrawn: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on adding the application for the worker opening.
       * Params:
       * - Opening parameteres
       * - Application id
       **/
      AppliedOnOpening: AugmentedEvent<ApiType, [PalletWorkingGroupApplyOnOpeningParams, u64]>;
      /**
       * Emits on setting the budget for the working group.
       * Params:
       * - new budget
       **/
      BudgetSet: AugmentedEvent<ApiType, [u128]>;
      /**
       * Emits on budget from the working group being spent
       * Params:
       * - Receiver Account Id.
       * - Balance spent.
       * - Rationale.
       **/
      BudgetSpending: AugmentedEvent<ApiType, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Emits on setting the group leader.
       * Params:
       * - Group worker id.
       **/
      LeaderSet: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on un-setting the leader.
       **/
      LeaderUnset: AugmentedEvent<ApiType, []>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - message
       **/
      LeadRemarked: AugmentedEvent<ApiType, [Bytes]>;
      /**
       * Emits on reaching new missed reward.
       * Params:
       * - Worker ID.
       * - Missed reward (optional). None means 'no missed reward'.
       **/
      NewMissedRewardLevelReached: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on adding new job opening.
       * Params:
       * - Opening id
       * - Description
       * - Opening Type(Lead or Worker)
       * - Stake Policy for the opening
       * - Reward per block
       **/
      OpeningAdded: AugmentedEvent<ApiType, [u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Emits on canceling the job opening.
       * Params:
       * - Opening id
       **/
      OpeningCanceled: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on filling the job opening.
       * Params:
       * - Worker opening id
       * - Worker application id to the worker id dictionary
       * - Applicationd ids used to fill the opening
       **/
      OpeningFilled: AugmentedEvent<ApiType, [u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
      /**
       * Emits on paying the reward.
       * Params:
       * - Id of the worker.
       * - Receiver Account Id.
       * - Reward
       * - Payment type (missed reward or regular one)
       **/
      RewardPaid: AugmentedEvent<ApiType, [u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
      /**
       * Emits on decreasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeDecreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on increasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeIncreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on slashing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - actual slashed balance.
       * - Requested slashed balance.
       * - Rationale.
       **/
      StakeSlashed: AugmentedEvent<ApiType, [u64, u128, u128, Option<Bytes>]>;
      /**
       * Emits on updating the status text of the working group.
       * Params:
       * - status text hash
       * - status text
       **/
      StatusTextChanged: AugmentedEvent<ApiType, [H256, Option<Bytes>]>;
      /**
       * Emits on terminating the leader.
       * Params:
       * - leader worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedLeader: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on terminating the worker.
       * Params:
       * - worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedWorker: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on exiting the worker.
       * Params:
       * - worker id.
       * - Rationale.
       **/
      WorkerExited: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - worker
       * - message
       **/
      WorkerRemarked: AugmentedEvent<ApiType, [u64, Bytes]>;
      /**
       * Emits on updating the reward account of the worker.
       * Params:
       * - Id of the worker.
       * - Reward account id of the worker.
       **/
      WorkerRewardAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits on updating the reward amount of the worker.
       * Params:
       * - Id of the worker.
       * - Reward per block
       **/
      WorkerRewardAmountUpdated: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on updating the role account of the worker.
       * Params:
       * - Id of the worker.
       * - Role account id of the worker.
       **/
      WorkerRoleAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits when worker started leaving their role.
       * Params:
       * - Worker id.
       * - Rationale.
       **/
      WorkerStartedLeaving: AugmentedEvent<ApiType, [u64, Option<Bytes>]>;
      /**
       * Fund the working group budget.
       * Params:
       * - Member ID
       * - Amount of balance
       * - Rationale
       **/
      WorkingGroupBudgetFunded: AugmentedEvent<ApiType, [u64, u128, Bytes]>;
    };
    operationsWorkingGroupBeta: {
      /**
       * Emits on withdrawing the application for the regular worker/lead opening.
       * Params:
       * - Job application id
       **/
      ApplicationWithdrawn: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on adding the application for the worker opening.
       * Params:
       * - Opening parameteres
       * - Application id
       **/
      AppliedOnOpening: AugmentedEvent<ApiType, [PalletWorkingGroupApplyOnOpeningParams, u64]>;
      /**
       * Emits on setting the budget for the working group.
       * Params:
       * - new budget
       **/
      BudgetSet: AugmentedEvent<ApiType, [u128]>;
      /**
       * Emits on budget from the working group being spent
       * Params:
       * - Receiver Account Id.
       * - Balance spent.
       * - Rationale.
       **/
      BudgetSpending: AugmentedEvent<ApiType, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Emits on setting the group leader.
       * Params:
       * - Group worker id.
       **/
      LeaderSet: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on un-setting the leader.
       **/
      LeaderUnset: AugmentedEvent<ApiType, []>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - message
       **/
      LeadRemarked: AugmentedEvent<ApiType, [Bytes]>;
      /**
       * Emits on reaching new missed reward.
       * Params:
       * - Worker ID.
       * - Missed reward (optional). None means 'no missed reward'.
       **/
      NewMissedRewardLevelReached: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on adding new job opening.
       * Params:
       * - Opening id
       * - Description
       * - Opening Type(Lead or Worker)
       * - Stake Policy for the opening
       * - Reward per block
       **/
      OpeningAdded: AugmentedEvent<ApiType, [u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Emits on canceling the job opening.
       * Params:
       * - Opening id
       **/
      OpeningCanceled: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on filling the job opening.
       * Params:
       * - Worker opening id
       * - Worker application id to the worker id dictionary
       * - Applicationd ids used to fill the opening
       **/
      OpeningFilled: AugmentedEvent<ApiType, [u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
      /**
       * Emits on paying the reward.
       * Params:
       * - Id of the worker.
       * - Receiver Account Id.
       * - Reward
       * - Payment type (missed reward or regular one)
       **/
      RewardPaid: AugmentedEvent<ApiType, [u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
      /**
       * Emits on decreasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeDecreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on increasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeIncreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on slashing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - actual slashed balance.
       * - Requested slashed balance.
       * - Rationale.
       **/
      StakeSlashed: AugmentedEvent<ApiType, [u64, u128, u128, Option<Bytes>]>;
      /**
       * Emits on updating the status text of the working group.
       * Params:
       * - status text hash
       * - status text
       **/
      StatusTextChanged: AugmentedEvent<ApiType, [H256, Option<Bytes>]>;
      /**
       * Emits on terminating the leader.
       * Params:
       * - leader worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedLeader: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on terminating the worker.
       * Params:
       * - worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedWorker: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on exiting the worker.
       * Params:
       * - worker id.
       * - Rationale.
       **/
      WorkerExited: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - worker
       * - message
       **/
      WorkerRemarked: AugmentedEvent<ApiType, [u64, Bytes]>;
      /**
       * Emits on updating the reward account of the worker.
       * Params:
       * - Id of the worker.
       * - Reward account id of the worker.
       **/
      WorkerRewardAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits on updating the reward amount of the worker.
       * Params:
       * - Id of the worker.
       * - Reward per block
       **/
      WorkerRewardAmountUpdated: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on updating the role account of the worker.
       * Params:
       * - Id of the worker.
       * - Role account id of the worker.
       **/
      WorkerRoleAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits when worker started leaving their role.
       * Params:
       * - Worker id.
       * - Rationale.
       **/
      WorkerStartedLeaving: AugmentedEvent<ApiType, [u64, Option<Bytes>]>;
      /**
       * Fund the working group budget.
       * Params:
       * - Member ID
       * - Amount of balance
       * - Rationale
       **/
      WorkingGroupBudgetFunded: AugmentedEvent<ApiType, [u64, u128, Bytes]>;
    };
    operationsWorkingGroupGamma: {
      /**
       * Emits on withdrawing the application for the regular worker/lead opening.
       * Params:
       * - Job application id
       **/
      ApplicationWithdrawn: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on adding the application for the worker opening.
       * Params:
       * - Opening parameteres
       * - Application id
       **/
      AppliedOnOpening: AugmentedEvent<ApiType, [PalletWorkingGroupApplyOnOpeningParams, u64]>;
      /**
       * Emits on setting the budget for the working group.
       * Params:
       * - new budget
       **/
      BudgetSet: AugmentedEvent<ApiType, [u128]>;
      /**
       * Emits on budget from the working group being spent
       * Params:
       * - Receiver Account Id.
       * - Balance spent.
       * - Rationale.
       **/
      BudgetSpending: AugmentedEvent<ApiType, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Emits on setting the group leader.
       * Params:
       * - Group worker id.
       **/
      LeaderSet: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on un-setting the leader.
       **/
      LeaderUnset: AugmentedEvent<ApiType, []>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - message
       **/
      LeadRemarked: AugmentedEvent<ApiType, [Bytes]>;
      /**
       * Emits on reaching new missed reward.
       * Params:
       * - Worker ID.
       * - Missed reward (optional). None means 'no missed reward'.
       **/
      NewMissedRewardLevelReached: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on adding new job opening.
       * Params:
       * - Opening id
       * - Description
       * - Opening Type(Lead or Worker)
       * - Stake Policy for the opening
       * - Reward per block
       **/
      OpeningAdded: AugmentedEvent<ApiType, [u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Emits on canceling the job opening.
       * Params:
       * - Opening id
       **/
      OpeningCanceled: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on filling the job opening.
       * Params:
       * - Worker opening id
       * - Worker application id to the worker id dictionary
       * - Applicationd ids used to fill the opening
       **/
      OpeningFilled: AugmentedEvent<ApiType, [u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
      /**
       * Emits on paying the reward.
       * Params:
       * - Id of the worker.
       * - Receiver Account Id.
       * - Reward
       * - Payment type (missed reward or regular one)
       **/
      RewardPaid: AugmentedEvent<ApiType, [u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
      /**
       * Emits on decreasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeDecreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on increasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeIncreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on slashing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - actual slashed balance.
       * - Requested slashed balance.
       * - Rationale.
       **/
      StakeSlashed: AugmentedEvent<ApiType, [u64, u128, u128, Option<Bytes>]>;
      /**
       * Emits on updating the status text of the working group.
       * Params:
       * - status text hash
       * - status text
       **/
      StatusTextChanged: AugmentedEvent<ApiType, [H256, Option<Bytes>]>;
      /**
       * Emits on terminating the leader.
       * Params:
       * - leader worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedLeader: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on terminating the worker.
       * Params:
       * - worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedWorker: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on exiting the worker.
       * Params:
       * - worker id.
       * - Rationale.
       **/
      WorkerExited: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - worker
       * - message
       **/
      WorkerRemarked: AugmentedEvent<ApiType, [u64, Bytes]>;
      /**
       * Emits on updating the reward account of the worker.
       * Params:
       * - Id of the worker.
       * - Reward account id of the worker.
       **/
      WorkerRewardAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits on updating the reward amount of the worker.
       * Params:
       * - Id of the worker.
       * - Reward per block
       **/
      WorkerRewardAmountUpdated: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on updating the role account of the worker.
       * Params:
       * - Id of the worker.
       * - Role account id of the worker.
       **/
      WorkerRoleAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits when worker started leaving their role.
       * Params:
       * - Worker id.
       * - Rationale.
       **/
      WorkerStartedLeaving: AugmentedEvent<ApiType, [u64, Option<Bytes>]>;
      /**
       * Fund the working group budget.
       * Params:
       * - Member ID
       * - Amount of balance
       * - Rationale
       **/
      WorkingGroupBudgetFunded: AugmentedEvent<ApiType, [u64, u128, Bytes]>;
    };
    projectToken: {
      /**
       * Account Dusted
       * Params:
       * - token identifier
       * - id of the dusted account owner member
       * - account that called the extrinsic
       * - ongoing policy
       **/
      AccountDustedBy: AugmentedEvent<ApiType, [u64, u64, AccountId32, PalletProjectTokenTransferPolicy]>;
      /**
       * Member joined whitelist
       * Params:
       * - token identifier
       * - member id
       * - ongoing transfer policy
       **/
      MemberJoinedWhitelist: AugmentedEvent<ApiType, [u64, u64, PalletProjectTokenTransferPolicy]>;
      /**
       * Patronage credit claimed by creator
       * Params:
       * - token identifier
       * - credit amount
       * - member id
       **/
      PatronageCreditClaimed: AugmentedEvent<ApiType, [u64, u128, u64]>;
      /**
       * Patronage rate decreased
       * Params:
       * - token identifier
       * - new patronage rate
       **/
      PatronageRateDecreasedTo: AugmentedEvent<ApiType, [u64, Perquintill]>;
      /**
       * Revenue Split finalized
       * Params:
       * - token identifier
       * - recovery account for the leftover funds
       * - leftover funds
       **/
      RevenueSplitFinalized: AugmentedEvent<ApiType, [u64, AccountId32, u128]>;
      /**
       * Revenue Split issued
       * Params:
       * - token identifier
       * - starting block for the split
       * - duration of the split
       * - JOY allocated for the split
       **/
      RevenueSplitIssued: AugmentedEvent<ApiType, [u64, u32, u32, u128]>;
      /**
       * User left revenue split
       * Params:
       * - token identifier
       * - ex-participant's member id
       * - amount unstaked
       **/
      RevenueSplitLeft: AugmentedEvent<ApiType, [u64, u64, u128]>;
      /**
       * Token amount is transferred from src to dst
       * Params:
       * - token identifier
       * - source member id
       * - map containing validated outputs (amount indexed by (member_id + account existance))
       * - transfer's metadata
       **/
      TokenAmountTransferred: AugmentedEvent<ApiType, [u64, u64, BTreeMap<PalletProjectTokenValidated, PalletProjectTokenValidatedPayment>, Bytes]>;
      /**
       * Token amount transferred by issuer
       * Params:
       * - token identifier
       * - source (issuer) member id
       * - map containing validated outputs
       * (amount, opt. vesting schedule, opt. vesting cleanup key) data indexed by
       * (account_id + account existance)
       * - transfer's metadata
       **/
      TokenAmountTransferredByIssuer: AugmentedEvent<ApiType, [u64, u64, BTreeMap<PalletProjectTokenValidated, PalletProjectTokenValidatedPayment>, Bytes]>;
      /**
       * Token Deissued
       * Params:
       * - token id
       **/
      TokenDeissued: AugmentedEvent<ApiType, [u64]>;
      /**
       * Token Issued
       * Params:
       * - token id
       * - token issuance parameters
       **/
      TokenIssued: AugmentedEvent<ApiType, [u64, PalletProjectTokenTokenIssuanceParameters]>;
      /**
       * Token Sale Finalized
       * Params:
       * - token id
       * - token sale id
       * - amount of unsold tokens recovered
       * - amount of JOY collected
       **/
      TokenSaleFinalized: AugmentedEvent<ApiType, [u64, u32, u128, u128]>;
      /**
       * Toke Sale was Initialized
       * Params:
       * - token id
       * - token sale id
       * - token sale data
       * - token sale metadata
       **/
      TokenSaleInitialized: AugmentedEvent<ApiType, [u64, u32, PalletProjectTokenTokenSale, Option<Bytes>]>;
      /**
       * Tokens Burned
       * Params:
       * - token id
       * - member id
       * - number of tokens burned
       **/
      TokensBurned: AugmentedEvent<ApiType, [u64, u64, u128]>;
      /**
       * Tokens Purchased On Sale
       * Params:
       * - token id
       * - token sale id
       * - amount of tokens purchased
       * - buyer's member id
       **/
      TokensPurchasedOnSale: AugmentedEvent<ApiType, [u64, u32, u128, u64]>;
      /**
       * Transfer Policy Changed To Permissionless
       * Params:
       * - token id
       **/
      TransferPolicyChangedToPermissionless: AugmentedEvent<ApiType, [u64]>;
      /**
       * Upcoming Token Sale was Updated
       * Params:
       * - token id
       * - token sale id
       * - new sale start block
       * - new sale duration
       **/
      UpcomingTokenSaleUpdated: AugmentedEvent<ApiType, [u64, u32, Option<u32>, Option<u32>]>;
      /**
       * User partipated in a revenue split
       * Params:
       * - token identifier
       * - participant's member id
       * - user allocated staked balance
       * - dividend amount (JOY) granted
       * - revenue split identifier
       **/
      UserParticipatedInSplit: AugmentedEvent<ApiType, [u64, u64, u128, u128, u32]>;
    };
    proposalsCodex: {
      /**
       * A proposal was created
       * Params:
       * - Id of a newly created proposal after it was saved in storage.
       * - General proposal parameter. Parameters shared by all proposals
       * - Proposal Details. Parameter of proposal with a variant for each kind of proposal
       * - Id of a newly created proposal thread
       **/
      ProposalCreated: AugmentedEvent<ApiType, [u32, PalletProposalsCodexGeneralProposalParams, PalletProposalsCodexProposalDetails, u64]>;
    };
    proposalsDiscussion: {
      /**
       * Emits on post creation.
       **/
      PostCreated: AugmentedEvent<ApiType, [u64, u64, u64, Bytes, bool]>;
      /**
       * Emits on post deleted
       **/
      PostDeleted: AugmentedEvent<ApiType, [u64, u64, u64, bool]>;
      /**
       * Emits on post update.
       **/
      PostUpdated: AugmentedEvent<ApiType, [u64, u64, u64, Bytes]>;
      /**
       * Emits on thread creation.
       **/
      ThreadCreated: AugmentedEvent<ApiType, [u64, u64]>;
      /**
       * Emits on thread mode change.
       **/
      ThreadModeChanged: AugmentedEvent<ApiType, [u64, PalletProposalsDiscussionThreadModeBTreeSet, u64]>;
    };
    proposalsEngine: {
      /**
       * Emits on a proposal being cancelled
       * Params:
       * - Member Id of the proposer
       * - Id of the proposal
       **/
      ProposalCancelled: AugmentedEvent<ApiType, [u64, u32]>;
      /**
       * Emits on getting a proposal status decision.
       * Params:
       * - Id of a proposal.
       * - Proposal decision
       **/
      ProposalDecisionMade: AugmentedEvent<ApiType, [u32, PalletProposalsEngineProposalStatusesProposalDecision]>;
      /**
       * Emits on proposal execution.
       * Params:
       * - Id of a updated proposal.
       * - Proposal execution status.
       **/
      ProposalExecuted: AugmentedEvent<ApiType, [u32, PalletProposalsEngineProposalStatusesExecutionStatus]>;
      /**
       * Emits on proposal creation.
       * Params:
       * - Id of a proposal.
       * - New proposal status.
       **/
      ProposalStatusUpdated: AugmentedEvent<ApiType, [u32, PalletProposalsEngineProposalStatusesProposalStatus]>;
      /**
       * Emits on proposer making a remark
       * - proposer id
       * - proposal id
       * - message
       **/
      ProposerRemarked: AugmentedEvent<ApiType, [u64, u32, Bytes]>;
      /**
       * Emits on voting for the proposal
       * Params:
       * - Voter - member id of a voter.
       * - Id of a proposal.
       * - Kind of vote.
       * - Rationale.
       **/
      Voted: AugmentedEvent<ApiType, [u64, u32, PalletProposalsEngineVoteKind, Bytes]>;
    };
    referendum: {
      /**
       * Referendum ended and winning option was selected
       **/
      ReferendumFinished: AugmentedEvent<ApiType, [Vec<PalletReferendumOptionResult>]>;
      /**
       * Referendum started
       **/
      ReferendumStarted: AugmentedEvent<ApiType, [u32, u32]>;
      /**
       * Referendum started
       **/
      ReferendumStartedForcefully: AugmentedEvent<ApiType, [u32, u32]>;
      /**
       * Revealing phase has begun
       **/
      RevealingStageStarted: AugmentedEvent<ApiType, [u32]>;
      /**
       * User released his stake
       **/
      StakeReleased: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * User cast a vote in referendum
       **/
      VoteCast: AugmentedEvent<ApiType, [AccountId32, H256, u128]>;
      /**
       * User revealed his vote
       **/
      VoteRevealed: AugmentedEvent<ApiType, [AccountId32, u64, Bytes]>;
    };
    session: {
      /**
       * New session has happened. Note that the argument is the session index, not the
       * block number as the type might suggest.
       **/
      NewSession: AugmentedEvent<ApiType, [sessionIndex: u32], { sessionIndex: u32 }>;
    };
    staking: {
      /**
       * An account has bonded this amount. \[stash, amount\]
       * 
       * NOTE: This event is only emitted when funds are bonded via a dispatchable. Notably,
       * it will not be emitted for staking rewards when they are added to stake.
       **/
      Bonded: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * An account has stopped participating as either a validator or nominator.
       * \[stash\]
       **/
      Chilled: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * The era payout has been set; the first balance is the validator-payout; the second is
       * the remainder from the maximum amount of reward.
       * \[era_index, validator_payout, remainder\]
       **/
      EraPaid: AugmentedEvent<ApiType, [u32, u128, u128]>;
      /**
       * A nominator has been kicked from a validator. \[nominator, stash\]
       **/
      Kicked: AugmentedEvent<ApiType, [AccountId32, AccountId32]>;
      /**
       * An old slashing report from a prior era was discarded because it could
       * not be processed. \[session_index\]
       **/
      OldSlashingReportDiscarded: AugmentedEvent<ApiType, [u32]>;
      /**
       * The stakers' rewards are getting paid. \[era_index, validator_stash\]
       **/
      PayoutStarted: AugmentedEvent<ApiType, [u32, AccountId32]>;
      /**
       * The nominator has been rewarded by this amount. \[stash, amount\]
       **/
      Rewarded: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * One validator (and its nominators) has been slashed by the given amount.
       * \[validator, amount\]
       **/
      Slashed: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * A new set of stakers was elected.
       **/
      StakersElected: AugmentedEvent<ApiType, []>;
      /**
       * The election failed. No new era is planned.
       **/
      StakingElectionFailed: AugmentedEvent<ApiType, []>;
      /**
       * An account has unbonded this amount. \[stash, amount\]
       **/
      Unbonded: AugmentedEvent<ApiType, [AccountId32, u128]>;
      /**
       * A validator has set their preferences.
       **/
      ValidatorPrefsSet: AugmentedEvent<ApiType, [AccountId32, PalletStakingValidatorPrefs]>;
      /**
       * An account has called `withdraw_unbonded` and removed unbonding chunks worth `Balance`
       * from the unlocking queue. \[stash, amount\]
       **/
      Withdrawn: AugmentedEvent<ApiType, [AccountId32, u128]>;
    };
    storage: {
      /**
       * Emits on changing the size-based pricing of new objects uploaded.
       * Params
       * - new data size fee
       **/
      DataObjectPerMegabyteFeeUpdated: AugmentedEvent<ApiType, [u128]>;
      /**
       * Emits on data objects deletion from bags.
       * Params
       * - account ID for the state bloat bond
       * - bag ID
       * - data object IDs
       **/
      DataObjectsDeleted: AugmentedEvent<ApiType, [AccountId32, PalletStorageBagIdType, BTreeSet<u64>]>;
      /**
       * Emits on moving data objects between bags.
       * Params
       * - source bag ID
       * - destination bag ID
       * - data object IDs
       **/
      DataObjectsMoved: AugmentedEvent<ApiType, [PalletStorageBagIdType, PalletStorageBagIdType, BTreeSet<u64>]>;
      /**
       * Emits on updating the data object state bloat bond.
       * Params
       * - state bloat bond value
       **/
      DataObjectStateBloatBondValueUpdated: AugmentedEvent<ApiType, [u128]>;
      /**
       * Emits on storage assets being uploaded and deleted at the same time
       * Params
       * - UploadParameters
       * - Ids of the uploaded objects
       * - Ids of the removed objects
       **/
      DataObjectsUpdated: AugmentedEvent<ApiType, [PalletStorageUploadParametersRecord, BTreeSet<u64>, BTreeSet<u64>]>;
      /**
       * Emits on uploading data objects.
       * Params
       * - data objects IDs
       * - initial uploading parameters
       * - state bloat bond for objects
       **/
      DataObjectsUploaded: AugmentedEvent<ApiType, [BTreeSet<u64>, PalletStorageUploadParametersRecord, u128]>;
      /**
       * Emits on creating distribution bucket.
       * Params
       * - distribution bucket family ID
       * - accepting new bags
       * - distribution bucket ID
       **/
      DistributionBucketCreated: AugmentedEvent<ApiType, [u64, bool, PalletStorageDistributionBucketIdRecord]>;
      /**
       * Emits on deleting distribution bucket.
       * Params
       * - distribution bucket ID
       **/
      DistributionBucketDeleted: AugmentedEvent<ApiType, [PalletStorageDistributionBucketIdRecord]>;
      /**
       * Emits on creating distribution bucket family.
       * Params
       * - distribution family bucket ID
       **/
      DistributionBucketFamilyCreated: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on deleting distribution bucket family.
       * Params
       * - distribution family bucket ID
       **/
      DistributionBucketFamilyDeleted: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on setting the metadata by a distribution bucket family.
       * Params
       * - distribution bucket family ID
       * - metadata
       **/
      DistributionBucketFamilyMetadataSet: AugmentedEvent<ApiType, [u64, Bytes]>;
      /**
       * Emits on accepting a distribution bucket invitation for the operator.
       * Params
       * - worker ID
       * - distribution bucket ID
       **/
      DistributionBucketInvitationAccepted: AugmentedEvent<ApiType, [u64, PalletStorageDistributionBucketIdRecord]>;
      /**
       * Emits on canceling a distribution bucket invitation for the operator.
       * Params
       * - distribution bucket ID
       * - operator worker ID
       **/
      DistributionBucketInvitationCancelled: AugmentedEvent<ApiType, [PalletStorageDistributionBucketIdRecord, u64]>;
      /**
       * Emits on setting the metadata by a distribution bucket operator.
       * Params
       * - worker ID
       * - distribution bucket ID
       * - metadata
       **/
      DistributionBucketMetadataSet: AugmentedEvent<ApiType, [u64, PalletStorageDistributionBucketIdRecord, Bytes]>;
      /**
       * Emits on storage bucket mode update (distributing flag).
       * Params
       * - distribution bucket ID
       * - distributing
       **/
      DistributionBucketModeUpdated: AugmentedEvent<ApiType, [PalletStorageDistributionBucketIdRecord, bool]>;
      /**
       * Emits on creating a distribution bucket invitation for the operator.
       * Params
       * - distribution bucket ID
       * - worker ID
       **/
      DistributionBucketOperatorInvited: AugmentedEvent<ApiType, [PalletStorageDistributionBucketIdRecord, u64]>;
      /**
       * Emits on the distribution bucket operator removal.
       * Params
       * - distribution bucket ID
       * - distribution bucket operator ID
       **/
      DistributionBucketOperatorRemoved: AugmentedEvent<ApiType, [PalletStorageDistributionBucketIdRecord, u64]>;
      /**
       * Emits on changing the "Distribution buckets per bag" number limit.
       * Params
       * - new limit
       **/
      DistributionBucketsPerBagLimitUpdated: AugmentedEvent<ApiType, [u32]>;
      /**
       * Emits on storage bucket status update (accepting new bags).
       * Params
       * - distribution bucket ID
       * - new status (accepting new bags)
       **/
      DistributionBucketStatusUpdated: AugmentedEvent<ApiType, [PalletStorageDistributionBucketIdRecord, bool]>;
      /**
       * Emits on updating distribution buckets for bag.
       * Params
       * - bag ID
       * - storage buckets to add ID collection
       * - storage buckets to remove ID collection
       **/
      DistributionBucketsUpdatedForBag: AugmentedEvent<ApiType, [PalletStorageBagIdType, u64, BTreeSet<u64>, BTreeSet<u64>]>;
      /**
       * Emits on Distribution Operator making a remark
       * Params
       * - operator's worker id
       * - distribution bucket id
       * - remark message
       **/
      DistributionOperatorRemarked: AugmentedEvent<ApiType, [u64, PalletStorageDistributionBucketIdRecord, Bytes]>;
      /**
       * Emits on creating a dynamic bag.
       * Params
       * - dynamic bag creation parameters
       * - uploaded data objects ids
       **/
      DynamicBagCreated: AugmentedEvent<ApiType, [PalletStorageDynBagCreationParametersRecord, BTreeSet<u64>]>;
      /**
       * Emits on deleting a dynamic bag.
       * Params
       * - dynamic bag ID
       **/
      DynamicBagDeleted: AugmentedEvent<ApiType, [PalletStorageDynamicBagIdType]>;
      /**
       * Emits on dynamic bag creation policy update (distribution bucket families).
       * Params
       * - dynamic bag type
       * - families and bucket numbers
       **/
      FamiliesInDynamicBagCreationPolicyUpdated: AugmentedEvent<ApiType, [PalletStorageDynamicBagType, BTreeMap<u64, u32>]>;
      /**
       * Emits on updating the number of storage buckets in dynamic bag creation policy.
       * Params
       * - dynamic bag type
       * - new number of storage buckets
       **/
      NumberOfStorageBucketsInDynamicBagCreationPolicyUpdated: AugmentedEvent<ApiType, [PalletStorageDynamicBagType, u32]>;
      /**
       * Emits on accepting pending data objects.
       * Params
       * - storage bucket ID
       * - worker ID (storage provider ID)
       * - bag ID
       * - pending data objects
       **/
      PendingDataObjectsAccepted: AugmentedEvent<ApiType, [u64, u64, PalletStorageBagIdType, BTreeSet<u64>]>;
      /**
       * Emits on creating the storage bucket.
       * Params
       * - storage bucket ID
       * - invited worker
       * - flag "accepting_new_bags"
       * - size limit for voucher,
       * - objects limit for voucher,
       **/
      StorageBucketCreated: AugmentedEvent<ApiType, [u64, Option<u64>, bool, u64, u64]>;
      /**
       * Emits on storage bucket deleting.
       * Params
       * - storage bucket ID
       **/
      StorageBucketDeleted: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on accepting the storage bucket invitation.
       * Params
       * - storage bucket ID
       * - invited worker ID
       * - transactor account ID
       **/
      StorageBucketInvitationAccepted: AugmentedEvent<ApiType, [u64, u64, AccountId32]>;
      /**
       * Emits on cancelling the storage bucket invitation.
       * Params
       * - storage bucket ID
       **/
      StorageBucketInvitationCancelled: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on the storage bucket operator invitation.
       * Params
       * - storage bucket ID
       * - operator worker ID (storage provider ID)
       **/
      StorageBucketOperatorInvited: AugmentedEvent<ApiType, [u64, u64]>;
      /**
       * Emits on the storage bucket operator removal.
       * Params
       * - storage bucket ID
       **/
      StorageBucketOperatorRemoved: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on changing the "Storage buckets per bag" number limit.
       * Params
       * - new limit
       **/
      StorageBucketsPerBagLimitUpdated: AugmentedEvent<ApiType, [u32]>;
      /**
       * Emits on storage bucket status update.
       * Params
       * - storage bucket ID
       * - new status
       **/
      StorageBucketStatusUpdated: AugmentedEvent<ApiType, [u64, bool]>;
      /**
       * Emits on updating storage buckets for bag.
       * Params
       * - bag ID
       * - storage buckets to add ID collection
       * - storage buckets to remove ID collection
       **/
      StorageBucketsUpdatedForBag: AugmentedEvent<ApiType, [PalletStorageBagIdType, BTreeSet<u64>, BTreeSet<u64>]>;
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
      StorageBucketVoucherLimitsSet: AugmentedEvent<ApiType, [u64, u64, u64]>;
      /**
       * Emits on setting the storage operator metadata.
       * Params
       * - storage bucket ID
       * - invited worker ID
       * - metadata
       **/
      StorageOperatorMetadataSet: AugmentedEvent<ApiType, [u64, u64, Bytes]>;
      /**
       * Emits on Storage Operator making a remark
       * Params
       * - operator's worker id
       * - storage bucket id
       * - remark message
       **/
      StorageOperatorRemarked: AugmentedEvent<ApiType, [u64, u64, Bytes]>;
      /**
       * Emits on updating the blacklist with data hashes.
       * Params
       * - hashes to remove from the blacklist
       * - hashes to add to the blacklist
       **/
      UpdateBlacklist: AugmentedEvent<ApiType, [BTreeSet<Bytes>, BTreeSet<Bytes>]>;
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
      VoucherChanged: AugmentedEvent<ApiType, [u64, PalletStorageVoucher]>;
    };
    storageWorkingGroup: {
      /**
       * Emits on withdrawing the application for the regular worker/lead opening.
       * Params:
       * - Job application id
       **/
      ApplicationWithdrawn: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on adding the application for the worker opening.
       * Params:
       * - Opening parameteres
       * - Application id
       **/
      AppliedOnOpening: AugmentedEvent<ApiType, [PalletWorkingGroupApplyOnOpeningParams, u64]>;
      /**
       * Emits on setting the budget for the working group.
       * Params:
       * - new budget
       **/
      BudgetSet: AugmentedEvent<ApiType, [u128]>;
      /**
       * Emits on budget from the working group being spent
       * Params:
       * - Receiver Account Id.
       * - Balance spent.
       * - Rationale.
       **/
      BudgetSpending: AugmentedEvent<ApiType, [AccountId32, u128, Option<Bytes>]>;
      /**
       * Emits on setting the group leader.
       * Params:
       * - Group worker id.
       **/
      LeaderSet: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on un-setting the leader.
       **/
      LeaderUnset: AugmentedEvent<ApiType, []>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - message
       **/
      LeadRemarked: AugmentedEvent<ApiType, [Bytes]>;
      /**
       * Emits on reaching new missed reward.
       * Params:
       * - Worker ID.
       * - Missed reward (optional). None means 'no missed reward'.
       **/
      NewMissedRewardLevelReached: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on adding new job opening.
       * Params:
       * - Opening id
       * - Description
       * - Opening Type(Lead or Worker)
       * - Stake Policy for the opening
       * - Reward per block
       **/
      OpeningAdded: AugmentedEvent<ApiType, [u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
      /**
       * Emits on canceling the job opening.
       * Params:
       * - Opening id
       **/
      OpeningCanceled: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on filling the job opening.
       * Params:
       * - Worker opening id
       * - Worker application id to the worker id dictionary
       * - Applicationd ids used to fill the opening
       **/
      OpeningFilled: AugmentedEvent<ApiType, [u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
      /**
       * Emits on paying the reward.
       * Params:
       * - Id of the worker.
       * - Receiver Account Id.
       * - Reward
       * - Payment type (missed reward or regular one)
       **/
      RewardPaid: AugmentedEvent<ApiType, [u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
      /**
       * Emits on decreasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeDecreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on increasing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - stake delta amount
       **/
      StakeIncreased: AugmentedEvent<ApiType, [u64, u128]>;
      /**
       * Emits on slashing the regular worker/lead stake.
       * Params:
       * - regular worker/lead id.
       * - actual slashed balance.
       * - Requested slashed balance.
       * - Rationale.
       **/
      StakeSlashed: AugmentedEvent<ApiType, [u64, u128, u128, Option<Bytes>]>;
      /**
       * Emits on updating the status text of the working group.
       * Params:
       * - status text hash
       * - status text
       **/
      StatusTextChanged: AugmentedEvent<ApiType, [H256, Option<Bytes>]>;
      /**
       * Emits on terminating the leader.
       * Params:
       * - leader worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedLeader: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on terminating the worker.
       * Params:
       * - worker id.
       * - Penalty.
       * - Rationale.
       **/
      TerminatedWorker: AugmentedEvent<ApiType, [u64, Option<u128>, Option<Bytes>]>;
      /**
       * Emits on exiting the worker.
       * Params:
       * - worker id.
       * - Rationale.
       **/
      WorkerExited: AugmentedEvent<ApiType, [u64]>;
      /**
       * Emits on Lead making a remark message
       * Params:
       * - worker
       * - message
       **/
      WorkerRemarked: AugmentedEvent<ApiType, [u64, Bytes]>;
      /**
       * Emits on updating the reward account of the worker.
       * Params:
       * - Id of the worker.
       * - Reward account id of the worker.
       **/
      WorkerRewardAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits on updating the reward amount of the worker.
       * Params:
       * - Id of the worker.
       * - Reward per block
       **/
      WorkerRewardAmountUpdated: AugmentedEvent<ApiType, [u64, Option<u128>]>;
      /**
       * Emits on updating the role account of the worker.
       * Params:
       * - Id of the worker.
       * - Role account id of the worker.
       **/
      WorkerRoleAccountUpdated: AugmentedEvent<ApiType, [u64, AccountId32]>;
      /**
       * Emits when worker started leaving their role.
       * Params:
       * - Worker id.
       * - Rationale.
       **/
      WorkerStartedLeaving: AugmentedEvent<ApiType, [u64, Option<Bytes>]>;
      /**
       * Fund the working group budget.
       * Params:
       * - Member ID
       * - Amount of balance
       * - Rationale
       **/
      WorkingGroupBudgetFunded: AugmentedEvent<ApiType, [u64, u128, Bytes]>;
    };
    sudo: {
      /**
       * The \[sudoer\] just switched identity; the old key is supplied if one existed.
       **/
      KeyChanged: AugmentedEvent<ApiType, [oldSudoer: Option<AccountId32>], { oldSudoer: Option<AccountId32> }>;
      /**
       * A sudo just took place. \[result\]
       **/
      Sudid: AugmentedEvent<ApiType, [sudoResult: Result<Null, SpRuntimeDispatchError>], { sudoResult: Result<Null, SpRuntimeDispatchError> }>;
      /**
       * A sudo just took place. \[result\]
       **/
      SudoAsDone: AugmentedEvent<ApiType, [sudoResult: Result<Null, SpRuntimeDispatchError>], { sudoResult: Result<Null, SpRuntimeDispatchError> }>;
    };
    system: {
      /**
       * `:code` was updated.
       **/
      CodeUpdated: AugmentedEvent<ApiType, []>;
      /**
       * An extrinsic failed.
       **/
      ExtrinsicFailed: AugmentedEvent<ApiType, [dispatchError: SpRuntimeDispatchError, dispatchInfo: FrameSupportWeightsDispatchInfo], { dispatchError: SpRuntimeDispatchError, dispatchInfo: FrameSupportWeightsDispatchInfo }>;
      /**
       * An extrinsic completed successfully.
       **/
      ExtrinsicSuccess: AugmentedEvent<ApiType, [dispatchInfo: FrameSupportWeightsDispatchInfo], { dispatchInfo: FrameSupportWeightsDispatchInfo }>;
      /**
       * An account was reaped.
       **/
      KilledAccount: AugmentedEvent<ApiType, [account: AccountId32], { account: AccountId32 }>;
      /**
       * A new account was created.
       **/
      NewAccount: AugmentedEvent<ApiType, [account: AccountId32], { account: AccountId32 }>;
      /**
       * On on-chain remark happened.
       **/
      Remarked: AugmentedEvent<ApiType, [sender: AccountId32, hash_: H256], { sender: AccountId32, hash_: H256 }>;
    };
    utility: {
      /**
       * Batch of dispatches completed fully with no error.
       **/
      BatchCompleted: AugmentedEvent<ApiType, []>;
      /**
       * Batch of dispatches completed but has errors.
       **/
      BatchCompletedWithErrors: AugmentedEvent<ApiType, []>;
      /**
       * Batch of dispatches did not complete fully. Index of first failing dispatch given, as
       * well as the error.
       **/
      BatchInterrupted: AugmentedEvent<ApiType, [index: u32, error: SpRuntimeDispatchError], { index: u32, error: SpRuntimeDispatchError }>;
      /**
       * A call was dispatched.
       **/
      DispatchedAs: AugmentedEvent<ApiType, [result: Result<Null, SpRuntimeDispatchError>], { result: Result<Null, SpRuntimeDispatchError> }>;
      /**
       * A single item within a Batch of dispatches has completed with no error.
       **/
      ItemCompleted: AugmentedEvent<ApiType, []>;
      /**
       * A single item within a Batch of dispatches has completed with error.
       **/
      ItemFailed: AugmentedEvent<ApiType, [error: SpRuntimeDispatchError], { error: SpRuntimeDispatchError }>;
    };
    vesting: {
      /**
       * An \[account\] has become fully vested.
       **/
      VestingCompleted: AugmentedEvent<ApiType, [account: AccountId32], { account: AccountId32 }>;
      /**
       * The amount vested has been updated. This could indicate a change in funds available.
       * The balance given is the amount which is left unvested (and thus locked).
       **/
      VestingUpdated: AugmentedEvent<ApiType, [account: AccountId32, unvested: u128], { account: AccountId32, unvested: u128 }>;
    };
  } // AugmentedEvents
} // declare module
