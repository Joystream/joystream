#[cfg(test)]
use frame_support::{assert_err, assert_ok};
use sp_runtime::{traits::Zero, Permill, Perquintill};

use crate::tests::fixtures::{ClaimPatronageCreditFixture, Fixture, IssueTokenFixture};
use crate::tests::fixtures::{IssueRevenueSplitFixture, ReducePatronageRateToFixture};
use crate::tests::mock::*;
use crate::types::{BlockRate, YearlyRate};
use crate::{balance, block, last_event_eq, yearly_rate, Error, RawEvent};

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
    // K = 1/blocks_per_years => floor(10% * 10 * K * 1bill) = floor(K * 2bill) = 380
    let expected = balance!(190);

    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default()
            .with_supply(1_000_000u128.into())
            .with_patronage_rate(DEFAULT_YEARLY_PATRONAGE_RATE.into())
            .with_split_rate(DEFAULT_SPLIT_RATE)
            .execute_call()
            .unwrap();

        increase_block_number_by(DEFAULT_BLOCK_INTERVAL);

        assert_eq!(
            Token::token_info_by_id(DEFAULT_TOKEN_ID)
                .unclaimed_patronage_at_block(System::block_number()),
            expected,
        );
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
    // 10% * 100 = 10
    let expected = balance!(10);

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

        assert_eq!(
            Token::token_info_by_id(DEFAULT_TOKEN_ID)
                .patronage_info
                .unclaimed_patronage_tally_amount,
            expected
        );
    })
}

#[test]
fn decrease_patronage_ok_noop_with_current_patronage_rate_specified_as_target() {
    let rate = BlockRate::from_yearly_rate(yearly_rate!(10), BlocksPerYear::get());

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
            rate,
        );
    })
}

// for correct final rate approximation see next test
#[test]
fn decrease_patronage_ok_with_event_deposit() {
    build_default_test_externalities().execute_with(|| {
        IssueTokenFixture::default()
            .with_patronage_rate(DEFAULT_MAX_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();

        ReducePatronageRateToFixture::default()
            .with_target_rate(DEFAULT_YEARLY_PATRONAGE_RATE.into())
            .execute_call()
            .unwrap();

        let final_rate = Token::token_info_by_id(1u64)
            .patronage_info
            .rate
            .to_yearly_rate_representation(BlocksPerYear::get());
        last_event_eq!(RawEvent::PatronageRateDecreasedTo(
            DEFAULT_TOKEN_ID,
            final_rate
        ));
    })
}

#[test]
fn decrease_patronage_ok_with_new_patronage_rate_correctly_approximated() {
    // K = 1/blocks_per_years => 10% * K ~= 19013261179 * 1e-18
    let expected = BlockRate(Perquintill::from_parts(19013261179));
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
                .rate
                .0
                .deconstruct(),
            expected.0.deconstruct(),
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

        assert_eq!(
            block!(11), // starting block + blocks
            Token::token_info_by_id(DEFAULT_TOKEN_ID)
                .patronage_info
                .last_unclaimed_patronage_tally_block
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
        let result = ReducePatronageRateToFixture::default()
            .with_token_id(DEFAULT_TOKEN_ID + 1u64)
            .execute_call();

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

        let result = ReducePatronageRateToFixture::default()
            .with_token_id(DEFAULT_TOKEN_ID + 1u64)
            .execute_call();

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
    // 10%(rate) * 10(blocks) * 100(supply)
    let expected_credit = balance!(100);

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
            expected_credit,
            DEFAULT_ISSUER_MEMBER_ID,
        ));
    })
}

#[test]
fn claim_patronage_ok_with_credit_accounting() {
    // (rate * blocks)% * init_supply = 100
    let expected_patronage_credit = balance!(100);
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

        assert_eq!(
            Token::account_info_by_token_and_member(DEFAULT_TOKEN_ID, DEFAULT_ISSUER_MEMBER_ID)
                .transferrable::<Test>(System::block_number()),
            expected_patronage_credit + DEFAULT_INITIAL_ISSUANCE,
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
            .unclaimed_patronage_at_block(System::block_number())
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
