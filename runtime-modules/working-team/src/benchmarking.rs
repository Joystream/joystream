#![cfg(feature = "runtime-benchmarks")]
use super::*;
use frame_benchmarking::{account, benchmarks_instance, Zero};
use sp_runtime::traits::Bounded;
use sp_std::prelude::*;
use system as frame_system;
use system::RawOrigin;

use crate::types::StakeParameters;
use crate::Module as WorkingTeam;

const SEED: u32 = 0;

fn insert_a_worker<T: Trait<I>, I: Instance>(
    can_leave_immediatly: bool,
    is_lead: bool,
    lead_id: Option<T::AccountId>,
) -> (T::AccountId, TeamWorkerId<T>) {
    /*
     * TODO: Refator this!!!!! :(
     */
    let (
        caller_id,
        opening_type,
        add_opening_origin,
        member_id,
        handle,
        opening_id,
        application_id,
        worker_id,
    ) = if is_lead {
        (
            account::<T::AccountId>("lead", 0, SEED),
            JobOpeningType::Leader,
            RawOrigin::Root,
            Zero::zero(),
            vec![0u8, 0u8, 0u8, 0u8, 0u8],
            Zero::zero(),
            Zero::zero(),
            Zero::zero(),
        )
    } else {
        (
            account::<T::AccountId>("member", 1, SEED),
            JobOpeningType::Regular,
            RawOrigin::Signed(lead_id.unwrap()),
            <T::MemberId as One>::one(),
            vec![1u8, 1u8, 1u8, 1u8, 1u8],
            <T::OpeningId as One>::one(),
            <T::ApplicationId as One>::one(),
            <TeamWorkerId<T> as One>::one(),
        )
    };

    /*
     * TODO: Does this create a dependency to the membership pallet for benchmarking that we just don't want?
     */

    let _ = <T as common::currency::GovernanceCurrency>::Currency::make_free_balance_be(
        &caller_id,
        BalanceOfCurrency::<T>::max_value(),
    );

    // If job usntaking period is zero the worker can always
    // leave immediatly. However for the ase the worker can't
    // leave immmediatly we need a non-zero stake.
    // This is handled by `T::StakingHandler::current_stake
    T::StakingHandler::increase_stake(&caller_id, BalanceOfCurrency::<T>::max_value()).unwrap();
    T::StakingHandler::lock(&caller_id, BalanceOfCurrency::<T>::max_value());

    let (staking_policy, stake_parameters) = if can_leave_immediatly {
        (None, None)
    } else {
        (
            Some(StakePolicy {
                stake_amount: BalanceOfCurrency::<T>::max_value(),
                leaving_unstaking_period: T::BlockNumber::max_value(),
            }),
            Some(StakeParameters {
                stake: BalanceOfCurrency::<T>::max_value(),
                staking_account_id: caller_id.clone(),
            }),
        )
    };

    membership::Module::<T>::buy_membership(
        RawOrigin::Signed(caller_id.clone()).into(),
        Zero::zero(),
        Some(handle),
        None,
        None,
    )
    .unwrap();

    WorkingTeam::<T, I>::add_opening(
        add_opening_origin.clone().into(),
        vec![],
        opening_type,
        staking_policy,
        Some(RewardPolicy {
            reward_per_block: BalanceOfCurrency::<T>::max_value(),
        }),
    )
    .unwrap();

    WorkingTeam::<T, I>::apply_on_opening(
        RawOrigin::Signed(caller_id.clone()).into(),
        ApplyOnOpeningParameters::<T, I> {
            member_id,
            opening_id,
            role_account_id: caller_id.clone(),
            reward_account_id: caller_id.clone(),
            description: vec![],
            stake_parameters,
        },
    )
    .unwrap();

    let mut successful_application_ids = BTreeSet::<T::ApplicationId>::new();
    successful_application_ids.insert(application_id);
    WorkingTeam::<T, I>::fill_opening(
        add_opening_origin.clone().into(),
        opening_id,
        successful_application_ids,
    )
    .unwrap();

    (caller_id, worker_id)
}

fn create_lead<T: Trait<I>, I: Instance>() -> (T::AccountId, TeamWorkerId<T>) {
    let (caller_id, lead_worker_id) = insert_a_worker::<T, I>(true, true, None);
    /*
    WorkingTeam::<T, I>::set_lead(lead_worker_id);
    */
    (caller_id, lead_worker_id)
}

