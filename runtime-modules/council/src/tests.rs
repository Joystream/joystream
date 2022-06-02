#![cfg(test)]

use super::{
    AnnouncementPeriodNr, Budget, BudgetIncrement, CouncilMemberOf, CouncilMembers,
    CouncilStageAnnouncing, Error, Module, Trait,
};
use crate::mock::*;
use common::council::CouncilBudgetManager;
use common::council::CouncilOriginValidator;
use frame_support::traits::Currency;
use frame_support::{assert_err, assert_ok, StorageValue};
use frame_system::RawOrigin;
use staking_handler::StakingHandler;

type Mocks = InstanceMocks<Runtime>;
type MockUtils = InstanceMockUtils<Runtime>;

type CandidacyLock = <Runtime as Trait>::CandidacyLock;
type CouncilorLock = <Runtime as Trait>::CouncilorLock;

/////////////////// Election-related ///////////////////////////////////////////
// Test one referendum cycle with succesfull council election
#[test]
fn council_lifecycle() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        Mocks::run_full_council_cycle(0, &[], 0);
    });
}

// Test that candidacy can be announced only in announce period.
#[test]
fn council_candidacy_invalid_time() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();

        // generate candidates
        let candidates: Vec<CandidateInfo<Runtime>> = (0
            ..(council_settings.min_candidate_count + 1) as u64)
            .map(|i| {
                MockUtils::generate_candidate(u64::from(i), council_settings.min_candidate_stake)
            })
            .collect();
        let late_candidate = MockUtils::generate_candidate(
            u64::from(candidates.len() as u64),
            council_settings.min_candidate_stake,
        );

        let expected_candidates = candidates
            .iter()
            .map(|item| item.candidate.clone())
            .collect();

        let params = CouncilCycleParams {
            council_settings: CouncilSettings::<Runtime>::extract_settings(),
            cycle_start_block_number: 0,
            expected_initial_council_members: vec![],
            expected_final_council_members: vec![], // not needed in this scenario
            candidates_announcing: candidates.clone(),
            expected_candidates,
            voters: vec![],

            // escape before voting
            interrupt_point: Some(CouncilCycleInterrupt::BeforeVoting),
        };

        InstanceMocks::simulate_council_cycle(params);

        Mocks::announce_candidacy(
            late_candidate.origin.clone(),
            late_candidate.account_id.clone(),
            late_candidate.candidate.stake.clone(),
            Err(Error::CantCandidateNow),
        );
    });
}

// Test that minimum candidacy stake is enforced.
#[test]
fn council_candidacy_stake_too_low() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();

        let insufficient_stake = council_settings.min_candidate_stake - 1;
        let candidate = MockUtils::generate_candidate(0, insufficient_stake);

        Mocks::announce_candidacy(
            candidate.origin.clone(),
            candidate.account_id.clone(),
            candidate.candidate.stake.clone(),
            Err(Error::CandidacyStakeTooLow),
        );
    });
}

// Test that candidate can vote for himself.
#[test]
fn council_can_vote_for_yourself() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();
        let vote_stake = <Runtime as referendum::Trait<ReferendumInstance>>::MinimumStake::get();

        // generate candidates
        let candidates: Vec<CandidateInfo<Runtime>> = (0
            ..(council_settings.min_candidate_count + 1) as u64)
            .map(|i| {
                MockUtils::generate_candidate(u64::from(i), council_settings.min_candidate_stake)
            })
            .collect();

        let expected_candidates = candidates
            .iter()
            .map(|item| item.candidate.clone())
            .collect();

        let params = CouncilCycleParams {
            council_settings: council_settings.clone(),
            cycle_start_block_number: 0,
            expected_initial_council_members: vec![],
            expected_final_council_members: vec![], // not needed in this scenario
            candidates_announcing: candidates.clone(),
            expected_candidates,
            voters: vec![],

            // escape before voting
            interrupt_point: Some(CouncilCycleInterrupt::BeforeVoting),
        };

        InstanceMocks::simulate_council_cycle(params.clone());

        let self_voting_candidate_index = candidates[0].account_id;
        let voter = MockUtils::generate_voter(
            VOTER_CANDIDATE_OFFSET,
            vote_stake,
            self_voting_candidate_index,
            AnnouncementPeriodNr::get(),
        );
        Mocks::vote_for_candidate(
            voter.origin.clone(),
            voter.commitment.clone(),
            voter.stake.clone(),
            Ok(()),
        );

        // forward to election-revealing period
        MockUtils::increase_block_number(council_settings.voting_stage_duration + 1);

        Mocks::reveal_vote(
            voter.origin.clone(),
            voter.salt.clone(),
            voter.vote_for,
            Ok(()),
        );
    });
}

// Test that vote for a succesfull candidate has it's stake locked until the one referendum cycle
// with succesfull council election
#[test]
fn council_vote_for_winner_stakes_longer() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();

        // run first election round
        let params = Mocks::run_full_council_cycle(0, &[], 0);
        let second_round_user_offset = 100; // some number higher than the number of voters

        let voter_for_winner = params.voters[0].clone();
        let voter_for_looser = params.voters[params.voters.len() - 1].clone();

        // try to release vote stake
        Mocks::release_vote_stake(voter_for_winner.origin.clone(), Err(()));
        Mocks::release_vote_stake(voter_for_looser.origin.clone(), Ok(()));

        // try to release vote stake
        Mocks::release_vote_stake(voter_for_winner.origin.clone(), Err(()));

        // run second election round
        Mocks::run_full_council_cycle(
            council_settings.cycle_duration,
            &params.expected_final_council_members,
            second_round_user_offset,
        );

        // try to release vote stake
        Mocks::release_vote_stake(voter_for_winner.origin.clone(), Ok(()));
    });
}

// Test that candidate can withdraw valid candidacy.
#[test]
fn council_candidacy_withdraw_candidacy() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();

        let stake = council_settings.min_candidate_stake;
        let candidate = MockUtils::generate_candidate(0, stake);

        Mocks::announce_candidacy(
            candidate.origin.clone(),
            candidate.account_id.clone(),
            candidate.candidate.stake.clone(),
            Ok(()),
        );

        Mocks::withdraw_candidacy(
            candidate.origin.clone(),
            candidate.account_id.clone(),
            Ok(()),
        );
    });
}

// Test that candidate can withdraw valid candidacy.
#[test]
fn council_candidacy_release_candidate_stake() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let not_elected_candidate_index = 2;

        let params = Mocks::run_full_council_cycle(0, &[], 0);

        Mocks::release_candidacy_stake(
            params.candidates_announcing[not_elected_candidate_index]
                .origin
                .clone(),
            params.candidates_announcing[not_elected_candidate_index]
                .account_id
                .clone(),
            Ok(()),
        );
    });
}

