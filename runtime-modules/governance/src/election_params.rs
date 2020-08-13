#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use codec::{Decode, Encode};
use frame_support::ensure;
use sp_arithmetic::traits::Zero;

use crate::DispatchResult;

pub static MSG_PERIOD_CANNOT_BE_ZERO: &str = "PeriodCannotBeZero";
pub static MSG_COUNCIL_SIZE_CANNOT_BE_ZERO: &str = "CouncilSizeCannotBeZero";
pub static MSG_CANDIDACY_LIMIT_WAS_LOWER_THAN_COUNCIL_SIZE: &str =
    "CandidacyWasLessThanCouncilSize";

/// Combined Election parameters, as argument for set_election_parameters
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Clone, Copy, Encode, Decode, Default, PartialEq, Debug)]
pub struct ElectionParameters<Balance, BlockNumber> {
    pub announcing_period: BlockNumber,
    pub voting_period: BlockNumber,
    pub revealing_period: BlockNumber,
    pub council_size: u32,
    pub candidacy_limit: u32,
    pub new_term_duration: BlockNumber,
    pub min_council_stake: Balance,
    pub min_voting_stake: Balance,
}

impl<Balance, BlockNumber: PartialOrd + Zero> ElectionParameters<Balance, BlockNumber> {
    pub fn ensure_valid(&self) -> DispatchResult {
        self.ensure_periods_are_valid()?;
        self.ensure_council_size_and_candidacy_limit_are_valid()?;
        Ok(())
    }

    fn ensure_periods_are_valid(&self) -> DispatchResult {
        ensure!(!self.announcing_period.is_zero(), MSG_PERIOD_CANNOT_BE_ZERO);
        ensure!(!self.voting_period.is_zero(), MSG_PERIOD_CANNOT_BE_ZERO);
        ensure!(!self.revealing_period.is_zero(), MSG_PERIOD_CANNOT_BE_ZERO);
        Ok(())
    }

    fn ensure_council_size_and_candidacy_limit_are_valid(&self) -> DispatchResult {
        ensure!(self.council_size > 0, MSG_COUNCIL_SIZE_CANNOT_BE_ZERO);
        ensure!(
            self.council_size <= self.candidacy_limit,
            MSG_CANDIDACY_LIMIT_WAS_LOWER_THAN_COUNCIL_SIZE
        );
        Ok(())
    }
}
