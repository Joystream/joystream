#![cfg(test)]
use frame_support::{assert_noop, assert_ok, StorageDoubleMap};
use sp_arithmetic::traits::{One, Zero};
use sp_runtime::traits::Hash;

use crate::tests::mock::*;
use crate::tests::test_utils::TokenDataBuilder;
use crate::traits::PalletToken;
use crate::types::MerkleSide;
use crate::{account, balance, last_event_eq, merkle_proof, merkle_root, token, Error, RawEvent};

// some helpers
#[macro_export]
macro_rules! simple {
    ($acc:expr) => {
        Simple::new($acc)
    };
}

#[macro_export]
macro_rules! simple_out {
    ($acc:expr, $bal:expr) => {
        (simple!($acc), $bal)
    };
}

#[macro_export]
macro_rules! verifiable {
    ($acc:expr,$proof:expr) => {
        Verifiable::new($proof, $acc)
    };
}

#[macro_export]
macro_rules! verifiable_out {
    ($acc:expr,$proof:expr,$bal:expr) => {
        (verifiable!($acc, $proof), $bal)
    };
}

// permissionless transfer tests
#[test]
fn permissionless_transfer_fails_with_non_existing_token() {
    let token_id = token!(1);
    let config = GenesisConfigBuilder::new_empty().build();
    let src = account!(1);
    let dst = account!(2);
    let amount = balance!(1);

    build_test_externalities(config).execute_with(|| {
        let result = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            simple!(dst),
            amount,
        );

        assert_noop!(result, Error::<Test>::TokenDoesNotExist,);
    })
}

#[test]
fn permissionless_transfer_fails_with_non_existing_source() {
    let token_id = token!(1);
    let (src, amount) = (account!(1), balance!(100));
    let dst = account!(2);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(dst, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            simple!(dst),
            amount,
        );

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn permissionless_transfer_fails_with_non_existing_destination() {
    let token_id = token!(1);
    let amount = balance!(100);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let dst = account!(2);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            simple!(dst),
            amount,
        );

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn permissionless_transfer_fails_with_source_not_having_sufficient_free_balance() {
    let token_id = token!(1);
    let amount = Balance::from(100u32);
    let src_balance = amount.saturating_sub(Balance::one());
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let dst = src.saturating_add(account!(1));

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, src_balance, 0)
        .with_account(dst, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            simple!(dst),
            amount,
        );

        assert_noop!(result, Error::<Test>::InsufficientFreeBalanceForTransfer);
    })
}

#[test]
fn permissionless_transfer_ok() {
    let token_id = token!(1);
    let amount = Balance::from(100u32);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let dst = src.saturating_add(account!(1));

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .with_account(dst, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            simple!(dst),
            amount,
        );

        assert_ok!(result);
    })
}

#[test]
fn permissionless_transfer_ok_with_verifiable_destination() {
    let token_id = token!(1);
    let amount = balance!(100);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let dst = account!(2);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .with_account(dst, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            Verifiable::new(vec![(Hashing::hash_of(b"test"), MerkleSide::Left)], dst),
            amount,
        );

        assert_ok!(result);
    })
}

#[test]
fn permissionless_transfer_ok_with_event_deposit() {
    let token_id = token!(1);
    let amount = Balance::from(100u32);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let dst = src.saturating_add(account!(1));

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .with_account(dst, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            simple!(dst),
            amount,
        );

        last_event_eq!(RawEvent::TokenAmountTransferred(token_id, src, dst, amount));
    })
}

#[test]
fn permissionless_transfer_ok_with_ex_deposit_and_without_src_removal() {
    let token_id = token!(1);
    let existential_deposit = balance!(10);
    let amount = balance!(100);
    let (src, src_balance) = (account!(1), existential_deposit + amount);
    let dst = account!(2);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .with_existential_deposit(existential_deposit)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, src_balance, 0)
        .with_account(dst, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            simple!(dst),
            amount,
        );

        assert_eq!(
            src_balance.saturating_sub(amount),
            Token::account_info_by_token_and_account(token_id, src).free_balance
        );
    })
}

