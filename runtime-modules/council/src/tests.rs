#![cfg(test)]

use super::{EzCandidate, EzCouncilStageAnnouncing, EzCouncilStageElection, Trait};
use crate::mock::*;

type Mocks = InstanceMocks<Runtime>;
type MockUtils = InstanceMockUtils<Runtime>;
type ReferendumInstance = referendum::Instance0;

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
        };

        InstanceMocks::simulate_council_cycle(params);
    });
}
