//! The Joystream Substrate Node runtime.

#![cfg_attr(not(feature = "std"), no_std)]
// `construct_runtime!` does a lot of recursion and requires us to increase the limit to 256.
#![recursion_limit = "256"]
//Substrate internal issues.
#![allow(clippy::large_enum_variant)]
#![allow(clippy::unnecessary_mut_passed)]
#![allow(non_fmt_panics)]
#![allow(clippy::from_over_into)]

// Mutually exclusive feature check
#[cfg(all(feature = "staging_runtime", feature = "testing_runtime"))]
compile_error!("feature \"staging_runtime\" and feature \"testing_runtime\" cannot be enabled at the same time");

// Make the WASM binary available.
// This is required only by the node build.
// A dummy wasm_binary.rs will be built for the IDE.
#[cfg(feature = "std")]
include!(concat!(env!("OUT_DIR"), "/wasm_binary.rs"));

/// Wasm binary unwrapped. If built with `SKIP_WASM_BUILD`, the function panics.
#[cfg(feature = "std")]
pub fn wasm_binary_unwrap() -> &'static [u8] {
    WASM_BINARY.expect(
        "Development wasm binary is not available. This means the client is built with \
		 `SKIP_WASM_BUILD` flag and it is only usable for production chains. Please rebuild with \
		 the flag disabled.",
    )
}

pub mod constants;
mod integration;
pub mod primitives;
mod proposals_configuration;
mod runtime_api;
mod tests;
/// Generated voter bag information.
mod voter_bags;
/// Weights for pallets used in the runtime.
mod weights;

#[macro_use]
extern crate lazy_static; // for proposals_configuration module

use codec::Decode;
use frame_election_provider_support::{
    onchain, ElectionDataProvider, ExtendedBalance, SequentialPhragmen, VoteWeight,
};
use frame_support::pallet_prelude::Get;
use frame_support::traits::{
    ConstU16, ConstU32, Contains, Currency, EnsureOneOf, Imbalance, KeyOwnerProofSystem,
    LockIdentifier, OnUnbalanced,
};
use frame_support::weights::{
    constants::{BlockExecutionWeight, ExtrinsicBaseWeight, RocksDbWeight, WEIGHT_PER_SECOND},
    ConstantMultiplier, DispatchClass, Weight,
};

use frame_support::{construct_runtime, parameter_types, PalletId};
use frame_system::limits::{BlockLength, BlockWeights};
use frame_system::{EnsureRoot, EnsureSigned};
use pallet_grandpa::{AuthorityId as GrandpaId, AuthorityList as GrandpaAuthorityList};
use pallet_im_online::sr25519::AuthorityId as ImOnlineId;
use pallet_session::historical as pallet_session_historical;
use pallet_transaction_payment::CurrencyAdapter;
use sp_authority_discovery::AuthorityId as AuthorityDiscoveryId;
use sp_core::crypto::KeyTypeId;
use sp_core::Hasher;

use sp_runtime::{
    create_runtime_str,
    curve::PiecewiseLinear,
    generic, impl_opaque_keys,
    traits::{BlakeTwo256, ConvertInto, IdentityLookup, OpaqueKeys},
    Perbill,
};

use sp_std::boxed::Box;
use sp_std::convert::{TryFrom, TryInto};
use sp_std::{vec, vec::Vec};

#[cfg(feature = "runtime-benchmarks")]
#[macro_use]
extern crate frame_benchmarking;

#[cfg(feature = "std")]
use sp_version::NativeVersion;
use sp_version::RuntimeVersion;
use static_assertions::const_assert;

#[cfg(any(feature = "std", test))]
pub use frame_system::Call as SystemCall;
#[cfg(any(feature = "std", test))]
pub use pallet_balances::Call as BalancesCall;
pub use pallet_staking::StakerStatus;
#[cfg(any(feature = "std", test))]
pub use pallet_sudo::Call as SudoCall;
#[cfg(any(feature = "std", test))]
pub use sp_runtime::BuildStorage;

use constants::*;
pub use primitives::*;
pub use proposals_configuration::*;
pub use runtime_api::*;

use integration::proposals::{CouncilManager, ExtrinsicProposalEncoder};

use common::working_group::{WorkingGroup, WorkingGroupBudgetHandler};
use council::ReferendumConnection;
use referendum::{CastVote, OptionResult};
use staking_handler::{LockComparator, StakingManager};

// Node dependencies
pub use common;
pub use council;
pub use forum;
pub use membership;

pub use proposals_engine::ProposalParameters;
pub use referendum;
pub use working_group;

pub use content;
pub use content::LimitPerPeriod;
pub use content::MaxNumber;

/// This runtime version.
pub const VERSION: RuntimeVersion = RuntimeVersion {
    spec_name: create_runtime_str!("joystream-node"),
    impl_name: create_runtime_str!("joystream-node"),
    authoring_version: 11,
    spec_version: 0,
    impl_version: 0,
    apis: crate::runtime_api::EXPORTED_RUNTIME_API_VERSIONS,
    transaction_version: 1,
    state_version: 1,
};

/// The version information used to identify this runtime when compiled natively.
#[cfg(feature = "std")]
pub fn native_version() -> NativeVersion {
    NativeVersion {
        runtime_version: VERSION,
        can_author_with: Default::default(),
    }
}

/// The BABE epoch configuration at genesis.
pub const BABE_GENESIS_EPOCH_CONFIG: sp_consensus_babe::BabeEpochConfiguration =
    sp_consensus_babe::BabeEpochConfiguration {
        c: constants::PRIMARY_PROBABILITY,
        allowed_slots: sp_consensus_babe::AllowedSlots::PrimaryAndSecondaryPlainSlots,
    };

/// We assume that ~10% of the block weight is consumed by `on_initialize` handlers.
/// This is used to limit the maximal weight of a single extrinsic.
const AVERAGE_ON_INITIALIZE_RATIO: Perbill = Perbill::from_percent(10);
/// We allow `Normal` extrinsics to fill up the block up to 75%, the rest can be used
/// by  Operational  extrinsics.
const NORMAL_DISPATCH_RATIO: Perbill = Perbill::from_percent(75);
/// We allow for 2 seconds of compute with a 6 second average block time.
pub const MAXIMUM_BLOCK_WEIGHT: Weight = 2 * WEIGHT_PER_SECOND;

parameter_types! {
    pub const BlockHashCount: BlockNumber = 2400;
    pub const Version: RuntimeVersion = VERSION;
    pub RuntimeBlockLength: BlockLength =
        BlockLength::max_with_normal_ratio(5 * 1024 * 1024, NORMAL_DISPATCH_RATIO);
    pub RuntimeBlockWeights: BlockWeights = BlockWeights::builder()
        .base_block(BlockExecutionWeight::get())
        .for_class(DispatchClass::all(), |weights| {
            weights.base_extrinsic = ExtrinsicBaseWeight::get();
        })
        .for_class(DispatchClass::Normal, |weights| {
            weights.max_total = Some(NORMAL_DISPATCH_RATIO * MAXIMUM_BLOCK_WEIGHT);
        })
        .for_class(DispatchClass::Operational, |weights| {
            weights.max_total = Some(MAXIMUM_BLOCK_WEIGHT);
            // Operational transactions have some extra reserved space, so that they
            // are included even if block reached `MAXIMUM_BLOCK_WEIGHT`.
            weights.reserved = Some(
                MAXIMUM_BLOCK_WEIGHT - NORMAL_DISPATCH_RATIO * MAXIMUM_BLOCK_WEIGHT
            );
        })
        .avg_block_initialization(AVERAGE_ON_INITIALIZE_RATIO)
        .build_or_panic();
}

const_assert!(NORMAL_DISPATCH_RATIO.deconstruct() >= AVERAGE_ON_INITIALIZE_RATIO.deconstruct());

/// Our extrinsics call filter
pub enum CallFilter {}

