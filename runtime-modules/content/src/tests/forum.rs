#![cfg(test)]

//use super::curators;
use super::mock::*;
use crate::*;
use frame_support::assert_ok;

fn func(account_id: <Test as frame_system::Trait>::AccountId) {
    run_to_block(1);
    let _ = balances::Module::<Test>::deposit_creating(
        &account_id,
        <Test as balances::Trait>::Balance::from(INITIAL_ENDOW),
    );
}
fn create_channel_mock(
    sender: <Test as frame_system::Trait>::AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    params: ChannelCreationParameters<
        ContentParameters<Test>,
        <Test as frame_system::Trait>::AccountId,
    >,
    result: DispatchResult,
) -> <Test as StorageOwnership>::ChannelId {
    let channel_id = Content::next_channel_id();

    assert_eq!(
        Content::create_channel(Origin::signed(sender), actor.clone(), params.clone()),
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
    channel_id
}

fn create_thread_mock(
    sender: <Test as frame_system::Trait>::AccountId,
    member_id: MemberId,
    params: ThreadCreationParameters<ChannelId>,
    result: DispatchResult,
) -> <Test as Trait>::ThreadId {
    let thread_id = Content::next_thread_id();

    let balance_before = balances::Module::<Test>::free_balance(sender);

    assert_eq!(
        Content::create_thread(Origin::signed(sender), member_id.clone(), params.clone()),
        result
    );

    if result.is_ok() {
        assert!(ChannelById::<Test>::contains_key(thread_id));
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ThreadCreated(thread_id, member_id, params))
        );
        assert_eq!(Content::next_thread_id(), thread_id + 1);
        let thread = ThreadById::<Test>::get(thread_id);
        assert_eq!(
            balance_before - balances::Module::<Test>::free_balance(sender),
            thread.bloat_bond,
        );
    }
    thread_id
}

fn delete_thread_mock(
    sender: <Test as frame_system::Trait>::AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    thread_id: <Test as Trait>::ThreadId,
    result: DispatchResult,
) -> <Test as Trait>::ThreadId {
    let balance_before = balances::Module::<Test>::free_balance(sender);

    assert_eq!(
        Content::delete_thread(Origin::signed(sender), actor.clone(), thread_id.clone()),
        result
    );

    if result.is_ok() {
        assert!(ChannelById::<Test>::contains_key(thread_id));
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ThreadDeleted(thread_id, actor))
        );

        let thread = Content::thread_by_id(thread_id);
        let mut iter = PostById::<Test>::iter_prefix_values(thread_id);
        let mut thread_cleanup_cost = thread.bloat_bond;

        if let Some(post) = iter.next() {
            thread_cleanup_cost = thread.bloat_bond.saturating_add(post.bloat_bond);
        }

        // verify that thread author balance is increased
        if let ContentActor::Member(member) = actor {
            if member == thread.author_id {
                assert_eq!(
                    balances::Module::<Test>::free_balance(sender) - balance_before,
                    thread_cleanup_cost
                );
            }
        }
        // Thread thread_id is removed
        assert!(!ThreadById::<Test>::contains_key(thread_id));

        // all post are deleted for Thread thread_id
        assert_eq!(PostById::<Test>::iter_prefix_values(thread_id).next(), None);
    }
    thread_id
}

fn create_post_mock(
    sender: <Test as frame_system::Trait>::AccountId,
    member_id: MemberId,
    params: PostCreationParameters<<Test as Trait>::ThreadId>,
    result: DispatchResult,
) -> <Test as Trait>::PostId {
    let post_id = Content::next_post_id();
    let thread = Content::thread_by_id(params.thread_id.clone());

    let balance_before = balances::Module::<Test>::free_balance(sender);

    assert_eq!(
        Content::create_post(Origin::signed(sender), member_id.clone(), params.clone()),
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

        // 3. balance is adjusted
        assert_eq!(
            balance_before - balances::Module::<Test>::free_balance(sender),
            Content::post_by_id(params.thread_id, post_id).bloat_bond
        );
    }
    post_id
}

