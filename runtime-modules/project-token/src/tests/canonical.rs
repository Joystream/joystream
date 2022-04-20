#![cfg(test)]
use frame_support::{assert_noop, assert_ok, StorageDoubleMap, StorageMap};
use sp_runtime::{traits::Hash, Permill};

use crate::tests::mock::*;
use crate::tests::test_utils::TokenDataBuilder;
use crate::traits::PalletToken;
use crate::types::{
    BlockRate, MerkleProofOf, OfferingState, PatronageData, TokenIssuanceParametersOf, YearlyRate,
};
use crate::{
    account, balance, joy, last_event_eq, merkle_proof, merkle_root, origin, token, yearly_rate,
    Error, RawEvent, TokenDataOf,
};

#[test]
fn join_whitelist_fails_with_token_id_not_valid() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![user_account, other_user_account];
    let proof = merkle_proof!(0, [user_account, other_user_account]);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_account, bloat_bond + ExistentialDeposit::get());

        let result = Token::join_whitelist(origin!(user_account), token_id + 1, proof);

        assert_noop!(result, Error::<Test>::TokenDoesNotExist,);
    })
}

#[test]
fn join_whitelist_fails_with_existing_account() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![user_account, other_user_account];
    let proof = merkle_proof!(0, [user_account, other_user_account]);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .with_account(user_account, AccountData::new_empty())
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_account, bloat_bond + ExistentialDeposit::get());

        let result = Token::join_whitelist(origin!(user_account), token_id, proof);

        assert_noop!(result, Error::<Test>::AccountAlreadyExists,);
    })
}

#[test]
fn join_whitelist_fails_with_invalid_proof() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![user_account, other_user_account];
    let proof = merkle_proof!(0, [user_account, user_account]);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_account, bloat_bond + ExistentialDeposit::get());

        let result = Token::join_whitelist(origin!(user_account), token_id, proof);

        assert_noop!(result, Error::<Test>::MerkleProofVerificationFailure);
    })
}

#[test]
fn join_whitelist_fails_with_insufficent_joy_balance_for_bloat_bond() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![user_account, other_user_account];
    let proof = merkle_proof!(0, [user_account, other_user_account]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(joy!(100))
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::join_whitelist(origin!(user_account), token_id, proof);

        assert_noop!(result, Error::<Test>::InsufficientBalanceForBloatBond);
    })
}

#[test]
fn join_whitelist_fails_in_permissionless_mode() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));
    let proof = merkle_proof!(0, [user_account, other_user_account]);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_account, bloat_bond + ExistentialDeposit::get());

        let result = Token::join_whitelist(origin!(user_account), token_id, proof);

        assert_noop!(
            result,
            Error::<Test>::CannotJoinWhitelistInPermissionlessMode,
        );
    })
}

#[test]
fn join_whitelist_ok() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![user_account, other_user_account];
    let proof = merkle_proof!(0, [user_account, other_user_account]);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_account, bloat_bond + ExistentialDeposit::get());

        let result = Token::join_whitelist(origin!(user_account), token_id, proof);

        assert_ok!(result);
    })
}

#[test]
fn join_whitelist_ok_with_bloat_bond_slashed_from_caller() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![user_account, other_user_account];
    let proof = merkle_proof!(0, [user_account, other_user_account]);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_account, bloat_bond + ExistentialDeposit::get());

        let _ = Token::join_whitelist(origin!(user_account), token_id, proof);

        assert_eq!(
            Balances::usable_balance(&user_account),
            ExistentialDeposit::get()
        );
    })
}

#[test]
fn join_whitelist_ok_with_bloat_bond_transferred_to_treasury() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![user_account, other_user_account];
    let proof = merkle_proof!(0, [user_account, other_user_account]);
    let (treasury, bloat_bond) = (Token::bloat_bond_treasury_account_id(), joy!(100));

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_account, bloat_bond + ExistentialDeposit::get());

        let _ = Token::join_whitelist(origin!(user_account), token_id, proof);

        assert_eq!(
            Balances::usable_balance(&treasury),
            ExistentialDeposit::get() + bloat_bond
        );
    })
}

