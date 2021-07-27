// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![recursion_limit = "256"]

#[cfg(test)]
mod tests;

mod errors;
mod permissions;
mod types;
mod vnft_auction;

pub use errors::*;
pub use permissions::*;
pub use types::*;
pub use vnft_auction::*;

use core::hash::Hash;

use codec::Codec;
use codec::{Decode, Encode};

use frame_support::{
    decl_event, decl_module, decl_storage,
    dispatch::{DispatchError, DispatchResult},
    ensure,
    traits::Get,
    Parameter,
};
use frame_system::ensure_signed;
#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};
use sp_arithmetic::traits::{BaseArithmetic, One, Zero};
use sp_runtime::traits::{MaybeSerializeDeserialize, Member};
pub use sp_runtime::Perbill;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::vec;
use sp_std::vec::Vec;

pub use common::storage::{
    ContentParameters as ContentParametersRecord, StorageObjectOwner as StorageObjectOwnerRecord,
    StorageSystem,
};

pub use common::{
    currency::{BalanceOf, GovernanceCurrency},
    working_group::WorkingGroup,
    MembershipTypes, StorageOwnership, Url,
};
use frame_support::traits::{Currency, ReservableCurrency};

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
    frame_system::Trait
    + pallet_timestamp::Trait
    + ContentActorAuthenticator
    + Clone
    + StorageOwnership
    + MembershipTypes
    + GovernanceCurrency
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

    // Type that handles asset uploads to storage frame_system
    type StorageSystem: StorageSystem<Self>;
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

        /// Min auction bid step
        pub MinBidStep get(fn min_bid_step) config(): BalanceOf<T>;

        /// Max auction bid step
        pub MaxBidStep get(fn max_bid_step) config(): BalanceOf<T>;
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
            params: ChannelCreationParameters<ContentParameters<T>, T::AccountId>,
        ) {
            ensure_actor_authorized_to_create_channel::<T>(
                origin,
                &actor,
            )?;

            // The channel owner will be..
            let channel_owner = Self::actor_to_channel_owner(&actor)?;

            // Pick out the assets to be uploaded to storage frame_system
            let content_parameters: Vec<ContentParameters<T>> = Self::pick_content_parameters_from_assets(&params.assets);

            let channel_id = NextChannelId::<T>::get();

            let object_owner = StorageObjectOwner::<T>::Channel(channel_id);

            //
            // == MUTATION SAFE ==
            //

            // This should be first mutation
            // Try add assets to storage
            T::StorageSystem::atomically_add_content(
                object_owner,
                content_parameters,
            )?;

            // Only increment next channel id if adding content was successful
            NextChannelId::<T>::mutate(|id| *id += T::ChannelId::one());

            let channel: Channel<T> = ChannelRecord {
                owner: channel_owner,
                videos: vec![],
                playlists: vec![],
                series: vec![],
                is_censored: false,
                reward_account: params.reward_account.clone(),
            };
            ChannelById::<T>::insert(channel_id, channel.clone());

            Self::deposit_event(RawEvent::ChannelCreated(actor, channel_id, channel, params));
        }

        // Include Option<AccountId> in ChannelUpdateParameters to update reward_account
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_channel(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            params: ChannelUpdateParameters<ContentParameters<T>, T::AccountId>,
        ) {
            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            ensure_actor_authorized_to_update_channel::<T>(
                origin,
                &actor,
                &channel.owner,
            )?;

            // Pick out the assets to be uploaded to storage frame_system
            let new_assets = if let Some(assets) = &params.assets {
                let upload_parameters: Vec<ContentParameters<T>> = Self::pick_content_parameters_from_assets(assets);

                let object_owner = StorageObjectOwner::<T>::Channel(channel_id);

                // check assets can be uploaded to storage.
                // update can_add_content() to only take &refrences
                T::StorageSystem::can_add_content(
                    object_owner.clone(),
                    upload_parameters.clone(),
                )?;

                Some((upload_parameters, object_owner))
            } else {
                None
            };

            //
            // == MUTATION SAFE ==
            //

            let mut channel = channel;

            // Maybe update the reward account
            if let Some(reward_account) = &params.reward_account {
                channel.reward_account = reward_account.clone();
            }

            // Update the channel
            ChannelById::<T>::insert(channel_id, channel.clone());

            // add assets to storage
            // This should not fail because of prior can_add_content() check!
            if let Some((upload_parameters, object_owner)) = new_assets {
                T::StorageSystem::atomically_add_content(
                    object_owner,
                    upload_parameters,
                )?;
            }

            Self::deposit_event(RawEvent::ChannelUpdated(actor, channel_id, channel, params));
        }

        /// Remove assets of a channel from storage
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn remove_channel_assets(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            assets: Vec<ContentId<T>>,
        ) {
            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            ensure_actor_authorized_to_update_channel::<T>(
                origin,
                &actor,
                &channel.owner,
            )?;

            let object_owner = StorageObjectOwner::<T>::Channel(channel_id);

            //
            // == MUTATION SAFE ==
            //

            T::StorageSystem::atomically_remove_content(&object_owner, &assets)?;

            Self::deposit_event(RawEvent::ChannelAssetsRemoved(actor, channel_id, assets));
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

            if channel.is_censored == is_censored {
                return Ok(())
            }

            ensure_actor_authorized_to_censor::<T>(
                origin,
                &actor,
                &channel.owner,
            )?;

            //
            // == MUTATION SAFE ==
            //

            let mut channel = channel;

            channel.is_censored = is_censored;

            // TODO: unset the reward account ? so no revenue can be earned for censored channels?

            // Update the channel
            ChannelById::<T>::insert(channel_id, channel);

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
            params: VideoCreationParameters<ContentParameters<T>>,
        ) {
            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            ensure_actor_authorized_to_update_channel::<T>(
                origin,
                &actor,
                &channel.owner,
            )?;

            // Pick out the assets to be uploaded to storage frame_system
            let content_parameters: Vec<ContentParameters<T>> = Self::pick_content_parameters_from_assets(&params.assets);

            let video_id = NextVideoId::<T>::get();

            let object_owner = StorageObjectOwner::<T>::Channel(channel_id);

            // This should be first mutation
            // Try add assets to storage
            T::StorageSystem::atomically_add_content(
                object_owner,
                content_parameters,
            )?;

            //
            // == MUTATION SAFE ==
            //

            let video: Video<T> = VideoRecord {
                in_channel: channel_id,
                // keep track of which season the video is in if it is an 'episode'
                // - prevent removing a video if it is in a season (because order is important)
                in_series: None,
                /// Whether the curators have censored the video or not.
                is_censored: false,
                /// Newly created video has no nft
                nft_status: NFTStatus::NoneIssued,
            };

            VideoById::<T>::insert(video_id, video);

            // Only increment next video id if adding content was successful
            NextVideoId::<T>::mutate(|id| *id += T::VideoId::one());

            // Add recently added video id to the channel
            ChannelById::<T>::mutate(channel_id, |channel| {
                channel.videos.push(video_id);
            });

            Self::deposit_event(RawEvent::VideoCreated(actor, channel_id, video_id, params));

        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_video(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            params: VideoUpdateParameters<ContentParameters<T>>,
        ) {
            // check that video exists, retrieve corresponding channel id.
            let channel_id = Self::ensure_video_exists(&video_id)?.in_channel;

            ensure_actor_authorized_to_update_channel::<T>(
                origin,
                &actor,
                &Self::channel_by_id(channel_id).owner,
            )?;

            // Pick out the assets to be uploaded to storage frame_system
            let new_assets = if let Some(assets) = &params.assets {
                let upload_parameters: Vec<ContentParameters<T>> = Self::pick_content_parameters_from_assets(assets);

                let object_owner = StorageObjectOwner::<T>::Channel(channel_id);

                // check assets can be uploaded to storage.
                // update can_add_content() to only take &refrences
                T::StorageSystem::can_add_content(
                    object_owner.clone(),
                    upload_parameters.clone(),
                )?;

                Some((upload_parameters, object_owner))
            } else {
                None
            };

            //
            // == MUTATION SAFE ==
            //

            // add assets to storage
            // This should not fail because of prior can_add_content() check!
            if let Some((upload_parameters, object_owner)) = new_assets {
                T::StorageSystem::atomically_add_content(
                    object_owner,
                    upload_parameters,
                )?;
            }

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

            let channel_id = video.in_channel;

            ensure_actor_authorized_to_update_channel::<T>(
                origin,
                &actor,
                // The channel owner will be..
                &Self::channel_by_id(channel_id).owner,
            )?;

            Self::ensure_video_can_be_removed(video)?;

            //
            // == MUTATION SAFE ==
            //

            // Remove video
            VideoById::<T>::remove(video_id);

            // Update corresponding channel
            // Remove recently deleted video from the channel
            ChannelById::<T>::mutate(channel_id, |channel| {
                if let Some(index) = channel.videos.iter().position(|x| *x == video_id) {
                    channel.videos.remove(index);
                }
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
            _params: PersonCreationParameters<ContentParameters<T>>,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_person(
            _origin,
            _actor: PersonActor<T::MemberId, T::CuratorId>,
            _person: T::PersonId,
            _params: PersonUpdateParameters<ContentParameters<T>>,
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

            if video.is_censored == is_censored {
                return Ok(())
            }

            ensure_actor_authorized_to_censor::<T>(
                origin,
                &actor,
                // The channel owner will be..
                &Self::channel_by_id(video.in_channel).owner,
            )?;

            //
            // == MUTATION SAFE ==
            //

            let mut video = video;

            video.is_censored = is_censored;

            // Update the video
            VideoById::<T>::insert(video_id, video);

            Self::deposit_event(RawEvent::VideoCensorshipStatusUpdated(actor, video_id, is_censored, rationale));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_series(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _channel_id: T::ChannelId,
            _params: SeriesParameters<T::VideoId, ContentParameters<T>>,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_series(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _channel_id: T::ChannelId,
            _params: SeriesParameters<T::VideoId, ContentParameters<T>>,
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

        /// Start video auction
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn start_video_auction(
            origin,
            auctioneer: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            auction_params: AuctionParams<T::VideoId, <T as pallet_timestamp::Trait>::Moment, BalanceOf<T>>,
        ) {

            let video_id = auction_params.video_id;

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            let auctioneer_account_id = Self::authorize_auctioneer(origin, &auctioneer, &auction_params, &video)?;

            // Validate round_time & starting_price
            Self::validate_auction_params(&auction_params, &video)?;

            // Ensure nft auction is not started
            video.ensure_nft_auction_is_not_started::<T>()?;

            //
            // == MUTATION SAFE ==
            //

            // Create new auction
            let auction = AuctionRecord::new(auctioneer, auctioneer_account_id, auction_params.clone());
            let video = video.set_auction_transactional_status(auction);

            // Update the video
            VideoById::<T>::insert(video_id, video);

            // Trigger event
            Self::deposit_event(RawEvent::AuctionStarted(auctioneer, auction_params));
        }

        /// Cancel video auction
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn cancel_video_auction(
            origin,
            auctioneer: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
        ) {

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            Self::authorize_content_actor(origin, &auctioneer)?;

            // Ensure auction for given video id exists
            video.ensure_nft_auction_started::<T>()?;


            if let Some(auction) = video.get_nft_auction_ref() {

                // Return if auction round time expired
                let now = pallet_timestamp::Module::<T>::now();

                if auction.is_nft_auction_round_time_expired(now) {
                    return Ok(())
                }

                // Ensure given conntent actor is auctioneer
                auction.ensure_is_auctioneer::<T>(&auctioneer)?;

                // Ensure auction is not active
                auction.ensure_is_not_active::<T>()?;
            }

            //
            // == MUTATION SAFE ==
            //

            // Cancel auction
            let video = video.set_idle_transactional_status();

            VideoById::<T>::insert(video_id, video);

            // Trigger event
            Self::deposit_event(RawEvent::AuctionCancelled(auctioneer, video_id));
        }

        /// Make auction bid
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn make_bid(
            origin,
            participant_id: T::MemberId,
            video_id: T::VideoId,
            bid: BalanceOf<T>,
        ) {

            let participant_account_id = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&participant_id, &participant_account_id)?;

            // Ensure bidder have sufficient balance amount to reserve for bid
            Self::ensure_has_sufficient_balance(&participant_account_id, bid)?;

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure auction for given video id exists
            video.ensure_nft_auction_started::<T>()?;

            if let Some(auction) = video.get_nft_auction_ref() {
                // Return if auction round time expired
                let now = pallet_timestamp::Module::<T>::now();
                if auction.is_nft_auction_round_time_expired(now) {
                    return Ok(())
                }

                // Ensure new bid is greater then last bid + minimal bid step
                auction.ensure_is_valid_bid::<T>(bid)?;
            }

            //
            // == MUTATION SAFE ==
            //

            let mut video = video;

            if let Some(auction) = video.get_nft_auction_ref_mut() {

                let last_bid_time = pallet_timestamp::Module::<T>::now();

                // Unreserve previous bidder balance
                T::Currency::unreserve(&auction.last_bidder, auction.last_bid);

                // TODO switch to StakingHandler representation after merging with olympia

                // Make auction bid & update auction data
                match *&auction.buy_now_price {
                    // Instantly complete auction if bid is greater or equal then buy now price
                    Some(buy_now_price) if bid >= buy_now_price => {
                        // Reseve balance for current bid
                        // Can not fail, needed check made
                        T::Currency::reserve(&participant_account_id, buy_now_price)?;
                        auction.make_bid::<T>(participant_account_id, buy_now_price, last_bid_time);

                        let video = Self::complete_auction(video, video_id);
                        VideoById::<T>::insert(video_id, video);

                        // Trigger event
                        Self::deposit_event(RawEvent::AuctionCompleted(participant_id, video_id, buy_now_price));
                    }
                    _ => {
                        // Reseve balance for current bid
                        // Can not fail, needed check made
                        T::Currency::reserve(&participant_account_id, bid)?;
                        auction.make_bid::<T>(participant_account_id, bid, last_bid_time);

                        VideoById::<T>::insert(video_id, video);

                        // Trigger event
                        Self::deposit_event(RawEvent::AuctionBidMade(participant_id, video_id, bid));
                    }
                };
            }
        }

        /// Issue vNFT
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn issue(
            origin,
            auctioneer: ContentActor<CuratorGroupId<T>, CuratorId<T>, MemberId<T>>,
            video_id: T::VideoId,
            royalty: Option<Royalty>,
        ) {

            // Authorize content actor
            Self::authorize_content_actor(origin.clone(), &auctioneer)?;

            let content_actor_account_id = ensure_signed(origin)?;

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure have not been issued yet
            video.ensure_vnft_not_issued::<T>()?;

            // Enure royalty bounds satisfied, if provided
            if let Some(royalty) = royalty {
                Self::ensure_royalty_bounds_satisfied(royalty)?;
            }

            //
            // == MUTATION SAFE ==
            //

            // Issue vNFT

            let royalty = royalty.map(|royalty| (content_actor_account_id.clone(), royalty));

            let mut video = video;
            Self::issue_vnft(&mut video, video_id, content_actor_account_id, royalty);
        }

        /// Start vNFT transfer
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn start_transfer(
            origin,
            video_id: T::VideoId,
            from: MemberId<T>,
            to: MemberId<T>,
        ) {

            // Authorize participant under given member id
            let from_account_id = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&from, &from_account_id)?;

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure from_account_id is vnft owner
            video.ensure_vnft_ownership::<T>(&from_account_id)?;

            // Ensure there is not pending transfer or existing auction for given nft.
            video.ensure_nft_transactional_status_is_idle::<T>()?;

            //
            // == MUTATION SAFE ==
            //

            // Set nft transactional status to PendingTransferTo
            video.set_pending_transfer_transactional_status(to);

            // Trigger event
            Self::deposit_event(RawEvent::TransferStarted(video_id, from, to));
        }

        /// Cancel vNFT transfer
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn cancel_transfer(
            origin,
            video_id: T::VideoId,
            participant_id: MemberId<T>,
        ) {

            let participant_account_id = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&participant_id, &participant_account_id)?;

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            video.ensure_pending_transfer_exists::<T>()?;

            video.ensure_vnft_ownership::<T>(&participant_account_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Cancel pending transfer
            let video = video.set_idle_transactional_status();

            VideoById::<T>::insert(video_id, video);

            // Trigger event
            Self::deposit_event(RawEvent::TransferCancelled(video_id, participant_id));
        }

        // /// Accept incoming vNFT transfer
        // #[weight = 10_000_000] // TODO: adjust weight
        // pub fn accept_incoming_vnft(
        //     origin,
        //     vnft_id: T::VNFTId,
        //     participant: MemberId<T>,
        // ) {

        //     let participant_account_id = Self::authorize_participant(origin, participant)?;

        //     Self::ensure_pending_transfer_exists(vnft_id)?;

        //     // Ensure new pending transfer available to proceed
        //     Self::ensure_new_pending_transfer_available(vnft_id, participant)?;

        //     let mut vnft = Self::ensure_vnft_exists(vnft_id)?;

        //     //
        //     // == MUTATION SAFE ==
        //     //

        //     // Remove vNFT transfer data from pending transfers storage
        //     // Safe to call, because we always have one transfers per vnft_id
        //     <PendingTransfers<T>>::remove_prefix(vnft_id);


        //     vnft.owner = participant_account_id;
        //     <VNFTById<T>>::insert(vnft_id, vnft);

        //     // Trigger event
        //     Self::deposit_event(RawEvent::TransferAccepted(vnft_id, participant));
        // }
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
    fn ensure_video_can_be_removed(video: Video<T>) -> DispatchResult {
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

    fn pick_content_parameters_from_assets(
        assets: &[NewAsset<ContentParameters<T>>],
    ) -> Vec<ContentParameters<T>> {
        assets
            .iter()
            .filter_map(|asset| match asset {
                NewAsset::Upload(content_parameters) => Some(content_parameters.clone()),
                _ => None,
            })
            .collect()
    }

    fn actor_to_channel_owner(
        actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
    ) -> ActorToChannelOwnerResult<T> {
        match actor {
            // Lead should use their member or curator role to create channels
            ContentActor::Lead => Err(Error::<T>::ActorCannotOwnChannel),
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

    fn not_implemented() -> DispatchResult {
        Err(Error::<T>::FeatureNotImplemented.into())
    }
}

// Some initial config for the module on runtime upgrade
impl<T: Trait> Module<T> {
    pub fn on_runtime_upgrade() {
        <NextChannelCategoryId<T>>::put(T::ChannelCategoryId::one());
        <NextVideoCategoryId<T>>::put(T::VideoCategoryId::one());
        <NextVideoId<T>>::put(T::VideoId::one());
        <NextChannelId<T>>::put(T::ChannelId::one());
        <NextPlaylistId<T>>::put(T::PlaylistId::one());
        <NextSeriesId<T>>::put(T::SeriesId::one());
        <NextPersonId<T>>::put(T::PersonId::one());
        <NextChannelOwnershipTransferRequestId<T>>::put(T::ChannelOwnershipTransferRequestId::one());
    }
}

decl_event!(
    pub enum Event<T>
    where
        ContentActor = ContentActor<
            <T as ContentActorAuthenticator>::CuratorGroupId,
            <T as ContentActorAuthenticator>::CuratorId,
            <T as MembershipTypes>::MemberId,
        >,
        <T as MembershipTypes>::MemberId,
        CuratorGroupId = <T as ContentActorAuthenticator>::CuratorGroupId,
        CuratorId = <T as ContentActorAuthenticator>::CuratorId,
        VideoId = <T as Trait>::VideoId,
        VideoCategoryId = <T as Trait>::VideoCategoryId,
        ChannelId = <T as StorageOwnership>::ChannelId,
        NewAsset = NewAsset<ContentParameters<T>>,
        ChannelCategoryId = <T as Trait>::ChannelCategoryId,
        ChannelOwnershipTransferRequestId = <T as Trait>::ChannelOwnershipTransferRequestId,
        PlaylistId = <T as Trait>::PlaylistId,
        SeriesId = <T as Trait>::SeriesId,
        PersonId = <T as Trait>::PersonId,
        ChannelOwnershipTransferRequest = ChannelOwnershipTransferRequest<T>,
        Series = Series<<T as StorageOwnership>::ChannelId, <T as Trait>::VideoId>,
        Channel = Channel<T>,
        ContentParameters = ContentParameters<T>,
        AccountId = <T as frame_system::Trait>::AccountId,
        ContentId = ContentId<T>,
        IsCensored = bool,
        AuctionParams = AuctionParams<
            <T as Trait>::VideoId,
            <T as pallet_timestamp::Trait>::Moment,
            BalanceOf<T>,
        >,
        Balance = BalanceOf<T>,
        NFTStatus = NFTStatus<
            <T as frame_system::Trait>::AccountId,
            <T as pallet_timestamp::Trait>::Moment,
            <T as ContentActorAuthenticator>::CuratorGroupId,
            <T as ContentActorAuthenticator>::CuratorId,
            <T as MembershipTypes>::MemberId,
            BalanceOf<T>
        >,
    {
        // Curators
        CuratorGroupCreated(CuratorGroupId),
        CuratorGroupStatusSet(CuratorGroupId, bool /* active status */),
        CuratorAdded(CuratorGroupId, CuratorId),
        CuratorRemoved(CuratorGroupId, CuratorId),

        // Channels
        ChannelCreated(
            ContentActor,
            ChannelId,
            Channel,
            ChannelCreationParameters<ContentParameters, AccountId>,
        ),
        ChannelUpdated(
            ContentActor,
            ChannelId,
            Channel,
            ChannelUpdateParameters<ContentParameters, AccountId>,
        ),
        ChannelAssetsRemoved(ContentActor, ChannelId, Vec<ContentId>),

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

        VideoCreated(
            ContentActor,
            ChannelId,
            VideoId,
            VideoCreationParameters<ContentParameters>,
        ),
        VideoUpdated(
            ContentActor,
            VideoId,
            VideoUpdateParameters<ContentParameters>,
        ),
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
            Vec<NewAsset>,
            SeriesParameters<VideoId, ContentParameters>,
            Series,
        ),
        SeriesUpdated(
            ContentActor,
            SeriesId,
            Vec<NewAsset>,
            SeriesParameters<VideoId, ContentParameters>,
            Series,
        ),
        SeriesDeleted(ContentActor, SeriesId),

        // Persons
        PersonCreated(
            ContentActor,
            PersonId,
            Vec<NewAsset>,
            PersonCreationParameters<ContentParameters>,
        ),
        PersonUpdated(
            ContentActor,
            PersonId,
            Vec<NewAsset>,
            PersonUpdateParameters<ContentParameters>,
        ),
        PersonDeleted(ContentActor, PersonId),

        // vNFT auction
        AuctionStarted(ContentActor, AuctionParams),
        NftIssued(VideoId, NFTStatus),
        AuctionBidMade(MemberId, VideoId, Balance),
        AuctionCancelled(ContentActor, VideoId),
        AuctionCompleted(MemberId, VideoId, Balance),
        TransferStarted(VideoId, MemberId, MemberId),
        TransferCancelled(VideoId, MemberId),
        TransferAccepted(VideoId, MemberId),
    }
);
