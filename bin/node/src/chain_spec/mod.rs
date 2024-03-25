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

// Clippy linter warning.
// Disable it because we use such syntax for a code readability.
// Example:  voting_period: 1 * DAY
#![allow(clippy::identity_op)]

pub mod content_config;
pub mod council_config;
pub mod forum_config;
pub mod initial_balances;
pub mod project_token_config;
pub mod storage_config;

pub use grandpa_primitives::AuthorityId as GrandpaId;

use node_runtime::{
    constants::currency::{DOLLARS, MIN_NOMINATOR_BOND, MIN_VALIDATOR_BOND},
    wasm_binary_unwrap, AuthorityDiscoveryConfig, BabeConfig, BalancesConfig, Block, ContentConfig,
    ExistentialDeposit, GrandpaConfig, ImOnlineConfig, MaxNominations, ProjectTokenConfig,
    SessionConfig, SessionKeys, StakerStatus, StakingConfig, StorageConfig, SystemConfig,
    TransactionPaymentConfig, VestingConfig,
};
pub use pallet_im_online::sr25519::AuthorityId as ImOnlineId;
use sc_chain_spec::ChainSpecExtension;
use sc_service::ChainType;

use pallet_staking::Forcing;
use serde::{Deserialize, Serialize};
use serde_json as json;
pub use sp_authority_discovery::AuthorityId as AuthorityDiscoveryId;
pub use sp_consensus_babe::AuthorityId as BabeId;
use sp_core::{sr25519, Pair, Public};
use sp_runtime::{
    traits::{IdentifyAccount, Verify},
    FixedU128, Perbill,
};

pub use node_runtime::constants::JOY_ADDRESS_PREFIX;
pub use node_runtime::primitives::{AccountId, Balance, BlockNumber, Signature};
pub use node_runtime::GenesisConfig;

type AccountPublic = <Signature as Verify>::Signer;

pub fn joystream_mainnet_config() -> Result<ChainSpec, String> {
    ChainSpec::from_json_bytes(&include_bytes!("../../../../joy-mainnet.json")[..])
}

/// Node `ChainSpec` extensions.
///
/// Additional parameters for some Substrate core modules,
/// customizable from the chain spec.
#[derive(Default, Clone, Serialize, Deserialize, ChainSpecExtension)]
#[serde(rename_all = "camelCase")]
pub struct Extensions {
    /// Block numbers with known hashes.
    pub fork_blocks: sc_client_api::ForkBlocks<Block>,
    /// Known bad block hashes.
    pub bad_blocks: sc_client_api::BadBlocks<Block>,
    /// The light sync state extension used by the sync-state rpc.
    pub light_sync_state: sc_sync_state_rpc::LightSyncStateExtension,
}

/// Specialized `ChainSpec`.
pub type ChainSpec = sc_service::GenericChainSpec<GenesisConfig, Extensions>;

pub fn session_keys(
    grandpa: GrandpaId,
    babe: BabeId,
    im_online: ImOnlineId,
    authority_discovery: AuthorityDiscoveryId,
) -> SessionKeys {
    SessionKeys {
        grandpa,
        babe,
        im_online,
        authority_discovery,
    }
}

/// Helper function to generate a crypto pair from seed
pub fn get_from_seed<TPublic: Public>(seed: &str) -> <TPublic::Pair as Pair>::Public {
    let password = None;
    TPublic::Pair::from_string(seed, password)
        .expect("static values are valid; qed")
        .public()
}

/// Helper function to generate an account ID from seed
pub fn get_account_id_from_seed<TPublic: Public>(seed: &str) -> AccountId
where
    AccountPublic: From<<TPublic::Pair as Pair>::Public>,
{
    AccountPublic::from(get_from_seed::<TPublic>(seed)).into_account()
}

/// Helper function to generate stash, controller and session key from seed
pub fn authority_keys_from_seed(
    seed: &str,
) -> (
    AccountId,
    AccountId,
    GrandpaId,
    BabeId,
    ImOnlineId,
    AuthorityDiscoveryId,
) {
    (
        get_account_id_from_seed::<sr25519::Public>(&format!("{}//stash", seed)),
        get_account_id_from_seed::<sr25519::Public>(seed),
        get_from_seed::<GrandpaId>(seed),
        get_from_seed::<BabeId>(seed),
        get_from_seed::<ImOnlineId>(seed),
        get_from_seed::<AuthorityDiscoveryId>(seed),
    )
}