/// Filter that disables all non-essential calls.
/// Allowing only calls for successful block authoring, staking, nominating.
/// Since balances calls are disabled, his means that stash and controller
/// accounts must already be funded. If this is not practical to setup at genesis
/// then consider enabling Balances calls?
/// This will be used at initial launch, and other calls will be enabled as we rollout.
#[cfg(not(any(
    feature = "staging_runtime",
    feature = "testing_runtime",
    feature = "runtime-benchmarks"
)))]
fn filter_non_essential(call: &<Runtime as frame_system::Config>::Call) -> bool {
    match call {
        Call::System(method) =>
        // All methods except the remark call
        {
            !matches!(method, frame_system::Call::<Runtime>::remark { .. })
        }
        // confirmed that Utility.batch dispatch does not bypass filter.
        Call::Utility(_) => true,
        Call::Babe(_) => true,
        Call::Timestamp(_) => true,
        Call::Authorship(_) => true,
        Call::ElectionProviderMultiPhase(_) => true,
        Call::Staking(_) => true,
        Call::Session(_) => true,
        Call::Grandpa(_) => true,
        Call::ImOnline(_) => true,
        Call::Sudo(_) => true,
        Call::BagsList(_) => true,
        // Disable all other calls
        _ => false,
    }
}

// TODO: this will change after https://github.com/Joystream/joystream/pull/3986 is merged
// Filter out a subset of calls on content pallet and some specific proposals
#[cfg(not(feature = "runtime-benchmarks"))]
fn filter_content_and_proposals(call: &<Runtime as frame_system::Config>::Call) -> bool {
    match call {
        // TODO: adjust after Carthage
        Call::Content(content::Call::<Runtime>::destroy_nft { .. }) => false,
        Call::Content(content::Call::<Runtime>::toggle_nft_limits { .. }) => false,
        Call::Content(content::Call::<Runtime>::update_curator_group_permissions { .. }) => false,
        Call::Content(content::Call::<Runtime>::update_channel_privilege_level { .. }) => false,
        Call::Content(content::Call::<Runtime>::update_channel_nft_limit { .. }) => false,
        Call::Content(content::Call::<Runtime>::update_global_nft_limit { .. }) => false,
        Call::Content(content::Call::<Runtime>::set_channel_paused_features_as_moderator {
            ..
        }) => false,
        Call::Content(content::Call::<Runtime>::initialize_channel_transfer { .. }) => false,
        Call::ProposalsCodex(proposals_codex::Call::<Runtime>::create_proposal {
            general_proposal_parameters: _,
            proposal_details,
        }) => !matches!(
            proposal_details,
            proposals_codex::ProposalDetails::UpdateChannelPayouts(..)
                | proposals_codex::ProposalDetails::UpdateGlobalNftLimit(..)
        ),
        _ => true, // Enable all other calls
    }
}

// Live Production config
#[cfg(not(any(
    feature = "staging_runtime",
    feature = "testing_runtime",
    feature = "runtime-benchmarks"
)))]
impl Contains<<Runtime as frame_system::Config>::Call> for CallFilter {
    fn contains(call: &<Runtime as frame_system::Config>::Call) -> bool {
        filter_non_essential(call) && filter_content_and_proposals(call)
    }
}

// Do not filter any calls when building benchmarks so we can benchmark everything
#[cfg(feature = "runtime-benchmarks")]
impl Contains<<Runtime as frame_system::Config>::Call> for CallFilter {
    fn contains(_call: &<Runtime as frame_system::Config>::Call) -> bool {
        true
    }
}

// Staging and Testing - filter joystream pallet calls only to test they are properly disabled
#[cfg(any(feature = "staging_runtime", feature = "testing_runtime"))]
impl Contains<<Runtime as frame_system::Config>::Call> for CallFilter {
    fn contains(call: &<Runtime as frame_system::Config>::Call) -> bool {
        filter_content_and_proposals(call)
    }
}

impl frame_system::Config for Runtime {
    type BaseCallFilter = CallFilter;
    type BlockWeights = RuntimeBlockWeights;
    type BlockLength = RuntimeBlockLength;
    type DbWeight = RocksDbWeight;
    type Origin = Origin;
    type Call = Call;
    type Index = Index;
    type BlockNumber = BlockNumber;
    type Hash = Hash;
    type Hashing = BlakeTwo256;
    type AccountId = AccountId;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = generic::Header<BlockNumber, BlakeTwo256>;
    type Event = Event;
    type BlockHashCount = BlockHashCount;
    type Version = Version;
    type PalletInfo = PalletInfo;
    type AccountData = pallet_balances::AccountData<Balance>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type SystemWeightInfo = weights::frame_system::SubstrateWeight<Runtime>;
    type SS58Prefix = ConstU16<JOY_ADDRESS_PREFIX>;
    type OnSetCode = ();
    type MaxConsumers = ConstU32<16>;
}

impl pallet_randomness_collective_flip::Config for Runtime {}

impl substrate_utility::Config for Runtime {
    type Event = Event;
    type Call = Call;
    type PalletsOrigin = OriginCaller;
    type WeightInfo = weights::substrate_utility::SubstrateWeight<Runtime>;
}

parameter_types! {
    // NOTE: Currently it is not possible to change the epoch duration after the chain has started.
    //       Attempting to do so will brick block production.
    pub const EpochDuration: u64 = EPOCH_DURATION_IN_SLOTS;
    pub const ExpectedBlockTime: Moment = MILLISECS_PER_BLOCK;
    pub const ReportLongevity: u64 =
        BondingDuration::get() as u64 * SessionsPerEra::get() as u64 * EpochDuration::get();
}

impl pallet_babe::Config for Runtime {
    type EpochDuration = EpochDuration;
    type ExpectedBlockTime = ExpectedBlockTime;
    type EpochChangeTrigger = pallet_babe::ExternalTrigger;
    type DisabledValidators = Session;

    type KeyOwnerProofSystem = Historical;

    type KeyOwnerProof = <Self::KeyOwnerProofSystem as KeyOwnerProofSystem<(
        KeyTypeId,
        pallet_babe::AuthorityId,
    )>>::Proof;

    type KeyOwnerIdentification = <Self::KeyOwnerProofSystem as KeyOwnerProofSystem<(
        KeyTypeId,
        pallet_babe::AuthorityId,
    )>>::IdentificationTuple;

    type HandleEquivocation =
        pallet_babe::EquivocationHandler<Self::KeyOwnerIdentification, Offences, ReportLongevity>;

    type WeightInfo = ();
    type MaxAuthorities = MaxAuthorities;
}

impl pallet_grandpa::Config for Runtime {
    type Event = Event;
    type Call = Call;

    type KeyOwnerProofSystem = Historical;

    type KeyOwnerProof =
        <Self::KeyOwnerProofSystem as KeyOwnerProofSystem<(KeyTypeId, GrandpaId)>>::Proof;

    type KeyOwnerIdentification = <Self::KeyOwnerProofSystem as KeyOwnerProofSystem<(
        KeyTypeId,
        GrandpaId,
    )>>::IdentificationTuple;

    type HandleEquivocation = pallet_grandpa::EquivocationHandler<
        Self::KeyOwnerIdentification,
        Offences,
        ReportLongevity,
    >;

    type WeightInfo = ();
    type MaxAuthorities = MaxAuthorities;
}

impl<LocalCall> frame_system::offchain::CreateSignedTransaction<LocalCall> for Runtime
where
    Call: From<LocalCall>,
{
    fn create_transaction<C: frame_system::offchain::AppCrypto<Self::Public, Self::Signature>>(
        call: Call,
        public: <Signature as sp_runtime::traits::Verify>::Signer,
        account: AccountId,
        nonce: Index,
    ) -> Option<(
        Call,
        <UncheckedExtrinsic as sp_runtime::traits::Extrinsic>::SignaturePayload,
    )> {
        integration::transactions::create_transaction::<C>(call, public, account, nonce)
    }
}

impl frame_system::offchain::SigningTypes for Runtime {
    type Public = <Signature as sp_runtime::traits::Verify>::Signer;
    type Signature = Signature;
}

impl<C> frame_system::offchain::SendTransactionTypes<C> for Runtime
where
    Call: From<C>,
{
    type Extrinsic = UncheckedExtrinsic;
    type OverarchingCall = Call;
}

parameter_types! {
    pub const MinimumPeriod: Moment = SLOT_DURATION / 2;
}

impl pallet_timestamp::Config for Runtime {
    type Moment = Moment;
    type OnTimestampSet = Babe;
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = weights::pallet_timestamp::SubstrateWeight<Runtime>;
}

parameter_types! {
    // For weight estimation, we assume that the most locks on an individual account will be 50.
    // This number may need to be adjusted in the future if this assumption no longer holds true.
    pub const MaxLocks: u32 = 50;
    pub const MaxReserves: u32 = 50;
}

