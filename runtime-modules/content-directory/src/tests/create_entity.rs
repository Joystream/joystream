use super::*;

#[test]
fn create_entity_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Update class permissions to force any member be available to create entities
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

#[test]
fn create_entity_of_non_existent_class() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let actor = Actor::Lead;

        // Make an attempt to create Entity of non existent Class
        let create_entity_result = create_entity(LEAD_ORIGIN, UNKNOWN_CLASS_ID, actor.clone());

        // Failure checked
        assert_failure(
            create_entity_result,
            ERROR_CLASS_NOT_FOUND,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_entity_creation_limit_reached() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Update class permissions to force any member be available to create entities
        assert_ok!(update_class_permissions(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            Some(true),
            None,
            None,
            None
        ));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let mut number_of_entities_created = 0;

        // Create entities of the same Class entities limit per class reached
        let create_entity_result = loop {
            let create_entity_result = create_entity(
                number_of_entities_created,
                FIRST_CLASS_ID,
                Actor::Member(number_of_entities_created),
            );
            if create_entity_result.is_err() {
                break create_entity_result;
            } else {
                number_of_entities_created += 1;
            }
        };

        // Runtime tested state after call

        // Ensure number of entities created is equal to MaxNumberOfEntitiesPerClass runtime constraint.
        assert_eq!(
            number_of_entities_created,
            MaxNumberOfEntitiesPerClass::get()
        );

        // Failure checked
        assert_failure(
            create_entity_result,
            ERROR_MAX_NUMBER_OF_ENTITIES_PER_CLASS_LIMIT_REACHED,
            number_of_events_before_call + number_of_entities_created as usize,
        );
    })
}

#[test]
fn create_entity_creation_blocked_on_class_level() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Update class permissions to block entity creation on class level
        assert_ok!(update_class_permissions(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            None,
            Some(true),
            None,
            None
        ));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let actor = Actor::Lead;

        // Make an attempt to create Entity, when entiti creation was previously blocked on class level
        let create_entity_result = create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone());

        // Runtime tested state after call

        // Failure checked
        assert_failure(
            create_entity_result,
            ERROR_ENTITY_CREATION_BLOCKED,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_entity_lead_auth_failed() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let actor = Actor::Lead;

        // Make an attempt to authorize as Lead under non lead origin
        let create_entity_result =
            create_entity(FIRST_MEMBER_ORIGIN, FIRST_CLASS_ID, actor.clone());

        // Failure checked
        assert_failure(
            create_entity_result,
            ERROR_LEAD_AUTH_FAILED,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_entity_member_auth_failed() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Update class permissions to force any member be available to create entities
        assert_ok!(update_class_permissions(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            Some(true),
            None,
            None,
            None
        ));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let actor = Actor::Member(UNKNOWN_MEMBER_ID);

        // Make an attempt to authorize under non existent member id
        let create_entity_result = create_entity(UNKNOWN_ORIGIN, FIRST_CLASS_ID, actor.clone());

        // Failure checked
        assert_failure(
            create_entity_result,
            ERROR_MEMBER_AUTH_FAILED,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_entity_actor_can_not_create_entities() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let actor = Actor::Member(UNKNOWN_MEMBER_ID);

        // Make an attempt to create entity, authorizing as member in case, when members are not permitted to create entities on class level
        let create_entity_result = create_entity(UNKNOWN_ORIGIN, FIRST_CLASS_ID, actor.clone());

        // Failure checked
        assert_failure(
            create_entity_result,
            ERROR_ACTOR_CAN_NOT_CREATE_ENTITIES,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_entity_unknown_curator_id() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

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

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let actor = Actor::Curator(FIRST_CURATOR_GROUP_ID, UNKNOWN_CURATOR_ID);

        // Make an attempt to create entity, authorizing as curator in group,
        // in case, when provided curator id wasn`t added to respective curator group set
        let create_entity_result =
            create_entity(FIRST_CURATOR_ORIGIN, FIRST_CLASS_ID, actor.clone());

        // Failure checked
        assert_failure(
            create_entity_result,
            ERROR_CURATOR_AUTH_FAILED,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_entity_curator_group_is_not_active() {
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

        // Add curator group as class maintainer
        assert_ok!(add_maintainer_to_class(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID
        ));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let actor = Actor::Curator(FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID);

        // Make an attempt to create entity, authorizing as curator in group, in case, when
        // corresponding curator group is not active. (default status of curator group right after creation)
        let create_entity_result =
            create_entity(FIRST_CURATOR_ORIGIN, FIRST_CLASS_ID, actor.clone());

        // Failure checked
        assert_failure(
            create_entity_result,
            ERROR_CURATOR_GROUP_IS_NOT_ACTIVE,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_entity_curator_not_found_in_curator_group() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

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

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let actor = Actor::Curator(FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID);

        // Make an attempt to create entity, authorizing as curator in group, in case, when
        // curator was not added to corresponding curator group.
        let create_entity_result =
            create_entity(FIRST_CURATOR_ORIGIN, FIRST_CLASS_ID, actor.clone());

        // Failure checked
        assert_failure(
            create_entity_result,
            ERROR_CURATOR_IS_NOT_A_MEMBER_OF_A_GIVEN_CURATOR_GROUP,
            number_of_events_before_call,
        );
    })
}

#[test]
fn create_entity_voucher_limit_reached() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

        // Runtime state before tested call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let actor = Actor::Lead;

        let mut number_of_entities_created = 0;

        // Create entities until individual creation limit reached
        let create_entity_result = loop {
            let create_entity_result = create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone());
            if create_entity_result.is_err() {
                break create_entity_result;
            } else {
                number_of_entities_created += 1;
            }
        };

        // Ensure number of entities created is equal to IndividualEntitiesCreationLimit runtime constraint.
        assert_eq!(
            number_of_entities_created,
            IndividualEntitiesCreationLimit::get()
        );

        // Failure checked
        assert_failure(
            create_entity_result,
            ERROR_VOUCHER_LIMIT_REACHED,
            number_of_events_before_call + number_of_entities_created as usize,
        );
    })
}
