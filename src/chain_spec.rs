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

use hex_literal::hex;
use node_runtime::{
    versioned_store::InputValidationLengthConstraint as VsInputValidation, AccountId, ActorsConfig,
    AuthorityDiscoveryConfig, BabeConfig, Balance, BalancesConfig, ContentWorkingGroupConfig,
    CouncilConfig, CouncilElectionConfig, DataObjectStorageRegistryConfig,
    DataObjectTypeRegistryConfig, GenesisConfig, GrandpaConfig, ImOnlineConfig, IndicesConfig,
    MembersConfig, Perbill, ProposalsConfig, SessionConfig, SessionKeys, Signature, StakerStatus,
    StakingConfig, SudoConfig, SystemConfig, VersionedStoreConfig, DAYS, WASM_BINARY,
};
use primitives::{crypto::UncheckedInto, sr25519, Pair, Public};
use runtime_primitives::traits::{IdentifyAccount, Verify};

use babe_primitives::AuthorityId as BabeId;
use grandpa_primitives::AuthorityId as GrandpaId;
use im_online::sr25519::AuthorityId as ImOnlineId;
use serde_json as json;
use substrate_service;
use substrate_telemetry::TelemetryEndpoints;

type AccountPublic = <Signature as Verify>::Signer;

// Note this is the URL for the telemetry server
const STAGING_TELEMETRY_URL: &str = "wss://telemetry.polkadot.io/submit/";

/// Specialized `ChainSpec`. This is a specialization of the general Substrate ChainSpec type.
pub type ChainSpec = substrate_service::ChainSpec<GenesisConfig>;

/// The chain specification option. This is expected to come in from the CLI and
/// is little more than one of a number of alternatives which can easily be converted
/// from a string (`--chain=...`) into a `ChainSpec`.
#[derive(Clone, Debug)]
pub enum Alternative {
    /// Whatever the current runtime is, with just Alice as an auth.
    Development,
    /// Whatever the current runtime is, with simple Alice/Bob auths.
    LocalTestnet,
    /// Staging testnet
    StagingTestnet,
    /// Testnet - the current live testnet
    LiveTestnet,
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
) -> (AccountId, AccountId, GrandpaId, BabeId, ImOnlineId) {
    (
        get_account_id_from_seed::<sr25519::Public>(&format!("{}//stash", seed)),
        get_account_id_from_seed::<sr25519::Public>(seed),
        get_from_seed::<GrandpaId>(seed),
        get_from_seed::<BabeId>(seed),
        get_from_seed::<ImOnlineId>(seed),
    )
}

fn session_keys(grandpa: GrandpaId, babe: BabeId, im_online: ImOnlineId) -> SessionKeys {
    SessionKeys {
        grandpa,
        babe,
        im_online,
    }
}

impl Alternative {
    /// Get an actual chain config from one of the alternatives.
    pub(crate) fn load(self) -> Result<ChainSpec, String> {
        Ok(match self {
            Alternative::Development => ChainSpec::from_genesis(
                "Development",
                "dev",
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
                    )
                },
                vec![],
                None,
                None,
                Some(chain_spec_properties()),
                None,
            ),
            Alternative::LocalTestnet => ChainSpec::from_genesis(
                "Local Testnet",
                "local_testnet",
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
                    )
                },
                vec![],
                None,
                None,
                Some(chain_spec_properties()),
                None,
            ),
            Alternative::StagingTestnet => staging_testnet_config(),
            Alternative::LiveTestnet => live_testnet_config()?,
        })
    }

    pub(crate) fn from(s: &str) -> Option<Self> {
        match s {
            "dev" => Some(Alternative::Development),
            "local" => Some(Alternative::LocalTestnet),
            "staging" => Some(Alternative::StagingTestnet),
            "" | "testnet" => Some(Alternative::LiveTestnet),
            _ => None,
        }
    }
}

fn new_vs_validation(min: u16, max_min_diff: u16) -> VsInputValidation {
    return VsInputValidation { min, max_min_diff };
}

