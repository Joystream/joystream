use codec::{Decode, Encode};
use srml_support::dispatch;

use crate::constraint::*;
use crate::principles::*;

/// Permissions for an instance of a Class in the versioned store.
#[derive(Encode, Decode, Default, Eq, PartialEq, Clone, Debug)]
pub struct ClassPermissions<ClassId, PrincipalId, PropertyIndex, BlockNumber>
where
    ClassId: Ord,
    PrincipalId: Ord + Clone,
    PropertyIndex: Ord,
{
    // concrete permissions
    /// Permissions that are applied to entities of this class, defines who in addition to
    /// root origin can update and delete entities of this class.
    pub entity_permissions: EntityPermissions<PrincipalId>,

    /// Wether new entities of this class be created or not. Is not enforced for root origin.
    pub entities_can_be_created: bool,

    /// Who can add new schemas in the versioned store for this class
    pub add_schemas: PrincipalSet<PrincipalId>,

    /// Who can create new entities in the versioned store of this class
    pub create_entities: PrincipalSet<PrincipalId>,

    /// The type of constraint on referencing the class from other entities.
    pub reference_constraint: ReferenceConstraint<ClassId, PropertyIndex>,

    /// Who (in addition to root origin) can update all concrete permissions.
    /// The admins can only be set by the root origin, "System".
    pub admins: PrincipalSet<PrincipalId>,

    // Block where permissions were changed
    pub last_permissions_update: BlockNumber,
}

impl<ClassId, PrincipalId, PropertyIndex, BlockNumber>
    ClassPermissions<ClassId, PrincipalId, PropertyIndex, BlockNumber>
where
    ClassId: Ord,
    PrincipalId: Ord + Clone,
    PropertyIndex: Ord,
{
    /// Returns Ok if principal is root origin or principal_id is in admins set, Err otherwise
    pub fn is_admin(
        class_permissions: &Self,
        derived_principal: &ActingAs<PrincipalId>,
    ) -> dispatch::Result {
        match derived_principal {
            ActingAs::System => Ok(()),
            ActingAs::Principal(principal_id) => {
                if class_permissions.admins.contains(principal_id) {
                    Ok(())
                } else {
                    Err("NotInAdminsSet")
                }
            }
            ActingAs::Unspecified => Err("UnspecifiedActor"),
            ActingAs::EntityOwner => Err("ActingAs::EntityOwner-UsedOutOfPlace"),
        }
    }

    pub fn can_add_schema(
        class_permissions: &Self,
        derived_principal: &ActingAs<PrincipalId>,
    ) -> dispatch::Result {
        match derived_principal {
            ActingAs::System => Ok(()),
            ActingAs::Principal(principal_id) => {
                if class_permissions.add_schemas.contains(principal_id) {
                    Ok(())
                } else {
                    Err("NotInAddSchemasSet")
                }
            }
            ActingAs::Unspecified => Err("UnspecifiedActor"),
            ActingAs::EntityOwner => Err("ActingAs::EntityOwner-UsedOutOfPlace"),
        }
    }

    pub fn can_create_entity(
        class_permissions: &Self,
        derived_principal: &ActingAs<PrincipalId>,
    ) -> dispatch::Result {
        match derived_principal {
            ActingAs::System => Ok(()),
            ActingAs::Principal(principal_id) => {
                if !class_permissions.entities_can_be_created {
                    Err("EntitiesCannotBeCreated")
                } else if class_permissions.create_entities.contains(principal_id) {
                    Ok(())
                } else {
                    Err("NotInCreateEntitiesSet")
                }
            }
            ActingAs::Unspecified => Err("UnspecifiedActor"),
            ActingAs::EntityOwner => Err("ActingAs::EntityOwner-UsedOutOfPlace"),
        }
    }

    pub fn can_update_entity(
        class_permissions: &Self,
        derived_principal: &ActingAs<PrincipalId>,
    ) -> dispatch::Result {
        match derived_principal {
            ActingAs::System => Ok(()),
            ActingAs::Principal(principal_id) => {
                if class_permissions
                    .entity_permissions
                    .update
                    .contains(principal_id)
                {
                    Ok(())
                } else {
                    Err("NotInEntityPermissionsUpdateSet")
                }
            }
            ActingAs::EntityOwner => {
                if class_permissions
                    .entity_permissions
                    .owner_has_all_permissions
                {
                    Ok(())
                } else {
                    Err("NotInEntityPermissionsUpdateSet")
                }
            }
            _ => Err("UnknownActor"),
        }
    }

    pub fn can_transfer_entity_ownership(
        _class_permissions: &Self,
        derived_principal: &ActingAs<PrincipalId>,
    ) -> dispatch::Result {
        match derived_principal {
            ActingAs::System => Ok(()),
            _ => Err("OnlyRootCanTransferEntityOwnership"),
        }
    }
}

#[derive(Encode, Decode, Clone, Debug, Eq, PartialEq)]
pub struct EntityPermissions<PrincipalId>
where
    PrincipalId: Ord,
{
    // Principals permitted to update an entity
    pub update: PrincipalSet<PrincipalId>,
    // pub delete: PrincipalSet<PrincipalId>,
    // pub transfer_ownership: PrincipalSet<PrincipalId>,
    /// Wether the entity owner has permission to update, delete and transfer_ownership
    pub owner_has_all_permissions: bool,
}

// impl default entity permissions giving owner all permissions = true
impl<PrincipalId: Ord> Default for EntityPermissions<PrincipalId> {
    fn default() -> Self {
        EntityPermissions {
            owner_has_all_permissions: true,
            update: PrincipalSet::new(),
        }
    }
}
