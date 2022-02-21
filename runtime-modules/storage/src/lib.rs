//! # Storage module
//! Storage module for the Joystream platform.
//!
//! Initial spec links:
//! - [spec](https://github.com/Joystream/joystream/issues/2224)
//! - [utilization model](https://github.com/Joystream/joystream/issues/2359)
//!
//! Pallet functionality could be split in five distinct groups:
//! - extrinsics for the storage working group leader
//! - extrinsics for the distribution group leader
//! - extrinsics for the storage provider
//! - extrinsics for the distribution provider
//! - public methods for the pallet integration
//!
//! #### Storage working group leader extrinsics
//! - [create_storage_bucket](./struct.Module.html#method.create_storage_bucket) - creates storage
//! bucket.
//! - [update_storage_buckets_for_bag](./struct.Module.html#method.update_storage_buckets_for_bag) -
//! updates storage buckets for a bag.
//! - [delete_storage_bucket](./struct.Module.html#method.delete_storage_bucket) - deletes storage
//! bucket.
//! - [invite_storage_bucket_operator](./struct.Module.html#method.invite_storage_bucket_operator) -
//! invites storage bucket operator.
//! - [cancel_storage_bucket_operator_invite](./struct.Module.html#method.cancel_storage_bucket_operator_invite) -
//! cancels pending storage bucket invite.
//! - [remove_storage_bucket_operator](./struct.Module.html#method.remove_storage_bucket_operator) -
//! removes storage bucket operator.
//! - [update_uploading_blocked_status](./struct.Module.html#method.update_uploading_blocked_status) -
//! updates global uploading status.
//! - [update_data_size_fee](./struct.Module.html#method.update_data_size_fee) - updates size-based
//! pricing of new objects uploaded.
//! - [update_storage_buckets_per_bag_limit](./struct.Module.html#method.update_storage_buckets_per_bag_limit) -
//! updates "Storage buckets per bag" number limit.
//! - [update_storage_buckets_voucher_max_limits](./struct.Module.html#method.update_storage_buckets_voucher_max_limits) -
//! updates "Storage buckets voucher max limits".
//! - [update_number_of_storage_buckets_in_dynamic_bag_creation_policy](./struct.Module.html#method.update_number_of_storage_buckets_in_dynamic_bag_creation_policy) -
//! updates number of storage buckets used in given dynamic bag creation policy.
//! - [update_blacklist](./struct.Module.html#method.update_blacklist) - adds and removes hashes to
//! the current blacklist.
//! - [update_storage_bucket_status](./struct.Module.html#method.update_storage_bucket_status) -
//! updates whether new bags are being accepted for storage.
//! - [set_storage_bucket_voucher_limits](./struct.Module.html#method.set_storage_bucket_voucher_limits) -
//! sets storage bucket voucher limits.
//!
//!
//! #### Storage provider extrinsics
//! - [accept_storage_bucket_invitation](./struct.Module.html#method.accept_storage_bucket_invitation) -
//! accepts the storage bucket invitation.
//! - [set_storage_operator_metadata](./struct.Module.html#method.set_storage_operator_metadata) -
//! sets storage operator metadata.
//! - [accept_pending_data_objects](./struct.Module.html#method.accept_pending_data_objects) - a
//! storage provider signals that the data object was successfully uploaded to its storage.
//!
//! #### Distribution working group leader extrinsics
//! - [create_distribution_bucket_family](./struct.Module.html#method.create_distribution_bucket_family) -
//! creates distribution bucket family.
//! - [delete_distribution_bucket_family](./struct.Module.html#method.delete_distribution_bucket_family) -
//! deletes distribution bucket family.
//! - [create_distribution_bucket](./struct.Module.html#method.create_distribution_bucket) -
//! creates distribution bucket.
//! - [delete_distribution_bucket](./struct.Module.html#method.delete_distribution_bucket) -
//! deletes distribution bucket.
//! - [update_distribution_bucket_status](./struct.Module.html#method.update_distribution_bucket_status) -
//! updates distribution bucket status (accepting new bags).
//! - [update_distribution_buckets_for_bag](./struct.Module.html#method.update_distribution_buckets_for_bag) -
//! updates distribution buckets for a bag.
//! - [distribution_buckets_per_bag_limit](./struct.Module.html#method.distribution_buckets_per_bag_limit) -
//! updates "Distribution buckets per bag" number limit.
//! - [update_distribution_bucket_mode](./struct.Module.html#method.distribution_buckets_per_bag_limit) -
//! updates "distributing" flag for a distribution bucket.
//! - [update_families_in_dynamic_bag_creation_policy](./struct.Module.html#method.update_families_in_dynamic_bag_creation_policy) -
//!  updates distribution bucket families used in given dynamic bag creation policy.
//! - [invite_distribution_bucket_operator](./struct.Module.html#method.invite_distribution_bucket_operator) -
//!  invites a distribution bucket operator.
//! - [cancel_distribution_bucket_operator_invite](./struct.Module.html#method.cancel_distribution_bucket_operator_invite) -
//!  Cancels pending invite for a distribution bucket.
//! - [remove_distribution_bucket_operator](./struct.Module.html#method.remove_distribution_bucket_operator) -
//!  Removes a distribution bucket operator.
//! - [set_distribution_bucket_family_metadata](./struct.Module.html#method.set_distribution_bucket_family_metadata) -
//! Sets distribution bucket family metadata.
//!
//! #### Distribution provider extrinsics
//! - [accept_distribution_bucket_invitation](./struct.Module.html#method.accept_distribution_bucket_invitation) -
//!  Accepts pending invite for a distribution bucket.
//! - [set_distribution_operator_metadata](./struct.Module.html#method.set_distribution_operator_metadata) -
//!  Set distribution operator metadata for the distribution bucket.
//!
//! #### Public methods
//! Public integration methods are exposed via the [DataObjectStorage](./trait.DataObjectStorage.html)
//! - can_upload_data_objects
//! - upload_data_objects
//! - can_move_data_objects
//! - move_data_objects
//! - can_delete_data_objects
//! - delete_data_objects
//! - can_delete_dynamic_bag
//! - delete_dynamic_bag
//! - can_create_dynamic_bag
//! - create_dynamic_bag
//! - can_create_dynamic_bag_with_objects_constraints
//! - create_dynamic_bag_with_objects_constraints
//! - can_delete_dynamic_bag_with_objects

//!
//! ### Pallet constants
//! - DataObjectDeletionPrize
//! - BlacklistSizeLimit
//! - StorageBucketsPerBagValueConstraint
//! - DefaultMemberDynamicBagNumberOfStorageBuckets
//! - DefaultChannelDynamicBagNumberOfStorageBuckets
//! - MaxDistributionBucketFamilyNumber
//! - DistributionBucketsPerBagValueConstraint
//! - MaxNumberOfPendingInvitationsPerDistributionBucket

// Compiler demand.
#![recursion_limit = "256"]
// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
// #![warn(missing_docs)] // Cannot be enabled by default because of the Substrate issue.

// Internal Substrate warning (decl_event).
#![allow(clippy::unused_unit)]
// needed for step iteration over DataObjectId range
#![feature(step_trait)]
#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

//pub(crate) mod distribution_bucket_picker;
pub(crate) mod random_buckets;

use codec::{Codec, Decode, Encode};
use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::traits::{Currency, ExistenceRequirement, Get, Randomness};
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage, ensure, IterableStorageDoubleMap, Parameter,
};
use frame_system::{ensure_root, ensure_signed};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_arithmetic::traits::{BaseArithmetic, One, Zero};
use sp_runtime::traits::{AccountIdConversion, MaybeSerialize, Member, Saturating};
use sp_runtime::{ModuleId, SaturatedConversion};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::iter;
use sp_std::marker::PhantomData;
use sp_std::vec::Vec;

use common::constraints::BoundedValueConstraint;
use common::working_group::WorkingGroup;

use random_buckets::DistributionBucketPicker;
use random_buckets::StorageBucketPicker;

/// Public interface for the storage module.
pub trait DataObjectStorage<T: Trait> {
    /// Validates upload parameters and conditions (like global uploading block).
    /// Validates voucher usage for affected buckets.
    fn can_upload_data_objects(params: &UploadParameters<T>) -> DispatchResult;

    /// Upload new data objects.
    fn upload_data_objects(params: UploadParameters<T>) -> DispatchResult;

    /// Validates moving objects parameters.
    /// Validates voucher usage for affected buckets.
    fn can_move_data_objects(
        src_bag_id: &BagId<T>,
        dest_bag_id: &BagId<T>,
        objects: &BTreeSet<T::DataObjectId>,
    ) -> DispatchResult;

    /// Move data objects to a new bag.
    fn move_data_objects(
        src_bag_id: BagId<T>,
        dest_bag_id: BagId<T>,
        objects: BTreeSet<T::DataObjectId>,
    ) -> DispatchResult;

    /// Validates `delete_data_objects` parameters.
    /// Validates voucher usage for affected buckets.
    fn can_delete_data_objects(
        bag_id: &BagId<T>,
        objects: &BTreeSet<T::DataObjectId>,
    ) -> DispatchResult;

    /// Delete storage objects. Transfer deletion prize to the provided account.
    fn delete_data_objects(
        deletion_prize_account_id: T::AccountId,
        bag_id: BagId<T>,
        objects: BTreeSet<T::DataObjectId>,
    ) -> DispatchResult;

    /// Delete dynamic bag. Updates related storage bucket vouchers.
    fn delete_dynamic_bag(
        deletion_prize_account_id: T::AccountId,
        bag_id: DynamicBagId<T>,
    ) -> DispatchResult;

    /// Validates `delete_dynamic_bag` parameters and conditions.
    fn can_delete_dynamic_bag(bag_id: &DynamicBagId<T>) -> DispatchResult;

    /// Validates `delete_dynamic_bag` without checking for num objects == 0
    fn can_delete_dynamic_bag_with_objects(bag_id: &DynamicBagId<T>) -> DispatchResult;

    /// Creates dynamic bag. BagId should provide the caller.
    fn create_dynamic_bag(
        bag_id: DynamicBagId<T>,
        deletion_prize: Option<DynamicBagDeletionPrize<T>>,
    ) -> DispatchResult;

    /// Validates `create_dynamic_bag` parameters and conditions.
    fn can_create_dynamic_bag(
        bag_id: &DynamicBagId<T>,
        deletion_prize: &Option<DynamicBagDeletionPrize<T>>,
    ) -> DispatchResult;

    /// Same as create_dynamic_bag but with caller provided objects/data
    fn create_dynamic_bag_with_objects_constraints(
        bag_id: DynamicBagId<T>,
        deletion_prize: Option<DynamicBagDeletionPrize<T>>,
        params: UploadParameters<T>,
    ) -> DispatchResult;

    /// Same as can_create_dynamic_bag but with caller provided objects/data
    fn can_create_dynamic_bag_with_objects_constraints(
        bag_id: &DynamicBagId<T>,
        deletion_prize: &Option<DynamicBagDeletionPrize<T>>,
        params: &UploadParameters<T>,
    ) -> DispatchResult;

    /// Checks if a bag does exists and returns it. Static Always exists
    fn ensure_bag_exists(bag_id: &BagId<T>) -> Result<Bag<T>, DispatchError>;

    /// Get all objects id in a bag, without checking its existence
    fn get_data_objects_id(bag_id: &BagId<T>) -> BTreeSet<T::DataObjectId>;
}

/// Storage trait.
pub trait Trait: frame_system::Trait + balances::Trait + common::MembershipTypes {
    /// Storage event type.
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    /// Content id representation.
    type ContentId: Parameter + Member + Codec + Default + Copy + MaybeSerialize + Ord + PartialEq;

    /// Data object ID type.
    type DataObjectId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + iter::Step; // needed for iteration

    /// Storage bucket ID type.
    type StorageBucketId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + Into<u64>
        + From<u64>;

    /// Distribution bucket index within a distribution bucket family type.
    type DistributionBucketIndex: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + Into<u64>
        + From<u64>;

    /// Distribution bucket family ID type.
    type DistributionBucketFamilyId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    /// Channel ID type (part of the dynamic bag ID).
    type ChannelId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

    /// Distribution bucket operator ID type (relationship between distribution bucket and
    /// distribution operator).
    type DistributionBucketOperatorId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    /// Defines a prize for a data object deletion.
    type DataObjectDeletionPrize: Get<BalanceOf<Self>>;

    /// Defines maximum size of the "hash blacklist" collection.
    type BlacklistSizeLimit: Get<u64>;

    /// The module id, used for deriving its sovereign account ID.
    type ModuleId: Get<ModuleId>;

    /// "Storage buckets per bag" value constraint.
    type StorageBucketsPerBagValueConstraint: Get<StorageBucketsPerBagValueConstraint>;

    /// "Distribution buckets per bag" value constraint.
    type DistributionBucketsPerBagValueConstraint: Get<DistributionBucketsPerBagValueConstraint>;

    /// Defines the default dynamic bag creation policy for members (storage bucket number).
    type DefaultMemberDynamicBagNumberOfStorageBuckets: Get<u64>;

    /// Defines the default dynamic bag creation policy for channels (storage bucket number).
    type DefaultChannelDynamicBagNumberOfStorageBuckets: Get<u64>;

    /// Defines max random iteration number (eg.: when picking the storage buckets).
    type MaxRandomIterationNumber: Get<u64>;

    /// Something that provides randomness in the runtime.
    type Randomness: Randomness<Self::Hash>;

    /// Defines max allowed distribution bucket family number.
    type MaxDistributionBucketFamilyNumber: Get<u64>;

    /// Max number of pending invitations per distribution bucket.
    type MaxNumberOfPendingInvitationsPerDistributionBucket: Get<u64>;

    /// Max data object size in bytes.
    type MaxDataObjectSize: Get<u64>;

    /// Demand the storage working group leader authorization.
    /// TODO: Refactor after merging with the Olympia release.
    fn ensure_storage_working_group_leader_origin(origin: Self::Origin) -> DispatchResult;

    /// Validate origin for the storage worker.
    /// TODO: Refactor after merging with the Olympia release.
    fn ensure_storage_worker_origin(
        origin: Self::Origin,
        worker_id: WorkerId<Self>,
    ) -> DispatchResult;

    /// Validate storage worker existence.
    /// TODO: Refactor after merging with the Olympia release.
    fn ensure_storage_worker_exists(worker_id: &WorkerId<Self>) -> DispatchResult;

    /// Demand the distribution group leader authorization.
    /// TODO: Refactor after merging with the Olympia release.
    fn ensure_distribution_working_group_leader_origin(origin: Self::Origin) -> DispatchResult;

    /// Validate origin for the distribution worker.
    /// TODO: Refactor after merging with the Olympia release.
    fn ensure_distribution_worker_origin(
        origin: Self::Origin,
        worker_id: WorkerId<Self>,
    ) -> DispatchResult;

    /// Validate distribution worker existence.
    /// TODO: Refactor after merging with the Olympia release.
    fn ensure_distribution_worker_exists(worker_id: &WorkerId<Self>) -> DispatchResult;
}

/// Operations with local pallet account.
pub trait ModuleAccount<T: balances::Trait> {
    /// The module id, used for deriving its sovereign account ID.
    type ModuleId: Get<ModuleId>;

    /// The account ID of the module account.
    fn module_account_id() -> T::AccountId {
        Self::ModuleId::get().into_sub_account(Vec::<u8>::new())
    }

    /// Transfer tokens from the module account to the destination account (spends from
    /// module account).
    fn withdraw(dest_account_id: &T::AccountId, amount: BalanceOf<T>) -> DispatchResult {
        <Balances<T> as Currency<T::AccountId>>::transfer(
            &Self::module_account_id(),
            dest_account_id,
            amount,
            ExistenceRequirement::AllowDeath,
        )
    }

    /// Transfer tokens from the destination account to the module account (fills module account).
    fn deposit(src_account_id: &T::AccountId, amount: BalanceOf<T>) -> DispatchResult {
        <Balances<T> as Currency<T::AccountId>>::transfer(
            src_account_id,
            &Self::module_account_id(),
            amount,
            ExistenceRequirement::AllowDeath,
        )
    }

    /// Displays usable balance for the module account.
    fn usable_balance() -> BalanceOf<T> {
        <Balances<T>>::usable_balance(&Self::module_account_id())
    }
}

