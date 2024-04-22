use crate::Module;
use frame_support::decl_error;
use sp_std::convert::TryInto;

decl_error! {
    pub enum Error for Module<T: crate::Config> {

        /// Bridge not on active state
        BridgeNotActive,

        /// Insufficient JOY Balance to cover the transaction costs
        InsufficientJoyBalance,

        /// The bridging_fee changed since the request transfer
        FeeDifferentThanExpected,

        /// Not enough mint allowance for transaction
        InsufficienBridgMintAllowance,

        /// Operator account required
        NotOperatorAccount,

        /// Pauser account required
        NotPauserAccount,

        /// Number of pauser accounts over the maximum allowed
        InvalidNumberOfPauserAccounts,

        /// Current block is lower than thawn_started_at + thawn_duration
        ThawnNotFinished,

        /// ChainId is not on the list of the supported chains
        NotSupportedRemoteChainId
    }
}
