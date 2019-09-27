#![cfg(test)]

use super::*;
use crate::mock::*;
use runtime_io::with_externalities;
use srml_support::assert_err;

#[test]
fn stake_pool_works() {
    with_externalities(&mut build_test_externalities(), || {
        // using deposit_creating
        assert_eq!(Balances::total_issuance(), 0);
        assert_eq!(StakePool::staking_fund_balance(), 0);

        // minimum balance (existential deposit) feature applies to stake pool
        if Balances::minimum_balance() > 0 {
            let pos_imbalance = Balances::deposit_creating(
                &StakePool::staking_fund_account_id(),
                Balances::minimum_balance() - 1,
            );
            assert_eq!(pos_imbalance.peek(), 0);
            assert_eq!(Balances::total_issuance(), 0);
            assert_eq!(StakePool::staking_fund_balance(), 0);
        }

        let starting_pool_balance = Balances::minimum_balance() + 1000;
        let _ = Balances::deposit_creating(
            &StakePool::staking_fund_account_id(),
            starting_pool_balance,
        );
        assert_eq!(Balances::total_issuance(), starting_pool_balance);
        assert_eq!(StakePool::staking_fund_balance(), starting_pool_balance);

        let staker_starting_balance = Balances::minimum_balance() + 1000;
        // using move_funds_into_pool_from_account()
        let _ = Balances::deposit_creating(&1, staker_starting_balance);
        assert_eq!(
            Balances::total_issuance(),
            starting_pool_balance + staker_starting_balance
        );

        let funds = 100;

        assert!(StakePool::move_funds_into_pool_from_account(&1, funds).is_ok());

        // total issuance unchanged after movement of funds
        assert_eq!(
            Balances::total_issuance(),
            starting_pool_balance + staker_starting_balance
        );

        // funds moved into stake pool
        assert_eq!(
            StakePool::staking_fund_balance(),
            starting_pool_balance + funds
        );

        // no fees were deducted
        assert_eq!(Balances::free_balance(&1), staker_starting_balance - funds);

        StakePool::withdraw_funds_from_pool_into_account(&1, funds);

        assert_eq!(Balances::free_balance(&1), staker_starting_balance);
        assert_eq!(StakePool::staking_fund_balance(), starting_pool_balance);
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

        let starting_balance: u64 = Balances::minimum_balance();
        let staker_account: u64 = 1;
        let stake_value: u64 = Balances::minimum_balance() + 100;

        let _ = Balances::deposit_creating(&staker_account, starting_balance);

        // can't stake zero
        assert_err!(
            StakePool::stake_from_account(&100, &staker_account, 0),
            StakingError::ChangingStakeByZero
        );

        // must stake more than minimum balance
        assert_err!(
            StakePool::stake_from_account(&100, &staker_account, Balances::minimum_balance()),
            StakingError::StakingLessThanMinimumBalance
        );

        // cannot stake with insufficient funds
        assert_err!(
            StakePool::stake_from_account(&100, &staker_account, stake_value),
            StakingError::InsufficientBalance
        );

        // deposit exact amount to stake
        let _ = Balances::deposit_creating(&staker_account, stake_value);

        assert!(StakePool::stake_from_account(&100, &staker_account, stake_value).is_ok());

        assert_eq!(Balances::free_balance(&staker_account), starting_balance);

        assert_eq!(StakePool::staking_fund_balance(), stake_value);
    });
}

#[test]
fn increasing_stake() {
    with_externalities(&mut build_test_externalities(), || {
        let starting_pool_stake = Balances::minimum_balance() + 5000;
        let _ =
            Balances::deposit_creating(&StakePool::staking_fund_account_id(), starting_pool_stake);

        let starting_stake = Balances::minimum_balance() + 100;
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

        let additional_stake: u64 = 500;
        let starting_balance: u64 = Balances::minimum_balance() + additional_stake;
        let staker_account: u64 = 1;

        let _ = Balances::deposit_creating(&staker_account, starting_balance);

        assert_err!(
            StakePool::increase_stake_from_account(&100, &staker_account, 0),
            StakingError::ChangingStakeByZero
        );

        let total_staked =
            StakePool::increase_stake_from_account(&100, &staker_account, additional_stake)
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

        // cannot increase stake if insufficent balance
        assert!(StakePool::increase_stake_from_account(
            &100,
            &staker_account,
            Balances::free_balance(&staker_account) + 1
        )
        .is_err());
    });
}

#[test]
fn decreasing_stake() {
    with_externalities(&mut build_test_externalities(), || {
        let starting_pool_stake = 5000;
        let _ =
            Balances::deposit_creating(&StakePool::staking_fund_account_id(), starting_pool_stake);

        let starting_stake = Balances::minimum_balance() + 2000;
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

        let starting_balance: u64 = Balances::minimum_balance();
        let staker_account: u64 = 1;
        let decrease_stake_by: u64 = 200;

        let _ = Balances::deposit_creating(&staker_account, starting_balance);

        assert_err!(
            StakePool::decrease_stake(&100, &staker_account, 0),
            StakingError::ChangingStakeByZero
        );

        let total_staked = StakePool::decrease_stake(&100, &staker_account, decrease_stake_by)
            .ok()
            .unwrap();
        assert_eq!(total_staked, starting_stake - decrease_stake_by);

        assert_eq!(
            Balances::free_balance(&staker_account),
            starting_balance + decrease_stake_by
        );

        assert_eq!(
            StakePool::staking_fund_balance(),
            starting_pool_stake - decrease_stake_by
        );

        assert_eq!(
            StakePool::stakes(&100),
            Stake {
                created: 0,
                staking_status: StakingStatus::Staked(StakedState {
                    staked_amount: starting_stake - decrease_stake_by,
                    ongoing_slashes: BTreeMap::new(),
                    staked_status: StakedStatus::Normal,
                })
            }
        );

        // cannot unstake more than total at stake
        assert_err!(
            StakePool::decrease_stake(&100, &staker_account, total_staked + 1),
            StakingError::InsufficientStake
        );

        // decreasing stake to value less than minimum_balance should reduce entire stake
        if Balances::minimum_balance() > 0 {
            let over_minimum = 50;
            let staked_amount = Balances::minimum_balance() + over_minimum;

            let _ =
                Balances::deposit_creating(&StakePool::staking_fund_account_id(), staked_amount);
            <Stakes<Test>>::insert(
                &200,
                Stake {
                    created: 0,
                    staking_status: StakingStatus::Staked(StakedState {
                        staked_amount: staked_amount,
                        ongoing_slashes: BTreeMap::new(),
                        staked_status: StakedStatus::Normal,
                    }),
                },
            );

            assert_eq!(Balances::free_balance(&2), 0);
            let starting_pool_balance = StakePool::staking_fund_balance();
            let remaining_stake = StakePool::decrease_stake(&200, &2, over_minimum + 1)
                .ok()
                .unwrap();
            assert_eq!(remaining_stake, 0);
            assert_eq!(Balances::free_balance(&2), staked_amount);
            assert_eq!(
                StakePool::staking_fund_balance(),
                starting_pool_balance - staked_amount
            );
        }
    });
}

#[test]
fn initiating_pausing_resuming_cancelling_slashes() {
    with_externalities(&mut build_test_externalities(), || {});
}

#[test]
fn initiating_pausing_resuming_unstaking() {
    with_externalities(&mut build_test_externalities(), || {});
}

#[test]
fn slashing_finalization() {
    with_externalities(&mut build_test_externalities(), || {});
}

#[test]
fn unstaking_finalization() {
    with_externalities(&mut build_test_externalities(), || {});
}