/// Implementation of the ModuleAccountHandler.
pub struct ModuleAccountHandler<T: balances::Trait, ModId: Get<ModuleId>> {
    /// Phantom marker for the trait.
    trait_marker: PhantomData<T>,

    /// Phantom marker for the module id type.
    module_id_marker: PhantomData<ModId>,
}

impl<T: balances::Trait, ModId: Get<ModuleId>> ModuleAccount<T> for ModuleAccountHandler<T, ModId> {
    type ModuleId = ModId;
}

/// Holds parameter values impacting how exactly the creation of a new dynamic bag occurs,
/// and there is one such policy for each type of dynamic bag.
/// It describes how many storage buckets should store the bag.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct DynamicBagCreationPolicy<DistributionBucketFamilyId: Ord> {
    /// The number of storage buckets which should replicate the new bag.
    pub number_of_storage_buckets: u64,

    /// The set of distribution bucket families which should be sampled
    /// to distribute bag, and for each the number of buckets in that family
    /// which should be used.
    pub families: BTreeMap<DistributionBucketFamilyId, u32>,
}

impl<DistributionBucketFamilyId: Ord> DynamicBagCreationPolicy<DistributionBucketFamilyId> {
    // Verifies non-zero number of storage buckets.
    pub(crate) fn no_storage_buckets_required(&self) -> bool {
        self.number_of_storage_buckets == 0
    }

    // Verifies non-zero number of required distribution buckets.
    pub(crate) fn no_distribution_buckets_required(&self) -> bool {
        self.families.iter().map(|(_, num)| num).sum::<u32>() == 0
    }
}

/// "Storage buckets per bag" value constraint type.
pub type StorageBucketsPerBagValueConstraint = BoundedValueConstraint<u64>;

/// "Distribution buckets per bag" value constraint type.
pub type DistributionBucketsPerBagValueConstraint = BoundedValueConstraint<u64>;

/// Local module account handler.
pub type StorageTreasury<T> = ModuleAccountHandler<T, <T as Trait>::ModuleId>;

/// IPFS hash type alias (content ID).
pub type Cid = Vec<u8>;

// Alias for the Substrate balances pallet.
type Balances<T> = balances::Module<T>;

/// Alias for the member id.
pub type MemberId<T> = <T as common::MembershipTypes>::MemberId;

/// Type identifier for worker role, which must be same as membership actor identifier
pub type WorkerId<T> = <T as common::MembershipTypes>::ActorId;

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

/// Type alias for the storage & distribution bucket ids pair
pub type BucketPair<T> = (
    BTreeSet<<T as Trait>::StorageBucketId>,
    BTreeSet<DistributionBucketId<T>>,
);

/// The fundamental concept in the system, which represents single static binary object in the
/// system. The main goal of the system is to retain an index of all such objects, including who
/// owns them, and information about what actors are currently tasked with storing and distributing
/// them to end users. The system is unaware of the underlying content represented by such an
/// object, as it is used by different parts of the Joystream system.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct DataObject<Balance> {
    /// Defines whether the data object was accepted by a liason.
    pub accepted: bool,

    /// A reward for the data object deletion.
    pub deletion_prize: Balance,

    /// Object size in bytes.
    pub size: u64,

    /// Content identifier presented as IPFS hash.
    pub ipfs_content_id: Vec<u8>,
}

/// Type alias for the BagRecord.
pub type Bag<T> = BagRecord<<T as Trait>::StorageBucketId, DistributionBucketId<T>, BalanceOf<T>>;

/// Bag container.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct BagRecord<StorageBucketId: Ord, DistributionBucketId: Ord, Balance> {
    /// Associated storage buckets.
    pub stored_by: BTreeSet<StorageBucketId>,

    /// Associated distribution buckets.
    pub distributed_by: BTreeSet<DistributionBucketId>,

    /// Bag deletion prize (valid for dynamic bags).
    pub deletion_prize: Option<Balance>,

    /// Total object size for bag.
    pub objects_total_size: u64,

    /// Total object number for bag.
    pub objects_number: u64,
}

impl<StorageBucketId: Ord, DistributionBucketId: Ord, Balance>
    BagRecord<StorageBucketId, DistributionBucketId, Balance>
{
    // Add and/or remove storage buckets.
    fn update_storage_buckets(
        &mut self,
        add_buckets: &mut BTreeSet<StorageBucketId>,
        remove_buckets: &BTreeSet<StorageBucketId>,
    ) {
        if !add_buckets.is_empty() {
            self.stored_by.append(add_buckets);
        }

        if !remove_buckets.is_empty() {
            for bucket_id in remove_buckets.iter() {
                self.stored_by.remove(bucket_id);
            }
        }
    }

    // Add and/or remove distribution buckets.
    fn update_distribution_buckets(
        &mut self,
        add_buckets: &mut BTreeSet<DistributionBucketId>,
        remove_buckets: &BTreeSet<DistributionBucketId>,
    ) {
        if !add_buckets.is_empty() {
            self.distributed_by.append(add_buckets);
        }

        if !remove_buckets.is_empty() {
            for bucket_id in remove_buckets.iter() {
                self.distributed_by.remove(bucket_id);
            }
        }
    }
}

/// Parameters for the data object creation.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct DataObjectCreationParameters {
    /// Object size in bytes.
    pub size: u64,

    /// Content identifier presented as IPFS hash.
    pub ipfs_content_id: Vec<u8>,
}

/// Type alias for the BagIdType.
pub type BagId<T> = BagIdType<MemberId<T>, <T as Trait>::ChannelId>;

/// Identifier for a bag.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub enum BagIdType<MemberId, ChannelId> {
    /// Static bag type.
    Static(StaticBagId),

    /// Dynamic bag type.
    Dynamic(DynamicBagIdType<MemberId, ChannelId>),
}

impl<MemberId, ChannelId> Default for BagIdType<MemberId, ChannelId> {
    fn default() -> Self {
        Self::Static(Default::default())
    }
}

/// Define dynamic bag types.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, PartialOrd, Ord, Copy)]
pub enum DynamicBagType {
    /// Member dynamic bag type.
    Member,

    /// Channel dynamic bag type.
    Channel,
    // Modify 'delete_distribution_bucket_family' on adding the new type!
}

impl Default for DynamicBagType {
    fn default() -> Self {
        Self::Member
    }
}

/// A type for static bags ID.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub enum StaticBagId {
    /// Dedicated bag for a council.
    Council,

    /// Dedicated bag for some working group.
    WorkingGroup(WorkingGroup),
}

impl Default for StaticBagId {
    fn default() -> Self {
        Self::Council
    }
}

impl<MemberId, ChannelId> From<StaticBagId> for BagIdType<MemberId, ChannelId> {
    fn from(static_bag_id: StaticBagId) -> Self {
        BagIdType::Static(static_bag_id)
    }
}

/// Type alias for the DynamicBagIdType.
pub type DynamicBagId<T> = DynamicBagIdType<MemberId<T>, <T as Trait>::ChannelId>;

/// A type for dynamic bags ID.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub enum DynamicBagIdType<MemberId, ChannelId> {
    /// Dynamic bag assigned to a member.
    Member(MemberId),

    /// Dynamic bag assigned to media channel.
    Channel(ChannelId),
}

impl<MemberId: Default, ChannelId> Default for DynamicBagIdType<MemberId, ChannelId> {
    fn default() -> Self {
        Self::Member(Default::default())
    }
}

impl<MemberId, ChannelId> From<DynamicBagIdType<MemberId, ChannelId>>
    for BagIdType<MemberId, ChannelId>
{
    fn from(dynamic_bag_id: DynamicBagIdType<MemberId, ChannelId>) -> Self {
        BagIdType::Dynamic(dynamic_bag_id)
    }
}

#[allow(clippy::from_over_into)] // Cannot implement From using these types.
impl<MemberId: Default, ChannelId> Into<DynamicBagType> for DynamicBagIdType<MemberId, ChannelId> {
    fn into(self) -> DynamicBagType {
        match self {
            DynamicBagIdType::Member(_) => DynamicBagType::Member,
            DynamicBagIdType::Channel(_) => DynamicBagType::Channel,
        }
    }
}

/// Alias for the UploadParametersRecord
pub type UploadParameters<T> = UploadParametersRecord<
    MemberId<T>,
    <T as Trait>::ChannelId,
    <T as frame_system::Trait>::AccountId,
    BalanceOf<T>,
>;

/// Data wrapper structure. Helps passing the parameters to the `upload` extrinsic.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct UploadParametersRecord<MemberId, ChannelId, AccountId, Balance> {
    /// Static or dynamic bag to upload data.
    pub bag_id: BagIdType<MemberId, ChannelId>,

    /// Data object parameters.
    pub object_creation_list: Vec<DataObjectCreationParameters>,

    /// Account for the data object deletion prize.
    pub deletion_prize_source_account_id: AccountId,

    /// Expected data size fee value for this extrinsic call.
    pub expected_data_size_fee: Balance,
}

/// Alias for the DynamicBagDeletionPrizeRecord
pub type DynamicBagDeletionPrize<T> =
    DynamicBagDeletionPrizeRecord<<T as frame_system::Trait>::AccountId, BalanceOf<T>>;

/// Deletion prize data for the dynamic bag. Requires on the dynamic bag creation.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct DynamicBagDeletionPrizeRecord<AccountId, Balance> {
    /// Account ID to withdraw the deletion prize.
    pub account_id: AccountId,

    /// Deletion prize value.
    pub prize: Balance,
}

/// Defines storage bucket parameters.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Voucher {
    /// Total size limit.
    pub size_limit: u64,

    /// Object number limit.
    pub objects_limit: u64,

    /// Current size.
    pub size_used: u64,

    /// Current object number.
    pub objects_used: u64,
}

// Defines whether we should increase or decrease parameters during some operation.
#[derive(Clone, PartialEq, Eq, Debug, Copy)]
enum OperationType {
    // Increase parameters.
    Increase,

    // Decrease parameters.
    Decrease,
}

// Helper-struct - defines voucher changes.
#[derive(Clone, PartialEq, Eq, Debug, Copy, Default)]
struct VoucherUpdate {
    /// Total number.
    pub objects_number: u64,

    /// Total objects size sum.
    pub objects_total_size: u64,
}

impl VoucherUpdate {
    fn get_updated_voucher(&self, voucher: &Voucher, voucher_operation: OperationType) -> Voucher {
        let (objects_used, size_used) = match voucher_operation {
            OperationType::Increase => (
                voucher.objects_used.saturating_add(self.objects_number),
                voucher.size_used.saturating_add(self.objects_total_size),
            ),
            OperationType::Decrease => (
                voucher.objects_used.saturating_sub(self.objects_number),
                voucher.size_used.saturating_sub(self.objects_total_size),
            ),
        };

        Voucher {
            size_used,
            objects_used,
            ..voucher.clone()
        }
    }

    // Adds a single object data to the voucher update (updates objects size and number).
    fn add_object(&mut self, size: u64) {
        self.objects_number = self.objects_number.saturating_add(1);
        self.objects_total_size = self.objects_total_size.saturating_add(size);
    }
}

/// Defines the storage bucket connection to the storage operator (storage WG worker).
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum StorageBucketOperatorStatus<WorkerId, AccountId> {
    /// No connection.
    Missing,

    /// Storage operator was invited.
    InvitedStorageWorker(WorkerId),

    /// Storage operator accepted the invitation.
    StorageWorker(WorkerId, AccountId),
}

impl<WorkerId, AccountId> Default for StorageBucketOperatorStatus<WorkerId, AccountId> {
    fn default() -> Self {
        Self::Missing
    }
}

/// Type alias for the StorageBucketRecord.
pub type StorageBucket<T> = StorageBucketRecord<WorkerId<T>, <T as frame_system::Trait>::AccountId>;

/// A commitment to hold some set of bags for long term storage. A bucket may have a bucket
/// operator, which is a single worker in the storage working group.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct StorageBucketRecord<WorkerId, AccountId> {
    /// Current storage operator status.
    pub operator_status: StorageBucketOperatorStatus<WorkerId, AccountId>,

    /// Defines whether the bucket accepts new bags.
    pub accepting_new_bags: bool,

    /// Defines limits for a bucket.
    pub voucher: Voucher,

    /// Number of assigned bags.
    pub assigned_bags: u64,
}

impl<WorkerId, AccountId> StorageBucketRecord<WorkerId, AccountId> {
    // Increment the assigned bags number.
    fn register_bag_assignment(&mut self) {
        self.assigned_bags = self.assigned_bags.saturating_add(1);
    }

    // Decrement the assigned bags number.
    fn unregister_bag_assignment(&mut self) {
        self.assigned_bags = self.assigned_bags.saturating_sub(1);
    }

    // Checks the bag assignment number. Returns true if it equals zero.
    fn no_bags_assigned(&self) -> bool {
        self.assigned_bags == 0
    }
}

// Helper-struct for the data object uploading.
#[derive(Default, Clone, Debug)]
struct DataObjectCandidates<T: Trait> {
    // next data object ID to be saved in the storage.
    next_data_object_id: T::DataObjectId,

    // 'ID-data object' map.
    data_objects_map: BTreeMap<T::DataObjectId, DataObject<BalanceOf<T>>>,
}

// Helper struct for the dynamic bag changing.
#[derive(Clone, PartialEq, Eq, Debug, Copy, Default)]
struct BagUpdate<Balance> {
    // Voucher update for data objects
    voucher_update: VoucherUpdate,

    // Total deletion prize for data objects.
    total_deletion_prize: Balance,
}

impl<Balance: Saturating + Copy> BagUpdate<Balance> {
    // Adds a single object data to the voucher update (updates objects size, number)
    // and deletion prize.
    fn add_object(&mut self, size: u64, deletion_prize: Balance) -> Self {
        self.voucher_update.add_object(size);
        self.total_deletion_prize = self.total_deletion_prize.saturating_add(deletion_prize);

        *self
    }
}

/// Type alias for the DistributionBucketFamilyRecord.
pub type DistributionBucketFamily<T> =
    DistributionBucketFamilyRecord<<T as Trait>::DistributionBucketIndex>;

/// Distribution bucket family.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct DistributionBucketFamilyRecord<DistributionBucketIndex> {
    /// Next distribution bucket index.
    pub next_distribution_bucket_index: DistributionBucketIndex,
}

impl<DistributionBucketIndex: BaseArithmetic>
    DistributionBucketFamilyRecord<DistributionBucketIndex>
{
    // Increments the next distribution bucket index variable.
    fn increment_next_distribution_bucket_index_counter(&mut self) {
        self.next_distribution_bucket_index += One::one()
    }
}

/// Type alias for the DistributionBucketIdRecord.
pub type DistributionBucketId<T> = DistributionBucketIdRecord<
    <T as Trait>::DistributionBucketFamilyId,
    <T as Trait>::DistributionBucketIndex,
>;

/// Complex distribution bucket ID type.
/// Joins a distribution bucket family ID and a distribution bucket index within the family.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub struct DistributionBucketIdRecord<DistributionBucketFamilyId: Ord, DistributionBucketIndex: Ord>
{
    /// Distribution bucket family ID.
    pub distribution_bucket_family_id: DistributionBucketFamilyId,

    /// Distribution bucket ID.
    pub distribution_bucket_index: DistributionBucketIndex,
}

/// Type alias for the DistributionBucketRecord.
pub type DistributionBucket<T> = DistributionBucketRecord<WorkerId<T>>;

/// Distribution bucket.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct DistributionBucketRecord<WorkerId: Ord> {
    /// Distribution bucket accepts new bags.
    pub accepting_new_bags: bool,

    /// Distribution bucket serves objects.
    pub distributing: bool,

    /// Pending invitations for workers to distribute the bucket.
    pub pending_invitations: BTreeSet<WorkerId>,

    /// Active operators to distribute the bucket.
    pub operators: BTreeSet<WorkerId>,

    /// Number of assigned bags.
    pub assigned_bags: u64,
}

impl<WorkerId: Ord> DistributionBucketRecord<WorkerId> {
    // Increment the assigned bags number.
    fn register_bag_assignment(&mut self) {
        self.assigned_bags = self.assigned_bags.saturating_add(1);
    }

    // Decrement the assigned bags number.
    fn unregister_bag_assignment(&mut self) {
        self.assigned_bags = self.assigned_bags.saturating_sub(1);
    }

