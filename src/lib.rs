// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(feature = "std")]
use serde_derive::{Deserialize, Serialize};

use rstd::prelude::*;

use codec::{Decode, Encode};
use srml_support::{
    decl_event, decl_module, decl_storage, dispatch, ensure, StorageMap, StorageValue,
};

// mod mock;
// mod tests;

use system;
use system::{ensure_root, ensure_signed};

pub trait Trait: system::Trait + timestamp::Trait + Sized {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_storage! {
    trait Store for Module<T: Trait> as TokenMint {


    }
}

decl_event!(
    pub enum Event<T>
    where
        <T as system::Trait>::AccountId,
    {
        SomeEvent(AccountId),
    }
);

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn deposit_event<T>() = default;


    }
}

impl<T: Trait> Module<T> {

}
