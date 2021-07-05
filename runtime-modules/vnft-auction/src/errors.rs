use crate::*;
use frame_support::decl_error;

decl_error! {
    /// Content directory errors
    pub enum Error for Module<T: Trait> {
        /// Auction does not exist
        AuctionDoesNotExist,
        /// Vnft auction for given video_id have been started already
        AuctionAlreadyStarted,
        /// VNFT does not exist
        VNFTDoesNotExist,
        /// Overflow or underflow error happened
        OverflowOrUnderflowHappened,
        /// Actor origin authorization error happened
        ActorOriginAuthError,
        /// Actor not authorized to issue nft
        ActorNotAuthorizedToIssueNft,
        /// Given origin does not own vnft
        DoesNotOwnVNFT,
        /// Royalty Upper Bound Exceeded
        RoyaltyUpperBoundExceeded,
        /// Royalty Lower Bound Exceeded
        RoyaltyLowerBoundExceeded,
        /// Round time upper bound exceeded
        RoundTimeUpperBoundExceeded,
        /// Round time lower bound exceeded
        RoundTimeLowerBoundExceeded,
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
        /// Invalid bid
        InvalidBid,
    }
}
