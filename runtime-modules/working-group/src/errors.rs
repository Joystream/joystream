use srml_support::decl_error;

use membership::members;

decl_error! {
    /// Discussion module predefined errors
    pub enum Error {
        /// Provided stake balance cannot be zero.
        StakeBalanceCannotBeZero,

        /// Cannot get the worker stake profile.
        NoWorkerStakeProfile,

        /// Current lead is not set.
        CurrentLeadNotSet,

        /// Not a lead account.
        IsNotLeadAccount,

        /// Opening text too short.
        OpeningTextTooShort,

        /// Opening text too long.
        OpeningTextTooLong,

        /// Worker opening does not exist.
        WorkerOpeningDoesNotExist,

        /// Insufficient balance to apply.
        InsufficientBalanceToApply,

        /// Unsigned origin.
        MembershipUnsignedOrigin,

        /// Member id is invalid.
        MembershipInvalidMemberId,

        /// Signer does not match controller account.
        ApplyOnWorkerOpeningSignerNotControllerAccount,

        /// Origin must be controller or root account of member.
        OriginIsNeitherMemberControllerOrRoot,

        /// Member already has an active application on the opening.
        MemberHasActiveApplicationOnOpening,

        /// Worker application text too long.
        WorkerApplicationTextTooLong,

        /// Worker application text too short.
        WorkerApplicationTextTooShort,

        /// Insufficient balance to cover stake.
        InsufficientBalanceToCoverStake,

        /// Origin is not applicant.
        OriginIsNotApplicant,

        /// Worker application does not exist.
        WorkerApplicationDoesNotExist,

        /// Successful worker application does not exist.
        SuccessfulWorkerApplicationDoesNotExist,

        /// Reward policy has invalid next payment block number.
        FillWorkerOpeningInvalidNextPaymentBlock,

        /// Working group mint does not exist.
        FillWorkerOpeningMintDoesNotExist,

        ///Relationship must exist.
        RelationshipMustExist,

        /// Worker exit rationale text is too long.
        WorkerExitRationaleTextTooLong,

        /// Worker exit rationale text is too short.
        WorkerExitRationaleTextTooShort,

        /// Signer is not worker role account.
        SignerIsNotWorkerRoleAccount,

        /// Worker has no recurring reward.
        WorkerHasNoReward,

        /// Worker does not exist.
        WorkerDoesNotExist,

        /// Opening does not exist.
        AcceptWorkerApplicationsOpeningDoesNotExist,

        /// Opening Is Not in Waiting to begin.
        AcceptWorkerApplicationsOpeningIsNotWaitingToBegin,

        /// Opening does not exist.
        BeginWorkerApplicantReviewOpeningDoesNotExist,

        /// Opening Is Not in Waiting.
        BeginWorkerApplicantReviewOpeningOpeningIsNotWaitingToBegin,

        /// OpeningDoesNotExist.
        FullWorkerOpeningOpeningDoesNotExist,

        /// Opening not in review period stage.
        FullWorkerOpeningOpeningNotInReviewPeriodStage,

        /// Application stake unstaking period for successful applicants too short.
        FullWorkerOpeningUnsuccessfulApplicationStakeUnstakingPeriodTooShort,

        /// Application stake unstaking period for failed applicants too short.
        FullWorkerOpeningSuccessfulApplicationStakeUnstakingPeriodTooShort,

        /// Role stake unstaking period for successful applicants too short.
        FullWorkerOpeningSuccessfulRoleStakeUnstakingPeriodTooShort,

        /// Role stake unstaking period for failed applicants too short.
        FullWorkerOpeningUnsuccessfulRoleStakeUnstakingPeriodTooShort,

        /// Application stake unstaking period for successful applicants redundant.
        FullWorkerOpeningSuccessfulApplicationStakeUnstakingPeriodRedundant,

        /// Application stake unstaking period for failed applicants redundant.
        FullWorkerOpeningUnsuccessfulApplicationStakeUnstakingPeriodRedundant,

        /// Role stake unstaking period for successful applicants redundant.
        FullWorkerOpeningSuccessfulRoleStakeUnstakingPeriodRedundant,

        /// Role stake unstaking period for failed applicants redundant.
        FullWorkerOpeningUnsuccessfulRoleStakeUnstakingPeriodRedundant,

        /// Application does not exist.
        FullWorkerOpeningApplicationDoesNotExist,

        /// Application not in active stage.
        FullWorkerOpeningApplicationNotActive,

        /// Applications not for opening.
        FillWorkerOpeningApplicationForWrongOpening,

        /// Application does not exist.
        WithdrawWorkerApplicationApplicationDoesNotExist,

        /// Application is not active.
        WithdrawWorkerApplicationApplicationNotActive,

        /// Opening not accepting applications.
        WithdrawWorkerApplicationOpeningNotAcceptingApplications,

        /// UnstakingPeriodTooShort .... // <== SHOULD REALLY BE TWO SEPARATE, ONE FOR EACH STAKING PURPOSE
        WithdrawWorkerApplicationUnstakingPeriodTooShort,

        /// Redundant unstaking period provided
        WithdrawWorkerApplicationRedundantUnstakingPeriod,

        /// Opening does not activate in the future.
        AddWorkerOpeningActivatesInThePast,

        /// Role stake amount less than minimum currency balance.
        AddWorkerOpeningRoleStakeLessThanMinimum,

        /// Application stake amount less than minimum currency balance.
        AddWorkerOpeningAppliicationStakeLessThanMinimum,

        /// Opening does not exist.
        AddWorkerOpeningOpeningDoesNotExist,

        // <== SHOULD REALLY BE TWO SEPARATE, ONE FOR EACH STAKING PURPOSE
        /// Stake provided when redundant.
        AddWorkerOpeningStakeProvidedWhenRedundant,

        // <== SHOULD REALLY BE TWO SEPARATE, ONE FOR EACH STAKING PURPOSE
        /// Stake missing when required.
        AddWorkerOpeningStakeMissingWhenRequired,

        // <== SHOULD REALLY BE TWO SEPARATE, ONE FOR EACH STAKING PURPOSE
        /// Stake amount too low.
        AddWorkerOpeningStakeAmountTooLow,

        /// Opening is not in accepting applications stage.
        AddWorkerOpeningOpeningNotInAcceptingApplicationStage,

        /// New application was crowded out.
        AddWorkerOpeningNewApplicationWasCrowdedOut,

        /// Application rationing has zero max active applicants.
        AddWorkerOpeningZeroMaxApplicantCount,

        /// Next payment is not in the future.
        RecurringRewardsNextPaymentNotInFuture,

        /// Recipient not found.
        RecurringRewardsRecipientNotFound,

        /// Recipient reward source not found.
        RecurringRewardsRewardSourceNotFound,

        /// Reward relationship not found.
        RecurringRewardsRewardRelationshipNotFound,

        /// Stake not found.
        StakingErrorStakeNotFound,

        /// Unstaking period should be greater than zero.
        StakingErrorUnstakingPeriodShouldBeGreaterThanZero,

        /// Already unstaking.
        StakingErrorAlreadyUnstaking,

        /// Not staked.
        StakingErrorNotStaked,

        /// Cannot unstake while slashes ongoing.
        StakingErrorCannotUnstakeWhileSlashesOngoing,

        /// Insufficient balance in source account.
        StakingErrorInsufficientBalanceInSourceAccount,

        /// Cannot change stake by zero.
        StakingErrorCannotChangeStakeByZero,

        /// Cannot increase stake while unstaking.
        StakingErrorCannotIncreaseStakeWhileUnstaking,

        /// Cannot decrease stake while slashes ongoing.
        StakingErrorCannotDecreaseWhileSlashesOngoing,

        /// Insufficient stake to decrease.
        StakingErrorInsufficientStake,

        /// Slash amount should be greater than zero.
        StakingErrorSlashAmountShouldBeGreaterThanZero,

        /// Working group mint is not set.
        WorkingGroupMintIsNotSet,

        /// Cannot find mint in the minting module.
        CannotFindMint,

        /// Require root origin in extrinsics.
        RequireRootOrigin,
    }
}

