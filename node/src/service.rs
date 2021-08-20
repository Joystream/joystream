//! Service and ServiceFactory implementation. Specialized wrapper over substrate service.

use futures::prelude::*;
use node_runtime::{self, RuntimeApi};
use sc_client_api::{ExecutorProvider, RemoteBackend};
use sc_executor::native_executor_instance;
pub use sc_executor::NativeExecutor;
use sc_finality_grandpa::SharedVoterState;
use sc_keystore::LocalKeystore;
use sc_network::{Event, NetworkService};
use sc_service::{error::Error as ServiceError, Configuration, RpcHandlers, TaskManager};
use std::sync::Arc;
use std::time::Duration;

use sc_finality_grandpa::FinalityProofProvider;
use sp_inherents::InherentDataProviders;
use sp_runtime::traits::Block as BlockT;

// Our native executor instance.
native_executor_instance!(
    pub Executor,
    node_runtime::api::dispatch,
    node_runtime::native_version,
    frame_benchmarking::benchmarking::HostFunctions,
);

type FullClient = sc_service::TFullClient<Block, RuntimeApi, Executor>;
type FullBackend = sc_service::TFullBackend<Block>;
type FullSelectChain = sc_consensus::LongestChain<FullBackend, Block>;

type LightClient = sc_service::TLightClient<Block, RuntimeApi, Executor>;

// Runtime type overrides
type BlockNumber = u32;
type Header = sp_runtime::generic::Header<BlockNumber, sp_runtime::traits::BlakeTwo256>;
pub type Block = sp_runtime::generic::Block<Header, sp_runtime::OpaqueExtrinsic>;

pub struct NewFullBase {
    pub task_manager: TaskManager,
    pub inherent_data_providers: InherentDataProviders,
    pub client: Arc<FullClient>,
    pub network: Arc<NetworkService<Block, <Block as BlockT>::Hash>>,
    pub network_status_sinks: sc_service::NetworkStatusSinks<Block>,
    pub transaction_pool: Arc<sc_transaction_pool::FullPool<Block, FullClient>>,
}

pub struct NewLightBase {
    pub task_manager: TaskManager,
    pub rpc_handlers: RpcHandlers,
    pub client: Arc<LightClient>,
    pub network: Arc<NetworkService<Block, <Block as BlockT>::Hash>>,
    pub transaction_pool: Arc<
        sc_transaction_pool::LightPool<Block, LightClient, sc_network::config::OnDemand<Block>>,
    >,
}

type PartialComponentsList = sc_service::PartialComponents<
    FullClient,
    FullBackend,
    FullSelectChain,
    sp_consensus::DefaultImportQueue<Block, FullClient>,
    sc_transaction_pool::FullPool<Block, FullClient>,
    (
        sc_consensus_babe::BabeBlockImport<
            Block,
            FullClient,
            sc_finality_grandpa::GrandpaBlockImport<
                FullBackend,
                Block,
                FullClient,
                FullSelectChain,
            >,
        >,
        sc_finality_grandpa::LinkHalf<Block, FullClient, FullSelectChain>,
        sc_consensus_babe::BabeLink<Block>,
    ),
>;

// TODO: Result structure is very complex. Consider factoring parts into `type` definitions.
// After this TODO will be resolved, remove the suppresion of `type-complexity` warnings in the Makefile.
pub fn new_partial(config: &Configuration) -> Result<PartialComponentsList, ServiceError> {
    if config.keystore_remote.is_some() {
        return Err(ServiceError::Other(
            "Remote Keystores are not supported.".to_string(),
        ));
    }

    let (client, backend, keystore_container, task_manager) =
        sc_service::new_full_parts::<Block, RuntimeApi, Executor>(&config)?;
    let client = Arc::new(client);

    let select_chain = sc_consensus::LongestChain::new(backend.clone());

    let transaction_pool = sc_transaction_pool::BasicPool::new_full(
        config.transaction_pool.clone(),
        config.role.is_authority().into(),
        config.prometheus_registry(),
        task_manager.spawn_handle(),
        client.clone(),
    );

    let (grandpa_block_import, grandpa_link) = sc_finality_grandpa::block_import(
        client.clone(),
        &(client.clone() as Arc<_>),
        select_chain.clone(),
    )?;

    let babe_config = sc_consensus_babe::Config::get_or_compute(&*client)?;

    let (block_import, babe_link) =
        sc_consensus_babe::block_import(babe_config, grandpa_block_import.clone(), client.clone())?;

    let inherent_data_providers = InherentDataProviders::new();

    let import_queue = sc_consensus_babe::import_queue(
        babe_link.clone(),
        block_import.clone(),
        Some(Box::new(grandpa_block_import)),
        client.clone(),
        select_chain.clone(),
        inherent_data_providers.clone(),
        &task_manager.spawn_handle(),
        config.prometheus_registry(),
        sp_consensus::CanAuthorWithNativeVersion::new(client.executor().clone()),
    )?;

    Ok(sc_service::PartialComponents {
        client,
        backend,
        task_manager,
        import_queue,
        keystore_container,
        select_chain,
        inherent_data_providers,
        transaction_pool,
        other: (block_import, grandpa_link, babe_link),
    })
}

