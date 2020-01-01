use codec::{Decode, Encode};

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

/// Policy for staking
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone)]
pub struct StakingPolicy<Balance, BlockNumber> {
    // Staking amount
    pub amount: Balance,

    // How to interpret the amount requirement
    pub amount_mode: StakingAmountLimitMode,

    // The unstaking period length, if any, deactivation causes that are autonomous,
    // that is they are triggered internally to this module.
    pub crowded_out_unstaking_period_length: Option<BlockNumber>,
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

    /// Ensures that optional staking policy prescribes value that clears minimum balance requirement
    pub(crate) fn ensure_amount_valid_in_opt_staking_policy<Err>(
        opt_staking_policy: Option<StakingPolicy<Balance, BlockNumber>>,
        runtime_minimum_balance: Balance,
        error: Err,
    ) -> Result<(), Err> {
        if let Some(ref staking_policy) = opt_staking_policy {
            if staking_policy.amount < runtime_minimum_balance {
                return Err(error);
            }
        }

        Ok(())
    }
}

/// Constraints around staking amount
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Debug, Eq, PartialEq, Clone)]
pub enum StakingAmountLimitMode {
    AtLeast,
    Exact,
}
