// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

#[cfg(feature = "std")]
use serde_derive::{Deserialize, Serialize};

use codec::{Decode, Encode};
pub use new_forum;
pub use old_forum;

pub use new_forum::*;
use old_forum::{Category as OldCategory, Post as OldPost, Thread as OldThread};
use rstd::prelude::*;
pub use runtime_io::clear_prefix;
use runtime_primitives;
use runtime_primitives::traits::One;
use srml_support::{decl_event, decl_module, decl_storage};

const DEFAULT_FORUM_USER_NAME: &str = "default forum user name";
const DEFAULT_FORUM_USER_SELF_INTRODUCTION: &str = "default forum user self introduction";
const DEFAULT_MODERATOR_NAME: &str = "default moderator name";
const DEFAULT_MODERATOR_SELF_INTRODUCTION: &str = "default moderator self introduction";

mod mock;
mod tests;

/// Structure include all configuration related to data migration
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Clone, PartialEq, Eq)]
pub struct DataMigrationConfigStruct {
    pub migrate_on_block_number: u32,
    pub max_categories_imported_per_block: u64,
    pub max_threads_imported_per_block: u64,
    pub max_posts_imported_per_block: u64,
}

// Implement default to set a high block number to avoid migration start immediately
impl Default for DataMigrationConfigStruct {
    fn default() -> DataMigrationConfigStruct {
        DataMigrationConfigStruct {
            migrate_on_block_number: std::u32::MAX,
            max_categories_imported_per_block: std::u64::MAX,
            max_threads_imported_per_block: std::u64::MAX,
            max_posts_imported_per_block: std::u64::MAX,
        }
    }
}

