//! # Storage module
//! Storage module for the Joystream platform. Version 2.

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

// Do not delete! Cannot be uncommented by default, because of Parity decl_module! issue.
// #![warn(missing_docs)]

// TODO: add static-dynamic bag abstraction (BagManager)
// TODO: Add alias for StaticBag
// TODO: remove all: #[allow(dead_code)]
// TODO: add module comment
// TODO: add types comments
// TODO: add benchmarks
// TODO: add constants:
// Max size of blacklist.
// Max number of distribution bucket families
// Max number of distribution buckets per family.
// Max number of pending invitations per distribution bucket.

#[cfg(test)]
mod tests;

#[cfg(feature = "runtime-benchmarks")]
mod benchmarking;

use codec::{Codec, Decode, Encode};
use frame_support::dispatch::DispatchResult;
use frame_support::traits::{Currency, ExistenceRequirement, Get};
use frame_support::{decl_error, decl_event, decl_module, decl_storage, ensure, Parameter};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_arithmetic::traits::BaseArithmetic;
use sp_arithmetic::traits::One;
use sp_runtime::traits::{AccountIdConversion, MaybeSerialize, Member};
use sp_runtime::{ModuleId, SaturatedConversion};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::iter;
use sp_std::marker::PhantomData;
use sp_std::vec::Vec;

use common::origin::ActorOriginValidator;

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
    type MaxStorageBucketNumber: Get<u64>; //TODO: adjust value

    /// Defines max number of data objects per bag.
    type MaxNumberOfDataObjectsPerBag: Get<u64>; //TODO: adjust value

    /// Defines a prize for a data object deletion.
    type DataObjectDeletionPrize: Get<BalanceOf<Self>>; //TODO: adjust value

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
    fn transfer_from_module_account(
        dest_account_id: &T::AccountId,
        amount: BalanceOf<T>,
    ) -> DispatchResult {
        <Balances<T> as Currency<T::AccountId>>::transfer(
            &Self::module_account_id(),
            dest_account_id,
            amount,
            ExistenceRequirement::AllowDeath,
        )
    }

    /// Transfer tokens from the module account to the destination account (fills module account).
    fn transfer_to_module_account(
        src_account_id: &T::AccountId,
        amount: BalanceOf<T>,
    ) -> DispatchResult {
        <Balances<T> as Currency<T::AccountId>>::transfer(
            src_account_id,
            &Self::module_account_id(),
            amount,
            ExistenceRequirement::AllowDeath,
        )
    }
}

/// Implementation of the StakingHandler.
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

// Alias for the Substrate balances pallet.
type Balances<T> = balances::Module<T>;

/// Alias for the member id.
pub type MemberId<T> = <T as membership::Trait>::MemberId;

/// Type identifier for worker role, which must be same as membership actor identifier
pub type WorkerId<T> = <T as membership::Trait>::ActorId;

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;
//type DistributionBucketId = u64; // TODO: Move to the Trait
// type ChannelId = u64; // Move to the Trait
// type DaoId = u64; // Move to the Trait

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

    /// Content identifier presented as IPFS hash.
    pub ipfs_content_id: Vec<u8>,
}

/// Static bag container.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct StaticBag<DataObjectId: Ord, StorageBucketId: Ord, Balance> {
    /// Associated data objects.
    pub objects: BTreeMap<DataObjectId, DataObject<Balance>>,

    /// Associated storage buckets.
    pub stored_by: BTreeSet<StorageBucketId>,
    //TODO: implement -    pub distributed_by: BTreeSet<DistributionBucketId>,
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

/// Identifier for a bag.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub enum BagId {
    /// Static bag type.
    StaticBag(StaticBagId),
    //TODO: implement -    DynamicBag(DynamicBagId),
}

