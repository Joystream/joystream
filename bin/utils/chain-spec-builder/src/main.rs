// Copyright 2019-2020 Parity Technologies (UK) Ltd.
// This file is part of Substrate.

// Substrate is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Substrate is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Substrate.  If not, see <http://www.gnu.org/licenses/>.

use clap::Parser;
use rand::{distributions::Alphanumeric, rngs::OsRng, Rng};

use std::{
    fs,
    path::{Path, PathBuf},
    sync::Arc,
};

use joystream_node::chain_spec::{
    self, content_config, initial_balances, joy_chain_spec_properties, project_token_config,
    storage_config, AccountId, AuthorityDiscoveryId, BabeId, GrandpaId, ImOnlineId,
    JOY_ADDRESS_PREFIX,
};

use sc_chain_spec::ChainType;
use sc_keystore::LocalKeystore;
use sc_telemetry::TelemetryEndpoints;
use sp_core::{
    crypto::{ByteArray, Ss58AddressFormat, Ss58Codec},
    sr25519,
};
use sp_keystore::{SyncCryptoStore, SyncCryptoStorePtr};

const TELEMETRY_URL: &str = "wss://telemetry.polkadot.io/submit/";

#[allow(non_camel_case_types)]
#[derive(Debug, Clone, PartialEq, enum_utils::FromStr)]
enum ChainDeployment {
    dev,
    local,
    staging,
    live,
}

#[allow(clippy::from_over_into)]
impl Into<ChainType> for ChainDeployment {
    fn into(self) -> ChainType {
        match self {
            ChainDeployment::dev => ChainType::Development,
            ChainDeployment::local => ChainType::Local,
            ChainDeployment::staging => ChainType::Live,
            ChainDeployment::live => ChainType::Live,
        }
    }
}

/// A utility to easily create a testnet chain spec definition with a given set
/// of authorities and endowed accounts and/or generate random accounts.
#[derive(Parser)]
#[clap(rename_all = "kebab-case")]
enum ChainSpecBuilder {
    /// Create a new chain spec with the given authority seeds, and endowed accounts.
    New {
        /// Authorities. Comma separated list. If list has single item it is
        /// considered a seed. The stash,controller and session keys will be derived from this seed.
        /// Otherwise the list should be ordered list of accounts:
        /// stash,controller,grandpa,babe,im_online,authority_discovery
        /// All the authories should be provided in same form, do not mix and match, seeds and accounts.
        #[clap(long, short, required = true)]
        authorities: Vec<String>,
        /// Active nominators (SS58 format), each backing a random subset of the aforementioned
        /// authorities. Same account used as stash and controller.
        #[clap(long, short)]
        nominator_accounts: Vec<String>,
        /// The path where the chain spec should be saved.
        #[clap(long, short, default_value = "./chain_spec.json")]
        chain_spec_path: PathBuf,
        /// Path to use when saving generated keystores for each authority.
        ///
        /// At this path, a new folder will be created for each authority's
        /// keystore named `auth-$i` where `i` is the authority index, i.e.
        /// `auth-0`, `auth-1`, etc.
        /// Only used if seeds are provided for authorities.
        #[clap(long, short)]
        keystore_path: Option<PathBuf>,
        /// The path to an initial balances file
        #[structopt(long)]
        initial_balances_path: Option<PathBuf>,
        /// Deployment type: dev, local, staging, live
        #[structopt(long, short, default_value = "live")]
        deployment: String,
        /// Endow authorities, and nominators. Initial balances
        /// overrides endowed amount.
        #[structopt(long, short)]
        fund_accounts: bool,
    },
    /// Create a new chain spec with the given number of authorities and endowed
    /// accounts. Random keys will be generated as required.
    Generate {
        /// The number of authorities.
        #[clap(long, short)]
        authorities: usize,
        /// The number of nominators backing the aforementioned authorities.
        ///
        /// Will nominate a random subset of `authorities`.
        #[clap(long, short, default_value = "0")]
        nominators: usize,
        /// The number of endowed accounts.
        #[clap(long, short, default_value = "0")]
        endowed: usize,
        /// The path where the chain spec should be saved.
        #[clap(long, short, default_value = "./chain_spec.json")]
        chain_spec_path: PathBuf,
        /// Path to use when saving generated keystores for each authority.
        ///
        /// At this path, a new folder will be created for each authority's
        /// keystore named `auth-$i` where `i` is the authority index, i.e.
        /// `auth-0`, `auth-1`, etc.
        #[clap(long, short)]
        keystore_path: Option<PathBuf>,
        /// The path to an initial balances file
        #[clap(long)]
        initial_balances_path: Option<PathBuf>,
        /// Deployment type: dev, local, staging, live
        #[clap(long, short, default_value = "live")]
        deployment: String,
    },
}

