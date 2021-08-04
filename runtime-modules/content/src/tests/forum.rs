#![cfg(test)]

//use super::curators;
use super::mock::*;
use crate::*;
use frame_support::{assert_err, assert_ok};

fn create_channel_mock(
    origin: Origin,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    params: ChannelCreationParameters<
        ContentParameters<Test>,
        <Test as frame_system::Trait>::AccountId,
    >,
    result: DispatchResult,
) {
    let channel_id = Content::next_channel_id();

    assert_eq!(
        Content::create_channel(origin.clone(), actor.clone(), params.clone()),
        result
    );

    if result.is_ok() {
        assert!(ChannelById::<Test>::contains_key(channel_id));
        let channel = Content::channel_by_id(channel_id);
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ChannelCreated(actor, channel_id, channel, params,))
        );
    }
}

fn create_thread_mock(
    origin: Origin,
    member_id: MemberId,
    params: ThreadCreationParameters<ChannelId>,
    result: DispatchResult,
) -> <Test as Trait>::ThreadId {
    let thread_id = Content::next_thread_id();

    assert_eq!(
        Content::create_thread(origin.clone(), member_id.clone(), params.clone()),
        result
    );

    if result.is_ok() {
        assert!(ChannelById::<Test>::contains_key(thread_id));
        let channel = Content::channel_by_id(thread_id);
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ThreadCreated(thread_id, member_id, params))
        );
        assert_eq!(Content::next_thread_id(), thread_id + 1);
    }
    thread_id
}

fn delete_thread_mock(
    origin: Origin,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    thread_id: <Test as Trait>::ThreadId,
    result: DispatchResult,
) -> <Test as Trait>::ThreadId {
    assert_eq!(
        Content::delete_thread(origin.clone(), actor.clone(), thread_id.clone()),
        result
    );

    if result.is_ok() {
        assert!(ChannelById::<Test>::contains_key(thread_id));
        let channel = Content::channel_by_id(thread_id);
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ThreadDeleted(thread_id, actor))
        );
    }
    thread_id
}

fn create_post_mock(
    origin: Origin,
    member_id: MemberId,
    params: PostCreationParameters<<Test as Trait>::ThreadId>,
    result: DispatchResult,
) -> <Test as Trait>::PostId {
    let post_id = Content::next_post_id();
    let thread = Content::thread_by_id(params.thread_id.clone());
    assert_eq!(
        Content::create_post(origin.clone(), member_id.clone(), params.clone(),),
        result
    );

    if result.is_ok() {
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostAdded(
                post_id,
                FIRST_MEMBER_ID,
                params.clone(),
            ))
        );

        // 2. post counter for thread increased by 1
        assert_eq!(
            Content::thread_by_id(params.thread_id).number_of_posts - thread.number_of_posts,
            1,
        );
    }
    post_id
}

fn delete_post_mock(
    origin: Origin,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    thread_id: <Test as Trait>::ThreadId,
    post_id: <Test as Trait>::PostId,
    result: DispatchResult,
) {
    let mut balance_before = 0;
    if let ContentActor::Member(member) = actor {
        let balance_before = balances::Module::<Test>::free_balance(member);
    }

    let bond = Content::post_by_id(thread_id.clone(), post_id.clone()).bloat_bond;

    assert_ok!(Content::delete_post(
        origin.clone(),
        actor.clone(),
        thread_id.clone(),
        post_id.clone(),
    ));

    if result.is_ok() {
        // 1. Deposit event
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostDeleted(post_id, actor, thread_id))
        );

        // 2. Post Author is refunded
        if let ContentActor::Member(member) = actor {
            let balance_after = balances::Module::<Test>::free_balance(member);
            assert_eq!(balance_after - balance_before, bond);
        }
    }
}

