use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
#[cfg(feature = "std")]
use strum_macros::EnumIter;

/// Defines well-known working groups.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, EnumIter))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Copy, Debug)]
pub enum WorkingGroup {
    /* Reserved
        /// Forum working group: working_group::Instance1.
        Forum,
    */
    /// Storage working group: working_group::Instance2.
    Storage,
    /// Storage working group: working_group::Instance3.
    Content,
}
