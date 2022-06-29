#[cfg(test)]
use frame_support::assert_err;
use sp_arithmetic::traits::Zero;
use sp_arithmetic::PerThing;
use sp_runtime::{DispatchError, Permill};

use crate::member;
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::types::{
    AccountDataOf, Joy, RevenueSplitInfo, RevenueSplitState, StakingStatus, Timeline,
};
use crate::{last_event_eq, Error, RawEvent};

#[test]
fn issue_split_fails_with_invalid_token_id() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        let result = IssueRevenueSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn issue_split_fails_with_start_time_to_start_too_short() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        let result = IssueRevenueSplitFixture::default()
            .with_starting_block(Token::current_block() + MIN_REVENUE_SPLIT_TIME_TO_START - 1)
            .execute_call();

        assert_err!(result, Error::<Test>::RevenueSplitTimeToStartTooShort);
    })
}

#[test]
fn issue_split_fails_with_duration_too_short() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        let result = IssueRevenueSplitFixture::default()
            .with_duration(MIN_REVENUE_SPLIT_DURATION - 1)
            .execute_call();

        assert_err!(result, Error::<Test>::RevenueSplitDurationTooShort);
    })
}

#[test]
fn issue_split_fails_with_source_having_insufficient_balance() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        let result = IssueRevenueSplitFixture::default()
            .with_allocation(
                DEFAULT_SPLIT_RATE.saturating_reciprocal_mul_ceil(DEFAULT_SPLIT_ALLOCATION + 1),
            )
            .execute_call();

        assert_err!(result, Error::<Test>::InsufficientJoyBalance,);
    })
}

#[test]
fn issue_split_fails_with_non_existing_source() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        let result = IssueRevenueSplitFixture::default()
            .with_allocation_source(member!(2).1)
            .execute_call();

        assert_err!(result, Error::<Test>::InsufficientJoyBalance,);
    })
}

#[test]
fn issue_split_fails_with_revenue_split_already_active() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        // endow enough allocation for 2 splits
        DEFAULT_SPLIT_ALLOCATION + DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        IssueRevenueSplitFixture::default().execute_call().unwrap();

        let result = IssueRevenueSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::RevenueSplitAlreadyActiveForToken);
    })
}

#[test]
fn issue_split_ok_with_event_deposited() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        IssueRevenueSplitFixture::default().execute_call().unwrap();

        last_event_eq!(RawEvent::RevenueSplitIssued(
            1u64,
            1u64 + MIN_REVENUE_SPLIT_TIME_TO_START,
            DEFAULT_SPLIT_DURATION,
            DEFAULT_SPLIT_RATE * DEFAULT_SPLIT_ALLOCATION,
        ));
    })
}

#[test]
fn issue_split_ok_with_user_provided_start_block() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        IssueRevenueSplitFixture::default()
            .with_starting_block(2 + MIN_REVENUE_SPLIT_TIME_TO_START)
            .execute_call()
            .unwrap();

        // use event to assert that correct starting block is set
        last_event_eq!(RawEvent::RevenueSplitIssued(
            1u64,
            2 + MIN_REVENUE_SPLIT_TIME_TO_START,
            DEFAULT_SPLIT_DURATION,
            DEFAULT_SPLIT_RATE * DEFAULT_SPLIT_ALLOCATION,
        ));
    })
}

#[test]
fn issue_split_fails_with_allocation_zero() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        let result = IssueRevenueSplitFixture::default()
            .with_allocation(0u128)
            .execute_call();

        assert_err!(
            result,
            Error::<Test>::CannotIssueSplitWithZeroAllocationAmount
        );
    })
}

