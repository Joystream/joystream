#![allow(clippy::unused_unit)]

use crate::types::{
    JoyBalanceOf, RevenueSplitId, TokenIssuanceParametersOf, TokenSaleId, TokenSaleOf,
    TransferPolicyOf, ValidatedTransfersOf,
};
use common::MembershipTypes;
use frame_support::decl_event;
use sp_runtime::Perquintill;
use sp_std::vec::Vec;

decl_event! {
    pub enum Event<T>
    where
        Balance = <T as crate::Config>::Balance,
        JoyBalance = JoyBalanceOf<T>,
        TokenId = <T as crate::Config>::TokenId,
        AccountId = <T as frame_system::Config>::AccountId,
        MemberId = <T as MembershipTypes>::MemberId,
        BlockNumber = <T as frame_system::Config>::BlockNumber,
        TransferPolicy = TransferPolicyOf<T>,
        TokenIssuanceParameters = TokenIssuanceParametersOf<T>,
        ValidatedTransfers = ValidatedTransfersOf<T>,
        TokenSale = TokenSaleOf<T>,

    {
        /// Token amount is transferred from src to dst
        /// Params:
        /// - token identifier
        /// - source member id
        /// - map containing validated outputs (amount, remark) data indexed by
        ///   (member_id + account existance)
        TokenAmountTransferred(TokenId, MemberId, ValidatedTransfers),

        /// Token amount transferred by issuer
        /// Params:
        /// - token identifier
        /// - source (issuer) member id
        /// - map containing validated outputs
        ///   (amount, opt. vesting schedule, opt. vesting cleanup key, remark) data indexed by
        ///   (account_id + account existance)
        TokenAmountTransferredByIssuer(TokenId, MemberId, ValidatedTransfers),

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

        /// Revenue Split issued
        /// Params:
        /// - token identifier
        /// - starting block for the split
        /// - duration of the split
        /// - JOY allocated for the split
        RevenueSplitIssued(TokenId, BlockNumber, BlockNumber, JoyBalance),

        /// Revenue Split finalized
        /// Params:
        /// - token identifier
        /// - recovery account for the leftover funds
        /// - leftover funds
        RevenueSplitFinalized(TokenId, AccountId, JoyBalance),

        /// User partipated in a revenue split
        /// Params:
        /// - token identifier
        /// - participant's member id
        /// - user allocated staked balance
        /// - dividend amount (JOY) granted
        /// - revenue split identifier
        UserParticipatedInSplit(TokenId, MemberId, Balance, JoyBalance, RevenueSplitId),

        /// User left revenue split
        /// Params:
        /// - token identifier
        /// - ex-participant's member id
        /// - amount unstaked
        RevenueSplitLeft(TokenId, MemberId, Balance),

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

        /// Toke Sale was Initialized
        /// Params:
        /// - token id
        /// - token sale id
        /// - token sale data
        /// - token sale metadata
        TokenSaleInitialized(TokenId, TokenSaleId, TokenSale, Option<Vec<u8>>),

        /// Upcoming Token Sale was Updated
        /// Params:
        /// - token id
        /// - token sale id
        /// - new sale start block
        /// - new sale duration
        UpcomingTokenSaleUpdated(TokenId, TokenSaleId, Option<BlockNumber>, Option<BlockNumber>),

        /// Tokens Purchased On Sale
        /// Params:
        /// - token id
        /// - token sale id
        /// - amount of tokens purchased
        /// - buyer's member id
        TokensPurchasedOnSale(TokenId, TokenSaleId, Balance, MemberId),

        /// Token Sale Finalized
        /// Params:
        /// - token id
        /// - token sale id
        /// - amount of unsold tokens recovered
        /// - amount of JOY collected
        TokenSaleFinalized(TokenId, TokenSaleId, Balance, JoyBalance),

        /// Transfer Policy Changed To Permissionless
        /// Params:
        /// - token id
        TransferPolicyChangedToPermissionless(TokenId),
    }
}
