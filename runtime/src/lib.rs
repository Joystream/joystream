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
#[cfg(all(feature = "staging-runtime", feature = "testing-runtime"))]
compile_error!("feature \"staging-runtime\" and feature \"testing-runtime\" cannot be enabled at the same time");

// Mutually exclusive feature check
#[cfg(all(feature = "playground-runtime", feature = "testing-runtime"))]
compile_error!("feature \"playground-runtime\" and feature \"testing-runtime\" cannot be enabled at the same time");

// Mutually exclusive feature check
#[cfg(all(feature = "staging-runtime", feature = "playground-runtime"))]
compile_error!("feature \"staging-runtime\" and feature \"playground-runtime\" cannot be enabled at the same time");

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
pub mod utils;
/// Generated voter bag information.
mod voter_bags;
/// Weights for pallets used in the runtime.
mod weights;

#[macro_use]
extern crate lazy_static; // for proposals_configuration module

use codec::{Decode, Encode, MaxEncodedLen};
use core::ops::Div;
use frame_election_provider_support::{
    onchain, BalancingConfig, ElectionDataProvider, SequentialPhragmen, VoteWeight,
};
use frame_support::traits::{
    ConstU16, ConstU32, Contains, Currency, EitherOfDiverse, Imbalance, InstanceFilter,
    KeyOwnerProofSystem, LockIdentifier, OnUnbalanced, WithdrawReasons,
};
use frame_support::weights::{constants::WEIGHT_REF_TIME_PER_SECOND, ConstantMultiplier, Weight};
use frame_support::{dispatch::DispatchClass, pallet_prelude::Get, RuntimeDebug};
pub use weights::{
    block_weights::BlockExecutionWeight, extrinsic_weights::ExtrinsicBaseWeight,
    rocksdb_weights::constants::RocksDbWeight,
};

use frame_support::{construct_runtime, parameter_types, PalletId};
use frame_system::limits::{BlockLength, BlockWeights};
use frame_system::{EnsureRoot, EnsureSigned};
use pallet_grandpa::{AuthorityId as GrandpaId, AuthorityList as GrandpaAuthorityList};
use pallet_im_online::sr25519::AuthorityId as ImOnlineId;
use pallet_session::historical as pallet_session_historical;
use pallet_staking::BondingRestriction;
use pallet_transaction_payment::CurrencyAdapter;
use sp_authority_discovery::AuthorityId as AuthorityDiscoveryId;
use sp_core::crypto::KeyTypeId;
use sp_core::Hasher;
use utils::*;

use sp_runtime::{
    create_runtime_str,
    curve::PiecewiseLinear,
    generic, impl_opaque_keys,
    traits::{BlakeTwo256, ConvertInto, IdentityLookup, OpaqueKeys, Zero},
    Perbill,
};

use sp_std::boxed::Box;
use sp_std::convert::{TryFrom, TryInto};
use sp_std::marker::PhantomData;
use sp_std::{collections::btree_map::BTreeMap, iter::FromIterator, vec, vec::Vec};

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
#[cfg(any(feature = "std", test))]
pub use pallet_staking::StakerStatus;
#[cfg(any(feature = "std", test))]
pub use sp_runtime::BuildStorage;

use constants::*;
pub use primitives::*;
pub use proposals_configuration::*;
pub use runtime_api::*;

use integration::proposals::{CouncilManager, ExtrinsicProposalEncoder};

