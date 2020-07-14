use codec::{Decode, Encode};

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

/// Policy for staking
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone, Default)]
pub struct StakingPolicy<Balance, BlockNumber> {
    /// Staking amount
    pub amount: Balance,

    /// How to interpret the amount requirement
    pub amount_mode: StakingAmountLimitMode,

    /// The unstaking period length, if any, deactivation causes that are autonomous,
    /// that is they are triggered internally to this module.
    pub crowded_out_unstaking_period_length: Option<BlockNumber>,

    /// The review period length
    pub review_period_expired_unstaking_period_length: Option<BlockNumber>,
}

impl<Balance: PartialOrd + Clone, BlockNumber: Clone> StakingPolicy<Balance, BlockNumber> {
    pub(crate) fn accepts_amount(&self, test_amount: &Balance) -> bool {
        match self.amount_mode {
            StakingAmountLimitMode::AtLeast => *test_amount >= self.amount,
            StakingAmountLimitMode::Exact => *test_amount == self.amount,
        }
    }

    pub(crate) fn opt_staking_policy_to_review_period_expired_unstaking_period(
        opt_staking_policy: &Option<StakingPolicy<Balance, BlockNumber>>,
    ) -> Option<BlockNumber> {
        if let Some(ref staking_policy) = opt_staking_policy {
            staking_policy
                .review_period_expired_unstaking_period_length
                .clone()
        } else {
            None
        }
    }

    pub(crate) fn opt_staking_policy_to_crowded_out_unstaking_period(
        opt_staking_policy: &Option<StakingPolicy<Balance, BlockNumber>>,
    ) -> Option<BlockNumber> {
        if let Some(ref staking_policy) = opt_staking_policy {
            staking_policy.crowded_out_unstaking_period_length.clone()
        } else {
            None
        }
    }
}

/// Constraints around staking amount
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone)]
pub enum StakingAmountLimitMode {
    /// Stake should be equal or greater than provided value
    AtLeast,

    /// Stake should be equal to provided value
    Exact,
}

impl Default for StakingAmountLimitMode {
    fn default() -> Self {
        StakingAmountLimitMode::Exact
    }
}
