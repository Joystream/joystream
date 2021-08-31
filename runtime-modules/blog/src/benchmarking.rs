#![cfg(feature = "runtime-benchmarks")]
use super::*;
use balances::Module as Balances;
use frame_benchmarking::{account, benchmarks_instance, Zero};
use frame_support::traits::Currency;
use frame_system::Module as System;
use frame_system::{EventRecord, RawOrigin};
use membership::Module as Membership;
use sp_runtime::traits::Bounded;
use sp_std::convert::TryInto;
use Module as Blog;

const MAX_BYTES: u32 = 16384;
const SEED: u32 = 0;

fn assert_last_event<T: Config<I>, I: Instance>(generic_event: <T as Config<I>>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Config>::Event = generic_event.into();

    assert!(!events.is_empty(), "There are no events in event queue");

    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn assert_in_events<T: Config<I>, I: Instance>(generic_event: <T as Config<I>>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Config>::Event = generic_event.into();

    assert!(!events.is_empty(), "There are no events in event queue");

    // compare to the last event record
    assert!(events.iter().any(|e| e.event == system_event));
}

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> (8 * byte_number)) as u8
}

fn member_funded_account<T: Config<I> + membership::Config + balances::Config, I: Instance>(
    name: &'static str,
    id: u32,
) -> (T::AccountId, T::MemberId) {
    let account_id = account::<T::AccountId>(name, id, SEED);
    let handle = handle_from_id::<T>(id);

    let _ = Balances::<T>::make_free_balance_be(
        &account_id,
        <T as balances::Config>::Balance::max_value(),
    );

    let params = membership::BuyMembershipParameters {
        root_account: account_id.clone(),
        controller_account: account_id.clone(),
        handle: Some(handle),
        metadata: Vec::new(),
        referrer_id: None,
    };

    Membership::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();

    let member_id = T::MemberId::from(id.try_into().unwrap());
    Membership::<T>::add_staking_account_candidate(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id,
    )
    .unwrap();
    Membership::<T>::confirm_staking_account(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id,
        account_id.clone(),
    )
    .unwrap();

    (account_id, member_id)
}

// Method to generate a distintic valid handle
// for a membership. For each index.
fn handle_from_id<T: membership::Config>(id: u32) -> Vec<u8> {
    let min_handle_length = 1;

    let mut handle = vec![];

    for i in 0..4 {
        handle.push(get_byte(id, i));
    }

    while handle.len() < (min_handle_length as usize) {
        handle.push(0u8);
    }

    handle
}

fn generate_post<T: Config<I>, I: Instance>(seq_num: u64) -> PostId {
    assert_eq!(Blog::<T, I>::post_count(), seq_num);

    Blog::<T, I>::create_post(RawOrigin::Root.into(), vec![0u8], vec![0u8]).unwrap();

    let post_id = seq_num;

    assert_eq!(Blog::<T, I>::post_count(), seq_num + 1);

    assert_eq!(
        Blog::<T, I>::post_by_id(post_id),
        Post::<T, I>::new(&[0u8], &[0u8])
    );

    post_id
}

fn generate_reply<T: Config<I>, I: Instance>(
    creator_id: T::AccountId,
    participant_id: ParticipantId<T>,
    post_id: PostId,
) -> T::ReplyId {
    let creator_origin = RawOrigin::Signed(creator_id);
    Blog::<T, I>::create_reply(
        creator_origin.into(),
        participant_id,
        post_id,
        None,
        vec![0u8],
        true,
    )
    .unwrap();

    assert_eq!(
        Blog::<T, I>::reply_by_id(post_id, T::ReplyId::zero()),
        Reply::<T, I>::new(
            vec![0u8],
            participant_id,
            ParentId::Post(post_id),
            T::ReplyDeposit::get()
        )
    );

    T::ReplyId::zero()
}