fn delete_post_mock(
    sender: <Test as frame_system::Trait>::AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    thread_id: <Test as Trait>::ThreadId,
    post_id: <Test as Trait>::PostId,
    result: DispatchResult,
) {
    let mut balance_before = 0;
    if let ContentActor::Member(_) = actor {
        balance_before = balances::Module::<Test>::free_balance(sender);
    }

    let bond = Content::post_by_id(thread_id.clone(), post_id.clone()).bloat_bond;

    assert_eq!(
        Content::delete_post(
            Origin::signed(sender),
            actor.clone(),
            thread_id.clone(),
            post_id.clone(),
        ),
        result
    );

    if result.is_ok() {
        // 1. Deposit event
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostDeleted(post_id, actor, thread_id))
        );

        // 2. Post Author is refunded
        if let ContentActor::Member(_) = actor {
            assert_eq!(
                balances::Module::<Test>::free_balance(sender) - balance_before,
                bond
            );
        }
    }
}

fn edit_post_mock(
    sender: <Test as frame_system::Trait>::AccountId,
    member_id: MemberId,
    thread_id: <Test as Trait>::ThreadId,
    post_id: <Test as Trait>::PostId,
    params: PostUpdateParameters,
    result: DispatchResult,
) {
    assert_eq!(
        Content::edit_post(
            Origin::signed(sender),
            member_id.clone(),
            thread_id.clone(),
            post_id.clone(),
            params.clone(),
        ),
        result
    );

    if result.is_ok() {
        // 1. Deposit event
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostUpdated(post_id, member_id, thread_id, params,))
        );
    }
}

fn react_post_mock(
    sender: <Test as frame_system::Trait>::AccountId,
    member_id: MemberId,
    reaction_id: <Test as Trait>::ReactionId,
    thread_id: <Test as Trait>::ThreadId,
    post_id: <Test as Trait>::PostId,
    channel_id: <Test as StorageOwnership>::ChannelId,
    result: DispatchResult,
) {
    assert_eq!(
        Content::react_post(
            Origin::signed(sender),
            member_id.clone(),
            thread_id.clone(),
            post_id.clone(),
            reaction_id.clone(),
            channel_id.clone(),
        ),
        result
    );

    if result.is_ok() {
        // 1. event is deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::PostReacted(
                post_id,
                member_id,
                thread_id,
                reaction_id,
            ))
        );
    }
}

fn react_thread_mock(
    sender: <Test as frame_system::Trait>::AccountId,
    member_id: MemberId,
    reaction_id: <Test as Trait>::ReactionId,
    thread_id: <Test as Trait>::ThreadId,
    channel_id: <Test as StorageOwnership>::ChannelId,
    result: DispatchResult,
) {
    assert_eq!(
        Content::react_thread(
            Origin::signed(sender),
            member_id.clone(),
            thread_id.clone(),
            reaction_id.clone(),
            channel_id.clone(),
        ),
        result
    );

    if result.is_ok() {
        // 1. event is deposited
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::content(RawEvent::ThreadReacted(
                thread_id,
                member_id,
                channel_id,
                reaction_id,
            ))
        );
    }
}

