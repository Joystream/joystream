#![cfg(test)]

pub use primitives::{Blake2Hasher, H256};
pub use runtime_primitives::{
    testing::{Digest, DigestItem, Header, UintAuthorityId},
    traits::{BlakeTwo256, Convert, IdentityLookup, OnFinalize},
    weights::Weight,
    BuildStorage, Perbill,
};
use srml_support::{impl_outer_dispatch, impl_outer_event, impl_outer_origin, parameter_types};
pub use system;

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;

impl_outer_origin! {
    pub enum Origin for Test {}
}

impl_outer_dispatch! {
    pub enum Call for Test where origin: Origin {
        proposals::ProposalsEngine,
    }
}

mod engine {
    pub use crate::Event;
}

impl_outer_event! {
    pub enum TestEvent for Test {
        balances<T>,
        engine<T>,
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

impl stake::Trait for Test {
    type Currency = Balances;
    type StakePoolId = StakePoolId;
    type StakingEventsHandler = ();
    type StakeId = u64;
    type SlashId = u64;
}

impl crate::Trait for Test {
    type Event = TestEvent;

    type ProposalOrigin = system::EnsureSigned<Self::AccountId>;

    type VoteOrigin = system::EnsureSigned<Self::AccountId>;

    type TotalVotersCounter = ();

    type ProposalCodeDecoder = ProposalType;

    type ProposalId = u32;

    type ProposerId = u64;

    type VoterId = u64;
}

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

// TODO add a Hook type to capture TriggerElection and CouncilElected hooks

pub fn initial_test_ext() -> runtime_io::TestExternalities {
    let t = system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

pub type ProposalsEngine = crate::Module<Test>;
pub type System = system::Module<Test>;
pub type Balances = balances::Module<Test>;

use codec::{Decode, Encode};
use num_enum::{IntoPrimitive, TryFromPrimitive};
use rstd::convert::TryFrom;
use rstd::prelude::*;

use srml_support::dispatch;

use crate::{ProposalCodeDecoder, ProposalExecutable};

/// Defines allowed proposals types. Integer value serves as proposal_type_id.
#[derive(Debug, Eq, PartialEq, TryFromPrimitive, IntoPrimitive)]
#[repr(u32)]
pub enum ProposalType {
    /// Dummy(Text) proposal type
    Dummy = 1,

    /// Testing proposal type for faults
    Faulty = 10001,
}

impl ProposalType {
    fn compose_executable(
        &self,
        proposal_data: Vec<u8>,
    ) -> Result<Box<dyn ProposalExecutable>, &'static str> {
        match self {
            ProposalType::Dummy => DummyExecutable::decode(&mut &proposal_data[..])
                .map_err(|err| err.what())
                .map(|obj| Box::new(obj) as Box<dyn ProposalExecutable>),
            ProposalType::Faulty => FaultyExecutable::decode(&mut &proposal_data[..])
                .map_err(|err| err.what())
                .map(|obj| Box::new(obj) as Box<dyn ProposalExecutable>),
        }
    }
}

impl ProposalCodeDecoder<Test> for ProposalType {
    fn decode_proposal(
        proposal_type: u32,
        proposal_code: Vec<u8>,
    ) -> Result<Box<dyn ProposalExecutable>, &'static str> {
        Self::try_from(proposal_type)
            .map_err(|_| "Unsupported proposal type")?
            .compose_executable(proposal_code)
    }
}

/// Testing proposal type
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default)]
pub struct DummyExecutable {
    pub title: Vec<u8>,
    pub body: Vec<u8>,
}

impl DummyExecutable {
    pub fn proposal_type(&self) -> u32 {
        ProposalType::Dummy.into()
    }
}

impl ProposalExecutable for DummyExecutable {
    fn execute(&self) -> dispatch::Result {
        Ok(())
    }
}

/// Faulty proposal executable code wrapper. Used for failed proposal execution tests.
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default)]
pub struct FaultyExecutable;
impl ProposalExecutable for FaultyExecutable {
    fn execute(&self) -> dispatch::Result {
        Err("Failed")
    }
}

impl FaultyExecutable {
    /// Converts faulty proposal type to proposal_type_id
    pub fn proposal_type(&self) -> u32 {
        ProposalType::Faulty.into()
    }
}
