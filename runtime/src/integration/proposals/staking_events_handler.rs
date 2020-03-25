use rstd::marker::PhantomData;
use srml_support::traits::{Currency, Imbalance};
use srml_support::StorageMap;

// Balance alias
type BalanceOf<T> =
<<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

// Balance alias for staking
type NegativeImbalance<T> =
<<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::NegativeImbalance;

/// Proposal implementation of the staking event handler from the stake module.
/// 'marker' responsible for the 'Trait' binding.
pub struct StakingEventsHandler<T> {
	pub marker: PhantomData<T>,
}

impl<T: stake::Trait + proposals_engine::Trait> stake::StakingEventsHandler<T> for StakingEventsHandler<T> {
	/// Unstake remaining sum back to the source_account_id
	fn unstaked(
		id: &<T as stake::Trait>::StakeId,
		_unstaked_amount: BalanceOf<T>,
		remaining_imbalance: NegativeImbalance<T>,
	) -> NegativeImbalance<T> {
		if <proposals_engine::StakesProposals<T>>::exists(id) {
			<proposals_engine::Module<T>>::refund_proposal_stake(*id, remaining_imbalance);

			return <NegativeImbalance<T>>::zero(); // imbalance was consumed
		}

		remaining_imbalance
	}

	/// Empty handler for slashing
	fn slashed(
		_: &<T as stake::Trait>::StakeId,
		_: &<T as stake::Trait>::SlashId,
		_: BalanceOf<T>,
		_: BalanceOf<T>,
		remaining_imbalance: NegativeImbalance<T>,
	) -> NegativeImbalance<T> {
		remaining_imbalance
	}
}