// Test that the announcement period is reset in case that not enough candidates
// to fill the council has announced their candidacy.
#[test]
fn council_announcement_reset_on_insufficient_candidates() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();

        // generate candidates
        let candidates: Vec<CandidateInfo<Runtime>> = (0
            ..(council_settings.min_candidate_count - 2) as u64)
            .map(|i| {
                MockUtils::generate_candidate(u64::from(i), council_settings.min_candidate_stake)
            })
            .collect();

        let params = CouncilCycleParams {
            council_settings: council_settings.clone(),
            cycle_start_block_number: 0,
            expected_initial_council_members: vec![],
            expected_final_council_members: vec![], // not needed in this scenario
            candidates_announcing: candidates.clone(),
            expected_candidates: vec![], // not needed in this scenario
            voters: vec![],              // not needed in this scenario

            // escape before voting
            interrupt_point: Some(CouncilCycleInterrupt::AfterCandidatesAnnounce),
        };

        Mocks::simulate_council_cycle(params.clone());

        // forward to election-voting period
        MockUtils::increase_block_number(council_settings.announcing_stage_duration + 1);

        // check announcements were reset
        Mocks::check_announcing_period(
            params.cycle_start_block_number + council_settings.announcing_stage_duration,
            CouncilStageAnnouncing {
                candidates_count: 0,
            },
        );
    });
}

// Test that the announcement period is reset in case that not enough candidates
// to fill the council has announced and not withdrawn their candidacy.
#[test]
fn council_announcement_reset_on_insufficient_candidates_after_candidacy_withdrawal() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();

        // generate candidates
        let candidates: Vec<CandidateInfo<Runtime>> = (0..council_settings.min_candidate_count)
            .map(|i| {
                MockUtils::generate_candidate(u64::from(i), council_settings.min_candidate_stake)
            })
            .collect();

        let params = CouncilCycleParams {
            council_settings: council_settings.clone(),
            cycle_start_block_number: 0,
            expected_initial_council_members: vec![],
            expected_final_council_members: vec![], // not needed in this scenario
            candidates_announcing: candidates.clone(),
            expected_candidates: vec![], // not needed in this scenario
            voters: vec![],              // not needed in this scenario

            // escape before voting
            interrupt_point: Some(CouncilCycleInterrupt::AfterCandidatesAnnounce),
        };

        Mocks::simulate_council_cycle(params.clone());

        Mocks::withdraw_candidacy(
            candidates[0].origin.clone(),
            candidates[0].account_id.clone(),
            Ok(()),
        );

        // forward to election-voting period
        MockUtils::increase_block_number(council_settings.announcing_stage_duration + 1);

        // check announcements were reset
        Mocks::check_announcing_period(
            params.cycle_start_block_number + council_settings.announcing_stage_duration,
            CouncilStageAnnouncing {
                candidates_count: 0,
            },
        );
    });
}

// Test that announcement phase is reset when not enough candidates to fill council recieved votes
#[test]
fn council_announcement_reset_on_not_enough_winners() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();
        let vote_stake = <Runtime as referendum::Trait<ReferendumInstance>>::MinimumStake::get();

        // generate candidates
        let candidates: Vec<CandidateInfo<Runtime>> = (0..council_settings.min_candidate_count
            as u64)
            .map(|i| {
                MockUtils::generate_candidate(u64::from(i), council_settings.min_candidate_stake)
            })
            .collect();

        // prepare candidates that are expected to get into candidacy list
        let expected_candidates = candidates
            .iter()
            .map(|item| item.candidate.clone())
            .collect();

        // generate voters that vote only for one particular candidate
        let votes_map: Vec<u64> = vec![3, 3, 3];
        let voters = (0..votes_map.len())
            .map(|index| {
                MockUtils::generate_voter(
                    index as u64,
                    vote_stake,
                    CANDIDATE_BASE_ID + votes_map[index],
                    AnnouncementPeriodNr::get(),
                )
            })
            .collect();

        let params = CouncilCycleParams {
            council_settings: council_settings.clone(),
            cycle_start_block_number: 0,
            expected_initial_council_members: vec![],
            expected_final_council_members: vec![], // not needed in this scenario
            candidates_announcing: candidates.clone(),
            expected_candidates,
            voters,

            // escape before voting
            interrupt_point: Some(CouncilCycleInterrupt::AfterRevealing),
        };

        Mocks::simulate_council_cycle(params.clone());

        // forward to finish election / start idle period
        MockUtils::increase_block_number(council_settings.reveal_stage_duration);

        // check announcements were reset
        Mocks::check_announcing_period(
            params.cycle_start_block_number
                + council_settings.announcing_stage_duration
                + council_settings.voting_stage_duration
                + council_settings.reveal_stage_duration,
            CouncilStageAnnouncing {
                candidates_count: 0,
            },
        );
    });
}

