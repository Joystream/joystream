// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![recursion_limit = "512"]
#![allow(clippy::unused_unit)]

mod errors;
mod nft;
mod permissions;
mod tests;
mod types;

use core::marker::PhantomData;
use project_token::traits::PalletToken;
use project_token::types::{
    TokenIssuanceParametersOf, TokenSaleParamsOf, TransfersWithVestingOf, UploadContextOf,
    YearlyRate,
};
use sp_std::vec;

pub use errors::*;
pub use nft::*;
pub use permissions::*;
use scale_info::TypeInfo;
pub use types::*;

use codec::{Codec, Decode, Encode};

pub use storage::{
    BagIdType, DataObjectCreationParameters, DataObjectStorage, DynBagCreationParameters,
    DynamicBagIdType, StaticBagId, UploadParameters,
};

pub use common::{
    council::CouncilBudgetManager,
    membership::MembershipInfoProvider,
    working_group::{WorkingGroup, WorkingGroupBudgetHandler},
    MembershipTypes, StorageOwnership, Url,
};
use frame_support::{
    decl_event, decl_module, decl_storage,
    dispatch::{DispatchError, DispatchResult},
    ensure,
    traits::{Currency, ExistenceRequirement, Get},
    PalletId, Parameter,
};

use frame_system::{ensure_root, ensure_signed};

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_arithmetic::{
    traits::{BaseArithmetic, One, Saturating, Zero},
    Perbill,
};
use sp_runtime::traits::{AccountIdConversion, Hash, MaybeSerializeDeserialize, Member};
use sp_std::{borrow::ToOwned, collections::btree_set::BTreeSet, vec::Vec};

/// Module configuration trait for Content Directory Module
pub trait Config:
    frame_system::Config
    + ContentActorAuthenticator
    + Clone
    + membership::Config
    + balances::Config
    + storage::Config
    + project_token::Config
{
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as frame_system::Config>::Event>;

    /// Type of identifier for Videos
    type VideoId: NumericIdentifier;

    /// Type of identifier for OpenAuction
    type OpenAuctionId: NumericIdentifier;

    /// Type of identifier for TransferId
    type TransferId: NumericIdentifier;

    /// The maximum number of curators per group constraint
    type MaxNumberOfCuratorsPerGroup: Get<MaxNumber>;

    /// The storage type used
    type DataObjectStorage: storage::DataObjectStorage<Self>;

    /// Content Module Id
    type ModuleId: Get<PalletId>;

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

    /// Content working group pallet integration.
    type ContentWorkingGroup: common::working_group::WorkingGroupBudgetHandler<
        Self::AccountId,
        BalanceOf<Self>,
    >;

    /// Provides an access for the council budget.
    type CouncilBudgetManager: CouncilBudgetManager<Self::AccountId, BalanceOf<Self>>;

    /// Default global daily NFT limit.
    type DefaultGlobalDailyNftLimit: Get<LimitPerPeriod<Self::BlockNumber>>;

    /// Default global weekly NFT limit.
    type DefaultGlobalWeeklyNftLimit: Get<LimitPerPeriod<Self::BlockNumber>>;

    /// Default channel daily NFT limit.
    type DefaultChannelDailyNftLimit: Get<LimitPerPeriod<Self::BlockNumber>>;

    /// Default channel weekly NFT limit.
    type DefaultChannelWeeklyNftLimit: Get<LimitPerPeriod<Self::BlockNumber>>;

    /// Interface for Creator Tokens functionality
    type ProjectToken: PalletToken<
        Self::TokenId,
        Self::MemberId,
        Self::AccountId,
        BalanceOf<Self>,
        TokenIssuanceParametersOf<Self>,
        Self::BlockNumber,
        TokenSaleParamsOf<Self>,
        UploadContextOf<Self>,
        TransfersWithVestingOf<Self>,
    >;

    /// Minimum cashout allowed limit
    type MinimumCashoutAllowedLimit: Get<BalanceOf<Self>>;

    /// Max cashout allowed limit
    type MaximumCashoutAllowedLimit: Get<BalanceOf<Self>>;
}

decl_storage! {
    trait Store for Module<T: Config> as Content {
        pub ChannelById get(fn channel_by_id):
        map hasher(blake2_128_concat) T::ChannelId => Channel<T>;

        pub VideoById get(fn video_by_id): map hasher(blake2_128_concat) T::VideoId => Video<T>;

        pub NextChannelId get(fn next_channel_id) config(): T::ChannelId;

        pub NextVideoId get(fn next_video_id) config(): T::VideoId;

        pub NextTransferId get(fn next_transfer_id) config(): T::TransferId;

        pub NextCuratorGroupId get(fn next_curator_group_id) config(): T::CuratorGroupId;

        pub CuratorGroupById get(fn curator_group_by_id):
        map hasher(blake2_128_concat) T::CuratorGroupId => CuratorGroup<T>;

        pub Commitment get(fn commitment): <T as frame_system::Config>::Hash;

        /// The state bloat bond for the channel (helps preventing the state bloat).
        pub ChannelStateBloatBondValue get (fn channel_state_bloat_bond_value) config(): BalanceOf<T>;

        ///The state bloat bond for the video (helps preventing the state bloat).
        pub VideoStateBloatBondValue get (fn video_state_bloat_bond_value) config(): BalanceOf<T>;

        pub MaxCashoutAllowed get(fn max_cashout_allowed) config(): BalanceOf<T>;

        pub MinCashoutAllowed get(fn min_cashout_allowed) config(): BalanceOf<T>;

        pub ChannelCashoutsEnabled get(fn channel_cashouts_enabled) config(): bool;

        /// Min auction duration
        pub MinAuctionDuration get(fn min_auction_duration) config(): T::BlockNumber;

        /// Max auction duration
        pub MaxAuctionDuration get(fn max_auction_duration) config(): T::BlockNumber;

        /// Min auction extension period
        pub MinAuctionExtensionPeriod
        get(fn min_auction_extension_period) config(): T::BlockNumber;

        /// Max auction extension period
        pub MaxAuctionExtensionPeriod
        get(fn max_auction_extension_period) config(): T::BlockNumber;

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

        /// Global daily NFT counter.
        pub GlobalDailyNftCounter get(fn global_daily_nft_counter):
            NftCounter<T::BlockNumber>;

        /// Global weekly NFT counter.
        pub GlobalWeeklyNftCounter get(fn global_weekly_nft_counter):
            NftCounter<T::BlockNumber>;

        /// Global daily NFT limit.
        pub GlobalDailyNftLimit get(fn global_daily_nft_limit):
            LimitPerPeriod<T::BlockNumber>;

        /// Global weekly NFT limit.
        pub GlobalWeeklyNftLimit get(fn global_weekly_nft_limit):
        LimitPerPeriod<T::BlockNumber>;

        /// NFT limits enabled or not
        /// Can be updated in flight by the Council
        pub NftLimitsEnabled get(fn nft_limits_enabled) config(): bool;

    }
    add_extra_genesis {
        build(|_| {
            // We set initial global NFT limits.
            GlobalDailyNftLimit::<T>::put(T::DefaultGlobalDailyNftLimit::get());
            GlobalWeeklyNftLimit::<T>::put(T::DefaultGlobalWeeklyNftLimit::get());
        });
    }
}

