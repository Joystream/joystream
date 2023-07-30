use frame_support::inherent::{CheckInherentsResult, InherentData};
use frame_support::traits::{KeyOwnerProofSystem, OnRuntimeUpgrade};
use frame_support::unsigned::{TransactionSource, TransactionValidity};
use pallet_grandpa::fg_primitives;
use pallet_transaction_payment::{FeeDetails, RuntimeDispatchInfo};
use sp_api::impl_runtime_apis;
use sp_core::crypto::KeyTypeId;
use sp_core::OpaqueMetadata;
use sp_runtime::traits::{BlakeTwo256, Block as BlockT, Get, NumberFor};
use sp_runtime::{generic, ApplyExtrinsicResult};

use sp_std::vec::Vec;

use crate::{
    AccountId, AllPalletsWithSystem, AuthorityDiscovery, AuthorityDiscoveryId, Babe, BagsList,
    Balance, BlockNumber, EpochDuration, Grandpa, GrandpaAuthorityList, GrandpaId, Historical,
    Index, InherentDataExt, ProposalsEngine, Runtime, RuntimeCall, RuntimeVersion, SessionKeys,
    Signature, Staking, System, TransactionPayment, BABE_GENESIS_EPOCH_CONFIG, VERSION,
};

#[cfg(feature = "try-runtime")]
use crate::RuntimeBlockWeights;

use frame_support::weights::Weight;

/// The SignedExtension to the basic transaction logic.
pub type SignedExtra = (
    frame_system::CheckNonZeroSender<Runtime>,
    frame_system::CheckSpecVersion<Runtime>,
    frame_system::CheckTxVersion<Runtime>,
    frame_system::CheckGenesis<Runtime>,
    frame_system::CheckEra<Runtime>,
    frame_system::CheckNonce<Runtime>,
    frame_system::CheckWeight<Runtime>,
    pallet_transaction_payment::ChargeTransactionPayment<Runtime>,
);

/// Simply AccountId.
pub type Address = AccountId;

/// Digest item type.
pub type DigestItem = generic::DigestItem;

/// Block header type as expected by this runtime.
pub type Header = generic::Header<BlockNumber, BlakeTwo256>;

/// Block type as expected by this runtime.
pub type Block = generic::Block<Header, UncheckedExtrinsic>;

/// A Block signed with a Justification
pub type SignedBlock = generic::SignedBlock<Block>;

/// BlockId type as expected by this runtime.
pub type BlockId = generic::BlockId<Block>;

/// The payload being signed in transactions.
pub type SignedPayload = generic::SignedPayload<RuntimeCall, SignedExtra>;

/// Extrinsic type that has already been checked.
pub type CheckedExtrinsic = generic::CheckedExtrinsic<AccountId, RuntimeCall, SignedExtra>;

/// Unchecked extrinsic type as expected by this runtime.
pub type UncheckedExtrinsic =
    generic::UncheckedExtrinsic<Address, RuntimeCall, Signature, SignedExtra>;

// On runtime upgrade, stored calls of proposals are not guarnateed to still
// represent the intended module and dispatch call, so for safety we cancel
// all proposals.
pub struct CancelActiveAndPendingProposals;
impl OnRuntimeUpgrade for CancelActiveAndPendingProposals {
    fn on_runtime_upgrade() -> Weight {
        ProposalsEngine::cancel_active_and_pending_proposals();

        Weight::from_parts(10_000_000, 0) // TODO: adjust weight
    }
}

pub struct MigrateStakingPalletToV8;
impl OnRuntimeUpgrade for MigrateStakingPalletToV8 {
    fn on_runtime_upgrade() -> Weight {
        pallet_staking::migrations::v8::migrate::<Runtime>()
    }
}

pub struct StakingMigrationV11OldPallet;
impl Get<&'static str> for StakingMigrationV11OldPallet {
    fn get() -> &'static str {
        "BagsList"
    }
}

