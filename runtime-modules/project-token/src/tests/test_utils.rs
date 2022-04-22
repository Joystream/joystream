use sp_arithmetic::traits::{One, Zero};
use sp_runtime::traits::Hash;
use sp_std::collections::btree_map::BTreeMap;

use crate::tests::mock::*;
use crate::types::{
    MerkleProof, MerkleSide, PatronageData, Payment, TokenSaleId, TokenSaleOf, TransferPolicyOf,
    Transfers,
};
use crate::GenesisConfig;

pub struct TokenDataBuilder {
    pub(crate) total_supply: <Test as crate::Trait>::Balance,
    pub(crate) tokens_issued: <Test as crate::Trait>::Balance,
    pub(crate) last_sale: Option<TokenSaleOf<Test>>,
    pub(crate) sales_initialized: TokenSaleId,
    pub(crate) transfer_policy: TransferPolicyOf<Test>,
    pub(crate) patronage_info:
        PatronageData<<Test as crate::Trait>::Balance, <Test as frame_system::Trait>::BlockNumber>,
    pub(crate) symbol: <Test as frame_system::Trait>::Hash,
}

impl TokenDataBuilder {
    pub fn build(self) -> crate::types::TokenDataOf<Test> {
        crate::types::TokenDataOf::<Test> {
            total_supply: self.total_supply,
            tokens_issued: self.tokens_issued,
            last_sale: self.last_sale,
            sales_initialized: self.sales_initialized,
            transfer_policy: self.transfer_policy,
            patronage_info: self.patronage_info,
            symbol: self.symbol,
        }
    }

    pub fn with_issuance(self, issuance: Balance) -> Self {
        Self {
            total_supply: issuance,
            tokens_issued: issuance,
            ..self
        }
    }

    pub fn with_transfer_policy(self, transfer_policy: TransferPolicyOf<Test>) -> Self {
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
            tokens_issued: Balance::zero(),
            total_supply: Balance::zero(),
            last_sale: None,
            sales_initialized: 0,
            transfer_policy: TransferPolicy::Permissionless,
            patronage_info: PatronageData::<Balance, BlockNumber> {
                rate: Balance::zero(),
                unclaimed_patronage_tally_amount: Balance::zero(),
                last_unclaimed_patronage_tally_block: BlockNumber::one(),
            },
            // hash of "default"
            symbol: <Test as frame_system::Trait>::Hash::default(),
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
    pub fn with_account(mut self, account_id: AccountId, amount: Balance) -> Self {
        let id = self.next_token_id.saturating_sub(TokenId::one());
        let new_account_info = AccountData {
            amount,
            vesting_schedules: BTreeMap::new(),
            split_staking_status: None,
        };

        self.account_info_by_token_and_account
            .push((id, account_id, new_account_info));

        self.token_info_by_id
            .last_mut()
            .unwrap()
            .1
            .increase_issuance_by(amount);

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

impl<Balance, AccountId: Ord> Transfers<AccountId, Balance> {
    pub fn new(v: Vec<(AccountId, Balance)>) -> Self {
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

    let token = &builder.token_info_by_id.last().unwrap().1;
    assert_eq!(token.tokens_issued, 5);
    assert_eq!(token.total_supply, 5);
}

#[ignore]
#[test]
fn adding_account_with_tokens_also_adds_issuance() {
    let token_params = TokenDataBuilder::new_empty().with_issuance(5).build();
    let mut builder = GenesisConfigBuilder::new_empty().with_token(1, token_params);
    builder = builder.with_account(1, 5);

    let token = &builder.token_info_by_id.last().unwrap().1;
    assert_eq!(token.tokens_issued, 5);
    assert_eq!(token.total_supply, 5);
}