fn remote_keystore(_url: &str) -> Result<Arc<LocalKeystore>, &'static str> {
    // FIXME: here would the concrete keystore be built,
    //        must return a concrete type (NOT `LocalKeystore`) that
    //        implements `CryptoStore` and `SyncCryptoStore`
    Err("Remote Keystore not supported.")
}

/// Creates a full service from the configuration.
pub fn new_full_base(mut config: Configuration) -> Result<NewFullBase, ServiceError> {
    let sc_service::PartialComponents {
        client,
        backend,
        mut task_manager,
        import_queue,
        mut keystore_container,
        select_chain,
        transaction_pool,
        inherent_data_providers,
        other: (block_import, grandpa_link, babe_link),
    } = new_partial(&config)?;

    if let Some(url) = &config.keystore_remote {
        match remote_keystore(url) {
            Ok(k) => keystore_container.set_remote_keystore(k),
            Err(e) => {
                return Err(ServiceError::Other(format!(
                    "Error hooking up remote keystore for {}: {}",
                    url, e
                )))
            }
        };
    }

    config
        .network
        .extra_sets
        .push(sc_finality_grandpa::grandpa_peers_set_config());

    let (network, network_status_sinks, system_rpc_tx, network_starter) =
        sc_service::build_network(sc_service::BuildNetworkParams {
            config: &config,
            client: client.clone(),
            transaction_pool: transaction_pool.clone(),
            spawn_handle: task_manager.spawn_handle(),
            import_queue,
            on_demand: None,
            block_announce_validator_builder: None,
        })?;

    if config.offchain_worker.enabled {
        sc_service::build_offchain_workers(
            &config,
            backend.clone(),
            task_manager.spawn_handle(),
            client.clone(),
            network.clone(),
        );
    }

    let role = config.role.clone();
    let force_authoring = config.force_authoring;
    let backoff_authoring_blocks =
        Some(sc_consensus_slots::BackoffAuthoringOnFinalizedHeadLagging::default());
    let name = config.network.node_name.clone();
    let enable_grandpa = !config.disable_grandpa;
    let prometheus_registry = config.prometheus_registry().cloned();

    let justification_stream = grandpa_link.justification_stream();
    let shared_authority_set = grandpa_link.shared_authority_set().clone();
    let shared_voter_state = sc_finality_grandpa::SharedVoterState::empty();

    let finality_proof_provider =
        FinalityProofProvider::new_for_service(backend.clone(), Some(shared_authority_set.clone()));

    let babe_config = babe_link.config().clone();
    let shared_epoch_changes = babe_link.epoch_changes().clone();

    let rpc_extensions_builder = {
        let client = client.clone();
        let pool = transaction_pool.clone();
        let keystore = keystore_container.sync_keystore();
        let select_chain = select_chain.clone();

        Box::new(move |deny_unsafe, subscription_executor| {
            let deps = crate::node_rpc::FullDeps {
                client: client.clone(),
                pool: pool.clone(),
                select_chain: select_chain.clone(),
                deny_unsafe,
                babe: crate::node_rpc::BabeDeps {
                    babe_config: babe_config.clone(),
                    shared_epoch_changes: shared_epoch_changes.clone(),
                    keystore: keystore.clone(),
                },
                grandpa: crate::node_rpc::GrandpaDeps {
                    shared_voter_state: shared_voter_state.clone(),
                    shared_authority_set: shared_authority_set.clone(),
                    justification_stream: justification_stream.clone(),
                    subscription_executor,
                    finality_provider: finality_proof_provider.clone(),
                },
            };

            crate::node_rpc::create_full(deps)
        })
    };

    let (_rpc_handlers, telemetry_connection_notifier) =
        sc_service::spawn_tasks(sc_service::SpawnTasksParams {
            network: network.clone(),
            client: client.clone(),
            keystore: keystore_container.sync_keystore(),
            task_manager: &mut task_manager,
            transaction_pool: transaction_pool.clone(),
            rpc_extensions_builder,
            on_demand: None,
            remote_blockchain: None,
            backend,
            system_rpc_tx,
            network_status_sinks: network_status_sinks.clone(),
            config,
        })?;

    if let sc_service::config::Role::Authority { .. } = &role {
        let proposer = sc_basic_authorship::ProposerFactory::new(
            task_manager.spawn_handle(),
            client.clone(),
            transaction_pool.clone(),
            prometheus_registry.as_ref(),
        );

        let can_author_with =
            sp_consensus::CanAuthorWithNativeVersion::new(client.executor().clone());

        let babe_config = sc_consensus_babe::BabeParams {
            keystore: keystore_container.sync_keystore(),
            client: client.clone(),
            select_chain,
            env: proposer,
            block_import,
            sync_oracle: network.clone(),
            inherent_data_providers: inherent_data_providers.clone(),
            force_authoring,
            backoff_authoring_blocks,
            babe_link,
            can_author_with,
        };

        let babe = sc_consensus_babe::start_babe(babe_config)?;
        task_manager
            .spawn_essential_handle()
            .spawn_blocking("babe", babe);
    }

    // Spawn authority discovery module.
    if role.is_authority() {
        let authority_discovery_role =
            sc_authority_discovery::Role::PublishAndDiscover(keystore_container.keystore());
        let dht_event_stream =
            network
                .event_stream("authority-discovery")
                .filter_map(|e| async move {
                    match e {
                        Event::Dht(e) => Some(e),
                        _ => None,
                    }
                });
        let (authority_discovery_worker, _service) = sc_authority_discovery::new_worker_and_service(
            client.clone(),
            network.clone(),
            Box::pin(dht_event_stream),
            authority_discovery_role,
            prometheus_registry.clone(),
        );

        task_manager.spawn_handle().spawn(
            "authority-discovery-worker",
            authority_discovery_worker.run(),
        );
    }

    // if the node isn't actively participating in consensus then it doesn't
    // need a keystore, regardless of which protocol we use below.
    let keystore = if role.is_authority() {
        Some(keystore_container.sync_keystore())
    } else {
        None
    };

    let grandpa_config = sc_finality_grandpa::Config {
        // FIXME #1578 make this available through chainspec
        gossip_duration: Duration::from_millis(333),
        justification_period: 512,
        name: Some(name),
        observer_enabled: false,
        keystore,
        is_authority: role.is_network_authority(),
    };

    if enable_grandpa {
        // start the full GRANDPA voter
        // NOTE: non-authorities could run the GRANDPA observer protocol, but at
        // this point the full voter should provide better guarantees of block
        // and vote data availability than the observer. The observer has not
        // been tested extensively yet and having most nodes in a network run it
        // could lead to finality stalls.
        let grandpa_config = sc_finality_grandpa::GrandpaParams {
            config: grandpa_config,
            link: grandpa_link,
            network: network.clone(),
            voting_rule: sc_finality_grandpa::VotingRulesBuilder::default().build(),
            telemetry_on_connect: telemetry_connection_notifier.map(|x| x.on_connect_stream()),
            prometheus_registry,
            shared_voter_state: SharedVoterState::empty(),
        };

        // the GRANDPA voter task is considered infallible, i.e.
        // if it fails we take down the service with it.
        task_manager.spawn_essential_handle().spawn_blocking(
            "grandpa-voter",
            sc_finality_grandpa::run_grandpa_voter(grandpa_config)?,
        );
    }

    network_starter.start_network();

    Ok(NewFullBase {
        task_manager,
        inherent_data_providers,
        client,
        network,
        network_status_sinks,
        transaction_pool,
    })
}

