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