impl From<system::Error> for Error {
    fn from(error: system::Error) -> Self {
        match error {
            system::Error::Other(msg) => Error::Other(msg),
            system::Error::RequireRootOrigin => Error::RequireRootOrigin,
            _ => Error::Other(error.into()),
        }
    }
}

/// Error wrapper for external module error conversions.
pub struct WrappedError<E> {
    /// Generic error.
    pub error: E,
}

/// Helps with conversion of other modules errors.
#[macro_export]
macro_rules! ensure_on_wrapped_error {
    ($call:expr) => {{
        { $call }.map_err(|err| crate::WrappedError { error: err })
    }};
}

impl rstd::convert::From<WrappedError<hiring::BeginAcceptingApplicationsError>> for Error {
    fn from(wrapper: WrappedError<hiring::BeginAcceptingApplicationsError>) -> Self {
        match wrapper.error {
            hiring::BeginAcceptingApplicationsError::OpeningDoesNotExist => {
                Error::AcceptWorkerApplicationsOpeningDoesNotExist
            }
            hiring::BeginAcceptingApplicationsError::OpeningIsNotInWaitingToBeginStage => {
                Error::AcceptWorkerApplicationsOpeningIsNotWaitingToBegin
            }
        }
    }
}

impl rstd::convert::From<WrappedError<hiring::AddOpeningError>> for Error {
    fn from(wrapper: WrappedError<hiring::AddOpeningError>) -> Self {
        match wrapper.error {
            hiring::AddOpeningError::OpeningMustActivateInTheFuture => {
                Error::AddWorkerOpeningActivatesInThePast
            }
            hiring::AddOpeningError::StakeAmountLessThanMinimumCurrencyBalance(purpose) => {
                match purpose {
                    hiring::StakePurpose::Role => Error::AddWorkerOpeningRoleStakeLessThanMinimum,
                    hiring::StakePurpose::Application => {
                        Error::AddWorkerOpeningAppliicationStakeLessThanMinimum
                    }
                }
            }
            hiring::AddOpeningError::ApplicationRationingZeroMaxApplicants => {
                Error::AddWorkerOpeningZeroMaxApplicantCount
            }
        }
    }
}

