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

//! Service and ServiceFactory implementation. Specialized wrapper over Substrate service.

#![warn(unused_extern_crates)]

use basic_authorship::ProposerFactory;
use consensus::{import_queue, start_aura, AuraImportQueue, NothingExtra, SlotDuration};
use grandpa;
use inherents::InherentDataProviders;
use joystream_node_runtime::{self, opaque::Block, GenesisConfig, RuntimeApi};
use log::info;
use network::construct_simple_protocol;
use primitives::{crypto::Ss58Codec, ed25519::Pair, sr25519::Public as SrPublic, Pair as PairT};
use std::sync::Arc;
use std::time::Duration;
use substrate_client as client;
use substrate_executor::native_executor_instance;
use substrate_service::construct_service_factory;
use substrate_service::{
    FactoryFullConfiguration, FullBackend, FullClient, FullComponents, FullExecutor, LightBackend,
    LightClient, LightComponents, LightExecutor, TaskExecutor,
};
use transaction_pool::{self, txpool::Pool as TransactionPool};

// Get new prefixed ss58 address encoding for ed25519 public keys
fn ed_ss58check(public_key: &primitives::ed25519::Public) -> String {
    let raw_bytes: &[u8; 32] = public_key.as_ref();
    // Interpret bytes as sr25519 public key
    let v: SrPublic = SrPublic::from_raw(raw_bytes.clone());
    v.to_ss58check()
}

pub use substrate_executor::NativeExecutor;
// Our native executor instance.
native_executor_instance!(
	pub Executor,
	joystream_node_runtime::api::dispatch,
	joystream_node_runtime::native_version,
	include_bytes!("../substrate-runtime-joystream/wasm/target/wasm32-unknown-unknown/release/joystream_node_runtime_wasm.compact.wasm")
);

pub struct NodeConfig<F: substrate_service::ServiceFactory> {
    pub grandpa_import_setup: Option<(
        Arc<grandpa::BlockImportForService<F>>,
        grandpa::LinkHalfForService<F>,
    )>,
    inherent_data_providers: InherentDataProviders,
}

impl<F> Default for NodeConfig<F>
where
    F: substrate_service::ServiceFactory,
{
    fn default() -> NodeConfig<F> {
        NodeConfig {
            grandpa_import_setup: None,
            inherent_data_providers: InherentDataProviders::new(),
        }
    }
}

construct_simple_protocol! {
    /// Demo protocol attachment for substrate.
    pub struct NodeProtocol where Block = Block { }
}

construct_service_factory! {
    struct Factory {
        Block = Block,
        RuntimeApi = RuntimeApi,
        NetworkProtocol = NodeProtocol { |config| Ok(NodeProtocol::new()) },
        RuntimeDispatch = Executor,
        FullTransactionPoolApi = transaction_pool::ChainApi<client::Client<FullBackend<Self>, FullExecutor<Self>, Block, RuntimeApi>, Block>
            { |config, client| Ok(TransactionPool::new(config, transaction_pool::ChainApi::new(client))) },
        LightTransactionPoolApi = transaction_pool::ChainApi<client::Client<LightBackend<Self>, LightExecutor<Self>, Block, RuntimeApi>, Block>
            { |config, client| Ok(TransactionPool::new(config, transaction_pool::ChainApi::new(client))) },
        Genesis = GenesisConfig,
        Configuration = NodeConfig<Self>,
        FullService = FullComponents<Self>
            { |config: FactoryFullConfiguration<Self>, executor: TaskExecutor|
                FullComponents::<Factory>::new(config, executor)
            },
        AuthoritySetup = {
            |mut service: Self::FullService, executor: TaskExecutor, key: Option<Arc<Pair>>| {
                let (block_import, link_half) = service.config.custom.grandpa_import_setup.take()
                    .expect("Link Half and Block Import are present for Full Services or setup failed before. qed");

                if let Some(ref key) = key {
                    info!("Using authority key {}", ed_ss58check(&key.public()));
                    let proposer = Arc::new(ProposerFactory {
                        client: service.client(),
                        transaction_pool: service.transaction_pool(),
                        inherents_pool: service.inherents_pool(),
                    });

                    let client = service.client();
                    executor.spawn(start_aura(
                        SlotDuration::get_or_compute(&*client)?,
                        key.clone(),
                        client,
                        block_import.clone(),
                        proposer,
                        service.network(),
                        service.on_exit(),
                        service.config.custom.inherent_data_providers.clone(),
                        service.config.force_authoring,
                    )?);

                    info!("Running Grandpa session as Authority {}", ed_ss58check(&key.public()));
                }

                let key = if service.config.disable_grandpa {
                    None
                } else {
                    key
                };

                executor.spawn(grandpa::run_grandpa(
                    grandpa::Config {
                        local_key: key,
                        // FIXME #1578 make this available through chainspec
                        gossip_duration: Duration::from_millis(333),
                        justification_period: 4096,
                        name: Some(service.config.name.clone())
                    },
                    link_half,
                    grandpa::NetworkBridge::new(service.network()),
                    service.config.custom.inherent_data_providers.clone(),
                    service.on_exit(),
                )?);

                Ok(service)
            }
        },
        LightService = LightComponents<Self>
            { |config, executor| <LightComponents<Factory>>::new(config, executor) },
        FullImportQueue = AuraImportQueue<
            Self::Block,
        >
            { |config: &mut FactoryFullConfiguration<Self> , client: Arc<FullClient<Self>>| {
                let slot_duration = SlotDuration::get_or_compute(&*client)?;
                let (block_import, link_half) =
                    grandpa::block_import::<_, _, _, RuntimeApi, FullClient<Self>>(
                        client.clone(), client.clone()
                    )?;
                let block_import = Arc::new(block_import);
                let justification_import = block_import.clone();

                config.custom.grandpa_import_setup = Some((block_import.clone(), link_half));

                import_queue::<_, _, _, Pair>(
                    slot_duration,
                    block_import,
                    Some(justification_import),
                    client,
                    NothingExtra,
                    config.custom.inherent_data_providers.clone(),
                ).map_err(Into::into)
            }},
        LightImportQueue = AuraImportQueue<
            Self::Block,
        >
            { |config: &mut FactoryFullConfiguration<Self>, client: Arc<LightClient<Self>>|
                import_queue::<_, _, _, Pair>(
                    SlotDuration::get_or_compute(&*client)?,
                    client.clone(),
                    None,
                    client,
                    NothingExtra,
                    config.custom.inherent_data_providers.clone(),
                ).map_err(Into::into)
            },
    }
}
