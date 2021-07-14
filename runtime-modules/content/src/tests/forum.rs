#![cfg(test)]

//use super::curators;
use super::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};
use sp_runtime::traits::Hash;

struct TestScenario {
    category: Option<(
        <Test as Trait>::CategoryId,
        Category<Test>,
        <Test as Trait>::CategoryId,
    )>,
    channel: Option<(<Test as StorageOwnership>::ChannelId, Channel<Test>)>,
    thread: Option<(<Test as Trait>::ThreadId, Thread<Test>)>,
    post: Option<(<Test as Trait>::PostId, Post<Test>)>,
}

fn get_category_id(s: &TestScenario) -> <Test as Trait>::CategoryId {
    s.category.clone().unwrap().0
}
fn get_category(s: &TestScenario) -> Category<Test> {
    s.category.clone().unwrap().1
}
fn get_category_counter(s: &TestScenario) -> <Test as Trait>::CategoryId {
    s.category.clone().unwrap().2
}
fn get_channel_id(s: &TestScenario) -> <Test as StorageOwnership>::ChannelId {
    s.channel.clone().unwrap().0
}
fn get_thread_id(s: &TestScenario) -> <Test as Trait>::ThreadId {
    s.thread.clone().unwrap().0
}
fn get_thread(s: &TestScenario) -> Thread<Test> {
    s.thread.clone().unwrap().1
}
fn get_post_id(s: &TestScenario) -> <Test as Trait>::PostId {
    s.post.clone().unwrap().0
}

#[test]
fn cannot_exceed_subcategories_limit() {
    with_default_mock_builder(|| {
        let parent_category_id = Content::next_category_id();

        // create parent category with 2 subcategories
        assert_ok!(Content::create_forum_category(
            Origin::signed(FORUM_LEAD_ORIGIN),
            None,
            <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
        ));
        assert_ok!(Content::create_forum_category(
            Origin::signed(FORUM_LEAD_ORIGIN),
            Some(parent_category_id),
            <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
        ));
        assert_ok!(Content::create_forum_category(
            Origin::signed(FORUM_LEAD_ORIGIN),
            Some(parent_category_id),
            <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
        ));

        // trying to exceed subgategories limit = 2
        assert_err!(
            Content::create_forum_category(
                Origin::signed(FORUM_LEAD_ORIGIN),
                Some(parent_category_id),
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            ),
            Error::<Test>::MapSizeLimit,
        );
    })
}

#[test]
fn cannot_create_subcategory_of_an_invalid_category() {
    with_default_mock_builder(|| {
        assert_err!(
            Content::create_forum_category(
                Origin::signed(FORUM_LEAD_ORIGIN),
                Some(INVALID_CATEGORY),
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            ),
            Error::<Test>::CategoryDoesNotExist,
        );
    })
}

#[test]
fn non_lead_cannot_create_category() {
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

#[test]
fn verify_create_forum_category_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let category_counter_pre = Content::category_counter();
        let parent_category_id = Content::next_category_id();
        assert_ok!(Content::create_forum_category(
            Origin::signed(FORUM_LEAD_ORIGIN),
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
            Origin::signed(FORUM_LEAD_ORIGIN),
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
        Origin::signed(FORUM_LEAD_ORIGIN),
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
        post: None,
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
                Origin::signed(UNKNOWN_ORIGIN),
                NOT_FORUM_MEMBER_ID,
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
        post: None,
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
                Origin::signed(UNKNOWN_ORIGIN),
                NOT_FORUM_MEMBER_ID,
                category_id,
                thread_id,
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

fn helper_setup_scenario_with_post() -> TestScenario {
    let scenario = helper_setup_scenario_with_thread();
    let category_id = get_category_id(&scenario);
    let thread_id = get_thread_id(&scenario);
    let channel_id = get_channel_id(&scenario);

    let post_id = Content::next_post_id();

    assert_ok!(Content::add_post(
        Origin::signed(FIRST_MEMBER_ORIGIN),
        FIRST_MEMBER_ID,
        category_id,
        thread_id,
        <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
    ));
    TestScenario {
        category: Some((
            category_id,
            Content::category_by_id(category_id),
            Content::category_counter(),
        )),
        channel: Some((channel_id, Content::channel_by_id(channel_id))),
        thread: Some((thread_id, Content::thread_by_id(category_id, thread_id))),
        post: Some((post_id, Content::post_by_id(thread_id, post_id))),
    }
}

#[test]
fn verify_add_post_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);
        let scenario = helper_setup_scenario_with_thread();
        let category_id = get_category_id(&scenario);
        let thread_id = get_thread_id(&scenario);

        let thread = get_thread(&scenario);
        let post_id = Content::next_post_id();

        assert_ok!(Content::add_post(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            FIRST_MEMBER_ID,
            category_id,
            thread_id,
            <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
        ));

        // 1. event deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostAdded(
                post_id,
                FIRST_MEMBER_ID,
                category_id,
                thread_id,
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            ))
        );

        // 2. post counter for thread increased by 1
        assert_eq!(
            Content::thread_by_id(category_id, thread_id).number_of_posts - thread.number_of_posts,
            1,
        );
    })
}