fn update_moderator_set_mock(
    sender: <Test as frame_system::Trait>::AccountId,
    actor: ContentActor<CuratorGroupId, CuratorId, MemberId>,
    channel_id: <Test as StorageOwnership>::ChannelId,
    member_id: MemberId,
    member_account_id: <Test as frame_system::Trait>::AccountId,
    op: ModSetOperation,
    result: DispatchResult,
) {
    let previous_num_of_moderators = Content::number_of_subreddit_moderators();
    assert_eq!(
        Content::update_moderator_set(
            Origin::signed(sender),
            actor.clone(),
            channel_id.clone(),
            member_id.clone(),
            member_account_id.clone(),
            op.clone(),
        ),
        result,
    );

    if result.is_ok() {
        match op {
            ModSetOperation::AddModerator => {
                assert_eq!(
                    Content::number_of_subreddit_moderators() - previous_num_of_moderators,
                    1
                );
                assert!(ModeratorSetForSubreddit::<Test>::contains_key(
                    channel_id, member_id
                ));
            }
            _ => {
                assert_eq!(
                    previous_num_of_moderators - Content::number_of_subreddit_moderators(),
                    1
                );
                assert!(!ModeratorSetForSubreddit::<Test>::contains_key(
                    channel_id, member_id
                ));
            }
        }
    }
}

#[test]
fn invalid_member_cannot_create_thread() {
    with_default_mock_builder(|| {
        func(UNKNOWN_ORIGIN);
        let channel_id = create_channel_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
                subreddit_mutable: true,
            },
            Ok(()),
        );
        let _ = create_thread_mock(
            UNKNOWN_ORIGIN,
            NOT_FORUM_MEMBER_ID,
            ThreadCreationParameters {
                title: b"title".to_vec(),
                post_text: b"text".to_vec(),
                post_mutable: true,
                channel_id: channel_id,
            },
            Err(Error::<Test>::MemberAuthFailed.into()),
        );
    })
}

#[test]
fn cannot_create_thread_with_invalid_channel_id() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);

        let _ = create_thread_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            ThreadCreationParameters {
                title: b"title".to_vec(),
                post_text: b"text".to_vec(),
                post_mutable: true,
                channel_id: INVALID_CHANNEL,
            },
            Err(Error::<Test>::ChannelDoesNotExist.into()),
        );
    })
}

#[test]
fn cannot_create_thread_on_immutable_subreddit() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);

        let channel_id = create_channel_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
                subreddit_mutable: false,
            },
            Ok(()),
        );

        let _ = create_thread_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            ThreadCreationParameters {
                title: b"title".to_vec(),
                post_text: b"text".to_vec(),
                post_mutable: true,
                channel_id: channel_id,
            },
            Err(Error::<Test>::SubredditCannotBeModified.into()),
        );
    })
}

#[test]
fn cannot_delete_invalid_thread() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);
        let _ = create_channel_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
                subreddit_mutable: true,
            },
            Ok(()),
        );

        let _ = delete_thread_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            INVALID_THREAD,
            Err(Error::<Test>::ThreadDoesNotExist.into()),
        );
    })
}

#[test]
fn non_author_or_invalid_member_cannot_delete_thread() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);
        let channel_id = create_channel_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
                subreddit_mutable: true,
            },
            Ok(()),
        );
        let thread_id = create_thread_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            ThreadCreationParameters {
                title: b"title".to_vec(),
                post_text: b"text".to_vec(),
                post_mutable: true,
                channel_id: channel_id,
            },
            Ok(()),
        );
        let _ = delete_thread_mock(
            UNKNOWN_ORIGIN,
            ContentActor::Member(NOT_FORUM_MEMBER_ID),
            thread_id,
            Err(Error::<Test>::MemberAuthFailed.into()),
        );
    })
}

#[test]
fn cannot_create_post_in_invalid_or_immutable_thread() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);
        let channel_id = create_channel_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
                subreddit_mutable: true,
            },
            Ok(()),
        );
        let thread_id = create_thread_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            ThreadCreationParameters {
                title: b"title".to_vec(),
                post_text: b"text".to_vec(),
                post_mutable: true,
                channel_id: channel_id,
            },
            Ok(()),
        );

        let _ = create_post_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            PostCreationParameters {
                text: vec![1, 2],
                mutable: true,
                thread_id: INVALID_THREAD,
            },
            Err(Error::<Test>::ThreadDoesNotExist.into()),
        );

        // make the subreddit immutable
        assert_ok!(Content::update_channel(
            Origin::signed(SECOND_MEMBER_ORIGIN),
            ContentActor::Member(SECOND_MEMBER_ID),
            channel_id,
            ChannelUpdateParameters {
                assets: None,
                new_meta: None,
                reward_account: None,
                subreddit_mutable: Some(false),
            },
        ));

        let _ = create_post_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            PostCreationParameters {
                text: vec![1, 2],
                mutable: true,
                thread_id: thread_id,
            },
            Err(Error::<Test>::SubredditCannotBeModified.into()),
        );
    })
}

