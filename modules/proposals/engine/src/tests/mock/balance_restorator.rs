#![cfg(test)]

pub use runtime_primitives::traits::Zero;
use srml_support::traits::{Currency, Imbalance};

use super::*;

pub struct BalanceRestoratorStakingEventsHandler;
impl stake::StakingEventsHandler<Test> for BalanceRestoratorStakingEventsHandler {
    fn unstaked(
        _id: &u64,
        _unstaked_amount: stake::BalanceOf<Test>,
        imbalance: stake::NegativeImbalance<Test>,
    ) -> stake::NegativeImbalance<Test> {
        let default_account_id = 1;

        <Test as stake::Trait>::Currency::resolve_creating(&default_account_id, imbalance);

        stake::NegativeImbalance::<Test>::zero()
    }

    fn slashed(
        _id: &u64,
        _slash_id: &u64,
        _slashed_amount: stake::BalanceOf<Test>,
        _remaining_stake: stake::BalanceOf<Test>,
        _imbalance: stake::NegativeImbalance<Test>,
    ) -> stake::NegativeImbalance<Test> {
        unreachable!();
    }
}
