
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
    with_externalities(&mut build_test_externalities(), || {

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
    with_externalities(&mut build_test_externalities(), || {

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

// Here are a few testing utilities and fixtures, will reorganize
// later with more tests.

enum OriginType {
    Signed(<Runtime as system::Trait>::AccountId),
    //Inherent, <== did not find how to make such an origin yet
    Root
}

struct CreateCategoryFixture {
    origin: OriginType,
    parent: Option<CategoryId>,
    title: Vec<u8>,
    description: Vec<u8>
}

impl CreateCategoryFixture {

    fn call_module(&self) -> dispatch::Result {

        TestForumModule::create_category(
            match self.origin {
                OriginType::Signed(account_id) => Origin::signed(account_id),
                //OriginType::Inherent => Origin::inherent,
                OriginType::Root => system::RawOrigin::Root.into() //Origin::root
            },
            self.parent,
            self.title.clone(),
            self.description.clone()
        )
    }
}

#[test]
fn create_category_successfully() {
    with_externalities(&mut build_test_externalities(), || {

        // Make some new catg
        let f1 = CreateCategoryFixture {
            origin: OriginType::Signed(default_genesis_config().forum_sudo),
            parent: None,
            title: "My new category".as_bytes().to_vec(),
            description: "This is a great new category for the forum".as_bytes().to_vec()
        };

        // let f2 = ...
        // let f3 = ...
        // let f4 = ...

        // Make module call
        f1.call_module().is_ok();

        // f2.call_module();
        // f3.call_module();
        // f4.call_module();

        // assert state!

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
    with_externalities(&mut build_test_externalities(), || {

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