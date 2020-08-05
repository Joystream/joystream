#![cfg(test)]

use super::{Error, Trait, ReferendumResult};
use crate::mock::*;

type Mocks = InstanceMocks<Runtime, Instance0>;
type MockUtils = InstanceMockUtils<Runtime, Instance0>;

/////////////////// Lifetime - referendum start ////////////////////////////////
#[test]
fn referendum_start() {
    MockUtils::origin_access(USER_ADMIN, |origin| {
        let options = vec![0];

        Mocks::start_referendum(origin, options, Ok(()));
    });
}

#[test]
fn referendum_start_access_restricted() {
    MockUtils::origin_access(USER_REGULAR, |origin| {
        let options = vec![0];

        Mocks::start_referendum(origin, options, Err(Error::OriginNotSuperUser));
    });
}

#[test]
fn referendum_start_forbidden_after_start() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_ADMIN);
        let options = vec![0];

        Mocks::start_referendum(origin.clone(), options.clone(), Ok(()));
        Mocks::start_referendum(
            origin.clone(),
            options.clone(),
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

        Mocks::start_referendum(origin.clone(), options, Err(Error::NoReferendumOptions));
    });
}

#[test]
fn referendum_start_too_many_options() {
    let origin = OriginType::Signed(USER_ADMIN);

    let too_many_options: Vec<u64> =
        (0..(<Runtime as Trait<Instance0>>::MaxReferendumOptions::get() + 1)).collect();
    let ok_options = too_many_options.as_slice()[..too_many_options.len() - 1].to_vec();

    let config = default_genesis_config();
    build_test_externalities(config).execute_with(|| {
        Mocks::start_referendum(origin.clone(), ok_options, Ok(()));
    });

    let config = default_genesis_config();
    build_test_externalities(config).execute_with(|| {
        Mocks::start_referendum(
            origin.clone(),
            too_many_options,
            Err(Error::TooManyReferendumOptions),
        );
    });
}

#[test]
fn referendum_start_not_unique_options() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_ADMIN);
        let options = vec![0, 1, 2, 2, 3];

        Mocks::start_referendum(
            origin.clone(),
            options,
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

        let options = vec![0];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, _) = MockUtils::vote_commitment(account_id, options[0]);

        Mocks::start_referendum(origin.clone(), options, Ok(()));

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

        Mocks::vote(origin.clone(), account_id, commitment, stake, Err(Error::ReferendumNotRunning));
    });
}

#[test]
fn voting_voting_stage_overdue() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);

        let options = vec![0];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, _) = MockUtils::vote_commitment(account_id, options[0]);

        Mocks::start_referendum(origin.clone(), options, Ok(()));

        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::vote(origin.clone(), account_id, commitment, stake, Err(Error::ReferendumNotRunning));
    });
}

#[test]
fn voting_stake_too_low() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);

        let options = vec![0];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get() - 1;
        let (commitment, _) = MockUtils::vote_commitment(account_id, options[0]);

        Mocks::start_referendum(origin.clone(), options, Ok(()));
        Mocks::vote(origin.clone(), account_id, commitment, stake, Err(Error::InsufficientStake));
    });
}

#[test]
fn voting_cant_lock_stake() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);

        let options = vec![0];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, _) = MockUtils::vote_commitment(account_id, options[0]);

        Mocks::start_referendum(origin.clone(), options, Ok(()));

        Runtime::feature_stack_lock(false, true, true);
        Mocks::vote(origin.clone(), account_id, commitment, stake, Err(Error::InsufficientBalanceToStakeCurrency));

        Runtime::feature_stack_lock(true, false, true);
        Mocks::vote(origin.clone(), account_id, commitment, stake, Err(Error::AccountStakeCurrencyFailed));
    });
}

#[test]
fn voting_user_already_voted() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);

        let options = vec![0];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, _) = MockUtils::vote_commitment(account_id, options[0]);

        Mocks::start_referendum(origin.clone(), options, Ok(()));
        Mocks::vote(origin.clone(), account_id, commitment, stake, Ok(()));

        Mocks::vote(origin.clone(), account_id, commitment, stake, Err(Error::AlreadyVoted));
    });
}

/////////////////// Lifetime - voting finish ///////////////////////////////////

