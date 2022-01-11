use frame_support::inherent::{CheckInherentsResult, InherentData};
use frame_support::traits::{KeyOwnerProofSystem, OnRuntimeUpgrade, Randomness};
use frame_support::unsigned::{TransactionSource, TransactionValidity};
use pallet_grandpa::fg_primitives;
use pallet_transaction_payment_rpc_runtime_api::RuntimeDispatchInfo;
use sp_api::impl_runtime_apis;
use sp_core::crypto::KeyTypeId;
use sp_core::OpaqueMetadata;
use sp_runtime::traits::{BlakeTwo256, Block as BlockT, Convert, NumberFor};
use sp_runtime::{generic, ApplyExtrinsicResult};
use sp_std::vec::Vec;

use crate::constants::PRIMARY_PROBABILITY;

use crate::{
    content, data_directory, AccountId, AuthorityDiscoveryId, Balance, BlockNumber, EpochDuration,
    GrandpaAuthorityList, GrandpaId, Hash, Index, RuntimeVersion, Signature, VERSION,
};
use crate::{
    AllModules, AuthorityDiscovery, Babe, Balances, Call, DataDirectory, Grandpa, Historical,
    InherentDataExt, ProposalsEngine, RandomnessCollectiveFlip, Runtime, SessionKeys, System,
    TransactionPayment,
};
use frame_support::weights::Weight;

/// Struct that handles the conversion of Balance -> `u64`. This is used for staking's election
/// calculation.
pub struct CurrencyToVoteHandler;

impl CurrencyToVoteHandler {
    fn factor() -> Balance {
        (Balances::total_issuance() / u64::max_value() as Balance).max(1)
    }
}

impl Convert<Balance, u64> for CurrencyToVoteHandler {
    fn convert(x: Balance) -> u64 {
        (x / Self::factor()) as u64
    }
}

impl Convert<u128, Balance> for CurrencyToVoteHandler {
    fn convert(x: u128) -> Balance {
        x * Self::factor()
    }
}

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

/// We don't use specific Address types (like Indices).
pub type Address = AccountId;

/// Digest item type.
pub type DigestItem = generic::DigestItem<Hash>;

/// Block header type as expected by this runtime.
pub type Header = generic::Header<BlockNumber, BlakeTwo256>;

/// Block type as expected by this runtime.
pub type Block = generic::Block<Header, UncheckedExtrinsic>;

/// A Block signed with a Justification
pub type SignedBlock = generic::SignedBlock<Block>;

/// BlockId type as expected by this runtime.
pub type BlockId = generic::BlockId<Block>;

/// Unchecked extrinsic type as expected by this runtime.
pub type UncheckedExtrinsic = generic::UncheckedExtrinsic<AccountId, Call, Signature, SignedExtra>;

// Default Executive type without the RuntimeUpgrade
// pub type Executive =
//     frame_executive::Executive<Runtime, Block, frame_system::ChainContext<Runtime>, Runtime, AllModules>;

/// Custom runtime upgrade handler.
pub struct CustomOnRuntimeUpgrade;
impl OnRuntimeUpgrade for CustomOnRuntimeUpgrade {
    fn on_runtime_upgrade() -> Weight {
        ProposalsEngine::cancel_active_and_pending_proposals();

        content::Module::<Runtime>::on_runtime_upgrade();

        DataDirectory::initialize_data_directory(
            Vec::new(),
            data_directory::DEFAULT_VOUCHER_SIZE_LIMIT_UPPER_BOUND,
            data_directory::DEFAULT_VOUCHER_OBJECTS_LIMIT_UPPER_BOUND,
            data_directory::DEFAULT_GLOBAL_VOUCHER,
            data_directory::DEFAULT_VOUCHER,
            data_directory::DEFAULT_UPLOADING_BLOCKED_STATUS,
        );

        10_000_000 // TODO: adjust weight
    }
}

