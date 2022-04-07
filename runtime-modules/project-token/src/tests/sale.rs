#![cfg(test)]

use crate::errors::Error;

use crate::tests::fixtures::*;
use crate::tests::mock::*;

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
    })
}
