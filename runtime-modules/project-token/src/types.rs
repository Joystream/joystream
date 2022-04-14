use codec::{Decode, Encode};
use frame_support::{
    dispatch::{fmt::Debug, DispatchResult},
    ensure,
};
use sp_arithmetic::traits::{Saturating, Zero};
use sp_runtime::traits::{Convert, Hash};
use sp_std::collections::btree_map::{BTreeMap, Iter};
use sp_std::iter::Sum;

/// Info for the account
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct AccountData<Balance> {
    /// Non-reserved part of the balance. There may still be restrictions
    /// on this, but it is the total pool what may in principle be
    /// transferred, reserved and used for tipping.
    pub(crate) free_balance: Balance,

    /// This balance is a 'reserve' balance that other subsystems use
    /// in order to set aside tokens that are still 'owned' by the
    /// account holder, but which are not usable in any case.
    pub(crate) reserved_balance: Balance,
}

/// Info for the token
#[derive(Encode, Decode, Clone, PartialEq, Eq, Default, Debug)]
pub struct TokenData<Balance, Hash, BlockNumber> {
    /// Current token issuance
    pub(crate) supply: Balance,

    /// Initial issuance state
    pub(crate) issuance_state: OfferingState,

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

    /// Initial State builder: stub
    pub(crate) initial_state: OfferingState,

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

/// Default trait for Issuance state
impl Default for OfferingState {
    fn default() -> Self {
        OfferingState::Idle
    }
}

/// Default trait for AccountData
impl<Balance: Zero> Default for AccountData<Balance> {
    fn default() -> Self {
        Self {
            free_balance: Balance::zero(),
            reserved_balance: Balance::zero(),
        }
    }
}

/// Encapsules parameters validation + TokenData construction
impl<Balance: Zero + Copy + PartialOrd + Saturating> AccountData<Balance> {
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
            crate::Error::<T>::InsufficientFreeBalanceForTransfer,
        );
        Ok(())
    }

    pub(crate) fn total_balance(&self) -> Balance {
        self.free_balance.saturating_add(self.reserved_balance)
    }
}
/// Token Data implementation
impl<
        Balance: Zero + Copy + Saturating + Debug,
        Hash,
        BlockNumber: Copy + Saturating + PartialOrd,
    > TokenData<Balance, Hash, BlockNumber>
{
    // increase total issuance
    pub(crate) fn increase_issuance_by(&mut self, amount: Balance) {
        self.supply = self.supply.saturating_add(amount);
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
            .saturating_mul(self.supply)
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

    pub fn is_permissioned_transfer_policy(&self) -> bool {
        matches!(
            self.transfer_policy,
            TransferPolicy::<Hash>::Permissioned(_)
        )
    }
}

/// Encapsules parameters validation + TokenData construction
impl<Balance: Zero + Copy + PartialOrd, Hash> TokenIssuanceParameters<Balance, Hash> {
    /// Forward `self` state
    pub fn build<BlockNumber>(self, block: BlockNumber) -> TokenData<Balance, Hash, BlockNumber> {
        // validation
        let patronage_info = PatronageData::<Balance, BlockNumber> {
            last_unclaimed_patronage_tally_block: block,
            unclaimed_patronage_tally_amount: Balance::zero(),
            rate: self.patronage_rate,
        };
        TokenData::<Balance, Hash, BlockNumber> {
            supply: self.initial_supply,
            issuance_state: self.initial_state,
            transfer_policy: self.transfer_policy,
            symbol: self.symbol,
            patronage_info,
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
        match &self.0 {
            None => Err(crate::Error::<T>::MerkleProofNotProvided.into()),
            Some(vec) => {
                let init = Hasher::hash_of(account_id);
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
/// Alias for Account Data
pub(crate) type AccountDataOf<T> = AccountData<<T as crate::Trait>::Balance>;

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
