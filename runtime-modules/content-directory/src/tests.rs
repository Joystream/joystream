#![cfg(test)]

use super::*;
use crate::mock::*;
use core::iter::FromIterator;

///Root Origin

#[test]
fn add_curator_group_success() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_eq!(next_curator_group_id(), FIRST_CURATOR_GROUP_ID);
        assert!(!curator_group_exists(FIRST_CURATOR_GROUP_ID));

        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Runtime tested state after call

        // Ensure new curator group exists and equal to default one right after creation
        let curator_group = CuratorGroup::default();
        assert_eq!(curator_group_by_id(FIRST_CURATOR_GROUP_ID), curator_group);

        // Overall curator groups counter after curator group creation creation checked
        assert_eq!(next_curator_group_id(), SECOND_CURATOR_GROUP_ID);

        assert!(curator_group_exists(FIRST_CURATOR_GROUP_ID));

        let curator_group_created_event =
            get_test_event(RawEvent::CuratorGroupAdded(FIRST_CURATOR_GROUP_ID));

        // Event checked
        assert_event_success(
            curator_group_created_event,
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn remove_curator_group_success() {
    with_test_externalities(|| {
        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_ok!(remove_curator_group(LEAD_ORIGIN, FIRST_CURATOR_GROUP_ID));

        // Runtime tested state after call

        assert_eq!(next_curator_group_id(), SECOND_CURATOR_GROUP_ID);

        // Ensure curator group removed
        assert!(!curator_group_exists(FIRST_CURATOR_GROUP_ID));

        let curator_group_removed_event =
            get_test_event(RawEvent::CuratorGroupRemoved(FIRST_CURATOR_GROUP_ID));

        // Event checked
        assert_event_success(
            curator_group_removed_event,
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn set_curator_group_status_success() {
    with_test_externalities(|| {
        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Change curator group status
        assert_ok!(set_curator_group_status(
            LEAD_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            true
        ));

        // Runtime tested state after call

        // Ensure curator group status changed
        let mut curator_group = CuratorGroup::default();
        curator_group.set_status(true);
        assert_eq!(curator_group_by_id(FIRST_CURATOR_GROUP_ID), curator_group);

        let curator_group_status_set_event = get_test_event(RawEvent::CuratorGroupStatusSet(
            FIRST_CURATOR_GROUP_ID,
            true,
        ));

        // Event checked
        assert_event_success(
            curator_group_status_set_event,
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn add_curator_to_group_success() {
    with_test_externalities(|| {
        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Add curator to group
        assert_ok!(add_curator_to_group(
            LEAD_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            FIRST_CURATOR_ID
        ));

        // Runtime tested state after call

        // Ensure curator added to group
        let mut curator_group = CuratorGroup::default();
        curator_group.get_curators_mut().insert(FIRST_CURATOR_ID);
        assert_eq!(curator_group_by_id(FIRST_CURATOR_GROUP_ID), curator_group);

        let curator_group_curator_added_event = get_test_event(RawEvent::CuratorAdded(
            FIRST_CURATOR_GROUP_ID,
            FIRST_CURATOR_ID,
        ));

        // Event checked
        assert_event_success(
            curator_group_curator_added_event,
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn remove_curator_from_group_success() {
    with_test_externalities(|| {
        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Add first curator to group
        assert_ok!(add_curator_to_group(
            LEAD_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            FIRST_CURATOR_ID
        ));
        // Add second curator to group
        assert_ok!(add_curator_to_group(
            LEAD_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            SECOND_CURATOR_ID
        ));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Remove first curator from group
        assert_ok!(remove_curator_from_group(
            LEAD_ORIGIN,
            FIRST_CURATOR_GROUP_ID,
            FIRST_CURATOR_ID
        ));

        // Runtime tested state after call

        // Ensure group contains only second curator
        let mut curator_group = CuratorGroup::default();
        curator_group.get_curators_mut().insert(SECOND_CURATOR_ID);
        assert_eq!(curator_group_by_id(FIRST_CURATOR_GROUP_ID), curator_group);

        let curator_group_curator_removed_event = get_test_event(RawEvent::CuratorRemoved(
            FIRST_CURATOR_GROUP_ID,
            FIRST_CURATOR_ID,
        ));

        // Event checked
        assert_event_success(
            curator_group_curator_removed_event,
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn create_class_success() {
    with_test_externalities(|| {
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_eq!(next_class_id(), FIRST_CLASS_ID);
        assert!(!class_exists(FIRST_CLASS_ID));

        // Create simple class with default permissions
        assert_ok!(create_simple_class_with_default_permissions(LEAD_ORIGIN));

        // Runtime tested state after call

        // Ensure class under given if is equal to default one
        let default_class = create_class_with_default_permissions();
        assert_eq!(class_by_id(FIRST_CLASS_ID), default_class);

        let class_created_event = get_test_event(RawEvent::ClassCreated(FIRST_CLASS_ID));

        // Event checked
        assert_event_success(class_created_event, number_of_events_before_call + 1);
    })
}

#[test]
fn add_maintainer_to_class_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class_with_default_permissions(LEAD_ORIGIN));

        // Add curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));
        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        assert_ok!(add_maintainer_to_class(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID
        ));

        // Runtime tested state after call

        // Ensure curator_group added as class maintainer
        let mut class = create_class_with_default_permissions();
        class
            .get_permissions_mut()
            .get_maintainers_mut()
            .insert(FIRST_CURATOR_GROUP_ID);
        assert_eq!(class_by_id(FIRST_CLASS_ID), class);

        let maintainer_added_event = get_test_event(RawEvent::MaintainerAdded(
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID,
        ));

        // Event checked
        assert_event_success(maintainer_added_event, number_of_events_before_call + 1);
    })
}

#[test]
fn remove_maintainer_from_class_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class_with_default_permissions(LEAD_ORIGIN));

        // Add first curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Add second curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Add first maintainer to class
        assert_ok!(add_maintainer_to_class(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID
        ));

        // Add second maintainer to class
        assert_ok!(add_maintainer_to_class(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            SECOND_CURATOR_GROUP_ID
        ));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        // Remove first maintainer from class
        assert_ok!(remove_maintainer_from_class(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID
        ));

        // Runtime tested state after call

        // Ensure curator_group removed from class maintainers set
        let mut class = create_class_with_default_permissions();
        class
            .get_permissions_mut()
            .get_maintainers_mut()
            .insert(SECOND_CURATOR_GROUP_ID);
        assert_eq!(class_by_id(FIRST_CLASS_ID), class);

        let maintainer_removed_event = get_test_event(RawEvent::MaintainerRemoved(
            FIRST_CLASS_ID,
            FIRST_CURATOR_GROUP_ID,
        ));

        // Event checked
        assert_event_success(maintainer_removed_event, number_of_events_before_call + 1);
    })
}

#[test]
fn update_class_permissions_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class_with_default_permissions(LEAD_ORIGIN));

        // Add first curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Add second curator group
        assert_ok!(add_curator_group(LEAD_ORIGIN));

        // Runtime tested state before call

        // Events number before tested call
        let number_of_events_before_call = System::events().len();

        let maintainers = BTreeSet::from_iter(vec![FIRST_CURATOR_ID, SECOND_CURATOR_ID]);

        // Update class permissions
        assert_ok!(update_class_permissions(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            None,
            Some(true),
            None,
            Some(maintainers.clone())
        ));

        // Runtime tested state after call

        // Ensure class permissions updated succesfully
        let mut class = create_class_with_default_permissions();
        let class_permissions = class.get_permissions_mut();

        *class_permissions.get_maintainers_mut() = maintainers;
        class_permissions.set_entity_creation_blocked(true);

        assert_eq!(class_by_id(FIRST_CLASS_ID), class);

        let class_permissions_updated_event =
            get_test_event(RawEvent::ClassPermissionsUpdated(FIRST_CLASS_ID));

        // Event checked
        assert_event_success(
            class_permissions_updated_event,
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn add_class_schema_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class_with_default_permissions(LEAD_ORIGIN));

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        let first_property = Property::default_with_name(generate_text(
            PropertyNameLengthConstraint::get().max() as usize,
        ));

        let second_property = Property::default_with_name(generate_text(
            (PropertyNameLengthConstraint::get().max() - 1) as usize,
        ));

        // Add first class schema
        assert_ok!(add_class_schema(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::new(),
            vec![first_property.clone()]
        ));

        // Add second class schema
        assert_ok!(add_class_schema(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::from_iter(vec![FIRST_PROPERTY_ID].into_iter()),
            vec![second_property.clone()]
        ));

        // Runtime tested state after call

        // Ensure class schemas added succesfully
        let mut class = create_class_with_default_permissions();

        class.properties = vec![first_property, second_property];
        class.schemas = vec![
            Schema::new(BTreeSet::from_iter(vec![FIRST_PROPERTY_ID].into_iter())),
            Schema::new(BTreeSet::from_iter(
                vec![FIRST_PROPERTY_ID, SECOND_PROPERTY_ID].into_iter(),
            )),
        ];

        assert_eq!(class_by_id(FIRST_CLASS_ID), class);

        let class_schema_added_event =
            get_test_event(RawEvent::ClassSchemaAdded(FIRST_CLASS_ID, SECOND_SCHEMA_ID));

        // Last event checked
        assert_event_success(class_schema_added_event, number_of_events_before_call + 2);
    })
}

#[test]
fn update_class_schema_status_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class_with_default_permissions(LEAD_ORIGIN));

        // Runtime tested state before call

        let property = Property::default_with_name(generate_text(
            PropertyNameLengthConstraint::get().max() as usize,
        ));

        // Add class schema (default class schema active flag set true)
        assert_ok!(add_class_schema(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            BTreeSet::new(),
            vec![property.clone()]
        ));

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        assert_ok!(update_class_schema_status(
            LEAD_ORIGIN,
            FIRST_CLASS_ID,
            FIRST_SCHEMA_ID,
            false
        ));

        // Runtime tested state after call

        // Ensure class schema status updated succesfully
        let mut class = create_class_with_default_permissions();
        let mut schema = Schema::new(BTreeSet::from_iter(vec![FIRST_PROPERTY_ID].into_iter()));

        schema.set_status(false);
        class.properties = vec![property];
        class.schemas = vec![schema];

        assert_eq!(class_by_id(FIRST_CLASS_ID), class);

        let class_schema_status_updated_event = get_test_event(RawEvent::ClassSchemaStatusUpdated(
            FIRST_CLASS_ID,
            FIRST_SCHEMA_ID,
            false,
        ));

        // Last event checked
        assert_event_success(
            class_schema_status_updated_event,
            number_of_events_before_call + 1,
        );
    })
}

#[test]
fn create_entity_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class_with_default_permissions(LEAD_ORIGIN));

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

        // Events number before tested calls
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
fn create_entity_creation_voucher_success() {
    with_test_externalities(|| {
        // Create simple class with default permissions
        assert_ok!(create_simple_class_with_default_permissions(LEAD_ORIGIN));

        // Runtime state before tested call

        let entity_controller = EntityController::Member(FIRST_MEMBER_ID);
        assert!(!entity_creation_voucher_exists(
            FIRST_CLASS_ID,
            &entity_controller
        ));

        // Events number before tested calls
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
        assert_ok!(create_simple_class_with_default_permissions(LEAD_ORIGIN));

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

        // Events number before tested calls
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