    // Checks the bag assignment number. Returns true if it equals zero.
    fn no_bags_assigned(&self) -> bool {
        self.assigned_bags == 0
    }
}

decl_storage! {
    trait Store for Module<T: Trait> as Storage {
        /// Defines whether all new uploads blocked
        pub UploadingBlocked get(fn uploading_blocked): bool;

        /// Bags storage map.
        pub Bags get(fn bag): map hasher(blake2_128_concat) BagId<T> => Bag<T>;

        /// Storage bucket id counter. Starts at zero.
        pub NextStorageBucketId get(fn next_storage_bucket_id): T::StorageBucketId;

        /// Data object id counter. Starts at zero.
        pub NextDataObjectId get(fn next_data_object_id): T::DataObjectId;

        /// Storage buckets.
        pub StorageBucketById get (fn storage_bucket_by_id): map hasher(blake2_128_concat)
            T::StorageBucketId => StorageBucket<T>;

        /// Blacklisted data object hashes.
        pub Blacklist get (fn blacklist): map hasher(blake2_128_concat) Cid => ();

        /// Blacklist collection counter.
        pub CurrentBlacklistSize get (fn current_blacklist_size): u64;

        /// Size based pricing of new objects uploaded.
        pub DataObjectPerMegabyteFee get (fn data_object_per_mega_byte_fee): BalanceOf<T>;

        /// "Storage buckets per bag" number limit.
        pub StorageBucketsPerBagLimit get (fn storage_buckets_per_bag_limit): u64;

        /// "Max objects size for a storage bucket voucher" number limit.
        pub VoucherMaxObjectsSizeLimit get (fn voucher_max_objects_size_limit): u64;

        /// "Max objects number for a storage  bucket voucher" number limit.
        pub VoucherMaxObjectsNumberLimit get (fn voucher_max_objects_number_limit): u64;

        /// DynamicBagCreationPolicy by bag type storage map.
        pub DynamicBagCreationPolicies get (fn dynamic_bag_creation_policy):
            map hasher(blake2_128_concat) DynamicBagType =>
            DynamicBagCreationPolicy<T::DistributionBucketFamilyId>;

        /// 'Data objects for bags' storage double map.
        pub DataObjectsById get (fn data_object_by_id): double_map
            hasher(blake2_128_concat) BagId<T>,
            hasher(blake2_128_concat) T::DataObjectId => DataObject<BalanceOf<T>>;

        /// Distribution bucket family id counter. Starts at zero.
        pub NextDistributionBucketFamilyId get(fn next_distribution_bucket_family_id):
            T::DistributionBucketFamilyId;

        /// Distribution bucket families.
        pub DistributionBucketFamilyById get (fn distribution_bucket_family_by_id):
            map hasher(blake2_128_concat) T::DistributionBucketFamilyId =>
            DistributionBucketFamily<T>;

        /// 'Distribution bucket' storage double map.
        pub DistributionBucketByFamilyIdById get (fn distribution_bucket_by_family_id_by_index):
            double_map
            hasher(blake2_128_concat) T::DistributionBucketFamilyId,
            hasher(blake2_128_concat) T::DistributionBucketIndex => DistributionBucket<T>;

        /// Total number of distribution bucket families in the system.
        pub DistributionBucketFamilyNumber get(fn distribution_bucket_family_number): u64;

        /// "Distribution buckets per bag" number limit.
        pub DistributionBucketsPerBagLimit get (fn distribution_buckets_per_bag_limit): u64;
    }
}

decl_event! {
    /// Storage events
 pub enum Event<T>
    where
        <T as Trait>::StorageBucketId,
        WorkerId = WorkerId<T>,
        <T as Trait>::DataObjectId,
        UploadParameters = UploadParameters<T>,
        BagId = BagId<T>,
        DynamicBagId = DynamicBagId<T>,
        <T as frame_system::Trait>::AccountId,
        Balance = BalanceOf<T>,
        <T as Trait>::DistributionBucketFamilyId,
        DistributionBucketId = DistributionBucketId<T>,
        <T as Trait>::DistributionBucketIndex,
    {
        /// Emits on creating the storage bucket.
        /// Params
        /// - storage bucket ID
        /// - invited worker
        /// - flag "accepting_new_bags"
        /// - size limit for voucher,
        /// - objects limit for voucher,
        StorageBucketCreated(StorageBucketId, Option<WorkerId>, bool, u64, u64),

        /// Emits on accepting the storage bucket invitation.
        /// Params
        /// - storage bucket ID
        /// - invited worker ID
        /// - transactor account ID
        StorageBucketInvitationAccepted(StorageBucketId, WorkerId, AccountId),

        /// Emits on updating storage buckets for bag.
        /// Params
        /// - bag ID
        /// - storage buckets to add ID collection
        /// - storage buckets to remove ID collection
        StorageBucketsUpdatedForBag(BagId, BTreeSet<StorageBucketId>, BTreeSet<StorageBucketId>),

        /// Emits on uploading data objects.
        /// Params
        /// - data objects IDs
        /// - initial uploading parameters
        /// - deletion prize for objects
        DataObjectsUploaded(Vec<DataObjectId>, UploadParameters, Balance),

        /// Emits on setting the storage operator metadata.
        /// Params
        /// - storage bucket ID
        /// - invited worker ID
        /// - metadata
        StorageOperatorMetadataSet(StorageBucketId, WorkerId, Vec<u8>),

        /// Emits on setting the storage bucket voucher limits.
        /// Params
        /// - storage bucket ID
        /// - new total objects size limit
        /// - new total objects number limit
        StorageBucketVoucherLimitsSet(StorageBucketId, u64, u64),

        /// Emits on accepting pending data objects.
        /// Params
        /// - storage bucket ID
        /// - worker ID (storage provider ID)
        /// - bag ID
        /// - pending data objects
        PendingDataObjectsAccepted(StorageBucketId, WorkerId, BagId, BTreeSet<DataObjectId>),

        /// Emits on cancelling the storage bucket invitation.
        /// Params
        /// - storage bucket ID
        StorageBucketInvitationCancelled(StorageBucketId),

        /// Emits on the storage bucket operator invitation.
        /// Params
        /// - storage bucket ID
        /// - operator worker ID (storage provider ID)
        StorageBucketOperatorInvited(StorageBucketId, WorkerId),

        /// Emits on the storage bucket operator removal.
        /// Params
        /// - storage bucket ID
        StorageBucketOperatorRemoved(StorageBucketId),

        /// Emits on changing the size-based pricing of new objects uploaded.
        /// Params
        /// - new status
        UploadingBlockStatusUpdated(bool),

        /// Emits on changing the size-based pricing of new objects uploaded.
        /// Params
        /// - new data size fee
        DataObjectPerMegabyteFeeUpdated(Balance),

        /// Emits on changing the "Storage buckets per bag" number limit.
        /// Params
        /// - new limit
        StorageBucketsPerBagLimitUpdated(u64),

        /// Emits on changing the "Storage buckets voucher max limits".
        /// Params
        /// - new objects size limit
        /// - new objects number limit
        StorageBucketsVoucherMaxLimitsUpdated(u64, u64),

        /// Emits on moving data objects between bags.
        /// Params
        /// - source bag ID
        /// - destination bag ID
        /// - data object IDs
        DataObjectsMoved(BagId, BagId, BTreeSet<DataObjectId>),

        /// Emits on data objects deletion from bags.
        /// Params
        /// - account ID for the deletion prize
        /// - bag ID
        /// - data object IDs
        DataObjectsDeleted(AccountId, BagId, BTreeSet<DataObjectId>),

        /// Emits on storage bucket status update.
        /// Params
        /// - storage bucket ID
        /// - new status
        StorageBucketStatusUpdated(StorageBucketId, bool),

        /// Emits on updating the blacklist with data hashes.
        /// Params
        /// - hashes to remove from the blacklist
        /// - hashes to add to the blacklist
        UpdateBlacklist(BTreeSet<Cid>, BTreeSet<Cid>),

        /// Emits on deleting a dynamic bag.
        /// Params
        /// - account ID for the deletion prize
        /// - dynamic bag ID
        DynamicBagDeleted(AccountId, DynamicBagId),

        /// Emits on creating a dynamic bag.
        /// Params
        /// - dynamic bag ID
        /// - optional DynamicBagDeletionPrize instance
        /// - assigned storage buckets' IDs
        /// - assigned distribution buckets' IDs
        DynamicBagCreated(
            DynamicBagId,
            Option<DynamicBagDeletionPrizeRecord<AccountId, Balance>>,
            BTreeSet<StorageBucketId>,
            BTreeSet<DistributionBucketId>,
        ),

        /// Emits on changing the voucher for a storage bucket.
        /// Params
        /// - storage bucket ID
        /// - new voucher
        VoucherChanged(StorageBucketId, Voucher),

        /// Emits on storage bucket deleting.
        /// Params
        /// - storage bucket ID
        StorageBucketDeleted(StorageBucketId),

        /// Emits on updating the number of storage buckets in dynamic bag creation policy.
        /// Params
        /// - dynamic bag type
        /// - new number of storage buckets
        NumberOfStorageBucketsInDynamicBagCreationPolicyUpdated(DynamicBagType, u64),

        /// Bag objects changed.
        /// Params
        /// - bag id
        /// - new total objects size
        /// - new total objects number
        BagObjectsChanged(BagId, u64, u64),

        /// Emits on creating distribution bucket family.
        /// Params
        /// - distribution family bucket ID
        DistributionBucketFamilyCreated(DistributionBucketFamilyId),

        /// Emits on deleting distribution bucket family.
        /// Params
        /// - distribution family bucket ID
        DistributionBucketFamilyDeleted(DistributionBucketFamilyId),

        /// Emits on creating distribution bucket.
        /// Params
        /// - distribution bucket family ID
        /// - accepting new bags
        /// - distribution bucket ID
        DistributionBucketCreated(DistributionBucketFamilyId, bool, DistributionBucketId),

        /// Emits on storage bucket status update (accepting new bags).
        /// Params
        /// - distribution bucket ID
        /// - new status (accepting new bags)
        DistributionBucketStatusUpdated(DistributionBucketId, bool),

        /// Emits on deleting distribution bucket.
        /// Params
        /// - distribution bucket ID
        DistributionBucketDeleted(DistributionBucketId),

        /// Emits on updating distribution buckets for bag.
        /// Params
        /// - bag ID
        /// - storage buckets to add ID collection
        /// - storage buckets to remove ID collection
        DistributionBucketsUpdatedForBag(
            BagId,
            DistributionBucketFamilyId,
            BTreeSet<DistributionBucketIndex>,
            BTreeSet<DistributionBucketIndex>
        ),

        /// Emits on changing the "Distribution buckets per bag" number limit.
        /// Params
        /// - new limit
        DistributionBucketsPerBagLimitUpdated(u64),

        /// Emits on storage bucket mode update (distributing flag).
        /// Params
        /// - distribution bucket ID
        /// - distributing
        DistributionBucketModeUpdated(DistributionBucketId, bool),

        /// Emits on dynamic bag creation policy update (distribution bucket families).
        /// Params
        /// - dynamic bag type
        /// - families and bucket numbers
        FamiliesInDynamicBagCreationPolicyUpdated(
            DynamicBagType,
            BTreeMap<DistributionBucketFamilyId, u32>
        ),

        /// Emits on creating a distribution bucket invitation for the operator.
        /// Params
        /// - distribution bucket ID
        /// - worker ID
        DistributionBucketOperatorInvited(
            DistributionBucketId,
            WorkerId,
        ),

        /// Emits on canceling a distribution bucket invitation for the operator.
        /// Params
        /// - distribution bucket ID
        /// - operator worker ID
        DistributionBucketInvitationCancelled(
            DistributionBucketId,
            WorkerId,
        ),

        /// Emits on accepting a distribution bucket invitation for the operator.
        /// Params
        /// - worker ID
        /// - distribution bucket ID
        DistributionBucketInvitationAccepted(
            WorkerId,
            DistributionBucketId,
        ),

        /// Emits on setting the metadata by a distribution bucket operator.
        /// Params
        /// - worker ID
        /// - distribution bucket ID
        /// - metadata
        DistributionBucketMetadataSet(
            WorkerId,
            DistributionBucketId,
            Vec<u8>
        ),

        /// Emits on the distribution bucket operator removal.
        /// Params
        /// - distribution bucket ID
        /// - distribution bucket operator ID
        DistributionBucketOperatorRemoved(
            DistributionBucketId,
            WorkerId
        ),

        /// Emits on setting the metadata by a distribution bucket family.
        /// Params
        /// - distribution bucket family ID
        /// - metadata
        DistributionBucketFamilyMetadataSet(
            DistributionBucketFamilyId,
            Vec<u8>
        ),

        /// Emits on Storage Operator making a remark
        /// Params
        /// - storage bucket id
        /// - operator's worker id
        /// - remark message
        StorageOperatorRemarked(
            WorkerId,
            StorageBucketId,
            Vec<u8>,
        ),

    }
}

decl_error! {
    /// Storage module predefined errors
    pub enum Error for Module<T: Trait>{
        /// Empty "data object creation" collection.
        NoObjectsOnUpload,

        /// The requested storage bucket doesn't exist.
        StorageBucketDoesntExist,

        /// The requested storage bucket is not bound to a bag.
        StorageBucketIsNotBoundToBag,

        /// The requested storage bucket is already bound to a bag.
        StorageBucketIsBoundToBag,

        /// Invalid operation with invites: there is no storage bucket invitation.
        NoStorageBucketInvitation,

        /// Invalid operation with invites: storage provider was already set.
        StorageProviderAlreadySet,

        /// Storage provider must be set.
        StorageProviderMustBeSet,

        /// Invalid operation with invites: another storage provider was invited.
        DifferentStorageProviderInvited,

        /// Invalid operation with invites: storage provider was already invited.
        InvitedStorageProvider,

        /// Storage bucket id collections are empty.
        StorageBucketIdCollectionsAreEmpty,

        /// Upload data error: empty content ID provided.
        EmptyContentId,

        /// Upload data error: zero object size.
        ZeroObjectSize,

        /// Upload data error: invalid deletion prize source account.
        InvalidDeletionPrizeSourceAccount,

        /// Invalid storage provider for bucket.
        InvalidStorageProvider,

        /// Insufficient balance for an operation.
        InsufficientBalance,

        /// Data object doesn't exist.
        DataObjectDoesntExist,

        /// Uploading of the new object is blocked.
        UploadingBlocked,

        /// Data object id collection is empty.
        DataObjectIdCollectionIsEmpty,

        /// Cannot move objects within the same bag.
        SourceAndDestinationBagsAreEqual,

        /// Data object hash is part of the blacklist.
        DataObjectBlacklisted,

        /// Blacklist size limit exceeded.
        BlacklistSizeLimitExceeded,

        /// Max object size limit exceeded for voucher.
        VoucherMaxObjectSizeLimitExceeded,

        /// Max object number limit exceeded for voucher.
        VoucherMaxObjectNumberLimitExceeded,

        /// Object number limit for the storage bucket reached.
        StorageBucketObjectNumberLimitReached,

        /// Objects total size limit for the storage bucket reached.
        StorageBucketObjectSizeLimitReached,

        /// Insufficient module treasury balance for an operation.
        InsufficientTreasuryBalance,

        /// Cannot delete a non-empty storage bucket.
        CannotDeleteNonEmptyStorageBucket,

        /// The `data_object_ids` extrinsic parameter collection is empty.
        DataObjectIdParamsAreEmpty,

        /// The new `StorageBucketsPerBagLimit` number is too low.
        StorageBucketsPerBagLimitTooLow,

        /// The new `StorageBucketsPerBagLimit` number is too high.
        StorageBucketsPerBagLimitTooHigh,

        /// `StorageBucketsPerBagLimit` was exceeded for a bag.
        StorageBucketPerBagLimitExceeded,

        /// The storage bucket doesn't accept new bags.
        StorageBucketDoesntAcceptNewBags,

        /// Cannot create the dynamic bag: dynamic bag exists.
        DynamicBagExists,

        /// Dynamic bag doesn't exist.
        DynamicBagDoesntExist,

        /// Storage provider operator doesn't exist.
        StorageProviderOperatorDoesntExist,

        /// Invalid extrinsic call: data size fee changed.
        DataSizeFeeChanged,

        /// Cannot delete non empty dynamic bag.
        CannotDeleteNonEmptyDynamicBag,

        /// Max distribution bucket family number limit exceeded.
        MaxDistributionBucketFamilyNumberLimitExceeded,

        /// Distribution bucket family doesn't exist.
        DistributionBucketFamilyDoesntExist,

        /// Distribution bucket doesn't exist.
        DistributionBucketDoesntExist,

        /// Distribution bucket id collections are empty.
        DistributionBucketIdCollectionsAreEmpty,

        /// Distribution bucket doesn't accept new bags.
        DistributionBucketDoesntAcceptNewBags,

        /// Max distribution bucket number per bag limit exceeded.
        MaxDistributionBucketNumberPerBagLimitExceeded,

        /// Distribution bucket is not bound to a bag.
        DistributionBucketIsNotBoundToBag,

        /// Distribution bucket is bound to a bag.
        DistributionBucketIsBoundToBag,

        /// The new `DistributionBucketsPerBagLimit` number is too low.
        DistributionBucketsPerBagLimitTooLow,

        /// The new `DistributionBucketsPerBagLimit` number is too high.
        DistributionBucketsPerBagLimitTooHigh,

        /// Distribution provider operator doesn't exist.
        DistributionProviderOperatorDoesntExist,

        /// Distribution provider operator already invited.
        DistributionProviderOperatorAlreadyInvited,

        /// Distribution provider operator already set.
        DistributionProviderOperatorSet,

        /// No distribution bucket invitation.
        NoDistributionBucketInvitation,

        /// Invalid operations: must be a distribution provider operator for a bucket.
        MustBeDistributionProviderOperatorForBucket,

        /// Max number of pending invitations limit for a distribution bucket reached.
        MaxNumberOfPendingInvitationsLimitForDistributionBucketReached,

        /// Distribution family bound to a bag creation policy.
        DistributionFamilyBoundToBagCreationPolicy,

        /// Max data object size exceeded.
        MaxDataObjectSizeExceeded,

        /// Different Accounts for dynamic bag deletion prize and upload fees
        AccountsNotCoherent,

        /// Different Accounts for dynamic bag id and parameters bag id
        BagsNotCoherent,

        /// Invalid transactor account ID for this bucket.
        InvalidTransactorAccount,
    }
}

