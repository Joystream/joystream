#![cfg(test)]

use super::*;
use crate::mock::*;
use core::iter::FromIterator;
use rstd::collections::btree_set::BTreeSet;
use srml_support::{assert_err, assert_ok};

#[test]
fn create_class_then_entity_with_default_class() {
    with_test_externalities(|| {
        // Only authorized accounts can create classes
        assert_err!(
            TestModule::create_class_with_default_permissions(
                Origin::signed(UNAUTHORIZED_CLASS_PERMISSIONS_CREATOR),
                b"class_name".to_vec(),
                b"class_description".to_vec(),
            ),
            "NotPermittedToCreateClass"
        );

        let class_id = create_simple_class_with_default_permissions();

        assert!(<ClassById<Runtime>>::exists(class_id));

        assert_eq!(TestModule::next_class_id(), class_id + 1);

        // default class permissions have empty add_schema acl
        assert_err!(
            TestModule::add_class_schema(
                Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ZERO),
                Some(0),
                class_id,
                vec![],
                simple_test_schema()
            ),
            "NotInAddSchemasSet"
        );

        // attemt to add class schema to nonexistent class
        assert_err!(
            TestModule::add_class_schema(
                Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ZERO),
                Some(0),
                class_id + 1,
                vec![],
                simple_test_schema()
            ),
            ERROR_CLASS_NOT_FOUND
        );

        // give members of GROUP_ZERO permission to add schemas
        let add_schema_set = CredentialSet::from(vec![0]);
        assert_ok!(TestModule::set_class_add_schemas_set(
            Origin::ROOT,
            None,
            class_id,
            add_schema_set
        ));

        // successfully add a new schema
        assert_ok!(TestModule::add_class_schema(
            Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ZERO),
            Some(0),
            class_id,
            vec![],
            simple_test_schema()
        ));

        // System can always create entities (provided class exists) bypassing any permissions
        let entity_id_1 = next_entity_id();
        assert_ok!(TestModule::create_entity(Origin::ROOT, None, class_id,));
        // entities created by system are "un-owned"
        assert!(!<EntityMaintainerByEntityId<Runtime>>::exists(entity_id_1));
        assert_eq!(
            TestModule::entity_maintainer_by_entity_id(entity_id_1),
            None
        );

        assert_eq!(TestModule::next_entity_id(), entity_id_1 + 1);

        // default permissions have empty create_entities set and by default no entities can be created
        assert_err!(
            TestModule::create_entity(
                Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
                Some(1),
                class_id,
            ),
            "EntitiesCannotBeCreated"
        );

        assert_ok!(TestModule::set_class_entities_can_be_created(
            Origin::ROOT,
            None,
            class_id,
            true
        ));

        assert_err!(
            TestModule::create_entity(
                Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
                Some(1),
                class_id,
            ),
            "NotInCreateEntitiesSet"
        );

        // give members of GROUP_ONE permission to create entities
        let create_entities_set = CredentialSet::from(vec![1]);
        assert_ok!(TestModule::set_class_create_entities_set(
            Origin::ROOT,
            None,
            class_id,
            create_entities_set
        ));

        let entity_id_2 = next_entity_id();
        assert_ok!(TestModule::create_entity(
            Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
            Some(1),
            class_id,
        ));

        assert!(<EntityMaintainerByEntityId<Runtime>>::exists(entity_id_2));
        assert_eq!(
            TestModule::entity_maintainer_by_entity_id(entity_id_2),
            Some(1)
        );

        assert_eq!(TestModule::next_entity_id(), entity_id_2 + 1);

        // Updating entity must be authorized
        assert_err!(
            TestModule::add_schema_support_to_entity(
                Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ZERO),
                Some(0),
                false, // not claiming to be entity maintainer
                entity_id_2,
                0, // first schema created
                simple_test_entity_property_values()
            ),
            "CredentialNotInEntityPermissionsUpdateSet"
        );

        // default permissions give entity maintainer permission to update and delete
        assert_ok!(TestModule::add_schema_support_to_entity(
            Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
            Some(1),
            true, // we are claiming to be the entity maintainer
            entity_id_2,
            0,
            simple_test_entity_property_values()
        ));
        assert_ok!(TestModule::update_entity_property_values(
            Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
            Some(1),
            true, // we are claiming to be the entity maintainer
            entity_id_2,
            simple_test_entity_property_values()
        ));
    })
}

#[test]
fn cannot_create_class_with_empty_name() {
    with_test_externalities(|| {
        let empty_name = vec![];
        assert_err!(
            TestModule::create_class_with_default_permissions(
                Origin::signed(CLASS_PERMISSIONS_CREATOR1),
                empty_name,
                good_class_description(),
            ),
            ERROR_CLASS_NAME_TOO_SHORT
        );
    })
}

#[test]
fn create_class_with_empty_description() {
    with_test_externalities(|| {
        let empty_description = vec![];
        assert_ok!(TestModule::create_class_with_default_permissions(
            Origin::signed(CLASS_PERMISSIONS_CREATOR1),
            good_class_name(),
            empty_description
        ));
    })
}

#[test]
fn cannot_create_entity_with_unknown_class_id() {
    with_test_externalities(|| {
        assert_err!(
            TestModule::create_entity(
                Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
                Some(1),
                UNKNOWN_CLASS_ID,
            ),
            ERROR_CLASS_NOT_FOUND
        );
    })
}

#[test]
fn class_set_admins() {
    with_test_externalities(|| {
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_minimal());
        let class = TestModule::class_by_id(class_id);

        assert!(class.get_permissions().admins.is_empty());

        let credential_set = CredentialSet::from(vec![1]);

        // only root should be able to set admins
        assert_err!(
            TestModule::set_class_admins(Origin::signed(1), class_id, credential_set.clone()),
            "NotRootOrigin"
        );
        assert_err!(
            TestModule::set_class_admins(
                Origin::NONE, //unsigned inherent?
                class_id,
                credential_set.clone()
            ),
            "BadOrigin:ExpectedRootOrSigned"
        );

        // root origin can set admins
        assert_ok!(TestModule::set_class_admins(
            Origin::ROOT,
            class_id,
            credential_set.clone()
        ));

        let class = TestModule::class_by_id(class_id);
        assert_eq!(class.get_permissions().admins, credential_set);
    })
}

