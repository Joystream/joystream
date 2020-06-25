use super::*;

#[test]
fn transfer_entity_ownership_success() {
    with_test_externalities(|| {
        // Create class with default permissions
        assert_ok!(create_simple_class_with_default_permissions(LEAD_ORIGIN));

        let actor = Actor::Lead;

        // Create entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

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
        assert_event_success(
            entity_ownership_transfered_event,
            number_of_events_before_calls + 1,
        );
    })
}
