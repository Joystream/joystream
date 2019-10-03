#![cfg(test)]

use super::*;
use crate::mock::*;
use runtime_io::with_externalities;
use srml_support::{assert_err, assert_ok};

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
        // using transfer_funds_from_account_into_pool()
        let _ = Balances::deposit_creating(&1, staker_starting_balance);
        assert_eq!(
            Balances::total_issuance(),
            starting_pool_balance + staker_starting_balance
        );

        let funds = 100;

        assert_ok!(StakePool::transfer_funds_from_account_into_pool(&1, funds));

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

        StakePool::transfer_funds_from_pool_into_account(&1, funds);

        assert_eq!(Balances::free_balance(&1), staker_starting_balance);
        assert_eq!(StakePool::staking_fund_balance(), starting_pool_balance);
    });
}

#[test]
fn create_stake() {
    with_externalities(&mut build_test_externalities(), || {
        let stake_id = StakePool::create_stake();
        assert_eq!(stake_id, 0);
        assert!(<Stakes<Test>>::exists(&stake_id));

        assert_eq!(StakePool::stakes_created(), stake_id + 1);

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
            StakeActionError::Error(StakingFromAccountError::StakingError(
                StakingError::CannotStakeZero
            ))
        );

        // must stake at least the minimum balance
        if Balances::minimum_balance() > 0 {
            assert_err!(
                StakePool::stake_from_account(
                    &100,
                    &staker_account,
                    Balances::minimum_balance() - 1
                ),
                StakeActionError::Error(StakingFromAccountError::StakingError(
                    StakingError::CannotStakeLessThanMinimumBalance
                ))
            );
        }

        // cannot stake with insufficient funds
        assert_err!(
            StakePool::stake_from_account(&100, &staker_account, stake_value),
            StakeActionError::Error(StakingFromAccountError::InsufficientBalanceInSourceAccount)
        );

        // deposit exact amount to stake
        let _ = Balances::deposit_creating(&staker_account, stake_value);

        assert_ok!(StakePool::stake_from_account(
            &100,
            &staker_account,
            stake_value
        ));

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
                    next_slash_id: 0,
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
            StakeActionError::Error(IncreasingStakeFromAccountError::IncreasingStakeError(
                IncreasingStakeError::CannotChangeStakeByZero
            ))
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
                    next_slash_id: 0,
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
                    next_slash_id: 0,
                    staked_status: StakedStatus::Normal,
                }),
            },
        );

        let starting_balance: u64 = Balances::minimum_balance();
        let staker_account: u64 = 1;
        let decrease_stake_by: u64 = 200;

        let _ = Balances::deposit_creating(&staker_account, starting_balance);

        assert_err!(
            StakePool::decrease_stake_to_account(&100, &staker_account, 0),
            StakeActionError::Error(DecreasingStakeError::CannotChangeStakeByZero)
        );

        let total_staked =
            StakePool::decrease_stake_to_account(&100, &staker_account, decrease_stake_by)
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
                    next_slash_id: 0,
                    staked_status: StakedStatus::Normal,
                })
            }
        );

        // cannot unstake more than total at stake
        assert_err!(
            StakePool::decrease_stake_to_account(&100, &staker_account, total_staked + 1),
            StakeActionError::Error(DecreasingStakeError::InsufficientStake)
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
                        next_slash_id: 0,
                        staked_status: StakedStatus::Normal,
                    }),
                },
            );

            assert_eq!(Balances::free_balance(&2), 0);
            let starting_pool_balance = StakePool::staking_fund_balance();
            let remaining_stake = StakePool::decrease_stake_to_account(&200, &2, over_minimum + 1)
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
    with_externalities(&mut build_test_externalities(), || {
        let staked_amount = Balances::minimum_balance() + 10000;
        let _ = Balances::deposit_creating(&StakePool::staking_fund_account_id(), staked_amount);

        assert_err!(
            StakePool::initiate_slashing(&100, 5000, 0),
            StakeActionError::StakeNotFound
        );

        let stake_id = StakePool::create_stake();
        <Stakes<Test>>::insert(
            &stake_id,
            Stake {
                created: System::block_number(),
                staking_status: StakingStatus::NotStaked,
            },
        );

        assert_err!(
            StakePool::initiate_slashing(&stake_id, 5000, 0),
            StakeActionError::Error(InitiateSlashingError::SlashPeriodShouldBeGreaterThanZero)
        );

        assert_err!(
            StakePool::initiate_slashing(&stake_id, 5000, 1),
            StakeActionError::Error(InitiateSlashingError::NotStaked)
        );

        <Stakes<Test>>::insert(
            &stake_id,
            Stake {
                created: System::block_number(),
                staking_status: StakingStatus::Staked(StakedState {
                    staked_amount: staked_amount,
                    ongoing_slashes: BTreeMap::new(),
                    next_slash_id: 0,
                    staked_status: StakedStatus::Unstaking(UnstakingState {
                        started_at_block: 0,
                        blocks_remaining_in_active_period_for_unstaking: 100,
                        is_active: true,
                    }),
                }),
            },
        );

        // assert_err!(StakePool::initiate_slashing(&stake_id, 0, 0), StakingError::ZeroSlashing);

        let mut slash_id = 0;
        assert!(StakePool::initiate_slashing(&stake_id, 5000, 10).is_ok());

        let mut expected_ongoing_slashes: fixtures::OngoingSlashes = BTreeMap::new();

        expected_ongoing_slashes.insert(
            slash_id,
            Slash {
                started_at_block: System::block_number(),
                is_active: true,
                blocks_remaining_in_active_period_for_slashing: 10,
                slash_amount: 5000,
            },
        );

        assert_eq!(
            StakePool::stakes(&stake_id),
            Stake {
                created: System::block_number(),
                staking_status: StakingStatus::Staked(StakedState {
                    staked_amount: staked_amount,
                    ongoing_slashes: expected_ongoing_slashes.clone(),
                    next_slash_id: slash_id + 1,
                    staked_status: StakedStatus::Unstaking(UnstakingState {
                        started_at_block: 0,
                        blocks_remaining_in_active_period_for_unstaking: 100,
                        is_active: false,
                    }),
                })
            }
        );

        assert_err!(
            StakePool::pause_slashing(&stake_id, &999),
            StakeActionError::Error(PauseSlashingError::SlashNotFound)
        );
        assert_err!(
            StakePool::pause_slashing(&999, &slash_id),
            StakeActionError::StakeNotFound
        );

        assert_ok!(StakePool::pause_slashing(&stake_id, &slash_id));
        expected_ongoing_slashes.insert(
            slash_id,
            Slash {
                started_at_block: System::block_number(),
                is_active: false,
                blocks_remaining_in_active_period_for_slashing: 10,
                slash_amount: 5000,
            },
        );
        assert_eq!(
            StakePool::stakes(&stake_id),
            Stake {
                created: System::block_number(),
                staking_status: StakingStatus::Staked(StakedState {
                    staked_amount: staked_amount,
                    ongoing_slashes: expected_ongoing_slashes.clone(),
                    next_slash_id: slash_id + 1,
                    staked_status: StakedStatus::Unstaking(UnstakingState {
                        started_at_block: 0,
                        blocks_remaining_in_active_period_for_unstaking: 100,
                        is_active: false,
                    }),
                })
            }
        );

        assert_err!(
            StakePool::resume_slashing(&stake_id, &999),
            StakeActionError::Error(ResumeSlashingError::SlashNotFound)
        );
        assert_err!(
            StakePool::resume_slashing(&999, &slash_id),
            StakeActionError::StakeNotFound
        );

        assert_ok!(StakePool::resume_slashing(&stake_id, &slash_id));
        expected_ongoing_slashes.insert(
            slash_id,
            Slash {
                started_at_block: System::block_number(),
                is_active: true,
                blocks_remaining_in_active_period_for_slashing: 10,
                slash_amount: 5000,
            },
        );
        assert_eq!(
            StakePool::stakes(&stake_id),
            Stake {
                created: System::block_number(),
                staking_status: StakingStatus::Staked(StakedState {
                    staked_amount: staked_amount,
                    ongoing_slashes: expected_ongoing_slashes.clone(),
                    next_slash_id: slash_id + 1,
                    staked_status: StakedStatus::Unstaking(UnstakingState {
                        started_at_block: 0,
                        blocks_remaining_in_active_period_for_unstaking: 100,
                        is_active: false,
                    }),
                })
            }
        );

        assert_err!(
            StakePool::cancel_slashing(&stake_id, &999),
            StakeActionError::Error(CancelSlashingError::SlashNotFound)
        );
        assert_err!(
            StakePool::cancel_slashing(&999, &slash_id),
            StakeActionError::StakeNotFound
        );

        assert_ok!(StakePool::cancel_slashing(&stake_id, &slash_id));
        assert_eq!(
            StakePool::stakes(&stake_id),
            Stake {
                created: System::block_number(),
                staking_status: StakingStatus::Staked(StakedState {
                    staked_amount: staked_amount,
                    ongoing_slashes: BTreeMap::new(),
                    next_slash_id: slash_id + 1,
                    staked_status: StakedStatus::Unstaking(UnstakingState {
                        started_at_block: 0,
                        blocks_remaining_in_active_period_for_unstaking: 100,
                        is_active: true,
                    }),
                })
            }
        );

        expected_ongoing_slashes = BTreeMap::new();
        let slashing_amount = 5000;
        slash_id += 1;
        assert!(StakePool::initiate_slashing(&stake_id, slashing_amount, 2).is_ok());

        StakePool::finalize_slashing_and_unstaking();
        expected_ongoing_slashes.insert(
            slash_id,
            Slash {
                started_at_block: System::block_number(),
                is_active: true,
                blocks_remaining_in_active_period_for_slashing: 1,
                slash_amount: slashing_amount,
            },
        );
        assert_eq!(
            StakePool::stakes(&stake_id),
            Stake {
                created: System::block_number(),
                staking_status: StakingStatus::Staked(StakedState {
                    staked_amount: staked_amount,
                    ongoing_slashes: expected_ongoing_slashes.clone(),
                    next_slash_id: slash_id + 1,
                    staked_status: StakedStatus::Unstaking(UnstakingState {
                        started_at_block: 0,
                        blocks_remaining_in_active_period_for_unstaking: 100,
                        is_active: false,
                    }),
                })
            }
        );

        StakePool::finalize_slashing_and_unstaking();
        assert_eq!(
            StakePool::stakes(&stake_id),
            Stake {
                created: System::block_number(),
                staking_status: StakingStatus::Staked(StakedState {
                    staked_amount: staked_amount - slashing_amount,
                    ongoing_slashes: BTreeMap::new(),
                    next_slash_id: slash_id + 1,
                    staked_status: StakedStatus::Unstaking(UnstakingState {
                        started_at_block: 0,
                        blocks_remaining_in_active_period_for_unstaking: 99,
                        is_active: true
                    })
                })
            }
        );

        assert_eq!(
            StakePool::staking_fund_balance(),
            staked_amount - slashing_amount
        );
    });
}