#[test]
fn class_set_add_schemas_set() {
    with_test_externalities(|| {
        const ADMIN_ACCOUNT: u64 = MEMBER_ONE_WITH_CREDENTIAL_ZERO;
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_minimal_with_admins(vec![0]));
        let class = TestModule::class_by_id(class_id);

        assert!(class.get_permissions().add_schemas.is_empty());

        let credential_set1 = CredentialSet::from(vec![1, 2]);
        let credential_set2 = CredentialSet::from(vec![3, 4]);

        // root
        assert_ok!(TestModule::set_class_add_schemas_set(
            Origin::ROOT,
            None,
            class_id,
            credential_set1.clone()
        ));
        let class = TestModule::class_by_id(class_id);
        assert_eq!(class.get_permissions().add_schemas, credential_set1);

        // admins
        assert_ok!(TestModule::set_class_add_schemas_set(
            Origin::signed(ADMIN_ACCOUNT),
            Some(0),
            class_id,
            credential_set2.clone()
        ));
        let class = TestModule::class_by_id(class_id);
        assert_eq!(class.get_permissions().add_schemas, credential_set2);

        // non-admins
        assert_err!(
            TestModule::set_class_add_schemas_set(
                Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
                Some(1),
                class_id,
                credential_set2.clone()
            ),
            "NotInAdminsSet"
        );
    })
}

#[test]
fn class_set_class_create_entities_set() {
    with_test_externalities(|| {
        const ADMIN_ACCOUNT: u64 = MEMBER_ONE_WITH_CREDENTIAL_ZERO;
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_minimal_with_admins(vec![0]));
        let class = TestModule::class_by_id(class_id);

        assert!(class.get_permissions().create_entities.is_empty());

        let credential_set1 = CredentialSet::from(vec![1, 2]);
        let credential_set2 = CredentialSet::from(vec![3, 4]);

        // root
        assert_ok!(TestModule::set_class_create_entities_set(
            Origin::ROOT,
            None,
            class_id,
            credential_set1.clone()
        ));
        let class = TestModule::class_by_id(class_id);
        assert_eq!(class.get_permissions().create_entities, credential_set1);

        // admins
        assert_ok!(TestModule::set_class_create_entities_set(
            Origin::signed(ADMIN_ACCOUNT),
            Some(0),
            class_id,
            credential_set2.clone()
        ));
        let class = TestModule::class_by_id(class_id);
        assert_eq!(class.get_permissions().create_entities, credential_set2);

        // non-admins
        assert_err!(
            TestModule::set_class_create_entities_set(
                Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
                Some(1),
                class_id,
                credential_set2.clone()
            ),
            "NotInAdminsSet"
        );
    })
}

#[test]
fn class_set_class_entities_can_be_created() {
    with_test_externalities(|| {
        const ADMIN_ACCOUNT: u64 = MEMBER_ONE_WITH_CREDENTIAL_ZERO;
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_minimal_with_admins(vec![0]));
        let class = TestModule::class_by_id(class_id);

        assert_eq!(class.get_permissions().entities_can_be_created, false);

        // root
        assert_ok!(TestModule::set_class_entities_can_be_created(
            Origin::ROOT,
            None,
            class_id,
            true
        ));
        let class = TestModule::class_by_id(class_id);
        assert_eq!(class.get_permissions().entities_can_be_created, true);

        // admins
        assert_ok!(TestModule::set_class_entities_can_be_created(
            Origin::signed(ADMIN_ACCOUNT),
            Some(0),
            class_id,
            false
        ));
        let class = TestModule::class_by_id(class_id);
        assert_eq!(class.get_permissions().entities_can_be_created, false);

        // non-admins
        assert_err!(
            TestModule::set_class_entities_can_be_created(
                Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
                Some(1),
                class_id,
                true
            ),
            "NotInAdminsSet"
        );
    })
}

#[test]
fn class_set_class_entity_permissions() {
    with_test_externalities(|| {
        const ADMIN_ACCOUNT: u64 = MEMBER_ONE_WITH_CREDENTIAL_ZERO;
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_minimal_with_admins(vec![0]));
        let class = TestModule::class_by_id(class_id);

        assert!(class.get_permissions().entity_permissions.update.is_empty());

        let entity_permissions1 = EntityPermissions {
            update: CredentialSet::from(vec![1]),
            maintainer_has_all_permissions: true,
        };

        //root
        assert_ok!(TestModule::set_class_entity_permissions(
            Origin::ROOT,
            None,
            class_id,
            entity_permissions1.clone()
        ));
        let class = TestModule::class_by_id(class_id);
        assert_eq!(
            class.get_permissions().entity_permissions,
            entity_permissions1
        );

        let entity_permissions2 = EntityPermissions {
            update: CredentialSet::from(vec![4]),
            maintainer_has_all_permissions: true,
        };
        //admins
        assert_ok!(TestModule::set_class_entity_permissions(
            Origin::signed(ADMIN_ACCOUNT),
            Some(0),
            class_id,
            entity_permissions2.clone()
        ));
        let class = TestModule::class_by_id(class_id);
        assert_eq!(
            class.get_permissions().entity_permissions,
            entity_permissions2
        );

        // non admins
        assert_err!(
            TestModule::set_class_entity_permissions(
                Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
                Some(1),
                class_id,
                entity_permissions2.clone()
            ),
            "NotInAdminsSet"
        );
    })
}

#[test]
fn class_set_class_reference_constraint() {
    with_test_externalities(|| {
        const ADMIN_ACCOUNT: u64 = MEMBER_ONE_WITH_CREDENTIAL_ZERO;
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_minimal_with_admins(vec![0]));
        let class = TestModule::class_by_id(class_id);

        assert_eq!(
            class.get_permissions().reference_constraint,
            Default::default()
        );

        let mut constraints_set = BTreeSet::new();
        constraints_set.insert(PropertyOfClass {
            class_id: 1,
            property_index: 0,
        });
        let reference_constraint1 = ReferenceConstraint::Restricted(constraints_set);

        //root
        assert_ok!(TestModule::set_class_reference_constraint(
            Origin::ROOT,
            None,
            class_id,
            reference_constraint1.clone()
        ));
        let class = TestModule::class_by_id(class_id);
        assert_eq!(
            class.get_permissions().reference_constraint,
            reference_constraint1
        );

        let mut constraints_set = BTreeSet::new();
        constraints_set.insert(PropertyOfClass {
            class_id: 2,
            property_index: 2,
        });
        let reference_constraint2 = ReferenceConstraint::Restricted(constraints_set);

        //admins
        assert_ok!(TestModule::set_class_reference_constraint(
            Origin::signed(ADMIN_ACCOUNT),
            Some(0),
            class_id,
            reference_constraint2.clone()
        ));
        let class = TestModule::class_by_id(class_id);
        assert_eq!(
            class.get_permissions().reference_constraint,
            reference_constraint2
        );

        // non admins
        assert_err!(
            TestModule::set_class_reference_constraint(
                Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
                Some(1),
                class_id,
                reference_constraint2.clone()
            ),
            "NotInAdminsSet"
        );
    })
}

