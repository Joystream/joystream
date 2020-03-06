use crate::roles::actors;
use crate::storage::data_directory::Trait as DDTrait;
use crate::traits::{ContentHasStorage, ContentIdExists, Roles};
use codec::{Codec, Decode, Encode};
use rstd::prelude::*;
use sr_primitives::traits::{MaybeSerialize, Member, SimpleArithmetic};
use srml_support::{decl_event, decl_module, decl_storage, ensure, Parameter};
use system::{self, ensure_signed};

pub trait Trait: timestamp::Trait + system::Trait + DDTrait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    // TODO deprecated
    type DataObjectStorageRelationshipId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    type Roles: Roles<Self>;
    type ContentIdExists: ContentIdExists<Self>;
}

static MSG_CID_NOT_FOUND: &str = "Content with this ID not found.";
static MSG_DOSR_NOT_FOUND: &str = "No data object storage relationship found for this ID.";
static MSG_ONLY_STORAGE_PROVIDER_MAY_CREATE_DOSR: &str =
    "Only storage providers can create data object storage relationships.";
static MSG_ONLY_STORAGE_PROVIDER_MAY_CLAIM_READY: &str =
    "Only the storage provider in a DOSR can decide whether they're ready.";

// TODO deprecated
const DEFAULT_FIRST_RELATIONSHIP_ID: u32 = 1;

// TODO deprecated
#[derive(Clone, Encode, Decode, PartialEq, Debug)]
pub struct DataObjectStorageRelationship<T: Trait> {
    pub content_id: <T as DDTrait>::ContentId,
    pub storage_provider: T::AccountId,
    pub ready: bool,
}

decl_storage! {
    trait Store for Module<T: Trait> as DataObjectStorageRegistry {

        // TODO deprecated
        // Start at this value
        pub FirstRelationshipId get(first_relationship_id) config(first_relationship_id): T::DataObjectStorageRelationshipId = T::DataObjectStorageRelationshipId::from(DEFAULT_FIRST_RELATIONSHIP_ID);

        // TODO deprecated
        // Increment
        pub NextRelationshipId get(next_relationship_id) build(|config: &GenesisConfig<T>| config.first_relationship_id): T::DataObjectStorageRelationshipId = T::DataObjectStorageRelationshipId::from(DEFAULT_FIRST_RELATIONSHIP_ID);

        // TODO deprecated
        // Mapping of Data object types
        pub Relationships get(relationships): map T::DataObjectStorageRelationshipId => Option<DataObjectStorageRelationship<T>>;

        // TODO deprecated
        // Keep a list of storage relationships per CID
        pub RelationshipsByContentId get(relationships_by_content_id): map T::ContentId => Vec<T::DataObjectStorageRelationshipId>;

        // ------------------------------------------
        // TODO use next storage items insteam:

        // TODO save only if metadata exists and there is at least one relation w/ ready == true.
        ReadyContentIds get(ready_content_ids): Vec<T::ContentId> = vec![];

        // TODO need? it can be expressed via StorageProvidersByContentId
        pub StorageProviderServesContent get(storage_provider_serves_content):
            map (T::AccountId, T::ContentId) => bool;

        pub StorageProvidersByContentId get(storage_providers_by_content_id):
            map T::ContentId => Vec<T::AccountId>;
    }
}

decl_event! {
    pub enum Event<T> where
        <T as DDTrait>::ContentId,
        <T as Trait>::DataObjectStorageRelationshipId,
        <T as system::Trait>::AccountId
    {
        // TODO deprecated
        DataObjectStorageRelationshipAdded(DataObjectStorageRelationshipId, ContentId, AccountId),
        DataObjectStorageRelationshipReadyUpdated(DataObjectStorageRelationshipId, bool),

        // NEW & COOL
        StorageProviderAddedContent(AccountId, ContentId),
        StorageProviderRemovedContent(AccountId, ContentId),
    }
}

impl<T: Trait> ContentHasStorage<T> for Module<T> {
    // TODO deprecated
    fn has_storage_provider(which: &T::ContentId) -> bool {
        let dosr_list = Self::relationships_by_content_id(which);
        return dosr_list.iter().any(|&dosr_id| {
            let res = Self::relationships(dosr_id);
            if res.is_none() {
                return false;
            }
            let dosr = res.unwrap();
            dosr.ready
        });
    }