impl pallet_balances::Config for Runtime {
    type MaxLocks = MaxLocks;
    type MaxReserves = MaxReserves;
    type ReserveIdentifier = [u8; 8];
    type Balance = Balance;
    type DustRemoval = ();
    type Event = Event;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = weights::pallet_balances::SubstrateWeight<Runtime>;
}

type NegativeImbalance = <Balances as Currency<AccountId>>::NegativeImbalance;

pub struct Author;
impl OnUnbalanced<NegativeImbalance> for Author {
    fn on_nonzero_unbalanced(amount: NegativeImbalance) {
        if let Some(author) = Authorship::author() {
            Balances::resolve_creating(&author, amount);
        }
    }
}

pub struct DealWithFees;
impl OnUnbalanced<NegativeImbalance> for DealWithFees {
    fn on_unbalanceds<B>(mut fees_then_tips: impl Iterator<Item = NegativeImbalance>) {
        if let Some(fees) = fees_then_tips.next() {
            // for fees, 20% to author, for now we don't have treasury so the 80% is ignored
            let mut split = fees.ration(80, 20);
            if let Some(tips) = fees_then_tips.next() {
                // For tips %100 are for the author
                tips.ration_merge_into(0, 100, &mut split);
            }
            Author::on_unbalanced(split.1);
        }
    }
}

parameter_types! {
    pub const TransactionByteFee: Balance = 2 * currency::MILLICENTS; // TODO: adjust value
    /// This value increases the priority of `Operational` transactions by adding
    /// a "virtual tip" that's equal to the `OperationalFeeMultiplier * final_fee`.
    pub const OperationalFeeMultiplier: u8 = 5; // TODO: adjust value
}

impl pallet_transaction_payment::Config for Runtime {
    type OnChargeTransaction = CurrencyAdapter<Balances, DealWithFees>;
    type OperationalFeeMultiplier = OperationalFeeMultiplier;
    type WeightToFee = constants::fees::WeightToFee;
    type LengthToFee = ConstantMultiplier<Balance, TransactionByteFee>;
    type FeeMultiplierUpdate = constants::fees::SlowAdjustingFeeUpdate<Self>;
}

impl pallet_sudo::Config for Runtime {
    type Event = Event;
    type Call = Call;
}

parameter_types! {
    pub const UncleGenerations: BlockNumber = 0;
}

impl pallet_authorship::Config for Runtime {
    type FindAuthor = pallet_session::FindAccountFromAuthorIndex<Self, Babe>;
    type UncleGenerations = UncleGenerations;
    type FilterUncle = ();
    type EventHandler = (Staking, ImOnline);
}

impl_opaque_keys! {
    pub struct SessionKeys {
        pub grandpa: Grandpa,
        pub babe: Babe,
        pub im_online: ImOnline,
        pub authority_discovery: AuthorityDiscovery,
    }
}

impl pallet_session::Config for Runtime {
    type Event = Event;
    type ValidatorId = <Self as frame_system::Config>::AccountId;
    type ValidatorIdOf = pallet_staking::StashOf<Self>;
    type ShouldEndSession = Babe;
    type NextSessionRotation = Babe;
    type SessionManager = pallet_session::historical::NoteHistoricalRoot<Self, Staking>;
    type SessionHandler = <SessionKeys as OpaqueKeys>::KeyTypeIdProviders;
    type Keys = SessionKeys;
    type WeightInfo = weights::pallet_session::SubstrateWeight<Runtime>;
}

impl pallet_session::historical::Config for Runtime {
    type FullIdentification = pallet_staking::Exposure<AccountId, Balance>;
    type FullIdentificationOf = pallet_staking::ExposureOf<Runtime>;
}

pallet_staking_reward_curve::build! {
    const REWARD_CURVE: PiecewiseLinear<'static> = curve!(
        min_inflation: 0_050_000,
        max_inflation: 0_180_000,
        ideal_stake: 0_300_000,
        falloff: 0_050_000,
        max_piece_count: 100,
        test_precision: 0_005_000,
    );
}

parameter_types! {
    pub const SessionsPerEra: sp_staking::SessionIndex = 6;
    pub const BondingDuration: sp_staking::EraIndex = BONDING_DURATION;
    pub const SlashDeferDuration: sp_staking::EraIndex = BONDING_DURATION - 1;
    pub const RewardCurve: &'static PiecewiseLinear<'static> = &REWARD_CURVE;
    pub const MaxNominatorRewardedPerValidator: u32 = 256;
    pub const OffendingValidatorsThreshold: Perbill = Perbill::from_percent(17);
    pub OffchainRepeat: BlockNumber = 5;
}

pub struct StakingBenchmarkingConfig;
impl pallet_staking::BenchmarkingConfig for StakingBenchmarkingConfig {
    type MaxNominators = ConstU32<1000>;
    type MaxValidators = ConstU32<1000>;
}

impl pallet_staking::Config for Runtime {
    type MaxNominations = MaxNominations;
    type Currency = Balances;
    type CurrencyBalance = Balance;
    type UnixTime = Timestamp;
    type CurrencyToVote = frame_support::traits::SaturatingCurrencyToVote; // U128CurrencyToVote;
    type RewardRemainder = ();
    type Event = Event;
    type Slash = ();
    type Reward = (); // rewards are minted from the void
    type SessionsPerEra = SessionsPerEra;
    type BondingDuration = BondingDuration;
    type SlashDeferDuration = SlashDeferDuration;
    type SlashCancelOrigin = EnsureRoot<AccountId>;
    type SessionInterface = Self;
    type EraPayout = pallet_staking::ConvertCurve<RewardCurve>;
    type NextNewSession = Session;
    type MaxNominatorRewardedPerValidator = MaxNominatorRewardedPerValidator;
    type OffendingValidatorsThreshold = OffendingValidatorsThreshold;
    type ElectionProvider = ElectionProviderMultiPhase;
    type GenesisElectionProvider = onchain::UnboundedExecution<OnChainSeqPhragmen>;
    type VoterList = BagsList;
    type MaxUnlockingChunks = ConstU32<32>;
    type OnStakerSlash = (); // NominationPools;
    type WeightInfo = weights::pallet_staking::SubstrateWeight<Runtime>;
    type BenchmarkingConfig = StakingBenchmarkingConfig;
}

parameter_types! {
    // phase durations. 1/4 of the last session for each.
    pub const SignedPhase: u32 = EPOCH_DURATION_IN_BLOCKS / 4;
    pub const UnsignedPhase: u32 = EPOCH_DURATION_IN_BLOCKS / 4;

    // signed config
    pub const SignedRewardBase: Balance = currency::DOLLARS; // TODO: adjust value
    pub const SignedDepositBase: Balance = currency::DOLLARS; // TODO: adjust value
    pub const SignedDepositByte: Balance = currency::CENTS; // TODO: adjust value

    pub BetterUnsignedThreshold: Perbill = Perbill::from_rational(1u32, 10_000);

    // miner configs
    pub const MultiPhaseUnsignedPriority: TransactionPriority = StakingUnsignedPriority::get() - 1u64;
    pub MinerMaxWeight: Weight = RuntimeBlockWeights::get()
        .get(DispatchClass::Normal)
        .max_extrinsic.expect("Normal extrinsics have a weight limit configured; qed")
        .saturating_sub(BlockExecutionWeight::get());
    // Solution can occupy 90% of normal block size
    pub MinerMaxLength: u32 = Perbill::from_rational(9u32, 10) *
        *RuntimeBlockLength::get()
        .max
        .get(DispatchClass::Normal);
}

frame_election_provider_support::generate_solution_type!(
    #[compact]
    pub struct NposSolution16::<
        VoterIndex = u32,
        TargetIndex = u16,
        Accuracy = sp_runtime::PerU16,
        MaxVoters = MaxElectingVoters,
    >(16)
);

parameter_types! {
    pub MaxNominations: u32 = <NposSolution16 as frame_election_provider_support::NposSolution>::LIMIT as u32;
    pub MaxElectingVoters: u32 = 10_000;
}