#[test]
fn batch_transaction_simple() {
    with_test_externalities(|| {
        const CREDENTIAL_ONE: u64 = 1;

        let new_class_id = create_simple_class(ClassPermissions {
            entities_can_be_created: true,
            create_entities: vec![CREDENTIAL_ONE].into(),
            reference_constraint: ReferenceConstraint::NoConstraint,
            ..Default::default()
        });

        let new_properties = vec![Property {
            prop_type: PropertyType::Reference(new_class_id),
            required: true,
            name: b"entity".to_vec(),
            description: b"another entity of same class".to_vec(),
        }];

        assert_ok!(TestModule::add_class_schema(
            Origin::ROOT,
            None,
            new_class_id,
            vec![],
            new_properties
        ));

        let operations = vec![
            Operation {
                with_credential: Some(CREDENTIAL_ONE),
                as_entity_maintainer: false,
                operation_type: OperationType::CreateEntity(CreateEntityOperation {
                    class_id: new_class_id,
                }),
            },
            Operation {
                with_credential: Some(CREDENTIAL_ONE),
                as_entity_maintainer: true, // in prior operation CREDENTIAL_ONE became the maintainer
                operation_type: OperationType::AddSchemaSupportToEntity(
                    AddSchemaSupportToEntityOperation {
                        entity_id: ParameterizedEntity::InternalEntityJustAdded(0), // index 0 (prior operation)
                        schema_id: 0,
                        parametrized_property_values: vec![ParametrizedClassPropertyValue {
                            in_class_index: 0,
                            value: ParametrizedPropertyValue::InternalEntityJustAdded(0),
                        }],
                    },
                ),
            },
            Operation {
                with_credential: Some(CREDENTIAL_ONE),
                as_entity_maintainer: false,
                operation_type: OperationType::CreateEntity(CreateEntityOperation {
                    class_id: new_class_id,
                }),
            },
            Operation {
                with_credential: Some(CREDENTIAL_ONE),
                as_entity_maintainer: true, // in prior operation CREDENTIAL_ONE became the maintainer
                operation_type: OperationType::UpdatePropertyValues(
                    UpdatePropertyValuesOperation {
                        entity_id: ParameterizedEntity::InternalEntityJustAdded(0), // index 0 (prior operation)
                        new_parametrized_property_values: vec![ParametrizedClassPropertyValue {
                            in_class_index: 0,
                            value: ParametrizedPropertyValue::InternalEntityJustAdded(2),
                        }],
                    },
                ),
            },
        ];

        let entity_id = next_entity_id();

        assert_ok!(TestModule::transaction(
            Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
            operations
        ));

        // two entities created
        assert!(<EntityById<Runtime>>::exists(entity_id));
        assert!(<EntityById<Runtime>>::exists(entity_id + 1));
    })
}

#[test]
fn batch_transaction_vector_of_entities() {
    with_test_externalities(|| {
        const CREDENTIAL_ONE: u64 = 1;

        let new_class_id = create_simple_class(ClassPermissions {
            entities_can_be_created: true,
            create_entities: vec![CREDENTIAL_ONE].into(),
            reference_constraint: ReferenceConstraint::NoConstraint,
            ..Default::default()
        });

        let new_properties = vec![Property {
            prop_type: PropertyType::ReferenceVec(10, new_class_id),
            required: true,
            name: b"entities".to_vec(),
            description: b"vector of entities of same class".to_vec(),
        }];

        assert_ok!(TestModule::add_class_schema(
            Origin::ROOT,
            None,
            new_class_id,
            vec![],
            new_properties
        ));

        let operations = vec![
            Operation {
                with_credential: Some(CREDENTIAL_ONE),
                as_entity_maintainer: false,
                operation_type: OperationType::CreateEntity(CreateEntityOperation {
                    class_id: new_class_id,
                }),
            },
            Operation {
                with_credential: Some(CREDENTIAL_ONE),
                as_entity_maintainer: false,
                operation_type: OperationType::CreateEntity(CreateEntityOperation {
                    class_id: new_class_id,
                }),
            },
            Operation {
                with_credential: Some(CREDENTIAL_ONE),
                as_entity_maintainer: false,
                operation_type: OperationType::CreateEntity(CreateEntityOperation {
                    class_id: new_class_id,
                }),
            },
            Operation {
                with_credential: Some(CREDENTIAL_ONE),
                as_entity_maintainer: true, // in prior operation CREDENTIAL_ONE became the maintainer
                operation_type: OperationType::AddSchemaSupportToEntity(
                    AddSchemaSupportToEntityOperation {
                        entity_id: ParameterizedEntity::InternalEntityJustAdded(0),
                        schema_id: 0,
                        parametrized_property_values: vec![ParametrizedClassPropertyValue {
                            in_class_index: 0,
                            value: ParametrizedPropertyValue::InternalEntityVec(vec![
                                ParameterizedEntity::InternalEntityJustAdded(1),
                                ParameterizedEntity::InternalEntityJustAdded(2),
                            ]),
                        }],
                    },
                ),
            },
        ];

        let entity_id = next_entity_id();

        assert_ok!(TestModule::transaction(
            Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
            operations
        ));

        // three entities created
        assert!(<EntityById<Runtime>>::exists(entity_id));
        assert!(<EntityById<Runtime>>::exists(entity_id + 1));
        assert!(<EntityById<Runtime>>::exists(entity_id + 2));

        assert_eq!(
            TestModule::entity_by_id(entity_id),
            Entity::new(
                new_class_id,
                BTreeSet::from_iter(vec![SCHEMA_ID_0].into_iter()),
                prop_value(
                    0,
                    PropertyValue::ReferenceVec(
                        vec![entity_id + 1, entity_id + 2,],
                        <Runtime as Trait>::Nonce::default()
                    )
                )
            )
        );
    })
}

