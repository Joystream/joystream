#![cfg(test)]

use crate::tests::mock::*;
use crate::{last_event_eq, yearly_rate, RawEvent, YearlyRate};
use crate::{traits::PalletToken, types::VestingSource, SaleAccessibilityParams, SymbolsUsed};
use frame_support::dispatch::DispatchResult;
use frame_support::storage::StorageMap;
use sp_arithmetic::Percent;
use sp_runtime::{traits::Hash, DispatchError, Permill};
use sp_std::iter::FromIterator;
use storage::{BagId, DataObjectCreationParameters, StaticBagId};

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
        tokens_source: DEFAULT_ACCOUNT_ID,
        duration: DEFAULT_SALE_DURATION,
        metadata: None,
        starts_at: None,
        unit_price: DEFAULT_SALE_UNIT_PRICE,
        upper_bound_quantity: DEFAULT_INITIAL_ISSUANCE,
        vesting_schedule: Some(VestingScheduleParams {
            blocks_before_cliff: 0,
            duration: 100,
            cliff_amount_percentage: Permill::from_percent(0),
        }),
        accessibility: SaleAccessibilityParams::PublicSale(None),
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

pub fn default_sale_whitelisted_participants() -> [WhitelistedSaleParticipant; 2] {
    [
        WhitelistedSaleParticipant {
            address: DEFAULT_ACCOUNT_ID,
            cap: None,
        },
        WhitelistedSaleParticipant {
            address: OTHER_ACCOUNT_ID,
            cap: None,
        },
    ]
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
                initial_allocation: InitialAllocation {
                    address: DEFAULT_ACCOUNT_ID,
                    amount: DEFAULT_INITIAL_ISSUANCE,
                    vesting_schedule: None,
                },
                patronage_rate: yearly_rate!(0),
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
            TokenData {
                accounts_number: 1,
                ..TokenData::from_params::<Test>(self.params.clone())
            }
        );
        assert!(SymbolsUsed::<Test>::contains_key(self.params.symbol));
    }
}

pub struct InitTokenSaleFixture {
    token_id: TokenId,
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

