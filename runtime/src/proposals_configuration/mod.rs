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
    pub FillWorkingGroupOpeningProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.fill_working_group_opening_proposal;
    pub SetWorkingGroupBudgetCapacityProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.set_working_group_budget_capacity_proposal;
    pub DecreaseWorkingGroupLeaderStakeProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.decrease_working_group_leader_stake_proposal;
    pub SlashWorkingGroupLeaderStakeProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.slash_working_group_leader_stake_proposal;
    pub SetWorkingGroupLeaderRewardProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.set_working_group_leader_reward_proposal;
    pub TerminateWorkingGroupLeaderRoleProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.terminate_working_group_leader_role_proposal;
    pub AmendConstitutionProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.amend_constitution_proposal;
    pub CancelWorkingGroupLeaderOpeningParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.cancel_working_group_leader_opening;
}

///////////

struct AllProposalsParameters {
    pub set_validator_count_proposal: ProposalParameters<BlockNumber, Balance>,
    pub runtime_upgrade_proposal: ProposalParameters<BlockNumber, Balance>,
    pub text_proposal: ProposalParameters<BlockNumber, Balance>,
    pub spending_proposal: ProposalParameters<BlockNumber, Balance>,
    pub add_working_group_opening_proposal: ProposalParameters<BlockNumber, Balance>,
    pub fill_working_group_opening_proposal: ProposalParameters<BlockNumber, Balance>,
    pub set_working_group_budget_capacity_proposal: ProposalParameters<BlockNumber, Balance>,
    pub decrease_working_group_leader_stake_proposal: ProposalParameters<BlockNumber, Balance>,
    pub slash_working_group_leader_stake_proposal: ProposalParameters<BlockNumber, Balance>,
    pub set_working_group_leader_reward_proposal: ProposalParameters<BlockNumber, Balance>,
    pub terminate_working_group_leader_role_proposal: ProposalParameters<BlockNumber, Balance>,
    pub amend_constitution_proposal: ProposalParameters<BlockNumber, Balance>,
    pub cancel_working_group_leader_opening: ProposalParameters<BlockNumber, Balance>,
}

// to initialize parameters only once.
lazy_static! {
    static ref ALL_PROPOSALS_PARAMETERS: AllProposalsParameters =
        get_all_proposals_parameters_objects();
}

// We need to fail fast.
#[allow(clippy::match_wild_err_arm)]
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
    let mut params = default_parameters();

    if let lite_json::JsonValue::Object(jo) = json {
        init_proposal_parameter_object!(params, jo.clone(), set_validator_count_proposal);
        init_proposal_parameter_object!(params, jo.clone(), runtime_upgrade_proposal);
        init_proposal_parameter_object!(params, jo.clone(), text_proposal);
        init_proposal_parameter_object!(params, jo.clone(), spending_proposal);
        init_proposal_parameter_object!(params, jo.clone(), add_working_group_opening_proposal);
        init_proposal_parameter_object!(params, jo.clone(), fill_working_group_opening_proposal);
        init_proposal_parameter_object!(
            params,
            jo.clone(),
            set_working_group_budget_capacity_proposal
        );
        init_proposal_parameter_object!(
            params,
            jo.clone(),
            decrease_working_group_leader_stake_proposal
        );
        init_proposal_parameter_object!(
            params,
            jo.clone(),
            slash_working_group_leader_stake_proposal
        );
        init_proposal_parameter_object!(
            params,
            jo.clone(),
            set_working_group_leader_reward_proposal
        );
        init_proposal_parameter_object!(
            params,
            jo.clone(),
            terminate_working_group_leader_role_proposal
        );
        init_proposal_parameter_object!(params, jo.clone(), amend_constitution_proposal);
        init_proposal_parameter_object!(params, jo, cancel_working_group_leader_opening);
    }

    params
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
// Zero value is wrapped as None.
macro_rules! init_proposal_parameter_optional_field {
    ($parameters_object:ident, $jsonObj:expr, $default_object:ident, $name:ident) => {
        let param_value = extract_numeric_parameter(
            $jsonObj,
            stringify!($name),
            $default_object.$name.unwrap_or_default().saturated_into(),
        )
        .saturated_into();
        let opt_value = if param_value == 0 {
            None
        } else {
            Some(param_value)
        };

        $parameters_object.$name = opt_value;
    };
}

// Extracts proposal parameters from the parsed JSON object.
fn extract_proposal_parameters(
    json_object: &JsonValue,
    defaults: ProposalParameters<BlockNumber, Balance>,
) -> ProposalParameters<BlockNumber, Balance> {
    let mut params = ProposalParameters::default();

    init_proposal_parameter_field!(params, json_object, defaults, voting_period);
    init_proposal_parameter_field!(params, json_object, defaults, grace_period);
    init_proposal_parameter_field!(params, json_object, defaults, approval_quorum_percentage);
    init_proposal_parameter_field!(params, json_object, defaults, approval_threshold_percentage);
    init_proposal_parameter_field!(params, json_object, defaults, slashing_quorum_percentage);
    init_proposal_parameter_field!(params, json_object, defaults, slashing_threshold_percentage);
    init_proposal_parameter_optional_field!(params, json_object, defaults, required_stake);
    init_proposal_parameter_field!(params, json_object, defaults, constitutionality);

    params
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
                _ => panic!("Incorrect JSON: not a number."),
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
        fill_working_group_opening_proposal: defaults::fill_working_group_opening_proposal(),
        set_working_group_budget_capacity_proposal:
            defaults::set_working_group_budget_capacity_proposal(),
        decrease_working_group_leader_stake_proposal:
            defaults::decrease_working_group_leader_stake_proposal(),
        slash_working_group_leader_stake_proposal:
            defaults::slash_working_group_leader_stake_proposal(),
        set_working_group_leader_reward_proposal:
            defaults::set_working_group_leader_reward_proposal(),
        terminate_working_group_leader_role_proposal:
            defaults::terminate_working_group_leader_role_proposal(),
        amend_constitution_proposal: defaults::amend_constitution_proposal(),
        cancel_working_group_leader_opening: defaults::cancel_working_group_leader_opening(),
    }
}
