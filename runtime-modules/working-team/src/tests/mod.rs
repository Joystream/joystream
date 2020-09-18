mod fixtures;
mod hiring_workflow;
mod mock;

use system::RawOrigin;

use crate::tests::hiring_workflow::HiringWorkflow;
use crate::tests::mock::STAKING_ACCOUNT_ID_FOR_FAILED_EXTERNAL_CHECK;
use crate::{Error, JobOpeningType, RawEvent, StakePolicy, TeamWorker};
use fixtures::{
    increase_total_balance_issuance_using_account_id, setup_members, AddOpeningFixture,
    ApplyOnOpeningFixture, EventFixture, FillOpeningFixture, HireLeadFixture,
    HireRegularWorkerFixture, LeaveWorkerRoleFixture, TerminateWorkerRoleFixture,
    UpdateWorkerRoleAccountFixture,
};
use frame_support::dispatch::DispatchError;
use frame_support::traits::{LockableCurrency, WithdrawReason};
use mock::{
    build_test_externalities, run_to_block, Balances, Test, TestWorkingTeam,
    TestWorkingTeamInstance,
};
use sp_std::collections::btree_map::BTreeMap;

#[test]
fn add_opening_succeeded() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let starting_block = 1;
        run_to_block(starting_block);

        let add_opening_fixture = AddOpeningFixture::default()
            .with_starting_block(starting_block)
            .with_stake_policy(Some(StakePolicy {
                stake_amount: 10,
                unstaking_period: 100,
            }));

        let opening_id = add_opening_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::OpeningAdded(opening_id));
    });
}

#[test]
fn add_opening_fails_with_bad_origin() {
    build_test_externalities().execute_with(|| {
        let add_opening_fixture = AddOpeningFixture::default()
            .with_opening_type(JobOpeningType::Leader)
            .with_origin(RawOrigin::None);

        add_opening_fixture.call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn add_leader_opening_fails_with_incorrect_origin_for_opening_type() {
    build_test_externalities().execute_with(|| {
        let add_opening_fixture =
            AddOpeningFixture::default().with_opening_type(JobOpeningType::Leader);

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

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id);

        let application_id = apply_on_opening_fixture.call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::AppliedOnOpening(
            opening_id,
            application_id,
        ));
    });
}

#[test]
fn apply_on_opening_fails_with_invalid_opening_id() {
    build_test_externalities().execute_with(|| {
        setup_members(2);

        let invalid_opening_id = 22;

        let apply_on_opening_fixture =
            ApplyOnOpeningFixture::default_for_opening_id(invalid_opening_id);

        apply_on_opening_fixture.call_and_assert(Err(
            Error::<Test, TestWorkingTeamInstance>::OpeningDoesNotExist.into(),
        ));
    });
}

#[test]
fn apply_on_opening_fails_with_bad_origin() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let member_id = 10;

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

        apply_on_opening_fixture.call_and_assert(Err(
            Error::<Test, TestWorkingTeamInstance>::OriginIsNeitherMemberControllerOrRoot.into(),
        ));
    });
}

#[test]
fn fill_opening_succeeded() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let starting_block = 1;
        run_to_block(starting_block);

        let add_opening_fixture = AddOpeningFixture::default().with_starting_block(starting_block);

        let opening_id = add_opening_fixture.call().unwrap();

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id);

        let application_id = apply_on_opening_fixture.call().unwrap();

        let fill_opening_fixture =
            FillOpeningFixture::default_for_ids(opening_id, vec![application_id]);

        let worker_id = fill_opening_fixture.call_and_assert(Ok(()));

        let mut result_map = BTreeMap::new();
        result_map.insert(application_id, worker_id);

        EventFixture::assert_last_crate_event(RawEvent::OpeningFilled(opening_id, result_map));
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
fn fill_opening_fails_with_invalid_active_worker_number() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let add_opening_fixture = AddOpeningFixture::default();

        let opening_id = add_opening_fixture.call().unwrap();

        let application_id1 = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .call()
            .unwrap();
        let application_id2 = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_origin(RawOrigin::Signed(2), 2)
            .call()
            .unwrap();
        let application_id3 = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_origin(RawOrigin::Signed(3), 3)
            .call()
            .unwrap();
        let application_id4 = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_origin(RawOrigin::Signed(4), 4)
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
            Error::<Test, TestWorkingTeamInstance>::MaxActiveWorkerNumberExceeded.into(),
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
            Error::<Test, TestWorkingTeamInstance>::SuccessfulWorkerApplicationDoesNotExist.into(),
        ));
    });
}

#[test]
fn cannot_hire_a_lead_twice() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();
        HireLeadFixture::default()
            .with_setup_environment(false)
            .expect(
                Error::<Test, TestWorkingTeamInstance>::CannotHireLeaderWhenLeaderExists.into(),
            );
    });
}

