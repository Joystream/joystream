#![cfg(test)]

use super::{Candidate, Error, Trait};
use crate::mock::*;

type Mocks = InstanceMocks<Runtime>;
type MockUtils = InstanceMockUtils<Runtime>;
type ReferendumInstance = referendum::Instance0;

/////////////////// Lifetime - election cycle start ////////////////////////////
/*
#[test]
#[ignore]
fn election_() {
    MockUtils::origin_access(USER_ADMIN, |origin| {
        let options = vec![0];

        //Mocks::start_announcing_period(origin, Ok(()));
    });
}
*/
/*
#[test]
// temporary test testing connection between council and referendum
fn tmp() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_ADMIN);
        let options = vec![0];
        let candidacy_stake = 100;
        let vote_stake = <Runtime as referendum::Trait<ReferendumInstance>>::MinimumStake::get();
        //let candidacy_double_stake = stake * 2;

        let voting_stage_duration =
            <Runtime as referendum::Trait<ReferendumInstance>>::VoteStageDuration::get();
        let reveal_stage_duration =
            <Runtime as referendum::Trait<ReferendumInstance>>::RevealStageDuration::get();

        // generate candidates
        let candidates: Vec<(OriginType<<Runtime as system::Trait>::AccountId>, Candidate)> = (0
            ..4 as u64)
            .map(|i| MockUtils::generate_candidate(u64::from(i)))
            .collect();

        // start announcing
        Mocks::start_announcing_period(origin.clone(), Ok(()));

        // announce candidacy - 1st candidate
        Mocks::candidate(origin.clone(), candidacy_stake, Ok(()));

        // finish announcing period / start referendum -> will cause period prolongement
        Mocks::finalize_announcing_period(origin.clone(), Ok(()), None);

        // register more candidates
        Mocks::candidate(candidates[1].0.clone(), candidacy_stake, Ok(()));
        Mocks::candidate(candidates[2].0.clone(), candidacy_stake, Ok(()));
        Mocks::candidate(candidates[3].0.clone(), candidacy_stake, Ok(()));

        // finish announcing period / start referendum -> will be successful
        let expected_candidates = [
            candidates[3].clone(),
            candidates[0].clone(),
            candidates[1].clone(),
        ]
        .iter()
        .map(|item| item.1.clone())
        .collect();
        Mocks::finalize_announcing_period(origin.clone(), Ok(()), Some(expected_candidates));

        // vote for the first candidate
        let vote_for1 = 0;
        let voter1 = MockUtils::generate_voter(0, vote_for1);
        Mocks::vote_for_candidate(voter1.0.clone(), voter1.1.clone(), vote_stake, Ok(()));

        // referendum - start revealing period
        MockUtils::increase_block_number(voting_stage_duration + 1);
        Mocks::finish_voting_start_revealing(origin.clone(), Ok(()));

        // reveal vote for the first candidate
        Mocks::reveal_vote(voter1.0, voter1.2, vote_for1, Ok(()));

        // finish election / start
        MockUtils::increase_block_number(reveal_stage_duration + 1);
        Mocks::finish_revealing_period(origin.clone(), Ok(()));
    });
}
*/
