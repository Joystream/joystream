use super::*;

/// A voucher for `Entity` creation
#[derive(Encode, Decode, Clone, Copy, Debug, PartialEq, Eq)]
pub struct EntityCreationVoucher<T: Trait> {
    /// How many are allowed in total
    pub maximum_entities_count: T::EntityId,

    /// How many have currently been created
    pub entities_created: T::EntityId,
}

impl<T: Trait> Default for EntityCreationVoucher<T> {
    fn default() -> Self {
        Self {
            maximum_entities_count: T::EntityId::zero(),
            entities_created: T::EntityId::zero(),
        }
    }
}

impl<T: Trait> EntityCreationVoucher<T> {
    /// Create a new instance of `EntityCreationVoucher` with specified limit
    pub fn new(maximum_entities_count: T::EntityId) -> Self {
        Self {
            maximum_entities_count,
            entities_created: T::EntityId::zero(),
        }
    }

    /// Set new `maximum_entities_count` limit
    pub fn set_maximum_entities_count(&mut self, maximum_entities_count: T::EntityId) {
        self.maximum_entities_count = maximum_entities_count
    }

    /// Increase `entities_created` by 1
    pub fn increment_created_entities_count(&mut self) {
        self.entities_created += T::EntityId::one();
    }

    /// Decrease `entities_created` by 1
    pub fn decrement_created_entities_count(&mut self) {
        self.entities_created -= T::EntityId::one();
    }

    /// Check if `entities_created` is less than `maximum_entities_count` limit set to this `EntityCreationVoucher`
    pub fn limit_not_reached(&self) -> bool {
        self.entities_created < self.maximum_entities_count
    }

    /// Ensure new voucher`s max entities count is less than number of already created entities in this `EntityCreationVoucher`
    pub fn ensure_new_max_entities_count_is_valid(
        self,
        maximum_entities_count: T::EntityId,
    ) -> DispatchResult {
        ensure!(
            maximum_entities_count >= self.entities_created,
            ERROR_NEW_ENTITIES_MAX_COUNT_IS_LESS_THAN_NUMBER_OF_ALREADY_CREATED
        );
        Ok(())
    }

    /// Ensure voucher limit not reached
    pub fn ensure_voucher_limit_not_reached(&self) -> DispatchResult {
        ensure!(self.limit_not_reached(), ERROR_VOUCHER_LIMIT_REACHED);
        Ok(())
    }
}
