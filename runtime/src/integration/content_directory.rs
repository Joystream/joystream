use crate::{AccountId, ContentWorkingGroup, Runtime};
use common::{membership::MemberOriginValidator, working_group::WorkingGroupAuthenticator};

impl content::ContentActorAuthenticator for Runtime {
    type CuratorId = u64;
    type CuratorGroupId = u64;

    fn is_lead(account_id: &AccountId) -> bool {
        ContentWorkingGroup::is_leader_account_id(account_id)
    }

    fn is_curator(curator_id: &Self::CuratorId, account_id: &AccountId) -> bool {
        ContentWorkingGroup::is_worker_account_id(account_id, curator_id)
    }

    fn is_member(member_id: &Self::MemberId, account_id: &AccountId) -> bool {
        membership::Module::<Runtime>::is_member_controller_account(member_id, account_id)
    }

    fn is_valid_curator_id(curator_id: &Self::CuratorId) -> bool {
        ContentWorkingGroup::ensure_worker_exists(curator_id).is_ok()
    }
    fn validate_member_id(member_id: &Self::MemberId) -> bool {
        membership::Module::<Runtime>::ensure_membership(*member_id).is_ok()
    }
}
