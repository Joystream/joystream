use crate::{Call, Runtime};
use common::working_group::WorkingGroup;
use proposals_codex::{ProposalDetails, ProposalDetailsOf, ProposalEncoder};
use working_group::OpeningType;

use codec::Encode;
use rstd::collections::btree_set::BTreeSet;
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
            ProposalDetails::SetValidatorCount(new_validator_count) => {
                Call::Staking(staking::Call::set_validator_count(new_validator_count)).encode()
            }
            ProposalDetails::RuntimeUpgrade(wasm_code) => Call::ProposalsCodex(
                proposals_codex::Call::execute_runtime_upgrade_proposal(wasm_code),
            )
            .encode(),
            // ********** Deprecated during the Nicaea release.
            // It is kept only for backward compatibility in the Pioneer. **********
            ProposalDetails::EvictStorageProvider(_) => {
                print("Error: Calling deprecated EvictStorageProvider encoding option.");
                Vec::new()
            }
            // ********** Deprecated during the Nicaea release.
            // It is kept only for backward compatibility in the Pioneer. **********
            ProposalDetails::SetStorageRoleParameters(_) => {
                print("Error: Calling deprecated SetStorageRoleParameters encoding option.");
                Vec::new()
            }
            ProposalDetails::AddWorkingGroupLeaderOpening(add_opening_params) => {
                let call = match add_opening_params.working_group {
                    WorkingGroup::Storage => {
                        Call::StorageWorkingGroup(create_add_opening_call(add_opening_params))
                    }
                };

                call.encode()
            }
            ProposalDetails::AcceptWorkingGroupLeaderApplications(opening_id, working_group) => {
                let call = match working_group {
                    WorkingGroup::Storage => {
                        Call::StorageWorkingGroup(create_accept_applications_call(opening_id))
                    }
                };

                call.encode()
            }
            ProposalDetails::BeginReviewWorkingGroupLeaderApplications(
                opening_id,
                working_group,
            ) => {
                let call = match working_group {
                    WorkingGroup::Storage => {
                        Call::StorageWorkingGroup(create_begin_review_applications_call(opening_id))
                    }
                };

                call.encode()
            }
            ProposalDetails::FillWorkingGroupLeaderOpening(fill_opening_params) => {
                let call = match fill_opening_params.working_group {
                    WorkingGroup::Storage => {
                        Call::StorageWorkingGroup(create_fill_opening_call(fill_opening_params))
                    }
                };

                call.encode()
            }
        }
    }
}

// Generic call constructor for the add working group opening.
fn create_add_opening_call<T: working_group::Trait<I>, I: working_group::Instance>(
    add_opening_params: proposals_codex::AddOpeningParameters<
        T::BlockNumber,
        working_group::BalanceOf<T>,
    >,
) -> working_group::Call<T, I> {
    working_group::Call::<T, I>::add_opening(
        add_opening_params.activate_at,
        add_opening_params.commitment,
        add_opening_params.human_readable_text,
        OpeningType::Leader,
    )
}

// Generic call constructor for the accept working group applications.
fn create_accept_applications_call<T: working_group::Trait<I>, I: working_group::Instance>(
    opening_id: working_group::OpeningId<T>,
) -> working_group::Call<T, I> {
    working_group::Call::<T, I>::accept_applications(opening_id)
}

// Generic call constructor for the begin review working group applications.
fn create_begin_review_applications_call<T: working_group::Trait<I>, I: working_group::Instance>(
    opening_id: working_group::OpeningId<T>,
) -> working_group::Call<T, I> {
    working_group::Call::<T, I>::begin_applicant_review(opening_id)
}

// Generic call constructor for the add working group opening.
fn create_fill_opening_call<T: working_group::Trait<I>, I: working_group::Instance>(
    fill_opening_params: proposals_codex::FillOpeningParameters<
        T::BlockNumber,
        minting::BalanceOf<T>,
        working_group::OpeningId<T>,
        working_group::ApplicationId<T>,
    >,
) -> working_group::Call<T, I> {
    let mut successful_application_ids = BTreeSet::new();
    successful_application_ids.insert(fill_opening_params.successful_application_id);

    working_group::Call::<T, I>::fill_opening(
        fill_opening_params.opening_id,
        successful_application_ids,
        fill_opening_params.reward_policy,
    )
}
