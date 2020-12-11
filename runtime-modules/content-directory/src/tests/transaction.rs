use super::*;

#[test]
fn transaction_success() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Create single reference property
        let property_type_reference = Type::Reference(FIRST_CLASS_ID, true);
        let property = Property::<ClassId>::with_name_and_type(
            PropertyNameLengthConstraint::get().max() as usize,
            PropertyType::Single(property_type_reference),
            true,
            false,
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

        let transaction_completed_event = get_test_event(RawEvent::TransactionCompleted(actor));

        // Last event checked
        assert_event(
            transaction_completed_event,
            number_of_events_before_calls + operations_count + 1,
        );
    })
}

#[test]
fn transaction_limit_reached() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        let operation = OperationType::CreateEntity(CreateEntityOperation {
            class_id: FIRST_CLASS_ID,
        });

        let operations =
            vec![operation; MaxNumberOfOperationsDuringAtomicBatching::get() as usize + 1];

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let actor = Actor::Lead;

        // Make an attempt to complete transaction with operations, which total number exceeds MaxNumberOfOperationsDuringAtomicBatching runtime constraint
        let transaction_result = transaction(LEAD_ORIGIN, actor, operations);

        // Failure checked
        assert_failure(
            transaction_result,
            Error::<Runtime>::NumberOfOperationsDuringAtomicBatchingLimitReached,
            number_of_events_before_call,
        );
    })
}

#[test]
fn transaction_failed() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        let operation = OperationType::CreateEntity(CreateEntityOperation {
            class_id: FIRST_CLASS_ID,
        });

        let failed_operation = OperationType::CreateEntity(CreateEntityOperation {
            class_id: UNKNOWN_CLASS_ID,
        });

        let operations = vec![
            operation.clone(),
            operation.clone(),
            failed_operation,
            operation,
        ];

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let actor = Actor::Lead;

        // Make an attempt to complete transaction with CreateEntity operation, when provided class_id does not exist on runtime level
        let transaction_result = transaction(LEAD_ORIGIN, actor, operations.clone());

        let failed_operation_index = 2;

        // Failure checked

        // Ensure  call result is equal to expected error
        assert_err!(transaction_result, Error::<Runtime>::ClassNotFound);

        let transaction_failed_event =
            get_test_event(RawEvent::TransactionFailed(actor, failed_operation_index));

        // Last event checked
        assert_event(
            transaction_failed_event,
            // two operations succeded and one TransactionFailed event
            number_of_events_before_call + operations[..failed_operation_index as usize].len() + 1,
        );
    })
}
