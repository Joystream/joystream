#![cfg(test)]

use super::*;
use crate::mock::*;
use frame_support::traits::Currency;

fn create_new_mint_with_capacity(capacity: u64) -> u64 {
    let mint_id = Minting::add_mint(capacity, None).ok().unwrap();
    assert!(Minting::mint_exists(mint_id));
    assert_eq!(Minting::get_mint_capacity(mint_id).ok().unwrap(), capacity);
    mint_id
}

#[test]
fn adding_recipients() {
    build_test_externalities().execute_with(|| {
        let next_id = Rewards::recipients_created();
        assert!(!<Recipients<Test>>::contains_key(&next_id));
        let recipient_id = Rewards::add_recipient();
        assert!(<Recipients<Test>>::contains_key(&next_id));
        assert_eq!(recipient_id, next_id);
        assert_eq!(Rewards::recipients_created(), next_id + 1);
    });
}

#[test]
fn adding_relationships() {
    build_test_externalities().execute_with(|| {
        let recipient_account: u64 = 1;
        let mint_id = create_new_mint_with_capacity(1000000);
        let recipient_id = Rewards::add_recipient();
        let interval: u64 = 600;
        let next_payment_at: u64 = 2222;
        let payout = 100;

        let next_relationship_id = Rewards::reward_relationships_created();
        let relationship = Rewards::add_reward_relationship(
            mint_id,
            recipient_id,
            recipient_account,
            payout,
            next_payment_at,
            Some(interval),
        );
        assert!(relationship.is_ok());
        let relationship_id = relationship.ok().unwrap();
        assert_eq!(relationship_id, next_relationship_id);
        assert_eq!(
            Rewards::reward_relationships_created(),
            next_relationship_id + 1
        );
        assert!(<RewardRelationships<Test>>::contains_key(&relationship_id));
        let relationship = Rewards::reward_relationships(&relationship_id);
        assert_eq!(relationship.next_payment_at_block, Some(next_payment_at));
        assert_eq!(relationship.amount_per_payout, payout);
        assert_eq!(relationship.mint_id, mint_id);
        assert_eq!(relationship.account, recipient_account);
        assert_eq!(relationship.payout_interval, Some(interval));

        // mint doesn't exist
        assert_eq!(
            Rewards::add_reward_relationship(
                111,
                recipient_id,
                recipient_account,
                100,
                next_payment_at,
                None,
            )
            .expect_err("should fail if mint doesn't exist"),
            RewardsError::RewardSourceNotFound
        );
    });
}

#[test]
fn one_off_payout() {
    build_test_externalities().execute_with(|| {
        System::set_block_number(10000);
        let recipient_account: u64 = 1;
        let _ = Balances::deposit_creating(&recipient_account, 400);
        let mint_id = create_new_mint_with_capacity(1000000);
        let recipient_id = Rewards::add_recipient();
        let payout: u64 = 1000;
        let next_payout_at: u64 = 12222;
        let relationship = Rewards::add_reward_relationship(
            mint_id,
            recipient_id,
            recipient_account,
            payout,
            next_payout_at,
            None,
        );
        assert!(relationship.is_ok());
        let relationship_id = relationship.ok().unwrap();

        let relationship = Rewards::reward_relationships(&relationship_id);
        assert_eq!(relationship.next_payment_at_block, Some(next_payout_at));

        let starting_balance = Balances::free_balance(&recipient_account);

        // try to catch 'off by one' bugs
        Rewards::do_payouts(next_payout_at - 1);
        assert_eq!(Balances::free_balance(&recipient_account), starting_balance);
        Rewards::do_payouts(next_payout_at + 1);
        assert_eq!(Balances::free_balance(&recipient_account), starting_balance);

        assert_eq!(MockStatusHandler::successes(), 0);

        Rewards::do_payouts(next_payout_at);
        assert_eq!(
            Balances::free_balance(&recipient_account),
            starting_balance + payout
        );
        assert_eq!(MockStatusHandler::successes(), 1);

        let relationship = Rewards::reward_relationships(&relationship_id);
        assert_eq!(relationship.total_reward_received, payout);
        assert_eq!(relationship.next_payment_at_block, None);

        let recipient = Rewards::recipients(&recipient_id);
        assert_eq!(recipient.total_reward_received, payout);
    });
}

