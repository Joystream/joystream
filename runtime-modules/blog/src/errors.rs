use crate::{Instance, Module, Config};
use frame_support::decl_error;

decl_error! {
    /// Blog module predefined errors
    pub enum Error for Module<T: Config<I>, I: Instance> {
        /// A non-owner is trying to do a privilegeded action.
        BlogOwnershipError,

        /// A non-member is trying to participate
        MembershipError,

        /// Post do not exists.
        PostNotFound,

        /// Post is locked for modifications.
        PostLockedError,

        /// Reply do no exists.
        ReplyNotFound,

        /// A non-owner of a reply is trying to do a privileged action.
        ReplyOwnershipError,

        /// Number of posts exceeds limits.
        PostLimitReached,

        /// Reaction doesn't exists
        InvalidReactionIndex,

        /// Insuficient balance for reply creation
        InsufficientBalanceForReply,

        /// This error represent the invalid state where there is not enough funds in a post
        /// account to pay off its delete
        InsufficientBalanceInPostAccount,
    }
}
