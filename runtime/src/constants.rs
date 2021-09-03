use super::Balance;
use crate::{BlockNumber, Moment};
use frame_support::parameter_types;
use frame_support::traits::LockIdentifier;
use sp_std::collections::btree_set::BTreeSet;

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
pub const MILLISECS_PER_BLOCK: Moment = 6000;
pub const SECS_PER_BLOCK: Moment = MILLISECS_PER_BLOCK / 1000;

pub const SLOT_DURATION: Moment = 6000;
pub const BONDING_DURATION: u32 = 24;

pub const EPOCH_DURATION_IN_BLOCKS: BlockNumber = 10 * MINUTES;
pub const EPOCH_DURATION_IN_SLOTS: u64 = {
    const SLOT_FILL_RATE: f64 = MILLISECS_PER_BLOCK as f64 / SLOT_DURATION as f64;

    (EPOCH_DURATION_IN_BLOCKS as f64 * SLOT_FILL_RATE) as u64
};

// These time units are defined in number of blocks.
pub const MINUTES: BlockNumber = 60 / (SECS_PER_BLOCK as BlockNumber);
pub const HOURS: BlockNumber = MINUTES * 60;
pub const DAYS: BlockNumber = HOURS * 24;

// 1 in 4 blocks (on average, not counting collisions) will be primary babe blocks.
pub const PRIMARY_PROBABILITY: (u64, u64) = (1, 4);

/// This module is based on https://w3f-research.readthedocs.io/en/latest/polkadot/economics/1-token-economics.html#relay-chain-transaction-fees-and-per-block-transaction-limits
/// It was copied from Polkadot's implementation
pub mod fees {
    use super::{parameter_types, Balance};
    use frame_support::weights::constants::ExtrinsicBaseWeight;
    use frame_support::weights::{
        WeightToFeeCoefficient, WeightToFeeCoefficients, WeightToFeePolynomial,
    };
    use pallet_transaction_payment::{Multiplier, TargetedFeeAdjustment};
    use smallvec::smallvec;
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
    }

    /// Parameterized slow adjusting fee updated based on
    /// https://w3f-research.readthedocs.io/en/latest/polkadot/economics/1-token-economics.html#-2.-slow-adjusting-mechanism
    pub type SlowAdjustingFeeUpdate<R> =
        TargetedFeeAdjustment<R, TargetBlockFullness, AdjustmentVariable, MinimumMultiplier>;

    /// The block saturation level. Fees will be updates based on this value.
    pub const TARGET_BLOCK_FULLNESS: Perbill = Perbill::from_percent(25);

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
            // in Polkadot, extrinsic base weight (smallest non-zero weight) is mapped to 1/10 CENT:
            let p = super::currency::CENTS;
            let q = 10 * Balance::from(ExtrinsicBaseWeight::get());
            smallvec![WeightToFeeCoefficient {
                degree: 1,
                negative: false,
                coeff_frac: Perbill::from_rational_approximation(p % q, q),
                coeff_integer: p / q,
            }]
        }
    }
}

parameter_types! {
    pub const VotingLockId: LockIdentifier = [0; 8];
    pub const CandidacyLockId: LockIdentifier = [1; 8];
    pub const CouncilorLockId: LockIdentifier = [2; 8];
    pub const ProposalsLockId: LockIdentifier = [5; 8];
    pub const StorageWorkingGroupLockId: LockIdentifier = [6; 8];
    pub const ContentWorkingGroupLockId: LockIdentifier = [7; 8];
    pub const ForumGroupLockId: LockIdentifier = [8; 8];
    pub const MembershipWorkingGroupLockId: LockIdentifier = [9; 8];
    pub const InvitedMemberLockId: LockIdentifier = [10; 8];
    pub const StakingCandidateLockId: LockIdentifier = [11; 8];
    pub const BountyLockId: LockIdentifier = [12; 8];
}

// Staking lock ID used by nomination and validation in the staking pallet.
// This is a copye because the current Substrate staking lock ID is not exported.
const STAKING_LOCK_ID: LockIdentifier = *b"staking ";

