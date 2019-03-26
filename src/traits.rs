#![cfg_attr(not(feature = "std"), no_std)]

use crate::storage::data_object_type_registry;

pub trait IsActiveDataObjectType<T: data_object_type_registry::Trait>
{
    fn is_active_data_object_type(which: &T::DataObjectTypeID) -> bool
    {
        false
    }
}