benchmarks_instance! {
    _ { }

    decrease_stake {
      let i in 0 .. 10;

      let (lead_id, _) = create_lead::<T, I>();
      let (_, worker_id) = insert_a_worker::<T, I>(false, false, Some(lead_id.clone()));

      let new_stake = BalanceOfCurrency::<T>::max_value() - BalanceOfCurrency::<T>::one();
    }: _ (RawOrigin::Signed(lead_id), worker_id, new_stake)
    verify {}

    spend_from_budget {
      let i in 0 .. 10;

      let (lead_id, _) = create_lead::<T, I>();
      let current_budget = BalanceOfCurrency::<T>::max_value();
      WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), current_budget).unwrap();

    }: _ (RawOrigin::Signed(lead_id.clone()), lead_id.clone(), current_budget, None)
    verify {}

    update_reward_amount {
      let i in 0 .. 10;

      let (lead_id, _) = create_lead::<T, I>();
      let (_, worker_id) = insert_a_worker::<T, I>(true, false, Some(lead_id.clone()));
      let new_reward = Some(BalanceOfCurrency::<T>::max_value());
    }: _ (RawOrigin::Signed(lead_id.clone()), worker_id, new_reward)
    verify {}

    set_status_text {
      let i in 0 .. 50000; // TODO: We should have a bounded value for description

      let (lead_id, _) = create_lead::<T,I>();
      let status_text = Some(vec![0u8][..].repeat(i as usize)); // TODO:don't use as

    }: _ (RawOrigin::Signed(lead_id), status_text)
    verify {}

    update_reward_account {
      let i in 0 .. 10;

      let (caller_id, worker_id) = create_lead::<T, I>();
      let new_id = account::<T::AccountId>("new_id", 1, 0);

    }: _ (RawOrigin::Signed(caller_id), worker_id, new_id)
    verify {}

    set_budget {
      let i in 0 .. 10;

      let new_budget = BalanceOfCurrency::<T>::max_value();

    }: _(RawOrigin::Root, new_budget)
    verify { }

    add_opening{
      let i in 0 .. 50000; // TODO: We should have a bounded value for description

      let caller_id = account::<T::AccountId>("caller", 0, 0);

      let (lead_id, _) = create_lead::<T, I>();

      let stake_policy = StakePolicy {
        stake_amount: BalanceOfCurrency::<T>::max_value(),
        leaving_unstaking_period: T::BlockNumber::max_value(),
      };

      let reward_policy = RewardPolicy {
        reward_per_block: BalanceOfCurrency::<T>::max_value(),
      };

      let description = vec![0u8][..].repeat(i as usize); // TODO:don't use as

    }: _(RawOrigin::Signed(lead_id), description, JobOpeningType::Regular, Some(stake_policy), Some(reward_policy))
    verify { }

    // This is always worse than leave_role_immediatly
    leave_role_immediatly {
        let i in 0 .. 10; // TODO: test not running if we don't set a range of values
        // Worst case scenario there is a lead(this requires **always** more steps)
        // could separate into new branch to tighten weight
        let (caller_id, lead_worker_id) = create_lead::<T, I>();

        WorkingTeam::<T, I>::set_budget(RawOrigin::Root.into(), BalanceOfCurrency::<T>::max_value()).unwrap();


    }: leave_role(RawOrigin::Signed(caller_id), lead_worker_id)
    verify { }


    // Generally speaking this seems to be always the best case scenario
    // but since it's so obviously a different branch I think it's a good idea
    // to leave this branch and use tha max between these 2
    leave_role_later {
        let i in 0 .. 10;

        let (caller_id, caller_worker_id) = create_lead::<T, I>();
    }: leave_role(RawOrigin::Signed(caller_id), caller_worker_id)
    verify { }
}

/*
TODO: we need to implement new_test_ext that creates a `sp_io::TestExternalities`
#[cfg(test)]
mod tests {
    use super::*;
    use crate::tests::{new_test_ext, Test};
    use frame_support::assert_ok;

    #[test]
    fn test_benchmarks() {
        new_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_leave_role::<Test>());
        });
    }
}
*/
