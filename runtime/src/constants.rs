use super::Balance;
use super::ExtrinsicBaseWeight;
use crate::{BlockNumber, Moment};
pub use common::locks::*;
use frame_support::parameter_types;
use frame_support::traits::LockIdentifier;
use sp_std::vec::Vec;

/// Constants for Babe.

/// Since BABE is probabilistic this is the average expected block time that
/// we are targetting. Blocks will be produced at a minimum duration defined
/// by `SLOT_DURATION`, but some slots will not be allocated to any
/// authority and hence no block will be produced. We expect to have this
/// block time on average following the defined slot duration and the value
/// of `c` configured for BABE (where `1 - c` represents the probability of
/// a slot being empty).
/// This value is only used indirectly to define the unit constants below
/// that are expressed in blocks. The rest of the code should use
/// `SLOT_DURATION` instead (like the timestamp module for calculating the
/// minimum period).
/// <https://research.web3.foundation/en/latest/polkadot/BABE/Babe/#6-practical-results>

// Normal 6s block interval
#[cfg(not(feature = "fast-block-production"))]
pub const MILLISECS_PER_BLOCK: Moment = 6000;
#[cfg(not(feature = "fast-block-production"))]
pub const SLOT_DURATION: Moment = 6000;

// 1s block interval for integration testing
#[cfg(feature = "fast-block-production")]
pub const MILLISECS_PER_BLOCK: Moment = 1000;
#[cfg(feature = "fast-block-production")]
pub const SLOT_DURATION: Moment = 1000;

const SECS_PER_BLOCK: Moment = MILLISECS_PER_BLOCK / 1000;
const MINUTES: BlockNumber = 60 / (SECS_PER_BLOCK as BlockNumber);

// Short epoch for faster tests related to bonding/unbonding
#[cfg(feature = "testing-runtime")]
pub const EPOCH_DURATION_IN_BLOCKS: BlockNumber = MINUTES / 2;
#[cfg(not(feature = "testing-runtime"))]
pub const EPOCH_DURATION_IN_BLOCKS: BlockNumber = MINUTES * 60;

pub const EPOCH_DURATION_IN_SLOTS: u64 = {
    const SLOT_FILL_RATE: f64 = MILLISECS_PER_BLOCK as f64 / SLOT_DURATION as f64;

    (EPOCH_DURATION_IN_BLOCKS as f64 * SLOT_FILL_RATE) as u64
};

// Session (aka Epoch) in BABE
pub const SESSIONS_PER_ERA: u32 = 6;
pub const BONDING_DURATION: u32 = 4 * 28; // 4 * 28 Eras (for 1h epoch this equals 6 * 4 * 28 -> 28 Days)
pub const SLASH_DEFER_DURATION: u32 = BONDING_DURATION - 1;

// 1 in 4 blocks (on average, not counting collisions) will be primary babe blocks.
pub const PRIMARY_PROBABILITY: (u64, u64) = (1, 4);

// ss58 Encoding address prefix for Joystream
pub const JOY_ADDRESS_PREFIX: u16 = 126;

/// This module is based on https://w3f-research.readthedocs.io/en/latest/polkadot/economics/1-token-economics.html#relay-chain-transaction-fees-and-per-block-transaction-limits
/// It was copied from Polkadot's implementation
pub mod fees {
    use super::ExtrinsicBaseWeight;
    use super::{parameter_types, Balance};
    use frame_support::weights::{
        WeightToFeeCoefficient, WeightToFeeCoefficients, WeightToFeePolynomial,
    };
    use pallet_transaction_payment::{Multiplier, TargetedFeeAdjustment};
    use smallvec::smallvec;
    use sp_runtime::traits::Bounded;
    use sp_runtime::FixedPointNumber;
    pub use sp_runtime::Perbill;
    use sp_runtime::Perquintill;

    parameter_types! {
        /// The portion of the `NORMAL_DISPATCH_RATIO` that we adjust the fees with. Blocks filled less
        /// than this will decrease the weight and more will increase.
        pub const TargetBlockFullness: Perquintill = Perquintill::from_percent(25);
        /// The adjustment variable of the runtime. Higher values will cause `TargetBlockFullness` to
        /// change the fees more rapidly.
        pub AdjustmentVariable: Multiplier = Multiplier::saturating_from_rational(3, 100_000);
        /// Minimum amount of the multiplier. This value cannot be too low. A test case should ensure
        /// that combined with `AdjustmentVariable`, we can recover from the minimum.
        /// See `multiplier_can_grow_from_zero`.
        pub MinimumMultiplier: Multiplier = Multiplier::saturating_from_rational(1, 1_000_000_000u128);
        /// The maximum amount of the multiplier.
        pub MaximumMultiplier: Multiplier = Bounded::max_value();
    }

