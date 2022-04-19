#[cfg(test)]
use frame_support::{assert_noop, assert_ok};

use crate::tests::mock::*;
use crate::tests::test_utils::TokenDataBuilder;
use crate::traits::PalletToken;
use crate::types::TokenIssuanceParametersOf;
use crate::{account, balance, block, last_event_eq, origin, token, Error, RawEvent};

#[test]
fn issue_token_ok_with_patronage_tally_count_zero() {
    let patronage_rate = balance!(50);
    let token_id = token!(1);
    let (owner, init_supply) = (account!(1), balance!(10));

    let params = TokenIssuanceParametersOf::<Test> {
        patronage_rate,
        initial_supply: init_supply,
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::issue_token(owner, params);

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
    let (rate, blocks) = (balance!(20), block!(10));
    let (owner, init_supply) = (account!(1), balance!(10));

    let params = TokenIssuanceParametersOf::<Test> {
        patronage_rate: rate,
        initial_supply: init_supply,
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::issue_token(owner, params);
        increase_block_number_by(blocks);

        assert_eq!(
            Token::token_info_by_id(token_id)
                .unclaimed_patronage::<Block2Balance>(System::block_number()),
            rate * blocks * init_supply,
        );
    })
}

#[test]
fn issue_token_ok_with_correct_patronage_accounting_and_zero_supply() {
    let token_id = token!(1);
    let (rate, blocks) = (balance!(20), block!(10));
    let (owner, init_supply) = (account!(1), balance!(0));

    let params = TokenIssuanceParametersOf::<Test> {
        patronage_rate: rate,
        initial_supply: init_supply,
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::issue_token(owner, params);
        increase_block_number_by(blocks);

        assert_eq!(Token::token_info_by_id(token_id).supply, balance!(0),);
    })
}

#[test]
fn decrease_patronage_ok() {
    let rate = balance!(50);
    let (token_id, init_supply) = (token!(1), balance!(100));
    let owner = account!(1);
    let decrement = balance!(20);

    let token_info = TokenDataBuilder::new_empty()
        .with_patronage_rate(rate)
        .build();
    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, owner, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::reduce_patronage_rate_by(
                token_id, decrement,
            );

        assert_ok!(result);
    })
}

#[test]
fn decrease_patronage_ok_with_tally_count_twice_updated() {
    let token_id = token!(1);
    let decrement = balance!(1);
    let (owner, init_supply) = (account!(1), balance!(100));
    let (rate, blocks) = (balance!(3), block!(10));

    let token_info = TokenDataBuilder::new_empty()
        .with_patronage_rate(rate)
        .build();
    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, owner, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::reduce_patronage_rate_by(
            token_id, decrement,
        );
        increase_block_number_by(blocks);

        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::reduce_patronage_rate_by(
            token_id, decrement,
        );

        assert_eq!(
            init_supply * (blocks * rate) + init_supply * (blocks * (rate - decrement)),
            Token::token_info_by_id(token_id)
                .patronage_info
                .unclaimed_patronage_tally_amount,
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
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::reduce_patronage_rate_by(
            token_id, decrement,
        );

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
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::reduce_patronage_rate_by(
            token_id, decrement,
        );

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

        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::reduce_patronage_rate_by(
            token_id, decrement,
        );

        assert_eq!(
            block!(1) + blocks, // starting block + blocks
            Token::token_info_by_id(token_id)
                .patronage_info
                .last_unclaimed_patronage_tally_block
        )
    })
}

#[test]
fn decreasing_patronage_rate_fails_with_decrease_amount_too_large() {
    let rate = balance!(50);
    let (token_id, init_supply) = (token!(1), balance!(100));
    let owner = account!(1);
    let decrease = balance!(70);

    let token_info = TokenDataBuilder::new_empty()
        .with_patronage_rate(rate)
        .build();
    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, owner, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::reduce_patronage_rate_by(
                token_id, decrease,
            );

        assert_noop!(result, Error::<Test>::ReductionExceedingPatronageRate);
    })
}

#[test]
fn decreasing_patronage_rate_fails_invalid_token() {
    let config = GenesisConfigBuilder::new_empty().build();
    let decrease = balance!(20);
    let token_id = token!(1);

    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::reduce_patronage_rate_by(
                token_id, decrease,
            );

        assert_noop!(result, Error::<Test>::TokenDoesNotExist,);
    })
}

#[test]
fn claim_patronage_ok() {
    let token_id = token!(1);
    let owner = account!(1);
    let (rate, blocks) = (balance!(10), block!(10));

    let params = TokenDataBuilder::new_empty().with_patronage_rate(rate);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .with_account(owner, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_patronage_credit(
                token_id, owner,
            );

        assert_ok!(result);
    })
}

