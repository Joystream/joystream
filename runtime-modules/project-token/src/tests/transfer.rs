#![cfg(test)]
use frame_support::{assert_noop, assert_ok, StorageDoubleMap};
use sp_runtime::traits::AccountIdConversion;

use crate::tests::mock::*;
use crate::tests::test_utils::TokenDataBuilder;
use crate::types::TransfersOf;
use crate::{
    account, balance, last_event_eq, merkle_root, origin, token, treasury, Error, RawEvent,
};

// some helpers
macro_rules! outputs {
    [$(($a:expr, $b: expr)),*] => {
        TransfersOf::<Test>::new(vec![$(($a, $b),)*])
    };
}

// permissionless transfer tests
#[test]
fn permissionless_transfer_fails_with_non_existing_token() {
    let token_id = token!(1);
    let config = GenesisConfigBuilder::new_empty().build();
    let origin = origin!(account!(1));
    let out = outputs![(account!(2), balance!(1))];

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin, token_id, out);

        assert_noop!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn permissionless_transfer_fails_with_non_existing_source() {
    let token_id = token!(1);
    let origin = origin!(account!(1));
    let (dst, amount) = (account!(2), balance!(100));

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(dst, amount, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin, token_id, outputs![(dst, amount)]);

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn permissionless_transfer_fails_with_src_having_insufficient_fund_for_bloat_bond() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let (dst, amount) = (account!(2), balance!(100));

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id, outputs![(dst, amount)]);

        assert_noop!(result, Error::<Test>::InsufficientBalanceForBloatBond,);
    })
}

#[test]
fn permissionless_transfer_ok_with_non_existing_destination() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let (dst, amount) = (account!(2), balance!(100));

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id, outputs![(dst, amount)]);

        assert_ok!(result);
    })
}

#[test]
fn permissionless_transfer_ok_with_new_destination_created() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let (dst, amount) = (account!(2), balance!(100));

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::transfer(origin!(src), token_id, outputs![(dst, amount)]);

        assert!(<crate::AccountInfoByTokenAndAccount<Test>>::contains_key(
            token_id, &dst
        ));
    })
}

#[test]
fn permissionless_transfer_ok_for_new_destination_with_bloat_bond_slashed_from_src() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let bloat_bond = balance!(DEFAULT_BLOAT_BOND);
    let (dst, amount) = (account!(2), balance!(100));

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, bloat_bond);

        let _ = Token::transfer(origin!(src), token_id, outputs![(dst, amount)]);

        assert_eq!(Balances::usable_balance(&src), balance!(0));
    })
}

#[test]
fn permissionless_transfer_ok_for_new_destination_with_bloat_bond_transferred_to_treasury() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let (treasury, bloat_bond) = (treasury!(token_id), balance!(DEFAULT_BLOAT_BOND));
    let (dst, amount) = (account!(2), balance!(100));

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, bloat_bond);

        let _ = Token::transfer(origin!(src), token_id, outputs![(dst, amount)]);

        assert_eq!(Balances::usable_balance(&treasury), bloat_bond);
    })
}

#[test]
fn permissionless_transfer_fails_with_source_not_having_sufficient_free_balance() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (dst, amount) = (account!(1), balance!(100));
    let (src, src_balance) = (account!(2), amount - balance!(1));

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, src_balance, 0)
        .with_account(dst, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id, outputs![(dst, amount)]);

        assert_noop!(result, Error::<Test>::InsufficientFreeBalanceForTransfer);
    })
}

#[test]
fn permissionless_transfer_ok() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let (dst, amount) = (account!(2), balance!(100));

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .with_account(dst, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id, outputs![(dst, amount)]);

        assert_ok!(result);
    })
}

#[test]
fn permissionless_transfer_ok_with_event_deposit() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let (dst, amount) = (account!(2), balance!(100));
    let outputs = outputs![(dst, amount)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .with_account(dst, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::transfer(origin!(src), token_id, outputs.clone());

        last_event_eq!(RawEvent::TokenAmountTransferred(
            token_id,
            src,
            outputs.into()
        ));
    })
}

#[test]
fn permissionless_transfer_ok_and_src_left_with_zero_balance() {
    let token_id = token!(1);
    let (src, dst, amount) = (account!(1), account!(2), balance!(100));

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .with_account(dst, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::transfer(origin!(src), token_id, outputs![(dst, amount)]);

        assert_ok!(
            Token::ensure_account_data_exists(token_id, &src).map(|info| info.total_balance()),
            balance!(0),
        );
    })
}

