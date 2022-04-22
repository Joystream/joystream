#![cfg(test)]

use crate::tests::mock::*;
use crate::tests::test_utils::TokenDataBuilder;
use crate::traits::PalletToken;
use crate::types::{MerkleProofOf, PatronageData, TokenIssuanceParametersOf};
use crate::{
    account, balance, last_event_eq, merkle_proof, merkle_root, origin, token, Error, RawEvent,
    TokenDataOf,
};
use frame_support::{assert_noop, assert_ok, StorageDoubleMap, StorageMap};
use sp_runtime::traits::Hash;
use sp_std::collections::btree_map::BTreeMap;

#[test]
fn join_whitelist_fails_with_token_id_not_valid() {
    let token_id = token!(1);
    let (owner, acc1, acc2) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![acc1, acc2];
    let proof = merkle_proof!(0, [acc1, acc2]);
    let bloat_bond = balance!(DEFAULT_BLOAT_BOND);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&acc1, bloat_bond);

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
    let bloat_bond = balance!(DEFAULT_BLOAT_BOND);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0)
        .with_account(acc1, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&acc1, bloat_bond);

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
    let bloat_bond = balance!(DEFAULT_BLOAT_BOND);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&acc1, bloat_bond);

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
    let bloat_bond = balance!(DEFAULT_BLOAT_BOND);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&acc1, bloat_bond);

        let result = Token::join_whitelist(origin!(acc1), token_id, proof);

        assert_noop!(result, Error::<Test>::MerkleProofNotProvided,);
    })
}

#[test]
fn join_whitelist_fails_with_insufficent_joy_balance_for_bloat_bond() {
    let token_id = token!(1);
    let (owner, acc1, acc2) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![acc1, acc2];
    let proof = merkle_proof!(0, [acc1, acc2]);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::join_whitelist(origin!(acc1), token_id, proof);

        assert_noop!(result, Error::<Test>::InsufficientBalanceForBloatBond);
    })
}

#[test]
fn join_whitelist_fails_in_permissionless_mode() {
    let token_id = token!(1);
    let (owner, acc1, acc2) = (account!(1), account!(2), account!(3));
    let proof = merkle_proof!(0, [acc1, acc2]);
    let bloat_bond = balance!(DEFAULT_BLOAT_BOND);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissionless)
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&acc1, bloat_bond);

        let result = Token::join_whitelist(origin!(acc1), token_id, proof);

        assert_noop!(
            result,
            Error::<Test>::CannotJoinWhitelistInPermissionlessMode,
        );
    })
}

#[test]
fn join_whitelist_ok() {
    let token_id = token!(1);
    let (owner, acc1, acc2) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![acc1, acc2];
    let proof = merkle_proof!(0, [acc1, acc2]);
    let bloat_bond = balance!(DEFAULT_BLOAT_BOND);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&acc1, bloat_bond);

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
    let bloat_bond = balance!(DEFAULT_BLOAT_BOND);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&acc1, bloat_bond);

        let _ = Token::join_whitelist(origin!(acc1), token_id, proof);

        last_event_eq!(RawEvent::MemberJoinedWhitelist(
            token_id,
            acc1,
            Policy::Permissioned(commit)
        ));
    })
}

#[test]
fn join_whitelist_ok_with_new_account_created() {
    let token_id = token!(1);
    let (owner, acc1, acc2) = (account!(1), account!(2), account!(3));
    let proof = merkle_proof!(0, [acc1, acc2]);
    let commit = merkle_root![acc1, acc2];
    let bloat_bond = balance!(DEFAULT_BLOAT_BOND);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&acc1, bloat_bond);

        let _ = Token::join_whitelist(origin!(acc1), token_id, proof);

        assert!(<crate::AccountInfoByTokenAndAccount<Test>>::contains_key(
            token_id, acc1
        ));
    })
}

#[test]
fn join_whitelist_ok_with_bloat_bond_slashed_from_account_free_balance() {
    let token_id = token!(1);
    let (owner, acc1, acc2) = (account!(1), account!(2), account!(3));
    let commit = merkle_root![acc1, acc2];
    let proof = merkle_proof!(0, [acc1, acc2]);
    let bloat_bond = balance!(DEFAULT_BLOAT_BOND);

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0)
        .build();

    build_test_externalities(config).execute_with(|| {
        increase_account_balance(&acc1, bloat_bond);

        let _ = Token::join_whitelist(origin!(acc1), token_id, proof);

        assert_eq!(Balances::free_balance(acc1), balance!(0));
    })
}

