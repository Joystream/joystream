use frame_support::inherent::{CheckInherentsResult, InherentData};
use frame_support::traits::{KeyOwnerProofSystem, OnRuntimeUpgrade, Randomness};
use frame_support::unsigned::{TransactionSource, TransactionValidity};
use pallet_grandpa::fg_primitives;
use pallet_transaction_payment_rpc_runtime_api::RuntimeDispatchInfo;
use sp_api::impl_runtime_apis;
use sp_core::crypto::KeyTypeId;
use sp_core::OpaqueMetadata;
use sp_runtime::traits::{BlakeTwo256, Block as BlockT, NumberFor};
use sp_runtime::{generic, ApplyExtrinsicResult};
use sp_std::vec::Vec;

use crate::{
    ContentDirectoryWorkingGroupInstance, DataDirectory, GatewayWorkingGroupInstance,
    OperationsWorkingGroupInstance, StorageWorkingGroupInstance,
};

use crate::constants::PRIMARY_PROBABILITY;

use crate::{
    content, data_directory, AccountId, AuthorityDiscoveryId, Balance, BlockNumber, EpochDuration,
    GrandpaAuthorityList, GrandpaId, Hash, Index, RuntimeVersion, Signature, VERSION,
};
use crate::{
    AllModules, AuthorityDiscovery, Babe, Call, Grandpa, Historical, InherentDataExt,
    RandomnessCollectiveFlip, Runtime, SessionKeys, System, TransactionPayment,
};
use frame_support::weights::Weight;

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

// Alias for the builder working group
pub(crate) type OperationsWorkingGroup<T> =
    working_group::Module<T, OperationsWorkingGroupInstance>;

// Alias for the gateway working group
pub(crate) type GatewayWorkingGroup<T> = working_group::Module<T, GatewayWorkingGroupInstance>;

// Alias for the storage working group
pub(crate) type StorageWorkingGroup<T> = working_group::Module<T, StorageWorkingGroupInstance>;

// Alias for the content working group
pub(crate) type ContentDirectoryWorkingGroup<T> =
    working_group::Module<T, ContentDirectoryWorkingGroupInstance>;

/// Custom runtime upgrade handler.
pub struct CustomOnRuntimeUpgrade;
impl OnRuntimeUpgrade for CustomOnRuntimeUpgrade {
    fn on_runtime_upgrade() -> Weight {
        content::Module::<Runtime>::on_runtime_upgrade();

        let default_text_constraint = crate::working_group::default_text_constraint();

        let default_storage_size_constraint =
            crate::working_group::default_storage_size_constraint();

        let default_content_working_group_mint_capacity = 0;

        // Initialize new groups
        OperationsWorkingGroup::<Runtime>::initialize_working_group(
            default_text_constraint,
            default_text_constraint,
            default_text_constraint,
            default_storage_size_constraint,
            default_content_working_group_mint_capacity,
        );

        GatewayWorkingGroup::<Runtime>::initialize_working_group(
            default_text_constraint,
            default_text_constraint,
            default_text_constraint,
            default_storage_size_constraint,
            default_content_working_group_mint_capacity,
        );

        DataDirectory::initialize_data_directory(
            Vec::new(),
            data_directory::DEFAULT_VOUCHER_SIZE_LIMIT_UPPER_BOUND,
            data_directory::DEFAULT_VOUCHER_OBJECTS_LIMIT_UPPER_BOUND,
            data_directory::DEFAULT_GLOBAL_VOUCHER,
            data_directory::DEFAULT_VOUCHER,
            data_directory::DEFAULT_UPLOADING_BLOCKED_STATUS,
        );

        // Initialize existing groups
        StorageWorkingGroup::<Runtime>::set_worker_storage_size_constraint(
            default_storage_size_constraint,
        );

        ContentDirectoryWorkingGroup::<Runtime>::set_worker_storage_size_constraint(
            default_storage_size_constraint,
        );

        10_000_000 // TODO: adjust weight
    }
}

/// Executive: handles dispatch to the various modules.
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
}
