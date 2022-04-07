#![cfg(test)]

use crate::{traits::PalletToken, SymbolsUsed};
use frame_support::dispatch::DispatchResult;
use frame_support::storage::StorageMap;
use sp_runtime::{traits::Hash, DispatchError, Permill};

use crate::tests::mock::*;

pub trait Fixture<S: std::fmt::Debug + std::cmp::PartialEq> {
    fn get_state_snapshot(&self) -> S;

    fn execute_call(&self) -> DispatchResult;

    fn on_success(&self, snapshot_pre: &S, snapshot_post: &S);

    fn on_error(&self, snapshot_pre: &S, snapshot_post: &S, _e: DispatchError) {
        assert_eq!(snapshot_post, snapshot_pre);
    }

    fn call_and_assert(&self, expected_result: DispatchResult) {
        let snapshot_pre = Self::get_state_snapshot(&self);
        let result = Self::execute_call(&self);
        let snapshot_post = Self::get_state_snapshot(&self);

        assert_eq!(result, expected_result);

        match result {
            Result::Ok(..) => Self::on_success(&self, &snapshot_pre, &snapshot_post),
            Result::Err(e) => Self::on_error(&self, &snapshot_pre, &snapshot_post, e),
        };
    }
}

pub fn default_token_sale_params() -> TokenSaleParams {
    TokenSaleParams {
        duration: 100,
        metadata: None,
        starts_at: None,
        unit_price: 100,
        upper_bound_quantity: DEFAULT_INITIAL_ISSUANCE,
        vesting_schedule: Some(VestingScheduleParams {
            cliff: 0,
            duration: 100,
            initial_liquidity: Permill::from_percent(0),
        }),
        whitelist: None,
    }
}

pub struct IssueTokenFixture {
    params: IssuanceParams,
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct IssueTokenFixtureStateSnapshot {
    next_token_id: u64,
}

impl Fixture<IssueTokenFixtureStateSnapshot> for IssueTokenFixture {
    fn get_state_snapshot(&self) -> IssueTokenFixtureStateSnapshot {
        IssueTokenFixtureStateSnapshot {
            next_token_id: Token::next_token_id(),
        }
    }

    fn execute_call(&self) -> DispatchResult {
        <Token as PalletToken<AccountId, Policy, IssuanceParams>>::issue_token(self.params.clone())
    }

    fn on_success(
        &self,
        snapshot_pre: &IssueTokenFixtureStateSnapshot,
        snapshot_post: &IssueTokenFixtureStateSnapshot,
    ) {
        assert_eq!(snapshot_post.next_token_id, snapshot_pre.next_token_id + 1);
        assert_eq!(
            Token::token_info_by_id(snapshot_pre.next_token_id),
            TokenData::try_from_params::<Test>(self.params.clone()).unwrap()
        );
        assert!(SymbolsUsed::<Test>::contains_key(self.params.symbol))
    }
}

impl IssueTokenFixture {
    pub fn default() -> Self {
        Self {
            params: IssuanceParams {
                existential_deposit: DEFAULT_EXISTENTIAL_DEPOSIT,
                initial_issuance: DEFAULT_INITIAL_ISSUANCE,
                initial_state: InitialIssuanceState::Idle,
                patronage_rate: 0,
                symbol: Hashing::hash_of(b"ABC"),
                transfer_policy: TransferPolicy::Permissionless,
            },
        }
    }

    pub fn with_sale(self, sale_params: TokenSaleParams) -> Self {
        Self {
            params: IssuanceParams {
                initial_state: InitialIssuanceState::Sale(sale_params),
                ..self.params
            },
        }
    }
}