pub trait Trait:
    system::Trait + old_forum::Trait + new_forum::Trait + timestamp::Trait + Sized
{
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_event!(
    pub enum Event<T> 
    where
        <T as system::Trait>::BlockNumber,
    {
        /// Data migration is done
        DataMigrationDone(BlockNumber),
    }
);

decl_storage! {
    trait Store for Module<T: Trait> as ForumDataMigration {
        /// Block number to start migration
        pub DataMigrationConfig get(migration_config) config(): DataMigrationConfigStruct;

        /// Account id to forum user id
        pub AccountByForumUserId get(account_by_forum_user_id): map T::AccountId => T::ForumUserId;

        /// Account id to moderator id
        pub AccountByModeratorId get(account_by_moderator_id): map T::AccountId => T::ModeratorId;

        /// Data migration process finished
        pub DataMigrationDone get(data_migration_done): bool;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        fn on_initialize(n: T::BlockNumber) {
            // start data migration until it is done.
            if n < DataMigrationConfig::get().migrate_on_block_number.into() || DataMigrationDone::get() {
                return;
            }

            // for debug
            // println!("compare category id {:?}, {:?}", old_forum::NextCategoryId::get(), <new_forum::NextCategoryId<T>>::get());
            // println!("compare thread id {:?}, {:?}", old_forum::NextThreadId::get(), <new_forum::NextThreadId<T>>::get());
            // println!("compare post id {:?}, {:?}", old_forum::NextPostId::get(), <new_forum::NextPostId<T>>::get());

            // Check if all data migrated from old forum.
            if Self::migrate_category() && Self::migrate_thread() && Self::migrate_post() {
                // set data migration done
                DataMigrationDone::mutate(|value| *value = true);
                new_forum::DataMigrationDone::mutate(|value| *value = true);

                // Generate event
                Self::deposit_event(RawEvent::DataMigrationDone(n));
            }
        }
    }
}

impl<T: Trait> Module<T> {
    pub fn create_migration_data(
        account_id: T::AccountId,
        thread_number: u32,
        post_number: u32,
        text: Vec<u8>,
    ) {
        let next_category_id: u64 = old_forum::NextCategoryId::get();
        <old_forum::CategoryById<T>>::mutate(next_category_id, |value| {
            *value = old_forum::Category {
                id: next_category_id,
                title: "default category title".as_bytes().to_vec(),
                description: "default category description".as_bytes().to_vec(),
                created_at: Default::default(),
                deleted: false,
                archived: false,
                num_direct_subcategories: 0,
                num_direct_unmoderated_threads: 0,
                num_direct_moderated_threads: 0,
                position_in_parent_category: None,
                moderator_id: account_id.clone(),
            }
        });
        old_forum::NextCategoryId::mutate(|value| *value += 1);

        let next_thread_id_for_post = old_forum::NextThreadId::get();

        // insert threads
        for index in 0..thread_number {
            let next_thread_id = old_forum::NextThreadId::get();
            <old_forum::ThreadById<T>>::mutate(next_thread_id, |value| {
                *value = old_forum::Thread {
                    id: next_thread_id,
                    title: text.clone(),
                    category_id: next_category_id,
                    nr_in_category: index,
                    moderation: None,
                    num_unmoderated_posts: 0,
                    num_moderated_posts: 0,
                    created_at: Default::default(),
                    author_id: account_id.clone(),
                }
            });
            old_forum::NextThreadId::mutate(|value| *value += 1);
        }

        // insert posts
        for index in 0..post_number {
            let next_post_id = old_forum::NextPostId::get();
            <old_forum::PostById<T>>::mutate(next_post_id, |value| {
                *value = old_forum::Post {
                    id: next_post_id,
                    thread_id: next_thread_id_for_post,
                    nr_in_thread: index,
                    current_text: text.clone(),
                    moderation: None,
                    text_change_history: vec![],
                    created_at: Default::default(),
                    author_id: account_id.clone(),
                }
            });
            old_forum::NextPostId::mutate(|value| *value += 1);
        }
    }
    // set migration configuration
    fn set_migration_config(config: DataMigrationConfigStruct) {
        DataMigrationConfig::mutate(|value| *value = config);
    }

    // migrate all categories, return true if it is done
    fn migrate_category() -> bool {
        if old_forum::NextCategoryId::get() > <new_forum::NextCategoryId<T>>::get().into() {
            let next_category_id: u64 = <new_forum::NextCategoryId<T>>::get().into();
            // let old_next_category_id = old_forum::NextCategoryId::get();
            let end_category_id = std::cmp::min(
                old_forum::NextCategoryId::get(),
                next_category_id + DataMigrationConfig::get().max_categories_imported_per_block,
            );

            for index in next_category_id..end_category_id {
                let old_category = <old_forum::CategoryById<T>>::get(index);
                let category_id: T::CategoryId = index.into();
                // Self::try_to_migrate_moderator(old_category.moderator_id);
                <new_forum::CategoryById<T>>::mutate(category_id, |value| {
                    *value = Self::adapt_category(old_category)
                });
                // remove migrated category from old forum
                <old_forum::CategoryById<T>>::remove(index);
            }
            // update next category id
            <new_forum::NextCategoryId<T>>::mutate(|value| *value = end_category_id.into());
            false
        } else {
            true
        }
    }

    // migrate all threads, return true if it is done
    fn migrate_thread() -> bool {
        if old_forum::NextThreadId::get() > <new_forum::NextThreadId<T>>::get().into() {
            let next_thread_id: u64 = <new_forum::NextThreadId<T>>::get().into();
            // set migrate threads limit for each block
            let end_thread_id = std::cmp::min(
                old_forum::NextThreadId::get(),
                next_thread_id + DataMigrationConfig::get().max_threads_imported_per_block,
            );
            // migrate thread one by one
            for index in next_thread_id..end_thread_id {
                let old_thread = <old_forum::ThreadById<T>>::get(index);
                let thread_id: T::ThreadId = index.into();
                <new_forum::ThreadById<T>>::mutate(thread_id, |value| {
                    *value = Self::adapt_thread(old_thread)
                });
            }
            // update next thread id
            <new_forum::NextThreadId<T>>::mutate(|value| *value = end_thread_id.into());
            false
        } else {
            true
        }
    }

    // migrate all posts, return true if it is done
    fn migrate_post() -> bool {
        if old_forum::NextPostId::get() > <new_forum::NextPostId<T>>::get().into() {
            let next_post_id: u64 = <new_forum::NextPostId<T>>::get().into();
            // set migrate posts limit for each block
            let end_post_id = std::cmp::min(
                old_forum::NextPostId::get(),
                next_post_id + DataMigrationConfig::get().max_posts_imported_per_block,
            );
            // copy post one by one
            for index in next_post_id..end_post_id {
                let old_post = <old_forum::PostById<T>>::get(index);
                let post_id: T::PostId = index.into();
                <new_forum::PostById<T>>::mutate(post_id, |value| {
                    *value = Self::adapt_post(old_post)
                });
            }
            // update next post id
            <new_forum::NextPostId<T>>::mutate(|value| *value = end_post_id.into());
            false
        } else {
            true
        }
    }

    // mapping account id in old forum to forum user
    fn try_to_migrate_forum_user(forum_user_account: T::AccountId) -> T::ForumUserId {
        if <AccountByForumUserId<T>>::exists(&forum_user_account) {
            <AccountByForumUserId<T>>::get(&forum_user_account)
        } else {
            // get next forum user id
            let forum_user_id = <new_forum::NextForumUserId<T>>::get();

            // create new forum user
            <new_forum::ForumUserById<T>>::mutate(forum_user_id, |value| {
                *value = new_forum::ForumUser {
                    role_account: forum_user_account.clone(),
                    name: DEFAULT_FORUM_USER_NAME.as_bytes().to_vec().clone(),
                    self_introduction: DEFAULT_FORUM_USER_SELF_INTRODUCTION
                        .as_bytes()
                        .to_vec()
                        .clone(),
                    post_footer: None,
                }
            });

            // map account to forum user id
            <AccountByForumUserId<T>>::insert(forum_user_account, forum_user_id.clone());

            // update next forum user id
            <new_forum::NextForumUserId<T>>::mutate(|value| *value += One::one());
            forum_user_id
        }
    }

    // mapping account id in old forum to moderator
    fn try_to_migrate_moderator(moderator_account: T::AccountId) -> T::ModeratorId {
        if <AccountByModeratorId<T>>::exists(&moderator_account) {
            <AccountByModeratorId<T>>::get(&moderator_account)
        } else {
            // get next moderator id
            let moderator_id = <new_forum::NextModeratorId<T>>::get();

            // create new moderator
            <new_forum::ModeratorById<T>>::mutate(
                <new_forum::NextModeratorId<T>>::get(),
                |value| {
                    *value = new_forum::Moderator {
                        role_account: moderator_account.clone(),
                        name: DEFAULT_MODERATOR_NAME.as_bytes().to_vec().clone(),
                        self_introduction: DEFAULT_MODERATOR_SELF_INTRODUCTION
                            .as_bytes()
                            .to_vec()
                            .clone(),
                    }
                },
            );
            // map account to moderator id
            <AccountByModeratorId<T>>::insert(moderator_account, moderator_id.clone());

            // update next moderator id
            <new_forum::NextModeratorId<T>>::mutate(|value| *value += One::one());
            moderator_id
        }
    }

    // adapt category from old forum
    fn adapt_category(
        old_category: OldCategory<T::BlockNumber, T::Moment, T::AccountId>,
    ) -> Category<T::CategoryId, T::ThreadId, T::BlockNumber, T::Moment> {
        let created_at = new_forum::BlockchainTimestamp {
            block: old_category.created_at.block,
            time: old_category.created_at.time,
        };
        let position_in_parent_category = match old_category.position_in_parent_category {
            Some(position) => Some(new_forum::ChildPositionInParentCategory {
                parent_id: position.parent_id.into(),
                child_nr_in_parent_category: position.child_nr_in_parent_category,
            }),
            None => None,
        };
        Category {
            id: old_category.id.into(),
            title: old_category.title.clone(),
            description: old_category.description.clone(),
            created_at: created_at,
            deleted: old_category.deleted,
            archived: old_category.archived,
            num_direct_subcategories: old_category.num_direct_subcategories,
            num_direct_unmoderated_threads: old_category.num_direct_unmoderated_threads,
            num_direct_moderated_threads: old_category.num_direct_moderated_threads,
            position_in_parent_category: position_in_parent_category,
            sticky_thread_ids: vec![],
        }
    }

    // adapt thread from old forum
    fn adapt_thread(
        old_thread: OldThread<T::BlockNumber, T::Moment, T::AccountId>,
    ) -> Thread<T::ForumUserId, T::ModeratorId, T::CategoryId, T::BlockNumber, T::Moment> {
        let moderation = if old_thread.moderation.is_some() {
            let old_moderation = old_thread.moderation.unwrap();
            let moderator_id = Self::try_to_migrate_moderator(old_moderation.moderator_id);
            let moderated_at = new_forum::BlockchainTimestamp {
                block: old_moderation.moderated_at.block,
                time: old_moderation.moderated_at.time,
            };
            Some(new_forum::ModerationAction {
                moderated_at: moderated_at,
                moderator_id: moderator_id,
                rationale: old_moderation.rationale.clone(),
            })
        } else {
            None
        };

        let created_at = new_forum::BlockchainTimestamp {
            block: old_thread.created_at.block,
            time: old_thread.created_at.time,
        };
        Thread {
            title: old_thread.title.clone(),
            category_id: old_thread.category_id.into(),
            moderation: moderation,
            created_at: created_at,
            author_id: Self::try_to_migrate_forum_user(old_thread.author_id),
            poll: None,
            nr_in_category: old_thread.nr_in_category,
            num_unmoderated_posts: old_thread.num_unmoderated_posts,
            num_moderated_posts: old_thread.num_moderated_posts,
        }
    }

    // adapt post from old forum
    fn adapt_post(
        old_post: OldPost<T::BlockNumber, T::Moment, T::AccountId>,
    ) -> Post<T::ForumUserId, T::ModeratorId, T::ThreadId, T::BlockNumber, T::Moment> {
        let moderation = if old_post.moderation.is_some() {
            let old_moderation = old_post.moderation.unwrap();
            let moderated_at = new_forum::BlockchainTimestamp {
                block: old_moderation.moderated_at.block,
                time: old_moderation.moderated_at.time,
            };
            let moderator_id = Self::try_to_migrate_moderator(old_moderation.moderator_id);
            Some(new_forum::ModerationAction {
                moderated_at: moderated_at,
                moderator_id: moderator_id,
                rationale: old_moderation.rationale.clone(),
            })
        } else {
            None
        };
        let text_change_history = old_post
            .text_change_history
            .iter()
            .map(|histroy| new_forum::PostTextChange {
                expired_at: new_forum::BlockchainTimestamp {
                    block: histroy.expired_at.block,
                    time: histroy.expired_at.time,
                },
                text: histroy.text.clone(),
            })
            .collect();

        let created_at = new_forum::BlockchainTimestamp {
            block: old_post.created_at.block,
            time: old_post.created_at.time,
        };

        Post {
            thread_id: old_post.thread_id.into(),
            current_text: old_post.current_text.clone(),
            moderation: moderation,
            text_change_history: text_change_history,
            created_at: created_at,
            author_id: Self::try_to_migrate_forum_user(old_post.author_id.clone()),
            nr_in_thread: old_post.nr_in_thread,
        }
    }
}