#[test]
fn join_whitelist_ok_with_accounts_number_incremented() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![user_account, other_user_account];
    let proof = merkle_proof!(0, [user_account, other_user_account]);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_account, bloat_bond + ExistentialDeposit::get());

        let _ = Token::join_whitelist(origin!(user_account), token_id, proof);

        // 2 accounts: owner & user_account
        assert_eq!(Token::token_info_by_id(token_id).accounts_number, 2u64);
    })
}

#[test]
fn join_whitelist_ok_with_event_deposit() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![user_account, other_user_account];
    let proof = merkle_proof!(0, [user_account, other_user_account]);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_account, bloat_bond + ExistentialDeposit::get());

        let _ = Token::join_whitelist(origin!(user_account), token_id, proof);

        last_event_eq!(RawEvent::MemberJoinedWhitelist(
            token_id,
            user_account,
            Policy::Permissioned(commit)
        ));
    })
}

#[test]
fn join_whitelist_ok_with_new_account_correctly_created() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));
    let proof = merkle_proof!(0, [user_account, other_user_account]);
    let commit = merkle_root![user_account, other_user_account];
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_account, bloat_bond + ExistentialDeposit::get());

        let _ = Token::join_whitelist(origin!(user_account), token_id, proof);

        assert_ok!(
            Token::ensure_account_data_exists(token_id, &user_account),
            AccountData {
                free_balance: balance!(0),
                stacked_balance: balance!(0),
                bloat_bond,
            }
        );
    })
}

#[test]
fn dust_account_fails_with_invalid_token_id() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .with_account(user_account, AccountData::new_empty())
        .with_account(other_user_account, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(user_account), token_id + 1, user_account);

        assert_noop!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn dust_account_fails_with_invalid_account_id() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .with_account(user_account, AccountData::new_empty())
        .with_account(other_user_account, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(user_account), token_id, other_user_account + 1);

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn dust_account_fails_with_permissionless_mode_and_non_empty_non_owned_account() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .with_account(user_account, AccountData::new_empty())
        .with_account(
            other_user_account,
            AccountData::new_with_liquidity(balance!(10)).with_stacked(balance!(10)),
        )
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(user_account), token_id, other_user_account);

        assert_noop!(
            result,
            Error::<Test>::AttemptToRemoveNonOwnedAndNonEmptyAccount
        );
    })
}

#[test]
fn dust_account_fails_with_permissioned_mode_and_non_owned_account() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![user_account, other_user_account];

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .with_account(user_account, AccountData::new_empty())
        .with_account(other_user_account, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(user_account), token_id, other_user_account);

        assert_noop!(
            result,
            Error::<Test>::AttemptToRemoveNonOwnedAccountUnderPermissionedMode
        );
    })
}

#[test]
fn dust_account_ok_with_permissionless_mode_and_owned_account() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .with_account(
            user_account,
            AccountData::new_with_liquidity_and_bond(balance!(10), joy!(10))
                .with_stacked(balance!(5)),
        )
        .with_account(other_user_account, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(user_account), token_id, user_account);

        assert_ok!(result);
    })
}

#[test]
fn dust_account_ok_with_permissioned_mode_and_owned_account() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![user_account, other_user_account];

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .with_account(user_account, AccountData::new_with_liquidity(balance!(100)))
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(user_account), token_id, user_account);

        assert_ok!(result);
    })
}

#[test]
fn dust_account_ok_with_permissionless_mode_and_empty_non_owned_account() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .with_account(user_account, AccountData::new_empty())
        .with_account(other_user_account, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(user_account), token_id, other_user_account);

        assert_ok!(result);
    })
}

#[test]
fn dust_account_ok_with_event_deposit() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .with_account(user_account, AccountData::new_empty())
        .with_account(other_user_account, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::dust_account(origin!(user_account), token_id, other_user_account);

        last_event_eq!(RawEvent::AccountDustedBy(
            token_id,
            other_user_account,
            user_account,
            Policy::Permissionless
        ));
    })
}

#[test]
fn dust_account_ok_accounts_number_decremented() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .with_account(user_account, AccountData::new_empty())
        .with_account(other_user_account, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::dust_account(origin!(user_account), token_id, other_user_account);

        // 2 accounts left: owner & user_account
        assert_eq!(Token::token_info_by_id(token_id).accounts_number, 2u64)
    })
}

