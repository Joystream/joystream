#![cfg(test)]

use std::iter::FromIterator;

use crate::errors::Error;

use crate::merkle_proof;
use crate::tests::fixtures::*;
use crate::tests::mock::*;
use crate::types::MerkleProofOf;
use sp_arithmetic::Permill;
use sp_runtime::traits::Hash;
use storage::DataObjectCreationParameters;

/////////////////////////////////////////////////////////
////////////////// SALE INITIALIZATION //////////////////
/////////////////////////////////////////////////////////

#[test]
fn unsuccesful_token_sale_init_with_invalid_token_id() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        InitTokenSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::TokenDoesNotExist.into()))
    })
}

#[test]
fn unsuccesful_token_sale_init_with_start_block_in_the_past() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_start_block(0)
            .call_and_assert(Err(Error::<Test>::SaleStartingBlockInThePast.into()))
    })
}

#[test]
fn unsuccesful_token_sale_init_with_upper_bound_quantity_exceeding_source_balance() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_upper_bound_quantity(DEFAULT_INITIAL_ISSUANCE + 1)
            .call_and_assert(Err(Error::<Test>::InsufficientTransferrableBalance.into()));
    })
}

#[test]
fn unsuccesful_token_sale_init_with_invalid_source() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_tokens_source(OTHER_ACCOUNT_ID)
            .call_and_assert(Err(Error::<Test>::AccountInformationDoesNotExist.into()));
    })
}

#[test]
fn unsuccesful_token_sale_init_with_whitelist_payload_and_unexpected_data_object_size_fee() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_whitelist(WhitelistParams {
                commitment: Hashing::hash_of(b"commitment"),
                payload: Some(SingleDataObjectUploadParams {
                    expected_data_size_fee: storage::Module::<Test>::data_object_per_mega_byte_fee(
                    ) + 1,
                    ..default_single_data_object_upload_params()
                }),
            })
            .call_and_assert(Err(storage::Error::<Test>::DataSizeFeeChanged.into()));
    })
}

#[test]
fn unsuccesful_token_sale_init_with_whitelist_payload_and_invalid_content_id() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_whitelist(WhitelistParams {
                commitment: Hashing::hash_of(b"commitment"),
                payload: Some(SingleDataObjectUploadParams {
                    object_creation_params: DataObjectCreationParameters {
                        ipfs_content_id: Vec::new(),
                        size: 1_000_000,
                    },
                    ..default_single_data_object_upload_params()
                }),
            })
            .call_and_assert(Err(storage::Error::<Test>::EmptyContentId.into()));
    })
}

#[test]
fn unsuccesful_token_sale_init_with_whitelist_payload_and_invalid_size() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_whitelist(WhitelistParams {
                commitment: Hashing::hash_of(b"commitment"),
                payload: Some(SingleDataObjectUploadParams {
                    object_creation_params: DataObjectCreationParameters {
                        ipfs_content_id: Vec::from_iter(0..46),
                        size: 1_000_000_000_000,
                    },
                    ..default_single_data_object_upload_params()
                }),
            })
            .call_and_assert(Err(storage::Error::<Test>::MaxDataObjectSizeExceeded.into()));
    })
}

#[test]
fn unsuccesful_token_sale_init_with_whitelist_payload_and_insufficient_balance() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_whitelist(WhitelistParams {
                commitment: Hashing::hash_of(b"commitment"),
                payload: Some(default_single_data_object_upload_params()),
            })
            .call_and_assert(Err(storage::Error::<Test>::InsufficientBalance.into()));
    })
}

#[test]
fn unsuccesful_token_sale_init_when_token_not_idle() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::TokenIssuanceNotInIdleState.into()));
    })
}

#[test]
fn unsuccesful_token_sale_init_when_remaining_reserved_toknes_from_previous_sale() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        increase_account_balance(
            &OTHER_ACCOUNT_ID,
            DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT,
        );
        PurchaseTokensOnSaleFixture::default().call_and_assert(Ok(()));
        increase_block_number_by(DEFAULT_SALE_DURATION);
        InitTokenSaleFixture::default().call_and_assert(Err(
            Error::<Test>::RemainingUnrecoveredTokensFromPreviousSale.into(),
        ));
    })
}

