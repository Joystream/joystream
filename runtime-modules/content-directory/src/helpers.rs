use crate::*;
use core::ops::{Deref, DerefMut};

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
    ) -> Result<(), &'static str> {
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
    pub fn one(same_owner: bool, delta_mode: DeltaMode) -> Self {
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

/// Structure, respresenting `entity_id` mappings to their respective `InboundReferenceCounterDelta`
pub struct EntitiesInboundRcsDelta<T: Trait>(
    BTreeMap<T::EntityId, EntityReferenceCounterSideEffect>,
);

impl<T: Trait> Deref for EntitiesInboundRcsDelta<T> {
    type Target = BTreeMap<T::EntityId, EntityReferenceCounterSideEffect>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T: Trait> DerefMut for EntitiesInboundRcsDelta<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl<T: Trait> Default for EntitiesInboundRcsDelta<T> {
    fn default() -> Self {
        Self(BTreeMap::default())
    }
}

impl<T: Trait> EntitiesInboundRcsDelta<T> {
    /// Updates all the elements of `other` with `Self`
    pub fn update(mut self, mut other: Self) -> Self {
        let entity_ids: BTreeSet<T::EntityId> = self.keys().chain(other.keys()).copied().collect();
        for entity_id in entity_ids {
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

    /// Traverse `EntitiesInboundRcsDelta`, updating each `Entity` respective reference counters
    pub fn update_entities_rcs(self) {
        self.0
            .into_iter()
            .for_each(|(entity_id, inbound_reference_counter_delta)| {
                Module::<T>::update_entity_rc(entity_id, inbound_reference_counter_delta);
            });
    }
}
