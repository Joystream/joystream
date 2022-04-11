#[cfg(test)]
use frame_support::{assert_noop, assert_ok};

use crate::tests::mock::*;
use crate::tests::test_utils::TokenDataBuilder;
use crate::traits::PalletToken;
use crate::types::TokenIssuanceParametersOf;
use crate::{account, balance, block, last_event_eq, token, Error, RawEvent};

#[test]
fn issue_token_ok_with_patronage_tally_count_zero() {
    let patronage_rate = balance!(50);
    let token_id = token!(1);

    let params = TokenIssuanceParametersOf::<Test> {
        patronage_rate,
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::issue_token(params);

        assert_eq!(
            Token::token_info_by_id(token_id).patronage_info.tally,
            balance!(0),
        );
    })
}

#[test]
fn issue_token_ok_with_correct_credit_accounting() {
    let token_id = token!(1);
    let (rate, blocks) = (balance!(20), block!(10));

    let params = TokenIssuanceParametersOf::<Test> {
        patronage_rate: rate,
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::issue_token(params);
        increase_block_number_by(blocks);

        assert_eq!(
            Token::token_info_by_id(token_id)
                .patronage_info
                .outstanding_credit::<Block2Balance>(System::block_number()),
            balance!(200), // rate * blocks
        );
    })
}

#[test]
fn decrease_patronage_ok() {
    let patronage_rate = balance!(50);
    let token_id = token!(1);
    let decrement = balance!(20);

    let params = TokenDataBuilder::new_empty().with_patronage_rate(patronage_rate);
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::reduce_patronage_rate_by(token_id, decrement);

        assert_ok!(result);
    })
}

#[test]
fn decrease_patronage_ok_with_tally_count_updated() {
    let token_id = token!(1);
    let decrement = balance!(10);
    let (rate, blocks) = (balance!(20), block!(10));

    let params = TokenDataBuilder::new_empty().with_patronage_rate(rate);
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = Token::reduce_patronage_rate_by(token_id, decrement);

        assert_eq!(
            balance!(200), // blocks * rate
            Token::token_info_by_id(token_id).patronage_info.tally,
        );
    })
}

#[test]
fn decrease_patronage_ok_with_tally_count_twice_updated() {
    let token_id = token!(1);
    let decrement = balance!(10);
    let (rate, blocks) = (balance!(30), block!(10));

    let params = TokenDataBuilder::new_empty().with_patronage_rate(rate);
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);
        let _ = Token::reduce_patronage_rate_by(token_id, decrement);
        increase_block_number_by(blocks);

        let _ = Token::reduce_patronage_rate_by(token_id, decrement);

        assert_eq!(
            balance!(500), // blocks * rate1 + blocks * rate2
            Token::token_info_by_id(token_id).patronage_info.tally,
        );
    })
}

#[test]
fn decrease_patronage_ok_with_event_deposit() {
    let rate = balance!(50);
    let token_id = token!(1);
    let decrement = balance!(20);

    let params = TokenDataBuilder::new_empty().with_patronage_rate(rate);
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::reduce_patronage_rate_by(token_id, decrement);

        last_event_eq!(RawEvent::PatronageRateDecreasedTo(
            token_id,
            Token::token_info_by_id(token_id).patronage_info.rate
        ));
    })
}

#[test]
fn decrease_patronage_ok_with_correct_final_rate() {
    let rate = balance!(50);
    let token_id = token!(1);
    let decrement = balance!(20);

    let params = TokenDataBuilder::new_empty().with_patronage_rate(rate);
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::reduce_patronage_rate_by(token_id, decrement);

        assert_eq!(
            rate.saturating_sub(decrement),
            Token::token_info_by_id(token_id).patronage_info.rate
        )
    })
}

#[test]
fn decrease_patronage_ok_with_last_tally_block_updated() {
    let token_id = token!(1);
    let decrement = balance!(10);
    let (rate, blocks) = (balance!(20), block!(10));

    let params = TokenDataBuilder::new_empty().with_patronage_rate(rate);
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = Token::reduce_patronage_rate_by(token_id, decrement);

        assert_eq!(
            block!(1) + blocks, // starting block + blocks
            Token::token_info_by_id(token_id)
                .patronage_info
                .last_tally_update_block
        )
    })
}

