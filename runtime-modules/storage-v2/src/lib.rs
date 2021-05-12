//! # Storage module
//! Storage module for the Joystream platform. Version 2.

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![warn(missing_docs)]

// TODO:How to create a dynamic bag? -
//- new methods to be called from another modules: a method create dynamic bag.

// TODO: Remove old Storage pallet.
// TODO: authentication_key
// TODO: Check dynamic bag existence.
// TODO: use StorageBucket.accepting_new_bags
// TODO: merge council and WG storage bags.
// TODO: add dynamic bag creation policy.
// TODO: add module comment
// TODO: add benchmarks
// TODO: adjust constants
// TODO: max storage buckets for bags? do we need that?
// TODO: make public methods as root extrinsics to enable storage-node dev mode.

/// TODO: convert to variable
pub const MAX_OBJECT_SIZE_LIMIT: u64 = 100;
/// TODO: convert to variable
pub const MAX_OBJECT_NUMBER_LIMIT: u64 = 1;

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

mod bag_manager;

use codec::{Codec, Decode, Encode};
use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::traits::{Currency, ExistenceRequirement, Get};
use frame_support::{decl_error, decl_event, decl_module, decl_storage, ensure, Parameter};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_arithmetic::traits::{BaseArithmetic, One};
use sp_runtime::traits::{AccountIdConversion, MaybeSerialize, Member, Saturating};
use sp_runtime::{ModuleId, SaturatedConversion};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::iter;
use sp_std::marker::PhantomData;
use sp_std::vec::Vec;

use common::origin::ActorOriginValidator;
use common::working_group::WorkingGroup;

use bag_manager::BagManager;

//TODO: Prepare types for moving to common module for the DataObjectStorage.

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
}

/// Storage trait.
pub trait Trait: frame_system::Trait + balances::Trait + membership::Trait {
    /// Storage event type.
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    /// Data object ID type.
    type DataObjectId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    /// Storage bucket ID type.
    type StorageBucketId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    /// Distribution bucket ID type.
    type DistributionBucketId: Parameter
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
        + PartialEq;

    /// Defines max allowed storage bucket number.
    type MaxStorageBucketNumber: Get<u64>;

    /// Defines max number of data objects per bag.
    type MaxNumberOfDataObjectsPerBag: Get<u64>;

    /// Defines a prize for a data object deletion.
    type DataObjectDeletionPrize: Get<BalanceOf<Self>>;

    /// Defines maximum size of the "hash blacklist" collection.
    type BlacklistSizeLimit: Get<u64>;

    /// The module id, used for deriving its sovereign account ID.
    type ModuleId: Get<ModuleId>;

    /// Validates member id and origin combination.
    type MemberOriginValidator: ActorOriginValidator<Self::Origin, MemberId<Self>, Self::AccountId>;

    /// Demand the working group leader authorization.
    /// TODO: Refactor after merging with the Olympia release.
    fn ensure_working_group_leader_origin(origin: Self::Origin) -> DispatchResult;

    /// Validate origin for the worker.
    /// TODO: Refactor after merging with the Olympia release.
    fn ensure_worker_origin(origin: Self::Origin, worker_id: WorkerId<Self>) -> DispatchResult;
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

/// Local module account handler.
pub type StorageTreasury<T> = ModuleAccountHandler<T, <T as Trait>::ModuleId>;

/// IPFS hash type alias.
pub type ContentId = Vec<u8>;

// Alias for the Substrate balances pallet.
type Balances<T> = balances::Module<T>;

/// Alias for the member id.
pub type MemberId<T> = <T as membership::Trait>::MemberId;

/// Type identifier for worker role, which must be same as membership actor identifier
pub type WorkerId<T> = <T as membership::Trait>::ActorId;

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

/// The fundamental concept in the system, which represents single static binary object in the
/// system. The main goal of the system is to retain an index of all such objects, including who
/// owns them, and information about what actors are currently tasked with storing and distributing
/// them to end users. The system is unaware of the underlying content represented by such an
/// object, as it is used by different parts of the Joystream system.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct DataObject<Balance> {
    /// Defines whether the data object was accepted by a liaison.
    pub accepted: bool,

    /// A reward for the data object deletion.
    pub deletion_prize: Balance,

    /// Object size in bytes.
    pub size: u64,
}

/// Type alias for the StaticBagObject.
pub type StaticBag<T> = StaticBagObject<
    <T as Trait>::DataObjectId,
    <T as Trait>::StorageBucketId,
    <T as Trait>::DistributionBucketId,
    BalanceOf<T>,
>;

/// Static bag container.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct StaticBagObject<
    DataObjectId: Ord,
    StorageBucketId: Ord,
    DistributionBucketId: Ord,
    Balance,
> {
    /// Associated data objects.
    pub objects: BTreeMap<DataObjectId, DataObject<Balance>>,

    /// Associated storage buckets.
    pub stored_by: BTreeSet<StorageBucketId>,

    /// Associated distribution buckets.
    pub distributed_by: BTreeSet<DistributionBucketId>,
}

