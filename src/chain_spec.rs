use primitives::{Ed25519AuthorityId, ed25519};
use joystream_node_runtime::{
	AccountId, GenesisConfig, ConsensusConfig, TimestampConfig, BalancesConfig,
	SudoConfig, IndicesConfig, SessionConfig, StakingConfig, Permill, Perbill,
	CouncilConfig, CouncilElectionConfig, ProposalsConfig, FeesConfig,
};
use substrate_service;
use hex_literal::{hex, hex_impl};

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

impl Alternative {
	/// Get an actual chain config from one of the alternatives.
	pub(crate) fn load(self) -> Result<ChainSpec, String> {
		Ok(match self {
			Alternative::Development => ChainSpec::from_genesis(
				"Development",
				"dev",
				|| testnet_genesis(vec![
					ed25519::Pair::from_seed(b"Alice                           ").public().into(),
				], vec![
					ed25519::Pair::from_seed(b"Alice                           ").public().0.into(),
				],
					ed25519::Pair::from_seed(b"Alice                           ").public().0.into()
				),
				vec![],
				None,
				None,
				None,
				None
			),
			Alternative::LocalTestnet => ChainSpec::from_genesis(
				"Local Testnet",
				"local_testnet",
				|| testnet_genesis(vec![
					ed25519::Pair::from_seed(b"Alice                           ").public().into(),
					ed25519::Pair::from_seed(b"Bob                             ").public().into(),
				], vec![
					ed25519::Pair::from_seed(b"Alice                           ").public().0.into(),
					ed25519::Pair::from_seed(b"Bob                             ").public().0.into(),
					ed25519::Pair::from_seed(b"Charlie                         ").public().0.into(),
					ed25519::Pair::from_seed(b"Dave                            ").public().0.into(),
					ed25519::Pair::from_seed(b"Eve                             ").public().0.into(),
					ed25519::Pair::from_seed(b"Ferdie                          ").public().0.into(),
				],
					ed25519::Pair::from_seed(b"Alice                           ").public().0.into()
				),
				vec![],
				None,
				None,
				None,
				None
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
	ChainSpec::from_embedded(include_bytes!("../res/joy_testnet_1.json"))
}

/// Staging testnet config
pub fn staging_testnet_config() -> ChainSpec {
	let boot_nodes = vec![
		String::from("/dns4/testnet-boot.joystream.org/tcp/30333/p2p/QmRMZZQDsDDg2bsYRBFT9FiWsFXpWfgGHqJFYcRfz9Pfyi")
	];
	ChainSpec::from_genesis(
		"Joystream Staging Testnet",
		"joystream_staging_3",
		staging_testnet_config_genesis,
		boot_nodes,
		Some(STAGING_TELEMETRY_URL.into()),
		None,
		None,
		None,
	)
}

fn staging_testnet_config_genesis () -> GenesisConfig {
	let initial_authorities = vec![
		hex!["313ef1233684209e8b9740be3da31ac588874efae4b59771863afd44c2b620c4"].into(),
	];
	let endowed_accounts = vec![
		hex!["6b7f25c05e367cbb8224681f9f8652f13e7de2953b4706f32e6daf42219ad31f"].into(),
	];

	const CENTS: u128 = 1;
	const DOLLARS: u128 = 100 * CENTS;

	const SECS_PER_BLOCK: u64 = 6;
	const MINUTES: u64 = 60 / SECS_PER_BLOCK;
	const HOURS: u64 = MINUTES * 60;
	const DAYS: u64 = HOURS * 24;

	GenesisConfig {
		consensus: Some(ConsensusConfig {
			code: include_bytes!("../runtime/wasm/target/wasm32-unknown-unknown/release/joystream_node_runtime_wasm.compact.wasm").to_vec(),
			authorities: initial_authorities.clone(),
		}),
		system: None,
		timestamp: Some(TimestampConfig {
			period: SECS_PER_BLOCK / 2, // due to the nature of aura the slots are 2*period
		}),
		indices: Some(IndicesConfig {
			ids: endowed_accounts.clone(),
		}),
		balances: Some(BalancesConfig {
			balances: endowed_accounts.iter().map(|&k| (k, 100_000_000 * DOLLARS)).collect(),
			existential_deposit: 0,
			transfer_fee: 0,
			creation_fee: 0,
			vesting: vec![],
		}),
		fees: Some(FeesConfig {
			transaction_base_fee: 0,
			transaction_byte_fee: 0,
		}),
		sudo: Some(SudoConfig {
			key: endowed_accounts[0].clone(),
		}),
		session: Some(SessionConfig {
			validators: initial_authorities.iter().cloned().map(Into::into).collect(),
			session_length: 10 * MINUTES,
		}),
		staking: Some(StakingConfig {
			current_era: 0,
			intentions: initial_authorities.iter().cloned().map(Into::into).collect(),
			offline_slash: Perbill::from_millionths(10_000),  // 1/ 100 => 1%
			session_reward: Perbill::from_millionths(1_000),  // 1/1000 => 0.1% (min stake -> 1000 units for reward to be GT 0)
			current_offline_slash: 0,
			current_session_reward: 0,
			validator_count: 10,
			sessions_per_era: 6,
			bonding_duration: 60 * MINUTES,
			offline_slash_grace: 4,
			minimum_validator_count: 1,
			invulnerables: initial_authorities.iter().cloned().map(Into::into).collect(),
		}),
		council: Some(CouncilConfig {
			active_council: vec![],
			term_ends_at: 1,
		}),
		election: Some(CouncilElectionConfig {
			auto_start: false,
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

	}
}

fn testnet_genesis(initial_authorities: Vec<Ed25519AuthorityId>, endowed_accounts: Vec<AccountId>, root_key: AccountId) -> GenesisConfig {
	GenesisConfig {
		consensus: Some(ConsensusConfig {
			code: include_bytes!("../runtime/wasm/target/wasm32-unknown-unknown/release/joystream_node_runtime_wasm.compact.wasm").to_vec(),
			authorities: initial_authorities.clone(),
		}),
		system: None,
		timestamp: Some(TimestampConfig {
			period: 3,                    // 3*2=6 second block time.
		}),
		indices: Some(IndicesConfig {
			ids: endowed_accounts.clone(),
		}),
		balances: Some(BalancesConfig {
			existential_deposit: 500,
			transfer_fee: 0,
			creation_fee: 0,
			balances: endowed_accounts.iter().map(|&k|(k, (1 << 60))).collect(),
			vesting: vec![],
		}),
		fees: Some(FeesConfig {
			transaction_base_fee: 0,
			transaction_byte_fee: 0,
		}),
		sudo: Some(SudoConfig {
			key: root_key,
		}),
		session: Some(SessionConfig {
			validators: initial_authorities.iter().cloned().map(Into::into).collect(),
			session_length: 10,
		}),
		staking: Some(StakingConfig {
			current_era: 0,
			intentions: initial_authorities.iter().cloned().map(Into::into).collect(),
			minimum_validator_count: 1,
			validator_count: 2,
			sessions_per_era: 5,
			bonding_duration: 2 * 60 * 12,
			offline_slash: Perbill::zero(),
			session_reward: Perbill::zero(),
			current_offline_slash: 0,
			current_session_reward: 0,
			offline_slash_grace: 0,
			invulnerables: initial_authorities.iter().cloned().map(Into::into).collect(),
		}),
		council: Some(CouncilConfig {
			active_council: vec![],
			term_ends_at: 1,
		}),
		election: Some(CouncilElectionConfig {
			auto_start: false,
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
			approval_quorum: 60,
			min_stake: 100,
			cancellation_fee: 5,
			rejection_fee: 10,
			voting_period: 100,
			name_max_len: 100,
			description_max_len: 10_000,
			wasm_code_max_len: 2_000_000,
		}),
	}
}
