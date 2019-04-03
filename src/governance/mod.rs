#![cfg_attr(not(feature = "std"), no_std)]

use srml_support::traits::{ArithmeticType, Currency};
use system;

pub mod council;
pub mod election;
pub mod proposals;

mod sealed_vote;
mod stake;

pub trait GovernanceCurrency: system::Trait + Sized {
    type Currency: ArithmeticType
        + Currency<<Self as system::Trait>::AccountId, Balance = BalanceOf<Self>>;
}

pub type BalanceOf<T> = <<T as GovernanceCurrency>::Currency as ArithmeticType>::Type;

mod mock;
