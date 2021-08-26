use frame_support::StorageMap;
use sp_std::marker::PhantomData;

use crate::{
    ContentDirectoryWorkingGroupInstance, GatewayWorkingGroupInstance,
    OperationsWorkingGroupInstance1, OperationsWorkingGroupInstance2,
    OperationsWorkingGroupInstance3, StorageWorkingGroupInstance,
};
use stake::{BalanceOf, NegativeImbalance};

// Will be removed in the next releases.
#[allow(clippy::upper_case_acronyms)]
pub struct ContentDirectoryWgStakingEventsHandler<T> {
    pub marker: PhantomData<T>,
}

impl<T: stake::Trait + working_group::Trait<ContentDirectoryWorkingGroupInstance>>
    stake::StakingEventsHandler<T> for ContentDirectoryWgStakingEventsHandler<T>
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

        if working_group::MemberIdByHiringApplicationId::<T, ContentDirectoryWorkingGroupInstance>::contains_key(
            hiring_application_id,
        ) {
            return <working_group::Module<T, ContentDirectoryWorkingGroupInstance>>::refund_working_group_stake(
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

pub struct StorageWgStakingEventsHandler<T> {
    pub marker: PhantomData<T>,
}

impl<T: stake::Trait + working_group::Trait<StorageWorkingGroupInstance>>
    stake::StakingEventsHandler<T> for StorageWgStakingEventsHandler<T>
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

pub struct OperationsWgStakingEventsHandler1<T> {
    pub marker: PhantomData<T>,
}

impl<T: stake::Trait + working_group::Trait<OperationsWorkingGroupInstance1>>
    stake::StakingEventsHandler<T> for OperationsWgStakingEventsHandler1<T>
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

        if working_group::MemberIdByHiringApplicationId::<T, OperationsWorkingGroupInstance1>::contains_key(
            hiring_application_id,
        ) {
            return <working_group::Module<T, OperationsWorkingGroupInstance1>>::refund_working_group_stake(
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

pub struct GatewayWgStakingEventsHandler<T> {
    pub marker: PhantomData<T>,
}

impl<T: stake::Trait + working_group::Trait<GatewayWorkingGroupInstance>>
    stake::StakingEventsHandler<T> for GatewayWgStakingEventsHandler<T>
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

        if working_group::MemberIdByHiringApplicationId::<T, GatewayWorkingGroupInstance>::contains_key(
            hiring_application_id,
        ) {
            return <working_group::Module<T, GatewayWorkingGroupInstance>>::refund_working_group_stake(
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

pub struct OperationsWgStakingEventsHandler2<T> {
    pub marker: PhantomData<T>,
}

impl<T: stake::Trait + working_group::Trait<OperationsWorkingGroupInstance2>>
    stake::StakingEventsHandler<T> for OperationsWgStakingEventsHandler2<T>
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

        if working_group::MemberIdByHiringApplicationId::<T, OperationsWorkingGroupInstance2>::contains_key(
            hiring_application_id,
        ) {
            return <working_group::Module<T, OperationsWorkingGroupInstance2>>::refund_working_group_stake(
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

pub struct OperationsWgStakingEventsHandler3<T> {
    pub marker: PhantomData<T>,
}

impl<T: stake::Trait + working_group::Trait<OperationsWorkingGroupInstance3>>
    stake::StakingEventsHandler<T> for OperationsWgStakingEventsHandler3<T>
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

        if working_group::MemberIdByHiringApplicationId::<T, OperationsWorkingGroupInstance3>::contains_key(
            hiring_application_id,
        ) {
            return <working_group::Module<T, OperationsWorkingGroupInstance3>>::refund_working_group_stake(
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
