use codec::{Decode, Encode};
use frame_support::{
    dispatch::{DispatchError, DispatchResult},
    ensure,
};
use sp_arithmetic::traits::{Saturating, Zero};
use sp_runtime::traits::Hash;

// crate imports
use crate::traits::TransferLocationTrait;

// TODO: find a suitable symbol representation
pub type Symbol = ();

pub(crate) enum DecreaseOp<Balance> {
    /// reduce amount by
    Reduce(Balance),

    /// Remove Account (original amonut, dust below ex deposit)
    Remove(Balance, Balance),
}
impl<Balance: Clone + Saturating> DecreaseOp<Balance> {
    pub(crate) fn amount(&self) -> Balance {
        match self {
            Self::Reduce(amount) => amount.to_owned(),
            Self::Remove(amount, _) => amount.to_owned(),
        }
    }
    pub(crate) fn total_amount(&self) -> Balance {
        match self {
            Self::Reduce(amount) => amount.to_owned(),
            Self::Remove(amount, dust) => amount.to_owned().saturating_add(dust.to_owned()),
        }
    }
}

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
pub struct TokenData<Balance, Hash> {
    /// Current token issuance
    pub(crate) current_total_issuance: Balance,

    /// Existential deposit allowed for the token
    pub(crate) existential_deposit: Balance,

    /// Initial issuance state
    pub(crate) issuance_state: IssuanceState,

    /// Token Symbol
    pub(crate) symbol: Symbol,

    /// Transfer policy
    pub(crate) transfer_policy: TransferPolicy<Hash>,
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
pub(crate) enum IssuanceState {
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
    pub(crate) initial_state: IssuanceState,

    /// Initial existential deposit
    pub(crate) existential_deposit: Balance,

    /// Token Symbol
    pub(crate) symbol: Symbol,

    /// Initial transfer policy:
    pub(crate) transfer_policy: TransferPolicy<Hash>,
}

/// Transfer location without merkle proof
#[derive(Encode, Decode, Clone, PartialEq, Eq, Default, Debug)]
pub struct SimpleLocation<AccountId> {
    pub(crate) account: AccountId,
}

/// Transfer location with merkle proof
#[derive(Encode, Decode, Clone, PartialEq, Eq, Default, Debug)]
pub struct VerifiableLocation<AccountId, Hasher: Hash> {
    merkle_proof: Vec<(Hasher::Output, MerkleSide)>,
    pub account: AccountId,
}

/// Utility enum used in merkle proof verification
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Copy)]
pub enum MerkleSide {
    /// This element appended to the right of the subtree hash
    Right,

    /// This element appended to the left of the subtree hash
    Left,
}

/// Default trait for Merkle Side
impl Default for MerkleSide {
    fn default() -> Self {
        MerkleSide::Right
    }
}

// implementation

