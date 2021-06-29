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
                Origin::signed(LEAD_ORIGIN),
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
