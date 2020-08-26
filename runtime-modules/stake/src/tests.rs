#![cfg(test)]

use super::*;
use crate::mock::*;
use frame_support::traits::OnFinalize;
use frame_support::{assert_err, assert_ok};

#[test]
fn stake_pool_works() {
    build_test_externalities().execute_with(|| {
        // using deposit_creating
        assert_eq!(Balances::total_issuance(), 0);
        assert_eq!(StakePool::stake_pool_balance(), 0);

        // minimum balance (existential deposit) feature applies to stake pool
        if Balances::minimum_balance() > 0 {
            let pos_imbalance = Balances::deposit_creating(
                &StakePool::stake_pool_account_id(),
                Balances::minimum_balance() - 1,
            );
            assert_eq!(pos_imbalance.peek(), 0);
            assert_eq!(Balances::total_issuance(), 0);
            assert_eq!(StakePool::stake_pool_balance(), 0);
        }

        let starting_pool_balance = Balances::minimum_balance() + 1000;
        let _ =
            Balances::deposit_creating(&StakePool::stake_pool_account_id(), starting_pool_balance);
        assert_eq!(Balances::total_issuance(), starting_pool_balance);
        assert_eq!(StakePool::stake_pool_balance(), starting_pool_balance);

        let staker_starting_balance = Balances::minimum_balance() + 1000;
        // using transfer_funds_from_account_into_pool()
        let _ = Balances::deposit_creating(&1, staker_starting_balance);
        assert_eq!(
            Balances::total_issuance(),
            starting_pool_balance + staker_starting_balance
        );

        let funds = 100;

        assert_ok!(StakePool::transfer_funds_from_account_into_stake_pool(
            &1, funds
        ));

        // total issuance unchanged after movement of funds
        assert_eq!(
            Balances::total_issuance(),
            starting_pool_balance + staker_starting_balance
        );

        // funds moved into stake pool
        assert_eq!(
            StakePool::stake_pool_balance(),
            starting_pool_balance + funds
        );

        // no fees were deducted
        assert_eq!(Balances::free_balance(&1), staker_starting_balance - funds);

        StakePool::transfer_funds_from_pool_into_account(&1, funds);

        assert_eq!(Balances::free_balance(&1), staker_starting_balance);
        assert_eq!(StakePool::stake_pool_balance(), starting_pool_balance);
    });
}

#[test]
fn create_stake() {
    build_test_externalities().execute_with(|| {
        let stake_id = StakePool::create_stake();
        assert_eq!(stake_id, 0);
        assert!(<Stakes<Test>>::contains_key(&stake_id));

        assert_eq!(StakePool::stakes_created(), stake_id + 1);

        // Should be NotStaked
        let stake = StakePool::stakes(&stake_id);
        assert_eq!(stake.staking_status, StakingStatus::NotStaked);
    });
}

#[test]
fn remove_stake_in_not_staked_state() {
    build_test_externalities().execute_with(|| {
        <Stakes<Test>>::insert(
            &100,
            Stake {
                created: 0,
                staking_status: StakingStatus::NotStaked,
            },
        );
        assert_ok!(StakePool::remove_stake(&100));
        assert!(!<Stakes<Test>>::contains_key(&100));

        // when status is Staked, removing should fail
        <Stakes<Test>>::insert(
            &200,
            Stake {
                created: 0,
                staking_status: StakingStatus::Staked(Default::default()),
            },
        );

        assert_err!(
            StakePool::remove_stake(&200),
            StakeActionError::Error(StakingError::AlreadyStaked)
        );
        assert!(<Stakes<Test>>::contains_key(&200));
    });
}

#[test]
fn enter_staked_state() {
    build_test_externalities().execute_with(|| {
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

        assert_eq!(StakePool::stake_pool_balance(), stake_value);
    });
}

