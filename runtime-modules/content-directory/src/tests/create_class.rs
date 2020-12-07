use super::*;

#[test]
fn create_class_success() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_eq!(next_class_id(), FIRST_CLASS_ID);
        assert!(!class_exists(FIRST_CLASS_ID));

        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state after call

        // Ensure class under given if is equal to default one
        let default_class = create_class_with_default_permissions();
        assert_eq!(class_by_id(FIRST_CLASS_ID), default_class);

        let class_created_event = get_test_event(RawEvent::ClassCreated(FIRST_CLASS_ID));

        // Event checked
        assert_event(class_created_event, number_of_events_before_call + 1);
    })
}

#[test]
fn create_class_lead_auth_failed() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // An attempt to create class with non lead origin
        let create_class_result = create_simple_class(FIRST_MEMBER_ORIGIN, ClassType::Valid);

        // Failure checked
        assert_failure(
            create_class_result,
            Error::<Runtime>::LeadAuthFailed,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_class_limit_reached() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut number_of_classes_created = 0;

        // Creating classes before limit reached
        let create_class_result = loop {
            let create_class_result = create_simple_class(LEAD_ORIGIN, ClassType::Valid);
            if create_class_result.is_err() {
                break create_class_result;
            } else {
                number_of_classes_created += 1;
            }
        };

        // Ensure number of classes created is equal to MaxNumberOfClasses runtime constraint
        assert_eq!(
            number_of_classes_created,
            MaxNumberOfClasses::get() as usize
        );

        // Failure checked
        assert_failure(
            create_class_result,
            Error::<Runtime>::ClassLimitReached,
            number_of_events_before_call + number_of_classes_created,
        );
    })
}

#[test]
fn create_class_name_is_too_long() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // An attempt to create class with invalid name
        let create_class_result = create_simple_class(LEAD_ORIGIN, ClassType::NameTooLong);

        // Failure checked
        assert_failure(
            create_class_result,
            Error::<Runtime>::ClassNameTooLong,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_class_name_is_too_short() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // An attempt to create class with invalid name
        let create_class_result = create_simple_class(LEAD_ORIGIN, ClassType::NameTooShort);

        // Failure checked
        assert_failure(
            create_class_result,
            Error::<Runtime>::ClassNameTooShort,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_class_description_is_too_long() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // An attempt to create class with invalid description
        let create_class_result = create_simple_class(LEAD_ORIGIN, ClassType::DescriptionTooLong);

        // Failure checked
        assert_failure(
            create_class_result,
            Error::<Runtime>::ClassDescriptionTooLong,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_class_description_is_too_short() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // An attempt to create class with invalid description
        let create_class_result = create_simple_class(LEAD_ORIGIN, ClassType::DescriptionTooShort);

        // Failure checked
        assert_failure(
            create_class_result,
            Error::<Runtime>::ClassDescriptionTooShort,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_class_invalid_maximum_entities_count() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // An attempt to create class with invalid maximum entities count value
        let create_class_result =
            create_simple_class(LEAD_ORIGIN, ClassType::InvalidMaximumEntitiesCount);

        // Failure checked
        assert_failure(
            create_class_result,
            Error::<Runtime>::EntitiesNumberPerClassConstraintViolated,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_class_invalid_default_voucher_upper_bound() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // An attempt to create class with invalid default voucher upper bound value
        let create_class_result =
            create_simple_class(LEAD_ORIGIN, ClassType::InvalidDefaultVoucherUpperBound);

        // Failure checked
        assert_failure(
            create_class_result,
            Error::<Runtime>::NumberOfClassEntitiesPerActorConstraintViolated,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_class_per_controller_creation_limit_exceeds_overall_limit() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // An attempt to create class with per controller creation limit that exceeds overall entities creation limit
        let create_class_result = create_simple_class(
            LEAD_ORIGIN,
            ClassType::DefaultVoucherUpperBoundExceedsMaximumEntitiesCount,
        );

        // Failure checked
        assert_failure(
            create_class_result,
            Error::<Runtime>::PerControllerEntitiesCreationLimitExceedsOverallLimit,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_class_maintainers_limit_reached() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Add curator groups to runtime
        for _ in 1..=MaxNumberOfMaintainersPerClass::get() {
            assert_ok!(add_curator_group(LEAD_ORIGIN));
        }

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // An attempt to create class with number of maintainers that exceeds runtime limit
        let create_class_result =
            create_simple_class(LEAD_ORIGIN, ClassType::MaintainersLimitReached);

        // Failure checked
        assert_failure(
            create_class_result,
            Error::<Runtime>::ClassMaintainersLimitReached,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_class_curator_group_does_not_exist() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // An attempt to create class with curator group maintainer, which does not exist in runtime
        let create_class_result =
            create_simple_class(LEAD_ORIGIN, ClassType::CuratorGroupDoesNotExist);

        // Failure checked
        assert_failure(
            create_class_result,
            Error::<Runtime>::CuratorGroupDoesNotExist,
            number_of_events_before_call,
        );
    })
}
