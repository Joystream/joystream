#![cfg(feature = "runtime-benchmarks")]
use super::*;
use frame_benchmarking::{account, benchmarks};
//use frame_support::traits::{OnFinalize, OnInitialize};
use sp_runtime::traits::{Bounded, One};
use sp_std::convert::TryInto;
use sp_std::prelude::*;
use system as frame_system;
//use system::EventRecord;
use system::Module as System;
use system::RawOrigin;

use crate::Module as Council;

const SEED: u32 = 0;

pub trait CreateAccountId {
    fn create_account_id(id: u32) -> Self;
}

/*
fn assert_last_event<T: Trait>(generic_event: <T as Trait>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();

    assert!(events.len() > 0, "There are no events in event queue");

    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}
*/

fn make_free_balance_be<T: Trait>(account_id: &T::AccountId, balance: Balance<T>) {
    <<T as Trait>::Referendum as ReferendumManager<
        <T as system::Trait>::Origin,
        <T as system::Trait>::AccountId,
        <T as system::Trait>::Hash,
    >>::Currency::make_free_balance_be(&account_id, balance);
}

const MAX_BYTES: u32 = 50000;

benchmarks! {
    where_clause { where T::AccountId: CreateAccountId, T::MembershipId: From<u32> }
    _ { }

    announce_candidacy {
        let i in 0 .. 1;

        let id = 5000;

        let account_id = T::AccountId::create_account_id(id);
        let member_id = id.into();
        make_free_balance_be::<T>(&account_id, Balance::<T>::max_value());

        Mutations::<T>::start_announcing_period();

        let current_state = CouncilStageAnnouncing {
            candidates_count: 0,
        };
        let current_block_number = System::<T>::block_number();

        assert_eq!(
            Council::<T>::stage(),
            CouncilStageUpdate {
                stage: CouncilStage::Announcing(current_state),
                changed_at: current_block_number + One::one(),
            },
            "Announcement period not started"
        );

        assert_eq!(Council::<T>::announcement_period_nr(), 1, "Announcement period not updated");
        // Announce once before to take the branch that release the stake
        Council::<T>::announce_candidacy(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
            account_id.clone(),
            Balance::<T>::max_value()
        ).unwrap();

        assert!(Candidates::<T>::contains_key(member_id), "Candidacy not announced");

        assert_eq!(
            Council::<T>::candidates(member_id),
            Candidate {
                staking_account_id: account_id.clone(),
                cycle_id: 1,
                stake: Balance::<T>::max_value(),
                note_hash: None
            },
            "Candidacy hasn't been announced"
        );

        Mutations::<T>::start_announcing_period();

        let current_state = CouncilStageAnnouncing {
            candidates_count: 0,
        };

        assert_eq!(
            Council::<T>::stage(),
            CouncilStageUpdate {
                stage: CouncilStage::Announcing(current_state),
                changed_at: current_block_number + One::one(),
            },
            "Announcement period not started"
        );

    }: _ (
        RawOrigin::Signed(account_id.clone()),
        member_id,
        account_id.clone(),
        Balance::<T>::max_value()
    )
    verify{
        assert!(Candidates::<T>::contains_key(member_id), "Candidacy not announced");
        let candidate = Council::<T>::candidates(member_id);
        assert_eq!(
            candidate,
            Candidate {
                staking_account_id: account_id.clone(),
                cycle_id: 2,
                stake: Balance::<T>::max_value(),
                note_hash: None
            },
            "Candidacy hasn't been announced"
        );

        let current_state = CouncilStageAnnouncing {
            candidates_count: 1,
        };

        assert_eq!(
            Council::<T>::stage(),
            CouncilStageUpdate {
                stage: CouncilStage::Announcing(current_state),
                changed_at: current_block_number + One::one(),
            },
            "Announcement period not started"
        );

        /*
         * TODO: Why no event is deposited
        assert_last_event::<T>(
            RawEvent::NewCandidate(member_id, Balance::<T>::max_value()).into()
        );
        */
    }

    release_candidacy_stake {
        let i in 0 .. 1;

        let id = 5000;

        let account_id = T::AccountId::create_account_id(id);
        let member_id = id.into();
        make_free_balance_be::<T>(&account_id, Balance::<T>::max_value());

        Mutations::<T>::start_announcing_period();

        let current_state = CouncilStageAnnouncing {
            candidates_count: 0,
        };
        let current_block_number = System::<T>::block_number();

        assert_eq!(
            Council::<T>::stage(),
            CouncilStageUpdate {
                stage: CouncilStage::Announcing(current_state),
                changed_at: current_block_number + One::one(),
            },
            "Announcement period not started"
        );

        assert_eq!(Council::<T>::announcement_period_nr(), 1, "Announcement period not updated");
        Council::<T>::announce_candidacy(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
            account_id.clone(),
            Balance::<T>::max_value()
        ).unwrap();

        assert!(Candidates::<T>::contains_key(member_id), "Candidacy not announced");

        assert_eq!(
            Council::<T>::candidates(member_id),
            Candidate {
                staking_account_id: account_id.clone(),
                cycle_id: 1,
                stake: Balance::<T>::max_value(),
                note_hash: None
            },
            "Candidacy hasn't been announced"
        );

        Mutations::<T>::start_announcing_period();

        let current_state = CouncilStageAnnouncing {
            candidates_count: 0,
        };

        assert_eq!(
            Council::<T>::stage(),
            CouncilStageUpdate {
                stage: CouncilStage::Announcing(current_state),
                changed_at: current_block_number + One::one(),
            },
            "Announcement period not started"
        );
    }: _ (RawOrigin::Signed(account_id.clone()), member_id)
    verify {
        assert!(
            !Candidates::<T>::contains_key(member_id),
            "Candidate still in council candidates"
        );

        /*
         * TODO: Why no event is deposited
        assert_last_event::<T>(RawEvent::CandidacyStakeReleas(member_id).into());
        */
    }

    set_candidacy_note {
        let i in 0 .. MAX_BYTES;

        let id = 5000;

        let account_id = T::AccountId::create_account_id(id);
        let member_id = id.into();
        make_free_balance_be::<T>(&account_id, Balance::<T>::max_value());

        Mutations::<T>::start_announcing_period();

        let current_state = CouncilStageAnnouncing {
            candidates_count: 0,
        };

        let current_block_number = System::<T>::block_number();

        assert_eq!(
            Council::<T>::stage(),
            CouncilStageUpdate {
                stage: CouncilStage::Announcing(current_state),
                changed_at: current_block_number + One::one(),
            },
            "Announcement period not started"
        );

        assert_eq!(Council::<T>::announcement_period_nr(), 1, "Announcement period not updated");
        Council::<T>::announce_candidacy(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
            account_id.clone(),
            Balance::<T>::max_value()
        ).unwrap();

        assert!(Candidates::<T>::contains_key(member_id), "Candidacy not announced");

        assert_eq!(
            Council::<T>::candidates(member_id),
            Candidate {
                staking_account_id: account_id.clone(),
                cycle_id: 1,
                stake: Balance::<T>::max_value(),
                note_hash: None,
            },
            "Candidacy hasn't been announced"
        );

        let note = vec![0u8; i.try_into().unwrap()];

    }: _(RawOrigin::Signed(account_id.clone()), member_id, note.clone())
    verify {
        assert_eq!(
            Council::<T>::candidates(member_id),
            Candidate {
                staking_account_id: account_id.clone(),
                cycle_id: 1,
                stake: Balance::<T>::max_value(),
                note_hash: Some(T::Hashing::hash(&note)),
            },
            "Note not set"
        );

        /*
         * TODO: Why no event is deposited
        assert_last_event::<T>(RawEvent::CandidacyNoteSet(member_id, [0u8;i]).into());
        */

    }

    withdraw_candidacy {
        let i in 0 .. 1;

        let id = 5000;

        let account_id = T::AccountId::create_account_id(id);
        let member_id = id.into();
        make_free_balance_be::<T>(&account_id, Balance::<T>::max_value());

        Mutations::<T>::start_announcing_period();

        let current_state = CouncilStageAnnouncing {
            candidates_count: 0,
        };

        let current_block_number = System::<T>::block_number();

        assert_eq!(
            Council::<T>::stage(),
            CouncilStageUpdate {
                stage: CouncilStage::Announcing(current_state),
                changed_at: current_block_number + One::one(),
            },
            "Announcement period not started"
        );

        assert_eq!(Council::<T>::announcement_period_nr(), 1, "Announcement period not updated");
        Council::<T>::announce_candidacy(
            RawOrigin::Signed(account_id.clone()).into(),
            member_id,
            account_id.clone(),
            Balance::<T>::max_value()
        ).unwrap();

        assert!(Candidates::<T>::contains_key(member_id), "Candidacy not announced");

        assert_eq!(
            Council::<T>::candidates(member_id),
            Candidate {
                staking_account_id: account_id.clone(),
                cycle_id: 1,
                stake: Balance::<T>::max_value(),
                note_hash: None
            },
            "Candidacy hasn't been announced"
        );
    }: _(RawOrigin::Signed(account_id.clone()), member_id)
    verify {
        assert!(
            !Candidates::<T>::contains_key(member_id),
            "Candidate still in council candidates"
        );

        /*
         * TODO: Why no event is deposited
        assert_last_event::<T>(RawEvent::CandidacyStakeReleas(member_id).into());
        */
    }
}

impl CreateAccountId for u64 {
    fn create_account_id(id: u32) -> Self {
        id.into()
    }
}

impl CreateAccountId for sp_core::crypto::AccountId32 {
    fn create_account_id(id: u32) -> Self {
        account::<Self>("default", id, SEED)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    pub use crate::mock::Runtime;
    use crate::mock::{build_test_externalities, default_genesis_config};
    use frame_support::assert_ok;

    #[test]
    fn test_announce_candidacy() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_announce_candidacy::<Runtime>());
        })
    }

    #[test]
    fn test_release_candidacy() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_release_candidacy_stake::<Runtime>());
        })
    }

    #[test]
    fn test_withdraw_candidacy() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_withdraw_candidacy::<Runtime>());
        })
    }
}
