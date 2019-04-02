#![cfg(test)]

pub use super::{data_directory, data_object_storage_registry, data_object_type_registry};
use crate::traits;
use rstd::prelude::*;
use runtime_io::with_externalities;
pub use system;

pub use primitives::{Blake2Hasher, H256};
pub use runtime_primitives::{
    testing::{Digest, DigestItem, Header, UintAuthorityId},
    traits::{BlakeTwo256, IdentityLookup, OnFinalise},
    BuildStorage,
};

use srml_support::{impl_outer_event, impl_outer_origin};

impl_outer_origin! {
    pub enum Origin for Test {}
}

impl_outer_event! {
    pub enum MetaEvent for Test {
        data_object_type_registry<T>,
        data_directory<T>,
        data_object_storage_registry<T>,
    }
}

pub struct MockMembers {}
impl<T: system::Trait> traits::Members<T> for MockMembers {
    type Id = u64;

    fn is_active_member(_who: &T::AccountId) -> bool {
        true
    }

    fn lookup_member_id(_account_id: &T::AccountId) -> Result<Self::Id, &'static str> {
        Err("not implemented for tests")
    }

    fn lookup_account_by_member_id(_member_id: Self::Id) -> Result<T::AccountId, &'static str> {
        Err("not implemented for tests")
    }
}

pub struct AnyDataObjectTypeIsActive {}
impl<T: data_object_type_registry::Trait> traits::IsActiveDataObjectType<T>
    for AnyDataObjectTypeIsActive
{
    fn is_active_data_object_type(_which: &T::DataObjectTypeId) -> bool {
        true
    }
}

pub struct MockContent {}
impl traits::ContentIdExists<Test> for MockContent {
    fn has_content(which: &<Test as data_directory::Trait>::ContentId) -> bool {
        *which == 42
    }

    fn get_data_object(
        which: &<Test as data_directory::Trait>::ContentId,
    ) -> Result<data_directory::DataObject<Test>, &'static str> {
        match *which {
            42 => Ok(data_directory::DataObject {
                data_object_type: 1,
                signing_key: None,
                size: 1234,
                added_at_block: 10,
                added_at_time: 1024,
                owner: 1,
                liaison: 1, // TODO change to another later
                liaison_judgement: data_directory::LiaisonJudgement::Pending,
            }),
            _ => Err("nope, missing"),
        }
    }
}

// For testing the module, we construct most of a mock runtime. This means
// first constructing a configuration type (`Test`) which `impl`s each of the
// configuration traits of modules we want to use.
#[derive(Clone, Eq, PartialEq, Debug)]
pub struct Test;
impl system::Trait for Test {
    type Origin = Origin;
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type Digest = Digest;
    type AccountId = u64;
    type Header = Header;
    type Event = MetaEvent;
    type Log = DigestItem;
    type Lookup = IdentityLookup<u64>;
}

impl data_object_type_registry::Trait for Test {
    type Event = MetaEvent;
    type DataObjectTypeId = u64;
}

impl data_directory::Trait for Test {
    type Event = MetaEvent;
    type ContentId = u64;
    type Members = MockMembers;
    type IsActiveDataObjectType = AnyDataObjectTypeIsActive;
}

impl data_object_storage_registry::Trait for Test {
    type Event = MetaEvent;
    type DataObjectStorageRelationshipId = u64;
    type Members = MockMembers;
    type ContentIdExists = MockContent;
}

impl timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
}

impl consensus::Trait for Test {
    type SessionKey = UintAuthorityId;
    type InherentOfflineReport = ();
    type Log = DigestItem;
}

pub struct ExtBuilder {
    first_data_object_type_id: u64,
    first_content_id: u64,
    first_relationship_id: u64,
}

impl Default for ExtBuilder {
    fn default() -> Self {
        Self {
            first_data_object_type_id: 1,
            first_content_id: 2,
            first_relationship_id: 3,
        }
    }
}

impl ExtBuilder {
    pub fn first_data_object_type_id(mut self, first_data_object_type_id: u64) -> Self {
        self.first_data_object_type_id = first_data_object_type_id;
        self
    }
    pub fn first_content_id(mut self, first_content_id: u64) -> Self {
        self.first_content_id = first_content_id;
        self
    }
    pub fn first_relationship_id(mut self, first_relationship_id: u64) -> Self {
        self.first_relationship_id = first_relationship_id;
        self
    }
    pub fn build(self) -> runtime_io::TestExternalities<Blake2Hasher> {
        let mut t = system::GenesisConfig::<Test>::default()
            .build_storage()
            .unwrap()
            .0;

        t.extend(
            data_object_type_registry::GenesisConfig::<Test> {
                first_data_object_type_id: self.first_data_object_type_id,
            }
            .build_storage()
            .unwrap()
            .0,
        );

        t.extend(
            data_directory::GenesisConfig::<Test> {
                first_content_id: self.first_content_id,
            }
            .build_storage()
            .unwrap()
            .0,
        );

        t.extend(
            data_object_storage_registry::GenesisConfig::<Test> {
                first_relationship_id: self.first_relationship_id,
            }
            .build_storage()
            .unwrap()
            .0,
        );

        t.into()
    }
}

pub type System = system::Module<Test>;
pub type TestDataObjectTypeRegistry = data_object_type_registry::Module<Test>;
pub type TestDataObjectType = data_object_type_registry::DataObjectType;
pub type TestDataDirectory = data_directory::Module<Test>;
pub type TestDataObject = data_directory::DataObject<Test>;
pub type TestDataObjectStorageRegistry = data_object_storage_registry::Module<Test>;

pub const TEST_FIRST_DATA_OBJECT_TYPE_ID: u64 = 1000;
pub const TEST_FIRST_CONTENT_ID: u64 = 2000;
pub const TEST_FIRST_RELATIONSHIP_ID: u64 = 3000;
pub fn with_default_mock_builder<R, F: FnOnce() -> R>(f: F) -> R {
    with_externalities(
        &mut ExtBuilder::default()
            .first_data_object_type_id(TEST_FIRST_DATA_OBJECT_TYPE_ID)
            .first_content_id(TEST_FIRST_CONTENT_ID)
            .first_relationship_id(TEST_FIRST_RELATIONSHIP_ID)
            .build(),
        || f(),
    )
}
