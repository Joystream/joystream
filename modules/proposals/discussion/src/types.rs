use rstd::prelude::*;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use codec::{Decode, Encode};

/// Represents a discussion thread
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Thread<ThreadAuthorId, BlockNumber> {
    /// Title
    pub title: Vec<u8>,

    /// When thread was established.
    pub created_at: BlockNumber,

    /// Author of the thread.
    pub author_id: ThreadAuthorId,
}

/// Post for the discussion thread
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Post<PostAuthorId, BlockNumber, ThreadId> {
    /// Text
    pub text: Vec<u8>,

    /// When post was added.
    pub created_at: BlockNumber, //TODO rename to updated_at?

    /// Author of the post.
    pub author_id: PostAuthorId,

    /// Parent thread id for this post
    pub thread_id: ThreadId,
}
