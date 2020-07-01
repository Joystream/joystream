#![cfg(test)]

pub use crate::*; // {self, Module, Trait, GenesisConfig};
pub use srml_support::traits::Currency;
pub use system;

pub use primitives::{map, Blake2Hasher, H256};
pub use sr_primitives::{
    testing::{Digest, DigestItem, Header, UintAuthorityId},
    traits::{BlakeTwo256, Convert, IdentityLookup, OnFinalize},
    weights::Weight,
    BuildStorage, Perbill,
};

use srml_support::{impl_outer_event, impl_outer_origin, parameter_types};

pub use common::currency::GovernanceCurrency;
pub use hiring;
pub use membership::members;
pub use minting;
pub use recurringrewards;
pub use stake;
pub use versioned_store;
pub use versioned_store_permissions;

use crate::genesis;

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
    pub const ExistentialDeposit: u32 = 0;
    pub const TransferFee: u32 = 0;
    pub const CreationFee: u32 = 0;
    pub const TransactionBaseFee: u32 = 1;
    pub const TransactionByteFee: u32 = 0;
    pub const InitialMembersBalance: u64 = 2000;
    pub const StakePoolId: [u8; 8] = *b"joystake";
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;

impl_outer_origin! {
    pub enum Origin for Test {}
}

mod lib {
    pub use crate::Event;
}

impl_outer_event! {
    pub enum TestEvent for Test {
        versioned_store<T>,
        members<T>,
        balances<T>,
        lib<T>,
    }
}

pub type RawLibTestEvent = RawEvent<
    ChannelId<Test>,
    LeadId<Test>,
    CuratorOpeningId<Test>,
    CuratorApplicationId<Test>,
    CuratorId<Test>,
    CuratorApplicationIdToCuratorIdMap<Test>,
    minting::BalanceOf<Test>,
    <Test as system::Trait>::AccountId,
    <Test as minting::Trait>::MintId,
>;

pub fn get_last_event_or_panic() -> RawLibTestEvent {
    if let TestEvent::lib(ref x) = System::events().last().unwrap().event {
        x.clone()
    } else {
        panic!("No event deposited.");
    }
}

type TestAccountId = u64;
type TestBlockNumber = u64;
impl system::Trait for Test {
    type Origin = Origin;
    type Index = u64;
    type BlockNumber = TestBlockNumber;
    type Call = ();
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = TestAccountId;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = TestEvent;
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
}

impl timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
}

impl balances::Trait for Test {
    /// The type for recording an account's balance.
    type Balance = u64;
    /// What to do if an account's free balance gets zeroed.
    type OnFreeBalanceZero = ();
    /// What to do if a new account is created.
    type OnNewAccount = ();
    /// The ubiquitous event type.
    type Event = TestEvent;

    type DustRemoval = ();
    type TransferPayment = ();
    type ExistentialDeposit = ExistentialDeposit;
    type TransferFee = TransferFee;
    type CreationFee = CreationFee;
}

/*
pub trait PrincipalIdChecker<T: Trait> {
    fn account_can_act_as_principal(account: &T::AccountId, group: T::PrincipalId) -> bool;
}

pub trait CreateClassPermissionsChecker<T: Trait> {
    fn account_can_create_class_permissions(account: &T::AccountId) -> bool;
}
*/

impl GovernanceCurrency for Test {
    type Currency = Balances;
}

type TestMintId = u64;
impl minting::Trait for Test {
    type Currency = Balances;
    type MintId = TestMintId;
}

type TestRecipientId = u64;
type TestRewardRelationshipId = u64;
impl recurringrewards::Trait for Test {
    type PayoutStatusHandler = ();
    type RecipientId = TestRecipientId;
    type RewardRelationshipId = TestRewardRelationshipId;
}

type TestStakeId = u64;
type TestSlashId = u64;
impl stake::Trait for Test {
    type Currency = Balances;
    type StakePoolId = StakePoolId;
    type StakingEventsHandler = ();
    type StakeId = TestStakeId;
    type SlashId = TestSlashId;
}

parameter_types! {
    pub const MinimumStakeBalance: u64 = 1; // just non-zero
}
type TestOpeningId = u64;
type TestApplicationId = u64;
impl hiring::Trait for Test {
    type OpeningId = TestOpeningId;
    type ApplicationId = TestApplicationId;
    type ApplicationDeactivatedHandler = ();
    type StakeHandlerProvider = hiring::Module<Self>;
    type MinimumStakeBalance = MinimumStakeBalance;
}

impl versioned_store::Trait for Test {
    type Event = TestEvent;
}

type TestPrincipalId = u64;
impl versioned_store_permissions::Trait for Test {
    type Credential = TestPrincipalId;
    type CredentialChecker = ();
    type CreateClassPermissionsChecker = ();
}

type TestMemberId = u64;
impl members::Trait for Test {
    type Event = TestEvent;
    type MemberId = TestMemberId;
    type PaidTermId = u64;
    type SubscriptionId = u64;
    type ActorId = u64;
    type InitialMembersBalance = InitialMembersBalance;
}

impl Trait for Test {
    type Event = TestEvent;
}

pub struct TestExternalitiesBuilder<T: Trait> {
    system_config: Option<system::GenesisConfig>,
    membership_config: Option<members::GenesisConfig<T>>,
    content_wg_config: Option<GenesisConfig<T>>,
}

impl<T: Trait> Default for TestExternalitiesBuilder<T> {
    fn default() -> Self {
        Self {
            system_config: None,
            membership_config: None,
            content_wg_config: None,
        }
    }
}

impl<T: Trait> TestExternalitiesBuilder<T> {
    /*
    pub fn set_system_config(mut self, system_config: system::GenesisConfig) -> Self {
        self.system_config = Some(system_config);
        self
    }
    pub fn set_membership_config(mut self, membership_config: members::GenesisConfig<T>) -> Self {
        self.membership_config = Some(membership_config);
        self
    }
    */

    pub fn with_content_wg_config(mut self, conteng_wg_config: GenesisConfig<T>) -> Self {
        self.content_wg_config = Some(conteng_wg_config);
        self
    }

    pub fn build(self) -> runtime_io::TestExternalities {
        // Add system
        let mut t = self
            .system_config
            .unwrap_or(system::GenesisConfig::default())
            .build_storage::<T>()
            .unwrap();

        // Add membership
        self.membership_config
            .unwrap_or(members::GenesisConfig::default())
            .assimilate_storage(&mut t)
            .unwrap();

        // Add content wg

        if self.content_wg_config.is_none() {
            genesis::GenesisConfigBuilder::<Test>::default()
                .build()
                .assimilate_storage(&mut t)
                .unwrap();
        } else {
            self.content_wg_config
                .unwrap()
                .assimilate_storage(&mut t)
                .unwrap();
        }

        t.into()
    }
}

pub type System = system::Module<Test>;
pub type Balances = balances::Module<Test>;
pub type ContentWorkingGroup = Module<Test>;
pub type Minting = minting::Module<Test>;
