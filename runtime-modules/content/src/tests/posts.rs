#![cfg(test)]

use super::curators;
use super::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok, traits::Currency};
//use sp_runtime::traits::Hash;

// pub const UNKNOWN_VIDEO_ID: u64 = 7777;
// pub const UNKNOWN_POST_ID: u64 = 7777;
// pub const UNKNOWN_MEMBER_ID: u64 = 7777;
// pub const UNKNOWN_CURATOR_ID: u64 = 7777;
// pub const UNKNOWN_CURATOR_GROUP_ID: u64 = 7777;

// #[derive(Debug, Clone, Copy)]
// struct TestingScenario {
//     member_channel_id: ChannelId,
//     curator_channel_id: ChannelId,
//     member_video_id: <Test as Trait>::VideoId,
//     curator_video_id: <Test as Trait>::VideoId,
//     video_post_id: Option<<Test as Trait>::PostId>,
//     comment_post_id: Option<<Test as Trait>::PostId>,
// }

// fn setup_testing_scenario(
//     member_account: <Test as frame_system::Trait>::AccountId,
//     member_id: MemberId,
//     curator_account: <Test as frame_system::Trait>::AccountId,
//     curator_id: CuratorId,
//     allow_comments: bool,
// ) -> TestingScenario {
//     // scenario A:
//     // - 1 member (FIRST_MEMBER_ID),
//     // - 1 curator group (FIRST_CURATOR_GROUP_ID),
//     // - 2 channels (channel_id.0 & channel_id.1, one for each actor),
//     // - 2 videos (video_id.0 & video_id.1 one for each channel)

//     let member_channel_id = Content::next_channel_id();

//     assert_ok!(Content::create_channel(
//         Origin::signed(member_account),
//         ContentActor::Member(member_id),
//         ChannelCreationParameters::<Test> {
//             assets: vec![],
//             meta: vec![],
//             reward_account: None,
//             moderator_set: None,
//         },
//     ));
//     let curator_channel_id = Content::next_channel_id();

//     let group_id = curators::add_curator_to_new_group(curator_id);
//     assert_eq!(FIRST_CURATOR_GROUP_ID, group_id);

//     assert_ok!(Content::create_channel(
//         Origin::signed(curator_account),
//         ContentActor::Curator(group_id, curator_id),
//         ChannelCreationParameters::<Test> {
//             assets: vec![],
//             meta: vec![],
//             reward_account: None,
//             moderator_set: None,
//         },
//     ));
//     //    println!("curator channel done");

//     let member_video_id = Content::next_video_id();

//     assert_ok!(Content::create_video(
//         Origin::signed(member_account),
//         ContentActor::Member(member_id),
//         member_channel_id,
//         VideoCreationParameters {
//             assets: vec![NewAsset::Urls(vec![b"https://somewhere.com/".to_vec()])],
//             meta: b"metablob".to_vec(),
//             enable_comments: allow_comments,
//         },
//     ));

//     let curator_video_id = Content::next_video_id();

//     assert_ok!(Content::create_video(
//         Origin::signed(curator_account),
//         ContentActor::Curator(group_id, curator_id),
//         curator_channel_id,
//         VideoCreationParameters {
//             assets: vec![NewAsset::Urls(vec![b"https://somewhere.com/".to_vec()])],
//             meta: b"metablob".to_vec(),
//             enable_comments: allow_comments,
//         },
//     ));

//     TestingScenario {
//         member_channel_id,
//         curator_channel_id,
//         member_video_id,
//         curator_video_id,
//         video_post_id: None,
//         comment_post_id: None,
//     }
// }

// // create post test
// #[test]
// fn cannot_create_post_with_nonexistent_video() {
//     with_default_mock_builder(|| {
//         let member_account = FIRST_MEMBER_ORIGIN;
//         let member_id = FIRST_MEMBER_ID;

//         assert_err!(
//             Content::create_post(
//                 Origin::signed(member_account),
//                 ContentActor::Member(member_id),
//                 PostCreationParameters {
//                     video_reference: UNKNOWN_VIDEO_ID,
//                     parent_id: None,
//                     post_type: PostType::VideoPost,
//                 }
//             ),
//             Error::<Test>::VideoDoesNotExist,
//         );
//         assert_err!(
//             Content::create_post(
//                 Origin::signed(member_account),
//                 ContentActor::Member(member_id),
//                 PostCreationParameters {
//                     video_reference: UNKNOWN_VIDEO_ID,
//                     parent_id: None,
//                     post_type: PostType::Comment,
//                 }
//             ),
//             Error::<Test>::VideoDoesNotExist,
//         );
//     })
// }

// #[test]
// fn cannot_create_post_on_a_channel_with_disabled_comment_section() {
//     with_default_mock_builder(|| {
//         let member_account = FIRST_MEMBER_ORIGIN;
//         let member_id = FIRST_MEMBER_ID;
//         let curator_id = FIRST_CURATOR_ID;
//         let curator_account = FIRST_CURATOR_ORIGIN;
//         let allow_comments = false; // disable comments

//         let scenario = setup_testing_scenario(
//             member_account,
//             member_id,
//             curator_account,
//             curator_id,
//             allow_comments,
//         );

//         // non channel owner cannot create post with a video
//         assert_err!(
//             Content::create_post(
//                 Origin::signed(member_id),
//                 ContentActor::Member(member_id),
//                 PostCreationParameters {
//                     video_reference: scenario.member_video_id,
//                     parent_id: None,
//                     post_type: PostType::Comment,
//                 }
//             ),
//             Error::<Test>::CommentsDisabled,
//         );
//     })
// }

// #[test]
// fn cannot_comment_non_existing_video_post() {
//     with_default_mock_builder(|| {
//         let member_account = FIRST_MEMBER_ORIGIN;
//         let member_id = FIRST_MEMBER_ID;
//         let curator_id = FIRST_CURATOR_ID;
//         let curator_account = FIRST_CURATOR_ORIGIN;
//         let allow_comments = true;

//         let scenario = setup_testing_scenario(
//             member_account,
//             member_id,
//             curator_account,
//             curator_id,
//             allow_comments,
//         );

//         assert_err!(
//             Content::create_post(
//                 Origin::signed(member_id),
//                 ContentActor::Member(member_id),
//                 PostCreationParameters {
//                     video_reference: scenario.member_video_id,
//                     parent_id: None,
//                     post_type: PostType::Comment,
//                 }
//             ),
//             Error::<Test>::CannotCommentToNonExistingVideoPost,
//         );
//     })
// }

