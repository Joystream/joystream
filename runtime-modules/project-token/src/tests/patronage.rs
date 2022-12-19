#[cfg(test)]
use frame_support::{assert_err, assert_ok};
use sp_runtime::traits::Zero;
use sp_runtime::SaturatedConversion;

use crate::tests::fixtures::{ClaimPatronageCreditFixture, Fixture, IssueTokenFixture};
use crate::tests::fixtures::{IssueRevenueSplitFixture, ReducePatronageRateToFixture};
use crate::tests::mock::*;
use crate::types::YearlyRate;
use crate::{assert_approx, balance, last_event_eq, Error, RawEvent};

#[test]
fn issue_token_ok_with_patronage_tally_count_zero() {
    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default()
            .with_supply(10u64.into())
            .with_patronage_rate(DEFAULT_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();

        assert_eq!(
            Token::token_info_by_id(DEFAULT_TOKEN_ID)
                .patronage_info
                .unclaimed_patronage_tally_amount,
            balance!(0),
        );
    })
}

#[test]
fn issue_token_ok_with_correct_non_zero_patronage_accounting() {
    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default()
            .with_supply(DEFAULT_INITIAL_ISSUANCE)
            .with_patronage_rate(DEFAULT_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();

        increase_block_number_by(DEFAULT_BLOCK_INTERVAL);

        let amnt = Token::token_info_by_id(DEFAULT_TOKEN_ID)
            .unclaimed_patronage_at_block::<BlocksPerYear>(System::block_number());
        println!("result: ({:?})", amnt);
        assert_approx!(amnt, 18121u128,);
    })
}

#[test]
fn issue_token_ok_with_correct_patronage_accounting_and_zero_supply() {
    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default()
            .with_empty_allocation()
            .with_patronage_rate(DEFAULT_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();

        increase_block_number_by(DEFAULT_BLOCK_INTERVAL);

        assert_eq!(
            Token::token_info_by_id(DEFAULT_TOKEN_ID).total_supply,
            balance!(0)
        );
    })
}

#[test]
fn decrease_patronage_ok() {
    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default()
            .with_supply(100u64.into())
            .with_patronage_rate(DEFAULT_MAX_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();

        let result = ReducePatronageRateToFixture::default()
            .with_target_rate(DEFAULT_YEARLY_PATRONAGE_RATE.into())
            .execute_call();

        assert_ok!(result);
    })
}

#[test]
fn decrease_patronage_ok_with_tally_count_correctly_updated() {
    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default()
            .with_supply(100u64.into())
            .with_patronage_rate(DEFAULT_MAX_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();
        increase_block_number_by(DEFAULT_BLOCK_INTERVAL);

        ReducePatronageRateToFixture::default()
            .with_target_rate(DEFAULT_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();

        assert_approx!(
            Token::token_info_by_id(DEFAULT_TOKEN_ID)
                .patronage_info
                .unclaimed_patronage_tally_amount,
            19013261179u128, // 10/5260000 * 1e7 = 19013261179 * 1e-18
        );
    })
}

#[test]
fn decrease_patronage_ok_noop_with_current_patronage_rate_specified_as_target() {
    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default()
            .with_patronage_rate(DEFAULT_MAX_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();

        ReducePatronageRateToFixture::default()
            .with_target_rate(DEFAULT_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();

        assert_eq!(
            Token::token_info_by_id(DEFAULT_TOKEN_ID)
                .patronage_info
                .rate,
            YearlyRate::from(DEFAULT_YEARLY_PATRONAGE_RATE),
        );
    })
}

#[test]
fn decrease_patronage_ok_with_last_tally_block_updated() {
    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default()
            .with_patronage_rate(DEFAULT_MAX_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();
        increase_block_number_by(DEFAULT_BLOCK_INTERVAL);

        ReducePatronageRateToFixture::default()
            .with_target_rate(DEFAULT_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();

        let tally_block = Token::token_info_by_id(DEFAULT_TOKEN_ID)
            .patronage_info
            .last_unclaimed_patronage_tally_block
            .saturated_into::<u64>();
        assert_eq!(
            DEFAULT_BLOCK_INTERVAL + 1u64, // starting block + blocks
            tally_block,
        )
    })
}

#[test]
fn decreasing_patronage_rate_fails_with_target_rate_exceeding_current_rate() {
    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default()
            .with_patronage_rate(DEFAULT_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();

        let result = ReducePatronageRateToFixture::default()
            .with_target_rate(DEFAULT_MAX_YEARLY_PATRONAGE_RATE.into())
            .execute_call();

        assert_err!(
            result,
            Error::<Test>::TargetPatronageRateIsHigherThanCurrentRate
        );
    })
}

