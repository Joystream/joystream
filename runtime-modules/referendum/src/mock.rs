#![cfg(test)]

use crate::*;

use srml_support::{impl_outer_origin, parameter_types};
use primitives::H256;
use sr_primitives::{traits::{BlakeTwo256, IdentityLookup}, testing::{Header}, Perbill};
use runtime_io;

use crate::{GenesisConfig};

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Runtime;

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Instance0;

pub type TestModule = Module<Runtime, Instance0>;

impl_outer_origin! {
    pub enum Origin for Runtime {}
}

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
}

impl Instance for Instance0 {

}

//impl system::Trait for Runtime<Instance0> {
impl system::Trait for Runtime {
    type Origin = Origin;
    type Index = u64;
    type BlockNumber = u64;
    type Call = ();
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    // type WeightMultiplierUpdate = ();
    type Event = ();
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
}

impl<I: Instance> Trait<I> for Runtime {
    type Event = Event<Self, I>;
}

/*
impl timestamp::Trait for Runtime {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
}

impl Trait for Runtime {
    type Event = ();
    type MembershipRegistry = registry::TestMembershipRegistryModule;
    type ThreadId = u64;
    type PostId = u64;
}
*/

#[derive(Clone)]
//pub enum OriginType<I: Instance> {
pub enum OriginType {
    Signed(<Runtime as system::Trait>::AccountId),
    //Inherent, <== did not find how to make such an origin yet
    Root,
}

pub fn mock_start_referendum(
    origin: OriginType,
    expected_result: dispatch::Result,
) {
    assert_eq!(
        //TestModule::start_referendum(
        TestModule::finish_voting(
            origin.clone(),
        ),
        expected_result,
    )
}

pub fn default_genesis_config() -> GenesisConfig<Runtime, Instance0> {
    GenesisConfig::<Runtime> {
        Stage: ReferendumStage::Void,
    }
}

pub fn build_test_externalities(config: GenesisConfig<Runtime, Instance0>) -> runtime_io::TestExternalities {
    let t = system::GenesisConfig::default()
        .build_storage::<Runtime>()
        .unwrap();

    t.into()
}
