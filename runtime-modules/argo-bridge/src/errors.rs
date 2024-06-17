use crate::Module;
use frame_support::decl_error;
use sp_std::convert::TryInto;

decl_error! {
    pub enum Error for Module<T: crate::Config> {
        /// Unexpected arithmetic error (overflow / underflow)
        ArithmeticError,

        /// Bridge not in active state
        BridgeNotActive,

        /// Bridge not in paused state
        BridgeNotPaused,

        /// Insufficient JOY Balance to cover the transaction costs
        InsufficientJoyBalance,

        /// The bridging_fee changed since the request transfer
        FeeDifferentThanExpected,

        /// Not enough mint allowance for transaction
        InsufficientBridgeMintAllowance,

        /// Operator account required
        NotOperatorAccount,

        /// Operator was not yet set
        OperatorAccountNotSet,

        /// Pauser account required
        NotPauserAccount,

        /// Number of pauser accounts over the maximum allowed
        InvalidNumberOfPauserAccounts,

        /// Current block is lower than thawn_ends_at
        ThawnNotFinished,

        /// ChainId is not on the list of the supported chains
        NotSupportedRemoteChainId
    }
}
