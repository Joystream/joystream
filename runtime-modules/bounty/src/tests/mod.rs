#![cfg(test)]

pub(crate) mod fixtures;
pub(crate) mod mocks;

use crate::{
    Bounties, BountyActor, BountyCreationParameters, BountyMilestone, BountyRecord, BountyStage,
    Entries, Error, FundingType, OracleJudgment, OracleWorkEntryJudgment, RawEvent,
};
use fixtures::{
    decrease_bounty_account_balance, get_council_budget, get_state_bloat_bond,
    increase_account_balance, increase_total_balance_issuance_using_account_id, run_to_block,
    set_council_budget, AnnounceWorkEntryFixture, CancelBountyFixture, CreateBountyFixture,
    EndWorkPeriodFixture, EventFixture, FundBountyFixture, SubmitJudgmentFixture,
    SubmitWorkFixture, SwitchOracleFixture, TerminateBountyFixture, UnlockWorkEntrantStakeFixture,
    VetoBountyFixture, WithdrawFundingFixture, WithdrawStateBloatBondFixture,
    WithdrawWorkEntrantFundsFixture, DEFAULT_BOUNTY_CHERRY, DEFAULT_BOUNTY_ORACLE_REWARD,
};
use frame_support::storage::StorageMap;
use frame_system::RawOrigin;
use mocks::{
    build_test_externalities, Balances, Bounty, ClosedContractSizeLimit, System, Test,
    COUNCIL_BUDGET_ACCOUNT_ID, STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER,
};
use sp_runtime::DispatchError;
use sp_runtime::Perbill;
use sp_std::collections::btree_map::BTreeMap;

const DEFAULT_WINNER_REWARD: u64 = 10;

#[test]
fn validate_funding_bounty_stage() {
    build_test_externalities().execute_with(|| {
        let created_at = 10;

        // Perpetual funding period
        // No contributions.
        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                ..Default::default()
            },
            milestone: BountyMilestone::Created {
                created_at,
                has_contributions: false,
            },
            ..Default::default()
        };

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::Funding {
                has_contributions: false
            }
        );

        // Has contributions
        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                ..Default::default()
            },
            milestone: BountyMilestone::Created {
                created_at,
                has_contributions: true,
            },
            ..Default::default()
        };

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::Funding {
                has_contributions: true
            }
        );

        // Limited funding period
        let funding_period = 10;

        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                funding_type: FundingType::Limited {
                    funding_period,
                    min_funding_amount: 10,
                    max_funding_amount: 10,
                },
                ..Default::default()
            },
            milestone: BountyMilestone::Created {
                created_at,
                has_contributions: false,
            },
            ..Default::default()
        };

        System::set_block_number(created_at + 1);

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::Funding {
                has_contributions: false
            }
        );

        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                funding_type: FundingType::Limited {
                    funding_period,
                    min_funding_amount: 10,
                    max_funding_amount: 10,
                },
                ..Default::default()
            },
            milestone: BountyMilestone::Created {
                created_at,
                has_contributions: true,
            },
            ..Default::default()
        };

        System::set_block_number(created_at + 2);

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::Funding {
                has_contributions: true
            }
        );
    });
}

#[test]
fn validate_funding_expired_bounty_stage() {
    build_test_externalities().execute_with(|| {
        let created_at = 10;
        let funding_period = 10;

        // Limited funding period
        // No contributions.
        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                funding_type: FundingType::Limited {
                    funding_period,
                    min_funding_amount: 10,
                    max_funding_amount: 10,
                },
                ..Default::default()
            },
            milestone: BountyMilestone::Created {
                created_at,
                has_contributions: false,
            },
            ..Default::default()
        };

        System::set_block_number(created_at + funding_period + 1);

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::FundingExpired
        );
    });
}

#[test]
fn validate_work_submission_bounty_stage() {
    build_test_externalities().execute_with(|| {
        let created_at = 10;
        let funding_period = 10;
        let min_funding_amount = 100;

        // Limited funding period
        let params = BountyCreationParameters::<Test> {
            funding_type: FundingType::Limited {
                funding_period,
                min_funding_amount,
                max_funding_amount: 10,
            },
            ..Default::default()
        };

        let bounty = BountyRecord {
            creation_params: params.clone(),
            milestone: BountyMilestone::Created {
                created_at,
                has_contributions: true,
            },
            total_funding: min_funding_amount,
            ..Default::default()
        };

        System::set_block_number(created_at + funding_period + 1);

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::WorkSubmission
        );

        // Max funding reached.
        let max_funding_reached_at = 30;

        let bounty = BountyRecord {
            creation_params: params,
            milestone: BountyMilestone::BountyMaxFundingReached {
                max_funding_reached_at,
            },
            ..Default::default()
        };

        System::set_block_number(max_funding_reached_at + 1);

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::WorkSubmission
        );
    });
}

#[test]
fn validate_judgment_bounty_stage() {
    build_test_externalities().execute_with(|| {
        let funding_period = 10;
        let min_funding_amount = 100;

        // Work period is not expired.
        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                funding_type: FundingType::Limited {
                    funding_period,
                    min_funding_amount,
                    max_funding_amount: 10,
                },
                ..Default::default()
            },
            milestone: BountyMilestone::WorkSubmitted,
            active_work_entry_count: 1,
            ..Default::default()
        };

        assert_eq!(Bounty::get_bounty_stage(&bounty), BountyStage::Judgment);
    });
}

#[test]
fn validate_successful_withdrawal_bounty_stage() {
    build_test_externalities().execute_with(|| {
        // Judging was submitted.
        let successful_bounty = true;
        let bounty = BountyRecord {
            milestone: BountyMilestone::JudgmentSubmitted { successful_bounty },
            ..Default::default()
        };

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::SuccessfulBountyWithdrawal
        );
    });
}

#[test]
fn validate_failed_withdrawal_bounty_stage() {
    build_test_externalities().execute_with(|| {
        let successful_bounty = false;
        let bounty = BountyRecord {
            milestone: BountyMilestone::JudgmentSubmitted { successful_bounty },
            ..Default::default()
        };

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::FailedBountyWithdrawal
        );
    });
}

#[test]
fn create_bounty_succeeds() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let starting_block = 1;
        run_to_block(starting_block);

        let text = b"Bounty text".to_vec();

        let create_bounty_fixture = CreateBountyFixture::default().with_metadata(text.clone());
        create_bounty_fixture.call_and_assert(Ok(()));

        let bounty_id = 1u64;

        EventFixture::assert_last_crate_event(RawEvent::BountyCreated(
            bounty_id,
            create_bounty_fixture.get_bounty_creation_parameters(),
            text,
        ));
    });
}

#[test]
fn create_bounty_fails_with_invalid_closed_contract() {
    build_test_externalities().execute_with(|| {
        CreateBountyFixture::default()
            .with_closed_contract(Vec::new())
            .call_and_assert(Err(Error::<Test>::ClosedContractMemberListIsEmpty.into()));

        let large_member_id_list: Vec<u64> = (1..(ClosedContractSizeLimit::get() + 10))
            .map(|x| x.into())
            .collect();

        CreateBountyFixture::default()
            .with_closed_contract(large_member_id_list)
            .call_and_assert(Err(Error::<Test>::ClosedContractMemberListIsTooLarge.into()));
    });
}

#[test]
fn create_bounty_fails_with_insufficient_cherry_value() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default()
            .with_cherry(0)
            .call_and_assert(Err(Error::<Test>::CherryLessThenMinimumAllowed.into()));
    });
}

#[test]
fn create_bounty_fails_with_insufficient_oracle_reward_value() {
    build_test_externalities().execute_with(|| {
        CreateBountyFixture::default()
            .with_oracle_reward(0)
            .call_and_assert(Err(Error::<Test>::OracleRewardLessThenMinimumAllowed.into()));
    });
}

#[test]
fn create_bounty_transfers_member_balance_correctly() {
    build_test_externalities().execute_with(|| {
        let member_id = 1;
        let account_id = 1;
        let cherry = 100;
        let oracle_reward = 100;
        let initial_balance = 500;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        // Insufficient member controller account balance.
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id),
            initial_balance - cherry - oracle_reward
        );

        let bounty_id = 1;

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            cherry + oracle_reward
        );
    });
}

#[test]
fn create_bounty_transfers_the_council_balance_correctly() {
    build_test_externalities().execute_with(|| {
        let cherry = 100;
        let oracle_reward = 100;
        let initial_balance = 500;

        set_council_budget(initial_balance);

        // Insufficient member controller account balance.
        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        assert_eq!(
            get_council_budget(),
            initial_balance - cherry - oracle_reward
        );

        let bounty_id = 1;

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            cherry + oracle_reward
        );
    });
}

#[test]
fn create_bounty_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        // For a council bounty.
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(1))
            .call_and_assert(Err(DispatchError::BadOrigin));

        // For a council bounty.
        CreateBountyFixture::default()
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));

        // For a member bounty.
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_creator_member_id(1)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn create_bounty_fails_with_invalid_funding_parameters() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default()
            .with_limited_funding(0, 1, 1)
            .call_and_assert(Err(Error::<Test>::FundingAmountCannotBeZero.into()));

        CreateBountyFixture::default()
            .with_limited_funding(1, 0, 1)
            .call_and_assert(Err(Error::<Test>::FundingAmountCannotBeZero.into()));

        CreateBountyFixture::default()
            .with_limited_funding(1, 1, 0)
            .call_and_assert(Err(Error::<Test>::FundingPeriodCannotBeZero.into()));

        CreateBountyFixture::default()
            .with_perpetual_funding(0)
            .call_and_assert(Err(Error::<Test>::FundingAmountCannotBeZero.into()));

        CreateBountyFixture::default()
            .with_limited_funding(100, 1, 100)
            .call_and_assert(Err(
                Error::<Test>::MinFundingAmountCannotBeGreaterThanMaxAmount.into(),
            ));
    });
}

#[test]
fn create_bounty_fails_with_invalid_entrant_stake() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let invalid_stake = 1;
        CreateBountyFixture::default()
            .with_entrant_stake(invalid_stake)
            .call_and_assert(Err(Error::<Test>::EntrantStakeIsLessThanMininum.into()));
    });
}

#[test]
fn create_bounty_fails_with_insufficient_balances() {
    build_test_externalities().execute_with(|| {
        let member_id = 1;
        let account_id = 1;
        let cherry = 100;
        let oracle_reward = 100;
        // Insufficient council budget.
        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Err(Error::<Test>::InsufficientBalanceForBounty.into()));

        // Insufficient member controller account balance.
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Err(Error::<Test>::InsufficientBalanceForBounty.into()));
    });
}

