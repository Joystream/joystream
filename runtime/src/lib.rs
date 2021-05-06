// This file is part of Acala.

// Copyright (C) 2020-2021 Acala Foundation.
// SPDX-License-Identifier: GPL-3.0-or-later WITH Classpath-exception-2.0

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

//! The Dev runtime. This can be compiled with `#[no_std]`, ready for Wasm.

#![cfg_attr(not(feature = "std"), no_std)]
// `construct_runtime!` does a lot of recursion and requires us to increase the limit to 256.
#![recursion_limit = "256"]
// The `large_enum_variant` warning originates from `construct_runtime` macro.
#![allow(clippy::large_enum_variant)]
#![allow(clippy::unnecessary_mut_passed)]
#![allow(clippy::or_fun_call)]
#![allow(clippy::from_over_into)]
#![allow(clippy::upper_case_acronyms)]

// Make the WASM binary available.
#[cfg(feature = "std")]
include!(concat!(env!("OUT_DIR"), "/wasm_binary.rs"));

#[cfg(feature = "std")]
/// Wasm binary unwrapped. If built with `BUILD_DUMMY_WASM_BINARY`, the function panics.
pub fn wasm_binary_unwrap() -> &'static [u8] {
    WASM_BINARY.expect(
        "Development wasm binary is not available. This means the client is \
        built with `BUILD_DUMMY_WASM_BINARY` flag and it is only usable for \
        production chains. Please rebuild with the flag disabled.",
    )
}

mod constants;
mod integration;
pub mod primitives;
mod runtime_api;
#[cfg(test)]
mod tests; // Runtime integration tests
mod weights;

use codec::{Decode, Encode};
pub use frame_support::{
    construct_runtime, log, parameter_types,
    traits::{
        All, Contains, EnsureOrigin, Filter, Get, IsInVec, IsType, KeyOwnerProofSystem,
        LockIdentifier, Randomness, U128CurrencyToVote, WithdrawReasons,
    },
    weights::{
        constants::{BlockExecutionWeight, ExtrinsicBaseWeight, RocksDbWeight, WEIGHT_PER_SECOND},
        DispatchClass, IdentityFee, Weight,
    },
    StorageValue,
};
use frame_system::{
    limits::{BlockLength, BlockWeights},
    EnsureOneOf, EnsureRoot, RawOrigin,
};
use pallet_im_online::sr25519::AuthorityId as ImOnlineId;
use pallet_session::historical as pallet_session_historical;
use pallet_transaction_payment::{FeeDetails, RuntimeDispatchInfo};
use sp_api::impl_runtime_apis;
use sp_authority_discovery::AuthorityId as AuthorityDiscoveryId;
use sp_core::{
    crypto::KeyTypeId,
    u32_trait::{_1, _2, _3, _4},
    OpaqueMetadata, H160,
};
use sp_runtime::{
    create_runtime_str, generic, impl_opaque_keys,
    traits::{
        AccountIdConversion, AccountIdLookup, BadOrigin, BlakeTwo256, Block as BlockT,
        SaturatedConversion, StaticLookup, Zero,
    },
    transaction_validity::{TransactionSource, TransactionValidity},
    ApplyExtrinsicResult, DispatchResult, FixedPointNumber, MultiAddress,
};
use sp_std::prelude::*;

pub use constants::*;
pub use primitives::*;
pub use runtime_api::*;

#[cfg(feature = "std")]
use sp_version::NativeVersion;
use sp_version::RuntimeVersion;

use integration::proposals::{CouncilManager, ExtrinsicProposalEncoder, MembershipOriginValidator};

use governance::{council, election};
use storage::data_object_storage_registry;

// Node dependencies
pub use common;
pub use forum;
pub use governance::election_params::ElectionParameters;
pub use membership;
#[cfg(any(feature = "std", test))]
pub use pallet_balances::Call as BalancesCall;
pub use proposals_codex::ProposalsConfigParameters;
use storage::data_directory::Voucher;
pub use storage::{data_directory, data_object_type_registry};
pub use working_group;

pub use content;
pub use content::MaxNumber;

#[cfg(any(feature = "std", test))]
pub use pallet_staking::StakerStatus;

#[cfg(feature = "standalone")]
use standalone_use::*;
#[cfg(feature = "standalone")]
mod standalone_use {
    pub use pallet_grandpa::{AuthorityId as GrandpaId, AuthorityList as GrandpaAuthorityList};
    pub use pallet_session::historical as pallet_session_historical;
    pub use pallet_staking::StakerStatus;
    pub use sp_runtime::{
        curve::PiecewiseLinear,
        traits::{NumberFor, OpaqueKeys},
        transaction_validity::TransactionPriority,
    };
}

