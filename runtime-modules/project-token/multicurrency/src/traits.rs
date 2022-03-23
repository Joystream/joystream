use frame_support::dispatch::{DispatchError, DispatchResult};

use crate::types::TokenIssuanceParameters;

/// The Base Token Trait
pub trait MultiCurrencyBase<SourceLocation, DestinationLocation = SourceLocation> {
    // provided types

    /// Balance Type
    type Balance;

    /// TokenId Type
    type TokenId;

    // required methods

    fn deposit_creating(
        token_id: Self::TokenId,
        who: SourceLocation,
        amount: Self::Balance,
    ) -> DispatchResult;

    fn deposit_into_existing(
        token_id: Self::TokenId,
        who: SourceLocation,
        amount: Self::Balance,
    ) -> DispatchResult;

    fn slash(token_id: Self::TokenId, who: SourceLocation, amount: Self::Balance)
        -> DispatchResult;

    fn transfer(
        token_id: Self::TokenId,
        src: SourceLocation,
        dst: SourceLocation,
        amount: Self::Balance,
    ) -> DispatchResult;

    fn reserve(
        token_id: Self::TokenId,
        who: SourceLocation,
        amount: Self::Balance,
    ) -> DispatchResult;
    fn unreserve(
        token_id: Self::TokenId,
        who: SourceLocation,
        amount: Self::Balance,
    ) -> DispatchResult;
    fn free_balance(
        token_id: Self::TokenId,
        who: SourceLocation,
    ) -> Result<Self::Balance, DispatchError>;

    fn reserved_balance(
        token_id: Self::TokenId,
        who: SourceLocation,
    ) -> Result<Self::Balance, DispatchError>;

    fn total_balance(
        token_id: Self::TokenId,
        who: SourceLocation,
    ) -> Result<Self::Balance, DispatchError>;

    fn mint(token_id: Self::TokenId, amount: Self::Balance) -> DispatchResult;

    fn burn(token_id: Self::TokenId, amount: Self::Balance) -> DispatchResult;

    fn issue_token(
        issuance_parameters: TokenIssuanceParameters<Self::Balance, SourceLocation>,
    ) -> DispatchResult;

    fn deissue_token(token_id: Self::TokenId) -> DispatchResult;
}
