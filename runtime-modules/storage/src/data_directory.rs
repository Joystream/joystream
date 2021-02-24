//! # Data directory module
//! Data directory module for the Joystream platform manages IPFS content id, storage providers,
//! owners of the content. It allows to add and accept or reject the content in the system.
//!
//! ## Comments
//!
//! Data object type registry module uses  working group module to authorize actions.
//!
//! ## Supported extrinsics
//!
//! ### Public extrinsic
//! - [add_content](./struct.Module.html#method.add_content) - Adds the content to the system.
//!
//! ### Private extrinsics
//! - accept_content - Storage provider accepts a content.
//! - reject_content - Storage provider rejects a content.
//! - remove_known_content_id - Removes the content id from the list of known content ids. Requires root privileges.
//! - set_known_content_id - Sets the content id from the list of known content ids. Requires root privileges.
//!

// Do not delete! Cannot be uncommented by default, because of Parity decl_module! issue.
//#![warn(missing_docs)]

use codec::{Decode, Encode};
use frame_support::dispatch::DispatchResult;
use frame_support::{decl_error, decl_event, decl_module, decl_storage, ensure};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::vec::Vec;
use system::ensure_root;

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use common::origin::ActorOriginValidator;
pub use common::storage::{ContentParameters, StorageObjectOwner};
pub(crate) use common::BlockAndTime;

use crate::data_object_type_registry;
use crate::data_object_type_registry::IsActiveDataObjectType;
use crate::*;

pub const DEFAULT_VOUCHER_SIZE_LIMIT_UPPER_BOUND: u64 = 100000000;
pub const DEFAULT_VOUCHER_OBJECTS_LIMIT_UPPER_BOUND: u64 = 200;
pub const DEFAULT_GLOBAL_VOUCHER: Voucher = Voucher::new(200000000, 2000);
pub const DEFAULT_VOUCHER: Voucher = Voucher::new(5000000, 100);
pub const DEFAULT_UPLOADING_BLOCKED_STATUS: bool = false;

/// The _Data directory_ main _Trait_.
pub trait Trait:
    pallet_timestamp::Trait
    + system::Trait
    + data_object_type_registry::Trait
    + membership::Trait
    + working_group::Trait<StorageWorkingGroupInstance>
    + common::MembershipTypes
    + common::StorageOwnership
{
    /// _Data directory_ event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// Provides random storage provider id.
    type StorageProviderHelper: StorageProviderHelper<Self>;

    /// Active data object type validator.
    type IsActiveDataObjectType: data_object_type_registry::IsActiveDataObjectType<Self>;

    /// Validates member id and origin combination.
    type MemberOriginValidator: ActorOriginValidator<Self::Origin, MemberId<Self>, Self::AccountId>;
}

decl_error! {
    /// _Data object storage registry_ module predefined errors.
    pub enum Error for Module<T: Trait>{
        /// Content with this ID not found.
        CidNotFound,

        /// Only the liaison for the content may modify its status.
        LiaisonRequired,

        /// Cannot create content for inactive or missing data object type.
        DataObjectTypeMustBeActive,

        /// "Data object already added under this content id".
        DataObjectAlreadyAdded,

        /// Require root origin in extrinsics.
        RequireRootOrigin,

        /// DataObject Injection Failed. Too Many DataObjects.
        DataObjectsInjectionExceededLimit,

        /// Contant uploading failed. Actor voucher objects limit exceeded.
        VoucherObjectsLimitExceeded,

        /// Contant uploading failed. Actor voucher size limit exceeded.
        VoucherSizeLimitExceeded,

        /// Voucher size limit upper bound exceeded
        VoucherSizeLimitUpperBoundExceeded,

        /// Voucher objects limit upper bound exceeded
        VoucherObjectsLimitUpperBoundExceeded,

        /// Contant uploading failed. Actor voucher size limit exceeded.
        GlobalVoucherSizeLimitExceeded,

        /// Contant uploading failed. Actor voucher objects limit exceeded.
        GlobalVoucherObjectsLimitExceeded,

        /// Content uploading blocked.
        ContentUploadingBlocked,

        /// Provided owner should be equal o the data object owner under given content id
        OwnersAreNotEqual,

        /// No storage provider available to service the request
        NoProviderAvailable
    }
}

