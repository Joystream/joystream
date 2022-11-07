use codec::{Decode, Encode, MaxEncodedLen};
use common::{bloat_bond::RepayableBloatBond, MembershipTypes};
use frame_support::storage::bounded_btree_map::BoundedBTreeMap;
use frame_support::{
    dispatch::{fmt::Debug, DispatchError, DispatchResult},
    ensure,
    traits::Get,
};
use scale_info::TypeInfo;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_arithmetic::traits::{AtLeast32BitUnsigned, One, Saturating, Unsigned, Zero};
use sp_runtime::{
    traits::{CheckedAdd, CheckedMul, CheckedSub, Convert, Hash, UniqueSaturatedInto},
    PerThing, Permill, Perquintill, SaturatedConversion,
};
use sp_std::{
    borrow::ToOwned,
    cmp::{max, min},
    collections::btree_map::BTreeMap,
    convert::{TryFrom, TryInto},
    iter::Sum,
    vec::Vec,
};
use storage::{BagId, DataObjectCreationParameters};

// crate imports
use crate::{errors::Error, Config, RepayableBloatBondOf};

/// Source of tokens subject to vesting that were acquired by an account
/// either through purchase or during initial issuance
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, PartialOrd, Ord, TypeInfo, MaxEncodedLen)]
pub enum VestingSource {
    InitialIssuance,
    Sale(TokenSaleId),
    IssuerTransfer(u64),
}

/// Represent's account's split staking status
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, PartialOrd, Ord, TypeInfo, MaxEncodedLen)]
pub struct StakingStatus<Balance> {
    // identifier for the split
    pub(crate) split_id: RevenueSplitId,

    // The amount staked for the split
    pub(crate) amount: Balance,
}

/// Info for the account

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo, MaxEncodedLen)]
pub struct AccountData<Balance, StakingStatus, RepayableBloatBond, VestingSchedules> {
    /// Map that represents account's vesting schedules indexed by source.
    /// Account's total unvested (locked) balance at current block (b)
    /// can be calculated by summing `v.locks()` of all
    /// VestingSchedule (v) instances in the map.
    pub vesting_schedules: VestingSchedules,

    /// Represents total amount of tokens held by the account, including
    /// unvested and staked tokens.
    pub amount: Balance,

    /// Account's current split staking status
    pub split_staking_status: Option<StakingStatus>,

    /// Bloat bond (in 'JOY's) deposited into treasury upon creation of this
    /// account, returned when this account is removed
    pub bloat_bond: RepayableBloatBond,

    /// Id of the next incoming transfer that includes tokens subject to vesting
    /// (for the purpose of generating VestingSource)
    pub next_vesting_transfer_id: u64,

    /// The sum of all tokens purchased on the last sale the account participated in
    /// along with the id of that sale.
    pub last_sale_total_purchased_amount: Option<(TokenSaleId, Balance)>,
}

/// Info for the token
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Default, Debug, TypeInfo, MaxEncodedLen)]
pub struct TokenData<Balance, Hash, BlockNumber, TokenSale, RevenueSplitState, MemberId> {
    /// Creator token member id
    pub creator_member_id: MemberId,

    /// Current token's total supply (tokens_issued - tokens_burned)
    pub total_supply: Balance,

    /// Total number of tokens issued
    pub tokens_issued: Balance,

    /// Id of the next token sale
    pub next_sale_id: TokenSaleId,

    /// Current token sale (upcoming / ongoing / ended but w/ remaining tokens to recover)
    pub sale: Option<TokenSale>,

    /// Transfer policy
    pub transfer_policy: TransferPolicy<Hash>,

    /// Symbol used to identify token
    pub symbol: Hash,

    /// Patronage Information
    pub patronage_info: PatronageData<Balance, BlockNumber>,

    /// Account counter
    pub accounts_number: u64,

    /// Revenue split rate
    pub revenue_split_rate: Permill,

    /// Revenue Split state info
    pub revenue_split: RevenueSplitState,

    /// Latest Token Revenue split (active / inactive)
    pub next_revenue_split_id: RevenueSplitId,

    /// Bonding Curve functionality
    pub bonding_curve: Option<BondingCurve>,
}

/// Revenue Split State
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo, MaxEncodedLen)]
pub enum RevenueSplitState<JoyBalance, BlockNumber> {
    /// Inactive state: no split ongoing
    Inactive,

    /// Active state: split ongoing with info
    Active(RevenueSplitInfo<JoyBalance, BlockNumber>),
}

impl<JoyBalance: Saturating + Copy + Zero, BlockNumber: Copy>
    RevenueSplitState<JoyBalance, BlockNumber>
{
    pub fn ensure_inactive<T: Config>(&self) -> DispatchResult {
        ensure!(
            matches!(&self, &Self::Inactive),
            Error::<T>::RevenueSplitAlreadyActiveForToken
        );

        Ok(())
    }

    pub fn ensure_active<T: Config>(
        &self,
    ) -> Result<RevenueSplitInfo<JoyBalance, BlockNumber>, DispatchError> {
        match &self {
            RevenueSplitState::Inactive => Err(Error::<T>::RevenueSplitNotActiveForToken.into()),
            RevenueSplitState::<JoyBalance, BlockNumber>::Active(info) => Ok(info.to_owned()),
        }
    }

    pub(crate) fn activate(&mut self, allocation: JoyBalance, timeline: Timeline<BlockNumber>) {
        *self = RevenueSplitState::<_, _>::Active(RevenueSplitInfo {
            allocation,
            timeline,
            dividends_claimed: JoyBalance::zero(),
        });
    }

    pub(crate) fn deactivate(&mut self) {
        *self = RevenueSplitState::Inactive;
    }

    /// Increase dividends payed tracking variable
    pub fn account_for_dividend(&mut self, dividend: JoyBalance) {
        if let RevenueSplitState::<JoyBalance, BlockNumber>::Active(info) = self {
            info.dividends_claimed = info.dividends_claimed.saturating_add(dividend);
        }
    }
}

impl<JoyBalance, BlockNumber> Default for RevenueSplitState<JoyBalance, BlockNumber> {
    fn default() -> Self {
        RevenueSplitState::<JoyBalance, BlockNumber>::Inactive
    }
}

/// Revenue Split Information for an *Active* revenue split
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo, MaxEncodedLen)]
pub struct RevenueSplitInfo<JoyBalance, BlockNumber> {
    /// Original Allocation
    pub allocation: JoyBalance,

    /// Split timeline [start, start + duration)
    pub timeline: Timeline<BlockNumber>,

    /// Dividends payed out after staking period is over
    pub dividends_claimed: JoyBalance,
}

impl<JoyBalance: Saturating + Zero + Copy, BlockNumber: Copy>
    RevenueSplitInfo<JoyBalance, BlockNumber>
{
    /// Leftovers allocation not claimed so far
    pub fn leftovers(&self) -> JoyBalance {
        self.allocation.saturating_sub(self.dividends_claimed)
    }
}

/// Defines a range [start, start + duration)
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo, MaxEncodedLen)]
pub struct Timeline<BlockNumber> {
    pub start: BlockNumber,
    pub duration: BlockNumber,
}

