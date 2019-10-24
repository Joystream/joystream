#![cfg(test)]

use super::mock::*;

use srml_support::*;

fn init_storage_role() {
    let roles: Vec<actors::Role> = vec![actors::Role::StorageProvider];
    assert!(
        Actors::set_available_roles(system::RawOrigin::Root.into(), roles).is_ok(),
        ""
    );
}

fn init_storage_parmeters() -> actors::RoleParameters<u64, u64> {
    let params = actors::RoleParameters {
        // minium balance required to stake to enter a role
        min_stake: 100 as u64,
        min_actors: 1 as u32,
        max_actors: 2 as u32,
        reward: 100 as u64,
        reward_period: 100 as u64,
        bonding_period: 100 as u64,
        unbonding_period: 100 as u64,
        min_service_period: 100 as u64,
        startup_grace_period: 100 as u64,
        entry_request_fee: 10 as u64,
    };
    assert!(
        Actors::set_role_parameters(
            system::RawOrigin::Root.into(),
            actors::Role::StorageProvider,
            params.clone()
        )
        .is_ok(),
        ""
    );
    params
}

#[test]
fn adding_roles() {
    initial_test_ext().execute_with(|| {
        init_storage_role();
        assert_eq!(
            Actors::available_roles(),
            vec![actors::Role::StorageProvider]
        );
    });
}

#[test]
fn adding_role_parameters() {
    initial_test_ext().execute_with(|| {
        init_storage_role();
        let params = init_storage_parmeters();
        assert_eq!(
            Actors::parameters(actors::Role::StorageProvider),
            Some(params)
        );
    });
}

#[test]
fn make_entry_request() {
    initial_test_ext().execute_with(|| {
        init_storage_role();
        let storage_params = init_storage_parmeters();

        let actor_account = 5 as u64;

        let starting_block = 1;
        System::set_block_number(starting_block);

        let requests = Actors::role_entry_requests();
        assert_eq!(requests.len(), 0);

        assert!(
            Actors::role_entry_request(
                Origin::signed(actor_account),
                actors::Role::StorageProvider,
                alice_id()
            )
            .is_err(),
            ""
        );

        let surplus_balance = 100;
        let _ = Balances::deposit_creating(
            &actor_account,
            storage_params.entry_request_fee + surplus_balance,
        );

        assert!(
            Actors::role_entry_request(
                Origin::signed(actor_account),
                actors::Role::StorageProvider,
                alice_id()
            )
            .is_ok(),
            ""
        );

        assert_eq!(Balances::free_balance(&actor_account), surplus_balance);

        let requests = Actors::role_entry_requests();
        assert_eq!(requests.len(), 1);
        let request = requests[0];
        assert_eq!(request.0, actor_account);
        assert_eq!(request.1, alice_id());
        assert_eq!(request.2, actors::Role::StorageProvider);
        assert_eq!(
            request.3,
            starting_block
                + <Test as system::Trait>::BlockNumber::from(Actors::request_life_time())
        );
    });
}

#[test]
fn staking() {
    initial_test_ext().execute_with(|| {
        init_storage_role();
        let storage_params = init_storage_parmeters();
        let actor_account = 5;

        let request: actors::Request<Test> = (
            actor_account,
            alice_id(),
            actors::Role::StorageProvider,
            1000,
        );

        <actors::RoleEntryRequests<Test>>::put(vec![request]);

        let _ = Balances::deposit_creating(&actor_account, storage_params.min_stake);

        assert!(Actors::stake(
            Origin::signed(alice_account()),
            actors::Role::StorageProvider,
            actor_account
        )
        .is_ok());

        let ids = Actors::actor_account_ids();
        assert_eq!(ids, vec![actor_account]);

        let actor = Actors::actor_by_account_id(actor_account);
        assert!(actor.is_some());

        let accounts_in_role = Actors::account_ids_by_role(actors::Role::StorageProvider);
        assert_eq!(accounts_in_role, vec![actor_account]);

        let account_ids_for_member = Actors::account_ids_by_member_id(alice_id());
        assert_eq!(account_ids_for_member, vec![actor_account]);

        let num_of_locks = Balances::locks(&actor_account).len();
        assert_eq!(num_of_locks, 1);
    });
}

#[test]
fn unstaking() {
    initial_test_ext().execute_with(|| {
        init_storage_role();
        let storage_params = init_storage_parmeters();
        let actor_account = 5;

        assert!(Actors::unstake(Origin::signed(alice_account()), actor_account).is_err());

        let actor: actors::Actor<Test> = actors::Actor {
            role: actors::Role::StorageProvider,
            member_id: alice_id(),
            account: actor_account,
            joined_at: 1,
        };
        <actors::ActorAccountIds<Test>>::put(vec![actor_account]);
        <actors::ActorByAccountId<Test>>::insert(&actor_account, actor);
        <actors::AccountIdsByRole<Test>>::insert(
            actors::Role::StorageProvider,
            vec![actor_account],
        );
        <actors::AccountIdsByMemberId<Test>>::insert(alice_id(), vec![actor_account]);
        let current_block = 500;

        System::set_block_number(current_block);
        assert!(Actors::unstake(Origin::signed(alice_account()), actor_account).is_ok());

        assert_eq!(Actors::actor_account_ids().len(), 0);

        let actor = Actors::actor_by_account_id(actor_account);
        assert!(actor.is_none());

        let accounts_in_role = Actors::account_ids_by_role(actors::Role::StorageProvider);
        assert_eq!(accounts_in_role.len(), 0);

        let account_ids_for_member = Actors::account_ids_by_member_id(alice_id());
        assert_eq!(account_ids_for_member.len(), 0);

        let lock = Balances::locks(&actor_account)[0].clone();
        // assuming this is our lock
        assert_eq!(lock.until, current_block + storage_params.unbonding_period);
    });
}
