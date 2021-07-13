#![cfg(test)]

//use super::curators;
use super::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};
use sp_runtime::traits::Hash;

// forum
// pub const FORUM_LEAD_ORIGIN: <Test as frame_system::Trait>::AccountId = 0;

// pub const NOT_FORUM_LEAD_ORIGIN: <Test as frame_system::Trait>::AccountId = 111;

// pub const NOT_FORUM_LEAD_2_ORIGIN: <Test as frame_system::Trait>::AccountId = 112;

// pub const NOT_FORUM_MODERATOR_ORIGIN: <Test as frame_system::Trait>::AccountId = 113;

pub const NOT_FORUM_MEMBER_ORIGIN: <Test as frame_system::Trait>::AccountId = 114;

pub const INVALID_CATEGORY: <Test as Trait>::CategoryId = 333;

pub const INVALID_CHANNEL: <Test as StorageOwnership>::ChannelId = 333;

pub const INVALID_THREAD: <Test as Trait>::ThreadId = 333;

// pub const FORUM_MODERATOR_ORIGIN: <Test as frame_system::Trait>::AccountId = 123;

// pub const FORUM_MODERATOR_2_ORIGIN: <Test as frame_system::Trait>::AccountId = 124;

struct TestScenario {
    category: Option<(
        <Test as Trait>::CategoryId,
        Category<Test>,
        <Test as Trait>::CategoryId,
    )>,
    channel: Option<(<Test as StorageOwnership>::ChannelId, Channel<Test>)>,
    thread: Option<(<Test as Trait>::ThreadId, Thread<Test>)>,
    //post: Option<(<Test as Trait>::PostId, Post<Test>)>,
}

fn get_category_id(s: &TestScenario) -> <Test as Trait>::CategoryId {
    s.category.clone().unwrap().0
}
fn get_category(s: &TestScenario) -> Category<Test> {
    s.category.clone().unwrap().1
}
// fn get_category_counter(s: &TestScenario) -> <Test as Trait>::CategoryId {
//     s.category.clone().unwrap().2
// }
fn get_channel_id(s: &TestScenario) -> <Test as StorageOwnership>::ChannelId {
    s.channel.clone().unwrap().0
}
// fn get_channel(s: &TestScenario) -> Channel<Test> {
//     s.channel.clone().unwrap().1
// }
fn get_thread_id(s: &TestScenario) -> <Test as Trait>::ThreadId {
    s.thread.clone().unwrap().0
}
// fn get_thread(s: &TestScenario) -> Thread<Test> {
//     s.thread.clone().unwrap().1
// }

#[test]
fn cannot_create_subcategory_of_an_invalid_category() {
    with_default_mock_builder(|| {
        assert_err!(
            Content::create_forum_category(
                Origin::signed(LEAD_ORIGIN),
                Some(INVALID_CATEGORY),
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            ),
            Error::<Test>::CategoryDoesNotExist,
        );
    })
}

// #[test]
// fn non_lead_cannot_create_category() {
//     with_default_mock_builder(|| {
//         assert_err!(
//             Content::create_forum_category(
//                 Origin::signed(UNKNOWN_ORIGIN),
//                 None,
//                 <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
//                 <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
//             ),
//             Error::<Test>::LeadAuthFailed,
//         );
//     })
// }

#[test]
fn verify_create_forum_category_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let category_counter_pre = Content::category_counter();
        let parent_category_id = Content::next_category_id();
        assert_ok!(Content::create_forum_category(
            Origin::signed(LEAD_ORIGIN),
            None,
            <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
        ));

        let category_counter_post = Content::category_counter();
        let subcategories_count_pre =
            Content::category_by_id(parent_category_id).num_direct_subcategories;

        // 1. corresponding events are deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::CategoryCreated(
                parent_category_id,
                None,
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            ))
        );

        let subcategory_id = Content::next_category_id();
        assert_ok!(Content::create_forum_category(
            Origin::signed(LEAD_ORIGIN),
            Some(parent_category_id),
            <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
        ));

        let subcategories_count_post =
            Content::category_by_id(parent_category_id).num_direct_subcategories;

        // 1. corresponding events are deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::CategoryCreated(
                subcategory_id,
                Some(parent_category_id),
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            ))
        );

        // 2. Content::next_category_id incremented by 1
        assert_eq!((subcategory_id - parent_category_id) as u64, 1);

        // 3. Subcategories for parent category increased by 1
        assert_eq!(
            (subcategories_count_post - subcategories_count_pre) as u64,
            1
        );

        // 4. Category counter increased by 1
        assert_eq!((category_counter_post - category_counter_pre) as u64, 1);
    })
}

fn helper_setup_basic_scenario() -> TestScenario {
    let category_id = Content::next_category_id();
    let channel_id = Content::next_channel_id();
    assert_ok!(Content::create_forum_category(
        Origin::signed(LEAD_ORIGIN),
        None,
        <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
        <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
    ));

    assert_ok!(Content::create_channel(
        Origin::signed(FIRST_MEMBER_ORIGIN),
        ContentActor::Member(FIRST_MEMBER_ID),
        ChannelCreationParameters {
            assets: vec![],
            meta: vec![],
            reward_account: None,
        }
    ));

    TestScenario {
        category: Some((
            category_id,
            Content::category_by_id(category_id),
            Content::category_counter(),
        )),
        channel: Some((channel_id, Content::channel_by_id(channel_id))),
        thread: None,
        //post: None,
    }
}

