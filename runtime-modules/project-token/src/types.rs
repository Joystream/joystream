use codec::{Decode, Encode};
use frame_support::{
    dispatch::{fmt::Debug, DispatchResult},
    ensure,
    traits::Get,
};
use sp_arithmetic::traits::{AtLeast32BitUnsigned, Saturating, Zero};
use sp_runtime::traits::{Convert, Hash};
use sp_runtime::Permill;
use sp_std::collections::btree_map::{BTreeMap, IntoIter, Iter};
use sp_std::convert::From;
use sp_std::iter::Sum;

/// Info for the account
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct AccountData<Balance, ReserveBalance> {
    /// Non-reserved part of the balance. There may still be restrictions
    /// on this, but it is the total pool what may in principle be
    /// transferred, reserved and used for tipping.
    pub(crate) free_balance: Balance,

    /// This balance is a 'reserve' balance that other subsystems use
    /// in order to set aside tokens that are still 'owned' by the
    /// account holder, but which are not usable in any case.
    pub(crate) stacked_balance: Balance,

    /// Bloat bond (in 'JOY's) deposited into treasury upon creation of this
    /// account, returned when this account is removed
    pub(crate) bloat_bond: ReserveBalance,
}

/// Info for the token
#[derive(Encode, Decode, Clone, PartialEq, Eq, Default, Debug)]
pub struct TokenData<Balance, Hash, BlockNumber> {
    /// Current token issuance
    pub(crate) supply: Balance,

    /// Initial issuance state
    pub(crate) offering_state: OfferingState,

    /// Transfer policy
    pub(crate) transfer_policy: TransferPolicy<Hash>,

    /// Symbol used to identify token
    pub(crate) symbol: Hash,

    /// Patronage Information
    pub(crate) patronage_info: PatronageData<Balance, BlockNumber>,

    /// Account counter
    pub(crate) accounts_number: u64,
}

/// Patronage information, patronage configuration = set of values for its fields
#[derive(Encode, Decode, Clone, PartialEq, Eq, Default, Debug)]
pub struct PatronageData<Balance, BlockNumber> {
    /// Patronage rate
    pub(crate) rate: BlockRate,

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

/// The possible issuance variants: This is a stub
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub(crate) enum OfferingState {
    /// Initial idle state
    Idle,

    /// Initial state sale (this has to be defined)
    Sale,

    /// state for IBCO, it might get decorated with the JOY reserve
    /// amount for the token
    BondingCurve,
}

/// Builder for the token data struct
#[derive(Encode, Decode, Clone, PartialEq, Eq, Default)]
pub struct TokenIssuanceParameters<Balance, Hash> {
    /// Initial issuance
    pub(crate) initial_supply: Balance,

    /// Token Symbol
    pub(crate) symbol: Hash,

    /// Initial transfer policy:
    pub(crate) transfer_policy: TransferPolicy<Hash>,

    /// Initial Patronage rate
    pub(crate) patronage_rate: YearlyRate,
}

/// Utility enum used in merkle proof verification
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Copy)]
pub enum MerkleSide {
    /// This element appended to the right of the subtree hash
    Right,

    /// This element appended to the left of the subtree hash
    Left,
}

/// Yearly rate used for patronage info initialization
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Copy, Default)]
pub struct YearlyRate(pub Permill);

/// Block rate used for patronage accounting
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Copy, PartialOrd, Default)]
pub struct BlockRate(pub Permill);

/// Wrapper around a merkle proof path
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct MerkleProof<Hasher: Hash>(pub Vec<(Hasher::Output, MerkleSide)>);

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

/// Utility wrapper around existing/non existing accounts to be used with transfer etc..
#[derive(Encode, Decode, PartialEq, Eq, Debug, PartialOrd, Ord, Clone)]
pub enum Validated<AccountId: Ord + Eq + Clone> {
    /// Existing account
    Existing(AccountId),

    /// Non Existing account
    NonExisting(AccountId),
}

// implementation

/// Default trait for Offering state
impl Default for OfferingState {
    fn default() -> Self {
        OfferingState::Idle
    }
}

