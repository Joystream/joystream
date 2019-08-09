#![cfg(test)]

use crate::*;

use primitives::{Blake2Hasher, H256};
use srml_support::{impl_outer_origin};
use crate::{GenesisConfig, Module, Trait};
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

pub const INVLAID_CLASS_ID: ClassId = 111;

pub const INVLAID_ENTITY_ID: EntityId = 222;

pub fn generate_text(len: usize) -> Vec<u8> {
    vec![b'x'; len]
}

pub fn good_class_name() -> Vec<u8> {
    b"Name of the class".to_vec()
}

pub fn good_class_description() -> Vec<u8> {
    b"Description of the class".to_vec()
}

pub fn good_entity_name() -> Vec<u8> {
    b"Name of the entity".to_vec()
}

pub fn good_property_name() -> Vec<u8> {
    b"Name of the property".to_vec()
}

pub fn good_property_description() -> Vec<u8> {
    b"Description of the property".to_vec()
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

pub type RuntimeMap<K, V> = std::vec::Vec<(K, V)>;

pub fn genesis_config(
    class_by_id: &RuntimeMap<ClassId, Class>,
    entity_by_id: &RuntimeMap<EntityId, Entity>,
    next_class_id: u64,
    next_entity_id: u64
) -> GenesisConfig<Runtime> {

    GenesisConfig::<Runtime> {
        class_by_id: class_by_id.clone(),
        entity_by_id: entity_by_id.clone(),
        next_class_id: next_class_id,
        next_entity_id: next_entity_id,
        _genesis_phantom_data: std::marker::PhantomData {}
    }
}

pub fn build_test_externalities(config: GenesisConfig<Runtime>) -> runtime_io::TestExternalities<Blake2Hasher> {
    config
        .build_storage()
        .unwrap()
        .0
        .into()
}

// pub type System = system::Module<Runtime>;

/// Export module on a test runtime
pub type TestModule = Module<Runtime>;
