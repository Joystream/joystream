use codec::{Decode, Encode};
use rstd::collections::btree_set::BTreeSet;

/// The principal type to which a permission can be assigned.
#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd, Clone, Debug)]
pub enum BasePrincipal<AccountId, GroupId> {
    Account(AccountId),
    GroupMember(GroupId),
}

/// The principal type to which entity permissions can be assigned.
#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd, Clone, Debug)]
pub enum EntityPrincipal<AccountId, GroupId> {
    Base(BasePrincipal<AccountId, GroupId>),
    Owner,
}

// type alias not enough here because we need to impl some methods
/// A BtreeSet of BasePrincipal
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct BasePrincipalSet<AccountId, GroupId>(BTreeSet<BasePrincipal<AccountId, GroupId>>);

impl<AccountId, GroupId> From<Vec<BasePrincipal<AccountId, GroupId>>>
    for BasePrincipalSet<AccountId, GroupId>
where
    AccountId: Ord,
    GroupId: Ord,
{
    fn from(v: Vec<BasePrincipal<AccountId, GroupId>>) -> BasePrincipalSet<AccountId, GroupId> {
        let mut set = BasePrincipalSet(BTreeSet::new());
        for principal in v.into_iter() {
            set.insert(principal);
        }
        set
    }
}

/// Default Base principal set is just an empty set.
impl<AccountId: Ord, GroupId: Ord> Default for BasePrincipalSet<AccountId, GroupId> {
    fn default() -> Self {
        BasePrincipalSet(BTreeSet::new())
    }
}

impl<AccountId: Ord, GroupId: Ord> BasePrincipalSet<AccountId, GroupId> {
    pub fn new() -> Self {
        Self(BTreeSet::new())
    }

    pub fn insert(&mut self, value: BasePrincipal<AccountId, GroupId>) -> bool {
        self.0.insert(value)
    }

    pub fn contains(&self, value: &BasePrincipal<AccountId, GroupId>) -> bool {
        self.0.contains(value)
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct EntityPrincipalSet<AccountId, GroupId>(BTreeSet<EntityPrincipal<AccountId, GroupId>>);

/// Default set gives entity owner permission on the entity
impl<AccountId: Ord, GroupId: Ord> Default for EntityPrincipalSet<AccountId, GroupId> {
    fn default() -> Self {
        let mut owner = BTreeSet::new();
        owner.insert(EntityPrincipal::Owner);
        EntityPrincipalSet(owner)
    }
}

impl<AccountId, GroupId> From<Vec<EntityPrincipal<AccountId, GroupId>>>
    for EntityPrincipalSet<AccountId, GroupId>
where
    AccountId: Ord,
    GroupId: Ord,
{
    fn from(v: Vec<EntityPrincipal<AccountId, GroupId>>) -> EntityPrincipalSet<AccountId, GroupId> {
        let mut set = EntityPrincipalSet(BTreeSet::new());
        for principal in v.into_iter() {
            set.insert(principal);
        }
        set
    }
}

impl<AccountId: Ord, GroupId: Ord> EntityPrincipalSet<AccountId, GroupId> {
    pub fn new() -> Self {
        Self(BTreeSet::new())
    }

    pub fn insert(&mut self, value: EntityPrincipal<AccountId, GroupId>) -> bool {
        self.0.insert(value)
    }

    pub fn contains(&self, value: &EntityPrincipal<AccountId, GroupId>) -> bool {
        self.0.contains(value)
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}
