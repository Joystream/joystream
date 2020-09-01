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
use frame_support::{decl_error, decl_event, decl_module, decl_storage, ensure, Parameter};
use sp_runtime::traits::{MaybeSerialize, Member};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::vec::Vec;
use system::ensure_root;

use common::origin::ActorOriginValidator;
pub(crate) use common::BlockAndTime;

use crate::data_object_type_registry;
use crate::data_object_type_registry::IsActiveDataObjectType;
use crate::{MemberId, StorageProviderId, StorageWorkingGroup, StorageWorkingGroupInstance};

/// The _Data directory_ main _Trait_.
pub trait Trait:
    pallet_timestamp::Trait
    + system::Trait
    + data_object_type_registry::Trait
    + membership::Trait
    + working_group::Trait<StorageWorkingGroupInstance>
{
    /// _Data directory_ event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// Content id.
    type ContentId: Parameter + Member + MaybeSerialize + Copy + Ord + Default;

    /// Provides random storage provider id.
    type StorageProviderHelper: StorageProviderHelper<Self>;

    ///Active data object type validator.
    type IsActiveDataObjectType: data_object_type_registry::IsActiveDataObjectType<Self>;

    /// Validates member id and origin combination.
    type MemberOriginValidator: ActorOriginValidator<Self::Origin, MemberId<Self>, Self::AccountId>;

    type MaxObjectsPerInjection: Get<u32>;
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
        DataObjectsInjectionExceededLimit
    }
}

/// The decision of the storage provider when it acts as liaison.
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
    <T as system::Trait>::BlockNumber,
    <T as pallet_timestamp::Trait>::Moment,
    <T as data_object_type_registry::Trait>::DataObjectTypeId,
    StorageProviderId<T>,
>;

/// Manages content ids, type and storage provider decision about it.
#[derive(Clone, Encode, Decode, PartialEq, Debug)]
pub struct DataObjectInternal<MemberId, BlockNumber, Moment, DataObjectTypeId, StorageProviderId> {
    /// Content owner.
    pub owner: MemberId,

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

/// A map collection of unique DataObjects keyed by the ContentId
pub type DataObjectsMap<T> = BTreeMap<<T as Trait>::ContentId, DataObject<T>>;

decl_storage! {
    trait Store for Module<T: Trait> as DataDirectory {
        /// List of ids known to the system.
        pub KnownContentIds get(fn known_content_ids): Vec<T::ContentId> = Vec::new();

        /// Maps data objects by their content id.
        pub DataObjectByContentId get(fn data_object_by_content_id):
            map hasher(blake2_128_concat) T::ContentId => Option<DataObject<T>>;
    }
}

decl_event! {
    /// _Data directory_ events
    pub enum Event<T> where
        <T as Trait>::ContentId,
        MemberId = MemberId<T>,
        StorageProviderId = StorageProviderId<T>
    {
        /// Emits on adding of the content.
        /// Params:
        /// - Id of the relationship.
        /// - Id of the member.
        ContentAdded(ContentId, MemberId),

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
        pub fn add_content(
            origin,
            member_id: MemberId<T>,
            content_id: T::ContentId,
            type_id: <T as data_object_type_registry::Trait>::DataObjectTypeId,
            size: u64,
            ipfs_content_id: Vec<u8>
        ) {
            T::MemberOriginValidator::ensure_actor_origin(
                origin,
                member_id,
            )?;

            ensure!(T::IsActiveDataObjectType::is_active_data_object_type(&type_id),
                Error::<T>::DataObjectTypeMustBeActive);

            ensure!(!<DataObjectByContentId<T>>::contains_key(content_id),
                Error::<T>::DataObjectAlreadyAdded);

            let liaison = T::StorageProviderHelper::get_random_storage_provider()?;

            // Let's create the entry then
            let data: DataObject<T> = DataObjectInternal {
                type_id,
                size,
                added_at: common::current_block_time::<T>(),
                owner: member_id,
                liaison,
                liaison_judgement: LiaisonJudgement::Pending,
                ipfs_content_id,
            };

            //
            // == MUTATION SAFE ==
            //

            <DataObjectByContentId<T>>::insert(&content_id, data);
            Self::deposit_event(RawEvent::ContentAdded(content_id, member_id));
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
