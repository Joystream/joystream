use frame_support::traits::{
    Currency, LockIdentifier, LockableCurrency, OnFinalize, OnInitialize, WithdrawReasons,
};
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types};
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    DispatchError, Perbill,
};
use system;

use crate::{BalanceOfCurrency, Module, StakingHandler, Trait};
use common::currency::GovernanceCurrency;
use frame_support::dispatch::DispatchResult;

impl_outer_origin! {
    pub enum Origin for Test {}
}

mod working_team {
    pub use super::TestWorkingTeamInstance;
    pub use crate::Event;
}

mod membership_mod {
    pub use membership::Event;
}

impl_outer_event! {
    pub enum TestEvent for Test {
        balances<T>,
        working_team TestWorkingTeamInstance <T>,
        membership_mod<T>,
        system<T>,
    }
}

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
    pub const StakePoolId: [u8; 8] = *b"joystake";
    pub const ExistentialDeposit: u32 = 0;
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 - remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;

impl system::Trait for Test {
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
    type ModuleToIndex = ();
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
}

impl common::currency::GovernanceCurrency for Test {
    type Currency = Balances;
}

impl pallet_timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
}

impl balances::Trait for Test {
    type Balance = u64;
    type DustRemoval = ();
    type Event = TestEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
}

impl membership::Trait for Test {
    type Event = TestEvent;
    type MemberId = u64;
    type PaidTermId = u64;
    type SubscriptionId = u64;
    type ActorId = u64;
}

pub type Membership = membership::Module<Test>;
pub type Balances = balances::Module<Test>;
pub type System = system::Module<Test>;

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 3;
    pub const LockId: [u8; 8] = [1; 8];
}

impl Trait<TestWorkingTeamInstance> for Test {
    type OpeningId = u64;
    type ApplicationId = u64;
    type Event = TestEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = Test;
    type LockId = LockId;
}

pub type TestWorkingTeamInstance = crate::Instance1;
pub type TestWorkingTeam = Module<Test, TestWorkingTeamInstance>;

pub const STAKING_ACCOUNT_ID_FOR_FAILED_EXTERNAL_CHECK: u64 = 111;
impl StakingHandler<Test> for Test {
    fn lock(
        lock_id: LockIdentifier,
        account_id: &<Test as system::Trait>::AccountId,
        amount: BalanceOfCurrency<Test>,
    ) {
        <Test as GovernanceCurrency>::Currency::set_lock(
            lock_id,
            &account_id,
            amount,
            WithdrawReasons::all(),
        )
    }

    fn unlock(lock_id: LockIdentifier, account_id: &<Test as system::Trait>::AccountId) {
        <Test as GovernanceCurrency>::Currency::remove_lock(lock_id, &account_id);
    }

    fn ensure_can_make_stake(
        account_id: &<Test as system::Trait>::AccountId,
        _stake: &BalanceOfCurrency<Test>,
    ) -> DispatchResult {
        if *account_id == STAKING_ACCOUNT_ID_FOR_FAILED_EXTERNAL_CHECK {
            return Err(DispatchError::Other("External check failed"));
        }
        Ok(())
    }

    fn slash(
        lock_id: LockIdentifier,
        account_id: &<Test as system::Trait>::AccountId,
        amount: Option<BalanceOfCurrency<Test>>,
    ) {
        let locks = Balances::locks(&account_id);

        let existing_lock = locks.iter().find(|lock| lock.id == lock_id);

        if let Some(existing_lock) = existing_lock {
            Self::unlock(lock_id, &account_id);

            let mut slashable_amount = existing_lock.amount;
            if let Some(amount) = amount {
                if existing_lock.amount > amount {
                    let new_amount = existing_lock.amount - amount;
                    Self::lock(lock_id, &account_id, new_amount);

                    slashable_amount = amount;
                }
            }

            let _ = Balances::slash(&account_id, slashable_amount);
        }
    }
}

pub fn build_test_externalities() -> sp_io::TestExternalities {
    let t = system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <TestWorkingTeam as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <TestWorkingTeam as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}
