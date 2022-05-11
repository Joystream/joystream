#[cfg(test)]
use frame_support::assert_err;
use sp_arithmetic::traits::Zero;

use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::types::{
    AccountDataOf, Joy, RevenueSplitInfo, RevenueSplitState, StakingStatus, Timeline,
};
use crate::{last_event_eq, Error, RawEvent};

#[test]
fn issue_split_fails_with_invalid_token_id() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        let result = IssueRevenueSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn issue_split_fails_with_invalid_starting_block() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        let result = IssueRevenueSplitFixture::default()
            .with_starting_block(0u64)
            .execute_call();

        assert_err!(result, Error::<Test>::RevenueSplitStartingBlockInThePast);
    })
}

#[test]
fn issue_split_fails_with_duration_too_short() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        let result = IssueRevenueSplitFixture::default()
            .with_duration(MinRevenueSplitDuration::get() - 1)
            .execute_call();

        assert_err!(result, Error::<Test>::RevenueSplitDurationTooShort);
    })
}

#[test]
fn issue_split_fails_with_source_having_insufficient_balance() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        let result = IssueRevenueSplitFixture::default()
            .with_allocation(DEFAULT_SPLIT_ALLOCATION + 1)
            .execute_call();

        assert_err!(result, Error::<Test>::InsufficientJoyBalance,);
    })
}

#[test]
fn issue_split_fails_with_non_existing_source() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        let result = IssueRevenueSplitFixture::default()
            .with_allocation_source(OTHER_ACCOUNT_ID)
            .execute_call();

        assert_err!(result, Error::<Test>::InsufficientJoyBalance,);
    })
}

#[test]
fn issue_split_fails_with_revenue_split_already_active() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
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
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        IssueRevenueSplitFixture::default().execute_call().unwrap();

        last_event_eq!(RawEvent::RevenueSplitIssued(
            1u64,
            1u64,
            DEFAULT_SPLIT_DURATION,
            DEFAULT_SPLIT_ALLOCATION,
        ));
    })
}

#[test]
fn issue_split_ok_with_allocation_transferred_to_treasury_account() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        let treasury_account = Token::module_treasury_account();
        IssueTokenFixture::default().execute_call().unwrap();

        IssueRevenueSplitFixture::default().execute_call().unwrap();

        // allocation correctly transferred to treasury account
        assert_eq!(
            Joy::<Test>::usable_balance(treasury_account),
            DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
        );
        assert_eq!(
            Joy::<Test>::usable_balance(DEFAULT_ACCOUNT_ID),
            ExistentialDeposit::get()
        );
    })
}

#[test]
fn issue_split_ok_with_revenue_split_correctly_activated() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        IssueRevenueSplitFixture::default().execute_call().unwrap();

        // revenue split status active with correct timeline
        assert!(matches!(
            Token::token_info_by_id(1u64).revenue_split,
            RevenueSplitState::<_, _>::Active(RevenueSplitInfo::<_, _> {
                allocation: DEFAULT_SPLIT_ALLOCATION,
                timeline: Timeline::<_> {
                    start: 1u64,
                    duration: DEFAULT_SPLIT_DURATION,
                },
                dividends_payed: 0u128
            })
        ));
        // Latest split nonce correctly updated
        assert_eq!(Token::token_info_by_id(1u64).latest_revenue_split_id, 1u32);
    })
}

#[test]
fn finalize_split_fails_with_invalid_token_id() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
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
        DEFAULT_ACCOUNT_ID,
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
        DEFAULT_ACCOUNT_ID,
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
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);

        FinalizeRevenueSplitFixture::default()
            .execute_call()
            .unwrap();

        last_event_eq!(RawEvent::RevenueSplitFinalized(
            1u64,
            DEFAULT_ACCOUNT_ID,
            DEFAULT_SPLIT_ALLOCATION
        ))
    })
}

#[test]
fn finalize_split_ok_with_token_status_set_to_inactive() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        IssueRevenueSplitFixture::default().execute_call().unwrap();
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
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        let treasury_account = Token::module_treasury_account();
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
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
            Joy::<Test>::usable_balance(DEFAULT_ACCOUNT_ID),
            DEFAULT_SPLIT_ALLOCATION - DEFAULT_SPLIT_JOY_DIVIDEND + ExistentialDeposit::get()
        );
    })
}

#[test]
fn participate_in_split_fails_with_invalid_token_id() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
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
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();

        let result = ParticipateInSplitFixture::default()
            .with_sender(OTHER_ACCOUNT_ID + 1)
            .execute_call();

        assert_err!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn participate_in_split_fails_with_token_having_inactive_revenue_split_status() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
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
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);

        let result = ParticipateInSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::RevenueSplitNotOngoing);
    })
}

