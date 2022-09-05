#![cfg(test)]

pub(crate) mod fixtures;
pub(crate) mod mocks;

use crate::{
    Bounties, BountyActor, BountyContributions, BountyCreationParameters, BountyMilestone,
    BountyRecord, BountyStage, Entries, Error, FundingType, OracleJudgment,
    OracleWorkEntryJudgment, RawEvent,
};
use fixtures::{
    get_council_budget, get_creator_state_bloat_bond_amount, get_funder_state_bloat_bond_amount,
    increase_account_balance, increase_total_balance_issuance_using_account_id, run_to_block,
    set_council_budget, AnnounceWorkEntryFixture, CreateBountyFixture, EndWorkPeriodFixture,
    EventFixture, FundBountyFixture, SubmitJudgmentFixture, SubmitWorkFixture, SwitchOracleFixture,
    TerminateBountyFixture, WithdrawEntrantStakeFixture, WithdrawFundingFixture,
    WithdrawOracleRewardFixture, DEFAULT_BOUNTY_CHERRY, DEFAULT_BOUNTY_ORACLE_REWARD,
};
use frame_support::storage::{StorageDoubleMap, StorageMap};
use frame_support::{assert_err, assert_ok};
use frame_system::RawOrigin;
use mocks::{
    build_test_externalities, Balances, Bounty, ClosedContractSizeLimit, System, Test,
    COUNCIL_BUDGET_ACCOUNT_ID, INVALID_ACCOUNT_ID, INVALID_MEMBER_ID, MAX_MEMBERS,
    STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER,
};
use sp_runtime::DispatchError;
use sp_runtime::DispatchError::Other;
use sp_runtime::Perbill;
use sp_std::collections::btree_map::BTreeMap;

const DEFAULT_WINNER_REWARD: u64 = 10;

#[macro_export]
macro_rules! to_origin {
    ($x: tt) => {
        RawOrigin::Signed($x as u128).into()
    };
}

#[macro_export]
macro_rules! to_account {
    ($x: tt) => {
        $x as u128
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
                    target: 10,
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
                    target: 10,
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
                    target: 10,
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
            BountyStage::NoFundingContributed
        );
    });
}

#[test]
fn validate_work_submission_bounty_stage() {
    build_test_externalities().execute_with(|| {
        let created_at = 10;
        let funding_period = 10;
        let target_funding = 100;

        // Limited funding period
        let params = BountyCreationParameters::<Test> {
            funding_type: FundingType::Limited {
                funding_period,
                target: target_funding,
            },
            ..Default::default()
        };

        let bounty = BountyRecord {
            creation_params: params.clone(),
            milestone: BountyMilestone::Created {
                created_at,
                has_contributions: true,
            },
            total_funding: target_funding,
            ..Default::default()
        };

        System::set_block_number(created_at + funding_period + 1);

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::WorkSubmission
        );

        // target funding reached.
        let target_funding_reached_at = 30;

        let bounty = BountyRecord {
            creation_params: params,
            milestone: BountyMilestone::BountyMaxFundingReached,
            ..Default::default()
        };

        System::set_block_number(target_funding_reached_at + 1);

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
        let target = 100;

        // Work period is not expired.
        let bounty = BountyRecord {
            creation_params: BountyCreationParameters::<Test> {
                funding_type: FundingType::Limited {
                    funding_period,
                    target,
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

        let invalid_member_id_list: Vec<u64> = (1..=ClosedContractSizeLimit::get())
            .map(|x| {
                if x == ClosedContractSizeLimit::get() {
                    (MAX_MEMBERS + 1).into()
                } else {
                    x.into()
                }
            })
            .collect();

        CreateBountyFixture::default()
            .with_closed_contract(invalid_member_id_list)
            .call_and_assert(Err(Error::<Test>::ClosedContractMemberNotFound.into()));
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
            balances::Pallet::<Test>::usable_balance(&account_id),
            initial_balance - cherry - oracle_reward - get_creator_state_bloat_bond_amount()
        );

        let bounty_id = 1;

        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            cherry + oracle_reward + get_creator_state_bloat_bond_amount()
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
            initial_balance - cherry - oracle_reward - get_creator_state_bloat_bond_amount()
        );

        let bounty_id = 1;

        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            cherry + oracle_reward + get_creator_state_bloat_bond_amount()
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
fn create_bounty_fails_with_invalid_member_controller_account() {
    build_test_externalities().execute_with(|| {
        // For a member bounty.
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(1))
            .with_creator_member_id(INVALID_MEMBER_ID)
            .call_and_assert(Err(Other("origin signer not a member controller account")));
    });
}

#[test]
fn create_bounty_fails_with_invalid_funding_parameters() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default()
            .with_limited_funding(0, 1)
            .call_and_assert(Err(Error::<Test>::FundingAmountCannotBeZero.into()));

        CreateBountyFixture::default()
            .with_limited_funding(1, 0)
            .call_and_assert(Err(Error::<Test>::FundingPeriodCannotBeZero.into()));

        CreateBountyFixture::default()
            .with_perpetual_period_target_amount(0)
            .call_and_assert(Err(Error::<Test>::FundingAmountCannotBeZero.into()));
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
fn create_bounty_fails_with_invalid_oracle_member_id() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default()
            .with_oracle_member_id(9999)
            .call_and_assert(Err(Error::<Test>::InvalidOracleMemberId.into()));
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
fn terminate_bounty_by_creator_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let member_id = 1;
        let account_id = 1;
        let initial_balance = 500;
        let oracle_reward = 0;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        TerminateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&account_id),
            initial_balance
        );

        EventFixture::contains_crate_event(RawEvent::BountyCreatorCherryWithdrawal(
            bounty_id,
            BountyActor::Member(member_id),
        ));

        EventFixture::contains_crate_event(RawEvent::CreatorStateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Member(member_id),
            get_creator_state_bloat_bond_amount(),
        ));

        EventFixture::contains_crate_event(RawEvent::BountyRemoved(bounty_id));

        assert!(!<BountyContributions<Test>>::contains_key(
            &bounty_id,
            BountyActor::Member(member_id)
        ));

        assert!(!<Bounties<Test>>::contains_key(&bounty_id));
    });
}

#[test]
fn terminate_bounty_w_oracle_reward_funding_expired_succeeds() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 500;
        let funding_period = 10;

        let oracle_reward = 10;
        let cherry = 10;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_funding_period(funding_period)
            .with_oracle_reward(oracle_reward)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        run_to_block(funding_period + 1);

        // Funding period expired with no contribution.
        TerminateBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            get_council_budget(),
            initial_balance - oracle_reward - get_creator_state_bloat_bond_amount()
        );
        EventFixture::contains_crate_event(RawEvent::BountyCreatorCherryWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));

        EventFixture::contains_crate_event(RawEvent::BountyTerminated(
            bounty_id,
            BountyActor::Council,
            BountyActor::Council,
            BountyActor::Council,
        ));

        assert!(<Bounties<Test>>::contains_key(&bounty_id));
        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();
        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::FailedBountyWithdrawal
        );
    });
}

#[test]
fn terminate_bounty_wo_oracle_reward_funding_expired_succeeds() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 500;
        let funding_period = 10;
        let oracle_reward = 0;
        let cherry = 10;

        set_council_budget(initial_balance);
        CreateBountyFixture::default()
            .with_funding_period(funding_period)
            .with_oracle_reward(oracle_reward)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        run_to_block(funding_period + 1);

        // Funding period expired with no contribution.
        TerminateBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(get_council_budget(), initial_balance);

        EventFixture::contains_crate_event(RawEvent::BountyCreatorCherryWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));

        EventFixture::contains_crate_event(RawEvent::CreatorStateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Council,
            get_creator_state_bloat_bond_amount(),
        ));

        EventFixture::contains_crate_event(RawEvent::BountyRemoved(bounty_id));

        assert!(!<BountyContributions<Test>>::contains_key(
            &bounty_id,
            BountyActor::Council
        ));

        assert!(!<Bounties<Test>>::contains_key(&bounty_id));
    });
}

