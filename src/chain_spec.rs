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
    forum::InputValidationLengthConstraint, AccountId, ActorsConfig, AuthorityDiscoveryConfig,
    BabeConfig, Balance, BalancesConfig, CouncilConfig, CouncilElectionConfig,
    DataObjectStorageRegistryConfig, DataObjectTypeRegistryConfig, ForumConfig, GenesisConfig,
    GrandpaConfig, ImOnlineConfig, IndicesConfig, MembersConfig, Perbill, ProposalsConfig,
    SessionConfig, SessionKeys, StakerStatus, StakingConfig, SudoConfig, SystemConfig, DAYS,
    WASM_BINARY,
};
use primitives::{crypto::UncheckedInto, Pair, Public};

use babe_primitives::AuthorityId as BabeId;
use grandpa_primitives::AuthorityId as GrandpaId;
use im_online::sr25519::AuthorityId as ImOnlineId;
use substrate_service;
use substrate_telemetry::TelemetryEndpoints;

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

/// Helper function to generate stash, controller and session key from seed
pub fn get_authority_keys_from_seed(
    seed: &str,
) -> (AccountId, AccountId, GrandpaId, BabeId, ImOnlineId) {
    (
        get_from_seed::<AccountId>(&format!("{}//stash", seed)),
        get_from_seed::<AccountId>(seed),
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
                        get_from_seed::<AccountId>("Alice"),
                        vec![
                            get_from_seed::<AccountId>("Alice"),
                            get_from_seed::<AccountId>("Bob"),
                            get_from_seed::<AccountId>("Alice//stash"),
                            get_from_seed::<AccountId>("Bob//stash"),
                        ],
                    )
                },
                vec![],
                None,
                None,
                None,
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
                        get_from_seed::<AccountId>("Alice"),
                        vec![
                            get_from_seed::<AccountId>("Alice"),
                            get_from_seed::<AccountId>("Bob"),
                            get_from_seed::<AccountId>("Charlie"),
                            get_from_seed::<AccountId>("Dave"),
                            get_from_seed::<AccountId>("Eve"),
                            get_from_seed::<AccountId>("Ferdie"),
                            get_from_seed::<AccountId>("Alice//stash"),
                            get_from_seed::<AccountId>("Bob//stash"),
                            get_from_seed::<AccountId>("Charlie//stash"),
                            get_from_seed::<AccountId>("Dave//stash"),
                            get_from_seed::<AccountId>("Eve//stash"),
                            get_from_seed::<AccountId>("Ferdie//stash"),
                        ],
                    )
                },
                vec![],
                None,
                None,
                None,
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

/// Joystream LiveTestnet generator
pub fn live_testnet_config() -> Result<ChainSpec, String> {
    ChainSpec::from_json_bytes(&include_bytes!("../res/dummy.json")[..])
}

/// Staging testnet config
pub fn staging_testnet_config() -> ChainSpec {
    let boot_nodes = vec![
		String::from("/dns4/bootnode1.joystream.org/tcp/30333/p2p/QmeDa8jASqMRpTh4YCkeVEuHo6nbMcFDzD9pkUxTr3WxhM"),
		String::from("/dns4/bootnode2.joystream.org/tcp/30333/p2p/QmbjzmNMjzQUMHpzqcPHW5DnFeUjM3x4hbiDSMkYv1McD3"),
	];
    ChainSpec::from_genesis(
        "Joystream Staging Testnet",
        "joy_staging_6",
        staging_testnet_config_genesis,
        boot_nodes,
        Some(TelemetryEndpoints::new(vec![(
            STAGING_TELEMETRY_URL.to_string(),
            0,
        )])),
        Some(&*"joy"), // protocol_id
        None,          // consensus engine
        None,          // properties
    )
}

fn new_validation(min: u16, max_min_diff: u16) -> InputValidationLengthConstraint {
    return InputValidationLengthConstraint { min, max_min_diff };
}

fn staging_testnet_config_genesis() -> GenesisConfig {
    let initial_authorities: Vec<(AccountId, AccountId, GrandpaId, BabeId, ImOnlineId)> = vec![(
        hex!["0610d1a2b1d704723e588c842a934737491688b18b052baae1286f12e96adb65"].unchecked_into(), // stash
        hex!["609cee3edd9900e69be44bcbf7a1892cad10408840a2d72d563811d72d9bb339"].unchecked_into(), // controller
        hex!["65179fd9c39ec301457d1ee47a13f3bb0fef65812a57b6c93212e609b10d35d2"].unchecked_into(), // session key
        hex!["8acbf7448d96592e61881c5ef0f0ab18da6955cf4824534eb19b26f03df56b5a"].unchecked_into(),
        hex!["8acbf7448d96592e61881c5ef0f0ab18da6955cf4824534eb19b26f03df56b5a"].unchecked_into(),
    )];
    let endowed_accounts = vec![hex![
        "0ae55282e669fc55cb9529c0b12b989f2c5bf636d0de7630b5a4850055ed9c30"
    ]
    .unchecked_into()];

    const CENTS: Balance = 1;
    const DOLLARS: Balance = 100 * CENTS;
    const STASH: Balance = 50 * DOLLARS;
    const ENDOWMENT: Balance = 100_000_000 * DOLLARS;

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
            members: vec![],
        }),
        forum: Some(ForumConfig {
            category_by_id: vec![],
            thread_by_id: vec![],
            post_by_id: vec![],
            next_category_id: 1,
            next_thread_id: 1,
            next_post_id: 1,
            forum_sudo: endowed_accounts[0].clone(),
            category_title_constraint: new_validation(10, 90),
            category_description_constraint: new_validation(10, 490),
            thread_title_constraint: new_validation(10, 90),
            post_text_constraint: new_validation(10, 990),
            thread_moderation_rationale_constraint: new_validation(10, 290),
            post_moderation_rationale_constraint: new_validation(10, 290),
        }),
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
    }
}

/// Helper function to create GenesisConfig for testing
pub fn testnet_genesis(
    initial_authorities: Vec<(AccountId, AccountId, GrandpaId, BabeId, ImOnlineId)>,
    root_key: AccountId,
    endowed_accounts: Vec<AccountId>,
) -> GenesisConfig {
    const STASH: Balance = 10000;
    const ENDOWMENT: Balance = 100_000_000;

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
            members: vec![],
        }),
        forum: Some(ForumConfig {
            category_by_id: vec![],
            thread_by_id: vec![],
            post_by_id: vec![],
            next_category_id: 1,
            next_thread_id: 1,
            next_post_id: 1,
            forum_sudo: root_key,
            category_title_constraint: new_validation(10, 90),
            category_description_constraint: new_validation(10, 490),
            thread_title_constraint: new_validation(10, 90),
            post_text_constraint: new_validation(10, 990),
            thread_moderation_rationale_constraint: new_validation(10, 290),
            post_moderation_rationale_constraint: new_validation(10, 290),
        }),
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
    }
}
