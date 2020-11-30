use super::*;

#[test]
fn transfer_entity_ownership_success() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        let actor = Actor::Lead;

        // Create entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_calls = System::events().len();

        // Used to ensure controller changed succesfully
        let mut entity = entity_by_id(FIRST_ENTITY_ID);

        let new_controller = EntityController::Member(FIRST_MEMBER_ID);

        // Ensure Entity controller set to EntityController::Lead
        assert!(entity
            .get_permissions_ref()
            .controller_is_equal_to(&EntityController::Lead));

        // Transfer entity ownership to new controller
        assert_ok!(transfer_entity_ownership(
            LEAD_ORIGIN,
            FIRST_ENTITY_ID,
            new_controller.clone(),
            // Given entity does not have property references with same_owner flag set
            BTreeMap::new()
        ));

        // Runtime tested state after call

        // Ensure Entity controller changed to the new_controller
        entity
            .get_permissions_mut()
            .set_conroller(new_controller.clone());

        assert!(entity
            .get_permissions_ref()
            .controller_is_equal_to(&new_controller));

        let entity_ownership_transfered_event = get_test_event(
            RawEvent::EntityOwnershipTransfered(FIRST_ENTITY_ID, new_controller, None),
        );

        // Last event checked
        assert_event(
            entity_ownership_transfered_event,
            number_of_events_before_calls + 1,
        );
    })
}

#[test]
fn transfer_entity_ownership_lead_auth_failed() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        let actor = Actor::Lead;

        // Create entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let new_controller = EntityController::Member(FIRST_MEMBER_ID);

        // Make an attempt to transfer entity ownership to new controller under non lead origin
        let transfer_entity_ownership_result = transfer_entity_ownership(
            UNKNOWN_ORIGIN,
            FIRST_ENTITY_ID,
            new_controller,
            // Given entity does not have property references with same_owner flag set
            BTreeMap::new(),
        );

        // Failure checked
        assert_failure(
            transfer_entity_ownership_result,
            Error::<Runtime>::LeadAuthFailed,
            number_of_events_before_call,
        );
    })
}

#[test]
fn transfer_entity_ownership_entity_not_found() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let new_controller = EntityController::Member(FIRST_MEMBER_ID);

        // Make an attempt to transfer entity ownership of non existent Entity
        let transfer_entity_ownership_result = transfer_entity_ownership(
            LEAD_ORIGIN,
            FIRST_ENTITY_ID,
            new_controller,
            // Given entity does not have property references with same_owner flag set
            BTreeMap::new(),
        );

        // Failure checked
        assert_failure(
            transfer_entity_ownership_result,
            Error::<Runtime>::EntityNotFound,
            number_of_events_before_call,
        );
    })
}

#[test]
fn transfer_entity_ownership_provided_entity_controller_is_equal_to_the_current_one() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        let actor = Actor::Lead;

        // Create entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let new_controller = EntityController::Lead;

        // Make an attempt to transfer entity ownership, providing new Entity controller, which is equal to the current one
        let transfer_entity_ownership_result = transfer_entity_ownership(
            LEAD_ORIGIN,
            FIRST_ENTITY_ID,
            new_controller,
            // Given entity does not have property references with same_owner flag set
            BTreeMap::new(),
        );

        // Failure checked
        assert_failure(
            transfer_entity_ownership_result,
            Error::<Runtime>::ProvidedEntityControllerIsEqualToTheCurrentOne,
            number_of_events_before_call,
        );
    })
}

#[test]
fn transfer_entity_ownership_inbound_same_owner_rc_does_not_equal_to_zero() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        add_unique_class_reference_schema();

        let actor = Actor::Lead;

        // Create first entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        // Create second entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        let schema_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![FIRST_ENTITY_ID, FIRST_ENTITY_ID]);

        let mut schema_property_values = BTreeMap::new();
        schema_property_values.insert(FIRST_PROPERTY_ID, schema_property_value);

        // Add schema support to the second Entity
        assert_ok!(add_schema_support_to_entity(
            LEAD_ORIGIN,
            actor,
            SECOND_ENTITY_ID,
            FIRST_SCHEMA_ID,
            schema_property_values
        ));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let new_controller = EntityController::Member(FIRST_MEMBER_ID);

        // Make an attempt to transfer ownership of Entity, which is referenced by property values
        // of another entities with same owner flag set
        let transfer_entity_ownership_result = transfer_entity_ownership(
            LEAD_ORIGIN,
            FIRST_ENTITY_ID,
            new_controller,
            // Given entity does not have property references with same_owner flag set
            BTreeMap::new(),
        );

        // Failure checked
        assert_failure(
            transfer_entity_ownership_result,
            Error::<Runtime>::EntityInboundSameOwnerRcDoesNotEqualToZero,
            number_of_events_before_call,
        );
    })
}

