#![cfg(test)]

use super::{CouncilMemberOf, CouncilStageAnnouncing, Error, Module, Trait};
use crate::mock::*;
use crate::staking_handler::mocks::{CANDIDATE_BASE_ID, VOTER_CANDIDATE_OFFSET};
use crate::staking_handler::StakingHandler2;

type Mocks = InstanceMocks<Runtime>;
type MockUtils = InstanceMockUtils<Runtime>;

type CandidacyLock = <Runtime as Trait>::CandidacyLock;
type ElectedMemberLock = <Runtime as Trait>::ElectedMemberLock;

/////////////////// Lifetime - election cycle start ////////////////////////////
/// Test one referendum cycle with succesfull council election
#[test]
fn council_lifecycle() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();
        let vote_stake =
            <RuntimeReferendum as referendum::Trait<ReferendumInstance>>::MinimumStake::get();

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
                candidates[3].council_user_id,
            )
                .into(),
            (
                candidates[0].candidate.clone(),
                candidates[0].council_user_id,
            )
                .into(),
            (
                candidates[1].candidate.clone(),
                candidates[1].council_user_id,
            )
                .into(),
        ];

        // generate voter for each 6 voters and give: 4 votes for option D, 3 votes for option A, and 2 vote for option B, and 1 for option C
        let votes_map: Vec<u64> = vec![3, 3, 3, 3, 0, 0, 0, 1, 1, 2];
        let voters = (0..votes_map.len())
            .map(|index| {
                MockUtils::generate_voter(
                    index as u64,
                    vote_stake,
                    CANDIDATE_BASE_ID + votes_map[index],
                )
            })
            .collect();

        let params = CouncilCycleParams {
            council_settings: CouncilSettings::<Runtime>::extract_settings(),
            cycle_start_block_number: 0,
            expected_initial_council_members: vec![],
            expected_final_council_members,
            candidates_announcing: candidates,
            expected_candidates,
            voters,

            interrupt_point: None,
        };

        InstanceMocks::simulate_council_cycle(params);
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
            candidates[0].origin.clone(),
            candidates[0].account_id.clone(),
            candidates[0].candidate.stake.clone(),
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
        let vote_stake =
            <RuntimeReferendum as referendum::Trait<ReferendumInstance>>::MinimumStake::get();

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
        );
        Mocks::vote_for_candidate(
            voter.origin.clone(),
            voter.account_id.clone(),
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

// Test that only valid members can candidate.
#[test]
fn council_candidacy_invalid_member() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();

        let stake = council_settings.min_candidate_stake;
        let candidate = MockUtils::generate_candidate(INVALID_USER_MEMBER, stake);

        Mocks::announce_candidacy(
            candidate.origin.clone(),
            candidate.account_id.clone(),
            candidate.candidate.stake.clone(),
            Err(Error::CouncilUserIdNotMatchAccount),
        );
    });
}

// Test that only valid members can candidate.
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

