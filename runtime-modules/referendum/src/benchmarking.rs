#![cfg(feature = "runtime-benchmarks")]
use super::*;
use frame_benchmarking::{account, benchmarks_instance, Zero};
use frame_support::traits::{OnFinalize, OnInitialize};
use frame_system::EventRecord;
use frame_system::Module as System;
use frame_system::RawOrigin;
use sp_runtime::traits::{Bounded, One};
use sp_std::prelude::*;

use crate::Module as Referendum;

const SEED: u32 = 0;

fn assert_last_event<T: Trait<I>, I: Instance>(generic_event: <T as Trait<I>>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

const MAX_WINNERS: u32 = 500;

fn start_voting_cycle<T: Trait<I>, I: Instance>(winning_target_count: u32) {
    Referendum::<T, I>::force_start(winning_target_count.into());
    assert_eq!(
        Stage::<T, I>::get(),
        ReferendumStage::Voting(ReferendumStageVoting {
            started: System::<T>::block_number() + One::one(),
            winning_target_count: (winning_target_count + 1).into(),
        }),
        "Vote cycle not started"
    );
}

fn funded_account<T: Trait<I>, I: Instance>(name: &'static str, id: u32) -> T::AccountId {
    let account_id = account::<T::AccountId>(name, id, SEED);
    T::Currency::make_free_balance_be(&account_id, Balance::<T, I>::max_value());

    account_id
}

fn make_multiple_votes_for_multiple_options<T: Trait<I>, I: Instance>(
    n: u32,
    cycle_id: u32,
) -> (
    Vec<(T::AccountId, T::Hash, Vec<u8>, u32)>,
    Vec<OptionResult<T::VotePower>>,
) {
    let mut votes = Vec::new();
    let mut intermediate_winners = Vec::new();
    let stake = T::MinimumStake::get() + One::one();

    for option in 0..n {
        let (account_id, commitment) =
            create_account_and_vote::<T, I>("voter", option, option, cycle_id, Zero::zero());
        let salt = vec![0u8];

        intermediate_winners.push(OptionResult {
            option_id: option.into(),
            vote_power: T::calculate_vote_power(&account_id, &stake),
        });
        votes.push((account_id, commitment, salt, option));
    }

    (votes, intermediate_winners)
}

fn create_account_and_vote<T: Trait<I>, I: Instance>(
    name: &'static str,
    id: u32,
    option: u32,
    cycle_id: u32,
    extra_stake: Balance<T, I>,
) -> (T::AccountId, T::Hash) {
    let account_id = funded_account::<T, I>(name, id);
    let stake = T::MinimumStake::get() + One::one() + extra_stake;
    let salt = vec![0u8];
    let commitment = Referendum::<T, I>::calculate_commitment(
        &account_id,
        &salt,
        &cycle_id.into(),
        &option.into(),
    );

    Referendum::<T, I>::vote(
        RawOrigin::Signed(account_id.clone()).into(),
        commitment,
        stake,
    )
    .unwrap();

    assert!(
        Votes::<T, I>::contains_key(account_id.clone()),
        "Vote wasn't added"
    );

    assert_eq!(
        Referendum::<T, I>::votes(account_id.clone()),
        CastVote {
            commitment,
            stake,
            cycle_id: cycle_id.into(),
            vote_for: None,
        },
        "Vote is not correctly Stored",
    );

    (account_id, commitment)
}

fn move_to_block<T: Trait<I>, I: Instance>(
    target_block: T::BlockNumber,
    target_stage: ReferendumStage<T::BlockNumber, T::VotePower>,
) {
    let mut current_block_number = System::<T>::block_number();

    while current_block_number < target_block {
        System::<T>::on_finalize(current_block_number);
        Referendum::<T, I>::on_finalize(current_block_number);
        current_block_number = System::<T>::block_number() + One::one();
        System::<T>::set_block_number(current_block_number);
        System::<T>::on_initialize(current_block_number);
        Referendum::<T, I>::on_initialize(current_block_number);
    }

    assert_eq!(Stage::<T, I>::get(), target_stage, "Stage not reached");
}

fn add_and_reveal_multiple_votes_and_add_extra_unrevealed_vote<T: Trait<I>, I: Instance>(
    target_winners: u32,
    number_of_voters: u32,
    extra_vote_option: u32,
    extra_stake: Balance<T, I>,
) -> (Vec<OptionResult<T::VotePower>>, T::AccountId, T::Hash) {
    start_voting_cycle::<T, I>(target_winners);

    let cycle_id = 0;
    let (votes, intermediate_winners) =
        make_multiple_votes_for_multiple_options::<T, I>(number_of_voters, cycle_id);

    let vote_option = extra_vote_option;
    let (account_id, commitment) = create_account_and_vote::<T, I>(
        "caller",
        number_of_voters + 1,
        vote_option,
        cycle_id,
        extra_stake,
    );

    let started_voting_block_number = System::<T>::block_number() + One::one();
    let target_block_number = T::VoteStageDuration::get() + started_voting_block_number;

    let target_stage = ReferendumStage::Revealing(ReferendumStageRevealingOf::<T, I> {
        started: target_block_number,
        winning_target_count: (target_winners + 1).into(),
        intermediate_winners: vec![],
    });

    move_to_block::<T, I>(
        T::VoteStageDuration::get() + started_voting_block_number,
        target_stage,
    );

    votes.into_iter().for_each(|(account_id, _, salt, option)| {
        Referendum::<T, I>::reveal_vote(RawOrigin::Signed(account_id).into(), salt, option.into())
            .unwrap();
    });

    let current_stage = ReferendumStage::Revealing(ReferendumStageRevealingOf::<T, I> {
        intermediate_winners: intermediate_winners.clone(),
        started: target_block_number,
        winning_target_count: (target_winners + 1).into(),
    });

    assert_eq!(
        Referendum::<T, I>::stage(),
        current_stage,
        "Votes not revealed",
    );

    (intermediate_winners, account_id, commitment)
}

benchmarks_instance! {
    _ { }

    on_finalize_revealing {
        let i in 0 .. MAX_WINNERS;

        let salt = vec![0u8];
        let vote_option = i;
        let started_voting_block_number = System::<T>::block_number();

        let (mut intermediate_winners, _, _) =
            add_and_reveal_multiple_votes_and_add_extra_unrevealed_vote::<T, I>(
                i,
                i,
                vote_option,
                One::one()
            );

        let target_block_number = T::RevealStageDuration::get() +
            T::VoteStageDuration::get() +
            started_voting_block_number;


        let target_stage = ReferendumStage::Revealing(
            ReferendumStageRevealingOf::<T, I> {
                intermediate_winners: intermediate_winners.clone(),
                started: started_voting_block_number + T::VoteStageDuration::get() + One::one(),
                winning_target_count: (i + 1).into(),
            }
        );

        move_to_block::<T, I>(
            target_block_number,
            target_stage
        );
    }: { Referendum::<T, I>::on_finalize(System::<T>::block_number()); }
    verify {
        assert_eq!(
            Referendum::<T, I>::stage(),
            ReferendumStage::Inactive,
            "Reveal perdiod hasn't ended",
        );

        assert_eq!(
            Referendum::<T, I>::current_cycle_id(),
            1,
            "Cycle haven't advanced"
        );

        assert_last_event::<T, I>(RawEvent::ReferendumFinished(intermediate_winners).into());
    }

    on_finalize_voting {
        let i in 0 .. 1;

        let winning_target_count = 0;
        start_voting_cycle::<T, I>(winning_target_count);

        let started_voting_block_number = System::<T>::block_number() + One::one();
        let target_block_number =
            T::VoteStageDuration::get() + started_voting_block_number - One::one();

        let target_stage = ReferendumStage::Voting(ReferendumStageVoting {
                started: System::<T>::block_number() + One::one(),
                winning_target_count: (winning_target_count + 1).into(),
        });

        move_to_block::<T, I>(target_block_number, target_stage);
    }: { Referendum::<T, I>::on_finalize(System::<T>::block_number()); }
    verify {
        let current_stage = ReferendumStage::Revealing(ReferendumStageRevealing {
            started: target_block_number + One::one(),
            winning_target_count: 1,
            intermediate_winners: vec![]
        });

        assert_eq!(
            Referendum::<T, I>::stage(),
            current_stage,
            "Voting period not ended"
        );

        assert_last_event::<T, I>(RawEvent::RevealingStageStarted().into());
    }

    vote {
        let i in 0 .. 1;

        start_voting_cycle::<T, I>(0);

        let account_id = funded_account::<T, I>("caller", 0);

        let salt = vec![0u8];
        let cycle_id = 0;
        let vote_option = 0;
        let commitment =
            Referendum::<T, I>::calculate_commitment(&account_id, &salt, &cycle_id, &vote_option);

        let stake = T::MinimumStake::get() + One::one();
    }: _ (RawOrigin::Signed(account_id.clone()), commitment, stake)
    verify {
        assert!(Votes::<T, I>::contains_key(account_id.clone()), "Vote wasn't added");

        assert_eq!(
            Referendum::<T, I>::votes(account_id.clone()),
            CastVote {
                commitment,
                stake,
                cycle_id,
                vote_for: None,
            },
            "Vote is not correctly Stored",
        );

        assert_last_event::<T, I>(RawEvent::VoteCast(account_id.clone(), commitment, stake).into());
    }

    reveal_vote_space_for_new_winner {
        let i in 0 .. MAX_WINNERS;

        let salt = vec![0u8];
        let vote_option = i;
        let started_block_number = System::<T>::block_number();

        let (mut intermediate_winners, account_id, commitment) =
            add_and_reveal_multiple_votes_and_add_extra_unrevealed_vote::<T, I>(
                i,
                i,
                vote_option,
                One::one()
            );
    }: reveal_vote(RawOrigin::Signed(account_id.clone()), salt, vote_option.into())
    verify {
        let stake = T::MinimumStake::get() + One::one() + One::one();

        intermediate_winners.insert(
            0,
            OptionResult{
                option_id: vote_option.into(),
                vote_power: T::calculate_vote_power(&account_id.clone(), &stake),
            }
        );

        assert_eq!(
            Referendum::<T, I>::stage(),
            ReferendumStage::Revealing(ReferendumStageRevealing{
                intermediate_winners,
                winning_target_count: (i+1).into(),
                started: T::VoteStageDuration::get() + started_block_number + One::one(),
            }),
            "Vote not revealed",
        );

        assert_eq!(
            Referendum::<T, I>::votes(account_id.clone()),
            CastVote {
                commitment,
                stake,
                cycle_id: 0,
                vote_for: Some(vote_option.into()),
            },
            "Vote not revealed",
        );

        assert_last_event::<T, I>(RawEvent::VoteRevealed(account_id, vote_option.into()).into());
    }

    reveal_vote_space_not_in_winners {
        let i in 0 .. MAX_WINNERS;

        let salt = vec![0u8];
        let vote_option = i+1;
        let started_block_number = System::<T>::block_number();

        let (intermediate_winners, account_id, commitment) =
            add_and_reveal_multiple_votes_and_add_extra_unrevealed_vote::<T, I>(
                i,
                i + 1,
                vote_option,
                Zero::zero(),
            );
    }: reveal_vote(RawOrigin::Signed(account_id.clone()), salt, vote_option.into())
    verify {
        let stake = T::MinimumStake::get() + One::one();

        assert_eq!(
            Referendum::<T, I>::stage(),
            ReferendumStage::Revealing(ReferendumStageRevealing{
                intermediate_winners,
                winning_target_count: (i+1).into(),
                started: T::VoteStageDuration::get() + started_block_number + One::one(),
            }),
            "Vote not revealed",
        );

        assert_eq!(
            Referendum::<T, I>::votes(account_id.clone()),
            CastVote {
                commitment,
                stake,
                cycle_id: 0,
                vote_for: Some(vote_option.into()),
            },
            "Vote not revealed",
        );

        assert_last_event::<T, I>(RawEvent::VoteRevealed(account_id, vote_option.into()).into());
    }

    reveal_vote_space_replace_last_winner {
        let i in 0 .. MAX_WINNERS;

        let salt = vec![0u8];
        let vote_option = i+1;
        let started_block_number = System::<T>::block_number();

        let (mut intermediate_winners, account_id, commitment) =
            add_and_reveal_multiple_votes_and_add_extra_unrevealed_vote::<T, I>(
                i,
                i + 1,
                vote_option,
                One::one(),
            );
    }: reveal_vote(RawOrigin::Signed(account_id.clone()), salt, vote_option.into())
    verify {
        let stake = T::MinimumStake::get() + One::one() + One::one();

        intermediate_winners.pop();

        intermediate_winners.insert(0, OptionResult{
            option_id: vote_option.into(),
            vote_power: T::calculate_vote_power(&account_id.clone(), &stake),
        });

        assert_eq!(
            Referendum::<T, I>::stage(),
            ReferendumStage::Revealing(ReferendumStageRevealing{
                intermediate_winners,
                winning_target_count: (i+1).into(),
                started: T::VoteStageDuration::get() + started_block_number + One::one(),
            }),
            "Vote not revealed",
        );

        assert_eq!(
            Referendum::<T, I>::votes(account_id.clone()),
            CastVote {
                commitment,
                stake,
                cycle_id: 0,
                vote_for: Some(vote_option.into()),
            },
            "Vote not revealed",
        );

        assert_last_event::<T, I>(RawEvent::VoteRevealed(account_id, vote_option.into()).into());
    }

    reveal_vote_already_existing {
        let i in 0 .. MAX_WINNERS;

        let salt = vec![0u8];
        let vote_option = i;
        let started_block_number = System::<T>::block_number();

        let (mut intermediate_winners, account_id, commitment) =
            add_and_reveal_multiple_votes_and_add_extra_unrevealed_vote::<T, I>(
                i,
                i + 1,
                vote_option,
                Zero::zero()
            );

    }: reveal_vote(RawOrigin::Signed(account_id.clone()), salt, vote_option.into())
    verify {
        let stake = T::MinimumStake::get() + One::one();

        let old_vote_power = intermediate_winners[i as usize].vote_power;
        let new_vote_power = old_vote_power + T::calculate_vote_power(&account_id, &stake);

        intermediate_winners[i as usize] = OptionResult {
            option_id: i.into(),
            vote_power: new_vote_power,
        };

        let last_winner = intermediate_winners.pop().unwrap();
        intermediate_winners.insert(0, last_winner);
        assert_eq!(
            Referendum::<T, I>::stage(),
            ReferendumStage::Revealing(ReferendumStageRevealing{
                intermediate_winners,
                winning_target_count: (i+1).into(),
                started: T::VoteStageDuration::get() + started_block_number + One::one(),
            }),
            "Vote not revealed",
        );

        assert_eq!(
            Referendum::<T, I>::votes(account_id.clone()),
            CastVote {
                commitment,
                stake,
                cycle_id: 0,
                vote_for: Some(vote_option.into()),
            },
            "Vote not revealed",
        );

        assert_last_event::<T, I>(RawEvent::VoteRevealed(account_id, vote_option.into()).into());
    }

    release_vote_stake {
        let i in 0 .. 1;

        start_voting_cycle::<T, I>(0);

        let cycle_id = 0;
        let option = 0;
        let stake = T::MinimumStake::get() + One::one();
        let salt = vec![0u8];

        let (account_id, commitment) =
            create_account_and_vote::<T, I>("caller", 0, 0, cycle_id, Zero::zero());

        let salt = vec![0u8];

        let started_voting_block_number = System::<T>::block_number() + One::one();
        let target_block_number = T::RevealStageDuration::get() +
            T::VoteStageDuration::get() +
            started_voting_block_number;

        let target_stage = ReferendumStage::Inactive;
        move_to_block::<T, I>(
            target_block_number,
            target_stage
        );
    }: _ (RawOrigin::Signed(account_id.clone()))
    verify {
        assert!(
            !Votes::<T, I>::contains_key(account_id.clone()),
            "Vote not removed"
        );

        assert_last_event::<T, I>(RawEvent::StakeReleased(account_id).into());
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

    #[test]
    fn test_reveal_vote_space_for_new_winner() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_reveal_vote_space_for_new_winner::<Runtime>());
        })
    }

    #[test]
    fn test_reveal_vote_space_not_in_winners() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_reveal_vote_space_not_in_winners::<Runtime>());
        })
    }

    #[test]
    fn test_reveal_vote_already_existing() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_reveal_vote_already_existing::<Runtime>());
        })
    }

    #[test]
    fn test_reveal_vote_space_replace_last_winner() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_reveal_vote_space_replace_last_winner::<
                Runtime,
            >());
        })
    }

    #[test]
    fn test_release_vote_stake() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_release_vote_stake::<Runtime>());
        })
    }

    #[test]
    fn test_on_finalize_voting() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_on_finalize_voting::<Runtime>());
        })
    }

    #[test]
    fn test_on_finalize_revealing() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_on_finalize_revealing::<Runtime>());
        })
    }
}