impl<DataObjectId: Ord, StorageBucketId: Ord, DistributionBucketId: Ord, Balance>
    StaticBagObject<DataObjectId, StorageBucketId, DistributionBucketId, Balance>
{
    // Calculates total object size for static bag.
    pub(crate) fn objects_total_size(&self) -> u64 {
        self.objects.values().map(|obj| obj.size).sum()
    }

    // Calculates total objects number for static bag.
    pub(crate) fn objects_number(&self) -> u64 {
        self.objects.len().saturated_into()
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
    StaticBag(StaticBagId),

    /// Dynamic bag type.
    DynamicBag(DynamicBagIdType<MemberId, ChannelId>),
}

impl<MemberId, ChannelId> Default for BagIdType<MemberId, ChannelId> {
    fn default() -> Self {
        Self::StaticBag(Default::default())
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

/// Alias for the UploadParametersObject
pub type UploadParameters<T> = UploadParametersObject<
    MemberId<T>,
    <T as Trait>::ChannelId,
    <T as frame_system::Trait>::AccountId,
>;

/// Data wrapper structure. Helps passing the parameters to the `upload` extrinsic.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct UploadParametersObject<MemberId, ChannelId, AccountId> {
    /// Public key used authentication in upload to liaison.
    pub authentication_key: Vec<u8>,

    /// Static or dynamic bag to upload data.
    pub bag_id: BagIdType<MemberId, ChannelId>,

    /// Data object parameters.
    pub object_creation_list: Vec<DataObjectCreationParameters>,

    /// Account for the data object deletion prize.
    pub deletion_prize_source_account_id: AccountId,
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
            objects_used,
            size_used,
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
pub enum StorageBucketOperatorStatus<WorkerId> {
    /// No connection.
    Missing,

    /// Storage operator was invited.
    InvitedStorageWorker(WorkerId),

    /// Storage operator accepted the invitation.
    StorageWorker(WorkerId),
}

impl<WorkerId> Default for StorageBucketOperatorStatus<WorkerId> {
    fn default() -> Self {
        Self::Missing
    }
}

/// A commitment to hold some set of bags for long term storage. A bucket may have a bucket
/// operator, which is a single worker in the storage working group.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct StorageBucket<WorkerId> {
    /// Current storage operator status.
    pub operator_status: StorageBucketOperatorStatus<WorkerId>,

    /// Defines whether the bucket accepts new bags.
    pub accepting_new_bags: bool,

    /// Defines limits for a bucket.
    pub voucher: Voucher,

    /// Defines storage bucket medata (like current storage provider URL).
    pub metadata: Vec<u8>,
}

/// Data wrapper structure. Helps passing parameters to extrinsics.
/// Defines a 'bag-to-data object' pair.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub struct AssignedDataObject<MemberId, ChannelId, DataObjectId> {
    /// Bag ID.
    pub bag_id: BagIdType<MemberId, ChannelId>,

    /// Data object ID.
    pub data_object_id: DataObjectId,
}

/// Type alias for the UpdateStorageBucketForBagsParamsObject.
pub type UpdateStorageBucketForBagsParams<T> = UpdateStorageBucketForBagsParamsObject<
    MemberId<T>,
    <T as Trait>::ChannelId,
    <T as Trait>::StorageBucketId,
>;

/// Data wrapper structure. Helps passing the parameters to the
/// `update_storage_buckets_for_bags` extrinsic.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct UpdateStorageBucketForBagsParamsObject<
    MemberId: Ord,
    ChannelId: Ord,
    StorageBucketId: Ord,
> {
    /// Defines new relationship between static bags and storage buckets.
    pub bags: BTreeMap<BagIdType<MemberId, ChannelId>, BTreeSet<StorageBucketId>>,
}

/// Type alias for the ObjectsInBagParamsObject.
pub type ObjectsInBagParams<T> =
    ObjectsInBagParamsObject<MemberId<T>, <T as Trait>::ChannelId, <T as Trait>::DataObjectId>;

/// Data wrapper structure. Helps passing the parameters to the
/// `accept_pending_data_objects` extrinsic.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ObjectsInBagParamsObject<MemberId: Ord, ChannelId: Ord, DataObjectId: Ord> {
    /// 'Bag' to 'data object' container.
    pub assigned_data_objects: BTreeSet<AssignedDataObject<MemberId, ChannelId, DataObjectId>>,
}

// Helper-struct for the data object uploading.
#[derive(Default, Clone, Debug)]
struct DataObjectCandidates<T: Trait> {
    // next data object ID to be saved in the storage.
    next_data_object_id: T::DataObjectId,

    // 'ID-data object' map.
    data_objects_map: BTreeMap<T::DataObjectId, DataObject<BalanceOf<T>>>,

    // new data object ID list.
    data_object_ids: Vec<T::DataObjectId>,

    // total deletion prize for all data objects.
    total_deletion_prize: BalanceOf<T>,
}

/// Type alias for the DynamicBagObject.
pub type DynamicBag<T> = DynamicBagObject<
    <T as Trait>::DataObjectId,
    <T as Trait>::StorageBucketId,
    <T as Trait>::DistributionBucketId,
    BalanceOf<T>,
>;

/// Dynamic bag container.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct DynamicBagObject<
    DataObjectId: Ord,
    StorageBucketId: Ord,
    DistributionBucketId: Ord,
    Balance,
> {
    /// Associated data objects.
    pub objects: BTreeMap<DataObjectId, DataObject<Balance>>,

    /// Associated storage buckets.
    pub stored_by: BTreeSet<StorageBucketId>,

    /// Associated distribution buckets.
    pub distributed_by: BTreeSet<DistributionBucketId>,

    /// Dynamic bag deletion prize.
    pub deletion_prize: Balance,
}

impl<DataObjectId: Ord, StorageBucketId: Ord, DistributionBucketId: Ord, Balance>
    DynamicBagObject<DataObjectId, StorageBucketId, DistributionBucketId, Balance>
{
    // Calculates total object size for dynamic bag.
    pub(crate) fn objects_total_size(&self) -> u64 {
        self.objects.values().map(|obj| obj.size).sum()
    }

    // Calculates total objects number for dynamic bag.
    pub(crate) fn objects_number(&self) -> u64 {
        self.objects.len().saturated_into()
    }
}

//TODO: refactor structs!

// Voucher update parameters for a changing bag.
struct VoucherUpdateForBagChange<StorageBucketId> {
    // Voucher update parameters.
    voucher_update: VoucherUpdate,

    // Added buckets for a bag.
    added_buckets: BTreeSet<StorageBucketId>,

    // Removed buckets for a bag.
    removed_buckets: BTreeSet<StorageBucketId>,
}

//TODO: rename??
// Helper struct for the dynamic bag changing.
#[derive(Clone, PartialEq, Eq, Debug, Copy, Default)]
struct VoucherUpdateWithDeletionPrize<Balance> {
    // Voucher update for data objects
    voucher_update: VoucherUpdate,

