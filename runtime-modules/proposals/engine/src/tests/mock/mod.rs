//! Mock runtime for the module testing.
//!
//! Submodules:
//! - stakes: contains support for mocking external 'stake' module
//! - balance_restorator: restores balances after unstaking
//! - proposals: provides types for proposal execution tests
//!

#![cfg(test)]
pub use primitives::{Blake2Hasher, H256};
pub use sr_primitives::{
    testing::{Digest, DigestItem, Header, UintAuthorityId},
    traits::{BlakeTwo256, Convert, IdentityLookup, OnFinalize, Zero},
    weights::Weight,
    BuildStorage, DispatchError, Perbill,
};
use srml_support::{impl_outer_event, impl_outer_origin, parameter_types};
pub use system;

mod balance_manager;
pub(crate) mod proposals;
mod stakes;

use balance_manager::*;
pub use proposals::*;
pub use stakes::*;

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;

impl_outer_origin! {
    pub enum Origin for Test {}
}

mod engine {
    pub use crate::Event;
}

mod membership_mod {
    pub use membership::members::Event;
}

mod council_mod {
    pub use governance::council::Event;
}

// impl_outer_dispatch! {
//     pub enum Call for Test where origin: Origin {
//         engine::ProposalsEngine,
//     }
// }

impl_outer_event! {
    pub enum TestEvent for Test {
        balances<T>,
        engine<T>,
        membership_mod<T>,
        council_mod<T>,
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

    type TransferPayment = ();

    type DustRemoval = ();
    type Event = TestEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type TransferFee = TransferFee;
    type CreationFee = CreationFee;
}

impl common::currency::GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

impl governance::council::Trait for Test {
    type Event = TestEvent;
    type CouncilTermEnded = ();
}

impl proposals::Trait for Test {}

impl stake::Trait for Test {
    type Currency = Balances;
    type StakePoolId = StakePoolId;
    type StakingEventsHandler = BalanceManagerStakingEventsHandler;
    type StakeId = u64;
    type SlashId = u64;
}

parameter_types! {
    pub const CancellationFee: u64 = 5;
    pub const RejectionFee: u64 = 3;
    pub const TitleMaxLength: u32 = 100;
    pub const DescriptionMaxLength: u32 = 10000;
    pub const MaxActiveProposalLimit: u32 = 100;
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
    type ProposerOriginValidator = ();
    type VoterOriginValidator = ();
    type TotalVotersCounter = ();
    type ProposalId = u32;
    type StakeHandlerProvider = stakes::TestStakeHandlerProvider;
    type CancellationFee = CancellationFee;
    type RejectionFee = RejectionFee;
    type TitleMaxLength = TitleMaxLength;
    type DescriptionMaxLength = DescriptionMaxLength;
    type MaxActiveProposalLimit = MaxActiveProposalLimit;
    type ProposalCode = proposals::Call<Test>;
}

impl Default for proposals::Call<Test> {
    fn default() -> Self {
        panic!("shouldn't call default for Call");
    }
}

impl common::origin_validator::ActorOriginValidator<Origin, u64, u64> for () {
    fn ensure_actor_origin(origin: Origin, _account_id: u64) -> Result<u64, &'static str> {
        let signed_account_id = system::ensure_signed(origin)?;

        Ok(signed_account_id)
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
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
    pub const StakePoolId: [u8; 8] = *b"joystake";
}

impl system::Trait for Test {
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

pub type ProposalsEngine = crate::Module<Test>;
pub type System = system::Module<Test>;
pub type Balances = balances::Module<Test>;
