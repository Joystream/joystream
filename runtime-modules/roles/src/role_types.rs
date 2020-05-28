use codec::{Decode, Encode};
use rstd::prelude::*;

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Copy, Clone, Ord, PartialOrd, Eq, PartialEq, Debug)]
pub enum Role {
    StorageProvider,
    ChannelOwner,
    CuratorLead,
    Curator,
}

/// Must be default constructable because it indirectly is a value in a storage map.
/// ***SHOULD NEVER ACTUALLY GET CALLED, IS REQUIRED TO DUE BAD STORAGE MODEL IN SUBSTRATE***
impl Default for Role {
    fn default() -> Self {
        Self::Curator
    }
}
