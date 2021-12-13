use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
#[cfg(feature = "std")]
use strum_macros::EnumIter;

/// Defines well-known working groups.
/// Additional integer values are set to maintain the index of the enum variants after its
/// modifying. The 'isize' suffix is required by the 'clippy' linter. We should revisit it after we
/// upgrade the rust compiler version (current version is "nightly-2021-02-20-x86_64").
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, EnumIter))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Copy, Debug, PartialOrd, Ord)]
pub enum WorkingGroup {
    /// Storage working group: working_group::Instance2.
    Storage,

    /// Storage working group: working_group::Instance3.
    Content,

    /// Operations working group: working_group::Instance4.
    OperationsAlpha,

    /// Gateway working group: working_group::Instance5.
    Gateway,

    /// Distribution working group: working_group::Instance6.
    Distribution,

    /// Operations working group: working_group::Instance7.
    OperationsBeta,

    /// Operations working group: working_group::Instance8.
    OperationsGamma,
}