// #[test]
// fn non_authorized_actor_cannot_create_post() {
//     with_default_mock_builder(|| {
//         let member_account = FIRST_MEMBER_ORIGIN;
//         let member_id = FIRST_MEMBER_ID;
//         let curator_id = FIRST_CURATOR_ID;
//         let curator_account = FIRST_CURATOR_ORIGIN;
//         let allow_comments = true;

//         let scenario = setup_testing_scenario(
//             member_account,
//             member_id,
//             curator_account,
//             curator_id,
//             allow_comments,
//         );

//         // non channel owner cannot create post with a video
//         assert_err!(
//             Content::create_post(
//                 Origin::signed(SECOND_MEMBER_ORIGIN),
//                 ContentActor::Member(SECOND_MEMBER_ID),
//                 PostCreationParameters {
//                     video_reference: scenario.member_video_id,
//                     parent_id: None,
//                     post_type: PostType::VideoPost,
//                 }
//             ),
//             Error::<Test>::ActorNotAuthorized,
//         );

//         assert_err!(
//             Content::create_post(
//                 Origin::signed(SECOND_CURATOR_ORIGIN),
//                 ContentActor::Curator(SECOND_CURATOR_GROUP_ID, SECOND_CURATOR_ID),
//                 PostCreationParameters {
//                     video_reference: scenario.curator_video_id,
//                     parent_id: None,
//                     post_type: PostType::VideoPost,
//                 }
//             ),
//             Error::<Test>::CuratorGroupIsNotActive,
//         );

//         // unknown actor/member cannot create post
//         assert_err!(
//             Content::create_post(
//                 Origin::signed(UNKNOWN_ORIGIN),
//                 ContentActor::Member(UNKNOWN_MEMBER_ID),
//                 PostCreationParameters {
//                     video_reference: scenario.member_video_id,
//                     parent_id: None,
//                     post_type: PostType::VideoPost,
//                 }
//             ),
//             Error::<Test>::MemberAuthFailed,
//         );

//         assert_err!(
//             Content::create_post(
//                 Origin::signed(UNKNOWN_ORIGIN),
//                 ContentActor::Curator(UNKNOWN_CURATOR_GROUP_ID, UNKNOWN_CURATOR_ID),
//                 PostCreationParameters {
//                     video_reference: scenario.curator_video_id,
//                     parent_id: None,
//                     post_type: PostType::VideoPost,
//                 }
//             ),
//             Error::<Test>::CuratorAuthFailed,
//         );
//     })
// }

// #[test]
// fn verify_create_post_effects() {
//     with_default_mock_builder(|| {
//         run_to_block(1);
//         let member_account = FIRST_MEMBER_ORIGIN;
//         let member_id = FIRST_MEMBER_ID;
//         let curator_id = FIRST_CURATOR_ID;
//         let curator_account = FIRST_CURATOR_ORIGIN;
//         let allow_comments = true;

//         let scenario = setup_testing_scenario(
//             member_account,
//             member_id,
//             curator_account,
//             curator_id,
//             allow_comments,
//         );

//         let parent_id = Content::next_post_id();

//         let _ = balances::Module::<Test>::deposit_creating(
//             &member_account,
//             <Test as balances::Trait>::Balance::from(400u64),
//         );

//         let mut balance_pre = balances::Module::<Test>::free_balance(member_account);

//         // create post
//         assert_ok!(Content::create_post(
//             Origin::signed(member_account),
//             ContentActor::Member(member_id),
//             PostCreationParameters {
//                 video_reference: scenario.member_video_id.clone(),
//                 parent_id: None,
//                 post_type: PostType::VideoPost,
//             }
//         ));

//         // video post inserted into the VideoPostIdByVideoId map
//         assert!(VideoPostIdByVideoId::<Test>::contains_key(
//             scenario.member_video_id,
//         ));

//         let mut balance_post = balances::Module::<Test>::free_balance(member_account);

//         // post correctly inserted into the double_map
//         assert!(PostById::<Test>::contains_key(
//             scenario.member_video_id,
//             parent_id
//         ));

//         // verify deposit into post account
//         assert_eq!(
//             PostById::<Test>::get(scenario.member_video_id, parent_id).bloat_bond,
//             balance_pre - balance_post
//         );

//         // post correctly inserted into the double_map
//         assert!(PostById::<Test>::contains_key(
//             scenario.member_video_id,
//             parent_id
//         ));

//         let replies_count_pre =
//             PostById::<Test>::get(scenario.member_video_id, parent_id).replies_count;
//         balance_pre = balances::Module::<Test>::free_balance(member_account);

//         let child_id = Content::next_post_id();

//         assert_eq!(child_id - parent_id, 1);
//         assert_ok!(Content::create_post(
//             Origin::signed(member_account),
//             ContentActor::Member(member_id),
//             PostCreationParameters {
//                 video_reference: scenario.member_video_id,
//                 parent_id: Some(parent_id),
//                 post_type: PostType::Comment,
//             }
//         ));

//         // post correctly inserted into the double_map
//         assert!(PostById::<Test>::contains_key(
//             scenario.member_video_id,
//             child_id
//         ));

//         balance_post = balances::Module::<Test>::free_balance(member_account);
//         let post = PostById::<Test>::get(scenario.member_video_id, parent_id);
//         let replies_count_post = post.replies_count;

//         assert_eq!(replies_count_post - replies_count_pre, 1);

//         // verify deposit into post account
//         assert_eq!(post.bloat_bond, balance_pre - balance_post);
//     })
// }

// fn setup_testing_scenario_with_video_post(
//     member_account: <Test as frame_system::Trait>::AccountId,
//     member_id: MemberId,
//     curator_account: <Test as frame_system::Trait>::AccountId,
//     curator_id: CuratorId,
//     allow_comments: bool,
// ) -> TestingScenario {
//     let mut scenario = setup_testing_scenario(
//         member_account,
//         member_id,
//         curator_account,
//         curator_id,
//         allow_comments,
//     );

//     let parent_id = Content::next_post_id();

//     let _ = balances::Module::<Test>::deposit_creating(
//         &member_account,
//         <Test as balances::Trait>::Balance::from(INITIAL_BALANCE),
//     );

//     println!(
//         "member account balance:\t{:?}",
//         balances::Module::<Test>::free_balance(member_account)
//     );
//     // create post
//     assert_ok!(Content::create_post(
//         Origin::signed(member_account),
//         ContentActor::Member(member_id),
//         PostCreationParameters {
//             video_reference: scenario.member_video_id.clone(),
//             parent_id: None,
//             post_type: PostType::VideoPost,
//         }
//     ));