// Accounts to endow on dev and local test networks
fn development_endowed_accounts() -> Vec<AccountId> {
    vec![
        get_account_id_from_seed::<sr25519::Public>("//Alice"),
        get_account_id_from_seed::<sr25519::Public>("//Bob"),
        get_account_id_from_seed::<sr25519::Public>("//Charlie"),
        get_account_id_from_seed::<sr25519::Public>("//Dave"),
        get_account_id_from_seed::<sr25519::Public>("//Eve"),
        get_account_id_from_seed::<sr25519::Public>("//Ferdie"),
        get_account_id_from_seed::<sr25519::Public>("//Alice//stash"),
        get_account_id_from_seed::<sr25519::Public>("//Bob//stash"),
        get_account_id_from_seed::<sr25519::Public>("//Charlie//stash"),
        get_account_id_from_seed::<sr25519::Public>("//Dave//stash"),
        get_account_id_from_seed::<sr25519::Public>("//Eve//stash"),
        get_account_id_from_seed::<sr25519::Public>("//Ferdie//stash"),
    ]
}

pub fn joy_chain_spec_properties() -> json::map::Map<String, json::Value> {
    let mut properties: json::map::Map<String, json::Value> = json::map::Map::new();
    properties.insert(
        String::from("tokenDecimals"),
        json::Value::Number(json::Number::from(10)),
    );
    properties.insert(
        String::from("tokenSymbol"),
        json::Value::String(String::from("JOY")),
    );
    properties.insert(
        String::from("ss58Format"),
        json::Value::Number(json::Number::from(JOY_ADDRESS_PREFIX)),
    );
    properties
}