/// The numbers configured here could always be more than the the maximum limits of staking pallet
/// to ensure election snapshot will not run out of memory. For now, we set them to smaller values
/// since the staking is bounded and the weight pipeline takes hours for this single pallet.
pub struct ElectionProviderBenchmarkConfig;
impl pallet_election_provider_multi_phase::BenchmarkingConfig for ElectionProviderBenchmarkConfig {
    const VOTERS: [u32; 2] = [1000, 2000];
    const TARGETS: [u32; 2] = [500, 1000];
    const ACTIVE_VOTERS: [u32; 2] = [500, 800];
    const DESIRED_TARGETS: [u32; 2] = [200, 400];
    const SNAPSHOT_MAXIMUM_VOTERS: u32 = 1000;
    const MINER_MAXIMUM_VOTERS: u32 = 1000;
    const MAXIMUM_TARGETS: u32 = 300;
}

/// Maximum number of iterations for balancing that will be executed in the embedded OCW
/// miner of election provider multi phase.
pub const MINER_MAX_ITERATIONS: u32 = 10;

/// A source of random balance for NposSolver, which is meant to be run by the OCW election miner.
pub struct OffchainRandomBalancing;
impl Get<Option<(usize, ExtendedBalance)>> for OffchainRandomBalancing {
    fn get() -> Option<(usize, ExtendedBalance)> {
        use sp_runtime::traits::TrailingZeroInput;
        let iters = match MINER_MAX_ITERATIONS {
            0 => 0,
            max => {
                let seed = sp_io::offchain::random_seed();
                let random = <u32>::decode(&mut TrailingZeroInput::new(&seed))
                    .expect("input is padded with zeroes; qed")
                    % max.saturating_add(1);
                random as usize
            }
        };

        Some((iters, 0))
    }
}

pub struct OnChainSeqPhragmen;
impl onchain::Config for OnChainSeqPhragmen {
    type System = Runtime;
    type Solver = SequentialPhragmen<
        AccountId,
        pallet_election_provider_multi_phase::SolutionAccuracyOf<Runtime>,
    >;
    type DataProvider = <Runtime as pallet_election_provider_multi_phase::Config>::DataProvider;
    type WeightInfo = frame_election_provider_support::weights::SubstrateWeight<Runtime>;
}

impl onchain::BoundedConfig for OnChainSeqPhragmen {
    type VotersBound = MaxElectingVoters;
    type TargetsBound = ConstU32<2_000>;
}

impl pallet_election_provider_multi_phase::MinerConfig for Runtime {
    type AccountId = AccountId;
    type MaxLength = MinerMaxLength;
    type MaxWeight = MinerMaxWeight;
    type Solution = NposSolution16;
    type MaxVotesPerVoter =
	<<Self as pallet_election_provider_multi_phase::Config>::DataProvider as ElectionDataProvider>::MaxVotesPerVoter;

    // The unsigned submissions have to respect the weight of the submit_unsigned call, thus their
    // weight estimate function is wired to this call's weight.
    fn solution_weight(v: u32, t: u32, a: u32, d: u32) -> Weight {
        <
			<Self as pallet_election_provider_multi_phase::Config>::WeightInfo
			as
			pallet_election_provider_multi_phase::WeightInfo
		>::submit_unsigned(v, t, a, d)
    }
}

impl pallet_election_provider_multi_phase::Config for Runtime {
    type Event = Event;
    type Currency = Balances;
    type EstimateCallFee = TransactionPayment;
    type SignedPhase = SignedPhase;
    type UnsignedPhase = UnsignedPhase;
    type BetterUnsignedThreshold = BetterUnsignedThreshold;
    type BetterSignedThreshold = ();
    type OffchainRepeat = OffchainRepeat;
    type MinerTxPriority = MultiPhaseUnsignedPriority;
    type MinerConfig = Self;
    type SignedMaxSubmissions = ConstU32<10>;
    type SignedRewardBase = SignedRewardBase;
    type SignedDepositBase = SignedDepositBase;
    type SignedDepositByte = SignedDepositByte;
    type SignedMaxRefunds = ConstU32<3>;
    type SignedDepositWeight = ();
    type SignedMaxWeight = MinerMaxWeight;
    type SlashHandler = (); // burn slashes
    type RewardHandler = (); // nothing to do upon rewards
    type DataProvider = Staking;
    type Fallback = onchain::BoundedExecution<OnChainSeqPhragmen>;
    type GovernanceFallback = onchain::BoundedExecution<OnChainSeqPhragmen>;
    type Solver = SequentialPhragmen<
        AccountId,
        pallet_election_provider_multi_phase::SolutionAccuracyOf<Self>,
        OffchainRandomBalancing,
    >;
    type ForceOrigin = EnsureRoot<AccountId>; // EnsureRootOrHalfCouncil;
    type MaxElectableTargets = ConstU16<{ u16::MAX }>;
    type MaxElectingVoters = MaxElectingVoters;
    type BenchmarkingConfig = ElectionProviderBenchmarkConfig;
    type WeightInfo = pallet_election_provider_multi_phase::weights::SubstrateWeight<Self>;
}

parameter_types! {
    pub const BagThresholds: &'static [u64] = &voter_bags::THRESHOLDS;
}

impl pallet_bags_list::Config for Runtime {
    type Event = Event;
    type ScoreProvider = Staking;
    type WeightInfo = pallet_bags_list::weights::SubstrateWeight<Runtime>;
    type BagThresholds = BagThresholds;
    type Score = VoteWeight;
}

parameter_types! {
    pub const ImOnlineUnsignedPriority: TransactionPriority = TransactionPriority::max_value();
    /// We prioritize im-online heartbeats over election solution submission.
    pub const StakingUnsignedPriority: TransactionPriority = TransactionPriority::max_value() / 2;
    pub const MaxAuthorities: u32 = 100;
    pub const MaxKeys: u32 = 10_000;
    pub const MaxPeerInHeartbeats: u32 = 10_000;
    pub const MaxPeerDataEncodingSize: u32 = 1_000;
}

impl pallet_im_online::Config for Runtime {
    type AuthorityId = ImOnlineId;
    type Event = Event;
    type NextSessionRotation = Babe;
    type ValidatorSet = Historical;
    type ReportUnresponsiveness = Offences;
    type UnsignedPriority = ImOnlineUnsignedPriority;
    type WeightInfo = weights::pallet_im_online::SubstrateWeight<Runtime>;
    type MaxKeys = MaxKeys;
    type MaxPeerInHeartbeats = MaxPeerInHeartbeats;
    type MaxPeerDataEncodingSize = MaxPeerDataEncodingSize;
}

impl pallet_offences::Config for Runtime {
    type Event = Event;
    type IdentificationTuple = pallet_session::historical::IdentificationTuple<Self>;
    type OnOffenceHandler = Staking;
}

impl pallet_authority_discovery::Config for Runtime {
    type MaxAuthorities = MaxAuthorities;
}

parameter_types! {
    pub const MaxNumberOfCuratorsPerGroup: MaxNumber = 50;
    pub const ContentModuleId: PalletId = PalletId(*b"mContent"); // module content
    pub const MaxKeysPerCuratorGroupPermissionsByLevelMap: u8 = 25;
    pub const DefaultGlobalDailyNftLimit: LimitPerPeriod<BlockNumber> = LimitPerPeriod {
        block_number_period: DAYS,
        limit: 10000,
    };  // TODO: update
    pub const DefaultGlobalWeeklyNftLimit: LimitPerPeriod<BlockNumber> = LimitPerPeriod {
        block_number_period: WEEKS,
        limit: 50000,
    };  // TODO: update
    pub const DefaultChannelDailyNftLimit: LimitPerPeriod<BlockNumber> = LimitPerPeriod {
        block_number_period: DAYS,
        limit: 100,
    };  // TODO: update
    pub const DefaultChannelWeeklyNftLimit: LimitPerPeriod<BlockNumber> = LimitPerPeriod {
        block_number_period: WEEKS,
        limit: 500,
    };  // TODO: update
    pub const MinimumCashoutAllowedLimit: Balance = ExistentialDeposit::get() + 1; // TODO: update
    pub const MaximumCashoutAllowedLimit: Balance = 1_000_000 * currency::DOLLARS; // TODO: update
}

