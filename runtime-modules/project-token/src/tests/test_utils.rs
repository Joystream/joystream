use sp_arithmetic::traits::{One, Saturating, Zero};
use sp_runtime::traits::Hash;

use crate::tests::mock::*;
use crate::types::{OfferingState, Output, Outputs, PatronageData, TransferPolicy};
use crate::GenesisConfig;

pub struct TokenDataBuilder<Balance, Hash, BlockNumber> {
    pub(crate) current_total_issuance: Balance,
    pub(crate) existential_deposit: Balance,
    pub(crate) issuance_state: OfferingState,
    pub(crate) transfer_policy: TransferPolicy<Hash>,
    pub(crate) patronage_info: PatronageData<Balance, BlockNumber>,
}

impl<Balance: Zero + Copy + PartialOrd + Saturating, Hash, BlockNumber: One>
    TokenDataBuilder<Balance, Hash, BlockNumber>
{
    pub fn build(self) -> crate::types::TokenData<Balance, Hash, BlockNumber> {
        crate::types::TokenData::<_, _, _> {
            current_total_issuance: self.current_total_issuance,
            existential_deposit: self.existential_deposit,
            issuance_state: self.issuance_state,
            transfer_policy: self.transfer_policy,
            patronage_info: self.patronage_info,
        }
    }

    pub fn with_issuance(self, current_total_issuance: Balance) -> Self {
        Self {
            current_total_issuance,
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

    pub fn with_patronage_rate(self, rate: Balance) -> Self {
        Self {
            patronage_info: PatronageData::<_, _> {
                tally: Balance::zero(),
                rate,
                last_tally_update_block: BlockNumber::one(),
            },
            ..self
        }
    }

    pub fn new_empty() -> Self {
        Self {
            current_total_issuance: Balance::zero(),
            issuance_state: OfferingState::Idle,
            existential_deposit: Balance::zero(),
            transfer_policy: TransferPolicy::<Hash>::Permissionless,
            patronage_info: PatronageData::<Balance, BlockNumber> {
                rate: Balance::zero(),
                tally: Balance::zero(),
                last_tally_update_block: BlockNumber::one(),
            },
        }
    }
}

impl GenesisConfigBuilder {
    pub fn new_empty() -> Self {
        Self {
            token_info_by_id: vec![],
            account_info_by_token_and_account: vec![],
            next_token_id: TokenId::one(),
            symbol_used: vec![],
        }
    }

    // add token with given params & zero issuance
    pub fn with_token(mut self, token_id: TokenId, token_info: TokenData) -> Self {
        self.token_info_by_id.push((token_id, token_info));
        self.next_token_id = self.next_token_id.saturating_add(TokenId::one());
        self.symbol_used = vec![(Hashing::hash_of(&token_id), ())];
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
            symbol_used: self.symbol_used,
        }
    }
}

impl<Balance, AccountId> Outputs<Balance, AccountId> {
    pub fn new(v: Vec<Output<Balance, AccountId>>) -> Self {
        Outputs::<_, _>(v)
    }
}

#[cfg(test)]
#[ignore]
#[test]
fn with_token_assigns_correct_token_id() {
    let token_id: TokenId = 1;
    let token_params = TokenDataBuilder::new_empty().build();

    let builder = GenesisConfigBuilder::new_empty().with_token(token_id, token_params);

    let id = builder.token_info_by_id.last().unwrap().0;
    assert_eq!(id, token_id);
}

#[ignore]
#[test]
fn with_issuance_adds_issuance_to_token() {
    let token_params = TokenDataBuilder::new_empty().with_issuance(5).build();

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
    let token_params = TokenDataBuilder::new_empty().with_issuance(5).build();
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
