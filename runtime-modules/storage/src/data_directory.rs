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
use frame_support::traits::Get;
use frame_support::{decl_error, decl_event, decl_module, decl_storage, ensure};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::vec::Vec;
use system::ensure_root;

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use common::origin::ActorOriginValidator;
pub use common::storage::{AbstractStorageObjectOwner, ContentParameters, StorageObjectOwner};
pub(crate) use common::BlockAndTime;

use crate::data_object_type_registry;
use crate::data_object_type_registry::IsActiveDataObjectType;
use crate::*;

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

    type MaxObjectsPerInjection: Get<u32>;

    /// Default content quota for all actors.
    type DefaultQuota: Get<Quota>;
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

        /// Contant uploading failed. Actor quota objects limit exceeded.
        QuotaObjectsLimitExceeded,

        /// Contant uploading failed. Actor quota size limit exceeded.
        QuotaSizeLimitExceeded,

        /// Quota size limit upper bound exceeded
        QuotaSizeLimitUpperBoundExceeded,

        /// Quota objects limit upper bound exceeded
        QuotaObjectsLimitUpperBoundExceeded,

        /// Contant uploading failed. Actor quota size limit exceeded.
        GlobalQuotaSizeLimitExceeded,

        /// Contant uploading failed. Actor quota objects limit exceeded.
        GlobalQuotaObjectsLimitExceeded,
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
#[derive(Clone, Encode, Decode, PartialEq, Debug)]
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

/// Uploading quota for StorageObjectOwner
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Clone, Copy, Encode, Decode, PartialEq, Eq, Debug, Default)]
pub struct Quota {
    // Total objects size limit per StorageObjectOwner
    pub size_limit: u64,
    // Total objects number limit per StorageObjectOwner
    pub objects_limit: u64,
    pub size_used: u64,
    pub objects_used: u64,
}

impl Quota {
    /// Create new quota with provided size & objects limits
    pub const fn new(size_limit: u64, objects_limit: u64) -> Self {
        Self {
            size_limit,
            objects_limit,
            size_used: 0,
            objects_used: 0,
        }
    }

    /// Calculate free quota
    pub fn calculate_delta(&self) -> Delta {
        Delta {
            size: self.size_limit - self.size_used,
            objects: self.objects_limit - self.objects_used,
        }
    }

    pub fn fill_quota(self, delta: Delta) -> Self {
        Self {
            size_used: self.size_used + delta.size,
            objects_used: self.objects_used + delta.objects,
            ..self
        }
    }

