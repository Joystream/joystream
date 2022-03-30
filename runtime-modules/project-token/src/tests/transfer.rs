#![cfg(test)]
use frame_support::{assert_noop, assert_ok, StorageDoubleMap};
use sp_arithmetic::traits::{One, Zero};
use sp_runtime::traits::Hash;

use crate::tests::mock::*;
use crate::traits::ControlledTransfer;
use crate::types::TokenIssuanceParametersOf;
use crate::{last_event_eq, Error, RawEvent};

// base transfer tests
#[test]
fn base_transfer_fails_with_non_existing_token() {
    let config = GenesisConfigBuilder::new()
        .add_token_and_account_info()
        .add_account_info()
        .build();
    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    let dst = AccountId::from(DEFAULT_ACCOUNT_ID + 1);
    let amount = Balance::one();

    build_test_externalities(config).execute_with(|| {
        let token_id = Token::next_token_id();

        assert_noop!(
            <Token as ControlledTransfer<AccountId, Policy, IssuanceParams>>::transfer(
                token_id,
                src,
                Simple::new(dst),
                amount
            ),
            Error::<Test>::TokenDoesNotExist,
        );
    })
}

#[test]
fn base_transfer_fails_with_non_existing_src() {
    let config = GenesisConfigBuilder::new()
        .add_token_and_account_info()
        .add_account_info()
        .build();

    let token_id = One::one();
    let dst = AccountId::from(DEFAULT_ACCOUNT_ID + 1);
    let src = dst.saturating_add(One::one());
    let amount = Balance::one();

    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as ControlledTransfer<AccountId, Policy, IssuanceParams>>::transfer(
                token_id,
                src,
                Simple::new(dst),
                amount
            ),
            Error::<Test>::AccountInformationDoesNotExist,
        );
    })
}

#[test]
fn base_transfer_fails_with_non_existing_dst() {
    let config = GenesisConfigBuilder::new()
        .add_token_and_account_info()
        .build();

    let token_id = One::one();
    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    let dst = AccountId::from(DEFAULT_ACCOUNT_ID + 1);
    let amount = Balance::one();

    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as ControlledTransfer<AccountId, Policy, IssuanceParams>>::transfer(
                token_id,
                src,
                Simple::new(dst),
                amount
            ),
            Error::<Test>::AccountInformationDoesNotExist,
        );
    })
}

#[test]
fn base_transfer_fails_with_src_having_insufficient_free_balance() {
    let config = GenesisConfigBuilder::new()
        .add_token_and_account_info()
        .add_account_info()
        .build();

    let token_id = One::one();
    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    let dst = AccountId::from(DEFAULT_ACCOUNT_ID + 1);
    let amount = Balance::from(DEFAULT_FREE_BALANCE + 1);

    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as ControlledTransfer<AccountId, Policy, IssuanceParams>>::transfer(
                token_id,
                src,
                Simple::new(dst),
                amount
            ),
            Error::<Test>::InsufficientFreeBalanceForTransfer,
        );
    })
}

#[test]
fn base_transfer_ok_without_src_removal() {
    let config = GenesisConfigBuilder::new()
        .add_token_and_account_info()
        .add_account_info()
        .build();

    let token_id = One::one();
    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    let dst = AccountId::from(DEFAULT_ACCOUNT_ID + 1);
    let amount = Balance::one();

    build_test_externalities(config).execute_with(|| {
        let src_free_balance_pre =
            Token::account_info_by_token_and_account(token_id, src).free_balance;
        let dst_free_balance_pre =
            Token::account_info_by_token_and_account(token_id, dst).free_balance;
        let issuance_pre = Token::token_info_by_id(token_id).current_total_issuance;

        assert_ok!(<Token as ControlledTransfer<
            AccountId,
            Policy,
            IssuanceParams,
        >>::transfer(token_id, src, Simple::new(dst), amount));

        let src_free_balance_post =
            Token::account_info_by_token_and_account(token_id, src).free_balance;
        let dst_free_balance_post =
            Token::account_info_by_token_and_account(token_id, dst).free_balance;
        let issuance_post = Token::token_info_by_id(token_id).current_total_issuance;

        assert_eq!(issuance_pre, issuance_post);
        assert_eq!(
            dst_free_balance_pre.saturating_add(amount),
            dst_free_balance_post
        );
        assert_eq!(
            src_free_balance_pre.saturating_sub(amount),
            src_free_balance_post
        );

        last_event_eq!(RawEvent::TokenAmountTransferred(token_id, src, dst, amount));
    })
}