/*
Requires:
 origin signed by the user specified by forum_user
 forum_user is a valid forum user
 category_id is a valid category
Effects:
 thread count for category_id is increased by 1
 corresponding event is deposited
*/
#[test]
fn non_member_cannot_create_thread() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_basic_scenario();
        assert_err!(
            Content::create_thread(
                Origin::signed(NOT_FORUM_MEMBER_ORIGIN),
                NOT_FORUM_MEMBER_ORIGIN,
                scenario.category.unwrap().0,
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
                scenario.channel.unwrap().0,
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn cannot_create_thread_with_invalid_category() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_basic_scenario();
        assert_err!(
            Content::create_thread(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                FIRST_MEMBER_ORIGIN,
                INVALID_CATEGORY,
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
                scenario.channel.unwrap().0,
            ),
            Error::<Test>::ForumCategoryDoesNotExist,
        );
    })
}

#[test]
fn cannot_create_thread_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_basic_scenario();
        assert_err!(
            Content::create_thread(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                FIRST_MEMBER_ORIGIN,
                scenario.category.unwrap().0,
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
                INVALID_CHANNEL,
            ),
            Error::<Test>::ChannelDoesNotExist,
        );
    })
}

#[test]
fn verify_create_thread_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);
        let scenario_pre = helper_setup_basic_scenario();
        let thread_id = Content::next_thread_id();

        let category_id = get_category_id(&scenario_pre);
        let channel_id = get_channel_id(&scenario_pre);

        assert_ok!(Content::create_thread(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            FIRST_MEMBER_ID,
            category_id,
            <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            channel_id,
        ));

        let thread = Content::thread_by_id(category_id, thread_id);

        // 1. Appropriate event is deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ThreadCreated(
                thread_id,
                thread.author_id,
                thread.category_id,
                thread.title_hash,
                channel_id,
            ))
        );

        println!("{:?}", Content::category_by_id(category_id));
        println!("{:?}", get_category(&scenario_pre));

        // 2. Thread count for category increased by 1
        assert_eq!(
            Content::category_by_id(category_id).num_direct_threads
                - get_category(&scenario_pre).num_direct_threads,
            1,
        );
    })
}

fn helper_setup_scenario_with_thread() -> TestScenario {
    let scenario = helper_setup_basic_scenario();
    let thread_id = Content::next_thread_id();

    let category_id = get_category_id(&scenario);
    let channel_id = get_channel_id(&scenario);

    assert_ok!(Content::create_thread(
        Origin::signed(FIRST_MEMBER_ORIGIN),
        FIRST_MEMBER_ID,
        category_id,
        <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
        <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
        channel_id,
    ));

    TestScenario {
        category: Some((
            category_id,
            Content::category_by_id(category_id),
            Content::category_counter(),
        )),
        channel: Some((channel_id, Content::channel_by_id(channel_id))),
        thread: Some((thread_id, Content::thread_by_id(category_id, thread_id))),
        //        post: None,
    }
}

#[test]
fn cannot_delete_invalid_thread() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_scenario_with_thread();
        assert_err!(
            Content::delete_thread(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                FIRST_MEMBER_ID,
                get_category_id(&scenario),
                INVALID_THREAD,
            ),
            Error::<Test>::ThreadDoesNotExist,
        );

        assert_err!(
            Content::delete_thread(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                FIRST_MEMBER_ID,
                INVALID_CATEGORY,
                get_thread_id(&scenario),
            ),
            Error::<Test>::ThreadDoesNotExist,
        );
    })
}

#[test]
fn non_author_or_invalid_member_cannot_delete_thread() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_scenario_with_thread();

        // non author member cannot delete post
        assert_err!(
            Content::delete_thread(
                Origin::signed(SECOND_MEMBER_ORIGIN),
                SECOND_MEMBER_ID,
                get_category_id(&scenario),
                get_thread_id(&scenario),
            ),
            Error::<Test>::AccountDoesNotMatchThreadAuthor,
        );

        // invalid account signer cannot be authorized
        assert_err!(
            Content::delete_thread(
                Origin::signed(UNKNOWN_ORIGIN),
                FIRST_MEMBER_ID,
                get_category_id(&scenario),
                get_thread_id(&scenario),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn verify_delete_thread_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let scenario = helper_setup_scenario_with_thread();
        let thread_id = get_thread_id(&scenario);
        let category_id = get_category_id(&scenario);

        assert_ok!(Content::delete_thread(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            FIRST_MEMBER_ID,
            thread_id,
            category_id,
        ));

        // 1. event is deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ThreadDeleted(
                thread_id,
                FIRST_MEMBER_ID,
                category_id,
            ))
        );

        // 2. thread counter for category is decreased by 1
        assert_eq!(
            get_category(&scenario).num_direct_threads
                - Content::category_by_id(category_id).num_direct_threads,
            1,
        );
    })
}

#[test]
fn cannot_create_post_in_invalid_thread() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_scenario_with_thread();

        let thread_id = get_thread_id(&scenario);
        let category_id = get_category_id(&scenario);

        // invalid thread id
        assert_err!(
            Content::add_post(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                FIRST_MEMBER_ID,
                category_id,
                INVALID_THREAD,
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            ),
            Error::<Test>::ThreadDoesNotExist,
        );

        // invalid category id
        assert_err!(
            Content::add_post(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                FIRST_MEMBER_ID,
                INVALID_CATEGORY,
                thread_id,
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            ),
            Error::<Test>::ThreadDoesNotExist,
        );
    })
}

#[test]
fn non_authorized_or_invalid_member_cannot_create_post() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_scenario_with_thread();

        let thread_id = get_thread_id(&scenario);
        let category_id = get_category_id(&scenario);

        // non member cannot create post
        assert_err!(
            Content::add_post(
                Origin::signed(NOT_FORUM_MEMBER_ORIGIN),
                NOT_FORUM_MEMBER_ORIGIN,
                category_id,
                thread_id,
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

