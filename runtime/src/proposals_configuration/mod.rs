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
}

///////////

struct AllProposalsParameters {
    pub set_validator_count_proposal: ProposalParameters<BlockNumber, Balance>,
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
        .map(|res| match res {
            Ok(json) => Some(json),
            Err(_) => {
                panic!("Invalid JSON with proposals parameters provided.");
            }
        })
        .flatten()
        .map(convert_json_object_to_proposal_parameters)
        .unwrap_or_else(default_parameters)
}

// Helper macro for initializing single ProposalParameters object for a specified field of the
// AllProposalsParameters object. It helps to reduce duplication of the field names for
// AllProposalsParameters field, JSON object field name and default value function.
// Consider this as duplication example:
//         parameters.set_validator_count_proposal = create_proposal_parameters_object(
//             json_object,
//             "set_validator_count_proposal",
//             defaults::set_validator_count_proposal(),
//         );
macro_rules! init_proposal_parameter_object {
    ($parameters_object:ident, $jsonObj:expr, $name:ident) => {
        $parameters_object.$name =
            create_proposal_parameters_object($jsonObj, stringify!($name), defaults::$name());
    };
}

// Tries to extract all proposal parameters from the parsed JSON object.
fn convert_json_object_to_proposal_parameters(
    json: lite_json::JsonValue,
) -> AllProposalsParameters {
    let mut parameters = default_parameters();

    if let lite_json::JsonValue::Object(json_object) = json {
        init_proposal_parameter_object!(parameters, json_object, set_validator_count_proposal)
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

// Helper macro for initializing single field of the ProposalParameters object.
// It helps to reduce duplication of the field names for ProposalParameters
// field name, JSON object field name and default value field name.
// Consider this as duplication example:
//     ProposalParameters::<BlockNumber, Balance> {
//         voting_period: extract_numeric_parameter(
//             json_object,
//             "voting_period",
//             defaults.voting_period.saturated_into(),
//         )
//         .saturated_into(),
//      ....
//      }
macro_rules! init_proposal_parameter_field {
    ($parameters_object:ident, $jsonObj:expr, $default_object:ident, $name:ident) => {
        $parameters_object.$name = extract_numeric_parameter(
            $jsonObj,
            stringify!($name),
            $default_object.$name.saturated_into(),
        )
        .saturated_into();
    };
}

// Helper macro similar to init_proposal_parameter_field but for optional parameters.
macro_rules! init_proposal_parameter_optional_field {
    ($parameters_object:ident, $jsonObj:expr, $default_object:ident, $name:ident) => {
        $parameters_object.$name = Some(
            extract_numeric_parameter(
                $jsonObj,
                stringify!($name),
                $default_object.$name.unwrap_or_default().saturated_into(),
            )
            .saturated_into(),
        );
    };
}

// Extracts proposal parameters from the parsed JSON object.
fn extract_proposal_parameters(
    json_object: &JsonValue,
    defaults: ProposalParameters<BlockNumber, Balance>,
) -> ProposalParameters<BlockNumber, Balance> {
    let mut proposals_parameters = ProposalParameters::default();

    init_proposal_parameter_field!(proposals_parameters, json_object, defaults, voting_period);
    init_proposal_parameter_field!(proposals_parameters, json_object, defaults, grace_period);
    init_proposal_parameter_field!(
        proposals_parameters,
        json_object,
        defaults,
        approval_quorum_percentage
    );
    init_proposal_parameter_field!(
        proposals_parameters,
        json_object,
        defaults,
        approval_threshold_percentage
    );
    init_proposal_parameter_field!(
        proposals_parameters,
        json_object,
        defaults,
        slashing_quorum_percentage
    );
    init_proposal_parameter_field!(
        proposals_parameters,
        json_object,
        defaults,
        slashing_threshold_percentage
    );
    init_proposal_parameter_optional_field!(
        proposals_parameters,
        json_object,
        defaults,
        required_stake
    );
    init_proposal_parameter_field!(
        proposals_parameters,
        json_object,
        defaults,
        constitutionality
    );

    proposals_parameters
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
    }
}
