use crate::{AccountId, ContentDirectoryWorkingGroupInstance, Runtime};

impl content_directory::ActorAuthenticator for Runtime {
    type CuratorId = u64;
    type CuratorGroupId = u64;

    fn is_curator(curator_id: &Self::CuratorId, account_id: &AccountId) -> bool {
        if let Ok(worker) = working_group::ensure_worker_exists::<
            Runtime,
            ContentDirectoryWorkingGroupInstance,
        >(curator_id)
        {
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
