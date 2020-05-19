// Clippy linter warning
#![allow(clippy::redundant_closure_call)] // disable it because of the substrate lib design

use rstd::prelude::*;
use srml_support::{debug, decl_event, decl_module, decl_storage, traits::Get};

pub trait Trait: system::Trait {
    type Event: From<Event> + Into<<Self as system::Trait>::Event>;
    type TheValue: Get<u32>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Constantine {
        // compiler error: "use of undeclared type or module `T`"
        // pub InitialValue get(initial_value): u32 = T::TheValue::get();
        pub InitialValue get(initial_value) build(|_: &GenesisConfig| T::TheValue::get()): u32;
    }
}

decl_event! {
    pub enum Event {
        TheValueIs(u32),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        const TheValue: u32 = T::TheValue::get();

        fn deposit_event() = default;

        fn on_initialize(_now: T::BlockNumber) {
            debug::print!("T::TheValue::get() ==> {:?}", T::TheValue::get());
            Self::deposit_event(Event::TheValueIs(T::TheValue::get()));
        }
    }
}
