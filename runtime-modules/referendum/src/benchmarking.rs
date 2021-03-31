#![cfg(feature = "runtime-benchmarks")]
use super::*;
use frame_benchmarking::{account, benchmarks_instance, Zero};
use frame_support::traits::{Currency, OnFinalize, OnInitialize};
use frame_system::EventRecord;
use frame_system::Module as System;
use frame_system::RawOrigin;
use membership::Module as Membership;
use sp_runtime::traits::{Bounded, One};
use sp_std::prelude::*;

use crate::Module as Referendum;

const SEED: u32 = 0;

// This is needed to prevent a circular reference with council
// when running the benchmarks. Since you need to vote for a valid
// candidate (See the implementation of `is_valid_option_id` in
// the Runtime.
pub trait OptionCreator<AccountId, MemberId> {
    fn create_option(account_id: AccountId, member_id: MemberId);
}

fn assert_last_event<T: Trait<I>, I: Instance>(generic_event: <T as Trait<I>>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn start_voting_cycle<T: Trait<I>, I: Instance>(winning_target_count: u32) {
    Referendum::<T, I>::force_start(winning_target_count.into(), 0);
    assert_eq!(
        Stage::<T, I>::get(),
        ReferendumStage::Voting(ReferendumStageVoting {
            started: System::<T>::block_number(),
            winning_target_count: (winning_target_count + 1).into(),
            current_cycle_id: 0,
        }),
        "Vote cycle not started"
    );
}

fn funded_account<T: Trait<I>, I: Instance>(name: &'static str, id: u32) -> T::AccountId {
    let account_id = account::<T::AccountId>(name, id, SEED);
    balances::Module::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

    account_id
}

fn make_multiple_votes_for_multiple_options<
    T: Trait<I>
        + membership::Trait
        + OptionCreator<
            <T as frame_system::Trait>::AccountId,
            <T as common::membership::Trait>::MemberId,
        >,
    I: Instance,
>(
    number_of_options: u32,
    cycle_id: u32,
) -> (
    Vec<(T::AccountId, T::Hash, Vec<u8>, T::MemberId)>,
    Vec<OptionResult<T::MemberId, T::VotePower>>,
) {
    let mut votes = Vec::new();
    let mut intermediate_winners = Vec::new();
    let stake = T::MinimumStake::get() + One::one();

    for option in 0..number_of_options {
        let (account_id, option, commitment) = create_account_and_vote::<T, I>(
            "voter",
            option.into(),
            number_of_options + option,
            cycle_id,
            Zero::zero(),
        );
        let salt = vec![0u8];

        intermediate_winners.push(OptionResult {
            option_id: option,
            vote_power: T::calculate_vote_power(&account_id, &stake),
        });
        votes.push((account_id, commitment, salt, option.into()));
    }

    (votes, intermediate_winners)
}

fn vote_for<
    T: Trait<I>
        + membership::Trait
        + OptionCreator<
            <T as frame_system::Trait>::AccountId,
            <T as common::membership::Trait>::MemberId,
        >,
    I: Instance,
>(
    name: &'static str,
    voter_id: u32,
    member_option: T::MemberId,
    cycle_id: u32,
    extra_stake: BalanceOf<T>,
) -> (T::AccountId, T::MemberId, T::Hash) {
    let account_id = funded_account::<T, I>(name, voter_id);
    let stake = T::MinimumStake::get() + One::one() + extra_stake;
    let salt = vec![0u8];
    let commitment = Referendum::<T, I>::calculate_commitment(
        &account_id,
        &salt,
        &cycle_id.into(),
        &member_option,
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

    (account_id, member_option, commitment)
}

fn create_account_and_vote<
    T: Trait<I>
        + membership::Trait
        + OptionCreator<
            <T as frame_system::Trait>::AccountId,
            <T as common::membership::Trait>::MemberId,
        >,
    I: Instance,
>(
    name: &'static str,
    voter_id: u32,
    option: u32,
    cycle_id: u32,
    extra_stake: BalanceOf<T>,
) -> (T::AccountId, T::MemberId, T::Hash) {
    let (account_option, member_option) = member_funded_account::<T, I>(option.into());
    T::create_option(account_option, member_option);

    vote_for::<T, I>(name, voter_id, member_option, cycle_id, extra_stake)
}

fn move_to_block<T: Trait<I>, I: Instance>(
    target_block: T::BlockNumber,
    target_stage: ReferendumStage<T::BlockNumber, T::MemberId, T::VotePower>,
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

fn move_to_block_before_initialize<T: Trait<I>, I: Instance>(
    target_block: T::BlockNumber,
    target_stage: ReferendumStage<T::BlockNumber, T::MemberId, T::VotePower>,
) {
    let mut current_block_number = System::<T>::block_number();

    while current_block_number < target_block - One::one() {
        System::<T>::on_finalize(current_block_number);
        Referendum::<T, I>::on_finalize(current_block_number);
        current_block_number = System::<T>::block_number() + One::one();
        System::<T>::set_block_number(current_block_number);
        System::<T>::on_initialize(current_block_number);
        Referendum::<T, I>::on_initialize(current_block_number);
    }

    System::<T>::on_finalize(current_block_number);
    Referendum::<T, I>::on_finalize(current_block_number);
    current_block_number = System::<T>::block_number() + One::one();
    System::<T>::set_block_number(current_block_number);

    assert_eq!(Stage::<T, I>::get(), target_stage, "Stage not reached");
}

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> 8 * byte_number) as u8
}

// Method to generate a distintic valid handle
// for a membership. For each index.
fn handle_from_id<T: Trait<I> + membership::Trait, I: Instance>(id: u32) -> Vec<u8> {
    let mut handle = vec![];

    for i in 0..4 {
        handle.push(get_byte(id, i));
    }

    handle
}

fn member_funded_account<T: Trait<I> + membership::Trait, I: Instance>(
    id: u32,
) -> (T::AccountId, T::MemberId) {
    let account_id = funded_account::<T, I>("account", id);

    let handle = handle_from_id::<T, I>(id);

    let member_id = Membership::<T>::members_created();

    let params = membership::BuyMembershipParameters {
        root_account: account_id.clone(),
        controller_account: account_id.clone(),
        handle: Some(handle),
        metadata: Vec::new(),
        referrer_id: None,
    };

    Membership::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();

    balances::Module::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

    Membership::<T>::add_staking_account_candidate(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id,
    )
    .unwrap();

    Membership::<T>::confirm_staking_account(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id,
        account_id.clone(),
    )
    .unwrap();

    (account_id, member_id)
}

fn add_and_reveal_multiple_votes_and_add_extra_unrevealed_vote<
    T: Trait<I>
        + OptionCreator<
            <T as frame_system::Trait>::AccountId,
            <T as common::membership::Trait>::MemberId,
        > + membership::Trait,
    I: Instance,
>(
    target_winners: u32,
    number_of_voters: u32,
    extra_vote_option: u32,
    extra_stake: BalanceOf<T>,
) -> (
    Vec<OptionResult<T::MemberId, T::VotePower>>,
    T::AccountId,
    T::MemberId,
    T::Hash,
) {
    start_voting_cycle::<T, I>(target_winners);

    let cycle_id = 0;
    let (votes, intermediate_winners) =
        make_multiple_votes_for_multiple_options::<T, I>(number_of_voters, cycle_id);

    let (account_id, option_id, commitment) = if extra_vote_option >= number_of_voters {
        create_account_and_vote::<T, I>(
            "caller",
            (2 * number_of_voters + 1).into(),
            extra_vote_option,
            cycle_id,
            extra_stake,
        )
    } else {
        vote_for::<T, I>(
            "caller",
            (2 * number_of_voters + 1).into(),
            intermediate_winners[extra_vote_option as usize].option_id,
            cycle_id,
            extra_stake,
        )
    };

    let started_voting_block_number = System::<T>::block_number();
    let target_block_number = T::VoteStageDuration::get() + started_voting_block_number;

    let target_stage = ReferendumStage::Revealing(ReferendumStageRevealingOf::<T, I> {
        started: target_block_number,
        winning_target_count: (target_winners + 1).into(),
        intermediate_winners: vec![],
        current_cycle_id: cycle_id.into(),
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
        current_cycle_id: cycle_id.into(),
    });

    assert_eq!(
        Referendum::<T, I>::stage(),
        current_stage,
        "Votes not revealed",
    );

    (intermediate_winners, account_id, option_id, commitment)
}

benchmarks_instance! {
    where_clause {
        where T: OptionCreator<<T as frame_system::Trait>::AccountId,
        <T as common::membership::Trait>::MemberId>,
        T: membership::Trait
    }
    _ { }

    on_initialize_revealing {
        let i in 0 .. (T::MaxWinnerTargetCount::get() - 1) as u32;

        let cycle_id = 0;
        let salt = vec![0u8];
        let vote_option = 2 * (i + 1); // Greater than number of voters + number of candidates
        let started_voting_block_number = System::<T>::block_number();

        let (intermediate_winners, _, _, _) =
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
                started: started_voting_block_number + T::VoteStageDuration::get(),
                winning_target_count: (i + 1).into(),
                current_cycle_id: cycle_id,
            }
        );

        move_to_block_before_initialize::<T, I>(
            target_block_number,
            target_stage
        );
    }: { Referendum::<T, I>::on_initialize(System::<T>::block_number()); }
    verify {
        assert_eq!(
            Referendum::<T, I>::stage(),
            ReferendumStage::Inactive,
            "Reveal perdiod hasn't ended",
        );

        assert_last_event::<T, I>(RawEvent::ReferendumFinished(intermediate_winners).into());
    }

    on_initialize_voting {
        let winning_target_count = 0;
        let cycle_id = 0;
        start_voting_cycle::<T, I>(winning_target_count);

        let started_voting_block_number = System::<T>::block_number();
        let target_block_number =
            T::VoteStageDuration::get() + started_voting_block_number;

        let target_stage = ReferendumStage::Voting(ReferendumStageVoting {
                started: System::<T>::block_number(),
                winning_target_count: (winning_target_count + 1).into(),
                current_cycle_id: cycle_id,
        });

        move_to_block_before_initialize::<T, I>(target_block_number, target_stage);
    }: { Referendum::<T, I>::on_initialize(System::<T>::block_number()); }
    verify {
        let current_stage = ReferendumStage::Revealing(ReferendumStageRevealing {
            started: target_block_number,
            winning_target_count: 1,
            intermediate_winners: vec![],
            current_cycle_id: cycle_id,
        });

        assert_eq!(
            Referendum::<T, I>::stage(),
            current_stage,
            "Voting period not ended"
        );

        assert_last_event::<T, I>(RawEvent::RevealingStageStarted().into());
    }

    vote {
        start_voting_cycle::<T, I>(0);

        let account_id = funded_account::<T, I>("caller", 0);

        let salt = vec![0u8];
        let cycle_id = 0;
        let vote_option = 0;
        let commitment =
            Referendum::<T, I>::calculate_commitment(
                &account_id,
                &salt,
                &cycle_id,
                &vote_option.into()
            );

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
        let i in 0 .. (T::MaxWinnerTargetCount::get() - 1) as u32;

        let salt = vec![0u8];
        let vote_option = 2 * (i + 1); // Greater than number of voters + number of candidates
        let started_block_number = System::<T>::block_number();

        let (mut intermediate_winners, account_id, option_id, commitment) =
            add_and_reveal_multiple_votes_and_add_extra_unrevealed_vote::<T, I>(
                i,
                i,
                vote_option,
                One::one()
            );
    }: reveal_vote(RawOrigin::Signed(account_id.clone()), salt.clone(), option_id)
    verify {
        let stake = T::MinimumStake::get() + One::one() + One::one();
        let cycle_id = 0;

        intermediate_winners.insert(
            0,
            OptionResult{
                option_id: option_id,
                vote_power: T::calculate_vote_power(&account_id.clone(), &stake),
            }
        );

        assert_eq!(
            Referendum::<T, I>::stage(),
            ReferendumStage::Revealing(ReferendumStageRevealing{
                intermediate_winners,
                winning_target_count: (i+1).into(),
                started: T::VoteStageDuration::get() + started_block_number,
                current_cycle_id: cycle_id,
            }),
            "Vote not revealed",
        );

        assert_eq!(
            Referendum::<T, I>::votes(account_id.clone()),
            CastVote {
                commitment,
                stake,
                cycle_id,
                vote_for: Some(option_id),
            },
            "Vote not revealed",
        );

        assert_last_event::<T, I>(RawEvent::VoteRevealed(account_id, option_id, salt).into());
    }

    reveal_vote_space_not_in_winners {
        let i in 0 .. (T::MaxWinnerTargetCount::get() - 1) as u32;

        let salt = vec![0u8];
        let vote_option = 2 * (i + 1); // Greater than number of voters + number of candidates
        let started_block_number = System::<T>::block_number();

        let (intermediate_winners, account_id, option_id, commitment) =
            add_and_reveal_multiple_votes_and_add_extra_unrevealed_vote::<T, I>(
                i,
                i + 1,
                vote_option,
                Zero::zero(),
            );
    }: reveal_vote(RawOrigin::Signed(account_id.clone()), salt.clone(), option_id)
    verify {
        let stake = T::MinimumStake::get() + One::one();
        let cycle_id = 0;

        assert_eq!(
            Referendum::<T, I>::stage(),
            ReferendumStage::Revealing(ReferendumStageRevealing{
                intermediate_winners,
                winning_target_count: (i+1).into(),
                started: T::VoteStageDuration::get() + started_block_number,
                current_cycle_id: cycle_id,
            }),
            "Vote not revealed",
        );

        assert_eq!(
            Referendum::<T, I>::votes(account_id.clone()),
            CastVote {
                commitment,
                stake,
                cycle_id: cycle_id,
                vote_for: Some(option_id),
            },
            "Vote not revealed",
        );

        assert_last_event::<T, I>(RawEvent::VoteRevealed(account_id, option_id, salt).into());
    }

    reveal_vote_space_replace_last_winner {
        let i in 0 .. (T::MaxWinnerTargetCount::get() - 1) as u32;

        let salt = vec![0u8];
        let vote_option = 2 * (i + 1); // Greater than number of voters + number of candidates
        let started_block_number = System::<T>::block_number();

        let (mut intermediate_winners, account_id, option_id, commitment) =
            add_and_reveal_multiple_votes_and_add_extra_unrevealed_vote::<T, I>(
                i,
                i + 1,
                vote_option,
                One::one(),
            );
    }: reveal_vote(RawOrigin::Signed(account_id.clone()), salt.clone(), option_id)
    verify {
        let stake = T::MinimumStake::get() + One::one() + One::one();
        let cycle_id = 0;

        intermediate_winners.pop();

        intermediate_winners.insert(0, OptionResult{
            option_id: option_id,
            vote_power: T::calculate_vote_power(&account_id.clone(), &stake),
        });

        assert_eq!(
            Referendum::<T, I>::stage(),
            ReferendumStage::Revealing(ReferendumStageRevealing{
                intermediate_winners,
                winning_target_count: (i+1).into(),
                started: T::VoteStageDuration::get() + started_block_number,
                current_cycle_id: cycle_id,
            }),
            "Vote not revealed",
        );

        assert_eq!(
            Referendum::<T, I>::votes(account_id.clone()),
            CastVote {
                commitment,
                stake,
                cycle_id,
                vote_for: Some(option_id),
            },
            "Vote not revealed",
        );

        assert_last_event::<T, I>(RawEvent::VoteRevealed(account_id, option_id, salt).into());
    }

    reveal_vote_already_existing {
        let i in 0 .. (T::MaxWinnerTargetCount::get() - 1) as u32;

        let salt = vec![0u8];
        let vote_option = i;
        let started_block_number = System::<T>::block_number();

        let (mut intermediate_winners, account_id, option_id, commitment) =
            add_and_reveal_multiple_votes_and_add_extra_unrevealed_vote::<T, I>(
                i,
                i + 1,
                vote_option,
                Zero::zero()
            );

        let old_vote_power = intermediate_winners[i as usize].vote_power;
        let new_vote_power = old_vote_power + T::get_option_power(&option_id);
    }: reveal_vote(RawOrigin::Signed(account_id.clone()), salt.clone(), option_id)
    verify {
        let stake = T::MinimumStake::get() + One::one();
        let cycle_id = 0;

        intermediate_winners[i as usize] = OptionResult {
            option_id: option_id,
            vote_power: new_vote_power,
        };

        let last_winner = intermediate_winners.pop().unwrap();
        intermediate_winners.insert(0, last_winner);
        assert_eq!(
            Referendum::<T, I>::stage(),
            ReferendumStage::Revealing(ReferendumStageRevealing{
                intermediate_winners,
                winning_target_count: (i+1).into(),
                started: T::VoteStageDuration::get() + started_block_number,
                current_cycle_id: cycle_id,
            }),
            "Vote not revealed",
        );

        assert_eq!(
            Referendum::<T, I>::votes(account_id.clone()),
            CastVote {
                commitment,
                stake,
                cycle_id,
                vote_for: Some(option_id),
            },
            "Vote not revealed",
        );

        assert_last_event::<T, I>(RawEvent::VoteRevealed(account_id, option_id, salt).into());
    }

    release_vote_stake {
        start_voting_cycle::<T, I>(0);

        let cycle_id = 0;
        let option = 0;
        let stake = T::MinimumStake::get() + One::one();
        let salt = vec![0u8];

        let (account_id, option, commitment) =
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

    impl
        OptionCreator<
            <Runtime as frame_system::Trait>::AccountId,
            <Runtime as common::membership::Trait>::MemberId,
        > for Runtime
    {
        fn create_option(
            _: <Runtime as frame_system::Trait>::AccountId,
            _: <Runtime as common::membership::Trait>::MemberId,
        ) {
        }
    }

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
    fn test_on_initialize_voting() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_on_initialize_voting::<Runtime>());
        })
    }

    #[test]
    fn test_on_initialize_revealing() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            assert_ok!(test_benchmark_on_initialize_revealing::<Runtime>());
        })
    }
}
