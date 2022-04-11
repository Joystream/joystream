#![cfg(test)]

use std::iter::FromIterator;

use crate::errors::Error;

use crate::tests::fixtures::*;
use crate::tests::mock::*;

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
            .call_and_assert(Err(
                Error::<Test>::InsufficientFreeBalanceForReserving.into()
            ));
    })
}

#[test]
fn unsuccesful_token_sale_init_with_invalid_source() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default().call_and_assert(Ok(()));
        InitTokenSaleFixture::default()
            .with_source(OTHER_ACCOUNT_ID)
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