#[test]
fn succesful_token_sale_init() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));

        InitTokenSaleFixture::default().call_and_assert(Ok(()));

        // Assert Idle state after sale ends
        increase_block_number_by(DEFAULT_SALE_DURATION);
        let token = Token::token_info_by_id(1);
        assert_eq!(IssuanceState::of::<Test>(&token), IssuanceState::Idle);
    })
}

#[test]
fn succesful_token_sale_init_with_custom_start_block() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));

        InitTokenSaleFixture::default()
            .with_start_block(100)
            .call_and_assert(Ok(()));

        // Assert sale begins at block 100
        increase_block_number_by(99);
        let sale = TokenSale::try_from_params::<Test>(default_token_sale_params()).unwrap();
        let token = Token::token_info_by_id(1);
        assert_eq!(IssuanceState::of::<Test>(&token), IssuanceState::Sale(sale));
        // Assert Idle state at block block 100 + DEFAULT_SALE_DURATION
        increase_block_number_by(DEFAULT_SALE_DURATION);
        let token = Token::token_info_by_id(1);
        assert_eq!(IssuanceState::of::<Test>(&token), IssuanceState::Idle);
    })
}

#[test]
fn succesful_token_sale_init_with_whitelist_payload() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        increase_account_balance(
            &DEFAULT_ACCOUNT_ID,
            <Test as storage::Trait>::DataObjectDeletionPrize::get(),
        );
        InitTokenSaleFixture::default()
            .with_whitelist(WhitelistParams {
                commitment: Hashing::hash_of(b"commitment"),
                payload: Some(default_single_data_object_upload_params()),
            })
            .call_and_assert(Ok(()));
    })
}

/////////////////////////////////////////////////////////
///////////////// UPCOMING SALE UPDATE //////////////////
/////////////////////////////////////////////////////////

#[test]
fn unsuccesful_upcoming_sale_update_with_invalid_token_id() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        UpdateUpcomingSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::TokenDoesNotExist.into()))
    })
}

#[test]
fn unsuccesful_upcoming_sale_update_when_token_is_idle() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        UpdateUpcomingSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::NoUpcomingSale.into()))
    })
}

#[test]
fn unsuccesful_upcoming_sale_update_when_sale_is_ongoing() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        UpdateUpcomingSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::NoUpcomingSale.into()))
    })
}

#[test]
fn unsuccesful_upcoming_sale_update_with_start_block_in_the_past() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_start_block(100)
            .call_and_assert(Ok(()));
        UpdateUpcomingSaleFixture::default()
            .with_new_start_block(Some(0))
            .call_and_assert(Err(Error::<Test>::SaleStartingBlockInThePast.into()));
    })
}

#[test]
fn successful_upcoming_sale_update() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_start_block(100)
            .call_and_assert(Ok(()));
        UpdateUpcomingSaleFixture::default()
            .with_new_start_block(Some(20))
            .with_new_duration(Some(50))
            .call_and_assert(Ok(()));

        let token = Token::token_info_by_id(1);
        assert!(matches!(
            IssuanceState::of::<Test>(&token),
            IssuanceState::UpcomingSale { .. }
        ));

        increase_block_number_by(19);
        let token = Token::token_info_by_id(1);
        assert!(matches!(
            IssuanceState::of::<Test>(&token),
            IssuanceState::Sale { .. }
        ));

        increase_block_number_by(50);
        let token = Token::token_info_by_id(1);
        assert_eq!(IssuanceState::of::<Test>(&token), IssuanceState::Idle);
    })
}

/////////////////////////////////////////////////////////
//////////////////// SALE PURCHASES /////////////////////
/////////////////////////////////////////////////////////
#[test]
fn unsuccesful_sale_purchase_non_existing_token() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        PurchaseTokensOnSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::TokenDoesNotExist.into()));
    })
}

