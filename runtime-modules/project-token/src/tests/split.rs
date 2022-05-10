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
        let treasury_account = treasury_account_for(1u64);
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
                allocation_left: DEFAULT_SPLIT_ALLOCATION,
                timeline: Timeline::<_> {
                    start: 1u64,
                    duration: DEFAULT_SPLIT_DURATION,
                }
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
fn finalize_split_ok_with_active_but_not_ended_revenue_split() {
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
        let treasury_account = treasury_account_for(1u64);
        IssueTokenFixture::default().execute_call().unwrap();
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);

        FinalizeRevenueSplitFixture::default()
            .execute_call()
            .unwrap();

        // treasury account final balance == Existential deposit
        assert_eq!(
            Joy::<Test>::usable_balance(treasury_account),
            ExistentialDeposit::get()
        );
        // account id balance increased by leftover joy amount
        assert_eq!(
            Joy::<Test>::usable_balance(DEFAULT_ACCOUNT_ID),
            DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get()
        );
    })
}

#[test]
fn participate_to_split_failst_with_invalid_token_id() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();

        let result = ParticipateToSplitFixture::default()
            .with_token_id(2u64)
            .execute_call();

        assert_err!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn participate_to_split_fails_with_non_existing_account() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();

        let result = ParticipateToSplitFixture::default()
            .with_sender(OTHER_ACCOUNT_ID + 1)
            .execute_call();

        assert_err!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn participate_to_split_fails_with_token_having_inactive_revenue_split_status() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc

        let result = ParticipateToSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::RevenueSplitNotActiveForToken);
    })
}

#[test]
fn participate_to_split_fails_with_ended_revenue_split_period() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        increase_block_number_by(DEFAULT_SPLIT_DURATION);

        let result = ParticipateToSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::RevenueSplitNotOngoing);
    })
}

#[test]
fn participate_to_split_fails_with_revenue_not_started_yet() {
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

        let result = ParticipateToSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::RevenueSplitNotOngoing);
    })
}

#[test]
fn participate_to_split_fails_with_user_already_a_participant() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();
        ParticipateToSplitFixture::default().execute_call().unwrap();

        let result = ParticipateToSplitFixture::default().execute_call();

        assert_err!(result, Error::<Test>::UserAlreadyParticipating);
    })
}

#[test]
fn participate_to_split_fails_with_user_having_insufficient_token_amount() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get() + DEFAULT_BLOAT_BOND,
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();

        let result = ParticipateToSplitFixture::default()
            .with_amount(DEFAULT_SPLIT_PARTICIPATION + 100u128)
            .execute_call();

        assert_err!(
            result,
            Error::<Test>::InsufficientBalanceForSplitParticipation
        );
    })
}

#[test]
fn participate_to_split_ok_with_event_deposit() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();

        ParticipateToSplitFixture::default().execute_call().unwrap();

        last_event_eq!(RawEvent::UserParticipatedToSplit(
            1u64,
            OTHER_ACCOUNT_ID,
            DEFAULT_SPLIT_PARTICIPATION,
        ));
    })
}

#[test]
fn participate_to_split_ok_with_amount_staked() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ACCOUNT_ID,
        DEFAULT_SPLIT_ALLOCATION + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();
        TransferFixture::default().execute_call().unwrap(); // send participation to other acc
        IssueRevenueSplitFixture::default().execute_call().unwrap();

        ParticipateToSplitFixture::default().execute_call().unwrap();

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

// #[test]
// fn claim_split_revenue_fails_with_invalid_token_id() {
//     let (token_id, issuance) = (token!(1), balance!(1_000));
//     let timeline = timeline!(block!(1), block!(10));
//     let (treasury, allocation, percentage) = (treasury!(token_id), joys!(50), percent!(10));
//     let (participant_id, staked) = (account!(2), balance!(100));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(issuance)
//         .with_revenue_split(timeline.clone(), percentage)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .with_account(participant_id, 0, staked)
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         increase_account_balance(treasury, allocation);
//         increase_block_number_by(timeline.end());

//         let result =
//             <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_revenue_split_amount(
//                 token_id + 1,
//                 participant_id,
//             );

