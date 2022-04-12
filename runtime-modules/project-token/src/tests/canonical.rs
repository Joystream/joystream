#![cfg(test)]

use frame_support::{assert_noop, assert_ok, StorageDoubleMap};

use crate::tests::mock::*;
use crate::tests::test_utils::TokenDataBuilder;
use crate::types::MerkleProofOf;
use crate::{
    account, balance, last_event_eq, merkle_proof, merkle_root, origin, token, Error, RawEvent,
};

macro_rules! treasury {
    ($t: expr) => {
        Test::ModuleId::get().into_sub_account::<AccountId>($t)
    };
}

#[test]
fn join_whitelist_fails_with_token_id_not_valid() {
    let token_id = token!(1);
    let (owner, acc1, acc2) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![acc1, acc2];
    let proof = merkle_proof!(0, [acc1, acc2]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::join_whitelist(origin!(acc1), token_id + 1, proof);

        assert_noop!(result, Error::<Test>::TokenDoesNotExist,);
    })
}

#[test]
fn join_whitelist_fails_with_existing_account() {
    let token_id = token!(1);
    let (owner, acc1, acc2) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![acc1, acc2];
    let proof = merkle_proof!(0, [acc1, acc2]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0, 0)
        .with_account(acc1, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::join_whitelist(origin!(acc1), token_id, proof);

        assert_noop!(result, Error::<Test>::AccountAlreadyExists,);
    })
}

#[test]
fn join_whitelist_fails_with_invalid_proof() {
    let token_id = token!(1);
    let (owner, acc1, acc2) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![acc1, acc2];
    let proof = merkle_proof!(0, [acc1, acc1]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::join_whitelist(origin!(acc1), token_id, proof);

        assert_noop!(result, Error::<Test>::MerkleProofVerificationFailure,);
    })
}

#[test]
fn join_whitelist_fails_with_no_proof_provided() {
    let token_id = token!(1);
    let (owner, acc1, acc2) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![acc1, acc2];
    let proof = MerkleProofOf::<Test>::new(None);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::join_whitelist(origin!(acc1), token_id, proof);

        assert_noop!(result, Error::<Test>::MerkleProofNotProvided,);
    })
}

#[test]
fn join_whitelist_ok() {
    let token_id = token!(1);
    let (owner, acc1, acc2) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![acc1, acc2];
    let proof = merkle_proof!(0, [acc1, acc2]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::join_whitelist(origin!(acc1), token_id, proof);

        assert_ok!(result);
    })
}

#[test]
fn join_whitelist_ok_with_event_deposit() {
    let token_id = token!(1);
    let (owner, acc1, acc2) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![acc1, acc2];
    let proof = merkle_proof!(0, [acc1, acc2]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::join_whitelist(origin!(acc1), token_id, proof);

        last_event_eq!(RawEvent::MemberJoinedWhitelist(
            token_id,
            acc1,
            Policy::Permissioned(commit)
        ));
    })
}

#[test]
fn join_whitelist_ok_in_permissionless_mode() {
    let token_id = token!(1);
    let (owner, acc1, acc2) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![acc1, acc2];
    let proof = merkle_proof!(0, [acc1, acc2]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::join_whitelist(origin!(acc1), token_id, proof);

        assert_ok!(result);
    })
}

#[test]
fn join_whitelist_ok_with_new_account_created() {
    let token_id = token!(1);
    let (owner, acc1, acc2) = (account!(1), account!(2), account!(3));
    let proof = merkle_proof!(0, [acc1, acc2]);

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::join_whitelist(origin!(acc1), token_id, proof);

        assert!(<crate::AccountInfoByTokenAndAccount<Test>>::contains_key(
            token_id, acc1
        ));
    })
}

#[test]
fn join_whitelist_ok_with_new_account_having_free_balance_zero() {
    let token_id = token!(1);
    let (owner, acc1, acc2) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![acc1, acc2];
    let proof = merkle_proof!(0, [acc1, acc2]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0, 0)
        .with_account(acc1, 0, 0)
        .with_account(acc2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::join_whitelist(origin!(acc1), token_id, proof);

        assert_eq!(
            Token::account_info_by_token_and_account(token_id, acc1).free_balance,
            balance!(0)
        );
    })
}

#[test]
fn join_whitelist_ok_with_new_account_having_reserved_balance_zero() {
    let token_id = token!(1);
    let (owner, acc1, acc2) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![acc1, acc2];
    let proof = merkle_proof!(0, [acc1, acc2]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0, 0)
        .with_account(acc1, 0, 0)
        .with_account(acc2, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::join_whitelist(origin!(acc1), token_id, proof);

        assert_eq!(
            Token::account_info_by_token_and_account(token_id, acc1).reserved_balance,
            balance!(0)
        );
    })
}

#[test]
fn join_whitelist_ok_with_bloat_bond_deposited_into_treasury() {
    let token_id = token!(1);
    let (owner, acc1, acc2) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![acc1, acc2];
    let proof = merkle_proof!(0, [acc1, acc2]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::join_whitelist(origin!(acc1), token_id, proof);

        assert_ok!(result);
    })
}