#[test]
fn non_author_or_invalid_member_cannot_edit_post() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_scenario_with_post();
        let category_id = get_category_id(&scenario);
        let thread_id = get_thread_id(&scenario);
        let post_id = get_post_id(&scenario);

        // valid member but not original post author
        assert_err!(
            Content::edit_post_text(
                Origin::signed(SECOND_MEMBER_ORIGIN),
                SECOND_MEMBER_ID,
                category_id,
                thread_id,
                post_id,
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            ),
            Error::<Test>::AccountDoesNotMatchPostAuthor,
        );

        // invalid member
        assert_err!(
            Content::edit_post_text(
                Origin::signed(UNKNOWN_ORIGIN),
                FIRST_MEMBER_ID,
                category_id,
                thread_id,
                post_id,
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn cannot_edit_invalid_post() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_scenario_with_post();
        let category_id = get_category_id(&scenario);
        let thread_id = get_thread_id(&scenario);
        let post_id = get_post_id(&scenario);

        // invalid combination of thread post
        assert_err!(
            Content::edit_post_text(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                FIRST_MEMBER_ID,
                category_id,
                thread_id,
                INVALID_POST,
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            ),
            Error::<Test>::PostDoesNotExist,
        );

        // invalid combination of thread post
        assert_err!(
            Content::edit_post_text(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                FIRST_MEMBER_ID,
                category_id,
                INVALID_THREAD,
                post_id,
                <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
            ),
            Error::<Test>::PostDoesNotExist,
        );
    })
}

#[test]
fn verify_edit_post_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let scenario = helper_setup_scenario_with_post();

        let category_id = get_category_id(&scenario);
        let thread_id = get_thread_id(&scenario);
        let post_id = get_post_id(&scenario);

        assert_ok!(Content::edit_post_text(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            FIRST_MEMBER_ID,
            category_id,
            thread_id,
            post_id,
            <Test as frame_system::Trait>::Hashing::hash(&2.encode()),
        ));

        // 1. Deposit event
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostTextUpdated(
                post_id,
                FIRST_MEMBER_ID,
                category_id,
                thread_id,
                <Test as frame_system::Trait>::Hashing::hash(&2.encode()),
            ))
        );
    })
}

#[test]
fn non_author_or_invalid_member_cannot_delete_post() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_scenario_with_post();
        let category_id = get_category_id(&scenario);
        let thread_id = get_thread_id(&scenario);
        let post_id = get_post_id(&scenario);

        // valid member but not original post author
        assert_err!(
            Content::delete_post(
                Origin::signed(SECOND_MEMBER_ORIGIN),
                SECOND_MEMBER_ID,
                category_id,
                thread_id,
                post_id,
            ),
            Error::<Test>::AccountDoesNotMatchPostAuthor,
        );

        // invalid member
        assert_err!(
            Content::delete_post(
                Origin::signed(UNKNOWN_ORIGIN),
                FIRST_MEMBER_ID,
                category_id,
                thread_id,
                post_id,
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn cannot_delete_invalid_post() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_scenario_with_post();
        let category_id = get_category_id(&scenario);
        let thread_id = get_thread_id(&scenario);
        let post_id = get_post_id(&scenario);

        // invalid combination of thread post category
        assert_err!(
            Content::delete_post(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                FIRST_MEMBER_ID,
                INVALID_CATEGORY,
                thread_id,
                post_id,
            ),
            Error::<Test>::ThreadDoesNotExist,
        );

        assert_err!(
            Content::delete_post(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                FIRST_MEMBER_ID,
                category_id,
                INVALID_THREAD,
                post_id,
            ),
            Error::<Test>::ThreadDoesNotExist,
        );

        assert_err!(
            Content::delete_post(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                FIRST_MEMBER_ID,
                category_id,
                thread_id,
                INVALID_POST,
            ),
            Error::<Test>::PostDoesNotExist,
        );
    })
}

