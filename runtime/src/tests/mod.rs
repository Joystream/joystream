//! The Joystream Substrate Node runtime integration tests.
#![cfg(test)]

#[macro_use]
mod proposals_integration;

mod locks;

// Temporary commented for Olympia: https://github.com/Joystream/joystream/issues/3237
// TODO: Restore after the Olympia release
//mod fee_tests;

use crate::primitives::MemberId;
use crate::{BlockNumber, ReferendumInstance, Runtime};
use frame_support::traits::{Currency, OnFinalize, OnInitialize};
use frame_system::RawOrigin;
use referendum::ReferendumManager;
use sp_runtime::{AccountId32, BuildStorage};

type Membership = membership::Module<Runtime>;
type System = frame_system::Module<Runtime>;
type ProposalsEngine = proposals_engine::Module<Runtime>;
type Council = council::Module<Runtime>;
type Referendum = referendum::Module<Runtime, ReferendumInstance>;

pub(crate) fn initial_test_ext() -> sp_io::TestExternalities {
    let mut t = frame_system::GenesisConfig::default()
        .build_storage::<Runtime>()
        .unwrap();

    // build the council config to initialize the mint
    let council_config = council::GenesisConfig::<crate::Runtime>::default()
        .build_storage()
        .unwrap();

    council_config.assimilate_storage(&mut t).unwrap();

    t.into()
}

// Simple unique account derived from member id
pub(crate) fn account_from_member_id(member_id: MemberId) -> AccountId32 {
    let b1: u8 = ((member_id >> 24) & 0xff) as u8;
    let b2: u8 = ((member_id >> 16) & 0xff) as u8;
    let b3: u8 = ((member_id >> 8) & 0xff) as u8;
    let b4: u8 = (member_id & 0xff) as u8;
    let mut account: [u8; 32] = AccountId32::default().into();
    account[0] = b1;
    account[1] = b2;
    account[2] = b3;
    account[3] = b4;
    account.into()
}

// Create a new set of members
pub(crate) fn create_new_members(count: u64) -> Vec<MemberId> {
    // get next member id (u64)
    let first_member_id = Membership::members_created();

    (0..count)
        .map(|i| {
            let member_id = first_member_id + i as u64;
            let account_id = account_from_member_id(member_id);
            insert_member(account_id.clone());
            set_staking_account(account_id.clone(), account_id, member_id);
            member_id
        })
        .collect()
}