/// Default trait for AccountData
impl<Balance: Zero, ReserveBalance: Zero> Default for AccountData<Balance, ReserveBalance> {
    fn default() -> Self {
        Self {
            free_balance: Balance::zero(),
            stacked_balance: Balance::zero(),
            bloat_bond: ReserveBalance::zero(),
        }
    }
}

/// Encapsules parameters validation + TokenData construction
impl<Balance: Zero + Copy + PartialOrd + Saturating, ReserveBalance>
    AccountData<Balance, ReserveBalance>
{
    /// Ctor
    pub fn new_with_liquidity_and_bond(
        init_liquidity: Balance,
        bloat_bond: ReserveBalance,
    ) -> Self {
        AccountData::<_, _> {
            free_balance: init_liquidity,
            stacked_balance: Balance::zero(),
            bloat_bond,
        }
    }

    /// Check wheather account is empty
    pub(crate) fn is_empty(&self) -> bool {
        self.total_balance().is_zero()
    }

    /// Increase liquidity for an account
    pub(crate) fn increase_liquidity_by(&mut self, amount: Balance) {
        self.free_balance = self.free_balance.saturating_add(amount);
    }

    /// Decrease liquidity for an account
    pub(crate) fn decrease_liquidity_by(&mut self, amount: Balance) {
        self.free_balance = self.free_balance.saturating_sub(amount);
    }

    /// Dry run for `self.decrease_liquidity_by(amount)`
    pub(crate) fn ensure_can_decrease_liquidity_by<T: crate::Trait>(
        &self,
        amount: Balance,
    ) -> DispatchResult {
        ensure!(
            self.free_balance >= amount,
            crate::Error::<T>::InsufficientFreeBalance,
        );
        Ok(())
    }

    pub(crate) fn total_balance(&self) -> Balance {
        self.free_balance.saturating_add(self.stacked_balance)
    }
}
/// Token Data implementation
impl<
        Balance: Zero + Copy + Saturating + Debug,
        Hash,
        BlockNumber: Copy + Saturating + PartialOrd + AtLeast32BitUnsigned,
    > TokenData<Balance, Hash, BlockNumber>
{
    // increment account number
    pub(crate) fn increment_accounts_number(&mut self) {
        self.accounts_number = self.accounts_number.saturating_add(1u64);
    }

    // decrement account number
    pub(crate) fn decrement_accounts_number(&mut self) {
        self.accounts_number = self.accounts_number.saturating_sub(1u64);
    }

    // increase total issuance
    pub(crate) fn increase_issuance_by(&mut self, amount: Balance) {
        self.supply = self.supply.saturating_add(amount);
    }

    // increase total issuance
    pub(crate) fn decrease_issuance_by(&mut self, amount: Balance) {
        self.supply = self.supply.saturating_sub(amount);
    }

    pub fn set_unclaimed_tally_patronage_at_block(&mut self, amount: Balance, block: BlockNumber) {
        self.patronage_info.last_unclaimed_patronage_tally_block = block;
        self.patronage_info.unclaimed_patronage_tally_amount = amount;
    }

    /// Computes: period * rate * supply + tally
    pub(crate) fn unclaimed_patronage_at_block<
        BlockNumberToBalance: Convert<BlockNumber, Balance>,
    >(
        &self,
        block: BlockNumber,
    ) -> Balance {
        let blocks = block.saturating_sub(self.patronage_info.last_unclaimed_patronage_tally_block);
        let unclaimed_patronage_percent: BlockNumber = self.patronage_info.rate.for_period(blocks);
        let unclaimed_patronage_percent_bal: Balance =
            BlockNumberToBalance::convert(unclaimed_patronage_percent);

        unclaimed_patronage_percent_bal
            .saturating_mul(self.supply)
            .saturating_add(self.patronage_info.unclaimed_patronage_tally_amount)
    }

    pub fn set_new_patronage_rate_at_block<BlockNumberToBalance: Convert<BlockNumber, Balance>>(
        &mut self,
        new_rate: BlockRate,
        block: BlockNumber,
    ) {
        // update tally according to old rate
        self.patronage_info.unclaimed_patronage_tally_amount =
            self.unclaimed_patronage_at_block::<BlockNumberToBalance>(block);
        self.patronage_info.last_unclaimed_patronage_tally_block = block;
        self.patronage_info.rate = new_rate;
    }
}

