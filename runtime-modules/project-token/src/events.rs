use crate::types::{Payment, TokenIssuanceParametersOf, TokenSaleId, TransferPolicyOf};
use frame_support::decl_event;
use sp_std::collections::btree_map::BTreeMap;

decl_event! {
    pub enum Event<T>
    where
        Balance = <T as crate::Trait>::Balance,
        TokenId = <T as crate::Trait>::TokenId,
        AccountId = <T as frame_system::Trait>::AccountId,
        BlockNumber = <T as frame_system::Trait>::BlockNumber,
        TransferPolicy = TransferPolicyOf<T>,
        Payment = Payment<<T as crate::Trait>::Balance>,
        TokenIssuanceParameters = TokenIssuanceParametersOf<T>,
    {
        /// Token amount is deposited
        /// Params:
        /// - token identifier
        /// - recipient account
        /// - amount deposited
        TokenAmountDepositedInto(TokenId, AccountId, Balance),

        /// Token amount is slashed
        /// Params:
        /// - token identifier
        /// - slashed account
        /// - amount slashed
        TokenAmountSlashedFrom(TokenId, AccountId, Balance),

        /// Token amount is transferred from src to dst
        /// Params:
        /// - token identifier
        /// - source account
        /// - outputs: list of pairs (destination account, amount)
        TokenAmountTransferred(TokenId, AccountId, BTreeMap<AccountId, Payment>),

        /// Token amount is reserved
        /// Params:
        /// - token identifier
        /// - account tokens are reserved from
        /// - amount reserved
        TokenAmountReservedFrom(TokenId, AccountId, Balance),

        /// Token amount is unreserved
        /// Params:
        /// - token identifier
        /// - account tokens are unreserved from
        /// - amount reserved
        TokenAmountUnreservedFrom(TokenId, AccountId, Balance),

        /// Patronage rate decreased
        /// Params:
        /// - token identifier
        /// - new patronage rate
        PatronageRateDecreasedTo(TokenId, Balance),

        /// Patronage credit claimed by creator
        /// Params:
        /// - token identifier
        /// - credit amount
        /// - account
        PatronageCreditClaimedAtBlock(TokenId, Balance, AccountId, BlockNumber),

        /// Member joined whitelist
        /// Params:
        /// - token identifier
        /// - account that has just joined
        /// - ongoing transfer policy
        MemberJoinedWhitelist(TokenId, AccountId, TransferPolicy),

        /// Account Dusted
        /// Params:
        /// - token identifier
        /// - account dusted
        /// - account that called the extrinsic
        /// - ongoing policy
        AccountDustedBy(TokenId, AccountId, AccountId, TransferPolicy),

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
        /// - address of the buyer
        TokensPurchasedOnSale(TokenId, TokenSaleId, Balance, AccountId),

        /// Unsold Tokens Unreserved
        /// Params:
        /// - token id
        /// - token sale id
        /// - amount of tokens unreserved
        UnsoldTokensUnreserved(TokenId, TokenSaleId, Balance),
    }
}