/// Default trait for Issuance state
impl Default for IssuanceState {
    fn default() -> Self {
        IssuanceState::Idle
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
    /// Verify if amount can be decrease taking account existential deposit
    /// Returns the amount that should be removed
    pub(crate) fn decrease_with_ex_deposit<T: crate::Trait>(
        &self,
        amount: Balance,
        existential_deposit: Balance,
    ) -> Result<DecreaseOp<Balance>, DispatchError> {
        ensure!(
            self.free_balance >= amount,
            crate::Error::<T>::InsufficientFreeBalanceForDecreasing,
        );

        let new_total = self
            .free_balance
            .saturating_sub(amount)
            .saturating_add(self.reserved_balance);

        if new_total.is_zero() || new_total < existential_deposit {
            Ok(DecreaseOp::<Balance>::Remove(amount, new_total))
        } else {
            Ok(DecreaseOp::<Balance>::Reduce(amount))
        }
    }

    pub(crate) fn total_balance(&self) -> Balance {
        self.free_balance.saturating_add(self.reserved_balance)
    }
}
/// Token Data implementation
impl<Balance, Hash> TokenData<Balance, Hash> {
    // validate transfer destination location according to self.policy
    pub(crate) fn ensure_valid_location_for_policy<T, AccountId, Location>(
        &self,
        location: &Location,
    ) -> DispatchResult
    where
        T: crate::Trait,
        Location: TransferLocationTrait<AccountId, TransferPolicy<Hash>>,
    {
        ensure!(
            location.is_valid_location_for_policy(&self.transfer_policy),
            crate::Error::<T>::LocationIncompatibleWithCurrentPolicy
        );
        Ok(())
    }
}
/// Encapsules parameters validation + TokenData construction
impl<Balance: Zero + Copy + PartialOrd, Hash> TokenIssuanceParameters<Balance, Hash> {
    /// Forward `self` state
    pub fn try_build<T: crate::Trait>(self) -> Result<TokenData<Balance, Hash>, DispatchError> {
        // validation
        // ensure!(
        //     self.initial_issuance >= self.existential_deposit,
        //     crate::Error::<T>::ExistentialDepositExceedsInitialIssuance,
        // );
        Ok(TokenData::<Balance, Hash> {
            current_total_issuance: self.initial_issuance,
            issuance_state: self.initial_state,
            existential_deposit: self.existential_deposit,
            symbol: self.symbol,
            transfer_policy: self.transfer_policy,
        })
    }
}

// Simple location
impl<AccountId: Clone, Hash> TransferLocationTrait<AccountId, TransferPolicy<Hash>>
    for SimpleLocation<AccountId>
{
    fn is_valid_location_for_policy(&self, policy: &TransferPolicy<Hash>) -> bool {
        matches!(policy, TransferPolicy::<Hash>::Permissionless)
    }

    fn location_account(&self) -> AccountId {
        self.account.to_owned()
    }
}

impl<AccountId> SimpleLocation<AccountId> {
    pub(crate) fn new(account: AccountId) -> Self {
        Self { account }
    }
}

// Verifiable Location implementation
impl<AccountId: Clone + Encode, Hasher: Hash>
    TransferLocationTrait<AccountId, TransferPolicy<Hasher::Output>>
    for VerifiableLocation<AccountId, Hasher>
{
    fn is_valid_location_for_policy(&self, policy: &TransferPolicy<Hasher::Output>) -> bool {
        // visitee dispatch
        match policy {
            TransferPolicy::<Hasher::Output>::Permissioned(whitelist_commit) => {
                self.is_merkle_proof_valid(whitelist_commit.to_owned())
            }
            // ignore verification in the permissionless case
            TransferPolicy::<Hasher::Output>::Permissionless => true,
        }
    }

    fn location_account(&self) -> AccountId {
        self.account.to_owned()
    }
}

impl<AccountId: Encode, Hasher: Hash> VerifiableLocation<AccountId, Hasher> {
    pub(crate) fn is_merkle_proof_valid(&self, commit: Hasher::Output) -> bool {
        let init = Hasher::hash_of(&self.account);
        let proof_result = self
            .merkle_proof
            .iter()
            .fold(init, |acc, (hash, side)| match side {
                MerkleSide::Left => Hasher::hash_of(&(hash, acc)),
                MerkleSide::Right => Hasher::hash_of(&(acc, hash)),
            });

        proof_result == commit
    }

    pub fn new(merkle_proof: Vec<(Hasher::Output, MerkleSide)>, account: AccountId) -> Self {
        Self {
            merkle_proof,
            account,
        }
    }
}

// Aliases
/// Alias for Account Data
pub(crate) type AccountDataOf<T> = AccountData<<T as crate::Trait>::Balance>;

/// Alias for Token Data
pub(crate) type TokenDataOf<T> =
    TokenData<<T as crate::Trait>::Balance, <T as frame_system::Trait>::Hash>;

/// Alias for Token Issuance Parameters
pub(crate) type TokenIssuanceParametersOf<T> =
    TokenIssuanceParameters<<T as crate::Trait>::Balance, <T as frame_system::Trait>::Hash>;

/// Alias for TransferPolicy
pub(crate) type TransferPolicyOf<T> = TransferPolicy<<T as frame_system::Trait>::Hash>;

/// Alias for decrease operation
pub(crate) type DecOp<T> = DecreaseOp<<T as crate::Trait>::Balance>;