#[test]
fn permissionless_transfer_ok_with_ex_deposit_and_with_src_removal() {
    let token_id = token!(1);
    let existential_deposit = balance!(10u32);
    let (src, amount) = (account!(1), balance!(100));
    let dst = account!(2);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .with_existential_deposit(existential_deposit)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .with_account(dst, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            simple!(dst),
            amount,
        );

        assert!(!<crate::AccountInfoByTokenAndAccount<Test>>::contains_key(
            token_id, src
        ));
    })
}

#[test]
fn permissionless_transfer_ok_with_destination_receiving_funds() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (src, amount) = (account!(1), balance!(100));
    let dst = src.saturating_add(account!(1));

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .with_account(dst, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            simple!(dst),
            amount,
        );

        assert_eq!(
            Token::account_info_by_token_and_account(token_id, dst).free_balance,
            amount
        );
    })
}

#[test]
fn permissionless_transfer_ok_with_ex_deposit_and_dust_removal_from_issuance() {
    let token_id = token!(1);
    let dust = balance!(5);
    let amount = balance!(100);
    let (src, src_balance) = (account!(1), dust + amount);
    let dst = account!(2);
    let existential_deposit = balance!(10);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .with_existential_deposit(existential_deposit)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, src_balance, 0)
        .with_account(dst, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            simple!(dst),
            amount,
        );

        assert_eq!(
            src_balance.saturating_sub(dust),
            Token::token_info_by_id(token_id).current_total_issuance,
        );
    })
}

