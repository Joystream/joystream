use codec::{Decode, Encode};
use frame_support::{
    dispatch::{DispatchError, DispatchResult},
    ensure,
};
use sp_arithmetic::traits::{Saturating, Zero};
use sp_runtime::traits::{Convert, Hash};
use sp_std::{iter::Sum, slice::Iter};

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
    pub(crate) current_total_issuance: Balance,

    /// Initial issuance state
    pub(crate) issuance_state: OfferingState,

    /// Transfer policy
    pub(crate) transfer_policy: TransferPolicy<Hash>,

    /// Patronage Information
    pub(crate) patronage_info: PatronageData<Balance, BlockNumber>,
}

/// Patronage information, patronage configuration = set of values for its fields
#[derive(Encode, Decode, Clone, PartialEq, Eq, Default, Debug)]
pub struct PatronageData<Balance, BlockNumber> {
    /// Patronage rate
    pub(crate) rate: Balance,

    /// Tally count for the outstanding credit before latest patronage config change
    pub(crate) tally: Balance,

    /// Last block the patronage configuration was updated
    pub(crate) last_tally_update_block: BlockNumber,
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
    pub(crate) initial_issuance: Balance,

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

/// Output for a transfer containing beneficiary + amount due
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct Output<AccountId, Balance> {
    /// Beneficiary
    pub beneficiary: AccountId,

    /// Amount
    pub amount: Balance,
}

/// Wrapper around Vec<Outputs>
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct Outputs<AccountId, Balance>(pub Vec<Output<AccountId, Balance>>);

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
        false // TODO: establish emptyness conditions
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

    pub(crate) fn _total_balance(&self) -> Balance {
        self.free_balance.saturating_add(self.reserved_balance)
    }
}
/// Token Data implementation
impl<Balance: Saturating + Copy, Hash, BlockNumber> TokenData<Balance, Hash, BlockNumber> {
    // increase total issuance
    pub(crate) fn increase_issuance_by(&mut self, amount: Balance) {
        self.current_total_issuance = self.current_total_issuance.saturating_add(amount);
    }

    // decrease total issuance
    pub(crate) fn decrease_issuance_by(&mut self, amount: Balance) {
        self.current_total_issuance = self.current_total_issuance.saturating_sub(amount);
    }
}

/// Encapsules parameters validation + TokenData construction
impl<Balance: Zero + Copy + PartialOrd, Hash> TokenIssuanceParameters<Balance, Hash> {
    /// Forward `self` state
    pub fn try_build<T: crate::Trait, BlockNumber>(
        self,
        block: BlockNumber,
    ) -> Result<TokenData<Balance, Hash, BlockNumber>, DispatchError> {
        // validation

        let patronage_info = PatronageData::<Balance, BlockNumber> {
            last_tally_update_block: block,
            tally: Balance::zero(),
            rate: self.patronage_rate,
        };
        Ok(TokenData::<Balance, Hash, BlockNumber> {
            current_total_issuance: self.initial_issuance,
            issuance_state: self.initial_state,
            transfer_policy: self.transfer_policy,
            patronage_info,
        })
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
    pub fn outstanding_credit<BlockNumberToBalance: Convert<BlockNumber, Balance>>(
        &self,
        block: BlockNumber,
    ) -> Balance {
        let period = block.saturating_sub(self.last_tally_update_block);
        let accrued = BlockNumberToBalance::convert(period).saturating_mul(self.rate);
        accrued.saturating_add(self.tally)
    }

    pub fn set_new_rate_at_block<BlockNumberToBalance: Convert<BlockNumber, Balance>>(
        &mut self,
        new_rate: Balance,
        block: BlockNumber,
    ) {
        // update tally according to old rate
        self.tally = self.outstanding_credit::<BlockNumberToBalance>(block);
        self.last_tally_update_block = block;
        self.rate = new_rate;
    }

    pub fn reset_tally_at_block<BlockNumberToBalance: Convert<BlockNumber, Balance>>(
        &mut self,
        block: BlockNumber,
    ) {
        self.last_tally_update_block = block;
        self.tally = Balance::zero();
    }
}

impl<AccountId, Balance: Sum + Copy> Outputs<AccountId, Balance> {
    pub fn total_amount(&self) -> Balance {
        self.0.iter().map(|out| out.amount).sum()
    }

    pub fn iter(&self) -> Iter<'_, Output<AccountId, Balance>> {
        self.0.iter()
    }
}

impl<AccountId, Balance> From<Outputs<AccountId, Balance>> for Vec<Output<AccountId, Balance>> {
    fn from(v: Outputs<AccountId, Balance>) -> Self {
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
pub(crate) type OutputsOf<T> =
    Outputs<<T as frame_system::Trait>::AccountId, <T as crate::Trait>::Balance>;