#[cfg(not(feature = "standalone"))]
use parachain_use::*;
#[cfg(not(feature = "standalone"))]
mod parachain_use {
    pub use cumulus_primitives_core::ParaId;
    pub use polkadot_parachain::primitives::Sibling;
    pub use sp_runtime::traits::{Convert, Identity};
    pub use sp_std::collections::btree_set::BTreeSet;
    pub use xcm::v0::{
        Junction::{GeneralKey, Parachain, Parent},
        MultiAsset,
        MultiLocation::{self, X1, X2, X3},
        NetworkId, Xcm,
    };
    pub use xcm_builder::{
        AccountId32Aliases, AllowTopLevelPaidExecutionFrom, AllowUnpaidExecutionFrom,
        CurrencyAdapter, EnsureXcmOrigin, FixedRateOfConcreteFungible, FixedWeightBounds,
        IsConcrete, LocationInverter, NativeAsset, ParentAsSuperuser, ParentIsDefault,
        RelayChainAsNative, SiblingParachainAsNative, SiblingParachainConvertsVia,
        SignedAccountId32AsNative, SovereignSignedViaLocation, TakeWeightCredit,
    };
    pub use xcm_executor::{Config, XcmExecutor};
}

pub use pallet_timestamp::Call as TimestampCall;
#[cfg(any(feature = "std", test))]
pub use sp_runtime::BuildStorage;
pub use sp_runtime::{Perbill, Percent, Permill, Perquintill};

pub use primitives::{AccountId, AccountIndex, Balance, BlockNumber, Hash, Moment, Signature};

/// Opaque types. These are used by the CLI to instantiate machinery that don't need to know
/// the specifics of the runtime. They can then be made to be agnostic over specific formats
/// of data like extrinsics, allowing for them to continue syncing the network through upgrades
/// to even the core data structures.
pub mod opaque {
    use super::*;

    pub use sp_runtime::OpaqueExtrinsic as UncheckedExtrinsic;

    /// Opaque block type.
    pub type Block = generic::Block<Header, UncheckedExtrinsic>;

    pub type SessionHandlers = ();

    impl_opaque_keys! {
        pub struct SessionKeys {}
    }
}

/// This runtime version.
pub const VERSION: RuntimeVersion = RuntimeVersion {
    spec_name: create_runtime_str!("joystream-node"),
    impl_name: create_runtime_str!("joystream-node"),
    authoring_version: 9,
    spec_version: 4,
    impl_version: 0,
    apis: crate::runtime_api::EXPORTED_RUNTIME_API_VERSIONS,
    transaction_version: 1,
};

/// The version infromation used to identify this runtime when compiled
/// natively.
#[cfg(feature = "std")]
pub fn native_version() -> NativeVersion {
    NativeVersion {
        runtime_version: VERSION,
        can_author_with: Default::default(),
    }
}

#[cfg(not(feature = "standalone"))]
impl_opaque_keys! {
    pub struct SessionKeys {}
}

/// We assume that ~10% of the block weight is consumed by `on_initalize` handlers.
/// This is used to limit the maximal weight of a single extrinsic.
const AVERAGE_ON_INITIALIZE_RATIO: Perbill = Perbill::from_percent(10);
/// We allow `Normal` extrinsics to fill up the block up to 75%, the rest can be used
/// by  Operational  extrinsics.
const NORMAL_DISPATCH_RATIO: Perbill = Perbill::from_percent(75);
/// We allow for 0.5 seconds of compute with a 6 second average block time.
const MAXIMUM_BLOCK_WEIGHT: Weight = WEIGHT_PER_SECOND / 2;

parameter_types! {
    pub const BlockHashCount: BlockNumber = 900; // mortal tx can be valid up to 1 hour after signing
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
    pub const SS58Prefix: u8 = 42; // Ss58AddressFormat::SubstrateAccount
}

impl frame_system::Config for Runtime {
    /// The basic call filter to use in dispatchable.
    type BaseCallFilter = ();
    /// Block & extrinsics weights: base values and limits.
    type BlockWeights = RuntimeBlockWeights;
    /// The maximum length of a block (in bytes).
    type BlockLength = RuntimeBlockLength;
    /// The identifier used to distinguish between accounts.
    type AccountId = AccountId;
    /// The aggregated dispatch type that is available for extrinsics.
    type Call = Call;
    /// The lookup mechanism to get account ID from whatever is passed in dispatchers.
    type Lookup = AccountIdLookup<AccountId, ()>;
    /// The index type for storing how many extrinsics an account has signed.
    type Index = Index;
    /// The index type for blocks.
    type BlockNumber = BlockNumber;
    /// The type for hashing blocks and tries.
    type Hash = Hash;
    /// The hashing algorithm used.
    type Hashing = BlakeTwo256;
    /// The header type.
    type Header = generic::Header<BlockNumber, BlakeTwo256>;
    /// The ubiquitous event type.
    type Event = Event;
    /// The ubiquitous origin type.
    type Origin = Origin;
    /// Maximum number of block number to block hash mappings to keep (oldest pruned first).
    type BlockHashCount = BlockHashCount;
    /// The weight of database operations that the runtime can invoke.
    type DbWeight = RocksDbWeight;
    /// Version of the runtime.
    type Version = Version;
    /// Converts a Pallet to the index of the Pallet in `construct_runtime!`.
    ///
    /// This type is being generated by `construct_runtime!`.
    type PalletInfo = PalletInfo;
    /// What to do if a new account is created.
    type OnNewAccount = ();
    /// What to do if an account is fully reaped from the system.
    type OnKilledAccount = ();
    /// The data to be stored in an account.
    type AccountData = pallet_balances::AccountData<Balance>;
    /// Weight information for the extrinsics of this pallet.
    type SystemWeightInfo = ();
    /// This is used as an identifier of the chain. 42 is the generic substrate prefix.
    type SS58Prefix = SS58Prefix;
    #[cfg(feature = "standalone")]
    type OnSetCode = ();
    #[cfg(not(feature = "standalone"))]
    type OnSetCode = cumulus_pallet_parachain_system::ParachainSetCode<Self>;
}

