mod class;
mod curator_group;
mod entity;
mod entity_creation_voucher;

pub use class::*;
pub use curator_group::*;
pub use entity::*;
pub use entity_creation_voucher::*;

pub use crate::errors::*;
use crate::*;
pub use codec::{Codec, Decode, Encode};
use core::fmt::Debug;
use frame_support::ensure;
#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};

use common::working_group::WorkingGroupAuthenticator;

/// Ensure curator authorization performed succesfully
pub fn ensure_curator_auth_success<T: Config>(
    curator_id: &CuratorId<T>,
    account_id: &T::AccountId,
) -> Result<(), Error<T>> {
    ensure!(
        T::WorkingGroup::is_worker_account_id(account_id, curator_id),
        Error::<T>::CuratorAuthFailed
    );
    Ok(())
}

/// Ensure member authorization performed succesfully
pub fn ensure_member_auth_success<T: Config>(
    member_id: &T::MemberId,
    account_id: &T::AccountId,
) -> Result<(), Error<T>> {
    ensure!(
        T::MemberOriginValidator::is_member_controller_account(member_id, &account_id),
        Error::<T>::MemberAuthFailed
    );

    Ok(())
}

/// Ensure lead authorization performed succesfully
pub fn ensure_lead_auth_success<T: Config>(account_id: &T::AccountId) -> Result<(), Error<T>> {
    ensure!(
        T::WorkingGroup::is_leader_account_id(account_id),
        Error::<T>::LeadAuthFailed
    );
    Ok(())
}

/// Ensure given `Origin` is lead
pub fn ensure_is_lead<T: Config>(origin: T::Origin) -> DispatchResult {
    let account_id = ensure_signed(origin)?;
    Ok(ensure_lead_auth_success::<T>(&account_id)?)
}

/// Enum, representing all possible `Actor`s
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Eq, PartialEq, Clone, Copy, Debug)]
pub enum Actor<
    CuratorGroupId: Default + Clone + Copy,
    CuratorId: Default + Clone + Copy,
    MemberId: Default + Clone + Copy,
> {
    Curator(CuratorGroupId, CuratorId),
    Member(MemberId),
    Lead,
}

impl<
        CuratorGroupId: Default + Clone + Copy,
        CuratorId: Default + Clone + Copy,
        MemberId: Default + Clone + Copy,
    > Default for Actor<CuratorGroupId, CuratorId, MemberId>
{
    fn default() -> Self {
        Self::Lead
    }
}
