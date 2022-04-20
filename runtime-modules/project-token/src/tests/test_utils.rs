use sp_arithmetic::traits::{One, Saturating, Zero};
use sp_runtime::traits::Hash;
use sp_runtime::Permill;
use sp_std::collections::btree_map::BTreeMap;

use crate::tests::mock::*;
use crate::types::{
    AccountData, AccountDataOf, BlockRate, MerkleProof, MerkleSide, OfferingState, PatronageData,
    Payment, TransferPolicy, Transfers,
};
use crate::{balance, joy, GenesisConfig};

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

    pub fn with_patronage_rate(self, rate: BlockRate) -> Self {
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
                rate: BlockRate(Permill::zero()),
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
            bloat_bond: ReserveBalance::zero(),
        }
    }

    // add token with given params & zero issuance
    pub fn with_token(mut self, token_id: TokenId, token_info: TokenData) -> Self {
        self.symbol_used = vec![(token_info.symbol.clone(), ())];
        self.token_info_by_id.push((token_id, token_info));
        self.next_token_id = self.next_token_id.saturating_add(TokenId::one());
        self
    }

    // add token and owner: useful for tests
    pub fn with_token_and_owner(
        self,
        token_id: TokenId,
        token_info: TokenData,
        owner: AccountId,
        initial_supply: Balance,
    ) -> Self {
        self.with_token(token_id, token_info)
            .with_account(owner, AccountData::new_with_liquidity(initial_supply))
    }

    pub fn with_bloat_bond(self, bloat_bond: ReserveBalance) -> Self {
        Self { bloat_bond, ..self }
    }

    // add account & updates token issuance
    pub fn with_account(
        mut self,
        account_id: AccountId,
        account_data: AccountDataOf<Test>,
    ) -> Self {
        let id = self.next_token_id.saturating_sub(TokenId::one());

        self.token_info_by_id
            .last_mut()
            .unwrap()
            .1
            .increase_issuance_by(Balance::from(account_data.total_balance()));

        self.account_info_by_token_and_account
            .push((id, account_id, account_data));

        self.token_info_by_id.last_mut().unwrap().1.accounts_number += 1u64;
        self
    }

    pub fn build(self) -> GenesisConfig<Test> {
        GenesisConfig::<Test> {
            account_info_by_token_and_account: self.account_info_by_token_and_account,
            token_info_by_id: self.token_info_by_id,
            next_token_id: self.next_token_id,
            symbol_used: self.symbol_used,
            bloat_bond: self.bloat_bond,
        }
    }
}

impl<Balance: Zero, ReserveBalance: Zero> AccountData<Balance, ReserveBalance> {
    pub fn new_empty() -> Self {
        Self {
            free_balance: Balance::zero(),
            stacked_balance: Balance::zero(),
            bloat_bond: ReserveBalance::zero(),
        }
    }

    pub fn new_with_liquidity(free_balance: Balance) -> Self {
        Self {
            free_balance,
            ..Self::new_empty()
        }
    }

    pub fn with_stacked(self, stacked_balance: Balance) -> Self {
        Self {
            stacked_balance,
            ..self
        }
    }
}

impl<Hasher: Hash> MerkleProof<Hasher> {
    pub fn new(v: Vec<(Hasher::Output, MerkleSide)>) -> Self {
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
    builder = builder.with_account(
        1,
        AccountData::new_with_liquidity(balance!(5)).with_stacked(joy!(5)),
    );

    let supply = builder.token_info_by_id.last().unwrap().1.supply;
    assert_eq!(supply, 15);
}

#[test]
fn permill_yearly_and_block_rate_behavior() {
    pub const BLOCKS_PER_YEAR: u32 = 5259600;
    //    let block_rate = Permill::from_parts(BLOCKS_PER_YEAR);
    pub const PERCENTAGE: u32 = 37;
    let yearly_rate = Permill::from_percent(PERCENTAGE);

    let block_rate = Permill::from_rational_approximation(
        BLOCKS_PER_YEAR,
        yearly_rate.saturating_reciprocal_mul(BLOCKS_PER_YEAR),
    );

    assert_eq!(
        Permill::from_rational_approximation(
            block_rate.mul_floor(BLOCKS_PER_YEAR),
            BLOCKS_PER_YEAR
        ),
        yearly_rate,
    );
}
