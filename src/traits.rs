#![cfg_attr(not(feature = "std"), no_std)]

use crate::storage::types;

pub trait IsActiveDataObjectType<T: types::Trait>
{
    fn is_active_data_object_type(which: &T::DataObjectTypeID) -> bool
    {
        false
    }
}
