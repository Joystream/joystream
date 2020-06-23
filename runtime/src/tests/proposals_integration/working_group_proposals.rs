use super::*;

use proposals_engine::BalanceOf;

use srml_support::StorageLinkedMap;
use system::RawOrigin;

use common::working_group::WorkingGroup;
use hiring::ActivateOpeningAt;
use proposals_codex::AddOpeningParameters;
use working_group::OpeningPolicyCommitment;

use crate::StorageWorkingGroupInstance;
type StorageWorkingGroup = working_group::Module<Runtime, StorageWorkingGroupInstance>;

#[test]
fn create_add_working_group_leader_opening_proposal_execution_succeeds() {
    initial_test_ext().execute_with(|| {
        let member_id = 1;
        let account_id: [u8; 32] = [member_id; 32];

        let opening_id = StorageWorkingGroup::next_opening_id();

        assert!(!<working_group::OpeningById<
            Runtime,
            StorageWorkingGroupInstance,
        >>::exists(opening_id));

        let codex_extrinsic_test_fixture = CodexProposalTestFixture {
            member_id: member_id as u64,
            successful_call: || {
                ProposalCodex::create_add_working_group_leader_opening_proposal(
                    RawOrigin::Signed(account_id.clone().into()).into(),
                    member_id as u64,
                    b"title".to_vec(),
                    b"body".to_vec(),
                    Some(<BalanceOf<Runtime>>::from(100_000_u32)),
                    AddOpeningParameters {
                        activate_at: ActivateOpeningAt::CurrentBlock,
                        commitment: OpeningPolicyCommitment::default(),
                        human_readable_text: Vec::new(),
                        working_group: WorkingGroup::Storage,
                    },
                )
            },
        };

        codex_extrinsic_test_fixture.call_extrinsic_and_assert();

        assert!(<working_group::OpeningById<
            Runtime,
            StorageWorkingGroupInstance,
        >>::exists(opening_id));
    });
}
