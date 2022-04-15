use codec::{Decode, Encode};
use frame_support::{
    dispatch::{fmt::Debug, DispatchError, DispatchResult},
    ensure,
    traits::Get,
};
use sp_arithmetic::traits::{Saturating, Unsigned, Zero};
use sp_runtime::traits::{Convert, Hash};
use sp_runtime::Permill;
use sp_std::{
    cmp::min,
    collections::btree_map::{BTreeMap, Iter},
    convert::TryInto,
    iter::Sum,
};

use storage::{BagId, DataObjectCreationParameters};

// crate imports
use crate::{errors::Error, Trait};

/// Source of tokens subject to vesting that were acquired by an account
/// either through purchase or during initial issuance
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub enum VestingSource {
    InitialIssuance,
    Sale(TokenSaleId),
}

/// Represents a balance of tokens that are subject to vesting.
/// Tokens from this balance may be "claimed" (based on the vesting schedule),
/// number of claimed tokens (`claimed_amount`) can never exceed `total_amount`.
/// Once all tokens are claimed, VestingBalance instance can be safely removed.
///
/// Currently the tokens from VestingBalance's are claimed automatically
/// when an amount beeing spend from an account exceeds its `base_balance`.
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct VestingBalance<Balance, VestingSchedule> {
    pub(crate) total_amount: Balance,
    pub(crate) vesting_schedule: VestingSchedule,
    pub(crate) claimed_amount: Balance,
}

impl<
        Balance: Copy + Clone + Zero + From<u32> + TryInto<u32> + TryInto<u64> + Unsigned + Ord + Saturating,
        BlockNumber: Copy + Clone + PartialOrd + Ord + Saturating + From<u32> + Unsigned,
    > VestingBalance<Balance, VestingSchedule<BlockNumber>>
{
    /// Returns number of tokens the account can claim from this VestingBalance
    /// at the current block.
    pub(crate) fn claimable_amount<T: Trait<Balance = Balance, BlockNumber = BlockNumber>>(
        &self,
    ) -> Balance {
        let current_block = <frame_system::Module<T>>::block_number();
        let vesting = &self.vesting_schedule;
        // Vesting not yet started
        if vesting.start_block > current_block {
            return Balance::zero();
        }
        // Vesting period is ongoing
        if vesting.start_block.saturating_add(vesting.duration) > current_block {
            let blocks_since_start = current_block.saturating_sub(vesting.start_block);
            let initial_amount = vesting.initial_liquidity * self.total_amount;
            let total_linear_amount = self.total_amount.saturating_sub(initial_amount);
            let current_linear_permill = Permill::from_rational_approximation(
                T::BlockNumberToBalance::convert(blocks_since_start),
                T::BlockNumberToBalance::convert(vesting.duration),
            );
            let linearly_vested_amount = current_linear_permill * total_linear_amount;
            return initial_amount
                .saturating_add(linearly_vested_amount)
                .saturating_sub(self.claimed_amount);
        }
        // Vesting period has finished
        self.total_amount.saturating_sub(self.claimed_amount)
    }
}

/// Info for the account
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct AccountData<VestingBalance, Balance> {
    /// Map that represents account's vesting balances indexed by source.
    /// Account's total claimable vesting balance at current block
    /// can be calculated by summing `v.claimable_amount()` of all
    /// VestingBalance (v) instances in the map.
    ///
    /// See the comment above VestingBalance type definition for more information.
    pub(crate) vesting_balances: BTreeMap<VestingSource, VestingBalance>,

    /// Represents balance that is not subject to any vesting.
    /// Together with total claimable vesting balance (based on `vesting_balances`)
    /// represents account's `total_balance`.
    pub(crate) base_balance: Balance,

    /// Number of tokens that are reserved in this account for some purpose
    /// and therefore cannot be used for any other purpose until unreserved.
    ///
    /// This amount is substracted from `total_balance` in order to get `usable_balance`.
    pub(crate) reserved_balance: Balance,
}

/// Info for the token
#[derive(Encode, Decode, Clone, PartialEq, Eq, Default, Debug)]
pub struct TokenData<Balance, Hash, BlockNumber, TokenSale> {
    /// Current token's total supply (tokens_issued - tokens_burned)
    pub(crate) total_supply: Balance,

