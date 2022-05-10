use frame_support::dispatch::DispatchResult;

pub trait PalletToken<
    AccountId,
    Policy,
    IssuanceParams,
    BlockNumber,
    TokenSaleParams,
    UploadContext,
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
    fn issue_token(
        issuer: AccountId,
        issuance_parameters: IssuanceParams,
        upload_context: UploadContext,
    ) -> DispatchResult;

    /// Update existing, upcoming token sale
    fn update_upcoming_sale(
        token_id: Self::TokenId,
        new_start_block: Option<BlockNumber>,
        new_duration: Option<BlockNumber>,
    ) -> DispatchResult;

    /// Initialize new token sale
    fn init_token_sale(token_id: Self::TokenId, sale_params: TokenSaleParams) -> DispatchResult;

    /// Remove token data from storage
    fn deissue_token(token_id: Self::TokenId) -> DispatchResult;

    /// Change to permissionless
    fn change_to_permissionless(token_id: Self::TokenId) -> DispatchResult;

    /// Reduce patronage rate to a specified target
    fn reduce_patronage_rate_to(
        token_id: Self::TokenId,
        target_rate: Self::YearlyRate,
    ) -> DispatchResult;

    /// Allow creator to receive credit into his accounts
    fn claim_patronage_credit(token_id: Self::TokenId, to_account: AccountId) -> DispatchResult;

    /// Issue a revenue split for the token
    fn issue_revenue_split(
        token_id: Self::TokenId,
        start: BlockNumber,
        duration: BlockNumber,
        allocation_source: AccountId,
        allocation_amount: Self::ReserveBalance,
    ) -> DispatchResult;

    /// Finalize split by sending back eventual JOYs leftover
    fn finalize_revenue_split(token_id: Self::TokenId, account_id: AccountId) -> DispatchResult;
}
