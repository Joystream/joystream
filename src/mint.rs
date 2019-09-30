use codec::{Decode, Encode};
use runtime_primitives::traits::{SimpleArithmetic, Zero};
use srml_support::ensure;

#[derive(Encode, Decode, Copy, Clone, Debug, Eq, PartialEq)]
pub enum AdjustCapacityBy<Balance: Zero> {
    /// Set capacity of mint to specific value
    Setting(Balance),
    /// Add to the capacity of the mint
    Adding(Balance),
    /// Reduce capacity of the mint
    Reducing(Balance),
}

impl<Balance: Zero> Default for AdjustCapacityBy<Balance> {
    fn default() -> Self {
        AdjustCapacityBy::Adding(Zero::zero())
    }
}

#[derive(Encode, Decode, Copy, Clone, Debug, Eq, PartialEq)]
pub struct AdjustOnInterval<Balance: Zero, BlockNumber: Zero> {
    pub block_interval: BlockNumber,
    pub adjustment_type: AdjustCapacityBy<Balance>,
}

impl<Balance: Zero, BlockNumber: Zero> Default for AdjustOnInterval<Balance, BlockNumber> {
    fn default() -> Self {
        AdjustOnInterval {
            block_interval: Zero::zero(),
            adjustment_type: Default::default(),
        }
    }
}

#[derive(Encode, Decode, Copy, Clone, Debug, Eq, PartialEq)]
pub enum Adjustment<Balance: Zero, BlockNumber: Zero> {
    // First adjustment will be after AdjustOnInterval.block_interval
    Interval(AdjustOnInterval<Balance, BlockNumber>),
    // First Adjustment will be at absolute blocknumber
    IntervalAfterFirstAdjustmentAbsolute(AdjustOnInterval<Balance, BlockNumber>, BlockNumber),
    // First Adjustment will be after a specified number of blocks
    IntervalAfterFirstAdjustmentRelative(AdjustOnInterval<Balance, BlockNumber>, BlockNumber),
}

#[derive(Encode, Decode, Default)]
// Note we don't use TokenMint<T: Trait> it breaks the Default derivation macro with error T doesn't impl Default
// Which requires manually implementing Default trait.
// We want Default trait on TokenMint so we can use it as value in StorageMap without needing to wrap it in an Option
pub struct Mint<Balance, BlockNumber>
where
    Balance: Copy + SimpleArithmetic + Zero,
    BlockNumber: Copy + SimpleArithmetic + Zero,
{
    capacity: Balance,

    adjustment_on_interval: AdjustOnInterval<Balance, BlockNumber>,

    // Whether there is an upcoming block where an adjustment to the mint will be made
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
    NextAdjustmentInPast,
}

impl<Balance, BlockNumber> Mint<Balance, BlockNumber>
where
    Balance: Copy + SimpleArithmetic + Zero,
    BlockNumber: Copy + SimpleArithmetic + Zero,
{
    pub fn new(
        initial_capacity: Balance,
        adjustment: Option<Adjustment<Balance, BlockNumber>>,
        now: BlockNumber,
    ) -> Self {
        Mint {
            capacity: initial_capacity,
            created_at: now,
            total_minted: Zero::zero(),
            adjust_capacity_at_block_number: adjustment.map(|adjustment| match adjustment {
                Adjustment::Interval(adjust_on_interval) => now + adjust_on_interval.block_interval,
                Adjustment::IntervalAfterFirstAdjustmentAbsolute(_, first_adjustment) => {
                    first_adjustment
                }
                Adjustment::IntervalAfterFirstAdjustmentRelative(_, first_adjustment) => {
                    now + first_adjustment
                }
            }),
            adjustment_on_interval: adjustment
                .map(|adjustment| match adjustment {
                    Adjustment::Interval(adjust_on_interval) => adjust_on_interval,
                    Adjustment::IntervalAfterFirstAdjustmentAbsolute(adjust_on_interval, _) => {
                        adjust_on_interval
                    }
                    Adjustment::IntervalAfterFirstAdjustmentRelative(adjust_on_interval, _) => {
                        adjust_on_interval
                    }
                })
                .unwrap_or(Default::default()),
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

    pub fn mint_some_tokens(&mut self, requested_amount: Balance) -> Balance {
        let minted = if self.capacity >= requested_amount {
            requested_amount
        } else {
            self.capacity
        };
        self.capacity -= minted;
        self.total_minted += minted;
        minted
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

    pub fn adjustment(&self) -> AdjustOnInterval<Balance, BlockNumber> {
        self.adjustment_on_interval
    }

    /// Updates capacity mints where the adjust_capacity_at_block_number value matches the current block number.
    /// At such time the value is updated by adding adjustment.block_interval.
    pub fn maybe_do_capacity_adjustment(&mut self, now: BlockNumber) -> bool {
        if !self.is_time_for_adjustment(now) {
            return false;
        }

        // update mint capacity
        self.adjust_capacity(self.adjustment_on_interval.adjustment_type);

        // set blocknumber for next adjustment
        self.adjust_capacity_at_block_number =
            Some(now + self.adjustment_on_interval.block_interval);

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