#[test]
fn cancel_bounty_succeeds_full_test() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let cherry = 100;
        let oracle_reward = 100;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        assert_eq!(
            get_council_budget(),
            initial_balance - cherry - oracle_reward
        );

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(get_council_budget(), initial_balance);

        EventFixture::contains_crate_event(RawEvent::BountyCreatorCherryWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));

        EventFixture::contains_crate_event(RawEvent::BountyCreatorOracleRewardWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));

        EventFixture::contains_crate_event(RawEvent::BountyRemoved(bounty_id));

        EventFixture::assert_last_crate_event(RawEvent::BountyCanceled(
            bounty_id,
            BountyActor::Council,
        ));
    });
}

#[test]
fn cancel_bounty_succeeds_at_funding_expired_stage() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 500;
        let funding_period = 10;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        run_to_block(funding_period + 1);

        // Funding period expired with no contribution.
        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(get_council_budget(), initial_balance);
        EventFixture::contains_crate_event(RawEvent::BountyCreatorCherryWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));

        EventFixture::contains_crate_event(RawEvent::BountyCreatorOracleRewardWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));

        EventFixture::contains_crate_event(RawEvent::BountyRemoved(bounty_id));

        EventFixture::assert_last_crate_event(RawEvent::BountyCanceled(
            bounty_id,
            BountyActor::Council,
        ));
    });
}

#[test]
fn cancel_bounty_by_member_succeeds() {
    build_test_externalities().execute_with(|| {
        let member_id = 1;
        let account_id = 1;
        let initial_balance = 500;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        CancelBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));
    });
}

#[test]
fn cancel_bounty_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        CancelBountyFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn cancel_bounty_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let member_id = 1;
        let account_id = 1;
        let initial_balance = 500;

        increase_account_balance(&account_id, initial_balance);
        set_council_budget(initial_balance);

        // Created by council - try to cancel with bad origin
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;
        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Err(DispatchError::BadOrigin));

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));

        // Created by a member - try to cancel with bad origin
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 2u64;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn cancel_bounty_fails_with_invalid_stage() {
    //WorkSubmission
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        CancelBountyFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedWorkSubmission.into(),
        ));
    });

    //Judgment
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        CancelBountyFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedJudgment.into()));
    });

    //FailedBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(250)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        CancelBountyFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawal.into(),
        ));
    });

    //SuccessfulBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        // Judgment
        let judgment = vec![(
            entry_id,
            OracleWorkEntryJudgment::Winner { reward: min_amount },
        )]
        .iter()
        .cloned()
        .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        CancelBountyFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedSuccessfulBountyWithdrawal.into(),
        ));
    });
}

#[test]
fn cancel_bounty_insufficient_balance_return_cherry_and_oracle_reward_fails() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 200;
        let cherry = 100;
        let oracle_reward = 100;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        assert_eq!(
            get_council_budget(),
            initial_balance - cherry - oracle_reward
        );

        decrease_bounty_account_balance(bounty_id, 1);

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(
                Error::<Test>::NoBountyBalanceToOracleRewardAndCherryWithdrawal.into(),
            ));
    });
}

#[test]
fn veto_bounty_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let cherry = 100;
        let oracle_reward = 100;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        assert_eq!(
            get_council_budget(),
            initial_balance - cherry - oracle_reward
        );

        VetoBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(get_council_budget(), initial_balance);

        EventFixture::contains_crate_event(RawEvent::BountyCreatorCherryWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));
        EventFixture::contains_crate_event(RawEvent::BountyCreatorOracleRewardWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));
        EventFixture::contains_crate_event(RawEvent::BountyRemoved(bounty_id));

        EventFixture::assert_last_crate_event(RawEvent::BountyVetoed(bounty_id));
    });
}

#[test]
fn veto_bounty_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        VetoBountyFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn veto_bounty_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let account_id = 1;

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        VetoBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Err(DispatchError::BadOrigin));

        VetoBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn veto_bounty_fails_with_invalid_stage() {
    //FundingExpired
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 10);

        VetoBountyFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedFundingExpired.into(),
        ));
    });

    //WorkSubmission
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        VetoBountyFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedWorkSubmission.into(),
        ));
    });

    //Judgment
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        VetoBountyFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedJudgment.into()));
    });

    //FailedBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(250)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        VetoBountyFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawal.into(),
        ));
    });

    //SuccessfulBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        // Judgment
        let judgment = vec![(
            entry_id,
            OracleWorkEntryJudgment::Winner { reward: min_amount },
        )]
        .iter()
        .cloned()
        .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        VetoBountyFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedSuccessfulBountyWithdrawal.into(),
        ));
    });
}

#[test]
fn veto_bounty_return_cherry_and_oracle_reward_fails_insufficient_balance() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 200;
        let cherry = 100;
        let oracle_reward = 100;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        assert_eq!(
            get_council_budget(),
            initial_balance - cherry - oracle_reward
        );
        //decrease bounty account by 1, in order too fail balance validation
        decrease_bounty_account_balance(bounty_id, 1);

        VetoBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(
                Error::<Test>::NoBountyBalanceToOracleRewardAndCherryWithdrawal.into(),
            ));
    });
}

#[test]
fn fund_bounty_succeeds_by_member() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;
        let cherry = DEFAULT_BOUNTY_CHERRY;
        let oracle_reward = DEFAULT_BOUNTY_ORACLE_REWARD;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);
        increase_total_balance_issuance_using_account_id(
            COUNCIL_BUDGET_ACCOUNT_ID,
            initial_balance,
        );

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id),
            initial_balance - amount - get_state_bloat_bond()
        );

        assert_eq!(
            crate::Module::<Test>::contribution_by_bounty_by_actor(
                bounty_id,
                BountyActor::Member(member_id)
            )
            .amount,
            amount
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            amount + cherry + oracle_reward + get_state_bloat_bond()
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyFunded(
            bounty_id,
            BountyActor::Member(member_id),
            amount,
        ));
    });
}

#[test]
fn fund_bounty_succeeds_by_council() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;
        let amount = 100;
        let initial_balance = 500;
        let cherry = DEFAULT_BOUNTY_CHERRY;
        let oracle_reward = DEFAULT_BOUNTY_ORACLE_REWARD;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - amount - cherry - oracle_reward - get_state_bloat_bond()
        );

        assert_eq!(
            crate::Module::<Test>::contribution_by_bounty_by_actor(bounty_id, BountyActor::Council)
                .amount,
            amount
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            amount + cherry + oracle_reward + get_state_bloat_bond()
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyFunded(
            bounty_id,
            BountyActor::Council,
            amount,
        ));
    });
}

#[test]
fn fund_bounty_succeeds_with_reaching_max_funding_amount() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 50;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id),
            initial_balance - max_amount - get_state_bloat_bond()
        );

        let bounty = Bounty::bounties(&bounty_id);
        assert_eq!(
            bounty.milestone,
            BountyMilestone::BountyMaxFundingReached {
                max_funding_reached_at: starting_block,
            }
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyMaxFundingReached(bounty_id));
    });
}

#[test]
fn fund_bounty_multiple_contibutors_succeeds() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let max_amount = 5000;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;
        let cherry = DEFAULT_BOUNTY_CHERRY;
        let oracle_reward = DEFAULT_BOUNTY_ORACLE_REWARD;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id),
            initial_balance - 2 * amount - get_state_bloat_bond()
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            2 * amount + cherry + oracle_reward + get_state_bloat_bond()
        );
    });
}

#[test]
fn fund_bounty_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        FundBountyFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn fund_bounty_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(1))
            .with_council()
            .call_and_assert(Err(DispatchError::BadOrigin));

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .with_council()
            .call_and_assert(Err(DispatchError::BadOrigin));

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn fund_bounty_fails_with_insufficient_balance() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let member_id = 1;
        let account_id = 1;
        let amount = 100;

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_amount(amount)
            .call_and_assert(Err(Error::<Test>::InsufficientBalanceForBounty.into()));
    });
}

#[test]
fn fund_bounty_fails_with_zero_amount() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let member_id = 1;
        let account_id = 1;
        let amount = 0;

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_amount(amount)
            .call_and_assert(Err(Error::<Test>::ZeroFundingAmount.into()));
    });
}

#[test]
fn fund_bounty_fails_with_invalid_stage() {
    //FundingExpired
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 10);

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedFundingExpired.into()
            ));
    });

    //WorkSubmission
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedWorkSubmission.into()
            ));
    });

    //Judgment
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedJudgment.into()));
    });

    //FailedBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(250)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawal.into(),
            ));
    });

    //SuccessfulBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        // Judgment
        let judgment = vec![(
            entry_id,
            OracleWorkEntryJudgment::Winner { reward: min_amount },
        )]
        .iter()
        .cloned()
        .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedSuccessfulBountyWithdrawal.into(),
            ));
    });
}

#[test]
fn fund_bounty_fails_with_expired_funding_period() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;
        let funding_period = 10;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_amount(amount)
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedFundingExpired.into()
            ));
    });
}

#[test]
fn end_working_period_with_entries_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let oracle_member_id = 2;
        let worker_member_id = 3;
        let worker_account_id = 3;
        let funding_member_id = 4;
        let funding_account_id = 4;
        let cherry = 200;
        let oracle_reward = 100;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .with_oracle_member_id(oracle_member_id)
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        increase_account_balance(&funding_account_id, initial_balance);

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_origin(RawOrigin::Signed(funding_account_id))
            .with_member_id(funding_member_id)
            .call_and_assert(Ok(()));

        increase_account_balance(&worker_account_id, initial_balance);

        // Winner
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id))
            .with_member_id(worker_member_id)
            .with_staking_account_id(worker_account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id1 = 1;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id))
            .with_member_id(worker_member_id)
            .with_entry_id(entry_id1)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(oracle_member_id.into()))
            .call_and_assert(Ok(()));

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();
        assert_eq!(Bounty::get_bounty_stage(&bounty), BountyStage::Judgment);

        EventFixture::assert_last_crate_event(RawEvent::WorkSubmissionPeriodEnded(
            bounty_id,
            BountyActor::Member(oracle_member_id),
        ));
    });
}