#[test]
fn terminate_bounty_w_oracle_reward_wo_funds_funding_succeeds() {
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
            initial_balance - cherry - oracle_reward - get_creator_state_bloat_bond_amount()
        );

        TerminateBountyFixture::default().call_and_assert(Ok(()));

        assert_eq!(
            get_council_budget(),
            initial_balance - oracle_reward - get_creator_state_bloat_bond_amount()
        );

        EventFixture::contains_crate_event(RawEvent::BountyCreatorCherryWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));

        EventFixture::contains_crate_event(RawEvent::BountyTerminated(
            bounty_id,
            BountyActor::Council,
            BountyActor::Council,
            BountyActor::Council,
        ));

        assert!(<Bounties<Test>>::contains_key(&bounty_id));

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();
        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::FailedBountyWithdrawal
        );
    });
}

#[test]
fn terminate_bounty_wo_oracle_reward_wo_funds_funding_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let cherry = 100;
        let oracle_reward = 0;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        assert_eq!(
            get_council_budget(),
            initial_balance - cherry - oracle_reward - get_creator_state_bloat_bond_amount()
        );

        TerminateBountyFixture::default().call_and_assert(Ok(()));

        assert_eq!(get_council_budget(), initial_balance);

        EventFixture::contains_crate_event(RawEvent::BountyCreatorCherryWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));

        EventFixture::contains_crate_event(RawEvent::CreatorStateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Council,
            get_creator_state_bloat_bond_amount(),
        ));

        EventFixture::contains_crate_event(RawEvent::BountyRemoved(bounty_id));

        assert!(!<BountyContributions<Test>>::contains_key(
            &bounty_id,
            BountyActor::Council
        ));

        assert!(!<Bounties<Test>>::contains_key(&bounty_id));
    });
}

#[test]
fn terminate_bounty_w_oracle_reward_w_funds_funding_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let cherry = 100;
        let oracle_reward = 100;
        let amount = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;
        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_council()
            .call_and_assert(Ok(()));

        assert_eq!(
            get_council_budget(),
            initial_balance
                - cherry
                - oracle_reward
                - amount
                - get_creator_state_bloat_bond_amount()
                - get_funder_state_bloat_bond_amount()
        );

        TerminateBountyFixture::default().call_and_assert(Ok(()));

        assert_eq!(
            get_council_budget(),
            initial_balance
                - cherry
                - oracle_reward
                - amount
                - get_creator_state_bloat_bond_amount()
                - get_funder_state_bloat_bond_amount()
        );

        EventFixture::contains_crate_event(RawEvent::BountyTerminated(
            bounty_id,
            BountyActor::Council,
            BountyActor::Council,
            BountyActor::Council,
        ));

        assert!(<Bounties<Test>>::contains_key(&bounty_id));

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();
        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::FailedBountyWithdrawal
        );
    });
}

#[test]
fn terminate_bounty_wo_oracle_reward_w_funds_funding_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let cherry = 100;
        let oracle_reward = 0;
        let amount = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;
        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_council()
            .call_and_assert(Ok(()));

        assert_eq!(
            get_council_budget(),
            initial_balance
                - cherry
                - amount
                - get_creator_state_bloat_bond_amount()
                - get_funder_state_bloat_bond_amount()
        );

        TerminateBountyFixture::default().call_and_assert(Ok(()));

        assert_eq!(
            get_council_budget(),
            initial_balance
                - cherry
                - amount
                - get_creator_state_bloat_bond_amount()
                - get_funder_state_bloat_bond_amount()
        );

        EventFixture::contains_crate_event(RawEvent::BountyTerminated(
            bounty_id,
            BountyActor::Council,
            BountyActor::Council,
            BountyActor::Council,
        ));

        assert!(<Bounties<Test>>::contains_key(&bounty_id));

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();
        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::FailedBountyWithdrawal
        );
    });
}

#[test]
fn terminate_bounty_in_working_period_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let target_funding = 500;

        let funding_amount = 500;

        let initial_balance = 2000;
        let cherry = 200;
        let oracle_reward = 200;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(funding_amount)
            .call_and_assert(Ok(()));

        TerminateBountyFixture::default().call_and_assert(Ok(()));

        assert_eq!(
            get_council_budget(),
            initial_balance
                - funding_amount
                - cherry
                - oracle_reward
                - get_creator_state_bloat_bond_amount()
                - get_funder_state_bloat_bond_amount()
        );

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::FailedBountyWithdrawal
        );

        EventFixture::contains_crate_event(RawEvent::BountyTerminated(
            bounty_id,
            BountyActor::Council,
            BountyActor::Council,
            BountyActor::Council,
        ));
    });
}

#[test]
fn terminate_bountyin_judging_period_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let target_funding = 500;

        let funding_amount = 500;

        let initial_balance = 2000;
        let cherry = 200;
        let oracle_reward = 200;
        let worker_entrant_stake = 200;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
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

        TerminateBountyFixture::default().call_and_assert(Ok(()));

        assert_eq!(
            get_council_budget(),
            initial_balance
                - funding_amount
                - cherry
                - oracle_reward
                - get_creator_state_bloat_bond_amount()
                - get_funder_state_bloat_bond_amount()
        );

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();
        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::FailedBountyWithdrawal
        );

        EventFixture::contains_crate_event(RawEvent::BountyTerminated(
            bounty_id,
            BountyActor::Council,
            BountyActor::Council,
            BountyActor::Council,
        ));
    });
}

#[test]
fn terminate_bounty_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        TerminateBountyFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn terminate_bounty_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let account_id = 1;
        let initial_balance = 500;

        increase_account_balance(&account_id, initial_balance);
        set_council_budget(initial_balance);

        // Created by council - try to cancel with bad origin
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        TerminateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Err(DispatchError::BadOrigin));

        TerminateBountyFixture::default()
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn terminate_bounty_fails_with_invalid_member_controller_account() {
    build_test_externalities().execute_with(|| {
        let account_id = 1;
        let initial_balance = 500;

        increase_account_balance(&account_id, initial_balance);
        set_council_budget(initial_balance);

        // Created by member - try to cancel with bad origin
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(1)
            .call_and_assert(Ok(()));

        TerminateBountyFixture::default()
            .with_origin(RawOrigin::Signed(INVALID_ACCOUNT_ID))
            .call_and_assert(Err(Other("origin signer not a member controller account")));
    });
}

#[test]
fn terminate_bounty_fails_with_invalid_stage() {
    //WorkSubmission (creator not council)
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        let member_id = 1;
        let account_id = 1;
        set_council_budget(initial_balance);
        increase_account_balance(&account_id, initial_balance);
        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        TerminateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedWorkSubmission.into()
            ));
    });

    //Judgment  (creator not council)
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        let member_id = 1;
        let account_id = 1;
        set_council_budget(initial_balance);
        increase_account_balance(&account_id, initial_balance);

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_creator_member_id(member_id)
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        let bounty_id = 1;
        let account_id_2 = 2;
        increase_account_balance(&account_id_2, entrant_stake);
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_staking_account_id(account_id_2)
            .call_and_assert(Ok(()));

        let entry_id = 1;
        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .call_and_assert(Ok(()));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        TerminateBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedJudgment.into()));
    });

    //FailedBountyWithdrawal (all origins)
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(250)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        TerminateBountyFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawal.into(),
        ));
    });

    //SuccessfulBountyWithdrawal (all origins)
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
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
            OracleWorkEntryJudgment::Winner {
                reward: target_funding,
            },
        )]
        .iter()
        .cloned()
        .collect::<BTreeMap<_, _>>();

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        TerminateBountyFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedSuccessfulBountyWithdrawal.into(),
        ));
    });
}

