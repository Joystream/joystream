#![cfg(feature = "runtime-benchmarks")]
use super::*;
use frame_benchmarking::{account, benchmarks_instance, Zero};
use sp_runtime::traits::Bounded;
use sp_std::prelude::*;
use system as frame_system;
use system::RawOrigin;

use crate::Module as WorkingTeam;

fn create_a_worker<T: Trait<I>, I: Instance>(
    caller_id: &T::AccountId,
    member_id: &T::MemberId,
    can_leave_immediatly: bool,
) -> TeamWorker<T> {
    // If job usntaking period is zero the worker can always
    // leave immediatly. However for the ase the worker can't
    // leave immmediatly we need a non-zero stake.
    // This is handled by `T::StakingHandler::current_stake

    T::StakingHandler::increase_stake(&caller_id, BalanceOfCurrency::<T>::max_value()).unwrap();
    T::StakingHandler::lock(&caller_id, BalanceOfCurrency::<T>::max_value());

    let job_unstaking_period = if !can_leave_immediatly {
        <T as system::Trait>::BlockNumber::max_value()
    } else {
        Zero::zero()
    };

    TeamWorker::<T>::new(
        &member_id,
        &caller_id,
        &caller_id,
        &Some(caller_id.clone()),
        job_unstaking_period,
        Some(BalanceOfCurrency::<T>::max_value()),
        Zero::zero(),
    )
}

fn insert_a_worker<T: Trait<I>, I: Instance>(
    can_leave_immediatly: bool,
) -> (T::AccountId, TeamWorkerId<T>) {
    /*
     * TODO: Be able to have a different name for each account/member
     */
    let caller_id = account::<T::AccountId>("caller", 0, 0);
    let member_id = account::<T::MemberId>("member", 0, 0);

    /*
     * TODO: Ideally it's better to create the workers using opening/apply/fill
     * However, I couldn't find yet how to grab the RawEvent::OpeningAdded
     * To find the add_opening event
     */
    let worker_id = <NextWorkerId<T, I>>::get();

    let worker = create_a_worker::<T, I>(&caller_id, &member_id, can_leave_immediatly);

    <NextWorkerId<T, I>>::mutate(|id| *id += <TeamWorkerId<T> as One>::one());
    <ActiveWorkerCount<I>>::put(<ActiveWorkerCount<I>>::get() + 1);

    <WorkerById<T, I>>::insert(worker_id, worker);

    (caller_id, worker_id)
}

fn create_lead<T: Trait<I>, I: Instance>() -> (T::AccountId, TeamWorkerId<T>) {
    let (caller_id, lead_worker_id) = insert_a_worker::<T, I>(true);
    WorkingTeam::<T, I>::set_lead(lead_worker_id);
    (caller_id, lead_worker_id)
}

benchmarks_instance! {
    _ { }

    set_status_text {
      let i in 0 .. 50000; // TODO: We should have a bounded value for description

      let (lead_id, _) = create_lead::<T,I>();
      let status_text = Some(vec![0u8][..].repeat(i as usize)); // TODO:don't use as

    }: _ (RawOrigin::Signed(lead_id), status_text)
    verify {}

    update_reward_account {
      let i in 0 .. 10;

      let (caller_id, worker_id) = insert_a_worker::<T, I>(false);
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

      let stake_policy = StakePolicy {
        stake_amount: BalanceOfCurrency::<T>::max_value(),
        leaving_unstaking_period: T::BlockNumber::max_value(),
      };

      let reward_policy = RewardPolicy {
        reward_per_block: BalanceOfCurrency::<T>::max_value(),
      };

      let description = vec![0u8][..].repeat(i as usize); // TODO:don't use as

    }: _(RawOrigin::Root, description, JobOpeningType::Leader, Some(stake_policy), Some(reward_policy))
    verify { }

    // Might erase later
    leave_role_immediatly {
        let i in 0 .. 10; // TODO: test not running if we don't set a range of values

        let (caller_id, caller_worker_id) = insert_a_worker::<T, I>(true);
    }: leave_role(RawOrigin::Signed(caller_id), caller_worker_id)
    verify { }

    // This is always worse than leave_role_immediatly
    leave_lead_immediatly {
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

        let (caller_id, caller_worker_id) = insert_a_worker::<T, I>(false);
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
