use codec::Decode;
use node_runtime::{
    forum,
    forum::{Category, Post, Thread},
    AccountId, Balance, BlockNumber, ForumConfig, Moment, PostId, Runtime, ThreadId,
};
use serde::Deserialize;
use sp_core::H256;
use std::{fs, path::Path};

type CategoryId = <Runtime as forum::Trait>::CategoryId;
type ForumUserId = forum::ForumUserId<Runtime>;
type ModeratorId = forum::ModeratorId<Runtime>;
type Hash = H256;
type PostOf = Post<ForumUserId, ThreadId, H256, Balance, BlockNumber>;

type ThreadOf = (
    CategoryId,
    ThreadId,
    Thread<ForumUserId, CategoryId, Moment, Hash, Balance>,
);

#[derive(Decode)]
struct ForumData {
    categories: Vec<(CategoryId, Category<CategoryId, ThreadId, Hash>)>,
    posts: Vec<(ThreadId, PostId, PostOf)>,
    threads: Vec<ThreadOf>,
    category_by_moderator: Vec<(CategoryId, ModeratorId, ())>,
    data_migration_done: bool,
}

#[derive(Deserialize)]
struct EncodedForumData {
    /// hex encoded categories
    categories: Vec<String>,
    /// hex encoded posts
    posts: Vec<String>,
    /// hex encoded threads
    threads: Vec<String>,
    /// hex encoded categories by moderator set
    category_by_moderator: Vec<String>,
    /// hex encoded data migration done bool flag
    data_migration_done: String,
}

impl EncodedForumData {
    fn decode(&self) -> ForumData {
        ForumData {
            categories: self
                .categories
                .iter()
                .map(|category| {
                    let encoded_category = hex::decode(&category[2..].as_bytes())
                        .expect("failed to parse category hex string");
                    Decode::decode(&mut encoded_category.as_slice()).unwrap()
                })
                .collect(),
            posts: self
                .posts
                .iter()
                .map(|post| {
                    let encoded_post = hex::decode(&post[2..].as_bytes())
                        .expect("failed to parse post hex string");
                    Decode::decode(&mut encoded_post.as_slice()).unwrap()
                })
                .collect(),
            threads: self
                .threads
                .iter()
                .map(|thread| {
                    let encoded_thread = hex::decode(&thread[2..].as_bytes())
                        .expect("failed to parse thread hex string");
                    Decode::decode(&mut encoded_thread.as_slice()).unwrap()
                })
                .collect(),
            category_by_moderator: self
                .category_by_moderator
                .iter()
                .map(|category_by_moderator| {
                    let category_by_moderator = hex::decode(&category_by_moderator[2..].as_bytes())
                        .expect("failed to parse thread hex string");
                    Decode::decode(&mut category_by_moderator.as_slice()).unwrap()
                })
                .collect(),
            data_migration_done: {
                let data_migration_done = hex::decode(&self.data_migration_done[2..].as_bytes())
                    .expect("failed to parse thread hex string");
                Decode::decode(&mut data_migration_done.as_slice()).unwrap()
            },
        }
    }
}

fn parse_forum_json(data_file: &Path) -> EncodedForumData {
    let data = fs::read_to_string(data_file).expect("Failed reading file");
    serde_json::from_str(&data).expect("failed parsing members data")
}

/// Generates a `ForumConfig` geneis config pre-populated with
/// categories, threads and posts parsed
/// from a json file serialized as `EncodedForumData`
pub fn from_json(forum_sudo: AccountId, data_file: &Path) -> ForumConfig {
    let forum_data = parse_forum_json(data_file);
    create(forum_sudo, forum_data)
}

/// Generates a basic empty `ForumConfig` geneis config
pub fn empty(forum_sudo: AccountId) -> ForumConfig {
    let forum_data = EncodedForumData {
        categories: vec![],
        threads: vec![],
        posts: vec![],
        category_by_moderator: vec![],
        // true
        data_migration_done: String::from("0x01"),
    };
    create(forum_sudo, forum_data)
}

fn create(_forum_sudo: AccountId, forum_data: EncodedForumData) -> ForumConfig {
    let first_id = 1;
    let forum_data = forum_data.decode();

    let next_category_id = first_id + forum_data.categories.len() as CategoryId;

    assert_eq!(
        next_category_id,
        (forum_data.categories.len() + 1) as CategoryId
    );

    let next_thread_id = first_id + forum_data.threads.len() as ThreadId;

    assert_eq!(next_thread_id, (forum_data.threads.len() + 1) as ThreadId);

    let next_post_id = first_id + forum_data.posts.len() as PostId;

    assert_eq!(next_post_id, (forum_data.posts.len() + 1) as PostId);

    ForumConfig {
        category_by_id: forum_data.categories,
        thread_by_id: forum_data.threads,
        post_by_id: forum_data.posts,
        category_by_moderator: forum_data.category_by_moderator,
        next_category_id,
        next_thread_id,
        next_post_id,
        category_counter: next_category_id - 1,
        data_migration_done: forum_data.data_migration_done,
    }
}
