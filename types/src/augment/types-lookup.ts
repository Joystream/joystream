// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

declare module '@polkadot/types/lookup' {
  import type { BTreeMap, BTreeSet, Bytes, Compact, Enum, Null, Option, Result, Struct, Text, U8aFixed, Vec, WrapperKeepOpaque, bool, u128, u16, u32, u64, u8 } from '@polkadot/types-codec';
  import type { ITuple } from '@polkadot/types-codec/types';
  import type { AccountId32, Call, H256, PerU16, Perbill, Percent, Permill, Perquintill } from '@polkadot/types/interfaces/runtime';
  import type { Event } from '@polkadot/types/interfaces/system';

  /** @name FrameSystemAccountInfo (3) */
  export interface FrameSystemAccountInfo extends Struct {
    readonly nonce: u32;
    readonly consumers: u32;
    readonly providers: u32;
    readonly sufficients: u32;
    readonly data: PalletBalancesAccountData;
  }

  /** @name PalletBalancesAccountData (5) */
  export interface PalletBalancesAccountData extends Struct {
    readonly free: u128;
    readonly reserved: u128;
    readonly miscFrozen: u128;
    readonly feeFrozen: u128;
  }

  /** @name FrameSupportWeightsPerDispatchClassU64 (7) */
  export interface FrameSupportWeightsPerDispatchClassU64 extends Struct {
    readonly normal: u64;
    readonly operational: u64;
    readonly mandatory: u64;
  }

  /** @name SpRuntimeDigest (11) */
  export interface SpRuntimeDigest extends Struct {
    readonly logs: Vec<SpRuntimeDigestDigestItem>;
  }

  /** @name SpRuntimeDigestDigestItem (13) */
  export interface SpRuntimeDigestDigestItem extends Enum {
    readonly isOther: boolean;
    readonly asOther: Bytes;
    readonly isConsensus: boolean;
    readonly asConsensus: ITuple<[U8aFixed, Bytes]>;
    readonly isSeal: boolean;
    readonly asSeal: ITuple<[U8aFixed, Bytes]>;
    readonly isPreRuntime: boolean;
    readonly asPreRuntime: ITuple<[U8aFixed, Bytes]>;
    readonly isRuntimeEnvironmentUpdated: boolean;
    readonly type: 'Other' | 'Consensus' | 'Seal' | 'PreRuntime' | 'RuntimeEnvironmentUpdated';
  }

  /** @name FrameSystemEventRecord (16) */
  export interface FrameSystemEventRecord extends Struct {
    readonly phase: FrameSystemPhase;
    readonly event: Event;
    readonly topics: Vec<H256>;
  }

  /** @name FrameSystemEvent (18) */
  export interface FrameSystemEvent extends Enum {
    readonly isExtrinsicSuccess: boolean;
    readonly asExtrinsicSuccess: {
      readonly dispatchInfo: FrameSupportWeightsDispatchInfo;
    } & Struct;
    readonly isExtrinsicFailed: boolean;
    readonly asExtrinsicFailed: {
      readonly dispatchError: SpRuntimeDispatchError;
      readonly dispatchInfo: FrameSupportWeightsDispatchInfo;
    } & Struct;
    readonly isCodeUpdated: boolean;
    readonly isNewAccount: boolean;
    readonly asNewAccount: {
      readonly account: AccountId32;
    } & Struct;
    readonly isKilledAccount: boolean;
    readonly asKilledAccount: {
      readonly account: AccountId32;
    } & Struct;
    readonly isRemarked: boolean;
    readonly asRemarked: {
      readonly sender: AccountId32;
      readonly hash_: H256;
    } & Struct;
    readonly type: 'ExtrinsicSuccess' | 'ExtrinsicFailed' | 'CodeUpdated' | 'NewAccount' | 'KilledAccount' | 'Remarked';
  }

  /** @name FrameSupportWeightsDispatchInfo (19) */
  export interface FrameSupportWeightsDispatchInfo extends Struct {
    readonly weight: u64;
    readonly class: FrameSupportWeightsDispatchClass;
    readonly paysFee: FrameSupportWeightsPays;
  }

  /** @name FrameSupportWeightsDispatchClass (20) */
  export interface FrameSupportWeightsDispatchClass extends Enum {
    readonly isNormal: boolean;
    readonly isOperational: boolean;
    readonly isMandatory: boolean;
    readonly type: 'Normal' | 'Operational' | 'Mandatory';
  }

  /** @name FrameSupportWeightsPays (21) */
  export interface FrameSupportWeightsPays extends Enum {
    readonly isYes: boolean;
    readonly isNo: boolean;
    readonly type: 'Yes' | 'No';
  }

  /** @name SpRuntimeDispatchError (22) */
  export interface SpRuntimeDispatchError extends Enum {
    readonly isOther: boolean;
    readonly isCannotLookup: boolean;
    readonly isBadOrigin: boolean;
    readonly isModule: boolean;
    readonly asModule: SpRuntimeModuleError;
    readonly isConsumerRemaining: boolean;
    readonly isNoProviders: boolean;
    readonly isTooManyConsumers: boolean;
    readonly isToken: boolean;
    readonly asToken: SpRuntimeTokenError;
    readonly isArithmetic: boolean;
    readonly asArithmetic: SpRuntimeArithmeticError;
    readonly isTransactional: boolean;
    readonly asTransactional: SpRuntimeTransactionalError;
    readonly type: 'Other' | 'CannotLookup' | 'BadOrigin' | 'Module' | 'ConsumerRemaining' | 'NoProviders' | 'TooManyConsumers' | 'Token' | 'Arithmetic' | 'Transactional';
  }

  /** @name SpRuntimeModuleError (23) */
  export interface SpRuntimeModuleError extends Struct {
    readonly index: u8;
    readonly error: U8aFixed;
  }

  /** @name SpRuntimeTokenError (24) */
  export interface SpRuntimeTokenError extends Enum {
    readonly isNoFunds: boolean;
    readonly isWouldDie: boolean;
    readonly isBelowMinimum: boolean;
    readonly isCannotCreate: boolean;
    readonly isUnknownAsset: boolean;
    readonly isFrozen: boolean;
    readonly isUnsupported: boolean;
    readonly type: 'NoFunds' | 'WouldDie' | 'BelowMinimum' | 'CannotCreate' | 'UnknownAsset' | 'Frozen' | 'Unsupported';
  }

  /** @name SpRuntimeArithmeticError (25) */
  export interface SpRuntimeArithmeticError extends Enum {
    readonly isUnderflow: boolean;
    readonly isOverflow: boolean;
    readonly isDivisionByZero: boolean;
    readonly type: 'Underflow' | 'Overflow' | 'DivisionByZero';
  }

  /** @name SpRuntimeTransactionalError (26) */
  export interface SpRuntimeTransactionalError extends Enum {
    readonly isLimitReached: boolean;
    readonly isNoLayer: boolean;
    readonly type: 'LimitReached' | 'NoLayer';
  }

  /** @name PalletUtilityEvent (27) */
  export interface PalletUtilityEvent extends Enum {
    readonly isBatchInterrupted: boolean;
    readonly asBatchInterrupted: {
      readonly index: u32;
      readonly error: SpRuntimeDispatchError;
    } & Struct;
    readonly isBatchCompleted: boolean;
    readonly isBatchCompletedWithErrors: boolean;
    readonly isItemCompleted: boolean;
    readonly isItemFailed: boolean;
    readonly asItemFailed: {
      readonly error: SpRuntimeDispatchError;
    } & Struct;
    readonly isDispatchedAs: boolean;
    readonly asDispatchedAs: {
      readonly result: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly type: 'BatchInterrupted' | 'BatchCompleted' | 'BatchCompletedWithErrors' | 'ItemCompleted' | 'ItemFailed' | 'DispatchedAs';
  }

