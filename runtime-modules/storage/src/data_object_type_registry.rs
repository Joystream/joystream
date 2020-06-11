//! # Data object type registry module
//! Data object type registry module for the Joystream platform allows to set constraints for the data objects. All extrinsics require leader.
//!
//! ## Comments
//!
//! Data object type registry module uses  working group module to authorize actions. Only leader can
//! call extrinsics.
//!
//! ## Supported extrinsics
//!
//! - [register_data_object_type](./struct.Module.html#method.register_data_object_type) - Registers the new data object type.
//! - [update_data_object_type](./struct.Module.html#method.update_data_object_type)- Updates existing data object type.
//! - [activate_data_object_type](./struct.Module.html#method.activate_data_object_type) -  Activates existing data object type.
//! - [deactivate_data_object_type](./struct.Module.html#method.deactivate_data_object_type) -  Deactivates existing data object type.
//!

// Clippy linter requirement.
// Disable it because of the substrate lib design. Example:
//   NextDataObjectTypeId get(next_data_object_type_id) build(|config: &GenesisConfig<T>|
#![allow(clippy::redundant_closure_call)]

// Do not delete! Cannot be uncommented by default, because of Parity decl_module! issue.
//#![warn(missing_docs)]

use crate::StorageWorkingGroup;
use codec::{Codec, Decode, Encode};
use rstd::prelude::*;
use sr_primitives::traits::{MaybeSerialize, Member, SimpleArithmetic};
use srml_support::{decl_error, decl_event, decl_module, decl_storage, Parameter};

const DEFAULT_TYPE_DESCRIPTION: &str = "Default data object type for audio and video content.";
const DEFAULT_FIRST_DATA_OBJECT_TYPE_ID: u32 = 1;

/// The _Data object type registry_ main _Trait_.
pub trait Trait: system::Trait + working_group::Trait<working_group::Instance2> {
    /// _Data object type registry_ event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// _Data object type id_ type
    type DataObjectTypeId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;
}

decl_error! {
    /// _Data object type registry_ module predefined errors
    pub enum Error {
        /// Data Object Type with the given ID not found.
        DataObjectTypeNotFound,

        /// Require root origin in extrinsics
        RequireRootOrigin,
    }
}

impl From<system::Error> for Error {
    fn from(error: system::Error) -> Self {
        match error {
            system::Error::Other(msg) => Error::Other(msg),
            system::Error::RequireRootOrigin => Error::RequireRootOrigin,
            _ => Error::Other(error.into()),
        }
    }
}

impl From<working_group::Error> for Error {
    fn from(error: working_group::Error) -> Self {
        match error {
            working_group::Error::Other(msg) => Error::Other(msg),
            _ => Error::Other(error.into()),
        }
    }
}

/// Contains description and constrains for the data object.
#[derive(Clone, Encode, Decode, PartialEq, Debug)]
pub struct DataObjectType {
    /// Data object description.
    pub description: Vec<u8>,

    /// Active/Disabled flag.
    pub active: bool,
}

impl Default for DataObjectType {
    fn default() -> Self {
        DataObjectType {
            description: DEFAULT_TYPE_DESCRIPTION.as_bytes().to_vec(),
            active: true,
        }
    }
}

decl_storage! {
    trait Store for Module<T: Trait> as DataObjectTypeRegistry {
        /// Data object type ids should start at this value.
        pub FirstDataObjectTypeId get(first_data_object_type_id) config(first_data_object_type_id):
            T::DataObjectTypeId = T::DataObjectTypeId::from(DEFAULT_FIRST_DATA_OBJECT_TYPE_ID);

        /// Provides id counter for the data object types.
        pub NextDataObjectTypeId get(next_data_object_type_id) build(|config: &GenesisConfig<T>|
            config.first_data_object_type_id): T::DataObjectTypeId = T::DataObjectTypeId::from(DEFAULT_FIRST_DATA_OBJECT_TYPE_ID);

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

        /// Predefined errors
        type Error = Error;

        fn on_initialize() {
            // Create a default data object type if it was not created yet.
            if !<DataObjectTypes<T>>::exists(Self::first_data_object_type_id()) {
                let do_type: DataObjectType = DataObjectType::default();
                let new_type_id = Self::next_data_object_type_id();

                <DataObjectTypes<T>>::insert(new_type_id, do_type);
                <NextDataObjectTypeId<T>>::mutate(|n| { *n += T::DataObjectTypeId::from(1); });
            }
        }

        /// Registers the new data object type. Requires leader privileges.
        pub fn register_data_object_type(origin, data_object_type: DataObjectType) {
            <StorageWorkingGroup<T>>::ensure_origin_is_active_leader(origin)?;

            let new_do_type_id = Self::next_data_object_type_id();
            let do_type: DataObjectType = DataObjectType {
                description: data_object_type.description.clone(),
                active: data_object_type.active,
            };

            //
            // == MUTATION SAFE ==
            //

            <DataObjectTypes<T>>::insert(new_do_type_id, do_type);
            <NextDataObjectTypeId<T>>::mutate(|n| { *n += T::DataObjectTypeId::from(1); });

            Self::deposit_event(RawEvent::DataObjectTypeRegistered(new_do_type_id));
        }

        /// Updates existing data object type. Requires leader privileges.
        pub fn update_data_object_type(origin, id: T::DataObjectTypeId, data_object_type: DataObjectType) {
            <StorageWorkingGroup<T>>::ensure_origin_is_active_leader(origin)?;

            let mut do_type = Self::ensure_data_object_type(id)?;

            do_type.description = data_object_type.description.clone();
            do_type.active = data_object_type.active;

            //
            // == MUTATION SAFE ==
            //

            <DataObjectTypes<T>>::insert(id, do_type);

            Self::deposit_event(RawEvent::DataObjectTypeUpdated(id));
        }

        /// Activates existing data object type. Requires leader privileges.
        pub fn activate_data_object_type(origin, id: T::DataObjectTypeId) {
            <StorageWorkingGroup<T>>::ensure_origin_is_active_leader(origin)?;

            let mut do_type = Self::ensure_data_object_type(id)?;

            do_type.active = true;

            //
            // == MUTATION SAFE ==
            //

            <DataObjectTypes<T>>::insert(id, do_type);

            Self::deposit_event(RawEvent::DataObjectTypeUpdated(id));
        }

        /// Deactivates existing data object type. Requires leader privileges.
        pub fn deactivate_data_object_type(origin, id: T::DataObjectTypeId) {
            <StorageWorkingGroup<T>>::ensure_origin_is_active_leader(origin)?;

            let mut do_type = Self::ensure_data_object_type(id)?;

            do_type.active = false;

            //
            // == MUTATION SAFE ==
            //

            <DataObjectTypes<T>>::insert(id, do_type);

            Self::deposit_event(RawEvent::DataObjectTypeUpdated(id));
        }
    }
}

impl<T: Trait> Module<T> {
    fn ensure_data_object_type(id: T::DataObjectTypeId) -> Result<DataObjectType, Error> {
        Self::data_object_types(&id).ok_or(Error::DataObjectTypeNotFound)
    }
}

/// Active data object type validator trait.
pub trait IsActiveDataObjectType<T: Trait> {
    /// Ensures that data object type with given id is active.
    fn is_active_data_object_type(id: &T::DataObjectTypeId) -> bool;
}

impl<T: Trait> IsActiveDataObjectType<T> for Module<T> {
    fn is_active_data_object_type(id: &T::DataObjectTypeId) -> bool {
        match Self::ensure_data_object_type(*id) {
            Ok(do_type) => do_type.active,
            Err(_err) => false,
        }
    }
}