#[test]
fn verify_delete_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let scenario = helper_setup_scenario_with_post();

        let category_id = get_category_id(&scenario);
        let thread_id = get_thread_id(&scenario);
        let post_id = get_post_id(&scenario);

        assert_ok!(Content::delete_post(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            FIRST_MEMBER_ID,
            category_id,
            thread_id,
            post_id,
        ));

        // 1. Deposit event
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostDeleted(
                post_id,
                FIRST_MEMBER_ID,
                category_id,
                thread_id,
            ))
        );
    })
}

#[test]
fn invalid_forum_user_cannot_react_post() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_scenario_with_post();

        let post_id = get_post_id(&scenario);
        let thread_id = get_thread_id(&scenario);
        let category_id = get_category_id(&scenario);

        // using invalid signer
        assert_err!(
            Content::react_post(
                Origin::signed(UNKNOWN_ORIGIN),
                FIRST_MEMBER_ID,
                category_id,
                thread_id,
                post_id,
                <Test as Trait>::ReactionId::from(1u64),
            ),
            Error::<Test>::MemberAuthFailed,
        );

        // using invalid member
        assert_err!(
            Content::react_post(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                NOT_FORUM_MEMBER_ID,
                category_id,
                thread_id,
                post_id,
                <Test as Trait>::ReactionId::from(1u64),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn cannot_react_to_invalid_post() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_scenario_with_post();
        let category_id = get_category_id(&scenario);
        let thread_id = get_thread_id(&scenario);
        let post_id = get_post_id(&scenario);

        // invalid combination of thread post
        assert_err!(
            Content::react_post(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                FIRST_MEMBER_ID,
                category_id,
                thread_id,
                INVALID_POST,
                <Test as Trait>::ReactionId::from(1u64),
            ),
            Error::<Test>::PostDoesNotExist,
        );

        // invalid combination of thread post
        assert_err!(
            Content::react_post(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                FIRST_MEMBER_ID,
                category_id,
                INVALID_THREAD,
                post_id,
                <Test as Trait>::ReactionId::from(1u64),
            ),
            Error::<Test>::PostDoesNotExist,
        );
    })
}

#[test]
fn verify_react_post_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let scenario = helper_setup_scenario_with_post();
        let category_id = get_category_id(&scenario);
        let thread_id = get_thread_id(&scenario);
        let post_id = get_post_id(&scenario);
        let reaction_id = <Test as Trait>::ReactionId::from(1u64);

        assert_ok!(Content::react_post(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            FIRST_MEMBER_ID,
            category_id,
            thread_id,
            post_id,
            reaction_id,
        ));

        // 1. event is deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostReacted(
                post_id,
                FIRST_MEMBER_ID,
                category_id,
                thread_id,
                reaction_id,
            ))
        );
    })
}

#[test]
fn cannot_delete_non_existing_category() {
    with_default_mock_builder(|| {
        assert_err!(
            Content::delete_forum_category(
                Origin::signed(FORUM_LEAD_ORIGIN),
                PrivilegedActor::<Test>::Lead,
                INVALID_CATEGORY,
            ),
            Error::<Test>::ForumCategoryDoesNotExist,
        );
    })
}

fn helper_setup_scenario_with_subcategory() -> TestScenario {
    let scenario = helper_setup_basic_scenario();

    let parent_category_id = get_category_id(&scenario);
    let channel_id = get_channel_id(&scenario);

    let category_id = Content::next_category_id();

    assert_ok!(Content::create_forum_category(
        Origin::signed(FORUM_LEAD_ORIGIN),
        Some(parent_category_id),
        <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
        <Test as frame_system::Trait>::Hashing::hash(&1.encode()),
    ));

    TestScenario {
        category: Some((
            category_id,
            Content::category_by_id(category_id),
            Content::category_counter(),
        )),
        channel: Some((channel_id, Content::channel_by_id(channel_id))),
        thread: None,
        post: None,
    }
}

