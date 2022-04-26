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

        /// Account's transferrable balance is insufficient to perform the transfer or initialize token sale
        InsufficientTransferrableBalance,

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

        /// Sale participant's cap (either cap_per_member or whitelisted participant's specific cap)
        /// was exceeded with the purchase
        SalePurchaseCapExceeded,

        /// Cannot add another vesting schedule to an account.
        /// Maximum number of vesting schedules for this account-token pair was reached.
        MaxVestingSchedulesPerAccountPerTokenReached,

        /// Some unsold tokens from previous, finished sale are still unrecovered. Recover them first.
        RemainingUnrecoveredTokensFromPreviousSale,

        /// There are no remaining tokes to recover from the previous token sale.
        NoTokensToRecover,
    }
}
