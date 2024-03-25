use crate::*;
use frame_support::decl_error;
use sp_std::convert::TryInto;

decl_error! {
    /// Content directory errors
    pub enum Error for Module<T: Config> {
        /// Invalid extrinsic call: Channel state bloat bond changed.
        ChannelStateBloatBondChanged,

        /// Invalid extrinsic call: video state bloat bond changed.
        VideoStateBloatBondChanged,

        /// Attempt to set minimum cashout allowed below the limit
        MinCashoutValueTooLow,

        /// Attempt to set minimum cashout allowed above the limit
        MaxCashoutValueTooHigh,

        /// Number of channel collaborators exceeds MaxNumberOfCollaboratorsPerChannel
        MaxNumberOfChannelCollaboratorsExceeded,

        /// Number of channel assets exceeds MaxNumberOfAssetsPerChannel
        MaxNumberOfChannelAssetsExceeded,

        /// Number of video assets exceeds MaxMaxNumberOfAssetsPerVideo
        MaxNumberOfVideoAssetsExceeded,

        /// Maximum number of channel agent permissions for channel agent exceeded
        MaxNumberOfChannelAgentPermissionsExceeded,

        /// Maximum number of paused features per channel exceeded
        MaxNumberOfPausedFeaturesPerChannelExceeded,

        /// Channel bag witness parameters don't match the current runtime state
        InvalidChannelBagWitnessProvided,

        /// Storage buckets number witness parameter does not match the current runtime state
        InvalidStorageBucketsNumWitnessProvided,

        /// Storage buckets number witness parameter must be provided when channel/video assets
        /// are being updated.
        MissingStorageBucketsNumWitness,

        /// Provided channel owner (member) does not exist
        ChannelOwnerMemberDoesNotExist,

        /// Provided channel owner (curator group) does not exist
        ChannelOwnerCuratorGroupDoesNotExist,

        /// Channel state bloat bond cannot be lower than existential deposit,
        /// because it must secure the channel module account against dusting
        ChannelStateBloatBondBelowExistentialDeposit,

        ///Delete channel and assets and delete video assets must have a number of assets to remove greater than zero
        NumberOfAssetsToRemoveIsZero,

        // Curator Management Errors
        // -------------------------

        /// Curator under provided curator id is not a member of curaror group under given id
        CuratorIsNotAMemberOfGivenCuratorGroup,

        /// Curator under provided curator id is already a member of curaror group under given id
        CuratorIsAlreadyAMemberOfGivenCuratorGroup,

        /// Given curator group does not exist
        CuratorGroupDoesNotExist,

        /// Max number of curators per group limit reached
        CuratorsPerGroupLimitReached,

        /// Curator group is not active
        CuratorGroupIsNotActive,

        /// Curator id is not a worker id in content working group
        CuratorIdInvalid,

        // Authentication Errors
        // ---------------------

        /// Lead authentication failed
        LeadAuthFailed,

        /// Member authentication failed
        MemberAuthFailed,

        /// Curator authentication failed
        CuratorAuthFailed,

        /// Expected root or signed origin
        BadOrigin,

        /// Operation cannot be perfomed with this Actor
        ActorNotAuthorized,

        /// A Channel or Video Category does not exist.
        CategoryDoesNotExist,

        /// Channel does not exist
        ChannelDoesNotExist,

        /// Video does not exist
        VideoDoesNotExist,

        /// Vfdeo in season can`t be removed (because order is important)
        VideoInSeason,

        /// Actor cannot authorize as lead for given extrinsic
        ActorCannotBeLead,

        /// Actor cannot Own channel
        ActorCannotOwnChannel,

        /// Attempt to sling back a channel owned nft
        NftAlreadyOwnedByChannel,

        // Auction Errors
        // ---------------------

        /// Nft for given video id already exists
        NftAlreadyExists,

        /// Nft for given video id does not exist
        NftDoesNotExist,

        /// Overflow or underflow error happened
        OverflowOrUnderflowHappened,

        /// Given origin does not own nft
        DoesNotOwnNft,

        /// Royalty Upper Bound Exceeded
        RoyaltyUpperBoundExceeded,

        /// Royalty Lower Bound Exceeded
        RoyaltyLowerBoundExceeded,

        /// Auction duration upper bound exceeded
        AuctionDurationUpperBoundExceeded,

        /// Auction duration lower bound exceeded
        AuctionDurationLowerBoundExceeded,

        /// Auction extension period upper bound exceeded
        ExtensionPeriodUpperBoundExceeded,

        /// Auction extension period lower bound exceeded
        ExtensionPeriodLowerBoundExceeded,

        /// Bid lock duration upper bound exceeded
        BidLockDurationUpperBoundExceeded,

        /// Bid lock duration lower bound exceeded
        BidLockDurationLowerBoundExceeded,

        /// Starting price upper bound exceeded
        StartingPriceUpperBoundExceeded,

        /// Starting price lower bound exceeded
        StartingPriceLowerBoundExceeded,

        /// Auction bid step upper bound exceeded
        AuctionBidStepUpperBoundExceeded,

        /// Auction bid step lower bound exceeded
        AuctionBidStepLowerBoundExceeded,

        /// Insufficient balance
        InsufficientBalance,

        /// Minimal auction bid step constraint violated.
        BidStepConstraintViolated,

        /// Commit verification for bid amount
        InvalidBidAmountSpecified,

        /// Auction starting price constraint violated.
        StartingPriceConstraintViolated,

        /// Already active auction cannot be cancelled
        ActionHasBidsAlready,

        /// Can not create auction for Nft, if auction have been already started or nft is locked for the transfer
        NftIsNotIdle,

        /// No pending offers for given Nft
        PendingOfferDoesNotExist,

        /// Creator royalty requires reward account to be set.
        RewardAccountIsNotSet,

        /// Actor is not a last bidder
        ActorIsNotBidder,

        /// Auction cannot be completed
        AuctionCannotBeCompleted,

        /// Auction does not have bids
        BidDoesNotExist,

        /// Selected Bid is for past open auction
        BidIsForPastAuction,

        /// Auction starts at lower bound exceeded
        StartsAtLowerBoundExceeded,

        /// Auction starts at upper bound exceeded
        StartsAtUpperBoundExceeded,

        /// Auction did not started
        AuctionDidNotStart,

        /// Nft is not in auction state
        NotInAuctionState,

        /// Member is not allowed to participate in auction
        MemberIsNotAllowedToParticipate,

        /// Member profile not found
        MemberProfileNotFound,

        /// Given video nft is not in buy now state
        NftNotInBuyNowState,

        /// `witness_price` provided to `buy_now` extrinsic does not match the current sell price
        InvalidBuyNowWitnessPriceProvided,

        /// Auction type is not `Open`
        IsNotOpenAuctionType,

        /// Auction type is not `English`
        IsNotEnglishAuctionType,

        /// Bid lock duration is not expired
        BidLockDurationIsNotExpired,

        /// Nft auction is already expired
        NftAuctionIsAlreadyExpired,

        /// Auction buy now is less then starting price
        BuyNowMustBeGreaterThanStartingPrice,

        /// Nft offer target member does not exist
        TargetMemberDoesNotExist,

        /// Current nft offer price does not match the provided `witness_price`
        InvalidNftOfferWitnessPriceProvided,

        /// Max auction whitelist length upper bound exceeded
        MaxAuctionWhiteListLengthUpperBoundExceeded,

        /// Auction whitelist has only one member
        WhitelistHasOnlyOneMember,

        /// At least one of the whitelisted members does not exist
        WhitelistedMemberDoesNotExist,

        /// Non-channel owner specified during nft issuance does not exist
        NftNonChannelOwnerDoesNotExist,

        /// Extension period is greater then auction duration
        ExtensionPeriodIsGreaterThenAuctionDuration,

        /// No assets to be removed have been specified
        NoAssetsSpecified,

        /// Channel assets feasibility
        InvalidAssetsProvided,

        /// Channel Contains Video
        ChannelContainsVideos,

        /// Channel Contains Assets
        ChannelContainsAssets,

        /// Bag Size specified is not valid
        InvalidBagSizeSpecified,

        /// Migration not done yet
        MigrationNotFinished,

        /// Partecipant is not a member
        ReplyDoesNotExist,

        /// Insufficient balance
        UnsufficientBalance,

        /// Insufficient treasury balance
        InsufficientTreasuryBalance,

        /// Invalid member id  specified
        InvalidMemberProvided,

        /// Actor is not A Member
        ActorNotAMember,

        /// Payment Proof verification failed
        PaymentProofVerificationFailed,

        /// Channel cashout amount is too high to be claimed
        CashoutAmountExceedsMaximumAmount,

        /// Channel cashout amount is too low to be claimed
        CashoutAmountBelowMinimumAmount,

        /// An attempt to withdraw funds from channel account failed, because the specified amount
        /// exceeds the withdrawable amount (channel account balance minus channel bloat bond)
        WithdrawalAmountExceedsChannelAccountWithdrawableBalance,

        /// An attempt to withdraw funds from channel account failed, because the specified amount
        /// is zero
        WithdrawFromChannelAmountIsZero,

        /// Channel cashouts are currently disabled
        ChannelCashoutsDisabled,

        /// New values for min_cashout_allowed/max_cashout_allowed are invalid
        /// min_cashout_allowed cannot exceed max_cashout_allowed
        MinCashoutAllowedExceedsMaxCashoutAllowed,

        /// Curator does not have permissions to perform given moderation action
        CuratorModerationActionNotAllowed,

        /// Maximum number of curator permissions per given channel privilege level exceeded
        MaxCuratorPermissionsPerLevelExceeded,

        /// Curator group's permissions by level map exceeded the maximum allowed size
        CuratorGroupMaxPermissionsByLevelMapSizeExceeded,

        /// Operation cannot be executed, because this channel feature has been paused by a curator
        ChannelFeaturePaused,

        /// Unexpected runtime state: missing channel bag during delete_channel attempt
        ChannelBagMissing,

        /// List of assets to remove provided for update_channel / update_video contains assets that don't belong to the specified entity
        AssetsToRemoveBeyondEntityAssetsSet,

        /// Invalid number of objects to delete provided for delete_video
        InvalidVideoDataObjectsCountProvided,

        /// Invalid channel transfer status for operations.
        InvalidChannelTransferStatus,

        /// Incorrect actor tries to accept the channel transfer.
        InvalidChannelTransferAcceptor,

        /// Cannot accept the channel transfer: provided commitment parameters doesn't match with
        /// channel pending transfer parameters.
        InvalidChannelTransferCommitmentParams,

        // Insufficient permissions to perform given action as a channel agent
        ChannelAgentInsufficientPermissions,

        /// Incorrect channel owner for an operation.
        InvalidChannelOwner,

        /// Cannot claim zero reward.
        ZeroReward,

        /// Cannot transfer the channel: channel owner has insufficient balance (budget for WGs)
        InsufficientBalanceForTransfer,

        /// Cannot create the channel: channel creator has insufficient balance
        /// (budget for channel state bloat bond + channel data objs state bloat bonds + data objs storage fees + existential deposit)
        InsufficientBalanceForChannelCreation,

        /// Cannot create the video: video creator has insufficient balance
        /// (budget for video state bloat bond + video data objs state bloat bonds + data objs storage fees + existential deposit)
        InsufficientBalanceForVideoCreation,

        // Insufficient council budget to cover channel reward claim
        InsufficientCouncilBudget,

        // Can't issue more NFTs: global daily limit exceeded.
        GlobalNftDailyLimitExceeded,

        // Can't issue more NFTs: global weekly limit exceeded.
        GlobalNftWeeklyLimitExceeded,

        // Can't issue more NFTs: channel daily limit exceeded.
        ChannelNftDailyLimitExceeded,

        // Can't issue more NFTs: channel weekly limit exceeded.
        ChannelNftWeeklyLimitExceeded,

        // Creator Tokens
        // ---------------------

        /// Creator token was already issued for this channel
        CreatorTokenAlreadyIssued,

        /// Creator token wasn't issued for this channel
        CreatorTokenNotIssued,

        /// Member id could not be derived from the provided ContentActor context
        MemberIdCouldNotBeDerivedFromActor,

        /// Cannot directly withdraw funds from a channel account when the channel has
        /// a creator token issued
        CannotWithdrawFromChannelWithCreatorTokenIssued,

        /// Patronage can only be claimed if channel is owned by a member
        PatronageCanOnlyBeClaimedForMemberOwnedChannels,

        /// Channel Transfers are blocked during revenue splits
        ChannelTransfersBlockedDuringRevenueSplits,

        /// Channel Transfers are blocked during token sales
        ChannelTransfersBlockedDuringTokenSales,

        /// Channel Transfers are blocked during active AMM
        ChannelTransfersBlockedDuringActiveAmm
    }
}