benchmarks_instance! {
    where_clause { where T: balances::Config, T: membership::Config }

    create_post {
        let t in 0 .. MAX_BYTES;
        let b in 0 .. MAX_BYTES;
        assert_eq!(Blog::<T, I>::post_count(), 0);
        let title = vec![0u8; t.try_into().unwrap()];
        let body = vec![0u8; b.try_into().unwrap()];
        let post_id = Blog::<T, I>::post_count();

    }:_(RawOrigin::Root, title.clone(), body.clone())
    verify {
        assert_eq!(Blog::<T, I>::post_count(), post_id + 1);

        assert_eq!(
            Blog::<T, I>::post_by_id(post_id),
            Post::<T, I>::new(&title, &body)
        );

        assert_last_event::<T, I>(RawEvent::PostCreated(
                0,
                title,
                body
            ).into());
    }

    lock_post {
        let post_id = generate_post::<T, I>(0);
    }: _(RawOrigin::Root, post_id)
    verify {
        assert!(Blog::<T, I>::post_by_id(post_id).is_locked());
        assert_last_event::<T, I>(RawEvent::PostLocked(post_id).into());
    }

    unlock_post {
        let post_id = generate_post::<T, I>(0);
        Blog::<T, I>::lock_post(RawOrigin::Root.into(), post_id).unwrap();
        assert!(Blog::<T, I>::post_by_id(post_id).is_locked());
    }: _(RawOrigin::Root, post_id)
    verify {
        assert!(!Blog::<T, I>::post_by_id(post_id).is_locked());
        assert_last_event::<T, I>(RawEvent::PostUnlocked(post_id).into());
    }

    edit_post {
        let t in 0 .. MAX_BYTES;
        let b in 0 .. MAX_BYTES;

        let post_id = generate_post::<T, I>(0);
        let title = Some(vec![1u8; t.try_into().unwrap()]);
        let body = Some(vec![1u8; b.try_into().unwrap()]);
    }: _(RawOrigin::Root, post_id, title.clone(), body.clone())
    verify {
        assert_eq!(
            Blog::<T, I>::post_by_id(post_id),
            Post::<T, I>::new(&vec![1u8; t.try_into().unwrap()], &vec![1u8; b.try_into().unwrap()])
        );
        assert_last_event::<T, I>(RawEvent::PostEdited(post_id, title, body).into());
    }

    create_reply_to_post {
        let t in 0 .. MAX_BYTES;

        let post_id = generate_post::<T, I>(0);
        let (account_id, participant_id) = member_funded_account::<T, I>("caller", 0);
        let origin = RawOrigin::Signed(account_id);
        let text = vec![0u8; t.try_into().unwrap()];
    }: create_reply(origin.clone(), participant_id, post_id, None, text.clone(), true)
    verify {
        let mut expected_post = Post::<T, I>::new(&[0u8], &[0u8]);
        expected_post.increment_replies_counter();
        assert_eq!(Blog::<T, I>::post_by_id(post_id), expected_post);
        assert_eq!(
            Blog::<T, I>::reply_by_id(post_id, T::ReplyId::zero()),
            Reply::<T, I>::new(
                text.clone(),
                participant_id,
                ParentId::Post(post_id),
                T::ReplyDeposit::get(),
            )
        );

        assert_last_event::<T, I>(
            RawEvent::ReplyCreated(
                participant_id,
                post_id,
                Zero::zero(),
                text,
                true
            ).into()
        );
    }

    create_reply_to_reply {
        let t in 0 .. MAX_BYTES;

        let post_id = generate_post::<T, I>(0);
        let (account_id, participant_id) = member_funded_account::<T, I>("caller", 0);
        let reply_id = generate_reply::<T, I>(account_id.clone(), participant_id, post_id);
        let origin = RawOrigin::Signed(account_id);
        let mut expected_post = Post::<T, I>::new(&[0u8], &[0u8]);
        expected_post.increment_replies_counter();
        assert_eq!(Blog::<T, I>::post_by_id(post_id), expected_post);
        let text = vec![0u8; t.try_into().unwrap()];
    }: create_reply(origin.clone(), participant_id, post_id, Some(reply_id), text.clone(), true)
    verify {
        expected_post.increment_replies_counter();
        assert_eq!(Blog::<T, I>::post_by_id(post_id), expected_post);
        assert_eq!(
            Blog::<T, I>::reply_by_id(post_id, T::ReplyId::one()),
            Reply::<T, I>::new(
                text.clone(),
                participant_id,
                ParentId::Reply(reply_id),
                T::ReplyDeposit::get(),
            )
        );

        assert_last_event::<T, I>(
            RawEvent::DirectReplyCreated(
                participant_id,
                post_id,
                reply_id,
                One::one(),
                text,
                true,
            ).into()
        );
    }

    edit_reply {
        let t in 0 .. MAX_BYTES;

        let post_id = generate_post::<T, I>(0);
        let (account_id, participant_id) = member_funded_account::<T, I>("caller", 0);
        let reply_id = generate_reply::<T, I>(account_id.clone(), participant_id, post_id);
        let origin = RawOrigin::Signed(account_id);
        let updated_text = vec![1u8; t.try_into().unwrap()];
    }: _(origin.clone(), participant_id, post_id, reply_id, updated_text.clone())
    verify {
        assert_eq!(
            Blog::<T, I>::reply_by_id(post_id, reply_id).text_hash,
            T::Hashing::hash(&updated_text)
        );
        assert_eq!(
            Blog::<T, I>::reply_by_id(post_id, reply_id),
            Reply::<T, I>::new(
                updated_text.clone(),
                participant_id,
                ParentId::Post(post_id),
                T::ReplyDeposit::get(),
            )
        );

        assert_last_event::<T, I>(RawEvent::ReplyEdited(
                participant_id,
                post_id,
                reply_id,
                updated_text
            ).into());
    }

    delete_replies {
        let i in 1 .. T::PostsMaxNumber::get().try_into().unwrap();
        let (account_id, participant_id) = member_funded_account::<T, I>("caller", 0);
        let mut replies = Vec::new();
        let hide = false;

        for seq_num in 0..i {
            let post_id = generate_post::<T, I>(seq_num.into());
            let reply_id =
                generate_reply::<T, I>(account_id.clone(), participant_id, post_id);
            replies.push(ReplyToDelete {post_id, reply_id, hide});
        }

        let origin = RawOrigin::Signed(account_id);
    }: _(origin.clone(), participant_id, replies.clone())
    verify {
        for ReplyToDelete {post_id, reply_id, hide} in replies {
            assert!(!<ReplyById<T, I>>::contains_key(post_id, reply_id));

            assert_in_events::<T, I>(RawEvent::ReplyDeleted(
                    participant_id,
                    post_id,
                    reply_id,
                    hide,
                ).into());
        }
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
    fn test_delete_replies() {
        ExtBuilder::default().build().execute_with(|| {
            assert_ok!(test_benchmark_delete_replies::<Runtime>());
        })
    }
}
