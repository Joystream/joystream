use super::*;

#[test]
fn remove_curator_group_success() {
    with_test_externalities(|| {
        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_ok!(remove_curator_group(LEAD_ORIGIN, FIRST_CURATOR_GROUP_ID));

        // Runtime tested state after call

        assert_eq!(next_curator_group_id(), SECOND_CURATOR_GROUP_ID);

        // Ensure curator group removed
        assert!(!curator_group_exists(FIRST_CURATOR_GROUP_ID));

        let curator_group_removed_event =
            get_test_event(RawEvent::CuratorGroupRemoved(FIRST_CURATOR_GROUP_ID));

        // Event checked
        assert_event_success(
            curator_group_removed_event,
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn remove_curator_group_lead_auth_failed() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // An attemt to remove curator group from non lead origin
        let remove_curator_group_result =
            remove_curator_group(FIRST_MEMBER_ORIGIN, FIRST_CURATOR_GROUP_ID);

        // Failure checked
        assert_failure(
            remove_curator_group_result,
            ERROR_LEAD_AUTH_FAILED,
            number_of_events_before_call,
        );
    })
}

#[test]
fn remove_non_existent_curator_group() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // An attemt to remove non existent curator group
        let remove_curator_group_result =
            remove_curator_group(LEAD_ORIGIN, UNKNOWN_CURATOR_GROUP_ID);

        // Failure checked
        assert_failure(
            remove_curator_group_result,
            ERROR_CURATOR_GROUP_DOES_NOT_EXIST,
            number_of_events_before_call,
        );
    })
}

#[test]
fn curator_group_removal_forbidden() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Create class
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Add curator group as class maintainer
        assert_ok!(add_maintainer_to_class(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID
        ));

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // An attemt to remove curator group, that have classes maintained
        let remove_curator_group_result = remove_curator_group(LEAD_ORIGIN, FIRST_CURATOR_ID);

        // Failure checked
        assert_failure(
            remove_curator_group_result,
            ERROR_CURATOR_GROUP_REMOVAL_FORBIDDEN,
            number_of_events_before_call,
        );
    })
}
