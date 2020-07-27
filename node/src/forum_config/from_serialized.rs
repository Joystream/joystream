#![allow(clippy::type_complexity)]

use super::new_validation;
use node_runtime::{
    forum::{Category, Post, Thread},
    CategoryId, ForumConfig, ForumUserId, Hash, Moment, PostId, ThreadId,
};
use serde::Deserialize;
use serde_json::Result;

#[derive(Deserialize)]
struct ForumData {
    categories: Vec<(CategoryId, Category<CategoryId, ThreadId, Hash>)>,
    posts: Vec<(ThreadId, PostId, Post<ForumUserId, ThreadId, Hash>)>,
    threads: Vec<(
        CategoryId,
        ThreadId,
        Thread<ForumUserId, CategoryId, Moment, Hash>,
    )>,
}

fn parse_forum_json() -> Result<ForumData> {
    // TODO: remove temporary load of empty data by regular load of forum config in the new format
    //let data = include_str!("../../res/forum_data_acropolis_serialized.json");
    let data = include_str!("../../res/forum_data_empty.json");
    serde_json::from_str(data)
}

pub fn create() -> ForumConfig {
    let forum_data = parse_forum_json().expect("failed loading forum data");

    let next_category_id: CategoryId = forum_data
        .categories
        .last()
        .map_or(1, |category| category.0 + 1);
    let next_thread_id: ThreadId = forum_data.threads.last().map_or(1, |thread| thread.0 + 1);
    let next_post_id: PostId = forum_data.posts.last().map_or(1, |post| post.0 + 1);

    ForumConfig {
        category_by_id: forum_data.categories,
        thread_by_id: forum_data.threads,
        post_by_id: forum_data.posts,
        category_counter: 0,
        next_category_id,
        next_thread_id,
        next_post_id,

        // TODO: get rid of mocks and setup valid values
        category_by_moderator: Vec::new(),
        poll_items_constraint: new_validation(1, 10),
        data_migration_done: true,
    }
}