decl_module! {
    pub struct Module<T: Config> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Initializing events
        fn deposit_event() = default;

        /// Exports const -  max number of curators per group
        const MaxNumberOfCuratorsPerGroup: MaxNumber = T::MaxNumberOfCuratorsPerGroup::get();

        /// Exports const -  max number of keys per curator_group.permissions_by_level map instance
        const MaxKeysPerCuratorGroupPermissionsByLevelMap: u8 = T::MaxKeysPerCuratorGroupPermissionsByLevelMap::get();

        /// Exports const - default global daily NFT limit.
        const DefaultGlobalDailyNftLimit: LimitPerPeriod<T::BlockNumber> =
            T::DefaultGlobalDailyNftLimit::get();

        /// Exports const - default global weekly NFT limit.
        const DefaultGlobalWeeklyNftLimit: LimitPerPeriod<T::BlockNumber> =
            T::DefaultGlobalDailyNftLimit::get();

        /// Exports const - default channel daily NFT limit.
        const DefaultChannelDailyNftLimit: LimitPerPeriod<T::BlockNumber> =
            T::DefaultGlobalDailyNftLimit::get();

        /// Exports const - default channel weekly NFT limit.
        const DefaultChannelWeeklyNftLimit: LimitPerPeriod<T::BlockNumber> =
            T::DefaultGlobalDailyNftLimit::get();

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
            permissions: ChannelAgentPermissions,
        ) {

            // Ensure given origin is lead
            let sender = ensure_signed(origin)?;
            // Ensure given origin is lead
            ensure_lead_auth_success::<T>(&sender)?;

            // Ensure curator group under provided curator_group_id already exist,
            // retrieve corresponding one
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
                curator_group.get_curators_mut().insert(curator_id, permissions.clone());
            });

            // Trigger event
            Self::deposit_event(RawEvent::CuratorAdded(curator_group_id, curator_id, permissions));
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

            // Ensure curator group under provided curator_group_id already exist,
            // retrieve corresponding one
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
            channel_owner: ChannelOwner<T::MemberId, T::CuratorGroupId>,
            params: ChannelCreationParameters<T>,
        ) {
            // channel creator account
            let sender = ensure_signed(origin)?;

            ensure_is_authorized_to_act_as_channel_owner::<T>(
                &sender,
                &channel_owner,
            )?;

            let channel_state_bloat_bond = Self::channel_state_bloat_bond_value();

            // ensure channel state bloat bond
            ensure!(
                params.expected_channel_state_bloat_bond
                    == channel_state_bloat_bond,
                Error::<T>::ChannelStateBloatBondChanged,
            );

            // ensure collaborator member ids are valid
            Self::validate_member_set(&params.collaborators.keys().cloned().collect())?;

            // next channel id
            let channel_id = NextChannelId::<T>::get();

            let storage_assets = params.assets.clone().unwrap_or_default();
            let num_objs = storage_assets.object_creation_list.len();

            let total_size = storage_assets.object_creation_list.iter().fold(0, |acc, obj_param| acc.saturating_add(obj_param.size));
            let funds_needed = <T as Config>::DataObjectStorage::funds_needed_for_upload(num_objs, total_size);
            let total_funds_needed = channel_state_bloat_bond.saturating_add(funds_needed);

            Self::ensure_channel_creation_sufficient_balance(&sender, total_funds_needed)?;

            let bag_creation_params = DynBagCreationParameters::<T> {
                bag_id: DynBagId::<T>::Channel(channel_id),
                object_creation_list: storage_assets.object_creation_list,
                state_bloat_bond_source_account_id: sender.clone(),
                expected_data_size_fee: storage_assets.expected_data_size_fee,
                expected_data_object_state_bloat_bond: params.expected_data_object_state_bloat_bond,
                storage_buckets: params.storage_buckets.clone(),
                distribution_buckets: params.distribution_buckets.clone(),
            };

            //
            // == MUTATION SAFE ==
            //

            let _ = Balances::<T>::slash(&sender, channel_state_bloat_bond);

            // create channel bag
            let (_, data_objects_ids) = Storage::<T>::create_dynamic_bag(bag_creation_params)?;

            // Only increment next channel id if adding content was successful
            NextChannelId::<T>::mutate(|id| *id += T::ChannelId::one());

            // channel creation
            let channel: Channel<T> = ChannelRecord {
                owner: channel_owner,
                num_videos: 0u64,
                collaborators: params.collaborators.clone(),
                cumulative_reward_claimed: BalanceOf::<T>::zero(),
                transfer_status: ChannelTransferStatus::NoActiveTransfer,
                privilege_level: Zero::zero(),
                paused_features: BTreeSet::new(),
                data_objects: data_objects_ids,
                daily_nft_limit: T::DefaultChannelDailyNftLimit::get(),
                weekly_nft_limit: T::DefaultChannelWeeklyNftLimit::get(),
                daily_nft_counter: Default::default(),
                weekly_nft_counter: Default::default(),
                creator_token_id: None,
                channel_state_bloat_bond
            };

            // add channel to onchain state
            ChannelById::<T>::insert(channel_id, channel.clone());

            // retrieve channel account and emit it as part of the event
            let channel_account = ContentTreasury::<T>::account_for_channel(channel_id);

            Self::deposit_event(RawEvent::ChannelCreated(channel_id, channel, params, channel_account));
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
            let channel = Self::ensure_channel_exists(&channel_id)?;

            channel.ensure_has_no_active_transfer::<T>()?;

            // permissions check
            ensure_actor_authorized_to_perform_channel_update::<T>(
                &sender,
                &actor,
                &channel,
                &params
            )?;

            channel.ensure_feature_not_paused::<T>(PausableChannelFeature::ChannelUpdate)?;

            if let Some(new_collabs) = params.collaborators.as_ref() {
                Self::validate_member_set(&new_collabs.keys().cloned().collect())?;
            }

            Self::ensure_assets_to_remove_are_part_of_assets_set(&params.assets_to_remove, &channel.data_objects)?;

            //
            // == MUTATION SAFE ==
            //

            let assets_to_upload = params.assets_to_upload.clone().unwrap_or_default();

            let upload_parameters = UploadParameters::<T> {
                bag_id: Self::bag_id_for_channel(&channel_id),
                object_creation_list: assets_to_upload.object_creation_list,
                state_bloat_bond_source_account_id: sender,
                expected_data_size_fee: assets_to_upload.expected_data_size_fee,
                expected_data_object_state_bloat_bond: params.expected_data_object_state_bloat_bond            };

            let new_data_object_ids = Storage::<T>::upload_and_delete_data_objects(
                upload_parameters,
                params.assets_to_remove.clone(),
            )?;

            // Update the channel
            ChannelById::<T>::mutate(channel_id, |channel| {
                channel.data_objects = Self::create_updated_data_objects_set(&channel.data_objects, &new_data_object_ids, &params.assets_to_remove);
                if let Some(new_collabs) = params.collaborators.as_ref() {
                    channel.collaborators = new_collabs.clone();
                }
            });

            Self::deposit_event(RawEvent::ChannelUpdated(actor, channel_id, params, new_data_object_ids));
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

            // ensure no creator token is issued for the channel
            channel.ensure_creator_token_not_issued::<T>()?;

            // permissions check
            ensure_actor_authorized_to_delete_channel::<T>(&sender, &actor, &channel)?;

            // check that channel videos are 0
            ensure!(channel.num_videos == 0, Error::<T>::ChannelContainsVideos);

            // ensure channel bag exists and num_objects_to_delete is valid
            Self::ensure_channel_bag_can_be_dropped(channel_id, num_objects_to_delete)?;

            // try to remove the channel
            Self::try_to_perform_channel_deletion(sender.clone(), channel_id)?;

            //
            // == MUTATION SAFE ==
            //

            //rewards the sender a state bloat bond amount for the work to delete the channel.
            let _ = Balances::<T>::deposit_creating(&sender, channel.channel_state_bloat_bond);

            // deposit event
            Self::deposit_event(RawEvent::ChannelDeleted(actor, channel_id));

            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_channel_assets_as_moderator(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            assets_to_remove: BTreeSet<DataObjectId<T>>,
            rationale: Vec<u8>,
        ) {
            let sender = ensure_signed(origin)?;

            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            // permissions check
            let actions_to_perform = vec![ContentModerationAction::DeleteNonVideoChannelAssets];
            ensure_actor_authorized_to_perform_moderation_actions::<T>(&sender, &actor, &actions_to_perform, channel.privilege_level)?;

            // ensure provided assets belong to the channel
            Self::ensure_assets_to_remove_are_part_of_assets_set(&assets_to_remove, &channel.data_objects)?;

            //
            // == MUTATION SAFE ==
            //

            // remove the assets
            if !assets_to_remove.is_empty() {
                Storage::<T>::delete_data_objects(
                    sender,
                    Self::bag_id_for_channel(&channel_id),
                    assets_to_remove.clone(),
                )?;
            }

            // update channel's data_objects set
            ChannelById::<T>::mutate(channel_id, |channel| {
                channel.data_objects = Self::create_updated_data_objects_set(&channel.data_objects, &BTreeSet::new(), &assets_to_remove)
            });

            // emit the event
            Self::deposit_event(RawEvent::ChannelAssetsDeletedByModerator(actor, channel_id, assets_to_remove, rationale));
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
            Self::try_to_perform_channel_deletion(sender.clone(), channel_id)?;

            //
            // == MUTATION SAFE ==
            //

            //rewards the sender a state bloat bond amount for the work to delete the channel.
            let _ = Balances::<T>::deposit_creating(&sender, channel.channel_state_bloat_bond);

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

            // permissions check
            ensure_actor_authorized_to_create_video::<T>(&sender, &actor, &channel, &params)?;

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
                        Some(Self::construct_owned_nft(issuance_params)).transpose()
                    }
                )?;

            let video_state_bloat_bond = Self::video_state_bloat_bond_value();

            // ensure expected video state bloat bond
            ensure!(
                params.expected_video_state_bloat_bond
                    == video_state_bloat_bond,
                Error::<T>::VideoStateBloatBondChanged,
            );

            let storage_assets = params.assets.clone().unwrap_or_default();
            let num_objs = storage_assets.object_creation_list.len();

            let total_size = storage_assets.object_creation_list.iter().fold(0, |acc, obj_param| acc.saturating_add(obj_param.size));
            let funds_needed = <T as Config>::DataObjectStorage::funds_needed_for_upload(num_objs, total_size);
            let total_funds_needed = video_state_bloat_bond.saturating_add(funds_needed);

            Self::ensure_video_creation_sufficient_balance(&sender, total_funds_needed)?;

            if nft_status.is_some() {
                Self::check_nft_limits(&channel)?;
            }

            let data_objects_ids = if let Some(upload_assets) = params.assets.as_ref() {
                let params = Self::construct_upload_parameters(
                    upload_assets,
                    &channel_id,
                    &sender,
                    params.expected_data_object_state_bloat_bond,
                );
                Storage::<T>::upload_data_objects(params)
            } else {
                Ok(BTreeSet::new())
            }?;

            // create the video struct
            let video: Video<T> = VideoRecord {
                in_channel: channel_id,
                nft_status: nft_status.clone(),
                data_objects: data_objects_ids.clone(),
                video_state_bloat_bond
            };

            //
            // == MUTATION SAFE ==
            //

            let _ = Balances::<T>::slash(&sender, video_state_bloat_bond);

            // add it to the onchain state
            VideoById::<T>::insert(video_id, video);

            // Only increment next video id
            NextVideoId::<T>::mutate(|id| *id += T::VideoId::one());

            // Add recently added video id to the channel

            ChannelById::<T>::mutate(channel_id, |channel| {
                channel.num_videos = channel.num_videos.saturating_add(1);
                if nft_status.is_some() {
                    Self::increment_nft_counters(channel);
                }
            });

            Self::deposit_event(RawEvent::VideoCreated(actor, channel_id, video_id, params, data_objects_ids));

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

            // get associated channel and ensure it has no active transfer
            let channel_id = video.in_channel;
            let channel = Self::get_channel_from_video(&video);

            channel.ensure_has_no_active_transfer::<T>()?;

            // permissions check
            ensure_actor_authorized_to_perform_video_update::<T>(
                &sender,
                &actor,
                &channel,
                &params
            )?;

            // Ensure nft is not issued for the video. Videos with issued nfts are immutable.
            video.ensure_nft_is_not_issued::<T>()?;

            channel.ensure_feature_not_paused::<T>(PausableChannelFeature::VideoUpdate)?;
            if params.auto_issue_nft.is_some() {
                channel.ensure_feature_not_paused::<T>(PausableChannelFeature::VideoNftIssuance)?;
            }

            Self::ensure_assets_to_remove_are_part_of_assets_set(&params.assets_to_remove, &video.data_objects)?;

            let assets_to_upload = params.assets_to_upload.clone().unwrap_or_default();

            let nft_status = params.auto_issue_nft
                .as_ref()
                .map_or(
                    Ok(None),
                    |issuance_params| {
                        Some(Self::construct_owned_nft(issuance_params)).transpose()
                    }
                )?;

            if nft_status.is_some() {
                Self::check_nft_limits(&channel)?;
            }

            //
            // == MUTATION SAFE ==
            //

            // upload/delete video assets from storage with commit or rollback semantics
            let upload_parameters = UploadParameters::<T> {
                bag_id: Self::bag_id_for_channel(&channel_id),
                object_creation_list: assets_to_upload.object_creation_list,
                state_bloat_bond_source_account_id: sender,
                expected_data_size_fee: assets_to_upload.expected_data_size_fee,
                expected_data_object_state_bloat_bond: params.expected_data_object_state_bloat_bond,
            };

            let new_data_object_ids = Storage::<T>::upload_and_delete_data_objects(
                upload_parameters,
                params.assets_to_remove.clone(),
                )?;

            if nft_status.is_some() {
                ChannelById::<T>::mutate(channel_id, |channel| {
                    Self::increment_nft_counters(channel);
                });
                VideoById::<T>::mutate(&video_id, |video| video.nft_status = nft_status);
            }

            // Update the video
            VideoById::<T>::mutate(video_id, |video| {
                video.data_objects = Self::create_updated_data_objects_set(&video.data_objects, &new_data_object_ids, &params.assets_to_remove)
            });

            Self::deposit_event(RawEvent::VideoUpdated(actor, video_id, params, new_data_object_ids));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_video(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            num_objects_to_delete: u64,
        ) {
            let sender = ensure_signed(origin)?;

            // check that video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // get associated channel and ensure it has no active transfer
            let channel_id = video.in_channel;
            let channel = Self::get_channel_from_video(&video);

            channel.ensure_has_no_active_transfer::<T>()?;

            // permissions check
            ensure_actor_authorized_to_delete_video::<T>(
                &sender,
                &actor,
                &channel,
                &video,
            )?;

            // ensure video can be removed
            Self::ensure_video_can_be_removed(&video)?;

            // ensure provided num_objects_to_delete is valid
            Self::ensure_valid_video_num_objects_to_delete(&video, num_objects_to_delete)?;

            // Try removing the video
            Self::try_to_perform_video_deletion(&sender, channel_id, video_id, &video)?;

            //
            // == MUTATION SAFE ==
            //

            //rewards the sender a state bloat bond amount for the work to delete the video.
            let _ = Balances::<T>::deposit_creating(&sender, video.video_state_bloat_bond);

            Self::deposit_event(RawEvent::VideoDeleted(actor, video_id));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_video_assets_as_moderator(
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
            let channel = Self::get_channel_from_video(&video);

            // permissions check
            let is_nft = video.nft_status.is_some();
            let actions_to_perform = vec![ContentModerationAction::DeleteVideoAssets(is_nft)];
            ensure_actor_authorized_to_perform_moderation_actions::<T>(&sender, &actor, &actions_to_perform, channel.privilege_level)?;

            // ensure provided assets belong to the video
            Self::ensure_assets_to_remove_are_part_of_assets_set(&assets_to_remove, &video.data_objects)?;

            //
            // == MUTATION SAFE ==
            //

            // remove the assets
            if !assets_to_remove.is_empty() {
                Storage::<T>::delete_data_objects(
                    sender,
                    Self::bag_id_for_channel(&channel_id),
                    assets_to_remove.clone(),
                )?;
            }

            // update video's data_objects set
            VideoById::<T>::mutate(video_id, |video| {
                video.data_objects = Self::create_updated_data_objects_set(&video.data_objects, &BTreeSet::new(), &assets_to_remove)
            });

            // emit the event
            Self::deposit_event(RawEvent::VideoAssetsDeletedByModerator(actor, video_id, assets_to_remove, is_nft, rationale));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_video_as_moderator(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            num_objects_to_delete: u64,
            rationale: Vec<u8>,
        ) {
            let sender = ensure_signed(origin)?;

            // check that video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // get information regarding channel
            let channel_id = video.in_channel;
            let channel = Self::get_channel_from_video(&video);

            // Permissions check
            let actions_to_perform = vec![ContentModerationAction::DeleteVideo];
            ensure_actor_authorized_to_perform_moderation_actions::<T>(&sender, &actor, &actions_to_perform, channel.privilege_level)?;

            // ensure video can be removed
            Self::ensure_video_can_be_removed(&video)?;

            // ensure provided num_objects_to_delete is valid
            Self::ensure_valid_video_num_objects_to_delete(&video, num_objects_to_delete)?;

            // Try removing the video
            Self::try_to_perform_video_deletion(&sender, channel_id, video_id, &video)?;

            //
            // == MUTATION SAFE ==
            //

            //rewards the sender a state bloat bond amount for the work to delete the video.
            let _ = Balances::<T>::deposit_creating(&sender, video.video_state_bloat_bond);

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
            let channel = Self::get_channel_from_video(&video);

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

        #[weight = 10_000_000] // TODO: adjust Weight
        pub fn update_channel_payouts(
            origin,
            params: UpdateChannelPayoutsParameters<T>
        ) {
            ensure_root(origin)?;

            Self::verify_cashout_limits(&params)?;

            let new_min_cashout_allowed = params.min_cashout_allowed
                .unwrap_or_else(Self::min_cashout_allowed);
            let new_max_cashout_allowed = params.max_cashout_allowed
                .unwrap_or_else(Self::max_cashout_allowed);

            ensure!(
                new_min_cashout_allowed <= new_max_cashout_allowed,
                Error::<T>::MinCashoutAllowedExceedsMaxCashoutAllowed
            );

            let payload_data_object_id = params.payload
                .as_ref()
                .map(|_| { Storage::<T>::next_data_object_id() });

            if let Some(payload) = params.payload.as_ref() {
                let upload_params = UploadParameters::<T> {
                    bag_id: storage::BagId::<T>::from(StaticBagId::Council),
                    object_creation_list: vec![payload.object_creation_params.clone()],
                    state_bloat_bond_source_account_id: payload.uploader_account.clone(),
                    expected_data_size_fee: payload.expected_data_size_fee,
                    expected_data_object_state_bloat_bond: payload.expected_data_object_state_bloat_bond,
                };
                Storage::<T>::upload_data_objects(upload_params)?;
            }

            //
            // == MUTATION_SAFE ==
            //

            if let Some(min_cashout_allowed) = params.min_cashout_allowed.as_ref() {
                <MinCashoutAllowed<T>>::put(min_cashout_allowed);
            }

            if let Some(max_cashout_allowed) = params.max_cashout_allowed.as_ref() {
                <MaxCashoutAllowed<T>>::put(max_cashout_allowed);
            }

            if let Some(channel_cashouts_enabled) = params.channel_cashouts_enabled.as_ref() {
                ChannelCashoutsEnabled::put(channel_cashouts_enabled);
            }

            if let Some(commitment) = params.commitment.as_ref() {
                <Commitment<T>>::put(*commitment);
            }

            Self::deposit_event(RawEvent::ChannelPayoutsUpdated(
                params,
                payload_data_object_id
            ));
        }

        #[weight = 10_000_000] // TODO: adjust Weight
        pub fn claim_channel_reward(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            proof: Vec<ProofElement<T>>,
            item: PullPayment<T>,
        ) -> DispatchResult {
            let (.., reward_account, amount) =
                Self::ensure_can_claim_channel_reward(&origin, &actor, &item, &proof)?;

            //
            // == MUTATION_SAFE ==
            //

            Self::execute_channel_reward_claim(item.channel_id, &reward_account, amount);

            Self::deposit_event(
                RawEvent::ChannelRewardUpdated(item.cumulative_reward_earned, item.channel_id)
            );

            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust Weight
        pub fn withdraw_from_channel_balance(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            amount: BalanceOf<T>
        ) -> DispatchResult {
            let channel = Self::ensure_channel_exists(&channel_id)?;

            channel.ensure_has_no_active_transfer::<T>()?;

            let reward_account = ContentTreasury::<T>::account_for_channel(channel_id);
            ensure_actor_authorized_to_withdraw_from_channel::<T>(origin, &actor, &channel)?;

            // Ensure channel funds transfer feature is not paused
            channel.ensure_feature_not_paused::<T>(PausableChannelFeature::ChannelFundsTransfer)?;

            ensure!(
                !amount.is_zero(),
                Error::<T>::WithdrawFromChannelAmountIsZero
            );

            ensure!(
                <Balances<T>>::usable_balance(&reward_account)
                    .saturating_sub(T::ExistentialDeposit::get()) >= amount,
                Error::<T>::WithdrawFromChannelAmountExceedsBalanceMinusExistentialDeposit
            );

            ensure!(
                channel.creator_token_id.is_none(),
                Error::<T>::CannotWithdrawFromChannelWithCreatorTokenIssued
            );

            let destination = Self::channel_funds_destination(&channel)?;

            //
            // == MUTATION_SAFE ==
            //

            Self::execute_channel_balance_withdrawal(&reward_account, &destination, amount)?;

            Self::deposit_event(RawEvent::ChannelFundsWithdrawn(
                actor,
                channel_id,
                amount,
                destination,
            ));

            Ok(())
        }

        /// Updates channel state bloat bond value.
        /// Only lead can upload this value
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_channel_state_bloat_bond(
            origin,
            new_channel_state_bloat_bond: BalanceOf<T>,
        ) {
            let sender = ensure_signed(origin)?;
            ensure_authorized_to_update_channel_state_bloat_bond::<T>(&sender)?;

            //
            // == MUTATION_SAFE ==
            //

            ChannelStateBloatBondValue::<T>::put(new_channel_state_bloat_bond);
            Self::deposit_event(
                RawEvent::ChannelStateBloatBondValueUpdated(
                    new_channel_state_bloat_bond));
        }

        /// Updates video state bloat bond value.
        /// Only lead can upload this value
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_video_state_bloat_bond(
            origin,
            new_video_state_bloat_bond: BalanceOf<T>,
        ) {
            let sender = ensure_signed(origin)?;
            ensure_authorized_to_update_video_state_bloat_bond::<T>(&sender)?;

            //
            // == MUTATION_SAFE ==
            //

            VideoStateBloatBondValue::<T>::put(new_video_state_bloat_bond);
            Self::deposit_event(
                RawEvent::VideoStateBloatBondValueUpdated(
                    new_video_state_bloat_bond));
        }

        #[weight = 10_000_000] // TODO: adjust Weight
        pub fn claim_and_withdraw_channel_reward(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            proof: Vec<ProofElement<T>>,
            item: PullPayment<T>
        ) -> DispatchResult {
            let (channel, reward_account, amount) =
                Self::ensure_can_claim_channel_reward(&origin, &actor, &item, &proof)?;

            // Ensure withdrawals are not paused
            channel.ensure_feature_not_paused::<T>(PausableChannelFeature::ChannelFundsTransfer)?;

            ensure_actor_authorized_to_withdraw_from_channel::<T>(origin, &actor, &channel)?;

            let destination = Self::channel_funds_destination(&channel)?;

            //
            // == MUTATION_SAFE ==
            //
            Self::execute_channel_reward_claim(item.channel_id, &reward_account, amount);
            // This call should (and is assumed to) never fail:
            Self::execute_channel_balance_withdrawal(&reward_account, &destination, amount)?;

            Self::deposit_event(RawEvent::ChannelRewardClaimedAndWithdrawn(
                actor,
                item.channel_id,
                amount,
                destination,
            ));

            Ok(())
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

            // Get associated channel
            let channel = Self::get_channel_from_video(&video);

            // block extrinsics during transfers
            channel.ensure_has_no_active_transfer::<T>()?;

            // permissions check
            ensure_actor_authorized_to_manage_video_nfts::<T>(&sender, &actor, &channel)?;

            // Ensure have not been issued yet
            video.ensure_nft_is_not_issued::<T>()?;

            // Ensure nft issuance is not paused
            channel.ensure_feature_not_paused::<T>(PausableChannelFeature::VideoNftIssuance)?;

            // The content owner will be..
            let nft_status = Self::construct_owned_nft(&params)?;

            // Check channel's nft limits
            Self::check_nft_limits(&channel)?;

            //
            // == MUTATION SAFE ==
            //

            ChannelById::<T>::mutate(video.in_channel, |channel| {
                Self::increment_nft_counters(channel);
            });

            // Update the video
            VideoById::<T>::mutate(video_id, |v| v.set_nft_status(nft_status));

            Self::deposit_event(RawEvent::NftIssued(
                actor,
                video_id,
                params,
            ));
        }

        /// Destroy NFT
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn destroy_nft(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId
        ) {
            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // block extrinsics during transfers
            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

            // Authorize nft destruction
            ensure_actor_authorized_to_manage_nft::<T>(origin, &actor, &nft.owner, video.in_channel)?;

            // Ensure there nft transactional status is set to idle.
            Self::ensure_nft_transactional_status_is_idle(&nft)?;

            //
            // == MUTATION SAFE ==
            //

            // Update the video
            VideoById::<T>::mutate(video_id, |v| v.destroy_nft());

            Self::deposit_event(RawEvent::NftDestroyed(
                actor,
                video_id,
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

            // block extrinsics during transfers
            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(
                origin,
                &owner_id,
                &nft.owner,
                video.in_channel
            )?;

            // Ensure there nft transactional status is set to idle.
            Self::ensure_nft_transactional_status_is_idle(&nft)?;

            // Validate round_duration & starting_price
            Self::validate_open_auction_params(&auction_params)?;

            //
            // == MUTATION SAFE ==
            //

            // Create new auction
            let new_nonce = nft.open_auctions_nonce.saturating_add(One::one());
            let current_block = <frame_system::Pallet<T>>::block_number();
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
            Self::deposit_event(
                RawEvent::OpenAuctionStarted(owner_id, video_id, auction_params, new_nonce)
            );
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

            // block extrinsics during transfers
            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(
                origin,
                &owner_id,
                &nft.owner,
                video.in_channel
            )?;

            // Ensure there nft transactional status is set to idle.
            Self::ensure_nft_transactional_status_is_idle(&nft)?;

            // Validate round_duration & starting_price
            Self::validate_english_auction_params(&auction_params)?;

            //
            // == MUTATION SAFE ==
            //

            // Create new auction
            let current_block = <frame_system::Pallet<T>>::block_number();
            let auction = EnglishAuction::<T>::new(auction_params.clone(), current_block);

            // Update the video
            VideoById::<T>::mutate(
                video_id,
                |v| v.set_nft_status(
                    nft.with_transactional_status(
                        TransactionalStatus::<T>::EnglishAuction(auction)
                    )
                )
            );

            // Trigger event
            Self::deposit_event(
                RawEvent::EnglishAuctionStarted(owner_id, video_id, auction_params)
            );
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

            // block extrinsics during transfers
            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(
                origin,
                &owner_id,
                &nft.owner,
                video.in_channel
            )?;

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

            // block extrinsics during transfers
            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(
                origin,
                &owner_id,
                &nft.owner,
                video.in_channel
            )?;

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


            // block extrinsics during transfers
            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(
                origin,
                &owner_id,
                &nft.owner,
                video.in_channel
            )?;

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

            // block extrinsics during transfers
            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(
                origin,
                &owner_id,
                &nft.owner,
                video.in_channel
            )?;

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

            // block extrinsics during transfers
            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(
                origin,
                &owner_id,
                &nft.owner,
                video.in_channel
            )?;

            // Ensure nft in buy now state
            Self::ensure_in_buy_now_state(&nft)?;

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

            // block during transfers
            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

            // Validate parameters & return english auction
            let open_auction =  Self::ensure_in_open_auction_state(&nft)?;

            // check whitelisted participant
            open_auction.ensure_whitelisted_participant::<T>(participant_id)?;

            // ensure auction started
            let current_block = <frame_system::Pallet<T>>::block_number();
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
                        &video,
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

            // block during tranfers
            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

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
            let current_block = <frame_system::Pallet<T>>::block_number();
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
                        &video,
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
                    let updated_auction =
                        eng_auction.with_bid(bid_amount, participant_id, current_block);

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

            // block during channel transfers
            let video = Self::ensure_video_exists(&video_id)?;
            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

            // ensure nft exists
            let nft = Self::ensure_nft_exists(video_id)?;

            // ensure bid exists
            let old_bid = Self::ensure_open_bid_exists(video_id, participant_id)?;

            // if open auction is ongoing
            if let Ok(open_auction) = Self::ensure_in_open_auction_state(&nft) {

                // ensure conditions for canceling a bid are met
                let current_block = <frame_system::Pallet<T>>::block_number();
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

            // block during channel transfers
            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

            // Ensure nft & english auction validity for nft exists, retrieve top bid
            let english_auction = Self::ensure_in_english_auction_state(&nft)?;

            // Ensure top bid exists
            let top_bid = english_auction.ensure_top_bid_exists::<T>()?;
            let top_bidder_id = top_bid.bidder_id;

            // Ensure auction expired
            let current_block = <frame_system::Pallet<T>>::block_number();
            english_auction.ensure_auction_can_be_completed::<T>(current_block)?;

            //
            // == MUTATION SAFE ==
            //

            // Complete auction
            let royalty_payment = Self::build_royalty_payment(&video, nft.creator_royalty);
            let updated_nft = Self::complete_auction(
                nft,
                &video,
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

            // block extrinsics during transfers
            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

            // Ensure actor is authorized to accept open auction bid
            ensure_actor_authorized_to_manage_nft::<T>(
                origin,
                &owner_id,
                &nft.owner,
                video.in_channel
            )?;

            // Ensure auction for given video id exists, retrieve corresponding one
            let auction = Self::ensure_in_open_auction_state(&nft)?;

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
                &video,
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

            // block extrinsics during transfers
            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(
                origin,
                &owner_id,
                &nft.owner,
                video.in_channel
            )?;

            // Ensure there is no pending offer or existing auction for given nft.
            Self::ensure_nft_transactional_status_is_idle(&nft)?;

            // Ensure target member exists
            ensure!(
                T::MemberAuthenticator::controller_account_id(to).is_ok(),
                Error::<T>::TargetMemberDoesNotExist
            );

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

            // block extrinsics during transfers
            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(
                origin,
                &owner_id,
                &nft.owner,
                video.in_channel
            )?;

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
            witness_price: Option<<T as balances::Config>::Balance>
        ) {
            let receiver_account_id = ensure_signed(origin)?;

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Ensure new pending offer is available to proceed
            Self::ensure_new_pending_offer_available_to_proceed(&nft, &receiver_account_id, witness_price)?;

            // account_id where the nft offer price is deposited
            let nft_owner_account = Self::ensure_nft_owner_has_beneficiary_account(&video, &nft).ok();

            //
            // == MUTATION SAFE ==
            //

            // Complete nft offer
            let royalty_payment = Self::build_royalty_payment(&video, nft.creator_royalty);
            let nft = Self::complete_nft_offer(
                nft,
                royalty_payment,
                nft_owner_account,
                receiver_account_id
            );

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

            // block extrinsics during transfers
            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

            // Authorize nft owner
            ensure_actor_authorized_to_manage_nft::<T>(
                origin,
                &owner_id,
                &nft.owner,
                video.in_channel
            )?;

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
            witness_price: BalanceOf<T>, // in order to avoid front running
        ) {

            // Authorize participant under given member id
            let participant_account_id = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&participant_account_id, &participant_id)?;

            // Ensure given video exists
            let video = Self::ensure_video_exists(&video_id)?;

            // block during channel transfer
            Self::channel_by_id(video.in_channel).ensure_has_no_active_transfer::<T>()?;

            // Ensure nft is already issued
            let nft = video.ensure_nft_is_issued::<T>()?;

            // Ensure given participant can buy nft now
            Self::ensure_can_buy_now(&nft, &participant_account_id, witness_price)?;

            // seller account
            let old_nft_owner_account_id = Self::ensure_nft_owner_has_beneficiary_account(&video, &nft).ok();

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

        /// Only Council can toggle nft issuance limits constraints
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn toggle_nft_limits(
            origin,
            enabled: bool
        ) {
            ensure_root(origin)?;

            //
            // == MUTATION SAFE ==
            //

            NftLimitsEnabled::mutate(|nft_limits| *nft_limits = enabled);

            Self::deposit_event(RawEvent::ToggledNftLimits(enabled));
        }

        /// Channel owner remark
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn channel_owner_remark(origin, channel_id: T::ChannelId, msg: Vec<u8>) {
            let sender = ensure_signed(origin)?;
            let channel = Self::ensure_channel_exists(&channel_id)?;
            ensure_is_authorized_to_act_as_channel_owner::<T>(&sender, &channel.owner)?;

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(RawEvent::ChannelOwnerRemarked(channel_id, msg));
        }

        /// Channel collaborator remark
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn channel_agent_remark(origin, actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>, channel_id: T::ChannelId, msg: Vec<u8>) {
            let sender = ensure_signed(origin)?;
            let channel = Self::ensure_channel_exists(&channel_id)?;
            ensure_actor_authorized_to_send_channel_agent_remark::<T>(&sender, &actor, &channel)?;
            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(RawEvent::ChannelAgentRemarked(actor, channel_id, msg));
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

        /// Start a channel transfer with specified characteristics
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn initialize_channel_transfer(
            origin,
            channel_id: T::ChannelId,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            transfer_params: InitTransferParametersOf<T>,
        ) {
            let channel = Self::ensure_channel_exists(&channel_id)?;

            channel.ensure_has_no_active_transfer::<T>()?;

            ensure_actor_authorized_to_transfer_channel::<T>(origin, &actor, &channel)?;

            let pending_transfer = Self::try_initialize_transfer(transfer_params)?;

            if let Ok(token_id) = channel.ensure_creator_token_issued::<T>() {
                ensure!(
                    T::ProjectToken::is_revenue_split_inactive(token_id),
                    Error::<T>::ChannelTransfersBlockedDuringRevenueSplits
                );

                ensure!(
                    T::ProjectToken::is_sale_unscheduled(token_id),
                    Error::<T>::ChannelTransfersBlockedDuringTokenSales,
                );
            }

            //
            // == MUTATION SAFE ==
            //

            ChannelById::<T>::mutate(
                &channel_id,
                |channel| channel.transfer_status = ChannelTransferStatus::PendingTransfer::<_,_,_,_>(pending_transfer.clone())
            );

            NextTransferId::<T>::mutate(|id| *id = id.saturating_add(T::TransferId::one()));

            Self::deposit_event(
                RawEvent::InitializedChannelTransfer(channel_id, actor, pending_transfer)
            );
        }

        /// cancel channel transfer
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn cancel_channel_transfer(
            origin,
            channel_id: T::ChannelId,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
        ) {
            let channel = Self::ensure_channel_exists(&channel_id)?;
            ensure_actor_authorized_to_cancel_channel_transfer::<T>(origin, &actor, &channel)?;

            //
            // ==MUTATION SAFE ==
            //

            if channel.transfer_status.is_pending() {
                ChannelById::<T>::mutate(
                    &channel_id,
                    |channel| {
                        channel.transfer_status = ChannelTransferStatus::NoActiveTransfer;
                    });

                Self::deposit_event(
                    RawEvent::CancelChannelTransfer(channel_id, actor)
                );
            }

        }


        /// Accepts channel transfer.
        /// `commitment_params` is required to prevent changing the transfer conditions.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn accept_channel_transfer(
            origin,
            channel_id: T::ChannelId,
            commitment_params: TransferCommitmentParameters<T::MemberId, BalanceOf<T>, T::TransferId>
        ) {
            let sender = ensure_signed(origin)?;
            let channel = Self::ensure_channel_exists(&channel_id)?;

           let params = if let ChannelTransferStatus::PendingTransfer(ref params) = channel.transfer_status {
                ensure_is_authorized_to_act_as_channel_owner::<T>(&sender, &params.new_owner)?;
                Self::validate_channel_transfer_acceptance(&commitment_params, params)?;
                Ok(params)
            } else {
                Err(Error::<T>::InvalidChannelTransferStatus)
            }?;

            let new_owner = params.new_owner.clone();
            let new_collaborators = commitment_params.new_collaborators.clone();

            //
            // == MUTATION SAFE ==
            //

            if !params.transfer_params.is_free_of_charge() {
                Self::pay_for_channel_swap(&channel.owner, &new_owner, commitment_params.price)?;
            }

            ChannelById::<T>::mutate(&channel_id, |channel| {
                channel.transfer_status = ChannelTransferStatus::NoActiveTransfer;
                channel.owner = new_owner;
                channel.collaborators = new_collaborators;
            });

            Self::deposit_event(
                RawEvent::ChannelTransferAccepted(channel_id, commitment_params)
            );
        }

        /// Updates global NFT limit.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_global_nft_limit(
            origin,
            nft_limit_period: NftLimitPeriod,
            limit: u64,
        ) {
            ensure_root(origin)?;

            let nft_limit_id: NftLimitId<T::ChannelId> = match nft_limit_period {
                NftLimitPeriod::Daily => NftLimitId::GlobalDaily,
                NftLimitPeriod::Weekly => NftLimitId::GlobalWeekly,
            };

            //
            // == MUTATION SAFE ==
            //

            Self::set_nft_limit(nft_limit_id, limit);

            Self::deposit_event(RawEvent::GlobalNftLimitUpdated(nft_limit_period, limit));
        }

        /// Updates channel's NFT limit.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_channel_nft_limit(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            nft_limit_period: NftLimitPeriod,
            channel_id: T::ChannelId,
            limit: u64,
        ) {
            let channel = Self::ensure_channel_exists(&channel_id)?;
            ensure_actor_authorized_to_update_channel_nft_limits::<T>(origin, &actor, &channel)?;

            let nft_limit_id: NftLimitId<T::ChannelId> = match nft_limit_period {
                NftLimitPeriod::Daily => NftLimitId::ChannelDaily(channel_id),
                NftLimitPeriod::Weekly => NftLimitId::ChannelWeekly(channel_id),
            };

            //
            // == MUTATION SAFE ==
            //

            Self::set_nft_limit(nft_limit_id, limit);

            Self::deposit_event(RawEvent::ChannelNftLimitUpdated(actor, nft_limit_period, channel_id, limit));
        }

        /// Issue creator token
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn issue_creator_token(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            params: TokenIssuanceParametersOf<T>,
        ) {
            let channel = Self::ensure_channel_exists(&channel_id)?;

            // Ensure channel is not in transfer status
            channel.ensure_has_no_active_transfer::<T>()?;

            // Ensure issue creator token feature is not paused
            channel.ensure_feature_not_paused::<T>(PausableChannelFeature::CreatorTokenIssuance)?;

            // Permissions check
            let sender = ensure_actor_authorized_to_issue_creator_token::<T>(
                origin,
                &actor,
                &channel
            )?;

            // Ensure token not already issued
            channel.ensure_creator_token_not_issued::<T>()?;

            // Call to ProjectToken - should be the first call before MUTATION SAFE!
            let token_id = T::ProjectToken::issue_token(
                sender.clone(),
                params,
                UploadContextOf::<T> {
                    bag_id: Self::bag_id_for_channel(&channel_id),
                    uploader_account: sender,
                }
            )?;

            //
            // == MUTATION SAFE ==
            //

            ChannelById::<T>::mutate(&channel_id, |channel| {
                channel.creator_token_id = Some(token_id);
            });

            Self::deposit_event(RawEvent::CreatorTokenIssued(actor, channel_id, token_id));
        }

        /// Initialize creator token sale
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn init_creator_token_sale(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            params: TokenSaleParamsOf<T>,
        ) {
            let channel = Self::ensure_channel_exists(&channel_id)?;

            channel.ensure_has_no_active_transfer::<T>()?;

            // Permissions check
            let (sender, _) = ensure_actor_authorized_to_init_and_manage_creator_token_sale::<T>(
                origin,
                &actor,
                &channel
            )?;

            // Retrieve member_id based on actor
            let member_id = get_member_id_of_actor::<T>(&actor)?;

            // Establish earnings destination based on channel owner and sender
            let earnings_dst = Self::establish_creator_token_sale_earnings_destination(
                &channel.owner,
                &sender
            );

            // Ensure token was issued
            let token_id = channel.ensure_creator_token_issued::<T>()?;

            // Auto-finalize the sale only if channel owner is a member
            let auto_finalize = matches!(channel.owner, ChannelOwner::Member { .. });

            // Call to ProjectToken - should be the first call before MUTATION SAFE!
            T::ProjectToken::init_token_sale(
                token_id,
                member_id,
                earnings_dst,
                auto_finalize,
                params
            )?;
        }

        /// Update upcoming creator token sale
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_upcoming_creator_token_sale(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            new_start_block: Option<T::BlockNumber>,
            new_duration: Option<T::BlockNumber>,
        ) {
            let channel = Self::ensure_channel_exists(&channel_id)?;

            channel.ensure_has_no_active_transfer::<T>()?;

            // Permissions check
            let (_, permissions) = ensure_actor_authorized_to_init_and_manage_creator_token_sale::<T>(
                origin,
                &actor,
                &channel
            )?;


            // Ensure token was issued
            let token_id = channel.ensure_creator_token_issued::<T>()?;

            // If channel agent - make sure the sale was initialized by this agent!
            if permissions.is_some() {
                let member_id = get_member_id_of_actor::<T>(&actor)?;
                ensure!(
                    project_token::Module::<T>::token_info_by_id(token_id)
                        .sale
                        .map_or(false, |s| s.tokens_source == member_id),
                    Error::<T>::ChannelAgentInsufficientPermissions
                );
            }

            // Call to ProjectToken - should be the first call before MUTATION SAFE!
            T::ProjectToken::update_upcoming_sale(
                token_id,
                new_start_block,
                new_duration
            )?;
        }

        /// Perform transfer of tokens as creator token issuer
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn creator_token_issuer_transfer(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            outputs: TransfersWithVestingOf<T>,
        ) {
            let channel = Self::ensure_channel_exists(&channel_id)?;

            channel.ensure_has_no_active_transfer::<T>()?;

            // Permissions check
            let sender = ensure_actor_authorized_to_perform_creator_token_issuer_transfer::<T>(
                origin,
                &actor,
                &channel
            )?;

            // Ensure token was issued
            let token_id = channel.ensure_creator_token_issued::<T>()?;

            // Retrieve member_id based on actor
            let member_id = get_member_id_of_actor::<T>(&actor)?;

            // Call to ProjectToken - should be the first call before MUTATION SAFE!
            T::ProjectToken::issuer_transfer(
                token_id,
                member_id,
                sender,
                outputs
            )?;
        }


        /// Make channel's creator token permissionless
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn make_creator_token_permissionless(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
        ) {
            let channel = Self::ensure_channel_exists(&channel_id)?;

            channel.ensure_has_no_active_transfer::<T>()?;

            // Permissions check
            ensure_actor_authorized_to_make_creator_token_permissionless::<T>(
                origin,
                &actor,
                &channel
            )?;

            // Ensure token was issued
            let token_id = channel.ensure_creator_token_issued::<T>()?;

            // Call to ProjectToken - should be the first call before MUTATION SAFE!
            T::ProjectToken::change_to_permissionless(token_id)?;
        }

        /// Reduce channel's creator token patronage rate to given value
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn reduce_creator_token_patronage_rate_to(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            target_rate: YearlyRate
        ) {
            let channel = Self::ensure_channel_exists(&channel_id)?;

            channel.ensure_has_no_active_transfer::<T>()?;

            // Permissions check
            ensure_actor_authorized_to_reduce_creator_token_patronage_rate::<T>(
                origin,
                &actor,
                &channel
            )?;

            // Ensure token was issued
            let token_id = channel.ensure_creator_token_issued::<T>()?;

            // Call to ProjectToken - should be the first call before MUTATION SAFE!
            T::ProjectToken::reduce_patronage_rate_to(token_id, target_rate)?;
        }

        /// Claim channel's creator token patronage credit
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn claim_creator_token_patronage_credit(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId
        ) {
            let channel = Self::ensure_channel_exists(&channel_id)?;

            channel.ensure_has_no_active_transfer::<T>()?;

            // Permissions check
            ensure_actor_authorized_to_claim_creator_token_patronage::<T>(
                origin,
                &actor,
                &channel
            )?;

            // Ensure token was issued
            let token_id = channel.ensure_creator_token_issued::<T>()?;

            // Ensure channel is a member-owned channel
            ensure!(
                matches!(channel.owner, ChannelOwner::Member { .. }),
                Error::<T>::PatronageCanOnlyBeClaimedForMemberOwnedChannels
            );

            // Retrieve member_id based on actor
            let member_id = get_member_id_of_actor::<T>(&actor)?;

            // Call to ProjectToken - should be the first call before MUTATION SAFE!
            T::ProjectToken::claim_patronage_credit(
                token_id,
                member_id
            )?;
        }

        /// Issue revenue split for a channel
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn issue_revenue_split(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            start: Option<T::BlockNumber>,
            duration: T::BlockNumber
        ) {
            let channel = Self::ensure_channel_exists(&channel_id)?;

            channel.ensure_has_no_active_transfer::<T>()?;

            // Permissions check
            ensure_actor_authorized_to_manage_revenue_splits::<T>(
                origin,
                &actor,
                &channel
            )?;

            // Ensure token was issued
            let token_id = channel.ensure_creator_token_issued::<T>()?;

            // Get channel's reward account and its balance
            let reward_account = ContentTreasury::<T>::account_for_channel(channel_id);
            let reward_account_balance = Balances::<T>::usable_balance(&reward_account);

            // Get leftover funds destination
            let leftover_destination = Self::channel_funds_destination(&channel)?;

            // Call to ProjectToken - should be the first call before MUTATION SAFE!
            let leftover_amount = T::ProjectToken::issue_revenue_split(
                token_id,
                start,
                duration,
                reward_account.clone(),
                reward_account_balance.saturating_sub(<T as balances::Config>::ExistentialDeposit::get())
            )?;


            Self::execute_channel_balance_withdrawal(&reward_account, &leftover_destination, leftover_amount)?
        }

        /// Finalize an ended revenue split
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn finalize_revenue_split(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
        ) {
            let channel = Self::ensure_channel_exists(&channel_id)?;

            channel.ensure_has_no_active_transfer::<T>()?;

            // Permissions check
            ensure_actor_authorized_to_manage_revenue_splits::<T>(
                origin,
                &actor,
                &channel
            )?;

            // Ensure token was issued
            let token_id = channel.ensure_creator_token_issued::<T>()?;

            // Get channel's reward account
            let reward_account = ContentTreasury::<T>::account_for_channel(channel_id);

            // Call to ProjectToken - should be the first call before MUTATION SAFE!
            T::ProjectToken::finalize_revenue_split(
                token_id,
                reward_account, // send any leftovers back to reward_account
            )?;
        }

        /// Finalize an ended creator token sale
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn finalize_creator_token_sale(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
        ) {
            let channel = Self::ensure_channel_exists(&channel_id)?;

            channel.ensure_has_no_active_transfer::<T>()?;

            // Permissions check
            let (_, permissions) = ensure_actor_authorized_to_init_and_manage_creator_token_sale::<T>(
                origin,
                &actor,
                &channel
            )?;

            // Ensure token was issued
            let token_id = channel.ensure_creator_token_issued::<T>()?;

            // If channel agent - make sure the sale was initialized by this agent!
            if permissions.is_some() {
                let member_id = get_member_id_of_actor::<T>(&actor)?;
                ensure!(
                    project_token::Module::<T>::token_info_by_id(token_id)
                        .sale
                        .map_or(false, |s| s.tokens_source == member_id),
                    Error::<T>::ChannelAgentInsufficientPermissions
                );
            }

            // Call to ProjectToken - should be the first call before MUTATION SAFE!
            let joy_collected = T::ProjectToken::finalize_token_sale(token_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Curator channels - increase council budget by the amount of tokens collected
            // and burned during the sale
            if let ChannelOwner::CuratorGroup(_) = channel.owner {
                T::CouncilBudgetManager::increase_budget(joy_collected);
            }
        }

        /// Deissue channel's creator token
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn deissue_creator_token(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
        ) {
            let channel = Self::ensure_channel_exists(&channel_id)?;

            channel.ensure_has_no_active_transfer::<T>()?;

            // Permissions check
            ensure_actor_authorized_to_deissue_creator_token::<T>(
                origin,
                &actor,
                &channel
            )?;

            // Ensure token was issued
            let token_id = channel.ensure_creator_token_issued::<T>()?;

            // Call to ProjectToken - should be the first call before MUTATION SAFE!
            T::ProjectToken::deissue_token(
                token_id
            )?;

            //
            // == MUTATION SAFE ==
            //

            ChannelById::<T>::mutate(&channel_id, |channel| {
                channel.creator_token_id = None;
            });
        }
    }
}

impl<T: Config> Module<T> {
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

    fn get_channel_from_video(video: &Video<T>) -> Channel<T> {
        ChannelById::<T>::get(video.in_channel)
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
                let current_block = <frame_system::Pallet<T>>::block_number();
                Ok(TransactionalStatus::<T>::EnglishAuction(
                    EnglishAuction::<T>::new(params.clone(), current_block),
                ))
            }
            InitTransactionalStatus::<T>::OpenAuction(ref params) => {
                Self::validate_open_auction_params(params)?;
                let current_block = <frame_system::Pallet<T>>::block_number();
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

    // construct parameters to be upload to storage
    fn construct_upload_parameters(
        assets: &StorageAssets<T>,
        channel_id: &T::ChannelId,
        obj_state_bloat_bond_source_account: &T::AccountId,
        expected_data_object_state_bloat_bond: BalanceOf<T>,
    ) -> UploadParameters<T> {
        UploadParameters::<T> {
            bag_id: Self::bag_id_for_channel(channel_id),
            object_creation_list: assets.object_creation_list.clone(),
            state_bloat_bond_source_account_id: obj_state_bloat_bond_source_account.clone(),
            expected_data_size_fee: assets.expected_data_size_fee,
            expected_data_object_state_bloat_bond,
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

    fn try_initialize_transfer(
        params: InitTransferParametersOf<T>,
    ) -> Result<PendingTransferOf<T>, DispatchError> {
        Self::validate_member_set(&params.new_collaborators.keys().cloned().collect())?;
        let transfer_id = Self::next_transfer_id();
        Ok(PendingTransferOf::<T> {
            new_owner: params.new_owner,
            transfer_params: TransferCommitmentOf::<T> {
                price: params.price,
                new_collaborators: params.new_collaborators,
                transfer_id,
            },
        })
    }

    fn verify_proof(proof: &[ProofElement<T>], item: &PullPayment<T>) -> DispatchResult {
        let candidate_root = proof.iter().fold(
            <T as frame_system::Config>::Hashing::hash_of(item),
            |hash_v, el| match el.side {
                Side::Right => <T as frame_system::Config>::Hashing::hash_of(&[hash_v, el.hash]),
                Side::Left => <T as frame_system::Config>::Hashing::hash_of(&[el.hash, hash_v]),
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
    ) -> DispatchResult {
        // delete assets from storage with upload and rollback semantics
        if !video.data_objects.is_empty() {
            Storage::<T>::delete_data_objects(
                sender.clone(),
                Self::bag_id_for_channel(&channel_id),
                video.data_objects.clone(),
            )?;
        }

        // Remove video
        VideoById::<T>::remove(video_id);

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

        if let Ok(bag) = <T as Config>::DataObjectStorage::ensure_bag_exists(&bag_id) {
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

    fn ensure_assets_to_remove_are_part_of_assets_set(
        assets_to_remove: &BTreeSet<DataObjectId<T>>,
        assets_set: &BTreeSet<DataObjectId<T>>,
    ) -> DispatchResult {
        ensure!(
            assets_to_remove.is_subset(assets_set),
            Error::<T>::AssetsToRemoveBeyondEntityAssetsSet,
        );
        Ok(())
    }

    fn ensure_valid_video_num_objects_to_delete(
        video: &Video<T>,
        num_objects_to_delete: u64,
    ) -> DispatchResult {
        ensure!(
            (video.data_objects.len() as u64) == num_objects_to_delete,
            Error::<T>::InvalidVideoDataObjectsCountProvided
        );
        Ok(())
    }

    fn create_updated_data_objects_set(
        current_set: &BTreeSet<DataObjectId<T>>,
        ids_to_add: &BTreeSet<DataObjectId<T>>,
        ids_to_remove: &BTreeSet<DataObjectId<T>>,
    ) -> BTreeSet<DataObjectId<T>> {
        current_set
            .union(ids_to_add)
            .cloned()
            .collect::<BTreeSet<_>>()
            .difference(ids_to_remove)
            .cloned()
            .collect::<BTreeSet<_>>()
    }

    fn ensure_channel_creation_sufficient_balance(
        account_id: &T::AccountId,
        amount: BalanceOf<T>,
    ) -> DispatchResult {
        let balance = Balances::<T>::usable_balance(account_id);

        ensure!(
            balance >= amount,
            Error::<T>::InsufficientBalanceForChannelCreation
        );
        Ok(())
    }

    fn ensure_video_creation_sufficient_balance(
        account_id: &T::AccountId,
        amount: BalanceOf<T>,
    ) -> DispatchResult {
        let balance = Balances::<T>::usable_balance(account_id);

        ensure!(
            balance >= amount,
            Error::<T>::InsufficientBalanceForVideoCreation
        );
        Ok(())
    }

    fn ensure_sufficient_balance_for_channel_transfer(
        owner: &ChannelOwner<T::MemberId, T::CuratorGroupId>,
        transfer_cost: BalanceOf<T>,
    ) -> DispatchResult {
        let balance = match owner {
            ChannelOwner::Member(member_id) => {
                let controller_account_id =
                    T::MemberAuthenticator::controller_account_id(*member_id)?;

                // Funds received from the member invitation cannot be used!!
                Balances::<T>::usable_balance(&controller_account_id)
            }
            ChannelOwner::CuratorGroup(_) => T::ContentWorkingGroup::get_budget(),
        };

        ensure!(
            balance >= transfer_cost,
            Error::<T>::InsufficientBalanceForTransfer
        );
        Ok(())
    }

    // Validates channel transfer acceptance parameters: commitment params, new owner balance.
    fn validate_channel_transfer_acceptance(
        commitment_params: &TransferCommitmentParameters<T::MemberId, BalanceOf<T>, T::TransferId>,
        params: &PendingTransfer<T::MemberId, T::CuratorGroupId, BalanceOf<T>, T::TransferId>,
    ) -> DispatchResult {
        ensure!(
            params.transfer_params == *commitment_params,
            Error::<T>::InvalidChannelTransferCommitmentParams
        );

        // Check for new owner balance only if the transfer is not free.
        if !params.transfer_params.is_free_of_charge() {
            Self::ensure_sufficient_balance_for_channel_transfer(
                &params.new_owner,
                params.transfer_params.price,
            )?;
        }

        Ok(())
    }
    // Transfers balance from the new channel owner to the old channel owner.
    fn pay_for_channel_swap(
        old_owner: &ChannelOwner<T::MemberId, T::CuratorGroupId>,
        new_owner: &ChannelOwner<T::MemberId, T::CuratorGroupId>,
        price: BalanceOf<T>,
    ) -> DispatchResult {
        // Decrease (or slash) balance for the new owner
        match new_owner {
            ChannelOwner::Member(member_id) => {
                let controller_account_id =
                    T::MemberAuthenticator::controller_account_id(*member_id)?;

                let _ = Balances::<T>::slash(&controller_account_id, price);
            }
            ChannelOwner::CuratorGroup(_) => {
                // The budget is sufficient. It was checked previously in functions:
                // validate_channel_transfer_acceptance() ->
                // ensure_sufficient_balance_for_channel_transfer()
                let new_budget = T::ContentWorkingGroup::get_budget().saturating_sub(price);
                T::ContentWorkingGroup::set_budget(new_budget);
            }
        };

        // Increase (deposit) balance for the old owner
        match old_owner {
            ChannelOwner::Member(member_id) => {
                let controller_account_id =
                    T::MemberAuthenticator::controller_account_id(*member_id)?;

                let _ = Balances::<T>::deposit_creating(&controller_account_id, price);
            }
            ChannelOwner::CuratorGroup(_) => {
                let new_budget = T::ContentWorkingGroup::get_budget().saturating_add(price);
                T::ContentWorkingGroup::set_budget(new_budget);
            }
        };

        Ok(())
    }

    // Increment NFT numbers for a channel and global counters.
    fn increment_nft_counters(channel: &mut Channel<T>) {
        Self::increment_global_nft_counters();
        channel.increment_channel_nft_counters(frame_system::Pallet::<T>::block_number());
    }

    // Increment global NFT counters (daily and weekly).
    fn increment_global_nft_counters() {
        let current_block = frame_system::Pallet::<T>::block_number();

        let daily_limit = Self::global_daily_nft_limit();
        GlobalDailyNftCounter::<T>::mutate(|nft_counter| {
            nft_counter.update_for_current_period(current_block, daily_limit.block_number_period);
        });

        let weekly_limit = Self::global_weekly_nft_limit();
        GlobalWeeklyNftCounter::<T>::mutate(|nft_counter| {
            nft_counter.update_for_current_period(current_block, weekly_limit.block_number_period);
        });
    }

    // Checks all NFT-limits
    fn check_nft_limits(channel: &Channel<T>) -> DispatchResult {
        if Self::nft_limits_enabled() {
            // Global daily limit.
            Self::check_generic_nft_limit(
                &Self::global_daily_nft_limit(),
                &Self::global_daily_nft_counter(),
                Error::<T>::GlobalNftDailyLimitExceeded,
            )?;

            // Global weekly limit.
            Self::check_generic_nft_limit(
                &Self::global_weekly_nft_limit(),
                &Self::global_weekly_nft_counter(),
                Error::<T>::GlobalNftWeeklyLimitExceeded,
            )?;

            // Channel daily limit.
            Self::check_generic_nft_limit(
                &channel.daily_nft_limit,
                &channel.daily_nft_counter,
                Error::<T>::ChannelNftDailyLimitExceeded,
            )?;

            // Channel weekly limit.
            Self::check_generic_nft_limit(
                &channel.weekly_nft_limit,
                &channel.weekly_nft_counter,
                Error::<T>::ChannelNftWeeklyLimitExceeded,
            )?;
        }
        Ok(())
    }

    // Checks generic NFT-limit.
    fn check_generic_nft_limit(
        nft_limit: &LimitPerPeriod<T::BlockNumber>,
        nft_counter: &NftCounter<T::BlockNumber>,
        error: Error<T>,
    ) -> DispatchResult {
        ensure!(!nft_limit.limit.is_zero(), error);

        let current_block = frame_system::Pallet::<T>::block_number();
        if nft_counter.is_current_period(current_block, nft_limit.block_number_period) {
            ensure!(nft_counter.counter < nft_limit.limit, error);
        }

        Ok(())
    }

    // Set global and channel NFT limit
    pub(crate) fn set_nft_limit(limit_id: NftLimitId<T::ChannelId>, limit: u64) {
        match limit_id {
            NftLimitId::GlobalDaily => GlobalDailyNftLimit::<T>::mutate(|l| l.limit = limit),
            NftLimitId::GlobalWeekly => GlobalWeeklyNftLimit::<T>::mutate(|l| l.limit = limit),
            NftLimitId::ChannelDaily(channel_id) => {
                ChannelById::<T>::mutate(channel_id, |channel| {
                    channel.daily_nft_limit.limit = limit;
                });
            }
            NftLimitId::ChannelWeekly(channel_id) => {
                ChannelById::<T>::mutate(channel_id, |channel| {
                    channel.weekly_nft_limit.limit = limit;
                });
            }
        }
    }

    fn ensure_can_claim_channel_reward(
        origin: &T::Origin,
        actor: &ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
        item: &PullPayment<T>,
        proof: &[ProofElement<T>],
    ) -> Result<ChannelRewardClaimInfo<T>, DispatchError> {
        let channel = Self::ensure_channel_exists(&item.channel_id)?;

        channel.ensure_has_no_active_transfer::<T>()?;
        channel.ensure_feature_not_paused::<T>(PausableChannelFeature::CreatorCashout)?;

        ensure_actor_authorized_to_claim_payment::<T>(origin.clone(), actor, &channel)?;

        ensure!(
            Self::channel_cashouts_enabled(),
            Error::<T>::ChannelCashoutsDisabled
        );

        let reward_account = ContentTreasury::<T>::account_for_channel(item.channel_id);

        let cashout = item
            .cumulative_reward_earned
            .saturating_sub(channel.cumulative_reward_claimed);

        ensure!(
            <MaxCashoutAllowed<T>>::get() >= cashout,
            Error::<T>::CashoutAmountExceedsMaximumAmount
        );
        ensure!(
            <MinCashoutAllowed<T>>::get() <= cashout,
            Error::<T>::CashoutAmountBelowMinimumAmount
        );

        ensure!(
            cashout <= T::CouncilBudgetManager::get_budget(),
            Error::<T>::InsufficientCouncilBudget
        );

        Self::verify_proof(proof, item)?;

        Ok((channel, reward_account, cashout))
    }

    fn verify_cashout_limits(params: &UpdateChannelPayoutsParameters<T>) -> DispatchResult {
        if let Some(ref min_cashout) = params.min_cashout_allowed {
            ensure!(
                *min_cashout >= T::MinimumCashoutAllowedLimit::get(),
                Error::<T>::MinCashoutValueTooLow
            );
        }
        if let Some(ref max_cashout) = params.max_cashout_allowed {
            ensure!(
                *max_cashout <= T::MaximumCashoutAllowedLimit::get(),
                Error::<T>::MaxCashoutValueTooHigh
            );
        }
        Ok(())
    }

    fn execute_channel_reward_claim(
        channel_id: T::ChannelId,
        reward_account: &T::AccountId,
        amount: BalanceOf<T>,
    ) {
        T::CouncilBudgetManager::withdraw(reward_account, amount);
        ChannelById::<T>::mutate(&channel_id, |channel| {
            channel.cumulative_reward_claimed =
                channel.cumulative_reward_claimed.saturating_add(amount)
        });
    }

    fn execute_channel_balance_withdrawal(
        reward_account: &T::AccountId,
        destination: &ChannelFundsDestination<T::AccountId>,
        amount: BalanceOf<T>,
    ) -> DispatchResult {
        match destination {
            ChannelFundsDestination::AccountId(account_id) => {
                <Balances<T> as Currency<T::AccountId>>::transfer(
                    reward_account,
                    account_id,
                    amount,
                    ExistenceRequirement::AllowDeath,
                )
            }
            ChannelFundsDestination::CouncilBudget => {
                let _ = Balances::<T>::slash(reward_account, amount);
                T::CouncilBudgetManager::increase_budget(amount);
                Ok(())
            }
        }
    }

    fn establish_creator_token_sale_earnings_destination(
        channel_owner: &ChannelOwner<T::MemberId, T::CuratorGroupId>,
        sender: &T::AccountId,
    ) -> Option<T::AccountId> {
        match channel_owner {
            // Channel owned by member - earnings destination is `sender`
            // (controller account of either the owner member
            // or a collaborator with sufficient permissions)
            ChannelOwner::Member(_) => Some(sender.clone()),
            // Channel owned by curators - earnings are burned
            ChannelOwner::CuratorGroup(_) => None,
        }
    }

    fn channel_funds_destination(
        channel: &Channel<T>,
    ) -> Result<ChannelFundsDestination<T::AccountId>, DispatchError> {
        match channel.owner {
            ChannelOwner::Member(member_id) => {
                let controller_account =
                    T::MembershipInfoProvider::controller_account_id(member_id)?;
                Ok(ChannelFundsDestination::AccountId(controller_account))
            }
            ChannelOwner::CuratorGroup(..) => Ok(ChannelFundsDestination::CouncilBudget),
        }
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
        VideoId = <T as Config>::VideoId,
        ChannelId = <T as storage::Config>::ChannelId,
        Channel = Channel<T>,
        DataObjectId = DataObjectId<T>,
        EnglishAuctionParams = EnglishAuctionParams<T>,
        OpenAuctionParams = OpenAuctionParams<T>,
        OpenAuctionId = <T as Config>::OpenAuctionId,
        NftIssuanceParameters = NftIssuanceParameters<T>,
        Balance = BalanceOf<T>,
        ChannelCreationParameters = ChannelCreationParameters<T>,
        ChannelUpdateParameters = ChannelUpdateParameters<T>,
        VideoCreationParameters = VideoCreationParameters<T>,
        VideoUpdateParameters = VideoUpdateParameters<T>,
        ChannelPrivilegeLevel = <T as Config>::ChannelPrivilegeLevel,
        ModerationPermissionsByLevel = ModerationPermissionsByLevel<T>,
        TransferCommitment = TransferCommitmentOf<T>,
        PendingTransfer = PendingTransferOf<T>,
        AccountId = <T as frame_system::Config>::AccountId,
        UpdateChannelPayoutsParameters = UpdateChannelPayoutsParameters<T>,
        TokenId = <T as project_token::Config>::TokenId,
        ChannelFundsDestination = ChannelFundsDestination<<T as frame_system::Config>::AccountId>,
    {
        // Curators
        CuratorGroupCreated(CuratorGroupId),
        CuratorGroupPermissionsUpdated(CuratorGroupId, ModerationPermissionsByLevel),
        CuratorGroupStatusSet(CuratorGroupId, bool /* active status */),
        CuratorAdded(CuratorGroupId, CuratorId, ChannelAgentPermissions),
        CuratorRemoved(CuratorGroupId, CuratorId),

        // Channels
        ChannelCreated(ChannelId, Channel, ChannelCreationParameters, AccountId),
        ChannelUpdated(
            ContentActor,
            ChannelId,
            ChannelUpdateParameters,
            BTreeSet<DataObjectId>,
        ),
        ChannelPrivilegeLevelUpdated(ChannelId, ChannelPrivilegeLevel),
        ChannelStateBloatBondValueUpdated(Balance),
        VideoStateBloatBondValueUpdated(Balance),
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
        ChannelAssetsDeletedByModerator(
            ContentActor,
            ChannelId,
            BTreeSet<DataObjectId>,
            Vec<u8>, /* rationale */
        ),

        ChannelFundsWithdrawn(ContentActor, ChannelId, Balance, ChannelFundsDestination),
        ChannelRewardClaimedAndWithdrawn(ContentActor, ChannelId, Balance, ChannelFundsDestination),

        // Videos
        VideoCreated(
            ContentActor,
            ChannelId,
            VideoId,
            VideoCreationParameters,
            BTreeSet<DataObjectId>,
        ),
        VideoUpdated(
            ContentActor,
            VideoId,
            VideoUpdateParameters,
            BTreeSet<DataObjectId>,
        ),
        VideoDeleted(ContentActor, VideoId),
        VideoDeletedByModerator(ContentActor, VideoId, Vec<u8> /* rationale */),
        VideoVisibilitySetByModerator(ContentActor, VideoId, bool, Vec<u8> /* rationale */),
        VideoAssetsDeletedByModerator(
            ContentActor,
            VideoId,
            BTreeSet<DataObjectId>,
            bool,
            Vec<u8>, /* rationale */
        ),

        // Rewards
        ChannelPayoutsUpdated(UpdateChannelPayoutsParameters, Option<DataObjectId>),
        ChannelRewardUpdated(Balance, ChannelId),
        CouncilRewardClaimed(ChannelId, Balance),
        // Nft auction
        EnglishAuctionStarted(ContentActor, VideoId, EnglishAuctionParams),
        OpenAuctionStarted(ContentActor, VideoId, OpenAuctionParams, OpenAuctionId),
        NftIssued(ContentActor, VideoId, NftIssuanceParameters),
        NftDestroyed(ContentActor, VideoId),
        AuctionBidMade(MemberId, VideoId, Balance, Option<MemberId>),
        AuctionBidCanceled(MemberId, VideoId),
        AuctionCanceled(ContentActor, VideoId),
        EnglishAuctionSettled(MemberId, AccountId, VideoId),
        BidMadeCompletingAuction(MemberId, VideoId, Option<MemberId>),
        OpenAuctionBidAccepted(ContentActor, VideoId, MemberId, Balance),
        OfferStarted(VideoId, ContentActor, MemberId, Option<Balance>),
        OfferAccepted(VideoId),
        OfferCanceled(VideoId, ContentActor),
        NftSellOrderMade(VideoId, ContentActor, Balance),
        NftBought(VideoId, MemberId),
        BuyNowCanceled(VideoId, ContentActor),
        BuyNowPriceUpdated(VideoId, ContentActor, Balance),
        NftSlingedBackToTheOriginalArtist(VideoId, ContentActor),

        /// Metaprotocols related event
        ChannelOwnerRemarked(ChannelId, Vec<u8>),
        ChannelAgentRemarked(ContentActor, ChannelId, Vec<u8>),
        NftOwnerRemarked(ContentActor, VideoId, Vec<u8>),

        // Channel transfer
        InitializedChannelTransfer(ChannelId, ContentActor, PendingTransfer),
        CancelChannelTransfer(ChannelId, ContentActor),
        ChannelTransferAccepted(ChannelId, TransferCommitment),

        // Nft limits
        GlobalNftLimitUpdated(NftLimitPeriod, u64),
        ChannelNftLimitUpdated(ContentActor, NftLimitPeriod, ChannelId, u64),
        ToggledNftLimits(bool),
        // Creator tokens
        CreatorTokenIssued(ContentActor, ChannelId, TokenId),
    }
);
