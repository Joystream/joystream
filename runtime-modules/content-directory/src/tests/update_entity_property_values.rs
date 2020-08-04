use super::*;

#[test]
fn update_entity_property_values_success() {
    with_test_externalities(|| {
        let actor = Actor::Lead;

        // Add entity schemas support
        let (mut first_entity, mut second_entity) = add_entity_schemas_support();

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_calls = System::events().len();

        let mut second_schema_new_property_values = BTreeMap::new();
        let second_schema_new_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![SECOND_ENTITY_ID, SECOND_ENTITY_ID]);

        second_schema_new_property_values
            .insert(SECOND_PROPERTY_ID, second_schema_new_property_value.clone());

        // Update entity property values
        assert_ok!(update_entity_property_values(
            LEAD_ORIGIN,
            actor.clone(),
            FIRST_ENTITY_ID,
            second_schema_new_property_values
        ));

        // Runtime tested state after call

        // Ensure first entity properties updated succesfully
        if let Some(second_schema_old_property_value) =
            first_entity.get_values_mut().get_mut(&SECOND_PROPERTY_ID)
        {
            second_schema_old_property_value.update(second_schema_new_property_value.into());
        }

        assert_eq!(first_entity, entity_by_id(FIRST_ENTITY_ID));

        // Ensure reference counter of second entity updated succesfully
        let inbound_rc = InboundReferenceCounter::new(2, true);
        *second_entity.get_reference_counter_mut() = inbound_rc;

        assert_eq!(second_entity, entity_by_id(SECOND_ENTITY_ID));

        // Create side-effect
        let side_effect = EntityReferenceCounterSideEffect::atomic(true, DeltaMode::Decrement);
        let mut side_effects = ReferenceCounterSideEffects::default();
        side_effects.insert(SECOND_ENTITY_ID, side_effect);

        let entity_property_values_updated_event = get_test_event(
            RawEvent::EntityPropertyValuesUpdated(actor, FIRST_ENTITY_ID, Some(side_effects)),
        );

        // Last event checked
        assert_event_success(
            entity_property_values_updated_event,
            number_of_events_before_calls + 1,
        );
    })
}

