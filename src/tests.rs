#![cfg(test)]

use super::*;
use crate::mock::*;
use rstd::collections::btree_set::BTreeSet;
use versioned_store::PropertyType;

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
    admins: Vec<<Runtime as Trait>::PrincipalId>,
) -> ClassPermissionsType<Runtime> {
    ClassPermissions {
        admins: admins.into(),
        ..class_permissions_minimal()
    }
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

        assert!(<ClassPermissionsByClassId<Runtime>>::exists(class_id));

        // default class permissions have empty add_schema acl
        assert_err!(
            Permissions::add_class_schema(
                Origin::signed(MEMBER_ONE_OF_PRINCIPAL_GROUP_ZERO),
                Some(0),
                class_id,
                vec![],
                simple_test_schema()
            ),
            "NotInAddSchemasSet"
        );

        // give members of GROUP_ZERO permission to add schemas
        let add_schema_set = PrincipalSet::from(vec![0]);
        assert_ok!(Permissions::set_class_add_schemas_set(
            Origin::ROOT,
            None,
            class_id,
            add_schema_set
        ));

        // successfully add a new schema
        assert_ok!(Permissions::add_class_schema(
            Origin::signed(MEMBER_ONE_OF_PRINCIPAL_GROUP_ZERO),
            Some(0),
            class_id,
            vec![],
            simple_test_schema()
        ));

        // System can always create entities (provided class exists) bypassing any permissions
        let entity_id_1 = <versioned_store::Module<Runtime>>::next_entity_id();
        assert_ok!(Permissions::create_entity(Origin::ROOT, None, class_id,));
        // entities created by system are "un-owned"
        assert!(!<EntityMaintainerByEntityId<Runtime>>::exists(entity_id_1));
        assert_eq!(
            Permissions::entity_maintainer_by_entity_id(entity_id_1),
            None
        );

        // default permissions have empty create_entities set and by default no entities can be created
        assert_err!(
            Permissions::create_entity(
                Origin::signed(MEMBER_ONE_OF_PRINCIPAL_GROUP_ONE),
                Some(1),
                class_id,
            ),
            "EntitiesCannotBeCreated"
        );

        assert_ok!(Permissions::set_class_entities_can_be_created(
            Origin::ROOT,
            None,
            class_id,
            true
        ));

        assert_err!(
            Permissions::create_entity(
                Origin::signed(MEMBER_ONE_OF_PRINCIPAL_GROUP_ONE),
                Some(1),
                class_id,
            ),
            "NotInCreateEntitiesSet"
        );

        // give members of GROUP_ONE permission to create entities
        let create_entities_set = PrincipalSet::from(vec![1]);
        assert_ok!(Permissions::set_class_create_entities_set(
            Origin::ROOT,
            None,
            class_id,
            create_entities_set
        ));

        let entity_id_2 = <versioned_store::Module<Runtime>>::next_entity_id();
        assert_ok!(Permissions::create_entity(
            Origin::signed(MEMBER_ONE_OF_PRINCIPAL_GROUP_ONE),
            Some(1),
            class_id,
        ));
        assert!(<EntityMaintainerByEntityId<Runtime>>::exists(entity_id_2));
        assert_eq!(
            Permissions::entity_maintainer_by_entity_id(entity_id_2),
            Some(1)
        );

        // Updating entity must be authorized
        assert_err!(
            Permissions::add_schema_support_to_entity(
                Origin::signed(MEMBER_ONE_OF_PRINCIPAL_GROUP_ZERO),
                Some(0),
                false, // not claiming to be entity maintainer
                entity_id_2,
                0, // first schema created
                simple_test_entity_property_values()
            ),
            "NotInEntityPermissionsUpdateSet"
        );

        // default permissions give entity maintainer permission to update and delete
        assert_ok!(Permissions::add_schema_support_to_entity(
            Origin::signed(MEMBER_ONE_OF_PRINCIPAL_GROUP_ONE),
            Some(1),
            true, // we are claiming to be the entity maintainer
            entity_id_2,
            0,
            simple_test_entity_property_values()
        ));
        assert_ok!(Permissions::update_entity_property_values(
            Origin::signed(MEMBER_ONE_OF_PRINCIPAL_GROUP_ONE),
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

        let principal_set = PrincipalSet::from(vec![1]);

        // only root should be able to set admins
        assert_err!(
            Permissions::set_class_admins(Origin::signed(1), class_id, principal_set.clone()),
            "NotRootOrigin"
        );
        assert_err!(
            Permissions::set_class_admins(
                Origin::NONE, //unsigned inherent?
                class_id,
                principal_set.clone()
            ),
            "BadOrigin:ExpectedRootOrSigned"
        );

        // root origin can set admins
        assert_ok!(Permissions::set_class_admins(
            Origin::ROOT,
            class_id,
            principal_set.clone()
        ));

        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.admins, principal_set);
    })
}