#[test]
fn base_transfer_ok_with_src_removal() {
    let config = GenesisConfigBuilder::new()
        .add_token_and_account_info()
        .add_account_info()
        .build();

    let token_id = One::one();
    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    let dst = AccountId::from(DEFAULT_ACCOUNT_ID + 1);
    let amount = Balance::from(DEFAULT_FREE_BALANCE - DEFAULT_EXISTENTIAL_DEPOSIT + 1);

    build_test_externalities(config).execute_with(|| {
        let src_account_config = Token::account_info_by_token_and_account(token_id, src);
        let dust = src_account_config.total_balance().saturating_sub(amount);
        let dst_free_balance_pre =
            Token::account_info_by_token_and_account(token_id, dst).free_balance;
        let issuance_pre = Token::token_info_by_id(token_id).current_total_issuance;

        assert_ok!(<Token as ControlledTransfer<
            AccountId,
            Policy,
            IssuanceParams,
        >>::transfer(token_id, src, Simple::new(dst), amount));

        let dst_free_balance_post =
            Token::account_info_by_token_and_account(token_id, dst).free_balance;
        let issuance_post = Token::token_info_by_id(token_id).current_total_issuance;

        assert_eq!(issuance_pre.saturating_sub(dust), issuance_post);
        assert_eq!(
            dst_free_balance_pre.saturating_add(amount),
            dst_free_balance_post
        );
        assert!(!<crate::AccountInfoByTokenAndAccount<Test>>::contains_key(
            token_id, src
        ));

        last_event_eq!(RawEvent::TokenAmountTransferred(token_id, src, dst, amount));
    })
}
// multi output
#[test]
fn multiout_transfer_fails_with_non_existing_token() {
    let config = GenesisConfigBuilder::new()
        .add_token_and_account_info()
        .add_account_info()
        .add_account_info()
        .build();
    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    let outputs = vec![
        (
            Simple::new(AccountId::from(DEFAULT_ACCOUNT_ID + 1)),
            Balance::one(),
        ),
        (
            Simple::new(AccountId::from(DEFAULT_ACCOUNT_ID + 2)),
            Balance::one(),
        ),
    ];

    build_test_externalities(config).execute_with(|| {
        let token_id = Token::next_token_id();

        assert_noop!(
            <Token as ControlledTransfer<AccountId, Policy, IssuanceParams>>::multi_output_transfer(
                token_id, src, &outputs
            ),
            Error::<Test>::TokenDoesNotExist,
        );
    })
}

#[test]
fn multiout_transfer_fails_with_non_existing_src() {
    let config = GenesisConfigBuilder::new()
        .add_token_and_account_info()
        .add_account_info()
        .add_account_info()
        .build();
    let token_id = TokenId::one();
    let src = AccountId::from(DEFAULT_ACCOUNT_ID + 3);
    let outputs = vec![
        (
            Simple::new(AccountId::from(DEFAULT_ACCOUNT_ID + 1)),
            Balance::one(),
        ),
        (
            Simple::new(AccountId::from(DEFAULT_ACCOUNT_ID + 2)),
            Balance::one(),
        ),
    ];

    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as ControlledTransfer<AccountId, Policy, IssuanceParams>>::multi_output_transfer(
                token_id, src, &outputs
            ),
            Error::<Test>::AccountInformationDoesNotExist,
        );
    })
}

