use codec::{Decode, Encode};

use crate::constraint::*;
use crate::credentials::*;
use crate::DispatchResult;

/// Permissions for an instance of a Class in the versioned store.
#[derive(Encode, Decode, Default, Eq, PartialEq, Clone, Debug)]
pub struct ClassPermissions<ClassId, Credential, PropertyIndex, BlockNumber>
where
    ClassId: Ord,
    Credential: Ord + Clone,
    PropertyIndex: Ord,
{
    // concrete permissions
    /// Permissions that are applied to entities of this class, define who in addition to
    /// root origin can update entities of this class.
    pub entity_permissions: EntityPermissions<Credential>,

    /// Wether new entities of this class be created or not. Is not enforced for root origin.
    pub entities_can_be_created: bool,

    /// Who can add new schemas in the versioned store for this class
    pub add_schemas: CredentialSet<Credential>,

    /// Who can create new entities in the versioned store of this class
    pub create_entities: CredentialSet<Credential>,

    /// The type of constraint on referencing the class from other entities.
    pub reference_constraint: ReferenceConstraint<ClassId, PropertyIndex>,

    /// Who (in addition to root origin) can update all concrete permissions.
    /// The admins can only be set by the root origin, "System".
    pub admins: CredentialSet<Credential>,

    // Block where permissions were changed
    pub last_permissions_update: BlockNumber,
}

impl<ClassId, Credential, PropertyIndex, BlockNumber>
    ClassPermissions<ClassId, Credential, PropertyIndex, BlockNumber>
where
    ClassId: Ord,
    Credential: Ord + Clone,
    PropertyIndex: Ord,
{
    /// Returns Ok if access_level is root origin or credential is in admins set, Err otherwise
    pub fn is_admin(
        class_permissions: &Self,
        access_level: &AccessLevel<Credential>,
    ) -> DispatchResult {
        match access_level {
            AccessLevel::System => Ok(()),
            AccessLevel::Credential(credential) => {
                if class_permissions.admins.contains(credential) {
                    Ok(())
                } else {
                    Err("NotInAdminsSet")
                }
            }
            AccessLevel::Unspecified => Err("UnspecifiedActor"),
            AccessLevel::EntityMaintainer => Err("AccessLevel::EntityMaintainer-UsedOutOfPlace"),
        }
    }

    pub fn can_add_class_schema(
        class_permissions: &Self,
        access_level: &AccessLevel<Credential>,
    ) -> DispatchResult {
        match access_level {
            AccessLevel::System => Ok(()),
            AccessLevel::Credential(credential) => {
                if class_permissions.add_schemas.contains(credential) {
                    Ok(())
                } else {
                    Err("NotInAddSchemasSet")
                }
            }
            AccessLevel::Unspecified => Err("UnspecifiedActor"),
            AccessLevel::EntityMaintainer => Err("AccessLevel::EntityMaintainer-UsedOutOfPlace"),
        }
    }

    pub fn can_create_entity(
        class_permissions: &Self,
        access_level: &AccessLevel<Credential>,
    ) -> DispatchResult {
        match access_level {
            AccessLevel::System => Ok(()),
            AccessLevel::Credential(credential) => {
                if !class_permissions.entities_can_be_created {
                    Err("EntitiesCannotBeCreated")
                } else if class_permissions.create_entities.contains(credential) {
                    Ok(())
                } else {
                    Err("NotInCreateEntitiesSet")
                }
            }
            AccessLevel::Unspecified => Err("UnspecifiedActor"),
            AccessLevel::EntityMaintainer => Err("AccessLevel::EntityMaintainer-UsedOutOfPlace"),
        }
    }

    pub fn can_update_entity(
        class_permissions: &Self,
        access_level: &AccessLevel<Credential>,
    ) -> DispatchResult {
        match access_level {
            AccessLevel::System => Ok(()),
            AccessLevel::Credential(credential) => {
                if class_permissions
                    .entity_permissions
                    .update
                    .contains(credential)
                {
                    Ok(())
                } else {
                    Err("CredentialNotInEntityPermissionsUpdateSet")
                }
            }
            AccessLevel::EntityMaintainer => {
                if class_permissions
                    .entity_permissions
                    .maintainer_has_all_permissions
                {
                    Ok(())
                } else {
                    Err("MaintainerNotGivenAllPermissions")
                }
            }
            _ => Err("UnknownActor"),
        }
    }
}

#[derive(Encode, Decode, Clone, Debug, Eq, PartialEq)]
pub struct EntityPermissions<Credential>
where
    Credential: Ord,
{
    // Principals permitted to update any entity of the class which this permission is associated with.
    pub update: CredentialSet<Credential>,
    /// Wether the designated maintainer (if set) of an entity has permission to update it.
    pub maintainer_has_all_permissions: bool,
}

impl<Credential: Ord> Default for EntityPermissions<Credential> {
    fn default() -> Self {
        EntityPermissions {
            maintainer_has_all_permissions: true,
            update: CredentialSet::new(),
        }
    }
}
