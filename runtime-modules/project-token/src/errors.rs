use crate::Module;
use frame_support::decl_error;

decl_error! {
    pub enum Error for Module<T: crate::Trait> {
        /// Free balance is insufficient
        InsufficientFreeBalance,

        /// Requested token does not exist
        TokenDoesNotExist,

        /// Requested account data does not exist
        AccountInformationDoesNotExist,

        /// Merkle proof verification failed
        MerkleProofVerificationFailure,

        /// Source and Destination Location coincide
        SameSourceAndDestinationLocations,

        /// Patronage reduction exceeeding patronage rate
        ReductionExceedingPatronageRate,

        /// Symbol already in use
        TokenSymbolAlreadyInUse,

        /// Account Already exists
        AccountAlreadyExists,

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

    }
}
