#![cfg(test)]

use super::mock::*;
use crate::sp_api_hidden_includes_decl_storage::hidden_include::traits::Currency;
use crate::*;

#[test]
fn successful_video_map_clearing() {
    with_default_mock_builder(|| {
        run_to_block(1);

        // deposit initial balance
        let _ = balances::Module::<Test>::deposit_creating(
            &FIRST_MEMBER_ORIGIN,
            <Test as balances::Trait>::Balance::from(100u32),
        );

        // set up 1 channel and two videos (each with no asset)
        let channel_id = NextChannelId::<Test>::get();

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
            assets: None,
            meta: None,
        };

        create_video_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            params.clone(),
            Ok(()),
        );
        create_video_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            params,
            Ok(()),
        );

        Content::on_runtime_upgrade();
        assert_eq!(VideoById::<Test>::iter().next(), None)
    })
}