impl Default for BagId {
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

/// Alias for the UploadParametersObject
pub type UploadParameters<T> = UploadParametersObject<<T as frame_system::Trait>::AccountId>;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct UploadParametersObject<AccountId> {
    /// Public key used authentication in upload to liaison.
    pub authentication_key: Vec<u8>,

    /// Static or dynamic bag to upload data.
    pub bag_id: BagId,

    /// Data object parameters.
    pub object_creation_list: Vec<DataObjectCreationParameters>,

    //TODO: consider removing.
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

/// Data wrapper structure. Helps passing parameters to extrinsics.
/// Defines a 'bag-to-data object' pair.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub struct AssignedDataObject<DataObjectId> {
    /// Bag ID.
    pub bag_id: BagId,

    /// Data object ID.
    pub data_object_id: DataObjectId,
}

/// Data wrapper structure. Helps passing the parameters to the
/// `update_storage_buckets_for_static_bags` extrinsic.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct UpdateStorageBucketForStaticBagsParams<StorageBucketId: Ord> {
    /// Defines new relationship between static bags and storage buckets.
    pub bags: BTreeMap<StaticBagId, BTreeSet<StorageBucketId>>,
}

/// Data wrapper structure. Helps passing the parameters to the
/// `accept_pending_data_objects` extrinsic.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct AcceptPendingDataObjectsParams<DataObjectId: Ord> {
    /// 'Bag' to 'data object' container.
    pub assigned_data_objects: BTreeSet<AssignedDataObject<DataObjectId>>,
}

// Helper-struct for the data object uploading.
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

decl_storage! {
    trait Store for Module<T: Trait> as Storage {
        // === Static bags

        /// Council bag.
        pub CouncilBag get(fn council_bag): StaticBag<T::DataObjectId, T::StorageBucketId, BalanceOf<T>>;

        /// Storage bucket id counter. Starts at zero.
        pub NextStorageBucketId get(fn next_storage_bucket_id): T::StorageBucketId;

        /// Data object id counter. Starts at zero.
        pub NextDataObjectId get(fn next_data_object_id): T::DataObjectId;

        /// Total number of the storage buckets in the system.
        pub StorageBucketsNumber get(fn storage_buckets_number): u64;

        // TODO: rework back to "Storage bucket (flat) map" - BTreemap
        /// Storage buckets.
        pub StorageBucketById get (fn storage_bucket_by_id): map hasher(blake2_128_concat)
            T::StorageBucketId => StorageBucket<WorkerId<T>>;

        // TODO: consider moving it inside the storage bucket
        /// Storage operator metadata.
        pub StorageOperatorMetadata get (fn storage_operator_metadata): map hasher(blake2_128_concat)
            WorkerId<T> => Vec<u8>;
    }
}

