use crate::{Call, Runtime};
use proposals_codex::{ProposalDetails, ProposalDetailsOf, ProposalEncoder};
use roles::actors::Role;

use codec::Encode;
use rstd::vec::Vec;
use srml_support::print;

/// _ProposalEncoder_ implementation. It encodes extrinsics with proposal details parameters
/// using Runtime Call and parity codec.
pub struct ExtrinsicProposalEncoder;
impl ProposalEncoder<Runtime> for ExtrinsicProposalEncoder {
    fn encode_proposal(proposal_details: ProposalDetailsOf<Runtime>) -> Vec<u8> {
        match proposal_details {
            ProposalDetails::Text(text) => {
                Call::ProposalsCodex(proposals_codex::Call::execute_text_proposal(text)).encode()
            }
            ProposalDetails::SetElectionParameters(election_parameters) => Call::CouncilElection(
                governance::election::Call::set_election_parameters(election_parameters),
            )
            .encode(),
            ProposalDetails::SetContentWorkingGroupMintCapacity(mint_balance) => {
                Call::ContentWorkingGroup(content_working_group::Call::set_mint_capacity(
                    mint_balance,
                ))
                .encode()
            }
            ProposalDetails::Spending(balance, destination) => Call::Council(
                governance::council::Call::spend_from_council_mint(balance, destination),
            )
            .encode(),
            ProposalDetails::SetLead(new_lead) => {
                Call::ContentWorkingGroup(content_working_group::Call::replace_lead(new_lead))
                    .encode()
            }
            ProposalDetails::EvictStorageProvider(actor_account) => {
                Call::Actors(roles::actors::Call::remove_actor(actor_account)).encode()
            }
            ProposalDetails::SetValidatorCount(new_validator_count) => {
                Call::Staking(staking::Call::set_validator_count(new_validator_count)).encode()
            }
            ProposalDetails::SetStorageRoleParameters(role_parameters) => Call::Actors(
                roles::actors::Call::set_role_parameters(Role::StorageProvider, role_parameters),
            )
            .encode(),
            ProposalDetails::RuntimeUpgrade(wasm_code) => {
                // The runtime upgrade proposal has two proposal details: wasm and wasm hash.
                // This is an exception for the optimization.

                // This is a real extrinsic call.
                Call::ProposalsCodex(proposals_codex::Call::execute_runtime_upgrade_proposal(
                    wasm_code,
                ))
                .encode()
            }
            ProposalDetails::RuntimeUpgradeHash(_) => {
                // The runtime upgrade proposal has two proposal details: wasm and wasm hash.
                // This is an exception for the optimization.

                // Cannot be here. This is a bug.
                print("Invalid proposal: cannot encode ProposalDetails::RuntimeUpgradeHash");

                Vec::new()
            }
        }
    }
}
