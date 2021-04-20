mod fixtures;
mod hiring_workflow;
mod mock;

pub use mock::{build_test_externalities, Test};

use frame_system::RawOrigin;

use crate::tests::fixtures::{
    CancelOpeningFixture, DecreaseWorkerStakeFixture, IncreaseWorkerStakeFixture, SetBudgetFixture,
    SetStatusTextFixture, SlashWorkerStakeFixture, SpendFromBudgetFixture,
    UpdateRewardAccountFixture, UpdateRewardAmountFixture, WithdrawApplicationFixture,
};
use crate::tests::hiring_workflow::HiringWorkflow;
use crate::tests::mock::{
    STAKING_ACCOUNT_ID_FOR_CONFLICTING_STAKES, STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER,
};
use crate::types::StakeParameters;
use crate::{
    DefaultInstance, Error, OpeningType, RawEvent, RewardPaymentType, StakePolicy, Trait, Worker,
};
use common::working_group::WorkingGroupAuthenticator;
use fixtures::{
    increase_total_balance_issuance_using_account_id, AddOpeningFixture, ApplyOnOpeningFixture,
    EventFixture, FillOpeningFixture, HireLeadFixture, HireRegularWorkerFixture,
    LeaveWorkerRoleFixture, TerminateWorkerRoleFixture, UpdateWorkerRoleAccountFixture,
};
use frame_support::dispatch::DispatchError;
use frame_support::StorageMap;
use mock::{run_to_block, Balances, RewardPeriod, TestWorkingGroup, ACTOR_ORIGIN_ERROR};
use sp_runtime::traits::Hash;
use sp_std::collections::btree_map::BTreeMap;

#[test]
fn add_opening_succeeded() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let starting_block = 1;

        run_to_block(starting_block);

        let add_opening_fixture = AddOpeningFixture::default()
            .with_starting_block(starting_block)
            .with_stake_policy(StakePolicy {
                stake_amount: <Test as Trait>::MinimumApplicationStake::get(),
                leaving_unstaking_period: 100,
            })
            .with_reward_per_block(Some(10));

        let opening_id = add_opening_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::OpeningAdded(
            opening_id,
            add_opening_fixture.description,
            add_opening_fixture.opening_type,
            add_opening_fixture.stake_policy,
            add_opening_fixture.reward_per_block,
        ));
    });
}

#[test]
fn add_opening_fails_with_bad_origin() {
    build_test_externalities().execute_with(|| {
        let add_opening_fixture = AddOpeningFixture::default()
            .with_opening_type(OpeningType::Leader)
            .with_origin(RawOrigin::None);

        add_opening_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn add_opening_fails_with_less_than_minimum_stake() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let add_opening_fixture = AddOpeningFixture::default().with_stake_policy(StakePolicy {
            stake_amount: 0,
            leaving_unstaking_period: <Test as Trait>::MinUnstakingPeriodLimit::get(),
        });

        add_opening_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::BelowMinimumStakes.into(),
        ));

        let add_opening_fixture = AddOpeningFixture::default().with_stake_policy(StakePolicy {
            stake_amount: <Test as Trait>::MinimumApplicationStake::get() - 1,
            leaving_unstaking_period: <Test as Trait>::MinUnstakingPeriodLimit::get(),
        });

        add_opening_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::BelowMinimumStakes.into(),
        ));
    });
}

#[test]
fn add_opening_fails_with_zero_reward() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let add_opening_fixture = AddOpeningFixture::default().with_reward_per_block(Some(0));

        add_opening_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::CannotRewardWithZero.into(),
        ));
    });
}

#[test]
fn add_opening_fails_with_insufficient_balance() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default()
            .with_initial_balance(<Test as Trait>::MinimumApplicationStake::get() + 1)
            .hire_lead();

        let add_opening_fixture = AddOpeningFixture::default();

        add_opening_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::InsufficientBalanceToCoverStake.into(),
        ));
    });
}

#[test]
fn add_opening_fails_with_incorrect_unstaking_period() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let account_id = 1;
        let total_balance = 300;
        let stake = 200;

        increase_total_balance_issuance_using_account_id(account_id, total_balance);

        let invalid_unstaking_period = 3;
        let add_opening_fixture = AddOpeningFixture::default().with_stake_policy(StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: invalid_unstaking_period,
        });

        add_opening_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::UnstakingPeriodLessThanMinimum.into(),
        ));
    });
}

#[test]
fn add_leader_opening_fails_with_incorrect_origin_for_opening_type() {
    build_test_externalities().execute_with(|| {
        let add_opening_fixture =
            AddOpeningFixture::default().with_opening_type(OpeningType::Leader);

        add_opening_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn apply_on_opening_succeeded() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let starting_block = 1;
        run_to_block(starting_block);

        let add_opening_fixture = AddOpeningFixture::default().with_starting_block(starting_block);

        let opening_id = add_opening_fixture.call().unwrap();

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_initial_balance(<Test as Trait>::MinimumApplicationStake::get());

        let application_id = apply_on_opening_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::AppliedOnOpening(
            apply_on_opening_fixture.get_apply_on_opening_parameters(),
            application_id,
        ));
    });
}

#[test]
fn apply_on_opening_fails_with_invalid_opening_id() {
    build_test_externalities().execute_with(|| {
        let invalid_opening_id = 22;

        let apply_on_opening_fixture =
            ApplyOnOpeningFixture::default_for_opening_id(invalid_opening_id);

        apply_on_opening_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::OpeningDoesNotExist.into(),
        ));
    });
}

#[test]
fn apply_on_opening_fails_with_bad_origin() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let member_id = 11;

        let add_opening_fixture = AddOpeningFixture::default();

        let opening_id = add_opening_fixture.call().unwrap();

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_origin(RawOrigin::None, member_id);

        apply_on_opening_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn apply_on_opening_fails_with_bad_member_id() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let member_id = 27;

        let add_opening_fixture = AddOpeningFixture::default();

        let opening_id = add_opening_fixture.call().unwrap();

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_origin(RawOrigin::Signed(1), member_id);

        apply_on_opening_fixture
            .call_and_assert(Err(DispatchError::Other(ACTOR_ORIGIN_ERROR).into()));
    });
}

#[test]
fn fill_opening_succeeded() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let starting_block = 1;
        run_to_block(starting_block);

        let reward_per_block = 10;

        let add_opening_fixture = AddOpeningFixture::default()
            .with_starting_block(starting_block)
            .with_reward_per_block(Some(reward_per_block.clone()));

        let opening_id = add_opening_fixture.call().unwrap();

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id);

        let application_id = apply_on_opening_fixture.call().unwrap();

        let fill_opening_fixture =
            FillOpeningFixture::default_for_ids(opening_id, vec![application_id])
                .with_reward_per_block(Some(reward_per_block))
                .with_created_at(starting_block);

        let initial_balance = Balances::usable_balance(&1);

        let worker_id = fill_opening_fixture.call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&1),
            initial_balance + <Test as Trait>::LeaderOpeningStake::get()
        );

        let mut result_map = BTreeMap::new();
        result_map.insert(application_id, worker_id);

        EventFixture::assert_last_crate_event(RawEvent::OpeningFilled(
            opening_id,
            result_map,
            fill_opening_fixture.successful_application_ids,
        ));
    });
}

