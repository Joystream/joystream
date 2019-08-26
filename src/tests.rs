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
fn cannot_create_class_with_empty_name() {
    with_test_externalities(|| {
        let empty_name = vec![];
        assert_err!(
            TestModule::create_class(
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
                good_class_name(),
                empty_description,
            ),
            ERROR_CLASS_EMPTY_DESCRIPTION
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
                known_prop_ids(),
                good_props()
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
                good_entity_name(),
            ),
            ERROR_CLASS_NOT_FOUND
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
                empty_name,
            ),
            ERROR_ENTITY_EMPTY_NAME
        );
    })
}

// Update entity properties
// --------------------------------------


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
