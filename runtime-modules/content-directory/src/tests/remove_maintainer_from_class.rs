use super::*;

#[test]
fn remove_maintainer_from_class_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Add first curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Add second curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Add first maintainer to class
        assert_ok!(add_maintainer_to_class(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID
        ));

        // Add second maintainer to class
        assert_ok!(add_maintainer_to_class(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            SECOND_CURATOR_GROUP_ID
        ));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Remove first maintainer from class
        assert_ok!(remove_maintainer_from_class(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID
        ));

        // Runtime tested state after call

        // Ensure curator_group removed from class maintainers set
        let mut class = create_class_with_default_permissions();
        class
            .get_permissions_mut()
            .get_maintainers_mut()
            .insert(SECOND_CURATOR_GROUP_ID);
        assert_eq!(class_by_id(FIRST_CLASS_ID), class);

        let maintainer_removed_event = get_test_event(RawEvent::MaintainerRemoved(
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID,
        ));

        // Event checked
        assert_event_success(maintainer_removed_event, number_of_events_before_call + 1);
    })
}

#[test]
fn remove_maintainer_from_class_lead_auth_failed() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Add maintainer to class
        assert_ok!(add_maintainer_to_class(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID
        ));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to remove maintainer from class under non lead origin
        let remove_maintainer_from_class_result = remove_maintainer_from_class(
            FIRST_MEMBER_ORIGIN,
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID,
        );

        // Failure checked
        assert_failure(
            remove_maintainer_from_class_result,
            ERROR_LEAD_AUTH_FAILED,
            number_of_events_before_call,
        );
    })
}

#[test]
fn remove_maintainer_from_non_existent_class() {
    with_test_externalities(|| {

        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to remove maintainer from non existent class
        let remove_maintainer_from_class_result = remove_maintainer_from_class(
            LEAD_ORIGIN,
            UNKNOWN_CLASS_ID,
            FIRST_CURATOR_GROUP_ID,
        );

        // Failure checked
        assert_failure(
            remove_maintainer_from_class_result,
            ERROR_CLASS_NOT_FOUND,
            number_of_events_before_call,
        );
    })
}

#[test]
fn remove_maintainer_that_was_not_added_to_class_maintainers_set() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to remove curator group maintainer, that was not added to corresponding class maintainers set yet
        let remove_maintainer_from_class_result = remove_maintainer_from_class(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID,
        );

        // Failure checked
        assert_failure(
            remove_maintainer_from_class_result,
            ERROR_MAINTAINER_DOES_NOT_EXIST,
            number_of_events_before_call,
        );
    })
}
