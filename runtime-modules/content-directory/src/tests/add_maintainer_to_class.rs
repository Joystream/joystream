use super::*;

#[test]
fn add_maintainer_to_class_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_ok!(add_maintainer_to_class(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID
        ));

        // Runtime tested state after call

        // Ensure curator_group added as class maintainer
        let mut class = create_class_with_default_permissions();
        class
            .get_permissions_mut()
            .get_maintainers_mut()
            .insert(FIRST_CURATOR_GROUP_ID);
        assert_eq!(class_by_id(FIRST_CLASS_ID), class);

        let maintainer_added_event = get_test_event(RawEvent::MaintainerAdded(
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID,
        ));

        // Event checked
        assert_event_success(maintainer_added_event, number_of_events_before_call + 1);
    })
}

#[test]
fn add_maintainer_to_class_lead_auth_failed() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to add maintainer to class from non lead origin
        let add_maintainer_result =
            add_maintainer_to_class(SECOND_MEMBER_ORIGIN, FIRST_CLASS_ID, FIRST_CURATOR_GROUP_ID);

        // Failure checked
        assert_failure(
            add_maintainer_result,
            ERROR_LEAD_AUTH_FAILED,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_non_existent_maintainer_to_class() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to add non existent maintainer curator group to class
        let add_maintainer_result =
            add_maintainer_to_class(LEAD_ORIGIN, FIRST_CLASS_ID, FIRST_CURATOR_GROUP_ID);

        // Failure checked
        assert_failure(
            add_maintainer_result,
            ERROR_CURATOR_GROUP_DOES_NOT_EXIST,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_maintainer_to_non_existent_class() {
    with_test_externalities(|| {
        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to add maintainer to non existent class
        let add_maintainer_result =
            add_maintainer_to_class(LEAD_ORIGIN, FIRST_CLASS_ID, FIRST_CURATOR_GROUP_ID);

        // Failure checked
        assert_failure(
            add_maintainer_result,
            ERROR_CLASS_NOT_FOUND,
            number_of_events_before_call,
        );
    })
}

#[test]
fn add_maintainer_to_class_limit_reached() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Add curator groups to runtime storage, that will be used to be added as class maintainers
        for _ in 0..=MaxNumberOfMaintainersPerClass::get() {
            assert_ok!(add_curator_group(LEAD_ORIGIN));
        }

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut number_of_maintainers_added_to_class = 0_usize;

        // Adding curator group maintainers to the same class until limit reached
        let add_maintainer_result = loop {
            let curator_group_id = (number_of_maintainers_added_to_class + 1) as CuratorGroupId;

            let add_maintainer_result =
                add_maintainer_to_class(LEAD_ORIGIN, FIRST_CLASS_ID, curator_group_id);

            if add_maintainer_result.is_err() {
                break add_maintainer_result;
            } else {
                number_of_maintainers_added_to_class += 1;
            }
        };

        // Ensure number of maintainers added to the class is equal to MaxNumberOfMaintainersPerClass constraint defined on class level
        assert_eq!(
            number_of_maintainers_added_to_class,
            MaxNumberOfMaintainersPerClass::get() as usize
        );

        // Failure checked
        assert_failure(
            add_maintainer_result,
            ERROR_NUMBER_OF_MAINTAINERS_PER_CLASS_LIMIT_REACHED,
            number_of_events_before_call + number_of_maintainers_added_to_class,
        );
    })
}

#[test]
fn add_maintainer_that_is_already_exist() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Add maintainer
        assert_ok!(add_maintainer_to_class(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID
        ));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to add curator group maintainer, that is already added to given class maintainers set
        let add_maintainer_result =
            add_maintainer_to_class(LEAD_ORIGIN, FIRST_CLASS_ID, FIRST_CURATOR_GROUP_ID);

        // Failure checked
        assert_failure(
            add_maintainer_result,
            ERROR_MAINTAINER_ALREADY_EXISTS,
            number_of_events_before_call,
        );
    })
}
