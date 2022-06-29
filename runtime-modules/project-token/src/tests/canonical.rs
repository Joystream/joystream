#![cfg(test)]
use frame_support::{assert_noop, assert_ok, StorageDoubleMap, StorageMap};
use sp_runtime::{traits::Hash, Permill, Perquintill};

use crate::tests::fixtures::default_upload_context;
use crate::tests::mock::*;
use crate::tests::test_utils::{default_vesting_schedule, TokenDataBuilder};
use crate::traits::PalletToken;
use crate::types::{
    BlockRate, Joy, MerkleProofOf, PatronageData, RevenueSplitState, TokenIssuanceParametersOf,
    VestingSource, YearlyRate,
};
use crate::{
    account, assert_approx_eq, balance, block, joy, last_event_eq, member, merkle_proof,
    merkle_root, origin, token, yearly_rate, Config, Error, RawEvent, TokenDataOf,
};
use frame_support::traits::Currency;
use sp_runtime::DispatchError;

#[test]
fn join_whitelist_fails_with_token_id_not_valid() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));
    let commit = merkle_root![user_id, other_user_id];
    let proof = merkle_proof!(0, [user_id, other_user_id]);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_acc, bloat_bond + ExistentialDeposit::get());

        let result = Token::join_whitelist(origin!(user_acc), user_id, token_id + 1, proof);

        assert_noop!(result, Error::<Test>::TokenDoesNotExist,);
    })
}

#[test]
fn join_whitelist_fails_with_existing_account() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));
    let commit = merkle_root![user_id, other_user_id];
    let proof = merkle_proof!(0, [user_id, other_user_id]);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .with_account(user_id, AccountData::default())
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_acc, bloat_bond + ExistentialDeposit::get());

        let result = Token::join_whitelist(origin!(user_acc), user_id, token_id, proof);

        assert_noop!(result, Error::<Test>::AccountAlreadyExists,);
    })
}

#[test]
fn join_whitelist_fails_with_invalid_member_controller() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, _), (other_user_id, other_user_acc)) =
        (member!(1), member!(2), member!(3));
    let commit = merkle_root![user_id, other_user_id];
    let proof = merkle_proof!(0, [user_id, other_user_id]);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&other_user_acc, bloat_bond + ExistentialDeposit::get());

        let result = Token::join_whitelist(origin!(other_user_acc), user_id, token_id, proof);

        assert_noop!(
            result,
            DispatchError::Other("origin signer not a member controller account")
        );
    })
}

#[test]
fn join_whitelist_fails_with_invalid_proof() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));
    let commit = merkle_root![user_id, other_user_id];
    let proof = merkle_proof!(0, [user_id, user_id]);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_acc, bloat_bond + ExistentialDeposit::get());

        let result = Token::join_whitelist(origin!(user_acc), user_id, token_id, proof);

        assert_noop!(result, Error::<Test>::MerkleProofVerificationFailure);
    })
}

#[test]
fn join_whitelist_fails_with_insufficent_joy_balance_for_bloat_bond() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));
    let commit = merkle_root![user_id, other_user_id];
    let proof = merkle_proof!(0, [user_id, other_user_id]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(joy!(100))
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::join_whitelist(origin!(user_acc), user_id, token_id, proof);

        assert_noop!(result, Error::<Test>::InsufficientJoyBalance);
    })
}

#[test]
fn join_whitelist_fails_in_permissionless_mode() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));
    let proof = merkle_proof!(0, [user_id, other_user_id]);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_acc, bloat_bond + ExistentialDeposit::get());

        let result = Token::join_whitelist(origin!(user_acc), user_id, token_id, proof);

        assert_noop!(
            result,
            Error::<Test>::CannotJoinWhitelistInPermissionlessMode,
        );
    })
}

#[test]
fn join_whitelist_ok() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));
    let commit = merkle_root![user_id, other_user_id];
    let proof = merkle_proof!(0, [user_id, other_user_id]);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_acc, bloat_bond + ExistentialDeposit::get());

        let result = Token::join_whitelist(origin!(user_acc), user_id, token_id, proof);

        assert_ok!(result);
    })
}

#[test]
fn join_whitelist_ok_with_bloat_bond_slashed_from_caller() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));
    let commit = merkle_root![user_id, other_user_id];
    let proof = merkle_proof!(0, [user_id, other_user_id]);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_acc, bloat_bond + ExistentialDeposit::get());

        let _ = Token::join_whitelist(origin!(user_acc), user_id, token_id, proof);

        assert_eq!(
            Balances::usable_balance(&user_acc),
            ExistentialDeposit::get()
        );
    })
}

