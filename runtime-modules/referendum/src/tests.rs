#![cfg(test)]

use super::{Error, ReferendumResult, Trait};
use crate::mock::*;

type Mocks = InstanceMocks<Runtime, Instance0>;
type MockUtils = InstanceMockUtils<Runtime, Instance0>;

/////////////////// Lifetime - referendum start ////////////////////////////////
#[test]
fn referendum_start() {
    MockUtils::origin_access(USER_ADMIN, |origin| {
        let options = vec![0];
        let winning_target_count = 1;

        Mocks::start_referendum(origin, options, winning_target_count, Ok(()));
    });
}

#[test]
fn referendum_start_access_restricted() {
    MockUtils::origin_access(USER_REGULAR, |origin| {
        let options = vec![0];
        let winning_target_count = 1;

        Mocks::start_referendum(
            origin,
            options,
            winning_target_count,
            Err(Error::OriginNotSuperUser),
        );
    });
}

#[test]
fn referendum_start_forbidden_after_start() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_ADMIN);
        let options = vec![0];
        let winning_target_count = 1;

        Mocks::start_referendum(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        Mocks::start_referendum(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Err(Error::ReferendumAlreadyRunning),
        );
    });
}

#[test]
fn referendum_start_no_options() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_ADMIN);
        let options = vec![];
        let winning_target_count = 1;

        Mocks::start_referendum(
            origin.clone(),
            options,
            winning_target_count,
            Err(Error::NoReferendumOptions),
        );
    });
}

#[test]
fn referendum_start_too_many_options() {
    let origin = OriginType::Signed(USER_ADMIN);
    let winning_target_count = 1;

    let too_many_options: Vec<u64> =
        (0..(<Runtime as Trait<Instance0>>::MaxReferendumOptions::get() + 1)).collect();
    let ok_options = too_many_options.as_slice()[..too_many_options.len() - 1].to_vec();

    let config = default_genesis_config();
    build_test_externalities(config).execute_with(|| {
        Mocks::start_referendum(origin.clone(), ok_options, winning_target_count, Ok(()));
    });

    let config = default_genesis_config();
    build_test_externalities(config).execute_with(|| {
        Mocks::start_referendum(
            origin.clone(),
            too_many_options,
            winning_target_count,
            Err(Error::TooManyReferendumOptions),
        );
    });
}

#[test]
fn referendum_start_not_unique_options() {
    let config = default_genesis_config();
    let winning_target_count = 1;

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_ADMIN);
        let options = vec![0, 1, 2, 2, 3];

        Mocks::start_referendum(
            origin.clone(),
            options,
            winning_target_count,
            Err(Error::DuplicateReferendumOptions),
        );
    });
}

/////////////////// Lifetime - voting //////////////////////////////////////////
#[test]
fn voting() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let winning_target_count = 1;

        let options = vec![0];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, _) = MockUtils::vote_commitment(account_id, options[0]);

        Mocks::start_referendum(origin.clone(), options, winning_target_count, Ok(()));

        Mocks::vote(origin.clone(), account_id, commitment, stake, Ok(()));
    });
}

#[test]
fn voting_referendum_not_running() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);

        let options = vec![0];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, _) = MockUtils::vote_commitment(account_id, options[0]);

        Mocks::vote(
            origin.clone(),
            account_id,
            commitment,
            stake,
            Err(Error::ReferendumNotRunning),
        );
    });
}

#[test]
fn voting_voting_stage_overdue() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let winning_target_count = 1;

        let options = vec![0];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, _) = MockUtils::vote_commitment(account_id, options[0]);

        Mocks::start_referendum(origin.clone(), options, winning_target_count, Ok(()));

        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::vote(
            origin.clone(),
            account_id,
            commitment,
            stake,
            Err(Error::ReferendumNotRunning),
        );
    });
}

