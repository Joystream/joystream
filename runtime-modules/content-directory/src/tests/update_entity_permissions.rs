use super::*;

#[test]
fn update_entity_permissions_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

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

#[test]
fn update_entity_permissions_lead_auth_failed() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        let actor = Actor::Lead;

        // Create entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to update entity permissions for chosen entity under non lead origin
        let update_entity_permissions_result =
            update_entity_permissions(FIRST_MEMBER_ORIGIN, FIRST_ENTITY_ID, None, Some(false));

        // Failure checked
        assert_failure(
            update_entity_permissions_result,
            ERROR_LEAD_AUTH_FAILED,
            number_of_events_before_call,
        );
    })
}

#[test]
fn update_entity_permissions_of_non_existent_entity() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to update entity permissions for chosen entity under non lead origin
        let update_entity_permissions_result =
            update_entity_permissions(LEAD_ORIGIN, UNKNOWN_ENTITY_ID, None, Some(false));

        // Failure checked
        assert_failure(
            update_entity_permissions_result,
            ERROR_ENTITY_NOT_FOUND,
            number_of_events_before_call,
        );
    })
}
