use crate::*;
use frame_support::decl_error;

decl_error! {
    /// Content directory errors
    pub enum Error for Module<T: Trait> {
        /// Feature Not Implemented
        FeatureNotImplemented,

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

        /// Video in season can`t be removed (because order is important)
        VideoInSeason,

        /// Curators can only censor non-curator group owned channels
        CannotCensoreCuratorGroupOwnedChannels,

        /// Actor cannot authorize as lead for given extrinsic
        ActorCannotBeLead,

        /// Channel censorship status did not change
        ChannelCensorshipStatusDidNotChange,

        /// Video censorship status did not change
        VideoCensorshipStatusDidNotChange,


        // Auction Errors
        // ---------------------

        /// Auction for given video did not start
        AuctionDidNotStart,

        /// NFT for given video id already exists
        NFTAlreadyExists,

        /// NFT for given video id does not exist
        NFTDoesNotExist,

        /// Overflow or underflow error happened
        OverflowOrUnderflowHappened,

        /// Given origin does not own nft
        DoesNotOwnNFT,

        /// Royalty Upper Bound Exceeded
        RoyaltyUpperBoundExceeded,

        /// Royalty Lower Bound Exceeded
        RoyaltyLowerBoundExceeded,

        /// Round time upper bound exceeded
        RoundTimeUpperBoundExceeded,

        /// Round time lower bound exceeded
        RoundTimeLowerBoundExceeded,

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

        /// Auction starting price constraint violated.
        StartingPriceConstraintViolated,

        /// Already active auction cannot be cancelled
        ActionHasBidsAlready,

        /// Can not create auction for NFT, if auction have been already started or nft is locked for the transfer
        NftIsNotIdle,

        /// NFT is already in Idle state
        NoPendingTransaction,

        // No incoming offers for given origin found
        NoIncomingOffers,

        // Creator royalty requires reward account to be set.
        RewardAccountIsNotSet,

        // Actor, which makes an attempt to finish auction is not a winner
        CallerIsNotAWinner,

        // Auction cannot be completed
        AuctionCannotBeCompleted,

        // Auction does not have bids
        LastBidDoesNotExist,

        // Auction starts at lower bound exceeded
        StartsAtLowerBoundExceeded,

        // Auction starts at upper bound exceeded
        StartsAtUpperBoundExceeded,

        // Nft is not in auction state
        NotInAuctionState,

        // Member is not allowed to participate in auction
        MemberIsNotAllowedToParticipate,

        // Member profile not found
        MemberProfileNotFound,

        // Given video nft is not in buy now state
        NFTNotInBuyNowState,

        // Auction type is not `Open`
        IsNotOpenAuctionType,

        // Bid lock duration is not expired
        BidLockDurationIsNotExpired,

        // NFT auction is already expired
        NFTAuctionIsAlreadyExpired,

        /// No assets to be removed have been specified
        NoAssetsSpecified,

        /// Channel assets feasibility
        InvalidAssetsProvided,

        /// Channel Contains Video
        ChannelContainsVideos,

        /// Channel Contains Assets
        ChannelContainsAssets,

    }
}
