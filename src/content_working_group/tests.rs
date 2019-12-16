#![cfg(test)]

//use super::genesis;
use super::lib;
use super::mock::{self, *};
//use crate::membership;
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
fn create_channel_is_not_a_member() {
    
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            /*
             * Setup
             */

            let channel_creator_member_id = add_channel_creator_member();

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
fn create_channel_not_enabled() {

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            /*
             * Setup
             */

            add_member_and_set_as_lead();

            set_channel_creation_enabled(false);

            let channel_creator_member_id = add_channel_creator_member();

            /*
             * Test
             */
            
            let number_of_events_before_call = System::events().len();

            // Create channel
            assert_eq!(
                ContentWorkingGroup::create_channel(
                    Origin::signed(CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT),
                    channel_creator_member_id,
                    CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT,
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

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            /*
             * Setup
             */

            let channel_creator_member_id = add_channel_creator_member();

            let number_of_events_before_call = System::events().len();

            /*
             * Test
             */

            // Create channel incorrect member role account
            assert_eq!(
                ContentWorkingGroup::create_channel(

                    // <== incorrect
                    Origin::signed(71893780491),
                    channel_creator_member_id,
                    CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT,
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

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            /*
             * Setup
             */

            let channel_creator_member_id = add_channel_creator_member();

            let number_of_events_before_call = System::events().len();

            /*
             * Test
             */

            // Create channel with handle that is too long
            assert_eq!(
                ContentWorkingGroup::create_channel(
                    Origin::signed(CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT),
                    channel_creator_member_id,
                    CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT,
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

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            /*
             * Setup
             */

            let channel_creator_member_id = add_channel_creator_member();

            let number_of_events_before_call = System::events().len();

            /*
             * Test
             */

            // Create channel with handle that is too short
            assert_eq!(
                ContentWorkingGroup::create_channel(
                    Origin::signed(CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT),
                    channel_creator_member_id,
                    CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT,
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

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            /*
             * Setup
             */

            let channel_creator_member_id = add_channel_creator_member();

            let number_of_events_before_call = System::events().len();

            /*
             * Test
             */

            // Create channel with description that is too long
            assert_eq!(
                ContentWorkingGroup::create_channel(
                    Origin::signed(CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT),
                    channel_creator_member_id,
                    CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT,
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

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            /*
             * Setup
             */

            let channel_creator_member_id = add_channel_creator_member();

            let number_of_events_before_call = System::events().len();

            /*
             * Test
             */

            // Create channel with description that is too short
            assert_eq!(
                ContentWorkingGroup::create_channel(
                    Origin::signed(CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT),
                    channel_creator_member_id,
                    CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT,
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

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            /*
             * Setup
             */

            add_member_and_set_as_lead();

            let expected_opening_id = hiring::NextOpeningId::<Test>::get();

            /*
             * Test
             */

            // Add opening
            let activate_at = hiring::ActivateOpeningAt::ExactBlock(34);

            let human_readable_text = generate_valid_length_buffer(&OpeningHumanReadableText::get());

            assert_eq!(
                ContentWorkingGroup::add_curator_opening(
                    Origin::signed(LEAD_ROLE_ACCOUNT),
                    activate_at.clone(),
                    get_baseline_opening_policy(),
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
                policy_commitment: get_baseline_opening_policy()
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

            /*
             * TODO: add assertion abouot side-effect in hiring module, 
             * this is where state of application has fundamentally changed.
             */

        });
}

#[test]
fn accept_curator_applications_success() {

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            /*
             * Setup
             */

            add_member_and_set_as_lead();

            let curator_opening_id = add_curator_opening();

            /*
             * Test
             */

            assert_eq!(
                ContentWorkingGroup::accept_curator_applications(
                    Origin::signed(LEAD_ROLE_ACCOUNT),
                    curator_opening_id
                    ).unwrap(),
                ()
            );

            let event_curator_opening_id = ensure_acceptedcuratorapplications_event_deposited();

            assert_eq!(
                curator_opening_id,
                event_curator_opening_id
            );

            /*
             * TODO: add assertion abouot side-effect in hiring module, 
             * this is where state of application has fundamentally changed.
             */
        });

}

#[test]
fn begin_curator_applicant_review_success() {

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            /*
             * Setup
             */

            let curator_opening_id = setup_normal_accepting_opening();

            let _ = add_member_and_apply_on_opening(
                curator_opening_id,
                333,
                to_vec("CuratorWannabe"),
                11111,
                91000,
                generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get())
            );

            /*
             * Test
             */

            assert_eq!(
                ContentWorkingGroup::begin_curator_applicant_review(
                    Origin::signed(LEAD_ROLE_ACCOUNT),
                    curator_opening_id
                )
                .unwrap(),
                ()
            );

            let event_curator_opening_id = ensure_begancuratorapplicationreview_event_deposited();

            assert_eq!(
                curator_opening_id,
                event_curator_opening_id
            );
            
            /*
             * TODO: add assertion abouot side-effect in hiring module, 
             * this is where state of application has fundamentally changed.
             */
        
        });
}

#[test]
fn fill_curator_opening_success() {

}

#[test]
fn withdraw_curator_application_success() {

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            /*
             * Setup
             */

            let curator_opening_id = setup_normal_accepting_opening();

            let curator_applicant_root_and_controller_account = 333;
            let curator_applicant_role_account = 11111;
            let human_readable_text = generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get());

            let (_curator_applicant_member_id, new_curator_application_id) = add_member_and_apply_on_opening(
                curator_opening_id,
                curator_applicant_root_and_controller_account,
                to_vec("CuratorWannabe"),
                curator_applicant_role_account,
                91000,
                human_readable_text
            );

            /*
             * Test
             */

            assert_eq!(
                ContentWorkingGroup::withdraw_curator_application(
                    Origin::signed(curator_applicant_role_account),
                    new_curator_application_id
                )
                .unwrap(),
                ()
            );

            // Event was triggered
            let curator_application_id = ensure_curatorapplicationwithdrawn_event_deposited();

            assert_eq!(
                new_curator_application_id,
                curator_application_id
            );

            /*
             * TODO: add assertion abouot side-effect in hiring module, 
             * this is where state of application has fundamentally changed.
             */
        
        });

}

#[test]
fn terminate_curator_application_success() {

}

#[test]
fn apply_on_curator_opening_success() {

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            /*
             * Setup
             */

            let curator_opening_id = setup_normal_accepting_opening();

            // Add curator membership

            let curator_applicant_root_and_controller_account = 72618;

            let curator_applicant_member_id = add_member(
                curator_applicant_root_and_controller_account,
                to_vec("IwillTrytoapplyhere")
            );

            let curator_applicant_role_account = 8881111;

            let role_stake_balance = get_baseline_opening_policy().role_staking_policy.unwrap().amount;
            let application_stake_balance = get_baseline_opening_policy().application_staking_policy.unwrap().amount;
            let total_balance = role_stake_balance + application_stake_balance;
        
            let source_account = 918111;

            // Credit staking source account
            let _ = balances::Module::<Test>::deposit_creating(&source_account, total_balance);

            let human_readable_text = generate_valid_length_buffer(&ChannelHandleConstraint::get());

            let expected_curator_application_id = NextCuratorApplicationId::<Test>::get();

            let old_curator_opening = CuratorOpeningById::<Test>::get(curator_opening_id);

            /*
             * Test
             */

            assert_eq!(
                ContentWorkingGroup::apply_on_curator_opening(
                    Origin::signed(curator_applicant_root_and_controller_account),
                    curator_applicant_member_id,
                    curator_opening_id,
                    curator_applicant_role_account,
                    source_account,
                    Some(role_stake_balance),
                    Some(application_stake_balance),
                    human_readable_text
                )
                .unwrap(),
                ()
            );

            let (curator_opening_id, new_curator_application_id) = ensure_applieadoncuratoropening_event_deposited();

            assert!(
                CuratorApplicationById::<Test>::exists(new_curator_application_id)
            );

            // Assert that appropriate application has been added
            let new_curator_application = CuratorApplicationById::<Test>::get(new_curator_application_id);

            let expected_curator_application = CuratorApplication{
                role_account: curator_applicant_role_account,
                curator_opening_id: curator_opening_id,
                member_id: curator_applicant_member_id,
                application_id: expected_curator_application_id,
            };

            assert_eq!(
                expected_curator_application,
                new_curator_application
            );

            // Assert that the opening has had the application added to application list
            let mut singleton = BTreeSet::new(); // Unavoidable mutable, BTreeSet can only be populated this way.
            singleton.insert(new_curator_application_id);

            let new_curator_applications = old_curator_opening.curator_applications.union(&singleton).cloned().collect();

            let expected_curator_opening = CuratorOpening{
                curator_applications: new_curator_applications,
                ..old_curator_opening
            };

            let new_curator_opening = CuratorOpeningById::<Test>::get(curator_opening_id);

            assert_eq!(
                expected_curator_opening,
                new_curator_opening
            );
        });
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

/// Made into function to avoid having to clone every time we read fields
pub fn get_baseline_opening_policy() -> OpeningPolicyCommitment<<Test as system::Trait>::BlockNumber, BalanceOf<Test>> {
    
    OpeningPolicyCommitment{
        application_rationing_policy: Some(hiring::ApplicationRationingPolicy{
            max_active_applicants : 5
        }),
        max_review_period_length: 100,
        application_staking_policy: Some(hiring::StakingPolicy{
            amount: 40000,
            amount_mode: hiring::StakingAmountLimitMode::Exact,
            crowded_out_unstaking_period_length: Some(3),
            review_period_expired_unstaking_period_length: Some(22),
        }),
        role_staking_policy: Some(hiring::StakingPolicy{
            amount: 900000,
            amount_mode: hiring::StakingAmountLimitMode::AtLeast,
            crowded_out_unstaking_period_length: Some(30),
            review_period_expired_unstaking_period_length: Some(2),
        }),
        role_slashing_terms: SlashingTerms::Unslashable,

        fill_opening_successful_applicant_application_stake_unstaking_period: None,
        fill_opening_failed_applicant_application_stake_unstaking_period: None,
        fill_opening_failed_applicant_role_stake_unstaking_period: None,
        terminate_curator_application_stake_unstaking_period: None,
        terminate_curator_role_stake_unstaking_period: None,
        exit_curator_role_application_stake_unstaking_period: None,
        exit_curator_role_stake_unstaking_period: None,
    }
}

pub fn to_vec(s: &str) -> Vec<u8> {
    s.as_bytes().to_vec()
}

/*
 * Setups
 */


pub fn add_member_and_apply_on_opening(
    curator_opening_id: CuratorOpeningId<Test>,
    curator_applicant_root_and_controller_account: <Test as system::Trait>::AccountId,
    handle: Vec<u8>,
    curator_applicant_role_account: <Test as system::Trait>::AccountId,
    source_account: <Test as system::Trait>::AccountId,
    human_readable_text: Vec<u8>
) -> (<Test as members::Trait>::MemberId, lib::CuratorApplicationId<Test>) {

    // Make membership
    let curator_applicant_member_id = add_member(
        curator_applicant_root_and_controller_account,
        handle
    );

    // Guarantee sufficient stake
    let role_stake_balance = get_baseline_opening_policy().role_staking_policy.unwrap().amount;
    let application_stake_balance = get_baseline_opening_policy().application_staking_policy.unwrap().amount;
    let total_balance = role_stake_balance + application_stake_balance;

    // Credit staking source account
    let _ = balances::Module::<Test>::deposit_creating(&source_account, total_balance);

    let expected_curator_application_id = NextCuratorApplicationId::<Test>::get();

    let old_curator_opening = CuratorOpeningById::<Test>::get(curator_opening_id);

    /*
     * Test
     */

    assert_eq!(
        ContentWorkingGroup::apply_on_curator_opening(
            Origin::signed(curator_applicant_root_and_controller_account),
            curator_applicant_member_id,
            curator_opening_id,
            curator_applicant_role_account,
            source_account,
            Some(role_stake_balance),
            Some(application_stake_balance),
            human_readable_text
        )
        .unwrap(),
        ()
    );

    let (curator_opening_id, new_curator_application_id) = ensure_applieadoncuratoropening_event_deposited();

    assert!(
        CuratorApplicationById::<Test>::exists(new_curator_application_id)
    );

    // Assert that appropriate application has been added
    let new_curator_application = CuratorApplicationById::<Test>::get(new_curator_application_id);

    let expected_curator_application = CuratorApplication{
        role_account: curator_applicant_role_account,
        curator_opening_id: curator_opening_id,
        member_id: curator_applicant_member_id,
        application_id: expected_curator_application_id,
    };

    assert_eq!(
        expected_curator_application,
        new_curator_application
    );

    // Assert that the opening has had the application added to application list
    let mut singleton = BTreeSet::new(); // Unavoidable mutable, BTreeSet can only be populated this way.
    singleton.insert(new_curator_application_id);

    let new_curator_applications = old_curator_opening.curator_applications.union(&singleton).cloned().collect();

    let expected_curator_opening = CuratorOpening{
        curator_applications: new_curator_applications,
        ..old_curator_opening
    };

    let new_curator_opening = CuratorOpeningById::<Test>::get(curator_opening_id);

    assert_eq!(
        expected_curator_opening,
        new_curator_opening
    );

    (curator_applicant_member_id, new_curator_application_id)
}

pub fn setup_normal_opening() -> CuratorOpeningId<Test>{

    add_member_and_set_as_lead();

    assert_eq!(
        ContentWorkingGroup::add_curator_opening(
            Origin::signed(LEAD_ROLE_ACCOUNT),
            hiring::ActivateOpeningAt::ExactBlock(34),
            get_baseline_opening_policy(),
            generate_valid_length_buffer(&OpeningHumanReadableText::get())
        ).unwrap(),
        ()
    );

    ensure_curatoropeningadded_event_deposited()
}

pub fn setup_normal_accepting_opening() -> CuratorOpeningId<Test>{

    let id = setup_normal_opening();

    assert_eq!(
        ContentWorkingGroup::accept_curator_applications(
            Origin::signed(LEAD_ROLE_ACCOUNT),
            id
            ).unwrap(),
        ()
    );

    id
}

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

// lead_role_account: <Test as system::Trait>::AccountId
pub fn add_curator_opening() -> CuratorOpeningId<Test> {

    let activate_at = hiring::ActivateOpeningAt::ExactBlock(34);

    let human_readable_text = generate_valid_length_buffer(&OpeningHumanReadableText::get());

    assert_eq!(
        ContentWorkingGroup::add_curator_opening(
            Origin::signed(LEAD_ROLE_ACCOUNT),
            activate_at.clone(),
            get_baseline_opening_policy(),
            human_readable_text.clone()
        ).unwrap(),
        ()
    );

    ensure_curatoropeningadded_event_deposited()
}

/*
 * Event readers
 */

fn ensure_terminatecuratorapplication_event_deposited() -> lib::CuratorApplicationId<Test> {

    if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
        if let lib::RawEvent::CuratorApplicationTerminated(ref curator_application_id) = x {
            return curator_application_id.clone()
        } else {
            panic!("Event was not CuratorApplicationTerminated.")
        }
    } else {
        panic!("No event deposited.")
    }
}

fn ensure_begancuratorapplicationreview_event_deposited() -> lib::CuratorOpeningId<Test> {

    if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
        if let lib::RawEvent::BeganCuratorApplicationReview(ref curator_opening_id) = x {
            return curator_opening_id.clone()
        } else {
            panic!("Event was not BeganCuratorApplicationReview.")
        }
    } else {
        panic!("No event deposited.")
    }
}

fn ensure_curatorapplicationwithdrawn_event_deposited() -> lib::CuratorApplicationId<Test> {

    if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
        if let lib::RawEvent::CuratorApplicationWithdrawn(ref curator_application_id) = x {
            return curator_application_id.clone()
        } else {
            panic!("Event was not AppliedOnCuratorOpening.")
        }
    } else {
        panic!("No event deposited.")
    }
}

fn ensure_applieadoncuratoropening_event_deposited() -> (lib::CuratorOpeningId<Test>, lib::CuratorApplicationId<Test>) {

    if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
        if let lib::RawEvent::AppliedOnCuratorOpening(ref curator_opening_id, ref new_curator_application_id) = x {
            return (curator_opening_id.clone(), new_curator_application_id.clone())
        } else {
            panic!("Event was not AppliedOnCuratorOpening.")
        }
    } else {
        panic!("No event deposited.")
    }
}

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