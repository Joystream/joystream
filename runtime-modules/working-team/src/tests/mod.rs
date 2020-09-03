mod fixtures;
mod mock;

use system::RawOrigin;

use crate::{Error, JobOpeningType, RawEvent};
use fixtures::{
    setup_members, AddJobOpeningFixture, ApplyOnOpeningFixture, EventFixture, FillOpeningFixture,
};
use frame_support::dispatch::DispatchError;
use mock::{build_test_externalities, run_to_block, Test, TestWorkingTeamInstance};
use sp_std::collections::btree_map::BTreeMap;

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
fn add_opening_fails_with_bad_origin() {
    build_test_externalities().execute_with(|| {
        let add_opening_fixture = AddJobOpeningFixture::default()
            .with_opening_type(JobOpeningType::Leader)
            .with_origin(RawOrigin::None);

        add_opening_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn add_opening_fails_with_invalid_description() {
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

#[test]
fn apply_on_opening_succeeded() {
    build_test_externalities().execute_with(|| {
        setup_members(2);

        let starting_block = 1;
        run_to_block(starting_block);

        let add_opening_fixture =
            AddJobOpeningFixture::default().with_starting_block(starting_block);

        let opening_id = add_opening_fixture.call_and_assert(Ok(()));

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id);

        let application_id = apply_on_opening_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::AppliedOnOpening(
            opening_id,
            application_id,
        ));
    });
}

#[test]
fn apply_on_opening_fails_with_invalid_opening_id() {
    build_test_externalities().execute_with(|| {
        setup_members(2);

        let invalid_opening_id = 22;

        let apply_on_opening_fixture =
            ApplyOnOpeningFixture::default_for_opening_id(invalid_opening_id);

        apply_on_opening_fixture.call_and_assert(Err(
            Error::<Test, TestWorkingTeamInstance>::OpeningDoesNotExist.into(),
        ));
    });
}

#[test]
fn apply_on_opening_fails_with_bad_origin() {
    build_test_externalities().execute_with(|| {
        let member_id = 1;

        let add_opening_fixture = AddJobOpeningFixture::default();

        let opening_id = add_opening_fixture.call_and_assert(Ok(()));

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_origin(RawOrigin::None, member_id);

        apply_on_opening_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn apply_on_opening_fails_with_bad_member_id() {
    build_test_externalities().execute_with(|| {
        let member_id = 2;

        let add_opening_fixture = AddJobOpeningFixture::default();

        let opening_id = add_opening_fixture.call_and_assert(Ok(()));

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_origin(RawOrigin::Signed(1), member_id);

        apply_on_opening_fixture.call_and_assert(Err(
            Error::<Test, TestWorkingTeamInstance>::OriginIsNeitherMemberControllerOrRoot.into(),
        ));
    });
}

#[test]
fn apply_on_opening_fails_with_invalid_description() {
    build_test_externalities().execute_with(|| {
        setup_members(2);

        let add_opening_fixture = AddJobOpeningFixture::default();

        let opening_id = add_opening_fixture.call_and_assert(Ok(()));

        let apply_on_opening_fixture =
            ApplyOnOpeningFixture::default_for_opening_id(opening_id).with_text(Vec::new());

        apply_on_opening_fixture.call_and_assert(Err(DispatchError::Other(
            Error::<Test, TestWorkingTeamInstance>::JobApplicationDescriptionTooShort.into(),
        )));

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_text(b"Too long text".to_vec());

        apply_on_opening_fixture.call_and_assert(Err(DispatchError::Other(
            Error::<Test, TestWorkingTeamInstance>::JobApplicationDescriptionTooLong.into(),
        )));
    });
}

#[test]
fn apply_on_opening_fails_for_already_applied_members() {
    build_test_externalities().execute_with(|| {
        setup_members(2);

        let add_opening_fixture = AddJobOpeningFixture::default();

        let opening_id = add_opening_fixture.call_and_assert(Ok(()));

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id);

        apply_on_opening_fixture.call_and_assert(Ok(()));

        apply_on_opening_fixture.call_and_assert(Err(
            Error::<Test, TestWorkingTeamInstance>::MemberHasActiveApplicationOnOpening.into(),
        ));
    });
}

#[test]
fn fill_opening_succeeded() {
    build_test_externalities().execute_with(|| {
        setup_members(2);

        let starting_block = 1;
        run_to_block(starting_block);

        let add_opening_fixture =
            AddJobOpeningFixture::default().with_starting_block(starting_block);

        let opening_id = add_opening_fixture.call_and_assert(Ok(()));

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id);

        let application_id = apply_on_opening_fixture.call_and_assert(Ok(()));

        let fill_opening_fixture =
            FillOpeningFixture::default_for_ids(opening_id, vec![application_id]);

        let worker_id = fill_opening_fixture.call_and_assert(Ok(()));

        let mut result_map = BTreeMap::new();
        result_map.insert(application_id, worker_id);

        EventFixture::assert_last_crate_event(RawEvent::OpeningFilled(opening_id, result_map));
    });
}