/// Migrations to run on runtime upgrade.
/// Migrations will run before pallet on_runtime_upgrade hooks
/// Always include 'CancelActiveAndPendingProposals' as first migration
pub type Migrations = (
    CancelActiveAndPendingProposals,
    // == start Staking migrations (from Release v7 to Release v13)
    MigrateStakingPalletToV8,
    // list will not produce duplicates..
    pallet_staking::migrations::v9::InjectValidatorsIntoVoterList<Runtime>,
    // slash all pending slashes correctly
    pallet_staking::migrations::v10::MigrateToV10<Runtime>,
    // Rename BagsList to VoterList - SKIPPING FOR NOW BY KEEPING SAME NAME
    // Post-Upgrade check is failing -> 'old pallet data hasn't been removed'
    // Only storage version will be bumped. Is this a problem?
    pallet_staking::migrations::v11::MigrateToV11<Runtime, BagsList, StakingMigrationV11OldPallet>,
    // Kill HistoryDepth storage
    pallet_staking::migrations::v12::MigrateToV12<Runtime>,
    // Migrate to new storage versioning
    pallet_staking::migrations::v13::MigrateToV13<Runtime>,
    // == end Staking Migrations
    // unreserve balances from old stored calls in multisig pallet
    pallet_multisig::migrations::v1::MigrateToV1<Runtime>,
    pallet_election_provider_multi_phase::migrations::v1::MigrateToV1<Runtime>,
    pallet_grandpa::migrations::CleanupSetIdSessionMap<Runtime>,
);

/// Executive: handles dispatch to the various modules with Migrations.
pub type Executive = frame_executive::Executive<
    Runtime,
    Block,
    frame_system::ChainContext<Runtime>,
    Runtime,
    AllPalletsWithSystem,
    Migrations,
>;

/// Export of the private const generated within the macro.
pub const EXPORTED_RUNTIME_API_VERSIONS: sp_version::ApisVec = RUNTIME_API_VERSIONS;

#[cfg(feature = "runtime-benchmarks")]
mod benches {
    define_benchmarks!(
        [frame_benchmarking, BaselineBench::<Runtime>]
        [pallet_babe, Babe]
        [pallet_bags_list, BagsList]
        [pallet_balances, Balances]
        [pallet_election_provider_multi_phase, ElectionProviderMultiPhase]
        [pallet_election_provider_support_benchmarking, EPSBench::<Runtime>]
        [pallet_grandpa, Grandpa]
        [pallet_im_online, ImOnline]
        [pallet_offences, OffencesBench::<Runtime>]
        [pallet_session, SessionBench::<Runtime>]
        [pallet_staking, Staking]
        [frame_system, SystemBench::<Runtime>]
        [pallet_timestamp, Timestamp]
        [substrate_utility, Utility]
        [pallet_vesting, Vesting]
        [pallet_multisig, Multisig]
        [proposals_discussion, ProposalsDiscussion]
        [proposals_codex, ProposalsCodex]
        [proposals_engine, ProposalsEngine]
        [membership, Members]
        [forum, Forum]
        [pallet_constitution, Constitution]
        [working_group, ContentWorkingGroup]
        [referendum, Referendum]
        [council, Council]
        [bounty, Bounty]
        [joystream_utility, JoystreamUtility]
        [storage, Storage]
        [content, Content]
        [project_token, ProjectToken]
    );
}