//     scenario.video_post_id = Some(parent_id);
//     scenario
// }

// fn setup_testing_scenario_with_comment_post(
//     member_account: <Test as frame_system::Trait>::AccountId,
//     member_id: MemberId,
//     curator_account: <Test as frame_system::Trait>::AccountId,
//     curator_id: CuratorId,
//     comment_author_account: <Test as frame_system::Trait>::AccountId,
//     comment_author_id: MemberId,
// ) -> TestingScenario {
//     let mut scenario = setup_testing_scenario_with_video_post(
//         member_account,
//         member_id,
//         curator_account,
//         curator_id,
//         true,
//     );

//     let post_id = Content::next_post_id();

//     let _ = balances::Module::<Test>::deposit_creating(
//         &comment_author_account,
//         <Test as balances::Trait>::Balance::from(INITIAL_BALANCE),
//     );

//     // create post
//     assert_ok!(Content::create_post(
//         Origin::signed(comment_author_account),
//         ContentActor::Member(comment_author_id),
//         PostCreationParameters {
//             video_reference: scenario.member_video_id.clone(),
//             parent_id: scenario.video_post_id,
//             post_type: PostType::Comment,
//         }
//     ));

//     scenario.comment_post_id = Some(post_id);
//     scenario
// }

// fn setup_testing_scenario_with_moderator(
//     member_account: <Test as frame_system::Trait>::AccountId,
//     member_id: MemberId,
//     curator_account: <Test as frame_system::Trait>::AccountId,
//     curator_id: CuratorId,
//     comment_author_account: <Test as frame_system::Trait>::AccountId,
//     comment_author_id: MemberId,
//     moderator_set: BTreeSet<MemberId>,
// ) -> TestingScenario {
//     let scenario = setup_testing_scenario_with_comment_post(
//         member_account,
//         member_id,
//         curator_account,
//         curator_id,
//         comment_author_account,
//         comment_author_id,
//     );

//     // create post
//     assert_ok!(Content::update_moderator_set(
//         Origin::signed(member_account),
//         ContentActor::Member(member_id),
//         moderator_set,
//         scenario.member_channel_id,
//     ));

//     scenario
// }

// #[test]
// fn non_authorized_actor_cannot_delete_post() {
//     with_default_mock_builder(|| {
//         run_to_block(1);

//         let member_account = FIRST_MEMBER_ORIGIN;
//         let member_id = FIRST_MEMBER_ID;
//         let curator_id = FIRST_CURATOR_ID;
//         let curator_account = FIRST_CURATOR_ORIGIN;
//         let comment_author_account = THIRD_MEMBER_ORIGIN;
//         let comment_author_id = THIRD_MEMBER_ID;

//         let scenario = setup_testing_scenario_with_comment_post(
//             member_account,
//             member_id,
//             curator_account,
//             curator_id,
//             comment_author_account,
//             comment_author_id,
//         );

//         let parent_id = scenario.video_post_id.unwrap_or(0);
//         let child_id = scenario.comment_post_id.unwrap_or(0);

//         // deletion parameters
//         let params = PostDeletionParameters {
//             witness: Some(Test::hash_of(
//                 &PostById::<Test>::get(scenario.member_video_id, parent_id).replies_count,
//             )),
//             rationale: None,
//         };

//         assert_err!(
//             Content::delete_post(
//                 Origin::signed(comment_author_account),
//                 parent_id,
//                 scenario.member_video_id,
//                 ContentActor::Member(comment_author_id),
//                 params,
//             ),
//             Error::<Test>::ActorNotAuthorized,
//         );

//         let params = PostDeletionParameters {
//             witness: None,
//             rationale: None,
//         };

//         assert_err!(
//             Content::delete_post(
//                 Origin::signed(UNKNOWN_ORIGIN),
//                 child_id,
//                 scenario.member_video_id,
//                 ContentActor::Member(UNKNOWN_MEMBER_ID),
//                 params,
//             ),
//             Error::<Test>::MemberAuthFailed,
//         );
//     })
// }

// #[test]
// fn cannot_delete_invalid_post() {
//     with_default_mock_builder(|| {
//         let member_account = FIRST_MEMBER_ORIGIN;
//         let member_id = FIRST_MEMBER_ID;
//         let curator_id = FIRST_CURATOR_ID;
//         let curator_account = FIRST_CURATOR_ORIGIN;
//         let comment_author_account = THIRD_MEMBER_ORIGIN;
//         let comment_author_id = THIRD_MEMBER_ID;

//         let scenario = setup_testing_scenario_with_comment_post(
//             member_account,
//             member_id,
//             curator_account,
//             curator_id,
//             comment_author_account,
//             comment_author_id,
//         );

//         let child_id = scenario.comment_post_id.unwrap_or(0);

//         // deletion parameters
//         let params = PostDeletionParameters {
//             witness: None,
//             rationale: None,
//         };

//         assert_err!(
//             Content::delete_post(
//                 Origin::signed(comment_author_account),
//                 child_id,
//                 UNKNOWN_VIDEO_ID,
//                 ContentActor::Member(comment_author_id),
//                 params.clone(),
//             ),
//             Error::<Test>::PostDoesNotExist,
//         );

//         assert_err!(
//             Content::delete_post(
//                 Origin::signed(comment_author_account),
//                 UNKNOWN_POST_ID,
//                 scenario.member_video_id,
//                 ContentActor::Member(comment_author_id),
//                 params,
//             ),
//             Error::<Test>::PostDoesNotExist,
//         );
//     })
// }

// #[test]
// fn verify_delete_post_effects() {
//     with_default_mock_builder(|| {
//         run_to_block(1);

//         let member_account = FIRST_MEMBER_ORIGIN;
//         let member_id = FIRST_MEMBER_ID;
//         let curator_id = FIRST_CURATOR_ID;
//         let curator_account = FIRST_CURATOR_ORIGIN;
//         let comment_author_account = THIRD_MEMBER_ORIGIN;
//         let comment_author_id = THIRD_MEMBER_ID;

//         let scenario = setup_testing_scenario_with_comment_post(
//             member_account,
//             member_id,
//             curator_account,
//             curator_id,
//             comment_author_account,
//             comment_author_id,
//         );

//         let parent_id = scenario.video_post_id.unwrap_or(0);
//         let child_id = scenario.comment_post_id.unwrap_or(0);

