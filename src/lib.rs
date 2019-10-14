// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;

use codec::{Codec, Decode, Encode};
use rstd::collections::btree_set::BTreeSet;
use runtime_primitives::traits::{MaybeSerializeDebug, Member, SimpleArithmetic};
use srml_support::{
    decl_module, decl_storage, dispatch, ensure, EnumerableStorageMap, Parameter, StorageMap,
};
use system::{self, ensure_root, ensure_signed};

pub use versioned_store::*; // EntityId, ClassId -> should be configured on versioned_store::Trait
pub type PropertyIndex = u16; // should really be configured on versioned_store::Trait

#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd)]
pub struct PropertyOfClass<ClassId, PropertyIndex> {
    class: ClassId,
    property: PropertyIndex,
}

/// Trait that provides an abstraction for the concept of group membership and a way
/// to check the inclusion of an account id in a specific group. Groups are identified by the
/// type GroupId.
pub trait GroupMembershipChecker<AccountId> {
    type GroupId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + Clone
        + MaybeSerializeDebug
        + Eq
        + PartialEq
        + Ord;

    fn account_is_in_group(account: AccountId, group: Self::GroupId) -> bool;
}

// impl for () -> least priviledge
// impl for (A, B) -> to allow multiple checkers ?

pub type GroupId<T> = <<T as Trait>::GroupMembershipChecker as GroupMembershipChecker<
    <T as system::Trait>::AccountId,
>>::GroupId;

pub trait CreateClassPermissionsChecker<AccountId> {
    fn account_can_create_class_permissions(account: AccountId) -> bool;
}

/// Identifies a princial to whom a permission can be assigned on Classes.
#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd, Clone, Debug)]
pub enum BasePrincipal<AccountId, GroupId> {
    System,
    Account(AccountId),
    GroupMember(GroupId),
}

/// Default trait only for the requirement to have storage values not wrapped in Option
/// Should NOT be used explicitly.
impl<AccountId, GroupId> Default for BasePrincipal<AccountId, GroupId> {
    fn default() -> Self {
        BasePrincipal::System
    }
}

/// Identifies a principal to whom a permission can be assigned on Entities.
#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd, Clone, Debug)]
pub enum EntityPrincipal<AccountId, GroupId> {
    Base(BasePrincipal<AccountId, GroupId>),
    Owner,
}

/// Default trait only for the requirement to have storage values not wrapped in Option
/// Should NOT be used explicitly.
impl<AccountId, GroupId> Default for EntityPrincipal<AccountId, GroupId> {
    fn default() -> Self {
        EntityPrincipal::Owner
    }
}

/// The type of constraint on what entities can reference instances of a class through an Internal property type.
#[derive(Encode, Decode)]
pub enum ReferenceConstraint<ClassId: Ord, PropertyIndex: Ord> {
    /// No Entity can reference the class.
    NoReferencingAllowed,

    /// Any entity may reference the class.
    NoConstraint,

    /// Only a set of entities of type ClassId and from the specified property index can reference the class.
    Restricted(BTreeSet<PropertyOfClass<ClassId, PropertyIndex>>),
}

impl<ClassId: Ord, PropertyIndex: Ord> Default for ReferenceConstraint<ClassId, PropertyIndex> {
    fn default() -> Self {
        ReferenceConstraint::NoReferencingAllowed
    }
}

pub type BasePrincipalSet<AccountId, GroupId> = BTreeSet<BasePrincipal<AccountId, GroupId>>;

/// Permissions for an instance of a Class in the versioned store
/// Default trait is derived but should NOT be used explicitly, it is only
/// for purpose of storing it in state storage without need to wrap it in an Option.
#[derive(Encode, Decode, Default)]
pub struct ClassPermissions<
    ClassId: Ord,
    AccountId: Ord + Clone,
    GroupId: Ord + Clone,
    PropertyIndex: Ord,
    BlockNumber,
> {
    // concrete permissions
    /// Permissions that are applied to entities of this class
    entity_permissions: EntityPermissions<AccountId, GroupId>,

    /// Wether new entities of this class be created or not
    entities_can_be_created: bool,

    /// Who can add new schemas in the versioned store for this class
    add_schemas: BasePrincipalSet<AccountId, GroupId>,

    /// Who can create new entities in the versioned store of this class
    create_entities: BasePrincipalSet<AccountId, GroupId>,

    /// The type of constraint on referencing the class from other entities.
    reference_constraint: ReferenceConstraint<ClassId, PropertyIndex>,

    /// admins who can update all concrete permissions. The admins can only be set by the root
    /// origin, "System".
    admins: BasePrincipalSet<AccountId, GroupId>,

    // Block where permissions were changed
    last_permissions_update: BlockNumber,
}