use common::working_group::{WorkingGroup, WorkingGroupBudgetHandler};
use council::ReferendumConnection;
use pallet_staking::EraPayout;
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
#[sp_version::runtime_version]
pub const VERSION: RuntimeVersion = RuntimeVersion {
    spec_name: create_runtime_str!("joystream-node"),
    impl_name: create_runtime_str!("joystream-node"),
    authoring_version: 12,
    spec_version: 2003,
    impl_version: 0,
    apis: crate::runtime_api::EXPORTED_RUNTIME_API_VERSIONS,
    transaction_version: 2,
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
/// We allow for 2 seconds of compute with a 6 second average block time, with maximum proof size.
const MAXIMUM_BLOCK_WEIGHT: Weight =
    Weight::from_parts(WEIGHT_REF_TIME_PER_SECOND.saturating_mul(2), u64::MAX);

parameter_types! {
    pub const BlockHashCount: BlockNumber = 2400;
    pub const Version: RuntimeVersion = VERSION;
    pub const MaximumBlockLength: u32 = mega_bytes!(5);
    pub RuntimeBlockLength: BlockLength =
        BlockLength::max_with_normal_ratio(MaximumBlockLength::get(), NORMAL_DISPATCH_RATIO);
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

// Bloat-bond related global parameters:
parameter_types! {
    /// Minimum deposit per byte of data stored in the runtime state
    pub const MinimumBloatBondPerByte: Balance = currency::MILLICENTS;
    /// Default minimum profit that the user should recieve for cleaning up an object
    /// (like channel / video / forum thread / forum post) from the runtime state.
    /// Provided that `x` is a computed cleanup transaction inclusion fee and `y`
    /// is `DefaultStorageDepositCleanupProfit::get() * storage_entry_size`, the recoverable
    /// bloat bond should be:
    /// `(x + DefaultStorageDepositCleanupProfit::get()).max(y)`
    pub const DefaultStorageDepositCleanupProfit: Balance = currency::CENTS;
    /// Minimum profit that the user should recieve for removing a storage data object (asset).
    /// This is separate from `DefaultStorageDepositCleanupProfit`, because channels / videos will
    /// usually include multiple data objects and we don't want each of them to increase
    /// bloat bond significantly.
    pub const DataObjectDepositCleanupProfit: Balance = currency::MILLICENTS.saturating_mul(200);
}

/// Our extrinsics call filter
pub enum CallFilter {}

// Filter out only a subset of calls on content pallet, some specific proposals
// and the bounty creation call.
#[cfg(not(feature = "runtime-benchmarks"))]
impl Contains<<Runtime as frame_system::Config>::RuntimeCall> for CallFilter {
    fn contains(call: &<Runtime as frame_system::Config>::RuntimeCall) -> bool {
        match call {
            RuntimeCall::Content(content::Call::<Runtime>::destroy_nft { .. }) => false,
            RuntimeCall::Content(content::Call::<Runtime>::toggle_nft_limits { .. }) => false,
            RuntimeCall::Content(content::Call::<Runtime>::update_curator_group_permissions {
                ..
            }) => false,
            RuntimeCall::Content(content::Call::<Runtime>::update_channel_privilege_level {
                ..
            }) => false,
            RuntimeCall::Content(content::Call::<Runtime>::update_channel_nft_limit { .. }) => {
                false
            }
            RuntimeCall::Content(
                content::Call::<Runtime>::set_channel_paused_features_as_moderator { .. },
            ) => false,
            RuntimeCall::Content(content::Call::<Runtime>::initialize_channel_transfer {
                ..
            }) => false,
            RuntimeCall::Bounty(bounty::Call::<Runtime>::create_bounty { .. }) => false,
            RuntimeCall::ProposalsCodex(proposals_codex::Call::<Runtime>::create_proposal {
                general_proposal_parameters: _,
                proposal_details,
            }) => !matches!(
                proposal_details,
                proposals_codex::ProposalDetails::UpdateGlobalNftLimit(..)
            ),
            _ => true,
        }
    }
}

// Do not filter any calls when building benchmarks so we can benchmark everything
#[cfg(feature = "runtime-benchmarks")]
impl Contains<<Runtime as frame_system::Config>::RuntimeCall> for CallFilter {
    fn contains(_call: &<Runtime as frame_system::Config>::RuntimeCall) -> bool {
        true
    }
}

impl frame_system::Config for Runtime {
    type BaseCallFilter = CallFilter;
    type BlockWeights = RuntimeBlockWeights;
    type BlockLength = RuntimeBlockLength;
    type DbWeight = RocksDbWeight;
    type RuntimeOrigin = RuntimeOrigin;
    type RuntimeCall = RuntimeCall;
    type Index = Index;
    type BlockNumber = BlockNumber;
    type Hash = Hash;
    type Hashing = BlakeTwo256;
    type AccountId = AccountId;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = generic::Header<BlockNumber, BlakeTwo256>;
    type RuntimeEvent = RuntimeEvent;
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

impl pallet_insecure_randomness_collective_flip::Config for Runtime {}

impl substrate_utility::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type RuntimeCall = RuntimeCall;
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

    // type KeyOwnerProofSystem = Historical;

    // type KeyOwnerProof = <Self::KeyOwnerProofSystem as KeyOwnerProofSystem<(
    //     KeyTypeId,
    //     pallet_babe::AuthorityId,
    // )>>::Proof;

    // type KeyOwnerIdentification = <Self::KeyOwnerProofSystem as KeyOwnerProofSystem<(
    //     KeyTypeId,
    //     pallet_babe::AuthorityId,
    // )>>::IdentificationTuple;

    // type HandleEquivocation =
    //     pallet_babe::EquivocationHandler<Self::KeyOwnerIdentification, Offences, ReportLongevity>;

    type KeyOwnerProof =
        <Historical as KeyOwnerProofSystem<(KeyTypeId, pallet_babe::AuthorityId)>>::Proof;

    type EquivocationReportSystem =
        pallet_babe::EquivocationReportSystem<Self, Offences, Historical, ReportLongevity>;

    type WeightInfo = weights::pallet_babe::SubstrateWeight<Runtime>;
    type MaxAuthorities = MaxAuthorities;
}

parameter_types! {
    pub const MaxSetIdSessionEntries: u32 = BondingDuration::get() * SessionsPerEra::get();
}

impl pallet_grandpa::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;

    type KeyOwnerProof = <Historical as KeyOwnerProofSystem<(KeyTypeId, GrandpaId)>>::Proof;

    type EquivocationReportSystem =
        pallet_grandpa::EquivocationReportSystem<Self, Offences, Historical, ReportLongevity>;

    type WeightInfo = weights::pallet_grandpa::SubstrateWeight<Runtime>;
    type MaxAuthorities = MaxAuthorities;
    type MaxSetIdSessionEntries = MaxSetIdSessionEntries;
}

impl<LocalCall> frame_system::offchain::CreateSignedTransaction<LocalCall> for Runtime
where
    RuntimeCall: From<LocalCall>,
{
    fn create_transaction<C: frame_system::offchain::AppCrypto<Self::Public, Self::Signature>>(
        call: RuntimeCall,
        public: <Signature as sp_runtime::traits::Verify>::Signer,
        account: AccountId,
        nonce: Index,
    ) -> Option<(
        RuntimeCall,
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
    RuntimeCall: From<C>,
{
    type Extrinsic = UncheckedExtrinsic;
    type OverarchingCall = RuntimeCall;
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

    /// The maximum number of named reserves that can exist on an account.
    pub const MaxReserves: u32 = 50;

    /// Fixed size of a single frame_system::Account map entry.
    pub SystemAccountEntryFixedSize: u32 = map_entry_fixed_byte_size::<
        frame_system::Account::<Runtime>, _, _, _
    >();

    /// The minimum amount required to keep an account open.
    pub ExistentialDeposit: Balance = Balance::from(SystemAccountEntryFixedSize::get())
        .saturating_mul(MinimumBloatBondPerByte::get());
}

impl pallet_balances::Config for Runtime {
    type MaxLocks = MaxLocks;
    type MaxReserves = MaxReserves;
    type ReserveIdentifier = [u8; 8];
    type Balance = Balance;
    type DustRemoval = ();
    type RuntimeEvent = RuntimeEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = weights::pallet_balances::SubstrateWeight<Runtime>;
}

pub(crate) type NegativeImbalance = <Balances as Currency<AccountId>>::NegativeImbalance;

pub struct Author;
impl OnUnbalanced<NegativeImbalance> for Author {
    fn on_nonzero_unbalanced(amount: NegativeImbalance) {
        if let Some(author) = Authorship::author() {
            Balances::resolve_creating(&author, amount);
        }
    }
}

pub struct DealWithFees<R>(PhantomData<R>);
impl<R: OnUnbalanced<NegativeImbalance>> OnUnbalanced<NegativeImbalance> for DealWithFees<R> {
    fn on_unbalanceds<B>(mut fees_then_tips: impl Iterator<Item = NegativeImbalance>) {
        if let Some(fees) = fees_then_tips.next() {
            // for fees, we burn them all
            let mut split = fees.ration(100, 0);
            if let Some(tips) = fees_then_tips.next() {
                // For tips %100 are for the author
                tips.ration_merge_into(0, 100, &mut split);
            }
            R::on_unbalanced(split.1);
        }
    }
}

parameter_types! {
    // 0.2 milicents / byte
    pub const TransactionByteFee: Balance = currency::MILLICENTS
        .saturating_mul(2)
        .saturating_div(10);

    /// This value increases the priority of `Operational` transactions by adding
    /// a "virtual tip" that's equal to the `OperationalFeeMultiplier * final_fee`.
    pub const OperationalFeeMultiplier: u8 = 5;
}

impl pallet_transaction_payment::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type OnChargeTransaction = CurrencyAdapter<Balances, DealWithFees<Author>>;
    type OperationalFeeMultiplier = OperationalFeeMultiplier;
    type WeightToFee = constants::fees::WeightToFee;
    type LengthToFee = ConstantMultiplier<Balance, TransactionByteFee>;
    type FeeMultiplierUpdate = constants::fees::SlowAdjustingFeeUpdate<Self>;
}

impl pallet_authorship::Config for Runtime {
    type FindAuthor = pallet_session::FindAccountFromAuthorIndex<Self, Babe>;
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
    type RuntimeEvent = RuntimeEvent;
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
        min_inflation: 0_007_500,
        max_inflation: 0_030_000,
        ideal_stake: 0_500_000,
        falloff: 0_050_000,
        max_piece_count: 40,
        test_precision: 0_005_000,
    );
}

pub struct NoInflationIfNoEras;
impl EraPayout<Balance> for NoInflationIfNoEras {
    fn era_payout(
        total_staked: Balance,
        total_issuance: Balance,
        era_duration_millis: u64,
    ) -> (Balance, Balance) {
        let era_index = pallet_staking::Pallet::<Runtime>::active_era()
            .map_or_else(Zero::zero, |era| era.index);

        if era_index.is_zero() {
            // PoA mode: no inflation.
            (0, 0)
        } else {
            // rescale the era payout according to the damping factor while keeping the invariant
            // era_payou + rest = max_payout
            let (era_payout_unscaled, rest_unscaled) =
                <pallet_staking::ConvertCurve<RewardCurve> as EraPayout<Balance>>::era_payout(
                    total_staked,
                    total_issuance,
                    era_duration_millis,
                );
            let max_payout = era_payout_unscaled.saturating_add(rest_unscaled);
            let damping_factor_parts = Council::era_payout_damping_factor().deconstruct();
            let era_payout_scaled = era_payout_unscaled
                .saturating_mul(damping_factor_parts.into())
                .div(100u128);
            let rest_scaled = max_payout.saturating_sub(era_payout_scaled);
            (era_payout_scaled, rest_scaled)
        }
    }
}

parameter_types! {
    pub const SessionsPerEra: sp_staking::SessionIndex = SESSIONS_PER_ERA;
    pub const BondingDuration: sp_staking::EraIndex = BONDING_DURATION;
    pub const SlashDeferDuration: sp_staking::EraIndex = SLASH_DEFER_DURATION;
    pub const RewardCurve: &'static PiecewiseLinear<'static> = &REWARD_CURVE;
    pub const MaxNominatorRewardedPerValidator: u32 = 256;
    pub const OffendingValidatorsThreshold: Perbill = Perbill::from_percent(17);
    pub OffchainRepeat: BlockNumber = UnsignedPhase::get() / 8;
    pub HistoryDepth: u32 = 120;
}

pub struct StakingBenchmarkingConfig;
impl pallet_staking::BenchmarkingConfig for StakingBenchmarkingConfig {
    type MaxNominators = ConstU32<1000>; // Cannot be higher than `max_nominator_count` in genesis config
    type MaxValidators = ConstU32<400>; // Cannot be higher than `max_validator_count` in genesis config
}

impl pallet_staking::Config for Runtime {
    type MaxNominations = MaxNominations;
    type Currency = Balances;
    type CurrencyBalance = Balance;
    type UnixTime = Timestamp;
    type CurrencyToVote = frame_support::traits::SaturatingCurrencyToVote; // U128CurrencyToVote;
    type RewardRemainder = ();
    type RuntimeEvent = RuntimeEvent;
    type Slash = ();
    type Reward = (); // rewards are minted from the void
    type SessionsPerEra = SessionsPerEra;
    type BondingDuration = BondingDuration;
    type SlashDeferDuration = SlashDeferDuration;
    type AdminOrigin = EnsureRoot<AccountId>;
    type SessionInterface = Self;
    type EraPayout = NoInflationIfNoEras;
    type NextNewSession = Session;
    type MaxNominatorRewardedPerValidator = MaxNominatorRewardedPerValidator;
    type OffendingValidatorsThreshold = OffendingValidatorsThreshold;
    type ElectionProvider = ElectionProviderMultiPhase;
    type GenesisElectionProvider = onchain::OnChainExecution<OnChainSeqPhragmen>;
    type VoterList = VoterList;
    type TargetList = pallet_staking::UseValidatorsMap<Self>;
    type MaxUnlockingChunks = ConstU32<32>;
    type HistoryDepth = HistoryDepth;
    type OnStakerSlash = ();
    type WeightInfo = weights::pallet_staking::SubstrateWeight<Runtime>;
    type BenchmarkingConfig = StakingBenchmarkingConfig;
    type BondingRestriction = RestrictStakingAccountsFromBonding;
}

parameter_types! {
    pub const SignedMaxSubmissions: u32 = 16;
    pub const SignedMaxRefunds: u32 = 16 / 4;

    // phase durations. 1/4 of the last session for each.
    pub const SignedPhase: u32 = EPOCH_DURATION_IN_BLOCKS / 4;
    pub const UnsignedPhase: u32 = EPOCH_DURATION_IN_BLOCKS / 4;

    // signed config
    pub const SignedRewardBase: Balance = dollars!(1);
    pub const SignedDepositBase: Balance = dollars!(10);
    pub const SignedDepositByte: Balance = MinimumBloatBondPerByte::get();

    pub BetterUnsignedThreshold: Perbill = Perbill::from_rational(5u32, 10_000);

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
    pub MaxElectingVoters: u32 = 12_500;
    // The maximum winners that can be elected by the Election pallet which is equivalent to the
    // maximum active validators the staking pallet can have.
    pub MaxActiveValidators: u32 = 400; // should not be more than max_validator_count genesis config in staking pallet?
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
impl Get<Option<BalancingConfig>> for OffchainRandomBalancing {
    fn get() -> Option<BalancingConfig> {
        use sp_runtime::traits::TrailingZeroInput;
        let iterations = match MINER_MAX_ITERATIONS {
            0 => 0,
            max => {
                let seed = sp_io::offchain::random_seed();
                let random = <u32>::decode(&mut TrailingZeroInput::new(&seed))
                    .expect("input is padded with zeroes; qed")
                    % max.saturating_add(1);
                random as usize
            }
        };

        let config = BalancingConfig {
            iterations,
            tolerance: 0,
        };
        Some(config)
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
    type MaxWinners = <Runtime as pallet_election_provider_multi_phase::Config>::MaxWinners;
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
    type MaxWinners = MaxActiveValidators;

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
    type RuntimeEvent = RuntimeEvent;
    type Currency = Balances;
    type EstimateCallFee = TransactionPayment;
    type SignedPhase = SignedPhase;
    type UnsignedPhase = UnsignedPhase;
    type BetterUnsignedThreshold = BetterUnsignedThreshold;
    type BetterSignedThreshold = ();
    type OffchainRepeat = OffchainRepeat;
    type MinerTxPriority = MultiPhaseUnsignedPriority;
    type MinerConfig = Self;
    type SignedMaxSubmissions = SignedMaxSubmissions;
    type SignedRewardBase = SignedRewardBase;
    type SignedDepositBase = SignedDepositBase;
    type SignedDepositByte = SignedDepositByte;
    type SignedMaxRefunds = SignedMaxRefunds;
    type SignedDepositWeight = ();
    type SignedMaxWeight = MinerMaxWeight;
    type SlashHandler = (); // burn slashes
    type RewardHandler = (); // nothing to do upon rewards
    type DataProvider = Staking;
    type Fallback = onchain::OnChainExecution<OnChainSeqPhragmen>;
    type GovernanceFallback = onchain::OnChainExecution<OnChainSeqPhragmen>;
    type Solver = SequentialPhragmen<
        AccountId,
        pallet_election_provider_multi_phase::SolutionAccuracyOf<Self>,
        OffchainRandomBalancing,
    >;
    type ForceOrigin = EnsureRoot<AccountId>; // EnsureRootOrHalfCouncil;
    type MaxElectableTargets = ConstU16<{ u16::MAX }>;
    type MaxElectingVoters = MaxElectingVoters;
    type MaxWinners = MaxActiveValidators; // How does this relate with staking pallet
    type BenchmarkingConfig = ElectionProviderBenchmarkConfig;
    type WeightInfo = weights::pallet_election_provider_multi_phase::SubstrateWeight<Self>;
}

parameter_types! {
    pub const BagThresholds: &'static [u64] = &voter_bags::THRESHOLDS;
}

type VoterBagsListInstance = pallet_bags_list::Instance1;
impl pallet_bags_list::Config<VoterBagsListInstance> for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type ScoreProvider = Staking;
    type WeightInfo = weights::pallet_bags_list::SubstrateWeight<Runtime>;
    type BagThresholds = BagThresholds;
    type Score = VoteWeight;
}

parameter_types! {
    pub const ImOnlineUnsignedPriority: TransactionPriority = TransactionPriority::max_value();
    /// We prioritize im-online heartbeats over election solution submission.
    pub const StakingUnsignedPriority: TransactionPriority = TransactionPriority::max_value() / 2;
    pub const MaxAuthorities: u32 = 100_000;
    pub const MaxKeys: u32 = 10_000;
    pub const MaxPeerInHeartbeats: u32 = 10_000;
    pub const MaxPeerDataEncodingSize: u32 = 1_000;
}

impl pallet_im_online::Config for Runtime {
    type AuthorityId = ImOnlineId;
    type RuntimeEvent = RuntimeEvent;
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
    type RuntimeEvent = RuntimeEvent;
    type IdentificationTuple = pallet_session::historical::IdentificationTuple<Self>;
    type OnOffenceHandler = Staking;
}

impl pallet_authority_discovery::Config for Runtime {
    type MaxAuthorities = MaxAuthorities;
}

parameter_types! {
    pub const MaxNumberOfCuratorsPerGroup: MaxNumber = 10;
    pub const ContentModuleId: PalletId = PalletId(*b"mContent"); // module content
    pub const MaxKeysPerCuratorGroupPermissionsByLevelMap: u8 = 25;
    pub const DefaultGlobalDailyNftLimit: LimitPerPeriod<BlockNumber> = LimitPerPeriod {
        block_number_period: days!(1),
        limit: 100,
    };
    pub const DefaultGlobalWeeklyNftLimit: LimitPerPeriod<BlockNumber> = LimitPerPeriod {
        block_number_period: days!(7),
        limit: 400,
    };
    pub const DefaultChannelDailyNftLimit: LimitPerPeriod<BlockNumber> = LimitPerPeriod {
        block_number_period: days!(1),
        limit: 10,
    };
    pub const DefaultChannelWeeklyNftLimit: LimitPerPeriod<BlockNumber> = LimitPerPeriod {
        block_number_period: days!(7),
        limit: 40,
    };
    pub const MinimumCashoutAllowedLimit: Balance = dollars!(10);
    pub const MaximumCashoutAllowedLimit: Balance = dollars!(100_000);
    pub const MaxNftAuctionWhitelistLength: MaxNumber = 20;

    // Channel bloat bond related:
    pub ChannelCleanupTxFee: Balance = compute_fee(
        RuntimeCall::Content(content::Call::<Runtime>::delete_channel {
            actor: Default::default(),
            channel_id: 0,
            channel_bag_witness: content::ChannelBagWitness {
                distribution_buckets_num: MaxDistributionBucketsPerBag::get(),
                storage_buckets_num: MaxStorageBucketsPerBag::get(),
            },
            num_objects_to_delete: 1
        })
    );
    pub ChannelEntryMaxSize: u32 = map_entry_max_size::<content::ChannelById::<Runtime>>();
    pub ChannelStateBloatBondValue: Balance = single_existential_deposit_bloat_bond_with_cleanup(
        ChannelEntryMaxSize::get(),
        ChannelCleanupTxFee::get(),
        DefaultStorageDepositCleanupProfit::get()
    );

    // Video bloat bond related:
    pub VideoCleanupTxFee: Balance = compute_fee(
        RuntimeCall::Content(content::Call::<Runtime>::delete_video {
            actor: Default::default(),
            video_id: 0,
            num_objects_to_delete: 1,
            storage_buckets_num_witness: Some(MaxStorageBucketsPerBag::get())
        })
    );
    pub VideoEntryMaxSize: u32 = map_entry_max_size::<content::VideoById::<Runtime>>();
    pub VideoStateBloatBondValue: Balance = single_bloat_bond_with_cleanup(
        VideoEntryMaxSize::get(),
        VideoCleanupTxFee::get(),
        DefaultStorageDepositCleanupProfit::get()
    );

    pub const MaxNumberOfAssetsPerChannel: MaxNumber = 10;
    pub const MaxNumberOfAssetsPerVideo: MaxNumber = 20;
    pub const MaxNumberOfCollaboratorsPerChannel: MaxNumber = 10;
}

impl content::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type VideoId = VideoId;
    type OpenAuctionId = OpenAuctionId;
    type MaxNumberOfCuratorsPerGroup = MaxNumberOfCuratorsPerGroup;
    type DataObjectStorage = Storage;
    type WeightInfo = content::weights::SubstrateWeight<Runtime>;
    type ModuleId = ContentModuleId;
    type MemberAuthenticator = Members;
    type MaxKeysPerCuratorGroupPermissionsByLevelMap = MaxKeysPerCuratorGroupPermissionsByLevelMap;
    type MaxNumberOfAssetsPerChannel = MaxNumberOfAssetsPerChannel;
    type MaxNumberOfAssetsPerVideo = MaxNumberOfAssetsPerVideo;
    type MaxNumberOfCollaboratorsPerChannel = MaxNumberOfCollaboratorsPerChannel;
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
    type MaxNftAuctionWhitelistLength = MaxNftAuctionWhitelistLength;
}

parameter_types! {
    pub const ProjectTokenModuleId: PalletId = PalletId(*b"mo:token"); // module: token
    pub const MaxVestingSchedulesPerAccountPerToken: u32 = 5;
    pub const BlocksPerYear: u32 = 5259600; // 365,25 * 24 * 60 * 60 / 6
    pub const MaxOutputs: u32 = 24; // set according to https://github.com/Joystream/joystream/issues/4947#issuecomment-1778893817
    // Account bloat bond related:
    pub ProjectTokenAccountCleanupTxFee: Balance = compute_fee(
        RuntimeCall::ProjectToken(project_token::Call::<Runtime>::dust_account {
            token_id: 0,
            member_id: 0,
        })
    );
    pub ProjectTokenAccountEntryMaxSize: u32 =
        map_entry_max_size::<project_token::AccountInfoByTokenAndMember::<Runtime>>();
    pub ProjectTokenAccountBloatBond: Balance = single_bloat_bond_with_cleanup(
        ProjectTokenAccountEntryMaxSize::get(),
        ProjectTokenAccountCleanupTxFee::get(),
        DefaultStorageDepositCleanupProfit::get()
    );
}

impl project_token::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type Balance = Balance;
    type TokenId = TokenId;
    type DataObjectStorage = Storage;
    type ModuleId = ProjectTokenModuleId;
    type MaxVestingSchedulesPerAccountPerToken = MaxVestingSchedulesPerAccountPerToken;
    type JoyExistentialDeposit = ExistentialDeposit;
    type BlocksPerYear = BlocksPerYear;
    type MemberOriginValidator = Members;
    type MembershipInfoProvider = Members;
    type MaxOutputs = MaxOutputs;
    type WeightInfo = project_token::weights::SubstrateWeight<Runtime>;
}

