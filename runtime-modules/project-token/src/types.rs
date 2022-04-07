use codec::{Decode, Encode};
use frame_support::{
    dispatch::{DispatchError, DispatchResult},
    ensure,
};
use sp_arithmetic::traits::{Saturating, Zero};
use sp_runtime::traits::{Convert, Hash};
use sp_runtime::Permill;
use sp_std::{iter::Sum, slice::Iter};

use storage::DataObjectCreationParameters;

// crate imports
use crate::{errors::Error, Trait};

pub(crate) enum DecreaseOp<Balance> {
    /// reduce amount by
    Reduce(Balance),

    /// Remove Account (original amonut, dust below ex deposit)
    Remove(Balance, Balance),
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
pub struct TokenData<Balance, Hash, BlockNumber, OfferingState> {
    /// Current token issuance
    pub(crate) current_total_issuance: Balance,

    /// Existential deposit allowed for the token
    pub(crate) existential_deposit: Balance,

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

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct VestingScheduleParams<BlockNumber> {
    // Vesting duration
    pub(crate) duration: BlockNumber,
    // Number of blocks before the vesting begins
    pub(crate) cliff: BlockNumber,
    // Initial instant liquiditiy once vesting begins
    pub(crate) initial_liquidity: Permill,
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct SingleDataObjectUploadParams<JOYBalance> {
    object_creation_params: DataObjectCreationParameters,
    expected_data_size_fee: JOYBalance,
    expected_data_object_deletion_prize: JOYBalance,
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct WhitelistParams<Hash, SingleDataObjectUploadParams> {
    commitment: Hash,
    payload: Option<SingleDataObjectUploadParams>,
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct TokenSaleParams<JOYBalance, Balance, BlockNumber, VestingScheduleParams, WhitelistParams>
{
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

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct TokenSale<JOYBalance, Balance, BlockNumber, VestingScheduleParams, Hash> {
    /// Token's unit price in JOY
    pub unit_price: JOYBalance,
    /// Number of tokens on sale
    pub upper_bound_quantity: Balance,
    /// Block at which the sale started / will start
    pub start_block: BlockNumber,
    /// Block at which the sale will finish
    pub end_block: BlockNumber,
    /// Optional whitelist merkle root comittment
    pub whitelist_commitment: Option<Hash>,
    /// Optional vesting schedule for all tokens on sale
    pub vesting_schedule: Option<VestingScheduleParams>,
}

impl<JOYBalance, Balance, BlockNumber, VestingScheduleParams, Hash>
    TokenSale<JOYBalance, Balance, BlockNumber, VestingScheduleParams, Hash>
{
    fn try_from_params<T: Trait>(
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
            end_block: start_block.saturating_add(params.duration),
            unit_price: params.unit_price,
            upper_bound_quantity: params.upper_bound_quantity,
            vesting_schedule: params.vesting_schedule,
            whitelist_commitment: params.whitelist.map(|p| p.commitment),
        })
    }
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum InitialOfferingState<TokenSaleParams> {
    Idle,
    Sale(TokenSaleParams),
}

/// The possible issuance variants: This is a stub
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum OfferingState<TokenSale> {
    /// Initial idle state
    Idle,

    /// Initial state sale
    Sale(TokenSale),

    /// state for IBCO, it might get decorated with the JOY reserve
    /// amount for the token
    BondingCurve,
}

/// Encapsules validation + IssuanceState construction
impl<TokenSale> OfferingState<TokenSale> {
    pub(crate) fn try_from_initial<T: crate::Trait>(
        initial_issuance_state: InitialOfferingStateOf<T>,
    ) -> Result<OfferingStateOf<T>, DispatchError> {
        match initial_issuance_state {
            InitialOfferingState::Idle => Ok(OfferingStateOf::<T>::Idle),
            InitialOfferingState::Sale(sale_params) => {
                let token_sale = TokenSaleOf::<T>::try_from_params::<T>(sale_params)?;
                Ok(OfferingStateOf::<T>::Sale(token_sale))
            }
        }
    }
}

/// Builder for the token data struct
#[derive(Encode, Decode, Clone, PartialEq, Eq, Default)]
pub struct TokenIssuanceParameters<Balance, Hash, InitialOfferingState> {
    /// Initial issuance
    pub(crate) initial_issuance: Balance,

    /// Initial State builder: stub
    pub(crate) initial_state: InitialOfferingState,

    /// Initial existential deposit
    pub(crate) existential_deposit: Balance,

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
pub struct Outputs<AccountId, Balance>(pub(crate) Vec<Output<AccountId, Balance>>);

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

/// Default trait for InitialOfferingState
impl<TokenSaleParams> Default for InitialOfferingState<TokenSaleParams> {
    fn default() -> Self {
        InitialOfferingState::Idle
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
    /// Increase liquidity for an account
    pub(crate) fn increase_liquidity_by(&mut self, amount: Balance) {
        self.free_balance = self.free_balance.saturating_add(amount);
    }

    /// Decrease liquidity for an account
    pub(crate) fn decrease_liquidity_by(&mut self, amount: Balance) {
        self.free_balance = self.free_balance.saturating_sub(amount);
    }

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

    pub(crate) fn _total_balance(&self) -> Balance {
        self.free_balance.saturating_add(self.reserved_balance)
    }
}
/// Token Data implementation
impl<Balance: Saturating + Copy, Hash, BlockNumber, OfferingState>
    TokenData<Balance, Hash, BlockNumber, OfferingState>
{
    // increase total issuance
    pub(crate) fn increase_issuance_by(&mut self, amount: Balance) {
        self.current_total_issuance = self.current_total_issuance.saturating_add(amount);
    }

    // decrease total issuance
    pub(crate) fn decrease_issuance_by(&mut self, amount: Balance) {
        self.current_total_issuance = self.current_total_issuance.saturating_sub(amount);
    }

    pub(crate) fn try_from_params<T: crate::Trait>(
        params: TokenIssuanceParametersOf<T>,
    ) -> Result<TokenDataOf<T>, DispatchError> {
        let current_block = <frame_system::Module<T>>::block_number();

        // Validation
        if let InitialOfferingStateOf::<T>::Sale(sale_params) = &params.initial_state {
            ensure!(
                sale_params.upper_bound_quantity <= params.initial_issuance,
                Error::<T>::SaleUpperBoundQuantityExceedsInitialTokenSupply
            )
        }

        // Conversion
        let patronage_info =
            PatronageData::<<T as Trait>::Balance, <T as frame_system::Trait>::BlockNumber> {
                last_tally_update_block: current_block,
                tally: <T as Trait>::Balance::zero(),
                rate: params.patronage_rate,
            };

        let issuance_state = OfferingStateOf::<T>::try_from_initial::<T>(params.initial_state)?;

        let token_data = TokenData {
            current_total_issuance: params.initial_issuance,
            issuance_state,
            existential_deposit: params.existential_deposit,
            transfer_policy: params.transfer_policy,
            patronage_info,
        };

        Ok(token_data)
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
    OfferingStateOf<T>,
>;

/// Alias for Token Issuance Parameters
pub(crate) type TokenIssuanceParametersOf<T> = TokenIssuanceParameters<
    <T as crate::Trait>::Balance,
    <T as frame_system::Trait>::Hash,
    InitialOfferingStateOf<T>,
>;

/// Alias for TransferPolicy
pub(crate) type TransferPolicyOf<T> = TransferPolicy<<T as frame_system::Trait>::Hash>;

/// Alias for decrease operation
pub(crate) type DecOp<T> = DecreaseOp<<T as crate::Trait>::Balance>;

/// Alias for the Merkle Proof type
pub(crate) type MerkleProofOf<T> = MerkleProof<<T as frame_system::Trait>::Hashing>;

/// Alias for the output type
pub(crate) type OutputsOf<T> =
    Outputs<<T as frame_system::Trait>::AccountId, <T as crate::Trait>::Balance>;

/// Alias for VestingScheduleParams
pub(crate) type VestingScheduleParamsOf<T> =
    VestingScheduleParams<<T as frame_system::Trait>::BlockNumber>;

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
>;

/// Alias for TokenSale
pub(crate) type TokenSaleOf<T> = TokenSale<
    <T as balances::Trait>::Balance,
    <T as crate::Trait>::Balance,
    <T as frame_system::Trait>::BlockNumber,
    VestingScheduleParamsOf<T>,
    <T as frame_system::Trait>::Hash,
>;

/// Alias for InitialOfferingState
pub(crate) type InitialOfferingStateOf<T> = InitialOfferingState<TokenSaleParamsOf<T>>;

/// Alias for OfferingState
pub(crate) type OfferingStateOf<T> = OfferingState<TokenSaleOf<T>>;
