//! This module contains the BountyStageCalculator - a bounty stage calculation helper.
//! It allows to get a bounty stage based on the current bounty state and the current system block.

use crate::{Bounty, BountyMilestone, BountyStage, FundingType, Trait};

// Bounty stage helper.
pub(crate) struct BountyStageCalculator<'a, T: Trait> {
    // current block number
    pub now: T::BlockNumber,
    // bounty object
    pub bounty: &'a Bounty<T>,
}

impl<'a, T: Trait> BountyStageCalculator<'a, T> {
    // Calculates the current bounty stage.
    pub(crate) fn get_bounty_stage(&self) -> BountyStage {
        self.is_funding_stage()
            .or_else(|| self.is_funding_expired_stage())
            .or_else(|| self.is_work_submission_stage())
            .or_else(|| self.is_judgment_stage())
            .or_else(|| self.is_successful_bounty_withdrawal_stage())
            .unwrap_or(BountyStage::FailedBountyWithdrawal)
    }

    // Calculates funding stage of the bounty.
    // Returns None if conditions are not met.
    fn is_funding_stage(&self) -> Option<BountyStage> {
        // Bounty was created. There can be some contributions. Funding period is not over.
        match self.bounty.milestone.clone() {
            BountyMilestone::Created {
                has_contributions,
                created_at,
            } => match self.funding_period_expired(created_at) {
                true => None,
                false => Some(BountyStage::Funding { has_contributions }),
            },
            _ => None,
        }
    }

    // Calculates 'funding expired' stage of the bounty.
    // Returns None if conditions are not met.
    fn is_funding_expired_stage(&self) -> Option<BountyStage> {
        // Bounty was created. There can be some contributions. Funding period is not over.
        match self.bounty.milestone.clone() {
            BountyMilestone::Created {
                has_contributions,
                created_at,
            } => match self.funding_period_expired(created_at) && !has_contributions {
                true => Some(BountyStage::FundingExpired),
                false => None,
            },
            _ => None,
        }
    }

    // Calculates work submission stage of the bounty.
    // Returns None if conditions are not met.
    fn is_work_submission_stage(&self) -> Option<BountyStage> {
        match self.bounty.milestone.clone() {
            // Funding period is over. Minimum funding reached. Work period is not expired.
            BountyMilestone::Created { created_at, .. } => {
                match self.bounty.creation_params.funding_type {
                    // Perpetual funding is not reached its target yet.
                    FundingType::Perpetual { .. } => None,
                    FundingType::Limited { .. } => {
                        let target_reached_and_period_expired = self.target_funding_reached()
                            && self.funding_period_expired(created_at);

                        match target_reached_and_period_expired {
                            true => Some(BountyStage::WorkSubmission),
                            false => None,
                        }
                    }
                }
            }
            // Target funding reached. Work period is not expired.
            BountyMilestone::BountyMaxFundingReached { .. } => Some(BountyStage::WorkSubmission),
            _ => None,
        }
    }

    // Calculates judgment stage of the bounty.
    // Returns None if conditions are not met.
    fn is_judgment_stage(&self) -> Option<BountyStage> {
        // Can be judged only if there are work submissions.
        if self.bounty.active_work_entry_count > 0
            && BountyMilestone::WorkSubmitted == self.bounty.milestone
        {
            return Some(BountyStage::Judgment);
        }

        None
    }

    // Calculates withdrawal stage for the bounty.
    // Returns None if conditions are not met.
    fn is_successful_bounty_withdrawal_stage(&self) -> Option<BountyStage> {
        //The bounty judgment was submitted and is successful (there are some winners)
        //or unsuccessful (all entries rejected).

        match self.bounty.milestone.clone() {
            BountyMilestone::JudgmentSubmitted { successful_bounty } => match successful_bounty {
                true => Some(BountyStage::SuccessfulBountyWithdrawal),
                false => Some(BountyStage::FailedBountyWithdrawal),
            },
            _ => None,
        }
    }

    // Checks whether the target funding reached for the bounty.
    fn target_funding_reached(&self) -> bool {
        match self.bounty.creation_params.funding_type {
            FundingType::Perpetual { .. } => false,
            FundingType::Limited { target, .. } => self.bounty.total_funding >= target,
        }
    }

    // Checks whether the funding period expired by now starting from the provided block number.
    fn funding_period_expired(&self, created_at: T::BlockNumber) -> bool {
        match self.bounty.creation_params.funding_type {
            // Never expires
            FundingType::Perpetual { .. } => false,
            FundingType::Limited { funding_period, .. } => created_at + funding_period < self.now,
        }
    }
}
