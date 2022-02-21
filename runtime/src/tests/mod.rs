//! The Joystream Substrate Node runtime integration tests.

#![cfg(test)]
#[macro_use]

mod proposals_integration;
mod locks;

// Temporary commented for Olympia: https://github.com/Joystream/joystream/issues/3237
// TODO: Restore after the Olympia release
//mod fee_tests;

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

fn get_account_membership(account: AccountId32, i: usize) -> u64 {
    let member_id = i as u64;
    if Membership::membership(member_id).controller_account != account {
        insert_member(account.clone());
        set_staking_account(account.clone(), account, member_id);
    }

    member_id
}

// council = Vec<(ID - membership handle helper, ACCOUNT_ID)>
pub(crate) fn elect_council(council: Vec<(u8, AccountId32)>, cycle_id: u64) {
    let mut voters = Vec::<AccountId32>::new();

    let councilor_stake: u128 = <Runtime as council::Trait>::MinCandidateStake::get().into();
    let extra_candidates = <Runtime as council::Trait>::MinNumberOfExtraCandidates::get() + 1;
    let mut council_member_ids = Vec::new();

    for (i, councilor) in council.iter() {
        increase_total_balance_issuance_using_account_id(
            councilor.clone().into(),
            councilor_stake + 1,
        );

        let member_id = get_account_membership(councilor.clone(), *i as usize);
        Council::announce_candidacy(
            RawOrigin::Signed(councilor.clone()).into(),
            member_id,
            councilor.clone(),
            councilor.clone(),
            councilor_stake,
        )
        .unwrap();
        // Make sure to use different voters in each election cycle to prevent problems with
        // staking
        voters.push(
            [(council.len() as u8 + extra_candidates as u8) * (cycle_id as u8 + 1) + *i; 32].into(),
        );
        council_member_ids.push(member_id);
    }

    let council_index = (council.clone().last().unwrap().0 + 10) as usize;
    for i in council_index..(council_index + extra_candidates as usize) {
        let extra_councilor: AccountId32 = [i as u8; 32].into();

        let member_id = get_account_membership(extra_councilor.clone(), i);
        Council::release_candidacy_stake(
            RawOrigin::Signed(extra_councilor.clone()).into(),
            member_id,
        )
        .unwrap_or_else(|err| assert_eq!(err, council::Error::NoStake));
        increase_total_balance_issuance_using_account_id(
            extra_councilor.clone().into(),
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
    for (i, voter) in voters.iter().enumerate() {
        increase_total_balance_issuance_using_account_id(voter.clone().into(), voter_stake + 1);

        let commitment = Referendum::calculate_commitment(
            voter.into(),
            &[0u8],
            &cycle_id,
            &council_member_ids[i],
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

    for (i, voter) in voters.iter().enumerate() {
        Referendum::reveal_vote(
            RawOrigin::Signed(voter.clone()).into(),
            vec![0u8],
            council_member_ids[i].clone(),
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
