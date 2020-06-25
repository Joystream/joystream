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
            PropertyValue::<Runtime>::vec_reference(vec![SECOND_ENTITY_ID, SECOND_ENTITY_ID]);

        second_schema_new_property_values
            .insert(SECOND_PROPERTY_ID, second_schema_new_property_value.clone());

        // Update first entity property values
        assert_ok!(update_entity_property_values(
            LEAD_ORIGIN,
            actor.clone(),
            FIRST_ENTITY_ID,
            second_schema_new_property_values.clone()
        ));

        // Runtime tested state after call

        // Ensure first entity properties updated succesfully
        if let Some(second_schema_old_property_value) =
            first_entity.values.get_mut(&SECOND_PROPERTY_ID)
        {
            second_schema_old_property_value.update(second_schema_new_property_value);
        }

        assert_eq!(first_entity, entity_by_id(FIRST_ENTITY_ID));

        // Ensure reference counter of second entity updated succesfully
        let inbound_rc = InboundReferenceCounter::new(2, true);
        *second_entity.get_reference_counter_mut() = inbound_rc.clone();

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
