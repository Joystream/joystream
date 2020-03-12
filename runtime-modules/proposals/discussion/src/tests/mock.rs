#![cfg(test)]

pub use system;

pub use primitives::{Blake2Hasher, H256};
pub use runtime_primitives::{
    testing::{Digest, DigestItem, Header, UintAuthorityId},
    traits::{BlakeTwo256, Convert, IdentityLookup, OnFinalize},
    weights::Weight,
    BuildStorage, Perbill,
};

use crate::ActorOriginValidator;
use srml_support::{impl_outer_event, impl_outer_origin, parameter_types};

impl_outer_origin! {
    pub enum Origin for Test {}
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
    pub const StakePoolId: [u8; 8] = *b"joystake";
}

parameter_types! {
    pub const MaxPostEditionNumber: u32 = 5;
    pub const MaxThreadInARowNumber: u32 = 3;
    pub const ThreadTitleLengthLimit: u32 = 200;
    pub const PostLengthLimit: u32 = 2000;
}

mod discussion {
    pub use crate::Event;
}

mod membership_mod {
    pub use membership::members::Event;
}

impl_outer_event! {
    pub enum TestEvent for Test {
        discussion<T>,
        balances<T>,
        membership_mod<T>,
    }
}

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
    pub const TransferFee: u32 = 0;
    pub const CreationFee: u32 = 0;
}

impl balances::Trait for Test {
    /// The type for recording an account's balance.
    type Balance = u64;
    /// What to do if an account's free balance gets zeroed.
    type OnFreeBalanceZero = ();
    /// What to do if a new account is created.
    type OnNewAccount = ();

    type Event = TestEvent;

    type DustRemoval = ();
    type TransferPayment = ();
    type ExistentialDeposit = ExistentialDeposit;
    type TransferFee = TransferFee;
    type CreationFee = CreationFee;
}

impl common::currency::GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

impl membership::members::Trait for Test {
    type Event = TestEvent;
    type MemberId = u64;
    type PaidTermId = u64;
    type SubscriptionId = u64;
    type ActorId = u64;
    type InitialMembersBalance = ();
}

impl crate::Trait for Test {
    type Event = TestEvent;
    type ThreadAuthorOriginValidator = ();
    type PostAuthorOriginValidator = ();
    type ThreadId = u32;
    type PostId = u32;
    type PostAuthorId = u64;
    type MaxPostEditionNumber = MaxPostEditionNumber;
    type ThreadTitleLengthLimit = ThreadTitleLengthLimit;
    type PostLengthLimit = PostLengthLimit;
    type MaxThreadInARowNumber = MaxThreadInARowNumber;
}

impl ActorOriginValidator<Origin, u64> for () {
    fn validate_actor_origin(origin: Origin, actor_id: u64) -> bool {
        if system::ensure_none(origin).is_ok() {
            return true;
        }

        actor_id == 1
    }
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

pub fn initial_test_ext() -> runtime_io::TestExternalities {
    let t = system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

pub type Discussions = crate::Module<Test>;
pub type System = system::Module<Test>;
