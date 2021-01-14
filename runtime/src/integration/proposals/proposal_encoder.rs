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
            WorkingGroup::Content => {
                Call::ContentDirectoryWorkingGroup($working_group_instance_call)
            }
            WorkingGroup::Storage => Call::StorageWorkingGroup($working_group_instance_call),
            WorkingGroup::Forum => Call::ForumWorkingGroup($working_group_instance_call),
            WorkingGroup::Membership => Call::MembershipWorkingGroup($working_group_instance_call),
        }
    }};
}

/// _ProposalEncoder_ implementation. It encodes extrinsics with proposal details parameters
/// using Runtime Call and parity codec.
pub struct ExtrinsicProposalEncoder;
impl ProposalEncoder<Runtime> for ExtrinsicProposalEncoder {
    fn encode_proposal(proposal_details: ProposalDetailsOf<Runtime>) -> Vec<u8> {
        let call = match proposal_details {
            ProposalDetails::Text(text) => {
                Call::ProposalsCodex(proposals_codex::Call::execute_text_proposal(text))
            }
            ProposalDetails::Spending(_balance, _destination) => Call::Council(
                // TODO: This is an stub since this has been modified in
                // the proposal branch
                council::Call::set_budget(0),
            ),
            ProposalDetails::SetValidatorCount(new_validator_count) => Call::Staking(
                pallet_staking::Call::set_validator_count(new_validator_count),
            ),
            ProposalDetails::RuntimeUpgrade(wasm_code) => Call::ProposalsCodex(
                proposals_codex::Call::execute_runtime_upgrade_proposal(wasm_code),
            ),
            ProposalDetails::AddWorkingGroupLeaderOpening(add_opening_params) => {
                wrap_working_group_call!(
                    add_opening_params.working_group,
                    Wg::create_add_opening_call(add_opening_params)
                )
            }
            ProposalDetails::FillWorkingGroupLeaderOpening(fill_opening_params) => {
                wrap_working_group_call!(
                    fill_opening_params.working_group,
                    Wg::create_fill_opening_call(fill_opening_params)
                )
            }
            ProposalDetails::SetWorkingGroupBudgetCapacity(budget, working_group) => {
                wrap_working_group_call!(working_group, Wg::create_set_budget_capacity_call(budget))
            }
            ProposalDetails::DecreaseWorkingGroupLeaderStake(
                worker_id,
                decreasing_stake,
                working_group,
            ) => wrap_working_group_call!(
                working_group,
                Wg::create_decrease_stake_call(worker_id, decreasing_stake)
            ),
            ProposalDetails::SlashWorkingGroupLeaderStake(
                worker_id,
                slashing_stake,
                working_group,
            ) => wrap_working_group_call!(
                working_group,
                Wg::create_slash_stake_call(worker_id, slashing_stake,)
            ),
            ProposalDetails::SetWorkingGroupLeaderReward(
                worker_id,
                reward_amount,
                working_group,
            ) => wrap_working_group_call!(
                working_group,
                Wg::create_set_reward_call(worker_id, reward_amount)
            ),
            ProposalDetails::TerminateWorkingGroupLeaderRole(terminate_role_params) => {
                wrap_working_group_call!(
                    terminate_role_params.working_group,
                    Wg::terminate_role_call(terminate_role_params)
                )
            }
            ProposalDetails::AmendConstitution(constitution_text) => Call::Constitution(
                pallet_constitution::Call::amend_constitution(constitution_text),
            ),
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
    T: working_group::Trait<I> + proposals_codex::Trait,
    I: frame_support::traits::Instance,
{
    // Generic call constructor for the add working group opening.
    fn create_add_opening_call(
        add_opening_params: proposals_codex::AddOpeningParameters<
            T::BlockNumber,
            working_group::BalanceOf<T>,
        >,
    ) -> working_group::Call<T, I> {
        working_group::Call::<T, I>::add_opening(
            add_opening_params.description,
            OpeningType::Leader,
            add_opening_params.stake_policy,
            add_opening_params.reward_per_block,
        )
    }

    // Generic call constructor for the add working group opening.
    fn create_fill_opening_call(
        fill_opening_params: proposals_codex::FillOpeningParameters,
    ) -> working_group::Call<T, I> {
        let mut successful_application_ids = BTreeSet::new();
        successful_application_ids.insert(fill_opening_params.successful_application_id);

        working_group::Call::<T, I>::fill_opening(
            fill_opening_params.opening_id,
            successful_application_ids,
        )
    }

    // Generic call constructor for the working group 'decrease stake'.
    fn create_decrease_stake_call(
        worker_id: working_group::WorkerId<T>,
        decreasing_stake: working_group::BalanceOf<T>,
    ) -> working_group::Call<T, I> {
        working_group::Call::<T, I>::decrease_stake(worker_id, decreasing_stake)
    }

    // Generic call constructor for the working group 'slash stake'.
    fn create_slash_stake_call(
        worker_id: working_group::WorkerId<T>,
        penalty: working_group::Penalty<working_group::BalanceOf<T>>,
    ) -> working_group::Call<T, I> {
        working_group::Call::<T, I>::slash_stake(worker_id, penalty)
    }

    // Generic call constructor for the working group 'update reward amount'.
    fn create_set_reward_call(
        worker_id: working_group::WorkerId<T>,
        reward_amount: Option<working_group::BalanceOf<T>>,
    ) -> working_group::Call<T, I> {
        working_group::Call::<T, I>::update_reward_amount(worker_id, reward_amount)
    }

    // Generic call constructor for the working group 'terminate role'.
    fn terminate_role_call(
        terminate_role_params: proposals_codex::TerminateRoleParameters<
            working_group::WorkerId<T>,
            working_group::BalanceOf<T>,
        >,
    ) -> working_group::Call<T, I> {
        working_group::Call::<T, I>::terminate_role(
            terminate_role_params.worker_id,
            terminate_role_params.penalty,
            None, // The rationale is given in the proposal description
        )
    }

    // Generic call constructor for the working group 'set budget'.
    fn create_set_budget_capacity_call(
        budget: working_group::BalanceOf<T>,
    ) -> working_group::Call<T, I> {
        working_group::Call::<T, I>::set_budget(budget)
    }
}
