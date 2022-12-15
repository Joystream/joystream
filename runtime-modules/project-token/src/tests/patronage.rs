#[cfg(test)]
use frame_support::{assert_noop, assert_ok};
use sp_runtime::{Permill, Perquintill};

use crate::tests::fixtures::{default_upload_context, IssueRevenueSplitFixture};
use crate::tests::mock::*;
use crate::tests::test_utils::TokenDataBuilder;
use crate::traits::PalletToken;
use crate::types::{BlockRate, TokenIssuanceParametersOf, YearlyRate};
use crate::{balance, block, last_event_eq, member, rate, token, yearly_rate, Error, RawEvent};

#[test]
fn issue_token_ok_with_patronage_tally_count_zero() {
    let patronage_rate = DEFAULT_YEARLY_PATRONAGE_RATE.into();
    let token_id = token!(1);
    let ((owner_id, owner_acc), init_supply) = (member!(1), balance!(10));

    let params = TokenIssuanceParametersOf::<Test> {
        patronage_rate,
        ..Default::default()
    }
    .with_allocation(&owner_id, init_supply, None);
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::issue_token(owner_acc, params, default_upload_context());

        assert_eq!(
            Token::token_info_by_id(token_id)
                .patronage_info
                .unclaimed_patronage_tally_amount,
            balance!(0),
        );
    })
}

#[test]
fn issue_token_ok_with_correct_non_zero_patronage_accounting() {
    let token_id = token!(1);
    let (patronage_rate, blocks) = (DEFAULT_YEARLY_PATRONAGE_RATE.into(), block!(10));
    let ((owner_id, owner_acc), init_supply) = (member!(1), balance!(1_000_000_000));

    let params = TokenIssuanceParametersOf::<Test> {
        patronage_rate,
        revenue_split_rate: DEFAULT_SPLIT_RATE,
        ..Default::default()
    }
    .with_allocation(&owner_id, init_supply, None);
    let config = GenesisConfigBuilder::new_empty().build();

    // K = 1/blocks_per_years => floor(10% * 10 * K * 1bill) = floor(K * 2bill) = 380
    let expected = balance!(190);

    build_test_externalities(config).execute_with(|| {
        let _ = Token::issue_token(owner_acc, params, default_upload_context());
        increase_block_number_by(blocks);

        assert_eq!(
            Token::token_info_by_id(token_id).unclaimed_patronage_at_block(System::block_number()),
            expected,
        );
    })
}

#[test]
fn issue_token_ok_with_correct_patronage_accounting_and_zero_supply() {
    let token_id = token!(1);
    let (patronage_rate, blocks) = (DEFAULT_YEARLY_PATRONAGE_RATE.into(), block!(10));
    let ((owner_id, owner_acc), initial_supply) = (member!(1), balance!(0));

    let params = TokenIssuanceParametersOf::<Test> {
        patronage_rate,
        ..Default::default()
    }
    .with_allocation(&owner_id, initial_supply, None);
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::issue_token(owner_acc, params, default_upload_context());
        increase_block_number_by(blocks);

        assert_eq!(Token::token_info_by_id(token_id).total_supply, balance!(0),);
    })
}

#[test]
fn decrease_patronage_ok() {
    let rate = rate!(50);
    let (token_id, init_supply) = (token!(1), balance!(100));
    let owner_id = member!(1).0;
    let decrement = DEFAULT_YEARLY_PATRONAGE_RATE.into();

    let token_info = TokenDataBuilder::new_empty()
        .with_patronage_rate(rate)
        .build();
    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, owner_id, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::reduce_patronage_rate_to(token_id, decrement);

        assert_ok!(result);
    })
}

#[test]
fn decrease_patronage_ok_with_tally_count_correctly_updated() {
    let rate = rate!(1);
    let (token_id, init_supply) = (token!(1), balance!(100));
    let owner_id = member!(1).0;
    let blocks = block!(10);
    let target_rate = DEFAULT_YEARLY_PATRONAGE_RATE.into();

    let token_info = TokenDataBuilder::new_empty()
        .with_patronage_rate(rate)
        .build();
    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, owner_id, init_supply)
        .build();

    // 10% * 100 = 10
    let expected = balance!(10);

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);
        let result = Token::reduce_patronage_rate_to(token_id, target_rate);

        assert_ok!(result);
        assert_eq!(
            Token::token_info_by_id(token_id)
                .patronage_info
                .unclaimed_patronage_tally_amount,
            expected
        );
    })
}

#[test]
fn decrease_patronage_ok_noop_with_current_patronage_rate_specified_as_target() {
    let rate = BlockRate::from_yearly_rate(yearly_rate!(10), BlocksPerYear::get());
    let (token_id, init_supply) = (token!(1), balance!(100));
    let owner_id = member!(1).0;
    let target_rate = DEFAULT_YEARLY_PATRONAGE_RATE.into();

    let token_info = TokenDataBuilder::new_empty()
        .with_patronage_rate(rate)
        .build();
    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, owner_id, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::reduce_patronage_rate_to(token_id, target_rate);

        assert_ok!(result);
        assert_eq!(Token::token_info_by_id(token_id).patronage_info.rate, rate);
    })
}

