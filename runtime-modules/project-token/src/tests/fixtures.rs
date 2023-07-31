#![cfg(test)]

use crate::tests::mock::*;
use crate::types::{Joy, Payment, Transfers, TransfersOf};
use crate::{
    last_event_eq, member, yearly_rate, AccountInfoByTokenAndMember, RawEvent, YearlyRate,
};
use crate::{traits::PalletToken, types::VestingSource, SymbolsUsed};
use frame_support::dispatch::DispatchResult;
use frame_support::storage::{StorageDoubleMap, StorageMap};
use sp_arithmetic::traits::One;
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
        duration: DEFAULT_SALE_DURATION,
        metadata: None,
        starts_at: None,
        unit_price: DEFAULT_SALE_UNIT_PRICE,
        upper_bound_quantity: DEFAULT_INITIAL_ISSUANCE,
        vesting_schedule_params: Some(VestingScheduleParams {
            blocks_before_cliff: 0,
            linear_vesting_duration: 100,
            cliff_amount_percentage: Permill::from_percent(0),
        }),
        cap_per_member: None,
    }
}

pub fn default_upload_context() -> UploadContext {
    UploadContext {
        bag_id: BagId::<Test>::Static(StaticBagId::Council),
        uploader_account: member!(1).1,
    }
}

#[allow(dead_code)]
pub fn default_single_data_object_upload_params() -> SingleDataObjectUploadParams {
    SingleDataObjectUploadParams {
        expected_data_size_fee: storage::Module::<Test>::data_object_per_mega_byte_fee(),
        expected_data_object_state_bloat_bond:
            storage::Module::<Test>::data_object_state_bloat_bond_value(),
        object_creation_params: DataObjectCreationParameters {
            ipfs_content_id: Vec::from_iter(0..46),
            size: 1_000_000,
        },
    }
}

pub struct IssueTokenFixture {
    issuer_account: AccountId,
    params: IssuanceParams,
    upload_context: UploadContext,
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct IssueTokenFixtureStateSnapshot {
    next_token_id: u64,
}

impl IssueTokenFixture {
    pub fn default() -> Self {
        Self {
            issuer_account: member!(1).1,
            params: IssuanceParams {
                patronage_rate: yearly_rate!(0),
                symbol: Hashing::hash_of(b"ABC"),
                transfer_policy: TransferPolicyParams::Permissionless,
                revenue_split_rate: DEFAULT_SPLIT_RATE,
                ..Default::default()
            }
            .with_allocation(&member!(1).0, DEFAULT_INITIAL_ISSUANCE, None),
            upload_context: default_upload_context(),
        }
    }

    pub fn with_transfer_policy(self, transfer_policy: TransferPolicyParams) -> Self {
        Self {
            params: IssuanceParams {
                transfer_policy,
                ..self.params
            },
            ..self
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
        Token::issue_token(
            self.issuer_account.clone(),
            self.params.clone(),
            self.upload_context.clone(),
        )
        .map(|_| ())
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
                accounts_number: self.params.initial_allocation.len() as u64,
                ..TokenData::from_params::<Test>(self.params.clone()).unwrap()
            }
        );
        assert!(SymbolsUsed::<Test>::contains_key(self.params.symbol));
        // Event emitted
        last_event_eq!(RawEvent::TokenIssued(
            snapshot_pre.next_token_id,
            self.params.clone()
        ));
    }
}

pub struct InitTokenSaleFixture {
    token_id: TokenId,
    member_id: MemberId,
    earnings_destination: Option<AccountId>,
    auto_finalize: bool,
    params: TokenSaleParams,
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
            member_id: member!(1).0,
            earnings_destination: Some(member!(1).1),
            auto_finalize: true,
            params: default_token_sale_params(),
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

    pub fn with_duration(self, duration: BlockNumber) -> Self {
        Self {
            params: TokenSaleParams {
                duration,
                ..self.params
            },
            ..self
        }
    }

    pub fn with_member_id(self, member_id: MemberId) -> Self {
        Self { member_id, ..self }
    }