#[allow(clippy::too_many_arguments)]
/// Helper function to create GenesisConfig for testing
pub fn testnet_genesis(
    fund_accounts: bool,
    initial_authorities: Vec<(
        AccountId,
        AccountId,
        GrandpaId,
        BabeId,
        ImOnlineId,
        AuthorityDiscoveryId,
    )>,
    initial_nominators: Vec<AccountId>,
    endowed_accounts: Vec<AccountId>,
    mut genesis_balances: Vec<(AccountId, Balance)>,
    vesting_accounts: Vec<(AccountId, BlockNumber, BlockNumber, Balance)>,
    content_cfg: ContentConfig,
    storage_cfg: StorageConfig,
    project_token_cfg: ProjectTokenConfig,
) -> GenesisConfig {
    // staking benchmakrs is not sensitive to actual value of min bonds so
    // accounts are not funded with sufficient funds and fail with InsufficientBond err
    // so for benchmarks we set min bond to zero.
    const GENESIS_MIN_NOMINATOR_BOND: Balance = if cfg!(feature = "runtime-benchmarks") {
        0
    } else {
        MIN_NOMINATOR_BOND
    };
    const GENESIS_MIN_VALIDATOR_BOND: Balance = if cfg!(feature = "runtime-benchmarks") {
        0
    } else {
        MIN_VALIDATOR_BOND
    };

    // How much each initial validator at genesis will bond
    let initial_validator_bond: Balance = GENESIS_MIN_VALIDATOR_BOND
        .saturating_mul(4)
        .saturating_add(ExistentialDeposit::get());
    // How much each initial nominator at genesis will bond per nomination
    let initial_nominator_bond: Balance =
        GENESIS_MIN_NOMINATOR_BOND.saturating_add(ExistentialDeposit::get());

    let mut funded: Vec<AccountId> = genesis_balances
        .iter()
        .cloned()
        .map(|(account, _)| account)
        .collect();

    // For every account missing from genesis_balances add it and fund it
    if fund_accounts {
        // Genesis balance for each endowed account.
        let endowment: Balance = DOLLARS
            .saturating_mul(1_000_000)
            .max(initial_validator_bond)
            .max(if !initial_nominators.is_empty() {
                initial_nominator_bond.saturating_mul(initial_authorities.len() as u128)
            } else {
                0
            });

        initial_authorities.iter().for_each(|x| {
            // stash
            if !funded.contains(&x.0) {
                funded.push(x.0.clone());
                genesis_balances.push((x.0.clone(), endowment));
            }
            // controller
            if !funded.contains(&x.1) {
                funded.push(x.1.clone());
                genesis_balances.push((x.1.clone(), endowment));
            }
        });

        initial_nominators.iter().for_each(|account| {
            if !funded.contains(account) {
                funded.push(account.clone());
                genesis_balances.push((account.clone(), endowment));
            }
        });

        endowed_accounts.iter().for_each(|account| {
            if !funded.contains(account) {
                funded.push(account.clone());
                genesis_balances.push((account.clone(), endowment));
            }
        });
    }

    // stakers: all validators and nominators.
    let mut rng = rand::thread_rng();
    let stakers = initial_authorities
        .iter()
        .map(|x| {
            (
                x.0.clone(),
                x.1.clone(),
                initial_validator_bond,
                StakerStatus::Validator,
            )
        })
        .chain(initial_nominators.iter().map(|x| {
            use rand::{seq::SliceRandom, Rng};
            let limit = (MaxNominations::get() as usize).min(initial_authorities.len());
            let count = (rng.gen::<usize>() % limit).saturating_add(1); // at least one nomination
            let nominations = initial_authorities
                .as_slice()
                .choose_multiple(&mut rng, count)
                .into_iter()
                .map(|choice| choice.0.clone())
                .collect::<Vec<_>>();
            (
                x.clone(),
                x.clone(),
                initial_nominator_bond,
                StakerStatus::Nominator(nominations),
            )
        }))
        .collect::<Vec<_>>();

    GenesisConfig {
        system: SystemConfig {
            code: wasm_binary_unwrap().to_vec(),
        },
        balances: BalancesConfig {
            balances: genesis_balances,
        },
        session: SessionConfig {
            keys: initial_authorities
                .iter()
                .map(|x| {
                    (
                        x.0.clone(),
                        x.0.clone(),
                        session_keys(x.2.clone(), x.3.clone(), x.4.clone(), x.5.clone()),
                    )
                })
                .collect::<Vec<_>>(),
        },
        staking: StakingConfig {
            validator_count: initial_authorities.len() as u32,
            minimum_validator_count: initial_authorities.len().min(4) as u32,
            invulnerables: initial_authorities.iter().map(|x| x.0.clone()).collect(),
            slash_reward_fraction: Perbill::from_percent(10),
            force_era: Forcing::ForceNone,
            stakers,
            min_nominator_bond: GENESIS_MIN_NOMINATOR_BOND,
            min_validator_bond: GENESIS_MIN_VALIDATOR_BOND,
            max_validator_count: Some(400),
            max_nominator_count: Some(20_000),
            ..Default::default()
        },
        babe: BabeConfig {
            authorities: vec![],
            epoch_config: Some(node_runtime::BABE_GENESIS_EPOCH_CONFIG),
        },
        im_online: ImOnlineConfig { keys: vec![] },
        authority_discovery: AuthorityDiscoveryConfig { keys: vec![] },
        grandpa: GrandpaConfig {
            authorities: vec![],
        },
        transaction_payment: TransactionPaymentConfig {
            multiplier: FixedU128::from(1),
        },
        vesting: VestingConfig {
            vesting: vesting_accounts,
        },
        council: council_config::create_council_config(),
        forum: forum_config::empty(),
        content: content_cfg,
        storage: storage_cfg,
        project_token: project_token_cfg,
        proposals_discussion: Default::default(),
        members: Default::default(),
    }
}

fn development_config_genesis() -> GenesisConfig {
    testnet_genesis(
        true,
        vec![authority_keys_from_seed("//Alice")],
        vec![
            get_account_id_from_seed::<sr25519::Public>("//Bob"),
            get_account_id_from_seed::<sr25519::Public>("//Charlie"),
        ],
        development_endowed_accounts(),
        vec![],
        vec![],
        content_config::testing_config(),
        storage_config::testing_config(),
        project_token_config::testing_config(),
    )
}

