#![allow(clippy::type_complexity)]

use super::new_validation;
use node_runtime::{
    forum::{Category, Post, Thread},
    BlockNumber, CategoryId, ForumConfig, ForumUserId, ModeratorId, Moment, PostId, ThreadId,
};
use serde::Deserialize;
use serde_json::Result;

#[derive(Deserialize)]
struct ForumData {
    categories: Vec<(
        CategoryId,
        Category<CategoryId, ThreadId, BlockNumber, Moment>,
    )>,
    posts: Vec<(
        PostId,
        Post<ForumUserId, ModeratorId, ThreadId, BlockNumber, Moment>,
    )>,
    threads: Vec<(
        ThreadId,
        Thread<ForumUserId, ModeratorId, CategoryId, BlockNumber, Moment>,
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
        next_category_id,
        next_thread_id,
        next_post_id,
        category_title_constraint: new_validation(10, 90),
        category_description_constraint: new_validation(10, 490),
        thread_title_constraint: new_validation(10, 90),
        post_text_constraint: new_validation(10, 990),
        thread_moderation_rationale_constraint: new_validation(10, 290),
        post_moderation_rationale_constraint: new_validation(10, 290),

        // TODO: get rid of mocks and setup valid values
        moderator_by_id: Vec::new(),
        next_moderator_id: 1,
        max_category_depth: 10,
        category_by_moderator: Vec::new(),
        reaction_by_post: Vec::new(),
        label_name_constraint: new_validation(10, 90),
        poll_desc_constraint: new_validation(10, 90),
        poll_items_constraint: new_validation(1, 10),
        user_name_constraint: new_validation(10, 90),
        user_self_introduction_constraint: new_validation(10, 90),
        post_footer_constraint: new_validation(10, 90),
        label_by_id: Vec::new(),
        next_label_id: 1,
        category_labels: Vec::new(),
        thread_labels: Vec::new(),
        max_applied_labels: 10,
        data_migration_done: true,
    }
}