    pub fn release_quota(self, delta: Delta) -> Self {
        Self {
            size_used: self.size_used - delta.size,
            objects_used: self.objects_used - delta.objects,
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
        /// List of ids known to the system.
        pub KnownContentIds get(fn known_content_ids) config(): Vec<ContentId<T>> = Vec::new();

        /// Maps data objects by their content id.
        pub DataObjectByContentId get(fn data_object_by_content_id) config():
            map hasher(blake2_128_concat) T::ContentId => Option<DataObject<T>>;

        /// Maps storage owner to it`s quota. Created when the first upload by the new actor occured.
        pub Quotas get(fn quotas) config():
            map hasher(blake2_128_concat) StorageObjectOwner<MemberId<T>, ChannelId<T>, DAOId<T>> => Quota;

        /// Upper bound for the Quota size limit.
        pub QuotaSizeLimitUpperBound get(fn quota_size_limit_upper_bound) config(): u64;

        /// Upper bound for the Quota objects number limit.
        pub QuotaObjectsLimitUpperBound get(fn quota_objects_limit_upper_bound) config(): u64;

        /// Global quota.
        pub GlobalQuota get(fn global_quota) config(): Quota;
    }
}

decl_event! {
    /// _Data directory_ events
    pub enum Event<T> where
        StorageObjectOwner = StorageObjectOwner<MemberId<T>, ChannelId<T>, DAOId<T>>,
        StorageProviderId = StorageProviderId<T>,
        Content = Vec<ContentParameters<ContentId<T>, DataObjectTypeId<T>>>,
        ContentId = ContentId<T>,
        QuotaLimit = u64
    {
        /// Emits on adding of the content.
        /// Params:
        /// - Content parameters representation.
        /// - StorageObjectOwner enum.
        ContentAdded(Content, StorageObjectOwner),

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

        /// Emits when the storage object owner quota size limit update performed.
        /// Params:
        /// - StorageObjectOwner enum.
        /// - quota size limit.
        StorageObjectOwnerQuotaSizeLimitUpdated(StorageObjectOwner, QuotaLimit),

        /// Emits when the storage object owner quota objects limit update performed.
        /// Params:
        /// - StorageObjectOwner enum.
        /// - quota objects limit.
        StorageObjectOwnerQuotaObjectsLimitUpdated(StorageObjectOwner, QuotaLimit),
    }
}

decl_module! {
    /// _Data directory_ substrate module.
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Default deposit_event() handler
        fn deposit_event() = default;

        /// Predefined errors.
        type Error = Error<T>;

        /// Maximum objects allowed per inject_data_objects() transaction
        const MaxObjectsPerInjection: u32 = T::MaxObjectsPerInjection::get();

        /// Adds the content to the system. Member id should match its origin. The created DataObject
        /// awaits liaison to accept or reject it.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn add_content_as_member(
            origin,
            member_id: MemberId<T>,
            content: Vec<ContentParameters<T::ContentId, DataObjectTypeId<T>>>
        ) {
            T::MemberOriginValidator::ensure_actor_origin(
                origin,
                member_id,
            )?;

            Self::ensure_content_is_valid(&content)?;

            let owner = StorageObjectOwner::Member(member_id);

            let owner_quota = Self::get_quota(&owner);

            // Ensure owner quota constraints satisfied.
            // Calculate upload delta
            let upload_delta = Self::ensure_owner_quota_constraints_satisfied(owner_quota, &content)?;

            // Ensure global quota constraints satisfied.
            Self::ensure_global_quota_constraints_satisfied(upload_delta)?;

            let liaison = T::StorageProviderHelper::get_random_storage_provider()?;

            //
            // == MUTATION SAFE ==
            //

            // Let's create the entry then
            Self::upload_content(owner_quota, upload_delta, liaison, content.clone(), owner.clone());

            Self::deposit_event(RawEvent::ContentAdded(content, owner));
        }