// Test that two consecutive election rounds can be run and expected council members are elected.
#[test]
fn council_two_consecutive_rounds() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();
        let vote_stake = <Runtime as referendum::Trait<ReferendumInstance>>::MinimumStake::get();

        // generate candidates
        let candidates: Vec<CandidateInfo<Runtime>> = (0
            ..(council_settings.min_candidate_count + 1) as u64)
            .map(|i| {
                MockUtils::generate_candidate(u64::from(i), council_settings.min_candidate_stake)
            })
            .collect();

        // prepare candidates that are expected to get into candidacy list
        let expected_candidates = candidates
            .iter()
            .map(|item| item.candidate.clone())
            .collect();

        let expected_final_council_members: Vec<CouncilMemberOf<Runtime>> = vec![
            (
                candidates[3].candidate.clone(),
                candidates[3].membership_id,
                council_settings.election_duration,
                0,
            )
                .into(),
            (
                candidates[0].candidate.clone(),
                candidates[0].membership_id,
                council_settings.election_duration,
                0,
            )
                .into(),
            (
                candidates[1].candidate.clone(),
                candidates[1].membership_id,
                council_settings.election_duration,
                0,
            )
                .into(),
        ];

        // generate voter for each 6 voters and give: 4 votes for option D, 3 votes for option A,
        // and 2 vote for option B, and 1 for option C
        let votes_map: Vec<u64> = vec![3, 3, 3, 3, 0, 0, 0, 1, 1, 2];
        let voters = (0..votes_map.len())
            .map(|index| {
                MockUtils::generate_voter(
                    index as u64,
                    vote_stake,
                    CANDIDATE_BASE_ID + votes_map[index],
                    AnnouncementPeriodNr::get(),
                )
            })
            .collect();

        let params = CouncilCycleParams {
            council_settings: CouncilSettings::<Runtime>::extract_settings(),
            cycle_start_block_number: 0,
            expected_initial_council_members: vec![],
            expected_final_council_members: expected_final_council_members.clone(),
            candidates_announcing: candidates.clone(),
            expected_candidates,
            voters,

            interrupt_point: None,
        };

        Mocks::simulate_council_cycle(params.clone());

        let votes_map2: Vec<u64> = vec![3, 3, 3, 3, 1, 1, 2];
        let voters2 = (0..votes_map2.len())
            .map(|index| {
                MockUtils::generate_voter(
                    index as u64,
                    vote_stake,
                    CANDIDATE_BASE_ID + votes_map2[index],
                    AnnouncementPeriodNr::get(),
                )
            })
            .collect();

        let expected_final_council_members2: Vec<CouncilMemberOf<Runtime>> = vec![
            (
                candidates[3].candidate.clone(),
                candidates[3].membership_id,
                council_settings.cycle_duration + council_settings.election_duration,
                0,
            )
                .into(),
            (
                candidates[1].candidate.clone(),
                candidates[1].membership_id,
                council_settings.cycle_duration + council_settings.election_duration,
                0,
            )
                .into(),
            (
                candidates[2].candidate.clone(),
                candidates[2].membership_id,
                council_settings.cycle_duration + council_settings.election_duration,
                0,
            )
                .into(),
        ];

        let params2 = CouncilCycleParams {
            expected_initial_council_members: expected_final_council_members,
            cycle_start_block_number: council_settings.announcing_stage_duration
                + council_settings.voting_stage_duration
                + council_settings.reveal_stage_duration
                + council_settings.idle_stage_duration,
            voters: voters2,
            expected_final_council_members: expected_final_council_members2,
            ..params.clone()
        };

        Mocks::simulate_council_cycle(params2);
    });
}

// Test that repeated candidacy announcement is forbidden.
#[test]
fn council_cant_candidate_repeatedly() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();

        // generate candidates
        let candidate = MockUtils::generate_candidate(0, council_settings.min_candidate_stake);

        Mocks::announce_candidacy(
            candidate.origin.clone(),
            candidate.membership_id,
            council_settings.min_candidate_stake,
            Ok(()),
        );
        Mocks::announce_candidacy(
            candidate.origin.clone(),
            candidate.membership_id,
            council_settings.min_candidate_stake,
            Err(Error::CantCandidateTwice),
        );
    });
}

// Test that candidate's stake is truly locked.
#[test]
fn council_candidate_stake_is_locked() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();

        // generate candidates
        let candidates: Vec<CandidateInfo<Runtime>> = (0..1)
            .map(|i| MockUtils::generate_candidate(i, council_settings.min_candidate_stake))
            .collect();

        let params = CouncilCycleParams {
            council_settings: council_settings.clone(),
            cycle_start_block_number: 0,
            expected_initial_council_members: vec![],
            expected_final_council_members: vec![], // not needed in this scenario
            candidates_announcing: candidates.clone(),
            expected_candidates: vec![], // not needed in this scenario
            voters: vec![],              // not needed in this scenario

            // escape before voting
            interrupt_point: Some(CouncilCycleInterrupt::AfterCandidatesAnnounce),
        };

        Mocks::simulate_council_cycle(params.clone());

        candidates.iter().for_each(|council_member| {
            assert_eq!(
                CandidacyLock::current_stake(&council_member.account_id),
                council_settings.min_candidate_stake,
            );
        });
    });
}

// Test that candidate can unstake after not being elected.
#[test]
fn council_candidate_stake_can_be_unlocked() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();
        let vote_stake = <Runtime as referendum::Trait<ReferendumInstance>>::MinimumStake::get();

        let not_elected_candidate_index = 2;

        // generate candidates
        let candidates: Vec<CandidateInfo<Runtime>> = (0
            ..(council_settings.min_candidate_count + 1) as u64)
            .map(|i| {
                MockUtils::generate_candidate(u64::from(i), council_settings.min_candidate_stake)
            })
            .collect();

        // prepare candidates that are expected to get into candidacy list
        let expected_candidates = candidates
            .iter()
            .map(|item| item.candidate.clone())
            .collect();

        let expected_final_council_members: Vec<CouncilMemberOf<Runtime>> = vec![
            (
                candidates[3].candidate.clone(),
                candidates[3].membership_id,
                council_settings.election_duration,
                0,
            )
                .into(),
            (
                candidates[0].candidate.clone(),
                candidates[0].membership_id,
                council_settings.election_duration,
                0,
            )
                .into(),
            (
                candidates[1].candidate.clone(),
                candidates[1].membership_id,
                council_settings.election_duration,
                0,
            )
                .into(),
        ];

        // generate voter for each 6 voters and give: 4 votes for option D, 3 votes for option A,
        // and 2 vote for option B, and 1 for option C
        let votes_map: Vec<u64> = vec![3, 3, 3, 3, 0, 0, 0, 1, 1, 2];
        let voters = (0..votes_map.len())
            .map(|index| {
                MockUtils::generate_voter(
                    index as u64,
                    vote_stake,
                    CANDIDATE_BASE_ID + votes_map[index],
                    AnnouncementPeriodNr::get(),
                )
            })
            .collect();

        let params = CouncilCycleParams {
            council_settings: CouncilSettings::<Runtime>::extract_settings(),
            cycle_start_block_number: 0,
            expected_initial_council_members: vec![],
            expected_final_council_members,
            candidates_announcing: candidates.clone(),
            expected_candidates,
            voters,

            interrupt_point: None,
        };

        Mocks::simulate_council_cycle(params);

        // check that not-elected-member has still his candidacy stake locked
        assert_eq!(
            CandidacyLock::current_stake(
                &candidates[not_elected_candidate_index]
                    .candidate
                    .staking_account_id
            ),
            council_settings.min_candidate_stake,
        );

        assert_eq!(
            Module::<Runtime>::release_candidacy_stake(
                MockUtils::mock_origin(candidates[not_elected_candidate_index].origin.clone()),
                candidates[not_elected_candidate_index]
                    .candidate
                    .staking_account_id
            ),
            Ok(()),
        );

        // check that candidacy stake is unlocked
        assert_eq!(
            CandidacyLock::current_stake(
                &candidates[not_elected_candidate_index]
                    .candidate
                    .staking_account_id
            ),
            0,
        );
    });
}