decl_module! {
    /// _Storage_ substrate module.
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Default deposit_event() handler
        fn deposit_event() = default;

        /// Predefined errors.
        type Error = Error<T>;

        /// Exports const - a prize for a data object deletion.
        const DataObjectDeletionPrize: BalanceOf<T> = T::DataObjectDeletionPrize::get();

        /// Exports const - maximum size of the "hash blacklist" collection.
        const BlacklistSizeLimit: u64 = T::BlacklistSizeLimit::get();

        /// Exports const - "Storage buckets per bag" value constraint.
        const StorageBucketsPerBagValueConstraint: StorageBucketsPerBagValueConstraint =
            T::StorageBucketsPerBagValueConstraint::get();

        /// Exports const - the default dynamic bag creation policy for members (storage bucket
        /// number).
        const DefaultMemberDynamicBagNumberOfStorageBuckets: u64 =
            T::DefaultMemberDynamicBagNumberOfStorageBuckets::get();

        /// Exports const - the default dynamic bag creation policy for channels (storage bucket
        /// number).
        const DefaultChannelDynamicBagNumberOfStorageBuckets: u64 =
            T::DefaultChannelDynamicBagNumberOfStorageBuckets::get();

        /// Exports const - max allowed distribution bucket family number.
        const MaxDistributionBucketFamilyNumber: u64 = T::MaxDistributionBucketFamilyNumber::get();

        /// Exports const - "Distribution buckets per bag" value constraint.
        const DistributionBucketsPerBagValueConstraint: StorageBucketsPerBagValueConstraint =
            T::DistributionBucketsPerBagValueConstraint::get();

        /// Exports const - max number of pending invitations per distribution bucket.
        const MaxNumberOfPendingInvitationsPerDistributionBucket: u64 =
            T::MaxNumberOfPendingInvitationsPerDistributionBucket::get();

        /// Exports const - max data object size in bytes.
        const MaxDataObjectSize: u64 = T::MaxDataObjectSize::get();

        // ===== Storage Lead actions =====

        /// Delete storage bucket. Must be empty. Storage operator must be missing.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_storage_bucket(
            origin,
            storage_bucket_id: T::StorageBucketId,
        ){
            T::ensure_storage_working_group_leader_origin(origin)?;

            let bucket = Self::ensure_storage_bucket_exists(&storage_bucket_id)?;

            ensure!(
                bucket.voucher.objects_used == 0,
                Error::<T>::CannotDeleteNonEmptyStorageBucket
            );

            // Check that no assigned bags left.
            ensure!(bucket.no_bags_assigned(), Error::<T>::StorageBucketIsBoundToBag);

            //
            // == MUTATION SAFE ==
            //

            <StorageBucketById<T>>::remove(storage_bucket_id);

            Self::deposit_event(
                RawEvent::StorageBucketDeleted(storage_bucket_id)
            );
        }

        /// Updates global uploading flag.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_uploading_blocked_status(origin, new_status: bool) {
            T::ensure_storage_working_group_leader_origin(origin)?;

            //
            // == MUTATION SAFE ==
            //

            UploadingBlocked::put(new_status);

            Self::deposit_event(RawEvent::UploadingBlockStatusUpdated(new_status));
        }

        /// Updates size-based pricing of new objects uploaded.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_data_size_fee(origin, new_data_size_fee: BalanceOf<T>) {
            T::ensure_storage_working_group_leader_origin(origin)?;

            //
            // == MUTATION SAFE ==
            //

            DataObjectPerMegabyteFee::<T>::put(new_data_size_fee);

            Self::deposit_event(RawEvent::DataObjectPerMegabyteFeeUpdated(new_data_size_fee));
        }

        /// Updates "Storage buckets per bag" number limit.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_storage_buckets_per_bag_limit(origin, new_limit: u64) {
            T::ensure_storage_working_group_leader_origin(origin)?;

            T::StorageBucketsPerBagValueConstraint::get().ensure_valid(
                new_limit,
                Error::<T>::StorageBucketsPerBagLimitTooLow,
                Error::<T>::StorageBucketsPerBagLimitTooHigh,
            )?;

            //
            // == MUTATION SAFE ==
            //

            StorageBucketsPerBagLimit::put(new_limit);

            Self::deposit_event(RawEvent::StorageBucketsPerBagLimitUpdated(new_limit));
        }

        /// Updates "Storage buckets voucher max limits".
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_storage_buckets_voucher_max_limits(
            origin,
            new_objects_size: u64,
            new_objects_number: u64,
        ) {
            T::ensure_storage_working_group_leader_origin(origin)?;

            //
            // == MUTATION SAFE ==
            //

            VoucherMaxObjectsSizeLimit::put(new_objects_size);
            VoucherMaxObjectsNumberLimit::put(new_objects_number);

            Self::deposit_event(
                RawEvent::StorageBucketsVoucherMaxLimitsUpdated(new_objects_size, new_objects_number)
            );
        }

        /// Update number of storage buckets used in given dynamic bag creation policy.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_number_of_storage_buckets_in_dynamic_bag_creation_policy(
            origin,
            dynamic_bag_type: DynamicBagType,
            number_of_storage_buckets: u64,
        ) {
            T::ensure_storage_working_group_leader_origin(origin)?;

            //
            // == MUTATION SAFE ==
            //

            let mut creation_policy = Self::get_dynamic_bag_creation_policy(dynamic_bag_type);

            creation_policy.number_of_storage_buckets = number_of_storage_buckets;

            DynamicBagCreationPolicies::<T>::insert(dynamic_bag_type, creation_policy);

            Self::deposit_event(
                RawEvent::NumberOfStorageBucketsInDynamicBagCreationPolicyUpdated(
                    dynamic_bag_type,
                    number_of_storage_buckets
                )
            );
        }

        /// Add and remove hashes to the current blacklist.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_blacklist(
            origin,
            remove_hashes: BTreeSet<Cid>,
            add_hashes: BTreeSet<Cid>
        ){
            T::ensure_storage_working_group_leader_origin(origin)?;

            // Get only hashes that exist in the blacklist.
            let verified_remove_hashes = Self::get_existing_hashes(&remove_hashes);

            // Get only hashes that doesn't exist in the blacklist.
            let verified_add_hashes = Self::get_nonexisting_hashes(&add_hashes);

            let updated_blacklist_size: u64 = Self::current_blacklist_size()
                .saturating_add(verified_add_hashes.len().saturated_into::<u64>())
                .saturating_sub(verified_remove_hashes.len().saturated_into::<u64>());

            ensure!(
                updated_blacklist_size <= T::BlacklistSizeLimit::get(),
                Error::<T>::BlacklistSizeLimitExceeded
            );

            //
            // == MUTATION SAFE ==
            //

            for cid in verified_remove_hashes.iter() {
                Blacklist::remove(cid);
            }

            for cid in verified_add_hashes.iter() {
                Blacklist::insert(cid, ());
            }

            CurrentBlacklistSize::put(updated_blacklist_size);

            Self::deposit_event(RawEvent::UpdateBlacklist(remove_hashes, add_hashes));
        }

        /// Create storage bucket.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_storage_bucket(
            origin,
            invite_worker: Option<WorkerId<T>>,
            accepting_new_bags: bool,
            size_limit: u64,
            objects_limit: u64,
        ) {
            T::ensure_storage_working_group_leader_origin(origin)?;

            let voucher = Voucher {
                size_limit,
                objects_limit,
                ..Default::default()
            };

            Self::can_create_storage_bucket(&voucher, &invite_worker)?;

            //
            // == MUTATION SAFE ==
            //

            let operator_status = invite_worker
                .map(StorageBucketOperatorStatus::InvitedStorageWorker)
                .unwrap_or(StorageBucketOperatorStatus::Missing);

            let storage_bucket = StorageBucket::<T> {
                operator_status,
                accepting_new_bags,
                voucher,
                assigned_bags: 0,
            };

            let storage_bucket_id = Self::next_storage_bucket_id();

            <NextStorageBucketId<T>>::put(storage_bucket_id + One::one());

            <StorageBucketById<T>>::insert(storage_bucket_id, storage_bucket);

            Self::deposit_event(
                RawEvent::StorageBucketCreated(
                    storage_bucket_id,
                    invite_worker,
                    accepting_new_bags,
                    size_limit,
                    objects_limit,
                )
            );
        }

        /// Updates storage buckets for a bag..
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_storage_buckets_for_bag(
            origin,
            bag_id: BagId<T>,
            add_buckets: BTreeSet<T::StorageBucketId>,
            remove_buckets: BTreeSet<T::StorageBucketId>,
        ) {
            T::ensure_storage_working_group_leader_origin(origin)?;

            Self::ensure_bag_exists(&bag_id)?;

            let voucher_update = Self::validate_update_storage_buckets_for_bag_params(
                &bag_id,
                &add_buckets,
                &remove_buckets,
            )?;

            //
            // == MUTATION SAFE ==
            //

            // Update vouchers.
            if !add_buckets.is_empty() {
                Self::change_storage_buckets_vouchers(
                    &add_buckets,
                    &voucher_update,
                    OperationType::Increase
                );
            }
            if !remove_buckets.is_empty() {
                Self::change_storage_buckets_vouchers(
                    &remove_buckets,
                    &voucher_update,
                    OperationType::Decrease
                );
            }

            // Update bag counters.
            Self::change_bag_assignments_for_storage_buckets(&add_buckets, &remove_buckets);

            Bags::<T>::mutate(&bag_id, |bag| {
                bag.update_storage_buckets(&mut add_buckets.clone(), &remove_buckets);
            });

            Self::deposit_event(
                RawEvent::StorageBucketsUpdatedForBag(bag_id, add_buckets, remove_buckets)
            );
        }

        /// Cancel pending storage bucket invite. An invitation must be pending.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn cancel_storage_bucket_operator_invite(origin, storage_bucket_id: T::StorageBucketId){
            T::ensure_storage_working_group_leader_origin(origin)?;

            let bucket = Self::ensure_storage_bucket_exists(&storage_bucket_id)?;

            Self::ensure_bucket_pending_invitation_status(&bucket)?;

            //
            // == MUTATION SAFE ==
            //

            <StorageBucketById<T>>::mutate(storage_bucket_id, |bucket| {
                bucket.operator_status = StorageBucketOperatorStatus::Missing;
            });

            Self::deposit_event(
                RawEvent::StorageBucketInvitationCancelled(storage_bucket_id)
            );
        }

        /// Invite storage bucket operator. Must be missing.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn invite_storage_bucket_operator(
            origin,
            storage_bucket_id: T::StorageBucketId,
            operator_id: WorkerId<T>,
        ){
            T::ensure_storage_working_group_leader_origin(origin)?;

            let bucket = Self::ensure_storage_bucket_exists(&storage_bucket_id)?;

            Self::ensure_bucket_missing_invitation_status(&bucket)?;

            Self::ensure_storage_provider_operator_exists(&operator_id)?;

            //
            // == MUTATION SAFE ==
            //

            <StorageBucketById<T>>::mutate(storage_bucket_id, |bucket| {
                bucket.operator_status =
                    StorageBucketOperatorStatus::InvitedStorageWorker(operator_id);
            });

            Self::deposit_event(
                RawEvent::StorageBucketOperatorInvited(storage_bucket_id, operator_id)
            );
        }

        /// Removes storage bucket operator.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn remove_storage_bucket_operator(
            origin,
            storage_bucket_id: T::StorageBucketId,
        ){
            T::ensure_storage_working_group_leader_origin(origin)?;

            let bucket = Self::ensure_storage_bucket_exists(&storage_bucket_id)?;

            Self::ensure_bucket_storage_provider_invitation_status_for_removal(&bucket)?;

            //
            // == MUTATION SAFE ==
            //

            <StorageBucketById<T>>::mutate(storage_bucket_id, |bucket| {
                bucket.operator_status =
                    StorageBucketOperatorStatus::Missing;
            });

            Self::deposit_event(
                RawEvent::StorageBucketOperatorRemoved(storage_bucket_id)
            );
        }

        /// Update whether new bags are being accepted for storage.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_storage_bucket_status(
            origin,
            storage_bucket_id: T::StorageBucketId,
            accepting_new_bags: bool
        ) {
            T::ensure_storage_working_group_leader_origin(origin)?;

            Self::ensure_storage_bucket_exists(&storage_bucket_id)?;

            //
            // == MUTATION SAFE ==
            //

            <StorageBucketById<T>>::mutate(storage_bucket_id, |bucket| {
                bucket.accepting_new_bags = accepting_new_bags;
            });

            Self::deposit_event(
                RawEvent::StorageBucketStatusUpdated(storage_bucket_id, accepting_new_bags)
            );
        }

        /// Sets storage bucket voucher limits.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_storage_bucket_voucher_limits(
            origin,
            storage_bucket_id: T::StorageBucketId,
            new_objects_size_limit: u64,
            new_objects_number_limit: u64,
        ) {
            T::ensure_storage_working_group_leader_origin(origin)?;

            Self::ensure_storage_bucket_exists(&storage_bucket_id)?;

            ensure!(
                new_objects_size_limit <= Self::voucher_max_objects_size_limit(),
                Error::<T>::VoucherMaxObjectSizeLimitExceeded
            );

            ensure!(
                new_objects_number_limit <= Self::voucher_max_objects_number_limit(),
                Error::<T>::VoucherMaxObjectNumberLimitExceeded
            );

            //
            // == MUTATION SAFE ==
            //

            <StorageBucketById<T>>::mutate(storage_bucket_id, |bucket| {
                bucket.voucher = Voucher{
                    size_limit: new_objects_size_limit,
                    objects_limit: new_objects_number_limit,
                    ..bucket.voucher
                };
            });

            Self::deposit_event(
                RawEvent::StorageBucketVoucherLimitsSet(
                    storage_bucket_id,
                    new_objects_size_limit,
                    new_objects_number_limit
                )
            );
        }

        // ===== Storage Operator actions =====

        /// Accept the storage bucket invitation. An invitation must match the worker_id parameter.
        /// It accepts an additional account ID (transactor) for accepting data objects to prevent
        /// transaction nonce collisions.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn accept_storage_bucket_invitation(
            origin,
            worker_id: WorkerId<T>,
            storage_bucket_id: T::StorageBucketId,
            transactor_account_id: T::AccountId,
        ) {
            T::ensure_storage_worker_origin(origin, worker_id)?;

            let bucket = Self::ensure_storage_bucket_exists(&storage_bucket_id)?;

            Self::ensure_bucket_storage_provider_invitation_status(&bucket, worker_id)?;

            //
            // == MUTATION SAFE ==
            //

            <StorageBucketById<T>>::mutate(storage_bucket_id, |bucket| {
                bucket.operator_status =
                    StorageBucketOperatorStatus::StorageWorker(
                        worker_id,
                        transactor_account_id.clone()
                );
            });

            Self::deposit_event(
                RawEvent::StorageBucketInvitationAccepted(
                    storage_bucket_id,
                    worker_id,
                    transactor_account_id
                )
            );
        }

        /// Sets storage operator metadata (eg.: storage node URL).
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_storage_operator_metadata(
            origin,
            worker_id: WorkerId<T>,
            storage_bucket_id: T::StorageBucketId,
            metadata: Vec<u8>
        ) {
            T::ensure_storage_worker_origin(origin, worker_id)?;

            let bucket = Self::ensure_storage_bucket_exists(&storage_bucket_id)?;

            Self::ensure_bucket_invitation_accepted(&bucket, worker_id)?;

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(
                RawEvent::StorageOperatorMetadataSet(storage_bucket_id, worker_id, metadata)
            );
        }

        /// A storage provider signals that the data object was successfully uploaded to its storage.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn accept_pending_data_objects(
            origin,
            worker_id: WorkerId<T>,
            storage_bucket_id: T::StorageBucketId,
            bag_id: BagId<T>,
            data_objects: BTreeSet<T::DataObjectId>,
        ) {
            let transactor_account_id = ensure_signed(origin)?;

            let bucket = Self::ensure_storage_bucket_exists(&storage_bucket_id)?;

            Self::ensure_bucket_transactor_access(&bucket, worker_id, transactor_account_id)?;

            Self::ensure_bag_exists(&bag_id)?;

            Self::validate_accept_pending_data_objects_params(
                &bag_id,
                &data_objects,
                &storage_bucket_id
            )?;

            //
            // == MUTATION SAFE ==
            //

            // Accept data objects for a bag.
            for data_object_id in data_objects.iter() {
                DataObjectsById::<T>::mutate(&bag_id, data_object_id, |data_object| {
                    data_object.accepted = true;
                });
            }

            Self::deposit_event(
                RawEvent::PendingDataObjectsAccepted(
                    storage_bucket_id,
                    worker_id,
                    bag_id,
                    data_objects
                )
            );
        }

        // ===== Distribution Lead actions =====

        /// Create a distribution bucket family.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_distribution_bucket_family(origin) {
            T::ensure_distribution_working_group_leader_origin(origin)?;

            ensure!(
                Self::distribution_bucket_family_number() <
                    T::MaxDistributionBucketFamilyNumber::get(),
                Error::<T>::MaxDistributionBucketFamilyNumberLimitExceeded
            );

            //
            // == MUTATION SAFE ==
            //

            Self::increment_distribution_family_number();

            let family = DistributionBucketFamily::<T>::default();

            let family_id = Self::next_distribution_bucket_family_id();

            <NextDistributionBucketFamilyId<T>>::put(family_id + One::one());

            <DistributionBucketFamilyById<T>>::insert(family_id, family);

            Self::deposit_event(RawEvent::DistributionBucketFamilyCreated(family_id));
        }

        /// Deletes a distribution bucket family.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_distribution_bucket_family(origin, family_id: T::DistributionBucketFamilyId) {
            T::ensure_distribution_working_group_leader_origin(origin)?;

            Self::ensure_distribution_bucket_family_exists(&family_id)?;

            // Check that no assigned bags left.
            ensure!(Self::no_bags_assigned(&family_id), Error::<T>::DistributionBucketIsBoundToBag);

            Self::check_dynamic_bag_creation_policy_for_dependencies(
                &family_id,
                DynamicBagType::Member
            )?;
            Self::check_dynamic_bag_creation_policy_for_dependencies(
                &family_id,
                DynamicBagType::Channel
            )?;

            //
            // == MUTATION SAFE ==
            //

            Self::decrement_distribution_family_number();

            <DistributionBucketFamilyById<T>>::remove(family_id);

            Self::deposit_event(RawEvent::DistributionBucketFamilyDeleted(family_id));
        }

        /// Create a distribution bucket.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_distribution_bucket(
            origin,
            family_id: T::DistributionBucketFamilyId,
            accepting_new_bags: bool,
        ) {
            T::ensure_distribution_working_group_leader_origin(origin)?;

            let family = Self::ensure_distribution_bucket_family_exists(&family_id)?;

            //
            // == MUTATION SAFE ==
            //

            let bucket = DistributionBucket::<T> {
                accepting_new_bags,
                distributing: true,
                pending_invitations: BTreeSet::new(),
                operators: BTreeSet::new(),
                assigned_bags: 0,
            };

            let bucket_index = family.next_distribution_bucket_index;
            let bucket_id = Self::create_distribution_bucket_id(family_id, bucket_index);

            <DistributionBucketFamilyById<T>>::mutate(family_id, |family|{
                family.increment_next_distribution_bucket_index_counter();
            });

            <DistributionBucketByFamilyIdById<T>>::insert(family_id, bucket_index, bucket);

            Self::deposit_event(
                RawEvent::DistributionBucketCreated(family_id, accepting_new_bags, bucket_id)
            );
        }

        /// Updates a distribution bucket 'accepts new bags' flag.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_distribution_bucket_status(
            origin,
            bucket_id: DistributionBucketId<T>,
            accepting_new_bags: bool
        ) {
            T::ensure_distribution_working_group_leader_origin(origin)?;

            Self::ensure_distribution_bucket_exists(&bucket_id)?;

            //
            // == MUTATION SAFE ==
            //

            <DistributionBucketByFamilyIdById<T>>::mutate(
                bucket_id.distribution_bucket_family_id,
                bucket_id.distribution_bucket_index,
                |bucket| {
                    bucket.accepting_new_bags = accepting_new_bags;
                }
            );

            Self::deposit_event(
                RawEvent::DistributionBucketStatusUpdated(bucket_id, accepting_new_bags)
            );
        }

        /// Delete distribution bucket. Must be empty.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_distribution_bucket(
            origin,
            bucket_id: DistributionBucketId<T>,
        ){
            T::ensure_distribution_working_group_leader_origin(origin)?;

            let bucket = Self::ensure_distribution_bucket_exists(&bucket_id)?;

            // Check that no assigned bags left.
            ensure!(bucket.no_bags_assigned(), Error::<T>::DistributionBucketIsBoundToBag);

            // Check that all operators were removed.
            ensure!(bucket.operators.is_empty(), Error::<T>::DistributionProviderOperatorSet);

            //
            // == MUTATION SAFE ==
            //

            <DistributionBucketByFamilyIdById<T>>::remove(
                &bucket_id.distribution_bucket_family_id,
                &bucket_id.distribution_bucket_index
            );

            Self::deposit_event(
                RawEvent::DistributionBucketDeleted(bucket_id)
            );
        }

        /// Updates distribution buckets for a bag.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_distribution_buckets_for_bag(
            origin,
            bag_id: BagId<T>,
            family_id: T::DistributionBucketFamilyId,
            add_buckets_indices: BTreeSet<T::DistributionBucketIndex>,
            remove_buckets_indices: BTreeSet<T::DistributionBucketIndex>,
        ) {
            T::ensure_distribution_working_group_leader_origin(origin)?;

            Self::validate_update_distribution_buckets_for_bag_params(
                &bag_id,
                &family_id,
                &add_buckets_indices,
                &remove_buckets_indices,
            )?;

            //
            // == MUTATION SAFE ==
            //

            let add_buckets_ids = add_buckets_indices
                .iter()
                .map(|idx| Self::create_distribution_bucket_id(family_id, *idx))
                .collect::<BTreeSet<_>>();

            let remove_buckets_ids = remove_buckets_indices
                .iter()
                .map(|idx| Self::create_distribution_bucket_id(family_id, *idx))
                .collect::<BTreeSet<_>>();

            Bags::<T>::mutate(&bag_id, |bag| {
                bag.update_distribution_buckets(&mut add_buckets_ids.clone(), &remove_buckets_ids);
            });

            Self::change_bag_assignments_for_distribution_buckets(
                &add_buckets_ids,
                &remove_buckets_ids
            );

            Self::deposit_event(
                RawEvent::DistributionBucketsUpdatedForBag(
                    bag_id,
                    family_id,
                    add_buckets_indices,
                    remove_buckets_indices
                )
            );
        }

        /// Updates "Distribution buckets per bag" number limit.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_distribution_buckets_per_bag_limit(origin, new_limit: u64) {
            T::ensure_distribution_working_group_leader_origin(origin)?;

            T::DistributionBucketsPerBagValueConstraint::get().ensure_valid(
                new_limit,
                Error::<T>::DistributionBucketsPerBagLimitTooLow,
                Error::<T>::DistributionBucketsPerBagLimitTooHigh,
            )?;

            //
            // == MUTATION SAFE ==
            //

            DistributionBucketsPerBagLimit::put(new_limit);

            Self::deposit_event(RawEvent::DistributionBucketsPerBagLimitUpdated(new_limit));
        }

        /// Updates 'distributing' flag for the distributing flag.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_distribution_bucket_mode(
            origin,
            bucket_id: DistributionBucketId<T>,
            distributing: bool
        ) {
            T::ensure_distribution_working_group_leader_origin(origin)?;

            Self::ensure_distribution_bucket_exists(&bucket_id)?;

            //
            // == MUTATION SAFE ==
            //

            <DistributionBucketByFamilyIdById<T>>::mutate(
                bucket_id.distribution_bucket_family_id,
                bucket_id.distribution_bucket_index,
                |bucket| {
                    bucket.distributing = distributing;
                }
            );

            Self::deposit_event(
                RawEvent::DistributionBucketModeUpdated(bucket_id, distributing)
            );
        }

        /// Update number of distributed buckets used in given dynamic bag creation policy.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_families_in_dynamic_bag_creation_policy(
            origin,
            dynamic_bag_type: DynamicBagType,
            families: BTreeMap<T::DistributionBucketFamilyId, u32>
        ) {
            T::ensure_distribution_working_group_leader_origin(origin)?;

            Self::validate_update_families_in_dynamic_bag_creation_policy_params(&families)?;

            //
            // == MUTATION SAFE ==
            //

            // We initialize the default storage bucket number here if no policy exists.
            let mut new_policy = Self::get_dynamic_bag_creation_policy(dynamic_bag_type);
            new_policy.families = families.clone();

            DynamicBagCreationPolicies::<T>::insert(dynamic_bag_type, new_policy);

            Self::deposit_event(
                RawEvent::FamiliesInDynamicBagCreationPolicyUpdated(
                    dynamic_bag_type,
                    families
                )
            );
        }

        /// Invite an operator. Must be missing.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn invite_distribution_bucket_operator(
            origin,
            bucket_id: DistributionBucketId<T>,
            operator_worker_id: WorkerId<T>
        ) {
            T::ensure_distribution_working_group_leader_origin(origin)?;

            let bucket = Self::ensure_distribution_bucket_exists(&bucket_id)?;

            Self::ensure_distribution_provider_can_be_invited(&bucket, &operator_worker_id)?;

            //
            // == MUTATION SAFE ==
            //

            <DistributionBucketByFamilyIdById<T>>::mutate(
                bucket_id.distribution_bucket_family_id,
                bucket_id.distribution_bucket_index,
                |bucket| {
                    bucket.pending_invitations.insert(operator_worker_id);
                }
            );

            Self::deposit_event(
                RawEvent::DistributionBucketOperatorInvited(bucket_id, operator_worker_id)
            );
        }

        /// Cancel pending invite. Must be pending.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn cancel_distribution_bucket_operator_invite(
            origin,
            bucket_id: DistributionBucketId<T>,
            operator_worker_id: WorkerId<T>
        ) {
            T::ensure_distribution_working_group_leader_origin(origin)?;

            let bucket = Self::ensure_distribution_bucket_exists(&bucket_id)?;

            ensure!(
                bucket.pending_invitations.contains(&operator_worker_id),
                Error::<T>::NoDistributionBucketInvitation
            );

            //
            // == MUTATION SAFE ==
            //

            <DistributionBucketByFamilyIdById<T>>::mutate(
                bucket_id.distribution_bucket_family_id,
                bucket_id.distribution_bucket_index,
                |bucket| {
                    bucket.pending_invitations.remove(&operator_worker_id);
                }
            );

            Self::deposit_event(
                RawEvent::DistributionBucketInvitationCancelled(
                    bucket_id,
                    operator_worker_id
                )
            );
        }

        /// Removes distribution bucket operator.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn remove_distribution_bucket_operator(
            origin,
            bucket_id: DistributionBucketId<T>,
            operator_worker_id: WorkerId<T>,
        ){
            T::ensure_distribution_working_group_leader_origin(origin)?;

            let bucket = Self::ensure_distribution_bucket_exists(&bucket_id)?;

            ensure!(
                bucket.operators.contains(&operator_worker_id),
                Error::<T>::MustBeDistributionProviderOperatorForBucket
            );


            //
            // == MUTATION SAFE ==
            //

            <DistributionBucketByFamilyIdById<T>>::mutate(
                bucket_id.distribution_bucket_family_id,
                bucket_id.distribution_bucket_index,
                |bucket| {
                    bucket.operators.remove(&operator_worker_id);
                }
            );

            Self::deposit_event(
                RawEvent::DistributionBucketOperatorRemoved(bucket_id, operator_worker_id)
            );
        }

        /// Set distribution bucket family metadata.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_distribution_bucket_family_metadata(
            origin,
            family_id: T::DistributionBucketFamilyId,
            metadata: Vec<u8>,
        ) {
            T::ensure_distribution_working_group_leader_origin(origin)?;

            Self::ensure_distribution_bucket_family_exists(&family_id)?;

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(
                RawEvent::DistributionBucketFamilyMetadataSet(
                    family_id,
                    metadata
                )
            );
        }


        // ===== Distribution Operator actions =====

        /// Accept pending invite.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn accept_distribution_bucket_invitation(
            origin,
            worker_id: WorkerId<T>,
            bucket_id: DistributionBucketId<T>,
        ) {
            T::ensure_distribution_worker_origin(origin, worker_id)?;

            let bucket = Self::ensure_distribution_bucket_exists(&bucket_id)?;

            ensure!(
                bucket.pending_invitations.contains(&worker_id),
                Error::<T>::NoDistributionBucketInvitation
            );

            //
            // == MUTATION SAFE ==
            //

            <DistributionBucketByFamilyIdById<T>>::mutate(
                bucket_id.distribution_bucket_family_id,
                bucket_id.distribution_bucket_index,
                |bucket| {
                    bucket.pending_invitations.remove(&worker_id);
                    bucket.operators.insert(worker_id);
                }
            );

            Self::deposit_event(
                RawEvent::DistributionBucketInvitationAccepted(worker_id, bucket_id)
            );
        }

        /// Set distribution operator metadata for the distribution bucket.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_distribution_operator_metadata(
            origin,
            worker_id: WorkerId<T>,
            bucket_id: DistributionBucketId<T>,
            metadata: Vec<u8>,
        ) {
            T::ensure_distribution_worker_origin(origin, worker_id)?;

            let bucket = Self::ensure_distribution_bucket_exists(&bucket_id)?;

            ensure!(
                bucket.operators.contains(&worker_id),
                Error::<T>::MustBeDistributionProviderOperatorForBucket
            );

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(
                RawEvent::DistributionBucketMetadataSet(worker_id, bucket_id, metadata)
            );
        }

        // ===== Sudo actions (development mode) =====

        /// Upload new data objects. Development mode.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn sudo_upload_data_objects(origin, params: UploadParameters<T>) {
            ensure_root(origin)?;

            Self::upload_data_objects(params)?;
        }

        /// Create a dynamic bag. Development mode.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn sudo_create_dynamic_bag(
            origin,
            bag_id: DynamicBagId<T>,
            deletion_prize: Option<DynamicBagDeletionPrize<T>>,
        ) {
            ensure_root(origin)?;

            Self::create_dynamic_bag(bag_id, deletion_prize)?;
        }

        /// Create a dynamic bag. Development mode.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn storage_operator_remark(
            origin,
            worker_id: WorkerId<T>,
            storage_bucket_id: T::StorageBucketId,
            msg: Vec<u8>,
        ) {
            let bucket = Self::ensure_storage_bucket_exists(&storage_bucket_id)?;
            Self::ensure_bucket_invitation_accepted(&bucket, worker_id)?;
            Self::deposit_event(RawEvent::StorageOperatorRemarked(worker_id, storage_bucket_id, msg));
        }
    }
}