#[test]
fn fill_opening_succeeded_with_stake() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let starting_block = 1;
        run_to_block(starting_block);

        let account_id = 2;
        let total_balance = 300;
        let stake = 200;

        let stake_parameters = StakeParameters {
            stake,
            staking_account_id: account_id,
        };

        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        };
        let add_opening_fixture = AddOpeningFixture::default()
            .with_starting_block(starting_block)
            .with_stake_policy(stake_policy.clone());

        let opening_id = add_opening_fixture.call().unwrap();

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_initial_balance(total_balance)
            .with_stake_parameters(stake_parameters);

        let application_id = apply_on_opening_fixture.call().unwrap();

        let fill_opening_fixture =
            FillOpeningFixture::default_for_ids(opening_id, vec![application_id])
                .with_stake_policy(stake_policy)
                .with_staking_account_id(account_id)
                .with_created_at(starting_block);

        let worker_id = fill_opening_fixture.call_and_assert(Ok(()));

        let mut result_map = BTreeMap::new();
        result_map.insert(application_id, worker_id);

        EventFixture::assert_last_crate_event(RawEvent::OpeningFilled(
            opening_id,
            result_map,
            fill_opening_fixture.successful_application_ids,
        ));
    });
}

#[test]
fn fill_opening_fails_with_bad_origin() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let add_opening_fixture = AddOpeningFixture::default();

        let opening_id = add_opening_fixture.call_and_assert(Ok(()));

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id);

        let application_id = apply_on_opening_fixture.call_and_assert(Ok(()));

        let fill_opening_fixture =
            FillOpeningFixture::default_for_ids(opening_id, vec![application_id])
                .with_origin(RawOrigin::None);

        fill_opening_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn fill_opening_fails_with_application_for_other_opening() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default()
            .with_initial_balance(
                <Test as Trait>::MinimumApplicationStake::get()
                    + 3 * <Test as Trait>::LeaderOpeningStake::get()
                    + 1,
            )
            .hire_lead();

        let add_opening_fixture = AddOpeningFixture::default();

        let filling_opening_id = add_opening_fixture.call_and_assert(Ok(()));

        let apply_opening_id = add_opening_fixture.call_and_assert(Ok(()));

        let apply_on_opening_fixture =
            ApplyOnOpeningFixture::default_for_opening_id(apply_opening_id);

        let application_id = apply_on_opening_fixture.call_and_assert(Ok(()));

        let fill_opening_fixture =
            FillOpeningFixture::default_for_ids(filling_opening_id, vec![application_id]);

        fill_opening_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::ApplicationsNotForOpening.into(),
        ));
    });
}

#[test]
fn fill_opening_fails_with_invalid_active_worker_number() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let add_opening_fixture = AddOpeningFixture::default();

        let opening_id = add_opening_fixture.call().unwrap();

        let application_id1 = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_origin(RawOrigin::Signed(2), 2)
            .call()
            .unwrap();
        let application_id2 = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_origin(RawOrigin::Signed(3), 3)
            .call()
            .unwrap();
        let application_id3 = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_origin(RawOrigin::Signed(4), 4)
            .call()
            .unwrap();
        let application_id4 = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_origin(RawOrigin::Signed(5), 5)
            .call()
            .unwrap();

        let fill_opening_fixture = FillOpeningFixture::default_for_ids(
            opening_id,
            vec![
                application_id1,
                application_id2,
                application_id3,
                application_id4,
            ],
        );

        fill_opening_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::MaxActiveWorkerNumberExceeded.into(),
        ));
    });
}

#[test]
fn fill_opening_fails_with_invalid_application_id() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let add_opening_fixture = AddOpeningFixture::default();

        let opening_id = add_opening_fixture.call_and_assert(Ok(()));

        let invalid_application_id = 1;

        let fill_opening_fixture =
            FillOpeningFixture::default_for_ids(opening_id, vec![invalid_application_id]);

        fill_opening_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::SuccessfulWorkerApplicationDoesNotExist.into(),
        ));
    });
}

#[test]
fn fill_opening_fails_with_zero_application_ids() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let add_opening_fixture = AddOpeningFixture::default();

        let opening_id = add_opening_fixture.call_and_assert(Ok(()));

        let fill_opening_fixture = FillOpeningFixture::default_for_ids(opening_id, Vec::new());

        fill_opening_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::NoApplicationsProvided.into(),
        ));
    });
}

#[test]
fn cannot_hire_a_lead_twice() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();
        HireLeadFixture::default()
            .with_setup_environment(false)
            .expect(Error::<Test, DefaultInstance>::ConflictStakesOnAccount.into());
    });
}

#[test]
fn cannot_hire_muptiple_leaders() {
    build_test_externalities().execute_with(|| {
        HiringWorkflow::default()
            .with_setup_environment(true)
            .with_opening_type(OpeningType::Leader)
            .add_default_application()
            .add_application_full(b"leader2".to_vec(), RawOrigin::Signed(3), 3, 3)
            .expect(Err(
                Error::<Test, DefaultInstance>::CannotHireMultipleLeaders.into(),
            ))
            .execute();
    });
}

#[test]
fn update_worker_role_account_succeeds() {
    build_test_externalities().execute_with(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        let new_account_id = 10;
        let worker_id = HireRegularWorkerFixture::default().hire();

        let update_worker_account_fixture =
            UpdateWorkerRoleAccountFixture::default_with_ids(worker_id, new_account_id);

        update_worker_account_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::WorkerRoleAccountUpdated(
            worker_id,
            new_account_id,
        ));
    });
}

#[test]
fn update_worker_role_account_by_leader_succeeds() {
    build_test_externalities().execute_with(|| {
        let new_account_id = 10;
        let worker_id = HireLeadFixture::default().hire_lead();

        let old_lead = TestWorkingGroup::worker_by_id(worker_id);

        let update_worker_account_fixture =
            UpdateWorkerRoleAccountFixture::default_with_ids(worker_id, new_account_id);

        update_worker_account_fixture.call_and_assert(Ok(()));

        let new_lead = TestWorkingGroup::worker_by_id(worker_id);

        assert_eq!(
            new_lead,
            Worker::<Test> {
                role_account_id: new_account_id,
                ..old_lead
            }
        );
    });
}

#[test]
fn update_worker_role_fails_with_leaving_worker() {
    build_test_externalities().execute_with(|| {
        let total_balance = 300;
        let stake = 200;
        let leaving_unstaking_period = 10;

        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period,
        };

        let worker_id = HireRegularWorkerFixture::default()
            .with_initial_balance(total_balance)
            .with_stake_policy(stake_policy.clone())
            .hire();

        let new_account_id = 10;

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id);
        leave_worker_role_fixture.call_and_assert(Ok(()));

        let update_worker_account_fixture =
            UpdateWorkerRoleAccountFixture::default_with_ids(worker_id, new_account_id);

        update_worker_account_fixture
            .call_and_assert(Err(Error::<Test, DefaultInstance>::WorkerIsLeaving.into()));
    });
}

#[test]
fn update_worker_role_account_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let worker_id = HireRegularWorkerFixture::default().hire();

        let update_worker_account_fixture =
            UpdateWorkerRoleAccountFixture::default_with_ids(worker_id, 1)
                .with_origin(RawOrigin::None);

        update_worker_account_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn leave_worker_role_succeeds() {
    build_test_externalities().execute_with(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        let worker_id = HireRegularWorkerFixture::default().hire();

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id);

        leave_worker_role_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::WorkerStartedLeaving(worker_id, None));

        let worker = TestWorkingGroup::worker_by_id(worker_id);
        run_to_block(1 + worker.job_unstaking_period);

        EventFixture::assert_last_crate_event(RawEvent::WorkerExited(worker_id));
    });
}