#[test]
fn dust_account_fails_with_invalid_token_id() {
    let token_id = token!(1);
    let acc = account!(2);
    let (owner, owner_balance) = (account!(1), balance!(100));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, owner_balance)
        .with_account(acc, balance!(0))
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(owner), token_id + 1, acc);

        assert_noop!(result, Error::<Test>::TokenDoesNotExist);
    })
}

#[test]
fn dust_account_fails_with_invalid_account_id() {
    let token_id = token!(1);
    let acc = account!(2);
    let (owner, owner_balance) = (account!(1), balance!(100));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, owner_balance)
        .with_account(acc, balance!(0))
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(owner), token_id, acc + 1);

        assert_noop!(result, Error::<Test>::AccountInformationDoesNotExist);
    })
}

#[test]
fn dust_account_fails_with_permissionless_mode_and_non_empty_non_owned_account() {
    let token_id = token!(1);
    let (acc1, acc2) = (account!(2), account!(3));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(acc1, balance!(0))
        .with_account(acc2, balance!(10))
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(acc1), token_id, acc2);

        assert_noop!(
            result,
            Error::<Test>::AttemptToRemoveNonOwnedAndNonEmptyAccount
        );
    })
}

#[test]
fn dust_account_fails_with_permissioned_mode_and_non_owned_account() {
    let token_id = token!(1);
    let (acc1, acc2) = (account!(2), account!(3));
    let commit = merkle_root![acc1, acc2];
    let (owner, owner_balance) = (account!(1), balance!(100));

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, owner_balance)
        .with_account(acc1, balance!(0))
        .with_account(acc2, balance!(0))
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(acc1), token_id, acc2);

        assert_noop!(
            result,
            Error::<Test>::AttemptToRemoveNonOwnedAccountUnderPermissionedMode
        );
    })
}

#[test]
fn dust_account_ok_with_permissionless_mode_and_non_empty_owned_account() {
    let token_id = token!(1);
    let (acc1, acc2) = (account!(2), account!(3));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(acc1, balance!(10))
        .with_account(acc2, balance!(0))
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(acc1), token_id, acc1);

        assert_ok!(result);
    })
}

#[test]
fn dust_account_ok_with_permissioned_mode_and_non_empty_owned_account() {
    let token_id = token!(1);
    let (acc1, acc2) = (account!(2), account!(3));
    let commit = merkle_root![acc1, acc2];
    let (owner, owner_balance) = (account!(1), balance!(100));

    let token_data = TokenDataBuilder::new_empty()
        .with_transfer_policy(Policy::Permissioned(commit))
        .build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, owner_balance)
        .with_account(acc1, balance!(0))
        .with_account(acc2, balance!(10))
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(acc1), token_id, acc1);

        assert_ok!(result);
    })
}

#[test]
fn dust_account_ok_with_permissionless_mode_and_empty_non_owned_account() {
    let token_id = token!(1);
    let acc = account!(2);
    let (owner, owner_balance) = (account!(1), balance!(100));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, owner_balance)
        .with_account(acc, balance!(0))
        .build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::dust_account(origin!(acc), token_id, acc);

        assert_ok!(result);
    })
}

#[test]
fn dust_account_ok_with_event_deposit() {
    let token_id = token!(1);
    let (acc1, acc2) = (account!(2), account!(3));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(acc1, balance!(0))
        .with_account(acc2, balance!(0))
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::dust_account(origin!(acc1), token_id, acc2);

        last_event_eq!(RawEvent::AccountDustedBy(
            token_id,
            acc2,
            acc1,
            Policy::Permissionless
        ));
    })
}

#[test]
fn dust_account_ok_with_account_removed() {
    let token_id = token!(1);
    let (acc1, acc2) = (account!(2), account!(3));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(acc1, balance!(0))
        .with_account(acc2, balance!(0))
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::dust_account(origin!(acc1), token_id, acc2);

        assert!(!<crate::AccountInfoByTokenAndAccount<Test>>::contains_key(
            token_id, acc2
        ));
    })
}