  /** @name PalletBalancesEvent (30) */
  export interface PalletBalancesEvent extends Enum {
    readonly isEndowed: boolean;
    readonly asEndowed: {
      readonly account: AccountId32;
      readonly freeBalance: u128;
    } & Struct;
    readonly isDustLost: boolean;
    readonly asDustLost: {
      readonly account: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isTransfer: boolean;
    readonly asTransfer: {
      readonly from: AccountId32;
      readonly to: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isBalanceSet: boolean;
    readonly asBalanceSet: {
      readonly who: AccountId32;
      readonly free: u128;
      readonly reserved: u128;
    } & Struct;
    readonly isReserved: boolean;
    readonly asReserved: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isUnreserved: boolean;
    readonly asUnreserved: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isReserveRepatriated: boolean;
    readonly asReserveRepatriated: {
      readonly from: AccountId32;
      readonly to: AccountId32;
      readonly amount: u128;
      readonly destinationStatus: FrameSupportTokensMiscBalanceStatus;
    } & Struct;
    readonly isDeposit: boolean;
    readonly asDeposit: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isWithdraw: boolean;
    readonly asWithdraw: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isSlashed: boolean;
    readonly asSlashed: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly type: 'Endowed' | 'DustLost' | 'Transfer' | 'BalanceSet' | 'Reserved' | 'Unreserved' | 'ReserveRepatriated' | 'Deposit' | 'Withdraw' | 'Slashed';
  }

  /** @name FrameSupportTokensMiscBalanceStatus (31) */
  export interface FrameSupportTokensMiscBalanceStatus extends Enum {
    readonly isFree: boolean;
    readonly isReserved: boolean;
    readonly type: 'Free' | 'Reserved';
  }

  /** @name PalletElectionProviderMultiPhaseEvent (32) */
  export interface PalletElectionProviderMultiPhaseEvent extends Enum {
    readonly isSolutionStored: boolean;
    readonly asSolutionStored: {
      readonly electionCompute: PalletElectionProviderMultiPhaseElectionCompute;
      readonly prevEjected: bool;
    } & Struct;
    readonly isElectionFinalized: boolean;
    readonly asElectionFinalized: {
      readonly electionCompute: Option<PalletElectionProviderMultiPhaseElectionCompute>;
    } & Struct;
    readonly isRewarded: boolean;
    readonly asRewarded: {
      readonly account: AccountId32;
      readonly value: u128;
    } & Struct;
    readonly isSlashed: boolean;
    readonly asSlashed: {
      readonly account: AccountId32;
      readonly value: u128;
    } & Struct;
    readonly isSignedPhaseStarted: boolean;
    readonly asSignedPhaseStarted: {
      readonly round: u32;
    } & Struct;
    readonly isUnsignedPhaseStarted: boolean;
    readonly asUnsignedPhaseStarted: {
      readonly round: u32;
    } & Struct;
    readonly type: 'SolutionStored' | 'ElectionFinalized' | 'Rewarded' | 'Slashed' | 'SignedPhaseStarted' | 'UnsignedPhaseStarted';
  }

  /** @name PalletElectionProviderMultiPhaseElectionCompute (33) */
  export interface PalletElectionProviderMultiPhaseElectionCompute extends Enum {
    readonly isOnChain: boolean;
    readonly isSigned: boolean;
    readonly isUnsigned: boolean;
    readonly isFallback: boolean;
    readonly isEmergency: boolean;
    readonly type: 'OnChain' | 'Signed' | 'Unsigned' | 'Fallback' | 'Emergency';
  }

  /** @name PalletStakingPalletEvent (36) */
  export interface PalletStakingPalletEvent extends Enum {
    readonly isEraPaid: boolean;
    readonly asEraPaid: ITuple<[u32, u128, u128]>;
    readonly isRewarded: boolean;
    readonly asRewarded: ITuple<[AccountId32, u128]>;
    readonly isSlashed: boolean;
    readonly asSlashed: ITuple<[AccountId32, u128]>;
    readonly isOldSlashingReportDiscarded: boolean;
    readonly asOldSlashingReportDiscarded: u32;
    readonly isStakersElected: boolean;
    readonly isBonded: boolean;
    readonly asBonded: ITuple<[AccountId32, u128]>;
    readonly isUnbonded: boolean;
    readonly asUnbonded: ITuple<[AccountId32, u128]>;
    readonly isWithdrawn: boolean;
    readonly asWithdrawn: ITuple<[AccountId32, u128]>;
    readonly isKicked: boolean;
    readonly asKicked: ITuple<[AccountId32, AccountId32]>;
    readonly isStakingElectionFailed: boolean;
    readonly isChilled: boolean;
    readonly asChilled: AccountId32;
    readonly isPayoutStarted: boolean;
    readonly asPayoutStarted: ITuple<[u32, AccountId32]>;
    readonly isValidatorPrefsSet: boolean;
    readonly asValidatorPrefsSet: ITuple<[AccountId32, PalletStakingValidatorPrefs]>;
    readonly type: 'EraPaid' | 'Rewarded' | 'Slashed' | 'OldSlashingReportDiscarded' | 'StakersElected' | 'Bonded' | 'Unbonded' | 'Withdrawn' | 'Kicked' | 'StakingElectionFailed' | 'Chilled' | 'PayoutStarted' | 'ValidatorPrefsSet';
  }

  /** @name PalletStakingValidatorPrefs (37) */
  export interface PalletStakingValidatorPrefs extends Struct {
    readonly commission: Compact<Perbill>;
    readonly blocked: bool;
  }

  /** @name PalletSessionEvent (40) */
  export interface PalletSessionEvent extends Enum {
    readonly isNewSession: boolean;
    readonly asNewSession: {
      readonly sessionIndex: u32;
    } & Struct;
    readonly type: 'NewSession';
  }

  /** @name PalletGrandpaEvent (41) */
  export interface PalletGrandpaEvent extends Enum {
    readonly isNewAuthorities: boolean;
    readonly asNewAuthorities: {
      readonly authoritySet: Vec<ITuple<[SpFinalityGrandpaAppPublic, u64]>>;
    } & Struct;
    readonly isPaused: boolean;
    readonly isResumed: boolean;
    readonly type: 'NewAuthorities' | 'Paused' | 'Resumed';
  }

  /** @name SpFinalityGrandpaAppPublic (44) */
  export interface SpFinalityGrandpaAppPublic extends SpCoreEd25519Public {}

  /** @name SpCoreEd25519Public (45) */
  export interface SpCoreEd25519Public extends U8aFixed {}

  /** @name PalletImOnlineEvent (46) */
  export interface PalletImOnlineEvent extends Enum {
    readonly isHeartbeatReceived: boolean;
    readonly asHeartbeatReceived: {
      readonly authorityId: PalletImOnlineSr25519AppSr25519Public;
    } & Struct;
    readonly isAllGood: boolean;
    readonly isSomeOffline: boolean;
    readonly asSomeOffline: {
      readonly offline: Vec<ITuple<[AccountId32, PalletStakingExposure]>>;
    } & Struct;
    readonly type: 'HeartbeatReceived' | 'AllGood' | 'SomeOffline';
  }

  /** @name PalletImOnlineSr25519AppSr25519Public (47) */
  export interface PalletImOnlineSr25519AppSr25519Public extends SpCoreSr25519Public {}

  /** @name SpCoreSr25519Public (48) */
  export interface SpCoreSr25519Public extends U8aFixed {}

  /** @name PalletStakingExposure (51) */
  export interface PalletStakingExposure extends Struct {
    readonly total: Compact<u128>;
    readonly own: Compact<u128>;
    readonly others: Vec<PalletStakingIndividualExposure>;
  }

  /** @name PalletStakingIndividualExposure (54) */
  export interface PalletStakingIndividualExposure extends Struct {
    readonly who: AccountId32;
    readonly value: Compact<u128>;
  }

  /** @name PalletOffencesEvent (55) */
  export interface PalletOffencesEvent extends Enum {
    readonly isOffence: boolean;
    readonly asOffence: {
      readonly kind: U8aFixed;
      readonly timeslot: Bytes;
    } & Struct;
    readonly type: 'Offence';
  }

  /** @name PalletSudoEvent (57) */
  export interface PalletSudoEvent extends Enum {
    readonly isSudid: boolean;
    readonly asSudid: {
      readonly sudoResult: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly isKeyChanged: boolean;
    readonly asKeyChanged: {
      readonly oldSudoer: Option<AccountId32>;
    } & Struct;
    readonly isSudoAsDone: boolean;
    readonly asSudoAsDone: {
      readonly sudoResult: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly type: 'Sudid' | 'KeyChanged' | 'SudoAsDone';
  }

  /** @name PalletBagsListEvent (59) */
  export interface PalletBagsListEvent extends Enum {
    readonly isRebagged: boolean;
    readonly asRebagged: {
      readonly who: AccountId32;
      readonly from: u64;
      readonly to: u64;
    } & Struct;
    readonly isScoreUpdated: boolean;
    readonly asScoreUpdated: {
      readonly who: AccountId32;
      readonly newScore: u64;
    } & Struct;
    readonly type: 'Rebagged' | 'ScoreUpdated';
  }

  /** @name PalletVestingEvent (60) */
  export interface PalletVestingEvent extends Enum {
    readonly isVestingUpdated: boolean;
    readonly asVestingUpdated: {
      readonly account: AccountId32;
      readonly unvested: u128;
    } & Struct;
    readonly isVestingCompleted: boolean;
    readonly asVestingCompleted: {
      readonly account: AccountId32;
    } & Struct;
    readonly type: 'VestingUpdated' | 'VestingCompleted';
  }

  /** @name PalletMultisigEvent (61) */
  export interface PalletMultisigEvent extends Enum {
    readonly isNewMultisig: boolean;
    readonly asNewMultisig: {
      readonly approving: AccountId32;
      readonly multisig: AccountId32;
      readonly callHash: U8aFixed;
    } & Struct;
    readonly isMultisigApproval: boolean;
    readonly asMultisigApproval: {
      readonly approving: AccountId32;
      readonly timepoint: PalletMultisigTimepoint;
      readonly multisig: AccountId32;
      readonly callHash: U8aFixed;
    } & Struct;
    readonly isMultisigExecuted: boolean;
    readonly asMultisigExecuted: {
      readonly approving: AccountId32;
      readonly timepoint: PalletMultisigTimepoint;
      readonly multisig: AccountId32;
      readonly callHash: U8aFixed;
      readonly result: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly isMultisigCancelled: boolean;
    readonly asMultisigCancelled: {
      readonly cancelling: AccountId32;
      readonly timepoint: PalletMultisigTimepoint;
      readonly multisig: AccountId32;
      readonly callHash: U8aFixed;
    } & Struct;
    readonly type: 'NewMultisig' | 'MultisigApproval' | 'MultisigExecuted' | 'MultisigCancelled';
  }

  /** @name PalletMultisigTimepoint (62) */
  export interface PalletMultisigTimepoint extends Struct {
    readonly height: u32;
    readonly index: u32;
  }

  /** @name PalletCouncilRawEvent (63) */
  export interface PalletCouncilRawEvent extends Enum {
    readonly isAnnouncingPeriodStarted: boolean;
    readonly asAnnouncingPeriodStarted: u32;
    readonly isNotEnoughCandidates: boolean;
    readonly asNotEnoughCandidates: u32;
    readonly isVotingPeriodStarted: boolean;
    readonly asVotingPeriodStarted: u32;
    readonly isNewCandidate: boolean;
    readonly asNewCandidate: ITuple<[u64, AccountId32, AccountId32, u128]>;
    readonly isNewCouncilElected: boolean;
    readonly asNewCouncilElected: ITuple<[Vec<u64>, u32]>;
    readonly isNewCouncilNotElected: boolean;
    readonly asNewCouncilNotElected: u32;
    readonly isCandidacyStakeRelease: boolean;
    readonly asCandidacyStakeRelease: u64;
    readonly isCandidacyWithdraw: boolean;
    readonly asCandidacyWithdraw: u64;
    readonly isCandidacyNoteSet: boolean;
    readonly asCandidacyNoteSet: ITuple<[u64, Bytes]>;
    readonly isRewardPayment: boolean;
    readonly asRewardPayment: ITuple<[u64, AccountId32, u128, u128]>;
    readonly isBudgetBalanceSet: boolean;
    readonly asBudgetBalanceSet: u128;
    readonly isBudgetRefill: boolean;
    readonly asBudgetRefill: u128;
    readonly isBudgetRefillPlanned: boolean;
    readonly asBudgetRefillPlanned: u32;
    readonly isBudgetIncrementUpdated: boolean;
    readonly asBudgetIncrementUpdated: u128;
    readonly isCouncilorRewardUpdated: boolean;
    readonly asCouncilorRewardUpdated: u128;
    readonly isRequestFunded: boolean;
    readonly asRequestFunded: ITuple<[AccountId32, u128]>;
    readonly isCouncilBudgetFunded: boolean;
    readonly asCouncilBudgetFunded: ITuple<[u64, u128, Bytes]>;
    readonly isCouncilorRemarked: boolean;
    readonly asCouncilorRemarked: ITuple<[u64, Bytes]>;
    readonly isCandidateRemarked: boolean;
    readonly asCandidateRemarked: ITuple<[u64, Bytes]>;
    readonly type: 'AnnouncingPeriodStarted' | 'NotEnoughCandidates' | 'VotingPeriodStarted' | 'NewCandidate' | 'NewCouncilElected' | 'NewCouncilNotElected' | 'CandidacyStakeRelease' | 'CandidacyWithdraw' | 'CandidacyNoteSet' | 'RewardPayment' | 'BudgetBalanceSet' | 'BudgetRefill' | 'BudgetRefillPlanned' | 'BudgetIncrementUpdated' | 'CouncilorRewardUpdated' | 'RequestFunded' | 'CouncilBudgetFunded' | 'CouncilorRemarked' | 'CandidateRemarked';
  }

  /** @name PalletReferendumRawEvent (65) */
  export interface PalletReferendumRawEvent extends Enum {
    readonly isReferendumStarted: boolean;
    readonly asReferendumStarted: ITuple<[u32, u32]>;
    readonly isReferendumStartedForcefully: boolean;
    readonly asReferendumStartedForcefully: ITuple<[u32, u32]>;
    readonly isRevealingStageStarted: boolean;
    readonly asRevealingStageStarted: u32;
    readonly isReferendumFinished: boolean;
    readonly asReferendumFinished: Vec<PalletReferendumOptionResult>;
    readonly isVoteCast: boolean;
    readonly asVoteCast: ITuple<[AccountId32, H256, u128]>;
    readonly isVoteRevealed: boolean;
    readonly asVoteRevealed: ITuple<[AccountId32, u64, Bytes]>;
    readonly isStakeReleased: boolean;
    readonly asStakeReleased: AccountId32;
    readonly type: 'ReferendumStarted' | 'ReferendumStartedForcefully' | 'RevealingStageStarted' | 'ReferendumFinished' | 'VoteCast' | 'VoteRevealed' | 'StakeReleased';
  }

  /** @name PalletReferendumInstance1 (66) */
  export type PalletReferendumInstance1 = Null;

  /** @name PalletReferendumOptionResult (68) */
  export interface PalletReferendumOptionResult extends Struct {
    readonly optionId: u64;
    readonly votePower: u128;
  }

  /** @name PalletMembershipRawEvent (69) */
  export interface PalletMembershipRawEvent extends Enum {
    readonly isMemberInvited: boolean;
    readonly asMemberInvited: ITuple<[u64, PalletMembershipInviteMembershipParameters]>;
    readonly isMembershipGifted: boolean;
    readonly asMembershipGifted: ITuple<[u64, PalletMembershipGiftMembershipParameters]>;
    readonly isMembershipBought: boolean;
    readonly asMembershipBought: ITuple<[u64, PalletMembershipBuyMembershipParameters, u32]>;
    readonly isMemberProfileUpdated: boolean;
    readonly asMemberProfileUpdated: ITuple<[u64, Option<Bytes>, Option<Bytes>]>;
    readonly isMemberAccountsUpdated: boolean;
    readonly asMemberAccountsUpdated: ITuple<[u64, Option<AccountId32>, Option<AccountId32>]>;
    readonly isMemberVerificationStatusUpdated: boolean;
    readonly asMemberVerificationStatusUpdated: ITuple<[u64, bool, u64]>;
    readonly isReferralCutUpdated: boolean;
    readonly asReferralCutUpdated: u8;
    readonly isInvitesTransferred: boolean;
    readonly asInvitesTransferred: ITuple<[u64, u64, u32]>;
    readonly isMembershipPriceUpdated: boolean;
    readonly asMembershipPriceUpdated: u128;
    readonly isInitialInvitationBalanceUpdated: boolean;
    readonly asInitialInvitationBalanceUpdated: u128;
    readonly isLeaderInvitationQuotaUpdated: boolean;
    readonly asLeaderInvitationQuotaUpdated: u32;
    readonly isInitialInvitationCountUpdated: boolean;
    readonly asInitialInvitationCountUpdated: u32;
    readonly isStakingAccountAdded: boolean;
    readonly asStakingAccountAdded: ITuple<[AccountId32, u64]>;
    readonly isStakingAccountRemoved: boolean;
    readonly asStakingAccountRemoved: ITuple<[AccountId32, u64]>;
    readonly isStakingAccountConfirmed: boolean;
    readonly asStakingAccountConfirmed: ITuple<[AccountId32, u64]>;
    readonly isMemberRemarked: boolean;
    readonly asMemberRemarked: ITuple<[u64, Bytes]>;
    readonly isMemberCreated: boolean;
    readonly asMemberCreated: ITuple<[u64, PalletMembershipCreateMemberParameters, u32]>;
    readonly type: 'MemberInvited' | 'MembershipGifted' | 'MembershipBought' | 'MemberProfileUpdated' | 'MemberAccountsUpdated' | 'MemberVerificationStatusUpdated' | 'ReferralCutUpdated' | 'InvitesTransferred' | 'MembershipPriceUpdated' | 'InitialInvitationBalanceUpdated' | 'LeaderInvitationQuotaUpdated' | 'InitialInvitationCountUpdated' | 'StakingAccountAdded' | 'StakingAccountRemoved' | 'StakingAccountConfirmed' | 'MemberRemarked' | 'MemberCreated';
  }

  /** @name PalletMembershipBuyMembershipParameters (70) */
  export interface PalletMembershipBuyMembershipParameters extends Struct {
    readonly rootAccount: AccountId32;
    readonly controllerAccount: AccountId32;
    readonly handle: Option<Bytes>;
    readonly metadata: Bytes;
    readonly referrerId: Option<u64>;
  }

  /** @name PalletMembershipInviteMembershipParameters (73) */
  export interface PalletMembershipInviteMembershipParameters extends Struct {
    readonly invitingMemberId: u64;
    readonly rootAccount: AccountId32;
    readonly controllerAccount: AccountId32;
    readonly handle: Option<Bytes>;
    readonly metadata: Bytes;
  }

  /** @name PalletMembershipCreateMemberParameters (74) */
  export interface PalletMembershipCreateMemberParameters extends Struct {
    readonly rootAccount: AccountId32;
    readonly controllerAccount: AccountId32;
    readonly handle: Bytes;
    readonly metadata: Bytes;
    readonly isFoundingMember: bool;
  }

  /** @name PalletMembershipGiftMembershipParameters (75) */
  export interface PalletMembershipGiftMembershipParameters extends Struct {
    readonly rootAccount: AccountId32;
    readonly controllerAccount: AccountId32;
    readonly handle: Option<Bytes>;
    readonly metadata: Bytes;
    readonly creditControllerAccount: u128;
    readonly applyControllerAccountInvitationLock: Option<u128>;
    readonly creditRootAccount: u128;
    readonly applyRootAccountInvitationLock: Option<u128>;
  }

  /** @name PalletForumRawEvent (77) */
  export interface PalletForumRawEvent extends Enum {
    readonly isCategoryCreated: boolean;
    readonly asCategoryCreated: ITuple<[u64, Option<u64>, Bytes, Bytes]>;
    readonly isCategoryArchivalStatusUpdated: boolean;
    readonly asCategoryArchivalStatusUpdated: ITuple<[u64, bool, PalletForumPrivilegedActor]>;
    readonly isCategoryTitleUpdated: boolean;
    readonly asCategoryTitleUpdated: ITuple<[u64, H256, PalletForumPrivilegedActor]>;
    readonly isCategoryDescriptionUpdated: boolean;
    readonly asCategoryDescriptionUpdated: ITuple<[u64, H256, PalletForumPrivilegedActor]>;
    readonly isCategoryDeleted: boolean;
    readonly asCategoryDeleted: ITuple<[u64, PalletForumPrivilegedActor]>;
    readonly isThreadCreated: boolean;
    readonly asThreadCreated: ITuple<[u64, u64, u64, u64, Bytes, Bytes]>;
    readonly isThreadModerated: boolean;
    readonly asThreadModerated: ITuple<[u64, Bytes, PalletForumPrivilegedActor, u64]>;
    readonly isThreadUpdated: boolean;
    readonly asThreadUpdated: ITuple<[u64, bool, PalletForumPrivilegedActor, u64]>;
    readonly isThreadMetadataUpdated: boolean;
    readonly asThreadMetadataUpdated: ITuple<[u64, u64, u64, Bytes]>;
    readonly isThreadDeleted: boolean;
    readonly asThreadDeleted: ITuple<[u64, u64, u64, bool]>;
    readonly isThreadMoved: boolean;
    readonly asThreadMoved: ITuple<[u64, u64, PalletForumPrivilegedActor, u64]>;
    readonly isPostAdded: boolean;
    readonly asPostAdded: ITuple<[u64, u64, u64, u64, Bytes, bool]>;
    readonly isPostModerated: boolean;
    readonly asPostModerated: ITuple<[u64, Bytes, PalletForumPrivilegedActor, u64, u64]>;
    readonly isPostDeleted: boolean;
    readonly asPostDeleted: ITuple<[Bytes, u64, BTreeMap<PalletForumExtendedPostIdObject, bool>]>;
    readonly isPostTextUpdated: boolean;
    readonly asPostTextUpdated: ITuple<[u64, u64, u64, u64, Bytes]>;
    readonly isCategoryStickyThreadUpdate: boolean;
    readonly asCategoryStickyThreadUpdate: ITuple<[u64, BTreeSet<u64>, PalletForumPrivilegedActor]>;
    readonly isCategoryMembershipOfModeratorUpdated: boolean;
    readonly asCategoryMembershipOfModeratorUpdated: ITuple<[u64, u64, bool]>;
    readonly type: 'CategoryCreated' | 'CategoryArchivalStatusUpdated' | 'CategoryTitleUpdated' | 'CategoryDescriptionUpdated' | 'CategoryDeleted' | 'ThreadCreated' | 'ThreadModerated' | 'ThreadUpdated' | 'ThreadMetadataUpdated' | 'ThreadDeleted' | 'ThreadMoved' | 'PostAdded' | 'PostModerated' | 'PostDeleted' | 'PostTextUpdated' | 'CategoryStickyThreadUpdate' | 'CategoryMembershipOfModeratorUpdated';
  }

  /** @name PalletForumPrivilegedActor (78) */
  export interface PalletForumPrivilegedActor extends Enum {
    readonly isLead: boolean;
    readonly isModerator: boolean;
    readonly asModerator: u64;
    readonly type: 'Lead' | 'Moderator';
  }

  /** @name PalletForumExtendedPostIdObject (79) */
  export interface PalletForumExtendedPostIdObject extends Struct {
    readonly categoryId: u64;
    readonly threadId: u64;
    readonly postId: u64;
  }

  /** @name PalletConstitutionRawEvent (84) */
  export interface PalletConstitutionRawEvent extends Enum {
    readonly isConstutionAmended: boolean;
    readonly asConstutionAmended: ITuple<[H256, Bytes]>;
    readonly type: 'ConstutionAmended';
  }

  /** @name PalletBountyRawEvent (85) */
  export interface PalletBountyRawEvent extends Enum {
    readonly isBountyCreated: boolean;
    readonly asBountyCreated: ITuple<[u64, PalletBountyBountyParametersBTreeSet, Bytes]>;
    readonly isBountyOracleSwitched: boolean;
    readonly asBountyOracleSwitched: ITuple<[u64, PalletBountyBountyActor, PalletBountyBountyActor, PalletBountyBountyActor]>;
    readonly isBountyTerminated: boolean;
    readonly asBountyTerminated: ITuple<[u64, PalletBountyBountyActor, PalletBountyBountyActor, PalletBountyBountyActor]>;
    readonly isBountyFunded: boolean;
    readonly asBountyFunded: ITuple<[u64, PalletBountyBountyActor, u128]>;
    readonly isBountyMaxFundingReached: boolean;
    readonly asBountyMaxFundingReached: u64;
    readonly isBountyFundingWithdrawal: boolean;
    readonly asBountyFundingWithdrawal: ITuple<[u64, PalletBountyBountyActor]>;
    readonly isBountyCreatorCherryWithdrawal: boolean;
    readonly asBountyCreatorCherryWithdrawal: ITuple<[u64, PalletBountyBountyActor]>;
    readonly isBountyCreatorOracleRewardWithdrawal: boolean;
    readonly asBountyCreatorOracleRewardWithdrawal: ITuple<[u64, PalletBountyBountyActor]>;
    readonly isBountyOracleRewardWithdrawal: boolean;
    readonly asBountyOracleRewardWithdrawal: ITuple<[u64, PalletBountyBountyActor, u128]>;
    readonly isBountyRemoved: boolean;
    readonly asBountyRemoved: u64;
    readonly isWorkEntryAnnounced: boolean;
    readonly asWorkEntryAnnounced: ITuple<[u64, u64, u64, AccountId32, Bytes]>;
    readonly isWorkSubmitted: boolean;
    readonly asWorkSubmitted: ITuple<[u64, u64, u64, Bytes]>;
    readonly isOracleJudgmentSubmitted: boolean;
    readonly asOracleJudgmentSubmitted: ITuple<[u64, PalletBountyBountyActor, BTreeMap<u64, PalletBountyOracleWorkEntryJudgment>, Bytes]>;
    readonly isWorkEntrantFundsWithdrawn: boolean;
    readonly asWorkEntrantFundsWithdrawn: ITuple<[u64, u64, u64]>;
    readonly isBountyContributorRemarked: boolean;
    readonly asBountyContributorRemarked: ITuple<[PalletBountyBountyActor, u64, Bytes]>;
    readonly isBountyOracleRemarked: boolean;
    readonly asBountyOracleRemarked: ITuple<[PalletBountyBountyActor, u64, Bytes]>;
    readonly isBountyEntrantRemarked: boolean;
    readonly asBountyEntrantRemarked: ITuple<[u64, u64, u64, Bytes]>;
    readonly isBountyCreatorRemarked: boolean;
    readonly asBountyCreatorRemarked: ITuple<[PalletBountyBountyActor, u64, Bytes]>;
    readonly isWorkSubmissionPeriodEnded: boolean;
    readonly asWorkSubmissionPeriodEnded: ITuple<[u64, PalletBountyBountyActor]>;
    readonly isWorkEntrantStakeUnlocked: boolean;
    readonly asWorkEntrantStakeUnlocked: ITuple<[u64, u64, AccountId32]>;
    readonly isWorkEntrantStakeSlashed: boolean;
    readonly asWorkEntrantStakeSlashed: ITuple<[u64, u64, AccountId32, u128]>;
    readonly isFunderStateBloatBondWithdrawn: boolean;
    readonly asFunderStateBloatBondWithdrawn: ITuple<[u64, PalletBountyBountyActor, u128]>;
    readonly isCreatorStateBloatBondWithdrawn: boolean;
    readonly asCreatorStateBloatBondWithdrawn: ITuple<[u64, PalletBountyBountyActor, u128]>;
    readonly type: 'BountyCreated' | 'BountyOracleSwitched' | 'BountyTerminated' | 'BountyFunded' | 'BountyMaxFundingReached' | 'BountyFundingWithdrawal' | 'BountyCreatorCherryWithdrawal' | 'BountyCreatorOracleRewardWithdrawal' | 'BountyOracleRewardWithdrawal' | 'BountyRemoved' | 'WorkEntryAnnounced' | 'WorkSubmitted' | 'OracleJudgmentSubmitted' | 'WorkEntrantFundsWithdrawn' | 'BountyContributorRemarked' | 'BountyOracleRemarked' | 'BountyEntrantRemarked' | 'BountyCreatorRemarked' | 'WorkSubmissionPeriodEnded' | 'WorkEntrantStakeUnlocked' | 'WorkEntrantStakeSlashed' | 'FunderStateBloatBondWithdrawn' | 'CreatorStateBloatBondWithdrawn';
  }

  /** @name PalletBountyBountyParametersBTreeSet (86) */
  export interface PalletBountyBountyParametersBTreeSet extends Struct {
    readonly oracle: PalletBountyBountyActor;
    readonly contractType: PalletBountyAssuranceContractTypeBTreeSet;
    readonly creator: PalletBountyBountyActor;
    readonly cherry: u128;
    readonly oracleReward: u128;
    readonly entrantStake: u128;
    readonly fundingType: PalletBountyFundingType;
  }

  /** @name PalletBountyBountyActor (87) */
  export interface PalletBountyBountyActor extends Enum {
    readonly isCouncil: boolean;
    readonly isMember: boolean;
    readonly asMember: u64;
    readonly type: 'Council' | 'Member';
  }

  /** @name PalletBountyAssuranceContractTypeBTreeSet (88) */
  export interface PalletBountyAssuranceContractTypeBTreeSet extends Enum {
    readonly isOpen: boolean;
    readonly isClosed: boolean;
    readonly asClosed: BTreeSet<u64>;
    readonly type: 'Open' | 'Closed';
  }

  /** @name PalletBountyFundingType (89) */
  export interface PalletBountyFundingType extends Enum {
    readonly isPerpetual: boolean;
    readonly asPerpetual: {
      readonly target: u128;
    } & Struct;
    readonly isLimited: boolean;
    readonly asLimited: {
      readonly target: u128;
      readonly fundingPeriod: u32;
    } & Struct;
    readonly type: 'Perpetual' | 'Limited';
  }

  /** @name PalletBountyOracleWorkEntryJudgment (91) */
  export interface PalletBountyOracleWorkEntryJudgment extends Enum {
    readonly isWinner: boolean;
    readonly asWinner: {
      readonly reward: u128;
    } & Struct;
    readonly isRejected: boolean;
    readonly asRejected: {
      readonly slashingShare: Perbill;
      readonly actionJustification: Bytes;
    } & Struct;
    readonly type: 'Winner' | 'Rejected';
  }

  /** @name PalletUtilityRawEvent (94) */
  export interface PalletUtilityRawEvent extends Enum {
    readonly isSignaled: boolean;
    readonly asSignaled: Bytes;
    readonly isRuntimeUpgraded: boolean;
    readonly asRuntimeUpgraded: Bytes;
    readonly isUpdatedWorkingGroupBudget: boolean;
    readonly asUpdatedWorkingGroupBudget: ITuple<[PalletCommonWorkingGroupIterableEnumsWorkingGroup, u128, PalletCommonBalanceKind]>;
    readonly isTokensBurned: boolean;
    readonly asTokensBurned: ITuple<[AccountId32, u128]>;
    readonly type: 'Signaled' | 'RuntimeUpgraded' | 'UpdatedWorkingGroupBudget' | 'TokensBurned';
  }

  /** @name PalletCommonWorkingGroupIterableEnumsWorkingGroup (95) */
  export interface PalletCommonWorkingGroupIterableEnumsWorkingGroup extends Enum {
    readonly isForum: boolean;
    readonly isStorage: boolean;
    readonly isContent: boolean;
    readonly isOperationsAlpha: boolean;
    readonly isGateway: boolean;
    readonly isDistribution: boolean;
    readonly isOperationsBeta: boolean;
    readonly isOperationsGamma: boolean;
    readonly isMembership: boolean;
    readonly type: 'Forum' | 'Storage' | 'Content' | 'OperationsAlpha' | 'Gateway' | 'Distribution' | 'OperationsBeta' | 'OperationsGamma' | 'Membership';
  }

  /** @name PalletCommonBalanceKind (96) */
  export interface PalletCommonBalanceKind extends Enum {
    readonly isPositive: boolean;
    readonly isNegative: boolean;
    readonly type: 'Positive' | 'Negative';
  }

  /** @name PalletContentRawEvent (97) */
  export interface PalletContentRawEvent extends Enum {
    readonly isCuratorGroupCreated: boolean;
    readonly asCuratorGroupCreated: u64;
    readonly isCuratorGroupPermissionsUpdated: boolean;
    readonly asCuratorGroupPermissionsUpdated: ITuple<[u64, BTreeMap<u8, BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsContentModerationAction>>]>;
    readonly isCuratorGroupStatusSet: boolean;
    readonly asCuratorGroupStatusSet: ITuple<[u64, bool]>;
    readonly isCuratorAdded: boolean;
    readonly asCuratorAdded: ITuple<[u64, u64, BTreeSet<PalletContentIterableEnumsChannelActionPermission>]>;
    readonly isCuratorRemoved: boolean;
    readonly asCuratorRemoved: ITuple<[u64, u64]>;
    readonly isChannelCreated: boolean;
    readonly asChannelCreated: ITuple<[u64, PalletContentChannelRecord, PalletContentChannelCreationParametersRecord, AccountId32]>;
    readonly isChannelUpdated: boolean;
    readonly asChannelUpdated: ITuple<[PalletContentPermissionsContentActor, u64, PalletContentChannelUpdateParametersRecord, BTreeSet<u64>]>;
    readonly isChannelPrivilegeLevelUpdated: boolean;
    readonly asChannelPrivilegeLevelUpdated: ITuple<[u64, u8]>;
    readonly isChannelStateBloatBondValueUpdated: boolean;
    readonly asChannelStateBloatBondValueUpdated: u128;
    readonly isVideoStateBloatBondValueUpdated: boolean;
    readonly asVideoStateBloatBondValueUpdated: u128;
    readonly isChannelAssetsRemoved: boolean;
    readonly asChannelAssetsRemoved: ITuple<[PalletContentPermissionsContentActor, u64, BTreeSet<u64>, PalletContentChannelRecord]>;
    readonly isChannelDeleted: boolean;
    readonly asChannelDeleted: ITuple<[PalletContentPermissionsContentActor, u64]>;
    readonly isChannelDeletedByModerator: boolean;
    readonly asChannelDeletedByModerator: ITuple<[PalletContentPermissionsContentActor, u64, Bytes]>;
    readonly isChannelVisibilitySetByModerator: boolean;
    readonly asChannelVisibilitySetByModerator: ITuple<[PalletContentPermissionsContentActor, u64, bool, Bytes]>;
    readonly isChannelPausedFeaturesUpdatedByModerator: boolean;
    readonly asChannelPausedFeaturesUpdatedByModerator: ITuple<[PalletContentPermissionsContentActor, u64, BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsPausableChannelFeature>, Bytes]>;
    readonly isChannelAssetsDeletedByModerator: boolean;
    readonly asChannelAssetsDeletedByModerator: ITuple<[PalletContentPermissionsContentActor, u64, BTreeSet<u64>, Bytes]>;
    readonly isChannelFundsWithdrawn: boolean;
    readonly asChannelFundsWithdrawn: ITuple<[PalletContentPermissionsContentActor, u64, u128, PalletContentChannelFundsDestination]>;
    readonly isChannelRewardClaimedAndWithdrawn: boolean;
    readonly asChannelRewardClaimedAndWithdrawn: ITuple<[PalletContentPermissionsContentActor, u64, u128, PalletContentChannelFundsDestination]>;
    readonly isVideoCreated: boolean;
    readonly asVideoCreated: ITuple<[PalletContentPermissionsContentActor, u64, u64, PalletContentVideoCreationParametersRecord, BTreeSet<u64>]>;
    readonly isVideoUpdated: boolean;
    readonly asVideoUpdated: ITuple<[PalletContentPermissionsContentActor, u64, PalletContentVideoUpdateParametersRecord, BTreeSet<u64>]>;
    readonly isVideoDeleted: boolean;
    readonly asVideoDeleted: ITuple<[PalletContentPermissionsContentActor, u64]>;
    readonly isVideoDeletedByModerator: boolean;
    readonly asVideoDeletedByModerator: ITuple<[PalletContentPermissionsContentActor, u64, Bytes]>;
    readonly isVideoVisibilitySetByModerator: boolean;
    readonly asVideoVisibilitySetByModerator: ITuple<[PalletContentPermissionsContentActor, u64, bool, Bytes]>;
    readonly isVideoAssetsDeletedByModerator: boolean;
    readonly asVideoAssetsDeletedByModerator: ITuple<[PalletContentPermissionsContentActor, u64, BTreeSet<u64>, bool, Bytes]>;
    readonly isChannelPayoutsUpdated: boolean;
    readonly asChannelPayoutsUpdated: ITuple<[PalletContentUpdateChannelPayoutsParametersRecord, Option<u64>]>;
    readonly isChannelRewardUpdated: boolean;
    readonly asChannelRewardUpdated: ITuple<[u128, u64]>;
    readonly isCouncilRewardClaimed: boolean;
    readonly asCouncilRewardClaimed: ITuple<[u64, u128]>;
    readonly isEnglishAuctionStarted: boolean;
    readonly asEnglishAuctionStarted: ITuple<[PalletContentPermissionsContentActor, u64, PalletContentNftTypesEnglishAuctionParamsRecord]>;
    readonly isOpenAuctionStarted: boolean;
    readonly asOpenAuctionStarted: ITuple<[PalletContentPermissionsContentActor, u64, PalletContentNftTypesOpenAuctionParamsRecord, u64]>;
    readonly isNftIssued: boolean;
    readonly asNftIssued: ITuple<[PalletContentPermissionsContentActor, u64, PalletContentNftTypesNftIssuanceParametersRecord]>;
    readonly isNftDestroyed: boolean;
    readonly asNftDestroyed: ITuple<[PalletContentPermissionsContentActor, u64]>;
    readonly isAuctionBidMade: boolean;
    readonly asAuctionBidMade: ITuple<[u64, u64, u128, Option<u64>]>;
    readonly isAuctionBidCanceled: boolean;
    readonly asAuctionBidCanceled: ITuple<[u64, u64]>;
    readonly isAuctionCanceled: boolean;
    readonly asAuctionCanceled: ITuple<[PalletContentPermissionsContentActor, u64]>;
    readonly isEnglishAuctionSettled: boolean;
    readonly asEnglishAuctionSettled: ITuple<[u64, AccountId32, u64]>;
    readonly isBidMadeCompletingAuction: boolean;
    readonly asBidMadeCompletingAuction: ITuple<[u64, u64, Option<u64>]>;
    readonly isOpenAuctionBidAccepted: boolean;
    readonly asOpenAuctionBidAccepted: ITuple<[PalletContentPermissionsContentActor, u64, u64, u128]>;
    readonly isOfferStarted: boolean;
    readonly asOfferStarted: ITuple<[u64, PalletContentPermissionsContentActor, u64, Option<u128>]>;
    readonly isOfferAccepted: boolean;
    readonly asOfferAccepted: u64;
    readonly isOfferCanceled: boolean;
    readonly asOfferCanceled: ITuple<[u64, PalletContentPermissionsContentActor]>;
    readonly isNftSellOrderMade: boolean;
    readonly asNftSellOrderMade: ITuple<[u64, PalletContentPermissionsContentActor, u128]>;
    readonly isNftBought: boolean;
    readonly asNftBought: ITuple<[u64, u64]>;
    readonly isBuyNowCanceled: boolean;
    readonly asBuyNowCanceled: ITuple<[u64, PalletContentPermissionsContentActor]>;
    readonly isBuyNowPriceUpdated: boolean;
    readonly asBuyNowPriceUpdated: ITuple<[u64, PalletContentPermissionsContentActor, u128]>;
    readonly isNftSlingedBackToTheOriginalArtist: boolean;
    readonly asNftSlingedBackToTheOriginalArtist: ITuple<[u64, PalletContentPermissionsContentActor]>;
    readonly isChannelOwnerRemarked: boolean;
    readonly asChannelOwnerRemarked: ITuple<[u64, Bytes]>;
    readonly isChannelAgentRemarked: boolean;
    readonly asChannelAgentRemarked: ITuple<[PalletContentPermissionsContentActor, u64, Bytes]>;
    readonly isNftOwnerRemarked: boolean;
    readonly asNftOwnerRemarked: ITuple<[PalletContentPermissionsContentActor, u64, Bytes]>;
    readonly isInitializedChannelTransfer: boolean;
    readonly asInitializedChannelTransfer: ITuple<[u64, PalletContentPermissionsContentActor, PalletContentPendingTransfer]>;
    readonly isCancelChannelTransfer: boolean;
    readonly asCancelChannelTransfer: ITuple<[u64, PalletContentPermissionsContentActor]>;
    readonly isChannelTransferAccepted: boolean;
    readonly asChannelTransferAccepted: ITuple<[u64, PalletContentTransferCommitmentParametersBTreeMap]>;
    readonly isGlobalNftLimitUpdated: boolean;
    readonly asGlobalNftLimitUpdated: ITuple<[PalletContentNftLimitPeriod, u64]>;
    readonly isChannelNftLimitUpdated: boolean;
    readonly asChannelNftLimitUpdated: ITuple<[PalletContentPermissionsContentActor, PalletContentNftLimitPeriod, u64, u64]>;
    readonly isToggledNftLimits: boolean;
    readonly asToggledNftLimits: bool;
    readonly isCreatorTokenIssued: boolean;
    readonly asCreatorTokenIssued: ITuple<[PalletContentPermissionsContentActor, u64, u64]>;
    readonly type: 'CuratorGroupCreated' | 'CuratorGroupPermissionsUpdated' | 'CuratorGroupStatusSet' | 'CuratorAdded' | 'CuratorRemoved' | 'ChannelCreated' | 'ChannelUpdated' | 'ChannelPrivilegeLevelUpdated' | 'ChannelStateBloatBondValueUpdated' | 'VideoStateBloatBondValueUpdated' | 'ChannelAssetsRemoved' | 'ChannelDeleted' | 'ChannelDeletedByModerator' | 'ChannelVisibilitySetByModerator' | 'ChannelPausedFeaturesUpdatedByModerator' | 'ChannelAssetsDeletedByModerator' | 'ChannelFundsWithdrawn' | 'ChannelRewardClaimedAndWithdrawn' | 'VideoCreated' | 'VideoUpdated' | 'VideoDeleted' | 'VideoDeletedByModerator' | 'VideoVisibilitySetByModerator' | 'VideoAssetsDeletedByModerator' | 'ChannelPayoutsUpdated' | 'ChannelRewardUpdated' | 'CouncilRewardClaimed' | 'EnglishAuctionStarted' | 'OpenAuctionStarted' | 'NftIssued' | 'NftDestroyed' | 'AuctionBidMade' | 'AuctionBidCanceled' | 'AuctionCanceled' | 'EnglishAuctionSettled' | 'BidMadeCompletingAuction' | 'OpenAuctionBidAccepted' | 'OfferStarted' | 'OfferAccepted' | 'OfferCanceled' | 'NftSellOrderMade' | 'NftBought' | 'BuyNowCanceled' | 'BuyNowPriceUpdated' | 'NftSlingedBackToTheOriginalArtist' | 'ChannelOwnerRemarked' | 'ChannelAgentRemarked' | 'NftOwnerRemarked' | 'InitializedChannelTransfer' | 'CancelChannelTransfer' | 'ChannelTransferAccepted' | 'GlobalNftLimitUpdated' | 'ChannelNftLimitUpdated' | 'ToggledNftLimits' | 'CreatorTokenIssued';
  }

  /** @name PalletContentPermissionsContentActor (98) */
  export interface PalletContentPermissionsContentActor extends Enum {
    readonly isCurator: boolean;
    readonly asCurator: ITuple<[u64, u64]>;
    readonly isMember: boolean;
    readonly asMember: u64;
    readonly isLead: boolean;
    readonly type: 'Curator' | 'Member' | 'Lead';
  }

  /** @name PalletContentChannelRecord (99) */
  export interface PalletContentChannelRecord extends Struct {
    readonly owner: PalletContentChannelOwner;
    readonly numVideos: u64;
    readonly collaborators: BTreeMap<u64, BTreeSet<PalletContentIterableEnumsChannelActionPermission>>;
    readonly cumulativeRewardClaimed: u128;
    readonly privilegeLevel: u8;
    readonly pausedFeatures: BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsPausableChannelFeature>;
    readonly transferStatus: PalletContentChannelTransferStatus;
    readonly dataObjects: BTreeSet<u64>;
    readonly dailyNftLimit: PalletContentLimitPerPeriod;
    readonly weeklyNftLimit: PalletContentLimitPerPeriod;
    readonly dailyNftCounter: PalletContentNftCounter;
    readonly weeklyNftCounter: PalletContentNftCounter;
    readonly creatorTokenId: Option<u64>;
    readonly channelStateBloatBond: PalletCommonBloatBondRepayableBloatBond;
  }

  /** @name PalletContentIterableEnumsChannelActionPermission (103) */
  export interface PalletContentIterableEnumsChannelActionPermission extends Enum {
    readonly isUpdateChannelMetadata: boolean;
    readonly isManageNonVideoChannelAssets: boolean;
    readonly isManageChannelCollaborators: boolean;
    readonly isUpdateVideoMetadata: boolean;
    readonly isAddVideo: boolean;
    readonly isManageVideoAssets: boolean;
    readonly isDeleteChannel: boolean;
    readonly isDeleteVideo: boolean;
    readonly isManageVideoNfts: boolean;
    readonly isAgentRemark: boolean;
    readonly isTransferChannel: boolean;
    readonly isClaimChannelReward: boolean;
    readonly isWithdrawFromChannelBalance: boolean;
    readonly isIssueCreatorToken: boolean;
    readonly isClaimCreatorTokenPatronage: boolean;
    readonly isInitAndManageCreatorTokenSale: boolean;
    readonly isCreatorTokenIssuerTransfer: boolean;
    readonly isMakeCreatorTokenPermissionless: boolean;
    readonly isReduceCreatorTokenPatronageRate: boolean;
    readonly isManageRevenueSplits: boolean;
    readonly isDeissueCreatorToken: boolean;
    readonly type: 'UpdateChannelMetadata' | 'ManageNonVideoChannelAssets' | 'ManageChannelCollaborators' | 'UpdateVideoMetadata' | 'AddVideo' | 'ManageVideoAssets' | 'DeleteChannel' | 'DeleteVideo' | 'ManageVideoNfts' | 'AgentRemark' | 'TransferChannel' | 'ClaimChannelReward' | 'WithdrawFromChannelBalance' | 'IssueCreatorToken' | 'ClaimCreatorTokenPatronage' | 'InitAndManageCreatorTokenSale' | 'CreatorTokenIssuerTransfer' | 'MakeCreatorTokenPermissionless' | 'ReduceCreatorTokenPatronageRate' | 'ManageRevenueSplits' | 'DeissueCreatorToken';
  }

  /** @name PalletContentPermissionsCuratorGroupIterableEnumsPausableChannelFeature (110) */
  export interface PalletContentPermissionsCuratorGroupIterableEnumsPausableChannelFeature extends Enum {
    readonly isChannelFundsTransfer: boolean;
    readonly isCreatorCashout: boolean;
    readonly isVideoNftIssuance: boolean;
    readonly isVideoCreation: boolean;
    readonly isVideoUpdate: boolean;
    readonly isChannelUpdate: boolean;
    readonly isCreatorTokenIssuance: boolean;
    readonly type: 'ChannelFundsTransfer' | 'CreatorCashout' | 'VideoNftIssuance' | 'VideoCreation' | 'VideoUpdate' | 'ChannelUpdate' | 'CreatorTokenIssuance';
  }

  /** @name PalletCommonBloatBondRepayableBloatBond (113) */
  export interface PalletCommonBloatBondRepayableBloatBond extends Struct {
    readonly repaymentRestrictedTo: Option<AccountId32>;
    readonly amount: u128;
  }

  /** @name PalletContentChannelOwner (114) */
  export interface PalletContentChannelOwner extends Enum {
    readonly isMember: boolean;
    readonly asMember: u64;
    readonly isCuratorGroup: boolean;
    readonly asCuratorGroup: u64;
    readonly type: 'Member' | 'CuratorGroup';
  }

  /** @name PalletContentChannelTransferStatus (115) */
  export interface PalletContentChannelTransferStatus extends Enum {
    readonly isNoActiveTransfer: boolean;
    readonly isPendingTransfer: boolean;
    readonly asPendingTransfer: PalletContentPendingTransfer;
    readonly type: 'NoActiveTransfer' | 'PendingTransfer';
  }

  /** @name PalletContentPendingTransfer (116) */
  export interface PalletContentPendingTransfer extends Struct {
    readonly newOwner: PalletContentChannelOwner;
    readonly transferParams: PalletContentTransferCommitmentParametersBoundedBTreeMap;
  }

  /** @name PalletContentTransferCommitmentParametersBoundedBTreeMap (117) */
  export interface PalletContentTransferCommitmentParametersBoundedBTreeMap extends Struct {
    readonly newCollaborators: BTreeMap<u64, BTreeSet<PalletContentIterableEnumsChannelActionPermission>>;
    readonly price: u128;
    readonly transferId: u64;
  }

  /** @name PalletContentLimitPerPeriod (118) */
  export interface PalletContentLimitPerPeriod extends Struct {
    readonly limit: u64;
    readonly blockNumberPeriod: u32;
  }

  /** @name PalletContentNftCounter (119) */
  export interface PalletContentNftCounter extends Struct {
    readonly counter: u64;
    readonly lastUpdated: u32;
  }

  /** @name PalletContentNftTypesEnglishAuctionParamsRecord (120) */
  export interface PalletContentNftTypesEnglishAuctionParamsRecord extends Struct {
    readonly startingPrice: u128;
    readonly buyNowPrice: Option<u128>;
    readonly whitelist: BTreeSet<u64>;
    readonly startsAt: Option<u32>;
    readonly duration: u32;
    readonly extensionPeriod: u32;
    readonly minBidStep: u128;
  }

  /** @name PalletContentNftTypesOpenAuctionParamsRecord (122) */
  export interface PalletContentNftTypesOpenAuctionParamsRecord extends Struct {
    readonly startingPrice: u128;
    readonly buyNowPrice: Option<u128>;
    readonly startsAt: Option<u32>;
    readonly whitelist: BTreeSet<u64>;
    readonly bidLockDuration: u32;
  }

  /** @name PalletContentNftTypesNftIssuanceParametersRecord (123) */
  export interface PalletContentNftTypesNftIssuanceParametersRecord extends Struct {
    readonly royalty: Option<Perbill>;
    readonly nftMetadata: Bytes;
    readonly nonChannelOwner: Option<u64>;
    readonly initTransactionalStatus: PalletContentNftTypesInitTransactionalStatusRecord;
  }

  /** @name PalletContentNftTypesInitTransactionalStatusRecord (124) */
  export interface PalletContentNftTypesInitTransactionalStatusRecord extends Enum {
    readonly isIdle: boolean;
    readonly isBuyNow: boolean;
    readonly asBuyNow: u128;
    readonly isInitiatedOfferToMember: boolean;
    readonly asInitiatedOfferToMember: ITuple<[u64, Option<u128>]>;
    readonly isEnglishAuction: boolean;
    readonly asEnglishAuction: PalletContentNftTypesEnglishAuctionParamsRecord;
    readonly isOpenAuction: boolean;
    readonly asOpenAuction: PalletContentNftTypesOpenAuctionParamsRecord;
    readonly type: 'Idle' | 'BuyNow' | 'InitiatedOfferToMember' | 'EnglishAuction' | 'OpenAuction';
  }

  /** @name PalletContentChannelCreationParametersRecord (126) */
  export interface PalletContentChannelCreationParametersRecord extends Struct {
    readonly assets: Option<PalletContentStorageAssetsRecord>;
    readonly meta: Option<Bytes>;
    readonly collaborators: BTreeMap<u64, BTreeSet<PalletContentIterableEnumsChannelActionPermission>>;
    readonly storageBuckets: BTreeSet<u64>;
    readonly distributionBuckets: BTreeSet<PalletStorageDistributionBucketIdRecord>;
    readonly expectedChannelStateBloatBond: u128;
    readonly expectedDataObjectStateBloatBond: u128;
  }

  /** @name PalletContentStorageAssetsRecord (127) */
  export interface PalletContentStorageAssetsRecord extends Struct {
    readonly objectCreationList: Vec<PalletStorageDataObjectCreationParameters>;
    readonly expectedDataSizeFee: u128;
  }

  /** @name PalletStorageDataObjectCreationParameters (129) */
  export interface PalletStorageDataObjectCreationParameters extends Struct {
    readonly size_: u64;
    readonly ipfsContentId: Bytes;
  }

  /** @name PalletStorageDistributionBucketIdRecord (130) */
  export interface PalletStorageDistributionBucketIdRecord extends Struct {
    readonly distributionBucketFamilyId: u64;
    readonly distributionBucketIndex: u64;
  }

  /** @name PalletContentChannelUpdateParametersRecord (137) */
  export interface PalletContentChannelUpdateParametersRecord extends Struct {
    readonly assetsToUpload: Option<PalletContentStorageAssetsRecord>;
    readonly newMeta: Option<Bytes>;
    readonly assetsToRemove: BTreeSet<u64>;
    readonly collaborators: Option<BTreeMap<u64, BTreeSet<PalletContentIterableEnumsChannelActionPermission>>>;
    readonly expectedDataObjectStateBloatBond: u128;
    readonly storageBucketsNumWitness: Option<u32>;
  }

  /** @name PalletContentVideoCreationParametersRecord (139) */
  export interface PalletContentVideoCreationParametersRecord extends Struct {
    readonly assets: Option<PalletContentStorageAssetsRecord>;
    readonly meta: Option<Bytes>;
    readonly autoIssueNft: Option<PalletContentNftTypesNftIssuanceParametersRecord>;
    readonly expectedVideoStateBloatBond: u128;
    readonly expectedDataObjectStateBloatBond: u128;
    readonly storageBucketsNumWitness: u32;
  }

  /** @name PalletContentVideoUpdateParametersRecord (141) */
  export interface PalletContentVideoUpdateParametersRecord extends Struct {
    readonly assetsToUpload: Option<PalletContentStorageAssetsRecord>;
    readonly newMeta: Option<Bytes>;
    readonly assetsToRemove: BTreeSet<u64>;
    readonly autoIssueNft: Option<PalletContentNftTypesNftIssuanceParametersRecord>;
    readonly expectedDataObjectStateBloatBond: u128;
    readonly storageBucketsNumWitness: Option<u32>;
  }

  /** @name PalletContentPermissionsCuratorGroupIterableEnumsContentModerationAction (144) */
  export interface PalletContentPermissionsCuratorGroupIterableEnumsContentModerationAction extends Enum {
    readonly isHideVideo: boolean;
    readonly isHideChannel: boolean;
    readonly isChangeChannelFeatureStatus: boolean;
    readonly asChangeChannelFeatureStatus: PalletContentPermissionsCuratorGroupIterableEnumsPausableChannelFeature;
    readonly isDeleteVideo: boolean;
    readonly isDeleteChannel: boolean;
    readonly isDeleteVideoAssets: boolean;
    readonly asDeleteVideoAssets: bool;
    readonly isDeleteNonVideoChannelAssets: boolean;
    readonly isUpdateChannelNftLimits: boolean;
    readonly type: 'HideVideo' | 'HideChannel' | 'ChangeChannelFeatureStatus' | 'DeleteVideo' | 'DeleteChannel' | 'DeleteVideoAssets' | 'DeleteNonVideoChannelAssets' | 'UpdateChannelNftLimits';
  }

  /** @name PalletContentTransferCommitmentParametersBTreeMap (148) */
  export interface PalletContentTransferCommitmentParametersBTreeMap extends Struct {
    readonly newCollaborators: BTreeMap<u64, BTreeSet<PalletContentIterableEnumsChannelActionPermission>>;
    readonly price: u128;
    readonly transferId: u64;
  }

  /** @name PalletContentUpdateChannelPayoutsParametersRecord (149) */
  export interface PalletContentUpdateChannelPayoutsParametersRecord extends Struct {
    readonly commitment: Option<H256>;
    readonly payload: Option<PalletContentChannelPayoutsPayloadParametersRecord>;
    readonly minCashoutAllowed: Option<u128>;
    readonly maxCashoutAllowed: Option<u128>;
    readonly channelCashoutsEnabled: Option<bool>;
  }

  /** @name PalletContentChannelPayoutsPayloadParametersRecord (150) */
  export interface PalletContentChannelPayoutsPayloadParametersRecord extends Struct {
    readonly uploaderAccount: AccountId32;
    readonly objectCreationParams: PalletStorageDataObjectCreationParameters;
    readonly expectedDataSizeFee: u128;
    readonly expectedDataObjectStateBloatBond: u128;
  }

  /** @name PalletContentChannelFundsDestination (154) */
  export interface PalletContentChannelFundsDestination extends Enum {
    readonly isAccountId: boolean;
    readonly asAccountId: AccountId32;
    readonly isCouncilBudget: boolean;
    readonly type: 'AccountId' | 'CouncilBudget';
  }

  /** @name PalletContentNftLimitPeriod (155) */
  export interface PalletContentNftLimitPeriod extends Enum {
    readonly isDaily: boolean;
    readonly isWeekly: boolean;
    readonly type: 'Daily' | 'Weekly';
  }

  /** @name PalletStorageRawEvent (156) */
  export interface PalletStorageRawEvent extends Enum {
    readonly isStorageBucketCreated: boolean;
    readonly asStorageBucketCreated: ITuple<[u64, Option<u64>, bool, u64, u64]>;
    readonly isStorageBucketInvitationAccepted: boolean;
    readonly asStorageBucketInvitationAccepted: ITuple<[u64, u64, AccountId32]>;
    readonly isStorageBucketsUpdatedForBag: boolean;
    readonly asStorageBucketsUpdatedForBag: ITuple<[PalletStorageBagIdType, BTreeSet<u64>, BTreeSet<u64>]>;
    readonly isDataObjectsUploaded: boolean;
    readonly asDataObjectsUploaded: ITuple<[BTreeSet<u64>, PalletStorageUploadParametersRecord, u128]>;
    readonly isStorageOperatorMetadataSet: boolean;
    readonly asStorageOperatorMetadataSet: ITuple<[u64, u64, Bytes]>;
    readonly isStorageBucketVoucherLimitsSet: boolean;
    readonly asStorageBucketVoucherLimitsSet: ITuple<[u64, u64, u64]>;
    readonly isPendingDataObjectsAccepted: boolean;
    readonly asPendingDataObjectsAccepted: ITuple<[u64, u64, PalletStorageBagIdType, BTreeSet<u64>]>;
    readonly isStorageBucketInvitationCancelled: boolean;
    readonly asStorageBucketInvitationCancelled: u64;
    readonly isStorageBucketOperatorInvited: boolean;
    readonly asStorageBucketOperatorInvited: ITuple<[u64, u64]>;
    readonly isStorageBucketOperatorRemoved: boolean;
    readonly asStorageBucketOperatorRemoved: u64;
    readonly isUploadingBlockStatusUpdated: boolean;
    readonly asUploadingBlockStatusUpdated: bool;
    readonly isDataObjectPerMegabyteFeeUpdated: boolean;
    readonly asDataObjectPerMegabyteFeeUpdated: u128;
    readonly isStorageBucketsPerBagLimitUpdated: boolean;
    readonly asStorageBucketsPerBagLimitUpdated: u32;
    readonly isStorageBucketsVoucherMaxLimitsUpdated: boolean;
    readonly asStorageBucketsVoucherMaxLimitsUpdated: ITuple<[u64, u64]>;
    readonly isDataObjectsMoved: boolean;
    readonly asDataObjectsMoved: ITuple<[PalletStorageBagIdType, PalletStorageBagIdType, BTreeSet<u64>]>;
    readonly isDataObjectsDeleted: boolean;
    readonly asDataObjectsDeleted: ITuple<[AccountId32, PalletStorageBagIdType, BTreeSet<u64>]>;
    readonly isStorageBucketStatusUpdated: boolean;
    readonly asStorageBucketStatusUpdated: ITuple<[u64, bool]>;
    readonly isUpdateBlacklist: boolean;
    readonly asUpdateBlacklist: ITuple<[BTreeSet<Bytes>, BTreeSet<Bytes>]>;
    readonly isDynamicBagDeleted: boolean;
    readonly asDynamicBagDeleted: PalletStorageDynamicBagIdType;
    readonly isDynamicBagCreated: boolean;
    readonly asDynamicBagCreated: ITuple<[PalletStorageDynBagCreationParametersRecord, BTreeSet<u64>]>;
    readonly isVoucherChanged: boolean;
    readonly asVoucherChanged: ITuple<[u64, PalletStorageVoucher]>;
    readonly isStorageBucketDeleted: boolean;
    readonly asStorageBucketDeleted: u64;
    readonly isNumberOfStorageBucketsInDynamicBagCreationPolicyUpdated: boolean;
    readonly asNumberOfStorageBucketsInDynamicBagCreationPolicyUpdated: ITuple<[PalletStorageDynamicBagType, u32]>;
    readonly isDistributionBucketFamilyCreated: boolean;
    readonly asDistributionBucketFamilyCreated: u64;
    readonly isDistributionBucketFamilyDeleted: boolean;
    readonly asDistributionBucketFamilyDeleted: u64;
    readonly isDistributionBucketCreated: boolean;
    readonly asDistributionBucketCreated: ITuple<[u64, bool, PalletStorageDistributionBucketIdRecord]>;
    readonly isDistributionBucketStatusUpdated: boolean;
    readonly asDistributionBucketStatusUpdated: ITuple<[PalletStorageDistributionBucketIdRecord, bool]>;
    readonly isDistributionBucketDeleted: boolean;
    readonly asDistributionBucketDeleted: PalletStorageDistributionBucketIdRecord;
    readonly isDistributionBucketsUpdatedForBag: boolean;
    readonly asDistributionBucketsUpdatedForBag: ITuple<[PalletStorageBagIdType, u64, BTreeSet<u64>, BTreeSet<u64>]>;
    readonly isDistributionBucketsPerBagLimitUpdated: boolean;
    readonly asDistributionBucketsPerBagLimitUpdated: u32;
    readonly isDistributionBucketModeUpdated: boolean;
    readonly asDistributionBucketModeUpdated: ITuple<[PalletStorageDistributionBucketIdRecord, bool]>;
    readonly isFamiliesInDynamicBagCreationPolicyUpdated: boolean;
    readonly asFamiliesInDynamicBagCreationPolicyUpdated: ITuple<[PalletStorageDynamicBagType, BTreeMap<u64, u32>]>;
    readonly isDistributionBucketOperatorInvited: boolean;
    readonly asDistributionBucketOperatorInvited: ITuple<[PalletStorageDistributionBucketIdRecord, u64]>;
    readonly isDistributionBucketInvitationCancelled: boolean;
    readonly asDistributionBucketInvitationCancelled: ITuple<[PalletStorageDistributionBucketIdRecord, u64]>;
    readonly isDistributionBucketInvitationAccepted: boolean;
    readonly asDistributionBucketInvitationAccepted: ITuple<[u64, PalletStorageDistributionBucketIdRecord]>;
    readonly isDistributionBucketMetadataSet: boolean;
    readonly asDistributionBucketMetadataSet: ITuple<[u64, PalletStorageDistributionBucketIdRecord, Bytes]>;
    readonly isDistributionBucketOperatorRemoved: boolean;
    readonly asDistributionBucketOperatorRemoved: ITuple<[PalletStorageDistributionBucketIdRecord, u64]>;
    readonly isDistributionBucketFamilyMetadataSet: boolean;
    readonly asDistributionBucketFamilyMetadataSet: ITuple<[u64, Bytes]>;
    readonly isDataObjectStateBloatBondValueUpdated: boolean;
    readonly asDataObjectStateBloatBondValueUpdated: u128;
    readonly isDataObjectsUpdated: boolean;
    readonly asDataObjectsUpdated: ITuple<[PalletStorageUploadParametersRecord, BTreeSet<u64>, BTreeSet<u64>]>;
    readonly isStorageOperatorRemarked: boolean;
    readonly asStorageOperatorRemarked: ITuple<[u64, u64, Bytes]>;
    readonly isDistributionOperatorRemarked: boolean;
    readonly asDistributionOperatorRemarked: ITuple<[u64, PalletStorageDistributionBucketIdRecord, Bytes]>;
    readonly type: 'StorageBucketCreated' | 'StorageBucketInvitationAccepted' | 'StorageBucketsUpdatedForBag' | 'DataObjectsUploaded' | 'StorageOperatorMetadataSet' | 'StorageBucketVoucherLimitsSet' | 'PendingDataObjectsAccepted' | 'StorageBucketInvitationCancelled' | 'StorageBucketOperatorInvited' | 'StorageBucketOperatorRemoved' | 'UploadingBlockStatusUpdated' | 'DataObjectPerMegabyteFeeUpdated' | 'StorageBucketsPerBagLimitUpdated' | 'StorageBucketsVoucherMaxLimitsUpdated' | 'DataObjectsMoved' | 'DataObjectsDeleted' | 'StorageBucketStatusUpdated' | 'UpdateBlacklist' | 'DynamicBagDeleted' | 'DynamicBagCreated' | 'VoucherChanged' | 'StorageBucketDeleted' | 'NumberOfStorageBucketsInDynamicBagCreationPolicyUpdated' | 'DistributionBucketFamilyCreated' | 'DistributionBucketFamilyDeleted' | 'DistributionBucketCreated' | 'DistributionBucketStatusUpdated' | 'DistributionBucketDeleted' | 'DistributionBucketsUpdatedForBag' | 'DistributionBucketsPerBagLimitUpdated' | 'DistributionBucketModeUpdated' | 'FamiliesInDynamicBagCreationPolicyUpdated' | 'DistributionBucketOperatorInvited' | 'DistributionBucketInvitationCancelled' | 'DistributionBucketInvitationAccepted' | 'DistributionBucketMetadataSet' | 'DistributionBucketOperatorRemoved' | 'DistributionBucketFamilyMetadataSet' | 'DataObjectStateBloatBondValueUpdated' | 'DataObjectsUpdated' | 'StorageOperatorRemarked' | 'DistributionOperatorRemarked';
  }

  /** @name PalletStorageUploadParametersRecord (157) */
  export interface PalletStorageUploadParametersRecord extends Struct {
    readonly bagId: PalletStorageBagIdType;
    readonly objectCreationList: Vec<PalletStorageDataObjectCreationParameters>;
    readonly stateBloatBondSourceAccountId: AccountId32;
    readonly expectedDataSizeFee: u128;
    readonly expectedDataObjectStateBloatBond: u128;
  }

  /** @name PalletStorageBagIdType (158) */
  export interface PalletStorageBagIdType extends Enum {
    readonly isStatic: boolean;
    readonly asStatic: PalletStorageStaticBagId;
    readonly isDynamic: boolean;
    readonly asDynamic: PalletStorageDynamicBagIdType;
    readonly type: 'Static' | 'Dynamic';
  }

  /** @name PalletStorageStaticBagId (159) */
  export interface PalletStorageStaticBagId extends Enum {
    readonly isCouncil: boolean;
    readonly isWorkingGroup: boolean;
    readonly asWorkingGroup: PalletCommonWorkingGroupIterableEnumsWorkingGroup;
    readonly type: 'Council' | 'WorkingGroup';
  }

  /** @name PalletStorageDynamicBagIdType (160) */
  export interface PalletStorageDynamicBagIdType extends Enum {
    readonly isMember: boolean;
    readonly asMember: u64;
    readonly isChannel: boolean;
    readonly asChannel: u64;
    readonly type: 'Member' | 'Channel';
  }

  /** @name PalletStorageDynBagCreationParametersRecord (161) */
  export interface PalletStorageDynBagCreationParametersRecord extends Struct {
    readonly bagId: PalletStorageDynamicBagIdType;
    readonly objectCreationList: Vec<PalletStorageDataObjectCreationParameters>;
    readonly stateBloatBondSourceAccountId: AccountId32;
    readonly expectedDataSizeFee: u128;
    readonly expectedDataObjectStateBloatBond: u128;
    readonly storageBuckets: BTreeSet<u64>;
    readonly distributionBuckets: BTreeSet<PalletStorageDistributionBucketIdRecord>;
  }

  /** @name PalletStorageVoucher (164) */
  export interface PalletStorageVoucher extends Struct {
    readonly sizeLimit: u64;
    readonly objectsLimit: u64;
    readonly sizeUsed: u64;
    readonly objectsUsed: u64;
  }

  /** @name PalletStorageDynamicBagType (165) */
  export interface PalletStorageDynamicBagType extends Enum {
    readonly isMember: boolean;
    readonly isChannel: boolean;
    readonly type: 'Member' | 'Channel';
  }

  /** @name PalletProjectTokenEventsRawEvent (169) */
  export interface PalletProjectTokenEventsRawEvent extends Enum {
    readonly isTokenAmountTransferred: boolean;
    readonly asTokenAmountTransferred: ITuple<[u64, u64, BTreeMap<PalletProjectTokenValidated, PalletProjectTokenValidatedPayment>, Bytes]>;
    readonly isTokenAmountTransferredByIssuer: boolean;
    readonly asTokenAmountTransferredByIssuer: ITuple<[u64, u64, BTreeMap<PalletProjectTokenValidated, PalletProjectTokenValidatedPayment>, Bytes]>;
    readonly isPatronageRateDecreasedTo: boolean;
    readonly asPatronageRateDecreasedTo: ITuple<[u64, Perquintill]>;
    readonly isPatronageCreditClaimed: boolean;
    readonly asPatronageCreditClaimed: ITuple<[u64, u128, u64]>;
    readonly isRevenueSplitIssued: boolean;
    readonly asRevenueSplitIssued: ITuple<[u64, u32, u32, u128]>;
    readonly isRevenueSplitFinalized: boolean;
    readonly asRevenueSplitFinalized: ITuple<[u64, AccountId32, u128]>;
    readonly isUserParticipatedInSplit: boolean;
    readonly asUserParticipatedInSplit: ITuple<[u64, u64, u128, u128, u32]>;
    readonly isRevenueSplitLeft: boolean;
    readonly asRevenueSplitLeft: ITuple<[u64, u64, u128]>;
    readonly isMemberJoinedWhitelist: boolean;
    readonly asMemberJoinedWhitelist: ITuple<[u64, u64, PalletProjectTokenTransferPolicy]>;
    readonly isAccountDustedBy: boolean;
    readonly asAccountDustedBy: ITuple<[u64, u64, AccountId32, PalletProjectTokenTransferPolicy]>;
    readonly isTokenDeissued: boolean;
    readonly asTokenDeissued: u64;
    readonly isTokenIssued: boolean;
    readonly asTokenIssued: ITuple<[u64, PalletProjectTokenTokenIssuanceParameters]>;
    readonly isTokenSaleInitialized: boolean;
    readonly asTokenSaleInitialized: ITuple<[u64, u32, PalletProjectTokenTokenSale, Option<Bytes>]>;
    readonly isUpcomingTokenSaleUpdated: boolean;
    readonly asUpcomingTokenSaleUpdated: ITuple<[u64, u32, Option<u32>, Option<u32>]>;
    readonly isTokensPurchasedOnSale: boolean;
    readonly asTokensPurchasedOnSale: ITuple<[u64, u32, u128, u64]>;
    readonly isTokenSaleFinalized: boolean;
    readonly asTokenSaleFinalized: ITuple<[u64, u32, u128, u128]>;
    readonly isTransferPolicyChangedToPermissionless: boolean;
    readonly asTransferPolicyChangedToPermissionless: u64;
    readonly isTokensBurned: boolean;
    readonly asTokensBurned: ITuple<[u64, u64, u128]>;
    readonly type: 'TokenAmountTransferred' | 'TokenAmountTransferredByIssuer' | 'PatronageRateDecreasedTo' | 'PatronageCreditClaimed' | 'RevenueSplitIssued' | 'RevenueSplitFinalized' | 'UserParticipatedInSplit' | 'RevenueSplitLeft' | 'MemberJoinedWhitelist' | 'AccountDustedBy' | 'TokenDeissued' | 'TokenIssued' | 'TokenSaleInitialized' | 'UpcomingTokenSaleUpdated' | 'TokensPurchasedOnSale' | 'TokenSaleFinalized' | 'TransferPolicyChangedToPermissionless' | 'TokensBurned';
  }

  /** @name PalletProjectTokenTransferPolicy (170) */
  export interface PalletProjectTokenTransferPolicy extends Enum {
    readonly isPermissionless: boolean;
    readonly isPermissioned: boolean;
    readonly asPermissioned: H256;
    readonly type: 'Permissionless' | 'Permissioned';
  }

  /** @name PalletProjectTokenTokenIssuanceParameters (171) */
  export interface PalletProjectTokenTokenIssuanceParameters extends Struct {
    readonly initialAllocation: BTreeMap<u64, PalletProjectTokenTokenAllocation>;
    readonly symbol: H256;
    readonly transferPolicy: PalletProjectTokenTransferPolicyParams;
    readonly patronageRate: Permill;
    readonly revenueSplitRate: Permill;
  }

  /** @name PalletProjectTokenTokenAllocation (172) */
  export interface PalletProjectTokenTokenAllocation extends Struct {
    readonly amount: u128;
    readonly vestingScheduleParams: Option<PalletProjectTokenVestingScheduleParams>;
  }

  /** @name PalletProjectTokenVestingScheduleParams (173) */
  export interface PalletProjectTokenVestingScheduleParams extends Struct {
    readonly linearVestingDuration: u32;
    readonly blocksBeforeCliff: u32;
    readonly cliffAmountPercentage: Permill;
  }

  /** @name PalletProjectTokenTransferPolicyParams (176) */
  export interface PalletProjectTokenTransferPolicyParams extends Enum {
    readonly isPermissionless: boolean;
    readonly isPermissioned: boolean;
    readonly asPermissioned: PalletProjectTokenWhitelistParams;
    readonly type: 'Permissionless' | 'Permissioned';
  }

  /** @name PalletProjectTokenWhitelistParams (177) */
  export interface PalletProjectTokenWhitelistParams extends Struct {
    readonly commitment: H256;
    readonly payload: Option<PalletProjectTokenSingleDataObjectUploadParams>;
  }

  /** @name PalletProjectTokenSingleDataObjectUploadParams (178) */
  export interface PalletProjectTokenSingleDataObjectUploadParams extends Struct {
    readonly objectCreationParams: PalletStorageDataObjectCreationParameters;
    readonly expectedDataSizeFee: u128;
    readonly expectedDataObjectStateBloatBond: u128;
  }

  /** @name PalletProjectTokenValidated (185) */
  export interface PalletProjectTokenValidated extends Enum {
    readonly isExisting: boolean;
    readonly asExisting: u64;
    readonly isNonExisting: boolean;
    readonly asNonExisting: u64;
    readonly type: 'Existing' | 'NonExisting';
  }

  /** @name PalletProjectTokenValidatedPayment (186) */
  export interface PalletProjectTokenValidatedPayment extends Struct {
    readonly payment: PalletProjectTokenPaymentWithVesting;
    readonly vestingCleanupCandidate: Option<PalletProjectTokenVestingSource>;
  }

  /** @name PalletProjectTokenPaymentWithVesting (187) */
  export interface PalletProjectTokenPaymentWithVesting extends Struct {
    readonly amount: u128;
    readonly vestingSchedule: Option<PalletProjectTokenVestingScheduleParams>;
  }

  /** @name PalletProjectTokenVestingSource (189) */
  export interface PalletProjectTokenVestingSource extends Enum {
    readonly isInitialIssuance: boolean;
    readonly isSale: boolean;
    readonly asSale: u32;
    readonly isIssuerTransfer: boolean;
    readonly asIssuerTransfer: u64;
    readonly type: 'InitialIssuance' | 'Sale' | 'IssuerTransfer';
  }

  /** @name PalletProjectTokenTokenSale (193) */
  export interface PalletProjectTokenTokenSale extends Struct {
    readonly unitPrice: u128;
    readonly quantityLeft: u128;
    readonly fundsCollected: u128;
    readonly tokensSource: u64;
    readonly earningsDestination: Option<AccountId32>;
    readonly startBlock: u32;
    readonly duration: u32;
    readonly vestingScheduleParams: Option<PalletProjectTokenVestingScheduleParams>;
    readonly capPerMember: Option<u128>;
    readonly autoFinalize: bool;
  }

  /** @name PalletProposalsEngineRawEvent (195) */
  export interface PalletProposalsEngineRawEvent extends Enum {
    readonly isProposalStatusUpdated: boolean;
    readonly asProposalStatusUpdated: ITuple<[u32, PalletProposalsEngineProposalStatusesProposalStatus]>;
    readonly isProposalDecisionMade: boolean;
    readonly asProposalDecisionMade: ITuple<[u32, PalletProposalsEngineProposalStatusesProposalDecision]>;
    readonly isProposalExecuted: boolean;
    readonly asProposalExecuted: ITuple<[u32, PalletProposalsEngineProposalStatusesExecutionStatus]>;
    readonly isVoted: boolean;
    readonly asVoted: ITuple<[u64, u32, PalletProposalsEngineVoteKind, Bytes]>;
    readonly isProposalCancelled: boolean;
    readonly asProposalCancelled: ITuple<[u64, u32]>;
    readonly isProposerRemarked: boolean;
    readonly asProposerRemarked: ITuple<[u64, u32, Bytes]>;
    readonly type: 'ProposalStatusUpdated' | 'ProposalDecisionMade' | 'ProposalExecuted' | 'Voted' | 'ProposalCancelled' | 'ProposerRemarked';
  }

  /** @name PalletProposalsEngineProposalStatusesProposalStatus (196) */
  export interface PalletProposalsEngineProposalStatusesProposalStatus extends Enum {
    readonly isActive: boolean;
    readonly isPendingExecution: boolean;
    readonly asPendingExecution: u32;
    readonly isPendingConstitutionality: boolean;
    readonly type: 'Active' | 'PendingExecution' | 'PendingConstitutionality';
  }

  /** @name PalletProposalsEngineProposalStatusesProposalDecision (197) */
  export interface PalletProposalsEngineProposalStatusesProposalDecision extends Enum {
    readonly isCanceled: boolean;
    readonly isCanceledByRuntime: boolean;
    readonly isVetoed: boolean;
    readonly isRejected: boolean;
    readonly isSlashed: boolean;
    readonly isExpired: boolean;
    readonly isApproved: boolean;
    readonly asApproved: PalletProposalsEngineProposalStatusesApprovedProposalDecision;
    readonly type: 'Canceled' | 'CanceledByRuntime' | 'Vetoed' | 'Rejected' | 'Slashed' | 'Expired' | 'Approved';
  }

  /** @name PalletProposalsEngineProposalStatusesApprovedProposalDecision (198) */
  export interface PalletProposalsEngineProposalStatusesApprovedProposalDecision extends Enum {
    readonly isPendingExecution: boolean;
    readonly isPendingConstitutionality: boolean;
    readonly type: 'PendingExecution' | 'PendingConstitutionality';
  }

  /** @name PalletProposalsEngineProposalStatusesExecutionStatus (199) */
  export interface PalletProposalsEngineProposalStatusesExecutionStatus extends Enum {
    readonly isExecuted: boolean;
    readonly isExecutionFailed: boolean;
    readonly asExecutionFailed: {
      readonly error: Bytes;
    } & Struct;
    readonly type: 'Executed' | 'ExecutionFailed';
  }

  /** @name PalletProposalsEngineVoteKind (200) */
  export interface PalletProposalsEngineVoteKind extends Enum {
    readonly isApprove: boolean;
    readonly isReject: boolean;
    readonly isSlash: boolean;
    readonly isAbstain: boolean;
    readonly type: 'Approve' | 'Reject' | 'Slash' | 'Abstain';
  }

  /** @name PalletProposalsDiscussionRawEvent (201) */
  export interface PalletProposalsDiscussionRawEvent extends Enum {
    readonly isThreadCreated: boolean;
    readonly asThreadCreated: ITuple<[u64, u64]>;
    readonly isPostCreated: boolean;
    readonly asPostCreated: ITuple<[u64, u64, u64, Bytes, bool]>;
    readonly isPostUpdated: boolean;
    readonly asPostUpdated: ITuple<[u64, u64, u64, Bytes]>;
    readonly isThreadModeChanged: boolean;
    readonly asThreadModeChanged: ITuple<[u64, PalletProposalsDiscussionThreadModeBTreeSet, u64]>;
    readonly isPostDeleted: boolean;
    readonly asPostDeleted: ITuple<[u64, u64, u64, bool]>;
    readonly type: 'ThreadCreated' | 'PostCreated' | 'PostUpdated' | 'ThreadModeChanged' | 'PostDeleted';
  }

  /** @name PalletProposalsDiscussionThreadModeBTreeSet (202) */
  export interface PalletProposalsDiscussionThreadModeBTreeSet extends Enum {
    readonly isOpen: boolean;
    readonly isClosed: boolean;
    readonly asClosed: BTreeSet<u64>;
    readonly type: 'Open' | 'Closed';
  }

  /** @name PalletProposalsCodexRawEvent (203) */
  export interface PalletProposalsCodexRawEvent extends Enum {
    readonly isProposalCreated: boolean;
    readonly asProposalCreated: ITuple<[u32, PalletProposalsCodexGeneralProposalParams, PalletProposalsCodexProposalDetails, u64]>;
    readonly type: 'ProposalCreated';
  }

  /** @name PalletProposalsCodexGeneralProposalParams (204) */
  export interface PalletProposalsCodexGeneralProposalParams extends Struct {
    readonly memberId: u64;
    readonly title: Bytes;
    readonly description: Bytes;
    readonly stakingAccountId: Option<AccountId32>;
    readonly exactExecutionBlock: Option<u32>;
  }

  /** @name PalletProposalsCodexProposalDetails (205) */
  export interface PalletProposalsCodexProposalDetails extends Enum {
    readonly isSignal: boolean;
    readonly asSignal: Bytes;
    readonly isRuntimeUpgrade: boolean;
    readonly asRuntimeUpgrade: Bytes;
    readonly isFundingRequest: boolean;
    readonly asFundingRequest: Vec<PalletCommonFundingRequestParameters>;
    readonly isSetMaxValidatorCount: boolean;
    readonly asSetMaxValidatorCount: u32;
    readonly isCreateWorkingGroupLeadOpening: boolean;
    readonly asCreateWorkingGroupLeadOpening: PalletProposalsCodexCreateOpeningParameters;
    readonly isFillWorkingGroupLeadOpening: boolean;
    readonly asFillWorkingGroupLeadOpening: PalletProposalsCodexFillOpeningParameters;
    readonly isUpdateWorkingGroupBudget: boolean;
    readonly asUpdateWorkingGroupBudget: ITuple<[u128, PalletCommonWorkingGroupIterableEnumsWorkingGroup, PalletCommonBalanceKind]>;
    readonly isDecreaseWorkingGroupLeadStake: boolean;
    readonly asDecreaseWorkingGroupLeadStake: ITuple<[u64, u128, PalletCommonWorkingGroupIterableEnumsWorkingGroup]>;
    readonly isSlashWorkingGroupLead: boolean;
    readonly asSlashWorkingGroupLead: ITuple<[u64, u128, PalletCommonWorkingGroupIterableEnumsWorkingGroup]>;
    readonly isSetWorkingGroupLeadReward: boolean;
    readonly asSetWorkingGroupLeadReward: ITuple<[u64, Option<u128>, PalletCommonWorkingGroupIterableEnumsWorkingGroup]>;
    readonly isTerminateWorkingGroupLead: boolean;
    readonly asTerminateWorkingGroupLead: PalletProposalsCodexTerminateRoleParameters;
    readonly isAmendConstitution: boolean;
    readonly asAmendConstitution: Bytes;
    readonly isCancelWorkingGroupLeadOpening: boolean;
    readonly asCancelWorkingGroupLeadOpening: ITuple<[u64, PalletCommonWorkingGroupIterableEnumsWorkingGroup]>;
    readonly isSetMembershipPrice: boolean;
    readonly asSetMembershipPrice: u128;
    readonly isSetCouncilBudgetIncrement: boolean;
    readonly asSetCouncilBudgetIncrement: u128;
    readonly isSetCouncilorReward: boolean;
    readonly asSetCouncilorReward: u128;
    readonly isSetInitialInvitationBalance: boolean;
    readonly asSetInitialInvitationBalance: u128;
    readonly isSetInitialInvitationCount: boolean;
    readonly asSetInitialInvitationCount: u32;
    readonly isSetMembershipLeadInvitationQuota: boolean;
    readonly asSetMembershipLeadInvitationQuota: u32;
    readonly isSetReferralCut: boolean;
    readonly asSetReferralCut: u8;
    readonly isVetoProposal: boolean;
    readonly asVetoProposal: u32;
    readonly isUpdateGlobalNftLimit: boolean;
    readonly asUpdateGlobalNftLimit: ITuple<[PalletContentNftLimitPeriod, u64]>;
    readonly isUpdateChannelPayouts: boolean;
    readonly asUpdateChannelPayouts: PalletContentUpdateChannelPayoutsParametersRecord;
    readonly type: 'Signal' | 'RuntimeUpgrade' | 'FundingRequest' | 'SetMaxValidatorCount' | 'CreateWorkingGroupLeadOpening' | 'FillWorkingGroupLeadOpening' | 'UpdateWorkingGroupBudget' | 'DecreaseWorkingGroupLeadStake' | 'SlashWorkingGroupLead' | 'SetWorkingGroupLeadReward' | 'TerminateWorkingGroupLead' | 'AmendConstitution' | 'CancelWorkingGroupLeadOpening' | 'SetMembershipPrice' | 'SetCouncilBudgetIncrement' | 'SetCouncilorReward' | 'SetInitialInvitationBalance' | 'SetInitialInvitationCount' | 'SetMembershipLeadInvitationQuota' | 'SetReferralCut' | 'VetoProposal' | 'UpdateGlobalNftLimit' | 'UpdateChannelPayouts';
  }

  /** @name PalletCommonFundingRequestParameters (207) */
  export interface PalletCommonFundingRequestParameters extends Struct {
    readonly account: AccountId32;
    readonly amount: u128;
  }

  /** @name PalletProposalsCodexCreateOpeningParameters (208) */
  export interface PalletProposalsCodexCreateOpeningParameters extends Struct {
    readonly description: Bytes;
    readonly stakePolicy: PalletWorkingGroupStakePolicy;
    readonly rewardPerBlock: Option<u128>;
    readonly group: PalletCommonWorkingGroupIterableEnumsWorkingGroup;
  }

  /** @name PalletWorkingGroupStakePolicy (209) */
  export interface PalletWorkingGroupStakePolicy extends Struct {
    readonly stakeAmount: u128;
    readonly leavingUnstakingPeriod: u32;
  }

  /** @name PalletProposalsCodexFillOpeningParameters (210) */
  export interface PalletProposalsCodexFillOpeningParameters extends Struct {
    readonly openingId: u64;
    readonly applicationId: u64;
    readonly workingGroup: PalletCommonWorkingGroupIterableEnumsWorkingGroup;
  }

  /** @name PalletProposalsCodexTerminateRoleParameters (211) */
  export interface PalletProposalsCodexTerminateRoleParameters extends Struct {
    readonly workerId: u64;
    readonly slashingAmount: Option<u128>;
    readonly group: PalletCommonWorkingGroupIterableEnumsWorkingGroup;
  }

  /** @name PalletWorkingGroupRawEventInstance1 (212) */
  export interface PalletWorkingGroupRawEventInstance1 extends Enum {
    readonly isOpeningAdded: boolean;
    readonly asOpeningAdded: ITuple<[u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
    readonly isAppliedOnOpening: boolean;
    readonly asAppliedOnOpening: ITuple<[PalletWorkingGroupApplyOnOpeningParams, u64]>;
    readonly isOpeningFilled: boolean;
    readonly asOpeningFilled: ITuple<[u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
    readonly isLeaderSet: boolean;
    readonly asLeaderSet: u64;
    readonly isWorkerRoleAccountUpdated: boolean;
    readonly asWorkerRoleAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isLeaderUnset: boolean;
    readonly isWorkerExited: boolean;
    readonly asWorkerExited: u64;
    readonly isWorkerStartedLeaving: boolean;
    readonly asWorkerStartedLeaving: ITuple<[u64, Option<Bytes>]>;
    readonly isTerminatedWorker: boolean;
    readonly asTerminatedWorker: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isTerminatedLeader: boolean;
    readonly asTerminatedLeader: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isStakeSlashed: boolean;
    readonly asStakeSlashed: ITuple<[u64, u128, u128, Option<Bytes>]>;
    readonly isStakeDecreased: boolean;
    readonly asStakeDecreased: ITuple<[u64, u128]>;
    readonly isStakeIncreased: boolean;
    readonly asStakeIncreased: ITuple<[u64, u128]>;
    readonly isApplicationWithdrawn: boolean;
    readonly asApplicationWithdrawn: u64;
    readonly isOpeningCanceled: boolean;
    readonly asOpeningCanceled: u64;
    readonly isBudgetSet: boolean;
    readonly asBudgetSet: u128;
    readonly isWorkerRewardAccountUpdated: boolean;
    readonly asWorkerRewardAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isWorkerRewardAmountUpdated: boolean;
    readonly asWorkerRewardAmountUpdated: ITuple<[u64, Option<u128>]>;
    readonly isStatusTextChanged: boolean;
    readonly asStatusTextChanged: ITuple<[H256, Option<Bytes>]>;
    readonly isBudgetSpending: boolean;
    readonly asBudgetSpending: ITuple<[AccountId32, u128, Option<Bytes>]>;
    readonly isRewardPaid: boolean;
    readonly asRewardPaid: ITuple<[u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
    readonly isNewMissedRewardLevelReached: boolean;
    readonly asNewMissedRewardLevelReached: ITuple<[u64, Option<u128>]>;
    readonly isWorkingGroupBudgetFunded: boolean;
    readonly asWorkingGroupBudgetFunded: ITuple<[u64, u128, Bytes]>;
    readonly isLeadRemarked: boolean;
    readonly asLeadRemarked: Bytes;
    readonly isWorkerRemarked: boolean;
    readonly asWorkerRemarked: ITuple<[u64, Bytes]>;
    readonly type: 'OpeningAdded' | 'AppliedOnOpening' | 'OpeningFilled' | 'LeaderSet' | 'WorkerRoleAccountUpdated' | 'LeaderUnset' | 'WorkerExited' | 'WorkerStartedLeaving' | 'TerminatedWorker' | 'TerminatedLeader' | 'StakeSlashed' | 'StakeDecreased' | 'StakeIncreased' | 'ApplicationWithdrawn' | 'OpeningCanceled' | 'BudgetSet' | 'WorkerRewardAccountUpdated' | 'WorkerRewardAmountUpdated' | 'StatusTextChanged' | 'BudgetSpending' | 'RewardPaid' | 'NewMissedRewardLevelReached' | 'WorkingGroupBudgetFunded' | 'LeadRemarked' | 'WorkerRemarked';
  }

  /** @name PalletWorkingGroupOpeningType (216) */
  export interface PalletWorkingGroupOpeningType extends Enum {
    readonly isLeader: boolean;
    readonly isRegular: boolean;
    readonly type: 'Leader' | 'Regular';
  }

  /** @name PalletWorkingGroupApplyOnOpeningParams (217) */
  export interface PalletWorkingGroupApplyOnOpeningParams extends Struct {
    readonly memberId: u64;
    readonly openingId: u64;
    readonly roleAccountId: AccountId32;
    readonly rewardAccountId: AccountId32;
    readonly description: Bytes;
    readonly stakeParameters: PalletWorkingGroupStakeParameters;
  }

  /** @name PalletWorkingGroupStakeParameters (218) */
  export interface PalletWorkingGroupStakeParameters extends Struct {
    readonly stake: u128;
    readonly stakingAccountId: AccountId32;
  }

  /** @name PalletWorkingGroupInstance1 (219) */
  export type PalletWorkingGroupInstance1 = Null;

  /** @name PalletWorkingGroupRewardPaymentType (220) */
  export interface PalletWorkingGroupRewardPaymentType extends Enum {
    readonly isMissedReward: boolean;
    readonly isRegularReward: boolean;
    readonly type: 'MissedReward' | 'RegularReward';
  }

  /** @name PalletWorkingGroupRawEventInstance2 (221) */
  export interface PalletWorkingGroupRawEventInstance2 extends Enum {
    readonly isOpeningAdded: boolean;
    readonly asOpeningAdded: ITuple<[u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
    readonly isAppliedOnOpening: boolean;
    readonly asAppliedOnOpening: ITuple<[PalletWorkingGroupApplyOnOpeningParams, u64]>;
    readonly isOpeningFilled: boolean;
    readonly asOpeningFilled: ITuple<[u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
    readonly isLeaderSet: boolean;
    readonly asLeaderSet: u64;
    readonly isWorkerRoleAccountUpdated: boolean;
    readonly asWorkerRoleAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isLeaderUnset: boolean;
    readonly isWorkerExited: boolean;
    readonly asWorkerExited: u64;
    readonly isWorkerStartedLeaving: boolean;
    readonly asWorkerStartedLeaving: ITuple<[u64, Option<Bytes>]>;
    readonly isTerminatedWorker: boolean;
    readonly asTerminatedWorker: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isTerminatedLeader: boolean;
    readonly asTerminatedLeader: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isStakeSlashed: boolean;
    readonly asStakeSlashed: ITuple<[u64, u128, u128, Option<Bytes>]>;
    readonly isStakeDecreased: boolean;
    readonly asStakeDecreased: ITuple<[u64, u128]>;
    readonly isStakeIncreased: boolean;
    readonly asStakeIncreased: ITuple<[u64, u128]>;
    readonly isApplicationWithdrawn: boolean;
    readonly asApplicationWithdrawn: u64;
    readonly isOpeningCanceled: boolean;
    readonly asOpeningCanceled: u64;
    readonly isBudgetSet: boolean;
    readonly asBudgetSet: u128;
    readonly isWorkerRewardAccountUpdated: boolean;
    readonly asWorkerRewardAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isWorkerRewardAmountUpdated: boolean;
    readonly asWorkerRewardAmountUpdated: ITuple<[u64, Option<u128>]>;
    readonly isStatusTextChanged: boolean;
    readonly asStatusTextChanged: ITuple<[H256, Option<Bytes>]>;
    readonly isBudgetSpending: boolean;
    readonly asBudgetSpending: ITuple<[AccountId32, u128, Option<Bytes>]>;
    readonly isRewardPaid: boolean;
    readonly asRewardPaid: ITuple<[u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
    readonly isNewMissedRewardLevelReached: boolean;
    readonly asNewMissedRewardLevelReached: ITuple<[u64, Option<u128>]>;
    readonly isWorkingGroupBudgetFunded: boolean;
    readonly asWorkingGroupBudgetFunded: ITuple<[u64, u128, Bytes]>;
    readonly isLeadRemarked: boolean;
    readonly asLeadRemarked: Bytes;
    readonly isWorkerRemarked: boolean;
    readonly asWorkerRemarked: ITuple<[u64, Bytes]>;
    readonly type: 'OpeningAdded' | 'AppliedOnOpening' | 'OpeningFilled' | 'LeaderSet' | 'WorkerRoleAccountUpdated' | 'LeaderUnset' | 'WorkerExited' | 'WorkerStartedLeaving' | 'TerminatedWorker' | 'TerminatedLeader' | 'StakeSlashed' | 'StakeDecreased' | 'StakeIncreased' | 'ApplicationWithdrawn' | 'OpeningCanceled' | 'BudgetSet' | 'WorkerRewardAccountUpdated' | 'WorkerRewardAmountUpdated' | 'StatusTextChanged' | 'BudgetSpending' | 'RewardPaid' | 'NewMissedRewardLevelReached' | 'WorkingGroupBudgetFunded' | 'LeadRemarked' | 'WorkerRemarked';
  }

  /** @name PalletWorkingGroupInstance2 (222) */
  export type PalletWorkingGroupInstance2 = Null;

  /** @name PalletWorkingGroupRawEventInstance3 (223) */
  export interface PalletWorkingGroupRawEventInstance3 extends Enum {
    readonly isOpeningAdded: boolean;
    readonly asOpeningAdded: ITuple<[u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
    readonly isAppliedOnOpening: boolean;
    readonly asAppliedOnOpening: ITuple<[PalletWorkingGroupApplyOnOpeningParams, u64]>;
    readonly isOpeningFilled: boolean;
    readonly asOpeningFilled: ITuple<[u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
    readonly isLeaderSet: boolean;
    readonly asLeaderSet: u64;
    readonly isWorkerRoleAccountUpdated: boolean;
    readonly asWorkerRoleAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isLeaderUnset: boolean;
    readonly isWorkerExited: boolean;
    readonly asWorkerExited: u64;
    readonly isWorkerStartedLeaving: boolean;
    readonly asWorkerStartedLeaving: ITuple<[u64, Option<Bytes>]>;
    readonly isTerminatedWorker: boolean;
    readonly asTerminatedWorker: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isTerminatedLeader: boolean;
    readonly asTerminatedLeader: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isStakeSlashed: boolean;
    readonly asStakeSlashed: ITuple<[u64, u128, u128, Option<Bytes>]>;
    readonly isStakeDecreased: boolean;
    readonly asStakeDecreased: ITuple<[u64, u128]>;
    readonly isStakeIncreased: boolean;
    readonly asStakeIncreased: ITuple<[u64, u128]>;
    readonly isApplicationWithdrawn: boolean;
    readonly asApplicationWithdrawn: u64;
    readonly isOpeningCanceled: boolean;
    readonly asOpeningCanceled: u64;
    readonly isBudgetSet: boolean;
    readonly asBudgetSet: u128;
    readonly isWorkerRewardAccountUpdated: boolean;
    readonly asWorkerRewardAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isWorkerRewardAmountUpdated: boolean;
    readonly asWorkerRewardAmountUpdated: ITuple<[u64, Option<u128>]>;
    readonly isStatusTextChanged: boolean;
    readonly asStatusTextChanged: ITuple<[H256, Option<Bytes>]>;
    readonly isBudgetSpending: boolean;
    readonly asBudgetSpending: ITuple<[AccountId32, u128, Option<Bytes>]>;
    readonly isRewardPaid: boolean;
    readonly asRewardPaid: ITuple<[u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
    readonly isNewMissedRewardLevelReached: boolean;
    readonly asNewMissedRewardLevelReached: ITuple<[u64, Option<u128>]>;
    readonly isWorkingGroupBudgetFunded: boolean;
    readonly asWorkingGroupBudgetFunded: ITuple<[u64, u128, Bytes]>;
    readonly isLeadRemarked: boolean;
    readonly asLeadRemarked: Bytes;
    readonly isWorkerRemarked: boolean;
    readonly asWorkerRemarked: ITuple<[u64, Bytes]>;
    readonly type: 'OpeningAdded' | 'AppliedOnOpening' | 'OpeningFilled' | 'LeaderSet' | 'WorkerRoleAccountUpdated' | 'LeaderUnset' | 'WorkerExited' | 'WorkerStartedLeaving' | 'TerminatedWorker' | 'TerminatedLeader' | 'StakeSlashed' | 'StakeDecreased' | 'StakeIncreased' | 'ApplicationWithdrawn' | 'OpeningCanceled' | 'BudgetSet' | 'WorkerRewardAccountUpdated' | 'WorkerRewardAmountUpdated' | 'StatusTextChanged' | 'BudgetSpending' | 'RewardPaid' | 'NewMissedRewardLevelReached' | 'WorkingGroupBudgetFunded' | 'LeadRemarked' | 'WorkerRemarked';
  }

  /** @name PalletWorkingGroupInstance3 (224) */
  export type PalletWorkingGroupInstance3 = Null;

  /** @name PalletWorkingGroupRawEventInstance4 (225) */
  export interface PalletWorkingGroupRawEventInstance4 extends Enum {
    readonly isOpeningAdded: boolean;
    readonly asOpeningAdded: ITuple<[u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
    readonly isAppliedOnOpening: boolean;
    readonly asAppliedOnOpening: ITuple<[PalletWorkingGroupApplyOnOpeningParams, u64]>;
    readonly isOpeningFilled: boolean;
    readonly asOpeningFilled: ITuple<[u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
    readonly isLeaderSet: boolean;
    readonly asLeaderSet: u64;
    readonly isWorkerRoleAccountUpdated: boolean;
    readonly asWorkerRoleAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isLeaderUnset: boolean;
    readonly isWorkerExited: boolean;
    readonly asWorkerExited: u64;
    readonly isWorkerStartedLeaving: boolean;
    readonly asWorkerStartedLeaving: ITuple<[u64, Option<Bytes>]>;
    readonly isTerminatedWorker: boolean;
    readonly asTerminatedWorker: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isTerminatedLeader: boolean;
    readonly asTerminatedLeader: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isStakeSlashed: boolean;
    readonly asStakeSlashed: ITuple<[u64, u128, u128, Option<Bytes>]>;
    readonly isStakeDecreased: boolean;
    readonly asStakeDecreased: ITuple<[u64, u128]>;
    readonly isStakeIncreased: boolean;
    readonly asStakeIncreased: ITuple<[u64, u128]>;
    readonly isApplicationWithdrawn: boolean;
    readonly asApplicationWithdrawn: u64;
    readonly isOpeningCanceled: boolean;
    readonly asOpeningCanceled: u64;
    readonly isBudgetSet: boolean;
    readonly asBudgetSet: u128;
    readonly isWorkerRewardAccountUpdated: boolean;
    readonly asWorkerRewardAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isWorkerRewardAmountUpdated: boolean;
    readonly asWorkerRewardAmountUpdated: ITuple<[u64, Option<u128>]>;
    readonly isStatusTextChanged: boolean;
    readonly asStatusTextChanged: ITuple<[H256, Option<Bytes>]>;
    readonly isBudgetSpending: boolean;
    readonly asBudgetSpending: ITuple<[AccountId32, u128, Option<Bytes>]>;
    readonly isRewardPaid: boolean;
    readonly asRewardPaid: ITuple<[u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
    readonly isNewMissedRewardLevelReached: boolean;
    readonly asNewMissedRewardLevelReached: ITuple<[u64, Option<u128>]>;
    readonly isWorkingGroupBudgetFunded: boolean;
    readonly asWorkingGroupBudgetFunded: ITuple<[u64, u128, Bytes]>;
    readonly isLeadRemarked: boolean;
    readonly asLeadRemarked: Bytes;
    readonly isWorkerRemarked: boolean;
    readonly asWorkerRemarked: ITuple<[u64, Bytes]>;
    readonly type: 'OpeningAdded' | 'AppliedOnOpening' | 'OpeningFilled' | 'LeaderSet' | 'WorkerRoleAccountUpdated' | 'LeaderUnset' | 'WorkerExited' | 'WorkerStartedLeaving' | 'TerminatedWorker' | 'TerminatedLeader' | 'StakeSlashed' | 'StakeDecreased' | 'StakeIncreased' | 'ApplicationWithdrawn' | 'OpeningCanceled' | 'BudgetSet' | 'WorkerRewardAccountUpdated' | 'WorkerRewardAmountUpdated' | 'StatusTextChanged' | 'BudgetSpending' | 'RewardPaid' | 'NewMissedRewardLevelReached' | 'WorkingGroupBudgetFunded' | 'LeadRemarked' | 'WorkerRemarked';
  }

  /** @name PalletWorkingGroupInstance4 (226) */
  export type PalletWorkingGroupInstance4 = Null;

  /** @name PalletWorkingGroupRawEventInstance5 (227) */
  export interface PalletWorkingGroupRawEventInstance5 extends Enum {
    readonly isOpeningAdded: boolean;
    readonly asOpeningAdded: ITuple<[u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
    readonly isAppliedOnOpening: boolean;
    readonly asAppliedOnOpening: ITuple<[PalletWorkingGroupApplyOnOpeningParams, u64]>;
    readonly isOpeningFilled: boolean;
    readonly asOpeningFilled: ITuple<[u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
    readonly isLeaderSet: boolean;
    readonly asLeaderSet: u64;
    readonly isWorkerRoleAccountUpdated: boolean;
    readonly asWorkerRoleAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isLeaderUnset: boolean;
    readonly isWorkerExited: boolean;
    readonly asWorkerExited: u64;
    readonly isWorkerStartedLeaving: boolean;
    readonly asWorkerStartedLeaving: ITuple<[u64, Option<Bytes>]>;
    readonly isTerminatedWorker: boolean;
    readonly asTerminatedWorker: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isTerminatedLeader: boolean;
    readonly asTerminatedLeader: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isStakeSlashed: boolean;
    readonly asStakeSlashed: ITuple<[u64, u128, u128, Option<Bytes>]>;
    readonly isStakeDecreased: boolean;
    readonly asStakeDecreased: ITuple<[u64, u128]>;
    readonly isStakeIncreased: boolean;
    readonly asStakeIncreased: ITuple<[u64, u128]>;
    readonly isApplicationWithdrawn: boolean;
    readonly asApplicationWithdrawn: u64;
    readonly isOpeningCanceled: boolean;
    readonly asOpeningCanceled: u64;
    readonly isBudgetSet: boolean;
    readonly asBudgetSet: u128;
    readonly isWorkerRewardAccountUpdated: boolean;
    readonly asWorkerRewardAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isWorkerRewardAmountUpdated: boolean;
    readonly asWorkerRewardAmountUpdated: ITuple<[u64, Option<u128>]>;
    readonly isStatusTextChanged: boolean;
    readonly asStatusTextChanged: ITuple<[H256, Option<Bytes>]>;
    readonly isBudgetSpending: boolean;
    readonly asBudgetSpending: ITuple<[AccountId32, u128, Option<Bytes>]>;
    readonly isRewardPaid: boolean;
    readonly asRewardPaid: ITuple<[u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
    readonly isNewMissedRewardLevelReached: boolean;
    readonly asNewMissedRewardLevelReached: ITuple<[u64, Option<u128>]>;
    readonly isWorkingGroupBudgetFunded: boolean;
    readonly asWorkingGroupBudgetFunded: ITuple<[u64, u128, Bytes]>;
    readonly isLeadRemarked: boolean;
    readonly asLeadRemarked: Bytes;
    readonly isWorkerRemarked: boolean;
    readonly asWorkerRemarked: ITuple<[u64, Bytes]>;
    readonly type: 'OpeningAdded' | 'AppliedOnOpening' | 'OpeningFilled' | 'LeaderSet' | 'WorkerRoleAccountUpdated' | 'LeaderUnset' | 'WorkerExited' | 'WorkerStartedLeaving' | 'TerminatedWorker' | 'TerminatedLeader' | 'StakeSlashed' | 'StakeDecreased' | 'StakeIncreased' | 'ApplicationWithdrawn' | 'OpeningCanceled' | 'BudgetSet' | 'WorkerRewardAccountUpdated' | 'WorkerRewardAmountUpdated' | 'StatusTextChanged' | 'BudgetSpending' | 'RewardPaid' | 'NewMissedRewardLevelReached' | 'WorkingGroupBudgetFunded' | 'LeadRemarked' | 'WorkerRemarked';
  }

  /** @name PalletWorkingGroupInstance5 (228) */
  export type PalletWorkingGroupInstance5 = Null;

  /** @name PalletWorkingGroupRawEventInstance6 (229) */
  export interface PalletWorkingGroupRawEventInstance6 extends Enum {
    readonly isOpeningAdded: boolean;
    readonly asOpeningAdded: ITuple<[u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
    readonly isAppliedOnOpening: boolean;
    readonly asAppliedOnOpening: ITuple<[PalletWorkingGroupApplyOnOpeningParams, u64]>;
    readonly isOpeningFilled: boolean;
    readonly asOpeningFilled: ITuple<[u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
    readonly isLeaderSet: boolean;
    readonly asLeaderSet: u64;
    readonly isWorkerRoleAccountUpdated: boolean;
    readonly asWorkerRoleAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isLeaderUnset: boolean;
    readonly isWorkerExited: boolean;
    readonly asWorkerExited: u64;
    readonly isWorkerStartedLeaving: boolean;
    readonly asWorkerStartedLeaving: ITuple<[u64, Option<Bytes>]>;
    readonly isTerminatedWorker: boolean;
    readonly asTerminatedWorker: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isTerminatedLeader: boolean;
    readonly asTerminatedLeader: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isStakeSlashed: boolean;
    readonly asStakeSlashed: ITuple<[u64, u128, u128, Option<Bytes>]>;
    readonly isStakeDecreased: boolean;
    readonly asStakeDecreased: ITuple<[u64, u128]>;
    readonly isStakeIncreased: boolean;
    readonly asStakeIncreased: ITuple<[u64, u128]>;
    readonly isApplicationWithdrawn: boolean;
    readonly asApplicationWithdrawn: u64;
    readonly isOpeningCanceled: boolean;
    readonly asOpeningCanceled: u64;
    readonly isBudgetSet: boolean;
    readonly asBudgetSet: u128;
    readonly isWorkerRewardAccountUpdated: boolean;
    readonly asWorkerRewardAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isWorkerRewardAmountUpdated: boolean;
    readonly asWorkerRewardAmountUpdated: ITuple<[u64, Option<u128>]>;
    readonly isStatusTextChanged: boolean;
    readonly asStatusTextChanged: ITuple<[H256, Option<Bytes>]>;
    readonly isBudgetSpending: boolean;
    readonly asBudgetSpending: ITuple<[AccountId32, u128, Option<Bytes>]>;
    readonly isRewardPaid: boolean;
    readonly asRewardPaid: ITuple<[u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
    readonly isNewMissedRewardLevelReached: boolean;
    readonly asNewMissedRewardLevelReached: ITuple<[u64, Option<u128>]>;
    readonly isWorkingGroupBudgetFunded: boolean;
    readonly asWorkingGroupBudgetFunded: ITuple<[u64, u128, Bytes]>;
    readonly isLeadRemarked: boolean;
    readonly asLeadRemarked: Bytes;
    readonly isWorkerRemarked: boolean;
    readonly asWorkerRemarked: ITuple<[u64, Bytes]>;
    readonly type: 'OpeningAdded' | 'AppliedOnOpening' | 'OpeningFilled' | 'LeaderSet' | 'WorkerRoleAccountUpdated' | 'LeaderUnset' | 'WorkerExited' | 'WorkerStartedLeaving' | 'TerminatedWorker' | 'TerminatedLeader' | 'StakeSlashed' | 'StakeDecreased' | 'StakeIncreased' | 'ApplicationWithdrawn' | 'OpeningCanceled' | 'BudgetSet' | 'WorkerRewardAccountUpdated' | 'WorkerRewardAmountUpdated' | 'StatusTextChanged' | 'BudgetSpending' | 'RewardPaid' | 'NewMissedRewardLevelReached' | 'WorkingGroupBudgetFunded' | 'LeadRemarked' | 'WorkerRemarked';
  }

  /** @name PalletWorkingGroupInstance6 (230) */
  export type PalletWorkingGroupInstance6 = Null;

  /** @name PalletWorkingGroupRawEventInstance7 (231) */
  export interface PalletWorkingGroupRawEventInstance7 extends Enum {
    readonly isOpeningAdded: boolean;
    readonly asOpeningAdded: ITuple<[u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
    readonly isAppliedOnOpening: boolean;
    readonly asAppliedOnOpening: ITuple<[PalletWorkingGroupApplyOnOpeningParams, u64]>;
    readonly isOpeningFilled: boolean;
    readonly asOpeningFilled: ITuple<[u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
    readonly isLeaderSet: boolean;
    readonly asLeaderSet: u64;
    readonly isWorkerRoleAccountUpdated: boolean;
    readonly asWorkerRoleAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isLeaderUnset: boolean;
    readonly isWorkerExited: boolean;
    readonly asWorkerExited: u64;
    readonly isWorkerStartedLeaving: boolean;
    readonly asWorkerStartedLeaving: ITuple<[u64, Option<Bytes>]>;
    readonly isTerminatedWorker: boolean;
    readonly asTerminatedWorker: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isTerminatedLeader: boolean;
    readonly asTerminatedLeader: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isStakeSlashed: boolean;
    readonly asStakeSlashed: ITuple<[u64, u128, u128, Option<Bytes>]>;
    readonly isStakeDecreased: boolean;
    readonly asStakeDecreased: ITuple<[u64, u128]>;
    readonly isStakeIncreased: boolean;
    readonly asStakeIncreased: ITuple<[u64, u128]>;
    readonly isApplicationWithdrawn: boolean;
    readonly asApplicationWithdrawn: u64;
    readonly isOpeningCanceled: boolean;
    readonly asOpeningCanceled: u64;
    readonly isBudgetSet: boolean;
    readonly asBudgetSet: u128;
    readonly isWorkerRewardAccountUpdated: boolean;
    readonly asWorkerRewardAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isWorkerRewardAmountUpdated: boolean;
    readonly asWorkerRewardAmountUpdated: ITuple<[u64, Option<u128>]>;
    readonly isStatusTextChanged: boolean;
    readonly asStatusTextChanged: ITuple<[H256, Option<Bytes>]>;
    readonly isBudgetSpending: boolean;
    readonly asBudgetSpending: ITuple<[AccountId32, u128, Option<Bytes>]>;
    readonly isRewardPaid: boolean;
    readonly asRewardPaid: ITuple<[u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
    readonly isNewMissedRewardLevelReached: boolean;
    readonly asNewMissedRewardLevelReached: ITuple<[u64, Option<u128>]>;
    readonly isWorkingGroupBudgetFunded: boolean;
    readonly asWorkingGroupBudgetFunded: ITuple<[u64, u128, Bytes]>;
    readonly isLeadRemarked: boolean;
    readonly asLeadRemarked: Bytes;
    readonly isWorkerRemarked: boolean;
    readonly asWorkerRemarked: ITuple<[u64, Bytes]>;
    readonly type: 'OpeningAdded' | 'AppliedOnOpening' | 'OpeningFilled' | 'LeaderSet' | 'WorkerRoleAccountUpdated' | 'LeaderUnset' | 'WorkerExited' | 'WorkerStartedLeaving' | 'TerminatedWorker' | 'TerminatedLeader' | 'StakeSlashed' | 'StakeDecreased' | 'StakeIncreased' | 'ApplicationWithdrawn' | 'OpeningCanceled' | 'BudgetSet' | 'WorkerRewardAccountUpdated' | 'WorkerRewardAmountUpdated' | 'StatusTextChanged' | 'BudgetSpending' | 'RewardPaid' | 'NewMissedRewardLevelReached' | 'WorkingGroupBudgetFunded' | 'LeadRemarked' | 'WorkerRemarked';
  }

  /** @name PalletWorkingGroupInstance7 (232) */
  export type PalletWorkingGroupInstance7 = Null;

  /** @name PalletWorkingGroupRawEventInstance8 (233) */
  export interface PalletWorkingGroupRawEventInstance8 extends Enum {
    readonly isOpeningAdded: boolean;
    readonly asOpeningAdded: ITuple<[u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
    readonly isAppliedOnOpening: boolean;
    readonly asAppliedOnOpening: ITuple<[PalletWorkingGroupApplyOnOpeningParams, u64]>;
    readonly isOpeningFilled: boolean;
    readonly asOpeningFilled: ITuple<[u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
    readonly isLeaderSet: boolean;
    readonly asLeaderSet: u64;
    readonly isWorkerRoleAccountUpdated: boolean;
    readonly asWorkerRoleAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isLeaderUnset: boolean;
    readonly isWorkerExited: boolean;
    readonly asWorkerExited: u64;
    readonly isWorkerStartedLeaving: boolean;
    readonly asWorkerStartedLeaving: ITuple<[u64, Option<Bytes>]>;
    readonly isTerminatedWorker: boolean;
    readonly asTerminatedWorker: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isTerminatedLeader: boolean;
    readonly asTerminatedLeader: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isStakeSlashed: boolean;
    readonly asStakeSlashed: ITuple<[u64, u128, u128, Option<Bytes>]>;
    readonly isStakeDecreased: boolean;
    readonly asStakeDecreased: ITuple<[u64, u128]>;
    readonly isStakeIncreased: boolean;
    readonly asStakeIncreased: ITuple<[u64, u128]>;
    readonly isApplicationWithdrawn: boolean;
    readonly asApplicationWithdrawn: u64;
    readonly isOpeningCanceled: boolean;
    readonly asOpeningCanceled: u64;
    readonly isBudgetSet: boolean;
    readonly asBudgetSet: u128;
    readonly isWorkerRewardAccountUpdated: boolean;
    readonly asWorkerRewardAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isWorkerRewardAmountUpdated: boolean;
    readonly asWorkerRewardAmountUpdated: ITuple<[u64, Option<u128>]>;
    readonly isStatusTextChanged: boolean;
    readonly asStatusTextChanged: ITuple<[H256, Option<Bytes>]>;
    readonly isBudgetSpending: boolean;
    readonly asBudgetSpending: ITuple<[AccountId32, u128, Option<Bytes>]>;
    readonly isRewardPaid: boolean;
    readonly asRewardPaid: ITuple<[u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
    readonly isNewMissedRewardLevelReached: boolean;
    readonly asNewMissedRewardLevelReached: ITuple<[u64, Option<u128>]>;
    readonly isWorkingGroupBudgetFunded: boolean;
    readonly asWorkingGroupBudgetFunded: ITuple<[u64, u128, Bytes]>;
    readonly isLeadRemarked: boolean;
    readonly asLeadRemarked: Bytes;
    readonly isWorkerRemarked: boolean;
    readonly asWorkerRemarked: ITuple<[u64, Bytes]>;
    readonly type: 'OpeningAdded' | 'AppliedOnOpening' | 'OpeningFilled' | 'LeaderSet' | 'WorkerRoleAccountUpdated' | 'LeaderUnset' | 'WorkerExited' | 'WorkerStartedLeaving' | 'TerminatedWorker' | 'TerminatedLeader' | 'StakeSlashed' | 'StakeDecreased' | 'StakeIncreased' | 'ApplicationWithdrawn' | 'OpeningCanceled' | 'BudgetSet' | 'WorkerRewardAccountUpdated' | 'WorkerRewardAmountUpdated' | 'StatusTextChanged' | 'BudgetSpending' | 'RewardPaid' | 'NewMissedRewardLevelReached' | 'WorkingGroupBudgetFunded' | 'LeadRemarked' | 'WorkerRemarked';
  }

  /** @name PalletWorkingGroupInstance8 (234) */
  export type PalletWorkingGroupInstance8 = Null;

  /** @name PalletWorkingGroupRawEventInstance9 (235) */
  export interface PalletWorkingGroupRawEventInstance9 extends Enum {
    readonly isOpeningAdded: boolean;
    readonly asOpeningAdded: ITuple<[u64, Bytes, PalletWorkingGroupOpeningType, PalletWorkingGroupStakePolicy, Option<u128>]>;
    readonly isAppliedOnOpening: boolean;
    readonly asAppliedOnOpening: ITuple<[PalletWorkingGroupApplyOnOpeningParams, u64]>;
    readonly isOpeningFilled: boolean;
    readonly asOpeningFilled: ITuple<[u64, BTreeMap<u64, u64>, BTreeSet<u64>]>;
    readonly isLeaderSet: boolean;
    readonly asLeaderSet: u64;
    readonly isWorkerRoleAccountUpdated: boolean;
    readonly asWorkerRoleAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isLeaderUnset: boolean;
    readonly isWorkerExited: boolean;
    readonly asWorkerExited: u64;
    readonly isWorkerStartedLeaving: boolean;
    readonly asWorkerStartedLeaving: ITuple<[u64, Option<Bytes>]>;
    readonly isTerminatedWorker: boolean;
    readonly asTerminatedWorker: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isTerminatedLeader: boolean;
    readonly asTerminatedLeader: ITuple<[u64, Option<u128>, Option<Bytes>]>;
    readonly isStakeSlashed: boolean;
    readonly asStakeSlashed: ITuple<[u64, u128, u128, Option<Bytes>]>;
    readonly isStakeDecreased: boolean;
    readonly asStakeDecreased: ITuple<[u64, u128]>;
    readonly isStakeIncreased: boolean;
    readonly asStakeIncreased: ITuple<[u64, u128]>;
    readonly isApplicationWithdrawn: boolean;
    readonly asApplicationWithdrawn: u64;
    readonly isOpeningCanceled: boolean;
    readonly asOpeningCanceled: u64;
    readonly isBudgetSet: boolean;
    readonly asBudgetSet: u128;
    readonly isWorkerRewardAccountUpdated: boolean;
    readonly asWorkerRewardAccountUpdated: ITuple<[u64, AccountId32]>;
    readonly isWorkerRewardAmountUpdated: boolean;
    readonly asWorkerRewardAmountUpdated: ITuple<[u64, Option<u128>]>;
    readonly isStatusTextChanged: boolean;
    readonly asStatusTextChanged: ITuple<[H256, Option<Bytes>]>;
    readonly isBudgetSpending: boolean;
    readonly asBudgetSpending: ITuple<[AccountId32, u128, Option<Bytes>]>;
    readonly isRewardPaid: boolean;
    readonly asRewardPaid: ITuple<[u64, AccountId32, u128, PalletWorkingGroupRewardPaymentType]>;
    readonly isNewMissedRewardLevelReached: boolean;
    readonly asNewMissedRewardLevelReached: ITuple<[u64, Option<u128>]>;
    readonly isWorkingGroupBudgetFunded: boolean;
    readonly asWorkingGroupBudgetFunded: ITuple<[u64, u128, Bytes]>;
    readonly isLeadRemarked: boolean;
    readonly asLeadRemarked: Bytes;
    readonly isWorkerRemarked: boolean;
    readonly asWorkerRemarked: ITuple<[u64, Bytes]>;
    readonly type: 'OpeningAdded' | 'AppliedOnOpening' | 'OpeningFilled' | 'LeaderSet' | 'WorkerRoleAccountUpdated' | 'LeaderUnset' | 'WorkerExited' | 'WorkerStartedLeaving' | 'TerminatedWorker' | 'TerminatedLeader' | 'StakeSlashed' | 'StakeDecreased' | 'StakeIncreased' | 'ApplicationWithdrawn' | 'OpeningCanceled' | 'BudgetSet' | 'WorkerRewardAccountUpdated' | 'WorkerRewardAmountUpdated' | 'StatusTextChanged' | 'BudgetSpending' | 'RewardPaid' | 'NewMissedRewardLevelReached' | 'WorkingGroupBudgetFunded' | 'LeadRemarked' | 'WorkerRemarked';
  }

  /** @name PalletWorkingGroupInstance9 (236) */
  export type PalletWorkingGroupInstance9 = Null;

  /** @name FrameSystemPhase (237) */
  export interface FrameSystemPhase extends Enum {
    readonly isApplyExtrinsic: boolean;
    readonly asApplyExtrinsic: u32;
    readonly isFinalization: boolean;
    readonly isInitialization: boolean;
    readonly type: 'ApplyExtrinsic' | 'Finalization' | 'Initialization';
  }

  /** @name FrameSystemLastRuntimeUpgradeInfo (241) */
  export interface FrameSystemLastRuntimeUpgradeInfo extends Struct {
    readonly specVersion: Compact<u32>;
    readonly specName: Text;
  }

  /** @name FrameSystemCall (244) */
  export interface FrameSystemCall extends Enum {
    readonly isFillBlock: boolean;
    readonly asFillBlock: {
      readonly ratio: Perbill;
    } & Struct;
    readonly isRemark: boolean;
    readonly asRemark: {
      readonly remark: Bytes;
    } & Struct;
    readonly isSetHeapPages: boolean;
    readonly asSetHeapPages: {
      readonly pages: u64;
    } & Struct;
    readonly isSetCode: boolean;
    readonly asSetCode: {
      readonly code: Bytes;
    } & Struct;
    readonly isSetCodeWithoutChecks: boolean;
    readonly asSetCodeWithoutChecks: {
      readonly code: Bytes;
    } & Struct;
    readonly isSetStorage: boolean;
    readonly asSetStorage: {
      readonly items: Vec<ITuple<[Bytes, Bytes]>>;
    } & Struct;
    readonly isKillStorage: boolean;
    readonly asKillStorage: {
      readonly keys_: Vec<Bytes>;
    } & Struct;
    readonly isKillPrefix: boolean;
    readonly asKillPrefix: {
      readonly prefix: Bytes;
      readonly subkeys: u32;
    } & Struct;
    readonly isRemarkWithEvent: boolean;
    readonly asRemarkWithEvent: {
      readonly remark: Bytes;
    } & Struct;
    readonly type: 'FillBlock' | 'Remark' | 'SetHeapPages' | 'SetCode' | 'SetCodeWithoutChecks' | 'SetStorage' | 'KillStorage' | 'KillPrefix' | 'RemarkWithEvent';
  }

  /** @name FrameSystemLimitsBlockWeights (247) */
  export interface FrameSystemLimitsBlockWeights extends Struct {
    readonly baseBlock: u64;
    readonly maxBlock: u64;
    readonly perClass: FrameSupportWeightsPerDispatchClassWeightsPerClass;
  }

  /** @name FrameSupportWeightsPerDispatchClassWeightsPerClass (248) */
  export interface FrameSupportWeightsPerDispatchClassWeightsPerClass extends Struct {
    readonly normal: FrameSystemLimitsWeightsPerClass;
    readonly operational: FrameSystemLimitsWeightsPerClass;
    readonly mandatory: FrameSystemLimitsWeightsPerClass;
  }

  /** @name FrameSystemLimitsWeightsPerClass (249) */
  export interface FrameSystemLimitsWeightsPerClass extends Struct {
    readonly baseExtrinsic: u64;
    readonly maxExtrinsic: Option<u64>;
    readonly maxTotal: Option<u64>;
    readonly reserved: Option<u64>;
  }

  /** @name FrameSystemLimitsBlockLength (250) */
  export interface FrameSystemLimitsBlockLength extends Struct {
    readonly max: FrameSupportWeightsPerDispatchClassU32;
  }

  /** @name FrameSupportWeightsPerDispatchClassU32 (251) */
  export interface FrameSupportWeightsPerDispatchClassU32 extends Struct {
    readonly normal: u32;
    readonly operational: u32;
    readonly mandatory: u32;
  }

  /** @name FrameSupportWeightsRuntimeDbWeight (252) */
  export interface FrameSupportWeightsRuntimeDbWeight extends Struct {
    readonly read: u64;
    readonly write: u64;
  }

  /** @name SpVersionRuntimeVersion (253) */
  export interface SpVersionRuntimeVersion extends Struct {
    readonly specName: Text;
    readonly implName: Text;
    readonly authoringVersion: u32;
    readonly specVersion: u32;
    readonly implVersion: u32;
    readonly apis: Vec<ITuple<[U8aFixed, u32]>>;
    readonly transactionVersion: u32;
    readonly stateVersion: u8;
  }

  /** @name FrameSystemError (259) */
  export interface FrameSystemError extends Enum {
    readonly isInvalidSpecName: boolean;
    readonly isSpecVersionNeedsToIncrease: boolean;
    readonly isFailedToExtractRuntimeVersion: boolean;
    readonly isNonDefaultComposite: boolean;
    readonly isNonZeroRefCount: boolean;
    readonly isCallFiltered: boolean;
    readonly type: 'InvalidSpecName' | 'SpecVersionNeedsToIncrease' | 'FailedToExtractRuntimeVersion' | 'NonDefaultComposite' | 'NonZeroRefCount' | 'CallFiltered';
  }

  /** @name PalletUtilityCall (260) */
  export interface PalletUtilityCall extends Enum {
    readonly isBatch: boolean;
    readonly asBatch: {
      readonly calls: Vec<Call>;
    } & Struct;
    readonly isAsDerivative: boolean;
    readonly asAsDerivative: {
      readonly index: u16;
      readonly call: Call;
    } & Struct;
    readonly isBatchAll: boolean;
    readonly asBatchAll: {
      readonly calls: Vec<Call>;
    } & Struct;
    readonly isDispatchAs: boolean;
    readonly asDispatchAs: {
      readonly asOrigin: JoystreamNodeRuntimeOriginCaller;
      readonly call: Call;
    } & Struct;
    readonly isForceBatch: boolean;
    readonly asForceBatch: {
      readonly calls: Vec<Call>;
    } & Struct;
    readonly type: 'Batch' | 'AsDerivative' | 'BatchAll' | 'DispatchAs' | 'ForceBatch';
  }

  /** @name PalletBabeCall (263) */
  export interface PalletBabeCall extends Enum {
    readonly isReportEquivocation: boolean;
    readonly asReportEquivocation: {
      readonly equivocationProof: SpConsensusSlotsEquivocationProof;
      readonly keyOwnerProof: SpSessionMembershipProof;
    } & Struct;
    readonly isReportEquivocationUnsigned: boolean;
    readonly asReportEquivocationUnsigned: {
      readonly equivocationProof: SpConsensusSlotsEquivocationProof;
      readonly keyOwnerProof: SpSessionMembershipProof;
    } & Struct;
    readonly isPlanConfigChange: boolean;
    readonly asPlanConfigChange: {
      readonly config: SpConsensusBabeDigestsNextConfigDescriptor;
    } & Struct;
    readonly type: 'ReportEquivocation' | 'ReportEquivocationUnsigned' | 'PlanConfigChange';
  }

  /** @name SpConsensusSlotsEquivocationProof (264) */
  export interface SpConsensusSlotsEquivocationProof extends Struct {
    readonly offender: SpConsensusBabeAppPublic;
    readonly slot: u64;
    readonly firstHeader: SpRuntimeHeader;
    readonly secondHeader: SpRuntimeHeader;
  }

  /** @name SpRuntimeHeader (265) */
  export interface SpRuntimeHeader extends Struct {
    readonly parentHash: H256;
    readonly number: Compact<u32>;
    readonly stateRoot: H256;
    readonly extrinsicsRoot: H256;
    readonly digest: SpRuntimeDigest;
  }

  /** @name SpRuntimeBlakeTwo256 (266) */
  export type SpRuntimeBlakeTwo256 = Null;

  /** @name SpConsensusBabeAppPublic (267) */
  export interface SpConsensusBabeAppPublic extends SpCoreSr25519Public {}

  /** @name SpSessionMembershipProof (269) */
  export interface SpSessionMembershipProof extends Struct {
    readonly session: u32;
    readonly trieNodes: Vec<Bytes>;
    readonly validatorCount: u32;
  }

  /** @name SpConsensusBabeDigestsNextConfigDescriptor (270) */
  export interface SpConsensusBabeDigestsNextConfigDescriptor extends Enum {
    readonly isV1: boolean;
    readonly asV1: {
      readonly c: ITuple<[u64, u64]>;
      readonly allowedSlots: SpConsensusBabeAllowedSlots;
    } & Struct;
    readonly type: 'V1';
  }

  /** @name SpConsensusBabeAllowedSlots (271) */
  export interface SpConsensusBabeAllowedSlots extends Enum {
    readonly isPrimarySlots: boolean;
    readonly isPrimaryAndSecondaryPlainSlots: boolean;
    readonly isPrimaryAndSecondaryVRFSlots: boolean;
    readonly type: 'PrimarySlots' | 'PrimaryAndSecondaryPlainSlots' | 'PrimaryAndSecondaryVRFSlots';
  }

  /** @name PalletTimestampCall (272) */
  export interface PalletTimestampCall extends Enum {
    readonly isSet: boolean;
    readonly asSet: {
      readonly now: Compact<u64>;
    } & Struct;
    readonly type: 'Set';
  }

  /** @name PalletAuthorshipCall (274) */
  export interface PalletAuthorshipCall extends Enum {
    readonly isSetUncles: boolean;
    readonly asSetUncles: {
      readonly newUncles: Vec<SpRuntimeHeader>;
    } & Struct;
    readonly type: 'SetUncles';
  }

  /** @name PalletBalancesCall (276) */
  export interface PalletBalancesCall extends Enum {
    readonly isTransfer: boolean;
    readonly asTransfer: {
      readonly dest: AccountId32;
      readonly value: Compact<u128>;
    } & Struct;
    readonly isSetBalance: boolean;
    readonly asSetBalance: {
      readonly who: AccountId32;
      readonly newFree: Compact<u128>;
      readonly newReserved: Compact<u128>;
    } & Struct;
    readonly isForceTransfer: boolean;
    readonly asForceTransfer: {
      readonly source: AccountId32;
      readonly dest: AccountId32;
      readonly value: Compact<u128>;
    } & Struct;
    readonly isTransferKeepAlive: boolean;
    readonly asTransferKeepAlive: {
      readonly dest: AccountId32;
      readonly value: Compact<u128>;
    } & Struct;
    readonly isTransferAll: boolean;
    readonly asTransferAll: {
      readonly dest: AccountId32;
      readonly keepAlive: bool;
    } & Struct;
    readonly isForceUnreserve: boolean;
    readonly asForceUnreserve: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly type: 'Transfer' | 'SetBalance' | 'ForceTransfer' | 'TransferKeepAlive' | 'TransferAll' | 'ForceUnreserve';
  }

  /** @name PalletElectionProviderMultiPhaseCall (277) */
  export interface PalletElectionProviderMultiPhaseCall extends Enum {
    readonly isSubmitUnsigned: boolean;
    readonly asSubmitUnsigned: {
      readonly rawSolution: PalletElectionProviderMultiPhaseRawSolution;
      readonly witness: PalletElectionProviderMultiPhaseSolutionOrSnapshotSize;
    } & Struct;
    readonly isSetMinimumUntrustedScore: boolean;
    readonly asSetMinimumUntrustedScore: {
      readonly maybeNextScore: Option<SpNposElectionsElectionScore>;
    } & Struct;
    readonly isSetEmergencyElectionResult: boolean;
    readonly asSetEmergencyElectionResult: {
      readonly supports: Vec<ITuple<[AccountId32, SpNposElectionsSupport]>>;
    } & Struct;
    readonly isSubmit: boolean;
    readonly asSubmit: {
      readonly rawSolution: PalletElectionProviderMultiPhaseRawSolution;
    } & Struct;
    readonly isGovernanceFallback: boolean;
    readonly asGovernanceFallback: {
      readonly maybeMaxVoters: Option<u32>;
      readonly maybeMaxTargets: Option<u32>;
    } & Struct;
    readonly type: 'SubmitUnsigned' | 'SetMinimumUntrustedScore' | 'SetEmergencyElectionResult' | 'Submit' | 'GovernanceFallback';
  }

  /** @name PalletElectionProviderMultiPhaseRawSolution (278) */
  export interface PalletElectionProviderMultiPhaseRawSolution extends Struct {
    readonly solution: JoystreamNodeRuntimeNposSolution16;
    readonly score: SpNposElectionsElectionScore;
    readonly round: u32;
  }

  /** @name JoystreamNodeRuntimeNposSolution16 (279) */
  export interface JoystreamNodeRuntimeNposSolution16 extends Struct {
    readonly votes1: Vec<ITuple<[Compact<u32>, Compact<u16>]>>;
    readonly votes2: Vec<ITuple<[Compact<u32>, ITuple<[Compact<u16>, Compact<PerU16>]>, Compact<u16>]>>;
    readonly votes3: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes4: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes5: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes6: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes7: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes8: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes9: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes10: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes11: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes12: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes13: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes14: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes15: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
    readonly votes16: Vec<ITuple<[Compact<u32>, Vec<ITuple<[Compact<u16>, Compact<PerU16>]>>, Compact<u16>]>>;
  }

  /** @name SpNposElectionsElectionScore (330) */
  export interface SpNposElectionsElectionScore extends Struct {
    readonly minimalStake: u128;
    readonly sumStake: u128;
    readonly sumStakeSquared: u128;
  }

  /** @name PalletElectionProviderMultiPhaseSolutionOrSnapshotSize (331) */
  export interface PalletElectionProviderMultiPhaseSolutionOrSnapshotSize extends Struct {
    readonly voters: Compact<u32>;
    readonly targets: Compact<u32>;
  }

  /** @name SpNposElectionsSupport (335) */
  export interface SpNposElectionsSupport extends Struct {
    readonly total: u128;
    readonly voters: Vec<ITuple<[AccountId32, u128]>>;
  }

  /** @name PalletStakingPalletCall (338) */
  export interface PalletStakingPalletCall extends Enum {
    readonly isBond: boolean;
    readonly asBond: {
      readonly controller: AccountId32;
      readonly value: Compact<u128>;
      readonly payee: PalletStakingRewardDestination;
    } & Struct;
    readonly isBondExtra: boolean;
    readonly asBondExtra: {
      readonly maxAdditional: Compact<u128>;
    } & Struct;
    readonly isUnbond: boolean;
    readonly asUnbond: {
      readonly value: Compact<u128>;
    } & Struct;
    readonly isWithdrawUnbonded: boolean;
    readonly asWithdrawUnbonded: {
      readonly numSlashingSpans: u32;
    } & Struct;
    readonly isValidate: boolean;
    readonly asValidate: {
      readonly prefs: PalletStakingValidatorPrefs;
    } & Struct;
    readonly isNominate: boolean;
    readonly asNominate: {
      readonly targets: Vec<AccountId32>;
    } & Struct;
    readonly isChill: boolean;
    readonly isSetPayee: boolean;
    readonly asSetPayee: {
      readonly payee: PalletStakingRewardDestination;
    } & Struct;
    readonly isSetController: boolean;
    readonly asSetController: {
      readonly controller: AccountId32;
    } & Struct;
    readonly isSetValidatorCount: boolean;
    readonly asSetValidatorCount: {
      readonly new_: Compact<u32>;
    } & Struct;
    readonly isIncreaseValidatorCount: boolean;
    readonly asIncreaseValidatorCount: {
      readonly additional: Compact<u32>;
    } & Struct;
    readonly isScaleValidatorCount: boolean;
    readonly asScaleValidatorCount: {
      readonly factor: Percent;
    } & Struct;
    readonly isForceNoEras: boolean;
    readonly isForceNewEra: boolean;
    readonly isSetInvulnerables: boolean;
    readonly asSetInvulnerables: {
      readonly invulnerables: Vec<AccountId32>;
    } & Struct;
    readonly isForceUnstake: boolean;
    readonly asForceUnstake: {
      readonly stash: AccountId32;
      readonly numSlashingSpans: u32;
    } & Struct;
    readonly isForceNewEraAlways: boolean;
    readonly isCancelDeferredSlash: boolean;
    readonly asCancelDeferredSlash: {
      readonly era: u32;
      readonly slashIndices: Vec<u32>;
    } & Struct;
    readonly isPayoutStakers: boolean;
    readonly asPayoutStakers: {
      readonly validatorStash: AccountId32;
      readonly era: u32;
    } & Struct;
    readonly isRebond: boolean;
    readonly asRebond: {
      readonly value: Compact<u128>;
    } & Struct;
    readonly isSetHistoryDepth: boolean;
    readonly asSetHistoryDepth: {
      readonly newHistoryDepth: Compact<u32>;
      readonly eraItemsDeleted: Compact<u32>;
    } & Struct;
    readonly isReapStash: boolean;
    readonly asReapStash: {
      readonly stash: AccountId32;
      readonly numSlashingSpans: u32;
    } & Struct;
    readonly isKick: boolean;
    readonly asKick: {
      readonly who: Vec<AccountId32>;
    } & Struct;
    readonly isSetStakingConfigs: boolean;
    readonly asSetStakingConfigs: {
      readonly minNominatorBond: PalletStakingPalletConfigOpU128;
      readonly minValidatorBond: PalletStakingPalletConfigOpU128;
      readonly maxNominatorCount: PalletStakingPalletConfigOpU32;
      readonly maxValidatorCount: PalletStakingPalletConfigOpU32;
      readonly chillThreshold: PalletStakingPalletConfigOpPercent;
      readonly minCommission: PalletStakingPalletConfigOpPerbill;
    } & Struct;
    readonly isChillOther: boolean;
    readonly asChillOther: {
      readonly controller: AccountId32;
    } & Struct;
    readonly isForceApplyMinCommission: boolean;
    readonly asForceApplyMinCommission: {
      readonly validatorStash: AccountId32;
    } & Struct;
    readonly type: 'Bond' | 'BondExtra' | 'Unbond' | 'WithdrawUnbonded' | 'Validate' | 'Nominate' | 'Chill' | 'SetPayee' | 'SetController' | 'SetValidatorCount' | 'IncreaseValidatorCount' | 'ScaleValidatorCount' | 'ForceNoEras' | 'ForceNewEra' | 'SetInvulnerables' | 'ForceUnstake' | 'ForceNewEraAlways' | 'CancelDeferredSlash' | 'PayoutStakers' | 'Rebond' | 'SetHistoryDepth' | 'ReapStash' | 'Kick' | 'SetStakingConfigs' | 'ChillOther' | 'ForceApplyMinCommission';
  }

  /** @name PalletStakingRewardDestination (339) */
  export interface PalletStakingRewardDestination extends Enum {
    readonly isStaked: boolean;
    readonly isStash: boolean;
    readonly isController: boolean;
    readonly isAccount: boolean;
    readonly asAccount: AccountId32;
    readonly isNone: boolean;
    readonly type: 'Staked' | 'Stash' | 'Controller' | 'Account' | 'None';
  }

  /** @name PalletStakingPalletConfigOpU128 (343) */
  export interface PalletStakingPalletConfigOpU128 extends Enum {
    readonly isNoop: boolean;
    readonly isSet: boolean;
    readonly asSet: u128;
    readonly isRemove: boolean;
    readonly type: 'Noop' | 'Set' | 'Remove';
  }

  /** @name PalletStakingPalletConfigOpU32 (344) */
  export interface PalletStakingPalletConfigOpU32 extends Enum {
    readonly isNoop: boolean;
    readonly isSet: boolean;
    readonly asSet: u32;
    readonly isRemove: boolean;
    readonly type: 'Noop' | 'Set' | 'Remove';
  }

  /** @name PalletStakingPalletConfigOpPercent (345) */
  export interface PalletStakingPalletConfigOpPercent extends Enum {
    readonly isNoop: boolean;
    readonly isSet: boolean;
    readonly asSet: Percent;
    readonly isRemove: boolean;
    readonly type: 'Noop' | 'Set' | 'Remove';
  }

  /** @name PalletStakingPalletConfigOpPerbill (346) */
  export interface PalletStakingPalletConfigOpPerbill extends Enum {
    readonly isNoop: boolean;
    readonly isSet: boolean;
    readonly asSet: Perbill;
    readonly isRemove: boolean;
    readonly type: 'Noop' | 'Set' | 'Remove';
  }

  /** @name PalletSessionCall (347) */
  export interface PalletSessionCall extends Enum {
    readonly isSetKeys: boolean;
    readonly asSetKeys: {
      readonly keys_: JoystreamNodeRuntimeSessionKeys;
      readonly proof: Bytes;
    } & Struct;
    readonly isPurgeKeys: boolean;
    readonly type: 'SetKeys' | 'PurgeKeys';
  }

  /** @name JoystreamNodeRuntimeSessionKeys (348) */
  export interface JoystreamNodeRuntimeSessionKeys extends Struct {
    readonly grandpa: SpFinalityGrandpaAppPublic;
    readonly babe: SpConsensusBabeAppPublic;
    readonly imOnline: PalletImOnlineSr25519AppSr25519Public;
    readonly authorityDiscovery: SpAuthorityDiscoveryAppPublic;
  }

  /** @name SpAuthorityDiscoveryAppPublic (349) */
  export interface SpAuthorityDiscoveryAppPublic extends SpCoreSr25519Public {}

  /** @name PalletGrandpaCall (350) */
  export interface PalletGrandpaCall extends Enum {
    readonly isReportEquivocation: boolean;
    readonly asReportEquivocation: {
      readonly equivocationProof: SpFinalityGrandpaEquivocationProof;
      readonly keyOwnerProof: SpSessionMembershipProof;
    } & Struct;
    readonly isReportEquivocationUnsigned: boolean;
    readonly asReportEquivocationUnsigned: {
      readonly equivocationProof: SpFinalityGrandpaEquivocationProof;
      readonly keyOwnerProof: SpSessionMembershipProof;
    } & Struct;
    readonly isNoteStalled: boolean;
    readonly asNoteStalled: {
      readonly delay: u32;
      readonly bestFinalizedBlockNumber: u32;
    } & Struct;
    readonly type: 'ReportEquivocation' | 'ReportEquivocationUnsigned' | 'NoteStalled';
  }

  /** @name SpFinalityGrandpaEquivocationProof (351) */
  export interface SpFinalityGrandpaEquivocationProof extends Struct {
    readonly setId: u64;
    readonly equivocation: SpFinalityGrandpaEquivocation;
  }

  /** @name SpFinalityGrandpaEquivocation (352) */
  export interface SpFinalityGrandpaEquivocation extends Enum {
    readonly isPrevote: boolean;
    readonly asPrevote: FinalityGrandpaEquivocationPrevote;
    readonly isPrecommit: boolean;
    readonly asPrecommit: FinalityGrandpaEquivocationPrecommit;
    readonly type: 'Prevote' | 'Precommit';
  }

  /** @name FinalityGrandpaEquivocationPrevote (353) */
  export interface FinalityGrandpaEquivocationPrevote extends Struct {
    readonly roundNumber: u64;
    readonly identity: SpFinalityGrandpaAppPublic;
    readonly first: ITuple<[FinalityGrandpaPrevote, SpFinalityGrandpaAppSignature]>;
    readonly second: ITuple<[FinalityGrandpaPrevote, SpFinalityGrandpaAppSignature]>;
  }

  /** @name FinalityGrandpaPrevote (354) */
  export interface FinalityGrandpaPrevote extends Struct {
    readonly targetHash: H256;
    readonly targetNumber: u32;
  }

  /** @name SpFinalityGrandpaAppSignature (355) */
  export interface SpFinalityGrandpaAppSignature extends SpCoreEd25519Signature {}

  /** @name SpCoreEd25519Signature (356) */
  export interface SpCoreEd25519Signature extends U8aFixed {}

  /** @name FinalityGrandpaEquivocationPrecommit (359) */
  export interface FinalityGrandpaEquivocationPrecommit extends Struct {
    readonly roundNumber: u64;
    readonly identity: SpFinalityGrandpaAppPublic;
    readonly first: ITuple<[FinalityGrandpaPrecommit, SpFinalityGrandpaAppSignature]>;
    readonly second: ITuple<[FinalityGrandpaPrecommit, SpFinalityGrandpaAppSignature]>;
  }

  /** @name FinalityGrandpaPrecommit (360) */
  export interface FinalityGrandpaPrecommit extends Struct {
    readonly targetHash: H256;
    readonly targetNumber: u32;
  }

  /** @name PalletImOnlineCall (362) */
  export interface PalletImOnlineCall extends Enum {
    readonly isHeartbeat: boolean;
    readonly asHeartbeat: {
      readonly heartbeat: PalletImOnlineHeartbeat;
      readonly signature: PalletImOnlineSr25519AppSr25519Signature;
    } & Struct;
    readonly type: 'Heartbeat';
  }

  /** @name PalletImOnlineHeartbeat (363) */
  export interface PalletImOnlineHeartbeat extends Struct {
    readonly blockNumber: u32;
    readonly networkState: SpCoreOffchainOpaqueNetworkState;
    readonly sessionIndex: u32;
    readonly authorityIndex: u32;
    readonly validatorsLen: u32;
  }

  /** @name SpCoreOffchainOpaqueNetworkState (364) */
  export interface SpCoreOffchainOpaqueNetworkState extends Struct {
    readonly peerId: Bytes;
    readonly externalAddresses: Vec<Bytes>;
  }

  /** @name PalletImOnlineSr25519AppSr25519Signature (368) */
  export interface PalletImOnlineSr25519AppSr25519Signature extends SpCoreSr25519Signature {}

  /** @name SpCoreSr25519Signature (369) */
  export interface SpCoreSr25519Signature extends U8aFixed {}

  /** @name PalletSudoCall (370) */
  export interface PalletSudoCall extends Enum {
    readonly isSudo: boolean;
    readonly asSudo: {
      readonly call: Call;
    } & Struct;
    readonly isSudoUncheckedWeight: boolean;
    readonly asSudoUncheckedWeight: {
      readonly call: Call;
      readonly weight: u64;
    } & Struct;
    readonly isSetKey: boolean;
    readonly asSetKey: {
      readonly new_: AccountId32;
    } & Struct;
    readonly isSudoAs: boolean;
    readonly asSudoAs: {
      readonly who: AccountId32;
      readonly call: Call;
    } & Struct;
    readonly type: 'Sudo' | 'SudoUncheckedWeight' | 'SetKey' | 'SudoAs';
  }

  /** @name PalletBagsListCall (371) */
  export interface PalletBagsListCall extends Enum {
    readonly isRebag: boolean;
    readonly asRebag: {
      readonly dislocated: AccountId32;
    } & Struct;
    readonly isPutInFrontOf: boolean;
    readonly asPutInFrontOf: {
      readonly lighter: AccountId32;
    } & Struct;
    readonly type: 'Rebag' | 'PutInFrontOf';
  }

  /** @name PalletVestingCall (372) */
  export interface PalletVestingCall extends Enum {
    readonly isVest: boolean;
    readonly isVestOther: boolean;
    readonly asVestOther: {
      readonly target: AccountId32;
    } & Struct;
    readonly isVestedTransfer: boolean;
    readonly asVestedTransfer: {
      readonly target: AccountId32;
      readonly schedule: PalletVestingVestingInfo;
    } & Struct;
    readonly isForceVestedTransfer: boolean;
    readonly asForceVestedTransfer: {
      readonly source: AccountId32;
      readonly target: AccountId32;
      readonly schedule: PalletVestingVestingInfo;
    } & Struct;
    readonly isMergeSchedules: boolean;
    readonly asMergeSchedules: {
      readonly schedule1Index: u32;
      readonly schedule2Index: u32;
    } & Struct;
    readonly type: 'Vest' | 'VestOther' | 'VestedTransfer' | 'ForceVestedTransfer' | 'MergeSchedules';
  }

  /** @name PalletVestingVestingInfo (373) */
  export interface PalletVestingVestingInfo extends Struct {
    readonly locked: u128;
    readonly perBlock: u128;
    readonly startingBlock: u32;
  }

  /** @name PalletMultisigCall (374) */
  export interface PalletMultisigCall extends Enum {
    readonly isAsMultiThreshold1: boolean;
    readonly asAsMultiThreshold1: {
      readonly otherSignatories: Vec<AccountId32>;
      readonly call: Call;
    } & Struct;
    readonly isAsMulti: boolean;
    readonly asAsMulti: {
      readonly threshold: u16;
      readonly otherSignatories: Vec<AccountId32>;
      readonly maybeTimepoint: Option<PalletMultisigTimepoint>;
      readonly call: WrapperKeepOpaque<Call>;
      readonly storeCall: bool;
      readonly maxWeight: u64;
    } & Struct;
    readonly isApproveAsMulti: boolean;
    readonly asApproveAsMulti: {
      readonly threshold: u16;
      readonly otherSignatories: Vec<AccountId32>;
      readonly maybeTimepoint: Option<PalletMultisigTimepoint>;
      readonly callHash: U8aFixed;
      readonly maxWeight: u64;
    } & Struct;
    readonly isCancelAsMulti: boolean;
    readonly asCancelAsMulti: {
      readonly threshold: u16;
      readonly otherSignatories: Vec<AccountId32>;
      readonly timepoint: PalletMultisigTimepoint;
      readonly callHash: U8aFixed;
    } & Struct;
    readonly type: 'AsMultiThreshold1' | 'AsMulti' | 'ApproveAsMulti' | 'CancelAsMulti';
  }

  /** @name PalletCouncilCall (377) */
  export interface PalletCouncilCall extends Enum {
    readonly isAnnounceCandidacy: boolean;
    readonly asAnnounceCandidacy: {
      readonly membershipId: u64;
      readonly stakingAccountId: AccountId32;
      readonly rewardAccountId: AccountId32;
      readonly stake: u128;
    } & Struct;
    readonly isReleaseCandidacyStake: boolean;
    readonly asReleaseCandidacyStake: {
      readonly membershipId: u64;
    } & Struct;
    readonly isWithdrawCandidacy: boolean;
    readonly asWithdrawCandidacy: {
      readonly membershipId: u64;
    } & Struct;
    readonly isSetCandidacyNote: boolean;
    readonly asSetCandidacyNote: {
      readonly membershipId: u64;
      readonly note: Bytes;
    } & Struct;
    readonly isSetBudget: boolean;
    readonly asSetBudget: {
      readonly balance: u128;
    } & Struct;
    readonly isPlanBudgetRefill: boolean;
    readonly asPlanBudgetRefill: {
      readonly nextRefill: u32;
    } & Struct;
    readonly isSetBudgetIncrement: boolean;
    readonly asSetBudgetIncrement: {
      readonly budgetIncrement: u128;
    } & Struct;
    readonly isSetCouncilorReward: boolean;
    readonly asSetCouncilorReward: {
      readonly councilorReward: u128;
    } & Struct;
    readonly isFundingRequest: boolean;
    readonly asFundingRequest: {
      readonly fundingRequests: Vec<PalletCommonFundingRequestParameters>;
    } & Struct;
    readonly isFundCouncilBudget: boolean;
    readonly asFundCouncilBudget: {
      readonly memberId: u64;
      readonly amount: u128;
      readonly rationale: Bytes;
    } & Struct;
    readonly isCouncilorRemark: boolean;
    readonly asCouncilorRemark: {
      readonly councilorId: u64;
      readonly msg: Bytes;
    } & Struct;
    readonly isCandidateRemark: boolean;
    readonly asCandidateRemark: {
      readonly candidateId: u64;
      readonly msg: Bytes;
    } & Struct;
    readonly type: 'AnnounceCandidacy' | 'ReleaseCandidacyStake' | 'WithdrawCandidacy' | 'SetCandidacyNote' | 'SetBudget' | 'PlanBudgetRefill' | 'SetBudgetIncrement' | 'SetCouncilorReward' | 'FundingRequest' | 'FundCouncilBudget' | 'CouncilorRemark' | 'CandidateRemark';
  }

  /** @name PalletReferendumCall (378) */
  export interface PalletReferendumCall extends Enum {
    readonly isVote: boolean;
    readonly asVote: {
      readonly commitment: H256;
      readonly stake: u128;
    } & Struct;
    readonly isRevealVote: boolean;
    readonly asRevealVote: {
      readonly salt: Bytes;
      readonly voteOptionId: u64;
    } & Struct;
    readonly isReleaseVoteStake: boolean;
    readonly type: 'Vote' | 'RevealVote' | 'ReleaseVoteStake';
  }

  /** @name PalletMembershipCall (379) */
  export interface PalletMembershipCall extends Enum {
    readonly isBuyMembership: boolean;
    readonly asBuyMembership: {
      readonly params: PalletMembershipBuyMembershipParameters;
    } & Struct;
    readonly isUpdateProfile: boolean;
    readonly asUpdateProfile: {
      readonly memberId: u64;
      readonly handle: Option<Bytes>;
      readonly metadata: Option<Bytes>;
    } & Struct;
    readonly isUpdateAccounts: boolean;
    readonly asUpdateAccounts: {
      readonly memberId: u64;
      readonly newRootAccount: Option<AccountId32>;
      readonly newControllerAccount: Option<AccountId32>;
    } & Struct;
    readonly isUpdateProfileVerification: boolean;
    readonly asUpdateProfileVerification: {
      readonly workerId: u64;
      readonly targetMemberId: u64;
      readonly isVerified: bool;
    } & Struct;
    readonly isSetReferralCut: boolean;
    readonly asSetReferralCut: {
      readonly percentValue: u8;
    } & Struct;
    readonly isTransferInvites: boolean;
    readonly asTransferInvites: {
      readonly sourceMemberId: u64;
      readonly targetMemberId: u64;
      readonly numberOfInvites: u32;
    } & Struct;
    readonly isInviteMember: boolean;
    readonly asInviteMember: {
      readonly params: PalletMembershipInviteMembershipParameters;
    } & Struct;
    readonly isGiftMembership: boolean;
    readonly asGiftMembership: {
      readonly params: PalletMembershipGiftMembershipParameters;
    } & Struct;
    readonly isSetMembershipPrice: boolean;
    readonly asSetMembershipPrice: {
      readonly newPrice: u128;
    } & Struct;
    readonly isSetLeaderInvitationQuota: boolean;
    readonly asSetLeaderInvitationQuota: {
      readonly invitationQuota: u32;
    } & Struct;
    readonly isSetInitialInvitationBalance: boolean;
    readonly asSetInitialInvitationBalance: {
      readonly newInitialBalance: u128;
    } & Struct;
    readonly isSetInitialInvitationCount: boolean;
    readonly asSetInitialInvitationCount: {
      readonly newInvitationCount: u32;
    } & Struct;
    readonly isAddStakingAccountCandidate: boolean;
    readonly asAddStakingAccountCandidate: {
      readonly memberId: u64;
    } & Struct;
    readonly isRemoveStakingAccount: boolean;
    readonly asRemoveStakingAccount: {
      readonly memberId: u64;
    } & Struct;
    readonly isConfirmStakingAccount: boolean;
    readonly asConfirmStakingAccount: {
      readonly memberId: u64;
      readonly stakingAccountId: AccountId32;
    } & Struct;
    readonly isMemberRemark: boolean;
    readonly asMemberRemark: {
      readonly memberId: u64;
      readonly msg: Bytes;
    } & Struct;
    readonly isCreateMember: boolean;
    readonly asCreateMember: {
      readonly params: PalletMembershipCreateMemberParameters;
    } & Struct;
    readonly type: 'BuyMembership' | 'UpdateProfile' | 'UpdateAccounts' | 'UpdateProfileVerification' | 'SetReferralCut' | 'TransferInvites' | 'InviteMember' | 'GiftMembership' | 'SetMembershipPrice' | 'SetLeaderInvitationQuota' | 'SetInitialInvitationBalance' | 'SetInitialInvitationCount' | 'AddStakingAccountCandidate' | 'RemoveStakingAccount' | 'ConfirmStakingAccount' | 'MemberRemark' | 'CreateMember';
  }

  /** @name PalletForumCall (380) */
  export interface PalletForumCall extends Enum {
    readonly isUpdateCategoryMembershipOfModerator: boolean;
    readonly asUpdateCategoryMembershipOfModerator: {
      readonly moderatorId: u64;
      readonly categoryId: u64;
      readonly newValue: bool;
    } & Struct;
    readonly isCreateCategory: boolean;
    readonly asCreateCategory: {
      readonly parentCategoryId: Option<u64>;
      readonly title: Bytes;
      readonly description: Bytes;
    } & Struct;
    readonly isUpdateCategoryArchivalStatus: boolean;
    readonly asUpdateCategoryArchivalStatus: {
      readonly actor: PalletForumPrivilegedActor;
      readonly categoryId: u64;
      readonly newArchivalStatus: bool;
    } & Struct;
    readonly isUpdateCategoryTitle: boolean;
    readonly asUpdateCategoryTitle: {
      readonly actor: PalletForumPrivilegedActor;
      readonly categoryId: u64;
      readonly title: Bytes;
    } & Struct;
    readonly isUpdateCategoryDescription: boolean;
    readonly asUpdateCategoryDescription: {
      readonly actor: PalletForumPrivilegedActor;
      readonly categoryId: u64;
      readonly description: Bytes;
    } & Struct;
    readonly isDeleteCategory: boolean;
    readonly asDeleteCategory: {
      readonly actor: PalletForumPrivilegedActor;
      readonly categoryId: u64;
    } & Struct;
    readonly isCreateThread: boolean;
    readonly asCreateThread: {
      readonly forumUserId: u64;
      readonly categoryId: u64;
      readonly metadata: Bytes;
      readonly text: Bytes;
    } & Struct;
    readonly isEditThreadMetadata: boolean;
    readonly asEditThreadMetadata: {
      readonly forumUserId: u64;
      readonly categoryId: u64;
      readonly threadId: u64;
      readonly newMetadata: Bytes;
    } & Struct;
    readonly isDeleteThread: boolean;
    readonly asDeleteThread: {
      readonly forumUserId: u64;
      readonly categoryId: u64;
      readonly threadId: u64;
      readonly hide: bool;
    } & Struct;
    readonly isMoveThreadToCategory: boolean;
    readonly asMoveThreadToCategory: {
      readonly actor: PalletForumPrivilegedActor;
      readonly categoryId: u64;
      readonly threadId: u64;
      readonly newCategoryId: u64;
    } & Struct;
    readonly isModerateThread: boolean;
    readonly asModerateThread: {
      readonly actor: PalletForumPrivilegedActor;
      readonly categoryId: u64;
      readonly threadId: u64;
      readonly rationale: Bytes;
    } & Struct;
    readonly isAddPost: boolean;
    readonly asAddPost: {
      readonly forumUserId: u64;
      readonly categoryId: u64;
      readonly threadId: u64;
      readonly text: Bytes;
      readonly editable: bool;
    } & Struct;
    readonly isEditPostText: boolean;
    readonly asEditPostText: {
      readonly forumUserId: u64;
      readonly categoryId: u64;
      readonly threadId: u64;
      readonly postId: u64;
      readonly newText: Bytes;
    } & Struct;
    readonly isModeratePost: boolean;
    readonly asModeratePost: {
      readonly actor: PalletForumPrivilegedActor;
      readonly categoryId: u64;
      readonly threadId: u64;
      readonly postId: u64;
      readonly rationale: Bytes;
    } & Struct;
    readonly isDeletePosts: boolean;
    readonly asDeletePosts: {
      readonly forumUserId: u64;
      readonly posts: BTreeMap<PalletForumExtendedPostIdObject, bool>;
      readonly rationale: Bytes;
    } & Struct;
    readonly isSetStickiedThreads: boolean;
    readonly asSetStickiedThreads: {
      readonly actor: PalletForumPrivilegedActor;
      readonly categoryId: u64;
      readonly stickiedIds: BTreeSet<u64>;
    } & Struct;
    readonly type: 'UpdateCategoryMembershipOfModerator' | 'CreateCategory' | 'UpdateCategoryArchivalStatus' | 'UpdateCategoryTitle' | 'UpdateCategoryDescription' | 'DeleteCategory' | 'CreateThread' | 'EditThreadMetadata' | 'DeleteThread' | 'MoveThreadToCategory' | 'ModerateThread' | 'AddPost' | 'EditPostText' | 'ModeratePost' | 'DeletePosts' | 'SetStickiedThreads';
  }

  /** @name PalletConstitutionCall (381) */
  export interface PalletConstitutionCall extends Enum {
    readonly isAmendConstitution: boolean;
    readonly asAmendConstitution: {
      readonly constitutionText: Bytes;
    } & Struct;
    readonly type: 'AmendConstitution';
  }

  /** @name PalletBountyCall (382) */
  export interface PalletBountyCall extends Enum {
    readonly isCreateBounty: boolean;
    readonly asCreateBounty: {
      readonly params: PalletBountyBountyParametersBTreeSet;
      readonly metadata: Bytes;
    } & Struct;
    readonly isFundBounty: boolean;
    readonly asFundBounty: {
      readonly funder: PalletBountyBountyActor;
      readonly bountyId: u64;
      readonly amount: u128;
    } & Struct;
    readonly isTerminateBounty: boolean;
    readonly asTerminateBounty: {
      readonly bountyId: u64;
    } & Struct;
    readonly isSwitchOracle: boolean;
    readonly asSwitchOracle: {
      readonly newOracle: PalletBountyBountyActor;
      readonly bountyId: u64;
    } & Struct;
    readonly isWithdrawFunding: boolean;
    readonly asWithdrawFunding: {
      readonly funder: PalletBountyBountyActor;
      readonly bountyId: u64;
    } & Struct;
    readonly isAnnounceWorkEntry: boolean;
    readonly asAnnounceWorkEntry: {
      readonly memberId: u64;
      readonly bountyId: u64;
      readonly stakingAccountId: AccountId32;
      readonly workDescription: Bytes;
    } & Struct;
    readonly isSubmitWork: boolean;
    readonly asSubmitWork: {
      readonly memberId: u64;
      readonly bountyId: u64;
      readonly entryId: u64;
      readonly workData: Bytes;
    } & Struct;
    readonly isEndWorkingPeriod: boolean;
    readonly asEndWorkingPeriod: {
      readonly bountyId: u64;
    } & Struct;
    readonly isSubmitOracleJudgment: boolean;
    readonly asSubmitOracleJudgment: {
      readonly bountyId: u64;
      readonly judgment: BTreeMap<u64, PalletBountyOracleWorkEntryJudgment>;
      readonly rationale: Bytes;
    } & Struct;
    readonly isWithdrawEntrantStake: boolean;
    readonly asWithdrawEntrantStake: {
      readonly memberId: u64;
      readonly bountyId: u64;
      readonly entryId: u64;
    } & Struct;
    readonly isWithdrawOracleReward: boolean;
    readonly asWithdrawOracleReward: {
      readonly bountyId: u64;
    } & Struct;
    readonly isContributorRemark: boolean;
    readonly asContributorRemark: {
      readonly contributor: PalletBountyBountyActor;
      readonly bountyId: u64;
      readonly msg: Bytes;
    } & Struct;
    readonly isOracleRemark: boolean;
    readonly asOracleRemark: {
      readonly oracle: PalletBountyBountyActor;
      readonly bountyId: u64;
      readonly msg: Bytes;
    } & Struct;
    readonly isEntrantRemark: boolean;
    readonly asEntrantRemark: {
      readonly entrantId: u64;
      readonly bountyId: u64;
      readonly entryId: u64;
      readonly msg: Bytes;
    } & Struct;
    readonly isCreatorRemark: boolean;
    readonly asCreatorRemark: {
      readonly creator: PalletBountyBountyActor;
      readonly bountyId: u64;
      readonly msg: Bytes;
    } & Struct;
    readonly type: 'CreateBounty' | 'FundBounty' | 'TerminateBounty' | 'SwitchOracle' | 'WithdrawFunding' | 'AnnounceWorkEntry' | 'SubmitWork' | 'EndWorkingPeriod' | 'SubmitOracleJudgment' | 'WithdrawEntrantStake' | 'WithdrawOracleReward' | 'ContributorRemark' | 'OracleRemark' | 'EntrantRemark' | 'CreatorRemark';
  }

  /** @name PalletContentCall (384) */
  export interface PalletContentCall extends Enum {
    readonly isCreateCuratorGroup: boolean;
    readonly asCreateCuratorGroup: {
      readonly isActive: bool;
      readonly permissionsByLevel: BTreeMap<u8, BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsContentModerationAction>>;
    } & Struct;
    readonly isUpdateCuratorGroupPermissions: boolean;
    readonly asUpdateCuratorGroupPermissions: {
      readonly curatorGroupId: u64;
      readonly permissionsByLevel: BTreeMap<u8, BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsContentModerationAction>>;
    } & Struct;
    readonly isSetCuratorGroupStatus: boolean;
    readonly asSetCuratorGroupStatus: {
      readonly curatorGroupId: u64;
      readonly isActive: bool;
    } & Struct;
    readonly isAddCuratorToGroup: boolean;
    readonly asAddCuratorToGroup: {
      readonly curatorGroupId: u64;
      readonly curatorId: u64;
      readonly permissions: BTreeSet<PalletContentIterableEnumsChannelActionPermission>;
    } & Struct;
    readonly isRemoveCuratorFromGroup: boolean;
    readonly asRemoveCuratorFromGroup: {
      readonly curatorGroupId: u64;
      readonly curatorId: u64;
    } & Struct;
    readonly isCreateChannel: boolean;
    readonly asCreateChannel: {
      readonly channelOwner: PalletContentChannelOwner;
      readonly params: PalletContentChannelCreationParametersRecord;
    } & Struct;
    readonly isUpdateChannel: boolean;
    readonly asUpdateChannel: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
      readonly params: PalletContentChannelUpdateParametersRecord;
    } & Struct;
    readonly isUpdateChannelPrivilegeLevel: boolean;
    readonly asUpdateChannelPrivilegeLevel: {
      readonly channelId: u64;
      readonly newPrivilegeLevel: u8;
    } & Struct;
    readonly isSetChannelPausedFeaturesAsModerator: boolean;
    readonly asSetChannelPausedFeaturesAsModerator: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
      readonly newPausedFeatures: BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsPausableChannelFeature>;
      readonly rationale: Bytes;
    } & Struct;
    readonly isDeleteChannel: boolean;
    readonly asDeleteChannel: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
      readonly channelBagWitness: PalletContentChannelBagWitness;
      readonly numObjectsToDelete: u64;
    } & Struct;
    readonly isDeleteChannelAssetsAsModerator: boolean;
    readonly asDeleteChannelAssetsAsModerator: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
      readonly assetsToRemove: BTreeSet<u64>;
      readonly storageBucketsNumWitness: u32;
      readonly rationale: Bytes;
    } & Struct;
    readonly isDeleteChannelAsModerator: boolean;
    readonly asDeleteChannelAsModerator: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
      readonly channelBagWitness: PalletContentChannelBagWitness;
      readonly numObjectsToDelete: u64;
      readonly rationale: Bytes;
    } & Struct;
    readonly isSetChannelVisibilityAsModerator: boolean;
    readonly asSetChannelVisibilityAsModerator: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
      readonly isHidden: bool;
      readonly rationale: Bytes;
    } & Struct;
    readonly isCreateVideo: boolean;
    readonly asCreateVideo: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
      readonly params: PalletContentVideoCreationParametersRecord;
    } & Struct;
    readonly isUpdateVideo: boolean;
    readonly asUpdateVideo: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly videoId: u64;
      readonly params: PalletContentVideoUpdateParametersRecord;
    } & Struct;
    readonly isDeleteVideo: boolean;
    readonly asDeleteVideo: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly videoId: u64;
      readonly numObjectsToDelete: u64;
      readonly storageBucketsNumWitness: Option<u32>;
    } & Struct;
    readonly isDeleteVideoAssetsAsModerator: boolean;
    readonly asDeleteVideoAssetsAsModerator: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly videoId: u64;
      readonly storageBucketsNumWitness: u32;
      readonly assetsToRemove: BTreeSet<u64>;
      readonly rationale: Bytes;
    } & Struct;
    readonly isDeleteVideoAsModerator: boolean;
    readonly asDeleteVideoAsModerator: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly videoId: u64;
      readonly storageBucketsNumWitness: Option<u32>;
      readonly numObjectsToDelete: u64;
      readonly rationale: Bytes;
    } & Struct;
    readonly isSetVideoVisibilityAsModerator: boolean;
    readonly asSetVideoVisibilityAsModerator: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly videoId: u64;
      readonly isHidden: bool;
      readonly rationale: Bytes;
    } & Struct;
    readonly isUpdateChannelPayouts: boolean;
    readonly asUpdateChannelPayouts: {
      readonly params: PalletContentUpdateChannelPayoutsParametersRecord;
    } & Struct;
    readonly isClaimChannelReward: boolean;
    readonly asClaimChannelReward: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly proof: Vec<PalletCommonMerkleTreeProofElementRecord>;
      readonly item: PalletContentPullPaymentElement;
    } & Struct;
    readonly isWithdrawFromChannelBalance: boolean;
    readonly asWithdrawFromChannelBalance: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
      readonly amount: u128;
    } & Struct;
    readonly isUpdateChannelStateBloatBond: boolean;
    readonly asUpdateChannelStateBloatBond: {
      readonly newChannelStateBloatBond: u128;
    } & Struct;
    readonly isUpdateVideoStateBloatBond: boolean;
    readonly asUpdateVideoStateBloatBond: {
      readonly newVideoStateBloatBond: u128;
    } & Struct;
    readonly isClaimAndWithdrawChannelReward: boolean;
    readonly asClaimAndWithdrawChannelReward: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly proof: Vec<PalletCommonMerkleTreeProofElementRecord>;
      readonly item: PalletContentPullPaymentElement;
    } & Struct;
    readonly isIssueNft: boolean;
    readonly asIssueNft: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly videoId: u64;
      readonly params: PalletContentNftTypesNftIssuanceParametersRecord;
    } & Struct;
    readonly isDestroyNft: boolean;
    readonly asDestroyNft: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly videoId: u64;
    } & Struct;
    readonly isStartOpenAuction: boolean;
    readonly asStartOpenAuction: {
      readonly ownerId: PalletContentPermissionsContentActor;
      readonly videoId: u64;
      readonly auctionParams: PalletContentNftTypesOpenAuctionParamsRecord;
    } & Struct;
    readonly isStartEnglishAuction: boolean;
    readonly asStartEnglishAuction: {
      readonly ownerId: PalletContentPermissionsContentActor;
      readonly videoId: u64;
      readonly auctionParams: PalletContentNftTypesEnglishAuctionParamsRecord;
    } & Struct;
    readonly isCancelEnglishAuction: boolean;
    readonly asCancelEnglishAuction: {
      readonly ownerId: PalletContentPermissionsContentActor;
      readonly videoId: u64;
    } & Struct;
    readonly isCancelOpenAuction: boolean;
    readonly asCancelOpenAuction: {
      readonly ownerId: PalletContentPermissionsContentActor;
      readonly videoId: u64;
    } & Struct;
    readonly isCancelOffer: boolean;
    readonly asCancelOffer: {
      readonly ownerId: PalletContentPermissionsContentActor;
      readonly videoId: u64;
    } & Struct;
    readonly isCancelBuyNow: boolean;
    readonly asCancelBuyNow: {
      readonly ownerId: PalletContentPermissionsContentActor;
      readonly videoId: u64;
    } & Struct;
    readonly isUpdateBuyNowPrice: boolean;
    readonly asUpdateBuyNowPrice: {
      readonly ownerId: PalletContentPermissionsContentActor;
      readonly videoId: u64;
      readonly newPrice: u128;
    } & Struct;
    readonly isMakeOpenAuctionBid: boolean;
    readonly asMakeOpenAuctionBid: {
      readonly participantId: u64;
      readonly videoId: u64;
      readonly bidAmount: u128;
    } & Struct;
    readonly isMakeEnglishAuctionBid: boolean;
    readonly asMakeEnglishAuctionBid: {
      readonly participantId: u64;
      readonly videoId: u64;
      readonly bidAmount: u128;
    } & Struct;
    readonly isCancelOpenAuctionBid: boolean;
    readonly asCancelOpenAuctionBid: {
      readonly participantId: u64;
      readonly videoId: u64;
    } & Struct;
    readonly isSettleEnglishAuction: boolean;
    readonly asSettleEnglishAuction: {
      readonly videoId: u64;
    } & Struct;
    readonly isPickOpenAuctionWinner: boolean;
    readonly asPickOpenAuctionWinner: {
      readonly ownerId: PalletContentPermissionsContentActor;
      readonly videoId: u64;
      readonly winnerId: u64;
      readonly commit: u128;
    } & Struct;
    readonly isOfferNft: boolean;
    readonly asOfferNft: {
      readonly videoId: u64;
      readonly ownerId: PalletContentPermissionsContentActor;
      readonly to: u64;
      readonly price: Option<u128>;
    } & Struct;
    readonly isSlingNftBack: boolean;
    readonly asSlingNftBack: {
      readonly videoId: u64;
      readonly ownerId: PalletContentPermissionsContentActor;
    } & Struct;
    readonly isAcceptIncomingOffer: boolean;
    readonly asAcceptIncomingOffer: {
      readonly videoId: u64;
      readonly witnessPrice: Option<u128>;
    } & Struct;
    readonly isSellNft: boolean;
    readonly asSellNft: {
      readonly videoId: u64;
      readonly ownerId: PalletContentPermissionsContentActor;
      readonly price: u128;
    } & Struct;
    readonly isBuyNft: boolean;
    readonly asBuyNft: {
      readonly videoId: u64;
      readonly participantId: u64;
      readonly witnessPrice: u128;
    } & Struct;
    readonly isToggleNftLimits: boolean;
    readonly asToggleNftLimits: {
      readonly enabled: bool;
    } & Struct;
    readonly isChannelOwnerRemark: boolean;
    readonly asChannelOwnerRemark: {
      readonly channelId: u64;
      readonly msg: Bytes;
    } & Struct;
    readonly isChannelAgentRemark: boolean;
    readonly asChannelAgentRemark: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
      readonly msg: Bytes;
    } & Struct;
    readonly isNftOwnerRemark: boolean;
    readonly asNftOwnerRemark: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly videoId: u64;
      readonly msg: Bytes;
    } & Struct;
    readonly isInitializeChannelTransfer: boolean;
    readonly asInitializeChannelTransfer: {
      readonly channelId: u64;
      readonly actor: PalletContentPermissionsContentActor;
      readonly transferParams: PalletContentInitTransferParameters;
    } & Struct;
    readonly isCancelChannelTransfer: boolean;
    readonly asCancelChannelTransfer: {
      readonly channelId: u64;
      readonly actor: PalletContentPermissionsContentActor;
    } & Struct;
    readonly isAcceptChannelTransfer: boolean;
    readonly asAcceptChannelTransfer: {
      readonly channelId: u64;
      readonly commitmentParams: PalletContentTransferCommitmentParametersBTreeMap;
    } & Struct;
    readonly isUpdateGlobalNftLimit: boolean;
    readonly asUpdateGlobalNftLimit: {
      readonly nftLimitPeriod: PalletContentNftLimitPeriod;
      readonly limit: u64;
    } & Struct;
    readonly isUpdateChannelNftLimit: boolean;
    readonly asUpdateChannelNftLimit: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly nftLimitPeriod: PalletContentNftLimitPeriod;
      readonly channelId: u64;
      readonly limit: u64;
    } & Struct;
    readonly isIssueCreatorToken: boolean;
    readonly asIssueCreatorToken: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
      readonly params: PalletProjectTokenTokenIssuanceParameters;
    } & Struct;
    readonly isInitCreatorTokenSale: boolean;
    readonly asInitCreatorTokenSale: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
      readonly params: PalletProjectTokenTokenSaleParams;
    } & Struct;
    readonly isUpdateUpcomingCreatorTokenSale: boolean;
    readonly asUpdateUpcomingCreatorTokenSale: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
      readonly newStartBlock: Option<u32>;
      readonly newDuration: Option<u32>;
    } & Struct;
    readonly isCreatorTokenIssuerTransfer: boolean;
    readonly asCreatorTokenIssuerTransfer: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
      readonly outputs: PalletProjectTokenTransfersPaymentWithVesting;
      readonly metadata: Bytes;
    } & Struct;
    readonly isMakeCreatorTokenPermissionless: boolean;
    readonly asMakeCreatorTokenPermissionless: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
    } & Struct;
    readonly isReduceCreatorTokenPatronageRateTo: boolean;
    readonly asReduceCreatorTokenPatronageRateTo: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
      readonly targetRate: Permill;
    } & Struct;
    readonly isClaimCreatorTokenPatronageCredit: boolean;
    readonly asClaimCreatorTokenPatronageCredit: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
    } & Struct;
    readonly isIssueRevenueSplit: boolean;
    readonly asIssueRevenueSplit: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
      readonly start: Option<u32>;
      readonly duration: u32;
    } & Struct;
    readonly isFinalizeRevenueSplit: boolean;
    readonly asFinalizeRevenueSplit: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
    } & Struct;
    readonly isFinalizeCreatorTokenSale: boolean;
    readonly asFinalizeCreatorTokenSale: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
    } & Struct;
    readonly isDeissueCreatorToken: boolean;
    readonly asDeissueCreatorToken: {
      readonly actor: PalletContentPermissionsContentActor;
      readonly channelId: u64;
    } & Struct;
    readonly type: 'CreateCuratorGroup' | 'UpdateCuratorGroupPermissions' | 'SetCuratorGroupStatus' | 'AddCuratorToGroup' | 'RemoveCuratorFromGroup' | 'CreateChannel' | 'UpdateChannel' | 'UpdateChannelPrivilegeLevel' | 'SetChannelPausedFeaturesAsModerator' | 'DeleteChannel' | 'DeleteChannelAssetsAsModerator' | 'DeleteChannelAsModerator' | 'SetChannelVisibilityAsModerator' | 'CreateVideo' | 'UpdateVideo' | 'DeleteVideo' | 'DeleteVideoAssetsAsModerator' | 'DeleteVideoAsModerator' | 'SetVideoVisibilityAsModerator' | 'UpdateChannelPayouts' | 'ClaimChannelReward' | 'WithdrawFromChannelBalance' | 'UpdateChannelStateBloatBond' | 'UpdateVideoStateBloatBond' | 'ClaimAndWithdrawChannelReward' | 'IssueNft' | 'DestroyNft' | 'StartOpenAuction' | 'StartEnglishAuction' | 'CancelEnglishAuction' | 'CancelOpenAuction' | 'CancelOffer' | 'CancelBuyNow' | 'UpdateBuyNowPrice' | 'MakeOpenAuctionBid' | 'MakeEnglishAuctionBid' | 'CancelOpenAuctionBid' | 'SettleEnglishAuction' | 'PickOpenAuctionWinner' | 'OfferNft' | 'SlingNftBack' | 'AcceptIncomingOffer' | 'SellNft' | 'BuyNft' | 'ToggleNftLimits' | 'ChannelOwnerRemark' | 'ChannelAgentRemark' | 'NftOwnerRemark' | 'InitializeChannelTransfer' | 'CancelChannelTransfer' | 'AcceptChannelTransfer' | 'UpdateGlobalNftLimit' | 'UpdateChannelNftLimit' | 'IssueCreatorToken' | 'InitCreatorTokenSale' | 'UpdateUpcomingCreatorTokenSale' | 'CreatorTokenIssuerTransfer' | 'MakeCreatorTokenPermissionless' | 'ReduceCreatorTokenPatronageRateTo' | 'ClaimCreatorTokenPatronageCredit' | 'IssueRevenueSplit' | 'FinalizeRevenueSplit' | 'FinalizeCreatorTokenSale' | 'DeissueCreatorToken';
  }