struct TestScenario {
    channel: Option<(<Test as StorageOwnership>::ChannelId, Channel<Test>)>,
    thread: Option<(<Test as Trait>::ThreadId, Thread<Test>)>,
    post: Option<(<Test as Trait>::PostId, Post<Test>)>,
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
fn get_post(s: &TestScenario) -> Post<Test> {
    s.post.clone().unwrap().1
}

fn helper_setup_basic_scenario() -> TestScenario {
    let channel_id = Content::next_channel_id();

    assert_ok!(Content::create_channel(
        Origin::signed(SECOND_MEMBER_ORIGIN),
        ContentActor::Member(SECOND_MEMBER_ID),
        ChannelCreationParameters {
            assets: vec![],
            meta: vec![],
            reward_account: None,
            subreddit_mutable: true,
        }
    ));

    TestScenario {
        channel: Some((channel_id, Content::channel_by_id(channel_id))),
        thread: None,
        post: None,
    }
}

#[test]
fn invalid_member_cannot_create_thread() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_basic_scenario();
        let channel_id = get_channel_id(&scenario);
        let params = ThreadCreationParameters {
            title: vec![1, 1],
            post_text: vec![2, 2],
            post_mutable: true,
            channel_id: channel_id,
        };
        assert_err!(
            Content::create_thread(Origin::signed(FIRST_MEMBER_ID), NOT_FORUM_MEMBER_ID, params),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn cannot_create_thread_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        let _scenario = helper_setup_basic_scenario();
        let channel_id = INVALID_CHANNEL;
        let params = ThreadCreationParameters {
            title: vec![1, 1],
            post_text: vec![2, 2],
            post_mutable: true,
            channel_id: channel_id,
        };

        assert_err!(
            Content::create_thread(Origin::signed(FIRST_MEMBER_ORIGIN), FIRST_MEMBER_ID, params),
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

        let channel_id = get_channel_id(&scenario_pre);
        let params = ThreadCreationParameters {
            title: vec![1, 1],
            post_text: vec![2, 2],
            post_mutable: true,
            channel_id: channel_id,
        };

        // replenish the free balance of member 1
        let _ = balances::Module::<Test>::deposit_creating(&FIRST_MEMBER_ORIGIN, INITIAL_ENDOW);
        assert_ok!(Content::create_thread(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            FIRST_MEMBER_ID,
            params.clone(),
        ));

        let thread = Content::thread_by_id(thread_id);

        // 1. Appropriate event is deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ThreadCreated(thread_id, thread.author_id, params,))
        );
    })
}

fn helper_setup_scenario_with_thread() -> TestScenario {
    let scenario = helper_setup_basic_scenario();
    let thread_id = Content::next_thread_id();
    let channel_id = get_channel_id(&scenario);

    let params = ThreadCreationParameters {
        title: vec![1, 1],
        post_text: vec![2, 2],
        post_mutable: true,
        channel_id: channel_id,
    };

    // assign initial balances to member
    let _ = balances::Module::<Test>::deposit_creating(
        &FIRST_MEMBER_ORIGIN,
        <Test as balances::Trait>::Balance::from(INITIAL_ENDOW),
    );

    assert_ok!(Content::create_thread(
        Origin::signed(FIRST_MEMBER_ORIGIN),
        FIRST_MEMBER_ID,
        params,
    ));

    TestScenario {
        channel: Some((channel_id, Content::channel_by_id(channel_id))),
        thread: Some((thread_id, Content::thread_by_id(thread_id))),
        post: None,
    }
}

#[test]
fn cannot_delete_invalid_thread() {
    with_default_mock_builder(|| {
        assert_err!(
            Content::delete_thread(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                ContentActor::Member(FIRST_MEMBER_ID),
                INVALID_THREAD,
            ),
            Error::<Test>::ThreadDoesNotExist,
        );
    })
}

#[test]
fn non_author_or_invalid_member_cannot_delete_thread() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_scenario_with_thread();
        let thread_id = get_thread_id(&scenario);

        // non author member cannot delete post
        assert_err!(
            Content::delete_thread(
                Origin::signed(SECOND_MEMBER_ORIGIN),
                ContentActor::Member(SECOND_MEMBER_ID),
                thread_id,
            ),
            Error::<Test>::ActorNotAuthorized,
        );

        // invalid account signer cannot be authorized
        assert_err!(
            Content::delete_thread(
                Origin::signed(UNKNOWN_ORIGIN),
                ContentActor::Member(FIRST_MEMBER_ID),
                thread_id,
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
        let channel_id = get_channel_id(&scenario);

        assert_ok!(Content::delete_thread(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            thread_id,
        ));

        // 1. event is deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ThreadDeleted(
                thread_id,
                ContentActor::Member(FIRST_MEMBER_ID),
            ))
        );
    })
}