#[test]
fn end_working_period_without_entries_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let oracle_member_id = 2;
        let funding_member_id = 4;
        let funding_account_id = 4;
        let cherry = 200;
        let oracle_reward = 100;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .with_oracle_member_id(oracle_member_id)
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        increase_account_balance(&funding_account_id, initial_balance);

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_origin(RawOrigin::Signed(funding_account_id))
            .with_member_id(funding_member_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(oracle_member_id.into()))
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::WorkSubmissionPeriodEnded(
            bounty_id,
            BountyActor::Member(oracle_member_id),
        ));

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();
        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::FailedBountyWithdrawal
        );
    });
}

#[test]
fn end_working_period_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let oracle_member_id = 2;
        let funding_member_id = 4;
        let funding_account_id = 4;
        let cherry = 200;
        let oracle_reward = 100;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .with_oracle_member_id(oracle_member_id)
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        increase_account_balance(&funding_account_id, initial_balance);

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_origin(RawOrigin::Signed(funding_account_id))
            .with_member_id(funding_member_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(2)
            .with_origin(RawOrigin::Signed(oracle_member_id.into()))
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn end_working_period_without_entries_no_balance_return_oracle_reward_fails() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let oracle_member_id = 2;
        let funding_member_id = 4;
        let funding_account_id = 4;
        let cherry = 200;
        let oracle_reward = 100;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .with_oracle_member_id(oracle_member_id)
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        increase_account_balance(&funding_account_id, initial_balance);

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_origin(RawOrigin::Signed(funding_account_id))
            .with_member_id(funding_member_id)
            .call_and_assert(Ok(()));
        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            max_amount + cherry + oracle_reward + get_state_bloat_bond()
        );
        decrease_bounty_account_balance(
            bounty_id,
            max_amount + cherry + get_state_bloat_bond() + 1,
        );

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(oracle_member_id.into()))
            .call_and_assert(Err(
                Error::<Test>::NoBountyBalanceToOracleRewardWithdrawal.into()
            ));
    });
}

#[test]
fn end_working_period_invalid_stage_fails() {
    //Funding
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        set_council_budget(initial_balance);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        let bounty_id = 1;

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedFunding.into()));
    });
    //FundingExpired
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 10);

        let bounty_id = 1;

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedFundingExpired.into()
            ));
    });

    //Judgment
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedJudgment.into()));
    });

    //FailedBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .call_and_assert(Ok(()));
        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(250)
            .call_and_assert(Ok(()));
        run_to_block(funding_period + 1);
        let bounty_id = 1;
        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawal.into(),
            ));
    });
    //SuccessfulBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        // Judgment
        let judgment = vec![(
            entry_id,
            OracleWorkEntryJudgment::Winner { reward: min_amount },
        )]
        .iter()
        .cloned()
        .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedSuccessfulBountyWithdrawal.into(),
            ));
    });
}

#[test]
fn withdraw_member_funding_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let funding_period = 10;
        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let oracle_member_id = 2;
        let funding_member_id = 4;
        let funding_account_id = 4;
        let cherry = 200;
        let oracle_reward = 100;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .with_oracle_member_id(oracle_member_id)
            .with_max_funding_amount(max_amount)
            .with_limited_funding(max_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        increase_account_balance(&funding_account_id, initial_balance);

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_origin(RawOrigin::Signed(funding_account_id))
            .with_member_id(funding_member_id)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + starting_block + 1);

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(oracle_member_id.into()))
            .call_and_assert(Ok(()));

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();
        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::FailedBountyWithdrawal
        );

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(funding_member_id)
            .with_origin(RawOrigin::Signed(funding_account_id))
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&funding_account_id),
            initial_balance + cherry
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - cherry
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            0
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}

#[test]
fn withdraw_council_funding_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;
        let amount = 100;
        let initial_balance = 500;
        let cherry = 200;
        let funding_period = 10;
        let oracle_member_id = 2;
        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(max_amount, max_amount, funding_period)
            .with_cherry(cherry)
            .with_oracle_member_id(oracle_member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + starting_block + 1);
        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();
        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::FailedBountyWithdrawal
        );
        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            0
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}

#[test]
fn withdraw_member_funding_with_half_cherry() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;
        let amount = 100;
        let account_id1 = 1;
        let member_id1 = 1;
        let account_id2 = 2;
        let member_id2 = 2;
        let initial_balance = 500;
        let cherry = 200;
        let oracle_reward = 200;
        let funding_period = 10;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&account_id1, initial_balance);
        increase_account_balance(&account_id2, initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(max_amount, max_amount, funding_period)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id1))
            .with_member_id(member_id1)
            .with_amount(amount)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id2))
            .with_member_id(member_id2)
            .with_amount(amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + starting_block + 1);

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(member_id1)
            .with_origin(RawOrigin::Signed(account_id1))
            .call_and_assert(Ok(()));

        // A half of the cherry
        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id1),
            initial_balance + cherry / 2
        );

        // On funding amount + creation funding + half of the cherry left.
        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            amount + get_state_bloat_bond() + cherry / 2 + oracle_reward
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyFundingWithdrawal(
            bounty_id,
            BountyActor::Member(member_id1),
        ));
    });
}

#[test]
fn withdraw_member_funding_removes_bounty() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;
        let cherry = 200;
        let funding_period = 10;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&account_id, initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(max_amount, max_amount, funding_period)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_amount(amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + starting_block + 1);

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}

#[test]
fn withdraw_member_funding_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        WithdrawFundingFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn withdraw_member_funding_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(1))
            .with_council()
            .call_and_assert(Err(DispatchError::BadOrigin));

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .with_council()
            .call_and_assert(Err(DispatchError::BadOrigin));

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn withdraw_member_funding_fails_with_invalid_stage() {
    //Funding
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        set_council_budget(initial_balance);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        WithdrawFundingFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedFunding.into()));
    });

    //FundingExpired
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 10);

        WithdrawFundingFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedFundingExpired.into(),
        ));
    });

    //WorkSubmission
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        WithdrawFundingFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedWorkSubmission.into(),
        ));
    });

    //Judgment
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        WithdrawFundingFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedJudgment.into()));
    });

    //SuccessfulBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        // Judgment
        let judgment = vec![(
            entry_id,
            OracleWorkEntryJudgment::Winner { reward: min_amount },
        )]
        .iter()
        .cloned()
        .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        WithdrawFundingFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedSuccessfulBountyWithdrawal.into(),
        ));
    });
}

#[test]
fn withdraw_member_funding_fails_with_invalid_bounty_funder() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;
        let cherry = 200;
        let funding_period = 10;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&account_id, initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(max_amount, max_amount, funding_period)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_amount(amount)
            .call_and_assert(Ok(()));

        // Bounty failed because of the funding period
        run_to_block(starting_block + funding_period + 1);

        let invalid_account_id = 2;
        let invalid_member_id = 2;

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(invalid_member_id)
            .with_origin(RawOrigin::Signed(invalid_account_id))
            .call_and_assert(Err(Error::<Test>::NoBountyContributionFound.into()));
    });
}

#[test]
fn withdraw_member_funding_fails_with_successful_bounty() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let winner_reward = max_amount;
        let entrant_stake = 37;
        let work_period = 1;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let member_id1 = 1;
        let account_id1 = 1;
        increase_account_balance(&account_id1, initial_balance);

        // Winner
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id1))
            .with_member_id(member_id1)
            .with_staking_account_id(account_id1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id1),
            initial_balance - entrant_stake
        );

        let entry_id1 = 1;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id1))
            .with_member_id(member_id1)
            .with_entry_id(entry_id1)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        // Judgment
        let mut judgment = BTreeMap::new();
        judgment.insert(
            entry_id1,
            OracleWorkEntryJudgment::Winner {
                reward: winner_reward,
            },
        );

        run_to_block(starting_block + work_period + 1);

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment)
            .call_and_assert(Ok(()));

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedSuccessfulBountyWithdrawal.into(),
            ));
    });
}

#[test]
fn withdraw_member_funding_return_oracle_cherry_to_creator() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;
        let cherry = 200;
        let oracle_reward = 300;
        let funding_period = 10;
        let bounty_id = 1u64;
        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&account_id, initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_limited_funding(max_amount, max_amount, funding_period)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        //stage Funding { has_contributions: false }

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_amount(amount)
            .call_and_assert(Ok(()));

        //stage Funding { has_contributions: true }

        run_to_block(funding_period + starting_block + 1);

        //stage FailedBountyWithdrawal { judgment_submitted: false }

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        //funder receives initial balance + a cherry fraction (in this case the full cherry)
        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id),
            initial_balance + cherry
        );

        //council receives back the oracle reward but pays cherry to funder
        assert_eq!(
            balances::Module::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - cherry
        );

        //bounty account must be zero
        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            0
        );

        EventFixture::contains_crate_event(RawEvent::BountyCreatorOracleRewardWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}

#[test]
fn withdraw_member_funding_bounty_removal_succeeds() {
    build_test_externalities().execute_with(|| {
        let max_amount = 500;
        let amount = 100;
        let initial_balance = 500;
        let cherry = 100;
        let oracle_reward = 100;
        let account_id = 1;
        let member_id = 1;
        let funding_period = 10;

        increase_account_balance(&account_id, initial_balance);

        // Increment block in order to get Substrate events (no events on block 0).
        let starting_block = 1;
        run_to_block(starting_block);

        // Create bounty
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .with_limited_funding(max_amount, max_amount, funding_period)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        // Member funding
        let funding_account_id1 = 2;
        let funding_member_id1 = 2;
        increase_account_balance(&funding_account_id1, initial_balance);

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_member_id(funding_member_id1)
            .with_origin(RawOrigin::Signed(funding_account_id1))
            .call_and_assert(Ok(()));

        let funding_account_id2 = 3;
        let funding_member_id2 = 3;
        increase_account_balance(&funding_account_id2, initial_balance);

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_member_id(funding_member_id2)
            .with_origin(RawOrigin::Signed(funding_account_id2))
            .call_and_assert(Ok(()));

        let funding_account_id3 = 4;
        let funding_member_id3 = 4;
        increase_account_balance(&funding_account_id3, initial_balance);

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_member_id(funding_member_id3)
            .with_origin(RawOrigin::Signed(funding_account_id3))
            .call_and_assert(Ok(()));

        // Bounty failed because of the funding period
        run_to_block(starting_block + funding_period + 1);

        // Withdraw member funding
        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(funding_member_id1)
            .with_origin(RawOrigin::Signed(funding_account_id1))
            .call_and_assert(Ok(()));

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(funding_member_id2)
            .with_origin(RawOrigin::Signed(funding_account_id2))
            .call_and_assert(Ok(()));

        let cherry_remaining_fraction = cherry - (cherry * 2 / 3) + amount;
        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id))
                - oracle_reward
                - get_state_bloat_bond(),
            cherry_remaining_fraction
        );

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(funding_member_id3)
            .with_origin(RawOrigin::Signed(funding_account_id3))
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id),
            initial_balance - cherry
        );

        // Bounty removal effects.
        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            0
        );

        assert!(!crate::Bounties::<Test>::contains_key(bounty_id));
        assert!(!Bounty::contributions_exist(&bounty_id));

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}

