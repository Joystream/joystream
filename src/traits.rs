#![cfg_attr(not(feature = "std"), no_std)]

use crate::storage::type_registry;

pub trait IsActiveDataObjectType<T: type_registry::Trait>
{
    fn is_active_data_object_type(which: &T::DataObjectTypeID) -> bool
    {
        false
    }
}
