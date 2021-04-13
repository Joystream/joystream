// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

// Do not delete! Cannot be uncommented by default, because of Parity decl_module! issue.
// #![warn(missing_docs)]

// TODO: remove all: #[allow(dead_code)]
// TODO: add module comment
// TODO: add types comments
// TODO: add benchmarks
// TODO: add constants:
// Max size of blacklist.
// Max number of distribution bucket families
// Max number of distribution buckets per family.
// Max number of pending invitations per distribution bucket.
// Max number of data objects per bag.

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

use codec::{Codec, Decode, Encode};
use frame_support::dispatch::DispatchResult;
use frame_support::traits::Get;
use frame_support::{decl_error, decl_event, decl_module, decl_storage, ensure, Parameter};
use frame_system::ensure_signed;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_arithmetic::traits::BaseArithmetic;
use sp_arithmetic::traits::One;
use sp_runtime::traits::{MaybeSerialize, Member};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::vec::Vec;

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

    /// Defines max allowed storage bucket number.
    type MaxStorageBucketNumber: Get<u64>;
}

// /// Member identifier in membership::member module
// pub type MemberId<T> = <T as membership::Trait>::MemberId;

/// Type identifier for worker role, which must be same as membership actor identifier
pub type WorkerId<T> = <T as membership::Trait>::ActorId;

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;
//type DistributionBucketId = u64; // TODO: Move to the Trait
// type ChannelId = u64; // Move to the Trait
// type DaoId = u64; // Move to the Trait
// type WorkerId = u64; // Move to the Trait

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PendingDataObjectStatus<StorageBucketId> {
    pub liaison: StorageBucketId,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum DataObjectStatus<StorageBucketId> {
    Pending(PendingDataObjectStatus<StorageBucketId>),
    AcceptedByLiaison,
}

impl<StorageBucketId: Default> Default for DataObjectStatus<StorageBucketId> {
    fn default() -> Self {
        Self::Pending(Default::default())
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct DataObject<StorageBucketId, Balance> {
    pub status: DataObjectStatus<StorageBucketId>,
    pub deletion_prize: Balance,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct StaticBag<DataObjectId: Ord, StorageBucketId: Ord, Balance> {
    pub objects: BTreeMap<DataObjectId, DataObject<StorageBucketId, Balance>>,
    pub stored_by: BTreeSet<StorageBucketId>,
    //TODO: implement -    pub distributed_by: BTreeSet<DistributionBucketId>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct DataObjectCreationParameters {
    pub size: u64,
    pub ipfs_content_id: Vec<u8>,
}

/// Identifier for a bag.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub enum BagId {
    //TODO: implement -    DynamicBag(DynamicBagId),
    StaticBag(StaticBagId),
}

impl Default for BagId {
    fn default() -> Self {
        Self::StaticBag(Default::default())
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub enum StaticBagId {
    Council,
    //TODO: implement -    WorkingGroup(WorkingGroup),
}

impl Default for StaticBagId {
    fn default() -> Self {
        Self::Council
    }
}

//TODO: implement:
// #[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
// #[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
// pub enum DynamicBagId {
//     Member(MemberId),
//     Channel(ChannelId),
//     Dao(DaoId),
// }
//
// impl Default for DynamicBagId {
//     fn default() -> Self {
//         Self::Member(Default::default())
//     }
// }

pub type UploadParameters<T> = UploadParametersObject<<T as frame_system::Trait>::AccountId>;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct UploadParametersObject<AccountId> {
    /// Public key used authentication in upload to liaison.
    pub authentication_key: Vec<u8>,
    pub bag: BagId,
    pub object_creation: Vec<DataObjectCreationParameters>,
    pub deletion_prize_source_account: AccountId,
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

    /// Number of pending (not accepted) data objects.
    pub number_of_pending_data_objects: u32,

    /// Defines limits for a bucket.
    pub voucher: Voucher,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub struct BaggedDataObject<DataObjectId> {
    pub bag_id: BagId,
    pub data_object_id: DataObjectId,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct UpdateStorageBucketForStaticBagsParams<StorageBucketId: Ord> {
    pub bags: BTreeMap<BagId, BTreeSet<StorageBucketId>>, //TODO: change to StaticBagId
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct AcceptPendingDataObjectsParams<DataObjectId: Ord> {
    pub bagged_data_objects: BTreeSet<BaggedDataObject<DataObjectId>>,
}

decl_storage! {
    trait Store for Module<T: Trait> as Storage {
        // === Static bags

        /// Council bag.
        pub CouncilBag get(fn council_bag): StaticBag<T::DataObjectId, T::StorageBucketId, BalanceOf<T>>;

        /// Storage bucket id counter. Starts at zero.
        pub NextStorageBucketId get(fn next_storage_bucket_id): T::StorageBucketId;

        /// Total number of the storage buckets in the system.
        pub StorageBucketsNumber get(fn storage_buckets_number): u64;

        // TODO: rework back to "Storage bucket (flat) map" - BTreemap
        /// Storage buckets.
        pub StorageBucketById get (fn storage_bucket_by_id): map hasher(blake2_128_concat)
            T::StorageBucketId => StorageBucket<WorkerId<T>>;
    }
}

decl_event! {
    /// Storage events
 pub enum Event<T>
    where
        <T as Trait>::StorageBucketId,
        WorkerId = WorkerId<T>,
    {
        /// Emits on creating the storage bucket.
        /// Params
        /// - storage bucket ID
        /// - invited worker
        /// - flag "accepting_new_data_objects"
        /// - voucher struct
        StorageBucketCreated(StorageBucketId, Option<WorkerId>, bool, Voucher),
    }
}

decl_error! {
    /// Storage module predefined errors
    pub enum Error for Module<T: Trait>{
        /// Max storage number limit exceeded.
        MaxStorageNumberLimitExceeded,

        /// Empty "data object creation" collection.
        NoObjectsOnUpload,
    }
}

decl_module! {
    /// _Storage_ substrate module.
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Default deposit_event() handler
        fn deposit_event() = default;

        /// Predefined errors.
        type Error = Error<T>;

        /// Exports const -  max allowed storage bucket number.
        const MaxStorageBucketNumber: u64 = T::MaxStorageBucketNumber::get();

        /// Upload new objects, and does so atomically if there is more than one provided.
        /// TODO:
        /// - Must return rich information about bags & data objects created.
        /// - a `can_upload` extrinsic is likely going to be needed
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn upload(_origin, params: UploadParameters<T>) {
            //TODO implement

            Self::validate_upload_parameter(&params)?;
        }

        //TODO: add comment
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_storage_buckets_for_static_bags(
            _origin,
            _update: UpdateStorageBucketForStaticBagsParams<T::StorageBucketId>
 //           _update: Vec<(BagId, Vec<T::StorageBucketId>)>
        ) {
            //TODO implement
        }

        // ===== Storage Lead actions =====

        /// Create storage bucket.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_storage_bucket(
            origin,
            invite_worker: Option<WorkerId<T>>,
            accepting_new_data_objects: bool,
            voucher: Voucher
        ) {
            ensure_signed(origin)?; // TODO: change to the WG lead verification

            let buckets_number = Self::storage_buckets_number();
            ensure!(
                buckets_number < T::MaxStorageBucketNumber::get(),
                Error::<T>::MaxStorageNumberLimitExceeded
            );

            let operator_status = invite_worker
                .map(StorageBucketOperatorStatus::InvitedStorageWorker)
                .unwrap_or(StorageBucketOperatorStatus::Missing);

            //TODO: validate voucher?

            let storage_bucket = StorageBucket {
                 operator_status,
                 accepting_new_bags: accepting_new_data_objects, //TODO: correct?
                 number_of_pending_data_objects: 0,
                 voucher: voucher.clone(),
            };

            let storage_bucket_id = Self::next_storage_bucket_id();

            //
            // == MUTATION SAFE ==
            //

            StorageBucketsNumber::put(buckets_number + 1);

            <NextStorageBucketId<T>>::put(storage_bucket_id + One::one());

            <StorageBucketById<T>>::insert(storage_bucket_id, storage_bucket);

            Self::deposit_event(
                RawEvent::StorageBucketCreated(
                    storage_bucket_id,
                    invite_worker,
                    accepting_new_data_objects,
                    voucher,
                )
            );
        }


        // ===== Storage Operator actions =====

        //TODO: add comment
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_storage_operator_metadata(
            _origin,
            _storage_bucket_id: T::StorageBucketId,
            _metadata: Vec<u8>
        ) {
            //TODO implement
        }

        //TODO: add comment
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn accept_pending_data_objects(
            _origin,
            _worker_id: WorkerId<T>,
            _objects: AcceptPendingDataObjectsParams<T::DataObjectId>
        ) {
            //TODO implement
        }

        //TODO: add comment
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn accept_storage_bucket_invitation(_origin, _storage_bucket_id: T::StorageBucketId) {
            //TODO implement
        }
    }
}

impl<T: Trait> Module<T> {
    // TODO: add comment
    fn validate_upload_parameter(params: &UploadParameters<T>) -> DispatchResult {
        //TODO implement

        ensure!(
            !params.object_creation.is_empty(),
            Error::<T>::NoObjectsOnUpload
        );

        Ok(())
    }
}
