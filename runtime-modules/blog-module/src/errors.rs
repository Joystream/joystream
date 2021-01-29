use crate::{Instance, Module, Trait};
use frame_support::decl_error;

decl_error! {
    /// Blog module predefined errors
    pub enum Error for Module<T: Trait<I>, I: Instance> {
        /// A non-owner is trying to do a privilegeded action.
        BlogOwnershipError,

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

        /// Number of maximum replies reached
        RepliesLimitReached,

        /// Reaction doesn't exists
        InvalidReactionIndex,
    }
}