#[test]
fn verify_delete_category_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let scenario = helper_setup_scenario_with_subcategory();
        let category_id = get_category_id(&scenario);
        let category_counter = get_category_counter(&scenario);

        let parent_category_id = get_category(&scenario).parent_category_id.clone().unwrap();
        let parent_subcategories_counter =
            Content::category_by_id(parent_category_id).num_direct_subcategories;

        assert_ok!(Content::delete_forum_category(
            Origin::signed(FORUM_LEAD_ORIGIN),
            PrivilegedActor::<Test>::Lead,
            category_id,
        ));

        // 1. event is deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::CategoryDeleted(
                category_id,
                PrivilegedActor::<Test>::Lead,
            ))
        );

        // 2. Category counter decreased by 1
        assert_eq!(category_counter - Content::category_counter(), 1);

        // 3. parent category subcategories count is decreased by 1
        assert_eq!(
            parent_subcategories_counter
                - Content::category_by_id(parent_category_id).num_direct_subcategories,
            1
        );
    })
}

/* Observations
- Resolve MemberId and AccountId difference
- Resolve errors between Post and Thread does not exist
*/

#[test]
fn non_lead_cannot_update_moderator_for_category() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_basic_scenario();
        assert_err!(
            Content::update_category_membership_of_moderator(
                Origin::signed(UNKNOWN_ORIGIN),
                FIRST_MODERATOR_ID,
                get_category_id(&scenario),
                true,
            ),
            Error::<Test>::LeadAuthFailed,
        );
    })
}

#[test]
fn cannot_update_moderator_for_invalid_category() {
    with_default_mock_builder(|| {
        assert_err!(
            Content::update_category_membership_of_moderator(
                Origin::signed(FORUM_LEAD_ORIGIN),
                FIRST_MEMBER_ID,
                INVALID_CATEGORY,
                true,
            ),
            Error::<Test>::ForumCategoryDoesNotExist,
        );
    })
}

#[test]
fn cannot_remove_non_existing_moderator_for_category() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_basic_scenario();
        assert_err!(
            Content::update_category_membership_of_moderator(
                Origin::signed(FORUM_LEAD_ORIGIN),
                FIRST_MODERATOR_ID,
                get_category_id(&scenario),
                false,
            ),
            Error::<Test>::CategoryModeratorDoesNotExist,
        );
    })
}

#[test]
fn cannot_exceed_max_moderators_for_category() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_basic_scenario();
        let category_id = get_category_id(&scenario);

        assert_ok!(Content::update_category_membership_of_moderator(
            Origin::signed(FORUM_LEAD_ORIGIN),
            FIRST_MODERATOR_ID,
            category_id,
            true,
        ));

        assert_ok!(Content::update_category_membership_of_moderator(
            Origin::signed(FORUM_LEAD_ORIGIN),
            SECOND_MODERATOR_ID,
            category_id,
            true,
        ));

        // attempt to exceed max moderator for category = 2
        assert_err!(
            Content::update_category_membership_of_moderator(
                Origin::signed(FORUM_LEAD_ORIGIN),
                FIRST_MEMBER_ID,
                category_id,
                true,
            ),
            Error::<Test>::MapSizeLimit,
        );
    })
}

#[test]
fn verify_update_moderator_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let scenario = helper_setup_basic_scenario();
        let category_id = get_category_id(&scenario);
        let moderator_num = get_category(&scenario).num_direct_moderators;

        assert_ok!(Content::update_category_membership_of_moderator(
            Origin::signed(FORUM_LEAD_ORIGIN),
            FIRST_MODERATOR_ID,
            category_id,
            true,
        ));

        // 1. event is deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::CategoryMembershipOfModeratorUpdated(
                FIRST_MODERATOR_ID,
                category_id,
            ))
        );

        // 2. direct moderator number increased by 1
        let moderator_num_post = Content::category_by_id(category_id).num_direct_moderators;
        assert_eq!(moderator_num_post - moderator_num, 1);

        // remove previously added moderator
        assert_ok!(Content::update_category_membership_of_moderator(
            Origin::signed(FORUM_LEAD_ORIGIN),
            FIRST_MODERATOR_ID,
            category_id,
            false,
        ));

        // 2. direct moderator number decreased by 1
        assert_eq!(
            moderator_num_post - Content::category_by_id(category_id).num_direct_moderators,
            1,
        );
    })
}