/// Builds a new service for a full client.
pub fn new_full(config: Configuration) -> Result<TaskManager, ServiceError> {
    new_full_base(config).map(|NewFullBase { task_manager, .. }| task_manager)
}

/// Creates a light service from the configuration.
pub fn new_light_base(mut config: Configuration) -> Result<NewLightBase, ServiceError> {
    let (client, backend, keystore_container, mut task_manager, on_demand) =
        sc_service::new_light_parts::<Block, RuntimeApi, Executor>(&config)?;

    config
        .network
        .extra_sets
        .push(sc_finality_grandpa::grandpa_peers_set_config());

    let select_chain = sc_consensus::LongestChain::new(backend.clone());

    let transaction_pool = Arc::new(sc_transaction_pool::BasicPool::new_light(
        config.transaction_pool.clone(),
        config.prometheus_registry(),
        task_manager.spawn_handle(),
        client.clone(),
        on_demand.clone(),
    ));

    let (grandpa_block_import, _) = sc_finality_grandpa::block_import(
        client.clone(),
        &(client.clone() as Arc<_>),
        select_chain.clone(),
    )?;
    let justification_import = grandpa_block_import.clone();

    let babe_config = sc_consensus_babe::Config::get_or_compute(&*client)?;

    let (block_import, babe_link) =
        sc_consensus_babe::block_import(babe_config, grandpa_block_import, client.clone())?;

    let inherent_data_providers = InherentDataProviders::new();

    let import_queue = sc_consensus_babe::import_queue(
        babe_link,
        block_import,
        Some(Box::new(justification_import)),
        client.clone(),
        select_chain,
        inherent_data_providers,
        &task_manager.spawn_handle(),
        config.prometheus_registry(),
        sp_consensus::NeverCanAuthor,
    )?;

    let (network, network_status_sinks, system_rpc_tx, network_starter) =
        sc_service::build_network(sc_service::BuildNetworkParams {
            config: &config,
            client: client.clone(),
            transaction_pool: transaction_pool.clone(),
            spawn_handle: task_manager.spawn_handle(),
            import_queue,
            on_demand: Some(on_demand.clone()),
            block_announce_validator_builder: None,
        })?;

    if config.offchain_worker.enabled {
        sc_service::build_offchain_workers(
            &config,
            backend.clone(),
            task_manager.spawn_handle(),
            client.clone(),
            network.clone(),
        );
    }

    let (rpc_handlers, _) = sc_service::spawn_tasks(sc_service::SpawnTasksParams {
        remote_blockchain: Some(backend.remote_blockchain()),
        transaction_pool: transaction_pool.clone(),
        task_manager: &mut task_manager,
        on_demand: Some(on_demand),
        rpc_extensions_builder: Box::new(|_, _| ()),
        config,
        client: client.clone(),
        keystore: keystore_container.sync_keystore(),
        backend,
        network: network.clone(),
        network_status_sinks,
        system_rpc_tx,
    })?;

    network_starter.start_network();

    Ok(NewLightBase {
        task_manager,
        rpc_handlers,
        client,
        network,
        transaction_pool,
    })
}