    /// Total number of tokens issued
    pub(crate) tokens_issued: Balance,

    // TODO: Limit number of sales per token?
    /// Number of sales initialized, also serves as unique identifier
    /// of the current sale (`last_sale`) if any.
    pub(crate) sales_initialized: TokenSaleId,

    /// Last token sale (upcoming / ongoing / past)
    pub(crate) last_sale: Option<TokenSale>,

    /// Transfer policy
    pub(crate) transfer_policy: TransferPolicy<Hash>,

    /// Symbol used to identify token
    pub(crate) symbol: Hash,

    /// Patronage Information
    pub(crate) patronage_info: PatronageData<Balance, BlockNumber>,
}

/// Patronage information, patronage configuration = set of values for its fields
#[derive(Encode, Decode, Clone, PartialEq, Eq, Default, Debug)]
pub struct PatronageData<Balance, BlockNumber> {
    /// Patronage rate
    pub(crate) rate: Balance,

    /// Tally count for the outstanding credit before latest patronage config change
    pub(crate) unclaimed_patronage_tally_amount: Balance,

    /// Last block the patronage configuration was updated
    pub(crate) last_unclaimed_patronage_tally_block: BlockNumber,
}

/// The two possible transfer policies
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum TransferPolicy<Hash> {
    /// Permissionless
    Permissionless,

    /// Permissioned transfer with whitelist commitment
    Permissioned(Hash),
}

impl<Hash> Default for TransferPolicy<Hash> {
    fn default() -> Self {
        TransferPolicy::<Hash>::Permissionless
    }
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default)]
pub struct VestingScheduleParams<BlockNumber> {
    // Vesting duration
    pub(crate) duration: BlockNumber,
    // Number of blocks before the vesting begins
    pub(crate) cliff: BlockNumber,
    // Initial, instant liquiditiy once vesting begins (percentage of total amount)
    pub(crate) initial_liquidity: Permill,
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default)]
pub struct VestingSchedule<BlockNumber> {
    // Block at which the vesting begins
    pub(crate) start_block: BlockNumber,
    // Vesting duration
    pub(crate) duration: BlockNumber,
    // Initial, instant liquiditiy once vesting begins (percentage of total amount)
    pub(crate) initial_liquidity: Permill,
}

