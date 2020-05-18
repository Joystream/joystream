use membership::members;

//TODO: convert messages to the decl_error! entries
pub mod bureaucracy_errors {
    pub static MSG_CURRENT_LEAD_NOT_SET: &str = "Current lead is not set";
    pub static MSG_IS_NOT_LEAD_ACCOUNT: &str = "Not a lead account";
    pub static MSG_OPENING_TEXT_TOO_SHORT: &str = "Opening text too short";
    pub static MSG_OPENING_TEXT_TOO_LONG: &str = "Opening text too long";
    pub static MSG_WORKER_OPENING_DOES_NOT_EXIST: &str = "Worker opening does not exist";
    pub static MSG_INSUFFICIENT_BALANCE_TO_APPLY: &str = "Insufficient balance to apply";
    pub static MSG_MEMBERSHIP_UNSIGNED_ORIGIN: &str = "Unsigned origin";
    pub static MSG_MEMBERSHIP_INVALID_MEMBER_ID: &str = "Member id is invalid";
    pub static MSG_APPLY_ON_WORKER_OPENING_SIGNER_NOT_CONTROLLER_ACCOUNT: &str =
        "Signer does not match controller account";
    pub static MSG_ORIGIN_IS_NEITHER_MEMBER_CONTROLLER_OR_ROOT: &str =
        "Origin must be controller or root account of member";
    pub static MSG_MEMBER_HAS_ACTIVE_APPLICATION_ON_OPENING: &str =
        "Member already has an active application on the opening";
    pub static MSG_WORKER_APPLICATION_TEXT_TOO_LONG: &str = "Worker application text too long";
    pub static MSG_WORKER_APPLICATION_TEXT_TOO_SHORT: &str = "Worker application text too short";
    pub static MSG_INSUFFICIENT_BALANCE_TO_COVER_STAKE: &str =
        "Insuffieicnt balance to cover stake";
    pub static MSG_ORIGIN_IS_NOT_APPLICANT: &str = "Origin is not applicant";
    pub static MSG_WORKER_APPLICATION_DOES_NOT_EXIST: &str = "Worker application does not exist";
    pub static MSG_SUCCESSFUL_WORKER_APPLICATION_DOES_NOT_EXIST: &str =
        "Successful worker application does not exist";
    pub static MSG_FILL_WORKER_OPENING_INVALID_NEXT_PAYMENT_BLOCK: &str =
        "Reward policy has invalid next payment block number";
    pub static MSG_FILL_WORKER_OPENING_MINT_DOES_NOT_EXIST: &str =
        "Working group mint does not exist";
}
/*
 * The errors below, while in many cases encoding similar outcomes,
 * are scoped to the specific extrinsic for which they are used.
 * The reason for this is that it will later to easier to convert this
 * representation into into the type safe error encoding coming in
 * later versions of Substrate.
 */

// Errors for `accept_worker_applications`
pub static MSG_ACCEPT_WORKER_APPLICATIONS_OPENING_DOES_NOT_EXIST: &str = "Opening does not exist";
pub static MSG_ACCEPT_WORKER_APPLICATIONS_OPENING_IS_NOT_WAITING_TO_BEGIN: &str =
    "Opening Is Not in Waiting to begin";

// Errors for `begin_worker_applicant_review`
pub static MSG_BEGIN_WORKER_APPLICANT_REVIEW_OPENING_DOES_NOT_EXIST: &str =
    "Opening does not exist";
pub static MSG_BEGIN_WORKER_APPLICANT_REVIEW_OPENING_OPENING_IS_NOT_WAITING_TO_BEGIN: &str =
    "Opening Is Not in Waiting";

// Errors for `fill_worker_opening`
pub static MSG_FULL_WORKER_OPENING_OPENING_DOES_NOT_EXIST: &str = "OpeningDoesNotExist";
pub static MSG_FULL_WORKER_OPENING_OPENING_NOT_IN_REVIEW_PERIOD_STAGE: &str =
    "OpeningNotInReviewPeriodStage";
pub static MSG_FULL_WORKER_OPENING_UNSUCCESSFUL_APPLICATION_STAKE_UNSTAKING_PERIOD_TOO_SHORT: &str =
    "Application stake unstaking period for successful applicants too short";
pub static MSG_FULL_WORKER_OPENING_SUCCESSFUL_APPLICATION_STAKE_UNSTAKING_PERIOD_TOO_SHORT: &str =
    "Application stake unstaking period for failed applicants too short";