// Test that elected candidate's stake lock is automaticly converted from candidate lock to
// elected member lock.
#[test]
fn council_candidate_stake_automaticly_converted() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();
        let vote_stake = <Runtime as referendum::Trait<ReferendumInstance>>::MinimumStake::get();

        // generate candidates
        let candidates: Vec<CandidateInfo<Runtime>> = (0
            ..(council_settings.min_candidate_count + 1) as u64)
            .map(|i| {
                MockUtils::generate_candidate(u64::from(i), council_settings.min_candidate_stake)
            })
            .collect();

        // prepare candidates that are expected to get into candidacy list
        let expected_candidates = candidates
            .iter()
            .map(|item| item.candidate.clone())
            .collect();

        let expected_final_council_members: Vec<CouncilMemberOf<Runtime>> = vec![
            (
                candidates[3].candidate.clone(),
                candidates[3].membership_id,
                council_settings.election_duration,
                0,
            )
                .into(),
            (
                candidates[0].candidate.clone(),
                candidates[0].membership_id,
                council_settings.election_duration,
                0,
            )
                .into(),
            (
                candidates[1].candidate.clone(),
                candidates[1].membership_id,
                council_settings.election_duration,
                0,
            )
                .into(),
        ];

        // generate voter for each 6 voters and give: 4 votes for option D, 3 votes for option A,
        // and 2 vote for option B, and 1 for option C
        let votes_map: Vec<u64> = vec![3, 3, 3, 3, 0, 0, 0, 1, 1, 2];
        let voters = (0..votes_map.len())
            .map(|index| {
                MockUtils::generate_voter(
                    index as u64,
                    vote_stake,
                    CANDIDATE_BASE_ID + votes_map[index],
                    AnnouncementPeriodNr::get(),
                )
            })
            .collect();

        let params = CouncilCycleParams {
            council_settings: CouncilSettings::<Runtime>::extract_settings(),
            cycle_start_block_number: 0,
            expected_initial_council_members: vec![],
            expected_final_council_members: expected_final_council_members.clone(),
            candidates_announcing: candidates.clone(),
            expected_candidates,
            voters,

            interrupt_point: None,
        };

        Mocks::simulate_council_cycle(params);

        expected_final_council_members
            .iter()
            .for_each(|council_member| {
                assert_eq!(
                    CandidacyLock::current_stake(&council_member.staking_account_id),
                    0
                );

                assert_eq!(
                    CouncilorLock::current_stake(&council_member.staking_account_id),
                    council_settings.min_candidate_stake
                );
            });
    });
}

// Test that council member stake is locked during council governance.
#[test]
fn council_member_stake_is_locked() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();
        let vote_stake = <Runtime as referendum::Trait<ReferendumInstance>>::MinimumStake::get();

        // generate candidates
        let candidates: Vec<CandidateInfo<Runtime>> = (0
            ..(council_settings.min_candidate_count + 1) as u64)
            .map(|i| {
                MockUtils::generate_candidate(u64::from(i), council_settings.min_candidate_stake)
            })
            .collect();

        // prepare candidates that are expected to get into candidacy list
        let expected_candidates = candidates
            .iter()
            .map(|item| item.candidate.clone())
            .collect();

        let expected_final_council_members: Vec<CouncilMemberOf<Runtime>> = vec![
            (
                candidates[3].candidate.clone(),
                candidates[3].membership_id,
                council_settings.election_duration,
                0,
            )
                .into(),
            (
                candidates[0].candidate.clone(),
                candidates[0].membership_id,
                council_settings.election_duration,
                0,
            )
                .into(),
            (
                candidates[1].candidate.clone(),
                candidates[1].membership_id,
                council_settings.election_duration,
                0,
            )
                .into(),
        ];

        // generate voter for each 6 voters and give: 4 votes for option D, 3 votes for option A,
        // and 2 vote for option B, and 1 for option C
        let votes_map: Vec<u64> = vec![3, 3, 3, 3, 0, 0, 0, 1, 1, 2];
        let voters = (0..votes_map.len())
            .map(|index| {
                MockUtils::generate_voter(
                    index as u64,
                    vote_stake,
                    CANDIDATE_BASE_ID + votes_map[index],
                    AnnouncementPeriodNr::get(),
                )
            })
            .collect();

        let params = CouncilCycleParams {
            council_settings: CouncilSettings::<Runtime>::extract_settings(),
            cycle_start_block_number: 0,
            expected_initial_council_members: vec![],
            expected_final_council_members: expected_final_council_members.clone(),
            candidates_announcing: candidates.clone(),
            expected_candidates,
            voters,

            interrupt_point: None,
        };

        Mocks::simulate_council_cycle(params);

        expected_final_council_members
            .iter()
            .for_each(|council_member| {
                assert_eq!(
                    CouncilorLock::current_stake(&council_member.staking_account_id),
                    council_settings.min_candidate_stake
                );
            });
    });
}

// Test that council member's stake is automaticly released after next council is elected.
#[test]
fn council_member_stake_automaticly_unlocked() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();
        let vote_stake = <Runtime as referendum::Trait<ReferendumInstance>>::MinimumStake::get();
        let not_reelected_candidate_index = 0;

        let params = Mocks::run_full_council_cycle(0, &[], 0);

        let candidates = params.candidates_announcing.clone();

        // 'not reelected member' should have it's stake locked now (he is currently elected member)
        assert_eq!(
            CouncilorLock::current_stake(&candidates[not_reelected_candidate_index].account_id),
            council_settings.min_candidate_stake,
        );

        let votes_map2: Vec<u64> = vec![3, 3, 3, 3, 1, 1, 2];
        let voters2 = (0..votes_map2.len())
            .map(|index| {
                MockUtils::generate_voter(
                    index as u64,
                    vote_stake,
                    CANDIDATE_BASE_ID + votes_map2[index],
                    AnnouncementPeriodNr::get(),
                )
            })
            .collect();

        let expected_final_council_members2: Vec<CouncilMemberOf<Runtime>> = vec![
            (
                candidates[3].candidate.clone(),
                candidates[3].membership_id,
                council_settings.cycle_duration + council_settings.election_duration,
                0,
            )
                .into(),
            (
                candidates[1].candidate.clone(),
                candidates[1].membership_id,
                council_settings.cycle_duration + council_settings.election_duration,
                0,
            )
                .into(),
            (
                candidates[2].candidate.clone(),
                candidates[2].membership_id,
                council_settings.cycle_duration + council_settings.election_duration,
                0,
            )
                .into(),
        ];

        let params2 = CouncilCycleParams {
            expected_initial_council_members: params.expected_final_council_members.clone(),
            cycle_start_block_number: council_settings.announcing_stage_duration
                + council_settings.voting_stage_duration
                + council_settings.reveal_stage_duration
                + council_settings.idle_stage_duration,
            voters: voters2,
            expected_final_council_members: expected_final_council_members2.clone(),
            ..params.clone()
        };

        Mocks::simulate_council_cycle(params2);

        // not reelected member should have it's stake unlocked
        assert_eq!(
            CouncilorLock::current_stake(&candidates[not_reelected_candidate_index].account_id),
            0
        );
    });
}