/// Development config (single validator Alice)
pub fn development_config() -> ChainSpec {
    ChainSpec::from_genesis(
        "Development",
        "dev",
        ChainType::Development,
        development_config_genesis,
        vec![],
        None,
        None,
        None,
        Some(joy_chain_spec_properties()),
        Default::default(),
    )
}

fn local_testnet_genesis() -> GenesisConfig {
    testnet_genesis(
        true,
        vec![
            authority_keys_from_seed("//Alice"),
            authority_keys_from_seed("//Bob"),
        ],
        vec![],
        development_endowed_accounts(),
        vec![],
        vec![],
        content_config::testing_config(),
        storage_config::testing_config(),
        project_token_config::testing_config(),
    )
}

/// Local testnet config (multivalidator Alice + Bob)
pub fn local_testnet_config() -> ChainSpec {
    ChainSpec::from_genesis(
        "Local Testnet",
        "local_testnet",
        ChainType::Local,
        local_testnet_genesis,
        vec![],
        None,
        None,
        None,
        Some(joy_chain_spec_properties()),
        Default::default(),
    )
}

fn prod_test_config_genesis() -> GenesisConfig {
    testnet_genesis(
        true,
        vec![authority_keys_from_seed("//Alice")],
        vec![],
        development_endowed_accounts(),
        vec![],
        vec![],
        content_config::production_config(),
        storage_config::production_config(),
        project_token_config::production_config(),
    )
}

/// Development chain, with production config
pub fn prod_test_config() -> ChainSpec {
    ChainSpec::from_genesis(
        "Development",
        "dev",
        ChainType::Development,
        prod_test_config_genesis,
        vec![],
        None,
        None,
        None,
        Some(joy_chain_spec_properties()),
        Default::default(),
    )
}

#[cfg(test)]
pub(crate) mod tests {
    use super::*;
    use crate::service::{new_full_base, NewFullBase};
    use sc_service_test;
    use sp_runtime::BuildStorage;

    fn local_testnet_genesis_instant_single() -> GenesisConfig {
        testnet_genesis(
            true,
            vec![authority_keys_from_seed("//Alice")],
            vec![],
            development_endowed_accounts(),
            vec![],
            vec![],
            content_config::testing_config(),
            storage_config::testing_config(),
            project_token_config::testing_config(),
        )
    }

    /// Local testnet config (single validator - Alice)
    pub fn integration_test_config_with_single_authority() -> ChainSpec {
        ChainSpec::from_genesis(
            "Integration Test",
            "test",
            ChainType::Development,
            local_testnet_genesis_instant_single,
            vec![],
            None,
            None,
            None,
            Some(joy_chain_spec_properties()),
            Default::default(),
        )
    }

    /// Local testnet config (multivalidator Alice + Bob)
    pub fn integration_test_config_with_two_authorities() -> ChainSpec {
        ChainSpec::from_genesis(
            "Integration Test",
            "test",
            ChainType::Development,
            local_testnet_genesis,
            vec![],
            None,
            None,
            None,
            Some(joy_chain_spec_properties()),
            Default::default(),
        )
    }

    #[test]
    #[ignore]
    fn test_connectivity() {
        sp_tracing::try_init_simple();

        sc_service_test::connectivity(integration_test_config_with_two_authorities(), |config| {
            let NewFullBase {
                task_manager,
                client,
                network,
                sync,
                transaction_pool,
                ..
            } = new_full_base(config, false, |_, _| ())?;
            Ok(sc_service_test::TestNetComponents::new(
                task_manager,
                client,
                network,
                sync,
                transaction_pool,
            ))
        });
    }

    #[test]
    fn test_create_development_chain_spec() {
        development_config().build_storage().unwrap();
    }

    #[test]
    fn test_create_local_testnet_chain_spec() {
        local_testnet_config().build_storage().unwrap();
    }

    #[test]
    fn test_create_prod_test_chain_spec() {
        prod_test_config().build_storage().unwrap();
    }
}