#[test]
fn unsuccesful_sale_purchase_when_no_sale() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        PurchaseTokensOnSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::NoActiveSale.into()));
    })
}

#[test]
fn unsuccesful_sale_purchase_when_sale_not_started_yet() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_start_block(10)
            .call_and_assert(Ok(()));
        PurchaseTokensOnSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::NoActiveSale.into()));
    })
}

#[test]
fn unsuccesful_sale_purchase_after_sale_finished() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        increase_block_number_by(DEFAULT_SALE_DURATION);
        PurchaseTokensOnSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::NoActiveSale.into()));
    })
}

#[test]
fn unsuccesful_sale_purchase_insufficient_balance() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        PurchaseTokensOnSaleFixture::default().call_and_assert(Err(
            Error::<Test>::InsufficientBalanceForTokenPurchase.into(),
        ));
    })
}

#[test]
fn unsuccesful_sale_purchase_amount_exceeds_quantity_left() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        increase_account_balance(
            &OTHER_ACCOUNT_ID,
            DEFAULT_SALE_UNIT_PRICE * (DEFAULT_INITIAL_ISSUANCE + 1),
        );
        PurchaseTokensOnSaleFixture::default()
            .with_amount(DEFAULT_INITIAL_ISSUANCE + 1)
            .call_and_assert(Err(Error::<Test>::NotEnoughTokensOnSale.into()));
    })
}

#[test]
fn unsuccesful_sale_purchase_vesting_balances_limit_reached() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        let max_vesting_schedules =
            <Test as crate::Trait>::MaxVestingBalancesPerAccountPerToken::get();
        increase_account_balance(
            &OTHER_ACCOUNT_ID,
            DEFAULT_SALE_PURCHASE_AMOUNT
                .saturating_mul(DEFAULT_SALE_UNIT_PRICE)
                .saturating_mul((max_vesting_schedules + 1).into()),
        );
        for _ in 0..<Test as crate::Trait>::MaxVestingBalancesPerAccountPerToken::get() {
            InitTokenSaleFixture::default()
                .with_upper_bound_quantity(DEFAULT_SALE_PURCHASE_AMOUNT)
                .with_vesting_schedule(Some(VestingScheduleParams {
                    blocks_before_cliff: DEFAULT_SALE_DURATION * (max_vesting_schedules + 1) as u64,
                    duration: 100,
                    cliff_amount_percentage: Permill::from_percent(0),
                }))
                .call_and_assert(Ok(()));
            PurchaseTokensOnSaleFixture::default().call_and_assert(Ok(()));
            increase_block_number_by(DEFAULT_SALE_DURATION);
        }
        InitTokenSaleFixture::default()
            .with_upper_bound_quantity(DEFAULT_SALE_PURCHASE_AMOUNT)
            .call_and_assert(Ok(()));
        PurchaseTokensOnSaleFixture::default().call_and_assert(Err(
            Error::<Test>::MaxVestingSchedulesPerAccountPerTokenReached.into(),
        ));
    })
}

#[test]
fn unsuccesful_permissioned_sale_purchase_without_access_proof() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_whitelisted_participants(&default_sale_whitelisted_participants())
            .call_and_assert(Ok(()));
        increase_account_balance(
            &OTHER_ACCOUNT_ID,
            DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT,
        );
        PurchaseTokensOnSaleFixture::default()
            .call_and_assert(Err(Error::<Test>::SaleAccessProofRequired.into()));
    })
}

#[test]
fn unsuccesful_permissioned_sale_purchase_with_invalid_access_proof() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let whitelisted = default_sale_whitelisted_participants();
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_whitelisted_participants(&whitelisted)
            .call_and_assert(Ok(()));
        increase_account_balance(
            &OTHER_ACCOUNT_ID,
            DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT,
        );
        PurchaseTokensOnSaleFixture::default()
            .with_access_proof(SaleAccessProof {
                participant: whitelisted[1].clone(),
                proof: MerkleProofOf::<Test>::new(None),
            })
            .call_and_assert(Err(Error::<Test>::MerkleProofNotProvided.into()));
        PurchaseTokensOnSaleFixture::default()
            .with_access_proof(SaleAccessProof {
                participant: whitelisted[1].clone(),
                proof: MerkleProofOf::<Test>::new(Some(Vec::new())),
            })
            .call_and_assert(Err(Error::<Test>::MerkleProofVerificationFailure.into()));
    })
}

