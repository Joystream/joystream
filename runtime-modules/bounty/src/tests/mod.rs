#![cfg(test)]

pub(crate) mod fixtures;
pub(crate) mod mocks;

use frame_support::storage::StorageMap;
use frame_support::traits::Currency;
use frame_system::RawOrigin;
use sp_runtime::DispatchError;
use sp_std::collections::btree_map::BTreeMap;

use crate::{
    Bounties, BountyActor, BountyCreationParameters, BountyMilestone, BountyRecord, BountyStage,
    Entries, Error, FundingType, OracleWorkEntryJudgment, RawEvent,
};
use fixtures::{
    decrease_bounty_account_balance, get_council_budget, increase_account_balance,
    increase_total_balance_issuance_using_account_id, run_to_block, set_council_budget,
    AnnounceWorkEntryFixture, CancelBountyFixture, CreateBountyFixture, EventFixture,
    FundBountyFixture, SubmitJudgmentFixture, SubmitWorkFixture, SwitchOracleFixture,
    VetoBountyFixture, WithdrawFundingFixture, WithdrawWorkEntrantFundsFixture,
    WithdrawWorkEntryFixture, DEFAULT_BOUNTY_CHERRY, DEFAULT_BOUNTY_ORACLE_CHERRY,
};
use mocks::{
    build_test_externalities, Balances, Bounty, ClosedContractSizeLimit, MinFundingLimit, System,
    Test, COUNCIL_BUDGET_ACCOUNT_ID, STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER,
};

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
        let work_period = 10;
        let judging_period = 10;
        let min_funding_amount = 100;
        let work_period_started_at = created_at + funding_period;

        // Limited funding period
        let params = BountyCreationParameters::<Test> {
            funding_type: FundingType::Limited {
                funding_period,
                min_funding_amount,
                max_funding_amount: 10,
            },
            work_period,
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

        // Work period is not expired.
        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                funding_type: FundingType::Limited {
                    funding_period,
                    min_funding_amount,
                    max_funding_amount: 10,
                },
                work_period,
                judging_period,
                ..Default::default()
            },
            milestone: BountyMilestone::WorkSubmitted {
                work_period_started_at,
            },
            ..Default::default()
        };

        System::set_block_number(work_period_started_at + 1);

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::WorkSubmission
        );
    });
}

#[test]
fn validate_judgment_bounty_stage() {
    build_test_externalities().execute_with(|| {
        let created_at = 10;
        let funding_period = 10;
        let work_period = 10;
        let judging_period = 10;
        let min_funding_amount = 100;
        let work_period_started_at = created_at + funding_period;

        // Work period is not expired.
        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                funding_type: FundingType::Limited {
                    funding_period,
                    min_funding_amount,
                    max_funding_amount: 10,
                },
                work_period,
                judging_period,
                ..Default::default()
            },
            milestone: BountyMilestone::WorkSubmitted {
                work_period_started_at,
            },
            ..Default::default()
        };

        System::set_block_number(work_period_started_at + work_period + 1);

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
fn create_bounty_fails_with_insufficient_oracle_cherry_value() {
    build_test_externalities().execute_with(|| {
        // set_council_budget(500);

        CreateBountyFixture::default()
            .with_oracle_cherry(0)
            .call_and_assert(Err(Error::<Test>::OracleCherryLessThenMinimumAllowed.into()));
    });
}

#[test]
fn create_bounty_transfers_member_balance_correctly() {
    build_test_externalities().execute_with(|| {
        let member_id = 1;
        let account_id = 1;
        let cherry = 100;
        let oracle_cherry = 100;
        let initial_balance = 500;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        // Insufficient member controller account balance.
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .with_cherry(cherry)
            .with_oracle_cherry(oracle_cherry)
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id),
            initial_balance - cherry - oracle_cherry
        );

        let bounty_id = 1;

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            cherry + oracle_cherry
        );
    });
}

#[test]
fn create_bounty_transfers_the_council_balance_correctly() {
    build_test_externalities().execute_with(|| {
        let cherry = 100;
        let oracle_cherry = 100;
        let initial_balance = 500;

        set_council_budget(initial_balance);

        // Insufficient member controller account balance.
        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_cherry(oracle_cherry)
            .call_and_assert(Ok(()));

        assert_eq!(
            get_council_budget(),
            initial_balance - cherry - oracle_cherry
        );

        let bounty_id = 1;

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            cherry + oracle_cherry
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
fn create_bounty_fails_with_invalid_periods() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default()
            .with_work_period(0)
            .call_and_assert(Err(Error::<Test>::WorkPeriodCannotBeZero.into()));

        CreateBountyFixture::default()
            .with_judging_period(0)
            .call_and_assert(Err(Error::<Test>::JudgingPeriodCannotBeZero.into()));
    });
}

