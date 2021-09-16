use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
#[cfg(feature = "std")]
use strum_macros::EnumIter;

/// Defines well-known working groups.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, EnumIter))]
#[derive(Clone, Copy, Encode, Decode, PartialEq, Eq, Debug)]
pub enum WorkingGroup {
    /* Reserved
        /// Forum working group: working_group::Instance1.
        Forum,
    */
    /// Storage working group: working_group::Instance2.
    Storage,
    /// Storage working group: working_group::Instance3.
    Content,
    /// Operations working group: working_group::Instance4.
    OperationsAlpha,
    /// Operations working group: working_group::Instance6.
    OperationsBeta,
    /// Operations working group: working_group::Instance7.
    OperationsGamma,
    /// Gateway working group: working_group::Instance5.
    Gateway,
}