impl rstd::convert::From<WrappedError<hiring::BeginReviewError>> for Error {
    fn from(wrapper: WrappedError<hiring::BeginReviewError>) -> Self {
        match wrapper.error {
            hiring::BeginReviewError::OpeningDoesNotExist => {
                Error::BeginWorkerApplicantReviewOpeningDoesNotExist
            }
            hiring::BeginReviewError::OpeningNotInAcceptingApplicationsStage => {
                Error::BeginWorkerApplicantReviewOpeningOpeningIsNotWaitingToBegin
            }
        }
    }
}

impl<T: hiring::Trait> rstd::convert::From<WrappedError<hiring::FillOpeningError<T>>> for Error {
    fn from(wrapper: WrappedError<hiring::FillOpeningError<T>>) -> Self {
        match wrapper.error {
            hiring::FillOpeningError::<T>::OpeningDoesNotExist => {
                Error::FullWorkerOpeningOpeningDoesNotExist
            }
            hiring::FillOpeningError::<T>::OpeningNotInReviewPeriodStage => {
                Error::FullWorkerOpeningOpeningNotInReviewPeriodStage
            }
            hiring::FillOpeningError::<T>::UnstakingPeriodTooShort(
                stake_purpose,
                outcome_in_filled_opening,
            ) => match stake_purpose {
                hiring::StakePurpose::Application => match outcome_in_filled_opening {
                    hiring::ApplicationOutcomeInFilledOpening::Success => {
                        Error::FullWorkerOpeningSuccessfulApplicationStakeUnstakingPeriodTooShort
                    }
                    hiring::ApplicationOutcomeInFilledOpening::Failure => {
                        Error::FullWorkerOpeningUnsuccessfulApplicationStakeUnstakingPeriodTooShort
                    }
                },
                hiring::StakePurpose::Role => match outcome_in_filled_opening {
                    hiring::ApplicationOutcomeInFilledOpening::Success => {
                        Error::FullWorkerOpeningSuccessfulRoleStakeUnstakingPeriodTooShort
                    }
                    hiring::ApplicationOutcomeInFilledOpening::Failure => {
                        Error::FullWorkerOpeningUnsuccessfulRoleStakeUnstakingPeriodTooShort
                    }
                },
            },
            hiring::FillOpeningError::<T>::RedundantUnstakingPeriodProvided(
                stake_purpose,
                outcome_in_filled_opening,
            ) => match stake_purpose {
                hiring::StakePurpose::Application => match outcome_in_filled_opening {
                    hiring::ApplicationOutcomeInFilledOpening::Success => {
                        Error::FullWorkerOpeningSuccessfulApplicationStakeUnstakingPeriodRedundant
                    }
                    hiring::ApplicationOutcomeInFilledOpening::Failure => {
                        Error::FullWorkerOpeningUnsuccessfulApplicationStakeUnstakingPeriodRedundant
                    }
                },
                hiring::StakePurpose::Role => match outcome_in_filled_opening {
                    hiring::ApplicationOutcomeInFilledOpening::Success => {
                        Error::FullWorkerOpeningSuccessfulRoleStakeUnstakingPeriodRedundant
                    }
                    hiring::ApplicationOutcomeInFilledOpening::Failure => {
                        Error::FullWorkerOpeningUnsuccessfulRoleStakeUnstakingPeriodRedundant
                    }
                },
            },
            hiring::FillOpeningError::<T>::ApplicationDoesNotExist(_application_id) => {
                Error::FullWorkerOpeningApplicationDoesNotExist
            }
            hiring::FillOpeningError::<T>::ApplicationNotInActiveStage(_application_id) => {
                Error::FullWorkerOpeningApplicationNotActive
            }
            hiring::FillOpeningError::<T>::ApplicationForWrongOpening(_application_id) => {
                Error::FillWorkerOpeningApplicationForWrongOpening
            }
        }
    }
}