#[test]
fn non_authorized_or_invalid_member_cannot_create_post() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);

        let channel_id = create_channel_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
                subreddit_mutable: true,
            },
            Ok(()),
        );
        let thread_id = create_thread_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            ThreadCreationParameters {
                title: b"title".to_vec(),
                post_text: b"text".to_vec(),
                post_mutable: true,
                channel_id: channel_id,
            },
            Ok(()),
        );

        let _ = create_post_mock(
            UNKNOWN_ORIGIN,
            NOT_FORUM_MEMBER_ID,
            PostCreationParameters {
                text: vec![1, 2],
                mutable: true,
                thread_id: thread_id,
            },
            Err(Error::<Test>::MemberAuthFailed.into()),
        );
    })
}

#[test]
fn non_author_or_invalid_member_cannot_edit_post() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);

        let channel_id = create_channel_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
                subreddit_mutable: true,
            },
            Ok(()),
        );
        let thread_id = create_thread_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            ThreadCreationParameters {
                title: b"title".to_vec(),
                post_text: b"text".to_vec(),
                post_mutable: true,
                channel_id: channel_id,
            },
            Ok(()),
        );

        let post_id = create_post_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            PostCreationParameters {
                text: vec![1, 2],
                mutable: true,
                thread_id: thread_id,
            },
            Ok(()),
        );

        let _ = edit_post_mock(
            UNKNOWN_ORIGIN,
            NOT_FORUM_MEMBER_ID,
            thread_id,
            post_id,
            PostUpdateParameters {
                text: None,
                mutable: None,
            },
            Err(Error::<Test>::MemberAuthFailed.into()),
        );

        let _ = edit_post_mock(
            SECOND_MEMBER_ORIGIN,
            SECOND_MEMBER_ID,
            thread_id,
            post_id,
            PostUpdateParameters {
                text: None,
                mutable: None,
            },
            Err(Error::<Test>::AccountDoesNotMatchPostAuthor.into()),
        );
    })
}

#[test]
fn cannot_edit_invalid_post() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);

        let channel_id = create_channel_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
                subreddit_mutable: true,
            },
            Ok(()),
        );
        let thread_id = create_thread_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            ThreadCreationParameters {
                title: b"title".to_vec(),
                post_text: b"text".to_vec(),
                post_mutable: true,
                channel_id: channel_id,
            },
            Ok(()),
        );

        let post_id = create_post_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            PostCreationParameters {
                text: vec![1, 2],
                mutable: true,
                thread_id: thread_id,
            },
            Ok(()),
        );

        let _ = edit_post_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            thread_id,
            INVALID_POST,
            PostUpdateParameters {
                text: None,
                mutable: None,
            },
            Err(Error::<Test>::PostDoesNotExist.into()),
        );

        let _ = edit_post_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            INVALID_THREAD,
            post_id,
            PostUpdateParameters {
                text: None,
                mutable: None,
            },
            Err(Error::<Test>::ThreadDoesNotExist.into()),
        );
    })
}