pub type ClassPermissionsType<T> = ClassPermissions<
    ClassId,
    <T as system::Trait>::AccountId,
    GroupId<T>,
    PropertyIndex,
    <T as system::Trait>::BlockNumber,
>;

impl<
        ClassId: Ord,
        AccountId: Ord + Clone,
        GroupId: Ord + Clone,
        PropertyIndex: Ord,
        BlockNumber,
    > ClassPermissions<ClassId, AccountId, GroupId, PropertyIndex, BlockNumber>
{
    fn is_admin(&self, base_principal: &BasePrincipal<AccountId, GroupId>) -> bool {
        self.admins.contains(base_principal)
    }
}

#[derive(Encode, Decode, Default, Clone, Debug, Eq, PartialEq)]
pub struct EntityPermissions<AccountId: Ord, GroupId: Ord> {
    update: BTreeSet<EntityPrincipal<AccountId, GroupId>>,
    delete: BTreeSet<EntityPrincipal<AccountId, GroupId>>,
}

pub trait Trait: system::Trait
// uncomment when its updated to v2. Its resulting in ambigious associated type errors on T
// + versioned_store::Trait
{
    // type Event: ...
    // Do we need Events?

    /// External type used to check if an account is part of a specific group.
    type GroupMembershipChecker: GroupMembershipChecker<<Self as system::Trait>::AccountId>;

    /// External type used to check if an account id has permission to create new class permissions.
    type CreateClassPermissionsChecker: CreateClassPermissionsChecker<
        <Self as system::Trait>::AccountId,
    >;
}

decl_storage! {
    trait Store for Module<T: Trait> as VersionedStorePermissions {
      pub ClassPermissionsByClassId get(class_permissions_by_class_id): linked_map ClassId => ClassPermissionsType<T>;
      pub EntityOwnerByEntityId get(entity_owner_by_entity_id): linked_map EntityId => BasePrincipal<T::AccountId, GroupId<T>>;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn on_finalize(_now: T::BlockNumber) {

        }

        // Methods for updating concrete permissions

        fn set_class_entity_permissions(origin, claimed_group_id: Option<GroupId<T>>, class_id: ClassId, entity_permissions: EntityPermissions<T::AccountId, GroupId<T>>) -> dispatch::Result  {
            // construct a BasePrincipal from origin and group_id
            let base_principal = Self::ensure_base_principal(origin, claimed_group_id)?;

            let mut class_permissions = Self::ensure_class_permissions(class_id)?;

            // Only admins can set entity permissions on class
            if class_permissions.is_admin(&base_principal) {
                class_permissions.entity_permissions = entity_permissions;
                <ClassPermissionsByClassId<T>>::insert(class_id, class_permissions);
                Ok(())
            } else {
                Err("NotAdmin")
            }
        }
    }
}

impl<T: Trait> Module<T> {
    /// Converts the origin and claimed group into a base principal.
    /// It expects only signed or root origins.
    /// If the signed origin is not a member of the claimed group an error is returned.
    fn ensure_base_principal(
        origin: T::Origin,
        claimed_group_id: Option<GroupId<T>>,
    ) -> Result<BasePrincipal<T::AccountId, GroupId<T>>, &'static str> {
        match origin.into() {
            Ok(system::RawOrigin::Root) => Ok(BasePrincipal::System),
            Ok(system::RawOrigin::Signed(account_id)) => {
                if let Some(group_id) = claimed_group_id {
                    if T::GroupMembershipChecker::account_is_in_group(account_id, group_id) {
                        Ok(BasePrincipal::GroupMember(group_id))
                    } else {
                        Err("OriginNotMemberOfClaimedGroup")
                    }
                } else {
                    Ok(BasePrincipal::Account(account_id))
                }
            }
            _ => Err("BadOrigin:ExpectedRootOrSigned"),
        }
    }

    /// Returns the stored class permissions if exist, error otherwise.
    fn ensure_class_permissions(
        class_id: ClassId,
    ) -> Result<ClassPermissionsType<T>, &'static str> {
        ensure!(
            <ClassPermissionsByClassId<T>>::exists(class_id),
            "ClassIdDoesNotExist"
        );
        Ok(Self::class_permissions_by_class_id(class_id))
    }
}
