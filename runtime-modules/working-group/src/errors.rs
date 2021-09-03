#![warn(missing_docs)]

use crate::{Config, Instance, Module};
use frame_support::decl_error;

decl_error! {
    /// Discussion module predefined errors
    pub enum Error for Module<T: Config<I>, I: Instance>{
        /// Provided stake balance cannot be zero.
        StakeBalanceCannotBeZero,

        /// Opening does not exist.
        OpeningDoesNotExist,

        /// Cannot fill opening with multiple applications.
        CannotHireMultipleLeaders,

        /// Worker application does not exist.
        WorkerApplicationDoesNotExist,

        /// Working group size limit exceeded.
        MaxActiveWorkerNumberExceeded,

        /// Successful worker application does not exist.
        SuccessfulWorkerApplicationDoesNotExist,

        /// There is leader already, cannot hire another one.
        CannotHireLeaderWhenLeaderExists,

        /// Not a lead account.
        IsNotLeadAccount,

        /// Current lead is not set.
        CurrentLeadNotSet,

        /// Worker does not exist.
        WorkerDoesNotExist,

        /// Invalid origin for a member.
        InvalidMemberOrigin,

        /// Signer is not worker role account.
        SignerIsNotWorkerRoleAccount,

        /// Staking less than the lower bound.
        BelowMinimumStakes,

        /// Insufficient balance to cover stake.
        InsufficientBalanceToCoverStake,

        /// Application stake is less than required opening stake.
        ApplicationStakeDoesntMatchOpening,

        /// Origin is not applicant.
        OriginIsNotApplicant,

        /// Invalid operation - worker is leaving.
        WorkerIsLeaving,

        /// Reward could not be zero.
        CannotRewardWithZero,

        /// Staking account doesn't belong to a member.
        InvalidStakingAccountForMember,

        /// Staking account contains conflicting stakes.
        ConflictStakesOnAccount,

        /// Worker has no recurring reward.
        WorkerHasNoReward,

        /// Specified unstaking period is less then minimum set for the group.
        UnstakingPeriodLessThanMinimum,

        /// Invalid spending amount.
        CannotSpendZero,

        /// It's not enough budget for this spending.
        InsufficientBudgetForSpending,

        /// Cannot fill opening - no applications provided.
        NoApplicationsProvided,

        /// Cannot decrease stake - stake delta greater than initial stake.
        CannotDecreaseStakeDeltaGreaterThanStake,

        /// Trying to fill opening with an application for other opening
        ApplicationsNotForOpening,
    }
}
