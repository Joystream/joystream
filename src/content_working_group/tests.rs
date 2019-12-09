#![cfg(test)]

use super::genesis;
use super::lib;
use super::mock::{self, *};
use crate::membership;
use srml_support::{StorageLinkedMap, StorageValue};

#[test]
fn create_channel_success() {
    let channel_creator_member_root_account = 12312;
    let channel_creator_member_id = 0; /* HACK, guessing ID, needs better solution */
    let mint_id = 0;

    TestExternalitiesBuilder::default()
        .set_membership_config(
            membership::genesis::GenesisConfigBuilder::default()
                .members([channel_creator_member_root_account].to_vec())
                .build(),
        )
        .set_content_wg_config(
            genesis::GenesisConfigBuilder::<Test>::default()
                .set_mint(mint_id)
                .build(),
        )
        .build()
        .execute_with(|| {
            let role_account = channel_creator_member_root_account;
            let channel_name = "My channel".as_bytes().to_vec();
            let description = "A great channel".as_bytes().to_vec();
            let content = ChannelContentType::Video;
            let publishing_status = ChannelPublishingStatus::NotPublished;

            // Create channel
            ContentWorkingGroup::create_channel(
                Origin::signed(channel_creator_member_root_account),
                channel_creator_member_id,
                role_account,
                channel_name.clone(),
                description.clone(),
                content.clone(),
                publishing_status.clone()
            )
            .expect("Should work");

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
                role_account: role_account,
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

#[test]
fn create_channel_failure() {

}

#[test]
fn transfer_channel_ownership_success() {

}

#[test]
fn transfer_channel_ownership_failure() {

}

#[test]
fn update_channel_as_owner_success() {

}

#[test]
fn update_channel_as_owner_failure() {

}

#[test]
fn update_channel_as_curation_actor_success() {

}

#[test]
fn update_channel_as_curation_actor_failure() {

}

#[test]
fn add_curator_opening_success() {

}

#[test]
fn add_curator_opening_failure() {

}

#[test]
fn accept_curator_applications_success() {

}

#[test]
fn accept_curator_applications_failure() {

}

#[test]
fn begin_curator_applicant_review_success() {

}

#[test]
fn begin_curator_applicant_review_failure() {

}

#[test]
fn fill_curator_opening_success() {

}

#[test]
fn fill_curator_opening_failure() {

}

#[test]
fn withdraw_curator_application_success() {

}

#[test]
fn withdraw_curator_application_failure() {

}

#[test]
fn terminate_curator_application_success() {

}

#[test]
fn terminate_curator_application_failure() {

}

#[test]
fn apply_on_curator_opening_success() {

}

#[test]
fn apply_on_curator_opening_failure() {

}

#[test]
fn update_curator_role_account_success() {

}

#[test]
fn update_curator_role_account_failure() {

}

#[test]
fn update_curator_reward_account_success() {

}

#[test]
fn update_curator_reward_account_failure() {

}

#[test]
fn leave_curator_role_success() {

}

#[test]
fn leave_curator_role_failure() {

}

#[test]
fn terminate_curator_role_success() {

}

#[test]
fn terminate_curator_role_failure() {

}

#[test]
fn set_lead_success() {

}

#[test]
fn set_lead_failure() {

}

#[test]
fn unset_lead_success() {

}

#[test]
fn unset_lead_failure() {

}

#[test]
fn unstaked_success() {

}

#[test]
fn unstaked_failure() {

}

#[test]
fn account_can_act_as_principal_success() {

}

#[test]
fn account_can_act_as_principal_failure() {

}