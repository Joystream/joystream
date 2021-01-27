#![cfg(test)]

pub(crate) mod fixtures;
pub(crate) mod mocks;

use frame_system::RawOrigin;
use sp_runtime::DispatchError;

use crate::{Error, RawEvent};
use fixtures::{run_to_block, CreateBountyFixture, EventFixture};
use mocks::{build_test_externalities, Test};

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
        // For a council bounty.
        let create_bounty_fixture =
            CreateBountyFixture::default().with_origin(RawOrigin::Signed(1));
        create_bounty_fixture.call_and_assert(Err(DispatchError::BadOrigin));

        // For a member bounty.
        let create_bounty_fixture = CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_creator_member_id(1);
        create_bounty_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn create_bounty_fails_with_invalid_min_max_amounts() {
    build_test_externalities().execute_with(|| {
        let create_bounty_fixture = CreateBountyFixture::default().with_min_amount(100);
        create_bounty_fixture.call_and_assert(Err(
            Error::<Test>::MinFundingAmountCannotBeGreaterThanMaxAmount.into(),
        ));
    });
}