#[test]
fn join_whitelist_ok_with_bloat_bond_transferred_to_treasury() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));
    let commit = merkle_root![user_id, other_user_id];
    let proof = merkle_proof!(0, [user_id, other_user_id]);
    let (treasury, bloat_bond) = (Token::module_treasury_account(), joy!(100));

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_acc, bloat_bond + ExistentialDeposit::get());

        let _ = Token::join_whitelist(origin!(user_acc), user_id, token_id, proof);

        assert_eq!(
            Balances::usable_balance(&treasury),
            ExistentialDeposit::get() + bloat_bond
        );
    })
}

#[test]
fn join_whitelist_ok_with_accounts_number_incremented() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));
    let commit = merkle_root![user_id, other_user_id];
    let proof = merkle_proof!(0, [user_id, other_user_id]);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_acc, bloat_bond + ExistentialDeposit::get());

        let _ = Token::join_whitelist(origin!(user_acc), user_id, token_id, proof);

        // 2 accounts: owner & user_account
        assert_eq!(Token::token_info_by_id(token_id).accounts_number, 2u64);
    })
}

#[test]
fn join_whitelist_ok_with_event_deposit() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));
    let commit = merkle_root![user_id, other_user_id];
    let proof = merkle_proof!(0, [user_id, other_user_id]);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_acc, bloat_bond + ExistentialDeposit::get());

        let _ = Token::join_whitelist(origin!(user_acc), user_id, token_id, proof);

        last_event_eq!(RawEvent::MemberJoinedWhitelist(
            token_id,
            user_id,
            Policy::Permissioned(commit)
        ));
    })
}

#[test]
fn join_whitelist_ok_with_new_account_correctly_created() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));
    let proof = merkle_proof!(0, [user_id, other_user_id]);
    let commit = merkle_root![user_id, other_user_id];
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&user_acc, bloat_bond + ExistentialDeposit::get());

        let _ = Token::join_whitelist(origin!(user_acc), user_id, token_id, proof);

        assert_ok!(
            Token::ensure_account_data_exists(token_id, &user_id),
            AccountData {
                bloat_bond,
                ..AccountData::default()
            }
        );
    })
}

#[test]
fn dust_account_fails_with_invalid_token_id() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .with_account(user_id, AccountData::default())
        .with_account(other_user_id, AccountData::default())
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(user_acc), token_id + 1, user_id);

        assert_noop!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn dust_account_fails_with_invalid_member_id() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .with_account(user_id, AccountData::default())
        .with_account(other_user_id, AccountData::default())
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(user_acc), token_id, other_user_id + 1);

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn dust_account_fails_with_permissionless_mode_and_non_empty_account() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc)) = (member!(1), member!(2));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .with_account(user_id, AccountData::new_with_amount(balance!(10)))
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(user_acc), token_id, user_id);

        assert_noop!(result, Error::<Test>::AttemptToRemoveNonEmptyAccount);
    })
}

#[test]
fn dust_account_fails_with_permissioned_mode_and_non_owned_account() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));
    let commit = merkle_root![user_id, other_user_id];

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .with_account(user_id, AccountData::default())
        .with_account(other_user_id, AccountData::default())
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(user_acc), token_id, other_user_id);

        assert_noop!(
            result,
            Error::<Test>::AttemptToRemoveNonOwnedAccountUnderPermissionedMode
        );
    })
}

#[test]
fn dust_account_ok_with_permissioned_mode_and_empty_owned_account() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));
    let commit = merkle_root![user_id, other_user_id];

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .with_account(user_id, AccountData::default())
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(user_acc), token_id, user_id);

        assert_ok!(result);
    })
}

#[test]
fn dust_account_ok_with_permissionless_mode_and_empty_non_owned_account() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .with_account(user_id, AccountData::default())
        .with_account(other_user_id, AccountData::default())
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(user_acc), token_id, other_user_id);

        assert_ok!(result);
    })
}

#[test]
fn dust_account_ok_with_event_deposit() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .with_account(user_id, AccountData::default())
        .with_account(other_user_id, AccountData::default())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::dust_account(origin!(user_acc), token_id, other_user_id);

        last_event_eq!(RawEvent::AccountDustedBy(
            token_id,
            other_user_id,
            user_acc,
            Policy::Permissionless
        ));
    })
}