#[test]
fn issue_split_ok_with_allocation_transferred_to_treasury_account() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        let treasury_account = Token::module_treasury_account();
        IssueTokenFixture::default().execute_call().unwrap();

        IssueRevenueSplitFixture::default().execute_call().unwrap();

        // allocation correctly transferred to treasury account
        assert_eq!(
            Joy::<Test>::usable_balance(treasury_account),
            DEFAULT_SPLIT_RATE * DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
        );
        assert_eq!(
            Joy::<Test>::usable_balance(member!(1).1),
            ExistentialDeposit::get() + DEFAULT_SPLIT_ALLOCATION
                - DEFAULT_SPLIT_RATE * DEFAULT_SPLIT_ALLOCATION
        );
    })
}

#[test]
fn issue_split_ok_with_revenue_split_correctly_activated() {
    pub const START: u64 = 1u64 + MIN_REVENUE_SPLIT_TIME_TO_START;
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        IssueRevenueSplitFixture::default().execute_call().unwrap();

        // revenue split status active with correct timeline
        assert_eq!(
            Token::token_info_by_id(1u64).revenue_split,
            RevenueSplitState::<_, _>::Active(RevenueSplitInfo::<_, _> {
                allocation: DEFAULT_SPLIT_RATE * DEFAULT_SPLIT_ALLOCATION,
                timeline: Timeline::<_> {
                    start: START,
                    duration: DEFAULT_SPLIT_DURATION,
                },
                dividends_claimed: 0u128
            })
        );

        // Latest split nonce correctly updated
        assert_eq!(Token::token_info_by_id(1u64).next_revenue_split_id, 1u32);
    })
}

#[test]
fn finalize_split_fails_with_invalid_token_id() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);

        let result = FinalizeRevenueSplitFixture::default()
            .with_token_id(2u64)
            .execute_call();

        assert_err!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn finalize_split_fails_with_active_but_not_ended_revenue_split() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION - 1);

        let result = FinalizeRevenueSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::RevenueSplitDidNotEnd);
    })
}

#[test]
fn finalize_split_fails_with_inactive_revenue_split() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        let result = FinalizeRevenueSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::RevenueSplitNotActiveForToken);
    })
}

#[test]
fn finalize_split_ok_with_event_deposit() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);
        increase_block_number_by(DEFAULT_SPLIT_DURATION);

        FinalizeRevenueSplitFixture::default()
            .execute_call()
            .unwrap();

        last_event_eq!(RawEvent::RevenueSplitFinalized(
            1u64,
            member!(1).1,
            DEFAULT_SPLIT_RATE * DEFAULT_SPLIT_ALLOCATION,
        ))
    })
}

#[test]
fn finalize_split_ok_with_token_status_set_to_inactive() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);
        increase_block_number_by(DEFAULT_SPLIT_DURATION);

        FinalizeRevenueSplitFixture::default()
            .execute_call()
            .unwrap();

        assert!(matches!(
            Token::token_info_by_id(1u64).revenue_split,
            RevenueSplitState::Inactive,
        ));
    })
}

#[test]
fn finalize_split_ok_with_leftover_joys_transferred_to_account() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        let treasury_account = Token::module_treasury_account();
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);
        ParticipateInSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);

        FinalizeRevenueSplitFixture::default()
            .execute_call()
            .unwrap();

        // treasury account final balance == Existential deposit
        assert_eq!(
            Joy::<Test>::usable_balance(treasury_account),
            ExistentialDeposit::get()
        );
        // account id balance increased by DEFAULT_SPLIT_ALLOCATION - DEFAULT_SPLIT_JOY_DIVIDEND
        assert_eq!(
            Joy::<Test>::usable_balance(member!(1).1),
            DEFAULT_SPLIT_ALLOCATION - DEFAULT_SPLIT_JOY_DIVIDEND + ExistentialDeposit::get()
        );
    })
}

