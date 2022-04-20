use frame_support::dispatch::DispatchResult;
use sp_runtime::Permill;

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
    fn reduce_patronage_rate_by(token_id: Self::TokenId, decrement: Permill) -> DispatchResult;

    /// Allow creator to receive credit into his accounts
    fn claim_patronage_credit(token_id: Self::TokenId, to_account: AccountId) -> DispatchResult;
}