#[test]
fn dust_account_ok_accounts_number_decremented() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .with_account(user_id, AccountData::default())
        .with_account(other_user_id, AccountData::default())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::dust_account(origin!(user_acc), token_id, other_user_id);

        // 2 accounts left: owner & user_account
        assert_eq!(Token::token_info_by_id(token_id).accounts_number, 2u64)
    })
}

#[test]
fn dust_account_ok_with_account_removed() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .with_account(user_id, AccountData::default())
        .with_account(other_user_id, AccountData::default())
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::dust_account(origin!(user_acc), token_id, other_user_id);

        assert!(!<crate::AccountInfoByTokenAndMember<Test>>::contains_key(
            token_id,
            other_user_id
        ));
    })
}

#[test]
fn dust_account_ok_by_user_with_correct_bloat_bond_refunded() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let treasury = Token::module_treasury_account();
    let ((owner_id, _), (user_id, user_acc), (other_user_id, other_user_acc)) =
        (member!(1), member!(2), member!(3));
    let (bloat_bond, updated_bloat_bond) = (joy!(100), joy!(150));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .with_bloat_bond(updated_bloat_bond)
        .with_account(user_id, AccountData::default())
        .with_account(
            other_user_id,
            AccountData::new_with_amount_and_bond(balance!(0), bloat_bond),
        )
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&treasury, bloat_bond);

        let _ = Token::dust_account(origin!(user_acc), token_id, other_user_id);

        assert_eq!(Balances::usable_balance(other_user_acc), bloat_bond);
    })
}

#[test]
fn dust_account_ok_with_unregistered_member_doing_the_dusting() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let treasury = Token::module_treasury_account();
    let ((owner_id, _), (other_user_id, _)) = (member!(1), member!(2));
    let user_acc = account!(99999);
    let bloat_bond = joy!(100);

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .with_bloat_bond(bloat_bond)
        .with_account(
            other_user_id,
            AccountData::new_with_amount_and_bond(balance!(0), bloat_bond),
        )
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&treasury, bloat_bond);

        let result = Token::dust_account(origin!(user_acc), token_id, other_user_id);

        assert_ok!(result);
    })
}

#[test]
fn dust_account_ok_with_bloat_bond_slashed_from_treasury() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let ((owner_id, _), (user_id, user_acc), (other_user_id, _)) =
        (member!(1), member!(2), member!(3));
    let treasury = Token::module_treasury_account();
    let (bloat_bond, updated_bloat_bond) = (joy!(100), joy!(150));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(updated_bloat_bond)
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .with_account(user_id, AccountData::default())
        .with_account(
            other_user_id,
            AccountData::new_with_amount_and_bond(balance!(0), bloat_bond),
        )
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&treasury, bloat_bond);

        let _ = Token::dust_account(origin!(user_acc), token_id, other_user_id);

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
        let result = Token::deissue_token(token_id + 1);
        assert_noop!(result, Error::<Test>::TokenDoesNotExist,);
    })
}

#[test]
fn deissue_token_fails_with_existing_accounts() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner_id, _) = member!(1);

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::deissue_token(token_id);
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
        let result = Token::deissue_token(token_id);
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
        let _ = Token::deissue_token(token_id);
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
        let _ = Token::deissue_token(token_id);
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
        let _ = Token::deissue_token(token_id);
        assert!(!<crate::TokenInfoById<Test>>::contains_key(&token_id));
    })
}

#[test]
fn issue_token_fails_with_existing_symbol() {
    let (token_id, init_supply) = (token!(1), balance!(100));
    let (owner_id, owner_acc) = member!(1);
    let sym = Hashing::hash_of(&"CRT".to_string());

    let token_data = TokenDataBuilder::new_empty().with_symbol(sym).build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token_and_owner(token_id, token_data, owner_id, init_supply)
        .build();

    let params = TokenIssuanceParametersOf::<Test> {
        symbol: sym,
        ..Default::default()
    };

    build_test_externalities(config).execute_with(|| {
        let result = Token::issue_token(owner_acc, params, default_upload_context());

        assert_noop!(result, Error::<Test>::TokenSymbolAlreadyInUse);
    })
}

