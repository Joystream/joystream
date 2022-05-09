// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![recursion_limit = "256"]

#[cfg(test)]
mod tests;
use core::marker::PhantomData;
mod errors;
mod nft;
mod permissions;
mod types;

use sp_std::cmp::max;
use sp_std::mem::size_of;

pub use errors::*;
pub use nft::*;
pub use permissions::*;
pub use types::*;

use codec::Codec;
use codec::{Decode, Encode};

pub use storage::{
    BagIdType, DataObjectCreationParameters, DataObjectStorage, DynamicBagIdType, UploadParameters,
    UploadParametersRecord,
};

pub use common::{
    membership::MembershipInfoProvider, working_group::WorkingGroup, MembershipTypes,
    StorageOwnership, Url,
};
use frame_support::{
    decl_event, decl_module, decl_storage,
    dispatch::{DispatchError, DispatchResult},
    ensure,
    traits::{Currency, ExistenceRequirement, Get},
    Parameter,
};

use frame_system::ensure_signed;

#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};
use sp_arithmetic::{
    traits::{BaseArithmetic, One, Saturating, Zero},
    Perbill,
};
use sp_runtime::{
    traits::{AccountIdConversion, Hash, MaybeSerializeDeserialize, Member},
    ModuleId,
};
use sp_std::{borrow::ToOwned, collections::btree_set::BTreeSet, vec::Vec};