// Test that user can set and change candidacy note.
#[test]
fn council_candidacy_set_note() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();
        let vote_stake = <Runtime as referendum::Trait<ReferendumInstance>>::MinimumStake::get();

        // generate candidates
        let candidates: Vec<CandidateInfo<Runtime>> = (0
            ..(council_settings.min_candidate_count + 1) as u64)
            .map(|i| {
                MockUtils::generate_candidate(u64::from(i), council_settings.min_candidate_stake)
            })
            .collect();

        // prepare candidates that are expected to get into candidacy list
        let expected_candidates = candidates
            .iter()
            .map(|item| item.candidate.clone())
            .collect();

        // generate voter for each 6 voters and give: 4 votes for option D, 3 votes for option A,
        // and 2 vote for option B, and 1 for option C
        let votes_map: Vec<u64> = vec![3, 3, 3, 3, 0, 0, 0, 1, 1, 2];
        let voters = (0..votes_map.len())
            .map(|index| {
                MockUtils::generate_voter(
                    index as u64,
                    vote_stake,
                    CANDIDATE_BASE_ID + votes_map[index],
                    AnnouncementPeriodNr::get(),
                )
            })
            .collect();

        let params = CouncilCycleParams {
            council_settings: CouncilSettings::<Runtime>::extract_settings(),
            cycle_start_block_number: 0,
            expected_initial_council_members: vec![],
            expected_final_council_members: vec![],
            candidates_announcing: candidates.clone(),
            expected_candidates,
            voters,

            interrupt_point: Some(CouncilCycleInterrupt::AfterCandidatesAnnounce),
        };

        Mocks::simulate_council_cycle(params.clone());

        // prepare values for note testing
        let membership_id = candidates[0].clone().membership_id;
        let origin = candidates[0].origin.clone();
        let note1 = "MyNote1".as_bytes();
        let note2 = "MyNote2".as_bytes();
        let note3 = "MyNote3".as_bytes();
        let note4 = "MyNote4".as_bytes();

        // check note is not set yet
        Mocks::check_candidacy_note(&membership_id, None);

        // set note - announcement stage
        Mocks::set_candidacy_note(origin.clone(), membership_id.clone(), note1, Ok(()));

        // change note - announcement stage
        Mocks::set_candidacy_note(origin.clone(), membership_id.clone(), note2, Ok(()));

        // forward to election-voting period
        MockUtils::increase_block_number(council_settings.announcing_stage_duration + 1);

        // change note - election stage
        Mocks::set_candidacy_note(origin.clone(), membership_id.clone(), note3, Ok(()));

        // vote with all voters
        params.voters.iter().for_each(|voter| {
            Mocks::vote_for_candidate(
                voter.origin.clone(),
                voter.commitment.clone(),
                voter.stake.clone(),
                Ok(()),
            )
        });

        // forward to election-revealing period
        MockUtils::increase_block_number(council_settings.voting_stage_duration + 1);

        // reveal vote for all voters
        params.voters.iter().for_each(|voter| {
            Mocks::reveal_vote(
                voter.origin.clone(),
                voter.salt.clone(),
                voter.vote_for,
                Ok(()),
            );
        });

        // finish election / start idle period
        MockUtils::increase_block_number(council_settings.reveal_stage_duration + 1);
        Mocks::check_idle_period(
            params.cycle_start_block_number
                + council_settings.reveal_stage_duration
                + council_settings.announcing_stage_duration
                + council_settings.voting_stage_duration,
        );

        // check that note can be changed no longer
        Mocks::set_candidacy_note(
            origin.clone(),
            membership_id.clone(),
            note4,
            Err(Error::NotCandidatingNow),
        );
    });
}

// Test that candidating in 2nd council cycle after failed candidacy in 1st cycle releases the 1st
// cycle's stake.
#[test]
fn council_repeated_candidacy_unstakes() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();
        let not_elected_candidate_index = 2;

        // run one council cycle
        let params = Mocks::run_full_council_cycle(0, &[], 0);

        // forward to next candidacy announcing period
        MockUtils::increase_block_number(council_settings.idle_stage_duration + 1);

        let candidate = params.candidates_announcing[not_elected_candidate_index].clone();

        // some different value from the previous stake
        let new_stake = council_settings.min_candidate_stake * 5;

        // check candidacy stake from 1st cycle is locked
        Mocks::check_announcing_stake(
            &candidate.membership_id,
            council_settings.min_candidate_stake,
        );

        Mocks::announce_candidacy(
            candidate.origin.clone(),
            candidate.account_id.clone(),
            new_stake,
            Ok(()),
        );

        // check candidacy
        Mocks::check_announcing_stake(&candidate.membership_id, new_stake);
    });
}

/////////////////// Budget-related /////////////////////////////////////////////

// Test that budget balance can be set from external source.
#[test]
fn council_budget_can_be_set() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let balances = [100, 500, 300];
        let origin = OriginType::Root;

        for balance in &balances {
            Mocks::set_budget(origin.clone(), *balance, Ok(()));
        }
    })
}

// Test that budget balance can be set from external source.
#[test]
fn council_budget_refill_can_be_planned() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Root;
        let next_refill = 1000;

        Mocks::plan_budget_refill(origin.clone(), next_refill, Ok(()));

        let current_block = frame_system::Module::<Runtime>::block_number();

        assert_eq!(current_block, 1);

        // forward to one block before refill
        MockUtils::increase_block_number(next_refill - current_block - 1);

        assert_eq!(
            frame_system::Module::<Runtime>::block_number(),
            next_refill - 1
        );

        // check no refill happened yet
        Mocks::check_budget_refill(0, next_refill);

        // forward to after block refill
        MockUtils::increase_block_number(1);

        assert_eq!(frame_system::Module::<Runtime>::block_number(), next_refill);

        // check budget was increased
        Mocks::check_budget_refill(
            BudgetIncrement::<Runtime>::get(),
            next_refill + <Runtime as Trait>::BudgetRefillPeriod::get(),
        );
    })
}

