#![cfg(test)]

use crate::*;

use crate::InputValidationLengthConstraint;
use primitives::H256;
use runtime_primitives::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use srml_support::{assert_err, assert_ok, impl_outer_origin, parameter_types};

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

pub const PROP_ID_BOOL: u16 = 0;
pub const PROP_ID_U32: u16 = 1;
pub const PROP_ID_INTERNAL: u16 = 2;

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

pub const CLASS_PERMISSIONS_CREATOR1: u64 = 200;
pub const CLASS_PERMISSIONS_CREATOR2: u64 = 300;
pub const UNAUTHORIZED_CLASS_PERMISSIONS_CREATOR: u64 = 50;

const CLASS_PERMISSIONS_CREATORS: [u64; 2] =
    [CLASS_PERMISSIONS_CREATOR1, CLASS_PERMISSIONS_CREATOR2];

impl_outer_origin! {
    pub enum Origin for Runtime {}
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, Default, PartialEq, Eq, Debug)]
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
    type Credential = u64;
    type CredentialChecker = MockCredentialChecker;
    type CreateClassPermissionsChecker = MockCreateClassPermissionsChecker;
}

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

fn build_test_externalities(config: GenesisConfig<Runtime>) -> runtime_io::TestExternalities {
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

impl Property {
    fn required(&self) -> Property {
        let mut new_self = self.clone();
        new_self.required = true;
        new_self
    }
}

pub fn assert_class_props(class_id: ClassId, expected_props: Vec<Property>) {
    let class = TestModule::class_by_id(class_id);
    assert_eq!(class.properties, expected_props);
}

pub fn assert_class_schemas(class_id: ClassId, expected_schema_prop_ids: Vec<Vec<u16>>) {
    let class = TestModule::class_by_id(class_id);
    let schemas: Vec<_> = expected_schema_prop_ids
        .iter()
        .map(|prop_ids| Schema::new(prop_ids.to_owned()))
        .collect();
    assert_eq!(class.schemas, schemas);
}

pub fn assert_entity_not_found(result: dispatch::Result) {
    assert_err!(result, ERROR_ENTITY_NOT_FOUND);
}

pub fn simple_test_schema() -> Vec<Property> {
    vec![Property {
        prop_type: PropertyType::Int64,
        required: false,
        name: b"field1".to_vec(),
        description: b"Description field1".to_vec(),
    }]
}

pub fn simple_test_entity_property_values() -> Vec<ClassPropertyValue> {
    vec![ClassPropertyValue {
        in_class_index: 0,
        value: PropertyValue::Int64(1337),
    }]
}

pub fn create_simple_class(permissions: ClassPermissionsType<Runtime>) -> ClassId {
    let class_id = TestModule::next_class_id();
    assert_ok!(TestModule::create_class(
        Origin::signed(CLASS_PERMISSIONS_CREATOR1),
        b"class_name_1".to_vec(),
        b"class_description_1".to_vec(),
        permissions
    ));
    class_id
}

pub fn create_simple_class_with_default_permissions() -> ClassId {
    create_simple_class(Default::default())
}

pub fn class_minimal() -> ClassPermissionsType<Runtime> {
    ClassPermissions {
        // remove special permissions for entity maintainers
        entity_permissions: EntityPermissions {
            maintainer_has_all_permissions: false,
            ..Default::default()
        },
        ..Default::default()
    }
}

pub fn class_minimal_with_admins(
    admins: Vec<<Runtime as Trait>::Credential>,
) -> ClassPermissionsType<Runtime> {
    ClassPermissions {
        admins: admins.into(),
        ..class_minimal()
    }
}

pub fn next_entity_id() -> EntityId {
    TestModule::next_entity_id()
}

pub fn create_entity_of_class(class_id: ClassId) -> EntityId {
    let entity_id = TestModule::next_entity_id();
    assert_eq!(TestModule::perform_entity_creation(class_id,), entity_id);
    entity_id
}

pub fn create_entity_with_schema_support() -> EntityId {
    let (_, schema_id, entity_id) = create_class_with_schema_and_entity();
    assert_ok!(TestModule::add_entity_schema_support(
        entity_id,
        schema_id,
        vec![prop_value(PROP_ID_BOOL, PropertyValue::Bool(true))]
    ));
    entity_id
}

pub fn create_class_with_schema_and_entity() -> (ClassId, u16, EntityId) {
    let class_id = create_simple_class_with_default_permissions();
    if let Ok(schema_id) = TestModule::append_class_schema(
        class_id,
        vec![],
        vec![
            good_prop_bool().required(),
            good_prop_u32(),
            new_internal_class_prop(class_id),
        ],
    ) {
        let entity_id = create_entity_of_class(class_id);
        (class_id, schema_id, entity_id)
    } else {
        panic!("This should not happen")
    }
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
        prop_type: PropertyType::Reference(class_id),
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

pub fn bool_prop_value() -> ClassPropertyValue {
    ClassPropertyValue {
        in_class_index: 0,
        value: PropertyValue::Bool(true),
    }
}

pub fn prop_value(index: u16, value: PropertyValue) -> ClassPropertyValue {
    ClassPropertyValue {
        in_class_index: index,
        value: value,
    }
}

// pub type System = system::Module;

/// Export module on a test runtime
pub type TestModule = Module<Runtime>;
