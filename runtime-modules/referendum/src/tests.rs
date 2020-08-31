#![cfg(test)]

use super::{Error, ReferendumResult, Trait};
use crate::mock::*;

type Mocks = InstanceMocks<Runtime, Instance0>;
type MockUtils = InstanceMockUtils<Runtime, Instance0>;

/////////////////// Lifetime - referendum start ////////////////////////////////

/// Test that referendum can be successfully started via extrinsic.
#[test]
fn referendum_start() {
    MockUtils::origin_access(USER_ADMIN, |origin| {
        let options = 1;
        let winning_target_count = 1;

        Mocks::start_referendum_extrinsic(origin, options, winning_target_count, Ok(()));
    });
}

/// Test that referendum can be started via extrinsic only by superuser.
#[test]
fn referendum_start_access_restricted() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let options = 1;
        let winning_target_count = 1;

        Mocks::start_referendum_extrinsic(
            OriginType::None,
            options,
            winning_target_count,
            Err(Error::BadOrigin),
        );
    });
}

/// Test that referendum can't be started again before it ends first.
#[test]
fn referendum_start_forbidden_after_start() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_ADMIN);
        let options = 1;
        let winning_target_count = 1;

        Mocks::start_referendum_extrinsic(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        Mocks::start_referendum_extrinsic(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Err(Error::ReferendumAlreadyRunning),
        );
    });
}

/// Test that referendum can't be started with too many options.
#[test]
fn referendum_start_too_many_options() {
    let origin = OriginType::Signed(USER_ADMIN);
    let winning_target_count = 1;

    let ok_options = <Runtime as Trait<Instance0>>::MaxReferendumOptions::get();
    let too_many_options: u64 = ok_options + 1;

    let config = default_genesis_config();
    build_test_externalities(config).execute_with(|| {
        Mocks::start_referendum_extrinsic(origin.clone(), ok_options, winning_target_count, Ok(()));
    });

    let config = default_genesis_config();
    build_test_externalities(config).execute_with(|| {
        Mocks::start_referendum_extrinsic(
            origin.clone(),
            too_many_options,
            winning_target_count,
            Err(Error::TooManyReferendumOptions),
        );
    });
}

/////////////////// Lifetime - voting //////////////////////////////////////////

/// Test that a user can successfully vote in the referendum.
#[test]
fn voting() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let winning_target_count = 1;

        let options = 1;
        let option_to_vote_for = 0;
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, _) = MockUtils::calculate_commitment(&account_id, &option_to_vote_for);

        Mocks::start_referendum_extrinsic(origin.clone(), options, winning_target_count, Ok(()));

        Mocks::vote(origin.clone(), account_id, commitment, stake, Ok(()));
    });
}

/// Test that voting is prohibited outside of the voting stage.
#[test]
fn voting_referendum_not_running() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let winning_target_count = 1;

        let options = 1;
        let option_to_vote_for = 0;
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, _) = MockUtils::calculate_commitment(&account_id, &option_to_vote_for);

        // try to vote before referendum starts
        Mocks::vote(
            origin.clone(),
            account_id,
            commitment,
            stake,
            Err(Error::ReferendumNotRunning),
        );

        Mocks::start_referendum_extrinsic(origin.clone(), options, winning_target_count, Ok(()));

        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        MockUtils::increase_block_number(voting_stage_duration + 1);

        // try to vote after voting stage ended
        Mocks::vote(
            origin.clone(),
            account_id,
            commitment,
            stake,
            Err(Error::ReferendumNotRunning),
        );
    });
}

/// Test that vote will fail when staking too little.
#[test]
fn voting_stake_too_low() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let winning_target_count = 1;

        let options = 1;
        let option_to_vote_for = 0;
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get() - 1;
        let (commitment, _) = MockUtils::calculate_commitment(&account_id, &option_to_vote_for);

        Mocks::start_referendum_extrinsic(origin.clone(), options, winning_target_count, Ok(()));
        Mocks::vote(
            origin.clone(),
            account_id,
            commitment,
            stake,
            Err(Error::InsufficientStake),
        );
    });
}

