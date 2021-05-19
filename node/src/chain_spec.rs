pub mod content_config;
pub mod forum_config;
pub mod initial_balances;
pub mod initial_members;
pub mod proposals_config;

use pallet_im_online::sr25519::AuthorityId as ImOnlineId;
use serde_json as json;
use sp_authority_discovery::AuthorityId as AuthorityDiscoveryId;
use sp_consensus_babe::AuthorityId as BabeId;
use sp_finality_grandpa::AuthorityId as GrandpaId;
use sp_runtime::Perbill;

pub use cumulus_primitives_core::ParaId;
use joystream_node_runtime::{
    membership, wasm_binary_unwrap, Balance, BalancesConfig, ContentConfig,
    ContentDirectoryWorkingGroupConfig, CouncilConfig, CouncilElectionConfig, DataDirectoryConfig,
    DataObjectStorageRegistryConfig, DataObjectTypeRegistryConfig, ElectionParameters, ForumConfig,
    GatewayWorkingGroupConfig, MembersConfig, Moment, OperationsWorkingGroupConfig,
    ProposalsCodexConfig, SessionKeys, StakerStatus, StorageWorkingGroupConfig, SudoConfig,
    SystemConfig, DAYS,
};

// Exported to be used by chain-spec-builder
pub use joystream_node_runtime::{AccountId, GenesisConfig, Signature};

#[cfg(feature = "standalone")]
use joystream_node_runtime::{
    AuthorityDiscoveryConfig, BabeConfig, GrandpaConfig, ImOnlineConfig, SessionConfig,
    StakingConfig,
};

#[cfg(not(feature = "standalone"))]
use joystream_node_runtime::ParachainInfoConfig;

use sc_chain_spec::{ChainSpecExtension, ChainSpecGroup};
use sc_service::ChainType;
use serde::{Deserialize, Serialize};
use sp_core::{sr25519, Pair, Public};
use sp_runtime::traits::{IdentifyAccount, Verify};

/// Specialized `ChainSpec` for the normal parachain runtime.
pub type ChainSpec =
    sc_service::GenericChainSpec<joystream_node_runtime::GenesisConfig, Extensions>;

/// The extensions for the [`ChainSpec`].
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ChainSpecGroup, ChainSpecExtension)]
#[serde(deny_unknown_fields)]
pub struct Extensions {
    /// The relay chain of the Parachain.
    pub relay_chain: String,
    /// The id of the Parachain.
    pub para_id: u32,
}

impl Extensions {
    /// Try to get the extension from the given `ChainSpec`.
    pub fn try_get(chain_spec: &dyn sc_service::ChainSpec) -> Option<&Self> {
        sc_chain_spec::get_extension(chain_spec.extensions())
    }
}

type AccountPublic = <Signature as Verify>::Signer;

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

pub fn development_config(id: ParaId) -> ChainSpec {
    ChainSpec::from_genesis(
        // Name
        "Development",
        // ID
        "dev",
        ChainType::Local,
        move || {
            testnet_genesis(
                vec![get_authority_keys_from_seed("Alice")],
                get_account_id_from_seed::<sr25519::Public>("Alice"),
                vec![
                    get_account_id_from_seed::<sr25519::Public>("Alice"),
                    get_account_id_from_seed::<sr25519::Public>("Bob"),
                    get_account_id_from_seed::<sr25519::Public>("Alice//stash"),
                    get_account_id_from_seed::<sr25519::Public>("Bob//stash"),
                ],
                proposals_config::development(),
                initial_members::none(),
                forum_config::empty(get_account_id_from_seed::<sr25519::Public>("Alice")),
                content_config::empty_data_directory_config(),
                vec![],
                id,
            )
        },
        vec![],
        None,
        None,
        None,
        Extensions {
            relay_chain: "rococo-dev".into(),
            para_id: id.into(),
        },
    )
}

