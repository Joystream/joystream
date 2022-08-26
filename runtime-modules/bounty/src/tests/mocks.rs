#![cfg(test)]

use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::parameter_types;
use frame_support::traits::{Currency, LockIdentifier};
use frame_support::weights::Weight;
use frame_system::{EnsureOneOf, EnsureRoot, EnsureSigned};
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    ModuleId,
};

use crate as bounty;
use crate::Config;
use staking_handler::{LockComparator, StakingManager};

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const BountyModuleId: ModuleId = ModuleId(*b"m:bounty"); // module : bounty
    pub const BountyLockId: [u8; 8] = [12; 8];
    pub const ClosedContractSizeLimit: u32 = 3;
    pub const MinCherryLimit: u64 = 10;
    pub const MinFundingLimit: u64 = 50;
    pub const MinWorkEntrantStake: u64 = 10;
}

type UncheckedExtrinsic = frame_system::mocking::MockUncheckedExtrinsic<Test>;
type Block = frame_system::mocking::MockBlock<Test>;

frame_support::construct_runtime!(
    pub enum Test where
        Block = Block,
        NodeBlock = Block,
        UncheckedExtrinsic = UncheckedExtrinsic,
    {
        System: frame_system::{Module, Call, Config, Storage, Event<T>},
        Membership: membership::{Module, Call, Storage, Event<T>},
        Balances: balances::{Module, Call, Storage, Config<T>, Event<T>},
        Bounty: bounty::{Module, Call, Storage, Event<T>},
        Referendum: referendum::<Instance1>::{Module, Call, Storage, Event<T>},
        Council: council::{Module, Call, Storage, Event<T>},
    }
);

impl frame_system::Config for Test {
    type BaseCallFilter = ();
    type BlockWeights = ();
    type BlockLength = ();
    type Origin = Origin;
    type Call = Call;
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u128;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = Event;
    type BlockHashCount = BlockHashCount;
    type DbWeight = ();
    type Version = ();
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type PalletInfo = PalletInfo;
    type SystemWeightInfo = ();
    type SS58Prefix = ();
}

impl Config for Test {
    type Event = Event;
    type ModuleId = BountyModuleId;
    type BountyId = u64;
    type Membership = ();
    type WeightInfo = ();
    type CouncilBudgetManager = CouncilBudgetManager;
    type StakingHandler = StakingManager<Test, BountyLockId>;
    type EntryId = u64;
    type ClosedContractSizeLimit = ClosedContractSizeLimit;
    type MinCherryLimit = MinCherryLimit;
    type MinFundingLimit = MinFundingLimit;
    type MinWorkEntrantStake = MinWorkEntrantStake;
}

pub const STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER: u128 = 10000;
impl common::StakingAccountValidator<Test> for () {
    fn is_member_staking_account(_: &u64, account_id: &u128) -> bool {
        *account_id != STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER
    }
}

impl common::membership::MembershipInfoProvider<Test> for () {
    fn controller_account_id(member_id: u64) -> Result<u128, DispatchError> {
        if member_id < 10 {
            return Ok(member_id as u128); // similar account_id
        }

        Err(membership::Error::<Test>::MemberProfileNotFound.into())
    }
}

pub const COUNCIL_BUDGET_ACCOUNT_ID: u128 = 90000000;
pub struct CouncilBudgetManager;
impl common::council::CouncilBudgetManager<u128, u64> for CouncilBudgetManager {
    fn get_budget() -> u64 {
        balances::Pallet::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID)
    }

    fn set_budget(budget: u64) {
        let old_budget = Self::get_budget();

        if budget > old_budget {
            let _ = balances::Pallet::<Test>::deposit_creating(
                &COUNCIL_BUDGET_ACCOUNT_ID,
                budget - old_budget,
            );
        }

        if budget < old_budget {
            let _ =
                balances::Pallet::<Test>::slash(&COUNCIL_BUDGET_ACCOUNT_ID, old_budget - budget);
        }
    }

    fn try_withdraw(account_id: &u128, amount: u64) -> DispatchResult {
        let _ = Balances::deposit_creating(account_id, amount);
        Self::decrease_budget(amount);

        Ok(())
    }
}

impl common::membership::MembershipTypes for Test {
    type MemberId = u64;
    type ActorId = u64;
}

impl common::membership::MemberOriginValidator<Origin, u64, u128> for () {
    fn ensure_member_controller_account_origin(
        origin: Origin,
        _member_id: u64,
    ) -> Result<u128, DispatchError> {
        let signed_account_id = frame_system::ensure_signed(origin)?;

        Ok(signed_account_id)
    }

    fn is_member_controller_account(_member_id: &u64, _account_id: &u128) -> bool {
        true
    }
}

parameter_types! {
    pub const DefaultMembershipPrice: u64 = 100;
    pub const InvitedMemberLockId: [u8; 8] = [2; 8];
    pub const ReferralCutMaximumPercent: u8 = 50;
    pub const MinimumStakeForOpening: u32 = 50;
    pub const MinimumApplicationStake: u32 = 50;
    pub const LeaderOpeningStake: u32 = 20;
    pub const StakingCandidateLockId: [u8; 8] = [3; 8];
    pub const DefaultInitialInvitationBalance: u64 = 100;
    pub const CandidateStake: u64 = 130;
}

