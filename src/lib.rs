// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;

use codec::{Codec, Decode, Encode};
use rstd::collections::btree_set::BTreeSet;
use runtime_primitives::traits::{MaybeSerializeDebug, Member, SimpleArithmetic};
use srml_support::{
    decl_module, decl_storage, ensure, EnumerableStorageMap, Parameter, StorageMap,
};
use system;

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
        + MaybeSerializeDebug
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
#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd)]
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
#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd)]
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
    AccountId: Ord,
    GroupId: Ord,
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

#[derive(Encode, Decode, Default)]
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
      pub ClassPermissionsByClassId get(class_permission): linked_map ClassId => ClassPermissions<ClassId, T::AccountId, GroupId<T>, PropertyIndex, T::BlockNumber>;
      pub EntityOwnerByEntityId get(entity_owner): linked_map EntityId => BasePrincipal<T::AccountId, GroupId<T>>;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn on_finalize(_now: T::BlockNumber) {

        }
    }
}

impl<T: Trait> Module<T> {}