#[test]
fn announce_work_entry_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let member_id = 1;
        let account_id = 1;

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id),
            initial_balance - entrant_stake
        );

        let entry_id = 1;

        EventFixture::assert_last_crate_event(RawEvent::WorkEntryAnnounced(
            entry_id, bounty_id, member_id, account_id,
        ));
    });
}

#[test]
fn announce_work_entry_failed_with_closed_contract() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;

        let closed_contract_member_ids = vec![2, 3];

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_closed_contract(closed_contract_member_ids)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let member_id = 1;
        let account_id = 1;

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(
                Error::<Test>::CannotSubmitWorkToClosedContractBounty.into()
            ));
    });
}

#[test]
fn announce_work_entry_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        AnnounceWorkEntryFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn announce_work_entry_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));

        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn announce_work_entry_fails_with_invalid_stage() {
    //Funding
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        set_council_budget(initial_balance);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        AnnounceWorkEntryFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedFunding.into()));
    });

    //FundingExpired
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 10);

        AnnounceWorkEntryFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedFundingExpired.into(),
        ));
    });

    //Judgment
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        AnnounceWorkEntryFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedJudgment.into()));
    });

    //FailedBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(250)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        AnnounceWorkEntryFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawal.into(),
        ));
    });

    //SuccessfulBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        // Judgment
        let judgment = vec![(
            entry_id,
            OracleWorkEntryJudgment::Winner { reward: min_amount },
        )]
        .iter()
        .cloned()
        .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        AnnounceWorkEntryFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedSuccessfulBountyWithdrawal.into(),
        ));
    });
}

#[test]
fn announce_work_entry_fails_with_invalid_staking_data() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let member_id = 1;
        let account_id = 1;

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InsufficientBalanceForStake.into()));

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER)
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidStakingAccountForMember.into()));

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::ConflictingStakes.into()));
    });
}

#[test]
fn submit_work_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        let member_id = 1;
        let account_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;

        let work_data = b"Work submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::WorkSubmitted(
            bounty_id, entry_id, member_id, work_data,
        ));
    });
}

#[test]
fn submit_work_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        SubmitWorkFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn submit_work_fails_with_invalid_entry_id() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let invalid_entry_id = 11u64;

        SubmitWorkFixture::default()
            .with_bounty_id(bounty_id)
            .with_entry_id(invalid_entry_id)
            .call_and_assert(Err(Error::<Test>::WorkEntryDoesntExist.into()));
    });
}

#[test]
fn submit_work_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        let member_id = 1;
        let account_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;

        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));

        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn submit_work_fails_with_invalid_stage() {
    //Funding
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        set_council_budget(initial_balance);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        SubmitWorkFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedFunding.into()));
    });

    //FundingExpired
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 10);

        SubmitWorkFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedFundingExpired.into(),
        ));
    });

    //Judgment
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        SubmitWorkFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedJudgment.into()));
    });

    //FailedBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(250)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        SubmitWorkFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawal.into(),
        ));
    });

    //SuccessfulBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        // Judgment
        let judgment = vec![(
            entry_id,
            OracleWorkEntryJudgment::Winner { reward: min_amount },
        )]
        .iter()
        .cloned()
        .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        SubmitWorkFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedSuccessfulBountyWithdrawal.into(),
            ));
    });
}

#[test]
fn submit_work_entrant_funds_fails_with_invalid_entry_ownership() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 200;
        let entrant_stake = 37;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let worker_member_id_1 = 1;
        let worker_account_id_1 = 1;
        increase_account_balance(&worker_account_id_1, initial_balance);

        // Winner
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_staking_account_id(worker_account_id_1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&worker_account_id_1),
            initial_balance - entrant_stake
        );

        let entry_id_1 = 1;

        let worker_member_id_2 = 2;
        let worker_account_id_2 = 2;
        increase_account_balance(&worker_account_id_2, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_staking_account_id(worker_account_id_2)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&worker_account_id_2),
            initial_balance - entrant_stake
        );

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_entry_id(entry_id_1)
            .call_and_assert(Err(Error::<Test>::WorkEntryDoesntBelongToWorker.into()));
    });
}

#[test]
fn submit_judgment_by_member_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let oracle_member_id = 5;
        let oracle_account_id = 5;
        let oracle_reward = 10;
        let cherry = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_oracle_member_id(oracle_member_id)
            .with_oracle_reward(oracle_reward)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        assert_eq!(
            Balances::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - oracle_reward - cherry
        );
        assert_eq!(Balances::usable_balance(&oracle_account_id), 0);
        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let work_member_id_1 = 1;
        let work_account_id_1 = 1;
        increase_account_balance(&work_account_id_1, initial_balance);
        //Entry Id is winner
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(work_account_id_1))
            .with_member_id(work_member_id_1)
            .with_staking_account_id(work_account_id_1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id_1 = 1;

        let work_data = b"Work successful submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(work_account_id_1))
            .with_member_id(work_member_id_1)
            .with_entry_id(entry_id_1)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .call_and_assert(Ok(()));

        let mut judgment: OracleJudgment<u64, u64> = BTreeMap::new();

        judgment.insert(
            entry_id_1,
            OracleWorkEntryJudgment::Winner { reward: max_amount },
        );

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        //Cherry returned to creator (council) and oracle gets the oracle reward
        assert_eq!(
            Balances::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - oracle_reward - max_amount - get_state_bloat_bond()
        );
        assert_eq!(Balances::usable_balance(&oracle_account_id), oracle_reward);
        EventFixture::contains_crate_event(RawEvent::BountyCreatorCherryWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));
        EventFixture::contains_crate_event(RawEvent::BountyOracleRewardWithdrawal(
            bounty_id,
            BountyActor::Member(oracle_member_id),
        ));
        EventFixture::assert_last_crate_event(RawEvent::OracleJudgmentSubmitted(
            bounty_id,
            BountyActor::Member(oracle_member_id),
            judgment,
        ));

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();
        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::SuccessfulBountyWithdrawal
        );
    });
}

#[test]
fn submit_judgment_by_council_succeeded_with_complex_judgment() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let oracle_reward = 10;
        let cherry = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_oracle_reward(oracle_reward)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let worker_member_id_1 = 1;
        let worker_account_id_1 = 1;
        increase_account_balance(&worker_account_id_1, initial_balance);
        //Entry Id is winner
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_staking_account_id(worker_account_id_1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id_1 = 1;

        let work_data = b"Work successful submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        let worker_member_id_2 = 2;
        let worker_account_id_2 = 2;
        increase_account_balance(&worker_account_id_2, initial_balance);
        //Entry Id is Rejected (work is submitted)
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_staking_account_id(worker_account_id_2)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id_2 = 2;

        let work_data = b"Work rejected submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_entry_id(entry_id_2)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        let worker_member_id_3 = 3;
        let worker_account_id_3 = 3;
        increase_account_balance(&worker_account_id_3, initial_balance);
        //Entry Id is Rejected (work is not submitted)
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_3))
            .with_member_id(worker_member_id_3)
            .with_staking_account_id(worker_account_id_3)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id_3 = 3;

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let mut judgment: OracleJudgment<u64, u64> = BTreeMap::new();

        judgment.insert(
            entry_id_1,
            OracleWorkEntryJudgment::Winner { reward: max_amount },
        );

        let slashing_share_entry_2 = Perbill::from_percent(50);
        let reason_entry_2 = Some(b"This worker failed a bit and must be slashed 50%".to_vec());
        judgment.insert(
            entry_id_2,
            OracleWorkEntryJudgment::Rejected {
                slashing_share: slashing_share_entry_2,
                action_justification: reason_entry_2,
            },
        );

        let slashing_share_entry_3 = Perbill::from_percent(30);
        let reason_entry_3 = Some(b"This worker failed a bit and must be slashed 30%".to_vec());
        judgment.insert(
            entry_id_3,
            OracleWorkEntryJudgment::Rejected {
                slashing_share: slashing_share_entry_3,
                action_justification: reason_entry_3,
            },
        );

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - max_amount - get_state_bloat_bond()
        );

        assert_eq!(
            Balances::free_balance(&worker_account_id_1),
            initial_balance
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_1),
            initial_balance
        );

        let amount_slashed_entry_2 = slashing_share_entry_2 * entrant_stake;
        assert_eq!(
            Balances::free_balance(&worker_account_id_2),
            initial_balance - amount_slashed_entry_2
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_2),
            initial_balance - amount_slashed_entry_2
        );

        let amount_slashed_entry_3 = slashing_share_entry_3 * entrant_stake;
        assert_eq!(
            Balances::free_balance(&worker_account_id_3),
            initial_balance - amount_slashed_entry_3
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_3),
            initial_balance - amount_slashed_entry_3
        );

        EventFixture::assert_last_crate_event(RawEvent::OracleJudgmentSubmitted(
            bounty_id,
            BountyActor::Council,
            judgment,
        ));

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();
        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::SuccessfulBountyWithdrawal
        );
    });
}

