use super::*;

#[test]
fn update_class_schema_status_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        let property =
            Property::default_with_name(PropertyNameLengthConstraint::get().max() as usize);

        // Add class schema (default class schema active flag set true)
        assert_ok!(add_class_schema(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::new(),
            vec![property.clone()]
        ));

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_ok!(update_class_schema_status(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            FIRST_SCHEMA_ID,
            false
        ));

        // Runtime tested state after call

        // Ensure class schema status updated succesfully
        let mut class = create_class_with_default_permissions();
        let mut schema = Schema::new(BTreeSet::from_iter(vec![FIRST_PROPERTY_ID].into_iter()));

        schema.set_status(false);
        class.properties = vec![property];
        class.schemas = vec![schema];

        assert_eq!(class_by_id(FIRST_CLASS_ID), class);

        let class_schema_status_updated_event = get_test_event(RawEvent::ClassSchemaStatusUpdated(
            FIRST_CLASS_ID,
            FIRST_SCHEMA_ID,
            false,
        ));

        // Last event checked
        assert_event_success(
            class_schema_status_updated_event,
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn update_class_schema_status_lead_auth_failed() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        let property =
            Property::default_with_name(PropertyNameLengthConstraint::get().max() as usize);

        // Add class schema (default class schema active flag set true)
        assert_ok!(add_class_schema(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::new(),
            vec![property.clone()]
        ));

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // make an attempt to update class schema status under non lead origin
        let update_class_schema_status_result =
            update_class_schema_status(FIRST_MEMBER_ORIGIN, FIRST_CLASS_ID, FIRST_SCHEMA_ID, false);

        // Failure checked
        assert_failure(
            update_class_schema_status_result,
            ERROR_LEAD_AUTH_FAILED,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_class_schema_status_of_non_existent_class() {
    with_test_externalities(|| {
        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to update class schema status of non existent class
        let update_class_schema_status_result =
            update_class_schema_status(LEAD_ORIGIN, UNKNOWN_CLASS_ID, FIRST_SCHEMA_ID, false);

        // Failure checked
        assert_failure(
            update_class_schema_status_result,
            ERROR_CLASS_NOT_FOUND,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_class_schema_status_for_non_existent_schema() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        let property =
            Property::default_with_name(PropertyNameLengthConstraint::get().max() as usize);

        // Add class schema (default class schema active flag set true)
        assert_ok!(add_class_schema(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::new(),
            vec![property.clone()]
        ));

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to update  status of Schema, which does not exist in this Class yet.
        let update_class_schema_status_result =
            update_class_schema_status(LEAD_ORIGIN, FIRST_CLASS_ID, UNKNOWN_SCHEMA_ID, false);

        // Failure checked
        assert_failure(
            update_class_schema_status_result,
            ERROR_UNKNOWN_CLASS_SCHEMA_ID,
            number_of_events_before_call,
        );
    })
}