//         assert_noop!(result, Error::<Test>::TokenDoesNotExist);
//     })
// }

// #[test]
// fn claim_split_revenue_fails_with_invalid_account_id() {
//     let (token_id, issuance) = (token!(1), balance!(1_000));
//     let timeline = timeline!(block!(1), block!(10));
//     let (treasury, allocation, percentage) = (treasury!(token_id), joys!(50), percent!(10));
//     let (participant_id, staked) = (account!(2), balance!(100));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(issuance)
//         .with_revenue_split(timeline.clone(), percentage)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .with_account(participant_id, 0, staked)
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         increase_account_balance(treasury, allocation);
//         increase_block_number_by(timeline.end());

//         let result =
//             <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_revenue_split_amount(
//                 token_id,
//                 participant_id + 1,
//             );

//         assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
//     })
// }

// #[test]
// fn claim_split_revenue_fails_with_inactive_revenue_split_state() {
//     let (token_id, issuance) = (token!(1), balance!(1_000));
//     let timeline = timeline!(block!(1), block!(10));
//     let (treasury, allocation, _percentage) = (treasury!(token_id), joys!(50), percent!(10));
//     let (participant_id, staked) = (account!(2), balance!(100));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(issuance)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .with_account(participant_id, 0, staked)
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         increase_account_balance(treasury, allocation);
//         increase_block_number_by(timeline.end());

//         let result =
//             <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_revenue_split_amount(
//                 token_id,
//                 participant_id + 1,
//             );

//         assert_noop!(result, Error::<Test>::RevenueSplitNotActiveForToken);
//     })
// }

// #[test]
// fn claim_split_revenue_fails_with_active_state_and_timeline_not_ended() {
//     let (token_id, issuance) = (token!(1), balance!(1_000));
//     let timeline = timeline!(block!(1), block!(10));
//     let (treasury, allocation, percentage) = (treasury!(token_id), joys!(50), percent!(10));
//     let (participant_id, staked) = (account!(2), balance!(100));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(issuance)
//         .with_revenue_split(timeline.clone(), percentage)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .with_account(participant_id, 0, staked)
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         increase_account_balance(treasury, allocation);
//         increase_block_number_by(timeline.end() - 1);

//         let result =
//             <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_revenue_split_amount(
//                 token_id,
//                 participant_id,
//             );

//         assert_noop!(result, Error::<Test>::RevenueSplitDidNotEnd);
//     })
// }

// #[test]
// fn claim_split_revenue_ok() {
//     let (token_id, issuance) = (token!(1), balance!(1_000));
//     let timeline = timeline!(block!(1), block!(10));
//     let (treasury, allocation, percentage) = (treasury!(token_id), joys!(50), percent!(10));
//     let (participant_id, staked, _revenue) = (account!(2), balance!(100), joys!(10));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(issuance)
//         .with_revenue_split(timeline.clone(), percentage)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .with_account(participant_id, 0, staked)
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         increase_account_balance(treasury, allocation);
//         increase_block_number_by(timeline.end());

//         let result =
//             <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_revenue_split_amount(
//                 token_id,
//                 participant_id,
//             );

//         assert_ok!(result);
//     })
// }

// #[test]
// fn claim_split_revenue_ok_with_no_balance_staked() {
//     let (token_id, issuance) = (token!(1), balance!(1_000));
//     let timeline = timeline!(block!(1), block!(10));
//     let (treasury, allocation, percentage) = (treasury!(token_id), joys!(50), percent!(10));
//     let (participant_id, _staked, _revenue) = (account!(2), balance!(100), joys!(10));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(issuance)
//         .with_revenue_split(timeline.clone(), percentage)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .with_account(participant_id, balance!(0), balance!(0))
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         increase_account_balance(treasury, allocation);
//         increase_block_number_by(timeline.end());

//         let result =
//             <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_revenue_split_amount(
//                 token_id,
//                 participant_id,
//             );

//         assert_ok!(result);
//     })
// }

