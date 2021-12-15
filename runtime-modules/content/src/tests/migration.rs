#![cfg(test)]

use super::mock::*;
use crate::sp_api_hidden_includes_decl_storage::hidden_include::traits::Currency;
use crate::*;
use std::ops::Rem;

fn assert_video_and_channel_existrinsics_with(result: DispatchResult) {
    let params = VideoCreationParametersRecord {
        assets: None,
        meta: None,
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
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: None,
                meta: Some(vec![]),
                reward_account: None,
                collaborators: BTreeSet::new(),
            },
        ),
        result
    );

    assert_eq!(
        Content::create_video(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id.clone(),
            params.clone()
        ),
        result
    );
    assert_eq!(
        Content::update_channel(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
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
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id.clone(),
            VideoUpdateParametersRecord {
                assets_to_upload: None,
                new_meta: Some(vec![]),
                assets_to_remove: BTreeSet::new(),
            },
        ),
        result
    );

    assert_eq!(
        Content::update_channel_censorship_status(
            Origin::signed(LEAD_ORIGIN),
            ContentActor::Lead,
            channel_id.clone(),
            true,
            b"test".to_vec()
        ),
        result
    );

    assert_eq!(
        Content::update_video_censorship_status(
            Origin::signed(LEAD_ORIGIN),
            ContentActor::Lead,
            video_id.clone(),
            true,
            b"test".to_vec()
        ),
        result
    );

    assert_eq!(
        Content::delete_video(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id.clone(),
            BTreeSet::new(),
        ),
        result
    );
    assert_eq!(
        Content::delete_channel(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id.clone(),
            0u64,
        ),
        result
    );
}

fn setup_scenario_with(n_videos: u64, n_channels: u64) -> (u64, u64) {
    let _ = balances::Module::<Test>::deposit_creating(
        &FIRST_MEMBER_ORIGIN,
        <Test as balances::Trait>::Balance::from(10_000u32),
    );

    // create n_channels channels
    for _ in 0..n_channels {
        create_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: None,
                meta: Some(vec![]),
                reward_account: None,
                collaborators: BTreeSet::new(),
            },
            Ok(()),
        );
    }

    let params = VideoCreationParametersRecord {
        assets: None,
        meta: None,
    };

    // create n_videos videos
    for i in 0..n_videos {
        create_video_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            i.rem(n_channels) + 1,
            params.clone(),
            Ok(()),
        );
    }

    // assert that the specified channels have been created
    assert_eq!(VideoById::<Test>::iter().count() as u64, n_videos);
    assert_eq!(ChannelById::<Test>::iter().count() as u64, n_channels);

    let channels_migrations_per_block = <Test as Trait>::ChannelsMigrationsEachBlock::get();
    let videos_migrations_per_block = <Test as Trait>::VideosMigrationsEachBlock::get();

    // return the number of blocks required for migration
    let divide_with_ceiling =
        |x: u64, y: u64| (x / y) + ((x.checked_rem(y).unwrap_or_default() > 0u64) as u64);
    (
        divide_with_ceiling(n_channels, channels_migrations_per_block),
        divide_with_ceiling(n_videos, videos_migrations_per_block),
    )
}

#[test]
fn migration_test() {
    with_default_mock_builder(|| {
        const START_MIGRATION_AT_BLOCK: u64 = 1;
        run_to_block(START_MIGRATION_AT_BLOCK);

        // setup scenario
        let (blocks_channels, blocks_videos) = setup_scenario_with(100u64, 100u64);

        // block at which all migrations should be completed
        let last_migration_block = std::cmp::max(blocks_channels, blocks_videos);

        // ensure we have setup scenario to properly test migration over multiple blocks
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
