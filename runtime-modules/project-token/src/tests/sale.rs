#![cfg(test)]

use std::iter::FromIterator;

use crate::errors::Error;

use crate::tests::fixtures::*;
use crate::tests::mock::*;

use sp_runtime::traits::Hash;

#[test]
fn unsuccesful_token_issuance_with_sale_start_block_in_the_past() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default()
            .with_sale(TokenSaleParams {
                starts_at: Some(0),
                ..default_token_sale_params()
            })
            .call_and_assert(Err(Error::<Test>::SaleStartingBlockInThePast.into()));
    })
}

#[test]
fn unsuccesful_token_issuance_with_sale_upper_bound_quantity_exceeding_initial_supply() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default()
            .with_sale(TokenSaleParams {
                upper_bound_quantity: DEFAULT_INITIAL_ISSUANCE + 1,
                ..default_token_sale_params()
            })
            .call_and_assert(Err(
                Error::<Test>::SaleUpperBoundQuantityExceedsInitialTokenSupply.into(),
            ));
    })
}

#[test]
fn succesful_token_issuance_with_sale() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default()
            .with_sale(default_token_sale_params())
            .call_and_assert(Ok(()));

        let sale = TokenSale::try_from_params::<Test>(default_token_sale_params()).unwrap();
        // Assert starts in Sale state
        let token = Token::token_info_by_id(Token::next_token_id() - 1);
        assert_eq!(IssuanceState::of::<Test>(&token), IssuanceState::Sale(sale));
        // Assert Idle state after sale ends
        increase_block_number_by(DEFAULT_SALE_DURATION);
        assert_eq!(IssuanceState::of::<Test>(&token), IssuanceState::Idle);
    })
}

#[test]
fn succesful_token_issuance_with_sale_with_custom_start_block() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default()
            .with_sale(TokenSaleParams {
                starts_at: Some(100),
                ..default_token_sale_params()
            })
            .call_and_assert(Ok(()));

        // Assert starts in idle state
        let token = Token::token_info_by_id(Token::next_token_id() - 1);
        assert_eq!(IssuanceState::of::<Test>(&token), IssuanceState::Idle);
        // Assert sale begins at block 100
        increase_block_number_by(99);
        let sale = TokenSale::try_from_params::<Test>(default_token_sale_params()).unwrap();
        let token = Token::token_info_by_id(Token::next_token_id() - 1);
        assert_eq!(IssuanceState::of::<Test>(&token), IssuanceState::Sale(sale));
        // Assert Idle state at block block 100 + DEFAULT_SALE_DURATION
        increase_block_number_by(DEFAULT_SALE_DURATION);
        let token = Token::token_info_by_id(Token::next_token_id() - 1);
        assert_eq!(IssuanceState::of::<Test>(&token), IssuanceState::Idle);
    })
}

#[test]
fn succesful_token_issuance_with_sale_with_whitelist_payload() {
    let config = GenesisConfigBuilder::new_empty().build();

    build_test_externalities(config).execute_with(|| {
        IssueTokenFixture::default()
            .with_sale(TokenSaleParams {
                whitelist: Some(WhitelistParams {
                    commitment: Hashing::hash_of(b"commitment"),
                    payload: Some(SingleDataObjectUploadParams {
                        expected_data_size_fee:
                            storage::Module::<Test>::data_object_per_mega_byte_fee(),
                        object_creation_params: storage::DataObjectCreationParameters {
                            ipfs_content_id: Vec::from_iter(0..46),
                            size: 1_000_000,
                        },
                    }),
                }),
                ..default_token_sale_params()
            })
            .call_and_assert(Ok(()));
    })
}
