// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![recursion_limit = "256"]
// Internal Substrate warning (decl_event).
#![allow(clippy::unused_unit, clippy::all)]

#[cfg(test)]
mod tests;

mod errors;
mod nft;
mod permissions;
mod types;

pub use errors::*;
pub use nft::*;
pub use permissions::*;
pub use types::*;

use core::hash::Hash;

use codec::Codec;
use codec::{Decode, Encode};

pub use storage::{
    BagIdType, DataObjectCreationParameters, DataObjectStorage, DynamicBagIdType, UploadParameters,
    UploadParametersRecord,
};

use frame_support::{
    decl_event, decl_module, decl_storage, dispatch::DispatchResult, ensure, traits::Get, Parameter,
};
use frame_system::ensure_signed;
#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};
use sp_arithmetic::traits::{BaseArithmetic, One, Zero};
use sp_runtime::traits::{MaybeSerializeDeserialize, Member};
pub use sp_runtime::Perbill;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::vec::Vec;

pub use common::{
    currency::{BalanceOf, GovernanceCurrency},
    working_group::WorkingGroup,
    AssetUrls, MembershipTypes, StorageOwnership,
};
use frame_support::traits::{Currency, ReservableCurrency};

type Storage<T> = storage::Module<T>;

/// Type, used in diffrent numeric constraints representations
pub type MaxNumber = u32;

/// A numeric identifier trait
pub trait NumericIdentifier:
    Parameter
    + Member
    + BaseArithmetic
    + Codec
    + Default
    + Copy
    + Clone
    + Hash
    + MaybeSerializeDeserialize
    + Eq
    + PartialEq
    + Ord
    + Zero
{
}

impl NumericIdentifier for u64 {}