/// The decision of the storage provider when it acts as liaison.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Clone, Encode, Decode, PartialEq, Debug)]
pub enum LiaisonJudgement {
    /// Content awaits for a judgment.
    Pending,

    /// Content accepted.
    Accepted,

    /// Content rejected.
    Rejected,
}

impl Default for LiaisonJudgement {
    fn default() -> Self {
        LiaisonJudgement::Pending
    }
}

/// Alias for DataObjectInternal
pub type DataObject<T> = DataObjectInternal<
    MemberId<T>,
    ChannelId<T>,
    DAOId<T>,
    <T as system::Trait>::BlockNumber,
    <T as pallet_timestamp::Trait>::Moment,
    DataObjectTypeId<T>,
    StorageProviderId<T>,
>;

/// Manages content ids, type and storage provider decision about it.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Clone, Encode, Decode, PartialEq, Debug, Default)]
pub struct DataObjectInternal<
    MemberId,
    ChannelId,
    DAOId,
    BlockNumber,
    Moment,
    DataObjectTypeId,
    StorageProviderId,
> {
    /// Content owner.
    pub owner: StorageObjectOwner<MemberId, ChannelId, DAOId>,

    /// Content added at.
    pub added_at: BlockAndTime<BlockNumber, Moment>,

    /// Content type id.
    pub type_id: DataObjectTypeId,

    /// Content size in bytes.
    pub size: u64,

    /// Storage provider id of the liaison.
    pub liaison: StorageProviderId,

    /// Storage provider as liaison judgment.
    pub liaison_judgement: LiaisonJudgement,

    /// IPFS content id.
    pub ipfs_content_id: Vec<u8>,
}

#[derive(Clone, Copy)]
pub struct Delta {
    pub size: u64,
    pub objects: u64,
}

/// Uploading voucher for StorageObjectOwner
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Clone, Copy, Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct Voucher {
    // Total objects size limit per StorageObjectOwner
    pub size_limit: u64,
    // Total objects number limit per StorageObjectOwner
    pub objects_limit: u64,
    pub size_used: u64,
    pub objects_used: u64,
}

impl Voucher {
    /// Create new voucher with provided size & objects limits
    pub const fn new(size_limit: u64, objects_limit: u64) -> Self {
        Self {
            size_limit,
            objects_limit,
            size_used: 0,
            objects_used: 0,
        }
    }

    /// Calculate voucher delta
    pub fn calculate_delta(&self) -> Delta {
        Delta {
            size: self.size_limit - self.size_used,
            objects: self.objects_limit - self.objects_used,
        }
    }

    pub fn fill_voucher(self, voucher_delta: Delta) -> Self {
        Self {
            size_used: self.size_used + voucher_delta.size,
            objects_used: self.objects_used + voucher_delta.objects,
            ..self
        }
    }

    pub fn release_voucher(self, voucher_delta: Delta) -> Self {
        Self {
            size_used: self.size_used - voucher_delta.size,
            objects_used: self.objects_used - voucher_delta.objects,
            ..self
        }
    }

    pub fn set_new_size_limit(&mut self, new_size_limit: u64) {
        self.size_limit = new_size_limit;
    }

    pub fn set_new_objects_limit(&mut self, new_objects_limit: u64) {
        self.objects_limit = new_objects_limit;
    }
}

/// A map collection of unique DataObjects keyed by the ContentId
pub type DataObjectsMap<T> = BTreeMap<ContentId<T>, DataObject<T>>;

