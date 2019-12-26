#![cfg(test)]

#[test]
fn add_opening_error_wrapper_succeeded() {
    let mut message: &str;

    message = super::lib::WrappedError {
        error: hiring::AddOpeningError::OpeningMustActivateInTheFuture,
    }
    .into();
    assert_eq!(message, "Opening must activate in the future");

    message = super::lib::WrappedError {
        error: hiring::AddOpeningError::StakeAmountLessThanMinimumCurrencyBalance(
            hiring::StakePurpose::Role,
        ),
    }
    .into();
    assert_eq!(
        message,
        "Role stake amount less than minimum currency balance"
    );

    message = super::lib::WrappedError {
        error: hiring::AddOpeningError::StakeAmountLessThanMinimumCurrencyBalance(
            hiring::StakePurpose::Application,
        ),
    }
    .into();
    assert_eq!(
        message,
        "Application stake amount less than minimum currency balance"
    );

    message = super::lib::WrappedError {
        error: hiring::AddOpeningError::ApplicationRationingZeroMaxApplicants,
    }
    .into();
    assert_eq!(
        message,
        "Application rationing policy: maximum active applicant number must be greater than zero"
    );
}
