// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { ApiTypes } from '@polkadot/api/types';

declare module '@polkadot/api/types/errors' {
  export interface AugmentedErrors<ApiType> {
    authorship: {
      /**
       * The uncle is genesis.
       **/
      GenesisUncle: AugmentedError<ApiType>;
      /**
       * The uncle parent not in the chain.
       **/
      InvalidUncleParent: AugmentedError<ApiType>;
      /**
       * The uncle isn't recent enough to be included.
       **/
      OldUncle: AugmentedError<ApiType>;
      /**
       * The uncle is too high in chain.
       **/
      TooHighUncle: AugmentedError<ApiType>;
      /**
       * Too many uncles.
       **/
      TooManyUncles: AugmentedError<ApiType>;
      /**
       * The uncle is already included.
       **/
      UncleAlreadyIncluded: AugmentedError<ApiType>;
      /**
       * Uncles already set in the block.
       **/
      UnclesAlreadySet: AugmentedError<ApiType>;
    };
    balances: {
      /**
       * Beneficiary account must pre-exist
       **/
      DeadAccount: AugmentedError<ApiType>;
      /**
       * Value too low to create account due to existential deposit
       **/
      ExistentialDeposit: AugmentedError<ApiType>;
      /**
       * A vesting schedule already exists for this account
       **/
      ExistingVestingSchedule: AugmentedError<ApiType>;
      /**
       * Balance too low to send value
       **/
      InsufficientBalance: AugmentedError<ApiType>;
      /**
       * Transfer/payment would kill account
       **/
      KeepAlive: AugmentedError<ApiType>;
      /**
       * Account liquidity restrictions prevent withdrawal
       **/
      LiquidityRestrictions: AugmentedError<ApiType>;
      /**
       * Got an overflow after adding
       **/
      Overflow: AugmentedError<ApiType>;
      /**
       * Vesting balance too high to send value
       **/
      VestingBalance: AugmentedError<ApiType>;
    };
    content: {
      /**
       * This content actor cannot own a channel
       **/
      ActorCannotOwnChannel: AugmentedError<ApiType>;
      /**
       * Operation cannot be perfomed with this Actor
       **/
      ActorNotAuthorized: AugmentedError<ApiType>;
      /**
       * Expected root or signed origin
       **/
      BadOrigin: AugmentedError<ApiType>;
      /**
       * Curators can only censor non-curator group owned channels
       **/
      CannotCensoreCuratorGroupOwnedChannels: AugmentedError<ApiType>;
      /**
       * A Channel or Video Category does not exist.
       **/
      CategoryDoesNotExist: AugmentedError<ApiType>;
      /**
       * Channel does not exist
       **/
      ChannelDoesNotExist: AugmentedError<ApiType>;
      /**
       * Curator authentication failed
       **/
      CuratorAuthFailed: AugmentedError<ApiType>;
      /**
       * Given curator group does not exist
       **/
      CuratorGroupDoesNotExist: AugmentedError<ApiType>;
      /**
       * Curator group is not active
       **/
      CuratorGroupIsNotActive: AugmentedError<ApiType>;
      /**
       * Curator id is not a worker id in content working group
       **/
      CuratorIdInvalid: AugmentedError<ApiType>;
      /**
       * Curator under provided curator id is already a member of curaror group under given id
       **/
      CuratorIsAlreadyAMemberOfGivenCuratorGroup: AugmentedError<ApiType>;
      /**
       * Curator under provided curator id is not a member of curaror group under given id
       **/
      CuratorIsNotAMemberOfGivenCuratorGroup: AugmentedError<ApiType>;
      /**
       * Max number of curators per group limit reached
       **/
      CuratorsPerGroupLimitReached: AugmentedError<ApiType>;
      /**
       * Feature Not Implemented
       **/
      FeatureNotImplemented: AugmentedError<ApiType>;
      /**
       * Lead authentication failed
       **/
      LeadAuthFailed: AugmentedError<ApiType>;
      /**
       * Member authentication failed
       **/
      MemberAuthFailed: AugmentedError<ApiType>;
      /**
       * Video does not exist
       **/
      VideoDoesNotExist: AugmentedError<ApiType>;
      /**
       * Video in season can`t be removed (because order is important)
       **/
      VideoInSeason: AugmentedError<ApiType>;
    };
    contentDirectoryWorkingGroup: {
      /**
       * Opening does not exist.
       **/
      AcceptWorkerApplicationsOpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening Is Not in Waiting to begin.
       **/
      AcceptWorkerApplicationsOpeningIsNotWaitingToBegin: AugmentedError<ApiType>;
      /**
       * Opening does not activate in the future.
       **/
      AddWorkerOpeningActivatesInThePast: AugmentedError<ApiType>;
      /**
       * Add worker opening application stake cannot be zero.
       **/
      AddWorkerOpeningApplicationStakeCannotBeZero: AugmentedError<ApiType>;
      /**
       * Application stake amount less than minimum currency balance.
       **/
      AddWorkerOpeningAppliicationStakeLessThanMinimum: AugmentedError<ApiType>;
      /**
       * New application was crowded out.
       **/
      AddWorkerOpeningNewApplicationWasCrowdedOut: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      AddWorkerOpeningOpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening is not in accepting applications stage.
       **/
      AddWorkerOpeningOpeningNotInAcceptingApplicationStage: AugmentedError<ApiType>;
      /**
       * Add worker opening role stake cannot be zero.
       **/
      AddWorkerOpeningRoleStakeCannotBeZero: AugmentedError<ApiType>;
      /**
       * Role stake amount less than minimum currency balance.
       **/
      AddWorkerOpeningRoleStakeLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Stake amount too low.
       **/
      AddWorkerOpeningStakeAmountTooLow: AugmentedError<ApiType>;
      /**
       * Stake missing when required.
       **/
      AddWorkerOpeningStakeMissingWhenRequired: AugmentedError<ApiType>;
      /**
       * Stake provided when redundant.
       **/
      AddWorkerOpeningStakeProvidedWhenRedundant: AugmentedError<ApiType>;
      /**
       * Application rationing has zero max active applicants.
       **/
      AddWorkerOpeningZeroMaxApplicantCount: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (application_rationing_policy):
       * max_active_applicants should be non-zero.
       **/
      ApplicationRationingPolicyMaxActiveApplicantsIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (application_staking_policy):
       * crowded_out_unstaking_period_length should be non-zero.
       **/
      ApplicationStakingPolicyCrowdedOutUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (application_staking_policy):
       * review_period_expired_unstaking_period_length should be non-zero.
       **/
      ApplicationStakingPolicyReviewPeriodUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Signer does not match controller account.
       **/
      ApplyOnWorkerOpeningSignerNotControllerAccount: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      BeginWorkerApplicantReviewOpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening Is Not in Waiting.
       **/
      BeginWorkerApplicantReviewOpeningOpeningIsNotWaitingToBegin: AugmentedError<ApiType>;
      /**
       * Cannot find mint in the minting module.
       **/
      CannotFindMint: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * exit_role_application_stake_unstaking_period should be non-zero.
       **/
      ExitRoleApplicationStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * exit_role_stake_unstaking_period should be non-zero.
       **/
      ExitRoleStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * fill_opening_failed_applicant_application_stake_unstaking_period should be non-zero.
       **/
      FillOpeningFailedApplicantApplicationStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * fill_opening_failed_applicant_role_stake_unstaking_period should be non-zero.
       **/
      FillOpeningFailedApplicantRoleStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Reward policy has invalid next payment block number.
       **/
      FillOpeningInvalidNextPaymentBlock: AugmentedError<ApiType>;
      /**
       * Working group mint does not exist.
       **/
      FillOpeningMintDoesNotExist: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * fill_opening_successful_applicant_application_stake_unstaking_period should be non-zero.
       **/
      FillOpeningSuccessfulApplicantApplicationStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Applications not for opening.
       **/
      FillWorkerOpeningApplicationForWrongOpening: AugmentedError<ApiType>;
      /**
       * Application does not exist.
       **/
      FullWorkerOpeningApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Application not in active stage.
       **/
      FullWorkerOpeningApplicationNotActive: AugmentedError<ApiType>;
      /**
       * OpeningDoesNotExist.
       **/
      FullWorkerOpeningOpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening not in review period stage.
       **/
      FullWorkerOpeningOpeningNotInReviewPeriodStage: AugmentedError<ApiType>;
      /**
       * Application stake unstaking period for successful applicants redundant.
       **/
      FullWorkerOpeningSuccessfulApplicationStakeUnstakingPeriodRedundant: AugmentedError<ApiType>;
      /**
       * Application stake unstaking period for failed applicants too short.
       **/
      FullWorkerOpeningSuccessfulApplicationStakeUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Role stake unstaking period for successful applicants redundant.
       **/
      FullWorkerOpeningSuccessfulRoleStakeUnstakingPeriodRedundant: AugmentedError<ApiType>;
      /**
       * Role stake unstaking period for successful applicants too short.
       **/
      FullWorkerOpeningSuccessfulRoleStakeUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Application stake unstaking period for failed applicants redundant.
       **/
      FullWorkerOpeningUnsuccessfulApplicationStakeUnstakingPeriodRedundant: AugmentedError<ApiType>;
      /**
       * Application stake unstaking period for successful applicants too short.
       **/
      FullWorkerOpeningUnsuccessfulApplicationStakeUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Role stake unstaking period for failed applicants redundant.
       **/
      FullWorkerOpeningUnsuccessfulRoleStakeUnstakingPeriodRedundant: AugmentedError<ApiType>;
      /**
       * Role stake unstaking period for failed applicants too short.
       **/
      FullWorkerOpeningUnsuccessfulRoleStakeUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Insufficient balance to apply.
       **/
      InsufficientBalanceToApply: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Member already has an active application on the opening.
       **/
      MemberHasActiveApplicationOnOpening: AugmentedError<ApiType>;
      /**
       * Member id is invalid.
       **/
      MembershipInvalidMemberId: AugmentedError<ApiType>;
      /**
       * Unsigned origin.
       **/
      MembershipUnsignedOrigin: AugmentedError<ApiType>;
      /**
       * Minting error: NextAdjustmentInPast
       **/
      MintingErrorNextAdjustmentInPast: AugmentedError<ApiType>;
      /**
       * Cannot get the worker stake profile.
       **/
      NoWorkerStakeProfile: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening text too long.
       **/
      OpeningTextTooLong: AugmentedError<ApiType>;
      /**
       * Opening text too short.
       **/
      OpeningTextTooShort: AugmentedError<ApiType>;
      /**
       * Origin must be controller or root account of member.
       **/
      OriginIsNeitherMemberControllerOrRoot: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Next payment is not in the future.
       **/
      RecurringRewardsNextPaymentNotInFuture: AugmentedError<ApiType>;
      /**
       * Recipient not found.
       **/
      RecurringRewardsRecipientNotFound: AugmentedError<ApiType>;
      /**
       * Reward relationship not found.
       **/
      RecurringRewardsRewardRelationshipNotFound: AugmentedError<ApiType>;
      /**
       * Recipient reward source not found.
       **/
      RecurringRewardsRewardSourceNotFound: AugmentedError<ApiType>;
      /**
       * Relationship must exist.
       **/
      RelationshipMustExist: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics.
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
      /**
       * Require signed origin in extrinsics.
       **/
      RequireSignedOrigin: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (role_staking_policy):
       * crowded_out_unstaking_period_length should be non-zero.
       **/
      RoleStakingPolicyCrowdedOutUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (role_staking_policy):
       * review_period_expired_unstaking_period_length should be non-zero.
       **/
      RoleStakingPolicyReviewPeriodUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Already unstaking.
       **/
      StakingErrorAlreadyUnstaking: AugmentedError<ApiType>;
      /**
       * Cannot change stake by zero.
       **/
      StakingErrorCannotChangeStakeByZero: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake while slashes ongoing.
       **/
      StakingErrorCannotDecreaseWhileSlashesOngoing: AugmentedError<ApiType>;
      /**
       * Cannot increase stake while unstaking.
       **/
      StakingErrorCannotIncreaseStakeWhileUnstaking: AugmentedError<ApiType>;
      /**
       * Cannot unstake while slashes ongoing.
       **/
      StakingErrorCannotUnstakeWhileSlashesOngoing: AugmentedError<ApiType>;
      /**
       * Insufficient balance in source account.
       **/
      StakingErrorInsufficientBalanceInSourceAccount: AugmentedError<ApiType>;
      /**
       * Insufficient stake to decrease.
       **/
      StakingErrorInsufficientStake: AugmentedError<ApiType>;
      /**
       * Not staked.
       **/
      StakingErrorNotStaked: AugmentedError<ApiType>;
      /**
       * Slash amount should be greater than zero.
       **/
      StakingErrorSlashAmountShouldBeGreaterThanZero: AugmentedError<ApiType>;
      /**
       * Stake not found.
       **/
      StakingErrorStakeNotFound: AugmentedError<ApiType>;
      /**
       * Unstaking period should be greater than zero.
       **/
      StakingErrorUnstakingPeriodShouldBeGreaterThanZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * terminate_application_stake_unstaking_period should be non-zero.
       **/
      TerminateApplicationStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * terminate_role_stake_unstaking_period should be non-zero.
       **/
      TerminateRoleStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Application does not exist.
       **/
      WithdrawWorkerApplicationApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Application is not active.
       **/
      WithdrawWorkerApplicationApplicationNotActive: AugmentedError<ApiType>;
      /**
       * Opening not accepting applications.
       **/
      WithdrawWorkerApplicationOpeningNotAcceptingApplications: AugmentedError<ApiType>;
      /**
       * Redundant unstaking period provided
       **/
      WithdrawWorkerApplicationRedundantUnstakingPeriod: AugmentedError<ApiType>;
      /**
       * UnstakingPeriodTooShort .... // <== SHOULD REALLY BE TWO SEPARATE, ONE FOR EACH STAKING PURPOSE
       **/
      WithdrawWorkerApplicationUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker application text too long.
       **/
      WorkerApplicationTextTooLong: AugmentedError<ApiType>;
      /**
       * Worker application text too short.
       **/
      WorkerApplicationTextTooShort: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker exit rationale text is too long.
       **/
      WorkerExitRationaleTextTooLong: AugmentedError<ApiType>;
      /**
       * Worker exit rationale text is too short.
       **/
      WorkerExitRationaleTextTooShort: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
    };
    dataDirectory: {
      /**
       * Content with this ID not found.
       **/
      CidNotFound: AugmentedError<ApiType>;
      /**
       * Content uploading blocked.
       **/
      ContentUploadingBlocked: AugmentedError<ApiType>;
      /**
       * "Data object already added under this content id".
       **/
      DataObjectAlreadyAdded: AugmentedError<ApiType>;
      /**
       * DataObject Injection Failed. Too Many DataObjects.
       **/
      DataObjectsInjectionExceededLimit: AugmentedError<ApiType>;
      /**
       * Cannot create content for inactive or missing data object type.
       **/
      DataObjectTypeMustBeActive: AugmentedError<ApiType>;
      /**
       * Provided owner should be equal o the data object owner under given content id
       **/
      OwnersAreNotEqual: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics.
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
      /**
       * New voucher limit being set is less than used.
       **/
      VoucherLimitLessThanUsed: AugmentedError<ApiType>;
      /**
       * Contant uploading failed. Actor voucher objects limit exceeded.
       **/
      VoucherObjectsLimitExceeded: AugmentedError<ApiType>;
      /**
       * Voucher objects limit upper bound exceeded
       **/
      VoucherObjectsLimitUpperBoundExceeded: AugmentedError<ApiType>;
      /**
       * Overflow detected when changing
       **/
      VoucherOverflow: AugmentedError<ApiType>;
      /**
       * Contant uploading failed. Actor voucher size limit exceeded.
       **/
      VoucherSizeLimitExceeded: AugmentedError<ApiType>;
      /**
       * Voucher size limit upper bound exceeded
       **/
      VoucherSizeLimitUpperBoundExceeded: AugmentedError<ApiType>;
    };
    dataObjectStorageRegistry: {
      /**
       * Content with this ID not found.
       **/
      CidNotFound: AugmentedError<ApiType>;
      /**
       * No data object storage relationship found for this ID.
       **/
      DataObjectStorageRelationshipNotFound: AugmentedError<ApiType>;
      /**
       * Only the storage provider in a DOSR can decide whether they're ready.
       **/
      OnlyStorageProviderMayClaimReady: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
    };
    dataObjectTypeRegistry: {
      /**
       * Data Object Type with the given ID not found.
       **/
      DataObjectTypeNotFound: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
    };
    finalityTracker: {
      /**
       * Final hint must be updated only once in the block
       **/
      AlreadyUpdated: AugmentedError<ApiType>;
      /**
       * Finalized height above block number
       **/
      BadHint: AugmentedError<ApiType>;
    };
    gatewayWorkingGroup: {
      /**
       * Opening does not exist.
       **/
      AcceptWorkerApplicationsOpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening Is Not in Waiting to begin.
       **/
      AcceptWorkerApplicationsOpeningIsNotWaitingToBegin: AugmentedError<ApiType>;
      /**
       * Opening does not activate in the future.
       **/
      AddWorkerOpeningActivatesInThePast: AugmentedError<ApiType>;
      /**
       * Add worker opening application stake cannot be zero.
       **/
      AddWorkerOpeningApplicationStakeCannotBeZero: AugmentedError<ApiType>;
      /**
       * Application stake amount less than minimum currency balance.
       **/
      AddWorkerOpeningAppliicationStakeLessThanMinimum: AugmentedError<ApiType>;
      /**
       * New application was crowded out.
       **/
      AddWorkerOpeningNewApplicationWasCrowdedOut: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      AddWorkerOpeningOpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening is not in accepting applications stage.
       **/
      AddWorkerOpeningOpeningNotInAcceptingApplicationStage: AugmentedError<ApiType>;
      /**
       * Add worker opening role stake cannot be zero.
       **/
      AddWorkerOpeningRoleStakeCannotBeZero: AugmentedError<ApiType>;
      /**
       * Role stake amount less than minimum currency balance.
       **/
      AddWorkerOpeningRoleStakeLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Stake amount too low.
       **/
      AddWorkerOpeningStakeAmountTooLow: AugmentedError<ApiType>;
      /**
       * Stake missing when required.
       **/
      AddWorkerOpeningStakeMissingWhenRequired: AugmentedError<ApiType>;
      /**
       * Stake provided when redundant.
       **/
      AddWorkerOpeningStakeProvidedWhenRedundant: AugmentedError<ApiType>;
      /**
       * Application rationing has zero max active applicants.
       **/
      AddWorkerOpeningZeroMaxApplicantCount: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (application_rationing_policy):
       * max_active_applicants should be non-zero.
       **/
      ApplicationRationingPolicyMaxActiveApplicantsIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (application_staking_policy):
       * crowded_out_unstaking_period_length should be non-zero.
       **/
      ApplicationStakingPolicyCrowdedOutUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (application_staking_policy):
       * review_period_expired_unstaking_period_length should be non-zero.
       **/
      ApplicationStakingPolicyReviewPeriodUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Signer does not match controller account.
       **/
      ApplyOnWorkerOpeningSignerNotControllerAccount: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      BeginWorkerApplicantReviewOpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening Is Not in Waiting.
       **/
      BeginWorkerApplicantReviewOpeningOpeningIsNotWaitingToBegin: AugmentedError<ApiType>;
      /**
       * Cannot find mint in the minting module.
       **/
      CannotFindMint: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * exit_role_application_stake_unstaking_period should be non-zero.
       **/
      ExitRoleApplicationStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * exit_role_stake_unstaking_period should be non-zero.
       **/
      ExitRoleStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * fill_opening_failed_applicant_application_stake_unstaking_period should be non-zero.
       **/
      FillOpeningFailedApplicantApplicationStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * fill_opening_failed_applicant_role_stake_unstaking_period should be non-zero.
       **/
      FillOpeningFailedApplicantRoleStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Reward policy has invalid next payment block number.
       **/
      FillOpeningInvalidNextPaymentBlock: AugmentedError<ApiType>;
      /**
       * Working group mint does not exist.
       **/
      FillOpeningMintDoesNotExist: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * fill_opening_successful_applicant_application_stake_unstaking_period should be non-zero.
       **/
      FillOpeningSuccessfulApplicantApplicationStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Applications not for opening.
       **/
      FillWorkerOpeningApplicationForWrongOpening: AugmentedError<ApiType>;
      /**
       * Application does not exist.
       **/
      FullWorkerOpeningApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Application not in active stage.
       **/
      FullWorkerOpeningApplicationNotActive: AugmentedError<ApiType>;
      /**
       * OpeningDoesNotExist.
       **/
      FullWorkerOpeningOpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening not in review period stage.
       **/
      FullWorkerOpeningOpeningNotInReviewPeriodStage: AugmentedError<ApiType>;
      /**
       * Application stake unstaking period for successful applicants redundant.
       **/
      FullWorkerOpeningSuccessfulApplicationStakeUnstakingPeriodRedundant: AugmentedError<ApiType>;
      /**
       * Application stake unstaking period for failed applicants too short.
       **/
      FullWorkerOpeningSuccessfulApplicationStakeUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Role stake unstaking period for successful applicants redundant.
       **/
      FullWorkerOpeningSuccessfulRoleStakeUnstakingPeriodRedundant: AugmentedError<ApiType>;
      /**
       * Role stake unstaking period for successful applicants too short.
       **/
      FullWorkerOpeningSuccessfulRoleStakeUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Application stake unstaking period for failed applicants redundant.
       **/
      FullWorkerOpeningUnsuccessfulApplicationStakeUnstakingPeriodRedundant: AugmentedError<ApiType>;
      /**
       * Application stake unstaking period for successful applicants too short.
       **/
      FullWorkerOpeningUnsuccessfulApplicationStakeUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Role stake unstaking period for failed applicants redundant.
       **/
      FullWorkerOpeningUnsuccessfulRoleStakeUnstakingPeriodRedundant: AugmentedError<ApiType>;
      /**
       * Role stake unstaking period for failed applicants too short.
       **/
      FullWorkerOpeningUnsuccessfulRoleStakeUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Insufficient balance to apply.
       **/
      InsufficientBalanceToApply: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Member already has an active application on the opening.
       **/
      MemberHasActiveApplicationOnOpening: AugmentedError<ApiType>;
      /**
       * Member id is invalid.
       **/
      MembershipInvalidMemberId: AugmentedError<ApiType>;
      /**
       * Unsigned origin.
       **/
      MembershipUnsignedOrigin: AugmentedError<ApiType>;
      /**
       * Minting error: NextAdjustmentInPast
       **/
      MintingErrorNextAdjustmentInPast: AugmentedError<ApiType>;
      /**
       * Cannot get the worker stake profile.
       **/
      NoWorkerStakeProfile: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening text too long.
       **/
      OpeningTextTooLong: AugmentedError<ApiType>;
      /**
       * Opening text too short.
       **/
      OpeningTextTooShort: AugmentedError<ApiType>;
      /**
       * Origin must be controller or root account of member.
       **/
      OriginIsNeitherMemberControllerOrRoot: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Next payment is not in the future.
       **/
      RecurringRewardsNextPaymentNotInFuture: AugmentedError<ApiType>;
      /**
       * Recipient not found.
       **/
      RecurringRewardsRecipientNotFound: AugmentedError<ApiType>;
      /**
       * Reward relationship not found.
       **/
      RecurringRewardsRewardRelationshipNotFound: AugmentedError<ApiType>;
      /**
       * Recipient reward source not found.
       **/
      RecurringRewardsRewardSourceNotFound: AugmentedError<ApiType>;
      /**
       * Relationship must exist.
       **/
      RelationshipMustExist: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics.
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
      /**
       * Require signed origin in extrinsics.
       **/
      RequireSignedOrigin: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (role_staking_policy):
       * crowded_out_unstaking_period_length should be non-zero.
       **/
      RoleStakingPolicyCrowdedOutUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (role_staking_policy):
       * review_period_expired_unstaking_period_length should be non-zero.
       **/
      RoleStakingPolicyReviewPeriodUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Already unstaking.
       **/
      StakingErrorAlreadyUnstaking: AugmentedError<ApiType>;
      /**
       * Cannot change stake by zero.
       **/
      StakingErrorCannotChangeStakeByZero: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake while slashes ongoing.
       **/
      StakingErrorCannotDecreaseWhileSlashesOngoing: AugmentedError<ApiType>;
      /**
       * Cannot increase stake while unstaking.
       **/
      StakingErrorCannotIncreaseStakeWhileUnstaking: AugmentedError<ApiType>;
      /**
       * Cannot unstake while slashes ongoing.
       **/
      StakingErrorCannotUnstakeWhileSlashesOngoing: AugmentedError<ApiType>;
      /**
       * Insufficient balance in source account.
       **/
      StakingErrorInsufficientBalanceInSourceAccount: AugmentedError<ApiType>;
      /**
       * Insufficient stake to decrease.
       **/
      StakingErrorInsufficientStake: AugmentedError<ApiType>;
      /**
       * Not staked.
       **/
      StakingErrorNotStaked: AugmentedError<ApiType>;
      /**
       * Slash amount should be greater than zero.
       **/
      StakingErrorSlashAmountShouldBeGreaterThanZero: AugmentedError<ApiType>;
      /**
       * Stake not found.
       **/
      StakingErrorStakeNotFound: AugmentedError<ApiType>;
      /**
       * Unstaking period should be greater than zero.
       **/
      StakingErrorUnstakingPeriodShouldBeGreaterThanZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * terminate_application_stake_unstaking_period should be non-zero.
       **/
      TerminateApplicationStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * terminate_role_stake_unstaking_period should be non-zero.
       **/
      TerminateRoleStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Application does not exist.
       **/
      WithdrawWorkerApplicationApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Application is not active.
       **/
      WithdrawWorkerApplicationApplicationNotActive: AugmentedError<ApiType>;
      /**
       * Opening not accepting applications.
       **/
      WithdrawWorkerApplicationOpeningNotAcceptingApplications: AugmentedError<ApiType>;
      /**
       * Redundant unstaking period provided
       **/
      WithdrawWorkerApplicationRedundantUnstakingPeriod: AugmentedError<ApiType>;
      /**
       * UnstakingPeriodTooShort .... // <== SHOULD REALLY BE TWO SEPARATE, ONE FOR EACH STAKING PURPOSE
       **/
      WithdrawWorkerApplicationUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker application text too long.
       **/
      WorkerApplicationTextTooLong: AugmentedError<ApiType>;
      /**
       * Worker application text too short.
       **/
      WorkerApplicationTextTooShort: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker exit rationale text is too long.
       **/
      WorkerExitRationaleTextTooLong: AugmentedError<ApiType>;
      /**
       * Worker exit rationale text is too short.
       **/
      WorkerExitRationaleTextTooShort: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
    };
    grandpa: {
      /**
       * Attempt to signal GRANDPA change with one already pending.
       **/
      ChangePending: AugmentedError<ApiType>;
      /**
       * A given equivocation report is valid but already previously reported.
       **/
      DuplicateOffenceReport: AugmentedError<ApiType>;
      /**
       * A key ownership proof provided as part of an equivocation report is invalid.
       **/
      InvalidKeyOwnershipProof: AugmentedError<ApiType>;
      /**
       * Attempt to signal GRANDPA pause when the authority set isn't live
       * (either paused or already pending pause).
       **/
      PauseFailed: AugmentedError<ApiType>;
      /**
       * Attempt to signal GRANDPA resume when the authority set isn't paused
       * (either live or already pending resume).
       **/
      ResumeFailed: AugmentedError<ApiType>;
      /**
       * Cannot signal forced change so soon after last.
       **/
      TooSoon: AugmentedError<ApiType>;
    };
    imOnline: {
      /**
       * Duplicated heartbeat.
       **/
      DuplicatedHeartbeat: AugmentedError<ApiType>;
      /**
       * Non existent public key.
       **/
      InvalidKey: AugmentedError<ApiType>;
    };
    members: {
      /**
       * Avatar url is too long.
       **/
      AvatarUriTooLong: AugmentedError<ApiType>;
      /**
       * Controller account required.
       **/
      ControllerAccountRequired: AugmentedError<ApiType>;
      /**
       * Handle already registered.
       **/
      HandleAlreadyRegistered: AugmentedError<ApiType>;
      /**
       * Handle must be provided during registration.
       **/
      HandleMustBeProvidedDuringRegistration: AugmentedError<ApiType>;
      /**
       * Handle too long.
       **/
      HandleTooLong: AugmentedError<ApiType>;
      /**
       * Handle too short.
       **/
      HandleTooShort: AugmentedError<ApiType>;
      /**
       * Screening authority attempting to endow more that maximum allowed.
       **/
      InitialBalanceExceedsMaxInitialBalance: AugmentedError<ApiType>;
      /**
       * Member profile not found (invalid member id).
       **/
      MemberProfileNotFound: AugmentedError<ApiType>;
      /**
       * New memberships not allowed.
       **/
      NewMembershipsNotAllowed: AugmentedError<ApiType>;
      /**
       * A screening authority is not defined.
       **/
      NoScreeningAuthorityDefined: AugmentedError<ApiType>;
      /**
       * Not enough balance to buy membership.
       **/
      NotEnoughBalanceToBuyMembership: AugmentedError<ApiType>;
      /**
       * Origin is not the screeing authority.
       **/
      NotScreeningAuthority: AugmentedError<ApiType>;
      /**
       * Only new accounts can be used for screened members.
       **/
      OnlyNewAccountsCanBeUsedForScreenedMembers: AugmentedError<ApiType>;
      /**
       * Paid term id not active.
       **/
      PaidTermIdNotActive: AugmentedError<ApiType>;
      /**
       * Paid term id not found.
       **/
      PaidTermIdNotFound: AugmentedError<ApiType>;
      /**
       * Root account required.
       **/
      RootAccountRequired: AugmentedError<ApiType>;
      /**
       * Invalid origin.
       **/
      UnsignedOrigin: AugmentedError<ApiType>;
    };
    operationsWorkingGroup: {
      /**
       * Opening does not exist.
       **/
      AcceptWorkerApplicationsOpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening Is Not in Waiting to begin.
       **/
      AcceptWorkerApplicationsOpeningIsNotWaitingToBegin: AugmentedError<ApiType>;
      /**
       * Opening does not activate in the future.
       **/
      AddWorkerOpeningActivatesInThePast: AugmentedError<ApiType>;
      /**
       * Add worker opening application stake cannot be zero.
       **/
      AddWorkerOpeningApplicationStakeCannotBeZero: AugmentedError<ApiType>;
      /**
       * Application stake amount less than minimum currency balance.
       **/
      AddWorkerOpeningAppliicationStakeLessThanMinimum: AugmentedError<ApiType>;
      /**
       * New application was crowded out.
       **/
      AddWorkerOpeningNewApplicationWasCrowdedOut: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      AddWorkerOpeningOpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening is not in accepting applications stage.
       **/
      AddWorkerOpeningOpeningNotInAcceptingApplicationStage: AugmentedError<ApiType>;
      /**
       * Add worker opening role stake cannot be zero.
       **/
      AddWorkerOpeningRoleStakeCannotBeZero: AugmentedError<ApiType>;
      /**
       * Role stake amount less than minimum currency balance.
       **/
      AddWorkerOpeningRoleStakeLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Stake amount too low.
       **/
      AddWorkerOpeningStakeAmountTooLow: AugmentedError<ApiType>;
      /**
       * Stake missing when required.
       **/
      AddWorkerOpeningStakeMissingWhenRequired: AugmentedError<ApiType>;
      /**
       * Stake provided when redundant.
       **/
      AddWorkerOpeningStakeProvidedWhenRedundant: AugmentedError<ApiType>;
      /**
       * Application rationing has zero max active applicants.
       **/
      AddWorkerOpeningZeroMaxApplicantCount: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (application_rationing_policy):
       * max_active_applicants should be non-zero.
       **/
      ApplicationRationingPolicyMaxActiveApplicantsIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (application_staking_policy):
       * crowded_out_unstaking_period_length should be non-zero.
       **/
      ApplicationStakingPolicyCrowdedOutUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (application_staking_policy):
       * review_period_expired_unstaking_period_length should be non-zero.
       **/
      ApplicationStakingPolicyReviewPeriodUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Signer does not match controller account.
       **/
      ApplyOnWorkerOpeningSignerNotControllerAccount: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      BeginWorkerApplicantReviewOpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening Is Not in Waiting.
       **/
      BeginWorkerApplicantReviewOpeningOpeningIsNotWaitingToBegin: AugmentedError<ApiType>;
      /**
       * Cannot find mint in the minting module.
       **/
      CannotFindMint: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * exit_role_application_stake_unstaking_period should be non-zero.
       **/
      ExitRoleApplicationStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * exit_role_stake_unstaking_period should be non-zero.
       **/
      ExitRoleStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * fill_opening_failed_applicant_application_stake_unstaking_period should be non-zero.
       **/
      FillOpeningFailedApplicantApplicationStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * fill_opening_failed_applicant_role_stake_unstaking_period should be non-zero.
       **/
      FillOpeningFailedApplicantRoleStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Reward policy has invalid next payment block number.
       **/
      FillOpeningInvalidNextPaymentBlock: AugmentedError<ApiType>;
      /**
       * Working group mint does not exist.
       **/
      FillOpeningMintDoesNotExist: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * fill_opening_successful_applicant_application_stake_unstaking_period should be non-zero.
       **/
      FillOpeningSuccessfulApplicantApplicationStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Applications not for opening.
       **/
      FillWorkerOpeningApplicationForWrongOpening: AugmentedError<ApiType>;
      /**
       * Application does not exist.
       **/
      FullWorkerOpeningApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Application not in active stage.
       **/
      FullWorkerOpeningApplicationNotActive: AugmentedError<ApiType>;
      /**
       * OpeningDoesNotExist.
       **/
      FullWorkerOpeningOpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening not in review period stage.
       **/
      FullWorkerOpeningOpeningNotInReviewPeriodStage: AugmentedError<ApiType>;
      /**
       * Application stake unstaking period for successful applicants redundant.
       **/
      FullWorkerOpeningSuccessfulApplicationStakeUnstakingPeriodRedundant: AugmentedError<ApiType>;
      /**
       * Application stake unstaking period for failed applicants too short.
       **/
      FullWorkerOpeningSuccessfulApplicationStakeUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Role stake unstaking period for successful applicants redundant.
       **/
      FullWorkerOpeningSuccessfulRoleStakeUnstakingPeriodRedundant: AugmentedError<ApiType>;
      /**
       * Role stake unstaking period for successful applicants too short.
       **/
      FullWorkerOpeningSuccessfulRoleStakeUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Application stake unstaking period for failed applicants redundant.
       **/
      FullWorkerOpeningUnsuccessfulApplicationStakeUnstakingPeriodRedundant: AugmentedError<ApiType>;
      /**
       * Application stake unstaking period for successful applicants too short.
       **/
      FullWorkerOpeningUnsuccessfulApplicationStakeUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Role stake unstaking period for failed applicants redundant.
       **/
      FullWorkerOpeningUnsuccessfulRoleStakeUnstakingPeriodRedundant: AugmentedError<ApiType>;
      /**
       * Role stake unstaking period for failed applicants too short.
       **/
      FullWorkerOpeningUnsuccessfulRoleStakeUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Insufficient balance to apply.
       **/
      InsufficientBalanceToApply: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Member already has an active application on the opening.
       **/
      MemberHasActiveApplicationOnOpening: AugmentedError<ApiType>;
      /**
       * Member id is invalid.
       **/
      MembershipInvalidMemberId: AugmentedError<ApiType>;
      /**
       * Unsigned origin.
       **/
      MembershipUnsignedOrigin: AugmentedError<ApiType>;
      /**
       * Minting error: NextAdjustmentInPast
       **/
      MintingErrorNextAdjustmentInPast: AugmentedError<ApiType>;
      /**
       * Cannot get the worker stake profile.
       **/
      NoWorkerStakeProfile: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening text too long.
       **/
      OpeningTextTooLong: AugmentedError<ApiType>;
      /**
       * Opening text too short.
       **/
      OpeningTextTooShort: AugmentedError<ApiType>;
      /**
       * Origin must be controller or root account of member.
       **/
      OriginIsNeitherMemberControllerOrRoot: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Next payment is not in the future.
       **/
      RecurringRewardsNextPaymentNotInFuture: AugmentedError<ApiType>;
      /**
       * Recipient not found.
       **/
      RecurringRewardsRecipientNotFound: AugmentedError<ApiType>;
      /**
       * Reward relationship not found.
       **/
      RecurringRewardsRewardRelationshipNotFound: AugmentedError<ApiType>;
      /**
       * Recipient reward source not found.
       **/
      RecurringRewardsRewardSourceNotFound: AugmentedError<ApiType>;
      /**
       * Relationship must exist.
       **/
      RelationshipMustExist: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics.
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
      /**
       * Require signed origin in extrinsics.
       **/
      RequireSignedOrigin: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (role_staking_policy):
       * crowded_out_unstaking_period_length should be non-zero.
       **/
      RoleStakingPolicyCrowdedOutUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (role_staking_policy):
       * review_period_expired_unstaking_period_length should be non-zero.
       **/
      RoleStakingPolicyReviewPeriodUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Already unstaking.
       **/
      StakingErrorAlreadyUnstaking: AugmentedError<ApiType>;
      /**
       * Cannot change stake by zero.
       **/
      StakingErrorCannotChangeStakeByZero: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake while slashes ongoing.
       **/
      StakingErrorCannotDecreaseWhileSlashesOngoing: AugmentedError<ApiType>;
      /**
       * Cannot increase stake while unstaking.
       **/
      StakingErrorCannotIncreaseStakeWhileUnstaking: AugmentedError<ApiType>;
      /**
       * Cannot unstake while slashes ongoing.
       **/
      StakingErrorCannotUnstakeWhileSlashesOngoing: AugmentedError<ApiType>;
      /**
       * Insufficient balance in source account.
       **/
      StakingErrorInsufficientBalanceInSourceAccount: AugmentedError<ApiType>;
      /**
       * Insufficient stake to decrease.
       **/
      StakingErrorInsufficientStake: AugmentedError<ApiType>;
      /**
       * Not staked.
       **/
      StakingErrorNotStaked: AugmentedError<ApiType>;
      /**
       * Slash amount should be greater than zero.
       **/
      StakingErrorSlashAmountShouldBeGreaterThanZero: AugmentedError<ApiType>;
      /**
       * Stake not found.
       **/
      StakingErrorStakeNotFound: AugmentedError<ApiType>;
      /**
       * Unstaking period should be greater than zero.
       **/
      StakingErrorUnstakingPeriodShouldBeGreaterThanZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * terminate_application_stake_unstaking_period should be non-zero.
       **/
      TerminateApplicationStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * terminate_role_stake_unstaking_period should be non-zero.
       **/
      TerminateRoleStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Application does not exist.
       **/
      WithdrawWorkerApplicationApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Application is not active.
       **/
      WithdrawWorkerApplicationApplicationNotActive: AugmentedError<ApiType>;
      /**
       * Opening not accepting applications.
       **/
      WithdrawWorkerApplicationOpeningNotAcceptingApplications: AugmentedError<ApiType>;
      /**
       * Redundant unstaking period provided
       **/
      WithdrawWorkerApplicationRedundantUnstakingPeriod: AugmentedError<ApiType>;
      /**
       * UnstakingPeriodTooShort .... // <== SHOULD REALLY BE TWO SEPARATE, ONE FOR EACH STAKING PURPOSE
       **/
      WithdrawWorkerApplicationUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker application text too long.
       **/
      WorkerApplicationTextTooLong: AugmentedError<ApiType>;
      /**
       * Worker application text too short.
       **/
      WorkerApplicationTextTooShort: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker exit rationale text is too long.
       **/
      WorkerExitRationaleTextTooLong: AugmentedError<ApiType>;
      /**
       * Worker exit rationale text is too short.
       **/
      WorkerExitRationaleTextTooShort: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
    };
    proposalsCodex: {
      /**
       * Invalid 'decrease stake proposal' parameter - cannot decrease by zero balance.
       **/
      DecreasingStakeIsZero: AugmentedError<ApiType>;
      /**
       * Invalid content working group mint capacity parameter
       **/
      InvalidContentWorkingGroupMintCapacity: AugmentedError<ApiType>;
      /**
       * Invalid council election parameter - announcing_period
       **/
      InvalidCouncilElectionParameterAnnouncingPeriod: AugmentedError<ApiType>;
      /**
       * Invalid council election parameter - candidacy-limit
       **/
      InvalidCouncilElectionParameterCandidacyLimit: AugmentedError<ApiType>;
      /**
       * Invalid council election parameter - council_size
       **/
      InvalidCouncilElectionParameterCouncilSize: AugmentedError<ApiType>;
      /**
       * Invalid council election parameter - min_council_stake
       **/
      InvalidCouncilElectionParameterMinCouncilStake: AugmentedError<ApiType>;
      /**
       * Invalid council election parameter - min-voting_stake
       **/
      InvalidCouncilElectionParameterMinVotingStake: AugmentedError<ApiType>;
      /**
       * Invalid council election parameter - new_term_duration
       **/
      InvalidCouncilElectionParameterNewTermDuration: AugmentedError<ApiType>;
      /**
       * Invalid council election parameter - revealing_period
       **/
      InvalidCouncilElectionParameterRevealingPeriod: AugmentedError<ApiType>;
      /**
       * Invalid council election parameter - voting_period
       **/
      InvalidCouncilElectionParameterVotingPeriod: AugmentedError<ApiType>;
      /**
       * Invalid 'set lead proposal' parameter - proposed lead cannot be a councilor
       **/
      InvalidSetLeadParameterCannotBeCouncilor: AugmentedError<ApiType>;
      /**
       * Invalid balance value for the spending proposal
       **/
      InvalidSpendingProposalBalance: AugmentedError<ApiType>;
      /**
       * Invalid validator count for the 'set validator count' proposal
       **/
      InvalidValidatorCount: AugmentedError<ApiType>;
      /**
       * Invalid working group mint capacity parameter
       **/
      InvalidWorkingGroupMintCapacity: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
      /**
       * Provided WASM code for the runtime upgrade proposal is empty
       **/
      RuntimeProposalIsEmpty: AugmentedError<ApiType>;
      /**
       * The size of the provided WASM code for the runtime upgrade proposal exceeded the limit
       **/
      RuntimeProposalSizeExceeded: AugmentedError<ApiType>;
      /**
       * Invalid 'slash stake proposal' parameter - cannot slash by zero balance.
       **/
      SlashingStakeIsZero: AugmentedError<ApiType>;
      /**
       * Provided text for text proposal is empty
       **/
      TextProposalIsEmpty: AugmentedError<ApiType>;
      /**
       * The size of the provided text for text proposal exceeded the limit
       **/
      TextProposalSizeExceeded: AugmentedError<ApiType>;
    };
    proposalsDiscussion: {
      /**
       * Post cannot be empty
       **/
      EmptyPostProvided: AugmentedError<ApiType>;
      /**
       * Discussion cannot have an empty title
       **/
      EmptyTitleProvided: AugmentedError<ApiType>;
      /**
       * Max number of threads by same author in a row limit exceeded
       **/
      MaxThreadInARowLimitExceeded: AugmentedError<ApiType>;
      /**
       * Author should match the post creator
       **/
      NotAuthor: AugmentedError<ApiType>;
      /**
       * Post doesn't exist
       **/
      PostDoesntExist: AugmentedError<ApiType>;
      /**
       * Post edition limit reached
       **/
      PostEditionNumberExceeded: AugmentedError<ApiType>;
      /**
       * Post is too long
       **/
      PostIsTooLong: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
      /**
       * Thread doesn't exist
       **/
      ThreadDoesntExist: AugmentedError<ApiType>;
      /**
       * Title is too long
       **/
      TitleIsTooLong: AugmentedError<ApiType>;
    };
    proposalsEngine: {
      /**
       * The proposal have been already voted on
       **/
      AlreadyVoted: AugmentedError<ApiType>;
      /**
       * Description is too long
       **/
      DescriptionIsTooLong: AugmentedError<ApiType>;
      /**
       * Proposal cannot have an empty body
       **/
      EmptyDescriptionProvided: AugmentedError<ApiType>;
      /**
       * Stake cannot be empty with this proposal
       **/
      EmptyStake: AugmentedError<ApiType>;
      /**
       * Proposal cannot have an empty title"
       **/
      EmptyTitleProvided: AugmentedError<ApiType>;
      /**
       * Approval threshold cannot be zero
       **/
      InvalidParameterApprovalThreshold: AugmentedError<ApiType>;
      /**
       * Slashing threshold cannot be zero
       **/
      InvalidParameterSlashingThreshold: AugmentedError<ApiType>;
      /**
       * Max active proposals number exceeded
       **/
      MaxActiveProposalNumberExceeded: AugmentedError<ApiType>;
      /**
       * Not an author
       **/
      NotAuthor: AugmentedError<ApiType>;
      /**
       * Proposal is finalized already
       **/
      ProposalFinalized: AugmentedError<ApiType>;
      /**
       * The proposal does not exist
       **/
      ProposalNotFound: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
      /**
       * Stake differs from the proposal requirements
       **/
      StakeDiffersFromRequired: AugmentedError<ApiType>;
      /**
       * Stake should be empty for this proposal
       **/
      StakeShouldBeEmpty: AugmentedError<ApiType>;
      /**
       * Title is too long
       **/
      TitleIsTooLong: AugmentedError<ApiType>;
    };
    session: {
      /**
       * Registered duplicate key.
       **/
      DuplicatedKey: AugmentedError<ApiType>;
      /**
       * Invalid ownership proof.
       **/
      InvalidProof: AugmentedError<ApiType>;
      /**
       * No associated validator ID for account.
       **/
      NoAssociatedValidatorId: AugmentedError<ApiType>;
      /**
       * No keys are associated with this account.
       **/
      NoKeys: AugmentedError<ApiType>;
    };
    staking: {
      /**
       * Stash is already bonded.
       **/
      AlreadyBonded: AugmentedError<ApiType>;
      /**
       * Rewards for this era have already been claimed for this validator.
       **/
      AlreadyClaimed: AugmentedError<ApiType>;
      /**
       * Controller is already paired.
       **/
      AlreadyPaired: AugmentedError<ApiType>;
      /**
       * The call is not allowed at the given time due to restrictions of election period.
       **/
      CallNotAllowed: AugmentedError<ApiType>;
      /**
       * Duplicate index.
       **/
      DuplicateIndex: AugmentedError<ApiType>;
      /**
       * Targets cannot be empty.
       **/
      EmptyTargets: AugmentedError<ApiType>;
      /**
       * Attempting to target a stash that still has funds.
       **/
      FundedTarget: AugmentedError<ApiType>;
      /**
       * Incorrect previous history depth input provided.
       **/
      IncorrectHistoryDepth: AugmentedError<ApiType>;
      /**
       * Incorrect number of slashing spans provided.
       **/
      IncorrectSlashingSpans: AugmentedError<ApiType>;
      /**
       * Can not bond with value less than minimum balance.
       **/
      InsufficientValue: AugmentedError<ApiType>;
      /**
       * Invalid era to reward.
       **/
      InvalidEraToReward: AugmentedError<ApiType>;
      /**
       * Invalid number of nominations.
       **/
      InvalidNumberOfNominations: AugmentedError<ApiType>;
      /**
       * Slash record index out of bounds.
       **/
      InvalidSlashIndex: AugmentedError<ApiType>;
      /**
       * Can not schedule more unlock chunks.
       **/
      NoMoreChunks: AugmentedError<ApiType>;
      /**
       * Not a controller account.
       **/
      NotController: AugmentedError<ApiType>;
      /**
       * Items are not sorted and unique.
       **/
      NotSortedAndUnique: AugmentedError<ApiType>;
      /**
       * Not a stash account.
       **/
      NotStash: AugmentedError<ApiType>;
      /**
       * Can not rebond without unlocking chunks.
       **/
      NoUnlockChunk: AugmentedError<ApiType>;
      /**
       * Error while building the assignment type from the compact. This can happen if an index
       * is invalid, or if the weights _overflow_.
       **/
      PhragmenBogusCompact: AugmentedError<ApiType>;
      /**
       * The submitted result has unknown edges that are not among the presented winners.
       **/
      PhragmenBogusEdge: AugmentedError<ApiType>;
      /**
       * The election size is invalid.
       **/
      PhragmenBogusElectionSize: AugmentedError<ApiType>;
      /**
       * One of the submitted nominators has an edge to which they have not voted on chain.
       **/
      PhragmenBogusNomination: AugmentedError<ApiType>;
      /**
       * One of the submitted nominators is not an active nominator on chain.
       **/
      PhragmenBogusNominator: AugmentedError<ApiType>;
      /**
       * The claimed score does not match with the one computed from the data.
       **/
      PhragmenBogusScore: AugmentedError<ApiType>;
      /**
       * A self vote must only be originated from a validator to ONLY themselves.
       **/
      PhragmenBogusSelfVote: AugmentedError<ApiType>;
      /**
       * One of the submitted winners is not an active candidate on chain (index is out of range
       * in snapshot).
       **/
      PhragmenBogusWinner: AugmentedError<ApiType>;
      /**
       * Incorrect number of winners were presented.
       **/
      PhragmenBogusWinnerCount: AugmentedError<ApiType>;
      /**
       * The submitted result is received out of the open window.
       **/
      PhragmenEarlySubmission: AugmentedError<ApiType>;
      /**
       * One of the submitted nominators has an edge which is submitted before the last non-zero
       * slash of the target.
       **/
      PhragmenSlashedNomination: AugmentedError<ApiType>;
      /**
       * The submitted result is not as good as the one stored on chain.
       **/
      PhragmenWeakSubmission: AugmentedError<ApiType>;
      /**
       * The snapshot data of the current window is missing.
       **/
      SnapshotUnavailable: AugmentedError<ApiType>;
    };
    storageWorkingGroup: {
      /**
       * Opening does not exist.
       **/
      AcceptWorkerApplicationsOpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening Is Not in Waiting to begin.
       **/
      AcceptWorkerApplicationsOpeningIsNotWaitingToBegin: AugmentedError<ApiType>;
      /**
       * Opening does not activate in the future.
       **/
      AddWorkerOpeningActivatesInThePast: AugmentedError<ApiType>;
      /**
       * Add worker opening application stake cannot be zero.
       **/
      AddWorkerOpeningApplicationStakeCannotBeZero: AugmentedError<ApiType>;
      /**
       * Application stake amount less than minimum currency balance.
       **/
      AddWorkerOpeningAppliicationStakeLessThanMinimum: AugmentedError<ApiType>;
      /**
       * New application was crowded out.
       **/
      AddWorkerOpeningNewApplicationWasCrowdedOut: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      AddWorkerOpeningOpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening is not in accepting applications stage.
       **/
      AddWorkerOpeningOpeningNotInAcceptingApplicationStage: AugmentedError<ApiType>;
      /**
       * Add worker opening role stake cannot be zero.
       **/
      AddWorkerOpeningRoleStakeCannotBeZero: AugmentedError<ApiType>;
      /**
       * Role stake amount less than minimum currency balance.
       **/
      AddWorkerOpeningRoleStakeLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Stake amount too low.
       **/
      AddWorkerOpeningStakeAmountTooLow: AugmentedError<ApiType>;
      /**
       * Stake missing when required.
       **/
      AddWorkerOpeningStakeMissingWhenRequired: AugmentedError<ApiType>;
      /**
       * Stake provided when redundant.
       **/
      AddWorkerOpeningStakeProvidedWhenRedundant: AugmentedError<ApiType>;
      /**
       * Application rationing has zero max active applicants.
       **/
      AddWorkerOpeningZeroMaxApplicantCount: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (application_rationing_policy):
       * max_active_applicants should be non-zero.
       **/
      ApplicationRationingPolicyMaxActiveApplicantsIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (application_staking_policy):
       * crowded_out_unstaking_period_length should be non-zero.
       **/
      ApplicationStakingPolicyCrowdedOutUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (application_staking_policy):
       * review_period_expired_unstaking_period_length should be non-zero.
       **/
      ApplicationStakingPolicyReviewPeriodUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Signer does not match controller account.
       **/
      ApplyOnWorkerOpeningSignerNotControllerAccount: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      BeginWorkerApplicantReviewOpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening Is Not in Waiting.
       **/
      BeginWorkerApplicantReviewOpeningOpeningIsNotWaitingToBegin: AugmentedError<ApiType>;
      /**
       * Cannot find mint in the minting module.
       **/
      CannotFindMint: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * exit_role_application_stake_unstaking_period should be non-zero.
       **/
      ExitRoleApplicationStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * exit_role_stake_unstaking_period should be non-zero.
       **/
      ExitRoleStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * fill_opening_failed_applicant_application_stake_unstaking_period should be non-zero.
       **/
      FillOpeningFailedApplicantApplicationStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * fill_opening_failed_applicant_role_stake_unstaking_period should be non-zero.
       **/
      FillOpeningFailedApplicantRoleStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Reward policy has invalid next payment block number.
       **/
      FillOpeningInvalidNextPaymentBlock: AugmentedError<ApiType>;
      /**
       * Working group mint does not exist.
       **/
      FillOpeningMintDoesNotExist: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * fill_opening_successful_applicant_application_stake_unstaking_period should be non-zero.
       **/
      FillOpeningSuccessfulApplicantApplicationStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Applications not for opening.
       **/
      FillWorkerOpeningApplicationForWrongOpening: AugmentedError<ApiType>;
      /**
       * Application does not exist.
       **/
      FullWorkerOpeningApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Application not in active stage.
       **/
      FullWorkerOpeningApplicationNotActive: AugmentedError<ApiType>;
      /**
       * OpeningDoesNotExist.
       **/
      FullWorkerOpeningOpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening not in review period stage.
       **/
      FullWorkerOpeningOpeningNotInReviewPeriodStage: AugmentedError<ApiType>;
      /**
       * Application stake unstaking period for successful applicants redundant.
       **/
      FullWorkerOpeningSuccessfulApplicationStakeUnstakingPeriodRedundant: AugmentedError<ApiType>;
      /**
       * Application stake unstaking period for failed applicants too short.
       **/
      FullWorkerOpeningSuccessfulApplicationStakeUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Role stake unstaking period for successful applicants redundant.
       **/
      FullWorkerOpeningSuccessfulRoleStakeUnstakingPeriodRedundant: AugmentedError<ApiType>;
      /**
       * Role stake unstaking period for successful applicants too short.
       **/
      FullWorkerOpeningSuccessfulRoleStakeUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Application stake unstaking period for failed applicants redundant.
       **/
      FullWorkerOpeningUnsuccessfulApplicationStakeUnstakingPeriodRedundant: AugmentedError<ApiType>;
      /**
       * Application stake unstaking period for successful applicants too short.
       **/
      FullWorkerOpeningUnsuccessfulApplicationStakeUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Role stake unstaking period for failed applicants redundant.
       **/
      FullWorkerOpeningUnsuccessfulRoleStakeUnstakingPeriodRedundant: AugmentedError<ApiType>;
      /**
       * Role stake unstaking period for failed applicants too short.
       **/
      FullWorkerOpeningUnsuccessfulRoleStakeUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Insufficient balance to apply.
       **/
      InsufficientBalanceToApply: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Member already has an active application on the opening.
       **/
      MemberHasActiveApplicationOnOpening: AugmentedError<ApiType>;
      /**
       * Member id is invalid.
       **/
      MembershipInvalidMemberId: AugmentedError<ApiType>;
      /**
       * Unsigned origin.
       **/
      MembershipUnsignedOrigin: AugmentedError<ApiType>;
      /**
       * Minting error: NextAdjustmentInPast
       **/
      MintingErrorNextAdjustmentInPast: AugmentedError<ApiType>;
      /**
       * Cannot get the worker stake profile.
       **/
      NoWorkerStakeProfile: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Opening text too long.
       **/
      OpeningTextTooLong: AugmentedError<ApiType>;
      /**
       * Opening text too short.
       **/
      OpeningTextTooShort: AugmentedError<ApiType>;
      /**
       * Origin must be controller or root account of member.
       **/
      OriginIsNeitherMemberControllerOrRoot: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Next payment is not in the future.
       **/
      RecurringRewardsNextPaymentNotInFuture: AugmentedError<ApiType>;
      /**
       * Recipient not found.
       **/
      RecurringRewardsRecipientNotFound: AugmentedError<ApiType>;
      /**
       * Reward relationship not found.
       **/
      RecurringRewardsRewardRelationshipNotFound: AugmentedError<ApiType>;
      /**
       * Recipient reward source not found.
       **/
      RecurringRewardsRewardSourceNotFound: AugmentedError<ApiType>;
      /**
       * Relationship must exist.
       **/
      RelationshipMustExist: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics.
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
      /**
       * Require signed origin in extrinsics.
       **/
      RequireSignedOrigin: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (role_staking_policy):
       * crowded_out_unstaking_period_length should be non-zero.
       **/
      RoleStakingPolicyCrowdedOutUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter (role_staking_policy):
       * review_period_expired_unstaking_period_length should be non-zero.
       **/
      RoleStakingPolicyReviewPeriodUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Already unstaking.
       **/
      StakingErrorAlreadyUnstaking: AugmentedError<ApiType>;
      /**
       * Cannot change stake by zero.
       **/
      StakingErrorCannotChangeStakeByZero: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake while slashes ongoing.
       **/
      StakingErrorCannotDecreaseWhileSlashesOngoing: AugmentedError<ApiType>;
      /**
       * Cannot increase stake while unstaking.
       **/
      StakingErrorCannotIncreaseStakeWhileUnstaking: AugmentedError<ApiType>;
      /**
       * Cannot unstake while slashes ongoing.
       **/
      StakingErrorCannotUnstakeWhileSlashesOngoing: AugmentedError<ApiType>;
      /**
       * Insufficient balance in source account.
       **/
      StakingErrorInsufficientBalanceInSourceAccount: AugmentedError<ApiType>;
      /**
       * Insufficient stake to decrease.
       **/
      StakingErrorInsufficientStake: AugmentedError<ApiType>;
      /**
       * Not staked.
       **/
      StakingErrorNotStaked: AugmentedError<ApiType>;
      /**
       * Slash amount should be greater than zero.
       **/
      StakingErrorSlashAmountShouldBeGreaterThanZero: AugmentedError<ApiType>;
      /**
       * Stake not found.
       **/
      StakingErrorStakeNotFound: AugmentedError<ApiType>;
      /**
       * Unstaking period should be greater than zero.
       **/
      StakingErrorUnstakingPeriodShouldBeGreaterThanZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * terminate_application_stake_unstaking_period should be non-zero.
       **/
      TerminateApplicationStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Invalid OpeningPolicyCommitment parameter:
       * terminate_role_stake_unstaking_period should be non-zero.
       **/
      TerminateRoleStakeUnstakingPeriodIsZero: AugmentedError<ApiType>;
      /**
       * Application does not exist.
       **/
      WithdrawWorkerApplicationApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Application is not active.
       **/
      WithdrawWorkerApplicationApplicationNotActive: AugmentedError<ApiType>;
      /**
       * Opening not accepting applications.
       **/
      WithdrawWorkerApplicationOpeningNotAcceptingApplications: AugmentedError<ApiType>;
      /**
       * Redundant unstaking period provided
       **/
      WithdrawWorkerApplicationRedundantUnstakingPeriod: AugmentedError<ApiType>;
      /**
       * UnstakingPeriodTooShort .... // <== SHOULD REALLY BE TWO SEPARATE, ONE FOR EACH STAKING PURPOSE
       **/
      WithdrawWorkerApplicationUnstakingPeriodTooShort: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker application text too long.
       **/
      WorkerApplicationTextTooLong: AugmentedError<ApiType>;
      /**
       * Worker application text too short.
       **/
      WorkerApplicationTextTooShort: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker exit rationale text is too long.
       **/
      WorkerExitRationaleTextTooLong: AugmentedError<ApiType>;
      /**
       * Worker exit rationale text is too short.
       **/
      WorkerExitRationaleTextTooShort: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
    };
    sudo: {
      /**
       * Sender must be the Sudo account
       **/
      RequireSudo: AugmentedError<ApiType>;
    };
    system: {
      /**
       * Failed to extract the runtime version from the new runtime.
       * 
       * Either calling `Core_version` or decoding `RuntimeVersion` failed.
       **/
      FailedToExtractRuntimeVersion: AugmentedError<ApiType>;
      /**
       * The name of specification does not match between the current runtime
       * and the new runtime.
       **/
      InvalidSpecName: AugmentedError<ApiType>;
      /**
       * Suicide called when the account has non-default composite data.
       **/
      NonDefaultComposite: AugmentedError<ApiType>;
      /**
       * There is a non-zero reference count preventing the account from being purged.
       **/
      NonZeroRefCount: AugmentedError<ApiType>;
      /**
       * The specification version is not allowed to decrease between the current runtime
       * and the new runtime.
       **/
      SpecVersionNeedsToIncrease: AugmentedError<ApiType>;
    };
  }

  export interface DecoratedErrors<ApiType extends ApiTypes> extends AugmentedErrors<ApiType> {
  }
}