    // TODO deprecated
    fn is_ready_at_storage_provider(which: &T::ContentId, provider: &T::AccountId) -> bool {
        let dosr_list = Self::relationships_by_content_id(which);
        return dosr_list.iter().any(|&dosr_id| {
            let res = Self::relationships(dosr_id);
            if res.is_none() {
                return false;
            }
            let dosr = res.unwrap();
            dosr.storage_provider == *provider && dosr.ready
        });
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        pub fn add_relationship(origin, cid: T::ContentId) {
            // Origin has to be a storage provider
            let who = ensure_signed(origin)?;

            // Check that the origin is a storage provider
            ensure!(<T as Trait>::Roles::account_has_role(&who, actors::Role::StorageProvider), MSG_ONLY_STORAGE_PROVIDER_MAY_CREATE_DOSR);

            // Content ID must exist
            ensure!(T::ContentIdExists::has_content(&cid), MSG_CID_NOT_FOUND);

            // Create new ID, data.
            let new_id = Self::next_relationship_id();
            let dosr: DataObjectStorageRelationship<T> = DataObjectStorageRelationship {
                content_id: cid.clone(),
                storage_provider: who.clone(),
                ready: false,
            };

            <Relationships<T>>::insert(new_id, dosr);
            <NextRelationshipId<T>>::mutate(|n| { *n += T::DataObjectStorageRelationshipId::from(1); });

            // Also add the DOSR to the list of DOSRs for the CID. Uniqueness is guaranteed
            // by the map, so we can just append the new_id to the list.
            let mut dosr_list = Self::relationships_by_content_id(cid.clone());
            dosr_list.push(new_id);
            <RelationshipsByContentId<T>>::insert(cid.clone(), dosr_list);

            // Emit event
            Self::deposit_event(RawEvent::DataObjectStorageRelationshipAdded(new_id, cid, who));
        }

        // A storage provider may flip their own ready state, but nobody else.
        pub fn set_relationship_ready(origin, id: T::DataObjectStorageRelationshipId) {
            Self::toggle_dosr_ready(origin, id, true)?;
        }

        pub fn unset_relationship_ready(origin, id: T::DataObjectStorageRelationshipId) {
            Self::toggle_dosr_ready(origin, id, false)?;
        }
    }
}

impl<T: Trait> Module<T> {
    fn toggle_dosr_ready(
        origin: T::Origin,
        id: T::DataObjectStorageRelationshipId,
        ready: bool,
    ) -> Result<(), &'static str> {
        // Origin has to be the storage provider mentioned in the DOSR
        let who = ensure_signed(origin)?;

        // For that, we need to fetch the identified DOSR
        let mut dosr = Self::relationships(id).ok_or(MSG_DOSR_NOT_FOUND)?;
        ensure!(
            dosr.storage_provider == who,
            MSG_ONLY_STORAGE_PROVIDER_MAY_CLAIM_READY
        );

        // Flip to ready
        dosr.ready = ready;

        // Update DOSR and fire event.
        <Relationships<T>>::insert(id, dosr);
        Self::deposit_event(RawEvent::DataObjectStorageRelationshipReadyUpdated(
            id, true,
        ));

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use crate::storage::mock::*;

    #[test]
    fn initial_state() {
        with_default_mock_builder(|| {
            assert_eq!(
                TestDataObjectStorageRegistry::first_relationship_id(),
                TEST_FIRST_RELATIONSHIP_ID
            );
        });
    }

    #[test]
    fn test_add_relationship() {
        with_default_mock_builder(|| {
            // The content needs to exist - in our mock, that's with the content ID TEST_MOCK_EXISTING_CID
            let res = TestDataObjectStorageRegistry::add_relationship(
                Origin::signed(TEST_MOCK_LIAISON),
                TEST_MOCK_EXISTING_CID,
            );
            assert!(res.is_ok());
        });
    }

    #[test]
    fn test_fail_adding_relationship_with_bad_content() {
        with_default_mock_builder(|| {
            let res = TestDataObjectStorageRegistry::add_relationship(Origin::signed(1), 24);
            assert!(res.is_err());
        });
    }

    #[test]
    fn test_toggle_ready() {
        with_default_mock_builder(|| {
            // Create a DOSR
            let res = TestDataObjectStorageRegistry::add_relationship(
                Origin::signed(TEST_MOCK_LIAISON),
                TEST_MOCK_EXISTING_CID,
            );
            assert!(res.is_ok());

            // Grab DOSR ID from event
            let dosr_id = match System::events().last().unwrap().event {
                MetaEvent::data_object_storage_registry(
                    data_object_storage_registry::RawEvent::DataObjectStorageRelationshipAdded(
                        dosr_id,
                        _content_id,
                        _account_id,
                    ),
                ) => dosr_id,
                _ => 0xdeadbeefu64, // invalid value, unlikely to match
            };
            assert_ne!(dosr_id, 0xdeadbeefu64);

            // Toggling from a different account should fail
            let res =
                TestDataObjectStorageRegistry::set_relationship_ready(Origin::signed(2), dosr_id);
            assert!(res.is_err());

            // Toggling with the wrong ID should fail.
            let res = TestDataObjectStorageRegistry::set_relationship_ready(
                Origin::signed(TEST_MOCK_LIAISON),
                dosr_id + 1,
            );
            assert!(res.is_err());

            // Toggling with the correct ID and origin should succeed
            let res = TestDataObjectStorageRegistry::set_relationship_ready(
                Origin::signed(TEST_MOCK_LIAISON),
                dosr_id,
            );
            assert!(res.is_ok());
            assert_eq!(System::events().last().unwrap().event,
                MetaEvent::data_object_storage_registry(data_object_storage_registry::RawEvent::DataObjectStorageRelationshipReadyUpdated(
                    dosr_id,
                    true,
                )));
        });
    }
}
