mod convert;
mod input;
mod output;
mod property;

pub use convert::*;
pub use input::*;
pub use output::*;
pub use property::*;

pub use crate::{permissions::EntityAccessLevel, *};
pub use codec::{Decode, Encode};
use core::ops::Deref;
#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};

/// Type identificator for schema id
pub type SchemaId = u16;

/// A schema defines what properties describe an entity
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Clone, PartialEq, Eq)]
pub struct Schema {
    /// Indices into properties vector for the corresponding class.
    properties: BTreeSet<PropertyId>,
    /// If schema can be added to an entity
    is_active: bool,
}

impl Default for Schema {
    fn default() -> Self {
        Self {
            properties: BTreeSet::new(),
            // Default schema status
            is_active: true,
        }
    }
}

impl Schema {
    /// Create new schema with provided properties
    pub fn new(properties: BTreeSet<PropertyId>) -> Self {
        Self {
            properties,
            // Default schema status
            is_active: true,
        }
    }

    /// If `Schema` can be added to an entity
    pub fn is_active(&self) -> bool {
        self.is_active
    }

    /// Ensure schema in `active` status
    pub fn ensure_is_active<T: Config>(&self) -> Result<(), Error<T>> {
        ensure!(self.is_active, Error::<T>::ClassSchemaNotActive);
        Ok(())
    }

    /// Get `Schema` `properties` by reference
    pub fn get_properties(&self) -> &BTreeSet<PropertyId> {
        &self.properties
    }

    /// Ensure keys of provided `property_values` are valid indices of current `Schema`
    pub fn ensure_has_properties<T: Config>(
        &self,
        property_values: &BTreeMap<PropertyId, InputPropertyValue<T>>,
    ) -> Result<(), Error<T>> {
        let property_value_indices: BTreeSet<PropertyId> =
            property_values.keys().cloned().collect();

        ensure!(
            property_value_indices.is_subset(&self.properties),
            Error::<T>::SchemaDoesNotContainProvidedPropertyId
        );

        Ok(())
    }

    /// Get `Schema` `properties` by mutable reference
    pub fn get_properties_mut(&mut self) -> &mut BTreeSet<PropertyId> {
        &mut self.properties
    }

    /// Set `Schema`'s `is_active` flag as provided
    pub fn set_status(&mut self, is_active: bool) {
        self.is_active = is_active;
    }
}
