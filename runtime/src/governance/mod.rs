#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;
use srml_support::traits::{Currency};
use system;

pub mod election;
pub mod council;
pub mod root;
pub mod proposals;

mod stake;
mod sealed_vote;

pub trait GovernanceCurrency: system::Trait {
    type Currency: Currency<<Self as system::Trait>::AccountId>;
}

pub type BalanceOf<T> = <<T as GovernanceCurrency>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

mod mock;