impl ChainSpecBuilder {
    /// Returns the path where the chain spec should be saved.
    fn chain_spec_path(&self) -> &Path {
        match self {
            ChainSpecBuilder::New {
                chain_spec_path, ..
            } => chain_spec_path.as_path(),
            ChainSpecBuilder::Generate {
                chain_spec_path, ..
            } => chain_spec_path.as_path(),
        }
    }

    /// Returns the path to load initial balances from
    fn initial_balances_path(&self) -> &Option<PathBuf> {
        match self {
            ChainSpecBuilder::New {
                initial_balances_path,
                ..
            } => initial_balances_path,
            ChainSpecBuilder::Generate {
                initial_balances_path,
                ..
            } => initial_balances_path,
        }
    }

    /// Returns the chain deployment
    fn chain_deployment(&self) -> ChainDeployment {
        match self {
            ChainSpecBuilder::New { deployment, .. } => deployment
                .parse()
                .expect("Failed to parse deployment argument"),
            ChainSpecBuilder::Generate { deployment, .. } => deployment
                .parse()
                .expect("Failed to parse deployment argument"),
        }
    }

    /// Returns wether to fund accounts or not
    fn fund_accounts(&self) -> bool {
        match self {
            // Authorities, Nominators, and endowed accounts by default
            // will not be endowed, unless explicitly selected.
            ChainSpecBuilder::New { fund_accounts, .. } => *fund_accounts,
            // When generating new authorities, nominators, endowed account,
            // we will always try to endow them.
            ChainSpecBuilder::Generate { .. } => true,
        }
    }
}

fn authorities_from_seeds(
    seeds: &[String],
) -> Vec<(
    AccountId,
    AccountId,
    GrandpaId,
    BabeId,
    ImOnlineId,
    AuthorityDiscoveryId,
)> {
    seeds
        .iter()
        .map(AsRef::as_ref)
        .map(chain_spec::authority_keys_from_seed)
        .collect::<Vec<_>>()
}

#[allow(clippy::too_many_arguments)]
fn genesis_constructor(
    deployment: &ChainDeployment,
    authorities: Vec<(
        AccountId,
        AccountId,
        GrandpaId,
        BabeId,
        ImOnlineId,
        AuthorityDiscoveryId,
    )>,
    nominator_accounts: &[AccountId],
    endowed_accounts: &[AccountId],
    initial_balances_path: &Option<PathBuf>,
    fund_accounts: bool,
) -> chain_spec::GenesisConfig {
    let genesis_balances = initial_balances_path
        .as_ref()
        .map(|path| initial_balances::balances_from_json(path.as_path()))
        .unwrap_or_else(Vec::new);

    let vesting_accounts = initial_balances_path
        .as_ref()
        .map(|path| initial_balances::vesting_from_json(path.as_path()))
        .unwrap_or_else(Vec::new);

    let content_cfg = match deployment {
        ChainDeployment::live => content_config::production_config(),
        _ => content_config::testing_config(),
    };

    let storage_cfg = match deployment {
        ChainDeployment::live => storage_config::production_config(),
        _ => storage_config::testing_config(),
    };

    let project_token_cfg = match deployment {
        ChainDeployment::live => project_token_config::production_config(),
        _ => project_token_config::testing_config(),
    };

    chain_spec::testnet_genesis(
        fund_accounts,
        authorities,
        nominator_accounts.to_vec(),
        endowed_accounts.to_vec(),
        genesis_balances,
        vesting_accounts,
        content_cfg,
        storage_cfg,
        project_token_cfg,
    )
}