#[test]
fn issue_token_fails_with_insufficient_balance_for_bloat_bond() {
    let token_id = token!(1);
    let ((owner_id, owner_acc), mem1, mem2) = (member!(1), member!(2).0, member!(3).0);
    let bloat_bond = joy!(100);

    let params = TokenIssuanceParametersOf::<Test> {
        symbol: Hashing::hash_of(&token_id),
        ..Default::default()
    }
    .with_allocation(&owner_id, 0, None)
    .with_allocation(&mem1, 0, None)
    .with_allocation(&mem2, 0, None);

    let required_joy_balance: JoyBalance = <Test as crate::Config>::JoyExistentialDeposit::get()
        .saturating_add(bloat_bond.saturating_mul(3u32.into()));

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Joy::<Test>::deposit_creating(&owner_acc, required_joy_balance.saturating_sub(1));
        let result = Token::issue_token(owner_acc, params.clone(), default_upload_context());
        assert_noop!(result, Error::<Test>::InsufficientJoyBalance);
    })
}

#[test]
fn issue_token_ok_with_bloat_bond_transferred() {
    let token_id = token!(1);
    let ((owner_id, owner_acc), mem1, mem2) = (member!(1), member!(2).0, member!(3).0);
    let (treasury, bloat_bond) = (Token::module_treasury_account(), joy!(100));

    let params = TokenIssuanceParametersOf::<Test> {
        symbol: Hashing::hash_of(&token_id),
        ..Default::default()
    }
    .with_allocation(&owner_id, 0, None)
    .with_allocation(&mem1, 0, None)
    .with_allocation(&mem2, 0, None);

    let required_joy_balance: JoyBalance = <Test as crate::Config>::JoyExistentialDeposit::get()
        .saturating_add(bloat_bond.saturating_mul(3u32.into()));

    let config = GenesisConfigBuilder::new_empty()
        .with_bloat_bond(bloat_bond)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&owner_acc, required_joy_balance);

        let _ = Token::issue_token(owner_acc, params.clone(), default_upload_context());

        assert_eq!(Balances::usable_balance(treasury), required_joy_balance);
        assert_eq!(
            Balances::usable_balance(owner_acc),
            ExistentialDeposit::get()
        );
    })
}

#[test]
fn issue_token_ok_owner_having_already_issued_a_token() {
    let init_supply = balance!(100);
    let (owner_id, owner_acc) = member!(1);

    let config = GenesisConfigBuilder::new_empty().build();

    let params1 = TokenIssuanceParametersOf::<Test> {
        symbol: Hashing::hash_of(&"CRT1".to_string()),
        ..Default::default()
    }
    .with_allocation(&owner_id, init_supply, None);

    let params2 = TokenIssuanceParametersOf::<Test> {
        symbol: Hashing::hash_of(&"CRT2".to_string()),
        ..params1.clone()
    };

    build_test_externalities(config).execute_with(|| {
        let result1 = Token::issue_token(owner_acc, params1, default_upload_context());
        let result2 = Token::issue_token(owner_acc, params2, default_upload_context());

        assert_ok!(result1);
        assert_ok!(result2);
    })
}

#[test]
fn issue_token_ok_with_token_id_increased() {
    let token_id = token!(1); // chainspec value for next_token_id
    let (_, owner_acc) = member!(1);

    let config = GenesisConfigBuilder::new_empty().build();

    let params = TokenIssuanceParametersOf::<Test>::default();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::issue_token(owner_acc, params, default_upload_context());

        assert_eq!(Token::next_token_id(), token_id + 1);
    })
}

#[test]
fn issue_token_ok() {
    let params = TokenIssuanceParametersOf::<Test>::default();
    let config = GenesisConfigBuilder::new_empty().build();
    let (_, owner_acc) = member!(1);

    build_test_externalities(config).execute_with(|| {
        let result = Token::issue_token(owner_acc, params, default_upload_context());
        assert_ok!(result);
    })
}

#[test]
fn issue_token_ok_with_event_deposit() {
    let token_id = token!(1);
    let (owner_id, owner_acc) = member!(1);

    let params = TokenIssuanceParametersOf::<Test> {
        symbol: Hashing::hash_of(&token_id),
        transfer_policy: TransferPolicyParams::Permissionless,
        patronage_rate: yearly_rate!(1),
        ..Default::default()
    }
    .with_allocation(&owner_id, balance!(100), None);

    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::issue_token(owner_acc, params.clone(), default_upload_context());
        last_event_eq!(RawEvent::TokenIssued(token_id, params.clone()));
    })
}