// multi output
#[test]
fn multiout_transfer_fails_with_non_existing_token() {
    let token_id = token!(1);
    let src = account!(1);
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let outputs = vec![simple_out!(dst1, amount1), simple_out!(dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::multi_output_transfer(
                token_id, src, &outputs,
            );

        assert_noop!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn multiout_transfer_fails_with_non_existing_source() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let outputs = vec![simple_out!(dst1, amount1), simple_out!(dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::multi_output_transfer(
                token_id, src, &outputs,
            );

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn multiout_transfer_fails_with_non_existing_destination() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let outputs = vec![simple_out!(dst1, amount1), simple_out!(dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(dst1, 0, 0)
        .with_account(src, amount1 + amount2, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::multi_output_transfer(
                token_id, src, &outputs,
            );

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn multiout_transfer_ok() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let outputs = vec![simple_out!(dst1, amount1), simple_out!(dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .with_account(src, amount1 + amount2, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::multi_output_transfer(
                token_id, src, &outputs,
            );

        assert_ok!(result);
    })
}

#[test]
fn multiout_transfer_ok_with_event_deposit() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let outputs = vec![simple_out!(dst1, amount1), simple_out!(dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .with_account(src, amount1 + amount2, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::multi_output_transfer(
            token_id, src, &outputs,
        );

        last_event_eq!(RawEvent::TokenAmountMultiTransferred(
            token_id,
            src,
            vec![(dst1, amount1), (dst2, amount2)],
        ));
    })
}

#[test]
fn multiout_transfer_fails_with_source_having_insufficient_balance() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let (src, src_balance) = (account!(1), amount1 + amount2 - 1);
    let outputs = vec![simple_out!(dst1, amount1), simple_out!(dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .with_account(src, src_balance, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::multi_output_transfer(
                token_id, src, &outputs,
            );

        assert_noop!(result, Error::<Test>::InsufficientFreeBalanceForTransfer);
    })
}

#[test]
fn multiout_transfer_fails_with_same_source_and_destination() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let outputs = vec![simple_out!(dst1, amount1), simple_out!(dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(dst1, amount1 + amount2, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::multi_output_transfer(
                token_id, dst1, &outputs,
            );

        assert_noop!(result, Error::<Test>::SameSourceAndDestinationLocations);
    })
}

#[test]
fn permissioned_transfer_ok() {
    let token_id = token!(1);
    let amount = balance!(100);
    let src = account!(1);
    let (dst1, dst2) = (account!(2), account!(3));
    let commit = merkle_root![dst1, dst2];
    let dst1_proof = merkle_proof!(0, [dst1, dst2]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            verifiable!(dst1, dst1_proof),
            amount,
        );

        assert_ok!(result);
    })
}

#[test]
fn permissioned_transfer_ok_with_event_deposit() {
    let token_id = token!(1);
    let amount = balance!(100);
    let src = account!(1);
    let (dst1, dst2) = (account!(2), account!(3));
    let commit = merkle_root![dst1, dst2];
    let dst1_proof = merkle_proof!(0, [dst1, dst2]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            verifiable!(dst1, dst1_proof),
            amount,
        );

        last_event_eq!(RawEvent::TokenAmountTransferred(
            token_id, src, dst1, amount
        ));
    })
}

#[test]
fn permissioned_transfer_fails_with_invalid_src() {
    let token_id = token!(1);
    let amount = balance!(100);
    let src = account!(1);
    let (dst1, dst2) = (account!(2), account!(3));
    let commit = merkle_root![dst1, dst2];
    let dst1_proof = merkle_proof!(0, [dst1, dst2]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            verifiable!(dst1, dst1_proof),
            amount,
        );

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn permissioned_transfer_fails_with_invalid_destination() {
    let token_id = token!(1);
    let amount = balance!(100);
    let src = account!(1);
    let (dst1, dst2) = (account!(2), account!(3));
    let commit = merkle_root![dst1, dst2];
    let dst1_proof = merkle_proof!(0, [dst1, dst2]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            verifiable!(dst1, dst1_proof),
            amount,
        );

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn permissioned_transfer_fails_with_insufficient_balance() {
    let token_id = token!(1);
    let amount = balance!(100);
    let (src, src_balance) = (account!(1), amount - 1);
    let (dst1, dst2) = (account!(2), account!(3));
    let commit = merkle_root![dst1, dst2];
    let dst1_proof = merkle_proof!(0, [dst1, dst2]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, src_balance, 0)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            verifiable!(dst1, dst1_proof),
            amount,
        );

        assert_noop!(result, Error::<Test>::InsufficientFreeBalanceForTransfer);
    })
}

#[test]
fn permissioned_transfer_ok_without_src_removal() {
    let token_id = token!(1);
    let amount = balance!(100);
    let existential_deposit = balance!(10);
    let (src, src_balance) = (account!(1), amount + existential_deposit);
    let (dst1, dst2) = (account!(2), account!(3));
    let commit = merkle_root![dst1, dst2];
    let dst1_proof = merkle_proof!(0, [dst1, dst2]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .with_existential_deposit(existential_deposit)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, src_balance, 0)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            verifiable!(dst1, dst1_proof),
            amount,
        );

        assert_eq!(
            src_balance.saturating_sub(amount),
            Token::account_info_by_token_and_account(token_id, src).free_balance
        );
    })
}

#[test]
fn permissioned_transfer_ok_with_ex_deposit_and_with_src_removal() {
    let token_id = token!(1);
    let amount = balance!(100);
    let existential_deposit = balance!(20);
    let dust = balance!(10);
    let (src, src_balance) = (account!(1), amount + dust);
    let (dst1, dst2) = (account!(2), account!(3));
    let commit = merkle_root![dst1, dst2];
    let dst1_proof = merkle_proof!(0, [dst1, dst2]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .with_existential_deposit(existential_deposit)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, src_balance, 0)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            verifiable!(dst1, dst1_proof),
            amount,
        );

        assert!(!<crate::AccountInfoByTokenAndAccount<Test>>::contains_key(
            token_id, src
        ));
    })
}

