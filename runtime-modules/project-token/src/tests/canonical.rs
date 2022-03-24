#![cfg(test)]

use frame_support::assert_ok;

use crate::tests::mock::*;
use crate::traits::MultiCurrencyBase;
use crate::types::TokenIssuanceParametersOf;
use crate::{Error, Module, Trait};

#[test]
fn issue_token_ok_with_default_issuance_parameters() {
    let config = GenesisConfigBuilder::new().build();
    let issuance_params = TokenIssuanceParametersOf::<Test>::default();

    build_test_externalities(config).execute_with(|| {
        let token_id = Token::next_token_id();
        assert_ok!(<Token as MultiCurrencyBase<AccountId>>::issue_token(
            issuance_params.clone(),
        ));
        assert_eq!(
            issuance_params.try_build::<Test>(),
            Token::ensure_token_exists(token_id)
        );
        assert_eq!(token_id + 1, Token::next_token_id());
    })
}