#[test]
fn dust_account_ok_with_account_removed() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .with_account(user_account, AccountData::new_empty())
        .with_account(other_user_account, AccountData::new_empty())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::dust_account(origin!(user_account), token_id, other_user_account);

        assert!(!<crate::AccountInfoByTokenAndAccount<Test>>::contains_key(
            token_id,
            other_user_account
        ));
    })
}

#[test]
fn dust_account_ok_with_correct_bloat_bond_refunded() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let treasury = Token::bloat_bond_treasury_account_id();
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));
    let (bloat_bond, updated_bloat_bond) = (joy!(100), joy!(150));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .with_bloat_bond(updated_bloat_bond)
        .with_account(user_account, AccountData::new_empty())
        .with_account(
            other_user_account,
            AccountData::new_with_liquidity_and_bond(balance!(0), bloat_bond),
        )
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&treasury, bloat_bond);

        let _ = Token::dust_account(origin!(user_account), token_id, other_user_account);

        assert_eq!(Balances::usable_balance(other_user_account), bloat_bond);
    })
}

#[test]
fn dust_account_ok_with_unregistered_member_doing_the_dusting() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let treasury = Token::bloat_bond_treasury_account_id();
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .with_bloat_bond(bloat_bond)
        .with_account(
            other_user_account,
            AccountData::new_with_liquidity_and_bond(balance!(0), bloat_bond),
        )
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&treasury, bloat_bond);

        let result = Token::dust_account(origin!(user_account), token_id, other_user_account);

        assert_ok!(result);
    })
}

#[test]
fn dust_account_ok_with_bloat_bond_slashed_from_treasury() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner, user_account, other_user_account) = (account!(1), account!(2), account!(3));
    let treasury = Token::bloat_bond_treasury_account_id();
    let (bloat_bond, updated_bloat_bond) = (joy!(100), joy!(150));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(updated_bloat_bond)
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .with_account(user_account, AccountData::new_empty())
        .with_account(
            other_user_account,
            AccountData::new_with_liquidity_and_bond(balance!(0), bloat_bond),
        )
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&treasury, bloat_bond);

        let _ = Token::dust_account(origin!(user_account), token_id, other_user_account);

        assert_eq!(
            Balances::usable_balance(&treasury),
            ExistentialDeposit::get()
        );
    })
}

#[test]
fn deissue_token_fails_with_non_existing_token_id() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::deissue_token(token_id + 1);
        assert_noop!(result, Error::<Test>::TokenDoesNotExist,);
    })
}

#[test]
fn deissue_token_fails_with_existing_accounts() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let owner = account!(1);

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::deissue_token(token_id);
        assert_noop!(
            result,
            Error::<Test>::CannotDeissueTokenWithOutstandingAccounts
        );
    })
}

#[test]
fn deissue_token_ok() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::deissue_token(token_id);
        assert_ok!(result);
    })
}

#[test]
fn deissue_token_with_event_deposit() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::deissue_token(token_id);
        last_event_eq!(RawEvent::TokenDeissued(token_id));
    })
}

#[test]
fn deissue_token_with_symbol_removed() {
    let token_id = token!(1);
    let token_data: TokenDataOf<Test> = TokenDataBuilder::new_empty().build();
    let symbol = token_data.symbol.clone();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::deissue_token(token_id);
        assert!(!<crate::SymbolsUsed<Test>>::contains_key(symbol));
    })
}

#[test]
fn deissue_token_with_token_info_removed() {
    let token_id = token!(1);
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::deissue_token(token_id);
        assert!(!<crate::TokenInfoById<Test>>::contains_key(&token_id));
    })
}

#[test]
fn issue_token_fails_with_existing_symbol() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let owner = account!(1);
    let sym = Hashing::hash_of(&"CRT".to_string());

    let token_data = TokenDataBuilder::new_empty().with_symbol(sym).build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .build();

    let params = TokenIssuanceParametersOf::<Test> {
        symbol: sym,
        ..Default::default()
    };

    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::issue_token(owner, params);

        assert_noop!(result, Error::<Test>::TokenSymbolAlreadyInUse);
    })
}

#[test]
fn issue_token_ok_owner_having_already_issued_a_token() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let owner = account!(1);

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner, init_supply)
        .build();

    let params = TokenIssuanceParametersOf::<Test> {
        symbol: Hashing::hash_of(&"CRT2".to_string()),
        ..Default::default()
    };

    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::issue_token(owner, params);

        assert_ok!(result);
    })
}

