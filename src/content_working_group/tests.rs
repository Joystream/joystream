#![cfg(test)]

use super::genesis;
use super::lib;
use super::mock::{self, *};
use crate::membership;
use hiring;
use srml_support::{StorageLinkedMap, StorageValue};
use rstd::collections::btree_set::BTreeSet;
use runtime_primitives::traits::One;

/// DIRTY IMPORT BECAUSE
/// InputValidationLengthConstraint has not been factored out yet!!!
use forum::InputValidationLengthConstraint;

#[test]
fn create_channel_success() {

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            /*
             * Setup
             */

            let channel_creator_member_root_and_controller_account = 12312;

            let channel_creator_member_id = add_member(channel_creator_member_root_and_controller_account, to_vec(CHANNEL_CREATOR_HANDLE));

            let channel_name = generate_valid_length_buffer(&ChannelHandleConstraint::get());
            let description = generate_valid_length_buffer(&ChannelDescriptionConstraint::get());
            let content = ChannelContentType::Video;
            let publishing_status = ChannelPublishingStatus::NotPublished;

            /*
             * Test
             */ 

            // Create channel
            ContentWorkingGroup::create_channel(
                Origin::signed(channel_creator_member_root_and_controller_account),
                channel_creator_member_id,
                channel_creator_member_root_and_controller_account,
                channel_name.clone(),
                description.clone(),
                content.clone(),
                publishing_status.clone()
            )
            .expect("Should work");

            /*
             * Assert
             */

            // Assert that event was triggered,
            // keep channel id.
            let channel_id = ensure_channelcreated_event_deposited();

            // Assert that given channel id has been added,
            // and has the right properties.
            assert!(lib::ChannelById::<Test>::exists(channel_id));

            let created_channel = lib::ChannelById::<Test>::get(channel_id);

            let expected_channel = Channel {
                channel_name: channel_name.clone(),
                verified: false,
                description: description,
                content: content,
                owner: channel_creator_member_id,
                role_account: channel_creator_member_root_and_controller_account,
                publishing_status: publishing_status,
                curation_status: ChannelCurationStatus::Normal,
                created: 1,

                // We have no expectation here, so we just copy what was added
                principal_id: created_channel.principal_id
            };

            assert_eq!(
                created_channel,
                expected_channel                
            );

            // Assert that next id incremented.
            assert_eq!(lib::NextChannelId::<Test>::get(), channel_id + 1);

            // Assert that there is a mapping established for name
            assert_eq!(
                lib::ChannelIdByName::<Test>::get(channel_name),
                channel_id
            );

            // Check that principal actually has been added
            assert!(
                lib::PrincipalById::<Test>::exists(created_channel.principal_id)
            );

            let created_principal = lib::PrincipalById::<Test>::get(created_channel.principal_id);

            assert!(
                match created_principal {
                    Principal::Lead => false,
                    Principal::Curator(_) => false,
                    Principal::ChannelOwner(created_principal_channel_id) => created_principal_channel_id == channel_id,
                }
            );


        });
}

#[test]
fn create_channel_not_enabled() {
    
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            /*
             * Setup
             */

            add_member_and_set_as_lead();

            let channel_creator_member_id = add_channel_creator_member();

            set_channel_creation_enabled(false);

            let number_of_events_before_call = System::events().len();

            /*
             * Test
             */

            // Create channel incorrect member role account
            assert_eq!(
                ContentWorkingGroup::create_channel(
                    Origin::signed(CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT),

                    // invalid member id
                    channel_creator_member_id + <<Test as members::Trait>::MemberId as One>::one(),
                    CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT,
                    generate_valid_length_buffer(&ChannelHandleConstraint::get()),
                    generate_valid_length_buffer(&ChannelDescriptionConstraint::get()),
                    ChannelContentType::Video,
                    ChannelPublishingStatus::NotPublished
                ).unwrap_err()
                ,
                MSG_CREATE_CHANNEL_IS_NOT_MEMBER
            );

            // No new events deposited
            assert_no_new_events(number_of_events_before_call);
        });
}

