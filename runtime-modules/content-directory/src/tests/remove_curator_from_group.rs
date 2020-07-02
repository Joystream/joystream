use super::*;

#[test]
fn remove_curator_from_group_success() {
    with_test_externalities(|| {
        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Add first curator to group
        assert_ok!(add_curator_to_group(
            LEAD_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            FIRST_CURATOR_ID
        ));
        // Add second curator to group
        assert_ok!(add_curator_to_group(
            LEAD_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            SECOND_CURATOR_ID
        ));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Remove first curator from group
        assert_ok!(remove_curator_from_group(
            LEAD_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            FIRST_CURATOR_ID
        ));

        // Runtime tested state after call

        // Ensure group contains only second curator
        let mut curator_group = CuratorGroup::default();
        curator_group.get_curators_mut().insert(SECOND_CURATOR_ID);
        assert_eq!(curator_group_by_id(FIRST_CURATOR_GROUP_ID), curator_group);

        let curator_group_curator_removed_event = get_test_event(RawEvent::CuratorRemoved(
            FIRST_CURATOR_GROUP_ID,
            FIRST_CURATOR_ID,
        ));

        // Event checked
        assert_event_success(
            curator_group_curator_removed_event,
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn remove_curator_from_group_lead_auth_failed() {
    with_test_externalities(|| {
        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Add curator to group
        assert_ok!(add_curator_to_group(
            LEAD_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            FIRST_CURATOR_ID
        ));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to remove curator from group using non lead origin
        let remove_curator_from_group_result = remove_curator_from_group(
            FIRST_MEMBER_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            FIRST_CURATOR_ID,
        );

        // Failure checked
        assert_failure(
            remove_curator_from_group_result,
            ERROR_LEAD_AUTH_FAILED,
            number_of_events_before_call,
        );
    })
}

#[test]
fn remove_curator_from_group_curator_is_not_a_member() {
    with_test_externalities(|| {
        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to remove curator that does not added to the provided curator group
        let remove_curator_from_group_result =
            remove_curator_from_group(LEAD_ORIGIN, FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID);

        // Failure checked
        assert_failure(
            remove_curator_from_group_result,
            ERROR_CURATOR_IS_NOT_A_MEMBER_OF_A_GIVEN_CURATOR_GROUP,
            number_of_events_before_call,
        );
    })
}

#[test]
fn remove_curator_from_non_existent_group() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to remove curator from group using non lead origin
        let remove_curator_from_group_result =
            remove_curator_from_group(LEAD_ORIGIN, FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID);

        // Failure checked
        assert_failure(
            remove_curator_from_group_result,
            ERROR_CURATOR_GROUP_DOES_NOT_EXIST,
            number_of_events_before_call,
        );
    })
}