#[test]
fn create_bounty_fails_with_insufficient_balances() {
    build_test_externalities().execute_with(|| {
        let member_id = 1;
        let account_id = 1;
        let cherry = 100;
        let oracle_cherry = 100;
        // Insufficient council budget.
        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_cherry(oracle_cherry)
            .call_and_assert(Err(Error::<Test>::InsufficientBalanceForBounty.into()));

        // Insufficient member controller account balance.
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .with_cherry(cherry)
            .with_oracle_cherry(oracle_cherry)
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
        let oracle_cherry = 100;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_cherry(oracle_cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        assert_eq!(
            get_council_budget(),
            initial_balance - cherry - oracle_cherry
        );

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(get_council_budget(), initial_balance);

        EventFixture::contains_crate_event(RawEvent::BountyCreatorCherryWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));

        EventFixture::contains_crate_event(RawEvent::BountyCreatorOracleCherryWithdrawal(
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

        EventFixture::contains_crate_event(RawEvent::BountyCreatorOracleCherryWithdrawal(
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
            .with_creator_member_id(member_id)
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

        // Created by a member - try to cancel with invalid member_id
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 2u64;
        let invalid_member_id = 2;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(invalid_member_id)
            .call_and_assert(Err(Error::<Test>::NotBountyActor.into()));

        // Created by a member - try to cancel with bad origin
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 3u64;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));

        // Created by a member  - try to cancel by council
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 4u64;

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(Error::<Test>::NotBountyActor.into()));
    });
}

#[test]
fn cancel_bounty_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        // Test bounty with funding.
        CreateBountyFixture::default().call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(MinFundingLimit::get())
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedFunding.into()));
    });
}

#[test]
fn cancel_bounty_return_cherries_fails_insufficient_balance() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 200;
        let cherry = 100;
        let oracle_cherry = 100;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_cherry(oracle_cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        assert_eq!(
            get_council_budget(),
            initial_balance - cherry - oracle_cherry
        );

        decrease_bounty_account_balance(bounty_id, 1);

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::NoBountyBalanceToCherryWithdrawal.into()));
    });
}

#[test]
fn veto_bounty_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let cherry = 100;
        let oracle_cherry = 100;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_cherry(oracle_cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        assert_eq!(
            get_council_budget(),
            initial_balance - cherry - oracle_cherry
        );

        VetoBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(get_council_budget(), initial_balance);

        EventFixture::contains_crate_event(RawEvent::BountyCreatorCherryWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));
        EventFixture::contains_crate_event(RawEvent::BountyCreatorOracleCherryWithdrawal(
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
    });
}

#[test]
fn veto_bounty_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        // Test bounty with funding.
        CreateBountyFixture::default().call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(MinFundingLimit::get())
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        VetoBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedFunding.into()));
    });
}

#[test]
fn veto_bounty_return_cherries_fails_insufficient_balance() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 200;
        let cherry = 100;
        let oracle_cherry = 100;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_cherry(oracle_cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        assert_eq!(
            get_council_budget(),
            initial_balance - cherry - oracle_cherry
        );
        //decrease bounty account by 1, in order too fail balance validation
        decrease_bounty_account_balance(bounty_id, 1);

        VetoBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::NoBountyBalanceToCherryWithdrawal.into()));
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
        let oracle_cherry = DEFAULT_BOUNTY_ORACLE_CHERRY;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);
        increase_total_balance_issuance_using_account_id(
            COUNCIL_BUDGET_ACCOUNT_ID,
            initial_balance,
        );

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
            .with_oracle_cherry(oracle_cherry)
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
            initial_balance - amount
        );

        assert_eq!(
            crate::Module::<Test>::contribution_by_bounty_by_actor(
                bounty_id,
                BountyActor::Member(member_id)
            ),
            amount
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            amount + cherry + oracle_cherry
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
        let oracle_cherry = DEFAULT_BOUNTY_ORACLE_CHERRY;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
            .with_oracle_cherry(oracle_cherry)
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
            initial_balance - amount - cherry - oracle_cherry
        );

        assert_eq!(
            crate::Module::<Test>::contribution_by_bounty_by_actor(bounty_id, BountyActor::Council),
            amount
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            amount + cherry + oracle_cherry
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
            initial_balance - max_amount
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
fn multiple_fund_bounty_succeed() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let max_amount = 5000;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;
        let cherry = DEFAULT_BOUNTY_CHERRY;
        let oracle_cherry = DEFAULT_BOUNTY_ORACLE_CHERRY;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
            .with_oracle_cherry(oracle_cherry)
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
            initial_balance - 2 * amount
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            2 * amount + cherry + oracle_cherry
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
fn fund_bounty_fails_with_less_than_minimum_amount() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let member_id = 1;
        let account_id = 1;
        let amount = 10;

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_amount(amount)
            .call_and_assert(Err(Error::<Test>::FundingLessThenMinimumAllowed.into()));
    });
}