//         let replies_count_pre =
//             PostById::<Test>::get(scenario.member_video_id, parent_id).replies_count;
//         let balance_pre = balances::Module::<Test>::free_balance(comment_author_account);

//         let bloat_bond = core::cmp::min(
//             PostById::<Test>::get(scenario.member_video_id, child_id).bloat_bond,
//             <Test as Trait>::BloatBondCap::get().into(),
//         );

//         // deletion parameters
//         let params = PostDeletionParameters {
//             witness: None,
//             rationale: None,
//         };

//         assert_ok!(Content::delete_post(
//             Origin::signed(comment_author_account),
//             scenario.member_video_id,
//             child_id,
//             ContentActor::Member(comment_author_id),
//             params.clone(),
//         ));

//         // post removed
//         assert!(!PostById::<Test>::contains_key(
//             scenario.member_video_id,
//             child_id
//         ));

//         let replies_count_post =
//             PostById::<Test>::get(scenario.member_video_id, parent_id).replies_count;
//         let balance_post = balances::Module::<Test>::free_balance(comment_author_account);

//         // replies count decreased
//         assert_eq!(replies_count_pre - replies_count_post, 1);

//         // refund to post author
//         assert_eq!(balance_post - balance_pre, bloat_bond);

//         // event deposited
//         assert_eq!(
//             System::events().last().unwrap().event,
//             MetaEvent::content(RawEvent::PostDeleted(
//                 ContentActor::Member(comment_author_id),
//                 scenario.comment_post_id.unwrap(),
//                 scenario.member_video_id,
//                 params,
//             ))
//         );
//     })
// }

// #[test]
// fn testing_privileges_for_deletion() {
//     with_default_mock_builder(|| {
//         let member_account = FIRST_MEMBER_ORIGIN;
//         let member_id = FIRST_MEMBER_ID;
//         let curator_id = FIRST_CURATOR_ID;
//         let curator_account = FIRST_CURATOR_ORIGIN;
//         let allow_comments = true;

//         let scenario = setup_testing_scenario_with_video_post(
//             member_account,
//             member_id,
//             curator_account,
//             curator_id,
//             allow_comments,
//         );

//         if let Some(parent_id) = scenario.video_post_id {
//             // deletion parameters
//             let params = PostDeletionParameters {
//                 witness: Some(Test::hash_of(
//                     &PostById::<Test>::get(scenario.member_video_id, parent_id).replies_count,
//                 )),
//                 rationale: None,
//             };
//             assert_err!(
//                 Content::delete_post(
//                     Origin::signed(THIRD_MEMBER_ORIGIN),
//                     parent_id,
//                     scenario.member_video_id,
//                     ContentActor::Member(THIRD_MEMBER_ID),
//                     params.clone(),
//                 ),
//                 Error::<Test>::ActorNotAuthorized,
//             );

//             assert_err!(
//                 Content::delete_post(
//                     Origin::signed(UNKNOWN_ORIGIN),
//                     parent_id,
//                     scenario.member_video_id,
//                     ContentActor::Member(UNKNOWN_MEMBER_ID),
//                     params,
//                 ),
//                 Error::<Test>::MemberAuthFailed,
//             );
//         }
//     })
// }

// #[test]
// fn cannot_delete_post_provding_invalid_witness() {
//     with_default_mock_builder(|| {
//         let member_account = FIRST_MEMBER_ORIGIN;
//         let member_id = FIRST_MEMBER_ID;
//         let curator_id = FIRST_CURATOR_ID;
//         let curator_account = FIRST_CURATOR_ORIGIN;
//         let allow_comments = true;

//         let scenario = setup_testing_scenario_with_video_post(
//             member_account,
//             member_id,
//             curator_account,
//             curator_id,
//             allow_comments,
//         );

//         if let Some(parent_id) = scenario.video_post_id {
//             // deletion parameters
//             let params = PostDeletionParameters {
//                 witness: None,
//                 rationale: None,
//             };

//             assert_err!(
//                 Content::delete_post(
//                     Origin::signed(FIRST_MEMBER_ORIGIN),
//                     parent_id,
//                     scenario.member_video_id,
//                     ContentActor::Member(FIRST_MEMBER_ID),
//                     params,
//                 ),
//                 Error::<Test>::WitnessNotProvided,
//             );

//             let params = PostDeletionParameters {
//                 witness: Some(Test::hash_of(&1u64.encode())),
//                 rationale: None,
//             };
//             assert_err!(
//                 Content::delete_post(
//                     Origin::signed(UNKNOWN_ORIGIN),
//                     parent_id,
//                     scenario.member_video_id,
//                     ContentActor::Member(UNKNOWN_MEMBER_ID),
//                     params,
//                 ),
//                 Error::<Test>::WitnessVerificationFailed,
//             );
//         }
//     })
// }

// #[test]
// fn cannot_edit_invalid_post() {
//     with_default_mock_builder(|| {
//         let member_account = FIRST_MEMBER_ORIGIN;
//         let member_id = FIRST_MEMBER_ID;
//         let curator_id = FIRST_CURATOR_ID;
//         let curator_account = FIRST_CURATOR_ORIGIN;
//         let comment_author_account = THIRD_MEMBER_ORIGIN;
//         let comment_author_id = THIRD_MEMBER_ID;

//         let _scenario = setup_testing_scenario_with_comment_post(
//             member_account,
//             member_id,
//             curator_account,
//             curator_id,
//             comment_author_account,
//             comment_author_id,
//         );

//         assert_err!(
//             Content::edit_post_text(
//                 Origin::signed(comment_author_account),
//                 UNKNOWN_VIDEO_ID,
//                 UNKNOWN_POST_ID,
//                 ContentActor::Member(comment_author_id),
//                 b"efg".to_vec(),
//             ),
//             Error::<Test>::PostDoesNotExist,
//         );
//     })
// }

// #[test]
// fn moderator_cannot_delete_post_with_no_rationale() {
//     with_default_mock_builder(|| {
//         let member_account = FIRST_MEMBER_ORIGIN;
//         let member_id = FIRST_MEMBER_ID;
//         let curator_id = FIRST_CURATOR_ID;
//         let curator_account = FIRST_CURATOR_ORIGIN;
//         let comment_author_account = THIRD_MEMBER_ORIGIN;
//         let comment_author_id = THIRD_MEMBER_ID;

//         let mod_set: BTreeSet<MemberId> = [SECOND_MEMBER_ID].iter().cloned().collect();