#[test]
fn participate_in_split_fails_with_invalid_token_id() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();

        let result = ParticipateInSplitFixture::default()
            .with_token_id(2u64)
            .execute_call();

        assert_err!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn participate_in_split_fails_with_non_existing_account() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);

        let result = ParticipateInSplitFixture::default()
            .with_sender(member!(3).1)
            .with_member_id(member!(3).0)
            .execute_call();

        assert_err!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn participate_in_split_fails_with_invalid_member_controller_account() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();

        let result = ParticipateInSplitFixture::default()
            .with_sender(member!(3).1)
            .execute_call();

        assert_err!(
            result,
            DispatchError::Other("origin signer not a member controller account")
        );
    })
}

#[test]
fn participate_in_split_fails_with_token_having_inactive_revenue_split_status() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc

        let result = ParticipateInSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::RevenueSplitNotActiveForToken);
    })
}

#[test]
fn participate_in_split_fails_with_ended_revenue_split_period() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);
        increase_block_number_by(DEFAULT_SPLIT_DURATION);

        let result = ParticipateInSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::RevenueSplitNotOngoing);
    })
}

#[test]
fn participate_in_split_fails_with_revenue_not_started_yet() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default()
            .with_starting_block(100u64)
            .execute_call()
            .unwrap();

        let result = ParticipateInSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::RevenueSplitNotOngoing);
    })
}

#[test]
fn participate_in_split_fails_with_user_already_a_participant() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);
        ParticipateInSplitFixture::default().execute_call().unwrap();

        let result = ParticipateInSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::UserAlreadyParticipating);
    })
}

#[test]
fn participate_in_split_fails_with_user_having_insufficient_token_amount() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);

        let result = ParticipateInSplitFixture::default()
            .with_amount(DEFAULT_SPLIT_PARTICIPATION + 100u128)
            .execute_call();

        assert_err!(
            result,
            Error::<Test>::InsufficientBalanceForSplitParticipation
        );
    })
}

#[test]
fn participate_in_split_ok_with_event_deposit() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);

        ParticipateInSplitFixture::default().execute_call().unwrap();

        last_event_eq!(RawEvent::UserParticipatedInSplit(
            1u64,
            member!(2).0,
            DEFAULT_SPLIT_PARTICIPATION,
            DEFAULT_SPLIT_JOY_DIVIDEND,
            0u32, // participate in split @ 0
        ));
    })
}

#[test]
fn participate_in_split_fails_with_zero_amount() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();

        let result = ParticipateInSplitFixture::default()
            .with_amount(0u128)
            .execute_call();

        assert_err!(
            result,
            Error::<Test>::CannotParticipateInSplitWithZeroAmount
        );
    })
}

#[test]
fn participate_in_split_ok_with_user_participating_to_a_previous_ended_split() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        2 * DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);
        ParticipateInSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);
        FinalizeRevenueSplitFixture::default()
            .execute_call()
            .unwrap();
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);

        ParticipateInSplitFixture::default().execute_call().unwrap();

        // verify that amount is staked
        assert!(matches!(
            Token::account_info_by_token_and_member(1u64, member!(2).0),
            AccountDataOf::<Test> {
                amount: DEFAULT_SPLIT_PARTICIPATION,
                split_staking_status: Some(StakingStatus {
                    split_id: 1u32, // 2nd revenue split participated -> nonce == 1
                    amount: DEFAULT_SPLIT_PARTICIPATION,
                }),
                ..
            }
        ));
    })
}

#[test]
fn participate_in_split_ok_with_amount_staked() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);

        ParticipateInSplitFixture::default().execute_call().unwrap();

        // verify that amount is staked
        assert!(matches!(
            Token::account_info_by_token_and_member(1u64, member!(2).0),
            AccountDataOf::<Test> {
                amount: DEFAULT_SPLIT_PARTICIPATION,
                split_staking_status: Some(StakingStatus {
                    split_id: 0u32, // revenue split id participated
                    amount: DEFAULT_SPLIT_PARTICIPATION,
                }),
                ..
            }
        ));
        // transferrable balance should be 0, since all available amount is staked
        assert!(Token::account_info_by_token_and_member(1u64, member!(2).0)
            .transferrable::<Test>(System::block_number())
            .is_zero());
    })
}

