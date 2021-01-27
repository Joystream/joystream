#![cfg(test)]

pub(crate) mod fixtures;
pub(crate) mod mocks;

use frame_system::RawOrigin;
use sp_runtime::DispatchError;

use crate::{Error, RawEvent};
use fixtures::{run_to_block, CancelBountyFixture, CreateBountyFixture, EventFixture};
use mocks::{build_test_externalities, Test};

#[test]
fn create_bounty_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let text = b"Bounty text".to_vec();

        CreateBountyFixture::default()
            .with_metadata(text)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        EventFixture::assert_last_crate_event(RawEvent::BountyCreated(bounty_id));
    });
}

#[test]
fn create_bounty_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        // For a council bounty.
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(1))
            .call_and_assert(Err(DispatchError::BadOrigin));

        // For a member bounty.
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_creator_member_id(1)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn create_bounty_fails_with_invalid_min_max_amounts() {
    build_test_externalities().execute_with(|| {
        CreateBountyFixture::default()
            .with_min_amount(100)
            .call_and_assert(Err(
                Error::<Test>::MinFundingAmountCannotBeGreaterThanMaxAmount.into(),
            ));
    });
}

#[test]
fn create_bounty_fails_with_invalid_periods() {
    build_test_externalities().execute_with(|| {
        CreateBountyFixture::default()
            .with_work_period(0)
            .call_and_assert(Err(Error::<Test>::WorkPeriodCannotBeZero.into()));

        CreateBountyFixture::default()
            .with_judging_period(0)
            .call_and_assert(Err(Error::<Test>::JudgingPeriodCannotBeZero.into()));
    });
}

#[test]
fn cancel_bounty_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        let bounty_id = 1u64;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::BountyCanceled(bounty_id));
    });
}

#[test]
fn cancel_bounty_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        CancelBountyFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn cancel_bounty_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let member_id = 1;
        let account_id = 1;

        // Created by council - try to cancel with bad origin
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Err(DispatchError::BadOrigin));

        // Created by a member - try to cancel with invalid member_id
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 2u64;
        let invalid_member_id = 2;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(invalid_member_id)
            .call_and_assert(Err(Error::<Test>::NotBountyCreator.into()));

        // Created by a member - try to cancel with bad origin
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(1))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 3u64;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));

        // Created by a member  - try to cancel by council
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 4u64;
        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(Error::<Test>::NotBountyCreator.into()));
    });
}
