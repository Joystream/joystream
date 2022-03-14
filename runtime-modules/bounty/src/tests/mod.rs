#![cfg(test)]

pub(crate) mod fixtures;
pub(crate) mod mocks;

use frame_support::storage::{StorageDoubleMap, StorageMap};
use frame_support::traits::Currency;
use frame_support::{assert_err, assert_ok};
use frame_system::RawOrigin;
use sp_runtime::DispatchError;
use sp_std::collections::btree_map::BTreeMap;

use crate::{
    Bounties, BountyActor, BountyCreationParameters, BountyMilestone, BountyRecord, BountyStage,
    Entries, Error, FundingType, OracleWorkEntryJudgment, RawEvent,
};
use fixtures::{
    get_council_budget, increase_account_balance, increase_total_balance_issuance_using_account_id,
    run_to_block, set_council_budget, AnnounceWorkEntryFixture, CancelBountyFixture,
    CreateBountyFixture, EventFixture, FundBountyFixture, SubmitJudgmentFixture, SubmitWorkFixture,
    VetoBountyFixture, WithdrawFundingFixture, WithdrawWorkEntrantFundsFixture,
    WithdrawWorkEntryFixture, DEFAULT_BOUNTY_CHERRY,
};
use mocks::{
    build_test_externalities, Balances, Bounty, ClosedContractSizeLimit, MinFundingLimit, System,
    Test, COUNCIL_BUDGET_ACCOUNT_ID, STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER,
};

const DEFAULT_WINNER_REWARD: u64 = 10;

#[macro_export]
macro_rules! to_origin {
    ($x: tt) => {
        RawOrigin::Signed($x as u128 + 100).into()
    };
}

#[macro_export]
macro_rules! to_account {
    ($x: tt) => {
        $x as u128 + 100
    };
}

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
fn create_bounty_transfers_member_balance_correctly() {
    build_test_externalities().execute_with(|| {
        let member_id = 1;
        let account_id = 1;
        let cherry = 100;
        let initial_balance = 500;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        // Insufficient member controller account balance.
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Module::<Test>::usable_balance(&account_id),
            initial_balance - cherry
        );

        let bounty_id = 1;

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            cherry
        );
    });
}