/// Test that a user can change his vote/stake during the voting stage.
#[test]
fn voting_user_repeated_vote() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let winning_target_count = 1;

        let options = 1;
        let option_to_vote_for = 0;
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let different_stake = stake * 2;
        let (commitment, _) = MockUtils::calculate_commitment(&account_id, &option_to_vote_for);

        Mocks::start_referendum_extrinsic(origin.clone(), options, winning_target_count, Ok(()));
        Mocks::vote(
            origin.clone(),
            account_id,
            commitment,
            stake.clone(),
            Ok(()),
        );

        Mocks::vote(
            origin.clone(),
            account_id,
            commitment,
            different_stake.clone(),
            Ok(()),
        );
    });
}

/////////////////// Lifetime - voting finish ///////////////////////////////////

/// Test that referendum will indeed finish after expected number of blocks.
#[test]
fn finish_voting() {
    MockUtils::origin_access(USER_ADMIN, |origin| {
        let options = 1;
        let winning_target_count = 1;

        Mocks::start_referendum_extrinsic(origin.clone(), options, winning_target_count, Ok(()));

        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();

        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::check_voting_finished(options, winning_target_count);
    });
}

/////////////////// Lifetime - revealing ///////////////////////////////////////

/// That that a user can reveal his vote.
#[test]
fn reveal() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let options = 3;
        let winning_target_count = 1;

        let option_to_vote_for = 1;
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, salt) = MockUtils::calculate_commitment(&account_id, &option_to_vote_for);

        Mocks::start_referendum_extrinsic(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        Mocks::vote(origin.clone(), account_id, commitment, stake, Ok(()));
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::check_voting_finished(options, winning_target_count);
        Mocks::reveal_vote(
            origin.clone(),
            account_id,
            salt,
            option_to_vote_for.clone(),
            Ok(()),
        );
    });
}

/// Test that a user can't vote outside of the voting stage.
#[test]
fn reveal_reveal_stage_not_running() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let reveal_stage_duration = <Runtime as Trait<Instance0>>::RevealStageDuration::get();
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let options = 3;
        let winning_target_count = 1;

        let option_to_vote_for = 1;
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, salt) = MockUtils::calculate_commitment(&account_id, &option_to_vote_for);

        Mocks::start_referendum_extrinsic(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );

        Mocks::reveal_vote(
            origin.clone(),
            account_id,
            salt.clone(),
            option_to_vote_for.clone(),
            Err(Error::RevealingNotInProgress),
        );

        Mocks::vote(origin.clone(), account_id, commitment, stake, Ok(()));
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::check_voting_finished(options, winning_target_count);
        MockUtils::increase_block_number(reveal_stage_duration + 1);
        Mocks::check_revealing_finished(ReferendumResult::NoVotesRevealed);

        Mocks::reveal_vote(
            origin.clone(),
            account_id,
            salt.clone(),
            option_to_vote_for.clone(),
            Err(Error::RevealingNotInProgress),
        );
    });
}

/// Test that the revealing stage will finish after expected number of blocks even when no votes were cast.
#[test]
fn reveal_no_vote() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let reveal_stage_duration = <Runtime as Trait<Instance0>>::RevealStageDuration::get();
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let options = 3;
        let winning_target_count = 1;

        Mocks::start_referendum_extrinsic(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::check_voting_finished(options, winning_target_count);
        MockUtils::increase_block_number(reveal_stage_duration + 1);

        Mocks::check_revealing_finished(ReferendumResult::NoVotesRevealed);
    });
}

/// Test that salt used to calculate commitment isn't too long.
#[test]
fn reveal_salt_too_long() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let max_salt_length = <Runtime as Trait<Instance0>>::MaxSaltLength::get();
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let options = 3;
        let winning_target_count = 1;

        let mut salt = vec![];
        for _ in 0..(max_salt_length / 8 + 1) {
            salt.append(&mut MockUtils::generate_salt());
        }

        let option_to_vote_for = 1;
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, _) =
            MockUtils::calculate_commitment_custom_salt(&account_id, &option_to_vote_for, &salt);

        Mocks::start_referendum_extrinsic(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        Mocks::vote(origin.clone(), account_id, commitment, stake, Ok(()));
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::check_voting_finished(options, winning_target_count);
        Mocks::reveal_vote(
            origin.clone(),
            account_id,
            salt,
            option_to_vote_for,
            Err(Error::SaltTooLong),
        );
    });
}