#[test]
fn fund_bounty_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let max_amount = 100;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        // Fund to maximum.
        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedWorkSubmission.into()
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
fn withdraw_member_funding_succeeds() {
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
            .with_max_funding_amount(max_amount)
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

        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id),
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

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(max_amount, max_amount, funding_period)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + starting_block + 1);

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
        let oracle_cherry = 200;
        let funding_period = 10;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&account_id1, initial_balance);
        increase_account_balance(&account_id2, initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(max_amount, max_amount, funding_period)
            .with_cherry(cherry)
            .with_oracle_cherry(oracle_cherry)
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
            amount + cherry / 2 + oracle_cherry
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
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn withdraw_member_funding_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
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

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedFunding.into()));
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
            .with_work_period(work_period)
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
        let oracle_cherry = 300;
        let funding_period = 10;
        let bounty_id = 1u64;
        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&account_id, initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_limited_funding(max_amount, max_amount, funding_period)
            .with_cherry(cherry)
            .with_oracle_cherry(oracle_cherry)
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

        //council receives back the oracle cherry but pays cherry to funder
        assert_eq!(
            balances::Module::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - cherry
        );

        //bounty account must be zero
        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            0
        );

        EventFixture::contains_crate_event(RawEvent::BountyCreatorOracleCherryWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}
#[test]
fn withdraw_member_funding_return_oracle_cherry_fails_insufficient_balance() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let max_amount = 500;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;
        let cherry = 200;
        let oracle_cherry = 300;
        let funding_period = 10;
        let bounty_id = 1u64;
        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&account_id, initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_limited_funding(max_amount, max_amount, funding_period)
            .with_cherry(cherry)
            .with_oracle_cherry(oracle_cherry)
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

        //Bounty account 600 - 1 -> 599 >= 600 -> false
        decrease_bounty_account_balance(bounty_id, 1);
        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Err(Error::<Test>::NoBountyBalanceToCherryWithdrawal.into()));
    });
}
#[test]
fn bounty_removal_succeeds() {
    build_test_externalities().execute_with(|| {
        let max_amount = 500;
        let amount = 100;
        let initial_balance = 500;
        let cherry = 100;
        let oracle_cherry = 100;
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
            .with_oracle_cherry(oracle_cherry)
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
                - oracle_cherry,
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
    });
}

#[test]
fn announce_work_entry_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        let bounty_id = 1u64;

        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedFunding.into()));
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
fn withdraw_work_entry_succeeded() {
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

        assert_eq!(
            Balances::usable_balance(&account_id),
            initial_balance - entrant_stake
        );

        let entry_id = 1;

        WithdrawWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        assert_eq!(Balances::usable_balance(&account_id), initial_balance);

        EventFixture::assert_last_crate_event(RawEvent::WorkEntryWithdrawn(
            bounty_id, entry_id, member_id,
        ));
    });
}

#[test]
fn withdraw_work_slashes_successfully1() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 100;
        let work_period = 1000;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(work_period)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        // Announcing entry with no slashes
        let member_id1 = 1;
        let account_id1 = 1;

        increase_account_balance(&account_id1, initial_balance);

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

        // Announcing entry with half slashing.

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

        // No slashes
        WithdrawWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id1))
            .with_member_id(member_id1)
            .with_entry_id(entry_id1)
            .call_and_assert(Ok(()));

        assert_eq!(Balances::usable_balance(&account_id1), initial_balance);

        // Slashes half.
        let half_period = work_period / 2;
        run_to_block(starting_block + half_period);

        WithdrawWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id2))
            .with_member_id(member_id2)
            .with_entry_id(entry_id2)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id2),
            initial_balance - entrant_stake / 2
        );
    });
}

#[test]
fn withdraw_work_slashes_successfully2() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 100;
        let work_period = 1000;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(work_period)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(max_amount)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        // Announcing entry with 33%
        let member_id1 = 1;
        let account_id1 = 1;

        increase_account_balance(&account_id1, initial_balance);

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

        // Announcing entry with full slashing.

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

        // Slashes half.
        let one_third_period = work_period / 3;
        run_to_block(starting_block + one_third_period);

        WithdrawWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id1))
            .with_member_id(member_id1)
            .with_entry_id(entry_id1)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id1),
            initial_balance - entrant_stake / 3
        );

        // Slashes all.
        run_to_block(starting_block + work_period);

        WithdrawWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id2))
            .with_member_id(member_id2)
            .with_entry_id(entry_id2)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id2),
            initial_balance - entrant_stake
        );
    });
}

