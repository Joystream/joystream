use crate::{AccountId, ContentDirectoryWorkingGroup, ContentDirectoryWorkingGroupInstance, Runtime, Members};

use common::working_group::WorkingGroupAuthenticator;
use common::membership::MemberOriginValidator;

impl content::ContentActorAuthenticator for Runtime {
    type CuratorId = u64;
    type CuratorGroupId = u64;

    fn is_lead(account_id: &AccountId) -> bool {
        ContentDirectoryWorkingGroup::is_leader_account_id(&account_id)
    }

    fn is_curator(curator_id: &Self::CuratorId, account_id: &AccountId) -> bool {
        ContentDirectoryWorkingGroup::is_worker_account_id(account_id, curator_id)
    }

    fn is_member(member_id: &Self::MemberId, account_id: &AccountId) -> bool {
        Members::is_member_controller_account(
            member_id, account_id,
        )
    }

    fn is_valid_curator_id(curator_id: &Self::CuratorId) -> bool {
        working_group::ensure_worker_exists::<Runtime, ContentDirectoryWorkingGroupInstance>(curator_id).is_ok()
    }
}