// The referendum instance alias.
pub type ReferendumInstance = referendum::Instance1;
pub type ReferendumModule = referendum::Module<Runtime, ReferendumInstance>;
pub type CouncilModule = council::Module<Runtime>;

// Production coucil and elections configuration
#[cfg(not(any(
    feature = "staging-runtime",
    feature = "playground-runtime",
    feature = "testing-runtime",
)))]
parameter_types! {
    // referendum parameters
    pub const MaxSaltLength: u64 = 32;
    pub const VoteStageDuration: BlockNumber = days!(4);
    pub const RevealStageDuration: BlockNumber = days!(4);
    pub const MinimumVotingStake: Balance = dollars!(10);
    pub const MaxWinnerTargetCount: u32 = CouncilSize::get();

    // council parameteres
    pub const MinNumberOfExtraCandidates: u32 = 0;
    pub const AnnouncingPeriodDuration: BlockNumber = days!(6);
    pub const IdlePeriodDuration: BlockNumber = days!(14);
    pub const CouncilSize: u32 = 3;
    pub const MinCandidateStake: Balance = dollars!(10_000);
    pub const ElectedMemberRewardPeriod: BlockNumber = days!(1);
    pub const BudgetRefillPeriod: BlockNumber = days!(1);
}

// playground council and elections configuration - also recommended for benchmarking
// Periods are shorter to:
// - allow easier testing
// - prevent benchmarks System::events() from accumulating too much data and overflowing the memory
#[cfg(feature = "playground-runtime")]
parameter_types! {
    // referendum parameters
    pub const MaxSaltLength: u64 = 32;
    pub const VoteStageDuration: BlockNumber = 100;
    pub const RevealStageDuration: BlockNumber = 100;
    pub const MinimumVotingStake: Balance = dollars!(10);
    pub const MaxWinnerTargetCount: u32 = CouncilSize::get();

    // council parameteres
    pub const MinNumberOfExtraCandidates: u32 = 0;
    pub const AnnouncingPeriodDuration: BlockNumber = 100;
    pub const IdlePeriodDuration: BlockNumber = 5;
    pub const MinCandidateStake: Balance = dollars!(10_000);
    pub const ElectedMemberRewardPeriod: BlockNumber = 33;
    pub const BudgetRefillPeriod: BlockNumber = 33;
}

