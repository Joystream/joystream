//! This module contains the BountyStageCalculator - a bounty stage calculation helper.
//! It allows to get a bounty stage based on the current bounty state and the current system block.

use crate::{Bounty, BountyMilestone, BountyStage, Config, FundingType};

// Bounty stage helper.
pub(crate) struct BountyStageCalculator<'a, T: Config> {
    // current block number
    pub now: T::BlockNumber,
    // bounty object
    pub bounty: &'a Bounty<T>,
}

impl<'a, T: Config> BountyStageCalculator<'a, T> {
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
        if let BountyMilestone::Created {
            has_contributions,
            created_at,
        } = self.bounty.milestone.clone()
        {
            let funding_period_is_not_expired = !self.funding_period_expired(created_at);

            if funding_period_is_not_expired {
                return Some(BountyStage::Funding { has_contributions });
            }
        }

        None
    }

    // Calculates 'funding expired' stage of the bounty.
    // Returns None if conditions are not met.
    fn is_funding_expired_stage(&self) -> Option<BountyStage> {
        // Bounty was created. There can be some contributions. Funding period is not over.
        if let BountyMilestone::Created {
            has_contributions,
            created_at,
        } = self.bounty.milestone.clone()
        {
            let funding_period_is_expired = self.funding_period_expired(created_at);

            if funding_period_is_expired && !has_contributions {
                return Some(BountyStage::FundingExpired);
            }
        }

        None
    }

    // Calculates work submission stage of the bounty.
    // Returns None if conditions are not met.
    fn is_work_submission_stage(&self) -> Option<BountyStage> {
        match self.bounty.milestone.clone() {
            // Funding period is over. Minimum funding reached. Work period is not expired.
            BountyMilestone::Created { created_at, .. } => {
                match self.bounty.creation_params.funding_type {
                    // Perpetual funding is not reached its target yet.
                    FundingType::Perpetual { .. } => return None,
                    FundingType::Limited { funding_period, .. } => {
                        let minimum_funding_reached = self.minimum_funding_reached();
                        let funding_period_expired = self.funding_period_expired(created_at);
                        let working_period_is_not_expired =
                            !self.work_period_expired(created_at + funding_period);

                        if minimum_funding_reached
                            && funding_period_expired
                            && working_period_is_not_expired
                        {
                            return Some(BountyStage::WorkSubmission);
                        }
                    }
                }
            }
            // Maximum funding reached. Work period is not expired.
            BountyMilestone::BountyMaxFundingReached {
                max_funding_reached_at,
            } => {
                let work_period_is_not_expired = !self.work_period_expired(max_funding_reached_at);

                if work_period_is_not_expired {
                    return Some(BountyStage::WorkSubmission);
                }
            }
            // Work in progress. Work period is not expired.
            BountyMilestone::WorkSubmitted {
                work_period_started_at,
            } => {
                let work_period_is_not_expired = !self.work_period_expired(work_period_started_at);

                if work_period_is_not_expired {
                    return Some(BountyStage::WorkSubmission);
                }
            }
            _ => return None,
        }

        None
    }

    // Calculates judgment stage of the bounty.
    // Returns None if conditions are not met.
    fn is_judgment_stage(&self) -> Option<BountyStage> {
        // Can be judged only if there are work submissions.
        if let BountyMilestone::WorkSubmitted {
            work_period_started_at,
        } = self.bounty.milestone
        {
            let work_period_expired = self.work_period_expired(work_period_started_at);

            let judgment_period_is_not_expired =
                !self.judgment_period_expired(work_period_started_at);

            if work_period_expired && judgment_period_is_not_expired {
                return Some(BountyStage::Judgment);
            }
        }

        None
    }

    // Calculates withdrawal stage for the successful bounty.
    // Returns None if conditions are not met.
    fn is_successful_bounty_withdrawal_stage(&self) -> Option<BountyStage> {
        // The bounty judgment was submitted and the bounty is successful (there are some winners).
        if let BountyMilestone::JudgmentSubmitted { successful_bounty } =
            self.bounty.milestone.clone()
        {
            if successful_bounty {
                return Some(BountyStage::SuccessfulBountyWithdrawal);
            }
        }

        None
    }

    // Checks whether the minimum funding reached for the bounty.
    fn minimum_funding_reached(&self) -> bool {
        match self.bounty.creation_params.funding_type {
            // There is no minimum for the perpetual funding type - only maximum (target).
            FundingType::Perpetual { .. } => false,
            FundingType::Limited {
                min_funding_amount, ..
            } => self.bounty.total_funding >= min_funding_amount,
        }
    }

    // Checks whether the work period expired by now starting from the provided block number.
    fn work_period_expired(&self, work_period_started_at: T::BlockNumber) -> bool {
        work_period_started_at + self.bounty.creation_params.work_period < self.now
    }

    // Checks whether the funding period expired by now starting from the provided block number.
    fn funding_period_expired(&self, created_at: T::BlockNumber) -> bool {
        match self.bounty.creation_params.funding_type {
            // Never expires
            FundingType::Perpetual { .. } => false,
            FundingType::Limited { funding_period, .. } => created_at + funding_period < self.now,
        }
    }

    // Checks whether the judgment period expired by now when work period start from the provided
    // block number.
    fn judgment_period_expired(&self, work_period_started_at: T::BlockNumber) -> bool {
        work_period_started_at
            + self.bounty.creation_params.work_period
            + self.bounty.creation_params.judging_period
            < self.now
    }
}