    // Total deletion prize for data objects.
    total_deletion_prize: Balance,
}

impl<Balance: Saturating + Copy> VoucherUpdateWithDeletionPrize<Balance> {
    // Adds a single object data to the voucher update (updates objects size, number)
    // and deletion prize.
    fn add_object(&mut self, size: u64, deletion_prize: Balance) {
        self.voucher_update.add_object(size);
        self.total_deletion_prize = self.total_deletion_prize.saturating_add(deletion_prize);
    }
}

decl_storage! {
    trait Store for Module<T: Trait> as Storage {
        /// Defines whether all new uploads blocked
        pub UploadingBlocked get(fn uploading_blocked): bool;

        /// Council bag.
        pub CouncilBag get(fn council_bag): StaticBag<T>;

        /// Working group bag storage map.
        pub WorkingGroupBags get(fn working_group_bag): map hasher(blake2_128_concat)
            WorkingGroup => StaticBag<T>;

        /// Dynamic bag storage map.
        pub DynamicBags get (fn dynamic_bag_by_id): map hasher(blake2_128_concat)
            DynamicBagId<T> => DynamicBag<T>;

        /// Storage bucket id counter. Starts at zero.
        pub NextStorageBucketId get(fn next_storage_bucket_id): T::StorageBucketId;

        /// Data object id counter. Starts at zero.
        pub NextDataObjectId get(fn next_data_object_id): T::DataObjectId;

        /// Total number of the storage buckets in the system.
        pub StorageBucketsNumber get(fn storage_buckets_number): u64;

        /// Storage buckets.
        pub StorageBucketById get (fn storage_bucket_by_id): map hasher(blake2_128_concat)
            T::StorageBucketId => StorageBucket<WorkerId<T>>;

        /// Blacklisted data object hashes.
        pub Blacklist get (fn blacklist): map hasher(blake2_128_concat) ContentId => ();

        /// Blacklist collection counter.
        pub CurrentBlacklistSize get (fn current_blacklist_size): u64;
    }
}

decl_event! {
    /// Storage events
 pub enum Event<T>
    where
        <T as Trait>::StorageBucketId,
        WorkerId = WorkerId<T>,
        UpdateStorageBucketForBagsParams = UpdateStorageBucketForBagsParams<T>,
        <T as Trait>::DataObjectId,
        UploadParameters = UploadParameters<T>,
        ObjectsInBagParams = ObjectsInBagParams<T>,
        BagId = BagId<T>,
        DynamicBagId = DynamicBagId<T>,
        <T as frame_system::Trait>::AccountId,
        Balance = BalanceOf<T>,
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
        StorageBucketInvitationAccepted(StorageBucketId, WorkerId),

        /// Emits on updating storage buckets for bags.
        /// Params
        /// - 'bags-to-storage bucket set' container
        StorageBucketsUpdatedForBags(UpdateStorageBucketForBagsParams),

        /// Emits on uploading data objects.
        /// Params
        /// - data objects IDs
        /// - initial uploading parameters
        DataObjectdUploaded(Vec<DataObjectId>, UploadParameters),

        /// Emits on setting the storage operator metadata.
        /// Params
        /// - storage bucket ID
        /// - invited worker ID
        /// - metadata
        StorageOperatorMetadataSet(StorageBucketId, WorkerId, Vec<u8>),

        /// Emits on accepting pending data objects.
        /// Params
        /// - storage bucket ID
        /// - worker ID (storage provider ID)
        /// - pending data objects
        PendingDataObjectsAccepted(StorageBucketId, WorkerId, ObjectsInBagParams),

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

        /// Emits on changing the global uploading block status.
        /// Params
        /// - new status
        UploadingBlockStatusUpdated(bool),

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
        /// - worker ID (storage provider ID)
        /// - new status
        StorageBucketStatusUpdated(StorageBucketId, WorkerId, bool),

        /// Emits on updating the blacklist with data hashes.
        /// Params
        /// - hashes to remove from the blacklist
        /// - hashes to add to the blacklist
        UpdateBlacklist(BTreeSet<ContentId>, BTreeSet<ContentId>),

        /// Emits on deleting a dynamic bag.
        /// Params
        /// - account ID for the deletion prize
        /// - dynamic bag ID
        DynamicBagDeleted(AccountId, DynamicBagId),

        /// Emits on changing the deletion prize for a dynamic bag.
        /// Params
        /// - dynamic bag ID
        /// - new deletion prize
        DeletionPrizeChanged(DynamicBagId, Balance),

        /// Emits on changing the voucher for a storage bucket.
        /// Params
        /// - storage bucket ID
        /// - new voucher
        VoucherChanged(StorageBucketId, Voucher),

        /// Emits on storage bucket deleting.
        /// Params
        /// - storage bucket ID
        StorageBucketDeleted(StorageBucketId),
    }
}

decl_error! {
    /// Storage module predefined errors
    pub enum Error for Module<T: Trait>{
        /// Max storage bucket number limit exceeded.
        MaxStorageBucketNumberLimitExceeded,

        /// Empty "data object creation" collection.
        NoObjectsOnUpload,

        /// The requested storage bucket doesn't exist.
        StorageBucketDoesntExist,

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

        /// The parameter structure is empty: UpdateStorageBucketForBagsParams.
        UpdateStorageBucketForBagsParamsIsEmpty,

        /// Upload data error: empty content ID provided.
        EmptyContentId,

        /// Upload data error: zero object size.
        ZeroObjectSize,

        /// Upload data error: invalid deletion prize source account.
        InvalidDeletionPrizeSourceAccount,

        /// Upload data error: data objects per bag limit exceeded.
        DataObjectsPerBagLimitExceeded,

        /// Invalid storage provider for bucket.
        InvalidStorageProvider,

        /// Insufficient balance for an operation.
        InsufficientBalance,

        /// The `objects-in-the-bag` extrinsic parameters are empty.
        ObjectInBagParamsAreEmpty,

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
    }
}

