#![cfg(test)]
use frame_support::{assert_noop, assert_ok};

use crate::tests::mock::*;
use crate::tests::test_utils::TokenDataBuilder;
use crate::types::{Transfers, Validated};
use crate::{account, balance, joy, last_event_eq, merkle_root, origin, token, Error, RawEvent};

// some helpers
macro_rules! outputs {
    [$(($a:expr, $b: expr)),*] => {
        Transfers::<_,_>::new(vec![$(($a, $b),)*])
    };
}

// permissionless transfer tests
#[test]
fn transfer_fails_with_non_existing_token() {
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
fn transfer_fails_with_non_existing_source() {
    let token_id = token!(1);
    let origin = origin!(account!(1));
    let (dst, amount) = (account!(2), balance!(100));

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(dst, AccountData::new_with_liquidity(amount))
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
        .with_token_and_owner(token_id, token_data, src, amount)
        .with_bloat_bond(joy!(100))
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id, outputs![(dst, amount)]);

        assert_noop!(result, Error::<Test>::InsufficientBalanceForBloatBond);
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
    let bloat_bond = joy!(100);

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, src, amount)
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, ExistentialDeposit::get() + bloat_bond);

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
    let bloat_bond = joy!(100);

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_data, src, amount)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, ExistentialDeposit::get() + bloat_bond);

        let _ = Token::transfer(origin!(src), token_id, outputs![(dst, amount)]);

        assert_ok!(
            Token::ensure_account_data_exists(token_id, &dst),
            AccountData::new_with_liquidity_and_bond(amount, bloat_bond)
        );
    })
}

#[test]
fn permissionless_transfer_ok_for_new_destination_with_bloat_bond_slashed_from_src() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let bloat_bond = joy!(100);
    let (dst, amount) = (account!(2), balance!(100));

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, src, amount)
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, ExistentialDeposit::get() + bloat_bond);

        let _ = Token::transfer(origin!(src), token_id, outputs![(dst, amount)]);

        assert_eq!(Balances::usable_balance(&src), ExistentialDeposit::get());
    })
}

#[test]
fn permissionless_transfer_ok_for_new_destination_with_bloat_bond_transferred_to_treasury() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let src = account!(1);
    let (treasury, bloat_bond) = (Token::bloat_bond_treasury_account_id(), joy!(100));
    let (dst, amount) = (account!(2), balance!(100));

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, src, amount)
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, ExistentialDeposit::get() + bloat_bond);

        let _ = Token::transfer(origin!(src), token_id, outputs![(dst, amount)]);

        assert_eq!(
            Balances::usable_balance(&treasury),
            bloat_bond + ExistentialDeposit::get(), // treasury initial balance = Existential deposit
        );
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
        .with_token_and_owner(token_id, token_data, src, src_balance)
        .with_account(dst, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, ExistentialDeposit::get());

        let result = Token::transfer(origin!(src), token_id, outputs![(dst, amount)]);

        assert_noop!(result, Error::<Test>::InsufficientFreeBalance);
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
        .with_token_and_owner(token_id, token_data, src, amount)
        .with_account(dst, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, ExistentialDeposit::get());

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
        .with_token_and_owner(token_id, token_data, src, amount)
        .with_account(dst, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, ExistentialDeposit::get());

        let _ = Token::transfer(origin!(src), token_id, outputs.clone());

        last_event_eq!(RawEvent::TokenAmountTransferred(
            token_id,
            src,
            outputs![(Validated::<_>::Existing(dst), amount)]
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
    let dst = account!(2);

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, src, amount)
        .with_account(dst, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, ExistentialDeposit::get());

        let _ = Token::transfer(origin!(src), token_id, outputs![(dst, amount)]);

        assert_eq!(
            Token::account_info_by_token_and_account(token_id, dst).free_balance,
            amount
        );
    })
}

#[test]
fn transfer_ok_without_change_in_token_supply() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let (src, src_balance) = (account!(1), amount1 + amount2);

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, src, src_balance)
        .with_account(dst1, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::transfer(
            origin!(src),
            token_id,
            outputs![(dst1, amount1), (dst2, amount2)],
        );

        assert_eq!(Token::token_info_by_id(token_id).supply, src_balance);
    })
}

// multi output

#[test]
fn multiout_transfer_ok_with_non_existing_destination() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let bloat_bond = joy!(100);
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let (src, src_balance) = (account!(1), amount1 + amount2);
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, src, src_balance)
        .with_account(dst1, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, ExistentialDeposit::get() + bloat_bond);

        let result = Token::transfer(origin!(src), token_id, outputs);

        assert_ok!(result);
    })
}

#[test]
fn multiout_transfer_fails_with_src_having_insufficient_funds_for_bloat_bond() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let (src, src_balance, bloat_bond) = (account!(1), amount1 + amount2, joy!(100));
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, src, src_balance)
        .with_bloat_bond(bloat_bond)
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
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let (src, src_balance) = (account!(1), amount1 + amount2);
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, src, src_balance)
        .with_account(dst1, AccountData::new_empty())
        .with_account(dst2, AccountData::new_empty())
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
    let bloat_bond = joy!(100);
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let (src, src_balance) = (account!(1), amount1 + amount2);
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, src, src_balance)
        .with_account(dst1, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, ExistentialDeposit::get() + bloat_bond);

        let _ = Token::transfer(origin!(src), token_id, outputs.clone());

        last_event_eq!(RawEvent::TokenAmountTransferred(
            token_id,
            src,
            outputs![
                (Validated::<_>::Existing(dst1), amount1),
                (Validated::<_>::NonExisting(dst2), amount2)
            ]
        ));
    })
}

