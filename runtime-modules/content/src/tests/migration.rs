#![cfg(test)]
use super::fixtures::*;
use super::mock::*;
use crate::*;

fn assert_video_and_channel_existrinsics_with(result: DispatchResult) {
    let params = VideoCreationParametersRecord {
        assets: None,
        meta: None,
        enable_comments: true,
    };

    // attempt to create valid channel if result is ok, otherwise id does not matter
    let channel_id = if result.is_ok() {
        Content::next_channel_id()
    } else {
        <Test as storage::Trait>::ChannelId::one()
    };

    // attempt to create valid video if result is ok, otherwise id does not matter
    let video_id = if result.is_ok() {
        Content::next_video_id()
    } else {
        <Test as Trait>::VideoId::one()
    };

    assert_eq!(
        Content::create_channel(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: None,
                meta: Some(vec![]),
                reward_account: None,
                collaborators: BTreeSet::new(),
                moderator_set: BTreeSet::new(),
            },
        ),
        result
    );

    assert_eq!(
        Content::create_video(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id.clone(),
            params.clone()
        ),
        result
    );
    assert_eq!(
        Content::update_channel(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id.clone(),
            ChannelUpdateParametersRecord {
                assets_to_upload: None,
                new_meta: Some(vec![]),
                reward_account: None,
                assets_to_remove: BTreeSet::new(),
                collaborators: None,
            },
        ),
        result
    );
    assert_eq!(
        Content::update_video(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id.clone(),
            VideoUpdateParametersRecord {
                assets_to_upload: None,
                new_meta: Some(vec![]),
                assets_to_remove: BTreeSet::new(),
                enable_comments: None,
            },
        ),
        result
    );

    assert_eq!(
        Content::update_channel_censorship_status(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id.clone(),
            false,
            b"test".to_vec()
        ),
        result
    );

    assert_eq!(
        Content::update_video_censorship_status(
            Origin::signed(LEAD_ACCOUNT_ID),
            ContentActor::Lead,
            video_id.clone(),
            false,
            b"test".to_vec()
        ),
        result
    );

    assert_eq!(
        Content::delete_video(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            video_id.clone(),
            BTreeSet::new(),
        ),
        result
    );
    assert_eq!(
        Content::delete_channel(
            Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID),
            ContentActor::Member(DEFAULT_MEMBER_ID),
            channel_id.clone(),
            0u64,
        ),
        result
    );
}

#[test]
fn migration_test() {
    with_default_mock_builder(|| {
        run_to_block(START_MIGRATION_AT_BLOCK);

        // setup scenario
        increase_account_balance_helper(DEFAULT_MEMBER_ACCOUNT_ID, INITIAL_BALANCE);
        create_initial_storage_buckets_helper();
        let (blocks_channels, blocks_videos) = create_default_member_owned_channels_with_videos();

        // block at which all migrations should be completed
        let last_migration_block = std::cmp::max(blocks_channels, blocks_videos);

        // ensure we have setup scenario to properly test migration over multiple blocks
        println!("last migration block:\t{:?}", last_migration_block);
        assert!(last_migration_block > START_MIGRATION_AT_BLOCK);

        // triggering migration
        Content::on_runtime_upgrade();

        // migration should have started
        assert!(!Content::is_migration_done());

        // migration is not complete all extrinsics should fail
        assert_video_and_channel_existrinsics_with(Err(Error::<Test>::MigrationNotFinished.into()));

        // make progress with migration but should not be complete yet
        run_to_block(last_migration_block);
        assert!(!Content::is_migration_done());
        assert_video_and_channel_existrinsics_with(Err(Error::<Test>::MigrationNotFinished.into()));

        // run migration to expected completion block
        run_to_block(last_migration_block + 1);

        // assert that maps are cleared & migration is done
        assert!(Content::is_migration_done());
        assert_eq!(VideoById::<Test>::iter().count(), 0);
        assert_eq!(ChannelById::<Test>::iter().count(), 0);

        // video and channel extr. now succeed
        assert_video_and_channel_existrinsics_with(Ok(()));
    })
}