#[test]
fn multiout_transfer_fails_with_non_existing_dst() {
    let config = GenesisConfigBuilder::new()
        .add_token_and_account_info()
        .add_account_info()
        .build();
    let token_id = TokenId::one();
    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    let outputs = vec![
        (
            Simple::new(AccountId::from(DEFAULT_ACCOUNT_ID + 1)),
            Balance::one(),
        ),
        (
            Simple::new(AccountId::from(DEFAULT_ACCOUNT_ID + 2)),
            Balance::one(),
        ),
    ];

    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as ControlledTransfer<AccountId, Policy, IssuanceParams>>::multi_output_transfer(
                token_id, src, &outputs
            ),
            Error::<Test>::AccountInformationDoesNotExist,
        );
    })
}

#[test]
fn multiout_transfer_fails_with_insufficient_balance() {
    let config = GenesisConfigBuilder::new()
        .add_token_and_account_info()
        .add_account_info()
        .add_account_info()
        .build();
    let token_id = TokenId::one();
    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    let outputs = vec![
        (
            Simple::new(AccountId::from(DEFAULT_ACCOUNT_ID + 1)),
            Balance::from(DEFAULT_FREE_BALANCE),
        ),
        (
            Simple::new(AccountId::from(DEFAULT_ACCOUNT_ID + 2)),
            Balance::one(),
        ),
    ];

    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as ControlledTransfer<AccountId, Policy, IssuanceParams>>::multi_output_transfer(
                token_id, src, &outputs
            ),
            Error::<Test>::InsufficientFreeBalanceForTransfer,
        );
    })
}

#[test]
fn multiout_transfer_fails_with_same_source_and_destination() {
    let config = GenesisConfigBuilder::new()
        .add_token_and_account_info()
        .add_account_info()
        .add_account_info()
        .build();
    let token_id = TokenId::one();
    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    let outputs = vec![
        (
            Simple::new(AccountId::from(DEFAULT_ACCOUNT_ID)),
            Balance::from(DEFAULT_FREE_BALANCE),
        ),
        (
            Simple::new(AccountId::from(DEFAULT_ACCOUNT_ID + 2)),
            Balance::one(),
        ),
    ];

    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as ControlledTransfer<AccountId, Policy, IssuanceParams>>::multi_output_transfer(
                token_id, src, &outputs
            ),
            Error::<Test>::SameSourceAndDestinationLocations,
        );
    })
}

#[test]
fn multiout_transfer_ok_without_src_removal() {
    let config = GenesisConfigBuilder::new()
        .add_token_and_account_info()
        .add_account_info()
        .add_account_info()
        .build();
    let token_id = TokenId::one();
    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    let outputs = vec![
        (
            Simple::new(AccountId::from(DEFAULT_ACCOUNT_ID + 1)),
            Balance::one(),
        ),
        (
            Simple::new(AccountId::from(DEFAULT_ACCOUNT_ID + 2)),
            Balance::one(),
        ),
    ];

    let total_amount = outputs.iter().fold(Balance::zero(), |acc, (_, amount)| {
        acc.saturating_add(*amount)
    });

    build_test_externalities(config).execute_with(|| {
        let src_pre = Token::account_info_by_token_and_account(token_id, src).free_balance;
        let issuance_pre = Token::token_info_by_id(token_id).current_total_issuance;
        let dst_pre = outputs
            .iter()
            .map(|(dst, _)| {
                Token::account_info_by_token_and_account(token_id, &dst.account).free_balance
            })
            .collect::<Vec<_>>();

        assert_ok!(<Token as ControlledTransfer<
            AccountId,
            Policy,
            IssuanceParams,
        >>::multi_output_transfer(token_id, src, &outputs));

        let issuance_post = Token::token_info_by_id(token_id).current_total_issuance;
        let src_post = Token::account_info_by_token_and_account(token_id, src).free_balance;
        let dst_post = outputs.iter().map(|(dst, _)| {
            Token::account_info_by_token_and_account(token_id, &dst.account).free_balance
        });

        assert_eq!(issuance_pre, issuance_post);
        assert_eq!(src_pre, src_post.saturating_add(total_amount));
        assert!(dst_pre
            .iter()
            .zip(dst_post)
            .zip(outputs.iter().map(|(_, amount)| *amount))
            .all(|((pre, post), amount)| { pre.saturating_add(amount) == post }));
    })
}