// Public methods
impl<T: Trait> DataObjectStorage<T> for Module<T> {
    fn can_upload_data_objects(params: &UploadParameters<T>) -> DispatchResult {
        Self::validate_upload_data_objects_parameters(params).map(|_| ())
    }

    fn upload_data_objects(params: UploadParameters<T>) -> DispatchResult {
        let bag = Self::ensure_bag_exists(&params.bag_id)?;
        let bag_change = Self::validate_upload_data_objects_parameters(&params)?;
        Self::upload_data_objects_inner(&params, &bag_change, &bag)?;
        Ok(())
    }

    fn can_move_data_objects(
        src_bag_id: &BagId<T>,
        dest_bag_id: &BagId<T>,
        objects: &BTreeSet<<T as Trait>::DataObjectId>,
    ) -> DispatchResult {
        Self::validate_data_objects_on_moving(src_bag_id, dest_bag_id, objects).map(|_| ())
    }

    fn move_data_objects(
        src_bag_id: BagId<T>,
        dest_bag_id: BagId<T>,
        objects: BTreeSet<T::DataObjectId>,
    ) -> DispatchResult {
        let src_bag = Self::ensure_bag_exists(&src_bag_id)?;
        let dest_bag = Self::ensure_bag_exists(&dest_bag_id)?;

        let bag_change =
            Self::validate_data_objects_on_moving(&src_bag_id, &dest_bag_id, &objects)?;

        //
        // == MUTATION SAFE ==
        //

        for object_id in objects.iter() {
            DataObjectsById::<T>::swap(&src_bag_id, &object_id, &dest_bag_id, &object_id);
        }

        // Change source bag.
        Self::change_storage_bucket_vouchers_for_bag(
            &src_bag_id,
            &src_bag,
            &bag_change.voucher_update,
            OperationType::Decrease,
        );

        // Change destination bag.
        Self::change_storage_bucket_vouchers_for_bag(
            &dest_bag_id,
            &dest_bag,
            &bag_change.voucher_update,
            OperationType::Increase,
        );

        Self::deposit_event(RawEvent::DataObjectsMoved(src_bag_id, dest_bag_id, objects));

        Ok(())
    }