//         let scenario = setup_testing_scenario_with_moderator(
//             member_account,
//             member_id,
//             curator_account,
//             curator_id,
//             comment_author_account,
//             comment_author_id,
//             mod_set,
//         );

//         // deletion parameters
//         let params = PostDeletionParameters {
//             witness: None,
//             rationale: None,
//         };

//         assert_err!(
//             Content::delete_post(
//                 Origin::signed(SECOND_MEMBER_ORIGIN),
//                 scenario.member_video_id,
//                 scenario.comment_post_id.unwrap_or(0),
//                 ContentActor::Member(SECOND_MEMBER_ID),
//                 params,
//             ),
//             Error::<Test>::RationaleNotProvidedByModerator,
//         );

//         // deletion parameters
//         let correct_params = PostDeletionParameters {
//             witness: None,
//             rationale: Some(b"test".to_vec()),
//         };

//         // testing succesful deletion providing rationale
//         assert_ok!(Content::delete_post(
//             Origin::signed(SECOND_MEMBER_ORIGIN),
//             scenario.member_video_id,
//             scenario.comment_post_id.unwrap_or(0),
//             ContentActor::Member(SECOND_MEMBER_ID),
//             correct_params,
//         ));
//     })
// }

// #[test]
// fn non_authorized_actor_cannot_edit() {
//     with_default_mock_builder(|| {
//         let member_account = FIRST_MEMBER_ORIGIN;
//         let member_id = FIRST_MEMBER_ID;
//         let curator_id = FIRST_CURATOR_ID;
//         let curator_account = FIRST_CURATOR_ORIGIN;
//         let comment_author_account = THIRD_MEMBER_ORIGIN;
//         let comment_author_id = THIRD_MEMBER_ID;

//         let scenario = setup_testing_scenario_with_comment_post(
//             member_account,
//             member_id,
//             curator_account,
//             curator_id,
//             comment_author_account,
//             comment_author_id,
//         );
//         assert_err!(
//             Content::edit_post_text(
//                 Origin::signed(UNKNOWN_ORIGIN),
//                 scenario.member_video_id,
//                 scenario.comment_post_id.unwrap(),
//                 ContentActor::Member(UNKNOWN_MEMBER_ID),
//                 b"efg".to_vec(),
//             ),
//             Error::<Test>::MemberAuthFailed,
//         );

//         // valid member but neither one of Author, Channel Owner
//         assert_err!(
//             Content::edit_post_text(
//                 Origin::signed(THIRD_MEMBER_ORIGIN),
//                 scenario.member_video_id,
//                 scenario.video_post_id.unwrap(),
//                 ContentActor::Member(THIRD_MEMBER_ID),
//                 b"efg".to_vec(),
//             ),
//             Error::<Test>::ActorNotAuthorized,
//         );
//     })
// }

// #[test]
// fn verify_edit_post_effects() {
//     with_default_mock_builder(|| {
//         // in order to deposit event
//         run_to_block(1);

//         let member_account = FIRST_MEMBER_ORIGIN;
//         let member_id = FIRST_MEMBER_ID;
//         let curator_id = FIRST_CURATOR_ID;
//         let curator_account = FIRST_CURATOR_ORIGIN;
//         let comment_author_account = THIRD_MEMBER_ORIGIN;
//         let comment_author_id = THIRD_MEMBER_ID;

//         let scenario = setup_testing_scenario_with_comment_post(
//             member_account,
//             member_id,
//             curator_account,
//             curator_id,
//             comment_author_account,
//             comment_author_id,
//         );

//         assert_ok!(Content::edit_post_text(
//             Origin::signed(comment_author_account),
//             scenario.member_video_id,
//             scenario.comment_post_id.unwrap(),
//             ContentActor::Member(comment_author_id),
//             b"efghilm".to_vec(),
//         ));

//         assert_eq!(
//             System::events().last().unwrap().event,
//             MetaEvent::content(RawEvent::PostTextUpdated(
//                 ContentActor::Member(comment_author_id),
//                 b"efghilm".to_vec(),
//                 scenario.comment_post_id.unwrap(),
//                 scenario.member_video_id,
//             ))
//         );
//     })
// }

// // // Edit post tests
// // fn setup_testing_scenario_with_post() -> (
// //     <tests::mock::Test as Trait>::PostId,
// //     <tests::mock::Test as Trait>::VideoId,
// // ) {
// //     // scenario B: previous scenario + one post made by FIRST_MEMBER_ID

// //     let (member_video_id, _curator_video_id) = setup_testing_scenario();
// //     let post_id = Content::next_post_id();

// //     assert_ok!(Content::create_post(
// //         Origin::signed(FIRST_MEMBER_ORIGIN),
// //         <tests::mock::Test as Trait>::VideoId::from(member_video_id),
// //         ContentActor::Member(FIRST_MEMBER_ID),
// //     ));

// //     assert_eq!(Content::next_post_id(), 1);

// //     (post_id, member_video_id)
// // }

// // #[test]
// // fn verify_create_post_effects() {
// //     with_default_mock_builder(|| {
// //         run_to_block(1);

// //         let (post_id, member_video_id) = setup_testing_scenario_with_post();

// //         // the actual post that should be created
// //         let post: Post<Test> = Post_ {
// //             author: ChannelOwner::Member(FIRST_MEMBER_ID),
// //             cleanup_pay_off: BalanceOf::<Test>::zero(),
// //             replies_count: <Test as Trait>::ReplyId::zero(),
// //             last_edited: frame_system::Module::<Test>::block_number(),
// //             video: member_video_id,
// //         };

// //         // next post increased by one
// //         let new_post_id = Content::next_post_id();

// //         // Effects:
// //         // Content::NextPostId increased by 1
// //         assert_eq!(new_post_id - post_id, 1);

// //         // Post is added to the storage
// //         assert_eq!(Content::post_by_id(post_id), post);

// //         // Event::<Test>::PostCreated is deposited
// //         assert_eq!(
// //             System::events().last().unwrap().event,
// //             MetaEvent::content(RawEvent::PostCreated(
// //                 ContentActor::Member(FIRST_MEMBER_ID),
// //                 member_video_id,
// //                 post_id
// //             ))
// //         );
// //     })
// // }

// // #[test]
// // fn non_authorized_actor_cannot_edit_post() {
// //     with_default_mock_builder(|| {
// //         let (post_id, member_video_id) = setup_testing_scenario_with_post();