impl rstd::convert::From<WrappedError<hiring::DeactivateApplicationError>> for Error {
    fn from(wrapper: WrappedError<hiring::DeactivateApplicationError>) -> Self {
        match wrapper.error {
            hiring::DeactivateApplicationError::ApplicationDoesNotExist => {
                Error::WithdrawWorkerApplicationApplicationDoesNotExist
            }
            hiring::DeactivateApplicationError::ApplicationNotActive => {
                Error::WithdrawWorkerApplicationApplicationNotActive
            }
            hiring::DeactivateApplicationError::OpeningNotAcceptingApplications => {
                Error::WithdrawWorkerApplicationOpeningNotAcceptingApplications
            }
            hiring::DeactivateApplicationError::UnstakingPeriodTooShort(_stake_purpose) => {
                Error::WithdrawWorkerApplicationUnstakingPeriodTooShort
            }
            hiring::DeactivateApplicationError::RedundantUnstakingPeriodProvided(
                _stake_purpose,
            ) => Error::WithdrawWorkerApplicationRedundantUnstakingPeriod,
        }
    }
}

impl rstd::convert::From<WrappedError<hiring::AddApplicationError>> for Error {
    fn from(wrapper: WrappedError<hiring::AddApplicationError>) -> Self {
        match wrapper.error {
            hiring::AddApplicationError::OpeningDoesNotExist => {
                Error::AddWorkerOpeningOpeningDoesNotExist
            }
            hiring::AddApplicationError::StakeProvidedWhenRedundant(_stake_purpose) => {
                Error::AddWorkerOpeningStakeProvidedWhenRedundant
            }
            hiring::AddApplicationError::StakeMissingWhenRequired(_stake_purpose) => {
                Error::AddWorkerOpeningStakeMissingWhenRequired
            }
            hiring::AddApplicationError::StakeAmountTooLow(_stake_purpose) => {
                Error::AddWorkerOpeningStakeAmountTooLow
            }
            hiring::AddApplicationError::OpeningNotInAcceptingApplicationsStage => {
                Error::AddWorkerOpeningOpeningNotInAcceptingApplicationStage
            }
            hiring::AddApplicationError::NewApplicationWasCrowdedOut => {
                Error::AddWorkerOpeningNewApplicationWasCrowdedOut
            }
        }
    }
}

