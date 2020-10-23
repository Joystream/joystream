#![cfg(feature = "runtime-benchmarks")]
use super::*;
use frame_benchmarking::{benchmarks_instance, Zero};
use sp_std::prelude::*;
use system as frame_system;
use system::RawOrigin;

fn create_a_worker<T: Trait<I>, I: Instance>(
    caller_id: &T::AccountId,
    member_id: &T::MemberId,
    can_leave_immediatly: bool,
) -> TeamWorker<T> {
    let job_unstaking_period = if !can_leave_immediatly {
        <T as system::Trait>::BlockNumber::from(1u32)
    } else {
        Zero::zero()
    };
    TeamWorker::<T>::new(
        &member_id,
        &caller_id,
        &caller_id,
        &None,
        job_unstaking_period,
        None,
        Zero::zero(),
    )
}

fn insert_a_worker<T: Trait<I>, I: Instance>(
    can_leave_immediatly: bool,
) -> (T::AccountId, TeamWorkerId<T>) {
    /*
     * TODO: Be able to have a different name for each account/member
     */
    let caller_id = frame_benchmarking::account::<T::AccountId>("caller", 0, 0);
    let member_id = frame_benchmarking::account::<T::MemberId>("member", 0, 0);

    let worker_id = <NextWorkerId<T, I>>::get();

    let worker = create_a_worker::<T, I>(&caller_id, &member_id, can_leave_immediatly);

    <NextWorkerId<T, I>>::mutate(|id| *id += <TeamWorkerId<T> as One>::one());
    <ActiveWorkerCount<I>>::put(<ActiveWorkerCount<I>>::get() + 1);

    <WorkerById<T, I>>::insert(worker_id, worker);

    (caller_id, worker_id)
}

benchmarks_instance! {
    _ { }

    leave_role_immediatly {
        let i in 0 .. 10;

        let (caller_id, caller_worker_id) = insert_a_worker::<T, I>(true);
        // Worst case scenario there is a lead(this requires **always** more steps)
        // could separate into new branch to tighten weight
        let (_, _) = insert_a_worker::<T, I>(false);

    }: leave_role(RawOrigin::Signed(caller_id), caller_worker_id)
    verify { }


    leave_role_later {
        let i in 0 .. 10;

        let (caller_id, caller_worker_id) = insert_a_worker::<T, I>(false);
    }: leave_role(RawOrigin::Signed(caller_id), caller_worker_id)
    verify { }

    /*
    set_budget {
      let i in 0 .. 10;

      let balance = BalanceOfCurrency::<T>::from(0u32);

    }: _ (RawOrigin::Root, balance)
    verify { }

    add_opening {
      let i in 0 .. 10;

      let description = vec![0u8];
      let opening_type = JobOpeningType::Regular;
      let stake_policy = None;
      let reward_policy = None;
      /*
       * TODO: IMPLEMENT
       */

    }: _ (i, description, opening_type, stake_policy, reward_policy)
    verify {}

    apply_on_opening {
      let i in 0 .. 10;

      let member_id = frame_benchmarking::account::<T::MemberId>("member", 0, 0);
      let
      ApplyOnOpeningParameters<T, I> {
        member_id
      }

    }: _ ()
    verify {}
    */
}

/*
    on_initialize {
      let i in 0 .. T::MaxWorkerNumberLimit::get();
    }: _ ()
    verify { }
*/

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
