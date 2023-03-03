//! Mock runtime for the module testing.
//!
//! Submodules:
//! - proposals: provides types for proposal execution tests
//!

#![cfg(test)]

use frame_support::dispatch::DispatchError;
use frame_support::traits::LockIdentifier;
use frame_support::{
    parameter_types,
    traits::{ConstU16, ConstU32, ConstU64, EnsureOneOf},
};
pub use frame_system;
use frame_system::{EnsureRoot, EnsureSigned};
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    DispatchResult,
};

pub(crate) mod proposals;
use crate as engine;
use crate::ProposalObserver;
pub use proposals::*;
use sp_std::convert::{TryFrom, TryInto};
use staking_handler::{LockComparator, StakingManager};

type UncheckedExtrinsic = frame_system::mocking::MockUncheckedExtrinsic<Test>;
type Block = frame_system::mocking::MockBlock<Test>;

frame_support::construct_runtime!(
    pub enum Test where
        Block = Block,
        NodeBlock = Block,
        UncheckedExtrinsic = UncheckedExtrinsic,
    {
        System: frame_system,
        Balances: balances,
        Membership: membership::{Pallet, Call, Storage, Event<T>},
        Timestamp: pallet_timestamp,
        Council: council::{Pallet, Call, Storage, Event<T>},
        Referendum: referendum::<Instance1>::{Pallet, Call, Storage, Event<T>},
        ProposalsEngine: engine::{Pallet, Call, Storage, Event<T>},
    }
);

parameter_types! {
    pub const VoteStageDuration: u64 = 19;
    pub const RevealStageDuration: u64 = 23;
    pub const MinimumVotingStake: u64 = 10000;
    pub const MaxSaltLength: u64 = 32; // use some multiple of 8 for ez testing
    pub const VotingLockId: LockIdentifier = *b"referend";
    pub const MinimumPeriod: u64 = 5;
    pub const MaxWinnerTargetCount: u32 = 10;
}

impl referendum::Config<ReferendumInstance> for Test {
    type RuntimeEvent = RuntimeEvent;

    type MaxSaltLength = MaxSaltLength;

    type StakingHandler = staking_handler::StakingManager<Self, VotingLockId>;
    type ManagerOrigin = EnsureOneOf<EnsureSigned<Self::AccountId>, EnsureRoot<Self::AccountId>>;

    type VotePower = u64;

    type VoteStageDuration = VoteStageDuration;
    type RevealStageDuration = RevealStageDuration;

    type MinimumStake = MinimumVotingStake;

    type WeightInfo = ();

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
                vote_power: item.vote_power,
            })
            .collect();
        <council::Module<Test> as council::ReferendumConnection<Test>>::recieve_referendum_results(
            tmp_winners.as_slice(),
        );
    }

    fn is_valid_option_id(_: &u64) -> bool {
        true
    }

    fn get_option_power(_: &u64) -> Self::VotePower {
        1
    }

    fn increase_option_power(_: &u64, _: &Self::VotePower) {}
}

impl proposals::Config for Test {}

parameter_types! {
    pub const CancellationFee: u64 = 5;
    pub const RejectionFee: u64 = 3;
    pub const TitleMaxLength: u32 = 100;
    pub const DescriptionMaxLength: u32 = 10000;
    pub const MaxActiveProposalLimit: u32 = 100;
    pub const LockId: LockIdentifier = [1; 8];
    pub const DefaultMembershipPrice: u64 = 100;
    pub const DefaultInitialInvitationBalance: u64 = 100;
    pub const DefaultMemberInvitesCount: u32 = 2;
    pub const InvitedMemberLockId: [u8; 8] = [2; 8];
    pub const ReferralCutMaximumPercent: u8 = 50;
    pub const StakingCandidateLockId: [u8; 8] = [3; 8];
    pub const CandidateStake: u64 = 100;
}

impl common::membership::MembershipTypes for Test {
    type MemberId = u64;
    type ActorId = u64;
}

impl membership::Config for Test {
    type RuntimeEvent = RuntimeEvent;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type WorkingGroup = Wg;
    type WeightInfo = ();
    type DefaultInitialInvitationBalance = ();
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InvitedMemberLockId>;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type StakingCandidateStakingHandler =
        staking_handler::StakingManager<Self, StakingCandidateLockId>;
    type CandidateStake = CandidateStake;
    type DefaultMemberInvitesCount = DefaultMemberInvitesCount;
}

pub struct Wg;
impl common::working_group::WorkingGroupBudgetHandler<u64, u64> for Wg {
    fn get_budget() -> u64 {
        unimplemented!()
    }

    fn set_budget(_new_value: u64) {
        unimplemented!()
    }

    fn try_withdraw(_account_id: &u64, _amount: u64) -> DispatchResult {
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
        unimplemented!()
    }