// Test that budget increment can be set from external source.
#[test]
fn council_budget_increment_can_be_upddated() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Root;
        let budget_increment = 1000;
        let next_refill = <Runtime as Trait>::BudgetRefillPeriod::get();

        Mocks::set_budget_increment(origin.clone(), budget_increment, Ok(()));

        let current_block = frame_system::Module::<Runtime>::block_number();

        assert_eq!(current_block, 1);

        // forward to one block before refill
        MockUtils::increase_block_number(next_refill - current_block - 1);

        // Check budget currently is 0
        Mocks::check_budget_refill(0, next_refill);

        // forward to after block refill
        MockUtils::increase_block_number(1);

        // check budget was increased with the expected increment
        Mocks::check_budget_refill(
            budget_increment,
            next_refill + <Runtime as Trait>::BudgetRefillPeriod::get(),
        );
    })
}

// Test that budget increment can be set from external source.
#[test]
fn council_budget_increment_can_be_updated() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Root;
        let budget_increment = 1000;
        let next_refill = <Runtime as Trait>::BudgetRefillPeriod::get();

        Mocks::set_budget_increment(origin.clone(), budget_increment, Ok(()));

        let current_block = frame_system::Module::<Runtime>::block_number();

        assert_eq!(current_block, 1);

        // forward to one block before refill
        MockUtils::increase_block_number(next_refill - current_block - 1);

        // Check budget currently is 0
        Mocks::check_budget_refill(0, next_refill);

        // forward to after block refill
        MockUtils::increase_block_number(1);

        // check budget was increased with the expected increment
        Mocks::check_budget_refill(
            budget_increment,
            next_refill + <Runtime as Trait>::BudgetRefillPeriod::get(),
        );
    })
}

// Test that rewards for council members are paid.
#[test]
fn council_rewards_are_paid() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();
        let origin = OriginType::Root;

        let sufficient_balance = 10000000;

        Mocks::set_budget(origin.clone(), sufficient_balance, Ok(()));

        // run 1st council cycle
        let params = Mocks::run_full_council_cycle(0, &[], 0);

        // calculate council member last reward block
        // the duration of the complete cycle minus the part of the idle cycle where there was
        // no time to pay out the the reward
        let last_payment_block = council_settings.cycle_duration
            - (council_settings.idle_stage_duration
                % <Runtime as Trait>::ElectedMemberRewardPeriod::get());
        let tmp_council_members: Vec<CouncilMemberOf<Runtime>> = params
            .expected_final_council_members
            .iter()
            .map(|council_member| CouncilMemberOf::<Runtime> {
                last_payment_block,
                ..*council_member
            })
            .collect();

        // run 2nd council cycle
        Mocks::run_full_council_cycle(
            council_settings.cycle_duration,
            &tmp_council_members.as_slice(),
            0,
        );
    });
}

// Test that can set councilor reward correctly.
#[test]
fn councilor_reward_can_be_set() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();
        let origin = OriginType::Root;

        let sufficient_balance = 10000000;

        Mocks::set_budget(origin.clone(), sufficient_balance, Ok(()));
        Mocks::set_councilor_reward(origin.clone(), 1, Ok(()));

        // run 1st council cycle
        let params = Mocks::run_full_council_cycle(0, &[], 0);

        // calculate council member last reward block
        let last_payment_block = council_settings.cycle_duration
            - (council_settings.idle_stage_duration
                % <Runtime as Trait>::ElectedMemberRewardPeriod::get());

        let start_rewarding_block = council_settings.reveal_stage_duration
            + council_settings.announcing_stage_duration
            + council_settings.voting_stage_duration;

        let councilor_initial_balance = council_settings.min_candidate_stake * TOPUP_MULTIPLIER;
        let current_council_balance =
            (last_payment_block - start_rewarding_block) + councilor_initial_balance;

        // Check that reward was correctly paid out
        params
            .expected_final_council_members
            .iter()
            .for_each(|council_member| {
                assert_eq!(
                    balances::Module::<Runtime>::free_balance(council_member.reward_account_id),
                    current_council_balance
                )
            });
    });
}

// Test that any rewards missed due to insufficient budget balance will be paid off eventually.
#[test]
fn council_missed_rewards_are_paid_later() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();
        let origin = OriginType::Root;
        let reward_period = <Runtime as Trait>::ElectedMemberRewardPeriod::get();

        let insufficient_balance = 0;
        let sufficient_balance = 10000000;

        // set empty budget
        Mocks::set_budget(origin.clone(), insufficient_balance, Ok(()));

        // run 1st council cycle
        Mocks::run_full_council_cycle(0, &[], 0);

        // forward to block after first reward payment
        MockUtils::increase_block_number(<Runtime as Trait>::ElectedMemberRewardPeriod::get());

        let last_payment_block = council_settings.cycle_duration
            - (council_settings.idle_stage_duration
                % <Runtime as Trait>::ElectedMemberRewardPeriod::get());

        // check unpaid rewards were discarded
        for council_member in CouncilMembers::<Runtime>::get() {
            assert_eq!(council_member.unpaid_reward, 0,);
            assert_eq!(
                council_member.last_payment_block,
                //last_payment_block + reward_period,
                council_settings.election_duration,
            );
        }

        // set sufficitent budget
        Mocks::set_budget(origin.clone(), sufficient_balance, Ok(()));

        // forward to block after second reward payment
        MockUtils::increase_block_number(<Runtime as Trait>::ElectedMemberRewardPeriod::get());

        // check unpaid rewards were discarded
        for council_member in CouncilMembers::<Runtime>::get() {
            assert_eq!(council_member.unpaid_reward, 0,);
            assert_eq!(
                council_member.last_payment_block,
                last_payment_block + 2 * reward_period,
            );
        }
    });
}

// Test that any unpaid rewards will be discarded on council depose if budget is still insufficient.
#[test]
fn council_discard_remaining_rewards_on_depose() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();
        let origin = OriginType::Root;

        let sufficient_balance = 10000000;
        let second_cycle_user_offset = 10;

        Mocks::set_budget(origin.clone(), sufficient_balance, Ok(()));

        // run 1st council cycle
        let params = Mocks::run_full_council_cycle(0, &[], 0);

        // calculate council member last reward block
        // the duration of the complete cycle minus the part of the idle cycle where there was
        // no time to pay out the the reward
        let last_payment_block = council_settings.cycle_duration
            - (council_settings.idle_stage_duration
                % <Runtime as Trait>::ElectedMemberRewardPeriod::get());
        let tmp_council_members: Vec<CouncilMemberOf<Runtime>> = params
            .expected_final_council_members
            .iter()
            .map(|council_member| CouncilMemberOf::<Runtime> {
                last_payment_block,
                ..*council_member
            })
            .collect();

        // check unpaid rewards were discarded
        for council_member in CouncilMembers::<Runtime>::get() {
            assert_eq!(council_member.unpaid_reward, 0,);
        }

        // run 2nd council cycle
        Mocks::run_full_council_cycle(
            council_settings.cycle_duration,
            &tmp_council_members.as_slice(),
            second_cycle_user_offset,
        );

        // check unpaid rewards were discarded
        for council_member in CouncilMembers::<Runtime>::get() {
            assert_eq!(council_member.unpaid_reward, 0,);
        }
    });
}

