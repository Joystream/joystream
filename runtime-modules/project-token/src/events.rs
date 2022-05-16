use crate::types::{
    TokenIssuanceParametersOf, TokenSaleId, TransferPolicyOf, Transfers, Validated,
};
use common::MembershipTypes;
use frame_support::decl_event;
use sp_runtime::Perquintill;

decl_event! {
    pub enum Event<T>
    where
        Balance = <T as crate::Trait>::Balance,
        TokenId = <T as crate::Trait>::TokenId,
        AccountId = <T as frame_system::Trait>::AccountId,
        MemberId = <T as MembershipTypes>::MemberId,
        TransferPolicy = TransferPolicyOf<T>,
        TokenIssuanceParameters = TokenIssuanceParametersOf<T>,
        ValidatedTransfers = Transfers<Validated<<T as MembershipTypes>::MemberId>, <T as crate::Trait>::Balance>,
    {
        /// Token amount is transferred from src to dst
        /// Params:
        /// - token identifier
        /// - source member id
        /// - outputs: list of pairs (destination member id, amount)
        TokenAmountTransferred(TokenId, MemberId, ValidatedTransfers),

        /// Patronage rate decreased
        /// Params:
        /// - token identifier
        /// - new patronage rate
        PatronageRateDecreasedTo(TokenId, Perquintill),

        /// Patronage credit claimed by creator
        /// Params:
        /// - token identifier
        /// - credit amount
        /// - member id
        PatronageCreditClaimed(TokenId, Balance, MemberId),

        /// Member joined whitelist
        /// Params:
        /// - token identifier
        /// - member id
        /// - ongoing transfer policy
        MemberJoinedWhitelist(TokenId, MemberId, TransferPolicy),

        /// Account Dusted
        /// Params:
        /// - token identifier
        /// - id of the dusted account owner member
        /// - account that called the extrinsic
        /// - ongoing policy
        AccountDustedBy(TokenId, MemberId, AccountId, TransferPolicy),

        /// Token Deissued
        /// Params:
        /// - token id
        TokenDeissued(TokenId),

        /// Token Issued
        /// Params:
        /// - token id
        /// - token issuance parameters
        TokenIssued(TokenId, TokenIssuanceParameters),

        /// Tokens Purchased On Sale
        /// Params:
        /// - token id
        /// - token sale id
        /// - amount of tokens purchased
        /// - buyer's member id
        TokensPurchasedOnSale(TokenId, TokenSaleId, Balance, MemberId),

        /// Unsold Tokens Recovered
        /// Params:
        /// - token id
        /// - token sale id
        /// - amount of tokens recovered
        UnsoldTokensRecovered(TokenId, TokenSaleId, Balance),
    }
}
