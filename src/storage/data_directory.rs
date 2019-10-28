use crate::membership;
use crate::roles::actors;
use crate::storage::data_object_type_registry::Trait as DOTRTrait;
use crate::traits::{ContentIdExists, IsActiveDataObjectType, Roles};
use codec::{Codec, Decode, Encode};
use rstd::prelude::*;
use runtime_primitives::traits::{MaybeSerialize, Member, SimpleArithmetic};
use srml_support::{decl_event, decl_module, decl_storage, dispatch, ensure, Parameter};
use system::{self, ensure_root, ensure_signed};

pub trait Trait: timestamp::Trait + system::Trait + DOTRTrait + membership::members::Trait {
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
    type IsActiveDataObjectType: IsActiveDataObjectType<Self>;
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
    pub type_id: <T as DOTRTrait>::DataObjectTypeId,
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

#[derive(Clone, Encode, Decode, PartialEq, Debug)]
pub struct ContentMetadata<T: Trait> {
    pub owner: T::AccountId,
    pub added_at: BlockAndTime<T>,
    pub children_ids: Vec<T::ContentId>,
    pub visibility: ContentVisibility,
    pub schema: T::SchemaId,
    pub json: Vec<u8>,
}

#[derive(Clone, Encode, Decode, PartialEq, Debug)]
pub struct ContentMetadataUpdate<ContentId, SchemaId> {
    pub children_ids: Option<Vec<ContentId>>,
    pub visibility: Option<ContentVisibility>,
    pub schema: Option<SchemaId>,
    pub json: Option<Vec<u8>>,
}

decl_storage! {
    trait Store for Module<T: Trait> as DataDirectory {

        // TODO default_liaison = Joystream storage account id.

        // TODO this list of ids should be moved off-chain once we have Content Indexer.
        // TODO deprecated, moved tp storage relationship
        pub KnownContentIds get(known_content_ids): Vec<T::ContentId> = vec![];

        pub DataObjectByContentId get(data_object_by_content_id):
            map T::ContentId => Option<DataObject<T>>;

        pub MetadataByContentId get(metadata_by_content_id):
            map T::ContentId => Option<ContentMetadata<T>>;

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

        // The account is the owner of the content.
        MetadataAdded(ContentId, AccountId),
        MetadataUpdated(ContentId, AccountId),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        // TODO send file_name as param so we could create a Draft metadata in this fn
        pub fn add_content(
            origin,
            content_id: T::ContentId,
            type_id: <T as DOTRTrait>::DataObjectTypeId,
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
                liaison: liaison,
                liaison_judgement: LiaisonJudgement::Pending,
                ipfs_content_id: ipfs_content_id.clone(),
            };

            <DataObjectByContentId<T>>::insert(&content_id, data);
            Self::deposit_event(RawEvent::ContentAdded(content_id, who));
        }

        // The LiaisonJudgement can be updated, but only by the liaison.
        fn accept_content(origin, content_id: T::ContentId) {
            let who = ensure_signed(origin)?;
            Self::update_content_judgement(&who, content_id.clone(), LiaisonJudgement::Accepted)?;
            Self::deposit_event(RawEvent::ContentAccepted(content_id, who));
        }

        fn reject_content(origin, content_id: T::ContentId) {
            let who = ensure_signed(origin)?;
            Self::update_content_judgement(&who, content_id.clone(), LiaisonJudgement::Rejected)?;
            Self::deposit_event(RawEvent::ContentRejected(content_id, who));
        }

        fn add_metadata(
            origin,
            content_id: T::ContentId,
            update: ContentMetadataUpdate<T::ContentId, T::SchemaId>
        ) {
            let who = ensure_signed(origin)?;
            ensure!(<membership::members::Module<T>>::is_member_account(&who),
                "Only active members can add content metadata");

            ensure!(!<MetadataByContentId<T>>::exists(&content_id),
                "Metadata aready added under this content id");

            let schema = update.schema.ok_or("Schema is required")?;
            Self::validate_metadata_schema(&schema)?;

            let json = update.json.ok_or("JSON is required")?;
            Self::validate_metadata_json(&json)?;

            let meta = ContentMetadata {
                owner: who.clone(),
                added_at: Self::current_block_and_time(),
                children_ids: vec![],
                visibility: update.visibility.unwrap_or_default(),
                schema,
                json,
            };

            // TODO temporary hack!!!
            // TODO create Storage Relationship. ready = true

            <MetadataByContentId<T>>::insert(&content_id, meta);
            <KnownContentIds<T>>::mutate(|ids| ids.push(content_id));
            Self::deposit_event(RawEvent::MetadataAdded(content_id, who));
        }

        fn update_metadata(
            origin,
            content_id: T::ContentId,
            update: ContentMetadataUpdate<T::ContentId, T::SchemaId>
        ) {
            let who = ensure_signed(origin)?;

            // Even if origin is an owner of metadata, they stil need to be an active member.
            ensure!(<membership::members::Module<T>>::is_member_account(&who),
                "Only active members can update content metadata");

            let has_updates = update.schema.is_some() || update.json.is_some();
            ensure!(has_updates, "No updates provided");

            let mut meta = Self::metadata_by_content_id(&content_id)
                .ok_or("No metadata found by content id")?;

            ensure!(meta.owner == who.clone(), "Only owner can update content metadata");

            if let Some(schema) = update.schema {
                Self::validate_metadata_schema(&schema)?;
                meta.schema = schema;
            }
            if let Some(json) = update.json {
                Self::validate_metadata_json(&json)?;
                meta.json = json;
            }
            if let Some(visibility) = update.visibility {
                meta.visibility = visibility;
            }

            <MetadataByContentId<T>>::insert(&content_id, meta);
            Self::deposit_event(RawEvent::MetadataUpdated(content_id, who));
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

impl<T: Trait> ContentIdExists<T> for Module<T> {
    fn has_content(content_id: &T::ContentId) -> bool {
        Self::data_object_by_content_id(content_id.clone()).is_some()
    }

    fn get_data_object(content_id: &T::ContentId) -> Result<DataObject<T>, &'static str> {
        match Self::data_object_by_content_id(content_id.clone()) {
            Some(data) => Ok(data),
            None => Err(MSG_CID_NOT_FOUND),
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

    fn validate_metadata_schema(_schema: &T::SchemaId) -> dispatch::Result {
        // TODO validate that schema id is registered.
        Ok(())
    }

    fn validate_metadata_json(_json: &Vec<u8>) -> dispatch::Result {
        // TODO validate a max length of JSON.
        Ok(())
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

#[cfg(test)]
mod tests {
    use crate::storage::mock::*;

    #[test]
    fn succeed_adding_content() {
        with_default_mock_builder(|| {
            let sender = 1 as u64;
            // Register a content with 1234 bytes of type 1, which should be recognized.
            let res = TestDataDirectory::add_content(
                Origin::signed(sender),
                1,
                1234,
                0,
                vec![1, 3, 3, 7],
            );
            assert!(res.is_ok());
        });
    }

    #[test]
    fn accept_content_as_liaison() {
        with_default_mock_builder(|| {
            let sender = 1 as u64;
            let res = TestDataDirectory::add_content(
                Origin::signed(sender),
                1,
                1234,
                0,
                vec![1, 2, 3, 4],
            );
            assert!(res.is_ok());

            // An appropriate event should have been fired.
            let (content_id, creator) = match System::events().last().unwrap().event {
                MetaEvent::data_directory(data_directory::RawEvent::ContentAdded(
                    content_id,
                    creator,
                )) => (content_id, creator),
                _ => (0u64, 0xdeadbeefu64), // invalid value, unlikely to match
            };
            assert_ne!(creator, 0xdeadbeefu64);
            assert_eq!(creator, sender);

            // Accepting content should not work with some random origin
            let res = TestDataDirectory::accept_content(Origin::signed(1), content_id);
            assert!(res.is_err());

            // However, with the liaison as origin it should.
            let res =
                TestDataDirectory::accept_content(Origin::signed(TEST_MOCK_LIAISON), content_id);
            assert!(res.is_ok());
        });
    }

    #[test]
    fn reject_content_as_liaison() {
        with_default_mock_builder(|| {
            let sender = 1 as u64;
            let res = TestDataDirectory::add_content(
                Origin::signed(sender),
                1,
                1234,
                0,
                vec![1, 2, 3, 4],
            );
            assert!(res.is_ok());

            // An appropriate event should have been fired.
            let (content_id, creator) = match System::events().last().unwrap().event {
                MetaEvent::data_directory(data_directory::RawEvent::ContentAdded(
                    content_id,
                    creator,
                )) => (content_id, creator),
                _ => (0u64, 0xdeadbeefu64), // invalid value, unlikely to match
            };
            assert_ne!(creator, 0xdeadbeefu64);
            assert_eq!(creator, sender);

            // Rejecting content should not work with some random origin
            let res = TestDataDirectory::reject_content(Origin::signed(1), content_id);
            assert!(res.is_err());

            // However, with the liaison as origin it should.
            let res =
                TestDataDirectory::reject_content(Origin::signed(TEST_MOCK_LIAISON), content_id);
            assert!(res.is_ok());
        });
    }

    // TODO update and add more tests for metadata

    // #[test]
    // fn add_metadata() {
    //     with_default_mock_builder(|| {
    //         let res =
    //             TestContentDirectory::add_metadata(Origin::signed(1), 1, "foo".as_bytes().to_vec());
    //         assert!(res.is_ok());
    //     });
    // }

    // #[test]
    // fn publish_metadata() {
    //     with_default_mock_builder(|| {
    //         let res =
    //             TestContentDirectory::add_metadata(Origin::signed(1), 1, "foo".as_bytes().to_vec());
    //         assert!(res.is_ok());

    //         // Grab ID from event
    //         let metadata_id = match System::events().last().unwrap().event {
    //             MetaEvent::content_directory(
    //                 content_directory::RawEvent::MetadataDraftCreated(metadata_id),
    //             ) => metadata_id,
    //             _ => 0xdeadbeefu64, // invalid value, unlikely to match
    //         };
    //         assert_ne!(metadata_id, 0xdeadbeefu64);

    //         // Publishing a bad ID should fail
    //         let res = TestContentDirectory::publish_metadata(Origin::signed(1), metadata_id + 1);
    //         assert!(res.is_err());

    //         // Publishing should not work for non-owners
    //         let res = TestContentDirectory::publish_metadata(Origin::signed(2), metadata_id);
    //         assert!(res.is_err());

    //         // For the owner, it should work however
    //         let res = TestContentDirectory::publish_metadata(Origin::signed(1), metadata_id);
    //         assert!(res.is_ok());
    //     });
    // }
}