impl content::Config for Runtime {
    type Event = Event;
    type VideoId = VideoId;
    type OpenAuctionId = OpenAuctionId;
    type MaxNumberOfCuratorsPerGroup = MaxNumberOfCuratorsPerGroup;
    type DataObjectStorage = Storage;
    type ModuleId = ContentModuleId;
    type MemberAuthenticator = Members;
    type MaxKeysPerCuratorGroupPermissionsByLevelMap = MaxKeysPerCuratorGroupPermissionsByLevelMap;
    type ChannelPrivilegeLevel = ChannelPrivilegeLevel;
    type CouncilBudgetManager = Council;
    type ContentWorkingGroup = ContentWorkingGroup;
    type DefaultGlobalDailyNftLimit = DefaultGlobalDailyNftLimit;
    type DefaultGlobalWeeklyNftLimit = DefaultGlobalWeeklyNftLimit;
    type DefaultChannelDailyNftLimit = DefaultChannelDailyNftLimit;
    type DefaultChannelWeeklyNftLimit = DefaultChannelWeeklyNftLimit;
    type ProjectToken = ProjectToken;
    type TransferId = TransferId;
    type MinimumCashoutAllowedLimit = MinimumCashoutAllowedLimit;
    type MaximumCashoutAllowedLimit = MaximumCashoutAllowedLimit;
}

parameter_types! {
    pub const ProjectTokenModuleId: PalletId = PalletId(*b"mo:token"); // module: token
    pub const MaxVestingSchedulesPerAccountPerToken: u8 = 5; // TODO: adjust value
    pub const BlocksPerYear: u32 = 5259600; // 365,25 * 24 * 60 * 60 / 6
}

impl project_token::Config for Runtime {
    type Event = Event;
    type Balance = Balance;
    type TokenId = TokenId;
    type BlockNumberToBalance = BlockNumberToBalance;
    type DataObjectStorage = Storage;
    type ModuleId = ProjectTokenModuleId;
    type MaxVestingSchedulesPerAccountPerToken = MaxVestingSchedulesPerAccountPerToken;
    type JoyExistentialDeposit = ExistentialDeposit;
    type BlocksPerYear = BlocksPerYear;
    type MemberOriginValidator = Members;
    type MembershipInfoProvider = Members;
    type WeightInfo = project_token::weights::SubstrateWeight<Runtime>;
}

// The referendum instance alias.
pub type ReferendumInstance = referendum::Instance1;
pub type ReferendumModule = referendum::Module<Runtime, ReferendumInstance>;
pub type CouncilModule = council::Module<Runtime>;

// Production coucil and elections configuration
#[cfg(not(any(feature = "staging_runtime", feature = "testing_runtime")))]
parameter_types! {
    // referendum parameters
    pub const MaxSaltLength: u64 = 32;
    pub const VoteStageDuration: BlockNumber = 14400;
    pub const RevealStageDuration: BlockNumber = 14400;
    pub const MinimumVotingStake: Balance = 10 * currency::DOLLARS;

    // council parameteres
    pub const MinNumberOfExtraCandidates: u64 = 1;
    pub const AnnouncingPeriodDuration: BlockNumber = 14400;
    pub const IdlePeriodDuration: BlockNumber = 57600;
    pub const CouncilSize: u64 = 5;
    pub const MinCandidateStake: Balance = 100 * currency::DOLLARS;
    pub const ElectedMemberRewardPeriod: BlockNumber = 14400;
    pub const BudgetRefillPeriod: BlockNumber = 14400;
    pub const MaxWinnerTargetCount: u64 = 10; // should be greater than council size
}

// Common staging and playground coucil and elections configuration
// CouncilSize is defined separately
#[cfg(feature = "staging_runtime")]
parameter_types! {
    // referendum parameters
    pub const MaxSaltLength: u64 = 32;
    pub const VoteStageDuration: BlockNumber = 100;
    pub const RevealStageDuration: BlockNumber = 50;
    pub const MinimumVotingStake: Balance = 10 * currency::DOLLARS;

    // council parameteres
    pub const MinNumberOfExtraCandidates: u64 = 1;
    pub const AnnouncingPeriodDuration: BlockNumber = 200;
    pub const IdlePeriodDuration: BlockNumber = 400;
    pub const MinCandidateStake: Balance = 100 * currency::DOLLARS;
    pub const ElectedMemberRewardPeriod: BlockNumber = 14400;
    pub const BudgetRefillPeriod: BlockNumber = 1000;
    pub const MaxWinnerTargetCount: u64 = 10;
}

// Staging council size
#[cfg(feature = "staging_runtime")]
#[cfg(not(feature = "playground_runtime"))]
parameter_types! {
    pub const CouncilSize: u64 = 3;
}

// Playground council size
#[cfg(feature = "staging_runtime")]
#[cfg(feature = "playground_runtime")]
parameter_types! {
    pub const CouncilSize: u64 = 1;
}

// Testing config
#[cfg(feature = "testing_runtime")]
parameter_types! {
    // referendum parameters
    pub const MaxSaltLength: u64 = 32;
    pub const VoteStageDuration: BlockNumber = 20;
    pub const RevealStageDuration: BlockNumber = 20;
    pub const MinimumVotingStake: Balance = 10 * currency::DOLLARS;

    // council parameteres
    pub const MinNumberOfExtraCandidates: u64 = 1;
    pub const AnnouncingPeriodDuration: BlockNumber = 20;
    pub const IdlePeriodDuration: BlockNumber = 20;
    pub const CouncilSize: u64 = 5;
    pub const MinCandidateStake: Balance = 100 * currency::DOLLARS;
    pub const ElectedMemberRewardPeriod: BlockNumber = 14400;
    pub const BudgetRefillPeriod: BlockNumber = 1000;
    pub const MaxWinnerTargetCount: u64 = 10;
}

impl referendum::Config<ReferendumInstance> for Runtime {
    type Event = Event;
    type MaxSaltLength = MaxSaltLength;
    type StakingHandler = VotingStakingManager;
    type ManagerOrigin = EnsureOneOf<EnsureSigned<Self::AccountId>, EnsureRoot<Self::AccountId>>;
    type VotePower = Balance;
    type VoteStageDuration = VoteStageDuration;
    type RevealStageDuration = RevealStageDuration;
    type MinimumStake = MinimumVotingStake;
    type WeightInfo = referendum::weights::SubstrateWeight<Runtime>;
    type MaxWinnerTargetCount = MaxWinnerTargetCount;

    fn calculate_vote_power(
        _account_id: &<Self as frame_system::Config>::AccountId,
        stake: &Balance,
    ) -> Self::VotePower {
        *stake
    }

    fn can_unlock_vote_stake(vote: &CastVote<Self::Hash, Balance, Self::MemberId>) -> bool {
        <CouncilModule as ReferendumConnection<Runtime>>::can_unlock_vote_stake(vote).is_ok()
    }

    fn process_results(winners: &[OptionResult<Self::MemberId, Self::VotePower>]) {
        let tmp_winners: Vec<OptionResult<Self::MemberId, Self::VotePower>> = winners
            .iter()
            .map(|item| OptionResult {
                option_id: item.option_id,
                vote_power: item.vote_power,
            })
            .collect();
        <CouncilModule as ReferendumConnection<Runtime>>::recieve_referendum_results(
            tmp_winners.as_slice(),
        );
    }

    fn is_valid_option_id(option_index: &u64) -> bool {
        <CouncilModule as ReferendumConnection<Runtime>>::is_valid_candidate_id(option_index)
    }

    fn get_option_power(option_id: &u64) -> Self::VotePower {
        <CouncilModule as ReferendumConnection<Runtime>>::get_option_power(option_id)
    }

    fn increase_option_power(option_id: &u64, amount: &Self::VotePower) {
        <CouncilModule as ReferendumConnection<Runtime>>::increase_option_power(option_id, amount);
    }
}

impl council::Config for Runtime {
    type Event = Event;
    type Referendum = ReferendumModule;
    type MinNumberOfExtraCandidates = MinNumberOfExtraCandidates;
    type CouncilSize = CouncilSize;
    type AnnouncingPeriodDuration = AnnouncingPeriodDuration;
    type IdlePeriodDuration = IdlePeriodDuration;
    type MinCandidateStake = MinCandidateStake;
    type CandidacyLock = StakingManager<Self, CandidacyLockId>;
    type CouncilorLock = StakingManager<Self, CouncilorLockId>;
    type StakingAccountValidator = Members;
    type ElectedMemberRewardPeriod = ElectedMemberRewardPeriod;
    type BudgetRefillPeriod = BudgetRefillPeriod;
    type MemberOriginValidator = Members;
    type WeightInfo = council::weights::SubstrateWeight<Runtime>;

