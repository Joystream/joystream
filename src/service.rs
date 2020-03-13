// Copyright 2019 Joystream Contributors
// This file is part of Joystream node.

// Joystream node is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Joystream node is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Joystream node.  If not, see <http://www.gnu.org/licenses/>.

#![warn(unused_extern_crates)]

//! Service and ServiceFactory implementation. Specialized wrapper over substrate service.

use client_db::Backend;
use grandpa::{self, FinalityProofProvider as GrandpaFinalityProofProvider};
use inherents::InherentDataProviders;
use network::{construct_simple_protocol, NetworkService};
use node_runtime::{self, opaque::Block, GenesisConfig, RuntimeApi};
use offchain::OffchainWorkers;
use primitives::Blake2Hasher;
use runtime_primitives::traits::Block as BlockT;
use std::sync::Arc;
use substrate_client::{Client, LocalCallExecutor, LongestChain};
pub use substrate_executor::{native_executor_instance, NativeExecutor};
use substrate_service::{
    error::Error as ServiceError, AbstractService, Configuration, NetworkStatus, Service,
    ServiceBuilder,
};
use transaction_pool::{self, txpool::Pool as TransactionPool};

construct_simple_protocol! {
    /// Demo protocol attachment for substrate.
    pub struct NodeProtocol where Block = Block { }
}

// Declare an instance of the native executor named `Executor`. Include the wasm binary as the
// equivalent wasm code.
native_executor_instance!(
	pub Executor,
	node_runtime::api::dispatch,
	node_runtime::native_version
);

/// Starts a `ServiceBuilder` for a full service.
///
/// Use this macro if you don't actually need the full service, but just the builder in order to
/// be able to perform chain operations.
#[macro_export]
macro_rules! new_full_start {
    ($config:expr) => {{
        // type RpcExtension = jsonrpc_core::IoHandler<substrate_rpc::Metadata>;
        let mut import_setup = None;
        let inherent_data_providers = inherents::InherentDataProviders::new();

        let builder = substrate_service::ServiceBuilder::new_full::<
            node_runtime::opaque::Block,
            node_runtime::RuntimeApi,
            crate::service::Executor,
        >($config)?
        .with_select_chain(|_config, backend| {
            Ok(substrate_client::LongestChain::new(backend.clone()))
        })?
        .with_transaction_pool(|config, client| {
            Ok(transaction_pool::txpool::Pool::new(
                config,
                transaction_pool::FullChainApi::new(client),
            ))
        })?
        .with_import_queue(|_config, client, mut select_chain, _transaction_pool| {
            let select_chain = select_chain
                .take()
                .ok_or_else(|| substrate_service::Error::SelectChainRequired)?;
            let (grandpa_block_import, grandpa_link) =
                grandpa::block_import::<_, _, _, node_runtime::RuntimeApi, _>(
                    client.clone(),
                    &*client,
                    select_chain,
                )?;
            let justification_import = grandpa_block_import.clone();

            let (block_import, babe_link) = babe::block_import(
                babe::Config::get_or_compute(&*client)?,
                grandpa_block_import,
                client.clone(),
                client.clone(),
            )?;

            let import_queue = babe::import_queue(
                babe_link.clone(),
                block_import.clone(),
                Some(Box::new(justification_import)),
                None,
                client.clone(),
                client,
                inherent_data_providers.clone(),
            )?;

            import_setup = Some((block_import, grandpa_link, babe_link));
            Ok(import_queue)
        })?;
        // We don't have any custom rpc commands...
        // .with_rpc_extensions(|client, pool| -> RpcExtension {
        // 	node_rpc::create(client, pool)
        // })?;

        (builder, import_setup, inherent_data_providers)
    }};
}