  /** @name PalletContentChannelBagWitness (385) */
  export interface PalletContentChannelBagWitness extends Struct {
    readonly storageBucketsNum: u32;
    readonly distributionBucketsNum: u32;
  }

  /** @name PalletCommonMerkleTreeProofElementRecord (387) */
  export interface PalletCommonMerkleTreeProofElementRecord extends Struct {
    readonly hash_: H256;
    readonly side: PalletCommonMerkleTreeSide;
  }

  /** @name PalletCommonMerkleTreeSide (388) */
  export interface PalletCommonMerkleTreeSide extends Enum {
    readonly isLeft: boolean;
    readonly isRight: boolean;
    readonly type: 'Left' | 'Right';
  }

  /** @name PalletContentPullPaymentElement (389) */
  export interface PalletContentPullPaymentElement extends Struct {
    readonly channelId: u64;
    readonly cumulativeRewardEarned: u128;
    readonly reason: H256;
  }

  /** @name PalletContentInitTransferParameters (390) */
  export interface PalletContentInitTransferParameters extends Struct {
    readonly newCollaborators: BTreeMap<u64, BTreeSet<PalletContentIterableEnumsChannelActionPermission>>;
    readonly price: u128;
    readonly newOwner: PalletContentChannelOwner;
  }

  /** @name PalletProjectTokenTokenSaleParams (391) */
  export interface PalletProjectTokenTokenSaleParams extends Struct {
    readonly unitPrice: u128;
    readonly upperBoundQuantity: u128;
    readonly startsAt: Option<u32>;
    readonly duration: u32;
    readonly vestingScheduleParams: Option<PalletProjectTokenVestingScheduleParams>;
    readonly capPerMember: Option<u128>;
    readonly metadata: Option<Bytes>;
  }

