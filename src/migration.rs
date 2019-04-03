use crate::governance::BalanceOf;
use crate::membership::members;
use crate::roles::actors;
use crate::VERSION;
use rstd::prelude::*;
use runtime_io::print;
use runtime_primitives::traits::As;
use srml_support::{decl_event, decl_module, decl_storage, StorageValue};
use system;

// When preparing a new major runtime release version bump this value to match it and update
// the initialization code in runtime_initialization(). Because of the way substrate runs runtime code
// the runtime doesn't need to maintain any logic for old migrations. All knowledge about state of the chain and runtime
// prior to the new runtime taking over is implicit in the migration code implementation. If assumptions are incorrect
// behaviour is undefined.
const MIGRATION_FOR_SPEC_VERSION: u32 = 5;

impl<T: Trait> Module<T> {
    fn runtime_initialization() {
        if VERSION.spec_version != MIGRATION_FOR_SPEC_VERSION {
            return;
        }

        print("running runtime initializers");

        <members::Module<T>>::initialize_storage();

        // Initialize Storage provider role parameters
        let _ = <actors::Module<T>>::set_role_parameters(
            actors::Role::Storage,
            actors::RoleParameters {
                min_stake: BalanceOf::<T>::sa(3000),
                max_actors: 10,
                reward: BalanceOf::<T>::sa(10),
                reward_period: T::BlockNumber::sa(600),
                unbonding_period: T::BlockNumber::sa(600),
                entry_request_fee: BalanceOf::<T>::sa(50),

                // not currently used
                min_actors: 5,
                bonding_period: T::BlockNumber::sa(600),
                min_service_period: T::BlockNumber::sa(600),
                startup_grace_period: T::BlockNumber::sa(600),
            },
        );
        let _ = <actors::Module<T>>::set_available_roles(vec![actors::Role::Storage]);

        // ...
        // add initialization of other modules introduced in this runtime
        // ...

        Self::deposit_event(RawEvent::Migrated(
            <system::Module<T>>::block_number(),
            VERSION.spec_version,
        ));
    }
}

pub trait Trait: system::Trait + members::Trait + actors::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Migration {
        /// Records at what runtime spec version the store was initialized. This allows the runtime
        /// to know when to run initialize code if it was installed as an update.
        pub SpecVersion get(spec_version) build(|_| VERSION.spec_version) : Option<u32>;
    }
}

decl_event! {
    pub enum Event<T> where <T as system::Trait>::BlockNumber {
        Migrated(BlockNumber, u32),
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
