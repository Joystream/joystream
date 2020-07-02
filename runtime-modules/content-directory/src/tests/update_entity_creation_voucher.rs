use super::*;

#[test]
fn create_entity_creation_voucher_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime state before tested call

        let entity_controller = EntityController::Member(FIRST_MEMBER_ID);
        assert!(!entity_creation_voucher_exists(
            FIRST_CLASS_ID,
            &entity_controller
        ));

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Create entities creation voucher for chosen controller
        assert_ok!(update_entity_creation_voucher(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            entity_controller.clone(),
            IndividualEntitiesCreationLimit::get()
        ));

        // Runtime tested state after call

        // Ensure entity creation voucher for chosen controller created succesfully
        let entity_voucher = EntityCreationVoucher::new(IndividualEntitiesCreationLimit::get());

        assert_eq!(
            entity_creation_vouchers(FIRST_CLASS_ID, &entity_controller),
            entity_voucher.clone(),
        );

        let entity_creation_voucher_created_event = get_test_event(
            RawEvent::EntityCreationVoucherCreated(entity_controller, entity_voucher),
        );

        // Last event checked
        assert_event_success(
            entity_creation_voucher_created_event,
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn update_entity_creation_voucher_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        let actor = Actor::Member(FIRST_MEMBER_ID);

        // Update class permissions to force any maintainer be available to create entities
        assert_ok!(update_class_permissions(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            Some(true),
            None,
            None,
            None
        ));

        let entity_controller = EntityController::from_actor(&actor);

        // Create entity
        assert_ok!(create_entity(FIRST_MEMBER_ORIGIN, FIRST_CLASS_ID, actor));

        // Runtime state before tested call

        let mut entity_creation_voucher =
            entity_creation_vouchers(FIRST_CLASS_ID, &entity_controller);

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Update entities creation voucher for chosen controller
        let new_maximum_entities_count = entity_creation_voucher.maximum_entities_count - 1;
        assert_ok!(update_entity_creation_voucher(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            entity_controller.clone(),
            new_maximum_entities_count
        ));

        // Runtime tested state after call

        // Ensure  entity creation voucher for chosen controller updated succesfully
        entity_creation_voucher.set_maximum_entities_count(new_maximum_entities_count);
        assert_eq!(
            entity_creation_vouchers(FIRST_CLASS_ID, &entity_controller),
            entity_creation_voucher.clone()
        );

        let entity_creation_voucher_created_event = get_test_event(
            RawEvent::EntityCreationVoucherUpdated(entity_controller, entity_creation_voucher),
        );

        // Last event checked
        assert_event_success(
            entity_creation_voucher_created_event,
            number_of_events_before_call + 1,
        );
    })
}
