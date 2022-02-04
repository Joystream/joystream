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
    pub SetMaxValidatorCountProposalParameters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.set_max_validator_count_proposal;
    pub RuntimeUpgradeProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.runtime_upgrade_proposal;
    pub SignalProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.signal_proposal;
    pub FundingRequestProposalParameters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.funding_request_proposal;
    pub CreateWorkingGroupLeadOpeningProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.create_working_group_lead_opening_proposal;
    pub FillWorkingGroupLeadOpeningProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.fill_working_group_lead_opening_proposal;
    pub UpdateWorkingGroupBudgetProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.update_working_group_budget_proposal;
    pub DecreaseWorkingGroupLeadStakeProposalParameters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.decrease_working_group_lead_stake_proposal;
    pub SlashWorkingGroupLeadProposalParameters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.slash_working_group_lead_proposal;
    pub SetWorkingGroupLeadRewardProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.set_working_group_lead_reward_proposal;
    pub TerminateWorkingGroupLeadProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.terminate_working_group_lead_proposal;
    pub AmendConstitutionProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.amend_constitution_proposal;
    pub CancelWorkingGroupLeadOpeningProposalParameters: ProposalParameters<BlockNumber, Balance> = ALL_PROPOSALS_PARAMETERS.cancel_working_group_lead_opening_proposal;
    pub SetMembershipPriceProposalParameters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.set_membership_price_proposal;
    pub SetCouncilBudgetIncrementProposalParameters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.set_council_budget_increment_proposal;
    pub SetCouncilorRewardProposalParameters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.set_councilor_reward_proposal;
    pub SetInitialInvitationBalanceProposalParameters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.set_initial_invitation_balance_proposal;
    pub SetMembershipLeadInvitationQuotaProposalParameters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.set_membership_lead_invitation_quota_proposal;
    pub SetReferralCutProposalParameters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.set_referral_cut_proposal;
    pub SetInvitationCountProposalParameters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.set_invitation_count_proposal;
    pub CreateBlogPostProposalParameters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.create_blog_post_proposal;
    pub EditBlogPostProoposalParamters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.edit_blog_post_proposal;
    pub LockBlogPostProposalParameters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.lock_blog_post_proposal;
    pub UnlockBlogPostProposalParameters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.unlock_blog_post_proposal;
    pub VetoProposalProposalParameters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.veto_proposal_proposal;
    pub VetoBountyProposalParameters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.veto_bounty_proposal;
    pub WithdrawBountyFundingProposalParameters: ProposalParameters<BlockNumber, Balance> =
        ALL_PROPOSALS_PARAMETERS.withdraw_bounty_funding_proposal;
}

///////////