#[test]
fn decreasing_patronage_rate_fails_invalid_token() {
    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default()
            .with_patronage_rate(DEFAULT_MAX_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();

        let result = ReducePatronageRateToFixture::default()
            .with_token_id(DEFAULT_TOKEN_ID + 1u64)
            .execute_call();

        assert_err!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn claim_patronage_fails_with_active_revenue_split() {
    build_default_test_externalities_with_balances(vec![(
        DEFAULT_ISSUER_ACCOUNT_ID,
        DEFAULT_SPLIT_REVENUE + ExistentialDeposit::get(),
    )])
    .execute_with(|| {
        IssueTokenFixture::default()
            .with_patronage_rate(DEFAULT_MAX_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();

        IssueRevenueSplitFixture::default().execute_call().unwrap(); // activate revenue split
        increase_block_number_by(MIN_REVENUE_SPLIT_TIME_TO_START - 1);
        let result = ClaimPatronageCreditFixture::default().execute_call();

        // expect it to fail even though the staking period is not started yet
        assert_err!(
            result,
            Error::<Test>::CannotModifySupplyWhenRevenueSplitsAreActive,
        );
    })
}

#[test]
fn claim_patronage_ok() {
    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default()
            .with_patronage_rate(DEFAULT_MAX_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();

        increase_block_number_by(DEFAULT_BLOCK_INTERVAL);

        let result = ReducePatronageRateToFixture::default().execute_call();

        assert_ok!(result);
    })
}

// TODO(mrbovo): allow for more than 100% claim over supply

#[test]
fn claim_patronage_ok_with_supply_greater_than_u64_max() {
    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default()
            .with_supply(1_000_000_000_000_000_000_000_000_000_000u128.into())
            .with_patronage_rate(DEFAULT_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();
        increase_block_number_by(DEFAULT_BLOCK_INTERVAL);

        ClaimPatronageCreditFixture::default()
            .execute_call()
            .unwrap();

        assert_eq!(
            Token::account_info_by_token_and_member(1u64, 1u64)
                .transferrable::<Test>(System::block_number()),
            balance!(1_010_000_000_000_000_000_000_000_000_000u128)
        );
    })
}

#[test]
fn claim_patronage_ok_with_event_deposit() {
    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default()
            .with_supply(DEFAULT_INITIAL_ISSUANCE)
            .with_patronage_rate(DEFAULT_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();
        increase_block_number_by(DEFAULT_BLOCK_INTERVAL);

        ClaimPatronageCreditFixture::default()
            .execute_call()
            .unwrap();

        last_event_eq!(RawEvent::PatronageCreditClaimed(
            DEFAULT_TOKEN_ID,
            18120u128.into(), // 100 billions * (1 + 10%/100%)^(10/5260000)
            DEFAULT_ISSUER_MEMBER_ID,
        ));
    })
}

#[test]
fn claim_patronage_ok_with_credit_accounting() {
    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default()
            .with_supply(DEFAULT_INITIAL_ISSUANCE)
            .with_patronage_rate(DEFAULT_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();

        increase_block_number_by(DEFAULT_BLOCK_INTERVAL);

        ClaimPatronageCreditFixture::default()
            .execute_call()
            .unwrap();

        assert_approx!(
            Token::account_info_by_token_and_member(DEFAULT_TOKEN_ID, DEFAULT_ISSUER_MEMBER_ID)
                .transferrable::<Test>(System::block_number()),
            Balance::from(18120u64) + DEFAULT_INITIAL_ISSUANCE,
        );
    })
}

#[test]
fn claim_patronage_ok_with_unclaimed_patronage_reset() {
    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default()
            .with_supply(DEFAULT_INITIAL_ISSUANCE)
            .with_patronage_rate(DEFAULT_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();

        increase_block_number_by(DEFAULT_BLOCK_INTERVAL);

        ClaimPatronageCreditFixture::default()
            .execute_call()
            .unwrap();

        assert!(Token::token_info_by_id(DEFAULT_TOKEN_ID)
            .unclaimed_patronage_at_block::<BlocksPerYear>(System::block_number())
            .is_zero());
    })
}

#[test]
fn claim_patronage_credit_fails_with_invalid_token_id() {
    build_default_test_externalities().execute_with(|| {
        let result = ClaimPatronageCreditFixture::default()
            .with_token_id(DEFAULT_TOKEN_ID)
            .execute_call();

        assert_err!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn claim_patronage_credit_fails_with_invalid_owner() {
    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default().execute_call().unwrap();

        let result = ClaimPatronageCreditFixture::default()
            .with_member_id(MemberId::zero())
            .execute_call();

        assert_err!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn claim_patronage_ok_with_tally_amount_set_to_zero() {
    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default()
            .with_supply(DEFAULT_INITIAL_ISSUANCE)
            .with_patronage_rate(DEFAULT_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();
        increase_block_number_by(DEFAULT_BLOCK_INTERVAL);

        ClaimPatronageCreditFixture::default()
            .execute_call()
            .unwrap();

        assert!(Token::token_info_by_id(DEFAULT_TOKEN_ID)
            .patronage_info
            .unclaimed_patronage_tally_amount
            .is_zero());
    })
}

#[test]
fn update_max_yearly_patronage_rate_fails_with_non_root_origin() {
    build_default_test_externalities().execute_with(|| {
        let res = Token::update_max_yearly_patronage_rate(
            Origin::signed(AccountId::zero()),
            DEFAULT_YEARLY_PATRONAGE_RATE.into(),
        );

        assert!(res.is_err());
    })
}