    fn get_worker_member_id(
        _: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Config>::AccountId) -> bool {
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
    pub const DispatchableCallCodeMaxLen: u32 = 1024 * 1024;
}

impl crate::Config for Test {
    type RuntimeEvent = RuntimeEvent;
    type ProposerOriginValidator = ();
    type CouncilOriginValidator = ();
    type TotalVotersCounter = ();
    type ProposalId = u32;
    type StakingHandler = StakingManager<Test, LockId>;
    type CancellationFee = CancellationFee;
    type RejectionFee = RejectionFee;
    type TitleMaxLength = TitleMaxLength;
    type DescriptionMaxLength = DescriptionMaxLength;
    type MaxActiveProposalLimit = MaxActiveProposalLimit;
    type DispatchableCallCode = proposals::Call<Test>;
    type ProposalObserver = ();
    type WeightInfo = ();
    type StakingAccountValidator = ();
    type DispatchableCallCodeMaxLen = DispatchableCallCodeMaxLen;
}

pub const STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER: u64 = 222;

impl common::StakingAccountValidator<Test> for () {
    fn is_member_staking_account(_: &u64, account_id: &u64) -> bool {
        *account_id != STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER
    }
}

impl ProposalObserver<Test> for () {
    fn proposal_removed(_proposal_id: &u32) {}
}

impl Default for proposals::Call<Test> {
    fn default() -> Self {
        panic!("shouldn't call default for Call");
    }
}

impl common::membership::MemberOriginValidator<Origin, u64, u64> for () {
    fn ensure_member_controller_account_origin(
        origin: Origin,
        _account_id: u64,
    ) -> Result<u64, DispatchError> {
        let signed_account_id = frame_system::ensure_signed(origin)?;

        Ok(signed_account_id)
    }

    fn is_member_controller_account(_member_id: &u64, _account_id: &u64) -> bool {
        true
    }
}

impl common::council::CouncilOriginValidator<Origin, u64, u64> for () {
    fn ensure_member_consulate(origin: Origin, _: u64) -> DispatchResult {
        frame_system::ensure_signed(origin)?;

        Ok(())
    }
}

// If changing count is required, we can upgrade the implementation as shown here:
// https://substrate.dev/recipes/3-entrees/testing/externalities.html
impl crate::VotersParameters for () {
    fn total_voters_count() -> u32 {
        4
    }
}

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const ExistentialDeposit: u32 = 10;
}

impl frame_system::Config for Test {
    type BaseCallFilter = frame_support::traits::Everything;
    type BlockWeights = ();
    type BlockLength = ();
    type DbWeight = ();
    type Origin = Origin;
    type Call = Call;
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type RuntimeEvent = RuntimeEvent;
    type BlockHashCount = ConstU64<250>;
    type Version = ();
    type PalletInfo = PalletInfo;
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type SystemWeightInfo = ();
    type SS58Prefix = ConstU16<42>;
    type OnSetCode = ();
    type MaxConsumers = frame_support::traits::ConstU32<16>;
}

impl pallet_timestamp::Config for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

impl balances::Config for Test {
    type Balance = u64;
    type DustRemoval = ();
    type RuntimeEvent = RuntimeEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type MaxLocks = ();
    type MaxReserves = ConstU32<2>;
    type ReserveIdentifier = [u8; 8];
    type WeightInfo = ();
}

parameter_types! {
    pub const MinNumberOfExtraCandidates: u32 = 1;
    pub const AnnouncingPeriodDuration: u64 = 15;
    pub const IdlePeriodDuration: u64 = 27;
    pub const CouncilSize: u32 = 4;
    pub const MinCandidateStake: u64 = 11000;
    pub const CandidacyLockId: LockIdentifier = *b"council1";
    pub const CouncilorLockId: LockIdentifier = *b"council2";
    pub const ElectedMemberRewardPeriod: u64 = 10;
    pub const BudgetRefillAmount: u64 = 1000;
    // intentionally high number that prevents side-effecting tests other than  budget refill tests
    pub const BudgetRefillPeriod: u64 = 1000;
}

type ReferendumInstance = referendum::Instance1;

impl council::Config for Test {
    type RuntimeEvent = RuntimeEvent;

    type Referendum = referendum::Module<Test, ReferendumInstance>;

    type MinNumberOfExtraCandidates = MinNumberOfExtraCandidates;
    type CouncilSize = CouncilSize;
    type AnnouncingPeriodDuration = AnnouncingPeriodDuration;
    type IdlePeriodDuration = IdlePeriodDuration;
    type MinCandidateStake = MinCandidateStake;

    type CandidacyLock = StakingManager<Self, CandidacyLockId>;
    type CouncilorLock = StakingManager<Self, CouncilorLockId>;

    type ElectedMemberRewardPeriod = ElectedMemberRewardPeriod;

    type BudgetRefillPeriod = BudgetRefillPeriod;

    type StakingAccountValidator = membership::Module<Test>;
    type WeightInfo = ();

    fn new_council_elected(_: &[council::CouncilMemberOf<Self>]) {}

    type MemberOriginValidator = ();
}

impl LockComparator<<Test as balances::Config>::Balance> for Test {
    fn are_locks_conflicting(new_lock: &LockIdentifier, existing_locks: &[LockIdentifier]) -> bool {
        existing_locks.iter().any(|l| l == new_lock)
    }
}

pub fn initial_test_ext() -> sp_io::TestExternalities {
    let mut t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    council::GenesisConfig::<Test>::default()
        .assimilate_storage(&mut t)
        .unwrap();

    t.into()
}