#[test]
fn withdraw_work_entry_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        WithdrawWorkEntryFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn withdraw_work_entry_fails_with_invalid_entry_id() {
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

        WithdrawWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_entry_id(invalid_entry_id)
            .call_and_assert(Err(Error::<Test>::WorkEntryDoesntExist.into()));
    });
}

#[test]
fn withdraw_work_entry_fails_with_invalid_origin() {
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

        WithdrawWorkEntryFixture::default()
            .with_entry_id(entry_id)
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn withdraw_work_entry_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let work_period = 10;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(work_period)
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

        assert_eq!(
            Balances::usable_balance(&account_id),
            initial_balance - entrant_stake
        );

        let entry_id = 1;

        run_to_block(starting_block + work_period + 1);

        WithdrawWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawalWithoutJudgementSubmitted.into(),
            ));
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
    });
}

#[test]
fn submit_work_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let work_period = 10;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(work_period)
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

        assert_eq!(
            Balances::usable_balance(&account_id),
            initial_balance - entrant_stake
        );

        let entry_id = 1;

        run_to_block(starting_block + work_period + 1);

        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawalWithoutJudgementSubmitted.into(),
            ));
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
        let working_period = 10;
        let judging_period = 10;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(working_period)
            .with_judging_period(judging_period)
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

        // First work entry
        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id1 = 1u64;

        let work_data = b"Work submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id1)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        // Second work entry
        let member_id = 2;
        let account_id = 2;

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id2 = 2u64;

        let work_data = b"Work submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id2)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        // Third work entry
        let member_id = 3;
        let account_id = 3;

        increase_account_balance(&account_id, initial_balance);

        AnnounceWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_staking_account_id(account_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        let entry_id3 = 3u64;

        let work_data = b"Work submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id3)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        run_to_block(starting_block + working_period + 1);

        // Judgment
        let judgment = vec![
            (
                entry_id1,
                OracleWorkEntryJudgment::Winner { reward: max_amount },
            ),
            (entry_id3, OracleWorkEntryJudgment::Rejected),
        ]
        .iter()
        .cloned()
        .collect::<BTreeMap<_, _>>();

        assert!(<Entries<Test>>::contains_key(entry_id3));
        assert_eq!(Balances::total_balance(&account_id), initial_balance);

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        assert_eq!(
            Bounty::entries(entry_id1).oracle_judgment_result,
            Some(OracleWorkEntryJudgment::Winner { reward: max_amount })
        );
        assert_eq!(Bounty::entries(entry_id2).oracle_judgment_result, None);
        assert!(!<Entries<Test>>::contains_key(entry_id3));
        assert_eq!(
            Balances::total_balance(&account_id),
            initial_balance - entrant_stake
        );

        EventFixture::contains_crate_event(RawEvent::WorkEntrySlashed(bounty_id, entry_id3));
        EventFixture::assert_last_crate_event(RawEvent::OracleJudgmentSubmitted(
            bounty_id,
            BountyActor::Council,
            judgment,
        ));
    });
}

#[test]
fn submit_judgment_returns_cherry_on_successful_bounty() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let cherry = DEFAULT_BOUNTY_CHERRY;
        let oracle_cherry = 10;
        let entrant_stake = 37;
        let working_period = 10;
        let judging_period = 10;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(working_period)
            .with_judging_period(judging_period)
            .with_cherry(cherry)
            .with_oracle_cherry(oracle_cherry)
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

        let entry_id = 1u64;

        let work_data = b"Work submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        run_to_block(starting_block + working_period + 1);

        // Judgment
        let judgment = vec![(
            entry_id,
            OracleWorkEntryJudgment::Winner { reward: max_amount },
        )]
        .iter()
        .cloned()
        .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        assert_eq!(
            Bounty::entries(entry_id).oracle_judgment_result,
            Some(OracleWorkEntryJudgment::Winner { reward: max_amount })
        );

        // Cherry returned.
        assert_eq!(
            get_council_budget(),
            initial_balance - max_amount // initial - funding_amount
        );

        EventFixture::contains_crate_event(RawEvent::BountyCreatorCherryWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));
    });
}

