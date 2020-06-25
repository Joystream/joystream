mod add_class_schema;
mod add_curator_group;
mod add_curator_to_group;
mod add_entity_schema_support;
mod add_maintainer_to_class;
mod clear_entity_property_vector;
mod create_class;
mod create_entity;
mod insert_at_entity_property_vector;
mod remove_at_entity_property_vector;
mod remove_curator_from_group;
mod remove_curator_group;
mod remove_entity;
mod remove_maintainer_from_class;
mod set_curator_group_status;
mod transaction;
mod transfer_entity_ownership;
mod update_class_permissions;
mod update_class_schema_status;
mod update_entity_creation_voucher;
mod update_entity_permissions;
mod update_entity_property_values;

use super::*;
use crate::mock::*;
use core::iter::FromIterator;

pub fn add_entity_schemas_support() -> (Entity<Runtime>, Entity<Runtime>) {
    // Create first class with default permissions
    assert_ok!(create_simple_class_with_default_permissions(LEAD_ORIGIN));

    // Create second class with default permissions
    assert_ok!(create_simple_class_with_default_permissions(LEAD_ORIGIN));

    let actor = Actor::Lead;

    // Create first entity
    assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.to_owned()));

    // Create second entity
    assert_ok!(create_entity(
        LEAD_ORIGIN,
        SECOND_CLASS_ID,
        actor.to_owned()
    ));

    // Create first property
    let first_property =
        Property::<Runtime>::default_with_name(PropertyNameLengthConstraint::get().max() as usize);

    // Create second property
    let second_property_type = PropertyType::<Runtime>::vec_reference(SECOND_CLASS_ID, true, 5);

    let second_property = Property::<Runtime>::with_name_and_type(
        (PropertyNameLengthConstraint::get().max() - 1) as usize,
        second_property_type,
    );

    // Add first Schema to the first Class
    assert_ok!(add_class_schema(
        LEAD_ORIGIN,
        FIRST_CLASS_ID,
        BTreeSet::new(),
        vec![first_property]
    ));

    // Add second Schema to the first Class
    assert_ok!(add_class_schema(
        LEAD_ORIGIN,
        FIRST_CLASS_ID,
        BTreeSet::new(),
        vec![second_property]
    ));

    // Runtime state before tested call

    // Events number before tested calls
    let number_of_events_before_calls = System::events().len();

    // Used to ensure schema support added succesfully
    let mut first_entity = entity_by_id(FIRST_ENTITY_ID);

    // Used to ensure reference counter updated succesfully
    let mut second_entity = entity_by_id(SECOND_ENTITY_ID);

    let mut first_schema_property_values = BTreeMap::new();
    first_schema_property_values.insert(FIRST_PROPERTY_ID, PropertyValue::default());

    // Add first schema support to the first entity
    assert_ok!(add_schema_support_to_entity(
        LEAD_ORIGIN,
        actor.to_owned(),
        FIRST_ENTITY_ID,
        FIRST_SCHEMA_ID,
        first_schema_property_values.clone()
    ));

    let mut second_schema_property_values = BTreeMap::new();
    let second_schema_property_value = PropertyValue::<Runtime>::vec_reference(vec![
        SECOND_ENTITY_ID,
        SECOND_ENTITY_ID,
        SECOND_ENTITY_ID,
    ]);

    second_schema_property_values.insert(SECOND_PROPERTY_ID, second_schema_property_value);

    // Add second schema support to the first entity
    assert_ok!(add_schema_support_to_entity(
        LEAD_ORIGIN,
        actor.to_owned(),
        FIRST_ENTITY_ID,
        SECOND_SCHEMA_ID,
        second_schema_property_values.clone()
    ));

    // Update supported schemas set and properties of first entity
    first_entity.supported_schemas =
        BTreeSet::from_iter(vec![FIRST_SCHEMA_ID, SECOND_SCHEMA_ID].into_iter());
    first_entity.values = {
        first_schema_property_values.append(&mut second_schema_property_values);
        first_schema_property_values
    };

    // Update reference counter of second entity
    let inbound_rc = InboundReferenceCounter::new(3, true);
    *second_entity.get_reference_counter_mut() = inbound_rc.clone();

    // Create side-effect
    let side_effect: EntityReferenceCounterSideEffect = inbound_rc.into();
    let mut side_effects = ReferenceCounterSideEffects::default();
    side_effects.insert(SECOND_ENTITY_ID, side_effect);

    let entity_schema_support_added_event = get_test_event(RawEvent::EntitySchemaSupportAdded(
        actor,
        FIRST_ENTITY_ID,
        SECOND_SCHEMA_ID,
        Some(side_effects),
    ));

    // Last event checked
    assert_event_success(
        entity_schema_support_added_event,
        number_of_events_before_calls + 2,
    );

    (first_entity, second_entity)
}
