use frame_support::decl_event;

decl_event! {
    pub enum Event<T>
    where
        Balance = <T as crate::Trait>::Balance,
        TokenId = <T as crate::Trait>::TokenId,
        AccountId = <T as frame_system::Trait>::AccountId,
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
        /// - destination account
        /// - amount transferred
        TokenAmountTransferred(TokenId, AccountId, AccountId, Balance),

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

    }
}