  /** @name PalletProjectTokenTransfersPaymentWithVesting (392) */
  export interface PalletProjectTokenTransfersPaymentWithVesting extends BTreeMap<u64, PalletProjectTokenPaymentWithVesting> {}

  /** @name PalletStorageCall (396) */
  export interface PalletStorageCall extends Enum {
    readonly isDeleteStorageBucket: boolean;
    readonly asDeleteStorageBucket: {
      readonly storageBucketId: u64;
    } & Struct;
    readonly isUpdateUploadingBlockedStatus: boolean;
    readonly asUpdateUploadingBlockedStatus: {
      readonly newStatus: bool;
    } & Struct;
    readonly isUpdateDataSizeFee: boolean;
    readonly asUpdateDataSizeFee: {
      readonly newDataSizeFee: u128;
    } & Struct;
    readonly isUpdateStorageBucketsPerBagLimit: boolean;
    readonly asUpdateStorageBucketsPerBagLimit: {
      readonly newLimit: u32;
    } & Struct;
    readonly isUpdateStorageBucketsVoucherMaxLimits: boolean;
    readonly asUpdateStorageBucketsVoucherMaxLimits: {
      readonly newObjectsSize: u64;
      readonly newObjectsNumber: u64;
    } & Struct;
    readonly isUpdateDataObjectStateBloatBond: boolean;
    readonly asUpdateDataObjectStateBloatBond: {
      readonly stateBloatBond: u128;
    } & Struct;
    readonly isUpdateNumberOfStorageBucketsInDynamicBagCreationPolicy: boolean;
    readonly asUpdateNumberOfStorageBucketsInDynamicBagCreationPolicy: {
      readonly dynamicBagType: PalletStorageDynamicBagType;
      readonly numberOfStorageBuckets: u32;
    } & Struct;
    readonly isUpdateBlacklist: boolean;
    readonly asUpdateBlacklist: {
      readonly removeHashes: BTreeSet<Bytes>;
      readonly addHashes: BTreeSet<Bytes>;
    } & Struct;
    readonly isCreateStorageBucket: boolean;
    readonly asCreateStorageBucket: {
      readonly inviteWorker: Option<u64>;
      readonly acceptingNewBags: bool;
      readonly sizeLimit: u64;
      readonly objectsLimit: u64;
    } & Struct;
    readonly isUpdateStorageBucketsForBag: boolean;
    readonly asUpdateStorageBucketsForBag: {
      readonly bagId: PalletStorageBagIdType;
      readonly addBuckets: BTreeSet<u64>;
      readonly removeBuckets: BTreeSet<u64>;
    } & Struct;
    readonly isCancelStorageBucketOperatorInvite: boolean;
    readonly asCancelStorageBucketOperatorInvite: {
      readonly storageBucketId: u64;
    } & Struct;
    readonly isInviteStorageBucketOperator: boolean;
    readonly asInviteStorageBucketOperator: {
      readonly storageBucketId: u64;
      readonly operatorId: u64;
    } & Struct;
    readonly isRemoveStorageBucketOperator: boolean;
    readonly asRemoveStorageBucketOperator: {
      readonly storageBucketId: u64;
    } & Struct;
    readonly isUpdateStorageBucketStatus: boolean;
    readonly asUpdateStorageBucketStatus: {
      readonly storageBucketId: u64;
      readonly acceptingNewBags: bool;
    } & Struct;
    readonly isSetStorageBucketVoucherLimits: boolean;
    readonly asSetStorageBucketVoucherLimits: {
      readonly storageBucketId: u64;
      readonly newObjectsSizeLimit: u64;
      readonly newObjectsNumberLimit: u64;
    } & Struct;
    readonly isAcceptStorageBucketInvitation: boolean;
    readonly asAcceptStorageBucketInvitation: {
      readonly workerId: u64;
      readonly storageBucketId: u64;
      readonly transactorAccountId: AccountId32;
    } & Struct;
    readonly isSetStorageOperatorMetadata: boolean;
    readonly asSetStorageOperatorMetadata: {
      readonly workerId: u64;
      readonly storageBucketId: u64;
      readonly metadata: Bytes;
    } & Struct;
    readonly isAcceptPendingDataObjects: boolean;
    readonly asAcceptPendingDataObjects: {
      readonly workerId: u64;
      readonly storageBucketId: u64;
      readonly bagId: PalletStorageBagIdType;
      readonly dataObjects: BTreeSet<u64>;
    } & Struct;
    readonly isCreateDistributionBucketFamily: boolean;
    readonly isDeleteDistributionBucketFamily: boolean;
    readonly asDeleteDistributionBucketFamily: {
      readonly familyId: u64;
    } & Struct;
    readonly isCreateDistributionBucket: boolean;
    readonly asCreateDistributionBucket: {
      readonly familyId: u64;
      readonly acceptingNewBags: bool;
    } & Struct;
    readonly isUpdateDistributionBucketStatus: boolean;
    readonly asUpdateDistributionBucketStatus: {
      readonly bucketId: PalletStorageDistributionBucketIdRecord;
      readonly acceptingNewBags: bool;
    } & Struct;
    readonly isDeleteDistributionBucket: boolean;
    readonly asDeleteDistributionBucket: {
      readonly bucketId: PalletStorageDistributionBucketIdRecord;
    } & Struct;
    readonly isUpdateDistributionBucketsForBag: boolean;
    readonly asUpdateDistributionBucketsForBag: {
      readonly bagId: PalletStorageBagIdType;
      readonly familyId: u64;
      readonly addBucketsIndices: BTreeSet<u64>;
      readonly removeBucketsIndices: BTreeSet<u64>;
    } & Struct;
    readonly isUpdateDistributionBucketsPerBagLimit: boolean;
    readonly asUpdateDistributionBucketsPerBagLimit: {
      readonly newLimit: u32;
    } & Struct;
    readonly isUpdateDistributionBucketMode: boolean;
    readonly asUpdateDistributionBucketMode: {
      readonly bucketId: PalletStorageDistributionBucketIdRecord;
      readonly distributing: bool;
    } & Struct;
    readonly isUpdateFamiliesInDynamicBagCreationPolicy: boolean;
    readonly asUpdateFamiliesInDynamicBagCreationPolicy: {
      readonly dynamicBagType: PalletStorageDynamicBagType;
      readonly families: BTreeMap<u64, u32>;
    } & Struct;
    readonly isInviteDistributionBucketOperator: boolean;
    readonly asInviteDistributionBucketOperator: {
      readonly bucketId: PalletStorageDistributionBucketIdRecord;
      readonly operatorWorkerId: u64;
    } & Struct;
    readonly isCancelDistributionBucketOperatorInvite: boolean;
    readonly asCancelDistributionBucketOperatorInvite: {
      readonly bucketId: PalletStorageDistributionBucketIdRecord;
      readonly operatorWorkerId: u64;
    } & Struct;
    readonly isRemoveDistributionBucketOperator: boolean;
    readonly asRemoveDistributionBucketOperator: {
      readonly bucketId: PalletStorageDistributionBucketIdRecord;
      readonly operatorWorkerId: u64;
    } & Struct;
    readonly isSetDistributionBucketFamilyMetadata: boolean;
    readonly asSetDistributionBucketFamilyMetadata: {
      readonly familyId: u64;
      readonly metadata: Bytes;
    } & Struct;
    readonly isAcceptDistributionBucketInvitation: boolean;
    readonly asAcceptDistributionBucketInvitation: {
      readonly workerId: u64;
      readonly bucketId: PalletStorageDistributionBucketIdRecord;
    } & Struct;
    readonly isSetDistributionOperatorMetadata: boolean;
    readonly asSetDistributionOperatorMetadata: {
      readonly workerId: u64;
      readonly bucketId: PalletStorageDistributionBucketIdRecord;
      readonly metadata: Bytes;
    } & Struct;
    readonly isSudoUploadDataObjects: boolean;
    readonly asSudoUploadDataObjects: {
      readonly params: PalletStorageUploadParametersRecord;
    } & Struct;
    readonly isStorageOperatorRemark: boolean;
    readonly asStorageOperatorRemark: {
      readonly workerId: u64;
      readonly storageBucketId: u64;
      readonly msg: Bytes;
    } & Struct;
    readonly isDistributionOperatorRemark: boolean;
    readonly asDistributionOperatorRemark: {
      readonly workerId: u64;
      readonly distributionBucketId: PalletStorageDistributionBucketIdRecord;
      readonly msg: Bytes;
    } & Struct;
    readonly type: 'DeleteStorageBucket' | 'UpdateUploadingBlockedStatus' | 'UpdateDataSizeFee' | 'UpdateStorageBucketsPerBagLimit' | 'UpdateStorageBucketsVoucherMaxLimits' | 'UpdateDataObjectStateBloatBond' | 'UpdateNumberOfStorageBucketsInDynamicBagCreationPolicy' | 'UpdateBlacklist' | 'CreateStorageBucket' | 'UpdateStorageBucketsForBag' | 'CancelStorageBucketOperatorInvite' | 'InviteStorageBucketOperator' | 'RemoveStorageBucketOperator' | 'UpdateStorageBucketStatus' | 'SetStorageBucketVoucherLimits' | 'AcceptStorageBucketInvitation' | 'SetStorageOperatorMetadata' | 'AcceptPendingDataObjects' | 'CreateDistributionBucketFamily' | 'DeleteDistributionBucketFamily' | 'CreateDistributionBucket' | 'UpdateDistributionBucketStatus' | 'DeleteDistributionBucket' | 'UpdateDistributionBucketsForBag' | 'UpdateDistributionBucketsPerBagLimit' | 'UpdateDistributionBucketMode' | 'UpdateFamiliesInDynamicBagCreationPolicy' | 'InviteDistributionBucketOperator' | 'CancelDistributionBucketOperatorInvite' | 'RemoveDistributionBucketOperator' | 'SetDistributionBucketFamilyMetadata' | 'AcceptDistributionBucketInvitation' | 'SetDistributionOperatorMetadata' | 'SudoUploadDataObjects' | 'StorageOperatorRemark' | 'DistributionOperatorRemark';
  }

