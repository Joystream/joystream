mod application;
mod opening;
mod staking_policy;

pub use application::*;
pub use opening::*;
pub use staking_policy::*;

#[derive(Eq, PartialEq, Clone, Debug)]
pub enum StakePurpose {
    Role,
    Application,
}

/// Informational result of the unstaked() method. Can be ignored.
#[derive(Debug, Eq, PartialEq, Clone, Copy)]
pub enum UnstakedResult {
    /// Non-existentent stake id provided
    StakeIdNonExistent,
    /// Application is not in 'Unstaking' state
    ApplicationIsNotUnstaking,
    /// Fully unstaked
    Unstaked,
    /// Unstaking in progress
    UnstakingInProgress,
}

#[derive(Eq, PartialEq, Clone, Debug)]
pub enum AddApplicationError {
    OpeningDoesNotExist,
    StakeProvidedWhenRedundant(StakePurpose),
    StakeMissingWhenRequired(StakePurpose),
    StakeAmountTooLow(StakePurpose),
    OpeningNotInAcceptingApplicationsStage,
    NewApplicationWasCrowdedOut,
}

#[derive(Eq, PartialEq, Clone, Debug)]
pub struct ApplicationAdded<ApplicationId> {
    /// ...
    pub application_id_added: ApplicationId,

    /// ...
    pub application_id_crowded_out: Option<ApplicationId>,
}

#[derive(Eq, PartialEq, Clone, Debug)]
pub enum DeactivateApplicationError {
    ApplicationDoesNotExist,
    ApplicationNotActive,
    OpeningNotAcceptingApplications,
    UnstakingPeriodTooShort(StakePurpose),
    RedundantUnstakingPeriodProvided(StakePurpose),
}

#[derive(Eq, PartialEq, Clone, Debug)]
pub enum CancelOpeningError {
    UnstakingPeriodTooShort(StakePurpose),
    RedundantUnstakingPeriodProvided(StakePurpose),
    OpeningDoesNotExist,
    OpeningNotInCancellableStage,
}

/// NB:
/// `OpeningCancelled` does not have the ideal form.
/// https://github.com/Joystream/substrate-hiring-module/issues/10
#[derive(Eq, PartialEq, Clone, Debug)]
pub struct OpeningCancelled {
    pub number_of_unstaking_applications: u32,
    pub number_of_deactivated_applications: u32,
}

#[derive(Eq, PartialEq, Clone, Debug)]
pub enum BeginReviewError {
    OpeningDoesNotExist,
    OpeningNotInAcceptingApplicationsStage,
}

#[derive(Eq, PartialEq, Clone, Debug)]
pub enum BeginAcceptingApplicationsError {
    OpeningDoesNotExist,
    OpeningIsNotInWaitingToBeginStage,
}

/// The possible outcome for an application in an opening which is being filled.
#[derive(Eq, PartialEq, Clone, Debug)]
pub enum ApplicationOutcomeInFilledOpening {
    Success,
    Failure,
}

#[derive(Eq, PartialEq, Clone, Debug)]
pub enum AddOpeningError {
    OpeningMustActivateInTheFuture,

    /// It is not possible to stake less than the minimum balance defined in the
    /// `Currency` module.
    StakeAmountLessThanMinimumCurrencyBalance(StakePurpose),

    /// It is not possible to provide application rationing policy with zero
    /// 'max_active_applicants' parameter.
    ApplicationRationingZeroMaxApplicants,
}