#[test]
fn permissioned_transfer_ok_with_ex_deposit_and_decrease_in_issuance() {
    let token_id = token!(1);
    let amount = balance!(100);
    let existential_deposit = balance!(20);
    let dust = balance!(10);
    let (src, src_balance) = (account!(1), amount + dust);
    let (dst1, dst2) = (account!(2), account!(3));
    let commit = merkle_root![dst1, dst2];
    let dst1_proof = merkle_proof!(0, [dst1, dst2]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .with_existential_deposit(existential_deposit)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, src_balance, 0)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            verifiable!(dst1, dst1_proof),
            amount,
        );

        assert_eq!(
            Token::token_info_by_id(token_id).current_total_issuance,
            src_balance - dust
        );
    })
}

#[test]
fn permissioned_transfer_fails_with_invalid_merkle_proof() {
    let token_id = token!(1);
    let amount = balance!(100);
    let existential_deposit = balance!(20);
    let dust = balance!(10);
    let (src, src_balance) = (account!(1), amount + dust);
    let (dst1, dst2) = (account!(2), account!(3));
    let commit = merkle_root![dst1, dst2];
    let dst1_proof = merkle_proof!(1, [dst1, dst1]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .with_existential_deposit(existential_deposit)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, src_balance, 0)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            verifiable!(dst1, dst1_proof),
            amount,
        );

        assert_noop!(result, Error::<Test>::LocationIncompatibleWithCurrentPolicy,);
    })
}

#[test]
fn permissioned_transfer_fails_with_invalid_location_type() {
    let token_id = token!(1);
    let amount = balance!(100);
    let existential_deposit = balance!(20);
    let dust = balance!(10);
    let (src, src_balance) = (account!(1), amount + dust);
    let (dst1, dst2) = (account!(2), account!(3));
    let commit = merkle_root![dst1, dst2];

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .with_existential_deposit(existential_deposit)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, src_balance, 0)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::transfer(
            token_id,
            src,
            simple!(dst1),
            amount,
        );

        assert_noop!(result, Error::<Test>::LocationIncompatibleWithCurrentPolicy,);
    })
}

// #[test]
// fn permissioned_transfer_fails_with_failed_merkle_proof() {
//     let dest_accounts = vec![
//         AccountId::from(DEFAULT_ACCOUNT_ID + 1),
//         AccountId::from(DEFAULT_ACCOUNT_ID + 2),
//         AccountId::from(DEFAULT_ACCOUNT_ID + 3),
//     ];

//     // second element in the dest accounts is the one of interest
//     let index = 1usize;
//     let mut amounts = vec![Balance::one(), Balance::one(), Balance::one()];
//     amounts[index] = Balance::from(DEFAULT_FREE_BALANCE - DEFAULT_EXISTENTIAL_DEPOSIT + 1);

//     // merkle proof for index-th element
//     let merkle_proof = build_merkle_path_helper(&dest_accounts, index);
//     let commit = Hashing::hash_of(&b"WRONG COMMIT");

//     let params = TokenIssuanceParametersOf::<Test> {
//         existential_deposit: Balance::from(DEFAULT_EXISTENTIAL_DEPOSIT),
//         transfer_policy: Policy::Permissioned(commit),
//         ..Default::default()
//     };
//     let config = GenesisConfigBuilder::new()
//         .add_token_with_params(params)
//         .add_account_info() // src
//         .add_account_info() // account 1
//         .add_account_info() // account 2
//         .add_account_info() // account 3
//         .build();

//     let src = AccountId::from(DEFAULT_ACCOUNT_ID);
//     let dst = Verifiable::new(merkle_proof, dest_accounts[index]);
//     let token_id = token!(1u32);

//     build_test_externalities(config).execute_with(|| {
//         assert_noop!(
//             <Token as ControlledTransfer<AccountId, Policy, IssuanceParams>>::transfer(
//                 token_id,
//                 src,
//                 dst,
//                 amounts[index]
//             ),
//             Error::<Test>::LocationIncompatibleWithCurrentPolicy
//         );
//     })
// }