#[test]
fn fund_bounty_succeeds_by_member() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let target_funding = 500;
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
            .with_limit_period_target_amount(target_funding)
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
            balances::Pallet::<Test>::usable_balance(&account_id),
            initial_balance - amount - get_funder_state_bloat_bond_amount()
        );

        assert_eq!(
            crate::Pallet::<Test>::contribution_by_bounty_by_actor(
                bounty_id,
                BountyActor::Member(member_id)
            )
            .amount,
            amount
        );

        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            amount
                + cherry
                + oracle_reward
                + get_funder_state_bloat_bond_amount()
                + get_creator_state_bloat_bond_amount()
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

        let target_funding = 500;
        let amount = 100;
        let initial_balance = 500;
        let cherry = DEFAULT_BOUNTY_CHERRY;
        let oracle_reward = DEFAULT_BOUNTY_ORACLE_REWARD;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
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
            balances::Pallet::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance
                - amount
                - cherry
                - oracle_reward
                - get_funder_state_bloat_bond_amount()
                - get_creator_state_bloat_bond_amount()
        );

        assert_eq!(
            crate::Pallet::<Test>::contribution_by_bounty_by_actor(bounty_id, BountyActor::Council)
                .amount,
            amount
        );

        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            amount
                + cherry
                + oracle_reward
                + get_funder_state_bloat_bond_amount()
                + get_creator_state_bloat_bond_amount()
        );

        EventFixture::assert_last_crate_event(RawEvent::BountyFunded(
            bounty_id,
            BountyActor::Council,
            amount,
        ));
    });
}

#[test]
fn fund_bounty_succeeds_with_reaching_target_funding_amount() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let starting_block = 1;
        run_to_block(starting_block);

        let target_funding = 50;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(amount)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&account_id),
            initial_balance - target_funding - get_funder_state_bloat_bond_amount()
        );

        let bounty = Bounty::bounties(&bounty_id);
        assert_eq!(bounty.milestone, BountyMilestone::BountyMaxFundingReached);

        EventFixture::assert_last_crate_event(RawEvent::BountyMaxFundingReached(bounty_id));
    });
}

#[test]
fn fund_bounty_multiple_contibutors_succeeds() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        let target_funding = 5000;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;
        let cherry = DEFAULT_BOUNTY_CHERRY;
        let oracle_reward = DEFAULT_BOUNTY_ORACLE_REWARD;

        increase_total_balance_issuance_using_account_id(account_id, initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
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
            balances::Pallet::<Test>::usable_balance(&account_id),
            initial_balance - 2 * amount - get_funder_state_bloat_bond_amount()
        );

        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            2 * amount
                + cherry
                + oracle_reward
                + get_funder_state_bloat_bond_amount()
                + get_creator_state_bloat_bond_amount()
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
fn fund_bounty_fails_with_invalid_member_controller_account() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(1))
            .with_member_id(INVALID_MEMBER_ID)
            .call_and_assert(Err(Other("origin signer not a member controller account")));
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
fn fund_bounty_fails_with_invalid_stage() {
    //NoFundingContributed
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
                Error::<Test>::InvalidStageUnexpectedNoFundingContributed.into(),
            ));
    });

    //WorkSubmission
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
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
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
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
        let target_funding = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
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
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
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
            OracleWorkEntryJudgment::Winner {
                reward: target_funding,
            },
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
                Error::<Test>::InvalidStageUnexpectedNoFundingContributed.into(),
            ));
    });
}

#[test]
fn end_working_period_with_entries_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let target_funding = 100;
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
            .with_limit_period_target_amount(target_funding)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        increase_account_balance(&funding_account_id, initial_balance);

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(target_funding)
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
        let target_funding = 100;
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
            .with_limit_period_target_amount(target_funding)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        increase_account_balance(&funding_account_id, initial_balance);

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(target_funding)
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
        let target_funding = 100;
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
            .with_limit_period_target_amount(target_funding)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        increase_account_balance(&funding_account_id, initial_balance);

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(target_funding)
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

    //NoFundingContributed
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
                Error::<Test>::InvalidStageUnexpectedNoFundingContributed.into(),
            ));
    });

    //Judgment
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
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
        let target_funding = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
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
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
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
            OracleWorkEntryJudgment::Winner {
                reward: target_funding,
            },
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
fn end_working_period_fails_with_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;

        set_council_budget(initial_balance);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        let bounty_id = 1u64;

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(1))
            .call_and_assert(Err(DispatchError::BadOrigin));

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn end_working_period_fails_with_invalid_member_controller_account() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let oracle_member_id = 2;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_oracle_member_id(oracle_member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        EndWorkPeriodFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(INVALID_ACCOUNT_ID))
            .call_and_assert(Err(Other("origin signer not a member controller account")));
    });
}

#[test]
fn withdraw_funding_member_with_failed_bounty_with_no_removal() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let funding_period = 10;
        let initial_balance = 500;
        let target_funding = 100;
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
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        increase_account_balance(&funding_account_id, initial_balance);

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(target_funding)
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
            balances::Pallet::<Test>::usable_balance(&funding_account_id),
            initial_balance + cherry
        );

        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - oracle_reward - cherry - get_creator_state_bloat_bond_amount()
        );

        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            oracle_reward + get_creator_state_bloat_bond_amount()
        );

        EventFixture::contains_crate_event(RawEvent::FunderStateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Member(funding_member_id),
            get_funder_state_bloat_bond_amount(),
        ));

        assert!(<Bounties<Test>>::contains_key(&bounty_id));
    });
}

#[test]
fn withdraw_funding_council_with_failed_bounty_with_no_removal() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let target_funding = 500;
        let amount = 100;
        let initial_balance = 500;
        let cherry = 200;
        let funding_period = 10;
        let oracle_member_id = 2;
        let oracle_reward = 10;
        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_cherry(cherry)
            .with_oracle_member_id(oracle_member_id)
            .with_oracle_reward(oracle_reward)
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
            balances::Pallet::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - oracle_reward - get_creator_state_bloat_bond_amount()
        );

        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            oracle_reward + get_creator_state_bloat_bond_amount()
        );

        EventFixture::contains_crate_event(RawEvent::FunderStateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Council,
            get_funder_state_bloat_bond_amount(),
        ));

        assert!(<Bounties<Test>>::contains_key(&bounty_id));
    });
}

#[test]
fn withdraw_funding_member_with_failed_bounty_with_removal() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let target_funding = 500;
        let amount = 100;
        let account_id = 1;
        let member_id = 1;
        let initial_balance = 500;
        let cherry = 200;
        let funding_period = 10;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);
        increase_account_balance(&account_id, initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Signed(account_id))
            .with_member_id(member_id)
            .with_amount(amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + starting_block + 1);

        WithdrawOracleRewardFixture::default().call_and_assert(Ok(()));

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();
        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::FailedBountyWithdrawal
        );

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(member_id)
            .with_origin(RawOrigin::Signed(account_id))
            .call_and_assert(Ok(()));

        EventFixture::contains_crate_event(RawEvent::FunderStateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Member(member_id),
            get_funder_state_bloat_bond_amount(),
        ));

        EventFixture::contains_crate_event(RawEvent::CreatorStateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Council,
            get_creator_state_bloat_bond_amount(),
        ));

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));

        assert!(!<BountyContributions<Test>>::contains_key(
            &bounty_id,
            BountyActor::Member(member_id)
        ));

        assert!(!<Bounties<Test>>::contains_key(&bounty_id));
    });
}