    fn can_delete_data_objects(
        bag_id: &BagId<T>,
        objects: &BTreeSet<T::DataObjectId>,
    ) -> DispatchResult {
        Self::validate_delete_data_objects_params(bag_id, objects).map(|_| ())
    }

    fn delete_data_objects(
        deletion_prize_account_id: T::AccountId,
        bag_id: BagId<T>,
        objects: BTreeSet<T::DataObjectId>,
    ) -> DispatchResult {
        let bag = Self::ensure_bag_exists(&bag_id)?;

        let bag_change = Self::validate_delete_data_objects_params(&bag_id, &objects)?;

        //
        // == MUTATION SAFE ==
        //

        <StorageTreasury<T>>::withdraw(
            &deletion_prize_account_id,
            bag_change.total_deletion_prize,
        )?;

        for data_object_id in objects.iter() {
            DataObjectsById::<T>::remove(&bag_id, &data_object_id);
        }

        Self::change_storage_bucket_vouchers_for_bag(
            &bag_id,
            &bag,
            &bag_change.voucher_update,
            OperationType::Decrease,
        );

        Self::deposit_event(RawEvent::DataObjectsDeleted(
            deletion_prize_account_id,
            bag_id,
            objects,
        ));

        Ok(())
    }

    fn can_delete_dynamic_bag(dynamic_bag_id: &DynamicBagId<T>) -> DispatchResult {
        Self::validate_delete_dynamic_bag_params(dynamic_bag_id, false).map(|_| ())
    }

    fn can_delete_dynamic_bag_with_objects(dynamic_bag_id: &DynamicBagId<T>) -> DispatchResult {
        Self::validate_delete_dynamic_bag_params(dynamic_bag_id, true).map(|_| ())
    }

    fn delete_dynamic_bag(
        deletion_prize_account_id: T::AccountId,
        dynamic_bag_id: DynamicBagId<T>,
    ) -> DispatchResult {
        // make deletion always be performed on an empty bag
        let deletion_prize = Self::validate_delete_dynamic_bag_params(&dynamic_bag_id, false)?;

        let bag_id: BagId<T> = dynamic_bag_id.clone().into();

        let deleted_dynamic_bag = Self::dynamic_bag(&dynamic_bag_id);

        //
        // == MUTATION SAFE ==
        //

        if let Some(deletion_prize) = deletion_prize {
            <StorageTreasury<T>>::withdraw(&deletion_prize_account_id, deletion_prize)?;
        }

        <Bags<T>>::remove(&bag_id);

        Self::change_bag_assignments_for_distribution_buckets(
            &BTreeSet::new(),
            &deleted_dynamic_bag.distributed_by,
        );

        Self::change_bag_assignments_for_storage_buckets(
            &BTreeSet::new(),
            &deleted_dynamic_bag.stored_by,
        );

        Self::deposit_event(RawEvent::DynamicBagDeleted(
            deletion_prize_account_id,
            dynamic_bag_id,
        ));

        Ok(())
    }

    fn create_dynamic_bag(
        dynamic_bag_id: DynamicBagId<T>,
        deletion_prize: Option<DynamicBagDeletionPrize<T>>,
    ) -> DispatchResult {
        // validate params and get storage & distribution buckets
        let bag_change =
            Self::validate_create_dynamic_bag_params(&dynamic_bag_id, &deletion_prize, &None)?;

        let (storage_bucket_ids, distribution_bucket_ids) =
            Self::pick_buckets_for_bag(dynamic_bag_id.clone(), &bag_change)?;

        //
        // == MUTATION SAFE ==
        //

        Self::create_dynamic_bag_inner(
            &dynamic_bag_id,
            &deletion_prize,
            &storage_bucket_ids,
            &distribution_bucket_ids,
        )?;
        Ok(())
    }

    fn create_dynamic_bag_with_objects_constraints(
        dynamic_bag_id: DynamicBagId<T>,
        deletion_prize: Option<DynamicBagDeletionPrize<T>>,
        params: UploadParameters<T>,
    ) -> DispatchResult {
        let bag_change = Self::validate_create_dynamic_bag_params(
            &dynamic_bag_id,
            &deletion_prize,
            &Some(params),
        )?;

        let (storage_bucket_ids, distribution_bucket_ids) =
            Self::pick_buckets_for_bag(dynamic_bag_id.clone(), &bag_change)?;

        //
        // == MUTATION SAFE ==
        //

        Self::create_dynamic_bag_inner(
            &dynamic_bag_id,
            &deletion_prize,
            &storage_bucket_ids,
            &distribution_bucket_ids,
        )?;
        Ok(())
    }

    fn can_create_dynamic_bag(
        bag_id: &DynamicBagId<T>,
        deletion_prize: &Option<DynamicBagDeletionPrize<T>>,
    ) -> DispatchResult {
        Self::validate_create_dynamic_bag_params(bag_id, deletion_prize, &None).map(|_| ())
    }

    fn can_create_dynamic_bag_with_objects_constraints(
        dynamic_bag_id: &DynamicBagId<T>,
        deletion_prize: &Option<DynamicBagDeletionPrize<T>>,
        params: &UploadParameters<T>,
    ) -> DispatchResult {
        let bag_change = Self::validate_create_dynamic_bag_params(
            dynamic_bag_id,
            deletion_prize,
            &Some(params.clone()),
        )?;

        Self::pick_buckets_for_bag(dynamic_bag_id.clone(), &bag_change).map(|_| ())
    }

    fn ensure_bag_exists(bag_id: &BagId<T>) -> Result<Bag<T>, DispatchError> {
        Self::ensure_bag_exists(bag_id)
    }

    fn get_data_objects_id(bag_id: &BagId<T>) -> BTreeSet<T::DataObjectId> {
        DataObjectsById::<T>::iter_prefix(&bag_id)
            .map(|x| x.0)
            .collect()
    }
}

impl<T: Trait> Module<T> {
    // dynamic bag creation logic
    fn create_dynamic_bag_inner(
        dynamic_bag_id: &DynamicBagId<T>,
        deletion_prize: &Option<DynamicBagDeletionPrize<T>>,
        storage_buckets: &BTreeSet<T::StorageBucketId>,
        distribution_buckets: &BTreeSet<DistributionBucketId<T>>,
    ) -> DispatchResult {
        if let Some(deletion_prize) = deletion_prize.clone() {
            <StorageTreasury<T>>::deposit(&deletion_prize.account_id, deletion_prize.prize)?;
        }

        let bag = Bag::<T> {
            stored_by: storage_buckets.clone(),
            deletion_prize: deletion_prize.clone().map(|dp| dp.prize),
            distributed_by: distribution_buckets.clone(),
            ..Default::default()
        };

        let bag_id: BagId<T> = dynamic_bag_id.clone().into();

        <Bags<T>>::insert(&bag_id, bag);

        Self::change_bag_assignments_for_distribution_buckets(
            &distribution_buckets,
            &BTreeSet::new(),
        );

        Self::change_bag_assignments_for_storage_buckets(&storage_buckets, &BTreeSet::new());

        Self::deposit_event(RawEvent::DynamicBagCreated(
            dynamic_bag_id.clone(),
            deletion_prize.clone(),
            storage_buckets.clone(),
            distribution_buckets.clone(),
        ));

        Ok(())
    }

    fn upload_data_objects_inner(
        params: &UploadParameters<T>,
        bag_change: &BagUpdate<BalanceOf<T>>,
        bag: &Bag<T>,
    ) -> DispatchResult {
        let data = Self::create_data_objects(params.object_creation_list.clone());

        //
        // == MUTATION SAFE ==
        //

        <StorageTreasury<T>>::deposit(
            &params.deletion_prize_source_account_id,
            bag_change.total_deletion_prize,
        )?;

        Self::slash_data_size_fee(
            &params.deletion_prize_source_account_id,
            bag_change.voucher_update.objects_total_size,
        );

        // Save next object id.
        <NextDataObjectId<T>>::put(data.next_data_object_id);

        // Insert new objects.
        for (data_object_id, data_object) in data.data_objects_map.iter() {
            DataObjectsById::<T>::insert(&params.bag_id, &data_object_id, data_object);
        }

        Self::change_storage_bucket_vouchers_for_bag(
            &params.bag_id,
            &bag,
            &bag_change.voucher_update,
            OperationType::Increase,
        );

        Self::deposit_event(RawEvent::DataObjectsUploaded(
            data.data_objects_map.keys().cloned().collect(),
            params.clone(),
            T::DataObjectDeletionPrize::get(),
        ));

        Ok(())
    }

    // Increment distribution family number in the storage.
    fn increment_distribution_family_number() {
        DistributionBucketFamilyNumber::put(Self::distribution_bucket_family_number() + 1);
    }

    // Decrement distribution family number in the storage. No effect on zero number.
    fn decrement_distribution_family_number() {
        if Self::distribution_bucket_family_number() > 0 {
            DistributionBucketFamilyNumber::put(Self::distribution_bucket_family_number() - 1);
        }
    }

    // Validates dynamic bag creation params and conditions.
    fn validate_create_dynamic_bag_params(
        dynamic_bag_id: &DynamicBagId<T>,
        deletion_prize: &Option<DynamicBagDeletionPrize<T>>,
        upload_params: &Option<UploadParameters<T>>,
    ) -> Result<Option<BagUpdate<BalanceOf<T>>>, DispatchError> {
        let bag_id: BagId<T> = dynamic_bag_id.clone().into();
        ensure!(
            !<Bags<T>>::contains_key(bag_id.clone()),
            Error::<T>::DynamicBagExists
        );

        let bag_change = upload_params
            .as_ref()
            .map(|params| {
                // ensure coherent account ids & bag ids
                if let Some(deletion_prize) = deletion_prize {
                    ensure!(
                        params.deletion_prize_source_account_id == deletion_prize.account_id,
                        Error::<T>::AccountsNotCoherent,
                    );
                }
                ensure!(bag_id == params.bag_id, Error::<T>::BagsNotCoherent);

                Self::validate_bag_change(params)
            })
            .transpose()?;

        // check that fees are sufficient
        let total_upload_fee = deletion_prize
            .as_ref()
            .map_or(Zero::zero(), |del_prize| del_prize.prize)
            .saturating_add(bag_change.as_ref().map_or(Zero::zero(), |bag_change| {
                Self::compute_upload_fees(bag_change)
            }));

        // either bag_prize account or objects_prize account used (provided they are the same)
        let designated_account = deletion_prize
            .as_ref()
            .map(|dp| dp.account_id.clone())
            .or_else(|| {
                upload_params
                    .as_ref()
                    .map(|p| p.deletion_prize_source_account_id.clone())
            });

        Self::ensure_sufficient_balance_for_upload(designated_account, total_upload_fee)?;

        Ok(bag_change)
    }

    fn ensure_sufficient_balance_for_upload(
        deletion_prize_source_account_id: Option<T::AccountId>,
        required_balance: BalanceOf<T>,
    ) -> DispatchResult {
        let usable_balance = deletion_prize_source_account_id.map_or(Zero::zero(), |account_id| {
            Balances::<T>::usable_balance(account_id)
        });

        ensure!(
            usable_balance >= required_balance,
            Error::<T>::InsufficientBalance
        );
        Ok(())
    }

    // Validates dynamic bag deletion params and conditions. Returns bag's deletion prize.
    fn validate_delete_dynamic_bag_params(
        dynamic_bag_id: &DynamicBagId<T>,
        with_objects: bool,
    ) -> Result<Option<BalanceOf<T>>, DispatchError> {
        Self::ensure_dynamic_bag_exists(dynamic_bag_id)?;

        let dynamic_bag = Self::dynamic_bag(dynamic_bag_id);

        // deletion prize = bag.deletion_prize + total_objects fees if any
        let deletion_prize = if !with_objects {
            ensure!(
                dynamic_bag.objects_number == 0,
                Error::<T>::CannotDeleteNonEmptyDynamicBag
            );
            dynamic_bag.deletion_prize.unwrap_or_else(Zero::zero)
        } else {
            let bag_id: BagId<T> = dynamic_bag_id.clone().into();
            let objects_del_prize = <DataObjectsById<T>>::iter_prefix(bag_id)
                .fold(BalanceOf::<T>::zero(), |acc, (_, data_object)| {
                    acc.saturating_add(data_object.deletion_prize)
                });

            dynamic_bag
                .deletion_prize
                .unwrap_or_else(Zero::zero)
                .saturating_add(objects_del_prize)
        };

        ensure!(
            <StorageTreasury<T>>::usable_balance() >= deletion_prize,
            Error::<T>::InsufficientTreasuryBalance
        );

        Ok(dynamic_bag.deletion_prize)
    }

    // Ensures the existence of the storage bucket.
    // Returns the StorageBucket object or error.
    fn ensure_storage_bucket_exists(
        storage_bucket_id: &T::StorageBucketId,
    ) -> Result<StorageBucket<T>, Error<T>> {
        ensure!(
            <StorageBucketById<T>>::contains_key(storage_bucket_id),
            Error::<T>::StorageBucketDoesntExist
        );

        Ok(Self::storage_bucket_by_id(storage_bucket_id))
    }

