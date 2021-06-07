#[cfg(any(feature = "std", test))]
pub use pallet_staking::StakerStatus;

#[cfg(feature = "standalone")]
use standalone_use::*;
#[cfg(feature = "standalone")]
mod standalone_use {
    pub use crate::constants::*;

    pub use crate::{AuthorityDiscovery, EpochDuration, Grandpa, Historical};

    pub use pallet_grandpa::AuthorityId as GrandpaId;

    pub use pallet_grandpa::AuthorityList as GrandpaAuthorityList;

    pub use sp_runtime::traits::NumberFor;

    pub use pallet_grandpa::fg_primitives;

    pub use sp_authority_discovery::AuthorityId as AuthorityDiscoveryId;

    pub use frame_support::traits::KeyOwnerProofSystem;
}

use frame_support::traits::{OnRuntimeUpgrade, Randomness};
use frame_support::unsigned::{TransactionSource, TransactionValidity};
use sp_api::impl_runtime_apis;
use sp_core::crypto::KeyTypeId;
use sp_core::OpaqueMetadata;
use sp_runtime::traits::{BlakeTwo256, Block as BlockT};
use sp_runtime::{generic, ApplyExtrinsicResult};
use sp_std::vec::Vec;

use crate::{
    ContentDirectoryWorkingGroupInstance, DataDirectory, GatewayWorkingGroupInstance,
    OperationsWorkingGroupInstance, StorageWorkingGroupInstance,
};

use crate::{
    content, data_directory, AccountId, Balance, BlockNumber, Hash, Index, RuntimeVersion,
    Signature, VERSION,
};

use crate::{
    Aura, AuraId, Call, Executive, InherentDataExt, RandomnessCollectiveFlip, Runtime, SessionKeys,
    System, TransactionPayment,
};

#[cfg(not(feature = "standalone"))]
use crate::ParachainSystem;

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
pub type Address = sp_runtime::MultiAddress<AccountId, ()>;

/// Digest item type.
pub type DigestItem = generic::DigestItem<Hash>;

/// Block header type as expected by this runtime.
pub type Header = generic::Header<BlockNumber, BlakeTwo256>;

/// Block type as expected by this runtime.
pub type Block = generic::Block<Header, UncheckedExtrinsic>;

/// Unchecked extrinsic type as expected by this runtime.
pub type UncheckedExtrinsic = generic::UncheckedExtrinsic<Address, Call, Signature, SignedExtra>;

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

/// Export of the private const generated within the macro.
pub const EXPORTED_RUNTIME_API_VERSIONS: sp_version::ApisVec = RUNTIME_API_VERSIONS;

#[cfg(not(feature = "disable-runtime-api"))]
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

        fn inherent_extrinsics(data: sp_inherents::InherentData) -> Vec<<Block as BlockT>::Extrinsic> {
            data.create_extrinsics()
        }

        fn check_inherents(
            block: Block,
            data: sp_inherents::InherentData,
        ) -> sp_inherents::CheckInherentsResult {
            data.check_extrinsics(&block)
        }

        // fn random_seed() -> <Block as BlockT>::Hash {
        //     RandomnessCollectiveFlip::random_seed().0
        // }
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

    #[cfg(feature = "standalone")]
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

    #[cfg(feature = "standalone")]
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
        fn query_info(
            uxt: <Block as BlockT>::Extrinsic,
            len: u32,
        ) -> pallet_transaction_payment_rpc_runtime_api::RuntimeDispatchInfo<Balance> {
            TransactionPayment::query_info(uxt, len)
        }

        fn query_fee_details(
            uxt: <Block as BlockT>::Extrinsic,
            len: u32,
        ) -> pallet_transaction_payment::FeeDetails<Balance> {
            TransactionPayment::query_fee_details(uxt, len)
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

    impl sp_consensus_aura::AuraApi<Block, AuraId> for Runtime {
        fn slot_duration() -> sp_consensus_aura::SlotDuration {
            sp_consensus_aura::SlotDuration::from_millis(Aura::slot_duration())
        }

        fn authorities() -> Vec<AuraId> {
            Aura::authorities()
        }
    }

    #[cfg(not(feature = "standalone"))]
    impl cumulus_primitives_core::CollectCollationInfo<Block> for Runtime {
        fn collect_collation_info() -> cumulus_primitives_core::CollationInfo {
            ParachainSystem::collect_collation_info()
        }
    }
}