impl<BlockNumber: Copy + Saturating + PartialOrd> Timeline<BlockNumber> {
    pub fn from_params(start: BlockNumber, duration: BlockNumber) -> Self {
        Timeline::<_> { start, duration }
    }

    pub fn end(&self) -> BlockNumber {
        self.start.saturating_add(self.duration)
    }

    /// Wether current block in [self.end(), INFINITY)
    pub fn is_ended(&self, current_block: BlockNumber) -> bool {
        self.end() <= current_block
    }

    /// Wether current block in [self.start, INFINITY)
    pub fn is_started(&self, current_block: BlockNumber) -> bool {
        current_block >= self.start
    }

    /// Wether current block in [self.start, self.end())
    pub fn is_ongoing(&self, current_block: BlockNumber) -> bool {
        self.is_started(current_block) && !self.is_ended(current_block)
    }
}

/// Patronage information, patronage configuration = set of values for its fields
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Default, Debug, TypeInfo, MaxEncodedLen)]
pub struct PatronageData<Balance, BlockNumber> {
    /// Patronage rate
    pub rate: BlockRate,

    /// Tally count for the outstanding credit before latest patronage config change
    pub unclaimed_patronage_tally_amount: Balance,

    /// Last block the patronage configuration was updated
    pub last_unclaimed_patronage_tally_block: BlockNumber,
}

/// Input parameters describing token transfer policy
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub enum TransferPolicyParams<WhitelistParams> {
    /// Permissionless
    Permissionless,

    /// Permissioned transfer with whitelist
    Permissioned(WhitelistParams),
}

impl<WhitelistParams> Default for TransferPolicyParams<WhitelistParams> {
    fn default() -> Self {
        Self::Permissionless
    }
}

/// The two possible transfer policies
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo, MaxEncodedLen)]
pub enum TransferPolicy<Hash> {
    /// Permissionless
    Permissionless,

    /// Permissioned transfer with whitelist commitment
    Permissioned(Hash),
}

// TransferPolicyParams => TransferPolicy conversion
impl<Hash, SingleDataObjectUploadParams>
    From<TransferPolicyParams<WhitelistParams<Hash, SingleDataObjectUploadParams>>>
    for TransferPolicy<Hash>
{
    fn from(
        params: TransferPolicyParams<WhitelistParams<Hash, SingleDataObjectUploadParams>>,
    ) -> Self {
        match params {
            TransferPolicyParams::Permissioned(whitelist_params) => {
                Self::Permissioned(whitelist_params.commitment)
            }
            TransferPolicyParams::Permissionless => Self::Permissionless,
        }
    }
}

impl<Hash> Default for TransferPolicy<Hash> {
    fn default() -> Self {
        TransferPolicy::<Hash>::Permissionless
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default, TypeInfo, MaxEncodedLen)]
pub struct VestingScheduleParams<BlockNumber> {
    // Duration of the linear vesting period
    pub linear_vesting_duration: BlockNumber,
    // Number of blocks before the linear vesting begins
    pub blocks_before_cliff: BlockNumber,
    // Initial, instantly vested amount once linear vesting begins (percentage of total amount)
    pub cliff_amount_percentage: Permill,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default, TypeInfo, MaxEncodedLen)]
pub struct VestingSchedule<BlockNumber, Balance> {
    // Block at which the linear vesting begins and cliff_amount is unlocked
    pub(crate) linear_vesting_start_block: BlockNumber,
    // Duration of the linear vesting period
    pub(crate) linear_vesting_duration: BlockNumber,
    // Amount instantly unloacked at "linear_vesting_start_block"
    pub(crate) cliff_amount: Balance,
    // Total amount to be vested linearly over "linear_vesting_duration" (after "linear_vesting_start_block")
    pub(crate) post_cliff_total_amount: Balance,
    // Amount of tokes that were "burned from" this vesting schedule
    pub(crate) burned_amount: Balance,
}

