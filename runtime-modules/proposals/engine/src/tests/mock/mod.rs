//! Mock runtime for the module testing.
//!
//! Submodules:
//! - proposals: provides types for proposal execution tests
//!

#![cfg(test)]

use frame_support::traits::LockIdentifier;
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types, weights::Weight};
pub use frame_system;
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};

pub(crate) mod proposals;

use crate::ProposalObserver;
pub use proposals::*;

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
    pub use membership::Event;
}

mod council {
    pub use governance::council::Event;
}

impl_outer_event! {
    pub enum TestEvent for Test {
        balances<T>,
        engine<T>,
        membership_mod<T>,
        frame_system<T>,
        council<T>,
    }
}

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
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

impl common::currency::GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

impl proposals::Trait for Test {}

parameter_types! {
    pub const CancellationFee: u64 = 5;
    pub const RejectionFee: u64 = 3;
    pub const TitleMaxLength: u32 = 100;
    pub const DescriptionMaxLength: u32 = 10000;
    pub const MaxActiveProposalLimit: u32 = 100;
    pub const LockId: LockIdentifier = [1; 8];
}

impl membership::Trait for Test {
    type Event = TestEvent;
    type MemberId = u64;
    type PaidTermId = u64;
    type SubscriptionId = u64;
    type ActorId = u64;
}

impl crate::Trait for Test {
    type Event = TestEvent;
    type ProposerOriginValidator = ();
    type VoterOriginValidator = ();
    type TotalVotersCounter = ();
    type ProposalId = u32;
    type StakingHandler = staking_handler::StakingManager<Test, LockId>;
    type CancellationFee = CancellationFee;
    type RejectionFee = RejectionFee;
    type TitleMaxLength = TitleMaxLength;
    type DescriptionMaxLength = DescriptionMaxLength;
    type MaxActiveProposalLimit = MaxActiveProposalLimit;
    type DispatchableCallCode = proposals::Call<Test>;
    type ProposalObserver = ();
    type WeightInfo = ();
}

impl crate::WeightInfo for () {
    fn vote(_: u32) -> Weight {
        0
    }

    fn cancel_proposal(_: u32) -> Weight {
        0
    }

    fn veto_proposal() -> Weight {
        0
    }

    fn on_initialize_immediate_execution_decode_fails(_: u32) -> Weight {
        0
    }

    fn on_initialize_pending_execution_decode_fails(_: u32) -> Weight {
        0
    }

    fn on_initialize_approved_pending_constitutionality(_: u32) -> Weight {
        0
    }

    fn on_initialize_rejected(_: u32) -> Weight {
        0
    }

    fn on_initialize_slashed(_: u32) -> Weight {
        0
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

impl common::origin::ActorOriginValidator<Origin, u64, u64> for () {
    fn ensure_actor_origin(origin: Origin, _account_id: u64) -> Result<u64, &'static str> {
        let signed_account_id = frame_system::ensure_signed(origin)?;

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

impl governance::council::Trait for Test {
    type Event = TestEvent;
    type CouncilTermEnded = ();
}

impl recurringrewards::Trait for Test {
    type PayoutStatusHandler = ();
    type RecipientId = u64;
    type RewardRelationshipId = u64;
}

impl minting::Trait for Test {
    type Currency = Balances;
    type MintId = u64;
}

pub fn initial_test_ext() -> sp_io::TestExternalities {
    let t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

pub type ProposalsEngine = crate::Module<Test>;
pub type System = frame_system::Module<Test>;
pub type Balances = balances::Module<Test>;
