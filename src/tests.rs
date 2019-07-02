
#![cfg(test)]

use super::*;
use crate::mock::*;

use runtime_io::with_externalities;
use srml_support::{assert_ok};


/*
* NB!: No test checks for event emission!!!!
*/

/*
 * set_forum_sudo
 * ==============================================================================
 *
 * Missing cases
 *
 * set_forum_bad_origin
 *
 */

#[test]
fn set_forum_sudo_unset() {

    let config = default_genesis_config();

    with_externalities(&mut build_test_externalities(config), || {

        // Ensure that forum sudo is default
        assert_eq!(TestForumModule::forum_sudo(), Some(33));

        // Unset forum sudo
        assert_ok!(TestForumModule::set_forum_sudo(None));

        // Sudo no longer set
        assert!(TestForumModule::forum_sudo().is_none());

        // event emitted?!

    });
}

#[test]
fn set_forum_sudo_update() {

    let config = default_genesis_config();

    with_externalities(&mut build_test_externalities(config), || {

        // Ensure that forum sudo is default
        assert_eq!(TestForumModule::forum_sudo(), Some(default_genesis_config().forum_sudo));

        let new_forum_sudo_account_id = 780;

        // Unset forum sudo
        assert_ok!(TestForumModule::set_forum_sudo(Some(new_forum_sudo_account_id)));

        // Sudo no longer set
        assert_eq!(TestForumModule::forum_sudo(), Some(new_forum_sudo_account_id));

    });
}

/*
 * create_category
 * ==============================================================================
 *
 * Missing cases
 *
 * create_category_bad_origin
 * create_category_forum_sudo_not_set
 * create_category_origin_not_forum_sudo
 */

#[test]
fn create_category_successfully() {

    let config = default_genesis_config();

    with_externalities(&mut build_test_externalities(config), || {

        CreateCategoryFixture {
            origin: OriginType::Signed(default_genesis_config().forum_sudo),
            parent: None,
            title: good_category_title(),
            description: good_category_description(),
            result: Ok(())
        }
        .call_and_assert();
    });
}

#[test]
fn create_category_title_too_short() {

    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let min_len = config.category_title_constraint.min as usize;

    with_externalities(&mut build_test_externalities(config), || {

        CreateCategoryFixture {
            origin,
            parent: None,
            title: generate_text(min_len - 1),
            description: good_category_description(),
            result: Err(ERROR_CATEGORY_TITLE_TOO_SHORT)
        }
        .call_and_assert();
    });
}

#[test]
fn create_category_title_too_long() {

    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let max_len = config.category_title_constraint.max() as usize;

    with_externalities(&mut build_test_externalities(config), || {

        CreateCategoryFixture {
            origin,
            parent: None,
            title: generate_text(max_len + 1),
            description: good_category_description(),
            result: Err(ERROR_CATEGORY_TITLE_TOO_LONG)
        }
        .call_and_assert();
    });
}

#[test]
fn create_category_description_too_short() {

    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let min_len = config.category_description_constraint.min as usize;

    with_externalities(&mut build_test_externalities(config), || {

        CreateCategoryFixture {
            origin,
            parent: None,
            title: good_category_title(),
            description: generate_text(min_len - 1),
            result: Err(ERROR_CATEGORY_DESCRIPTION_TOO_SHORT)
        }
        .call_and_assert();
    });
}

#[test]
fn create_category_description_too_long() {

    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let max_len = config.category_description_constraint.max() as usize;

    with_externalities(&mut build_test_externalities(config), || {

        CreateCategoryFixture {
            origin,
            parent: None,
            title: good_category_title(),
            description: generate_text(max_len + 1),
            result: Err(ERROR_CATEGORY_DESCRIPTION_TOO_LONG)
        }
        .call_and_assert();
    });
}

/*
 * update_category
 * ==============================================================================
 *
 * Missing cases
 *
 * create_category_bad_origin
 * create_category_forum_sudo_not_set
 * create_category_origin_not_forum_sudo
 * create_category_immutable_ancestor_category
 */

