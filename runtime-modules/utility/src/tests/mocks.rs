#![cfg(test)]

use crate as utility;
pub(crate) use crate::Module as Utilities;
use crate::*;
use common::working_group::{WorkingGroup, WorkingGroupBudgetHandler};
use frame_support::{
    dispatch::DispatchError,
    parameter_types,
    traits::{ConstU16, ConstU32, ConstU64, EnsureOneOf, LockIdentifier, OnFinalize, OnInitialize},
};
use frame_system::{EnsureRoot, EnsureSigned, EventRecord, RawOrigin};
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    DispatchResult, Perbill,
};
use sp_std::convert::{TryFrom, TryInto};

use staking_handler::{LockComparator, StakingManager};

pub(crate) fn assert_last_event(generic_event: <Test as Config>::Event) {
    let events = System::events();
    let system_event: <Test as frame_system::Config>::Event = generic_event;
    assert!(
        !events.is_empty(),
        "If you are checking for last event there must be at least 1 event"
    );

    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

macro_rules! call_wg {
    ($working_group:ident<$T:ty>, $function:ident $(,$x:expr)*) => {{
        match $working_group {
            WorkingGroup::Content =>
                <working_group::Module::<$T, ContentWorkingGroupInstance> as WorkingGroupBudgetHandler<u64, u64>>::$function($($x,)*),

            WorkingGroup::Storage =>
                <working_group::Module::<$T, StorageWorkingGroupInstance> as WorkingGroupBudgetHandler<u64, u64>>::$function($($x,)*),

            WorkingGroup::Forum =>
                <working_group::Module::<$T, ForumWorkingGroupInstance> as WorkingGroupBudgetHandler<u64, u64>>::$function($($x,)*),

            WorkingGroup::Membership =>
                <working_group::Module::<$T, MembershipWorkingGroupInstance> as WorkingGroupBudgetHandler<u64, u64>>::$function($($x,)*),

            WorkingGroup::Gateway =>
                <working_group::Module::<$T, GatewayWorkingGroupInstance> as WorkingGroupBudgetHandler<u64, u64>>::$function($($x,)*),

            WorkingGroup::Distribution =>
                <working_group::Module::<$T, DistributionWorkingGroupInstance> as WorkingGroupBudgetHandler<u64, u64>>::$function($($x,)*),
            WorkingGroup::OperationsAlpha =>
                <working_group::Module::<$T, OperationsWorkingGroupInstanceAlpha> as WorkingGroupBudgetHandler<u64, u64>>::$function($($x,)*),
            WorkingGroup::OperationsBeta =>
                <working_group::Module::<$T, OperationsWorkingGroupInstanceAlpha> as WorkingGroupBudgetHandler<u64, u64>>::$function($($x,)*),
            WorkingGroup::OperationsGamma =>
                <working_group::Module::<$T, OperationsWorkingGroupInstanceAlpha> as WorkingGroupBudgetHandler<u64, u64>>::$function($($x,)*),
        }
    }};
}

// The forum working group instance alias.
pub type ForumWorkingGroupInstance = working_group::Instance1;

// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;

// The content directory working group instance alias.
pub type ContentWorkingGroupInstance = working_group::Instance3;

// The builder working group instance alias.
pub type OperationsWorkingGroupInstanceAlpha = working_group::Instance4;

// The gateway working group instance alias.
pub type GatewayWorkingGroupInstance = working_group::Instance5;

// The membership working group instance alias.
pub type MembershipWorkingGroupInstance = working_group::Instance6;

// The builder working group instance alias.
pub type OperationsWorkingGroupInstanceBeta = working_group::Instance7;

// The builder working group instance alias.
pub type OperationsWorkingGroupInstanceGamma = working_group::Instance8;

// The distribution working group instance alias.
pub type DistributionWorkingGroupInstance = working_group::Instance9;

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
        Timestamp: pallet_timestamp,
        Membership: membership::{Pallet, Call, Storage, Event<T>},
        Utility: utility::{Pallet, Call, Event<T>},
        Council: council::{Pallet, Call, Storage, Event<T>, Config<T>},
        Referendum: referendum::<Instance1>::{Pallet, Call, Storage, Event<T, I>, Config<T>},

        ForumWorkingGroup: working_group::<Instance1>::{Pallet, Call, Storage, Event<T, I>},
        StorageWorkingGroup: working_group::<Instance2>::{Pallet, Call, Storage, Event<T, I>},
        ContentDirectoryWorkingGroup: working_group::<Instance3>::{Pallet, Call, Storage, Event<T, I>},
        Wg4: working_group::<Instance4>::{Pallet, Call, Storage, Event<T, I>},
        Wg5: working_group::<Instance5>::{Pallet, Call, Storage, Event<T, I>},
        MembershipWorkingGroup: working_group::<Instance6>::{Pallet, Call, Storage, Event<T, I>},
        Wg7: working_group::<Instance7>::{Pallet, Call, Storage, Event<T, I>},
        Wg8: working_group::<Instance8>::{Pallet, Call, Storage, Event<T, I>},
        Wg9: working_group::<Instance9>::{Pallet, Call, Storage, Event<T, I>},
    }
);