// Add class schema
// --------------------------------------

#[test]
fn cannot_add_schema_to_unknown_class() {
    with_test_externalities(|| {
        assert_err!(
            TestModule::append_class_schema(UNKNOWN_CLASS_ID, good_prop_ids(), good_props()),
            ERROR_CLASS_NOT_FOUND
        );
    })
}

#[test]
fn cannot_add_class_schema_when_no_props_passed() {
    with_test_externalities(|| {
        let class_id = create_simple_class_with_default_permissions();
        assert_err!(
            TestModule::append_class_schema(class_id, vec![], vec![]),
            ERROR_NO_PROPS_IN_CLASS_SCHEMA
        );
    })
}

#[test]
fn cannot_add_class_schema_when_it_refers_unknown_prop_index_and_class_has_no_props() {
    with_test_externalities(|| {
        let class_id = create_simple_class_with_default_permissions();
        assert_err!(
            TestModule::append_class_schema(class_id, vec![UNKNOWN_PROP_ID], vec![]),
            ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_PROP_INDEX
        );
    })
}

#[test]
fn cannot_add_class_schema_when_it_refers_unknown_prop_index() {
    with_test_externalities(|| {
        let class_id = create_simple_class_with_default_permissions();

        assert_eq!(
            TestModule::append_class_schema(class_id, vec![], good_props()),
            Ok(SCHEMA_ID_0)
        );

        // Try to add a new schema that is based on one valid prop ids
        // plus another prop id is unknown on this class.
        assert_err!(
            TestModule::append_class_schema(class_id, vec![0, UNKNOWN_PROP_ID], vec![]),
            ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_PROP_INDEX
        );

        // Verify that class props and schemas remain unchanged:
        assert_class_props(class_id, good_props());
        assert_class_schemas(class_id, vec![good_prop_ids()]);
    })
}

#[test]
fn cannot_add_class_schema_when_it_refers_unknown_internal_id() {
    with_test_externalities(|| {
        let class_id = create_simple_class_with_default_permissions();
        let bad_internal_prop = new_reference_class_prop(UNKNOWN_CLASS_ID);

        assert_err!(
            TestModule::append_class_schema(
                class_id,
                vec![],
                vec![good_prop_bool(), bad_internal_prop]
            ),
            ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_INTERNAL_ID
        );
    })
}

#[test]
fn should_add_class_schema_with_internal_class_prop() {
    with_test_externalities(|| {
        let class_id = create_simple_class_with_default_permissions();
        let internal_class_prop = new_reference_class_prop(class_id);

        // Add first schema with new props.
        // No other props on the class at this time.
        assert_eq!(
            TestModule::append_class_schema(class_id, vec![], vec![internal_class_prop.clone()]),
            Ok(SCHEMA_ID_0)
        );

        assert_class_props(class_id, vec![internal_class_prop]);
        assert_class_schemas(class_id, vec![vec![SCHEMA_ID_0]]);
    })
}

#[test]
fn should_add_class_schema_when_only_new_props_passed() {
    with_test_externalities(|| {
        let class_id = create_simple_class_with_default_permissions();

        // Add first schema with new props.
        // No other props on the class at this time.
        assert_eq!(
            TestModule::append_class_schema(class_id, vec![], good_props()),
            Ok(SCHEMA_ID_0)
        );

        assert_class_props(class_id, good_props());
        assert_class_schemas(class_id, vec![good_prop_ids()]);
    })
}

#[test]
fn should_add_class_schema_when_only_prop_ids_passed() {
    with_test_externalities(|| {
        let class_id = create_simple_class_with_default_permissions();

        // Add first schema with new props.
        // No other props on the class at this time.
        assert_eq!(
            TestModule::append_class_schema(class_id, vec![], good_props()),
            Ok(SCHEMA_ID_0)
        );

        // Add a new schema that is based solely on the props ids
        // of the previously added schema.
        assert_eq!(
            TestModule::append_class_schema(class_id, good_prop_ids(), vec![]),
            Ok(SCHEMA_ID_1)
        );
    })
}

#[test]
fn cannot_add_class_schema_when_new_props_have_duplicate_names() {
    with_test_externalities(|| {
        let class_id = create_simple_class_with_default_permissions();

        // Add first schema with new props.
        // No other props on the class at this time.
        assert_eq!(
            TestModule::append_class_schema(class_id, vec![], good_props()),
            Ok(SCHEMA_ID_0)
        );

        // Add a new schema with not unique property names:
        assert_err!(
            TestModule::append_class_schema(class_id, vec![], good_props()),
            ERROR_PROP_NAME_NOT_UNIQUE_IN_CLASS
        );
    })
}

#[test]
fn should_add_class_schema_when_both_prop_ids_and_new_props_passed() {
    with_test_externalities(|| {
        let class_id = create_simple_class_with_default_permissions();

        // Add first schema with new props.
        // No other props on the class at this time.
        assert_eq!(
            TestModule::append_class_schema(
                class_id,
                vec![],
                vec![good_prop_bool(), good_prop_u32()]
            ),
            Ok(SCHEMA_ID_0)
        );

        // Add a new schema that is based on some prop ids
        // added with previous schema plus some new props,
        // introduced by this new schema.
        assert_eq!(
            TestModule::append_class_schema(class_id, vec![1], vec![good_prop_text()]),
            Ok(SCHEMA_ID_1)
        );

        assert_class_props(
            class_id,
            vec![good_prop_bool(), good_prop_u32(), good_prop_text()],
        );

        assert_class_schemas(class_id, vec![vec![0, 1], vec![1, 2]]);
    })
}

// Update class schema status
// --------------------------------------

#[test]
fn update_class_schema_status_success() {
    with_test_externalities(|| {
        let (class_id, schema_id) = create_class_with_schema();

        // Check given class schema status before update performed
        assert_eq!(
            TestModule::class_by_id(class_id).is_active_schema(schema_id),
            true
        );

        // Give members of GROUP_ZERO permission to add schemas
        let update_schema_set = CredentialSet::from(vec![0]);
        assert_ok!(TestModule::set_class_update_schemas_status_set(
            Origin::ROOT,
            None,
            class_id,
            update_schema_set
        ));

        // Make class schema under given index inactive.
        assert_ok!(TestModule::update_class_schema_status(
            Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ZERO),
            Some(0),
            class_id,
            schema_id,
            false
        ));

        // Check given class schema status after update performed
        assert_eq!(
            TestModule::class_by_id(class_id).is_active_schema(schema_id),
            false
        );
    })
}

