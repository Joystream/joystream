#![cfg(feature = "runtime-benchmarks")]
use super::*;
use crate::Module as Codex;
use balances::Module as Balances;
use frame_benchmarking::{account, benchmarks};
use frame_support::sp_runtime::traits::Bounded;
use frame_support::traits::Currency;
use frame_system::EventRecord;
use frame_system::Module as System;
use frame_system::RawOrigin;
use membership::Module as Membership;
use proposals_discussion::Module as Discussion;
use proposals_engine::Module as Engine;
use sp_runtime::traits::One;
use sp_std::convert::TryInto;
use sp_std::prelude::*;

const SEED: u32 = 0;
const MAX_BYTES: u32 = 16384;

// Note: We use proposals_engine::Trait::Event here because crate::Trait
// doesn't implement Event and we only use this function to assert events
// from the proposals_engine pallet
fn assert_last_event<T: Trait>(generic_event: <T as proposals_engine::Trait>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();
    assert!(
        events.len() > 0,
        "If you are checking for last event there must be at least 1 event"
    );
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> 8 * byte_number) as u8
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

fn member_funded_account<T: Trait + membership::Trait>(
    name: &'static str,
    id: u32,
) -> (T::AccountId, T::MemberId) {
    let account_id = account::<T::AccountId>(name, id, SEED);
    let handle = handle_from_id(id);

    // Give balance for buying membership
    let _ = Balances::<T>::make_free_balance_be(&account_id, T::Balance::max_value());

    let params = membership::BuyMembershipParameters {
        root_account: account_id.clone(),
        controller_account: account_id.clone(),
        name: None,
        handle: Some(handle),
        avatar_uri: None,
        about: None,
        referrer_id: None,
    };

    Membership::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();

    let _ = Balances::<T>::make_free_balance_be(&account_id, T::Balance::max_value());

    (account_id, T::MemberId::from(id.try_into().unwrap()))
}

fn create_proposal_parameters<T: Trait + membership::Trait>(
    title_length: u32,
    description_length: u32,
) -> (T::AccountId, T::MemberId, GeneralProposalParameters<T>) {
    let (account_id, member_id) = member_funded_account::<T>("account", 0);

    let general_proposal_paramters = GeneralProposalParameters::<T> {
        member_id,
        title: vec![0u8; title_length.try_into().unwrap()],
        description: vec![0u8; description_length.try_into().unwrap()],
        staking_account_id: Some(account_id.clone()),
        exact_execution_block: None,
    };

    (account_id, member_id, general_proposal_paramters)
}

fn create_proposal_verify<T: Trait>(
    account_id: T::AccountId,
    member_id: T::MemberId,
    proposal_details: ProposalDetailsOf<T>,
) {
    assert_eq!(Discussion::<T>::thread_count(), 1, "No threads created");
    let thread_id = T::ThreadId::from(1);
    assert!(
        proposals_discussion::ThreadById::<T>::contains_key(thread_id),
        "No thread created"
    );

    let proposal_id = T::ProposalId::from(1);
    assert!(
        proposals_engine::Proposals::<T>::contains_key(proposal_id),
        "Proposal not inserted in engine"
    );

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
        Engine::<T>::proposal_count(),
        1,
        "Proposal count not updated"
    );
    assert_eq!(
        Engine::<T>::active_proposal_count(),
        1,
        "Active proposal count not updated"
    );
    assert_last_event::<T>(
        proposals_engine::RawEvent::ProposalCreated(member_id, proposal_id).into(),
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

    assert!(
        ProposalDetailsByProposalId::<T>::contains_key(proposal_id),
        "Proposal details not stored"
    );

    assert_eq!(
        ProposalDetailsByProposalId::<T>::get(proposal_id),
        proposal_details,
        "Proposal details doesn't match"
    );
}

fn set_wg_and_council_budget<T: Trait>(budget: u32, group: WorkingGroup) {
    Council::<T>::set_budget(RawOrigin::Root.into(), BalanceOf::<T>::from(budget)).unwrap();

    T::set_working_group_budget(group, BalanceOf::<T>::from(budget));

    assert_eq!(
        Council::<T>::budget(),
        BalanceOf::<T>::from(budget),
        "Council budget not updated"
    );

    assert_eq!(
        T::get_working_group_budget(group),
        BalanceOf::<T>::from(budget),
        "Working Group budget not updated"
    );
}

fn assert_new_budgets<T: Trait>(
    new_budget_council: u32,
    new_budget_working_group: u32,
    group: WorkingGroup,
) {
    assert_eq!(
        Council::<T>::budget(),
        BalanceOf::<T>::from(new_budget_council),
        "Council budget not updated"
    );

    assert_eq!(
        T::get_working_group_budget(group),
        BalanceOf::<T>::from(new_budget_working_group),
        "Working Group budget not updated"
    );
}

