
use crate::storage;
use crate::forum;
use crate::VERSION;
use rstd::prelude::*;
use runtime_io::print;
use srml_support::{decl_event, decl_module, decl_storage, StorageMap, StorageValue};
use sudo;
use system;

// When preparing a new major runtime release version bump this value to match it and update
// the initialization code in runtime_initialization(). Because of the way substrate runs runtime code
// the runtime doesn't need to maintain any logic for old migrations. All knowledge about state of the chain and runtime
// prior to the new runtime taking over is implicit in the migration code implementation. If assumptions are incorrect
// behaviour is undefined.
const MIGRATION_FOR_SPEC_VERSION: u32 = 4;

impl<T: Trait> Module<T> {
    fn runtime_initialization() {
        if VERSION.spec_version != MIGRATION_FOR_SPEC_VERSION {
            return;
        }

        print("running runtime initializers");

        // ...
        // add initialization of other modules introduced in this runtime
        // ...

        Self::initialize_forum_module();

        Self::initialize_storage_module();

        Self::deposit_event(RawEvent::Migrated(
            <system::Module<T>>::block_number(),
            VERSION.spec_version,
        ));
    }

    fn initialize_forum_module() {
        // next id's
        <forum::NextCategoryId<T>>::put(1);
        <forum::NextThreadId<T>>::put(1);
        <forum::NextPostId<T>>::put(1);

        // sudo key will be used as initial forum sudo key
        <forum::ForumSudo<T>>::put(<sudo::Module<T>>::key().clone());

        // input validation constraints
        <forum::CategoryTitleConstraint<T>>::put(Self::create_input_validation_length_constraint(
            10, 90,
        ));
        <forum::CategoryDescriptionConstraint<T>>::put(
            Self::create_input_validation_length_constraint(10, 490),
        );
        <forum::ThreadTitleConstraint<T>>::put(Self::create_input_validation_length_constraint(
            10, 90,
        ));
        <forum::PostTextConstraint<T>>::put(Self::create_input_validation_length_constraint(
            10, 990,
        ));
        <forum::ThreadModerationRationaleConstraint<T>>::put(
            Self::create_input_validation_length_constraint(10, 290),
        );
        <forum::PostModerationRationaleConstraint<T>>::put(
            Self::create_input_validation_length_constraint(10, 290),
        );
    }

    fn create_input_validation_length_constraint(
        min: u16,
        max_min_diff: u16,
    ) -> forum::InputValidationLengthConstraint {
        return forum::InputValidationLengthConstraint { min, max_min_diff };
    }

    fn initialize_storage_module() {
        // remove all content
        for content_id in <storage::data_directory::KnownContentIds<T>>::get().iter() {
            <storage::data_directory::DataObjectByContentId<T>>::remove(content_id);
            <storage::data_directory::MetadataByContentId<T>>::remove(content_id);
            <storage::data_object_storage_registry::RelationshipsByContentId<T>>::remove(
                content_id,
            );
        }
        <storage::data_directory::KnownContentIds<T>>::put(vec![]);
    }
}

pub trait Trait:
    system::Trait
    + storage::data_directory::Trait
    + storage::data_object_storage_registry::Trait
    + forum::Trait
    + sudo::Trait
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
        fn deposit_event<T>() = default;

        fn on_initialize(_now: T::BlockNumber) {
            if Self::spec_version().map_or(true, |spec_version| VERSION.spec_version > spec_version) {
                // mark store version with current version of the runtime
                <SpecVersion<T>>::put(VERSION.spec_version);

                // run migrations and store initializers
                Self::runtime_initialization();
            }
        }
    }
}