impl<BlockNumber, Balance> VestingSchedule<BlockNumber, Balance>
where
    BlockNumber: Saturating + PartialOrd + Copy,
    Balance:
        Saturating + Clone + Copy + From<u32> + Unsigned + TryInto<u32> + TryInto<u64> + Ord + Zero,
{
    /// Construct a vesting schedule from `VestingScheduleParams` and `init_block`
    ///
    /// `init_block` is a block from which to start counting remaining blocks until cliff, making:
    /// `linear_vesting_start_block = init_block + blocks_before_cliff`
    pub fn from_params(
        init_block: BlockNumber,
        amount: Balance,
        params: VestingScheduleParams<BlockNumber>,
    ) -> Self {
        let cliff_amount = params.cliff_amount_percentage * amount;
        Self {
            linear_vesting_start_block: init_block.saturating_add(params.blocks_before_cliff),
            linear_vesting_duration: params.linear_vesting_duration,
            cliff_amount,
            post_cliff_total_amount: amount.saturating_sub(cliff_amount),
            burned_amount: Balance::zero(),
        }
    }

    pub(crate) fn locks<T: Config<BlockNumber = BlockNumber, Balance = Balance>>(
        &self,
        b: BlockNumber,
    ) -> Balance {
        let end_block = self
            .linear_vesting_start_block
            .saturating_add(self.linear_vesting_duration);
        // Vesting not yet started
        if self.linear_vesting_start_block > b {
            return self.non_burned_amount();
        }
        // Vesting period is ongoing
        if end_block > b {
            let remaining_vesting_blocks = end_block.saturating_sub(b);
            let remaining_vesting_percentage = Permill::from_rational(
                T::BlockNumberToBalance::convert(remaining_vesting_blocks),
                T::BlockNumberToBalance::convert(self.linear_vesting_duration),
            );
            return (remaining_vesting_percentage * self.post_cliff_total_amount)
                .saturating_sub(self.burned_amount);
        }
        // Vesting period has finished
        Balance::zero()
    }

    pub(crate) fn is_finished(&self, b: BlockNumber) -> bool {
        self.linear_vesting_start_block
            .saturating_add(self.linear_vesting_duration)
            <= b
    }

    pub(crate) fn total_amount(&self) -> Balance {
        self.cliff_amount
            .saturating_add(self.post_cliff_total_amount)
    }

    pub(crate) fn non_burned_amount(&self) -> Balance {
        self.total_amount().saturating_sub(self.burned_amount)
    }
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub struct SingleDataObjectUploadParams<JoyBalance> {
    pub object_creation_params: DataObjectCreationParameters,
    pub expected_data_size_fee: JoyBalance,
    pub expected_data_object_state_bloat_bond: JoyBalance,
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub struct UploadContext<AccountId, BagId> {
    pub uploader_account: AccountId,
    pub bag_id: BagId,
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub struct WhitelistParams<Hash, SingleDataObjectUploadParams> {
    /// Whitelist merkle root
    pub commitment: Hash,
    /// Optional payload data to upload to storage
    pub payload: Option<SingleDataObjectUploadParams>,
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub struct TokenSaleParams<JoyBalance, Balance, BlockNumber, VestingScheduleParams> {
    /// Token's unit price in JOY
    pub unit_price: JoyBalance,
    /// Number of tokens on sale
    pub upper_bound_quantity: Balance,
    /// Optional block in the future when the sale should start (by default: starts immediately)
    pub starts_at: Option<BlockNumber>,
    /// Sale duration in blocks
    pub duration: BlockNumber,
    /// Optional vesting schedule parameters for all tokens on sale
    pub vesting_schedule_params: Option<VestingScheduleParams>,
    /// Optional total sale purchase amount cap per member
    pub cap_per_member: Option<Balance>,
    /// Optional sale metadata
    pub metadata: Option<Vec<u8>>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo, MaxEncodedLen)]
pub struct TokenSale<JoyBalance, Balance, BlockNumber, VestingScheduleParams, MemberId, AccountId> {
    /// Token's unit price in JOY
    pub unit_price: JoyBalance,
    /// Number of tokens still on sale (if any)
    pub quantity_left: Balance,
    /// Sum of all JOY tokens collected from sale participants
    pub funds_collected: JoyBalance,
    /// Account (member) that acts as the source of the tokens on sale
    pub tokens_source: MemberId,
    /// Optional sale earnings (JOY) destination account.
    /// If None: All sale earnings are burned.
    pub earnings_destination: Option<AccountId>,
    /// Block at which the sale started / will start
    pub start_block: BlockNumber,
    /// Sale duration (in blocks)
    pub duration: BlockNumber,
    /// Optional vesting schedule parameters for all tokens on sale
    pub vesting_schedule_params: Option<VestingScheduleParams>,
    /// Optional total sale purchase amount cap per member
    pub cap_per_member: Option<Balance>,
    /// Whether the sale should be automatically finalized (removed) when `quantity_left == 0`
    pub auto_finalize: bool,
}

impl<
        JoyBalance: Default,
        Balance: Default,
        BlockNumber: Default,
        VestingScheduleParams: Default,
        MemberId: Default,
        AccountId,
    > Default
    for TokenSale<JoyBalance, Balance, BlockNumber, VestingScheduleParams, MemberId, AccountId>
{
    fn default() -> Self {
        Self {
            unit_price: Default::default(),
            quantity_left: Default::default(),
            funds_collected: Default::default(),
            tokens_source: Default::default(),
            earnings_destination: None,
            start_block: Default::default(),
            duration: Default::default(),
            vesting_schedule_params: None,
            cap_per_member: Default::default(),
            auto_finalize: Default::default(),
        }
    }
}

impl<JoyBalance, Balance, BlockNumber, MemberId, AccountId>
    TokenSale<
        JoyBalance,
        Balance,
        BlockNumber,
        VestingScheduleParams<BlockNumber>,
        MemberId,
        AccountId,
    >
where
    BlockNumber: Saturating + Zero + Copy + Clone + PartialOrd,
    Balance: Saturating + Clone + Copy + From<u32> + Unsigned + TryInto<u32> + TryInto<u64> + Ord,
{
    pub(crate) fn try_from_params<T: Config>(
        params: TokenSaleParamsOf<T>,
        member_id: T::MemberId,
        earnings_destination: Option<<T as frame_system::Config>::AccountId>,
        auto_finalize: bool,
        current_block: T::BlockNumber,
    ) -> Result<TokenSaleOf<T>, DispatchError> {
        let start_block = params.starts_at.unwrap_or(current_block);

        ensure!(
            start_block >= current_block,
            Error::<T>::SaleStartingBlockInThePast
        );

        // Ensure sale duration is non-zero
        ensure!(!params.duration.is_zero(), Error::<T>::SaleDurationIsZero);

        // Ensure upper_bound_quantity is non-zero
        ensure!(
            !params.upper_bound_quantity.is_zero(),
            Error::<T>::SaleUpperBoundQuantityIsZero
        );

        // Ensure cap_per_member is non-zero
        if let Some(cap) = params.cap_per_member {
            ensure!(!cap.is_zero(), Error::<T>::SaleCapPerMemberIsZero);
        }

        // Ensure unit_price is non-zero
        ensure!(
            !params.unit_price.is_zero(),
            Error::<T>::SaleUnitPriceIsZero
        );

        Ok(TokenSale {
            start_block,
            duration: params.duration,
            unit_price: params.unit_price,
            quantity_left: params.upper_bound_quantity,
            vesting_schedule_params: params.vesting_schedule_params,
            tokens_source: member_id,
            cap_per_member: params.cap_per_member,
            earnings_destination,
            funds_collected: <T as balances::Config>::Balance::zero(),
            auto_finalize,
        })
    }

    pub(crate) fn end_block(&self) -> BlockNumber {
        self.start_block.saturating_add(self.duration)
    }

    /// Get sale's vesting_schedule based on purchase amount.
    ///
    /// If the sale has no `vesting_schedule_params` provided, returns None;
    ///
    /// If the sale has a `vesting_schedule_params` provided, returns Some with a vesting schedule
    /// constructed based on those params, with `init_block = sale.end_block()`
    /// (making `vesting_schedule.linear_vesting_start_block` equal to
    /// `sale.end_block() + sale.vesting_schedule_params.blocks_before_cliff`)
    pub(crate) fn get_vesting_schedule(
        &self,
        amount: Balance,
    ) -> Option<VestingSchedule<BlockNumber, Balance>> {
        self.vesting_schedule_params.as_ref().map(
            // Vesting schedule constructed from `sale.vesting_schedule_params`
            // with `init_block = sale.end_block()`
            |vs| {
                VestingSchedule::<BlockNumber, Balance>::from_params(
                    self.end_block(),
                    amount,
                    vs.clone(),
                )
            },
        )
    }
}

/// Represents token's bonding curve with linear pricing function y = ax + b
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Default, Encode, Decode, TypeInfo, Clone, Debug, Eq, PartialEq, MaxEncodedLen)]
pub struct BondingCurve {
    /// Slope parameter : a
    pub slope: Permill,

    /// Intercept : b
    pub intercept: Permill,

    // percentage of minted CRT to the Content Creator
    pub creator_reward: Permill,
}

pub(crate) enum BondOperation {
    Bond,
    Unbond,
}
impl BondingCurve {
    pub(crate) fn eval<T: Config>(
        &self,
        amount: <T as Config>::Balance,
        supply_pre: <T as Config>::Balance,
        bond_operation: BondOperation,
    ) -> Result<JoyBalanceOf<T>, DispatchError> {
        let amount_sq = amount
            .checked_mul(&amount)
            .ok_or(Error::<T>::ArithmeticError)?;
        let first_term = Permill::from_percent(50).mul_floor(self.slope.mul_floor(amount_sq));
        let second_term = self.intercept.mul_floor(amount);
        let mixed = amount
            .checked_mul(&supply_pre)
            .ok_or(Error::<T>::ArithmeticError)?;
        let third_term = self.slope.mul_floor(mixed);
        let res = match bond_operation {
            BondOperation::Bond => first_term
                .checked_add(&second_term)
                .ok_or(Error::<T>::ArithmeticError)?
                .checked_add(&third_term)
                .ok_or(Error::<T>::ArithmeticError)?,
            BondOperation::Unbond => second_term
                .checked_add(&third_term)
                .ok_or(Error::<T>::ArithmeticError)?
                .checked_sub(&first_term)
                .ok_or(Error::<T>::ArithmeticError)?,
        };
        Ok(res.into())
    }
}

/// Represents token's offering state
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum OfferingState<TokenSale> {
    /// Idle state
    Idle,

    /// Upcoming sale state
    UpcomingSale(TokenSale),

    /// Active sale state
    Sale(TokenSale),

    /// state for IBCO, it might get decorated with the JOY reserve
    /// amount for the token
    BondingCurve(BondingCurve),
}

impl<TokenSale> OfferingState<TokenSale> {
    pub(crate) fn of<T: crate::Config>(token: &TokenDataOf<T>) -> OfferingStateOf<T> {
        if let Some(curve) = token.bonding_curve.clone() {
            OfferingStateOf::<T>::BondingCurve(curve)
        } else {
            token
                .sale
                .as_ref()
                .map_or(OfferingStateOf::<T>::Idle, |sale| {
                    let current_block = <frame_system::Pallet<T>>::block_number();
                    if current_block < sale.start_block {
                        OfferingStateOf::<T>::UpcomingSale(sale.clone())
                    } else if current_block >= sale.start_block
                        && current_block < sale.start_block.saturating_add(sale.duration)
                    {
                        OfferingStateOf::<T>::Sale(sale.clone())
                    } else {
                        OfferingStateOf::<T>::Idle
                    }
                })
        }
    }

    pub(crate) fn ensure_idle_of<T: crate::Config>(token: &TokenDataOf<T>) -> DispatchResult {
        match Self::of::<T>(token) {
            OfferingStateOf::<T>::Idle => Ok(()),
            _ => Err(Error::<T>::TokenIssuanceNotInIdleState.into()),
        }
    }

    pub(crate) fn ensure_upcoming_sale_of<T: crate::Config>(
        token: &TokenDataOf<T>,
    ) -> Result<TokenSaleOf<T>, DispatchError> {
        match Self::of::<T>(token) {
            OfferingStateOf::<T>::UpcomingSale(sale) => Ok(sale),
            _ => Err(Error::<T>::NoUpcomingSale.into()),
        }
    }

    pub(crate) fn ensure_sale_of<T: crate::Config>(
        token: &TokenDataOf<T>,
    ) -> Result<TokenSaleOf<T>, DispatchError> {
        match Self::of::<T>(token) {
            OfferingStateOf::<T>::Sale(sale) => Ok(sale),
            _ => Err(Error::<T>::NoActiveSale.into()),
        }
    }

    pub(crate) fn ensure_bonding_curve_of<T: crate::Config>(
        token: &TokenDataOf<T>,
    ) -> Result<BondingCurve, DispatchError> {
        match Self::of::<T>(token) {
            OfferingStateOf::<T>::BondingCurve(curve) => Ok(curve),
            _ => Err(Error::<T>::NotInAmmState.into()),
        }
    }
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, PartialOrd, Ord, Debug, TypeInfo)]
pub struct TokenAllocation<Balance, VestingScheduleParams> {
    pub amount: Balance,
    pub vesting_schedule_params: Option<VestingScheduleParams>,
}