#[test]
fn claim_patronage_ok_with_event_deposit() {
    let token_id = token!(1);
    let (rate, blocks) = (balance!(10), block!(10));
    let (owner, init_supply) = (account!(1), balance!(100));

    let params = TokenDataBuilder::new_empty().with_patronage_rate(rate);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .with_account(owner, AccountData::new_with_liquidity(init_supply))
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_patronage_credit(
            token_id, owner,
        );

        last_event_eq!(RawEvent::PatronageCreditClaimed(
            token_id,
            rate * blocks * init_supply,
            owner,
        ));
    })
}

#[test]
fn claim_patronage_ok_with_credit_accounting() {
    let token_id = token!(1);
    let (owner, init_supply) = (account!(2), balance!(100));
    let (rate, blocks) = (balance!(10), block!(10));

    let token_info = TokenDataBuilder::new_empty()
        .with_patronage_rate(rate)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, owner, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_patronage_credit(
            token_id, owner,
        );

        assert_eq!(
            Token::account_info_by_token_and_account(token_id, owner).free_balance,
            rate * blocks * init_supply + init_supply, // initial + patronage claimed
        );
    })
}

#[test]
fn claim_patronage_ok_with_unclaimed_patronage_reset() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let account_id = account!(1);
    let owner = account!(2);
    let (rate, blocks) = (balance!(10), block!(10));

    let token_info = TokenDataBuilder::new_empty()
        .with_patronage_rate(rate)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, owner, init_supply)
        .with_account(account_id, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_patronage_credit(
            token_id, owner,
        );

        assert_eq!(
            Token::token_info_by_id(token_id)
                .unclaimed_patronage::<Block2Balance>(System::block_number()),
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
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_patronage_credit(
                token_id,
                owner_account,
            );

        assert_noop!(result, Error::<Test>::TokenDoesNotExist,);
    })
}

#[test]
fn claim_patronage_credit_fails_with_invalid_owner() {
    let rate = balance!(50);
    let (token_id, init_supply) = (token!(1), balance!(100));
    let invalid_owner = account!(1);
    let owner = account!(2);

    let token_info = TokenDataBuilder::new_empty()
        .with_patronage_rate(rate)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, owner, init_supply)
        .build();
    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_patronage_credit(
                token_id,
                invalid_owner,
            );

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn claim_patronage_ok_with_patronage_claimed_and_tally_set_to_zero() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let owner = account!(1);
    let (rate, blocks) = (balance!(10), block!(10));

    let token_info = TokenDataBuilder::new_empty()
        .with_patronage_rate(rate)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, owner, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_patronage_credit(
            token_id, owner,
        );

        assert_eq!(
            Token::token_info_by_id(token_id)
                .patronage_info
                .unclaimed_patronage_tally_amount,
            balance!(0)
        );
    })
}

#[test]
fn claim_patroage_ok_with_tally_block_update_after_account_removed() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account) = (account!(1), account!(2));
    let (rate, blocks) = (balance!(10), block!(10));
    let amount_burned = balance!(100);

    let token_info = TokenDataBuilder::new_empty()
        .with_patronage_rate(rate)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, owner, init_supply)
        .with_account(user_account, AccountData::new_with_liquidity(amount_burned))
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = Token::dust_account(origin!(user_account), token_id, user_account);

        assert_eq!(
            Token::token_info_by_id(token_id)
                .patronage_info
                .last_unclaimed_patronage_tally_block,
            block!(1) + blocks
        );
    })
}

#[test]
fn claim_patroage_ok_with_tally_amount_update_after_account_removed() {
    let (token_id, owner_balance) = (token!(1), balance!(100));
    let (owner, user_account) = (account!(1), account!(2));
    let (rate, blocks) = (balance!(10), block!(10));
    let amount_burned = balance!(100);

    let token_info = TokenDataBuilder::new_empty()
        .with_patronage_rate(rate)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, owner, owner_balance)
        .with_account(user_account, AccountData::new_with_liquidity(amount_burned))
        .build();

    let init_supply = amount_burned + owner_balance;

    build_test_externalities(config).execute_with(|| {
        increase_block_number_by(blocks);

        let _ = Token::dust_account(origin!(user_account), token_id, user_account);

        assert_eq!(
            Token::token_info_by_id(token_id)
                .patronage_info
                .unclaimed_patronage_tally_amount,
            blocks * rate * init_supply,
        );
    })
}
