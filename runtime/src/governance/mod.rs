#![cfg_attr(not(feature = "std"), no_std)]

use srml_support::traits::{Currency, ArithmeticType};
use system;

pub mod election;
pub mod council;
pub mod proposals;

mod stake;
mod sealed_vote;

pub trait GovernanceCurrency: system::Trait + Sized {
    type Currency: ArithmeticType + Currency<<Self as system::Trait>::AccountId, Balance=BalanceOf<Self>>;
}

pub type BalanceOf<T> = <<T as GovernanceCurrency>::Currency as ArithmeticType>::Type;

mod mock;