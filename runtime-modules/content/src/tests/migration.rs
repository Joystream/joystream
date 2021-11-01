#![cfg(test)]

use super::mock::*;
use crate::sp_api_hidden_includes_decl_storage::hidden_include::traits::Currency;
use crate::*;
//use frame_support::assert_err;

fn assert_video_and_channel_existrinsics_with(result: DispatchResult) {
    let params = VideoCreationParametersRecord {
        assets: None,
        meta: None,
    };

    let channel_id = if result.is_ok() {
        Content::next_channel_id()
    } else {
        <Test as storage::Trait>::ChannelId::one()
    };

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
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id.clone(),
            false,
            b"test".to_vec()
        ),
        result
    );

    assert_eq!(
        Content::update_video_censorship_status(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id.clone(),
            false,
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

#[test]
fn migration_test() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let _ = balances::Module::<Test>::deposit_creating(
            &FIRST_MEMBER_ORIGIN,
            <Test as balances::Trait>::Balance::from(10_000u32),
        );

        // create 100 channels
        for _ in 1..101 {
            create_channel_mock(
                FIRST_MEMBER_ORIGIN,
                ContentActor::Member(FIRST_MEMBER_ID),
                ChannelCreationParametersRecord {
                    assets: None,
                    meta: Some(vec![]),
                    reward_account: None,
                },
                Ok(()),
            );
        }

        let params = VideoCreationParametersRecord {
            assets: None,
            meta: None,
        };

        // create 100 videos
        for channel_id in 1..101 {
            create_video_mock(
                FIRST_MEMBER_ORIGIN,
                ContentActor::Member(FIRST_MEMBER_ID),
                channel_id,
                params.clone(),
                Ok(()),
            );
        }

        // 1 channel & 100 video
        assert_eq!(VideoById::<Test>::iter().count(), 100);
        assert_eq!(ChannelById::<Test>::iter().count(), 100);

        // triggering migration
        Content::on_runtime_upgrade();

        // only 20 videos & 10 channels migrated so far
        run_to_block(2);
        assert!(!Content::is_migration_done());

        // migration not done yet : test all relevant extrinsics
        assert_video_and_channel_existrinsics_with(Err(Error::<Test>::MigrationNotFinished.into()));

        // video migration is finished but channel migration isn't
        run_to_block(6);
        assert!(!Content::is_migration_done());

        // migration not done yet: test all relevant extrinsics
        assert_video_and_channel_existrinsics_with(Err(Error::<Test>::MigrationNotFinished.into()));

        // assert that video map is cleared
        assert_eq!(VideoById::<Test>::iter().count(), 0);

        // channel & video migration finished 10 blocks later
        run_to_block(11);

        // assert that channel map is cleared & migration is done
        assert!(Content::is_migration_done());
        assert_eq!(ChannelById::<Test>::iter().count(), 0);

        // video and channel extr. now succeed
        assert_video_and_channel_existrinsics_with(Ok(()));
    })
}