    // Ensures the correct invitation for the storage bucket and storage provider. Storage provider
    // must be invited.
    fn ensure_bucket_storage_provider_invitation_status(
        bucket: &StorageBucket<T>,
        worker_id: WorkerId<T>,
    ) -> DispatchResult {
        match bucket.operator_status {
            StorageBucketOperatorStatus::Missing => {
                Err(Error::<T>::NoStorageBucketInvitation.into())
            }
            StorageBucketOperatorStatus::StorageWorker(..) => {
                Err(Error::<T>::StorageProviderAlreadySet.into())
            }
            StorageBucketOperatorStatus::InvitedStorageWorker(invited_worker_id) => {
                ensure!(
                    worker_id == invited_worker_id,
                    Error::<T>::DifferentStorageProviderInvited
                );

                Ok(())
            }
        }
    }

    // Ensures the correct invitation for the storage bucket and storage provider for removal.
    // Must be invited storage provider.
    fn ensure_bucket_storage_provider_invitation_status_for_removal(
        bucket: &StorageBucket<T>,
    ) -> DispatchResult {
        if let StorageBucketOperatorStatus::StorageWorker(..) = bucket.operator_status {
            Ok(())
        } else {
            Err(Error::<T>::StorageProviderMustBeSet.into())
        }
    }

    // Ensures the correct invitation for the storage bucket and storage provider. Must be pending.
    fn ensure_bucket_pending_invitation_status(bucket: &StorageBucket<T>) -> DispatchResult {
        match bucket.operator_status {
            StorageBucketOperatorStatus::Missing => {
                Err(Error::<T>::NoStorageBucketInvitation.into())
            }
            StorageBucketOperatorStatus::StorageWorker(..) => {
                Err(Error::<T>::StorageProviderAlreadySet.into())
            }
            StorageBucketOperatorStatus::InvitedStorageWorker(_) => Ok(()),
        }
    }

    // Ensures the missing invitation for the storage bucket and storage provider.
    fn ensure_bucket_missing_invitation_status(bucket: &StorageBucket<T>) -> DispatchResult {
        match bucket.operator_status {
            StorageBucketOperatorStatus::Missing => Ok(()),
            StorageBucketOperatorStatus::StorageWorker(..) => {
                Err(Error::<T>::StorageProviderAlreadySet.into())
            }
            StorageBucketOperatorStatus::InvitedStorageWorker(_) => {
                Err(Error::<T>::InvitedStorageProvider.into())
            }
        }
    }

    // Ensures correct storage provider for the storage bucket.
    fn ensure_bucket_invitation_accepted(
        bucket: &StorageBucket<T>,
        worker_id: WorkerId<T>,
    ) -> DispatchResult {
        match bucket.operator_status {
            StorageBucketOperatorStatus::Missing => {
                Err(Error::<T>::StorageProviderMustBeSet.into())
            }
            StorageBucketOperatorStatus::InvitedStorageWorker(_) => {
                Err(Error::<T>::InvalidStorageProvider.into())
            }
            StorageBucketOperatorStatus::StorageWorker(invited_worker_id, _) => {
                ensure!(
                    worker_id == invited_worker_id,
                    Error::<T>::InvalidStorageProvider
                );

                Ok(())
            }
        }
    }

    // Ensures correct storage provider transactor account for the storage bucket.
    fn ensure_bucket_transactor_access(
        bucket: &StorageBucket<T>,
        worker_id: WorkerId<T>,
        transactor_account_id: T::AccountId,
    ) -> DispatchResult {
        match bucket.operator_status.clone() {
            StorageBucketOperatorStatus::Missing => {
                Err(Error::<T>::StorageProviderMustBeSet.into())
            }
            StorageBucketOperatorStatus::InvitedStorageWorker(_) => {
                Err(Error::<T>::InvalidStorageProvider.into())
            }
            StorageBucketOperatorStatus::StorageWorker(
                invited_worker_id,
                bucket_transactor_account_id,
            ) => {
                ensure!(
                    worker_id == invited_worker_id,
                    Error::<T>::InvalidStorageProvider
                );

                ensure!(
                    transactor_account_id == bucket_transactor_account_id,
                    Error::<T>::InvalidTransactorAccount
                );

                Ok(())
            }
        }
    }

    // Create data objects from the creation data.
    fn create_data_objects(
        object_creation_list: Vec<DataObjectCreationParameters>,
    ) -> DataObjectCandidates<T> {
        let deletion_prize = T::DataObjectDeletionPrize::get();

        let data_objects = object_creation_list.iter().cloned().map(|obj| DataObject {
            accepted: false,
            deletion_prize,
            size: obj.size,
            ipfs_content_id: obj.ipfs_content_id,
        });

        let mut next_data_object_id = Self::next_data_object_id();
        let ids = iter::repeat_with(|| {
            let id = next_data_object_id;
            next_data_object_id += One::one();

            id
        })
        .take(data_objects.len());

        let data_objects_map = ids.zip(data_objects).collect::<BTreeMap<_, _>>();

        DataObjectCandidates {
            next_data_object_id,
            data_objects_map,
        }
    }

    // Ensures validity of the `accept_pending_data_objects` extrinsic parameters
    fn validate_accept_pending_data_objects_params(
        bag_id: &BagId<T>,
        data_objects: &BTreeSet<T::DataObjectId>,
        storage_bucket_id: &T::StorageBucketId,
    ) -> DispatchResult {
        ensure!(
            !data_objects.is_empty(),
            Error::<T>::DataObjectIdParamsAreEmpty
        );

        let bag = Self::ensure_bag_exists(bag_id)?;
        Self::ensure_storage_bucket_bound(&bag, storage_bucket_id)?;

        for data_object_id in data_objects.iter() {
            Self::ensure_data_object_exists(bag_id, data_object_id)?;
        }

        Ok(())
    }

    // Ensures validity of the `update_storage_buckets_for_bag` extrinsic parameters
    fn validate_update_storage_buckets_for_bag_params(
        bag_id: &BagId<T>,
        add_buckets: &BTreeSet<T::StorageBucketId>,
        remove_buckets: &BTreeSet<T::StorageBucketId>,
    ) -> Result<VoucherUpdate, DispatchError> {
        ensure!(
            !add_buckets.is_empty() || !remove_buckets.is_empty(),
            Error::<T>::StorageBucketIdCollectionsAreEmpty
        );

        let bag = Self::ensure_bag_exists(&bag_id)?;

        let new_bucket_number = bag
            .stored_by
            .len()
            .saturating_add(add_buckets.len())
            .saturating_sub(remove_buckets.len())
            .saturated_into::<u64>();

        ensure!(
            new_bucket_number <= Self::storage_buckets_per_bag_limit(),
            Error::<T>::StorageBucketPerBagLimitExceeded
        );

        for bucket_id in remove_buckets.iter() {
            ensure!(
                <StorageBucketById<T>>::contains_key(&bucket_id),
                Error::<T>::StorageBucketDoesntExist
            );

            ensure!(
                bag.stored_by.contains(&bucket_id),
                Error::<T>::StorageBucketIsNotBoundToBag
            );
        }

        for bucket_id in add_buckets.iter() {
            let bucket = Self::ensure_storage_bucket_exists(bucket_id)?;

            ensure!(
                bucket.accepting_new_bags,
                Error::<T>::StorageBucketDoesntAcceptNewBags
            );

            ensure!(
                !bag.stored_by.contains(&bucket_id),
                Error::<T>::StorageBucketIsBoundToBag
            );
        }

        let voucher_update = VoucherUpdate {
            objects_number: bag.objects_number,
            objects_total_size: bag.objects_total_size,
        };

        Self::check_buckets_for_overflow(&add_buckets, &voucher_update)?;

        Ok(voucher_update)
    }

    // Validate the "Move data objects between bags" operation data.
    fn validate_data_objects_on_moving(
        src_bag_id: &BagId<T>,
        dest_bag_id: &BagId<T>,
        object_ids: &BTreeSet<T::DataObjectId>,
    ) -> Result<BagUpdate<BalanceOf<T>>, DispatchError> {
        ensure!(
            *src_bag_id != *dest_bag_id,
            Error::<T>::SourceAndDestinationBagsAreEqual
        );

        ensure!(
            !object_ids.is_empty(),
            Error::<T>::DataObjectIdCollectionIsEmpty
        );

        Self::ensure_bag_exists(&src_bag_id)?;
        let dest_bag = Self::ensure_bag_exists(&dest_bag_id)?;

        let mut bag_change = BagUpdate::<BalanceOf<T>>::default();

        for object_id in object_ids.iter() {
            let data_object = Self::ensure_data_object_exists(&src_bag_id, object_id)?;

            bag_change.add_object(data_object.size, data_object.deletion_prize);
        }

        Self::check_bag_for_buckets_overflow(&dest_bag, &bag_change.voucher_update)?;

        Ok(bag_change)
    }

    // Returns only existing hashes in the blacklist from the original collection.
    #[allow(clippy::redundant_closure)] // doesn't work with Substrate storage functions.
    fn get_existing_hashes(hashes: &BTreeSet<Cid>) -> BTreeSet<Cid> {
        Self::get_hashes_by_predicate(hashes, |cid| Blacklist::contains_key(cid))
    }

    // Returns only nonexisting hashes in the blacklist from the original collection.
    fn get_nonexisting_hashes(hashes: &BTreeSet<Cid>) -> BTreeSet<Cid> {
        Self::get_hashes_by_predicate(hashes, |cid| !Blacklist::contains_key(cid))
    }

    // Returns hashes from the original collection selected by predicate.
    fn get_hashes_by_predicate<P: FnMut(&&Cid) -> bool>(
        hashes: &BTreeSet<Cid>,
        predicate: P,
    ) -> BTreeSet<Cid> {
        hashes
            .iter()
            .filter(predicate)
            .cloned()
            .collect::<BTreeSet<_>>()
    }

    // Ensure the new bucket could be created. It also validates some parameters.
    fn can_create_storage_bucket(
        voucher: &Voucher,
        invited_worker: &Option<WorkerId<T>>,
    ) -> DispatchResult {
        ensure!(
            voucher.size_limit <= Self::voucher_max_objects_size_limit(),
            Error::<T>::VoucherMaxObjectSizeLimitExceeded
        );

        ensure!(
            voucher.objects_limit <= Self::voucher_max_objects_number_limit(),
            Error::<T>::VoucherMaxObjectNumberLimitExceeded
        );

        if let Some(operator_id) = invited_worker {
            Self::ensure_storage_provider_operator_exists(operator_id)?;
        }

        Ok(())
    }

    // Update total objects size and number for all storage buckets assigned to a bag
    // and bag counters.
    fn change_storage_bucket_vouchers_for_bag(
        bag_id: &BagId<T>,
        bag: &Bag<T>,
        voucher_update: &VoucherUpdate,
        voucher_operation: OperationType,
    ) {
        // Change bag object and size counters.
        Bags::<T>::mutate(&bag_id, |bag| {
            match voucher_operation {
                OperationType::Increase => {
                    bag.objects_total_size = bag
                        .objects_total_size
                        .saturating_add(voucher_update.objects_total_size);
                    bag.objects_number = bag
                        .objects_number
                        .saturating_add(voucher_update.objects_number);
                }
                OperationType::Decrease => {
                    bag.objects_total_size = bag
                        .objects_total_size
                        .saturating_sub(voucher_update.objects_total_size);
                    bag.objects_number = bag
                        .objects_number
                        .saturating_sub(voucher_update.objects_number);
                }
            }

            Self::deposit_event(RawEvent::BagObjectsChanged(
                bag_id.clone(),
                bag.objects_total_size,
                bag.objects_number,
            ));
        });

        // Change related buckets' vouchers.
        Self::change_storage_buckets_vouchers(&bag.stored_by, voucher_update, voucher_operation);
    }

    // Update total objects size and number for provided storage buckets.
    fn change_storage_buckets_vouchers(
        bucket_ids: &BTreeSet<T::StorageBucketId>,
        voucher_update: &VoucherUpdate,
        voucher_operation: OperationType,
    ) {
        for bucket_id in bucket_ids.iter() {
            <StorageBucketById<T>>::mutate(bucket_id, |bucket| {
                bucket.voucher =
                    voucher_update.get_updated_voucher(&bucket.voucher, voucher_operation);

                Self::deposit_event(RawEvent::VoucherChanged(*bucket_id, bucket.voucher.clone()));
            });
        }
    }

    // Validates upload parameters and conditions (like global uploading block).
    // Returns voucher update parameters for the storage buckets.
    fn validate_upload_data_objects_parameters(
        params: &UploadParameters<T>,
    ) -> Result<BagUpdate<BalanceOf<T>>, DispatchError> {
        let bag_change = Self::validate_bag_change(params)?;
        Self::ensure_sufficient_balance_for_upload(
            Some(params.deletion_prize_source_account_id.clone()),
            Self::compute_upload_fees(&bag_change),
        )?;
        Self::ensure_upload_bag_validity(&params.bag_id, &bag_change.voucher_update)?;
        Ok(bag_change)
    }

    // construct bag change after validating the inputs
    fn validate_bag_change(
        params: &UploadParameters<T>,
    ) -> Result<BagUpdate<BalanceOf<T>>, DispatchError> {
        Self::check_global_uploading_block()?;

        Self::ensure_objects_creation_list_validity(&params.object_creation_list)?;

        let bag_change = Self::construct_bag_change(&params.object_creation_list)?;

        ensure!(
            params.expected_data_size_fee == Self::data_object_per_mega_byte_fee(),
            Error::<T>::DataSizeFeeChanged
        );
        Ok(bag_change)
    }

    // Validates `delete_data_objects` parameters.
    // Returns voucher update for an affected bag.
    fn validate_delete_data_objects_params(
        bag_id: &BagId<T>,
        data_object_ids: &BTreeSet<T::DataObjectId>,
    ) -> Result<BagUpdate<BalanceOf<T>>, DispatchError> {
        ensure!(
            !data_object_ids.is_empty(),
            Error::<T>::DataObjectIdParamsAreEmpty
        );

        Self::ensure_bag_exists(bag_id)?;

        let bag_change = data_object_ids
            .iter()
            .try_fold::<_, _, Result<_, DispatchError>>(
                BagUpdate::default(),
                |acc, data_object_id| {
                    let data_object = Self::ensure_data_object_exists(bag_id, data_object_id)?;

                    let bag_change = acc
                        .clone()
                        .add_object(data_object.size, data_object.deletion_prize);

                    Ok(bag_change)
                },
            )?;

        ensure!(
            <StorageTreasury<T>>::usable_balance() >= bag_change.total_deletion_prize,
            Error::<T>::InsufficientTreasuryBalance
        );

        Ok(bag_change)
    }

    fn ensure_upload_bag_validity(
        bag_id: &BagId<T>,
        voucher_update: &VoucherUpdate,
    ) -> DispatchResult {
        let bag = Self::ensure_bag_exists(bag_id)?;
        // Check buckets.
        Self::check_bag_for_buckets_overflow(&bag, voucher_update)?;
        Ok(())
    }

    fn compute_upload_fees(bag_change: &BagUpdate<BalanceOf<T>>) -> BalanceOf<T> {
        let size_fee =
            Self::calculate_data_storage_fee(bag_change.voucher_update.objects_total_size);

        bag_change.total_deletion_prize.saturating_add(size_fee)
    }

    // Check global uploading block.
    fn check_global_uploading_block() -> DispatchResult {
        ensure!(!Self::uploading_blocked(), Error::<T>::UploadingBlocked);
        Ok(())
    }

    fn construct_bag_change(
        object_creation_list: &[DataObjectCreationParameters],
    ) -> Result<BagUpdate<BalanceOf<T>>, DispatchError> {
        let bag_change = object_creation_list
            .iter()
            .try_fold::<_, _, Result<_, DispatchError>>(
                BagUpdate::default(),
                |acc, object_params| {
                    // Should be non-empty hash.
                    ensure!(
                        !object_params.ipfs_content_id.is_empty(),
                        Error::<T>::EmptyContentId
                    );
                    // Should be non-zero size.
                    ensure!(object_params.size != 0, Error::<T>::ZeroObjectSize);

                    // Should not be blacklisted.
                    ensure!(
                        !Blacklist::contains_key(&object_params.ipfs_content_id),
                        Error::<T>::DataObjectBlacklisted,
                    );

                    let bag_change = acc
                        .clone()
                        .add_object(object_params.size, T::DataObjectDeletionPrize::get());

                    Ok(bag_change)
                },
            )?;

        Ok(bag_change)
    }