#[test]
fn permissionless_transfer_ok_with_destination_receiving_funds() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (src, amount) = (account!(1), balance!(100));
    let dst = account!(2);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .with_account(dst, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::transfer(origin!(src), token_id, outputs![(dst, amount)]);

        assert_eq!(
            Token::account_info_by_token_and_account(token_id, dst).free_balance,
            amount
        );
    })
}

#[test]
fn permissionless_transfer_ok_without_change_in_token_supply() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (src, amount) = (account!(1), balance!(100));
    let dst = account!(2);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .with_account(dst, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::transfer(origin!(src), token_id, outputs![(dst, amount)]);

        assert_eq!(Token::token_info_by_id(token_id).supply, amount);
    })
}

// multi output
#[test]
fn multiout_transfer_fails_with_non_existing_token() {
    let token_id = token!(1);
    let src = account!(1);
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id, outputs);

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
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id, outputs);

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn multiout_transfer_ok_with_non_existing_destination() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(dst1, 0, 0)
        .with_account(src, amount1 + amount2, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id, outputs);

        assert_ok!(result);
    })
}

#[test]
fn multiout_transfer_ok_with_src_having_insufficient_funds_for_bloat_bond() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (src, _bloat_bond) = (account!(1), balance!(DEFAULT_BLOAT_BOND));
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(src, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id, outputs);

        assert_noop!(result, Error::<Test>::InsufficientBalanceForBloatBond);
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
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .with_account(src, amount1 + amount2, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id, outputs);

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
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .with_account(src, amount1 + amount2, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::transfer(origin!(src), token_id, outputs.clone());

        last_event_eq!(RawEvent::TokenAmountTransferred(
            token_id,
            src,
            outputs.into()
        ));
    })
}

#[test]
fn multiout_transfer_ok_without_change_in_token_supply() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let (src, src_balance) = (account!(1), amount1 + amount2);
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .with_account(src, src_balance, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::transfer(origin!(src), token_id, outputs);

        assert_eq!(
            Token::token_info_by_id(token_id).supply,
            balance!(src_balance),
        );
    })
}

#[test]
fn multiout_transfer_ok_and_source_left_with_zero_balance() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let (src, src_balance) = (account!(1), amount1 + amount2);
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .with_account(src, src_balance, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::transfer(origin!(src), token_id, outputs);

        assert_ok!(
            Token::ensure_account_data_exists(token_id, &src).map(|info| info.total_balance()),
            balance!(0),
        );
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
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .with_account(src, src_balance, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id, outputs);

        assert_noop!(result, Error::<Test>::InsufficientFreeBalanceForTransfer);
    })
}

#[test]
fn multiout_transfer_ok_with_same_source_and_destination() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(dst1, amount1 + amount2, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(dst1), token_id, outputs);

        assert_ok!(result);
    })
}

#[test]
fn multiout_transfer_ok_with_new_destinations_created() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (src, _bloat_bond) = (account!(1), balance!(DEFAULT_BLOAT_BOND));
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(src, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::transfer(origin!(src), token_id, outputs);

        assert!([dst1, dst2]
            .iter()
            .all(|dst| <crate::AccountInfoByTokenAndAccount<Test>>::contains_key(token_id, dst)));
    })
}

#[test]
fn multiout_transfer_ok_with_bloat_bond_for_new_destinations_slashed_from_src() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (src, bloat_bond) = (account!(1), balance!(DEFAULT_BLOAT_BOND));
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(src, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, 2 * bloat_bond);

        let _ = Token::transfer(origin!(src), token_id, outputs);

        assert_eq!(Balances::usable_balance(&src), balance!(0));
    })
}

#[test]
fn multiout_transfer_ok_with_bloat_bond_transferred_to_treasury() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (src, bloat_bond) = (account!(1), balance!(DEFAULT_BLOAT_BOND));
    let treasury: AccountId = treasury!(token_id);
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(src, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, 2 * bloat_bond);

        let _ = Token::transfer(origin!(src), token_id, outputs);

        assert_eq!(Balances::usable_balance(&treasury), 2 * bloat_bond);
    })
}

#[test]
fn transfer_ok_with_same_source_and_destination() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (dst, amount) = (account!(2), balance!(1));
    let outputs = outputs![(dst, amount)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_info)
        .with_account(dst, amount, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(dst), token_id, outputs);

        assert_ok!(result);
    })
}