#[test]
fn submit_judgment_returns_oracle_cherry_on_successful_bounty() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let reward = 100;
        let entrant_stake = 37;
        let working_period = 10;
        let judging_period = 10;
        let bounty_id = 1;

        let funder_member_id = 2;
        let funder_account_id = 2;

        let worker_member_id = 3;
        let worker_account_id = 3;

        let oracle_member_id = 4;
        let oracle_account_id = 4;

        let oracle_cherry = 100;
        let cherry = 50;

        set_council_budget(initial_balance);
        increase_account_balance(&funder_account_id, initial_balance);
        increase_account_balance(&worker_account_id, entrant_stake);

        CreateBountyFixture::default()
            .with_max_funding_amount(reward)
            .with_entrant_stake(entrant_stake)
            .with_work_period(working_period)
            .with_judging_period(judging_period)
            .with_oracle_member_id(oracle_member_id)
            .with_oracle_cherry(oracle_cherry)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(reward)
            .with_member_id(funder_member_id)
            .with_origin(RawOrigin::Signed(funder_account_id))
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
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .with_member_id(oracle_member_id)
            .with_entry_id(entry_id)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        run_to_block(starting_block + working_period + 1);

        let judgment = vec![entry_id]
            .iter()
            .map(|entry_id| {
                (
                    *entry_id,
                    OracleWorkEntryJudgment::Winner { reward: reward },
                )
            })
            .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .with_oracle_member_id(oracle_member_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        //oracle receives an oracle cherry
        assert_eq!(
            balances::Module::<Test>::usable_balance(&oracle_account_id),
            oracle_cherry
        );

        //council has to pay the oracle cherry
        assert_eq!(
            balances::Module::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - oracle_cherry
        );

        //funder account pays the reward, but don't receive any cherry
        assert_eq!(
            balances::Module::<Test>::usable_balance(&funder_account_id),
            initial_balance - reward
        );

        //worker account unlocks his stake and withdraws the reward only on withdrawal
        assert_eq!(
            balances::Module::<Test>::usable_balance(&worker_account_id),
            0
        );

        //Bounty account still has reward
        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            reward
        );

        EventFixture::contains_crate_event(RawEvent::BountyOracleCherryWithdrawal(
            bounty_id,
            BountyActor::Member(oracle_member_id),
        ));

        EventFixture::assert_last_crate_event(RawEvent::OracleJudgmentSubmitted(
            bounty_id,
            BountyActor::Member(oracle_member_id),
            judgment,
        ));
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
        let working_period = 10;
        let judging_period = 10;
        let bounty_id = 1;

        let funder_member_id = 2;
        let funder_account_id = 2;

        let worker_member_id = 3;
        let worker_account_id = 3;

        let oracle_member_id = 4;
        let oracle_account_id = 4;

        let oracle_cherry = 100;
        let cherry = 50;

        set_council_budget(initial_balance);
        increase_account_balance(&funder_account_id, initial_balance);
        increase_account_balance(&worker_account_id, entrant_stake);

        CreateBountyFixture::default()
            .with_max_funding_amount(reward)
            .with_entrant_stake(entrant_stake)
            .with_work_period(working_period)
            .with_judging_period(judging_period)
            .with_oracle_member_id(oracle_member_id)
            .with_oracle_cherry(oracle_cherry)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(reward)
            .with_member_id(funder_member_id)
            .with_origin(RawOrigin::Signed(funder_account_id))
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
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .with_member_id(oracle_member_id)
            .with_entry_id(entry_id)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        run_to_block(starting_block + working_period + 1);

        // Judgment
        let judgment = vec![(entry_id, OracleWorkEntryJudgment::Rejected)]
            .iter()
            .cloned()
            .collect::<BTreeMap<_, _>>();

        assert!(<Entries<Test>>::contains_key(entry_id));

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .with_oracle_member_id(oracle_member_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        assert!(!<Entries<Test>>::contains_key(entry_id));

        //oracle receives an oracle cherry
        assert_eq!(
            balances::Module::<Test>::usable_balance(&oracle_account_id),
            oracle_cherry
        );

        //council doesn't receive back the oracle cherry nor the cherry
        assert_eq!(
            balances::Module::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - oracle_cherry - cherry
        );

        //funder account receives back the reward and a cherry fraction on withdrwal not now
        assert_eq!(
            balances::Module::<Test>::usable_balance(&funder_account_id),
            initial_balance - reward
        );

        //worker account receives his stake only on withdrawal not now
        assert_eq!(
            balances::Module::<Test>::usable_balance(&worker_account_id),
            0
        );

        //bounty account still has reward and the cherry.
        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            reward + cherry
        );

        EventFixture::contains_crate_event(RawEvent::BountyOracleCherryWithdrawal(
            bounty_id,
            BountyActor::Member(oracle_member_id),
        ));

        EventFixture::assert_last_crate_event(RawEvent::OracleJudgmentSubmitted(
            bounty_id,
            BountyActor::Member(oracle_member_id),
            judgment,
        ));
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
        let working_period = 10;
        let judging_period = 10;
        let oracle_member_id = 1;
        let oracle_account_id = 1;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(working_period)
            .with_judging_period(judging_period)
            .with_oracle_member_id(oracle_member_id)
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

        run_to_block(starting_block + working_period + 1);

        let judgment = vec![entry_id]
            .iter()
            .map(|entry_id| {
                (
                    *entry_id,
                    OracleWorkEntryJudgment::Winner { reward: max_amount },
                )
            })
            .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .with_oracle_member_id(oracle_member_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::OracleJudgmentSubmitted(
            bounty_id,
            BountyActor::Member(oracle_member_id),
            judgment,
        ));
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

        // Oracle is set to a member - try to submit judgment with invalid member_id
        CreateBountyFixture::default()
            .with_oracle_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 2u64;
        let invalid_member_id = 2;

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(account_id))
            .with_oracle_member_id(invalid_member_id)
            .call_and_assert(Err(Error::<Test>::NotBountyActor.into()));

        // Oracle is set to a member - try to submit judgment with bad origin
        CreateBountyFixture::default()
            .with_oracle_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 3u64;

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));

        // Oracle is set to a member - try to submit judgment as a council
        CreateBountyFixture::default()
            .with_oracle_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 4u64;

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(Error::<Test>::NotBountyActor.into()));
    });
}