decl_module! {
    /// _Storage_ substrate module.
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Default deposit_event() handler
        fn deposit_event() = default;

        /// Predefined errors.
        type Error = Error<T>;

        /// Exports const - max allowed storage bucket number.
        const MaxStorageBucketNumber: u64 = T::MaxStorageBucketNumber::get();

        /// Exports const - max number of data objects per bag.
        const MaxNumberOfDataObjectsPerBag: u64 = T::MaxNumberOfDataObjectsPerBag::get();

        /// Exports const - a prize for a data object deletion.
        const DataObjectDeletionPrize: BalanceOf<T> = T::DataObjectDeletionPrize::get();

        /// Exports const - maximum size of the "hash blacklist" collection.
        const BlacklistSizeLimit: u64 = T::BlacklistSizeLimit::get();

        // ===== Storage Lead actions =====

        /// Delete storage bucket. Must be empty. Storage operator must be missing.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_storage_bucket(
            origin,
            storage_bucket_id: T::StorageBucketId,
        ){
            T::ensure_working_group_leader_origin(origin)?;

            let bucket = Self::ensure_storage_bucket_exists(storage_bucket_id)?;

            Self::ensure_bucket_missing_invitation_status(&bucket)?;

            ensure!(
                bucket.voucher.objects_used == 0,
                Error::<T>::CannotDeleteNonEmptyStorageBucket
            );

            //
            // == MUTATION SAFE ==
            //

            <StorageBucketById<T>>::remove(storage_bucket_id);

            Self::deposit_event(
                RawEvent::StorageBucketDeleted(storage_bucket_id)
            );
        }

        /// Update whether uploading is globally blocked.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_uploading_blocked_status(origin, new_status: bool) {
            T::ensure_working_group_leader_origin(origin)?;

            //
            // == MUTATION SAFE ==
            //

            UploadingBlocked::put(new_status);

            Self::deposit_event(RawEvent::UploadingBlockStatusUpdated(new_status));
        }

        /// Add and remove hashes to the current blacklist.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_blacklist(
            origin,
            remove_hashes: BTreeSet<ContentId>,
            add_hashes: BTreeSet<ContentId>
        ){
            T::ensure_working_group_leader_origin(origin)?;

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
            T::ensure_working_group_leader_origin(origin)?;

            let voucher = Voucher {
                size_limit,
                objects_limit,
                ..Default::default()
            };

            Self::can_create_storage_bucket(&voucher)?;

            //
            // == MUTATION SAFE ==
            //

            let operator_status = invite_worker
                .map(StorageBucketOperatorStatus::InvitedStorageWorker)
                .unwrap_or(StorageBucketOperatorStatus::Missing);

            let storage_bucket = StorageBucket {
                operator_status,
                accepting_new_bags,
                voucher,
                metadata: Vec::new(),
            };

            let storage_bucket_id = Self::next_storage_bucket_id();

            StorageBucketsNumber::put(Self::storage_buckets_number() + 1);

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

        // TODO: consider single bag instead of collection.
        // TODO: consider splitting the buckets into the two collections: added and removed.

        /// Establishes a connection between bags and storage buckets.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_storage_buckets_for_bags(
            origin,
            params: UpdateStorageBucketForBagsParams<T>
        ) {
            T::ensure_working_group_leader_origin(origin)?;

            let voucher_updates = Self::validate_update_storage_buckets_for_bags_params(&params)?;

            //
            // == MUTATION SAFE ==
            //

            for (bag_id, buckets) in params.bags.iter() {
                BagManager::<T>::set_storage_buckets(bag_id, buckets.clone());
            }

            // Update vouchers.
            for (_, voucher_info) in voucher_updates.iter() {
                Self::change_storage_buckets_vouchers(
                    &voucher_info.added_buckets,
                    &voucher_info.voucher_update,
                    OperationType::Increase
                );
                Self::change_storage_buckets_vouchers(
                    &voucher_info.removed_buckets,
                    &voucher_info.voucher_update,
                    OperationType::Decrease
                );
            }

            Self::deposit_event(RawEvent::StorageBucketsUpdatedForBags(params));
        }

        /// Cancel pending storage bucket invite. An invitation must be pending.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn cancel_storage_bucket_operator_invite(origin, storage_bucket_id: T::StorageBucketId){
            T::ensure_working_group_leader_origin(origin)?;

            let bucket = Self::ensure_storage_bucket_exists(storage_bucket_id)?;

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
            T::ensure_working_group_leader_origin(origin)?;

            let bucket = Self::ensure_storage_bucket_exists(storage_bucket_id)?;

            Self::ensure_bucket_missing_invitation_status(&bucket)?;

            // TODO: ensure operator_id exists?

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

        /// Removes storage bucket operator. Must be invited.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn remove_storage_bucket_operator(
            origin,
            storage_bucket_id: T::StorageBucketId,
        ){
            T::ensure_working_group_leader_origin(origin)?;

            let bucket = Self::ensure_storage_bucket_exists(storage_bucket_id)?;

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

        // ===== Storage Operator actions =====

        /// Accept the storage bucket invitation. An invitation must match the worker_id parameter.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn accept_storage_bucket_invitation(
            origin,
            worker_id: WorkerId<T>,
            storage_bucket_id: T::StorageBucketId
        ) {
            T::ensure_worker_origin(origin, worker_id)?;

            let bucket = Self::ensure_storage_bucket_exists(storage_bucket_id)?;

            Self::ensure_bucket_storage_provider_invitation_status(&bucket, worker_id)?;

            //
            // == MUTATION SAFE ==
            //

            <StorageBucketById<T>>::mutate(storage_bucket_id, |bucket| {
                bucket.operator_status = StorageBucketOperatorStatus::StorageWorker(worker_id);
            });

            Self::deposit_event(
                RawEvent::StorageBucketInvitationAccepted(storage_bucket_id, worker_id)
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
            T::ensure_worker_origin(origin, worker_id)?;

            let bucket = Self::ensure_storage_bucket_exists(storage_bucket_id)?;

            Self::ensure_bucket_invitation_accepted(&bucket, worker_id)?;

            //
            // == MUTATION SAFE ==
            //

            <StorageBucketById<T>>::mutate(storage_bucket_id, |bucket| {
                bucket.metadata = metadata.clone();
            });

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
            params: ObjectsInBagParams<T>
        ) {
            T::ensure_worker_origin(origin, worker_id)?;

            let bucket = Self::ensure_storage_bucket_exists(storage_bucket_id)?;

            Self::ensure_bucket_invitation_accepted(&bucket, worker_id)?;

            Self::validate_accept_pending_data_objects_params(&params)?;

            //
            // == MUTATION SAFE ==
            //

            for ids in params.assigned_data_objects.iter() {
                BagManager::<T>::accept_data_objects(&ids.bag_id, &ids.data_object_id);
            }

            Self::deposit_event(
                    RawEvent::PendingDataObjectsAccepted(storage_bucket_id, worker_id, params)
            );
        }

        /// Update whether new bags are being accepted for storage.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_storage_bucket_status(
            origin,
            worker_id: WorkerId<T>,
            storage_bucket_id: T::StorageBucketId,
            accepting_new_bags: bool
        ) {
            T::ensure_worker_origin(origin, worker_id)?;

            let bucket = Self::ensure_storage_bucket_exists(storage_bucket_id)?;

            Self::ensure_bucket_invitation_accepted(&bucket, worker_id)?;

            //
            // == MUTATION SAFE ==
            //

            <StorageBucketById<T>>::mutate(storage_bucket_id, |bucket| {
                bucket.accepting_new_bags = accepting_new_bags;
            });

            Self::deposit_event(
                RawEvent::StorageBucketStatusUpdated(
                    storage_bucket_id,
                    worker_id,
                    accepting_new_bags
                )
            );
        }
    }
}