lazy_static! {
    // pairs of allowed lock combinations
    pub static ref ALLOWED_LOCK_COMBINATIONS: BTreeSet<(LockIdentifier, LockIdentifier)> = [
        // format: `(lock_id, [all_compatible_lock_ids, ...])`
        (InvitedMemberLockId::get(), [
            VotingLockId::get(),
            CandidacyLockId::get(),
            CouncilorLockId::get(),
            STAKING_LOCK_ID,
            ProposalsLockId::get(),
            ForumGroupLockId::get(),
            ContentWorkingGroupLockId::get(),
            StorageWorkingGroupLockId::get(),
            MembershipWorkingGroupLockId::get(),
            StakingCandidateLockId::get(),
        ].to_vec()),
        (StakingCandidateLockId::get(), [
            VotingLockId::get(),
            CandidacyLockId::get(),
            CouncilorLockId::get(),
            STAKING_LOCK_ID,
            ProposalsLockId::get(),
            ForumGroupLockId::get(),
            ContentWorkingGroupLockId::get(),
            StorageWorkingGroupLockId::get(),
            MembershipWorkingGroupLockId::get(),
            InvitedMemberLockId::get(),
        ].to_vec()),
        (VotingLockId::get(), [
            InvitedMemberLockId::get(),
            CandidacyLockId::get(),
            CouncilorLockId::get(),
            STAKING_LOCK_ID,
            ProposalsLockId::get(),
            ForumGroupLockId::get(),
            ContentWorkingGroupLockId::get(),
            StorageWorkingGroupLockId::get(),
            MembershipWorkingGroupLockId::get(),
            StakingCandidateLockId::get(),
        ].to_vec()),
        (CandidacyLockId::get(), [
            InvitedMemberLockId::get(),
            VotingLockId::get(),
            CouncilorLockId::get(),
            StakingCandidateLockId::get(),
        ].to_vec()),
        (CouncilorLockId::get(), [
            InvitedMemberLockId::get(),
            VotingLockId::get(),
            CandidacyLockId::get(),
            StakingCandidateLockId::get(),
        ].to_vec()),
        // Proposals
        (ProposalsLockId::get(), [
            InvitedMemberLockId::get(),
            VotingLockId::get(),
            StakingCandidateLockId::get(),
        ].to_vec()),
        // Working Groups
        (ForumGroupLockId::get(), [
            InvitedMemberLockId::get(),
            VotingLockId::get(),
            StakingCandidateLockId::get(),
        ].to_vec()),
        (ContentWorkingGroupLockId::get(), [
            InvitedMemberLockId::get(),
            VotingLockId::get(),
            StakingCandidateLockId::get(),
        ].to_vec()),
        (StorageWorkingGroupLockId::get(), [
            InvitedMemberLockId::get(),
            VotingLockId::get(),
            StakingCandidateLockId::get(),
        ].to_vec()),
        (MembershipWorkingGroupLockId::get(), [
            InvitedMemberLockId::get(),
            VotingLockId::get(),
            StakingCandidateLockId::get(),
        ].to_vec()),
        // Bounty
        (BountyLockId::get(), [
            VotingLockId::get(),
            StakingCandidateLockId::get(),
        ].to_vec()),
    ]
    .iter()
    .fold(BTreeSet::new(), |mut acc, item| {
        for lock_id in &item.1 {
            acc.insert((item.0, *lock_id));
        }

        acc
    });
}

// Change it when changing the currency constants!
parameter_types! {
    pub const ExistentialDeposit: u128 = 10;
}

pub mod currency {
    use super::Balance;

    pub const JOYS: Balance = 250_000_000;
    pub const DOLLARS: Balance = JOYS / 12500; // 20_000
    pub const CENTS: Balance = DOLLARS / 100; // 200

    pub const fn deposit(items: u32, bytes: u32) -> Balance {
        items as Balance * 15 * CENTS + (bytes as Balance) * 6 * CENTS
    }
}

#[cfg(test)]
mod tests {
    use super::currency::{CENTS, DOLLARS};
    use super::fees::WeightToFee;
    use crate::{ExtrinsicBaseWeight, MAXIMUM_BLOCK_WEIGHT};
    use frame_support::weights::WeightToFeePolynomial;
    use pallet_balances::WeightInfo;

    #[test]
    // This function tests that the fee for `pallet_balances::transfer` of weight is correct
    fn extrinsic_transfer_fee_is_correct() {
        // Transfer fee should be less than 100 tokens and should be non-zero (Initially ~30)
        let transfer_weight = crate::weights::pallet_balances::WeightInfo::transfer();
        println!("Transfer weight: {}", transfer_weight);
        let transfer_fee = WeightToFee::calc(&transfer_weight);
        println!("Transfer fee: {}", transfer_fee);
        assert!(0 < transfer_fee && transfer_fee < 100);
    }

    #[test]
    // This function tests that the fee for `MAXIMUM_BLOCK_WEIGHT` of weight is correct
    fn full_block_fee_is_correct() {
        // A full block should cost 16 DOLLARS
        println!("Base: {}", ExtrinsicBaseWeight::get());
        let x = WeightToFee::calc(&MAXIMUM_BLOCK_WEIGHT);
        let y = 16 * DOLLARS;
        assert!(x.max(y) - x.min(y) < 1);
    }

    #[test]
    // This function tests that the fee for `ExtrinsicBaseWeight` of weight is correct
    fn extrinsic_base_fee_is_correct() {
        // `ExtrinsicBaseWeight` should cost 1/10 of a CENT
        println!("Base: {}", ExtrinsicBaseWeight::get());
        let x = WeightToFee::calc(&ExtrinsicBaseWeight::get());
        let y = CENTS / 10;
        assert!(x.max(y) - x.min(y) < 1);
    }
}