/// Input parameters for token issuance
#[derive(Encode, Decode, Clone, PartialEq, Eq, Default, Debug, TypeInfo)]
pub struct TokenIssuanceParameters<Hash, TokenAllocation, TransferPolicyParams, MemberId: Ord> {
    /// Creator Member id
    pub creator_member_id: MemberId,

    /// Initial allocation of the token
    pub initial_allocation: BTreeMap<MemberId, TokenAllocation>,

    /// Token Symbol
    pub symbol: Hash,

    /// Initial transfer policy:
    pub transfer_policy: TransferPolicyParams,

    /// Initial Patronage rate
    pub patronage_rate: YearlyRate,

    /// Revenue split rate
    pub revenue_split_rate: Permill,
}

impl<Hash, MemberId, Balance, VestingScheduleParams, SingleDataObjectUploadParams>
    TokenIssuanceParameters<
        Hash,
        TokenAllocation<Balance, VestingScheduleParams>,
        TransferPolicyParams<WhitelistParams<Hash, SingleDataObjectUploadParams>>,
        MemberId,
    >
where
    MemberId: Ord,
    Balance: Sum + Copy,
    SingleDataObjectUploadParams: Clone,
{
    pub(crate) fn get_initial_allocation_bloat_bond<JoyBalance: From<u32> + Saturating>(
        &self,
        bloat_bond: JoyBalance,
    ) -> JoyBalance {
        let accounts_len = self.initial_allocation.len() as u32;
        bloat_bond.saturating_mul(accounts_len.into())
    }

    pub(crate) fn get_whitelist_payload(&self) -> Option<SingleDataObjectUploadParams> {
        match &self.transfer_policy {
            TransferPolicyParams::Permissioned(whitelist_params) => {
                whitelist_params.payload.clone()
            }
            _ => None,
        }
    }
}

/// Utility enum used in merkle proof verification
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Copy, TypeInfo)]
pub enum MerkleSide {
    /// This element appended to the right of the subtree hash
    Right,

    /// This element appended to the left of the subtree hash
    Left,
}

/// Yearly rate used for patronage info initialization
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Copy, Default, TypeInfo)]
pub struct YearlyRate(pub Permill);

/// Block rate used for patronage accounting
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(
    Encode, Decode, Clone, PartialEq, Eq, Debug, Copy, PartialOrd, Default, TypeInfo, MaxEncodedLen,
)]
pub struct BlockRate(pub Perquintill);

/// Wrapper around a merkle proof path
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub struct MerkleProof<Hasher: Hash>(pub Vec<(Hasher::Output, MerkleSide)>);

/// Information about a payment
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub struct Payment<Balance> {
    /// Amount
    pub amount: Balance,
}

/// Information about a payment with optional vesting schedule
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub struct PaymentWithVesting<Balance, VestingScheduleParams> {
    /// Amount
    pub amount: Balance,

    /// Optional vesting schedule to be applied on the transferred tokens
    pub vesting_schedule: Option<VestingScheduleParams>,
}

impl<Balance, VestingScheduleParams> From<Payment<Balance>>
    for PaymentWithVesting<Balance, VestingScheduleParams>
{
    fn from(payment: Payment<Balance>) -> Self {
        Self {
            amount: payment.amount,
            vesting_schedule: None,
        }
    }
}

/// Represents a validated payment with additional information (ie. vesting cleanup candidate)
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub struct ValidatedPayment<PaymentWithVesting> {
    /// Original payment
    pub payment: PaymentWithVesting,

    /// Optional source (key) of the vesting schedule to be removed before
    /// the new vesting schedule can be added for the destination account
    pub vesting_cleanup_candidate: Option<VestingSource>,
}