#[test]
fn withdraw_funding_member_with_half_cherry_failed_bounty_no_removal() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let target_funding = 500;
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
            .with_limited_funding(target_funding, funding_period)
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

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();

        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::FailedBountyWithdrawal
        );

        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            get_funder_state_bloat_bond_amount() * 2
                + get_creator_state_bloat_bond_amount()
                + amount * 2
                + cherry
                + oracle_reward
        );

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(member_id1)
            .with_origin(RawOrigin::Signed(account_id1))
            .call_and_assert(Ok(()));

        // A half of the cherry
        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&account_id1),
            initial_balance + cherry / 2
        );

        // On funding amount + creation funding + half of the cherry left.
        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            amount
                + get_funder_state_bloat_bond_amount()
                + get_creator_state_bloat_bond_amount()
                + cherry / 2
                + oracle_reward
        );

        EventFixture::contains_crate_event(RawEvent::FunderStateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Member(member_id1),
            get_funder_state_bloat_bond_amount(),
        ));

        EventFixture::assert_last_crate_event(RawEvent::BountyFundingWithdrawal(
            bounty_id,
            BountyActor::Member(member_id1),
        ));

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_member_id(member_id2)
            .with_origin(RawOrigin::Signed(account_id2))
            .call_and_assert(Ok(()));

        // A half of the cherry
        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&account_id2),
            initial_balance + cherry / 2
        );

        // On funding amount + creation funding + half of the cherry left.
        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            get_creator_state_bloat_bond_amount() + oracle_reward
        );

        EventFixture::contains_crate_event(RawEvent::FunderStateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Member(member_id2),
            get_funder_state_bloat_bond_amount(),
        ));

        EventFixture::assert_last_crate_event(RawEvent::BountyFundingWithdrawal(
            bounty_id,
            BountyActor::Member(member_id2),
        ));
    });
}

#[test]
fn withdraw_funding_member_fails_with_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let invalid_bounty_id = 11u64;

        WithdrawFundingFixture::default()
            .with_bounty_id(invalid_bounty_id)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn withdraw_funding_member_fails_with_invalid_origin() {
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
fn withdraw_funding_member_with_invalid_member_controller_account() {
    build_test_externalities().execute_with(|| {
        set_council_budget(500);

        CreateBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        WithdrawFundingFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(1))
            .with_member_id(INVALID_MEMBER_ID)
            .call_and_assert(Err(Other("origin signer not a member controller account")));
    });
}

#[test]
fn withdraw_funding_member_fails_with_invalid_stage() {
    //NoFundingContributed
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

        WithdrawFundingFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedNoFundingContributed.into(),
            ));
    });
    //Funding
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        let target_funding = 500;
        run_to_block(starting_block);

        let initial_balance = 500;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_perpetual_period_target_amount(target_funding)
            .call_and_assert(Ok(()));

        let funding_amount = 200;
        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(funding_amount)
            .call_and_assert(Ok(()));

        WithdrawFundingFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedFunding.into()));
    });

    //WorkSubmission
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        WithdrawFundingFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedWorkSubmission.into()
            ));
    });

    //Judgment
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
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
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedJudgment.into()));
    });
}

#[test]
fn withdraw_funding_member_fails_with_invalid_bounty_funder() {
    //NoFundingContributed
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let target_funding = 500;
        let initial_balance = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .call_and_assert(Ok(()));

        let funding_amount = 200;
        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(funding_amount)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 10);
        WithdrawFundingFixture::default()
            .with_origin(RawOrigin::Signed(2))
            .with_member_id(2)
            .call_and_assert(Err(Error::<Test>::NoBountyContributionFound.into()));
    });
}

#[test]
fn withdraw_funding_state_bloat_bond_with_successful_bounty_with_no_removal() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let target_funding = 900;

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
            .with_limit_period_target_amount(target_funding)
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
            OracleWorkEntryJudgment::Winner {
                reward: target_funding,
            },
        );

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance
                - oracle_reward
                - 2 * funding_amount
                - get_funder_state_bloat_bond_amount()
                - get_creator_state_bloat_bond_amount()
        );

        assert_eq!(
            Balances::usable_balance(&funder_account),
            initial_balance - funding_amount - get_funder_state_bloat_bond_amount()
        );

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();
        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::SuccessfulBountyWithdrawal
        );

        WithdrawFundingFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Ok(()));

        WithdrawFundingFixture::default()
            .with_origin(RawOrigin::Signed(funder_account))
            .with_member_id(funder_member_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance
                - oracle_reward
                - 2 * funding_amount
                - get_creator_state_bloat_bond_amount()
        );

        assert_eq!(
            Balances::usable_balance(&funder_account),
            initial_balance - funding_amount
        );

        EventFixture::contains_crate_event(RawEvent::FunderStateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Council,
            get_funder_state_bloat_bond_amount(),
        ));

        EventFixture::contains_crate_event(RawEvent::FunderStateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Member(funder_member_id),
            get_funder_state_bloat_bond_amount(),
        ));

        assert!(<Bounties<Test>>::contains_key(&bounty_id));
    });
}

#[test]
fn withdraw_funding_state_bloat_bond_with_successful_bounty_removal() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let target_funding = 900;

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
            .with_limit_period_target_amount(target_funding)
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
            OracleWorkEntryJudgment::Winner {
                reward: target_funding,
            },
        );

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance
                - oracle_reward
                - 2 * funding_amount
                - get_funder_state_bloat_bond_amount()
                - get_creator_state_bloat_bond_amount()
        );

        assert_eq!(
            Balances::usable_balance(&funder_account),
            initial_balance - funding_amount - get_funder_state_bloat_bond_amount()
        );

        let bounty = Bounty::ensure_bounty_exists(&bounty_id).unwrap();
        assert_eq!(
            Bounty::get_bounty_stage(&bounty),
            BountyStage::SuccessfulBountyWithdrawal
        );

        WithdrawOracleRewardFixture::default().call_and_assert(Ok(()));

        WithdrawFundingFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Ok(()));

        WithdrawFundingFixture::default()
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

        EventFixture::contains_crate_event(RawEvent::FunderStateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Council,
            get_funder_state_bloat_bond_amount(),
        ));

        EventFixture::contains_crate_event(RawEvent::FunderStateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Member(funder_member_id),
            get_funder_state_bloat_bond_amount(),
        ));

        EventFixture::contains_crate_event(RawEvent::CreatorStateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Council,
            get_creator_state_bloat_bond_amount(),
        ));

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));

        assert!(!<BountyContributions<Test>>::contains_key(
            &bounty_id,
            BountyActor::Member(funder_member_id)
        ));

        assert!(!<BountyContributions<Test>>::contains_key(
            &bounty_id,
            BountyActor::Council
        ));

        assert!(!<Bounties<Test>>::contains_key(&bounty_id));
    });
}

#[test]
fn announce_work_entry_succeeded() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let target_funding = 100;
        let entrant_stake = 37;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(target_funding)
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
            .with_work_description(b"work_ description".to_vec())
            .call_and_assert(Ok(()));

        assert_eq!(
            Balances::usable_balance(&account_id),
            initial_balance - entrant_stake
        );

        let entry_id = 1;

        EventFixture::assert_last_crate_event(RawEvent::WorkEntryAnnounced(
            entry_id,
            bounty_id,
            member_id,
            account_id,
            b"work_ description".to_vec(),
        ));
    });
}