#[test]
fn multiout_transfer_ok_with_src_removal() {
    let config = GenesisConfigBuilder::new()
        .add_token_and_account_info()
        .add_account_info()
        .add_account_info()
        .build();
    let token_id = TokenId::one();
    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    let outputs = vec![
        (
            Simple::new(AccountId::from(DEFAULT_ACCOUNT_ID + 1)),
            Balance::one(),
        ),
        (
            Simple::new(AccountId::from(DEFAULT_ACCOUNT_ID + 2)),
            Balance::from(DEFAULT_FREE_BALANCE - DEFAULT_EXISTENTIAL_DEPOSIT),
        ),
    ];

    let total_amount = outputs.iter().fold(Balance::zero(), |acc, (_, amount)| {
        acc.saturating_add(*amount)
    });

    build_test_externalities(config).execute_with(|| {
        let src_pre = Token::account_info_by_token_and_account(token_id, src).free_balance;
        let issuance_pre = Token::token_info_by_id(token_id).current_total_issuance;
        let dust = src_pre.saturating_sub(total_amount);
        let dst_pre = outputs
            .iter()
            .map(|(dst, _)| {
                Token::account_info_by_token_and_account(token_id, dst.account).free_balance
            })
            .collect::<Vec<_>>();

        assert_ok!(<Token as ControlledTransfer<
            AccountId,
            Policy,
            IssuanceParams,
        >>::multi_output_transfer(token_id, src, &outputs));

        let issuance_post = Token::token_info_by_id(token_id).current_total_issuance;
        let dst_post = outputs.iter().map(|(dst, _)| {
            Token::account_info_by_token_and_account(token_id, dst.account).free_balance
        });

        assert_eq!(issuance_pre, issuance_post.saturating_add(dust));
        assert!(!<crate::AccountInfoByTokenAndAccount<Test>>::contains_key(
            token_id, src
        ));
        assert!(dst_pre
            .iter()
            .zip(dst_post)
            .zip(outputs.iter().map(|(_, amount)| *amount))
            .all(|((pre, post), amount)| { pre.saturating_add(amount) == post }));
    })
}