#[test]
fn cannot_create_post_in_invalid_thread() {
    with_default_mock_builder(|| {
        let params = PostCreationParameters {
            text: vec![1, 2],
            mutable: true,
            thread_id: INVALID_THREAD,
        };

        // invalid thread id
        assert_err!(
            Content::create_post(Origin::signed(FIRST_MEMBER_ORIGIN), FIRST_MEMBER_ID, params,),
            Error::<Test>::ThreadDoesNotExist,
        );
    })
}

#[test]
fn non_authorized_or_invalid_member_cannot_create_post() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_scenario_with_thread();
        let thread_id = get_thread_id(&scenario);
        let params = PostCreationParameters {
            text: vec![1, 2],
            mutable: true,
            thread_id: thread_id,
        };

        // non member cannot create post
        assert_err!(
            Content::create_post(Origin::signed(UNKNOWN_ORIGIN), NOT_FORUM_MEMBER_ID, params),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

fn helper_setup_scenario_with_post() -> TestScenario {
    let scenario = helper_setup_scenario_with_thread();
    let thread_id = get_thread_id(&scenario);
    let channel_id = get_channel_id(&scenario);
    let params = PostCreationParameters {
        text: vec![1, 2],
        mutable: true,
        thread_id: thread_id,
    };

    let post_id = Content::next_post_id();

    assert_ok!(Content::create_post(
        Origin::signed(FIRST_MEMBER_ORIGIN),
        FIRST_MEMBER_ID,
        params,
    ));
    TestScenario {
        channel: Some((channel_id, Content::channel_by_id(channel_id))),
        thread: Some((thread_id, Content::thread_by_id(thread_id))),
        post: Some((post_id, Content::post_by_id(thread_id, post_id))),
    }
}

#[test]
fn verify_create_post_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);
        let scenario = helper_setup_scenario_with_thread();
        let thread_id = get_thread_id(&scenario);

        let thread = get_thread(&scenario);
        let post_id = Content::next_post_id();
        let params = PostCreationParameters {
            text: vec![1, 2],
            mutable: true,
            thread_id: thread_id,
        };

        assert_ok!(Content::create_post(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            FIRST_MEMBER_ID,
            params.clone(),
        ));

        // 1. event deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostAdded(post_id, FIRST_MEMBER_ID, params))
        );

        // 2. post counter for thread increased by 1
        assert_eq!(
            Content::thread_by_id(thread_id).number_of_posts - thread.number_of_posts,
            1,
        );
    })
}

#[test]
fn non_author_or_invalid_member_cannot_edit_post() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_scenario_with_post();
        let thread_id = get_thread_id(&scenario);
        let post_id = get_post_id(&scenario);

        let params = PostUpdateParameters {
            text: None,
            mutable: None,
        };

        // valid member but not original post author
        assert_err!(
            Content::edit_post(
                Origin::signed(SECOND_MEMBER_ORIGIN),
                SECOND_MEMBER_ID,
                thread_id,
                post_id,
                params.clone(),
            ),
            Error::<Test>::AccountDoesNotMatchPostAuthor,
        );

        // invalid member
        assert_err!(
            Content::edit_post(
                Origin::signed(UNKNOWN_ORIGIN),
                FIRST_MEMBER_ID,
                thread_id,
                post_id,
                params,
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn cannot_edit_invalid_post() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_scenario_with_post();
        let thread_id = get_thread_id(&scenario);
        let post_id = get_post_id(&scenario);

        let params = PostUpdateParameters {
            text: None,
            mutable: None,
        };

        // invalid combination of thread post
        assert_err!(
            Content::edit_post(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                FIRST_MEMBER_ID,
                thread_id,
                INVALID_POST,
                params.clone(),
            ),
            Error::<Test>::PostDoesNotExist,
        );

        // invalid combination of thread post
        assert_err!(
            Content::edit_post(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                FIRST_MEMBER_ID,
                INVALID_THREAD,
                post_id,
                params.clone(),
            ),
            Error::<Test>::ThreadDoesNotExist,
        );
    })
}

#[test]
fn verify_edit_post_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let scenario = helper_setup_scenario_with_post();

        let thread_id = get_thread_id(&scenario);
        let post_id = get_post_id(&scenario);

        let params = PostUpdateParameters {
            text: None,
            mutable: None,
        };

        assert_ok!(Content::edit_post(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            FIRST_MEMBER_ID,
            thread_id,
            post_id,
            params.clone(),
        ));

        // 1. Deposit event
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostUpdated(
                post_id,
                FIRST_MEMBER_ID,
                thread_id,
                params,
            ))
        );
    })
}