#[test]
fn recurring_payout() {
    build_test_externalities().execute_with(|| {
        System::set_block_number(10000);
        let recipient_account: u64 = 1;
        let _ = Balances::deposit_creating(&recipient_account, 400);
        let mint_id = create_new_mint_with_capacity(1000000);
        let recipient_id = Rewards::add_recipient();
        let payout: u64 = 1000;
        let next_payout_at: u64 = 12222;
        let interval: u64 = 600;
        let relationship = Rewards::add_reward_relationship(
            mint_id,
            recipient_id,
            recipient_account,
            payout,
            next_payout_at,
            Some(interval),
        );
        assert!(relationship.is_ok());
        let relationship_id = relationship.ok().unwrap();

        let relationship = Rewards::reward_relationships(&relationship_id);
        assert_eq!(relationship.next_payment_at_block, Some(next_payout_at));

        let starting_balance = Balances::free_balance(&recipient_account);

        let number_of_payouts = 3;
        for i in 0..number_of_payouts {
            Rewards::do_payouts(next_payout_at + interval * i);
        }
        assert_eq!(MockStatusHandler::successes(), number_of_payouts as usize);

        assert_eq!(
            Balances::free_balance(&recipient_account),
            starting_balance + payout * number_of_payouts
        );

        let relationship = Rewards::reward_relationships(&relationship_id);
        assert_eq!(
            relationship.total_reward_received,
            payout * number_of_payouts
        );

        let recipient = Rewards::recipients(&recipient_id);
        assert_eq!(recipient.total_reward_received, payout * number_of_payouts);
    });
}

#[test]
fn track_missed_payouts() {
    build_test_externalities().execute_with(|| {
        System::set_block_number(10000);
        let recipient_account: u64 = 1;
        let _ = Balances::deposit_creating(&recipient_account, 400);
        let mint_id = create_new_mint_with_capacity(0);
        let recipient_id = Rewards::add_recipient();
        let payout: u64 = 1000;
        let next_payout_at: u64 = 12222;
        let relationship = Rewards::add_reward_relationship(
            mint_id,
            recipient_id,
            recipient_account,
            payout,
            next_payout_at,
            None,
        );
        assert!(relationship.is_ok());
        let relationship_id = relationship.ok().unwrap();

        let relationship = Rewards::reward_relationships(&relationship_id);
        assert_eq!(relationship.next_payment_at_block, Some(next_payout_at));

        let starting_balance = Balances::free_balance(&recipient_account);

        Rewards::do_payouts(next_payout_at);
        assert_eq!(Balances::free_balance(&recipient_account), starting_balance);

        assert_eq!(MockStatusHandler::failures(), 1);

        let relationship = Rewards::reward_relationships(&relationship_id);
        assert_eq!(relationship.total_reward_received, 0);
        assert_eq!(relationship.total_reward_missed, payout);

        let recipient = Rewards::recipients(&recipient_id);
        assert_eq!(recipient.total_reward_received, 0);
        assert_eq!(recipient.total_reward_missed, payout);
    });
}

#[test]
fn activate_and_deactivate_relationship() {
    build_test_externalities().execute_with(|| {
        System::set_block_number(10000);
        let recipient_account: u64 = 1;
        let _ = Balances::deposit_creating(&recipient_account, 400);
        let mint_id = create_new_mint_with_capacity(0);
        let recipient_id = Rewards::add_recipient();
        let payout: u64 = 1000;
        let next_payout_at: u64 = 12222;

        // Add relationship
        let relationship_id = Rewards::add_reward_relationship(
            mint_id,
            recipient_id,
            recipient_account,
            payout,
            next_payout_at,
            None,
        )
        .unwrap();

        // The relationship starts out active
        assert!(Rewards::reward_relationships(&relationship_id).is_active());

        // We are able to deactivate relationship
        assert!(Rewards::try_to_deactivate_relationship(relationship_id).unwrap());

        // The relationship is no longer active
        assert!(!Rewards::reward_relationships(&relationship_id).is_active());

        // We cannot deactivate an already deactivated relationship
        assert!(!Rewards::try_to_deactivate_relationship(relationship_id).unwrap());

        // We are able to activate relationship
        assert!(Rewards::try_to_activate_relationship(relationship_id, next_payout_at).unwrap());

        // The relationship is now not active
        assert!(Rewards::reward_relationships(&relationship_id).is_active());

        // We cannot activate an already active relationship
        assert!(!Rewards::try_to_activate_relationship(relationship_id, next_payout_at).unwrap());
    });
}
