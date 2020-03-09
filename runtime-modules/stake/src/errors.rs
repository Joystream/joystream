#[derive(Debug, Eq, PartialEq)]
pub enum StakeActionError<ErrorType> {
    StakeNotFound,
    Error(ErrorType),
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
}

#[derive(Debug, Eq, PartialEq)]
pub enum StakingFromAccountError {
    StakingError(StakingError),
    InsufficientBalanceInSourceAccount,
}

#[derive(Debug, Eq, PartialEq)]
pub enum IncreasingStakeError {
    NotStaked,
    CannotChangeStakeByZero,
    CannotIncreaseStakeWhileUnstaking,
}

#[derive(Debug, Eq, PartialEq)]
pub enum IncreasingStakeFromAccountError {
    IncreasingStakeError(IncreasingStakeError),
    InsufficientBalanceInSourceAccount,
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
    SlashAmountShouldBeGreaterThanZero,
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
pub enum UnstakingError {
    NotStaked,
    AlreadyUnstaking,
    CannotUnstakeWhileSlashesOngoing,
}

#[derive(Debug, Eq, PartialEq)]
pub enum InitiateUnstakingError {
    UnstakingError(UnstakingError),
    UnstakingPeriodShouldBeGreaterThanZero,
}

#[derive(Debug, Eq, PartialEq)]
pub enum PauseUnstakingError {
    NotStaked,
    NotUnstaking,
    AlreadyPaused,
}

#[derive(Debug, Eq, PartialEq)]
pub enum ResumeUnstakingError {
    NotStaked,
    NotUnstaking,
    NotPaused,
}

impl<ErrorType> From<ErrorType> for StakeActionError<ErrorType> {
    fn from(e: ErrorType) -> StakeActionError<ErrorType> {
        StakeActionError::Error(e)
    }
}

impl From<StakingError> for StakeActionError<StakingFromAccountError> {
    fn from(e: StakingError) -> StakeActionError<StakingFromAccountError> {
        StakeActionError::Error(StakingFromAccountError::StakingError(e))
    }
}

impl From<TransferFromAccountError> for StakeActionError<StakingFromAccountError> {
    fn from(e: TransferFromAccountError) -> StakeActionError<StakingFromAccountError> {
        match e {
            TransferFromAccountError::InsufficientBalance => {
                StakeActionError::Error(StakingFromAccountError::InsufficientBalanceInSourceAccount)
            }
        }
    }
}

impl From<IncreasingStakeError> for StakeActionError<IncreasingStakeFromAccountError> {
    fn from(e: IncreasingStakeError) -> StakeActionError<IncreasingStakeFromAccountError> {
        StakeActionError::Error(IncreasingStakeFromAccountError::IncreasingStakeError(e))
    }
}

impl From<TransferFromAccountError> for StakeActionError<IncreasingStakeFromAccountError> {
    fn from(e: TransferFromAccountError) -> StakeActionError<IncreasingStakeFromAccountError> {
        match e {
            TransferFromAccountError::InsufficientBalance => StakeActionError::Error(
                IncreasingStakeFromAccountError::InsufficientBalanceInSourceAccount,
            ),
        }
    }
}

impl From<StakeActionError<IncreasingStakeError>>
    for StakeActionError<IncreasingStakeFromAccountError>
{
    fn from(
        e: StakeActionError<IncreasingStakeError>,
    ) -> StakeActionError<IncreasingStakeFromAccountError> {
        match e {
            StakeActionError::StakeNotFound => StakeActionError::StakeNotFound,
            StakeActionError::Error(increasing_stake_error) => StakeActionError::Error(
                IncreasingStakeFromAccountError::IncreasingStakeError(increasing_stake_error),
            ),
        }
    }
}

impl From<UnstakingError> for StakeActionError<InitiateUnstakingError> {
    fn from(e: UnstakingError) -> StakeActionError<InitiateUnstakingError> {
        StakeActionError::Error(InitiateUnstakingError::UnstakingError(e))
    }
}
