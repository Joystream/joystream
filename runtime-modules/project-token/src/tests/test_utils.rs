use sp_arithmetic::traits::{One, Zero};
use sp_runtime::Percent;

use crate::tests::mock::*;
use crate::types::{IssuanceState, TokenDataOf, TokenIssuanceParameters, TransferPolicy};
use crate::GenesisConfig;

impl<Balance: Zero + Copy + PartialOrd, Hash> TokenIssuanceParameters<Balance, Hash> {
    pub fn with_initial_issuance(self, initial_issuance: Balance) -> Self {
        Self {
            initial_issuance,
            ..self
        }
    }

    pub fn with_existential_deposit(self, existential_deposit: Balance) -> Self {
        Self {
            existential_deposit,
            ..self
        }
    }

    pub fn with_transfer_policy(self, transfer_policy: TransferPolicy<Hash>) -> Self {
        Self {
            transfer_policy,
            ..self
        }
    }

    pub fn with_patronage_rate(self, patronage_rate: Percent) -> Self {
        Self {
            patronage_rate,
            ..self
        }
    }

    pub fn new_empty() -> Self {
        Self {
            initial_issuance: Balance::zero(),
            initial_state: IssuanceState::Idle,
            existential_deposit: Balance::zero(),
            symbol: (),
            transfer_policy: TransferPolicy::<Hash>::Permissionless,
            patronage_rate: Percent::from_percent(0),
        }
    }
}

impl GenesisConfigBuilder {
    pub fn new_empty() -> Self {
        Self {
            token_info_by_id: vec![],
            account_info_by_token_and_account: vec![],
            next_token_id: TokenId::one(),
        }
    }

    // add token with given params & zero issuance
    pub fn with_token(mut self, token_id: TokenId, params: IssuanceParams) -> Self {
        let token_info = params.try_build::<Test>().unwrap();

        self.token_info_by_id.push((token_id, token_info));
        self.next_token_id = self.next_token_id.saturating_add(TokenId::one());
        self
    }

    // add account & updates token issuance
    pub fn with_account(
        mut self,
        account_id: AccountId,
        free_balance: Balance,
        reserved_balance: Balance,
    ) -> Self {
        let id = self.next_token_id.saturating_sub(TokenId::one());
        let new_account_info = AccountData {
            free_balance,
            reserved_balance,
        };

        let new_issuance = self
            .token_info_by_id
            .last()
            .unwrap()
            .1
            .current_total_issuance
            .saturating_add(Balance::from(free_balance.saturating_add(reserved_balance)));

        self.account_info_by_token_and_account
            .push((id, account_id, new_account_info));

        self.token_info_by_id
            .last_mut()
            .unwrap()
            .1
            .current_total_issuance = new_issuance;
        self
    }

    pub fn build(self) -> GenesisConfig<Test> {
        GenesisConfig::<Test> {
            account_info_by_token_and_account: self.account_info_by_token_and_account,
            token_info_by_id: self.token_info_by_id,
            next_token_id: self.next_token_id,
        }
    }
}

#[cfg(test)]
#[ignore]
#[test]
fn with_token_assigns_correct_token_id() {
    let token_id: TokenId = 1;
    let token_params = IssuanceParams::new_empty();

    let builder = GenesisConfigBuilder::new_empty().with_token(token_id, token_params);

    let id = builder.token_info_by_id.last().unwrap().0;
    assert_eq!(id, token_id);
}

#[ignore]
#[test]
fn with_issuance_adds_issuance_to_token() {
    let token_params = IssuanceParams::new_empty().with_initial_issuance(5);

    let builder = GenesisConfigBuilder::new_empty().with_token(1, token_params);

    let issuance = builder
        .token_info_by_id
        .last()
        .unwrap()
        .1
        .current_total_issuance;
    assert_eq!(issuance, 5);
}

#[ignore]
#[test]
fn adding_account_with_free_balance_also_adds_issuance() {
    let token_params = IssuanceParams::new_empty().with_initial_issuance(5);
    let mut builder = GenesisConfigBuilder::new_empty().with_token(1, token_params);
    builder = builder.with_account(1, 5, 5);

    let issuance = builder
        .token_info_by_id
        .last()
        .unwrap()
        .1
        .current_total_issuance;
    assert_eq!(issuance, 15);
}
