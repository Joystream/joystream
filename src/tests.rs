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
                good_prop_ids(),
                good_props()
            ),
            ERROR_CLASS_NOT_FOUND
        );
    })
}

#[test]
fn cannot_add_class_schema_when_no_props_passed() {
    with_test_externalities(|| {
        let class_id = create_class();
        assert_err!(
            TestModule::add_class_schema(
                class_id,
                vec![],
                vec![]
            ),
            ERROR_NO_PROPS_IN_CLASS_SCHEMA
        );
    })
}

#[test]
fn cannot_add_class_schema_when_it_refers_unknown_prop_index_and_class_has_no_props() {
    with_test_externalities(|| {
        let class_id = create_class();
        assert_err!(
            TestModule::add_class_schema(
                class_id,
                vec![ UNKNOWN_PROP_ID ],
                vec![]
            ),
            ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_PROP_INDEX
        );
    })
}

#[test]
fn cannot_add_class_schema_when_it_refers_unknown_prop_index() {
    with_test_externalities(|| {
        let class_id = create_class();

        assert_eq!(
            TestModule::add_class_schema(
                class_id,
                vec![],
                good_props()
            ),
            Ok(SCHEMA_ID_0)
        );

        // Try to add a new schema that is based on one valid prop ids
        // plus another prop id is unknown on this class.
        assert_err!(
            TestModule::add_class_schema(
                class_id,
                vec![ 0, UNKNOWN_PROP_ID ],
                vec![]
            ),
            ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_PROP_INDEX
        );

        // Verify that class props and schemas remain unchanged:
        assert_class_props(class_id, good_props());
        assert_class_schemas(class_id, vec![ good_prop_ids() ]);
    })
}

#[test]
fn cannot_add_class_schema_when_it_refers_unknown_internal_id() {
    with_test_externalities(|| {
        let class_id = create_class();
        let bad_internal_prop = new_internal_class_prop(UNKNOWN_CLASS_ID);
        
        assert_err!(
            TestModule::add_class_schema(
                class_id,
                vec![],
                vec![ good_prop_bool(), bad_internal_prop ]
            ),
            ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_INTERNAL_ID
        );
    })
}

// TODO add successfully new_internal_class_prop to class.

#[test]
fn should_add_class_schema_when_only_new_props_passed() {
    with_test_externalities(|| {
        let class_id = create_class();

        // Add first schema with new props.
        // No other props on the class at this time.
        assert_eq!(
            TestModule::add_class_schema(
                class_id,
                vec![],
                good_props()
            ),
            Ok(SCHEMA_ID_0)
        );

        assert_class_props(class_id, good_props());
        assert_class_schemas(class_id, vec![ good_prop_ids() ]);
    })
}

#[test]
fn should_add_class_schema_when_only_prop_ids_passed() {
    with_test_externalities(|| {
        let class_id = create_class();

        // Add first schema with new props.
        // No other props on the class at this time.
        assert_eq!(
            TestModule::add_class_schema(
                class_id,
                vec![],
                good_props()
            ),
            Ok(SCHEMA_ID_0)
        );

        // Add a new schema that is based solely on the props ids
        // of the previously added schema.
        assert_eq!(
            TestModule::add_class_schema(
                class_id,
                good_prop_ids(),
                vec![]
            ),
            Ok(SCHEMA_ID_1)
        );
    })
}

