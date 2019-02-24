#![cfg_attr(not(feature = "std"), no_std)]

use srml_support::{StorageMap, dispatch::Result, decl_module, decl_storage, ensure};
use srml_support::traits::{Currency};
use runtime_primitives::traits::{Zero};
use system::{self, ensure_signed};
use rstd::prelude::*;
use crate::governance::GovernanceCurrency;

pub trait Trait: system::Trait + GovernanceCurrency {}

decl_storage! {
    trait Store for Module<T: Trait> as Memo {
        Memo get(memo) : map T::AccountId => Vec<u8>;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn set_memo(origin, memo: Vec<u8>) {
            let sender = ensure_signed(origin)?;

            ensure!(!T::Currency::total_balance(&sender).is_zero(), "account must have a balance");
            ensure!(memo.len() as u32 <= 4096, "memo too long");

            <Memo<T>>::insert(sender, memo);
        }
    }
}