#[test]
fn submit_judgment_by_member_succeeded_with_complex_judgment() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let oracle_member_id = 5;
        let oracle_account_id = 5;
        let oracle_reward = 10;
        let cherry = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_oracle_member_id(oracle_member_id)
            .with_oracle_reward(oracle_reward)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let worker_member_id_1 = 1;
        let worker_account_id_1 = 1;
        increase_account_balance(&worker_account_id_1, initial_balance);
        //Entry Id is winner
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_staking_account_id(worker_account_id_1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id_1 = 1;

        let work_data = b"Work successful submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        let worker_member_id_2 = 2;
        let worker_account_id_2 = 2;
        increase_account_balance(&worker_account_id_2, initial_balance);
        //Entry Id is Rejected (work is submitted)
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_staking_account_id(worker_account_id_2)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id_2 = 2;

        let work_data = b"Work rejected submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_entry_id(entry_id_2)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        let worker_member_id_3 = 3;
        let worker_account_id_3 = 3;
        increase_account_balance(&worker_account_id_3, initial_balance);
        //Entry Id is Rejected (work is not submitted)
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_3))
            .with_member_id(worker_member_id_3)
            .with_staking_account_id(worker_account_id_3)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id_3 = 3;

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .call_and_assert(Ok(()));

        let mut judgment: OracleJudgment<u64, u64> = BTreeMap::new();

        judgment.insert(
            entry_id_1,
            OracleWorkEntryJudgment::Winner { reward: max_amount },
        );

        let slashing_share_entry_2 = Perbill::from_percent(50);
        let reason_entry_2 = Some(b"This worker failed a bit and must be slashed 50%".to_vec());
        judgment.insert(
            entry_id_2,
            OracleWorkEntryJudgment::Rejected {
                slashing_share: slashing_share_entry_2,
                action_justification: reason_entry_2,
            },
        );

        let slashing_share_entry_3 = Perbill::from_percent(30);
        let reason_entry_3 = Some(b"This worker failed a bit and must be slashed 30%".to_vec());
        judgment.insert(
            entry_id_3,
            OracleWorkEntryJudgment::Rejected {
                slashing_share: slashing_share_entry_3,
                action_justification: reason_entry_3,
            },
        );

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - oracle_reward - max_amount - get_state_bloat_bond()
        );
        assert_eq!(Balances::usable_balance(&oracle_account_id), oracle_reward);

        assert_eq!(
            Balances::free_balance(&worker_account_id_1),
            initial_balance
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_1),
            initial_balance
        );

        let amount_slashed_entry_2 = slashing_share_entry_2 * entrant_stake;
        assert_eq!(
            Balances::free_balance(&worker_account_id_2),
            initial_balance - amount_slashed_entry_2
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_2),
            initial_balance - amount_slashed_entry_2
        );

        let amount_slashed_entry_3 = slashing_share_entry_3 * entrant_stake;
        assert_eq!(
            Balances::free_balance(&worker_account_id_3),
            initial_balance - amount_slashed_entry_3
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_3),
            initial_balance - amount_slashed_entry_3
        );

        EventFixture::assert_last_crate_event(RawEvent::OracleJudgmentSubmitted(
            bounty_id,
            BountyActor::Member(oracle_member_id),
            judgment,
        ));

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();
        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::SuccessfulBountyWithdrawal
        );
    });
}

#[test]
fn submit_judgment_dont_return_cherry_on_unsuccessful_bounty() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let reward = 100;
        let entrant_stake = 37;
        let bounty_id = 1;

        let funding_member_id = 2;
        let funding_account_id = 2;

        let worker_member_id = 3;
        let worker_account_id = 3;

        let oracle_member_id = 4;
        let oracle_account_id = 4;

        let oracle_reward = 100;
        let cherry = 50;

        set_council_budget(initial_balance);
        increase_account_balance(&funding_account_id, initial_balance);
        increase_account_balance(&worker_account_id, entrant_stake);

        CreateBountyFixture::default()
            .with_max_funding_amount(reward)
            .with_entrant_stake(entrant_stake)
            .with_oracle_member_id(oracle_member_id)
            .with_oracle_reward(oracle_reward)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(reward)
            .with_member_id(funding_member_id)
            .with_origin(RawOrigin::Signed(funding_account_id))
            .call_and_assert(Ok(()));

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id))
            .with_member_id(worker_member_id)
            .with_staking_account_id(worker_account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;

        let work_data = b"Work submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id))
            .with_member_id(worker_member_id)
            .with_entry_id(entry_id)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .call_and_assert(Ok(()));

        let mut judgment: OracleJudgment<u64, u64> = BTreeMap::new();

        let slashing_share = Perbill::from_percent(0);
        let reason = Some(b"This worker failed but won't be slashed".to_vec());
        judgment.insert(
            entry_id,
            OracleWorkEntryJudgment::Rejected {
                slashing_share: slashing_share,
                action_justification: reason,
            },
        );

        assert!(<Entries<Test>>::contains_key(entry_id));

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        assert!(!<Entries<Test>>::contains_key(entry_id));

        //oracle receives an oracle reward
        assert_eq!(
            balances::Module::<Test>::usable_balance(&oracle_account_id),
            oracle_reward
        );

        //council doesn't receive back the oracle reward nor the cherry
        assert_eq!(
            balances::Module::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - oracle_reward - cherry
        );

        //funder account receives back the reward and a cherry fraction on withdrwal not now
        assert_eq!(
            balances::Module::<Test>::usable_balance(&funding_account_id),
            initial_balance - reward - get_state_bloat_bond()
        );

        //worker account receives his stake now (if not slashed)
        assert_eq!(
            balances::Module::<Test>::usable_balance(&worker_account_id),
            entrant_stake
        );

        //bounty account still has reward and the cherry.
        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            reward + cherry + get_state_bloat_bond()
        );

        EventFixture::contains_crate_event(RawEvent::BountyOracleRewardWithdrawal(
            bounty_id,
            BountyActor::Member(oracle_member_id),
        ));

        EventFixture::assert_last_crate_event(RawEvent::OracleJudgmentSubmitted(
            bounty_id,
            BountyActor::Member(oracle_member_id),
            judgment,
        ));

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();
        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::FailedBountyWithdrawal
        );
    });
}

#[test]
fn submit_judgment_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        SubmitJudgmentFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn submit_judgment_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let member_id = 1;
        let account_id = 1;
        let initial_balance = 500;

        increase_account_balance(&account_id, initial_balance);
        set_council_budget(initial_balance);

        // Oracle is set to a council - try to submit judgment with bad origin
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;
        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Err(DispatchError::BadOrigin));

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));

        // Oracle is set to a member - try to submit judgment with invalid member_id
        CreateBountyFixture::default()
            .with_oracle_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 2u64;

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn submit_judgment_fails_with_invalid_stage() {
    //Funding
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        set_council_budget(initial_balance);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        SubmitJudgmentFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedFunding.into()));
    });

    //FundingExpired
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 10);

        SubmitJudgmentFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedFundingExpired.into(),
        ));
    });

    //FailedBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .call_and_assert(Ok(()));
        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(250)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        SubmitJudgmentFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawal.into(),
        ));
    });

    //WorkSubmission
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);
        SubmitJudgmentFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedWorkSubmission.into(),
        ));
    });

    //SuccessfulBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        // Judgment
        let judgment = vec![(
            entry_id,
            OracleWorkEntryJudgment::Winner { reward: min_amount },
        )]
        .iter()
        .cloned()
        .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        SubmitJudgmentFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedSuccessfulBountyWithdrawal.into(),
        ));
    });
}

#[test]
fn submit_judgment_fails_with_invalid_judgment() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        let member_id = 1;
        let account_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;

        let account_id2 = 2;
        increase_account_balance(&account_id2, initial_balance);
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id2)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id2 = 2;

        let work_data = b"Work submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        // Invalid entry_id
        let invalid_entry_id = 1111u64;
        let judgment = vec![invalid_entry_id]
            .iter()
            .map(|entry_id| {
                (
                    *entry_id,
                    OracleWorkEntryJudgment::Winner {
                        reward: DEFAULT_WINNER_REWARD,
                    },
                )
            })
            .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment)
            .call_and_assert(Err(Error::<Test>::WorkEntryDoesntExist.into()));

        // Zero reward for winners.
        let invalid_reward = 0;
        let judgment = vec![entry_id]
            .iter()
            .map(|entry_id| {
                (
                    *entry_id,
                    OracleWorkEntryJudgment::Winner {
                        reward: invalid_reward,
                    },
                )
            })
            .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment)
            .call_and_assert(Err(Error::<Test>::ZeroWinnerReward.into()));

        // Winner reward is not equal to the total bounty funding.
        let invalid_reward = max_amount * 2;
        let judgment = vec![entry_id]
            .iter()
            .map(|entry_id| {
                (
                    *entry_id,
                    OracleWorkEntryJudgment::Winner {
                        reward: invalid_reward,
                    },
                )
            })
            .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment)
            .call_and_assert(Err(
                Error::<Test>::TotalRewardShouldBeEqualToTotalFunding.into()
            ));

        // No work submission for a winner.
        let winner_reward = max_amount;
        let judgment = vec![entry_id2]
            .iter()
            .map(|entry_id| {
                (
                    *entry_id,
                    OracleWorkEntryJudgment::Winner {
                        reward: winner_reward,
                    },
                )
            })
            .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment)
            .call_and_assert(Err(Error::<Test>::WinnerShouldHasWorkSubmission.into()));
    });
}

#[test]
fn submit_judgment_fails_insufficient_balance() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let reward = 100;
        let entrant_stake = 37;
        let bounty_id = 1;

        let funding_member_id = 2;
        let funding_account_id = 2;

        let worker_member_id = 3;
        let worker_account_id = 3;

        let oracle_member_id = 4;
        let oracle_account_id = 4;

        let oracle_reward = 100;
        let cherry = 50;

        set_council_budget(initial_balance);
        increase_account_balance(&funding_account_id, initial_balance);
        increase_account_balance(&worker_account_id, entrant_stake);

        CreateBountyFixture::default()
            .with_max_funding_amount(reward)
            .with_entrant_stake(entrant_stake)
            .with_oracle_member_id(oracle_member_id)
            .with_oracle_reward(oracle_reward)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(reward)
            .with_member_id(funding_member_id)
            .with_origin(RawOrigin::Signed(funding_account_id))
            .call_and_assert(Ok(()));

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id))
            .with_member_id(worker_member_id)
            .with_staking_account_id(worker_account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;

        let work_data = b"Work submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id))
            .with_member_id(worker_member_id)
            .with_entry_id(entry_id)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .call_and_assert(Ok(()));

        let judgment = vec![entry_id]
            .iter()
            .map(|entry_id| {
                (
                    *entry_id,
                    OracleWorkEntryJudgment::Winner { reward: reward },
                )
            })
            .collect::<BTreeMap<_, _>>();

        //bounty account 250 - 151 -> 49 >= 50 -> false
        decrease_bounty_account_balance(bounty_id, 151);

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .with_judgment(judgment.clone())
            .call_and_assert(Err(
                Error::<Test>::NoBountyBalanceToOracleRewardAndCherryWithdrawal.into(),
            ));
    });
}