// Test that budget is periodicly refilled.
#[test]
fn council_budget_auto_refill() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();
        let start_balance = Budget::<Runtime>::get();
        let budget_increment = BudgetIncrement::<Runtime>::get();

        // forward before next refill
        // Note: initial block is 1 so current_block + budget_refill_period - 2 = budget_refill_period - 1
        MockUtils::increase_block_number(council_settings.budget_refill_period - 2);
        assert_eq!(
            frame_system::Module::<Runtime>::block_number(),
            council_settings.budget_refill_period - 1
        );

        assert_eq!(Budget::<Runtime>::get(), start_balance,);

        // forward to next filling
        MockUtils::increase_block_number(1);

        assert_eq!(Budget::<Runtime>::get(), start_balance + budget_increment,);

        // forward to next filling
        MockUtils::increase_block_number(council_settings.budget_refill_period);

        assert_eq!(
            Budget::<Runtime>::get(),
            start_balance + 2 * budget_increment,
        );
    });
}

// Test that `staking_account_id` is required to be associated with `membership_id` while
// `reward_account_id` is not
#[test]
fn council_membership_checks() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();

        // generate candidates
        let candidate1 = MockUtils::generate_candidate(0, council_settings.min_candidate_stake);
        let candidate2 = MockUtils::generate_candidate(1, council_settings.min_candidate_stake);

        // sanity checks
        assert_ne!(candidate1.membership_id, candidate2.membership_id,);
        assert_ne!(
            candidate1.candidate.reward_account_id,
            candidate2.candidate.reward_account_id,
        );
        assert_ne!(
            candidate1.candidate.staking_account_id,
            candidate2.candidate.staking_account_id,
        );

        // test that staking_account_id has to be associated with membership_id
        Mocks::announce_candidacy_raw(
            candidate1.origin.clone(),
            candidate1.account_id.clone(),
            candidate2.candidate.staking_account_id.clone(), // second candidate's account id
            candidate1.candidate.reward_account_id.clone(),
            candidate1.candidate.stake.clone(),
            Err(Error::MemberIdNotMatchAccount),
        );

        // test that reward_account_id not associated with membership_id can be used
        Mocks::announce_candidacy_raw(
            candidate1.origin.clone(),
            candidate1.account_id.clone(),
            candidate1.candidate.staking_account_id.clone(),
            candidate2.candidate.reward_account_id.clone(), // second candidate's account id
            candidate1.candidate.stake.clone(),
            Ok(()),
        );
    });
}

// Test that the hook is properly called after a new council is elected.
#[test]
fn council_new_council_elected_hook() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        Mocks::run_full_council_cycle(0, &[], 0);

        Mocks::check_new_council_elected_hook();
    });
}

#[test]
fn council_origin_validator_fails_with_unregistered_member() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = 10;
        let origin = RawOrigin::Signed(account_id);
        let member_id = 1;

        let validation_result = Council::ensure_member_consulate(origin.into(), member_id);

        assert_eq!(
            validation_result,
            Err(Error::<Runtime>::MemberIdNotMatchAccount.into())
        );
    });
}

#[test]
fn test_funding_request_fails_insufficient_fundings() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Root;
        Mocks::set_budget(origin.clone(), 0, Ok(()));
        Mocks::funding_request(
            origin,
            vec![common::FundingRequestParameters {
                account: 0,
                amount: 100,
            }],
            Err(Error::InsufficientFundsForFundingRequest),
        );
    });
}

#[test]
fn test_funding_request_fails_no_accounts() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Root;
        Mocks::set_budget(origin.clone(), 0, Ok(()));
        Mocks::funding_request(
            origin,
            Vec::<common::FundingRequestParameters<u64, u64>>::new(),
            Err(Error::EmptyFundingRequests),
        );
    });
}

#[test]
fn test_funding_request_fails_repeated_account() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Root;
        Mocks::set_budget(origin.clone(), 100, Ok(()));
        Mocks::funding_request(
            origin,
            vec![
                common::FundingRequestParameters {
                    account: 0,
                    amount: 5,
                };
                2
            ],
            Err(Error::RepeatedFundRequestAccount),
        );
    });
}

#[test]
fn test_funding_request_fails_zero_balance() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Root;
        Mocks::set_budget(origin.clone(), 100, Ok(()));
        Mocks::funding_request(
            origin,
            vec![common::FundingRequestParameters {
                account: 0,
                amount: 0,
            }],
            Err(Error::ZeroBalanceFundRequest),
        );
    });
}

#[test]
fn test_funding_request_fails_insufficient_fundings_in_multiple_accounts() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Root;
        Mocks::set_budget(origin.clone(), 100, Ok(()));
        Mocks::funding_request(
            origin,
            vec![
                common::FundingRequestParameters {
                    account: 0,
                    amount: 50,
                },
                common::FundingRequestParameters {
                    account: 1,
                    amount: 51,
                },
            ],
            Err(Error::InsufficientFundsForFundingRequest),
        );
    });
}

#[test]
fn council_origin_validator_succeeds() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let councilor1_member_id = 1u64;
        let councilor1_account_id = 1u64;

        let councilor1 = CouncilMemberOf::<Runtime> {
            staking_account_id: councilor1_account_id,
            reward_account_id: councilor1_account_id,
            membership_id: councilor1_member_id,
            stake: 0,
            last_payment_block: 0,
            unpaid_reward: 0,
        };

        CouncilMembers::<Runtime>::put(vec![councilor1]);

        let origin = RawOrigin::Signed(councilor1_account_id.clone());

        let validation_result =
            Council::ensure_member_consulate(origin.into(), councilor1_member_id);

        assert!(validation_result.is_ok());
    });
}

#[test]
fn test_funding_request_fails_permission() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(0);
        Mocks::funding_request(
            origin.into(),
            vec![common::FundingRequestParameters {
                amount: 100,
                account: 0,
            }],
            Err(Error::BadOrigin),
        );
    });
}

#[test]
fn council_origin_validator_fails_with_not_councilor() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = 1;
        let member_id = 1;
        let origin = RawOrigin::Signed(account_id.clone());

        let validation_result = Council::ensure_member_consulate(origin.into(), member_id);

        assert_eq!(
            validation_result,
            Err(Error::<Runtime>::NotCouncilor.into())
        );
    });
}