// #[test]
// fn permissioned_transfer_fails_with_wrong_dest_location_type() {
//     let dest_accounts = vec![
//         AccountId::from(DEFAULT_ACCOUNT_ID + 1),
//         AccountId::from(DEFAULT_ACCOUNT_ID + 2),
//         AccountId::from(DEFAULT_ACCOUNT_ID + 3),
//     ];

//     // second element in the dest accounts is the one of interest
//     let index = 1usize;
//     let amounts = vec![Balance::one(), Balance::one(), Balance::one()];

//     // merkle proof for index-th element
//     let commit = generate_merkle_root_helper(&dest_accounts).pop().unwrap();

//     let params = TokenIssuanceParametersOf::<Test> {
//         existential_deposit: Balance::from(DEFAULT_EXISTENTIAL_DEPOSIT),
//         transfer_policy: Policy::Permissioned(commit),
//         ..Default::default()
//     };
//     let config = GenesisConfigBuilder::new()
//         .add_token_with_params(params)
//         .add_account_info() // src
//         .add_account_info() // account 1
//         .add_account_info() // account 2
//         .add_account_info() // account 3
//         .build();

//     let src = AccountId::from(DEFAULT_ACCOUNT_ID);
//     // Simple (Permissionless-compliant type) location
//     let dst = Simple::new(dest_accounts[index]);
//     let token_id = token!(1u32);

//     build_test_externalities(config).execute_with(|| {
//         assert_noop!(
//             <Token as ControlledTransfer<AccountId, Policy, IssuanceParams>>::transfer(
//                 token_id,
//                 src,
//                 dst,
//                 amounts[index]
//             ),
//             Error::<Test>::LocationIncompatibleWithCurrentPolicy
//         );
//     })
// }

// #[test]
// fn permissioned_multiout_transfer_ok_without_src_removal() {
//     let dest_accounts = vec![
//         AccountId::from(DEFAULT_ACCOUNT_ID + 1),
//         AccountId::from(DEFAULT_ACCOUNT_ID + 2),
//         AccountId::from(DEFAULT_ACCOUNT_ID + 3),
//     ];
//     let outputs_no = dest_accounts.len();
//     let amounts = vec![Balance::one(), Balance::one(), Balance::one()];

//     // merkle proof for 2nd element
//     let merkle_proofs = (0..outputs_no).map(|i| build_merkle_path_helper(&dest_accounts, i));
//     let commit = generate_merkle_root_helper(&dest_accounts).pop().unwrap();

//     let params = TokenIssuanceParametersOf::<Test> {
//         existential_deposit: Balance::from(DEFAULT_EXISTENTIAL_DEPOSIT),
//         transfer_policy: Policy::Permissioned(commit),
//         ..Default::default()
//     };
//     let config = GenesisConfigBuilder::new()
//         .add_token_with_params(params)
//         .add_account_info() // src
//         .add_account_info() // account 1
//         .add_account_info() // account 2
//         .add_account_info() // account 3
//         .build();

//     let src = AccountId::from(DEFAULT_ACCOUNT_ID);
//     let dests = merkle_proofs
//         .zip(dest_accounts.iter())
//         .map(|(proof, account)| Verifiable::new(proof, *account));
//     let outputs = dests.zip(amounts.iter().cloned()).collect::<Vec<_>>();
//     let token_id = token!(1u32);

//     build_test_externalities(config).execute_with(|| {
//         let src_pre = Token::account_info_by_token_and_account(token_id, src).free_balance;
//         let issuance_pre = Token::token_info_by_id(token_id).current_total_issuance;
//         let dst_pre = (0..outputs_no)
//             .map(|index| {
//                 Token::account_info_by_token_and_account(token_id, dest_accounts[index])
//                     .free_balance
//             })
//             .collect::<Vec<_>>();

//         assert_ok!(<Token as ControlledTransfer<
//             AccountId,
//             Policy,
//             IssuanceParams,
//         >>::multi_output_transfer(
//             token_id, src, outputs.as_slice()
//         ));

