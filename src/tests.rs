
#![cfg(test)]

use super::*;
use crate::mock::*;

use runtime_io::with_externalities;
use srml_support::{assert_ok};


/*
* NB!: No test checks for even emission!!!!
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
 * create_category_title_too_short
 * create_category_title_too_long
 * create_category_description_too_short
 * create_category_description_too_long
 */

#[test]
fn create_category_successfully() {

    let config = default_genesis_config();

    with_externalities(&mut build_test_externalities(config), || {

        CreateCategoryFixture {
            origin: OriginType::Signed(default_genesis_config().forum_sudo),
            parent: None,
            title: "My new category".as_bytes().to_vec(),
            description: "This is a great new category for the forum".as_bytes().to_vec(),
            result: Ok(())
        }
        .call_and_assert();

    });
}


#[test]
fn create_category_title_too_long() {

    let config = default_genesis_config();

    with_externalities(&mut build_test_externalities(config), || {

        let genesis_config = default_genesis_config();

        CreateCategoryFixture {
            origin: OriginType::Signed(genesis_config.forum_sudo),
            parent: None,
            title: vec![b'X'; (genesis_config.category_title_constraint.max() as usize) + 1],
            description: "This is a great new category for the forum".as_bytes().to_vec(),
            result: Err(ERROR_CATEGORY_TITLE_TOO_LONG)
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
        (0, Category{
            id: 0,
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
        (1, Category{
            id: 1,
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
                    parent_id: 0,
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
        0, // next_thread_id
        &vec![], // post_by_id
        0, // next_post_id
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
            category_id: category_by_id[1].1.id,
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
        
        // Add new membe
        registry::TestMembershipRegistryModule::add_member(&new_member);

        // Make sure its now there
        assert!(registry::TestMembershipRegistryModule::get_member(&new_member.id).is_some());

    });
}