decl_event! {
    /// Storage events
 pub enum Event<T>
    where
        <T as Trait>::StorageBucketId,
        WorkerId = WorkerId<T>,
        UpdateStorageBucketForStaticBagsParams =
            UpdateStorageBucketForStaticBagsParams<<T as Trait>::StorageBucketId>,
        <T as Trait>::DataObjectId,
        UploadParameters = UploadParameters<T>,
        AcceptPendingDataObjectsParams = AcceptPendingDataObjectsParams<<T as Trait>::DataObjectId>,
    {
        /// Emits on creating the storage bucket.
        /// Params
        /// - storage bucket ID
        /// - invited worker
        /// - flag "accepting_new_data_objects"
        /// - voucher struct
        StorageBucketCreated(StorageBucketId, Option<WorkerId>, bool, Voucher),

        /// Emits on accepting the storage bucket invitation.
        /// Params
        /// - storage bucket ID
        /// - invited worker ID
        StorageBucketInvitationAccepted(StorageBucketId, WorkerId),

        /// Emits on updating storage buckets for static bags.
        /// Params
        /// - 'static bags-to-storage bucket set' container
        StorageBucketsUpdatedForStaticBags(UpdateStorageBucketForStaticBagsParams),

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
        /// - worker ID (storage provider ID)
        /// - pending data objects
        PendingDataObjectsAccepted(WorkerId, AcceptPendingDataObjectsParams),
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

        /// Cannot accept an invitation: there is no storage bucket invitation.
        NoStorageBucketInvitation,

        /// Cannot accept an invitation: storage provider was already set.
        StorageProviderAlreadySet,

        /// Cannot accept an invitation: another storage provider was invited.
        DifferentStorageProviderInvited,

        /// The parameter structure is empty: UpdateStorageBucketForStaticBagsParams.
        UpdateStorageBucketForStaticBagsParamsIsEmpty,

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

        /// Upload new data objects.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn upload(origin, member_id: T::MemberId, params: UploadParameters<T>) {
            let account_id = T::MemberOriginValidator::ensure_actor_origin(
                origin,
                member_id,
            )?;

            //TODO: is is so?  "a `can_upload` extrinsic is likely going to be needed"

            Self::validate_upload_parameters(&params, account_id)?;

            // TODO: authentication_key

            //
            // == MUTATION SAFE ==
            //

             // TODO: remove the deletion prize

            let mut data = Self::create_data_objects(params.object_creation_list.clone());

            <StorageTreasury<T>>::transfer_to_module_account(
                &params.deletion_prize_source_account_id,
                data.total_deletion_prize
            )?;

            <NextDataObjectId<T>>::put(data.next_data_object_id);

            //TODO: add dynamic bags
            let BagId::StaticBag(static_bag_id) = params.bag_id.clone();

            let mut bag = Self::static_bag(&static_bag_id);

            bag.objects.append(&mut data.data_objects_map);

            Self::save_static_bag(&static_bag_id, bag);

            Self::deposit_event(RawEvent::DataObjectdUploaded(data.data_object_ids, params));
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
            T::ensure_working_group_leader_origin(origin)?;

            let buckets_number = Self::storage_buckets_number();
            ensure!(
                buckets_number < T::MaxStorageBucketNumber::get(),
                Error::<T>::MaxStorageBucketNumberLimitExceeded
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

        //TODO: add comment
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_storage_buckets_for_static_bags(
            origin,
            params: UpdateStorageBucketForStaticBagsParams<T::StorageBucketId>
        ) {
            T::ensure_working_group_leader_origin(origin)?; // TODO: correct authentication?

            ensure!(
                !params.bags.is_empty(),
                Error::<T>::UpdateStorageBucketForStaticBagsParamsIsEmpty
            );

            // TODO: validate bucket existence for each bag?

            //
            // == MUTATION SAFE ==
            //

            for (bag_id, buckets) in params.bags.iter() {
                let mut bag = Self::static_bag(bag_id);

                bag.stored_by = buckets.clone();

                Self::save_static_bag(bag_id, bag);
            }

            Self::deposit_event(RawEvent::StorageBucketsUpdatedForStaticBags(params));
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

            Self::ensure_bucket_invitation_status(&bucket, worker_id)?;

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

            //TODO: validate metadata?

            //
            // == MUTATION SAFE ==
            //

            <StorageOperatorMetadata::<T>>::insert(worker_id, metadata.clone());

            Self::deposit_event(
                RawEvent::StorageOperatorMetadataSet(storage_bucket_id, worker_id, metadata)
            );
        }

        /// A storage provider signals that the data object was successfully uploaded to its storage.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn accept_pending_data_objects(
            origin,
            worker_id: WorkerId<T>,
            params: AcceptPendingDataObjectsParams<T::DataObjectId>
        ) {
            T::ensure_worker_origin(origin, worker_id)?;

            //TODO: // validate objects
            //TODO: // limit objects

            //
            // == MUTATION SAFE ==
            //

            for bag_to_object in params.assigned_data_objects.iter() {
                //TODO: add dynamic bags
                let BagId::StaticBag(static_bag_id) = bag_to_object.bag_id.clone();

                let mut bag = Self::static_bag(&static_bag_id);

                let data_object = bag.objects.get_mut(&bag_to_object.data_object_id);

                if let Some(data_object) = data_object {
                    data_object.accepted = true;
                }

                Self::save_static_bag(&static_bag_id, bag);
            }

            Self::deposit_event(RawEvent::PendingDataObjectsAccepted(worker_id, params));
        }
    }
}