#[test]
fn submit_judgment_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        // Test already cancelled bounty.
        CreateBountyFixture::default().call_and_assert(Ok(()));

        let bounty_id = 1u64;

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedFunding.into()));
    });
}

#[test]
fn submit_judgment_fails_with_zero_work_entries() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let working_period = 10;
        let judging_period = 10;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(working_period)
            .with_judging_period(judging_period)
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

        WithdrawWorkEntryFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        run_to_block(starting_block + working_period + 1);

        // Withdrawn entry.
        let judgment = vec![entry_id]
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
            .call_and_assert(Err(Error::<Test>::NoActiveWorkEntries.into()));
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
        let working_period = 10;
        let judging_period = 10;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(working_period)
            .with_judging_period(judging_period)
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

        run_to_block(starting_block + working_period + 1);

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
        let working_period = 10;
        let judging_period = 10;
        let bounty_id = 1;

        let funder_member_id = 2;
        let funder_account_id = 2;

        let worker_member_id = 3;
        let worker_account_id = 3;

        let oracle_member_id = 4;
        let oracle_account_id = 4;

        let oracle_cherry = 100;
        let cherry = 50;

        set_council_budget(initial_balance);
        increase_account_balance(&funder_account_id, initial_balance);
        increase_account_balance(&worker_account_id, entrant_stake);

        CreateBountyFixture::default()
            .with_max_funding_amount(reward)
            .with_entrant_stake(entrant_stake)
            .with_work_period(working_period)
            .with_judging_period(judging_period)
            .with_oracle_member_id(oracle_member_id)
            .with_oracle_cherry(oracle_cherry)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(reward)
            .with_member_id(funder_member_id)
            .with_origin(RawOrigin::Signed(funder_account_id))
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
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .with_member_id(oracle_member_id)
            .with_entry_id(entry_id)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        run_to_block(starting_block + working_period + 1);

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
            .with_oracle_member_id(oracle_member_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Err(Error::<Test>::NoBountyBalanceToCherryWithdrawal.into()));
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
        let work_period = 1;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_work_period(work_period)
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

        assert_eq!(Balances::usable_balance(&account_id2), initial_balance);

        EventFixture::contains_crate_event(RawEvent::WorkEntrantFundsWithdrawn(
            bounty_id, entry_id2, member_id2,
        ));

        // Bounty was removed with the last withdrawal call.
        assert!(!<Bounties<Test>>::contains_key(bounty_id));

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));
    });
}

#[test]
fn withdraw_work_entrant_funds_on_judgement_fails_return_oracle_cherry_to_creator() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let reward = 100;
        let entrant_stake = 37;
        let working_period = 10;
        let judging_period = 10;
        let bounty_id = 1;

        let funder_member_id = 2;
        let funder_account_id = 2;

        let worker_member_id = 3;
        let worker_account_id = 3;

        let oracle_member_id = 4;
        let oracle_account_id = 4;

        let oracle_cherry = 100;
        let cherry = 50;

        set_council_budget(initial_balance);
        increase_account_balance(&funder_account_id, initial_balance);
        increase_account_balance(&worker_account_id, entrant_stake);

        CreateBountyFixture::default()
            .with_max_funding_amount(reward)
            .with_entrant_stake(entrant_stake)
            .with_work_period(working_period)
            .with_judging_period(judging_period)
            .with_oracle_member_id(oracle_member_id)
            .with_oracle_cherry(oracle_cherry)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(reward)
            .with_member_id(funder_member_id)
            .with_origin(RawOrigin::Signed(funder_account_id))
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
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .with_member_id(oracle_member_id)
            .with_entry_id(entry_id)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        run_to_block(starting_block + working_period + judging_period + 1);

        //first funder must withdraw his money in oreder to make the "withdrawal_completed" condition true
        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(funder_member_id)
            .with_origin(RawOrigin::Signed(funder_account_id))
            .call_and_assert(Ok(()));

        //with "withdrawal_completed" condition true, we can return the oracle cherry in "withdraw_work_entrant_funds"
        WithdrawWorkEntrantFundsFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id))
            .with_member_id(worker_member_id)
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        //the oracle don't receive the oracle cherry because the judgement period
        //expired without him sending a judge submission
        assert_eq!(
            balances::Module::<Test>::usable_balance(&oracle_account_id),
            0
        );

        //council receives back the oracle cherry but has to pay the cherry to the funder
        assert_eq!(
            balances::Module::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - cherry
        );

        //funder account receives back the reward and wins a cherry
        assert_eq!(
            balances::Module::<Test>::usable_balance(&funder_account_id),
            initial_balance + cherry
        );

        //worker account gets his stake unlocked
        assert_eq!(
            balances::Module::<Test>::usable_balance(&worker_account_id),
            37
        );

        //bounty account is empty
        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            0
        );

        EventFixture::contains_crate_event(RawEvent::BountyCreatorOracleCherryWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));
    });
}