impl substrate_utility::Config for Runtime {
    type Event = Event;
    type Call = Call;
    type WeightInfo = weights::substrate_utility::WeightInfo;
}

parameter_types! {
    pub const MinimumPeriod: u64 = SLOT_DURATION / 2;
}

impl pallet_timestamp::Config for Runtime {
    /// A timestamp: milliseconds since the unix epoch.
    type Moment = Moment;
    type OnTimestampSet = ();
    // type OnTimestampSet = Babe;
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

parameter_types! {
    pub const NativeTokenExistentialDeposit: Balance = 0;
    // For weight estimation, we assume that the most locks on an individual account will be 50.
    // This number may need to be adjusted in the future if this assumption no longer holds true.
    pub const MaxLocks: u32 = 50;
}

impl pallet_balances::Config for Runtime {
    type Balance = Balance;
    type DustRemoval = ();
    type Event = Event;
    type ExistentialDeposit = NativeTokenExistentialDeposit;
    type AccountStore = frame_system::Pallet<Runtime>;
    type MaxLocks = MaxLocks;
    type WeightInfo = ();
}

impl pallet_sudo::Config for Runtime {
    type Event = Event;
    type Call = Call;
}

#[cfg(feature = "standalone")]
impl pallet_authority_discovery::Config for Runtime {}

parameter_types! {
    pub const MaxNumberOfCuratorsPerGroup: MaxNumber = 50;
    pub const ChannelOwnershipPaymentEscrowId: [u8; 8] = *b"chescrow";
}

impl content::Config for Runtime {
    type Event = Event;
    type ChannelOwnershipPaymentEscrowId = ChannelOwnershipPaymentEscrowId;
    type ChannelCategoryId = ChannelCategoryId;
    type VideoId = VideoId;
    type VideoCategoryId = VideoCategoryId;
    type PlaylistId = PlaylistId;
    type PersonId = PersonId;
    type SeriesId = SeriesId;
    type ChannelOwnershipTransferRequestId = ChannelOwnershipTransferRequestId;
    type MaxNumberOfCuratorsPerGroup = MaxNumberOfCuratorsPerGroup;
    type StorageSystem = data_directory::Pallet<Self>;
}

impl hiring::Config for Runtime {
    type OpeningId = u64;
    type ApplicationId = u64;
    type ApplicationDeactivatedHandler = (); // TODO - what needs to happen?
    type StakeHandlerProvider = hiring::Pallet<Self>;
}

impl minting::Config for Runtime {
    type Currency = <Self as common::currency::GovernanceCurrency>::Currency;
    type MintId = u64;
}

impl recurring_rewards::Config for Runtime {
    type PayoutStatusHandler = (); // TODO - deal with successful and failed payouts
    type RecipientId = u64;
    type RewardRelationshipId = u64;
}

parameter_types! {
    pub const StakePoolId: [u8; 8] = *b"joystake";
}

impl stake::Config for Runtime {
    type Currency = <Self as common::currency::GovernanceCurrency>::Currency;
    type StakePoolId = StakePoolId;
    type StakingEventsHandler = (
        crate::integration::proposals::StakingEventsHandler<Self>,
        (
            crate::integration::working_group::ContentDirectoryWGStakingEventsHandler<Self>,
            crate::integration::working_group::StorageWgStakingEventsHandler<Self>,
        ),
    );
    type StakeId = u64;
    type SlashId = u64;
}

impl common::currency::GovernanceCurrency for Runtime {
    type Currency = pallet_balances::Pallet<Self>;
}

impl common::MembershipTypes for Runtime {
    type MemberId = MemberId;
    type ActorId = ActorId;
}

impl common::StorageOwnership for Runtime {
    type ChannelId = ChannelId;
    type DAOId = DAOId;
    type ContentId = ContentId;
    type DataObjectTypeId = DataObjectTypeId;
}

impl governance::election::Config for Runtime {
    type Event = Event;
    type CouncilElected = (Council, integration::proposals::CouncilElectedHandler);
}

impl governance::council::Config for Runtime {
    type Event = Event;
    type CouncilTermEnded = (CouncilElection,);
}

impl memo::Config for Runtime {
    type Event = Event;
}

parameter_types! {
    pub const DefaultVoucher: Voucher = Voucher::new(5000, 50);
}

impl storage::data_object_type_registry::Config for Runtime {
    type Event = Event;
}

impl storage::data_directory::Config for Runtime {
    type Event = Event;
    type IsActiveDataObjectType = DataObjectTypeRegistry;
    type MemberOriginValidator = MembershipOriginValidator<Self>;
}

impl storage::data_object_storage_registry::Config for Runtime {
    type Event = Event;
    type DataObjectStorageRelationshipId = u64;
    type ContentIdExists = DataDirectory;
}

parameter_types! {
    pub const ScreenedMemberMaxInitialBalance: u128 = 5000;
}

impl membership::Config for Runtime {
    type Event = Event;
    type MemberId = MemberId;
    type PaidTermId = u64;
    type SubscriptionId = u64;
    type ActorId = ActorId;
    type ScreenedMemberMaxInitialBalance = ScreenedMemberMaxInitialBalance;
}

impl forum::Config for Runtime {
    type Event = Event;
    type MembershipRegistry = integration::forum::ShimMembershipRegistry;
    type ThreadId = ThreadId;
    type PostId = PostId;
}

// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;

// The content directory working group instance alias.
pub type ContentDirectoryWorkingGroupInstance = working_group::Instance3;

// The builder working group instance alias.
pub type OperationsWorkingGroupInstance = working_group::Instance4;

// The gateway working group instance alias.
pub type GatewayWorkingGroupInstance = working_group::Instance5;

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 100;
}