// permissioned transfer tests
#[test]
fn permissioned_transfer_ok_without_src_removal() {
    let dest_accounts = vec![
        AccountId::from(DEFAULT_ACCOUNT_ID + 1),
        AccountId::from(DEFAULT_ACCOUNT_ID + 2),
        AccountId::from(DEFAULT_ACCOUNT_ID + 3),
    ];
    let amounts = vec![Balance::one(), Balance::one(), Balance::one()];

    // merkle proof for 2nd element
    let index = 1usize;
    let merkle_proof = build_merkle_path_helper(&dest_accounts, index);
    let commit = generate_merkle_root_helper(&dest_accounts).pop().unwrap();

    let params = TokenIssuanceParametersOf::<Test> {
        existential_deposit: Balance::from(DEFAULT_EXISTENTIAL_DEPOSIT),
        transfer_policy: Policy::Permissioned(commit),
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new()
        .add_token_with_params(params)
        .add_account_info() // src
        .add_account_info() // account 1
        .add_account_info() // account 2
        .add_account_info() // account 3
        .build();

    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    let dst = Verifiable::new(merkle_proof, dest_accounts[index]);
    let token_id = TokenId::one();

    build_test_externalities(config).execute_with(|| {
        let src_pre = Token::account_info_by_token_and_account(token_id, src).free_balance;
        let issuance_pre = Token::token_info_by_id(token_id).current_total_issuance;
        let dst_pre =
            Token::account_info_by_token_and_account(token_id, dest_accounts[index]).free_balance;

        assert_ok!(<Token as ControlledTransfer<
            AccountId,
            Policy,
            IssuanceParams,
        >>::transfer(token_id, src, dst, amounts[index]));

        let issuance_post = Token::token_info_by_id(token_id).current_total_issuance;
        let src_post = Token::account_info_by_token_and_account(token_id, src).free_balance;
        let dst_post =
            Token::account_info_by_token_and_account(token_id, dest_accounts[index]).free_balance;

        assert_eq!(issuance_pre, issuance_post);
        assert_eq!(src_pre, src_post.saturating_add(amounts[index]));
        assert_eq!(dst_pre.saturating_add(amounts[index]), dst_post);
        last_event_eq!(RawEvent::TokenAmountTransferred(
            token_id,
            src,
            dest_accounts[index],
            amounts[index],
        ));
    })
}

#[test]
fn permissioned_transfer_ok_with_src_removal() {
    let dest_accounts = vec![
        AccountId::from(DEFAULT_ACCOUNT_ID + 1),
        AccountId::from(DEFAULT_ACCOUNT_ID + 2),
        AccountId::from(DEFAULT_ACCOUNT_ID + 3),
    ];

    // second element in the dest accounts is the one of interest
    let index = 1usize;
    let mut amounts = vec![Balance::one(), Balance::one(), Balance::one()];
    amounts[index] = Balance::from(DEFAULT_FREE_BALANCE - DEFAULT_EXISTENTIAL_DEPOSIT + 1);

    // merkle proof for index-th element
    let merkle_proof = build_merkle_path_helper(&dest_accounts, index);
    let commit = generate_merkle_root_helper(&dest_accounts).pop().unwrap();

    let params = TokenIssuanceParametersOf::<Test> {
        existential_deposit: Balance::from(DEFAULT_EXISTENTIAL_DEPOSIT),
        transfer_policy: Policy::Permissioned(commit),
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new()
        .add_token_with_params(params)
        .add_account_info() // src
        .add_account_info() // account 1
        .add_account_info() // account 2
        .add_account_info() // account 3
        .build();

    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    let dst = Verifiable::new(merkle_proof, dest_accounts[index]);
    let token_id = TokenId::one();

    build_test_externalities(config).execute_with(|| {
        let src_account_config = Token::account_info_by_token_and_account(token_id, src);
        let dust = src_account_config
            .total_balance()
            .saturating_sub(amounts[index]);
        let dst_free_balance_pre =
            Token::account_info_by_token_and_account(token_id, dest_accounts[index]).free_balance;
        let issuance_pre = Token::token_info_by_id(token_id).current_total_issuance;

        assert_ok!(<Token as ControlledTransfer<
            AccountId,
            Policy,
            IssuanceParams,
        >>::transfer(token_id, src, dst, amounts[index]));

        let dst_free_balance_post =
            Token::account_info_by_token_and_account(token_id, dest_accounts[index]).free_balance;
        let issuance_post = Token::token_info_by_id(token_id).current_total_issuance;

        assert_eq!(issuance_pre.saturating_sub(dust), issuance_post);
        assert_eq!(
            dst_free_balance_pre.saturating_add(amounts[index]),
            dst_free_balance_post
        );
        assert!(!<crate::AccountInfoByTokenAndAccount<Test>>::contains_key(
            token_id, src
        ));
        last_event_eq!(RawEvent::TokenAmountTransferred(
            token_id,
            src,
            dest_accounts[index],
            amounts[index]
        ));
    })
}

#[test]
fn permissioned_transfer_fails_with_failed_merkle_proof() {
    let dest_accounts = vec![
        AccountId::from(DEFAULT_ACCOUNT_ID + 1),
        AccountId::from(DEFAULT_ACCOUNT_ID + 2),
        AccountId::from(DEFAULT_ACCOUNT_ID + 3),
    ];

    // second element in the dest accounts is the one of interest
    let index = 1usize;
    let mut amounts = vec![Balance::one(), Balance::one(), Balance::one()];
    amounts[index] = Balance::from(DEFAULT_FREE_BALANCE - DEFAULT_EXISTENTIAL_DEPOSIT + 1);

    // merkle proof for index-th element
    let merkle_proof = build_merkle_path_helper(&dest_accounts, index);
    let commit = Hashing::hash_of(&b"WRONG COMMIT");

    let params = TokenIssuanceParametersOf::<Test> {
        existential_deposit: Balance::from(DEFAULT_EXISTENTIAL_DEPOSIT),
        transfer_policy: Policy::Permissioned(commit),
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new()
        .add_token_with_params(params)
        .add_account_info() // src
        .add_account_info() // account 1
        .add_account_info() // account 2
        .add_account_info() // account 3
        .build();

    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    let dst = Verifiable::new(merkle_proof, dest_accounts[index]);
    let token_id = TokenId::one();

    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as ControlledTransfer<AccountId, Policy, IssuanceParams>>::transfer(
                token_id,
                src,
                dst,
                amounts[index]
            ),
            Error::<Test>::LocationIncompatibleWithCurrentPolicy
        );
    })
}