#[test]
fn should_add_class_schema_when_both_prop_ids_and_new_props_passed() {
    with_test_externalities(|| {
        let class_id = create_class();

        // Add first schema with new props.
        // No other props on the class at this time.
        assert_eq!(
            TestModule::add_class_schema(
                class_id,
                vec![],
                vec![ good_prop_bool(), good_prop_u32() ]
            ),
            Ok(SCHEMA_ID_0)
        );

        // Add a new schema that is based on some prop ids
        // added with previous schema plus some new props,
        // introduced by this new schema.
        assert_eq!(
            TestModule::add_class_schema(
                class_id,
                vec![1],
                vec![ good_prop_text() ]
            ),
            Ok(SCHEMA_ID_1)
        );

        assert_class_props(class_id, vec![
            good_prop_bool(),
            good_prop_u32(),
            good_prop_text(),
        ]);

        assert_class_schemas(class_id, vec![
            vec![0, 1],
            vec![1, 2],
        ]);
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

// Add schema support to entity
// --------------------------------------

#[test]
fn cannot_add_schema_to_entity_when_entity_not_found() {
    with_test_externalities(|| {
        assert_entity_not_found(
            TestModule::add_schema_support_to_entity(
                UNKNOWN_ENTITY_ID,
                1,
                vec![]
            )
        );
    })
}

#[test]
fn cannot_add_schema_to_entity_when_schema_already_added_to_entity() {
    with_test_externalities(|| {
        let (_, schema_id, entity_id) = create_class_with_schema_and_entity();
        
        // Firstly we just add support for a valid class schema.
        assert_ok!(
            TestModule::add_schema_support_to_entity(
                entity_id,
                schema_id,
                vec![ bool_prop_value() ]
            )
        );

        // Secondly we try to add support for the same schema.
        assert_err!(
            TestModule::add_schema_support_to_entity(
                entity_id,
                schema_id,
                vec![]
            ),
            ERROR_SCHEMA_ALREADY_ADDED_TO_ENTITY
        );
    })
}

#[test]
fn cannot_add_schema_to_entity_when_class_schema_refers_unknown_prop_index() {
    with_test_externalities(|| {
        let (_, schema_id, entity_id) = create_class_with_schema_and_entity();
        let unknown_schema_id = schema_id + 1;
        assert_err!(
            TestModule::add_schema_support_to_entity(
                entity_id,
                unknown_schema_id,
                vec![ (0, PropertyValue::None) ]
            ),
            ERROR_UNKNOWN_CLASS_SCHEMA_ID
        );
    })
}

#[test]
fn cannot_add_schema_to_entity_when_error_prop_id_not_found_in_schema_props() {
    with_test_externalities(|| {
        let (_, schema_id, entity_id) = create_class_with_schema_and_entity();
        assert_err!(
            TestModule::add_schema_support_to_entity(
                entity_id,
                schema_id,
                vec![ (UNKNOWN_PROP_ID, PropertyValue::None) ]
            ),
            ERROR_PROP_ID_NOT_FOUND_IN_SCHEMA_PROPS
        );
    })
}

#[test]
fn cannot_add_schema_to_entity_when_prop_value_dont_match_type() {
    with_test_externalities(|| {
        let (_, schema_id, entity_id) = create_class_with_schema_and_entity();
        assert_err!(
            TestModule::add_schema_support_to_entity(
                entity_id,
                schema_id,
                vec![ (1, PropertyValue::Bool(true)) ]
            ),
            ERROR_PROP_VALUE_DONT_MATCH_TYPE
        );
    })
}

#[test]
fn cannot_add_schema_to_entity_when_unknown_internal_entity_id() {
    with_test_externalities(|| {
        let (_, schema_id, entity_id) = create_class_with_schema_and_entity();
        assert_err!(
            TestModule::add_schema_support_to_entity(
                entity_id,
                schema_id,
                vec![ (2, PropertyValue::Internal(UNKNOWN_ENTITY_ID)) ]
            ),
            ERROR_UNKNOWN_INTERNAL_ENTITY_ID
        );
    })
}

#[test]
fn cannot_add_schema_to_entity_when_missing_required_prop() {
    with_test_externalities(|| {
        let (_, schema_id, entity_id) = create_class_with_schema_and_entity();
        assert_err!(
            TestModule::add_schema_support_to_entity(
                entity_id,
                schema_id,
                vec![ (1, PropertyValue::Uint32(456)) ]
            ),
            ERROR_MISSING_REQUIRED_PROP
        );
    })
}

#[test]
fn should_add_schema_to_entity_when_all_props_provided() {
    with_test_externalities(|| {
        let (_, schema_id, entity_id) = create_class_with_schema_and_entity();
        assert_ok!(
            TestModule::add_schema_support_to_entity(
                entity_id,
                schema_id,
                vec![
                    bool_prop_value(),
                    (1, PropertyValue::Uint32(123)),
                ]
            )
        );
    })
}

#[test]
fn should_add_schema_to_entity_when_optional_props_not_provided() {
    with_test_externalities(|| {
        let (_, schema_id, entity_id) = create_class_with_schema_and_entity();
        assert_ok!(
            TestModule::add_schema_support_to_entity(
                entity_id,
                schema_id,
                vec![
                    bool_prop_value(),
                ]
            )
        );
    })
}

// Update entity properties
// --------------------------------------

#[test]
fn cannot_update_entity_props_when_entity_not_found() {
    with_test_externalities(|| {
        assert_entity_not_found(
            TestModule::update_entity_properties(
                UNKNOWN_ENTITY_ID,
                vec![]
            )
        );
    })
}

// #[test]
// fn cannot_update_entity_props_when_entity_has_no_schemas() {
//     with_test_externalities(|| {
//         // TODO ERROR_ENTITY_HAS_NO_SCHEMAS
//     })
// }

// #[test]
// fn cannot_update_entity_props_when_prop_value_dont_match_type() {
//     with_test_externalities(|| {
//         // TODO ERROR_PROP_VALUE_DONT_MATCH_TYPE
//     })
// }

// #[test]
// fn cannot_update_entity_props_when_unknown_internal_entity_id() {
//     with_test_externalities(|| {
//         // TODO ERROR_UNKNOWN_INTERNAL_ENTITY_ID
//     })
// }

// #[test]
// fn cannot_update_entity_props_when_unknown_class_prop_id() {
//     with_test_externalities(|| {
//         // TODO ERROR_UNKNOWN_CLASS_PROP_ID
//     })
// }

// #[test]
// fn cannot_update_entity_props_when_unknown_entity_prop_id() {
//     with_test_externalities(|| {
//         // TODO ERROR_UNKNOWN_ENTITY_PROP_ID
//     })
// }

// #[test]
// fn update_entity_props_successfully() {
//     with_test_externalities(|| {
//         // TODO 
//     })
// }

// Remove entity properties
// --------------------------------------

#[test]
fn cannot_remove_entity_props_when_entity_not_found() {
    with_test_externalities(|| {
        assert_entity_not_found(
            TestModule::remove_entity_properties(
                UNKNOWN_ENTITY_ID,
                vec![],
            )
        );
    })
}

// #[test]
// fn cannot_remove_entity_props_when_no_entity_prop_ids_provided() {
//     with_test_externalities(|| {
//         // TODO ERROR_NO_ENTITY_PROP_IDS_ON_REMOVE
//     })
// }

// #[test]
// fn remove_entity_props_successfully() {
//     with_test_externalities(|| {
//         // TODO 
//     })
// }

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
fn cannot_delete_entity_when_entity_not_found() {
    with_test_externalities(|| {
        assert_entity_not_found(
            TestModule::delete_entity(UNKNOWN_ENTITY_ID)
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