// Test that announcement phase is reset when not enough candidates to fill council recieved votes
#[test]
fn council_announcement_reset_on_not_enough_winners() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();
        let vote_stake =
            <RuntimeReferendum as referendum::Trait<ReferendumInstance>>::MinimumStake::get();

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
        MockUtils::increase_block_number(council_settings.reveal_stage_duration + 1);

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
        let vote_stake =
            <RuntimeReferendum as referendum::Trait<ReferendumInstance>>::MinimumStake::get();

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
                candidates[3].council_user_id,
            )
                .into(),
            (
                candidates[0].candidate.clone(),
                candidates[0].council_user_id,
            )
                .into(),
            (
                candidates[1].candidate.clone(),
                candidates[1].council_user_id,
            )
                .into(),
        ];

        // generate voter for each 6 voters and give: 4 votes for option D, 3 votes for option A, and 2 vote for option B, and 1 for option C
        let votes_map: Vec<u64> = vec![3, 3, 3, 3, 0, 0, 0, 1, 1, 2];
        let voters = (0..votes_map.len())
            .map(|index| {
                MockUtils::generate_voter(
                    index as u64,
                    vote_stake,
                    CANDIDATE_BASE_ID + votes_map[index],
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

        // forward to idle period
        MockUtils::increase_block_number(council_settings.idle_stage_duration + 1);

        let votes_map2: Vec<u64> = vec![3, 3, 3, 3, 1, 1, 2];
        let voters2 = (0..votes_map2.len())
            .map(|index| {
                MockUtils::generate_voter(
                    index as u64,
                    vote_stake,
                    CANDIDATE_BASE_ID + votes_map2[index],
                )
            })
            .collect();

        let expected_final_council_members2: Vec<CouncilMemberOf<Runtime>> = vec![
            (
                candidates[3].candidate.clone(),
                candidates[3].council_user_id,
            )
                .into(),
            (
                candidates[1].candidate.clone(),
                candidates[1].council_user_id,
            )
                .into(),
            (
                candidates[2].candidate.clone(),
                candidates[2].council_user_id,
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
            candidate.council_user_id,
            council_settings.min_candidate_stake,
            Ok(()),
        );
        Mocks::announce_candidacy(
            candidate.origin.clone(),
            candidate.council_user_id,
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
        let vote_stake =
            <RuntimeReferendum as referendum::Trait<ReferendumInstance>>::MinimumStake::get();

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
                candidates[3].council_user_id,
            )
                .into(),
            (
                candidates[0].candidate.clone(),
                candidates[0].council_user_id,
            )
                .into(),
            (
                candidates[1].candidate.clone(),
                candidates[1].council_user_id,
            )
                .into(),
        ];

        // generate voter for each 6 voters and give: 4 votes for option D, 3 votes for option A, and 2 vote for option B, and 1 for option C
        let votes_map: Vec<u64> = vec![3, 3, 3, 3, 0, 0, 0, 1, 1, 2];
        let voters = (0..votes_map.len())
            .map(|index| {
                MockUtils::generate_voter(
                    index as u64,
                    vote_stake,
                    CANDIDATE_BASE_ID + votes_map[index],
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

// Test that elected candidate's stake lock is automaticly converted from candidate lock to elected member lock.
#[test]
fn council_candidate_stake_automaticly_converted() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let council_settings = CouncilSettings::<Runtime>::extract_settings();
        let vote_stake =
            <RuntimeReferendum as referendum::Trait<ReferendumInstance>>::MinimumStake::get();

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
                candidates[3].council_user_id,
            )
                .into(),
            (
                candidates[0].candidate.clone(),
                candidates[0].council_user_id,
            )
                .into(),
            (
                candidates[1].candidate.clone(),
                candidates[1].council_user_id,
            )
                .into(),
        ];

        // generate voter for each 6 voters and give: 4 votes for option D, 3 votes for option A, and 2 vote for option B, and 1 for option C
        let votes_map: Vec<u64> = vec![3, 3, 3, 3, 0, 0, 0, 1, 1, 2];
        let voters = (0..votes_map.len())
            .map(|index| {
                MockUtils::generate_voter(
                    index as u64,
                    vote_stake,
                    CANDIDATE_BASE_ID + votes_map[index],
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
                    ElectedMemberLock::current_stake(&council_member.staking_account_id),
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
        let vote_stake =
            <RuntimeReferendum as referendum::Trait<ReferendumInstance>>::MinimumStake::get();

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
                candidates[3].council_user_id,
            )
                .into(),
            (
                candidates[0].candidate.clone(),
                candidates[0].council_user_id,
            )
                .into(),
            (
                candidates[1].candidate.clone(),
                candidates[1].council_user_id,
            )
                .into(),
        ];

        // generate voter for each 6 voters and give: 4 votes for option D, 3 votes for option A, and 2 vote for option B, and 1 for option C
        let votes_map: Vec<u64> = vec![3, 3, 3, 3, 0, 0, 0, 1, 1, 2];
        let voters = (0..votes_map.len())
            .map(|index| {
                MockUtils::generate_voter(
                    index as u64,
                    vote_stake,
                    CANDIDATE_BASE_ID + votes_map[index],
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
                    ElectedMemberLock::current_stake(&council_member.staking_account_id),
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
        let vote_stake =
            <RuntimeReferendum as referendum::Trait<ReferendumInstance>>::MinimumStake::get();
        let not_reelected_candidate_index = 0;

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
                candidates[3].council_user_id,
            )
                .into(),
            (
                candidates[0].candidate.clone(),
                candidates[0].council_user_id,
            )
                .into(),
            (
                candidates[1].candidate.clone(),
                candidates[1].council_user_id,
            )
                .into(),
        ];

        // generate voter for each 6 voters and give: 4 votes for option D, 3 votes for option A, and 2 vote for option B, and 1 for option C
        let votes_map: Vec<u64> = vec![3, 3, 3, 3, 0, 0, 0, 1, 1, 2];
        let voters = (0..votes_map.len())
            .map(|index| {
                MockUtils::generate_voter(
                    index as u64,
                    vote_stake,
                    CANDIDATE_BASE_ID + votes_map[index],
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

        // 'not reelected member' should have it's stake locked now (he is currently elected member)
        assert_eq!(
            ElectedMemberLock::current_stake(&candidates[not_reelected_candidate_index].account_id),
            council_settings.min_candidate_stake,
        );

        // forward to idle period
        MockUtils::increase_block_number(council_settings.idle_stage_duration + 1);

        let votes_map2: Vec<u64> = vec![3, 3, 3, 3, 1, 1, 2];
        let voters2 = (0..votes_map2.len())
            .map(|index| {
                MockUtils::generate_voter(
                    index as u64,
                    vote_stake,
                    CANDIDATE_BASE_ID + votes_map2[index],
                )
            })
            .collect();

        let expected_final_council_members2: Vec<CouncilMemberOf<Runtime>> = vec![
            (
                candidates[3].candidate.clone(),
                candidates[3].council_user_id,
            )
                .into(),
            (
                candidates[1].candidate.clone(),
                candidates[1].council_user_id,
            )
                .into(),
            (
                candidates[2].candidate.clone(),
                candidates[2].council_user_id,
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
            expected_final_council_members: expected_final_council_members2.clone(),
            ..params.clone()
        };

        Mocks::simulate_council_cycle(params2);

        // not reelected member should have it's stake unlocked
        assert_eq!(
            ElectedMemberLock::current_stake(&candidates[not_reelected_candidate_index].account_id),
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
        let vote_stake =
            <RuntimeReferendum as referendum::Trait<ReferendumInstance>>::MinimumStake::get();

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

        // generate voter for each 6 voters and give: 4 votes for option D, 3 votes for option A, and 2 vote for option B, and 1 for option C
        let votes_map: Vec<u64> = vec![3, 3, 3, 3, 0, 0, 0, 1, 1, 2];
        let voters = (0..votes_map.len())
            .map(|index| {
                MockUtils::generate_voter(
                    index as u64,
                    vote_stake,
                    CANDIDATE_BASE_ID + votes_map[index],
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
        let council_user_id = candidates[0].clone().council_user_id;
        let origin = candidates[0].origin.clone();
        let note1 = "MyNote1".as_bytes();
        let note2 = "MyNote2".as_bytes();
        let note3 = "MyNote3".as_bytes();
        let note4 = "MyNote4".as_bytes();

        // check note is not set yet
        Mocks::check_candidacy_note(&council_user_id, None);

        // set note - announcement stage
        Mocks::set_candidacy_note(origin.clone(), council_user_id.clone(), note1, Ok(()));

        // change note - announcement stage
        Mocks::set_candidacy_note(origin.clone(), council_user_id.clone(), note2, Ok(()));

        // forward to election-voting period
        MockUtils::increase_block_number(council_settings.announcing_stage_duration + 1);

        // change note - election stage
        Mocks::set_candidacy_note(origin.clone(), council_user_id.clone(), note3, Ok(()));

        // vote with all voters
        params.voters.iter().for_each(|voter| {
            Mocks::vote_for_candidate(
                voter.origin.clone(),
                voter.account_id.clone(),
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
            council_user_id.clone(),
            note4,
            Err(Error::NotCandidatingNow),
        );
    });
}
