#![cfg(test)]

use super::mock::*;
use crate::sp_api_hidden_includes_decl_storage::hidden_include::traits::Currency;
use crate::*;

#[test]
fn migration_test() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let _ = balances::Module::<Test>::deposit_creating(
            &FIRST_MEMBER_ORIGIN,
            <Test as balances::Trait>::Balance::from(100u32),
        );

        let channel_id = Content::next_channel_id();

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

        let params = VideoCreationParametersRecord {
            assets: Some(StorageAssetsRecord {
                object_creation_list: vec![
                    DataObjectCreationParameters {
                        size: 3,
                        ipfs_content_id: b"first".to_vec(),
                    },
                    DataObjectCreationParameters {
                        size: 3,
                        ipfs_content_id: b"second".to_vec(),
                    },
                    DataObjectCreationParameters {
                        size: 3,
                        ipfs_content_id: b"third".to_vec(),
                    },
                ],
                expected_data_size_fee: storage::DataObjectPerMegabyteFee::<Test>::get(),
            }),
            meta: Some(b"test".to_vec()),
        };

        create_video_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            params.clone(),
            Ok(()),
        );

        // 1 channel & 1 video
        assert_eq!(VideoById::<Test>::iter().count(), 1);
        assert_eq!(ChannelById::<Test>::iter().count(), 1);

        // performing migration
        Content::on_runtime_upgrade();

        // assertions
        run_to_block(10);
        assert_eq!(VideoById::<Test>::iter().count(), 0);
        assert_eq!(ChannelById::<Test>::iter().count(), 0);
    })
}