#[test]
fn withdraw_work_entrant_funds_on_judgement_fails_insufficient_balance() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let reward = 100;
        let entrant_stake = 37;
        let working_period = 10;
        let judging_period = 10;
        let bounty_id = 1;

        let funder_member_id = 2;
        let funder_account_id = 2;

        let worker_member_id = 3;
        let worker_account_id = 3;

        let oracle_member_id = 4;
        let oracle_account_id = 4;

        let oracle_cherry = 100;
        let cherry = 50;

        set_council_budget(initial_balance);
        increase_account_balance(&funder_account_id, initial_balance);
        increase_account_balance(&worker_account_id, entrant_stake);

        CreateBountyFixture::default()
            .with_max_funding_amount(reward)
            .with_entrant_stake(entrant_stake)
            .with_work_period(working_period)
            .with_judging_period(judging_period)
            .with_oracle_member_id(oracle_member_id)
            .with_oracle_cherry(oracle_cherry)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(reward)
            .with_member_id(funder_member_id)
            .with_origin(RawOrigin::Signed(funder_account_id))
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
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .with_member_id(oracle_member_id)
            .with_entry_id(entry_id)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        run_to_block(starting_block + working_period + judging_period + 1);

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(funder_member_id)
            .with_origin(RawOrigin::Signed(funder_account_id))
            .call_and_assert(Ok(()));

        //bounty account 100 - 1 -> 99 >= 100 -> false
        decrease_bounty_account_balance(bounty_id, 1);

        WithdrawWorkEntrantFundsFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id))
            .with_member_id(worker_member_id)
            .with_entry_id(entry_id)
            .call_and_assert(Err(Error::<Test>::NoBountyBalanceToCherryWithdrawal.into()));
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

        run_to_block(100);

        let invalid_entry_id = 11u64;

        WithdrawWorkEntrantFundsFixture::default()
            .with_bounty_id(bounty_id)
            .with_entry_id(invalid_entry_id)
            .call_and_assert(Err(Error::<Test>::WorkEntryDoesntExist.into()));
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
    });
}

#[test]
fn withdraw_work_entrant_funds_fails_with_invalid_stage() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let work_period = 10;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(work_period)
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

        run_to_block(starting_block + 1);

        WithdrawWorkEntrantFundsFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .with_bounty_id(bounty_id)
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedWorkSubmission.into()
            ));
    });
}

#[test]
fn oracle_council_switch_to_oracle_member_successfull() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let new_oracle_member_id = 5;

        set_council_budget(initial_balance);

        let create_bounty_fixture = CreateBountyFixture::default();

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

        EventFixture::assert_last_crate_event(RawEvent::BountyOracleSwitched(
            bounty_id,
            BountyActor::Council,
            BountyActor::Member(new_oracle_member_id),
        ));
    });
}

#[test]
fn council_switch_by_approval_new_oracle_member_successfull() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let current_oracle_member_id = 2;
        let new_oracle_member_id = 5;

        set_council_budget(initial_balance);

        let create_bounty_fixture = CreateBountyFixture::default()
            .with_allow_council_switch_oracle()
            .with_oracle_member_id(current_oracle_member_id);

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

        EventFixture::assert_last_crate_event(
            RawEvent::BountyInactiveOracleSwitchedByCouncilApproval(
                bounty_id,
                BountyActor::Member(current_oracle_member_id),
                BountyActor::Member(new_oracle_member_id),
            ),
        );
    });
}

#[test]
fn oracle_member_switch_to_oracle_council_successfull() {
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

        EventFixture::assert_last_crate_event(RawEvent::BountyOracleSwitched(
            bounty_id,
            BountyActor::Member(actual_oracle_member_id),
            BountyActor::Council,
        ));
    });
}