#[test]
fn withdraw_work_entrant_funds_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let winner_reward = max_amount;
        let entrant_stake = 37;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let member_id1 = 1;
        let account_id1 = 1;
        increase_account_balance(&account_id1, initial_balance);

        // Winner
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id1))
            .with_member_id(member_id1)
            .with_staking_account_id(account_id1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id1),
            initial_balance - entrant_stake
        );

        let entry_id1 = 1;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id1))
            .with_member_id(member_id1)
            .with_entry_id(entry_id1)
            .call_and_assert(Ok(()));

        // Legitimate participant
        let member_id2 = 2;
        let account_id2 = 2;
        increase_account_balance(&account_id2, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id2))
            .with_member_id(member_id2)
            .with_staking_account_id(account_id2)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id2),
            initial_balance - entrant_stake
        );

        let entry_id2 = 2;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id2))
            .with_member_id(member_id2)
            .with_entry_id(entry_id2)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        // Judgment
        let mut judgment = BTreeMap::new();
        judgment.insert(
            entry_id1,
            OracleWorkEntryJudgment::Winner {
                reward: winner_reward,
            },
        );

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment)
            .call_and_assert(Ok(()));

        // Withdraw work entrant.
        WithdrawWorkEntrantFundsFixture::default()
            .with_origin(RawOrigin::Signed(account_id1))
            .with_member_id(member_id1)
            .with_entry_id(entry_id1)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id1),
            initial_balance + winner_reward
        );

        EventFixture::assert_last_crate_event(RawEvent::WorkEntrantFundsWithdrawn(
            bounty_id, entry_id1, member_id1,
        ));

        // Bounty exists before the last withdrawal call.
        assert!(<Bounties<Test>>::contains_key(bounty_id));

        WithdrawWorkEntrantFundsFixture::default()
            .with_origin(RawOrigin::Signed(account_id2))
            .with_member_id(member_id2)
            .with_entry_id(entry_id2)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id2),
            initial_balance - entrant_stake
        );

        EventFixture::contains_crate_event(RawEvent::WorkEntrantFundsWithdrawn(
            bounty_id, entry_id2, member_id2,
        ));

        assert!(<Bounties<Test>>::contains_key(bounty_id));
    });
}

#[test]
fn withdraw_work_entrant_funds_on_judgment_fails_insufficient_balance() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let reward = 100;
        let entrant_stake = 37;
        let bounty_id = 1;

        let funding_member_id = 2;
        let funding_account_id = 2;

        let worker_member_id = 3;
        let worker_account_id = 3;

        let oracle_reward = 100;
        let cherry = 50;

        set_council_budget(initial_balance);
        increase_account_balance(&funding_account_id, initial_balance);
        increase_account_balance(&worker_account_id, entrant_stake);

        CreateBountyFixture::default()
            .with_max_funding_amount(reward)
            .with_entrant_stake(entrant_stake)
            .with_oracle_reward(oracle_reward)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(reward)
            .with_member_id(funding_member_id)
            .with_origin(RawOrigin::Signed(funding_account_id))
            .call_and_assert(Ok(()));

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id))
            .with_member_id(worker_member_id)
            .with_staking_account_id(worker_account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;

        let work_data = b"Work submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id))
            .with_member_id(worker_member_id)
            .with_entry_id(entry_id)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        // Judgment
        let mut judgment = BTreeMap::new();
        judgment.insert(entry_id, OracleWorkEntryJudgment::Winner { reward: reward });

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment)
            .call_and_assert(Ok(()));

        //bounty account 100 - 1 -> 99 >= 100 -> false
        decrease_bounty_account_balance(bounty_id, oracle_reward + cherry + 1);

        WithdrawWorkEntrantFundsFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id))
            .with_member_id(worker_member_id)
            .with_entry_id(entry_id)
            .call_and_assert(Err(balances::Error::<Test, _>::InsufficientBalance.into()));
    });
}

#[test]
fn withdraw_work_entrant_funds_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        WithdrawWorkEntrantFundsFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn withdraw_work_entrant_funds_fails_with_invalid_entry_id() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let winner_reward = max_amount;
        let entrant_stake = 37;
        let work_period = 1;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let member_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, initial_balance);

        // Winner
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        // Judgment
        let mut judgment = BTreeMap::new();
        judgment.insert(
            entry_id,
            OracleWorkEntryJudgment::Winner {
                reward: winner_reward,
            },
        );

        run_to_block(starting_block + work_period + 1);

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment)
            .call_and_assert(Ok(()));

        let invalid_entry_id = 11u64;

        WithdrawWorkEntrantFundsFixture::default()
            .with_bounty_id(bounty_id)
            .with_entry_id(invalid_entry_id)
            .call_and_assert(Err(Error::<Test>::WorkEntryDoesntExist.into()));
    });
}

#[test]
fn withdraw_work_entrant_funds_fails_with_invalid_entry_ownership() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 200;
        let winner_reward = max_amount;
        let entrant_stake = 37;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let worker_member_id_1 = 1;
        let worker_account_id_1 = 1;
        increase_account_balance(&worker_account_id_1, initial_balance);

        // Winner
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_staking_account_id(worker_account_id_1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&worker_account_id_1),
            initial_balance - entrant_stake
        );

        let entry_id_1 = 1;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Ok(()));

        let worker_member_id_2 = 2;
        let worker_account_id_2 = 2;
        increase_account_balance(&worker_account_id_2, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_staking_account_id(worker_account_id_2)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&worker_account_id_2),
            initial_balance - entrant_stake
        );

        let entry_id_2 = 2;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_entry_id(entry_id_2)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        // Judgment
        let mut judgment = BTreeMap::new();
        judgment.insert(
            entry_id_1,
            OracleWorkEntryJudgment::Winner {
                reward: winner_reward / 2,
            },
        );
        judgment.insert(
            entry_id_2,
            OracleWorkEntryJudgment::Winner {
                reward: winner_reward / 2,
            },
        );

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment)
            .call_and_assert(Ok(()));

        // Withdraw work entrant.
        WithdrawWorkEntrantFundsFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&worker_account_id_1),
            initial_balance + winner_reward / 2
        );

        // Bounty exists before the last withdrawal call.
        assert!(<Bounties<Test>>::contains_key(bounty_id));

        //Tries to steal worker_member_id_2
        WithdrawWorkEntrantFundsFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_2)
            .call_and_assert(Err(Error::<Test>::WorkEntryDoesntBelongToWorker.into()));

        assert_eq!(
            Balances::usable_balance(&worker_account_id_1),
            initial_balance + winner_reward / 2
        );

        // Withdraw work entrant.
        WithdrawWorkEntrantFundsFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_entry_id(entry_id_2)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&worker_account_id_2),
            initial_balance + winner_reward / 2
        );

        EventFixture::contains_crate_event(RawEvent::WorkEntrantFundsWithdrawn(
            bounty_id,
            entry_id_1,
            worker_member_id_1,
        ));

        EventFixture::contains_crate_event(RawEvent::WorkEntrantFundsWithdrawn(
            bounty_id,
            entry_id_2,
            worker_member_id_2,
        ));

        assert!(<Bounties<Test>>::contains_key(bounty_id));
    });
}

#[test]
fn withdraw_work_entrant_funds_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        let member_id = 1;
        let account_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;

        WithdrawWorkEntrantFundsFixture::default()
            .with_entry_id(entry_id)
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));

        WithdrawWorkEntrantFundsFixture::default()
            .with_entry_id(entry_id)
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn withdraw_work_entrant_funds_fails_with_invalid_stage() {
    //Funding
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        set_council_budget(initial_balance);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        WithdrawWorkEntrantFundsFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedFunding.into()));
    });
    //FundingExpired
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 10);

        WithdrawWorkEntrantFundsFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedFundingExpired.into(),
        ));
    });
    //FailedBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .call_and_assert(Ok(()));
        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(250)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        WithdrawWorkEntrantFundsFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawal.into(),
        ));
    });
    //WorkSubmission
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        WithdrawWorkEntrantFundsFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedWorkSubmission.into(),
        ));
    });
    //Judgment
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        WithdrawWorkEntrantFundsFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedJudgment.into()));
    });
}

#[test]
fn switch_oracle_to_council_by_council_approval_successful() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let actual_oracle_member_id = 5;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_oracle_member_id(actual_oracle_member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        SwitchOracleFixture::default()
            .with_new_oracle_member_id(BountyActor::Council)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::BountyOracleSwitchingByCouncilApproval(
            bounty_id,
            BountyActor::Member(actual_oracle_member_id),
            BountyActor::Council,
        ));
    });
}

#[test]
fn switch_oracle_to_member_by_council_oracle_successful() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let new_oracle_member_id = 5;

        set_council_budget(initial_balance);

        CreateBountyFixture::default().call_and_assert(Ok(()));
        let bounty_id = 1u64;

        SwitchOracleFixture::default()
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::BountyOracleSwitchingByCurrentOracle(
            bounty_id,
            BountyActor::Council,
            BountyActor::Member(new_oracle_member_id),
        ));
    });
}

#[test]
fn switch_oracle_to_member_by_council_approval_successful() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let current_oracle_member_id = 2;
        let new_oracle_member_id = 5;

        set_council_budget(initial_balance);

        let create_bounty_fixture =
            CreateBountyFixture::default().with_oracle_member_id(current_oracle_member_id);

        create_bounty_fixture.call_and_assert(Ok(()));
        let bounty_id = 1u64;

        EventFixture::assert_last_crate_event(RawEvent::BountyCreated(
            bounty_id,
            create_bounty_fixture.get_bounty_creation_parameters(),
            Vec::new(),
        ));

        SwitchOracleFixture::default()
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::BountyOracleSwitchingByCouncilApproval(
            bounty_id,
            BountyActor::Member(current_oracle_member_id),
            BountyActor::Member(new_oracle_member_id),
        ));
    });
}

#[test]
fn switch_oracle_to_council_by_member_oracle_successful() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let actual_oracle_member_id = 5;
        let actual_oracle_account_id = 5;

        set_council_budget(initial_balance);

        let create_bounty_fixture =
            CreateBountyFixture::default().with_oracle_member_id(actual_oracle_member_id);

        create_bounty_fixture.call_and_assert(Ok(()));
        let bounty_id = 1u64;

        EventFixture::assert_last_crate_event(RawEvent::BountyCreated(
            bounty_id,
            create_bounty_fixture.get_bounty_creation_parameters(),
            Vec::new(),
        ));

        SwitchOracleFixture::default()
            .with_origin(RawOrigin::Signed(actual_oracle_account_id))
            .with_new_oracle_member_id(BountyActor::Council)
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::BountyOracleSwitchingByCurrentOracle(
            bounty_id,
            BountyActor::Member(actual_oracle_member_id),
            BountyActor::Council,
        ));
    });
}

