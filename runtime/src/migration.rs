// Clippy linter warning
#![allow(clippy::redundant_closure_call)] // disable it because of the substrate lib design

use crate::VERSION;
use common::currency::BalanceOf;
use rstd::prelude::*;
use sr_primitives::{print, traits::Zero};
use srml_support::{debug, decl_event, decl_module, decl_storage};

impl<T: Trait> Module<T> {
    /// This method is called from on_initialize() when a runtime upgrade is detected. This
    /// happens when the runtime spec version is found to be higher than the stored value.
    /// Important to note this method should be carefully maintained, because it runs on every runtime
    /// upgrade.
    fn runtime_upgraded() {
        print("Running runtime upgraded handler");

        // Add initialization of modules introduced in new runtime release. Typically this
        // would be any new storage values that need an initial value which would not
        // have been initialized with config() or build() chainspec construction mechanism.
        // Other tasks like resetting values, migrating values etc.

        // Runtime Upgrade Code for going from Rome to Constantinople

        // Create the Council mint. If it fails, we can't do anything about it here.
        if let Err(err) = governance::council::Module::<T>::create_new_council_mint(
            minting::BalanceOf::<T>::zero(),
        ) {
            debug::warn!(
                "Failed to create a mint for council during migration: {:?}",
                err
            );
        }

        // Initialise the proposal system various periods
        proposals_codex::Module::<T>::set_default_config_values();

        Self::deposit_event(RawEvent::Migrated(
            <system::Module<T>>::block_number(),
            VERSION.spec_version,
        ));
    }
}

pub trait Trait:
    system::Trait
    + governance::election::Trait
    + content_working_group::Trait
    + roles::actors::Trait
    + proposals_codex::Trait
{
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Migration {
        /// Records at what runtime spec version the store was initialized. At genesis this will be
        /// initialized to Some(VERSION.spec_version). It is an Option because the first time the module
        /// was introduced was as a runtime upgrade and type was never changed.
        /// When the runtime is upgraded the spec version be updated.
        pub SpecVersion get(spec_version) build(|_config: &GenesisConfig| {
            VERSION.spec_version
        }) : Option<u32>;
    }
}

decl_event! {
    pub enum Event<T> where <T as system::Trait>::BlockNumber {
        Migrated(BlockNumber, u32),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        fn on_initialize(_now: T::BlockNumber) {
            if Self::spec_version().map_or(true, |spec_version| VERSION.spec_version > spec_version) {
                // Mark store version with current version of the runtime
                SpecVersion::put(VERSION.spec_version);

                // Run migrations and store initializers
                Self::runtime_upgraded();

                Self::deposit_event(RawEvent::Migrated(
                    <system::Module<T>>::block_number(),
                    VERSION.spec_version,
                ));
            }
        }
    }
}
