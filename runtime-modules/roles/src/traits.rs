use crate::actors;

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
