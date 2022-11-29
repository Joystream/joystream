use crate::Module;
use frame_support::decl_error;
use sp_std::convert::TryInto;

decl_error! {
    pub enum Error for Module<T: crate::Config> {
        /// Unexpected arithmetic error (overflow / underflow)
        ArithmeticError,

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

        /// At least one of the members provided as part of InitialAllocation does not exist
        InitialAllocationToNonExistingMember,

        /// Account Already exists
        AccountAlreadyExists,

        /// Transfer destination member id invalid
        TransferDestinationMemberDoesNotExist,

        /// Token's current offering state is not Idle
        TokenIssuanceNotInIdleState,

        /// Insufficient JOY Balance to cover the transaction costs
        InsufficientJoyBalance,

        /// The amount of JOY to be transferred is not enough to keep the destination account alive
        JoyTransferSubjectToDusting,

        /// Attempt to remove non owned account under permissioned mode
        AttemptToRemoveNonOwnedAccountUnderPermissionedMode,

        /// Attempt to remove an account with some outstanding tokens
        AttemptToRemoveNonEmptyAccount,

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

        /// Previous sale was still not finalized, finalize it first.
        PreviousSaleNotFinalized,

        /// There are no remaining tokes to recover from the previous token sale.
        NoTokensToRecover,

        /// Specified sale duration is shorter than MinSaleDuration
        SaleDurationTooShort,

        /// Sale duration cannot be zero
        SaleDurationIsZero,

        /// Upper bound quantity cannot be zero
        SaleUpperBoundQuantityIsZero,

        /// Purchase cap per member cannot be zero
        SaleCapPerMemberIsZero,

        /// Token's unit price cannot be zero
        SaleUnitPriceIsZero,

        /// Amount of tokens to purchase on sale cannot be zero
        SalePurchaseAmountIsZero,

        /// No Sale if Amm is active
        CannotInitSaleIfAmmIsActive,

        // ------ Revenue Split Errors ------------------------------------------------------

        /// Specified revenue split starting block is in the past
        RevenueSplitTimeToStartTooShort,

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

        /// User is not participating in any split
        UserNotParticipantingInAnySplit,

        /// Attempt to participate in a split with zero token to stake
        CannotParticipateInSplitWithZeroAmount,

        /// Attempt to issue in a split with zero allocation amount
        CannotIssueSplitWithZeroAllocationAmount,

        /// Attempt to modify supply when revenue split is active
        CannotModifySupplyWhenRevenueSplitsAreActive,

        /// Revenue split rate cannot be 0
        RevenueSplitRateIsZero,

        // ------ Burning ------------------------------------------------------

        /// Provided amount to burn is == 0
        BurnAmountIsZero,

        /// Amount of tokens to burn exceeds total amount of tokens owned by the account
        BurnAmountGreaterThanAccountTokensAmount,

        /// ------ AMM ---------------------------------------------------------

        /// not in AMM state
        NotInAmmState,

        /// Invalid bonding curve construction parameters
        InvalidCurveParameters,

        /// Deadline constraint not satisfied
        DeadlineExpired,

        /// Slippage tolerance constraint tolerance not satisfied
        SlippageToleranceExceeded,

        /// Creator token balance is insufficient
        InsufficientTokenBalance,

        /// Oustanding AMM-provided supply constitutes too large percentage of the token's total supply
        OutstandingAmmProvidedSupplyTooLarge,
    }
}