impl working_group::Config<StorageWorkingGroupInstance> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
}

impl working_group::Config<ContentDirectoryWorkingGroupInstance> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
}

impl working_group::Config<OperationsWorkingGroupInstance> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
}

impl working_group::Config<GatewayWorkingGroupInstance> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
}

parameter_types! {
    pub const ProposalCancellationFee: u64 = 10000;
    pub const ProposalRejectionFee: u64 = 5000;
    pub const ProposalTitleMaxLength: u32 = 40;
    pub const ProposalDescriptionMaxLength: u32 = 3000;
    pub const ProposalMaxActiveProposalLimit: u32 = 20;
}

impl proposals_engine::Config for Runtime {
    type Event = Event;
    type ProposerOriginValidator = MembershipOriginValidator<Self>;
    type VoterOriginValidator = CouncilManager<Self>;
    type TotalVotersCounter = CouncilManager<Self>;
    type ProposalId = u32;
    type StakeHandlerProvider = proposals_engine::DefaultStakeHandlerProvider;
    type CancellationFee = ProposalCancellationFee;
    type RejectionFee = ProposalRejectionFee;
    type TitleMaxLength = ProposalTitleMaxLength;
    type DescriptionMaxLength = ProposalDescriptionMaxLength;
    type MaxActiveProposalLimit = ProposalMaxActiveProposalLimit;
    type DispatchableCallCode = Call;
}
impl Default for Call {
    fn default() -> Self {
        panic!("shouldn't call default for Call");
    }
}

parameter_types! {
    pub const ProposalMaxPostEditionNumber: u32 = 0; // post update is disabled
    pub const ProposalMaxThreadInARowNumber: u32 = 100_000; // will not be used
    pub const ProposalThreadTitleLengthLimit: u32 = 40;
    pub const ProposalPostLengthLimit: u32 = 1000;
}

impl proposals_discussion::Config for Runtime {
    type Event = Event;
    type PostAuthorOriginValidator = MembershipOriginValidator<Self>;
    type ThreadId = ThreadId;
    type PostId = PostId;
    type MaxPostEditionNumber = ProposalMaxPostEditionNumber;
    type ThreadTitleLengthLimit = ProposalThreadTitleLengthLimit;
    type PostLengthLimit = ProposalPostLengthLimit;
    type MaxThreadInARowNumber = ProposalMaxThreadInARowNumber;
}

parameter_types! {
    pub const TextProposalMaxLength: u32 = 5_000;
    pub const RuntimeUpgradeWasmProposalMaxLength: u32 = 3_000_000;
}

impl proposals_codex::Config for Runtime {
    type MembershipOriginValidator = MembershipOriginValidator<Self>;
    type TextProposalMaxLength = TextProposalMaxLength;
    type RuntimeUpgradeWasmProposalMaxLength = RuntimeUpgradeWasmProposalMaxLength;
    type ProposalEncoder = ExtrinsicProposalEncoder;
}

parameter_types! {
    pub const TombstoneDeposit: Balance = 1; // TODO: adjust fee
    pub const RentByteFee: Balance = 1; // TODO: adjust fee
    pub const RentDepositOffset: Balance = 0; // no rent deposit
    pub const SurchargeReward: Balance = 0; // no reward
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
    pub const TransactionByteFee: Balance = 0; // TODO: adjust fee
}

impl pallet_transaction_payment::Config for Runtime {
    type OnChargeTransaction = pallet_transaction_payment::CurrencyAdapter<Balances, ()>;
    type TransactionByteFee = TransactionByteFee;
    type WeightToFee = IdentityFee<Balance>;
    type FeeMultiplierUpdate = ();
}

#[cfg(feature = "standalone")]
pub use standalone_impl::*;

#[cfg(feature = "standalone")]
mod standalone_impl {
    use super::*;

    parameter_types! {
        pub const EpochDuration: u64 = EPOCH_DURATION_IN_SLOTS;
        pub const ExpectedBlockTime: Moment = MILLISECS_PER_BLOCK;
        pub const ReportLongevity: u64 =
            BondingDuration::get() as u64 * SessionsPerEra::get() as u64 *
    EpochDuration::get(); }

