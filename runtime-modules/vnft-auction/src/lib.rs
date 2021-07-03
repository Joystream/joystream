// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![recursion_limit = "256"]

mod errors;
mod functions;
mod types;
pub use common::{origin::ActorOriginValidator, MembershipTypes};
pub use content::{ContentActor, ContentActorAuthenticator};
use errors::*;
use frame_support::{
    decl_event, decl_module, decl_storage,
    dispatch::{DispatchError, DispatchResult},
    ensure,
    traits::Get,
    Parameter,
};
pub use frame_system::ensure_signed;
pub use functions::*;
#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};
use sp_arithmetic::traits::{BaseArithmetic, One, Zero};
use sp_runtime::traits::{MaybeSerializeDeserialize, Member};
use types::*;

use codec::Codec;
pub use codec::{Decode, Encode};
use frame_support::traits::{Currency, ReservableCurrency};
pub use sp_runtime::Perbill;

pub trait NumericIdentifier:
    Parameter
    + Member
    + BaseArithmetic
    + Codec
    + Default
    + Copy
    + Clone
    + MaybeSerializeDeserialize
    + Eq
    + PartialEq
    + Ord
    + Zero
{
}

impl NumericIdentifier for u64 {}

type VideoId<T> = <T as content::Trait>::VideoId;

pub trait Trait:
    timestamp::Trait + content::Trait + content::ContentActorAuthenticator + MembershipTypes
{
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    // NFT provider pallet
    type VNFTId: NumericIdentifier;

    // Payment provider
    type NftCurrencyProvider: Currency<Self::AccountId> + ReservableCurrency<Self::AccountId>;

    // Member origin validator
    type MemberOriginValidator: ActorOriginValidator<Self::Origin, MemberId<Self>, Self::AccountId>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Content {

        /// Map, representing  VideoId -> VNFTId relation
        pub VNFTIdByVideo get(fn vnft_id_by_video_id): map hasher(blake2_128_concat) VideoId<T> => T::VNFTId;

        /// Map, representing  VNFTId -> VNFT relation
        pub VNFTById get(fn vnft_by_vnft_id): map hasher(blake2_128_concat) T::VNFTId => VNFT<T::AccountId>;

        /// Map, representing VideoId -> Auction relation
        pub AuctionByVideoId get (fn auction_by_video_id): map hasher(blake2_128_concat) VideoId<T> => Auction<T>;

        /// Next vNFT id
        pub NextVNFTId get(fn next_video_nft_id) config(): T::VNFTId;

        /// Min auction round time
        pub MinRoundTime get(fn min_round_time) config(): T::Moment;

        /// Max auction round time
        pub MaxRoundTime get(fn max_round_time) config(): T::Moment;

        /// Min auction staring price
        pub MinStartingPrice get(fn min_starting_price) config(): BalanceOf<T>;

        /// Max auction staring price
        pub MaxStartingPrice get(fn max_starting_price) config(): BalanceOf<T>;

        /// Min creator royalty
        pub MinCreatorRoyalty get(fn min_creator_royalty) config(): Perbill;

        /// Max creator royalty
        pub MaxCreatorRoyalty get(fn max_creator_royalty) config(): Perbill;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Initializing events
        fn deposit_event() = default;

        /// Start video auction
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn start_video_auction(
            origin,
            auctioneer: ContentActor<CuratorGroupId<T>, CuratorId<T>, MemberId<T>>,
            auction_params: AuctionParams<T::VNFTId, VideoId<T>, <T as timestamp::Trait>::Moment, BalanceOf<T>>,
        ) {

            let auctioneer_account_id = Self::authorize_auctioneer(origin, &auctioneer, &auction_params)?;

            // Validate round_time & starting_price
            Self::validate_auction_params(&auction_params)?;

            //
            // == MUTATION SAFE ==
            //

            let video_id = auction_params.video_id;

            // Try complete auction
            if Self::is_auction_exist(video_id) {

                let auction = Self::auction_by_video_id(video_id);

                // Try finalize already completed auction (issues new nft if required)
                ensure!(Self::try_complete_auction(auction, video_id), Error::<T>::AuctionAlreadyStarted);
                return Ok(())
            }

            let auction = AuctionRecord::new::<T::VideoId>(auctioneer, auctioneer_account_id, auction_params.clone());

            <AuctionByVideoId<T>>::insert(video_id, auction);

            // Trigger event
            Self::deposit_event(RawEvent::AuctionStarted(auctioneer, auction_params));
        }
    }
}

decl_event!(
    pub enum Event<T>
    where
        VideoId = <T as content::Trait>::VideoId,
        VNFTId = <T as Trait>::VNFTId,
        ContentActor = ContentActor<CuratorGroupId<T>, CuratorId<T>, MemberId<T>>,
        AuctionParams = AuctionParams<
            <T as Trait>::VNFTId,
            VideoId<T>,
            <T as timestamp::Trait>::Moment,
            BalanceOf<T>,
        >,
        Auction = AuctionRecord<
            <T as frame_system::Trait>::AccountId,
            <T as Trait>::VNFTId,
            <T as timestamp::Trait>::Moment,
            CuratorGroupId<T>,
            CuratorId<T>,
            MemberId<T>,
            BalanceOf<T>,
        >,
    {
        // Curators
        AuctionStarted(ContentActor, AuctionParams),
        NftIssued(VideoId, VNFTId, Auction),
    }
);
