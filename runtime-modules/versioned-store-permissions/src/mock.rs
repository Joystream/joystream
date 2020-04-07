#![cfg(test)]

use crate::*;
use crate::{Module, Trait};

use primitives::H256;
use runtime_primitives::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use srml_support::{impl_outer_origin, assert_ok, parameter_types};
use crate::InputValidationLengthConstraint;


pub fn assert_class_props(class_id: ClassId, expected_props: Vec<Property>) {
    let class = TestModule::class_by_id(class_id);
    assert_eq!(class.properties, expected_props);
}

pub fn assert_class_schemas(class_id: ClassId, expected_schema_prop_ids: Vec<Vec<u16>>) {
    let class = TestModule::class_by_id(class_id);
    let schemas: Vec<_> = expected_schema_prop_ids
        .iter()
        .map(|prop_ids| ClassSchema {
            properties: prop_ids.clone(),
        })
        .collect();
    assert_eq!(class.schemas, schemas);
}

impl_outer_origin! {
    pub enum Origin for Runtime {}
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug, Default)]
pub struct Runtime;
parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
}

impl system::Trait for Runtime {
    type Origin = Origin;
    type Index = u64;
    type BlockNumber = u64;
    type Call = ();
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = ();
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
}

impl timestamp::Trait for Runtime {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
}

impl Trait for Runtime {
    type Event = ();
    type Credential = u64;
    type CredentialChecker = MockCredentialChecker;
    type CreateClassPermissionsChecker = MockCreateClassPermissionsChecker;
}

pub const MEMBER_ONE_WITH_CREDENTIAL_ZERO: u64 = 100;
pub const MEMBER_TWO_WITH_CREDENTIAL_ZERO: u64 = 101;
pub const MEMBER_ONE_WITH_CREDENTIAL_ONE: u64 = 102;
pub const MEMBER_TWO_WITH_CREDENTIAL_ONE: u64 = 103;


pub const UNKNOWN_CLASS_ID: ClassId = 111;

pub const UNKNOWN_ENTITY_ID: EntityId = 222;

pub const UNKNOWN_PROP_ID: u16 = 333;

// pub const UNKNOWN_SCHEMA_ID: u16 = 444;

pub const SCHEMA_ID_0: u16 = 0;
pub const SCHEMA_ID_1: u16 = 1;

pub const PRINCIPAL_GROUP_MEMBERS: [[u64; 2]; 2] = [
    [
        MEMBER_ONE_WITH_CREDENTIAL_ZERO,
        MEMBER_TWO_WITH_CREDENTIAL_ZERO,
    ],
    [
        MEMBER_ONE_WITH_CREDENTIAL_ONE,
        MEMBER_TWO_WITH_CREDENTIAL_ONE,
    ],
];

pub struct MockCredentialChecker {}

impl CredentialChecker<Runtime> for MockCredentialChecker {
    fn account_has_credential(
        account_id: &<Runtime as system::Trait>::AccountId,
        credential_id: <Runtime as Trait>::Credential,
    ) -> bool {
        if (credential_id as usize) < PRINCIPAL_GROUP_MEMBERS.len() {
            PRINCIPAL_GROUP_MEMBERS[credential_id as usize]
                .iter()
                .any(|id| *id == *account_id)
        } else {
            false
        }
    }
}

pub const CLASS_PERMISSIONS_CREATOR1: u64 = 200;
pub const CLASS_PERMISSIONS_CREATOR2: u64 = 300;
pub const UNAUTHORIZED_CLASS_PERMISSIONS_CREATOR: u64 = 50;

const CLASS_PERMISSIONS_CREATORS: [u64; 2] =
    [CLASS_PERMISSIONS_CREATOR1, CLASS_PERMISSIONS_CREATOR2];

pub struct MockCreateClassPermissionsChecker {}

impl CreateClassPermissionsChecker<Runtime> for MockCreateClassPermissionsChecker {
    fn account_can_create_class_permissions(
        account_id: &<Runtime as system::Trait>::AccountId,
    ) -> bool {
        CLASS_PERMISSIONS_CREATORS
            .iter()
            .any(|id| *id == *account_id)
    }
}

// This function basically just builds a genesis storage key/value store according to
// our desired mockup.

fn default_versioned_store_genesis_config() -> GenesisConfig<Runtime> {
    GenesisConfig {
        class_by_id: vec![],
        entity_by_id: vec![],
        next_class_id: 1,
        next_entity_id: 1,
        property_name_constraint: InputValidationLengthConstraint {
            min: 1,
            max_min_diff: 49,
        },
        property_description_constraint: InputValidationLengthConstraint {
            min: 0,
            max_min_diff: 500,
        },
        class_name_constraint: InputValidationLengthConstraint {
            min: 1,
            max_min_diff: 49,
        },
        class_description_constraint: InputValidationLengthConstraint {
            min: 0,
            max_min_diff: 500,
        },
    }
}

fn build_test_externalities(
    config: GenesisConfig<Runtime>,
) -> runtime_io::TestExternalities {
    let mut t = system::GenesisConfig::default()
        .build_storage::<Runtime>()
        .unwrap();

    config.assimilate_storage(&mut t).unwrap();

    t.into()
}

pub fn with_test_externalities<R, F: FnOnce() -> R>(f: F) -> R {
    let versioned_store_config = default_versioned_store_genesis_config();
    build_test_externalities(versioned_store_config).execute_with(f)
}

pub fn good_prop_bool() -> Property {
    Property {
        prop_type: PropertyType::Bool,
        required: false,
        name: b"Name of a bool property".to_vec(),
        description: b"Description of a bool property".to_vec(),
    }
}

pub fn good_prop_u32() -> Property {
    Property {
        prop_type: PropertyType::Uint32,
        required: false,
        name: b"Name of a u32 property".to_vec(),
        description: b"Description of a u32 property".to_vec(),
    }
}

pub fn good_prop_text() -> Property {
    Property {
        prop_type: PropertyType::Text(20),
        required: false,
        name: b"Name of a text property".to_vec(),
        description: b"Description of a text property".to_vec(),
    }
}

pub fn new_internal_class_prop(class_id: ClassId) -> Property {
    Property {
        prop_type: PropertyType::Internal(class_id),
        required: false,
        name: b"Name of a internal property".to_vec(),
        description: b"Description of a internal property".to_vec(),
    }
}

pub fn good_class_name() -> Vec<u8> {
    b"Name of a class".to_vec()
}

pub fn good_class_description() -> Vec<u8> {
    b"Description of a class".to_vec()
}

pub fn good_props() -> Vec<Property> {
    vec![good_prop_bool(), good_prop_u32()]
}

pub fn good_prop_ids() -> Vec<u16> {
    vec![0, 1]
}

// pub type System = system::Module;

/// Export module on a test runtime
pub type TestModule = Module<Runtime>;