#[test]
fn leave_worker_role_succeeds_with_paying_missed_reward() {
    build_test_externalities().execute_with(|| {
        let account_id = 2;
        let reward_per_block = 10;

        let worker_id = HireRegularWorkerFixture::default()
            .with_reward_per_block(Some(reward_per_block))
            .hire();

        let reward_period: u64 = <Test as Trait>::RewardPeriod::get().into();
        let missed_reward_block_number = reward_period * 2;

        run_to_block(missed_reward_block_number);

        assert_eq!(Balances::usable_balance(&account_id), 0);

        SetBudgetFixture::default().with_budget(1000000).execute();

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id);
        leave_worker_role_fixture.call_and_assert(Ok(()));

        let worker = TestWorkingGroup::worker_by_id(worker_id);
        let leaving_block = missed_reward_block_number + worker.job_unstaking_period;
        run_to_block(leaving_block);

        let missed_reward = missed_reward_block_number * reward_per_block;
        EventFixture::contains_crate_event(RawEvent::NewMissedRewardLevelReached(
            worker_id,
            Some(missed_reward),
        ));
        EventFixture::contains_crate_event(RawEvent::RewardPaid(
            account_id,
            missed_reward,
            RewardPaymentType::MissedReward,
        ));

        // Didn't get the last reward period: leaving earlier than rewarding.
        let reward_block_count = leaving_block - reward_period;
        assert_eq!(
            Balances::usable_balance(&account_id),
            reward_block_count * reward_per_block + <Test as Trait>::MinimumApplicationStake::get()
        );
    });
}

#[test]
fn leave_worker_role_succeeds_with_correct_unstaking_period() {
    build_test_externalities().execute_with(|| {
        let starting_block = 10;
        run_to_block(starting_block);

        let worker_id = HireRegularWorkerFixture::default().hire();

        // Assert initial worker existence
        assert!(<crate::WorkerById<Test, DefaultInstance>>::contains_key(
            worker_id
        ));

        let default_unstaking_period =
            TestWorkingGroup::worker_by_id(worker_id).job_unstaking_period;

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id);
        leave_worker_role_fixture.call_and_assert(Ok(()));

        // Assert worker existence after leave_role
        assert!(<crate::WorkerById<Test, DefaultInstance>>::contains_key(
            worker_id
        ));

        run_to_block(starting_block + default_unstaking_period - 1);

        // Assert worker existence one block before the end of the unstaking period.
        assert!(<crate::WorkerById<Test, DefaultInstance>>::contains_key(
            worker_id
        ));

        run_to_block(starting_block + default_unstaking_period);

        // Assert worker removal after the unstaking period.
        assert!(!<crate::WorkerById<Test, DefaultInstance>>::contains_key(
            worker_id
        ));
    });
}

#[test]
fn leave_worker_role_succeeds_with_partial_payment_of_missed_reward() {
    build_test_externalities().execute_with(|| {
        let account_id = 2;
        let reward_per_block = 10;

        let worker_id = HireRegularWorkerFixture::default()
            .with_reward_per_block(Some(reward_per_block))
            .hire();
        let block_number = 4;

        run_to_block(block_number);

        assert_eq!(Balances::usable_balance(&account_id), 0);

        let budget = 30;
        SetBudgetFixture::default().with_budget(budget).execute();

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id);
        leave_worker_role_fixture.call_and_assert(Ok(()));

        let worker = TestWorkingGroup::worker_by_id(worker_id);
        run_to_block(block_number + worker.job_unstaking_period);

        assert_eq!(
            Balances::usable_balance(&account_id),
            budget + <Test as Trait>::MinimumApplicationStake::get()
        );
    });
}

#[test]
fn leave_worker_role_by_leader_succeeds() {
    build_test_externalities().execute_with(|| {
        // Ensure that lead is default
        assert_eq!(TestWorkingGroup::current_lead(), None);
        let worker_id = HireLeadFixture::default().hire_lead();

        assert!(TestWorkingGroup::current_lead().is_some());

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id)
            .with_origin(RawOrigin::Signed(1));

        leave_worker_role_fixture.call_and_assert(Ok(()));

        let current_lead = TestWorkingGroup::current_lead().unwrap();
        let leader = TestWorkingGroup::worker_by_id(current_lead);
        assert!(leader.started_leaving_at.is_some());

        run_to_block(frame_system::Module::<Test>::block_number() + leader.job_unstaking_period);

        assert_eq!(TestWorkingGroup::current_lead(), None);
    });
}

#[test]
fn leave_worker_role_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let leave_worker_role_fixture =
            LeaveWorkerRoleFixture::default_for_worker_id(1).with_origin(RawOrigin::None);

        leave_worker_role_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn leave_worker_role_fails_with_invalid_origin_signed_account() {
    build_test_externalities().execute_with(|| {
        let worker_id = HireRegularWorkerFixture::default().hire();

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id)
            .with_origin(RawOrigin::Signed(3));

        leave_worker_role_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::SignerIsNotWorkerRoleAccount.into(),
        ));
    });
}

#[test]
fn leave_worker_role_fails_already_leaving_worker() {
    build_test_externalities().execute_with(|| {
        let total_balance = 300;
        let stake = 200;

        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        };

        let worker_id = HireRegularWorkerFixture::default()
            .with_initial_balance(total_balance)
            .with_stake_policy(stake_policy.clone())
            .hire();

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id);

        leave_worker_role_fixture.call_and_assert(Ok(()));
        leave_worker_role_fixture
            .call_and_assert(Err(Error::<Test, DefaultInstance>::WorkerIsLeaving.into()));
    });
}

#[test]
fn leave_worker_role_fails_with_invalid_worker_id() {
    build_test_externalities().execute_with(|| {
        let invalid_worker_id = 10;
        HireRegularWorkerFixture::default().hire();

        let leave_worker_role_fixture =
            LeaveWorkerRoleFixture::default_for_worker_id(invalid_worker_id);

        leave_worker_role_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::WorkerDoesNotExist.into(),
        ));
    });
}

#[test]
fn terminate_worker_role_succeeds() {
    build_test_externalities().execute_with(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        let worker_id = HireRegularWorkerFixture::default().hire();

        let terminate_worker_role_fixture =
            TerminateWorkerRoleFixture::default_for_worker_id(worker_id);

        terminate_worker_role_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::TerminatedWorker(
            worker_id,
            terminate_worker_role_fixture.penalty,
            terminate_worker_role_fixture.rationale,
        ));
    });
}

#[test]
fn terminate_worker_role_succeeds_with_paying_missed_reward() {
    build_test_externalities().execute_with(|| {
        let account_id = 2;
        let reward_per_block = 10;

        let worker_id = HireRegularWorkerFixture::default()
            .with_reward_per_block(Some(reward_per_block))
            .hire();

        let block_number = 4;

        run_to_block(block_number);

        assert_eq!(Balances::usable_balance(&account_id), 0);

        SetBudgetFixture::default().with_budget(1000000).execute();

        let terminate_worker_role_fixture =
            TerminateWorkerRoleFixture::default_for_worker_id(worker_id);

        terminate_worker_role_fixture.call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id),
            block_number * reward_per_block + <Test as Trait>::MinimumApplicationStake::get()
        );
    });
}

#[test]
fn terminate_leader_succeeds() {
    build_test_externalities().execute_with(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        let worker_id = HireLeadFixture::default().hire_lead();

        let terminate_worker_role_fixture =
            TerminateWorkerRoleFixture::default_for_worker_id(worker_id)
                .with_origin(RawOrigin::Root);

        terminate_worker_role_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::TerminatedLeader(
            worker_id,
            terminate_worker_role_fixture.penalty,
            terminate_worker_role_fixture.rationale,
        ));

        assert_eq!(TestWorkingGroup::current_lead(), None);
    });
}

#[test]
fn terminate_worker_role_fails_with_unset_lead() {
    build_test_externalities().execute_with(|| {
        let worker_id = HireRegularWorkerFixture::default().hire();

        // Remove the leader from the storage.
        TestWorkingGroup::unset_lead();

        let terminate_worker_role_fixture =
            TerminateWorkerRoleFixture::default_for_worker_id(worker_id);

        terminate_worker_role_fixture
            .call_and_assert(Err(Error::<Test, DefaultInstance>::CurrentLeadNotSet.into()));
    });
}