#[test]
fn issue_token_ok_with_token_id_increased() {
    let token_id = token!(1); // chainspec value for next_token_id
    let owner = account!(1);

    let config = GenesisConfigBuilder::new_empty().build();

    let params = TokenIssuanceParametersOf::<Test>::default();

    build_test_externalities(config).execute_with(|| {
        let _ =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::issue_token(owner, params);

        assert_eq!(Token::next_token_id(), token_id + 1);
    })
}

#[test]
fn issue_token_ok() {
    let owner = account!(1);

    let params = TokenIssuanceParametersOf::<Test>::default();
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let result =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::issue_token(owner, params);
        assert_ok!(result);
    })
}

#[test]
fn issue_token_ok_with_event_deposit() {
    let token_id = token!(1);
    let owner = account!(1);

    let params = TokenIssuanceParametersOf::<Test> {
        initial_supply: balance!(100),
        symbol: Hashing::hash_of(&token_id),
        transfer_policy: Policy::Permissionless,
        patronage_rate: YearlyRate(Permill::from_percent(1)),
    };

    let config = GenesisConfigBuilder::new_empty().build();

    let rate = BlockRate(Permill::from_rational_approximation(
        BlocksPerYear::get(),
        params
            .patronage_rate
            .0
            .saturating_reciprocal_mul(BlocksPerYear::get()),
    ));

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::issue_token(
            owner,
            params.clone(),
        );

        last_event_eq!(RawEvent::TokenIssued(
            token_id,
            TokenDataOf::<Test> {
                supply: params.initial_supply,
                offering_state: OfferingState::Idle,
                transfer_policy: params.transfer_policy,
                symbol: params.symbol,
                accounts_number: 0u64,
                patronage_info: PatronageData::<Balance, BlockNumber> {
                    last_unclaimed_patronage_tally_block: System::block_number(),
                    unclaimed_patronage_tally_amount: balance!(0),
                    rate,
                }
            },
            owner,
        ));
    })
}

#[test]
fn issue_token_ok_with_token_info_added() {
    let token_id = token!(1);
    let owner = account!(1);

    let params = TokenIssuanceParametersOf::<Test> {
        initial_supply: balance!(100),
        symbol: Hashing::hash_of(&token_id),
        transfer_policy: Policy::Permissionless,
        patronage_rate: yearly_rate!(10),
    };

    let rate = BlockRate(Permill::from_rational_approximation(
        BlocksPerYear::get(),
        params
            .patronage_rate
            .0
            .saturating_reciprocal_mul(BlocksPerYear::get()),
    ));

    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::issue_token(
            owner,
            params.clone(),
        );

        assert_eq!(
            <crate::TokenInfoById<Test>>::get(token_id),
            TokenDataOf::<Test> {
                supply: params.initial_supply,
                offering_state: OfferingState::Idle,
                transfer_policy: params.transfer_policy,
                symbol: params.symbol,
                accounts_number: 0u64,
                patronage_info: PatronageData::<Balance, BlockNumber> {
                    last_unclaimed_patronage_tally_block: System::block_number(),
                    unclaimed_patronage_tally_amount: balance!(0),
                    rate,
                }
            }
        );
    })
}

#[test]
fn issue_token_ok_with_symbol_added() {
    let token_id = token!(1);
    let owner = account!(1);

    let params = TokenIssuanceParametersOf::<Test> {
        symbol: Hashing::hash_of(&token_id),
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ = <Token as PalletToken<AccountId, Policy, IssuanceParams>>::issue_token(
            owner,
            params.clone(),
        );
        assert!(<crate::SymbolsUsed<Test>>::contains_key(&params.symbol));
    })
}

#[test]
fn issue_token_ok_with_owner_account_data_added_and_balance_equals_to_initial_supply() {
    let token_id = token!(1);
    let (owner, initial_supply) = (account!(1), balance!(100));

    let params = TokenIssuanceParametersOf::<Test> {
        symbol: Hashing::hash_of(&token_id),
        initial_supply,
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ =
            <Token as PalletToken<AccountId, Policy, IssuanceParams>>::issue_token(owner, params);
        assert_ok!(
            Token::ensure_account_data_exists(token_id, &owner),
            AccountData::new_with_liquidity(initial_supply)
        );
    })
}