#[test]
fn permissioned_transfer_fails_with_wrong_dest_location_type() {
    let dest_accounts = vec![
        AccountId::from(DEFAULT_ACCOUNT_ID + 1),
        AccountId::from(DEFAULT_ACCOUNT_ID + 2),
        AccountId::from(DEFAULT_ACCOUNT_ID + 3),
    ];

    // second element in the dest accounts is the one of interest
    let index = 1usize;
    let amounts = vec![Balance::one(), Balance::one(), Balance::one()];

    // merkle proof for index-th element
    let commit = generate_merkle_root_helper(&dest_accounts).pop().unwrap();

    let params = TokenIssuanceParametersOf::<Test> {
        existential_deposit: Balance::from(DEFAULT_EXISTENTIAL_DEPOSIT),
        transfer_policy: Policy::Permissioned(commit),
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new()
        .add_token_with_params(params)
        .add_account_info() // src
        .add_account_info() // account 1
        .add_account_info() // account 2
        .add_account_info() // account 3
        .build();

    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    // Simple (Permissionless-compliant type) location
    let dst = Simple::new(dest_accounts[index]);
    let token_id = TokenId::one();

    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as ControlledTransfer<AccountId, Policy, IssuanceParams>>::transfer(
                token_id,
                src,
                dst,
                amounts[index]
            ),
            Error::<Test>::LocationIncompatibleWithCurrentPolicy
        );
    })
}

