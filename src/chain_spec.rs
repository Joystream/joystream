use hex_literal::{hex, hex_impl};
use joystream_node_runtime::{
    AccountId, BalancesConfig, ConsensusConfig, CouncilConfig,
    CouncilElectionConfig, DataObjectStorageRegistryConfig, DataObjectTypeRegistryConfig,
    DownloadSessionsConfig, GenesisConfig, GrandpaConfig, IndicesConfig, MembersConfig, 
	ForumConfig, forum::InputValidationLengthConstraint, Perbill,
    ProposalsConfig, SessionConfig, StakerStatus, StakingConfig, SudoConfig, TimestampConfig,
	ActorsConfig,
};
use primitives::{crypto::UncheckedInto, ed25519, sr25519, Pair};
use substrate_service;
use substrate_telemetry::TelemetryEndpoints;

use ed25519::Public as AuthorityId;

// Note this is the URL for the telemetry server
const STAGING_TELEMETRY_URL: &str = "wss://telemetry.polkadot.io/submit/";

/// Specialised `ChainSpec`. This is a specialisation of the general Substrate ChainSpec type.
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

fn authority_key(s: &str) -> AuthorityId {
    ed25519::Pair::from_string(&format!("//{}", s), None)
        .expect("static values are valid; qed")
        .public()
}

fn account_key(s: &str) -> AccountId {
	sr25519::Pair::from_string(&format!("//{}", s), None)
		.expect("static values are valid; qed")
		.public()
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
                        vec![
                            // stash, controller, authority
                            (
                                account_key("Alice//stash"),
                                account_key("Alice"),
                                authority_key("Alice"),
                            ),
                        ],
                        vec![
                            // endowed account
                            account_key("Alice"),
                        ],
                        // sudo key
                        account_key("Alice"),
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
                            (
                                account_key("Alice//stash"),
                                account_key("Alice"),
                                authority_key("Alice"),
                            ),
                            (
                                account_key("Bob//stash"),
                                account_key("Bob"),
                                authority_key("Bob"),
                            ),
                        ],
                        vec![
                            account_key("Alice"),
                            account_key("Bob"),
                            account_key("Charlie"),
                            account_key("Dave"),
                            account_key("Eve"),
                            account_key("Ferdie"),
                        ],
                        account_key("Alice"),
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

/// LiveTestnet generator
pub fn live_testnet_config() -> Result<ChainSpec, String> {
    ChainSpec::from_embedded(include_bytes!("../res/joy_testnet_2.json"))
}

/// Staging testnet config
pub fn staging_testnet_config() -> ChainSpec {
    let boot_nodes = vec![
		String::from("/dns4/bootnode1.joystream.org/tcp/30333/p2p/QmeDa8jASqMRpTh4YCkeVEuHo6nbMcFDzD9pkUxTr3WxhM"),
		String::from("/dns4/bootnode2.joystream.org/tcp/30333/p2p/QmbjzmNMjzQUMHpzqcPHW5DnFeUjM3x4hbiDSMkYv1McD3"),
	];
    ChainSpec::from_genesis(
        "Joystream Staging Testnet",
        "joy_staging_5",
        staging_testnet_config_genesis,
        boot_nodes,
        Some(TelemetryEndpoints::new(vec![(
            STAGING_TELEMETRY_URL.to_string(),
            0,
        )])),
        None,
        None,
        None,
    )
}

fn new_validation(min: u16, max_min_diff: u16) -> InputValidationLengthConstraint {
	return InputValidationLengthConstraint {
		min,
		max_min_diff
	}
}