  /** @name PalletProjectTokenCall (397) */
  export interface PalletProjectTokenCall extends Enum {
    readonly isTransfer: boolean;
    readonly asTransfer: {
      readonly srcMemberId: u64;
      readonly tokenId: u64;
      readonly outputs: PalletProjectTokenTransfersPayment;
      readonly metadata: Bytes;
    } & Struct;
    readonly isBurn: boolean;
    readonly asBurn: {
      readonly tokenId: u64;
      readonly memberId: u64;
      readonly amount: u128;
    } & Struct;
    readonly isDustAccount: boolean;
    readonly asDustAccount: {
      readonly tokenId: u64;
      readonly memberId: u64;
    } & Struct;
    readonly isJoinWhitelist: boolean;
    readonly asJoinWhitelist: {
      readonly memberId: u64;
      readonly tokenId: u64;
      readonly proof: PalletProjectTokenMerkleProof;
    } & Struct;
    readonly isPurchaseTokensOnSale: boolean;
    readonly asPurchaseTokensOnSale: {
      readonly tokenId: u64;
      readonly memberId: u64;
      readonly amount: u128;
    } & Struct;
    readonly isParticipateInSplit: boolean;
    readonly asParticipateInSplit: {
      readonly tokenId: u64;
      readonly memberId: u64;
      readonly amount: u128;
    } & Struct;
    readonly isExitRevenueSplit: boolean;
    readonly asExitRevenueSplit: {
      readonly tokenId: u64;
      readonly memberId: u64;
    } & Struct;
    readonly type: 'Transfer' | 'Burn' | 'DustAccount' | 'JoinWhitelist' | 'PurchaseTokensOnSale' | 'ParticipateInSplit' | 'ExitRevenueSplit';
  }

