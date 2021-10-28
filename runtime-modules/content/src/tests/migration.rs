#![cfg(test)]

use super::mock::*;
use crate::sp_api_hidden_includes_decl_storage::hidden_include::traits::Currency;
use crate::*;
use frame_support::assert_err;

fn helper_test_all_relevant_extrinsics() {
    assert_err!(
        Content::create_video(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            <Test as storage::Trait>::ChannelId::one(),
            params.clone()
        ),
        Error::<Test>::MigrationNotFinished
    );
    assert_err!(
        Content::create_channel(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: None,
                meta: Some(vec![]),
                reward_account: None,
            },
        ),
        Error::<Test>::MigrationNotFinished
    );
    assert_err!(
        Content::update_channel(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            <Test as storage::Trait>::ChannelId::one(),
            ChannelUpdateParametersRecord {
                assets_to_upload: None,
                new_meta: Some(vec![]),
                reward_account: None,
                assets_to_remove: BTreeSet::new(),
            },
        ),
        Error::<Test>::MigrationNotFinished
    );
    assert_err!(
        Content::update_video(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            <Test as Trait>::VideoId::one(),
            VideoUpdateParametersRecord {
                assets_to_upload: None,
                new_meta: Some(vec![]),
                assets_to_remove: BTreeSet::new(),
            },
        ),
        Error::<Test>::MigrationNotFinished
    );
    assert_err!(
        Content::delete_video(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            <Test as Trait>::VideoId::one(),
            BTreeSet::new(),
        ),
        Error::<Test>::MigrationNotFinished
    );
    assert_err!(
        Content::delete_channel(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            <Test as storage::Trait>::ChannelId::one(),
            0u64,
        ),
        Error::<Test>::MigrationNotFinished
    );
    assert_err!(
        Content::update_video_censorship_status(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            <Test as Trait>::VideoId::one(),
            false,
            b"test".to_vec()
        ),
        Error::<Test>::MigrationNotFinished
    );
    assert_err!(
        Content::update_channel_censorship_status(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            <Test as storage::Trait>::ChannelId::one(),
            false,
            b"test".to_vec()
        ),
        Error::<Test>::MigrationNotFinished
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
        assert_eq!(Content::ensure_migration_done(), false,);

        // migration not done yet : test all relevant extrinsics
        helper_test_all_relevant_extrinsics();

        // video migration is finished but channel migration isn't
        run_to_block(6);
        assert_eq!(Content::ensure_migration_done(), false);

        // migration not done yet: test all relevant extrinsics
        helper_test_all_relevant_extrinsics();

        // assert that video map is cleared
        assert_eq!(VideoById::<Test>::iter().count(), 0);

        // channel & video migration finished 10 blocks later
        run_to_block(11);

        // assert that channel map is cleared & migration is done
        assert_eq!(Content::ensure_migration_done(), true);
        assert_eq!(ChannelById::<Test>::iter().count(), 0);
    })
}