pub(crate) fn setup_new_council(cycle_id: u64) {
    let council_size = <Runtime as council::Trait>::CouncilSize::get();
    let num_extra_candidates = <Runtime as council::Trait>::MinNumberOfExtraCandidates::get() + 1;
    let councilor_stake: u128 = <Runtime as council::Trait>::MinCandidateStake::get().into();

    // council members that will be elected
    let council_member_ids = create_new_members(council_size);
    // one new voter for each candidate that will be elected
    let voter_ids = create_new_members(council_size);
    // additional candidates that will receive no votes
    let extra_candidate_ids = create_new_members(num_extra_candidates);

    for member_id in council_member_ids.clone() {
        let councilor = account_from_member_id(member_id);
        increase_total_balance_issuance_using_account_id(councilor.clone(), councilor_stake + 1);

        Council::announce_candidacy(
            RawOrigin::Signed(councilor.clone()).into(),
            member_id,
            councilor.clone(),
            councilor.clone(),
            councilor_stake,
        )
        .unwrap();
    }

    for member_id in extra_candidate_ids.clone() {
        let extra_councilor = account_from_member_id(member_id);

        increase_total_balance_issuance_using_account_id(
            extra_councilor.clone(),
            councilor_stake + 1,
        );
        Council::announce_candidacy(
            RawOrigin::Signed(extra_councilor.clone()).into(),
            member_id,
            extra_councilor.clone(),
            extra_councilor.clone(),
            councilor_stake,
        )
        .unwrap();
    }

    let current_block = System::block_number();
    run_to_block(current_block + <Runtime as council::Trait>::AnnouncingPeriodDuration::get());

    let voter_stake: u128 =
        <Runtime as referendum::Trait<ReferendumInstance>>::MinimumStake::get().into();

    for (i, member_id) in voter_ids.clone().iter().enumerate() {
        let voter = account_from_member_id(*member_id);
        increase_total_balance_issuance_using_account_id(voter.clone(), voter_stake + 1);

        let commitment = Referendum::calculate_commitment(
            &voter,
            &[0u8],
            &cycle_id,
            &council_member_ids[i as usize],
        );

        Referendum::vote(
            RawOrigin::Signed(voter.clone()).into(),
            commitment,
            voter_stake,
        )
        .unwrap();
    }

    let current_block = System::block_number();
    run_to_block(
        current_block
            + <Runtime as referendum::Trait<ReferendumInstance>>::VoteStageDuration::get(),
    );

    for (i, member_id) in voter_ids.iter().enumerate() {
        let voter = account_from_member_id(*member_id);
        Referendum::reveal_vote(
            RawOrigin::Signed(voter.clone()).into(),
            vec![0u8],
            council_member_ids[i as usize].clone(),
        )
        .unwrap();
    }

    let current_block = System::block_number();
    run_to_block(
        current_block
            + <Runtime as referendum::Trait<ReferendumInstance>>::RevealStageDuration::get(),
    );

    let council_members = council::Module::<Runtime>::council_members();
    assert_eq!(
        council_members
            .iter()
            .map(|m| *m.member_id())
            .collect::<Vec<_>>(),
        council_member_ids
    );
}

pub(crate) fn insert_member(account_id: AccountId32) {
    increase_total_balance_issuance_using_account_id(
        account_id.clone(),
        crate::DefaultMembershipPrice::get(),
    );
    let handle: &[u8] = account_id.as_ref();

    let params = membership::BuyMembershipParameters {
        root_account: account_id.clone(),
        controller_account: account_id.clone(),
        handle: Some(handle.to_vec()),
        metadata: Vec::new(),
        referrer_id: None,
    };

    Membership::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();
}

pub(crate) fn set_staking_account(
    controller_account_id: AccountId32,
    staking_account_id: AccountId32,
    member_id: u64,
) {
    let current_balance = pallet_balances::Module::<Runtime>::usable_balance(&staking_account_id);

    let _ = pallet_balances::Module::<Runtime>::deposit_creating(
        &staking_account_id,
        <Runtime as membership::Trait>::CandidateStake::get(),
    );

    assert_eq!(
        pallet_balances::Module::<Runtime>::usable_balance(&staking_account_id),
        current_balance + <Runtime as membership::Trait>::CandidateStake::get()
    );

    membership::Module::<Runtime>::add_staking_account_candidate(
        RawOrigin::Signed(staking_account_id.clone()).into(),
        member_id,
    )
    .unwrap();

    assert_eq!(
        pallet_balances::Module::<Runtime>::usable_balance(&staking_account_id),
        current_balance
    );

    membership::Module::<Runtime>::confirm_staking_account(
        RawOrigin::Signed(controller_account_id.clone()).into(),
        member_id,
        staking_account_id.clone(),
    )
    .unwrap();
}

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub(crate) fn run_to_block(n: BlockNumber) {
    while System::block_number() < n {
        <System as OnFinalize<BlockNumber>>::on_finalize(System::block_number());
        <Council as OnFinalize<BlockNumber>>::on_finalize(System::block_number());
        <Referendum as OnFinalize<BlockNumber>>::on_finalize(System::block_number());
        <ProposalsEngine as OnFinalize<BlockNumber>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<BlockNumber>>::on_initialize(System::block_number());
        <Council as OnInitialize<BlockNumber>>::on_initialize(System::block_number());
        <Referendum as OnInitialize<BlockNumber>>::on_initialize(System::block_number());
        <ProposalsEngine as OnInitialize<BlockNumber>>::on_initialize(System::block_number());
    }
}