#[test]
fn non_author_or_invalid_member_cannot_delete_post() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);
        let channel_id = create_channel_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
                subreddit_mutable: true,
            },
            Ok(()),
        );
        let thread_id = create_thread_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            ThreadCreationParameters {
                title: b"title".to_vec(),
                post_text: b"text".to_vec(),
                post_mutable: true,
                channel_id: channel_id,
            },
            Ok(()),
        );

        let post_id = create_post_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            PostCreationParameters {
                text: vec![1, 2],
                mutable: true,
                thread_id: thread_id,
            },
            Ok(()),
        );

        let _ = delete_post_mock(
            UNKNOWN_ORIGIN,
            ContentActor::Member(NOT_FORUM_MEMBER_ID),
            thread_id,
            post_id,
            Err(Error::<Test>::ActorNotAuthorized.into()),
        );

        let _ = delete_post_mock(
            THIRD_MEMBER_ORIGIN,
            ContentActor::Member(THIRD_MEMBER_ID),
            thread_id,
            post_id,
            Err(Error::<Test>::ActorNotAuthorized.into()),
        );
    })
}

#[test]
fn cannot_delete_invalid_post() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);
        let channel_id = create_channel_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
                subreddit_mutable: true,
            },
            Ok(()),
        );
        let thread_id = create_thread_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            ThreadCreationParameters {
                title: b"title".to_vec(),
                post_text: b"text".to_vec(),
                post_mutable: true,
                channel_id: channel_id,
            },
            Ok(()),
        );

        let post_id = create_post_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            PostCreationParameters {
                text: vec![1, 2],
                mutable: true,
                thread_id: thread_id,
            },
            Ok(()),
        );

        let _ = delete_post_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            thread_id,
            INVALID_POST,
            Err(Error::<Test>::PostDoesNotExist.into()),
        );
        let _ = delete_post_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            INVALID_THREAD,
            post_id,
            Err(Error::<Test>::ThreadDoesNotExist.into()),
        );
    })
}

#[test]
fn verify_delete_post_effects() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);
        let channel_id = create_channel_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
                subreddit_mutable: true,
            },
            Ok(()),
        );
        let thread_id = create_thread_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            ThreadCreationParameters {
                title: b"title".to_vec(),
                post_text: b"text".to_vec(),
                post_mutable: true,
                channel_id: channel_id,
            },
            Ok(()),
        );

        let post_id = create_post_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            PostCreationParameters {
                text: vec![1, 2],
                mutable: true,
                thread_id: thread_id,
            },
            Ok(()),
        );

        let _ = delete_post_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            thread_id,
            post_id,
            Ok(()),
        );
    })
}
#[test]
fn invalid_forum_user_cannot_react_post_or_thread() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);
        let channel_id = create_channel_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
                subreddit_mutable: true,
            },
            Ok(()),
        );
        let thread_id = create_thread_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            ThreadCreationParameters {
                title: b"title".to_vec(),
                post_text: b"text".to_vec(),
                post_mutable: true,
                channel_id: channel_id,
            },
            Ok(()),
        );

        let post_id = create_post_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            PostCreationParameters {
                text: vec![1, 2],
                mutable: true,
                thread_id: thread_id,
            },
            Ok(()),
        );

        let _ = react_post_mock(
            UNKNOWN_ORIGIN,
            NOT_FORUM_MEMBER_ID,
            <Test as Trait>::ReactionId::from(1u64),
            thread_id,
            post_id,
            channel_id,
            Err(Error::<Test>::MemberAuthFailed.into()),
        );

        let _ = react_thread_mock(
            UNKNOWN_ORIGIN,
            NOT_FORUM_MEMBER_ID,
            <Test as Trait>::ReactionId::from(1u64),
            thread_id,
            channel_id,
            Err(Error::<Test>::MemberAuthFailed.into()),
        );
    })
}

