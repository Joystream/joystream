#[cfg(test)]
use frame_support::{assert_noop, assert_ok};
use sp_arithmetic::traits::{One, Saturating};
use sp_runtime::Percent;

use crate::tests::mock::*;
use crate::traits::{MultiCurrencyBase, PatronageTrait};
use crate::types::TokenIssuanceParametersOf;
use crate::{last_event_eq, Error, RawEvent};

#[test]
fn deposit_creating_ok_with_non_existing_account_and_patronage() {
    let patronage_rate = Percent::from_percent(1);
    let params = TokenIssuanceParametersOf::<Test> {
        existential_deposit: DEFAULT_EXISTENTIAL_DEPOSIT,
        patronage_rate,
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new()
        .add_token_with_params(params)
        .build();

    let token_id = TokenId::one();
    let account_id = AccountId::from(DEFAULT_ACCOUNT_ID);
    let amount = Balance::from(100u32);

    build_test_externalities(config).execute_with(|| {
        let issuance_pre = Token::token_info_by_id(token_id).current_total_issuance;
        let credit_increase = patronage_rate.mul_floor(amount);
        let credit_pre = Token::token_info_by_id(token_id)
            .patronage_info
            .outstanding_credit;
        assert_ok!(
            <Token as MultiCurrencyBase<AccountId, IssuanceParams>>::deposit_creating(
                token_id, account_id, amount
            )
        );
        assert_eq!(
            amount,
            Token::account_info_by_token_and_account(token_id, account_id).free_balance,
        );

        let credit_post = Token::token_info_by_id(token_id)
            .patronage_info
            .outstanding_credit;
        let issuance_post = Token::token_info_by_id(token_id).current_total_issuance;

        assert_eq!(
            issuance_pre.saturating_add(amount.saturating_add(credit_increase)),
            issuance_post,
        );

        assert_eq!(credit_pre.saturating_add(credit_increase), credit_post);

        last_event_eq!(RawEvent::TokenAmountDepositedInto(
            token_id, account_id, amount
        ));
    })
}

#[test]
fn deposit_creating_ok_with_existing_account_and_patronage() {
    let patronage_rate = Percent::from_percent(1);
    let params = TokenIssuanceParametersOf::<Test> {
        existential_deposit: DEFAULT_EXISTENTIAL_DEPOSIT,
        patronage_rate,
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new()
        .add_token_with_params(params)
        .add_account_info()
        .build();

    let token_id = TokenId::one();
    let account_id = AccountId::from(DEFAULT_ACCOUNT_ID);
    let amount = Balance::from(100u32);

    build_test_externalities(config).execute_with(|| {
        let issuance_pre = Token::token_info_by_id(token_id).current_total_issuance;
        let credit_pre = Token::token_info_by_id(token_id)
            .patronage_info
            .outstanding_credit;
        let credit_increase = patronage_rate.mul_floor(amount);
        let balance_pre =
            Token::account_info_by_token_and_account(token_id, account_id).free_balance;

        assert_ok!(
            <Token as MultiCurrencyBase<AccountId, IssuanceParams>>::deposit_creating(
                token_id, account_id, amount
            )
        );
        let balance_post =
            Token::account_info_by_token_and_account(token_id, account_id).free_balance;
        let issuance_post = Token::token_info_by_id(token_id).current_total_issuance;
        let credit_post = Token::token_info_by_id(token_id)
            .patronage_info
            .outstanding_credit;

        assert_eq!(balance_pre.saturating_add(amount), balance_post);

        assert_eq!(
            issuance_pre.saturating_add(amount.saturating_add(credit_increase)),
            issuance_post,
        );

        assert_eq!(credit_pre.saturating_add(credit_increase), credit_post);
        last_event_eq!(RawEvent::TokenAmountDepositedInto(
            token_id, account_id, amount
        ));
    })
}

#[test]
fn decreasing_patronage_rate_ok() {
    let patronage_rate_pre = Percent::from_percent(2);
    let params = TokenIssuanceParametersOf::<Test> {
        existential_deposit: DEFAULT_EXISTENTIAL_DEPOSIT,
        patronage_rate: patronage_rate_pre,
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new()
        .add_token_with_params(params)
        .build();

    let token_id = TokenId::one();
    let decrease = Percent::from_percent(1);

    build_test_externalities(config).execute_with(|| {
        assert_ok!(
            <Token as PatronageTrait<AccountId, IssuanceParams>>::reduce_patronage_rate_by(
                token_id, decrease,
            )
        );
        let patronage_rate_post = Token::token_info_by_id(token_id).patronage_info.rate;

        assert_eq!(
            patronage_rate_pre,
            patronage_rate_post.saturating_add(decrease)
        );

        last_event_eq!(RawEvent::PatronageRateDecreasedTo(
            token_id,
            patronage_rate_post
        ));
    })
}

#[test]
fn decreasing_patronage_rate_fails_with_overflow() {
    let patronage_rate = Percent::from_percent(2);
    let params = TokenIssuanceParametersOf::<Test> {
        existential_deposit: DEFAULT_EXISTENTIAL_DEPOSIT,
        patronage_rate,
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new()
        .add_token_with_params(params)
        .build();

    let token_id = TokenId::one();
    let decrease = Percent::from_percent(3);

    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as PatronageTrait<AccountId, IssuanceParams>>::reduce_patronage_rate_by(
                token_id, decrease,
            ),
            Error::<Test>::ReductionExceedingPatronageRate,
        );
    })
}

#[test]
fn decreasing_patronage_rate_fails_invalid_token() {
    let patronage_rate = Percent::from_percent(2);
    let params = TokenIssuanceParametersOf::<Test> {
        existential_deposit: DEFAULT_EXISTENTIAL_DEPOSIT,
        patronage_rate,
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new()
        .add_token_with_params(params)
        .build();

    let decrease = Percent::from_percent(3);

    build_test_externalities(config).execute_with(|| {
        let token_id = Token::next_token_id();
        assert_noop!(
            <Token as PatronageTrait<AccountId, IssuanceParams>>::reduce_patronage_rate_by(
                token_id, decrease,
            ),
            Error::<Test>::TokenDoesNotExist,
        );
    })
}

#[test]
fn claim_patronage_credit_ok() {
    let patronage_rate = Percent::from_percent(50);
    let params = TokenIssuanceParametersOf::<Test> {
        existential_deposit: DEFAULT_EXISTENTIAL_DEPOSIT,
        patronage_rate,
        ..Default::default()
    };

    let owner_account = AccountId::from(DEFAULT_ACCOUNT_ID);

    let config = GenesisConfigBuilder::new()
        .add_token_with_params(params)
        .build();

    let token_id = TokenId::one();

    build_test_externalities(config).execute_with(|| {
        assert_ok!(
            <Token as MultiCurrencyBase<AccountId, IssuanceParams>>::deposit_creating(
                token_id,
                owner_account,
                DEFAULT_FREE_BALANCE
            )
        );
        let balance_pre =
            Token::account_info_by_token_and_account(token_id, owner_account).free_balance;
        let credit = patronage_rate.mul_floor(balance_pre);

        assert_ok!(
            <Token as PatronageTrait<AccountId, IssuanceParams>>::claim_patronage_credit(
                token_id,
                owner_account,
            )
        );

        let balance_post =
            Token::account_info_by_token_and_account(token_id, owner_account).free_balance;

        assert_eq!(balance_post, balance_pre.saturating_add(credit));
        assert_eq!(
            Token::token_info_by_id(token_id)
                .patronage_info
                .outstanding_credit,
            0
        );
        last_event_eq!(RawEvent::PatronageCreditClaimed(
            token_id,
            credit,
            owner_account
        ));
    })
}

#[test]
fn claim_patronage_credit_fails_with_invalid_token_id() {
    let patronage_rate = Percent::from_percent(50);
    let params = TokenIssuanceParametersOf::<Test> {
        existential_deposit: DEFAULT_EXISTENTIAL_DEPOSIT,
        patronage_rate,
        ..Default::default()
    };

    let owner_account = AccountId::from(DEFAULT_ACCOUNT_ID);

    let config = GenesisConfigBuilder::new()
        .add_token_with_params(params)
        .build();

    build_test_externalities(config).execute_with(|| {
        let token_id = Token::next_token_id();
        assert_noop!(
            <Token as PatronageTrait<AccountId, IssuanceParams>>::claim_patronage_credit(
                token_id,
                owner_account,
            ),
            Error::<Test>::TokenDoesNotExist,
        );
    })
}

#[test]
fn claim_patronage_credit_fails_with_invalid_account() {
    let patronage_rate = Percent::from_percent(50);
    let params = TokenIssuanceParametersOf::<Test> {
        existential_deposit: DEFAULT_EXISTENTIAL_DEPOSIT,
        patronage_rate,
        ..Default::default()
    };

    let owner_account = AccountId::from(DEFAULT_ACCOUNT_ID);

    let config = GenesisConfigBuilder::new()
        .add_token_with_params(params)
        .build();

    let token_id = TokenId::one();
    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as PatronageTrait<AccountId, IssuanceParams>>::claim_patronage_credit(
                token_id,
                owner_account,
            ),
            Error::<Test>::AccountInformationDoesNotExist,
        );
    })
}