    /// The BABE epoch configuration at genesis.
    pub const BABE_GENESIS_EPOCH_CONFIG: sp_consensus_babe::BabeEpochConfiguration =
        sp_consensus_babe::BabeEpochConfiguration {
            c: PRIMARY_PROBABILITY,
            allowed_slots: sp_consensus_babe::AllowedSlots::PrimaryAndSecondaryPlainSlots,
        };

    impl_opaque_keys! {
        pub struct SessionKeys {
            pub grandpa: Grandpa,
            pub babe: Babe,
            pub im_online: ImOnline,
            pub authority_discovery: AuthorityDiscovery,
        }
    }

    impl pallet_babe::Config for Runtime {
        type EpochDuration = EpochDuration;
        type ExpectedBlockTime = ExpectedBlockTime;
        type EpochChangeTrigger = pallet_babe::ExternalTrigger;
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
            pallet_babe::EquivocationHandler<Self::KeyOwnerIdentification, (), ReportLongevity>;
        type WeightInfo = ();
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

        type HandleEquivocation =
            pallet_grandpa::EquivocationHandler<Self::KeyOwnerIdentification, (), ReportLongevity>; // Offences

        type WeightInfo = ();
    }

    parameter_types! {
        pub const UncleGenerations: BlockNumber = 5;
    }

    impl pallet_authorship::Config for Runtime {
        type FindAuthor = pallet_session::FindAccountFromAuthorIndex<Self, Babe>;
        type UncleGenerations = UncleGenerations;
        type FilterUncle = ();
        type EventHandler = (Staking, ()); // ImOnline
    }

    parameter_types! {
        pub const DisabledValidatorsThreshold: Perbill = Perbill::from_percent(17);
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
        type DisabledValidatorsThreshold = DisabledValidatorsThreshold;
        type WeightInfo = ();
    }

    impl pallet_session::historical::Config for Runtime {
        type FullIdentification = pallet_staking::Exposure<AccountId, Balance>;
        type FullIdentificationOf = pallet_staking::ExposureOf<Runtime>;
    }

    parameter_types! {
        pub OffencesWeightSoftLimit: Weight = Perbill::from_percent(60) * MaximumBlockWeight::get();
    }

    impl pallet_offences::Config for Runtime {
        type Event = Event;
        type IdentificationTuple = pallet_session::historical::IdentificationTuple<Self>;
        type OnOffenceHandler = Staking;
        type WeightSoftLimit = OffencesWeightSoftLimit;
    }

    parameter_types! {
        pub const SessionDuration: BlockNumber = EPOCH_DURATION_IN_SLOTS as _;
        pub const ImOnlineUnsignedPriority: TransactionPriority = TransactionPriority::max_value();
        /// We prioritize im-online heartbeats over election solution submission.
        pub const StakingUnsignedPriority: TransactionPriority = TransactionPriority::max_value() / 2;
    }

    impl pallet_im_online::Config for Runtime {
        type AuthorityId = ImOnlineId;
        type Event = Event;
        type SessionDuration = SessionDuration;
        type ReportUnresponsiveness = Offences;
        // Using the default weights until we check if we can run the benchmarks for this pallet in
        // the reference machine in an acceptable time.
        type WeightInfo = ();
        type UnsignedPriority = ImOnlineUnsignedPriority;
    }

    parameter_types! {
        pub const SessionsPerEra: sp_staking::SessionIndex = 6;
        pub const BondingDuration: pallet_staking::EraIndex = BONDING_DURATION;
        pub const SlashDeferDuration: pallet_staking::EraIndex = BONDING_DURATION - 1; // 'slightly less' than the bonding duration.
        pub const RewardCurve: &'static PiecewiseLinear<'static> = &REWARD_CURVE;
        pub const MaxNominatorRewardedPerValidator: u32 = 64;
        pub const ElectionLookahead: BlockNumber = EPOCH_DURATION_IN_BLOCKS / 4;
        pub const MaxIterations: u32 = 10;
        // 0.05%. The higher the value, the more strict solution acceptance becomes.
        pub MinSolutionScoreBump: Perbill = Perbill::from_rational_approximation(5u32, 10_000);
    }

    impl pallet_staking::Config for Runtime {
        type Currency = Balances;
        type UnixTime = Timestamp;
        type CurrencyToVote = common::currency::CurrencyToVoteHandler;
        type RewardRemainder = (); // Could be Treasury.
        type Event = Event;
        type Slash = (); // Where to send the slashed funds. Could be Treasury.
        type Reward = (); // Rewards are minted from the void.
        type SessionsPerEra = SessionsPerEra;
        type BondingDuration = BondingDuration;
        type SlashDeferDuration = SlashDeferDuration;
        type SlashCancelOrigin = EnsureRoot<AccountId>; // Requires sudo. Parity recommends: a super-majority of the council can cancel the slash.
        type SessionInterface = Self;
        type RewardCurve = RewardCurve;
        type NextNewSession = Session;
        type ElectionLookahead = ElectionLookahead;
        type MaxIterations = MaxIterations;
        type MinSolutionScoreBump = MinSolutionScoreBump;
        type MaxNominatorRewardedPerValidator = MaxNominatorRewardedPerValidator;
        type UnsignedPriority = StakingUnsignedPriority;
        type WeightInfo = weights::pallet_staking::WeightInfo;
    }