impl<BlockNumber: Saturating> VestingSchedule<BlockNumber> {
    pub(crate) fn from_params(
        init_block: BlockNumber,
        params: VestingScheduleParams<BlockNumber>,
    ) -> Self {
        Self {
            start_block: init_block.saturating_add(params.cliff),
            duration: params.duration,
            initial_liquidity: params.initial_liquidity,
        }
    }
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct SingleDataObjectUploadParams<JOYBalance> {
    pub object_creation_params: DataObjectCreationParameters,
    pub expected_data_size_fee: JOYBalance,
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct UploadContext<AccountId, BagId> {
    pub uploader_account: AccountId,
    pub bag_id: BagId,
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct WhitelistParams<Hash, SingleDataObjectUploadParams> {
    /// Whitelist merkle root
    pub commitment: Hash,
    /// Optional payload data to upload to storage
    pub payload: Option<SingleDataObjectUploadParams>,
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct WhitelistedSaleParticipant<AccountId, Balance> {
    // Participant's address
    pub address: AccountId,
    // Cap on number of tokens participant can purchase on given sale
    pub cap: Option<Balance>,
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct SaleAccessProof<WhitelistedSaleParticipant, MerkleProof> {
    // Sale whitelisted participant's data to verify
    pub participant: WhitelistedSaleParticipant,
    // Merkle proof to verify against sale's whitelist commitment
    pub proof: MerkleProof,
}

impl<AccountId, Balance, Hasher>
    SaleAccessProof<WhitelistedSaleParticipant<AccountId, Balance>, MerkleProof<Hasher>>
where
    Hasher: Hash,
    AccountId: Clone + Encode + PartialEq,
    Balance: Clone + Encode,
{
    pub(crate) fn verify<T: Trait>(
        &self,
        sender: &AccountId,
        commit: Hasher::Output,
    ) -> DispatchResult {
        self.proof
            .verify::<T, WhitelistedSaleParticipant<AccountId, Balance>>(
                &self.participant,
                commit,
            )?;

        ensure!(
            self.participant.address == sender.clone(),
            Error::<T>::SaleAccessProofParticipantIsNotSender
        );

        Ok(())
    }
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct TokenSaleParams<
    JOYBalance,
    Balance,
    BlockNumber,
    VestingScheduleParams,
    WhitelistParams,
    AccountId,
> {
    /// Account that acts as the source of the tokens on sale
    pub tokens_source: AccountId,
    /// Token's unit price in JOY
    pub unit_price: JOYBalance,
    /// Number of tokens on sale
    pub upper_bound_quantity: Balance,
    /// Optional block in the future when the sale should start (by default: starts immediately)
    pub starts_at: Option<BlockNumber>,
    /// Sale duration in blocks
    pub duration: BlockNumber,
    /// Optional whitelist parameters (merkle tree data)
    pub whitelist: Option<WhitelistParams>,
    /// Optional vesting schedule for all tokens on sale
    pub vesting_schedule: Option<VestingScheduleParams>,
    /// Optional sale metadata
    pub metadata: Option<Vec<u8>>,
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default)]
pub struct TokenSale<JOYBalance, Balance, BlockNumber, VestingScheduleParams, Hash, AccountId> {
    /// Token's unit price in JOY
    pub unit_price: JOYBalance,
    /// Number of tokens still on sale (if any)
    pub quantity_left: Balance,
    /// Account that acts as the source of the tokens on sale
    pub tokens_source: AccountId,
    /// Block at which the sale started / will start
    pub start_block: BlockNumber,
    /// Sale duration (in blocks)
    pub duration: BlockNumber,
    /// Optional whitelist merkle root comittment
    pub whitelist_commitment: Option<Hash>,
    /// Optional vesting schedule for all tokens on sale
    pub vesting_schedule: Option<VestingScheduleParams>,
}

impl<JOYBalance, Balance, BlockNumber: Zero + Saturating + Copy + Clone, Hash, AccountId>
    TokenSale<JOYBalance, Balance, BlockNumber, VestingScheduleParams<BlockNumber>, Hash, AccountId>
{
    pub(crate) fn try_from_params<T: Trait>(
        params: TokenSaleParamsOf<T>,
    ) -> Result<TokenSaleOf<T>, DispatchError> {
        let current_block = <frame_system::Module<T>>::block_number();
        let start_block = params.starts_at.unwrap_or(current_block);

        ensure!(
            start_block >= current_block,
            Error::<T>::SaleStartingBlockInThePast
        );

        Ok(TokenSale {
            start_block,
            duration: params.duration,
            unit_price: params.unit_price,
            quantity_left: params.upper_bound_quantity,
            vesting_schedule: params.vesting_schedule,
            whitelist_commitment: params.whitelist.map(|p| p.commitment),
            tokens_source: params.tokens_source,
        })
    }

    pub(crate) fn get_vesting_schedule(&self) -> VestingSchedule<BlockNumber> {
        self.vesting_schedule.as_ref().map_or(
            // Default VestingSchedule when none specified (distribute all tokens right after sale ends)
            VestingSchedule::<BlockNumber> {
                start_block: self.start_block.saturating_add(self.duration),
                initial_liquidity: Permill::one(),
                duration: BlockNumber::zero(),
            },
            |vs| {
                VestingSchedule::<BlockNumber>::from_params(
                    self.start_block.saturating_add(self.duration),
                    vs.clone(),
                )
            },
        )
    }
}

/// The possible issuance variants: This is a stub
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
    BondingCurve,
}

/// Encapsules validation + IssuanceState construction
impl<TokenSale> OfferingState<TokenSale> {
    pub(crate) fn of<T: crate::Trait>(token: &TokenDataOf<T>) -> OfferingStateOf<T> {
        token
            .last_sale
            .as_ref()
            .map_or(OfferingStateOf::<T>::Idle, |sale| {
                let current_block = <frame_system::Module<T>>::block_number();
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

    pub(crate) fn ensure_idle_of<T: crate::Trait>(token: &TokenDataOf<T>) -> DispatchResult {
        match Self::of::<T>(&token) {
            OfferingStateOf::<T>::Idle => Ok(()),
            _ => Err(Error::<T>::TokenIssuanceNotInIdleState.into()),
        }
    }

    pub(crate) fn ensure_upcoming_sale_of<T: crate::Trait>(
        token: &TokenDataOf<T>,
    ) -> Result<TokenSaleOf<T>, DispatchError> {
        match Self::of::<T>(&token) {
            OfferingStateOf::<T>::UpcomingSale(sale) => Ok(sale),
            _ => Err(Error::<T>::NoUpcomingSale.into()),
        }
    }

    pub(crate) fn ensure_sale_of<T: crate::Trait>(
        token: &TokenDataOf<T>,
    ) -> Result<TokenSaleOf<T>, DispatchError> {
        match Self::of::<T>(&token) {
            OfferingStateOf::<T>::Sale(sale) => Ok(sale),
            _ => Err(Error::<T>::NoActiveSale.into()),
        }
    }
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct InitialAllocation<AddressId, Balance, VestingScheduleParams> {
    pub(crate) address: AddressId,
    pub(crate) amount: Balance,
    pub(crate) vesting_schedule: Option<VestingScheduleParams>,
}

/// Builder for the token data struct
#[derive(Encode, Decode, Clone, PartialEq, Eq, Default, Debug)]
pub struct TokenIssuanceParameters<Balance, Hash, InitialAllocation> {
    /// Initial issuance
    pub(crate) initial_allocation: InitialAllocation,

    /// Token Symbol
    pub(crate) symbol: Hash,

    /// Initial transfer policy:
    pub(crate) transfer_policy: TransferPolicy<Hash>,

    /// Initial Patronage rate
    pub(crate) patronage_rate: Balance,
}

/// Utility enum used in merkle proof verification
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Copy)]
pub enum MerkleSide {
    /// This element appended to the right of the subtree hash
    Right,

    /// This element appended to the left of the subtree hash
    Left,
}

/// Wrapper around a merkle proof path
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct MerkleProof<Hasher: Hash>(pub Option<Vec<(Hasher::Output, MerkleSide)>>);

/// Information about a payment
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct Payment<Balance> {
    /// Ignored by runtime
    pub remark: Vec<u8>,

    /// Amount
    pub amount: Balance,
}

/// Wrapper around BTreeMap<AccountId, Payment<Balance>>
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct Transfers<AccountId, Balance>(pub BTreeMap<AccountId, Payment<Balance>>);

/// Default trait for Merkle Side
impl Default for MerkleSide {
    fn default() -> Self {
        MerkleSide::Right
    }
}

// implementation

/// Default trait for OfferingState
impl<TokenSale> Default for OfferingState<TokenSale> {
    fn default() -> Self {
        OfferingState::Idle
    }
}

/// Default trait for InitialAllocation
impl<AddressId: Default, Balance: Zero, VestingScheduleParams> Default
    for InitialAllocation<AddressId, Balance, VestingScheduleParams>
{
    fn default() -> Self {
        InitialAllocation {
            address: AddressId::default(),
            amount: Balance::zero(),
            vesting_schedule: None,
        }
    }
}

/// Default trait for AccountData
impl<VestingBalance, Balance: Zero> Default for AccountData<VestingBalance, Balance> {
    fn default() -> Self {
        Self {
            vesting_balances: BTreeMap::new(),
            base_balance: Balance::zero(),
            reserved_balance: Balance::zero(),
        }
    }
}

impl<
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
    > AccountData<VestingBalance<Balance, VestingSchedule<BlockNumber>>, Balance>
{
    /// Check wheather account is empty
    pub(crate) fn is_empty(&self) -> bool {
        self.vesting_balances.is_empty()
            && self.base_balance.is_zero()
            && self.reserved_balance.is_zero()
    }

    /// Calculate account's total balance at current block
    pub(crate) fn total_balance<T: Trait<Balance = Balance, BlockNumber = BlockNumber>>(
        &self,
    ) -> Balance {
        self.vesting_balances
            .values()
            .map(|l| l.claimable_amount::<T>())
            .sum::<Balance>()
            .saturating_add(self.base_balance)
    }

    /// Calculate account's usable (unreserved) balance at current block
    pub(crate) fn usable_balance<T: Trait<Balance = Balance, BlockNumber = BlockNumber>>(
        &self,
    ) -> Balance {
        self.total_balance::<T>()
            .saturating_sub(self.reserved_balance)
    }

    pub(crate) fn ensure_vesting_balance_can_be_increased<
        T: Trait<Balance = Balance, BlockNumber = BlockNumber>,
    >(
        &self,
        source: VestingSource,
    ) -> DispatchResult {
        if self.vesting_balances.get(&source).is_none()
            && self.vesting_balances.len() >= T::MaxVestingBalancesPerAccountPerToken::get().into()
        {
            return Err(Error::<T>::MaxVestingBalancesPerAccountPerTokenReached.into());
        }
        Ok(())
    }

    /// Increase vesting balance of an account by source
    pub(crate) fn increase_vesting_balance(
        &mut self,
        source: VestingSource,
        amount: Balance,
        vesting_schedule: VestingSchedule<BlockNumber>,
    ) {
        let existing_balance = self.vesting_balances.get(&source).map(|v| v.clone());
        self.vesting_balances.insert(
            source,
            VestingBalance {
                claimed_amount: existing_balance
                    .as_ref()
                    .map_or(Balance::zero(), |vb| vb.claimed_amount),
                total_amount: existing_balance
                    .as_ref()
                    .map_or(Balance::zero(), |vb| vb.total_amount)
                    .saturating_add(amount),
                vesting_schedule,
            },
        );
    }

    /// Increase account's liquidity by given amount
    pub(crate) fn increase_liquidity_by(&mut self, amount: Balance) {
        self.base_balance = self.base_balance.saturating_add(amount);
    }

    /// Decrease liquidity for an account
    pub(crate) fn decrease_liquidity_by<T: Trait<Balance = Balance, BlockNumber = BlockNumber>>(
        &mut self,
        amount: Balance,
    ) -> () {
        if amount > self.base_balance {
            let mut remaining_amount = amount.saturating_sub(self.base_balance);
            self.base_balance = Balance::zero();
            let new_vesting_balances = self
                .vesting_balances
                .iter()
                .filter_map(|(k, vb)| {
                    let mut new_vb = vb.clone();
                    let amount_to_claim = min(vb.claimable_amount::<T>(), remaining_amount);
                    new_vb.claimed_amount = vb.claimed_amount.saturating_add(amount_to_claim);
                    remaining_amount = remaining_amount.saturating_sub(amount_to_claim);
                    if new_vb.claimed_amount == new_vb.total_amount {
                        None
                    } else {
                        Some((k.clone(), new_vb))
                    }
                })
                .collect::<BTreeMap<_, _>>();
            self.vesting_balances = new_vesting_balances;
        } else {
            self.base_balance = self.base_balance.saturating_sub(amount);
        }
    }

    /// Dry run for `self.decrease_liquidity_by(amount)`
    pub(crate) fn ensure_can_decrease_liquidity_by<
        T: Trait<Balance = Balance, BlockNumber = BlockNumber>,
    >(
        &self,
        amount: Balance,
    ) -> DispatchResult {
        ensure!(
            self.usable_balance::<T>() >= amount,
            crate::Error::<T>::InsufficientFreeBalanceForTransfer,
        );
        Ok(())
    }
}
/// Token Data implementation
impl<
        JOYBalance,
        Balance: Zero + Saturating + Copy,
        Hash,
        BlockNumber: PartialOrd + Saturating + Copy,
        VestingScheduleParams,
        AccountId,
    >
    TokenData<
        Balance,
        Hash,
        BlockNumber,
        TokenSale<JOYBalance, Balance, BlockNumber, VestingScheduleParams, Hash, AccountId>,
    >
{
    // increase total issuance
    pub(crate) fn increase_issuance_by(&mut self, amount: Balance) {
        self.tokens_issued = self.tokens_issued.saturating_add(amount);
        self.total_supply = self.total_supply.saturating_add(amount);
    }

    // decrease total issuance
    pub(crate) fn decrease_supply_by(&mut self, amount: Balance) {
        self.total_supply = self.total_supply.saturating_sub(amount);
    }

    pub fn set_unclaimed_tally_patronage_at_block(&mut self, amount: Balance, block: BlockNumber) {
        self.patronage_info.last_unclaimed_patronage_tally_block = block;
        self.patronage_info.unclaimed_patronage_tally_amount = amount;
    }

    pub(crate) fn unclaimed_patronage<BlockNumberToBalance: Convert<BlockNumber, Balance>>(
        &self,
        block: BlockNumber,
    ) -> Balance {
        // period * rate * supply + tally
        self.patronage_info
            .unclaimed_patronage_percent::<BlockNumberToBalance>(block)
            .saturating_mul(self.total_supply)
            .saturating_add(self.patronage_info.unclaimed_patronage_tally_amount)
    }

    pub fn set_new_patronage_rate_at_block<BlockNumberToBalance: Convert<BlockNumber, Balance>>(
        &mut self,
        new_rate: Balance,
        block: BlockNumber,
    ) {
        // update tally according to old rate
        self.patronage_info.unclaimed_patronage_tally_amount =
            self.unclaimed_patronage::<BlockNumberToBalance>(block);
        self.patronage_info.last_unclaimed_patronage_tally_block = block;
        self.patronage_info.rate = new_rate;
    }

    // Returns number of tokens that remain unpurchased & reserved in the the sale's
    // `tokens_source` account (if any)
    pub(crate) fn last_sale_remaining_tokens(&self) -> Balance {
        self.last_sale
            .as_ref()
            .map_or(Balance::zero(), |last_sale| last_sale.quantity_left)
    }

    pub(crate) fn try_from_params<T: crate::Trait>(
        params: TokenIssuanceParametersOf<T>,
    ) -> Result<TokenDataOf<T>, DispatchError> {
        let current_block = <frame_system::Module<T>>::block_number();

        let patronage_info =
            PatronageData::<<T as Trait>::Balance, <T as frame_system::Trait>::BlockNumber> {
                last_unclaimed_patronage_tally_block: current_block,
                unclaimed_patronage_tally_amount: <T as Trait>::Balance::zero(),
                rate: params.patronage_rate,
            };

        let token_data = TokenData {
            symbol: params.symbol,
            total_supply: params.initial_allocation.amount,
            tokens_issued: params.initial_allocation.amount,
            last_sale: None,
            transfer_policy: params.transfer_policy,
            patronage_info,
            sales_initialized: 0,
        };

        Ok(token_data)
    }
}

impl<Hasher: Hash> MerkleProof<Hasher> {
    pub(crate) fn verify<T, S>(&self, data: &S, commit: Hasher::Output) -> DispatchResult
    where
        T: crate::Trait,
        S: Encode,
    {
        match &self.0 {
            None => Err(crate::Error::<T>::MerkleProofNotProvided.into()),
            Some(vec) => {
                let init = Hasher::hash_of(data);
                let proof_result = vec.iter().fold(init, |acc, (hash, side)| match side {
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
    }
}

impl<Balance: Zero + Copy + Saturating, BlockNumber: Copy + Saturating + PartialOrd>
    PatronageData<Balance, BlockNumber>
{
    pub fn unclaimed_patronage_percent<BlockNumberToBalance: Convert<BlockNumber, Balance>>(
        &self,
        block: BlockNumber,
    ) -> Balance {
        let period = block.saturating_sub(self.last_unclaimed_patronage_tally_block);
        BlockNumberToBalance::convert(period).saturating_mul(self.rate)
    }
}

impl<AccountId, Balance: Sum + Copy> Transfers<AccountId, Balance> {
    pub fn total_amount(&self) -> Balance {
        self.0.iter().map(|(_, payment)| payment.amount).sum()
    }

    pub fn iter(&self) -> Iter<'_, AccountId, Payment<Balance>> {
        self.0.iter()
    }
}

impl<AccountId, Balance> From<Transfers<AccountId, Balance>>
    for BTreeMap<AccountId, Payment<Balance>>
{
    fn from(v: Transfers<AccountId, Balance>) -> Self {
        v.0
    }
}

// Aliases
/// Alias for VestingBalance
pub(crate) type VestingBalanceOf<T> = VestingBalance<<T as Trait>::Balance, VestingScheduleOf<T>>;

/// Alias for Account Data
pub(crate) type AccountDataOf<T> = AccountData<VestingBalanceOf<T>, <T as Trait>::Balance>;

/// Alias for Token Data
pub(crate) type TokenDataOf<T> = TokenData<
    <T as crate::Trait>::Balance,
    <T as frame_system::Trait>::Hash,
    <T as frame_system::Trait>::BlockNumber,
    TokenSaleOf<T>,
>;

/// Alias for InitialAllocation
pub(crate) type InitialAllocationOf<T> = InitialAllocation<
    <T as frame_system::Trait>::AccountId,
    <T as crate::Trait>::Balance,
    VestingScheduleParamsOf<T>,
>;

/// Alias for Token Issuance Parameters
pub(crate) type TokenIssuanceParametersOf<T> = TokenIssuanceParameters<
    <T as crate::Trait>::Balance,
    <T as frame_system::Trait>::Hash,
    InitialAllocationOf<T>,
>;

/// Alias for TransferPolicy
pub(crate) type TransferPolicyOf<T> = TransferPolicy<<T as frame_system::Trait>::Hash>;

/// Alias for the Merkle Proof type
pub(crate) type MerkleProofOf<T> = MerkleProof<<T as frame_system::Trait>::Hashing>;

/// Alias for VestingScheduleParams
pub(crate) type VestingScheduleParamsOf<T> =
    VestingScheduleParams<<T as frame_system::Trait>::BlockNumber>;

/// Alias for VestingSchedule
pub(crate) type VestingScheduleOf<T> = VestingSchedule<<T as frame_system::Trait>::BlockNumber>;

/// Alias for SingleDataObjectUploadParams
pub(crate) type SingleDataObjectUploadParamsOf<T> =
    SingleDataObjectUploadParams<<T as balances::Trait>::Balance>;

/// Alias for WhitelistParams
pub(crate) type WhitelistParamsOf<T> =
    WhitelistParams<<T as frame_system::Trait>::Hash, SingleDataObjectUploadParamsOf<T>>;

/// Alias for TokenSaleParams
pub(crate) type TokenSaleParamsOf<T> = TokenSaleParams<
    <T as balances::Trait>::Balance,
    <T as crate::Trait>::Balance,
    <T as frame_system::Trait>::BlockNumber,
    VestingScheduleParamsOf<T>,
    WhitelistParamsOf<T>,
    <T as frame_system::Trait>::AccountId,
>;

/// Alias for TokenSale
pub(crate) type TokenSaleOf<T> = TokenSale<
    <T as balances::Trait>::Balance,
    <T as crate::Trait>::Balance,
    <T as frame_system::Trait>::BlockNumber,
    VestingScheduleParamsOf<T>,
    <T as frame_system::Trait>::Hash,
    <T as frame_system::Trait>::AccountId,
>;

/// Alias for OfferingState
pub(crate) type OfferingStateOf<T> = OfferingState<TokenSaleOf<T>>;

/// Alias for UploadContext
pub(crate) type UploadContextOf<T> = UploadContext<<T as frame_system::Trait>::AccountId, BagId<T>>;

/// TokenSaleId
pub(crate) type TokenSaleId = u32;

/// Alias for Transfers
pub(crate) type TransfersOf<T> =
    Transfers<<T as frame_system::Trait>::AccountId, <T as crate::Trait>::Balance>;

/// Alias for WhitelistedSaleParticipant
pub(crate) type WhitelistedSaleParticipantOf<T> =
    WhitelistedSaleParticipant<<T as frame_system::Trait>::AccountId, <T as Trait>::Balance>;

/// Alias for SaleAccessProof
pub(crate) type SaleAccessProofOf<T> =
    SaleAccessProof<WhitelistedSaleParticipantOf<T>, MerkleProofOf<T>>;
