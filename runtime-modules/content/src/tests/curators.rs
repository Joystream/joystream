#![cfg(test)]

use std::collections::BTreeMap;
use std::iter::FromIterator;

use super::fixtures::*;
use super::mock::{CuratorGroupId, CuratorId, *};
use crate::*;
use frame_support::{assert_err, assert_ok};

pub fn create_curator_group(permissions: ModerationPermissionsByLevel<Test>) -> CuratorGroupId {
    let curator_group_id = Content::next_curator_group_id();
    // create new group and add curator id to it
    CreateCuratorGroupFixture::default()
        .with_is_active(true)
        .with_permissions(&permissions)
        .call_and_assert(Ok(()));
    curator_group_id
}

pub fn add_curator_to_new_group(curator_id: CuratorId) -> CuratorGroupId {
    let curator_group_id = create_curator_group(BTreeMap::new());
    assert_ok!(Content::add_curator_to_group(
        Origin::signed(LEAD_ACCOUNT_ID),
        curator_group_id,
        curator_id
    ));
    curator_group_id
}

pub fn add_curator_to_new_group_with_permissions(
    curator_id: CuratorId,
    permissions: ModerationPermissionsByLevel<Test>,
) -> CuratorGroupId {
    let curator_group_id = create_curator_group(permissions);
    assert_ok!(Content::add_curator_to_group(
        Origin::signed(LEAD_ACCOUNT_ID),
        curator_group_id,
        curator_id
    ));
    curator_group_id
}