#[allow(clippy::too_many_arguments)]
fn generate_chain_spec(
    deployment: ChainDeployment,
    authorities: Vec<String>,
    nominator_accounts: Vec<String>,
    endowed_accounts: Vec<String>,
    initial_balances_path: Option<PathBuf>,
    fund_accounts: bool,
) -> Result<String, String> {
    let parse_account = |address: String| {
        AccountId::from_string(&address)
            .map_err(|err| format!("Failed to parse account address: {:?} {:?}", address, err))
    };

    let authorities = if authorities
        .iter()
        .map(|auth| auth.split(',').count())
        .all(|len| len == 1)
    {
        authorities_from_seeds(&authorities)
    } else {
        // assume accounts, panic if not as expected
        authorities
            .iter()
            .map(|addresses| addresses.split(',').collect())
            .map(|addresses: Vec<&str>| {
                if addresses.len() != 6 {
                    panic!("Wrong number of addresses provided for authority");
                }
                (
                    parse_account(addresses[0].into()).expect("failed to parse authority"),
                    parse_account(addresses[1].into()).expect("failed to parse authority"),
                    GrandpaId::from_string(addresses[2]).expect("failed to parse authority"),
                    BabeId::from_string(addresses[3]).expect("failed to parse authority"),
                    ImOnlineId::from_string(addresses[4]).expect("failed to parse authority"),
                    AuthorityDiscoveryId::from_string(addresses[5])
                        .expect("failed to parse authority"),
                )
            })
            .collect()
    };

    let nominator_accounts = nominator_accounts
        .into_iter()
        .map(parse_account)
        .collect::<Result<Vec<_>, String>>()?;

    let endowed_accounts = endowed_accounts
        .into_iter()
        .map(parse_account)
        .collect::<Result<Vec<_>, String>>()?;

    let telemetry_endpoints = Some(
        TelemetryEndpoints::new(vec![(TELEMETRY_URL.to_string(), 0)])
            .expect("Staging telemetry url is valid; qed"),
    );

    let chain_spec = chain_spec::ChainSpec::from_genesis(
        "Joystream Testnet",
        "joy_testnet",
        deployment.clone().into(),
        move || {
            genesis_constructor(
                &deployment,
                authorities.clone(),
                &nominator_accounts,
                &endowed_accounts,
                &initial_balances_path,
                fund_accounts,
            )
        },
        vec![],
        telemetry_endpoints,
        Some(&*"/joy/testnet/0"),
        None, // Some(&*"joy"),
        Some(joy_chain_spec_properties()),
        Default::default(),
    );

    chain_spec.as_json(false)
}

fn generate_authority_keys_and_store(seeds: &[String], keystore_path: &Path) -> Result<(), String> {
    for (n, seed) in seeds.iter().enumerate() {
        let keystore: SyncCryptoStorePtr = Arc::new(
            LocalKeystore::open(keystore_path.join(format!("auth-{}", n)), None)
                .map_err(|err| err.to_string())?,
        );

        let (_, _, grandpa, babe, im_online, authority_discovery) =
            chain_spec::authority_keys_from_seed(seed);

        let insert_key = |key_type, public| {
            SyncCryptoStore::insert_unknown(&*keystore, key_type, seed, public)
                .map_err(|_| format!("Failed to insert key: {:?}", key_type))
        };

        insert_key(sp_core::crypto::key_types::BABE, babe.as_slice())?;

        insert_key(sp_core::crypto::key_types::GRANDPA, grandpa.as_slice())?;

        insert_key(sp_core::crypto::key_types::IM_ONLINE, im_online.as_slice())?;

        insert_key(
            sp_core::crypto::key_types::AUTHORITY_DISCOVERY,
            authority_discovery.as_slice(),
        )?;
    }

    Ok(())
}

