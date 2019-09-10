#![cfg(test)]

use crate::*;
use crate::{GenesisConfig, Module, Trait};

use primitives::{Blake2Hasher, H256};
use srml_support::{impl_outer_origin, assert_ok, assert_err};
use runtime_io::with_externalities;
use runtime_primitives::{
    testing::{Digest, DigestItem, Header},
    traits::{BlakeTwo256, IdentityLookup},
    BuildStorage,
};

impl_outer_origin! {
    pub enum Origin for Runtime {}
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Runtime;

impl system::Trait for Runtime {
    type Origin = Origin;
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type Digest = Digest;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = ();
    type Log = DigestItem;
}

impl Trait for Runtime {
    type Event = ();
}

pub const UNKNOWN_CLASS_ID: ClassId = 111;

pub const UNKNOWN_ENTITY_ID: EntityId = 222;

pub const UNKNOWN_PROP_ID: u16 = 333;

// pub const UNKNOWN_SCHEMA_ID: u16 = 444;

pub const SCHEMA_ID_0: u16 = 0;
pub const SCHEMA_ID_1: u16 = 1;

// pub fn generate_text(len: usize) -> Vec<u8> {
//     vec![b'x'; len]
// }

pub fn good_class_name() -> Vec<u8> {
    b"Name of a class".to_vec()
}

pub fn good_class_description() -> Vec<u8> {
    b"Description of a class".to_vec()
}

pub fn good_entity_name() -> Vec<u8> {
    b"Name of an entity".to_vec()
}

impl Property {
    fn required(&self) -> Property {
        let mut new_self = self.clone();
        new_self.required = true;
        new_self
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
        prop_type: PropertyType::Internal(class_id),
        required: false,
        name: b"Name of a internal property".to_vec(),
        description: b"Description of a internal property".to_vec(),
    }
}

pub fn good_props() -> Vec<Property> {
    vec![
        good_prop_bool(),
        good_prop_u32(),
    ]
}

pub fn good_prop_ids() -> Vec<u16> {
    vec![ 0, 1 ]
}

pub fn create_class() -> ClassId {
    let class_id = TestModule::next_class_id();
    assert_ok!(
        TestModule::create_class(
            good_class_name(),
            good_class_description(),
        ),
        class_id
    );
    class_id
}

pub fn bool_prop_value() -> ClassPropertyValue {
    ClassPropertyValue {
        in_class_index: 0,
        value: PropertyValue::Bool(true)
    }
}

pub fn prop_value(index: u16, value: PropertyValue) -> ClassPropertyValue {
    ClassPropertyValue {
        in_class_index: index,
        value: value
    }
}

pub fn create_class_with_schema_and_entity() -> (ClassId, u16, EntityId) {
    let class_id = create_class();
    if let Ok(schema_id) = TestModule::add_class_schema(
        class_id,
        vec![],
        vec![
            good_prop_bool().required(),
            good_prop_u32(),
            new_internal_class_prop(class_id)
        ]
    ) {
        let entity_id = create_entity_of_class(class_id);
        (class_id, schema_id, entity_id)
    } else {
        panic!("This should not happen")
    }
}

pub const PROP_ID_BOOL: u16     = 0;
pub const PROP_ID_U32: u16      = 1;
pub const PROP_ID_INTERNAL: u16 = 2;

pub fn create_entity_with_schema_support() -> EntityId {
    let (_, schema_id, entity_id) = create_class_with_schema_and_entity();
    assert_ok!(
        TestModule::add_schema_support_to_entity(
            entity_id,
            schema_id,
            vec![ prop_value(PROP_ID_BOOL, PropertyValue::Bool(true)) ]
        )
    );
    entity_id
}

pub fn create_entity_of_class(class_id: ClassId) -> EntityId {
    let entity_id = TestModule::next_entity_id();
    assert_ok!(
        TestModule::create_entity(
            class_id,
        ),
        entity_id
    );
    entity_id
}


pub fn assert_class_props(class_id: ClassId, expected_props: Vec<Property>) {
    let class = TestModule::class_by_id(class_id);
    assert_eq!(class.properties, expected_props);
}

pub fn assert_class_schemas(class_id: ClassId, expected_schema_prop_ids: Vec<Vec<u16>>) {
    let class = TestModule::class_by_id(class_id);
    let schemas: Vec<_> = expected_schema_prop_ids.iter().map(|prop_ids|
        ClassSchema { properties: prop_ids.clone() }
    ).collect();
    assert_eq!(class.schemas, schemas);
}

pub fn assert_entity_not_found(result: dispatch::Result) {
    assert_err!(
        result,
        ERROR_ENTITY_NOT_FOUND
    );
}

// This function basically just builds a genesis storage key/value store according to
// our desired mockup.

pub fn default_genesis_config() -> GenesisConfig<Runtime> {
    GenesisConfig::<Runtime> {
        class_by_id: vec![],
        entity_by_id: vec![],
        next_class_id: 1,
        next_entity_id: 1,
        property_name_constraint: InputValidationLengthConstraint {
            min: 1,
            max_min_diff: 49
        },
        property_description_constraint: InputValidationLengthConstraint {
            min: 0,
            max_min_diff: 500
        },
        class_name_constraint: InputValidationLengthConstraint {
            min: 1,
            max_min_diff: 49
        },
        class_description_constraint: InputValidationLengthConstraint {
            min: 0,
            max_min_diff: 500
        },
        entity_name_constraint: InputValidationLengthConstraint {
            min: 1,
            max_min_diff: 99
        },
        _genesis_phantom_data: std::marker::PhantomData {}
    }
}

fn build_test_externalities(config: GenesisConfig<Runtime>) -> runtime_io::TestExternalities<Blake2Hasher> {
    config
        .build_storage()
        .unwrap()
        .0
        .into()
}

pub fn with_test_externalities<R, F: FnOnce() -> R>(f: F) -> R {
    let config = default_genesis_config();
    with_externalities(
        &mut build_test_externalities(config),
        f
    )
}

// pub type System = system::Module<Runtime>;

/// Export module on a test runtime
pub type TestModule = Module<Runtime>;
