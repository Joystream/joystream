#![cfg_attr(not(feature = "std"), no_std)]

use crate::storage::data_object_type_registry;
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
}

impl<T: system::Trait> Members<T> for () {
    type Id = u32;
    fn is_active_member(account_id: &T::AccountId) -> bool {
        false
    }
    fn lookup_member_id(account_id: &T::AccountId) -> Result<Self::Id, &'static str> {
        Err("member not found")
    }
}

// Roles
pub trait Roles<T: system::Trait> {
    fn is_role_account(account_id: &T::AccountId) -> bool;
}

impl<T: system::Trait> Roles<T> for () {
	fn is_role_account(_who: &T::AccountId) -> bool { false }
}

// Data Object Types
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