#[test]
fn transfer_entity_ownership_provided_property_value_ids_must_be_references_with_same_owner_flag_set(
) {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        add_unique_class_reference_schema();

        // Update class permissions to force any member be available to create Entities
        assert_ok!(update_class_permissions(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            Some(true),
            None,
            None,
            None
        ));

        let actor = Actor::Lead;

        // Create first entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        // Create second entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        let schema_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![SECOND_ENTITY_ID, SECOND_ENTITY_ID]);

        let mut schema_property_values = BTreeMap::new();
        schema_property_values.insert(FIRST_PROPERTY_ID, schema_property_value);

        // Add schema support to the second Entity
        assert_ok!(add_schema_support_to_entity(
            LEAD_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            FIRST_SCHEMA_ID,
            schema_property_values
        ));

        // Create third entity
        assert_ok!(create_entity(
            FIRST_MEMBER_ORIGIN,
            FIRST_CLASS_ID,
            Actor::Member(FIRST_MEMBER_ID)
        ));

        let new_controller = EntityController::Member(FIRST_MEMBER_ID);

        let schema_property_value = InputPropertyValue::<Runtime>::vec_reference(vec![
            THIRD_ENTITY_ID,
            THIRD_ENTITY_ID,
            THIRD_ENTITY_ID,
        ]);

        let mut schema_property_values = BTreeMap::new();
        schema_property_values.insert(SECOND_PROPERTY_ID, schema_property_value);

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to transfer ownership of Entity, providing new property value references with same owner flag set,
        // which respective property ids are not references with same owner flag set on Class Property level
        let transfer_entity_ownership_result = transfer_entity_ownership(
            LEAD_ORIGIN,
            FIRST_ENTITY_ID,
            new_controller,
            schema_property_values,
        );

        // Failure checked
        assert_failure(
            transfer_entity_ownership_result,
            Error::<Runtime>::AllProvidedPropertyValueIdsMustBeReferencesWithSameOwnerFlagSet,
            number_of_events_before_call,
        );
    })
}

#[test]
fn transfer_entity_ownership_provided_new_property_value_referencing_entity_that_can_not_be_referenced(
) {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        add_unique_class_reference_schema();

        // Update class permissions to force any member be available to create Entities
        assert_ok!(update_class_permissions(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            Some(true),
            None,
            None,
            None
        ));

        let actor = Actor::Lead;

        // Create first entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        // Create second entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        let schema_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![SECOND_ENTITY_ID, SECOND_ENTITY_ID]);

        let mut schema_property_values = BTreeMap::new();
        schema_property_values.insert(FIRST_PROPERTY_ID, schema_property_value);

        // Add schema support to the second Entity
        assert_ok!(add_schema_support_to_entity(
            LEAD_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            FIRST_SCHEMA_ID,
            schema_property_values
        ));

        // Create third entity
        assert_ok!(create_entity(
            FIRST_MEMBER_ORIGIN,
            FIRST_CLASS_ID,
            Actor::Member(FIRST_MEMBER_ID)
        ));

        // Update third entity permissions to forbid it from being referencable
        assert_ok!(update_entity_permissions(
            LEAD_ORIGIN,
            THIRD_ENTITY_ID,
            None,
            Some(false)
        ));

        let new_controller = EntityController::Member(FIRST_MEMBER_ID);

        let schema_property_value = InputPropertyValue::<Runtime>::vec_reference(vec![
            THIRD_ENTITY_ID,
            THIRD_ENTITY_ID,
            THIRD_ENTITY_ID,
        ]);

        let mut schema_property_values = BTreeMap::new();
        schema_property_values.insert(FIRST_PROPERTY_ID, schema_property_value);

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to transfer ownership of Entity, providing new property value reference(s) with same owner flag set,
        // which refer(s) Entity, that can not be referenced
        let transfer_entity_ownership_result = transfer_entity_ownership(
            LEAD_ORIGIN,
            FIRST_ENTITY_ID,
            new_controller,
            schema_property_values,
        );

        // Failure checked
        assert_failure(
            transfer_entity_ownership_result,
            Error::<Runtime>::EntityCanNotBeReferenced,
            number_of_events_before_call,
        );
    })
}