    pub fn with_earnings_destination(self, earnings_destination: Option<AccountId>) -> Self {
        Self {
            earnings_destination,
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

    pub fn with_vesting_schedule_params(
        self,
        vesting_schedule_params: Option<VestingScheduleParams>,
    ) -> Self {
        Self {
            params: TokenSaleParams {
                vesting_schedule_params,
                ..self.params
            },
            ..self
        }
    }

    pub fn with_cap_per_member(self, cap_per_member: Balance) -> Self {
        Self {
            params: TokenSaleParams {
                cap_per_member: Some(cap_per_member),
                ..self.params
            },
            ..self
        }
    }

    pub fn with_unit_price(self, unit_price: Balance) -> Self {
        Self {
            params: TokenSaleParams {
                unit_price,
                ..self.params
            },
            ..self
        }
    }

    pub fn with_auto_finalize(self, auto_finalize: bool) -> Self {
        Self {
            auto_finalize,
            ..self
        }
    }
}

impl Fixture<InitTokenSaleFixtureStateSnapshot> for InitTokenSaleFixture {
    fn get_state_snapshot(&self) -> InitTokenSaleFixtureStateSnapshot {
        InitTokenSaleFixtureStateSnapshot {
            token_data: Token::token_info_by_id(self.token_id),
            next_data_object_id: storage::Module::<Test>::next_data_object_id(),
            source_account_data: Token::account_info_by_token_and_member(
                self.token_id,
                self.member_id,
            ),
        }
    }

    fn execute_call(&self) -> DispatchResult {
        Token::init_token_sale(
            self.token_id,
            self.member_id,
            self.earnings_destination,
            self.auto_finalize,
            self.params.clone(),
        )
    }

    fn on_success(
        &self,
        snapshot_pre: &InitTokenSaleFixtureStateSnapshot,
        snapshot_post: &InitTokenSaleFixtureStateSnapshot,
    ) {
        let execution_block = System::block_number();

        // Token's `last_sale` updated
        assert_eq!(
            snapshot_post.token_data.sale,
            Some(
                TokenSale::try_from_params::<Test>(
                    self.params.clone(),
                    self.member_id,
                    self.earnings_destination,
                    self.auto_finalize,
                    execution_block
                )
                .unwrap()
            )
        );

        // Token's `next_sale_id` updated
        assert_eq!(
            snapshot_post.token_data.next_sale_id,
            snapshot_pre.token_data.next_sale_id.saturating_add(1)
        );

        // Token state is valid
        let sale = snapshot_post.token_data.sale.clone().unwrap();
        assert_eq!(
            IssuanceState::of::<Test>(&snapshot_post.token_data),
            if let Some(start_block) = self.params.starts_at {
                if System::block_number() < start_block {
                    IssuanceState::UpcomingSale(sale.clone())
                } else {
                    IssuanceState::Sale(sale.clone())
                }
            } else {
                IssuanceState::Sale(sale.clone())
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

        // Event emitted
        last_event_eq!(RawEvent::TokenSaleInitialized(
            self.token_id,
            snapshot_pre.token_data.next_sale_id,
            sale,
            self.params.metadata.clone()
        ));
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
        // Token's `sale` updated
        let sale_pre = snapshot_pre.token_data.sale.clone().unwrap();
        assert_eq!(
            snapshot_post.token_data.sale.clone().unwrap(),
            TokenSale {
                duration: self.new_duration.unwrap_or(sale_pre.duration),
                start_block: self.new_start_block.unwrap_or(sale_pre.start_block),
                ..sale_pre
            }
        );
        // Event emitted
        last_event_eq!(RawEvent::UpcomingTokenSaleUpdated(
            self.token_id,
            snapshot_post.token_data.next_sale_id - 1,
            self.new_start_block.clone(),
            self.new_duration.clone()
        ));
    }
}

pub struct PurchaseTokensOnSaleFixture {
    sender: AccountId,
    token_id: TokenId,
    member_id: MemberId,
    amount: Balance,
    sale_source_member_id: Option<MemberId>,
    earnings_dst_account: Option<AccountId>,
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct PurchaseTokensOnSaleFixtureStateSnapshot {
    token_data: TokenData,
    source_account_data: AccountData,
    earnings_dst_account_usable_joy_balance: JoyBalance,
    buyer_account_data: AccountData,
    buyer_vesting_schedule: Option<VestingSchedule>,
    buyer_account_exists: bool,
    buyer_usable_joy_balance: JoyBalance,
    treasury_usable_joy_balance: JoyBalance,
    joy_total_supply: JoyBalance,
}

impl PurchaseTokensOnSaleFixture {
    pub fn default() -> Self {
        let token_id = 1;
        let token_data = Token::token_info_by_id(token_id);
        Self {
            sender: member!(2).1,
            token_id,
            member_id: member!(2).0,
            amount: DEFAULT_SALE_PURCHASE_AMOUNT,
            sale_source_member_id: token_data.sale.as_ref().map(|s| s.tokens_source),
            earnings_dst_account: token_data
                .sale
                .as_ref()
                .map(|s| s.earnings_destination)
                .flatten(),
        }
    }

    pub fn with_amount(self, amount: Balance) -> Self {
        Self { amount, ..self }
    }

    pub fn with_sender(self, sender: AccountId) -> Self {
        Self { sender, ..self }
    }

    pub fn with_member_id(self, member_id: MemberId) -> Self {
        Self { member_id, ..self }
    }
}

impl Fixture<PurchaseTokensOnSaleFixtureStateSnapshot> for PurchaseTokensOnSaleFixture {
    fn get_state_snapshot(&self) -> PurchaseTokensOnSaleFixtureStateSnapshot {
        let token_data = Token::token_info_by_id(self.token_id);

        let buyer_account_data =
            Token::account_info_by_token_and_member(self.token_id, self.member_id);
        PurchaseTokensOnSaleFixtureStateSnapshot {
            token_data: token_data.clone(),
            source_account_data: self
                .sale_source_member_id
                .map_or(AccountData::default(), |m_id| {
                    Token::account_info_by_token_and_member(self.token_id, m_id)
                }),
            earnings_dst_account_usable_joy_balance: self
                .earnings_dst_account
                .map_or(0, |dst| Joy::<Test>::usable_balance(dst)),
            buyer_account_data: buyer_account_data.clone(),
            buyer_account_exists: AccountInfoByTokenAndMember::<Test>::contains_key(
                self.token_id,
                &self.member_id,
            ),
            buyer_vesting_schedule: buyer_account_data
                .vesting_schedules
                .get(&VestingSource::Sale(
                    token_data.next_sale_id.saturating_sub(1),
                ))
                .map(|v| v.clone()),
            buyer_usable_joy_balance: Joy::<Test>::usable_balance(self.sender),
            treasury_usable_joy_balance: Joy::<Test>::usable_balance(
                Token::module_treasury_account(),
            ),
            joy_total_supply: Joy::<Test>::total_issuance(),
        }
    }

    fn execute_call(&self) -> DispatchResult {
        Token::purchase_tokens_on_sale(
            RuntimeOrigin::signed(self.sender),
            self.token_id,
            self.member_id,
            self.amount,
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
            snapshot_pre.token_data.next_sale_id - 1,
            self.amount,
            self.member_id
        ));
        let platform_fee = Token::sale_platform_fee();
        let sale_pre = snapshot_pre.token_data.sale.clone().unwrap();
        let joy_amount = self.amount * sale_pre.unit_price;
        let fee_amount = platform_fee.mul_floor(joy_amount);

        let expected_quantity_left = sale_pre.quantity_left.saturating_sub(self.amount);
        if sale_pre.auto_finalize && expected_quantity_left == 0 {
            // Sale removed
            assert!(snapshot_post.token_data.sale.is_none());
        } else {
            // `quantity_left` decreased and `funds_collected` increased
            assert_eq!(
                snapshot_post.token_data.sale.clone().unwrap(),
                TokenSale {
                    quantity_left: expected_quantity_left,
                    funds_collected: sale_pre.funds_collected.saturating_add(joy_amount),
                    ..sale_pre.clone()
                }
            );
        }

        if self.earnings_dst_account.is_some() {
            // Earnings dst specified: destination account's JOY balance increased
            assert_eq!(
                snapshot_post.earnings_dst_account_usable_joy_balance,
                snapshot_pre
                    .earnings_dst_account_usable_joy_balance
                    .saturating_add(joy_amount)
                    .saturating_sub(fee_amount)
            );
            // Platform fee burned
            assert_eq!(
                snapshot_post.joy_total_supply,
                snapshot_pre.joy_total_supply.saturating_sub(fee_amount)
            );
        } else {
            // Earnings dst not specified: All joy burned
            assert_eq!(
                snapshot_post.joy_total_supply,
                snapshot_pre.joy_total_supply.saturating_sub(joy_amount),
            );
        }

        if let Some(vesting_schedule) = snapshot_pre
            .token_data
            .sale
            .as_ref()
            .unwrap()
            .get_vesting_schedule(self.amount)
        {
            // buyer's vesting schedule is correct
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
                        .saturating_add(vesting_schedule.cliff_amount),
                    linear_vesting_duration: vesting_schedule.linear_vesting_duration,
                    post_cliff_total_amount: snapshot_pre
                        .buyer_vesting_schedule
                        .as_ref()
                        .map_or(0, |vs| vs.post_cliff_total_amount)
                        .saturating_add(vesting_schedule.post_cliff_total_amount),
                    linear_vesting_start_block: vesting_schedule.linear_vesting_start_block,
                    burned_amount: 0
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
        } else {
            // buyer's transferrable balance is increased
            assert_eq!(
                snapshot_post
                    .buyer_account_data
                    .transferrable::<Test>(System::block_number()),
                snapshot_pre
                    .buyer_account_data
                    .transferrable::<Test>(System::block_number())
                    .saturating_add(self.amount)
            );
        }
        // last_sale_purchased_amount is increased
        let sale_id = snapshot_pre.token_data.next_sale_id - 1;
        assert_eq!(
            snapshot_post
                .buyer_account_data
                .last_sale_total_purchased_amount,
            Some((
                sale_id,
                match snapshot_pre
                    .buyer_account_data
                    .last_sale_total_purchased_amount
                {
                    Some((last_sale_id, tokens_purchased)) if last_sale_id == sale_id => {
                        tokens_purchased.saturating_add(self.amount)
                    }
                    _ => self.amount,
                }
            ))
        );
        // new account case
        if !snapshot_pre.buyer_account_exists {
            // buyer's joy balance is decreased by bloat_bond + tokens price
            assert_eq!(
                snapshot_post.buyer_usable_joy_balance,
                snapshot_pre
                    .buyer_usable_joy_balance
                    .saturating_sub(Token::bloat_bond())
                    .saturating_sub(joy_amount)
            );
            // treasury account balance is increased by bloat_bond
            assert_eq!(
                snapshot_post.treasury_usable_joy_balance,
                snapshot_pre
                    .treasury_usable_joy_balance
                    .saturating_add(Token::bloat_bond())
            );
            // token_data.accounts_number increased
            assert_eq!(
                snapshot_post.token_data.accounts_number,
                snapshot_pre.token_data.accounts_number + 1
            );
        } else {
            // buyer's joy balance is decreased by tokens price
            assert_eq!(
                snapshot_post.buyer_usable_joy_balance,
                snapshot_pre
                    .buyer_usable_joy_balance
                    .saturating_sub(joy_amount)
            );
        }
    }
}

pub struct FinalizeTokenSaleFixture {
    token_id: TokenId,
    sale_source_member: Option<MemberId>,
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct FinalizeTokenSaleFixtureStateSnapshot {
    token_data: TokenData,
    source_account_data: AccountData,
}

impl FinalizeTokenSaleFixture {
    pub fn default() -> Self {
        Self {
            token_id: 1,
            sale_source_member: Token::token_info_by_id(1)
                .sale
                .as_ref()
                .map(|s| s.tokens_source),
        }
    }
}

impl Fixture<FinalizeTokenSaleFixtureStateSnapshot> for FinalizeTokenSaleFixture {
    fn get_state_snapshot(&self) -> FinalizeTokenSaleFixtureStateSnapshot {
        let sale_source_member = self.sale_source_member.unwrap_or_default();
        FinalizeTokenSaleFixtureStateSnapshot {
            token_data: Token::token_info_by_id(self.token_id),
            source_account_data: Token::account_info_by_token_and_member(
                self.token_id,
                &sale_source_member,
            ),
        }
    }

    fn execute_call(&self) -> DispatchResult {
        Token::finalize_token_sale(self.token_id).map(|_| ())
    }

    fn on_success(
        &self,
        snapshot_pre: &FinalizeTokenSaleFixtureStateSnapshot,
        snapshot_post: &FinalizeTokenSaleFixtureStateSnapshot,
    ) {
        let sale_pre = snapshot_pre.token_data.sale.as_ref().unwrap();
        last_event_eq!(RawEvent::TokenSaleFinalized(
            self.token_id,
            snapshot_pre.token_data.next_sale_id - 1,
            sale_pre.quantity_left,
            sale_pre.funds_collected
        ));
        assert!(snapshot_post.token_data.sale.is_none());
        // `acc.amount` and `acc.transferrable` increased by `sale_pre.quantity_left`
        assert_eq!(
            snapshot_post
                .source_account_data
                .transferrable::<Test>(System::block_number()),
            snapshot_pre
                .source_account_data
                .transferrable::<Test>(System::block_number())
                .saturating_add(sale_pre.quantity_left)
        );
        assert_eq!(
            snapshot_post.source_account_data.amount,
            snapshot_pre
                .source_account_data
                .amount
                .saturating_add(sale_pre.quantity_left),
        )
    }
}

/// Issue Revenue Split Fixture
pub struct IssueRevenueSplitFixture {
    token_id: TokenId,
    start: Option<BlockNumber>,
    duration: BlockNumber,
    revenue_source_account: AccountId,
    revenue_amount: JoyBalance,
}

impl IssueRevenueSplitFixture {
    pub fn default() -> Self {
        Self {
            token_id: TokenId::one(),
            start: None,
            duration: BlockNumber::from(DEFAULT_SPLIT_DURATION),
            revenue_source_account: member!(1).1,
            revenue_amount: Balance::from(DEFAULT_SPLIT_REVENUE),
        }
    }

    pub fn with_starting_block(self, start: u64) -> Self {
        Self {
            start: Some(start.into()),
            ..self
        }
    }

    pub fn with_duration(self, duration: u64) -> Self {
        Self {
            duration: duration.into(),
            ..self
        }
    }

    pub fn with_revenue_amount(self, amount: u128) -> Self {
        Self {
            revenue_amount: amount.into(),
            ..self
        }
    }

    pub fn with_revenue_source_account(self, account: u64) -> Self {
        Self {
            revenue_source_account: account.into(),
            ..self
        }
    }

    pub fn execute_call(&self) -> Result<JoyBalance, DispatchError> {
        let state_pre = sp_io::storage::root(sp_storage::StateVersion::V1);
        let result = Token::issue_revenue_split(
            self.token_id,
            self.start,
            self.duration,
            self.revenue_source_account,
            self.revenue_amount,
        );
        let state_post = sp_io::storage::root(sp_storage::StateVersion::V1);

        // no-op in case of error
        if result.is_err() {
            assert_eq!(state_pre, state_post)
        }

        result
    }
}

/// Finalize Revenue Split
pub struct FinalizeRevenueSplitFixture {
    token_id: TokenId,
    account_id: AccountId,
}

impl FinalizeRevenueSplitFixture {
    pub fn default() -> Self {
        Self {
            token_id: TokenId::one(),
            account_id: member!(1).1,
        }
    }

    pub fn with_token_id(self, id: u64) -> Self {
        Self {
            token_id: id.into(),
            ..self
        }
    }

    pub fn execute_call(&self) -> DispatchResult {
        let state_pre = sp_io::storage::root(sp_storage::StateVersion::V1);
        let result = Token::finalize_revenue_split(self.token_id, self.account_id);
        let state_post = sp_io::storage::root(sp_storage::StateVersion::V1);

        // no-op in case of error
        if result.is_err() {
            assert_eq!(state_pre, state_post)
        }

        result
    }
}

pub struct ParticipateInSplitFixture {
    sender: AccountId,
    token_id: TokenId,
    member_id: MemberId,
    amount: Balance,
}

impl ParticipateInSplitFixture {
    pub fn default() -> Self {
        Self {
            sender: member!(2).1,
            token_id: TokenId::one(),
            member_id: member!(2).0,
            amount: DEFAULT_SPLIT_PARTICIPATION.into(),
        }
    }

    pub fn with_amount(self, amount: u128) -> Self {
        Self {
            amount: amount.into(),
            ..self
        }
    }

    pub fn with_token_id(self, token_id: u64) -> Self {
        Self {
            token_id: token_id.into(),
            ..self
        }
    }

    pub fn with_sender(self, account_id: u64) -> Self {
        Self {
            sender: account_id.into(),
            ..self
        }
    }

    pub fn with_member_id(self, member_id: u64) -> Self {
        Self { member_id, ..self }
    }

    pub fn execute_call(&self) -> DispatchResult {
        let state_pre = sp_io::storage::root(sp_storage::StateVersion::V1);
        let result = Token::participate_in_split(
            RuntimeOrigin::signed(self.sender),
            self.token_id,
            self.member_id,
            self.amount,
        );
        let state_post = sp_io::storage::root(sp_storage::StateVersion::V1);

        // no-op in case of error
        if result.is_err() {
            assert_eq!(state_pre, state_post)
        }

        result
    }
}

pub struct TransferFixture {
    sender: AccountId,
    token_id: TokenId,
    src_member_id: MemberId,
    outputs: TransfersOf<Test>,
    metadata: Vec<u8>,
}

impl TransferFixture {
    pub fn default() -> Self {
        let outputs = Transfers::<_, _>(
            vec![(
                member!(2).0,
                Payment::<Balance> {
                    amount: DEFAULT_SPLIT_PARTICIPATION,
                },
            )]
            .into_iter()
            .collect(),
        );
        Self {
            sender: member!(1).1,
            token_id: 1u64.into(),
            src_member_id: member!(1).0,
            outputs,
            metadata: "metadata".as_bytes().to_vec(),
        }
    }

    pub fn execute_call(&self) -> DispatchResult {
        let state_pre = sp_io::storage::root(sp_storage::StateVersion::V1);
        let result = Token::transfer(
            RuntimeOrigin::signed(self.sender),
            self.src_member_id,
            self.token_id,
            self.outputs.clone(),
            self.metadata.clone(),
        );
        let state_post = sp_io::storage::root(sp_storage::StateVersion::V1);

        // no-op in case of error
        if result.is_err() {
            assert_eq!(state_pre, state_post)
        }

        result
    }
}

pub struct ExitRevenueSplitFixture {
    sender: AccountId,
    token_id: TokenId,
    member_id: MemberId,
}

impl ExitRevenueSplitFixture {
    pub fn default() -> Self {
        Self {
            sender: member!(2).1,
            token_id: TokenId::one(),
            member_id: member!(2).0,
        }
    }

    pub fn with_account(self, account_id: u64) -> Self {
        Self {
            sender: account_id.into(),
            ..self
        }
    }

    pub fn with_token_id(self, token_id: u64) -> Self {
        Self {
            token_id: token_id.into(),
            ..self
        }
    }

    pub fn with_member_id(self, member_id: u64) -> Self {
        Self { member_id, ..self }
    }

    pub fn execute_call(&self) -> DispatchResult {
        let state_pre = sp_io::storage::root(sp_storage::StateVersion::V1);
        let result = Token::exit_revenue_split(
            RuntimeOrigin::signed(self.sender),
            self.token_id,
            self.member_id,
        );
        let state_post = sp_io::storage::root(sp_storage::StateVersion::V1);

        // no-op in case of error
        if result.is_err() {
            assert_eq!(state_pre, state_post)
        }

        result
    }
}