// Weights info stub
pub struct Weights;
impl membership::WeightInfo for Weights {
    fn buy_membership_without_referrer(_: u32, _: u32) -> Weight {
        unimplemented!()
    }
    fn buy_membership_with_referrer(_: u32, _: u32) -> Weight {
        unimplemented!()
    }
    fn update_profile(_: u32) -> Weight {
        unimplemented!()
    }
    fn update_accounts_none() -> Weight {
        unimplemented!()
    }
    fn update_accounts_root() -> Weight {
        unimplemented!()
    }
    fn update_accounts_controller() -> Weight {
        unimplemented!()
    }
    fn update_accounts_both() -> Weight {
        unimplemented!()
    }
    fn set_referral_cut() -> Weight {
        unimplemented!()
    }
    fn transfer_invites() -> Weight {
        unimplemented!()
    }
    fn invite_member(_: u32, _: u32) -> Weight {
        unimplemented!()
    }
    fn set_membership_price() -> Weight {
        unimplemented!()
    }
    fn update_profile_verification() -> Weight {
        unimplemented!()
    }
    fn set_leader_invitation_quota() -> Weight {
        unimplemented!()
    }
    fn set_initial_invitation_balance() -> Weight {
        unimplemented!()
    }
    fn set_initial_invitation_count() -> Weight {
        unimplemented!()
    }
    fn add_staking_account_candidate() -> Weight {
        unimplemented!()
    }
    fn confirm_staking_account() -> Weight {
        unimplemented!()
    }
    fn remove_staking_account() -> Weight {
        unimplemented!()
    }
    fn member_remark() -> Weight {
        unimplemented!()
    }
}

impl pallet_timestamp::Config for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

impl membership::Config for Test {
    type Event = Event;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type WorkingGroup = Wg;
    type DefaultInitialInvitationBalance = DefaultInitialInvitationBalance;
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InvitedMemberLockId>;
    type StakingCandidateStakingHandler =
        staking_handler::StakingManager<Self, StakingCandidateLockId>;
    type WeightInfo = Weights;
    type CandidateStake = CandidateStake;
}

impl LockComparator<<Test as balances::Config>::Balance> for Test {
    fn are_locks_conflicting(new_lock: &LockIdentifier, existing_locks: &[LockIdentifier]) -> bool {
        if *new_lock != BountyLockId::get() {
            return false;
        }

        existing_locks.contains(new_lock)
    }
}

pub struct Wg;
impl common::working_group::WorkingGroupBudgetHandler<u128, u64> for Wg {
    fn get_budget() -> u64 {
        unimplemented!()
    }

    fn set_budget(_new_value: u64) {
        unimplemented!()
    }

    fn try_withdraw(_account_id: &u128, _amount: u64) -> DispatchResult {
        unimplemented!()
    }
}

impl common::working_group::WorkingGroupAuthenticator<Test> for Wg {
    fn ensure_worker_origin(
        _origin: <Test as frame_system::Config>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!();
    }

    fn ensure_leader_origin(_origin: <Test as frame_system::Config>::Origin) -> DispatchResult {
        unimplemented!()
    }

    fn get_leader_member_id() -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!();
    }

    fn get_worker_member_id(
        _: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Trait>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Config>::AccountId,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        unimplemented!()
    }

    fn worker_exists(_worker_id: &<Test as common::membership::MembershipTypes>::ActorId) -> bool {
        unimplemented!();
    }

    fn ensure_worker_exists(
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!();
    }
}

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
    pub const MinimumPeriod: u64 = 5;
}

impl balances::Config for Test {
    type Balance = u64;
    type DustRemoval = ();
    type Event = Event;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = ();
    type MaxLocks = ();
}

parameter_types! {
    pub const MinNumberOfExtraCandidates: u64 = 1;
    pub const AnnouncingPeriodDuration: u64 = 15;
    pub const IdlePeriodDuration: u64 = 27;
    pub const CouncilSize: u64 = 3;
    pub const MinCandidateStake: u64 = 11000;
    pub const CandidacyLockId: LockIdentifier = *b"council1";
    pub const CouncilorLockId: LockIdentifier = *b"council2";
    pub const ElectedMemberRewardPeriod: u64 = 10;
    pub const BudgetRefillAmount: u64 = 1000;
    // intentionally high number that prevents side-effecting tests other than  budget refill tests
    pub const BudgetRefillPeriod: u64 = 1000;
}

pub type ReferendumInstance = referendum::Instance1;