// Public methods
impl<T: Trait> DataObjectStorage<T> for Module<T> {
    fn can_upload_data_objects(params: &UploadParameters<T>) -> DispatchResult {
        Self::validate_upload_data_objects_parameters(params).map(|_| ())
    }

    // TODO: calculate actual weight!
    fn upload_data_objects(params: UploadParameters<T>) -> DispatchResult {
        let voucher_update = Self::validate_upload_data_objects_parameters(&params)?;

        //
        // == MUTATION SAFE ==
        //

        let data = Self::create_data_objects(params.object_creation_list.clone());

        <StorageTreasury<T>>::deposit(
            &params.deletion_prize_source_account_id,
            data.total_deletion_prize,
        )?;

        <NextDataObjectId<T>>::put(data.next_data_object_id);

        BagManager::<T>::append_data_objects(&params.bag_id, &data.data_objects_map);

        let operation_type = OperationType::Increase;

        // Add a deletion prize for the dynamic bag only.
        Self::change_deletion_prize_for_bag(
            &params.bag_id,
            data.total_deletion_prize,
            operation_type,
        );

        Self::change_storage_bucket_vouchers_for_bag(
            &params.bag_id,
            &voucher_update,
            operation_type,
        );

        Self::deposit_event(RawEvent::DataObjectdUploaded(data.data_object_ids, params));

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
        let voucher_update_with_deletion_prize =
            Self::validate_data_objects_on_moving(&src_bag_id, &dest_bag_id, &objects)?;

        //
        // == MUTATION SAFE ==
        //

        //TODO: Check dynamic bag existence.

        BagManager::<T>::move_data_objects(&src_bag_id, &dest_bag_id, &objects);

        // Change source bag.
        let src_operation_type = OperationType::Decrease;
        Self::change_storage_bucket_vouchers_for_bag(
            &src_bag_id,
            &voucher_update_with_deletion_prize.voucher_update,
            src_operation_type,
        );
        Self::change_deletion_prize_for_bag(
            &src_bag_id,
            voucher_update_with_deletion_prize.total_deletion_prize,
            src_operation_type,
        );

        // Change destination bag.
        let dest_operation_type = OperationType::Increase;
        Self::change_storage_bucket_vouchers_for_bag(
            &dest_bag_id,
            &voucher_update_with_deletion_prize.voucher_update,
            dest_operation_type,
        );
        Self::change_deletion_prize_for_bag(
            &dest_bag_id,
            voucher_update_with_deletion_prize.total_deletion_prize,
            dest_operation_type,
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
        let voucher_update_with_prize =
            Self::validate_delete_data_objects_params(&bag_id, &objects)?;

        //
        // == MUTATION SAFE ==
        //

        <StorageTreasury<T>>::withdraw(
            &deletion_prize_account_id,
            voucher_update_with_prize.total_deletion_prize,
        )?;

        // TODO: Check dynamic bag existence.

        for data_object_id in objects.iter() {
            BagManager::<T>::delete_data_object(&bag_id, &data_object_id);
        }

        let operation_type = OperationType::Decrease;

        Self::change_storage_bucket_vouchers_for_bag(
            &bag_id,
            &voucher_update_with_prize.voucher_update,
            operation_type,
        );

        // Subtract deletion prize for dynamic bags only.
        Self::change_deletion_prize_for_bag(
            &bag_id,
            voucher_update_with_prize.total_deletion_prize,
            operation_type,
        );

        Self::deposit_event(RawEvent::DataObjectsDeleted(
            deletion_prize_account_id,
            bag_id,
            objects,
        ));

        Ok(())
    }

    fn can_delete_dynamic_bag(bag_id: &DynamicBagId<T>) -> DispatchResult {
        Self::validate_delete_dynamic_bag_params(bag_id).map(|_| ())
    }

    fn delete_dynamic_bag(
        deletion_prize_account_id: T::AccountId,
        bag_id: DynamicBagId<T>,
    ) -> DispatchResult {
        let voucher_update_with_prize = Self::validate_delete_dynamic_bag_params(&bag_id)?;

        //
        // == MUTATION SAFE ==
        //

        <StorageTreasury<T>>::withdraw(
            &deletion_prize_account_id,
            voucher_update_with_prize.total_deletion_prize,
        )?;

        //TODO: check for existence (skip)
        let dynamic_bag = Self::dynamic_bag(&bag_id);

        Self::change_storage_buckets_vouchers(
            &dynamic_bag.stored_by,
            &voucher_update_with_prize.voucher_update,
            OperationType::Decrease,
        );

        Self::remove_dynamic_bag(&bag_id);

        Self::deposit_event(RawEvent::DynamicBagDeleted(
            deletion_prize_account_id,
            bag_id,
        ));

        Ok(())
    }
}

impl<T: Trait> Module<T> {
    // Validates dynamic bag deletion params and conditions.
    fn validate_delete_dynamic_bag_params(
        bag_id: &DynamicBagId<T>,
    ) -> Result<VoucherUpdateWithDeletionPrize<BalanceOf<T>>, DispatchError> {
        //TODO: check bag for existence

        let dynamic_bag = Self::dynamic_bag(bag_id);

        let voucher_update = VoucherUpdate {
            objects_number: dynamic_bag.objects_number(),
            objects_total_size: dynamic_bag.objects_total_size(),
        };

        ensure!(
            <StorageTreasury<T>>::usable_balance() >= dynamic_bag.deletion_prize,
            Error::<T>::InsufficientTreasuryBalance
        );

        let voucher_update_with_prize = VoucherUpdateWithDeletionPrize {
            voucher_update,
            total_deletion_prize: dynamic_bag.deletion_prize,
        };

        Ok(voucher_update_with_prize)
    }

