use crate::Module;
use frame_support::decl_error;

decl_error! {
    pub enum Error for Module<T: crate::Trait> {
        /// Account's transferrable balance is insufficient to perform the transfer or initialize token sale
        InsufficientTransferrableBalance,

        /// Requested token does not exist
        TokenDoesNotExist,

        /// Requested account data does not exist
        AccountInformationDoesNotExist,

        /// Merkle proof verification failed
        MerkleProofVerificationFailure,

        /// Target Rate is higher than current patronage rate
        TargetPatronageRateIsHigherThanCurrentRate,

        /// Symbol already in use
        TokenSymbolAlreadyInUse,

        /// Account Already exists
        AccountAlreadyExists,

        /// Token's current offering state is not Idle
        TokenIssuanceNotInIdleState,

        /// Insufficient JOY Balance to cover the transaction costs
        InsufficientJoyBalance,

        /// Attempt to removed non owned account under permissioned mode
        AttemptToRemoveNonOwnedAccountUnderPermissionedMode,

        /// Attempt to removed non empty non owned
        AttemptToRemoveNonOwnedAndNonEmptyAccount,

        /// Cannot join whitelist in permissionless mode
        CannotJoinWhitelistInPermissionlessMode,

        /// Cannot Deissue Token with outstanding accounts
        CannotDeissueTokenWithOutstandingAccounts,

        // ------Token Sale Errors ------------------------------------------------------

        /// The token has no upcoming sale
        NoUpcomingSale,

        /// The token has no active sale at the moment
        NoActiveSale,

        /// Account's JOY balance is insufficient to make the token purchase
        InsufficientBalanceForTokenPurchase,

        /// Amount of tokens to purchase on sale exceeds the quantity of tokens still available on the sale
        NotEnoughTokensOnSale,

        /// Specified sale starting block is in the past
        SaleStartingBlockInThePast,

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

        // ------Revenue Split Errors ------------------------------------------------------

        /// Specified revenue split starting block is in the past
        RevenueSplitStartingBlockInThePast,

        /// Revenue Split duration is too short
        RevenueSplitDurationTooShort,

        /// Attempt to activate split with one ongoing
        RevenueSplitAlreadyActiveForToken,

        /// Attempt to make revenue split operations with token not in active split state
        RevenueSplitNotActiveForToken,

        /// Revenue Split has not ended yet
        RevenueSplitDidNotEnd,

        /// Revenue Split for token active, but not ongoing
        RevenueSplitNotOngoing,

        /// User already participating in the revenue split
        UserAlreadyParticipating,

        /// User does not posses enough balance to participate in the revenue split
        InsufficientBalanceForSplitParticipation,

        /// Attempt to claim revenue split by a non participant
        UserNotAParticipantForTheSplit,
    }
}