impl<Balance, VestingScheduleParams> From<PaymentWithVesting<Balance, VestingScheduleParams>>
    for ValidatedPayment<PaymentWithVesting<Balance, VestingScheduleParams>>
{
    fn from(payment: PaymentWithVesting<Balance, VestingScheduleParams>) -> Self {
        Self {
            payment,
            vesting_cleanup_candidate: None,
        }
    }
}

impl<Balance, VestingScheduleParams>
    ValidatedPayment<PaymentWithVesting<Balance, VestingScheduleParams>>
{
    pub fn new(
        payment: PaymentWithVesting<Balance, VestingScheduleParams>,
        vesting_cleanup_candidate: Option<VestingSource>,
    ) -> Self {
        Self {
            payment,
            vesting_cleanup_candidate,
        }
    }
}

/// Wrapper around BTreeMap<MemberId, Payment>
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, TypeInfo)]
pub struct Transfers<MemberId, Payment>(pub BTreeMap<MemberId, Payment>);

/// Default trait for Merkle Side
impl Default for MerkleSide {
    fn default() -> Self {
        MerkleSide::Right
    }
}

/// Utility wrapper around existing/non existing accounts to be used with transfer etc..
#[derive(Encode, Decode, PartialEq, Eq, Debug, PartialOrd, Ord, Clone, TypeInfo)]
pub enum Validated<MemberId: Ord + Eq + Clone> {
    /// Existing account
    Existing(MemberId),

    /// Non Existing account
    NonExisting(MemberId),
}

/// Utility wrapper around existing/non existing accounts to be updated/inserted due to
/// toknes transfer
#[derive(Encode, Decode, PartialEq, Eq, Debug, PartialOrd, Ord, Clone, TypeInfo)]
pub enum ValidatedWithBloatBond<MemberId, RepayableBloatBond> {
    /// Existing account
    Existing(MemberId),

    /// Non Existing account
    NonExisting(MemberId, RepayableBloatBond),
}

// implementation

/// Default trait for OfferingState
impl<TokenSale> Default for OfferingState<TokenSale> {
    fn default() -> Self {
        OfferingState::Idle
    }
}

/// Default trait for InitialAllocation
impl<Balance: Zero, VestingScheduleParams> Default
    for TokenAllocation<Balance, VestingScheduleParams>
{
    fn default() -> Self {
        TokenAllocation {
            amount: Balance::zero(),
            vesting_schedule_params: None,
        }
    }
}

/// Default trait for AccountData
impl<Balance: Zero, StakingStatus, RepayableBloatBond: Default, VestingSchedules: Default> Default
    for AccountData<Balance, StakingStatus, RepayableBloatBond, VestingSchedules>
{
    fn default() -> Self {
        Self {
            vesting_schedules: VestingSchedules::default(),
            split_staking_status: None,
            amount: Balance::zero(),
            bloat_bond: RepayableBloatBond::default(),
            next_vesting_transfer_id: 0,
            last_sale_total_purchased_amount: None,
        }
    }
}

/// Helper for ConfigAccountData -> AccountData conversion
impl<Balance, StakingStatus, RepayableBloatBond, VestingSchedule, MaxVestingSchedules>
    TryFrom<
        AccountData<
            Balance,
            StakingStatus,
            RepayableBloatBond,
            BTreeMap<VestingSource, VestingSchedule>,
        >,
    >
    for AccountData<
        Balance,
        StakingStatus,
        RepayableBloatBond,
        BoundedBTreeMap<VestingSource, VestingSchedule, MaxVestingSchedules>,
    >
where
    MaxVestingSchedules: Get<u32>,
{
    type Error = ();

    fn try_from(
        data: AccountData<
            Balance,
            StakingStatus,
            RepayableBloatBond,
            BTreeMap<VestingSource, VestingSchedule>,
        >,
    ) -> Result<Self, Self::Error> {
        let converted = Self {
            vesting_schedules: data.vesting_schedules.try_into().map_err(|_| ())?,
            split_staking_status: data.split_staking_status,
            amount: data.amount,
            bloat_bond: data.bloat_bond,
            next_vesting_transfer_id: data.next_vesting_transfer_id,
            last_sale_total_purchased_amount: data.last_sale_total_purchased_amount,
        };
        Ok(converted)
    }
}

impl<Balance: Default + Zero, RepayableBloatBond: Default, VestingSchedulesMap: Default>
    AccountData<Balance, StakingStatus<Balance>, RepayableBloatBond, VestingSchedulesMap>
{
    pub fn new_with_amount_and_bond(amount: Balance, bloat_bond: RepayableBloatBond) -> Self {
        Self {
            amount,
            bloat_bond,
            ..Self::default()
        }
    }
}

impl<Balance, BlockNumber, RepayableBloatBond, MaxVestingSchedules>
    AccountData<
        Balance,
        StakingStatus<Balance>,
        RepayableBloatBond,
        BoundedBTreeMap<VestingSource, VestingSchedule<BlockNumber, Balance>, MaxVestingSchedules>,
    >