/// Builds a new service for a light client.
pub fn new_light(config: Configuration) -> Result<TaskManager, ServiceError> {
    new_light_base(config).map(|NewLightBase { task_manager, .. }| task_manager)
}

#[cfg(test)]
mod tests {
    use crate::service::{new_full_base, new_light_base, NewFullBase, NewLightBase};
    use codec::Encode;
    use node_runtime::opaque::Block;
    use node_runtime::{currency::CENTS, SLOT_DURATION};
    use node_runtime::{Address, BalancesCall, Call, UncheckedExtrinsic};
    use node_runtime::{DigestItem, Signature};
    use node_runtime::{RuntimeApi};
    use sc_client_api::BlockBackend;
    use sc_consensus_babe::{BabeIntermediate, CompatibleDigestItem, INTERMEDIATE_KEY};
    use sc_consensus_epochs::descendent_query;
    use sc_service_test::TestNetNode;
    use sp_consensus::{
        BlockImport, BlockImportParams, BlockOrigin, Environment, ForkChoiceStrategy, Proposer,
        RecordProof,
    };
    use sp_core::{crypto::Pair as CryptoPair, H256};
    use sp_inherents::InherentDataProviders;
    use sp_keyring::AccountKeyring;
    use sp_keystore::CryptoStore;
    use sp_runtime::traits::IdentifyAccount;
    use sp_runtime::{
        generic::{BlockId, Digest, Era, SignedPayload},
        traits::Verify,
        traits::{Block as BlockT, Header as HeaderT},
        KeyTypeId,
    };
    use sp_timestamp;
    use sp_transaction_pool::{ChainEvent, MaintainedTransactionPool};
    use std::{any::Any, borrow::Cow, sync::Arc};
    use sc_executor::native_executor_instance;