/// Module configuration trait for Content Directory Module
pub trait Trait:
    membership::Trait + ContentActorAuthenticator + Clone + GovernanceCurrency + storage::Trait
{
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    /// Channel Transfer Payments Escrow Account seed for ModuleId to compute deterministic AccountId
    type ChannelOwnershipPaymentEscrowId: Get<[u8; 8]>;

    /// Type of identifier for Videos
    type VideoId: NumericIdentifier;

    /// Type of identifier for Video Categories
    type VideoCategoryId: NumericIdentifier;

    /// Type of identifier for Channel Categories
    type ChannelCategoryId: NumericIdentifier;

    /// Type of identifier for Playlists
    type PlaylistId: NumericIdentifier;

    /// Type of identifier for Persons
    type PersonId: NumericIdentifier;

    /// Type of identifier for Channels
    type SeriesId: NumericIdentifier;

    /// Type of identifier for Channel transfer requests
    type ChannelOwnershipTransferRequestId: NumericIdentifier;

    /// The maximum number of curators per group constraint
    type MaxNumberOfCuratorsPerGroup: Get<MaxNumber>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Content {
        pub ChannelById get(fn channel_by_id): map hasher(blake2_128_concat) T::ChannelId => Channel<T>;

        pub ChannelCategoryById get(fn channel_category_by_id): map hasher(blake2_128_concat) T::ChannelCategoryId => ChannelCategory;

        pub VideoById get(fn video_by_id): map hasher(blake2_128_concat) T::VideoId => Video<T>;

        pub VideoCategoryById get(fn video_category_by_id): map hasher(blake2_128_concat) T::VideoCategoryId => VideoCategory;

        pub PlaylistById get(fn playlist_by_id): map hasher(blake2_128_concat) T::PlaylistId => Playlist<T::ChannelId>;

        pub SeriesById get(fn series_by_id): map hasher(blake2_128_concat) T::SeriesId => Series<T::ChannelId, T::VideoId>;

        pub PersonById get(fn person_by_id): map hasher(blake2_128_concat) T::PersonId => Person<T::MemberId>;

        pub ChannelOwnershipTransferRequestById get(fn channel_ownership_transfer_request_by_id):
            map hasher(blake2_128_concat) T::ChannelOwnershipTransferRequestId => ChannelOwnershipTransferRequest<T>;

        pub NextChannelCategoryId get(fn next_channel_category_id) config(): T::ChannelCategoryId;

        pub NextChannelId get(fn next_channel_id) config(): T::ChannelId;

        pub NextVideoCategoryId get(fn next_video_category_id) config(): T::VideoCategoryId;

        pub NextVideoId get(fn next_video_id) config(): T::VideoId;

        pub NextPlaylistId get(fn next_playlist_id) config(): T::PlaylistId;

        pub NextPersonId get(fn next_person_id) config(): T::PersonId;

        pub NextSeriesId get(fn next_series_id) config(): T::SeriesId;

        pub NextChannelOwnershipTransferRequestId get(fn next_channel_transfer_request_id) config(): T::ChannelOwnershipTransferRequestId;

        pub NextCuratorGroupId get(fn next_curator_group_id) config(): T::CuratorGroupId;

        /// Map, representing  CuratorGroupId -> CuratorGroup relation
        pub CuratorGroupById get(fn curator_group_by_id): map hasher(blake2_128_concat) T::CuratorGroupId => CuratorGroup<T>;

        /// Min auction duration
        pub MinAuctionDuration get(fn min_auction_duration) config(): T::BlockNumber;

        /// Max auction duration
        pub MaxAuctionDuration get(fn max_auction_duration) config(): T::BlockNumber;

        /// Min auction extension period
        pub MinAuctionExtensionPeriod get(fn min_auction_extension_period) config(): T::BlockNumber;

        /// Max auction extension period
        pub MaxAuctionExtensionPeriod get(fn max_auction_extension_period) config(): T::BlockNumber;

        /// Min bid lock duration
        pub MinBidLockDuration get(fn min_bid_lock_duration) config(): T::BlockNumber;

        /// Max bid lock duration
        pub MaxBidLockDuration get(fn max_bid_lock_duration) config(): T::BlockNumber;

        /// Min auction staring price
        pub MinStartingPrice get(fn min_starting_price) config(): BalanceOf<T>;

        /// Max auction staring price
        pub MaxStartingPrice get(fn max_starting_price) config(): BalanceOf<T>;

        /// Min creator royalty percentage
        pub MinCreatorRoyalty get(fn min_creator_royalty) config(): Perbill;

        /// Max creator royalty percentage
        pub MaxCreatorRoyalty get(fn max_creator_royalty) config(): Perbill;

        /// Min auction bid step
        pub MinBidStep get(fn min_bid_step) config(): BalanceOf<T>;

        /// Max auction bid step
        pub MaxBidStep get(fn max_bid_step) config(): BalanceOf<T>;

        /// Platform fee percentage
        pub PlatfromFeePercentage get(fn platform_fee_percentage) config(): Perbill;

        /// Max delta between current block and starts at
        pub AuctionStartsAtMaxDelta get(fn auction_starts_at_max_delta) config(): T::BlockNumber;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Initializing events
        fn deposit_event() = default;

        /// Exports const -  max number of curators per group
        const MaxNumberOfCuratorsPerGroup: MaxNumber = T::MaxNumberOfCuratorsPerGroup::get();

        // ======
        // Next set of extrinsics can only be invoked by lead.
        // ======

        /// Add new curator group to runtime storage
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_curator_group(
            origin,
        ) {

            // Ensure given origin is lead
            ensure_is_lead::<T>(origin)?;

            //
            // == MUTATION SAFE ==
            //

            let curator_group_id = Self::next_curator_group_id();

            // Insert empty curator group with `active` parameter set to false
            <CuratorGroupById<T>>::insert(curator_group_id, CuratorGroup::<T>::default());

            // Increment the next curator curator_group_id:
            <NextCuratorGroupId<T>>::mutate(|n| *n += T::CuratorGroupId::one());

            // Trigger event
            Self::deposit_event(RawEvent::CuratorGroupCreated(curator_group_id));
        }

        /// Set `is_active` status for curator group under given `curator_group_id`
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_curator_group_status(
            origin,
            curator_group_id: T::CuratorGroupId,
            is_active: bool,
        ) {

            // Ensure given origin is lead
            ensure_is_lead::<T>(origin)?;

            // Ensure curator group under provided curator_group_id already exist
            Self::ensure_curator_group_under_given_id_exists(&curator_group_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Set `is_active` status for curator group under given `curator_group_id`
            <CuratorGroupById<T>>::mutate(curator_group_id, |curator_group| {
                curator_group.set_status(is_active)
            });

            // Trigger event
            Self::deposit_event(RawEvent::CuratorGroupStatusSet(curator_group_id, is_active));
        }

        /// Add curator to curator group under given `curator_group_id`
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn add_curator_to_group(
            origin,
            curator_group_id: T::CuratorGroupId,
            curator_id: T::CuratorId,
        ) {

            // Ensure given origin is lead
            ensure_is_lead::<T>(origin)?;

            // Ensure curator group under provided curator_group_id already exist, retrieve corresponding one
            let curator_group = Self::ensure_curator_group_exists(&curator_group_id)?;

            // Ensure that curator_id is infact a worker in content working group
            ensure_is_valid_curator_id::<T>(&curator_id)?;

            // Ensure max number of curators per group limit not reached yet
            curator_group.ensure_max_number_of_curators_limit_not_reached()?;

            // Ensure curator under provided curator_id isn`t a CuratorGroup member yet
            curator_group.ensure_curator_in_group_does_not_exist(&curator_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Insert curator_id into curator_group under given curator_group_id
            <CuratorGroupById<T>>::mutate(curator_group_id, |curator_group| {
                curator_group.get_curators_mut().insert(curator_id);
            });

            // Trigger event
            Self::deposit_event(RawEvent::CuratorAdded(curator_group_id, curator_id));
        }

        /// Remove curator from a given curator group
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn remove_curator_from_group(
            origin,
            curator_group_id: T::CuratorGroupId,
            curator_id: T::CuratorId,
        ) {

            // Ensure given origin is lead
            ensure_is_lead::<T>(origin)?;

            // Ensure curator group under provided curator_group_id already exist, retrieve corresponding one
            let curator_group = Self::ensure_curator_group_exists(&curator_group_id)?;

            // Ensure curator under provided curator_id is CuratorGroup member
            curator_group.ensure_curator_in_group_exists(&curator_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Remove curator_id from curator_group under given curator_group_id
            <CuratorGroupById<T>>::mutate(curator_group_id, |curator_group| {
                curator_group.get_curators_mut().remove(&curator_id);
            });

            // Trigger event
            Self::deposit_event(RawEvent::CuratorRemoved(curator_group_id, curator_id));
        }

        // TODO: Add Option<reward_account> to ChannelCreationParameters ?
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_channel(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            params: ChannelCreationParameters<T>,
        ) {
            ensure_actor_authorized_to_create_channel::<T>(
                origin.clone(),
                &actor,
            )?;

            // channel creator account
            let sender = ensure_signed(origin)?;

            // The channel owner will be..
            let channel_owner = Self::actor_to_channel_owner(&actor)?;


            // next channel id
            let channel_id = NextChannelId::<T>::get();

            // get uploading parameters if assets have to be saved on storage
            let maybe_upload_parameters = Self::pick_upload_parameters_from_assets(
                &params.assets,
                &channel_id,
                &sender,
            );

            // number of assets succesfully uploaded
            let num_assets = maybe_upload_parameters
                .map_or(Ok(0u64), |upload_parameters| {
                Storage::<T>::upload_data_objects(upload_parameters.clone())
                    .map(|_| {
                        upload_parameters
                        .object_creation_list
                        .len() as u64
                })
            })?;

            //
            // == MUTATION SAFE ==
            //

            // Only increment next channel id if adding content was successful
            NextChannelId::<T>::mutate(|id| *id += T::ChannelId::one());

            // channel creation
            let channel: Channel<T> = ChannelRecord {
                owner: channel_owner,
                // a newly create channel has zero videos ??
                num_videos: 0u64,
                is_censored: false,
                reward_account: params.reward_account.clone(),
                // number of assets uploaded
                num_assets,
                // setting the channel owner account as the prize funds account
                deletion_prize_source_account_id: sender,
            };

            // add channel to onchain state
            ChannelById::<T>::insert(channel_id, channel.clone());

            Self::deposit_event(RawEvent::ChannelCreated(actor, channel_id, channel, params));
        }

        // Include Option<AccountId> in ChannelUpdateParameters to update reward_account
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_channel(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            params: ChannelUpdateParameters<T>,
        ) {
            let sender = ensure_signed(origin.clone())?;

            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            ensure_actor_authorized_to_update_channel::<T>(
                origin,
                &actor,
                &channel.owner,
            )?;

            let maybe_upload_parameters = params.assets.clone()
                .and_then(|assets| {Self::pick_upload_parameters_from_assets(
                   &assets,
                    &channel_id,
            &sender,
            )});

            // number of assets succesfully uploaded
            let maybe_num_assets = maybe_upload_parameters.as_ref()
                    .map_or(
                        Ok(Some(0u64)),
                        |upload_parameters| {
                        Storage::<T>::upload_data_objects(upload_parameters.clone())
                     .map(|_| {
                        Some(upload_parameters.object_creation_list.len() as u64)
             })
            })?;
            //
            // == MUTATION SAFE ==
            //

            let mut channel = channel;

            // Maybe update the reward account
            if let Some(reward_account) = &params.reward_account {
                channel.reward_account = reward_account.clone();
            }

            // Maybe update asset num
            if let Some(num_assets) = maybe_num_assets {
                channel.num_assets = channel.num_assets.saturating_add(num_assets);
            }

            // Update the channel
            ChannelById::<T>::insert(channel_id, channel.clone());

            Self::deposit_event(RawEvent::ChannelUpdated(actor, channel_id, channel, params));
        }

            // extrinsics for channel deletion
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_channel(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
        ) -> DispatchResult {
            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            // ensure permissions
            ensure_actor_authorized_to_update_channel::<T>(
                origin,
                &actor,
                &channel.owner,
            )?;

            // check that channel assets are 0
            ensure!(channel.num_assets == 0, Error::<T>::ChannelContainsAssets);

            // check that channel videos are 0
            ensure!(channel.num_videos == 0, Error::<T>::ChannelContainsVideos);

            // delete channel dynamic bag
            let dyn_bag = DynamicBagIdType::<T::MemberId, T::ChannelId>::Channel(channel_id);
            Storage::<T>::delete_dynamic_bag(
                channel.deletion_prize_source_account_id,
                dyn_bag
            )?;

            // remove channel from on chain state
            ChannelById::<T>::remove(channel_id);

            // deposit event
            Self::deposit_event(RawEvent::ChannelDeleted(actor, channel_id));

            Ok(())
        }

        /// Remove assets of a channel from storage
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn remove_channel_assets(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            assets: BTreeSet<<T as storage::Trait>::DataObjectId>,
        ) {
            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            ensure_actor_authorized_to_update_channel::<T>(
                origin,
                &actor,
                &channel.owner,
            )?;

            // ensure that the provided assets are not empty
            ensure!(!assets.is_empty(), Error::<T>::NoAssetsSpecified);

            let num_assets_to_remove = assets.len() as u64;

            // cannot remove more asset than those already present
            ensure!(
                num_assets_to_remove <= channel.num_assets,
                Error::<T>::InvalidAssetsProvided
            );

            // remove assets from storage
            Storage::<T>::delete_data_objects(
                channel.deletion_prize_source_account_id.clone(),
                Self::bag_id_for_channel(&channel_id),
                assets.clone(),
            )?;

            //
            // == MUTATION SAFE ==
            //

            // update onchain channel status
            let mut channel = channel;
            channel.num_assets = channel.num_assets.saturating_sub(num_assets_to_remove);
            ChannelById::<T>::insert(channel_id, channel.clone());


            Self::deposit_event(RawEvent::ChannelAssetsRemoved(actor, channel_id, assets, channel));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_channel_censorship_status(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            is_censored: bool,
            rationale: Vec<u8>,
        ) {
            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            ensure_actor_authorized_to_censor::<T>(
                origin,
                &actor,
                &channel.owner,
            )?;

            // Ensure censorship status have been changed
            channel.ensure_censorship_status_changed::<T>(is_censored)?;

            //
            // == MUTATION SAFE ==
            //

            ChannelById::<T>::mutate(channel_id, |channel| {
                channel.is_censored = is_censored
            });

            // TODO: unset the reward account ? so no revenue can be earned for censored channels?

            Self::deposit_event(RawEvent::ChannelCensorshipStatusUpdated(actor, channel_id, is_censored, rationale));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_channel_category(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            params: ChannelCategoryCreationParameters,
        ) {
            ensure_actor_authorized_to_manage_categories::<T>(
                origin,
                &actor
            )?;

            //
            // == MUTATION SAFE ==
            //

            let category_id = Self::next_channel_category_id();
            NextChannelCategoryId::<T>::mutate(|id| *id += T::ChannelCategoryId::one());

            let category = ChannelCategory {};
            ChannelCategoryById::<T>::insert(category_id, category.clone());

            Self::deposit_event(RawEvent::ChannelCategoryCreated(category_id, category, params));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_channel_category(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            category_id: T::ChannelCategoryId,
            params: ChannelCategoryUpdateParameters,
        ) {
            ensure_actor_authorized_to_manage_categories::<T>(
                origin,
                &actor
            )?;

            Self::ensure_channel_category_exists(&category_id)?;

            Self::deposit_event(RawEvent::ChannelCategoryUpdated(actor, category_id, params));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_channel_category(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            category_id: T::ChannelCategoryId,
        ) {
            ensure_actor_authorized_to_manage_categories::<T>(
                origin,
                &actor
            )?;

            Self::ensure_channel_category_exists(&category_id)?;

            ChannelCategoryById::<T>::remove(&category_id);

            Self::deposit_event(RawEvent::ChannelCategoryDeleted(actor, category_id));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn request_channel_transfer(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _request: ChannelOwnershipTransferRequest<T>,
        ) {
            // requester must be new_owner
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn cancel_channel_transfer_request(
            _origin,
            _request_id: T::ChannelOwnershipTransferRequestId,
        ) {
            // origin must be original requester (ie. proposed new channel owner)
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn accept_channel_transfer(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _request_id: T::ChannelOwnershipTransferRequestId,
        ) {
            // only current owner of channel can approve
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_video(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            params: VideoCreationParameters<T>,
        ) {

            let sender = ensure_signed(origin.clone())?;

            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            ensure_actor_authorized_to_update_channel::<T>(
                origin,
                &actor,
                &channel.owner,
            )?;

            // next video id
            let video_id = NextVideoId::<T>::get();

            // adding the content to storage node if uploading is needed
            let maybe_upload_parameters = Self::pick_upload_parameters_from_assets(
                &params.assets,
                &channel_id,
        &sender,
            );

            // if storaged uploading is required save t he object id for the video
            let maybe_data_objects_ids = maybe_upload_parameters
                .map_or(
                    Ok(None),
                    |upload_parameters| {
                     // beginning object id
                        let beg = Storage::<T>::next_data_object_id();

                        // upload objects and return their indexes
                        Storage::<T>::upload_data_objects(upload_parameters)
                        .map(|_| Storage::<T>::next_data_object_id()) // ending index
                        .map(|end| Some((beg..end).collect::<BTreeSet<_>>())) // create collection
                })?;

            //
            // == MUTATION SAFE ==
            //

            // create the video struct
            let video: Video<T> = VideoRecord {
                in_channel: channel_id,
                // keep track of which season the video is in if it is an 'episode'
                // - prevent removing a video if it is in a season (because order is important)
                in_series: None,
                /// Whether the curators have censored the video or not.
                is_censored: false,
                /// Newly created video has no nft
                nft_status: None,
                /// storage parameters for later storage deletion
                maybe_data_objects_id_set: maybe_data_objects_ids,
            };

            // add it to the onchain state
            VideoById::<T>::insert(video_id, video);

            // Only increment next video id if adding content was successful
            NextVideoId::<T>::mutate(|id| *id += T::VideoId::one());

            // Add recently added video id to the channel
            ChannelById::<T>::mutate(channel_id, |channel| {
                channel.num_videos = channel.num_videos.saturating_add(1);
            });

            Self::deposit_event(RawEvent::VideoCreated(actor, channel_id, video_id, params));

        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_video(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            params: VideoUpdateParameters<T>,
        ) {
            let sender = ensure_signed(origin.clone())?;

            // check that video exists, retrieve corresponding channel id.
            let channel_id = Self::ensure_video_exists(&video_id)?.in_channel;

            ensure_actor_authorized_to_update_channel::<T>(
                origin,
                &actor,
                &Self::channel_by_id(channel_id).owner,
            )?;

            // Pick the assets to be uploaded to storage frame_system out
            if let Some(assets) = &params.assets {
                // adding content to storage if needed
               let maybe_upload_parameters = Self::pick_upload_parameters_from_assets(
                   assets,
                   &channel_id,
                   &sender,
               );

              if let Some(upload_parameters) = maybe_upload_parameters{
                 Storage::<T>::upload_data_objects(upload_parameters)?;
              }
            }

            //
            // == MUTATION SAFE ==
            //

            // increase the number of video the selected channel by 1
            ChannelById::<T>::mutate(channel_id, |channel| {
                channel.num_videos = channel.num_videos.saturating_add(1);
            });

            Self::deposit_event(RawEvent::VideoUpdated(actor, video_id, params));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_video(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
        ) {

            // check that video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // get information regarding channel
            let channel_id = video.in_channel;
            let channel = ChannelById::<T>::get(channel_id);


            ensure_actor_authorized_to_update_channel::<T>(
                origin,
                &actor,
                // The channel owner will be..
                &channel.owner,
            )?;

            Self::ensure_video_can_be_removed(&video)?;

            // Ensure nft for this video have not been issued
            video.ensure_nft_is_not_issued::<T>()?;

            // If video is on storage, remove it
            if let Some(data_objects_id_set) = video.maybe_data_objects_id_set {
                Storage::<T>::delete_data_objects(
                    channel.deletion_prize_source_account_id,
                    Self::bag_id_for_channel(&channel_id),
                    data_objects_id_set,
                )?;
            }

            //
            // == MUTATION SAFE ==
            //

            // Remove video
            VideoById::<T>::remove(video_id);

            // Decrease video count for the channel
            ChannelById::<T>::mutate(channel_id, |channel| {
                channel.num_videos = channel.num_videos.saturating_sub(1)
            });

            Self::deposit_event(RawEvent::VideoDeleted(actor, video_id));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_playlist(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _channel_id: T::ChannelId,
            _params: PlaylistCreationParameters,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_playlist(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _playlist: T::PlaylistId,
            _params: PlaylistUpdateParameters,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_playlist(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _channel_id: T::ChannelId,
            _playlist: T::PlaylistId,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_featured_videos(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            list: Vec<T::VideoId>
        ) {
            // can only be set by lead
            ensure_actor_authorized_to_set_featured_videos::<T>(
                origin,
                &actor,
            )?;

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(RawEvent::FeaturedVideosSet(actor, list));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_video_category(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            params: VideoCategoryCreationParameters,
        ) {
            ensure_actor_authorized_to_manage_categories::<T>(
                origin,
                &actor
            )?;

            //
            // == MUTATION SAFE ==
            //

            let category_id = Self::next_video_category_id();
            NextVideoCategoryId::<T>::mutate(|id| *id += T::VideoCategoryId::one());

            let category = VideoCategory {};
            VideoCategoryById::<T>::insert(category_id, category);

            Self::deposit_event(RawEvent::VideoCategoryCreated(actor, category_id, params));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_video_category(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            category_id: T::VideoCategoryId,
            params: VideoCategoryUpdateParameters,
        ) {
            ensure_actor_authorized_to_manage_categories::<T>(
                origin,
                &actor
            )?;

            Self::ensure_video_category_exists(&category_id)?;

            Self::deposit_event(RawEvent::VideoCategoryUpdated(actor, category_id, params));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_video_category(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            category_id: T::VideoCategoryId,
        ) {
            ensure_actor_authorized_to_manage_categories::<T>(
                origin,
                &actor
            )?;

            Self::ensure_video_category_exists(&category_id)?;

            VideoCategoryById::<T>::remove(&category_id);

            Self::deposit_event(RawEvent::VideoCategoryDeleted(actor, category_id));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_person(
            _origin,
            _actor: PersonActor<T::MemberId, T::CuratorId>,
            _params: PersonCreationParameters<NewAssets<T>>,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_person(
            _origin,
            _actor: PersonActor<T::MemberId, T::CuratorId>,
            _person: T::PersonId,
            _params: PersonUpdateParameters<NewAssets<T>>,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_person(
            _origin,
            _actor: PersonActor<T::MemberId, T::CuratorId>,
            _person: T::PersonId,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn add_person_to_video(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _video_id: T::VideoId,
            _person: T::PersonId
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn remove_person_from_video(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _video_id: T::VideoId
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_video_censorship_status(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            is_censored: bool,
            rationale: Vec<u8>,
        ) {
            // check that video exists
            let video = Self::ensure_video_exists(&video_id)?;

            ensure_actor_authorized_to_censor::<T>(
                origin,
                &actor,
                // The channel owner will be..
                &Self::channel_by_id(video.in_channel).owner,
            )?;

            // Ensure censorship status have been changed
            video.ensure_censorship_status_changed::<T>(is_censored)?;

            //
            // == MUTATION SAFE ==
            //

            // update
            VideoById::<T>::mutate(video_id, |video| {
                video.is_censored = is_censored;
            });

            Self::deposit_event(RawEvent::VideoCensorshipStatusUpdated(actor, video_id, is_censored, rationale));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_series(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _channel_id: T::ChannelId,
            _params: SeriesParameters<T::VideoId, NewAssets<T>>
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_series(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _channel_id: T::ChannelId,
            _params: SeriesParameters<T::VideoId, NewAssets<T>>
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_series(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _series: T::SeriesId,
        ) {
            Self::not_implemented()?;
        }

        /// Issue NFT
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn issue_nft(
            origin,
            actor: ContentActor<CuratorGroupId<T>, CuratorId<T>, MemberId<T>>,
            video_id: T::VideoId,
            royalty: Option<Royalty>,
            metadata: Metadata,
            to: Option<T::MemberId>,
        ) {

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure have not been issued yet
            video.ensure_nft_is_not_issued::<T>()?;

            let channel_id = video.in_channel;

            // Ensure channel exists, retrieve channel owner
            let channel_owner = Self::ensure_channel_exists(&channel_id)?.owner;

            ensure_actor_authorized_to_update_channel::<T>(origin, &actor, &channel_owner)?;

            // The content owner will be..
            let nft_owner = if let Some(to) = to {
                NFTOwner::Member(to)
            } else {
                // if `to` set to None, actor issues to ChannelOwner
                NFTOwner::ChannelOwner
            };

            // Enure royalty bounds satisfied, if provided
            if let Some(royalty) = royalty {
                Self::ensure_royalty_bounds_satisfied(royalty)?;
            }

            //
            // == MUTATION SAFE ==
            //

            // Issue NFT
            let video = video.set_nft_status(OwnedNFT::new(nft_owner, royalty));

            // Update the video
            VideoById::<T>::insert(video_id, video);

            Self::deposit_event(RawEvent::NftIssued(
                actor,
                video_id,
                royalty,
                metadata,
                to,
            ));
        }

        /// Start video nft auction
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn start_nft_auction(
            origin,
            owner_id: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            auction_params: AuctionParams<T::VideoId, T::BlockNumber, BalanceOf<T>, T::MemberId>,
        ) {
            let video_id = auction_params.video_id;

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(origin, &owner_id, &nft.owner, video.in_channel)?;

            // Ensure there nft transactional status is set to idle.
            nft.ensure_nft_transactional_status_is_idle::<T>()?;

            // Validate round_duration & starting_price
            Self::validate_auction_params(&auction_params)?;

            //
            // == MUTATION SAFE ==
            //

            // Create new auction
            let mut auction = AuctionRecord::new(auction_params.clone());

            // If starts_at is not set, set it to now
            if auction_params.starts_at.is_none() {
                auction.starts_at = <frame_system::Module<T>>::block_number();
            }

            let nft = nft.set_auction_transactional_status(auction);
            let video = video.set_nft_status(nft);

            // Update the video
            VideoById::<T>::insert(video_id, video);

            // Trigger event
            Self::deposit_event(RawEvent::AuctionStarted(owner_id, auction_params));
        }

        /// Cancel video nft transaction
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn cancel_nft_transaction(
            origin,
            owner_id: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
        ) {

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(origin, &owner_id, &nft.owner, video.in_channel)?;

            // Ensure nft transaction can be canceled
            nft.ensure_transaction_can_be_canceled::<T>()?;

            //
            // == MUTATION SAFE ==
            //

            // Cancel transaction
            let nft = Self::cancel_transaction(nft);
            let video = video.set_nft_status(nft);

            VideoById::<T>::insert(video_id, video);

            // Trigger event
            Self::deposit_event(RawEvent::TransactionCanceled(video_id, owner_id));
        }

        /// Make auction bid
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn make_bid(
            origin,
            participant_id: T::MemberId,
            video_id: T::VideoId,
            bid: BalanceOf<T>,
            metadata: Metadata,
        ) {

            // Authorize participant under given member id
            let participant_account_id = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&participant_id, &participant_account_id)?;

            // Ensure bidder have sufficient balance amount to reserve for bid
            Self::ensure_has_sufficient_balance(&participant_account_id, bid)?;

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Ensure auction for given video id exists
            let auction = nft.ensure_auction_state::<T>()?;

            let current_block = <frame_system::Module<T>>::block_number();

            // Ensure nft auction not expired
            auction.ensure_nft_auction_not_expired::<T>(current_block)?;

            // Ensure auction have been already started
            auction.ensure_auction_started::<T>(current_block)?;

            // Ensure participant have been already added to whitelist if set
            auction.ensure_whitelisted_participant::<T>(participant_id)?;

            // Ensure new bid is greater then last bid + minimal bid step
            auction.ensure_is_valid_bid::<T>(bid)?;

            // Used only for immediate auction completion
            let funds_destination_account_id = Self::ensure_owner_account_id(&video, &nft).ok();

            //
            // == MUTATION SAFE ==
            //

            // Unreserve previous bidder balance
            if let Some(last_bid) = &auction.last_bid {
                T::Currency::unreserve(&last_bid.bidder_account_id, last_bid.amount);
            }

            match auction.buy_now_price {
                Some(buy_now_price) if bid >= buy_now_price => {
                    // Do not charge more then buy now
                    let (_, bid) = auction.make_bid(participant_id, participant_account_id, buy_now_price, current_block);

                    let nft = Self::complete_auction(video.in_channel, nft, bid, funds_destination_account_id);
                    let video = video.set_nft_status(nft);

                    // Update the video
                    VideoById::<T>::insert(video_id, video);

                    // Trigger event
                    Self::deposit_event(RawEvent::BidMadeCompletingAuction(participant_id, video_id, metadata));
                }
                _ => {
                    // Make auction bid & update auction data

                    // Reseve balance for current bid
                    // Can not fail, needed check made
                    T::Currency::reserve(&participant_account_id, bid)?;

                    let (auction, _) = auction.make_bid(participant_id, participant_account_id, bid, current_block);
                    let nft = nft.set_auction_transactional_status(auction);
                    let video = video.set_nft_status(nft);

                    VideoById::<T>::insert(video_id, video);

                    // Trigger event
                    Self::deposit_event(RawEvent::AuctionBidMade(participant_id, video_id, bid, metadata));
                }
            }
        }

        /// Cancel open auction bid
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn cancel_open_auction_bid(
            origin,
            participant_id: T::MemberId,
            video_id: T::VideoId,
        ) {

            // Authorize participant under given member id
            let participant_account_id = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&participant_id, &participant_account_id)?;

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Ensure auction for given video id exists
            let auction = nft.ensure_auction_state::<T>()?;

            let current_block = <frame_system::Module<T>>::block_number();

            // Ensure participant can cancel last bid
            auction.ensure_bid_can_be_canceled::<T>(participant_id, current_block)?;

            //
            // == MUTATION SAFE ==
            //

            // Cancel last auction bid & update auction data
            let auction = auction.cancel_bid();
            let nft = nft.set_auction_transactional_status(auction);
            let video = video.set_nft_status(nft);

            VideoById::<T>::insert(video_id, video);

            // Trigger event
            Self::deposit_event(RawEvent::AuctionBidCanceled(participant_id, video_id));
        }

        /// Complete auction
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn complete_nft_auction(
            origin,
            member_id: T::MemberId,
            video_id: T::VideoId,
            metadata: Metadata,
        ) {

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Ensure auction for given video id exists, retrieve corresponding one
            let auction = nft.ensure_auction_state::<T>()?;

            let bid = auction.ensure_last_bid_exists::<T>()?;

            // Ensure actor authorized to complete auction.
            Self::ensure_member_is_last_bidder(origin, member_id, &auction)?;

            // Ensure auction can be completed
            Self::ensure_auction_can_be_completed(&auction)?;

            let owner_account_id = Self::ensure_owner_account_id(&video, &nft).ok();

            //
            // == MUTATION SAFE ==
            //

            let nft = Self::complete_auction(video.in_channel, nft, bid, owner_account_id);
            let video = video.set_nft_status(nft);

            // Update the video
            VideoById::<T>::insert(video_id, video);

            // Trigger event
            Self::deposit_event(RawEvent::AuctionCompleted(member_id, video_id, metadata));
        }

        /// Accept open auction bid
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn settle_open_auction(
            origin,
            owner_id: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            metadata: Metadata,
        ) {

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Ensure actor is authorized to accept open auction bid
            ensure_actor_authorized_to_manage_nft::<T>(origin, &owner_id, &nft.owner, video.in_channel)?;

            // Ensure auction for given video id exists, retrieve corresponding one
            let auction = nft.ensure_auction_state::<T>()?;

            // Ensure open type auction
            auction.ensure_is_open_auction::<T>()?;

            // Ensure there is a bid to accept
            let bid = auction.ensure_last_bid_exists::<T>()?;

            let owner_account_id = Self::ensure_owner_account_id(&video, &nft).ok();

            //
            // == MUTATION SAFE ==
            //

            let nft = Self::complete_auction(video.in_channel, nft, bid, owner_account_id);
            let video = video.set_nft_status(nft);

            // Update the video
            VideoById::<T>::insert(video_id, video);

            // Trigger event
            Self::deposit_event(RawEvent::OpenAuctionBidAccepted(owner_id, video_id, metadata));
        }

        /// Offer NFT
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn offer_nft(
            origin,
            video_id: T::VideoId,
            owner_id: ContentActor<CuratorGroupId<T>, CuratorId<T>, MemberId<T>>,
            to: MemberId<T>,
            price: Option<BalanceOf<T>>,
        ) {

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(origin, &owner_id, &nft.owner, video.in_channel)?;

            // Ensure there is no pending offer or existing auction for given nft.
            nft.ensure_nft_transactional_status_is_idle::<T>()?;

            //
            // == MUTATION SAFE ==
            //

            // Set nft transactional status to InitiatedOfferToMember
            let nft = nft.set_pending_offer_transactional_status(to, price);
            let video = video.set_nft_status(nft);

            VideoById::<T>::insert(video_id, video);

            // Trigger event
            Self::deposit_event(RawEvent::OfferStarted(video_id, owner_id, to, price));
        }

        /// Accept incoming NFT offer
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn accept_incoming_offer(
            origin,
            video_id: T::VideoId,
            recipient_id: MemberId<T>,
        ) {

            // Authorize participant under given member id
            let receiver_account_id = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&recipient_id, &receiver_account_id)?;

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Ensure new pending offer is available to proceed
            Self::ensure_new_pending_offer_available_to_proceed(&nft, recipient_id, &receiver_account_id)?;

            let owner_account_id = Self::ensure_owner_account_id(&video, &nft)?;

            //
            // == MUTATION SAFE ==
            //

            // Complete nft offer
            let nft = Self::complete_nft_offer(video.in_channel, nft, owner_account_id, receiver_account_id);
            let video = video.set_nft_status(nft);

            VideoById::<T>::insert(video_id, video);

            // Trigger event
            Self::deposit_event(RawEvent::OfferAccepted(video_id, recipient_id));
        }

        /// Sell NFT
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn sell_nft(
            origin,
            video_id: T::VideoId,
            owner_id: ContentActor<CuratorGroupId<T>, CuratorId<T>, MemberId<T>>,
            price: BalanceOf<T>,
        ) {

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(origin, &owner_id, &nft.owner, video.in_channel)?;

            // Ensure there is no pending transfer or existing auction for given nft.
            nft.ensure_nft_transactional_status_is_idle::<T>()?;

            //
            // == MUTATION SAFE ==
            //

            // Place nft sell order
            let nft = nft.set_buy_now_transactionl_status(price);
            let video = video.set_nft_status(nft);

            VideoById::<T>::insert(video_id, video);

            // Trigger event
            Self::deposit_event(RawEvent::NFTSellOrderMade(video_id, owner_id, price));
        }

        /// Buy NFT
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn buy_nft(
            origin,
            video_id: T::VideoId,
            participant_id: MemberId<T>,
            metadata: Metadata,
        ) {

            // Authorize participant under given member id
            let participant_account_id = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&participant_id, &participant_account_id)?;

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Ensure given participant can buy nft now
            Self::ensure_can_buy_now(&nft, &participant_account_id)?;

            let owner_account_id = Self::ensure_owner_account_id(&video, &nft)?;

            //
            // == MUTATION SAFE ==
            //

            // Buy nft
            let nft = Self::buy_now(video.in_channel, nft, owner_account_id, participant_account_id, participant_id);
            let video = video.set_nft_status(nft);

            VideoById::<T>::insert(video_id, video);

            // Trigger event
            Self::deposit_event(RawEvent::NFTBought(video_id, participant_id, metadata));
        }
    }
}

impl<T: Trait> Module<T> {
    /// Ensure `CuratorGroup` under given id exists
    fn ensure_curator_group_under_given_id_exists(
        curator_group_id: &T::CuratorGroupId,
    ) -> Result<(), Error<T>> {
        ensure!(
            <CuratorGroupById<T>>::contains_key(curator_group_id),
            Error::<T>::CuratorGroupDoesNotExist
        );
        Ok(())
    }

    /// Ensure `CuratorGroup` under given id exists, return corresponding one
    fn ensure_curator_group_exists(
        curator_group_id: &T::CuratorGroupId,
    ) -> Result<CuratorGroup<T>, Error<T>> {
        Self::ensure_curator_group_under_given_id_exists(curator_group_id)?;
        Ok(Self::curator_group_by_id(curator_group_id))
    }

    fn ensure_channel_exists(channel_id: &T::ChannelId) -> Result<Channel<T>, Error<T>> {
        ensure!(
            ChannelById::<T>::contains_key(channel_id),
            Error::<T>::ChannelDoesNotExist
        );
        Ok(ChannelById::<T>::get(channel_id))
    }

    fn ensure_video_exists(video_id: &T::VideoId) -> Result<Video<T>, Error<T>> {
        ensure!(
            VideoById::<T>::contains_key(video_id),
            Error::<T>::VideoDoesNotExist
        );
        Ok(VideoById::<T>::get(video_id))
    }

    // Ensure given video is not in season
    fn ensure_video_can_be_removed(video: &Video<T>) -> DispatchResult {
        ensure!(video.in_series.is_none(), Error::<T>::VideoInSeason);
        Ok(())
    }

    fn ensure_channel_category_exists(
        channel_category_id: &T::ChannelCategoryId,
    ) -> Result<ChannelCategory, Error<T>> {
        ensure!(
            ChannelCategoryById::<T>::contains_key(channel_category_id),
            Error::<T>::CategoryDoesNotExist
        );
        Ok(ChannelCategoryById::<T>::get(channel_category_id))
    }

    fn ensure_video_category_exists(
        video_category_id: &T::VideoCategoryId,
    ) -> Result<VideoCategory, Error<T>> {
        ensure!(
            VideoCategoryById::<T>::contains_key(video_category_id),
            Error::<T>::CategoryDoesNotExist
        );
        Ok(VideoCategoryById::<T>::get(video_category_id))
    }

    fn pick_upload_parameters_from_assets(
        assets: &NewAssets<T>,
        channel_id: &T::ChannelId,
        sender: &T::AccountId,
    ) -> Option<UploadParameters<T>> {
        // dynamic bag for a media object
        let dyn_bag = DynamicBagIdType::<T::MemberId, T::ChannelId>::Channel(*channel_id);
        let bag_id = BagIdType::from(dyn_bag.clone());

        if !storage::Bags::<T>::contains_key(bag_id.clone()) {
            // create_dynamic_bag checks automatically satifsfied with None as second parameter
            Storage::<T>::create_dynamic_bag(dyn_bag, None).unwrap();
        }

        if let NewAssets::<T>::Upload(creation_upload_params) = assets {
            Some(UploadParametersRecord {
                bag_id,
                object_creation_list: creation_upload_params.object_creation_list.clone(),
                deletion_prize_source_account_id: sender.clone(),
                expected_data_size_fee: creation_upload_params.expected_data_size_fee,
            })
        } else {
            None
        }
    }

    fn actor_to_channel_owner(
        actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    ) -> ActorToChannelOwnerResult<T> {
        match actor {
            // Lead should use their member or curator role to authorize
            ContentActor::Lead => Err(Error::<T>::ActorCannotBeLead),
            ContentActor::Curator(
                curator_group_id,
                _curator_id
            ) => {
                Ok(ChannelOwner::CuratorGroup(*curator_group_id))
            }
            ContentActor::Member(member_id) => {
                Ok(ChannelOwner::Member(*member_id))
            }
            // TODO:
            // ContentActor::Dao(id) => Ok(ChannelOwner::Dao(id)),
        }
    }

    /// Ensure owner account id exists, retreive corresponding one.
    pub fn ensure_owner_account_id(
        video: &Video<T>,
        owned_nft: &Nft<T>,
    ) -> Result<T::AccountId, Error<T>> {
        if let NFTOwner::Member(member_id) = owned_nft.owner {
            let membership = <membership::Module<T>>::ensure_membership(member_id)
                .map_err(|_| Error::<T>::MemberProfileNotFound)?;
            Ok(membership.controller_account)
        } else if let Some(reward_account) = Self::channel_by_id(video.in_channel).reward_account {
            Ok(reward_account)
        } else {
            Err(Error::<T>::RewardAccountIsNotSet)
        }
    }

    fn bag_id_for_channel(channel_id: &T::ChannelId) -> storage::BagId<T> {
        // retrieve bag id from channel id
        let dyn_bag = DynamicBagIdType::<T::MemberId, T::ChannelId>::Channel(*channel_id);
        BagIdType::from(dyn_bag)
    }

    fn not_implemented() -> DispatchResult {
        Err(Error::<T>::FeatureNotImplemented.into())
    }
}

decl_event!(
    pub enum Event<T>
    where
        ContentActor = ContentActor<
            <T as ContentActorAuthenticator>::CuratorGroupId,
            <T as ContentActorAuthenticator>::CuratorId,
            MemberId<T>,
        >,
        MemberId = MemberId<T>,
        CuratorGroupId = <T as ContentActorAuthenticator>::CuratorGroupId,
        CuratorId = <T as ContentActorAuthenticator>::CuratorId,
        VideoId = <T as Trait>::VideoId,
        VideoCategoryId = <T as Trait>::VideoCategoryId,
        ChannelId = <T as storage::Trait>::ChannelId,
        ChannelCategoryId = <T as Trait>::ChannelCategoryId,
        ChannelOwnershipTransferRequestId = <T as Trait>::ChannelOwnershipTransferRequestId,
        PlaylistId = <T as Trait>::PlaylistId,
        SeriesId = <T as Trait>::SeriesId,
        PersonId = <T as Trait>::PersonId,
        ChannelOwnershipTransferRequest = ChannelOwnershipTransferRequest<T>,
        Series = Series<<T as storage::Trait>::ChannelId, <T as Trait>::VideoId>,
        Channel = Channel<T>,
        DataObjectId = <T as storage::Trait>::DataObjectId,
        IsCensored = bool,
        AuctionParams = AuctionParams<
            <T as Trait>::VideoId,
            <T as frame_system::Trait>::BlockNumber,
            BalanceOf<T>,
            MemberId<T>,
        >,
        Balance = BalanceOf<T>,
        ChannelCreationParameters = ChannelCreationParameters<T>,
        ChannelUpdateParameters = ChannelUpdateParameters<T>,
        VideoCreationParameters = VideoCreationParameters<T>,
        VideoUpdateParameters = VideoUpdateParameters<T>,
        NewAssets = NewAssets<T>,
    {
        // Curators
        CuratorGroupCreated(CuratorGroupId),
        CuratorGroupStatusSet(CuratorGroupId, bool /* active status */),
        CuratorAdded(CuratorGroupId, CuratorId),
        CuratorRemoved(CuratorGroupId, CuratorId),

        // Channels
        ChannelCreated(ContentActor, ChannelId, Channel, ChannelCreationParameters),
        ChannelUpdated(ContentActor, ChannelId, Channel, ChannelUpdateParameters),
        ChannelAssetsRemoved(ContentActor, ChannelId, BTreeSet<DataObjectId>, Channel),

        ChannelCensorshipStatusUpdated(
            ContentActor,
            ChannelId,
            IsCensored,
            Vec<u8>, /* rationale */
        ),

        // Channel Ownership Transfers
        ChannelOwnershipTransferRequested(
            ContentActor,
            ChannelOwnershipTransferRequestId,
            ChannelOwnershipTransferRequest,
        ),
        ChannelOwnershipTransferRequestWithdrawn(ContentActor, ChannelOwnershipTransferRequestId),
        ChannelOwnershipTransferred(ContentActor, ChannelOwnershipTransferRequestId),

        // Channel Categories
        ChannelCategoryCreated(
            ChannelCategoryId,
            ChannelCategory,
            ChannelCategoryCreationParameters,
        ),
        ChannelCategoryUpdated(
            ContentActor,
            ChannelCategoryId,
            ChannelCategoryUpdateParameters,
        ),
        ChannelCategoryDeleted(ContentActor, ChannelCategoryId),

        // Videos
        VideoCategoryCreated(
            ContentActor,
            VideoCategoryId,
            VideoCategoryCreationParameters,
        ),
        VideoCategoryUpdated(ContentActor, VideoCategoryId, VideoCategoryUpdateParameters),
        VideoCategoryDeleted(ContentActor, VideoCategoryId),

        VideoCreated(ContentActor, ChannelId, VideoId, VideoCreationParameters),
        VideoUpdated(ContentActor, VideoId, VideoUpdateParameters),
        VideoDeleted(ContentActor, VideoId),

        VideoCensorshipStatusUpdated(
            ContentActor,
            VideoId,
            IsCensored,
            Vec<u8>, /* rationale */
        ),

        // Featured Videos
        FeaturedVideosSet(ContentActor, Vec<VideoId>),

        // Video Playlists
        PlaylistCreated(ContentActor, PlaylistId, PlaylistCreationParameters),
        PlaylistUpdated(ContentActor, PlaylistId, PlaylistUpdateParameters),
        PlaylistDeleted(ContentActor, PlaylistId),

        // Series
        SeriesCreated(
            ContentActor,
            SeriesId,
            NewAssets,
            SeriesParameters<VideoId, NewAssets>,
            Series,
        ),
        SeriesUpdated(
            ContentActor,
            SeriesId,
            NewAssets,
            SeriesParameters<VideoId, NewAssets>,
            Series,
        ),
        SeriesDeleted(ContentActor, SeriesId),

        // Persons
        PersonCreated(
            ContentActor,
            PersonId,
            NewAssets,
            PersonCreationParameters<NewAssets>,
        ),
        PersonUpdated(
            ContentActor,
            PersonId,
            NewAssets,
            PersonUpdateParameters<NewAssets>,
        ),
        PersonDeleted(ContentActor, PersonId),
        ChannelDeleted(ContentActor, ChannelId),

        // NFT auction
        AuctionStarted(ContentActor, AuctionParams),
        NftIssued(
            ContentActor,
            VideoId,
            Option<Royalty>,
            Metadata,
            Option<MemberId>,
        ),
        AuctionBidMade(MemberId, VideoId, Balance, Metadata),
        AuctionBidCanceled(MemberId, VideoId),
        AuctionCompleted(MemberId, VideoId, Metadata),
        BidMadeCompletingAuction(MemberId, VideoId, Metadata),
        OpenAuctionBidAccepted(ContentActor, VideoId, Metadata),
        OfferStarted(VideoId, ContentActor, MemberId, Option<Balance>),
        TransactionCanceled(VideoId, ContentActor),
        OfferAccepted(VideoId, MemberId),
        NFTSellOrderMade(VideoId, ContentActor, Balance),
        NFTBought(VideoId, MemberId, Metadata),
    }
);