decl_storage! {
    trait Store for Module<T: Trait> as DataDirectory {

        /// Maps data objects by their content id.
        pub DataByContentId get(fn data_object_by_content_id) config():
            map hasher(blake2_128_concat) T::ContentId => DataObject<T>;

        /// Maps storage owner to it`s voucher. Created when the first upload by the new actor occured.
        pub Vouchers get(fn vouchers) config():
            map hasher(blake2_128_concat) ObjectOwner<T> => Voucher;

        /// Upper bound for the Voucher size limit.
        pub VoucherSizeLimitUpperBound get(fn voucher_size_limit_upper_bound) config(): u64 = DEFAULT_VOUCHER_SIZE_LIMIT_UPPER_BOUND;

        /// Upper bound for the Voucher objects number limit.
        pub VoucherObjectsLimitUpperBound get(fn voucher_objects_limit_upper_bound) config(): u64 = DEFAULT_VOUCHER_OBJECTS_LIMIT_UPPER_BOUND;

        /// Default content voucher for all actors.
        pub DefaultVoucher get(fn default_voucher) config(): Voucher;

        /// Global voucher.
        pub GlobalVoucher get(fn global_voucher) config(): Voucher = DEFAULT_GLOBAL_VOUCHER;

        /// If all new uploads blocked
        pub UploadingBlocked get(fn uploading_blocked) config(): bool = DEFAULT_UPLOADING_BLOCKED_STATUS;

    }
}

decl_event! {
    /// _Data directory_ events
    pub enum Event<T> where
        StorageObjectOwner = ObjectOwner<T>,
        StorageProviderId = StorageProviderId<T>,
        ContentId = ContentId<T>,
        ContentParameters = ContentParameters<ContentId<T>, DataObjectTypeId<T>>,
        VoucherLimit = u64,
        UploadingStatus = bool
    {
        /// Emits on adding of the content.
        /// Params:
        /// - Content parameters representation.
        /// - StorageObjectOwner enum.
        ContentAdded(Vec<ContentParameters>, StorageObjectOwner),

        /// Emits on content removal.
        /// Params:
        /// - Content parameters representation.
        /// - StorageObjectOwner enum.
        ContentRemoved(Vec<ContentId>, StorageObjectOwner),

        /// Emits when the storage provider accepts a content.
        /// Params:
        /// - Id of the relationship.
        /// - Id of the storage provider.
        ContentAccepted(ContentId, StorageProviderId),

        /// Emits when the storage provider rejects a content.
        /// Params:
        /// - Id of the relationship.
        /// - Id of the storage provider.
        ContentRejected(ContentId, StorageProviderId),

        /// Emits when the storage object owner voucher size limit update performed.
        /// Params:
        /// - StorageObjectOwner enum.
        /// - voucher size limit.
        StorageObjectOwnerVoucherSizeLimitUpdated(StorageObjectOwner, VoucherLimit),

        /// Emits when the storage object owner voucher objects limit update performed.
        /// Params:
        /// - StorageObjectOwner enum.
        /// - voucher objects limit.
        StorageObjectOwnerVoucherObjectsLimitUpdated(StorageObjectOwner, VoucherLimit),

        /// Emits when the content uploading status update performed.
        /// Params:
        /// - UploadingStatus bool flag.
        ContentUploadingStatusUpdated(UploadingStatus),
    }
}