    pallet_staking_reward_curve::build! {
        const REWARD_CURVE: PiecewiseLinear<'static> = curve!(
            min_inflation: 0_025_000,
            max_inflation: 0_100_000,
            ideal_stake: 0_500_000,
            falloff: 0_050_000,
            max_piece_count: 40,
            test_precision: 0_005_000,
        );
    }

    parameter_types! {
        // phase durations. 1/4 of the last session for each.
        pub const SignedPhase: u32 = EPOCH_DURATION_IN_BLOCKS / 4;
        pub const UnsignedPhase: u32 = EPOCH_DURATION_IN_BLOCKS / 4;

        // fallback: no need to do on-chain phragmen initially.
        pub const Fallback: pallet_election_provider_multi_phase::FallbackStrategy =
            pallet_election_provider_multi_phase::FallbackStrategy::Nothing;

        pub SolutionImprovementThreshold: Perbill = Perbill::from_rational(1u32, 10_000);

        // miner configs
        pub const MultiPhaseUnsignedPriority: TransactionPriority = StakingUnsignedPriority::get() - 1u64;
        pub const MinerMaxIterations: u32 = 10;
        pub MinerMaxWeight: Weight = RuntimeBlockWeights::get()
            .get(DispatchClass::Normal)
            .max_extrinsic.expect("Normal extrinsics have a weight limit configured; qed")
            .saturating_sub(BlockExecutionWeight::get());
    }

    sp_npos_elections::generate_solution_type!(
        #[compact]
        pub struct NposCompactSolution16::<
            VoterIndex = u32,
            TargetIndex = u16,
            Accuracy = sp_runtime::PerU16,
        >(16)
    );

    pub const MAX_NOMINATIONS: u32 =
        <NposCompactSolution16 as sp_npos_elections::CompactSolution>::LIMIT as u32;
}

#[cfg(not(feature = "standalone"))]
pub use parachain_impl::*;
#[cfg(not(feature = "standalone"))]
mod parachain_impl {
    use super::*;

    parameter_types! {
        pub const ReservedXcmpWeight: Weight = MAXIMUM_BLOCK_WEIGHT / 4;
    }

    impl cumulus_pallet_parachain_system::Config for Runtime {
        type Event = Event;
        type OnValidationData = ();
        type SelfParaId = parachain_info::Pallet<Runtime>;
        type DownwardMessageHandlers = cumulus_primitives_utility::UnqueuedDmpAsParent<
            MaxDownwardMessageWeight,
            XcmExecutor<XcmConfig>,
            Call,
        >;
        type OutboundXcmpMessageSource = XcmpQueue;
        type XcmpMessageHandler = XcmpQueue;
        type ReservedXcmpWeight = ReservedXcmpWeight;
    }

    impl parachain_info::Config for Runtime {}

    parameter_types! {
        pub const RococoLocation: MultiLocation = MultiLocation::X1(Parent);
        pub const RococoNetwork: NetworkId = NetworkId::Polkadot;
        pub RelayChainOrigin: Origin = cumulus_pallet_xcm::Origin::Relay.into();
        pub Ancestry: MultiLocation = Parachain {
            id: ParachainInfo::parachain_id().into()
        }.into();
    }

    /// Type for specifying how a `MultiLocation` can be converted into an `AccountId`. This is used
    /// when determining ownership of accounts for asset transacting and when attempting to use XCM
    /// `Transact` in order to determine the dispatch Origin.
    pub type LocationToAccountId = (
        // The parent (Relay-chain) origin converts to the default `AccountId`.
        ParentIsDefault<AccountId>,
        // Sibling parachain origins convert to AccountId via the `ParaId::into`.
        SiblingParachainConvertsVia<Sibling, AccountId>,
        // Straight up local `AccountId32` origins just alias directly to `AccountId`.
        AccountId32Aliases<RococoNetwork, AccountId>,
    );

    /// Means for transacting assets on this chain.
    pub type LocalAssetTransactor = CurrencyAdapter<
        // Use this currency:
        Balances,
        // Use this currency when it is a fungible asset matching the given location or name:
        IsConcrete<RococoLocation>,
        // Do a simple punn to convert an AccountId32 MultiLocation into a native chain account ID:
        LocationToAccountId,
        // Our chain's account ID type (we can't get away without mentioning it explicitly):
        AccountId,
    >;