// #[test]
// fn claim_split_revenue_ok_with_event_deposit() {
//     let (token_id, pre_issuance) = (token!(1), balance!(900));
//     let timeline = timeline!(block!(1), block!(10));
//     let (treasury, allocation, percentage) = (treasury!(token_id), joys!(1000), percent!(10));
//     let (participant_id, staked, revenue) = (account!(2), balance!(100), joys!(10));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(pre_issuance)
//         .with_revenue_split(timeline.clone(), percentage)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .with_account(participant_id, 0, staked) // total issuance = pre_issuance + staked
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         increase_account_balance(treasury, allocation);
//         increase_block_number_by(timeline.end());

//         let _ =
//             <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_revenue_split_amount(
//                 token_id,
//                 participant_id,
//             );

//         last_event_eq!(RawEvent::UserClaimedRevenueSplit(
//             token_id,
//             participant_id,
//             revenue,
//             timeline.end() + 1 // end + starting block
//         ));
//     })
// }

// #[test]
// fn claim_split_revenue_ok_with_treasury_funds_decreased() {
//     let (token_id, pre_issuance) = (token!(1), balance!(900));
//     let timeline = timeline!(block!(1), block!(10));
//     let (treasury, allocation, percentage) = (treasury!(token_id), joys!(1000), percent!(10));
//     let (participant_id, staked, revenue) = (account!(2), balance!(100), joys!(10));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(pre_issuance)
//         .with_revenue_split(timeline.clone(), percentage)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .with_account(participant_id, 0, staked) // total issuance = pre_issuance + staked
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         increase_account_balance(treasury, allocation);
//         increase_block_number_by(timeline.end());

//         let _ =
//             <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_revenue_split_amount(
//                 token_id,
//                 participant_id,
//             );
//         assert_eq!(Balances::free_balance(treasury), allocation - revenue);
//     })
// }

// #[test]
// fn claim_split_revenue_ok_with_user_funds_increased() {
//     let (token_id, pre_issuance) = (token!(1), balance!(900));
//     let timeline = timeline!(block!(1), block!(10));
//     let (treasury, allocation, percentage) = (treasury!(token_id), joys!(1000), percent!(10));
//     let (participant_id, staked, revenue) = (account!(2), balance!(100), joys!(10));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(pre_issuance)
//         .with_revenue_split(timeline.clone(), percentage)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .with_account(participant_id, 0, staked) // total_issuance = pre_issuance + staked
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         increase_account_balance(treasury, allocation);
//         increase_block_number_by(timeline.end());

//         let _ =
//             <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_revenue_split_amount(
//                 token_id,
//                 participant_id,
//             );
//         assert_eq!(Balances::free_balance(participant_id), revenue);
//     })
// }

// #[test]
// fn claim_split_revenue_ok_with_user_reserved_amount_reset() {
//     let (token_id, pre_issuance) = (token!(1), balance!(1_000));
//     let timeline = timeline!(block!(1), block!(10));
//     let (treasury, allocation, percentage) = (treasury!(token_id), joys!(1000), percent!(10));
//     let (participant_id, staked, _revenue) = (account!(2), balance!(100), joys!(10));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(pre_issuance)
//         .with_revenue_split(timeline.clone(), percentage)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .with_account(participant_id, 0, staked)
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         increase_account_balance(treasury, allocation);
//         increase_block_number_by(timeline.end());

//         let _ =
//             <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_revenue_split_amount(
//                 token_id,
//                 participant_id,
//             );
//         assert_eq!(
//             Token::account_info_by_token_and_account(token_id, participant_id).staked_balance,
//             balance!(0)
//         );
//     })
// }

// #[test]
// fn claim_split_revenue_ok_noop_with_user_having_no_stacked_funds() {
//     let (token_id, pre_issuance) = (token!(1), balance!(900));
//     let timeline = timeline!(block!(1), block!(10));
//     let (treasury, allocation, percentage) = (treasury!(token_id), joys!(1000), percent!(10));
//     let (participant_id, _staked, _revenue) = (account!(2), balance!(100), joys!(10));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(pre_issuance)
//         .with_revenue_split(timeline.clone(), percentage)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .with_account(participant_id, 0, 0)
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         increase_account_balance(treasury, allocation);
//         increase_block_number_by(timeline.end());

//         let result =
//             <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_revenue_split_amount(
//                 token_id,
//                 participant_id,
//             );
//         assert_ok!(result);
//     })
// }

