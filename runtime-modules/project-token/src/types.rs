use codec::{Decode, Encode};
use frame_support::{dispatch::DispatchError, ensure};
use sp_arithmetic::traits::{Saturating, Zero};

// crate imports
use crate::traits::TransferLocationTrait;

// TODO: find a suitable symbol representation
pub type Symbol = ();

pub(crate) enum DecreaseOp<Balance> {
    /// reduce amount by
    Reduce(Balance),

    /// Remove Account
    Remove(Balance),
}
impl<Balance: Clone> DecreaseOp<Balance> {
    pub(crate) fn amount(&self) -> Balance {
        match self {
            Self::Reduce(b) => b.to_owned(),
            Self::Remove(b) => b.to_owned(),
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
    account: AccountId,
}

/// Transfer location with merkle proof
#[derive(Encode, Decode, Clone, PartialEq, Eq, Default, Debug)]
pub struct VerifiableLocation<AccountId, Hash> {
    merkle_proof: Vec<Hash>,
    account: AccountId,
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
            println!("Removing");
            Ok(DecreaseOp::<Balance>::Remove(new_total))
        } else {
            println!("Reducing");
            Ok(DecreaseOp::<Balance>::Reduce(amount))
        }
    }
}

/// Encapsules parameters validation + TokenData construction
impl<Balance: Zero + Copy + PartialOrd, Hash> TokenIssuanceParameters<Balance, Hash> {
    /// Forward `self` state
    pub fn try_build<T: crate::Trait>(self) -> Result<TokenData<Balance, Hash>, DispatchError> {
        // validation
        ensure!(
            self.initial_issuance >= self.existential_deposit,
            crate::Error::<T>::ExistentialDepositExceedsInitialIssuance,
        );
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

// Verifiable Location implementation
impl<AccountId: Clone, Hash: Clone> TransferLocationTrait<AccountId, TransferPolicy<Hash>>
    for VerifiableLocation<AccountId, Hash>
{
    fn is_valid_location_for_policy(&self, policy: &TransferPolicy<Hash>) -> bool {
        match policy {
            TransferPolicy::<Hash>::Permissioned(whitelist_commit) => {
                self.is_merkle_proof_valid(whitelist_commit.to_owned())
            }
            TransferPolicy::<Hash>::Permissionless => true,
        }
    }

    fn location_account(&self) -> AccountId {
        self.account.to_owned()
    }
}

impl<AccountId, Hash> VerifiableLocation<AccountId, Hash> {
    pub(crate) fn is_merkle_proof_valid(&self, _commit: Hash) -> bool {
        // TODO: copy from content merkle proof verification
        true
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