#[test]
fn dust_account_ok_with_bloat_bond_refunded() {
    let token_id = token!(1);
    let (acc1, acc2) = (account!(2), account!(3));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(acc1, balance!(0))
        .with_account(acc2, balance!(0))
        .build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::dust_account(origin!(acc1), token_id, acc2);

        assert_eq!(Balances::free_balance(acc2), balance!(DEFAULT_BLOAT_BOND));
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
    let token_id = token!(1);
    let (owner, acc) = (account!(1), account!(2));

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, balance!(10))
        .with_account(acc, balance!(0))
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
fn issue_token_ok_owner_having_already_issued_a_token() {
    let token_id = token!(1);
    let owner = account!(1);

    let token_data = TokenDataBuilder::new_empty().build();

    let config = GenesisConfigBuilder::new_empty()
        .with_token(token_id, token_data)
        .with_account(owner, 0)
        .build();

    let params = TokenIssuanceParametersOf::<Test> {
        symbol: Hashing::hash_of(&"CRT2".to_string()),
        initial_allocation: InitialAllocation {
            address: owner,
            amount: 0,
            vesting_schedule: None,
        },
        ..Default::default()
    };

    build_test_externalities(config).execute_with(|| {
        let result = Token::issue_token(params);

        assert_ok!(result);
    })
}

#[test]
fn issue_token_ok_with_token_id_increased() {
    let token_id = token!(1); // chainspec value for next_token_id

    let config = GenesisConfigBuilder::new_empty().build();

    let params = TokenIssuanceParametersOf::<Test>::default();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::issue_token(params);

        assert_eq!(Token::next_token_id(), token_id + 1);
    })
}

#[test]
fn issue_token_ok() {
    let params = TokenIssuanceParametersOf::<Test>::default();
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let result = Token::issue_token(params);
        assert_ok!(result);
    })
}

#[test]
fn issue_token_ok_with_event_deposit() {
    let token_id = token!(1);
    let owner = account!(1);

    let params = TokenIssuanceParametersOf::<Test> {
        initial_allocation: InitialAllocation {
            amount: balance!(100),
            address: owner,
            vesting_schedule: None,
        },
        symbol: Hashing::hash_of(&token_id),
        transfer_policy: Policy::Permissionless,
        patronage_rate: balance!(1),
    };

    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::issue_token(params.clone());
        last_event_eq!(RawEvent::TokenIssued(token_id, params.clone()));
    })
}

#[test]
fn issue_token_ok_with_token_info_added() {
    let token_id = token!(1);
    let owner = account!(1);

    let params = TokenIssuanceParametersOf::<Test> {
        initial_allocation: InitialAllocation {
            amount: balance!(100),
            address: owner,
            vesting_schedule: None,
        },
        symbol: Hashing::hash_of(&token_id),
        transfer_policy: Policy::Permissionless,
        patronage_rate: balance!(1),
    };

    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::issue_token(params.clone());

        assert_eq!(
            <crate::TokenInfoById<Test>>::get(token_id),
            TokenDataOf::<Test> {
                tokens_issued: params.initial_allocation.amount,
                total_supply: params.initial_allocation.amount,
                transfer_policy: params.transfer_policy,
                symbol: params.symbol,
                patronage_info: PatronageData::<Balance, BlockNumber> {
                    last_unclaimed_patronage_tally_block: System::block_number(),
                    unclaimed_patronage_tally_amount: balance!(0),
                    rate: params.patronage_rate
                },
                last_sale: None,
                sales_initialized: 0
            }
        );
    })
}

#[test]
fn issue_token_ok_with_symbol_added() {
    let token_id = token!(1);

    let params = TokenIssuanceParametersOf::<Test> {
        symbol: Hashing::hash_of(&token_id),
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::issue_token(params.clone());
        assert!(<crate::SymbolsUsed<Test>>::contains_key(&params.symbol));
    })
}

#[test]
fn issue_token_ok_with_owner_account_data_added_and_balance_equals_to_initial_supply() {
    let token_id = token!(1);
    let (owner, initial_supply) = (account!(1), balance!(100));

    let params = TokenIssuanceParametersOf::<Test> {
        symbol: Hashing::hash_of(&token_id),
        initial_allocation: InitialAllocation {
            amount: initial_supply,
            address: owner,
            vesting_schedule: None,
        },
        ..Default::default()
    };
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let _ = Token::issue_token(params);
        assert_ok!(
            Token::ensure_account_data_exists(token_id, &owner),
            AccountData {
                amount: initial_supply,
                vesting_schedules: BTreeMap::new(),
                split_staking_status: None
            }
        );
    })
}
