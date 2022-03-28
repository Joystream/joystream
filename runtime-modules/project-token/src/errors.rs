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

        /// Current total issuance cannot be decrease by specified amount
        InsufficientIssuanceToDecreaseByAmount,

        /// Requested token does not exist
        TokenDoesNotExist,

        /// Requested account data does not exist
        AccountInformationDoesNotExist,

        /// Existential deposit >= initial issuance
        ExistentialDepositExceedsInitialIssuance,

        /// Location and current policy are not compatible
        LocationIncompatibleWithCurrentPolicy,
    }
}
