// Copyright 2019 Joystream Contributors
// This file is part of Joystream runtime

// Joystream runtime is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Joystream runtime is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// === Substrate ===
// Copyright 2017-2019 Parity Technologies (UK) Ltd.
// Substrate is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Substrate is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this software If not, see <http://www.gnu.org/licenses/>.

#![cfg(test)]

pub use super::{data_directory, data_object_storage_registry, data_object_type_registry};
use crate::currency::GovernanceCurrency;
use crate::roles::actors;
use crate::traits;
use runtime_io::with_externalities;
pub use system;

pub use primitives::{Blake2Hasher, H256};
pub use runtime_primitives::{
    testing::{Digest, DigestItem, Header, UintAuthorityId},
    traits::{BlakeTwo256, IdentityLookup, OnFinalize},
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
        actors<T>,
        balances<T>,
    }
}

pub const TEST_FIRST_DATA_OBJECT_TYPE_ID: u64 = 1000;
pub const TEST_FIRST_CONTENT_ID: u64 = 2000;
pub const TEST_FIRST_RELATIONSHIP_ID: u64 = 3000;
pub const TEST_FIRST_METADATA_ID: u64 = 4000;

pub const TEST_MOCK_LIAISON: u64 = 0xd00du64;
pub const TEST_MOCK_EXISTING_CID: u64 = 42;

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

pub struct MockRoles {}
impl traits::Roles<Test> for MockRoles {
    fn is_role_account(_account_id: &<Test as system::Trait>::AccountId) -> bool {
        false
    }

    fn account_has_role(
        account_id: &<Test as system::Trait>::AccountId,
        _role: actors::Role,
    ) -> bool {
        *account_id == TEST_MOCK_LIAISON
    }

    fn random_account_for_role(
        _role: actors::Role,
    ) -> Result<<Test as system::Trait>::AccountId, &'static str> {
        // We "randomly" select an account Id.
        Ok(TEST_MOCK_LIAISON)
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
        *which == TEST_MOCK_EXISTING_CID
    }

    fn get_data_object(
        which: &<Test as data_directory::Trait>::ContentId,
    ) -> Result<data_directory::DataObject<Test>, &'static str> {
        match *which {
            TEST_MOCK_EXISTING_CID => Ok(data_directory::DataObject {
                type_id: 1,
                size: 1234,
                added_at: data_directory::BlockAndTime {
                    block: 10,
                    time: 1024,
                },
                owner: 1,
                liaison: TEST_MOCK_LIAISON,
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
    type Roles = MockRoles;
    type IsActiveDataObjectType = AnyDataObjectTypeIsActive;
    type SchemaId = u64;
}

impl data_object_storage_registry::Trait for Test {
    type Event = MetaEvent;
    type DataObjectStorageRelationshipId = u64;
    type Members = MockMembers;
    type Roles = MockRoles;
    type ContentIdExists = MockContent;
}

impl actors::Trait for Test {
    type Event = MetaEvent;
    type Members = MockMembers;
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

impl balances::Trait for Test {
    type Event = MetaEvent;

    /// The balance of an account.
    type Balance = u32;

    /// A function which is invoked when the free-balance has fallen below the existential deposit and
    /// has been reduced to zero.
    ///
    /// Gives a chance to clean up resources associated with the given account.
    type OnFreeBalanceZero = ();

    /// Handler for when a new account is created.
    type OnNewAccount = ();

    type TransactionPayment = ();
    type DustRemoval = ();
    type TransferPayment = ();
}

impl GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

pub struct ExtBuilder {
    first_data_object_type_id: u64,
    first_content_id: u64,
    first_relationship_id: u64,
    first_metadata_id: u64,
}

impl Default for ExtBuilder {
    fn default() -> Self {
        Self {
            first_data_object_type_id: 1,
            first_content_id: 2,
            first_relationship_id: 3,
            first_metadata_id: 4,
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
    pub fn first_metadata_id(mut self, first_metadata_id: u64) -> Self {
        self.first_metadata_id = first_metadata_id;
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
// pub type TestDataObject = data_directory::DataObject<Test>;
pub type TestDataObjectStorageRegistry = data_object_storage_registry::Module<Test>;
pub type TestActors = actors::Module<Test>;

pub fn with_default_mock_builder<R, F: FnOnce() -> R>(f: F) -> R {
    with_externalities(
        &mut ExtBuilder::default()
            .first_data_object_type_id(TEST_FIRST_DATA_OBJECT_TYPE_ID)
            .first_content_id(TEST_FIRST_CONTENT_ID)
            .first_relationship_id(TEST_FIRST_RELATIONSHIP_ID)
            .first_metadata_id(TEST_FIRST_METADATA_ID)
            .build(),
        || {
            let roles: Vec<actors::Role> = vec![actors::Role::Storage];
            assert!(TestActors::set_available_roles(roles).is_ok(), "");

            f()
        },
    )
}
