#![cfg(test)]

use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn issue() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        // deposit initial balance
        let _ = balances::Module::<Test>::deposit_creating(
            &FIRST_MEMBER_ORIGIN,
            <Test as balances::Trait>::Balance::from(100u32),
        );

        let channel_id = NextChannelId::<Test>::get();

        create_channel_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            ChannelCreationParametersRecord {
                assets: NewAssets::<Test>::Urls(vec![]),
                meta: vec![],
                reward_account: None,
            },
            Ok(()),
        );

        let params = get_video_creation_parameters();

        let video_id = NextVideoId::<Test>::get();

        // Create simple video using member actor
        create_video_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            params,
            Ok(()),
        );

        // Video does not have an nft
        assert_eq!(None, Content::video_by_id(video_id).nft_status);

        // Runtime tested state before call

        // Events number before tested calls
        let number_of_events_before_call = System::events().len();

        // Issue nft
        assert_ok!(Content::issue_nft(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            None,
            b"metablob".to_vec(),
            None
        ));

        // Runtime tested state after call

        // Ensure nft created succesfully
        let nft_status = Some(OwnedNFT::new(NFTOwner::ChannelOwner, None));
        assert_eq!(nft_status, Content::video_by_id(video_id).nft_status);

        let nft_issued_event = get_test_event(RawEvent::NftIssued(
            ContentActor::Member(FIRST_MEMBER_ID),
            video_id,
            None,
            b"metablob".to_vec(),
            None,
        ));

        // Last event checked
        assert_event(nft_issued_event, number_of_events_before_call + 1);
    })
}