#[test]
fn increasing_stake() {
    build_test_externalities().execute_with(|| {
        let starting_pool_stake = Balances::minimum_balance() + 5000;
        let _ =
            Balances::deposit_creating(&StakePool::stake_pool_account_id(), starting_pool_stake);

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
            StakePool::stake_pool_balance(),
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
    build_test_externalities().execute_with(|| {
        let starting_pool_stake = 5000;
        let _ =
            Balances::deposit_creating(&StakePool::stake_pool_account_id(), starting_pool_stake);

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
            StakePool::stake_pool_balance(),
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

            let _ = Balances::deposit_creating(&StakePool::stake_pool_account_id(), staked_amount);
            <Stakes<Test>>::insert(
                &200,
                Stake {
                    created: 0,
                    staking_status: StakingStatus::Staked(StakedState {
                        staked_amount,
                        ongoing_slashes: BTreeMap::new(),
                        next_slash_id: 0,
                        staked_status: StakedStatus::Normal,
                    }),
                },
            );

            assert_eq!(Balances::free_balance(&2), 0);
            let starting_pool_balance = StakePool::stake_pool_balance();
            let remaining_stake = StakePool::decrease_stake_to_account(&200, &2, over_minimum + 1)
                .ok()
                .unwrap();
            assert_eq!(remaining_stake, 0);
            assert_eq!(Balances::free_balance(&2), staked_amount);
            assert_eq!(
                StakePool::stake_pool_balance(),
                starting_pool_balance - staked_amount
            );
        }
    });
}

#[test]
fn initiating_pausing_resuming_cancelling_slashes() {
    build_test_externalities().execute_with(|| {
        let staked_amount = Balances::minimum_balance() + 10000;
        let _ = Balances::deposit_creating(&StakePool::stake_pool_account_id(), staked_amount);

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
                    staked_amount,
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
                    staked_amount,
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
                    staked_amount,
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
                    staked_amount,
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
                    staked_amount,
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

        StakePool::on_finalize(System::block_number());

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
                    staked_amount,
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

        StakePool::on_finalize(System::block_number());
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
            StakePool::stake_pool_balance(),
            staked_amount - slashing_amount
        );
    });
}

#[test]
fn initiating_pausing_resuming_unstaking() {
    build_test_externalities().execute_with(|| {
        let staked_amount = Balances::minimum_balance() + 10000;
        let starting_stake_fund_balance = Balances::minimum_balance() + 3333;

        let _ = Balances::deposit_creating(
            &StakePool::stake_pool_account_id(),
            starting_stake_fund_balance + staked_amount,
        );

        assert_err!(
            StakePool::initiate_unstaking(&100, Some(1)),
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
            StakePool::initiate_unstaking(&stake_id, Some(0)),
            StakeActionError::Error(InitiateUnstakingError::UnstakingPeriodShouldBeGreaterThanZero)
        );

        assert_err!(
            StakePool::initiate_unstaking(&stake_id, Some(1)),
            StakeActionError::Error(InitiateUnstakingError::UnstakingError(
                UnstakingError::NotStaked
            ))
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
            StakePool::initiate_unstaking(&stake_id, Some(1)),
            StakeActionError::Error(InitiateUnstakingError::UnstakingError(
                UnstakingError::CannotUnstakeWhileSlashesOngoing
            ))
        );

        assert_ok!(StakePool::cancel_slashing(&stake_id, &1));

        assert_ok!(StakePool::initiate_unstaking(&stake_id, Some(2)));

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

        StakePool::on_finalize(System::block_number());
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

        assert_eq!(StakePool::stake_pool_balance(), starting_stake_fund_balance);

        // unstaked amount is destroyed by StakingEventsHandler
        assert_eq!(Balances::total_issuance(), starting_stake_fund_balance);
    });
}