    // objects creation list validity
    fn ensure_objects_creation_list_validity(
        object_creation_list: &[DataObjectCreationParameters],
    ) -> DispatchResult {
        // Check object creation list is not empty
        ensure!(
            !object_creation_list.is_empty(),
            Error::<T>::NoObjectsOnUpload
        );

        // Check data objects' max size.
        ensure!(
            object_creation_list
                .iter()
                .all(|obj| obj.size <= T::MaxDataObjectSize::get()),
            Error::<T>::MaxDataObjectSizeExceeded
        );
        Ok(())
    }

    // Iterates through buckets in the bag. Verifies voucher parameters to fit the new limits:
    // objects number and total objects size.
    fn check_bag_for_buckets_overflow(
        bag: &Bag<T>,
        voucher_update: &VoucherUpdate,
    ) -> DispatchResult {
        Self::check_buckets_for_overflow(&bag.stored_by, voucher_update)
    }

    // Iterates through buckets. Verifies voucher parameters to fit the new limits:
    // objects number and total objects size.
    fn check_buckets_for_overflow(
        bucket_ids: &BTreeSet<T::StorageBucketId>,
        voucher_update: &VoucherUpdate,
    ) -> DispatchResult {
        for bucket_id in bucket_ids.iter() {
            let bucket = Self::storage_bucket_by_id(bucket_id);

            // Total object number limit is not exceeded.
            ensure!(
                voucher_update.objects_number + bucket.voucher.objects_used
                    <= bucket.voucher.objects_limit,
                Error::<T>::StorageBucketObjectNumberLimitReached
            );

            // Total object size limit is not exceeded.
            ensure!(
                voucher_update.objects_total_size + bucket.voucher.size_used
                    <= bucket.voucher.size_limit,
                Error::<T>::StorageBucketObjectSizeLimitReached
            );
        }

        Ok(())
    }

    // Calculate data storage fee based on size. Fee-value uses megabytes as measure value.
    // Data size will be rounded to nearest greater MB integer.
    pub(crate) fn calculate_data_storage_fee(bytes: u64) -> BalanceOf<T> {
        let mb_fee = Self::data_object_per_mega_byte_fee();

        const ONE_MB: u64 = 1_048_576;

        let mut megabytes = bytes / ONE_MB;

        if bytes % ONE_MB > 0 {
            megabytes += 1; // rounding to the nearest greater integer
        }

        mb_fee.saturating_mul(megabytes.saturated_into())
    }

    // Slash data size fee if fee value is set to non-zero.
    fn slash_data_size_fee(account_id: &T::AccountId, bytes: u64) {
        let fee = Self::calculate_data_storage_fee(bytes);

        if fee != Zero::zero() {
            let _ = Balances::<T>::slash(account_id, fee);
        }
    }

    // helper pick buckets for bag
    fn pick_buckets_for_bag(
        dynamic_bag_id: DynamicBagId<T>,
        bag_change: &Option<BagUpdate<BalanceOf<T>>>,
    ) -> Result<BucketPair<T>, DispatchError> {
        let bag_type: DynamicBagType = dynamic_bag_id.into();

        let storage_bucket_ids = Self::pick_storage_buckets_for_dynamic_bag(
            bag_type,
            bag_change.map(|bag_change| bag_change.voucher_update),
        );

        let distribution_bucket_ids = Self::pick_distribution_buckets_for_dynamic_bag(bag_type);

        if bag_change.is_some() {
            ensure!(
                !storage_bucket_ids.is_empty(),
                Error::<T>::StorageBucketIdCollectionsAreEmpty
            );
        }

        Ok((storage_bucket_ids, distribution_bucket_ids))
    }

    // Selects storage bucket ID sets to assign to the dynamic bag.
    pub(crate) fn pick_storage_buckets_for_dynamic_bag(
        bag_type: DynamicBagType,
        voucher_update: Option<VoucherUpdate>,
    ) -> BTreeSet<T::StorageBucketId> {
        StorageBucketPicker::<T>::pick_storage_buckets(bag_type, voucher_update)
    }

    // Selects distributed bucket ID sets to assign to the dynamic bag.
    pub(crate) fn pick_distribution_buckets_for_dynamic_bag(
        bag_type: DynamicBagType,
    ) -> BTreeSet<DistributionBucketId<T>> {
        DistributionBucketPicker::<T>::pick_distribution_buckets(bag_type)
    }

    // Get default dynamic bag policy by bag type.
    fn get_default_dynamic_bag_creation_policy(
        bag_type: DynamicBagType,
    ) -> DynamicBagCreationPolicy<T::DistributionBucketFamilyId> {
        let number_of_storage_buckets = match bag_type {
            DynamicBagType::Member => T::DefaultMemberDynamicBagNumberOfStorageBuckets::get(),
            DynamicBagType::Channel => T::DefaultChannelDynamicBagNumberOfStorageBuckets::get(),
        };

        DynamicBagCreationPolicy::<T::DistributionBucketFamilyId> {
            number_of_storage_buckets,
            ..Default::default()
        }
    }

    // Loads dynamic bag creation policy or use default values.
    pub(crate) fn get_dynamic_bag_creation_policy(
        bag_type: DynamicBagType,
    ) -> DynamicBagCreationPolicy<T::DistributionBucketFamilyId> {
        if DynamicBagCreationPolicies::<T>::contains_key(bag_type) {
            return Self::dynamic_bag_creation_policy(bag_type);
        }

        Self::get_default_dynamic_bag_creation_policy(bag_type)
    }

    // Verifies storage operator existence.
    fn ensure_storage_provider_operator_exists(operator_id: &WorkerId<T>) -> DispatchResult {
        ensure!(
            T::ensure_storage_worker_exists(operator_id).is_ok(),
            Error::<T>::StorageProviderOperatorDoesntExist
        );

        Ok(())
    }

    // Returns the bag by the static bag id.
    #[cfg(test)]
    pub(crate) fn static_bag(static_bag_id: &StaticBagId) -> Bag<T> {
        let bag_id: BagId<T> = static_bag_id.clone().into();

        Self::bag(&bag_id)
    }

    // Returns the bag by the dynamic bag id.
    pub(crate) fn dynamic_bag(dynamic_bag_id: &DynamicBagId<T>) -> Bag<T> {
        let bag_id: BagId<T> = dynamic_bag_id.clone().into();

        Self::bag(&bag_id)
    }

    // Check the dynamic bag existence.
    fn ensure_dynamic_bag_exists(
        dynamic_bag_id: &DynamicBagId<T>,
    ) -> Result<Bag<T>, DispatchError> {
        let bag_id: BagId<T> = dynamic_bag_id.clone().into();

        Self::ensure_bag_exists(&bag_id)
    }

    // Check the dynamic bag existence. Static bags always exist.
    fn ensure_bag_exists(bag_id: &BagId<T>) -> Result<Bag<T>, DispatchError> {
        if let BagId::<T>::Dynamic(_) = &bag_id {
            ensure!(
                <Bags<T>>::contains_key(&bag_id),
                Error::<T>::DynamicBagDoesntExist
            );
        }

        Ok(Self::bag(&bag_id))
    }

    // Check the storage bucket binding for a bag.
    fn ensure_storage_bucket_bound(
        bag: &Bag<T>,
        storage_bucket_id: &T::StorageBucketId,
    ) -> DispatchResult {
        ensure!(
            bag.stored_by.contains(storage_bucket_id),
            Error::<T>::StorageBucketIsNotBoundToBag
        );

        Ok(())
    }

    // Check the data object existence inside a bag.
    pub(crate) fn ensure_data_object_exists(
        bag_id: &BagId<T>,
        data_object_id: &T::DataObjectId,
    ) -> Result<DataObject<BalanceOf<T>>, DispatchError> {
        ensure!(
            <DataObjectsById<T>>::contains_key(bag_id, data_object_id),
            Error::<T>::DataObjectDoesntExist
        );

        Ok(Self::data_object_by_id(bag_id, data_object_id))
    }

    // Ensures the existence of the distribution bucket family.
    // Returns the DistributionBucketFamily object or error.
    fn ensure_distribution_bucket_family_exists(
        family_id: &T::DistributionBucketFamilyId,
    ) -> Result<DistributionBucketFamily<T>, Error<T>> {
        ensure!(
            <DistributionBucketFamilyById<T>>::contains_key(family_id),
            Error::<T>::DistributionBucketFamilyDoesntExist
        );

        Ok(Self::distribution_bucket_family_by_id(family_id))
    }

    // Ensures the existence of the distribution bucket.
    // Returns the DistributionBucket object or error.
    fn ensure_distribution_bucket_exists(
        bucket_id: &DistributionBucketId<T>,
    ) -> Result<DistributionBucket<T>, Error<T>> {
        ensure!(
            <DistributionBucketByFamilyIdById<T>>::contains_key(
                bucket_id.distribution_bucket_family_id,
                bucket_id.distribution_bucket_index
            ),
            Error::<T>::DistributionBucketDoesntExist
        );

        Ok(Self::distribution_bucket_by_family_id_by_index(
            bucket_id.distribution_bucket_family_id,
            bucket_id.distribution_bucket_index,
        ))
    }

    // Ensures validity of the `update_distribution_buckets_for_bag` extrinsic parameters
    fn validate_update_distribution_buckets_for_bag_params(
        bag_id: &BagId<T>,
        family_id: &T::DistributionBucketFamilyId,
        add_buckets: &BTreeSet<T::DistributionBucketIndex>,
        remove_buckets: &BTreeSet<T::DistributionBucketIndex>,
    ) -> DispatchResult {
        ensure!(
            !add_buckets.is_empty() || !remove_buckets.is_empty(),
            Error::<T>::DistributionBucketIdCollectionsAreEmpty
        );

        let bag = Self::ensure_bag_exists(bag_id)?;

        Self::ensure_distribution_bucket_family_exists(family_id)?;

        let new_bucket_number = bag
            .distributed_by
            .len()
            .saturating_add(add_buckets.len())
            .saturating_sub(remove_buckets.len())
            .saturated_into::<u64>();

        ensure!(
            new_bucket_number <= Self::distribution_buckets_per_bag_limit(),
            Error::<T>::MaxDistributionBucketNumberPerBagLimitExceeded
        );

        for bucket_index in remove_buckets.iter() {
            let bucket_id = Self::create_distribution_bucket_id(*family_id, *bucket_index);
            Self::ensure_distribution_bucket_exists(&bucket_id)?;

            ensure!(
                bag.distributed_by.contains(&bucket_id),
                Error::<T>::DistributionBucketIsNotBoundToBag
            );
        }

        for bucket_index in add_buckets.iter() {
            let bucket_id = Self::create_distribution_bucket_id(*family_id, *bucket_index);
            let bucket = Self::ensure_distribution_bucket_exists(&bucket_id)?;

            ensure!(
                bucket.accepting_new_bags,
                Error::<T>::DistributionBucketDoesntAcceptNewBags
            );

            ensure!(
                !bag.distributed_by.contains(&bucket_id),
                Error::<T>::DistributionBucketIsBoundToBag
            );
        }

        Ok(())
    }

    // Ensures validity of the `update_families_in_dynamic_bag_creation_policy` extrinsic parameters
    fn validate_update_families_in_dynamic_bag_creation_policy_params(
        families: &BTreeMap<T::DistributionBucketFamilyId, u32>,
    ) -> DispatchResult {
        for (family_id, _) in families.iter() {
            Self::ensure_distribution_bucket_family_exists(family_id)?;
        }

        Ok(())
    }

    // Generate random number from zero to upper_bound (excluding).
    pub(crate) fn random_index(seed: &[u8], upper_bound: u64) -> u64 {
        if upper_bound == 0 {
            return upper_bound;
        }

        let mut rand: u64 = 0;
        for (offset, byte) in seed.iter().enumerate().take(8) {
            rand += (*byte as u64) << offset;
        }
        rand % upper_bound
    }

    // Get initial random seed. It handles the error on the initial block.
    pub(crate) fn get_initial_random_seed() -> T::Hash {
        // Cannot create randomness in the initial block (Substrate error).
        if <frame_system::Module<T>>::block_number() == Zero::zero() {
            Default::default()
        } else {
            T::Randomness::random_seed()
        }
    }

    // Verify parameters for the `invite_distribution_bucket_operator` extrinsic.
    fn ensure_distribution_provider_can_be_invited(
        bucket: &DistributionBucket<T>,
        worker_id: &WorkerId<T>,
    ) -> DispatchResult {
        ensure!(
            T::ensure_distribution_worker_exists(worker_id).is_ok(),
            Error::<T>::DistributionProviderOperatorDoesntExist
        );

        ensure!(
            !bucket.pending_invitations.contains(worker_id),
            Error::<T>::DistributionProviderOperatorAlreadyInvited
        );

        ensure!(
            !bucket.operators.contains(worker_id),
            Error::<T>::DistributionProviderOperatorSet
        );

        ensure!(
            bucket.pending_invitations.len().saturated_into::<u64>()
                < T::MaxNumberOfPendingInvitationsPerDistributionBucket::get(),
            Error::<T>::MaxNumberOfPendingInvitationsLimitForDistributionBucketReached
        );

        Ok(())
    }

    // Verify that dynamic bag creation policies has no dependencies on given distribution bucket
    // family for all bag types.
    fn check_dynamic_bag_creation_policy_for_dependencies(
        family_id: &T::DistributionBucketFamilyId,
        dynamic_bag_type: DynamicBagType,
    ) -> DispatchResult {
        let creation_policy = Self::get_dynamic_bag_creation_policy(dynamic_bag_type);

        ensure!(
            !creation_policy.families.contains_key(family_id),
            Error::<T>::DistributionFamilyBoundToBagCreationPolicy
        );

        Ok(())
    }

    // Add and/or remove distribution buckets assignments to bags.
    fn change_bag_assignments_for_distribution_buckets(
        add_buckets: &BTreeSet<DistributionBucketId<T>>,
        remove_buckets: &BTreeSet<DistributionBucketId<T>>,
    ) {
        for bucket_id in add_buckets.iter() {
            if DistributionBucketByFamilyIdById::<T>::contains_key(
                bucket_id.distribution_bucket_family_id,
                bucket_id.distribution_bucket_index,
            ) {
                DistributionBucketByFamilyIdById::<T>::mutate(
                    bucket_id.distribution_bucket_family_id,
                    bucket_id.distribution_bucket_index,
                    |bucket| {
                        bucket.register_bag_assignment();
                    },
                )
            }
        }

        for bucket_id in remove_buckets.iter() {
            if DistributionBucketByFamilyIdById::<T>::contains_key(
                bucket_id.distribution_bucket_family_id,
                bucket_id.distribution_bucket_index,
            ) {
                DistributionBucketByFamilyIdById::<T>::mutate(
                    bucket_id.distribution_bucket_family_id,
                    bucket_id.distribution_bucket_index,
                    |bucket| {
                        bucket.unregister_bag_assignment();
                    },
                )
            }
        }
    }

    // Add and/or remove storage buckets assignments to bags.
    fn change_bag_assignments_for_storage_buckets(
        add_buckets: &BTreeSet<T::StorageBucketId>,
        remove_buckets: &BTreeSet<T::StorageBucketId>,
    ) {
        for bucket_id in add_buckets.iter() {
            if StorageBucketById::<T>::contains_key(bucket_id) {
                StorageBucketById::<T>::mutate(bucket_id, |bucket| {
                    bucket.register_bag_assignment();
                })
            }
        }

        for bucket_id in remove_buckets.iter() {
            if StorageBucketById::<T>::contains_key(bucket_id) {
                StorageBucketById::<T>::mutate(bucket_id, |bucket| {
                    bucket.unregister_bag_assignment();
                })
            }
        }
    }

    // Checks distribution buckets for bag assignment number. Returns true only if all 'assigned_bags' are
    // zero.
    fn no_bags_assigned(family_id: &T::DistributionBucketFamilyId) -> bool {
        DistributionBucketByFamilyIdById::<T>::iter_prefix_values(family_id)
            .all(|b| b.no_bags_assigned())
    }

    // Creates distribution bucket ID from family ID and bucket index.
    pub(crate) fn create_distribution_bucket_id(
        distribution_bucket_family_id: T::DistributionBucketFamilyId,
        distribution_bucket_index: T::DistributionBucketIndex,
    ) -> DistributionBucketId<T> {
        DistributionBucketId::<T> {
            distribution_bucket_family_id,
            distribution_bucket_index,
        }
    }
}