    /// Parameterized slow adjusting fee updated based on
    /// https://w3f-research.readthedocs.io/en/latest/polkadot/economics/1-token-economics.html#-2.-slow-adjusting-mechanism
    pub type SlowAdjustingFeeUpdate<R> = TargetedFeeAdjustment<
        R,
        TargetBlockFullness,
        AdjustmentVariable,
        MinimumMultiplier,
        MaximumMultiplier,
    >;

    /// Handles converting a weight scalar to a fee value, based on the scale and granularity of the
    /// node's balance type.
    ///
    /// This should typically create a mapping between the following ranges:
    ///   - [0, MAXIMUM_BLOCK_WEIGHT]
    ///   - [Balance::min, Balance::max]
    ///
    /// Yet, it can be used for any other sort of change to weight-fee. Some examples being:
    ///   - Setting it to `0` will essentially disable the weight fee.
    ///   - Setting it to `1` will cause the literal `#[weight = x]` values to be charged.
    pub struct WeightToFee;
    impl WeightToFeePolynomial for WeightToFee {
        type Balance = Balance;
        fn polynomial() -> WeightToFeeCoefficients<Self::Balance> {
            let p = super::currency::CENTS;
            let q = 50 * Balance::from(ExtrinsicBaseWeight::get().ref_time());
            smallvec![WeightToFeeCoefficient {
                degree: 1,
                negative: false,
                coeff_frac: Perbill::from_rational(p % q, q),
                coeff_integer: p / q,
            }]
        }
    }
}

lazy_static! {
    pub static ref NON_RIVALROUS_LOCKS: Vec<LockIdentifier> = [
        VotingLockId::get(),
        VESTING_LOCK_ID,
        InvitedMemberLockId::get(),
        BoundStakingAccountLockId::get(),
    ]
    .to_vec();
}

pub mod currency {
    use super::Balance;

    /// One JOY equals 10 Billion base units (HAPIs). Hence we use 10 decimal places in
    /// currency representation.
    pub const BASE_UNIT_PER_JOY: Balance = 10_000_000_000;
    /// Total base unit issuance. 1 Billion JOY
    const BASE_UNIT_ISSUANCE: Balance = BASE_UNIT_PER_JOY.saturating_mul(1_000_000_000);
    /// Valuation of total issued base unit tokens in USD.
    const BASE_UNIT_ISSUANCE_USD_MCAP: Balance = 60_000_000;
    // Constants used to derive balance configurations of pallets more human readable

    /// Balance estimated worth one USD.
    pub const DOLLARS: Balance = BASE_UNIT_ISSUANCE.saturating_div(BASE_UNIT_ISSUANCE_USD_MCAP);
    /// Balance estimated worth one hundredth of a USD.
    pub const CENTS: Balance = DOLLARS.saturating_div(100);
    /// Balance estimated worth one thousandths of a cent.
    pub const MILLICENTS: Balance = CENTS.saturating_div(1_000);

    /// Minium Validator Bond to be set at genesis
    pub const MIN_VALIDATOR_BOND: Balance = DOLLARS.saturating_mul(2_500);
    /// Minium Nominator Bond to be set at genesis
    pub const MIN_NOMINATOR_BOND: Balance = DOLLARS.saturating_mul(100);

    /// Helper function to configure some bond/deposit amounts based cost of used storage.
    pub const fn deposit(items: u32, bytes: u32) -> Balance {
        (items as Balance)
            .saturating_mul(CENTS)
            .saturating_mul(15)
            .saturating_add((bytes as Balance).saturating_mul(CENTS).saturating_mul(6))
    }
}

#[cfg(test)]
mod tests {
    use super::currency::{CENTS, MILLICENTS};
    use super::fees::WeightToFee;
    use super::ExtrinsicBaseWeight;
    #[cfg(not(feature = "testing-runtime"))]
    use crate::{
        constants::currency::DOLLARS, Balance, MaximumBlockLength, Runtime, Weight,
        MAXIMUM_BLOCK_WEIGHT, NORMAL_DISPATCH_RATIO,
    };
    use frame_support::weights::WeightToFee as WeightToFeeT;
    use pallet_balances::WeightInfo;

