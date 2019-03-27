#![cfg_attr(not(feature = "std"), no_std)]

use crate::storage::data_object_type_registry;
use system;

pub trait IsActiveDataObjectType<T: data_object_type_registry::Trait> {
    fn is_active_data_object_type(which: &T::DataObjectTypeId) -> bool {
        false
    }
}

pub trait IsActiveMember<T: system::Trait> {
    fn is_active_member(account_id: &T::AccountId) -> bool {
        false
    }
}