#[test]
fn voting_stake_too_low() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let winning_target_count = 1;

        let options = vec![0];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get() - 1;
        let (commitment, _) = MockUtils::vote_commitment(account_id, options[0]);

        Mocks::start_referendum(origin.clone(), options, winning_target_count, Ok(()));
        Mocks::vote(
            origin.clone(),
            account_id,
            commitment,
            stake,
            Err(Error::InsufficientStake),
        );
    });
}

#[test]
fn voting_cant_lock_stake() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let winning_target_count = 1;

        let options = vec![0];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, _) = MockUtils::vote_commitment(account_id, options[0]);

        Mocks::start_referendum(origin.clone(), options, winning_target_count, Ok(()));

        Runtime::feature_stack_lock(false, true, true);
        Mocks::vote(
            origin.clone(),
            account_id,
            commitment,
            stake,
            Err(Error::InsufficientBalanceToStakeCurrency),
        );

        Runtime::feature_stack_lock(true, false, true);
        Mocks::vote(
            origin.clone(),
            account_id,
            commitment,
            stake,
            Err(Error::AccountStakeCurrencyFailed),
        );
    });
}

#[test]
fn voting_user_already_voted() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let winning_target_count = 1;

        let options = vec![0];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, _) = MockUtils::vote_commitment(account_id, options[0]);

        Mocks::start_referendum(origin.clone(), options, winning_target_count, Ok(()));
        Mocks::vote(origin.clone(), account_id, commitment, stake, Ok(()));

        Mocks::vote(
            origin.clone(),
            account_id,
            commitment,
            stake,
            Err(Error::AlreadyVoted),
        );
    });
}

/////////////////// Lifetime - voting finish ///////////////////////////////////

#[test]
fn finish_voting() {
    MockUtils::origin_access(USER_ADMIN, |origin| {
        let options = vec![0];
        let winning_target_count = 1;

        Mocks::start_referendum(origin.clone(), options, winning_target_count, Ok(()));

        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();

        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::finish_voting(origin.clone(), Ok(()));
    });
}

/////////////////// Lifetime - revealing ///////////////////////////////////////

#[test]
fn reveal() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let options = vec![0, 1, 2];
        let winning_target_count = 1;

        let option_to_vote_for = options[1];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, salt) = MockUtils::vote_commitment(account_id, option_to_vote_for);

        Mocks::start_referendum(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        Mocks::vote(origin.clone(), account_id, commitment, stake, Ok(()));
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::finish_voting(origin.clone(), Ok(()));
        Mocks::reveal_vote(origin.clone(), account_id, salt, option_to_vote_for, Ok(()));
    });
}

#[test]
fn reveal_reveal_stage_not_running() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let reveal_stage_duration = <Runtime as Trait<Instance0>>::RevealStageDuration::get();
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let options = vec![0, 1, 2];
        let winning_target_count = 1;

        let option_to_vote_for = options[1];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, salt) = MockUtils::vote_commitment(account_id, option_to_vote_for);

        Mocks::start_referendum(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );

        Mocks::reveal_vote(
            origin.clone(),
            account_id,
            salt.clone(),
            option_to_vote_for,
            Err(Error::RevealingNotInProgress),
        );

        Mocks::vote(origin.clone(), account_id, commitment, stake, Ok(()));
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::finish_voting(origin.clone(), Ok(()));
        MockUtils::increase_block_number(reveal_stage_duration + 1);
        Mocks::finish_revealing_period(
            origin.clone(),
            Ok(()),
            Some(ReferendumResult::NoVotesRevealed),
        );

        Mocks::reveal_vote(
            origin.clone(),
            account_id,
            salt.clone(),
            option_to_vote_for,
            Err(Error::RevealingNotInProgress),
        );
    });
}

#[test]
fn reveal_no_vote() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let reveal_stage_duration = <Runtime as Trait<Instance0>>::RevealStageDuration::get();
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let options = vec![0, 1, 2];
        let winning_target_count = 1;

        Mocks::start_referendum(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::finish_voting(origin.clone(), Ok(()));
        MockUtils::increase_block_number(reveal_stage_duration + 1);

        Mocks::finish_revealing_period(
            origin.clone(),
            Ok(()),
            Some(ReferendumResult::NoVotesRevealed),
        );
    });
}

