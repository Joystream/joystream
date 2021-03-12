#![cfg(test)]

use super::curators;
use super::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn lead_cannot_create_channel() {
    with_default_mock_builder(|| {
        assert_err!(
            Content::create_channel(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                ContentActor::Lead,
                ChannelCreationParameters {
                    assets: vec![],
                    meta: vec![],
                    reward_account: None,
                }
            ),
            Error::<Test>::ActorCannotOwnChannel
        );
    })
}

#[test]
fn curators_can_create_channel() {
    with_default_mock_builder(|| {
        // Curator group doesn't exist yet
        assert_err!(
            Content::create_channel(
                Origin::signed(FIRST_CURATOR_ORIGIN),
                ContentActor::Curator(FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID),
                ChannelCreationParameters {
                    assets: vec![],
                    meta: vec![],
                    reward_account: None,
                }
            ),
            Error::<Test>::CuratorGroupIsNotActive
        );

        let group_id = curators::add_curator_to_new_group(FIRST_CURATOR_ID);
        assert_eq!(FIRST_CURATOR_GROUP_ID, group_id);

        // Curator from wrong group
        assert_err!(
            Content::create_channel(
                Origin::signed(SECOND_CURATOR_ORIGIN),
                ContentActor::Curator(FIRST_CURATOR_GROUP_ID, SECOND_CURATOR_ID),
                ChannelCreationParameters {
                    assets: vec![],
                    meta: vec![],
                    reward_account: None,
                }
            ),
            Error::<Test>::CuratorIsNotAMemberOfGivenCuratorGroup
        );

        // Curator in correct active group, but wrong origin
        assert_err!(
            Content::create_channel(
                Origin::signed(SECOND_CURATOR_ORIGIN),
                ContentActor::Curator(FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID),
                ChannelCreationParameters {
                    assets: vec![],
                    meta: vec![],
                    reward_account: None,
                }
            ),
            Error::<Test>::CuratorAuthFailed
        );

        // Curator in correct active group, with correct origin
        assert_ok!(Content::create_channel(
            Origin::signed(FIRST_CURATOR_ORIGIN),
            ContentActor::Curator(FIRST_CURATOR_GROUP_ID, FIRST_CURATOR_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
            }
        ));
    })
}
#[test]
fn members_can_manage_channels() {
    with_default_mock_builder(|| {
        // Not a member
        assert_err!(
            Content::create_channel(
                Origin::signed(UNKNOWN_ORIGIN),
                ContentActor::Member(MEMBERS_COUNT + 1),
                ChannelCreationParameters {
                    assets: vec![],
                    meta: vec![],
                    reward_account: None,
                }
            ),
            Error::<Test>::MemberAuthFailed
        );

        let channel_id_1 = Content::next_channel_id();

        // Member can create the channel
        assert_ok!(Content::create_channel(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
            }
        ));

        // TODO: assert emitted events...

        let channel_id_2 = Content::next_channel_id();

        // Member can create the channel
        assert_ok!(Content::create_channel(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
            }
        ));

        // TODO: assert emitted events...

        // Update channel
        assert_ok!(Content::update_channel(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id_1,
            ChannelUpdateParameters {
                assets: None,
                new_meta: None,
                reward_account: None,
            }
        ));

        // TODO: assert emitted events...

        // Member cannot update a channel they do not own
        assert_err!(
            Content::update_channel(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                ContentActor::Member(FIRST_MEMBER_ID),
                channel_id_2,
                ChannelUpdateParameters {
                    assets: None,
                    new_meta: None,
                    reward_account: None,
                }
            ),
            Error::<Test>::ActorNotAuthorized
        );

        // TODO: assert emitted events...
    })
}
