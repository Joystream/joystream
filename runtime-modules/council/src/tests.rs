#![cfg(test)]

use super::{Error, Trait, Candidate};
use crate::mock::*;

type Mocks = InstanceMocks<Runtime>;
type MockUtils = InstanceMockUtils<Runtime>;

/////////////////// Lifetime - election cycle start ////////////////////////////
#[test]
#[ignore]
fn election_() {
    MockUtils::origin_access(USER_ADMIN, |origin| {
        let options = vec![0];

        Mocks::start_announcing_period(origin, Ok(()));
    });
}

#[test]
// temporary test testing connection between council and referendum
fn tmp() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        let origin = OriginType::Signed(USER_ADMIN);
        let options = vec![0];
        let stake = 100;
        let double_stake = stake * 2;

        let candidates: Vec<(OriginType<<Runtime as system::Trait>::AccountId>, Candidate)> = (0..4 as u64).map(|i| MockUtils::generate_candidate(u64::from(i))).collect();

        // start announcing
        Mocks::start_announcing_period(origin.clone(), Ok(()));

        // announce candidacy - 1st candidate
        Mocks::candidate(origin.clone(), stake, Ok(()));

        // finish announcing period / start referendum -> will cause period prolongement
        Mocks::finalize_announcing_period(origin.clone(), Ok(()), None);

        // register more candidates
        Mocks::candidate(candidates[1].0.clone(), stake, Ok(()));
        Mocks::candidate(candidates[2].0.clone(), stake, Ok(()));
        Mocks::candidate(candidates[3].0.clone(), stake, Ok(()));

        // finish announcing period / start referendum -> will be successful
        let expected_candidates = [candidates[3].clone(), candidates[0].clone(), candidates[1].clone(),]
            .iter()
            .map(|item| item.1.clone())
            .collect();
        Mocks::finalize_announcing_period(origin.clone(), Ok(()), Some(expected_candidates));

        // referendum - start revealing period

        // finish election / start
    });
}