#[test]
fn reveal_invalid_vote() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let options = vec![0, 1, 2];
        let winning_target_count = 1;

        let invalid_option = 1000;
        let option_to_vote_for = options[1];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, salt) = MockUtils::vote_commitment(account_id, option_to_vote_for);

        Mocks::start_referendum(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        Mocks::vote(origin.clone(), account_id, commitment, stake, Ok(()));
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::finish_voting(origin.clone(), Ok(()));
        Mocks::reveal_vote(
            origin.clone(),
            account_id,
            salt,
            invalid_option,
            Err(Error::InvalidVote),
        );
    });
}

#[test]
fn reveal_invalid_commitment_proof() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let options = vec![0, 1, 2];
        let winning_target_count = 1;

        let option_to_vote_for = options[0];
        let invalid_option = option_to_vote_for + 1;
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, salt) = MockUtils::vote_commitment(account_id, option_to_vote_for);

        Mocks::start_referendum(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        Mocks::vote(origin.clone(), account_id, commitment, stake, Ok(()));
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::finish_voting(origin.clone(), Ok(()));
        Mocks::reveal_vote(
            origin.clone(),
            account_id,
            salt,
            invalid_option,
            Err(Error::InvalidReveal),
        );
    });
}

/////////////////// Lifetime - revealing finish ////////////////////////////////

#[test]
fn finish_revealing_period() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let reveal_stage_duration = <Runtime as Trait<Instance0>>::RevealStageDuration::get();
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let options = vec![0, 1, 2];
        let winning_target_count = 1;

        let option_to_vote_for = options[0];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, salt) = MockUtils::vote_commitment(account_id, option_to_vote_for);

        Mocks::start_referendum(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        Mocks::vote(origin.clone(), account_id, commitment, stake, Ok(()));
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::finish_voting(origin.clone(), Ok(()));
        Mocks::reveal_vote(origin.clone(), account_id, salt, option_to_vote_for, Ok(()));
        MockUtils::increase_block_number(reveal_stage_duration + 1);

        Mocks::finish_revealing_period(
            origin.clone(),
            Ok(()),
            Some(ReferendumResult::Winners(vec![(
                option_to_vote_for,
                1 * stake,
            )])),
        );
    });
}

#[test]
fn finish_revealing_period_no_revealing_stage() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let options = vec![0, 1, 2];
        let winning_target_count = 1;

        let option_to_vote_for = options[0];
        let (_, salt) = MockUtils::vote_commitment(account_id, option_to_vote_for);

        Mocks::reveal_vote(
            origin.clone(),
            account_id,
            salt.clone(),
            option_to_vote_for,
            Err(Error::RevealingNotInProgress),
        );

        Mocks::start_referendum(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        Mocks::reveal_vote(
            origin.clone(),
            account_id,
            salt.clone(),
            option_to_vote_for,
            Err(Error::RevealingNotInProgress),
        );
    });
}