decl_module! {
    /// _Data directory_ substrate module.
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Default deposit_event() handler
        fn deposit_event() = default;

        /// Predefined errors.
        type Error = Error<T>;

        /// Adds the content to the system. The created DataObject
        /// awaits liaison to accept or reject it.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn add_content(
            origin,
            owner: ObjectOwner<T>,
            content: Vec<ContentParameters<ContentId<T>, DataObjectTypeId<T>>>
        ) {

            // Ensure given origin can perform operation under specific storage object owner
            Self::ensure_storage_object_owner_origin(origin, &owner)?;

            Self::ensure_uploading_is_not_blocked()?;

            Self::ensure_content_is_valid(&content)?;

            let owner_voucher = Self::get_voucher(&owner);

            // Ensure owner voucher constraints satisfied.
            // Calculate upload voucher delta
            let upload_voucher_delta = Self::ensure_owner_voucher_constraints_satisfied(owner_voucher, &content)?;

            // Ensure global voucher constraints satisfied.
            Self::ensure_global_voucher_constraints_satisfied(upload_voucher_delta)?;

            let liaison = T::StorageProviderHelper::get_random_storage_provider()?;

            //
            // == MUTATION SAFE ==
            //

            // Let's create the entry then
            Self::upload_content(owner_voucher, upload_voucher_delta, liaison, content.clone(), owner.clone());

            Self::deposit_event(RawEvent::ContentAdded(content, owner));
        }

        /// Remove the content from the system.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn remove_content(
            origin,
            owner: ObjectOwner<T>,
            content_ids: Vec<ContentId<T>>
        ) {

            // Ensure given origin can perform operation under specific storage object owner
            Self::ensure_storage_object_owner_origin(origin, &owner)?;

            // Ensure content under given content ids can be successfully removed
            let content = Self::ensure_content_can_be_removed(&content_ids, &owner)?;

            //
            // == MUTATION SAFE ==
            //

            // Let's remove a content
            Self::delete_content(&owner, &content_ids, content);

            Self::deposit_event(RawEvent::ContentRemoved(content_ids, owner));
        }

        /// Updates storage object owner voucher objects limit. Requires leader privileges.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_storage_object_owner_voucher_objects_limit(
            origin,
            abstract_owner: ObjectOwner<T>,
            new_voucher_objects_limit: u64
        ) {
            <StorageWorkingGroup<T>>::ensure_origin_is_active_leader(origin)?;
            ensure!(new_voucher_objects_limit <= Self::voucher_objects_limit_upper_bound(), Error::<T>::VoucherObjectsLimitUpperBoundExceeded);

            //
            // == MUTATION SAFE ==
            //

            if <Vouchers<T>>::contains_key(&abstract_owner) {
                <Vouchers<T>>::mutate(&abstract_owner, |voucher| {
                    voucher.set_new_objects_limit(new_voucher_objects_limit);
                });
            } else {
                let mut voucher = Self::default_voucher();
                voucher.set_new_objects_limit(new_voucher_objects_limit);
                <Vouchers<T>>::insert(&abstract_owner, voucher);
            };

            Self::deposit_event(RawEvent::StorageObjectOwnerVoucherObjectsLimitUpdated(abstract_owner, new_voucher_objects_limit));
        }

        /// Updates storage object owner voucher size limit. Requires leader privileges.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_storage_object_owner_voucher_size_limit(
            origin,
            abstract_owner: ObjectOwner<T>,
            new_voucher_size_limit: u64
        ) {
            <StorageWorkingGroup<T>>::ensure_origin_is_active_leader(origin)?;
            ensure!(new_voucher_size_limit <= Self::voucher_size_limit_upper_bound(), Error::<T>::VoucherSizeLimitUpperBoundExceeded);

            //
            // == MUTATION SAFE ==
            //

            if <Vouchers<T>>::contains_key(&abstract_owner) {
                <Vouchers<T>>::mutate(&abstract_owner, |voucher| {
                    voucher.set_new_size_limit(new_voucher_size_limit);
                });
            } else {
                let mut voucher = Self::default_voucher();
                voucher.set_new_size_limit(new_voucher_size_limit);
                <Vouchers<T>>::insert(&abstract_owner, voucher);
            };

            Self::deposit_event(RawEvent::StorageObjectOwnerVoucherSizeLimitUpdated(abstract_owner, new_voucher_size_limit));
        }

        /// Storage provider accepts a content. Requires signed storage provider account and its id.
        /// The LiaisonJudgement can be updated, but only by the liaison.
        #[weight = 10_000_000] // TODO: adjust weight
        pub(crate) fn accept_content(
            origin,
            storage_provider_id: StorageProviderId<T>,
            content_id: T::ContentId
        ) {
            <StorageWorkingGroup<T>>::ensure_worker_signed(origin, &storage_provider_id)?;

            // == MUTATION SAFE ==

            Self::update_content_judgement(&storage_provider_id, content_id, LiaisonJudgement::Accepted)?;

            Self::deposit_event(RawEvent::ContentAccepted(content_id, storage_provider_id));
        }

        /// Storage provider rejects a content. Requires signed storage provider account and its id.
        /// The LiaisonJudgement can be updated, but only by the liaison.
        #[weight = 10_000_000] // TODO: adjust weight
        pub(crate) fn reject_content(
            origin,
            storage_provider_id: StorageProviderId<T>,
            content_id: T::ContentId
        ) {
            <StorageWorkingGroup<T>>::ensure_worker_signed(origin, &storage_provider_id)?;

            // == MUTATION SAFE ==

            Self::update_content_judgement(&storage_provider_id, content_id, LiaisonJudgement::Rejected)?;
            Self::deposit_event(RawEvent::ContentRejected(content_id, storage_provider_id));
        }

        /// Locks / unlocks content uploading
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_content_uploading_status(origin, is_blocked: bool) {
            <StorageWorkingGroup<T>>::ensure_origin_is_active_leader(origin)?;

            // == MUTATION SAFE ==

            <UploadingBlocked>::put(is_blocked);
            Self::deposit_event(RawEvent::ContentUploadingStatusUpdated(is_blocked));
        }
    }
}

