//! This module defines a set of the parameters for each proposal in the runtime like
//! _SetValidatorCountProposalParameters_. It is separated because we need to be able to configure
//! these parameters during the compilation time. Main consumer of the conditional compilation planned
//! to be the integration tests.
//!
//! The whole parameter set is initialized only once by deserializing JSON from the environment variable
//! "ALL_PROPOSALS_PARAMETERS_JSON". If it doesn't exists or contains invalid or empty JSON then
//! the default parameters are returned. If some proposal section of the JSON file contains only
//! partial object definition - default values are returned as missing fields.
//!

use crate::{Balance, BlockNumber, ProposalParameters};
use frame_support::dispatch::Vec;
use frame_support::parameter_types;
use frame_support::sp_runtime::SaturatedConversion;
use lite_json::{JsonObject, JsonValue};

mod defaults;
#[cfg(test)]
mod tests;

/////////// Proposal parameters definition

parameter_types! {
    pub SetValidatorCountProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.set_validator_count_proposal;
    pub RuntimeUpgradeProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.runtime_upgrade_proposal;
    pub TextProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.text_proposal;
    pub SpendingProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.spending_proposal;
    pub AddWorkingGroupOpeningProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.add_working_group_opening_proposal;
}

///////////

struct AllProposalsParameters {
    pub set_validator_count_proposal: ProposalParameters<BlockNumber, Balance>,
    pub runtime_upgrade_proposal: ProposalParameters<BlockNumber, Balance>,
    pub text_proposal: ProposalParameters<BlockNumber, Balance>,
    pub spending_proposal: ProposalParameters<BlockNumber, Balance>,
    pub add_working_group_opening_proposal: ProposalParameters<BlockNumber, Balance>,
}

// to initialize parameters only once.
lazy_static! {
    static ref ALL_PROPOSALS_PARAMETERS: AllProposalsParameters =
        get_all_proposals_parameters_objects();
}

// Composes AllProposalsParameters object from the JSON string.
// It gets the JSON string from the environment variable and tries to parse it.
// On error and any missing values it gets default values.
fn get_all_proposals_parameters_objects() -> AllProposalsParameters {
    let json_str: Option<&'static str> = option_env!("ALL_PROPOSALS_PARAMETERS_JSON");

    json_str
        .map(lite_json::parse_json)
        .map(|res| res.ok())
        .flatten()
        .map(convert_json_object_to_proposal_parameters)
        .unwrap_or_else(default_parameters)
}

// Tries to extract all proposal parameters from the parsed JSON object.
fn convert_json_object_to_proposal_parameters(
    json: lite_json::JsonValue,
) -> AllProposalsParameters {
    let mut parameters = default_parameters();

    if let lite_json::JsonValue::Object(json_object) = json {
        parameters.set_validator_count_proposal = create_proposal_parameters_object(
            json_object.clone(),
            "set_validator_count_proposal",
            defaults::set_validator_count_proposal(),
        );
        parameters.runtime_upgrade_proposal = create_proposal_parameters_object(
            json_object.clone(),
            "runtime_upgrade_proposal",
            defaults::runtime_upgrade_proposal(),
        );
        parameters.text_proposal = create_proposal_parameters_object(
            json_object.clone(),
            "text_proposal",
            defaults::text_proposal(),
        );
        parameters.spending_proposal = create_proposal_parameters_object(
            json_object.clone(),
            "spending_proposal",
            defaults::spending_proposal(),
        );
        parameters.add_working_group_opening_proposal = create_proposal_parameters_object(
            json_object,
            "add_working_group_opening_proposal",
            defaults::add_working_group_opening_proposal(),
        );
    }

    parameters
}

// Tries to create specific ProposalParameters object from the parsed JSON object.
// Returns default parameters on missing values.
fn create_proposal_parameters_object(
    json_object: JsonObject,
    proposal_name: &'static str,
    defaults: ProposalParameters<BlockNumber, Balance>,
) -> ProposalParameters<BlockNumber, Balance> {
    json_object
        .iter()
        .find(|(name_vec, _)| name_vec.eq(&proposal_name.chars().collect::<Vec<_>>()))
        .map(|(_, params)| extract_proposal_parameters(params, defaults))
        .unwrap_or(defaults)
}

// Extracts proposal parameters from the parsed JSON object.
fn extract_proposal_parameters(
    json_object: &JsonValue,
    defaults: ProposalParameters<BlockNumber, Balance>,
) -> ProposalParameters<BlockNumber, Balance> {
    ProposalParameters::<BlockNumber, Balance> {
        voting_period: extract_numeric_parameter(
            json_object,
            "voting_period",
            defaults.voting_period.saturated_into(),
        )
        .saturated_into(),
        grace_period: extract_numeric_parameter(
            json_object,
            "grace_period",
            defaults.grace_period.saturated_into(),
        )
        .saturated_into(),
        approval_quorum_percentage: extract_numeric_parameter(
            json_object,
            "approval_quorum_percentage",
            defaults.approval_quorum_percentage.saturated_into(),
        )
        .saturated_into(),
        approval_threshold_percentage: extract_numeric_parameter(
            json_object,
            "approval_threshold_percentage",
            defaults.approval_threshold_percentage.saturated_into(),
        )
        .saturated_into(),
        slashing_quorum_percentage: extract_numeric_parameter(
            json_object,
            "slashing_quorum_percentage",
            defaults.slashing_quorum_percentage.saturated_into(),
        )
        .saturated_into(),
        slashing_threshold_percentage: extract_numeric_parameter(
            json_object,
            "slashing_threshold_percentage",
            defaults.slashing_threshold_percentage.saturated_into(),
        )
        .saturated_into(),
        required_stake: Some(
            extract_numeric_parameter(
                json_object,
                "required_stake",
                defaults.required_stake.unwrap_or_default().saturated_into(),
            )
            .saturated_into(),
        ),
        constitutionality: extract_numeric_parameter(
            json_object,
            "constitutionality",
            defaults.constitutionality.saturated_into(),
        )
        .saturated_into(),
    }
}

// Extracts a specific numeric parameter from the parsed JSON object.
fn extract_numeric_parameter(
    json_object: &JsonValue,
    parameter_name: &'static str,
    default: u128,
) -> u128 {
    match json_object {
        JsonValue::Object(json_object) => json_object
            .iter()
            .find(|(name_vec, _)| name_vec.eq(&parameter_name.chars().collect::<Vec<_>>()))
            .map(|(_, value)| match value {
                JsonValue::Number(number) => number.integer.saturated_into(),
                _ => 0u128,
            })
            .unwrap_or(default),
        _ => default,
    }
}

// Returns all default proposal parameters.
fn default_parameters() -> AllProposalsParameters {
    AllProposalsParameters {
        set_validator_count_proposal: defaults::set_validator_count_proposal(),
        runtime_upgrade_proposal: defaults::runtime_upgrade_proposal(),
        text_proposal: defaults::text_proposal(),
        spending_proposal: defaults::spending_proposal(),
        add_working_group_opening_proposal: defaults::add_working_group_opening_proposal(),
    }
}
