//! # Data object type registry module
//! Data object type registry module for the Joystream platform.
//! It allows to set constraints for the data objects. All extrinsics require leader
//!
//! ## Comments
//!
//! Data object type registry module uses bureaucracy module to authorize actions. Only leader can
//! call extrinsics.
//!
//! ## Supported extrinsics
//!
//! - [register_data_object_type](./struct.Module.html#method.register_data_object_type) - Registers the new data object type.
//! - [update_data_object_type](./struct.Module.html#method.update_data_object_type)- Updates existing data object type.
//! - [activate_data_object_type](./struct.Module.html#method.activate_data_object_type) -  Activates existing data object type.
//! - [deactivate_data_object_type](./struct.Module.html#method.deactivate_data_object_type) -  Deactivates existing data object type.
//!

// Clippy linter requirement
// disable it because of the substrate lib design
// example:   NextDataObjectTypeId get(next_data_object_type_id) build(|config: &GenesisConfig<T>|
#![allow(clippy::redundant_closure_call)]

use crate::traits;
use codec::{Codec, Decode, Encode};
use rstd::prelude::*;
use sr_primitives::traits::{MaybeSerialize, Member, SimpleArithmetic};
use srml_support::{decl_event, decl_module, decl_storage, Parameter};

// Alias for storage working group bureaucracy
pub(crate) type StorageBureaucracy<T> = bureaucracy::Module<T, bureaucracy::Instance2>;

/// The _Data object type registry_ main _Trait_
pub trait Trait: system::Trait + bureaucracy::Trait<bureaucracy::Instance2> {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type DataObjectTypeId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;
}

// TODO: migrate to the Substate error style
const MSG_DO_TYPE_NOT_FOUND: &str = "Data Object Type with the given ID not found.";
const DEFAULT_TYPE_DESCRIPTION: &str = "Default data object type for audio and video content.";

const DEFAULT_TYPE_ACTIVE: bool = true;
const CREATE_DETAULT_TYPE: bool = true;
const DEFAULT_FIRST_DATA_OBJECT_TYPE_ID: u32 = 1;

/// Contains description and constrains for the data object.
#[derive(Clone, Encode, Decode, PartialEq, Debug)]
pub struct DataObjectType {
    /// Data object description.
    pub description: Vec<u8>,

    /// Active/Disabled flag.
    pub active: bool,
    // TODO in future releases
    // - maximum size
    // - replication factor
    // - storage tranches (empty is ok)
}

impl Default for DataObjectType {
    fn default() -> Self {
        DataObjectType {
            description: DEFAULT_TYPE_DESCRIPTION.as_bytes().to_vec(),
            active: DEFAULT_TYPE_ACTIVE,
        }
    }
}

decl_storage! {
    trait Store for Module<T: Trait> as DataObjectTypeRegistry {

        // TODO hardcode data object type for ID 1

        /// Data object type ids should start at this value.
        pub FirstDataObjectTypeId get(first_data_object_type_id) config(first_data_object_type_id): T::DataObjectTypeId = T::DataObjectTypeId::from(DEFAULT_FIRST_DATA_OBJECT_TYPE_ID);

        /// Provides id counter for the data object types.
        pub NextDataObjectTypeId get(next_data_object_type_id) build(|config: &GenesisConfig<T>| config.first_data_object_type_id): T::DataObjectTypeId = T::DataObjectTypeId::from(DEFAULT_FIRST_DATA_OBJECT_TYPE_ID);

        /// Mapping of Data object types.
        pub DataObjectTypes get(data_object_types): map T::DataObjectTypeId => Option<DataObjectType>;
    }
}

decl_event! {
    /// _Data object type registry_ events
    pub enum Event<T> where
        <T as Trait>::DataObjectTypeId {
        /// Emits on the data object type registration.
        /// Params:
        /// - Id of the new data object type.
        DataObjectTypeRegistered(DataObjectTypeId),

        /// Emits on the data object type update.
        /// Params:
        /// - Id of the updated data object type.
        DataObjectTypeUpdated(DataObjectTypeId),
    }
}

decl_module! {
    /// _Data object type registry_ substrate module.
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Default deposit_event() handler
        fn deposit_event() = default;

        fn on_initialize() {
            // Create a default data object type if it was not created yet.
            if CREATE_DETAULT_TYPE && !<DataObjectTypes<T>>::exists(Self::first_data_object_type_id()) {
                let do_type: DataObjectType = DataObjectType::default();
                let new_type_id = Self::next_data_object_type_id();

                <DataObjectTypes<T>>::insert(new_type_id, do_type);
                <NextDataObjectTypeId<T>>::mutate(|n| { *n += T::DataObjectTypeId::from(1); });
            }
        }

        /// Registers the new data object type. Requires leader privileges.
        pub fn register_data_object_type(origin, data_object_type: DataObjectType) {
            <StorageBureaucracy<T>>::ensure_origin_is_active_leader(origin)?;

            let new_do_type_id = Self::next_data_object_type_id();
            let do_type: DataObjectType = DataObjectType {
                description: data_object_type.description.clone(),
                active: data_object_type.active,
            };

            <DataObjectTypes<T>>::insert(new_do_type_id, do_type);
            <NextDataObjectTypeId<T>>::mutate(|n| { *n += T::DataObjectTypeId::from(1); });

            Self::deposit_event(RawEvent::DataObjectTypeRegistered(new_do_type_id));
        }

        /// Updates existing data object type. Requires leader privileges.
        pub fn update_data_object_type(origin, id: T::DataObjectTypeId, data_object_type: DataObjectType) {
            <StorageBureaucracy<T>>::ensure_origin_is_active_leader(origin)?;

            let mut do_type = Self::ensure_data_object_type(id)?;

            do_type.description = data_object_type.description.clone();
            do_type.active = data_object_type.active;

            <DataObjectTypes<T>>::insert(id, do_type);

            Self::deposit_event(RawEvent::DataObjectTypeUpdated(id));
        }

        /// Activates existing data object type. Requires leader privileges.
        pub fn activate_data_object_type(origin, id: T::DataObjectTypeId) {
            <StorageBureaucracy<T>>::ensure_origin_is_active_leader(origin)?;

            let mut do_type = Self::ensure_data_object_type(id)?;

            do_type.active = true;

            <DataObjectTypes<T>>::insert(id, do_type);

            Self::deposit_event(RawEvent::DataObjectTypeUpdated(id));
        }

        /// Deactivates existing data object type. Requires leader privileges.
        pub fn deactivate_data_object_type(origin, id: T::DataObjectTypeId) {
            <StorageBureaucracy<T>>::ensure_origin_is_active_leader(origin)?;

            let mut do_type = Self::ensure_data_object_type(id)?;

            do_type.active = false;

            <DataObjectTypes<T>>::insert(id, do_type);

            Self::deposit_event(RawEvent::DataObjectTypeUpdated(id));
        }
    }
}

impl<T: Trait> Module<T> {
    fn ensure_data_object_type(id: T::DataObjectTypeId) -> Result<DataObjectType, &'static str> {
        Self::data_object_types(&id).ok_or(MSG_DO_TYPE_NOT_FOUND)
    }
}

impl<T: Trait> traits::IsActiveDataObjectType<T> for Module<T> {
    fn is_active_data_object_type(which: &T::DataObjectTypeId) -> bool {
        match Self::ensure_data_object_type(*which) {
            Ok(do_type) => do_type.active,
            Err(_err) => false,
        }
    }
}
