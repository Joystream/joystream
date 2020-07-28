#![cfg(test)]

use super::*;
use crate::mock::*;
use sp_std::collections::btree_set::BTreeSet;
use versioned_store::PropertyType;

use frame_support::{assert_err, assert_ok};

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
    let class_id = <versioned_store::Module<Runtime>>::next_class_id();
    assert_ok!(Permissions::create_class(
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

fn class_permissions_minimal() -> ClassPermissionsType<Runtime> {
    ClassPermissions {
        // remove special permissions for entity maintainers
        entity_permissions: EntityPermissions {
            maintainer_has_all_permissions: false,
            ..Default::default()
        },
        ..Default::default()
    }
}

fn class_permissions_minimal_with_admins(
    admins: Vec<<Runtime as Trait>::Credential>,
) -> ClassPermissionsType<Runtime> {
    ClassPermissions {
        admins: admins.into(),
        ..class_permissions_minimal()
    }
}

fn next_entity_id() -> EntityId {
    <versioned_store::Module<Runtime>>::next_entity_id()
}

#[test]
fn create_class_then_entity_with_default_class_permissions() {
    with_test_externalities(|| {
        // Only authorized accounts can create classes
        assert_err!(
            Permissions::create_class_with_default_permissions(
                Origin::signed(UNAUTHORIZED_CLASS_PERMISSIONS_CREATOR),
                b"class_name".to_vec(),
                b"class_description".to_vec(),
            ),
            "NotPermittedToCreateClass"
        );

        let class_id = create_simple_class_with_default_permissions();

        assert!(<ClassPermissionsByClassId<Runtime>>::contains_key(class_id));

        // default class permissions have empty add_schema acl
        assert_err!(
            Permissions::add_class_schema(
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
        assert_ok!(Permissions::set_class_add_schemas_set(
            system::RawOrigin::Root.into(),
            None,
            class_id,
            add_schema_set
        ));

        // successfully add a new schema
        assert_ok!(Permissions::add_class_schema(
            Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ZERO),
            Some(0),
            class_id,
            vec![],
            simple_test_schema()
        ));

        // System can always create entities (provided class exists) bypassing any permissions
        let entity_id_1 = next_entity_id();
        assert_ok!(Permissions::create_entity(
            system::RawOrigin::Root.into(),
            None,
            class_id,
        ));
        // entities created by system are "un-owned"
        assert!(!<EntityMaintainerByEntityId<Runtime>>::contains_key(
            entity_id_1
        ));
        assert_eq!(
            Permissions::entity_maintainer_by_entity_id(entity_id_1),
            None
        );

        // default permissions have empty create_entities set and by default no entities can be created
        assert_err!(
            Permissions::create_entity(
                Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
                Some(1),
                class_id,
            ),
            "EntitiesCannotBeCreated"
        );

        assert_ok!(Permissions::set_class_entities_can_be_created(
            system::RawOrigin::Root.into(),
            None,
            class_id,
            true
        ));

        assert_err!(
            Permissions::create_entity(
                Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
                Some(1),
                class_id,
            ),
            "NotInCreateEntitiesSet"
        );

        // give members of GROUP_ONE permission to create entities
        let create_entities_set = CredentialSet::from(vec![1]);
        assert_ok!(Permissions::set_class_create_entities_set(
            system::RawOrigin::Root.into(),
            None,
            class_id,
            create_entities_set
        ));

        let entity_id_2 = next_entity_id();
        assert_ok!(Permissions::create_entity(
            Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
            Some(1),
            class_id,
        ));
        assert!(<EntityMaintainerByEntityId<Runtime>>::contains_key(
            entity_id_2
        ));
        assert_eq!(
            Permissions::entity_maintainer_by_entity_id(entity_id_2),
            Some(1)
        );

        // Updating entity must be authorized
        assert_err!(
            Permissions::add_schema_support_to_entity(
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
        assert_ok!(Permissions::add_schema_support_to_entity(
            Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
            Some(1),
            true, // we are claiming to be the entity maintainer
            entity_id_2,
            0,
            simple_test_entity_property_values()
        ));
        assert_ok!(Permissions::update_entity_property_values(
            Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
            Some(1),
            true, // we are claiming to be the entity maintainer
            entity_id_2,
            simple_test_entity_property_values()
        ));
    })
}

#[test]
fn class_permissions_set_admins() {
    with_test_externalities(|| {
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_permissions_minimal());
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);

        assert!(class_permissions.admins.is_empty());

        let credential_set = CredentialSet::from(vec![1]);

        // only root should be able to set admins
        assert_err!(
            Permissions::set_class_admins(Origin::signed(1), class_id, credential_set.clone()),
            "NotRootOrigin"
        );
        assert_err!(
            Permissions::set_class_admins(
                system::RawOrigin::None.into(), //unsigned inherent?
                class_id,
                credential_set.clone()
            ),
            "BadOrigin:ExpectedRootOrSigned"
        );

        // root origin can set admins
        assert_ok!(Permissions::set_class_admins(
            system::RawOrigin::Root.into(),
            class_id,
            credential_set.clone()
        ));

        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.admins, credential_set);
    })
}

#[test]
fn class_permissions_set_add_schemas_set() {
    with_test_externalities(|| {
        const ADMIN_ACCOUNT: u64 = MEMBER_ONE_WITH_CREDENTIAL_ZERO;
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_permissions_minimal_with_admins(vec![0]));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);

        assert!(class_permissions.add_schemas.is_empty());

        let credential_set1 = CredentialSet::from(vec![1, 2]);
        let credential_set2 = CredentialSet::from(vec![3, 4]);

        // root
        assert_ok!(Permissions::set_class_add_schemas_set(
            system::RawOrigin::Root.into(),
            None,
            class_id,
            credential_set1.clone()
        ));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.add_schemas, credential_set1);

        // admins
        assert_ok!(Permissions::set_class_add_schemas_set(
            Origin::signed(ADMIN_ACCOUNT),
            Some(0),
            class_id,
            credential_set2.clone()
        ));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.add_schemas, credential_set2);

        // non-admins
        assert_err!(
            Permissions::set_class_add_schemas_set(
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
fn class_permissions_set_class_create_entities_set() {
    with_test_externalities(|| {
        const ADMIN_ACCOUNT: u64 = MEMBER_ONE_WITH_CREDENTIAL_ZERO;
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_permissions_minimal_with_admins(vec![0]));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);

        assert!(class_permissions.create_entities.is_empty());

        let credential_set1 = CredentialSet::from(vec![1, 2]);
        let credential_set2 = CredentialSet::from(vec![3, 4]);

        // root
        assert_ok!(Permissions::set_class_create_entities_set(
            system::RawOrigin::Root.into(),
            None,
            class_id,
            credential_set1.clone()
        ));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.create_entities, credential_set1);

        // admins
        assert_ok!(Permissions::set_class_create_entities_set(
            Origin::signed(ADMIN_ACCOUNT),
            Some(0),
            class_id,
            credential_set2.clone()
        ));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.create_entities, credential_set2);

        // non-admins
        assert_err!(
            Permissions::set_class_create_entities_set(
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
fn class_permissions_set_class_entities_can_be_created() {
    with_test_externalities(|| {
        const ADMIN_ACCOUNT: u64 = MEMBER_ONE_WITH_CREDENTIAL_ZERO;
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_permissions_minimal_with_admins(vec![0]));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);

        assert_eq!(class_permissions.entities_can_be_created, false);

        // root
        assert_ok!(Permissions::set_class_entities_can_be_created(
            system::RawOrigin::Root.into(),
            None,
            class_id,
            true
        ));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.entities_can_be_created, true);

        // admins
        assert_ok!(Permissions::set_class_entities_can_be_created(
            Origin::signed(ADMIN_ACCOUNT),
            Some(0),
            class_id,
            false
        ));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.entities_can_be_created, false);

        // non-admins
        assert_err!(
            Permissions::set_class_entities_can_be_created(
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
fn class_permissions_set_class_entity_permissions() {
    with_test_externalities(|| {
        const ADMIN_ACCOUNT: u64 = MEMBER_ONE_WITH_CREDENTIAL_ZERO;
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_permissions_minimal_with_admins(vec![0]));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);

        assert!(class_permissions.entity_permissions.update.is_empty());

        let entity_permissions1 = EntityPermissions {
            update: CredentialSet::from(vec![1]),
            maintainer_has_all_permissions: true,
        };

        //root
        assert_ok!(Permissions::set_class_entity_permissions(
            system::RawOrigin::Root.into(),
            None,
            class_id,
            entity_permissions1.clone()
        ));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.entity_permissions, entity_permissions1);

        let entity_permissions2 = EntityPermissions {
            update: CredentialSet::from(vec![4]),
            maintainer_has_all_permissions: true,
        };
        //admins
        assert_ok!(Permissions::set_class_entity_permissions(
            Origin::signed(ADMIN_ACCOUNT),
            Some(0),
            class_id,
            entity_permissions2.clone()
        ));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.entity_permissions, entity_permissions2);

        // non admins
        assert_err!(
            Permissions::set_class_entity_permissions(
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
fn class_permissions_set_class_reference_constraint() {
    with_test_externalities(|| {
        const ADMIN_ACCOUNT: u64 = MEMBER_ONE_WITH_CREDENTIAL_ZERO;
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_permissions_minimal_with_admins(vec![0]));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);

        assert_eq!(class_permissions.reference_constraint, Default::default());

        let mut constraints_set = BTreeSet::new();
        constraints_set.insert(PropertyOfClass {
            class_id: 1,
            property_index: 0,
        });
        let reference_constraint1 = ReferenceConstraint::Restricted(constraints_set);

        //root
        assert_ok!(Permissions::set_class_reference_constraint(
            system::RawOrigin::Root.into(),
            None,
            class_id,
            reference_constraint1.clone()
        ));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(
            class_permissions.reference_constraint,
            reference_constraint1
        );

        let mut constraints_set = BTreeSet::new();
        constraints_set.insert(PropertyOfClass {
            class_id: 2,
            property_index: 2,
        });
        let reference_constraint2 = ReferenceConstraint::Restricted(constraints_set);

        //admins
        assert_ok!(Permissions::set_class_reference_constraint(
            Origin::signed(ADMIN_ACCOUNT),
            Some(0),
            class_id,
            reference_constraint2.clone()
        ));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(
            class_permissions.reference_constraint,
            reference_constraint2
        );

        // non admins
        assert_err!(
            Permissions::set_class_reference_constraint(
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

        assert_ok!(Permissions::add_class_schema(
            system::RawOrigin::Root.into(),
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

        assert_ok!(Permissions::transaction(
            Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
            operations
        ));

        // two entities created
        assert!(versioned_store::EntityById::contains_key(entity_id));
        assert!(versioned_store::EntityById::contains_key(entity_id + 1));
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

        assert_ok!(Permissions::add_class_schema(
            system::RawOrigin::Root.into(),
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

        assert_ok!(Permissions::transaction(
            Origin::signed(MEMBER_ONE_WITH_CREDENTIAL_ONE),
            operations
        ));

        // three entities created
        assert!(versioned_store::EntityById::contains_key(entity_id));
        assert!(versioned_store::EntityById::contains_key(entity_id + 1));
        assert!(versioned_store::EntityById::contains_key(entity_id + 2));

        assert_eq!(
            versioned_store::EntityById::get(entity_id),
            versioned_store::Entity {
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