#[test]
fn non_author_or_invalid_member_cannot_delete_post() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_scenario_with_post();
        let thread_id = get_thread_id(&scenario);
        let post_id = get_post_id(&scenario);

        // valid member but not original post author
        assert_err!(
            Content::delete_post(
                Origin::signed(SECOND_MEMBER_ORIGIN),
                ContentActor::Member(SECOND_MEMBER_ID),
                thread_id,
                post_id,
            ),
            Error::<Test>::ActorNotAuthorized,
        );

        // invalid member: (maybe change this error type?)
        assert_err!(
            Content::delete_post(
                Origin::signed(UNKNOWN_ORIGIN),
                ContentActor::Member(NOT_FORUM_MEMBER_ID),
                thread_id,
                post_id,
            ),
            Error::<Test>::ActorNotAuthorized,
        );
    })
}

#[test]
fn cannot_delete_invalid_post() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_scenario_with_post();
        let thread_id = get_thread_id(&scenario);
        let post_id = get_post_id(&scenario);

        // invalid combination of thread post category
        assert_err!(
            Content::delete_post(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                ContentActor::Member(FIRST_MEMBER_ID),
                INVALID_THREAD,
                post_id,
            ),
            Error::<Test>::ThreadDoesNotExist,
        );

        assert_err!(
            Content::delete_post(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                ContentActor::Member(FIRST_MEMBER_ID),
                thread_id,
                INVALID_POST,
            ),
            Error::<Test>::PostDoesNotExist,
        );
    })
}

#[test]
fn verify_delete_post_effects_with_author() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let scenario = helper_setup_scenario_with_post();
        let thread_id = get_thread_id(&scenario);
        let post_id = get_post_id(&scenario);
        let channel_id = get_channel_id(&scenario);
        let post = get_post(&scenario);

        let balance_before = balances::Module::<Test>::free_balance(FIRST_MEMBER_ORIGIN);
        assert_ok!(Content::delete_post(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            ContentActor::Member(FIRST_MEMBER_ID),
            thread_id,
            post_id,
        ));

        // 1. Deposit event
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostDeleted(
                post_id,
                ContentActor::Member(FIRST_MEMBER_ID),
                thread_id,
            ))
        );

        // 2. Post Author refunded
        let balance_after = balances::Module::<Test>::free_balance(FIRST_MEMBER_ORIGIN);
        assert_eq!(balance_after - balance_before, post.bloat_bond);
    })
}

#[test]
fn invalid_forum_user_cannot_react_post() {
    with_default_mock_builder(|| {
        let scenario = helper_setup_scenario_with_post();
        let post_id = get_post_id(&scenario);
        let thread_id = get_thread_id(&scenario);

        // using invalid account
        assert_err!(
            Content::react_post(
                Origin::signed(UNKNOWN_ORIGIN),
                FIRST_MEMBER_ID,
                thread_id,
                post_id,
                <Test as Trait>::ReactionId::from(1u64),
                get_channel_id(&scenario),
            ),
            Error::<Test>::MemberAuthFailed,
        );

        // using invalid member_id
        assert_err!(
            Content::react_post(
                Origin::signed(FIRST_MEMBER_ORIGIN),
                NOT_FORUM_MEMBER_ID,
                thread_id,
                post_id,
                <Test as Trait>::ReactionId::from(1u64),
                get_channel_id(&scenario),
            ),
            Error::<Test>::MemberAuthFailed,
        );
    })
}

#[test]
fn verify_react_post_effects() {
    with_default_mock_builder(|| {
        run_to_block(1);

        let scenario = helper_setup_scenario_with_post();
        let thread_id = get_thread_id(&scenario);
        let post_id = get_post_id(&scenario);
        let reaction_id = <Test as Trait>::ReactionId::from(1u64);

        assert_ok!(Content::react_post(
            Origin::signed(FIRST_MEMBER_ORIGIN),
            FIRST_MEMBER_ID,
            thread_id,
            post_id,
            reaction_id,
            get_channel_id(&scenario),
        ));

        // 1. event is deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostReacted(
                post_id,
                FIRST_MEMBER_ID,
                thread_id,
                reaction_id,
                get_channel_id(&scenario),
            ))
        );
    })
}
