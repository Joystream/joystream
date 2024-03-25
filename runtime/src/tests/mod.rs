//! The Joystream Substrate Node runtime integration tests.
#![cfg(test)]

#[macro_use]
mod proposals_integration;
mod fee_tests;
mod handle_fees;
mod locks;

use crate::constants::currency;
use crate::primitives::{Balance, MemberId};
use crate::{BlockNumber, ReferendumInstance, Runtime};
use frame_support::traits::{Currency, GenesisBuild, OnFinalize, OnInitialize};
use frame_system::RawOrigin;
use pallet_staking::Forcing;
use referendum::ReferendumManager;
use sp_runtime::{traits::One, AccountId32, BuildStorage};

type Membership = membership::Module<Runtime>;
type System = frame_system::Pallet<Runtime>;
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

    let staking_config = pallet_staking::GenesisConfig::<crate::Runtime> {
        min_nominator_bond: currency::MIN_NOMINATOR_BOND,
        min_validator_bond: currency::MIN_VALIDATOR_BOND,
        force_era: Forcing::ForceNone,
        ..Default::default()
    }
    .build_storage()
    .unwrap();

    staking_config.assimilate_storage(&mut t).unwrap();

    t.into()
}

// Simple unique account derived from member id
pub(crate) fn account_from_member_id(member_id: MemberId) -> AccountId32 {
    // Avoid AccountId Zero - cannot sign a transaction
    let member_id: MemberId = member_id + MemberId::one();
    let b1: u8 = ((member_id >> 24) & 0xff) as u8;
    let b2: u8 = ((member_id >> 16) & 0xff) as u8;
    let b3: u8 = ((member_id >> 8) & 0xff) as u8;
    let b4: u8 = (member_id & 0xff) as u8;
    let mut account: [u8; 32] = [0; 32];
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
            let member_id = first_member_id + i;
            let account_id = account_from_member_id(member_id);
            insert_member(account_id.clone());
            set_staking_account(account_id.clone(), account_id, member_id);
            member_id
        })
        .collect()
}