#[test]
fn cannot_hire_muptiple_leaders() {
    build_test_externalities().execute_with(|| {
        HiringWorkflow::default()
            .with_setup_environment(true)
            .with_opening_type(JobOpeningType::Leader)
            .add_default_application()
            .add_application_with_origin(b"leader2".to_vec(), RawOrigin::Signed(2), 2)
            .expect(Err(
                Error::<Test, TestWorkingTeamInstance>::CannotHireMultipleLeaders.into(),
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

        let old_lead = TestWorkingTeam::worker_by_id(worker_id);

        let update_worker_account_fixture =
            UpdateWorkerRoleAccountFixture::default_with_ids(worker_id, new_account_id);

        update_worker_account_fixture.call_and_assert(Ok(()));

        let new_lead = TestWorkingTeam::worker_by_id(worker_id);

        assert_eq!(
            new_lead,
            TeamWorker::<Test> {
                role_account_id: new_account_id,
                ..old_lead
            }
        );
    });
}

#[test]
fn update_worker_role_account_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let worker_id = HireRegularWorkerFixture::default().hire();

        let update_worker_account_fixture =
            UpdateWorkerRoleAccountFixture::default_with_ids(worker_id, 1)
                .with_origin(RawOrigin::None);

        update_worker_account_fixture.call_and_assert(Err(
            Error::<Test, TestWorkingTeamInstance>::InvalidMemberOrigin.into(),
        ));
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

        EventFixture::assert_last_crate_event(RawEvent::WorkerExited(worker_id));
    });
}

#[test]
fn leave_worker_role_by_leader_succeeds() {
    build_test_externalities().execute_with(|| {
        // Ensure that lead is default
        assert_eq!(TestWorkingTeam::current_lead(), None);
        let worker_id = HireLeadFixture::default().hire_lead();

        assert!(TestWorkingTeam::current_lead().is_some());

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id);

        leave_worker_role_fixture.call_and_assert(Ok(()));

        assert_eq!(TestWorkingTeam::current_lead(), None);
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
            .with_origin(RawOrigin::Signed(2));

        leave_worker_role_fixture.call_and_assert(Err(
            Error::<Test, TestWorkingTeamInstance>::SignerIsNotWorkerRoleAccount.into(),
        ));
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
            Error::<Test, TestWorkingTeamInstance>::WorkerDoesNotExist.into(),
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

        EventFixture::assert_last_crate_event(RawEvent::TerminatedWorker(worker_id));
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

        EventFixture::assert_last_crate_event(RawEvent::TerminatedLeader(worker_id));

        assert_eq!(TestWorkingTeam::current_lead(), None);
    });
}

#[test]
fn terminate_worker_role_fails_with_unset_lead() {
    build_test_externalities().execute_with(|| {
        let worker_id = HireRegularWorkerFixture::default().hire();

        // Remove the leader from the storage.
        TestWorkingTeam::unset_lead();

        let terminate_worker_role_fixture =
            TerminateWorkerRoleFixture::default_for_worker_id(worker_id);

        terminate_worker_role_fixture.call_and_assert(Err(
            Error::<Test, TestWorkingTeamInstance>::CurrentLeadNotSet.into(),
        ));
    });
}

#[test]
fn terminate_worker_role_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let worker_id = HiringWorkflow::default()
            .with_setup_environment(false)
            .add_application_with_origin(b"worker_handle".to_vec(), RawOrigin::Signed(2), 2)
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
        TestWorkingTeam::unset_lead();

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
        TestWorkingTeam::set_lead(worker_id);

        EventFixture::assert_last_crate_event(RawEvent::LeaderSet(worker_id));
    });
}

#[test]
fn add_opening_fails_with_zero_stake() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let add_opening_fixture =
            AddOpeningFixture::default().with_stake_policy(Some(StakePolicy {
                stake_amount: 0,
                unstaking_period: 0,
            }));

        add_opening_fixture.call_and_assert(Err(
            Error::<Test, TestWorkingTeamInstance>::CannotStakeZero.into(),
        ));
    });
}

#[test]
fn apply_on_opening_fails_with_insufficient_balance() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let add_opening_fixture = AddOpeningFixture::default();

        let opening_id = add_opening_fixture.call().unwrap();

        let apply_on_opening_fixture =
            ApplyOnOpeningFixture::default_for_opening_id(opening_id).with_stake(Some(100));

        apply_on_opening_fixture.call_and_assert(Err(
            Error::<Test, TestWorkingTeamInstance>::InsufficientBalanceToCoverStake.into(),
        ));
    });
}