#[cfg(feature = "playground-runtime")]
#[cfg(not(feature = "runtime-benchmarks"))]
parameter_types! {
    pub const CouncilSize: u32 = 1;
}

#[cfg(all(feature = "playground-runtime", feature = "runtime-benchmarks"))]
parameter_types! {
    pub const CouncilSize: u32 = 3;
}

// Staging coucil and elections configuration
#[cfg(feature = "staging-runtime")]
parameter_types! {
    // referendum parameters
    pub const MaxSaltLength: u64 = 32;
    pub const VoteStageDuration: BlockNumber = hours!(1);
    pub const RevealStageDuration: BlockNumber = hours!(1);
    pub const MinimumVotingStake: Balance = dollars!(10);
    pub const MaxWinnerTargetCount: u32 = CouncilSize::get();

    // council parameteres
    pub const MinNumberOfExtraCandidates: u32 = 0;
    pub const AnnouncingPeriodDuration: BlockNumber = hours!(3);
    pub const IdlePeriodDuration: BlockNumber = 1; // 1 block
    pub const CouncilSize: u32 = 3;
    pub const MinCandidateStake: Balance = dollars!(10_000);
    pub const ElectedMemberRewardPeriod: BlockNumber = days!(1);
    pub const BudgetRefillPeriod: BlockNumber = days!(1);
}

