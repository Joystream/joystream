#![cfg(test)]

use crate::tests::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

#[test]
fn issue() {
    with_default_mock_builder(|| {
        // Run to block one to see emitted events
        run_to_block(1);

        // Create simple video using member actor
        let video_id = create_member_video();

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
        let nft_status = Some(OwnedNFT::new(NFTOwner::Member(FIRST_MEMBER_ID), None));
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