fn print_seeds(authority_seeds: &[String], nominator_seeds: &[String], endowed_seeds: &[String]) {
    println!("# Authority seeds");

    for (n, seed) in authority_seeds.iter().enumerate() {
        println!("auth_{}={}", n, seed);
    }

    println!();

    if !nominator_seeds.is_empty() {
        println!("# Nominator seeds");
        for (n, seed) in nominator_seeds.iter().enumerate() {
            println!("nom_{}={}", n, seed);
        }
    }

    println!();

    if !endowed_seeds.is_empty() {
        println!("# Endowed seeds");
        for (n, seed) in endowed_seeds.iter().enumerate() {
            println!("endowed_{}={}", n, seed);
        }

        println!();
    }
}

#[async_std::main]
async fn main() -> Result<(), String> {
    #[cfg(build_type = "debug")]
    println!(
		"The chain spec builder builds a chain specification that includes a Joystream runtime compiled as WASM. To \
		 ensure proper functioning of the included runtime compile (or run) the chain spec builder binary in \
		 `--release` mode.\n",
	);

    sp_core::crypto::set_default_ss58_version(Ss58AddressFormat::custom(JOY_ADDRESS_PREFIX));

    let builder = ChainSpecBuilder::from_args();
    let chain_spec_path = builder.chain_spec_path().to_path_buf();
    let initial_balances_path = builder.initial_balances_path().clone();
    let deployment = builder.chain_deployment();
    let fund_accounts = builder.fund_accounts();

    let (authorities, nominator_accounts, endowed_accounts) = match builder {
        ChainSpecBuilder::Generate {
            authorities,
            nominators,
            endowed,
            keystore_path,
            ..
        } => {
            let authorities = authorities.max(1);
            let rand_seed = || -> String {
                let rand_str: String = OsRng
                    .sample_iter(&Alphanumeric)
                    .take(32)
                    .map(char::from)
                    .collect();
                format!("//{}", rand_str)
            };

            let authority_seeds = (0..authorities).map(|_| rand_seed()).collect::<Vec<_>>();
            let nominator_seeds = (0..nominators).map(|_| rand_seed()).collect::<Vec<_>>();
            let endowed_seeds = (0..endowed).map(|_| rand_seed()).collect::<Vec<_>>();

            print_seeds(&authority_seeds, &nominator_seeds, &endowed_seeds);

            if let Some(keystore_path) = keystore_path {
                generate_authority_keys_and_store(&authority_seeds, &keystore_path)?;
            }

            let nominator_accounts = nominator_seeds
                .into_iter()
                .map(|seed| {
                    chain_spec::get_account_id_from_seed::<sr25519::Public>(&seed).to_ss58check()
                })
                .collect();

            let endowed_accounts = endowed_seeds
                .into_iter()
                .map(|seed| {
                    chain_spec::get_account_id_from_seed::<sr25519::Public>(&seed).to_ss58check()
                })
                .collect();

            (authority_seeds, nominator_accounts, endowed_accounts)
        }
        ChainSpecBuilder::New {
            authorities,
            nominator_accounts,
            keystore_path,
            ..
        } => {
            if authorities
                .iter()
                .map(|auth| auth.split(',').count())
                .all(|len| len == 1)
            {
                // seeds
                if let Some(keystore_path) = keystore_path {
                    generate_authority_keys_and_store(&authorities, &keystore_path)?;
                }
            }

            (authorities, nominator_accounts, vec![])
        }
    };

    let json = generate_chain_spec(
        deployment,
        authorities,
        nominator_accounts,
        endowed_accounts,
        initial_balances_path,
        fund_accounts,
    )?;

    fs::write(chain_spec_path, json).map_err(|err| err.to_string())
}
