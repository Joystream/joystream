use crate::*;
use core::ops::{Deref, DerefMut};

/// Wrapper for existing `PropertyValue` and its respective `Class` `Property`
pub struct ValueForExistingProperty<'a, T: Trait>(&'a Property<T>, &'a PropertyValue<T>);

impl<'a, T: Trait> ValueForExistingProperty<'a, T> {
    /// Create single instance of `ValueForExistingProperty` from provided `property` and `value`
    fn new(property: &'a Property<T>, value: &'a PropertyValue<T>) -> Self {
        Self(property, value)
    }

    /// Retrieve `Property` reference
    pub fn get_property(&self) -> &Property<T> {
        self.0
    }

    /// Retrieve `Property` and `PropertyValue` references
    pub fn unzip(&self) -> (&Property<T>, &PropertyValue<T>) {
        (self.0, self.1)
    }
}

/// Mapping, used to represent `PropertyId` relation to its respective `ValueForExistingProperty` structure
pub struct ValuesForExistingProperties<'a, T: Trait>(
    BTreeMap<PropertyId, ValueForExistingProperty<'a, T>>,
);

impl<'a, T: Trait> Default for ValuesForExistingProperties<'a, T> {
    fn default() -> Self {
        Self(BTreeMap::default())
    }
}

impl<'a, T: Trait> Deref for ValuesForExistingProperties<'a, T> {
    type Target = BTreeMap<PropertyId, ValueForExistingProperty<'a, T>>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<'a, T: Trait> DerefMut for ValuesForExistingProperties<'a, T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl<'a, T: Trait> ValuesForExistingProperties<'a, T> {
    /// Create `ValuesForExistingProperties` helper structure from provided `property_values` and their corresponding `Class` properties
    pub fn from(
        properties: &'a [Property<T>],
        property_values: &'a BTreeMap<PropertyId, PropertyValue<T>>,
    ) -> Self {
        property_values.iter().fold(
            ValuesForExistingProperties::<T>::default(),
            |mut values_for_existing_properties, (&property_id, property_value)| {
                // Indexing is safe, class should always maintain such constistency
                let property = &properties[property_id as usize];
                values_for_existing_properties.insert(
                    property_id,
                    ValueForExistingProperty::new(property, property_value),
                );
                values_for_existing_properties
            },
        )
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
    pub fn new(min: u16, max_min_diff: u16) -> Self {
        Self { min, max_min_diff }
    }

    /// Helper for computing max
    pub fn max(self) -> u16 {
        self.min + self.max_min_diff
    }

    pub fn ensure_valid(
        self,
        len: usize,
        too_short_msg: &'static str,
        too_long_msg: &'static str,
    ) -> dispatch::Result {
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
#[derive(Default, Clone, PartialEq, Eq, Copy, Debug)]
pub struct EntityReferenceCounterSideEffect {
    /// Delta number of all inbound references from another entities
    pub total: i32,
    /// Delta number of inbound references from another entities with `SameOwner` flag set
    pub same_owner: i32,
}

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
    pub fn update(mut self, mut other: Self) -> Self {
        // Make a set, that includes both self and other entity_id keys
        let entity_ids: BTreeSet<T::EntityId> = self.keys().chain(other.keys()).copied().collect();

        for entity_id in entity_ids {
            // If `self` contains value under provided `entity_id`,
            // increase it on `EntityReferenceCounterSideEffect` value from `other` if exists,
            // otherwise update `self` entry under provided `entity_id` with `EntityReferenceCounterSideEffect` from `other`
            *self
                .entry(entity_id)
                // Unwrap always safe here.
                .or_insert_with(|| other.remove(&entity_id).unwrap()) +=
                if let Some(entity_rc_side_effect) = other.remove(&entity_id) {
                    entity_rc_side_effect
                } else {
                    EntityReferenceCounterSideEffect::default()
                };
        }
        self
    }

    /// Traverse `ReferenceCounterSideEffects`, updating each `Entity` respective reference counters
    pub fn update_entities_rcs(self) {
        self.0
            .into_iter()
            .for_each(|(entity_id, inbound_reference_counter_delta)| {
                Module::<T>::update_entity_rc(entity_id, inbound_reference_counter_delta);
            });
    }
}