    #[test]
    // This function tests that the fee for `pallet_balances::transfer` of weight is correct
    fn extrinsic_transfer_fee_is_correct() {
        // Transfer fee should be less than 1 CENTS
        let transfer_weight =
            crate::weights::pallet_balances::SubstrateWeight::<crate::Runtime>::transfer();
        println!("Transfer weight: {}", transfer_weight);
        let transfer_fee = WeightToFee::weight_to_fee(&transfer_weight);
        println!("Transfer fee: {}", transfer_fee);
        assert!(0 < transfer_fee && transfer_fee < CENTS);
    }

    // This test does not make sense for `fast-block-production`, because of 1s blocks
    #[cfg(not(feature = "fast-block-production"))]
    #[test]
    // This test verifies that the cost of filling blocks with max. normal dispatch extrinsics
    // total weight for 1 day is within the pre-determined bounds
    fn block_weight_fill_cost_per_day_is_correct() {
        // The bounds that we epect the cost to be within
        const BLOCK_WEIGHT_FILL_MIN_DAILY_COST: Balance = DOLLARS.saturating_mul(30_000);
        const BLOCK_WEIGHT_FILL_MAX_DAILY_COST: Balance = DOLLARS.saturating_mul(120_000);

        // Max normal dispatch block weight
        let max_normal_dispatch_block_weight: Weight = NORMAL_DISPATCH_RATIO * MAXIMUM_BLOCK_WEIGHT;

        let full_block_cost: Balance =
            WeightToFee::weight_to_fee(&max_normal_dispatch_block_weight);
        let day_of_full_blocks_cost =
            full_block_cost.saturating_mul(Balance::from(super::MINUTES * 60 * 24));

        println!(
            "weight per block: {}, block cost: {}¢, cost/day: ${}",
            max_normal_dispatch_block_weight,
            full_block_cost.saturating_div(CENTS),
            day_of_full_blocks_cost.saturating_div(DOLLARS),
        );

        assert!(day_of_full_blocks_cost >= BLOCK_WEIGHT_FILL_MIN_DAILY_COST);
        assert!(day_of_full_blocks_cost <= BLOCK_WEIGHT_FILL_MAX_DAILY_COST);
    }

    // This test does not make sense for `fast-block-productione`, because of 1s blocks
    #[cfg(not(feature = "fast-block-production"))]
    #[test]
    // This test verifies that the cost of filling blocks with max. normal dispatch extrinsics
    // total length for 1 day is within the pre-determined bounds
    fn block_length_fill_cost_per_day_is_correct() {
        // The bounds that we epect the cost to be within
        const BLOCK_LENGTH_FILL_MIN_DAILY_COST: Balance = DOLLARS.saturating_mul(30_000);
        const BLOCK_LENGTH_FILL_MAX_DAILY_COST: Balance = DOLLARS.saturating_mul(120_000);
        // Max normal dispatch block length
        let max_normal_dispatch_block_length: u64 =
            (NORMAL_DISPATCH_RATIO * MaximumBlockLength::get()) as u64;

        let full_block_cost: Balance =
            <Runtime as pallet_transaction_payment::Config>::LengthToFee::weight_to_fee(
                &Weight::from_parts(max_normal_dispatch_block_length, 0),
            );
        let day_of_full_blocks_cost =
            full_block_cost.saturating_mul(Balance::from(super::MINUTES * 60 * 24));

        println!(
            "bytes per block: {}, block cost: {}¢, cost/day: ${}",
            max_normal_dispatch_block_length,
            full_block_cost.saturating_div(CENTS),
            day_of_full_blocks_cost.saturating_div(DOLLARS),
        );

        assert!(day_of_full_blocks_cost >= BLOCK_LENGTH_FILL_MIN_DAILY_COST);
        assert!(day_of_full_blocks_cost <= BLOCK_LENGTH_FILL_MAX_DAILY_COST);
    }

    #[test]
    // This function tests that the fee for `ExtrinsicBaseWeight` of weight is correct
    fn extrinsic_base_fee_is_correct() {
        // `ExtrinsicBaseWeight` should cost 1/50 of a CENT
        println!("Base: {}", ExtrinsicBaseWeight::get());
        let x = WeightToFee::weight_to_fee(&ExtrinsicBaseWeight::get());
        let y = CENTS.saturating_div(50);
        assert!(x.max(y) - x.min(y) < MILLICENTS);
    }
}
