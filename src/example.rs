// #![cfg_attr(not(feature = "std"), no_std)]

use srml_support::{decl_module, decl_storage, decl_event};
use system::{self, ensure_signed};
use rstd::prelude::*;

pub trait Trait: system::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Example {
        pub MyValue get(my_value) : u32 = 4096;
        pub Owner get(owner) : T::AccountId;
    }
}

decl_event! {
    pub enum Event<T> where <T as system::Trait>::AccountId {
        MyValueUpdated(AccountId),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
       fn deposit_event<T>() = default;

       fn does_nothing(origin) {
           let sender = ensure_signed(origin)?;
           Self::deposit_event(RawEvent::MyValueUpdated(sender));
       }
    }
}