use crate::{AccountId, ContentDirectoryWorkingGroupInstance, Runtime};

// Alias for content directory working group
pub(crate) type ContentDirectoryWorkingGroup<T> =
    working_group::Module<T, ContentDirectoryWorkingGroupInstance>;

impl content::ContentActorAuthenticator for Runtime {
    type CuratorId = u64;
    type CuratorGroupId = u64;

    fn is_lead(account_id: &AccountId) -> bool {
        // get current lead id
        let maybe_current_lead_id = ContentDirectoryWorkingGroup::<Runtime>::current_lead();
        if let Some(ref current_lead_id) = maybe_current_lead_id {
            if let Ok(worker) =
                ContentDirectoryWorkingGroup::<Runtime>::ensure_worker_exists(current_lead_id)
            {
                *account_id == worker.role_account_id
            } else {
                false
            }
        } else {
            false
        }
    }

    fn is_curator(curator_id: &Self::CuratorId, account_id: &AccountId) -> bool {
        if let Ok(worker) =
            ContentDirectoryWorkingGroup::<Runtime>::ensure_worker_exists(curator_id)
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

    fn is_valid_curator_id(curator_id: &Self::CuratorId) -> bool {
        ContentDirectoryWorkingGroup::<Runtime>::ensure_worker_exists(curator_id).is_ok()
    }
}
