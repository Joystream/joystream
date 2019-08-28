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

// pub fn good_schema() -> ClassSchema {
//     ClassSchema { properties: vec![ 0, 1, 2 ] }
// }

// pub fn good_schemas() -> Vec<ClassSchema> {
//     vec![
//         ClassSchema { properties: vec![ 0, 1 ] },
//         ClassSchema { properties: vec![ 0, 1, 2 ] },
//         ClassSchema { properties: vec![ 1, 2, 3 ] },
//     ]
// }

// pub fn good_schema_indices() -> Vec<u16> {
//     vec![ 0, 1, 2 ]
// }

// pub fn good_property_values() -> Vec<(u16, PropertyValue)> {
//     vec![
//         (0, PropertyValue::Bool(true)),
//         (1, PropertyValue::Uint32(123u32)),
//         (2, PropertyValue::Text(b"Small text".to_vec())),
//     ]
// }

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

pub fn create_entity() -> EntityId {
    let class_id = create_class();
    let entity_id = TestModule::next_entity_id();
    assert_ok!(
        TestModule::create_entity(
            class_id,
            good_entity_name(),
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
