#![cfg(feature = "runtime-benchmarks")]
// Substrate macro issue:
#![allow(clippy::no_effect)]

use super::*;
use crate::Module as Codex;
use balances::Pallet as Balances;

use common::working_group::WorkingGroup;
use common::BalanceKind;
use content::NftLimitPeriod;
use frame_benchmarking::{account, benchmarks, Zero};
use frame_support::sp_runtime::traits::Bounded;
use frame_support::traits::Currency;
use frame_system::EventRecord;
use frame_system::Pallet as System;
use frame_system::RawOrigin;
use membership::Module as Membership;
use proposals_engine::Module as Engine;
use sp_core::Hasher;
use sp_runtime::traits::One;
use sp_std::convert::TryInto;
use sp_std::iter::FromIterator;
use sp_std::prelude::*;
use working_group::{
    ApplicationById, ApplicationId, ApplyOnOpeningParameters, OpeningById, OpeningId, OpeningType,
    StakeParameters, StakePolicy, WorkerById,
};

const SEED: u32 = 0;
const MAX_BYTES: u32 = 3 * 1024 * 1024;

fn assert_last_event<T: Config>(generic_event: <T as Config>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Config>::Event = generic_event.into();
    assert!(
        !events.is_empty(),
        "If you are checking for last event there must be at least 1 event"
    );
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> (8 * byte_number)) as u8
}

// Method to generate a distintic valid handle
// for a membership. For each index.
fn handle_from_id(id: u32) -> Vec<u8> {
    let mut handle = vec![];

    for i in 0..4 {
        handle.push(get_byte(id, i));
    }

    handle
}

fn member_funded_account<T: Config + membership::Config>() -> (T::AccountId, T::MemberId) {
    let member_id = Membership::<T>::members_created();
    let account_id = account::<T::AccountId>("member", member_id.saturated_into(), SEED);
    let handle = handle_from_id(member_id.saturated_into());

    // Give balance for buying membership
    let _ = Balances::<T>::make_free_balance_be(&account_id, T::Balance::max_value());

    let params = membership::BuyMembershipParameters {
        root_account: account_id.clone(),
        controller_account: account_id.clone(),
        handle: Some(handle),
        metadata: Vec::new(),
        referrer_id: None,
    };

    Membership::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();

    let _ = Balances::<T>::make_free_balance_be(&account_id, T::Balance::max_value());

    Membership::<T>::add_staking_account_candidate(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id,
    )
    .unwrap();
    Membership::<T>::confirm_staking_account(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id,
        account_id.clone(),
    )
    .unwrap();

    (account_id, member_id)
}

fn create_proposal_parameters<T: Config + membership::Config>(
    title_length: u32,
    description_length: u32,
) -> (T::AccountId, T::MemberId, GeneralProposalParameters<T>) {
    let (account_id, member_id) = member_funded_account::<T>();

    let general_proposal_paramters = GeneralProposalParameters::<T> {
        member_id,
        title: vec![0u8; title_length.try_into().unwrap()],
        description: vec![0u8; description_length.try_into().unwrap()],
        staking_account_id: Some(account_id.clone()),
        exact_execution_block: None,
    };

    (account_id, member_id, general_proposal_paramters)
}

