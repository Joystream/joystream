// This module is not used but included as sample code
// and highlights some pitfalls.

use super::new_validation;
use node_runtime::{
    forum::{Category, CategoryId, Post, Thread},
    AccountId, BlockNumber, ForumConfig, Moment, PostId, ThreadId,
};
use serde::Deserialize;
use serde_json::Result;

use codec::Decode;

#[derive(Deserialize)]
struct ForumData {
    /// hex encoded categories
    categories: Vec<(CategoryId, String)>,
    /// hex encoded posts
    posts: Vec<(PostId, String)>,
    /// hex encoded threads
    threads: Vec<(ThreadId, String)>,
}

fn decode_post(encoded: String) -> Post<BlockNumber, Moment, AccountId, ThreadId, PostId> {
    // hex string must not include '0x' prefix!
    let encoded = hex::decode(encoded.as_bytes()).expect("failed to parse hex string");
    Decode::decode(&mut encoded.as_slice()).unwrap()
}

fn decode_category(encoded: String) -> Category<BlockNumber, Moment, AccountId> {
    // hex string must not include '0x' prefix!
    let encoded = hex::decode(encoded.as_bytes()).expect("failed to parse hex string");
    Decode::decode(&mut encoded.as_slice()).unwrap()
}

fn decode_thread(encoded: String) -> Thread<BlockNumber, Moment, AccountId, ThreadId> {
    // hex string must not include '0x' prefix!
    let encoded = hex::decode(encoded.as_bytes()).expect("failed to parse hex string");
    Decode::decode(&mut encoded.as_slice()).unwrap()
}

fn parse_forum_json() -> Result<ForumData> {
    let data = include_str!("../../res/forum_nicaea_encoded.json");
    serde_json::from_str(data)
}

pub fn create(forum_sudo: AccountId) -> ForumConfig {
    let forum_data = parse_forum_json().expect("failed loading forum data");

    let next_category_id: CategoryId = forum_data
        .categories
        .last()
        .map_or(1, |category| category.0 + 1);
    let next_thread_id: ThreadId = forum_data.threads.last().map_or(1, |thread| thread.0 + 1);
    let next_post_id: PostId = forum_data.posts.last().map_or(1, |post| post.0 + 1);

    ForumConfig {
        category_by_id: forum_data
            .categories
            .into_iter()
            .map(|category| (category.0, decode_category(category.1)))
            .collect(),
        thread_by_id: forum_data
            .threads
            .into_iter()
            .map(|thread| (thread.0, decode_thread(thread.1)))
            .collect(),
        post_by_id: forum_data
            .posts
            .into_iter()
            .map(|post| (post.0, decode_post(post.1)))
            .collect(),
        next_category_id,
        next_thread_id,
        next_post_id,
        forum_sudo,
        category_title_constraint: new_validation(10, 90),
        category_description_constraint: new_validation(10, 490),
        thread_title_constraint: new_validation(10, 90),
        post_text_constraint: new_validation(10, 990),
        thread_moderation_rationale_constraint: new_validation(10, 290),
        post_moderation_rationale_constraint: new_validation(10, 290),
    }
}
