//! # Data directory module
//! Data directory module for the Joystream platform manages IPFS content id, storage providers,
//! owners of the content. It allows to add and accept or reject the content in the system.
//!
//! ## Comments
//!
//! Data object type registry module uses bureaucracy module to authorize actions.
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
use rstd::prelude::*;
use sr_primitives::traits::{MaybeSerialize, Member};
use srml_support::{decl_event, decl_module, decl_storage, dispatch, ensure, Parameter};
use system::{self, ensure_root};

use common::origin_validator::ActorOriginValidator;

use crate::data_object_type_registry;
use crate::data_object_type_registry::IsActiveDataObjectType;
use crate::{MemberId, StorageBureaucracy, StorageProviderId};

// TODO: create a StorageProviderHelper implementation

/// The _Data directory_ main _Trait_.
pub trait Trait:
    timestamp::Trait
    + system::Trait
    + data_object_type_registry::Trait
    + membership::members::Trait
    + bureaucracy::Trait<bureaucracy::Instance2>
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
}

static MSG_CID_NOT_FOUND: &str = "Content with this ID not found.";
static MSG_LIAISON_REQUIRED: &str = "Only the liaison for the content may modify its status.";
static MSG_DO_TYPE_MUST_BE_ACTIVE: &str =
    "Cannot create content for inactive or missing data object type.";

// TODO consider to remove it
#[derive(Clone, Encode, Decode, PartialEq, Debug)]
pub struct BlockAndTime<T: Trait> {
    pub block: T::BlockNumber,
    pub time: T::Moment,
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

/// Manages content ids, type and storage provider decision about it.
#[derive(Clone, Encode, Decode, PartialEq, Debug)]
pub struct DataObject<T: Trait> {
    /// Content owner.
    pub owner: MemberId<T>,

    /// Content added at.
    pub added_at: BlockAndTime<T>,

    /// Content type id.
    pub type_id: <T as data_object_type_registry::Trait>::DataObjectTypeId,

    /// Content size in bytes.
    pub size: u64,

    /// Storage provider id of the liaison.
    pub liaison: StorageProviderId<T>,

    /// Storage provider as liaison judgment.
    pub liaison_judgement: LiaisonJudgement,

    /// IPFS content id.
    pub ipfs_content_id: Vec<u8>,
}

//TODO consider to remove

#[derive(Clone, Encode, Decode, PartialEq, Debug)]
pub enum ContentVisibility {
    Draft,
    Public,
}

impl Default for ContentVisibility {
    fn default() -> Self {
        ContentVisibility::Draft
    }
}

decl_storage! {
    trait Store for Module<T: Trait> as DataDirectory {
        /// List of ids known to the system.
        pub KnownContentIds get(known_content_ids): Vec<T::ContentId> = Vec::new();

        /// Maps data objects by their content id.
        pub DataObjectByContentId get(data_object_by_content_id):
            map T::ContentId => Option<DataObject<T>>;
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

        /// Adds the content to the system. Member id should match its origin. The created DataObject
        /// awaits liaison to accept or reject it.
        pub fn add_content(
            origin,
            member_id: MemberId<T>,
            content_id: T::ContentId, // TODO generate content_id by runtime
            type_id: <T as data_object_type_registry::Trait>::DataObjectTypeId,
            size: u64,
            ipfs_content_id: Vec<u8>
        ) {
            T::MemberOriginValidator::ensure_actor_origin(
                origin,
                member_id,
            )?;

            ensure!(T::IsActiveDataObjectType::is_active_data_object_type(&type_id),
                MSG_DO_TYPE_MUST_BE_ACTIVE);

            ensure!(!<DataObjectByContentId<T>>::exists(content_id),
                "Data object already added under this content id");

            let liaison = T::StorageProviderHelper::get_random_storage_provider()?;

            // Let's create the entry then
            let data: DataObject<T> = DataObject {
                type_id,
                size,
                added_at: Self::current_block_and_time(),
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
        pub(crate) fn accept_content(
            origin,
            storage_provider_id: StorageProviderId<T>,
            content_id: T::ContentId
        ) {
            <StorageBureaucracy<T>>::ensure_worker_signed(origin, &storage_provider_id)?;

            // == MUTATION SAFE ==

            Self::update_content_judgement(&storage_provider_id, content_id, LiaisonJudgement::Accepted)?;

            <KnownContentIds<T>>::mutate(|ids| ids.push(content_id));

            Self::deposit_event(RawEvent::ContentAccepted(content_id, storage_provider_id));
        }

        /// Storage provider rejects a content. Requires signed storage provider account and its id.
        /// The LiaisonJudgement can be updated, but only by the liaison.
        pub(crate) fn reject_content(
            origin,
            storage_provider_id: StorageProviderId<T>,
            content_id: T::ContentId
        ) {
            <StorageBureaucracy<T>>::ensure_worker_signed(origin, &storage_provider_id)?;

            // == MUTATION SAFE ==

            Self::update_content_judgement(&storage_provider_id, content_id, LiaisonJudgement::Rejected)?;
            Self::deposit_event(RawEvent::ContentRejected(content_id, storage_provider_id));
        }

        // Sudo methods

        /// Removes the content id from the list of known content ids. Requires root privileges.
        fn remove_known_content_id(origin, content_id: T::ContentId) {
            ensure_root(origin)?;

            // == MUTATION SAFE ==

            let upd_content_ids: Vec<T::ContentId> = Self::known_content_ids()
                .into_iter()
                .filter(|&id| id != content_id)
                .collect();
            <KnownContentIds<T>>::put(upd_content_ids);
        }

        /// Sets the content id from the list of known content ids. Requires root privileges.
        fn set_known_content_id(origin, content_ids: Vec<T::ContentId>) {
            ensure_root(origin)?;

            // == MUTATION SAFE ==

            <KnownContentIds<T>>::put(content_ids);
        }
    }
}

impl<T: Trait> Module<T> {
    fn current_block_and_time() -> BlockAndTime<T> {
        BlockAndTime {
            block: <system::Module<T>>::block_number(),
            time: <timestamp::Module<T>>::now(),
        }
    }

    fn update_content_judgement(
        storage_provider_id: &StorageProviderId<T>,
        content_id: T::ContentId,
        judgement: LiaisonJudgement,
    ) -> dispatch::Result {
        let mut data = Self::data_object_by_content_id(&content_id).ok_or(MSG_CID_NOT_FOUND)?;

        // Make sure the liaison matches
        ensure!(data.liaison == *storage_provider_id, MSG_LIAISON_REQUIRED);

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
            None => Err(MSG_CID_NOT_FOUND),
        }
    }
}