// Testing config
#[cfg(feature = "testing-runtime")]
parameter_types! {
    // referendum parameters
    pub const MaxSaltLength: u64 = 32;
    pub const VoteStageDuration: BlockNumber = 20;
    pub const RevealStageDuration: BlockNumber = 20;
    pub const MinimumVotingStake: Balance = dollars!(10);
    pub const MaxWinnerTargetCount: u32 = CouncilSize::get();

    // council parameteres
    pub const MinNumberOfExtraCandidates: u32 = 0;
    pub const AnnouncingPeriodDuration: BlockNumber = 60;
    pub const IdlePeriodDuration: BlockNumber = 10;
    pub const CouncilSize: u32 = 5;
    pub const MinCandidateStake: Balance = dollars!(10_000);
    pub const ElectedMemberRewardPeriod: BlockNumber = 6;
    pub const BudgetRefillPeriod: BlockNumber = 6;
}

impl referendum::Config<ReferendumInstance> for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type MaxSaltLength = MaxSaltLength;
    type StakingHandler = VotingStakingManager;
    type ManagerOrigin =
        EitherOfDiverse<EnsureSigned<Self::AccountId>, EnsureRoot<Self::AccountId>>;
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
    type RuntimeEvent = RuntimeEvent;
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
    pub const BlacklistSizeLimit: u64 = 1_000;
    pub const MaxNumberOfPendingInvitationsPerDistributionBucket: u32 = 20;
    pub const StorageModuleId: PalletId = PalletId(*b"mstorage");
    pub const MinDistributionBucketsPerBag: u32 = 1;
    pub const MaxDistributionBucketsPerBag: u32 = 51;
    pub const MaxDataObjectSize: u64 = giga_bytes!(60);
    pub const MaxNumberOfOperatorsPerDistributionBucket: u32 = 20;

    // Data object bloat bond related:
    // To calculate the cost of removing a data object we substract the cost of removing a video
    // w/ 1 asset from a cost of removing a video w/ 2 assets
    pub DataObjectCleanupTxFee: Balance = compute_fee(
        RuntimeCall::Content(content::Call::<Runtime>::delete_video {
            actor: Default::default(),
            video_id: 0,
            num_objects_to_delete: 2,
            storage_buckets_num_witness: Some(MaxStorageBucketsPerBag::get())
        })
    ).saturating_sub(
        compute_fee(
            RuntimeCall::Content(content::Call::<Runtime>::delete_video {
                actor: Default::default(),
                video_id: 0,
                num_objects_to_delete: 1,
                storage_buckets_num_witness: Some(MaxStorageBucketsPerBag::get())
            })
        )
    );
    pub DataObjectMaxEntrySize: u32 = map_entry_max_size::<storage::DataObjectsById::<Runtime>>();
    pub DataObjectBloatBond: Balance = single_bloat_bond_with_cleanup(
        DataObjectMaxEntrySize::get(),
        DataObjectCleanupTxFee::get(),
        DataObjectDepositCleanupProfit::get()
    );
}

// Production (and staging) storage parameters
#[cfg(not(any(feature = "playground-runtime", feature = "testing-runtime")))]
parameter_types! {
    pub const MinStorageBucketsPerBag: u32 = 3;
    pub const MaxStorageBucketsPerBag: u32 = 13;
    pub const DefaultMemberDynamicBagNumberOfStorageBuckets: u32 = 5;
    pub const DefaultChannelDynamicBagNumberOfStorageBuckets: u32 = 5;
}

// Playground/testing storage parameters
#[cfg(any(feature = "playground-runtime", feature = "testing-runtime",))]
parameter_types! {
    pub const MinStorageBucketsPerBag: u32 = 1;
    pub const MaxStorageBucketsPerBag: u32 = 13;
    pub const DefaultMemberDynamicBagNumberOfStorageBuckets: u32 = 1;
    pub const DefaultChannelDynamicBagNumberOfStorageBuckets: u32 = 1;
}

// Assertions
const_assert!(MinStorageBucketsPerBag::get() > 0);
const_assert!(MaxStorageBucketsPerBag::get() >= MinStorageBucketsPerBag::get());
const_assert!(MinDistributionBucketsPerBag::get() > 0);
const_assert!(MaxDistributionBucketsPerBag::get() >= MinDistributionBucketsPerBag::get());

impl storage::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type DataObjectId = DataObjectId;
    type StorageBucketId = StorageBucketId;
    type DistributionBucketIndex = DistributionBucketIndex;
    type DistributionBucketFamilyId = DistributionBucketFamilyId;
    type ChannelId = ChannelId;
    type BlacklistSizeLimit = BlacklistSizeLimit;
    type ModuleId = StorageModuleId;
    type MinStorageBucketsPerBag = MinStorageBucketsPerBag;
    type MaxStorageBucketsPerBag = MaxStorageBucketsPerBag;
    type MinDistributionBucketsPerBag = MinDistributionBucketsPerBag;
    type MaxDistributionBucketsPerBag = MaxDistributionBucketsPerBag;
    type DefaultMemberDynamicBagNumberOfStorageBuckets =
        DefaultMemberDynamicBagNumberOfStorageBuckets;
    type DefaultChannelDynamicBagNumberOfStorageBuckets =
        DefaultChannelDynamicBagNumberOfStorageBuckets;
    type MaxDistributionBucketFamilyNumber = MaxDistributionBucketFamilyNumber;
    type DistributionBucketOperatorId = DistributionBucketOperatorId;
    type MaxNumberOfPendingInvitationsPerDistributionBucket =
        MaxNumberOfPendingInvitationsPerDistributionBucket;
    type MaxNumberOfOperatorsPerDistributionBucket = MaxNumberOfOperatorsPerDistributionBucket;
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
    pub const DefaultMembershipPrice: Balance = dollars!(1);
    pub const ReferralCutMaximumPercent: u8 = 50;
    pub const DefaultInitialInvitationBalance: Balance = cents!(50);
    pub const DefaultMemberInvitesCount: u32 = 2;
    // Candidate stake related:
    pub StakingAccountCleanupTxFee: Balance = compute_fee(
        RuntimeCall::Members(membership::Call::<Runtime>::remove_staking_account { member_id: 0 })
    );
    pub CandidateStake: Balance = stake_with_cleanup(
        MinimumVotingStake::get(),
        StakingAccountCleanupTxFee::get()
    );
}

impl membership::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type DefaultInitialInvitationBalance = DefaultInitialInvitationBalance;
    type InvitedMemberStakingHandler = InvitedMemberStakingManager;
    type StakingCandidateStakingHandler = BoundStakingAccountStakingManager;
    type WorkingGroup = MembershipWorkingGroup;
    type WeightInfo = membership::weights::SubstrateWeight<Runtime>;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type CandidateStake = CandidateStake;
    type DefaultMemberInvitesCount = DefaultMemberInvitesCount;
}

parameter_types! {
    pub const MaxCategoryDepth: u64 = 6;
    pub const MaxDirectSubcategoriesInCategory: u64 = 10;
    pub const MaxTotalCategories: u64 = 40;
    pub const MaxModeratorsForCategory: u64 = 10;

    // Thread bloat bond related:
    pub FroumThreadCleanupTxFee: Balance = compute_fee(
        RuntimeCall::Forum(forum::Call::<Runtime>::delete_thread {
            forum_user_id: 0,
            category_id: 0,
            thread_id: 0,
            hide: true
        })
    );
    pub ForumThreadEntryMaxSize: u32 = map_entry_max_size::<forum::ThreadById::<Runtime>>();
    pub ThreadDeposit: Balance = single_existential_deposit_bloat_bond_with_cleanup(
        ForumThreadEntryMaxSize::get(),
        FroumThreadCleanupTxFee::get(),
        DefaultStorageDepositCleanupProfit::get()
    );

    // Post bloat bond related:
    pub FroumPostCleanupTxFee: Balance = compute_fee(
        RuntimeCall::Forum(forum::Call::<Runtime>::delete_posts {
            forum_user_id: 0,
            posts: BTreeMap::from_iter(vec![(
                forum::ExtendedPostId::<Runtime> { category_id: 0, thread_id: 0, post_id: 0 },
                true
            )]),
            rationale: Vec::new()
        })
    );
    pub ForumPostEntryMaxSize: u32 = map_entry_max_size::<forum::PostById::<Runtime>>();
    pub PostDeposit: Balance = single_bloat_bond_with_cleanup(
        ForumPostEntryMaxSize::get(),
        FroumPostCleanupTxFee::get(),
        DefaultStorageDepositCleanupProfit::get()
    );
    pub const ForumModuleId: PalletId = PalletId(*b"mo:forum");
    pub const PostLifeTime: BlockNumber = days!(30);
    pub const MaxStickiedThreads: u32 = 20;
}