impl_runtime_apis! {
    impl sp_api::Core<Block> for Runtime {
        fn version() -> RuntimeVersion {
            VERSION
        }

        fn execute_block(block: Block) {
            Executive::execute_block(block);
        }

        fn initialize_block(header: &<Block as BlockT>::Header) {
            Executive::initialize_block(header)
        }
    }

    impl sp_api::Metadata<Block> for Runtime {
        fn metadata() -> OpaqueMetadata {
            OpaqueMetadata::new(Runtime::metadata().into())
        }
    }

    impl sp_block_builder::BlockBuilder<Block> for Runtime {
        fn apply_extrinsic(extrinsic: <Block as BlockT>::Extrinsic) -> ApplyExtrinsicResult {
            Executive::apply_extrinsic(extrinsic)
        }

        fn finalize_block() -> <Block as BlockT>::Header {
            Executive::finalize_block()
        }

        fn inherent_extrinsics(data: InherentData) -> Vec<<Block as BlockT>::Extrinsic> {
            data.create_extrinsics()
        }

        fn check_inherents(block: Block, data: InherentData) -> CheckInherentsResult {
            data.check_extrinsics(&block)
        }
    }

    impl pallet_staking_runtime_api::StakingApi<Block, Balance> for Runtime {
        fn nominations_quota(balance: Balance) -> u32 {
            Staking::api_nominations_quota(balance)
        }
    }

    impl sp_transaction_pool::runtime_api::TaggedTransactionQueue<Block> for Runtime {
        fn validate_transaction(
            source: TransactionSource,
            tx: <Block as BlockT>::Extrinsic,
            block_hash: <Block as BlockT>::Hash,
        ) -> TransactionValidity {
            Executive::validate_transaction(source, tx, block_hash)
        }
    }

    impl sp_offchain::OffchainWorkerApi<Block> for Runtime {
        fn offchain_worker(header: &<Block as BlockT>::Header) {
            Executive::offchain_worker(header)
        }
    }

    impl fg_primitives::GrandpaApi<Block> for Runtime {
        fn grandpa_authorities() -> GrandpaAuthorityList {
            Grandpa::grandpa_authorities()
        }

        fn current_set_id() -> fg_primitives::SetId {
            Grandpa::current_set_id()
        }

        fn submit_report_equivocation_unsigned_extrinsic(
            equivocation_proof: fg_primitives::EquivocationProof<
                <Block as BlockT>::Hash,
                NumberFor<Block>,
            >,
            key_owner_proof: fg_primitives::OpaqueKeyOwnershipProof,
        ) -> Option<()> {
            let key_owner_proof = key_owner_proof.decode()?;

            Grandpa::submit_unsigned_equivocation_report(
                equivocation_proof,
                key_owner_proof,
            )
        }

        fn generate_key_ownership_proof(
            _set_id: fg_primitives::SetId,
            authority_id: GrandpaId,
        ) -> Option<fg_primitives::OpaqueKeyOwnershipProof> {
            use codec::Encode;

            Historical::prove((fg_primitives::KEY_TYPE, authority_id))
                .map(|p| p.encode())
                .map(fg_primitives::OpaqueKeyOwnershipProof::new)
        }
    }

    impl sp_consensus_babe::BabeApi<Block> for Runtime {
        fn configuration() -> sp_consensus_babe::BabeConfiguration {
            // The choice of `c` parameter (where `1 - c` represents the
            // probability of a slot being empty), is done in accordance to the
            // slot duration and expected target block time, for safely
            // resisting network delays of maximum two seconds.
            // <https://research.web3.foundation/en/latest/polkadot/BABE/Babe/#6-practical-results>
            let epoch_config = Babe::epoch_config().unwrap_or(BABE_GENESIS_EPOCH_CONFIG);
            sp_consensus_babe::BabeConfiguration {
                slot_duration: Babe::slot_duration(),
                epoch_length: EpochDuration::get(),
                c: epoch_config.c,
                authorities: Babe::authorities().to_vec(),
                randomness: Babe::randomness(),
                allowed_slots: epoch_config.allowed_slots,
            }
        }

        fn current_epoch_start() -> sp_consensus_babe::Slot {
            Babe::current_epoch_start()
        }

        fn current_epoch() -> sp_consensus_babe::Epoch {
            Babe::current_epoch()
        }

        fn next_epoch() -> sp_consensus_babe::Epoch {
            Babe::next_epoch()
        }

        fn generate_key_ownership_proof(
            _slot: sp_consensus_babe::Slot,
            authority_id: sp_consensus_babe::AuthorityId,
        ) -> Option<sp_consensus_babe::OpaqueKeyOwnershipProof> {
            use codec::Encode;

            Historical::prove((sp_consensus_babe::KEY_TYPE, authority_id))
                .map(|p| p.encode())
                .map(sp_consensus_babe::OpaqueKeyOwnershipProof::new)
        }

        fn submit_report_equivocation_unsigned_extrinsic(
            equivocation_proof: sp_consensus_babe::EquivocationProof<<Block as BlockT>::Header>,
            key_owner_proof: sp_consensus_babe::OpaqueKeyOwnershipProof,
        ) -> Option<()> {
            let key_owner_proof = key_owner_proof.decode()?;

            Babe::submit_unsigned_equivocation_report(
                equivocation_proof,
                key_owner_proof,
            )
        }
    }

    impl sp_authority_discovery::AuthorityDiscoveryApi<Block> for Runtime {
        fn authorities() -> Vec<AuthorityDiscoveryId> {
            AuthorityDiscovery::authorities()
        }
    }

    impl frame_system_rpc_runtime_api::AccountNonceApi<Block, AccountId, Index> for Runtime {
        fn account_nonce(account: AccountId) -> Index {
            System::account_nonce(account)
        }
    }

    impl pallet_transaction_payment_rpc_runtime_api::TransactionPaymentApi<
        Block,
        Balance,
    > for Runtime {
        fn query_info(uxt: <Block as BlockT>::Extrinsic, len: u32) -> RuntimeDispatchInfo<Balance> {
            TransactionPayment::query_info(uxt, len)
        }
        fn query_fee_details(uxt: <Block as BlockT>::Extrinsic, len: u32) -> FeeDetails<Balance> {
            TransactionPayment::query_fee_details(uxt, len)
        }
        fn query_weight_to_fee(weight: Weight) -> Balance {
            TransactionPayment::weight_to_fee(weight)
        }
        fn query_length_to_fee(length: u32) -> Balance {
            TransactionPayment::length_to_fee(length)
        }
    }

    impl sp_session::SessionKeys<Block> for Runtime {
        fn generate_session_keys(seed: Option<Vec<u8>>) -> Vec<u8> {
            SessionKeys::generate(seed)
        }

        fn decode_session_keys(
            encoded: Vec<u8>,
        ) -> Option<Vec<(Vec<u8>, KeyTypeId)>> {
            SessionKeys::decode_into_raw_public_keys(&encoded)
        }
    }

    #[cfg(feature = "try-runtime")]
    impl frame_try_runtime::TryRuntime<Block> for Runtime {
        fn on_runtime_upgrade(checks: frame_try_runtime::UpgradeCheckSelect) -> (Weight, Weight) {
            // NOTE: intentional unwrap: we don't want to propagate the error backwards, and want to
            // have a backtrace here. If any of the pre/post migration checks fail, we shall stop
            // right here and right now.
            let weight = Executive::try_runtime_upgrade(checks).unwrap();
            (weight, RuntimeBlockWeights::get().max_block)
        }

        fn execute_block(
            block: Block,
            state_root_check: bool,
            signature_check: bool,
            select: frame_try_runtime::TryStateSelect
        ) -> Weight {
            // NOTE: intentional unwrap: we don't want to propagate the error backwards, and want to
            // have a backtrace here.
            Executive::try_execute_block(block, state_root_check, signature_check, select).unwrap()
        }
    }

    #[cfg(feature = "runtime-benchmarks")]
    impl frame_benchmarking::v1::Benchmark<Block> for Runtime {
        fn benchmark_metadata(extra: bool) -> (
            Vec<frame_benchmarking::v1::BenchmarkList>,
            Vec<frame_support::traits::StorageInfo>,
        ) {
            use frame_benchmarking::v1::{baseline, Benchmarking, BenchmarkList};
            use frame_support::traits::StorageInfoTrait;
            use crate::*;

            // Trying to add benchmarks directly to the Session Pallet caused cyclic dependency
            // issues. To get around that, we separated the Session benchmarks into its own crate,
            // which is why we need these two lines below.
            use pallet_session_benchmarking::Pallet as SessionBench;
            use pallet_offences_benchmarking::Pallet as OffencesBench;
            use pallet_election_provider_support_benchmarking::Pallet as EPSBench;
            use frame_system_benchmarking::Pallet as SystemBench;
            use baseline::Pallet as BaselineBench;

            let mut list = Vec::<BenchmarkList>::new();
            list_benchmarks!(list, extra);

            let storage_info = AllPalletsWithSystem::storage_info();
            (list, storage_info)
        }

        fn dispatch_benchmark(
            config: frame_benchmarking::v1::BenchmarkConfig
        ) -> Result<Vec<frame_benchmarking::v1::BenchmarkBatch>, sp_runtime::RuntimeString> {
            use frame_benchmarking::v1::{baseline, Benchmarking, BenchmarkBatch,  TrackedStorageKey};
            use crate::*;

            // Trying to add benchmarks directly to the Session Pallet caused cyclic dependency
            // issues. To get around that, we separated the Session benchmarks into its own crate,
            // which is why we need these two lines below.
            use pallet_session_benchmarking::Pallet as SessionBench;
            use pallet_offences_benchmarking::Pallet as OffencesBench;
            use pallet_election_provider_support_benchmarking::Pallet as EPSBench;
            use frame_system_benchmarking::Pallet as SystemBench;
            use baseline::Pallet as BaselineBench;
            use frame_support::StorageValue;

            use frame_system::RawOrigin;

            impl pallet_session_benchmarking::Config for Runtime {}
            impl pallet_offences_benchmarking::Config for Runtime {}
            impl pallet_election_provider_support_benchmarking::Config for Runtime {}
            impl frame_system_benchmarking::Config for Runtime {}
            impl baseline::Config for Runtime {}

            impl referendum::OptionCreator<<Runtime as frame_system::Config>::AccountId, <Runtime as common::membership::MembershipTypes>::MemberId> for Runtime {
                fn create_option(account_id: <Runtime as frame_system::Config>::AccountId, member_id: <Runtime as common::membership::MembershipTypes>::MemberId) {
                    match council::Stage::<Runtime>::get().stage {
                        council::CouncilStage::Announcing(_) => { /* Do nothing */ },
                        _ => {
                            // Force announcing stage
                            let block_number = frame_system::Pallet::<Runtime>::block_number();
                            let ends_at = block_number.saturating_add(<Runtime as council::Config>::AnnouncingPeriodDuration::get());
                            let stage_data = council::CouncilStageAnnouncing {
                                candidates_count: 0,
                                ends_at,
                            };
                            council::Stage::<Runtime>::put(council::CouncilStageUpdate {
                                stage: council::CouncilStage::Announcing(stage_data),
                                changed_at: block_number,
                            });
                            council::AnnouncementPeriodNr::mutate(|value| *value += 1);
                        }
                    }
                    // Announce candidacy
                    council::Module::<Runtime>::announce_candidacy(
                        RawOrigin::Signed(account_id.clone()).into(),
                        member_id,
                        account_id.clone(),
                        account_id,
                        <Runtime as council::Config>::MinCandidateStake::get(),
                    ).expect(
                        "Should pass a valid member associated to the account and the account
                        should've enough
                        free balance to stake the minimum for a council candidate."
                    );
                }
            }

            impl membership::MembershipWorkingGroupHelper<
                <Runtime as frame_system::Config>::AccountId,
                <Runtime as common::membership::MembershipTypes>::MemberId,
                <Runtime as common::membership::MembershipTypes>::ActorId,
            > for Runtime
            {
                fn insert_a_lead(
                    opening_id: u32,
                    caller_id: &<Runtime as frame_system::Config>::AccountId,
                    member_id: <Runtime as common::membership::MembershipTypes>::MemberId,
                ) -> <Runtime as common::membership::MembershipTypes>::ActorId {
                    working_group::benchmarking::complete_opening::<Runtime, crate::MembershipWorkingGroupInstance>(
                        working_group::OpeningType::Leader,
                        opening_id,
                        None,
                        caller_id,
                        member_id,
                    )
                }
            }

            let whitelist: Vec<TrackedStorageKey> = vec![
                // Block Number
                hex_literal::hex!("26aa394eea5630e07c48ae0c9558cef702a5c1b19ab7a04f536c519aca4983ac").to_vec().into(),
                // Total Issuance
                hex_literal::hex!("c2261276cc9d1f8598ea4b6a74b15c2f57c875e4cff74148e4628f264b974c80").to_vec().into(),
                // Execution Phase
                hex_literal::hex!("26aa394eea5630e07c48ae0c9558cef7ff553b5a9862a516939d82b3d3d8661a").to_vec().into(),
                // Event Count
                hex_literal::hex!("26aa394eea5630e07c48ae0c9558cef70a98fdbe9ce6c55837576c60c7af3850").to_vec().into(),
                // System Events
                hex_literal::hex!("26aa394eea5630e07c48ae0c9558cef780d41e5e16056765bc8461851072c9d7").to_vec().into(),
                // System BlockWeight
                hex_literal::hex!("26aa394eea5630e07c48ae0c9558cef734abf5cb34d6244378cddbf18e849d96").to_vec().into(),
            ];

            let mut batches = Vec::<BenchmarkBatch>::new();
            let params = (&config, &whitelist);
            // defined benchmarks (in define_benchmarks!) will be added to the batches vec
            add_benchmarks!(params, batches);

            Ok(batches)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::MaxNominations;
    use frame_election_provider_support::NposSolution;
    use frame_system::offchain::CreateSignedTransaction;
    use sp_runtime::UpperOf;

    #[test]
    fn validate_transaction_submitter_bounds() {
        fn is_submit_signed_transaction<T>()
        where
            T: CreateSignedTransaction<RuntimeCall>,
        {
        }

        is_submit_signed_transaction::<Runtime>();
    }

    #[test]
    fn perbill_as_onchain_accuracy() {
        type OnChainAccuracy =
			<<Runtime as pallet_election_provider_multi_phase::MinerConfig>::Solution as NposSolution>::Accuracy;
        let maximum_chain_accuracy: Vec<UpperOf<OnChainAccuracy>> = (0..MaxNominations::get())
            .map(|_| <UpperOf<OnChainAccuracy>>::from(OnChainAccuracy::one().deconstruct()))
            .collect();
        let _: UpperOf<OnChainAccuracy> = maximum_chain_accuracy
            .iter()
            .fold(0, |acc, x| acc.checked_add(*x).unwrap());
    }

    #[test]
    fn call_size() {
        // https://github.com/Joystream/joystream/pull/4336#discussion_r992359003
        const SAFE_SIZE: usize = 400;
        let current_size = core::mem::size_of::<RuntimeCall>();
        assert!(
            current_size <= SAFE_SIZE,
            "size of RuntimeCall {} is more than {} bytes: some calls have too big arguments, use Box to reduce the
            size of RuntimeCall. If the limit is too strong, maybe consider increase the limit.",
            current_size, SAFE_SIZE
        );
    }
}
