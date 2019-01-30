#![cfg_attr(not(feature = "std"), no_std)]

use srml_support::{StorageValue, StorageMap, dispatch::Result};

use governance::{council, election};

use runtime_io::print;

// Hook For starting election
pub trait TriggerElection {
    fn trigger_election() -> Result;
}

impl TriggerElection for () {
    fn trigger_election() -> Result { Ok(())}
}

impl<X: TriggerElection> TriggerElection for (X,) {
    fn trigger_election() -> Result{
        X::trigger_election()
    }
}

pub trait Trait: system::Trait + council::Trait + election::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type TriggerElection: TriggerElection;
}

decl_storage! {
    trait Store for Module<T: Trait> as Root {
        Dummy get(dummy) config(): u32;
    }
}

/// Event for this module.
decl_event!(
	pub enum Event<T> where <T as system::Trait>::BlockNumber {
        ElectionStarted(BlockNumber),
	}
);

impl<T: Trait> Module<T> {
    fn private_function() -> bool {
        true
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        fn on_finalise(n: T::BlockNumber) {
            if T::TriggerElection::trigger_election().is_ok() {
                print("Election Started");
                Self::deposit_event(RawEvent::ElectionStarted(n));
            }
            // if <election::Module<T>>::start_election().is_ok() {
            //     print("Election Started");
            //     Self::deposit_event(RawEvent::ElectionStarted(n));
            // }
        }
    }
}

#[cfg(test)]
mod tests {
	use super::*;
	use ::governance::tests::*;

    #[test]
    fn can_test_private_function() {
        with_externalities(&mut initial_test_ext(), || {
            assert!(Governance::private_function());
        });
    }
}