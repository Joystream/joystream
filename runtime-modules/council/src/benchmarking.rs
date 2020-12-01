#![cfg(feature = "runtime-benchmarks")]
use super::*;
use frame_benchmarking::{account, benchmarks};
use frame_support::traits::{OnFinalize, OnInitialize};
use frame_system::EventRecord;
use frame_system::Module as System;
use frame_system::RawOrigin;
use sp_runtime::traits::{Bounded, One};
use sp_std::convert::TryInto;
use sp_std::prelude::*;
use sp_std::vec;
use sp_std::vec::Vec;

use crate::Module as Council;

const SEED: u32 = 0;

pub trait CreateAccountId {
    fn create_account_id(id: u32) -> Self;
}

fn assert_last_event<T: Trait>(generic_event: <T as Trait>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();

    assert!(events.len() > 0, "There are no events in event queue");

    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn make_free_balance_be<T: Trait>(account_id: &T::AccountId, balance: Balance<T>) {
    <<T as Trait>::Referendum as ReferendumManager<
        <T as frame_system::Trait>::Origin,
        <T as frame_system::Trait>::AccountId,
        <T as frame_system::Trait>::Hash,
    >>::Currency::make_free_balance_be(&account_id, balance);
}

fn start_announcing_period<T: Trait>() {
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

    assert_eq!(
        Council::<T>::announcement_period_nr(),
        1,
        "Announcement period not updated"
    );
}

fn start_period_announce_multiple_candidates<T: Trait>(number_of_candidates: u32)
where
    T::AccountId: CreateAccountId,
    T::MembershipId: From<u32>,
{
    start_announcing_period::<T>();
    for id in 0..number_of_candidates {
        announce_candidate::<T>(id);
    }
}

fn announce_candidate<T: Trait>(id: u32) -> (T::AccountId, T::MembershipId)
where
    T::AccountId: CreateAccountId,
    T::MembershipId: From<u32>,
{
    let id = START_ID + id;

    let account_id = T::AccountId::create_account_id(id);
    let member_id = id.into();
    make_free_balance_be::<T>(&account_id, Balance::<T>::max_value());

    // Announce once before to take the branch that release the stake
    Council::<T>::announce_candidacy(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id,
        account_id.clone(),
        account_id.clone(),
        Balance::<T>::max_value(),
    )
    .unwrap();

    assert!(
        Candidates::<T>::contains_key(member_id),
        "Candidacy not announced"
    );

    assert_eq!(
        Council::<T>::candidates(member_id),
        Candidate {
            staking_account_id: account_id.clone(),
            cycle_id: 1,
            stake: Balance::<T>::max_value(),
            note_hash: None,
            reward_account_id: account_id.clone(),
        },
        "Candidacy hasn't been announced"
    );

    (account_id, member_id)
}

fn start_period_announce_candidacy<T: Trait>(id: u32) -> (T::AccountId, T::MembershipId)
where
    T::AccountId: CreateAccountId,
    T::MembershipId: From<u32>,
{
    start_announcing_period::<T>();

    announce_candidate::<T>(id)
}

fn start_period_announce_candidacy_and_restart_period<T: Trait>() -> (T::AccountId, T::MembershipId)
where
    T::AccountId: CreateAccountId,
    T::MembershipId: From<u32>,
{
    let current_block_number = System::<T>::block_number();

    let (account_id, member_id) = start_period_announce_candidacy::<T>(0);

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

    (account_id, member_id)
}

fn move_to_block<T: Trait>(
    target_block: T::BlockNumber,
    target_stage: CouncilStageUpdate<T::BlockNumber>,
) {
    let mut current_block_number = System::<T>::block_number();

    while current_block_number < target_block {
        System::<T>::on_finalize(current_block_number);
        Council::<T>::on_finalize(current_block_number);

        current_block_number = System::<T>::block_number() + One::one();
        System::<T>::set_block_number(current_block_number);

        System::<T>::on_initialize(current_block_number);
        Council::<T>::on_initialize(current_block_number);
    }

    assert_eq!(Stage::<T>::get(), target_stage, "Stage not reached");
}

const MAX_BYTES: u32 = 50000;
const MAX_CANDIDATES: u64 = 100;
const START_ID: u32 = 5000;

benchmarks! {
    where_clause { where T::AccountId: CreateAccountId, T::MembershipId: From<u32> }
    _ { }

    on_finalize_idle {
        let i in 0 .. 1;
        let current_block_number = System::<T>::block_number();

        let current_stage = CouncilStage::Idle;
        let current_stage_update =
            CouncilStageUpdate {
                stage: current_stage,
                changed_at: current_block_number + One::one(),
            };

        // Force idle state without depenending on Referndum
        Stage::<T>::mutate(|value| {
            *value = current_stage_update;
        });

        // Redefine `current_stage_update` simply because we haven't derived clone in the struct
        let current_stage = CouncilStage::Idle;
        let current_stage_update =
            CouncilStageUpdate {
                stage: current_stage,
                changed_at: current_block_number + One::one(),
            };

        let target_block_number = current_block_number + T::IdlePeriodDuration::get();
        move_to_block::<T>(target_block_number, current_stage_update);

    }: { Council::<T>::on_finalize(System::<T>::block_number()); }
    verify {
        assert_eq!(
            Council::<T>::stage(),
            CouncilStageUpdate {
                stage: CouncilStage::Announcing(CouncilStageAnnouncing {
                    candidates_count: 0,
                }),
                changed_at: target_block_number + One::one(),
            },
            "Idle period didn't end"
        );
    }

    on_finalize_announcing_start_election {
        let i in
            ((T::CouncilSize::get() + T::MinNumberOfExtraCandidates::get()).try_into().unwrap()) ..
            ((T::CouncilSize::get() + T::MinNumberOfExtraCandidates::get() + MAX_CANDIDATES)
                .try_into().unwrap()) => {
                    start_period_announce_multiple_candidates::<T>(i + 1);
                };
        let current_block_number = System::<T>::block_number();
        let current_stage =
            CouncilStage::Announcing(CouncilStageAnnouncing {
                candidates_count: (i + 1).into()
            });
        let current_stage_update =
            CouncilStageUpdate {
                stage: current_stage,
                changed_at: current_block_number + One::one(),
            };

        let target_block_number = current_block_number + T::AnnouncingPeriodDuration::get();
        move_to_block::<T>(target_block_number, current_stage_update);

    }: { Council::<T>::on_finalize(System::<T>::block_number()); }
    verify {
        assert_eq!(
            Council::<T>::stage(),
            CouncilStageUpdate {
                stage: CouncilStage::Election(
                    CouncilStageElection {
                        candidates_count: (i + 1).into(),
                    }),
                changed_at: target_block_number + One::one(),
            },
            "Announcing period didn't end"
        );
    }

    on_finalize_announcing_restart {
        let i in 0 .. 1;
        start_announcing_period::<T>();
        let current_block_number = System::<T>::block_number();
        let current_stage =
            CouncilStage::Announcing(CouncilStageAnnouncing {
                candidates_count: 0
            });
        let current_stage_update =
            CouncilStageUpdate {
                stage: current_stage,
                changed_at: current_block_number + One::one(),
            };

        let target_block_number = current_block_number + T::AnnouncingPeriodDuration::get();
        move_to_block::<T>(target_block_number, current_stage_update);
    }: { Council::<T>::on_finalize(System::<T>::block_number()); }
    verify {
        let current_stage =
            CouncilStage::Announcing(CouncilStageAnnouncing {
                candidates_count: 0
            });
        let current_stage_update =
            CouncilStageUpdate {
                stage: current_stage,
                changed_at: target_block_number + One::one(),
            };

        assert_eq!(Council::<T>::stage(), current_stage_update, "Council stage not restarted");

        //assert_last_event::<T>()
    }

    announce_candidacy {
        let i in 0 .. 1;

        let current_block_number = System::<T>::block_number();
        let (account_id, member_id) = start_period_announce_candidacy_and_restart_period::<T>();

    }: _ (
        RawOrigin::Signed(account_id.clone()),
        member_id,
        account_id.clone(),
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
                note_hash: None,
                reward_account_id: account_id.clone(),
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

        let (account_id, member_id) = start_period_announce_candidacy_and_restart_period::<T>();
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

        let (account_id, member_id) = start_period_announce_candidacy::<T>(0);

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
                reward_account_id: account_id.clone(),
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

        let (account_id, member_id) = start_period_announce_candidacy::<T>(0);
    }: _(RawOrigin::Signed(account_id.clone()), member_id)
    verify {
        assert!(
            !Candidates::<T>::contains_key(member_id),
            "Candidate still in council candidates"
        );

        assert_last_event::<T>(RawEvent::CandidacyWithdraw(member_id).into());
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

    #[test]
    fn test_on_finalize_announcing_restart() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_on_finalize_announcing_restart::<Runtime>());
        })
    }

    #[test]
    fn test_on_finalize_announcing_start_election() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_on_finalize_announcing_start_election::<
                Runtime,
            >());
        })
    }

    #[test]
    fn test_on_finalize_idle() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_on_finalize_idle::<Runtime>());
        })
    }
}