#[test]
fn update_class_schema_status_class_not_found() {
    with_test_externalities(|| {
        // attemt to update class schema of nonexistent class
        assert_err!(
            TestModule::update_class_schema_status(
                Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ZERO),
                Some(0),
                UNKNOWN_CLASS_ID,
                UNKNOWN_SCHEMA_ID,
                false
            ),
            ERROR_CLASS_NOT_FOUND
        );
    })
}

#[test]
fn update_class_schema_status_not_in_update_class_schema_status_set() {
    with_test_externalities(|| {
        let (class_id, schema_id) = create_class_with_schema();

        // Check given class schema status before update performed
        assert_eq!(
            TestModule::class_by_id(class_id).is_active_schema(schema_id),
            true
        );

        // attemt to update class schema of nonexistent schema
        assert_err!(
            TestModule::update_class_schema_status(
                Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ZERO),
                Some(0),
                class_id,
                schema_id,
                false
            ),
            "NotInUpdateSchemasStatusSet"
        );

        // Check given class schema status after update performed
        assert_eq!(
            TestModule::class_by_id(class_id).is_active_schema(schema_id),
            true
        );
    })
}

#[test]
fn update_class_schema_status_schema_not_found() {
    with_test_externalities(|| {
        let class_id = create_simple_class_with_default_permissions();

        // give members of GROUP_ZERO permission to update schemas
        let update_schema_set = CredentialSet::from(vec![0]);
        assert_ok!(TestModule::set_class_update_schemas_status_set(
            Origin::ROOT,
            None,
            class_id,
            update_schema_set
        ));

        // attemt to update class schema of nonexistent class
        assert_err!(
            TestModule::update_class_schema_status(
                Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ZERO),
                Some(0),
                class_id,
                UNKNOWN_SCHEMA_ID,
                false
            ),
            ERROR_UNKNOWN_CLASS_SCHEMA_ID
        );
    })
}

// Add schema support to entity
// --------------------------------------

#[test]
fn cannot_add_schema_to_entity_when_entity_not_found() {
    with_test_externalities(|| {
        assert_entity_not_found(TestModule::add_entity_schema_support(
            UNKNOWN_ENTITY_ID,
            1,
            BTreeMap::new(),
        ));
    })
}

#[test]
fn cannot_add_schema_to_entity_when_schema_is_not_active() {
    with_test_externalities(|| {
        let (class_id, schema_id, entity_id) = create_class_with_schema_and_entity();

        // Firstly we make class schema under given index inactive.
        assert_ok!(TestModule::complete_class_schema_status_update(
            class_id, schema_id, false
        ));

        // Secondly we try to add support for the same schema.
        assert_err!(
            TestModule::add_entity_schema_support(entity_id, schema_id, bool_prop_value()),
            ERROR_CLASS_SCHEMA_NOT_ACTIVE
        );
    })
}

#[test]
fn cannot_add_schema_to_entity_when_schema_already_added_to_entity() {
    with_test_externalities(|| {
        let (_, schema_id, entity_id) = create_class_with_schema_and_entity();

        // Firstly we just add support for a valid class schema.
        assert_ok!(TestModule::add_entity_schema_support(
            entity_id,
            schema_id,
            bool_prop_value()
        ));

        // Secondly we try to add support for the same schema.
        assert_err!(
            TestModule::add_entity_schema_support(entity_id, schema_id, BTreeMap::new()),
            ERROR_SCHEMA_ALREADY_ADDED_TO_ENTITY
        );
    })
}

#[test]
fn cannot_add_schema_to_entity_when_schema_id_is_unknown() {
    with_test_externalities(|| {
        let (_, schema_id, entity_id) = create_class_with_schema_and_entity();
        let unknown_schema_id = schema_id + 1;
        assert_err!(
            TestModule::add_entity_schema_support(
                entity_id,
                unknown_schema_id,
                prop_value(0, PropertyValue::Bool(false))
            ),
            ERROR_UNKNOWN_CLASS_SCHEMA_ID
        );
    })
}

#[test]
fn cannot_add_schema_to_entity_when_prop_value_dont_match_type() {
    with_test_externalities(|| {
        let (_, schema_id, entity_id) = create_class_with_schema_and_entity();
        let mut prop_values = bool_prop_value();
        prop_values.insert(PROP_ID_U32, PropertyValue::Bool(true));
        assert_err!(
            TestModule::add_entity_schema_support(entity_id, schema_id, prop_values),
            ERROR_PROP_VALUE_DONT_MATCH_TYPE
        );
    })
}

#[test]
fn cannot_add_schema_to_entity_when_unknown_internal_entity_id() {
    with_test_externalities(|| {
        let (_, schema_id, entity_id) = create_class_with_schema_and_entity();
        let mut prop_values = bool_prop_value();
        prop_values.insert(
            PROP_ID_REFERENCE,
            PropertyValue::Reference(UNKNOWN_ENTITY_ID),
        );
        assert_err!(
            TestModule::add_entity_schema_support(entity_id, schema_id, prop_values),
            ERROR_ENTITY_NOT_FOUND
        );
    })
}

#[test]
fn cannot_add_schema_to_entity_when_missing_required_prop() {
    with_test_externalities(|| {
        let (_, schema_id, entity_id) = create_class_with_schema_and_entity();
        assert_err!(
            TestModule::add_entity_schema_support(
                entity_id,
                schema_id,
                prop_value(PROP_ID_U32, PropertyValue::Uint32(456))
            ),
            ERROR_MISSING_REQUIRED_PROP
        );
    })
}

#[test]
fn should_add_schema_to_entity_when_some_optional_props_provided() {
    with_test_externalities(|| {
        let (_, schema_id, entity_id) = create_class_with_schema_and_entity();
        let mut prop_values = bool_prop_value();
        prop_values.insert(PROP_ID_U32, PropertyValue::Uint32(123));
        assert_ok!(TestModule::add_entity_schema_support(
            entity_id,
            schema_id,
            // Note that an optional internal prop is not provided here.
            prop_values.clone()
        ));

        let entity = TestModule::entity_by_id(entity_id);
        assert_eq!(
            entity.supported_schemas,
            BTreeSet::from_iter(vec![SCHEMA_ID_0].into_iter())
        );
        prop_values.insert(PROP_ID_REFERENCE, PropertyValue::Bool(false));
        prop_values.insert(PROP_ID_U32_VEC, PropertyValue::Bool(false));
        assert_eq!(entity.values, prop_values);
    })
}

