use codec::Decode;
use node_runtime::{
    common::constraints::InputValidationLengthConstraint,
    forum::{Category, CategoryId, Post, Thread},
    AccountId, BlockNumber, ForumConfig, Moment, PostId, ThreadId,
};
use serde::Deserialize;

fn new_validation(min: u16, max_min_diff: u16) -> InputValidationLengthConstraint {
    InputValidationLengthConstraint { min, max_min_diff }
}

#[derive(Deserialize)]
struct ForumData {
    /// hex encoded categories
    categories: Vec<String>,
    /// hex encoded posts
    posts: Vec<String>,
    /// hex encoded threads
    threads: Vec<String>,
}

fn decode_post(encoded: String) -> Post<BlockNumber, Moment, AccountId, ThreadId, PostId> {
    // hex string must not include '0x' prefix!
    let encoded = hex::decode(&encoded[2..].as_bytes()).expect("failed to parse post hex string");
    Decode::decode(&mut encoded.as_slice()).unwrap()
}

fn decode_category(encoded: String) -> Category<BlockNumber, Moment, AccountId> {
    // hex string must not include '0x' prefix!
    let encoded =
        hex::decode(&encoded[2..].as_bytes()).expect("failed to parse category hex string");
    Decode::decode(&mut encoded.as_slice()).unwrap()
}

fn decode_thread(encoded: String) -> Thread<BlockNumber, Moment, AccountId, ThreadId> {
    // hex string must not include '0x' prefix!
    let encoded = hex::decode(&encoded[2..].as_bytes()).expect("failed to parse thread hex string");
    Decode::decode(&mut encoded.as_slice()).unwrap()
}

fn parse_forum_json() -> serde_json::Result<ForumData> {
    let data = include_str!("../res/forum_nicaea_encoded.json");
    serde_json::from_str(data)
}

pub fn create(forum_sudo: AccountId) -> ForumConfig {
    let forum_data = parse_forum_json().expect("failed loading forum data");
    let first_id = 1;

    let next_category_id: CategoryId = forum_data.categories.last().map_or(first_id, |category| {
        decode_category(category.clone()).id + 1
    });
    assert_eq!(
        next_category_id,
        (forum_data.categories.len() + 1) as CategoryId
    );

    let next_thread_id: ThreadId = forum_data
        .threads
        .last()
        .map_or(first_id, |thread| decode_thread(thread.clone()).id + 1);
    assert_eq!(next_thread_id, (forum_data.threads.len() + 1) as ThreadId);

    let next_post_id: PostId = forum_data
        .posts
        .last()
        .map_or(first_id, |post| decode_post(post.clone()).id + 1);
    assert_eq!(next_post_id, (forum_data.posts.len() + 1) as PostId);

    ForumConfig {
        category_by_id: forum_data
            .categories
            .into_iter()
            .map(|encoded_category| {
                let category = decode_category(encoded_category);
                (category.id, category)
            })
            .collect(),
        thread_by_id: forum_data
            .threads
            .into_iter()
            .map(|encoded_thread| {
                let thread = decode_thread(encoded_thread);
                (thread.id, thread)
            })
            .collect(),
        post_by_id: forum_data
            .posts
            .into_iter()
            .map(|encoded_post| {
                let post = decode_post(encoded_post);
                (post.id, post)
            })
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