fn create_proposal_verify<T: Config>(
    account_id: T::AccountId,
    member_id: T::MemberId,
    proposal_parameters: GeneralProposalParameters<T>,
    proposal_details: ProposalDetailsOf<T>,
) {
    let proposal_id = T::ProposalId::from(Engine::<T>::proposal_count());

    assert!(
        proposals_engine::Proposals::<T>::contains_key(proposal_id),
        "Proposal not inserted in engine"
    );

    assert!(
        ThreadIdByProposalId::<T>::contains_key(proposal_id),
        "No thread created"
    );
    let thread_id = ThreadIdByProposalId::<T>::get(proposal_id);

    assert_eq!(
        Engine::<T>::proposals(proposal_id),
        proposals_engine::Proposal {
            activated_at: System::<T>::block_number(),
            parameters: Codex::<T>::get_proposal_parameters(&proposal_details),
            proposer_id: member_id,
            status: proposals_engine::ProposalStatus::Active,
            voting_results: proposals_engine::VotingResults::default(),
            exact_execution_block: None,
            nr_of_council_confirmations: 0,
            staking_account_id: Some(account_id)
        },
        "Proposal not correctly created"
    );

    assert!(
        proposals_engine::DispatchableCallCode::<T>::contains_key(proposal_id),
        "Dispatchable code not stored"
    );

    assert_eq!(
        Engine::<T>::proposal_codes(proposal_id),
        T::ProposalEncoder::encode_proposal(proposal_details.clone()),
        "Stored proposal code doesn't match"
    );

    assert_eq!(
        Engine::<T>::active_proposal_count(),
        Engine::<T>::proposal_count(),
        "Active proposal count not updated"
    );

    assert_last_event::<T>(
        RawEvent::ProposalCreated(
            proposal_id,
            proposal_parameters,
            proposal_details,
            thread_id,
        )
        .into(),
    );

    assert!(
        ThreadIdByProposalId::<T>::contains_key(proposal_id),
        "Proposal thread not stored"
    );
    assert_eq!(
        Codex::<T>::thread_id_by_proposal_id(proposal_id),
        thread_id,
        "Proposal and thread ID doesn't match"
    );
}

fn insert_leader<T, I>() -> (working_group::WorkerId<T>, T::AccountId)
where
    T: Config + membership::Config + working_group::Config<I> + balances::Config,
    I: Instance,
{
    let (opening_id, lead_acc_id, _, application_id) = add_and_apply_on_lead_opening::<T, I>();

    let successful_application_ids = BTreeSet::<ApplicationId>::from_iter(vec![application_id]);

    let worker_id = working_group::NextWorkerId::<T, I>::get();
    working_group::Module::<T, I>::fill_opening(
        RawOrigin::Root.into(),
        opening_id,
        successful_application_ids,
    )
    .unwrap();

    assert!(WorkerById::<T, I>::contains_key(worker_id));

    (worker_id, lead_acc_id)
}

fn add_and_apply_on_lead_opening<
    T: Config + membership::Config + working_group::Config<I>,
    I: Instance,
>() -> (OpeningId, T::AccountId, T::MemberId, ApplicationId) {
    let opening_id = add_lead_opening_helper::<T, I>();

    let (applicant_acc_id, applicant_member_id, application_id) =
        apply_on_opening_helper::<T, I>(&opening_id);

    (
        opening_id,
        applicant_acc_id,
        applicant_member_id,
        application_id,
    )
}

fn add_lead_opening_helper<T: Config + working_group::Config<I>, I: Instance>() -> OpeningId {
    let opening_id = working_group::Module::<T, I>::next_opening_id();

    working_group::Module::<T, I>::add_opening(
        RawOrigin::Root.into(),
        vec![],
        OpeningType::Leader,
        StakePolicy {
            stake_amount: <T as working_group::Config<I>>::MinimumApplicationStake::get(),
            leaving_unstaking_period: <T as working_group::Config<I>>::MinUnstakingPeriodLimit::get(
            ) + One::one(),
        },
        Some(One::one()),
    )
    .unwrap();

    assert!(
        OpeningById::<T, I>::contains_key(opening_id),
        "Opening not added"
    );

    opening_id
}

fn apply_on_opening_helper<
    T: Config + membership::Config + working_group::Config<I>,
    I: Instance,
>(
    opening_id: &OpeningId,
) -> (T::AccountId, T::MemberId, ApplicationId) {
    let (applicant_acc_id, applicant_member_id) = member_funded_account::<T>();
    let application_id = working_group::Module::<T, I>::next_application_id();

    working_group::Module::<T, I>::apply_on_opening(
        RawOrigin::Signed(applicant_acc_id.clone()).into(),
        ApplyOnOpeningParameters::<T> {
            member_id: applicant_member_id,
            opening_id: *opening_id,
            role_account_id: applicant_acc_id.clone(),
            reward_account_id: applicant_acc_id.clone(),
            description: vec![],
            stake_parameters: StakeParameters {
                stake: <T as working_group::Config<I>>::MinimumApplicationStake::get(),
                staking_account_id: applicant_acc_id.clone(),
            },
        },
    )
    .unwrap();

    assert!(
        ApplicationById::<T, I>::contains_key(application_id),
        "Application not added"
    );

    (applicant_acc_id, applicant_member_id, application_id)
}