// Update entity properties
// --------------------------------------

#[test]
fn update_entity_props_successfully() {
    with_test_externalities(|| {
        let entity_id = create_entity_with_schema_support();
        let mut prop_values = prop_value(PROP_ID_BOOL, PropertyValue::Bool(true));
        prop_values.insert(PROP_ID_U32, PropertyValue::Bool(false));
        prop_values.insert(PROP_ID_REFERENCE, PropertyValue::Bool(false));
        prop_values.insert(
            PROP_ID_U32_VEC,
            PropertyValue::Uint32Vec(vec![123, 234, 44], <Runtime as Trait>::Nonce::default()),
        );
        assert_eq!(TestModule::entity_by_id(entity_id).values, prop_values);
        prop_values = prop_value(PROP_ID_BOOL, PropertyValue::Bool(false));
        prop_values.insert(PROP_ID_U32, PropertyValue::Uint32(123));
        prop_values.insert(PROP_ID_REFERENCE, PropertyValue::Reference(entity_id));
        prop_values.insert(
            PROP_ID_U32_VEC,
            PropertyValue::Uint32Vec(vec![123, 234, 44, 88, 43], <Runtime as Trait>::Nonce::one()),
        );
        assert_ok!(TestModule::complete_entity_property_values_update(
            entity_id,
            prop_values.clone()
        ));
        assert_eq!(TestModule::entity_by_id(entity_id).values, prop_values);
    })
}

#[test]
fn cannot_update_entity_props_when_entity_not_found() {
    with_test_externalities(|| {
        assert_entity_not_found(TestModule::complete_entity_property_values_update(
            UNKNOWN_ENTITY_ID,
            BTreeMap::new(),
        ));
    })
}

#[test]
fn cannot_update_entity_props_when_prop_value_dont_match_type() {
    with_test_externalities(|| {
        let entity_id = create_entity_with_schema_support();
        assert_err!(
            TestModule::complete_entity_property_values_update(
                entity_id,
                prop_value(PROP_ID_BOOL, PropertyValue::Uint32(1))
            ),
            ERROR_PROP_VALUE_DONT_MATCH_TYPE
        );
    })
}

#[test]
fn cannot_update_entity_props_when_unknown_internal_entity_id() {
    with_test_externalities(|| {
        let entity_id = create_entity_with_schema_support();
        assert_err!(
            TestModule::complete_entity_property_values_update(
                entity_id,
                prop_value(
                    PROP_ID_REFERENCE,
                    PropertyValue::Reference(UNKNOWN_ENTITY_ID)
                )
            ),
            ERROR_ENTITY_NOT_FOUND
        );
    })
}

#[test]
fn cannot_update_entity_props_when_unknown_entity_prop_id() {
    with_test_externalities(|| {
        let entity_id = create_entity_with_schema_support();
        assert_err!(
            TestModule::complete_entity_property_values_update(
                entity_id,
                prop_value(UNKNOWN_PROP_ID, PropertyValue::Bool(true))
            ),
            ERROR_UNKNOWN_ENTITY_PROP_ID
        );
    })
}

// Entity property vector cleaning
// --------------------------------------

#[test]
fn complete_entity_property_vector_cleaning_successfully() {
    with_test_externalities(|| {
        let entity_id = create_entity_with_schema_support();
        let mut prop_values = prop_value(PROP_ID_BOOL, PropertyValue::Bool(true));
        prop_values.insert(PROP_ID_U32, PropertyValue::Bool(false));
        prop_values.insert(
            PROP_ID_U32_VEC,
            PropertyValue::Uint32Vec(vec![123, 234, 44], <Runtime as Trait>::Nonce::default()),
        );
        prop_values.insert(PROP_ID_REFERENCE, PropertyValue::Bool(false));

        // Check property values runtime storage related to an entity before cleaning of entity property vector value under given schema id
        assert_eq!(TestModule::entity_by_id(entity_id).values, prop_values);

        // Perform cleaning of entity property vector value under given schema id
        assert_ok!(TestModule::complete_entity_property_vector_cleaning(
            entity_id,
            PROP_ID_U32_VEC
        ));

        // Update entity property values to compare with runtime storage entity value under given schema id
        prop_values.insert(
            PROP_ID_U32_VEC,
            PropertyValue::Uint32Vec(vec![], <Runtime as Trait>::Nonce::one()),
        );

        // Check property values runtime storage related to a entity right after
        // cleaning entity property vector under given schema id
        assert_eq!(TestModule::entity_by_id(entity_id).values, prop_values);
    })
}

#[test]
fn cannot_complete_entity_property_vector_cleaning_when_entity_not_found() {
    with_test_externalities(|| {
        assert_entity_not_found(TestModule::complete_entity_property_vector_cleaning(
            UNKNOWN_ENTITY_ID,
            PROP_ID_U32_VEC,
        ));
    })
}

#[test]
fn cannot_complete_entity_property_vector_cleaning_when_unknown_entity_prop_id() {
    with_test_externalities(|| {
        let entity_id = create_entity_with_schema_support();
        assert_err!(
            TestModule::complete_entity_property_vector_cleaning(entity_id, UNKNOWN_PROP_ID),
            ERROR_UNKNOWN_ENTITY_PROP_ID
        );
    })
}

#[test]
fn cannot_complete_entity_property_vector_cleaning_when_entity_prop_id_is_not_a_vector() {
    with_test_externalities(|| {
        let entity_id = create_entity_with_schema_support();
        assert_err!(
            TestModule::complete_entity_property_vector_cleaning(entity_id, PROP_ID_U32),
            ERROR_PROP_VALUE_UNDER_GIVEN_INDEX_IS_NOT_A_VECTOR
        );
    })
}

// Remove at entity property vector
// --------------------------------------

