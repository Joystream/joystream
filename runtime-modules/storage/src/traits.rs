use crate::{data_directory, data_object_storage_registry, data_object_type_registry};
use system;

// Storage
pub trait IsActiveDataObjectType<T: data_object_type_registry::Trait> {
    fn is_active_data_object_type(_which: &T::DataObjectTypeId) -> bool;
}

pub trait ContentIdExists<T: data_directory::Trait> {
    fn has_content(_which: &T::ContentId) -> bool;

    fn get_data_object(
        _which: &T::ContentId,
    ) -> Result<data_directory::DataObject<T>, &'static str>;
}

pub trait ContentHasStorage<T: data_object_storage_registry::Trait> {
    fn has_storage_provider(_which: &T::ContentId) -> bool;

    fn is_ready_at_storage_provider(_which: &T::ContentId, _provider: &T::AccountId) -> bool;
}
