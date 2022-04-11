#![cfg(test)]

use crate::{traits::PalletToken, SymbolsUsed};
use frame_support::dispatch::DispatchResult;
use frame_support::storage::StorageMap;
use sp_runtime::{traits::Hash, DispatchError, Permill};
use sp_std::iter::FromIterator;
use storage::{BagId, DataObjectCreationParameters, StaticBagId};

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
        duration: DEFAULT_SALE_DURATION,
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

pub fn default_upload_context() -> UploadContext {
    UploadContext {
        bag_id: BagId::<Test>::Static(StaticBagId::Council),
        uploader_account: DEFAULT_ACCOUNT_ID,
    }
}

pub fn default_single_data_object_upload_params() -> SingleDataObjectUploadParams {
    SingleDataObjectUploadParams {
        expected_data_size_fee: storage::Module::<Test>::data_object_per_mega_byte_fee(),
        object_creation_params: DataObjectCreationParameters {
            ipfs_content_id: Vec::from_iter(0..46),
            size: 1_000_000,
        },
    }
}

pub struct IssueTokenFixture {
    params: IssuanceParams,
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct IssueTokenFixtureStateSnapshot {
    next_token_id: u64,
}

impl IssueTokenFixture {
    pub fn default() -> Self {
        Self {
            params: IssuanceParams {
                existential_deposit: DEFAULT_EXISTENTIAL_DEPOSIT,
                initial_allocation: InitialAllocation {
                    address: DEFAULT_ACCOUNT_ID,
                    amount: DEFAULT_INITIAL_ISSUANCE,
                    vesting_schedule: None,
                },
                patronage_rate: 0,
                symbol: Hashing::hash_of(b"ABC"),
                transfer_policy: TransferPolicy::Permissionless,
            },
        }
    }
}

impl Fixture<IssueTokenFixtureStateSnapshot> for IssueTokenFixture {
    fn get_state_snapshot(&self) -> IssueTokenFixtureStateSnapshot {
        IssueTokenFixtureStateSnapshot {
            next_token_id: Token::next_token_id(),
        }
    }

    fn execute_call(&self) -> DispatchResult {
        Token::issue_token(self.params.clone())
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
        assert!(SymbolsUsed::<Test>::contains_key(self.params.symbol));
    }
}

pub struct InitTokenSaleFixture {
    token_id: TokenId,
    source: AccountId,
    params: TokenSaleParams,
    payload_upload_context: UploadContext,
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct InitTokenSaleFixtureStateSnapshot {
    token_data: TokenData,
    source_account_data: AccountData,
    next_data_object_id: u64,
}

impl InitTokenSaleFixture {
    pub fn default() -> Self {
        Self {
            token_id: 1,
            params: default_token_sale_params(),
            source: DEFAULT_ACCOUNT_ID,
            payload_upload_context: default_upload_context(),
        }
    }

    pub fn with_start_block(self, bn: BlockNumber) -> Self {
        Self {
            params: TokenSaleParams {
                starts_at: Some(bn),
                ..self.params
            },
            ..self
        }
    }

    pub fn with_upper_bound_quantity(self, quantity: Balance) -> Self {
        Self {
            params: TokenSaleParams {
                upper_bound_quantity: quantity,
                ..self.params
            },
            ..self
        }
    }

    pub fn with_source(self, source: AccountId) -> Self {
        Self { source, ..self }
    }

    pub fn with_whitelist(self, whitelist: WhitelistParams) -> Self {
        Self {
            params: TokenSaleParams {
                whitelist: Some(whitelist),
                ..self.params
            },
            ..self
        }
    }
}

impl Fixture<InitTokenSaleFixtureStateSnapshot> for InitTokenSaleFixture {
    fn get_state_snapshot(&self) -> InitTokenSaleFixtureStateSnapshot {
        InitTokenSaleFixtureStateSnapshot {
            token_data: Token::token_info_by_id(self.token_id),
            next_data_object_id: storage::Module::<Test>::next_data_object_id(),
            source_account_data: Token::account_info_by_token_and_account(
                self.token_id,
                self.source,
            ),
        }
    }