where
    Balance: Clone
        + Zero
        + From<u32>
        + TryInto<u32>
        + Unsigned
        + Saturating
        + Sum
        + PartialOrd
        + Ord
        + TryInto<u64>
        + Copy,
    BlockNumber: Copy + Clone + PartialOrd + Ord + Saturating + From<u32> + Unsigned,
    RepayableBloatBond: Default,
    MaxVestingSchedules: Get<u32>,
{
    pub fn new_with_vesting_and_bond<T: Config>(
        source: VestingSource,
        schedule: VestingSchedule<BlockNumber, Balance>,
        bloat_bond: RepayableBloatBond,
    ) -> Result<Self, DispatchError> {
        let next_vesting_transfer_id = if let VestingSource::IssuerTransfer(_) = source {
            1
        } else {
            0
        };
        let vesting_schedules = [(source, schedule.clone())]
            .iter()
            .cloned()
            .collect::<BTreeMap<_, _>>()
            .try_into()
            .map_err(|_| Error::<T>::MaxVestingSchedulesPerAccountPerTokenReached)?;
        Ok(Self {
            amount: schedule.total_amount(),
            vesting_schedules,
            bloat_bond,
            next_vesting_transfer_id,
            ..Self::default()
        })
    }

    /// Check whether an account is empty
    pub fn is_empty(&self) -> bool {
        self.amount.is_zero()
    }

    /// Calculate account's unvested balance at block `b`
    pub fn unvested<T: Config<Balance = Balance, BlockNumber = BlockNumber>>(
        &self,
        b: BlockNumber,
    ) -> Balance {
        self.vesting_schedules
            .as_ref()
            .values()
            .map(|vs| vs.locks::<T>(b))
            .sum()
    }

    /// Ensure user is a valid revenue split participant, namely:
    /// - staking status is Some
    pub fn ensure_account_is_valid_split_participant<T: Config>(
        &self,
    ) -> Result<StakingStatus<Balance>, DispatchError> {
        self.split_staking_status
            .clone()
            .ok_or_else(|| Error::<T>::UserNotParticipantingInAnySplit.into())
    }

    /// Determine Wether user can stake `amount` of tokens
    pub fn ensure_can_stake<T: Config>(
        self,
        to_stake: Balance,
        next_split_id: RevenueSplitId,
    ) -> DispatchResult {
        if let Some(split_info) = self.split_staking_status {
            ensure!(
                split_info.split_id < next_split_id.saturating_sub(1),
                Error::<T>::UserAlreadyParticipating,
            );
        }

        ensure!(
            self.amount >= to_stake,
            Error::<T>::InsufficientBalanceForSplitParticipation
        );
        Ok(())
    }

    /// Set self.staking_status to Some(..)
    pub fn stake(&mut self, split_id: RevenueSplitId, amount: Balance) {
        self.split_staking_status = Some(StakingStatus { split_id, amount });
    }

    /// Set self.staking status to None
    pub fn unstake(&mut self) {
        self.split_staking_status = None;
    }

    /// Calculate account's transferrable balance at block `b`
    pub fn transferrable<T: Config<Balance = Balance, BlockNumber = BlockNumber>>(
        &self,
        b: BlockNumber,
    ) -> Balance {
        self.amount
            .saturating_sub(max(self.unvested::<T>(b), self.staked()))
    }

    pub fn staked(&self) -> Balance {
        self.split_staking_status
            .as_ref()
            .map_or(Balance::zero(), |info| info.amount)
    }

    pub fn ensure_can_add_or_update_vesting_schedule<
        T: Config<Balance = Balance, BlockNumber = BlockNumber>,
    >(
        &self,
        b: BlockNumber,
        source: VestingSource,
    ) -> Result<Option<VestingSource>, DispatchError> {
        let new_entry_required = !self.vesting_schedules.as_ref().contains_key(&source);
        let cleanup_required = self.vesting_schedules.as_ref().len()
            == T::MaxVestingSchedulesPerAccountPerToken::get() as usize;
        let cleanup_candidate = self
            .vesting_schedules
            .as_ref()
            .iter()
            .find(|(_, schedule)| schedule.is_finished(b))
            .map(|(key, _)| key.clone());

        if new_entry_required && cleanup_required && cleanup_candidate.is_none() {
            return Err(Error::<T>::MaxVestingSchedulesPerAccountPerTokenReached.into());
        }

        if cleanup_required {
            Ok(cleanup_candidate)
        } else {
            Ok(None)
        }
    }

    pub fn add_or_update_vesting_schedule<T: Config>(
        &mut self,
        source: VestingSource,
        new_schedule: VestingSchedule<BlockNumber, Balance>,
        cleanup_candidate: Option<VestingSource>,
    ) -> Result<(), DispatchError> {
        let existing_schedule = self.vesting_schedules.get_mut(&source);

        if let VestingSource::IssuerTransfer(_) = source {
            self.next_vesting_transfer_id = self.next_vesting_transfer_id.saturating_add(1);
        }

        if let Some(vs) = existing_schedule {
            // Update existing schedule - increase amounts
            vs.cliff_amount = vs.cliff_amount.saturating_add(new_schedule.cliff_amount);
            vs.post_cliff_total_amount = vs
                .post_cliff_total_amount
                .saturating_add(new_schedule.post_cliff_total_amount);
        } else {
            // Perform cleanup if needed
            if let Some(key) = cleanup_candidate {
                self.vesting_schedules.remove(&key);
            }

            // Insert new vesting schedule
            self.vesting_schedules
                .try_insert(source, new_schedule.clone())
                .map_err(|_| Error::<T>::MaxVestingSchedulesPerAccountPerTokenReached)?;
        }

        self.increase_amount_by(new_schedule.total_amount());

        Ok(())
    }

    /// Increase account's total tokens amount by given amount
    pub fn increase_amount_by(&mut self, amount: Balance) {
        self.amount = self.amount.saturating_add(amount);
    }

    /// Decrease account's total tokens amount by given amount
    pub fn decrease_amount_by(&mut self, amount: Balance) {
        self.amount = self.amount.saturating_sub(amount);
    }

    /// Ensure that given amount of tokens can be transferred from the account at block `b`
    pub fn ensure_can_transfer<T: Config<Balance = Balance, BlockNumber = BlockNumber>>(
        &self,
        b: BlockNumber,
        amount: Balance,
    ) -> DispatchResult {
        ensure!(
            self.transferrable::<T>(b) >= amount,
            crate::Error::<T>::InsufficientTransferrableBalance,
        );
        Ok(())
    }

    /// Process changes related to new sale purchase
    pub fn process_sale_purchase<T: Config>(
        &mut self,
        sale_id: TokenSaleId,
        amount: Balance,
        vesting_schedule: Option<VestingSchedule<BlockNumber, Balance>>,
        vesting_cleanup_key: Option<VestingSource>,
    ) -> Result<&mut Self, DispatchError> {
        if let Some(vs) = vesting_schedule {
            self.add_or_update_vesting_schedule::<T>(
                VestingSource::Sale(sale_id),
                vs,
                vesting_cleanup_key,
            )?;
        } else {
            self.increase_amount_by(amount);
        }
        self.last_sale_total_purchased_amount = match self.last_sale_total_purchased_amount {
            Some((last_sale_id, tokens_purchased)) if last_sale_id == sale_id => {
                Some((last_sale_id, tokens_purchased.saturating_add(amount)))
            }
            _ => Some((sale_id, amount)),
        };

        Ok(self)
    }

    /// Burn a specified amount of tokens belonging to the account
    pub fn burn<T: Config<Balance = Balance, BlockNumber = BlockNumber>>(
        &mut self,
        amount: Balance,
        b: BlockNumber,
    ) -> Result<(), DispatchError> {
        // Burn tokens starting from those subject to vesting
        let mut unprocessed = amount;
        self.vesting_schedules = self
            .vesting_schedules
            .as_ref()
            .iter()
            .filter_map(|(k, v)| {
                // Can only burn up to the unvested amount of tokens from given vesting schedule
                let to_be_burned = min(unprocessed, v.locks::<T>(b));
                unprocessed = unprocessed.saturating_sub(to_be_burned);
                // If the entire unvested amount is to be burned:
                //   - remove the vesting schedule
                if to_be_burned == v.locks::<T>(b) {
                    None
                // Otherwise: Update the vesting schedule's `burned_amount`
                } else {
                    Some((
                        k.clone(),
                        VestingSchedule {
                            burned_amount: v.burned_amount.saturating_add(to_be_burned),
                            ..v.clone()
                        },
                    ))
                }
            })
            .collect::<BTreeMap<_, _>>()
            .try_into()
            .map_err(|_| Error::<T>::MaxVestingSchedulesPerAccountPerTokenReached)?;
        // Reduce amount of staked tokens by the burned amount
        if let Some(staking_status) = self.split_staking_status.as_mut() {
            staking_status.amount = staking_status.amount.saturating_sub(amount);
        }
        // Reduce account's total tokens amount by the burned amount
        self.decrease_amount_by(amount);

        Ok(())
    }
}
/// Token Data implementation
impl<JoyBalance, Balance, Hash, BlockNumber, VestingScheduleParams, MemberId, AccountId>
    TokenData<
        Balance,
        Hash,
        BlockNumber,
        TokenSale<JoyBalance, Balance, BlockNumber, VestingScheduleParams, MemberId, AccountId>,
        RevenueSplitState<JoyBalance, BlockNumber>,
        MemberId,
    >