#[test]
fn oracle_member_switch_to_oracle_member_successfull() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let actual_oracle_member_id = 5;
        let actual_oracle_account_id = 5;
        let new_oracle_member_id = 6;

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
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::BountyOracleSwitched(
            bounty_id,
            BountyActor::Member(actual_oracle_member_id),
            BountyActor::Member(new_oracle_member_id),
        ));
    });
}

#[test]
fn oracle_member_switch_to_same_member_fails_same_new_oracle() {
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
            .with_new_oracle_member_id(BountyActor::Member(actual_oracle_member_id))
            .with_origin(RawOrigin::Signed(actual_oracle_account_id))
            .call_and_assert(Err(Error::<Test>::MemberIsAlreadyAnOracle.into()));
    });
}

#[test]
fn oracle_council_switch_to_council_fails_same_new_oracle() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;

        set_council_budget(initial_balance);

        let create_bounty_fixture = CreateBountyFixture::default();

        create_bounty_fixture.call_and_assert(Ok(()));
        let bounty_id = 1u64;

        EventFixture::assert_last_crate_event(RawEvent::BountyCreated(
            bounty_id,
            create_bounty_fixture.get_bounty_creation_parameters(),
            Vec::new(),
        ));

        SwitchOracleFixture::default()
            .with_new_oracle_member_id(BountyActor::Council)
            .call_and_assert(Err(Error::<Test>::MemberIsAlreadyAnOracle.into()));
    });
}

#[test]
fn council_switch_by_approval_new_oracle_member_fails_council_flag_switched_off() {
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
            .call_and_assert(Err(
                Error::<Test>::CouncilIsNotAllowedToSwitchInactiveOracle.into(),
            ));
    });
}

#[test]
fn oracle_switch_fails_new_oracle_not_a_member() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let actual_oracle_member_id = 10;
        set_council_budget(initial_balance);

        let create_bounty_fixture = CreateBountyFixture::default();

        create_bounty_fixture.call_and_assert(Ok(()));
        let bounty_id = 1u64;

        EventFixture::assert_last_crate_event(RawEvent::BountyCreated(
            bounty_id,
            create_bounty_fixture.get_bounty_creation_parameters(),
            Vec::new(),
        ));

        SwitchOracleFixture::default()
            .with_new_oracle_member_id(BountyActor::Member(actual_oracle_member_id))
            .call_and_assert(Err(membership::Error::<Test>::MemberProfileNotFound.into()));
    });
}

#[test]
fn oracle_switch_fails_invalid_stage_successful_withdrawal() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let working_period = 10;
        let judging_period = 10;
        let new_oracle_member_id = 2;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(working_period)
            .with_judging_period(judging_period)
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

        let entry_id = 1u64;

        let work_data = b"Work submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        run_to_block(starting_block + working_period + 1);

        SwitchOracleFixture::default()
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedJudgment.into()));

        // Judgment
        let judgment = vec![(
            entry_id,
            OracleWorkEntryJudgment::Winner { reward: max_amount },
        )]
        .iter()
        .cloned()
        .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        SwitchOracleFixture::default()
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedSuccessfulBountyWithdrawal.into(),
            ));
    });
}

#[test]
fn oracle_switch_fails_invalid_stage_failed_bounty_withdrawal_without_judgement() {
    build_test_externalities().execute_with(|| {

        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let working_period = 10;
        let judging_period = 10;
        let new_oracle_member_id = 2;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(working_period)
            .with_judging_period(judging_period)
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

        let entry_id = 1u64;

        let work_data = b"Work submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        run_to_block(starting_block + working_period + 1);

        SwitchOracleFixture::default()
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedJudgment.into()));

        run_to_block(starting_block + working_period + judging_period + 1);

        SwitchOracleFixture::default()
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(
                Err(Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawalWithoutJudgementSubmitted.into()));
    });
}

#[test]
fn oracle_switch_fails_invalid_stage_failed_bounty_withdrawal_with_judgement() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let entrant_stake = 37;
        let working_period = 10;
        let judging_period = 10;
        let new_oracle_member_id = 2;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_entrant_stake(entrant_stake)
            .with_work_period(working_period)
            .with_judging_period(judging_period)
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

        let entry_id = 1u64;

        let work_data = b"Work submitted".to_vec();
        SubmitWorkFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_entry_id(entry_id)
            .with_work_data(work_data.clone())
            .call_and_assert(Ok(()));

        run_to_block(starting_block + working_period + 1);

        SwitchOracleFixture::default()
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedJudgment.into()));
        // Judgment
        let judgment = vec![(entry_id, OracleWorkEntryJudgment::Rejected)]
            .iter()
            .cloned()
            .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        SwitchOracleFixture::default()
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawalWithJudgementSubmitted
                    .into(),
            ));
    });
}
