use super::*;

#[test]
fn transaction_success() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Create single reference property
        let property_type_reference =
            SingleValuePropertyType(Type::Reference(FIRST_CLASS_ID, true));
        let property = Property::<Runtime>::with_name_and_type(
            PropertyNameLengthConstraint::get().max() as usize,
            PropertyType::Single(property_type_reference),
        );

        // Add Schema to the Class
        assert_ok!(add_class_schema(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::new(),
            vec![property]
        ));

        let operations = vec![
            OperationType::CreateEntity(CreateEntityOperation {
                class_id: FIRST_CLASS_ID,
            }),
            OperationType::AddSchemaSupportToEntity(AddSchemaSupportToEntityOperation {
                entity_id: ParameterizedEntity::InternalEntityJustAdded(0), // index 0 (prior operation)
                schema_id: 0,
                parametrized_property_values: vec![ParametrizedClassPropertyValue {
                    in_class_index: 0,
                    value: ParametrizedPropertyValue::InternalEntityJustAdded(0),
                }],
            }),
            OperationType::CreateEntity(CreateEntityOperation {
                class_id: FIRST_CLASS_ID,
            }),
            OperationType::UpdatePropertyValues(UpdatePropertyValuesOperation {
                entity_id: ParameterizedEntity::InternalEntityJustAdded(0), // index 0 (prior operation)
                new_parametrized_property_values: vec![ParametrizedClassPropertyValue {
                    in_class_index: 0,
                    value: ParametrizedPropertyValue::InternalEntityJustAdded(2),
                }],
            }),
        ];

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_calls = System::events().len();

        let actor = Actor::Lead;

        // Number of operations to be performed
        let operations_count = operations.len();

        // Complete transaction
        assert_ok!(transaction(LEAD_ORIGIN, actor.clone(), operations));

        // Runtime tested state after call

        let entity_ownership_transfered_event =
            get_test_event(RawEvent::TransactionCompleted(actor));

        // Last event checked
        assert_event_success(
            entity_ownership_transfered_event,
            number_of_events_before_calls + operations_count + 1,
        );
    })
}