#[test]
fn curator_group_management() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let curator_group_id = CreateCuratorGroupFixture::default()
            .call_and_assert(Ok(()))
            .unwrap();

        // Activate group
        assert_ok!(Content::set_curator_group_status(
            Origin::signed(LEAD_ACCOUNT_ID),
            curator_group_id,
            true
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::CuratorGroupStatusSet(curator_group_id, true))
        );

        let group = Content::curator_group_by_id(curator_group_id);
        assert_eq!(group.is_active(), true);

        // Group permissions
        let permissions = BTreeMap::from_iter(vec![
            (
                0,
                BTreeSet::from_iter(vec![
                    ContentModerationAction::HideVideo,
                    ContentModerationAction::DeleteVideo,
                ]),
            ),
            (
                1,
                BTreeSet::from_iter(vec![
                    ContentModerationAction::HideChannel,
                    ContentModerationAction::ChangeChannelFeatureStatus(
                        ChannelFeature::VideoCreation,
                    ),
                    ContentModerationAction::ChangeChannelFeatureStatus(
                        ChannelFeature::VideoUpdate,
                    ),
                    ContentModerationAction::ChangeChannelFeatureStatus(
                        ChannelFeature::ChannelUpdate,
                    ),
                ]),
            ),
            (
                2,
                BTreeSet::from_iter(vec![
                    ContentModerationAction::DeleteVideo,
                    ContentModerationAction::DeleteChannel,
                    ContentModerationAction::HideChannel,
                    ContentModerationAction::HideVideo,
                    ContentModerationAction::ChangeChannelFeatureStatus(
                        ChannelFeature::ChannelFundsTransfer,
                    ),
                    ContentModerationAction::ChangeChannelFeatureStatus(
                        ChannelFeature::CreatorCashout,
                    ),
                    ContentModerationAction::ChangeChannelFeatureStatus(
                        ChannelFeature::CreatorTokenIssuance,
                    ),
                    ContentModerationAction::ChangeChannelFeatureStatus(
                        ChannelFeature::ChannelUpdate,
                    ),
                    ContentModerationAction::ChangeChannelFeatureStatus(
                        ChannelFeature::VideoCreation,
                    ),
                    ContentModerationAction::ChangeChannelFeatureStatus(
                        ChannelFeature::VideoNftIssuance,
                    ),
                    ContentModerationAction::ChangeChannelFeatureStatus(
                        ChannelFeature::VideoUpdate,
                    ),
                ]),
            ),
        ]);

        // Update group permissions
        assert_ok!(Content::update_curator_group_permissions(
            Origin::signed(LEAD_ACCOUNT_ID),
            curator_group_id,
            permissions.clone()
        ));

        // Check CuratorGroupPermissionsUpdated event
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::CuratorGroupPermissionsUpdated(
                curator_group_id,
                permissions.clone()
            ))
        );

        // Validate permissions
        let group = Content::curator_group_by_id(curator_group_id);
        assert_eq!(group.get_permissions_by_level().len(), 3);
        // Iterate over privilege levels from 0 to 3
        // (3 will be a "non-existent map entry" case)
        for i in 0u8..4u8 {
            let allowed_actions: Vec<ContentModerationAction>;
            let permissions_for_level = permissions.get(&i);
            if let Some(permissions_for_level) = permissions_for_level {
                allowed_actions = Vec::from_iter(permissions_for_level.iter().map(|p| p.clone()));
            } else {
                allowed_actions = vec![]
            }
            assert_group_has_permissions_for_actions(&group, i, &allowed_actions);
        }

        // Cannot add non curators into group
        assert_err!(
            Content::add_curator_to_group(
                Origin::signed(LEAD_ACCOUNT_ID),
                curator_group_id,
                DEFAULT_CURATOR_ID + 1 // not a curator
            ),
            Error::<Test>::CuratorIdInvalid
        );

        // Add curator to group
        assert_ok!(Content::add_curator_to_group(
            Origin::signed(LEAD_ACCOUNT_ID),
            curator_group_id,
            DEFAULT_CURATOR_ID
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::CuratorAdded(curator_group_id, DEFAULT_CURATOR_ID))
        );

        // Ensure curator is in group
        let group = Content::curator_group_by_id(curator_group_id);
        assert!(group.has_curator(&DEFAULT_CURATOR_ID));

        // Cannot add same curator again
        assert_err!(
            Content::add_curator_to_group(
                Origin::signed(LEAD_ACCOUNT_ID),
                curator_group_id,
                DEFAULT_CURATOR_ID
            ),
            Error::<Test>::CuratorIsAlreadyAMemberOfGivenCuratorGroup
        );

        // Cannot remove curator if not in group
        assert_err!(
            Content::remove_curator_from_group(
                Origin::signed(LEAD_ACCOUNT_ID),
                curator_group_id,
                MEMBERS_COUNT + 1 // not a curator
            ),
            Error::<Test>::CuratorIsNotAMemberOfGivenCuratorGroup
        );

        // Remove curator from group
        assert_ok!(Content::remove_curator_from_group(
            Origin::signed(LEAD_ACCOUNT_ID),
            curator_group_id,
            DEFAULT_CURATOR_ID
        ));

        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::CuratorRemoved(
                curator_group_id,
                DEFAULT_CURATOR_ID
            ))
        );

        let group = Content::curator_group_by_id(curator_group_id);
        assert!(!group.has_curator(&DEFAULT_CURATOR_ID));

        // Already removed cannot remove again
        assert_err!(
            Content::remove_curator_from_group(
                Origin::signed(LEAD_ACCOUNT_ID),
                curator_group_id,
                DEFAULT_CURATOR_ID
            ),
            Error::<Test>::CuratorIsNotAMemberOfGivenCuratorGroup
        );
    })
}

#[test]
fn unsuccessful_curator_group_creation_with_max_permissions_by_level_map_size_exceeded() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        // Group permissions
        let mut permissions = ModerationPermissionsByLevel::<Test>::new();
        for i in 0..(<Test as Trait>::MaxKeysPerCuratorGroupPermissionsByLevelMap::get() + 1) {
            permissions.insert(i, BTreeSet::new());
        }

        CreateCuratorGroupFixture::default()
            .with_permissions(&permissions)
            .call_and_assert(Err(
                Error::<Test>::CuratorGroupMaxPermissionsByLevelMapSizeExceeded.into(),
            ));
    })
}

#[test]
fn unsuccessful_curator_group_permissions_update_with_max_permissions_by_level_map_size_exceeded() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        let group_id = CreateCuratorGroupFixture::default()
            .call_and_assert(Ok(()))
            .unwrap();

        // Group permissions
        let mut permissions = ModerationPermissionsByLevel::<Test>::new();
        for i in 0..(<Test as Trait>::MaxKeysPerCuratorGroupPermissionsByLevelMap::get() + 1) {
            permissions.insert(i, BTreeSet::new());
        }

        // Update group permissions
        assert_eq!(
            Content::update_curator_group_permissions(
                Origin::signed(LEAD_ACCOUNT_ID),
                group_id,
                permissions
            ),
            Err(Error::<Test>::CuratorGroupMaxPermissionsByLevelMapSizeExceeded.into())
        );
    })
}