// for correct final rate approximation see next test
#[test]
fn decrease_patronage_ok_with_event_deposit() {
    let init_rate = DEFAULT_MAX_YEARLY_PATRONAGE_RATE.into();
    let token_id = token!(1);
    let decrement = DEFAULT_YEARLY_PATRONAGE_RATE.into();

    let params = TokenDataBuilder::new_empty()
        .with_patronage_rate(BlockRate::from_yearly_rate(init_rate, BlocksPerYear::get()));
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::reduce_patronage_rate_to(token_id, decrement);

        let final_rate = Token::token_info_by_id(token_id)
            .patronage_info
            .rate
            .to_yearly_rate_representation(BlocksPerYear::get());

        last_event_eq!(RawEvent::PatronageRateDecreasedTo(token_id, final_rate));
    })
}

#[test]
fn decrease_patronage_ok_with_new_patronage_rate_correctly_approximated() {
    let init_rate = DEFAULT_MAX_YEARLY_PATRONAGE_RATE.into();
    let token_id = token!(1);
    let target_rate = DEFAULT_YEARLY_PATRONAGE_RATE.into();

    // K = 1/blocks_per_years => 10% * K ~= 19013261179 * 1e-18
    let expected = BlockRate(Perquintill::from_parts(19013261179));

    let params = TokenDataBuilder::new_empty()
        .with_patronage_rate(BlockRate::from_yearly_rate(init_rate, BlocksPerYear::get()));
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::reduce_patronage_rate_to(token_id, target_rate);

        assert_eq!(
            Token::token_info_by_id(token_id)
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
    let token_id = token!(1);
    let target_rate = DEFAULT_YEARLY_PATRONAGE_RATE.into();
    let (init_rate, blocks) = (DEFAULT_MAX_YEARLY_PATRONAGE_RATE.into(), block!(10));

    let params = TokenDataBuilder::new_empty()
        .with_patronage_rate(BlockRate::from_yearly_rate(init_rate, BlocksPerYear::get()));

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = Token::reduce_patronage_rate_to(token_id, target_rate);

        assert_eq!(
            block!(1) + blocks, // starting block + blocks
            Token::token_info_by_id(token_id)
                .patronage_info
                .last_unclaimed_patronage_tally_block
        )
    })
}

#[test]
fn decreasing_patronage_rate_fails_with_target_rate_exceeding_current_rate() {
    let init_rate = DEFAULT_YEARLY_PATRONAGE_RATE.into();
    let (token_id, init_supply) = (token!(1), balance!(100));
    let owner_id = member!(1).0;
    let target_rate = DEFAULT_MAX_YEARLY_PATRONAGE_RATE.into();

    let token_info = TokenDataBuilder::new_empty()
        .with_patronage_rate(BlockRate::from_yearly_rate(init_rate, BlocksPerYear::get()))
        .build();
    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, owner_id, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::reduce_patronage_rate_to(token_id, target_rate);

        assert_noop!(
            result,
            Error::<Test>::TargetPatronageRateIsHigherThanCurrentRate
        );
    })
}

#[test]
fn decreasing_patronage_rate_fails_invalid_token() {
    let config = GenesisConfigBuilder::new_empty().build();
    let decrease = yearly_rate!(20);
    let token_id = token!(1);

    build_test_externalities(config).execute_with(|| {
        let result = Token::reduce_patronage_rate_to(token_id, decrease);

        assert_noop!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn claim_patronage_fails_with_active_revenue_split() {
    let token_id = token!(1);
    let (owner_id, owner_account) = member!(1);
    let (rate, blocks) = (rate!(10), block!(MIN_REVENUE_SPLIT_TIME_TO_START - 1));

    let params = TokenDataBuilder::new_empty()
        .with_patronage_rate(rate)
        .with_split_rate(DEFAULT_SPLIT_RATE);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .with_account(owner_id, ConfigAccountData::default())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(
            &owner_account,
            DEFAULT_SPLIT_REVENUE + ExistentialDeposit::get(),
        );
        IssueRevenueSplitFixture::default().execute_call().unwrap(); // activate revenue split
        increase_block_number_by(blocks);

        // expect it to fail even though the staking period is not started yet
        assert_noop!(
            Token::claim_patronage_credit(token_id, owner_id),
            Error::<Test>::CannotModifySupplyWhenRevenueSplitsAreActive,
        );
    })
}

#[test]
fn claim_patronage_ok() {
    let token_id = token!(1);
    let owner_id = member!(1).0;
    let (rate, blocks) = (rate!(10), block!(10));

    let params = TokenDataBuilder::new_empty().with_patronage_rate(rate);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .with_account(owner_id, ConfigAccountData::default())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let result = Token::claim_patronage_credit(token_id, owner_id);

        assert_ok!(result);
    })
}