/// Test that revealing of a vote for a not-existing option is rejected.
#[test]
fn reveal_invalid_vote() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let options = 3;
        let winning_target_count = 1;

        let invalid_option = 1000;
        let option_to_vote_for = 1;
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, salt) = MockUtils::calculate_commitment(&account_id, &option_to_vote_for);

        Mocks::start_referendum_extrinsic(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        Mocks::vote(origin.clone(), account_id, commitment, stake, Ok(()));
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::check_voting_finished(options, winning_target_count);
        Mocks::reveal_vote(
            origin.clone(),
            account_id,
            salt,
            invalid_option,
            Err(Error::InvalidVote),
        );
    });
}

/// Test that invalid commitment proof is rejected.
#[test]
fn reveal_invalid_commitment_proof() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let options = 3;
        let winning_target_count = 1;

        let option_to_vote_for = 0;
        let invalid_option = option_to_vote_for + 1;
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, salt) = MockUtils::calculate_commitment(&account_id, &option_to_vote_for);

        Mocks::start_referendum_extrinsic(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        Mocks::vote(origin.clone(), account_id, commitment, stake, Ok(()));
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::check_voting_finished(options, winning_target_count);
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

/// Test that the revealing stage will finish after expected number of blocks.
#[test]
fn finish_revealing_period() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let reveal_stage_duration = <Runtime as Trait<Instance0>>::RevealStageDuration::get();
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let options = 3;
        let winning_target_count = 1;

        let option_to_vote_for = 0;
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, salt) = MockUtils::calculate_commitment(&account_id, &option_to_vote_for);

        Mocks::start_referendum_extrinsic(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        Mocks::vote(origin.clone(), account_id, commitment, stake, Ok(()));
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::check_voting_finished(options, winning_target_count);
        Mocks::reveal_vote(
            origin.clone(),
            account_id,
            salt,
            option_to_vote_for.clone(),
            Ok(()),
        );
        MockUtils::increase_block_number(reveal_stage_duration + 1);

        Mocks::check_revealing_finished(ReferendumResult::Winners(vec![(
            option_to_vote_for,
            1 * stake,
        )]));
    });
}

/// Test that voting power is properly accounted for the relevant options.
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
        let options = 3;
        let winning_target_count = 1;

        let option_to_vote_for1 = 0;
        let option_to_vote_for2 = 1;
        let stake_bigger = <Runtime as Trait<Instance0>>::MinimumStake::get() * 2;
        let stake_smaller = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment1, salt1) =
            MockUtils::calculate_commitment(&account_id1, &option_to_vote_for1);
        let (commitment2, salt2) =
            MockUtils::calculate_commitment(&account_id2, &option_to_vote_for2);

        Mocks::start_referendum_extrinsic(
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

        Mocks::check_voting_finished(options, winning_target_count);
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
        Mocks::check_revealing_finished(ReferendumResult::Winners(vec![(
            option_to_vote_for2,
            1 * stake_smaller * POWER_VOTE_STRENGTH,
        )]));
    });
}

/////////////////// Referendum Winners ////////////////////////////////////////////////////

/// Test that winners are properly selected when no vote is cast.
#[test]
fn winners_no_vote_revealed() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let reveal_stage_duration = <Runtime as Trait<Instance0>>::RevealStageDuration::get();
        let origin = OriginType::Signed(USER_ADMIN);
        let options = 1;
        let winning_target_count = 1;

        Mocks::start_referendum_extrinsic(origin.clone(), options, winning_target_count, Ok(()));
        MockUtils::increase_block_number(voting_stage_duration + 1);
        Mocks::check_voting_finished(options, winning_target_count);
        MockUtils::increase_block_number(reveal_stage_duration + 1);
        Mocks::check_revealing_finished(ReferendumResult::NoVotesRevealed);
    });
}

