// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

// Do not delete! Cannot be uncommented by default, because of Parity decl_module! issue.
//#![warn(missing_docs)]

// TODO: add module comment
// TODO: add types comments
// TODO: add benchmarks

#[cfg(test)]
mod tests;

use codec::{Decode, Encode};
use frame_support::dispatch::DispatchResult;
use frame_support::{decl_error, decl_event, decl_module, decl_storage};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;

use common::working_group::WorkingGroup;

/// Storage trait.
pub trait Trait: frame_system::Trait + balances::Trait {
    /// Storage event type.
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;
}

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

type StorageBucketId = u64; // TODO: Move to the Trait
type DistributionBucketId = u64; // TODO: Move to the Trait
type DataObjectId = u64; // Move to the Trait
type MemberId = u64; // Move to the Trait
type ChannelId = u64; // Move to the Trait
type DaoId = u64; // Move to the Trait
type WorkerId = u64; // Move to the Trait

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PendingDataObjectStatus {
    pub liaison: StorageBucketId,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum DataObjectStatus {
    Pending(PendingDataObjectStatus),
    AcceptedByLiaison,
}

impl Default for DataObjectStatus {
    fn default() -> Self {
        Self::Pending(Default::default())
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct DataObject<Balance> {
    pub status: DataObjectStatus,
    pub deletion_prize: Balance,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct StaticBag<Balance> {
    pub objects: BTreeMap<DataObjectId, DataObject<Balance>>,
    pub stored_by: BTreeSet<StorageBucketId>,
    pub distributed_by: BTreeSet<DistributionBucketId>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct DataObjectCreationParameters {
    pub size: u64,
    pub ipfs_content_id: Vec<u8>,
}

/// Identifier for a bag.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum BagId {
    DynamicBag(DynamicBagId),
    StaticBag(StaticBagId),
}

impl Default for BagId {
    fn default() -> Self {
        Self::DynamicBag(Default::default())
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum StaticBagId {
    Council,
    WorkingGroup(WorkingGroup),
}

impl Default for StaticBagId {
    fn default() -> Self {
        Self::Council
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum DynamicBagId {
    Member(MemberId),
    Channel(ChannelId),
    Dao(DaoId),
}

impl Default for DynamicBagId {
    fn default() -> Self {
        Self::Member(Default::default())
    }
}

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
pub enum StorageBucketOperatorStatus {
    Missing,
    InvitedStorageWorker(WorkerId),
    StorageWorker(WorkerId),
}

impl Default for StorageBucketOperatorStatus {
    fn default() -> Self {
        Self::Missing
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct StorageBucket {
    pub operator_status: StorageBucketOperatorStatus,
    pub accepting_new_bags: bool,
    pub number_of_pending_data_objects: u32,
    pub voucher: Voucher,
}

decl_storage! {
    trait Store for Module<T: Trait> as Storage {
        // === Static bags

        /// Council bag.
        pub CouncilBag get(fn council_bag): StaticBag<BalanceOf<T>>;

        // TODO change the comment
        /// Storage bucket (flat) map
        pub StorageBucketById get (fn storage_bucket_by_id)
            : BTreeMap<StorageBucketId, StorageBucket>;
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
        pub fn upload(origin, params: UploadParameters<T>) {

            Self::validate_upload_parameter(&params)?;
        }

        // ===== Storage Lead actions =====

        /// Create storage bucket.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_storage_bucket(
            origin,
            invite_worker: Option<WorkerId>,
            accepting_new_data_objects: bool,
            voucher: Voucher
        ) {

        }
    }
}

impl<T: Trait> Module<T> {
    // TODO: add comment
    fn validate_upload_parameter(params: &UploadParameters<T>) -> DispatchResult {
        //TODO implement
        Ok(())
    }
}