#[test]
fn unsuccesful_permissioned_sale_purchase_with_invalid_access_proof_participant() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let whitelisted = default_sale_whitelisted_participants();
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_whitelisted_participants(&whitelisted)
            .call_and_assert(Ok(()));
        increase_account_balance(
            &OTHER_ACCOUNT_ID,
            DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT,
        );
        PurchaseTokensOnSaleFixture::default()
            .with_access_proof(SaleAccessProof {
                participant: whitelisted[0].clone(),
                proof: merkle_proof!(0, [whitelisted[0].clone(), whitelisted[1].clone()]),
            })
            .call_and_assert(Err(
                Error::<Test>::SaleAccessProofParticipantIsNotSender.into()
            ));
    })
}

#[test]
fn unsuccesful_permissioned_sale_purchase_with_cap_exceeded() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let whitelisted = [
            WhitelistedSaleParticipant {
                address: DEFAULT_ACCOUNT_ID,
                cap: None,
            },
            WhitelistedSaleParticipant {
                address: OTHER_ACCOUNT_ID,
                cap: Some(DEFAULT_SALE_PURCHASE_AMOUNT),
            },
        ];
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_whitelisted_participants(&whitelisted)
            .call_and_assert(Ok(()));
        increase_account_balance(
            &OTHER_ACCOUNT_ID,
            DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT * 2,
        );
        // Make succesful purchase
        PurchaseTokensOnSaleFixture::default()
            .with_access_proof(SaleAccessProof {
                participant: whitelisted[1].clone(),
                proof: merkle_proof!(1, [whitelisted[0].clone(), whitelisted[1].clone()]),
            })
            .call_and_assert(Ok(()));
        // Try making another one (that would exceed the cap)
        PurchaseTokensOnSaleFixture::default()
            .with_access_proof(SaleAccessProof {
                participant: whitelisted[1].clone(),
                proof: merkle_proof!(1, [whitelisted[0].clone(), whitelisted[1].clone()]),
            })
            .with_amount(1)
            .call_and_assert(Err(Error::<Test>::SaleParticipantCapExceeded.into()));
    })
}

#[test]
fn succesful_sale_purchase_no_vesting_schedule() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_vesting_schedule(None)
            .call_and_assert(Ok(()));
        increase_account_balance(
            &OTHER_ACCOUNT_ID,
            DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT,
        );
        PurchaseTokensOnSaleFixture::default().call_and_assert(Ok(()));
        increase_block_number_by(DEFAULT_SALE_DURATION);
        let buyer_acc_info = Token::account_info_by_token_and_account(1, OTHER_ACCOUNT_ID);
        assert_eq!(
            buyer_acc_info.transferrable::<Test>(System::block_number()),
            DEFAULT_SALE_PURCHASE_AMOUNT
        );
    })
}

