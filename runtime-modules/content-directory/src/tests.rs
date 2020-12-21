mod add_class_schema;
mod add_curator_group;
mod add_curator_to_group;
mod add_maintainer_to_class;
mod add_schema_support_to_entity;
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

pub fn add_entity_schemas_support() -> (
    Entity<ClassId, MemberId, Hashed, EntityId, Nonce>,
    Entity<ClassId, MemberId, Hashed, EntityId, Nonce>,
) {
    // Create first class with default permissions
    assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

    // Create second class with default permissions
    assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

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
        Property::<ClassId>::default_with_name(PropertyNameLengthConstraint::get().max() as usize);

    // Create second property
    let second_property_type = PropertyType::<ClassId>::vec_reference(SECOND_CLASS_ID, true, 5);

    let second_property = Property::<ClassId>::with_name_and_type(
        (PropertyNameLengthConstraint::get().max() - 1) as usize,
        second_property_type,
        true,
        false,
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
    first_schema_property_values.insert(FIRST_PROPERTY_ID, InputPropertyValue::default());

    // Add first schema support to the first entity
    assert_ok!(add_schema_support_to_entity(
        LEAD_ORIGIN,
        actor.to_owned(),
        FIRST_ENTITY_ID,
        FIRST_SCHEMA_ID,
        first_schema_property_values.clone()
    ));

    let mut second_schema_property_values = BTreeMap::new();
    let second_schema_property_value = InputPropertyValue::<Runtime>::vec_reference(vec![
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
    *first_entity.get_supported_schemas_mut() =
        BTreeSet::from_iter(vec![FIRST_SCHEMA_ID, SECOND_SCHEMA_ID].into_iter());

    first_schema_property_values.append(&mut second_schema_property_values);

    first_entity.set_values(TestModule::make_output_property_values(
        first_schema_property_values,
    ));

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
    assert_event(
        entity_schema_support_added_event,
        number_of_events_before_calls + 2,
    );

    (first_entity, second_entity)
}

pub enum EntityAccessStateFailureType {
    EntityNotFound,
    LeadAuthFailed,
    MemberAuthFailed,
    CuratorAuthFailed,
    CuratorNotFoundInCuratorGroup,
    EntityAccessDenied,
    PropertyValuesLocked,
}

pub fn emulate_entity_access_state_for_failure_case(
    entity_access_level_failure_type: EntityAccessStateFailureType,
) -> Actor<CuratorGroupId, CuratorId, MemberId> {
    // Create class with default permissions
    assert_ok!(create_simple_class(LEAD_ORIGIN, ClassType::Valid));

    match entity_access_level_failure_type {
        EntityAccessStateFailureType::EntityNotFound => Actor::Lead,
        EntityAccessStateFailureType::LeadAuthFailed => {
            let actor = Actor::Lead;

            // Create entity
            assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, actor.clone()));
            actor
        }
        EntityAccessStateFailureType::MemberAuthFailed => {
            // Update class permissions to force any member be available to create entities
            assert_ok!(update_class_permissions(
                LEAD_ORIGIN,
                FIRST_CLASS_ID,
                Some(true),
                None,
                None,
                None
            ));

            let actor = Actor::Member(FIRST_MEMBER_ID);

            // Create entity
            assert_ok!(create_entity(
                FIRST_MEMBER_ORIGIN,
                FIRST_CLASS_ID,
                actor.clone()
            ));
            actor
        }
        EntityAccessStateFailureType::CuratorAuthFailed => {
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

            // Make curator group active
            assert_ok!(set_curator_group_status(
                LEAD_ORIGIN,
                FIRST_CURATOR_GROUP_ID,
                true
            ));

            let actor = Actor::Curator(FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID);

            // Create Entity
            assert_ok!(create_entity(
                FIRST_CURATOR_ORIGIN,
                FIRST_CLASS_ID,
                actor.clone()
            ));

            actor
        }
        EntityAccessStateFailureType::CuratorNotFoundInCuratorGroup => {
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

            // Create entity
            assert_ok!(create_entity(
                FIRST_CURATOR_ORIGIN,
                FIRST_CLASS_ID,
                Actor::Curator(FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID)
            ));

            Actor::Curator(FIRST_CURATOR_GROUP_ID, SECOND_CURATOR_ID)
        }
        EntityAccessStateFailureType::EntityAccessDenied => {
            // Update class permissions to force any member be available to create entities
            assert_ok!(update_class_permissions(
                LEAD_ORIGIN,
                FIRST_CLASS_ID,
                Some(true),
                None,
                None,
                None
            ));

            // Create entity
            assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, Actor::Lead));

            Actor::Member(SECOND_MEMBER_ID)
        }
        EntityAccessStateFailureType::PropertyValuesLocked => {
            // Update class permissions to force lock all entity property values from update being performed
            assert_ok!(update_class_permissions(
                LEAD_ORIGIN,
                FIRST_CLASS_ID,
                None,
                None,
                Some(true),
                None
            ));

            // Create entity
            assert_ok!(create_entity(LEAD_ORIGIN, FIRST_CLASS_ID, Actor::Lead));

            Actor::Lead
        }
    }
}

///  Create class reference schema
pub fn add_unique_class_reference_schema() {
    // Create property
    let property_type =
        PropertyType::<ClassId>::vec_reference(FIRST_CLASS_ID, true, VecMaxLengthConstraint::get());

    let property = Property::<ClassId>::with_name_and_type(
        (PropertyNameLengthConstraint::get().max() - 1) as usize,
        property_type,
        true,
        true,
    );

    // Add Schema to the Class
    assert_ok!(add_class_schema(
        LEAD_ORIGIN,
        FIRST_CLASS_ID,
        BTreeSet::new(),
        vec![property]
    ));
}

///  Create class reference schema and add corresponding schema support to the Entity
pub fn add_unique_class_reference_schema_and_entity_schema_support(
    actor: &Actor<CuratorGroupId, CuratorId, MemberId>,
    origin: u64,
) {
    add_unique_class_reference_schema();

    let schema_property_value =
        InputPropertyValue::<Runtime>::vec_reference(vec![FIRST_ENTITY_ID, FIRST_ENTITY_ID]);

    let mut schema_property_values = BTreeMap::new();
    schema_property_values.insert(FIRST_PROPERTY_ID, schema_property_value);

    // Add schema support to the entity
    assert_ok!(add_schema_support_to_entity(
        origin,
        actor.to_owned(),
        FIRST_ENTITY_ID,
        FIRST_SCHEMA_ID,
        schema_property_values
    ));
}
