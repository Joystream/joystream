use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

/// Defines well-known working groups.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Copy, Debug)]
pub enum WorkingGroup {
    /* Reserved
        /// Forum working group: working_group::Instance1.
        Forum,
    */
    /// Storage working group: working_group::Instance2.
    Storage,
}