#[test]
fn switch_oracle_to_member_by_oracle_member_successful() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let actual_oracle_member_id = 5;
        let actual_oracle_account_id = 5;
        let new_oracle_member_id = 6;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_oracle_member_id(actual_oracle_member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        SwitchOracleFixture::default()
            .with_origin(RawOrigin::Signed(actual_oracle_account_id))
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::BountyOracleSwitchingByCurrentOracle(
            bounty_id,
            BountyActor::Member(actual_oracle_member_id),
            BountyActor::Member(new_oracle_member_id),
        ));
    });
}

#[test]
fn switch_oracle_to_same_member_fails() {
    //Member to Member
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let actual_oracle_member_id = 5;
        let actual_oracle_account_id = 5;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_oracle_member_id(actual_oracle_member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        SwitchOracleFixture::default()
            .with_bounty_id(bounty_id)
            .with_new_oracle_member_id(BountyActor::Member(actual_oracle_member_id))
            .with_origin(RawOrigin::Signed(actual_oracle_account_id))
            .call_and_assert(Err(Error::<Test>::MemberIsAlreadyAnOracle.into()));
    });
    //Council to Council
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        set_council_budget(initial_balance);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        let bounty_id = 1u64;

        SwitchOracleFixture::default()
            .with_bounty_id(bounty_id)
            .with_new_oracle_member_id(BountyActor::Council)
            .call_and_assert(Err(Error::<Test>::MemberIsAlreadyAnOracle.into()));
    });
}

#[test]
fn switch_oracle_to_member_by_not_council_and_not_current_oracle_fails() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let current_oracle_member_id = 2;
        let new_oracle_member_id = 5;

        set_council_budget(initial_balance);

        let create_bounty_fixture =
            CreateBountyFixture::default().with_oracle_member_id(current_oracle_member_id);

        create_bounty_fixture.call_and_assert(Ok(()));
        let bounty_id = 1u64;

        EventFixture::assert_last_crate_event(RawEvent::BountyCreated(
            bounty_id,
            create_bounty_fixture.get_bounty_creation_parameters(),
            Vec::new(),
        ));

        SwitchOracleFixture::default()
            .with_origin(RawOrigin::None)
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(Err(Error::<Test>::OriginIsNotCouncilAndIsNotOracle.into()));
    });
}

#[test]
fn switch_oracle_fails_invalid_stage() {
    //SuccessfulBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let winner_reward = max_amount;
        let entrant_stake = 37;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let member_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, initial_balance);

        // Winner
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        // Judgment
        let mut judgment = BTreeMap::new();
        judgment.insert(
            entry_id,
            OracleWorkEntryJudgment::Winner {
                reward: winner_reward,
            },
        );

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment)
            .call_and_assert(Ok(()));
        let new_oracle_member_id = 2;

        SwitchOracleFixture::default()
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedSuccessfulBountyWithdrawal.into(),
            ));
    });

    //FundingExpired
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        run_to_block(starting_block + funding_period + 1);
        let new_oracle_member_id = 2;
        let bounty_id = 1;

        SwitchOracleFixture::default()
            .with_bounty_id(bounty_id)
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedFundingExpired.into()
            ));
    });

    //FailedBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        let min_funding = 500;
        let max_funding = 1000;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_funding, max_funding, funding_period)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(250)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        run_to_block(starting_block + funding_period + 1);
        let new_oracle_member_id = 2;

        SwitchOracleFixture::default()
            .with_bounty_id(bounty_id)
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawal.into(),
            ));
    });
}

#[test]
fn terminate_bounty_in_working_period_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;

        let funding_amount = 500;

        let initial_balance = 2000;
        let cherry = 200;
        let oracle_reward = 200;
        let worker_entrant_stake = 200;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        let bounty_creation_bounty_fixture = CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .with_entrant_stake(worker_entrant_stake);

        let bounty_creation_params =
            bounty_creation_bounty_fixture.get_bounty_creation_parameters();
        bounty_creation_bounty_fixture.call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(funding_amount)
            .call_and_assert(Ok(()));

        let worker_member_id_1 = 1;
        let worker_account_id_1 = 1;
        increase_account_balance(&worker_account_id_1, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_staking_account_id(worker_account_id_1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        let worker_member_id_2 = 2;
        let worker_account_id_2 = 2;
        increase_account_balance(&worker_account_id_2, initial_balance);

        //Work entrant announced but not submitted
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_staking_account_id(worker_account_id_2)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        TerminateBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::FailedBountyWithdrawal
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyTerminatedByCouncil(
            bounty_id,
            bounty_creation_params.creator,
            bounty_creation_params.oracle,
        ))
    });
}

#[test]
fn terminate_bounty_in_judging_period_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;

        let funding_amount = 500;

        let initial_balance = 2000;
        let cherry = 200;
        let oracle_reward = 200;
        let worker_entrant_stake = 200;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        let bounty_creation_bounty_fixture = CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .with_entrant_stake(worker_entrant_stake);

        let bounty_creation_params =
            bounty_creation_bounty_fixture.get_bounty_creation_parameters();
        bounty_creation_bounty_fixture.call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(funding_amount)
            .call_and_assert(Ok(()));

        let worker_member_id_1 = 1;
        let worker_account_id_1 = 1;
        increase_account_balance(&worker_account_id_1, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_staking_account_id(worker_account_id_1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        let worker_member_id_2 = 2;
        let worker_account_id_2 = 2;
        increase_account_balance(&worker_account_id_2, initial_balance);

        //Work entrant announced but not submitted
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_staking_account_id(worker_account_id_2)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        TerminateBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();
        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::FailedBountyWithdrawal
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyTerminatedByCouncil(
            bounty_id,
            bounty_creation_params.creator,
            bounty_creation_params.oracle,
        ))
    });
}

#[test]
fn terminate_bounty_fails_with_invalid_stage() {
    //Funding
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        set_council_budget(initial_balance);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        let bounty_id = 1;

        TerminateBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedFunding.into()));
    });

    //FundingExpired
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 10);

        let bounty_id = 1;

        TerminateBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedFundingExpired.into()
            ));
    });

    //FailedBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .call_and_assert(Ok(()));
        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(250)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        TerminateBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawal.into(),
            ));
    });

    //SuccessfulBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        // Judgment
        let judgment = vec![(
            entry_id,
            OracleWorkEntryJudgment::Winner { reward: min_amount },
        )]
        .iter()
        .cloned()
        .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        TerminateBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedSuccessfulBountyWithdrawal.into(),
            ));
    });
}

#[test]
fn terminate_bounty_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;
        let funding_amount = 400;
        let funding_account_id = 1;
        let funding_member_id = 1;

        let initial_balance = 500;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&funding_account_id, initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(funding_account_id))
            .with_member_id(funding_member_id)
            .with_amount(funding_amount)
            .call_and_assert(Ok(()));

        TerminateBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(1))
            .call_and_assert(Err(DispatchError::BadOrigin));

        TerminateBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn unlock_work_entrant_stake_succeeds_after_terminating_in_working_period() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;

        let funding_amount = 500;

        let initial_balance = 2000;
        let cherry = 200;
        let oracle_reward = 200;
        let worker_entrant_stake = 200;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .with_entrant_stake(worker_entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(funding_amount)
            .call_and_assert(Ok(()));

        let worker_member_id_1 = 1;
        let worker_account_id_1 = 1;
        increase_account_balance(&worker_account_id_1, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_staking_account_id(worker_account_id_1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id_1 = 1;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Ok(()));

        let worker_member_id_2 = 2;
        let worker_account_id_2 = 2;
        increase_account_balance(&worker_account_id_2, initial_balance);

        //Work entrant announced but not submitted
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_staking_account_id(worker_account_id_2)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));
        let entry_id_2 = 2;

        TerminateBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::free_balance(&worker_account_id_1),
            initial_balance
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_1),
            initial_balance - worker_entrant_stake
        );
        assert_eq!(
            Balances::free_balance(&worker_account_id_2),
            initial_balance
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_2),
            initial_balance - worker_entrant_stake
        );
        UnlockWorkEntrantStakeFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Ok(()));

        UnlockWorkEntrantStakeFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_entry_id(entry_id_2)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::free_balance(&worker_account_id_1),
            initial_balance
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_1),
            initial_balance
        );

        assert_eq!(
            Balances::free_balance(&worker_account_id_2),
            initial_balance
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_2),
            initial_balance
        );

        EventFixture::contains_crate_event(RawEvent::WorkEntrantStakeUnlocked(
            bounty_id,
            entry_id_1,
            worker_account_id_1,
        ));
        EventFixture::contains_crate_event(RawEvent::WorkEntrantStakeUnlocked(
            bounty_id,
            entry_id_2,
            worker_account_id_2,
        ));
        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}

#[test]
fn unlock_work_entrant_stake_succeeds_after_terminating_in_judging_period() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;

        let funding_amount = 500;

        let initial_balance = 2000;
        let cherry = 200;
        let oracle_reward = 200;
        let worker_entrant_stake = 200;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .with_entrant_stake(worker_entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(funding_amount)
            .call_and_assert(Ok(()));

        let worker_member_id_1 = 1;
        let worker_account_id_1 = 1;
        increase_account_balance(&worker_account_id_1, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_staking_account_id(worker_account_id_1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id_1 = 1;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Ok(()));

        let worker_member_id_2 = 2;
        let worker_account_id_2 = 2;
        increase_account_balance(&worker_account_id_2, initial_balance);

        //Work entrant announced but not submitted
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_staking_account_id(worker_account_id_2)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));
        let entry_id_2 = 2;

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        TerminateBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::free_balance(&worker_account_id_1),
            initial_balance
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_1),
            initial_balance - worker_entrant_stake
        );
        assert_eq!(
            Balances::free_balance(&worker_account_id_2),
            initial_balance
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_2),
            initial_balance - worker_entrant_stake
        );
        UnlockWorkEntrantStakeFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Ok(()));

        UnlockWorkEntrantStakeFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_entry_id(entry_id_2)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::free_balance(&worker_account_id_1),
            initial_balance
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_1),
            initial_balance
        );

        assert_eq!(
            Balances::free_balance(&worker_account_id_2),
            initial_balance
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_2),
            initial_balance
        );

        EventFixture::contains_crate_event(RawEvent::WorkEntrantStakeUnlocked(
            bounty_id,
            entry_id_1,
            worker_account_id_1,
        ));
        EventFixture::contains_crate_event(RawEvent::WorkEntrantStakeUnlocked(
            bounty_id,
            entry_id_2,
            worker_account_id_2,
        ));
        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}