impl<T: Trait> Module<T> {
    // Validates upload parameters.
    fn validate_upload_parameters(
        params: &UploadParameters<T>,
        account_id: T::AccountId,
    ) -> DispatchResult {
        //TODO: add dynamic bags
        let BagId::StaticBag(static_bag_id) = params.bag_id.clone();
        let bag = Self::static_bag(&static_bag_id);

        let new_objects_number = params.object_creation_list.len();

        let total_possible_data_objects_number: u64 =
            (new_objects_number + bag.objects.len()).saturated_into();

        ensure!(
            total_possible_data_objects_number <= T::MaxNumberOfDataObjectsPerBag::get(),
            Error::<T>::DataObjectsPerBagLimitExceeded
        );

        ensure!(
            !params.object_creation_list.is_empty(),
            Error::<T>::NoObjectsOnUpload
        );

        //TODO: Redundant check. Use Account_id directly.
        ensure!(
            params.deletion_prize_source_account_id == account_id,
            Error::<T>::InvalidDeletionPrizeSourceAccount
        );

        for object_params in params.object_creation_list.iter() {
            // TODO: Check for duplicates for CID?
            ensure!(
                !object_params.ipfs_content_id.is_empty(),
                Error::<T>::EmptyContentId
            );
            ensure!(object_params.size != 0, Error::<T>::ZeroObjectSize);
        }

        let total_deletion_prize: BalanceOf<T> =
            new_objects_number.saturated_into::<BalanceOf<T>>() * T::DataObjectDeletionPrize::get();

        ensure!(
            Balances::<T>::usable_balance(account_id) >= total_deletion_prize,
            Error::<T>::InsufficientBalance
        );

        Ok(())
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

    // Ensures the correct invitation for the storage bucket and storage provider.
    fn ensure_bucket_invitation_status(
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

    // Ensures correct storage provider for the storage bucket.
    fn ensure_bucket_invitation_accepted(
        bucket: &StorageBucket<WorkerId<T>>,
        worker_id: WorkerId<T>,
    ) -> DispatchResult {
        match bucket.operator_status {
            StorageBucketOperatorStatus::Missing => Err(Error::<T>::InvalidStorageProvider.into()),
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
    fn static_bag(
        bag_id: &StaticBagId,
    ) -> StaticBag<T::DataObjectId, T::StorageBucketId, BalanceOf<T>> {
        match bag_id {
            StaticBagId::Council => Self::council_bag(),
        }
    }

    // Save static bag to the storage
    fn save_static_bag(
        bag_id: &StaticBagId,
        bag: StaticBag<T::DataObjectId, T::StorageBucketId, BalanceOf<T>>,
    ) {
        match bag_id {
            StaticBagId::Council => CouncilBag::<T>::put(bag),
        }
    }

    // Create data objects from the creation data.
    fn create_data_objects(
        object_creation_list: Vec<DataObjectCreationParameters>,
    ) -> DataObjectCandidates<T> {
        let deletion_prize: BalanceOf<T> = Default::default(); //TODO

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

        let total_deletion_prize: BalanceOf<T> =
            data_objects.len().saturated_into::<BalanceOf<T>>() * T::DataObjectDeletionPrize::get();

        let data_objects_map = ids.zip(data_objects).collect::<BTreeMap<_, _>>();
        let data_object_ids = data_objects_map.keys().cloned().collect();

        DataObjectCandidates {
            next_data_object_id,
            data_objects_map,
            data_object_ids,
            total_deletion_prize,
        }
    }
}
