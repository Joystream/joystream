#![cfg_attr(not(feature = "std"), no_std)]

use crate::storage::{data_directory, data_object_storage_registry, data_object_type_registry};
use system;
use parity_codec::Codec;
use srml_support::{Parameter};
use runtime_primitives::traits::{SimpleArithmetic, As, Member, MaybeSerializeDebug};

// Members
pub trait Members<T: system::Trait> {
    type Id : Parameter + Member + SimpleArithmetic + Codec + Default + Copy
        + As<usize> + As<u64> + MaybeSerializeDebug + PartialEq;

    fn is_active_member(account_id: &T::AccountId) -> bool;

    fn lookup_member_id(account_id: &T::AccountId) -> Result<Self::Id, &'static str>;

    fn lookup_account_by_member_id(member_id: Self::Id) -> Result<T::AccountId, &'static str>;
}

impl<T: system::Trait> Members<T> for () {
    type Id = u32;
    fn is_active_member(_account_id: &T::AccountId) -> bool {
        false
    }
    fn lookup_member_id(_account_id: &T::AccountId) -> Result<Self::Id, &'static str> {
        Err("member not found")
    }
    fn lookup_account_by_member_id(_member_id: Self::Id) -> Result<T::AccountId, &'static str> {
        Err("account not found")
    }
}

// Roles
pub trait Roles<T: system::Trait> {
    fn is_role_account(account_id: &T::AccountId) -> bool;
}

impl<T: system::Trait> Roles<T> for () {
	fn is_role_account(_who: &T::AccountId) -> bool { false }
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