#[test]
fn participate_in_split_fails_with_revenue_not_started_yet() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
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
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        ParticipateInSplitFixture::default().execute_call().unwrap();

        let result = ParticipateInSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::UserAlreadyParticipating);
    })
}

#[test]
fn participate_in_split_fails_with_user_having_insufficient_token_amount() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();

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
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();

        ParticipateInSplitFixture::default().execute_call().unwrap();

        last_event_eq!(RawEvent::UserParticipatedInSplit(
            1u64,
            OTHER_ACCOUNT_ID,
            DEFAULT_SPLIT_PARTICIPATION,
            DEFAULT_SPLIT_JOY_DIVIDEND,
            1u32, // participate in split no. 1
        ));
    })
}

#[test]
fn participate_in_split_ok_with_amount_staked() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();

        ParticipateInSplitFixture::default().execute_call().unwrap();

        // verify that amount is staked
        assert!(matches!(
            Token::account_info_by_token_and_account(1u64, OTHER_ACCOUNT_ID),
            AccountDataOf::<Test> {
                amount: DEFAULT_SPLIT_PARTICIPATION,
                split_staking_status: Some(StakingStatus {
                    split_id: 1u32, // revenue split id participated
                    amount: DEFAULT_SPLIT_PARTICIPATION,
                }),
                ..
            }
        ));
        // transferrable balance should be 0, since all available amount is staked
        assert!(
            Token::account_info_by_token_and_account(1u64, OTHER_ACCOUNT_ID)
                .transferrable::<Test>(System::block_number())
                .is_zero()
        );
    })
}

#[test]
fn participate_in_split_ok_with_dividends_transferred_to_claimer_joy_balance() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();

        ParticipateInSplitFixture::default().execute_call().unwrap();

        // dividend transferred from treasury to claimer account
        assert_eq!(
            Joy::<Test>::usable_balance(OTHER_ACCOUNT_ID),
            DEFAULT_SPLIT_JOY_DIVIDEND,
        );
        // split treasury account decreased
        assert_eq!(
            Joy::<Test>::usable_balance(Token::module_treasury_account()),
            DEFAULT_SPLIT_ALLOCATION - DEFAULT_SPLIT_JOY_DIVIDEND + ExistentialDeposit::get()
        );
        assert!(matches!(
            Token::token_info_by_id(1u64).revenue_split,
            RevenueSplitState::<_, _>::Active(RevenueSplitInfo::<_, _> {
                allocation: DEFAULT_SPLIT_ALLOCATION,
                dividends_payed: DEFAULT_SPLIT_JOY_DIVIDEND,
                ..
            })
        ));
    })
}

#[test]
fn abandon_revenue_split_fails_with_invalid_token_id() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        ParticipateInSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);

        let result = AbandonRevenueSplitFixture::default()
            .with_token_id(2u64)
            .execute_call();

        assert_err!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn abandon_revenue_split_fails_with_invalid_account_id() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        ParticipateInSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);
        FinalizeRevenueSplitFixture::default()
            .execute_call()
            .unwrap();

        let result = AbandonRevenueSplitFixture::default()
            .with_account(OTHER_ACCOUNT_ID + 1)
            .execute_call();

        assert_err!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn abandon_revenue_split_fails_with_user_not_a_participant() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);
        FinalizeRevenueSplitFixture::default()
            .execute_call()
            .unwrap();

        let result = AbandonRevenueSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::UserNotAParticipantForTheSplit);
    })
}

#[test]
fn abandon_revenue_split_fails_with_active_non_ended_split() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        ParticipateInSplitFixture::default().execute_call().unwrap();

        let result = AbandonRevenueSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::RevenueSplitDidNotEnd);
    })
}

#[test]
fn abandon_revenue_split_ok_with_event_deposit() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        ParticipateInSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);
        FinalizeRevenueSplitFixture::default()
            .execute_call()
            .unwrap();

        AbandonRevenueSplitFixture::default()
            .execute_call()
            .unwrap();

        last_event_eq!(RawEvent::RevenueSplitLeft(
            1u64,
            OTHER_ACCOUNT_ID,
            DEFAULT_SPLIT_PARTICIPATION
        ));
    })
}

#[test]
fn abandon_revenue_split_ok_with_unstaking() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        ParticipateInSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);
        FinalizeRevenueSplitFixture::default()
            .execute_call()
            .unwrap();

        AbandonRevenueSplitFixture::default()
            .execute_call()
            .unwrap();

        // staking status set back to None
        assert!(
            Token::account_info_by_token_and_account(1u64, OTHER_ACCOUNT_ID)
                .split_staking_status
                .is_none()
        )
    })
}

#[test]
fn abandon_revenue_split_ok_with_active_and_ended_split() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        ParticipateInSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);

        AbandonRevenueSplitFixture::default()
            .execute_call()
            .unwrap();
    })
}
