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

        let entity_controller = EntityController::<MemberId>::from_actor::<Runtime>(&actor);

        assert_eq!(
            entity_creation_vouchers(FIRST_CLASS_ID, &entity_controller),
            entity_voucher,
        );

        let entity_removed_event =
            get_test_event(RawEvent::EntityRemoved(actor, next_entity_id() - 1));

        // Last event checked
        assert_event(entity_removed_event, number_of_events_before_call + 1);
    })
}

#[test]
fn remove_non_existent_entity() {
    with_test_externalities(|| {
        let actor = emulate_entity_access_state_for_failure_case(
            EntityAccessStateFailureType::EntityNotFound,
        );

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to remove Entity, which does not exist in runtime
        let remove_entity_result = remove_entity(LEAD_ORIGIN, actor, UNKNOWN_ENTITY_ID);

        // Failure checked
        assert_failure(
            remove_entity_result,
            Error::<Runtime>::EntityNotFound,
            number_of_events_before_call,
        );
    })
}

#[test]
fn remove_entity_lead_auth_failed() {
    with_test_externalities(|| {
        let actor = emulate_entity_access_state_for_failure_case(
            EntityAccessStateFailureType::LeadAuthFailed,
        );

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to remove entity under non lead origin
        let remove_entity_result = remove_entity(UNKNOWN_ORIGIN, actor, FIRST_ENTITY_ID);

        // Failure checked
        assert_failure(
            remove_entity_result,
            Error::<Runtime>::LeadAuthFailed,
            number_of_events_before_call,
        );
    })
}

#[test]
fn remove_entity_member_auth_failed() {
    with_test_externalities(|| {
        let actor = emulate_entity_access_state_for_failure_case(
            EntityAccessStateFailureType::MemberAuthFailed,
        );

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to remove entity using unknown origin and member actor, which is current Entity controller
        let remove_entity_result = remove_entity(UNKNOWN_ORIGIN, actor, FIRST_ENTITY_ID);

        // Failure checked
        assert_failure(
            remove_entity_result,
            Error::<Runtime>::MemberAuthFailed,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_entity_curator_group_is_not_active() {
    with_test_externalities(|| {
        let actor = emulate_entity_access_state_for_failure_case(
            EntityAccessStateFailureType::CuratorAuthFailed,
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

        // Make an attempt to remove entity using curator group, which is not active as actor
        let remove_entity_result = remove_entity(FIRST_CURATOR_ORIGIN, actor, FIRST_ENTITY_ID);

        // Failure checked
        assert_failure(
            remove_entity_result,
            Error::<Runtime>::CuratorGroupIsNotActive,
            number_of_events_before_call,
        );
    })
}

#[test]
fn remove_entity_curator_auth_failed() {
    with_test_externalities(|| {
        let actor = emulate_entity_access_state_for_failure_case(
            EntityAccessStateFailureType::CuratorAuthFailed,
        );

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to remove entity under unknown origin and curator actor, which corresponding group is current entity controller
        let remove_entity_result = remove_entity(UNKNOWN_ORIGIN, actor, FIRST_ENTITY_ID);

        // Failure checked
        assert_failure(
            remove_entity_result,
            Error::<Runtime>::CuratorAuthFailed,
            number_of_events_before_call,
        );
    })
}

#[test]
fn remove_entity_curator_not_found_in_curator_group() {
    with_test_externalities(|| {
        let actor = emulate_entity_access_state_for_failure_case(
            EntityAccessStateFailureType::CuratorNotFoundInCuratorGroup,
        );

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to remove entity, using actor in group,
        // which curator id was not added to corresponding group set
        let remove_entity_result = remove_entity(SECOND_CURATOR_ORIGIN, actor, FIRST_ENTITY_ID);

        // Failure checked
        assert_failure(
            remove_entity_result,
            Error::<Runtime>::CuratorIsNotAMemberOfGivenCuratorGroup,
            number_of_events_before_call,
        );
    })
}

#[test]
fn remove_entity_access_denied() {
    with_test_externalities(|| {
        let actor = emulate_entity_access_state_for_failure_case(
            EntityAccessStateFailureType::EntityAccessDenied,
        );

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to remove entity, using origin, which corresponding actor is neither entity maintainer, nor controller.
        let remove_entity_result = remove_entity(SECOND_MEMBER_ORIGIN, actor, FIRST_ENTITY_ID);

        // Failure checked
        assert_failure(
            remove_entity_result,
            Error::<Runtime>::EntityAccessDenied,
            number_of_events_before_call,
        );
    })
}

#[test]
fn remove_entity_removal_access_denied() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Add curator to group
        assert_ok!(add_curator_to_group(
            LEAD_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            FIRST_CURATOR_ID,
        ));

        // Make curator group active
        assert_ok!(set_curator_group_status(
            LEAD_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            true
        ));

        // Add curator group as class maintainer
        assert_ok!(add_maintainer_to_class(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID
        ));

        // Runtime state before tested call

        let actor = Actor::Curator(FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID);

        // Create entity
        assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, Actor::Lead));

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to remove entity, using origin, which corresponding actor is not an entity controller
        let remove_entity_result = remove_entity(FIRST_CURATOR_ORIGIN, actor, FIRST_ENTITY_ID);

        // Failure checked
        assert_failure(
            remove_entity_result,
            Error::<Runtime>::EntityRemovalAccessDenied,
            number_of_events_before_call,
        );
    })
}

#[test]
fn remove_entity_rc_does_not_equal_to_zero() {
    with_test_externalities(|| {
        let actor = Actor::Lead;

        // Create class, two corresponding entities and force first entity have schema support with property value referencing second entity
        add_entity_schemas_support();

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Make an attempt to remove entity, which rc does not equal to zero
        let remove_entity_result = remove_entity(LEAD_ORIGIN, actor, SECOND_ENTITY_ID);

        // Failure checked
        assert_failure(
            remove_entity_result,
            Error::<Runtime>::EntityRcDoesNotEqualToZero,
            number_of_events_before_call,
        );

        // Remove first entity, which have property values referencing second one.
        assert_ok!(remove_entity(LEAD_ORIGIN, actor, FIRST_ENTITY_ID));

        // Succesfully perform second entity removal
        assert_ok!(remove_entity(LEAD_ORIGIN, actor, SECOND_ENTITY_ID));
    })
}
