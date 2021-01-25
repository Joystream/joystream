use crate::{Instance, Module, Trait};
use frame_support::decl_error;

decl_error! {
    pub enum Error for Module<T: Trait<I>, I: Instance> {
        BlogOwnershipError,
        PostNotFound,
        PostLockedError,
        ReplyNotFound,
        ReplyOwnershipError,
        PostTitleTooLong,
        PostBodyTooLong,
        ReplyTextTooLong,
        PostLimitReached,
        RepliesLimitReached,
        InvalidReactionIndex,
    }
}
