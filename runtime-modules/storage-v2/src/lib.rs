// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

// Do not delete! Cannot be uncommented by default, because of Parity decl_module! issue.
//#![warn(missing_docs)]

// TODO: add module comment
// TODO: add types comments
// TODO: add benchmarks
// TODO: add constants:
// Max size of blacklist.
// Max number of storage buckets.
// Max number of distribution bucket families
// Max number of distribution buckets per family.
// Max number of pending invitations per distribution bucket.
// Max number of data objects per bag.


#[cfg(test)]
mod tests;

use codec::{Codec, Decode, Encode};
use frame_support::dispatch::DispatchResult;
use frame_support::{decl_error, decl_event, decl_module, decl_storage, Parameter};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;
use sp_arithmetic::traits::{BaseArithmetic};
use sp_runtime::traits::{MaybeSerialize, Member};

/// Storage trait.
pub trait Trait: frame_system::Trait + balances::Trait + membership::Trait{
    /// Storage event type.
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    //TODO: add comment
    type DataObjectId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    //TODO: add comment
    type StorageBucketId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;
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

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Voucher {
    pub size_limit: u64,
    pub objects_limit: u64,
    pub size_used: u64,
    pub objects_used: u64,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum StorageBucketOperatorStatus<WorkerId> {
    Missing,
    InvitedStorageWorker(WorkerId),
    StorageWorker(WorkerId),
}

impl<WorkerId> Default for StorageBucketOperatorStatus<WorkerId> {
    fn default() -> Self {
        Self::Missing
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct StorageBucket<WorkerId> {
    pub operator_status: StorageBucketOperatorStatus<WorkerId>,
    pub accepting_new_bags: bool,
    pub number_of_pending_data_objects: u32,
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
    pub bags: BTreeMap<BagId, BTreeSet<StorageBucketId>> //TODO: change to StaticBagId
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct AcceptPendingDataObjectsParams<DataObjectId: Ord> {
    pub bagged_data_objects: BTreeSet<BaggedDataObject<DataObjectId>>
}

decl_storage! {
    trait Store for Module<T: Trait> as Storage {
        // === Static bags

        /// Council bag.
        pub CouncilBag get(fn council_bag): StaticBag<T::DataObjectId, T::StorageBucketId, BalanceOf<T>>;

        // TODO change the comment
        /// Storage bucket (flat) map
        pub StorageBucketById get (fn storage_bucket_by_id)
            : BTreeMap<T::StorageBucketId, StorageBucket<WorkerId<T>>>;
    }
}

decl_event! {
    /// Storage events
 pub enum Event<T>
    where
        <T as frame_system::Trait>::AccountId
    {
        /// Emits on adding of the content.
        ContentAdded(AccountId),
    }
}

decl_error! {
    /// Storage module predefined errors
    pub enum Error for Module<T: Trait>{
        /// Proposal cannot have an empty title"
        EmptyTitleProvided,
    }
}

decl_module! {
    /// _Storage_ substrate module.
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Default deposit_event() handler
        fn deposit_event() = default;

        /// Predefined errors.
        type Error = Error<T>;

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
            _origin,
            _invite_worker: Option<WorkerId<T>>,
            _accepting_new_data_objects: bool,
            _voucher: Voucher
        ) {
            //TODO implement
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
    fn validate_upload_parameter(_params: &UploadParameters<T>) -> DispatchResult {
        //TODO implement
        Ok(())
    }
}