#[test]
fn finish_voting() {
    MockUtils::origin_access(USER_ADMIN, |origin| {
        let options = vec![0];

        Mocks::start_referendum(origin.clone(), options, Ok(()));

        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();

        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::finish_voting(origin.clone(), Ok(()));
    });
}

#[test]
fn finish_voting_access_restricted() {
    MockUtils::origin_access(USER_REGULAR, |origin| {
        let options = vec![0];

        let superuser_origin = OriginType::Signed(USER_ADMIN);

        Mocks::start_referendum(superuser_origin, options, Ok(()));
        Mocks::finish_voting(origin, Err(Error::OriginNotSuperUser));
    });
}

#[test]
fn finish_voting_referendum_not_running() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_ADMIN);

        Mocks::finish_voting(origin, Err(Error::ReferendumNotRunning));
    });
}

#[test]
fn finish_voting_voting_not_finished() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let origin = OriginType::Signed(USER_ADMIN);
        let options = vec![0];

        Mocks::start_referendum(origin.clone(), options, Ok(()));

        for _ in 0..voting_stage_duration {
            MockUtils::increase_block_number(1);

            Mocks::finish_voting(origin.clone(), Err(Error::VotingNotFinishedYet));
        }

        MockUtils::increase_block_number(1);

        Mocks::finish_voting(origin.clone(), Ok(()));
    });
}

/////////////////// Lifetime - revealing ///////////////////////////////////////

#[test]
fn reveal() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let reveal_stage_duration = <Runtime as Trait<Instance0>>::RevealStageDuration::get();
        let account_id = USER_ADMIN;
        let origin = OriginType::Signed(account_id);
        let options = vec![0, 1, 2];

        let option_to_vote_for = options[1];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, salt) = MockUtils::vote_commitment(account_id, option_to_vote_for);

        Mocks::start_referendum(origin.clone(), options.clone(), Ok(()));
        Mocks::vote(origin.clone(), account_id, commitment, stake, Ok(()));
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::finish_voting(origin.clone(), Ok(()));
        Mocks::reveal_vote(origin.clone(), account_id, salt, option_to_vote_for, Ok(()));
        MockUtils::increase_block_number(reveal_stage_duration + 1);

        Mocks::finish_revealing_period(origin.clone(), Ok(()), Some(ReferendumResult::NoVotesRevealed));
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

        let option_to_vote_for = options[1];
        let stake = <Runtime as Trait<Instance0>>::MinimumStake::get();
        let (commitment, salt) = MockUtils::vote_commitment(account_id, option_to_vote_for);

        Mocks::start_referendum(origin.clone(), options.clone(), Ok(()));
        Mocks::vote(origin.clone(), account_id, commitment, stake, Ok(()));
        MockUtils::increase_block_number(voting_stage_duration + 1);

        Mocks::finish_voting(origin.clone(), Ok(()));
        Mocks::reveal_vote(origin.clone(), account_id, salt, option_to_vote_for, Ok(()));
        MockUtils::increase_block_number(reveal_stage_duration + 1);

        Mocks::finish_revealing_period(origin.clone(), Ok(()), Some(ReferendumResult::NoVotesRevealed));
    });
}

#[test]
fn reveal_no_vote_revealed() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let voting_stage_duration = <Runtime as Trait<Instance0>>::VoteStageDuration::get();
        let reveal_stage_duration = <Runtime as Trait<Instance0>>::RevealStageDuration::get();
        let origin = OriginType::Signed(USER_ADMIN);
        let options = vec![0];

        Mocks::start_referendum(origin.clone(), options, Ok(()));
        MockUtils::increase_block_number(voting_stage_duration + 1);
        Mocks::finish_voting(origin.clone(), Ok(()));
        MockUtils::increase_block_number(reveal_stage_duration + 1);
        Mocks::finish_revealing_period(origin.clone(), Ok(()), Some(ReferendumResult::NoVotesRevealed));
    });
}




/////////////////// Lifetime - revealing finish ////////////////////////////////

#[test]
#[ignore]
fn finish_revealing_period() {}

/////////////////// Lifetime - complete ////////////////////////////////////////

#[test]
#[ignore]
fn referendum_whole_process() {}
