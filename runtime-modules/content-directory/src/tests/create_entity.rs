use super::*;

#[test]
fn create_entity_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Update class permissions to force any maintainer be available to create entities
        assert_ok!(update_class_permissions(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            Some(true),
            None,
            None,
            None
        ));

        // Runtime state before tested call

        assert_eq!(next_entity_id(), FIRST_ENTITY_ID);
        assert!(!entity_exists(FIRST_ENTITY_ID));

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let actor = Actor::Member(FIRST_MEMBER_ID);

        // Create entity
        assert_ok!(create_entity(
            FIRST_MEMBER_ORIGIN,
            FIRST_CLASS_ID,
            actor.clone()
        ));

        // Runtime tested state after call

        // Ensure Class `current_number_of_entities` value updated succesfully
        let mut class = create_class_with_default_permissions();
        class.get_permissions_mut().set_any_member_status(true);
        class.increment_entities_count();

        assert_eq!(class_by_id(FIRST_CLASS_ID), class);

        // Ensure  entity creation voucher with `default_entity_creation_voucher_upper_bound` for given entity controller created succesfully.
        let mut entity_voucher =
            EntityCreationVoucher::new(class.default_entity_creation_voucher_upper_bound);
        entity_voucher.increment_created_entities_count();

        let entity_controller = EntityController::from_actor(&actor);

        assert_eq!(
            entity_creation_vouchers(FIRST_CLASS_ID, &entity_controller),
            entity_voucher.clone(),
        );

        // Ensure new entity created
        let entity = Entity::<Runtime>::new(
            entity_controller,
            FIRST_CLASS_ID,
            BTreeSet::new(),
            BTreeMap::new(),
        );

        assert_eq!(entity_by_id(FIRST_ENTITY_ID), entity);

        // Ensure `NextEntityId` storage value updated
        assert_eq!(next_entity_id(), SECOND_ENTITY_ID);

        let entity_created_event =
            get_test_event(RawEvent::EntityCreated(actor, next_entity_id() - 1));

        // Last event checked
        assert_event_success(entity_created_event, number_of_events_before_call + 1);
    })
}
