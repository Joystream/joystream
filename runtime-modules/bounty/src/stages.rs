//! This module contains the BountyStageCalculator - a bounty stage calculation helper.
//! It allows to get a bounty stage based on the current bounty state and the current system block.

use crate::{Bounty, BountyMilestone, BountyStage, Trait};

// Bounty stage helper.
pub(crate) struct BountyStageCalculator<'a, T: Trait> {
    // current block number
    pub now: T::BlockNumber,
    // bounty object
    pub bounty: &'a Bounty<T>,
}

impl<'a, T: Trait> BountyStageCalculator<'a, T> {
    // Calculates funding stage of the bounty.
    // Returns None if conditions are not met.
    pub(crate) fn is_funding_stage(&self) -> Option<BountyStage> {
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

    // Calculates work submission stage of the bounty.
    // Returns None if conditions are not met.
    pub(crate) fn is_work_submission_stage(&self) -> Option<BountyStage> {
        match self.bounty.milestone.clone() {
            // Funding period is over. Minimum funding reached. Work period is not expired.
            BountyMilestone::Created { created_at, .. } => {
                // Limited funding period.
                if let Some(funding_period) = self.bounty.creation_params.funding_period {
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
    pub(crate) fn is_judgment_stage(&self) -> Option<BountyStage> {
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

    // Calculates withdrawal stage of the bounty.
    // Returns None if conditions are not met.
    pub(crate) fn withdrawal_stage(&self) -> BountyStage {
        let failed_bounty_withdrawal = BountyStage::Withdrawal {
            cherry_needs_withdrawal: false, // no cherry withdrawal on failed bounty
        };

        match self.bounty.milestone.clone() {
            // Funding period. No contributions or not enough contributions.
            BountyMilestone::Created {
                has_contributions,
                created_at,
            } => {
                let funding_period_expired = self.funding_period_expired(created_at);

                let minimum_funding_is_not_reached = !self.minimum_funding_reached();

                if minimum_funding_is_not_reached && funding_period_expired {
                    return BountyStage::Withdrawal {
                        cherry_needs_withdrawal: !has_contributions,
                    };
                }
            }
            // No work submitted.
            BountyMilestone::BountyMaxFundingReached {
                max_funding_reached_at,
            } => {
                let work_period_expired = self.work_period_expired(max_funding_reached_at);

                if work_period_expired {
                    return failed_bounty_withdrawal;
                }
            }
            // Bounty was canceled or vetoed. Allow cherry withdrawal.
            BountyMilestone::Canceled => {
                return BountyStage::Withdrawal {
                    cherry_needs_withdrawal: true,
                }
            }
            // It is withdrawal stage and the creator cherry has been already withdrawn.
            BountyMilestone::CreatorCherryWithdrawn => {
                return BountyStage::Withdrawal {
                    cherry_needs_withdrawal: false,
                }
            }
            // Work submitted but no judgment.
            BountyMilestone::WorkSubmitted {
                work_period_started_at,
            } => {
                let work_period_expired = self.work_period_expired(work_period_started_at);

                let judgment_period_is_expired =
                    self.judgment_period_expired(work_period_started_at);

                if work_period_expired && judgment_period_is_expired {
                    return failed_bounty_withdrawal;
                }
            }
            // The bounty judgment was submitted.
            BountyMilestone::JudgmentSubmitted { successful_bounty } => {
                return BountyStage::Withdrawal {
                    cherry_needs_withdrawal: successful_bounty,
                }
            }
        }

        failed_bounty_withdrawal
    }

    // Checks whether the minimum funding reached for the bounty.
    fn minimum_funding_reached(&self) -> bool {
        self.bounty.total_funding >= self.bounty.creation_params.min_amount
    }

    // Checks whether the work period expired by now starting from the provided block number.
    fn work_period_expired(&self, work_period_started_at: T::BlockNumber) -> bool {
        work_period_started_at + self.bounty.creation_params.work_period < self.now
    }

    // Checks whether the funding period expired by now starting from the provided block number.
    fn funding_period_expired(&self, created_at: T::BlockNumber) -> bool {
        // Limited funding period
        if let Some(funding_period) = self.bounty.creation_params.funding_period {
            return created_at + funding_period < self.now;
        }

        // Unlimited funding period
        false
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