impl<T: Trait> Module<T> {
    // Used to initialize data_directory runtime storage on runtime upgrade
    pub fn initialize_data_directory(
        vouchers: Vec<(ObjectOwner<T>, Voucher)>,
        voucher_size_limit_upper_bound: u64,
        voucher_objects_limit_upper_bound: u64,
        global_voucher: Voucher,
        default_voucher: Voucher,
        uploading_blocked: bool,
    ) {
        for (storage_object_owner, voucher) in vouchers {
            <Vouchers<T>>::insert(storage_object_owner, voucher);
        }

        <VoucherSizeLimitUpperBound>::put(voucher_size_limit_upper_bound);
        <VoucherObjectsLimitUpperBound>::put(voucher_objects_limit_upper_bound);
        <GlobalVoucher>::put(global_voucher);
        <DefaultVoucher>::put(default_voucher);
        <UploadingBlocked>::put(uploading_blocked);
    }

    // Ensure given origin can perform operation under specific storage object owner
    fn ensure_storage_object_owner_origin(
        origin: T::Origin,
        owner: &ObjectOwner<T>,
    ) -> DispatchResult {
        if let StorageObjectOwner::Member(member_id) = owner {
            T::MemberOriginValidator::ensure_actor_origin(origin, *member_id)?;
        } else {
            ensure_root(origin)?;
        };
        Ok(())
    }

    // Get owner voucher if exists, otherwise return default one.
    fn get_voucher(owner: &ObjectOwner<T>) -> Voucher {
        if <Vouchers<T>>::contains_key(owner) {
            Self::vouchers(owner)
        } else {
            Self::default_voucher()
        }
    }

    // Ensure content uploading is not blocked
    fn ensure_uploading_is_not_blocked() -> DispatchResult {
        ensure!(
            !Self::uploading_blocked(),
            Error::<T>::ContentUploadingBlocked
        );
        Ok(())
    }

    // Ensure owner voucher constraints satisfied, returns total object length and total size voucher delta for this upload.
    fn ensure_owner_voucher_constraints_satisfied(
        owner_voucher: Voucher,
        content: &[ContentParameters<T::ContentId, DataObjectTypeId<T>>],
    ) -> Result<Delta, Error<T>> {
        let owner_voucher_delta = owner_voucher.calculate_delta();

        // Ensure total content length is less or equal then available per given owner voucher
        let content_length = content.len() as u64;

        ensure!(
            owner_voucher_delta.objects >= content_length,
            Error::<T>::VoucherObjectsLimitExceeded
        );

        // Ensure total content size is less or equal then available per given owner voucher
        let content_size = content
            .iter()
            .fold(0, |total_size, content| total_size + content.size);

        ensure!(
            owner_voucher_delta.size >= content_size,
            Error::<T>::VoucherSizeLimitExceeded
        );

        Ok(Delta {
            size: content_size,
            objects: content_length,
        })
    }