#[test]
fn issue_token_ok_with_token_info_added() {
    let token_id = token!(1);
    let ((owner_id, owner_acc), mem1, mem2) = (member!(1), member!(2).0, member!(3).0);
    let (owner_balance, mem1_balance, mem2_balance) = (balance!(100), balance!(200), balance!(300));
    let initial_supply = owner_balance + mem1_balance + mem2_balance;
    let non_owner_vesting = VestingScheduleParams {
        blocks_before_cliff: block!(100),
        cliff_amount_percentage: Permill::from_percent(50),
        linear_vesting_duration: block!(100),
    };

    let params = TokenIssuanceParametersOf::<Test> {
        symbol: Hashing::hash_of(&token_id),
        transfer_policy: TransferPolicyParams::Permissionless,
        patronage_rate: yearly_rate!(10),
        revenue_split_rate: DEFAULT_SPLIT_ALLOCATION_RATE,
        ..Default::default()
    }
    .with_allocation(&owner_id, owner_balance, None)
    .with_allocation(&mem1, mem1_balance, Some(non_owner_vesting.clone()))
    .with_allocation(&mem2, mem2_balance, Some(non_owner_vesting.clone()));

    let rate = BlockRate::from_yearly_rate(params.patronage_rate, BlocksPerYear::get());

    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::issue_token(owner_acc, params.clone(), default_upload_context());

        assert_eq!(
            <crate::TokenInfoById<Test>>::get(token_id),
            TokenDataOf::<Test> {
                tokens_issued: initial_supply,
                total_supply: initial_supply,
                transfer_policy: params.transfer_policy.into(),
                symbol: params.symbol,
                accounts_number: 3u64, // owner account + acc1 + acc2
                patronage_info: PatronageData::<Balance, BlockNumber> {
                    last_unclaimed_patronage_tally_block: System::block_number(),
                    unclaimed_patronage_tally_amount: balance!(0),
                    rate,
                },
                sale: None,
                next_sale_id: 0,
                next_revenue_split_id: 0,
                revenue_split: RevenueSplitState::Inactive,
                revenue_split_rate: DEFAULT_SPLIT_ALLOCATION_RATE,
            }
        );
    })
}

#[test]
fn issue_token_ok_with_correct_patronage_rate_approximated() {
    let token_id = token!(1);
    let (owner_id, owner_acc) = member!(1);
    let supply = balance!(100);

    let params = TokenIssuanceParametersOf::<Test> {
        symbol: Hashing::hash_of(&token_id),
        transfer_policy: TransferPolicyParams::Permissionless,
        patronage_rate: YearlyRate(Permill::from_perthousand(105)), // 10.5%
        ..Default::default()
    }
    .with_allocation(&owner_id, supply, None);

    // rate = floor(.105 / blocks_per_year * 1e18) per quintill = 19963924238 per quintill
    let expected = BlockRate(Perquintill::from_parts(19963924238));

    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::issue_token(owner_acc, params.clone(), default_upload_context());

        let actual = <crate::TokenInfoById<Test>>::get(token_id)
            .patronage_info
            .rate;

        assert_approx_eq!(actual.0.deconstruct(), expected.0.deconstruct(), 1u64);
    })
}

#[test]
fn issue_token_ok_with_symbol_added() {
    let token_id = token!(1);
    let (_, owner_acc) = member!(1);

    let params = TokenIssuanceParametersOf::<Test> {
        symbol: Hashing::hash_of(&token_id),
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::issue_token(owner_acc, params.clone(), default_upload_context());
        assert!(<crate::SymbolsUsed<Test>>::contains_key(&params.symbol));
    })
}

#[test]
fn issue_token_ok_with_owner_accounts_data_added() {
    let token_id = token!(1);
    let ((owner_id, owner_acc), mem1, mem2) = (member!(1), member!(2).0, member!(3).0);
    let (owner_balance, mem1_balance, mem2_balance) = (balance!(100), balance!(200), balance!(300));
    let non_owner_vesting = VestingScheduleParams {
        blocks_before_cliff: block!(100),
        cliff_amount_percentage: Permill::from_percent(50),
        linear_vesting_duration: block!(100),
    };

    let params = TokenIssuanceParametersOf::<Test> {
        symbol: Hashing::hash_of(&token_id),
        ..Default::default()
    }
    .with_allocation(&owner_id, owner_balance, None)
    .with_allocation(&mem1, mem1_balance, Some(non_owner_vesting.clone()))
    .with_allocation(&mem2, mem2_balance, Some(non_owner_vesting.clone()));

    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::issue_token(owner_acc, params, default_upload_context());
        assert_ok!(
            Token::ensure_account_data_exists(token_id, &owner_id),
            AccountData::new_with_amount(owner_balance)
        );
        assert_ok!(
            Token::ensure_account_data_exists(token_id, &mem1),
            AccountData::new_with_vesting_and_bond(
                VestingSource::InitialIssuance,
                VestingSchedule::from_params(
                    System::block_number(),
                    mem1_balance,
                    non_owner_vesting.clone()
                ),
                0
            )
        );
        assert_ok!(
            Token::ensure_account_data_exists(token_id, &mem2),
            AccountData::new_with_vesting_and_bond(
                VestingSource::InitialIssuance,
                VestingSchedule::from_params(
                    System::block_number(),
                    mem2_balance,
                    non_owner_vesting.clone()
                ),
                0
            )
        );
    })
}