pub static MSG_FULL_WORKER_OPENING_SUCCESSFUL_ROLE_STAKE_UNSTAKING_PERIOD_TOO_SHORT: &str =
    "Role stake unstaking period for successful applicants too short";
pub static MSG_FULL_WORKER_OPENING_UNSUCCESSFUL_ROLE_STAKE_UNSTAKING_PERIOD_TOO_SHORT: &str =
    "Role stake unstaking period for failed applicants too short";
pub static MSG_FULL_WORKER_OPENING_SUCCESSFUL_APPLICATION_STAKE_UNSTAKING_PERIOD_REDUNDANT: &str =
    "Application stake unstaking period for successful applicants redundant";
pub static MSG_FULL_WORKER_OPENING_UNSUCCESSFUL_APPLICATION_STAKE_UNSTAKING_PERIOD_REDUNDANT: &str =
    "Application stake unstaking period for failed applicants redundant";
pub static MSG_FULL_WORKER_OPENING_SUCCESSFUL_ROLE_STAKE_UNSTAKING_PERIOD_REDUNDANT: &str =
    "Role stake unstaking period for successful applicants redundant";
pub static MSG_FULL_WORKER_OPENING_UNSUCCESSFUL_ROLE_STAKE_UNSTAKING_PERIOD_REDUNDANT: &str =
    "Role stake unstaking period for failed applicants redundant";
pub static MSG_FULL_WORKER_OPENING_APPLICATION_DOES_NOT_EXIST: &str = "ApplicationDoesNotExist";
pub static MSG_FULL_WORKER_OPENING_APPLICATION_NOT_ACTIVE: &str = "ApplicationNotInActiveStage";
pub static MSG_FILL_WORKER_OPENING_APPLICATION_FOR_WRONG_OPENING: &str =
    "Applications not for opening";
// Errors for `withdraw_worker_application`
pub static MSG_WITHDRAW_WORKER_APPLICATION_APPLICATION_DOES_NOT_EXIST: &str =
    "ApplicationDoesNotExist";
pub static MSG_WITHDRAW_WORKER_APPLICATION_APPLICATION_NOT_ACTIVE: &str = "ApplicationNotActive";
pub static MSG_WITHDRAW_WORKER_APPLICATION_OPENING_NOT_ACCEPTING_APPLICATIONS: &str =
    "OpeningNotAcceptingApplications";
pub static MSG_WITHDRAW_WORKER_APPLICATION_UNSTAKING_PERIOD_TOO_SHORT: &str =
    "UnstakingPeriodTooShort ..."; // <== SHOULD REALLY BE TWO SEPARATE, ONE FOR EACH STAKING PURPOSE
pub static MSG_WITHDRAW_WORKER_APPLICATION_REDUNDANT_UNSTAKING_PERIOD: &str =
    "RedundantUnstakingPeriodProvided ...";

// Errors for `create_channel`
pub static MSG_CREATE_CHANNEL_IS_NOT_MEMBER: &str = "Is not a member";
pub static MSG_CREATE_CHANNEL_NOT_CONTROLLER_ACCOUNT: &str =
    "Account is not controller account of member";

// Errors for `add_worker_opening`
pub static MSG_ADD_WORKER_OPENING_ACTIVATES_IN_THE_PAST: &str =
    "Opening does not activate in the future";
pub static MSG_ADD_WORKER_OPENING_ROLE_STAKE_LESS_THAN_MINIMUM: &str =
    "Role stake amount less than minimum currency balance";
pub static MSG_ADD_WORKER_OPENING_APPLIICATION_STAKE_LESS_THAN_MINIMUM: &str =
    "Application stake amount less than minimum currency balance";
pub static MSG_ADD_WORKER_OPENING_OPENING_DOES_NOT_EXIST: &str = "OpeningDoesNotExist";
pub static MSG_ADD_WORKER_OPENING_STAKE_PROVIDED_WHEN_REDUNDANT: &str =
    "StakeProvidedWhenRedundant ..."; // <== SHOULD REALLY BE TWO SEPARATE, ONE FOR EACH STAKING PURPOSE
pub static MSG_ADD_WORKER_OPENING_STAKE_MISSING_WHEN_REQUIRED: &str =
    "StakeMissingWhenRequired ..."; // <== SHOULD REALLY BE TWO SEPARATE, ONE FOR EACH STAKING PURPOSE