    type AccountPublic = <Signature as Verify>::Signer;
    type FullClient = sc_service::TFullClient<Block, RuntimeApi, Executor>;
    type FullBackend = sc_service::TFullBackend<Block>;
    type FullSelectChain = sc_consensus::LongestChain<FullBackend, Block>;

    use std::convert::TryInto;

    // Our native executor instance.
    native_executor_instance!(
        pub Executor,
        node_runtime::api::dispatch,
        node_runtime::native_version,
        frame_benchmarking::benchmarking::HostFunctions,
    );

    #[derive(Clone)]
    pub struct Import {
        pub block_import: sc_consensus_babe::BabeBlockImport<
            Block,
            FullClient,
            sc_finality_grandpa::GrandpaBlockImport<
                FullBackend,
                Block,
                FullClient,
                FullSelectChain,
            >,
        >,
        pub babe_link: sc_consensus_babe::BabeLink<Block>,
    }

    #[async_std::test]
    // It is "ignored", but the node-cli ignored tests are running on the CI.
    // This can be run locally with `cargo test --release -p node-cli test_sync -- --ignored`.
    #[ignore]
    async fn test_sync() {
        let keystore_path = tempfile::tempdir().expect("Creates keystore path");
        let keystore =
            Arc::new(sc_keystore::LocalKeystore::open(keystore_path.path(), None).expect("Creates keystore"));

        let public = keystore
            .ecdsa_generate_new(KeyTypeId::default(), Some("//Alice"))
            .await
            .unwrap();

        keystore
            .insert_unknown(KeyTypeId::default(), "//Alice", public.as_ref())
            .await
            .expect("Creates key pair");

        let key = &keystore.keys(KeyTypeId::default()).await.unwrap()[0];

        let chain_spec = crate::chain_spec::tests::integration_test_config_with_single_authority();

        // For the block factory
        let mut slot_num = 1u64;

        // For the extrinsics factory
        let bob = Arc::new(AccountKeyring::Bob.pair());
        let charlie = Arc::new(AccountKeyring::Charlie.pair());
        let mut index = 0;

        sc_service_test::sync(
            chain_spec,
            |config| {
                let setup_handles = None;
                let NewFullBase {
                    task_manager,
                    inherent_data_providers,
                    client,
                    network,
                    transaction_pool,
                    ..
                } = new_full_base(config)?;

                let node = sc_service_test::TestNetComponents::new(
                    task_manager,
                    client,
                    network,
                    transaction_pool,
                );
                Ok((node, (inherent_data_providers, setup_handles.unwrap())))
            },
            |config| {
                let NewLightBase {
                    task_manager,
                    client,
                    network,
                    transaction_pool,
                    ..
                } = new_light_base(config)?;
                Ok(sc_service_test::TestNetComponents::new(
                    task_manager,
                    client,
                    network,
                    transaction_pool,
                ))
            },
            |service, (inherent_data_providers, import): &mut (InherentDataProviders, Import)| {
                let mut inherent_data = 
                    inherent_data_providers
                    .create_inherent_data()
                    .expect("Creates inherent data.");
                inherent_data
                    .replace_data(sp_consensus_babe::inherents::INHERENT_IDENTIFIER, &1u64);

                let parent_id = BlockId::number(service.client().chain_info().best_number);
                let parent_header = service.client().header(&parent_id).unwrap().unwrap();
                let parent_hash = parent_header.hash();
                let parent_number = *parent_header.number();

                futures::executor::block_on(service.transaction_pool().maintain(
                    ChainEvent::NewBestBlock {
                        hash: parent_header.hash(),
                        tree_route: None,
                    },
                ));

                let mut proposer_factory = sc_basic_authorship::ProposerFactory::new(
                    service.spawn_handle(),
                    service.client(),
                    service.transaction_pool(),
                    None,
                );

                let epoch_descriptor = import
                    .babe_link
                    .epoch_changes()
                    .lock()
                    .epoch_descriptor_for_child_of(
                        descendent_query(&*service.client()),
                        &parent_hash,
                        parent_number,
                        slot_num.into(),
                    )
                    .unwrap()
                    .unwrap();

                let mut digest = Digest::<H256>::default();

                // even though there's only one authority some slots might be empty,
                // so we must keep trying the next slots until we can claim one.
                let babe_pre_digest = loop {
                    inherent_data.replace_data(
                        sp_timestamp::INHERENT_IDENTIFIER,
                        &(slot_num * SLOT_DURATION),
                    );
                    if let Some(babe_pre_digest) = sc_consensus_babe::test_helpers::claim_slot(
                        slot_num.into(),
                        &parent_header,
                        &*service.client(),
                        keystore.clone(),
                        &import.babe_link,
                    ) {
                        break babe_pre_digest;
                    }

                    slot_num += 1;
                };

                digest.push(<DigestItem as CompatibleDigestItem>::babe_pre_digest(
                    babe_pre_digest,
                ));

                let new_block = futures::executor::block_on(async move {
                    let proposer = proposer_factory.init(&parent_header).await;
                    proposer
                        .unwrap()
                        .propose(
                            inherent_data,
                            digest,
                            std::time::Duration::from_secs(1),
                            RecordProof::Yes,
                        )
                        .await
                })
                .expect("Error making test block")
                .block;

                let (new_header, new_body) = new_block.deconstruct();
                let pre_hash = new_header.hash();
                // sign the pre-sealed hash of the block and then
                // add it to a digest item.
                let to_sign = pre_hash.encode();

                let signature = futures::executor::block_on(async {
                    keystore
                        .sign_with(KeyTypeId::default(), &key, &to_sign)
                        .await
                })
                .unwrap();

                let item =
                    <DigestItem as CompatibleDigestItem>::babe_seal(signature.try_into().unwrap());
                slot_num += 1;

                let mut params = BlockImportParams::new(BlockOrigin::File, new_header);
                params.post_digests.push(item);
                params.body = Some(new_body);
                params.intermediates.insert(
                    Cow::from(INTERMEDIATE_KEY),
                    Box::new(BabeIntermediate::<Block> { epoch_descriptor }) as Box<dyn Any>,
                );
                params.fork_choice = Some(ForkChoiceStrategy::LongestChain);

                import
                    .block_import
                    .import_block(params, Default::default())
                    .expect("error importing test block");
            },
            |service, _| {
                let amount = 5 * CENTS;
                let to: Address = AccountPublic::from(bob.public()).into_account().into();
                let from: Address = AccountPublic::from(charlie.public()).into_account().into();
                let genesis_hash = service.client().block_hash(0).unwrap().unwrap();
                let best_block_id = BlockId::number(service.client().chain_info().best_number);
                let (spec_version, transaction_version) = {
                    let version = service.client().runtime_version_at(&best_block_id).unwrap();
                    (version.spec_version, version.transaction_version)
                };
                let signer = charlie.clone();

                let function = Call::Balances(BalancesCall::transfer(to.into(), amount));

                let check_spec_version = frame_system::CheckSpecVersion::new();
                let check_tx_version = frame_system::CheckTxVersion::new();
                let check_genesis = frame_system::CheckGenesis::new();
                let check_era = frame_system::CheckEra::from(Era::Immortal);
                let check_nonce = frame_system::CheckNonce::from(index);
                let check_weight = frame_system::CheckWeight::new();
                let payment = pallet_transaction_payment::ChargeTransactionPayment::from(0);
                let extra = (
                    check_spec_version,
                    check_tx_version,
                    check_genesis,
                    check_era,
                    check_nonce,
                    check_weight,
                    payment,
                );
                let raw_payload = SignedPayload::from_raw(
                    function,
                    extra,
                    (
                        spec_version,
                        transaction_version,
                        genesis_hash,
                        genesis_hash,
                        (),
                        (),
                        (),
                    ),
                );
                let signature = raw_payload.using_encoded(|payload| signer.sign(payload));
                let (function, extra, _) = raw_payload.deconstruct();
                index += 1;
                UncheckedExtrinsic::new_signed(function, from.into(), signature.into(), extra)
                    .into()
            },
        );
    }

    #[test]
    #[ignore]
    fn test_consensus() {
        sc_service_test::consensus(
            crate::chain_spec::tests::integration_test_config_with_two_authorities(),
            |config| {
                let NewFullBase {
                    task_manager,
                    client,
                    network,
                    transaction_pool,
                    ..
                } = new_full_base(config)?;
                Ok(sc_service_test::TestNetComponents::new(
                    task_manager,
                    client,
                    network,
                    transaction_pool,
                ))
            },
            |config| {
                let NewLightBase {
                    task_manager,
                    client,
                    network,
                    transaction_pool,
                    ..
                } = new_light_base(config)?;
                Ok(sc_service_test::TestNetComponents::new(
                    task_manager,
                    client,
                    network,
                    transaction_pool,
                ))
            },
            vec!["//Alice".into(), "//Bob".into()],
        )
    }
}
