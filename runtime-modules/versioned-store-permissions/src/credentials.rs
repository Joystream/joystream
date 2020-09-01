use codec::{Decode, Encode};
use sp_std::collections::btree_set::BTreeSet;
use sp_std::vec::Vec;

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct CredentialSet<Credential>(BTreeSet<Credential>);

impl<Credential> From<Vec<Credential>> for CredentialSet<Credential>
where
    Credential: Ord,
{
    fn from(v: Vec<Credential>) -> CredentialSet<Credential> {
        let mut set = CredentialSet(BTreeSet::new());
        for credential in v.into_iter() {
            set.insert(credential);
        }
        set
    }
}

/// Default CredentialSet set is just an empty set.
impl<Credential: Ord> Default for CredentialSet<Credential> {
    fn default() -> Self {
        CredentialSet(BTreeSet::new())
    }
}

impl<Credential: Ord> CredentialSet<Credential> {
    pub fn new() -> Self {
        Self(BTreeSet::new())
    }

    pub fn insert(&mut self, value: Credential) -> bool {
        self.0.insert(value)
    }

    pub fn contains(&self, value: &Credential) -> bool {
        self.0.contains(value)
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}

/// Type, derived from dispatchable call, identifies the caller
#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd, Clone, Debug)]
pub enum AccessLevel<Credential> {
    /// ROOT origin
    System,
    /// Caller identified as the entity maintainer
    EntityMaintainer, // Maybe enclose EntityId?
    /// Verified Credential
    Credential(Credential),
    /// In cases where a signed extrinsic doesn't provide a Credential
    Unspecified,
}