#[test]
fn transfer_entity_ownership_provided_new_property_value_referencing_non_existent_entity() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        add_unique_class_reference_schema();

        let actor = Actor::Lead;

        // Create first entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        // Create second entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        let schema_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![SECOND_ENTITY_ID, SECOND_ENTITY_ID]);

        let mut schema_property_values = BTreeMap::new();
        schema_property_values.insert(FIRST_PROPERTY_ID, schema_property_value);

        // Add schema support to the second Entity
        assert_ok!(add_schema_support_to_entity(
            LEAD_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            FIRST_SCHEMA_ID,
            schema_property_values
        ));

        let new_controller = EntityController::Member(FIRST_MEMBER_ID);

        let schema_property_value = InputPropertyValue::<Runtime>::vec_reference(vec![
            THIRD_ENTITY_ID,
            THIRD_ENTITY_ID,
            THIRD_ENTITY_ID,
        ]);

        let mut schema_property_values = BTreeMap::new();
        schema_property_values.insert(FIRST_PROPERTY_ID, schema_property_value);

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to transfer ownership of Entity, providing new property value reference(s) with same owner flag set,
        // which refer(s) to Entity that does not exist
        let transfer_entity_ownership_result = transfer_entity_ownership(
            LEAD_ORIGIN,
            FIRST_ENTITY_ID,
            new_controller,
            schema_property_values,
        );

        // Failure checked
        assert_failure(
            transfer_entity_ownership_result,
            Error::<Runtime>::EntityNotFound,
            number_of_events_before_call,
        );
    })
}

#[test]
fn transfer_entity_ownership_provided_new_property_value_referencing_entity_controlled_by_another_actor(
) {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        add_unique_class_reference_schema();

        // Update class permissions to force any member be available to create Entities
        assert_ok!(update_class_permissions(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            Some(true),
            None,
            None,
            None
        ));

        let actor = Actor::Lead;

        // Create first entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        // Create second entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        let schema_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![SECOND_ENTITY_ID, SECOND_ENTITY_ID]);

        let mut schema_property_values = BTreeMap::new();
        schema_property_values.insert(FIRST_PROPERTY_ID, schema_property_value);

        // Add schema support to the second Entity
        assert_ok!(add_schema_support_to_entity(
            LEAD_ORIGIN,
            actor.to_owned(),
            FIRST_ENTITY_ID,
            FIRST_SCHEMA_ID,
            schema_property_values
        ));

        // Create third entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor));

        let new_controller = EntityController::Member(FIRST_MEMBER_ID);

        let schema_property_value = InputPropertyValue::<Runtime>::vec_reference(vec![
            THIRD_ENTITY_ID,
            THIRD_ENTITY_ID,
            THIRD_ENTITY_ID,
        ]);

        let mut schema_property_values = BTreeMap::new();
        schema_property_values.insert(FIRST_PROPERTY_ID, schema_property_value);

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to transfer ownership of Entity, providing new property value reference(s) with same owner flag set,
        // which refer(s) Entity, controlled by another actor
        let transfer_entity_ownership_result = transfer_entity_ownership(
            LEAD_ORIGIN,
            FIRST_ENTITY_ID,
            new_controller,
            schema_property_values,
        );

        // Failure checked
        assert_failure(
            transfer_entity_ownership_result,
            Error::<Runtime>::SameControllerConstraintViolation,
            number_of_events_before_call,
        );
    })
}

