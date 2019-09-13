use codec::{Decode, Encode};
use runtime_primitives::traits::{SimpleArithmetic, Zero};
use srml_support::ensure;

#[derive(Encode, Decode, Copy, Clone, Debug)]
pub enum AdjustCapacityBy<Balance> {
    // Set capacity of mint to specific value
    Setting(Balance),
    // Add to the capacity of the mint
    Adding(Balance),
    // Reduce capacity of the mint
    Reducing(Balance),
}

#[derive(Encode, Decode, Copy, Clone, Debug)]
pub struct AdjustOnInterval<Balance, BlockNumber> {
    pub block_interval: BlockNumber,
    pub adjustment_type: AdjustCapacityBy<Balance>,
}

#[derive(Encode, Decode, Default)]
// Note we don't use TokenMint<T: Trait> it breaks the Default derivation macro with error T doesn't impl Default
// Which requires manually implementing Default trait.
// We want Default trait on TokenMint so we can use it as value in StorageMap without needing to wrap it in an Option
pub struct Mint<Balance, BlockNumber>
where
    Balance: Copy + SimpleArithmetic,
    BlockNumber: Copy + SimpleArithmetic,
{
    capacity: Balance,

    adjustment_on_interval: Option<AdjustOnInterval<Balance, BlockNumber>>,

    // Whether there is an upcoming block where
    // When this is not set, the mint is effectively paused.
    adjust_capacity_at_block_number: Option<BlockNumber>,

    created_at: BlockNumber,

    total_minted: Balance,
}

#[derive(PartialEq, Eq, Debug)]
pub enum MintingError {
    NotEnoughCapacity,
    InvalidMint,
    InvalidSourceMint,
    InvalidDestinationMint,
}

impl<Balance, BlockNumber> Mint<Balance, BlockNumber>
where
    Balance: Copy + SimpleArithmetic,
    BlockNumber: Copy + SimpleArithmetic,
{
    pub fn new(
        initial_capacity: Balance,
        adjustment: Option<AdjustOnInterval<Balance, BlockNumber>>,
        now: BlockNumber,
    ) -> Self {
        Mint {
            capacity: initial_capacity,
            created_at: now,
            total_minted: Zero::zero(),
            adjust_capacity_at_block_number: adjustment
                .as_ref()
                .and_then(|adjustment| Some(now + adjustment.block_interval)),
            adjustment_on_interval: adjustment,
        }
    }

    pub fn mint_exact_tokens(&mut self, requested_amount: Balance) -> Result<(), MintingError> {
        ensure!(
            self.capacity >= requested_amount,
            MintingError::NotEnoughCapacity
        );
        self.capacity -= requested_amount;
        self.total_minted += requested_amount;
        Ok(())
    }

    pub fn mint_some_tokens(&mut self, requested_amount: Balance) -> Result<Balance, MintingError> {
        let minted = if self.capacity >= requested_amount {
            requested_amount
        } else {
            self.capacity
        };
        self.capacity -= minted;
        self.total_minted += minted;
        Ok(minted)
    }

    pub fn set_capacity(&mut self, new_capacity: Balance) {
        self.capacity = new_capacity;
    }

    pub fn can_mint(&self, amount: Balance) -> bool {
        self.capacity >= amount
    }

    pub fn created_at(&self) -> BlockNumber {
        self.created_at
    }

    pub fn total_minted(&self) -> Balance {
        self.total_minted
    }

    pub fn transfer_capacity_to(
        &mut self,
        destination: &mut Self,
        capacity_to_transfer: Balance,
    ) -> Result<(), MintingError> {
        ensure!(
            self.capacity >= capacity_to_transfer,
            MintingError::NotEnoughCapacity
        );
        self.capacity -= capacity_to_transfer;
        destination.capacity += capacity_to_transfer;
        Ok(())
    }

    /// Updates capacity mints where the adjust_capacity_at_block_number value matches the current block number.
    /// At such time the value is updated by adding adjustment_on_interval.block_interval.
    pub fn maybe_do_capacity_adjustment(&mut self, now: BlockNumber) -> bool {
        if !self.is_time_for_adjustment(now) {
            return false;
        }

        assert!(self.adjustment_on_interval.is_some());

        let adjustment = self.adjustment_on_interval.unwrap();

        // update mint capacity
        self.adjust_capacity(adjustment.adjustment_type);

        // set blocknumber for next adjustment
        self.adjust_capacity_at_block_number = Some(now + adjustment.block_interval);

        true
    }

    fn is_time_for_adjustment(&self, now: BlockNumber) -> bool {
        self.adjust_capacity_at_block_number
            .map_or(false, |block_number| block_number == now)
    }

    fn adjust_capacity(&mut self, adjustment: AdjustCapacityBy<Balance>) {
        self.capacity = match adjustment {
            AdjustCapacityBy::Adding(amount) => self.capacity + amount,
            AdjustCapacityBy::Setting(amount) => amount,
            AdjustCapacityBy::Reducing(amount) => {
                if amount > self.capacity {
                    Zero::zero()
                } else {
                    self.capacity - amount
                }
            }
        }
    }
}