#[test]
fn terminate_worker_role_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let worker_id = HiringWorkflow::default()
            .with_setup_environment(false)
            .add_application_full(b"worker_handle".to_vec(), RawOrigin::Signed(2), 2, 2)
            .execute()
            .unwrap();

        let terminate_worker_role_fixture =
            TerminateWorkerRoleFixture::default_for_worker_id(worker_id)
                .with_origin(RawOrigin::None);

        terminate_worker_role_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn terminate_leader_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let worker_id = HireLeadFixture::default().hire_lead();

        let terminate_worker_role_fixture =
            TerminateWorkerRoleFixture::default_for_worker_id(worker_id)
                .with_origin(RawOrigin::None);

        terminate_worker_role_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn unset_lead_event_emitted() {
    build_test_externalities().execute_with(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        HireRegularWorkerFixture::default().hire();

        // Remove the leader from the storage.
        TestWorkingGroup::unset_lead();

        EventFixture::assert_last_crate_event(RawEvent::LeaderUnset());
    });
}

#[test]
fn set_lead_event_emitted() {
    build_test_externalities().execute_with(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        let worker_id = 10;

        // Add the leader to the storage.
        TestWorkingGroup::set_lead(worker_id);

        EventFixture::assert_last_crate_event(RawEvent::LeaderSet(worker_id));
    });
}

#[test]
fn apply_on_opening_fails_with_stake_inconsistent_with_opening_stake() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let account_id = 1;

        let stake_parameters = StakeParameters {
            stake: 100,
            staking_account_id: account_id,
        };

        let add_opening_fixture = AddOpeningFixture::default().with_stake_policy(StakePolicy {
            stake_amount: 200,
            leaving_unstaking_period: 10,
        });
        let opening_id = add_opening_fixture.call().unwrap();

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_initial_balance(300)
            .with_stake_parameters(stake_parameters);

        apply_on_opening_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::ApplicationStakeDoesntMatchOpening.into(),
        ));
    });
}

#[test]
fn apply_on_opening_locks_the_stake() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let account_id = 2;
        let total_balance = <Test as Trait>::MinimumApplicationStake::get() + 100;
        let stake = <Test as Trait>::MinimumApplicationStake::get();

        let stake_parameters = StakeParameters {
            stake,
            staking_account_id: account_id,
        };

        let add_opening_fixture = AddOpeningFixture::default().with_stake_policy(StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        });
        let opening_id = add_opening_fixture.call().unwrap();

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_stake_parameters(stake_parameters)
            .with_initial_balance(total_balance);

        apply_on_opening_fixture.call_and_assert(Ok(()));

        assert_eq!(Balances::usable_balance(&account_id), total_balance - stake);
    });
}

#[test]
fn apply_on_opening_fails_stake_amount_check() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let account_id = 2;
        let total_balance = 100;
        let stake = 200;

        let stake_parameters = StakeParameters {
            stake,
            staking_account_id: account_id,
        };

        let add_opening_fixture = AddOpeningFixture::default().with_stake_policy(StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        });
        let opening_id = add_opening_fixture.call().unwrap();

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_initial_balance(total_balance)
            .with_stake_parameters(stake_parameters);

        apply_on_opening_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::InsufficientBalanceToCoverStake.into(),
        ));
    });
}

#[test]
fn apply_on_opening_fails_invalid_staking_check() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let total_balance = 300;
        let stake = 200;

        increase_total_balance_issuance_using_account_id(
            STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER,
            total_balance,
        );

        let stake_parameters = StakeParameters {
            stake,
            staking_account_id: STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER,
        };

        let add_opening_fixture = AddOpeningFixture::default().with_stake_policy(StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        });
        let opening_id = add_opening_fixture.call().unwrap();

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_initial_balance(total_balance)
            .with_stake_parameters(stake_parameters);

        apply_on_opening_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::InvalidStakingAccountForMember.into(),
        ));
    });
}

#[test]
fn apply_on_opening_fails_with_conflicting_stakes() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let account_id = 1;
        let total_balance = 300;
        let stake = 200;

        let stake_parameters = StakeParameters {
            stake,
            staking_account_id: STAKING_ACCOUNT_ID_FOR_CONFLICTING_STAKES,
        };

        increase_total_balance_issuance_using_account_id(account_id, total_balance);
        increase_total_balance_issuance_using_account_id(
            STAKING_ACCOUNT_ID_FOR_CONFLICTING_STAKES,
            total_balance,
        );

        let add_opening_fixture = AddOpeningFixture::default().with_stake_policy(StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        });
        let opening_id = add_opening_fixture.call().unwrap();

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_stake_parameters(stake_parameters.clone())
            .with_initial_balance(stake_parameters.stake);
        apply_on_opening_fixture.call_and_assert(Ok(()));

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_stake_parameters(stake_parameters);

        apply_on_opening_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::ConflictStakesOnAccount.into(),
        ));
    });
}

#[test]
fn terminate_worker_unlocks_the_stake() {
    build_test_externalities().execute_with(|| {
        let account_id = 2;
        let total_balance = 300;
        let stake = 200;

        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        };

        let worker_id = HireRegularWorkerFixture::default()
            .with_initial_balance(total_balance)
            .with_stake_policy(stake_policy)
            .hire();

        assert_eq!(Balances::usable_balance(&account_id), total_balance - stake);

        let terminate_worker_role_fixture =
            TerminateWorkerRoleFixture::default_for_worker_id(worker_id);

        terminate_worker_role_fixture.call_and_assert(Ok(()));

        assert_eq!(Balances::usable_balance(&account_id), total_balance);
    });
}

#[test]
fn leave_worker_unlocks_the_stake() {
    build_test_externalities().execute_with(|| {
        let account_id = 2;
        let total_balance = 300;
        let stake = 200;

        let leaving_unstaking_period = 10;

        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period,
        };

        let worker_id = HireRegularWorkerFixture::default()
            .with_initial_balance(total_balance)
            .with_stake_policy(stake_policy.clone())
            .hire();

        assert_eq!(Balances::usable_balance(&account_id), total_balance - stake);

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id);

        leave_worker_role_fixture.call_and_assert(Ok(()));

        run_to_block(leaving_unstaking_period);

        assert_eq!(Balances::usable_balance(&account_id), total_balance);
    });
}

#[test]
fn leave_worker_unlocks_the_stake_with_unstaking_period() {
    build_test_externalities().execute_with(|| {
        let account_id = 2;
        let total_balance = 300;
        let stake = 200;

        let leaving_unstaking_period = 10;
        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period,
        };

        let worker_id = HireRegularWorkerFixture::default()
            .with_initial_balance(total_balance)
            .with_stake_policy(stake_policy.clone())
            .hire();

        assert_eq!(Balances::usable_balance(&account_id), total_balance - stake);

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id);

        leave_worker_role_fixture.call_and_assert(Ok(()));

        run_to_block(leaving_unstaking_period);

        assert!(!<crate::WorkerById<Test, DefaultInstance>>::contains_key(
            worker_id
        ));
        assert_eq!(Balances::usable_balance(&account_id), total_balance);

        EventFixture::assert_last_crate_event(RawEvent::WorkerExited(worker_id));
    });
}

#[test]
fn terminate_worker_with_slashing_succeeds() {
    build_test_externalities().execute_with(|| {
        let account_id = 2;
        let total_balance = 300;
        let stake = 200;

        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        };

        let worker_id = HireRegularWorkerFixture::default()
            .with_initial_balance(total_balance)
            .with_stake_policy(stake_policy)
            .hire();

        assert_eq!(Balances::usable_balance(&account_id), total_balance - stake);

        let terminate_worker_role_fixture =
            TerminateWorkerRoleFixture::default_for_worker_id(worker_id).with_penalty(Some(stake));

        terminate_worker_role_fixture.call_and_assert(Ok(()));

        assert_eq!(Balances::usable_balance(&account_id), total_balance - stake);
    });
}

