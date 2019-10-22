use crate::roles::actors;
use crate::storage::{data_directory, data_object_storage_registry, data_object_type_registry};
use system;

// Roles
pub trait Roles<T: system::Trait> {
    fn is_role_account(account_id: &T::AccountId) -> bool;

    fn account_has_role(account_id: &T::AccountId, role: actors::Role) -> bool;

    // If available, return a random account ID for the given role.
    fn random_account_for_role(role: actors::Role) -> Result<T::AccountId, &'static str>;
}

impl<T: system::Trait> Roles<T> for () {
    fn is_role_account(_who: &T::AccountId) -> bool {
        false
    }

    fn account_has_role(_account_id: &T::AccountId, _role: actors::Role) -> bool {
        false
    }

    fn random_account_for_role(_role: actors::Role) -> Result<T::AccountId, &'static str> {
        Err("not implemented")
    }
}

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
