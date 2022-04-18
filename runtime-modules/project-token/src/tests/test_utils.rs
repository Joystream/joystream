use sp_arithmetic::traits::{One, Saturating, Zero};
use sp_runtime::traits::Hash;
use sp_std::collections::btree_map::BTreeMap;

use crate::tests::mock::*;
use crate::types::{
    AccountData, MerkleProof, MerkleSide, OfferingState, PatronageData, Payment, TransferPolicy,
    Transfers,
};
use crate::GenesisConfig;

pub struct TokenDataBuilder<Balance, Hash, BlockNumber> {
    pub(crate) supply: Balance,
    pub(crate) offering_state: OfferingState,
    pub(crate) transfer_policy: TransferPolicy<Hash>,
    pub(crate) patronage_info: PatronageData<Balance, BlockNumber>,
    pub(crate) symbol: Hash,
}

impl<Balance: Zero + Copy + PartialOrd + Saturating, Hash: Default, BlockNumber: One>
    TokenDataBuilder<Balance, Hash, BlockNumber>
{
    pub fn build(self) -> crate::types::TokenData<Balance, Hash, BlockNumber> {
        crate::types::TokenData::<_, _, _> {
            supply: self.supply,
            offering_state: self.offering_state,
            transfer_policy: self.transfer_policy,
            patronage_info: self.patronage_info,
            symbol: self.symbol,
            accounts_number: 0u64,
        }
    }

    pub fn with_symbol(self, symbol: Hash) -> Self {
        Self { symbol, ..self }
    }

    pub fn with_issuance(self, supply: Balance) -> Self {
        Self { supply, ..self }
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
                unclaimed_patronage_tally_amount: Balance::zero(),
                rate,
                last_unclaimed_patronage_tally_block: BlockNumber::one(),
            },
            ..self
        }
    }

    pub fn new_empty() -> Self {
        Self {
            supply: Balance::zero(),
            offering_state: OfferingState::Idle,
            transfer_policy: TransferPolicy::<Hash>::Permissionless,
            patronage_info: PatronageData::<Balance, BlockNumber> {
                rate: Balance::zero(),
                unclaimed_patronage_tally_amount: Balance::zero(),
                last_unclaimed_patronage_tally_block: BlockNumber::one(),
            },
            // hash of "default"
            symbol: Hash::default(),
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
        self.symbol_used = vec![(token_info.symbol.clone(), ())];
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

        self.token_info_by_id
            .last_mut()
            .unwrap()
            .1
            .increase_issuance_by(Balance::from(free_balance.saturating_add(reserved_balance)));

        self.account_info_by_token_and_account
            .push((id, account_id, new_account_info));

        self.token_info_by_id.last_mut().unwrap().1.accounts_number += 1u64;
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

impl<Hasher: Hash> MerkleProof<Hasher> {
    pub fn new(v: Option<Vec<(Hasher::Output, MerkleSide)>>) -> Self {
        MerkleProof::<Hasher>(v)
    }
}

impl<Balance, Account: Ord> Transfers<Account, Balance> {
    pub fn new(v: Vec<(Account, Balance)>) -> Self {
        Transfers::<_, _>(
            v.into_iter()
                .map(|(acc, amount)| {
                    (
                        acc,
                        Payment::<Balance> {
                            remark: vec![],
                            amount,
                        },
                    )
                })
                .collect::<BTreeMap<_, _>>(),
        )
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

    let supply = builder.token_info_by_id.last().unwrap().1.supply;
    assert_eq!(supply, 5);
}

#[ignore]
#[test]
fn adding_account_with_free_balance_also_adds_issuance() {
    let token_params = TokenDataBuilder::new_empty().with_issuance(5).build();
    let mut builder = GenesisConfigBuilder::new_empty().with_token(1, token_params);
    builder = builder.with_account(1, 5, 5);

    let supply = builder.token_info_by_id.last().unwrap().1.supply;
    assert_eq!(supply, 15);
}