    fn execute_call(&self) -> DispatchResult {
        Token::init_token_sale(
            self.token_id,
            self.source,
            self.params.clone(),
            self.payload_upload_context.clone(),
        )
    }

    fn on_success(
        &self,
        snapshot_pre: &InitTokenSaleFixtureStateSnapshot,
        snapshot_post: &InitTokenSaleFixtureStateSnapshot,
    ) {
        // Whitelist payload uploaded if present
        self.params.whitelist.as_ref().map(|w| {
            w.payload.as_ref().map(|_| {
                assert_eq!(
                    snapshot_post.next_data_object_id,
                    snapshot_pre.next_data_object_id + 1
                );
            })
        });

        // Token's `last_sale` updated
        assert_eq!(
            snapshot_post.token_data.last_sale,
            Some(TokenSale::try_from_params::<Test>(self.params.clone()).unwrap())
        );

        // Token state is valid
        let sale = snapshot_post.token_data.last_sale.clone().unwrap();
        assert_eq!(
            IssuanceState::of::<Test>(&snapshot_post.token_data),
            if let Some(start_block) = self.params.starts_at {
                if System::block_number() < start_block {
                    IssuanceState::UpcomingSale(sale)
                } else {
                    IssuanceState::Sale(sale)
                }
            } else {
                IssuanceState::Sale(sale)
            }
        );

        // Source balance reserved
        assert_eq!(
            snapshot_post.source_account_data.reserved_balance,
            snapshot_pre
                .source_account_data
                .reserved_balance
                .saturating_add(self.params.upper_bound_quantity)
        );
        assert_eq!(
            snapshot_post.source_account_data.free_balance,
            snapshot_pre
                .source_account_data
                .free_balance
                .saturating_sub(self.params.upper_bound_quantity)
        );
    }
}

pub struct UpdateUpcomingSaleFixture {
    token_id: TokenId,
    new_duration: Option<BlockNumber>,
    new_start_block: Option<BlockNumber>,
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct UpdateUpcomingSaleFixtureStateSnapshot {
    token_data: TokenData,
}

impl UpdateUpcomingSaleFixture {
    pub fn default() -> Self {
        Self {
            token_id: 1,
            new_duration: Some(DEFAULT_SALE_DURATION * 2),
            new_start_block: Some(200),
        }
    }

    pub fn with_new_duration(self, new_duration: Option<BlockNumber>) -> Self {
        Self {
            new_duration,
            ..self
        }
    }

    pub fn with_new_start_block(self, new_start_block: Option<BlockNumber>) -> Self {
        Self {
            new_start_block,
            ..self
        }
    }
}

impl Fixture<UpdateUpcomingSaleFixtureStateSnapshot> for UpdateUpcomingSaleFixture {
    fn get_state_snapshot(&self) -> UpdateUpcomingSaleFixtureStateSnapshot {
        UpdateUpcomingSaleFixtureStateSnapshot {
            token_data: Token::token_info_by_id(self.token_id),
        }
    }

    fn execute_call(&self) -> DispatchResult {
        Token::update_upcoming_sale(
            self.token_id,
            self.new_start_block.clone(),
            self.new_duration.clone(),
        )
    }

    fn on_success(
        &self,
        snapshot_pre: &UpdateUpcomingSaleFixtureStateSnapshot,
        snapshot_post: &UpdateUpcomingSaleFixtureStateSnapshot,
    ) {
        // Token's `last_sale` updated
        let sale_pre = snapshot_pre.token_data.last_sale.clone().unwrap();
        assert_eq!(
            snapshot_post.token_data.last_sale.clone().unwrap(),
            TokenSale {
                duration: self.new_duration.unwrap_or(sale_pre.duration),
                start_block: self.new_start_block.unwrap_or(sale_pre.start_block),
                ..sale_pre
            }
        );
    }
}