#[test]
fn slash_worker_stake_succeeds() {
    build_test_externalities().execute_with(|| {
        /*
          Events are not emitted on block 0.
          So any dispatchable calls made during genesis block formation will have no events emitted.
          https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        let total_balance = 300;
        let stake = 200;
        let penalty = 100;

        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        };

        let worker_id = HireRegularWorkerFixture::default()
            .with_initial_balance(total_balance)
            .with_stake_policy(stake_policy)
            .hire();

        let slash_stake_fixture =
            SlashWorkerStakeFixture::default_for_worker_id(worker_id).with_penalty(penalty);

        slash_stake_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::StakeSlashed(
            worker_id, penalty, penalty, None,
        ));
    });
}

#[test]
fn slash_leader_stake_succeeds() {
    build_test_externalities().execute_with(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        let total_balance = 300;
        let penalty = 200;

        let stake_policy = StakePolicy {
            stake_amount: penalty,
            leaving_unstaking_period: 10,
        };

        let leader_worker_id = HireLeadFixture::default()
            .with_initial_balance(total_balance)
            .with_stake_policy(stake_policy)
            .hire_lead();

        let slash_stake_fixture = SlashWorkerStakeFixture::default_for_worker_id(leader_worker_id)
            .with_penalty(penalty)
            .with_account_id(1)
            .with_origin(RawOrigin::Root);

        slash_stake_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::StakeSlashed(
            leader_worker_id,
            penalty,
            penalty,
            None,
        ));
    });
}

#[test]
fn slash_worker_stake_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let invalid_worker_id = 22;
        let slash_stake_fixture = SlashWorkerStakeFixture::default_for_worker_id(invalid_worker_id)
            .with_origin(RawOrigin::None);

        slash_stake_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn slash_leader_stake_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let worker_id = HireLeadFixture::default().hire_lead();

        let slash_stake_fixture =
            SlashWorkerStakeFixture::default_for_worker_id(worker_id).with_origin(RawOrigin::None);

        slash_stake_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn slash_worker_stake_fails_with_zero_balance() {
    build_test_externalities().execute_with(|| {
        let total_balance = 300;
        let stake = 200;

        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        };

        let worker_id = HireRegularWorkerFixture::default()
            .with_initial_balance(total_balance)
            .with_stake_policy(stake_policy)
            .hire();

        let slash_stake_fixture =
            SlashWorkerStakeFixture::default_for_worker_id(worker_id).with_penalty(0);

        slash_stake_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::StakeBalanceCannotBeZero.into(),
        ));
    });
}

#[test]
fn slash_worker_stake_fails_with_invalid_worker_id() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();
        let invalid_worker_id = 11;

        let slash_stake_fixture = SlashWorkerStakeFixture::default_for_worker_id(invalid_worker_id);

        slash_stake_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::WorkerDoesNotExist.into(),
        ));
    });
}

#[test]
fn slash_worker_stake_fails_with_not_set_lead() {
    build_test_externalities().execute_with(|| {
        let invalid_worker_id = 11;

        let slash_stake_fixture = SlashWorkerStakeFixture::default_for_worker_id(invalid_worker_id);

        slash_stake_fixture
            .call_and_assert(Err(Error::<Test, DefaultInstance>::CurrentLeadNotSet.into()));
    });
}

#[test]
fn decrease_worker_stake_succeeds() {
    build_test_externalities().execute_with(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        let total_balance = 300;
        let stake = 200;
        let new_stake_balance = 100;

        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        };

        let worker_id = HireRegularWorkerFixture::default()
            .with_initial_balance(total_balance)
            .with_stake_policy(stake_policy)
            .hire();

        let decrease_stake_fixture = DecreaseWorkerStakeFixture::default_for_worker_id(worker_id)
            .with_balance(new_stake_balance);

        decrease_stake_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::StakeDecreased(
            worker_id,
            new_stake_balance,
        ));
    });
}

#[test]
fn decrease_worker_stake_succeeds_for_leader() {
    build_test_externalities().execute_with(|| {
        let total_balance = 300;
        let stake = 200;

        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        };

        let worker_id = HireLeadFixture::default()
            .with_initial_balance(total_balance)
            .with_stake_policy(stake_policy)
            .hire_lead();

        let new_stake = 100;
        let decrease_stake_fixture = DecreaseWorkerStakeFixture::default_for_worker_id(worker_id)
            .with_account_id(1)
            .with_origin(RawOrigin::Root)
            .with_balance(new_stake);

        decrease_stake_fixture.call_and_assert(Ok(()));
    });
}

#[test]
fn decrease_worker_stake_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let worker_id = 22; // random worker id
        let decrease_stake_fixture = DecreaseWorkerStakeFixture::default_for_worker_id(worker_id)
            .with_origin(RawOrigin::None);

        decrease_stake_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn decrease_worker_stake_fails_with_invalid_origin_for_leader() {
    build_test_externalities().execute_with(|| {
        let worker_id = HireLeadFixture::default().hire_lead();
        let decrease_stake_fixture = DecreaseWorkerStakeFixture::default_for_worker_id(worker_id)
            .with_origin(RawOrigin::None);

        decrease_stake_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn decrease_worker_stake_fails_with_zero_balance() {
    build_test_externalities().execute_with(|| {
        let total_balance = 300;
        let stake = 200;

        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        };

        let worker_id = HireRegularWorkerFixture::default()
            .with_stake_policy(stake_policy)
            .with_initial_balance(total_balance)
            .hire();

        let decrease_stake_fixture =
            DecreaseWorkerStakeFixture::default_for_worker_id(worker_id).with_balance(0);

        decrease_stake_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::StakeBalanceCannotBeZero.into(),
        ));
    });
}

#[test]
fn decrease_worker_stake_fails_with_invalid_worker_id() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();
        let invalid_worker_id = 11;

        let decrease_stake_fixture =
            DecreaseWorkerStakeFixture::default_for_worker_id(invalid_worker_id);

        decrease_stake_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::WorkerDoesNotExist.into(),
        ));
    });
}

#[test]
fn decrease_worker_stake_fails_with_not_set_lead() {
    build_test_externalities().execute_with(|| {
        let invalid_worker_id = 11;

        let decrease_stake_fixture =
            DecreaseWorkerStakeFixture::default_for_worker_id(invalid_worker_id);

        decrease_stake_fixture
            .call_and_assert(Err(Error::<Test, DefaultInstance>::CurrentLeadNotSet.into()));
    });
}

#[test]
fn increase_worker_stake_succeeds() {
    build_test_externalities().execute_with(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        let total_balance = 300;
        let stake = 200;
        let stake_balance_delta = 100;

        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        };

        let worker_id = HireRegularWorkerFixture::default()
            .with_initial_balance(total_balance)
            .with_stake_policy(stake_policy)
            .hire();

        let increase_stake_fixture = IncreaseWorkerStakeFixture::default_for_worker_id(worker_id)
            .with_balance(stake_balance_delta);

        increase_stake_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::StakeIncreased(
            worker_id,
            stake_balance_delta,
        ));
    });
}

#[test]
fn increase_worker_stake_succeeds_for_leader() {
    build_test_externalities().execute_with(|| {
        let total_balance = 400;
        let stake = 200;

        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        };

        let worker_id = HireLeadFixture::default()
            .with_initial_balance(total_balance)
            .with_stake_policy(stake_policy)
            .hire_lead();

        let increase_stake_fixture = IncreaseWorkerStakeFixture::default_for_worker_id(worker_id)
            .with_balance(stake)
            .with_account_id(1)
            .with_origin(RawOrigin::Signed(1));

        increase_stake_fixture.call_and_assert(Ok(()));
    });
}

#[test]
fn increase_worker_stake_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let worker_id = 0;
        let increase_stake_fixture = IncreaseWorkerStakeFixture::default_for_worker_id(worker_id)
            .with_origin(RawOrigin::None);

        increase_stake_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn increase_worker_stake_fails_with_zero_balance() {
    build_test_externalities().execute_with(|| {
        let total_balance = 300;
        let stake = 200;

        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        };

        let worker_id = HireRegularWorkerFixture::default()
            .with_stake_policy(stake_policy)
            .with_initial_balance(total_balance)
            .hire();

        let increase_stake_fixture =
            IncreaseWorkerStakeFixture::default_for_worker_id(worker_id).with_balance(0);

        increase_stake_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::StakeBalanceCannotBeZero.into(),
        ));
    });
}

#[test]
fn increase_worker_stake_fails_with_invalid_worker_id() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let invalid_worker_id = 11;

        let increase_stake_fixture =
            IncreaseWorkerStakeFixture::default_for_worker_id(invalid_worker_id);

        increase_stake_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::WorkerDoesNotExist.into(),
        ));
    });
}

#[test]
fn increase_worker_stake_fails_external_check() {
    build_test_externalities().execute_with(|| {
        let total_balance = 300;
        let stake = 200;

        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        };

        let worker_id = HireRegularWorkerFixture::default()
            .with_initial_balance(total_balance)
            .with_stake_policy(stake_policy)
            .hire();

        let invalid_new_stake = 2000;
        let decrease_stake_fixture = IncreaseWorkerStakeFixture::default_for_worker_id(worker_id)
            .with_balance(invalid_new_stake);

        decrease_stake_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::InsufficientBalanceToCoverStake.into(),
        ));
    });
}

#[test]
fn withdraw_application_succeeds() {
    build_test_externalities().execute_with(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        let starting_block = 1;
        run_to_block(starting_block);

        let account_id = 2;
        let total_balance = 300;
        let stake = 200;

        let stake_parameters = StakeParameters {
            stake,
            staking_account_id: account_id,
        };

        HireLeadFixture::default().hire_lead();

        let add_opening_fixture = AddOpeningFixture::default()
            .with_starting_block(starting_block)
            .with_stake_policy(StakePolicy {
                stake_amount: stake,
                leaving_unstaking_period: 10,
            });
        let opening_id = add_opening_fixture.call_and_assert(Ok(()));

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_initial_balance(total_balance)
            .with_stake_parameters(stake_parameters);
        let application_id = apply_on_opening_fixture.call_and_assert(Ok(()));

        let withdraw_application_fixture =
            WithdrawApplicationFixture::default_for_application_id(application_id).with_stake();
        withdraw_application_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::ApplicationWithdrawn(application_id));
    });
}

#[test]
fn withdraw_application_fails_invalid_application_id() {
    build_test_externalities().execute_with(|| {
        let invalid_application_id = 6;

        let withdraw_application_fixture =
            WithdrawApplicationFixture::default_for_application_id(invalid_application_id);
        withdraw_application_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::WorkerApplicationDoesNotExist.into(),
        ));
    });
}

#[test]
fn withdraw_application_fails_invalid_origin() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let add_opening_fixture = AddOpeningFixture::default();
        let opening_id = add_opening_fixture.call_and_assert(Ok(()));

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id);
        let application_id = apply_on_opening_fixture.call_and_assert(Ok(()));

        let withdraw_application_fixture =
            WithdrawApplicationFixture::default_for_application_id(application_id)
                .with_origin(RawOrigin::None);
        withdraw_application_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn withdraw_worker_application_fails_with_invalid_application_author() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let add_opening_fixture = AddOpeningFixture::default();
        let opening_id = add_opening_fixture.call_and_assert(Ok(()));

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_initial_balance(<Test as Trait>::MinimumApplicationStake::get() + 1);
        let application_id = apply_on_opening_fixture.call_and_assert(Ok(()));

        let invalid_author_account_id = 55;
        let withdraw_application_fixture =
            WithdrawApplicationFixture::default_for_application_id(application_id)
                .with_signer(invalid_author_account_id);
        withdraw_application_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::OriginIsNotApplicant.into(),
        ));
    });
}

#[test]
fn cancel_opening_succeeds() {
    build_test_externalities().execute_with(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        let starting_block = 1;
        run_to_block(starting_block);

        HireLeadFixture::default().hire_lead();

        let add_opening_fixture = AddOpeningFixture::default().with_starting_block(starting_block);
        let opening_id = add_opening_fixture.call_and_assert(Ok(()));

        let initial_balance = Balances::usable_balance(&1);

        let cancel_opening_fixture = CancelOpeningFixture::default_for_opening_id(opening_id);
        cancel_opening_fixture.call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&1),
            initial_balance + <Test as Trait>::LeaderOpeningStake::get()
        );

        EventFixture::assert_last_crate_event(RawEvent::OpeningCanceled(opening_id));
    });
}

#[test]
fn cancel_opening_fails_invalid_origin() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let add_opening_fixture = AddOpeningFixture::default();
        let opening_id = add_opening_fixture.call_and_assert(Ok(()));

        let cancel_opening_fixture =
            CancelOpeningFixture::default_for_opening_id(opening_id).with_origin(RawOrigin::None);
        cancel_opening_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn cancel_opening_fails_invalid_opening_id() {
    build_test_externalities().execute_with(|| {
        let invalid_opening_id = 11;

        let cancel_opening_fixture =
            CancelOpeningFixture::default_for_opening_id(invalid_opening_id);

        cancel_opening_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::OpeningDoesNotExist.into(),
        ));
    });
}

#[test]
fn decrease_worker_stake_fails_with_leaving_worker() {
    build_test_externalities().execute_with(|| {
        let total_balance = 300;
        let stake = 200;
        let new_stake_balance = 100;

        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        };

        let worker_id = HireRegularWorkerFixture::default()
            .with_initial_balance(total_balance)
            .with_stake_policy(stake_policy.clone())
            .hire();

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id);

        leave_worker_role_fixture.call_and_assert(Ok(()));

        let decrease_stake_fixture = DecreaseWorkerStakeFixture::default_for_worker_id(worker_id)
            .with_balance(new_stake_balance);

        decrease_stake_fixture
            .call_and_assert(Err(Error::<Test, DefaultInstance>::WorkerIsLeaving.into()));
    });
}

#[test]
fn increase_worker_stake_fails_with_leaving_worker() {
    build_test_externalities().execute_with(|| {
        let total_balance = 300;
        let stake = 200;
        let new_stake_balance = 100;

        let stake_policy = StakePolicy {
            stake_amount: stake,
            leaving_unstaking_period: 10,
        };

        let worker_id = HireRegularWorkerFixture::default()
            .with_stake_policy(stake_policy.clone())
            .with_initial_balance(total_balance)
            .hire();

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id);

        leave_worker_role_fixture.call_and_assert(Ok(()));

        let increase_stake_fixture = IncreaseWorkerStakeFixture::default_for_worker_id(worker_id)
            .with_balance(new_stake_balance);

        increase_stake_fixture
            .call_and_assert(Err(Error::<Test, DefaultInstance>::WorkerIsLeaving.into()));
    });
}

#[test]
fn rewards_payments_are_successful() {
    build_test_externalities().execute_with(|| {
        let reward_per_block = 10;

        let worker_id = HireRegularWorkerFixture::default()
            .with_reward_per_block(Some(reward_per_block))
            .hire();

        let worker = TestWorkingGroup::worker_by_id(worker_id);

        let account_id = worker.role_account_id;

        SetBudgetFixture::default().execute();

        assert_eq!(Balances::usable_balance(&account_id), 0);

        let block_number = 10;
        run_to_block(block_number);

        assert_eq!(
            Balances::usable_balance(&account_id),
            block_number * reward_per_block
        );

        let reward_period: u64 = <Test as Trait>::RewardPeriod::get().into();
        EventFixture::assert_last_crate_event(RawEvent::RewardPaid(
            account_id,
            reward_per_block * reward_period,
            RewardPaymentType::RegularReward,
        ));
    });
}

#[test]
fn rewards_payments_with_no_budget() {
    build_test_externalities().execute_with(|| {
        let reward_per_block = 10;

        let worker_id = HireRegularWorkerFixture::default()
            .with_reward_per_block(Some(reward_per_block))
            .hire();

        let worker = TestWorkingGroup::worker_by_id(worker_id);

        let account_id = worker.role_account_id;

        assert_eq!(Balances::usable_balance(&account_id), 0);

        let block_number = 10;
        run_to_block(block_number);

        assert_eq!(Balances::usable_balance(&account_id), 0);

        let worker = TestWorkingGroup::worker_by_id(worker_id);

        assert_eq!(
            worker.missed_reward.unwrap(),
            block_number * reward_per_block
        );
    });
}

#[test]
fn rewards_payments_with_insufficient_budget_and_restored_budget() {
    build_test_externalities().execute_with(|| {
        let reward_per_block = 10;

        let worker_id = HireRegularWorkerFixture::default()
            .with_reward_per_block(Some(reward_per_block))
            .hire();

        let worker = TestWorkingGroup::worker_by_id(worker_id);

        let account_id = worker.reward_account_id;

        assert_eq!(Balances::usable_balance(&account_id), 0);

        let paid_blocks = 3;

        let first_budget = paid_blocks * reward_per_block;
        SetBudgetFixture::default()
            .with_budget(first_budget)
            .execute();

        let block_number = 10;
        run_to_block(block_number);

        assert_eq!(Balances::usable_balance(&account_id), first_budget);

        let worker = TestWorkingGroup::worker_by_id(worker_id);

        let effective_missed_reward: u64 = block_number * reward_per_block - first_budget;

        assert_eq!(worker.missed_reward.unwrap(), effective_missed_reward);

        SetBudgetFixture::default().with_budget(1000000).execute();

        // Checkpoint with restored budget.
        let block_number2 = 20;
        run_to_block(block_number2);

        assert_eq!(
            Balances::usable_balance(&account_id),
            block_number2 * reward_per_block
        );
    });
}

#[test]
fn rewards_payments_with_starting_block() {
    build_test_externalities().execute_with(|| {
        let starting_block = 3;
        run_to_block(starting_block);

        let reward_per_block = 10;
        let reward_period: u64 = RewardPeriod::get().into();

        let worker_id = HireRegularWorkerFixture::default()
            .with_reward_per_block(Some(reward_per_block))
            .hire();

        let worker = TestWorkingGroup::worker_by_id(worker_id);

        let account_id = worker.reward_account_id;

        SetBudgetFixture::default().with_budget(100000).execute();

        let block_number = 11;
        run_to_block(block_number);

        let effective_paid_blocks =
            (block_number - starting_block) - (block_number % reward_period);
        assert_eq!(
            Balances::usable_balance(&account_id),
            effective_paid_blocks * reward_per_block
        );
    });
}

#[test]
fn set_budget_succeeded() {
    build_test_externalities().execute_with(|| {
        run_to_block(1);

        let new_budget = 10000;
        SetBudgetFixture::default()
            .with_budget(new_budget)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::BudgetSet(new_budget));
    });
}

#[test]
fn set_budget_fails_with_bad_origin() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();
        let leader_account_id = 1;

        SetBudgetFixture::default()
            .with_origin(RawOrigin::Signed(leader_account_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn update_reward_account_succeeds() {
    build_test_externalities().execute_with(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        let reward_per_block = 10;

        let worker_id = HireRegularWorkerFixture::default()
            .with_reward_per_block(Some(reward_per_block))
            .hire();

        let new_reward_account = 22;
        let update_account_fixture =
            UpdateRewardAccountFixture::default_with_ids(worker_id, new_reward_account);

        update_account_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::WorkerRewardAccountUpdated(
            worker_id,
            new_reward_account,
        ));
    });
}

#[test]
fn update_reward_account_succeeds_for_leader() {
    build_test_externalities().execute_with(|| {
        let reward_per_block = 10;

        let worker_id = HireLeadFixture::default()
            .with_reward_per_block(Some(reward_per_block))
            .hire_lead();

        let new_reward_account = 22;
        let update_account_fixture =
            UpdateRewardAccountFixture::default_with_ids(worker_id, new_reward_account)
                .with_origin(RawOrigin::Signed(1));

        update_account_fixture.call_and_assert(Ok(()));
    });
}

#[test]
fn update_reward_account_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let update_account_fixture =
            UpdateRewardAccountFixture::default_with_ids(1, 1).with_origin(RawOrigin::None);

        update_account_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn update_reward_account_fails_with_invalid_origin_signed_account() {
    build_test_externalities().execute_with(|| {
        let reward_per_block = 10;

        let worker_id = HireLeadFixture::default()
            .with_reward_per_block(Some(reward_per_block))
            .hire_lead();

        let invalid_role_account = 23333;
        let new_reward_account = 22;
        let update_account_fixture =
            UpdateRewardAccountFixture::default_with_ids(worker_id, new_reward_account)
                .with_origin(RawOrigin::Signed(invalid_role_account));

        update_account_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::SignerIsNotWorkerRoleAccount.into(),
        ));
    });
}

#[test]
fn update_reward_account_fails_with_invalid_worker_id() {
    build_test_externalities().execute_with(|| {
        let reward_per_block = 10;

        HireRegularWorkerFixture::default()
            .with_reward_per_block(Some(reward_per_block))
            .hire();

        let invalid_worker_id = 11;
        let new_reward_account = 2;
        let update_account_fixture =
            UpdateRewardAccountFixture::default_with_ids(invalid_worker_id, new_reward_account);

        update_account_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::WorkerDoesNotExist.into(),
        ));
    });
}

#[test]
fn update_reward_account_fails_with_no_recurring_reward() {
    build_test_externalities().execute_with(|| {
        let worker_id = HireRegularWorkerFixture::default().hire();

        let new_reward_account = 343;

        let update_account_fixture =
            UpdateRewardAccountFixture::default_with_ids(worker_id, new_reward_account);

        update_account_fixture
            .call_and_assert(Err(Error::<Test, DefaultInstance>::WorkerHasNoReward.into()));
    });
}

#[test]
fn update_reward_amount_succeeds() {
    build_test_externalities().execute_with(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        let worker_id = HireRegularWorkerFixture::default().hire();

        let reward_per_block = 120;

        let update_amount_fixture = UpdateRewardAmountFixture::default_for_worker_id(worker_id)
            .with_reward_per_block(Some(reward_per_block));

        update_amount_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::WorkerRewardAmountUpdated(
            worker_id,
            Some(reward_per_block),
        ));
    });
}

#[test]
fn update_reward_amount_succeeds_for_leader() {
    build_test_externalities().execute_with(|| {
        let worker_id = HireLeadFixture::default()
            .with_reward_per_block(Some(1000))
            .hire_lead();

        let update_amount_fixture = UpdateRewardAmountFixture::default_for_worker_id(worker_id)
            .with_origin(RawOrigin::Root);

        update_amount_fixture.call_and_assert(Ok(()));
    });
}

#[test]
fn update_reward_amount_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let worker_id = 22; // random worker id

        let update_amount_fixture = UpdateRewardAmountFixture::default_for_worker_id(worker_id)
            .with_origin(RawOrigin::None);

        update_amount_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn update_reward_amount_fails_with_invalid_origin_for_leader() {
    build_test_externalities().execute_with(|| {
        let worker_id = HireLeadFixture::default().hire_lead();

        let update_amount_fixture = UpdateRewardAmountFixture::default_for_worker_id(worker_id)
            .with_origin(RawOrigin::None);

        update_amount_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn update_reward_amount_fails_with_invalid_origin_signed_account() {
    build_test_externalities().execute_with(|| {
        let worker_id = HireRegularWorkerFixture::default().hire();

        let update_amount_fixture = UpdateRewardAmountFixture::default_for_worker_id(worker_id)
            .with_origin(RawOrigin::Signed(2));

        update_amount_fixture
            .call_and_assert(Err(Error::<Test, DefaultInstance>::IsNotLeadAccount.into()));
    });
}

#[test]
fn update_reward_amount_fails_with_invalid_worker_id() {
    build_test_externalities().execute_with(|| {
        HireRegularWorkerFixture::default().hire();

        let invalid_worker_id = 12;
        let update_amount_fixture =
            UpdateRewardAmountFixture::default_for_worker_id(invalid_worker_id);

        update_amount_fixture.call_and_assert(Err(
            Error::<Test, DefaultInstance>::WorkerDoesNotExist.into(),
        ));
    });
}

#[test]
fn set_status_text_succeeded() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        run_to_block(1);

        let status_text = b"some".to_vec();
        SetStatusTextFixture::default()
            .with_status_text(Some(status_text.clone()))
            .call_and_assert(Ok(()));

        let expected_hash = <Test as frame_system::Trait>::Hashing::hash(&status_text);
        EventFixture::assert_last_crate_event(RawEvent::StatusTextChanged(
            expected_hash.as_ref().to_vec(),
            Some(status_text),
        ));
    });
}

#[test]
fn set_status_text_fails_with_bad_origin() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();
        let leader_account_id = 10;

        SetStatusTextFixture::default()
            .with_origin(RawOrigin::Signed(leader_account_id))
            .call_and_assert(Err(Error::<Test, DefaultInstance>::IsNotLeadAccount.into()));
    });
}

#[test]
fn spend_from_budget_succeeded() {
    build_test_externalities().execute_with(|| {
        let account_id = 2;
        let amount = 100;
        HireLeadFixture::default().hire_lead();

        run_to_block(1);

        let set_budget_fixture = SetBudgetFixture::default().with_budget(1000);
        assert_eq!(set_budget_fixture.call(), Ok(()));

        SpendFromBudgetFixture::default()
            .with_account_id(account_id)
            .with_amount(amount)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::BudgetSpending(account_id, amount, None));
    });
}

#[test]
fn spend_from_budget_failed_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        SpendFromBudgetFixture::default()
            .with_origin(RawOrigin::None.into())
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn spend_from_budget_fails_with_empty_budget() {
    build_test_externalities().execute_with(|| {
        let account_id = 2;
        let amount = 100;
        HireLeadFixture::default().hire_lead();

        SpendFromBudgetFixture::default()
            .with_account_id(account_id)
            .with_amount(amount)
            .call_and_assert(Err(
                Error::<Test, DefaultInstance>::InsufficientBudgetForSpending.into(),
            ));
    });
}

#[test]
fn spend_from_budget_fails_with_zero_amount() {
    build_test_externalities().execute_with(|| {
        let account_id = 2;
        let amount = 0;
        HireLeadFixture::default().hire_lead();

        SpendFromBudgetFixture::default()
            .with_account_id(account_id)
            .with_amount(amount)
            .call_and_assert(Err(Error::<Test, DefaultInstance>::CannotSpendZero.into()));
    });
}

#[test]
fn ensure_worker_origin_works_correctly() {
    build_test_externalities().execute_with(|| {
        let invalid_worker_id = 2;
        assert_eq!(
            TestWorkingGroup::ensure_worker_origin(RawOrigin::None.into(), &invalid_worker_id),
            Err(DispatchError::BadOrigin)
        );

        let account_id = 2;
        assert_eq!(
            TestWorkingGroup::ensure_worker_origin(
                RawOrigin::Signed(account_id).into(),
                &invalid_worker_id
            ),
            Err(Error::<Test, DefaultInstance>::WorkerDoesNotExist.into())
        );

        let worker_id = HireRegularWorkerFixture::default().hire();

        let invalid_account = 3;
        assert_eq!(
            TestWorkingGroup::ensure_worker_origin(
                RawOrigin::Signed(invalid_account).into(),
                &worker_id
            ),
            Err(Error::<Test, DefaultInstance>::SignerIsNotWorkerRoleAccount.into())
        );

        assert_eq!(
            TestWorkingGroup::ensure_worker_origin(
                RawOrigin::Signed(account_id).into(),
                &worker_id
            ),
            Ok(())
        );
    });
}

#[test]
fn ensure_leader_origin_works_correctly() {
    build_test_externalities().execute_with(|| {
        assert_eq!(
            TestWorkingGroup::ensure_leader_origin(RawOrigin::None.into()),
            Err(DispatchError::BadOrigin)
        );

        let account_id = 1;
        assert_eq!(
            TestWorkingGroup::ensure_leader_origin(RawOrigin::Signed(account_id).into()),
            Err(Error::<Test, DefaultInstance>::CurrentLeadNotSet.into())
        );

        HireLeadFixture::default().hire_lead();

        let invalid_account = 2;
        assert_eq!(
            TestWorkingGroup::ensure_leader_origin(RawOrigin::Signed(invalid_account).into()),
            Err(Error::<Test, DefaultInstance>::IsNotLeadAccount.into())
        );

        assert_eq!(
            TestWorkingGroup::ensure_leader_origin(RawOrigin::Signed(account_id).into()),
            Ok(())
        );
    });
}

#[test]
fn get_leader_member_id_works_correctly() {
    build_test_externalities().execute_with(|| {
        assert_eq!(TestWorkingGroup::get_leader_member_id(), None);

        HireLeadFixture::default().hire_lead();

        let leader_member_id = 1;
        assert_eq!(
            TestWorkingGroup::get_leader_member_id(),
            Some(leader_member_id)
        );
    });
}

#[test]
fn is_leader_account_id_works_correctly() {
    build_test_externalities().execute_with(|| {
        let invalid_account_id = 2u64;
        // No leader set
        assert_eq!(
            TestWorkingGroup::is_leader_account_id(&invalid_account_id),
            false
        );

        HireLeadFixture::default().hire_lead();

        assert_eq!(
            TestWorkingGroup::is_leader_account_id(&invalid_account_id),
            false
        );

        let account_id = 1u64;
        assert_eq!(TestWorkingGroup::is_leader_account_id(&account_id), true);
    });
}

#[test]
fn is_worker_account_id_works_correctly() {
    build_test_externalities().execute_with(|| {
        let invalid_account_id = 3u64;
        let invalid_worker_id = 3u64;

        // Not hired
        assert_eq!(
            TestWorkingGroup::is_worker_account_id(&invalid_account_id, &invalid_worker_id),
            false
        );

        let worker_id = HireRegularWorkerFixture::default().hire();

        assert_eq!(
            TestWorkingGroup::is_worker_account_id(&invalid_account_id, &worker_id),
            false
        );

        let account_id = 2u64;
        assert_eq!(
            TestWorkingGroup::is_worker_account_id(&account_id, &invalid_worker_id),
            false
        );

        assert_eq!(
            TestWorkingGroup::is_worker_account_id(&account_id, &worker_id),
            true
        );
    });
}
