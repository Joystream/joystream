#![cfg(test)]

use super::*;
use crate::mock::*;

use srml_support::{assert_ok, assert_err};

// Create class
// --------------------------------------

#[test]
fn create_class_successfully() {
    with_test_externalities(|| {
        let class_id = TestModule::next_class_id();
        assert_ok!(
            TestModule::create_class(
                good_props(),
                good_schemas(),
                good_class_name(),
                good_class_description(),
            ),
            class_id
        );
        assert_eq!(
            TestModule::next_class_id(),
            class_id + 1
        );
    })
}

#[test]
fn cannot_create_class_with_empty_properties() {
    with_test_externalities(|| {
        let empty_props = vec![];
        assert_err!(
            TestModule::create_class(
                empty_props,
                good_schemas(),
                good_class_name(),
                good_class_description(),
            ),
            ERROR_CLASS_EMPTY_PROPS
        );
    })
}

#[test]
fn cannot_create_class_with_empty_schemas() {
    with_test_externalities(|| {
        let empty_schemas = vec![];
        assert_err!(
            TestModule::create_class(
                good_props(),
                empty_schemas,
                good_class_name(),
                good_class_description(),
            ),
            ERROR_CLASS_EMPTY_SCHEMAS
        );
    })
}

#[test]
fn cannot_create_class_with_empty_name() {
    with_test_externalities(|| {
        let empty_name = vec![];
        assert_err!(
            TestModule::create_class(
                good_props(),
                good_schemas(),
                empty_name,
                good_class_description(),
            ),
            ERROR_CLASS_EMPTY_NAME
        );
    })
}

#[test]
fn cannot_create_class_with_empty_description() {
    with_test_externalities(|| {
        let empty_description = vec![];
        assert_err!(
            TestModule::create_class(
                good_props(),
                good_schemas(),
                good_class_name(),
                empty_description,
            ),
            ERROR_CLASS_EMPTY_DESCRIPTION
        );
    })
}

// Add class property
// --------------------------------------

#[test]
fn cannot_add_property_to_unknown_class() {
    with_test_externalities(|| {
        assert_err!(
            TestModule::add_class_property(
                UNKNOWN_CLASS_ID,
                good_prop_bool()
            ),
            ERROR_CLASS_NOT_FOUND
        );
    })
}

// Add class schema
// --------------------------------------

#[test]
fn cannot_add_schema_to_unknown_class() {
    with_test_externalities(|| {
        assert_err!(
            TestModule::add_class_schema(
                UNKNOWN_CLASS_ID,
                good_schema()
            ),
            ERROR_CLASS_NOT_FOUND
        );
    })
}

// Create entity
// --------------------------------------

#[test]
fn create_entity_successfully() {
    with_test_externalities(|| {
        let class_id = create_class();
        let entity_id_1 = TestModule::next_entity_id();
        assert_ok!(
            TestModule::create_entity(
                class_id,
                good_schema_indices(),
                good_property_values(),
                good_entity_name(),
            ),
            entity_id_1
        );
        assert_eq!(
            TestModule::next_entity_id(),
            entity_id_1 + 1
        );
    })
}

#[test]
fn cannot_create_entity_with_unknown_class_id() {
    with_test_externalities(|| {
        assert_err!(
            TestModule::create_entity(
                UNKNOWN_CLASS_ID,
                good_schema_indices(),
                good_property_values(),
                good_entity_name(),
            ),
            ERROR_CLASS_NOT_FOUND
        );
    })
}

#[test]
fn cannot_create_entity_with_empty_schema_indices() {
    with_test_externalities(|| {
        let class_id = create_class();
        let empty_schema_indices = vec![];
        assert_err!(
            TestModule::create_entity(
                class_id,
                empty_schema_indices,
                good_property_values(),
                good_entity_name(),
            ),
            ERROR_ENTITY_EMPTY_SCHEMAS
        );
    })
}

#[test]
fn cannot_create_entity_with_empty_property_values() {
    with_test_externalities(|| {
        let class_id = create_class();
        let empty_property_values = vec![];
        assert_err!(
            TestModule::create_entity(
                class_id,
                good_schema_indices(),
                empty_property_values,
                good_entity_name(),
            ),
            ERROR_ENTITY_EMPTY_PROPS
        );
    })
}

#[test]
fn cannot_create_entity_with_empty_name() {
    with_test_externalities(|| {
        let class_id = create_class();
        let empty_name = vec![];
        assert_err!(
            TestModule::create_entity(
                class_id,
                good_schema_indices(),
                good_property_values(),
                empty_name,
            ),
            ERROR_ENTITY_EMPTY_NAME
        );
    })
}

// Update entity
// --------------------------------------

// #[test]
// fn update_entity_successfully() {
//     // TODO impl
// }

#[test]
fn cannot_update_entity_by_unknown_id() {
    with_test_externalities(|| {
        assert_err!(
            TestModule::update_entity(
                UNKNOWN_ENTITY_ID,
                good_schema_indices(),
                good_property_values(),
                Some(good_entity_name()),
            ),
            ERROR_ENTITY_NOT_FOUND
        );
    })
}

#[test]
fn cannot_update_entity_if_all_updates_empty() {
    with_test_externalities(|| {
        let entity_id = create_entity();
        assert_err!(
            TestModule::update_entity(
                entity_id,
                vec![],
                vec![],
                None,
            ),
            ERROR_NOTHING_TO_UPDATE_IN_ENTITY
        );
    })
}

// Delete entity
// --------------------------------------

#[test]
fn delete_entity_successfully() {
    with_test_externalities(|| {
        let entity_id = create_entity();
        assert_ok!(
            TestModule::delete_entity(entity_id),
            ()
        );
    })
}

#[test]
fn cannot_delete_already_deleted_entity() {
    with_test_externalities(|| {
        let entity_id = create_entity();
        let _ok = TestModule::delete_entity(entity_id);
        assert_err!(
            TestModule::delete_entity(entity_id),
            ERROR_ENTITY_ALREADY_DELETED
        );
    })
}

#[test]
fn cannot_delete_entity_by_unknown_id() {
    with_test_externalities(|| {
        assert_err!(
            TestModule::delete_entity(UNKNOWN_ENTITY_ID),
            ERROR_ENTITY_NOT_FOUND
        );
    })
}