pub(crate) fn setup_new_council(cycle_id: u64) {
    let council_size = <Runtime as council::Config>::CouncilSize::get();
    let num_extra_candidates = <Runtime as council::Config>::MinNumberOfExtraCandidates::get() + 1;
    let councilor_stake: u128 = <Runtime as council::Config>::MinCandidateStake::get();

    // council members that will be elected
    let council_member_ids = create_new_members(council_size as u64);
    // one new voter for each candidate that will be elected
    let voter_ids = create_new_members(council_size as u64);
    // additional candidates that will receive no votes
    let extra_candidate_ids = create_new_members(num_extra_candidates as u64);

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

    for member_id in extra_candidate_ids {
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
    run_to_block(current_block + <Runtime as council::Config>::AnnouncingPeriodDuration::get());

    let voter_stake: u128 =
        <Runtime as referendum::Config<ReferendumInstance>>::MinimumStake::get();

    for (i, member_id) in voter_ids.iter().enumerate() {
        let voter = account_from_member_id(*member_id);
        increase_total_balance_issuance_using_account_id(voter.clone(), voter_stake + 1);

        let commitment =
            Referendum::calculate_commitment(&voter, &[0u8], &cycle_id, &council_member_ids[i]);

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
            + <Runtime as referendum::Config<ReferendumInstance>>::VoteStageDuration::get(),
    );

    for (i, member_id) in voter_ids.iter().enumerate() {
        let voter = account_from_member_id(*member_id);
        Referendum::reveal_vote(
            RawOrigin::Signed(voter.clone()).into(),
            vec![0u8],
            council_member_ids[i],
        )
        .unwrap();
    }

    let current_block = System::block_number();
    run_to_block(
        current_block
            + <Runtime as referendum::Config<ReferendumInstance>>::RevealStageDuration::get(),
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
    let current_balance = pallet_balances::Pallet::<Runtime>::usable_balance(&staking_account_id);
    let stake = <Runtime as membership::Config>::CandidateStake::get();
    let _ = pallet_balances::Pallet::<Runtime>::deposit_creating(
        &staking_account_id,
        stake + crate::ExistentialDeposit::get(),
    );

    assert_eq!(
        pallet_balances::Pallet::<Runtime>::usable_balance(&staking_account_id),
        current_balance + stake + crate::ExistentialDeposit::get()
    );

    membership::Module::<Runtime>::add_staking_account_candidate(
        RawOrigin::Signed(staking_account_id.clone()).into(),
        member_id,
    )
    .unwrap();

    assert_eq!(
        pallet_balances::Pallet::<Runtime>::usable_balance(&staking_account_id),
        current_balance + crate::ExistentialDeposit::get()
    );

    membership::Module::<Runtime>::confirm_staking_account(
        RawOrigin::Signed(controller_account_id).into(),
        member_id,
        staking_account_id,
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
    balance: Balance,
) {
    type Balances = pallet_balances::Pallet<Runtime>;
    let initial_balance = Balances::total_issuance();
    let deposit = balance + crate::ExistentialDeposit::get();
    {
        let _ = Balances::deposit_creating(&account_id, deposit);
    }
    assert_eq!(Balances::total_issuance(), initial_balance + deposit);
}

pub(crate) fn max_proposal_stake() -> Balance {
    let stakes = vec![
        <Runtime as proposals_codex::Config>::SetMaxValidatorCountProposalParameters::get(),
        <Runtime as proposals_codex::Config>::RuntimeUpgradeProposalParameters::get(),
        <Runtime as proposals_codex::Config>::SignalProposalParameters::get(),
        <Runtime as proposals_codex::Config>::FundingRequestProposalParameters::get(),
        <Runtime as proposals_codex::Config>::CreateWorkingGroupLeadOpeningProposalParameters::get(),
        <Runtime as proposals_codex::Config>::FillWorkingGroupLeadOpeningProposalParameters::get(),
        <Runtime as proposals_codex::Config>::UpdateWorkingGroupBudgetProposalParameters::get(),
        <Runtime as proposals_codex::Config>::DecreaseWorkingGroupLeadStakeProposalParameters::get(),
        <Runtime as proposals_codex::Config>::SlashWorkingGroupLeadProposalParameters::get(),
        <Runtime as proposals_codex::Config>::SetWorkingGroupLeadRewardProposalParameters::get(),
        <Runtime as proposals_codex::Config>::TerminateWorkingGroupLeadProposalParameters::get(),
        <Runtime as proposals_codex::Config>::AmendConstitutionProposalParameters::get(),
        <Runtime as proposals_codex::Config>::CancelWorkingGroupLeadOpeningProposalParameters::get(),
        <Runtime as proposals_codex::Config>::SetMembershipPriceProposalParameters::get(),
        <Runtime as proposals_codex::Config>::SetCouncilBudgetIncrementProposalParameters::get(),
        <Runtime as proposals_codex::Config>::SetCouncilorRewardProposalParameters::get(),
        <Runtime as proposals_codex::Config>::SetInitialInvitationBalanceProposalParameters::get(),
        <Runtime as proposals_codex::Config>::SetInvitationCountProposalParameters::get(),
        <Runtime as proposals_codex::Config>::SetMembershipLeadInvitationQuotaProposalParameters::get(),
        <Runtime as proposals_codex::Config>::SetReferralCutProposalParameters::get(),
        <Runtime as proposals_codex::Config>::VetoProposalProposalParameters::get(),
        <Runtime as proposals_codex::Config>::UpdateChannelPayoutsProposalParameters::get(),
        <Runtime as proposals_codex::Config>::UpdateGlobalNftLimitProposalParameters::get(),
        <Runtime as proposals_codex::Config>::SetPalletFozenStatusProposalParameters::get()
    ];

    stakes
        .iter()
        .map(|p| p.required_stake.unwrap_or(0))
        .max_by(|s1, s2| s1.cmp(s2))
        .unwrap()
}
