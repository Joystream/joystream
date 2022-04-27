use frame_support::dispatch::DispatchResult;

pub trait PalletToken<
    AccountId,
    Policy,
    IssuanceParams,
    UploadContext,
    BlockNumber,
    TokenSaleParams,
>
{
    /// Balance type used
    type Balance;

    /// Token Identifier type used
    type TokenId;

    /// Merkle Proof Type used
    type MerkleProof;

    /// Yearly rate used for expressing patronage rate
    type YearlyRate;

    /// Issue token with specified characteristics
    fn issue_token(issuance_parameters: IssuanceParams) -> DispatchResult;

    /// Update existing, upcoming token sale
    fn update_upcoming_sale(
        token_id: Self::TokenId,
        new_start_block: Option<BlockNumber>,
        new_duration: Option<BlockNumber>,
    ) -> DispatchResult;

    /// Initialize new token sale
    fn init_token_sale(
        token_id: Self::TokenId,
        sale_params: TokenSaleParams,
        payload_upload_context: UploadContext,
    ) -> DispatchResult;

    /// Remove token data from storage
    fn deissue_token(token_id: Self::TokenId) -> DispatchResult;

    /// Change to permissionless
    fn change_to_permissionless(token_id: Self::TokenId) -> DispatchResult;

    /// Reduce patronage rate by amount
    fn reduce_patronage_rate_by(
        token_id: Self::TokenId,
        decrement: Self::YearlyRate,
    ) -> DispatchResult;

    /// Allow creator to receive credit into his accounts
    fn claim_patronage_credit(token_id: Self::TokenId, to_account: AccountId) -> DispatchResult;
}