fn staging_testnet_config_genesis() -> GenesisConfig {
    let initial_authorities: Vec<(AccountId, AccountId, AuthorityId)> = vec![(
        hex!["0610d1a2b1d704723e588c842a934737491688b18b052baae1286f12e96adb65"].unchecked_into(), // stash
        hex!["609cee3edd9900e69be44bcbf7a1892cad10408840a2d72d563811d72d9bb339"].unchecked_into(), // controller
        hex!["65179fd9c39ec301457d1ee47a13f3bb0fef65812a57b6c93212e609b10d35d2"].unchecked_into(), // session key
    )];
    let endowed_accounts = vec![hex![
        "0ae55282e669fc55cb9529c0b12b989f2c5bf636d0de7630b5a4850055ed9c30"
    ]
    .unchecked_into()];

    const CENTS: u128 = 1;
    const DOLLARS: u128 = 100 * CENTS;

    const SECS_PER_BLOCK: u64 = 6;
    const MINUTES: u64 = 60 / SECS_PER_BLOCK;
    const HOURS: u64 = MINUTES * 60;
    const DAYS: u64 = HOURS * 24;
    const STASH: u128 = 50 * DOLLARS;
    const ENDOWMENT: u128 = 100_000_000 * DOLLARS;

    GenesisConfig {
		consensus: Some(ConsensusConfig {
			code: include_bytes!("../substrate-runtime-joystream/wasm/target/wasm32-unknown-unknown/release/joystream_node_runtime_wasm.compact.wasm").to_vec(),
			authorities: initial_authorities.iter().map(|x| x.2.clone()).collect(),
		}),
		system: None,
		timestamp: Some(TimestampConfig {
			minimum_period: SECS_PER_BLOCK / 2, // due to the nature of aura the slots are 2*period
		}),
		indices: Some(IndicesConfig {
			ids: vec![],
		}),
		balances: Some(BalancesConfig {
			balances: endowed_accounts.iter().cloned()
				.map(|k| (k, ENDOWMENT))
				.chain(initial_authorities.iter().map(|x| (x.0.clone(), STASH)))
				.collect(),
			existential_deposit: 0,
			transfer_fee: 0,
			creation_fee: 0,
			vesting: vec![],
			transaction_base_fee: 1,
			transaction_byte_fee: 0,
		}),
		sudo: Some(SudoConfig {
			key: endowed_accounts[0].clone(),
		}),
		session: Some(SessionConfig {
			validators: initial_authorities.iter().map(|x| x.1.clone()).collect(),
			session_length: 10 * MINUTES,
			keys: initial_authorities.iter().map(|x| (x.1.clone(), x.2.clone())).collect::<Vec<_>>(),
		}),
		staking: Some(StakingConfig {
			current_era: 0,
			offline_slash: Perbill::from_millionths(10_000),  // 1/ 100 => 1%
			session_reward: Perbill::from_millionths(1_000),  // 1/1000 => 0.1% (min stake -> 1000 units for reward to be GT 0)
			current_session_reward: 0,
			validator_count: 20,
			sessions_per_era: 6,
			bonding_duration: 1, // Number of ERAs
			offline_slash_grace: 4,
			minimum_validator_count: 1,
			stakers: initial_authorities.iter().map(|x| (x.0.clone(), x.1.clone(), STASH, StakerStatus::Validator)).collect(),
			invulnerables: initial_authorities.iter().map(|x| x.1.clone()).collect(),
		}),
		grandpa: Some(GrandpaConfig {
			authorities: initial_authorities.iter().map(|x| (x.2.clone(), 1)).collect(),
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
			first_member_id: 1,
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
			post_moderation_rationale_constraint: new_validation(10, 290)
		}),
		data_object_type_registry: Some(DataObjectTypeRegistryConfig {
			first_data_object_type_id: 1,
		}),
		data_object_storage_registry: Some(DataObjectStorageRegistryConfig{
			first_relationship_id: 1,
		}),
		downloads: Some(DownloadSessionsConfig{
			first_download_session_id: 1,
		}),
		actors: Some(ActorsConfig{
			enable_storage_role: true,
			request_life_time: 300,
			_genesis_phantom_data: Default::default(),
		})
	}
}

fn testnet_genesis(
    initial_authorities: Vec<(AccountId, AccountId, AuthorityId)>,
    endowed_accounts: Vec<AccountId>,
    root_key: AccountId,
) -> GenesisConfig {
    const STASH: u128 = 100;
    const ENDOWMENT: u128 = 100_000_000;

    GenesisConfig {
		consensus: Some(ConsensusConfig {
			code: include_bytes!("../substrate-runtime-joystream/wasm/target/wasm32-unknown-unknown/release/joystream_node_runtime_wasm.compact.wasm").to_vec(),
			authorities: initial_authorities.iter().map(|x| x.2.clone()).collect(),
		}),
		system: None,
		timestamp: Some(TimestampConfig {
			minimum_period: 3,                    // 3*2=6 second block time.
		}),
		indices: Some(IndicesConfig {
			ids: vec![]
		}),
		balances: Some(BalancesConfig {
			existential_deposit: 0,
			transfer_fee: 0,
			creation_fee: 0,
			balances: endowed_accounts.iter().cloned()
				.map(|k| (k, ENDOWMENT))
				.chain(initial_authorities.iter().map(|x| (x.0.clone(), STASH)))
				.collect(),
			vesting: vec![],
			transaction_base_fee: 1,
			transaction_byte_fee: 0,
		}),
		sudo: Some(SudoConfig {
			key: root_key.clone(),
		}),
		session: Some(SessionConfig {
			validators: initial_authorities.iter().map(|x| x.1.clone()).collect(),
			session_length: 10,
			keys: initial_authorities.iter().map(|x| (x.1.clone(), x.2.clone())).collect::<Vec<_>>(),
		}),
		staking: Some(StakingConfig {
			current_era: 0,
			minimum_validator_count: 1,
			validator_count: 2,
			sessions_per_era: 5,
			bonding_duration: 1, // Number of Eras
			offline_slash: Perbill::zero(),
			session_reward: Perbill::zero(),
			current_session_reward: 0,
			offline_slash_grace: 0,
			stakers: initial_authorities.iter().map(|x| (x.0.clone(), x.1.clone(), STASH, StakerStatus::Validator)).collect(),
			invulnerables: initial_authorities.iter().map(|x| x.1.clone()).collect(),
		}),
		grandpa: Some(GrandpaConfig {
			authorities: initial_authorities.iter().map(|x| (x.2.clone(), 1)).collect(),
		}),
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
			first_member_id: 1,
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
			post_moderation_rationale_constraint: new_validation(10, 290)
		}),
		data_object_type_registry: Some(DataObjectTypeRegistryConfig {
			first_data_object_type_id: 1,
		}),
		data_object_storage_registry: Some(DataObjectStorageRegistryConfig{
			first_relationship_id: 1,
		}),
		downloads: Some(DownloadSessionsConfig{
			first_download_session_id: 1,
		}),
		actors: Some(ActorsConfig{
			enable_storage_role: true,
			request_life_time: 300,
			_genesis_phantom_data: Default::default(),
		})
	}
}