#[test]
fn transfer_entity_ownership_required_property_was_not_provided() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        add_unique_class_reference_schema();

        // Update class permissions to force any member be available to create Entities
        assert_ok!(update_class_permissions(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            Some(true),
            None,
            None,
            None
        ));

        let actor = Actor::Lead;

        // Create first entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        // Create second entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        let schema_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![SECOND_ENTITY_ID, SECOND_ENTITY_ID]);

        let mut schema_property_values = BTreeMap::new();
        schema_property_values.insert(FIRST_PROPERTY_ID, schema_property_value);

        // Add schema support to the second Entity
        assert_ok!(add_schema_support_to_entity(
            LEAD_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            FIRST_SCHEMA_ID,
            schema_property_values
        ));

        // Create third entity
        assert_ok!(create_entity(
            FIRST_MEMBER_ORIGIN,
            FIRST_CLASS_ID,
            Actor::Member(FIRST_MEMBER_ID)
        ));

        let new_controller = EntityController::Member(FIRST_MEMBER_ID);

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to transfer ownership of Entity without providing required
        // new property value references with same owner flag set
        let transfer_entity_ownership_result = transfer_entity_ownership(
            LEAD_ORIGIN,
            FIRST_ENTITY_ID,
            new_controller,
            BTreeMap::new(),
        );

        // Failure checked
        assert_failure(
            transfer_entity_ownership_result,
            Error::<Runtime>::MissingRequiredProperty,
            number_of_events_before_call,
        );
    })
}

#[test]
fn transfer_entity_ownership_unique_constraint_violation() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Create unique reference property with same_controller flag set
        let property_type = PropertyType::<ClassId>::vec_reference(
            FIRST_CLASS_ID,
            true,
            VecMaxLengthConstraint::get(),
        );

        let property = Property::<ClassId>::with_name_and_type(
            PropertyNameLengthConstraint::get().max() as usize,
            property_type,
            true,
            true,
        );

        // Add Schema to the Class
        assert_ok!(add_class_schema(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::new(),
            vec![property]
        ));

        // Update class permissions to force any member be available to create Entities
        assert_ok!(update_class_permissions(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            Some(true),
            None,
            None,
            None
        ));

        let actor = Actor::Lead;

        // Create first entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        // Create second entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        let first_schema_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![SECOND_ENTITY_ID, SECOND_ENTITY_ID]);

        let mut schema_property_values = BTreeMap::new();
        schema_property_values.insert(FIRST_PROPERTY_ID, first_schema_property_value);

        // Add schema support to the first Entity
        assert_ok!(add_schema_support_to_entity(
            LEAD_ORIGIN,
            actor.to_owned(),
            FIRST_ENTITY_ID,
            FIRST_SCHEMA_ID,
            schema_property_values
        ));

        let second_schema_property_value = InputPropertyValue::<Runtime>::vec_reference(vec![
            SECOND_ENTITY_ID,
            SECOND_ENTITY_ID,
            SECOND_ENTITY_ID,
        ]);

        let mut schema_property_values = BTreeMap::new();
        schema_property_values.insert(FIRST_PROPERTY_ID, second_schema_property_value);

        // Add schema support to the second Entity
        assert_ok!(add_schema_support_to_entity(
            LEAD_ORIGIN,
            actor,
            SECOND_ENTITY_ID,
            FIRST_SCHEMA_ID,
            schema_property_values
        ));

        // Create third entity
        assert_ok!(create_entity(
            FIRST_MEMBER_ORIGIN,
            FIRST_CLASS_ID,
            Actor::Member(FIRST_MEMBER_ID)
        ));

        let new_controller = EntityController::Member(FIRST_MEMBER_ID);

        let schema_property_value = InputPropertyValue::<Runtime>::vec_reference(vec![
            THIRD_ENTITY_ID,
            THIRD_ENTITY_ID,
            THIRD_ENTITY_ID,
        ]);

        let mut schema_property_values = BTreeMap::new();
        schema_property_values.insert(FIRST_PROPERTY_ID, schema_property_value);

        assert_ok!(transfer_entity_ownership(
            LEAD_ORIGIN,
            FIRST_ENTITY_ID,
            new_controller.clone(),
            schema_property_values.clone(),
        ));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to transfer ownership of Entity, providing new property value reference(s)
        // with same owner flag set, which are identical to thouse, are already added to the another Entity of this Class,
        // though should be unique on Class Property level
        let transfer_entity_ownership_result = transfer_entity_ownership(
            LEAD_ORIGIN,
            SECOND_ENTITY_ID,
            new_controller,
            schema_property_values,
        );

        // Failure checked
        assert_failure(
            transfer_entity_ownership_result,
            Error::<Runtime>::PropertyValueShouldBeUnique,
            number_of_events_before_call,
        );
    })
}
