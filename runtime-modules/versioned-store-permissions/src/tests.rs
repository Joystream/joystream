#![cfg(test)]

use super::*;
use crate::mock::*;
use rstd::collections::btree_set::BTreeSet;

use srml_support::{assert_err, assert_ok};

fn simple_test_schema() -> Vec<Property> {
    vec![Property {
        prop_type: PropertyType::Int64,
        required: false,
        name: b"field1".to_vec(),
        description: b"Description field1".to_vec(),
    }]
}

fn simple_test_entity_property_values() -> Vec<ClassPropertyValue> {
    vec![ClassPropertyValue {
        in_class_index: 0,
        value: PropertyValue::Int64(1337),
    }]
}

fn create_simple_class(permissions: ClassPermissionsType<Runtime>) -> ClassId {
    let class_id = <Module<Runtime>>::next_class_id();
    assert_ok!(TestModule::create_class(
        Origin::signed(CLASS_PERMISSIONS_CREATOR1),
        b"class_name_1".to_vec(),
        b"class_description_1".to_vec(),
        permissions
    ));
    class_id
}

fn create_simple_class_with_default_permissions() -> ClassId {
    create_simple_class(Default::default())
}

fn class_minimal() -> ClassPermissionsType<Runtime> {
    ClassPermissions {
        // remove special permissions for entity maintainers
        entity_permissions: EntityPermissions {
            maintainer_has_all_permissions: false,
            ..Default::default()
        },
        ..Default::default()
    }
}

fn class_minimal_with_admins(
    admins: Vec<<Runtime as Trait>::Credential>,
) -> ClassPermissionsType<Runtime> {
    ClassPermissions {
        admins: admins.into(),
        ..class_minimal()
    }
}

fn next_entity_id() -> EntityId {
    <Module<Runtime>>::next_entity_id()
}

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
        assert_ok!(
            TestModule::create_class_with_default_permissions(
                Origin::signed(CLASS_PERMISSIONS_CREATOR1),
                good_class_name(), 
                empty_description
            )
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
        assert_eq!(class.get_permissions().entity_permissions, entity_permissions1);

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
        assert_eq!(class.get_permissions().entity_permissions, entity_permissions2);

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

        assert_eq!(class.get_permissions().reference_constraint, Default::default());

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
            prop_type: PropertyType::Internal(new_class_id),
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
        assert!(EntityById::exists(entity_id));
        assert!(EntityById::exists(entity_id + 1));
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
            prop_type: PropertyType::InternalVec(10, new_class_id),
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
        assert!(EntityById::exists(entity_id));
        assert!(EntityById::exists(entity_id + 1));
        assert!(EntityById::exists(entity_id + 2));

        assert_eq!(
            EntityById::get(entity_id),
            Entity {
                class_id: new_class_id,
                id: entity_id,
                in_class_schema_indexes: vec![0],
                values: vec![ClassPropertyValue {
                    in_class_index: 0,
                    value: PropertyValue::InternalVec(vec![entity_id + 1, entity_id + 2,])
                }]
            }
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
        let bad_internal_prop = new_internal_class_prop(UNKNOWN_CLASS_ID);

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
        let internal_class_prop = new_internal_class_prop(class_id);

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
            TestModule::append_class_schema(class_id, vec![], vec![good_prop_bool(), good_prop_u32()]),
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
