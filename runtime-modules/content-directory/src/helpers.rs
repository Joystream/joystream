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

/// Enum, used to specify, which mode of operation should be chosen,
/// when calling `fill_in_inbound_entities_rcs` method on the instance of `EntitiesInboundRcsDelta`
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

#[derive(Default, Clone, PartialEq, Eq, Copy, Debug)]
pub struct InboundReferenceCounterDelta {
    /// Delta of inbound references from another entities
    pub reference_counter: InboundReferenceCounter,
    /// Delta of inbound references from another entities with `SameOwner` flag set
    pub delta_mode: DeltaMode,
}

impl InboundReferenceCounterDelta {
    /// Create simple `InboundReferenceCounterDelta` instance, based on `delta_mode`
    pub fn new(reference_counter: u32, same_owner_status: bool, delta_mode: DeltaMode) -> Self {
        Self {
            reference_counter: InboundReferenceCounter::new(reference_counter, same_owner_status),
            delta_mode,
        }
    }

    pub fn is_delta_mode_equal_to(&self, delta_mode: DeltaMode) -> bool {
        self.delta_mode == delta_mode
    }

    fn is_empty(&self) -> bool {
        self.reference_counter.is_total_equal_to_zero()
    }

    fn increment_entity_rc(&mut self, same_owner: bool) {
        self.reference_counter.total += 1;
        if same_owner {
            self.reference_counter.same_owner += 1;
        }
    }

    fn decrement_entity_rc(&mut self, same_owner: bool) {
        self.reference_counter.total -= 1;
        if same_owner {
            self.reference_counter.same_owner -= 1;
        }
    }

    fn flip_mode(&mut self) {
        if let DeltaMode::Increment = self.delta_mode {
            self.delta_mode = DeltaMode::Decrement
        } else {
            self.delta_mode = DeltaMode::Increment
        }
    }
}

/// Structure, respresenting entities inbound rc mappings to their respective count for each `entity_id`
pub struct EntitiesInboundRcsDelta<T: Trait>(BTreeMap<T::EntityId, InboundReferenceCounterDelta>);

impl<T: Trait> Deref for EntitiesInboundRcsDelta<T> {
    type Target = BTreeMap<T::EntityId, InboundReferenceCounterDelta>;

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
    /// Fill in `EntitiesInboundRcsDelta` mapping, based on `same_owner` flag provided and `delta_mode`
    pub fn fill_in_inbound_entities_rcs(
        &mut self,
        entity_ids: Vec<T::EntityId>,
        same_owner: bool,
        delta_mode: DeltaMode,
    ) {
        for entity_id in entity_ids {
            match self.get_mut(&entity_id) {
                Some(inbound_reference_counter_delta)
                    if inbound_reference_counter_delta.is_delta_mode_equal_to(delta_mode) =>
                {
                    inbound_reference_counter_delta.increment_entity_rc(same_owner);
                }
                Some(inbound_reference_counter_delta) => {
                    // Flip mode for current `InboundReferenceCounterDelta`,
                    // when total rc is equal to zero and reverse operation performed
                    if inbound_reference_counter_delta.is_empty() {
                        inbound_reference_counter_delta.flip_mode();
                        inbound_reference_counter_delta.increment_entity_rc(same_owner);
                    } else {
                        inbound_reference_counter_delta.decrement_entity_rc(same_owner);
                    }
                }
                _ => {
                    self.insert(entity_id, InboundReferenceCounterDelta::default());
                }
            }
        }
    }

    /// Traverse `EntitiesInboundRcsDelta`, updating each `Entity` respective reference counters
    pub fn update_entities_rc(self) {
        self.0
            .into_iter()
            .for_each(|(entity_id, inbound_reference_counter_delta)| {
                Module::<T>::update_entity_rc(
                    &entity_id,
                    inbound_reference_counter_delta.reference_counter,
                    inbound_reference_counter_delta.delta_mode,
                );
            });
    }
}