//         let issuance_post = Token::token_info_by_id(token_id).current_total_issuance;
//         let src_post = Token::account_info_by_token_and_account(token_id, src).free_balance;
//         let dst_post = (0..outputs_no).map(|index| {
//             Token::account_info_by_token_and_account(token_id, dest_accounts[index]).free_balance
//         });

//         assert_eq!(issuance_pre, issuance_post);
//         assert_eq!(src_pre, src_post.saturating_add(amounts.iter().sum()));
//         assert!(dst_pre
//             .iter()
//             .zip(dst_post)
//             .zip(amounts.iter())
//             .all(|((pre, post), amount)| pre.saturating_add(*amount) == post));
//     })
// }

// #[test]
// fn permissioned_multiout_transfer_ok_with_src_removal() {
//     let dest_accounts = vec![
//         AccountId::from(DEFAULT_ACCOUNT_ID + 1),
//         AccountId::from(DEFAULT_ACCOUNT_ID + 2),
//         AccountId::from(DEFAULT_ACCOUNT_ID + 3),
//     ];
//     let outputs_no = dest_accounts.len();
//     let amounts = vec![
//         Balance::one(),
//         Balance::one(),
//         Balance::from(DEFAULT_FREE_BALANCE - DEFAULT_EXISTENTIAL_DEPOSIT - 1),
//     ];

//     // merkle proof for 2nd element
//     let merkle_proofs = (0..outputs_no).map(|i| build_merkle_path_helper(&dest_accounts, i));
//     let commit = generate_merkle_root_helper(&dest_accounts).pop().unwrap();

//     let params = TokenIssuanceParametersOf::<Test> {
//         existential_deposit: Balance::from(DEFAULT_EXISTENTIAL_DEPOSIT),
//         transfer_policy: Policy::Permissioned(commit),
//         ..Default::default()
//     };
//     let config = GenesisConfigBuilder::new()
//         .add_token_with_params(params)
//         .add_account_info() // src
//         .add_account_info() // account 1
//         .add_account_info() // account 2
//         .add_account_info() // account 3
//         .build();

//     let src = AccountId::from(DEFAULT_ACCOUNT_ID);
//     let dests = merkle_proofs
//         .zip(dest_accounts.iter())
//         .map(|(proof, account)| Verifiable::new(proof, *account));
//     let outputs = dests.zip(amounts.iter().cloned()).collect::<Vec<_>>();
//     let token_id = token!(1u32);

//     build_test_externalities(config).execute_with(|| {
//         let src_pre = Token::account_info_by_token_and_account(token_id, src).free_balance;
//         let issuance_pre = Token::token_info_by_id(token_id).current_total_issuance;
//         let dust = src_pre.saturating_sub(amounts.iter().sum());
//         let dst_pre = (0..outputs_no)
//             .map(|index| {
//                 Token::account_info_by_token_and_account(token_id, dest_accounts[index])
//                     .free_balance
//             })
//             .collect::<Vec<_>>();

//         assert_ok!(<Token as ControlledTransfer<
//             AccountId,
//             Policy,
//             IssuanceParams,
//         >>::multi_output_transfer(
//             token_id, src, outputs.as_slice()
//         ));

//         let issuance_post = Token::token_info_by_id(token_id).current_total_issuance;
//         let dst_post = (0..outputs_no).map(|index| {
//             Token::account_info_by_token_and_account(token_id, dest_accounts[index]).free_balance
//         });

//         assert_eq!(issuance_pre, issuance_post.saturating_add(dust));
//         assert!(!<crate::AccountInfoByTokenAndAccount<Test>>::contains_key(
//             token_id, src
//         ));
//         assert!(dst_pre
//             .iter()
//             .zip(dst_post)
//             .zip(amounts.iter())
//             .all(|((pre, post), amount)| pre.saturating_add(*amount) == post));
//     })
// }

