#![cfg_attr(not(feature = "std"), no_std)]

use crate::storage::{data_object_type_registry, data_directory, data_object_storage_registry};
use system;

// Storage

pub trait IsActiveDataObjectType<T: data_object_type_registry::Trait> {
    fn is_active_data_object_type(_which: &T::DataObjectTypeId) -> bool {
        false
    }
}

pub trait ContentIdExists<T: data_directory::Trait> {
    fn has_content(_which: &T::ContentId) -> bool {
        false
    }

    fn get_data_object(_which: &T::ContentId) -> Result<data_directory::DataObject<T>,  &'static str> {
        Err("not implemented")
    }
}

pub trait ContentHasStorage<T: data_object_storage_registry::Trait> {
    fn has_storage_provider(_which: &T::ContentId) -> bool {
        false
    }

    fn is_ready_at_storage_provider(_which: &T::ContentId, _provider: &T::AccountId) -> bool {
        false
    }
}

// Membership

pub trait IsActiveMember<T: system::Trait> {
    fn is_active_member(_account_id: &T::AccountId) -> bool {
        false
    }
}