#[test]
fn update_entity_property_values_entity_not_found() {
    with_test_externalities(|| {
        let actor = emulate_entity_access_state_for_failure_case(
            EntityAccessStateFailureType::EntityNotFound,
        );

        // Create class reference schema
        add_class_reference_schema();

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![FIRST_ENTITY_ID, FIRST_ENTITY_ID]);

        schema_new_property_values.insert(FIRST_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values in case when corresponding Entity does not exist
        let update_entity_property_values_result = update_entity_property_values(
            LEAD_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_ENTITY_NOT_FOUND,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_property_values_lead_auth_failed() {
    with_test_externalities(|| {
        let actor = emulate_entity_access_state_for_failure_case(
            EntityAccessStateFailureType::LeadAuthFailed,
        );

        // Create class reference schema and add corresponding schema support to the Entity
        add_class_reference_schema_and_entity_schema_support(&actor, LEAD_ORIGIN);

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![FIRST_ENTITY_ID, FIRST_ENTITY_ID]);

        schema_new_property_values.insert(FIRST_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values using unknown origin and lead actor
        let update_entity_property_values_result = update_entity_property_values(
            UNKNOWN_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_LEAD_AUTH_FAILED,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_property_values_member_auth_failed() {
    with_test_externalities(|| {
        let actor = emulate_entity_access_state_for_failure_case(
            EntityAccessStateFailureType::MemberAuthFailed,
        );

        // Create class reference schema and add corresponding schema support to the Entity
        add_class_reference_schema_and_entity_schema_support(&actor, LEAD_ORIGIN);

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![FIRST_ENTITY_ID, FIRST_ENTITY_ID]);

        schema_new_property_values.insert(FIRST_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values using unknown origin and member actor
        let update_entity_property_values_result = update_entity_property_values(
            UNKNOWN_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_MEMBER_AUTH_FAILED,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_property_values_curator_group_is_not_active() {
    with_test_externalities(|| {
        let actor = emulate_entity_access_state_for_failure_case(
            EntityAccessStateFailureType::CuratorAuthFailed,
        );

        // Create class reference schema and add corresponding schema support to the Entity
        add_class_reference_schema_and_entity_schema_support(
            &Actor::Curator(FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID),
            FIRST_CURATOR_ORIGIN,
        );

        // Make curator group inactive to block it from any entity operations
        assert_ok!(set_curator_group_status(
            LEAD_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            false
        ));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![FIRST_ENTITY_ID, FIRST_ENTITY_ID]);

        schema_new_property_values.insert(FIRST_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values using curator group, which is not active as actor
        let update_entity_property_values_result = update_entity_property_values(
            FIRST_CURATOR_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_CURATOR_GROUP_IS_NOT_ACTIVE,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_property_values_curator_auth_failed() {
    with_test_externalities(|| {
        let actor = emulate_entity_access_state_for_failure_case(
            EntityAccessStateFailureType::CuratorAuthFailed,
        );

        // Create class reference schema and add corresponding schema support to the Entity
        add_class_reference_schema_and_entity_schema_support(
            &Actor::Curator(FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID),
            FIRST_CURATOR_ORIGIN,
        );

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![FIRST_ENTITY_ID, FIRST_ENTITY_ID]);

        schema_new_property_values.insert(FIRST_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values using unknown origin and curator actor
        let update_entity_property_values_result = update_entity_property_values(
            UNKNOWN_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_CURATOR_AUTH_FAILED,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_property_values_curator_not_found_in_curator_group() {
    with_test_externalities(|| {
        let actor = emulate_entity_access_state_for_failure_case(
            EntityAccessStateFailureType::CuratorNotFoundInCuratorGroup,
        );

        // Create class reference schema and add corresponding schema support to the Entity
        add_class_reference_schema_and_entity_schema_support(
            &Actor::Curator(FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID),
            FIRST_CURATOR_ORIGIN,
        );

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![FIRST_ENTITY_ID, FIRST_ENTITY_ID]);

        schema_new_property_values.insert(FIRST_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values using actor in group, which curator id was not added to corresponding group set
        let update_entity_property_values_result = update_entity_property_values(
            SECOND_CURATOR_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_CURATOR_IS_NOT_A_MEMBER_OF_A_GIVEN_CURATOR_GROUP,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_property_values_entity_access_denied() {
    with_test_externalities(|| {
        let actor = emulate_entity_access_state_for_failure_case(
            EntityAccessStateFailureType::EntityAccessDenied,
        );

        // Create class reference schema and add corresponding schema support to the Entity
        add_class_reference_schema_and_entity_schema_support(&Actor::Lead, LEAD_ORIGIN);

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![FIRST_ENTITY_ID, FIRST_ENTITY_ID]);

        schema_new_property_values.insert(FIRST_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values using actor in group,
        // using origin, which corresponding actor is neither entity maintainer, nor controller.
        let update_entity_property_values_result = update_entity_property_values(
            SECOND_CURATOR_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_ENTITY_ACCESS_DENIED,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_property_values_locked_on_class_level() {
    with_test_externalities(|| {
        let actor = emulate_entity_access_state_for_failure_case(
            EntityAccessStateFailureType::PropertyValuesLocked,
        );

        // Create class reference schema and add corresponding schema support to the Entity
        add_class_reference_schema_and_entity_schema_support(&Actor::Lead, LEAD_ORIGIN);

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![FIRST_ENTITY_ID, FIRST_ENTITY_ID]);

        schema_new_property_values.insert(FIRST_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values using actor in group,
        // in the case, when all property values were locked on Class level.
        let update_entity_property_values_result = update_entity_property_values(
            LEAD_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_ALL_PROP_WERE_LOCKED_ON_CLASS_LEVEL,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_property_values_is_locked_for_given_actor() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Create property
        let property_type = PropertyType::<Runtime>::vec_reference(FIRST_CLASS_ID, true, 5);

        let mut property = Property::<Runtime>::with_name_and_type(
            (PropertyNameLengthConstraint::get().max() - 1) as usize,
            property_type,
            true,
            false,
        );

        property.locking_policy = PropertyLockingPolicy::new(false, true);

        // Add Schema to the Class
        assert_ok!(add_class_schema(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::new(),
            vec![property]
        ));

        let actor = Actor::Lead;

        // Create second entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        let schema_property_value = InputPropertyValue::<Runtime>::vec_reference(vec![
            FIRST_ENTITY_ID,
            FIRST_ENTITY_ID,
            FIRST_ENTITY_ID,
        ]);

        let mut schema_property_values = BTreeMap::new();
        schema_property_values.insert(FIRST_PROPERTY_ID, schema_property_value);

        // Add schema support to the entity
        assert_ok!(add_schema_support_to_entity(
            LEAD_ORIGIN,
            actor.clone(),
            FIRST_ENTITY_ID,
            FIRST_SCHEMA_ID,
            schema_property_values
        ));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![FIRST_ENTITY_ID, FIRST_ENTITY_ID]);

        schema_new_property_values.insert(FIRST_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values
        // under lead origin, which is current Entity controller, in the case,
        // when corresponding class Property was locked from controller on Class level
        let update_entity_property_values_result = update_entity_property_values(
            LEAD_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_CLASS_PROPERTY_TYPE_IS_LOCKED_FOR_GIVEN_ACTOR,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_property_values_unknown_entity_property_id() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        let actor = Actor::Lead;

        // Create entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        // Create class reference schema and add corresponding schema support to the Entity
        add_class_reference_schema_and_entity_schema_support(&actor, LEAD_ORIGIN);

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value =
            InputPropertyValue::<Runtime>::vec_reference(vec![FIRST_ENTITY_ID, FIRST_ENTITY_ID]);

        schema_new_property_values.insert(SECOND_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values in the case, when Property
        // under corresponding property id was not added to the current Entity yet
        let update_entity_property_values_result = update_entity_property_values(
            LEAD_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_UNKNOWN_ENTITY_PROP_ID,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_property_values_prop_value_do_not_match_type() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        let actor = Actor::Lead;

        // Create entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        // Create class reference schema and add corresponding schema support to the Entity
        add_class_reference_schema_and_entity_schema_support(&actor, LEAD_ORIGIN);

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value = InputPropertyValue::<Runtime>::default();

        schema_new_property_values.insert(FIRST_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values in the case, providing property values,
        // some of which do not match Class level Property Type
        let update_entity_property_values_result = update_entity_property_values(
            LEAD_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_PROP_VALUE_DONT_MATCH_TYPE,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_property_values_vec_prop_is_too_long() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        let actor = Actor::Lead;

        // Create entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        // Create class reference schema and add corresponding schema support to the Entity
        add_class_reference_schema_and_entity_schema_support(&actor, LEAD_ORIGIN);

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value = InputPropertyValue::<Runtime>::vec_reference(vec![
                FIRST_ENTITY_ID;
                VecMaxLengthConstraint::get() as usize + 1
            ]);

        schema_new_property_values.insert(FIRST_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values providing vector property value(s), which
        // length exceeds VecMaxLengthConstraint.
        let update_entity_property_values_result = update_entity_property_values(
            LEAD_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_VEC_PROP_IS_TOO_LONG,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_property_values_text_prop_is_too_long() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        let actor = Actor::Lead;

        // Create entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.to_owned()));

        // Create text property
        let property_type = PropertyType::<Runtime>::single_text(TextMaxLengthConstraint::get());

        let property = Property::<Runtime>::with_name_and_type(
            PropertyNameLengthConstraint::get().max() as usize,
            property_type,
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

        let mut schema_property_values = BTreeMap::new();

        let schema_property_value =
            InputPropertyValue::<Runtime>::single_text(TextMaxLengthConstraint::get());

        schema_property_values.insert(FIRST_PROPERTY_ID, schema_property_value);

        // Add schema support to the entity
        assert_ok!(add_schema_support_to_entity(
            LEAD_ORIGIN,
            actor.to_owned(),
            FIRST_ENTITY_ID,
            FIRST_SCHEMA_ID,
            schema_property_values
        ));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value =
            InputPropertyValue::<Runtime>::single_text(TextMaxLengthConstraint::get() + 1);

        schema_new_property_values.insert(FIRST_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values providing text property value(s), which
        // length exceeds TextMaxLengthConstraint.
        let update_entity_property_values_result = update_entity_property_values(
            LEAD_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_TEXT_PROP_IS_TOO_LONG,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_property_values_hashed_text_prop_is_too_long() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        let actor = Actor::Lead;

        // Create entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.to_owned()));

        let hashed_text_max_length_constraint = HashedTextMaxLengthConstraint::get();

        // Create hash property
        let property_type =
            PropertyType::<Runtime>::single_text_hash(hashed_text_max_length_constraint);

        let property = Property::<Runtime>::with_name_and_type(
            PropertyNameLengthConstraint::get().max() as usize,
            property_type,
            true,
            false,
        );

        // Add Schema to the first Class
        assert_ok!(add_class_schema(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::new(),
            vec![property]
        ));

        let mut schema_property_values = BTreeMap::new();

        let schema_property_value = InputPropertyValue::<Runtime>::single_text_to_hash(
            hashed_text_max_length_constraint.unwrap(),
        );

        schema_property_values.insert(FIRST_PROPERTY_ID, schema_property_value);

        // Add schema support to the entity
        assert_ok!(add_schema_support_to_entity(
            LEAD_ORIGIN,
            actor.clone(),
            FIRST_ENTITY_ID,
            FIRST_SCHEMA_ID,
            schema_property_values,
        ));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value = InputPropertyValue::<Runtime>::single_text_to_hash(
            hashed_text_max_length_constraint.unwrap() + 1,
        );

        schema_new_property_values.insert(FIRST_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values providing text to hash property value(s), which
        // length exceeds length exceeds HashedTextMaxLengthConstraint.
        let update_entity_property_values_result = update_entity_property_values(
            LEAD_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_HASHED_TEXT_PROP_IS_TOO_LONG,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_property_values_referenced_entity_not_found() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        let actor = Actor::Lead;

        // Create entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        // Create class reference schema and add corresponding schema support to the Entity
        add_class_reference_schema_and_entity_schema_support(&actor, LEAD_ORIGIN);

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value = InputPropertyValue::<Runtime>::vec_reference(vec![
                SECOND_ENTITY_ID;
                VecMaxLengthConstraint::get() as usize
            ]);

        schema_new_property_values.insert(FIRST_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values, providing new property value(s),
        // some of which refer(s) to another Entity, which does not exist in runtime
        let update_entity_property_values_result = update_entity_property_values(
            LEAD_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_ENTITY_NOT_FOUND,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_property_values_referenced_entity_does_not_match_its_class() {
    with_test_externalities(|| {
        // Create first class
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Create second class
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        let actor = Actor::Lead;

        // Create first entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        // Create class reference schema and add corresponding schema support to the first Entity
        add_class_reference_schema_and_entity_schema_support(&actor, LEAD_ORIGIN);

        // Create second entity
        assert_ok!(create_entity(LEAD_ORIGIN, SECOND_CLASS_ID, actor.clone()));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value = InputPropertyValue::<Runtime>::vec_reference(vec![
                SECOND_ENTITY_ID;
                VecMaxLengthConstraint::get() as usize
            ]);

        schema_new_property_values.insert(FIRST_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values, when provided schema new property value(s)
        // refer(s) Entity, which Class does not match the class in corresponding Class Property
        let update_entity_property_values_result = update_entity_property_values(
            LEAD_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_REFERENCED_ENTITY_DOES_NOT_MATCH_ITS_CLASS,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_property_values_entity_can_not_be_referenced() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        let actor = Actor::Lead;

        // Create first Entity of first Class
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        // Create class reference schema and add corresponding schema support to the first Entity
        add_class_reference_schema_and_entity_schema_support(&actor, LEAD_ORIGIN);

        // Create second Entity of first Class
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        // Update second entity permissions to forbid it from being referencable
        assert_ok!(update_entity_permissions(
            LEAD_ORIGIN,
            SECOND_ENTITY_ID,
            None,
            Some(false)
        ));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value = InputPropertyValue::<Runtime>::vec_reference(vec![
                SECOND_ENTITY_ID;
                VecMaxLengthConstraint::get() as usize
            ]);

        schema_new_property_values.insert(FIRST_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values, when provided schema new property value(s)
        // refer(s) to Entity which can not be referenced
        let update_entity_property_values_result = update_entity_property_values(
            LEAD_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_ENTITY_CAN_NOT_BE_REFERENCED,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_property_values_same_controller_constraint_violation() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

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

        // Create first Entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        // Create class reference schema and add corresponding schema support to the first  Entity
        add_class_reference_schema_and_entity_schema_support(&actor, LEAD_ORIGIN);

        // Create second Entity
        assert_ok!(create_entity(
            FIRST_MEMBER_ORIGIN,
            FIRST_CLASS_ID,
            Actor::Member(FIRST_MEMBER_ID)
        ));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut schema_new_property_values = BTreeMap::new();
        let schema_new_property_value = InputPropertyValue::<Runtime>::vec_reference(vec![
                SECOND_ENTITY_ID;
                VecMaxLengthConstraint::get() as usize
            ]);

        schema_new_property_values.insert(FIRST_PROPERTY_ID, schema_new_property_value);

        // Make an attempt to update entity property values, providing new reference property value(s) in case,
        // when corresponding Entity can only be referenced from Entity with the same controller.
        let update_entity_property_values_result = update_entity_property_values(
            LEAD_ORIGIN,
            actor,
            FIRST_ENTITY_ID,
            schema_new_property_values,
        );

        // Failure checked
        assert_failure(
            update_entity_property_values_result,
            ERROR_SAME_CONTROLLER_CONSTRAINT_VIOLATION,
            number_of_events_before_call,
        );
    })
}

// #[test]
// fn update_entity_property_values_property_should_be_unique() {
//     with_test_externalities(|| {
//         // Create class with default permissions
//         assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

//         let actor = Actor::Lead;

//         // Create first Entity
//         assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

//         // Create class reference schema and add corresponding schema support to the Entity
//         add_class_reference_schema_and_entity_schema_support(&actor, LEAD_ORIGIN);

//         // Create second property with unique constraint
//         let property_type = PropertyType::<Runtime>::vec_reference(
//             FIRST_CLASS_ID,
//             true,
//             VecMaxLengthConstraint::get(),
//         );

//         let property = Property::<Runtime>::with_name_and_type(
//             PropertyNameLengthConstraint::get().max() as usize,
//             property_type,
//             true,
//             true,
//         );

//         // Add second Schema to the Class
//         assert_ok!(add_class_schema(
//             LEAD_ORIGIN,
//             FIRST_CLASS_ID,
//             BTreeSet::new(),
//             vec![property]
//         ));

//         let schema_property_value = InputPropertyValue::<Runtime>::vec_reference(vec![
//             FIRST_ENTITY_ID,
//             FIRST_ENTITY_ID,
//             FIRST_ENTITY_ID,
//         ]);

//         let mut schema_property_values = BTreeMap::new();
//         schema_property_values.insert(SECOND_PROPERTY_ID, schema_property_value);

//         // Add schema support to the entity
//         assert_ok!(add_schema_support_to_entity(
//             LEAD_ORIGIN,
//             actor.to_owned(),
//             FIRST_ENTITY_ID,
//             SECOND_SCHEMA_ID,
//             schema_property_values
//         ));

//         // Runtime state before tested call

//         // Events number before tested call
//         let number_of_events_before_call = System::events().len();

//         let mut schema_new_property_values = BTreeMap::new();
//         let schema_new_property_value =
//             InputPropertyValue::<Runtime>::vec_reference(vec![FIRST_ENTITY_ID, FIRST_ENTITY_ID]);

//         schema_new_property_values.insert(SECOND_PROPERTY_ID, schema_new_property_value);

//         // Make an attempt to update entity property values, providing property value(s), which are identical to thouse,
//         // are already added to The Entity, though should be unique on Class Property level
//         let update_entity_property_values_result = update_entity_property_values(
//             LEAD_ORIGIN,
//             actor,
//             FIRST_ENTITY_ID,
//             schema_new_property_values,
//         );

//         // Failure checked
//         assert_failure(
//             update_entity_property_values_result,
//             ERROR_PROPERTY_VALUE_SHOULD_BE_UNIQUE,
//             number_of_events_before_call,
//         );
//     })
// }