#[test]
fn unlock_work_entrant_stake_succeeds_after_judging() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;

        let funding_amount = 500;

        let initial_balance = 2000;
        let cherry = 200;
        let oracle_reward = 200;
        let worker_entrant_stake = 200;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .with_entrant_stake(worker_entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(funding_amount)
            .call_and_assert(Ok(()));

        let worker_member_id_1 = 1;
        let worker_account_id_1 = 1;
        increase_account_balance(&worker_account_id_1, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_staking_account_id(worker_account_id_1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id_1 = 1;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Ok(()));

        let worker_member_id_2 = 2;
        let worker_account_id_2 = 2;
        increase_account_balance(&worker_account_id_2, initial_balance);

        //Work entrant announced but not submitted
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_staking_account_id(worker_account_id_2)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));
        let entry_id_2 = 2;

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::free_balance(&worker_account_id_1),
            initial_balance
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_1),
            initial_balance - worker_entrant_stake
        );

        let mut judgment: OracleJudgment<u64, u64> = BTreeMap::new();
        let slashing_share_entry_1 = Perbill::from_percent(50);
        let reason_entry_1 = None;
        judgment.insert(
            entry_id_1,
            OracleWorkEntryJudgment::Rejected {
                slashing_share: slashing_share_entry_1,
                action_justification: reason_entry_1,
            },
        );

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let amount_slashed_entry_1 = slashing_share_entry_1 * worker_entrant_stake;
        assert_eq!(
            Balances::free_balance(&worker_account_id_1),
            initial_balance - amount_slashed_entry_1
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_1),
            initial_balance - amount_slashed_entry_1
        );

        assert_eq!(
            Balances::free_balance(&worker_account_id_2),
            initial_balance
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_2),
            initial_balance - worker_entrant_stake
        );

        UnlockWorkEntrantStakeFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_entry_id(entry_id_2)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::free_balance(&worker_account_id_2),
            initial_balance
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_2),
            initial_balance
        );

        EventFixture::contains_crate_event(RawEvent::WorkEntrantStakeUnlocked(
            bounty_id,
            entry_id_2,
            worker_account_id_2,
        ));
        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}

#[test]
fn unlock_work_entrant_stake_fails_after_successeful_judging() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;

        let funding_amount = 500;

        let initial_balance = 2000;
        let cherry = 200;
        let oracle_reward = 200;
        let worker_entrant_stake = 200;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .with_entrant_stake(worker_entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(funding_amount)
            .call_and_assert(Ok(()));

        let worker_member_id_1 = 1;
        let worker_account_id_1 = 1;
        increase_account_balance(&worker_account_id_1, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_staking_account_id(worker_account_id_1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id_1 = 1;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let mut judgment: OracleJudgment<u64, u64> = BTreeMap::new();
        judgment.insert(
            entry_id_1,
            OracleWorkEntryJudgment::Winner { reward: max_amount },
        );

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        UnlockWorkEntrantStakeFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Err(Error::<Test>::CannotUnlockWorkEntryAlreadyJudged.into()));
    });
}

#[test]
fn unlock_work_entrant_stake_fails_invalid_entry_ownership() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;

        let funding_amount = 500;

        let initial_balance = 2000;
        let cherry = 200;
        let oracle_reward = 200;
        let worker_entrant_stake = 200;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .with_entrant_stake(worker_entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(funding_amount)
            .call_and_assert(Ok(()));

        let worker_member_id_1 = 1;
        let worker_account_id_1 = 1;
        increase_account_balance(&worker_account_id_1, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_staking_account_id(worker_account_id_1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id_1 = 1;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Ok(()));

        let worker_member_id_2 = 2;
        let worker_account_id_2 = 2;
        increase_account_balance(&worker_account_id_2, initial_balance);

        //Work entrant announced but not submitted
        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_2))
            .with_member_id(worker_member_id_2)
            .with_staking_account_id(worker_account_id_2)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));
        let entry_id_2 = 2;

        TerminateBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        UnlockWorkEntrantStakeFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_2)
            .call_and_assert(Err(Error::<Test>::WorkEntryDoesntBelongToWorker.into()));
    });
}

#[test]
fn unlock_work_entrant_stake_fails_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let worker_member_id_1 = 1;
        let entry_id_1 = 1;

        UnlockWorkEntrantStakeFixture::default()
            .with_origin(RawOrigin::Root)
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Err(DispatchError::BadOrigin));

        UnlockWorkEntrantStakeFixture::default()
            .with_origin(RawOrigin::None)
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn unlock_work_entrant_stake_fails_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        UnlockWorkEntrantStakeFixture::default()
            .with_bounty_id(2)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn unlock_work_entrant_stake_fails_invalid_stage() {
    //Funding
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        set_council_budget(initial_balance);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        UnlockWorkEntrantStakeFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedFunding.into()));
    });

    //FundingExpired
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 10);

        UnlockWorkEntrantStakeFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedFundingExpired.into(),
        ));
    });

    //WorkSubmission
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);
        UnlockWorkEntrantStakeFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedWorkSubmission.into(),
        ));
    });

    //Judgment
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        UnlockWorkEntrantStakeFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedJudgment.into()));
    });
}

#[test]
fn withdraw_state_bloat_bond_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 900;

        let funding_amount = 300;

        let initial_balance = 2000;
        let cherry = 300;
        let oracle_reward = 200;
        let worker_entrant_stake = 200;
        let worker_member_id_1 = 1;
        let worker_account_id_1 = 1;

        let funder_account = 2;
        let funder_member_id = 2;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&funder_account, initial_balance);
        increase_account_balance(&worker_account_id_1, initial_balance);
        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .with_entrant_stake(worker_entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(funding_amount)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(funding_amount)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(funder_account))
            .with_member_id(funder_member_id)
            .with_amount(funding_amount)
            .call_and_assert(Ok(()));

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_staking_account_id(worker_account_id_1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id_1 = 1;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let mut judgment: OracleJudgment<u64, u64> = BTreeMap::new();
        judgment.insert(
            entry_id_1,
            OracleWorkEntryJudgment::Winner { reward: max_amount },
        );

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        // Withdraw work entrant.
        WithdrawWorkEntrantFundsFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - 2 * funding_amount - get_state_bloat_bond()
        );

        assert_eq!(
            Balances::usable_balance(&funder_account),
            initial_balance - funding_amount - get_state_bloat_bond()
        );

        WithdrawStateBloatBondFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Ok(()));

        WithdrawStateBloatBondFixture::default()
            .with_origin(RawOrigin::Signed(funder_account))
            .with_member_id(funder_member_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - 2 * funding_amount
        );

        assert_eq!(
            Balances::usable_balance(&funder_account),
            initial_balance - funding_amount
        );

        EventFixture::contains_crate_event(RawEvent::StateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Council,
        ));

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}

#[test]
fn withdraw_state_bloat_bond_fails_invalid_stage() {
    //Funding
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        set_council_budget(initial_balance);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        WithdrawStateBloatBondFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedFunding.into()));
    });

    //FundingExpired
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 10);
        WithdrawStateBloatBondFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedFundingExpired.into()
            ));
    });

    //WorkSubmission
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);
        WithdrawStateBloatBondFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedWorkSubmission.into()
            ));
    });

    //Judgment
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(min_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id = 1;
        increase_account_balance(&account_id, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        WithdrawStateBloatBondFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedJudgment.into()));
    });

    //FailedBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let min_amount = 500;
        let max_amount = 1000;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(min_amount, max_amount, funding_period)
            .call_and_assert(Ok(()));
        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(250)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        WithdrawStateBloatBondFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawal.into(),
            ));
    });
}

#[test]
fn withdraw_state_bloat_bond_fails_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        WithdrawStateBloatBondFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn withdraw_state_bloat_bond_fails_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let member_id_1 = 1;

        WithdrawStateBloatBondFixture::default()
            .with_origin(RawOrigin::Root)
            .with_member_id(member_id_1)
            .call_and_assert(Err(DispatchError::BadOrigin));

        WithdrawStateBloatBondFixture::default()
            .with_origin(RawOrigin::None)
            .with_member_id(member_id_1)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn withdraw_state_bloat_bond_after_fails_invalid_funds_ownership() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 900;

        let initial_balance = 2000;
        let cherry = 300;
        let oracle_reward = 200;
        let worker_entrant_stake = 200;
        let worker_member_id_1 = 1;
        let worker_account_id_1 = 1;

        let funder_account = 2;
        let funder_member_id = 2;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&funder_account, initial_balance);
        increase_account_balance(&worker_account_id_1, initial_balance);
        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .with_entrant_stake(worker_entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(max_amount)
            .call_and_assert(Ok(()));

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_staking_account_id(worker_account_id_1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id_1 = 1;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let mut judgment: OracleJudgment<u64, u64> = BTreeMap::new();
        judgment.insert(
            entry_id_1,
            OracleWorkEntryJudgment::Winner { reward: max_amount },
        );

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        // Withdraw work entrant.
        WithdrawWorkEntrantFundsFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Ok(()));

        WithdrawStateBloatBondFixture::default()
            .with_origin(RawOrigin::Signed(funder_account))
            .with_member_id(funder_member_id)
            .call_and_assert(Err(Error::<Test>::NoBountyContributionFound.into()));
    });
}

#[test]
fn withdraw_state_bloat_bond_fails_with_insufficient_balance() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 900;

        let initial_balance = 2000;
        let cherry = 300;
        let oracle_reward = 200;
        let worker_entrant_stake = 200;
        let worker_member_id_1 = 1;
        let worker_account_id_1 = 1;

        let funder_account = 2;
        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&funder_account, initial_balance);
        increase_account_balance(&worker_account_id_1, initial_balance);
        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .with_entrant_stake(worker_entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(max_amount)
            .call_and_assert(Ok(()));

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_staking_account_id(worker_account_id_1)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id_1 = 1;

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let mut judgment: OracleJudgment<u64, u64> = BTreeMap::new();
        judgment.insert(
            entry_id_1,
            OracleWorkEntryJudgment::Winner { reward: max_amount },
        );

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        // Withdraw work entrant.
        WithdrawWorkEntrantFundsFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Ok(()));

        decrease_bounty_account_balance(bounty_id, 1);
        WithdrawStateBloatBondFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Err(
                Error::<Test>::NoBountyBalanceToStateBloatBondWithdrawal.into(),
            ));
    });
}