fn complete_remove_at_entity_property_vector() -> EntityId {
    let entity_id = create_entity_with_schema_support();
    let mut prop_values = prop_value(PROP_ID_BOOL, PropertyValue::Bool(true));
    prop_values.insert(PROP_ID_U32, PropertyValue::Bool(false));
    prop_values.insert(
        PROP_ID_U32_VEC,
        PropertyValue::Uint32Vec(vec![123, 234, 44], <Runtime as Trait>::Nonce::default()),
    );
    prop_values.insert(PROP_ID_REFERENCE, PropertyValue::Bool(false));

    // Check property values runtime storage related to an entity before removing at given index of entity property vector value
    assert_eq!(TestModule::entity_by_id(entity_id).values, prop_values);

    // Perform removing at given index of entity property vector value
    assert_ok!(TestModule::complete_remove_at_entity_property_vector(
        entity_id,
        PROP_ID_U32_VEC,
        VALID_PROPERTY_VEC_INDEX,
        ZERO_NONCE
    ));

    // Update entity property values to compare with runtime storage entity value under given schema id
    prop_values.insert(
        PROP_ID_U32_VEC,
        PropertyValue::Uint32Vec(vec![234, 44], <Runtime as Trait>::Nonce::one()),
    );

    // Check property values runtime storage related to a entity right after
    // removing at given index of entity property vector value
    assert_eq!(TestModule::entity_by_id(entity_id).values, prop_values);
    entity_id
}

#[test]
fn complete_remove_at_entity_property_vector_successfully() {
    with_test_externalities(|| {
        let entity_id = complete_remove_at_entity_property_vector();
        // Perform second removal at given index of entity property vector value with new nonce
        assert_ok!(TestModule::complete_remove_at_entity_property_vector(
            entity_id,
            PROP_ID_U32_VEC,
            VALID_PROPERTY_VEC_INDEX,
            FIRST_NONCE
        ));
    })
}

#[test]
fn cannot_complete_remove_at_entity_property_vector_when_entity_not_found() {
    with_test_externalities(|| {
        assert_entity_not_found(TestModule::complete_remove_at_entity_property_vector(
            UNKNOWN_ENTITY_ID,
            PROP_ID_U32_VEC,
            VALID_PROPERTY_VEC_INDEX,
            ZERO_NONCE,
        ));
    })
}

#[test]
fn cannot_complete_remove_at_entity_property_vector_when_unknown_entity_prop_id() {
    with_test_externalities(|| {
        let entity_id = create_entity_with_schema_support();
        assert_err!(
            TestModule::complete_remove_at_entity_property_vector(
                entity_id,
                UNKNOWN_PROP_ID,
                VALID_PROPERTY_VEC_INDEX,
                ZERO_NONCE
            ),
            ERROR_UNKNOWN_ENTITY_PROP_ID
        );
    })
}

#[test]
fn cannot_complete_remove_at_entity_property_vector_when_entity_prop_vector_index_out_of_range() {
    with_test_externalities(|| {
        let entity_id = create_entity_with_schema_support();
        assert_err!(
            TestModule::complete_remove_at_entity_property_vector(
                entity_id,
                PROP_ID_U32,
                INVALID_PROPERTY_VEC_INDEX,
                ZERO_NONCE
            ),
            ERROR_PROP_VALUE_UNDER_GIVEN_INDEX_IS_NOT_A_VECTOR
        );
    })
}

#[test]
fn cannot_complete_remove_at_entity_property_vector_when_entity_prop_id_is_not_a_vector() {
    with_test_externalities(|| {
        let entity_id = create_entity_with_schema_support();
        assert_err!(
            TestModule::complete_remove_at_entity_property_vector(
                entity_id,
                PROP_ID_U32,
                VALID_PROPERTY_VEC_INDEX,
                ZERO_NONCE
            ),
            ERROR_PROP_VALUE_UNDER_GIVEN_INDEX_IS_NOT_A_VECTOR
        );
    })
}

#[test]
fn cannot_complete_remove_at_entity_property_vector_when_already_updated() {
    with_test_externalities(|| {
        let entity_id = complete_remove_at_entity_property_vector();
        assert_err!(
            TestModule::complete_remove_at_entity_property_vector(
                entity_id,
                PROP_ID_U32_VEC,
                VALID_PROPERTY_VEC_INDEX,
                SECOND_NONCE
            ),
            ERROR_PROP_VALUE_VEC_NONCES_DOES_NOT_MATCH
        );
    })
}

#[test]
fn complete_insert_at_entity_property_vector_successfully() {
    with_test_externalities(|| {
        let entity_id = create_entity_with_schema_support();
        let mut prop_values = prop_value(PROP_ID_BOOL, PropertyValue::Bool(true));
        prop_values.insert(PROP_ID_U32, PropertyValue::Bool(false));
        prop_values.insert(
            PROP_ID_U32_VEC,
            PropertyValue::Uint32Vec(vec![123, 234, 44], <Runtime as Trait>::Nonce::default()),
        );
        prop_values.insert(PROP_ID_REFERENCE, PropertyValue::Bool(false));

        // Check property values runtime storage related to an entity before inserting at given index of entity property vector value
        assert_eq!(TestModule::entity_by_id(entity_id).values, prop_values);

        // Perform inserting at given index of entity property vector value
        assert_ok!(TestModule::complete_insert_at_entity_property_vector(
            entity_id,
            PROP_ID_U32_VEC,
            VALID_PROPERTY_VEC_INDEX,
            PropertyValue::Uint32(33),
            ZERO_NONCE
        ));

        // Perform second inserting at given index of entity property vector value with new nonce
        assert_ok!(TestModule::complete_insert_at_entity_property_vector(
            entity_id,
            PROP_ID_U32_VEC,
            VALID_PROPERTY_VEC_INDEX,
            PropertyValue::Uint32(55),
            FIRST_NONCE
        ));

        // Update entity property values to compare with runtime storage entity value under given schema id
        prop_values.insert(
            PROP_ID_U32_VEC,
            PropertyValue::Uint32Vec(vec![55, 33, 123, 234, 44], 2_u32.into()),
        );

        // Check property values runtime storage related to a entity right after
        // inserting at given index of entity property vector value
        assert_eq!(TestModule::entity_by_id(entity_id).values, prop_values);
    })
}

#[test]
fn cannot_complete_insert_at_entity_property_vector_when_entity_not_found() {
    with_test_externalities(|| {
        assert_entity_not_found(TestModule::complete_insert_at_entity_property_vector(
            UNKNOWN_ENTITY_ID,
            PROP_ID_U32_VEC,
            VALID_PROPERTY_VEC_INDEX,
            PropertyValue::Uint32(33),
            ZERO_NONCE,
        ));
    })
}