benchmarks! {
    where_clause {
        where T: membership::Config,
        T: council::Config,
        T: working_group::Config<working_group::Instance1>
    }

    create_proposal_signal {
        let i in 1 .. MAX_BYTES;
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::Signal(vec![0u8; i.try_into().unwrap()]);
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details,
        );
    }

    create_proposal_runtime_upgrade {
        let i in 1 .. MAX_BYTES;
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::RuntimeUpgrade(vec![0u8; i.try_into().unwrap()]);
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_funding_request {
        let i in 1 .. T::FundingRequestProposalMaxAccounts::get();
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        council::Module::<T>::set_budget(
            RawOrigin::Root.into(),
            council::Balance::<T>::max_value()
        ).unwrap();

        let mut funding_requests =
            Vec::<common::FundingRequestParameters<council::Balance::<T>, T::AccountId>>::new();

        for id in 0 .. i {
            funding_requests.push(common::FundingRequestParameters {
                account: account::<T::AccountId>("reciever", id, SEED),
                amount: One::one(),
            });
        }

        let proposal_details = ProposalDetails::FundingRequest(funding_requests);
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_set_max_validator_count {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetMaxValidatorCount(T::SetMaxValidatorCountProposalMaxValidators::get());
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_veto_proposal {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        // Create proposal to be vetoed first
        let (signal_account_id, signal_member_id, signal_general_proposal_params) = create_proposal_parameters::<T>(
            T::TitleMaxLength::get(),
            T::DescriptionMaxLength::get()
        );
        let signal_proposal_details = ProposalDetails::Signal(vec![0u8].repeat(MAX_BYTES as usize));
        Module::<T>::create_proposal(
            RawOrigin::Signed(signal_account_id).into(),
            signal_general_proposal_params,
            signal_proposal_details
        )?;
        let proposal_id = proposals_engine::Module::<T>::proposal_count();

        let proposal_details = ProposalDetails::VetoProposal(proposal_id.into());
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_create_working_group_lead_opening {
        let i in 1 .. MAX_BYTES;
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::CreateWorkingGroupLeadOpening(
            CreateOpeningParameters {
                description: vec![0u8; i.try_into().unwrap()],
                stake_policy: working_group::StakePolicy {
                    stake_amount:
                        <T as working_group::Config<working_group::Instance1>>
                            ::MinimumApplicationStake::get(),
                    leaving_unstaking_period: Zero::zero(),
                },
                reward_per_block: None,
                group: WorkingGroup::Forum,
        });
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_fill_working_group_lead_opening {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (opening_id, _, _, application_id) = add_and_apply_on_lead_opening::<T, ForumWorkingGroupInstance>();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::FillWorkingGroupLeadOpening(FillOpeningParameters {
            opening_id,
            application_id,
            working_group: WorkingGroup::Forum,
        });
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters.clone(),
            proposal_details
        );
    }

    create_proposal_update_working_group_budget {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::UpdateWorkingGroupBudget(
            One::one(),
            WorkingGroup::Forum,
            BalanceKind::Positive
        );
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_decrease_working_group_lead_stake {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (lead_id, _) = insert_leader::<T, ForumWorkingGroupInstance>();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::DecreaseWorkingGroupLeadStake(
            lead_id,
            BalanceOf::<T>::one(),
            WorkingGroup::Forum,
        );
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_slash_working_group_lead {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (lead_id, _) = insert_leader::<T, ForumWorkingGroupInstance>();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SlashWorkingGroupLead(
            working_group::WorkerId::<T>::zero(),
            BalanceOf::<T>::one(),
            WorkingGroup::Forum,
        );
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_set_working_group_lead_reward {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (lead_id, _) = insert_leader::<T, ForumWorkingGroupInstance>();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetWorkingGroupLeadReward(
            working_group::WorkerId::<T>::zero(),
            None,
            WorkingGroup::Forum,
        );
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_terminate_working_group_lead {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (lead_id, _) = insert_leader::<T, ForumWorkingGroupInstance>();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::TerminateWorkingGroupLead(
            TerminateRoleParameters {
                worker_id: working_group::WorkerId::<T>::zero(),
                slashing_amount: None,
                group: WorkingGroup::Forum,
            }
        );
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_amend_constitution {
        let i in 1 .. MAX_BYTES;
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details =
            ProposalDetails::AmendConstitution(vec![0u8; i.try_into().unwrap()]);
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_cancel_working_group_lead_opening {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let opening_id = add_lead_opening_helper::<T, ForumWorkingGroupInstance>();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::CancelWorkingGroupLeadOpening(
            opening_id,
            WorkingGroup::Forum);
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_set_membership_price {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (account_id, member_id, general_proposal_parameters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetMembershipPrice(BalanceOf::<T>::one());
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_parameters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_parameters,
            proposal_details
        );
    }

    create_proposal_set_council_budget_increment {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetCouncilBudgetIncrement(BalanceOf::<T>::one());
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_set_councilor_reward {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetCouncilorReward(BalanceOf::<T>::one());
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_set_initial_invitation_balance {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetInitialInvitationBalance(BalanceOf::<T>::one());
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_set_initial_invitation_count {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetInitialInvitationCount(One::one());
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_set_membership_lead_invitation_quota {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetMembershipLeadInvitationQuota(One::one());
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_set_referral_cut {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (account_id, member_id, general_proposal_paramters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetReferralCut(One::one());
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_paramters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_paramters,
            proposal_details
        );
    }

    create_proposal_update_global_nft_limit {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();

        let (account_id, member_id, general_proposal_parameters) =
            create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::UpdateGlobalNftLimit(
            NftLimitPeriod::Daily,
            100,
        );
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_parameters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_parameters,
            proposal_details
        );
    }

    create_proposal_update_channel_payouts {
        let t in 1 .. T::TitleMaxLength::get();
        let d in 1 .. T::DescriptionMaxLength::get();
        let i in 0..MAX_BYTES;

        let (account_id, member_id, general_proposal_parameters) =
            create_proposal_parameters::<T>(t, d);

        let uploader_account = account::<T::AccountId>("uploader_account", 1, SEED);
        let commitment = T::Hashing::hash(b"commitment".as_ref());
        let payload = content::ChannelPayoutsPayloadParametersRecord {
            uploader_account,
            object_creation_params: content::DataObjectCreationParameters {
                size: u64::MAX,
                ipfs_content_id: Vec::from_iter((0..i).map(|v| u8::MAX))
            },
            expected_data_size_fee: u128::MAX.saturated_into::<T::Balance>(),
            expected_data_object_state_bloat_bond: u128::MAX.saturated_into::<T::Balance>()
        };
        let proposal_details = ProposalDetails::UpdateChannelPayouts(
            content::UpdateChannelPayoutsParameters::<T> {
                commitment: Some(commitment),
                payload: Some(payload),
                min_cashout_allowed: Some(u128::MAX.saturated_into::<T::Balance>()),
                max_cashout_allowed: Some(u128::MAX.saturated_into::<T::Balance>()),
                channel_cashouts_enabled: Some(true),
            }
        );
    }: create_proposal(
        RawOrigin::Signed(account_id.clone()),
        general_proposal_parameters.clone(),
        proposal_details.clone()
    )
    verify {
        create_proposal_verify::<T>(
            account_id,
            member_id,
            general_proposal_parameters,
            proposal_details
        );
    }
}

#[cfg(test)]
mod tests {
    use crate::tests::{initial_test_ext, Test};
    use frame_support::assert_ok;
    type ProposalsCodex = crate::Module<Test>;

    #[test]
    fn test_create_proposal_signal() {
        initial_test_ext().execute_with(|| {
            assert_ok!(ProposalsCodex::test_benchmark_create_proposal_signal());
        });
    }

    #[test]
    fn test_create_proposal_funding_request() {
        initial_test_ext().execute_with(|| {
            assert_ok!(ProposalsCodex::test_benchmark_create_proposal_funding_request());
        });
    }

    #[test]
    fn test_create_proposal_set_max_validator_count() {
        initial_test_ext().execute_with(|| {
            assert_ok!(ProposalsCodex::test_benchmark_create_proposal_set_max_validator_count());
        });
    }

    #[test]
    fn test_create_proposal_create_working_group_lead_opening() {
        initial_test_ext().execute_with(|| {
            assert_ok!(
                ProposalsCodex::test_benchmark_create_proposal_create_working_group_lead_opening()
            );
        });
    }

    #[test]
    fn test_create_proposal_fill_working_group_lead_opening() {
        initial_test_ext().execute_with(|| {
            assert_ok!(
                ProposalsCodex::test_benchmark_create_proposal_fill_working_group_lead_opening()
            );
        });
    }

    #[test]
    fn test_create_proposal_update_working_group_budget() {
        initial_test_ext().execute_with(|| {
            assert_ok!(
                ProposalsCodex::test_benchmark_create_proposal_update_working_group_budget()
            );
        });
    }

    #[test]
    fn test_create_proposal_decrease_working_group_lead_stake() {
        initial_test_ext().execute_with(|| {
            assert_ok!(
                ProposalsCodex::test_benchmark_create_proposal_decrease_working_group_lead_stake()
            );
        });
    }

    #[test]
    fn test_create_proposal_slash_working_group_lead() {
        initial_test_ext().execute_with(|| {
            assert_ok!(ProposalsCodex::test_benchmark_create_proposal_slash_working_group_lead());
        });
    }

    #[test]
    fn test_create_proposal_set_working_group_lead_reward() {
        initial_test_ext().execute_with(|| {
            assert_ok!(
                ProposalsCodex::test_benchmark_create_proposal_set_working_group_lead_reward()
            );
        });
    }

    #[test]
    fn test_create_proposal_terminate_working_group_lead() {
        initial_test_ext().execute_with(|| {
            assert_ok!(
                ProposalsCodex::test_benchmark_create_proposal_terminate_working_group_lead()
            );
        });
    }

    #[test]
    fn test_create_proposal_amend_constitution() {
        initial_test_ext().execute_with(|| {
            assert_ok!(ProposalsCodex::test_benchmark_create_proposal_amend_constitution());
        });
    }

    #[test]
    fn test_create_proposal_cancel_working_group_lead_opening() {
        initial_test_ext().execute_with(|| {
            assert_ok!(ProposalsCodex::test_benchmark_create_proposal_amend_constitution());
        });
    }

    #[test]
    fn test_create_proposal_set_membership_price() {
        initial_test_ext().execute_with(|| {
            assert_ok!(ProposalsCodex::test_benchmark_create_proposal_set_membership_price());
        });
    }

    #[test]
    fn test_create_proposal_set_council_budget_increment() {
        initial_test_ext().execute_with(|| {
            assert_ok!(
                ProposalsCodex::test_benchmark_create_proposal_set_council_budget_increment()
            );
        });
    }

    #[test]
    fn test_create_proposal_set_councior_reward() {
        initial_test_ext().execute_with(|| {
            assert_ok!(ProposalsCodex::test_benchmark_create_proposal_set_councilor_reward());
        });
    }

    #[test]
    fn test_create_proposal_set_initial_invitation_balance() {
        initial_test_ext().execute_with(|| {
            assert_ok!(
                ProposalsCodex::test_benchmark_create_proposal_set_initial_invitation_balance()
            );
        });
    }

    #[test]
    fn test_create_proposal_set_initial_invitation_count() {
        initial_test_ext().execute_with(|| {
            assert_ok!(
                ProposalsCodex::test_benchmark_create_proposal_set_initial_invitation_count()
            );
        });
    }

    #[test]
    fn test_create_proposal_set_membership_lead_invitation_quota() {
        initial_test_ext().execute_with(|| {
            assert_ok!(
                ProposalsCodex::test_benchmark_create_proposal_set_membership_lead_invitation_quota(
                )
            );
        });
    }

    #[test]
    fn test_create_proposal_set_referral_cut() {
        initial_test_ext().execute_with(|| {
            assert_ok!(ProposalsCodex::test_benchmark_create_proposal_set_referral_cut());
        });
    }

    #[test]
    fn test_create_proposal_veto_proposal() {
        initial_test_ext().execute_with(|| {
            assert_ok!(ProposalsCodex::test_benchmark_create_proposal_veto_proposal());
        });
    }

    #[test]
    fn test_update_global_nft_limit_proposal() {
        initial_test_ext().execute_with(|| {
            assert_ok!(ProposalsCodex::test_benchmark_create_proposal_update_global_nft_limit());
        })
    }

    #[test]
    fn test_update_channel_payouts_proposal() {
        initial_test_ext().execute_with(|| {
            assert_ok!(ProposalsCodex::test_benchmark_create_proposal_update_channel_payouts());
        });
    }
}
