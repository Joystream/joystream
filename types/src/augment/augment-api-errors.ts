// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

import type { ApiTypes } from '@polkadot/api-base/types';

declare module '@polkadot/api-base/types/errors' {
  export interface AugmentedErrors<ApiType extends ApiTypes> {
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
    babe: {
      /**
       * A given equivocation report is valid but already previously reported.
       **/
      DuplicateOffenceReport: AugmentedError<ApiType>;
      /**
       * Submitted configuration is invalid.
       **/
      InvalidConfiguration: AugmentedError<ApiType>;
      /**
       * An equivocation proof provided as part of an equivocation report is invalid.
       **/
      InvalidEquivocationProof: AugmentedError<ApiType>;
      /**
       * A key ownership proof provided as part of an equivocation report is invalid.
       **/
      InvalidKeyOwnershipProof: AugmentedError<ApiType>;
    };
    bagsList: {
      /**
       * A error in the list interface implementation.
       **/
      List: AugmentedError<ApiType>;
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
       * Number of named reserves exceed MaxReserves
       **/
      TooManyReserves: AugmentedError<ApiType>;
      /**
       * Vesting balance too high to send value
       **/
      VestingBalance: AugmentedError<ApiType>;
    };
    bounty: {
      /**
       * Unexpected arithmetic error (overflow / underflow)
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * Bounty doesnt exist.
       **/
      BountyDoesntExist: AugmentedError<ApiType>;
      /**
       * Incompatible assurance contract type for a member: cannot submit work to the 'closed
       * assurance' bounty contract.
       **/
      CannotSubmitWorkToClosedContractBounty: AugmentedError<ApiType>;
      /**
       * Cherry less than minimum allowed.
       **/
      CherryLessThenMinimumAllowed: AugmentedError<ApiType>;
      /**
       * Cannot create a 'closed assurance contract' bounty with empty member list.
       **/
      ClosedContractMemberListIsEmpty: AugmentedError<ApiType>;
      /**
       * Cannot create a 'closed assurance contract' bounty with member list larger
       * than allowed max work entry limit.
       **/
      ClosedContractMemberListIsTooLarge: AugmentedError<ApiType>;
      /**
       * 'closed assurance contract' bounty member list can only include existing members
       **/
      ClosedContractMemberNotFound: AugmentedError<ApiType>;
      /**
       * The conflicting stake discovered. Cannot stake.
       **/
      ConflictingStakes: AugmentedError<ApiType>;
      /**
       * Cannot create a bounty with an entrant stake is less than required minimum.
       **/
      EntrantStakeIsLessThanMininum: AugmentedError<ApiType>;
      /**
       * Cannot create a bounty with zero funding amount parameter.
       **/
      FundingAmountCannotBeZero: AugmentedError<ApiType>;
      /**
       * Cannot create a bounty with zero funding period parameter.
       **/
      FundingPeriodCannotBeZero: AugmentedError<ApiType>;
      /**
       * Insufficient balance for a bounty cherry.
       **/
      InsufficientBalanceForBounty: AugmentedError<ApiType>;
      /**
       * There is not enough balance for a stake.
       **/
      InsufficientBalanceForStake: AugmentedError<ApiType>;
      /**
       * Bounty contributor not found
       **/
      InvalidContributorActorSpecified: AugmentedError<ApiType>;
      /**
       * Invalid Creator Actor for Bounty specified
       **/
      InvalidCreatorActorSpecified: AugmentedError<ApiType>;
      /**
       * Member specified is not an entrant worker
       **/
      InvalidEntrantWorkerSpecified: AugmentedError<ApiType>;
      /**
       * Bounty oracle not found
       **/
      InvalidOracleActorSpecified: AugmentedError<ApiType>;
      /**
       * Provided oracle member id does not belong to an existing member
       **/
      InvalidOracleMemberId: AugmentedError<ApiType>;
      /**
       * Unexpected bounty stage for an operation: Cancelled.
       **/
      InvalidStageUnexpectedCancelled: AugmentedError<ApiType>;
      /**
       * Unexpected bounty stage for an operation: FailedBountyWithdrawal.
       **/
      InvalidStageUnexpectedFailedBountyWithdrawal: AugmentedError<ApiType>;
      /**
       * Unexpected bounty stage for an operation: Funding.
       **/
      InvalidStageUnexpectedFunding: AugmentedError<ApiType>;
      /**
       * Unexpected bounty stage for an operation: Judgment.
       **/
      InvalidStageUnexpectedJudgment: AugmentedError<ApiType>;
      /**
       * Unexpected bounty stage for an operation: NoFundingContributed.
       **/
      InvalidStageUnexpectedNoFundingContributed: AugmentedError<ApiType>;
      /**
       * Unexpected bounty stage for an operation: SuccessfulBountyWithdrawal.
       **/
      InvalidStageUnexpectedSuccessfulBountyWithdrawal: AugmentedError<ApiType>;
      /**
       * Unexpected bounty stage for an operation: WorkSubmission.
       **/
      InvalidStageUnexpectedWorkSubmission: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Min funding amount cannot be greater than max amount.
       **/
      MinFundingAmountCannotBeGreaterThanMaxAmount: AugmentedError<ApiType>;
      /**
       * Cannot found bounty contribution.
       **/
      NoBountyContributionFound: AugmentedError<ApiType>;
      /**
       * Oracle have already been withdrawn
       **/
      OracleRewardAlreadyWithdrawn: AugmentedError<ApiType>;
      /**
       * Origin is root, so switching oracle is not allowed in this extrinsic. (call switch_oracle_as_root)
       **/
      SwitchOracleOriginIsRoot: AugmentedError<ApiType>;
      /**
       * The total reward for winners should be equal to total bounty funding.
       **/
      TotalRewardShouldBeEqualToTotalFunding: AugmentedError<ApiType>;
      /**
       * Invalid judgment - all winners should have work submissions.
       **/
      WinnerShouldHasWorkSubmission: AugmentedError<ApiType>;
      /**
       * Worker tried to access a work entry that doesn't belong to him
       **/
      WorkEntryDoesntBelongToWorker: AugmentedError<ApiType>;
      /**
       * Work entry doesnt exist.
       **/
      WorkEntryDoesntExist: AugmentedError<ApiType>;
      /**
       * Cannot set zero reward for winners.
       **/
      ZeroWinnerReward: AugmentedError<ApiType>;
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
       * Actor cannot Own channel
       **/
      ActorCannotOwnChannel: AugmentedError<ApiType>;
      /**
       * Actor is not a last bidder
       **/
      ActorIsNotBidder: AugmentedError<ApiType>;
      /**
       * Actor is not A Member
       **/
      ActorNotAMember: AugmentedError<ApiType>;
      /**
       * Operation cannot be perfomed with this Actor
       **/
      ActorNotAuthorized: AugmentedError<ApiType>;
      /**
       * List of assets to remove provided for update_channel / update_video contains assets that don't belong to the specified entity
       **/
      AssetsToRemoveBeyondEntityAssetsSet: AugmentedError<ApiType>;
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
       * Auction did not started
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
       * Auction does not have bids
       **/
      BidDoesNotExist: AugmentedError<ApiType>;
      /**
       * Selected Bid is for past open auction
       **/
      BidIsForPastAuction: AugmentedError<ApiType>;
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
      BuyNowMustBeGreaterThanStartingPrice: AugmentedError<ApiType>;
      /**
       * Cannot directly withdraw funds from a channel account when the channel has
       * a creator token issued
       **/
      CannotWithdrawFromChannelWithCreatorTokenIssued: AugmentedError<ApiType>;
      /**
       * Channel cashout amount is too low to be claimed
       **/
      CashoutAmountBelowMinimumAmount: AugmentedError<ApiType>;
      /**
       * Channel cashout amount is too high to be claimed
       **/
      CashoutAmountExceedsMaximumAmount: AugmentedError<ApiType>;
      /**
       * A Channel or Video Category does not exist.
       **/
      CategoryDoesNotExist: AugmentedError<ApiType>;
      ChannelAgentInsufficientPermissions: AugmentedError<ApiType>;
      /**
       * Unexpected runtime state: missing channel bag during delete_channel attempt
       **/
      ChannelBagMissing: AugmentedError<ApiType>;
      /**
       * Channel cashouts are currently disabled
       **/
      ChannelCashoutsDisabled: AugmentedError<ApiType>;
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
       * Operation cannot be executed, because this channel feature has been paused by a curator
       **/
      ChannelFeaturePaused: AugmentedError<ApiType>;
      ChannelNftDailyLimitExceeded: AugmentedError<ApiType>;
      ChannelNftWeeklyLimitExceeded: AugmentedError<ApiType>;
      /**
       * Provided channel owner (curator group) does not exist
       **/
      ChannelOwnerCuratorGroupDoesNotExist: AugmentedError<ApiType>;
      /**
       * Provided channel owner (member) does not exist
       **/
      ChannelOwnerMemberDoesNotExist: AugmentedError<ApiType>;
      /**
       * Channel state bloat bond cannot be lower than existential deposit,
       * because it must secure the channel module account against dusting
       **/
      ChannelStateBloatBondBelowExistentialDeposit: AugmentedError<ApiType>;
      /**
       * Invalid extrinsic call: Channel state bloat bond changed.
       **/
      ChannelStateBloatBondChanged: AugmentedError<ApiType>;
      /**
       * Channel Transfers are blocked during revenue splits
       **/
      ChannelTransfersBlockedDuringRevenueSplits: AugmentedError<ApiType>;
      /**
       * Channel Transfers are blocked during token sales
       **/
      ChannelTransfersBlockedDuringTokenSales: AugmentedError<ApiType>;
      /**
       * Creator token was already issued for this channel
       **/
      CreatorTokenAlreadyIssued: AugmentedError<ApiType>;
      /**
       * Creator token wasn't issued for this channel
       **/
      CreatorTokenNotIssued: AugmentedError<ApiType>;
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
       * Curator group's permissions by level map exceeded the maximum allowed size
       **/
      CuratorGroupMaxPermissionsByLevelMapSizeExceeded: AugmentedError<ApiType>;
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
       * Curator does not have permissions to perform given moderation action
       **/
      CuratorModerationActionNotAllowed: AugmentedError<ApiType>;
      /**
       * Max number of curators per group limit reached
       **/
      CuratorsPerGroupLimitReached: AugmentedError<ApiType>;
      /**
       * Given origin does not own nft
       **/
      DoesNotOwnNft: AugmentedError<ApiType>;
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
      GlobalNftDailyLimitExceeded: AugmentedError<ApiType>;
      GlobalNftWeeklyLimitExceeded: AugmentedError<ApiType>;
      /**
       * Insufficient balance
       **/
      InsufficientBalance: AugmentedError<ApiType>;
      /**
       * Cannot create the channel: channel creator has insufficient balance
       * (budget for channel state bloat bond + channel data objs state bloat bonds + data objs storage fees + existential deposit)
       **/
      InsufficientBalanceForChannelCreation: AugmentedError<ApiType>;
      /**
       * Cannot transfer the channel: channel owner has insufficient balance (budget for WGs)
       **/
      InsufficientBalanceForTransfer: AugmentedError<ApiType>;
      /**
       * Cannot create the video: video creator has insufficient balance
       * (budget for video state bloat bond + video data objs state bloat bonds + data objs storage fees + existential deposit)
       **/
      InsufficientBalanceForVideoCreation: AugmentedError<ApiType>;
      InsufficientCouncilBudget: AugmentedError<ApiType>;
      /**
       * Insufficient treasury balance
       **/
      InsufficientTreasuryBalance: AugmentedError<ApiType>;
      /**
       * Channel assets feasibility
       **/
      InvalidAssetsProvided: AugmentedError<ApiType>;
      /**
       * Bag Size specified is not valid
       **/
      InvalidBagSizeSpecified: AugmentedError<ApiType>;
      /**
       * Commit verification for bid amount
       **/
      InvalidBidAmountSpecified: AugmentedError<ApiType>;
      /**
       * `witness_price` provided to `buy_now` extrinsic does not match the current sell price
       **/
      InvalidBuyNowWitnessPriceProvided: AugmentedError<ApiType>;
      /**
       * Channel bag witness parameters don't match the current runtime state
       **/
      InvalidChannelBagWitnessProvided: AugmentedError<ApiType>;
      /**
       * Incorrect channel owner for an operation.
       **/
      InvalidChannelOwner: AugmentedError<ApiType>;
      /**
       * Incorrect actor tries to accept the channel transfer.
       **/
      InvalidChannelTransferAcceptor: AugmentedError<ApiType>;
      /**
       * Cannot accept the channel transfer: provided commitment parameters doesn't match with
       * channel pending transfer parameters.
       **/
      InvalidChannelTransferCommitmentParams: AugmentedError<ApiType>;
      /**
       * Invalid channel transfer status for operations.
       **/
      InvalidChannelTransferStatus: AugmentedError<ApiType>;
      /**
       * Invalid member id  specified
       **/
      InvalidMemberProvided: AugmentedError<ApiType>;
      /**
       * Current nft offer price does not match the provided `witness_price`
       **/
      InvalidNftOfferWitnessPriceProvided: AugmentedError<ApiType>;
      /**
       * Storage buckets number witness parameter does not match the current runtime state
       **/
      InvalidStorageBucketsNumWitnessProvided: AugmentedError<ApiType>;
      /**
       * Invalid number of objects to delete provided for delete_video
       **/
      InvalidVideoDataObjectsCountProvided: AugmentedError<ApiType>;
      /**
       * Auction type is not `English`
       **/
      IsNotEnglishAuctionType: AugmentedError<ApiType>;
      /**
       * Auction type is not `Open`
       **/
      IsNotOpenAuctionType: AugmentedError<ApiType>;
      /**
       * Lead authentication failed
       **/
      LeadAuthFailed: AugmentedError<ApiType>;
      /**
       * Max auction whitelist length upper bound exceeded
       **/
      MaxAuctionWhiteListLengthUpperBoundExceeded: AugmentedError<ApiType>;
      /**
       * Attempt to set minimum cashout allowed above the limit
       **/
      MaxCashoutValueTooHigh: AugmentedError<ApiType>;
      /**
       * Maximum number of curator permissions per given channel privilege level exceeded
       **/
      MaxCuratorPermissionsPerLevelExceeded: AugmentedError<ApiType>;
      /**
       * Maximum number of channel agent permissions for channel agent exceeded
       **/
      MaxNumberOfChannelAgentPermissionsExceeded: AugmentedError<ApiType>;
      /**
       * Number of channel assets exceeds MaxNumberOfAssetsPerChannel
       **/
      MaxNumberOfChannelAssetsExceeded: AugmentedError<ApiType>;
      /**
       * Number of channel collaborators exceeds MaxNumberOfCollaboratorsPerChannel
       **/
      MaxNumberOfChannelCollaboratorsExceeded: AugmentedError<ApiType>;
      /**
       * Maximum number of paused features per channel exceeded
       **/
      MaxNumberOfPausedFeaturesPerChannelExceeded: AugmentedError<ApiType>;
      /**
       * Number of video assets exceeds MaxMaxNumberOfAssetsPerVideo
       **/
      MaxNumberOfVideoAssetsExceeded: AugmentedError<ApiType>;
      /**
       * Member authentication failed
       **/
      MemberAuthFailed: AugmentedError<ApiType>;
      /**
       * Member id could not be derived from the provided ContentActor context
       **/
      MemberIdCouldNotBeDerivedFromActor: AugmentedError<ApiType>;
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
       * New values for min_cashout_allowed/max_cashout_allowed are invalid
       * min_cashout_allowed cannot exceed max_cashout_allowed
       **/
      MinCashoutAllowedExceedsMaxCashoutAllowed: AugmentedError<ApiType>;
      /**
       * Attempt to set minimum cashout allowed below the limit
       **/
      MinCashoutValueTooLow: AugmentedError<ApiType>;
      /**
       * Storage buckets number witness parameter must be provided when channel/video assets
       * are being updated.
       **/
      MissingStorageBucketsNumWitness: AugmentedError<ApiType>;
      /**
       * Nft for given video id already exists
       **/
      NftAlreadyExists: AugmentedError<ApiType>;
      /**
       * Attempt to sling back a channel owned nft
       **/
      NftAlreadyOwnedByChannel: AugmentedError<ApiType>;
      /**
       * Nft auction is already expired
       **/
      NftAuctionIsAlreadyExpired: AugmentedError<ApiType>;
      /**
       * Nft for given video id does not exist
       **/
      NftDoesNotExist: AugmentedError<ApiType>;
      /**
       * Can not create auction for Nft, if auction have been already started or nft is locked for the transfer
       **/
      NftIsNotIdle: AugmentedError<ApiType>;
      /**
       * Non-channel owner specified during nft issuance does not exist
       **/
      NftNonChannelOwnerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Given video nft is not in buy now state
       **/
      NftNotInBuyNowState: AugmentedError<ApiType>;
      /**
       * No assets to be removed have been specified
       **/
      NoAssetsSpecified: AugmentedError<ApiType>;
      /**
       * Nft is not in auction state
       **/
      NotInAuctionState: AugmentedError<ApiType>;
      /**
       * Delete channel and assets and delete video assets must have a number of assets to remove greater than zero
       **/
      NumberOfAssetsToRemoveIsZero: AugmentedError<ApiType>;
      /**
       * Overflow or underflow error happened
       **/
      OverflowOrUnderflowHappened: AugmentedError<ApiType>;
      /**
       * Patronage can only be claimed if channel is owned by a member
       **/
      PatronageCanOnlyBeClaimedForMemberOwnedChannels: AugmentedError<ApiType>;
      /**
       * Payment Proof verification failed
       **/
      PaymentProofVerificationFailed: AugmentedError<ApiType>;
      /**
       * No pending offers for given Nft
       **/
      PendingOfferDoesNotExist: AugmentedError<ApiType>;
      /**
       * Partecipant is not a member
       **/
      ReplyDoesNotExist: AugmentedError<ApiType>;
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
       * Nft offer target member does not exist
       **/
      TargetMemberDoesNotExist: AugmentedError<ApiType>;
      /**
       * Insufficient balance
       **/
      UnsufficientBalance: AugmentedError<ApiType>;
      /**
       * Video does not exist
       **/
      VideoDoesNotExist: AugmentedError<ApiType>;
      /**
       * Vfdeo in season can`t be removed (because order is important)
       **/
      VideoInSeason: AugmentedError<ApiType>;
      /**
       * Invalid extrinsic call: video state bloat bond changed.
       **/
      VideoStateBloatBondChanged: AugmentedError<ApiType>;
      /**
       * At least one of the whitelisted members does not exist
       **/
      WhitelistedMemberDoesNotExist: AugmentedError<ApiType>;
      /**
       * Auction whitelist has only one member
       **/
      WhitelistHasOnlyOneMember: AugmentedError<ApiType>;
      /**
       * An attempt to withdraw funds from channel account failed, because the specified amount
       * exceeds the withdrawable amount (channel account balance minus channel bloat bond)
       **/
      WithdrawalAmountExceedsChannelAccountWithdrawableBalance: AugmentedError<ApiType>;
      /**
       * An attempt to withdraw funds from channel account failed, because the specified amount
       * is zero
       **/
      WithdrawFromChannelAmountIsZero: AugmentedError<ApiType>;
      /**
       * Cannot claim zero reward.
       **/
      ZeroReward: AugmentedError<ApiType>;
    };
    contentWorkingGroup: {
      /**
       * Trying to fill opening with an application for other opening
       **/
      ApplicationsNotForOpening: AugmentedError<ApiType>;
      /**
       * Application stake is less than required opening stake.
       **/
      ApplicationStakeDoesntMatchOpening: AugmentedError<ApiType>;
      /**
       * Unexpected arithmetic error (overflow / underflow)
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * Staking less than the lower bound.
       **/
      BelowMinimumStakes: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake - stake delta greater than initial stake.
       **/
      CannotDecreaseStakeDeltaGreaterThanStake: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Reward could not be zero.
       **/
      CannotRewardWithZero: AugmentedError<ApiType>;
      /**
       * Invalid spending amount.
       **/
      CannotSpendZero: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Cannot withdraw: insufficient budget balance.
       **/
      InsufficientBalanceForTransfer: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * It's not enough budget for this spending.
       **/
      InsufficientBudgetForSpending: AugmentedError<ApiType>;
      /**
       * Insufficient tokens for funding (on member controller account)
       **/
      InsufficientTokensForFunding: AugmentedError<ApiType>;
      /**
       * Invalid origin for a member.
       **/
      InvalidMemberOrigin: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Cannot fill opening - no applications provided.
       **/
      NoApplicationsProvided: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Specified unstaking period is less then minimum set for the group.
       **/
      UnstakingPeriodLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Invalid operation - worker is leaving.
       **/
      WorkerIsLeaving: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
      /**
       * Trying to fund with zero tokens
       **/
      ZeroTokensFunding: AugmentedError<ApiType>;
    };
    council: {
      /**
       * Unexpected arithmetic error (overflow / underflow)
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * Origin is invalid.
       **/
      BadOrigin: AugmentedError<ApiType>;
      /**
       * Candidate haven't provided sufficient stake.
       **/
      CandidacyStakeTooLow: AugmentedError<ApiType>;
      /**
       * Candidate id not found
       **/
      CandidateDoesNotExist: AugmentedError<ApiType>;
      /**
       * User tried to announce candidacy outside of the candidacy announcement period.
       **/
      CantCandidateNow: AugmentedError<ApiType>;
      /**
       * User tried to announce candidacy twice in the same elections.
       **/
      CantCandidateTwice: AugmentedError<ApiType>;
      /**
       * User tried to release stake outside of the revealing period.
       **/
      CantReleaseStakeNow: AugmentedError<ApiType>;
      /**
       * Candidate can't vote for himself.
       **/
      CantVoteForYourself: AugmentedError<ApiType>;
      /**
       * Can't withdraw candidacy outside of the candidacy announcement period.
       **/
      CantWithdrawCandidacyNow: AugmentedError<ApiType>;
      /**
       * User tried to announce candidacy with an account that has the conflicting type of stake
       * with candidacy stake and has not enough balance for staking for both purposes.
       **/
      ConflictingStake: AugmentedError<ApiType>;
      /**
       * Funding requests without recieving accounts
       **/
      EmptyFundingRequests: AugmentedError<ApiType>;
      /**
       * Insufficient balance for candidacy staking.
       **/
      InsufficientBalanceForStaking: AugmentedError<ApiType>;
      /**
       * Cannot withdraw: insufficient budget balance.
       **/
      InsufficientBalanceForTransfer: AugmentedError<ApiType>;
      /**
       * Insufficent funds in council for executing 'Funding Request'
       **/
      InsufficientFundsForFundingRequest: AugmentedError<ApiType>;
      /**
       * Insufficient tokens for funding (on member controller account)
       **/
      InsufficientTokensForFunding: AugmentedError<ApiType>;
      /**
       * The combination of membership id and account id is invalid for unstaking an existing
       * candidacy stake.
       **/
      InvalidAccountToStakeReuse: AugmentedError<ApiType>;
      /**
       * Invalid membership.
       **/
      MemberIdNotMatchAccount: AugmentedError<ApiType>;
      /**
       * User tried to release stake when no stake exists.
       **/
      NoStake: AugmentedError<ApiType>;
      /**
       * User tried to withdraw candidacy when not candidating.
       **/
      NotCandidatingNow: AugmentedError<ApiType>;
      /**
       * The member is not a councilor.
       **/
      NotCouncilor: AugmentedError<ApiType>;
      /**
       * The same account is recieving funds from the same request twice
       **/
      RepeatedFundRequestAccount: AugmentedError<ApiType>;
      /**
       * Council member and candidates can't withdraw stake yet.
       **/
      StakeStillNeeded: AugmentedError<ApiType>;
      /**
       * Fund request no balance
       **/
      ZeroBalanceFundRequest: AugmentedError<ApiType>;
      /**
       * Trying to fund with zero tokens
       **/
      ZeroTokensFunding: AugmentedError<ApiType>;
    };
    distributionWorkingGroup: {
      /**
       * Trying to fill opening with an application for other opening
       **/
      ApplicationsNotForOpening: AugmentedError<ApiType>;
      /**
       * Application stake is less than required opening stake.
       **/
      ApplicationStakeDoesntMatchOpening: AugmentedError<ApiType>;
      /**
       * Unexpected arithmetic error (overflow / underflow)
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * Staking less than the lower bound.
       **/
      BelowMinimumStakes: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake - stake delta greater than initial stake.
       **/
      CannotDecreaseStakeDeltaGreaterThanStake: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Reward could not be zero.
       **/
      CannotRewardWithZero: AugmentedError<ApiType>;
      /**
       * Invalid spending amount.
       **/
      CannotSpendZero: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Cannot withdraw: insufficient budget balance.
       **/
      InsufficientBalanceForTransfer: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * It's not enough budget for this spending.
       **/
      InsufficientBudgetForSpending: AugmentedError<ApiType>;
      /**
       * Insufficient tokens for funding (on member controller account)
       **/
      InsufficientTokensForFunding: AugmentedError<ApiType>;
      /**
       * Invalid origin for a member.
       **/
      InvalidMemberOrigin: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Cannot fill opening - no applications provided.
       **/
      NoApplicationsProvided: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Specified unstaking period is less then minimum set for the group.
       **/
      UnstakingPeriodLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Invalid operation - worker is leaving.
       **/
      WorkerIsLeaving: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
      /**
       * Trying to fund with zero tokens
       **/
      ZeroTokensFunding: AugmentedError<ApiType>;
    };
    electionProviderMultiPhase: {
      /**
       * The call is not allowed at this point.
       **/
      CallNotAllowed: AugmentedError<ApiType>;
      /**
       * The fallback failed
       **/
      FallbackFailed: AugmentedError<ApiType>;
      /**
       * `Self::insert_submission` returned an invalid index.
       **/
      InvalidSubmissionIndex: AugmentedError<ApiType>;
      /**
       * Snapshot metadata should exist but didn't.
       **/
      MissingSnapshotMetadata: AugmentedError<ApiType>;
      /**
       * OCW submitted solution for wrong round
       **/
      OcwCallWrongEra: AugmentedError<ApiType>;
      /**
       * Submission was too early.
       **/
      PreDispatchEarlySubmission: AugmentedError<ApiType>;
      /**
       * Submission was too weak, score-wise.
       **/
      PreDispatchWeakSubmission: AugmentedError<ApiType>;
      /**
       * Wrong number of winners presented.
       **/
      PreDispatchWrongWinnerCount: AugmentedError<ApiType>;
      /**
       * The origin failed to pay the deposit.
       **/
      SignedCannotPayDeposit: AugmentedError<ApiType>;
      /**
       * Witness data to dispatchable is invalid.
       **/
      SignedInvalidWitness: AugmentedError<ApiType>;
      /**
       * The queue was full, and the solution was not better than any of the existing ones.
       **/
      SignedQueueFull: AugmentedError<ApiType>;
      /**
       * The signed submission consumes too much weight
       **/
      SignedTooMuchWeight: AugmentedError<ApiType>;
    };
    forum: {
      /**
       * Account does not match post author.
       **/
      AccountDoesNotMatchPostAuthor: AugmentedError<ApiType>;
      /**
       * Thread not authored by the given user.
       **/
      AccountDoesNotMatchThreadAuthor: AugmentedError<ApiType>;
      /**
       * Ancestor category immutable, i.e. deleted or archived
       **/
      AncestorCategoryImmutable: AugmentedError<ApiType>;
      /**
       * Unexpected arithmetic error (overflow / underflow)
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * A thread with outstanding posts cannot be removed
       **/
      CannotDeleteThreadWithOutstandingPosts: AugmentedError<ApiType>;
      /**
       * Category does not exist.
       **/
      CategoryDoesNotExist: AugmentedError<ApiType>;
      /**
       * Provided moderator is not given category moderator
       **/
      CategoryModeratorDoesNotExist: AugmentedError<ApiType>;
      /**
       * Category not being updated.
       **/
      CategoryNotBeingUpdated: AugmentedError<ApiType>;
      /**
       * Category still contains some subcategories.
       **/
      CategoryNotEmptyCategories: AugmentedError<ApiType>;
      /**
       * Category still contains some threads.
       **/
      CategoryNotEmptyThreads: AugmentedError<ApiType>;
      /**
       * Forum user id not match its account.
       **/
      ForumUserIdNotMatchAccount: AugmentedError<ApiType>;
      /**
       * Not enough balance to post
       **/
      InsufficientBalanceForPost: AugmentedError<ApiType>;
      /**
       * Not enough balance to create thread
       **/
      InsufficientBalanceForThreadCreation: AugmentedError<ApiType>;
      /**
       * Maximum size of storage map exceeded
       **/
      MapSizeLimit: AugmentedError<ApiType>;
      /**
       * Maximum number of stickied threads per category exceeded
       **/
      MaxNumberOfStickiedThreadsExceeded: AugmentedError<ApiType>;
      /**
       * Maximum valid category depth exceeded.
       **/
      MaxValidCategoryDepthExceeded: AugmentedError<ApiType>;
      /**
       * No permissions to delete category.
       **/
      ModeratorCantDeleteCategory: AugmentedError<ApiType>;
      /**
       * No permissions to update category.
       **/
      ModeratorCantUpdateCategory: AugmentedError<ApiType>;
      /**
       * Moderator id not match its account.
       **/
      ModeratorIdNotMatchAccount: AugmentedError<ApiType>;
      /**
       * Moderator can't moderate destination category.
       **/
      ModeratorModerateDestinationCategory: AugmentedError<ApiType>;
      /**
       * Moderator can't moderate category containing thread.
       **/
      ModeratorModerateOriginCategory: AugmentedError<ApiType>;
      /**
       * Origin doesn't correspond to any lead account
       **/
      OriginNotForumLead: AugmentedError<ApiType>;
      /**
       * Category path len should be greater than zero
       **/
      PathLengthShouldBeGreaterThanZero: AugmentedError<ApiType>;
      /**
       * Post does not exist.
       **/
      PostDoesNotExist: AugmentedError<ApiType>;
      /**
       * Thread does not exist
       **/
      ThreadDoesNotExist: AugmentedError<ApiType>;
      /**
       * Origin is the same as the destination.
       **/
      ThreadMoveInvalid: AugmentedError<ApiType>;
      /**
       * Thread not being updated.
       **/
      ThreadNotBeingUpdated: AugmentedError<ApiType>;
    };
    forumWorkingGroup: {
      /**
       * Trying to fill opening with an application for other opening
       **/
      ApplicationsNotForOpening: AugmentedError<ApiType>;
      /**
       * Application stake is less than required opening stake.
       **/
      ApplicationStakeDoesntMatchOpening: AugmentedError<ApiType>;
      /**
       * Unexpected arithmetic error (overflow / underflow)
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * Staking less than the lower bound.
       **/
      BelowMinimumStakes: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake - stake delta greater than initial stake.
       **/
      CannotDecreaseStakeDeltaGreaterThanStake: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Reward could not be zero.
       **/
      CannotRewardWithZero: AugmentedError<ApiType>;
      /**
       * Invalid spending amount.
       **/
      CannotSpendZero: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Cannot withdraw: insufficient budget balance.
       **/
      InsufficientBalanceForTransfer: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * It's not enough budget for this spending.
       **/
      InsufficientBudgetForSpending: AugmentedError<ApiType>;
      /**
       * Insufficient tokens for funding (on member controller account)
       **/
      InsufficientTokensForFunding: AugmentedError<ApiType>;
      /**
       * Invalid origin for a member.
       **/
      InvalidMemberOrigin: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Cannot fill opening - no applications provided.
       **/
      NoApplicationsProvided: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Specified unstaking period is less then minimum set for the group.
       **/
      UnstakingPeriodLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Invalid operation - worker is leaving.
       **/
      WorkerIsLeaving: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
      /**
       * Trying to fund with zero tokens
       **/
      ZeroTokensFunding: AugmentedError<ApiType>;
    };
    gatewayWorkingGroup: {
      /**
       * Trying to fill opening with an application for other opening
       **/
      ApplicationsNotForOpening: AugmentedError<ApiType>;
      /**
       * Application stake is less than required opening stake.
       **/
      ApplicationStakeDoesntMatchOpening: AugmentedError<ApiType>;
      /**
       * Unexpected arithmetic error (overflow / underflow)
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * Staking less than the lower bound.
       **/
      BelowMinimumStakes: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake - stake delta greater than initial stake.
       **/
      CannotDecreaseStakeDeltaGreaterThanStake: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Reward could not be zero.
       **/
      CannotRewardWithZero: AugmentedError<ApiType>;
      /**
       * Invalid spending amount.
       **/
      CannotSpendZero: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Cannot withdraw: insufficient budget balance.
       **/
      InsufficientBalanceForTransfer: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * It's not enough budget for this spending.
       **/
      InsufficientBudgetForSpending: AugmentedError<ApiType>;
      /**
       * Insufficient tokens for funding (on member controller account)
       **/
      InsufficientTokensForFunding: AugmentedError<ApiType>;
      /**
       * Invalid origin for a member.
       **/
      InvalidMemberOrigin: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Cannot fill opening - no applications provided.
       **/
      NoApplicationsProvided: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Specified unstaking period is less then minimum set for the group.
       **/
      UnstakingPeriodLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Invalid operation - worker is leaving.
       **/
      WorkerIsLeaving: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
      /**
       * Trying to fund with zero tokens
       **/
      ZeroTokensFunding: AugmentedError<ApiType>;
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
    joystreamUtility: {
      /**
       * Insufficient funds for 'Update Working Group Budget' proposal execution
       **/
      InsufficientFundsForBudgetUpdate: AugmentedError<ApiType>;
      /**
       * Insufficient funds for burning
       **/
      InsufficientFundsForBurn: AugmentedError<ApiType>;
      /**
       * Trying to burn zero tokens
       **/
      ZeroTokensBurn: AugmentedError<ApiType>;
    };
    members: {
      /**
       * Cannot set a referral cut percent value. The limit was exceeded.
       **/
      CannotExceedReferralCutPercentLimit: AugmentedError<ApiType>;
      /**
       * Should be a member to receive invites.
       **/
      CannotTransferInvitesForNotMember: AugmentedError<ApiType>;
      /**
       * Cannot invite a member. The controller account has an existing conflicting lock.
       **/
      ConflictingLock: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Controller account required.
       **/
      ControllerAccountRequired: AugmentedError<ApiType>;
      /**
       * Locked amount is greater than credit amount
       **/
      GifLockExceedsCredit: AugmentedError<ApiType>;
      /**
       * Handle already registered.
       **/
      HandleAlreadyRegistered: AugmentedError<ApiType>;
      /**
       * Handle must be provided during registration.
       **/
      HandleMustBeProvidedDuringRegistration: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * Gifter doesn't have sufficient balance to credit
       **/
      InsufficientBalanceToGift: AugmentedError<ApiType>;
      /**
       * Member profile not found (invalid member id).
       **/
      MemberProfileNotFound: AugmentedError<ApiType>;
      /**
       * Not enough balance to buy membership.
       **/
      NotEnoughBalanceToBuyMembership: AugmentedError<ApiType>;
      /**
       * Not enough invites to perform an operation.
       **/
      NotEnoughInvites: AugmentedError<ApiType>;
      /**
       * Cannot find a membership for a provided referrer id.
       **/
      ReferrerIsNotMember: AugmentedError<ApiType>;
      /**
       * Root account required.
       **/
      RootAccountRequired: AugmentedError<ApiType>;
      /**
       * Staking account has already been confirmed.
       **/
      StakingAccountAlreadyConfirmed: AugmentedError<ApiType>;
      /**
       * Staking account for membership doesn't exist.
       **/
      StakingAccountDoesntExist: AugmentedError<ApiType>;
      /**
       * Staking account is registered for some member.
       **/
      StakingAccountIsAlreadyRegistered: AugmentedError<ApiType>;
      /**
       * Unsigned origin.
       **/
      UnsignedOrigin: AugmentedError<ApiType>;
      /**
       * Cannot invite a member. Working group balance is not sufficient to set the default
       * balance.
       **/
      WorkingGroupBudgetIsNotSufficientForInviting: AugmentedError<ApiType>;
      /**
       * Membership working group leader is not set.
       **/
      WorkingGroupLeaderNotSet: AugmentedError<ApiType>;
    };
    membershipWorkingGroup: {
      /**
       * Trying to fill opening with an application for other opening
       **/
      ApplicationsNotForOpening: AugmentedError<ApiType>;
      /**
       * Application stake is less than required opening stake.
       **/
      ApplicationStakeDoesntMatchOpening: AugmentedError<ApiType>;
      /**
       * Unexpected arithmetic error (overflow / underflow)
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * Staking less than the lower bound.
       **/
      BelowMinimumStakes: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake - stake delta greater than initial stake.
       **/
      CannotDecreaseStakeDeltaGreaterThanStake: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Reward could not be zero.
       **/
      CannotRewardWithZero: AugmentedError<ApiType>;
      /**
       * Invalid spending amount.
       **/
      CannotSpendZero: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Cannot withdraw: insufficient budget balance.
       **/
      InsufficientBalanceForTransfer: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * It's not enough budget for this spending.
       **/
      InsufficientBudgetForSpending: AugmentedError<ApiType>;
      /**
       * Insufficient tokens for funding (on member controller account)
       **/
      InsufficientTokensForFunding: AugmentedError<ApiType>;
      /**
       * Invalid origin for a member.
       **/
      InvalidMemberOrigin: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Cannot fill opening - no applications provided.
       **/
      NoApplicationsProvided: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Specified unstaking period is less then minimum set for the group.
       **/
      UnstakingPeriodLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Invalid operation - worker is leaving.
       **/
      WorkerIsLeaving: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
      /**
       * Trying to fund with zero tokens
       **/
      ZeroTokensFunding: AugmentedError<ApiType>;
    };
    multisig: {
      /**
       * Call is already approved by this signatory.
       **/
      AlreadyApproved: AugmentedError<ApiType>;
      /**
       * The data to be stored is already stored.
       **/
      AlreadyStored: AugmentedError<ApiType>;
      /**
       * The maximum weight information provided was too low.
       **/
      MaxWeightTooLow: AugmentedError<ApiType>;
      /**
       * Threshold must be 2 or greater.
       **/
      MinimumThreshold: AugmentedError<ApiType>;
      /**
       * Call doesn't need any (more) approvals.
       **/
      NoApprovalsNeeded: AugmentedError<ApiType>;
      /**
       * Multisig operation not found when attempting to cancel.
       **/
      NotFound: AugmentedError<ApiType>;
      /**
       * No timepoint was given, yet the multisig operation is already underway.
       **/
      NoTimepoint: AugmentedError<ApiType>;
      /**
       * Only the account that originally created the multisig is able to cancel it.
       **/
      NotOwner: AugmentedError<ApiType>;
      /**
       * The sender was contained in the other signatories; it shouldn't be.
       **/
      SenderInSignatories: AugmentedError<ApiType>;
      /**
       * The signatories were provided out of order; they should be ordered.
       **/
      SignatoriesOutOfOrder: AugmentedError<ApiType>;
      /**
       * There are too few signatories in the list.
       **/
      TooFewSignatories: AugmentedError<ApiType>;
      /**
       * There are too many signatories in the list.
       **/
      TooManySignatories: AugmentedError<ApiType>;
      /**
       * A timepoint was given, yet no multisig operation is underway.
       **/
      UnexpectedTimepoint: AugmentedError<ApiType>;
      /**
       * A different timepoint was given to the multisig operation that is underway.
       **/
      WrongTimepoint: AugmentedError<ApiType>;
    };
    operationsWorkingGroupAlpha: {
      /**
       * Trying to fill opening with an application for other opening
       **/
      ApplicationsNotForOpening: AugmentedError<ApiType>;
      /**
       * Application stake is less than required opening stake.
       **/
      ApplicationStakeDoesntMatchOpening: AugmentedError<ApiType>;
      /**
       * Unexpected arithmetic error (overflow / underflow)
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * Staking less than the lower bound.
       **/
      BelowMinimumStakes: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake - stake delta greater than initial stake.
       **/
      CannotDecreaseStakeDeltaGreaterThanStake: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Reward could not be zero.
       **/
      CannotRewardWithZero: AugmentedError<ApiType>;
      /**
       * Invalid spending amount.
       **/
      CannotSpendZero: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Cannot withdraw: insufficient budget balance.
       **/
      InsufficientBalanceForTransfer: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * It's not enough budget for this spending.
       **/
      InsufficientBudgetForSpending: AugmentedError<ApiType>;
      /**
       * Insufficient tokens for funding (on member controller account)
       **/
      InsufficientTokensForFunding: AugmentedError<ApiType>;
      /**
       * Invalid origin for a member.
       **/
      InvalidMemberOrigin: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Cannot fill opening - no applications provided.
       **/
      NoApplicationsProvided: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Specified unstaking period is less then minimum set for the group.
       **/
      UnstakingPeriodLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Invalid operation - worker is leaving.
       **/
      WorkerIsLeaving: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
      /**
       * Trying to fund with zero tokens
       **/
      ZeroTokensFunding: AugmentedError<ApiType>;
    };
    operationsWorkingGroupBeta: {
      /**
       * Trying to fill opening with an application for other opening
       **/
      ApplicationsNotForOpening: AugmentedError<ApiType>;
      /**
       * Application stake is less than required opening stake.
       **/
      ApplicationStakeDoesntMatchOpening: AugmentedError<ApiType>;
      /**
       * Unexpected arithmetic error (overflow / underflow)
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * Staking less than the lower bound.
       **/
      BelowMinimumStakes: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake - stake delta greater than initial stake.
       **/
      CannotDecreaseStakeDeltaGreaterThanStake: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Reward could not be zero.
       **/
      CannotRewardWithZero: AugmentedError<ApiType>;
      /**
       * Invalid spending amount.
       **/
      CannotSpendZero: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Cannot withdraw: insufficient budget balance.
       **/
      InsufficientBalanceForTransfer: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * It's not enough budget for this spending.
       **/
      InsufficientBudgetForSpending: AugmentedError<ApiType>;
      /**
       * Insufficient tokens for funding (on member controller account)
       **/
      InsufficientTokensForFunding: AugmentedError<ApiType>;
      /**
       * Invalid origin for a member.
       **/
      InvalidMemberOrigin: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Cannot fill opening - no applications provided.
       **/
      NoApplicationsProvided: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Specified unstaking period is less then minimum set for the group.
       **/
      UnstakingPeriodLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Invalid operation - worker is leaving.
       **/
      WorkerIsLeaving: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
      /**
       * Trying to fund with zero tokens
       **/
      ZeroTokensFunding: AugmentedError<ApiType>;
    };
    operationsWorkingGroupGamma: {
      /**
       * Trying to fill opening with an application for other opening
       **/
      ApplicationsNotForOpening: AugmentedError<ApiType>;
      /**
       * Application stake is less than required opening stake.
       **/
      ApplicationStakeDoesntMatchOpening: AugmentedError<ApiType>;
      /**
       * Unexpected arithmetic error (overflow / underflow)
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * Staking less than the lower bound.
       **/
      BelowMinimumStakes: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake - stake delta greater than initial stake.
       **/
      CannotDecreaseStakeDeltaGreaterThanStake: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Reward could not be zero.
       **/
      CannotRewardWithZero: AugmentedError<ApiType>;
      /**
       * Invalid spending amount.
       **/
      CannotSpendZero: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Cannot withdraw: insufficient budget balance.
       **/
      InsufficientBalanceForTransfer: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * It's not enough budget for this spending.
       **/
      InsufficientBudgetForSpending: AugmentedError<ApiType>;
      /**
       * Insufficient tokens for funding (on member controller account)
       **/
      InsufficientTokensForFunding: AugmentedError<ApiType>;
      /**
       * Invalid origin for a member.
       **/
      InvalidMemberOrigin: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Cannot fill opening - no applications provided.
       **/
      NoApplicationsProvided: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Specified unstaking period is less then minimum set for the group.
       **/
      UnstakingPeriodLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Invalid operation - worker is leaving.
       **/
      WorkerIsLeaving: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
      /**
       * Trying to fund with zero tokens
       **/
      ZeroTokensFunding: AugmentedError<ApiType>;
    };
    projectToken: {
      /**
       * Account Already exists
       **/
      AccountAlreadyExists: AugmentedError<ApiType>;
      /**
       * Requested account data does not exist
       **/
      AccountInformationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Unexpected arithmetic error (overflow / underflow)
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * Attempt to remove an account with some outstanding tokens
       **/
      AttemptToRemoveNonEmptyAccount: AugmentedError<ApiType>;
      /**
       * Attempt to remove non owned account under permissioned mode
       **/
      AttemptToRemoveNonOwnedAccountUnderPermissionedMode: AugmentedError<ApiType>;
      /**
       * Amount of tokens to burn exceeds total amount of tokens owned by the account
       **/
      BurnAmountGreaterThanAccountTokensAmount: AugmentedError<ApiType>;
      /**
       * Provided amount to burn is == 0
       **/
      BurnAmountIsZero: AugmentedError<ApiType>;
      /**
       * Cannot Deissue Token with outstanding accounts
       **/
      CannotDeissueTokenWithOutstandingAccounts: AugmentedError<ApiType>;
      /**
       * Attempt to issue in a split with zero allocation amount
       **/
      CannotIssueSplitWithZeroAllocationAmount: AugmentedError<ApiType>;
      /**
       * Cannot join whitelist in permissionless mode
       **/
      CannotJoinWhitelistInPermissionlessMode: AugmentedError<ApiType>;
      /**
       * Attempt to modify supply when revenue split is active
       **/
      CannotModifySupplyWhenRevenueSplitsAreActive: AugmentedError<ApiType>;
      /**
       * Attempt to participate in a split with zero token to stake
       **/
      CannotParticipateInSplitWithZeroAmount: AugmentedError<ApiType>;
      /**
       * At least one of the members provided as part of InitialAllocation does not exist
       **/
      InitialAllocationToNonExistingMember: AugmentedError<ApiType>;
      /**
       * User does not posses enough balance to participate in the revenue split
       **/
      InsufficientBalanceForSplitParticipation: AugmentedError<ApiType>;
      /**
       * Account's JOY balance is insufficient to make the token purchase
       **/
      InsufficientBalanceForTokenPurchase: AugmentedError<ApiType>;
      /**
       * Insufficient JOY Balance to cover the transaction costs
       **/
      InsufficientJoyBalance: AugmentedError<ApiType>;
      /**
       * Account's transferrable balance is insufficient to perform the transfer or initialize token sale
       **/
      InsufficientTransferrableBalance: AugmentedError<ApiType>;
      /**
       * The amount of JOY to be transferred is not enough to keep the destination account alive
       **/
      JoyTransferSubjectToDusting: AugmentedError<ApiType>;
      /**
       * Cannot add another vesting schedule to an account.
       * Maximum number of vesting schedules for this account-token pair was reached.
       **/
      MaxVestingSchedulesPerAccountPerTokenReached: AugmentedError<ApiType>;
      /**
       * Merkle proof verification failed
       **/
      MerkleProofVerificationFailure: AugmentedError<ApiType>;
      /**
       * The token has no active sale at the moment
       **/
      NoActiveSale: AugmentedError<ApiType>;
      /**
       * Amount of tokens to purchase on sale exceeds the quantity of tokens still available on the sale
       **/
      NotEnoughTokensOnSale: AugmentedError<ApiType>;
      /**
       * There are no remaining tokes to recover from the previous token sale.
       **/
      NoTokensToRecover: AugmentedError<ApiType>;
      /**
       * The token has no upcoming sale
       **/
      NoUpcomingSale: AugmentedError<ApiType>;
      /**
       * Previous sale was still not finalized, finalize it first.
       **/
      PreviousSaleNotFinalized: AugmentedError<ApiType>;
      /**
       * Attempt to activate split with one ongoing
       **/
      RevenueSplitAlreadyActiveForToken: AugmentedError<ApiType>;
      /**
       * Revenue Split has not ended yet
       **/
      RevenueSplitDidNotEnd: AugmentedError<ApiType>;
      /**
       * Revenue Split duration is too short
       **/
      RevenueSplitDurationTooShort: AugmentedError<ApiType>;
      /**
       * Attempt to make revenue split operations with token not in active split state
       **/
      RevenueSplitNotActiveForToken: AugmentedError<ApiType>;
      /**
       * Revenue Split for token active, but not ongoing
       **/
      RevenueSplitNotOngoing: AugmentedError<ApiType>;
      /**
       * Revenue split rate cannot be 0
       **/
      RevenueSplitRateIsZero: AugmentedError<ApiType>;
      /**
       * Specified revenue split starting block is in the past
       **/
      RevenueSplitTimeToStartTooShort: AugmentedError<ApiType>;
      /**
       * Participant in sale access proof provided during `purchase_tokens_on_sale`
       * does not match the sender account
       **/
      SaleAccessProofParticipantIsNotSender: AugmentedError<ApiType>;
      /**
       * Only whitelisted participants are allowed to access the sale, therefore access proof is required
       **/
      SaleAccessProofRequired: AugmentedError<ApiType>;
      /**
       * Purchase cap per member cannot be zero
       **/
      SaleCapPerMemberIsZero: AugmentedError<ApiType>;
      /**
       * Sale duration cannot be zero
       **/
      SaleDurationIsZero: AugmentedError<ApiType>;
      /**
       * Specified sale duration is shorter than MinSaleDuration
       **/
      SaleDurationTooShort: AugmentedError<ApiType>;
      /**
       * Amount of tokens to purchase on sale cannot be zero
       **/
      SalePurchaseAmountIsZero: AugmentedError<ApiType>;
      /**
       * Sale participant's cap (either cap_per_member or whitelisted participant's specific cap)
       * was exceeded with the purchase
       **/
      SalePurchaseCapExceeded: AugmentedError<ApiType>;
      /**
       * Specified sale starting block is in the past
       **/
      SaleStartingBlockInThePast: AugmentedError<ApiType>;
      /**
       * Token's unit price cannot be zero
       **/
      SaleUnitPriceIsZero: AugmentedError<ApiType>;
      /**
       * Upper bound quantity cannot be zero
       **/
      SaleUpperBoundQuantityIsZero: AugmentedError<ApiType>;
      /**
       * Target Rate is higher than current patronage rate
       **/
      TargetPatronageRateIsHigherThanCurrentRate: AugmentedError<ApiType>;
      /**
       * Requested token does not exist
       **/
      TokenDoesNotExist: AugmentedError<ApiType>;
      /**
       * Token's current offering state is not Idle
       **/
      TokenIssuanceNotInIdleState: AugmentedError<ApiType>;
      /**
       * Symbol already in use
       **/
      TokenSymbolAlreadyInUse: AugmentedError<ApiType>;
      /**
       * Transfer destination member id invalid
       **/
      TransferDestinationMemberDoesNotExist: AugmentedError<ApiType>;
      /**
       * User already participating in the revenue split
       **/
      UserAlreadyParticipating: AugmentedError<ApiType>;
      /**
       * User is not participating in any split
       **/
      UserNotParticipantingInAnySplit: AugmentedError<ApiType>;
    };
    proposalsCodex: {
      /**
       * Arithmeic Error
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * Invalid 'decrease stake proposal' parameter - cannot decrease by zero balance.
       **/
      DecreasingStakeIsZero: AugmentedError<ApiType>;
      /**
       * Insufficient funds for 'Update Working Group Budget' proposal execution
       **/
      InsufficientFundsForBudgetUpdate: AugmentedError<ApiType>;
      /**
       * The specified min channel cashout is greater than the specified max channel cashout in `Update Channel Payouts` proposal.
       **/
      InvalidChannelPayoutsProposalMinCashoutExceedsMaxCashout: AugmentedError<ApiType>;
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
       * Invalid balance value for the spending proposal
       **/
      InvalidFundingRequestProposalBalance: AugmentedError<ApiType>;
      /**
       * Invalid number of accounts recieving funding request for 'Funding Request' proposal.
       **/
      InvalidFundingRequestProposalNumberOfAccount: AugmentedError<ApiType>;
      /**
       * Repeated account in 'Funding Request' proposal.
       **/
      InvalidFundingRequestProposalRepeatedAccount: AugmentedError<ApiType>;
      /**
       * Provided lead application id is not valid
       **/
      InvalidLeadApplicationId: AugmentedError<ApiType>;
      /**
       * Provided lead opening id is not valid
       **/
      InvalidLeadOpeningId: AugmentedError<ApiType>;
      /**
       * Provided lead worker id is not valid
       **/
      InvalidLeadWorkerId: AugmentedError<ApiType>;
      /**
       * Provided proposal id is not valid
       **/
      InvalidProposalId: AugmentedError<ApiType>;
      /**
       * Invalid 'set lead proposal' parameter - proposed lead cannot be a councilor
       **/
      InvalidSetLeadParameterCannotBeCouncilor: AugmentedError<ApiType>;
      /**
       * Invalid validator count for the 'set validator count' proposal
       **/
      InvalidValidatorCount: AugmentedError<ApiType>;
      /**
       * Invalid working group budget capacity parameter
       **/
      InvalidWorkingGroupBudgetCapacity: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
      /**
       * Provided WASM code for the runtime upgrade proposal is empty
       **/
      RuntimeProposalIsEmpty: AugmentedError<ApiType>;
      /**
       * Provided text for text proposal is empty
       **/
      SignalProposalIsEmpty: AugmentedError<ApiType>;
      /**
       * Invalid 'slash stake proposal' parameter - cannot slash by zero balance.
       **/
      SlashingStakeIsZero: AugmentedError<ApiType>;
    };
    proposalsDiscussion: {
      /**
       * Unexpected arithmetic error (overflow / underflow)
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * Account can't delete post at the moment
       **/
      CannotDeletePost: AugmentedError<ApiType>;
      /**
       * The thread has Closed mode. And post author doesn't belong to council or allowed members.
       **/
      CannotPostOnClosedThread: AugmentedError<ApiType>;
      /**
       * Account has insufficient balance to create a post
       **/
      InsufficientBalanceForPost: AugmentedError<ApiType>;
      /**
       * Max allowed authors list limit exceeded.
       **/
      MaxWhiteListSizeExceeded: AugmentedError<ApiType>;
      /**
       * Should be thread author or councilor.
       **/
      NotAuthorOrCouncilor: AugmentedError<ApiType>;
      /**
       * Post doesn't exist
       **/
      PostDoesntExist: AugmentedError<ApiType>;
      /**
       * Require root origin in extrinsics
       **/
      RequireRootOrigin: AugmentedError<ApiType>;
      /**
       * Thread doesn't exist
       **/
      ThreadDoesntExist: AugmentedError<ApiType>;
      /**
       * At least one of the member ids provided as part of closed thread whitelist belongs
       * to a non-existing member.
       **/
      WhitelistedMemberDoesNotExist: AugmentedError<ApiType>;
    };
    proposalsEngine: {
      /**
       * The proposal have been already voted on
       **/
      AlreadyVoted: AugmentedError<ApiType>;
      /**
       * Unexpected arithmetic error (overflow / underflow)
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * The conflicting stake discovered. Cannot stake.
       **/
      ConflictingStakes: AugmentedError<ApiType>;
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
       * There is not enough balance for a stake.
       **/
      InsufficientBalanceForStake: AugmentedError<ApiType>;
      /**
       * Exact execution block cannot be less than current_block.
       **/
      InvalidExactExecutionBlock: AugmentedError<ApiType>;
      /**
       * Approval threshold cannot be zero
       **/
      InvalidParameterApprovalThreshold: AugmentedError<ApiType>;
      /**
       * Slashing threshold cannot be zero
       **/
      InvalidParameterSlashingThreshold: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Max active proposals number exceeded
       **/
      MaxActiveProposalNumberExceeded: AugmentedError<ApiType>;
      /**
       * The size of encoded dispatchable call to be executed by the proposal is too big
       **/
      MaxDispatchableCallCodeSizeExceeded: AugmentedError<ApiType>;
      /**
       * Not an author
       **/
      NotAuthor: AugmentedError<ApiType>;
      /**
       * Proposal is finalized already
       **/
      ProposalFinalized: AugmentedError<ApiType>;
      /**
       * Disallow to cancel the proposal if there are any votes on it.
       **/
      ProposalHasVotes: AugmentedError<ApiType>;
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
      /**
       * Exact execution block cannot be zero.
       **/
      ZeroExactExecutionBlock: AugmentedError<ApiType>;
    };
    referendum: {
      /**
       * Trying to vote multiple time in the same cycle
       **/
      AlreadyVotedThisCycle: AugmentedError<ApiType>;
      /**
       * Origin is invalid
       **/
      BadOrigin: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Account Insufficient Free Balance (now)
       **/
      InsufficientBalanceToStake: AugmentedError<ApiType>;
      /**
       * Insufficient stake provided to cast a vote
       **/
      InsufficientStake: AugmentedError<ApiType>;
      /**
       * Salt and referendum option provided don't correspond to the commitment
       **/
      InvalidReveal: AugmentedError<ApiType>;
      /**
       * Vote for not existing option was revealed
       **/
      InvalidVote: AugmentedError<ApiType>;
      /**
       * Referendum is not running when expected to
       **/
      ReferendumNotRunning: AugmentedError<ApiType>;
      /**
       * Revealing stage is not in progress right now
       **/
      RevealingNotInProgress: AugmentedError<ApiType>;
      /**
       * Salt is too long
       **/
      SaltTooLong: AugmentedError<ApiType>;
      /**
       * Unstaking has been forbidden for the user (at least for now)
       **/
      UnstakingForbidden: AugmentedError<ApiType>;
      /**
       * Invalid time to release the locked stake
       **/
      UnstakingVoteInSameCycle: AugmentedError<ApiType>;
      /**
       * Trying to reveal vote that was not cast
       **/
      VoteNotExisting: AugmentedError<ApiType>;
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
       * Key setting account is not live, so it's impossible to associate keys.
       **/
      NoAccount: AugmentedError<ApiType>;
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
       * Internal state has become somehow corrupted and the operation cannot continue.
       **/
      BadState: AugmentedError<ApiType>;
      /**
       * A nomination target was supplied that was blocked or otherwise not a validator.
       **/
      BadTarget: AugmentedError<ApiType>;
      /**
       * External restriction prevents bonding with given account
       **/
      BondingRestricted: AugmentedError<ApiType>;
      /**
       * The user has enough bond and thus cannot be chilled forcefully by an external person.
       **/
      CannotChillOther: AugmentedError<ApiType>;
      /**
       * Commission is too low. Must be at least `MinCommission`.
       **/
      CommissionTooLow: AugmentedError<ApiType>;
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
       * Cannot have a validator or nominator role, with value less than the minimum defined by
       * governance (see `MinValidatorBond` and `MinNominatorBond`). If unbonding is the
       * intention, `chill` first to remove one's role as validator/nominator.
       **/
      InsufficientBond: AugmentedError<ApiType>;
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
       * There are too many nominators in the system. Governance needs to adjust the staking
       * settings to keep things safe for the runtime.
       **/
      TooManyNominators: AugmentedError<ApiType>;
      /**
       * Too many nomination targets supplied.
       **/
      TooManyTargets: AugmentedError<ApiType>;
      /**
       * There are too many validators in the system. Governance needs to adjust the staking
       * settings to keep things safe for the runtime.
       **/
      TooManyValidators: AugmentedError<ApiType>;
    };
    storage: {
      /**
       * Generic Arithmetic Error due to internal accounting operation
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * Blacklist size limit exceeded.
       **/
      BlacklistSizeLimitExceeded: AugmentedError<ApiType>;
      /**
       * Call Disabled
       **/
      CallDisabled: AugmentedError<ApiType>;
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
       * Invalid extrinsic call: data object state bloat bond changed.
       **/
      DataObjectStateBloatBondChanged: AugmentedError<ApiType>;
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
       * Distribution bucket id collection provided contradicts the existing dynamic bag
       * creation policy.
       **/
      DistributionBucketsViolatesDynamicBagCreationPolicy: AugmentedError<ApiType>;
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
       * Invalid CID length (must be 46 bytes)
       **/
      InvalidCidLength: AugmentedError<ApiType>;
      /**
       * Upload data error: invalid state bloat bond source account.
       **/
      InvalidStateBloatBondSourceAccount: AugmentedError<ApiType>;
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
       * Max number of operators for a distribution bucket reached.
       **/
      MaxNumberOfOperatorsPerDistributionBucketReached: AugmentedError<ApiType>;
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
       * Not allowed 'number of distribution buckets'
       **/
      NumberOfDistributionBucketsOutsideOfAllowedContraints: AugmentedError<ApiType>;
      /**
       * Not allowed 'number of storage buckets'
       **/
      NumberOfStorageBucketsOutsideOfAllowedContraints: AugmentedError<ApiType>;
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
       * Storage bucket id collection provided contradicts the existing dynamic bag
       * creation policy.
       **/
      StorageBucketsNumberViolatesDynamicBagCreationPolicy: AugmentedError<ApiType>;
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
       * Trying to fill opening with an application for other opening
       **/
      ApplicationsNotForOpening: AugmentedError<ApiType>;
      /**
       * Application stake is less than required opening stake.
       **/
      ApplicationStakeDoesntMatchOpening: AugmentedError<ApiType>;
      /**
       * Unexpected arithmetic error (overflow / underflow)
       **/
      ArithmeticError: AugmentedError<ApiType>;
      /**
       * Staking less than the lower bound.
       **/
      BelowMinimumStakes: AugmentedError<ApiType>;
      /**
       * Cannot decrease stake - stake delta greater than initial stake.
       **/
      CannotDecreaseStakeDeltaGreaterThanStake: AugmentedError<ApiType>;
      /**
       * There is leader already, cannot hire another one.
       **/
      CannotHireLeaderWhenLeaderExists: AugmentedError<ApiType>;
      /**
       * Cannot fill opening with multiple applications.
       **/
      CannotHireMultipleLeaders: AugmentedError<ApiType>;
      /**
       * Reward could not be zero.
       **/
      CannotRewardWithZero: AugmentedError<ApiType>;
      /**
       * Invalid spending amount.
       **/
      CannotSpendZero: AugmentedError<ApiType>;
      /**
       * Staking account contains conflicting stakes.
       **/
      ConflictStakesOnAccount: AugmentedError<ApiType>;
      /**
       * Current lead is not set.
       **/
      CurrentLeadNotSet: AugmentedError<ApiType>;
      /**
       * Cannot withdraw: insufficient budget balance.
       **/
      InsufficientBalanceForTransfer: AugmentedError<ApiType>;
      /**
       * Insufficient balance to cover stake.
       **/
      InsufficientBalanceToCoverStake: AugmentedError<ApiType>;
      /**
       * It's not enough budget for this spending.
       **/
      InsufficientBudgetForSpending: AugmentedError<ApiType>;
      /**
       * Insufficient tokens for funding (on member controller account)
       **/
      InsufficientTokensForFunding: AugmentedError<ApiType>;
      /**
       * Invalid origin for a member.
       **/
      InvalidMemberOrigin: AugmentedError<ApiType>;
      /**
       * Staking account doesn't belong to a member.
       **/
      InvalidStakingAccountForMember: AugmentedError<ApiType>;
      /**
       * Not a lead account.
       **/
      IsNotLeadAccount: AugmentedError<ApiType>;
      /**
       * Working group size limit exceeded.
       **/
      MaxActiveWorkerNumberExceeded: AugmentedError<ApiType>;
      /**
       * Cannot fill opening - no applications provided.
       **/
      NoApplicationsProvided: AugmentedError<ApiType>;
      /**
       * Opening does not exist.
       **/
      OpeningDoesNotExist: AugmentedError<ApiType>;
      /**
       * Origin is not applicant.
       **/
      OriginIsNotApplicant: AugmentedError<ApiType>;
      /**
       * Signer is not worker role account.
       **/
      SignerIsNotWorkerRoleAccount: AugmentedError<ApiType>;
      /**
       * Provided stake balance cannot be zero.
       **/
      StakeBalanceCannotBeZero: AugmentedError<ApiType>;
      /**
       * Successful worker application does not exist.
       **/
      SuccessfulWorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Specified unstaking period is less then minimum set for the group.
       **/
      UnstakingPeriodLessThanMinimum: AugmentedError<ApiType>;
      /**
       * Worker application does not exist.
       **/
      WorkerApplicationDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker does not exist.
       **/
      WorkerDoesNotExist: AugmentedError<ApiType>;
      /**
       * Worker has no recurring reward.
       **/
      WorkerHasNoReward: AugmentedError<ApiType>;
      /**
       * Invalid operation - worker is leaving.
       **/
      WorkerIsLeaving: AugmentedError<ApiType>;
      /**
       * Worker storage text is too long.
       **/
      WorkerStorageValueTooLong: AugmentedError<ApiType>;
      /**
       * Trying to fund with zero tokens
       **/
      ZeroTokensFunding: AugmentedError<ApiType>;
    };
    sudo: {
      /**
       * Sender must be the Sudo account
       **/
      RequireSudo: AugmentedError<ApiType>;
    };
    system: {
      /**
       * The origin filter prevent the call to be dispatched.
       **/
      CallFiltered: AugmentedError<ApiType>;
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
    utility: {
      /**
       * Too many calls batched.
       **/
      TooManyCalls: AugmentedError<ApiType>;
    };
    vesting: {
      /**
       * Amount being transferred is too low to create a vesting schedule.
       **/
      AmountLow: AugmentedError<ApiType>;
      /**
       * The account already has `MaxVestingSchedules` count of schedules and thus
       * cannot add another one. Consider merging existing schedules in order to add another.
       **/
      AtMaxVestingSchedules: AugmentedError<ApiType>;
      /**
       * Failed to create a new schedule because some parameter was invalid.
       **/
      InvalidScheduleParams: AugmentedError<ApiType>;
      /**
       * The account given is not vesting.
       **/
      NotVesting: AugmentedError<ApiType>;
      /**
       * An index was out of bounds of the vesting schedules.
       **/
      ScheduleIndexOutOfBounds: AugmentedError<ApiType>;
    };
  } // AugmentedErrors
} // declare module