#[test]
fn create_bounty_transfers_the_council_balance_correctly() {
    build_test_externalities().execute_with(|| {
        let cherry = 100;
        let initial_balance = 500;

        set_council_budget(initial_balance);

        // Insufficient member controller account balance.
        CreateBountyFixture::default()
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        assert_eq!(get_council_budget(), initial_balance - cherry);

        let bounty_id = 1;

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            cherry
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

        // Insufficient council budget.
        CreateBountyFixture::default()
            .with_cherry(cherry)
            .call_and_assert(Err(Error::<Test>::InsufficientBalanceForBounty.into()));

        // Insufficient member controller account balance.
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .with_cherry(cherry)
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

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        assert_eq!(get_council_budget(), initial_balance - cherry);

        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(get_council_budget(), initial_balance);

        EventFixture::contains_crate_event(RawEvent::BountyCreatorCherryWithdrawal(
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
        set_council_budget(500);

        let funding_period = 10;
        CreateBountyFixture::default()
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        run_to_block(funding_period + 1);

        // Funding period expired with no contribution.
        CancelBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));
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
fn veto_bounty_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let cherry = 100;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        assert_eq!(get_council_budget(), initial_balance - cherry);

        VetoBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(get_council_budget(), initial_balance);

        EventFixture::contains_crate_event(RawEvent::BountyCreatorCherryWithdrawal(
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

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);
        increase_total_balance_issuance_using_account_id(
            COUNCIL_BUDGET_ACCOUNT_ID,
            initial_balance,
        );

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
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
            amount + cherry
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

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
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
            initial_balance - amount - cherry
        );

        assert_eq!(
            crate::Module::<Test>::contribution_by_bounty_by_actor(bounty_id, BountyActor::Council),
            amount
        );

        assert_eq!(
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            amount + cherry
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

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);
        increase_total_balance_issuance_using_account_id(
            COUNCIL_BUDGET_ACCOUNT_ID,
            initial_balance,
        );

        CreateBountyFixture::default()
            .with_max_funding_amount(max_amount)
            .with_cherry(cherry)
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
            2 * amount + cherry
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
        let funding_period = 10;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&account_id1, initial_balance);
        increase_account_balance(&account_id2, initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(max_amount, max_amount, funding_period)
            .with_cherry(cherry)
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
            amount + cherry / 2
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
fn bounty_removal_succeeds() {
    build_test_externalities().execute_with(|| {
        let max_amount = 500;
        let amount = 100;
        let initial_balance = 500;
        let cherry = 100;
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
            balances::Module::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
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
                Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawal.into(),
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
                Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawal.into(),
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
        let rationale = b"text".to_vec();

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

        // Third work entry (no works submitted)
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

        assert!(<Entries<Test>>::contains_key(bounty_id, entry_id3));
        assert_eq!(Balances::total_balance(&account_id), initial_balance);

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment.clone())
            .with_rationale(rationale.clone())
            .call_and_assert(Ok(()));

        assert_eq!(
            Bounty::entries(bounty_id, entry_id1).oracle_judgment_result,
            Some(OracleWorkEntryJudgment::Winner { reward: max_amount })
        );
        assert_eq!(
            Bounty::entries(bounty_id, entry_id2).oracle_judgment_result,
            None
        );
        assert!(!<Entries<Test>>::contains_key(bounty_id, entry_id3));
        assert_eq!(
            Balances::total_balance(&account_id),
            initial_balance - entrant_stake
        );

        EventFixture::contains_crate_event(RawEvent::WorkEntrySlashed(bounty_id, entry_id3));
        EventFixture::assert_last_crate_event(RawEvent::OracleJudgmentSubmitted(
            bounty_id,
            BountyActor::Council,
            judgment,
            rationale,
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
            Bounty::entries(bounty_id, entry_id).oracle_judgment_result,
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
fn submit_judgment_dont_return_cherry_on_unsuccessful_bounty() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let max_amount = 100;
        let cherry = DEFAULT_BOUNTY_CHERRY;
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
        let judgment = vec![(entry_id, OracleWorkEntryJudgment::Rejected)]
            .iter()
            .cloned()
            .collect::<BTreeMap<_, _>>();

        assert!(<Entries<Test>>::contains_key(bounty_id, entry_id));

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        assert!(!<Entries<Test>>::contains_key(bounty_id, entry_id));

        // Cherry not returned.
        assert_eq!(
            get_council_budget(),
            initial_balance - max_amount - cherry // initial - funding_amount - cherry
        );
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
        let rationale = b"text".to_vec();

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
            .with_rationale(rationale.clone())
            .call_and_assert(Ok(()));

        EventFixture::assert_last_crate_event(RawEvent::OracleJudgmentSubmitted(
            bounty_id,
            BountyActor::Member(oracle_member_id),
            judgment,
            rationale,
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

fn setup_bounty_environment(oracle_id: u64, creator_id: u64, contributor_id: u64, entrant_id: u64) {
    let initial_balance = 500;
    let max_amount = 100;
    let entrant_stake = 37;
    let work_period = 10;

    increase_account_balance(&to_account!(creator_id), initial_balance);
    CreateBountyFixture::default()
        .with_origin(to_origin!(creator_id))
        .with_max_funding_amount(max_amount)
        .with_creator_member_id(creator_id)
        .with_entrant_stake(entrant_stake)
        .with_oracle_member_id(oracle_id)
        .with_work_period(work_period)
        .call_and_assert(Ok(()));

    let bounty_id = 1;

    increase_account_balance(&to_account!(contributor_id), initial_balance);
    FundBountyFixture::default()
        .with_origin(to_origin!(contributor_id))
        .with_bounty_id(bounty_id)
        .with_amount(max_amount)
        .with_member_id(contributor_id)
        .call_and_assert(Ok(()));

    increase_account_balance(&to_account!(entrant_id), initial_balance);

    AnnounceWorkEntryFixture::default()
        .with_origin(to_origin!(entrant_id))
        .with_member_id(entrant_id)
        .with_staking_account_id(to_account!(entrant_id))
        .with_bounty_id(bounty_id)
        .call_and_assert(Ok(()));
}

#[test]
fn invalid_bounty_creator_cannot_remark() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);
        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let invalid_creator_id = creator_id + 1;
        assert_err!(
            Bounty::creator_remark(
                to_origin!(invalid_creator_id),
                BountyActor::Member(invalid_creator_id),
                1,
                b"test".to_vec(),
            ),
            crate::Error::<Test>::InvalidCreatorActorSpecified,
        );
    })
}

#[test]
fn creator_cannot_remark_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);
        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let invalid_bounty_id = Bounty::bounty_count() as u64 + 1;

        assert_err!(
            Bounty::creator_remark(
                to_origin!(creator_id),
                BountyActor::Member(creator_id),
                invalid_bounty_id,
                b"test".to_vec(),
            ),
            crate::Error::<Test>::BountyDoesntExist,
        );
    })
}

#[test]
fn creator_remark_successful() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);
        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let bounty_id = Bounty::bounty_count() as u64;

        assert_ok!(Bounty::creator_remark(
            to_origin!(creator_id),
            BountyActor::Member(creator_id),
            bounty_id,
            b"test".to_vec(),
        ));
    })
}

