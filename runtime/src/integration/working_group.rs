use frame_support::StorageMap;
use sp_std::marker::PhantomData;

use crate::StorageWorkingGroupInstance;
use stake::{BalanceOf, NegativeImbalance};

pub struct StakingEventsHandler<T> {
    pub marker: PhantomData<T>,
}

impl<T: stake::Trait + working_group::Trait<StorageWorkingGroupInstance>>
    stake::StakingEventsHandler<T> for StakingEventsHandler<T>
{
    /// Unstake remaining sum back to the source_account_id
    fn unstaked(
        stake_id: &<T as stake::Trait>::StakeId,
        _unstaked_amount: BalanceOf<T>,
        remaining_imbalance: NegativeImbalance<T>,
    ) -> NegativeImbalance<T> {
        // Stake not related to a staked role managed by the hiring module.
        if !hiring::ApplicationIdByStakingId::<T>::contains_key(*stake_id) {
            return remaining_imbalance;
        }

        let hiring_application_id = hiring::ApplicationIdByStakingId::<T>::get(*stake_id);

        if working_group::MemberIdByHiringApplicationId::<T, StorageWorkingGroupInstance>::contains_key(
            hiring_application_id,
        ) {
            return <working_group::Module<T, StorageWorkingGroupInstance>>::refund_working_group_stake(
				*stake_id,
				remaining_imbalance,
			);
        }

        remaining_imbalance
    }

    /// Empty handler for the slashing.
    fn slashed(
        _: &<T as stake::Trait>::StakeId,
        _: Option<<T as stake::Trait>::SlashId>,
        _: BalanceOf<T>,
        _: BalanceOf<T>,
        remaining_imbalance: NegativeImbalance<T>,
    ) -> NegativeImbalance<T> {
        remaining_imbalance
    }
}