pub static MSG_ADD_WORKER_OPENING_STAKE_AMOUNT_TOO_LOW: &str = "StakeAmountTooLow ..."; // <== SHOULD REALLY BE TWO SEPARATE, ONE FOR EACH STAKING PURPOSE
pub static MSG_ADD_WORKER_OPENING_OPENING_NOT_IN_ACCEPTING_APPLICATION_STAGE: &str =
    "OpeningNotInAcceptingApplicationsStage";
pub static MSG_ADD_WORKER_OPENING_NEW_APPLICATION_WAS_CROWDED_OUT: &str =
    "NewApplicationWasCrowdedOut";
pub static MSG_ADD_WORKER_OPENING_ZERO_MAX_APPLICANT_COUNT: &str =
    "Application rationing has zero max active applicants";
pub static MSG_WORKER_DOES_NOT_EXIST: &str = "Worker does not exist";
pub static MSG_WORKER_IS_NOT_ACTIVE: &str = "Worker is not active";
pub static MSG_SIGNER_IS_NOT_WORKER_ROLE_ACCOUNT: &str = "Signer is not worker role account";
pub static MSG_WORKER_HAS_NO_REWARD: &str = "Worker has no recurring reward";
pub static MSG_RECURRING_REWARDS_NEXT_PAYMENT_NOT_IN_FUTURE: &str =
    "Next payment is not in the future";
pub static MSG_RECURRING_REWARDS_RECIPIENT_NOT_FOUND: &str = "Recipient not found";
pub static MSG_RECURRING_REWARDS_REWARD_SOURCE_NOT_FOUND: &str =
    "Recipient reward source not found";
pub static MSG_RECURRING_REWARDS_REWARD_RELATIONSHIP_NOT_FOUND: &str =
    "Reward relationship not found";

/// Error wrapper for external module error conversions
pub struct WrappedError<E> {
    // can this be made generic, or does that undermine the whole orhpan rule spirit?
    pub error: E,
}

#[macro_export]
macro_rules! ensure_on_wrapped_error {
    ($call:expr) => {{
        { $call }.map_err(|err| crate::WrappedError { error: err })
    }};
}

// Add macro here to make this
//derive_from_impl(hiring::BeginAcceptingApplicationsError)
//derive_from_impl(hiring::BeginAcceptingApplicationsError)

impl rstd::convert::From<WrappedError<hiring::BeginAcceptingApplicationsError>> for &str {
    fn from(wrapper: WrappedError<hiring::BeginAcceptingApplicationsError>) -> Self {
        match wrapper.error {
            hiring::BeginAcceptingApplicationsError::OpeningDoesNotExist => {
                MSG_ACCEPT_WORKER_APPLICATIONS_OPENING_DOES_NOT_EXIST
            }
            hiring::BeginAcceptingApplicationsError::OpeningIsNotInWaitingToBeginStage => {
                MSG_ACCEPT_WORKER_APPLICATIONS_OPENING_IS_NOT_WAITING_TO_BEGIN
            }
        }
    }
}

impl rstd::convert::From<WrappedError<hiring::AddOpeningError>> for &str {
    fn from(wrapper: WrappedError<hiring::AddOpeningError>) -> Self {
        match wrapper.error {
            hiring::AddOpeningError::OpeningMustActivateInTheFuture => {
                MSG_ADD_WORKER_OPENING_ACTIVATES_IN_THE_PAST
            }
            hiring::AddOpeningError::StakeAmountLessThanMinimumCurrencyBalance(purpose) => {
                match purpose {
                    hiring::StakePurpose::Role => {
                        MSG_ADD_WORKER_OPENING_ROLE_STAKE_LESS_THAN_MINIMUM
                    }
                    hiring::StakePurpose::Application => {
                        MSG_ADD_WORKER_OPENING_APPLIICATION_STAKE_LESS_THAN_MINIMUM
                    }
                }
            }
            hiring::AddOpeningError::ApplicationRationingZeroMaxApplicants => {
                MSG_ADD_WORKER_OPENING_ZERO_MAX_APPLICANT_COUNT
            }
        }
    }
}

impl rstd::convert::From<WrappedError<hiring::BeginReviewError>> for &str {
    fn from(wrapper: WrappedError<hiring::BeginReviewError>) -> Self {
        match wrapper.error {
            hiring::BeginReviewError::OpeningDoesNotExist => {
                MSG_BEGIN_WORKER_APPLICANT_REVIEW_OPENING_DOES_NOT_EXIST
            }
            hiring::BeginReviewError::OpeningNotInAcceptingApplicationsStage => {
                MSG_BEGIN_WORKER_APPLICANT_REVIEW_OPENING_OPENING_IS_NOT_WAITING_TO_BEGIN
            }
        }
    }
}

