#![cfg(test)]

use super::{Error, Trait};
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
    MockUtils::origin_access(USER_ADMIN, |origin| {
        let options = vec![0];

        // start announcing
        Mocks::start_announcing_period(origin, Ok(()));

        // subscribe candidate

        // finish announcing period / start referendum

        // referendum - start revealing period

        // finish election / start

    });
}
