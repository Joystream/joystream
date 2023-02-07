use crate::{Call, Runtime};
use common::working_group::WorkingGroup;
use proposals_codex::{ProposalDetails, ProposalDetailsOf, ProposalEncoder};
use working_group::OpeningType;

use codec::Encode;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::marker::PhantomData;
use sp_std::vec::Vec;

// The macro binds working group outer-level Call with the provided inner-level working group
// extrinsic call. Outer-call is defined by the provided WorkingGroup param expression.

//Params:
// - $working_group: expression returning the 'common::working_group::WorkingGroup' enum
// - $working_group_instance_call: expression returning the exact working group instance extrinsic call
macro_rules! wrap_working_group_call {
    ($working_group:expr, $working_group_instance_call:expr) => {{
        match $working_group {
            WorkingGroup::Content => Call::ContentWorkingGroup($working_group_instance_call),
            WorkingGroup::Storage => Call::StorageWorkingGroup($working_group_instance_call),
            WorkingGroup::Forum => Call::ForumWorkingGroup($working_group_instance_call),
            WorkingGroup::Membership => Call::MembershipWorkingGroup($working_group_instance_call),
            WorkingGroup::Distribution => {
                Call::DistributionWorkingGroup($working_group_instance_call)
            }
            WorkingGroup::OperationsAlpha => {
                Call::OperationsWorkingGroupAlpha($working_group_instance_call)
            }
            WorkingGroup::OperationsBeta => {
                Call::OperationsWorkingGroupBeta($working_group_instance_call)
            }
            WorkingGroup::OperationsGamma => {
                Call::OperationsWorkingGroupGamma($working_group_instance_call)
            }
            WorkingGroup::App => Call::AppWorkingGroup($working_group_instance_call),
        }
    }};
}

/// _ProposalEncoder_ implementation. It encodes extrinsics with proposal details parameters
/// using Runtime Call and parity codec.
pub struct ExtrinsicProposalEncoder;
impl ProposalEncoder<Runtime> for ExtrinsicProposalEncoder {
    fn encode_proposal(
        proposal_details: ProposalDetailsOf<Runtime>,
        member_controller_account: <Runtime as frame_system::Config>::AccountId,
    ) -> Vec<u8> {
        let call = match proposal_details {
            ProposalDetails::Signal(signal) => {
                Call::JoystreamUtility(joystream_utility::Call::execute_signal_proposal { signal })
            }
            ProposalDetails::FundingRequest(funding_requests) => {
                Call::Council(council::Call::funding_request { funding_requests })
            }
            ProposalDetails::SetMaxValidatorCount(new) => {
                Call::Staking(pallet_staking::Call::set_validator_count { new })
            }
            ProposalDetails::RuntimeUpgrade(wasm) => {
                Call::JoystreamUtility(joystream_utility::Call::execute_runtime_upgrade_proposal {
                    wasm,
                })
            }
            ProposalDetails::CreateWorkingGroupLeadOpening(create_opening_params) => {
                wrap_working_group_call!(
                    create_opening_params.group,
                    Wg::create_opening_call(create_opening_params)
                )
            }
            ProposalDetails::FillWorkingGroupLeadOpening(fill_opening_params) => {
                wrap_working_group_call!(
                    fill_opening_params.working_group,
                    Wg::create_fill_opening_call(fill_opening_params)
                )
            }
            ProposalDetails::UpdateWorkingGroupBudget(amount, working_group, balance_kind) => {
                Call::JoystreamUtility(joystream_utility::Call::update_working_group_budget {
                    working_group,
                    amount,
                    balance_kind,
                })
            }
            ProposalDetails::DecreaseWorkingGroupLeadStake(
                worker_id,
                decreasing_stake,
                working_group,
            ) => wrap_working_group_call!(
                working_group,
                Wg::create_decrease_stake_call(worker_id, decreasing_stake)
            ),
            ProposalDetails::SlashWorkingGroupLead(worker_id, slashing_stake, working_group) => {
                wrap_working_group_call!(
                    working_group,
                    Wg::create_slash_stake_call(worker_id, slashing_stake)
                )
            }
            ProposalDetails::SetWorkingGroupLeadReward(worker_id, reward_amount, working_group) => {
                wrap_working_group_call!(
                    working_group,
                    Wg::create_set_reward_call(worker_id, reward_amount)
                )
            }
            ProposalDetails::TerminateWorkingGroupLead(terminate_role_params) => {
                wrap_working_group_call!(
                    terminate_role_params.group,
                    Wg::terminate_role_call(terminate_role_params)
                )
            }
            ProposalDetails::AmendConstitution(constitution_text) => {
                Call::Constitution(pallet_constitution::Call::amend_constitution {
                    constitution_text,
                })
            }
            ProposalDetails::CancelWorkingGroupLeadOpening(opening_id, working_group) => {
                wrap_working_group_call!(
                    working_group,
                    Wg::cancel_working_group_leader_opening(opening_id)
                )
            }
            ProposalDetails::SetMembershipPrice(new_price) => {
                Call::Members(membership::Call::set_membership_price { new_price })
            }

            ProposalDetails::SetCouncilBudgetIncrement(budget_increment) => {
                Call::Council(council::Call::set_budget_increment { budget_increment })
            }

            ProposalDetails::SetCouncilorReward(councilor_reward) => {
                Call::Council(council::Call::set_councilor_reward { councilor_reward })
            }
            ProposalDetails::SetInitialInvitationBalance(new_initial_balance) => {
                Call::Members(membership::Call::set_initial_invitation_balance {
                    new_initial_balance,
                })
            }
            ProposalDetails::SetInitialInvitationCount(new_invitation_count) => {
                Call::Members(membership::Call::set_initial_invitation_count {
                    new_invitation_count,
                })
            }
            ProposalDetails::SetMembershipLeadInvitationQuota(invitation_quota) => {
                Call::Members(membership::Call::set_leader_invitation_quota { invitation_quota })
            }
            ProposalDetails::SetReferralCut(percent_value) => {
                Call::Members(membership::Call::set_referral_cut { percent_value })
            }
            ProposalDetails::VetoProposal(proposal_id) => {
                Call::ProposalsEngine(proposals_engine::Call::veto_proposal { proposal_id })
            }
            ProposalDetails::UpdateGlobalNftLimit(nft_limit_period, limit) => {
                Call::Content(content::Call::update_global_nft_limit {
                    nft_limit_period,
                    limit,
                })
            }
            ProposalDetails::UpdateChannelPayouts(params) => {
                Call::Content(content::Call::update_channel_payouts {
                    params,
                    uploader_account: member_controller_account,
                })
            }
        };

        call.encode()
    }
}

