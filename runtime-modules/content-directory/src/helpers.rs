use crate::*;
use core::ops::{Deref, DerefMut};

/// Wrapper for existing `InputPropertyValue` and its respective `Class` `Property`
pub struct InputValueForExistingProperty<'a, T: Trait>(&'a Property<T>, &'a InputPropertyValue<T>);

impl<'a, T: Trait> InputValueForExistingProperty<'a, T> {
    /// Create single instance of `InputValueForExistingProperty` from provided `property` and `value`
    fn new(property: &'a Property<T>, value: &'a InputPropertyValue<T>) -> Self {
        Self(property, value)
    }

    /// Retrieve `Property` reference
    pub fn get_property(&self) -> &Property<T> {
        self.0
    }

    /// Retrieve `InputPropertyValue` reference
    pub fn get_value(&self) -> &InputPropertyValue<T> {
        self.1
    }

    /// Retrieve `Property` and `InputPropertyValue` references
    pub fn unzip(&self) -> (&Property<T>, &InputPropertyValue<T>) {
        (self.0, self.1)
    }
}

/// Mapping, used to represent `PropertyId` relation to its respective `InputValueForExistingProperty` structure
pub struct InputValuesForExistingProperties<'a, T: Trait>(
    BTreeMap<PropertyId, InputValueForExistingProperty<'a, T>>,
);

impl<'a, T: Trait> Default for InputValuesForExistingProperties<'a, T> {
    fn default() -> Self {
        Self(BTreeMap::default())
    }
}

impl<'a, T: Trait> Deref for InputValuesForExistingProperties<'a, T> {
    type Target = BTreeMap<PropertyId, InputValueForExistingProperty<'a, T>>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<'a, T: Trait> DerefMut for InputValuesForExistingProperties<'a, T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl<'a, T: Trait> InputValuesForExistingProperties<'a, T> {
    /// Create `InputValuesForExistingProperties` helper structure from provided `property_values` and their corresponding `Class` properties.
    /// Throws an error, when `Class` `Property` under `property_id`, corresponding to provided `property_value` not found
    pub fn from(
        properties: &'a [Property<T>],
        property_values: &'a BTreeMap<PropertyId, InputPropertyValue<T>>,
    ) -> Result<Self, Error<T>> {
        let mut values_for_existing_properties = InputValuesForExistingProperties::<T>::default();
        for (&property_id, property_value) in property_values {
            let property = properties
                .get(property_id as usize)
                .ok_or(Error::<T>::ClassPropertyNotFound)?;
            values_for_existing_properties.insert(
                property_id,
                InputValueForExistingProperty::new(property, property_value),
            );
        }
        Ok(values_for_existing_properties)
    }
}

/// Wrapper for existing `OutputPropertyValue` and its respective `Class` `Property`
pub struct OutputValueForExistingProperty<'a, T: Trait>(
    &'a Property<T>,
    &'a OutputPropertyValue<T>,
);

impl<'a, T: Trait> OutputValueForExistingProperty<'a, T> {
    /// Create single instance of `OutputValueForExistingProperty` from provided `property` and `value`
    pub fn new(property: &'a Property<T>, value: &'a OutputPropertyValue<T>) -> Self {
        Self(property, value)
    }

    /// Retrieve `Property` reference
    pub fn get_property(&self) -> &Property<T> {
        self.0
    }

    /// Retrieve `OutputPropertyValue` reference
    pub fn get_value(&self) -> &OutputPropertyValue<T> {
        self.1
    }

    /// Retrieve `Property` and `OutputPropertyValue` references
    pub fn unzip(&self) -> (&Property<T>, &OutputPropertyValue<T>) {
        (self.0, self.1)
    }

    /// Check if Property is default and non `required`
    pub fn is_default(&self) -> bool {
        let (property, property_value) = self.unzip();
        !property.required && *property_value == OutputPropertyValue::<T>::default()
    }
}

/// Mapping, used to represent `PropertyId` relation to its respective `OutputValuesForExistingProperties` structure
pub struct OutputValuesForExistingProperties<'a, T: Trait>(
    BTreeMap<PropertyId, OutputValueForExistingProperty<'a, T>>,
);

impl<'a, T: Trait> Default for OutputValuesForExistingProperties<'a, T> {
    fn default() -> Self {
        Self(BTreeMap::default())
    }
}

impl<'a, T: Trait> Deref for OutputValuesForExistingProperties<'a, T> {
    type Target = BTreeMap<PropertyId, OutputValueForExistingProperty<'a, T>>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<'a, T: Trait> DerefMut for OutputValuesForExistingProperties<'a, T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl<'a, T: Trait> OutputValuesForExistingProperties<'a, T> {
    /// Create `OutputValuesForExistingProperties` helper structure from provided `property_values` and their corresponding `Class` properties.
    /// Throws an error, when `Class` `Property` under `property_id`, corresponding to provided `property_value` not found
    pub fn from(
        properties: &'a [Property<T>],
        property_values: &'a BTreeMap<PropertyId, OutputPropertyValue<T>>,
    ) -> Result<Self, Error<T>> {
        let mut values_for_existing_properties = OutputValuesForExistingProperties::<T>::default();
        for (&property_id, property_value) in property_values {
            let property = properties
                .get(property_id as usize)
                .ok_or(Error::<T>::ClassPropertyNotFound)?;
            values_for_existing_properties.insert(
                property_id,
                OutputValueForExistingProperty::new(property, property_value),
            );
        }
        Ok(values_for_existing_properties)
    }