// Test that rewards for council members are paid as expected even after many council election cycles.
#[test]
fn council_many_cycle_rewards() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();

        // quite high number of election cycles that will uncover any reward payment iregularities
        let num_iterations = 100;

        let mut council_members = vec![];
        let mut auto_topup_amount = 0;

        let origin = OriginType::Root;
        Mocks::set_budget(origin.clone(), u64::MAX.into(), Ok(()));
        for i in 0..num_iterations {
            let tmp_params = Mocks::run_full_council_cycle(
                i * council_settings.cycle_duration,
                &council_members,
                0,
            );

            auto_topup_amount = tmp_params.candidates_announcing[0].auto_topup_amount;
            council_members = tmp_params.expected_final_council_members;

            /*
             *  Since we have enough budget to pay during idle period
             *  we update the councilor last payment block during the idle period
             *  that are not accounted in the `run_full_council_cycle` code expected final member
             */

            // This is the last paid block taking into account the last idle period
            let last_payment_block = i * council_settings.cycle_duration
                + council_settings.cycle_duration
                - (council_settings.idle_stage_duration
                    % <Runtime as Trait>::ElectedMemberRewardPeriod::get());

            // Update the expected final council from `run_full_council_cycle` to use the current
            // `last_payment_block`
            council_members = council_members
                .into_iter()
                .map(|councilor| CouncilMemberOf::<Runtime> {
                    last_payment_block,
                    ..councilor
                })
                .collect();
        }

        // All blocks are paid except for the first iteration while the council is not elected
        // that means discounting the idle stage duration. And the last blocks of the last idle
        // period aren't paid until a full extra reward period passes.
        let num_blocks_elected = num_iterations * council_settings.cycle_duration
            - (council_settings.cycle_duration - council_settings.idle_stage_duration) // Unpaid blocks from first cycle
            - (council_settings.idle_stage_duration // Unpaid blocks from last cycle
                % <Runtime as Trait>::ElectedMemberRewardPeriod::get());

        assert_eq!(
            balances::Module::<Runtime>::total_balance(&council_members[0].staking_account_id),
            num_blocks_elected * Council::councilor_reward() + num_iterations * auto_topup_amount
        );
    });
}

#[test]
fn test_funding_request_succeeds() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Root;
        let initial_budget = 100;
        Mocks::set_budget(origin.clone(), initial_budget, Ok(()));
        Mocks::funding_request(
            origin,
            vec![
                common::FundingRequestParameters {
                    amount: 15,
                    account: 0,
                },
                common::FundingRequestParameters {
                    amount: 10,
                    account: 1,
                },
            ],
            Ok(()),
        );
    });
}

#[test]
fn test_council_budget_manager_works_correctly() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Root;
        let initial_budget = 100;

        Mocks::set_budget(origin.clone(), initial_budget, Ok(()));

        assert_eq!(
            <Module<Runtime> as CouncilBudgetManager<u64, u64>>::get_budget(),
            initial_budget
        );

        let new_budget = 200;
        <Module<Runtime> as CouncilBudgetManager<u64, u64>>::set_budget(new_budget);
        assert_eq!(
            <Module<Runtime> as CouncilBudgetManager<u64, u64>>::get_budget(),
            new_budget
        );

        let increase_amount = 100;
        <Module<Runtime> as CouncilBudgetManager<u64, u64>>::increase_budget(increase_amount);
        assert_eq!(
            <Module<Runtime> as CouncilBudgetManager<u64, u64>>::get_budget(),
            new_budget + increase_amount
        );

        let account_id = 11;
        let transfer_amount = 100;
        <Module<Runtime> as CouncilBudgetManager<u64, u64>>::withdraw(&account_id, transfer_amount);
        assert_eq!(
            <Module<Runtime> as CouncilBudgetManager<u64, u64>>::get_budget(),
            new_budget + increase_amount - transfer_amount
        );

        let res = <Module<Runtime> as CouncilBudgetManager<u64, u64>>::try_withdraw(
            &account_id,
            transfer_amount,
        );
        assert!(res.is_ok());
        assert_eq!(
            <Module<Runtime> as CouncilBudgetManager<u64, u64>>::get_budget(),
            new_budget + increase_amount - transfer_amount - transfer_amount
        );

        let incorrect_amount = 1000;
        let res = <Module<Runtime> as CouncilBudgetManager<u64, u64>>::try_withdraw(
            &account_id,
            incorrect_amount,
        );
        assert_eq!(
            res,
            Err(Error::<Runtime>::InsufficientBalanceForTransfer.into())
        );
        assert_eq!(
            <Module<Runtime> as CouncilBudgetManager<u64, u64>>::get_budget(),
            new_budget + increase_amount - transfer_amount - transfer_amount
        );
    });
}

#[test]
fn councilor_remark_successful() {
    let config = augmented_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = 1;
        let member_id = 1;
        let msg = b"test".to_vec();
        let origin = RawOrigin::Signed(account_id.clone());

        assert_ok!(Council::councilor_remark(origin.into(), member_id, msg));
    });
}

#[test]
fn councilor_remark_unsuccessful_with_invalid_origin() {
    let config = augmented_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = 21;
        let member_id = 1;
        let msg = b"test".to_vec();
        let origin = RawOrigin::Signed(account_id.clone());

        assert_err!(
            Council::councilor_remark(origin.into(), member_id, msg),
            Error::<Runtime>::MemberIdNotMatchAccount,
        );
    });
}

#[test]
fn councilor_remark_unsuccessful_with_invalid_councilor() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = 2;
        let member_id = 2;
        let msg = b"test".to_vec();
        let origin = RawOrigin::Signed(account_id.clone());

        assert_err!(
            Council::councilor_remark(origin.into(), member_id, msg),
            Error::<Runtime>::NotCouncilor,
        );
    });
}

#[test]
fn candidate_remark_unsuccessful_with_invalid_candidate() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = 2;
        let member_id = 2;
        let msg = b"test".to_vec();
        let origin = RawOrigin::Signed(account_id.clone());

        assert_err!(
            Council::candidate_remark(origin.into(), member_id, msg),
            Error::<Runtime>::CandidateDoesNotExist,
        );
    });
}

#[test]
fn candidate_remark_unsuccessful_with_invalid_origin() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let account_id = 21;
        let member_id = 2;
        let msg = b"test".to_vec();
        let origin = RawOrigin::Signed(account_id.clone());

        assert_err!(
            Council::candidate_remark(origin.into(), member_id, msg),
            Error::<Runtime>::MemberIdNotMatchAccount,
        );
    });
}