#[test]
fn cannot_complete_insert_at_entity_property_vector_when_unknown_entity_prop_id() {
    with_test_externalities(|| {
        let entity_id = create_entity_with_schema_support();
        assert_err!(
            TestModule::complete_insert_at_entity_property_vector(
                entity_id,
                UNKNOWN_PROP_ID,
                VALID_PROPERTY_VEC_INDEX,
                PropertyValue::Uint32(33),
                ZERO_NONCE
            ),
            ERROR_UNKNOWN_ENTITY_PROP_ID
        );
    })
}

#[test]
fn cannot_complete_insert_at_entity_property_vector_when_entity_prop_id_is_not_a_vector() {
    with_test_externalities(|| {
        let entity_id = create_entity_with_schema_support();
        assert_err!(
            TestModule::complete_insert_at_entity_property_vector(
                entity_id,
                PROP_ID_U32,
                VALID_PROPERTY_VEC_INDEX,
                PropertyValue::Uint32(17),
                ZERO_NONCE
            ),
            ERROR_PROP_VALUE_UNDER_GIVEN_INDEX_IS_NOT_A_VECTOR
        );
    })
}

#[test]
fn cannot_complete_insert_at_entity_when_entity_prop_value_vector_index_out_of_range() {
    with_test_externalities(|| {
        let entity_id = create_entity_with_schema_support();
        assert_err!(
            TestModule::complete_insert_at_entity_property_vector(
                entity_id,
                PROP_ID_U32_VEC,
                INVALID_PROPERTY_VEC_INDEX,
                PropertyValue::Uint32(33),
                ZERO_NONCE
            ),
            ERROR_ENTITY_PROP_VALUE_VECTOR_INDEX_IS_OUT_OF_RANGE
        );
    })
}

#[test]
fn cannot_complete_insert_at_entity_when_property_type_does_not_match_internal_entity_vector_type()
{
    with_test_externalities(|| {
        let entity_id = create_entity_with_schema_support();
        assert_err!(
            TestModule::complete_insert_at_entity_property_vector(
                entity_id,
                PROP_ID_U32_VEC,
                VALID_PROPERTY_VEC_INDEX,
                PropertyValue::Uint16(33),
                ZERO_NONCE
            ),
            ERROR_PROP_VALUE_TYPE_DOESNT_MATCH_INTERNAL_ENTITY_VECTOR_TYPE
        );
    })
}

#[test]
fn cannot_complete_insert_at_entity_property_vector_when_entity_prop_value_vector_is_too_long() {
    with_test_externalities(|| {
        let (_, schema_id, entity_id) = create_class_with_schema_and_entity();
        let mut property_values = BTreeMap::new();
        property_values.insert(PROP_ID_BOOL, PropertyValue::Bool(true));
        property_values.insert(
            PROP_ID_U32_VEC,
            PropertyValue::Uint32Vec(
                vec![5; PROP_ID_U32_VEC_MAX_LEN as usize],
                <Runtime as Trait>::Nonce::default(),
            ),
        );
        assert_ok!(TestModule::add_entity_schema_support(
            entity_id,
            schema_id,
            property_values
        ));
        assert_err!(
            TestModule::complete_insert_at_entity_property_vector(
                entity_id,
                PROP_ID_U32_VEC,
                VALID_PROPERTY_VEC_INDEX,
                PropertyValue::Uint32(33),
                ZERO_NONCE
            ),
            ERROR_ENTITY_PROP_VALUE_VECTOR_IS_TOO_LONG
        );
    })
}

#[test]
fn cannot_complete_insert_at_entity_property_vector_when_nonce_does_not_match() {
    with_test_externalities(|| {
        let entity_id = complete_remove_at_entity_property_vector();
        assert_err!(
            TestModule::complete_insert_at_entity_property_vector(
                entity_id,
                PROP_ID_U32_VEC,
                VALID_PROPERTY_VEC_INDEX,
                PropertyValue::Uint32(33),
                SECOND_NONCE
            ),
            ERROR_PROP_VALUE_VEC_NONCES_DOES_NOT_MATCH
        );
    })
}

#[test]
fn cannot_complete_insert_at_entity_property_vector_when_unknown_internal_entity_id() {
    with_test_externalities(|| {
        let class_id = create_simple_class_with_default_permissions();
        let schema_id = TestModule::append_class_schema(
            class_id,
            vec![],
            vec![
                good_prop_bool().required(),
                new_reference_class_prop_vec(class_id),
            ],
        )
        .expect("This should not happen");
        let entity_id = create_entity_of_class(class_id);
        let entity_id_2 = create_entity_of_class(class_id);
        let mut property_values = BTreeMap::new();
        property_values.insert(PROP_ID_BOOL, PropertyValue::Bool(true));
        property_values.insert(
            PROP_ID_REFERENCE_VEC,
            PropertyValue::ReferenceVec(vec![entity_id_2], <Runtime as Trait>::Nonce::default()),
        );
        assert_ok!(TestModule::add_entity_schema_support(
            entity_id,
            schema_id,
            property_values
        ));
        assert_err!(
            TestModule::complete_insert_at_entity_property_vector(
                entity_id,
                PROP_ID_REFERENCE_VEC,
                VALID_PROPERTY_VEC_INDEX,
                PropertyValue::Reference(UNKNOWN_ENTITY_ID),
                ZERO_NONCE
            ),
            ERROR_ENTITY_NOT_FOUND
        );
    })
}

// TODO test text max len

// TODO test vec max len

// Delete entity
// --------------------------------------

// #[test]
// fn delete_entity_successfully() {
//     with_test_externalities(|| {
//         let entity_id = create_entity();
//         assert_ok!(
//             TestModule::delete_entity(entity_id),
//             ()
//         );
//     })
// }

// #[test]
// fn cannot_delete_entity_when_entity_not_found() {
//     with_test_externalities(|| {
//         assert_entity_not_found(
//             TestModule::delete_entity(UNKNOWN_ENTITY_ID)
//         );
//     })
// }

// #[test]
// fn cannot_delete_already_deleted_entity() {
//     with_test_externalities(|| {
//         let entity_id = create_entity();
//         let _ok = TestModule::delete_entity(entity_id);
//         assert_err!(
//             TestModule::delete_entity(entity_id),
//             ERROR_ENTITY_ALREADY_DELETED
//         );
//     })
// }