  /** @name PalletProjectTokenTransfersPayment (398) */
  export interface PalletProjectTokenTransfersPayment extends BTreeMap<u64, PalletProjectTokenPayment> {}

  /** @name PalletProjectTokenPayment (399) */
  export interface PalletProjectTokenPayment extends Struct {
    readonly amount: u128;
  }

  /** @name PalletProjectTokenMerkleProof (403) */
  export interface PalletProjectTokenMerkleProof extends Vec<ITuple<[H256, PalletProjectTokenMerkleSide]>> {}

  /** @name PalletProjectTokenMerkleSide (406) */
  export interface PalletProjectTokenMerkleSide extends Enum {
    readonly isRight: boolean;
    readonly isLeft: boolean;
    readonly type: 'Right' | 'Left';
  }

  /** @name PalletProposalsEngineCall (407) */
  export interface PalletProposalsEngineCall extends Enum {
    readonly isVote: boolean;
    readonly asVote: {
      readonly voterId: u64;
      readonly proposalId: u32;
      readonly vote: PalletProposalsEngineVoteKind;
      readonly rationale: Bytes;
    } & Struct;
    readonly isCancelProposal: boolean;
    readonly asCancelProposal: {
      readonly proposerId: u64;
      readonly proposalId: u32;
    } & Struct;
    readonly isVetoProposal: boolean;
    readonly asVetoProposal: {
      readonly proposalId: u32;
    } & Struct;
    readonly isProposerRemark: boolean;
    readonly asProposerRemark: {
      readonly proposalId: u32;
      readonly proposerId: u64;
      readonly msg: Bytes;
    } & Struct;
    readonly type: 'Vote' | 'CancelProposal' | 'VetoProposal' | 'ProposerRemark';
  }

  /** @name PalletProposalsDiscussionCall (408) */
  export interface PalletProposalsDiscussionCall extends Enum {
    readonly isAddPost: boolean;
    readonly asAddPost: {
      readonly postAuthorId: u64;
      readonly threadId: u64;
      readonly text: Bytes;
      readonly editable: bool;
    } & Struct;
    readonly isDeletePost: boolean;
    readonly asDeletePost: {
      readonly deleterId: u64;
      readonly postId: u64;
      readonly threadId: u64;
      readonly hide: bool;
    } & Struct;
    readonly isUpdatePost: boolean;
    readonly asUpdatePost: {
      readonly threadId: u64;
      readonly postId: u64;
      readonly text: Bytes;
    } & Struct;
    readonly isChangeThreadMode: boolean;
    readonly asChangeThreadMode: {
      readonly memberId: u64;
      readonly threadId: u64;
      readonly mode: PalletProposalsDiscussionThreadModeBTreeSet;
    } & Struct;
    readonly type: 'AddPost' | 'DeletePost' | 'UpdatePost' | 'ChangeThreadMode';
  }

  /** @name PalletProposalsCodexCall (409) */
  export interface PalletProposalsCodexCall extends Enum {
    readonly isCreateProposal: boolean;
    readonly asCreateProposal: {
      readonly generalProposalParameters: PalletProposalsCodexGeneralProposalParams;
      readonly proposalDetails: PalletProposalsCodexProposalDetails;
    } & Struct;
    readonly type: 'CreateProposal';
  }

  /** @name PalletWorkingGroupCall (410) */
  export interface PalletWorkingGroupCall extends Enum {
    readonly isAddOpening: boolean;
    readonly asAddOpening: {
      readonly description: Bytes;
      readonly openingType: PalletWorkingGroupOpeningType;
      readonly stakePolicy: PalletWorkingGroupStakePolicy;
      readonly rewardPerBlock: Option<u128>;
    } & Struct;
    readonly isApplyOnOpening: boolean;
    readonly asApplyOnOpening: {
      readonly p: PalletWorkingGroupApplyOnOpeningParams;
    } & Struct;
    readonly isFillOpening: boolean;
    readonly asFillOpening: {
      readonly openingId: u64;
      readonly successfulApplicationIds: BTreeSet<u64>;
    } & Struct;
    readonly isUpdateRoleAccount: boolean;
    readonly asUpdateRoleAccount: {
      readonly workerId: u64;
      readonly newRoleAccountId: AccountId32;
    } & Struct;
    readonly isLeaveRole: boolean;
    readonly asLeaveRole: {
      readonly workerId: u64;
      readonly rationale: Option<Bytes>;
    } & Struct;
    readonly isTerminateRole: boolean;
    readonly asTerminateRole: {
      readonly workerId: u64;
      readonly penalty: Option<u128>;
      readonly rationale: Option<Bytes>;
    } & Struct;
    readonly isSlashStake: boolean;
    readonly asSlashStake: {
      readonly workerId: u64;
      readonly penalty: u128;
      readonly rationale: Option<Bytes>;
    } & Struct;
    readonly isDecreaseStake: boolean;
    readonly asDecreaseStake: {
      readonly workerId: u64;
      readonly stakeBalanceDelta: u128;
    } & Struct;
    readonly isIncreaseStake: boolean;
    readonly asIncreaseStake: {
      readonly workerId: u64;
      readonly stakeBalanceDelta: u128;
    } & Struct;
    readonly isWithdrawApplication: boolean;
    readonly asWithdrawApplication: {
      readonly applicationId: u64;
    } & Struct;
    readonly isCancelOpening: boolean;
    readonly asCancelOpening: {
      readonly openingId: u64;
    } & Struct;
    readonly isSetBudget: boolean;
    readonly asSetBudget: {
      readonly newBudget: u128;
    } & Struct;
    readonly isUpdateRewardAccount: boolean;
    readonly asUpdateRewardAccount: {
      readonly workerId: u64;
      readonly newRewardAccountId: AccountId32;
    } & Struct;
    readonly isUpdateRewardAmount: boolean;
    readonly asUpdateRewardAmount: {
      readonly workerId: u64;
      readonly rewardPerBlock: Option<u128>;
    } & Struct;
    readonly isSetStatusText: boolean;
    readonly asSetStatusText: {
      readonly statusText: Option<Bytes>;
    } & Struct;
    readonly isSpendFromBudget: boolean;
    readonly asSpendFromBudget: {
      readonly accountId: AccountId32;
      readonly amount: u128;
      readonly rationale: Option<Bytes>;
    } & Struct;
    readonly isFundWorkingGroupBudget: boolean;
    readonly asFundWorkingGroupBudget: {
      readonly memberId: u64;
      readonly amount: u128;
      readonly rationale: Bytes;
    } & Struct;
    readonly isLeadRemark: boolean;
    readonly asLeadRemark: {
      readonly msg: Bytes;
    } & Struct;
    readonly isWorkerRemark: boolean;
    readonly asWorkerRemark: {
      readonly workerId: u64;
      readonly msg: Bytes;
    } & Struct;
    readonly type: 'AddOpening' | 'ApplyOnOpening' | 'FillOpening' | 'UpdateRoleAccount' | 'LeaveRole' | 'TerminateRole' | 'SlashStake' | 'DecreaseStake' | 'IncreaseStake' | 'WithdrawApplication' | 'CancelOpening' | 'SetBudget' | 'UpdateRewardAccount' | 'UpdateRewardAmount' | 'SetStatusText' | 'SpendFromBudget' | 'FundWorkingGroupBudget' | 'LeadRemark' | 'WorkerRemark';
  }

  /** @name JoystreamNodeRuntimeOriginCaller (419) */
  export interface JoystreamNodeRuntimeOriginCaller extends Enum {
    readonly isSystem: boolean;
    readonly asSystem: FrameSupportDispatchRawOrigin;
    readonly isVoid: boolean;
    readonly type: 'System' | 'Void';
  }

  /** @name FrameSupportDispatchRawOrigin (420) */
  export interface FrameSupportDispatchRawOrigin extends Enum {
    readonly isRoot: boolean;
    readonly isSigned: boolean;
    readonly asSigned: AccountId32;
    readonly isNone: boolean;
    readonly type: 'Root' | 'Signed' | 'None';
  }

  /** @name SpCoreVoid (421) */
  export type SpCoreVoid = Null;

  /** @name PalletUtilityError (422) */
  export interface PalletUtilityError extends Enum {
    readonly isTooManyCalls: boolean;
    readonly type: 'TooManyCalls';
  }

  /** @name SpConsensusBabeDigestsPreDigest (429) */
  export interface SpConsensusBabeDigestsPreDigest extends Enum {
    readonly isPrimary: boolean;
    readonly asPrimary: SpConsensusBabeDigestsPrimaryPreDigest;
    readonly isSecondaryPlain: boolean;
    readonly asSecondaryPlain: SpConsensusBabeDigestsSecondaryPlainPreDigest;
    readonly isSecondaryVRF: boolean;
    readonly asSecondaryVRF: SpConsensusBabeDigestsSecondaryVRFPreDigest;
    readonly type: 'Primary' | 'SecondaryPlain' | 'SecondaryVRF';
  }

  /** @name SpConsensusBabeDigestsPrimaryPreDigest (430) */
  export interface SpConsensusBabeDigestsPrimaryPreDigest extends Struct {
    readonly authorityIndex: u32;
    readonly slot: u64;
    readonly vrfOutput: U8aFixed;
    readonly vrfProof: U8aFixed;
  }

  /** @name SpConsensusBabeDigestsSecondaryPlainPreDigest (431) */
  export interface SpConsensusBabeDigestsSecondaryPlainPreDigest extends Struct {
    readonly authorityIndex: u32;
    readonly slot: u64;
  }

  /** @name SpConsensusBabeDigestsSecondaryVRFPreDigest (432) */
  export interface SpConsensusBabeDigestsSecondaryVRFPreDigest extends Struct {
    readonly authorityIndex: u32;
    readonly slot: u64;
    readonly vrfOutput: U8aFixed;
    readonly vrfProof: U8aFixed;
  }

  /** @name SpConsensusBabeBabeEpochConfiguration (434) */
  export interface SpConsensusBabeBabeEpochConfiguration extends Struct {
    readonly c: ITuple<[u64, u64]>;
    readonly allowedSlots: SpConsensusBabeAllowedSlots;
  }

  /** @name PalletBabeError (435) */
  export interface PalletBabeError extends Enum {
    readonly isInvalidEquivocationProof: boolean;
    readonly isInvalidKeyOwnershipProof: boolean;
    readonly isDuplicateOffenceReport: boolean;
    readonly isInvalidConfiguration: boolean;
    readonly type: 'InvalidEquivocationProof' | 'InvalidKeyOwnershipProof' | 'DuplicateOffenceReport' | 'InvalidConfiguration';
  }

  /** @name PalletAuthorshipUncleEntryItem (437) */
  export interface PalletAuthorshipUncleEntryItem extends Enum {
    readonly isInclusionHeight: boolean;
    readonly asInclusionHeight: u32;
    readonly isUncle: boolean;
    readonly asUncle: ITuple<[H256, Option<AccountId32>]>;
    readonly type: 'InclusionHeight' | 'Uncle';
  }

  /** @name PalletAuthorshipError (438) */
  export interface PalletAuthorshipError extends Enum {
    readonly isInvalidUncleParent: boolean;
    readonly isUnclesAlreadySet: boolean;
    readonly isTooManyUncles: boolean;
    readonly isGenesisUncle: boolean;
    readonly isTooHighUncle: boolean;
    readonly isUncleAlreadyIncluded: boolean;
    readonly isOldUncle: boolean;
    readonly type: 'InvalidUncleParent' | 'UnclesAlreadySet' | 'TooManyUncles' | 'GenesisUncle' | 'TooHighUncle' | 'UncleAlreadyIncluded' | 'OldUncle';
  }

  /** @name PalletBalancesBalanceLock (440) */
  export interface PalletBalancesBalanceLock extends Struct {
    readonly id: U8aFixed;
    readonly amount: u128;
    readonly reasons: PalletBalancesReasons;
  }

  /** @name PalletBalancesReasons (441) */
  export interface PalletBalancesReasons extends Enum {
    readonly isFee: boolean;
    readonly isMisc: boolean;
    readonly isAll: boolean;
    readonly type: 'Fee' | 'Misc' | 'All';
  }

  /** @name PalletBalancesReserveData (444) */
  export interface PalletBalancesReserveData extends Struct {
    readonly id: U8aFixed;
    readonly amount: u128;
  }

  /** @name PalletBalancesReleases (446) */
  export interface PalletBalancesReleases extends Enum {
    readonly isV100: boolean;
    readonly isV200: boolean;
    readonly type: 'V100' | 'V200';
  }

  /** @name PalletBalancesError (447) */
  export interface PalletBalancesError extends Enum {
    readonly isVestingBalance: boolean;
    readonly isLiquidityRestrictions: boolean;
    readonly isInsufficientBalance: boolean;
    readonly isExistentialDeposit: boolean;
    readonly isKeepAlive: boolean;
    readonly isExistingVestingSchedule: boolean;
    readonly isDeadAccount: boolean;
    readonly isTooManyReserves: boolean;
    readonly type: 'VestingBalance' | 'LiquidityRestrictions' | 'InsufficientBalance' | 'ExistentialDeposit' | 'KeepAlive' | 'ExistingVestingSchedule' | 'DeadAccount' | 'TooManyReserves';
  }

  /** @name PalletTransactionPaymentReleases (449) */
  export interface PalletTransactionPaymentReleases extends Enum {
    readonly isV1Ancient: boolean;
    readonly isV2: boolean;
    readonly type: 'V1Ancient' | 'V2';
  }

  /** @name PalletElectionProviderMultiPhasePhase (450) */
  export interface PalletElectionProviderMultiPhasePhase extends Enum {
    readonly isOff: boolean;
    readonly isSigned: boolean;
    readonly isUnsigned: boolean;
    readonly asUnsigned: ITuple<[bool, u32]>;
    readonly isEmergency: boolean;
    readonly type: 'Off' | 'Signed' | 'Unsigned' | 'Emergency';
  }

  /** @name PalletElectionProviderMultiPhaseReadySolution (452) */
  export interface PalletElectionProviderMultiPhaseReadySolution extends Struct {
    readonly supports: Vec<ITuple<[AccountId32, SpNposElectionsSupport]>>;
    readonly score: SpNposElectionsElectionScore;
    readonly compute: PalletElectionProviderMultiPhaseElectionCompute;
  }

  /** @name PalletElectionProviderMultiPhaseRoundSnapshot (453) */
  export interface PalletElectionProviderMultiPhaseRoundSnapshot extends Struct {
    readonly voters: Vec<ITuple<[AccountId32, u64, Vec<AccountId32>]>>;
    readonly targets: Vec<AccountId32>;
  }

  /** @name PalletElectionProviderMultiPhaseSignedSignedSubmission (461) */
  export interface PalletElectionProviderMultiPhaseSignedSignedSubmission extends Struct {
    readonly who: AccountId32;
    readonly deposit: u128;
    readonly rawSolution: PalletElectionProviderMultiPhaseRawSolution;
    readonly callFee: u128;
  }

  /** @name PalletElectionProviderMultiPhaseError (462) */
  export interface PalletElectionProviderMultiPhaseError extends Enum {
    readonly isPreDispatchEarlySubmission: boolean;
    readonly isPreDispatchWrongWinnerCount: boolean;
    readonly isPreDispatchWeakSubmission: boolean;
    readonly isSignedQueueFull: boolean;
    readonly isSignedCannotPayDeposit: boolean;
    readonly isSignedInvalidWitness: boolean;
    readonly isSignedTooMuchWeight: boolean;
    readonly isOcwCallWrongEra: boolean;
    readonly isMissingSnapshotMetadata: boolean;
    readonly isInvalidSubmissionIndex: boolean;
    readonly isCallNotAllowed: boolean;
    readonly isFallbackFailed: boolean;
    readonly type: 'PreDispatchEarlySubmission' | 'PreDispatchWrongWinnerCount' | 'PreDispatchWeakSubmission' | 'SignedQueueFull' | 'SignedCannotPayDeposit' | 'SignedInvalidWitness' | 'SignedTooMuchWeight' | 'OcwCallWrongEra' | 'MissingSnapshotMetadata' | 'InvalidSubmissionIndex' | 'CallNotAllowed' | 'FallbackFailed';
  }

  /** @name PalletStakingStakingLedger (463) */
  export interface PalletStakingStakingLedger extends Struct {
    readonly stash: AccountId32;
    readonly total: Compact<u128>;
    readonly active: Compact<u128>;
    readonly unlocking: Vec<PalletStakingUnlockChunk>;
    readonly claimedRewards: Vec<u32>;
  }

  /** @name PalletStakingUnlockChunk (465) */
  export interface PalletStakingUnlockChunk extends Struct {
    readonly value: Compact<u128>;
    readonly era: Compact<u32>;
  }

  /** @name PalletStakingNominations (467) */
  export interface PalletStakingNominations extends Struct {
    readonly targets: Vec<AccountId32>;
    readonly submittedIn: u32;
    readonly suppressed: bool;
  }

  /** @name PalletStakingActiveEraInfo (468) */
  export interface PalletStakingActiveEraInfo extends Struct {
    readonly index: u32;
    readonly start: Option<u64>;
  }

  /** @name PalletStakingEraRewardPoints (470) */
  export interface PalletStakingEraRewardPoints extends Struct {
    readonly total: u32;
    readonly individual: BTreeMap<AccountId32, u32>;
  }

  /** @name PalletStakingForcing (474) */
  export interface PalletStakingForcing extends Enum {
    readonly isNotForcing: boolean;
    readonly isForceNew: boolean;
    readonly isForceNone: boolean;
    readonly isForceAlways: boolean;
    readonly type: 'NotForcing' | 'ForceNew' | 'ForceNone' | 'ForceAlways';
  }

  /** @name PalletStakingUnappliedSlash (476) */
  export interface PalletStakingUnappliedSlash extends Struct {
    readonly validator: AccountId32;
    readonly own: u128;
    readonly others: Vec<ITuple<[AccountId32, u128]>>;
    readonly reporters: Vec<AccountId32>;
    readonly payout: u128;
  }

  /** @name PalletStakingSlashingSlashingSpans (478) */
  export interface PalletStakingSlashingSlashingSpans extends Struct {
    readonly spanIndex: u32;
    readonly lastStart: u32;
    readonly lastNonzeroSlash: u32;
    readonly prior: Vec<u32>;
  }

  /** @name PalletStakingSlashingSpanRecord (479) */
  export interface PalletStakingSlashingSpanRecord extends Struct {
    readonly slashed: u128;
    readonly paidOut: u128;
  }

  /** @name PalletStakingReleases (482) */
  export interface PalletStakingReleases extends Enum {
    readonly isV100Ancient: boolean;
    readonly isV200: boolean;
    readonly isV300: boolean;
    readonly isV400: boolean;
    readonly isV500: boolean;
    readonly isV600: boolean;
    readonly isV700: boolean;
    readonly isV800: boolean;
    readonly isV900: boolean;
    readonly type: 'V100Ancient' | 'V200' | 'V300' | 'V400' | 'V500' | 'V600' | 'V700' | 'V800' | 'V900';
  }

  /** @name PalletStakingPalletError (483) */
  export interface PalletStakingPalletError extends Enum {
    readonly isNotController: boolean;
    readonly isNotStash: boolean;
    readonly isAlreadyBonded: boolean;
    readonly isAlreadyPaired: boolean;
    readonly isEmptyTargets: boolean;
    readonly isDuplicateIndex: boolean;
    readonly isInvalidSlashIndex: boolean;
    readonly isInsufficientBond: boolean;
    readonly isNoMoreChunks: boolean;
    readonly isNoUnlockChunk: boolean;
    readonly isFundedTarget: boolean;
    readonly isInvalidEraToReward: boolean;
    readonly isInvalidNumberOfNominations: boolean;
    readonly isNotSortedAndUnique: boolean;
    readonly isAlreadyClaimed: boolean;
    readonly isIncorrectHistoryDepth: boolean;
    readonly isIncorrectSlashingSpans: boolean;
    readonly isBadState: boolean;
    readonly isTooManyTargets: boolean;
    readonly isBadTarget: boolean;
    readonly isCannotChillOther: boolean;
    readonly isTooManyNominators: boolean;
    readonly isTooManyValidators: boolean;
    readonly isCommissionTooLow: boolean;
    readonly isBondingRestricted: boolean;
    readonly type: 'NotController' | 'NotStash' | 'AlreadyBonded' | 'AlreadyPaired' | 'EmptyTargets' | 'DuplicateIndex' | 'InvalidSlashIndex' | 'InsufficientBond' | 'NoMoreChunks' | 'NoUnlockChunk' | 'FundedTarget' | 'InvalidEraToReward' | 'InvalidNumberOfNominations' | 'NotSortedAndUnique' | 'AlreadyClaimed' | 'IncorrectHistoryDepth' | 'IncorrectSlashingSpans' | 'BadState' | 'TooManyTargets' | 'BadTarget' | 'CannotChillOther' | 'TooManyNominators' | 'TooManyValidators' | 'CommissionTooLow' | 'BondingRestricted';
  }

  /** @name SpCoreCryptoKeyTypeId (487) */
  export interface SpCoreCryptoKeyTypeId extends U8aFixed {}

  /** @name PalletSessionError (488) */
  export interface PalletSessionError extends Enum {
    readonly isInvalidProof: boolean;
    readonly isNoAssociatedValidatorId: boolean;
    readonly isDuplicatedKey: boolean;
    readonly isNoKeys: boolean;
    readonly isNoAccount: boolean;
    readonly type: 'InvalidProof' | 'NoAssociatedValidatorId' | 'DuplicatedKey' | 'NoKeys' | 'NoAccount';
  }

  /** @name PalletGrandpaStoredState (490) */
  export interface PalletGrandpaStoredState extends Enum {
    readonly isLive: boolean;
    readonly isPendingPause: boolean;
    readonly asPendingPause: {
      readonly scheduledAt: u32;
      readonly delay: u32;
    } & Struct;
    readonly isPaused: boolean;
    readonly isPendingResume: boolean;
    readonly asPendingResume: {
      readonly scheduledAt: u32;
      readonly delay: u32;
    } & Struct;
    readonly type: 'Live' | 'PendingPause' | 'Paused' | 'PendingResume';
  }

  /** @name PalletGrandpaStoredPendingChange (491) */
  export interface PalletGrandpaStoredPendingChange extends Struct {
    readonly scheduledAt: u32;
    readonly delay: u32;
    readonly nextAuthorities: Vec<ITuple<[SpFinalityGrandpaAppPublic, u64]>>;
    readonly forced: Option<u32>;
  }

