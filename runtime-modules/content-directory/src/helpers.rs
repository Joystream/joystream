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

/// Structure, respresenting inbound entities rc mappings to their respective count for each `entity_id`
pub struct InboundEntitiesRc<T: Trait>(BTreeMap<T::EntityId, ReferenceCounter>);

impl<T: Trait> Deref for InboundEntitiesRc<T> {
    type Target = BTreeMap<T::EntityId, ReferenceCounter>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T: Trait> DerefMut for InboundEntitiesRc<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl<T: Trait> Default for InboundEntitiesRc<T> {
    fn default() -> Self {
        Self(BTreeMap::default())
    }
}

impl<T: Trait> InboundEntitiesRc<T> {
    /// Fill in `InboundEntitiesRc` mapping, based on `same_owner` flag provided
    pub fn fill_in_entity_rcs(&mut self, entity_ids: Vec<T::EntityId>, same_owner: bool) {
        for entity_id in entity_ids {
            match self.get_mut(&entity_id) {
                Some(reference_counter) if same_owner => {
                    reference_counter.inbound_same_owner_reference_counter += 1;
                }
                Some(reference_counter) => {
                    reference_counter.inbound_reference_counter += 1;
                }
                _ => {
                    self.insert(entity_id, ReferenceCounter::default());
                }
            }
        }
    }

    /// Traverse `InboundEntitiesRc`, increasing each `Entity` respective reference counters
    pub fn increase_entity_rcs(self) {
        self.0
            .into_iter()
            .for_each(|(entity_id, reference_counter)| {
                Module::<T>::increase_entity_rcs(&entity_id, reference_counter);
            });
    }

    /// Traverse `InboundEntitiesRc`, decreasing each `Entity` respective reference counters
    pub fn decrease_entity_rcs(self) {
        self.0
            .into_iter()
            .for_each(|(entity_id, reference_counter)| {
                Module::<T>::decrease_entity_rcs(&entity_id, reference_counter);
            });
    }
}
