use crate::VERSION;
use sr_primitives::print;
use srml_support::{decl_event, decl_module, decl_storage};
use sudo;
use system;

impl<T: Trait> Module<T> {
    fn runtime_upgraded() {
        print("running runtime initializers...");

        // ...
        // add initialization of modules introduced in new runtime release. This
        // would be any new storage values that need an initial value which would not
        // have been initialized with config() or build() mechanism.
        // ...

        // Create the Council mint
        governance::council::Module::<T>::create_new_council_mint();

        Self::deposit_event(RawEvent::Migrated(
            <system::Module<T>>::block_number(),
            VERSION.spec_version,
        ));
    }
}

pub trait Trait:
    system::Trait
    + storage::data_directory::Trait
    + storage::data_object_storage_registry::Trait
    + forum::Trait
    + sudo::Trait
    + governance::council::Trait
{
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
        fn deposit_event() = default;

        fn on_initialize(_now: T::BlockNumber) {
            if Self::spec_version().map_or(true, |spec_version| VERSION.spec_version > spec_version) {
                // mark store version with current version of the runtime
                SpecVersion::put(VERSION.spec_version);

                // run migrations and store initializers
                Self::runtime_upgraded();
            }
        }
    }
}
