use super::*;

/// A voucher for `Entity` creation
#[derive(Encode, Decode, Clone, Copy, Debug, PartialEq, Eq)]
pub struct EntityCreationVoucher<EntityId: BaseArithmetic> {
    /// How many are allowed in total
    pub maximum_entities_count: EntityId,

    /// How many have currently been created
    pub entities_created: EntityId,
}

impl<EntityId: BaseArithmetic> Default for EntityCreationVoucher<EntityId> {
    fn default() -> Self {
        Self {
            maximum_entities_count: EntityId::zero(),
            entities_created: EntityId::zero(),
        }
    }
}

impl<EntityId: BaseArithmetic> EntityCreationVoucher<EntityId> {
    /// Create a new instance of `EntityCreationVoucher` with specified limit
    pub fn new(maximum_entities_count: EntityId) -> Self {
        Self {
            maximum_entities_count,
            entities_created: EntityId::zero(),
        }
    }

    /// Set new `maximum_entities_count` limit
    pub fn set_maximum_entities_count(&mut self, maximum_entities_count: EntityId) {
        self.maximum_entities_count = maximum_entities_count
    }

    /// Increase `entities_created` by 1
    pub fn increment_created_entities_count(&mut self) {
        self.entities_created += EntityId::one();
    }

    /// Decrease `entities_created` by 1
    pub fn decrement_created_entities_count(&mut self) {
        self.entities_created -= EntityId::one();
    }

    /// Check if `entities_created` is less than `maximum_entities_count` limit set to this `EntityCreationVoucher`
    pub fn limit_not_reached(&self) -> bool {
        self.entities_created < self.maximum_entities_count
    }

    /// Ensure voucher limit not reached
    pub fn ensure_voucher_limit_not_reached<T: Trait>(&self) -> Result<(), Error<T>> {
        ensure!(self.limit_not_reached(), Error::<T>::VoucherLimitReached);
        Ok(())
    }
}