// //         // non owner cannot edit post
// //         assert_err!(
// //             Content::edit_post(
// //                 Origin::signed(SECOND_MEMBER_ORIGIN),
// //                 post_id,
// //                 <tests::mock::Test as Trait>::VideoId::from(member_video_id + 1),
// //                 ContentActor::Member(SECOND_MEMBER_ID),
// //             ),
// //             Error::<Test>::ActorNotAuthorized,
// //         );

// //         // unknown member/actor cannot edit posts
// //         assert_err!(
// //             Content::edit_post(
// //                 Origin::signed(UNKNOWN_ORIGIN),
// //                 post_id,
// //                 <tests::mock::Test as Trait>::VideoId::from(member_video_id + 1),
// //                 ContentActor::Member(UNKNOWN_MEMBER_ID),
// //             ),
// //             Error::<Test>::MemberAuthFailed,
// //         );
// //     })
// // }

// // #[test]
// // fn cannot_edit_nonexistent_post() {
// //     with_default_mock_builder(|| {
// //         let (_post_id, member_video_id) = setup_testing_scenario_with_post();

// //         assert_err!(
// //             Content::edit_post(
// //                 Origin::signed(FIRST_MEMBER_ORIGIN),
// //                 UNKNOWN_POST_ID,
// //                 <tests::mock::Test as Trait>::VideoId::from(member_video_id + 1),
// //                 ContentActor::Member(FIRST_MEMBER_ID),
// //             ),
// //             Error::<Test>::PostDoesNotExist,
// //         );
// //     })
// // }

// // #[test]
// // fn verify_edit_post_effects() {
// //     with_default_mock_builder(|| {
// //         run_to_block(1);

// //         let (post_id, member_video_id) = setup_testing_scenario_with_post();

// //         assert_ok!(Content::edit_post(
// //             Origin::signed(FIRST_MEMBER_ORIGIN),
// //             post_id,
// //             <tests::mock::Test as Trait>::VideoId::from(member_video_id + 1),
// //             ContentActor::Member(FIRST_MEMBER_ID)
// //         ));

// //         // post video is updated
// //         assert_eq!(Content::post_by_id(post_id).video, member_video_id + 1);

// //         // event is deposited
// //         assert_eq!(
// //             System::events().last().unwrap().event,
// //             MetaEvent::content(RawEvent::PostModified(
// //                 ContentActor::Member(FIRST_MEMBER_ID),
// //                 member_video_id + 1,
// //                 post_id,
// //             ))
// //         );
// //     })
// // }

// // // delete post tests
// // #[test]
// // fn cannot_delete_nonexistent_post() {
// //     with_default_mock_builder(|| {
// //         let (_post_id, _member_video_id) = setup_testing_scenario_with_post();
// //         assert_err!(
// //             Content::delete_post(
// //                 Origin::signed(FIRST_MEMBER_ORIGIN),
// //                 UNKNOWN_POST_ID,
// //                 ContentActor::Member(FIRST_MEMBER_ID),
// //             ),
// //             Error::<Test>::PostDoesNotExist,
// //         );
// //     })
// // }

// // #[test]
// // fn non_authorized_actor_cannot_delete_post() {
// //     with_default_mock_builder(|| {
// //         let (post_id, _member_video_id) = setup_testing_scenario_with_post();

// //         // non authorized member
// //         assert_err!(
// //             Content::delete_post(
// //                 Origin::signed(SECOND_MEMBER_ORIGIN),
// //                 post_id,
// //                 ContentActor::Member(SECOND_MEMBER_ID),
// //             ),
// //             Error::<Test>::ActorNotAuthorized,
// //         );

// //         // nonexistent member
// //         assert_err!(
// //             Content::delete_post(
// //                 Origin::signed(UNKNOWN_ORIGIN),
// //                 post_id,
// //                 ContentActor::Member(UNKNOWN_MEMBER_ID),
// //             ),
// //             Error::<Test>::MemberAuthFailed,
// //         );
// //     })
// // }

// // #[test]
// // fn verify_delete_post_effects() {
// //     with_default_mock_builder(|| {
// //         run_to_block(1);

// //         let (post_id, _member_video_id) = setup_testing_scenario_with_post();

// //         assert_ok!(Content::delete_post(
// //             Origin::signed(FIRST_MEMBER_ORIGIN),
// //             post_id,
// //             ContentActor::Member(FIRST_MEMBER_ID)
// //         ));

// //         // event is deposited
// //         assert_eq!(
// //             System::events().last().unwrap().event,
// //             MetaEvent::content(RawEvent::PostDeleted(
// //                 ContentActor::Member(FIRST_MEMBER_ID),
// //                 post_id
// //             ))
// //         );
// //     })
// // }

// // // create reply tests

// // #[test]
// // fn nonexistent_member_cannot_reply() {
// //     with_default_mock_builder(|| {
// //         let (post_id, _member_video_id) = setup_testing_scenario_with_post();

// //         assert_err!(
// //             Content::create_reply(
// //                 Origin::signed(FIRST_MEMBER_ORIGIN),
// //                 <tests::mock::Test as MembershipTypes>::MemberId::from(UNKNOWN_MEMBER_ID),
// //                 post_id,
// //                 None,
// //             ),
// //             Error::<Test>::MemberAuthFailed,
// //         );
// //     })
// // }

// // #[test]
// // fn cannot_reply_to_nonexistent_post_or_reply() {
// //     with_default_mock_builder(|| {
// //         let (post_id, _member_video_id) = setup_testing_scenario_with_post();

// //         assert_err!(
// //             Content::create_reply(
// //                 Origin::signed(FIRST_MEMBER_ORIGIN),
// //                 <tests::mock::Test as MembershipTypes>::MemberId::from(FIRST_MEMBER_ID),
// //                 <tests::mock::Test as Trait>::PostId::from(UNKNOWN_POST_ID),
// //                 None,
// //             ),
// //             Error::<Test>::PostDoesNotExist,
// //         );

// //         assert_err!(
// //             Content::create_reply(
// //                 Origin::signed(FIRST_MEMBER_ORIGIN),
// //                 <tests::mock::Test as MembershipTypes>::MemberId::from(FIRST_MEMBER_ID),
// //                 <tests::mock::Test as Trait>::PostId::from(post_id),
// //                 Some(<tests::mock::Test as Trait>::ReplyId::from(
// //                     UNKNOWN_REPLY_ID
// //                 )),
// //             ),
// //             Error::<Test>::ReplyDoesNotExist,
// //         );
// //     })
// // }

