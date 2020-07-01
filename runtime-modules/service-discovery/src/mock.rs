#![cfg(test)]

pub use crate::*;

pub use primitives::{Blake2Hasher, H256};
pub use sr_primitives::{
    testing::{Digest, DigestItem, Header, UintAuthorityId},
    traits::{BlakeTwo256, IdentityLookup, OnFinalize},
    BuildStorage, Perbill,
};

use srml_support::{impl_outer_event, impl_outer_origin, parameter_types};

// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;

mod working_group_mod {
    pub use super::StorageWorkingGroupInstance;
    pub use working_group::Event;
    pub use working_group::Trait;
}

mod membership_mod {
    pub use membership::members::Event;
}

mod discovery {
    pub use crate::Event;
}

impl_outer_origin! {
    pub enum Origin for Test {}
}

impl_outer_event! {
    pub enum MetaEvent for Test {
        discovery<T>,
        balances<T>,
        membership_mod<T>,
         working_group_mod StorageWorkingGroupInstance <T>,
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
    pub const InitialMembersBalance: u64 = 2000;
    pub const StakePoolId: [u8; 8] = *b"joystake";
    pub const ExistentialDeposit: u32 = 0;
    pub const TransferFee: u32 = 0;
    pub const CreationFee: u32 = 0;
}

impl system::Trait for Test {
    type Origin = Origin;
    type Index = u64;
    type BlockNumber = u64;
    type Call = ();
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = MetaEvent;
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
}

impl Trait for Test {
    type Event = MetaEvent;
}

parameter_types! {
    pub const MinimumStakeBalance: u64 = 1; // just non-zero
}

impl hiring::Trait for Test {
    type OpeningId = u64;
    type ApplicationId = u64;
    type ApplicationDeactivatedHandler = ();
    type StakeHandlerProvider = hiring::Module<Self>;
    type MinimumStakeBalance = MinimumStakeBalance;
}

impl minting::Trait for Test {
    type Currency = Balances;
    type MintId = u64;
}

impl stake::Trait for Test {
    type Currency = Balances;
    type StakePoolId = StakePoolId;
    type StakingEventsHandler = ();
    type StakeId = u64;
    type SlashId = u64;
}

impl membership::members::Trait for Test {
    type Event = MetaEvent;
    type MemberId = u64;
    type PaidTermId = u64;
    type SubscriptionId = u64;
    type ActorId = u64;
    type InitialMembersBalance = InitialMembersBalance;
}

impl common::currency::GovernanceCurrency for Test {
    type Currency = Balances;
}

impl balances::Trait for Test {
    type Balance = u64;
    type OnFreeBalanceZero = ();
    type OnNewAccount = ();
    type TransferPayment = ();
    type DustRemoval = ();
    type Event = MetaEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type TransferFee = TransferFee;
    type CreationFee = CreationFee;
}

impl recurringrewards::Trait for Test {
    type PayoutStatusHandler = ();
    type RecipientId = u64;
    type RewardRelationshipId = u64;
}

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 3;
}

impl working_group::Trait<StorageWorkingGroupInstance> for Test {
    type Event = MetaEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
}

impl timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
}

pub fn initial_test_ext() -> runtime_io::TestExternalities {
    let t = system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

pub type Balances = balances::Module<Test>;
pub type System = system::Module<Test>;
pub type Discovery = Module<Test>;

pub(crate) fn hire_storage_provider() -> (u64, u64) {
    let storage_provider_id = 1;
    let role_account_id = 1;

    let storage_provider = working_group::Worker {
        member_id: 1,
        role_account_id,
        reward_relationship: None,
        role_stake_profile: None,
    };

    <working_group::WorkerById<Test, StorageWorkingGroupInstance>>::insert(
        storage_provider_id,
        storage_provider,
    );

    (role_account_id, storage_provider_id)
}