impl rstd::convert::From<WrappedError<members::MemberControllerAccountDidNotSign>> for Error {
    fn from(wrapper: WrappedError<members::MemberControllerAccountDidNotSign>) -> Self {
        match wrapper.error {
            members::MemberControllerAccountDidNotSign::UnsignedOrigin => {
                Error::MembershipUnsignedOrigin
            }
            members::MemberControllerAccountDidNotSign::MemberIdInvalid => {
                Error::MembershipInvalidMemberId
            }
            members::MemberControllerAccountDidNotSign::SignerControllerAccountMismatch => {
                Error::ApplyOnWorkerOpeningSignerNotControllerAccount
            }
        }
    }
}

impl rstd::convert::From<WrappedError<recurringrewards::RewardsError>> for Error {
    fn from(wrapper: WrappedError<recurringrewards::RewardsError>) -> Self {
        match wrapper.error {
            recurringrewards::RewardsError::NextPaymentNotInFuture => {
                Error::RecurringRewardsNextPaymentNotInFuture
            }
            recurringrewards::RewardsError::RecipientNotFound => {
                Error::RecurringRewardsRecipientNotFound
            }
            recurringrewards::RewardsError::RewardSourceNotFound => {
                Error::RecurringRewardsRewardSourceNotFound
            }
            recurringrewards::RewardsError::RewardRelationshipNotFound => {
                Error::RecurringRewardsRewardRelationshipNotFound
            }
        }
    }
}

impl rstd::convert::From<WrappedError<stake::StakeActionError<stake::InitiateUnstakingError>>>
    for Error
{
    fn from(wrapper: WrappedError<stake::StakeActionError<stake::InitiateUnstakingError>>) -> Self {
        match wrapper.error {
            stake::StakeActionError::StakeNotFound => Error::StakingErrorStakeNotFound,
            stake::StakeActionError::Error(initiate_unstaking_error) => {
                match initiate_unstaking_error {
                    stake::InitiateUnstakingError::UnstakingPeriodShouldBeGreaterThanZero => {
                        Error::StakingErrorUnstakingPeriodShouldBeGreaterThanZero
                    }
                    stake::InitiateUnstakingError::UnstakingError(unstaking_error) => {
                        match unstaking_error {
                            stake::UnstakingError::AlreadyUnstaking => {
                                Error::StakingErrorAlreadyUnstaking
                            }
                            stake::UnstakingError::NotStaked => Error::StakingErrorNotStaked,
                            stake::UnstakingError::CannotUnstakeWhileSlashesOngoing => {
                                Error::StakingErrorCannotUnstakeWhileSlashesOngoing
                            }
                        }
                    }
                }
            }
        }
    }
}

