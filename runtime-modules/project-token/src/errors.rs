use crate::Module;
use frame_support::decl_error;

decl_error! {
    pub enum Error for Module<T: crate::Trait> {
        /// Free balance is insufficient for freezing specified amount
        InsufficientFreeBalanceForReserving,

        /// Reserved balance is insufficient for unfreezing specified amount
        InsufficientReservedBalance,

        /// Free balance is insufficient for slashing specified amount
        InsufficientFreeBalanceForDecreasing,

        /// Free balance is insufficient for transferring specfied amount
        InsufficientFreeBalanceForTransfer,

        /// Token's total supply cannot be decreased by specified amount
        InsufficientTotalSupplyToDecreaseByAmount,

        /// Requested token does not exist
        TokenDoesNotExist,

        /// Requested account data does not exist
        AccountInformationDoesNotExist,

        /// Existential deposit >= initial issuance
        ExistentialDepositExceedsInitialIssuance,

        /// Merkle proof verification failed
        MerkleProofVerificationFailure,

        /// Merkle proof not provided
        MerkleProofNotProvided,

        /// Source and Destination Location coincide
        SameSourceAndDestinationLocations,

        /// Patronage reduction exceeeding patronage rate
        ReductionExceedingPatronageRate,

        /// Symbol already in use
        TokenSymbolAlreadyInUse,

        /// Account Already exists
        AccountAlreadyExists,

        /// Specified sale starting block is in the past
        SaleStartingBlockInThePast,

        /// Token's current issuance state is not Idle
        TokenIssuanceNotInIdleState,

        /// The token has no upcoming sale
        NoUpcomingSale,

        /// The token has no active sale at the moment
        NoActiveSale,

        /// Account's JOY balance is insufficient to make the token purchase
        InsufficientBalanceForTokenPurchase,

        /// Amount of tokens to purchase on sale exceeds the quantity of tokens still available on the sale
        NotEnoughTokensOnSale,

        /// Insufficient Balance for Bloat bond
        InsufficientBalanceForBloatBond,

        /// Attempt to removed non owned account under permissioned mode
        AttemptToRemoveNonOwnedAccountUnderPermissionedMode,

        /// Attempt to removed non empty non owned
        AttemptToRemoveNonOwnedAndNonEmptyAccount,

        /// Cannot join whitelist in permissionless mode
        CannotJoinWhitelistInPermissionlessMode,

        /// Cannot Deissue Token with outstanding accounts
        CannotDeissueTokenWithOutstandingAccounts,

        /// Token issuance is not zero
        TokenIssuanceIsNotZero,

        /// Only whitelisted participants are allowed to access the sale, therefore access proof is required
        SaleAccessProofRequired,

        /// Participant in sale access proof provided during `purchase_tokens_on_sale`
        /// does not match the sender account
        SaleAccessProofParticipantIsNotSender,

        /// Whitelisted sale participant's cap was exceeded by the purchase
        SaleParticipantCapExceeded,

        /// Cannot add another vesting balance. Maximum number of vesting balances for this account-token
        /// pair was reached.
        MaxVestingBalancesPerAccountPerTokenReached,

        /// Some tokens reverved during previous, finished sale are still reserved. Unreserve them first.
        RemainingReservedTokensFromPreviousSale,

        /// There are no remaining tokes to unreserve from previous token sale.
        NoTokensToUnreserve,
    }
}