/// Module configuration trait for Content Directory Module
pub trait Trait:
    frame_system::Trait
    + ContentActorAuthenticator
    + Clone
    + membership::Trait
    + balances::Trait
    + storage::Trait
{
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    /// Type of identifier for Videos
    type VideoId: NumericIdentifier;

    /// Type of identifier for OpenAuction
    type OpenAuctionId: NumericIdentifier;

    /// Type of identifier for Video Categories
    type VideoCategoryId: NumericIdentifier;

    /// Type of identifier for Channel Categories
    type ChannelCategoryId: NumericIdentifier;

    /// The maximum number of curators per group constraint
    type MaxNumberOfCuratorsPerGroup: Get<MaxNumber>;

    /// The storage type used
    type DataObjectStorage: storage::DataObjectStorage<Self>;

    /// Type of VideoPostId
    type VideoPostId: NumericIdentifier;

    /// Type of VideoPostId
    type ReactionId: NumericIdentifier;

    /// Max Number of moderators
    type MaxModerators: Get<u64>;

    /// Price per byte
    type PricePerByte: Get<<Self as balances::Trait>::Balance>;

    /// Cleanup Margin used in bloat bond calculation
    type CleanupMargin: Get<<Self as balances::Trait>::Balance>;

    /// Cleanup Cost used in bloat bond calculation
    type CleanupCost: Get<<Self as balances::Trait>::Balance>;

    /// Content Module Id
    type ModuleId: Get<ModuleId>;

    /// Refund cap during cleanup
    type BloatBondCap: Get<u32>;

    /// Type in order to retrieve controller account from channel member owner
    type MemberAuthenticator: MembershipInfoProvider<Self>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Content {
        pub ChannelById get(fn channel_by_id): map hasher(blake2_128_concat) T::ChannelId => Channel<T>;

        pub ChannelCategoryById get(fn channel_category_by_id):
        map hasher(blake2_128_concat) T::ChannelCategoryId => ChannelCategory;

        pub VideoById get(fn video_by_id): map hasher(blake2_128_concat) T::VideoId => Video<T>;

        pub VideoCategoryById get(fn video_category_by_id):
        map hasher(blake2_128_concat) T::VideoCategoryId => VideoCategory;

        pub NextChannelCategoryId get(fn next_channel_category_id) config(): T::ChannelCategoryId;

        pub NextChannelId get(fn next_channel_id) config(): T::ChannelId;

        pub NextVideoCategoryId get(fn next_video_category_id) config(): T::VideoCategoryId;

        pub NextVideoId get(fn next_video_id) config(): T::VideoId;

        pub NextCuratorGroupId get(fn next_curator_group_id) config(): T::CuratorGroupId;

        pub CuratorGroupById get(fn curator_group_by_id):
        map hasher(blake2_128_concat) T::CuratorGroupId => CuratorGroup<T>;

        pub VideoPostById get(fn video_post_by_id) : double_map hasher(blake2_128_concat) T::VideoId,
        hasher(blake2_128_concat) T::VideoPostId => VideoPost<T>;

        pub NextVideoPostId get(fn next_video_post_id) config(): T::VideoPostId;

        pub Commitment get(fn commitment): <T as frame_system::Trait>::Hash;

        pub MaxRewardAllowed get(fn max_reward_allowed) config(): BalanceOf<T>;

        pub MinCashoutAllowed get(fn min_cashout_allowed) config(): BalanceOf<T>;

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

        /// Max nft auction whitelist length
        pub MaxAuctionWhiteListLength get(fn max_auction_whitelist_length) config(): MaxNumber;

        /// Bids for open auctions
        pub OpenAuctionBidByVideoAndMember get(fn open_auction_bid_by_video_and_member):
        double_map hasher(blake2_128_concat) T::VideoId,
        hasher(blake2_128_concat) T::MemberId => OpenAuctionBid<T>;
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

            let sender = ensure_signed(origin)?;
            // Ensure given origin is lead
            ensure_lead_auth_success::<T>(&sender)?;

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
            let sender = ensure_signed(origin)?;
            // Ensure given origin is lead
            ensure_lead_auth_success::<T>(&sender)?;

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
            let sender = ensure_signed(origin)?;
            // Ensure given origin is lead
            ensure_lead_auth_success::<T>(&sender)?;

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
            let sender = ensure_signed(origin)?;
            // Ensure given origin is lead
            ensure_lead_auth_success::<T>(&sender)?;

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

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_channel(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            params: ChannelCreationParameters<T>,
        ) {
            // channel creator account
            let sender = ensure_signed(origin)?;

            ensure_actor_authorized_to_create_channel::<T>(
                &sender,
                &actor,
            )?;

            // The channel owner will be..
            let channel_owner = actor_to_channel_owner::<T>(&actor)?;

            // next channel id
            let channel_id = NextChannelId::<T>::get();

            // ensure collaborator & moderator member ids are valid
            Self::validate_member_set(&params.moderators)?;
            Self::validate_member_set(&params.collaborators)?;

            let upload_params = params.assets.as_ref().map(|assets| {
                Self::construct_upload_parameters(
                    assets,
                    &channel_id,
                    &sender
                )});

            let channel_bag_id = Self::bag_id_for_channel(&channel_id);

            let deletion_prize = storage::DynamicBagDeletionPrize::<T> {
                prize: Zero::zero(), // put 0 for Giza release
                account_id: sender,
            };

            if Storage::<T>::ensure_bag_exists(&channel_bag_id).is_err() {
                if let Some(params) = upload_params.clone() {
                    Storage::<T>::can_create_dynamic_bag_with_objects_constraints(
                        &DynamicBagIdType::<T::MemberId, T::ChannelId>::Channel(channel_id),
                        &Some(deletion_prize.clone()),
                        &params
                    )?;
                } else {
                    Storage::<T>::can_create_dynamic_bag(
                        &DynamicBagIdType::<T::MemberId, T::ChannelId>::Channel(channel_id),
                        &Some(deletion_prize.clone()),
                    )?;
                }
            }

            //
            // == MUTATION SAFE ==
            //

            if Storage::<T>::ensure_bag_exists(&channel_bag_id).is_err() {
                if let Some(params) = upload_params.clone() {
                    Storage::<T>::create_dynamic_bag_with_objects_constraints(
                        DynamicBagIdType::<T::MemberId, T::ChannelId>::Channel(channel_id),
                        Some(deletion_prize),
                        params,
                    )?;
                    // create_dynamic_bag_with_objects with its can* guard ensures that this invocation succeds
                } else {
                    Storage::<T>::create_dynamic_bag(
                        DynamicBagIdType::<T::MemberId, T::ChannelId>::Channel(channel_id),
                        Some(deletion_prize),
                    )?;
                }
            }

            // this will not fail because can_create_dynamic_bag_with_objects_constraints will check also for successful upload conditions
            if let Some(params) = upload_params{
                Storage::<T>::upload_data_objects(params)?;
            }

            // Only increment next channel id if adding content was successful
            NextChannelId::<T>::mutate(|id| *id += T::ChannelId::one());

            // channel creation
            let channel: Channel<T> = ChannelRecord {
                owner: channel_owner,
                num_videos: 0u64,
                is_censored: false,
                reward_account: params.reward_account.clone(),
                collaborators: params.collaborators.clone(),
                moderators: params.moderators.clone(),
                cumulative_payout_earned: BalanceOf::<T>::zero(),
            };

            // add channel to onchain state
            ChannelById::<T>::insert(channel_id, channel.clone());

            Self::deposit_event(RawEvent::ChannelCreated(actor, channel_id, channel, params));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_channel(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            params: ChannelUpdateParameters<T>,
        ) {
            let sender = ensure_signed(origin)?;

            // check that channel exists
            let mut channel = Self::ensure_channel_exists(&channel_id)?;

            ensure_actor_authorized_to_update_channel_assets::<T>(
                &sender,
                &actor,
                &channel,
            )?;

            // maybe update the reward account if actor is not a collaborator
            if let Some(reward_account) = params.reward_account.as_ref() {
                ensure_actor_can_manage_reward_account::<T>(&sender, &channel.owner, &actor)?;
                channel.reward_account = reward_account.clone();
            }

            // update collaborator set if actor is not a collaborator
            if let Some(new_collabs) = params.collaborators.as_ref() {
                ensure_actor_can_manage_collaborators::<T>(&sender, &channel.owner, &actor)?;
                // ensure collaborator member ids are valid
                Self::validate_member_set(new_collabs)?;

                channel.collaborators = new_collabs.clone();
            }

            if let Some(upload_assets) = params.assets_to_upload.as_ref() {
                let params = Self::construct_upload_parameters(
                    upload_assets,
                    &channel_id,
                    &sender
                );

                Storage::<T>::can_upload_data_objects(&params)?;
            }

            if !params.assets_to_remove.is_empty() {
                Storage::<T>::can_delete_data_objects(
                    &Self::bag_id_for_channel(&channel_id),
                    &params.assets_to_remove
                )?;
            }

            //
            // == MUTATION SAFE ==
            //

            if let Some(upload_assets) = params.assets_to_upload.as_ref() {
                let params = Self::construct_upload_parameters(
                    upload_assets,
                    &channel_id,
                    &sender
                );

                Storage::<T>::upload_data_objects(params)?;
            }

            if !params.assets_to_remove.is_empty() {
                Storage::<T>::delete_data_objects(
                    sender,
                    Self::bag_id_for_channel(&channel_id),
                    params.assets_to_remove.clone()
                )?;
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
            num_objects_to_delete: u64,
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;

            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            ensure_actor_authorized_to_delete_channel::<T>(
                &sender,
                &actor,
                &channel.owner,
            )?;

            // check that channel videos are 0
            ensure!(channel.num_videos == 0, Error::<T>::ChannelContainsVideos);

            // get bag id for the channel
            let dyn_bag = DynamicBagIdType::<T::MemberId, T::ChannelId>::Channel(channel_id);
            let bag_id = storage::BagIdType::from(dyn_bag.clone());

            // channel has a dynamic bag associated to it -> remove assets from storage
            if let Ok(bag) = T::DataObjectStorage::ensure_bag_exists(&bag_id) {
                // ensure that bag size provided is valid
                ensure!(
                    bag.objects_number == num_objects_to_delete,
                    Error::<T>::InvalidBagSizeSpecified
                );

                // construct collection of assets to be removed
                let assets_to_remove = T::DataObjectStorage::get_data_objects_id(&bag_id);

                if !assets_to_remove.is_empty() {
                    Storage::<T>::can_delete_dynamic_bag_with_objects(
                        &dyn_bag,
                    )?;

                    Storage::<T>::can_delete_data_objects(
                        &bag_id,
                        &assets_to_remove,
                    )?;
                } else {
                    Storage::<T>::can_delete_dynamic_bag(
                        &dyn_bag,
                    )?;
                }

                //
                // == MUTATION SAFE ==
                //

                // remove specified assets from storage
                if !assets_to_remove.is_empty() {
                    Storage::<T>::delete_data_objects(
                        sender.clone(),
                        Self::bag_id_for_channel(&channel_id),
                        assets_to_remove,
                    )?;
                }

                // delete channel dynamic bag
                Storage::<T>::delete_dynamic_bag(
                    sender,
                    dyn_bag,
                )?;
            }

            // remove channel from on chain state
            ChannelById::<T>::remove(channel_id);

            // deposit event
            Self::deposit_event(RawEvent::ChannelDeleted(actor, channel_id));

            Ok(())
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
        pub fn create_video(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            params: VideoCreationParameters<T>,
        ) {
            let sender = ensure_signed(origin)?;

            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            ensure_actor_authorized_to_update_channel_assets::<T>(
                &sender,
                &actor,
                &channel,
            )?;

            // next video id
            let video_id = NextVideoId::<T>::get();

            let nft_status = params.auto_issue_nft
                .as_ref()
                .map_or(
                    Ok(None),
                    |issuance_params| {
                        Some(Self::construct_owned_nft(issuance_params)).transpose()
                    }
                )?;

            // create the video struct
            let video: Video<T> = VideoRecord {
                in_channel: channel_id,
                is_censored: false,
                enable_comments: params.enable_comments,
                video_post_id:  None,
                nft_status,
            };

            if let Some(upload_assets) = params.assets.as_ref() {
                let params = Self::construct_upload_parameters(
                    upload_assets,
                    &channel_id,
                    &sender
                );
                Storage::<T>::upload_data_objects(params)?;
            }

            //
            // == MUTATION SAFE ==
            //


            // add it to the onchain state
            VideoById::<T>::insert(video_id, video);

            // Only increment next video id
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
            let sender = ensure_signed(origin)?;
            // check that video exists, retrieve corresponding channel id.
            let video = Self::ensure_video_exists(&video_id)?;

            let channel_id = video.in_channel;
            let channel = ChannelById::<T>::get(&channel_id);

            // Check for permission to update channel assets
            ensure_actor_authorized_to_update_channel_assets::<T>(
                &sender,
                &actor,
                &channel,
            )?;

            if let Some(upload_assets) = params.assets_to_upload.as_ref() {
                let params = Self::construct_upload_parameters(
                    upload_assets,
                    &channel_id,
                    &sender
                );
                Storage::<T>::can_upload_data_objects(&params)?;
            }

            if !params.assets_to_remove.is_empty() {
                Storage::<T>::can_delete_data_objects(
                    &Self::bag_id_for_channel(&channel_id),
                    &params.assets_to_remove,
                )?;
            }


            let nft_status = params.auto_issue_nft
                .as_ref()
                .map_or(
                    Ok(None),
                    |issuance_params| {
                        ensure!(video.nft_status.is_none(), Error::<T>::NftAlreadyExists);
                        Some(Self::construct_owned_nft(issuance_params)).transpose()
                    }
                )?;


            //
            // == MUTATION SAFE ==
            //

            if let Some(upload_assets) = params.assets_to_upload.as_ref() {
                let params = Self::construct_upload_parameters(
                    upload_assets,
                    &channel_id,
                    &sender
                );
                Storage::<T>::upload_data_objects(params)?;
            }

            if !params.assets_to_remove.is_empty() {
                Storage::<T>::delete_data_objects(
                    sender,
                    Self::bag_id_for_channel(&channel_id),
                    params.assets_to_remove.clone(),
                )?;
            }

            if nft_status.is_some() {
                VideoById::<T>::mutate(&video_id, |video| video.nft_status = nft_status);
            }

            Self::deposit_event(RawEvent::VideoUpdated(actor, video_id, params));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_video(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            assets_to_remove: BTreeSet<DataObjectId<T>>,
        ) {
            let sender = ensure_signed(origin)?;

            // check that video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // get information regarding channel
            let channel_id = video.in_channel;
            let channel = ChannelById::<T>::get(channel_id);

            ensure_actor_authorized_to_update_channel_assets::<T>(
                &sender,
                &actor,
                &channel,
            )?;

            // Ensure nft for this video have not been issued
            video.ensure_nft_is_not_issued::<T>()?;

            if !assets_to_remove.is_empty() {
                Storage::<T>::can_delete_data_objects(
                    &Self::bag_id_for_channel(&channel_id),
                    &assets_to_remove,
                )?;
            }

            // bloat bond logic: channel owner is refunded
            video.video_post_id.as_ref().map(
                |video_post_id| Self::video_deletion_refund_logic(&sender, &video_id, &video_post_id)
            ).transpose()?;

            //
            // == MUTATION SAFE ==
            //

            if !assets_to_remove.is_empty() {
                Storage::<T>::delete_data_objects(
                    sender,
                    Self::bag_id_for_channel(&channel_id),
                    assets_to_remove,
                )?;
            }

            // Remove video
            VideoById::<T>::remove(video_id);

            // Remove all comments related
            <VideoPostById<T>>::remove_prefix(video_id);

            // Update corresponding channel
            // Remove recently deleted video from the channel
            ChannelById::<T>::mutate(channel_id, |channel| {
                channel.num_videos = channel.num_videos.saturating_sub(1)
            });

            Self::deposit_event(RawEvent::VideoDeleted(actor, video_id));
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
        pub fn update_video_censorship_status(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            is_censored: bool,
            rationale: Vec<u8>,
        ) -> DispatchResult {
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

            Self::deposit_event(
                RawEvent::VideoCensorshipStatusUpdated(
                    actor,
                    video_id,
                    is_censored,
                    rationale
                ));

            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_post(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            params: VideoPostCreationParameters<T>,
        ) -> DispatchResult {

            let sender = ensure_signed(origin)?;

            // ensure channel is valid
            let video = Self::ensure_video_exists(&params.video_reference)?;
            let owner = ChannelById::<T>::get(video.in_channel).owner;

            match params.post_type {
                VideoPostType::<T>::Comment(parent_id) => {
                    ensure!(video.enable_comments, Error::<T>::CommentsDisabled);
                    Self::ensure_post_exists( params.video_reference, parent_id).map(|_| ())?;
                    ensure_actor_authorized_to_add_comment::<T>(&sender, &actor)?
                },
                VideoPostType::<T>::Description => ensure_actor_authorized_to_add_video_post::<T>(
                    &sender,
                    &actor,
                    &owner
                )?
            };

            let initial_bloat_bond = Self::compute_initial_bloat_bond();
            let post_id = <NextVideoPostId<T>>::get();

            let post = VideoPost::<T> {
                author: actor,
                bloat_bond: initial_bloat_bond,
                replies_count: T::VideoPostId::zero(),
                video_reference: params.video_reference,
                post_type: params.post_type.clone(),
            };

            ensure!(
                Balances::<T>::usable_balance(&sender) >= initial_bloat_bond,
                Error::<T>::UnsufficientBalance,
            );
            //
            // == MUTATION SAFE ==
            //

            <ContentTreasury<T>>::deposit(&sender, initial_bloat_bond)?;

            <NextVideoPostId<T>>::mutate(|x| *x = x.saturating_add(One::one()));
            <VideoPostById<T>>::insert(&params.video_reference, &post_id, post.clone());

            // increment replies count in the parent post
            match params.post_type {
                VideoPostType::<T>::Comment(parent_id) => <VideoPostById<T>>::mutate(
                    &params.video_reference,
                    parent_id,
                    |x| x.replies_count = x.replies_count.saturating_add(One::one())),
                VideoPostType::<T>::Description => VideoById::<T>::mutate(
                    &params.video_reference,
                    |video| video.video_post_id = Some(post_id)),
            };

            // deposit event
            Self::deposit_event(RawEvent::VideoPostCreated(post, post_id));

            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn edit_post_text(
            origin,
            video_id: T::VideoId,
            post_id: T::VideoPostId,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            new_text: Vec<u8>,
        ) {
            let sender = ensure_signed(origin)?;
            let post = Self::ensure_post_exists(video_id, post_id)?;
            let video = VideoById::<T>::get(video_id);
            let channel = ChannelById::<T>::get(video.in_channel);

            match post.post_type {
                VideoPostType::<T>::Description => ensure_actor_authorized_to_edit_video_post::<T>(
                    &sender,
                    &actor,
                    &channel.owner
                )?,
                VideoPostType::<T>::Comment(_) => ensure_actor_authorized_to_edit_comment::<T>(
                    &sender,
                    &actor,
                    &post
                )?
            };

            // deposit event
            Self::deposit_event(RawEvent::VideoPostTextUpdated(actor, new_text, post_id, video_id));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_post(
            origin,
            post_id: T::VideoPostId,
            video_id: T::VideoId,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            params: VideoPostDeletionParameters<T>,
        ) {
            let sender = ensure_signed(origin)?;
            let post = Self::ensure_post_exists(video_id, post_id)?;
            let video = VideoById::<T>::get(video_id);
            let channel = ChannelById::<T>::get(video.in_channel);

            let cleanup_actor = match post.post_type {
                VideoPostType::<T>::Description => {
                    Self::ensure_witness_verification(
                        params.witness,
                        post.replies_count,
                    )?;
                    ensure_actor_authorized_to_remove_video_post::<T>(&sender, &actor, &channel)?;
                    CleanupActor::VideoPostAuthor
                },
                VideoPostType::<T>::Comment(_) => {
                    let cleanup_actor = ensure_actor_authorized_to_remove_comment::<T>(
                        &sender,
                        &actor,
                        &channel,
                        &post
                    )?;
                    if let CleanupActor::Moderator = &cleanup_actor {
                        ensure!(
                            params.rationale.is_some(),
                            Error::<T>::RationaleNotProvidedByModerator
                        );
                    }
                    cleanup_actor
                }
            };

            ensure!(
                ContentTreasury::<T>::usable_balance() >= post.bloat_bond,
                Error::<T>::InsufficientTreasuryBalance,
            );

            //
            // == MUTATION_SAFE ==
            //

            Self::refund(&sender, cleanup_actor, post.bloat_bond)?;

            match post.post_type {
                VideoPostType::<T>::Comment(parent_id) => {
                    VideoPostById::<T>::remove(&video_id, &post_id);
                    // parent post might have been already deleted
                    if let Ok(mut parent_post) = Self::ensure_post_exists(
                        video_id,
                        parent_id,
                    ){
                        parent_post.replies_count =
                            parent_post.replies_count.saturating_sub(T::VideoPostId::one());
                        VideoPostById::<T>::insert(&video_id, &parent_id, parent_post);
                    }
                }
                VideoPostType::<T>::Description => VideoPostById::<T>::remove_prefix(&video_id),
            }

            // deposit event
            Self::deposit_event(
                RawEvent::VideoPostDeleted(
                    post,
                    post_id,
                    actor,
                ));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        fn react_to_post(
            origin,
            member_id: T::MemberId,
            video_id: T::VideoId,
            post_id: T::VideoPostId,
            reaction_id: T::ReactionId,
        ) {
            // post existence verification purposely avoided
            let sender = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&sender, &member_id)?;

            //
            // == MUTATION_SAFE ==
            //

            Self::deposit_event(RawEvent::ReactionToVideoPost(member_id, video_id, post_id, reaction_id));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        fn react_to_video(
            origin,
            member_id: T::MemberId,
            video_id: T::VideoId,
            reaction_id: T::ReactionId,
        ) {
            // video existence verification purposely avoided
            let sender = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&sender, &member_id)?;

            //
            // == MUTATION_SAFE ==
            //

            Self::deposit_event(RawEvent::ReactionToVideo(member_id, video_id, reaction_id));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        fn update_moderator_set(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            new_moderators: BTreeSet<T::MemberId>,
            channel_id: T::ChannelId
        ) {
            // ensure (origin, actor) is channel owner
            let sender = ensure_signed(origin)?;
            let owner = Self::ensure_channel_exists(&channel_id)?.owner;

            ensure_actor_can_manage_moderators::<T>(
                &sender,
                &owner,
                &actor,
            )?;

            Self::validate_member_set(&new_moderators)?;

            //
            // == MUTATION_SAFE ==
            //

            <ChannelById<T>>::mutate(channel_id, |x| x.moderators = new_moderators.clone());

            Self::deposit_event(
                RawEvent::ModeratorSetUpdated(
                    channel_id,
                    new_moderators
                ));
        }

        #[weight = 10_000_000] // TODO: adjust Weight
        pub fn update_commitment(
            origin,
            new_commitment: <T as frame_system::Trait>::Hash,
        ) {
            let sender = ensure_signed(origin)?;
            ensure_authorized_to_update_commitment::<T>(&sender)?;

            <Commitment<T>>::put(new_commitment);
            Self::deposit_event(RawEvent::CommitmentUpdated(new_commitment));
        }

        #[weight = 10_000_000] // TODO: adjust Weight
        pub fn claim_channel_reward(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            proof: Vec<ProofElement<T>>,
            item: PullPayment<T>,
        ) -> DispatchResult {
            let channel = Self::ensure_channel_exists(&item.channel_id)?;

            let reward_account = Self::ensure_reward_account(&channel)?;

            ensure_actor_authorized_to_claim_payment::<T>(origin, &actor, &channel.owner)?;

            let cashout = item
                .cumulative_payout_claimed
                .saturating_sub(channel.cumulative_payout_earned);

            ensure!(
                <MaxRewardAllowed<T>>::get() > item.cumulative_payout_claimed,
                Error::<T>::TotalRewardLimitExceeded
            );
            ensure!(<MinCashoutAllowed<T>>::get() < cashout, Error::<T>::UnsufficientCashoutAmount);
            Self::verify_proof(&proof, &item)?;

            ContentTreasury::<T>::transfer_reward(&reward_account, cashout);
            ChannelById::<T>::mutate(
                &item.channel_id,
                |channel| channel.cumulative_payout_earned =
                    channel.cumulative_payout_earned.saturating_add(item.cumulative_payout_claimed)
            );

            Self::deposit_event(RawEvent::ChannelRewardUpdated(item.cumulative_payout_claimed, item.channel_id));

            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust Weight
        pub fn update_max_reward_allowed(origin, amount: BalanceOf<T>) {
            let sender = ensure_signed(origin)?;
            ensure_authorized_to_update_max_reward::<T>(&sender)?;
            <MaxRewardAllowed<T>>::put(amount);
            Self::deposit_event(RawEvent::MaxRewardUpdated(amount));
        }

        #[weight = 10_000_000] // TODO: adjust Weight
        pub fn update_min_cashout_allowed(origin, amount: BalanceOf<T>) {
            let sender = ensure_signed(origin)?;
            ensure_authorized_to_update_min_cashout::<T>(&sender)?;
            <MinCashoutAllowed<T>>::put(amount);
            Self::deposit_event(RawEvent::MinCashoutUpdated(amount));
        }

        /// Issue NFT
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn issue_nft(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            params: NftIssuanceParameters<T>
        ) {

            let sender = ensure_signed(origin)?;

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure have not been issued yet
            video.ensure_nft_is_not_issued::<T>()?;

            let channel_id = video.in_channel;

            // Ensure channel exists, retrieve channel owner
            let channel = Self::ensure_channel_exists(&channel_id)?;

            ensure_actor_authorized_to_update_channel_assets::<T>(&sender, &actor, &channel)?;

            // The content owner will be..
            let nft_status = Self::construct_owned_nft(&params)?;

            //
            // == MUTATION SAFE ==
            //

            // Update the video
            VideoById::<T>::mutate(video_id, |v| v.set_nft_status(nft_status));

            Self::deposit_event(RawEvent::NftIssued(
                actor,
                video_id,
                params,
            ));
        }

        /// Start video nft open auction
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn start_open_auction(
            origin,
            owner_id: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            auction_params: OpenAuctionParams<T>,
        ) {
            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(origin, &owner_id, &nft.owner, video.in_channel)?;

            // Ensure there nft transactional status is set to idle.
            Self::ensure_nft_transactional_status_is_idle(&nft)?;

            // Validate round_duration & starting_price
            Self::validate_open_auction_params(&auction_params)?;

            //
            // == MUTATION SAFE ==
            //

            // Create new auction
            let new_nonce = nft.open_auctions_nonce.saturating_add(One::one());
            let current_block = <frame_system::Module<T>>::block_number();
            let auction = OpenAuction::<T>::new(auction_params.clone(), new_nonce, current_block);

            // Update the video
            let new_nft = nft
                .with_transactional_status(TransactionalStatus::<T>::OpenAuction(auction))
                .increment_open_auction_count();

            VideoById::<T>::mutate(
                video_id,
                |v| v.set_nft_status(new_nft)
            );

            // Trigger event
            Self::deposit_event(RawEvent::OpenAuctionStarted(owner_id, video_id, auction_params, new_nonce));
        }

        /// Start video nft english auction
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn start_english_auction(
            origin,
            owner_id: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            auction_params: EnglishAuctionParams<T>,
        ) {
            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(origin, &owner_id, &nft.owner, video.in_channel)?;

            // Ensure there nft transactional status is set to idle.
            Self::ensure_nft_transactional_status_is_idle(&nft)?;

            // Validate round_duration & starting_price
            Self::validate_english_auction_params(&auction_params)?;

            //
            // == MUTATION SAFE ==
            //

            // Create new auction
            let current_block = <frame_system::Module<T>>::block_number();
            let auction = EnglishAuction::<T>::new(auction_params.clone(), current_block);

            // Update the video
            VideoById::<T>::mutate(
                video_id,
                |v| v.set_nft_status(nft.with_transactional_status(TransactionalStatus::<T>::EnglishAuction(auction))));

            // Trigger event
            Self::deposit_event(RawEvent::EnglishAuctionStarted(owner_id, video_id, auction_params));
        }

        // Cancel video nft english auction
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn cancel_english_auction(
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

            // Ensure auction state that can be canceled
            Self::ensure_in_english_auction_state(&nft)
                .and_then(|eng| eng.ensure_auction_can_be_canceled::<T>())?;

            //
            // == MUTATION SAFE ==
            //

            // Cancel auction
            let updated_nft = nft.with_transactional_status(TransactionalStatus::<T>::Idle);

            VideoById::<T>::mutate(video_id, |v| v.set_nft_status(updated_nft));

            // Trigger event
            Self::deposit_event(RawEvent::AuctionCanceled(owner_id, video_id));
        }

        // Cancel video nft english auction
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn cancel_open_auction(
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

            // Ensure auction state that can be canceled
            Self::ensure_in_open_auction_state(&nft)?;

            //
            // == MUTATION SAFE ==
            //

            // Cancel auction
            let updated_nft = nft.with_transactional_status(TransactionalStatus::<T>::Idle);

            VideoById::<T>::mutate(video_id, |v| v.set_nft_status(updated_nft));

            // Trigger event
            Self::deposit_event(RawEvent::AuctionCanceled(owner_id, video_id));
        }

        /// Cancel Nft offer
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn cancel_offer(
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

            // Ensure nft in pending offer state
            Self::ensure_in_pending_offer_state(&nft)?;

            //
            // == MUTATION SAFE ==
            //

            // Cancel pending offer
            let updated_nft = nft.with_transactional_status(TransactionalStatus::<T>::Idle);
            VideoById::<T>::mutate(video_id, |v| v.set_nft_status(updated_nft));

            // Trigger event
            Self::deposit_event(RawEvent::OfferCanceled(video_id, owner_id));
        }

        /// Cancel Nft sell order
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn cancel_buy_now(
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

            // Ensure nft in buy now state
            Self::ensure_in_buy_now_state(&nft)?;

            //
            // == MUTATION SAFE ==
            //

            // Cancel sell order
            let updated_nft = nft.with_transactional_status(TransactionalStatus::<T>::Idle);
            VideoById::<T>::mutate(video_id, |v| v.set_nft_status(updated_nft));

            // Trigger event
            Self::deposit_event(RawEvent::BuyNowCanceled(video_id, owner_id));
        }

        /// Update Buy now nft price
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_buy_now_price(
            origin,
            owner_id: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            new_price: BalanceOf<T>,
        ) {
            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(origin, &owner_id, &nft.owner, video.in_channel)?;

            // Ensure nft in buy now state
            let _ = Self::ensure_in_buy_now_state(&nft)?;

            //
            // == MUTATION SAFE ==
            //

            // Cancel sell order & update nft
            VideoById::<T>::mutate(video_id, |v| v.set_nft_status(Nft::<T> {
                transactional_status: TransactionalStatus::<T>::BuyNow(new_price),
                ..nft
            }));

            // Trigger event
            Self::deposit_event(RawEvent::BuyNowPriceUpdated(video_id, owner_id, new_price));
        }


        /// Make auction bid
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn make_open_auction_bid(
            origin,
            participant_id: T::MemberId,
            video_id: T::VideoId,
            bid_amount: BalanceOf<T>,
        ) {
            // Authorize participant under given member id
            let participant_account_id = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&participant_account_id, &participant_id)?;

            // Balance check
            let maybe_old_bid = Self::ensure_open_bid_exists(video_id, participant_id).ok();
            let old_bid_value = maybe_old_bid.as_ref().map(|bid| bid.amount);
            Self::ensure_has_sufficient_balance_for_bid(&participant_account_id,
                bid_amount,
                old_bid_value
            )?;

            // Ensure nft is already issued
            let video = Self::ensure_video_exists(&video_id)?;
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Validate parameters & return english auction
            let open_auction =  Self::ensure_in_open_auction_state(&nft)?;

            // check whitelisted participant
            open_auction.ensure_whitelisted_participant::<T>(participant_id)?;

            // ensure auction started
            let current_block = <frame_system::Module<T>>::block_number();
            open_auction.ensure_auction_started::<T>(current_block)?;

            // ensure bid can be made
            let maybe_old_bid = Self::ensure_open_bid_exists(video_id, participant_id).ok();
            open_auction.ensure_can_make_bid::<T>(current_block, bid_amount, &maybe_old_bid)?;

            //
            // == MUTATION_SAFE ==
            //

            let (nft, event) = match open_auction.buy_now_price {
                Some(buy_now_price) if bid_amount >= buy_now_price => {
                    // Make a new bid considering the old one (if any) and the "buy-now-price".
                    Self::transfer_bid_to_treasury(
                        &participant_account_id,
                        buy_now_price,
                        old_bid_value
                    )?;

                    // complete auction @ buy_now_price
                    let royalty_payment = Self::build_royalty_payment(&video, nft.creator_royalty);
                    let updated_nft = Self::complete_auction(
                        nft,
                        video.in_channel,
                        royalty_payment,
                        participant_id,
                        buy_now_price,
                    );

                    (
                        updated_nft,
                        RawEvent::BidMadeCompletingAuction(participant_id, video_id, None),
                    )
                },
                _ =>  {
                    // Make a new bid considering the old one (if any).
                    Self::transfer_bid_to_treasury(
                        &participant_account_id,
                        bid_amount,
                        old_bid_value
                    )?;

                    OpenAuctionBidByVideoAndMember::<T>::insert(
                        video_id,
                        participant_id,
                        open_auction.make_bid(bid_amount, current_block),
                    );

                    (nft,RawEvent::AuctionBidMade(participant_id, video_id, bid_amount, None))
                }
            };

            // update video
            VideoById::<T>::mutate(video_id, |v| v.set_nft_status(nft));

            // Trigger event
            Self::deposit_event(event);

        }

        /// Make auction bid
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn make_english_auction_bid(
            origin,
            participant_id: T::MemberId,
            video_id: T::VideoId,
            bid_amount: BalanceOf<T>,
        ) {
            // Authorize participant under given member id
            let participant_account_id = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&participant_account_id, &participant_id)?;

            // Ensure nft is already issued
            let video = Self::ensure_video_exists(&video_id)?;
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Validate parameters & return english auction
            let eng_auction =  Self::ensure_in_english_auction_state(&nft)?;

            // Balance check
            let old_bid_value = eng_auction.top_bid.as_ref().map(|bid| {
                if bid.bidder_id == participant_id {
                    bid.amount
                } else{
                    Zero::zero()
                }
            });
            Self::ensure_has_sufficient_balance_for_bid(
                &participant_account_id,
                bid_amount,
                old_bid_value
            )?;

            // Ensure auction is not expired
            let current_block = <frame_system::Module<T>>::block_number();
            eng_auction.ensure_auction_is_not_expired::<T>(current_block)?;

            // ensure auctio started
            eng_auction.ensure_auction_started::<T>(current_block)?;

            // ensure bidder is whitelisted
            eng_auction.ensure_whitelisted_participant::<T>(participant_id)?;

            // ensure constraints on bid amount are satisfied
            eng_auction.ensure_constraints_on_bid_amount::<T>(bid_amount)?;

            let prev_top_bidder = eng_auction.top_bid.as_ref().map(|b| b.bidder_id);

            //
            // == MUTATION_SAFE ==
            //

            if let Some(bid) = eng_auction.top_bid.as_ref() {
                let bidder_account_id =
                    T::MemberAuthenticator::controller_account_id(bid.bidder_id)?;
                Self::withdraw_bid_payment(&bidder_account_id, bid.amount)?;
            };

            let (updated_nft, event) = match eng_auction.buy_now_price {
                Some(buy_now_price) if bid_amount >= buy_now_price => {
                    // Make a new bid considering the "buy-now-price".
                    Self::transfer_bid_to_treasury(
                        &participant_account_id,
                        buy_now_price,
                        None
                    )?;

                    // complete auction @ buy_now_price
                    let royalty_payment = Self::build_royalty_payment(&video, nft.creator_royalty);
                    let updated_nft = Self::complete_auction(
                        nft,
                        video.in_channel,
                        royalty_payment,
                        participant_id,
                        buy_now_price,
                    );


                    (
                        updated_nft,
                        RawEvent::BidMadeCompletingAuction(participant_id, video_id, prev_top_bidder),
                    )
                },
                _ => {

                    // Make a new bid.
                    Self::transfer_bid_to_treasury(
                        &participant_account_id,
                        bid_amount,
                        None
                    )?;

                    // update nft auction state
                    let updated_auction = eng_auction.with_bid(bid_amount, participant_id, current_block);

                    (
                        nft.with_transactional_status(
                            TransactionalStatus::<T>::EnglishAuction(updated_auction)),
                        RawEvent::AuctionBidMade(participant_id, video_id, bid_amount, prev_top_bidder)
                    )
                }
            };

            // update video
            VideoById::<T>::mutate(video_id, |v| v.set_nft_status(updated_nft));

            // Trigger event
            Self::deposit_event(event);

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
            ensure_member_auth_success::<T>(&participant_account_id, &participant_id)?;

            // ensure nft exists
            let nft = Self::ensure_nft_exists(video_id)?;

            // ensure bid exists
            let old_bid = Self::ensure_open_bid_exists(video_id, participant_id)?;

            // if open auction is ongoing
            if let Ok(open_auction) = Self::ensure_in_open_auction_state(&nft) {

                // ensure conditions for canceling a bid are met
                let current_block = <frame_system::Module<T>>::block_number();
                open_auction.ensure_bid_can_be_canceled::<T>(current_block, &old_bid)?;
            } // else old bid

            //
            // == MUTATION SAFE ==
            //

            Self::withdraw_bid_payment(&participant_account_id, old_bid.amount)?;

            // remove
            OpenAuctionBidByVideoAndMember::<T>::remove(&video_id, &participant_id);

            // Trigger event
            Self::deposit_event(RawEvent::AuctionBidCanceled(participant_id, video_id));
        }

        /// Claim won english auction
        /// Can be called by anyone
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn settle_english_auction(
            origin,
            video_id: T::VideoId,
        ) {
            // Authorize member under given member id
            let sender = ensure_signed(origin)?;

            // Ensure nft is already issued
            let video = Self::ensure_video_exists(&video_id)?;
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Ensure nft & english auction validity for nft exists, retrieve top bid
            let english_auction = Self::ensure_in_english_auction_state(&nft)?;

            // Ensure top bid exists
            let top_bid = english_auction.ensure_top_bid_exists::<T>()?;
            let top_bidder_id = top_bid.bidder_id;

            // Ensure auction expired
            let current_block = <frame_system::Module<T>>::block_number();
            english_auction.ensure_auction_can_be_completed::<T>(current_block)?;

            //
            // == MUTATION SAFE ==
            //

            // Complete auction
            let royalty_payment = Self::build_royalty_payment(&video, nft.creator_royalty);
            let updated_nft = Self::complete_auction(
                nft,
                video.in_channel,
                royalty_payment,
                top_bidder_id,
                top_bid.amount
            );

            // Update the video
            VideoById::<T>::mutate(video_id, |v| v.set_nft_status(updated_nft));

            // Trigger event
            Self::deposit_event(RawEvent::EnglishAuctionSettled(top_bidder_id, sender, video_id));
        }

        /// Accept open auction bid
        /// Should only be called by auctioneer
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn pick_open_auction_winner(
            origin,
            owner_id: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            winner_id: T::MemberId,
            commit: BalanceOf<T>, // amount the auctioner is committed to
        ) {
            T::MemberAuthenticator::controller_account_id(winner_id).map(|_| ())?;

            // Ensure video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Ensure auction for given video id exists, retrieve corresponding one
            let auction = Self::ensure_in_open_auction_state(&nft)?;

            // Ensure actor is authorized to accept open auction bid
            ensure_actor_authorized_to_manage_nft::<T>(origin, &owner_id, &nft.owner, video.in_channel)?;

            // Ensure open auction bid exists
            let bid = Self::ensure_open_bid_exists(video_id, winner_id)?;

            // Ensure bid is related to ongoing auction
            bid.ensure_bid_is_relevant::<T>(auction.auction_id)?;

            // Ensure commit matches amount
            bid.ensure_valid_bid_commit::<T>(commit)?;

            //
            // == MUTATION SAFE ==
            //

            let royalty_payment = Self::build_royalty_payment(&video, nft.creator_royalty);
            let updated_nft = Self::complete_auction(
                nft,
                video.in_channel,
                royalty_payment,
                winner_id,
                bid.amount,
            );

            // remove bid
            OpenAuctionBidByVideoAndMember::<T>::remove(video_id, winner_id);

            // Update the video
            VideoById::<T>::mutate(video_id, |v| v.set_nft_status(updated_nft));

            // Trigger event
            Self::deposit_event(RawEvent::OpenAuctionBidAccepted(owner_id, video_id, winner_id, bid.amount));
        }

        /// Offer Nft
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn offer_nft(
            origin,
            video_id: T::VideoId,
            owner_id: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            to: T::MemberId,
            price: Option<BalanceOf<T>>,
        ) {

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(origin, &owner_id, &nft.owner, video.in_channel)?;

            // Ensure there is no pending offer or existing auction for given nft.
            Self::ensure_nft_transactional_status_is_idle(&nft)?;

            //
            // == MUTATION SAFE ==
            //

            // Set nft transactional status to InitiatedOfferToMember
            VideoById::<T>::mutate(
                video_id,
                |v| v.set_nft_status(Nft::<T> {
                    transactional_status:
                    TransactionalStatus::<T>::InitiatedOfferToMember(to, price),
                    ..nft
                })
            );

            // Trigger event
            Self::deposit_event(RawEvent::OfferStarted(video_id, owner_id, to, price));
        }

        /// Return Nft back to the original artist at no cost
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn sling_nft_back(
            origin,
            video_id: T::VideoId,
            owner_id: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
        ) {

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(origin, &owner_id, &nft.owner, video.in_channel)?;

            // Ensure there is no pending offer or existing auction for given nft.
            Self::ensure_nft_transactional_status_is_idle(&nft)?;

            //
            // == MUTATION SAFE ==
            //

            // Set nft owner to ChannelOwner
            VideoById::<T>::mutate(
                video_id,
                |v| v.set_nft_status(Nft::<T> {
                    owner: NftOwner::ChannelOwner,
                    ..nft
                })
            );

            // Trigger event
            Self::deposit_event(RawEvent::NftSlingedBackToTheOriginalArtist(video_id, owner_id));
        }

        /// Accept incoming Nft offer
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn accept_incoming_offer(
            origin,
            video_id: T::VideoId,
        ) {
            let receiver_account_id = ensure_signed(origin)?;

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Ensure new pending offer is available to proceed
            Self::ensure_new_pending_offer_available_to_proceed(&nft, &receiver_account_id)?;

            // account_id where the nft offer price is deposited
            let nft_owner_account = Self::ensure_owner_account_id(video.in_channel, &nft).ok();
            //
            // == MUTATION SAFE ==
            //

            // Complete nft offer
            let royalty_payment = Self::build_royalty_payment(&video, nft.creator_royalty);
            let nft = Self::complete_nft_offer(nft, royalty_payment, nft_owner_account, receiver_account_id);

            VideoById::<T>::mutate(video_id, |v| v.set_nft_status(nft));

            // Trigger event
            Self::deposit_event(RawEvent::OfferAccepted(video_id));
        }

        /// Sell Nft
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn sell_nft(
            origin,
            video_id: T::VideoId,
            owner_id: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            price: BalanceOf<T>,
        ) {

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(origin, &owner_id, &nft.owner, video.in_channel)?;

            // Ensure there is no pending transfer or existing auction for given nft.
            Self::ensure_nft_transactional_status_is_idle(&nft)?;

            //
            // == MUTATION SAFE ==
            //

            // Place nft sell order
            VideoById::<T>::mutate(
                video_id,
                |v| v.set_nft_status(Nft::<T> {
                    transactional_status: TransactionalStatus::<T>::BuyNow(price),
                    ..nft
                })
            );

            // Trigger event
            Self::deposit_event(RawEvent::NftSellOrderMade(video_id, owner_id, price));
        }

        /// Buy Nft
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn buy_nft(
            origin,
            video_id: T::VideoId,
            participant_id: T::MemberId,
            price_commit: BalanceOf<T>, // in order to avoid front running
        ) {

            // Authorize participant under given member id
            let participant_account_id = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&participant_account_id, &participant_id)?;

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Ensure given participant can buy nft now
            Self::ensure_can_buy_now(&nft, &participant_account_id, price_commit)?;

            // seller account
            let old_nft_owner_account_id = Self::ensure_owner_account_id(video.in_channel, &nft).ok();

            //
            // == MUTATION SAFE ==
            //

            // Buy nft
            let royalty_payment = Self::build_royalty_payment(&video, nft.creator_royalty);
            let nft = Self::buy_now(
                nft,
                royalty_payment,
                old_nft_owner_account_id,
                participant_account_id,
                participant_id
            );

            VideoById::<T>::mutate(video_id, |v| v.set_nft_status(nft));

            // Trigger event
            Self::deposit_event(RawEvent::NftBought(video_id, participant_id));
        }

        /// Channel owner remark
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn channel_owner_remark(origin, actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>, channel_id: T::ChannelId, msg: Vec<u8>) {
            let sender = ensure_signed(origin)?;
            let channel = Self::ensure_channel_exists(&channel_id)?;
            ensure_actor_auth_success::<T>(&sender, &actor)?;
            ensure_actor_is_channel_owner::<T>(&actor, &channel.owner)?;

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(RawEvent::ChannelOwnerRemarked(actor, channel_id, msg));
        }

        /// Channel collaborator remark
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn channel_collaborator_remark(origin, actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>, channel_id: T::ChannelId, msg: Vec<u8>) {
            let sender = ensure_signed(origin)?;
            let channel = Self::ensure_channel_exists(&channel_id)?;
            ensure_actor_authorized_to_update_channel_assets::<T>(&sender, &actor, &channel)?;
            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(RawEvent::ChannelCollaboratorRemarked(actor, channel_id, msg));
        }

        /// Channel moderator remark
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn channel_moderator_remark(origin, actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>, channel_id: T::ChannelId, msg: Vec<u8>) {
            let sender = ensure_signed(origin)?;
            let channel = Self::ensure_channel_exists(&channel_id)?;
            ensure_actor_auth_success::<T>(&sender, &actor)?;
            ensure_actor_is_moderator::<T>(&actor, &channel.moderators)?;

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(RawEvent::ChannelModeratorRemarked(actor, channel_id, msg));
        }

        /// NFT owner remark
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn nft_owner_remark(origin, actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>, video_id: T::VideoId, msg: Vec<u8>) {
            let video = Self::ensure_video_exists(&video_id)?;
            let nft = video.ensure_nft_is_issued::<T>()?;
            ensure_actor_authorized_to_manage_nft::<T>(origin, &actor, &nft.owner, video.in_channel)?;

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(RawEvent::NftOwnerRemarked(actor, video_id, msg));
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

    fn ensure_video_exists(video_id: &T::VideoId) -> Result<Video<T>, Error<T>> {
        ensure!(
            VideoById::<T>::contains_key(video_id),
            Error::<T>::VideoDoesNotExist
        );
        Ok(VideoById::<T>::get(video_id))
    }

    fn ensure_channel_exists(channel_id: &T::ChannelId) -> Result<Channel<T>, Error<T>> {
        ensure!(
            ChannelById::<T>::contains_key(channel_id),
            Error::<T>::ChannelDoesNotExist
        );
        Ok(ChannelById::<T>::get(channel_id))
    }

    fn ensure_post_exists(
        video_id: T::VideoId,
        post_id: T::VideoPostId,
    ) -> Result<VideoPost<T>, Error<T>> {
        ensure!(
            VideoPostById::<T>::contains_key(video_id, post_id),
            Error::<T>::VideoPostDoesNotExist
        );
        Ok(VideoPostById::<T>::get(video_id, post_id))
    }

    fn refund(
        sender: &<T as frame_system::Trait>::AccountId,
        cleanup_actor: CleanupActor,
        bloat_bond: <T as balances::Trait>::Balance,
    ) -> DispatchResult {
        match cleanup_actor {
            CleanupActor::VideoPostAuthor => {
                let cap = <T as balances::Trait>::Balance::from(T::BloatBondCap::get());

                if bloat_bond > cap {
                    let diff = bloat_bond.saturating_sub(cap);
                    ContentTreasury::<T>::withdraw(sender, cap)?;
                    let _ = balances::Module::<T>::burn(diff);
                } else {
                    ContentTreasury::<T>::withdraw(sender, bloat_bond)?;
                }
            }
            _ => {
                let _ = balances::Module::<T>::burn(bloat_bond);
            }
        }
        Ok(())
    }

    /// Convert InitTransactionalStatus to TransactionalStatus after checking requirements on the Auction variant
    fn ensure_valid_init_transactional_status(
        init_status: &InitTransactionalStatus<T>,
    ) -> Result<TransactionalStatus<T>, DispatchError> {
        match init_status {
            InitTransactionalStatus::<T>::Idle => Ok(TransactionalStatus::<T>::Idle),
            InitTransactionalStatus::<T>::InitiatedOfferToMember(member, balance) => Ok(
                TransactionalStatus::<T>::InitiatedOfferToMember(*member, *balance),
            ),
            InitTransactionalStatus::<T>::BuyNow(balance) => {
                Ok(TransactionalStatus::<T>::BuyNow(*balance))
            }
            InitTransactionalStatus::<T>::EnglishAuction(ref params) => {
                Self::validate_english_auction_params(params)?;
                let current_block = <frame_system::Module<T>>::block_number();
                Ok(TransactionalStatus::<T>::EnglishAuction(
                    EnglishAuction::<T>::new(params.clone(), current_block),
                ))
            }
            InitTransactionalStatus::<T>::OpenAuction(ref params) => {
                Self::validate_open_auction_params(params)?;
                let current_block = <frame_system::Module<T>>::block_number();
                Ok(TransactionalStatus::<T>::OpenAuction(
                    OpenAuction::<T>::new(params.clone(), T::OpenAuctionId::zero(), current_block),
                ))
            }
        }
    }

    /// Construct the Nft that is intended to be issued
    pub fn construct_owned_nft(
        issuance_params: &NftIssuanceParameters<T>,
    ) -> Result<Nft<T>, DispatchError> {
        let transactional_status = Self::ensure_valid_init_transactional_status(
            &issuance_params.init_transactional_status,
        )?;
        // The content owner will be..
        let nft_owner = if let Some(to) = issuance_params.non_channel_owner {
            NftOwner::Member(to)
        } else {
            // if `to` set to None, actor issues to ChannelOwner
            NftOwner::ChannelOwner
        };

        // Enure royalty bounds satisfied, if provided
        if let Some(ref royalty) = issuance_params.royalty {
            Self::ensure_royalty_bounds_satisfied(royalty.to_owned())?;
        }

        Ok(Nft::<T>::new(
            nft_owner,
            issuance_params.royalty,
            transactional_status,
        ))
    }

    fn bag_id_for_channel(channel_id: &T::ChannelId) -> storage::BagId<T> {
        // retrieve bag id from channel id
        let dyn_bag = DynamicBagIdType::<T::MemberId, T::ChannelId>::Channel(*channel_id);
        BagIdType::from(dyn_bag)
    }

    fn video_deletion_refund_logic(
        sender: &T::AccountId,
        video_id: &T::VideoId,
        video_post_id: &T::VideoPostId,
    ) -> DispatchResult {
        let bloat_bond = <VideoPostById<T>>::get(video_id, video_post_id).bloat_bond;
        Self::refund(&sender, CleanupActor::VideoPostAuthor, bloat_bond)?;
        Ok(())
    }

    fn compute_initial_bloat_bond() -> BalanceOf<T> {
        let storage_price =
            T::PricePerByte::get().saturating_mul((size_of::<VideoPost<T>>() as u32).into());

        let cleanup_cost = T::CleanupCost::get().saturating_add(T::CleanupMargin::get());

        max(storage_price, cleanup_cost)
    }

    // If we are trying to delete a video post we need witness verification
    fn ensure_witness_verification(
        witness: Option<<T as frame_system::Trait>::Hash>,
        replies_count: T::VideoPostId,
    ) -> DispatchResult {
        let wit_hash = witness.ok_or(Error::<T>::WitnessNotProvided)?;
        ensure!(
            <T as frame_system::Trait>::Hashing::hash_of(&replies_count) == wit_hash,
            Error::<T>::WitnessVerificationFailed,
        );
        Ok(())
    }

    // construct parameters to be upload to storage
    fn construct_upload_parameters(
        assets: &StorageAssets<T>,
        channel_id: &T::ChannelId,
        prize_source_account: &T::AccountId,
    ) -> UploadParameters<T> {
        UploadParameters::<T> {
            bag_id: Self::bag_id_for_channel(channel_id),
            object_creation_list: assets.object_creation_list.clone(),
            deletion_prize_source_account_id: prize_source_account.clone(),
            expected_data_size_fee: assets.expected_data_size_fee,
        }
    }

    fn validate_member_set(members: &BTreeSet<T::MemberId>) -> DispatchResult {
        // check if all members are valid
        let res = members
            .iter()
            .all(|member_id| <T as ContentActorAuthenticator>::validate_member_id(member_id));
        ensure!(res, Error::<T>::InvalidMemberProvided);
        Ok(())
    }

    fn verify_proof(proof: &[ProofElement<T>], item: &PullPayment<T>) -> DispatchResult {
        let candidate_root = proof.iter().fold(
            <T as frame_system::Trait>::Hashing::hash_of(item),
            |hash_v, el| match el.side {
                Side::Right => <T as frame_system::Trait>::Hashing::hash_of(&[hash_v, el.hash]),
                Side::Left => <T as frame_system::Trait>::Hashing::hash_of(&[el.hash, hash_v]),
            },
        );
        ensure!(
            candidate_root == Commitment::<T>::get(),
            Error::<T>::PaymentProofVerificationFailed
        );

        Ok(())
    }

    pub(crate) fn ensure_reward_account(
        channel: &Channel<T>,
    ) -> Result<T::AccountId, DispatchError> {
        if let Some(reward_account) = &channel.reward_account {
            Ok(reward_account.clone())
        } else {
            match &channel.owner {
                ChannelOwner::CuratorGroup(..) => Err(Error::<T>::RewardAccountIsNotSet.into()),
                ChannelOwner::Member(member_id) => {
                    T::MemberAuthenticator::controller_account_id(*member_id)
                }
            }
        }
    }

    pub(crate) fn ensure_open_bid_exists(
        video_id: T::VideoId,
        member_id: T::MemberId,
    ) -> Result<OpenAuctionBid<T>, DispatchError> {
        ensure!(
            OpenAuctionBidByVideoAndMember::<T>::contains_key(video_id, member_id),
            Error::<T>::BidDoesNotExist,
        );
        Ok(Self::open_auction_bid_by_video_and_member(
            video_id, member_id,
        ))
    }
}

decl_event!(
    pub enum Event<T>
    where
        ContentActor = ContentActor<
            <T as ContentActorAuthenticator>::CuratorGroupId,
            <T as ContentActorAuthenticator>::CuratorId,
            <T as common::MembershipTypes>::MemberId,
        >,
        MemberId = <T as common::MembershipTypes>::MemberId,
        CuratorGroupId = <T as ContentActorAuthenticator>::CuratorGroupId,
        CuratorId = <T as ContentActorAuthenticator>::CuratorId,
        VideoId = <T as Trait>::VideoId,
        VideoCategoryId = <T as Trait>::VideoCategoryId,
        ChannelId = <T as storage::Trait>::ChannelId,
        ChannelCategoryId = <T as Trait>::ChannelCategoryId,
        Channel = Channel<T>,
        DataObjectId = DataObjectId<T>,
        IsCensored = bool,
        EnglishAuctionParams = EnglishAuctionParams<T>,
        OpenAuctionParams = OpenAuctionParams<T>,
        OpenAuctionId = <T as Trait>::OpenAuctionId,
        NftIssuanceParameters = NftIssuanceParameters<T>,
        Balance = BalanceOf<T>,
        CurrencyAmount = BalanceOf<T>,
        ChannelCreationParameters = ChannelCreationParameters<T>,
        ChannelUpdateParameters = ChannelUpdateParameters<T>,
        VideoCreationParameters = VideoCreationParameters<T>,
        VideoUpdateParameters = VideoUpdateParameters<T>,
        VideoPost = VideoPost<T>,
        VideoPostId = <T as Trait>::VideoPostId,
        ReactionId = <T as Trait>::ReactionId,
        ModeratorSet = BTreeSet<<T as MembershipTypes>::MemberId>,
        Hash = <T as frame_system::Trait>::Hash,
        AccountId = <T as frame_system::Trait>::AccountId,
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
        ChannelDeleted(ContentActor, ChannelId),

        ChannelCensorshipStatusUpdated(
            ContentActor,
            ChannelId,
            IsCensored,
            Vec<u8>, /* rationale */
        ),

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

        // VideoPosts & Replies
        VideoPostCreated(VideoPost, VideoPostId),
        VideoPostTextUpdated(ContentActor, Vec<u8>, VideoPostId, VideoId),
        VideoPostDeleted(VideoPost, VideoPostId, ContentActor),
        ReactionToVideoPost(MemberId, VideoId, VideoPostId, ReactionId),
        ReactionToVideo(MemberId, VideoId, ReactionId),
        ModeratorSetUpdated(ChannelId, ModeratorSet),

        // Rewards
        CommitmentUpdated(Hash),
        ChannelRewardUpdated(Balance, ChannelId),
        MaxRewardUpdated(Balance),
        MinCashoutUpdated(Balance),
        // Nft auction
        EnglishAuctionStarted(ContentActor, VideoId, EnglishAuctionParams),
        OpenAuctionStarted(ContentActor, VideoId, OpenAuctionParams, OpenAuctionId),
        NftIssued(ContentActor, VideoId, NftIssuanceParameters),
        AuctionBidMade(MemberId, VideoId, CurrencyAmount, Option<MemberId>),
        AuctionBidCanceled(MemberId, VideoId),
        AuctionCanceled(ContentActor, VideoId),
        EnglishAuctionSettled(MemberId, AccountId, VideoId),
        BidMadeCompletingAuction(MemberId, VideoId, Option<MemberId>),
        OpenAuctionBidAccepted(ContentActor, VideoId, MemberId, CurrencyAmount),
        OfferStarted(VideoId, ContentActor, MemberId, Option<CurrencyAmount>),
        OfferAccepted(VideoId),
        OfferCanceled(VideoId, ContentActor),
        NftSellOrderMade(VideoId, ContentActor, CurrencyAmount),
        NftBought(VideoId, MemberId),
        BuyNowCanceled(VideoId, ContentActor),
        BuyNowPriceUpdated(VideoId, ContentActor, CurrencyAmount),
        NftSlingedBackToTheOriginalArtist(VideoId, ContentActor),

        /// Metaprotocols related event
        ChannelOwnerRemarked(ContentActor, ChannelId, Vec<u8>),
        ChannelCollaboratorRemarked(ContentActor, ChannelId, Vec<u8>),
        ChannelModeratorRemarked(ContentActor, ChannelId, Vec<u8>),
        NftOwnerRemarked(ContentActor, VideoId, Vec<u8>),
    }
);