// // fn setup_testing_scenario_with_replies() -> (
// //     <tests::mock::Test as Trait>::ReplyId,
// //     <tests::mock::Test as Trait>::PostId,
// // ) {
// //     // scenario C : scenario B + reply (reply.1) to the post by FIRST_MEMBER_ID and reply to reply.1
// //     // by FIRST_MEMBER_ID
// //     let (post_id, _member_video_id) = setup_testing_scenario_with_post();

// //     assert_ok!(Content::create_reply(
// //         Origin::signed(FIRST_MEMBER_ORIGIN),
// //         <tests::mock::Test as MembershipTypes>::MemberId::from(FIRST_MEMBER_ID),
// //         post_id,
// //         None,
// //     ));

// //     let reply_id = Content::post_by_id(post_id).replies_count;

// //     assert_ok!(Content::create_reply(
// //         Origin::signed(FIRST_MEMBER_ORIGIN),
// //         <tests::mock::Test as MembershipTypes>::MemberId::from(FIRST_MEMBER_ID),
// //         post_id,
// //         Some(reply_id),
// //     ));
// //     (reply_id, post_id)
// // }

// // #[test]
// // fn verify_create_reply_effects() {
// //     with_default_mock_builder(|| {
// //         run_to_block(1);

// //         let (reply_id, post_id) = setup_testing_scenario_with_replies();

// //         // replies count increased
// //         assert_eq!(Content::post_by_id(post_id).replies_count - reply_id, 1);

// //         // event deposited
// //         assert_eq!(
// //             System::events().last().unwrap().event,
// //             MetaEvent::content(RawEvent::ReplyCreated(
// //                 <tests::mock::Test as MembershipTypes>::MemberId::from(FIRST_MEMBER_ID),
// //                 post_id,
// //                 Content::post_by_id(post_id).replies_count,
// //             ))
// //         );
// //     })
// // }

// // // edit_reply
// // #[test]
// // fn cannot_edit_nonexistent_reply() {
// //     with_default_mock_builder(|| {
// //         let (reply_id, post_id) = setup_testing_scenario_with_replies();

// //         // reply to an nonexistent reply
// //         assert_err!(
// //             Content::edit_reply(
// //                 Origin::signed(FIRST_MEMBER_ORIGIN),
// //                 <tests::mock::Test as MembershipTypes>::MemberId::from(FIRST_MEMBER_ID),
// //                 post_id,
// //                 <tests::mock::Test as Trait>::ReplyId::from(UNKNOWN_REPLY_ID),
// //             ),
// //             Error::<Test>::ReplyDoesNotExist,
// //         );

// //         // reply to a nonexistent post
// //         assert_err!(
// //             Content::edit_reply(
// //                 Origin::signed(FIRST_MEMBER_ORIGIN),
// //                 <tests::mock::Test as MembershipTypes>::MemberId::from(FIRST_MEMBER_ID),
// //                 <tests::mock::Test as Trait>::PostId::from(UNKNOWN_POST_ID),
// //                 reply_id,
// //             ),
// //             Error::<Test>::ReplyDoesNotExist,
// //         );
// //     })
// // }

// // #[test]
// // fn non_authorized_member_cannot_edit_reply() {
// //     with_default_mock_builder(|| {
// //         run_to_block(1);

// //         let (reply_id, post_id) = setup_testing_scenario_with_replies();

// //         // non owner cannot edit reply
// //         assert_err!(
// //             Content::edit_reply(
// //                 Origin::signed(FIRST_MEMBER_ORIGIN),
// //                 <tests::mock::Test as MembershipTypes>::MemberId::from(SECOND_MEMBER_ID),
// //                 post_id,
// //                 reply_id,
// //             ),
// //             Error::<Test>::MemberAuthFailed,
// //         );

// //         // non existing member cannot edit reply
// //         assert_err!(
// //             Content::edit_reply(
// //                 Origin::signed(FIRST_MEMBER_ORIGIN),
// //                 <tests::mock::Test as MembershipTypes>::MemberId::from(UNKNOWN_MEMBER_ID),
// //                 post_id,
// //                 reply_id,
// //             ),
// //             Error::<Test>::MemberAuthFailed,
// //         );
// //     })
// // }

// // // edit_reply
// // #[test]
// // fn cannot_delete_reply_to_nonexistent_reply_or_post() {
// //     with_default_mock_builder(|| {
// //         run_to_block(1);

// //         let (reply_id, post_id) = setup_testing_scenario_with_replies();

// //         // reply id is not valid
// //         assert_err!(
// //             Content::delete_reply(
// //                 Origin::signed(FIRST_MEMBER_ORIGIN),
// //                 <tests::mock::Test as MembershipTypes>::MemberId::from(FIRST_MEMBER_ID),
// //                 post_id,
// //                 <tests::mock::Test as Trait>::ReplyId::from(UNKNOWN_REPLY_ID),
// //             ),
// //             Error::<Test>::ReplyDoesNotExist,
// //         );

// //         // postid is not valid
// //         assert_err!(
// //             Content::delete_reply(
// //                 Origin::signed(FIRST_MEMBER_ORIGIN),
// //                 <tests::mock::Test as MembershipTypes>::MemberId::from(FIRST_MEMBER_ID),
// //                 <tests::mock::Test as Trait>::PostId::from(UNKNOWN_POST_ID),
// //                 reply_id,
// //             ),
// //             Error::<Test>::ReplyDoesNotExist,
// //         );
// //     })
// // }

// // #[test]
// // fn non_authorized_member_cannot_delete_reply() {
// //     with_default_mock_builder(|| {
// //         let (reply_id, post_id) = setup_testing_scenario_with_replies();

// //         // non owner member cannot delete reply
// //         assert_err!(
// //             Content::delete_reply(
// //                 Origin::signed(FIRST_MEMBER_ORIGIN),
// //                 <tests::mock::Test as MembershipTypes>::MemberId::from(SECOND_MEMBER_ID),
// //                 post_id,
// //                 reply_id,
// //             ),
// //             Error::<Test>::MemberAuthFailed,
// //         );

// //         // non existing member cannot delete reply
// //         assert_err!(
// //             Content::delete_reply(
// //                 Origin::signed(FIRST_MEMBER_ORIGIN),
// //                 <tests::mock::Test as MembershipTypes>::MemberId::from(UNKNOWN_MEMBER_ID),
// //                 post_id,
// //                 reply_id,
// //             ),
// //             Error::<Test>::MemberAuthFailed,
// //         );
// //     })
// // }

