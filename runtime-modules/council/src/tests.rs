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

        Mocks::start_election_cycle(origin, Ok(()));
    });
}