#[test]
fn update_category_undelete_and_unarchive() {

    /*
     * Create an initial state with two levels of categories, where
     * leaf category is deleted, and then try to undelete.
     */

    let forum_sudo = 32;

    let created_at = RuntimeBlockchainTimestamp {
        block : 0,
        time: 0
    };

    let category_by_id =  vec![

        // A root category
        (1, Category{
            id: 1,
            title: "New root".as_bytes().to_vec(),
            description: "This is a new root category".as_bytes().to_vec(),
            created_at : created_at.clone(),
            deleted: false,
            archived: false,
            num_direct_subcategories: 1,
            num_direct_unmoderated_threads: 0,
            num_direct_moderated_threads: 0,
            position_in_parent_category: None,
            moderator_id: forum_sudo
        }),

        // A subcategory of the one above
        (2, Category{
            id: 2,
            title: "New subcategory".as_bytes().to_vec(),
            description: "This is a new subcategory to root category".as_bytes().to_vec(),
            created_at : created_at.clone(),
            deleted: true,
            archived: false,
            num_direct_subcategories: 0,
            num_direct_unmoderated_threads: 0,
            num_direct_moderated_threads: 0,
            position_in_parent_category: Some(
                ChildPositionInParentCategory {
                    parent_id: 1,
                    child_nr_in_parent_category: 1
                }
            ),
            moderator_id: forum_sudo
        }),
    ];

    // Set constraints to be sloppy, we don't care about enforcing them.
    let sloppy_constraint = InputValidationLengthConstraint{
        min: 0,
        max_min_diff: 1000
    };

    let config = genesis_config(
        &category_by_id, // category_by_id
        category_by_id.len() as u64, // next_category_id
        &vec![], // thread_by_id
        1, // next_thread_id
        &vec![], // post_by_id
        1, // next_post_id
        forum_sudo,
        &sloppy_constraint,
        &sloppy_constraint,
        &sloppy_constraint,
        &sloppy_constraint,
        &sloppy_constraint,
        &sloppy_constraint
    );

    with_externalities(&mut build_test_externalities(config), || {

        UpdateCategoryFixture {
            origin: OriginType::Signed(forum_sudo),
            category_id: 2,
            new_archival_status: None, // same as before
            new_deletion_status: Some(false), // undelete
            result: Ok(())
        }
        .call_and_assert();

    });
}


/*
 * create_thread
 * ==============================================================================
 *
 * Missing cases
 *
 * create_thread_bad_origin
 * create_thread_forum_sudo_not_set
 * ...
 */

#[test]
fn create_thread_not_forum_member() {

    let config = default_genesis_config();

    with_externalities(&mut build_test_externalities(config), || {

        let new_member = registry::Member {
            id : 113
        };

        // User not there
        assert!(registry::TestMembershipRegistryModule::get_member(&new_member.id).is_none());

        // Add new member
        registry::TestMembershipRegistryModule::add_member(&new_member);

        // Make sure its now there
        assert!(registry::TestMembershipRegistryModule::get_member(&new_member.id).is_some());

        // TODO finish test...
    });
}

#[test]
fn create_thread_successfully() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);

    with_externalities(&mut build_test_externalities(config), || {
        let category_id = create_root_category(origin);
        let member_origin = create_forum_member();

        CreateThreadFixture {
            origin: member_origin,
            category_id,
            title: good_thread_title(),
            text: good_thread_text(),
            result: Ok(())
        }
        .call_and_assert();
    });
}

#[test]
fn create_thread_title_too_short() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let min_len = config.thread_title_constraint.min as usize;

    with_externalities(&mut build_test_externalities(config), || {
        let category_id = create_root_category(origin);
        let member_origin = create_forum_member();

        CreateThreadFixture {
            origin: member_origin,
            category_id,
            title: generate_text(min_len - 1),
            text: good_thread_text(),
            result: Err(ERROR_THREAD_TITLE_TOO_SHORT)
        }
        .call_and_assert();
    });
}

#[test]
fn create_thread_title_too_long() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let max_len = config.thread_title_constraint.max() as usize;

    with_externalities(&mut build_test_externalities(config), || {
        let category_id = create_root_category(origin);
        let member_origin = create_forum_member();

        CreateThreadFixture {
            origin: member_origin,
            category_id,
            title: generate_text(max_len + 1),
            text: good_thread_text(),
            result: Err(ERROR_THREAD_TITLE_TOO_LONG)
        }
        .call_and_assert();
    });
}

#[test]
fn create_thread_text_too_short() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let min_len = config.post_text_constraint.min as usize;

    with_externalities(&mut build_test_externalities(config), || {
        let category_id = create_root_category(origin);
        let member_origin = create_forum_member();

        CreateThreadFixture {
            origin: member_origin,
            category_id,
            title: good_thread_title(),
            text: generate_text(min_len - 1),
            result: Err(ERROR_POST_TEXT_TOO_SHORT)
        }
        .call_and_assert();
    });
}

#[test]
fn create_thread_text_too_long() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let max_len = config.post_text_constraint.max() as usize;

    with_externalities(&mut build_test_externalities(config), || {
        let category_id = create_root_category(origin);
        let member_origin = create_forum_member();

        CreateThreadFixture {
            origin: member_origin,
            category_id,
            title: good_thread_title(),
            text: generate_text(max_len + 1),
            result: Err(ERROR_POST_TEXT_TOO_LONG)
        }
        .call_and_assert();
    });
}