#[test]
fn announce_work_entry_failed_with_closed_contract() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 500;
        let target_funding = 100;
        let entrant_stake = 37;

        let closed_contract_member_ids = vec![2, 3];

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
            .with_entrant_stake(entrant_stake)
            .with_closed_contract(closed_contract_member_ids)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(target_funding)
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
fn announce_work_entry_fails_with_invalid_member_controller_account() {
    build_test_externalities().execute_with(|| {
        let bounty_id = 1u64;
        AnnounceWorkEntryFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(1))
            .with_member_id(INVALID_MEMBER_ID)
            .call_and_assert(Err(Other("origin signer not a member controller account")));
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

    //NoFundingContributed
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
            Error::<Test>::InvalidStageUnexpectedNoFundingContributed.into(),
        ));
    });

    //Judgment
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
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
        let target_funding = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
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
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
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
            OracleWorkEntryJudgment::Winner {
                reward: target_funding,
            },
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
        let target_funding = 100;
        let entrant_stake = 37;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(target_funding)
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
        let target_funding = 100;
        let entrant_stake = 37;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        let member_id = 1;
        let account_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(target_funding)
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
        let target_funding = 100;
        let entrant_stake = 37;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(target_funding)
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

        let bounty_id = 1;

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
fn submit_work_fails_invalid_member_controller_account() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let bounty_id = 1;
        let entry_id = 1;

        SubmitWorkFixture::default()
            .with_entry_id(entry_id)
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(1))
            .with_member_id(INVALID_MEMBER_ID)
            .call_and_assert(Err(Other("origin signer not a member controller account")));
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

    //NoFundingContributed
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
            Error::<Test>::InvalidStageUnexpectedNoFundingContributed.into(),
        ));
    });

    //Judgment
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
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
        let target_funding = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
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
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
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
            OracleWorkEntryJudgment::Winner {
                reward: target_funding,
            },
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
        let target_funding = 200;
        let entrant_stake = 37;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(target_funding)
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
        let target_funding = 100;
        let entrant_stake = 37;
        let oracle_member_id = 5;
        let oracle_account_id = 5;
        let oracle_reward = 10;
        let cherry = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
            .with_entrant_stake(entrant_stake)
            .with_oracle_member_id(oracle_member_id)
            .with_oracle_reward(oracle_reward)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        assert_eq!(
            Balances::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - oracle_reward - cherry - get_creator_state_bloat_bond_amount()
        );
        assert_eq!(Balances::usable_balance(&oracle_account_id), 0);
        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(target_funding)
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
            OracleWorkEntryJudgment::Winner {
                reward: target_funding,
            },
        );

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        //Cherry returned to creator (council) and oracle gets the oracle reward
        assert_eq!(
            Balances::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance
                - oracle_reward
                - target_funding
                - get_funder_state_bloat_bond_amount()
                - get_creator_state_bloat_bond_amount()
        );

        assert_eq!(Balances::usable_balance(&oracle_account_id), 0);

        assert_eq!(
            Balances::usable_balance(&work_account_id_1),
            initial_balance + target_funding
        );

        EventFixture::contains_crate_event(RawEvent::WorkEntrantFundsWithdrawn(
            bounty_id,
            entry_id_1,
            work_member_id_1,
        ));

        EventFixture::contains_crate_event(RawEvent::BountyCreatorCherryWithdrawal(
            bounty_id,
            BountyActor::Council,
        ));

        EventFixture::contains_crate_event(RawEvent::OracleJudgmentSubmitted(
            bounty_id,
            BountyActor::Member(oracle_member_id),
            judgment,
            Vec::new(),
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
        let target_funding = 100;
        let entrant_stake = 37;
        let oracle_reward = 10;
        let cherry = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
            .with_entrant_stake(entrant_stake)
            .with_oracle_reward(oracle_reward)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(target_funding)
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
            OracleWorkEntryJudgment::Winner {
                reward: target_funding,
            },
        );

        let slashing_share_entry_2 = Perbill::from_percent(50);
        let reason_entry_2 = b"This worker failed a bit and must be slashed 50%".to_vec();
        judgment.insert(
            entry_id_2,
            OracleWorkEntryJudgment::Rejected {
                slashing_share: slashing_share_entry_2,
                action_justification: reason_entry_2,
            },
        );

        let slashing_share_entry_3 = Perbill::from_percent(30);
        let reason_entry_3 = b"This worker failed a bit and must be slashed 30%".to_vec();
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
            initial_balance
                - oracle_reward
                - target_funding
                - get_funder_state_bloat_bond_amount()
                - get_creator_state_bloat_bond_amount()
        );

        assert_eq!(
            Balances::free_balance(&worker_account_id_1),
            initial_balance + target_funding
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_1),
            initial_balance + target_funding
        );

        EventFixture::contains_crate_event(RawEvent::WorkEntrantFundsWithdrawn(
            bounty_id,
            entry_id_1,
            worker_member_id_1,
        ));

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

        EventFixture::contains_crate_event(RawEvent::WorkEntrantStakeSlashed(
            bounty_id,
            entry_id_2,
            worker_account_id_2,
            amount_slashed_entry_2,
        ));

        EventFixture::contains_crate_event(RawEvent::WorkEntrantStakeSlashed(
            bounty_id,
            entry_id_3,
            worker_account_id_3,
            amount_slashed_entry_3,
        ));

        EventFixture::contains_crate_event(RawEvent::OracleJudgmentSubmitted(
            bounty_id,
            BountyActor::Council,
            judgment,
            Vec::new(),
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
        let target_funding = 100;
        let entrant_stake = 37;
        let oracle_member_id = 5;
        let oracle_account_id = 5;
        let oracle_reward = 10;
        let cherry = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
            .with_entrant_stake(entrant_stake)
            .with_oracle_member_id(oracle_member_id)
            .with_oracle_reward(oracle_reward)
            .with_cherry(cherry)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(target_funding)
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
            OracleWorkEntryJudgment::Winner {
                reward: target_funding,
            },
        );

        let slashing_share_entry_2 = Perbill::from_percent(50);
        let reason_entry_2 = b"This worker failed a bit and must be slashed 50%".to_vec();
        judgment.insert(
            entry_id_2,
            OracleWorkEntryJudgment::Rejected {
                slashing_share: slashing_share_entry_2,
                action_justification: reason_entry_2,
            },
        );

        let slashing_share_entry_3 = Perbill::from_percent(30);
        let reason_entry_3 = b"This worker failed a bit and must be slashed 30%".to_vec();
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
            initial_balance
                - oracle_reward
                - target_funding
                - get_funder_state_bloat_bond_amount()
                - get_creator_state_bloat_bond_amount()
        );
        assert_eq!(Balances::usable_balance(&oracle_account_id), 0);

        assert_eq!(
            Balances::free_balance(&worker_account_id_1),
            initial_balance + target_funding
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_1),
            initial_balance + target_funding
        );

        EventFixture::contains_crate_event(RawEvent::WorkEntrantFundsWithdrawn(
            bounty_id,
            entry_id_1,
            worker_member_id_1,
        ));

        let amount_slashed_entry_2 = slashing_share_entry_2 * entrant_stake;
        EventFixture::contains_crate_event(RawEvent::WorkEntrantStakeSlashed(
            bounty_id,
            entry_id_2,
            worker_account_id_2,
            amount_slashed_entry_2,
        ));

        let amount_slashed_entry_3 = slashing_share_entry_3 * entrant_stake;
        EventFixture::contains_crate_event(RawEvent::WorkEntrantStakeSlashed(
            bounty_id,
            entry_id_3,
            worker_account_id_3,
            amount_slashed_entry_3,
        ));

        assert_eq!(
            Balances::free_balance(&worker_account_id_2),
            initial_balance - amount_slashed_entry_2
        );
        assert_eq!(
            Balances::usable_balance(&worker_account_id_2),
            initial_balance - amount_slashed_entry_2
        );

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
            Vec::new(),
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
            .with_limit_period_target_amount(reward)
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
        let reason = b"This worker failed but won't be slashed".to_vec();
        judgment.insert(
            entry_id,
            OracleWorkEntryJudgment::Rejected {
                slashing_share,
                action_justification: reason,
            },
        );

        assert!(<Entries<Test>>::contains_key(bounty_id, entry_id));

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        assert!(!<Entries<Test>>::contains_key(bounty_id, entry_id));

        //oracle receives an oracle reward
        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&oracle_account_id),
            0
        );

        //council doesn't receive back the oracle reward nor the cherry
        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID),
            initial_balance - oracle_reward - cherry - get_creator_state_bloat_bond_amount()
        );

        //funder account receives back the reward and a cherry fraction on withdrwal not now
        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&funding_account_id),
            initial_balance - reward - get_funder_state_bloat_bond_amount()
        );

        //worker account receives his stake now (if not slashed)
        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&worker_account_id),
            entrant_stake
        );

        //bounty account still has reward and the cherry.
        assert_eq!(
            balances::Pallet::<Test>::usable_balance(&Bounty::bounty_account_id(bounty_id)),
            oracle_reward
                + reward
                + cherry
                + get_funder_state_bloat_bond_amount()
                + get_creator_state_bloat_bond_amount()
        );

        EventFixture::contains_crate_event(RawEvent::WorkEntrantStakeSlashed(
            bounty_id,
            entry_id,
            worker_account_id,
            0,
        ));

        EventFixture::assert_last_crate_event(RawEvent::OracleJudgmentSubmitted(
            bounty_id,
            BountyActor::Member(oracle_member_id),
            judgment,
            Vec::new(),
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
fn submit_judgment_fails_with_invalid_member_controller_account() {
    build_test_externalities().execute_with(|| {
        let member_id = 1;
        let account_id = 1;
        let initial_balance = 500;

        increase_account_balance(&account_id, initial_balance);
        set_council_budget(initial_balance);

        // Oracle is set to a member - try to submit judgment with invalid member_id
        CreateBountyFixture::default()
            .with_oracle_member_id(member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(INVALID_ACCOUNT_ID))
            .call_and_assert(Err(Other("origin signer not a member controller account")));
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

    //NoFundingContributed
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
            Error::<Test>::InvalidStageUnexpectedNoFundingContributed.into(),
        ));
    });

    //FailedBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;
        let funding_period = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
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
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);
        SubmitJudgmentFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedWorkSubmission.into(),
        ));
    });

    //SuccessfulBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
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
            OracleWorkEntryJudgment::Winner {
                reward: target_funding,
            },
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
        let target_funding = 100;
        let entrant_stake = 37;

        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1;
        let member_id = 1;
        let account_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(target_funding)
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
        let invalid_reward = target_funding * 2;
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
        let winner_reward = target_funding;
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
fn switch_oracle_to_council_by_council_successful() {
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

        EventFixture::assert_last_crate_event(RawEvent::BountyOracleSwitched(
            bounty_id,
            BountyActor::Council,
            BountyActor::Member(actual_oracle_member_id),
            BountyActor::Council,
        ));
    });
}

