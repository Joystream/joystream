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

use node_runtime::{
    versioned_store::InputValidationLengthConstraint as VsInputValidation,
    AuthorityDiscoveryConfig, BabeConfig, Balance, BalancesConfig, ContentWorkingGroupConfig,
    CouncilConfig, CouncilElectionConfig, DataObjectStorageRegistryConfig,
    DataObjectTypeRegistryConfig, ElectionParameters, GrandpaConfig, ImOnlineConfig, IndicesConfig,
    MembersConfig, MigrationConfig, Perbill, ProposalsCodexConfig, SessionConfig, SessionKeys,
    Signature, StakerStatus, StakingConfig, StorageWorkingGroupConfig, SudoConfig, SystemConfig,
    VersionedStoreConfig, DAYS, WASM_BINARY,
};
pub use node_runtime::{AccountId, GenesisConfig};
use primitives::{sr25519, Pair, Public};
use runtime_primitives::traits::{IdentifyAccount, Verify};

use babe_primitives::AuthorityId as BabeId;
use grandpa_primitives::AuthorityId as GrandpaId;
use im_online::sr25519::AuthorityId as ImOnlineId;
use serde_json as json;

type AccountPublic = <Signature as Verify>::Signer;

/// Specialized `ChainSpec`. This is a specialization of the general Substrate ChainSpec type.
pub type ChainSpec = substrate_service::ChainSpec<GenesisConfig>;

use node_runtime::common::constraints::InputValidationLengthConstraint;

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
        })
    }

    pub(crate) fn from(s: &str) -> Option<Self> {
        match s {
            "dev" => Some(Alternative::Development),
            "local" => Some(Alternative::LocalTestnet),
            _ => None,
        }
    }
}

fn new_vs_validation(min: u16, max_min_diff: u16) -> VsInputValidation {
    VsInputValidation { min, max_min_diff }
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

pub fn testnet_genesis(
    initial_authorities: Vec<(AccountId, AccountId, GrandpaId, BabeId, ImOnlineId)>,
    root_key: AccountId,
    endowed_accounts: Vec<AccountId>,
) -> GenesisConfig {
    const CENTS: Balance = 1;
    const DOLLARS: Balance = 100 * CENTS;
    const STASH: Balance = 20 * DOLLARS;
    const ENDOWMENT: Balance = 100_000 * DOLLARS;

    // default codex proposals config parameters
    let cpcp = node_runtime::ProposalsConfigParameters::default();
    let default_text_constraint = node_runtime::working_group::default_text_constraint();

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
        sudo: Some(SudoConfig { key: root_key }),
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
            election_parameters: ElectionParameters {
                announcing_period: 3 * DAYS,
                voting_period: 1 * DAYS,
                revealing_period: 1 * DAYS,
                council_size: 12,
                candidacy_limit: 25,
                min_council_stake: 10 * DOLLARS,
                new_term_duration: 14 * DAYS,
                min_voting_stake: 1 * DOLLARS,
            },
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
        working_group_Instance2: Some(StorageWorkingGroupConfig {
            phantom: Default::default(),
            storage_working_group_mint_capacity: 0,
            opening_human_readable_text_constraint: default_text_constraint,
            worker_application_human_readable_text_constraint: default_text_constraint,
            worker_exit_rationale_text_constraint: default_text_constraint,
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
            mint_capacity: 100_000,
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
            channel_handle_constraint: InputValidationLengthConstraint::new(5, 20),
            channel_description_constraint: InputValidationLengthConstraint::new(1, 1024),
            opening_human_readable_text: InputValidationLengthConstraint::new(1, 2048),
            curator_application_human_readable_text: InputValidationLengthConstraint::new(1, 2048),
            curator_exit_rationale_text: InputValidationLengthConstraint::new(1, 2048),
            channel_avatar_constraint: InputValidationLengthConstraint::new(5, 1024),
            channel_banner_constraint: InputValidationLengthConstraint::new(5, 1024),
            channel_title_constraint: InputValidationLengthConstraint::new(5, 1024),
        }),
        migration: Some(MigrationConfig {}),
        proposals_codex: Some(ProposalsCodexConfig {
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
            set_content_working_group_mint_capacity_proposal_voting_period: cpcp
                .set_content_working_group_mint_capacity_proposal_voting_period,
            set_content_working_group_mint_capacity_proposal_grace_period: cpcp
                .set_content_working_group_mint_capacity_proposal_grace_period,
            set_lead_proposal_voting_period: cpcp.set_lead_proposal_voting_period,
            set_lead_proposal_grace_period: cpcp.set_lead_proposal_voting_period,
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
                .set_content_working_group_mint_capacity_proposal_voting_period,
            set_working_group_mint_capacity_proposal_grace_period: cpcp
                .set_content_working_group_mint_capacity_proposal_grace_period,
        }),
    }
}