benchmarks! {
    where_clause { where T: membership::Trait }
    _ {
        let t in 1 .. T::TitleMaxLength::get() => ();
        let d in 1 .. T::DescriptionMaxLength::get() => ();
    }

    // Note: No verify since there is no side effect to test
    execute_signal_proposal {
        let i in 1 .. MAX_BYTES;
    }: _(RawOrigin::Root, vec![0u8; i.try_into().unwrap()])

    create_proposal_signal {
        let i in 1 .. MAX_BYTES;
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::Signal(vec![0u8; i.try_into().unwrap()]);
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_runtime_upgrade {
        let i in 1 .. MAX_BYTES;
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::RuntimeUpgrade(vec![0u8; i.try_into().unwrap()]);
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_funding_request {
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        council::Module::<T>::set_budget(RawOrigin::Root.into(), council::Balance::<T>::max_value()).unwrap();

        let proposal_details = ProposalDetails::FundingRequest(
                crate::BalanceOf::<T>::one(),
                account::<T::AccountId>("reciever", 1, SEED)
            );
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_set_max_validator_count {
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetMaxValidatorCount(MAX_VALIDATOR_COUNT);
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_create_working_group_lead_opening {
        let i in 1 .. MAX_BYTES;
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::CreateWorkingGroupLeadOpening(CreateOpeningParameters {
            description: vec![0u8; i.try_into().unwrap()],
            stake_policy: None,
            reward_per_block: None,
            group: WorkingGroup::Forum,
        });
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_fill_working_group_lead_opening {
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::FillWorkingGroupLeadOpening(FillOpeningParameters {
            opening_id: working_group::OpeningId::zero(),
            application_id: working_group::ApplicationId::zero(),
            working_group: WorkingGroup::Forum,
        });
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_update_working_group_budget {
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::UpdateWorkingGroupBudget(
            One::one(),
            WorkingGroup::Forum,
            BalanceKind::Positive
        );
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_decrease_working_group_lead_stake {
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::DecreaseWorkingGroupLeadStake(
            working_group::WorkerId::<T>::zero(),
            BalanceOf::<T>::one(),
            WorkingGroup::Forum,
        );
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_slash_working_group_lead {
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SlashWorkingGroupLead(
            working_group::WorkerId::<T>::zero(),
            BalanceOf::<T>::one(),
            WorkingGroup::Forum,
        );
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_set_working_group_lead_reward {
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetWorkingGroupLeadReward(
            working_group::WorkerId::<T>::zero(),
            None,
            WorkingGroup::Forum,
        );
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_terminate_working_group_lead {
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::TerminateWorkingGroupLead(
            TerminateRoleParameters {
                worker_id: working_group::WorkerId::<T>::zero(),
                slashing_amount: None,
                group: WorkingGroup::Forum,
            }
        );
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_amend_constitution {
        let i in 1 .. MAX_BYTES;
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::AmendConstitution(vec![0u8; i.try_into().unwrap()]);
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_cancel_working_group_lead_opening {
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::CancelWorkingGroupLeadOpening(
            working_group::OpeningId::zero(),
            WorkingGroup::Forum);
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_set_membership_price {
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetMembershipPrice(BalanceOf::<T>::one());
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_set_council_budget_increment {
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetCouncilBudgetIncrement(BalanceOf::<T>::one());
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_set_councilor_reward {
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetCouncilorReward(BalanceOf::<T>::one());
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_set_initial_invitation_balance {
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetInitialInvitationBalance(BalanceOf::<T>::one());
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_set_initial_invitation_count {
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetInitialInvitationCount(One::one());
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_set_membership_lead_invitation_quota {
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetMembershipLeadInvitationQuota(One::one());
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    create_proposal_set_referral_cut {
        let t in ...;
        let d in ...;

        let (account_id, member_id, general_proposal_paramters) = create_proposal_parameters::<T>(t, d);

        let proposal_details = ProposalDetails::SetReferralCut(One::one());
    }: create_proposal(RawOrigin::Signed(account_id.clone()), general_proposal_paramters, proposal_details.clone())
    verify {
        create_proposal_verify::<T>(account_id, member_id, proposal_details);
    }

    update_working_group_budget_positive_forum {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Forum);
    }: update_working_group_budget(RawOrigin::Root, WorkingGroup::Forum, One::one(), BalanceKind::Positive)
    verify {
        assert_new_budgets::<T>(99, 101, WorkingGroup::Forum);
    }

    update_working_group_budget_negative_forum {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Forum);
    }: update_working_group_budget(RawOrigin::Root, WorkingGroup::Forum, One::one(), BalanceKind::Negative)
    verify{
        assert_new_budgets::<T>(101, 99, WorkingGroup::Forum);
    }

    update_working_group_budget_positive_storage {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Storage);
    }: update_working_group_budget(RawOrigin::Root, WorkingGroup::Storage, One::one(), BalanceKind::Positive)
    verify {
        assert_new_budgets::<T>(99, 101, WorkingGroup::Storage);
    }

    update_working_group_budget_negative_storage {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Storage);
    }: update_working_group_budget(RawOrigin::Root, WorkingGroup::Storage, One::one(), BalanceKind::Negative)
    verify {
        assert_new_budgets::<T>(101, 99, WorkingGroup::Storage);
    }

    update_working_group_budget_positive_content {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Content);
    }: update_working_group_budget(RawOrigin::Root, WorkingGroup::Content, One::one(), BalanceKind::Positive)
    verify {
        assert_new_budgets::<T>(99, 101, WorkingGroup::Content);
    }

    update_working_group_budget_negative_content {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Content);
    }: update_working_group_budget(RawOrigin::Root, WorkingGroup::Content, One::one(),
    BalanceKind::Negative)
    verify {
        assert_new_budgets::<T>(101, 99, WorkingGroup::Content);
    }

    update_working_group_budget_positive_membership {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Membership);
    }: update_working_group_budget(RawOrigin::Root, WorkingGroup::Membership, One::one(), BalanceKind::Positive)
    verify {
        assert_new_budgets::<T>(99, 101, WorkingGroup::Membership);
    }

    update_working_group_budget_negative_membership {
        set_wg_and_council_budget::<T>(100, WorkingGroup::Membership);
    }: update_working_group_budget(RawOrigin::Root, WorkingGroup::Membership, One::one(), BalanceKind::Negative)
    verify {
        assert_new_budgets::<T>(101, 99, WorkingGroup::Membership);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tests::{initial_test_ext, Test};
    use frame_support::assert_ok;

    #[test]
    fn test_execute_signal_proposal() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_execute_signal_proposal::<Test>());
        });
    }

    #[test]
    fn test_create_proposal_signal() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_signal::<Test>());
        });
    }

    #[test]
    fn test_create_proposal_funding_request() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_funding_request::<Test>());
        });
    }

    #[test]
    fn test_create_proposal_set_max_validator_count() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_set_max_validator_count::<Test>());
        });
    }

    #[test]
    fn test_create_proposal_create_working_group_lead_opening() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_create_working_group_lead_opening::<Test>());
        });
    }

    #[test]
    fn test_create_proposal_fill_working_group_lead_opening() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_fill_working_group_lead_opening::<Test>());
        });
    }

    #[test]
    fn test_create_proposal_update_working_group_budget() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_update_working_group_budget::<Test>());
        });
    }

    #[test]
    fn test_create_proposal_decrease_working_group_lead_stake() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_decrease_working_group_lead_stake::<Test>());
        });
    }

    #[test]
    fn test_create_proposal_slash_working_group_lead() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_slash_working_group_lead::<
                Test,
            >());
        });
    }

    #[test]
    fn test_create_proposal_set_working_group_lead_reward() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_set_working_group_lead_reward::<Test>());
        });
    }

    #[test]
    fn test_create_proposal_terminate_working_group_lead() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_terminate_working_group_lead::<Test>());
        });
    }

    #[test]
    fn test_create_proposal_amend_constitution() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_amend_constitution::<Test>());
        });
    }

    #[test]
    fn test_create_proposal_cancel_working_group_lead_opening() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_amend_constitution::<Test>());
        });
    }

    #[test]
    fn test_create_proposal_set_membership_price() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_set_membership_price::<Test>());
        });
    }

    #[test]
    fn test_create_proposal_set_council_budget_increment() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_set_council_budget_increment::<Test>());
        });
    }

    #[test]
    fn test_create_proposal_set_councior_reward() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_set_councilor_reward::<Test>());
        });
    }

    #[test]
    fn test_create_proposal_set_initial_invitation_balance() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_set_initial_invitation_balance::<Test>());
        });
    }

    #[test]
    fn test_create_proposal_set_initial_invitation_count() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_set_initial_invitation_count::<Test>());
        });
    }

    #[test]
    fn test_create_proposal_set_membership_lead_invitation_quota() {
        initial_test_ext().execute_with(|| {
            assert_ok!(
                test_benchmark_create_proposal_set_membership_lead_invitation_quota::<Test>()
            );
        });
    }

    #[test]
    fn test_create_proposal_set_referral_cut() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_create_proposal_set_referral_cut::<Test>());
        });
    }

    #[test]
    fn test_update_working_group_budget_positive_forum() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_update_working_group_budget_positive_forum::<
                Test,
            >());
        });
    }

    #[test]
    fn test_update_working_group_budget_negative_forum() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_update_working_group_budget_negative_forum::<
                Test,
            >());
        });
    }

    #[test]
    fn test_update_working_group_budget_positive_storage() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_update_working_group_budget_positive_storage::<Test>());
        });
    }

    #[test]
    fn test_update_working_group_budget_negative_storage() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_update_working_group_budget_negative_storage::<Test>());
        });
    }

    #[test]
    fn test_update_working_group_budget_positive_content() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_update_working_group_budget_positive_content::<Test>());
        });
    }

    #[test]
    fn test_update_working_group_budget_negative_content() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_update_working_group_budget_negative_content::<Test>());
        });
    }

    #[test]
    fn test_update_working_group_budget_positive_membership() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_update_working_group_budget_positive_membership::<Test>());
        });
    }

    #[test]
    fn test_update_working_group_budget_negative_membership() {
        initial_test_ext().execute_with(|| {
            assert_ok!(test_benchmark_update_working_group_budget_negative_membership::<Test>());
        });
    }
}