where
    Balance: Zero + Copy + Saturating + Debug + From<u64> + UniqueSaturatedInto<u64> + Unsigned,
    BlockNumber: PartialOrd + Saturating + Copy + AtLeast32BitUnsigned,
    JoyBalance: Copy + Saturating + Zero,
{
    // increase total supply
    pub(crate) fn increase_supply_by(&mut self, amount: Balance) {
        self.tokens_issued = self.tokens_issued.saturating_add(amount);
        self.total_supply = self.total_supply.saturating_add(amount);
    }

    // decrease total supply
    pub(crate) fn decrease_supply_by(&mut self, amount: Balance) {
        self.total_supply = self.total_supply.saturating_sub(amount);
    }

    // ensure token supply can be modified
    pub(crate) fn ensure_can_modify_supply<T: Config>(&self) -> DispatchResult {
        ensure!(
            matches!(self.revenue_split, RevenueSplitState::Inactive),
            Error::<T>::CannotModifySupplyWhenRevenueSplitsAreActive,
        );
        Ok(())
    }

    // increment account number
    pub(crate) fn increment_accounts_number(&mut self) {
        self.accounts_number = self.accounts_number.saturating_add(1u64);
    }

    // decrement account number
    pub(crate) fn decrement_accounts_number(&mut self) {
        self.accounts_number = self.accounts_number.saturating_sub(1u64);
    }

    pub fn set_unclaimed_tally_patronage_at_block(&mut self, amount: Balance, block: BlockNumber) {
        self.patronage_info.last_unclaimed_patronage_tally_block = block;
        self.patronage_info.unclaimed_patronage_tally_amount = amount;
    }

    /// Computes: period * rate * supply + tally
    pub(crate) fn unclaimed_patronage_at_block(&self, block: BlockNumber) -> Balance {
        let blocks = block.saturating_sub(self.patronage_info.last_unclaimed_patronage_tally_block);
        let unclaimed_patronage_percent = self.patronage_info.rate.for_period(blocks);
        unclaimed_patronage_percent
            .mul_floor(self.total_supply)
            .saturating_add(self.patronage_info.unclaimed_patronage_tally_amount)
    }

    pub fn set_new_patronage_rate_at_block(&mut self, new_rate: BlockRate, block: BlockNumber) {
        // update tally according to old rate
        self.patronage_info.unclaimed_patronage_tally_amount =
            self.unclaimed_patronage_at_block(block);
        self.patronage_info.last_unclaimed_patronage_tally_block = block;
        self.patronage_info.rate = new_rate;
    }

    pub(crate) fn activate_new_revenue_split(
        &mut self,
        allocation: JoyBalance,
        timeline: Timeline<BlockNumber>,
    ) {
        self.revenue_split.activate(allocation, timeline);
        self.next_revenue_split_id = self
            .next_revenue_split_id
            .saturating_add(RevenueSplitId::one());
    }

    pub(crate) fn deactivate_revenue_split(&mut self) {
        self.revenue_split.deactivate()
    }

    pub(crate) fn from_params<T: crate::Config>(
        params: TokenIssuanceParametersOf<T>,
    ) -> Result<TokenDataOf<T>, DispatchError> {
        let current_block = <frame_system::Pallet<T>>::block_number();

        ensure!(
            !params.revenue_split_rate.is_zero(),
            Error::<T>::RevenueSplitRateIsZero
        );

        let patronage_info =
            PatronageData::<<T as Config>::Balance, <T as frame_system::Config>::BlockNumber> {
                last_unclaimed_patronage_tally_block: current_block,
                unclaimed_patronage_tally_amount: <T as Config>::Balance::zero(),
                rate: BlockRate::from_yearly_rate(params.patronage_rate, T::BlocksPerYear::get()),
            };

        let total_supply = params
            .initial_allocation
            .iter()
            .map(|(_, v)| v.amount)
            .sum();

        Ok(TokenData {
            creator_member_id: params.creator_member_id,
            symbol: params.symbol,
            total_supply,
            tokens_issued: total_supply,
            sale: None,
            transfer_policy: params.transfer_policy.into(),
            patronage_info,
            next_sale_id: 0,
            accounts_number: 0,
            revenue_split: RevenueSplitState::Inactive,
            next_revenue_split_id: 0,
            // TODO: revenue split rate might be subjected to constraints: https://github.com/Joystream/atlas/issues/2728
            revenue_split_rate: params.revenue_split_rate,
            bonding_curve: None,
        })
    }
}

impl<Hasher: Hash> MerkleProof<Hasher> {
    pub(crate) fn verify<T, S>(&self, data: &S, commit: Hasher::Output) -> DispatchResult
    where
        T: crate::Config,
        S: Encode,
    {
        let init = Hasher::hash_of(data);
        let proof_result = self.0.iter().fold(init, |acc, (hash, side)| match side {
            MerkleSide::Left => Hasher::hash_of(&(hash, acc)),
            MerkleSide::Right => Hasher::hash_of(&(acc, hash)),
        });

        ensure!(
            proof_result == commit,
            crate::Error::<T>::MerkleProofVerificationFailure,
        );

        Ok(())
    }
}

impl<MemberId, Balance, VestingScheduleParams>
    Transfers<MemberId, PaymentWithVesting<Balance, VestingScheduleParams>>
where
    Balance: Sum + Copy,
{
    pub fn total_amount(&self) -> Balance {
        self.0.iter().map(|(_, payment)| payment.amount).sum()
    }
}

impl<ValidatedAccount, Balance, VestingScheduleParams>
    Transfers<
        ValidatedAccount,
        ValidatedPayment<PaymentWithVesting<Balance, VestingScheduleParams>>,
    >
where
    Balance: Sum + Copy,
{
    pub fn total_amount(&self) -> Balance {
        self.0
            .iter()
            .map(|(_, validated_payment)| validated_payment.payment.amount)
            .sum()
    }
}

impl<MemberId, Balance, VestingScheduleParams> From<Transfers<MemberId, Payment<Balance>>>
    for Transfers<MemberId, PaymentWithVesting<Balance, VestingScheduleParams>>
where
    MemberId: Ord + Clone,
    Balance: Clone,
{
    fn from(v: Transfers<MemberId, Payment<Balance>>) -> Self {
        Self(
            v.0.iter()
                .map(|(a, p)| (a.clone(), p.clone().into()))
                .collect(),
        )
    }
}

impl<MemberId, Payment> From<Transfers<MemberId, Payment>> for BTreeMap<MemberId, Payment> {
    fn from(v: Transfers<MemberId, Payment>) -> Self {
        v.0
    }
}

/// Block Rate bare minimum impementation
impl BlockRate {
    pub fn from_yearly_rate(r: YearlyRate, blocks_per_year: u32) -> Self {
        let max_accuracy: u64 = <Permill as PerThing>::ACCURACY.into();
        BlockRate(Perquintill::from_rational(
            r.0.deconstruct().into(),
            max_accuracy.saturating_mul(blocks_per_year.into()),
        ))
    }

