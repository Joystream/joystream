use codec::{Decode, Encode};
use rstd::collections::btree_set::BTreeSet;

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct PrincipalSet<PrincipalId>(BTreeSet<PrincipalId>);

impl<PrincipalId> From<Vec<PrincipalId>> for PrincipalSet<PrincipalId>
where
    PrincipalId: Ord,
{
    fn from(v: Vec<PrincipalId>) -> PrincipalSet<PrincipalId> {
        let mut set = PrincipalSet(BTreeSet::new());
        for principal in v.into_iter() {
            set.insert(principal);
        }
        set
    }
}

/// Default Base principal set is just an empty set.
impl<PrincipalId: Ord> Default for PrincipalSet<PrincipalId> {
    fn default() -> Self {
        PrincipalSet(BTreeSet::new())
    }
}

impl<PrincipalId: Ord> PrincipalSet<PrincipalId> {
    pub fn new() -> Self {
        Self(BTreeSet::new())
    }

    pub fn insert(&mut self, value: PrincipalId) -> bool {
        self.0.insert(value)
    }

    pub fn contains(&self, value: &PrincipalId) -> bool {
        self.0.contains(value)
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}

/// Type, derived from dispatchable call, identifies the caller
#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd, Clone, Debug)]
pub enum ActingAs<PrincipalId> {
    /// ROOT origin
    System,
    /// Caller identified as entity owner
    EntityOwner, // Maybe enclose EntityId?
    /// Verified PrincipalId
    Principal(PrincipalId),
    /// In cases where a signed extrinsic doesn't provide a PrincipalId
    Unspecified,
}