#[test]
fn finish_revealing_period_vote_power() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let reveal_stage_duration = <Runtime as Trait<Instance0>>::RevealStageDuration::get();
        let account_superuser = USER_ADMIN;
        let account_id1 = USER_REGULAR;
        let account_id2 = USER_REGULAR_POWER_VOTES;
        let origin = OriginType::Signed(account_superuser);
        let origin_voter1 = OriginType::Signed(account_id1);
        let origin_voter2 = OriginType::Signed(account_id2);
        let options = vec![0, 1, 2];
        let winning_target_count = 1;

        let option_to_vote_for1 = options[0];
        let option_to_vote_for2 = options[1];
        let stake_bigger = <Runtime as Trait<Instance0>>::MinimumStake::get() * 2;
        let stake_smaller = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment1, salt1) = MockUtils::vote_commitment(account_id1, option_to_vote_for1);
        let (commitment2, salt2) = MockUtils::vote_commitment(account_id2, option_to_vote_for2);

        Mocks::start_referendum(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        Mocks::vote(
            origin_voter1.clone(),
            account_id1,
            commitment1,
            stake_bigger,
            Ok(()),
        ); // vote for first option by regular user
        Mocks::vote(
            origin_voter2.clone(),
            account_id2,
            commitment2,
            stake_smaller,
            Ok(()),
        ); // vote for second option by prominent user
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::finish_voting(origin.clone(), Ok(()));
        Mocks::reveal_vote(
            origin_voter1.clone(),
            account_id1,
            salt1,
            option_to_vote_for1,
            Ok(()),
        );
        Mocks::reveal_vote(
            origin_voter2.clone(),
            account_id2,
            salt2,
            option_to_vote_for2,
            Ok(()),
        );
        MockUtils::increase_block_number(reveal_stage_duration + 1);

        // option 2 should win because prominent user has more powerfull vote with the same stake
        Mocks::finish_revealing_period(
            origin.clone(),
            Ok(()),
            Some(ReferendumResult::Winners(vec![(
                option_to_vote_for2,
                1 * stake_smaller * POWER_VOTE_STRENGTH,
            )])),
        );
    });
}

/////////////////// Referendum Winners ////////////////////////////////////////////////////

#[test]
fn winners_no_vote_revealed() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let reveal_stage_duration = <Runtime as Trait<Instance0>>::RevealStageDuration::get();
        let origin = OriginType::Signed(USER_ADMIN);
        let options = vec![0];
        let winning_target_count = 1;

        Mocks::start_referendum(origin.clone(), options, winning_target_count, Ok(()));
        MockUtils::increase_block_number(voting_stage_duration + 1);
        Mocks::finish_voting(origin.clone(), Ok(()));
        MockUtils::increase_block_number(reveal_stage_duration + 1);
        Mocks::finish_revealing_period(
            origin.clone(),
            Ok(()),
            Some(ReferendumResult::NoVotesRevealed),
        );
    });
}

#[test]
fn winners_multiple_winners() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let reveal_stage_duration = <Runtime as Trait<Instance0>>::RevealStageDuration::get();
        let account_superuser = USER_ADMIN;
        let account_id1 = USER_REGULAR;
        let account_id2 = USER_REGULAR_2;
        let account_id3 = USER_REGULAR_3;
        let origin = OriginType::Signed(account_superuser);
        let origin_voter1 = OriginType::Signed(account_id1);
        let origin_voter2 = OriginType::Signed(account_id2);
        let origin_voter3 = OriginType::Signed(account_id3);
        let options = vec![0, 1, 2];
        let winning_target_count = 2;

        let option_to_vote_for1 = options[0];
        let option_to_vote_for2 = options[1];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment1, salt1) = MockUtils::vote_commitment(account_id1, option_to_vote_for1);
        let (commitment2, salt2) = MockUtils::vote_commitment(account_id2, option_to_vote_for1);
        let (commitment3, salt3) = MockUtils::vote_commitment(account_id3, option_to_vote_for2);

        Mocks::start_referendum(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        Mocks::vote(
            origin_voter1.clone(),
            account_id1,
            commitment1,
            stake,
            Ok(()),
        );
        Mocks::vote(
            origin_voter2.clone(),
            account_id2,
            commitment2,
            stake,
            Ok(()),
        );
        Mocks::vote(
            origin_voter3.clone(),
            account_id3,
            commitment3,
            stake,
            Ok(()),
        );
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::finish_voting(origin.clone(), Ok(()));
        Mocks::reveal_vote(
            origin_voter1.clone(),
            account_id1,
            salt1,
            option_to_vote_for1,
            Ok(()),
        );
        Mocks::reveal_vote(
            origin_voter2.clone(),
            account_id2,
            salt2,
            option_to_vote_for1,
            Ok(()),
        );
        Mocks::reveal_vote(
            origin_voter3.clone(),
            account_id3,
            salt3,
            option_to_vote_for2,
            Ok(()),
        );
        MockUtils::increase_block_number(reveal_stage_duration + 1);

        let expected_winners = vec![
            (option_to_vote_for1, 2 * stake),
            (option_to_vote_for2, 1 * stake),
        ];

        Mocks::finish_revealing_period(
            origin.clone(),
            Ok(()),
            Some(ReferendumResult::Winners(expected_winners)),
        );
    });
}

