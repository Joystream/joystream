#![cfg_attr(not(feature = "std"), no_std)]

use srml_support::traits::{Currency, LockableCurrency};
use system;

pub mod election;
pub mod council;
pub mod proposals;

mod stake;
mod sealed_vote;

pub trait GovernanceCurrency: system::Trait + Sized {
    type Currency: Currency<Self::AccountId> +
		LockableCurrency<Self::AccountId, Moment=Self::BlockNumber>;
}

pub type BalanceOf<T> = <<T as GovernanceCurrency>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

mod mock;