use frame_support::StorageMap;
use sp_std::marker::PhantomData;

use crate::{
    ContentDirectoryWorkingGroupInstance, GatewayWorkingGroupInstance,
    OperationsWorkingGroupInstanceAlpha, OperationsWorkingGroupInstanceBeta,
    OperationsWorkingGroupInstanceGamma, StorageWorkingGroupInstance,
};
use stake::{BalanceOf, NegativeImbalance};

macro_rules! wg_staking_event_impl {
    ($operation_wg_instance:ident, $operation_wg_staking_event_handler:ty) => {
	impl<T: stake::Trait + working_group::Trait<$operation_wg_instance>>
	    stake::StakingEventsHandler<T> for $operation_wg_staking_event_handler
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

		if working_group::MemberIdByHiringApplicationId::<T, $operation_wg_instance>::contains_key(
		    hiring_application_id,
		) {
		    return <working_group::Module<T, $operation_wg_instance>>::refund_working_group_stake(
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
    }
}

// Will be removed in the next releases.
#[allow(clippy::upper_case_acronyms)]
pub struct ContentDirectoryWgStakingEventsHandler<T> {
    pub marker: PhantomData<T>,
}

pub struct StorageWgStakingEventsHandler<T> {
    pub marker: PhantomData<T>,
}

pub struct OperationsWgStakingEventsHandlerAlpha<T> {
    pub marker: PhantomData<T>,
}

pub struct OperationsWgStakingEventsHandlerBeta<T> {
    pub marker: PhantomData<T>,
}

pub struct OperationsWgStakingEventsHandlerGamma<T> {
    pub marker: PhantomData<T>,
}

pub struct GatewayWgStakingEventsHandler<T> {
    pub marker: PhantomData<T>,
}

wg_staking_event_impl!(
    ContentDirectoryWorkingGroupInstance,
    ContentDirectoryWgStakingEventsHandler<T>
);

wg_staking_event_impl!(
    StorageWorkingGroupInstance,
    StorageWgStakingEventsHandler<T>
);

wg_staking_event_impl!(
    GatewayWorkingGroupInstance,
    GatewayWgStakingEventsHandler<T>
);

wg_staking_event_impl!(
    OperationsWorkingGroupInstanceAlpha,
    OperationsWgStakingEventsHandlerAlpha<T>
);

wg_staking_event_impl!(
    OperationsWorkingGroupInstanceBeta,
    OperationsWgStakingEventsHandlerBeta<T>
);

wg_staking_event_impl!(
    OperationsWorkingGroupInstanceGamma,
    OperationsWgStakingEventsHandlerGamma<T>
);