#[test]
fn permissioned_multiout_transfer_ok_without_src_removal() {
    let dest_accounts = vec![
        AccountId::from(DEFAULT_ACCOUNT_ID + 1),
        AccountId::from(DEFAULT_ACCOUNT_ID + 2),
        AccountId::from(DEFAULT_ACCOUNT_ID + 3),
    ];
    let outputs_no = dest_accounts.len();
    let amounts = vec![Balance::one(), Balance::one(), Balance::one()];

    // merkle proof for 2nd element
    let merkle_proofs = (0..outputs_no).map(|i| build_merkle_path_helper(&dest_accounts, i));
    let commit = generate_merkle_root_helper(&dest_accounts).pop().unwrap();

    let params = TokenIssuanceParametersOf::<Test> {
        existential_deposit: Balance::from(DEFAULT_EXISTENTIAL_DEPOSIT),
        transfer_policy: Policy::Permissioned(commit),
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new()
        .add_token_with_params(params)
        .add_account_info() // src
        .add_account_info() // account 1
        .add_account_info() // account 2
        .add_account_info() // account 3
        .build();

    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    let dests = merkle_proofs
        .zip(dest_accounts.iter())
        .map(|(proof, account)| Verifiable::new(proof, *account));
    let outputs = dests.zip(amounts.iter().cloned()).collect::<Vec<_>>();
    let token_id = TokenId::one();

    build_test_externalities(config).execute_with(|| {
        let src_pre = Token::account_info_by_token_and_account(token_id, src).free_balance;
        let issuance_pre = Token::token_info_by_id(token_id).current_total_issuance;
        let dst_pre = (0..outputs_no)
            .map(|index| {
                Token::account_info_by_token_and_account(token_id, dest_accounts[index])
                    .free_balance
            })
            .collect::<Vec<_>>();

        assert_ok!(<Token as ControlledTransfer<
            AccountId,
            Policy,
            IssuanceParams,
        >>::multi_output_transfer(
            token_id, src, outputs.as_slice()
        ));

        let issuance_post = Token::token_info_by_id(token_id).current_total_issuance;
        let src_post = Token::account_info_by_token_and_account(token_id, src).free_balance;
        let dst_post = (0..outputs_no).map(|index| {
            Token::account_info_by_token_and_account(token_id, dest_accounts[index]).free_balance
        });

        assert_eq!(issuance_pre, issuance_post);
        assert_eq!(src_pre, src_post.saturating_add(amounts.iter().sum()));
        assert!(dst_pre
            .iter()
            .zip(dst_post)
            .zip(amounts.iter())
            .all(|((pre, post), amount)| pre.saturating_add(*amount) == post));
    })
}

#[test]
fn permissioned_multiout_transfer_ok_with_src_removal() {
    let dest_accounts = vec![
        AccountId::from(DEFAULT_ACCOUNT_ID + 1),
        AccountId::from(DEFAULT_ACCOUNT_ID + 2),
        AccountId::from(DEFAULT_ACCOUNT_ID + 3),
    ];
    let outputs_no = dest_accounts.len();
    let amounts = vec![
        Balance::one(),
        Balance::one(),
        Balance::from(DEFAULT_FREE_BALANCE - DEFAULT_EXISTENTIAL_DEPOSIT - 1),
    ];

    // merkle proof for 2nd element
    let merkle_proofs = (0..outputs_no).map(|i| build_merkle_path_helper(&dest_accounts, i));
    let commit = generate_merkle_root_helper(&dest_accounts).pop().unwrap();

    let params = TokenIssuanceParametersOf::<Test> {
        existential_deposit: Balance::from(DEFAULT_EXISTENTIAL_DEPOSIT),
        transfer_policy: Policy::Permissioned(commit),
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new()
        .add_token_with_params(params)
        .add_account_info() // src
        .add_account_info() // account 1
        .add_account_info() // account 2
        .add_account_info() // account 3
        .build();

    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    let dests = merkle_proofs
        .zip(dest_accounts.iter())
        .map(|(proof, account)| Verifiable::new(proof, *account));
    let outputs = dests.zip(amounts.iter().cloned()).collect::<Vec<_>>();
    let token_id = TokenId::one();

    build_test_externalities(config).execute_with(|| {
        let src_pre = Token::account_info_by_token_and_account(token_id, src).free_balance;
        let issuance_pre = Token::token_info_by_id(token_id).current_total_issuance;
        let dust = src_pre.saturating_sub(amounts.iter().sum());
        let dst_pre = (0..outputs_no)
            .map(|index| {
                Token::account_info_by_token_and_account(token_id, dest_accounts[index])
                    .free_balance
            })
            .collect::<Vec<_>>();

        assert_ok!(<Token as ControlledTransfer<
            AccountId,
            Policy,
            IssuanceParams,
        >>::multi_output_transfer(
            token_id, src, outputs.as_slice()
        ));

        let issuance_post = Token::token_info_by_id(token_id).current_total_issuance;
        let dst_post = (0..outputs_no).map(|index| {
            Token::account_info_by_token_and_account(token_id, dest_accounts[index]).free_balance
        });

        assert_eq!(issuance_pre, issuance_post.saturating_add(dust));
        assert!(!<crate::AccountInfoByTokenAndAccount<Test>>::contains_key(
            token_id, src
        ));
        assert!(dst_pre
            .iter()
            .zip(dst_post)
            .zip(amounts.iter())
            .all(|((pre, post), amount)| pre.saturating_add(*amount) == post));
    })
}

#[test]
fn permissioned_multiout_transfer_fails_with_wrong_commit() {
    let dest_accounts = vec![
        AccountId::from(DEFAULT_ACCOUNT_ID + 1),
        AccountId::from(DEFAULT_ACCOUNT_ID + 2),
        AccountId::from(DEFAULT_ACCOUNT_ID + 3),
    ];
    let outputs_no = dest_accounts.len();
    let amounts = vec![
        Balance::one(),
        Balance::one(),
        Balance::from(DEFAULT_FREE_BALANCE - DEFAULT_EXISTENTIAL_DEPOSIT - 1),
    ];

    // merkle proof for 2nd element
    let merkle_proofs = (0..outputs_no).map(|i| build_merkle_path_helper(&dest_accounts, i));
    let commit = Hashing::hash_of(&b"WRONG COMMIT");

    let params = TokenIssuanceParametersOf::<Test> {
        existential_deposit: Balance::from(DEFAULT_EXISTENTIAL_DEPOSIT),
        transfer_policy: Policy::Permissioned(commit),
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new()
        .add_token_with_params(params)
        .add_account_info() // src
        .add_account_info() // account 1
        .add_account_info() // account 2
        .add_account_info() // account 3
        .build();

    let src = AccountId::from(DEFAULT_ACCOUNT_ID);
    let dests = merkle_proofs
        .zip(dest_accounts.iter())
        .map(|(proof, account)| Verifiable::new(proof, *account));
    let outputs = dests.zip(amounts.iter().cloned()).collect::<Vec<_>>();
    let token_id = TokenId::one();

    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as ControlledTransfer<AccountId, Policy, IssuanceParams>>::multi_output_transfer(
                token_id,
                src,
                outputs.as_slice()
            ),
            Error::<Test>::LocationIncompatibleWithCurrentPolicy,
        );
    })
}

