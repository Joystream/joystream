#![cfg_attr(not(feature = "std"), no_std)]

use system;

pub trait Members<T: system::Trait> {
    fn is_active_member(account_id: &T::AccountId) -> bool {
        true
    }
}