/// Creates a full service from the configuration.
///
/// We need to use a macro because the test suit doesn't work with an opaque service. It expects
/// concrete types instead.
macro_rules! new_full {
	($config:expr, $with_startup_data: expr) => {{
		use futures::sync::mpsc;
		use network::DhtEvent;

		let (
			is_authority,
			force_authoring,
			name,
			disable_grandpa
		) = (
			$config.roles.is_authority(),
			$config.force_authoring,
			$config.name.clone(),
			$config.disable_grandpa
		);

        // sentry nodes announce themselves as authorities to the network
		// and should run the same protocols authorities do, but it should
		// never actively participate in any consensus process.
        let participates_in_consensus = is_authority && !$config.sentry_mode;

		let (builder, mut import_setup, inherent_data_providers) = new_full_start!($config);

		// Dht event channel from the network to the authority discovery module. Use bounded channel to ensure
		// back-pressure. Authority discovery is triggering one event per authority within the current authority set.
		// This estimates the authority set size to be somewhere below 10 000 thereby setting the channel buffer size to
		// 10 000.
		let (dht_event_tx, _dht_event_rx) =
			mpsc::channel::<DhtEvent>(10_000);

		let service = builder.with_network_protocol(|_| Ok(crate::service::NodeProtocol::new()))?
			.with_finality_proof_provider(|client, backend|
				Ok(Arc::new(grandpa::FinalityProofProvider::new(backend, client)) as _)
			)?
			.with_dht_event_tx(dht_event_tx)?
			.build()?;

		let (block_import, grandpa_link, babe_link) = import_setup.take()
				.expect("Link Half and Block Import are present for Full Services or setup failed before. qed");

		($with_startup_data)(&block_import, &babe_link);

		if participates_in_consensus {
			let proposer = substrate_basic_authorship::ProposerFactory {
				client: service.client(),
				transaction_pool: service.transaction_pool(),
			};

			let client = service.client();
			let select_chain = service.select_chain()
				.ok_or(substrate_service::Error::SelectChainRequired)?;

			let babe_config = babe::BabeParams {
				keystore: service.keystore(),
				client,
				select_chain,
				env: proposer,
				block_import,
				sync_oracle: service.network(),
				inherent_data_providers: inherent_data_providers.clone(),
				force_authoring,
				babe_link,
			};

			let babe = babe::start_babe(babe_config)?;
			service.spawn_essential_task(babe);
        }

        // if the node isn't actively participating in consensus then it doesn't
		// need a keystore, regardless of which protocol we use below.
		let keystore = if participates_in_consensus {
			Some(service.keystore())
		} else {
			None
        };

        let config = grandpa::Config {
            // FIXME #1578 make this available through chainspec
            gossip_duration: std::time::Duration::from_millis(333),
            justification_period: 512,
            name: Some(name),
            observer_enabled: true,
            keystore,
            is_authority,
        };

		match (is_authority, disable_grandpa) {
			(false, false) => {
				// start the lightweight GRANDPA observer
				service.spawn_task(Box::new(grandpa::run_grandpa_observer(
					config,
					grandpa_link,
					service.network(),
					service.on_exit(),
				)?));
			},
			(true, false) => {
				// start the full GRANDPA voter
				let grandpa_config = grandpa::GrandpaParams {
					config: config,
					link: grandpa_link,
					network: service.network(),
					inherent_data_providers: inherent_data_providers.clone(),
					on_exit: service.on_exit(),
					telemetry_on_connect: Some(service.telemetry_on_connect_stream()),
					voting_rule: grandpa::VotingRulesBuilder::default().build(),
                };
                // the GRANDPA voter task is considered infallible, i.e.
				// if it fails we take down the service with it.
				service.spawn_essential_task(grandpa::run_grandpa_voter(grandpa_config)?);
			},
			(_, true) => {
				grandpa::setup_disabled_grandpa(
					service.client(),
					&inherent_data_providers,
					service.network(),
				)?;
			},
		}

		Ok((service, inherent_data_providers))
	}};
	($config:expr) => {{
		new_full!($config, |_, _| {})
	}}
}