    // Ensure content under given content ids can be successfully removed
    fn ensure_content_can_be_removed(
        content_ids: &[T::ContentId],
        owner: &ObjectOwner<T>,
    ) -> Result<Vec<DataObject<T>>, Error<T>> {
        let mut content = Vec::new();
        for content_id in content_ids {
            let data_object = Self::get_data_object(content_id)?;
            ensure!(data_object.owner == *owner, Error::<T>::OwnersAreNotEqual);
            content.push(data_object);
        }

        Ok(content)
    }

    // Calculates content voucher delta
    fn calculate_content_voucher(content: Vec<DataObject<T>>) -> Delta {
        let content_length = content.len() as u64;

        let content_size = content
            .into_iter()
            .fold(0, |total_size, content| total_size + content.size);

        Delta {
            size: content_size,
            objects: content_length,
        }
    }

    // Ensures global voucher constraints satisfied.
    fn ensure_global_voucher_constraints_satisfied(upload_voucher_delta: Delta) -> DispatchResult {
        let global_voucher_voucher = Self::global_voucher().calculate_delta();

        ensure!(
            global_voucher_voucher.objects >= upload_voucher_delta.objects,
            Error::<T>::GlobalVoucherObjectsLimitExceeded
        );

        ensure!(
            global_voucher_voucher.size >= upload_voucher_delta.size,
            Error::<T>::GlobalVoucherSizeLimitExceeded
        );

        Ok(())
    }

    // Complete content upload, update vouchers
    fn upload_content(
        owner_voucher: Voucher,
        upload_voucher_delta: Delta,
        liaison: StorageProviderId<T>,
        multi_content: Vec<ContentParameters<T::ContentId, DataObjectTypeId<T>>>,
        owner: ObjectOwner<T>,
    ) {
        for content in multi_content {
            let data: DataObject<T> = DataObjectInternal {
                type_id: content.type_id,
                size: content.size,
                added_at: common::current_block_time::<T>(),
                owner: owner.clone(),
                liaison,
                liaison_judgement: LiaisonJudgement::Pending,
                ipfs_content_id: content.ipfs_content_id,
            };

            <DataByContentId<T>>::insert(content.content_id, data);
        }

        // Updade or create owner voucher.
        <Vouchers<T>>::insert(owner, owner_voucher.fill_voucher(upload_voucher_delta));

        // Update global voucher
        <GlobalVoucher>::put(Self::global_voucher().fill_voucher(upload_voucher_delta));
    }

    // Complete content removal
    fn delete_content(
        owner: &ObjectOwner<T>,
        content_ids: &[T::ContentId],
        content: Vec<DataObject<T>>,
    ) {
        let removal_voucher = Self::calculate_content_voucher(content);

        for content_id in content_ids {
            <DataByContentId<T>>::remove(content_id);
        }

        // Updade owner voucher.
        <Vouchers<T>>::mutate(owner, |owner_voucher| {
            owner_voucher.release_voucher(removal_voucher)
        });

        // Update global voucher
        <GlobalVoucher>::put(Self::global_voucher().release_voucher(removal_voucher));
    }

    fn ensure_content_is_valid(
        multi_content: &[ContentParameters<T::ContentId, DataObjectTypeId<T>>],
    ) -> DispatchResult {
        for content in multi_content {
            ensure!(
                T::IsActiveDataObjectType::is_active_data_object_type(&content.type_id),
                Error::<T>::DataObjectTypeMustBeActive
            );

            ensure!(
                !<DataByContentId<T>>::contains_key(&content.content_id),
                Error::<T>::DataObjectAlreadyAdded
            );
        }
        Ok(())
    }

