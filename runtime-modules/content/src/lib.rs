// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![recursion_limit = "512"]

#[cfg(test)]
mod tests;
use core::marker::PhantomData;
mod errors;
mod nft;
mod permissions;
mod types;

use sp_std::cmp::max;
use sp_std::mem::size_of;
use sp_std::vec;

pub use errors::*;
pub use nft::*;
pub use permissions::*;
pub use types::*;

use codec::Codec;
use codec::{Decode, Encode};

pub use storage::{
    BagIdType, DataObjectCreationParameters, DataObjectStorage, DynBagCreationParameters,
    DynamicBagIdType, UploadParameters,
};

pub use common::{
    currency::GovernanceCurrency, membership::MembershipInfoProvider, working_group::WorkingGroup,
    MembershipTypes, StorageOwnership, Url,
};
use frame_support::{
    decl_event, decl_module, decl_storage,
    dispatch::{DispatchError, DispatchResult},
    ensure,
    traits::{Currency, ExistenceRequirement, Get, ReservableCurrency},
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
use sp_std::{collections::btree_set::BTreeSet, vec::Vec};
/// Module configuration trait for Content Directory Module
pub trait Trait:
    frame_system::Trait
    + ContentActorAuthenticator
    + Clone
    + membership::Trait
    + balances::Trait
    + storage::Trait
    + GovernanceCurrency
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

    /// Deletion prize to be set when creating a dynamic bag
    type BagDeletionPrize: Get<<Self as balances::Trait>::Balance>;

    /// Type in order to retrieve controller account from channel member owner
    type MemberAuthenticator: MembershipInfoProvider<Self>;

    /// Max number of keys per curator_group.permissions_by_level map instance
    type MaxKeysPerCuratorGroupPermissionsByLevelMap: Get<u8>;

    // Channel's privilege level
    type ChannelPrivilegeLevel: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerializeDeserialize
        + PartialEq;
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

        /// Exports const -  max number of keys per curator_group.permissions_by_level map instance
        const MaxKeysPerCuratorGroupPermissionsByLevelMap: u8 = T::MaxKeysPerCuratorGroupPermissionsByLevelMap::get();

        // ======
        // Next set of extrinsics can only be invoked by lead.
        // ======

        /// Add new curator group to runtime storage
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_curator_group(
            origin,
            is_active: bool,
            permissions_by_level: ModerationPermissionsByLevel<T>
        ) {

            let sender = ensure_signed(origin)?;
            // Ensure given origin is lead
            ensure_lead_auth_success::<T>(&sender)?;
            // Ensure permissions_by_level map max. allowed size is not exceeded
            Self::ensure_permissions_by_level_map_size_not_exceeded(&permissions_by_level)?;

            //
            // == MUTATION SAFE ==
            //

            let curator_group_id = Self::next_curator_group_id();

            // Insert curator group with provided permissions
            <CuratorGroupById<T>>::insert(curator_group_id, CuratorGroup::create(is_active, &permissions_by_level));

            // Increment the next curator curator_group_id:
            <NextCuratorGroupId<T>>::mutate(|n| *n += T::CuratorGroupId::one());

            // Trigger event
            Self::deposit_event(RawEvent::CuratorGroupCreated(curator_group_id));
        }

        /// Update existing curator group's permissions
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_curator_group_permissions(
            origin,
            curator_group_id: T::CuratorGroupId,
            permissions_by_level: ModerationPermissionsByLevel<T>
        ) {
            let sender = ensure_signed(origin)?;
            // Ensure given origin is lead
            ensure_lead_auth_success::<T>(&sender)?;
            // Ensure curator group under provided curator_group_id already exist
            Self::ensure_curator_group_under_given_id_exists(&curator_group_id)?;
            // Ensure permissions_by_level map max. allowed size is not exceeded
            Self::ensure_permissions_by_level_map_size_not_exceeded(&permissions_by_level)?;

            //
            // == MUTATION SAFE ==
            //

            // Set `permissions` for curator group under given `curator_group_id`
            <CuratorGroupById<T>>::mutate(curator_group_id, |curator_group| {
                curator_group.set_permissions_by_level(&permissions_by_level)
            });

            // Trigger event
            Self::deposit_event(RawEvent::CuratorGroupPermissionsUpdated(curator_group_id, permissions_by_level))
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

            let storage_assets = params.assets.clone().unwrap_or_default();
            let bag_creation_params = DynBagCreationParameters::<T> {
                bag_id: DynBagId::<T>::Channel(channel_id),
                object_creation_list: storage_assets.object_creation_list,
                deletion_prize_source_account_id: sender,
                expected_data_size_fee: storage_assets.expected_data_size_fee,
                expected_dynamic_bag_deletion_prize: params.expected_dynamic_bag_deletion_prize,
                expected_data_object_deletion_prize: params.expected_data_object_deletion_prize,
            };

            //
            // == MUTATION SAFE ==
            //

            // create channel bag
            Storage::<T>::create_dynamic_bag(bag_creation_params)?;

            // Only increment next channel id if adding content was successful
            NextChannelId::<T>::mutate(|id| *id += T::ChannelId::one());

            // channel creation
            let channel: Channel<T> = ChannelRecord {
                owner: channel_owner,
                num_videos: 0u64,
                collaborators: params.collaborators.clone(),
                moderators: params.moderators.clone(),
                cumulative_payout_earned: BalanceOf::<T>::zero(),
                transfer_status: ChannelTransferStatus::NoActiveTransfer,
                privilege_level: Zero::zero(),
                paused_features: BTreeSet::new(),
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

            channel.ensure_has_no_active_transfer::<T>()?;

            ensure_actor_authorized_to_update_channel_assets::<T>(
                &sender,
                &actor,
                &channel,
            )?;

            channel.ensure_feature_not_paused::<T>(PausableChannelFeature::ChannelUpdate)?;

            // update collaborator set if actor is not a collaborator
            if let Some(new_collabs) = params.collaborators.as_ref() {
                ensure_actor_can_manage_collaborators::<T>(&sender, &channel.owner, &actor)?;

                channel.collaborators = new_collabs.clone();
            }

            //
            // == MUTATION SAFE ==
            //

            let upload_parameters = UploadParameters::<T> {
                bag_id: Self::bag_id_for_channel(&channel_id),
                object_creation_list: params.assets_to_upload.clone()
                    .map_or(Default::default(), |assets| assets.object_creation_list),
                deletion_prize_source_account_id: sender,
                expected_data_size_fee: params.assets_to_upload.clone()
                    .map_or(Default::default(), |assets| assets.expected_data_size_fee),
                expected_data_object_deletion_prize: params.expected_data_object_deletion_prize,
                expected_dynamic_bag_deletion_prize: Default::default(),
            };

            Storage::<T>::upload_and_delete_data_objects(
                upload_parameters,
                params.assets_to_remove.clone(),
            )?;

            // Update the channel
            ChannelById::<T>::insert(channel_id, channel.clone());

            Self::deposit_event(RawEvent::ChannelUpdated(actor, channel_id, channel, params));
        }

        // Extrinsic for updating channel privilege level (requires lead access)
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_channel_privilege_level(
            origin,
            channel_id: T::ChannelId,
            new_privilege_level: T::ChannelPrivilegeLevel,
        ) {
            let sender = ensure_signed(origin)?;

            ensure_lead_auth_success::<T>(&sender)?;

            // check that channel exists
            Self::ensure_channel_exists(&channel_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Update the channel
            ChannelById::<T>::mutate(channel_id, |channel| { channel.privilege_level = new_privilege_level });

            Self::deposit_event(RawEvent::ChannelPrivilegeLevelUpdated(channel_id, new_privilege_level));
        }

        // extrinsics for pausing/re-enabling channel features
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_channel_paused_features_as_moderator(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            new_paused_features: BTreeSet<PausableChannelFeature>,
            rationale: Vec<u8>,
        ) -> DispatchResult {

            let sender = ensure_signed(origin)?;
            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            // Check permissions for moderation actions
            let required_permissions = channel.paused_features
                .symmetric_difference(&new_paused_features)
                .map(|f| { ContentModerationAction::ChangeChannelFeatureStatus(*f) })
                .collect::<Vec<_>>();
            ensure_actor_authorized_to_perform_moderation_actions::<T>(&sender, &actor, &required_permissions, channel.privilege_level)?;

            //
            // == MUTATION SAFE ==
            //
            ChannelById::<T>::mutate(channel_id, |channel| { channel.paused_features = new_paused_features.clone() });


            // deposit event
            Self::deposit_event(RawEvent::ChannelPausedFeaturesUpdatedByModerator(actor, channel_id, new_paused_features, rationale));

            Ok(())
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

            // ensure channel bag exists and num_objects_to_delete is valid
            Self::ensure_channel_bag_can_be_dropped(channel_id, num_objects_to_delete)?;

            // try to remove the channel
            Self::try_to_perform_channel_deletion(sender, channel_id)?;

            //
            // == MUTATION SAFE ==
            //


            // deposit event
            Self::deposit_event(RawEvent::ChannelDeleted(actor, channel_id));

            Ok(())
        }

        // extrinsics for channel deletion as moderator
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_channel_as_moderator(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            num_objects_to_delete: u64,
            rationale: Vec<u8>,
        ) -> DispatchResult {

            let sender = ensure_signed(origin)?;
            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            // Permissions check
            let actions_to_perform = vec![ContentModerationAction::DeleteChannel];
            ensure_actor_authorized_to_perform_moderation_actions::<T>(&sender, &actor, &actions_to_perform, channel.privilege_level)?;

            // check that channel videos are 0
            ensure!(channel.num_videos == 0, Error::<T>::ChannelContainsVideos);

            // ensure channel bag exists and num_objects_to_delete is valid
            Self::ensure_channel_bag_can_be_dropped(channel_id, num_objects_to_delete)?;

            // try to remove the channel
            Self::try_to_perform_channel_deletion(sender, channel_id)?;

            //
            // == MUTATION SAFE ==
            //

            // deposit event
            Self::deposit_event(RawEvent::ChannelDeletedByModerator(actor, channel_id, rationale));

            Ok(())
        }

        // extrinsics for channel visibility status (hidden/visible) setting by moderator
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_channel_visibility_as_moderator(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            is_hidden: bool,
            rationale: Vec<u8>,
        ) -> DispatchResult {

            let sender = ensure_signed(origin)?;
            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            // Permissions check
            let actions_to_perform = vec![ContentModerationAction::HideChannel];
            ensure_actor_authorized_to_perform_moderation_actions::<T>(&sender, &actor, &actions_to_perform, channel.privilege_level)?;

            //
            // == MUTATION SAFE ==
            //

            // deposit event
            Self::deposit_event(RawEvent::ChannelVisibilitySetByModerator(actor, channel_id, is_hidden, rationale));

            Ok(())
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
            channel.ensure_has_no_active_transfer::<T>()?;

            ensure_actor_authorized_to_update_channel_assets::<T>(
                &sender,
                &actor,
                &channel,
            )?;

            channel.ensure_feature_not_paused::<T>(PausableChannelFeature::VideoCreation)?;
            if params.auto_issue_nft.is_some() {
                channel.ensure_feature_not_paused::<T>(PausableChannelFeature::VideoNftIssuance)?;
            }

            // next video id
            let video_id = NextVideoId::<T>::get();

            let nft_status = params.auto_issue_nft
                .as_ref()
                .map_or(
                    Ok(None),
                    |issuance_params| {
                        Some(Self::construct_owned_nft(issuance_params,video_id)).transpose()
                    }
                )?;

            // create the video struct
            let video: Video<T> = VideoRecord {
                in_channel: channel_id,
                enable_comments: params.enable_comments,
                video_post_id:  None,
                nft_status,
            };

            if let Some(upload_assets) = params.assets.as_ref() {
                let params = Self::construct_upload_parameters(
                    upload_assets,
                    &channel_id,
                    &sender,
                    params.expected_data_object_deletion_prize,
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
            let channel = Self::ensure_channel_exists(&channel_id)?;
            channel.ensure_has_no_active_transfer::<T>()?;

            // Check for permission to update channel assets
            ensure_actor_authorized_to_update_channel_assets::<T>(
                &sender,
                &actor,
                &channel,
            )?;

            channel.ensure_feature_not_paused::<T>(PausableChannelFeature::VideoUpdate)?;
            if params.auto_issue_nft.is_some() {
                channel.ensure_feature_not_paused::<T>(PausableChannelFeature::VideoNftIssuance)?;
            }

            let nft_status = params.auto_issue_nft
                .as_ref()
                .map_or(
                    Ok(None),
                    |issuance_params| {
                        ensure!(video.nft_status.is_none(), Error::<T>::NftAlreadyExists);
                        Some(Self::construct_owned_nft(issuance_params, video_id)).transpose()
                    }
                )?;


            //
            // == MUTATION SAFE ==
            //

            // upload/delete video assets from storage with commit or rollback semantics
            let upload_parameters = UploadParameters::<T> {
                bag_id: Self::bag_id_for_channel(&channel_id),
                object_creation_list: params.assets_to_upload.clone()
                    .map_or(Default::default(), |assets| assets.object_creation_list),
                deletion_prize_source_account_id: sender,
                expected_data_size_fee: params.assets_to_upload.clone()
                    .map_or(Default::default(), |assets| assets.expected_data_size_fee),
                expected_data_object_deletion_prize: params.expected_data_object_deletion_prize,
                expected_dynamic_bag_deletion_prize: Default::default(),
            };

            Storage::<T>::upload_and_delete_data_objects(
                upload_parameters,
                params.assets_to_remove.clone(),
                )?;

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
            channel.ensure_has_no_active_transfer::<T>()?;

            ensure_actor_authorized_to_update_channel_assets::<T>(
                &sender,
                &actor,
                &channel,
            )?;

            // ensure video can be removed
            Self::ensure_video_can_be_removed(&video)?;

            // Try removing the video
            Self::try_to_perform_video_deletion(&sender, channel_id, video_id, &video, &assets_to_remove)?;

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(RawEvent::VideoDeleted(actor, video_id));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_video_as_moderator(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            assets_to_remove: BTreeSet<DataObjectId<T>>,
            rationale: Vec<u8>,
        ) {
            let sender = ensure_signed(origin)?;

            // check that video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // get information regarding channel
            let channel_id = video.in_channel;
            let channel = ChannelById::<T>::get(channel_id);

            // Permissions check
            let actions_to_perform = vec![ContentModerationAction::DeleteVideo];
            ensure_actor_authorized_to_perform_moderation_actions::<T>(&sender, &actor, &actions_to_perform, channel.privilege_level)?;

            // ensure video can be removed
            Self::ensure_video_can_be_removed(&video)?;

            // Try removing the video
            Self::try_to_perform_video_deletion(&sender, channel_id, video_id, &video, &assets_to_remove)?;

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(RawEvent::VideoDeletedByModerator(actor, video_id, rationale));
        }

        // extrinsics for video visibility status (hidden/visible) setting by moderator
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_video_visibility_as_moderator(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            is_hidden: bool,
            rationale: Vec<u8>,
        ) -> DispatchResult {

            let sender = ensure_signed(origin)?;

            // check that video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // get information regarding channel
            let channel_id = video.in_channel;
            let channel = ChannelById::<T>::get(channel_id);

            // Permissions check
            let actions_to_perform = vec![ContentModerationAction::HideVideo];
            ensure_actor_authorized_to_perform_moderation_actions::<T>(&sender, &actor, &actions_to_perform, channel.privilege_level)?;

            //
            // == MUTATION SAFE ==
            //

            // deposit event
            Self::deposit_event(RawEvent::VideoVisibilitySetByModerator(actor, video_id, is_hidden, rationale));

            Ok(())
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
            channel.ensure_has_no_active_transfer::<T>()?;

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
            channel.ensure_has_no_active_transfer::<T>()?;

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
            let channel = Self::ensure_channel_exists(&channel_id)?;
            channel.ensure_has_no_active_transfer::<T>()?;

            let owner = channel.owner;

            ensure_actor_can_manage_moderators::<T>(
                &sender,
                &owner,
                &actor,
            )?;

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
            channel.ensure_has_no_active_transfer::<T>()?;


            ensure_actor_authorized_to_claim_payment::<T>(origin, &actor, &channel.owner)?;

            channel.ensure_feature_not_paused::<T>(PausableChannelFeature::CreatorCashout)?;

            let cashout = item
                .cumulative_payout_claimed
                .saturating_sub(channel.cumulative_payout_earned);

            ensure!(
                <MaxRewardAllowed<T>>::get() > item.cumulative_payout_claimed,
                Error::<T>::TotalRewardLimitExceeded
            );
            ensure!(<MinCashoutAllowed<T>>::get() < cashout, Error::<T>::UnsufficientCashoutAmount);
            Self::verify_proof(&proof, &item)?;

            // Deposit to creator
            ContentTreasury::<T>::deposit_to_channel_account(item.channel_id, cashout);

            ChannelById::<T>::mutate(
                &item.channel_id,
                |channel| channel.cumulative_payout_earned = item.cumulative_payout_claimed
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

            channel.ensure_feature_not_paused::<T>(PausableChannelFeature::VideoNftIssuance)?;

            // The content owner will be..
            let nft_status = Self::construct_owned_nft(&params, video_id)?;

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
            let auction = OpenAuction::<T>::new(auction_params.clone(), new_nonce);

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
            let auction = EnglishAuction::<T>::new(auction_params.clone());

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
            Self::ensure_has_sufficient_balance(&participant_account_id, bid_amount)?;

            // Ensure nft is already issued
            let video = Self::ensure_video_exists(&video_id)?;
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Validate parameters & return english auction
            let open_auction =  Self::ensure_in_open_auction_state(&nft)?;

            // check whitelisted participant
            open_auction.ensure_whitelisted_participant::<T>(participant_id)?;

            // ensure bid can be made
            let current_block = <frame_system::Module<T>>::block_number();
            let maybe_old_bid = Self::ensure_open_bid_exists(video_id, participant_id).ok();
            open_auction.ensure_can_make_bid::<T>(current_block, bid_amount, &maybe_old_bid)?;

            //
            // == MUTATION_SAFE ==
            //

            let (nft, event) = match open_auction.buy_now_price {
                Some(buy_now_price) if bid_amount >= buy_now_price => {
                    // complete auction @ buy_now_price
                    let updated_nft = Self::complete_auction(
                        nft,
                        video.in_channel,
                        participant_account_id,
                        participant_id,
                        buy_now_price,
                    );

                    // remove eventual superseeded bid
                    if maybe_old_bid.is_some() {
                        OpenAuctionBidByVideoAndMember::<T>::remove(
                            video_id,
                            participant_id,
                        )
                    }

                    (
                        updated_nft,
                        RawEvent::BidMadeCompletingAuction(participant_id, video_id),
                    )
                },
                _ =>  {
                    maybe_old_bid.map_or((), |bid| {
                            Balances::<T>::unreserve(
                                &participant_account_id,
                                bid.amount
                            );
                        });

                    // unfallible: can_reserve already called
                    Balances::<T>::reserve(&participant_account_id, bid_amount)?;

                    OpenAuctionBidByVideoAndMember::<T>::insert(
                        video_id,
                        participant_id,
                        open_auction.make_bid(bid_amount, current_block),
                    );

                    (nft,RawEvent::AuctionBidMade(participant_id, video_id, bid_amount))
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

            // Balance check
            Self::ensure_has_sufficient_balance(&participant_account_id, bid_amount)?;

            // Ensure nft is already issued
            let video = Self::ensure_video_exists(&video_id)?;
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Validate parameters & return english auction
            let eng_auction =  Self::ensure_in_english_auction_state(&nft)?;

            // Ensure auction is not expired
            let current_block = <frame_system::Module<T>>::block_number();
            eng_auction.ensure_auction_is_not_expired::<T>(current_block)?;

            // ensure bidder is whitelisted
            eng_auction.ensure_whitelisted_participant::<T>(participant_id)?;

            // ensure constraints on bid amount are satisfied
            eng_auction.ensure_constraints_on_bid_amount::<T>(bid_amount)?;

            //
            // == MUTATION_SAFE ==
            //

            let (updated_nft, event) = match eng_auction.buy_now_price {
                Some(buy_now_price) if bid_amount >= buy_now_price => {
                    // complete auction @ buy_now_price
                    let updated_nft = Self::complete_auction(
                        nft,
                        video.in_channel,
                        participant_account_id,
                        participant_id,
                        buy_now_price,
                    );

                    (
                        updated_nft,
                        RawEvent::BidMadeCompletingAuction(participant_id, video_id),
                    )
                },
                _ => {
                    // unreseve balance from previous bid
                    if let Some(ref bid) = eng_auction.top_bid {
                        if bid.bidder_id == participant_id {
                            Balances::<T>::unreserve(
                                &participant_account_id,
                                bid.amount
                            );
                        }
                    }

                    // Reserve amount for new bid
                    Balances::<T>::reserve(&participant_account_id, bid_amount)?;

                    // update nft auction state
                    let updated_auction = eng_auction.with_bid(bid_amount, participant_id, current_block);

                    (
                        nft.with_transactional_status(
                            TransactionalStatus::<T>::EnglishAuction(updated_auction)),
                        RawEvent::AuctionBidMade(participant_id, video_id, bid_amount)
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

            // unreserve amount
            Balances::<T>::unreserve(&participant_account_id, old_bid.amount);

            // remove
            OpenAuctionBidByVideoAndMember::<T>::remove(&video_id, &participant_id);

            // Trigger event
            Self::deposit_event(RawEvent::AuctionBidCanceled(participant_id, video_id));
        }

        /// Claim won english auction
        /// Can be called by anyone
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn claim_won_english_auction(
            origin,
            member_id: T::MemberId,
            video_id: T::VideoId,
        ) {
            // Authorize member under given member id
            let member_account_id = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&member_account_id, &member_id)?;

            // Ensure nft is already issued
            let video = Self::ensure_video_exists(&video_id)?;
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Ensure nft & english auction validity for nft exists, retrieve top bid
            let english_auction = Self::ensure_in_english_auction_state(&nft)?;

            // Ensure top bid exists
            let top_bid = english_auction.ensure_top_bid_exists::<T>()?;

            // Ensure auction expired
            let current_block = <frame_system::Module<T>>::block_number();
            english_auction.ensure_auction_can_be_completed::<T>(current_block)?;

            //
            // == MUTATION SAFE ==
            //

            // Complete auction
            let updated_nft = Self::complete_auction(
                nft,
                video.in_channel,
                member_account_id,
                member_id,
                top_bid.amount
            );

            // Update the video
            VideoById::<T>::mutate(video_id, |v| v.set_nft_status(updated_nft));

            // Trigger event
            Self::deposit_event(RawEvent::EnglishAuctionCompleted(member_id, video_id));
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
            let winner_account_id = T::MemberAuthenticator::controller_account_id(winner_id)?;
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

            let updated_nft = Self::complete_auction(
                nft,
                video.in_channel,
                winner_account_id,
                winner_id,
                bid.amount,
            );

            // remove bid
            OpenAuctionBidByVideoAndMember::<T>::remove(video_id, winner_id);

            // Update the video
            VideoById::<T>::mutate(video_id, |v| v.set_nft_status(updated_nft));

            // Trigger event
            Self::deposit_event(RawEvent::OpenAuctionBidAccepted(owner_id, video_id, bid.amount));
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

            let owner_account_id = Self::ensure_owner_account_id(video.in_channel, &nft)?;

            //
            // == MUTATION SAFE ==
            //

            // Complete nft offer
            let nft = Self::complete_nft_offer(video.in_channel, nft, owner_account_id, receiver_account_id);

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

            let owner_account_id = ContentTreasury::<T>::account_for_channel(video.in_channel);

            //
            // == MUTATION SAFE ==
            //

            // Buy nft
            let nft = Self::buy_now(video.in_channel, nft, owner_account_id, participant_account_id, participant_id);

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

        /// Updates channel transfer status to whatever the current owner wants.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_channel_transfer_status(
            origin,
            channel_id: T::ChannelId,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            new_transfer_status: ChannelTransferStatus<T::MemberId, T::CuratorGroupId, BalanceOf<T>>
        ) {
            let channel = Self::ensure_channel_exists(&channel_id)?;
            ensure_actor_authorized_to_transfer_channel::<T>(origin, &actor, &channel.owner)?;

            //
            // == MUTATION SAFE ==
            //

            ChannelById::<T>::mutate(&channel_id,
                |channel| channel.transfer_status = new_transfer_status.clone()
            );

            Self::deposit_event(
                RawEvent::UpdateChannelTransferStatus(channel_id, actor, new_transfer_status)
            );
        }

        /// Accepts channel transfer.
        /// `commitment_params` is required to prevent changing the transfer conditions.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn accept_channel_transfer(
            origin,
            channel_id: T::ChannelId,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            commitment_params: TransferParameters<T::MemberId, BalanceOf<T>>
        ) {
            let channel = Self::ensure_channel_exists(&channel_id)?;
            ensure_actor_authorized_to_accept_channel::<T>(origin, &actor, &channel.owner)?;

            if let ChannelTransferStatus::PendingTransfer(ref params) = channel.transfer_status {
                ensure!(
                    params.transfer_params == commitment_params,
                    Error::<T>::InvalidChannelTransferCommitmentParams
                );
            } else {
                return Err(Error::<T>::InvalidChannelTransferStatus.into())
            }

            //
            // == MUTATION SAFE ==
            //

            if let ChannelTransferStatus::PendingTransfer(params) = channel.transfer_status {
                ChannelById::<T>::mutate(&channel_id, |channel| {
                    channel.transfer_status = ChannelTransferStatus::NoActiveTransfer;
                    channel.owner = params.new_owner.clone();
                });

                Self::deposit_event(
                    RawEvent::ChannelTransferAccepted(channel_id, actor, commitment_params)
                );
            }
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

    // Ensure given video has no associated nft
    fn ensure_video_can_be_removed(video: &Video<T>) -> DispatchResult {
        // Ensure nft for this video have not been issued
        video.ensure_nft_is_not_issued::<T>()?;
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
        video_id: T::VideoId,
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
                Ok(TransactionalStatus::<T>::EnglishAuction(
                    EnglishAuction::<T>::new(params.clone()),
                ))
            }
            InitTransactionalStatus::<T>::OpenAuction(ref params) => {
                Self::validate_open_auction_params(params)?;
                let new_nonce = Self::ensure_nft_exists(video_id)
                    .map(|nft| nft.open_auctions_nonce.saturating_add(One::one()))?;
                Ok(TransactionalStatus::<T>::OpenAuction(
                    OpenAuction::<T>::new(params.clone(), new_nonce),
                ))
            }
        }
    }

    /// Construct the Nft that is intended to be issued
    pub fn construct_owned_nft(
        issuance_params: &NftIssuanceParameters<T>,
        video_id: T::VideoId,
    ) -> Result<Nft<T>, DispatchError> {
        let transactional_status = Self::ensure_valid_init_transactional_status(
            &issuance_params.init_transactional_status,
            video_id,
        )?;
        // The content owner will be..
        let nft_owner = if let Some(to) = issuance_params.non_channel_owner {
            NftOwner::Member(to)
        } else {
            // if `to` set to None, actor issues to ChannelOwner
            NftOwner::ChannelOwner
        };

        // Enure royalty bounds satisfied, if provided
        if let Some(royalty) = issuance_params.royalty.as_ref() {
            Self::ensure_royalty_bounds_satisfied(*royalty)?;
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
        expected_data_object_deletion_prize: BalanceOf<T>,
    ) -> UploadParameters<T> {
        UploadParameters::<T> {
            bag_id: Self::bag_id_for_channel(channel_id),
            object_creation_list: assets.object_creation_list.clone(),
            deletion_prize_source_account_id: prize_source_account.clone(),
            expected_data_size_fee: assets.expected_data_size_fee,
            expected_data_object_deletion_prize,
            expected_dynamic_bag_deletion_prize: Default::default(),
        }
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

    fn try_to_perform_video_deletion(
        sender: &T::AccountId,
        channel_id: T::ChannelId,
        video_id: T::VideoId,
        video: &Video<T>,
        assets_to_remove: &BTreeSet<DataObjectId<T>>,
    ) -> DispatchResult {
        // delete assets from storage with upload and rollback semantics
        if !assets_to_remove.is_empty() {
            Storage::<T>::delete_data_objects(
                sender.clone(),
                Self::bag_id_for_channel(&channel_id),
                assets_to_remove.clone(),
            )?;
        }

        // bloat bond logic: channel owner is refunded
        // (this should never fail!)
        video
            .video_post_id
            .as_ref()
            .map(|video_post_id| {
                Self::video_deletion_refund_logic(&sender, &video_id, &video_post_id)
            })
            .transpose()?;

        // Remove video
        VideoById::<T>::remove(video_id);

        // Remove all comments related
        <VideoPostById<T>>::remove_prefix(video_id);

        // Update corresponding channel
        // Remove recently deleted video from the channel
        ChannelById::<T>::mutate(channel_id, |channel| {
            channel.num_videos = channel.num_videos.saturating_sub(1)
        });

        Ok(())
    }

    fn ensure_channel_bag_can_be_dropped(
        channel_id: T::ChannelId,
        num_objects_to_delete: u64,
    ) -> DispatchResult {
        let dynamic_bag_id = storage::DynamicBagId::<T>::Channel(channel_id);
        let bag_id = storage::BagIdType::from(dynamic_bag_id);

        if let Ok(bag) = T::DataObjectStorage::ensure_bag_exists(&bag_id) {
            // channel has a dynamic bag associated
            // ensure that bag size provided is valid
            ensure!(
                bag.objects_number == num_objects_to_delete,
                Error::<T>::InvalidBagSizeSpecified
            );

            Ok(())
        } else {
            debug_assert!(false, "Channel bag missing for channel {:?}", channel_id);
            Err(Error::<T>::ChannelBagMissing.into())
        }
    }

    fn try_to_perform_channel_deletion(
        sender: T::AccountId,
        channel_id: T::ChannelId,
    ) -> DispatchResult {
        let dynamic_bag_id = storage::DynamicBagId::<T>::Channel(channel_id);

        // try to delete channel dynamic bag with objects
        Storage::<T>::delete_dynamic_bag(sender, dynamic_bag_id)?;

        //
        // == MUTATION SAFE ==
        //

        // remove channel from on chain state
        ChannelById::<T>::remove(channel_id);

        Ok(())
    }

    fn ensure_permissions_by_level_map_size_not_exceeded(
        permissions_by_level: &ModerationPermissionsByLevel<T>,
    ) -> DispatchResult {
        ensure!(
            permissions_by_level.len()
                <= T::MaxKeysPerCuratorGroupPermissionsByLevelMap::get().into(),
            Error::<T>::CuratorGroupMaxPermissionsByLevelMapSizeExceeded
        );
        Ok(())
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
        EnglishAuctionParams = EnglishAuctionParams<T>,
        OpenAuctionParams = OpenAuctionParams<T>,
        OpenAuctionId = <T as Trait>::OpenAuctionId,
        NftIssuanceParameters = NftIssuanceParameters<T>,
        Balance = BalanceOf<T>,
        ChannelCreationParameters = ChannelCreationParameters<T>,
        ChannelUpdateParameters = ChannelUpdateParameters<T>,
        VideoCreationParameters = VideoCreationParameters<T>,
        VideoUpdateParameters = VideoUpdateParameters<T>,
        VideoPost = VideoPost<T>,
        VideoPostId = <T as Trait>::VideoPostId,
        ReactionId = <T as Trait>::ReactionId,
        ModeratorSet = BTreeSet<<T as MembershipTypes>::MemberId>,
        Hash = <T as frame_system::Trait>::Hash,
        ChannelPrivilegeLevel = <T as Trait>::ChannelPrivilegeLevel,
        ModerationPermissionsByLevel = ModerationPermissionsByLevel<T>,
        ChannelTransferStatus = ChannelTransferStatus<
            <T as common::MembershipTypes>::MemberId,
            <T as ContentActorAuthenticator>::CuratorGroupId,
            BalanceOf<T>,
        >,
        TransferParameters =
            TransferParameters<<T as common::MembershipTypes>::MemberId, BalanceOf<T>>,
    {
        // Curators
        CuratorGroupCreated(CuratorGroupId),
        CuratorGroupPermissionsUpdated(CuratorGroupId, ModerationPermissionsByLevel),
        CuratorGroupStatusSet(CuratorGroupId, bool /* active status */),
        CuratorAdded(CuratorGroupId, CuratorId),
        CuratorRemoved(CuratorGroupId, CuratorId),

        // Channels
        ChannelCreated(ContentActor, ChannelId, Channel, ChannelCreationParameters),
        ChannelUpdated(ContentActor, ChannelId, Channel, ChannelUpdateParameters),
        ChannelPrivilegeLevelUpdated(ChannelId, ChannelPrivilegeLevel),
        ChannelAssetsRemoved(ContentActor, ChannelId, BTreeSet<DataObjectId>, Channel),
        ChannelDeleted(ContentActor, ChannelId),
        ChannelDeletedByModerator(ContentActor, ChannelId, Vec<u8> /* rationale */),
        ChannelVisibilitySetByModerator(
            ContentActor,
            ChannelId,
            bool,
            Vec<u8>, /* rationale */
        ),
        ChannelPausedFeaturesUpdatedByModerator(
            ContentActor,
            ChannelId,
            BTreeSet<PausableChannelFeature>,
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
        VideoDeletedByModerator(ContentActor, VideoId, Vec<u8> /* rationale */),
        VideoVisibilitySetByModerator(ContentActor, VideoId, bool, Vec<u8> /* rationale */),

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
        AuctionBidMade(MemberId, VideoId, Balance),
        AuctionBidCanceled(MemberId, VideoId),
        AuctionCanceled(ContentActor, VideoId),
        EnglishAuctionCompleted(MemberId, VideoId),
        BidMadeCompletingAuction(MemberId, VideoId),
        OpenAuctionBidAccepted(ContentActor, VideoId, Balance),
        OfferStarted(VideoId, ContentActor, MemberId, Option<Balance>),
        OfferAccepted(VideoId),
        OfferCanceled(VideoId, ContentActor),
        NftSellOrderMade(VideoId, ContentActor, Balance),
        NftBought(VideoId, MemberId),
        BuyNowCanceled(VideoId, ContentActor),
        BuyNowPriceUpdated(VideoId, ContentActor, Balance),
        NftSlingedBackToTheOriginalArtist(VideoId, ContentActor),

        /// Metaprotocols related event
        ChannelOwnerRemarked(ContentActor, ChannelId, Vec<u8>),
        ChannelCollaboratorRemarked(ContentActor, ChannelId, Vec<u8>),
        ChannelModeratorRemarked(ContentActor, ChannelId, Vec<u8>),
        NftOwnerRemarked(ContentActor, VideoId, Vec<u8>),

        /// Channel transfer
        UpdateChannelTransferStatus(ChannelId, ContentActor, ChannelTransferStatus),
        ChannelTransferAccepted(ChannelId, ContentActor, TransferParameters),
    }
);