#[test]
fn switch_oracle_to_member_by_oracle_council_successful() {
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

        EventFixture::assert_last_crate_event(RawEvent::BountyOracleSwitched(
            bounty_id,
            BountyActor::Council,
            BountyActor::Council,
            BountyActor::Member(new_oracle_member_id),
        ));
    });
}

#[test]
fn switch_oracle_to_member_by_council_successful() {
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

        EventFixture::assert_last_crate_event(RawEvent::BountyOracleSwitched(
            bounty_id,
            BountyActor::Council,
            BountyActor::Member(current_oracle_member_id),
            BountyActor::Member(new_oracle_member_id),
        ));
    });
}

#[test]
fn switch_oracle_to_council_by_oracle_member_successful() {
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

        EventFixture::assert_last_crate_event(RawEvent::BountyOracleSwitched(
            bounty_id,
            BountyActor::Member(actual_oracle_member_id),
            BountyActor::Member(actual_oracle_member_id),
            BountyActor::Member(new_oracle_member_id),
        ));
    });
}

#[test]
fn switch_oracle_fails_with_invalid_origin() {
    //By Member
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
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn switch_oracle_fails_with_invalid_member_controller_of_current_oracle() {
    //By Member
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
            .with_origin(RawOrigin::Signed(INVALID_ACCOUNT_ID))
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn switch_oracle_fails_with_invalid_new_oracle_member_id() {
    //By Member
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let current_oracle_member_id = 2;
        let current_oracle_account_id = 2;

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
            .with_origin(RawOrigin::Signed(current_oracle_account_id))
            .with_new_oracle_member_id(BountyActor::Member(INVALID_MEMBER_ID))
            .call_and_assert(Err(membership::Error::<Test>::MemberProfileNotFound.into()));
    });
}

#[test]
fn switch_oracle_fails_invalid_stage() {
    //SuccessfulBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        let target_funding = 100;
        let winner_reward = target_funding;
        let entrant_stake = 37;
        let actual_oracle_account_id = 5;
        let actual_oracle_member_id = 5;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
            .with_entrant_stake(entrant_stake)
            .with_oracle_member_id(actual_oracle_member_id)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(target_funding)
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
            .with_origin(RawOrigin::Signed(actual_oracle_account_id))
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
            .with_origin(RawOrigin::Signed(actual_oracle_account_id))
            .with_bounty_id(bounty_id)
            .with_judgment(judgment)
            .call_and_assert(Ok(()));
        let new_oracle_member_id = 2;

        SwitchOracleFixture::default()
            .with_origin(RawOrigin::Signed(actual_oracle_account_id))
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedSuccessfulBountyWithdrawal.into(),
            ));
    });

    //NoFundingContributed
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        let actual_oracle_account_id = 5;
        let actual_oracle_member_id = 5;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_oracle_member_id(actual_oracle_member_id)
            .with_funding_period(funding_period)
            .call_and_assert(Ok(()));

        run_to_block(starting_block + funding_period + 1);
        let new_oracle_member_id = 2;
        let bounty_id = 1;

        SwitchOracleFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Signed(actual_oracle_account_id))
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedNoFundingContributed.into(),
            ));
    });

    //FailedBountyWithdrawal
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        let target_funding = 500;
        let actual_oracle_account_id = 5;
        let actual_oracle_member_id = 5;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_oracle_member_id(actual_oracle_member_id)
            .with_limited_funding(target_funding, funding_period)
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
            .with_origin(RawOrigin::Signed(actual_oracle_account_id))
            .with_new_oracle_member_id(BountyActor::Member(new_oracle_member_id))
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedFailedBountyWithdrawal.into(),
            ));
    });
}

#[test]
fn withdraw_entrant_stake_succeeds_after_terminating_in_working_period() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let target_funding = 500;

        let funding_amount = 500;

        let initial_balance = 2000;
        let cherry = 200;
        let oracle_reward = 200;
        let worker_entrant_stake = 200;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
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
        WithdrawEntrantStakeFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Ok(()));

        WithdrawEntrantStakeFixture::default()
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

        assert!(Bounties::<Test>::contains_key(&bounty_id));
    });
}

#[test]
fn withdraw_entrant_stake_succeeds_after_terminating_in_judging_period() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let target_funding = 500;

        let funding_amount = 500;

        let initial_balance = 2000;
        let cherry = 200;
        let oracle_reward = 200;
        let worker_entrant_stake = 200;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
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
        WithdrawEntrantStakeFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Ok(()));

        WithdrawEntrantStakeFixture::default()
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
        assert!(Bounties::<Test>::contains_key(&bounty_id));
    });
}

