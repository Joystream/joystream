#![cfg_attr(not(feature = "std"), no_std)]

use system;
use parity_codec::Codec;
use srml_support::{Parameter};
use runtime_primitives::traits::{SimpleArithmetic, As, Member, MaybeSerializeDebug};

pub trait Members<T: system::Trait> {
    type Id : Parameter + Member + SimpleArithmetic + Codec + Default + Copy
        + As<usize> + As<u64> + MaybeSerializeDebug + PartialEq;

    fn is_active_member(account_id: &T::AccountId) -> bool {
        true
    }

    fn lookup_member_id(account_id: &T::AccountId) -> Result<Self::Id, &'static str> {
        Err("member not found")
    }
}