// // #[test]
// // fn verify_edit_reply_effects() {
// //     with_default_mock_builder(|| {
// //         run_to_block(1);

// //         let (reply_id, post_id) = setup_testing_scenario_with_replies();

// //         assert_ok!(Content::edit_reply(
// //             Origin::signed(FIRST_MEMBER_ORIGIN),
// //             <tests::mock::Test as MembershipTypes>::MemberId::from(FIRST_MEMBER_ID),
// //             post_id,
// //             reply_id,
// //         ));

// //         // event deposited
// //         assert_eq!(
// //             System::events().last().unwrap().event,
// //             MetaEvent::content(RawEvent::ReplyModified(
// //                 <tests::mock::Test as MembershipTypes>::MemberId::from(FIRST_MEMBER_ID),
// //                 post_id,
// //                 reply_id,
// //             ))
// //         );
// //     })
// // }

// // // delete reply
// // // behavior on unsatisfied preconditions is the same as edit_reply, testing effects only...
// // #[test]
// // fn verify_delete_sub_reply_effects() {
// //     with_default_mock_builder(|| {
// //         // deleting (the last) reply to a reply
// //         run_to_block(1);

// //         let (_reply_id, post_id) = setup_testing_scenario_with_replies();

// //         let replies_count_pre = Content::post_by_id(post_id).replies_count;

// //         assert_ok!(Content::delete_reply(
// //             Origin::signed(FIRST_MEMBER_ORIGIN),
// //             <tests::mock::Test as MembershipTypes>::MemberId::from(FIRST_MEMBER_ID),
// //             post_id,
// //             replies_count_pre,
// //         ));

// //         let replies_count_post = Content::post_by_id(post_id).replies_count;

// //         // replies count decreased
// //         assert_eq!(replies_count_pre - replies_count_post, 1);

// //         // event deposited
// //         assert_eq!(
// //             System::events().last().unwrap().event,
// //             MetaEvent::content(RawEvent::ReplyDeleted(
// //                 <tests::mock::Test as MembershipTypes>::MemberId::from(FIRST_MEMBER_ID),
// //                 post_id,
// //                 replies_count_pre,
// //             ))
// //         );
// //     })
// // }

// // #[test]
// // fn verify_delete_parent_reply_effects() {
// //     with_default_mock_builder(|| {
// //         // deleting parent reply
// //         run_to_block(1);

// //         let (parent_reply_id, post_id) = setup_testing_scenario_with_replies();

// //         let replies_count_pre = Content::post_by_id(post_id).replies_count;

// //         assert_ok!(Content::delete_reply(
// //             Origin::signed(FIRST_MEMBER_ORIGIN),
// //             <tests::mock::Test as MembershipTypes>::MemberId::from(FIRST_MEMBER_ID),
// //             post_id,
// //             parent_reply_id,
// //         ));

// //         let replies_count_post = Content::post_by_id(post_id).replies_count;

// //         // replies count decreased
// //         assert_eq!(replies_count_pre - replies_count_post, 1);

// //         // event deposited
// //         assert_eq!(
// //             System::events().last().unwrap().event,
// //             MetaEvent::content(RawEvent::ReplyDeleted(
// //                 <tests::mock::Test as MembershipTypes>::MemberId::from(FIRST_MEMBER_ID),
// //                 post_id,
// //                 parent_reply_id,
// //             ))
// //         );
// //     })
// // }

// // #[test]
// // fn nonexistent_member_cannot_react_to_post() {
// //     with_default_mock_builder(|| {
// //         let (post_id, _member_video_id) = setup_testing_scenario_with_post();

// //         assert_err!(
// //             Content::react_to_post(
// //                 Origin::signed(FIRST_MEMBER_ORIGIN),
// //                 <tests::mock::Test as MembershipTypes>::MemberId::from(UNKNOWN_MEMBER_ID),
// //                 post_id,
// //                 <tests::mock::Test as Trait>::PostReactionId::from(1u64),
// //             ),
// //             Error::<Test>::MemberAuthFailed
// //         );
// //     })
// // }

// #[test]
// fn invalid_user_cannot_react() {
//     with_default_mock_builder(|| {
//         let member_account = FIRST_MEMBER_ORIGIN;
//         let member_id = FIRST_MEMBER_ID;
//         let curator_id = FIRST_CURATOR_ID;
//         let curator_account = FIRST_CURATOR_ORIGIN;
//         let allow_comments = false; // disable comments

//         let scenario = setup_testing_scenario(
//             member_account,
//             member_id,
//             curator_account,
//             curator_id,
//             allow_comments,
//         );
//         assert_err!(
//             Content::react_to_video(
//                 Origin::signed(FIRST_MEMBER_ORIGIN),
//                 <tests::mock::Test as MembershipTypes>::MemberId::from(UNKNOWN_MEMBER_ID),
//                 scenario.member_video_id,
//                 <Test as Trait>::ReactionId::from(1u64),
//             ),
//             Error::<Test>::MemberAuthFailed
//         );
//     })
// }

// #[test]
// fn verify_update_moderator_set_effects() {
//     with_default_mock_builder(|| {
//         run_to_block(1);
//         let member_account = FIRST_MEMBER_ORIGIN;
//         let member_id = FIRST_MEMBER_ID;
//         let curator_id = FIRST_CURATOR_ID;
//         let curator_account = FIRST_CURATOR_ORIGIN;
//         let comment_author_account = THIRD_MEMBER_ORIGIN;
//         let comment_author_id = THIRD_MEMBER_ID;

//         let xs: Vec<u64> = vec![1, 2, 3, 4, 5, 6];
//         let mod_set: BTreeSet<MemberId> = xs.iter().cloned().collect();

//         let scenario = setup_testing_scenario_with_comment_post(
//             member_account,
//             member_id,
//             curator_account,
//             curator_id,
//             comment_author_account,
//             comment_author_id,
//         );

//         // create moderator set
//         assert_ok!(Content::update_moderator_set(
//             Origin::signed(member_account),
//             ContentActor::Member(member_id),
//             mod_set.clone(),
//             scenario.member_channel_id,
//         ));

//         // event creation
//         assert_eq!(
//             System::events().last().unwrap().event,
//             MetaEvent::content(RawEvent::ModeratorSetUpdated(
//                 scenario.member_channel_id,
//                 mod_set.clone(),
//             )),
//         );

//         // moderator set is actually updated
//         assert_eq!(
//             ChannelById::<Test>::get(scenario.member_channel_id).moderator_set,
//             mod_set,
//         );
//     })
// }