#[test]
fn succesful_sale_purchase_with_vesting_schedule() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_vesting_schedule(Some(VestingScheduleParams {
                blocks_before_cliff: 100,
                duration: 200,
                cliff_amount_percentage: Permill::from_percent(30),
            }))
            .call_and_assert(Ok(()));
        increase_account_balance(
            &OTHER_ACCOUNT_ID,
            DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT,
        );
        PurchaseTokensOnSaleFixture::default().call_and_assert(Ok(()));

        // At sale end block expect 0 tokens in available balance (due to 100 blocks remaining until cliff)
        increase_block_number_by(DEFAULT_SALE_DURATION);
        let buyer_acc_info = Token::account_info_by_token_and_account(1, OTHER_ACCOUNT_ID);
        assert_eq!(
            buyer_acc_info.transferrable::<Test>(System::block_number()),
            0
        );

        // After cliff expect 30% of tokens in available balance (cliff_amount_percentage)
        increase_block_number_by(100);
        let buyer_acc_info = Token::account_info_by_token_and_account(1, OTHER_ACCOUNT_ID);
        assert_eq!(
            buyer_acc_info.transferrable::<Test>(System::block_number()),
            Permill::from_percent(30) * DEFAULT_SALE_PURCHASE_AMOUNT
        );

        // After 50% of duration (100 blocks), expect 30% + (50% * 70%) = 65% of tokens in available balance
        increase_block_number_by(100);
        let buyer_acc_info = Token::account_info_by_token_and_account(1, OTHER_ACCOUNT_ID);
        assert_eq!(
            buyer_acc_info.transferrable::<Test>(System::block_number()),
            Permill::from_percent(65) * DEFAULT_SALE_PURCHASE_AMOUNT
        );

        // At the end of vesting expect 100% of tokens in available balance
        increase_block_number_by(100);
        let buyer_acc_info = Token::account_info_by_token_and_account(1, OTHER_ACCOUNT_ID);
        assert_eq!(
            buyer_acc_info.transferrable::<Test>(System::block_number()),
            DEFAULT_SALE_PURCHASE_AMOUNT
        );
    })
}

#[test]
fn succesful_permissioned_sale_purchase() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        let whitelisted = [
            WhitelistedSaleParticipant {
                address: DEFAULT_ACCOUNT_ID,
                cap: None,
            },
            WhitelistedSaleParticipant {
                address: OTHER_ACCOUNT_ID,
                cap: None,
            },
        ];
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_whitelisted_participants(&whitelisted)
            .call_and_assert(Ok(()));
        increase_account_balance(
            &OTHER_ACCOUNT_ID,
            DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT,
        );
        // Make succesful purchase
        PurchaseTokensOnSaleFixture::default()
            .with_access_proof(SaleAccessProof {
                participant: whitelisted[1].clone(),
                proof: merkle_proof!(1, [whitelisted[0].clone(), whitelisted[1].clone()]),
            })
            .call_and_assert(Ok(()));
    })
}

/////////////////////////////////////////////////////////
//////////////// UNRESERVE UNSOLD TOKENS ////////////////
/////////////////////////////////////////////////////////
#[test]
fn unsuccesful_unreserve_unsold_tokens_non_existing_token() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        RecoverUnsoldTokensFixture::default()
            .call_and_assert(Err(Error::<Test>::TokenDoesNotExist.into()));
    })
}

#[test]
fn unsuccesful_unreserve_unsold_tokens_no_sale() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        RecoverUnsoldTokensFixture::default()
            .call_and_assert(Err(Error::<Test>::NoTokensToRecover.into()));
    })
}

#[test]
fn unsuccesful_unreserve_unsold_tokens_during_active_sale() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        RecoverUnsoldTokensFixture::default()
            .call_and_assert(Err(Error::<Test>::TokenIssuanceNotInIdleState.into()));
    })
}

#[test]
fn unsuccesful_unreserve_unsold_tokens_when_no_tokens_left() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_upper_bound_quantity(DEFAULT_SALE_PURCHASE_AMOUNT)
            .call_and_assert(Ok(()));
        increase_account_balance(
            &OTHER_ACCOUNT_ID,
            DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT,
        );
        PurchaseTokensOnSaleFixture::default().call_and_assert(Ok(()));
        increase_block_number_by(DEFAULT_SALE_DURATION);
        RecoverUnsoldTokensFixture::default()
            .call_and_assert(Err(Error::<Test>::NoTokensToRecover.into()));
    })
}

#[test]
fn succesful_unreserve_unsold_tokens() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default().call_and_assert(Ok(()));
        increase_account_balance(
            &OTHER_ACCOUNT_ID,
            DEFAULT_SALE_UNIT_PRICE * DEFAULT_SALE_PURCHASE_AMOUNT,
        );
        PurchaseTokensOnSaleFixture::default().call_and_assert(Ok(()));
        increase_block_number_by(DEFAULT_SALE_DURATION);
        RecoverUnsoldTokensFixture::default().call_and_assert(Ok(()));
    })
}
