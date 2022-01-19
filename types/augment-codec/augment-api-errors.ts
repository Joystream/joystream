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
       * Already active auction cannot be cancelled
       **/
      ActionHasBidsAlready: AugmentedError<ApiType>;
      /**
       * Actor cannot authorize as lead for given extrinsic
       **/
      ActorCannotBeLead: AugmentedError<ApiType>;
      /**
       * This content actor cannot own a channel
       **/
      ActorCannotOwnChannel: AugmentedError<ApiType>;
      /**
       * Actor is not a last bidder
       **/
      ActorIsNotALastBidder: AugmentedError<ApiType>;
      /**
       * Operation cannot be perfomed with this Actor
       **/
      ActorNotAuthorized: AugmentedError<ApiType>;
      /**
       * Auction bid step lower bound exceeded
       **/
      AuctionBidStepLowerBoundExceeded: AugmentedError<ApiType>;
      /**
       * Auction bid step upper bound exceeded
       **/
      AuctionBidStepUpperBoundExceeded: AugmentedError<ApiType>;
      /**
       * Auction cannot be completed
       **/
      AuctionCannotBeCompleted: AugmentedError<ApiType>;
      /**
       * Auction for given video did not start
       **/
      AuctionDidNotStart: AugmentedError<ApiType>;
      /**
       * Auction duration lower bound exceeded
       **/
      AuctionDurationLowerBoundExceeded: AugmentedError<ApiType>;
      /**
       * Auction duration upper bound exceeded
       **/
      AuctionDurationUpperBoundExceeded: AugmentedError<ApiType>;
      /**
       * Expected root or signed origin
       **/
      BadOrigin: AugmentedError<ApiType>;
      /**
       * Bid lock duration is not expired
       **/
      BidLockDurationIsNotExpired: AugmentedError<ApiType>;
      /**
       * Bid lock duration lower bound exceeded
       **/
      BidLockDurationLowerBoundExceeded: AugmentedError<ApiType>;
      /**
       * Bid lock duration upper bound exceeded
       **/
      BidLockDurationUpperBoundExceeded: AugmentedError<ApiType>;
      /**
       * Minimal auction bid step constraint violated.
       **/
      BidStepConstraintViolated: AugmentedError<ApiType>;
      /**
       * Auction buy now is less then starting price
       **/
      BuyNowIsLessThenStartingPrice: AugmentedError<ApiType>;
      /**
       * Curators can only censor non-curator group owned channels
       **/
      CannotCensoreCuratorGroupOwnedChannels: AugmentedError<ApiType>;
      /**
       * A Channel or Video Category does not exist.
       **/
      CategoryDoesNotExist: AugmentedError<ApiType>;
      /**
       * Member id not valid
       **/
      CollaboratorIsNotValidMember: AugmentedError<ApiType>;
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
       * Given origin does not own nft
       **/
      DoesNotOwnNFT: AugmentedError<ApiType>;
      /**
       * Extension period is greater then auction duration
       **/
      ExtensionPeriodIsGreaterThenAuctionDuration: AugmentedError<ApiType>;
      /**
       * Auction extension period lower bound exceeded
       **/
      ExtensionPeriodLowerBoundExceeded: AugmentedError<ApiType>;
      /**
       * Auction extension period upper bound exceeded
       **/
      ExtensionPeriodUpperBoundExceeded: AugmentedError<ApiType>;
      /**
       * Feature Not Implemented
       **/
      FeatureNotImplemented: AugmentedError<ApiType>;
      /**
       * Channel censorship status did not change
       **/
      ChannelCensorshipStatusDidNotChange: AugmentedError<ApiType>;
      /**
       * Channel Contains Assets
       **/
      ChannelContainsAssets: AugmentedError<ApiType>;
      /**
       * Channel Contains Video
       **/
      ChannelContainsVideos: AugmentedError<ApiType>;
      /**
       * Channel does not exist
       **/
      ChannelDoesNotExist: AugmentedError<ApiType>;
      /**
       * Insufficient balance
       **/
      InsufficientBalance: AugmentedError<ApiType>;
      /**
       * Channel assets feasibility
       **/
      InvalidAssetsProvided: AugmentedError<ApiType>;
      /**
       * Bag Size specified is not valid
       **/
      InvalidBagSizeSpecified: AugmentedError<ApiType>;
      /**
       * Auction type is not `English`
       **/
      IsNotEnglishAuctionType: AugmentedError<ApiType>;
      /**
       * Auction type is not `Open`
       **/
      IsNotOpenAuctionType: AugmentedError<ApiType>;
      /**
       * Auction does not have bids
       **/
      LastBidDoesNotExist: AugmentedError<ApiType>;
      /**
       * Lead authentication failed
       **/
      LeadAuthFailed: AugmentedError<ApiType>;
      /**
       * Max auction whitelist length upper bound exceeded
       **/
      MaxAuctionWhiteListLengthUpperBoundExceeded: AugmentedError<ApiType>;
      /**
       * Member authentication failed
       **/
      MemberAuthFailed: AugmentedError<ApiType>;
      /**
       * Member is not allowed to participate in auction
       **/
      MemberIsNotAllowedToParticipate: AugmentedError<ApiType>;
      /**
       * Member profile not found
       **/
      MemberProfileNotFound: AugmentedError<ApiType>;
      /**
       * Migration not done yet
       **/
      MigrationNotFinished: AugmentedError<ApiType>;
      /**
       * NFT for given video id already exists
       **/
      NFTAlreadyExists: AugmentedError<ApiType>;
      /**
       * NFT auction is already expired
       **/
      NFTAuctionIsAlreadyExpired: AugmentedError<ApiType>;
      /**
       * NFT for given video id does not exist
       **/
      NFTDoesNotExist: AugmentedError<ApiType>;
      /**
       * Can not create auction for NFT, if auction have been already started or nft is locked for the transfer
       **/
      NftIsNotIdle: AugmentedError<ApiType>;
      /**
       * Given video nft is not in buy now state
       **/
      NFTNotInBuyNowState: AugmentedError<ApiType>;
      /**
       * No assets to be removed have been specified
       **/
      NoAssetsSpecified: AugmentedError<ApiType>;
      /**
       * Nft is not in auction state
       **/
      NotInAuctionState: AugmentedError<ApiType>;
      /**
       * Overflow or underflow error happened
       **/
      OverflowOrUnderflowHappened: AugmentedError<ApiType>;
      /**
       * No pending offers for given NFT
       **/
      PendingOfferDoesNotExist: AugmentedError<ApiType>;
      /**
       * Creator royalty requires reward account to be set.
       **/
      RewardAccountIsNotSet: AugmentedError<ApiType>;
      /**
       * Royalty Lower Bound Exceeded
       **/
      RoyaltyLowerBoundExceeded: AugmentedError<ApiType>;
      /**
       * Royalty Upper Bound Exceeded
       **/
      RoyaltyUpperBoundExceeded: AugmentedError<ApiType>;
      /**
       * Auction starting price constraint violated.
       **/
      StartingPriceConstraintViolated: AugmentedError<ApiType>;
      /**
       * Starting price lower bound exceeded
       **/
      StartingPriceLowerBoundExceeded: AugmentedError<ApiType>;
      /**
       * Starting price upper bound exceeded
       **/
      StartingPriceUpperBoundExceeded: AugmentedError<ApiType>;
      /**
       * Auction starts at lower bound exceeded
       **/
      StartsAtLowerBoundExceeded: AugmentedError<ApiType>;
      /**
       * Auction starts at upper bound exceeded
       **/
      StartsAtUpperBoundExceeded: AugmentedError<ApiType>;
      /**
       * Video censorship status did not change
       **/
      VideoCensorshipStatusDidNotChange: AugmentedError<ApiType>;
      /**
       * Video does not exist
       **/
      VideoDoesNotExist: AugmentedError<ApiType>;
      /**
       * Video in season can`t be removed (because order is important)
       **/
      VideoInSeason: AugmentedError<ApiType>;
      /**
       * Auction whitelist has only one member
       **/
      WhitelistHasOnlyOneMember: AugmentedError<ApiType>;
    };
    contentWorkingGroup: {
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
       * Cannot decrease stake while slashes ongoing.
       **/
      StakingErrorCannotDecreaseWhileSlashesOngoing: AugmentedError<ApiType>;
      /**
       * Cannot change stake by zero.
       **/
      StakingErrorCannotChangeStakeByZero: AugmentedError<ApiType>;
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
    distributionWorkingGroup: {
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
       * Cannot decrease stake while slashes ongoing.
       **/
      StakingErrorCannotDecreaseWhileSlashesOngoing: AugmentedError<ApiType>;
      /**
       * Cannot change stake by zero.
       **/
      StakingErrorCannotChangeStakeByZero: AugmentedError<ApiType>;
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
       * Cannot decrease stake while slashes ongoing.
       **/
      StakingErrorCannotDecreaseWhileSlashesOngoing: AugmentedError<ApiType>;
      /**
       * Cannot change stake by zero.
       **/
      StakingErrorCannotChangeStakeByZero: AugmentedError<ApiType>;
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
       * A given equivocation report is valid but already previously reported.
       **/
      DuplicateOffenceReport: AugmentedError<ApiType>;
      /**
       * Attempt to signal GRANDPA change with one already pending.
       **/
      ChangePending: AugmentedError<ApiType>;
      /**
       * An equivocation proof provided as part of an equivocation report is invalid.
       **/
      InvalidEquivocationProof: AugmentedError<ApiType>;
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
    operationsWorkingGroupAlpha: {
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
       * Cannot decrease stake while slashes ongoing.
       **/
      StakingErrorCannotDecreaseWhileSlashesOngoing: AugmentedError<ApiType>;
      /**
       * Cannot change stake by zero.
       **/
      StakingErrorCannotChangeStakeByZero: AugmentedError<ApiType>;
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
    operationsWorkingGroupBeta: {
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
       * Cannot decrease stake while slashes ongoing.
       **/
      StakingErrorCannotDecreaseWhileSlashesOngoing: AugmentedError<ApiType>;
      /**
       * Cannot change stake by zero.
       **/
      StakingErrorCannotChangeStakeByZero: AugmentedError<ApiType>;
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
    operationsWorkingGroupGamma: {
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
       * Cannot decrease stake while slashes ongoing.
       **/
      StakingErrorCannotDecreaseWhileSlashesOngoing: AugmentedError<ApiType>;
      /**
       * Cannot change stake by zero.
       **/
      StakingErrorCannotChangeStakeByZero: AugmentedError<ApiType>;
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
       * Insufficient balance for operation.
       **/
      InsufficientBalance: AugmentedError<ApiType>;
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
      OffchainElectionBogusCompact: AugmentedError<ApiType>;
      /**
       * The submitted result has unknown edges that are not among the presented winners.
       **/
      OffchainElectionBogusEdge: AugmentedError<ApiType>;
      /**
       * The election size is invalid.
       **/
      OffchainElectionBogusElectionSize: AugmentedError<ApiType>;
      /**
       * One of the submitted nominators has an edge to which they have not voted on chain.
       **/
      OffchainElectionBogusNomination: AugmentedError<ApiType>;
      /**
       * One of the submitted nominators is not an active nominator on chain.
       **/
      OffchainElectionBogusNominator: AugmentedError<ApiType>;
      /**
       * The claimed score does not match with the one computed from the data.
       **/
      OffchainElectionBogusScore: AugmentedError<ApiType>;
      /**
       * A self vote must only be originated from a validator to ONLY themselves.
       **/
      OffchainElectionBogusSelfVote: AugmentedError<ApiType>;
      /**
       * One of the submitted winners is not an active candidate on chain (index is out of range
       * in snapshot).
       **/
      OffchainElectionBogusWinner: AugmentedError<ApiType>;
      /**
       * Incorrect number of winners were presented.
       **/
      OffchainElectionBogusWinnerCount: AugmentedError<ApiType>;
      /**
       * The submitted result is received out of the open window.
       **/
      OffchainElectionEarlySubmission: AugmentedError<ApiType>;
      /**
       * One of the submitted nominators has an edge which is submitted before the last non-zero
       * slash of the target.
       **/
      OffchainElectionSlashedNomination: AugmentedError<ApiType>;
      /**
       * The submitted result is not as good as the one stored on chain.
       **/
      OffchainElectionWeakSubmission: AugmentedError<ApiType>;
      /**
       * The snapshot data of the current window is missing.
       **/
      SnapshotUnavailable: AugmentedError<ApiType>;
    };
    storage: {
      /**
       * Different Accounts for dynamic bag deletion prize and upload fees
       **/
      AccountsNotCoherent: AugmentedError<ApiType>;
      /**
       * Different Accounts for dynamic bag id and parameters bag id
       **/
      BagsNotCoherent: AugmentedError<ApiType>;
      /**
       * Blacklist size limit exceeded.
       **/
      BlacklistSizeLimitExceeded: AugmentedError<ApiType>;
      /**
       * Cannot delete non empty dynamic bag.
       **/
      CannotDeleteNonEmptyDynamicBag: AugmentedError<ApiType>;
      /**
       * Cannot delete a non-empty storage bucket.
       **/
      CannotDeleteNonEmptyStorageBucket: AugmentedError<ApiType>;
      /**
       * Data object hash is part of the blacklist.
       **/
      DataObjectBlacklisted: AugmentedError<ApiType>;
      /**
       * Data object doesn't exist.
       **/
      DataObjectDoesntExist: AugmentedError<ApiType>;
      /**
       * Data object id collection is empty.
       **/
      DataObjectIdCollectionIsEmpty: AugmentedError<ApiType>;
      /**
       * The `data_object_ids` extrinsic parameter collection is empty.
       **/
      DataObjectIdParamsAreEmpty: AugmentedError<ApiType>;
      /**
       * Invalid extrinsic call: data size fee changed.
       **/
      DataSizeFeeChanged: AugmentedError<ApiType>;
      /**
       * Invalid operation with invites: another storage provider was invited.
       **/
      DifferentStorageProviderInvited: AugmentedError<ApiType>;
      /**
       * Distribution bucket doesn't accept new bags.
       **/
      DistributionBucketDoesntAcceptNewBags: AugmentedError<ApiType>;
      /**
       * Distribution bucket doesn't exist.
       **/
      DistributionBucketDoesntExist: AugmentedError<ApiType>;
      /**
       * Distribution bucket family doesn't exist.
       **/
      DistributionBucketFamilyDoesntExist: AugmentedError<ApiType>;
      /**
       * Distribution bucket id collections are empty.
       **/
      DistributionBucketIdCollectionsAreEmpty: AugmentedError<ApiType>;
      /**
       * Distribution bucket is bound to a bag.
       **/
      DistributionBucketIsBoundToBag: AugmentedError<ApiType>;
      /**
       * Distribution bucket is not bound to a bag.
       **/
      DistributionBucketIsNotBoundToBag: AugmentedError<ApiType>;
      /**
       * The new `DistributionBucketsPerBagLimit` number is too high.
       **/
      DistributionBucketsPerBagLimitTooHigh: AugmentedError<ApiType>;
      /**
       * The new `DistributionBucketsPerBagLimit` number is too low.
       **/
      DistributionBucketsPerBagLimitTooLow: AugmentedError<ApiType>;
      /**
       * Distribution family bound to a bag creation policy.
       **/
      DistributionFamilyBoundToBagCreationPolicy: AugmentedError<ApiType>;
      /**
       * Distribution provider operator already invited.
       **/
      DistributionProviderOperatorAlreadyInvited: AugmentedError<ApiType>;
      /**
       * Distribution provider operator doesn't exist.
       **/
      DistributionProviderOperatorDoesntExist: AugmentedError<ApiType>;
      /**
       * Distribution provider operator already set.
       **/
      DistributionProviderOperatorSet: AugmentedError<ApiType>;
      /**
       * Dynamic bag doesn't exist.
       **/
      DynamicBagDoesntExist: AugmentedError<ApiType>;
      /**
       * Cannot create the dynamic bag: dynamic bag exists.
       **/
      DynamicBagExists: AugmentedError<ApiType>;
      /**
       * Upload data error: empty content ID provided.
       **/
      EmptyContentId: AugmentedError<ApiType>;
      /**
       * Insufficient balance for an operation.
       **/
      InsufficientBalance: AugmentedError<ApiType>;
      /**
       * Insufficient module treasury balance for an operation.
       **/
      InsufficientTreasuryBalance: AugmentedError<ApiType>;
      /**
       * Upload data error: invalid deletion prize source account.
       **/
      InvalidDeletionPrizeSourceAccount: AugmentedError<ApiType>;
      /**
       * Invalid storage provider for bucket.
       **/
      InvalidStorageProvider: AugmentedError<ApiType>;
      /**
       * Invalid transactor account ID for this bucket.
       **/
      InvalidTransactorAccount: AugmentedError<ApiType>;
      /**
       * Invalid operation with invites: storage provider was already invited.
       **/
      InvitedStorageProvider: AugmentedError<ApiType>;
      /**
       * Max data object size exceeded.
       **/
      MaxDataObjectSizeExceeded: AugmentedError<ApiType>;
      /**
       * Max distribution bucket family number limit exceeded.
       **/
      MaxDistributionBucketFamilyNumberLimitExceeded: AugmentedError<ApiType>;
      /**
       * Max distribution bucket number per bag limit exceeded.
       **/
      MaxDistributionBucketNumberPerBagLimitExceeded: AugmentedError<ApiType>;
      /**
       * Max number of pending invitations limit for a distribution bucket reached.
       **/
      MaxNumberOfPendingInvitationsLimitForDistributionBucketReached: AugmentedError<ApiType>;
      /**
       * Invalid operations: must be a distribution provider operator for a bucket.
       **/
      MustBeDistributionProviderOperatorForBucket: AugmentedError<ApiType>;
      /**
       * No distribution bucket invitation.
       **/
      NoDistributionBucketInvitation: AugmentedError<ApiType>;
      /**
       * Empty "data object creation" collection.
       **/
      NoObjectsOnUpload: AugmentedError<ApiType>;
      /**
       * Invalid operation with invites: there is no storage bucket invitation.
       **/
      NoStorageBucketInvitation: AugmentedError<ApiType>;
      /**
       * Cannot move objects within the same bag.
       **/
      SourceAndDestinationBagsAreEqual: AugmentedError<ApiType>;
      /**
       * The storage bucket doesn't accept new bags.
       **/
      StorageBucketDoesntAcceptNewBags: AugmentedError<ApiType>;
      /**
       * The requested storage bucket doesn't exist.
       **/
      StorageBucketDoesntExist: AugmentedError<ApiType>;
      /**
       * Storage bucket id collections are empty.
       **/
      StorageBucketIdCollectionsAreEmpty: AugmentedError<ApiType>;
      /**
       * The requested storage bucket is already bound to a bag.
       **/
      StorageBucketIsBoundToBag: AugmentedError<ApiType>;
      /**
       * The requested storage bucket is not bound to a bag.
       **/
      StorageBucketIsNotBoundToBag: AugmentedError<ApiType>;
      /**
       * Object number limit for the storage bucket reached.
       **/
      StorageBucketObjectNumberLimitReached: AugmentedError<ApiType>;
      /**
       * Objects total size limit for the storage bucket reached.
       **/
      StorageBucketObjectSizeLimitReached: AugmentedError<ApiType>;
      /**
       * `StorageBucketsPerBagLimit` was exceeded for a bag.
       **/
      StorageBucketPerBagLimitExceeded: AugmentedError<ApiType>;
      /**
       * The new `StorageBucketsPerBagLimit` number is too high.
       **/
      StorageBucketsPerBagLimitTooHigh: AugmentedError<ApiType>;
      /**
       * The new `StorageBucketsPerBagLimit` number is too low.
       **/
      StorageBucketsPerBagLimitTooLow: AugmentedError<ApiType>;
      /**
       * Invalid operation with invites: storage provider was already set.
       **/
      StorageProviderAlreadySet: AugmentedError<ApiType>;
      /**
       * Storage provider must be set.
       **/
      StorageProviderMustBeSet: AugmentedError<ApiType>;
      /**
       * Storage provider operator doesn't exist.
       **/
      StorageProviderOperatorDoesntExist: AugmentedError<ApiType>;
      /**
       * Uploading of the new object is blocked.
       **/
      UploadingBlocked: AugmentedError<ApiType>;
      /**
       * Max object number limit exceeded for voucher.
       **/
      VoucherMaxObjectNumberLimitExceeded: AugmentedError<ApiType>;
      /**
       * Max object size limit exceeded for voucher.
       **/
      VoucherMaxObjectSizeLimitExceeded: AugmentedError<ApiType>;
      /**
       * Upload data error: zero object size.
       **/
      ZeroObjectSize: AugmentedError<ApiType>;
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
       * Cannot decrease stake while slashes ongoing.
       **/
      StakingErrorCannotDecreaseWhileSlashesOngoing: AugmentedError<ApiType>;
      /**
       * Cannot change stake by zero.
       **/
      StakingErrorCannotChangeStakeByZero: AugmentedError<ApiType>;
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
