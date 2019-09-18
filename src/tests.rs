#![cfg(test)]

use super::*;
use crate::mock::*;
use srml_support::traits::Currency;

use runtime_io::with_externalities;

fn create_new_mint_with_capacity(capacity: u64) -> MintId {
    let mint_id = Minting::add_mint(capacity, None).ok().unwrap();
    assert!(Minting::mint_exists(mint_id));
    assert!(Minting::mint_has_capacity(mint_id, capacity));
    mint_id
}

#[test]
fn adding_recipients() {
    with_externalities(&mut build_test_externalities(), || {
        let next_id = Rewards::next_recipient_id();
        assert!(!<Recipients<Test>>::exists(&next_id));
        let recipient_id = Rewards::add_recipient();
        assert!(<Recipients<Test>>::exists(&next_id));
        assert_eq!(recipient_id, next_id);
        assert_eq!(Rewards::next_recipient_id(), next_id + 1);
    });
}

#[test]
fn adding_relationships() {
    with_externalities(&mut build_test_externalities(), || {
        let recipient_account: u64 = 1;
        let mint_id = create_new_mint_with_capacity(1000000);
        let recipient_id = Rewards::add_recipient();
        let interval: u64 = 600;
        let next_payment_at: u64 = 2222;
        let payout = 100;

        let next_relationship_id = Rewards::next_reward_relationship_id();
        let relationship = Rewards::add_reward_relationship(
            mint_id,
            recipient_id,
            recipient_account,
            payout,
            Some(NextPaymentSchedule::Absolute(next_payment_at)),
            Some(interval),
        );
        assert!(relationship.is_ok());
        let relationship_id = relationship.ok().unwrap();
        assert_eq!(relationship_id, next_relationship_id);
        assert_eq!(
            Rewards::next_reward_relationship_id(),
            next_relationship_id + 1
        );
        assert!(<RewardRelationships<Test>>::exists(&relationship_id));
        let relationship = Rewards::reward_relationships(&relationship_id);
        assert_eq!(relationship.next_payment_at_block, Some(next_payment_at));
        assert_eq!(relationship.amount_per_payout, payout);
        assert_eq!(relationship.mint_id, mint_id);
        assert_eq!(relationship.account, recipient_account);
        assert_eq!(relationship.payout_interval, Some(interval));

        // mint doesn't exist
        assert_eq!(Rewards::add_reward_relationship(
            111,
            recipient_id,
            recipient_account,
            100,
            None,
            None,
        ).expect_err("should fail if mint doesn't exist"), RewardsError::RewardSourceNotFound);
    });
}

#[test]
fn one_off_payout() {
    with_externalities(&mut build_test_externalities(), || {
        System::set_block_number(10000);
        let recipient_account: u64 = 1;
        let _ = Balances::deposit_creating(&recipient_account, 400);
        let mint_id = create_new_mint_with_capacity(1000000);
        let recipient_id = Rewards::add_recipient();
        let payout: u64 = 1000;
        let payout_after: u64 = 2222;
        let expected_payout_at = System::block_number() + payout_after;
        let relationship = Rewards::add_reward_relationship(
            mint_id,
            recipient_id,
            recipient_account,
            payout,
            Some(NextPaymentSchedule::Relative(payout_after)),
            None,
        );
        assert!(relationship.is_ok());
        let relationship_id = relationship.ok().unwrap();

        let relationship = Rewards::reward_relationships(&relationship_id);
        assert_eq!(relationship.next_payment_at_block, Some(expected_payout_at));

        let starting_balance = Balances::free_balance(&recipient_account);

        // try to catch 'off by one' bugs
        Rewards::do_payouts(expected_payout_at - 1);
        assert_eq!(Balances::free_balance(&recipient_account), starting_balance);
        Rewards::do_payouts(expected_payout_at + 1);
        assert_eq!(Balances::free_balance(&recipient_account), starting_balance);

        Rewards::do_payouts(expected_payout_at);
        assert_eq!(
            Balances::free_balance(&recipient_account),
            starting_balance + payout
        );

        let relationship = Rewards::reward_relationships(&relationship_id);
        assert_eq!(relationship.total_reward_received, payout);
        assert_eq!(relationship.next_payment_at_block, None);

        let recipient = Rewards::recipients(&recipient_id);
        assert_eq!(recipient.total_reward_received, payout);
    });
}

#[test]
fn recurring_payout() {
    with_externalities(&mut build_test_externalities(), || {
        System::set_block_number(10000);
        let recipient_account: u64 = 1;
        let _ = Balances::deposit_creating(&recipient_account, 400);
        let mint_id = create_new_mint_with_capacity(1000000);
        let recipient_id = Rewards::add_recipient();
        let payout: u64 = 1000;
        let payout_after: u64 = 2222;
        let expected_payout_at = System::block_number() + payout_after;
        let interval: u64 = 600;
        let relationship = Rewards::add_reward_relationship(
            mint_id,
            recipient_id,
            recipient_account,
            payout,
            Some(NextPaymentSchedule::Relative(payout_after)),
            Some(interval),
        );
        assert!(relationship.is_ok());
        let relationship_id = relationship.ok().unwrap();

        let relationship = Rewards::reward_relationships(&relationship_id);
        assert_eq!(relationship.next_payment_at_block, Some(expected_payout_at));

        let starting_balance = Balances::free_balance(&recipient_account);

        let number_of_payouts = 3;
        for i in 0..number_of_payouts {
            Rewards::do_payouts(expected_payout_at + interval * i);
        }

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
    with_externalities(&mut build_test_externalities(), || {
        System::set_block_number(10000);
        let recipient_account: u64 = 1;
        let _ = Balances::deposit_creating(&recipient_account, 400);
        let mint_id = create_new_mint_with_capacity(0);
        let recipient_id = Rewards::add_recipient();
        let payout: u64 = 1000;
        let payout_after: u64 = 2222;
        let expected_payout_at = System::block_number() + payout_after;
        let relationship = Rewards::add_reward_relationship(
            mint_id,
            recipient_id,
            recipient_account,
            payout,
            Some(NextPaymentSchedule::Relative(payout_after)),
            None,
        );
        assert!(relationship.is_ok());
        let relationship_id = relationship.ok().unwrap();

        let relationship = Rewards::reward_relationships(&relationship_id);
        assert_eq!(relationship.next_payment_at_block, Some(expected_payout_at));

        let starting_balance = Balances::free_balance(&recipient_account);

        Rewards::do_payouts(expected_payout_at);
        assert_eq!(Balances::free_balance(&recipient_account), starting_balance);

        let relationship = Rewards::reward_relationships(&relationship_id);
        assert_eq!(relationship.total_reward_received, 0);
        assert_eq!(relationship.total_reward_missed, payout);

        let recipient = Rewards::recipients(&recipient_id);
        assert_eq!(recipient.total_reward_received, 0);
        assert_eq!(recipient.total_reward_missed, payout);
    });
}
