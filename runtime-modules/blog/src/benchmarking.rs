#![cfg(feature = "runtime-benchmarks")]
use super::*;
use frame_benchmarking::{benchmarks_instance, Zero};
use frame_system::Module as System;
use frame_system::{EventRecord, RawOrigin};
use sp_std::convert::TryInto;
use Module as Blog;

const MAX_BYTES: u32 = 16384;

fn assert_last_event<T: Trait<I>, I: Instance>(generic_event: <T as Trait<I>>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();

    assert!(!events.is_empty(), "There are no events in event queue");

    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn get_blog_owner<T: Trait<I>, I: Instance>() -> T::AccountId {
    T::AccountId::default()
}

fn generate_post<T: Trait<I>, I: Instance>() -> (T::AccountId, T::PostId) {
    let caller_id = get_blog_owner::<T, I>();
    assert_eq!(Blog::<T, I>::post_count(), Zero::zero());

    Blog::<T, I>::create_post(
        RawOrigin::Signed(caller_id.clone()).into(),
        vec![0u8],
        vec![0u8],
    )
    .unwrap();

    let post_id = T::PostId::zero();

    assert_eq!(Blog::<T, I>::post_count(), One::one());

    assert!(Blog::<T, I>::post_by_id(post_id) == Post::<T, I>::new(vec![0u8], vec![0u8]));

    (caller_id, post_id)
}

fn generate_reply<T: Trait<I>, I: Instance>(
    creator_id: T::AccountId,
    post_id: T::PostId,
) -> T::ReplyId {
    let creator_origin = RawOrigin::Signed(creator_id);
    let participant_id = Blog::<T, I>::get_participant(creator_origin.clone().into()).unwrap();
    Blog::<T, I>::create_reply(creator_origin.clone().into(), post_id, None, vec![0u8]).unwrap();

    assert!(
        Blog::<T, I>::reply_by_id(post_id, T::ReplyId::zero())
            == Reply::<T, I>::new(vec![0u8], participant_id, ParentId::Post(post_id))
    );

    T::ReplyId::zero()
}

benchmarks_instance! {
    _ {}
    create_post {
        let t in 0 .. MAX_BYTES;
        let b in 0 .. MAX_BYTES;
        let caller_id = get_blog_owner::<T, I>();
        assert_eq!(Blog::<T, I>::post_count(), Zero::zero());

    }:_(RawOrigin::Signed(caller_id), vec![0u8; t.try_into().unwrap()], vec![0u8; b.try_into().unwrap()])
    verify {
        assert_eq!(Blog::<T, I>::post_count(), One::one());

        assert!(
            Blog::<T, I>::post_by_id(T::PostId::zero()) ==
            Post::<T, I>::new(vec![0u8; t.try_into().unwrap()], vec![0u8; b.try_into().unwrap()])
        );

        assert_last_event::<T, I>(RawEvent::PostCreated(T::PostId::zero()).into());
    }

    lock_post {
        let (creator_id, post_id) = generate_post::<T, I>();
    }: _(RawOrigin::Signed(creator_id), post_id)
    verify {
        assert!(Blog::<T, I>::post_by_id(post_id).is_locked());
        assert_last_event::<T, I>(RawEvent::PostLocked(post_id).into());
    }

    unlock_post {
        let (creator_id, post_id) = generate_post::<T, I>();
        Blog::<T, I>::lock_post(RawOrigin::Signed(creator_id.clone()).into(), post_id).unwrap();
        assert!(Blog::<T, I>::post_by_id(post_id).is_locked());
    }: _(RawOrigin::Signed(creator_id), post_id)
    verify {
        assert!(!Blog::<T, I>::post_by_id(post_id).is_locked());
        assert_last_event::<T, I>(RawEvent::PostUnlocked(post_id).into());
    }

    edit_post {
        let t in 0 .. MAX_BYTES;
        let b in 0 .. MAX_BYTES;

        let (creator_id, post_id) = generate_post::<T, I>();
    }: _(
        RawOrigin::Signed(creator_id),
        post_id,
        Some(vec![1u8; t.try_into().unwrap()]),
        Some(vec![1u8; b.try_into().unwrap()])
    )
    verify {
        assert!(
            Blog::<T, I>::post_by_id(post_id) ==
            Post::<T, I>::new(vec![1u8; t.try_into().unwrap()], vec![1u8; b.try_into().unwrap()])
        );
        assert_last_event::<T, I>(RawEvent::PostEdited(post_id).into());

    }

    create_reply_to_post {
        let t in 0 .. MAX_BYTES;

        let (creator_id, post_id) = generate_post::<T, I>();
        let creator_origin = RawOrigin::Signed(creator_id);
    }: create_reply(
        creator_origin.clone(),
        post_id,
        None,
        vec![0u8; t.try_into().unwrap()]
    )
    verify {
        let mut expected_post = Post::<T, I>::new(vec![0u8], vec![0u8]);
        let participant_id = Blog::<T, I>::get_participant(creator_origin.into()).unwrap();
        expected_post.increment_replies_counter();
        assert!(Blog::<T, I>::post_by_id(post_id) == expected_post);
        assert!(
            Blog::<T, I>::reply_by_id(post_id, T::ReplyId::zero()) ==
            Reply::<T, I>::new(
                vec![0u8; t.try_into().unwrap()],
                participant_id,
                ParentId::Post(post_id)
            )
        );

        assert_last_event::<T, I>(RawEvent::ReplyCreated(participant_id, post_id, Zero::zero()).into());
    }

    create_reply_to_reply {
        let t in 0 .. MAX_BYTES;

        let (creator_id, post_id) = generate_post::<T, I>();
        let reply_id = generate_reply::<T, I>(creator_id.clone(), post_id.clone());
        let creator_origin = RawOrigin::Signed(creator_id);
        let mut expected_post = Post::<T, I>::new(vec![0u8], vec![0u8]);
        expected_post.increment_replies_counter();
        assert!(Blog::<T, I>::post_by_id(post_id) == expected_post);
    }: create_reply(
        creator_origin.clone(),
        post_id,
        Some(reply_id),
        vec![0u8; t.try_into().unwrap()]
    )
    verify {
        let participant_id = Blog::<T, I>::get_participant(
            creator_origin.clone().into()
        ).unwrap();
        expected_post.increment_replies_counter();
        assert!(Blog::<T, I>::post_by_id(post_id) == expected_post);
        assert!(
            Blog::<T, I>::reply_by_id(post_id, T::ReplyId::one()) ==
            Reply::<T, I>::new(
                vec![0u8; t.try_into().unwrap()],
                participant_id,
                ParentId::Reply(reply_id)
            )
        );

        assert_last_event::<T, I>(
            RawEvent::DirectReplyCreated(participant_id, post_id, reply_id, One::one()).into()
        );
    }

    edit_reply {
        let t in 0 .. MAX_BYTES;

        let (creator_id, post_id) = generate_post::<T, I>();
        let reply_id = generate_reply::<T, I>(creator_id.clone(), post_id.clone());
        let creator_origin = RawOrigin::Signed(creator_id);
    }: _(
        creator_origin.clone(),
        post_id,
        reply_id,
        vec![1u8; t.try_into().unwrap()]
    )
    verify {
        let participant_id = Blog::<T, I>::get_participant(
            creator_origin.clone().into()
        ).unwrap();
        assert_eq!(
            Blog::<T, I>::reply_by_id(post_id, reply_id).text_hash,
            T::Hashing::hash(&vec![1u8; t.try_into().unwrap()])
        );
        assert!(
            Blog::<T, I>::reply_by_id(post_id, reply_id) ==
            Reply::<T, I>::new(
                vec![1u8; t.try_into().unwrap()],
                participant_id,
                ParentId::Post(post_id)
            )
        );

        assert_last_event::<T, I>(RawEvent::ReplyEdited(post_id, reply_id).into());
    }

    react_to_post {
        let (creator_id, post_id) = generate_post::<T, I>();
        let creator_origin = RawOrigin::Signed(creator_id);
    }: react(
        creator_origin.clone(),
        0,
        post_id,
        None
        )
    verify {
        let owner = Blog::<T, I>::get_participant(
            creator_origin.clone().into()
        ).unwrap();
        assert_last_event::<T, I>(RawEvent::PostReactionsUpdated(owner, post_id, 0).into());
    }

    react_to_reply {
        let (creator_id, post_id) = generate_post::<T, I>();
        let reply_id = generate_reply::<T, I>(creator_id.clone(), post_id.clone());
        let creator_origin = RawOrigin::Signed(creator_id);
    }: react(
        creator_origin.clone(),
        0,
        post_id,
        Some(reply_id)
    )
    verify {
        let owner = Blog::<T, I>::get_participant(
            creator_origin.clone().into()
        ).unwrap();
        assert_last_event::<T, I>(
            RawEvent::ReplyReactionsUpdated(owner, post_id, reply_id, 0).into()
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mock::{ExtBuilder, Runtime};
    use frame_support::assert_ok;

    #[test]
    fn test_create_post() {
        ExtBuilder::default().build().execute_with(|| {
            assert_ok!(test_benchmark_create_post::<Runtime>());
        })
    }

    #[test]
    fn test_lock_post() {
        ExtBuilder::default().build().execute_with(|| {
            assert_ok!(test_benchmark_lock_post::<Runtime>());
        })
    }

    #[test]
    fn test_unlock_post() {
        ExtBuilder::default().build().execute_with(|| {
            assert_ok!(test_benchmark_unlock_post::<Runtime>());
        })
    }

    #[test]
    fn test_edit_post() {
        ExtBuilder::default().build().execute_with(|| {
            assert_ok!(test_benchmark_edit_post::<Runtime>());
        })
    }

    #[test]
    fn test_create_reply_to_post() {
        ExtBuilder::default().build().execute_with(|| {
            assert_ok!(test_benchmark_create_reply_to_post::<Runtime>());
        })
    }

    #[test]
    fn test_create_reply_to_reply() {
        ExtBuilder::default().build().execute_with(|| {
            assert_ok!(test_benchmark_create_reply_to_reply::<Runtime>());
        })
    }

    #[test]
    fn test_edit_reply() {
        ExtBuilder::default().build().execute_with(|| {
            assert_ok!(test_benchmark_edit_reply::<Runtime>());
        })
    }

    #[test]
    fn test_react_to_post() {
        ExtBuilder::default().build().execute_with(|| {
            assert_ok!(test_benchmark_react_to_post::<Runtime>());
        })
    }
}