#[allow(dead_code)]
type ConcreteBlock = node_runtime::opaque::Block;
#[allow(dead_code)]
type ConcreteClient = Client<
    Backend<ConcreteBlock>,
    LocalCallExecutor<Backend<ConcreteBlock>, NativeExecutor<Executor>>,
    ConcreteBlock,
    node_runtime::RuntimeApi,
>;
#[allow(dead_code)]
type ConcreteBackend = Backend<ConcreteBlock>;

/// A specialized configuration object for setting up the node..
pub type NodeConfiguration<C> =
    Configuration<C, GenesisConfig /*, crate::chain_spec::Extensions*/>;

/// Builds a new service for a full client.
pub fn new_full<C: Send + Default + 'static>(config: NodeConfiguration<C>)
-> Result<
	Service<
		ConcreteBlock,
		ConcreteClient,
		LongestChain<ConcreteBackend, ConcreteBlock>,
		NetworkStatus<ConcreteBlock>,
		NetworkService<ConcreteBlock, crate::service::NodeProtocol, <ConcreteBlock as BlockT>::Hash>,
		TransactionPool<transaction_pool::FullChainApi<ConcreteClient, ConcreteBlock>>,
		OffchainWorkers<
			ConcreteClient,
			<ConcreteBackend as substrate_client::backend::Backend<Block, Blake2Hasher>>::OffchainStorage,
			ConcreteBlock,
		>
	>,
	ServiceError,
>
{
    new_full!(config).map(|(service, _)| service)
}

/// Builds a new service for a light client.
pub fn new_light<C: Send + Default + 'static>(
    config: NodeConfiguration<C>,
) -> Result<impl AbstractService, ServiceError> {
    // type RpcExtension = jsonrpc_core::IoHandler<substrate_rpc::Metadata>;
    let inherent_data_providers = InherentDataProviders::new();

    let service = ServiceBuilder::new_light::<Block, RuntimeApi, Executor>(config)?
        .with_select_chain(|_config, backend| Ok(LongestChain::new(backend.clone())))?
        .with_transaction_pool(|config, client| {
            Ok(TransactionPool::new(
                config,
                transaction_pool::FullChainApi::new(client),
            ))
        })?
        .with_import_queue_and_fprb(
            |_config, client, backend, fetcher, _select_chain, _tx_pool| {
                let fetch_checker = fetcher
                    .map(|fetcher| fetcher.checker().clone())
                    .ok_or_else(|| {
                        "Trying to start light import queue without active fetch checker"
                    })?;
                let grandpa_block_import = grandpa::light_block_import::<_, _, _, RuntimeApi>(
                    client.clone(),
                    backend,
                    &*client,
                    Arc::new(fetch_checker),
                )?;

                let finality_proof_import = grandpa_block_import.clone();
                let finality_proof_request_builder =
                    finality_proof_import.create_finality_proof_request_builder();

                let (babe_block_import, babe_link) = babe::block_import(
                    babe::Config::get_or_compute(&*client)?,
                    grandpa_block_import,
                    client.clone(),
                    client.clone(),
                )?;

                let import_queue = babe::import_queue(
                    babe_link,
                    babe_block_import,
                    None,
                    Some(Box::new(finality_proof_import)),
                    client.clone(),
                    client,
                    inherent_data_providers.clone(),
                )?;

                Ok((import_queue, finality_proof_request_builder))
            },
        )?
        .with_network_protocol(|_| Ok(NodeProtocol::new()))?
        .with_finality_proof_provider(|client, backend| {
            Ok(Arc::new(GrandpaFinalityProofProvider::new(backend, client)) as _)
        })?
        // We don't have any custom rpc extensions
        // .with_rpc_extensions(|client, pool| -> RpcExtension {
        // 	node_rpc::create(client, pool)
        // })?
        .build()?;

    Ok(service)
}