    fn new_council_elected(_elected_members: &[council::CouncilMemberOf<Self>]) {
        <proposals_engine::Module<Runtime>>::reject_active_proposals();
        <proposals_engine::Module<Runtime>>::reactivate_pending_constitutionality_proposals();
    }
}

impl common::StorageOwnership for Runtime {
    type ChannelId = ChannelId;
    type ContentId = ContentId;
    type DataObjectTypeId = DataObjectTypeId;
}

// Storage parameters independent of runtime profile
parameter_types! {
    pub const MaxDistributionBucketFamilyNumber: u64 = 200;
    pub const BlacklistSizeLimit: u64 = 10000; //TODO: adjust value
    pub const MaxNumberOfPendingInvitationsPerDistributionBucket: u64 = 20; //TODO: adjust value
    pub const StorageModuleId: PalletId = PalletId(*b"mstorage"); // module storage
    pub const DistributionBucketsPerBagValueConstraint: storage::DistributionBucketsPerBagValueConstraint =
        storage::DistributionBucketsPerBagValueConstraint {min: 1, max_min_diff: 100}; //TODO: adjust value
    pub const MaxDataObjectSize: u64 = 10 * 1024 * 1024 * 1024; // 10 GB
}

// Production storage parameters
#[cfg(not(any(feature = "staging_runtime", feature = "testing_runtime")))]
parameter_types! {
    pub const StorageBucketsPerBagValueConstraint: storage::StorageBucketsPerBagValueConstraint =
        storage::StorageBucketsPerBagValueConstraint {min: 5, max_min_diff: 15}; //TODO: adjust value
    pub const DefaultMemberDynamicBagNumberOfStorageBuckets: u64 = 5; //TODO: adjust value
    pub const DefaultChannelDynamicBagNumberOfStorageBuckets: u64 = 5; //TODO: adjust value
}

// Staging/testing storage parameters
#[cfg(any(feature = "staging_runtime", feature = "testing_runtime"))]
parameter_types! {
    pub const StorageBucketsPerBagValueConstraint: storage::StorageBucketsPerBagValueConstraint =
        storage::StorageBucketsPerBagValueConstraint {min: 1, max_min_diff: 15};
    pub const DefaultMemberDynamicBagNumberOfStorageBuckets: u64 = 1;
    pub const DefaultChannelDynamicBagNumberOfStorageBuckets: u64 = 1;
}

impl storage::Config for Runtime {
    type Event = Event;
    type DataObjectId = DataObjectId;
    type StorageBucketId = StorageBucketId;
    type DistributionBucketIndex = DistributionBucketIndex;
    type DistributionBucketFamilyId = DistributionBucketFamilyId;
    type ChannelId = ChannelId;
    type BlacklistSizeLimit = BlacklistSizeLimit;
    type ModuleId = StorageModuleId;
    type StorageBucketsPerBagValueConstraint = StorageBucketsPerBagValueConstraint;
    type DefaultMemberDynamicBagNumberOfStorageBuckets =
        DefaultMemberDynamicBagNumberOfStorageBuckets;
    type DefaultChannelDynamicBagNumberOfStorageBuckets =
        DefaultChannelDynamicBagNumberOfStorageBuckets;
    type MaxDistributionBucketFamilyNumber = MaxDistributionBucketFamilyNumber;
    type DistributionBucketsPerBagValueConstraint = DistributionBucketsPerBagValueConstraint;
    type DistributionBucketOperatorId = DistributionBucketOperatorId;
    type MaxNumberOfPendingInvitationsPerDistributionBucket =
        MaxNumberOfPendingInvitationsPerDistributionBucket;
    type MaxDataObjectSize = MaxDataObjectSize;
    type ContentId = ContentId;
    type WeightInfo = storage::weights::SubstrateWeight<Runtime>;
    type StorageWorkingGroup = StorageWorkingGroup;
    type DistributionWorkingGroup = DistributionWorkingGroup;
    type ModuleAccountInitialBalance = ExistentialDeposit;
}

impl common::membership::MembershipTypes for Runtime {
    type MemberId = MemberId;
    type ActorId = ActorId;
}

parameter_types! {
    pub const DefaultMembershipPrice: Balance = 100 * currency::CENTS;
    pub const ReferralCutMaximumPercent: u8 = 50;
    pub const DefaultInitialInvitationBalance: Balance = 100 * currency::CENTS;
    // The candidate stake should be more than the transaction fee
    pub const CandidateStake: Balance = 200 * currency::CENTS;
}

impl membership::Config for Runtime {
    type Event = Event;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type DefaultInitialInvitationBalance = DefaultInitialInvitationBalance;
    type InvitedMemberStakingHandler = InvitedMemberStakingManager;
    type StakingCandidateStakingHandler = BoundStakingAccountStakingManager;
    type WorkingGroup = MembershipWorkingGroup;
    type WeightInfo = membership::weights::SubstrateWeight<Runtime>;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type CandidateStake = CandidateStake;
}

parameter_types! {
    pub const MaxCategoryDepth: u64 = 6;
    pub const MaxSubcategories: u64 = 40;
    pub const MaxThreadsInCategory: u64 = 20;
    pub const MaxPostsInThread: u64 = 20;
    pub const MaxModeratorsForCategory: u64 = 20;
    pub const MaxCategories: u64 = 40;
    pub const ThreadDeposit: Balance = 25 * currency::CENTS;
    pub const PostDeposit: Balance = 10 * currency::CENTS;
    pub const ForumModuleId: PalletId = PalletId(*b"mo:forum"); // module : forum
    pub const PostLifeTime: BlockNumber = 3600;
}

pub struct MapLimits;
impl forum::StorageLimits for MapLimits {
    type MaxSubcategories = MaxSubcategories;
    type MaxModeratorsForCategory = MaxModeratorsForCategory;
    type MaxCategories = MaxCategories;
}

impl forum::Config for Runtime {
    type Event = Event;
    type ThreadId = ThreadId;
    type PostId = PostId;
    type CategoryId = u64;
    type PostReactionId = u64;
    type MaxCategoryDepth = MaxCategoryDepth;
    type ThreadDeposit = ThreadDeposit;
    type PostDeposit = PostDeposit;
    type ModuleId = ForumModuleId;
    type MapLimits = MapLimits;
    type WeightInfo = forum::weights::SubstrateWeight<Runtime>;
    type WorkingGroup = ForumWorkingGroup;
    type MemberOriginValidator = Members;
    type PostLifeTime = PostLifeTime;

    fn calculate_hash(text: &[u8]) -> Self::Hash {
        Self::Hashing::hash(text)
    }
}

impl LockComparator<<Runtime as pallet_balances::Config>::Balance> for Runtime {
    fn are_locks_conflicting(new_lock: &LockIdentifier, existing_locks: &[LockIdentifier]) -> bool {
        let other_locks_present = !existing_locks.is_empty();
        let new_lock_is_rivalrous = !NON_RIVALROUS_LOCKS.contains(new_lock);
        let existing_locks_contain_rivalrous_lock = existing_locks
            .iter()
            .any(|lock_id| !NON_RIVALROUS_LOCKS.contains(lock_id));

        other_locks_present && new_lock_is_rivalrous && existing_locks_contain_rivalrous_lock
    }
}

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 100;
    pub const MinUnstakingPeriodLimit: u32 = 43200;
    pub const ForumWorkingGroupRewardPeriod: u32 = 14400 + 10;
    pub const StorageWorkingGroupRewardPeriod: u32 = 14400 + 20;
    pub const ContentWorkingGroupRewardPeriod: u32 = 14400 + 30;
    pub const MembershipRewardPeriod: u32 = 14400 + 40;
    pub const GatewayRewardPeriod: u32 = 14400 + 50;
    pub const OperationsAlphaRewardPeriod: u32 = 14400 + 60;
    pub const OperationsBetaRewardPeriod: u32 = 14400 + 70;
    pub const OperationsGammaRewardPeriod: u32 = 14400 + 80;
    pub const DistributionRewardPeriod: u32 = 14400 + 90;
    // This should be more costly than `apply_on_opening` fee
    pub const MinimumApplicationStake: Balance = 20 * currency::DOLLARS;
    // This should be more costly than `add_opening` fee
    pub const LeaderOpeningStake: Balance = 20 * currency::DOLLARS;
}

