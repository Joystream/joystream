#![cfg_attr(not(feature = "std"), no_std)]
use rstd::prelude::*;
use srml_support::{StorageValue, dispatch::Result, decl_module, decl_event, decl_storage, ensure};
use system;
pub use super::{ GovernanceCurrency, BalanceOf };

use super::{council, election::{self, TriggerElection}};

pub trait Trait: system::Trait + council::Trait + election::Trait + GovernanceCurrency {
    type TriggerElection: election::TriggerElection<election::Seats<Self::AccountId, BalanceOf<Self>>>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Root {
        // Flag for wether to automatically start an election after a council term ends
        AutoStartElections get(auto_start_elections) : bool = true;
    }
}

impl<T: Trait> Module<T> {
    // Nothing yet
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn set_auto_start_elections (flag: bool) {
            <AutoStartElections<T>>::put(flag);
        }

        fn start_election() -> Result {
            T::TriggerElection::trigger_election(<council::Module<T>>::active_council())
        }
    }
}

impl<T: Trait> council::CouncilTermEnded for Module<T> {
    fn council_term_ended() {
        if Self::auto_start_elections() && !<election::Module<T>>::is_election_running() {
            Self::start_election();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::governance::mock::*;
    use runtime_io::with_externalities;
    use srml_support::*;

    #[test]
    fn election_is_triggerred_when_council_term_ends() {
        with_externalities(&mut initial_test_ext(), || {
            System::set_block_number(1);

            assert!(Council::is_term_ended(1));
            assert!(Election::stage().is_none());

            <Governance as council::CouncilTermEnded>::council_term_ended();

            assert!(Election::stage().is_some());
        });
    }
}