    pub fn with_tokens_source(self, tokens_source: AccountId) -> Self {
        Self {
            params: TokenSaleParams {
                tokens_source,
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

    pub fn with_whitelist(self, whitelist: WhitelistParams) -> Self {
        Self {
            params: TokenSaleParams {
                accessibility: SaleAccessibilityParams::PrivateSale(whitelist),
                ..self.params
            },
            ..self
        }
    }

    pub fn with_whitelisted_participants(
        self,
        participants: &[WhitelistedSaleParticipant],
    ) -> Self {
        self.with_whitelist(WhitelistParams {
            commitment: generate_merkle_root_helper(participants).pop().unwrap(),
            payload: None,
        })
    }

    pub fn with_vesting_schedule(self, vesting_schedule: Option<VestingScheduleParams>) -> Self {
        Self {
            params: TokenSaleParams {
                vesting_schedule,
                ..self.params
            },
            ..self
        }
    }

    pub fn with_cap_per_member(self, cap_per_member: Balance) -> Self {
        Self {
            params: TokenSaleParams {
                accessibility: SaleAccessibilityParams::PublicSale(Some(cap_per_member)),
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
                self.params.tokens_source,
            ),
        }
    }

    fn execute_call(&self) -> DispatchResult {
        Token::init_token_sale(
            self.token_id,
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
        if let SaleAccessibilityParams::PrivateSale(whitelist_params) =
            self.params.accessibility.clone()
        {
            whitelist_params.payload.as_ref().map(|_| {
                assert_eq!(
                    snapshot_post.next_data_object_id,
                    snapshot_pre.next_data_object_id + 1
                );
            });
        }

        // Token's `last_sale` updated
        assert_eq!(
            snapshot_post.token_data.last_sale,
            Some(TokenSale::try_from_params::<Test>(self.params.clone()).unwrap())
        );

        // Token's `sales_initialized` updated
        assert_eq!(
            snapshot_post.token_data.sales_initialized,
            snapshot_pre.token_data.sales_initialized.saturating_add(1)
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

        // Source tokens amount decreased
        assert_eq!(
            snapshot_post.source_account_data.amount,
            snapshot_pre
                .source_account_data
                .amount
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

pub struct PurchaseTokensOnSaleFixture {
    sender: AccountId,
    token_id: TokenId,
    amount: Balance,
    access_proof: Option<SaleAccessProof>,
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct PurchaseTokensOnSaleFixtureStateSnapshot {
    token_data: TokenData,
    source_account_data: AccountData,
    source_account_usable_joy_balance: <Test as balances::Trait>::Balance,
    buyer_account_data: AccountData,
    buyer_vesting_schedule: Option<VestingSchedule>,
}

impl PurchaseTokensOnSaleFixture {
    pub fn default() -> Self {
        Self {
            sender: OTHER_ACCOUNT_ID,
            token_id: 1,
            amount: DEFAULT_SALE_PURCHASE_AMOUNT,
            access_proof: None,
        }
    }

    pub fn with_amount(self, amount: Balance) -> Self {
        Self { amount, ..self }
    }

    pub fn with_access_proof(self, access_proof: SaleAccessProof) -> Self {
        Self {
            access_proof: Some(access_proof),
            ..self
        }
    }
}

impl Fixture<PurchaseTokensOnSaleFixtureStateSnapshot> for PurchaseTokensOnSaleFixture {
    fn get_state_snapshot(&self) -> PurchaseTokensOnSaleFixtureStateSnapshot {
        let token_data = Token::token_info_by_id(self.token_id);
        let sale_source_account = token_data
            .last_sale
            .as_ref()
            .map_or(AccountId::default(), |s| s.tokens_source);
        let buyer_account_data =
            Token::account_info_by_token_and_account(self.token_id, self.sender);
        PurchaseTokensOnSaleFixtureStateSnapshot {
            token_data: token_data.clone(),
            source_account_data: Token::account_info_by_token_and_account(
                self.token_id,
                sale_source_account,
            ),
            source_account_usable_joy_balance: balances::Module::<Test>::usable_balance(
                sale_source_account,
            ),
            buyer_account_data: buyer_account_data.clone(),
            buyer_vesting_schedule: buyer_account_data
                .vesting_schedules
                .get(&VestingSource::Sale(token_data.sales_initialized))
                .map(|v| v.clone()),
        }
    }

    fn execute_call(&self) -> DispatchResult {
        Token::purchase_tokens_on_sale(
            Origin::signed(self.sender),
            self.token_id,
            self.amount,
            self.access_proof.clone(),
        )
    }

    fn on_success(
        &self,
        snapshot_pre: &PurchaseTokensOnSaleFixtureStateSnapshot,
        snapshot_post: &PurchaseTokensOnSaleFixtureStateSnapshot,
    ) {
        // event emitted
        last_event_eq!(RawEvent::TokensPurchasedOnSale(
            self.token_id,
            snapshot_pre.token_data.sales_initialized,
            self.amount,
            self.sender
        ));
        let sale_pre = snapshot_pre.token_data.last_sale.clone().unwrap();
        // `quantity_left` decreased
        assert_eq!(
            snapshot_post.token_data.last_sale.clone().unwrap(),
            TokenSale {
                quantity_left: sale_pre.quantity_left.saturating_sub(self.amount),
                ..sale_pre.clone()
            }
        );
        // source account's JOY balance increased
        assert_eq!(
            snapshot_post.source_account_usable_joy_balance,
            snapshot_pre
                .source_account_usable_joy_balance
                .saturating_add(self.amount * sale_pre.unit_price)
        );
        // buyer's vesting schedule is correct
        let purchase_vesting_schedule = sale_pre.get_vesting_schedule(self.amount);
        assert_eq!(
            snapshot_post
                .buyer_vesting_schedule
                .as_ref()
                .unwrap()
                .clone(),
            VestingSchedule {
                cliff_amount: snapshot_pre
                    .buyer_vesting_schedule
                    .as_ref()
                    .map_or(0, |vs| vs.cliff_amount)
                    .saturating_add(purchase_vesting_schedule.cliff_amount),
                duration: purchase_vesting_schedule.duration,
                post_cliff_total_amount: snapshot_pre
                    .buyer_vesting_schedule
                    .as_ref()
                    .map_or(0, |vs| vs.post_cliff_total_amount)
                    .saturating_add(purchase_vesting_schedule.post_cliff_total_amount),
                start_block: purchase_vesting_schedule.start_block
            }
        );
        // buyer's transferrable balance is unchanged
        assert_eq!(
            snapshot_post
                .buyer_account_data
                .transferrable::<Test>(System::block_number()),
            snapshot_pre
                .buyer_account_data
                .transferrable::<Test>(System::block_number())
        );
    }
}

pub struct RecoverUnsoldTokensFixture {
    origin: Origin,
    token_id: TokenId,
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct RecoverUnsoldTokensFixtureStateSnapshot {
    token_data: TokenData,
    source_account_data: AccountData,
}

impl RecoverUnsoldTokensFixture {
    pub fn default() -> Self {
        Self {
            token_id: 1,
            origin: Origin::signed(DEFAULT_ACCOUNT_ID),
        }
    }
}

impl Fixture<RecoverUnsoldTokensFixtureStateSnapshot> for RecoverUnsoldTokensFixture {
    fn get_state_snapshot(&self) -> RecoverUnsoldTokensFixtureStateSnapshot {
        let token_data = Token::token_info_by_id(self.token_id);
        let sale_source_acc = token_data
            .last_sale
            .as_ref()
            .map_or(AccountId::default(), |s| s.tokens_source);
        RecoverUnsoldTokensFixtureStateSnapshot {
            token_data: Token::token_info_by_id(self.token_id),
            source_account_data: Token::account_info_by_token_and_account(
                self.token_id,
                &sale_source_acc,
            ),
        }
    }

    fn execute_call(&self) -> DispatchResult {
        Token::recover_unsold_tokens(self.origin.clone(), self.token_id)
    }

    fn on_success(
        &self,
        snapshot_pre: &RecoverUnsoldTokensFixtureStateSnapshot,
        snapshot_post: &RecoverUnsoldTokensFixtureStateSnapshot,
    ) {
        let recovered_amount = snapshot_pre.token_data.last_sale_remaining_tokens();
        last_event_eq!(RawEvent::UnsoldTokensRecovered(
            self.token_id,
            snapshot_pre.token_data.sales_initialized,
            recovered_amount
        ));
        assert_eq!(snapshot_post.token_data.last_sale_remaining_tokens(), 0);
        // `acc.amount` and `acc.transferrable` increased by `recovered_amount`
        assert_eq!(
            snapshot_post
                .source_account_data
                .transferrable::<Test>(System::block_number()),
            snapshot_pre
                .source_account_data
                .transferrable::<Test>(System::block_number())
                .saturating_add(recovered_amount)
        );
        assert_eq!(
            snapshot_post.source_account_data.amount,
            snapshot_pre
                .source_account_data
                .amount
                .saturating_add(recovered_amount),
        )
    }
}
