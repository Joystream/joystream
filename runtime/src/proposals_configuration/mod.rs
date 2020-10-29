use crate::{Balance, BlockNumber, ProposalParameters};
use frame_support::dispatch::Vec;
use frame_support::parameter_types;
use frame_support::sp_runtime::SaturatedConversion;
use lite_json::{JsonObject, JsonValue};

mod defaults;
#[cfg(test)]
mod tests;

struct AllProposalsParameters {
    pub set_validator_count_proposal: ProposalParameters<BlockNumber, Balance>,
}

// to initialize parameter only once.
lazy_static! {
    static ref ALL_PROPOSALS_PARAMETERS: AllProposalsParameters = get_all_proposals_parameters();
}

parameter_types! {
    pub SetValidatorCountProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.set_validator_count_proposal;
}

// Composes AllProposalsParameters object from the JSON string.
// It gets the JSON string from the environment variable and tries to parse it.
// On error and any missing values it gets default values.
fn get_all_proposals_parameters() -> AllProposalsParameters {
    let json_str: Option<&'static str> = option_env!("ALL_PROPOSALS_PARAMETERS_JSON");

    json_str
        .map(lite_json::parse_json)
        .map(|res| res.ok())
        .flatten()
        .map(convert_json_object)
        .unwrap_or_else(default_parameters)
}

// Tries to extract all proposal parameters from the parsed JSON object.
fn convert_json_object(json: lite_json::JsonValue) -> AllProposalsParameters {
    let mut parameters = default_parameters();

    if let lite_json::JsonValue::Object(json_object) = json {
        parameters.set_validator_count_proposal = create_proposal_parameters_object(
            json_object,
            "set_validator_count_proposal",
            defaults::set_validator_count_proposal(),
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
        voting_period: extract_parameter(
            json_object,
            "voting_period",
            defaults.voting_period.saturated_into(),
        )
        .saturated_into(),
        grace_period: extract_parameter(
            json_object,
            "grace_period",
            defaults.grace_period.saturated_into(),
        )
        .saturated_into(),
        approval_quorum_percentage: extract_parameter(
            json_object,
            "approval_quorum_percentage",
            defaults.approval_quorum_percentage.saturated_into(),
        )
        .saturated_into(),
        approval_threshold_percentage: extract_parameter(
            json_object,
            "approval_threshold_percentage",
            defaults.approval_threshold_percentage.saturated_into(),
        )
        .saturated_into(),
        slashing_quorum_percentage: extract_parameter(
            json_object,
            "slashing_quorum_percentage",
            defaults.slashing_quorum_percentage.saturated_into(),
        )
        .saturated_into(),
        slashing_threshold_percentage: extract_parameter(
            json_object,
            "slashing_threshold_percentage",
            defaults.slashing_threshold_percentage.saturated_into(),
        )
        .saturated_into(),
        required_stake: Some(
            extract_parameter(
                json_object,
                "required_stake",
                defaults.required_stake.unwrap_or_default().saturated_into(),
            )
            .saturated_into(),
        ),
        constitutionality: extract_parameter(
            json_object,
            "constitutionality",
            defaults.constitutionality.saturated_into(),
        )
        .saturated_into(),
    }
}

// Extracts a specific parameter from the parsed JSON object.
fn extract_parameter(json_object: &JsonValue, parameter_name: &'static str, default: u128) -> u128 {
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
    }
}