#[test]
fn create_channel_is_not_a_member() {
    let channel_creator_member_root_account = 12312;
    let channel_creator_member_id = 0; /* HACK, guessing ID, needs better solution */

    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(
            membership::genesis::GenesisConfigBuilder::default()
                .members([channel_creator_member_root_account].to_vec())
                .build(),
        )
        .set_content_wg_config(
            genesis::GenesisConfigBuilder::default()
                .set_channel_creation_enabled(false)
                .build()
        )
        .build()
        .execute_with(|| {

            let number_of_events_before_call = System::events().len();

            // Create channel
            assert_eq!(
                ContentWorkingGroup::create_channel(
                    Origin::signed(channel_creator_member_root_account),
                    channel_creator_member_id,
                    channel_creator_member_root_account,
                    generate_valid_length_buffer(&ChannelHandleConstraint::get()),
                    generate_valid_length_buffer(&ChannelDescriptionConstraint::get()),
                    ChannelContentType::Video,
                    ChannelPublishingStatus::NotPublished
                ).unwrap_err()
                ,
                MSG_CHANNEL_CREATION_DISABLED
            );

            // No new events deposited
            assert_no_new_events(number_of_events_before_call);
        });
}

#[test]
fn create_channel_with_bad_member_role_account() {
    let channel_creator_member_root_account = 12312;
    let channel_creator_member_id = 0; /* HACK, guessing ID, needs better solution */

    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(
            membership::genesis::GenesisConfigBuilder::default()
                .members([channel_creator_member_root_account].to_vec())
                .build(),
        )
        .set_content_wg_config(
            genesis::GenesisConfigBuilder::default()
                .build()
        )
        .build()
        .execute_with(|| {

            let number_of_events_before_call = System::events().len();

            // Create channel incorrect member role account
            assert_eq!(
                ContentWorkingGroup::create_channel(
                    Origin::signed(71893780491), // <== incorrect
                    channel_creator_member_id,
                    channel_creator_member_root_account,
                    generate_valid_length_buffer(&ChannelHandleConstraint::get()),
                    generate_valid_length_buffer(&ChannelDescriptionConstraint::get()),
                    ChannelContentType::Video,
                    ChannelPublishingStatus::NotPublished
                ).unwrap_err()
                ,
                MSG_CREATE_CHANNEL_NOT_CONTROLLER_ACCOUNT
            );

            // No new events deposited
            assert_no_new_events(number_of_events_before_call);

        });
}

#[test]
fn create_channel_handle_too_long() {
    let channel_creator_member_root_account = 12312;
    let channel_creator_member_id = 0; /* HACK, guessing ID, needs better solution */

    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(
            membership::genesis::GenesisConfigBuilder::default()
                .members([channel_creator_member_root_account].to_vec())
                .build(),
        )
        .build()
        .execute_with(|| {

            let number_of_events_before_call = System::events().len();

            // Create channel with handle that is too long
            assert_eq!(
                ContentWorkingGroup::create_channel(
                    Origin::signed(channel_creator_member_root_account),
                    channel_creator_member_id,
                    channel_creator_member_root_account,
                    generate_too_long_length_buffer(&ChannelHandleConstraint::get()),
                    generate_valid_length_buffer(&ChannelDescriptionConstraint::get()),
                    ChannelContentType::Video,
                    ChannelPublishingStatus::NotPublished
                ).unwrap_err()
                ,
                MSG_CHANNEL_HANDLE_TOO_LONG
            );

            // No new events deposited
            assert_no_new_events(number_of_events_before_call);
        });
}

#[test]
fn create_channel_handle_too_short() {
    let channel_creator_member_root_account = 12312;
    let channel_creator_member_id = 0; /* HACK, guessing ID, needs better solution */

    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(
            membership::genesis::GenesisConfigBuilder::default()
                .members([channel_creator_member_root_account].to_vec())
                .build(),
        )
        .build()
        .execute_with(|| {

            let number_of_events_before_call = System::events().len();

            // Create channel with handle that is too short
            assert_eq!(
                ContentWorkingGroup::create_channel(
                    Origin::signed(channel_creator_member_root_account),
                    channel_creator_member_id,
                    channel_creator_member_root_account,
                    generate_too_short_length_buffer(&ChannelHandleConstraint::get()),
                    generate_valid_length_buffer(&ChannelDescriptionConstraint::get()),
                    ChannelContentType::Video,
                    ChannelPublishingStatus::NotPublished
                ).unwrap_err()
                ,
                MSG_CHANNEL_HANDLE_TOO_SHORT
            );

            // No new events deposited
            assert_no_new_events(number_of_events_before_call);
        });
}

