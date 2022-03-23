use frame_support::dispatch::{DispatchError, DispatchResult};
use sp_std::convert::Into;

use crate::types::TokenIssuanceParameters;

/// The Base Token Trait
pub trait MultiCurrencyBase<AccountId> {
    // provided types

    /// Balance Type
    type Balance;

    /// TokenId Type
    type TokenId;

    // required methods

    /// Mint `amount` into account `who` (possibly creating it)
    fn deposit_creating(
        token_id: Self::TokenId,
        who: AccountId,
        amount: Self::Balance,
    ) -> DispatchResult;

    /// Mint `amount` into valid account `who`
    fn deposit_into_existing(
        token_id: Self::TokenId,
        who: AccountId,
        amount: Self::Balance,
    ) -> DispatchResult;

    /// Burn `amount` of token `token_id` by slashing it from `who`
    fn slash(token_id: Self::TokenId, who: AccountId, amount: Self::Balance) -> DispatchResult;

    /// Transfer `amount` from `src` account to `dst`
    fn transfer<DestinationLocation: Into<AccountId> + Clone>(
        token_id: Self::TokenId,
        src: AccountId,
        dst: DestinationLocation,
        amount: Self::Balance,
    ) -> DispatchResult;

    /// Mint `amount` for token `token_id`
    fn mint(token_id: Self::TokenId, amount: Self::Balance) -> DispatchResult;

    /// Burn `amount` for token `token_id`
    fn burn(token_id: Self::TokenId, amount: Self::Balance) -> DispatchResult;

    /// Issue token with specified characteristics
    fn issue_token(
        issuance_parameters: TokenIssuanceParameters<Self::Balance, AccountId>,
    ) -> DispatchResult;

    /// Remove token data from storage
    fn deissue_token(token_id: Self::TokenId) -> DispatchResult;

    /// Retrieve usable balance for token and account
    fn balance(token_id: Self::TokenId, who: AccountId) -> Result<Self::Balance, DispatchError>;

    /// Retrieve total current issuance for token
    fn current_issuance(token_id: Self::TokenId) -> Result<Self::Balance, DispatchError>;
}

pub trait ReservableMultiCurrency<AccountId> {
    // provided types

    /// Balance Type
    type Balance;

    /// Token Id Type
    type TokenId;

    /// Reserve `amount` of token for `who`
    fn reserve(token_id: Self::TokenId, who: AccountId, amount: Self::Balance) -> DispatchResult;

    /// Unreserve `amount` of token for `who`
    fn unreserve(token_id: Self::TokenId, who: AccountId, amount: Self::Balance) -> DispatchResult;

    /// Retrieve reserved balance for token and account
    fn reserved_balance(
        token_id: Self::TokenId,
        who: AccountId,
    ) -> Result<Self::Balance, DispatchError>;

    /// Retrieve free + reserve balance
    fn total_balance(
        token_id: Self::TokenId,
        who: AccountId,
    ) -> Result<Self::Balance, DispatchError>;
}

/// Interface for the transfer policy type
pub trait TransferPermissionPolicy<TransferLocation, Hash> {
    /// Establish whether transfer location is allowed for the policy
    fn can_transfer_to(&self, location: &TransferLocation) -> bool;

    /// Predicate method for distinguishing permissionless state
    fn ensure_permissionless(&self) -> DispatchResult;

    /// Predicate method for distinguishing permissioned state
    fn ensure_permissioned(&self) -> Result<Hash, DispatchError>;

    // Transition function to permissionless state
    fn change_to_permissionless(&mut self);

    // Transition function to permissioned state with the given whitelist commitment
    fn change_to_permissioned(&mut self, whitelist_commitment: Hash);
}

/// Account wrapper that encapsulates the validation for the transfer location
/// by means of the visitor pattern
pub trait TransferLocationTrait<AccountId, Hash> {
    // TODO: enable after TransferTransmissionPolicy implementation
    // type Policy: TransferPermissionPolicy<Self, Hash>;

    /// encapsulates eventual merkle tree validation given policy
    fn is_valid_location_for_policy(
        &self,
        // TODO: replace with Policy?
        policy: &dyn TransferPermissionPolicy<Self, Hash>, // visitee
    ) -> bool;

    /// the wrapped account
    fn location_account(&self) -> AccountId;
}