#[test]
fn decreasing_patronage_rate_fails_with_decrease_amount_too_large() {
    let rate = balance!(50);
    let token_id = token!(1);
    let decrease = balance!(70);

    let params = TokenDataBuilder::new_empty().with_patronage_rate(rate);
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::reduce_patronage_rate_by(token_id, decrease);

        assert_noop!(result, Error::<Test>::ReductionExceedingPatronageRate);
    })
}

#[test]
fn decreasing_patronage_rate_fails_invalid_token() {
    let config = GenesisConfigBuilder::new_empty().build();
    let decrease = balance!(20);
    let token_id = token!(1);

    build_test_externalities(config).execute_with(|| {
        let result = Token::reduce_patronage_rate_by(token_id, decrease);

        assert_noop!(result, Error::<Test>::TokenDoesNotExist,);
    })
}

#[test]
fn claim_patronage_ok() {
    let token_id = token!(1);
    let owner_account_id = account!(1);
    let (rate, blocks) = (balance!(10), block!(10));

    let params = TokenDataBuilder::new_empty().with_patronage_rate(rate);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .with_account(owner_account_id, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let result = Token::claim_patronage_credit(token_id, owner_account_id);

        assert_ok!(result);
    })
}

#[test]
fn claim_patronage_ok_with_event_deposit() {
    let token_id = token!(1);
    let owner_account_id = account!(2);
    let (rate, blocks) = (balance!(10), block!(10));

    let params = TokenDataBuilder::new_empty().with_patronage_rate(rate);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .with_account(owner_account_id, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = Token::claim_patronage_credit(token_id, owner_account_id);

        last_event_eq!(RawEvent::PatronageCreditClaimedAtBlock(
            token_id,
            balance!(100), // rate * blocks
            owner_account_id,
            block!(1) + blocks, // starting block + blocks
        ));
    })
}

#[test]
fn claim_patronage_ok_with_credit_accounting() {
    let token_id = token!(1);
    let owner_account_id = account!(2);
    let (rate, blocks) = (balance!(10), block!(10));

    let params = TokenDataBuilder::new_empty().with_patronage_rate(rate);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .with_account(owner_account_id, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = Token::claim_patronage_credit(token_id, owner_account_id);

        assert_eq!(
            Token::account_info_by_token_and_account(token_id, owner_account_id).free_balance,
            balance!(100), // rate * blocks
        );
    })
}

#[test]
fn claim_patronage_ok_with_outstanding_credit_reset() {
    let token_id = token!(1);
    let account_id = account!(1);
    let owner_account_id = account!(2);
    let (rate, blocks) = (balance!(10), block!(10));

    let params = TokenDataBuilder::new_empty().with_patronage_rate(rate);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .with_account(account_id, 0, 0)
        .with_account(owner_account_id, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = Token::claim_patronage_credit(token_id, owner_account_id);

        assert_eq!(
            Token::token_info_by_id(token_id)
                .patronage_info
                .outstanding_credit::<Block2Balance>(System::block_number()),
            balance!(0),
        );
    })
}

#[test]
fn claim_patronage_credit_fails_with_invalid_token_id() {
    let token_id = token!(1);
    let owner_account = account!(1);
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::claim_patronage_credit(token_id, owner_account);

        assert_noop!(result, Error::<Test>::TokenDoesNotExist,);
    })
}

#[test]
fn claim_patronage_credit_fails_with_invalid_owner_account_id() {
    let rate = balance!(50);
    let token_id = token!(1);
    let account_id = account!(1);
    let owner_account_id = account!(2);
    let amount = balance!(100);

    let params = TokenDataBuilder::new_empty().with_patronage_rate(rate);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .with_account(account_id, amount, 0)
        .build();
    build_test_externalities(config).execute_with(|| {
        let result = Token::claim_patronage_credit(token_id, owner_account_id);

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}