        /// Adds the content to the system. Requires root privileges. The created DataObject
        /// awaits liaison to accept or reject it.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn add_content(
            origin,
            abstract_owner: AbstractStorageObjectOwner<ChannelId<T>, DAOId<T>>,
            content: Vec<ContentParameters<ContentId<T>, DataObjectTypeId<T>>>
        ) {
            ensure_root(origin)?;

            Self::ensure_content_is_valid(&content)?;

            let owner = StorageObjectOwner::AbstractStorageObjectOwner(abstract_owner);

            let owner_quota = Self::get_quota(&owner);

            // Ensure owner quota constraints satisfied.
            // Calculate upload delta
            let upload_delta = Self::ensure_owner_quota_constraints_satisfied(owner_quota, &content)?;

            // Ensure global quota constraints satisfied.
            Self::ensure_global_quota_constraints_satisfied(upload_delta)?;

            let liaison = T::StorageProviderHelper::get_random_storage_provider()?;

            //
            // == MUTATION SAFE ==
            //

            // Let's create the entry then
            Self::upload_content(owner_quota, upload_delta, liaison, content.clone(), owner.clone());

            Self::deposit_event(RawEvent::ContentAdded(content, owner));
        }

        /// Updates storage object owner quota objects limit. Requires leader privileges.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_storage_object_owner_quota_objects_limit(
            origin,
            abstract_owner: StorageObjectOwner<MemberId<T>, ChannelId<T>, DAOId<T>>,
            new_quota_objects_limit: u64
        ) {
            <StorageWorkingGroup<T>>::ensure_origin_is_active_leader(origin)?;
            ensure!(new_quota_objects_limit <= Self::quota_objects_limit_upper_bound(), Error::<T>::QuotaSizeLimitUpperBoundExceeded);

            //
            // == MUTATION SAFE ==
            //

            if <Quotas<T>>::contains_key(&abstract_owner) {
                <Quotas<T>>::mutate(&abstract_owner, |quota| {
                    quota.set_new_objects_limit(new_quota_objects_limit);
                });
            } else {
                let mut quota = T::DefaultQuota::get();
                quota.set_new_objects_limit(new_quota_objects_limit);
                <Quotas<T>>::insert(&abstract_owner, quota);
            };

            Self::deposit_event(RawEvent::StorageObjectOwnerQuotaObjectsLimitUpdated(abstract_owner, new_quota_objects_limit));
        }

        /// Updates storage object owner quota size limit. Requires leader privileges.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_storage_object_owner_quota_size_limit(
            origin,
            abstract_owner: StorageObjectOwner<MemberId<T>, ChannelId<T>, DAOId<T>>,
            new_quota_size_limit: u64
        ) {
            <StorageWorkingGroup<T>>::ensure_origin_is_active_leader(origin)?;
            ensure!(new_quota_size_limit <= Self::quota_size_limit_upper_bound(), Error::<T>::QuotaObjectsLimitUpperBoundExceeded);

            //
            // == MUTATION SAFE ==
            //

            if <Quotas<T>>::contains_key(&abstract_owner) {
                <Quotas<T>>::mutate(&abstract_owner, |quota| {
                    quota.set_new_size_limit(new_quota_size_limit);
                });
            } else {
                let mut quota = T::DefaultQuota::get();
                quota.set_new_size_limit(new_quota_size_limit);
                <Quotas<T>>::insert(&abstract_owner, quota);
            };

            Self::deposit_event(RawEvent::StorageObjectOwnerQuotaSizeLimitUpdated(abstract_owner, new_quota_size_limit));
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

            <KnownContentIds<T>>::mutate(|ids| ids.push(content_id));

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

        // Sudo methods

        /// Removes the content id from the list of known content ids. Requires root privileges.
        #[weight = 10_000_000] // TODO: adjust weight
        fn remove_known_content_id(origin, content_id: T::ContentId) {
            ensure_root(origin)?;

            // == MUTATION SAFE ==

            let upd_content_ids: Vec<T::ContentId> = Self::known_content_ids()
                .into_iter()
                .filter(|&id| id != content_id)
                .collect();
            <KnownContentIds<T>>::put(upd_content_ids);
        }

        /// Injects a set of data objects and their corresponding content id into the directory.
        /// The operation is "silent" - no events will be emitted as objects are added.
        /// The number of objects that can be added per call is limited to prevent the dispatch
        /// from causing the block production to fail if it takes too much time to process.
        /// Existing data objects will be overwritten.
        #[weight = 10_000_000] // TODO: adjust weight
        pub(crate) fn inject_data_objects(origin, objects: DataObjectsMap<T>) {
            ensure_root(origin)?;

            // Must provide something to inject
            ensure!(objects.len() <= T::MaxObjectsPerInjection::get() as usize, Error::<T>::DataObjectsInjectionExceededLimit);

            for (id, object) in objects.into_iter() {
                // append to known content ids
                // duplicates will be removed at the end
                <KnownContentIds<T>>::mutate(|ids| ids.push(id));
                <DataObjectByContentId<T>>::insert(id, object);
            }

            // remove duplicate ids
            <KnownContentIds<T>>::mutate(|ids| {
                ids.sort();
                ids.dedup();
            });
        }
    }
}

impl<T: Trait> Module<T> {
    // Get owner quota if exists, otherwise return default one.
    fn get_quota(owner: &StorageObjectOwner<MemberId<T>, ChannelId<T>, DAOId<T>>) -> Quota {
        if <Quotas<T>>::contains_key(owner) {
            Self::quotas(owner)
        } else {
            T::DefaultQuota::get()
        }
    }

    // Ensure owner quota constraints satisfied, returns total object length and total size delta for this upload.
    fn ensure_owner_quota_constraints_satisfied(
        owner_quota: Quota,
        content: &[ContentParameters<T::ContentId, DataObjectTypeId<T>>],
    ) -> Result<Delta, Error<T>> {
        let owner_quota_delta = owner_quota.calculate_delta();

        // Ensure total content length is less or equal then available per given owner quota
        let content_length = content.len() as u64;

        ensure!(
            owner_quota_delta.objects >= content_length,
            Error::<T>::QuotaObjectsLimitExceeded
        );

        // Ensure total content size is less or equal then available per given owner quota
        let content_size = content
            .iter()
            .fold(0, |total_size, content| total_size + content.size);

        ensure!(
            owner_quota_delta.size >= content_size,
            Error::<T>::QuotaSizeLimitExceeded
        );

        Ok(Delta {
            size: content_size,
            objects: content_length,
        })
    }

