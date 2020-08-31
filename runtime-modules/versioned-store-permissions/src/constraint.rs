use codec::{Decode, Encode};
use sp_std::collections::btree_set::BTreeSet;

/// Reference to a specific property of a specific class.
#[derive(Encode, Decode, Eq, PartialEq, Ord, PartialOrd, Clone, Debug)]
pub struct PropertyOfClass<ClassId, PropertyIndex> {
    pub class_id: ClassId,
    pub property_index: PropertyIndex,
}

/// The type of constraint imposed on referencing a class via class property of type "Internal".
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub enum ReferenceConstraint<ClassId: Ord, PropertyIndex: Ord> {
    /// No property can reference the class.
    NoReferencingAllowed,

    /// Any property of any class may reference the class.
    NoConstraint,

    /// Only a set of properties of specific classes can reference the class.
    Restricted(BTreeSet<PropertyOfClass<ClassId, PropertyIndex>>),
}

impl<ClassId: Ord, PropertyIndex: Ord> Default for ReferenceConstraint<ClassId, PropertyIndex> {
    fn default() -> Self {
        ReferenceConstraint::NoReferencingAllowed
    }
}
