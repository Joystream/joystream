#[derive(Debug, Eq, PartialEq)]
pub enum StakeActionError<ActionError> {
    StakeNotFound,
    Error(ActionError),
}

impl<ErrorType> From<ErrorType> for StakeActionError<ErrorType> {
    fn from(e: ErrorType) -> StakeActionError<ErrorType> {
        StakeActionError::Error(e)
    }
}

#[derive(Debug, Eq, PartialEq)]
pub enum TransferFromAccountError {
    InsufficientBalance,
}

#[derive(Debug, Eq, PartialEq)]
pub enum StakingError {
    CannotStakeZero,
    CannotStakeLessThanMinimumBalance,
    AlreadyStaked,
    InsufficientBalanceInSourceAccount,
}

impl From<TransferFromAccountError> for StakeActionError<StakingError> {
    fn from(e: TransferFromAccountError) -> StakeActionError<StakingError> {
        match e {
            TransferFromAccountError::InsufficientBalance => {
                StakeActionError::Error(StakingError::InsufficientBalanceInSourceAccount)
            }
        }
    }
}

#[derive(Debug, Eq, PartialEq)]
pub enum IncreasingStakeError {
    NotStaked,
    CannotChangeStakeByZero,
    CannotIncreaseStakeWhileUnstaking,
    InsufficientBalanceInSourceAccount,
}

impl From<TransferFromAccountError> for StakeActionError<IncreasingStakeError> {
    fn from(e: TransferFromAccountError) -> StakeActionError<IncreasingStakeError> {
        match e {
            TransferFromAccountError::InsufficientBalance => {
                StakeActionError::Error(IncreasingStakeError::InsufficientBalanceInSourceAccount)
            }
        }
    }
}

#[derive(Debug, Eq, PartialEq)]
pub enum DecreasingStakeError {
    NotStaked,
    CannotChangeStakeByZero,
    CannotDecreaseStakeWhileOngoingSlahes,
    InsufficientStake,
    CannotDecreaseStakeWhileUnstaking,
}

#[derive(Debug, Eq, PartialEq)]
pub enum InitiateSlashingError {
    NotStaked,
    SlashPeriodShouldBeGreaterThanZero,
}

#[derive(Debug, Eq, PartialEq)]
pub enum PauseSlashingError {
    SlashNotFound,
    NotStaked,
    AlreadyPaused,
}

#[derive(Debug, Eq, PartialEq)]
pub enum ResumeSlashingError {
    SlashNotFound,
    NotStaked,
    NotPaused,
}

#[derive(Debug, Eq, PartialEq)]
pub enum CancelSlashingError {
    SlashNotFound,
    NotStaked,
}

#[derive(Debug, Eq, PartialEq)]
pub enum InitiateUnstakingError {
    NotStaked,
    AlreadyUnstaking,
    UnstakingPeriodShouldBeGreaterThanZero,
    CannotUnstakeWhileSlashesOngoing,
}

#[derive(Debug, Eq, PartialEq)]
pub enum PauseUnstakingError {
    NotStaked,
    NotUnstaking,
    AlreadyPaused,
    SlashPeriodShouldBeGreaterThanZero,
}

#[derive(Debug, Eq, PartialEq)]
pub enum ResumeUnstakingError {
    NotStaked,
    NotUnstaking,
    NotPaused,
    SlashPeriodShouldBeGreaterThanZero,
}