#[test]
fn burn_fails_with_invalid_token_id() {
    let (token_id, burn_amount, (member_id, account)) = (token!(1), balance!(100), member!(1));
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(member_id, AccountData::new_with_amount(burn_amount))
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::burn(origin!(account), token_id + 1, member_id, burn_amount);

        assert_noop!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn burn_fails_with_non_existing_account() {
    let (token_id, burn_amount, (member_id, account)) = (token!(1), balance!(100), member!(1));
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::burn(origin!(account), token_id, member_id, burn_amount);

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn burn_fails_with_invalid_member_controller_account() {
    let (token_id, burn_amount, member_id, invalid_controller_account) =
        (token!(1), balance!(100), member!(1).0, member!(2).1);
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(member_id, AccountData::new_with_amount(burn_amount))
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::burn(
            origin!(invalid_controller_account),
            token_id,
            member_id,
            burn_amount,
        );

        assert_noop!(
            result,
            DispatchError::Other("origin signer not a member controller account")
        );
    })
}

#[test]
fn burn_fails_with_zero_amount() {
    let (token_id, burn_amount, (member_id, account)) = (token!(1), balance!(0), member!(1));
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(member_id, AccountData::new_with_amount(100))
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::burn(origin!(account), token_id, member_id, burn_amount);

        assert_noop!(result, Error::<Test>::BurnAmountIsZero);
    })
}

#[test]
fn burn_fails_with_amount_exceeding_account_tokens() {
    let (token_id, burn_amount, (member_id, account)) = (token!(1), balance!(100), member!(1));
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(member_id, AccountData::new_with_amount(burn_amount - 1))
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::burn(origin!(account), token_id, member_id, burn_amount);

        assert_noop!(
            result,
            Error::<Test>::BurnAmountGreaterThanAccountTokensAmount
        );
    })
}

#[test]
fn burn_fails_with_active_revenue_split() {
    let (
        token_id,
        split_allocation_amount,
        burn_amount,
        split_allocation_src,
        (member_id, account),
    ) = (
        token!(1),
        joy!(100),
        balance!(100),
        member!(1).0,
        member!(2),
    );
    let token_data = TokenDataBuilder::new_empty()
        .with_split_rate(DEFAULT_SPLIT_ALLOCATION_RATE)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(member_id, AccountData::new_with_amount(burn_amount))
        .build();

    build_test_externalities_with_balances(
        config,
        vec![(
            split_allocation_src,
            <Test as Config>::JoyExistentialDeposit::get() + split_allocation_amount,
        )],
    )
    .execute_with(|| {
        assert_ok!(Token::issue_revenue_split(
            token_id,
            Some(100),
            100,
            split_allocation_src,
            split_allocation_amount
        ));
        let result = Token::burn(origin!(account), token_id, member_id, burn_amount);

        assert_noop!(
            result,
            Error::<Test>::CannotModifySupplyWhenRevenueSplitsAreActive
        );
    })
}

#[test]
fn burn_ok() {
    let (token_id, burn_amount, (member_id, account)) = (token!(1), balance!(100), member!(1));
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(member_id, AccountData::new_with_amount(burn_amount))
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::burn(origin!(account), token_id, member_id, burn_amount);

        assert_ok!(result);
    })
}

#[test]
fn burn_ok_with_account_tokens_amount_decreased() {
    let (token_id, burn_amount, (member_id, account)) = (token!(1), balance!(100), member!(1));
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(member_id, AccountData::new_with_amount(burn_amount))
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::burn(origin!(account), token_id, member_id, burn_amount);

        assert_ok!(result);
        let acc_data = Token::ensure_account_data_exists(token_id, &member_id).unwrap();
        assert_eq!(acc_data.amount, 0);
    })
}

