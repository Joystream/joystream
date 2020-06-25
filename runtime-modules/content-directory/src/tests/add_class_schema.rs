use super::*;

#[test]
fn add_class_schema_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        let first_property =
            Property::default_with_name(PropertyNameLengthConstraint::get().max() as usize);

        let second_property =
            Property::default_with_name((PropertyNameLengthConstraint::get().max() - 1) as usize);

        // Add first class schema
        assert_ok!(add_class_schema(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::new(),
            vec![first_property.clone()]
        ));

        // Add second class schema
        assert_ok!(add_class_schema(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::from_iter(vec![FIRST_PROPERTY_ID].into_iter()),
            vec![second_property.clone()]
        ));

        // Runtime tested state after call

        // Ensure class schemas added succesfully
        let mut class = create_class_with_default_permissions();

        class.properties = vec![first_property, second_property];
        class.schemas = vec![
            Schema::new(BTreeSet::from_iter(vec![FIRST_PROPERTY_ID].into_iter())),
            Schema::new(BTreeSet::from_iter(
                vec![FIRST_PROPERTY_ID, SECOND_PROPERTY_ID].into_iter(),
            )),
        ];

        assert_eq!(class_by_id(FIRST_CLASS_ID), class);

        let class_schema_added_event =
            get_test_event(RawEvent::ClassSchemaAdded(FIRST_CLASS_ID, SECOND_SCHEMA_ID));

        // Last event checked
        assert_event_success(class_schema_added_event, number_of_events_before_call + 2);
    })
}
