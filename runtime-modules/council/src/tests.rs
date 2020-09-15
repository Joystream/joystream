#![cfg(test)]

use super::{Error, EzCandidate};
use crate::mock::*;

type ReferendumInstance = referendum::Instance0;

type Mocks = InstanceMocks<Runtime, ReferendumInstance>;
type MockUtils = InstanceMockUtils<Runtime, ReferendumInstance>;

/////////////////// Lifetime - election cycle start ////////////////////////////
/// Test one referendum cycle with succesfull council election
#[test]
fn council_lifecycle() {
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
        let expected_candidates = candidates[0..council_settings.min_candidate_count as usize]
            .iter()
            .map(|item| item.candidate.clone())
            .collect();

        let expected_final_council_members: Vec<EzCandidate<Runtime>> = vec![
            candidates[3].candidate.clone(),
            candidates[0].candidate.clone(),
            candidates[1].candidate.clone(),
        ];

        // generate voter for each 6 voters and give: 4 votes for option D, 3 votes for option A, and 2 vote for option B, and 1 for option C
        let votes_map: Vec<u64> = vec![3, 3, 3, 3, 0, 0, 0, 1, 1, 2];
        let voters = (0..votes_map.len())
            .map(|index| MockUtils::generate_voter(index as u64, vote_stake, votes_map[index]))
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

        let expected_candidates = candidates[0..council_settings.min_candidate_count as usize]
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

        Mocks::candidate(
            candidates[0].origin.clone(),
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

        Mocks::candidate(
            candidate.origin.clone(),
            candidate.candidate.stake.clone(),
            Err(Error::CandidacyStakeTooLow),
        );
    });
}

// Test that candidate can't vote for himself.
#[test]
fn council_cant_vote_for_yourself() {
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

        let expected_candidates = candidates[0..council_settings.min_candidate_count as usize]
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

        InstanceMocks::simulate_council_cycle(params.clone());

        let self_voting_candidate_index = 0;
        let voter = MockUtils::generate_voter(
            VOTER_CANDIDATE_OFFSET,
            vote_stake,
            self_voting_candidate_index,
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
            Err(Error::CantVoteForYourself),
        );
    });
}
