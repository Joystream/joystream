#![cfg(feature = "runtime-benchmarks")]
use super::*;
use frame_benchmarking::{account, benchmarks, Zero};
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

// We create this trait because we need to be compatible with the runtime
// in the mock for tests. In that case we need to be able to have `membership_id == account_id`
// We can't create an account from an `u32` or from a memberhsip_dd,
// so this trait allows us to get an account id from an u32, in the case of `64` which is what
// the mock use we get the parameter as a return.
// In the case of `AccountId32` we use the method provided by `frame_benchmarking` to get an
// AccountId.
pub trait CreateAccountId {
    fn create_account_id(id: u32) -> Self;
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

fn assert_last_event<T: Trait>(generic_event: <T as Trait>::Event) {
    if !cfg!(test) {
        let events = System::<T>::events();
        let system_event: <T as frame_system::Trait>::Event = generic_event.into();

        assert!(events.len() > 0, "There are no events in event queue");

        // compare to the last event record
        let EventRecord { event, .. } = &events[events.len() - 1];
        assert_eq!(event, &system_event);
    }
}

fn assert_in_events<T: Trait>(generic_event: <T as Trait>::Event) {
    if !cfg!(test) {
        let events = System::<T>::events();
        let system_event: <T as frame_system::Trait>::Event = generic_event.into();

        assert!(events.len() > 0, "There are no events in event queue");

        assert!(
            events.into_iter().any(|event| {
                let EventRecord { event, .. } = event;
                event == system_event
            }),
            "Event not in the event queue",
        );
    }
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

fn start_period_announce_multiple_candidates<T: Trait>(
    number_of_candidates: u32,
) -> (Vec<T::AccountId>, Vec<T::MembershipId>)
where
    T::AccountId: CreateAccountId,
    T::MembershipId: From<u32>,
{
    let mut candidates = Vec::new();
    let mut accounts = Vec::new();
    start_announcing_period::<T>();
    for id in 0..number_of_candidates {
        let (account_id, candidate_id) = announce_candidate::<T>(id);
        candidates.push(candidate_id);
        accounts.push(account_id);
    }

    (accounts, candidates)
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

fn move_to_block<T: Trait>(target_block: T::BlockNumber) {
    let mut current_block_number = System::<T>::block_number();

    while current_block_number < target_block {
        // Worst case scenarios either need this or don't change
        Council::<T>::set_budget(RawOrigin::Root.into(), Balance::<T>::max_value()).unwrap();
        System::<T>::on_finalize(current_block_number);
        Council::<T>::on_finalize(current_block_number);

        current_block_number = System::<T>::block_number() + One::one();
        System::<T>::set_block_number(current_block_number);

        System::<T>::on_initialize(current_block_number);
        Council::<T>::on_initialize(current_block_number);
    }
}

fn move_to_block_assert_stage<T: Trait>(
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

const MAX_BYTES: u32 = 16384;
const MAX_CANDIDATES: u64 = 100;
const START_ID: u32 = 5000;

benchmarks! {
    where_clause { where T::AccountId: CreateAccountId, T::MembershipId: From<u32>}
    _ { }

    // We calculate `on_finalize` as `try_progress_stage + try_process_budget`
    try_process_budget {
        // We need to make sure that the block number starts at 0 to make payment/budget refill
        // periods easier to calculate
        let mut current_block_number = Zero::zero();
        System::<T>::set_block_number(current_block_number);
        assert_eq!(System::<T>::block_number(), current_block_number, "Block number not updated");

        // Worst case we have a council elected
        let (accounts_id, candidates_id) = start_period_announce_multiple_candidates::<T>(
            T::CouncilSize::get().try_into().unwrap()
        );

        let winners = candidates_id.iter().map(|candidate_id| {
            let option_id: T::MembershipId = *candidate_id;
            OptionResult {
                option_id: option_id.into(),
                vote_power: Zero::zero(),
            }
        }).collect::<Vec<_>>();

        Council::<T>::end_announcement_period(
            CouncilStageAnnouncing {
                candidates_count: T::CouncilSize::get(),
            }
        );

        Council::<T>::end_election_period(&winners[..]);

        let council = candidates_id.iter().enumerate().map(|(idx, member_id)|
            CouncilMember{
                staking_account_id: accounts_id[idx].clone(),
                reward_account_id: accounts_id[idx].clone(),
                membership_id: member_id.clone(),
                stake: Balance::<T>::max_value(),
                last_payment_block: Zero::zero(),
                unpaid_reward: Zero::zero(),
            }).collect::<Vec<_>>();

        assert_eq!(
            Council::<T>::council_members(),
            council,
            "Council not updated"
        );

        // Both payments and refill execute at BudgetRefefillPeriod * ElectedMemberRewardPeriod
        // We also take into account that this case is worse thatn block number == 0 since
        // `plan_budget_refill` is called by `refill_budget`
        current_block_number = T::BudgetRefillPeriod::get() * T::ElectedMemberRewardPeriod::get();

        // The first time we reach the next_reward_payments
        // the next time will be now + next_reward_payments
        // Note: this function doesn't execute the `on_finalize` of the
        // `current_block_number` this is important since we want to execute
        // the `try_process_budget` for this block
        move_to_block::<T>(current_block_number);

        // Worst case scenario we can pay as much as it is possible
        Council::<T>::set_budget(RawOrigin::Root.into(), Balance::<T>::max_value()).unwrap();

        let now = System::<T>::block_number();

        assert_eq!(
            Council::<T>::next_budget_refill(),
            now,
            "Budget refill not now",
        );

        assert_eq!(
            Council::<T>::next_reward_payments(),
            now,
            "Reward payment not now",
        );

        let reward_period: T::BlockNumber = T::ElectedMemberRewardPeriod::get();

        let current_council = Council::<T>::council_members();
        let council = council.into_iter().map(|mut councillor| {
            councillor.last_payment_block = now - reward_period;
            councillor
        }).collect::<Vec<_>>();

        assert_eq!(
            current_council,
            council,
            "Payment block not updated"
        );
        let unpaid_rewards = Council::<T>::council_members()
            .iter()
            .map(|member| member.unpaid_reward)
            .collect::<Vec<_>>();
    }: { Council::<T>::try_process_budget(now); }
    verify {
        let reward_per_block: Balance<T> = T::ElectedMemberRewardPerBlock::get();

        let reward_per_councillor: Balance<T> =
            reward_period
            .saturated_into()
            .saturating_mul(reward_per_block.saturated_into())
            .saturated_into();

        assert_eq!(
            Council::<T>::next_budget_refill(),
            now + T::BudgetRefillPeriod::get(),
            "Budget refill not updated"
        );

        let current_council = Council::<T>::council_members();
        let council = council.into_iter().map(|mut councillor| {
            councillor.last_payment_block = now;
            councillor
        }).collect::<Vec<_>>();

        assert_eq!(
            current_council,
            council,
            "Update block not updated"
        );

        let total_unpdaid_rewards: Balance<T> =
            unpaid_rewards.into_iter().fold(Zero::zero(), |acc, x| acc + x);

        let budget = Balance::<T>::max_value()
            .saturating_sub(
                reward_per_councillor.saturating_mul(T::CouncilSize::get().saturated_into())
            ).saturating_sub(total_unpdaid_rewards);

        assert_eq!(
            Council::<T>::budget(),
            budget,
            "Budget not correctly updated, probably a councillor was not correctly paid"
        );

        candidates_id.into_iter().enumerate().for_each(|(idx, member_id)| {
            let member_id: T::MembershipId = member_id;
            let account_id: T::AccountId = accounts_id[idx].clone();
            assert_in_events::<T>(
                RawEvent::RewardPayment(
                    member_id,
                    account_id,
                    reward_per_councillor,
                    Balance::<T>::from(0),
                ).into()
            )
        });
    }

    try_progress_stage_idle {
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
        move_to_block_assert_stage::<T>(target_block_number, current_stage_update);

    }: { Council::<T>::try_progress_stage(System::<T>::block_number()); }
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

        assert_last_event::<T>(RawEvent::AnnouncingPeriodStarted().into());
    }

    try_progress_stage_announcing_start_election {
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
        move_to_block_assert_stage::<T>(target_block_number, current_stage_update);

    }: { Council::<T>::try_progress_stage(System::<T>::block_number()); }
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

        assert_last_event::<T>(RawEvent::VotingPeriodStarted((i+1).into()).into());
    }

    try_progress_stage_announcing_restart {
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
        move_to_block_assert_stage::<T>(target_block_number, current_stage_update);
    }: { Council::<T>::try_progress_stage(System::<T>::block_number()); }
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

        assert_last_event::<T>(RawEvent::NotEnoughCandidates().into());

    }

    announce_candidacy {
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

        assert_last_event::<T>(
            RawEvent::NewCandidate(member_id, Balance::<T>::max_value()).into()
        );
    }

    release_candidacy_stake {
        let (account_id, member_id) = start_period_announce_candidacy_and_restart_period::<T>();
    }: _ (RawOrigin::Signed(account_id.clone()), member_id)
    verify {
        assert!(
            !Candidates::<T>::contains_key(member_id),
            "Candidate still in council candidates"
        );

        assert_last_event::<T>(RawEvent::CandidacyStakeRelease(member_id).into());
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

        assert_last_event::<T>(
            RawEvent::CandidacyNoteSet(member_id, vec![0u8; i.try_into().unwrap()]).into()
        );
    }

    withdraw_candidacy {
        let (account_id, member_id) = start_period_announce_candidacy::<T>(0);
    }: _(RawOrigin::Signed(account_id.clone()), member_id)
    verify {
        assert!(
            !Candidates::<T>::contains_key(member_id),
            "Candidate still in council candidates"
        );

        assert_last_event::<T>(RawEvent::CandidacyWithdraw(member_id).into());
    }

    set_budget {

    }: _(RawOrigin::Root, Balance::<T>::max_value())
    verify {
        assert_eq!(Council::<T>::budget(), Balance::<T>::max_value(), "Budget not updated");
        assert_last_event::<T>(RawEvent::BudgetBalanceSet(Balance::<T>::max_value()).into());
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
    fn test_try_progress_stage_announcing_restart() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_try_progress_stage_announcing_restart::<
                Runtime,
            >());
        })
    }

    #[test]
    fn test_try_progress_stage_announcing_start_election() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_try_progress_stage_announcing_start_election::<Runtime>());
        })
    }

    #[test]
    fn test_try_progress_stage_idle() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_try_progress_stage_idle::<Runtime>());
        })
    }

    #[test]
    fn test_try_process_budget() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_try_process_budget::<Runtime>());
        })
    }
}
