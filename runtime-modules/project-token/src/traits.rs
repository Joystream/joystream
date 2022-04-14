use frame_support::dispatch::DispatchResult;

/// Account wrapper that encapsulates the validation for the transfer location
/// by means of the visitor pattern
pub trait TransferLocationTrait<AccountId, Policy> {
    /// encapsulates eventual merkle tree validation given policy
    fn is_valid_location_for_policy(&self, policy: &Policy) -> bool;

    /// the wrapped account
    fn location_account(&self) -> AccountId;
}

pub trait PalletToken<AccountId, Policy, IssuanceParams> {
    /// Balance type used
    type Balance;

    /// Token Identifier type used
    type TokenId;

    /// Merkle Proof Type used
    type MerkleProof;

    /// Issue token with specified characteristics
    fn issue_token(
        owner_account_id: AccountId,
        issuance_parameters: IssuanceParams,
    ) -> DispatchResult;

    /// Remove token data from storage
    fn deissue_token(token_id: Self::TokenId) -> DispatchResult;

    /// Change to permissionless
    fn change_to_permissionless(token_id: Self::TokenId) -> DispatchResult;

    /// Reduce patronage rate by amount
    fn reduce_patronage_rate_by(
        token_id: Self::TokenId,
        decrement: Self::Balance,
    ) -> DispatchResult;

    /// Allow creator to receive credit into his accounts
    fn claim_patronage_credit(token_id: Self::TokenId, to_account: AccountId) -> DispatchResult;
}
