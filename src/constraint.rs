use codec::{Decode, Encode};
use rstd::collections::btree_set::BTreeSet;

/// Pointer to a specific property of a specific class.
#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd, Clone, Debug)]
pub struct PropertyOfClass<ClassId, PropertyIndex> {
    pub class_id: ClassId,
    pub property_index: PropertyIndex,
}

/// The type of constraint on what entities can reference instances of a class through an Internal property type.
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
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
