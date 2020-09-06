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
        let candidacy_stake = 100;
        let vote_stake = <Runtime as referendum::Trait<ReferendumInstance>>::MinimumStake::get();

        let council_size = <Runtime as Trait>::CouncilSize::get();
        let min_candidate_count =
            council_size + <Runtime as Trait>::MinNumberOfExtraCandidates::get();
        let announcing_stage_duration = <Runtime as Trait>::AnnouncingPeriodDuration::get();
        let voting_stage_duration =
            <Runtime as referendum::Trait<ReferendumInstance>>::VoteStageDuration::get();
        let reveal_stage_duration =
            <Runtime as referendum::Trait<ReferendumInstance>>::RevealStageDuration::get();

        Mocks::check_council_members(vec![]);

        // generate candidates
        let candidates: Vec<(
            OriginType<<Runtime as system::Trait>::AccountId>,
            EzCandidate<Runtime>,
        )> = (0..(min_candidate_count + 1) as u64)
            .map(|i| MockUtils::generate_candidate(u64::from(i), candidacy_stake))
            .collect();

        // start announcing
        Mocks::check_announcing_period(
            0,
            EzCouncilStageAnnouncing::<Runtime> { candidates: vec![] },
        );

        // announce candidacy for each candidate
        candidates.iter().for_each(|candidate| {
            Mocks::candidate(candidate.0.clone(), candidacy_stake, Ok(()));
        });

        MockUtils::increase_block_number(announcing_stage_duration + 1);

        // finish announcing period / start referendum -> will cause period prolongement
        Mocks::check_election_period(
            announcing_stage_duration + 1,
            EzCouncilStageElection::<Runtime> {
                candidates: candidates[0..min_candidate_count as usize]
                    .iter()
                    .map(|item| item.1.clone())
                    .collect(),
            },
        );

        // finish announcing period / start referendum -> will be successful
        let expected_candidates: Vec<EzCandidate<Runtime>> = [
            candidates[3].clone(),
            candidates[0].clone(),
            candidates[1].clone(),
        ]
        .iter()
        .map(|item| item.1.clone())
        .collect();

        // generate voter for each 6 voters and give: 4 votes for option D, 3 votes for option A, and 2 vote for option B, and 1 for option C
        let votes_map: Vec<u64> = vec![3, 3, 3, 3, 0, 0, 0, 1, 1, 2];
        let voters: Vec<(
            OriginType<<Runtime as system::Trait>::AccountId>,
            <Runtime as system::Trait>::Hash,
            Vec<u8>,
        )> = (0..votes_map.len())
            .map(|index| MockUtils::generate_voter(index as u64, vote_stake, votes_map[index]))
            .collect();

        // vote with all voters
        voters.iter().for_each(|voter| {
            Mocks::vote_for_candidate(voter.0.clone(), voter.1.clone(), vote_stake, Ok(()))
        });

        // referendum - start revealing period
        MockUtils::increase_block_number(voting_stage_duration + 1);
        Mocks::check_referendum_revealing(
            min_candidate_count,
            announcing_stage_duration + voting_stage_duration + 1,
        );

        // reveal vote for all voters
        voters.iter().enumerate().for_each(|(index, voter)| {
            Mocks::reveal_vote(voter.0.clone(), voter.2.clone(), votes_map[index], Ok(()));
        });

        // finish election / start
        MockUtils::increase_block_number(reveal_stage_duration + 1);
        Mocks::check_idle_period(
            reveal_stage_duration + announcing_stage_duration + voting_stage_duration + 1,
        );
        Mocks::check_council_members(expected_candidates);
    });
}