// #[test]
// fn permissioned_multiout_transfer_fails_with_wrong_commit() {
//     let dest_accounts = vec![
//         AccountId::from(DEFAULT_ACCOUNT_ID + 1),
//         AccountId::from(DEFAULT_ACCOUNT_ID + 2),
//         AccountId::from(DEFAULT_ACCOUNT_ID + 3),
//     ];
//     let outputs_no = dest_accounts.len();
//     let amounts = vec![
//         Balance::one(),
//         Balance::one(),
//         Balance::from(DEFAULT_FREE_BALANCE - DEFAULT_EXISTENTIAL_DEPOSIT - 1),
//     ];

//     // merkle proof for 2nd element
//     let merkle_proofs = (0..outputs_no).map(|i| build_merkle_path_helper(&dest_accounts, i));
//     let commit = Hashing::hash_of(&b"WRONG COMMIT");

//     let params = TokenIssuanceParametersOf::<Test> {
//         existential_deposit: Balance::from(DEFAULT_EXISTENTIAL_DEPOSIT),
//         transfer_policy: Policy::Permissioned(commit),
//         ..Default::default()
//     };
//     let config = GenesisConfigBuilder::new()
//         .add_token_with_params(params)
//         .add_account_info() // src
//         .add_account_info() // account 1
//         .add_account_info() // account 2
//         .add_account_info() // account 3
//         .build();

//     let src = AccountId::from(DEFAULT_ACCOUNT_ID);
//     let dests = merkle_proofs
//         .zip(dest_accounts.iter())
//         .map(|(proof, account)| Verifiable::new(proof, *account));
//     let outputs = dests.zip(amounts.iter().cloned()).collect::<Vec<_>>();
//     let token_id = token!(1u32);

//     build_test_externalities(config).execute_with(|| {
//         assert_noop!(
//             <Token as ControlledTransfer<AccountId, Policy, IssuanceParams>>::multi_output_transfer(
//                 token_id,
//                 src,
//                 outputs.as_slice()
//             ),
//             Error::<Test>::LocationIncompatibleWithCurrentPolicy,
//         );
//     })
// }

// #[test]
// fn permissioned_multiout_transfer_fails_with_invalid_destination_types() {
//     let dest_accounts = vec![
//         AccountId::from(DEFAULT_ACCOUNT_ID + 1),
//         AccountId::from(DEFAULT_ACCOUNT_ID + 2),
//         AccountId::from(DEFAULT_ACCOUNT_ID + 3),
//     ];
//     let amounts = vec![
//         Balance::one(),
//         Balance::one(),
//         Balance::from(DEFAULT_FREE_BALANCE - DEFAULT_EXISTENTIAL_DEPOSIT - 1),
//     ];

//     let commit = generate_merkle_root_helper(&dest_accounts).pop().unwrap();

//     let params = TokenIssuanceParametersOf::<Test> {
//         existential_deposit: Balance::from(DEFAULT_EXISTENTIAL_DEPOSIT),
//         transfer_policy: Policy::Permissioned(commit),
//         ..Default::default()
//     };
//     let config = GenesisConfigBuilder::new()
//         .add_token_with_params(params)
//         .add_account_info() // src
//         .add_account_info() // account 1
//         .add_account_info() // account 2
//         .add_account_info() // account 3
//         .build();

//     let src = AccountId::from(DEFAULT_ACCOUNT_ID);

//     // current design imposes same destination type for all accounts
//     let dests = dest_accounts.iter().map(|account| Simple::new(*account));

//     let outputs = dests.zip(amounts.iter().cloned()).collect::<Vec<_>>();

//     let token_id = token!(1u32);

//     build_test_externalities(config).execute_with(|| {
//         assert_noop!(
//             <Token as ControlledTransfer<AccountId, Policy, IssuanceParams>>::multi_output_transfer(
//                 token_id,
//                 src,
//                 outputs.as_slice()
//             ),
//             Error::<Test>::LocationIncompatibleWithCurrentPolicy,
//         );
//     })
// }
