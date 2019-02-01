#![cfg_attr(not(feature = "std"), no_std)]

use srml_support::{StorageValue, StorageMap, dispatch::Result};

use governance::{council, election};

use runtime_io::print;

// Hook For starting election
pub trait TriggerElection<CurrentCouncil, Params> {
    fn trigger_election(current: Option<CurrentCouncil>, params: Params) -> Result;
}

impl<CurrentCouncil, Params> TriggerElection<CurrentCouncil, Params> for () {
    fn trigger_election(_: Option<CurrentCouncil>, _: Params) -> Result { Ok(())}
}

impl<CurrentCouncil, Params, X: TriggerElection<CurrentCouncil, Params>> TriggerElection<CurrentCouncil, Params> for (X,) {
    fn trigger_election(current: Option<CurrentCouncil>, params: Params) -> Result{
        X::trigger_election(current, params)
    }
}

pub trait Trait: system::Trait + council::Trait + election::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type TriggerElection: TriggerElection<council::Council<Self::AccountId, Self::Balance>, election::ElectionParameters<Self::BlockNumber, Self::Balance>>;
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
    fn tick (n: T::BlockNumber) {
        if <council::Module<T>>::term_ended(n) && <election::Module<T>>::stage().is_none() {
            let current_council = <council::Module<T>>::council();

            // TODO: get params from governance parameters module
            let params = Default::default();

            if T::TriggerElection::trigger_election(current_council, params).is_ok() {
                print("Election Started");
                Self::deposit_event(RawEvent::ElectionStarted(n));
            }
        }
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        fn on_finalise(n: T::BlockNumber) {
            Self::tick(n);
        }
    }
}

#[cfg(test)]
mod tests {
	use super::*;
	use ::governance::tests::*;

    #[test]
    fn auto_starting_election_should_work() {
        with_externalities(&mut initial_test_ext(), || {
            System::set_block_number(1);

            assert!(Council::term_ended(1));
            assert!(Election::stage().is_none());

            Governance::tick(1);

            assert!(Election::stage().is_some());
        });
    }

    #[test]
    fn start_election_if_election_running_should_fail() {
        with_externalities(&mut initial_test_ext(), || {
            assert!(<Test as root::Trait>::TriggerElection::trigger_election(None, Default::default()).is_ok());

            // Should fail to start election if already ongoing
            assert!(<Test as root::Trait>::TriggerElection::trigger_election(None, Default::default()).is_err());
        });
    }
}