pub struct MapLimits;
impl forum::StorageLimits for MapLimits {
    type MaxDirectSubcategoriesInCategory = MaxDirectSubcategoriesInCategory;
    type MaxModeratorsForCategory = MaxModeratorsForCategory;
    type MaxTotalCategories = MaxTotalCategories;
}

impl forum::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type ThreadId = ThreadId;
    type PostId = PostId;
    type CategoryId = u64;
    type MaxCategoryDepth = MaxCategoryDepth;
    type ThreadDeposit = ThreadDeposit;
    type PostDeposit = PostDeposit;
    type ModuleId = ForumModuleId;
    type MapLimits = MapLimits;
    type WeightInfo = forum::weights::SubstrateWeight<Runtime>;
    type WorkingGroup = ForumWorkingGroup;
    type MemberOriginValidator = Members;
    type PostLifeTime = PostLifeTime;
    type MaxStickiedThreads = MaxStickiedThreads;

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

pub struct RestrictStakingAccountsFromBonding {}

impl BondingRestriction<AccountId> for RestrictStakingAccountsFromBonding {
    fn can_bond(stash_account: &AccountId) -> bool {
        let bonding_lock_id = common::locks::STAKING_LOCK_ID;
        let existing_lock_ids: Vec<LockIdentifier> = Balances::locks(stash_account)
            .iter()
            .map(|lock| lock.id)
            .collect();
        !Runtime::are_locks_conflicting(&bonding_lock_id, &existing_lock_ids)
    }
}

parameter_types! {
    pub const ForumMaxWorkerNumberLimit: u32 = 30;
    pub const StorageMaxWorkerNumberLimit: u32 = 50;
    pub const ContentMaxWorkerNumberLimit: u32 = 30;
    pub const MembershipMaxWorkerNumberLimit: u32 = 30;
    pub const AppMaxWorkerNumberLimit: u32 = 30;
    pub const OperationsAlphaMaxWorkerNumberLimit: u32 = 30;
    pub const OperationsBetaMaxWorkerNumberLimit: u32 = 30;
    pub const OperationsGammaMaxWorkerNumberLimit: u32 = 30;
    pub const DistributionMaxWorkerNumberLimit: u32 = 50;

    pub const MinUnstakingPeriodLimit: u32 = days!(20);
    // FIXME: Periods should be the same, but rewards should start at different blocks
    pub const ForumWorkingGroupRewardPeriod: u32 = days!(1) + 10;
    pub const StorageWorkingGroupRewardPeriod: u32 = days!(1) + 20;
    pub const ContentWorkingGroupRewardPeriod: u32 = days!(1) + 30;
    pub const MembershipRewardPeriod: u32 = days!(1) + 40;
    pub const AppRewardPeriod: u32 = days!(1) + 50;
    pub const OperationsAlphaRewardPeriod: u32 = days!(1) + 60;
    pub const OperationsBetaRewardPeriod: u32 = days!(1) + 70;
    pub const OperationsGammaRewardPeriod: u32 = days!(1) + 80;
    pub const DistributionRewardPeriod: u32 = days!(1) + 90;
    // This should be more costly than `apply_on_opening` fee
    pub const MinimumApplicationStake: Balance = dollars!(20);
    // This should be more costly than `add_opening` fee
    pub const LeaderOpeningStake: Balance = dollars!(100);
}

// Make sure that one cannot leave before a slashing proposal for lead can go through.
// Will apply to other non-lead workers as well, but that is fine.
const_assert!(
    MinUnstakingPeriodLimit::get()
        >= SlashWorkingGroupLeadProposalParameters::get().voting_period
            + SlashWorkingGroupLeadProposalParameters::get().grace_period
);

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
pub type AppWorkingGroupStakingManager =
    staking_handler::StakingManager<Runtime, AppWorkingGroupLockId>;
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

// The app working group instance alias.
pub type AppWorkingGroupInstance = working_group::Instance5;

// The membership working group instance alias.
pub type MembershipWorkingGroupInstance = working_group::Instance6;

// The builder working group instance alias.
pub type OperationsWorkingGroupInstanceBeta = working_group::Instance7;

// The builder working group instance alias.
pub type OperationsWorkingGroupInstanceGamma = working_group::Instance8;

// The distribution working group instance alias.
pub type DistributionWorkingGroupInstance = working_group::Instance9;

impl working_group::Config<ForumWorkingGroupInstance> for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = ForumMaxWorkerNumberLimit;
    type StakingHandler = ForumWorkingGroupStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = ForumWorkingGroupRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = BalanceConverter;
}

impl working_group::Config<StorageWorkingGroupInstance> for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = StorageMaxWorkerNumberLimit;
    type StakingHandler = StorageWorkingGroupStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = StorageWorkingGroupRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = BalanceConverter;
}

impl working_group::Config<ContentWorkingGroupInstance> for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = ContentMaxWorkerNumberLimit;
    type StakingHandler = ContentWorkingGroupStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = ContentWorkingGroupRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = BalanceConverter;
}

impl working_group::Config<MembershipWorkingGroupInstance> for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = MembershipMaxWorkerNumberLimit;
    type StakingHandler = MembershipWorkingGroupStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = MembershipRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = BalanceConverter;
}

impl working_group::Config<OperationsWorkingGroupInstanceAlpha> for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = OperationsAlphaMaxWorkerNumberLimit;
    type StakingHandler = OperationsWorkingGroupAlphaStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = OperationsAlphaRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = BalanceConverter;
}

impl working_group::Config<AppWorkingGroupInstance> for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = AppMaxWorkerNumberLimit;
    type StakingHandler = AppWorkingGroupStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = AppRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = BalanceConverter;
}

impl working_group::Config<OperationsWorkingGroupInstanceBeta> for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = OperationsBetaMaxWorkerNumberLimit;
    type StakingHandler = OperationsWorkingGroupBetaStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = OperationsBetaRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = BalanceConverter;
}

impl working_group::Config<OperationsWorkingGroupInstanceGamma> for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = OperationsGammaMaxWorkerNumberLimit;
    type StakingHandler = OperationsWorkingGroupGammaStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = OperationsGammaRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = BalanceConverter;
}

impl working_group::Config<DistributionWorkingGroupInstance> for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type MaxWorkerNumberLimit = DistributionMaxWorkerNumberLimit;
    type StakingHandler = DistributionWorkingGroupStakingManager;
    type StakingAccountValidator = Members;
    type MemberOriginValidator = Members;
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = DistributionRewardPeriod;
    type WeightInfo = working_group::weights::SubstrateWeight<Runtime>;
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
    type VestingBalanceToBalance = BalanceConverter;
}

parameter_types! {
    pub const ProposalCancellationFee: Balance = dollars!(1);
    pub const ProposalRejectionFee: Balance = dollars!(5);
    pub const ProposalMaxActiveProposalLimit: u32 = 20;
    pub const DispatchableCallCodeMaxLen: u32 = mega_bytes!(3);
}

#[cfg(not(feature = "runtime-benchmarks"))]
parameter_types! {
    pub const ProposalTitleMaxLength: u32 = 40;
    pub const ProposalDescriptionMaxLength: u32 = 3_000;
}

// Higher limits for benchmarking for more accurate results
#[cfg(feature = "runtime-benchmarks")]
parameter_types! {
    pub const ProposalTitleMaxLength: u32 = 20_000;
    pub const ProposalDescriptionMaxLength: u32 = 20_000;
}

