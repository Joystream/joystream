mod fixtures;
mod mock;

use crate::{Error, JobOpeningType, RawEvent};
use fixtures::{AddJobOpeningFixture, EventFixture};
use frame_support::dispatch::DispatchError;
use mock::{build_test_externalities, run_to_block, Test, TestWorkingTeamInstance};

#[test]
fn add_opening_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let add_opening_fixture =
            AddJobOpeningFixture::default().with_starting_block(starting_block);

        let opening_id = add_opening_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::OpeningAdded(opening_id));
    });
}

#[test]
fn add_opening_fails_with_description() {
    build_test_externalities().execute_with(|| {
        let add_opening_fixture = AddJobOpeningFixture::default().with_text(Vec::new());

        add_opening_fixture.call_and_assert(Err(DispatchError::Other(
            Error::<Test, TestWorkingTeamInstance>::OpeningDescriptionTooShort.into(),
        )));

        let add_opening_fixture =
            AddJobOpeningFixture::default().with_text(b"Too long text".to_vec());

        add_opening_fixture.call_and_assert(Err(DispatchError::Other(
            Error::<Test, TestWorkingTeamInstance>::OpeningDescriptionTooLong.into(),
        )));
    });
}

#[test]
fn add_leader_opening_fails_with_incorrect_origin_for_opening_type() {
    build_test_externalities().execute_with(|| {
        let add_opening_fixture =
            AddJobOpeningFixture::default().with_opening_type(JobOpeningType::Leader);

        add_opening_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}