#[test]
fn apply_on_opening_fails_with_locked_balance() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let account_id = 1;
        increase_total_balance_issuance_using_account_id(account_id, 300);

        let lock_id: [u8; 8] = [0; 8];
        <Test as common::currency::GovernanceCurrency>::Currency::set_lock(
            lock_id,
            &account_id,
            250,
            WithdrawReason::TransactionPayment.into(),
        );

        let add_opening_fixture = AddOpeningFixture::default();
        let opening_id = add_opening_fixture.call().unwrap();

        let apply_on_opening_fixture =
            ApplyOnOpeningFixture::default_for_opening_id(opening_id).with_stake(Some(100));

        apply_on_opening_fixture.call_and_assert(Err(balances::Error::<
            Test,
            balances::DefaultInstance,
        >::LiquidityRestrictions
            .into()));
    });
}

#[test]
fn apply_on_opening_fails_with_stake_inconsistent_with_opening_stake() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let account_id = 1;
        increase_total_balance_issuance_using_account_id(account_id, 300);

        let add_opening_fixture =
            AddOpeningFixture::default().with_stake_policy(Some(StakePolicy {
                stake_amount: 200,
                unstaking_period: 0,
            }));
        let opening_id = add_opening_fixture.call().unwrap();

        let apply_on_opening_fixture =
            ApplyOnOpeningFixture::default_for_opening_id(opening_id).with_stake(Some(100));

        apply_on_opening_fixture.call_and_assert(Err(
            Error::<Test, TestWorkingTeamInstance>::ApplicationStakeDoesntMatchOpening.into(),
        ));
    });
}

#[test]
fn apply_on_opening_locks_the_stake() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let account_id = 1;
        let total_balance = 300;
        let stake = 200;

        increase_total_balance_issuance_using_account_id(account_id, total_balance);

        let add_opening_fixture =
            AddOpeningFixture::default().with_stake_policy(Some(StakePolicy {
                stake_amount: stake,
                unstaking_period: 0,
            }));
        let opening_id = add_opening_fixture.call().unwrap();

        let apply_on_opening_fixture =
            ApplyOnOpeningFixture::default_for_opening_id(opening_id).with_stake(Some(stake));

        assert_eq!(Balances::usable_balance(&account_id), total_balance);

        apply_on_opening_fixture.call_and_assert(Ok(()));

        assert_eq!(Balances::usable_balance(&account_id), total_balance - stake);
    });
}

#[test]
fn apply_on_opening_fails_invalid_staking_check() {
    build_test_externalities().execute_with(|| {
        HireLeadFixture::default().hire_lead();

        let account_id = 1;
        let total_balance = 300;
        let stake = 200;

        increase_total_balance_issuance_using_account_id(account_id, total_balance);
        increase_total_balance_issuance_using_account_id(
            STAKING_ACCOUNT_ID_FOR_FAILED_EXTERNAL_CHECK,
            total_balance,
        );

        let add_opening_fixture =
            AddOpeningFixture::default().with_stake_policy(Some(StakePolicy {
                stake_amount: stake,
                unstaking_period: 0,
            }));
        let opening_id = add_opening_fixture.call().unwrap();

        let apply_on_opening_fixture = ApplyOnOpeningFixture::default_for_opening_id(opening_id)
            .with_stake(Some(stake))
            .with_stake_account_id(STAKING_ACCOUNT_ID_FOR_FAILED_EXTERNAL_CHECK);

        apply_on_opening_fixture
            .call_and_assert(Err(DispatchError::Other("External check failed")));
    });
}

#[test]
fn terminate_worker_unlocks_the_stake() {
    build_test_externalities().execute_with(|| {
        let account_id = 1;
        let total_balance = 300;
        let stake = 200;

        increase_total_balance_issuance_using_account_id(account_id, total_balance);

        let worker_id = HireRegularWorkerFixture::default().with_stake(stake).hire();

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
        let account_id = 1;
        let total_balance = 300;
        let stake = 200;

        increase_total_balance_issuance_using_account_id(account_id, total_balance);

        let worker_id = HireRegularWorkerFixture::default().with_stake(stake).hire();

        assert_eq!(Balances::usable_balance(&account_id), total_balance - stake);

        let leave_worker_role_fixture = LeaveWorkerRoleFixture::default_for_worker_id(worker_id);

        leave_worker_role_fixture.call_and_assert(Ok(()));

        assert_eq!(Balances::usable_balance(&account_id), total_balance);
    });
}

#[test]
fn terminate_worker_with_slashing_works() {
    build_test_externalities().execute_with(|| {
        let account_id = 1;
        let total_balance = 300;
        let stake = 200;

        increase_total_balance_issuance_using_account_id(account_id, total_balance);

        let worker_id = HireRegularWorkerFixture::default().with_stake(stake).hire();

        assert_eq!(Balances::usable_balance(&account_id), total_balance - stake);

        let terminate_worker_role_fixture =
            TerminateWorkerRoleFixture::default_for_worker_id(worker_id).with_slash();

        terminate_worker_role_fixture.call_and_assert(Ok(()));

        assert_eq!(Balances::usable_balance(&account_id), total_balance - stake);
    });
}
