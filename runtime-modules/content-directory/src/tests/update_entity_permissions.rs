use super::*;

#[test]
fn update_entity_permissions_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class_with_default_permissions(LEAD_ORIGIN));

        let actor = Actor::Lead;

        // Create entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor));

        // Runtime state before tested call

        // Ensure entity permissions of newly created Entity are equal to default ones.
        let mut entity_permissions = EntityPermissions::default();
        assert_eq!(
            entity_by_id(FIRST_ENTITY_ID).get_permissions(),
            entity_permissions
        );

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Update entity permissions for chosen entity
        assert_ok!(update_entity_permissions(
            LEAD_ORIGIN,
            FIRST_ENTITY_ID,
            None,
            Some(false)
        ));

        // Runtime tested state after call

        entity_permissions.set_referencable(false);
        assert_eq!(
            entity_by_id(FIRST_ENTITY_ID).get_permissions(),
            entity_permissions
        );

        let entity_permissions_updated_event =
            get_test_event(RawEvent::EntityPermissionsUpdated(FIRST_ENTITY_ID));

        // Last event checked
        assert_event_success(
            entity_permissions_updated_event,
            number_of_events_before_call + 1,
        );
    })
}