  /** @name PalletGrandpaError (493) */
  export interface PalletGrandpaError extends Enum {
    readonly isPauseFailed: boolean;
    readonly isResumeFailed: boolean;
    readonly isChangePending: boolean;
    readonly isTooSoon: boolean;
    readonly isInvalidKeyOwnershipProof: boolean;
    readonly isInvalidEquivocationProof: boolean;
    readonly isDuplicateOffenceReport: boolean;
    readonly type: 'PauseFailed' | 'ResumeFailed' | 'ChangePending' | 'TooSoon' | 'InvalidKeyOwnershipProof' | 'InvalidEquivocationProof' | 'DuplicateOffenceReport';
  }

  /** @name PalletImOnlineBoundedOpaqueNetworkState (499) */
  export interface PalletImOnlineBoundedOpaqueNetworkState extends Struct {
    readonly peerId: Bytes;
    readonly externalAddresses: Vec<Bytes>;
  }

  /** @name PalletImOnlineError (503) */
  export interface PalletImOnlineError extends Enum {
    readonly isInvalidKey: boolean;
    readonly isDuplicatedHeartbeat: boolean;
    readonly type: 'InvalidKey' | 'DuplicatedHeartbeat';
  }

  /** @name SpStakingOffenceOffenceDetails (504) */
  export interface SpStakingOffenceOffenceDetails extends Struct {
    readonly offender: ITuple<[AccountId32, PalletStakingExposure]>;
    readonly reporters: Vec<AccountId32>;
  }

  /** @name PalletSudoError (507) */
  export interface PalletSudoError extends Enum {
    readonly isRequireSudo: boolean;
    readonly type: 'RequireSudo';
  }

  /** @name PalletBagsListListNode (508) */
  export interface PalletBagsListListNode extends Struct {
    readonly id: AccountId32;
    readonly prev: Option<AccountId32>;
    readonly next: Option<AccountId32>;
    readonly bagUpper: u64;
    readonly score: u64;
  }

  /** @name PalletBagsListListBag (509) */
  export interface PalletBagsListListBag extends Struct {
    readonly head: Option<AccountId32>;
    readonly tail: Option<AccountId32>;
  }

  /** @name PalletBagsListError (510) */
  export interface PalletBagsListError extends Enum {
    readonly isList: boolean;
    readonly asList: PalletBagsListListListError;
    readonly type: 'List';
  }

  /** @name PalletBagsListListListError (511) */
  export interface PalletBagsListListListError extends Enum {
    readonly isDuplicate: boolean;
    readonly isNotHeavier: boolean;
    readonly isNotInSameBag: boolean;
    readonly isNodeNotFound: boolean;
    readonly type: 'Duplicate' | 'NotHeavier' | 'NotInSameBag' | 'NodeNotFound';
  }

  /** @name PalletVestingReleases (514) */
  export interface PalletVestingReleases extends Enum {
    readonly isV0: boolean;
    readonly isV1: boolean;
    readonly type: 'V0' | 'V1';
  }

  /** @name PalletVestingError (515) */
  export interface PalletVestingError extends Enum {
    readonly isNotVesting: boolean;
    readonly isAtMaxVestingSchedules: boolean;
    readonly isAmountLow: boolean;
    readonly isScheduleIndexOutOfBounds: boolean;
    readonly isInvalidScheduleParams: boolean;
    readonly type: 'NotVesting' | 'AtMaxVestingSchedules' | 'AmountLow' | 'ScheduleIndexOutOfBounds' | 'InvalidScheduleParams';
  }

  /** @name PalletMultisigMultisig (517) */
  export interface PalletMultisigMultisig extends Struct {
    readonly when: PalletMultisigTimepoint;
    readonly deposit: u128;
    readonly depositor: AccountId32;
    readonly approvals: Vec<AccountId32>;
  }

  /** @name PalletMultisigError (519) */
  export interface PalletMultisigError extends Enum {
    readonly isMinimumThreshold: boolean;
    readonly isAlreadyApproved: boolean;
    readonly isNoApprovalsNeeded: boolean;
    readonly isTooFewSignatories: boolean;
    readonly isTooManySignatories: boolean;
    readonly isSignatoriesOutOfOrder: boolean;
    readonly isSenderInSignatories: boolean;
    readonly isNotFound: boolean;
    readonly isNotOwner: boolean;
    readonly isNoTimepoint: boolean;
    readonly isWrongTimepoint: boolean;
    readonly isUnexpectedTimepoint: boolean;
    readonly isMaxWeightTooLow: boolean;
    readonly isAlreadyStored: boolean;
    readonly type: 'MinimumThreshold' | 'AlreadyApproved' | 'NoApprovalsNeeded' | 'TooFewSignatories' | 'TooManySignatories' | 'SignatoriesOutOfOrder' | 'SenderInSignatories' | 'NotFound' | 'NotOwner' | 'NoTimepoint' | 'WrongTimepoint' | 'UnexpectedTimepoint' | 'MaxWeightTooLow' | 'AlreadyStored';
  }

  /** @name PalletCouncilCouncilStageUpdate (520) */
  export interface PalletCouncilCouncilStageUpdate extends Struct {
    readonly stage: PalletCouncilCouncilStage;
    readonly changedAt: u32;
  }

  /** @name PalletCouncilCouncilStage (521) */
  export interface PalletCouncilCouncilStage extends Enum {
    readonly isAnnouncing: boolean;
    readonly asAnnouncing: PalletCouncilCouncilStageAnnouncing;
    readonly isElection: boolean;
    readonly asElection: PalletCouncilCouncilStageElection;
    readonly isIdle: boolean;
    readonly asIdle: PalletCouncilCouncilStageIdle;
    readonly type: 'Announcing' | 'Election' | 'Idle';
  }

  /** @name PalletCouncilCouncilStageAnnouncing (522) */
  export interface PalletCouncilCouncilStageAnnouncing extends Struct {
    readonly candidatesCount: u32;
    readonly endsAt: u32;
  }

  /** @name PalletCouncilCouncilStageElection (523) */
  export interface PalletCouncilCouncilStageElection extends Struct {
    readonly candidatesCount: u32;
  }

  /** @name PalletCouncilCouncilStageIdle (524) */
  export interface PalletCouncilCouncilStageIdle extends Struct {
    readonly endsAt: u32;
  }

  /** @name PalletCouncilCouncilMember (526) */
  export interface PalletCouncilCouncilMember extends Struct {
    readonly stakingAccountId: AccountId32;
    readonly rewardAccountId: AccountId32;
    readonly membershipId: u64;
    readonly stake: u128;
    readonly lastPaymentBlock: u32;
    readonly unpaidReward: u128;
  }

  /** @name PalletCouncilCandidate (528) */
  export interface PalletCouncilCandidate extends Struct {
    readonly stakingAccountId: AccountId32;
    readonly rewardAccountId: AccountId32;
    readonly cycleId: u64;
    readonly stake: u128;
    readonly votePower: u128;
    readonly noteHash: Option<H256>;
  }

  /** @name PalletCouncilError (529) */
  export interface PalletCouncilError extends Enum {
    readonly isArithmeticError: boolean;
    readonly isBadOrigin: boolean;
    readonly isCantCandidateNow: boolean;
    readonly isCantReleaseStakeNow: boolean;
    readonly isCandidacyStakeTooLow: boolean;
    readonly isCantCandidateTwice: boolean;
    readonly isConflictingStake: boolean;
    readonly isStakeStillNeeded: boolean;
    readonly isNoStake: boolean;
    readonly isInsufficientBalanceForStaking: boolean;
    readonly isCantVoteForYourself: boolean;
    readonly isMemberIdNotMatchAccount: boolean;
    readonly isInvalidAccountToStakeReuse: boolean;
    readonly isNotCandidatingNow: boolean;
    readonly isCantWithdrawCandidacyNow: boolean;
    readonly isNotCouncilor: boolean;
    readonly isInsufficientFundsForFundingRequest: boolean;
    readonly isZeroBalanceFundRequest: boolean;
    readonly isRepeatedFundRequestAccount: boolean;
    readonly isEmptyFundingRequests: boolean;
    readonly isInsufficientTokensForFunding: boolean;
    readonly isZeroTokensFunding: boolean;
    readonly isCandidateDoesNotExist: boolean;
    readonly isInsufficientBalanceForTransfer: boolean;
    readonly type: 'ArithmeticError' | 'BadOrigin' | 'CantCandidateNow' | 'CantReleaseStakeNow' | 'CandidacyStakeTooLow' | 'CantCandidateTwice' | 'ConflictingStake' | 'StakeStillNeeded' | 'NoStake' | 'InsufficientBalanceForStaking' | 'CantVoteForYourself' | 'MemberIdNotMatchAccount' | 'InvalidAccountToStakeReuse' | 'NotCandidatingNow' | 'CantWithdrawCandidacyNow' | 'NotCouncilor' | 'InsufficientFundsForFundingRequest' | 'ZeroBalanceFundRequest' | 'RepeatedFundRequestAccount' | 'EmptyFundingRequests' | 'InsufficientTokensForFunding' | 'ZeroTokensFunding' | 'CandidateDoesNotExist' | 'InsufficientBalanceForTransfer';
  }

  /** @name PalletReferendumReferendumStage (530) */
  export interface PalletReferendumReferendumStage extends Enum {
    readonly isInactive: boolean;
    readonly isVoting: boolean;
    readonly asVoting: PalletReferendumReferendumStageVoting;
    readonly isRevealing: boolean;
    readonly asRevealing: PalletReferendumReferendumStageRevealing;
    readonly type: 'Inactive' | 'Voting' | 'Revealing';
  }

  /** @name PalletReferendumReferendumStageVoting (532) */
  export interface PalletReferendumReferendumStageVoting extends Struct {
    readonly started: u32;
    readonly winningTargetCount: u32;
    readonly currentCycleId: u64;
    readonly endsAt: u32;
  }

  /** @name PalletReferendumReferendumStageRevealing (533) */
  export interface PalletReferendumReferendumStageRevealing extends Struct {
    readonly started: u32;
    readonly winningTargetCount: u32;
    readonly intermediateWinners: Vec<PalletReferendumOptionResult>;
    readonly currentCycleId: u64;
    readonly endsAt: u32;
  }

  /** @name PalletReferendumCastVote (534) */
  export interface PalletReferendumCastVote extends Struct {
    readonly commitment: H256;
    readonly cycleId: u64;
    readonly stake: u128;
    readonly voteFor: Option<u64>;
  }

  /** @name PalletReferendumError (535) */
  export interface PalletReferendumError extends Enum {
    readonly isBadOrigin: boolean;
    readonly isReferendumNotRunning: boolean;
    readonly isRevealingNotInProgress: boolean;
    readonly isConflictStakesOnAccount: boolean;
    readonly isInsufficientBalanceToStake: boolean;
    readonly isInsufficientStake: boolean;
    readonly isInvalidReveal: boolean;
    readonly isInvalidVote: boolean;
    readonly isVoteNotExisting: boolean;
    readonly isAlreadyVotedThisCycle: boolean;
    readonly isUnstakingVoteInSameCycle: boolean;
    readonly isSaltTooLong: boolean;
    readonly isUnstakingForbidden: boolean;
    readonly type: 'BadOrigin' | 'ReferendumNotRunning' | 'RevealingNotInProgress' | 'ConflictStakesOnAccount' | 'InsufficientBalanceToStake' | 'InsufficientStake' | 'InvalidReveal' | 'InvalidVote' | 'VoteNotExisting' | 'AlreadyVotedThisCycle' | 'UnstakingVoteInSameCycle' | 'SaltTooLong' | 'UnstakingForbidden';
  }

  /** @name PalletMembershipMembershipObject (536) */
  export interface PalletMembershipMembershipObject extends Struct {
    readonly handleHash: H256;
    readonly rootAccount: AccountId32;
    readonly controllerAccount: AccountId32;
    readonly verified: bool;
    readonly invites: u32;
  }

  /** @name PalletMembershipStakingAccountMemberBinding (537) */
  export interface PalletMembershipStakingAccountMemberBinding extends Struct {
    readonly memberId: u64;
    readonly confirmed: bool;
  }

  /** @name PalletMembershipError (538) */
  export interface PalletMembershipError extends Enum {
    readonly isNotEnoughBalanceToBuyMembership: boolean;
    readonly isControllerAccountRequired: boolean;
    readonly isRootAccountRequired: boolean;
    readonly isUnsignedOrigin: boolean;
    readonly isMemberProfileNotFound: boolean;
    readonly isHandleAlreadyRegistered: boolean;
    readonly isHandleMustBeProvidedDuringRegistration: boolean;
    readonly isReferrerIsNotMember: boolean;
    readonly isCannotTransferInvitesForNotMember: boolean;
    readonly isNotEnoughInvites: boolean;
    readonly isWorkingGroupLeaderNotSet: boolean;
    readonly isStakingAccountIsAlreadyRegistered: boolean;
    readonly isStakingAccountDoesntExist: boolean;
    readonly isStakingAccountAlreadyConfirmed: boolean;
    readonly isWorkingGroupBudgetIsNotSufficientForInviting: boolean;
    readonly isConflictingLock: boolean;
    readonly isCannotExceedReferralCutPercentLimit: boolean;
    readonly isConflictStakesOnAccount: boolean;
    readonly isInsufficientBalanceToCoverStake: boolean;
    readonly isGifLockExceedsCredit: boolean;
    readonly isInsufficientBalanceToGift: boolean;
    readonly type: 'NotEnoughBalanceToBuyMembership' | 'ControllerAccountRequired' | 'RootAccountRequired' | 'UnsignedOrigin' | 'MemberProfileNotFound' | 'HandleAlreadyRegistered' | 'HandleMustBeProvidedDuringRegistration' | 'ReferrerIsNotMember' | 'CannotTransferInvitesForNotMember' | 'NotEnoughInvites' | 'WorkingGroupLeaderNotSet' | 'StakingAccountIsAlreadyRegistered' | 'StakingAccountDoesntExist' | 'StakingAccountAlreadyConfirmed' | 'WorkingGroupBudgetIsNotSufficientForInviting' | 'ConflictingLock' | 'CannotExceedReferralCutPercentLimit' | 'ConflictStakesOnAccount' | 'InsufficientBalanceToCoverStake' | 'GifLockExceedsCredit' | 'InsufficientBalanceToGift';
  }

  /** @name PalletForumCategory (539) */
  export interface PalletForumCategory extends Struct {
    readonly titleHash: H256;
    readonly descriptionHash: H256;
    readonly archived: bool;
    readonly numDirectSubcategories: u32;
    readonly numDirectThreads: u32;
    readonly numDirectModerators: u32;
    readonly parentCategoryId: Option<u64>;
    readonly stickyThreadIds: BTreeSet<u64>;
  }

  /** @name PalletForumThread (541) */
  export interface PalletForumThread extends Struct {
    readonly categoryId: u64;
    readonly authorId: u64;
    readonly cleanupPayOff: PalletCommonBloatBondRepayableBloatBond;
    readonly numberOfEditablePosts: u64;
  }

  /** @name PalletForumPost (542) */
  export interface PalletForumPost extends Struct {
    readonly threadId: u64;
    readonly textHash: H256;
    readonly authorId: u64;
    readonly cleanupPayOff: PalletCommonBloatBondRepayableBloatBond;
    readonly lastEdited: u32;
  }

  /** @name PalletForumError (543) */
  export interface PalletForumError extends Enum {
    readonly isArithmeticError: boolean;
    readonly isOriginNotForumLead: boolean;
    readonly isForumUserIdNotMatchAccount: boolean;
    readonly isModeratorIdNotMatchAccount: boolean;
    readonly isAccountDoesNotMatchThreadAuthor: boolean;
    readonly isThreadDoesNotExist: boolean;
    readonly isModeratorModerateOriginCategory: boolean;
    readonly isModeratorModerateDestinationCategory: boolean;
    readonly isThreadMoveInvalid: boolean;
    readonly isThreadNotBeingUpdated: boolean;
    readonly isInsufficientBalanceForThreadCreation: boolean;
    readonly isCannotDeleteThreadWithOutstandingPosts: boolean;
    readonly isPostDoesNotExist: boolean;
    readonly isAccountDoesNotMatchPostAuthor: boolean;
    readonly isInsufficientBalanceForPost: boolean;
    readonly isCategoryNotBeingUpdated: boolean;
    readonly isAncestorCategoryImmutable: boolean;
    readonly isMaxValidCategoryDepthExceeded: boolean;
    readonly isCategoryDoesNotExist: boolean;
    readonly isCategoryModeratorDoesNotExist: boolean;
    readonly isCategoryNotEmptyThreads: boolean;
    readonly isCategoryNotEmptyCategories: boolean;
    readonly isModeratorCantDeleteCategory: boolean;
    readonly isModeratorCantUpdateCategory: boolean;
    readonly isMapSizeLimit: boolean;
    readonly isPathLengthShouldBeGreaterThanZero: boolean;
    readonly isMaxNumberOfStickiedThreadsExceeded: boolean;
    readonly type: 'ArithmeticError' | 'OriginNotForumLead' | 'ForumUserIdNotMatchAccount' | 'ModeratorIdNotMatchAccount' | 'AccountDoesNotMatchThreadAuthor' | 'ThreadDoesNotExist' | 'ModeratorModerateOriginCategory' | 'ModeratorModerateDestinationCategory' | 'ThreadMoveInvalid' | 'ThreadNotBeingUpdated' | 'InsufficientBalanceForThreadCreation' | 'CannotDeleteThreadWithOutstandingPosts' | 'PostDoesNotExist' | 'AccountDoesNotMatchPostAuthor' | 'InsufficientBalanceForPost' | 'CategoryNotBeingUpdated' | 'AncestorCategoryImmutable' | 'MaxValidCategoryDepthExceeded' | 'CategoryDoesNotExist' | 'CategoryModeratorDoesNotExist' | 'CategoryNotEmptyThreads' | 'CategoryNotEmptyCategories' | 'ModeratorCantDeleteCategory' | 'ModeratorCantUpdateCategory' | 'MapSizeLimit' | 'PathLengthShouldBeGreaterThanZero' | 'MaxNumberOfStickiedThreadsExceeded';
  }

  /** @name PalletConstitutionConstitutionInfo (544) */
  export interface PalletConstitutionConstitutionInfo extends Struct {
    readonly textHash: H256;
  }

  /** @name PalletBountyBountyRecord (545) */
  export interface PalletBountyBountyRecord extends Struct {
    readonly creationParams: PalletBountyBountyParametersBoundedBTreeSet;
    readonly totalFunding: u128;
    readonly milestone: PalletBountyBountyMilestone;
    readonly activeWorkEntryCount: u32;
    readonly hasUnpaidOracleReward: bool;
  }

  /** @name PalletBountyBountyParametersBoundedBTreeSet (547) */
  export interface PalletBountyBountyParametersBoundedBTreeSet extends Struct {
    readonly oracle: PalletBountyBountyActor;
    readonly contractType: PalletBountyAssuranceContractTypeBoundedBTreeSet;
    readonly creator: PalletBountyBountyActor;
    readonly cherry: u128;
    readonly oracleReward: u128;
    readonly entrantStake: u128;
    readonly fundingType: PalletBountyFundingType;
  }

  /** @name PalletBountyAssuranceContractTypeBoundedBTreeSet (548) */
  export interface PalletBountyAssuranceContractTypeBoundedBTreeSet extends Enum {
    readonly isOpen: boolean;
    readonly isClosed: boolean;
    readonly asClosed: BTreeSet<u64>;
    readonly type: 'Open' | 'Closed';
  }

  /** @name PalletBountyBountyMilestone (549) */
  export interface PalletBountyBountyMilestone extends Enum {
    readonly isCreated: boolean;
    readonly asCreated: {
      readonly createdAt: u32;
      readonly hasContributions: bool;
    } & Struct;
    readonly isBountyMaxFundingReached: boolean;
    readonly isWorkSubmitted: boolean;
    readonly isTerminated: boolean;
    readonly isJudgmentSubmitted: boolean;
    readonly asJudgmentSubmitted: {
      readonly successfulBounty: bool;
    } & Struct;
    readonly type: 'Created' | 'BountyMaxFundingReached' | 'WorkSubmitted' | 'Terminated' | 'JudgmentSubmitted';
  }

  /** @name PalletBountyContribution (551) */
  export interface PalletBountyContribution extends Struct {
    readonly amount: u128;
    readonly funderStateBloatBondAmount: u128;
  }

  /** @name PalletBountyEntryRecord (552) */
  export interface PalletBountyEntryRecord extends Struct {
    readonly memberId: u64;
    readonly stakingAccountId: AccountId32;
    readonly submittedAt: u32;
    readonly workSubmitted: bool;
  }

  /** @name PalletBountyError (553) */
  export interface PalletBountyError extends Enum {
    readonly isArithmeticError: boolean;
    readonly isMinFundingAmountCannotBeGreaterThanMaxAmount: boolean;
    readonly isBountyDoesntExist: boolean;
    readonly isSwitchOracleOriginIsRoot: boolean;
    readonly isInvalidStageUnexpectedFunding: boolean;
    readonly isInvalidStageUnexpectedNoFundingContributed: boolean;
    readonly isInvalidStageUnexpectedCancelled: boolean;
    readonly isInvalidStageUnexpectedWorkSubmission: boolean;
    readonly isInvalidStageUnexpectedJudgment: boolean;
    readonly isInvalidStageUnexpectedSuccessfulBountyWithdrawal: boolean;
    readonly isInvalidStageUnexpectedFailedBountyWithdrawal: boolean;
    readonly isInsufficientBalanceForBounty: boolean;
    readonly isNoBountyContributionFound: boolean;
    readonly isInsufficientBalanceForStake: boolean;
    readonly isConflictingStakes: boolean;
    readonly isWorkEntryDoesntExist: boolean;
    readonly isCherryLessThenMinimumAllowed: boolean;
    readonly isCannotSubmitWorkToClosedContractBounty: boolean;
    readonly isClosedContractMemberListIsEmpty: boolean;
    readonly isClosedContractMemberListIsTooLarge: boolean;
    readonly isClosedContractMemberNotFound: boolean;
    readonly isInvalidOracleMemberId: boolean;
    readonly isInvalidStakingAccountForMember: boolean;
    readonly isZeroWinnerReward: boolean;
    readonly isTotalRewardShouldBeEqualToTotalFunding: boolean;
    readonly isEntrantStakeIsLessThanMininum: boolean;
    readonly isFundingAmountCannotBeZero: boolean;
    readonly isFundingPeriodCannotBeZero: boolean;
    readonly isWinnerShouldHasWorkSubmission: boolean;
    readonly isInvalidContributorActorSpecified: boolean;
    readonly isInvalidOracleActorSpecified: boolean;
    readonly isInvalidEntrantWorkerSpecified: boolean;
    readonly isInvalidCreatorActorSpecified: boolean;
    readonly isWorkEntryDoesntBelongToWorker: boolean;
    readonly isOracleRewardAlreadyWithdrawn: boolean;
    readonly type: 'ArithmeticError' | 'MinFundingAmountCannotBeGreaterThanMaxAmount' | 'BountyDoesntExist' | 'SwitchOracleOriginIsRoot' | 'InvalidStageUnexpectedFunding' | 'InvalidStageUnexpectedNoFundingContributed' | 'InvalidStageUnexpectedCancelled' | 'InvalidStageUnexpectedWorkSubmission' | 'InvalidStageUnexpectedJudgment' | 'InvalidStageUnexpectedSuccessfulBountyWithdrawal' | 'InvalidStageUnexpectedFailedBountyWithdrawal' | 'InsufficientBalanceForBounty' | 'NoBountyContributionFound' | 'InsufficientBalanceForStake' | 'ConflictingStakes' | 'WorkEntryDoesntExist' | 'CherryLessThenMinimumAllowed' | 'CannotSubmitWorkToClosedContractBounty' | 'ClosedContractMemberListIsEmpty' | 'ClosedContractMemberListIsTooLarge' | 'ClosedContractMemberNotFound' | 'InvalidOracleMemberId' | 'InvalidStakingAccountForMember' | 'ZeroWinnerReward' | 'TotalRewardShouldBeEqualToTotalFunding' | 'EntrantStakeIsLessThanMininum' | 'FundingAmountCannotBeZero' | 'FundingPeriodCannotBeZero' | 'WinnerShouldHasWorkSubmission' | 'InvalidContributorActorSpecified' | 'InvalidOracleActorSpecified' | 'InvalidEntrantWorkerSpecified' | 'InvalidCreatorActorSpecified' | 'WorkEntryDoesntBelongToWorker' | 'OracleRewardAlreadyWithdrawn';
  }

  /** @name PalletContentVideoRecord (555) */
  export interface PalletContentVideoRecord extends Struct {
    readonly inChannel: u64;
    readonly nftStatus: Option<PalletContentNftTypesOwnedNft>;
    readonly dataObjects: BTreeSet<u64>;
    readonly videoStateBloatBond: PalletCommonBloatBondRepayableBloatBond;
  }

  /** @name PalletContentNftTypesOwnedNft (556) */
  export interface PalletContentNftTypesOwnedNft extends Struct {
    readonly owner: PalletContentNftTypesNftOwner;
    readonly transactionalStatus: PalletContentNftTypesTransactionalStatusRecord;
    readonly creatorRoyalty: Option<Perbill>;
    readonly openAuctionsNonce: u64;
  }

  /** @name PalletContentNftTypesTransactionalStatusRecord (557) */
  export interface PalletContentNftTypesTransactionalStatusRecord extends Enum {
    readonly isIdle: boolean;
    readonly isInitiatedOfferToMember: boolean;
    readonly asInitiatedOfferToMember: ITuple<[u64, Option<u128>]>;
    readonly isEnglishAuction: boolean;
    readonly asEnglishAuction: PalletContentNftTypesEnglishAuctionRecord;
    readonly isOpenAuction: boolean;
    readonly asOpenAuction: PalletContentNftTypesOpenAuctionRecord;
    readonly isBuyNow: boolean;
    readonly asBuyNow: u128;
    readonly type: 'Idle' | 'InitiatedOfferToMember' | 'EnglishAuction' | 'OpenAuction' | 'BuyNow';
  }

  /** @name PalletContentNftTypesEnglishAuctionRecord (558) */
  export interface PalletContentNftTypesEnglishAuctionRecord extends Struct {
    readonly startingPrice: u128;
    readonly buyNowPrice: Option<u128>;
    readonly whitelist: BTreeSet<u64>;
    readonly end: u32;
    readonly start: u32;
    readonly extensionPeriod: u32;
    readonly minBidStep: u128;
    readonly topBid: Option<PalletContentNftTypesEnglishAuctionBid>;
  }

  /** @name PalletContentNftTypesEnglishAuctionBid (561) */
  export interface PalletContentNftTypesEnglishAuctionBid extends Struct {
    readonly amount: u128;
    readonly bidderId: u64;
  }

  /** @name PalletContentNftTypesOpenAuctionRecord (562) */
  export interface PalletContentNftTypesOpenAuctionRecord extends Struct {
    readonly startingPrice: u128;
    readonly buyNowPrice: Option<u128>;
    readonly whitelist: BTreeSet<u64>;
    readonly bidLockDuration: u32;
    readonly auctionId: u64;
    readonly start: u32;
  }

  /** @name PalletContentNftTypesNftOwner (563) */
  export interface PalletContentNftTypesNftOwner extends Enum {
    readonly isChannelOwner: boolean;
    readonly isMember: boolean;
    readonly asMember: u64;
    readonly type: 'ChannelOwner' | 'Member';
  }

  /** @name PalletContentPermissionsCuratorGroupCuratorGroupRecord (566) */
  export interface PalletContentPermissionsCuratorGroupCuratorGroupRecord extends Struct {
    readonly curators: BTreeMap<u64, BTreeSet<PalletContentIterableEnumsChannelActionPermission>>;
    readonly active: bool;
    readonly permissionsByLevel: BTreeMap<u8, BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsContentModerationAction>>;
  }

  /** @name PalletContentNftTypesOpenAuctionBidRecord (573) */
  export interface PalletContentNftTypesOpenAuctionBidRecord extends Struct {
    readonly amount: u128;
    readonly madeAtBlock: u32;
    readonly auctionId: u64;
  }

  /** @name PalletContentErrorsError (574) */
  export interface PalletContentErrorsError extends Enum {
    readonly isChannelStateBloatBondChanged: boolean;
    readonly isVideoStateBloatBondChanged: boolean;
    readonly isMinCashoutValueTooLow: boolean;
    readonly isMaxCashoutValueTooHigh: boolean;
    readonly isMaxNumberOfChannelCollaboratorsExceeded: boolean;
    readonly isMaxNumberOfChannelAssetsExceeded: boolean;
    readonly isMaxNumberOfVideoAssetsExceeded: boolean;
    readonly isMaxNumberOfChannelAgentPermissionsExceeded: boolean;
    readonly isMaxNumberOfPausedFeaturesPerChannelExceeded: boolean;
    readonly isInvalidChannelBagWitnessProvided: boolean;
    readonly isInvalidStorageBucketsNumWitnessProvided: boolean;
    readonly isMissingStorageBucketsNumWitness: boolean;
    readonly isChannelOwnerMemberDoesNotExist: boolean;
    readonly isChannelOwnerCuratorGroupDoesNotExist: boolean;
    readonly isChannelStateBloatBondBelowExistentialDeposit: boolean;
    readonly isNumberOfAssetsToRemoveIsZero: boolean;
    readonly isCuratorIsNotAMemberOfGivenCuratorGroup: boolean;
    readonly isCuratorIsAlreadyAMemberOfGivenCuratorGroup: boolean;
    readonly isCuratorGroupDoesNotExist: boolean;
    readonly isCuratorsPerGroupLimitReached: boolean;
    readonly isCuratorGroupIsNotActive: boolean;
    readonly isCuratorIdInvalid: boolean;
    readonly isLeadAuthFailed: boolean;
    readonly isMemberAuthFailed: boolean;
    readonly isCuratorAuthFailed: boolean;
    readonly isBadOrigin: boolean;
    readonly isActorNotAuthorized: boolean;
    readonly isCategoryDoesNotExist: boolean;
    readonly isChannelDoesNotExist: boolean;
    readonly isVideoDoesNotExist: boolean;
    readonly isVideoInSeason: boolean;
    readonly isActorCannotBeLead: boolean;
    readonly isActorCannotOwnChannel: boolean;
    readonly isNftAlreadyOwnedByChannel: boolean;
    readonly isNftAlreadyExists: boolean;
    readonly isNftDoesNotExist: boolean;
    readonly isOverflowOrUnderflowHappened: boolean;
    readonly isDoesNotOwnNft: boolean;
    readonly isRoyaltyUpperBoundExceeded: boolean;
    readonly isRoyaltyLowerBoundExceeded: boolean;
    readonly isAuctionDurationUpperBoundExceeded: boolean;
    readonly isAuctionDurationLowerBoundExceeded: boolean;
    readonly isExtensionPeriodUpperBoundExceeded: boolean;
    readonly isExtensionPeriodLowerBoundExceeded: boolean;
    readonly isBidLockDurationUpperBoundExceeded: boolean;
    readonly isBidLockDurationLowerBoundExceeded: boolean;
    readonly isStartingPriceUpperBoundExceeded: boolean;
    readonly isStartingPriceLowerBoundExceeded: boolean;
    readonly isAuctionBidStepUpperBoundExceeded: boolean;
    readonly isAuctionBidStepLowerBoundExceeded: boolean;
    readonly isInsufficientBalance: boolean;
    readonly isBidStepConstraintViolated: boolean;
    readonly isInvalidBidAmountSpecified: boolean;
    readonly isStartingPriceConstraintViolated: boolean;
    readonly isActionHasBidsAlready: boolean;
    readonly isNftIsNotIdle: boolean;
    readonly isPendingOfferDoesNotExist: boolean;
    readonly isRewardAccountIsNotSet: boolean;
    readonly isActorIsNotBidder: boolean;
    readonly isAuctionCannotBeCompleted: boolean;
    readonly isBidDoesNotExist: boolean;
    readonly isBidIsForPastAuction: boolean;
    readonly isStartsAtLowerBoundExceeded: boolean;
    readonly isStartsAtUpperBoundExceeded: boolean;
    readonly isAuctionDidNotStart: boolean;
    readonly isNotInAuctionState: boolean;
    readonly isMemberIsNotAllowedToParticipate: boolean;
    readonly isMemberProfileNotFound: boolean;
    readonly isNftNotInBuyNowState: boolean;
    readonly isInvalidBuyNowWitnessPriceProvided: boolean;
    readonly isIsNotOpenAuctionType: boolean;
    readonly isIsNotEnglishAuctionType: boolean;
    readonly isBidLockDurationIsNotExpired: boolean;
    readonly isNftAuctionIsAlreadyExpired: boolean;
    readonly isBuyNowMustBeGreaterThanStartingPrice: boolean;
    readonly isTargetMemberDoesNotExist: boolean;
    readonly isInvalidNftOfferWitnessPriceProvided: boolean;
    readonly isMaxAuctionWhiteListLengthUpperBoundExceeded: boolean;
    readonly isWhitelistHasOnlyOneMember: boolean;
    readonly isWhitelistedMemberDoesNotExist: boolean;
    readonly isNftNonChannelOwnerDoesNotExist: boolean;
    readonly isExtensionPeriodIsGreaterThenAuctionDuration: boolean;
    readonly isNoAssetsSpecified: boolean;
    readonly isInvalidAssetsProvided: boolean;
    readonly isChannelContainsVideos: boolean;
    readonly isChannelContainsAssets: boolean;
    readonly isInvalidBagSizeSpecified: boolean;
    readonly isMigrationNotFinished: boolean;
    readonly isReplyDoesNotExist: boolean;
    readonly isUnsufficientBalance: boolean;
    readonly isInsufficientTreasuryBalance: boolean;
    readonly isInvalidMemberProvided: boolean;
    readonly isActorNotAMember: boolean;
    readonly isPaymentProofVerificationFailed: boolean;
    readonly isCashoutAmountExceedsMaximumAmount: boolean;
    readonly isCashoutAmountBelowMinimumAmount: boolean;
    readonly isWithdrawalAmountExceedsChannelAccountWithdrawableBalance: boolean;
    readonly isWithdrawFromChannelAmountIsZero: boolean;
    readonly isChannelCashoutsDisabled: boolean;
    readonly isMinCashoutAllowedExceedsMaxCashoutAllowed: boolean;
    readonly isCuratorModerationActionNotAllowed: boolean;
    readonly isMaxCuratorPermissionsPerLevelExceeded: boolean;
    readonly isCuratorGroupMaxPermissionsByLevelMapSizeExceeded: boolean;
    readonly isChannelFeaturePaused: boolean;
    readonly isChannelBagMissing: boolean;
    readonly isAssetsToRemoveBeyondEntityAssetsSet: boolean;
    readonly isInvalidVideoDataObjectsCountProvided: boolean;
    readonly isInvalidChannelTransferStatus: boolean;
    readonly isInvalidChannelTransferAcceptor: boolean;
    readonly isInvalidChannelTransferCommitmentParams: boolean;
    readonly isChannelAgentInsufficientPermissions: boolean;
    readonly isInvalidChannelOwner: boolean;
    readonly isZeroReward: boolean;
    readonly isInsufficientBalanceForTransfer: boolean;
    readonly isInsufficientBalanceForChannelCreation: boolean;
    readonly isInsufficientBalanceForVideoCreation: boolean;
    readonly isInsufficientCouncilBudget: boolean;
    readonly isGlobalNftDailyLimitExceeded: boolean;
    readonly isGlobalNftWeeklyLimitExceeded: boolean;
    readonly isChannelNftDailyLimitExceeded: boolean;
    readonly isChannelNftWeeklyLimitExceeded: boolean;
    readonly isCreatorTokenAlreadyIssued: boolean;
    readonly isCreatorTokenNotIssued: boolean;
    readonly isMemberIdCouldNotBeDerivedFromActor: boolean;
    readonly isCannotWithdrawFromChannelWithCreatorTokenIssued: boolean;
    readonly isPatronageCanOnlyBeClaimedForMemberOwnedChannels: boolean;
    readonly isChannelTransfersBlockedDuringRevenueSplits: boolean;
    readonly isChannelTransfersBlockedDuringTokenSales: boolean;
    readonly type: 'ChannelStateBloatBondChanged' | 'VideoStateBloatBondChanged' | 'MinCashoutValueTooLow' | 'MaxCashoutValueTooHigh' | 'MaxNumberOfChannelCollaboratorsExceeded' | 'MaxNumberOfChannelAssetsExceeded' | 'MaxNumberOfVideoAssetsExceeded' | 'MaxNumberOfChannelAgentPermissionsExceeded' | 'MaxNumberOfPausedFeaturesPerChannelExceeded' | 'InvalidChannelBagWitnessProvided' | 'InvalidStorageBucketsNumWitnessProvided' | 'MissingStorageBucketsNumWitness' | 'ChannelOwnerMemberDoesNotExist' | 'ChannelOwnerCuratorGroupDoesNotExist' | 'ChannelStateBloatBondBelowExistentialDeposit' | 'NumberOfAssetsToRemoveIsZero' | 'CuratorIsNotAMemberOfGivenCuratorGroup' | 'CuratorIsAlreadyAMemberOfGivenCuratorGroup' | 'CuratorGroupDoesNotExist' | 'CuratorsPerGroupLimitReached' | 'CuratorGroupIsNotActive' | 'CuratorIdInvalid' | 'LeadAuthFailed' | 'MemberAuthFailed' | 'CuratorAuthFailed' | 'BadOrigin' | 'ActorNotAuthorized' | 'CategoryDoesNotExist' | 'ChannelDoesNotExist' | 'VideoDoesNotExist' | 'VideoInSeason' | 'ActorCannotBeLead' | 'ActorCannotOwnChannel' | 'NftAlreadyOwnedByChannel' | 'NftAlreadyExists' | 'NftDoesNotExist' | 'OverflowOrUnderflowHappened' | 'DoesNotOwnNft' | 'RoyaltyUpperBoundExceeded' | 'RoyaltyLowerBoundExceeded' | 'AuctionDurationUpperBoundExceeded' | 'AuctionDurationLowerBoundExceeded' | 'ExtensionPeriodUpperBoundExceeded' | 'ExtensionPeriodLowerBoundExceeded' | 'BidLockDurationUpperBoundExceeded' | 'BidLockDurationLowerBoundExceeded' | 'StartingPriceUpperBoundExceeded' | 'StartingPriceLowerBoundExceeded' | 'AuctionBidStepUpperBoundExceeded' | 'AuctionBidStepLowerBoundExceeded' | 'InsufficientBalance' | 'BidStepConstraintViolated' | 'InvalidBidAmountSpecified' | 'StartingPriceConstraintViolated' | 'ActionHasBidsAlready' | 'NftIsNotIdle' | 'PendingOfferDoesNotExist' | 'RewardAccountIsNotSet' | 'ActorIsNotBidder' | 'AuctionCannotBeCompleted' | 'BidDoesNotExist' | 'BidIsForPastAuction' | 'StartsAtLowerBoundExceeded' | 'StartsAtUpperBoundExceeded' | 'AuctionDidNotStart' | 'NotInAuctionState' | 'MemberIsNotAllowedToParticipate' | 'MemberProfileNotFound' | 'NftNotInBuyNowState' | 'InvalidBuyNowWitnessPriceProvided' | 'IsNotOpenAuctionType' | 'IsNotEnglishAuctionType' | 'BidLockDurationIsNotExpired' | 'NftAuctionIsAlreadyExpired' | 'BuyNowMustBeGreaterThanStartingPrice' | 'TargetMemberDoesNotExist' | 'InvalidNftOfferWitnessPriceProvided' | 'MaxAuctionWhiteListLengthUpperBoundExceeded' | 'WhitelistHasOnlyOneMember' | 'WhitelistedMemberDoesNotExist' | 'NftNonChannelOwnerDoesNotExist' | 'ExtensionPeriodIsGreaterThenAuctionDuration' | 'NoAssetsSpecified' | 'InvalidAssetsProvided' | 'ChannelContainsVideos' | 'ChannelContainsAssets' | 'InvalidBagSizeSpecified' | 'MigrationNotFinished' | 'ReplyDoesNotExist' | 'UnsufficientBalance' | 'InsufficientTreasuryBalance' | 'InvalidMemberProvided' | 'ActorNotAMember' | 'PaymentProofVerificationFailed' | 'CashoutAmountExceedsMaximumAmount' | 'CashoutAmountBelowMinimumAmount' | 'WithdrawalAmountExceedsChannelAccountWithdrawableBalance' | 'WithdrawFromChannelAmountIsZero' | 'ChannelCashoutsDisabled' | 'MinCashoutAllowedExceedsMaxCashoutAllowed' | 'CuratorModerationActionNotAllowed' | 'MaxCuratorPermissionsPerLevelExceeded' | 'CuratorGroupMaxPermissionsByLevelMapSizeExceeded' | 'ChannelFeaturePaused' | 'ChannelBagMissing' | 'AssetsToRemoveBeyondEntityAssetsSet' | 'InvalidVideoDataObjectsCountProvided' | 'InvalidChannelTransferStatus' | 'InvalidChannelTransferAcceptor' | 'InvalidChannelTransferCommitmentParams' | 'ChannelAgentInsufficientPermissions' | 'InvalidChannelOwner' | 'ZeroReward' | 'InsufficientBalanceForTransfer' | 'InsufficientBalanceForChannelCreation' | 'InsufficientBalanceForVideoCreation' | 'InsufficientCouncilBudget' | 'GlobalNftDailyLimitExceeded' | 'GlobalNftWeeklyLimitExceeded' | 'ChannelNftDailyLimitExceeded' | 'ChannelNftWeeklyLimitExceeded' | 'CreatorTokenAlreadyIssued' | 'CreatorTokenNotIssued' | 'MemberIdCouldNotBeDerivedFromActor' | 'CannotWithdrawFromChannelWithCreatorTokenIssued' | 'PatronageCanOnlyBeClaimedForMemberOwnedChannels' | 'ChannelTransfersBlockedDuringRevenueSplits' | 'ChannelTransfersBlockedDuringTokenSales';
  }

