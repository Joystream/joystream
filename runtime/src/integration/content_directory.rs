use crate::{AccountId, ContentWorkingGroup, Runtime};

impl content::ContentActorAuthenticator for Runtime {
    type CuratorId = u64;
    type CuratorGroupId = u64;

    fn is_lead(account_id: &AccountId) -> bool {
        // get current lead id
        let maybe_current_lead_id = ContentWorkingGroup::current_lead();
        if let Some(ref current_lead_id) = maybe_current_lead_id {
            if let Ok(worker) = ContentWorkingGroup::ensure_worker_exists(current_lead_id) {
                *account_id == worker.role_account_id
            } else {
                false
            }
        } else {
            false
        }
    }

    fn is_curator(curator_id: &Self::CuratorId, account_id: &AccountId) -> bool {
        if let Ok(worker) = ContentWorkingGroup::ensure_worker_exists(curator_id) {
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
        ContentWorkingGroup::ensure_worker_exists(curator_id).is_ok()
    }
}