impl<T: hiring::Trait> rstd::convert::From<WrappedError<hiring::FillOpeningError<T>>> for &str {
    fn from(wrapper: WrappedError<hiring::FillOpeningError<T>>) -> Self {
        match wrapper.error {
			hiring::FillOpeningError::<T>::OpeningDoesNotExist => MSG_FULL_WORKER_OPENING_OPENING_DOES_NOT_EXIST,
			hiring::FillOpeningError::<T>::OpeningNotInReviewPeriodStage => MSG_FULL_WORKER_OPENING_OPENING_NOT_IN_REVIEW_PERIOD_STAGE,
			hiring::FillOpeningError::<T>::UnstakingPeriodTooShort(
				stake_purpose,
				outcome_in_filled_opening,
			) => match stake_purpose {
				hiring::StakePurpose::Application => match outcome_in_filled_opening {
					hiring::ApplicationOutcomeInFilledOpening::Success => MSG_FULL_WORKER_OPENING_UNSUCCESSFUL_APPLICATION_STAKE_UNSTAKING_PERIOD_TOO_SHORT,
					hiring::ApplicationOutcomeInFilledOpening::Failure => MSG_FULL_WORKER_OPENING_SUCCESSFUL_APPLICATION_STAKE_UNSTAKING_PERIOD_TOO_SHORT
				},
				hiring::StakePurpose::Role => match outcome_in_filled_opening {
					hiring::ApplicationOutcomeInFilledOpening::Success => MSG_FULL_WORKER_OPENING_SUCCESSFUL_ROLE_STAKE_UNSTAKING_PERIOD_TOO_SHORT,
					hiring::ApplicationOutcomeInFilledOpening::Failure => MSG_FULL_WORKER_OPENING_UNSUCCESSFUL_ROLE_STAKE_UNSTAKING_PERIOD_TOO_SHORT
				},
			},
			hiring::FillOpeningError::<T>::RedundantUnstakingPeriodProvided(
				stake_purpose,
				outcome_in_filled_opening,
			) => match stake_purpose {
				hiring::StakePurpose::Application => match outcome_in_filled_opening {
					hiring::ApplicationOutcomeInFilledOpening::Success => MSG_FULL_WORKER_OPENING_SUCCESSFUL_APPLICATION_STAKE_UNSTAKING_PERIOD_REDUNDANT,
					hiring::ApplicationOutcomeInFilledOpening::Failure => MSG_FULL_WORKER_OPENING_UNSUCCESSFUL_APPLICATION_STAKE_UNSTAKING_PERIOD_REDUNDANT
				},
				hiring::StakePurpose::Role => match outcome_in_filled_opening {
					hiring::ApplicationOutcomeInFilledOpening::Success => MSG_FULL_WORKER_OPENING_SUCCESSFUL_ROLE_STAKE_UNSTAKING_PERIOD_REDUNDANT,
					hiring::ApplicationOutcomeInFilledOpening::Failure => MSG_FULL_WORKER_OPENING_UNSUCCESSFUL_ROLE_STAKE_UNSTAKING_PERIOD_REDUNDANT
				},
			},
			hiring::FillOpeningError::<T>::ApplicationDoesNotExist(_application_id) => MSG_FULL_WORKER_OPENING_APPLICATION_DOES_NOT_EXIST,
			hiring::FillOpeningError::<T>::ApplicationNotInActiveStage(_application_id) => MSG_FULL_WORKER_OPENING_APPLICATION_NOT_ACTIVE,
			hiring::FillOpeningError::<T>::ApplicationForWrongOpening(_application_id) => MSG_FILL_WORKER_OPENING_APPLICATION_FOR_WRONG_OPENING,
		}
    }
}