    /// This is the type we use to convert an (incoming) XCM origin into a local `Origin` instance,
    /// ready for dispatching a transaction with Xcm's `Transact`. There is an `OriginKind` which can
    /// biases the kind of local `Origin` it will become.
    pub type XcmOriginToTransactDispatchOrigin = (
        // Sovereign account converter; this attempts to derive an `AccountId` from the origin location
        // using `LocationToAccountId` and then turn that into the usual `Signed` origin. Useful for
        // foreign chains who want to have a local sovereign account on this chain which they control.
        SovereignSignedViaLocation<LocationToAccountId, Origin>,
        // Native converter for Relay-chain (Parent) location; will converts to a `Relay` origin when
        // recognised.
        RelayChainAsNative<RelayChainOrigin, Origin>,
        // Native converter for sibling Parachains; will convert to a `SiblingPara` origin when
        // recognised.
        SiblingParachainAsNative<cumulus_pallet_xcm::Origin, Origin>,
        // Superuser converter for the Relay-chain (Parent) location. This will allow it to issue a
        // transaction from the Root origin.
        ParentAsSuperuser<Origin>,
        // Native signed account converter; this just converts an `AccountId32` origin into a normal
        // `Origin::Signed` origin of the same 32-byte value.
        SignedAccountId32AsNative<RococoNetwork, Origin>,
    );

    parameter_types! {
        pub UnitWeightCost: Weight = 1_000;
    }

    parameter_types! {
        // 1_000_000_000_000 => 1 unit of asset for 1 unit of Weight.
        // TODO: Should take the actual weight price. This is just 1_000 ROC per second of weight.
        pub const WeightPrice: (MultiLocation, u128) = (MultiLocation::X1(Parent), 1_000);
        pub AllowUnpaidFrom: Vec<MultiLocation> = vec![ MultiLocation::X1(Parent) ];
    }

    pub type Barrier = (
        TakeWeightCredit,
        AllowTopLevelPaidExecutionFrom<All<MultiLocation>>,
        AllowUnpaidExecutionFrom<IsInVec<AllowUnpaidFrom>>, // <- Parent gets free execution
    );

    pub struct XcmConfig;
    impl Config for XcmConfig {
        type Call = Call;
        type XcmSender = XcmRouter;
        // How to withdraw and deposit an asset.
        type AssetTransactor = LocalAssetTransactor;
        type OriginConverter = XcmOriginToTransactDispatchOrigin;
        type IsReserve = NativeAsset;
        type IsTeleporter = NativeAsset; // <- should be enough to allow teleportation of ROC
        type LocationInverter = LocationInverter<Ancestry>;
        type Barrier = Barrier;
        type Weigher = FixedWeightBounds<UnitWeightCost, Call>;
        type Trader = FixedRateOfConcreteFungible<WeightPrice>;
        type ResponseHandler = (); // Don't handle responses for now.
    }

    parameter_types! {
        pub const MaxDownwardMessageWeight: Weight = MAXIMUM_BLOCK_WEIGHT / 10;
    }

    /// No local origins on this chain are allowed to dispatch XCM sends/executions.
    pub type LocalOriginToLocation = ();

    /// The means for routing XCM messages which are not for local execution into the right message
    /// queues.
    pub type XcmRouter = (
        // Two routers - use UMP to communicate with the relay chain:
        cumulus_primitives_utility::ParentAsUmp<ParachainSystem>,
        // ..and XCMP to communicate with the sibling chains.
        XcmpQueue,
    );

    impl pallet_xcm::Config for Runtime {
        type Event = Event;
        type SendXcmOrigin = EnsureXcmOrigin<Origin, LocalOriginToLocation>;
        type XcmRouter = XcmRouter;
        type ExecuteXcmOrigin = EnsureXcmOrigin<Origin, LocalOriginToLocation>;
        type XcmExecutor = XcmExecutor<XcmConfig>;
    }

    impl cumulus_pallet_xcm::Config for Runtime {}

    impl cumulus_pallet_xcmp_queue::Config for Runtime {
        type Event = Event;
        type XcmExecutor = XcmExecutor<XcmConfig>;
        type ChannelInfo = ParachainSystem;
    }
}

