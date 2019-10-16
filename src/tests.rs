#![cfg(test)]

use super::*;
use crate::mock::*;
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
        // remove special permissions for entity owners
        entity_permissions: EntityPermissions {
            update: EntityPrincipalSet(BTreeSet::new()),
            delete: EntityPrincipalSet(BTreeSet::new()),
            transfer_ownership: EntityPrincipalSet(BTreeSet::new()),
        },
        ..Default::default()
    }
}

fn class_permissions_minimal_with_admins(
    admins: Vec<BasePrincipal<<Runtime as system::Trait>::AccountId, <Runtime as Trait>::GroupId>>,
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
                Origin::signed(MEMBER_ONE_OF_GROUP_ZERO),
                Some(0),
                class_id,
                vec![],
                simple_test_schema()
            ),
            "NotInAddSchemasSet"
        );

        // give members of GROUP_ZERO permission to add schemas
        let add_schema_set = BasePrincipalSet::from(vec![BasePrincipal::GroupMember(0)]);
        assert_ok!(Permissions::set_class_add_schemas_set(
            Origin::ROOT,
            None,
            class_id,
            add_schema_set
        ));

        // successfully add a new schema
        assert_ok!(Permissions::add_class_schema(
            Origin::signed(MEMBER_ONE_OF_GROUP_ZERO),
            Some(0),
            class_id,
            vec![],
            simple_test_schema()
        ));

        // System can always create entities (provided class exists) bypassing any permissions
        let entity_id_1 = <versioned_store::Module<Runtime>>::next_entity_id();
        assert_ok!(Permissions::create_entity(Origin::ROOT, None, class_id,));
        // entities created by system are "un-owned"
        assert!(!<EntityOwnerByEntityId<Runtime>>::exists(entity_id_1));
        assert_eq!(Permissions::entity_owner_by_entity_id(entity_id_1), None);

        // default permissions have empty create_entities set and by default no entities can be created
        assert_err!(
            Permissions::create_entity(Origin::signed(MEMBER_ONE_OF_GROUP_ONE), Some(1), class_id,),
            "EntitiesCannotBeCreated"
        );

        assert_ok!(Permissions::set_class_entities_can_be_created(
            Origin::ROOT,
            None,
            class_id,
            true
        ));

        assert_err!(
            Permissions::create_entity(Origin::signed(MEMBER_ONE_OF_GROUP_ONE), Some(1), class_id,),
            "NotInCreateEntitiesSet"
        );

        // give members of GROUP_ONE permission to create entities
        let create_entities_set = BasePrincipalSet::from(vec![BasePrincipal::GroupMember(1)]);
        assert_ok!(Permissions::set_class_create_entities_set(
            Origin::ROOT,
            None,
            class_id,
            create_entities_set
        ));

        let entity_id_2 = <versioned_store::Module<Runtime>>::next_entity_id();
        assert_ok!(Permissions::create_entity(
            Origin::signed(MEMBER_ONE_OF_GROUP_ONE),
            Some(1),
            class_id,
        ));
        assert!(<EntityOwnerByEntityId<Runtime>>::exists(entity_id_2));
        assert_eq!(
            Permissions::entity_owner_by_entity_id(entity_id_2),
            Some(BasePrincipal::GroupMember(1))
        );

        // Updating entity must be authorized
        assert_err!(
            Permissions::add_schema_support_to_entity(
                Origin::signed(1),
                None,
                false, // not claiming to be entity owner
                entity_id_2,
                0, // first schema created
                simple_test_entity_property_values()
            ),
            "NotInEntityPermissionsUpdateSet"
        );

        // default permissions give entity owner permission to update and delete
        assert_ok!(Permissions::add_schema_support_to_entity(
            Origin::signed(MEMBER_ONE_OF_GROUP_ONE),
            Some(1),
            true, // we are claiming to be the entity owner
            entity_id_2,
            0,
            simple_test_entity_property_values()
        ));
        assert_ok!(Permissions::update_entity_property_values(
            Origin::signed(MEMBER_ONE_OF_GROUP_ONE),
            Some(1),
            true, // we are claiming to be the entity owner
            entity_id_2,
            simple_test_entity_property_values()
        ));

        // final test - transfer ownership to system
    })
}

#[test]
fn class_permissions_set_admins() {
    with_test_externalities(|| {
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_permissions_minimal());
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);

        assert!(class_permissions.admins.0.is_empty());

        let base_principal_set = BasePrincipalSet::from(vec![BasePrincipal::Account(1)]);

        // only root should be able to set admins
        assert_err!(
            Permissions::set_class_admins(Origin::signed(1), class_id, base_principal_set.clone()),
            "NotRootOrigin"
        );
        assert_err!(
            Permissions::set_class_admins(
                Origin::NONE, //unsigned inherent?
                class_id,
                base_principal_set.clone()
            ),
            "BadOrigin:ExpectedRootOrSigned"
        );

        // root origin can set admins
        assert_ok!(Permissions::set_class_admins(
            Origin::ROOT,
            class_id,
            base_principal_set.clone()
        ));

        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.admins, base_principal_set);
    })
}

#[test]
fn class_permissions_set_add_schemas_set() {
    with_test_externalities(|| {
        const ADMIN_ACCOUNT: u64 = 1;
        // create a class where all permission sets are empty
        let class_id = create_simple_class(class_permissions_minimal_with_admins(vec![
            BasePrincipal::Account(ADMIN_ACCOUNT),
        ]));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);

        assert!(class_permissions.add_schemas.0.is_empty());

        let base_principal_set1 =
            BasePrincipalSet::from(vec![BasePrincipal::Account(1), BasePrincipal::Account(2)]);
        let base_principal_set2 =
            BasePrincipalSet::from(vec![BasePrincipal::Account(3), BasePrincipal::Account(4)]);

        // root
        assert_ok!(Permissions::set_class_add_schemas_set(
            Origin::ROOT,
            None,
            class_id,
            base_principal_set1.clone()
        ));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.add_schemas, base_principal_set1);

        // admins
        assert_ok!(Permissions::set_class_add_schemas_set(
            Origin::signed(ADMIN_ACCOUNT),
            None,
            class_id,
            base_principal_set2.clone()
        ));
        let class_permissions = Permissions::class_permissions_by_class_id(class_id);
        assert_eq!(class_permissions.add_schemas, base_principal_set2);

        // non-admins
        assert_err!(
            Permissions::set_class_add_schemas_set(
                Origin::signed(ADMIN_ACCOUNT + 1),
                None,
                class_id,
                base_principal_set2.clone()
            ),
            "NotInAdminsSet"
        );
    })
}