#[test]
fn claim_patronage_ok_with_patronage_rate_for_period_capped_at_100pct() {
    // Simulate condition where patronage_rate.for_period(blocks) > 100%
    let token_id = token!(1);
    let owner_id = member!(1).0;
    let supply = balance!(100);
    let rate = rate!(55);
    let blocks = block!(2); // patronage rate for period = 110% > 100%

    let params = TokenDataBuilder::new_empty().with_patronage_rate(rate);
    // rate for period = 110% but effective rate is capped at 100% -> 100% supply + supply
    let expected = balance!(100) + supply;

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, params.build(), owner_id, supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = Token::claim_patronage_credit(token_id, owner_id);

        assert_eq!(
            expected,
            Token::account_info_by_token_and_member(token_id, owner_id)
                .transferrable::<Test>(System::block_number())
        );
    })
}

#[test]
fn claim_patronage_ok_with_supply_greater_than_u64_max() {
    let token_id = token!(1);
    let owner_id = member!(1).0;
    let (rate, blocks) = (rate!(10), block!(10));
    let supply = balance!(1_000_000_000_000_000_000_000_000_000_000u128);
    // rate * blocks = 100% , expected  = 100 % supply + supply
    let expected_amount = balance!(2_000_000_000_000_000_000_000_000_000_000u128);

    let params = TokenDataBuilder::new_empty().with_patronage_rate(rate);

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, params.build(), owner_id, supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = Token::claim_patronage_credit(token_id, owner_id);

        assert_eq!(
            Token::account_info_by_token_and_member(token_id, owner_id)
                .transferrable::<Test>(System::block_number()),
            expected_amount
        );
    })
}

#[test]
fn claim_patronage_ok_with_event_deposit() {
    let token_id = token!(1);
    let (rate, blocks) = (rate!(10), block!(10));
    let (owner_id, init_supply) = (member!(1).0, balance!(100));

    let params = TokenDataBuilder::new_empty().with_patronage_rate(rate);

    // 10%(rate) * 10(blocks) * 100(supply)
    let expected_credit = balance!(100);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .with_account(owner_id, ConfigAccountData::new_with_amount(init_supply))
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = Token::claim_patronage_credit(token_id, owner_id);

        last_event_eq!(RawEvent::PatronageCreditClaimed(
            token_id,
            expected_credit,
            owner_id,
        ));
    })
}

#[test]
fn claim_patronage_ok_with_credit_accounting() {
    let token_id = token!(1);
    let (owner_id, init_supply) = (member!(1).0, balance!(100));
    let (rate, blocks) = (rate!(10), block!(10));

    // (rate * blocks)% * init_supply = 100
    let expected_patronage_credit = balance!(100);

    let token_info = TokenDataBuilder::new_empty()
        .with_patronage_rate(rate)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, owner_id, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = Token::claim_patronage_credit(token_id, owner_id);

        assert_eq!(
            Token::account_info_by_token_and_member(token_id, owner_id)
                .transferrable::<Test>(System::block_number()),
            expected_patronage_credit + init_supply,
        );
    })
}

#[test]
fn claim_patronage_ok_with_unclaimed_patronage_reset() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let owner_id = member!(1).0;
    let (rate, blocks) = (rate!(10), block!(10));

    let token_info = TokenDataBuilder::new_empty()
        .with_patronage_rate(rate)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, owner_id, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = Token::claim_patronage_credit(token_id, owner_id);

        assert_eq!(
            Token::token_info_by_id(token_id).unclaimed_patronage_at_block(System::block_number()),
            balance!(0),
        );
    })
}

#[test]
fn claim_patronage_credit_fails_with_invalid_token_id() {
    let token_id = token!(1);
    let owner_id = member!(1).0;
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::claim_patronage_credit(token_id, owner_id);

        assert_noop!(result, Error::<Test>::TokenDoesNotExist,);
    })
}

#[test]
fn claim_patronage_credit_fails_with_invalid_owner() {
    let rate = rate!(50);
    let (token_id, init_supply) = (token!(1), balance!(100));
    let invalid_owner_id = member!(2).0;
    let owner_id = member!(1).0;

    let token_info = TokenDataBuilder::new_empty()
        .with_patronage_rate(rate)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, owner_id, init_supply)
        .build();
    build_test_externalities(config).execute_with(|| {
        let result = Token::claim_patronage_credit(token_id, invalid_owner_id);

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn claim_patronage_ok_with_tally_amount_set_to_zero() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let owner_id = member!(1).0;
    let (rate, blocks) = (rate!(10), block!(10));

    let token_info = TokenDataBuilder::new_empty()
        .with_patronage_rate(rate)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, owner_id, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = Token::claim_patronage_credit(token_id, owner_id);

        assert_eq!(
            Token::token_info_by_id(token_id)
                .patronage_info
                .unclaimed_patronage_tally_amount,
            balance!(0)
        );
    })
}

#[test]
fn update_max_yearly_patronage_rate_fails_with_non_root_origin() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let res = Token::update_max_yearly_patronage_rate(
            Origin::signed(1u64),
            Permill::from_percent(7).into(),
        );

        assert!(res.is_err());
    })
}