#[test]
fn class_permissions_set_add_schemas_set() {
    with_test_externalities(|| {
        const ADMIN_ACCOUNT: u64 = MEMBER_ONE_OF_PRINCIPAL_GROUP_ZERO;
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_permissions_minimal_with_admins(vec![0]));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);

        assert!(class_permissions.add_schemas.is_empty());

        let principal_set1 = PrincipalSet::from(vec![1, 2]);
        let principal_set2 = PrincipalSet::from(vec![3, 4]);

        // root
        assert_ok!(Permissions::set_class_add_schemas_set(
            Origin::ROOT,
            None,
            class_id,
            principal_set1.clone()
        ));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.add_schemas, principal_set1);

        // admins
        assert_ok!(Permissions::set_class_add_schemas_set(
            Origin::signed(ADMIN_ACCOUNT),
            Some(0),
            class_id,
            principal_set2.clone()
        ));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.add_schemas, principal_set2);

        // non-admins
        assert_err!(
            Permissions::set_class_add_schemas_set(
                Origin::signed(MEMBER_ONE_OF_PRINCIPAL_GROUP_ONE),
                Some(1),
                class_id,
                principal_set2.clone()
            ),
            "NotInAdminsSet"
        );
    })
}

#[test]
fn class_permissions_set_class_create_entities_set() {
    with_test_externalities(|| {
        const ADMIN_ACCOUNT: u64 = MEMBER_ONE_OF_PRINCIPAL_GROUP_ZERO;
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_permissions_minimal_with_admins(vec![0]));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);

        assert!(class_permissions.create_entities.is_empty());

        let principal_set1 = PrincipalSet::from(vec![1, 2]);
        let principal_set2 = PrincipalSet::from(vec![3, 4]);

        // root
        assert_ok!(Permissions::set_class_create_entities_set(
            Origin::ROOT,
            None,
            class_id,
            principal_set1.clone()
        ));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.create_entities, principal_set1);

        // admins
        assert_ok!(Permissions::set_class_create_entities_set(
            Origin::signed(ADMIN_ACCOUNT),
            Some(0),
            class_id,
            principal_set2.clone()
        ));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.create_entities, principal_set2);

        // non-admins
        assert_err!(
            Permissions::set_class_create_entities_set(
                Origin::signed(MEMBER_ONE_OF_PRINCIPAL_GROUP_ONE),
                Some(1),
                class_id,
                principal_set2.clone()
            ),
            "NotInAdminsSet"
        );
    })
}

#[test]
fn class_permissions_set_class_entities_can_be_created() {
    with_test_externalities(|| {
        const ADMIN_ACCOUNT: u64 = MEMBER_ONE_OF_PRINCIPAL_GROUP_ZERO;
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_permissions_minimal_with_admins(vec![0]));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);

        assert_eq!(class_permissions.entities_can_be_created, false);

        // root
        assert_ok!(Permissions::set_class_entities_can_be_created(
            Origin::ROOT,
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
                Origin::signed(MEMBER_ONE_OF_PRINCIPAL_GROUP_ONE),
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
        const ADMIN_ACCOUNT: u64 = MEMBER_ONE_OF_PRINCIPAL_GROUP_ZERO;
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_permissions_minimal_with_admins(vec![0]));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);

        assert!(class_permissions.entity_permissions.update.is_empty());

        let entity_permissions1 = EntityPermissions {
            update: PrincipalSet::from(vec![1]),
            maintainer_has_all_permissions: true,
        };

        //root
        assert_ok!(Permissions::set_class_entity_permissions(
            Origin::ROOT,
            None,
            class_id,
            entity_permissions1.clone()
        ));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.entity_permissions, entity_permissions1);

        let entity_permissions2 = EntityPermissions {
            update: PrincipalSet::from(vec![4]),
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
                Origin::signed(MEMBER_ONE_OF_PRINCIPAL_GROUP_ONE),
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
        const ADMIN_ACCOUNT: u64 = MEMBER_ONE_OF_PRINCIPAL_GROUP_ZERO;
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
            Origin::ROOT,
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
                Origin::signed(MEMBER_ONE_OF_PRINCIPAL_GROUP_ONE),
                Some(1),
                class_id,
                reference_constraint2.clone()
            ),
            "NotInAdminsSet"
        );
    })
}

// derive_principal()
// ensure_internal_property_values_permitted() -> refactor to be testable