pub(crate) fn increase_total_balance_issuance_using_account_id(
    account_id: AccountId32,
    balance: u128,
) {
    type Balances = pallet_balances::Module<Runtime>;
    let initial_balance = Balances::total_issuance();
    {
        let _ = Balances::deposit_creating(&account_id, balance);
    }
    assert_eq!(Balances::total_issuance(), initial_balance + balance);
}

pub(crate) fn max_proposal_stake() -> u128 {
    let mut stakes = vec![];
    stakes.push(<Runtime as proposals_codex::Trait>::SetMaxValidatorCountProposalParameters::get());
    stakes.push(<Runtime as proposals_codex::Trait>::RuntimeUpgradeProposalParameters::get());
    stakes.push(<Runtime as proposals_codex::Trait>::SignalProposalParameters::get());
    stakes.push(<Runtime as proposals_codex::Trait>::FundingRequestProposalParameters::get());
    stakes.push(
        <Runtime as proposals_codex::Trait>::CreateWorkingGroupLeadOpeningProposalParameters::get(),
    );
    stakes.push(
        <Runtime as proposals_codex::Trait>::FillWorkingGroupLeadOpeningProposalParameters::get(),
    );
    stakes.push(
        <Runtime as proposals_codex::Trait>::UpdateWorkingGroupBudgetProposalParameters::get(),
    );
    stakes.push(
        <Runtime as proposals_codex::Trait>::DecreaseWorkingGroupLeadStakeProposalParameters::get(),
    );
    stakes
        .push(<Runtime as proposals_codex::Trait>::SlashWorkingGroupLeadProposalParameters::get());
    stakes.push(
        <Runtime as proposals_codex::Trait>::SetWorkingGroupLeadRewardProposalParameters::get(),
    );
    stakes.push(
        <Runtime as proposals_codex::Trait>::TerminateWorkingGroupLeadProposalParameters::get(),
    );
    stakes.push(<Runtime as proposals_codex::Trait>::AmendConstitutionProposalParameters::get());
    stakes.push(
        <Runtime as proposals_codex::Trait>::CancelWorkingGroupLeadOpeningProposalParameters::get(),
    );
    stakes.push(<Runtime as proposals_codex::Trait>::SetMembershipPriceProposalParameters::get());
    stakes.push(
        <Runtime as proposals_codex::Trait>::SetCouncilBudgetIncrementProposalParameters::get(),
    );
    stakes.push(<Runtime as proposals_codex::Trait>::SetCouncilorRewardProposalParameters::get());
    stakes.push(
        <Runtime as proposals_codex::Trait>::SetInitialInvitationBalanceProposalParameters::get(),
    );
    stakes.push(<Runtime as proposals_codex::Trait>::SetInvitationCountProposalParameters::get());
    stakes.push(<Runtime as proposals_codex::Trait>::SetMembershipLeadInvitationQuotaProposalParameters::get());
    stakes.push(<Runtime as proposals_codex::Trait>::SetReferralCutProposalParameters::get());
    stakes.push(<Runtime as proposals_codex::Trait>::CreateBlogPostProposalParameters::get());
    stakes.push(<Runtime as proposals_codex::Trait>::EditBlogPostProoposalParamters::get());
    stakes.push(<Runtime as proposals_codex::Trait>::LockBlogPostProposalParameters::get());
    stakes.push(<Runtime as proposals_codex::Trait>::UnlockBlogPostProposalParameters::get());
    stakes.push(<Runtime as proposals_codex::Trait>::VetoProposalProposalParameters::get());
    stakes.push(<Runtime as proposals_codex::Trait>::UpdateChannelPayoutsProposalParameters::get());

    stakes
        .iter()
        .map(|p| p.required_stake.unwrap_or(0))
        .max_by(|s1, s2| s1.cmp(s2))
        .unwrap()
}
