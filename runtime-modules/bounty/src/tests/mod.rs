#![cfg(test)]

pub(crate) mod fixtures;
pub(crate) mod mocks;

use frame_system::RawOrigin;
use sp_runtime::DispatchError;

use crate::RawEvent;
use fixtures::{run_to_block, CreateBountyFixture, EventFixture};
use mocks::build_test_externalities;

#[test]
fn create_bounty_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let text = b"Bounty text".to_vec();

        let create_bounty_fixture = CreateBountyFixture::default().with_metadata(text);
        create_bounty_fixture.call_and_assert(Ok(()));

        let bounty_id = 1u64;

        EventFixture::assert_last_crate_event(RawEvent::BountyCreated(bounty_id));
    });
}

#[test]
fn create_bounty_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let create_bounty_fixture = CreateBountyFixture::default().with_origin(RawOrigin::None);
        create_bounty_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}
