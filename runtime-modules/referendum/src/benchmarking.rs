#![cfg(feature = "runtime-benchmarks")]
use super::*;
use frame_benchmarking::{account, benchmarks_instance};
use sp_runtime::traits::Bounded;
use sp_runtime::traits::One;
use sp_std::prelude::*;
use system as frame_system;
use system::EventRecord;
use system::Module as System;
use system::RawOrigin;

use crate::Module as Referendum;
//use membership::Module as Membership;

const SEED: u32 = 0;

fn assert_last_event<T: Trait<I>, I: Instance>(generic_event: <T as Trait<I>>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

benchmarks_instance! {
    _ { }

    vote {
        let i in 0 .. 1;

        let account_id = account::<T::AccountId>("caller", 0, SEED);
        let free_balance = Balance::<T, I>::max_value();
        T::Currency::make_free_balance_be(&account_id, Balance::<T, I>::max_value());
        let salt = vec![0u8];
        let cycle_id = 0;
        let vote_option = 0;
        let commitment =
            Referendum::<T, I>::calculate_commitment(&account_id, &salt, &cycle_id, &vote_option);
        Referendum::<T, I>::force_start(0);
        assert_eq!(
            Stage::<T, I>::get(),
            ReferendumStage::Voting(
                ReferendumStageVoting {
                    started: System::<T>::block_number() + One::one(),
                    winning_target_count: 1
                }
            ),
            "Vote not started"
        );
        let stake = T::MinimumStake::get() + One::one();
    }: _ (RawOrigin::Signed(account_id.clone()), commitment, stake)
    verify {
        assert!(Votes::<T, I>::contains_key(account_id.clone()), "Vote wasn't added");
        assert_last_event::<T, I>(RawEvent::VoteCast(account_id, commitment, stake).into());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mock::{build_test_externalities, default_genesis_config, Runtime};
    use frame_support::assert_ok;

    #[test]
    fn test_vote() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_vote::<Runtime>());
        })
    }
}