pub fn local_testnet_config(id: ParaId) -> ChainSpec {
    ChainSpec::from_genesis(
        // Name
        "Local Testnet",
        // ID
        "local_testnet",
        ChainType::Local,
        move || {
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
                proposals_config::development(),
                initial_members::none(),
                forum_config::empty(get_account_id_from_seed::<sr25519::Public>("Alice")),
                content_config::empty_data_directory_config(),
                vec![],
                id,
            )
        },
        vec![],
        None,
        None,
        None,
        Extensions {
            relay_chain: "rococo-local".into(),
            para_id: id.into(),
        },
    )
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

#[cfg(feature = "standalone")]
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
    cpcp: joystream_node_runtime::ProposalsConfigParameters,
    members: Vec<membership::genesis::Member<u64, AccountId, Moment>>,
    forum_config: ForumConfig,
    data_directory_config: DataDirectoryConfig,
    initial_balances: Vec<(AccountId, Balance)>,
    id: ParaId,
) -> joystream_node_runtime::GenesisConfig {
    const STASH: Balance = 5_000;
    const ENDOWMENT: Balance = 100_000_000;

    let default_text_constraint = joystream_node_runtime::working_group::default_text_constraint();

    let default_storage_size_constraint =
        joystream_node_runtime::working_group::default_storage_size_constraint();

    joystream_node_runtime::GenesisConfig {
        frame_system: joystream_node_runtime::SystemConfig {
            code: joystream_node_runtime::WASM_BINARY
                .expect("WASM binary was not build, please build it!")
                .to_vec(),
            changes_trie_config: Default::default(),
        },
        pallet_balances: joystream_node_runtime::BalancesConfig {
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
        },
        pallet_sudo: SudoConfig { key: root_key },
        #[cfg(feature = "standalone")]
        pallet_babe: BabeConfig {
            authorities: vec![],
            epoch_config: None,
        },
        #[cfg(feature = "standalone")]
        pallet_im_online: ImOnlineConfig { keys: vec![] },
        #[cfg(feature = "standalone")]
        pallet_authority_discovery: AuthorityDiscoveryConfig { keys: vec![] },
        #[cfg(feature = "standalone")]
        pallet_grandpa: GrandpaConfig {
            authorities: vec![],
        },
        #[cfg(feature = "standalone")]
        pallet_staking: StakingConfig {
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
        },
        #[cfg(feature = "standalone")]
        pallet_session: SessionConfig {
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
        #[cfg(not(feature = "standalone"))]
        parachain_info: ParachainInfoConfig { parachain_id: id },
        council: CouncilConfig {
            active_council: vec![],
            term_ends_at: 1,
        },
        election: CouncilElectionConfig {
            auto_start: true,
            election_parameters: ElectionParameters {
                announcing_period: 4 * DAYS,
                voting_period: 1 * DAYS,
                revealing_period: 1 * DAYS,
                council_size: 16,
                candidacy_limit: 50,
                min_council_stake: 1_000,
                new_term_duration: 1 * DAYS,
                min_voting_stake: 100,
            },
        },
        membership: MembersConfig {
            default_paid_membership_fee: 100u128,
            members,
        },
        forum: forum_config,
        data_directory: data_directory_config,
        data_object_type_registry: DataObjectTypeRegistryConfig {
            first_data_object_type_id: 1,
        },
        data_object_storage_registry: DataObjectStorageRegistryConfig {
            first_relationship_id: 1,
        },
        working_group_Instance2: StorageWorkingGroupConfig {
            phantom: Default::default(),
            working_group_mint_capacity: 0,
            opening_human_readable_text_constraint: default_text_constraint,
            worker_application_human_readable_text_constraint: default_text_constraint,
            worker_exit_rationale_text_constraint: default_text_constraint,
            worker_storage_size_constraint: default_storage_size_constraint,
        },
        working_group_Instance3: ContentDirectoryWorkingGroupConfig {
            phantom: Default::default(),
            working_group_mint_capacity: 0,
            opening_human_readable_text_constraint: default_text_constraint,
            worker_application_human_readable_text_constraint: default_text_constraint,
            worker_exit_rationale_text_constraint: default_text_constraint,
            worker_storage_size_constraint: default_storage_size_constraint,
        },
        working_group_Instance4: OperationsWorkingGroupConfig {
            phantom: Default::default(),
            working_group_mint_capacity: 0,
            opening_human_readable_text_constraint: default_text_constraint,
            worker_application_human_readable_text_constraint: default_text_constraint,
            worker_exit_rationale_text_constraint: default_text_constraint,
            worker_storage_size_constraint: default_storage_size_constraint,
        },
        working_group_Instance5: GatewayWorkingGroupConfig {
            phantom: Default::default(),
            working_group_mint_capacity: 0,
            opening_human_readable_text_constraint: default_text_constraint,
            worker_application_human_readable_text_constraint: default_text_constraint,
            worker_exit_rationale_text_constraint: default_text_constraint,
            worker_storage_size_constraint: default_storage_size_constraint,
        },
        content: ContentConfig {
            next_curator_group_id: 1,
            next_channel_category_id: 1,
            next_channel_id: 1,
            next_video_category_id: 1,
            next_video_id: 1,
            next_playlist_id: 1,
            next_series_id: 1,
            next_person_id: 1,
            next_channel_transfer_request_id: 1,
        },
        proposals_codex: ProposalsCodexConfig {
            set_validator_count_proposal_voting_period: cpcp
                .set_validator_count_proposal_voting_period,
            set_validator_count_proposal_grace_period: cpcp
                .set_validator_count_proposal_grace_period,
            runtime_upgrade_proposal_voting_period: cpcp.runtime_upgrade_proposal_voting_period,
            runtime_upgrade_proposal_grace_period: cpcp.runtime_upgrade_proposal_grace_period,
            text_proposal_voting_period: cpcp.text_proposal_voting_period,
            text_proposal_grace_period: cpcp.text_proposal_grace_period,
            set_election_parameters_proposal_voting_period: cpcp
                .set_election_parameters_proposal_voting_period,
            set_election_parameters_proposal_grace_period: cpcp
                .set_election_parameters_proposal_grace_period,
            spending_proposal_voting_period: cpcp.spending_proposal_voting_period,
            spending_proposal_grace_period: cpcp.spending_proposal_grace_period,
            add_working_group_opening_proposal_voting_period: cpcp
                .add_working_group_opening_proposal_voting_period,
            add_working_group_opening_proposal_grace_period: cpcp
                .add_working_group_opening_proposal_grace_period,
            begin_review_working_group_leader_applications_proposal_voting_period: cpcp
                .begin_review_working_group_leader_applications_proposal_voting_period,
            begin_review_working_group_leader_applications_proposal_grace_period: cpcp
                .begin_review_working_group_leader_applications_proposal_grace_period,
            fill_working_group_leader_opening_proposal_voting_period: cpcp
                .fill_working_group_leader_opening_proposal_voting_period,
            fill_working_group_leader_opening_proposal_grace_period: cpcp
                .fill_working_group_leader_opening_proposal_grace_period,
            set_working_group_mint_capacity_proposal_voting_period: cpcp
                .set_working_group_mint_capacity_proposal_voting_period,
            set_working_group_mint_capacity_proposal_grace_period: cpcp
                .set_working_group_mint_capacity_proposal_grace_period,
            decrease_working_group_leader_stake_proposal_voting_period: cpcp
                .decrease_working_group_leader_stake_proposal_voting_period,
            decrease_working_group_leader_stake_proposal_grace_period: cpcp
                .decrease_working_group_leader_stake_proposal_grace_period,
            slash_working_group_leader_stake_proposal_voting_period: cpcp
                .slash_working_group_leader_stake_proposal_voting_period,
            slash_working_group_leader_stake_proposal_grace_period: cpcp
                .slash_working_group_leader_stake_proposal_grace_period,
            set_working_group_leader_reward_proposal_voting_period: cpcp
                .set_working_group_leader_reward_proposal_voting_period,
            set_working_group_leader_reward_proposal_grace_period: cpcp
                .set_working_group_leader_reward_proposal_grace_period,
            terminate_working_group_leader_role_proposal_voting_period: cpcp
                .terminate_working_group_leader_role_proposal_voting_period,
            terminate_working_group_leader_role_proposal_grace_period: cpcp
                .terminate_working_group_leader_role_proposal_grace_period,
        },
    }
}