    // Ensures the existence of the storage bucket.
    // Returns the StorageBucket object or error.
    fn ensure_storage_bucket_exists(
        storage_bucket_id: T::StorageBucketId,
    ) -> Result<StorageBucket<WorkerId<T>>, Error<T>> {
        ensure!(
            <StorageBucketById<T>>::contains_key(storage_bucket_id),
            Error::<T>::StorageBucketDoesntExist
        );

        Ok(Self::storage_bucket_by_id(storage_bucket_id))
    }

    // Ensures the correct invitation for the storage bucket and storage provider. Storage provider
    // must be invited.
    fn ensure_bucket_storage_provider_invitation_status(
        bucket: &StorageBucket<WorkerId<T>>,
        worker_id: WorkerId<T>,
    ) -> DispatchResult {
        match bucket.operator_status {
            StorageBucketOperatorStatus::Missing => {
                Err(Error::<T>::NoStorageBucketInvitation.into())
            }
            StorageBucketOperatorStatus::StorageWorker(_) => {
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
        bucket: &StorageBucket<WorkerId<T>>,
    ) -> DispatchResult {
        if let StorageBucketOperatorStatus::StorageWorker(_) = bucket.operator_status {
            Ok(())
        } else {
            Err(Error::<T>::StorageProviderMustBeSet.into())
        }
    }

    // Ensures the correct invitation for the storage bucket and storage provider. Must be pending.
    fn ensure_bucket_pending_invitation_status(
        bucket: &StorageBucket<WorkerId<T>>,
    ) -> DispatchResult {
        match bucket.operator_status {
            StorageBucketOperatorStatus::Missing => {
                Err(Error::<T>::NoStorageBucketInvitation.into())
            }
            StorageBucketOperatorStatus::StorageWorker(_) => {
                Err(Error::<T>::StorageProviderAlreadySet.into())
            }
            StorageBucketOperatorStatus::InvitedStorageWorker(_) => Ok(()),
        }
    }

    // Ensures the missing invitation for the storage bucket and storage provider.
    fn ensure_bucket_missing_invitation_status(
        bucket: &StorageBucket<WorkerId<T>>,
    ) -> DispatchResult {
        match bucket.operator_status {
            StorageBucketOperatorStatus::Missing => Ok(()),
            StorageBucketOperatorStatus::StorageWorker(_) => {
                Err(Error::<T>::StorageProviderAlreadySet.into())
            }
            StorageBucketOperatorStatus::InvitedStorageWorker(_) => {
                Err(Error::<T>::InvitedStorageProvider.into())
            }
        }
    }

    // Ensures correct storage provider for the storage bucket.
    fn ensure_bucket_invitation_accepted(
        bucket: &StorageBucket<WorkerId<T>>,
        worker_id: WorkerId<T>,
    ) -> DispatchResult {
        match bucket.operator_status {
            StorageBucketOperatorStatus::Missing => {
                Err(Error::<T>::StorageProviderMustBeSet.into())
            }
            StorageBucketOperatorStatus::InvitedStorageWorker(_) => {
                Err(Error::<T>::InvalidStorageProvider.into())
            }
            StorageBucketOperatorStatus::StorageWorker(invited_worker_id) => {
                ensure!(
                    worker_id == invited_worker_id,
                    Error::<T>::InvalidStorageProvider
                );

                Ok(())
            }
        }
    }

    // Get static bag by its ID from the storage.
    pub(crate) fn static_bag(bag_id: &StaticBagId) -> StaticBag<T> {
        match bag_id {
            StaticBagId::Council => Self::council_bag(),
            StaticBagId::WorkingGroup(working_group) => Self::working_group_bag(working_group),
        }
    }

    // Save static bag to the storage.
    fn save_static_bag(bag_id: &StaticBagId, bag: StaticBag<T>) {
        match bag_id {
            StaticBagId::Council => CouncilBag::<T>::put(bag),
            StaticBagId::WorkingGroup(working_group) => {
                <WorkingGroupBags<T>>::insert(working_group, bag)
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
        });

        let mut next_data_object_id = Self::next_data_object_id();
        let ids = iter::repeat_with(|| {
            let id = next_data_object_id;
            next_data_object_id += One::one();

            id
        })
        .take(data_objects.len());

        let total_deletion_prize: BalanceOf<T> = data_objects
            .len()
            .saturated_into::<BalanceOf<T>>()
            .saturating_mul(deletion_prize);

        let data_objects_map = ids.zip(data_objects).collect::<BTreeMap<_, _>>();
        let data_object_ids = data_objects_map.keys().cloned().collect();

        DataObjectCandidates {
            next_data_object_id,
            data_objects_map,
            data_object_ids,
            total_deletion_prize,
        }
    }

    // Ensures validity of the `accept_pending_data_objects` extrinsic parameters
    fn validate_accept_pending_data_objects_params(
        params: &ObjectsInBagParams<T>,
    ) -> DispatchResult {
        ensure!(
            !params.assigned_data_objects.is_empty(),
            Error::<T>::ObjectInBagParamsAreEmpty
        );

        for ids in params.assigned_data_objects.iter() {
            BagManager::<T>::ensure_data_object_existence(&ids.bag_id, &ids.data_object_id)?;
        }

        //TODO: validate bag_to_bucket relation?
        //TODO: Validate dynamic bag existence?

        Ok(())
    }

    // Ensures validity of the `update_storage_buckets_for_bags` extrinsic parameters
    fn validate_update_storage_buckets_for_bags_params(
        params: &UpdateStorageBucketForBagsParams<T>,
    ) -> Result<BTreeMap<BagId<T>, VoucherUpdateForBagChange<T::StorageBucketId>>, DispatchError>
    {
        ensure!(
            !params.bags.is_empty(),
            Error::<T>::UpdateStorageBucketForBagsParamsIsEmpty
        );

        //TODO: Validate dynamic bag existence
        //TODO: Validate accepting_new_bags for the storage bucket

        let mut voucher_update_result = BTreeMap::new();

        for (bag_id, buckets) in params.bags.iter() {
            let mut added_buckets = BTreeSet::new();
            let mut removed_buckets = BTreeSet::new();

            let storage_bucket_ids = BagManager::<T>::get_storage_bucket_ids(bag_id);

            for bucket_id in buckets.iter() {
                ensure!(
                    <StorageBucketById<T>>::contains_key(&bucket_id),
                    Error::<T>::StorageBucketDoesntExist
                );

                if !storage_bucket_ids.contains(bucket_id) {
                    added_buckets.insert(*bucket_id);
                }
            }

            for existing_bucket_id in storage_bucket_ids.iter() {
                if !buckets.contains(existing_bucket_id) {
                    removed_buckets.insert(*existing_bucket_id);
                }
            }

            let objects_total_size = BagManager::<T>::get_data_objects_total_size(bag_id);
            let objects_number = BagManager::<T>::get_data_objects_number(bag_id);

            let voucher_update = VoucherUpdate {
                objects_number,
                objects_total_size,
            };

            Self::check_buckets_for_overflow(&added_buckets, &voucher_update)?;

            voucher_update_result.insert(
                bag_id.clone(),
                VoucherUpdateForBagChange {
                    voucher_update,
                    added_buckets,
                    removed_buckets,
                },
            );
        }

        Ok(voucher_update_result)
    }

    // Get dynamic bag by its ID from the storage.
    pub(crate) fn dynamic_bag(bag_id: &DynamicBagId<T>) -> DynamicBag<T> {
        Self::dynamic_bag_by_id(bag_id)
    }

    // Save a dynamic bag to the storage.
    fn save_dynamic_bag(bag_id: &DynamicBagId<T>, bag: DynamicBag<T>) {
        <DynamicBags<T>>::insert(bag_id, bag);
    }

    // Delete a dynamic bag from the storage.
    fn remove_dynamic_bag(bag_id: &DynamicBagId<T>) {
        <DynamicBags<T>>::remove(bag_id);
    }

    // Validate the "Move data objects between bags" operation data.
    fn validate_data_objects_on_moving(
        src_bag_id: &BagId<T>,
        dest_bag_id: &BagId<T>,
        object_ids: &BTreeSet<T::DataObjectId>,
    ) -> Result<VoucherUpdateWithDeletionPrize<BalanceOf<T>>, DispatchError> {
        ensure!(
            *src_bag_id != *dest_bag_id,
            Error::<T>::SourceAndDestinationBagsAreEqual
        );

        ensure!(
            !object_ids.is_empty(),
            Error::<T>::DataObjectIdCollectionIsEmpty
        );

        //TODO: change deletion prize for dynamic bags.

        let mut voucher_update_with_prize =
            VoucherUpdateWithDeletionPrize::<BalanceOf<T>>::default();

        for object_id in object_ids.iter() {
            let data_object = BagManager::<T>::ensure_data_object_existence(src_bag_id, object_id)?;

            voucher_update_with_prize.add_object(data_object.size, data_object.deletion_prize);
        }

        Self::check_bag_for_buckets_overflow(
            dest_bag_id,
            &voucher_update_with_prize.voucher_update,
        )?;

        Ok(voucher_update_with_prize)
    }

    // Returns only existing hashes in the blacklist from the original collection.
    #[allow(clippy::redundant_closure)] // doesn't work with Substrate storage functions.
    fn get_existing_hashes(hashes: &BTreeSet<ContentId>) -> BTreeSet<ContentId> {
        Self::get_hashes_by_predicate(hashes, |cid| Blacklist::contains_key(cid))
    }

    // Returns only nonexisting hashes in the blacklist from the original collection.
    fn get_nonexisting_hashes(hashes: &BTreeSet<ContentId>) -> BTreeSet<ContentId> {
        Self::get_hashes_by_predicate(hashes, |cid| !Blacklist::contains_key(cid))
    }

    // Returns hashes from the original collection selected by predicate.
    fn get_hashes_by_predicate<P: FnMut(&&ContentId) -> bool>(
        hashes: &BTreeSet<ContentId>,
        predicate: P,
    ) -> BTreeSet<ContentId> {
        hashes
            .iter()
            .filter(predicate)
            .cloned()
            .collect::<BTreeSet<_>>()
    }

    // Ensure the new bucket could be created. It also validates some parameters.
    fn can_create_storage_bucket(voucher: &Voucher) -> DispatchResult {
        ensure!(
            Self::storage_buckets_number() < T::MaxStorageBucketNumber::get(),
            Error::<T>::MaxStorageBucketNumberLimitExceeded
        );

        ensure!(
            voucher.size_limit <= MAX_OBJECT_SIZE_LIMIT,
            Error::<T>::VoucherMaxObjectSizeLimitExceeded
        );

        ensure!(
            voucher.objects_limit <= MAX_OBJECT_NUMBER_LIMIT,
            Error::<T>::VoucherMaxObjectNumberLimitExceeded
        );

        Ok(())
    }

    // Update total objects size and number for all storage buckets assigned to a bag.
    fn change_storage_bucket_vouchers_for_bag(
        bag_id: &BagId<T>,
        voucher_update: &VoucherUpdate,
        voucher_operation: OperationType,
    ) {
        let bucket_ids = BagManager::<T>::get_storage_bucket_ids(bag_id);

        Self::change_storage_buckets_vouchers(&bucket_ids, voucher_update, voucher_operation);
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

    // Validates `delete_data_objects` parameters.
    // Returns voucher update for an affected bag.
    fn validate_delete_data_objects_params(
        bag_id: &BagId<T>,
        data_object_ids: &BTreeSet<T::DataObjectId>,
    ) -> Result<VoucherUpdateWithDeletionPrize<BalanceOf<T>>, DispatchError> {
        ensure!(
            !data_object_ids.is_empty(),
            Error::<T>::DataObjectIdParamsAreEmpty
        );

        let mut voucher_update_with_prize = VoucherUpdateWithDeletionPrize::default();

        for data_object_id in data_object_ids.iter() {
            let data_object =
                BagManager::<T>::ensure_data_object_existence(bag_id, data_object_id)?;

            voucher_update_with_prize.add_object(data_object.size, data_object.deletion_prize);
        }

        ensure!(
            <StorageTreasury<T>>::usable_balance()
                >= voucher_update_with_prize.total_deletion_prize,
            Error::<T>::InsufficientTreasuryBalance
        );

        Ok(voucher_update_with_prize)
    }

    // Validates upload parameters and conditions (like global uploading block).
    // Returns voucher update parameters for the storage buckets.
    fn validate_upload_data_objects_parameters(
        params: &UploadParameters<T>,
    ) -> Result<VoucherUpdate, DispatchError> {
        // TODO: consider refactoring and splitting the method.

        // TODO: Check dynamic bag existence.

        // Check global uploading block.
        ensure!(!Self::uploading_blocked(), Error::<T>::UploadingBlocked);

        // Check object creation list validity.
        ensure!(
            !params.object_creation_list.is_empty(),
            Error::<T>::NoObjectsOnUpload
        );

        let bag_objects_number = BagManager::<T>::get_data_objects_number(&params.bag_id.clone());

        let new_objects_number: u64 = params.object_creation_list.len().saturated_into();

        let total_possible_data_objects_number: u64 = new_objects_number + bag_objects_number;

        // Check bag capacity.
        ensure!(
            total_possible_data_objects_number <= T::MaxNumberOfDataObjectsPerBag::get(),
            Error::<T>::DataObjectsPerBagLimitExceeded
        );

        // Check data objects.
        for object_params in params.object_creation_list.iter() {
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
        }

        let total_deletion_prize: BalanceOf<T> =
            new_objects_number.saturated_into::<BalanceOf<T>>() * T::DataObjectDeletionPrize::get();
        let usable_balance =
            Balances::<T>::usable_balance(&params.deletion_prize_source_account_id);

        // Check account balance to satisfy deletion prize.
        ensure!(
            usable_balance >= total_deletion_prize,
            Error::<T>::InsufficientBalance
        );

        let new_objects_total_size: u64 =
            params.object_creation_list.iter().map(|obj| obj.size).sum();

        let voucher_update = VoucherUpdate {
            objects_number: new_objects_number,
            objects_total_size: new_objects_total_size,
        };

        // Check buckets.
        Self::check_bag_for_buckets_overflow(&params.bag_id, &voucher_update)?;

        Ok(voucher_update)
    }

    // Iterates through buckets in the bag. Verifies voucher parameters to fit the new limits:
    // objects number and total objects size.
    fn check_bag_for_buckets_overflow(
        bag_id: &BagId<T>,
        voucher_update: &VoucherUpdate,
    ) -> DispatchResult {
        let bucket_ids = BagManager::<T>::get_storage_bucket_ids(bag_id);

        Self::check_buckets_for_overflow(&bucket_ids, voucher_update)
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

    // Increase or decrease a deletion prize for a dynamic bag.
    fn change_deletion_prize_for_dynamic_bag(
        dynamic_bag_id: &DynamicBagId<T>,
        deletion_prize: BalanceOf<T>,
        operation: OperationType,
    ) {
        let mut bag = Self::dynamic_bag(dynamic_bag_id);

        bag.deletion_prize = match operation {
            OperationType::Increase => bag.deletion_prize.saturating_add(deletion_prize),
            OperationType::Decrease => bag.deletion_prize.saturating_sub(deletion_prize),
        };

        Self::deposit_event(RawEvent::DeletionPrizeChanged(
            dynamic_bag_id.clone(),
            bag.deletion_prize,
        ));

        Self::save_dynamic_bag(dynamic_bag_id, bag);
    }

    // Increase or decrease a deletion prize for a dynamic bag.
    // Affect dynamic bags only. Skips static bags.
    fn change_deletion_prize_for_bag(
        bag_id: &BagId<T>,
        deletion_prize: BalanceOf<T>,
        operation: OperationType,
    ) {
        if let BagId::<T>::DynamicBag(ref dynamic_bag_id) = bag_id {
            Self::change_deletion_prize_for_dynamic_bag(dynamic_bag_id, deletion_prize, operation);
        }
    }
}