    /// Used to compute hashes from `OutputPropertyValue`s and their respective property ids, which respective `Properties` have `unique` flag set
    /// (skip `PropertyId`s, which respective `property values` under this `Entity` are default and non `required`)
    pub fn compute_unique_hashes(&self) -> BTreeMap<PropertyId, T::Hash> {
        self.iter()
            .filter(|(_, value_for_property)| {
                // skip `PropertyId`s, which respective `property values` under this `Entity` are default and non `required`
                value_for_property.get_property().unique && !value_for_property.is_default()
            })
            .map(|(&property_id, property_value)| {
                (
                    property_id,
                    property_value.get_value().compute_unique_hash(property_id),
                )
            })
            .collect()
    }
}

/// Length constraint for input validation
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, Copy, PartialEq, Eq, Debug)]
pub struct InputValidationLengthConstraint {
    /// Minimum length
    min: u16,

    /// Difference between minimum length and max length.
    /// While having max would have been more direct, this
    /// way makes max < min unrepresentable semantically,
    /// which is safer.
    max_min_diff: u16,
}

impl InputValidationLengthConstraint {
    /// Create new `InputValidationLengthConstraint` constraint
    pub fn new(min: u16, max_min_diff: u16) -> Self {
        Self { min, max_min_diff }
    }

    /// Helper for computing max
    pub fn max(self) -> u16 {
        self.min + self.max_min_diff
    }

    /// Retrieve min length value
    pub fn min(self) -> u16 {
        self.min
    }

    /// Ensure length is valid
    pub fn ensure_valid<T: Trait>(
        self,
        len: usize,
        too_short_msg: Error<T>,
        too_long_msg: Error<T>,
    ) -> Result<(), Error<T>> {
        let length = len as u16;
        if length < self.min {
            Err(too_short_msg)
        } else if length > self.max() {
            Err(too_long_msg)
        } else {
            Ok(())
        }
    }
}

/// Enum, used to specify, which mode of operation should be chosen
#[derive(Clone, PartialEq, Eq, Copy, Debug)]
pub enum DeltaMode {
    Increment,
    Decrement,
}

impl Default for DeltaMode {
    fn default() -> Self {
        Self::Increment
    }
}

/// Representing delta on which respective `InboundReferenceCounter` should be changed.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, PartialEq, Eq, Debug)]
pub struct EntityReferenceCounterSideEffect {
    /// Delta number of all inbound references from another entities
    pub total: i32,
    /// Delta number of inbound references from another entities with `SameOwner` flag set
    pub same_owner: i32,
}

impl Clone for EntityReferenceCounterSideEffect {
    fn clone(&self) -> Self {
        *self
    }
}

impl Copy for EntityReferenceCounterSideEffect {}

impl EntityReferenceCounterSideEffect {
    /// Create atomic `EntityReferenceCounterSideEffect` instance, based on `same_owner` flag provided and `DeltaMode`
    pub fn atomic(same_owner: bool, delta_mode: DeltaMode) -> Self {
        let counter = if let DeltaMode::Increment = delta_mode {
            1
        } else {
            -1
        };

        if same_owner {
            Self {
                total: counter,
                same_owner: counter,
            }
        } else {
            Self {
                total: counter,
                same_owner: 0,
            }
        }
    }
}

impl AddAssign for EntityReferenceCounterSideEffect {
    fn add_assign(&mut self, other: EntityReferenceCounterSideEffect) {
        *self = Self {
            total: self.total + other.total,
            same_owner: self.same_owner + other.same_owner,
        };
    }
}

/// The net side effect on a set of entities from some operations.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct ReferenceCounterSideEffects<T: Trait>(
    BTreeMap<T::EntityId, EntityReferenceCounterSideEffect>,
);

impl<T: Trait> Deref for ReferenceCounterSideEffects<T> {
    type Target = BTreeMap<T::EntityId, EntityReferenceCounterSideEffect>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T: Trait> DerefMut for ReferenceCounterSideEffects<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl<T: Trait> Default for ReferenceCounterSideEffects<T> {
    fn default() -> Self {
        Self(BTreeMap::default())
    }
}

impl<T: Trait> ReferenceCounterSideEffects<T> {
    /// Updates all the elements of `other` with `Self`
    pub fn update(mut self, other: Self) -> Self {
        // Make a set, that includes both self and other entity_id keys
        let entity_ids: BTreeSet<T::EntityId> = self.keys().chain(other.keys()).copied().collect();

        for entity_id in entity_ids {
            // If `self` contains value under provided `entity_id`,
            // increase it on `EntityReferenceCounterSideEffect` value from `other` if exists,
            // otherwise update `self` entry under provided `entity_id` with `EntityReferenceCounterSideEffect` from `other`
            match (self.get_mut(&entity_id), other.get(&entity_id)) {
                (Some(self_entity_rc_side_effect), Some(other_entity_rc_side_effect)) => {
                    *self_entity_rc_side_effect += *other_entity_rc_side_effect
                }
                (_, Some(other_entity_rc_side_effect)) => {
                    self.insert(entity_id, *other_entity_rc_side_effect);
                }
                _ => (),
            }
        }
        self
    }

    /// Traverse `ReferenceCounterSideEffects`, updating each `Entity` respective reference counters
    pub fn update_entities_rcs(&self) {
        self.iter()
            .for_each(|(entity_id, inbound_reference_counter_delta)| {
                Module::<T>::update_entity_rc(*entity_id, *inbound_reference_counter_delta);
            });
    }
}