/// Test that winners are properly selected when there are multiple winners.
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
        let options = 3;
        let winning_target_count = 2;

        let option_to_vote_for1 = 0;
        let option_to_vote_for2 = 1;
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment1, salt1) =
            MockUtils::calculate_commitment(&account_id1, &option_to_vote_for1);
        let (commitment2, salt2) =
            MockUtils::calculate_commitment(&account_id2, &option_to_vote_for1);
        let (commitment3, salt3) =
            MockUtils::calculate_commitment(&account_id3, &option_to_vote_for2);

        Mocks::start_referendum_extrinsic(
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

        Mocks::check_voting_finished(options, winning_target_count);
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

        Mocks::check_revealing_finished(ReferendumResult::Winners(expected_winners));
    });
}

/// Test that winners are properly selected when there is a important tie. N-th option and (N+1)-th option has the same amount of votes but only N winners are expected.
#[test]
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
        let options = 3;
        let winning_target_count = 1;

        let option_to_vote_for1 = 0;
        let option_to_vote_for2 = 1;
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment1, salt1) =
            MockUtils::calculate_commitment(&account_id1, &option_to_vote_for1);
        let (commitment2, salt2) =
            MockUtils::calculate_commitment(&account_id2, &option_to_vote_for2);

        Mocks::start_referendum_extrinsic(
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

        Mocks::check_voting_finished(options, winning_target_count);
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

        Mocks::check_revealing_finished(ReferendumResult::ExtraWinners(expected_winners));
    });
}

// Test that winners are properly selected when there only votes for fewer options than expected winners.
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
        let options = 3;
        let winning_target_count = 2;

        let option_to_vote_for = 0;
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment1, salt1) =
            MockUtils::calculate_commitment(&account_id1, &option_to_vote_for);

        Mocks::start_referendum_extrinsic(
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

        Mocks::check_voting_finished(options, winning_target_count);
        Mocks::reveal_vote(
            origin_voter1.clone(),
            account_id1,
            salt1,
            option_to_vote_for,
            Ok(()),
        );
        MockUtils::increase_block_number(reveal_stage_duration + 1);

        let expected_winners = vec![(option_to_vote_for, 1 * stake)];

        Mocks::check_revealing_finished(ReferendumResult::NotEnoughWinners(expected_winners));
    });
}

/////////////////// Lifetime Releasing stake ///////////////////////////////////

/// Test that referendum stake can be released after the referendum ends.
#[test]
fn referendum_release_stake() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let reveal_stage_duration = <Runtime as Trait<Instance0>>::RevealStageDuration::get();
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let options = 3;
        let winning_target_count = 1;

        let option_to_vote_for = 0;
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, salt) = MockUtils::calculate_commitment(&account_id, &option_to_vote_for);

        Mocks::start_referendum_extrinsic(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );
        Mocks::vote(
            origin.clone(),
            account_id,
            commitment,
            stake.clone(),
            Ok(()),
        );
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::check_voting_finished(options, winning_target_count);
        Mocks::reveal_vote(
            origin.clone(),
            account_id,
            salt,
            option_to_vote_for.clone(),
            Ok(()),
        );
        MockUtils::increase_block_number(reveal_stage_duration + 1);

        Mocks::check_revealing_finished(ReferendumResult::Winners(vec![(
            option_to_vote_for,
            1 * stake,
        )]));

        Mocks::release_stake(origin.clone(), account_id, Err(Error::InvalidTimeToRelease));

        // since `account_id` voted for the winner, he can unlock stake only after inactive stage ends
        Mocks::start_referendum_extrinsic(
            origin.clone(),
            options.clone(),
            winning_target_count,
            Ok(()),
        );

        Mocks::release_stake(origin.clone(), account_id, Ok(()));
    });
}

/////////////////// ReferendumManager //////////////////////////////////////////

/// Test that other runtime modules can start the referendum.
#[test]
fn referendum_manager_referendum_start() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let options = 1;
        let winning_target_count = 1;

        Mocks::start_referendum_manager(options, winning_target_count, Ok(()));
    });
}