parameter_types! {
    pub const ExistentialDeposit: u32 = 1;
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
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
    type Event = Event;
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
    type Event = Event;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type MaxLocks = ();
    type MaxReserves = ConstU32<2>;
    type ReserveIdentifier = [u8; 8];
    type WeightInfo = ();
}

impl Config for Test {
    type Event = Event;

    type WeightInfo = ();

    fn get_working_group_budget(working_group: WorkingGroup) -> BalanceOf<Test> {
        call_wg!(working_group<Test>, get_budget)
    }

    fn set_working_group_budget(working_group: WorkingGroup, budget: BalanceOf<Test>) {
        call_wg!(working_group<Test>, set_budget, budget)
    }
}

parameter_types! {
    pub const DefaultMembershipPrice: u64 = 100;
    pub const InvitedMemberLockId: [u8; 8] = [2; 8];
    pub const ReferralCutMaximumPercent: u8 = 50;
    pub const StakingCandidateLockId: [u8; 8] = [3; 8];
    pub const CandidateStake: u64 = 100;
}

impl membership::Config for Test {
    type Event = Event;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type WorkingGroup = Wg;
    type WeightInfo = ();
    type DefaultInitialInvitationBalance = ();
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InvitedMemberLockId>;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type StakingCandidateStakingHandler =
        staking_handler::StakingManager<Self, StakingCandidateLockId>;
    type CandidateStake = CandidateStake;
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
    pub const MaxWorkerNumberLimit: u32 = 100;
    pub const LockId1: [u8; 8] = [1; 8];
    pub const LockId2: [u8; 8] = [2; 8];
    pub const MinimumApplicationStake: u32 = 50;
    pub const LeaderOpeningStake: u32 = 20;
}

impl working_group::Config<ContentWorkingGroupInstance> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId1>;
    type StakingAccountValidator = membership::Module<Test>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<StorageWorkingGroupInstance> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId2>;
    type StakingAccountValidator = membership::Module<Test>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<ForumWorkingGroupInstance> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = staking_handler::StakingManager<Self, LockId2>;
    type StakingAccountValidator = membership::Module<Test>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<MembershipWorkingGroupInstance> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId2>;
    type StakingAccountValidator = membership::Module<Test>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<GatewayWorkingGroupInstance> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId2>;
    type StakingAccountValidator = membership::Module<Test>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<DistributionWorkingGroupInstance> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId2>;
    type StakingAccountValidator = membership::Module<Test>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<OperationsWorkingGroupInstanceAlpha> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId2>;
    type StakingAccountValidator = membership::Module<Test>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<OperationsWorkingGroupInstanceBeta> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId2>;
    type StakingAccountValidator = membership::Module<Test>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<OperationsWorkingGroupInstanceGamma> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StakingManager<Self, LockId2>;
    type StakingAccountValidator = membership::Module<Test>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
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

