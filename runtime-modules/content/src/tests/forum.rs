#![cfg(test)]

use super::curators;
use super::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};
use sp_runtime::traits::Hash;

// forum
// pub const FORUM_LEAD_ORIGIN: <Test as frame_system::Trait>::AccountId = 0;

// pub const NOT_FORUM_LEAD_ORIGIN: <Test as frame_system::Trait>::AccountId = 111;

// pub const NOT_FORUM_LEAD_2_ORIGIN: <Test as frame_system::Trait>::AccountId = 112;

// pub const NOT_FORUM_MODERATOR_ORIGIN: <Test as frame_system::Trait>::AccountId = 113;

// pub const NOT_FORUM_MEMBER_ORIGIN: <Test as frame_system::Trait>::AccountId = 114;

// pub const INVALID_CATEGORY: <Test as Trait>::CategoryId = 333;

// pub const FORUM_MODERATOR_ORIGIN: <Test as frame_system::Trait>::AccountId = 123;

// pub const FORUM_MODERATOR_2_ORIGIN: <Test as frame_system::Trait>::AccountId = 124;

#[test]
fn verify_create_forum_category_prerequisites() {
    with_default_mock_builder(|| {
        assert_err!(
            Content::create_forum_category(
                Origin::signed(UNKNOWN_ORIGIN),
                None,
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            ),
            Error::<Test>::LeadAuthFailed,
        );
    })
}