impl council::Config for Test {
    type Event = Event;
    type Referendum = referendum::Pallet<Test, ReferendumInstance>;
    type MinNumberOfExtraCandidates = MinNumberOfExtraCandidates;
    type CouncilSize = CouncilSize;
    type AnnouncingPeriodDuration = AnnouncingPeriodDuration;
    type IdlePeriodDuration = IdlePeriodDuration;
    type MinCandidateStake = MinCandidateStake;
    type CandidacyLock = StakingManager<Self, CandidacyLockId>;
    type CouncilorLock = StakingManager<Self, CouncilorLockId>;
    type ElectedMemberRewardPeriod = ElectedMemberRewardPeriod;
    type BudgetRefillPeriod = BudgetRefillPeriod;
    type StakingAccountValidator = ();
    type WeightInfo = CouncilWeightInfo;
    type MemberOriginValidator = ();

    fn new_council_elected(_: &[council::CouncilMemberOf<Self>]) {}
}

pub struct CouncilWeightInfo;
impl council::WeightInfo for CouncilWeightInfo {
    fn try_process_budget() -> Weight {
        0
    }
    fn try_progress_stage_idle() -> Weight {
        0
    }
    fn try_progress_stage_announcing_start_election(_: u32) -> Weight {
        0
    }
    fn try_progress_stage_announcing_restart() -> Weight {
        0
    }
    fn announce_candidacy() -> Weight {
        0
    }
    fn release_candidacy_stake() -> Weight {
        0
    }
    fn set_candidacy_note(_: u32) -> Weight {
        0
    }
    fn withdraw_candidacy() -> Weight {
        0
    }
    fn set_budget() -> Weight {
        0
    }
    fn plan_budget_refill() -> Weight {
        0
    }
    fn set_budget_increment() -> Weight {
        0
    }
    fn set_councilor_reward() -> Weight {
        0
    }
    fn funding_request(_: u32) -> Weight {
        0
    }
    fn fund_council_budget() -> Weight {
        0
    }
    fn councilor_remark() -> Weight {
        0
    }
    fn candidate_remark() -> Weight {
        0
    }
}

parameter_types! {
    pub const VoteStageDuration: u64 = 19;
    pub const RevealStageDuration: u64 = 23;
    pub const MinimumVotingStake: u64 = 10000;
    pub const MaxSaltLength: u64 = 32; // use some multiple of 8 for ez testing
    pub const VotingLockId: LockIdentifier = *b"referend";
    pub const MaxWinnerTargetCount: u64 = 10;
}

impl referendum::Config<ReferendumInstance> for Test {
    type Event = Event;
    type MaxSaltLength = MaxSaltLength;
    type StakingHandler = staking_handler::StakingManager<Self, VotingLockId>;
    type ManagerOrigin =
        EnsureOneOf<Self::AccountId, EnsureSigned<Self::AccountId>, EnsureRoot<Self::AccountId>>;
    type VotePower = u64;
    type VoteStageDuration = VoteStageDuration;
    type RevealStageDuration = RevealStageDuration;
    type MinimumStake = MinimumVotingStake;
    type WeightInfo = ReferendumWeightInfo;
    type MaxWinnerTargetCount = MaxWinnerTargetCount;

    fn calculate_vote_power(
        _: &<Self as frame_system::Config>::AccountId,
        _: &Self::Balance,
    ) -> Self::VotePower {
        1
    }

    fn can_unlock_vote_stake(
        _: &referendum::CastVote<Self::Hash, Self::Balance, Self::MemberId>,
    ) -> bool {
        true
    }

    fn process_results(winners: &[referendum::OptionResult<Self::MemberId, Self::VotePower>]) {
        let tmp_winners: Vec<referendum::OptionResult<Self::MemberId, Self::VotePower>> = winners
            .iter()
            .map(|item| referendum::OptionResult {
                option_id: item.option_id,
                vote_power: item.vote_power.into(),
            })
            .collect();
        <council::Module<Test> as council::ReferendumConnection<Test>>::recieve_referendum_results(
            tmp_winners.as_slice(),
        );
    }

    fn is_valid_option_id(option_index: &u64) -> bool {
        <council::Module<Test> as council::ReferendumConnection<Test>>::is_valid_candidate_id(
            option_index,
        )
    }

    fn get_option_power(option_id: &u64) -> Self::VotePower {
        <council::Module<Test> as council::ReferendumConnection<Test>>::get_option_power(option_id)
    }

    fn increase_option_power(option_id: &u64, amount: &Self::VotePower) {
        <council::Module<Test> as council::ReferendumConnection<Test>>::increase_option_power(
            option_id, amount,
        );
    }
}

pub struct ReferendumWeightInfo;
impl referendum::WeightInfo for ReferendumWeightInfo {
    fn on_initialize_revealing(_: u32) -> Weight {
        0
    }
    fn on_initialize_voting() -> Weight {
        0
    }
    fn vote() -> Weight {
        0
    }
    fn reveal_vote_space_for_new_winner(_: u32) -> Weight {
        0
    }
    fn reveal_vote_space_not_in_winners(_: u32) -> Weight {
        0
    }
    fn reveal_vote_space_replace_last_winner(_: u32) -> Weight {
        0
    }
    fn reveal_vote_already_existing(_: u32) -> Weight {
        0
    }
    fn release_vote_stake() -> Weight {
        0
    }
}

pub fn build_test_externalities() -> sp_io::TestExternalities {
    let t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}