/// Executive: handles dispatch to the various modules with CustomOnRuntimeUpgrade.
pub type Executive = frame_executive::Executive<
    Runtime,
    Block,
    frame_system::ChainContext<Runtime>,
    Runtime,
    AllModules,
    CustomOnRuntimeUpgrade,
>;

/// Export of the private const generated within the macro.
pub const EXPORTED_RUNTIME_API_VERSIONS: sp_version::ApisVec = RUNTIME_API_VERSIONS;

impl_runtime_apis! {
    impl sp_api::Core<Block> for Runtime {
        fn version() -> RuntimeVersion {
            VERSION
        }

        fn execute_block(block: Block) {
            Executive::execute_block(block)
        }

        fn initialize_block(header: &<Block as BlockT>::Header) {
            Executive::initialize_block(header)
        }
    }

    impl sp_api::Metadata<Block> for Runtime {
        fn metadata() -> OpaqueMetadata {
            Runtime::metadata().into()
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

        fn random_seed() -> <Block as BlockT>::Hash {
            RandomnessCollectiveFlip::random_seed()
        }
    }

    impl sp_transaction_pool::runtime_api::TaggedTransactionQueue<Block> for Runtime {
        fn validate_transaction(
            source: TransactionSource,
            tx: <Block as BlockT>::Extrinsic,
        ) -> TransactionValidity {
            Executive::validate_transaction(source, tx)
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
        fn configuration() -> sp_consensus_babe::BabeGenesisConfiguration {
            // The choice of `c` parameter (where `1 - c` represents the
            // probability of a slot being empty), is done in accordance to the
            // slot duration and expected target block time, for safely
            // resisting network delays of maximum two seconds.
            // <https://research.web3.foundation/en/latest/polkadot/BABE/Babe/#6-practical-results>
            sp_consensus_babe::BabeGenesisConfiguration {
                slot_duration: Babe::slot_duration(),
                epoch_length: EpochDuration::get(),
                c: PRIMARY_PROBABILITY,
                genesis_authorities: Babe::authorities(),
                randomness: Babe::randomness(),
                allowed_slots: sp_consensus_babe::AllowedSlots::PrimaryAndSecondaryPlainSlots,
            }
        }

        fn generate_key_ownership_proof(
            _slot_number: sp_consensus_babe::SlotNumber,
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

        fn current_epoch_start() -> sp_consensus_babe::SlotNumber {
            Babe::current_epoch_start()
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

    #[cfg(feature = "runtime-benchmarks")]
    impl frame_benchmarking::Benchmark<Block> for Runtime {
        fn dispatch_benchmark(
            config: frame_benchmarking::BenchmarkConfig
        ) -> Result<Vec<frame_benchmarking::BenchmarkBatch>, sp_runtime::RuntimeString> {
            use sp_std::vec;
            use frame_benchmarking::{Benchmarking, BenchmarkBatch, add_benchmark, TrackedStorageKey};

            use pallet_session_benchmarking::Module as SessionBench;
            use frame_system_benchmarking::Module as SystemBench;
            use frame_system::RawOrigin;
            use crate::ProposalsDiscussion;
            use crate::ProposalsEngine;
            use crate::ProposalsCodex;
            use crate::Constitution;
            use crate::Forum;
            use crate::Members;
            use crate::ContentDirectoryWorkingGroup;
            use crate::Utility;
            use crate::Timestamp;
            use crate::ImOnline;
            use crate::Council;
            use crate::Referendum;
            use crate::Bounty;
            use crate::Blog;
            use crate::JoystreamUtility;
            use crate::Staking;


            // Trying to add benchmarks directly to the Session Pallet caused cyclic dependency issues.
            // To get around that, we separated the Session benchmarks into its own crate, which is why
            // we need these two lines below.
            impl pallet_session_benchmarking::Trait for Runtime {}
            impl frame_system_benchmarking::Trait for Runtime {}
            impl referendum::OptionCreator<<Runtime as frame_system::Trait>::AccountId, <Runtime as common::membership::MembershipTypes>::MemberId> for Runtime {
                fn create_option(account_id: <Runtime as frame_system::Trait>::AccountId, member_id: <Runtime as common::membership::MembershipTypes>::MemberId) {
                    crate::council::Module::<Runtime>::announce_candidacy(
                        RawOrigin::Signed(account_id.clone()).into(),
                        member_id,
                        account_id.clone(),
                        account_id.clone(),
                        <Runtime as council::Trait>::MinCandidateStake::get().into(),
                    ).expect(
                        "Should pass a valid member associated to the account and the account
                        should've enough
                        free balance to stake the minimum for a council candidate."
                    );
                }
            }

            impl membership::MembershipWorkingGroupHelper<
                <Runtime as frame_system::Trait>::AccountId,
                <Runtime as common::membership::MembershipTypes>::MemberId,
                <Runtime as common::membership::MembershipTypes>::ActorId,
                    > for Runtime
            {
                fn insert_a_lead(
                    opening_id: u32,
                    caller_id: &<Runtime as frame_system::Trait>::AccountId,
                    member_id: <Runtime as common::membership::MembershipTypes>::MemberId,
                ) -> <Runtime as common::membership::MembershipTypes>::ActorId {
                    working_group::benchmarking::complete_opening::<Runtime, crate::MembershipWorkingGroupInstance>(
                        working_group::OpeningType::Leader,
                        opening_id,
                        None,
                        &caller_id,
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
                // Caller 0 Account
                hex_literal::hex!("26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da946c154ffd9992e395af90b5b13cc6f295c77033fce8a9045824a6690bbf99c6db269502f0a8d1d2a008542d5690a0749").to_vec().into(),
                // Treasury Account
                hex_literal::hex!("26aa394eea5630e07c48ae0c9558cef7b99d880ec681799c0cf30e8886371da95ecffd7b6c0f78751baa9d281e0bfa3a6d6f646c70792f74727372790000000000000000000000000000000000000000").to_vec().into(),
            ];

            let mut batches = Vec::<BenchmarkBatch>::new();
            let params = (&config, &whitelist);

            // Note: For benchmarking Stake and Balances we need to change ExistentialDeposit to
            // a non-zero value.
            // For now, due to the complexity grandpa and babe aren't benchmarked automatically
            // we should use the default manually created weights.
            // Finally, pallet_offences have no `WeightInfo` so there's no need to benchmark it
            // the benchmark is only for illustrative pourpuses.

            // Frame benchmarks
            add_benchmark!(params, batches, frame_system, SystemBench::<Runtime>);
            add_benchmark!(params, batches, substrate_utility, Utility);
            add_benchmark!(params, batches, pallet_timestamp, Timestamp);
            add_benchmark!(params, batches, pallet_session, SessionBench::<Runtime>);
            add_benchmark!(params, batches, pallet_im_online, ImOnline);
            add_benchmark!(params, batches, pallet_balances, Balances);
            add_benchmark!(params, batches, pallet_staking, Staking);

            // Joystream Benchmarks
            add_benchmark!(params, batches, proposals_discussion, ProposalsDiscussion);
            add_benchmark!(params, batches, proposals_codex, ProposalsCodex);
            add_benchmark!(params, batches, proposals_engine, ProposalsEngine);
            add_benchmark!(params, batches, membership, Members);
            add_benchmark!(params, batches, forum, Forum);
            add_benchmark!(params, batches, pallet_constitution, Constitution);
            add_benchmark!(params, batches, working_group, ContentDirectoryWorkingGroup);
            add_benchmark!(params, batches, referendum, Referendum);
            add_benchmark!(params, batches, council, Council);
            add_benchmark!(params, batches, bounty, Bounty);
            add_benchmark!(params, batches, blog, Blog);
            add_benchmark!(params, batches, joystream_utility, JoystreamUtility);

            if batches.is_empty() { return Err("Benchmark not found for this pallet.".into()) }
            Ok(batches)
        }
    }
}