// Working group calls container. It helps to instantiate proper working group instance for calls.
struct Wg<T, I> {
    phantom_module: PhantomData<T>,
    phantom_instance: PhantomData<I>,
}

impl<T, I> Wg<T, I>
where
    T: working_group::Config<I> + proposals_codex::Config,
    I: frame_support::traits::Instance,
{
    // Generic call constructor for the add working group opening.
    fn create_opening_call(
        create_opening_params: proposals_codex::CreateOpeningParameters<
            T::BlockNumber,
            working_group::BalanceOf<T>,
        >,
    ) -> working_group::Call<T, I> {
        working_group::Call::<T, I>::add_opening {
            opening_type: OpeningType::Leader,
            description: create_opening_params.description,
            stake_policy: create_opening_params.stake_policy,
            reward_per_block: create_opening_params.reward_per_block,
        }
    }

    // Generic call constructor for the add working group opening.
    fn create_fill_opening_call(
        fill_opening_params: proposals_codex::FillOpeningParameters,
    ) -> working_group::Call<T, I> {
        let mut successful_application_ids = BTreeSet::new();
        successful_application_ids.insert(fill_opening_params.application_id);

        working_group::Call::<T, I>::fill_opening {
            opening_id: fill_opening_params.opening_id,
            successful_application_ids,
        }
    }

    // Generic call constructor for the working group 'decrease stake'.
    fn create_decrease_stake_call(
        worker_id: working_group::WorkerId<T>,
        stake_balance_delta: working_group::BalanceOf<T>,
    ) -> working_group::Call<T, I> {
        working_group::Call::<T, I>::decrease_stake {
            worker_id,
            stake_balance_delta,
        }
    }

    // Generic call constructor for the working group 'slash stake'.
    fn create_slash_stake_call(
        worker_id: working_group::WorkerId<T>,
        penalty: working_group::BalanceOf<T>,
    ) -> working_group::Call<T, I> {
        working_group::Call::<T, I>::slash_stake {
            worker_id,
            penalty,
            rationale: None,
        }
    }

    // Generic call constructor for the working group 'update reward amount'.
    fn create_set_reward_call(
        worker_id: working_group::WorkerId<T>,
        reward_per_block: Option<working_group::BalanceOf<T>>,
    ) -> working_group::Call<T, I> {
        working_group::Call::<T, I>::update_reward_amount {
            worker_id,
            reward_per_block,
        }
    }

    // Generic call constructor for the working group 'terminate role'.
    fn terminate_role_call(
        terminate_role_params: proposals_codex::TerminateRoleParameters<
            working_group::WorkerId<T>,
            working_group::BalanceOf<T>,
        >,
    ) -> working_group::Call<T, I> {
        working_group::Call::<T, I>::terminate_role {
            worker_id: terminate_role_params.worker_id,
            penalty: terminate_role_params.slashing_amount,
            rationale: None, // The rationale is given in the proposal description
        }
    }

    fn cancel_working_group_leader_opening(
        opening_id: working_group::OpeningId,
    ) -> working_group::Call<T, I> {
        working_group::Call::<T, I>::cancel_opening { opening_id }
    }
}