#[test]
fn transfer_ok_and_source_left_with_zero_token_balance() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let (src, src_balance) = (account!(1), amount1 + amount2);
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, src, src_balance)
        .with_account(dst1, AccountData::new_empty())
        .with_account(dst2, AccountData::new_empty())
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
        .with_token_and_owner(token_id, token_info, src, src_balance)
        .with_account(dst1, AccountData::new_empty())
        .with_account(dst2, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, ExistentialDeposit::get());

        let result = Token::transfer(origin!(src), token_id, outputs);

        assert_noop!(result, Error::<Test>::InsufficientFreeBalance);
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
        .with_token_and_owner(token_id, token_info, dst1, amount1 + amount2)
        .with_account(dst2, AccountData::new_empty())
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
    let (dst1, amount1) = (account!(2), balance!(100));
    let (dst2, amount2) = (account!(3), balance!(100));
    let (src, src_balance, bloat_bond) = (account!(1), amount1 + amount2, joy!(100));
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_info, src, src_balance)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, ExistentialDeposit::get() + 2 * bloat_bond);

        let _ = Token::transfer(origin!(src), token_id, outputs);

        assert_ok!(
            Token::ensure_account_data_exists(token_id, &dst1),
            AccountData::new_with_liquidity_and_bond(amount1, bloat_bond)
        );

        assert_ok!(
            Token::ensure_account_data_exists(token_id, &dst2),
            AccountData::new_with_liquidity_and_bond(amount2, bloat_bond)
        );
    })
}

#[test]
fn multiout_transfer_ok_with_bloat_bond_for_new_destinations_slashed_from_src() {
    let token_id = token!(1);
    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let (src, bloat_bond, src_balance) = (account!(1), joy!(100), amount1 + amount2);
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, src, src_balance)
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, ExistentialDeposit::get() + 2 * bloat_bond);

        let _ = Token::transfer(origin!(src), token_id, outputs);

        assert_eq!(Balances::usable_balance(&src), ExistentialDeposit::get());
    })
}

#[test]
fn multiout_transfer_ok_with_bloat_bond_transferred_to_treasury() {
    let token_id = token!(1);
    let treasury = Token::bloat_bond_treasury_account_id();
    let (dst1, amount1) = (account!(2), balance!(1));
    let (dst2, amount2) = (account!(3), balance!(1));
    let (src, src_balance, bloat_bond) = (account!(1), amount1 + amount2, joy!(100));
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let token_info = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_info, src, src_balance)
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, ExistentialDeposit::get() + 2 * bloat_bond);

        let result = Token::transfer(origin!(src), token_id, outputs);

        assert_ok!(result);

        assert_eq!(
            Balances::usable_balance(&treasury),
            ExistentialDeposit::get() + 2 * bloat_bond
        );
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
        .with_account(dst, AccountData::new_with_liquidity(amount))
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&dst, ExistentialDeposit::get());

        let result = Token::transfer(origin!(dst), token_id, outputs);

        assert_ok!(result);
    })
}

#[test]
fn permissioned_transfer_ok() {
    let token_id = token!(1);
    let (src, amount) = (account!(1), balance!(100));
    let (dst1, dst2) = (account!(2), account!(3));
    let commit = merkle_root![dst1, dst2];
    let outputs = outputs![(dst1, amount)];

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, src, amount)
        .with_account(dst1, AccountData::new_empty())
        .with_account(dst2, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, ExistentialDeposit::get());

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
        .with_token_and_owner(token_id, token_data, src, amount)
        .with_account(dst1, AccountData::new_empty())
        .with_account(dst2, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, ExistentialDeposit::get());

        let _ = Token::transfer(origin!(src), token_id, outputs.clone());

        last_event_eq!(RawEvent::TokenAmountTransferred(
            token_id,
            src,
            outputs![(Validated::<_>::Existing(dst1), amount)],
        ));
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
        .with_token_and_owner(token_id, token_data, src, amount)
        .with_account(dst2, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id, outputs);

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn permissioned_multi_out_transfer_fails_with_insufficient_balance() {
    let token_id = token!(1);
    let (dst1, amount1) = (account!(2), balance!(100));
    let (dst2, amount2) = (account!(3), balance!(100));
    let (src, src_balance) = (account!(1), amount1 + amount2 - 1);
    let commit = merkle_root![dst1, dst2];
    let outputs = outputs![(dst1, amount1), (dst2, amount2)];

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, src, src_balance)
        .with_account(dst1, AccountData::new_empty())
        .with_account(dst2, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&src, ExistentialDeposit::get());

        let result = Token::transfer(origin!(src), token_id, outputs);

        assert_noop!(result, Error::<Test>::InsufficientFreeBalance);
    })
}

#[test]
fn permissioned_multi_out_transfer_ok() {
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
        .with_account(src, AccountData::new_with_liquidity(src_balance))
        .with_account(dst1, AccountData::new_empty())
        .with_account(dst2, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::transfer(origin!(src), token_id, outputs);

        assert_ok!(result);
    })
}

#[test]
fn permissioned_multi_out_transfer_ok_with_event_deposit() {
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
        .with_account(src, AccountData::new_with_liquidity(src_balance))
        .with_account(dst1, AccountData::new_empty())
        .with_account(dst2, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::transfer(origin!(src), token_id, outputs.clone());

        last_event_eq!(RawEvent::TokenAmountTransferred(
            token_id,
            src,
            outputs![
                (Validated::<_>::Existing(dst1), amount1),
                (Validated::<_>::Existing(dst2), amount2)
            ],
        ));
    })
}