#[test]
fn permissioned_multiout_transfer_fails_with_invalid_destination_types() {
    let dest_accounts = vec![
        AccountId::from(DEFAULT_ACCOUNT_ID + 1),
        AccountId::from(DEFAULT_ACCOUNT_ID + 2),
        AccountId::from(DEFAULT_ACCOUNT_ID + 3),
    ];
    let amounts = vec![
        Balance::one(),
        Balance::one(),
        Balance::from(DEFAULT_FREE_BALANCE - DEFAULT_EXISTENTIAL_DEPOSIT - 1),
    ];

    let commit = generate_merkle_root_helper(&dest_accounts).pop().unwrap();

    let params = TokenIssuanceParametersOf::<Test> {
        existential_deposit: Balance::from(DEFAULT_EXISTENTIAL_DEPOSIT),
        transfer_policy: Policy::Permissioned(commit),
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new()
        .add_token_with_params(params)
        .add_account_info() // src
        .add_account_info() // account 1
        .add_account_info() // account 2
        .add_account_info() // account 3
        .build();

    let src = AccountId::from(DEFAULT_ACCOUNT_ID);

    // current design imposes same destination type for all accounts
    let dests = dest_accounts.iter().map(|account| Simple::new(*account));

    let outputs = dests.zip(amounts.iter().cloned()).collect::<Vec<_>>();

    let token_id = TokenId::one();

    build_test_externalities(config).execute_with(|| {
        assert_noop!(
            <Token as ControlledTransfer<AccountId, Policy, IssuanceParams>>::multi_output_transfer(
                token_id,
                src,
                outputs.as_slice()
            ),
            Error::<Test>::LocationIncompatibleWithCurrentPolicy,
        );
    })
}
