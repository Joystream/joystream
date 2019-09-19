// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;

use codec::{Decode, Encode};
use runtime_primitives::traits::{AccountIdConversion, Zero};
use runtime_primitives::ModuleId;
use srml_support::traits::{Currency, Get};
use srml_support::{
    decl_event, decl_module, decl_storage, dispatch, ensure, StorageMap, StorageValue,
};
use system;

mod mock;

pub type BalanceOf<T> =
    <<T as Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

pub trait Trait: system::Trait + Sized {
    /// The currency that is managed by the module
    type Currency: Currency<Self::AccountId>;

    type StakePoolId: Get<[u8; 8]>;
}

decl_storage! {
    trait Store for Module<T: Trait> as StakePool {

    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn on_finalize(now: T::BlockNumber) {}
    }
}

impl<T: Trait> Module<T> {
    /// The account ID of the stake pool.
    ///
    /// This actually does computation. If you need to keep using it, then make sure you cache the
    /// value and only call this once.
    pub fn account_id() -> T::AccountId {
        // MODULE_ID.into_account()
        ModuleId(T::StakePoolId::get()).into_account()
    }

    pub fn balance() -> BalanceOf<T> {
        T::Currency::free_balance(&Self::account_id())
    }
}
