use super::*;

#[test]
fn remove_entity_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        let actor = Actor::Lead;

        // Create entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Remove entity
        assert_ok!(remove_entity(LEAD_ORIGIN, actor.clone(), FIRST_ENTITY_ID));

        // Runtime tested state after call

        // Ensure entity under corresponding id was succesfully removed from runtime storage
        assert!(!entity_exists(FIRST_ENTITY_ID));

        // Ensure number of entities_created under respective entity creation voucher decremented succesfully.
        let entity_voucher = EntityCreationVoucher::new(IndividualEntitiesCreationLimit::get());

        let entity_controller = EntityController::from_actor(&actor);

        assert_eq!(
            entity_creation_vouchers(FIRST_CLASS_ID, &entity_controller),
            entity_voucher.clone(),
        );

        let entity_removed_event =
            get_test_event(RawEvent::EntityRemoved(actor, next_entity_id() - 1));

        // Last event checked
        assert_event_success(entity_removed_event, number_of_events_before_call + 1);
    })
}