// Staking managers type aliases.
pub type ForumWorkingGroupStakingManager =
    staking_handler::StakingManager<Runtime, ForumGroupLockId>;
pub type VotingStakingManager = staking_handler::StakingManager<Runtime, VotingLockId>;
pub type ContentWorkingGroupStakingManager =
    staking_handler::StakingManager<Runtime, ContentWorkingGroupLockId>;
pub type StorageWorkingGroupStakingManager =
    staking_handler::StakingManager<Runtime, StorageWorkingGroupLockId>;
pub type MembershipWorkingGroupStakingManager =
    staking_handler::StakingManager<Runtime, MembershipWorkingGroupLockId>;
pub type InvitedMemberStakingManager =
    staking_handler::StakingManager<Runtime, InvitedMemberLockId>;
pub type BoundStakingAccountStakingManager =
    staking_handler::StakingManager<Runtime, BoundStakingAccountLockId>;
pub type GatewayWorkingGroupStakingManager =
    staking_handler::StakingManager<Runtime, GatewayWorkingGroupLockId>;
pub type OperationsWorkingGroupAlphaStakingManager =
    staking_handler::StakingManager<Runtime, OperationsWorkingGroupAlphaLockId>;
pub type OperationsWorkingGroupBetaStakingManager =
    staking_handler::StakingManager<Runtime, OperationsWorkingGroupBetaLockId>;
pub type OperationsWorkingGroupGammaStakingManager =
    staking_handler::StakingManager<Runtime, OperationsWorkingGroupGammaLockId>;
pub type DistributionWorkingGroupStakingManager =
    staking_handler::StakingManager<Runtime, DistributionWorkingGroupLockId>;

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

impl working_group::Config<ForumWorkingGroupInstance> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = ForumWorkingGroupStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = ForumWorkingGroupRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<StorageWorkingGroupInstance> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = StorageWorkingGroupStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = StorageWorkingGroupRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<ContentWorkingGroupInstance> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = ContentWorkingGroupStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = ContentWorkingGroupRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<MembershipWorkingGroupInstance> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = MembershipWorkingGroupStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = MembershipRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<OperationsWorkingGroupInstanceAlpha> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = OperationsWorkingGroupAlphaStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = OperationsAlphaRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<GatewayWorkingGroupInstance> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = GatewayWorkingGroupStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = GatewayRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<OperationsWorkingGroupInstanceBeta> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = OperationsWorkingGroupBetaStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = OperationsBetaRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<OperationsWorkingGroupInstanceGamma> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = OperationsWorkingGroupGammaStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = OperationsGammaRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl working_group::Config<DistributionWorkingGroupInstance> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = DistributionWorkingGroupStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = DistributionRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

parameter_types! {
    pub const ProposalCancellationFee: Balance = 100 * currency::CENTS;
    pub const ProposalRejectionFee: Balance = 50 * currency::CENTS;
    pub const ProposalTitleMaxLength: u32 = 40;
    pub const ProposalDescriptionMaxLength: u32 = 3000;
    pub const ProposalMaxActiveProposalLimit: u32 = 20;
}

impl proposals_engine::Config for Runtime {
    type Event = Event;
    type ProposerOriginValidator = Members;
    type CouncilOriginValidator = Council;
    type TotalVotersCounter = CouncilManager<Self>;
    type ProposalId = u32;
    type StakingHandler = staking_handler::StakingManager<Self, ProposalsLockId>;
    type CancellationFee = ProposalCancellationFee;
    type RejectionFee = ProposalRejectionFee;
    type TitleMaxLength = ProposalTitleMaxLength;
    type DescriptionMaxLength = ProposalDescriptionMaxLength;
    type MaxActiveProposalLimit = ProposalMaxActiveProposalLimit;
    type DispatchableCallCode = Call;
    type ProposalObserver = ProposalsCodex;
    type WeightInfo = proposals_engine::weights::SubstrateWeight<Runtime>;
    type StakingAccountValidator = Members;
}

impl Default for Call {
    fn default() -> Self {
        panic!("shouldn't call default for Call");
    }
}

parameter_types! {
    pub const MaxWhiteListSize: u32 = 20;
    pub const ProposalsPostDeposit: Balance = 10 * currency::CENTS;
    // module : proposals_discussion
    pub const ProposalsDiscussionModuleId: PalletId = PalletId(*b"mo:prdis");
    pub const ForumPostLifeTime: BlockNumber = 3600;
}

macro_rules! call_wg {
    ($working_group:ident, $function:ident $(,$x:expr)*) => {{
        match $working_group {
            WorkingGroup::Content => <ContentWorkingGroup as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
            WorkingGroup::Storage => <StorageWorkingGroup as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
            WorkingGroup::Forum => <ForumWorkingGroup as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
            WorkingGroup::Membership => <MembershipWorkingGroup as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
            WorkingGroup::Gateway => <GatewayWorkingGroup as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
            WorkingGroup::Distribution => <DistributionWorkingGroup as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
            WorkingGroup::OperationsAlpha => <OperationsWorkingGroupAlpha as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
            WorkingGroup::OperationsBeta => <OperationsWorkingGroupBeta as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
            WorkingGroup::OperationsGamma => <OperationsWorkingGroupGamma as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
        }
    }};
}

impl proposals_discussion::Config for Runtime {
    type Event = Event;
    type AuthorOriginValidator = Members;
    type MembershipInfoProvider = Members;
    type CouncilOriginValidator = Council;
    type ThreadId = ThreadId;
    type PostId = PostId;
    type MaxWhiteListSize = MaxWhiteListSize;
    type WeightInfo = proposals_discussion::weights::SubstrateWeight<Runtime>;
    type PostDeposit = ProposalsPostDeposit;
    type ModuleId = ProposalsDiscussionModuleId;
    type PostLifeTime = ForumPostLifeTime;
}

impl joystream_utility::Config for Runtime {
    type Event = Event;

    type WeightInfo = joystream_utility::weights::SubstrateWeight<Runtime>;

    fn get_working_group_budget(working_group: WorkingGroup) -> Balance {
        call_wg!(working_group, get_budget)
    }
    fn set_working_group_budget(working_group: WorkingGroup, budget: Balance) {
        call_wg!(working_group, set_budget, budget)
    }
}

parameter_types! {
    // Make sure to stay below MAX_BLOCK_SIZE of substrate consensus of ~4MB
    // The new compressed wasm format is much smaller in size ~ 1MB
    pub const RuntimeUpgradeWasmProposalMaxLength: u32 = 3_500_000;
    pub const FundingRequestProposalMaxAmount: Balance = 1_000_000 * currency::DOLLARS; // TODO: adjust
    pub const FundingRequestProposalMaxAccounts: u32 = 100;
    pub const SetMaxValidatorCountProposalMaxValidators: u32 = 300;
}