#[test]
fn withdraw_entrant_stake_succeeds_after_judging() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let target_funding = 500;

        let funding_amount = 500;

        let initial_balance = 2000;
        let cherry = 200;
        let oracle_reward = 200;
        let worker_entrant_stake = 200;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
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
        let reason_entry_1 = Vec::new();
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

        WithdrawEntrantStakeFixture::default()
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
        assert!(Bounties::<Test>::contains_key(&bounty_id));
    });
}

#[test]
fn withdraw_entrant_stake_fails_invalid_entry_ownership() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let target_funding = 500;

        let funding_amount = 500;

        let initial_balance = 2000;
        let cherry = 200;
        let oracle_reward = 200;
        let worker_entrant_stake = 200;

        increase_account_balance(&COUNCIL_BUDGET_ACCOUNT_ID, initial_balance);

        CreateBountyFixture::default()
            .with_limit_period_target_amount(target_funding)
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

        WithdrawEntrantStakeFixture::default()
            .with_origin(RawOrigin::Signed(worker_account_id_1))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_2)
            .call_and_assert(Err(Error::<Test>::WorkEntryDoesntBelongToWorker.into()));
    });
}

#[test]
fn withdraw_entrant_stake_fails_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let worker_member_id_1 = 1;
        let entry_id_1 = 1;

        WithdrawEntrantStakeFixture::default()
            .with_origin(RawOrigin::Root)
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Err(DispatchError::BadOrigin));

        WithdrawEntrantStakeFixture::default()
            .with_origin(RawOrigin::None)
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn withdraw_entrant_stake_fails_with_invalid_member_controller_account() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let worker_member_id_1 = 1;
        let entry_id_1 = 1;

        WithdrawEntrantStakeFixture::default()
            .with_origin(RawOrigin::Signed(INVALID_ACCOUNT_ID))
            .with_member_id(worker_member_id_1)
            .with_entry_id(entry_id_1)
            .call_and_assert(Err(Other("origin signer not a member controller account")));
    });
}

#[test]
fn withdraw_entrant_stake_fails_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        WithdrawEntrantStakeFixture::default()
            .with_bounty_id(2)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn withdraw_entrant_stake_fails_invalid_stage() {
    //Funding
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        set_council_budget(initial_balance);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        WithdrawEntrantStakeFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedFunding.into()));
    });

    //NoFundingContributed
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

        WithdrawEntrantStakeFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedNoFundingContributed.into(),
        ));
    });

    //WorkSubmission
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);
        WithdrawEntrantStakeFixture::default().call_and_assert(Err(
            Error::<Test>::InvalidStageUnexpectedWorkSubmission.into(),
        ));
    });

    //Judgment
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
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

        WithdrawEntrantStakeFixture::default()
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedJudgment.into()));
    });
}

#[test]
fn withdraw_oracle_reward_cancelled_bounty_succeeds() {
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
            initial_balance - cherry - oracle_reward - get_creator_state_bloat_bond_amount()
        );

        TerminateBountyFixture::default()
            .with_bounty_id(bounty_id)
            .call_and_assert(Ok(()));

        assert_eq!(
            get_council_budget(),
            initial_balance - oracle_reward - get_creator_state_bloat_bond_amount()
        );

        EventFixture::contains_crate_event(RawEvent::BountyTerminated(
            bounty_id,
            BountyActor::Council,
            BountyActor::Council,
            BountyActor::Council,
        ));

        assert!(<Bounties<Test>>::contains_key(&bounty_id));

        WithdrawOracleRewardFixture::default().call_and_assert(Ok(()));

        assert!(!<Bounties<Test>>::contains_key(&bounty_id));

        EventFixture::contains_crate_event(RawEvent::BountyOracleRewardWithdrawal(
            bounty_id,
            BountyActor::Council,
            oracle_reward,
        ));

        EventFixture::contains_crate_event(RawEvent::CreatorStateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Council,
            get_creator_state_bloat_bond_amount(),
        ));

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));

        assert!(!<BountyContributions<Test>>::contains_key(
            &bounty_id,
            BountyActor::Council
        ));

        assert!(!<Bounties<Test>>::contains_key(&bounty_id));
    });
}

#[test]
fn withdraw_oracle_reward_successful_bounty_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let target_funding = 900;

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
            .with_limit_period_target_amount(target_funding)
            .with_cherry(cherry)
            .with_oracle_reward(oracle_reward)
            .with_entrant_stake(worker_entrant_stake)
            .call_and_assert(Ok(()));

        let bounty_id = 1u64;

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
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
            OracleWorkEntryJudgment::Winner {
                reward: target_funding,
            },
        );

        SubmitJudgmentFixture::default()
            .with_bounty_id(bounty_id)
            .with_origin(RawOrigin::Root)
            .with_judgment(judgment.clone())
            .call_and_assert(Ok(()));

        WithdrawFundingFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Ok(()));

        WithdrawOracleRewardFixture::default().call_and_assert(Ok(()));

        assert!(!<Bounties<Test>>::contains_key(&bounty_id));

        EventFixture::contains_crate_event(RawEvent::BountyOracleRewardWithdrawal(
            bounty_id,
            BountyActor::Council,
            oracle_reward,
        ));

        EventFixture::contains_crate_event(RawEvent::CreatorStateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Council,
            get_creator_state_bloat_bond_amount(),
        ));

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));

        assert!(!<BountyContributions<Test>>::contains_key(
            &bounty_id,
            BountyActor::Council
        ));

        assert!(!<Bounties<Test>>::contains_key(&bounty_id));
    });
}

#[test]
fn withdraw_oracle_reward_failed_bounty_succeeds() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        let target_funding = 500;
        let oracle_member_id = 5;
        let oracle_account_id = 5;
        let oracle_reward = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_oracle_member_id(oracle_member_id)
            .with_limited_funding(target_funding, funding_period)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(250)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        run_to_block(starting_block + funding_period + 1);

        WithdrawFundingFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .call_and_assert(Ok(()));

        WithdrawOracleRewardFixture::default()
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .call_and_assert(Ok(()));

        assert!(!<Bounties<Test>>::contains_key(&bounty_id));

        EventFixture::contains_crate_event(RawEvent::BountyOracleRewardWithdrawal(
            bounty_id,
            BountyActor::Member(oracle_member_id),
            oracle_reward,
        ));

        EventFixture::contains_crate_event(RawEvent::CreatorStateBloatBondWithdrawn(
            bounty_id,
            BountyActor::Council,
            get_creator_state_bloat_bond_amount(),
        ));

        EventFixture::assert_last_crate_event(RawEvent::BountyRemoved(bounty_id));

        assert!(!<BountyContributions<Test>>::contains_key(
            &bounty_id,
            BountyActor::Council
        ));

        assert!(!<Bounties<Test>>::contains_key(&bounty_id));
    });
}

#[test]
fn withdraw_oracle_reward_zero_amount_fails() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        let target_funding = 500;
        let oracle_member_id = 5;
        let oracle_account_id = 5;
        let oracle_reward = 0;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_oracle_member_id(oracle_member_id)
            .with_limited_funding(target_funding, funding_period)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(250)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        run_to_block(starting_block + funding_period + 1);

        WithdrawOracleRewardFixture::default()
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .call_and_assert(Err(Error::<Test>::OracleRewardAlreadyWithdrawn.into()));
    });
}