pub struct BurnTokensFixture {
    account_id: u64,
    account_initial_balance: u64,
    burn_balance: u64,
}

impl Default for BurnTokensFixture {
    fn default() -> Self {
        BurnTokensFixture {
            account_id: 0,
            account_initial_balance: 1_000,
            burn_balance: 100,
        }
    }
}

impl BurnTokensFixture {
    pub fn with_account_initial_balance(mut self, balance: u64) -> Self {
        self.account_initial_balance = balance;
        self
    }

    pub fn with_burn_balance(mut self, balance: u64) -> Self {
        self.burn_balance = balance;
        self
    }

    pub fn execute_and_assert(&self, result: DispatchResult) {
        let initial_balance: u64 = Balances::total_issuance();

        let _ = Balances::deposit_creating(&self.account_id, self.account_initial_balance);
        assert_eq!(
            Balances::total_issuance(),
            initial_balance + self.account_initial_balance
        );
        assert_eq!(
            Balances::usable_balance(&self.account_id),
            self.account_initial_balance
        );
        assert_eq!(
            Utilities::<Test>::burn_account_tokens(
                RawOrigin::Signed(self.account_id).into(),
                self.burn_balance
            ),
            result
        );
        if result.is_ok() {
            assert_eq!(
                Balances::usable_balance(&self.account_id),
                self.account_initial_balance - self.burn_balance
            );
            assert_eq!(
                Balances::total_issuance(),
                initial_balance + self.account_initial_balance - self.burn_balance
            );
            assert_last_event(RawEvent::TokensBurned(self.account_id, self.burn_balance).into());
        } else {
            assert_eq!(
                Balances::usable_balance(&self.account_id),
                self.account_initial_balance
            );
            assert_eq!(
                Balances::total_issuance(),
                initial_balance + self.account_initial_balance
            );
        }
    }
}

impl council::Config for Test {
    type Event = Event;
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
    type StakingAccountValidator = ();
    type WeightInfo = ();
    type MemberOriginValidator = ();

    fn new_council_elected(_: &[council::CouncilMemberOf<Self>]) {}
}

impl common::StakingAccountValidator<Test> for () {
    fn is_member_staking_account(_: &u64, _: &u64) -> bool {
        true
    }
}

impl common::membership::MemberOriginValidator<Origin, u64, u64> for () {
    fn ensure_member_controller_account_origin(
        origin: Origin,
        _: u64,
    ) -> Result<u64, DispatchError> {
        let account_id = frame_system::ensure_signed(origin)?;

        Ok(account_id)
    }

    fn is_member_controller_account(member_id: &u64, account_id: &u64) -> bool {
        member_id == account_id
    }
}

impl common::council::CouncilOriginValidator<Origin, u64, u64> for () {
    fn ensure_member_consulate(origin: Origin, _: u64) -> DispatchResult {
        frame_system::ensure_signed(origin)?;

        Ok(())
    }
}

impl common::membership::MembershipTypes for Test {
    type MemberId = u64;
    type ActorId = u64;
}

impl LockComparator<<Test as balances::Config>::Balance> for Test {
    fn are_locks_conflicting(
        _new_lock: &LockIdentifier,
        _existing_locks: &[LockIdentifier],
    ) -> bool {
        false
    }
}

pub fn initial_test_ext() -> sp_io::TestExternalities {
    let t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    let mut result = Into::<sp_io::TestExternalities>::into(t);

    // Make sure we are not in block 1 where no events are emitted
    // see https://substrate.dev/recipes/2-appetizers/4-events.html#emitting-events
    result.execute_with(|| {
        let mut block_number = frame_system::Pallet::<Test>::block_number();
        <System as OnFinalize<u64>>::on_finalize(block_number);
        block_number += 1;
        System::set_block_number(block_number);
        <System as OnInitialize<u64>>::on_initialize(block_number);
    });

    result
}
