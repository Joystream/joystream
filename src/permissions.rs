use crate::*;
use codec::{Decode, Encode};

/// Permissions for an instance of a Class in the versioned store.
#[derive(Encode, Decode, Default, Eq, PartialEq, Clone, Debug)]
pub struct ClassPermissions<ClassId, AccountId, GroupId, PropertyIndex, BlockNumber>
where
    ClassId: Ord,
    AccountId: Ord + Clone,
    GroupId: Ord + Clone,
    PropertyIndex: Ord,
{
    // concrete permissions
    /// Permissions that are applied to entities of this class, defines who in addition to
    /// root origin can update and delete entities of this class.
    pub entity_permissions: EntityPermissions<AccountId, GroupId>,

    /// Wether new entities of this class be created or not. Is not enforced for root origin.
    pub entities_can_be_created: bool,

    /// Who can add new schemas in the versioned store for this class
    pub add_schemas: BasePrincipalSet<AccountId, GroupId>,

    /// Who can create new entities in the versioned store of this class
    pub create_entities: BasePrincipalSet<AccountId, GroupId>,

    /// The type of constraint on referencing the class from other entities.
    pub reference_constraint: ReferenceConstraint<ClassId, PropertyIndex>,

    /// Who (in addition to root origin) can update all concrete permissions.
    /// The admins can only be set by the root origin, "System".
    pub admins: BasePrincipalSet<AccountId, GroupId>,

    // Block where permissions were changed
    pub last_permissions_update: BlockNumber,
}

impl<ClassId, AccountId, GroupId, PropertyIndex, BlockNumber>
    ClassPermissions<ClassId, AccountId, GroupId, PropertyIndex, BlockNumber>
where
    ClassId: Ord,
    AccountId: Ord + Clone,
    GroupId: Ord + Clone,
    PropertyIndex: Ord,
{
    /// Returns Ok if principal is root origin or base_principal is in admins set, Err otherwise
    pub fn is_admin(
        class_permissions: &Self,
        derived_principal: &DerivedPrincipal<AccountId, GroupId>,
    ) -> dispatch::Result {
        match derived_principal {
            DerivedPrincipal::System => Ok(()),
            DerivedPrincipal::Base(base_principal) => {
                if class_permissions.admins.contains(base_principal) {
                    Ok(())
                } else {
                    Err("NotInAdminsSet")
                }
            }
            _ => Err("DerivedPrincipal::EntityOwner-UsedOutOfPlace"),
        }
    }

    pub fn can_add_schema(
        class_permissions: &Self,
        derived_principal: &DerivedPrincipal<AccountId, GroupId>,
    ) -> dispatch::Result {
        match derived_principal {
            DerivedPrincipal::System => Ok(()),
            DerivedPrincipal::Base(base_principal) => {
                if class_permissions.add_schemas.contains(base_principal) {
                    Ok(())
                } else {
                    Err("NotInAddSchemasSet")
                }
            }
            _ => Err("DerivedPrincipal::EntityOwner-UsedOutOfPlace"),
        }
    }

    pub fn can_create_entity(
        class_permissions: &Self,
        derived_principal: &DerivedPrincipal<AccountId, GroupId>,
    ) -> dispatch::Result {
        match derived_principal {
            DerivedPrincipal::System => Ok(()),
            DerivedPrincipal::Base(base_principal) => {
                if !class_permissions.entities_can_be_created {
                    Err("EntitiesCannotBeCreated")
                } else if class_permissions.create_entities.contains(base_principal) {
                    Ok(())
                } else {
                    Err("NotInCreateEntitiesSet")
                }
            }
            _ => Err("DerivedPrincipal::EntityOwner-UsedOutOfPlace"),
        }
    }

    pub fn can_update_entity(
        class_permissions: &Self,
        derived_principal: &DerivedPrincipal<AccountId, GroupId>,
    ) -> dispatch::Result {
        match derived_principal {
            DerivedPrincipal::System => Ok(()),
            DerivedPrincipal::Base(base_principal) => {
                if class_permissions
                    .entity_permissions
                    .update
                    .contains(&EntityPrincipal::Base(base_principal.clone()))
                {
                    Ok(())
                } else {
                    Err("NotInEntityPermissionsUpdateSet")
                }
            }
            DerivedPrincipal::EntityOwner => {
                if class_permissions
                    .entity_permissions
                    .update
                    .contains(&EntityPrincipal::Owner)
                {
                    Ok(())
                } else {
                    Err("NotInEntityPermissionsUpdateSet")
                }
            }
        }
    }

    pub fn can_transfer_entity_ownership(
        class_permissions: &Self,
        derived_principal: &DerivedPrincipal<AccountId, GroupId>,
    ) -> dispatch::Result {
        match derived_principal {
            DerivedPrincipal::System => Ok(()),
            DerivedPrincipal::Base(base_principal) => {
                if class_permissions
                    .entity_permissions
                    .transfer_ownership
                    .contains(&EntityPrincipal::Base(base_principal.clone()))
                {
                    Ok(())
                } else {
                    Err("NotInEntityPermissionsTransferOwnershipSet")
                }
            }
            DerivedPrincipal::EntityOwner => {
                if class_permissions
                    .entity_permissions
                    .transfer_ownership
                    .contains(&EntityPrincipal::Owner)
                {
                    Ok(())
                } else {
                    Err("NotInEntityPermissionsTransferOwnershipSet")
                }
            }
        }
    }
}

#[derive(Encode, Decode, Clone, Debug, Default, Eq, PartialEq)]
pub struct EntityPermissions<AccountId, GroupId>
where
    AccountId: Ord,
    GroupId: Ord,
{
    pub update: EntityPrincipalSet<AccountId, GroupId>,
    pub delete: EntityPrincipalSet<AccountId, GroupId>,
    pub transfer_ownership: EntityPrincipalSet<AccountId, GroupId>,
}