macro_rules! construct_mandala_runtime {
	($( $Pallets:tt )*) => {
		#[allow(clippy::large_enum_variant)]
		construct_runtime! {
			pub enum Runtime where
				Block = Block,
				NodeBlock = opaque::Block,
				UncheckedExtrinsic = UncheckedExtrinsic
			{
				// Core
				System: frame_system::{Pallet, Call, Storage, Config, Event<T>} = 0,
				Timestamp: pallet_timestamp::{Pallet, Call, Storage, Inherent} = 1,
				RandomnessCollectiveFlip: pallet_randomness_collective_flip::{Pallet, Call, Storage} = 2,
                Utility: substrate_utility::{Pallet, Call, Event} = 3,

				// Tokens & Related
				Balances: pallet_balances::{Pallet, Call, Storage, Config<T>, Event<T>} = 4,

				TransactionPayment: pallet_transaction_payment::{Pallet, Storage} = 5,

                // Joystream
                CouncilElection: election::{Pallet, Call, Storage, Event<T>, Config<T>} = 6,
                Council: council::{Pallet, Call, Storage, Event<T>, Config<T>} = 7,
                Memo: memo::{Pallet, Call, Storage, Event<T>} = 8,
                Members: membership::{Pallet, Call, Storage, Event<T>, Config<T>} = 9,
                Forum: forum::{Pallet, Call, Storage, Event<T>, Config<T>} = 10,
                Stake: stake::{Pallet, Call, Storage} = 11,
                Minting: minting::{Pallet, Call, Storage} = 12,
                RecurringRewards: recurring_rewards::{Pallet, Call, Storage} = 13,
                Hiring: hiring::{Pallet, Call, Storage} = 14,
                Content: content::{Pallet, Call, Storage, Event<T>, Config<T>} = 15,
                // --- Storage
                DataObjectTypeRegistry: data_object_type_registry::{Pallet, Call, Storage, Event<T>, Config<T>} = 16,
                DataDirectory: data_directory::{Pallet, Call, Storage, Event<T>, Config<T>} = 17,
                DataObjectStorageRegistry: data_object_storage_registry::{Pallet, Call, Storage, Event<T>, Config<T>} = 18,
                // --- Proposals
                ProposalsEngine: proposals_engine::{Pallet, Call, Storage, Event<T>} = 19,
                ProposalsDiscussion: proposals_discussion::{Pallet, Call, Storage, Event<T>} = 20,
                ProposalsCodex: proposals_codex::{Pallet, Call, Storage, Config<T>} = 21,
                // --- Working groups
                // reserved for the future use: ForumWorkingGroup: working_group::<Instance1>::{Pallet, Call, Storage, Event<T>},
                StorageWorkingGroup: working_group::<Instance2>::{Pallet, Call, Storage, Config<T>, Event<T>} = 22,
                ContentDirectoryWorkingGroup: working_group::<Instance3>::{Pallet, Call, Storage, Config<T>, Event<T>} = 23,
                OperationsWorkingGroup: working_group::<Instance4>::{Pallet, Call, Storage, Config<T>, Event<T>} = 24,
                GatewayWorkingGroup: working_group::<Instance5>::{Pallet, Call, Storage, Config<T>, Event<T>} = 25,

                // Dev
				Sudo: pallet_sudo::{Pallet, Call, Config<T>, Storage, Event<T>} = 55,

				$($Pallets)*
			}
		}
	}
}

#[cfg(feature = "standalone")]
construct_mandala_runtime! {
    // Consensus & Staking
    Authorship: pallet_authorship::{Pallet, Call, Storage, Inherent} = 56,
    Babe: pallet_babe::{Pallet, Call, Storage, Config, ValidateUnsigned} = 57,
    Grandpa: pallet_grandpa::{Pallet, Call, Storage, Config, Event, ValidateUnsigned} = 58,
    Staking: pallet_staking::{Pallet, Call, Config<T>, Storage, Event<T>} = 60,
    Offences: pallet_offences::{Pallet, Call, Storage, Event} = 61,
    Session: pallet_session::{Pallet, Call, Storage, Event, Config<T>} = 62,
    Historical: pallet_session_historical::{Pallet} = 63,
    AuthorityDiscovery: pallet_authority_discovery::{Pallet, Call, Config} = 64,
}

#[cfg(not(feature = "standalone"))]
construct_mandala_runtime! {
    // Parachain
    ParachainSystem: cumulus_pallet_parachain_system::{Pallet, Call, Storage, Inherent, Event<T>} = 56,
    ParachainInfo: parachain_info::{Pallet, Storage, Config} = 57,
    XcmHandler: cumulus_pallet_xcm::{Pallet, Call, Origin} = 58,
    XcmpQueue: cumulus_pallet_xcmp_queue::{Pallet, Call, Storage, Event<T>} = 59,
    PolkadotXcm: pallet_xcm::{Pallet, Call, Event<T>, Origin} = 60,
}

/// The address format for describing accounts.
pub type Address = sp_runtime::MultiAddress<AccountId, ()>;
/// Block header type as expected by this runtime.
pub type Header = generic::Header<BlockNumber, BlakeTwo256>;
/// Block type as expected by this runtime.
pub type Block = generic::Block<Header, UncheckedExtrinsic>;
/// A Block signed with a Justification
pub type SignedBlock = generic::SignedBlock<Block>;
/// BlockId type as expected by this runtime.
pub type BlockId = generic::BlockId<Block>;
/// The SignedExtension to the basic transaction logic.
pub type SignedExtra = (
    frame_system::CheckSpecVersion<Runtime>,
    frame_system::CheckTxVersion<Runtime>,
    frame_system::CheckGenesis<Runtime>,
    frame_system::CheckEra<Runtime>,
    frame_system::CheckNonce<Runtime>,
    frame_system::CheckWeight<Runtime>,
    pallet_transaction_payment::ChargeTransactionPayment<Runtime>,
);
/// Unchecked extrinsic type as expected by this runtime.
pub type UncheckedExtrinsic = generic::UncheckedExtrinsic<Address, Call, Signature, SignedExtra>;
/// The payload being signed in transactions.
pub type SignedPayload = generic::SignedPayload<Call, SignedExtra>;
/// Extrinsic type that has already been checked.
pub type CheckedExtrinsic = generic::CheckedExtrinsic<AccountId, Call, SignedExtra>;
/// Executive: handles dispatch to the various modules.
pub type Executive = frame_executive::Executive<
    Runtime,
    Block,
    frame_system::ChainContext<Runtime>,
    Runtime,
    AllPallets,
>;

#[cfg(not(feature = "standalone"))]
cumulus_pallet_parachain_system::register_validate_block!(Runtime, Executive);