#[test]
fn participate_in_split_ok_with_dividends_transferred_to_claimer_joy_balance() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);

        ParticipateInSplitFixture::default().execute_call().unwrap();

        // dividend transferred from treasury to claimer account
        assert_eq!(
            Joy::<Test>::usable_balance(member!(2).1),
            DEFAULT_SPLIT_JOY_DIVIDEND,
        );
        // split treasury account decreased
        assert_eq!(
            Joy::<Test>::usable_balance(Token::module_treasury_account()),
            DEFAULT_SPLIT_RATE * DEFAULT_SPLIT_ALLOCATION - DEFAULT_SPLIT_JOY_DIVIDEND
                + ExistentialDeposit::get()
        );
        assert_eq!(
            Token::token_info_by_id(1u64).revenue_split,
            RevenueSplitState::<_, _>::Active(RevenueSplitInfo::<_, _> {
                allocation: DEFAULT_SPLIT_RATE * DEFAULT_SPLIT_ALLOCATION,
                timeline: Timeline::<_> {
                    start: 1u64 + MIN_REVENUE_SPLIT_TIME_TO_START, // effective start
                    duration: DEFAULT_SPLIT_DURATION,
                },
                dividends_claimed: DEFAULT_SPLIT_JOY_DIVIDEND,
            })
        );
    })
}

#[test]
fn participate_in_split_ok_with_vesting_schedule_and_correct_transferrable_balance_accounting() {
    pub const TOTAL_AMOUNT: u128 = DEFAULT_SALE_PURCHASE_AMOUNT * 2;
    build_default_test_externalities_with_balances(vec![
        (
            member!(1).1,
            DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
        ),
        (
            member!(2).1,
            ExistentialDeposit::get() + (DEFAULT_SALE_UNIT_PRICE * TOTAL_AMOUNT),
        ),
    ])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        IssueRevenueSplitFixture::default()
            .with_duration(2 * DEFAULT_SALE_DURATION)
            .execute_call()
            .unwrap();
        InitTokenSaleFixture::default()
            .with_vesting_schedule_params(Some(VestingScheduleParams {
                blocks_before_cliff: 0,
                linear_vesting_duration: DEFAULT_SALE_DURATION,
                cliff_amount_percentage: Permill::from_percent(30),
            }))
            .execute_call()
            .unwrap();
        PurchaseTokensOnSaleFixture::default()
            .with_amount(TOTAL_AMOUNT)
            .execute_call()
            .unwrap();
        increase_block_number_by(DEFAULT_SALE_DURATION);

        ParticipateInSplitFixture::default()
            .with_amount(DEFAULT_SALE_PURCHASE_AMOUNT)
            .execute_call()
            .unwrap();

        // expect vesting amount to be accounted for together with split participation
        let account = Token::account_info_by_token_and_member(1u64, member!(2).0);
        assert!(matches!(
            account,
            AccountDataOf::<Test> {
                amount: TOTAL_AMOUNT,
                split_staking_status: Some(StakingStatus::<Balance> {
                    split_id: 0u32,
                    amount: DEFAULT_SALE_PURCHASE_AMOUNT,
                }),
                ..
            }
        ));
        // vested (at cliff) = 2 * DEFAULT_SALE_PURCHASE_AMOUNT * 30%
        // staked = DEFAULT_SALE_PURCHASE_AMOUNT
        // unvested = 2 * DEFAULT_SALE_PURCHASE_AMOUNT * 70% > staked
        // expect transferrable == TOTAL_AMOUNT - unvested
        assert_eq!(
            account.transferrable::<Test>(System::block_number()),
            Permill::from_percent(30) * DEFAULT_SALE_PURCHASE_AMOUNT * 2,
        );
        // Advance 50 % of the vesting schedule duration
        // vested = 2 * DEFAULT_SALE_PURCHASE_AMOUNT * (30% + 50% * 70%)
        // staked = DEFAULT_SALE_PURCHASE_AMOUNT
        // unvested = 2 * DEFAULT_SALE_PURCHASE_AMOUNT * 35% < staked
        // expect transferrable == TOTAL_AMOUNT - staked
        increase_block_number_by(Permill::from_percent(50) * DEFAULT_SALE_DURATION);
        assert_eq!(
            account.transferrable::<Test>(System::block_number()),
            DEFAULT_SALE_PURCHASE_AMOUNT,
        );
    })
}

