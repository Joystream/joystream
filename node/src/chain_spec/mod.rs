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
// Remove after the Antioch release.
#![allow(clippy::unnecessary_wraps)]

use pallet_im_online::sr25519::AuthorityId as ImOnlineId;
use serde_json as json;
use sp_authority_discovery::AuthorityId as AuthorityDiscoveryId;
use sp_consensus_babe::AuthorityId as BabeId;
use sp_core::{sr25519, Pair, Public};
use sp_finality_grandpa::AuthorityId as GrandpaId;
use sp_runtime::traits::{IdentifyAccount, Verify};
use sp_runtime::Perbill;

use node_runtime::{
    membership, wasm_binary_unwrap, AuthorityDiscoveryConfig, BabeConfig, Balance, BalancesConfig,
    ContentConfig, ForumConfig, GrandpaConfig, ImOnlineConfig, MembersConfig, SessionConfig,
    SessionKeys, Signature, StakerStatus, StakingConfig, SudoConfig, SystemConfig,
};

// Exported to be used by chain-spec-builder
pub use node_runtime::{AccountId, GenesisConfig};

pub mod council_config;
pub mod forum_config;
pub mod initial_balances;
pub mod initial_members;

type AccountPublic = <Signature as Verify>::Signer;

/// Specialized `ChainSpec`. This is a specialization of the general Substrate ChainSpec type.
pub type ChainSpec = sc_service::GenericChainSpec<GenesisConfig>;

use sc_chain_spec::ChainType;

/// The chain specification option. This is expected to come in from the CLI and
/// is little more than one of a number of alternatives which can easily be converted
/// from a string (`--chain=...`) into a `ChainSpec`.
#[derive(Clone, Debug)]
pub enum Alternative {
    /// Whatever the current runtime is, with just Alice as an auth.
    Development,
    /// Whatever the current runtime is, with simple Alice/Bob auths.
    LocalTestnet,
}

