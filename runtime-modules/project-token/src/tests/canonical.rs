#![cfg(test)]

use frame_support::{
    assert_noop, assert_ok, IterableStorageDoubleMap, StorageDoubleMap, StorageMap,
};
use sp_arithmetic::traits::{One, Zero};

use crate::tests::mock::*;
use crate::traits::MultiCurrencyBase;
use crate::types::TokenIssuanceParametersOf;
use crate::Error;

// base_issue test
#[test]
fn issue_base_token_ok_with_default_issuance_parameters() {
    let config = GenesisConfigBuilder::new_empty().build();
    let issuance_params = TokenIssuanceParametersOf::<Test>::default();

    build_test_externalities(config).execute_with(|| {
        let token_id = Token::next_token_id();
        assert_ok!(<Token as MultiCurrencyBase<AccountId>>::issue_token(
            issuance_params.clone(),
        ));
        assert_eq!(
            issuance_params.try_build::<Test>(),
            Token::ensure_token_exists(token_id)
        );
        assert_eq!(token_id + 1, Token::next_token_id());
    })
}

#[test]
fn issue_base_token_fails_with_existential_deposit_exceeding_issuance() {
    let config = GenesisConfigBuilder::new_empty().build();
    let initial_issuance = Balance::from(10u32);
    let issuance_params = TokenIssuanceParametersOf::<Test> {
        initial_issuance,
        existential_deposit: initial_issuance.saturating_add(One::one()),
        ..Default::default()
    };

    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as MultiCurrencyBase<AccountId>>::issue_token(issuance_params.clone()),
            Error::<Test>::ExistentialDepositExceedsInitialIssuance,
        );
    })
}

// base_deissue tests
#[test]
fn base_deissue_token_fails_with_non_existing_token_id() {
    let config = GenesisConfigBuilder::new_empty().build();
    build_test_externalities(config).execute_with(|| {
        let token_id = Token::next_token_id();
        assert_noop!(
            <Token as MultiCurrencyBase<AccountId>>::deissue_token(token_id),
            Error::<Test>::TokenDoesNotExist,
        );
    })
}

#[test]
fn base_deissue_token_ok() {
    let config = GenesisConfigBuilder::default().build();
    build_test_externalities(config).execute_with(|| {
        assert_ok!(<Token as MultiCurrencyBase<AccountId>>::deissue_token(
            One::one(),
        ));
        assert_noop!(
            Token::ensure_token_exists(One::one()),
            Error::<Test>::TokenDoesNotExist
        );
    })
}

// balanceof tests
#[test]
fn balanceof_fails_with_non_existing_token_id() {
    let config = GenesisConfigBuilder::new_empty().build();
    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as MultiCurrencyBase<AccountId>>::balance(One::one(), One::one()),
            Error::<Test>::AccountInformationDoesNotExist,
        );
    })
}

// base_burn tests
#[test]
fn base_burn_fails_with_non_existing_token_id() {
    let config = GenesisConfigBuilder::new_empty().build();
    let token_id = TokenId::from(2u64);
    let amount = total_issuance_for_token(token_id).saturating_sub(1);
    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as MultiCurrencyBase<AccountId>>::burn(token_id, amount),
            Error::<Test>::TokenDoesNotExist,
        );
    })
}

#[test]
fn base_burn_ok_with_zero_amount() {
    let config = GenesisConfigBuilder::default().build();
    let token_id = TokenId::from(2u64);
    let amount = Zero::zero();
    build_test_externalities(config).execute_with(|| {
        let token_data_old = Token::ensure_token_exists(token_id);
        assert_ok!(<Token as MultiCurrencyBase<AccountId>>::burn(
            token_id, amount
        ));
        assert_eq!(token_data_old, Token::ensure_token_exists(token_id));
    })
}

#[test]
fn base_burn_ok_with_non_zero_amount() {
    let config = GenesisConfigBuilder::default().build();
    let token_id = TokenId::from(2u64);
    let remaining = TokenId::one();
    let amount = total_issuance_for_token(token_id).saturating_sub(remaining);
    build_test_externalities(config).execute_with(|| {
        assert_ok!(<Token as MultiCurrencyBase<AccountId>>::burn(
            token_id, amount
        ));
        let new_issuance = Token::ensure_token_exists(token_id)
            .map(|info| info.current_issuance())
            .unwrap_or_default();
        assert_eq!(new_issuance, remaining);
    })
}

#[test]
fn base_burn_ok_with_deissuing() {
    let config = GenesisConfigBuilder::default().build();
    let token_id = TokenId::from(2u64);
    let amount = total_issuance_for_token(token_id);
    build_test_externalities(config).execute_with(|| {
        assert_ok!(<Token as MultiCurrencyBase<AccountId>>::burn(
            token_id, amount
        ));
        assert!(!<crate::TokenInfoById<Test>>::contains_key(token_id));
        assert!(
            <crate::AccountInfoByTokenAndAccount<Test>>::iter_prefix(token_id)
                .next()
                .is_none()
        );
    })
}

// slash tests
#[test]
fn slash_fails_with_non_existing_token_id() {
    let config = GenesisConfigBuilder::new_empty().build();
    let token_id = TokenId::from(2u64);
    let account_id = AccountId::one();
    let amount = Balance::one();
    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as MultiCurrencyBase<AccountId>>::slash(token_id, account_id, amount),
            Error::<Test>::TokenDoesNotExist,
        );
    })
}

#[test]
fn slash_fails_with_non_existing_account() {
    let config = GenesisConfigBuilder::new_empty()
        .add_default_token_info()
        .build();
    let token_id = TokenId::from(2u64);
    let account_id = AccountId::one();
    let amount = Balance::one();
    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as MultiCurrencyBase<AccountId>>::slash(token_id, account_id, amount),
            Error::<Test>::AccountInformationDoesNotExist,
        );
    })
}

#[test]
fn slash_fails_with_insufficient_free_balance() {
    let config = GenesisConfigBuilder::default().build();
    let token_id = TokenId::one();
    let account_id = AccountId::one();
    let amount = Balance::one();
    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as MultiCurrencyBase<AccountId>>::slash(token_id, account_id, amount),
            Error::<Test>::InsufficientFreeBalanceForSlashing,
        );
    })
}

#[test]
fn slash_ok_without_account_removal() {
    let config = GenesisConfigBuilder::default().build();
    let token_id = AccountId::from(2u32);
    let account_id = AccountId::from(2u32);
    let amount = Balance::one();
    build_test_externalities(config).execute_with(|| {
        let free_balance_pre =
            Token::account_info_by_token_and_account(token_id, account_id).free_balance();
        assert_ok!(<Token as MultiCurrencyBase<AccountId>>::slash(
            token_id, account_id, amount
        ));
        let free_balance_post =
            Token::account_info_by_token_and_account(token_id, account_id).free_balance();

        assert_eq!(free_balance_pre, free_balance_post.saturating_add(amount));
    })
}

#[test]
fn slash_ok_with_account_removal() {
    let config = GenesisConfigBuilder::default().build();
    let token_id = AccountId::from(2u32);
    let account_id = AccountId::from(2u32);
    let remaining_free_balance =
        existential_deposit_for_token(token_id).saturating_sub(TokenId::one());
    let amount = config_for_token_and_account(token_id)
        .free_balance()
        .saturating_sub(remaining_free_balance);
    build_test_externalities(config).execute_with(|| {
        assert_ok!(<Token as MultiCurrencyBase<AccountId>>::slash(
            token_id, account_id, amount
        ));
        assert!(!<crate::AccountInfoByTokenAndAccount<Test>>::contains_key(
            token_id, account_id
        ));
    })
}
