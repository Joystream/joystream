#![cfg_attr(not(feature = "std"), no_std)]

use srml_support::{StorageMap, decl_module, decl_storage, decl_event, ensure};
use srml_support::traits::{Currency};
use runtime_primitives::traits::{Zero};
use system::{self, ensure_signed};
use rstd::prelude::*;
use crate::governance::GovernanceCurrency;

pub trait Trait: system::Trait + GovernanceCurrency {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Memo {
        Memo get(memo) : map T::AccountId => Vec<u8>;
        MaxMemoLength get(max_memo_length) : u32 = 4096;
    }
}

decl_event! {
    pub enum Event<T> where <T as system::Trait>::AccountId {
        MemoUpdated(AccountId),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        fn update_memo(origin, memo: Vec<u8>) {
            let sender = ensure_signed(origin)?;

            ensure!(!T::Currency::total_balance(&sender).is_zero(), "account must have a balance");
            ensure!(memo.len() as u32 <= Self::max_memo_length(), "memo too long");

            <Memo<T>>::insert(sender.clone(), memo);
            Self::deposit_event(RawEvent::MemoUpdated(sender));
        }
    }
}
