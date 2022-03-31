#[cfg(test)]
use frame_support::{assert_noop, assert_ok};
use sp_arithmetic::traits::{Saturating, Zero};
use sp_runtime::Percent;

use crate::tests::mock::*;
use crate::tests::test_utils::TokenDataBuilder;
use crate::traits::PalletToken;
use crate::{account, balance, last_event_eq, token, Error, RawEvent};

#[test]
fn deposit_creating_ok() {
    let patronage_rate = Percent::from_percent(1);
    let token_id = token!(1);
    let account_id = account!(1);
    let amount = balance!(100);

    let params = TokenDataBuilder::new_empty().with_patronage_rate(patronage_rate);
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::deposit_creating(token_id, account_id, amount);

        assert_ok!(result);
    })
}

#[test]
fn deposit_creating_ok_with_destination_free_balance_increase() {
    let patronage_rate = Percent::from_percent(1);
    let token_id = token!(1);
    let account_id = account!(1);
    let amount = balance!(100);

    let params = TokenDataBuilder::new_empty().with_patronage_rate(patronage_rate);
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::deposit_creating(token_id, account_id, amount);

        assert_eq!(
            amount,
            Token::account_info_by_token_and_account(token_id, account_id).free_balance,
        );
    })
}

#[test]
fn deposit_creating_ok_with_total_issuance_increase_and_no_patronage() {
    let token_id = token!(1);
    let account_id = account!(1);
    let amount = balance!(100);

    let params = TokenDataBuilder::new_empty();
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::deposit_creating(token_id, account_id, amount);

        assert_eq!(
            amount,
            Token::token_info_by_id(token_id).current_total_issuance,
        );
    })
}

#[test]
fn deposit_creating_ok_with_event_deposit() {
    let patronage_rate = Percent::from_percent(1);
    let token_id = token!(1);
    let account_id = account!(1);
    let amount = balance!(100);

    let params = TokenDataBuilder::new_empty().with_patronage_rate(patronage_rate);
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::deposit_creating(token_id, account_id, amount);

        last_event_eq!(RawEvent::TokenAmountDepositedInto(
            token_id, account_id, amount
        ));
    })
}

#[test]
fn deposit_creating_ok_with_patronage_and_issuance_increase() {
    let patronage_rate = Percent::from_percent(1);
    let token_id = token!(1);
    let account_id = account!(1);
    let amount = balance!(100);

    let params = TokenDataBuilder::new_empty().with_patronage_rate(patronage_rate);
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::deposit_creating(token_id, account_id, amount);

        assert_eq!(
            amount.saturating_add(patronage_rate.mul_floor(amount)),
            Token::token_info_by_id(token_id).current_total_issuance
        );
    })
}

#[test]
fn deposit_creating_ok_with_free_balance_addition_to_existing_account() {
    let token_id = token!(1);
    let account_id = account!(1);
    let (initial_free_balance, initial_reserved) = (balance!(10), balance!(0));
    let amount = balance!(10);

    let params = TokenDataBuilder::new_empty();
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .with_account(account_id, initial_free_balance, initial_reserved)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::deposit_creating(token_id, account_id, amount);

        assert_eq!(
            initial_free_balance.saturating_add(amount),
            Token::account_info_by_token_and_account(token_id, account_id).free_balance,
        );
    })
}

#[test]
fn deposit_creating_ok_without_reserved_balance_addition_to_existing_account() {
    let token_id = token!(1);
    let account_id = account!(1);
    let (initial_free_balance, initial_reserved) = (balance!(10), balance!(0));
    let amount = balance!(10);

    let params = TokenDataBuilder::new_empty();
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .with_account(account_id, initial_free_balance, initial_reserved)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::deposit_creating(token_id, account_id, amount);

        assert_eq!(
            initial_reserved,
            Token::account_info_by_token_and_account(token_id, account_id).reserved_balance,
        );
    })
}

