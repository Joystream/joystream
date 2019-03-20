#![cfg_attr(not(feature = "std"), no_std)]

use srml_support::{StorageValue, dispatch::Result, decl_module, decl_storage, decl_event, ensure};
use system;
use rstd::prelude::*;
use runtime_io::print;
use crate::{VERSION};
use crate::membership::registry;

pub trait Trait: system::Trait + registry::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Migration {
        /// Records at what runtime spec version the store was initialized. This allows the runtime
        /// to know when to run initialize code if it was installed as an update.
        pub SpecVersion get(spec_version) build(|_| Some(VERSION.spec_version)) : Option<u32>;
    }
}

decl_event! {
    pub enum Event<T> where <T as system::Trait>::BlockNumber {
        Migrated(BlockNumber, u32),
    }
}

// When preparing a new major runtime release version bump this value to match it and update
// the initialization code in runtime_initialization(). Because of the way substrate runs runtime code
// the runtime doesn't need to maintain any logic for old migrations. All knowledge about state of the chain and runtime
// prior to the new runtime taking over is implicit in the migration code implementation. If assumptions are incorrect
// behaviour is undefined.
const MIGRATION_FOR_SPEC_VERSION: u32 = 5;

impl<T: Trait> Module<T> {
    fn runtime_initialization() {
        if VERSION.spec_version != MIGRATION_FOR_SPEC_VERSION { return }

        print("running runtime initializers");

        <registry::Module<T>>::initialize_storage();

        // ...
        // add initialization of other modules introduced in this runtime
        // ...

        Self::deposit_event(RawEvent::Migrated(<system::Module<T>>::block_number(), VERSION.spec_version));
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        fn on_initialise(_now: T::BlockNumber) {
            if Self::spec_version().map_or(true, |spec_version| VERSION.spec_version > spec_version) {
                // mark store version with current version of the runtime
                <SpecVersion<T>>::put(VERSION.spec_version);

                // run migrations and store initializers
                Self::runtime_initialization();
            }
        }
    }
}