#[test]
fn initiating_pausing_resuming_unstaking() {
    with_externalities(&mut build_test_externalities(), || {
        let staked_amount = Balances::minimum_balance() + 10000;
        let starting_stake_fund_balance = Balances::minimum_balance() + 3333;

        let _ = Balances::deposit_creating(
            &StakePool::staking_fund_account_id(),
            starting_stake_fund_balance + staked_amount,
        );

        assert_err!(
            StakePool::initiate_unstaking(&100, 1),
            StakeActionError::StakeNotFound
        );

        let stake_id = StakePool::create_stake();
        <Stakes<Test>>::insert(
            &stake_id,
            Stake {
                created: System::block_number(),
                staking_status: StakingStatus::NotStaked,
            },
        );

        assert_err!(
            StakePool::initiate_unstaking(&stake_id, 0),
            StakeActionError::Error(InitiateUnstakingError::UnstakingPeriodShouldBeGreaterThanZero)
        );

        assert_err!(
            StakePool::initiate_unstaking(&stake_id, 1),
            StakeActionError::Error(InitiateUnstakingError::NotStaked)
        );

        let mut ongoing_slashes = BTreeMap::new();
        ongoing_slashes.insert(
            1,
            Slash {
                started_at_block: System::block_number(),
                is_active: true,
                blocks_remaining_in_active_period_for_slashing: 100,
                slash_amount: 100,
            },
        );

        <Stakes<Test>>::insert(
            &stake_id,
            Stake {
                created: System::block_number(),
                staking_status: StakingStatus::Staked(StakedState {
                    staked_amount,
                    ongoing_slashes,
                    next_slash_id: 2,
                    staked_status: StakedStatus::Normal,
                }),
            },
        );

        assert_err!(
            StakePool::initiate_unstaking(&stake_id, 1),
            StakeActionError::Error(InitiateUnstakingError::CannotUnstakeWhileSlashesOngoing)
        );

        assert_ok!(StakePool::cancel_slashing(&stake_id, &1));

        assert_ok!(StakePool::initiate_unstaking(&stake_id, 2));

        assert_eq!(
            StakePool::stakes(&stake_id),
            Stake {
                created: System::block_number(),
                staking_status: StakingStatus::Staked(StakedState {
                    staked_amount,
                    ongoing_slashes: BTreeMap::new(),
                    next_slash_id: 2,
                    staked_status: StakedStatus::Unstaking(UnstakingState {
                        started_at_block: System::block_number(),
                        blocks_remaining_in_active_period_for_unstaking: 2,
                        is_active: true
                    })
                })
            }
        );

        StakePool::finalize_slashing_and_unstaking();
        assert_eq!(
            StakePool::stakes(&stake_id),
            Stake {
                created: System::block_number(),
                staking_status: StakingStatus::Staked(StakedState {
                    staked_amount,
                    ongoing_slashes: BTreeMap::new(),
                    next_slash_id: 2,
                    staked_status: StakedStatus::Unstaking(UnstakingState {
                        started_at_block: System::block_number(),
                        blocks_remaining_in_active_period_for_unstaking: 1,
                        is_active: true
                    })
                })
            }
        );

        StakePool::finalize_slashing_and_unstaking();
        assert_eq!(
            StakePool::stakes(&stake_id),
            Stake {
                created: System::block_number(),
                staking_status: StakingStatus::NotStaked
            }
        );

        assert_eq!(
            StakePool::staking_fund_balance(),
            starting_stake_fund_balance
        );
        assert_eq!(Balances::total_issuance(), starting_stake_fund_balance);
    });
}