/// Encapsules parameters validation + TokenData construction
impl<Balance: Zero + Copy + PartialOrd, Hash> TokenIssuanceParameters<Balance, Hash> {
    /// Forward `self` state
    pub fn build<BlockNumber, T: crate::Trait>(
        self,
        block: BlockNumber,
    ) -> TokenData<Balance, Hash, BlockNumber> {
        // validation
        let rate = if self.patronage_rate.0.is_zero() {
            BlockRate(Permill::zero())
        } else {
            BlockRate::from_yearly_rate(self.patronage_rate, T::BlocksPerYear::get())
        };
        let patronage_info = PatronageData::<Balance, BlockNumber> {
            last_unclaimed_patronage_tally_block: block,
            unclaimed_patronage_tally_amount: Balance::zero(),
            rate,
        };
        TokenData::<Balance, Hash, BlockNumber> {
            supply: self.initial_supply,
            offering_state: OfferingState::Idle,
            transfer_policy: self.transfer_policy,
            symbol: self.symbol,
            patronage_info,
            accounts_number: 0u64,
        }
    }
}

impl<Hasher: Hash> MerkleProof<Hasher> {
    pub(crate) fn verify_for_commit<T, AccountId>(
        &self,
        account_id: &AccountId,
        commit: Hasher::Output,
    ) -> DispatchResult
    where
        T: crate::Trait,
        AccountId: Encode,
    {
        let init = Hasher::hash_of(account_id);
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

impl<AccountId, Balance: Sum + Copy> Transfers<AccountId, Balance> {
    pub fn len(&self) -> usize {
        self.0.len()
    }

    pub fn total_amount(&self) -> Balance {
        self.0.iter().map(|(_, payment)| payment.amount).sum()
    }

    pub fn iter(&self) -> Iter<'_, AccountId, Payment<Balance>> {
        self.0.iter()
    }

    pub fn into_iter(self) -> IntoIter<AccountId, Payment<Balance>> {
        self.0.into_iter()
    }
}

impl<AccountId, Balance> From<Transfers<AccountId, Balance>>
    for BTreeMap<AccountId, Payment<Balance>>
{
    fn from(v: Transfers<AccountId, Balance>) -> Self {
        v.0
    }
}

/// Block Rate bare minimum impementation
impl BlockRate {
    pub fn from_yearly_rate(r: YearlyRate, blocks_per_year: u32) -> Self {
        BlockRate(Permill::from_rational_approximation(
            blocks_per_year,
            r.0.saturating_reciprocal_mul(blocks_per_year),
        ))
    }

    pub fn to_yearly_rate(self, blocks_per_year: u32) -> YearlyRate {
        YearlyRate(Permill::from_rational_approximation(
            self.0.mul_floor(blocks_per_year),
            blocks_per_year,
        ))
    }

    pub fn for_period<BlockNumber>(self, blocks: BlockNumber) -> BlockNumber
    where
        BlockNumber: AtLeast32BitUnsigned + Clone,
    {
        self.0.mul_floor(blocks)
    }

    pub fn saturating_sub(self, other: Self) -> Self {
        BlockRate(self.0.saturating_sub(other.0))
    }
}

// Aliases
/// Alias for Account Data
pub(crate) type AccountDataOf<T> =
    AccountData<<T as crate::Trait>::Balance, crate::ReserveBalanceOf<T>>;

/// Alias for Token Data
pub(crate) type TokenDataOf<T> = TokenData<
    <T as crate::Trait>::Balance,
    <T as frame_system::Trait>::Hash,
    <T as frame_system::Trait>::BlockNumber,
>;

/// Alias for Token Issuance Parameters
pub(crate) type TokenIssuanceParametersOf<T> =
    TokenIssuanceParameters<<T as crate::Trait>::Balance, <T as frame_system::Trait>::Hash>;

/// Alias for TransferPolicy
pub(crate) type TransferPolicyOf<T> = TransferPolicy<<T as frame_system::Trait>::Hash>;

/// Alias for the Merkle Proof type
pub(crate) type MerkleProofOf<T> = MerkleProof<<T as frame_system::Trait>::Hashing>;

/// Alias for the output type
pub(crate) type TransfersOf<T> =
    Transfers<<T as frame_system::Trait>::AccountId, <T as crate::Trait>::Balance>;