impl
    rstd::convert::From<
        WrappedError<stake::StakeActionError<stake::IncreasingStakeFromAccountError>>,
    > for Error
{
    fn from(
        wrapper: WrappedError<stake::StakeActionError<stake::IncreasingStakeFromAccountError>>,
    ) -> Self {
        match wrapper.error {
            stake::StakeActionError::StakeNotFound => Error::StakingErrorStakeNotFound,
            stake::StakeActionError::Error(increase_stake_error_from_account) => {
                match increase_stake_error_from_account {
                    stake::IncreasingStakeFromAccountError::InsufficientBalanceInSourceAccount => {
                        Error::StakingErrorInsufficientBalanceInSourceAccount
                    }
                    stake::IncreasingStakeFromAccountError::IncreasingStakeError(
                        increasing_stake_error,
                    ) => match increasing_stake_error {
                        stake::IncreasingStakeError::NotStaked => Error::StakingErrorNotStaked,
                        stake::IncreasingStakeError::CannotChangeStakeByZero => {
                            Error::StakingErrorCannotChangeStakeByZero
                        }
                        stake::IncreasingStakeError::CannotIncreaseStakeWhileUnstaking => {
                            Error::StakingErrorCannotIncreaseStakeWhileUnstaking
                        }
                    },
                }
            }
        }
    }
}

impl rstd::convert::From<WrappedError<stake::StakeActionError<stake::IncreasingStakeError>>>
    for Error
{
    fn from(wrapper: WrappedError<stake::StakeActionError<stake::IncreasingStakeError>>) -> Self {
        match wrapper.error {
            stake::StakeActionError::StakeNotFound => Error::StakingErrorStakeNotFound,
            stake::StakeActionError::Error(increasing_stake_error) => {
                match increasing_stake_error {
                    stake::IncreasingStakeError::NotStaked => Error::StakingErrorNotStaked,
                    stake::IncreasingStakeError::CannotChangeStakeByZero => {
                        Error::StakingErrorCannotChangeStakeByZero
                    }
                    stake::IncreasingStakeError::CannotIncreaseStakeWhileUnstaking => {
                        Error::StakingErrorCannotIncreaseStakeWhileUnstaking
                    }
                }
            }
        }
    }
}

impl rstd::convert::From<WrappedError<stake::StakeActionError<stake::DecreasingStakeError>>>
    for Error
{
    fn from(wrapper: WrappedError<stake::StakeActionError<stake::DecreasingStakeError>>) -> Self {
        match wrapper.error {
            stake::StakeActionError::StakeNotFound => Error::StakingErrorStakeNotFound,
            stake::StakeActionError::Error(decreasing_stake_error) => {
                match decreasing_stake_error {
                    stake::DecreasingStakeError::NotStaked => Error::StakingErrorNotStaked,
                    stake::DecreasingStakeError::CannotChangeStakeByZero => {
                        Error::StakingErrorCannotChangeStakeByZero
                    }
                    stake::DecreasingStakeError::CannotDecreaseStakeWhileUnstaking => {
                        Error::StakingErrorCannotIncreaseStakeWhileUnstaking
                    }
                    stake::DecreasingStakeError::CannotDecreaseStakeWhileOngoingSlahes => {
                        Error::StakingErrorCannotDecreaseWhileSlashesOngoing
                    }
                    stake::DecreasingStakeError::InsufficientStake => {
                        Error::StakingErrorInsufficientStake
                    }
                }
            }
        }
    }
}

impl rstd::convert::From<WrappedError<stake::StakeActionError<stake::ImmediateSlashingError>>>
    for Error
{
    fn from(wrapper: WrappedError<stake::StakeActionError<stake::ImmediateSlashingError>>) -> Self {
        match wrapper.error {
            stake::StakeActionError::StakeNotFound => Error::StakingErrorStakeNotFound,
            stake::StakeActionError::Error(slashing_error) => match slashing_error {
                stake::ImmediateSlashingError::NotStaked => Error::StakingErrorNotStaked,
                stake::ImmediateSlashingError::SlashAmountShouldBeGreaterThanZero => {
                    Error::StakingErrorSlashAmountShouldBeGreaterThanZero
                }
            },
        }
    }
}

impl rstd::convert::From<WrappedError<minting::GeneralError>> for Error {
    fn from(wrapper: WrappedError<minting::GeneralError>) -> Self {
        match wrapper.error {
            minting::GeneralError::MintNotFound => Error::CannotFindMint,
            minting::GeneralError::NextAdjustmentInPast => Error::Other("NextAdjustmentInPast"),
        }
    }
}
