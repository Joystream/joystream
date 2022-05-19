use frame_support::dispatch::DispatchResult;
use sp_runtime::DispatchError;

use crate::types::YearlyRate;

pub trait PalletToken<
    TokenId,
    MemberId,
    AccountId,
    JoyBalance,
    TokenIssuanceParameters,
    BlockNumber,
    TokenSaleParams,
    UploadContext,
    TransfersWithVesting,
>
{
    /// Issue token with specified characteristics
    fn issue_token(
        issuer_account: AccountId,
        issuance_parameters: TokenIssuanceParameters,
        upload_context: UploadContext,
    ) -> Result<TokenId, DispatchError>;

    /// Perform transfer as the issuer, allowing new account creation if the token is Permissioned
    /// and setting optional vesting schedule.
    fn issuer_transfer(
        token_id: TokenId,
        src_member_id: MemberId,
        bloat_bond_payer: AccountId,
        outputs: TransfersWithVesting,
    ) -> DispatchResult;

    /// Update existing, upcoming token sale
    fn update_upcoming_sale(
        token_id: TokenId,
        new_start_block: Option<BlockNumber>,
        new_duration: Option<BlockNumber>,
    ) -> DispatchResult;

    /// Initialize new token sale
    fn init_token_sale(
        token_id: TokenId,
        member_id: MemberId,
        earnings_destination: Option<AccountId>,
        sale_params: TokenSaleParams,
    ) -> DispatchResult;

    /// Remove token data from storage
    fn deissue_token(token_id: TokenId) -> DispatchResult;

    /// Change to permissionless
    fn change_to_permissionless(token_id: TokenId) -> DispatchResult;

    /// Reduce patronage rate to a specified target
    fn reduce_patronage_rate_to(token_id: TokenId, target_rate: YearlyRate) -> DispatchResult;

    /// Allow creator to receive credit into his accounts
    fn claim_patronage_credit(token_id: TokenId, member_id: MemberId) -> DispatchResult;

    /// Issue a revenue split for the token
    fn issue_revenue_split(
        token_id: TokenId,
        start: Option<BlockNumber>,
        duration: BlockNumber,
        allocation_source: AccountId,
        allocation_amount: JoyBalance,
    ) -> DispatchResult;

    /// Finalize split by sending back eventual JOYs leftover
    fn finalize_revenue_split(token_id: TokenId, account_id: AccountId) -> DispatchResult;
}