/// Joystream LiveTestnet generator
pub fn live_testnet_config() -> Result<ChainSpec, String> {
    ChainSpec::from_json_bytes(&include_bytes!("../res/dummy.json")[..])
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

/// Staging testnet config
pub fn staging_testnet_config() -> ChainSpec {
    let boot_nodes = vec![
        String::from("/dns4/rome-reckless.joystream.org/tcp/30333/p2p/QmaTTdEF6YVCtynSjsXmGPSGcEesAahoZ8pmcCmmBwSE7S")
    ];

    ChainSpec::from_genesis(
        "Joystream Rome Reckless Testnet",
        "joy_rome_reckless_N",
        staging_testnet_config_genesis,
        boot_nodes,
        Some(TelemetryEndpoints::new(vec![(
            STAGING_TELEMETRY_URL.to_string(),
            0,
        )])),
        // protocol_id
        Some(&*"/joy/rome/reckless/N"),
        // Properties
        Some(chain_spec_properties()),
        // Extensions
        None,
    )
}

fn staging_testnet_config_genesis() -> GenesisConfig {
    let initial_authorities: Vec<(AccountId, AccountId, GrandpaId, BabeId, ImOnlineId)> = vec![(
        hex!["4430a31121fc174b1c361b365580c54ef393813171e59542f5d2ce3d8b171a2d"].into(), // stash
        hex!["58a743f1bab2f472fb99af98b6591e23a56fd84bc9c2a62037ed8867caae7c21"].into(), // controller
        hex!["af5286fb1e403afd44d92ae3fb0b371a0f4f8faf3e6b2ff50ea91fb426b0015f"].unchecked_into(), // session - grandpa
        hex!["d69529ed1549644977cec8dc027e71e1e2ae7aab99833a7f7dc08677a8d36307"].unchecked_into(), // session - babe
        hex!["56bfd27715ce6c76e4d884c31374b9928391e461727ffaf27b94b6ce48570d39"].unchecked_into(), // session - im-online
    )];
    let endowed_accounts =
        vec![hex!["00680fb81473784017291ef0afd968b986966daa7842d5b5063c8427c2b62577"].into()];

    const CENTS: Balance = 1;
    const DOLLARS: Balance = 100 * CENTS;
    const STASH: Balance = 20 * DOLLARS;
    const ENDOWMENT: Balance = 100_000 * DOLLARS;

    GenesisConfig {
        system: Some(SystemConfig {
            code: WASM_BINARY.to_vec(),
            changes_trie_config: Default::default(),
        }),
        balances: Some(BalancesConfig {
            balances: endowed_accounts
                .iter()
                .cloned()
                .map(|k| (k, ENDOWMENT))
                .chain(initial_authorities.iter().map(|x| (x.0.clone(), STASH)))
                .collect(),
            vesting: vec![],
        }),
        indices: Some(IndicesConfig { ids: vec![] }),
        session: Some(SessionConfig {
            keys: initial_authorities
                .iter()
                .map(|x| {
                    (
                        x.0.clone(),
                        session_keys(x.2.clone(), x.3.clone(), x.4.clone()),
                    )
                })
                .collect::<Vec<_>>(),
        }),
        staking: Some(StakingConfig {
            current_era: 0,
            validator_count: 20,
            minimum_validator_count: 1,
            stakers: initial_authorities
                .iter()
                .map(|x| (x.0.clone(), x.1.clone(), STASH, StakerStatus::Validator))
                .collect(),
            invulnerables: initial_authorities.iter().map(|x| x.0.clone()).collect(),
            slash_reward_fraction: Perbill::from_percent(10),
            ..Default::default()
        }),
        sudo: Some(SudoConfig {
            key: endowed_accounts[0].clone(),
        }),
        babe: Some(BabeConfig {
            authorities: vec![],
        }),
        im_online: Some(ImOnlineConfig { keys: vec![] }),
        authority_discovery: Some(AuthorityDiscoveryConfig { keys: vec![] }),
        grandpa: Some(GrandpaConfig {
            authorities: vec![],
        }),
        council: Some(CouncilConfig {
            active_council: vec![],
            term_ends_at: 1,
        }),
        election: Some(CouncilElectionConfig {
            auto_start: true,
            announcing_period: 3 * DAYS,
            voting_period: 1 * DAYS,
            revealing_period: 1 * DAYS,
            council_size: 12,
            candidacy_limit: 25,
            min_council_stake: 10 * DOLLARS,
            new_term_duration: 14 * DAYS,
            min_voting_stake: 1 * DOLLARS,
        }),
        proposals: Some(ProposalsConfig {
            approval_quorum: 66,
            min_stake: 2 * DOLLARS,
            cancellation_fee: 10 * CENTS,
            rejection_fee: 1 * DOLLARS,
            voting_period: 2 * DAYS,
            name_max_len: 512,
            description_max_len: 10_000,
            wasm_code_max_len: 2_000_000,
        }),
        members: Some(MembersConfig {
            default_paid_membership_fee: 100u128,
            members: crate::members_config::initial_members(),
        }),
        forum: Some(crate::forum_config::from_serialized::create(
            endowed_accounts[0].clone(),
        )),
        data_object_type_registry: Some(DataObjectTypeRegistryConfig {
            first_data_object_type_id: 1,
        }),
        data_object_storage_registry: Some(DataObjectStorageRegistryConfig {
            first_relationship_id: 1,
        }),
        actors: Some(ActorsConfig {
            enable_storage_role: true,
            request_life_time: 300,
        }),
        versioned_store: Some(VersionedStoreConfig {
            class_by_id: vec![],
            entity_by_id: vec![],
            next_class_id: 1,
            next_entity_id: 1,
            property_name_constraint: new_vs_validation(1, 99),
            property_description_constraint: new_vs_validation(1, 999),
            class_name_constraint: new_vs_validation(1, 99),
            class_description_constraint: new_vs_validation(1, 999),
        }),
        content_wg: Some(ContentWorkingGroupConfig {
            mint_capacity: 100000,
            curator_opening_by_id: vec![],
            next_curator_opening_id: 0,
            curator_application_by_id: vec![],
            next_curator_application_id: 0,
            channel_by_id: vec![],
            next_channel_id: 1,
            channel_id_by_handle: vec![],
            curator_by_id: vec![],
            next_curator_id: 0,
            principal_by_id: vec![],
            next_principal_id: 0,
            channel_creation_enabled: true, // there is no extrinsic to change it so enabling at genesis
            unstaker_by_stake_id: vec![],
            channel_handle_constraint: crate::forum_config::new_validation(5, 20),
            channel_description_constraint: crate::forum_config::new_validation(1, 1024),
            opening_human_readable_text: crate::forum_config::new_validation(1, 2048),
            curator_application_human_readable_text: crate::forum_config::new_validation(1, 2048),
            curator_exit_rationale_text: crate::forum_config::new_validation(1, 2048),
            channel_avatar_constraint: crate::forum_config::new_validation(5, 1024),
            channel_banner_constraint: crate::forum_config::new_validation(5, 1024),
            channel_title_constraint: crate::forum_config::new_validation(5, 1024),
        }),
    }
}

/// Helper function to create GenesisConfig for testing
pub fn testnet_genesis(
    initial_authorities: Vec<(AccountId, AccountId, GrandpaId, BabeId, ImOnlineId)>,
    root_key: AccountId,
    endowed_accounts: Vec<AccountId>,
) -> GenesisConfig {
    const STASH: Balance = 2000;
    const ENDOWMENT: Balance = 10_000_000;

    // Static members
    let initial_members = crate::members_config::initial_members();

    // let mut additional_members = vec![
    //     // Make Root a member
    //     (
    //         root_key.clone(),
    //         String::from("system"),
    //         String::from("http://joystream.org/avatar.png"),
    //         String::from("I am root!"),
    //     ),
    // ];

    // // Additional members
    // initial_members.append(&mut additional_members);

    GenesisConfig {
        //substrate modules
        system: Some(SystemConfig {
            code: WASM_BINARY.to_vec(),
            changes_trie_config: Default::default(),
        }),
        balances: Some(BalancesConfig {
            balances: endowed_accounts
                .iter()
                .map(|k| (k.clone(), ENDOWMENT))
                .collect(),
            vesting: vec![],
        }),
        indices: Some(IndicesConfig { ids: vec![] }),
        staking: Some(StakingConfig {
            current_era: 0,
            minimum_validator_count: 1,
            validator_count: 2,
            stakers: initial_authorities
                .iter()
                .map(|x| (x.0.clone(), x.1.clone(), STASH, StakerStatus::Validator))
                .collect(),
            invulnerables: initial_authorities.iter().map(|x| x.0.clone()).collect(),
            slash_reward_fraction: Perbill::from_percent(10),
            ..Default::default()
        }),
        session: Some(SessionConfig {
            keys: initial_authorities
                .iter()
                .map(|x| {
                    (
                        x.0.clone(),
                        session_keys(x.2.clone(), x.3.clone(), x.4.clone()),
                    )
                })
                .collect::<Vec<_>>(),
        }),
        sudo: Some(SudoConfig {
            key: root_key.clone(),
        }),
        babe: Some(BabeConfig {
            authorities: vec![],
        }),
        im_online: Some(ImOnlineConfig { keys: vec![] }),
        authority_discovery: Some(AuthorityDiscoveryConfig { keys: vec![] }),
        grandpa: Some(GrandpaConfig {
            authorities: vec![],
        }),
        // joystream modules
        council: Some(CouncilConfig {
            active_council: vec![],
            term_ends_at: 1,
        }),
        election: Some(CouncilElectionConfig {
            auto_start: true,
            announcing_period: 50,
            voting_period: 50,
            revealing_period: 50,
            council_size: 2,
            candidacy_limit: 25,
            min_council_stake: 100,
            new_term_duration: 1000,
            min_voting_stake: 10,
        }),
        proposals: Some(ProposalsConfig {
            approval_quorum: 66,
            min_stake: 100,
            cancellation_fee: 5,
            rejection_fee: 10,
            voting_period: 100,
            name_max_len: 100,
            description_max_len: 10_000,
            wasm_code_max_len: 2_000_000,
        }),
        members: Some(MembersConfig {
            default_paid_membership_fee: 100u128,
            members: initial_members,
        }),
        forum: Some(crate::forum_config::from_serialized::create(
            root_key.clone(),
        )),
        data_object_type_registry: Some(DataObjectTypeRegistryConfig {
            first_data_object_type_id: 1,
        }),
        data_object_storage_registry: Some(DataObjectStorageRegistryConfig {
            first_relationship_id: 1,
        }),
        actors: Some(ActorsConfig {
            enable_storage_role: true,
            request_life_time: 300,
        }),
        versioned_store: Some(VersionedStoreConfig {
            class_by_id: vec![],
            entity_by_id: vec![],
            next_class_id: 1,
            next_entity_id: 1,
            property_name_constraint: new_vs_validation(1, 99),
            property_description_constraint: new_vs_validation(1, 999),
            class_name_constraint: new_vs_validation(1, 99),
            class_description_constraint: new_vs_validation(1, 999),
        }),
        content_wg: Some(ContentWorkingGroupConfig {
            mint_capacity: 100000,
            curator_opening_by_id: vec![],
            next_curator_opening_id: 0,
            curator_application_by_id: vec![],
            next_curator_application_id: 0,
            channel_by_id: vec![],
            next_channel_id: 1,
            channel_id_by_handle: vec![],
            curator_by_id: vec![],
            next_curator_id: 0,
            principal_by_id: vec![],
            next_principal_id: 0,
            channel_creation_enabled: true, // there is no extrinsic to change it so enabling at genesis
            unstaker_by_stake_id: vec![],
            channel_handle_constraint: crate::forum_config::new_validation(5, 20),
            channel_description_constraint: crate::forum_config::new_validation(1, 1024),
            opening_human_readable_text: crate::forum_config::new_validation(1, 2048),
            curator_application_human_readable_text: crate::forum_config::new_validation(1, 2048),
            curator_exit_rationale_text: crate::forum_config::new_validation(1, 2048),
            channel_avatar_constraint: crate::forum_config::new_validation(5, 1024),
            channel_banner_constraint: crate::forum_config::new_validation(5, 1024),
            channel_title_constraint: crate::forum_config::new_validation(5, 1024),
        }),
    }
}