#[test]
// option 1 and option 2 has the same amount of votes but only 1 winner is expected
fn winners_multiple_winners_extra() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let reveal_stage_duration = <Runtime as Trait<Instance0>>::RevealStageDuration::get();
        let account_superuser = USER_ADMIN;
        let account_id1 = USER_REGULAR;
        let account_id2 = USER_REGULAR_2;
        let origin = OriginType::Signed(account_superuser);
        let origin_voter1 = OriginType::Signed(account_id1);
        let origin_voter2 = OriginType::Signed(account_id2);
        let options = vec![0, 1, 2];
        let winning_target_count = 1;

        let option_to_vote_for1 = options[0];
        let option_to_vote_for2 = options[1];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment1, salt1) = MockUtils::vote_commitment(account_id1, option_to_vote_for1);
        let (commitment2, salt2) = MockUtils::vote_commitment(account_id2, option_to_vote_for2);

        Mocks::start_referendum(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        Mocks::vote(
            origin_voter1.clone(),
            account_id1,
            commitment1,
            stake,
            Ok(()),
        );
        Mocks::vote(
            origin_voter2.clone(),
            account_id2,
            commitment2,
            stake,
            Ok(()),
        );
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::finish_voting(origin.clone(), Ok(()));
        Mocks::reveal_vote(
            origin_voter1.clone(),
            account_id1,
            salt1,
            option_to_vote_for1,
            Ok(()),
        );
        Mocks::reveal_vote(
            origin_voter2.clone(),
            account_id2,
            salt2,
            option_to_vote_for2,
            Ok(()),
        );
        MockUtils::increase_block_number(reveal_stage_duration + 1);

        let expected_winners = vec![
            (option_to_vote_for1, 1 * stake),
            (option_to_vote_for2, 1 * stake),
        ];

        Mocks::finish_revealing_period(
            origin.clone(),
            Ok(()),
            Some(ReferendumResult::ExtraWinners(expected_winners)),
        );
    });
}

#[test]
fn winners_multiple_not_enough() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let reveal_stage_duration = <Runtime as Trait<Instance0>>::RevealStageDuration::get();
        let account_superuser = USER_ADMIN;
        let account_id1 = USER_REGULAR;
        let origin = OriginType::Signed(account_superuser);
        let origin_voter1 = OriginType::Signed(account_id1);
        let options = vec![0, 1, 2];
        let winning_target_count = 2;

        let option_to_vote_for1 = options[0];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment1, salt1) = MockUtils::vote_commitment(account_id1, option_to_vote_for1);

        Mocks::start_referendum(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        Mocks::vote(
            origin_voter1.clone(),
            account_id1,
            commitment1,
            stake,
            Ok(()),
        );
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::finish_voting(origin.clone(), Ok(()));
        Mocks::reveal_vote(
            origin_voter1.clone(),
            account_id1,
            salt1,
            option_to_vote_for1,
            Ok(()),
        );
        MockUtils::increase_block_number(reveal_stage_duration + 1);

        let expected_winners = vec![(option_to_vote_for1, 1 * stake)];

        Mocks::finish_revealing_period(
            origin.clone(),
            Ok(()),
            Some(ReferendumResult::NotEnoughWinners(expected_winners)),
        );
    });
}