/// Helper function to generate a crypto pair from seed
pub fn get_from_seed<TPublic: Public>(seed: &str) -> <TPublic::Pair as Pair>::Public {
    TPublic::Pair::from_string(&format!("//{}", seed), None)
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
pub fn get_authority_keys_from_seed(
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

fn session_keys(
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

impl Alternative {
    /// Get an actual chain config from one of the alternatives.
    pub(crate) fn load(self) -> Result<ChainSpec, String> {
        Ok(match self {
            Alternative::Development => ChainSpec::from_genesis(
                "Development",
                "dev",
                ChainType::Development,
                || {
                    testnet_genesis(
                        vec![get_authority_keys_from_seed("Alice")],
                        get_account_id_from_seed::<sr25519::Public>("Alice"),
                        vec![
                            get_account_id_from_seed::<sr25519::Public>("Alice"),
                            get_account_id_from_seed::<sr25519::Public>("Bob"),
                            get_account_id_from_seed::<sr25519::Public>("Alice//stash"),
                            get_account_id_from_seed::<sr25519::Public>("Bob//stash"),
                        ],
                        initial_members::none(),
                        forum_config::empty(get_account_id_from_seed::<sr25519::Public>("Alice")),
                        vec![],
                    )
                },
                Vec::new(),
                None,
                None,
                Some(chain_spec_properties()),
                None,
            ),
            Alternative::LocalTestnet => ChainSpec::from_genesis(
                "Local Testnet",
                "local_testnet",
                ChainType::Local,
                || {
                    testnet_genesis(
                        vec![
                            get_authority_keys_from_seed("Alice"),
                            get_authority_keys_from_seed("Bob"),
                        ],
                        get_account_id_from_seed::<sr25519::Public>("Alice"),
                        vec![
                            get_account_id_from_seed::<sr25519::Public>("Alice"),
                            get_account_id_from_seed::<sr25519::Public>("Bob"),
                            get_account_id_from_seed::<sr25519::Public>("Charlie"),
                            get_account_id_from_seed::<sr25519::Public>("Dave"),
                            get_account_id_from_seed::<sr25519::Public>("Eve"),
                            get_account_id_from_seed::<sr25519::Public>("Ferdie"),
                            get_account_id_from_seed::<sr25519::Public>("Alice//stash"),
                            get_account_id_from_seed::<sr25519::Public>("Bob//stash"),
                            get_account_id_from_seed::<sr25519::Public>("Charlie//stash"),
                            get_account_id_from_seed::<sr25519::Public>("Dave//stash"),
                            get_account_id_from_seed::<sr25519::Public>("Eve//stash"),
                            get_account_id_from_seed::<sr25519::Public>("Ferdie//stash"),
                        ],
                        initial_members::none(),
                        forum_config::empty(get_account_id_from_seed::<sr25519::Public>("Alice")),
                        vec![],
                    )
                },
                Vec::new(),
                None,
                None,
                Some(chain_spec_properties()),
                None,
            ),
        })
    }
}

pub fn chain_spec_properties() -> json::map::Map<String, json::Value> {
    let mut properties: json::map::Map<String, json::Value> = json::map::Map::new();
    properties.insert(
        String::from("tokenDecimals"),
        json::Value::Number(json::Number::from(0)),
    );
    properties.insert(
        String::from("tokenSymbol"),
        json::Value::String(String::from("JOY")),
    );
    properties
}
// This method should be refactored after Alexandria to reduce number of arguments
// as more args will likely be needed
#[allow(clippy::too_many_arguments)]
pub fn testnet_genesis(
    initial_authorities: Vec<(
        AccountId,
        AccountId,
        GrandpaId,
        BabeId,
        ImOnlineId,
        AuthorityDiscoveryId,
    )>,
    root_key: AccountId,
    endowed_accounts: Vec<AccountId>,
    members: Vec<membership::genesis::Member<u64, AccountId>>,
    forum_config: ForumConfig,
    initial_balances: Vec<(AccountId, Balance)>,
) -> GenesisConfig {
    const STASH: Balance = 5_000;
    const ENDOWMENT: Balance = 100_000_000;

    GenesisConfig {
        frame_system: Some(SystemConfig {
            code: wasm_binary_unwrap().to_vec(),
            changes_trie_config: Default::default(),
        }),
        pallet_balances: Some(BalancesConfig {
            balances: endowed_accounts
                .iter()
                .cloned()
                .map(|k| (k, ENDOWMENT))
                .chain(initial_authorities.iter().map(|x| (x.0.clone(), STASH)))
                .chain(
                    initial_balances
                        .iter()
                        .map(|(account, balance)| (account.clone(), *balance)),
                )
                .collect(),
        }),
        pallet_staking: Some(StakingConfig {
            validator_count: 100,
            minimum_validator_count: initial_authorities.len() as u32,
            stakers: initial_authorities
                .iter()
                .map(|x| (x.0.clone(), x.1.clone(), STASH, StakerStatus::Validator))
                .collect(),
            invulnerables: initial_authorities.iter().map(|x| x.0.clone()).collect(),
            slash_reward_fraction: Perbill::from_percent(10),
            history_depth: 336,
            ..Default::default()
        }),
        pallet_vesting: Some(Default::default()),
        pallet_sudo: Some(SudoConfig { key: root_key }),
        pallet_babe: Some(BabeConfig {
            authorities: vec![],
        }),
        pallet_im_online: Some(ImOnlineConfig { keys: vec![] }),
        pallet_authority_discovery: Some(AuthorityDiscoveryConfig { keys: vec![] }),
        pallet_grandpa: Some(GrandpaConfig {
            authorities: vec![],
        }),
        pallet_session: Some(SessionConfig {
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
        }),
        referendum_Instance1: Some(council_config::create_referendum_config()),
        council: Some(council_config::create_council_config()),
        membership: Some(MembersConfig { members }),
        forum: Some(forum_config),
        content: Some({
            ContentConfig {
                next_curator_group_id: 1,
                next_channel_category_id: 1,
                next_channel_id: 1,
                next_video_category_id: 1,
                next_video_id: 1,
                next_playlist_id: 1,
                next_series_id: 1,
                next_person_id: 1,
                next_video_post_id: 1,
                next_channel_transfer_request_id: 1,
                video_migration: node_runtime::content::MigrationConfigRecord {
                    current_id: 1,
                    final_id: 1,
                },
                channel_migration: node_runtime::content::MigrationConfigRecord {
                    current_id: 1,
                    final_id: 1,
                },
                max_reward_allowed: 1000,
                min_cashout_allowed: 1,
                min_auction_duration: 3,
                max_auction_duration: 20,
                min_auction_extension_period: 5,
                max_auction_extension_period: 30,
                min_bid_lock_duration: 2,
                max_bid_lock_duration: 10,
                min_starting_price: 10,
                max_starting_price: 1000,
                min_creator_royalty: Perbill::from_percent(1),
                max_creator_royalty: Perbill::from_percent(5),
                min_bid_step: 10,
                max_bid_step: 100,
                platform_fee_percentage: Perbill::from_percent(1),
                auction_starts_at_max_delta: 90_000,
                max_auction_whitelist_length: 100,
            }
        }),
    }
}

#[cfg(test)]
pub(crate) mod tests {
    use super::*;
    use crate::service::{new_full_base, new_light_base, NewFullBase};
    use sc_service_test;

    fn local_testnet_genesis_instant_single() -> GenesisConfig {
        testnet_genesis(
            vec![get_authority_keys_from_seed("Alice")],
            get_account_id_from_seed::<sr25519::Public>("Alice"),
            vec![
                get_authority_keys_from_seed("Alice").0,
                get_authority_keys_from_seed("Bob").0,
                get_authority_keys_from_seed("Charlie").0,
                get_authority_keys_from_seed("Alice").1,
                get_authority_keys_from_seed("Bob").1,
                get_authority_keys_from_seed("Charlie").1,
            ],
            initial_members::none(),
            forum_config::empty(get_account_id_from_seed::<sr25519::Public>("Alice")),
            vec![],
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
            Default::default(),
        )
    }

    fn local_testnet_genesis() -> GenesisConfig {
        testnet_genesis(
            vec![
                get_authority_keys_from_seed("Alice"),
                get_authority_keys_from_seed("Bob"),
            ],
            get_account_id_from_seed::<sr25519::Public>("Alice"),
            vec![
                get_authority_keys_from_seed("Alice").0,
                get_authority_keys_from_seed("Bob").0,
            ],
            initial_members::none(),
            forum_config::empty(get_account_id_from_seed::<sr25519::Public>("Alice")),
            vec![],
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
            Default::default(),
        )
    }

    #[test]
    #[ignore]
    fn test_connectivity() {
        sc_service_test::connectivity(
            integration_test_config_with_two_authorities(),
            |config| {
                let NewFullBase {
                    task_manager,
                    client,
                    network,
                    transaction_pool,
                    ..
                } = new_full_base(config, |_, _| ())?;
                Ok(sc_service_test::TestNetComponents::new(
                    task_manager,
                    client,
                    network,
                    transaction_pool,
                ))
            },
            |config| {
                let (keep_alive, _, client, network, transaction_pool) = new_light_base(config)?;
                Ok(sc_service_test::TestNetComponents::new(
                    keep_alive,
                    client,
                    network,
                    transaction_pool,
                ))
            },
        );
    }
}