    // Ensures global quota constraints satisfied.
    fn ensure_global_quota_constraints_satisfied(upload_delta: Delta) -> DispatchResult {
        let global_quota_delta = Self::global_quota().calculate_delta();

        ensure!(
            global_quota_delta.objects >= upload_delta.objects,
            Error::<T>::GlobalQuotaObjectsLimitExceeded
        );

        ensure!(
            global_quota_delta.size >= upload_delta.size,
            Error::<T>::GlobalQuotaSizeLimitExceeded
        );

        Ok(())
    }

    // Complete content upload, update quotas
    fn upload_content(
        owner_quota: Quota,
        upload_delta: Delta,
        liaison: StorageProviderId<T>,
        multi_content: Vec<ContentParameters<T::ContentId, DataObjectTypeId<T>>>,
        owner: StorageObjectOwner<MemberId<T>, ChannelId<T>, DAOId<T>>,
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

            <DataObjectByContentId<T>>::insert(content.content_id, data);
        }

        // Updade or create owner quota.
        <Quotas<T>>::insert(owner, owner_quota.fill_quota(upload_delta));

        // Update global quota
        <GlobalQuota>::mutate(|global_quota| global_quota.fill_quota(upload_delta));
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
                !<DataObjectByContentId<T>>::contains_key(&content.content_id),
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
        let mut data =
            Self::data_object_by_content_id(&content_id).ok_or(Error::<T>::CidNotFound)?;

        // Make sure the liaison matches
        ensure!(
            data.liaison == *storage_provider_id,
            Error::<T>::LiaisonRequired
        );

        data.liaison_judgement = judgement;
        <DataObjectByContentId<T>>::insert(content_id, data);

        Ok(())
    }
}

/// Provides random storage provider id. We use it when assign the content to the storage provider.
pub trait StorageProviderHelper<T: Trait> {
    /// Provides random storage provider id.
    fn get_random_storage_provider() -> Result<StorageProviderId<T>, &'static str>;
}

/// Content access helper.
pub trait ContentIdExists<T: Trait> {
    /// Verifies the content existence.
    fn has_content(id: &T::ContentId) -> bool;

    /// Returns the data object for the provided content id.
    fn get_data_object(id: &T::ContentId) -> Result<DataObject<T>, &'static str>;
}

impl<T: Trait> ContentIdExists<T> for Module<T> {
    fn has_content(content_id: &T::ContentId) -> bool {
        Self::data_object_by_content_id(*content_id).is_some()
    }

    fn get_data_object(content_id: &T::ContentId) -> Result<DataObject<T>, &'static str> {
        match Self::data_object_by_content_id(*content_id) {
            Some(data) => Ok(data),
            None => Err(Error::<T>::LiaisonRequired.into()),
        }
    }
}

impl<T: Trait> common::storage::StorageSystem<T> for Module<T> {
    fn atomically_add_content(
        owner: StorageObjectOwner<MemberId<T>, ChannelId<T>, DAOId<T>>,
        content: Vec<ContentParameters<T::ContentId, DataObjectTypeId<T>>>,
    ) -> DispatchResult {
        Self::ensure_content_is_valid(&content)?;

        let liaison = T::StorageProviderHelper::get_random_storage_provider()?;

        let owner_quota = Self::get_quota(&owner);
        let upload_delta = Self::ensure_owner_quota_constraints_satisfied(owner_quota, &content)?;

        Self::upload_content(owner_quota, upload_delta, liaison, content, owner);
        Ok(())
    }

    fn can_add_content(
        owner: StorageObjectOwner<MemberId<T>, ChannelId<T>, DAOId<T>>,
        content: Vec<ContentParameters<T::ContentId, DataObjectTypeId<T>>>,
    ) -> DispatchResult {
        T::StorageProviderHelper::get_random_storage_provider()?;
        let owner_quota = Self::get_quota(&owner);
        Self::ensure_owner_quota_constraints_satisfied(owner_quota, &content)?;
        Self::ensure_content_is_valid(&content)
    }
}