#[test]
fn create_channel_description_too_long() {
    let channel_creator_member_root_account = 12312;
    let channel_creator_member_id = 0; /* HACK, guessing ID, needs better solution */

    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(
            membership::genesis::GenesisConfigBuilder::default()
                .members([channel_creator_member_root_account].to_vec())
                .build(),
        )
        .build()
        .execute_with(|| {

            let number_of_events_before_call = System::events().len();

            // Create channel with description that is too long
            assert_eq!(
                ContentWorkingGroup::create_channel(
                    Origin::signed(channel_creator_member_root_account),
                    channel_creator_member_id,
                    channel_creator_member_root_account,
                    generate_valid_length_buffer(&ChannelHandleConstraint::get()),
                    generate_too_long_length_buffer(&ChannelDescriptionConstraint::get()),
                    ChannelContentType::Video,
                    ChannelPublishingStatus::NotPublished
                ).unwrap_err()
                ,
                MSG_CHANNEL_DESCRIPTION_TOO_LONG
            );

            // No new events deposited
            assert_no_new_events(number_of_events_before_call);
        });
}

#[test]
fn create_channel_description_too_short() {
    let channel_creator_member_root_account = 12312;
    let channel_creator_member_id = 0; /* HACK, guessing ID, needs better solution */

    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(
            membership::genesis::GenesisConfigBuilder::default()
                .members([channel_creator_member_root_account].to_vec())
                .build(),
        )
        .build()
        .execute_with(|| {

            let number_of_events_before_call = System::events().len();

            // Create channel with description that is too short
            assert_eq!(
                ContentWorkingGroup::create_channel(
                    Origin::signed(channel_creator_member_root_account),
                    channel_creator_member_id,
                    channel_creator_member_root_account,
                    generate_valid_length_buffer(&ChannelHandleConstraint::get()),
                    generate_too_short_length_buffer(&ChannelDescriptionConstraint::get()),
                    ChannelContentType::Video,
                    ChannelPublishingStatus::NotPublished
                ).unwrap_err()
                ,
                MSG_CHANNEL_DESCRIPTION_TOO_SHORT
            );

            // No new events deposited
            assert_no_new_events(number_of_events_before_call);

        });
}

#[test]
fn transfer_channel_ownership_success() {

}

#[test]
fn update_channel_as_owner_success() {

}

#[test]
fn update_channel_as_curation_actor_success() {

}

#[test]
fn add_curator_opening_success() {

    let lead_member_root_and_controller_account = 12312;
    let lead_member_id = 0; /* HACK, guessing ID, needs better solution */

    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(
            membership::genesis::GenesisConfigBuilder::default()
                .members([lead_member_root_and_controller_account].to_vec())
                .build(),
        )
        .build()
        .execute_with(|| {

            // Set lead
            set_lead(lead_member_id, lead_member_root_and_controller_account);

            let expected_opening_id = hiring::NextOpeningId::<Test>::get();

            // ====

            // Add opening
            let activate_at = hiring::ActivateOpeningAt::ExactBlock(34);

            let policy = OpeningPolicyCommitment{
                application_rationing_policy: None, //Option<hiring::ApplicationRationingPolicy>,
                max_review_period_length: 100,
                application_staking_policy: None, // Option<hiring::StakingPolicy<Balance, BlockNumber>>,
                role_staking_policy: None, // Option<hiring::StakingPolicy<Balance, BlockNumber>>,
                role_slashing_terms: SlashingTerms::Unslashable,
                fill_opening_successful_applicant_application_stake_unstaking_period: None,
                fill_opening_failed_applicant_application_stake_unstaking_period: None,
                fill_opening_failed_applicant_role_stake_unstaking_period: None,
                terminate_curator_application_stake_unstaking_period: None,
                terminate_curator_role_stake_unstaking_period: None,
                exit_curator_role_application_stake_unstaking_period: None,
                exit_curator_role_stake_unstaking_period: None,
            };

            let human_readable_text = generate_valid_length_buffer(&OpeningHumanReadableText::get());

            assert_eq!(
                ContentWorkingGroup::add_curator_opening(
                    Origin::signed(lead_member_root_and_controller_account),
                    activate_at.clone(),
                    policy.clone(),
                    human_readable_text.clone()
                ).unwrap(),
                ()
            );

            let curator_opening_id = ensure_curatoropeningadded_event_deposited();

            // Assert that given opening id has been added,
            // and has the right properties.
            assert!(lib::CuratorOpeningById::<Test>::exists(curator_opening_id));

            let created_curator_opening = lib::CuratorOpeningById::<Test>::get(curator_opening_id);

            let expected_curator_opening = CuratorOpening{
                opening_id: expected_opening_id,
                curator_applications: BTreeSet::new(),
                policy_commitment: policy.clone()
            };

            assert_eq!(
                created_curator_opening,
                expected_curator_opening                
            );

            // Assert that next id incremented.
            assert_eq!(
                lib::NextCuratorOpeningId::<Test>::get(),
                expected_opening_id + 1
            );

        });
}