  /** @name PalletStorageBagRecord (575) */
  export interface PalletStorageBagRecord extends Struct {
    readonly storedBy: BTreeSet<u64>;
    readonly distributedBy: BTreeSet<PalletStorageDistributionBucketIdRecord>;
    readonly objectsTotalSize: u64;
    readonly objectsNumber: u64;
  }

  /** @name PalletStorageStorageBucketRecord (578) */
  export interface PalletStorageStorageBucketRecord extends Struct {
    readonly operatorStatus: PalletStorageStorageBucketOperatorStatus;
    readonly acceptingNewBags: bool;
    readonly voucher: PalletStorageVoucher;
    readonly assignedBags: u64;
  }

  /** @name PalletStorageStorageBucketOperatorStatus (579) */
  export interface PalletStorageStorageBucketOperatorStatus extends Enum {
    readonly isMissing: boolean;
    readonly isInvitedStorageWorker: boolean;
    readonly asInvitedStorageWorker: u64;
    readonly isStorageWorker: boolean;
    readonly asStorageWorker: ITuple<[u64, AccountId32]>;
    readonly type: 'Missing' | 'InvitedStorageWorker' | 'StorageWorker';
  }

  /** @name PalletStorageDynamicBagCreationPolicy (581) */
  export interface PalletStorageDynamicBagCreationPolicy extends Struct {
    readonly numberOfStorageBuckets: u32;
    readonly families: BTreeMap<u64, u32>;
  }

  /** @name PalletStorageDataObject (584) */
  export interface PalletStorageDataObject extends Struct {
    readonly accepted: bool;
    readonly stateBloatBond: PalletCommonBloatBondRepayableBloatBond;
    readonly size_: u64;
    readonly ipfsContentId: Bytes;
  }

  /** @name PalletStorageDistributionBucketFamilyRecord (585) */
  export interface PalletStorageDistributionBucketFamilyRecord extends Struct {
    readonly nextDistributionBucketIndex: u64;
  }

  /** @name PalletStorageDistributionBucketRecord (586) */
  export interface PalletStorageDistributionBucketRecord extends Struct {
    readonly acceptingNewBags: bool;
    readonly distributing: bool;
    readonly pendingInvitations: BTreeSet<u64>;
    readonly operators: BTreeSet<u64>;
    readonly assignedBags: u64;
  }

  /** @name PalletStorageError (589) */
  export interface PalletStorageError extends Enum {
    readonly isArithmeticError: boolean;
    readonly isInvalidCidLength: boolean;
    readonly isNoObjectsOnUpload: boolean;
    readonly isStorageBucketDoesntExist: boolean;
    readonly isStorageBucketIsNotBoundToBag: boolean;
    readonly isStorageBucketIsBoundToBag: boolean;
    readonly isNoStorageBucketInvitation: boolean;
    readonly isStorageProviderAlreadySet: boolean;
    readonly isStorageProviderMustBeSet: boolean;
    readonly isDifferentStorageProviderInvited: boolean;
    readonly isInvitedStorageProvider: boolean;
    readonly isStorageBucketIdCollectionsAreEmpty: boolean;
    readonly isStorageBucketsNumberViolatesDynamicBagCreationPolicy: boolean;
    readonly isDistributionBucketsViolatesDynamicBagCreationPolicy: boolean;
    readonly isEmptyContentId: boolean;
    readonly isZeroObjectSize: boolean;
    readonly isInvalidStateBloatBondSourceAccount: boolean;
    readonly isInvalidStorageProvider: boolean;
    readonly isInsufficientBalance: boolean;
    readonly isDataObjectDoesntExist: boolean;
    readonly isUploadingBlocked: boolean;
    readonly isDataObjectIdCollectionIsEmpty: boolean;
    readonly isSourceAndDestinationBagsAreEqual: boolean;
    readonly isDataObjectBlacklisted: boolean;
    readonly isBlacklistSizeLimitExceeded: boolean;
    readonly isVoucherMaxObjectSizeLimitExceeded: boolean;
    readonly isVoucherMaxObjectNumberLimitExceeded: boolean;
    readonly isStorageBucketObjectNumberLimitReached: boolean;
    readonly isStorageBucketObjectSizeLimitReached: boolean;
    readonly isInsufficientTreasuryBalance: boolean;
    readonly isCannotDeleteNonEmptyStorageBucket: boolean;
    readonly isDataObjectIdParamsAreEmpty: boolean;
    readonly isStorageBucketsPerBagLimitTooLow: boolean;
    readonly isStorageBucketsPerBagLimitTooHigh: boolean;
    readonly isStorageBucketPerBagLimitExceeded: boolean;
    readonly isStorageBucketDoesntAcceptNewBags: boolean;
    readonly isDynamicBagExists: boolean;
    readonly isDynamicBagDoesntExist: boolean;
    readonly isStorageProviderOperatorDoesntExist: boolean;
    readonly isDataSizeFeeChanged: boolean;
    readonly isDataObjectStateBloatBondChanged: boolean;
    readonly isCannotDeleteNonEmptyDynamicBag: boolean;
    readonly isMaxDistributionBucketFamilyNumberLimitExceeded: boolean;
    readonly isDistributionBucketFamilyDoesntExist: boolean;
    readonly isDistributionBucketDoesntExist: boolean;
    readonly isDistributionBucketIdCollectionsAreEmpty: boolean;
    readonly isDistributionBucketDoesntAcceptNewBags: boolean;
    readonly isMaxDistributionBucketNumberPerBagLimitExceeded: boolean;
    readonly isDistributionBucketIsNotBoundToBag: boolean;
    readonly isDistributionBucketIsBoundToBag: boolean;
    readonly isDistributionBucketsPerBagLimitTooLow: boolean;
    readonly isDistributionBucketsPerBagLimitTooHigh: boolean;
    readonly isDistributionProviderOperatorDoesntExist: boolean;
    readonly isDistributionProviderOperatorAlreadyInvited: boolean;
    readonly isDistributionProviderOperatorSet: boolean;
    readonly isNoDistributionBucketInvitation: boolean;
    readonly isMustBeDistributionProviderOperatorForBucket: boolean;
    readonly isMaxNumberOfPendingInvitationsLimitForDistributionBucketReached: boolean;
    readonly isMaxNumberOfOperatorsPerDistributionBucketReached: boolean;
    readonly isDistributionFamilyBoundToBagCreationPolicy: boolean;
    readonly isMaxDataObjectSizeExceeded: boolean;
    readonly isInvalidTransactorAccount: boolean;
    readonly isNumberOfStorageBucketsOutsideOfAllowedContraints: boolean;
    readonly isNumberOfDistributionBucketsOutsideOfAllowedContraints: boolean;
    readonly isCallDisabled: boolean;
    readonly type: 'ArithmeticError' | 'InvalidCidLength' | 'NoObjectsOnUpload' | 'StorageBucketDoesntExist' | 'StorageBucketIsNotBoundToBag' | 'StorageBucketIsBoundToBag' | 'NoStorageBucketInvitation' | 'StorageProviderAlreadySet' | 'StorageProviderMustBeSet' | 'DifferentStorageProviderInvited' | 'InvitedStorageProvider' | 'StorageBucketIdCollectionsAreEmpty' | 'StorageBucketsNumberViolatesDynamicBagCreationPolicy' | 'DistributionBucketsViolatesDynamicBagCreationPolicy' | 'EmptyContentId' | 'ZeroObjectSize' | 'InvalidStateBloatBondSourceAccount' | 'InvalidStorageProvider' | 'InsufficientBalance' | 'DataObjectDoesntExist' | 'UploadingBlocked' | 'DataObjectIdCollectionIsEmpty' | 'SourceAndDestinationBagsAreEqual' | 'DataObjectBlacklisted' | 'BlacklistSizeLimitExceeded' | 'VoucherMaxObjectSizeLimitExceeded' | 'VoucherMaxObjectNumberLimitExceeded' | 'StorageBucketObjectNumberLimitReached' | 'StorageBucketObjectSizeLimitReached' | 'InsufficientTreasuryBalance' | 'CannotDeleteNonEmptyStorageBucket' | 'DataObjectIdParamsAreEmpty' | 'StorageBucketsPerBagLimitTooLow' | 'StorageBucketsPerBagLimitTooHigh' | 'StorageBucketPerBagLimitExceeded' | 'StorageBucketDoesntAcceptNewBags' | 'DynamicBagExists' | 'DynamicBagDoesntExist' | 'StorageProviderOperatorDoesntExist' | 'DataSizeFeeChanged' | 'DataObjectStateBloatBondChanged' | 'CannotDeleteNonEmptyDynamicBag' | 'MaxDistributionBucketFamilyNumberLimitExceeded' | 'DistributionBucketFamilyDoesntExist' | 'DistributionBucketDoesntExist' | 'DistributionBucketIdCollectionsAreEmpty' | 'DistributionBucketDoesntAcceptNewBags' | 'MaxDistributionBucketNumberPerBagLimitExceeded' | 'DistributionBucketIsNotBoundToBag' | 'DistributionBucketIsBoundToBag' | 'DistributionBucketsPerBagLimitTooLow' | 'DistributionBucketsPerBagLimitTooHigh' | 'DistributionProviderOperatorDoesntExist' | 'DistributionProviderOperatorAlreadyInvited' | 'DistributionProviderOperatorSet' | 'NoDistributionBucketInvitation' | 'MustBeDistributionProviderOperatorForBucket' | 'MaxNumberOfPendingInvitationsLimitForDistributionBucketReached' | 'MaxNumberOfOperatorsPerDistributionBucketReached' | 'DistributionFamilyBoundToBagCreationPolicy' | 'MaxDataObjectSizeExceeded' | 'InvalidTransactorAccount' | 'NumberOfStorageBucketsOutsideOfAllowedContraints' | 'NumberOfDistributionBucketsOutsideOfAllowedContraints' | 'CallDisabled';
  }

  /** @name PalletProjectTokenAccountData (590) */
  export interface PalletProjectTokenAccountData extends Struct {
    readonly vestingSchedules: BTreeMap<PalletProjectTokenVestingSource, PalletProjectTokenVestingSchedule>;
    readonly amount: u128;
    readonly splitStakingStatus: Option<PalletProjectTokenStakingStatus>;
    readonly bloatBond: PalletCommonBloatBondRepayableBloatBond;
    readonly nextVestingTransferId: u64;
    readonly lastSaleTotalPurchasedAmount: Option<ITuple<[u32, u128]>>;
  }

  /** @name PalletProjectTokenStakingStatus (591) */
  export interface PalletProjectTokenStakingStatus extends Struct {
    readonly splitId: u32;
    readonly amount: u128;
  }

  /** @name PalletProjectTokenVestingSchedule (593) */
  export interface PalletProjectTokenVestingSchedule extends Struct {
    readonly linearVestingStartBlock: u32;
    readonly linearVestingDuration: u32;
    readonly cliffAmount: u128;
    readonly postCliffTotalAmount: u128;
    readonly burnedAmount: u128;
  }

  /** @name PalletProjectTokenTokenData (600) */
  export interface PalletProjectTokenTokenData extends Struct {
    readonly totalSupply: u128;
    readonly tokensIssued: u128;
    readonly nextSaleId: u32;
    readonly sale: Option<PalletProjectTokenTokenSale>;
    readonly transferPolicy: PalletProjectTokenTransferPolicy;
    readonly symbol: H256;
    readonly patronageInfo: PalletProjectTokenPatronageData;
    readonly accountsNumber: u64;
    readonly revenueSplitRate: Permill;
    readonly revenueSplit: PalletProjectTokenRevenueSplitState;
    readonly nextRevenueSplitId: u32;
  }

  /** @name PalletProjectTokenRevenueSplitState (601) */
  export interface PalletProjectTokenRevenueSplitState extends Enum {
    readonly isInactive: boolean;
    readonly isActive: boolean;
    readonly asActive: PalletProjectTokenRevenueSplitInfo;
    readonly type: 'Inactive' | 'Active';
  }

  /** @name PalletProjectTokenRevenueSplitInfo (602) */
  export interface PalletProjectTokenRevenueSplitInfo extends Struct {
    readonly allocation: u128;
    readonly timeline: PalletProjectTokenTimeline;
    readonly dividendsClaimed: u128;
  }

  /** @name PalletProjectTokenTimeline (603) */
  export interface PalletProjectTokenTimeline extends Struct {
    readonly start: u32;
    readonly duration: u32;
  }

  /** @name PalletProjectTokenPatronageData (605) */
  export interface PalletProjectTokenPatronageData extends Struct {
    readonly rate: Perquintill;
    readonly unclaimedPatronageTallyAmount: u128;
    readonly lastUnclaimedPatronageTallyBlock: u32;
  }

  /** @name PalletProjectTokenErrorsError (607) */
  export interface PalletProjectTokenErrorsError extends Enum {
    readonly isArithmeticError: boolean;
    readonly isInsufficientTransferrableBalance: boolean;
    readonly isTokenDoesNotExist: boolean;
    readonly isAccountInformationDoesNotExist: boolean;
    readonly isMerkleProofVerificationFailure: boolean;
    readonly isTargetPatronageRateIsHigherThanCurrentRate: boolean;
    readonly isTokenSymbolAlreadyInUse: boolean;
    readonly isInitialAllocationToNonExistingMember: boolean;
    readonly isAccountAlreadyExists: boolean;
    readonly isTransferDestinationMemberDoesNotExist: boolean;
    readonly isTokenIssuanceNotInIdleState: boolean;
    readonly isInsufficientJoyBalance: boolean;
    readonly isJoyTransferSubjectToDusting: boolean;
    readonly isAttemptToRemoveNonOwnedAccountUnderPermissionedMode: boolean;
    readonly isAttemptToRemoveNonEmptyAccount: boolean;
    readonly isCannotJoinWhitelistInPermissionlessMode: boolean;
    readonly isCannotDeissueTokenWithOutstandingAccounts: boolean;
    readonly isNoUpcomingSale: boolean;
    readonly isNoActiveSale: boolean;
    readonly isInsufficientBalanceForTokenPurchase: boolean;
    readonly isNotEnoughTokensOnSale: boolean;
    readonly isSaleStartingBlockInThePast: boolean;
    readonly isSaleAccessProofRequired: boolean;
    readonly isSaleAccessProofParticipantIsNotSender: boolean;
    readonly isSalePurchaseCapExceeded: boolean;
    readonly isMaxVestingSchedulesPerAccountPerTokenReached: boolean;
    readonly isPreviousSaleNotFinalized: boolean;
    readonly isNoTokensToRecover: boolean;
    readonly isSaleDurationTooShort: boolean;
    readonly isSaleDurationIsZero: boolean;
    readonly isSaleUpperBoundQuantityIsZero: boolean;
    readonly isSaleCapPerMemberIsZero: boolean;
    readonly isSaleUnitPriceIsZero: boolean;
    readonly isSalePurchaseAmountIsZero: boolean;
    readonly isRevenueSplitTimeToStartTooShort: boolean;
    readonly isRevenueSplitDurationTooShort: boolean;
    readonly isRevenueSplitAlreadyActiveForToken: boolean;
    readonly isRevenueSplitNotActiveForToken: boolean;
    readonly isRevenueSplitDidNotEnd: boolean;
    readonly isRevenueSplitNotOngoing: boolean;
    readonly isUserAlreadyParticipating: boolean;
    readonly isInsufficientBalanceForSplitParticipation: boolean;
    readonly isUserNotParticipantingInAnySplit: boolean;
    readonly isCannotParticipateInSplitWithZeroAmount: boolean;
    readonly isCannotIssueSplitWithZeroAllocationAmount: boolean;
    readonly isCannotModifySupplyWhenRevenueSplitsAreActive: boolean;
    readonly isRevenueSplitRateIsZero: boolean;
    readonly isBurnAmountIsZero: boolean;
    readonly isBurnAmountGreaterThanAccountTokensAmount: boolean;
    readonly type: 'ArithmeticError' | 'InsufficientTransferrableBalance' | 'TokenDoesNotExist' | 'AccountInformationDoesNotExist' | 'MerkleProofVerificationFailure' | 'TargetPatronageRateIsHigherThanCurrentRate' | 'TokenSymbolAlreadyInUse' | 'InitialAllocationToNonExistingMember' | 'AccountAlreadyExists' | 'TransferDestinationMemberDoesNotExist' | 'TokenIssuanceNotInIdleState' | 'InsufficientJoyBalance' | 'JoyTransferSubjectToDusting' | 'AttemptToRemoveNonOwnedAccountUnderPermissionedMode' | 'AttemptToRemoveNonEmptyAccount' | 'CannotJoinWhitelistInPermissionlessMode' | 'CannotDeissueTokenWithOutstandingAccounts' | 'NoUpcomingSale' | 'NoActiveSale' | 'InsufficientBalanceForTokenPurchase' | 'NotEnoughTokensOnSale' | 'SaleStartingBlockInThePast' | 'SaleAccessProofRequired' | 'SaleAccessProofParticipantIsNotSender' | 'SalePurchaseCapExceeded' | 'MaxVestingSchedulesPerAccountPerTokenReached' | 'PreviousSaleNotFinalized' | 'NoTokensToRecover' | 'SaleDurationTooShort' | 'SaleDurationIsZero' | 'SaleUpperBoundQuantityIsZero' | 'SaleCapPerMemberIsZero' | 'SaleUnitPriceIsZero' | 'SalePurchaseAmountIsZero' | 'RevenueSplitTimeToStartTooShort' | 'RevenueSplitDurationTooShort' | 'RevenueSplitAlreadyActiveForToken' | 'RevenueSplitNotActiveForToken' | 'RevenueSplitDidNotEnd' | 'RevenueSplitNotOngoing' | 'UserAlreadyParticipating' | 'InsufficientBalanceForSplitParticipation' | 'UserNotParticipantingInAnySplit' | 'CannotParticipateInSplitWithZeroAmount' | 'CannotIssueSplitWithZeroAllocationAmount' | 'CannotModifySupplyWhenRevenueSplitsAreActive' | 'RevenueSplitRateIsZero' | 'BurnAmountIsZero' | 'BurnAmountGreaterThanAccountTokensAmount';
  }

  /** @name PalletProposalsEngineProposal (608) */
  export interface PalletProposalsEngineProposal extends Struct {
    readonly parameters: PalletProposalsEngineProposalParameters;
    readonly proposerId: u64;
    readonly activatedAt: u32;
    readonly status: PalletProposalsEngineProposalStatusesProposalStatus;
    readonly votingResults: PalletProposalsEngineVotingResults;
    readonly exactExecutionBlock: Option<u32>;
    readonly nrOfCouncilConfirmations: u32;
    readonly stakingAccountId: Option<AccountId32>;
  }

  /** @name PalletProposalsEngineProposalParameters (609) */
  export interface PalletProposalsEngineProposalParameters extends Struct {
    readonly votingPeriod: u32;
    readonly gracePeriod: u32;
    readonly approvalQuorumPercentage: u32;
    readonly approvalThresholdPercentage: u32;
    readonly slashingQuorumPercentage: u32;
    readonly slashingThresholdPercentage: u32;
    readonly requiredStake: Option<u128>;
    readonly constitutionality: u32;
  }

  /** @name PalletProposalsEngineVotingResults (610) */
  export interface PalletProposalsEngineVotingResults extends Struct {
    readonly abstentions: u32;
    readonly approvals: u32;
    readonly rejections: u32;
    readonly slashes: u32;
  }

  /** @name PalletProposalsEngineError (613) */
  export interface PalletProposalsEngineError extends Enum {
    readonly isArithmeticError: boolean;
    readonly isEmptyTitleProvided: boolean;
    readonly isEmptyDescriptionProvided: boolean;
    readonly isTitleIsTooLong: boolean;
    readonly isDescriptionIsTooLong: boolean;
    readonly isProposalNotFound: boolean;
    readonly isProposalFinalized: boolean;
    readonly isAlreadyVoted: boolean;
    readonly isNotAuthor: boolean;
    readonly isMaxActiveProposalNumberExceeded: boolean;
    readonly isEmptyStake: boolean;
    readonly isStakeShouldBeEmpty: boolean;
    readonly isStakeDiffersFromRequired: boolean;
    readonly isInvalidParameterApprovalThreshold: boolean;
    readonly isInvalidParameterSlashingThreshold: boolean;
    readonly isRequireRootOrigin: boolean;
    readonly isProposalHasVotes: boolean;
    readonly isZeroExactExecutionBlock: boolean;
    readonly isInvalidExactExecutionBlock: boolean;
    readonly isInsufficientBalanceForStake: boolean;
    readonly isConflictingStakes: boolean;
    readonly isInvalidStakingAccountForMember: boolean;
    readonly isMaxDispatchableCallCodeSizeExceeded: boolean;
    readonly type: 'ArithmeticError' | 'EmptyTitleProvided' | 'EmptyDescriptionProvided' | 'TitleIsTooLong' | 'DescriptionIsTooLong' | 'ProposalNotFound' | 'ProposalFinalized' | 'AlreadyVoted' | 'NotAuthor' | 'MaxActiveProposalNumberExceeded' | 'EmptyStake' | 'StakeShouldBeEmpty' | 'StakeDiffersFromRequired' | 'InvalidParameterApprovalThreshold' | 'InvalidParameterSlashingThreshold' | 'RequireRootOrigin' | 'ProposalHasVotes' | 'ZeroExactExecutionBlock' | 'InvalidExactExecutionBlock' | 'InsufficientBalanceForStake' | 'ConflictingStakes' | 'InvalidStakingAccountForMember' | 'MaxDispatchableCallCodeSizeExceeded';
  }

  /** @name PalletProposalsDiscussionDiscussionThread (614) */
  export interface PalletProposalsDiscussionDiscussionThread extends Struct {
    readonly activatedAt: u32;
    readonly authorId: u64;
    readonly mode: PalletProposalsDiscussionThreadModeBoundedBTreeSet;
  }

  /** @name PalletProposalsDiscussionThreadModeBoundedBTreeSet (616) */
  export interface PalletProposalsDiscussionThreadModeBoundedBTreeSet extends Enum {
    readonly isOpen: boolean;
    readonly isClosed: boolean;
    readonly asClosed: BTreeSet<u64>;
    readonly type: 'Open' | 'Closed';
  }

  /** @name PalletProposalsDiscussionDiscussionPost (617) */
  export interface PalletProposalsDiscussionDiscussionPost extends Struct {
    readonly authorId: u64;
    readonly cleanupPayOff: PalletCommonBloatBondRepayableBloatBond;
    readonly lastEdited: u32;
  }

  /** @name PalletProposalsDiscussionError (618) */
  export interface PalletProposalsDiscussionError extends Enum {
    readonly isArithmeticError: boolean;
    readonly isThreadDoesntExist: boolean;
    readonly isPostDoesntExist: boolean;
    readonly isRequireRootOrigin: boolean;
    readonly isCannotPostOnClosedThread: boolean;
    readonly isNotAuthorOrCouncilor: boolean;
    readonly isMaxWhiteListSizeExceeded: boolean;
    readonly isWhitelistedMemberDoesNotExist: boolean;
    readonly isInsufficientBalanceForPost: boolean;
    readonly isCannotDeletePost: boolean;
    readonly type: 'ArithmeticError' | 'ThreadDoesntExist' | 'PostDoesntExist' | 'RequireRootOrigin' | 'CannotPostOnClosedThread' | 'NotAuthorOrCouncilor' | 'MaxWhiteListSizeExceeded' | 'WhitelistedMemberDoesNotExist' | 'InsufficientBalanceForPost' | 'CannotDeletePost';
  }

  /** @name PalletProposalsCodexError (619) */
  export interface PalletProposalsCodexError extends Enum {
    readonly isSignalProposalIsEmpty: boolean;
    readonly isRuntimeProposalIsEmpty: boolean;
    readonly isInvalidFundingRequestProposalBalance: boolean;
    readonly isInvalidValidatorCount: boolean;
    readonly isRequireRootOrigin: boolean;
    readonly isInvalidCouncilElectionParameterCouncilSize: boolean;
    readonly isInvalidCouncilElectionParameterCandidacyLimit: boolean;
    readonly isInvalidCouncilElectionParameterMinVotingStake: boolean;
    readonly isInvalidCouncilElectionParameterNewTermDuration: boolean;
    readonly isInvalidCouncilElectionParameterMinCouncilStake: boolean;
    readonly isInvalidCouncilElectionParameterRevealingPeriod: boolean;
    readonly isInvalidCouncilElectionParameterVotingPeriod: boolean;
    readonly isInvalidCouncilElectionParameterAnnouncingPeriod: boolean;
    readonly isInvalidWorkingGroupBudgetCapacity: boolean;
    readonly isInvalidSetLeadParameterCannotBeCouncilor: boolean;
    readonly isSlashingStakeIsZero: boolean;
    readonly isDecreasingStakeIsZero: boolean;
    readonly isInsufficientFundsForBudgetUpdate: boolean;
    readonly isInvalidFundingRequestProposalNumberOfAccount: boolean;
    readonly isInvalidFundingRequestProposalRepeatedAccount: boolean;
    readonly isInvalidChannelPayoutsProposalMinCashoutExceedsMaxCashout: boolean;
    readonly isInvalidLeadWorkerId: boolean;
    readonly isInvalidLeadOpeningId: boolean;
    readonly isInvalidLeadApplicationId: boolean;
    readonly isInvalidProposalId: boolean;
    readonly isArithmeticError: boolean;
    readonly type: 'SignalProposalIsEmpty' | 'RuntimeProposalIsEmpty' | 'InvalidFundingRequestProposalBalance' | 'InvalidValidatorCount' | 'RequireRootOrigin' | 'InvalidCouncilElectionParameterCouncilSize' | 'InvalidCouncilElectionParameterCandidacyLimit' | 'InvalidCouncilElectionParameterMinVotingStake' | 'InvalidCouncilElectionParameterNewTermDuration' | 'InvalidCouncilElectionParameterMinCouncilStake' | 'InvalidCouncilElectionParameterRevealingPeriod' | 'InvalidCouncilElectionParameterVotingPeriod' | 'InvalidCouncilElectionParameterAnnouncingPeriod' | 'InvalidWorkingGroupBudgetCapacity' | 'InvalidSetLeadParameterCannotBeCouncilor' | 'SlashingStakeIsZero' | 'DecreasingStakeIsZero' | 'InsufficientFundsForBudgetUpdate' | 'InvalidFundingRequestProposalNumberOfAccount' | 'InvalidFundingRequestProposalRepeatedAccount' | 'InvalidChannelPayoutsProposalMinCashoutExceedsMaxCashout' | 'InvalidLeadWorkerId' | 'InvalidLeadOpeningId' | 'InvalidLeadApplicationId' | 'InvalidProposalId' | 'ArithmeticError';
  }

  /** @name PalletWorkingGroupOpening (620) */
  export interface PalletWorkingGroupOpening extends Struct {
    readonly openingType: PalletWorkingGroupOpeningType;
    readonly created: u32;
    readonly descriptionHash: H256;
    readonly stakePolicy: PalletWorkingGroupStakePolicy;
    readonly rewardPerBlock: Option<u128>;
    readonly creationStake: u128;
  }

  /** @name PalletWorkingGroupJobApplication (621) */
  export interface PalletWorkingGroupJobApplication extends Struct {
    readonly roleAccountId: AccountId32;
    readonly rewardAccountId: AccountId32;
    readonly stakingAccountId: AccountId32;
    readonly memberId: u64;
    readonly descriptionHash: H256;
    readonly openingId: u64;
  }

  /** @name PalletWorkingGroupGroupWorker (622) */
  export interface PalletWorkingGroupGroupWorker extends Struct {
    readonly memberId: u64;
    readonly roleAccountId: AccountId32;
    readonly stakingAccountId: AccountId32;
    readonly rewardAccountId: AccountId32;
    readonly startedLeavingAt: Option<u32>;
    readonly jobUnstakingPeriod: u32;
    readonly rewardPerBlock: Option<u128>;
    readonly missedReward: Option<u128>;
    readonly createdAt: u32;
  }

  /** @name PalletWorkingGroupErrorsError (623) */
  export interface PalletWorkingGroupErrorsError extends Enum {
    readonly isArithmeticError: boolean;
    readonly isStakeBalanceCannotBeZero: boolean;
    readonly isOpeningDoesNotExist: boolean;
    readonly isCannotHireMultipleLeaders: boolean;
    readonly isWorkerApplicationDoesNotExist: boolean;
    readonly isMaxActiveWorkerNumberExceeded: boolean;
    readonly isSuccessfulWorkerApplicationDoesNotExist: boolean;
    readonly isCannotHireLeaderWhenLeaderExists: boolean;
    readonly isIsNotLeadAccount: boolean;
    readonly isCurrentLeadNotSet: boolean;
    readonly isWorkerDoesNotExist: boolean;
    readonly isInvalidMemberOrigin: boolean;
    readonly isSignerIsNotWorkerRoleAccount: boolean;
    readonly isBelowMinimumStakes: boolean;
    readonly isInsufficientBalanceToCoverStake: boolean;
    readonly isApplicationStakeDoesntMatchOpening: boolean;
    readonly isOriginIsNotApplicant: boolean;
    readonly isWorkerIsLeaving: boolean;
    readonly isCannotRewardWithZero: boolean;
    readonly isInvalidStakingAccountForMember: boolean;
    readonly isConflictStakesOnAccount: boolean;
    readonly isWorkerHasNoReward: boolean;
    readonly isUnstakingPeriodLessThanMinimum: boolean;
    readonly isCannotSpendZero: boolean;
    readonly isInsufficientBudgetForSpending: boolean;
    readonly isNoApplicationsProvided: boolean;
    readonly isCannotDecreaseStakeDeltaGreaterThanStake: boolean;
    readonly isApplicationsNotForOpening: boolean;
    readonly isWorkerStorageValueTooLong: boolean;
    readonly isInsufficientTokensForFunding: boolean;
    readonly isZeroTokensFunding: boolean;
    readonly isInsufficientBalanceForTransfer: boolean;
    readonly type: 'ArithmeticError' | 'StakeBalanceCannotBeZero' | 'OpeningDoesNotExist' | 'CannotHireMultipleLeaders' | 'WorkerApplicationDoesNotExist' | 'MaxActiveWorkerNumberExceeded' | 'SuccessfulWorkerApplicationDoesNotExist' | 'CannotHireLeaderWhenLeaderExists' | 'IsNotLeadAccount' | 'CurrentLeadNotSet' | 'WorkerDoesNotExist' | 'InvalidMemberOrigin' | 'SignerIsNotWorkerRoleAccount' | 'BelowMinimumStakes' | 'InsufficientBalanceToCoverStake' | 'ApplicationStakeDoesntMatchOpening' | 'OriginIsNotApplicant' | 'WorkerIsLeaving' | 'CannotRewardWithZero' | 'InvalidStakingAccountForMember' | 'ConflictStakesOnAccount' | 'WorkerHasNoReward' | 'UnstakingPeriodLessThanMinimum' | 'CannotSpendZero' | 'InsufficientBudgetForSpending' | 'NoApplicationsProvided' | 'CannotDecreaseStakeDeltaGreaterThanStake' | 'ApplicationsNotForOpening' | 'WorkerStorageValueTooLong' | 'InsufficientTokensForFunding' | 'ZeroTokensFunding' | 'InsufficientBalanceForTransfer';
  }

  /** @name SpRuntimeMultiSignature (633) */
  export interface SpRuntimeMultiSignature extends Enum {
    readonly isEd25519: boolean;
    readonly asEd25519: SpCoreEd25519Signature;
    readonly isSr25519: boolean;
    readonly asSr25519: SpCoreSr25519Signature;
    readonly isEcdsa: boolean;
    readonly asEcdsa: SpCoreEcdsaSignature;
    readonly type: 'Ed25519' | 'Sr25519' | 'Ecdsa';
  }

  /** @name SpCoreEcdsaSignature (634) */
  export interface SpCoreEcdsaSignature extends U8aFixed {}

  /** @name FrameSystemExtensionsCheckNonZeroSender (637) */
  export type FrameSystemExtensionsCheckNonZeroSender = Null;

  /** @name FrameSystemExtensionsCheckSpecVersion (638) */
  export type FrameSystemExtensionsCheckSpecVersion = Null;

  /** @name FrameSystemExtensionsCheckTxVersion (639) */
  export type FrameSystemExtensionsCheckTxVersion = Null;

  /** @name FrameSystemExtensionsCheckGenesis (640) */
  export type FrameSystemExtensionsCheckGenesis = Null;

  /** @name FrameSystemExtensionsCheckNonce (643) */
  export interface FrameSystemExtensionsCheckNonce extends Compact<u32> {}

  /** @name FrameSystemExtensionsCheckWeight (644) */
  export type FrameSystemExtensionsCheckWeight = Null;

  /** @name PalletTransactionPaymentChargeTransactionPayment (645) */
  export interface PalletTransactionPaymentChargeTransactionPayment extends Compact<u128> {}

  /** @name JoystreamNodeRuntimeRuntime (646) */
  export type JoystreamNodeRuntimeRuntime = Null;

} // declare module
