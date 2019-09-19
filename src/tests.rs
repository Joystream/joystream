#![cfg(test)]

use super::*;
use crate::mock::*;

use runtime_io::with_externalities;

#[test]
fn stake_pool_works() {
    with_externalities(&mut build_test_externalities(), || {
        // using deposit_creating
        assert_eq!(Balances::total_issuance(), 0);
        assert_eq!(StakePool::staking_fund_balance(), 0);
        let _ = Balances::deposit_creating(&StakePool::staking_fund_account_id(), 1000);
        assert_eq!(Balances::total_issuance(), 1000);
        assert_eq!(StakePool::staking_fund_balance(), 1000);

        // using move_funds_into_pool()
        let _ = Balances::deposit_creating(&1, 1000);
        assert_eq!(Balances::total_issuance(), 2000);

        assert!(StakePool::move_funds_into_pool(&1, 100).is_ok());

        // total issuance unchanged after movement of funds
        assert_eq!(Balances::total_issuance(), 2000);

        // funds moved into stake pool
        assert_eq!(StakePool::staking_fund_balance(), 1100);

        // no fees were deducted
        assert_eq!(Balances::free_balance(&1), 900);
    });
}

#[test]
fn create_stake() {
    with_externalities(&mut build_test_externalities(), || {
        let stake_id = StakePool::create_stake();
        assert_eq!(stake_id, FIRST_STAKE_ID);
        assert!(<Stakes<Test>>::exists(&stake_id));

        // Should be NotStaked
        let stake = StakePool::stakes(&stake_id);
        assert_eq!(stake.staking_status, StakingStatus::NotStaked);
    });
}

#[test]
fn remove_stake_in_not_staked_state() {
    with_externalities(&mut build_test_externalities(), || {
        <Stakes<Test>>::insert(
            &100,
            Stake {
                created: 0,
                staking_status: StakingStatus::NotStaked,
            },
        );
        StakePool::remove_stake(&100);
        assert!(!<Stakes<Test>>::exists(&100));

        // when status is Staked, removing should fail
        <Stakes<Test>>::insert(
            &200,
            Stake {
                created: 0,
                staking_status: StakingStatus::Staked(Default::default()),
            },
        );
        StakePool::remove_stake(&200);
        assert!(<Stakes<Test>>::exists(&200));
    });
}

#[test]
fn enter_staked_state() {
    with_externalities(&mut build_test_externalities(), || {
        <Stakes<Test>>::insert(
            &100,
            Stake {
                created: 0,
                staking_status: StakingStatus::NotStaked,
            },
        );

        let starting_balance: u64 = Balances::minimum_balance() + 1000;
        let staker_account: u64 = 1;
        let stake_value: u64 = Balances::minimum_balance() + 100;

        let _ = Balances::deposit_creating(&staker_account, starting_balance);

        assert!(StakePool::stake(&100, &staker_account, stake_value).is_ok());

        assert_eq!(
            Balances::free_balance(&staker_account),
            starting_balance - stake_value
        );

        assert_eq!(StakePool::staking_fund_balance(), stake_value);
    });
}

#[test]
fn increasing_stake() {
    with_externalities(&mut build_test_externalities(), || {
        let starting_pool_stake = 5000;
        Balances::deposit_creating(&StakePool::staking_fund_account_id(), starting_pool_stake);

        let starting_stake = 100;
        <Stakes<Test>>::insert(
            &100,
            Stake {
                created: 0,
                staking_status: StakingStatus::Staked(StakedState {
                    staked_amount: starting_stake,
                    ongoing_slashes: BTreeMap::new(),
                    staked_status: StakedStatus::Normal,
                }),
            },
        );

        let starting_balance: u64 = Balances::minimum_balance() + 1000;
        let staker_account: u64 = 1;
        let additional_stake: u64 = Balances::minimum_balance() + 100;

        let _ = Balances::deposit_creating(&staker_account, starting_balance);

        let total_staked = StakePool::increase_stake(&100, &staker_account, additional_stake)
            .ok()
            .unwrap();
        assert_eq!(total_staked, starting_stake + additional_stake);

        assert_eq!(
            Balances::free_balance(&staker_account),
            starting_balance - additional_stake
        );

        assert_eq!(
            StakePool::staking_fund_balance(),
            starting_pool_stake + additional_stake
        );

        assert_eq!(
            StakePool::stakes(&100),
            Stake {
                created: 0,
                staking_status: StakingStatus::Staked(StakedState {
                    staked_amount: starting_stake + additional_stake,
                    ongoing_slashes: BTreeMap::new(),
                    staked_status: StakedStatus::Normal,
                })
            }
        );
    });
}