#[test]
fn withdraw_oracle_reward_multiple_times_fails() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        let initial_balance = 500;
        let funding_period = 10;
        let target_funding = 500;
        let oracle_member_id = 5;
        let oracle_account_id = 5;
        let oracle_reward = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_oracle_member_id(oracle_member_id)
            .with_limited_funding(target_funding, funding_period)
            .with_oracle_reward(oracle_reward)
            .call_and_assert(Ok(()));

        let bounty_id = 1;

        FundBountyFixture::default()
            .with_bounty_id(bounty_id)
            .with_amount(250)
            .with_council()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Ok(()));

        run_to_block(starting_block + funding_period + 1);

        WithdrawOracleRewardFixture::default()
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .call_and_assert(Ok(()));

        WithdrawOracleRewardFixture::default()
            .with_origin(RawOrigin::Signed(oracle_account_id))
            .call_and_assert(Err(Error::<Test>::OracleRewardAlreadyWithdrawn.into()));
    });
}

#[test]
fn withdraw_oracle_reward_fails_invalid_bounty_id() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);
        WithdrawOracleRewardFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(Error::<Test>::BountyDoesntExist.into()));
    });
}

#[test]
fn withdraw_oracle_reward_fails_invalid_stage() {
    //Funding
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let initial_balance = 500;
        set_council_budget(initial_balance);

        CreateBountyFixture::default().call_and_assert(Ok(()));

        WithdrawOracleRewardFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedFunding.into()));
    });

    //NoFundingContributed
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

        WithdrawOracleRewardFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedNoFundingContributed.into(),
            ));
    });

    //WorkSubmission
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;

        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
            .call_and_assert(Ok(()));

        run_to_block(funding_period + 1);

        WithdrawOracleRewardFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(
                Error::<Test>::InvalidStageUnexpectedWorkSubmission.into()
            ));
    });

    //Judgment
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .call_and_assert(Ok(()));

        FundBountyFixture::default()
            .with_origin(RawOrigin::Root)
            .with_council()
            .with_amount(target_funding)
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

        WithdrawOracleRewardFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(Error::<Test>::InvalidStageUnexpectedJudgment.into()));
    });
}

#[test]
fn withdraw_oracle_reward_fails_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        let oracle_member_id = 5;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .with_oracle_member_id(oracle_member_id)
            .call_and_assert(Ok(()));

        WithdrawOracleRewardFixture::default()
            .with_origin(RawOrigin::Root)
            .call_and_assert(Err(DispatchError::BadOrigin));

        WithdrawOracleRewardFixture::default()
            .with_origin(RawOrigin::None)
            .call_and_assert(Err(DispatchError::BadOrigin));
    });
}

#[test]
fn withdraw_oracle_reward_fails_with_invalid_member_controller_account() {
    build_test_externalities().execute_with(|| {
        let initial_balance = 1000;
        let target_funding = 500;
        let funding_period = 10;
        let entrant_stake = 10;
        let oracle_member_id = 5;
        set_council_budget(initial_balance);

        CreateBountyFixture::default()
            .with_limited_funding(target_funding, funding_period)
            .with_entrant_stake(entrant_stake)
            .with_oracle_member_id(oracle_member_id)
            .call_and_assert(Ok(()));

        WithdrawOracleRewardFixture::default()
            .with_origin(RawOrigin::Signed(INVALID_ACCOUNT_ID))
            .call_and_assert(Err(Other("origin signer not a member controller account")));
    });
}

fn setup_bounty_environment(oracle_id: u64, creator_id: u64, contributor_id: u64, entrant_id: u64) {
    let initial_balance = 500;
    let target_amount = 100;
    let entrant_stake = 37;

    increase_account_balance(&to_account!(creator_id), initial_balance);
    CreateBountyFixture::default()
        .with_origin(to_origin!(creator_id))
        .with_perpetual_period_target_amount(target_amount)
        .with_creator_member_id(creator_id)
        .with_entrant_stake(entrant_stake)
        .with_oracle_member_id(oracle_id)
        .call_and_assert(Ok(()));

    let bounty_id = 1;

    increase_account_balance(&to_account!(contributor_id), initial_balance);
    FundBountyFixture::default()
        .with_origin(to_origin!(contributor_id))
        .with_bounty_id(bounty_id)
        .with_amount(target_amount)
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
fn creator_remark_fails_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);

        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let bounty_id = Bounty::bounty_count() as u64;

        assert_err!(
            Bounty::creator_remark(
                RawOrigin::None.into(),
                BountyActor::Council,
                bounty_id,
                b"test".to_vec(),
            ),
            DispatchError::BadOrigin
        );
    });
}

#[test]
fn creator_remark_fails_invalid_member_controller_account() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);
        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let bounty_id = Bounty::bounty_count() as u64;

        assert_err!(
            Bounty::creator_remark(
                to_origin!(creator_id),
                BountyActor::Member(INVALID_MEMBER_ID),
                bounty_id,
                b"test".to_vec(),
            ),
            DispatchError::Other("origin signer not a member controller account")
        );
    });
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
fn oracle_remark_fails_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);

        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let bounty_id = Bounty::bounty_count() as u64;

        assert_err!(
            Bounty::oracle_remark(
                RawOrigin::None.into(),
                BountyActor::Council,
                bounty_id,
                b"test".to_vec(),
            ),
            DispatchError::BadOrigin
        );
    });
}

#[test]
fn oracle_remark_fails_invalid_member_controller_account() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);
        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let bounty_id = Bounty::bounty_count() as u64;

        assert_err!(
            Bounty::oracle_remark(
                to_origin!(oracle_id),
                BountyActor::Member(INVALID_MEMBER_ID),
                bounty_id,
                b"test".to_vec(),
            ),
            DispatchError::Other("origin signer not a member controller account")
        );
    });
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
fn contributor_remark_fails_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);

        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let bounty_id = Bounty::bounty_count() as u64;

        assert_err!(
            Bounty::contributor_remark(
                RawOrigin::None.into(),
                BountyActor::Council,
                bounty_id,
                b"test".to_vec(),
            ),
            DispatchError::BadOrigin
        );
    });
}

#[test]
fn contributor_remark_fails_invalid_member_controller_account() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);
        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let bounty_id = Bounty::bounty_count() as u64;

        assert_err!(
            Bounty::contributor_remark(
                to_origin!(contributor_id),
                BountyActor::Member(INVALID_MEMBER_ID),
                bounty_id,
                b"test".to_vec(),
            ),
            DispatchError::Other("origin signer not a member controller account")
        );
    });
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

#[test]
fn entrant_remark_fails_invalid_origin() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);

        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let bounty_id = Bounty::bounty_count() as u64;
        let entry_id = Bounty::entry_count() as u64;

        assert_err!(
            Bounty::entrant_remark(
                RawOrigin::None.into(),
                entrant_id,
                bounty_id,
                entry_id,
                b"test".to_vec(),
            ),
            DispatchError::BadOrigin
        );
    });
}

#[test]
fn entrant_remark_fails_invalid_member_controller_account() {
    build_test_externalities().execute_with(|| {
        let starting_block = 1;
        run_to_block(starting_block);

        let (oracle_id, creator_id, contributor_id, entrant_id) = (1, 2, 3, 4);
        setup_bounty_environment(oracle_id, creator_id, contributor_id, entrant_id);
        run_to_block(starting_block + 1);

        let bounty_id = Bounty::bounty_count() as u64;
        let entry_id = Bounty::entry_count() as u64;

        assert_err!(
            Bounty::entrant_remark(
                to_origin!(entrant_id),
                INVALID_MEMBER_ID,
                bounty_id,
                entry_id,
                b"test".to_vec(),
            ),
            DispatchError::Other("origin signer not a member controller account")
        );
    });
}