#[test]
fn burn_ok_with_token_supply_decreased() {
    let (token_id, burn_amount, (member_id, account)) = (token!(1), balance!(100), member!(1));
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(member_id, AccountData::new_with_amount(burn_amount))
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::burn(origin!(account), token_id, member_id, burn_amount);

        assert_ok!(result);
        let token_data = Token::ensure_token_exists(token_id).unwrap();
        assert_eq!(token_data.tokens_issued, burn_amount);
        assert_eq!(token_data.total_supply, 0);
    })
}

#[test]
fn burn_ok_with_staked_tokens_burned() {
    let (token_id, (member_id, account)) = (token!(1), member!(1));
    let token_data = TokenDataBuilder::new_empty().build();
    let init_account_data = AccountData::new_with_amount(200).with_staked(100);

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(member_id, init_account_data)
        .build();

    build_test_externalities(config).execute_with(|| {
        // Burn staked tokens partially
        assert_ok!(Token::burn(origin!(account), token_id, member_id, 50));
        let account_data = Token::ensure_account_data_exists(token_id, &member_id).unwrap();
        assert_eq!(account_data.staked(), 50);
        assert_eq!(account_data.transferrable::<Test>(1), 100);

        // Burn an amount greater than staked tokens amount
        assert_ok!(Token::burn(origin!(account), token_id, member_id, 100));
        let account_data = Token::ensure_account_data_exists(token_id, &member_id).unwrap();
        assert_eq!(account_data.staked(), 0);
        assert!(account_data.split_staking_status.is_some());
        assert_eq!(account_data.transferrable::<Test>(1), 50);
    })
}

#[test]
fn burn_ok_with_vesting_and_staked_tokens_burned_first() {
    let vesting_schedule = default_vesting_schedule();
    let init_vesting_amount = vesting_schedule
        .total_amount()
        .saturating_mul(<Test as Config>::MaxVestingBalancesPerAccountPerToken::get().into());
    let init_staked_amount = init_vesting_amount + 300;
    let account_data = AccountData::new_with_amount(1000)
        .with_max_vesting_schedules(vesting_schedule.clone())
        .with_staked(init_staked_amount);
    let (token_id, burn_amount, (member_id, account)) = (token!(1), init_staked_amount, member!(1));
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(member_id, account_data)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::burn(origin!(account), token_id, member_id, burn_amount);

        assert_ok!(result);
        let acc_data = Token::ensure_account_data_exists(token_id, &member_id).unwrap();
        assert_eq!(acc_data.amount, 700);
        assert_eq!(acc_data.transferrable::<Test>(1), 700);
        assert_eq!(acc_data.vesting_schedules.len(), 0);
        assert_eq!(acc_data.staked(), 0);
    })
}

#[test]
fn burn_ok_with_vesting_and_staked_tokens_partially_burned() {
    let vesting_schedule = default_vesting_schedule();
    let account_data = AccountData::default()
        .with_max_vesting_schedules(vesting_schedule)
        .with_staked(2000);
    let initial_account_amount = account_data.amount;
    let initial_vesting_schedules = account_data.vesting_schedules.len();
    let (token_id, burn_amount, (member_id, account)) = (token!(1), balance!(1400), member!(1));
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(member_id, account_data)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::burn(origin!(account), token_id, member_id, burn_amount);

        assert_ok!(result);
        let acc_data = Token::ensure_account_data_exists(token_id, &member_id).unwrap();
        assert_eq!(acc_data.amount, initial_account_amount - burn_amount);
        assert_eq!(acc_data.staked(), 600);
        assert_eq!(acc_data.transferrable::<Test>(1), 0);
        assert_eq!(
            acc_data.vesting_schedules.len(),
            initial_vesting_schedules - 1
        );
        let first_vesting_schedule = acc_data.vesting_schedules.iter().next().unwrap().1;
        assert_eq!(first_vesting_schedule.burned_amount, 400);
        assert_eq!(first_vesting_schedule.locks::<Test>(1), 600);
        assert_eq!(first_vesting_schedule.non_burned_amount(), 600);
    })
}

