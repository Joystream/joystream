use rstd::prelude::*;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use codec::{Decode, Encode};

/// Represents a discussion thread
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Thread<AuthorId, BlockNumber> {
    /// Title
    pub title: Vec<u8>,

    /// When thread was established.
    pub created_at: BlockNumber,

    /// Author of post.
    pub author_id: AuthorId,
}