#[test]
fn exit_revenue_split_fails_with_invalid_token_id() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);
        ParticipateInSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);

        let result = ExitRevenueSplitFixture::default()
            .with_token_id(2u64)
            .execute_call();

        assert_err!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn exit_revenue_split_fails_with_non_existing_account() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);
        ParticipateInSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);
        FinalizeRevenueSplitFixture::default()
            .execute_call()
            .unwrap();

        let result = ExitRevenueSplitFixture::default()
            .with_account(member!(3).1)
            .with_member_id(member!(3).0)
            .execute_call();

        assert_err!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn exit_revenue_split_fails_with_invalid_member_controller() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);
        ParticipateInSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);
        FinalizeRevenueSplitFixture::default()
            .execute_call()
            .unwrap();

        let result = ExitRevenueSplitFixture::default()
            .with_account(member!(3).1)
            .execute_call();

        assert_err!(
            result,
            DispatchError::Other("origin signer not a member controller account")
        );
    })
}

#[test]
fn exit_revenue_split_fails_with_user_not_a_participant() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION + MIN_REVENUE_SPLIT_TIME_TO_START);
        FinalizeRevenueSplitFixture::default()
            .execute_call()
            .unwrap();

        let result = ExitRevenueSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::UserNotParticipantingInAnySplit);
    })
}

#[test]
fn exit_revenue_split_fails_with_active_non_ended_split() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);
        ParticipateInSplitFixture::default().execute_call().unwrap();

        let result = ExitRevenueSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::RevenueSplitDidNotEnd);
    })
}

#[test]
fn exit_revenue_split_ok_with_event_deposit() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);
        ParticipateInSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);
        FinalizeRevenueSplitFixture::default()
            .execute_call()
            .unwrap();

        ExitRevenueSplitFixture::default().execute_call().unwrap();

        last_event_eq!(RawEvent::RevenueSplitLeft(
            1u64,
            member!(2).0,
            DEFAULT_SPLIT_PARTICIPATION
        ));
    })
}

#[test]
fn exit_revenue_split_ok_with_unstaking() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);
        ParticipateInSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);
        FinalizeRevenueSplitFixture::default()
            .execute_call()
            .unwrap();

        ExitRevenueSplitFixture::default().execute_call().unwrap();

        // staking status set back to None
        assert!(Token::account_info_by_token_and_member(1u64, member!(2).0)
            .split_staking_status
            .is_none())
    })
}

#[test]
fn exit_revenue_split_ok_with_active_and_ended_split() {
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START);
        ParticipateInSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);

        ExitRevenueSplitFixture::default().execute_call().unwrap();
    })
}

#[test]
fn issue_revenue_split_ok_with_allocation_leftovers_retained_by_issuer() {
    let leftovers = DEFAULT_SPLIT_RATE
        .left_from_one()
        .mul_ceil(DEFAULT_SPLIT_ALLOCATION)
        + ExistentialDeposit::get();
    build_default_test_externalities_with_balances(vec![(
        member!(1).1,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default()
            .with_allocation(DEFAULT_SPLIT_ALLOCATION)
            .execute_call()
            .unwrap();

        assert_eq!(Joy::<Test>::usable_balance(member!(1).1), leftovers,);
    })
}
