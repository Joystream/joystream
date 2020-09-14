use crate::{AccountId, MemberId, Runtime};

// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;

// Alias for storage working group
pub(crate) type StorageWorkingGroup<T> = working_group::Module<T, StorageWorkingGroupInstance>;

impl content_directory::ActorAuthenticator for Runtime {
    type CuratorId = u64;
    type MemberId = MemberId;
    type CuratorGroupId = u64;

    fn is_lead(account_id: &AccountId) -> bool {
        <pallet_sudo::Module<Runtime>>::key() == *account_id
    }

    fn is_curator(curator_id: &Self::CuratorId, account_id: &AccountId) -> bool {
        if let Ok(worker) = StorageWorkingGroup::<Runtime>::ensure_worker_exists(curator_id) {
            *account_id == worker.role_account_id
        } else {
            false
        }
    }

    fn is_member(member_id: &Self::MemberId, account_id: &AccountId) -> bool {
        membership::Module::<Runtime>::ensure_is_controller_account_for_member(
            member_id, account_id,
        )
        .is_ok()
    }
}