impl rstd::convert::From<WrappedError<hiring::DeactivateApplicationError>> for &str {
    fn from(wrapper: WrappedError<hiring::DeactivateApplicationError>) -> Self {
        match wrapper.error {
            hiring::DeactivateApplicationError::ApplicationDoesNotExist => {
                MSG_WITHDRAW_WORKER_APPLICATION_APPLICATION_DOES_NOT_EXIST
            }
            hiring::DeactivateApplicationError::ApplicationNotActive => {
                MSG_WITHDRAW_WORKER_APPLICATION_APPLICATION_NOT_ACTIVE
            }
            hiring::DeactivateApplicationError::OpeningNotAcceptingApplications => {
                MSG_WITHDRAW_WORKER_APPLICATION_OPENING_NOT_ACCEPTING_APPLICATIONS
            }
            hiring::DeactivateApplicationError::UnstakingPeriodTooShort(_stake_purpose) => {
                MSG_WITHDRAW_WORKER_APPLICATION_UNSTAKING_PERIOD_TOO_SHORT
            }
            hiring::DeactivateApplicationError::RedundantUnstakingPeriodProvided(
                _stake_purpose,
            ) => MSG_WITHDRAW_WORKER_APPLICATION_REDUNDANT_UNSTAKING_PERIOD,
        }
    }
}

impl rstd::convert::From<WrappedError<members::ControllerAccountForMemberCheckFailed>> for &str {
    fn from(wrapper: WrappedError<members::ControllerAccountForMemberCheckFailed>) -> Self {
        match wrapper.error {
            members::ControllerAccountForMemberCheckFailed::NotMember => {
                MSG_CREATE_CHANNEL_IS_NOT_MEMBER
            }
            members::ControllerAccountForMemberCheckFailed::NotControllerAccount => {
                MSG_CREATE_CHANNEL_NOT_CONTROLLER_ACCOUNT
            }
        }
    }
}

impl rstd::convert::From<WrappedError<hiring::AddApplicationError>> for &str {
    fn from(wrapper: WrappedError<hiring::AddApplicationError>) -> Self {
        match wrapper.error {
            hiring::AddApplicationError::OpeningDoesNotExist => {
                MSG_ADD_WORKER_OPENING_OPENING_DOES_NOT_EXIST
            }
            hiring::AddApplicationError::StakeProvidedWhenRedundant(_stake_purpose) => {
                MSG_ADD_WORKER_OPENING_STAKE_PROVIDED_WHEN_REDUNDANT
            }
            hiring::AddApplicationError::StakeMissingWhenRequired(_stake_purpose) => {
                MSG_ADD_WORKER_OPENING_STAKE_MISSING_WHEN_REQUIRED
            }
            hiring::AddApplicationError::StakeAmountTooLow(_stake_purpose) => {
                MSG_ADD_WORKER_OPENING_STAKE_AMOUNT_TOO_LOW
            }
            hiring::AddApplicationError::OpeningNotInAcceptingApplicationsStage => {
                MSG_ADD_WORKER_OPENING_OPENING_NOT_IN_ACCEPTING_APPLICATION_STAGE
            }
            hiring::AddApplicationError::NewApplicationWasCrowdedOut => {
                MSG_ADD_WORKER_OPENING_NEW_APPLICATION_WAS_CROWDED_OUT
            }
        }
    }
}

impl rstd::convert::From<WrappedError<members::MemberControllerAccountDidNotSign>> for &str {
    fn from(wrapper: WrappedError<members::MemberControllerAccountDidNotSign>) -> Self {
        match wrapper.error {
            members::MemberControllerAccountDidNotSign::UnsignedOrigin => {
                bureaucracy_errors::MSG_MEMBERSHIP_UNSIGNED_ORIGIN
            }
            members::MemberControllerAccountDidNotSign::MemberIdInvalid => {
                bureaucracy_errors::MSG_MEMBERSHIP_INVALID_MEMBER_ID
            }
            members::MemberControllerAccountDidNotSign::SignerControllerAccountMismatch => {
                bureaucracy_errors::MSG_APPLY_ON_WORKER_OPENING_SIGNER_NOT_CONTROLLER_ACCOUNT
            }
        }
    }
}

impl rstd::convert::From<WrappedError<recurringrewards::RewardsError>> for &str {
    fn from(wrapper: WrappedError<recurringrewards::RewardsError>) -> Self {
        match wrapper.error {
            recurringrewards::RewardsError::NextPaymentNotInFuture => {
                MSG_RECURRING_REWARDS_NEXT_PAYMENT_NOT_IN_FUTURE
            }
            recurringrewards::RewardsError::RecipientNotFound => {
                MSG_RECURRING_REWARDS_RECIPIENT_NOT_FOUND
            }
            recurringrewards::RewardsError::RewardSourceNotFound => {
                MSG_RECURRING_REWARDS_REWARD_SOURCE_NOT_FOUND
            }
            recurringrewards::RewardsError::RewardRelationshipNotFound => {
                MSG_RECURRING_REWARDS_REWARD_RELATIONSHIP_NOT_FOUND
            }
        }
    }
}