#[test]
fn deposit_creating_ok_with_owner_credit_accounted() {
    let token_id = token!(1);
    let patronage_rate = Percent::from_percent(50);
    let account_id = account!(1);
    let amount = balance!(10);
    let credit = patronage_rate.mul_floor(amount);

    let params = TokenDataBuilder::new_empty().with_patronage_rate(patronage_rate);
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::deposit_creating(token_id, account_id, amount);

        assert_eq!(
            credit,
            Token::token_info_by_id(token_id)
                .patronage_info
                .outstanding_credit,
        );
    })
}

#[test]
fn decrease_patronage_ok() {
    let patronage_rate = Percent::from_percent(50);
    let token_id = token!(1);
    let decrement = Percent::from_percent(20);

    let params = TokenDataBuilder::new_empty().with_patronage_rate(patronage_rate);
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
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
fn decrease_patronage_ok_with_event_deposit() {
    let patronage_rate = Percent::from_percent(50);
    let token_id = token!(1);
    let decrement = Percent::from_percent(20);

    let params = TokenDataBuilder::new_empty().with_patronage_rate(patronage_rate);
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
    let patronage_rate = Percent::from_percent(50);
    let token_id = token!(1);
    let decrement = Percent::from_percent(20);

    let params = TokenDataBuilder::new_empty().with_patronage_rate(patronage_rate);
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::reduce_patronage_rate_by(
            token_id, decrement,
        );

        assert_eq!(
            patronage_rate.saturating_sub(decrement),
            Token::token_info_by_id(token_id).patronage_info.rate
        )
    })
}

#[test]
fn decreasing_patronage_rate_fails_with_decrease_amount_too_large() {
    let patronage_rate = Percent::from_percent(50);
    let token_id = token!(1);
    let decrease = Percent::from_percent(70);

    let params = TokenDataBuilder::new_empty().with_patronage_rate(patronage_rate);
    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
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
    let decrease = Percent::from_percent(20);
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
    let owner_account_id = account!(1);
    let credit = balance!(100);

    let params = TokenDataBuilder::new_empty().with_patronage_credit(credit);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .with_account(owner_account_id, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_patronage_credit(
                token_id,
                owner_account_id,
            );

        assert_ok!(result);
    })
}

#[test]
fn claim_patronage_ok_with_event_deposit() {
    let token_id = token!(1);
    let owner_account_id = account!(2);
    let credit = balance!(100);

    let params = TokenDataBuilder::new_empty().with_patronage_credit(credit);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .with_account(owner_account_id, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_patronage_credit(
            token_id,
            owner_account_id,
        );

        last_event_eq!(RawEvent::PatronageCreditClaimed(
            token_id,
            credit,
            owner_account_id,
        ));
    })
}

#[test]
fn claim_patronage_ok_with_credit_accounting() {
    let token_id = token!(1);
    let owner_account_id = account!(2);
    let credit = balance!(100);

    let params = TokenDataBuilder::new_empty().with_patronage_credit(credit);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .with_account(owner_account_id, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_patronage_credit(
            token_id,
            owner_account_id,
        );

        assert_eq!(
            Token::account_info_by_token_and_account(token_id, owner_account_id).free_balance,
            credit,
        );
    })
}

#[test]
fn claim_patronage_ok_with_outstanding_credit_reset() {
    let token_id = token!(1);
    let account_id = account!(1);
    let owner_account_id = account!(2);
    let credit = balance!(100);

    let params = TokenDataBuilder::new_empty().with_patronage_credit(credit);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .with_account(account_id, 0, 0)
        .with_account(owner_account_id, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_patronage_credit(
            token_id,
            owner_account_id,
        );

        assert!(Token::token_info_by_id(token_id)
            .patronage_info
            .outstanding_credit
            .is_zero());
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
fn claim_patronage_credit_fails_with_invalid_owner_account_id() {
    let patronage_rate = Percent::from_percent(50);
    let token_id = token!(1);
    let account_id = account!(1);
    let owner_account_id = account!(2);
    let amount = balance!(100);

    let params = TokenDataBuilder::new_empty().with_patronage_rate(patronage_rate);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, params.build())
        .with_account(account_id, amount, 0)
        .build();
    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::claim_patronage_credit(
                token_id,
                owner_account_id,
            );

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}