#[test]
fn accept_curator_applications_success() {

    let lead_member_root_and_controller_account = 12312;
    let lead_member_new_role_account = 18271;
    let lead_member_id = 0; /* HACK, guessing ID, needs better solution */

    TestExternalitiesBuilder::<Test>::default()
        .set_membership_config(
            membership::genesis::GenesisConfigBuilder::default()
                .members([lead_member_root_and_controller_account].to_vec())
                .build(),
        )
        .build()
        .execute_with(|| {

            /*
             * Setup
             */
            
            set_lead(lead_member_id, lead_member_new_role_account);

            let curator_opening_id = add_curator_opening(lead_member_new_role_account);

            /*
             * Test
             */

            assert_eq!(
                ContentWorkingGroup::accept_curator_applications(
                    Origin::signed(lead_member_new_role_account),
                    curator_opening_id
                    ).unwrap(),
                ()
            );

            let event_curator_opening_id = ensure_acceptedcuratorapplications_event_deposited();

            assert_eq!(
                curator_opening_id,
                event_curator_opening_id
            );
        });

}

#[test]
fn begin_curator_applicant_review_success() {

}

#[test]
fn fill_curator_opening_success() {

}

#[test]
fn withdraw_curator_application_success() {

}

#[test]
fn terminate_curator_application_success() {

}

#[test]
fn apply_on_curator_opening_success() {

}

#[test]
fn update_curator_role_account_success() {

}

#[test]
fn update_curator_reward_account_success() {

}

#[test]
fn leave_curator_role_success() {

}

#[test]
fn terminate_curator_role_success() {

}

#[test]
fn set_lead_success() {

}

#[test]
fn unset_lead_success() {

}

#[test]
fn unstaked_success() {

}

#[test]
fn account_can_act_as_principal_success() {

}

/*
 * Fixtures
 */

static LEAD_ROOT_AND_CONTROLLER_ACCOUNT: <Test as system::Trait>::AccountId = 1289;
static LEAD_ROLE_ACCOUNT: <Test as system::Trait>::AccountId = 1289;
static LEAD_MEMBER_HANDLE: &str = "IamTheLead";
static CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT: <Test as system::Trait>::AccountId = 11;
static CHANNEL_CREATOR_HANDLE: &str = "Coolcreator";

pub fn to_vec(s: &str) -> Vec<u8> {
    s.as_bytes().to_vec()
}

/*
 * Setups
 */

pub fn add_member_and_set_as_lead() -> (<Test as members::Trait>::MemberId, LeadId<Test>) {

    let member_id = add_member(
        LEAD_ROOT_AND_CONTROLLER_ACCOUNT,
        to_vec(LEAD_MEMBER_HANDLE)
    );

    let lead_id = set_lead(member_id, LEAD_ROLE_ACCOUNT);

    (member_id, lead_id)
}

pub fn set_channel_creation_enabled(enabled: bool) {

    lib::Module::<Test>::set_channel_creation_enabled(
        Origin::signed(LEAD_ROLE_ACCOUNT), 
        enabled
    ).unwrap()
}

pub fn add_channel_creator_member() -> <Test as members::Trait>::MemberId {

    let channel_creator_member_id = add_member(
        CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT,
        to_vec(CHANNEL_CREATOR_HANDLE)
    );

    channel_creator_member_id
}

pub fn add_member(root_and_controller_account: <Test as system::Trait>::AccountId, handle: Vec<u8>) -> <Test as members::Trait>::MemberId {
    
    assert_eq!(
        members::Module::<Test>::buy_membership(
            Origin::signed(root_and_controller_account),
            0,
            members::UserInfo{
                handle: Some(handle),
                avatar_uri: None,
                about: None,
            }
        ).unwrap(),
        ()
    );

    ensure_memberregistered_event_deposited()
}

pub fn set_lead(member_id: <Test as members::Trait>::MemberId, new_role_account: <Test as system::Trait>::AccountId) -> LeadId<Test> {

    // Get controller account
    //let lead_member_controller_account = members::Module::<Test>::ensure_profile(member_id).unwrap().controller_account;

    // Set lead
    assert_eq!(
        ContentWorkingGroup::set_lead(
            mock::Origin::system(system::RawOrigin::Root),
            member_id,
            new_role_account
        ).unwrap(),
        ()
    );

    // Grab lead id
    ensure_lead_set_event_deposited()
}