#[test]
fn burn_ok_with_vesting_schedule_partially_burned_twice() {
    let vesting_schedule = default_vesting_schedule();
    let account_data = AccountData::default().with_vesting_schedule(vesting_schedule);
    let initial_account_amount = account_data.amount;
    let (token_id, burn1_amount, burn2_amount, (member_id, account)) =
        (token!(1), balance!(100), balance!(200), member!(1));
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(member_id, account_data)
        .build();

    build_test_externalities(config).execute_with(|| {
        assert_ok!(Token::burn(
            origin!(account),
            token_id,
            member_id,
            burn1_amount
        ));
        assert_ok!(Token::burn(
            origin!(account),
            token_id,
            member_id,
            burn2_amount
        ));

        let acc_data = Token::ensure_account_data_exists(token_id, &member_id).unwrap();
        assert_eq!(
            acc_data.amount,
            initial_account_amount - burn1_amount - burn2_amount
        );
        assert_eq!(acc_data.vesting_schedules.len(), 1);
        let first_vesting_schedule = acc_data.vesting_schedules.iter().next().unwrap().1;
        assert_eq!(
            first_vesting_schedule.burned_amount,
            burn1_amount + burn2_amount
        );
        assert_eq!(
            first_vesting_schedule.locks::<Test>(1),
            1000 - burn1_amount - burn2_amount
        );
        assert_eq!(
            first_vesting_schedule.non_burned_amount(),
            1000 - burn1_amount - burn2_amount
        );
    })
}

#[test]
fn burn_ok_with_partially_burned_vesting_schedule_amounts_working_as_expected() {
    let vesting_schedule = default_vesting_schedule();
    let vesting_schedule_end_block =
        vesting_schedule.linear_vesting_start_block + vesting_schedule.linear_vesting_duration;
    let account_data = AccountData::default().with_vesting_schedule(vesting_schedule.clone());
    let (token_id, (member_id, account)) = (token!(1), member!(1));
    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(member_id, account_data)
        .build();

    build_test_externalities(config).execute_with(|| {
        // Burn 300 tokens and re-fetch account_data
        assert_ok!(Token::burn(origin!(account), token_id, member_id, 300));
        let account_data = Token::ensure_account_data_exists(token_id, &member_id).unwrap();
        // Expect transferrable amount at linear_vesting_start_block still equal to 300 (`cliff_amount`)
        assert_eq!(
            account_data.transferrable::<Test>(vesting_schedule.linear_vesting_start_block),
            300
        );
        // Expect linear vesting rate to still be 1 token / block
        assert_eq!(
            account_data.transferrable::<Test>(vesting_schedule.linear_vesting_start_block + 100),
            300 + 100
        );
        // Expect transferrable balance to be 700:
        // - at `linear_vesting_start_block` + 400
        assert_eq!(
            account_data.transferrable::<Test>(vesting_schedule.linear_vesting_start_block + 400),
            700
        );
        // - right at the original's vesting end_block
        assert_eq!(
            account_data.transferrable::<Test>(vesting_schedule_end_block),
            700
        );
        // - after the original's vesting `end_block`
        assert_eq!(
            account_data.transferrable::<Test>(vesting_schedule_end_block + 1),
            700
        );

        // Go to a block where 400 tokens are already vested
        System::set_block_number(vesting_schedule.linear_vesting_start_block + 100);
        // Burn another 200 tokens and re-fetch account_data
        assert_ok!(Token::burn(origin!(account), token_id, member_id, 200));
        let account_data = Token::ensure_account_data_exists(token_id, &member_id).unwrap();
        // Expect transferrable balance at current block to still be 400
        assert_eq!(
            account_data.transferrable::<Test>(System::block_number()),
            400
        );
        // Expect transferrable balance after 100 blocks to be 450 (1 token / block rate preserved)
        assert_eq!(
            account_data.transferrable::<Test>(System::block_number() + 50),
            450
        );
        // Expect transferrable balance to be 500:
        // after 100 blocks
        assert_eq!(
            account_data.transferrable::<Test>(System::block_number() + 100),
            500
        );
        // right at the original vesting's `end_block`
        assert_eq!(
            account_data.transferrable::<Test>(vesting_schedule_end_block),
            500
        );
        // after the original vesting's `end_block`
        assert_eq!(
            account_data.transferrable::<Test>(vesting_schedule_end_block + 1),
            500
        );

        // Burn another 200 tokens and re-fetch account_data
        assert_ok!(Token::burn(origin!(account), token_id, member_id, 200));
        let account_data = Token::ensure_account_data_exists(token_id, &member_id).unwrap();
        // expect vesting schedule to be gone
        assert_eq!(account_data.vesting_schedules.len(), 0);
        // expect transferrable balance at current block to be 300
        assert_eq!(
            account_data.transferrable::<Test>(System::block_number()),
            300
        );
    })
}