#[test]
fn invalid_bounty_oracle_cannot_remark() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);
        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let invalid_oracle_id = oracle_id + 1;
        assert_err!(
            Bounty::oracle_remark(
                to_origin!(invalid_oracle_id),
                BountyActor::Member(invalid_oracle_id),
                1,
                b"test".to_vec(),
            ),
            crate::Error::<Test>::InvalidOracleActorSpecified,
        );
    })
}

#[test]
fn oracle_cannot_remark_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);
        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let invalid_bounty_id = Bounty::bounty_count() as u64 + 1;

        assert_err!(
            Bounty::oracle_remark(
                to_origin!(oracle_id),
                BountyActor::Member(oracle_id),
                invalid_bounty_id,
                b"test".to_vec(),
            ),
            crate::Error::<Test>::BountyDoesntExist,
        );
    })
}

#[test]
fn oracle_remark_successful() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);
        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let bounty_id = Bounty::bounty_count() as u64;

        assert_ok!(Bounty::oracle_remark(
            to_origin!(oracle_id),
            BountyActor::Member(oracle_id),
            bounty_id,
            b"test".to_vec(),
        ));
    })
}

#[test]
fn invalid_bounty_contributor_cannot_remark() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);
        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let invalid_contributor_id = contributor_id + 1;
        assert_err!(
            Bounty::contributor_remark(
                to_origin!(invalid_contributor_id),
                BountyActor::Member(invalid_contributor_id),
                1,
                b"test".to_vec(),
            ),
            crate::Error::<Test>::InvalidContributorActorSpecified,
        );
    })
}

#[test]
fn contributor_cannot_remark_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);
        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let invalid_bounty_id = Bounty::bounty_count() as u64 + 1;

        assert_err!(
            Bounty::contributor_remark(
                to_origin!(contributor_id),
                BountyActor::Member(contributor_id),
                invalid_bounty_id,
                b"test".to_vec(),
            ),
            crate::Error::<Test>::InvalidContributorActorSpecified,
        );
    })
}

#[test]
fn contributor_remark_successful() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);
        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let bounty_id = Bounty::bounty_count() as u64;

        assert_ok!(Bounty::contributor_remark(
            to_origin!(contributor_id),
            BountyActor::Member(contributor_id),
            bounty_id,
            b"test".to_vec(),
        ));
    })
}

#[test]
fn entrant_remark_successful() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);
        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let bounty_id = Bounty::bounty_count() as u64;
        let entry_id = Bounty::entry_count() as u64;

        assert_ok!(Bounty::entrant_remark(
            to_origin!(entrant_id),
            entrant_id,
            bounty_id,
            entry_id,
            b"test".to_vec(),
        ));
    })
}

#[test]
fn entrant_remark_fails_with_invalid_entrant_id() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);
        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let invalid_entrant_id = entrant_id + 1;
        let bounty_id = Bounty::bounty_count() as u64;
        let entry_id = Bounty::entry_count() as u64;

        assert_err!(
            Bounty::entrant_remark(
                to_origin!(invalid_entrant_id),
                invalid_entrant_id,
                bounty_id,
                entry_id,
                b"test".to_vec(),
            ),
            crate::Error::<Test>::InvalidEntrantWorkerSpecified
        );
    })
}

#[test]
fn entrant_remark_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);
        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let entrant_id = entrant_id;
        let invalid_bounty_id = Bounty::bounty_count() as u64 + 1;
        let entry_id = Bounty::entry_count() as u64;

        assert_err!(
            Bounty::entrant_remark(
                to_origin!(entrant_id),
                entrant_id,
                invalid_bounty_id,
                entry_id,
                b"test".to_vec(),
            ),
            crate::Error::<Test>::WorkEntryDoesntExist,
        );
    })
}

#[test]
fn entrant_remark_fails_with_invalid_entry_id() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);
        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let entrant_id = entrant_id;
        let bounty_id = Bounty::bounty_count() as u64;
        let invalid_entry_id = Bounty::entry_count() as u64 + 1;

        assert_err!(
            Bounty::entrant_remark(
                to_origin!(entrant_id),
                entrant_id,
                bounty_id,
                invalid_entry_id,
                b"test".to_vec(),
            ),
            crate::Error::<Test>::WorkEntryDoesntExist,
        );
    })
}