    pub fn to_yearly_rate_representation(self, blocks_per_year: u32) -> Perquintill {
        self.for_period(blocks_per_year)
    }

    pub fn for_period<BlockNumber>(self, blocks: BlockNumber) -> Perquintill
    where
        BlockNumber: AtLeast32BitUnsigned + Clone,
    {
        Perquintill::from_parts(self.0.deconstruct().saturating_mul(blocks.saturated_into()))
    }

    pub fn saturating_sub(self, other: Self) -> Self {
        BlockRate(self.0.saturating_sub(other.0))
    }
}

// ------ Aliases ---------------------------------------------

/// Creator token balance
pub type TokenBalanceOf<T> = <T as Config>::Balance;

/// JOY balance
pub type JoyBalanceOf<T> = <T as balances::Config>::Balance;

/// JOY balances module
pub(crate) type Joy<T> = balances::Pallet<T>;

/// Alias for Staking Status
pub(crate) type StakingStatusOf<T> = StakingStatus<<T as Config>::Balance>;

/// Alias for Account Data
pub(crate) type AccountDataOf<T> = AccountData<
    TokenBalanceOf<T>,
    StakingStatusOf<T>,
    RepayableBloatBond<<T as frame_system::Config>::AccountId, JoyBalanceOf<T>>,
    VestingSchedulesOf<T>,
>;

/// Alias for genesis config Account Data
pub(crate) type ConfigAccountDataOf<T> = AccountData<
    TokenBalanceOf<T>,
    StakingStatusOf<T>,
    RepayableBloatBond<<T as frame_system::Config>::AccountId, JoyBalanceOf<T>>,
    BTreeMap<VestingSource, VestingScheduleOf<T>>,
>;

/// Alias for Token Data
pub type TokenDataOf<T> = TokenData<
    TokenBalanceOf<T>,
    <T as frame_system::Config>::Hash,
    <T as frame_system::Config>::BlockNumber,
    TokenSaleOf<T>,
    RevenueSplitStateOf<T>,
    <T as MembershipTypes>::MemberId,
>;

/// Alias for InitialAllocation
pub type TokenAllocationOf<T> = TokenAllocation<TokenBalanceOf<T>, VestingScheduleParamsOf<T>>;

/// Alias for Token Issuance Parameters
pub type TokenIssuanceParametersOf<T> = TokenIssuanceParameters<
    <T as frame_system::Config>::Hash,
    TokenAllocationOf<T>,
    TransferPolicyParamsOf<T>,
    <T as MembershipTypes>::MemberId,
>;

/// Alias for TransferPolicyParams
pub type TransferPolicyParamsOf<T> = TransferPolicyParams<WhitelistParamsOf<T>>;

/// Alias for TransferPolicy
pub type TransferPolicyOf<T> = TransferPolicy<<T as frame_system::Config>::Hash>;

/// Alias for the Merkle Proof type
pub(crate) type MerkleProofOf<T> = MerkleProof<<T as frame_system::Config>::Hashing>;

/// Alias for VestingScheduleParams
pub type VestingScheduleParamsOf<T> =
    VestingScheduleParams<<T as frame_system::Config>::BlockNumber>;

/// Alias for VestingSchedule
pub(crate) type VestingScheduleOf<T> =
    VestingSchedule<<T as frame_system::Config>::BlockNumber, TokenBalanceOf<T>>;

/// Alias for SingleDataObjectUploadParams
pub(crate) type SingleDataObjectUploadParamsOf<T> = SingleDataObjectUploadParams<JoyBalanceOf<T>>;

/// Alias for WhitelistParams
pub type WhitelistParamsOf<T> =
    WhitelistParams<<T as frame_system::Config>::Hash, SingleDataObjectUploadParamsOf<T>>;

/// Alias for TokenSaleParams
pub type TokenSaleParamsOf<T> = TokenSaleParams<
    JoyBalanceOf<T>,
    TokenBalanceOf<T>,
    <T as frame_system::Config>::BlockNumber,
    VestingScheduleParamsOf<T>,
>;

/// Alias for TokenSale
pub(crate) type TokenSaleOf<T> = TokenSale<
    JoyBalanceOf<T>,
    TokenBalanceOf<T>,
    <T as frame_system::Config>::BlockNumber,
    VestingScheduleParamsOf<T>,
    <T as MembershipTypes>::MemberId,
    <T as frame_system::Config>::AccountId,
>;

/// Alias for OfferingState
pub(crate) type OfferingStateOf<T> = OfferingState<TokenSaleOf<T>>;

/// Alias for UploadContext
pub type UploadContextOf<T> = UploadContext<<T as frame_system::Config>::AccountId, BagId<T>>;

/// TokenSaleId
pub(crate) type TokenSaleId = u32;

/// RevenueSplitId
pub(crate) type RevenueSplitId = u32;

/// Alias for PaymentWithVesting
pub type PaymentWithVestingOf<T> =
    PaymentWithVesting<TokenBalanceOf<T>, VestingScheduleParamsOf<T>>;

/// Alias for ValidatedPayment
pub(crate) type ValidatedPaymentOf<T> = ValidatedPayment<PaymentWithVestingOf<T>>;

/// Alias for Transfers w/ Payment
pub(crate) type TransfersOf<T> =
    Transfers<<T as MembershipTypes>::MemberId, Payment<TokenBalanceOf<T>>>;

/// Alias for Transfers w/ PaymentWithVesting
pub type TransfersWithVestingOf<T> =
    Transfers<<T as MembershipTypes>::MemberId, PaymentWithVestingOf<T>>;

/// Validated transfers
/// Alias for Timeline
pub type TimelineOf<T> = Timeline<<T as frame_system::Config>::BlockNumber>;

/// Alias for Revenue Split State
pub type RevenueSplitStateOf<T> =
    RevenueSplitState<JoyBalanceOf<T>, <T as frame_system::Config>::BlockNumber>;

/// Alias for ValidatedTransfers
pub(crate) type ValidatedTransfersOf<T> =
    Transfers<Validated<<T as MembershipTypes>::MemberId>, ValidatedPaymentOf<T>>;

/// Alias for ValidatedWithBloatBond
pub(crate) type ValidatedWithBloatBondOf<T> =
    ValidatedWithBloatBond<<T as MembershipTypes>::MemberId, RepayableBloatBondOf<T>>;

/// Alias for complex type BTreeMap<MemberId, (TokenAllocation, RepayableBloatBond)>
pub(crate) type AllocationWithBloatBondsOf<T> =
    BTreeMap<<T as MembershipTypes>::MemberId, (TokenAllocationOf<T>, RepayableBloatBondOf<T>)>;

/// Alias for bounded vesting schedules map
pub type VestingSchedulesOf<T> = BoundedBTreeMap<
    VestingSource,
    VestingScheduleOf<T>,
    <T as Config>::MaxVestingSchedulesPerAccountPerToken,
>;