impl proposals_engine::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
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
    type DispatchableCallCode = RuntimeCall;
    type ProposalObserver = ProposalsCodex;
    type WeightInfo = proposals_engine::weights::SubstrateWeight<Runtime>;
    type StakingAccountValidator = Members;
    type DispatchableCallCodeMaxLen = DispatchableCallCodeMaxLen;
}

impl Default for RuntimeCall {
    fn default() -> Self {
        panic!("shouldn't call default for RuntimeCall");
    }
}

parameter_types! {
    pub const MaxWhiteListSize: u32 = 20;
    // module : proposals_discussion
    pub const ProposalsDiscussionModuleId: PalletId = PalletId(*b"mo:prdis");
    pub const ProposalsDiscussionPostLifetime: BlockNumber = hours!(1);

    // Proposal discussion post deposit related:
    pub ProposalDiscussionPostCleanupTxFee: Balance = compute_fee(
        RuntimeCall::ProposalsDiscussion(proposals_discussion::Call::<Runtime>::delete_post {
            deleter_id: 0,
            post_id: 0,
            thread_id: 0,
            hide: true,
        })
    );
    pub ProposalDiscussionPostEntryMaxSize: u32 =
        map_entry_max_size::<proposals_discussion::PostThreadIdByPostId::<Runtime>>();
    pub ProposalsPostDeposit: Balance = single_bloat_bond_with_cleanup(
        ProposalDiscussionPostEntryMaxSize::get(),
        ProposalDiscussionPostCleanupTxFee::get(),
        DefaultStorageDepositCleanupProfit::get()
    );
}

macro_rules! call_wg {
    ($working_group:ident, $function:ident $(,$x:expr)*) => {{
        match $working_group {
            WorkingGroup::Content => <ContentWorkingGroup as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
            WorkingGroup::Storage => <StorageWorkingGroup as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
            WorkingGroup::Forum => <ForumWorkingGroup as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
            WorkingGroup::Membership => <MembershipWorkingGroup as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
            WorkingGroup::App => <AppWorkingGroup as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
            WorkingGroup::Distribution => <DistributionWorkingGroup as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
            WorkingGroup::OperationsAlpha => <OperationsWorkingGroupAlpha as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
            WorkingGroup::OperationsBeta => <OperationsWorkingGroupBeta as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
            WorkingGroup::OperationsGamma => <OperationsWorkingGroupGamma as WorkingGroupBudgetHandler<AccountId, Balance>>::$function($($x,)*),
        }
    }};
}

impl proposals_discussion::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type AuthorOriginValidator = Members;
    type MembershipInfoProvider = Members;
    type CouncilOriginValidator = Council;
    type ThreadId = ThreadId;
    type PostId = PostId;
    type MaxWhiteListSize = MaxWhiteListSize;
    type WeightInfo = proposals_discussion::weights::SubstrateWeight<Runtime>;
    type PostDeposit = ProposalsPostDeposit;
    type ModuleId = ProposalsDiscussionModuleId;
    type PostLifeTime = ProposalsDiscussionPostLifetime;
}

impl joystream_utility::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;

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
    pub const RuntimeUpgradeWasmProposalMaxLength: u32 = DispatchableCallCodeMaxLen::get();
    pub const FundingRequestProposalMaxTotalAmount: Balance = dollars!(10_000);
    pub const FundingRequestProposalMaxAccounts: u32 = 20;
    pub const SetMaxValidatorCountProposalMaxValidators: u32 = 100;
}

const_assert!(
    RuntimeUpgradeWasmProposalMaxLength::get()
        <= (MaximumBlockLength::get() as u128 * NORMAL_DISPATCH_RATIO.deconstruct() as u128
            / Perbill::one().deconstruct() as u128) as u32
);

impl proposals_codex::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
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
    type DecreaseCouncilBudgetProposalParameters = DecreaseCouncilBudgetProposalParameters;
    type FundingRequestProposalMaxTotalAmount = FundingRequestProposalMaxTotalAmount;
    type FundingRequestProposalMaxAccounts = FundingRequestProposalMaxAccounts;
    type SetMaxValidatorCountProposalMaxValidators = SetMaxValidatorCountProposalMaxValidators;
    type UpdateTokenPalletTokenConstraints = UpdateTokenPalletTokenConstraints;
    type SetPalletFozenStatusProposalParameters = SetPalletFozenStatusProposalParameters;
    type SetEraPayoutDampingFactorProposalParameters = SetEraPayoutDampingFactorProposalParameters;
    type WeightInfo = proposals_codex::weights::SubstrateWeight<Runtime>;
}

impl pallet_constitution::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type WeightInfo = pallet_constitution::weights::SubstrateWeight<Runtime>;
}

parameter_types! {
    pub const BountyModuleId: PalletId = PalletId(*b"m:bounty"); // module : bounty
    pub const ClosedContractSizeLimit: u32 = 50;

    // Bounty work entry stake related:
    pub BountyWorkEntryCleanupTxFee: Balance = compute_fee(
        RuntimeCall::Bounty(bounty::Call::<Runtime>::withdraw_entrant_stake {
            member_id: 0,
            bounty_id: 0,
            entry_id: 0,
        })
    );
    pub BountyWorkEntryEntryMaxSize: u32 = map_entry_max_size::<bounty::Entries::<Runtime>>();
    pub MinWorkEntrantStake: Balance = single_bloat_bond_with_cleanup(
        BountyWorkEntryEntryMaxSize::get(),
        BountyWorkEntryCleanupTxFee::get(),
        DefaultStorageDepositCleanupProfit::get()
    );

    // Funder bloat bond related:
    pub BountyContributionCleanupTxFee: Balance = compute_fee(
        RuntimeCall::Bounty(bounty::Call::<Runtime>::withdraw_funding {
            funder: Default::default(),
            bounty_id: 0,
        })
    );
    pub BountyContributionEntryMaxSize: u32 =
        map_entry_max_size::<bounty::BountyContributions::<Runtime>>();
    pub FunderStateBloatBondAmount: Balance = single_bloat_bond_with_cleanup(
        BountyContributionEntryMaxSize::get(),
        BountyContributionCleanupTxFee::get(),
        DefaultStorageDepositCleanupProfit::get()
    );

    // Creator bloat bond related:
    pub BountyCleanupTxFee: Balance = compute_fee(
        RuntimeCall::Bounty(bounty::Call::<Runtime>::terminate_bounty {
            bounty_id: 0,
        })
    );
    pub BountyEntryMaxSize: u32 = map_entry_max_size::<bounty::Bounties::<Runtime>>();
    pub CreatorStateBloatBondAmount: Balance = single_existential_deposit_bloat_bond_with_cleanup(
        BountyEntryMaxSize::get(),
        BountyCleanupTxFee::get(),
        DefaultStorageDepositCleanupProfit::get()
    );
}

impl bounty::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type ModuleId = BountyModuleId;
    type BountyId = u64;
    type Membership = Members;
    type WeightInfo = bounty::weights::SubstrateWeight<Runtime>;
    type CouncilBudgetManager = Council;
    type StakingHandler = staking_handler::StakingManager<Self, BountyLockId>;
    type EntryId = u64;
    type ClosedContractSizeLimit = ClosedContractSizeLimit;
    type MinWorkEntrantStake = MinWorkEntrantStake;
    type FunderStateBloatBondAmount = FunderStateBloatBondAmount;
    type CreatorStateBloatBondAmount = CreatorStateBloatBondAmount;
}

parameter_types! {
    pub const MinVestedTransfer: Balance = dollars!(1);
    pub UnvestedFundsAllowedWithdrawReasons: WithdrawReasons = WithdrawReasons::empty();
}

impl pallet_vesting::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type Currency = Balances;
    type BlockNumberToBalance = ConvertInto;
    type MinVestedTransfer = MinVestedTransfer;
    type WeightInfo = weights::pallet_vesting::SubstrateWeight<Runtime>;
    type UnvestedFundsAllowedWithdrawReasons = UnvestedFundsAllowedWithdrawReasons;
    // `VestingInfo` encode length is 36bytes. 28 schedules gets encoded as 1009 bytes, which is the
    // highest number of schedules that encodes less than 2^10.
    const MAX_VESTING_SCHEDULES: u32 = 28;
}