#[test]
fn unstake() {
    build_test_externalities().execute_with(|| {
        assert_err!(
            StakePool::initiate_unstaking(&0, None),
            StakeActionError::StakeNotFound
        );

        let staked_amount = Balances::minimum_balance() + 10000;
        let starting_stake_fund_balance = Balances::minimum_balance() + 3333;

        let _ = Balances::deposit_creating(
            &StakePool::stake_pool_account_id(),
            starting_stake_fund_balance + staked_amount,
        );

        let stake_id = StakePool::create_stake();

        assert_err!(
            StakePool::initiate_unstaking(&stake_id, None),
            StakeActionError::Error(InitiateUnstakingError::UnstakingError(
                UnstakingError::NotStaked
            ))
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
                    next_slash_id: 0,
                    staked_status: StakedStatus::Normal,
                }),
            },
        );

        assert_err!(
            StakePool::initiate_unstaking(&stake_id, None),
            StakeActionError::Error(InitiateUnstakingError::UnstakingError(
                UnstakingError::CannotUnstakeWhileSlashesOngoing
            ))
        );

        <Stakes<Test>>::insert(
            &stake_id,
            Stake {
                created: System::block_number(),
                staking_status: StakingStatus::Staked(StakedState {
                    staked_amount,
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

        assert_err!(
            StakePool::initiate_unstaking(&stake_id, None),
            StakeActionError::Error(InitiateUnstakingError::UnstakingError(
                UnstakingError::AlreadyUnstaking
            ))
        );

        <Stakes<Test>>::insert(
            &stake_id,
            Stake {
                created: System::block_number(),
                staking_status: StakingStatus::Staked(StakedState {
                    staked_amount,
                    ongoing_slashes: BTreeMap::new(),
                    next_slash_id: 0,
                    staked_status: StakedStatus::Normal,
                }),
            },
        );

        assert_ok!(StakePool::initiate_unstaking(&stake_id, None));
        assert_eq!(StakePool::stake_pool_balance(), starting_stake_fund_balance);
    });
}

#[test]
fn immediate_slashing_cannot_slash_non_existent_stake() {
    build_test_externalities().execute_with(|| {
        let outcome = StakePool::slash_immediate(&100, 5000, false);
        assert!(outcome.is_err());
        let error = outcome.err().unwrap();
        assert_eq!(error, StakeActionError::StakeNotFound);
    });
}

#[test]
fn immediate_slashing_without_unstaking() {
    build_test_externalities().execute_with(|| {
        const UNSTAKE_POLICY: bool = false;
        let staked_amount = Balances::minimum_balance() + 10000;
        let _ = Balances::deposit_creating(&StakePool::stake_pool_account_id(), staked_amount);

        let stake_id = StakePool::create_stake();
        let created_at = System::block_number();
        let initial_stake_state = Stake {
            created: created_at,
            staking_status: StakingStatus::Staked(StakedState {
                staked_amount,
                staked_status: StakedStatus::Normal,
                next_slash_id: 0,
                ongoing_slashes: BTreeMap::new(),
            }),
        };
        <Stakes<Test>>::insert(&stake_id, initial_stake_state);

        let slash_amount = 5000;

        let outcome = StakePool::slash_immediate(&stake_id, slash_amount, UNSTAKE_POLICY);
        assert!(outcome.is_ok());
        let outcome = outcome.ok().unwrap();

        assert_eq!(outcome.caused_unstake, false);
        assert_eq!(outcome.actually_slashed, slash_amount);
        assert_eq!(outcome.remaining_stake, staked_amount - slash_amount);
        // Default handler destroys imbalance
        assert_eq!(outcome.remaining_imbalance.peek(), 0);

        assert_eq!(
            <Stakes<Test>>::get(stake_id),
            Stake {
                created: created_at,
                staking_status: StakingStatus::Staked(StakedState {
                    staked_amount: outcome.remaining_stake,
                    staked_status: StakedStatus::Normal,
                    next_slash_id: 0,
                    ongoing_slashes: BTreeMap::new()
                }),
            }
        );

        // slash to zero but without asking to unstake
        // Slash and unstake by making slash go to zero
        let slash_amount = outcome.remaining_stake;
        let outcome = StakePool::slash_immediate(&stake_id, slash_amount, UNSTAKE_POLICY)
            .ok()
            .unwrap();
        assert_eq!(outcome.caused_unstake, false);
        assert_eq!(outcome.actually_slashed, slash_amount);
        assert_eq!(outcome.remaining_stake, 0);
        // Default handler destroys imbalance
        assert_eq!(outcome.remaining_imbalance.peek(), 0);

        // Should still be staked, even if staked amount = 0
        assert_eq!(
            <Stakes<Test>>::get(stake_id),
            Stake {
                created: created_at,
                staking_status: StakingStatus::Staked(StakedState {
                    staked_amount: 0,
                    staked_status: StakedStatus::Normal,
                    next_slash_id: 0,
                    ongoing_slashes: BTreeMap::new()
                }),
            }
        );
    });
}

#[test]
fn immediate_slashing_with_unstaking() {
    build_test_externalities().execute_with(|| {
        const UNSTAKE_POLICY: bool = true;
        let staked_amount = Balances::minimum_balance() + 10000;
        let _ = Balances::deposit_creating(&StakePool::stake_pool_account_id(), staked_amount);

        let stake_id = StakePool::create_stake();
        let created_at = System::block_number();
        let initial_stake_state = Stake {
            created: created_at,
            staking_status: StakingStatus::Staked(StakedState {
                staked_amount,
                staked_status: StakedStatus::Normal,
                next_slash_id: 0,
                ongoing_slashes: BTreeMap::new(),
            }),
        };
        <Stakes<Test>>::insert(&stake_id, initial_stake_state);

        // Slash whole amount unstake by making slash go to zero
        let slash_amount = staked_amount;
        let outcome = StakePool::slash_immediate(&stake_id, slash_amount, UNSTAKE_POLICY)
            .ok()
            .unwrap();
        assert_eq!(outcome.caused_unstake, true);
        assert_eq!(outcome.actually_slashed, slash_amount);
        assert_eq!(outcome.remaining_stake, 0);
        // Default handler destroys imbalance
        assert_eq!(outcome.remaining_imbalance.peek(), 0);
        // Should now be unstaked
        assert_eq!(
            <Stakes<Test>>::get(stake_id),
            Stake {
                created: created_at,
                staking_status: StakingStatus::NotStaked
            }
        );
    });
}

#[test]
fn immediate_slashing_cannot_slash_if_not_staked() {
    build_test_externalities().execute_with(|| {
        let stake_id = StakePool::create_stake();
        let created_at = System::block_number();
        let initial_stake_state = Stake {
            created: created_at,
            staking_status: StakingStatus::NotStaked,
        };
        <Stakes<Test>>::insert(&stake_id, initial_stake_state);

        let outcome = StakePool::slash_immediate(&stake_id, 1, false);
        let outcome_err = outcome.err().unwrap();
        assert_eq!(
            outcome_err,
            StakeActionError::Error(ImmediateSlashingError::NotStaked)
        );
    });
}

#[test]
fn immediate_slashing_cannot_slash_zero() {
    build_test_externalities().execute_with(|| {
        let staked_amount = Balances::minimum_balance() + 10000;
        let _ = Balances::deposit_creating(&StakePool::stake_pool_account_id(), staked_amount);

        let stake_id = StakePool::create_stake();
        let created_at = System::block_number();
        let initial_stake_state = Stake {
            created: created_at,
            staking_status: StakingStatus::Staked(StakedState {
                staked_amount,
                staked_status: StakedStatus::Normal,
                next_slash_id: 0,
                ongoing_slashes: BTreeMap::new(),
            }),
        };
        <Stakes<Test>>::insert(&stake_id, initial_stake_state);

        const ZERO_SLASH_AMOUNT: u64 = 0;

        let outcome_err = StakePool::slash_immediate(&stake_id, ZERO_SLASH_AMOUNT, true)
            .err()
            .unwrap();
        assert_eq!(
            outcome_err,
            StakeActionError::Error(ImmediateSlashingError::SlashAmountShouldBeGreaterThanZero)
        );
    });
}