struct AllProposalsParameters {
    pub set_max_validator_count_proposal: ProposalParameters<BlockNumber, Balance>,
    pub runtime_upgrade_proposal: ProposalParameters<BlockNumber, Balance>,
    pub signal_proposal: ProposalParameters<BlockNumber, Balance>,
    pub funding_request_proposal: ProposalParameters<BlockNumber, Balance>,
    pub create_working_group_lead_opening_proposal: ProposalParameters<BlockNumber, Balance>,
    pub fill_working_group_lead_opening_proposal: ProposalParameters<BlockNumber, Balance>,
    pub update_working_group_budget_proposal: ProposalParameters<BlockNumber, Balance>,
    pub decrease_working_group_lead_stake_proposal: ProposalParameters<BlockNumber, Balance>,
    pub slash_working_group_lead_proposal: ProposalParameters<BlockNumber, Balance>,
    pub set_working_group_lead_reward_proposal: ProposalParameters<BlockNumber, Balance>,
    pub terminate_working_group_lead_proposal: ProposalParameters<BlockNumber, Balance>,
    pub amend_constitution_proposal: ProposalParameters<BlockNumber, Balance>,
    pub cancel_working_group_lead_opening_proposal: ProposalParameters<BlockNumber, Balance>,
    pub set_membership_price_proposal: ProposalParameters<BlockNumber, Balance>,
    pub set_council_budget_increment_proposal: ProposalParameters<BlockNumber, Balance>,
    pub set_councilor_reward_proposal: ProposalParameters<BlockNumber, Balance>,
    pub set_initial_invitation_balance_proposal: ProposalParameters<BlockNumber, Balance>,
    pub set_membership_lead_invitation_quota_proposal: ProposalParameters<BlockNumber, Balance>,
    pub set_referral_cut_proposal: ProposalParameters<BlockNumber, Balance>,
    pub set_invitation_count_proposal: ProposalParameters<BlockNumber, Balance>,
    pub create_blog_post_proposal: ProposalParameters<BlockNumber, Balance>,
    pub edit_blog_post_proposal: ProposalParameters<BlockNumber, Balance>,
    pub lock_blog_post_proposal: ProposalParameters<BlockNumber, Balance>,
    pub unlock_blog_post_proposal: ProposalParameters<BlockNumber, Balance>,
    pub veto_proposal_proposal: ProposalParameters<BlockNumber, Balance>,
    pub veto_bounty_proposal: ProposalParameters<BlockNumber, Balance>,
    pub withdraw_bounty_funding_proposal: ProposalParameters<BlockNumber, Balance>,
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
        init_proposal_parameter_object!(params, jo.clone(), set_max_validator_count_proposal);
        init_proposal_parameter_object!(params, jo.clone(), runtime_upgrade_proposal);
        init_proposal_parameter_object!(params, jo.clone(), signal_proposal);
        init_proposal_parameter_object!(params, jo.clone(), funding_request_proposal);
        init_proposal_parameter_object!(
            params,
            jo.clone(),
            create_working_group_lead_opening_proposal
        );
        init_proposal_parameter_object!(
            params,
            jo.clone(),
            fill_working_group_lead_opening_proposal
        );
        init_proposal_parameter_object!(params, jo.clone(), update_working_group_budget_proposal);
        init_proposal_parameter_object!(
            params,
            jo.clone(),
            decrease_working_group_lead_stake_proposal
        );
        init_proposal_parameter_object!(params, jo.clone(), slash_working_group_lead_proposal);
        init_proposal_parameter_object!(params, jo.clone(), set_working_group_lead_reward_proposal);
        init_proposal_parameter_object!(params, jo.clone(), terminate_working_group_lead_proposal);
        init_proposal_parameter_object!(params, jo.clone(), amend_constitution_proposal);
        init_proposal_parameter_object!(
            params,
            jo.clone(),
            cancel_working_group_lead_opening_proposal
        );
        init_proposal_parameter_object!(params, jo.clone(), set_membership_price_proposal);
        init_proposal_parameter_object!(params, jo.clone(), set_council_budget_increment_proposal);
        init_proposal_parameter_object!(params, jo.clone(), set_councilor_reward_proposal);
        init_proposal_parameter_object!(
            params,
            jo.clone(),
            set_initial_invitation_balance_proposal
        );
        init_proposal_parameter_object!(
            params,
            jo.clone(),
            set_membership_lead_invitation_quota_proposal
        );
        init_proposal_parameter_object!(params, jo.clone(), set_referral_cut_proposal);
        init_proposal_parameter_object!(params, jo.clone(), set_invitation_count_proposal);
        init_proposal_parameter_object!(params, jo.clone(), create_blog_post_proposal);
        init_proposal_parameter_object!(params, jo.clone(), edit_blog_post_proposal);
        init_proposal_parameter_object!(params, jo.clone(), lock_blog_post_proposal);
        init_proposal_parameter_object!(params, jo.clone(), unlock_blog_post_proposal);
        init_proposal_parameter_object!(params, jo.clone(), veto_proposal_proposal);
        init_proposal_parameter_object!(params, jo.clone(), veto_bounty_proposal);
        init_proposal_parameter_object!(params, jo, withdraw_bounty_funding_proposal);
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

// Creates an error inside the macro when fixed.
#[allow(clippy::field_reassign_with_default)]
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
        set_max_validator_count_proposal: defaults::set_max_validator_count_proposal(),
        runtime_upgrade_proposal: defaults::runtime_upgrade_proposal(),
        signal_proposal: defaults::signal_proposal(),
        funding_request_proposal: defaults::funding_request_proposal(),
        create_working_group_lead_opening_proposal:
            defaults::create_working_group_lead_opening_proposal(),
        fill_working_group_lead_opening_proposal:
            defaults::fill_working_group_lead_opening_proposal(),
        update_working_group_budget_proposal: defaults::update_working_group_budget_proposal(),
        decrease_working_group_lead_stake_proposal:
            defaults::decrease_working_group_lead_stake_proposal(),
        slash_working_group_lead_proposal: defaults::slash_working_group_lead_proposal(),
        set_working_group_lead_reward_proposal: defaults::set_working_group_lead_reward_proposal(),
        terminate_working_group_lead_proposal: defaults::terminate_working_group_lead_proposal(),
        amend_constitution_proposal: defaults::amend_constitution_proposal(),
        cancel_working_group_lead_opening_proposal:
            defaults::cancel_working_group_lead_opening_proposal(),
        set_membership_price_proposal: defaults::set_membership_price_proposal(),
        set_council_budget_increment_proposal: defaults::set_council_budget_increment_proposal(),
        set_councilor_reward_proposal: defaults::set_councilor_reward_proposal(),
        set_initial_invitation_balance_proposal: defaults::set_initial_invitation_balance_proposal(
        ),
        set_membership_lead_invitation_quota_proposal:
            defaults::set_membership_lead_invitation_quota_proposal(),
        set_referral_cut_proposal: defaults::set_referral_cut_proposal(),
        set_invitation_count_proposal: defaults::set_invitation_count_proposal(),
        create_blog_post_proposal: defaults::create_blog_post_proposal(),
        edit_blog_post_proposal: defaults::edit_blog_post_proposal(),
        lock_blog_post_proposal: defaults::lock_blog_post_proposal(),
        unlock_blog_post_proposal: defaults::unlock_blog_post_proposal(),
        veto_proposal_proposal: defaults::veto_proposal_proposal(),
        veto_bounty_proposal: defaults::veto_bounty_proposal(),
        withdraw_bounty_funding_proposal: defaults::withdraw_bounty_funding_proposal(),
    }
}
