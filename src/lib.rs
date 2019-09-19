// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;

use codec::{Decode, Encode};
use srml_support::{
    decl_event, decl_module, decl_storage, dispatch, ensure, StorageMap, StorageValue,
};

use minting;
use system;

pub trait Trait: system::Trait + minting::Trait + Sized {}

decl_storage! {
    trait Store for Module<T: Trait> as RecurringReward {

    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn on_finalize(now: T::BlockNumber) {}
    }
}

impl<T: Trait> Module<T> {}