// #[test]
// fn claim_split_revenue_ok_with_user_free_balance_increased() {
//     let (token_id, issuance) = (token!(1), balance!(900));
//     let timeline = timeline!(block!(1), block!(10));
//     let (treasury, allocation, percentage) = (treasury!(token_id), joys!(1000), percent!(10));
//     let (participant_id, staked, _revenue) = (account!(2), balance!(100), joys!(10));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(issuance)
//         .with_revenue_split(timeline.clone(), percentage)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .with_account(participant_id, 0, staked)
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         increase_account_balance(treasury, allocation);
//         increase_block_number_by(timeline.end());

//         let _ =
//             <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_revenue_split_amount(
//                 token_id,
//                 participant_id,
//             );

//         assert_eq!(
//             Token::account_info_by_token_and_account(token_id, participant_id).liquidity,
//             staked,
//         );
//     })
// }

// #[test]
// fn abandon_revenue_splitd_fails_with_invalid_token_id() {
//     let (token_id, pre_issuance) = (token!(1), balance!(900));
//     let (participant_id, staked) = (account!(2), balance!(100));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(pre_issuance)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .with_account(participant_id, 0, staked)
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         let result =
//             <Token as PalletToken<AccountId, Policy, IssuanceParams>>::abandon_revenue_split(
//                 token_id + 1,
//                 participant_id,
//             );

//         assert_noop!(result, Error::<Test>::TokenDoesNotExist);
//     })
// }

// #[test]
// fn abandon_revenue_splitd_fails_with_invalid_account_id() {
//     let (token_id, pre_issuance) = (token!(1), balance!(900));
//     let (participant_id, _staked) = (account!(2), balance!(100));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(pre_issuance)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         let result =
//             <Token as PalletToken<AccountId, Policy, IssuanceParams>>::abandon_revenue_split(
//                 token_id,
//                 participant_id,
//             );

//         assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
//     })
// }

// #[test]
// fn abandon_revenue_splitd_ok() {
//     let (token_id, pre_issuance) = (token!(1), balance!(900));
//     let (participant_id, staked) = (account!(2), balance!(100));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(pre_issuance)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .with_account(participant_id, 0, staked)
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         let result =
//             <Token as PalletToken<AccountId, Policy, IssuanceParams>>::abandon_revenue_split(
//                 token_id,
//                 participant_id,
//             );

//         assert_ok!(result);
//     })
// }

// #[test]
// fn abandon_revenue_splitd_ok_with_event_deposit() {
//     let (token_id, pre_issuance) = (token!(1), balance!(900));
//     let (account_id, staked) = (account!(2), balance!(100));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(pre_issuance)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .with_account(account_id, 0, staked)
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::abandon_revenue_split(
//             token_id, account_id,
//         );

//         last_event_eq!(RawEvent::RevenueSplitAbandoned(
//             token_id, account_id, staked
//         ));
//     })
// }

// #[test]
// fn abandon_revenue_splitd_ok_with_reserved_amount_zero() {
//     let (token_id, pre_issuance) = (token!(1), balance!(900));
//     let (account_id, staked) = (account!(2), balance!(100));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(pre_issuance)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .with_account(account_id, 0, staked)
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::abandon_revenue_split(
//             token_id, account_id,
//         );

//         assert_eq!(
//             Token::account_info_by_token_and_account(token_id, account_id).staked_balance,
//             balance!(0)
//         );
//     })
// }

// #[test]
// fn abandon_revenue_splitd_ok_with_free_balance_increased() {
//     let (token_id, pre_issuance) = (token!(1), balance!(900));
//     let (account_id, staked) = (account!(2), balance!(100));

//     let token_data = TokenDataBuilder::new_empty()
//         .with_issuance(pre_issuance)
//         .build();
//     let config = GenesisConfigBuilder::new_empty()
//         .with_token(token_id, token_data)
//         .with_account(account_id, 0, staked)
//         .build();

//     build_test_externalities(config).execute_with(|| {
//         let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::abandon_revenue_split(
//             token_id, account_id,
//         );

//         assert_eq!(
//             Token::account_info_by_token_and_account(token_id, account_id).liquidity,
//             staked
//         );
//     })
// }
