// Do not delete! Cannot be uncommented by default, because of Parity decl_module! issue.
//#![warn(missing_docs)]

use codec::{Codec, Decode, Encode};
use roles::actors;
use roles::traits::Roles;
use rstd::prelude::*;
use sr_primitives::traits::{MaybeSerialize, Member, SimpleArithmetic};
use srml_support::{decl_event, decl_module, decl_storage, dispatch, ensure, Parameter};
use system::{self, ensure_root, ensure_signed};

use crate::data_object_type_registry;
use crate::data_object_type_registry::IsActiveDataObjectType;

pub trait Trait:
    timestamp::Trait + system::Trait + data_object_type_registry::Trait + membership::members::Trait
{
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type ContentId: Parameter + Member + MaybeSerialize + Copy + Ord + Default;

    type SchemaId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    type Roles: Roles<Self>;
    type IsActiveDataObjectType: data_object_type_registry::IsActiveDataObjectType<Self>;
}

static MSG_CID_NOT_FOUND: &str = "Content with this ID not found.";
static MSG_LIAISON_REQUIRED: &str = "Only the liaison for the content may modify its status.";
static MSG_CREATOR_MUST_BE_MEMBER: &str = "Only active members may create content.";
static MSG_DO_TYPE_MUST_BE_ACTIVE: &str =
    "Cannot create content for inactive or missing data object type.";

#[derive(Clone, Encode, Decode, PartialEq, Debug)]
pub struct BlockAndTime<T: Trait> {
    pub block: T::BlockNumber,
    pub time: T::Moment,
}

#[derive(Clone, Encode, Decode, PartialEq, Debug)]
pub enum LiaisonJudgement {
    Pending,
    Accepted,
    Rejected,
}

impl Default for LiaisonJudgement {
    fn default() -> Self {
        LiaisonJudgement::Pending
    }
}

#[derive(Clone, Encode, Decode, PartialEq, Debug)]
pub struct DataObject<T: Trait> {
    pub owner: T::AccountId,
    pub added_at: BlockAndTime<T>,
    pub type_id: <T as data_object_type_registry::Trait>::DataObjectTypeId,
    pub size: u64,
    pub liaison: T::AccountId,
    pub liaison_judgement: LiaisonJudgement,
    pub ipfs_content_id: Vec<u8>, // shoule we use rust multi-format crate?
                                  // TODO signing_key: public key supplied by the uploader,
                                  // they sigh the content with this key

                                  // TODO add support for this field (Some if judgment == Rejected)
                                  // pub rejection_reason: Option<Vec<u8>>,
}

#[derive(Clone, Encode, Decode, PartialEq, Debug)]
pub enum ContentVisibility {
    Draft, // TODO rename to Unlisted?
    Public,
}

impl Default for ContentVisibility {
    fn default() -> Self {
        ContentVisibility::Draft // TODO make Public by default?
    }
}

decl_storage! {
    trait Store for Module<T: Trait> as DataDirectory {

        // TODO default_liaison = Joystream storage account id.

        // TODO this list of ids should be moved off-chain once we have Content Indexer.
        // TODO deprecated, moved tp storage relationship
        pub KnownContentIds get(known_content_ids): Vec<T::ContentId> = vec![];

        pub DataObjectByContentId get(data_object_by_content_id):
            map T::ContentId => Option<DataObject<T>>;

        // Default storage provider account id, overrides all active storage providers as liason if set
        pub PrimaryLiaisonAccountId get(primary_liaison_account_id): Option<T::AccountId>;
    }
}

decl_event! {
    pub enum Event<T> where
        <T as Trait>::ContentId,
        <T as system::Trait>::AccountId
    {
        // The account is the one who uploaded the content.
        ContentAdded(ContentId, AccountId),

        // The account is the liaison - only they can reject or accept
        ContentAccepted(ContentId, AccountId),
        ContentRejected(ContentId, AccountId),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        // TODO send file_name as param so we could create a Draft metadata in this fn
        pub fn add_content(
            origin,
            content_id: T::ContentId,
            type_id: <T as data_object_type_registry::Trait>::DataObjectTypeId,
            size: u64,
            ipfs_content_id: Vec<u8>
        ) {
            let who = ensure_signed(origin)?;
            ensure!(<membership::members::Module<T>>::is_member_account(&who), MSG_CREATOR_MUST_BE_MEMBER);

            ensure!(T::IsActiveDataObjectType::is_active_data_object_type(&type_id),
                MSG_DO_TYPE_MUST_BE_ACTIVE);

            ensure!(!<DataObjectByContentId<T>>::exists(content_id),
                "Data object aready added under this content id");

            let liaison = match Self::primary_liaison_account_id() {
                // Select primary liaison if set
                Some(primary_liaison) => primary_liaison,

                // Select liaison from staked roles if available
                _ => T::Roles::random_account_for_role(actors::Role::StorageProvider)?
            };

            // Let's create the entry then
            let data: DataObject<T> = DataObject {
                type_id,
                size,
                added_at: Self::current_block_and_time(),
                owner: who.clone(),
                liaison,
                liaison_judgement: LiaisonJudgement::Pending,
                ipfs_content_id,
            };

            <DataObjectByContentId<T>>::insert(&content_id, data);
            Self::deposit_event(RawEvent::ContentAdded(content_id, who));
        }

        // The LiaisonJudgement can be updated, but only by the liaison.
        pub(crate) fn accept_content(origin, content_id: T::ContentId) {
            let who = ensure_signed(origin)?;
            Self::update_content_judgement(&who, content_id, LiaisonJudgement::Accepted)?;
            <KnownContentIds<T>>::mutate(|ids| ids.push(content_id));
            Self::deposit_event(RawEvent::ContentAccepted(content_id, who));
        }

        pub(crate) fn reject_content(origin, content_id: T::ContentId) {
            let who = ensure_signed(origin)?;
            Self::update_content_judgement(&who, content_id, LiaisonJudgement::Rejected)?;
            Self::deposit_event(RawEvent::ContentRejected(content_id, who));
        }

        // Sudo methods

        fn set_primary_liaison_account_id(origin, account: T::AccountId) {
            ensure_root(origin)?;
            <PrimaryLiaisonAccountId<T>>::put(account);
        }

        fn unset_primary_liaison_account_id(origin) {
            ensure_root(origin)?;
            <PrimaryLiaisonAccountId<T>>::take();
        }

        fn remove_known_content_id(origin, content_id: T::ContentId) {
            ensure_root(origin)?;
            let upd_content_ids: Vec<T::ContentId> = Self::known_content_ids()
                .into_iter()
                .filter(|&id| id != content_id)
                .collect();
            <KnownContentIds<T>>::put(upd_content_ids);
        }

        fn set_known_content_id(origin, content_ids: Vec<T::ContentId>) {
            ensure_root(origin)?;
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
        who: &T::AccountId,
        content_id: T::ContentId,
        judgement: LiaisonJudgement,
    ) -> dispatch::Result {
        let mut data = Self::data_object_by_content_id(&content_id).ok_or(MSG_CID_NOT_FOUND)?;

        // Make sure the liaison matches
        ensure!(data.liaison == *who, MSG_LIAISON_REQUIRED);

        data.liaison_judgement = judgement;
        <DataObjectByContentId<T>>::insert(content_id, data);

        Ok(())
    }
}

pub trait ContentIdExists<T: Trait> {
    fn has_content(_which: &T::ContentId) -> bool;

    fn get_data_object(_which: &T::ContentId) -> Result<DataObject<T>, &'static str>;
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