    fn update_content_judgement(
        storage_provider_id: &StorageProviderId<T>,
        content_id: T::ContentId,
        judgement: LiaisonJudgement,
    ) -> DispatchResult {
        let mut data = Self::get_data_object(&content_id)?;

        // Make sure the liaison matches
        ensure!(
            data.liaison == *storage_provider_id,
            Error::<T>::LiaisonRequired
        );

        data.liaison_judgement = judgement;
        <DataByContentId<T>>::insert(content_id, data);

        Ok(())
    }
}

/// Provides random storage provider id. We use it when assign the content to the storage provider.
pub trait StorageProviderHelper<T: Trait> {
    /// Provides random storage provider id.
    fn get_random_storage_provider() -> Result<StorageProviderId<T>, Error<T>>;
}

/// Content access helper.
pub trait ContentIdExists<T: Trait> {
    /// Verifies the content existence.
    fn has_content(id: &T::ContentId) -> bool;

    /// Returns the data object for the provided content id.
    fn get_data_object(id: &T::ContentId) -> Result<DataObject<T>, Error<T>>;
}

impl<T: Trait> ContentIdExists<T> for Module<T> {
    fn has_content(content_id: &T::ContentId) -> bool {
        <DataByContentId<T>>::contains_key(content_id)
    }

    fn get_data_object(content_id: &T::ContentId) -> Result<DataObject<T>, Error<T>> {
        if Self::has_content(content_id) {
            Ok(Self::data_object_by_content_id(*content_id))
        } else {
            Err(Error::<T>::CidNotFound)
        }
    }
}

impl<T: Trait> common::storage::StorageSystem<T> for Module<T> {
    fn atomically_add_content(
        owner: ObjectOwner<T>,
        content: Vec<ContentParameters<T::ContentId, DataObjectTypeId<T>>>,
    ) -> DispatchResult {
        Self::ensure_content_is_valid(&content)?;

        Self::ensure_uploading_is_not_blocked()?;

        let owner_voucher = Self::get_voucher(&owner);

        // Ensure owner voucher constraints satisfied.
        // Calculate upload voucher
        let upload_voucher =
            Self::ensure_owner_voucher_constraints_satisfied(owner_voucher, &content)?;

        // Ensure global voucher constraints satisfied.
        Self::ensure_global_voucher_constraints_satisfied(upload_voucher)?;

        let liaison = T::StorageProviderHelper::get_random_storage_provider()?;

        //
        // == MUTATION SAFE ==
        //

        // Let's create the entry then

        Self::upload_content(owner_voucher, upload_voucher, liaison, content, owner);
        Ok(())
    }

    fn atomically_remove_content(
        owner: &ObjectOwner<T>,
        content_ids: &[T::ContentId],
    ) -> DispatchResult {
        // Ensure content under given content ids can be successfully removed
        let content = Self::ensure_content_can_be_removed(content_ids, owner)?;

        //
        // == MUTATION SAFE ==
        //

        // Let's remove a content
        Self::delete_content(owner, content_ids, content);
        Ok(())
    }

    fn can_add_content(
        owner: ObjectOwner<T>,
        content: Vec<ContentParameters<T::ContentId, DataObjectTypeId<T>>>,
    ) -> DispatchResult {
        Self::ensure_uploading_is_not_blocked()?;

        T::StorageProviderHelper::get_random_storage_provider()?;
        let owner_voucher = Self::get_voucher(&owner);

        // Ensure owner voucher constraints satisfied.
        Self::ensure_owner_voucher_constraints_satisfied(owner_voucher, &content)?;
        Self::ensure_content_is_valid(&content)
    }

    fn can_remove_content(owner: &ObjectOwner<T>, content_ids: &[ContentId<T>]) -> DispatchResult {
        // Ensure content under given content ids can be successfully removed
        Self::ensure_content_can_be_removed(content_ids, &owner)?;

        Ok(())
    }
}