pub fn add_curator_opening(lead_role_account: <Test as system::Trait>::AccountId) -> CuratorOpeningId<Test> {

    let activate_at = hiring::ActivateOpeningAt::ExactBlock(34);

    let policy = OpeningPolicyCommitment{
        application_rationing_policy: None, //Option<hiring::ApplicationRationingPolicy>,
        max_review_period_length: 100,
        application_staking_policy: None, // Option<hiring::StakingPolicy<Balance, BlockNumber>>,
        role_staking_policy: None, // Option<hiring::StakingPolicy<Balance, BlockNumber>>,
        role_slashing_terms: SlashingTerms::Unslashable,
        fill_opening_successful_applicant_application_stake_unstaking_period: None,
        fill_opening_failed_applicant_application_stake_unstaking_period: None,
        fill_opening_failed_applicant_role_stake_unstaking_period: None,
        terminate_curator_application_stake_unstaking_period: None,
        terminate_curator_role_stake_unstaking_period: None,
        exit_curator_role_application_stake_unstaking_period: None,
        exit_curator_role_stake_unstaking_period: None,
    };

    let human_readable_text = generate_valid_length_buffer(&OpeningHumanReadableText::get());

    assert_eq!(
        ContentWorkingGroup::add_curator_opening(
            Origin::signed(lead_role_account),
            activate_at.clone(),
            policy.clone(),
            human_readable_text.clone()
        ).unwrap(),
        ()
    );

    ensure_curatoropeningadded_event_deposited()
}

/*
 * Event readers
 */

// MOVE OUT TO MEMBERSHIP MODULE MOCK LATER?,
// OR MAKE MACRO OUT OF.
fn ensure_memberregistered_event_deposited() -> <Test as members::Trait>::MemberId {

    if let mock::TestEvent::members(ref x) = System::events().last().unwrap().event {
        if let members::RawEvent::MemberRegistered(ref member_id, ref _root_and_controller_account) = x {
            return member_id.clone();
        } else {
            panic!("Event was not MemberRegistered.")
        }
    } else {
        panic!("No event deposited.")
    }
}

fn ensure_channelcreated_event_deposited() -> lib::ChannelId<Test> {
    if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
        if let lib::RawEvent::ChannelCreated(ref channel_id) = x {
            return channel_id.clone();
        } else {
            panic!("Event was not ChannelCreated.")
        }
    } else {
        panic!("No event deposited.")
    }
}

fn ensure_lead_set_event_deposited() -> lib::LeadId<Test> {

    if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
        if let lib::RawEvent::LeadSet(ref lead_id) = x {
            return lead_id.clone();
        } else {
            panic!("Event was not LeadSet.")
        }
    } else {
        panic!("No event deposited.")
    }

}

fn ensure_curatoropeningadded_event_deposited() -> lib::CuratorOpeningId<Test> {

    if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
        if let lib::RawEvent::CuratorOpeningAdded(ref curator_opening_id) = x {
            return curator_opening_id.clone();
        } else {
            panic!("Event was not CuratorOpeningAdded.")
        }
    } else {
        panic!("No event deposited.")
    } 
}

fn ensure_acceptedcuratorapplications_event_deposited() -> lib::CuratorOpeningId<Test> {
    
    if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
        if let lib::RawEvent::AcceptedCuratorApplications(ref curator_opening_id) = x {
            return curator_opening_id.clone();
        } else {
            panic!("Event was not AcceptedCuratorApplications.")
        }
    } else {
        panic!("No event deposited.")
    } 
}


fn assert_no_new_events(number_of_events_before_call: usize) {

    assert_eq!(
        number_of_events_before_call,
        System::events().len()
    );
}

/*
 * Buffer generators
 */

pub fn generate_text(len: usize) -> Vec<u8> {
    vec![b'x'; len]
}

pub fn generate_valid_length_buffer(constraint: &InputValidationLengthConstraint) -> Vec<u8> {
    generate_text(constraint.min as usize)
}

pub fn generate_too_short_length_buffer(constraint: &InputValidationLengthConstraint) -> Vec<u8> {
    generate_text((constraint.min - 1) as usize)
}

pub fn generate_too_long_length_buffer(constraint: &InputValidationLengthConstraint) -> Vec<u8> {
    generate_text((constraint.max() + 1) as usize)
}