impl proposals_codex::Config for Runtime {
    type Event = Event;
    type MembershipOriginValidator = Members;
    type ProposalEncoder = ExtrinsicProposalEncoder;
    type SetMaxValidatorCountProposalParameters = SetMaxValidatorCountProposalParameters;
    type RuntimeUpgradeProposalParameters = RuntimeUpgradeProposalParameters;
    type SignalProposalParameters = SignalProposalParameters;
    type FundingRequestProposalParameters = FundingRequestProposalParameters;
    type CreateWorkingGroupLeadOpeningProposalParameters =
        CreateWorkingGroupLeadOpeningProposalParameters;
    type FillWorkingGroupLeadOpeningProposalParameters =
        FillWorkingGroupLeadOpeningProposalParameters;
    type UpdateWorkingGroupBudgetProposalParameters = UpdateWorkingGroupBudgetProposalParameters;
    type DecreaseWorkingGroupLeadStakeProposalParameters =
        DecreaseWorkingGroupLeadStakeProposalParameters;
    type SlashWorkingGroupLeadProposalParameters = SlashWorkingGroupLeadProposalParameters;
    type SetWorkingGroupLeadRewardProposalParameters = SetWorkingGroupLeadRewardProposalParameters;
    type TerminateWorkingGroupLeadProposalParameters = TerminateWorkingGroupLeadProposalParameters;
    type AmendConstitutionProposalParameters = AmendConstitutionProposalParameters;
    type CancelWorkingGroupLeadOpeningProposalParameters =
        CancelWorkingGroupLeadOpeningProposalParameters;
    type SetMembershipPriceProposalParameters = SetMembershipPriceProposalParameters;
    type SetCouncilBudgetIncrementProposalParameters = SetCouncilBudgetIncrementProposalParameters;
    type SetCouncilorRewardProposalParameters = SetCouncilorRewardProposalParameters;
    type SetInitialInvitationBalanceProposalParameters =
        SetInitialInvitationBalanceProposalParameters;
    type SetInvitationCountProposalParameters = SetInvitationCountProposalParameters;
    type SetMembershipLeadInvitationQuotaProposalParameters =
        SetMembershipLeadInvitationQuotaProposalParameters;
    type SetReferralCutProposalParameters = SetReferralCutProposalParameters;
    type VetoProposalProposalParameters = VetoProposalProposalParameters;
    type UpdateGlobalNftLimitProposalParameters = UpdateGlobalNftLimitProposalParameters;
    type UpdateChannelPayoutsProposalParameters = UpdateChannelPayoutsProposalParameters;
    type FundingRequestProposalMaxAmount = FundingRequestProposalMaxAmount;
    type FundingRequestProposalMaxAccounts = FundingRequestProposalMaxAccounts;
    type SetMaxValidatorCountProposalMaxValidators = SetMaxValidatorCountProposalMaxValidators;
    type WeightInfo = proposals_codex::weights::SubstrateWeight<Runtime>;
}

impl pallet_constitution::Config for Runtime {
    type Event = Event;
    type WeightInfo = pallet_constitution::weights::SubstrateWeight<Runtime>;
}

// parameter_types! {
//     pub const BountyModuleId: PalletId = PalletId(*b"m:bounty"); // module : bounty
//     pub const ClosedContractSizeLimit: u32 = 50;
//     pub const MinCherryLimit: Balance = 1000;
//     pub const MinFundingLimit: Balance = 1000;
//     pub const MinWorkEntrantStake: Balance = 1000;
// }

// impl bounty::Config for Runtime {
//     type Event = Event;
//     type ModuleId = BountyModuleId;
//     type BountyId = u64;
//     type Membership = Members;
//     type WeightInfo = weights::bounty::WeightInfo;
//     type CouncilBudgetManager = Council;
//     type StakingHandler = staking_handler::StakingManager<Self, BountyLockId>;
//     type EntryId = u64;
//     type ClosedContractSizeLimit = ClosedContractSizeLimit;
//     type MinCherryLimit = MinCherryLimit;
//     type MinFundingLimit = MinFundingLimit;
//     type MinWorkEntrantStake = MinWorkEntrantStake;
// }

/// Forum identifier for category
pub type CategoryId = u64;

parameter_types! {
    pub const MinVestedTransfer: Balance = 100 * currency::CENTS; // TODO: adjust value
}

impl pallet_vesting::Config for Runtime {
    type Event = Event;
    type Currency = Balances;
    type BlockNumberToBalance = ConvertInto;
    type MinVestedTransfer = MinVestedTransfer;
    type WeightInfo = weights::pallet_vesting::SubstrateWeight<Runtime>;
    // `VestingInfo` encode length is 36bytes. 28 schedules gets encoded as 1009 bytes, which is the
    // highest number of schedules that encodes less than 2^10.
    const MAX_VESTING_SCHEDULES: u32 = 28;
}

parameter_types! {
    // Deposit for storing one new item with key size = 32 bytes and value size = 56 bytes
    pub const DepositBase: Balance = 15 * currency::CENTS + 88 * 6 * currency::CENTS;
    // Deposit for adding 32 bytes to an already stored item
    pub const DepositFactor: Balance = 32 * 6 * currency::CENTS;
    // Max number of multisig signatories
    pub const MaxSignatories: u16 = 100;
}

impl pallet_multisig::Config for Runtime {
    type Event = Event;
    type Call = Call;
    type Currency = Balances;
    type DepositBase = DepositBase;
    type DepositFactor = DepositFactor;
    type MaxSignatories = MaxSignatories;
    type WeightInfo = weights::pallet_multisig::SubstrateWeight<Runtime>;
}

/// Opaque types. These are used by the CLI to instantiate machinery that don't need to know
/// the specifics of the runtime. They can then be made to be agnostic over specific formats
/// of data like extrinsics, allowing for them to continue syncing the network through upgrades
/// to even the core datastructures.
pub mod opaque {
    use super::*;

    pub use sp_runtime::OpaqueExtrinsic as UncheckedExtrinsic;

    /// Opaque block header type.
    pub type Header = generic::Header<BlockNumber, BlakeTwo256>;
    /// Opaque block type.
    pub type Block = generic::Block<Header, UncheckedExtrinsic>;
    /// Opaque block identifier type.
    pub type BlockId = generic::BlockId<Block>;
}

construct_runtime!(
    pub enum Runtime where
        Block = Block,
        NodeBlock = opaque::Block,
        UncheckedExtrinsic = UncheckedExtrinsic,
    {
        // Substrate
        System: frame_system,
        Utility: substrate_utility,
        Babe: pallet_babe,
        Timestamp: pallet_timestamp,
        // Authorship must be before session in order to note author in the correct session and era
        // for im-online and staking
        Authorship: pallet_authorship,
        Balances: pallet_balances,
        TransactionPayment: pallet_transaction_payment,
        ElectionProviderMultiPhase: pallet_election_provider_multi_phase,
        Staking: pallet_staking,
        Session: pallet_session,
        Historical: pallet_session_historical,
        Grandpa: pallet_grandpa,
        AuthorityDiscovery: pallet_authority_discovery,
        ImOnline: pallet_im_online,
        Offences: pallet_offences,
        RandomnessCollectiveFlip: pallet_randomness_collective_flip,
        Sudo: pallet_sudo,
        BagsList: pallet_bags_list,
        Vesting: pallet_vesting,
        Multisig: pallet_multisig,
        // Joystream
        Council: council::{Pallet, Call, Storage, Event<T>, Config<T>},
        Referendum: referendum::<Instance1>::{Pallet, Call, Storage, Event<T>, Config<T>},
        Members: membership::{Pallet, Call, Storage, Event<T>},
        Forum: forum::{Pallet, Call, Storage, Event<T>, Config<T>},
        Constitution: pallet_constitution::{Pallet, Call, Storage, Event},
        // Bounty: bounty::{Pallet, Call, Storage, Event<T>},
        JoystreamUtility: joystream_utility::{Pallet, Call, Event<T>},
        Content: content::{Pallet, Call, Storage, Event<T>, Config<T>},
        Storage: storage::{Pallet, Call, Storage, Event<T>, Config<T>},
        ProjectToken: project_token::{Pallet, Call, Storage, Event<T>, Config<T>},
        // --- Proposals
        ProposalsEngine: proposals_engine::{Pallet, Call, Storage, Event<T>},
        ProposalsDiscussion: proposals_discussion::{Pallet, Call, Storage, Event<T>},
        ProposalsCodex: proposals_codex::{Pallet, Call, Storage, Event<T>},
        // --- Working groups
        ForumWorkingGroup: working_group::<Instance1>::{Pallet, Call, Storage, Event<T>},
        StorageWorkingGroup: working_group::<Instance2>::{Pallet, Call, Storage, Event<T>},
        ContentWorkingGroup: working_group::<Instance3>::{Pallet, Call, Storage, Event<T>},
        OperationsWorkingGroupAlpha: working_group::<Instance4>::{Pallet, Call, Storage, Event<T>},
        GatewayWorkingGroup: working_group::<Instance5>::{Pallet, Call, Storage, Event<T>},
        MembershipWorkingGroup: working_group::<Instance6>::{Pallet, Call, Storage, Event<T>},
        OperationsWorkingGroupBeta: working_group::<Instance7>::{Pallet, Call, Storage, Event<T>},
        OperationsWorkingGroupGamma: working_group::<Instance8>::{Pallet, Call, Storage, Event<T>},
        DistributionWorkingGroup: working_group::<Instance9>::{Pallet, Call, Storage, Event<T>},
    }
);