#[test]
fn verify_react_post_and_thread_effects() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);
        let channel_id = create_channel_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
                subreddit_mutable: true,
            },
            Ok(()),
        );
        let thread_id = create_thread_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            ThreadCreationParameters {
                title: b"title".to_vec(),
                post_text: b"text".to_vec(),
                post_mutable: true,
                channel_id: channel_id,
            },
            Ok(()),
        );

        let post_id = create_post_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            PostCreationParameters {
                text: vec![1, 2],
                mutable: true,
                thread_id: thread_id,
            },
            Ok(()),
        );

        let _ = react_post_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            <Test as Trait>::ReactionId::from(1u64),
            thread_id,
            post_id,
            channel_id,
            Ok(()),
        );

        let _ = react_thread_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            <Test as Trait>::ReactionId::from(1u64),
            thread_id,
            channel_id,
            Ok(()),
        );
    })
}

#[test]
fn cannot_add_or_remove_invalid_moderator() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);
        let channel_id = create_channel_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
                subreddit_mutable: true,
            },
            Ok(()),
        );

        let _ = update_moderator_set_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            channel_id,
            NOT_FORUM_MEMBER_ID,
            UNKNOWN_ORIGIN,
            ModSetOperation::AddModerator,
            Err(Error::<Test>::MemberAuthFailed.into()),
        );
        let _ = update_moderator_set_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            channel_id,
            NOT_FORUM_MEMBER_ID,
            UNKNOWN_ORIGIN,
            ModSetOperation::AddModerator,
            Err(Error::<Test>::MemberAuthFailed.into()),
        );
    })
}

#[test]
fn cannot_add_or_remove_moderators_from_invalid_subreddits() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);
        let _ = update_moderator_set_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            INVALID_CHANNEL,
            FIRST_MEMBER_ID,
            FIRST_MEMBER_ORIGIN,
            ModSetOperation::AddModerator,
            Err(Error::<Test>::ChannelDoesNotExist.into()),
        );
    })
}

#[test]
fn non_owner_cannot_add_or_remove_moderators() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);

        let channel_id = create_channel_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
                subreddit_mutable: true,
            },
            Ok(()),
        );
        let _ = update_moderator_set_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            channel_id,
            FIRST_MEMBER_ID,
            FIRST_MEMBER_ORIGIN,
            ModSetOperation::AddModerator,
            Err(Error::<Test>::ActorNotAuthorized.into()),
        );
    })
}

#[test]
fn verify_update_moderators_effects() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);

        let channel_id = create_channel_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
                subreddit_mutable: true,
            },
            Ok(()),
        );
        update_moderator_set_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            channel_id,
            FIRST_MEMBER_ID,
            FIRST_MEMBER_ORIGIN,
            ModSetOperation::AddModerator,
            Ok(()),
        );

        update_moderator_set_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            channel_id,
            FIRST_MEMBER_ID,
            FIRST_MEMBER_ORIGIN,
            ModSetOperation::RemoveModerator,
            Ok(()),
        );
    })
}

#[test]
fn verify_delete_thread_effects() {
    with_default_mock_builder(|| {
        func(FIRST_MEMBER_ORIGIN);
        let channel_id = create_channel_mock(
            SECOND_MEMBER_ORIGIN,
            ContentActor::Member(SECOND_MEMBER_ID),
            ChannelCreationParameters {
                assets: vec![],
                meta: vec![],
                reward_account: None,
                subreddit_mutable: true,
            },
            Ok(()),
        );
        let thread_id = create_thread_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            ThreadCreationParameters {
                title: b"title".to_vec(),
                post_text: b"text".to_vec(),
                post_mutable: true,
                channel_id: channel_id,
            },
            Ok(()),
        );

        let _ = create_post_mock(
            FIRST_MEMBER_ORIGIN,
            FIRST_MEMBER_ID,
            PostCreationParameters {
                text: vec![1, 2],
                mutable: true,
                thread_id: thread_id,
            },
            Ok(()),
        );

        let _ = delete_thread_mock(
            FIRST_MEMBER_ORIGIN,
            ContentActor::Member(FIRST_MEMBER_ID),
            thread_id,
            Ok(()),
        );
    })
}
