#![cfg(test)]

pub use crate::{GenesisConfig, Trait};

pub use frame_support::traits::{Currency, LockIdentifier};
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types};

pub use frame_system;
use frame_system::RawOrigin;
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    DispatchError, DispatchResult, Perbill,
};

pub(crate) type MembershipWorkingGroupInstance = working_group::Instance4;

impl_outer_origin! {
    pub enum Origin for Test {}
}

mod membership_mod {
    pub use crate::Event;
}

impl_outer_event! {
    pub enum TestEvent for Test {
        membership_mod<T>,
        frame_system<T>,
        balances<T>,
        working_group Instance4 <T>,
    }
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;
parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
}

impl frame_system::Trait for Test {
    type BaseCallFilter = ();
    type Origin = Origin;
    type Call = ();
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = TestEvent;
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type DbWeight = ();
    type BlockExecutionWeight = ();
    type ExtrinsicBaseWeight = ();
    type MaximumExtrinsicWeight = ();
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
    type PalletInfo = ();
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type SystemWeightInfo = ();
}

impl pallet_timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
    pub const MembershipFee: u64 = 100;
}

impl balances::Trait for Test {
    type Balance = u64;
    type DustRemoval = ();
    type Event = TestEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = ();
    type MaxLocks = ();
}

impl common::Trait for Test {
    type MemberId = u64;
    type ActorId = u64;
}

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 3;
    pub const LockId: LockIdentifier = [9; 8];
    pub const DefaultMemberInvitesCount: u32 = 5;
}

impl working_group::Trait<MembershipWorkingGroupInstance> for Test {
    type Event = TestEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = staking_handler::StakingManager<Self, LockId>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = Weights;
}

// Weights info stub
pub struct Weights;
impl working_group::WeightInfo for Weights {
    fn on_initialize_leaving(_: u32) -> u64 {
        unimplemented!()
    }

    fn on_initialize_rewarding_with_missing_reward(_: u32) -> u64 {
        unimplemented!()
    }

    fn on_initialize_rewarding_with_missing_reward_cant_pay(_: u32) -> u64 {
        unimplemented!()
    }

    fn on_initialize_rewarding_without_missing_reward(_: u32) -> u64 {
        unimplemented!()
    }

    fn apply_on_opening(_: u32) -> u64 {
        unimplemented!()
    }

    fn fill_opening_lead() -> u64 {
        unimplemented!()
    }

    fn fill_opening_worker(_: u32) -> u64 {
        unimplemented!()
    }

    fn update_role_account() -> u64 {
        unimplemented!()
    }

    fn cancel_opening() -> u64 {
        unimplemented!()
    }

    fn withdraw_application() -> u64 {
        unimplemented!()
    }

    fn slash_stake(_: u32) -> u64 {
        unimplemented!()
    }

    fn terminate_role_worker(_: u32) -> u64 {
        unimplemented!()
    }

    fn terminate_role_lead(_: u32) -> u64 {
        unimplemented!()
    }

    fn increase_stake() -> u64 {
        unimplemented!()
    }

    fn decrease_stake() -> u64 {
        unimplemented!()
    }

    fn spend_from_budget() -> u64 {
        unimplemented!()
    }

    fn update_reward_amount() -> u64 {
        unimplemented!()
    }

    fn set_status_text(_: u32) -> u64 {
        unimplemented!()
    }

    fn update_reward_account() -> u64 {
        unimplemented!()
    }

    fn set_budget() -> u64 {
        unimplemented!()
    }

    fn add_opening(_: u32) -> u64 {
        unimplemented!()
    }

    fn leave_role_immediatly() -> u64 {
        unimplemented!()
    }

    fn leave_role_later() -> u64 {
        unimplemented!()
    }
}

impl common::origin::ActorOriginValidator<Origin, u64, u64> for () {
    fn ensure_actor_origin(origin: Origin, _: u64) -> Result<u64, &'static str> {
        let account_id = frame_system::ensure_signed(origin)?;

        Ok(account_id)
    }
}

impl Trait for Test {
    type Event = TestEvent;
    type MembershipFee = MembershipFee;
    type WorkingGroup = ();
    type DefaultMemberInvitesCount = DefaultMemberInvitesCount;
}

impl common::working_group::WorkingGroupIntegration<Test> for () {
    fn ensure_worker_origin(
        origin: <Test as frame_system::Trait>::Origin,
        worker_id: &<Test as common::Trait>::ActorId,
    ) -> DispatchResult {
        let raw_origin: Result<RawOrigin<u64>, <Test as frame_system::Trait>::Origin> =
            origin.into();

        if let RawOrigin::Signed(_) = raw_origin.unwrap() {
            if *worker_id == 1 {
                Ok(())
            } else {
                Err(working_group::Error::<Test, MembershipWorkingGroupInstance>::WorkerDoesNotExist.into())
            }
        } else {
            Err(DispatchError::BadOrigin)
        }
    }
}

pub struct TestExternalitiesBuilder<T: Trait> {
    system_config: Option<frame_system::GenesisConfig>,
    membership_config: Option<GenesisConfig<T>>,
}

impl<T: Trait> Default for TestExternalitiesBuilder<T> {
    fn default() -> Self {
        Self {
            system_config: None,
            membership_config: None,
        }
    }
}

impl<T: Trait> TestExternalitiesBuilder<T> {
    pub fn set_membership_config(mut self, membership_config: GenesisConfig<T>) -> Self {
        self.membership_config = Some(membership_config);
        self
    }
    pub fn build(self) -> sp_io::TestExternalities {
        // Add system
        let mut t = self
            .system_config
            .unwrap_or(frame_system::GenesisConfig::default())
            .build_storage::<T>()
            .unwrap();

        // Add membership
        self.membership_config
            .unwrap_or(GenesisConfig::default())
            .assimilate_storage(&mut t)
            .unwrap();

        t.into()
    }
}

pub fn build_test_externalities() -> sp_io::TestExternalities {
    TestExternalitiesBuilder::<Test>::default().build()
}

pub fn build_test_externalities_with_initial_members(
    initial_members: Vec<(u64, u64)>,
) -> sp_io::TestExternalities {
    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(
            crate::genesis::GenesisConfigBuilder::default()
                .members(initial_members)
                .build(),
        )
        .build()
}

pub type Balances = balances::Module<Test>;
pub type Membership = crate::Module<Test>;
pub type System = frame_system::Module<Test>;
