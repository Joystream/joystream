use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_runtime::DispatchResult;
#[cfg(feature = "std")]
use strum_macros::EnumIter;

/// Defines well-known working groups.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, EnumIter))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Copy, Debug)]
pub enum WorkingGroup {
    /// Forum working group: working_group::Instance1.
    Forum,
    /// Storage working group: working_group::Instance2.
    Storage,
    /// Content directory working group: working_group::Instance3.
    Content,
    /// Membership working group: working_group::Instance4.
    Membership,
}

/// Working group interface to use in the in the pallets with working groups.
pub trait WorkingGroupIntegration<T: crate::Trait> {
    /// Validate origin for the worker.
    fn ensure_worker_origin(origin: T::Origin, worker_id: &T::ActorId) -> DispatchResult;

    /// Validate origin for the active leader.
    fn ensure_leader_origin(origin: T::Origin) -> DispatchResult;

    /// Get member ID of the current leader.
    fn get_leader_member_id() -> Option<T::MemberId>;

    // TODO: Implement or remove during the Forum refactoring to this interface
    // /// Defines whether the member is the leader of the working group.
    // fn is_working_group_leader(member_id: &T::MemberId) -> bool;
    //
    // /// Defines whether the member is the worker of the working group.
    // fn is_working_group_member(member_id: &T::MemberId) -> bool;
}