parameter_types! {
    pub MultisigMapEntryFixedPortionByteSize: u32 = double_map_entry_fixed_byte_size::<
        pallet_multisig::Multisigs::<Runtime>, _, _, _, _, _
    >();
    // Deposit for storing one new item in Multisigs/Calls map
    pub DepositBase: Balance = compute_single_bloat_bond(
        MultisigMapEntryFixedPortionByteSize::get(),
        None
    );
    // Deposit for adding 32 bytes to an already stored item
    pub const DepositFactor: Balance = 32 * MinimumBloatBondPerByte::get();
    // Max number of multisig signatories
    pub const MaxSignatories: u16 = 100;
}

impl pallet_multisig::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type RuntimeCall = RuntimeCall;
    type Currency = Balances;
    type DepositBase = DepositBase;
    type DepositFactor = DepositFactor;
    type MaxSignatories = MaxSignatories;
    type WeightInfo = weights::pallet_multisig::SubstrateWeight<Runtime>;
}

parameter_types! {
    pub const ProxyDepositBase: Balance = dollars!(1);
    pub const ProxyDepositFactor: Balance = dollars!(1);
    pub const AnnouncementDepositBase: Balance = dollars!(1);
    pub const AnnouncementDepositFactor: Balance = dollars!(1);
}

/// The type used to represent the kinds of proxying allowed.
#[derive(
    Copy,
    Clone,
    Eq,
    PartialEq,
    Ord,
    PartialOrd,
    Encode,
    Decode,
    RuntimeDebug,
    MaxEncodedLen,
    scale_info::TypeInfo,
)]
pub enum ProxyType {
    Any,
    NonTransfer,
    Governance,
    Referendum,
    Staking,
    StorageTransactor,
}
impl Default for ProxyType {
    fn default() -> Self {
        Self::Any
    }
}
impl InstanceFilter<RuntimeCall> for ProxyType {
    fn filter(&self, c: &RuntimeCall) -> bool {
        match self {
            ProxyType::Any => true,
            ProxyType::NonTransfer => !matches!(
                c,
                RuntimeCall::Balances(..)
                    | RuntimeCall::Vesting(pallet_vesting::Call::vested_transfer { .. })
                    | RuntimeCall::Content(content::Call::initialize_channel_transfer { .. })
                    | RuntimeCall::Content(content::Call::buy_nft { .. })
                    | RuntimeCall::ProjectToken(project_token::Call::transfer { .. })
            ),
            ProxyType::Governance => matches!(
                c,
                RuntimeCall::Council(..)
                    | RuntimeCall::Referendum(..)
                    | RuntimeCall::ProposalsEngine(..)
            ),
            ProxyType::Referendum => matches!(
                c,
                RuntimeCall::Referendum(referendum::Call::vote { .. })
                    | RuntimeCall::Referendum(referendum::Call::reveal_vote { .. })
                    | RuntimeCall::Referendum(referendum::Call::release_vote_stake { .. })
            ),
            ProxyType::Staking => matches!(c, RuntimeCall::Staking(..)),
            ProxyType::StorageTransactor => matches!(
                c,
                RuntimeCall::Storage(storage::Call::accept_pending_data_objects { .. })
            ),
        }
    }
    fn is_superset(&self, o: &Self) -> bool {
        match (self, o) {
            (x, y) if x == y => true,
            (ProxyType::Any, _) => true,
            (_, ProxyType::Any) => false,
            (ProxyType::NonTransfer, _) => true,
            _ => false,
        }
    }
}

impl pallet_proxy::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type RuntimeCall = RuntimeCall;
    type Currency = Balances;
    type ProxyType = ProxyType;
    type ProxyDepositBase = ProxyDepositBase;
    type ProxyDepositFactor = ProxyDepositFactor;
    type MaxProxies = ConstU32<32>;
    type WeightInfo = weights::pallet_proxy::SubstrateWeight<Runtime>;
    type MaxPending = ConstU32<32>;
    type CallHasher = BlakeTwo256;
    type AnnouncementDepositBase = AnnouncementDepositBase;
    type AnnouncementDepositFactor = AnnouncementDepositFactor;
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
        RandomnessCollectiveFlip: pallet_insecure_randomness_collective_flip,
        VoterList: pallet_bags_list::<Instance1>::{Pallet, Call, Storage, Event<T>},
        Vesting: pallet_vesting,
        Multisig: pallet_multisig,
        // Joystream
        Council: council::{Pallet, Call, Storage, Event<T>, Config<T>},
        Referendum: referendum::<Instance1>::{Pallet, Call, Storage, Event<T>},
        Members: membership::{Pallet, Call, Storage, Event<T>, Config},
        Forum: forum::{Pallet, Call, Storage, Event<T>, Config<T>},
        Constitution: pallet_constitution::{Pallet, Call, Storage, Event<T>},
        Bounty: bounty::{Pallet, Call, Storage, Event<T>},
        JoystreamUtility: joystream_utility::{Pallet, Call, Storage, Event<T>},
        Content: content::{Pallet, Call, Storage, Event<T>, Config<T>},
        Storage: storage::{Pallet, Call, Storage, Event<T>, Config<T>},
        ProjectToken: project_token::{Pallet, Call, Storage, Event<T>, Config<T>},
        // --- Proposals
        ProposalsEngine: proposals_engine::{Pallet, Call, Storage, Event<T>},
        ProposalsDiscussion: proposals_discussion::{Pallet, Call, Storage, Event<T>, Config},
        ProposalsCodex: proposals_codex::{Pallet, Call, Storage, Event<T>},
        // --- Working groups
        ForumWorkingGroup: working_group::<Instance1>::{Pallet, Call, Storage, Event<T>},
        StorageWorkingGroup: working_group::<Instance2>::{Pallet, Call, Storage, Event<T>},
        ContentWorkingGroup: working_group::<Instance3>::{Pallet, Call, Storage, Event<T>},
        OperationsWorkingGroupAlpha: working_group::<Instance4>::{Pallet, Call, Storage, Event<T>},
        AppWorkingGroup: working_group::<Instance5>::{Pallet, Call, Storage, Event<T>},
        MembershipWorkingGroup: working_group::<Instance6>::{Pallet, Call, Storage, Event<T>},
        OperationsWorkingGroupBeta: working_group::<Instance7>::{Pallet, Call, Storage, Event<T>},
        OperationsWorkingGroupGamma: working_group::<Instance8>::{Pallet, Call, Storage, Event<T>},
        DistributionWorkingGroup: working_group::<Instance9>::{Pallet, Call, Storage, Event<T>},
        Proxy: pallet_proxy,
    }
);

#[cfg(all(test, feature = "try-runtime"))]
mod remote_tests {
    use super::*;
    use frame_try_runtime::{runtime_decl_for_try_runtime::TryRuntimeV1, UpgradeCheckSelect};
    use remote_externalities::{
        Builder, Mode, OfflineConfig, OnlineConfig, SnapshotConfig, Transport,
    };
    use std::env::var;

    #[tokio::test]
    async fn run_migrations() {
        if var("RUN_MIGRATION_TESTS").is_err() {
            return;
        }

        sp_tracing::try_init_simple();
        let transport: Transport = var("WS")
            .unwrap_or("wss://rpc.joystream.org:443".to_string())
            .into();
        let maybe_state_snapshot: Option<SnapshotConfig> = var("SNAP").map(|s| s.into()).ok();
        let mut ext = Builder::<Block>::default()
            .mode(if let Some(state_snapshot) = maybe_state_snapshot {
                Mode::OfflineOrElseOnline(
                    OfflineConfig {
                        state_snapshot: state_snapshot.clone(),
                    },
                    OnlineConfig {
                        transport,
                        state_snapshot: Some(state_snapshot),
                        ..Default::default()
                    },
                )
            } else {
                Mode::Online(OnlineConfig {
                    transport,
                    ..Default::default()
                })
            })
            .build()
            .await
            .unwrap();
        ext.execute_with(|| Runtime::on_runtime_upgrade(UpgradeCheckSelect::PreAndPost));
    }
}