#[test]
fn permissioned_transfer_ok() {
    let token_id = token!(1);
    let (_src, amount) = (account!(2), balance!(100));
    let src = account!(1);
    let (dst1, dst2) = (account!(2), account!(3));
    let commit = merkle_root![dst1, dst2];
    let outputs = outputs![(dst1, amount)];

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
        let result = Token::transfer(origin!(src), token_id, outputs);

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
    let outputs = outputs![(dst1, amount)];

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
        let _ = Token::transfer(origin!(src), token_id, outputs.clone());

        last_event_eq!(RawEvent::TokenAmountTransferred(
            token_id,
            src,
            outputs.into()
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
    let outputs = outputs![(dst1, amount)];

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id, outputs);

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
    let outputs = outputs![(dst1, amount)];

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, amount, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id, outputs);

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
    let outputs = outputs![(dst1, amount)];

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
        let result = Token::transfer(origin!(src), token_id, outputs);

        assert_noop!(result, Error::<Test>::InsufficientFreeBalanceForTransfer);
    })
}

#[test]
fn permissioned_transfer_ok_with_src_left_with_zero_balance() {
    let token_id = token!(1);
    let amount = balance!(100);
    let (src, src_balance) = (account!(1), amount);
    let (dst1, dst2) = (account!(2), account!(3));
    let commit = merkle_root![dst1, dst2];
    let outputs = outputs![(dst1, amount)];

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
        let _ = Token::transfer(origin!(src), token_id, outputs);

        assert_ok!(
            Token::ensure_account_data_exists(token_id, &src).map(|info| info.total_balance()),
            balance!(0),
        );
    })
}

#[test]
fn permissioned_transfer_ok_without_change_in_token_supply() {
    let token_id = token!(1);
    let (_src, amount) = (account!(2), balance!(100));
    let src = account!(1);
    let (dst1, dst2) = (account!(2), account!(3));
    let commit = merkle_root![dst1, dst2];
    let outputs = outputs![(dst1, amount)];

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
        let _ = Token::transfer(origin!(src), token_id, outputs);

        assert_eq!(Token::token_info_by_id(token_id).supply, balance!(amount),);
    })
}

#[test]
fn permissioned_multi_out_transfer_fails_with_invalid_token_id() {
    let token_id = token!(1);
    let src = account!(1);
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, TokenDataBuilder::new_empty().build())
        .with_account(src, amount1 + amount2, 0)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id + 1, outputs);

        assert_noop!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn permissioned_multi_out_transfer_fails_with_invalid_source_account() {
    let token_id = token!(1);
    let src = account!(1);
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let commit = merkle_root![dst1, dst2];
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(dst1, 0, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id, outputs);

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn permissioned_multi_out_transfer_ok_with_invalid_destination_account() {
    let token_id = token!(1);
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let (src, src_balance) = (account!(1), amount1 + amount2);
    let commit = merkle_root![dst1, dst2];
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(src, src_balance, 0)
        .with_account(dst2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id, outputs);

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn permissioned_multi_out_ok() {
    let token_id = token!(1);
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let (src, src_balance) = (account!(1), amount1 + amount2);
    let commit = merkle_root![dst1, dst2];
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

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
        let result = Token::transfer(origin!(src), token_id, outputs);

        assert_ok!(result);
    })
}

#[test]
fn permissioned_multi_out_ok_with_event_deposit() {
    let token_id = token!(1);
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let (src, src_balance) = (account!(1), amount1 + amount2);
    let commit = merkle_root![dst1, dst2];
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

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
        let _ = Token::transfer(origin!(src), token_id, outputs.clone());

        last_event_eq!(RawEvent::TokenAmountTransferred(
            token_id,
            src,
            outputs.into(),
        ));
    })
}

#[test]
fn permissioned_multi_out_ok_and_source_left_with_zero_balance() {
    let token_id = token!(1);
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let (src, src_balance) = (account!(1), amount1 + amount2);
    let commit = merkle_root![dst1, dst2];
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

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
        let _ = Token::transfer(origin!(src), token_id, outputs.clone());

        assert_ok!(
            Token::ensure_account_data_exists(token_id, &src).map(|info| info.total_balance()),
            balance!(0),
        );
    })
}

#[test]
fn permissioned_multi_out_ok_and_without_change_in_token_supply() {
    let token_id = token!(1);
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let (src, src_balance) = (account!(1), amount1 + amount2);
    let commit = merkle_root![dst1, dst2];
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

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
        let _ = Token::transfer(origin!(src), token_id, outputs);

        assert_eq!(
            Token::token_info_by_id(token_id).supply,
            balance!(src_balance),
        );
    })
}
