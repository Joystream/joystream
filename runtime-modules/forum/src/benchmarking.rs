#![cfg(feature = "runtime-benchmarks")]
use super::*;
use frame_benchmarking::benchmarks;
use frame_support::assert_ok;
use frame_system::Module as System;
use frame_system::{EventRecord, RawOrigin};

const MAX_BYTES: u32 = 16384;

fn assert_last_event<T: Trait>(generic_event: <T as Trait>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn create_new_category<T: Trait>(
    account_id: T::AccountId,
    parent_category_id: Option<T::CategoryId>,
    title: Vec<u8>,
    description: Vec<u8>,
) -> T::CategoryId {
    assert_ok!(Module::<T>::create_category(
        RawOrigin::Signed(account_id).into(),
        parent_category_id,
        title,
        description
    ));
    Module::<T>::next_category_id() - T::CategoryId::one()
}

fn create_new_thread<T: Trait>(
    account_id: T::AccountId,
    forum_user_id: T::ForumUserId,
    category_id: T::CategoryId,
    title: Vec<u8>,
    text: Vec<u8>,
    poll: Option<Poll<T::Moment, T::Hash>>,
) -> T::ThreadId {
    assert_ok!(Module::<T>::create_thread(
        RawOrigin::Signed(account_id).into(),
        forum_user_id,
        category_id,
        title,
        text,
        poll
    ));
    Module::<T>::next_thread_id() - T::ThreadId::one()
}

fn add_thread_post<T: Trait>(
    account_id: T::AccountId,
    forum_user_id: T::ForumUserId,
    category_id: T::CategoryId,
    thread_id: T::ThreadId,
    text: Vec<u8>,
) -> T::PostId {
    assert_ok!(Module::<T>::add_post(
        RawOrigin::Signed(account_id).into(),
        forum_user_id,
        category_id,
        thread_id,
        text
    ));
    Module::<T>::next_post_id() - T::PostId::one()
}

pub fn good_poll_alternative_text() -> Vec<u8> {
    b"poll alternative".to_vec()
}

pub fn good_poll_description() -> Vec<u8> {
    b"poll description".to_vec()
}

pub fn generate_poll<T: Trait>(expiration_diff: T::Moment) -> Poll<T::Moment, T::Hash> {
    Poll {
        description_hash: T::calculate_hash(good_poll_description().as_slice()),
        end_time: pallet_timestamp::Module::<T>::now() + expiration_diff,
        poll_alternatives: {
            let mut alternatives = vec![];
            for _ in 0..5 {
                alternatives.push(PollAlternative {
                    alternative_text_hash: T::calculate_hash(
                        good_poll_alternative_text().as_slice(),
                    ),
                    vote_count: 0,
                });
            }
            alternatives
        },
    }
}

benchmarks! {
    _{ }

    create_category{
        let i in 1 .. (T::MaxCategoryDepth::get() - 1) as u32;

        let j in 0 .. MAX_BYTES;

        let text = vec![0u8].repeat(j as usize);

        let mut category_id = None;
        let mut parent_category_id = None;

        // Generate categories tree
        for n in 1..=i {
            if n > 1 {
                category_id = Some(((n - 1) as u64).into());
                parent_category_id = Some((n as u64).into());
            }

            assert_ok!(Module::<T>::create_category(
                RawOrigin::Signed(T::AccountId::default()).into(), category_id, text.clone(), text.clone()
            ));
        }

        let parent_category = if let Some(parent_category_id) = parent_category_id {
            Some(Module::<T>::category_by_id(parent_category_id))
        } else {
            None
        };

        let category_counter = <Module<T>>::category_counter();

    }: _ (RawOrigin::Signed(T::AccountId::default()), parent_category_id, text.clone(), text.clone())
    verify {

            let new_category = Category {
                title_hash: T::calculate_hash(text.as_slice()),
                description_hash: T::calculate_hash(text.as_slice()),
                archived: false,
                num_direct_subcategories: 0,
                num_direct_threads: 0,
                num_direct_moderators: 0,
                parent_category_id,
                sticky_thread_ids: vec![],
            };

            let category_id = Module::<T>::next_category_id() - T::CategoryId::one();
            assert_eq!(Module::<T>::category_by_id(category_id), new_category);
            assert_eq!(<Module<T>>::category_counter(), category_counter + T::CategoryId::one());

            if let (Some(parent_category), Some(parent_category_id)) = (parent_category, parent_category_id) {
                assert_eq!(
                    Module::<T>::category_by_id(parent_category_id).num_direct_subcategories,
                    parent_category.num_direct_subcategories + 1
                );
            }
            assert_last_event::<T>(RawEvent::CategoryCreated(category_id).into());
    }
    update_category_membership_of_moderator{
        let i in 0 .. 1;

        let text = vec![0u8];

        // Create category
        let category_id = create_new_category::<T>(T::AccountId::default(), None, text.clone(), text.clone());

        let new_value_flag = if i == 0 {
            true
        } else {
            assert_ok!(
                Module::<T>::update_category_membership_of_moderator(RawOrigin::Signed(T::AccountId::default()).into(), T::ModeratorId::one(), category_id, true)
            );
            false
        };

    }: _ (RawOrigin::Signed(T::AccountId::default()), T::ModeratorId::one(), category_id, new_value_flag)
    verify {
        let num_direct_moderators = if new_value_flag {
            1
        } else {
            0
        };

        let new_category = Category {
            title_hash: T::calculate_hash(text.as_slice()),
            description_hash: T::calculate_hash(text.as_slice()),
            archived: false,
            num_direct_subcategories: 0,
            num_direct_threads: 0,
            num_direct_moderators,
            parent_category_id: None,
            sticky_thread_ids: vec![],
        };

        assert_eq!(Module::<T>::category_by_id(category_id), new_category);
        assert_last_event::<T>(RawEvent::CategoryMembershipOfModeratorUpdated(T::ModeratorId::one(), category_id, new_value_flag).into());

    }
    update_category_archival_status{
        let text = vec![0u8];

        let new_archival_status = true;

        // Create category
        let category_id = create_new_category::<T>(T::AccountId::default(), None, text.clone(), text.clone());

    }: _ (RawOrigin::Signed(T::AccountId::default()), PrivilegedActor::Lead, category_id, new_archival_status)
    verify {
        let new_category = Category {
            title_hash: T::calculate_hash(text.as_slice()),
            description_hash: T::calculate_hash(text.as_slice()),
            archived: new_archival_status,
            num_direct_subcategories: 0,
            num_direct_threads: 0,
            num_direct_moderators: 0,
            parent_category_id: None,
            sticky_thread_ids: vec![],
        };

        assert_eq!(Module::<T>::category_by_id(category_id), new_category);
        assert_last_event::<T>(RawEvent::CategoryUpdated(category_id, new_archival_status).into());
    }
    delete_category {
        let text = vec![0u8];

        // Create parent category
        let parent_category_id = create_new_category::<T>(T::AccountId::default(), None, text.clone(), text.clone());

        // Create category
        let category_id = create_new_category::<T>(T::AccountId::default(), Some(parent_category_id), text.clone(), text.clone());

        let category_counter = <Module<T>>::category_counter();

    }: _ (RawOrigin::Signed(T::AccountId::default()), PrivilegedActor::Lead, category_id)
    verify {
        let new_category = Category {
            title_hash: T::calculate_hash(text.as_slice()),
            description_hash: T::calculate_hash(text.as_slice()),
            archived: false,
            num_direct_subcategories: 0,
            num_direct_threads: 0,
            num_direct_moderators: 0,
            parent_category_id: None,
            sticky_thread_ids: vec![],
        };

        // Ensure number of direct subcategories for parent category decremented successfully
        assert_eq!(Module::<T>::category_by_id(parent_category_id), new_category);

        assert_eq!(<Module<T>>::category_counter(), category_counter - T::CategoryId::one());

        // Ensure category removed successfully
        assert!(!<CategoryById<T>>::contains_key(category_id));

        assert_last_event::<T>(RawEvent::CategoryDeleted(category_id).into());
    }
    create_thread {
        let j in 0 .. MAX_BYTES;

        // Create category
        let category_id = create_new_category::<T>(T::AccountId::default(), None, vec![0u8], vec![0u8]);
        let mut category = Module::<T>::category_by_id(category_id);

        let text = vec![0u8].repeat(j as usize);

        let expiration_diff = 10.into();
        let poll = Some(generate_poll::<T>(expiration_diff));

        let next_thread_id = Module::<T>::next_thread_id();
        let next_post_id = Module::<T>::next_post_id();

    }: _ (RawOrigin::Signed(T::AccountId::default()), T::ForumUserId::default(), category_id, text.clone(), text.clone(), poll.clone())
    verify {

        // Ensure category num_direct_threads updated successfully.
        category.num_direct_threads+=1;
        assert_eq!(Module::<T>::category_by_id(category_id), category);

        // Ensure new thread created successfully
        let new_thread = Thread {
            category_id,
            title_hash: T::calculate_hash(&text),
            author_id: T::ForumUserId::default(),
            archived: false,
            poll,
            // initial posts number
            num_direct_posts: 1,
        };
        assert_eq!(Module::<T>::thread_by_id(category_id, next_thread_id), new_thread);
        assert_eq!(Module::<T>::next_thread_id(), next_thread_id + T::ThreadId::one());

        // Ensure initial post added successfully
        let new_post = Post {
            thread_id: next_thread_id,
            text_hash: T::calculate_hash(&text),
            author_id: T::ForumUserId::default(),
        };

        assert_eq!(Module::<T>::post_by_id(next_thread_id, next_post_id), new_post);
        assert_eq!(Module::<T>::next_post_id(), next_post_id + T::PostId::one());

        assert_last_event::<T>(RawEvent::ThreadCreated(next_thread_id).into());
    }
    edit_thread_title {
        let j in 0 .. MAX_BYTES;

        // Create category
        let category_id = create_new_category::<T>(T::AccountId::default(), None, vec![0u8], vec![0u8]);

        // Create thread
        let thread_id = create_new_thread::<T>(T::AccountId::default(), T::ForumUserId::default(), category_id, vec![1u8], vec![1u8], None);
        let mut thread = Module::<T>::thread_by_id(category_id, thread_id);

        let text = vec![0u8].repeat(j as usize);

    }: _ (RawOrigin::Signed(T::AccountId::default()), T::ForumUserId::default(), category_id, thread_id, text.clone())
    verify {
        thread.title_hash = T::calculate_hash(&text);
        assert_eq!(Module::<T>::thread_by_id(category_id, thread_id), thread);

        assert_last_event::<T>(RawEvent::ThreadTitleUpdated(thread_id).into());
    }
    update_thread_archival_status {
        // Create category
        let category_id = create_new_category::<T>(T::AccountId::default(), None, vec![0u8], vec![0u8]);

        // Create thread
        let thread_id = create_new_thread::<T>(T::AccountId::default(), T::ForumUserId::default(), category_id, vec![1u8], vec![1u8], None);
        let mut thread = Module::<T>::thread_by_id(category_id, thread_id);
        let new_archival_status = true;

    }: _ (RawOrigin::Signed(T::AccountId::default()), PrivilegedActor::Lead, category_id, thread_id, new_archival_status)
    verify {
        thread.archived = new_archival_status;

        assert_eq!(Module::<T>::thread_by_id(category_id, thread_id), thread);

        assert_last_event::<T>(RawEvent::ThreadUpdated(thread_id, new_archival_status).into());
    }
    delete_thread {
        // Create category
        let category_id = create_new_category::<T>(T::AccountId::default(), None, vec![0u8], vec![0u8]);

        // Create thread
        let expiration_diff = 10.into();
        let poll = Some(generate_poll::<T>(expiration_diff));

        let thread_id = create_new_thread::<T>(
            T::AccountId::default(), T::ForumUserId::default(), category_id,
            vec![1u8].repeat(MAX_BYTES as usize), vec![1u8].repeat(MAX_BYTES as usize), poll
        );

        let mut category = Module::<T>::category_by_id(category_id);

        for _ in 0..<<<T as Trait>::MapLimits as StorageLimits>::MaxPostsInThread>::get() - 1 {
            add_thread_post::<T>(T::AccountId::default(), T::ForumUserId::default(), category_id, thread_id, vec![1u8].repeat(MAX_BYTES as usize));
        }

    }: _ (RawOrigin::Signed(T::AccountId::default()), PrivilegedActor::Lead, category_id, thread_id)
    verify {
        // Ensure category num_direct_threads updated successfully.
        category.num_direct_threads-=1;
        assert_eq!(Module::<T>::category_by_id(category_id), category);

        // Ensure thread was successfully deleted
        assert!(!<ThreadById<T>>::contains_key(category_id, thread_id));
        assert_eq!(<PostById<T>>::iter_prefix_values(thread_id).count(), 0);

        assert_last_event::<T>(RawEvent::ThreadDeleted(thread_id).into());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mock::*;

    #[test]
    fn test_create_category() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_create_category::<Runtime>());
        });
    }

    #[test]
    fn test_update_category_membership_of_moderator() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_update_category_membership_of_moderator::<
                Runtime,
            >());
        });
    }

    #[test]
    fn test_update_category_archival_status() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_update_category_archival_status::<Runtime>());
        });
    }

    #[test]
    fn test_delete_category() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_delete_category::<Runtime>());
        });
    }

    #[test]
    fn test_create_thread() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_create_thread::<Runtime>());
        });
    }

    #[test]
    fn test_edit_thread_title() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_edit_thread_title::<Runtime>());
        });
    }

    #[test]
    fn test_update_thread_archival_status() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_update_thread_archival_status::<Runtime>());
        });
    }

    #[test]
    fn test_delete_thread() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_delete_thread::<Runtime>());
        });
    }
}
