#![cfg(test)]

use super::*;
use super::mock::*;

use parity_codec::Encode;
use runtime_io::with_externalities;
use srml_support::*;

// fn assert_ok_unwrap<T>(value: Option<T>, err: &'static str) -> T {
//     match value {
//         None => { assert!(false, err); value.unwrap() },
//         Some(v) => v
//     }
// }

fn init_storage_role() {
    let roles: Vec<actors::Role> = vec![actors::Role::Storage];
    assert!(Actors::set_available_roles(roles).is_ok(), "");
}

fn init_storage_parmeters() -> actors::RoleParameters<Test> {
    let params = actors::RoleParameters {
        // minium balance required to stake to enter a role
         min_stake: 100 as u32,
         min_actors: 1 as u32,
         max_actors: 2 as u32,
         reward: 100 as u32,
         reward_period: 100 as u64,
         bonding_period: 100 as u64,
         unbonding_period: 100 as u64,
         min_service_period: 100 as u64,
         startup_grace_period: 100 as u64,
         entry_request_fee: 10 as u32,
    };
    assert!(Actors::set_role_parameters(actors::Role::Storage, params.clone()).is_ok(), "");
    params
}

#[test]
fn adding_roles() {
    with_externalities(&mut initial_test_ext(), || {
        init_storage_role();
        assert_eq!(Actors::available_roles(), vec![actors::Role::Storage]);
    });
}

#[test]
fn adding_role_parameters() {
    with_externalities(&mut initial_test_ext(), || {
        init_storage_role();
        let params = init_storage_parmeters();
        assert_eq!(Actors::parameters(actors::Role::Storage), Some(params));
    });
}

#[test]
fn make_entry_request() {
    with_externalities(&mut initial_test_ext(), || {
        init_storage_role();
        let storageParams = init_storage_parmeters();

        let actor_account = 5 as u64;

        let starting_block = 1;
        System::set_block_number(starting_block);

        let requests = Actors::role_entry_requests();
        assert_eq!(requests.len(), 0);

        assert!(Actors::role_entry_request(
            Origin::signed(actor_account), actors::Role::Storage, MockMembers::alice_id()).is_err(), "");

        let surplus_balance = 100;
        Balances::set_free_balance(&actor_account, storageParams.entry_request_fee + surplus_balance);

        assert!(Actors::role_entry_request(
            Origin::signed(actor_account), actors::Role::Storage, MockMembers::alice_id()).is_ok(), "");

        assert_eq!(Balances::free_balance(&actor_account), surplus_balance);

        let requests = Actors::role_entry_requests();
        assert_eq!(requests.len(), 1);
        let request = requests[0];
        assert_eq!(request.0, actor_account);
        assert_eq!(request.1, MockMembers::alice_id());
        assert_eq!(request.2, actors::Role::Storage);
        assert_eq!(request.3, starting_block + actors::REQUEST_LIFETIME);
    });
}

