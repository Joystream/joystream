#![cfg(test)]

use super::*;
use crate::mock::*;

use srml_support::{assert_err, assert_ok};
use system::{EventRecord, Phase};
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

    build_test_externalities(config).execute_with(|| {
        // System::set_block_number(1);
        assert_eq!(System::events(), vec![]);
        // Ensure that forum sudo is default
        assert_eq!(TestForumModule::forum_sudo(), Some(33));

        // Unset forum sudo
        assert_ok!(TestForumModule::set_forum_sudo(
            mock_origin(OriginType::Root),
            None
        ));

        // Sudo no longer set
        assert!(TestForumModule::forum_sudo().is_none());
        // System::finalize();

        // TODO event emitted but no found in system events
        assert_eq!(System::events(), vec![
            EventRecord { phase: Phase::ApplyExtrinsic(0), event: (), topics: vec!()}
        ]);
    });
}

#[test]
fn set_forum_sudo_update() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        // Ensure that forum sudo is default
        assert_eq!(
            TestForumModule::forum_sudo(),
            Some(default_genesis_config().forum_sudo)
        );

        let new_forum_sudo_account_id = 780;

        // Unset forum sudo
        assert_ok!(TestForumModule::set_forum_sudo(
            mock_origin(OriginType::Root),
            Some(new_forum_sudo_account_id)
        ));

        // Sudo no longer set
        assert_eq!(
            TestForumModule::forum_sudo(),
            Some(new_forum_sudo_account_id)
        );
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
 */

#[test]
fn create_root_category_successfully() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        assert_create_category(origin, None, Ok(()));
    });
}

#[test]
fn create_subcategory_successfully() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let root_category_id = create_root_category(origin.clone());
        assert_create_category(origin, Some(root_category_id), Ok(()));
    });
}

#[test]
fn create_category_title_too_short() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let min_len = config.category_title_constraint.min as usize;

    build_test_externalities(config).execute_with(|| {
        CreateCategoryFixture {
            origin,
            parent: None,
            title: generate_text(min_len - 1),
            description: good_category_description(),
            result: Err(ERROR_CATEGORY_TITLE_TOO_SHORT),
        }
        .call_and_assert();
    });
}

#[test]
fn create_category_title_too_long() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let max_len = config.category_title_constraint.max() as usize;

    build_test_externalities(config).execute_with(|| {
        CreateCategoryFixture {
            origin,
            parent: None,
            title: generate_text(max_len + 1),
            description: good_category_description(),
            result: Err(ERROR_CATEGORY_TITLE_TOO_LONG),
        }
        .call_and_assert();
    });
}

#[test]
fn create_category_description_too_short() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let min_len = config.category_description_constraint.min as usize;

    build_test_externalities(config).execute_with(|| {
        CreateCategoryFixture {
            origin,
            parent: None,
            title: good_category_title(),
            description: generate_text(min_len - 1),
            result: Err(ERROR_CATEGORY_DESCRIPTION_TOO_SHORT),
        }
        .call_and_assert();
    });
}

#[test]
fn create_category_description_too_long() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let max_len = config.category_description_constraint.max() as usize;

    build_test_externalities(config).execute_with(|| {
        CreateCategoryFixture {
            origin,
            parent: None,
            title: good_category_title(),
            description: generate_text(max_len + 1),
            result: Err(ERROR_CATEGORY_DESCRIPTION_TOO_LONG),
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
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;

    build_test_externalities(config).execute_with(|| {
        assert_eq!(
            TestForumModule::create_category(
                mock_origin(OriginType::Signed(forum_sudo)),
                None,
                good_category_title(),
                good_category_description(),
            ),
            Ok(())
        );

        UpdateCategoryFixture {
            origin: OriginType::Signed(forum_sudo),
            category_id: 1,
            new_archival_status: None,        // same as before
            new_deletion_status: Some(false), // undelete
            result: Ok(()),
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
fn create_thread_successfully() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let category_id = create_root_category(origin);
        let member_origin = create_forum_member();

        CreateThreadFixture {
            origin: member_origin,
            category_id,
            title: good_thread_title(),
            text: good_thread_text(),
            result: Ok(()),
        }
        .call_and_assert();
    });
}

#[test]
fn create_thread_title_too_short() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let min_len = config.thread_title_constraint.min as usize;

    build_test_externalities(config).execute_with(|| {
        let category_id = create_root_category(origin);
        let member_origin = create_forum_member();

        CreateThreadFixture {
            origin: member_origin,
            category_id,
            title: generate_text(min_len - 1),
            text: good_thread_text(),
            result: Err(ERROR_THREAD_TITLE_TOO_SHORT),
        }
        .call_and_assert();
    });
}

#[test]
fn create_thread_title_too_long() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let max_len = config.thread_title_constraint.max() as usize;

    build_test_externalities(config).execute_with(|| {
        let category_id = create_root_category(origin);
        let member_origin = create_forum_member();

        CreateThreadFixture {
            origin: member_origin,
            category_id,
            title: generate_text(max_len + 1),
            text: good_thread_text(),
            result: Err(ERROR_THREAD_TITLE_TOO_LONG),
        }
        .call_and_assert();
    });
}

#[test]
fn create_thread_text_too_short() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let min_len = config.post_text_constraint.min as usize;

    build_test_externalities(config).execute_with(|| {
        let category_id = create_root_category(origin);
        let member_origin = create_forum_member();

        CreateThreadFixture {
            origin: member_origin,
            category_id,
            title: good_thread_title(),
            text: generate_text(min_len - 1),
            result: Err(ERROR_POST_TEXT_TOO_SHORT),
        }
        .call_and_assert();
    });
}

#[test]
fn create_thread_text_too_long() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let max_len = config.post_text_constraint.max() as usize;

    build_test_externalities(config).execute_with(|| {
        let category_id = create_root_category(origin);
        let member_origin = create_forum_member();

        CreateThreadFixture {
            origin: member_origin,
            category_id,
            title: good_thread_title(),
            text: generate_text(max_len + 1),
            result: Err(ERROR_POST_TEXT_TOO_LONG),
        }
        .call_and_assert();
    });
}

#[test]
fn create_post_successfully() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let (_, _, _, _) = create_root_category_and_thread_and_post(origin);
    });
}

#[test]
fn create_post_text_too_short() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let min_len = config.post_text_constraint.min as usize;

    build_test_externalities(config).execute_with(|| {
        let (member_origin, _, thread_id) = create_root_category_and_thread(origin);

        CreatePostFixture {
            origin: member_origin,
            thread_id,
            text: generate_text(min_len - 1),
            result: Err(ERROR_POST_TEXT_TOO_SHORT),
        }
        .call_and_assert();
    });
}

#[test]
fn create_post_text_too_long() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let max_len = config.post_text_constraint.max() as usize;

    build_test_externalities(config).execute_with(|| {
        let (member_origin, _, thread_id) = create_root_category_and_thread(origin);

        CreatePostFixture {
            origin: member_origin,
            thread_id,
            text: generate_text(max_len + 1),
            result: Err(ERROR_POST_TEXT_TOO_LONG),
        }
        .call_and_assert();
    });
}

// Test moderation:
// -----------------------------------------------------------------------------

#[test]
fn moderate_thread_successfully() {
    let config = default_genesis_config();

    let origin = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let (_, _, thread_id) = create_root_category_and_moderator_and_thread(origin.clone());
        assert_eq!(moderate_thread(origin, thread_id, good_rationale()), Ok(()));
    });
}

#[test]
fn cannot_moderate_already_moderated_thread() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let (_, _, thread_id) = create_root_category_and_moderator_and_thread(origin.clone());
        assert_eq!(
            moderate_thread(origin.clone(), thread_id.clone(), good_rationale()),
            Ok(())
        );
        assert_eq!(
            moderate_thread(origin, thread_id, good_rationale()),
            Err(ERROR_THREAD_ALREADY_MODERATED)
        );
    });
}

#[test]
fn moderate_thread_rationale_too_short() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let min_len = config.thread_moderation_rationale_constraint.min as usize;

    build_test_externalities(config).execute_with(|| {
        let (_, _, thread_id) = create_root_category_and_moderator_and_thread(origin.clone());
        let bad_rationale = generate_text(min_len - 1);
        assert_eq!(
            moderate_thread(origin, thread_id, bad_rationale),
            Err(ERROR_THREAD_MODERATION_RATIONALE_TOO_SHORT)
        );
    });
}

#[test]
fn moderate_thread_rationale_too_long() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let max_len = config.thread_moderation_rationale_constraint.max() as usize;

    build_test_externalities(config).execute_with(|| {
        let (_, _, thread_id) = create_root_category_and_moderator_and_thread(origin.clone());
        let bad_rationale = generate_text(max_len + 1);
        assert_eq!(
            moderate_thread(origin, thread_id, bad_rationale),
            Err(ERROR_THREAD_MODERATION_RATIONALE_TOO_LONG)
        );
    });
}

#[test]
fn moderate_post_successfully() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let (_, _, _, post_id) = create_root_category_and_moderator_and_thread_and_post(origin.clone());
        assert_eq!(moderate_post(origin, post_id, good_rationale()), Ok(()));
    });
}

#[test]
fn moderate_post_rationale_too_short() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let min_len = config.post_moderation_rationale_constraint.min as usize;

    build_test_externalities(config).execute_with(|| {
        let (_, _, _, post_id) = create_root_category_and_moderator_and_thread_and_post(origin.clone());
        let bad_rationale = generate_text(min_len - 1);
        assert_eq!(
            moderate_post(origin, post_id, bad_rationale),
            Err(ERROR_POST_MODERATION_RATIONALE_TOO_SHORT)
        );
    });
}

#[test]
fn moderate_post_rationale_too_long() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    let max_len = config.post_moderation_rationale_constraint.max() as usize;

    build_test_externalities(config).execute_with(|| {
        let (_, _, _, post_id) = create_root_category_and_moderator_and_thread_and_post(origin.clone());
        let bad_rationale = generate_text(max_len + 1);
        assert_eq!(
            moderate_post(origin, post_id, bad_rationale),
            Err(ERROR_POST_MODERATION_RATIONALE_TOO_LONG)
        );
    });
}

#[test]
fn cannot_moderate_already_moderated_post() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let (_, _, _, post_id) = create_root_category_and_moderator_and_thread_and_post(origin.clone());
        assert_eq!(
            moderate_post(origin.clone(), post_id.clone(), good_rationale()),
            Ok(())
        );
        assert_eq!(
            moderate_post(origin, post_id, good_rationale()),
            Err(ERROR_POST_MODERATED)
        );
    });
}

// Not a forum sudo:
// -----------------------------------------------------------------------------

#[test]
fn not_forum_sudo_cannot_create_root_category() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        assert_create_category(
            NOT_FORUM_SUDO_ORIGIN,
            None,
            Err(ERROR_ORIGIN_NOT_FORUM_SUDO),
        );
    });
}

#[test]
fn not_forum_sudo_cannot_create_subcategory() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let root_category_id = create_root_category(origin);
        assert_create_category(
            NOT_FORUM_SUDO_ORIGIN,
            Some(root_category_id),
            Err(ERROR_ORIGIN_NOT_FORUM_SUDO),
        );
    });
}

#[test]
fn not_forum_sudo_cannot_archive_category() {
    assert_not_forum_sudo_cannot_update_category(archive_category);
}

#[test]
fn not_forum_sudo_cannot_unarchive_category() {
    assert_not_forum_sudo_cannot_update_category(unarchive_category);
}

#[test]
fn not_forum_sudo_cannot_delete_category() {
    assert_not_forum_sudo_cannot_update_category(delete_category);
}

#[test]
fn not_forum_sudo_cannot_undelete_category() {
    assert_not_forum_sudo_cannot_update_category(undelete_category);
}

// Not a member:
// -----------------------------------------------------------------------------

#[test]
fn not_member_cannot_create_thread() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        CreateThreadFixture {
            origin: NOT_MEMBER_ORIGIN,
            category_id: create_root_category(origin),
            title: good_thread_title(),
            text: good_thread_text(),
            result: Err(ERROR_NOT_FORUM_USER),
        }
        .call_and_assert();
    });
}

#[test]
fn not_member_cannot_create_post() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let (_, _, thread_id) = create_root_category_and_thread(origin);
        CreatePostFixture {
            origin: NOT_MEMBER_ORIGIN,
            thread_id,
            text: good_post_text(),
            result: Err(ERROR_NOT_FORUM_USER),
        }
        .call_and_assert();
    });
}

#[test]
fn not_member_cannot_edit_post() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let (_, _, _, post_id) = create_root_category_and_thread_and_post(origin);
        assert_err!(
            TestForumModule::edit_post_text(
                mock_origin(NOT_MEMBER_ORIGIN),
                post_id,
                good_rationale()
            ),
            ERROR_NOT_FORUM_USER
        );
    });
}

// Invalid id passed:
// -----------------------------------------------------------------------------

#[test]
fn cannot_create_subcategory_with_invalid_parent_category_id() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        assert_create_category(
            origin,
            Some(INVLAID_CATEGORY_ID),
            Err(ERROR_CATEGORY_DOES_NOT_EXIST),
        );
    });
}

#[test]
fn cannot_create_thread_with_invalid_category_id() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        CreateThreadFixture {
            origin: create_forum_member(),
            category_id: INVLAID_CATEGORY_ID,
            title: good_thread_title(),
            text: good_thread_text(),
            result: Err(ERROR_CATEGORY_DOES_NOT_EXIST),
        }
        .call_and_assert();
    });
}

#[test]
fn cannot_create_post_with_invalid_thread_id() {
    let config = default_genesis_config();

    build_test_externalities(config).execute_with(|| {
        CreatePostFixture {
            origin: create_forum_member(),
            thread_id: INVLAID_THREAD_ID,
            text: good_post_text(),
            result: Err(ERROR_THREAD_DOES_NOT_EXIST),
        }
        .call_and_assert();
    });
}

#[test]
fn cannot_moderate_thread_with_invalid_id() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    

    build_test_externalities(config).execute_with(|| {
        let _ = create_moderator();
        assert_err!(
            moderate_thread(origin, INVLAID_THREAD_ID, good_rationale()),
            ERROR_THREAD_DOES_NOT_EXIST
        );
    });
}

#[test]
fn cannot_moderate_post_with_invalid_id() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    

    build_test_externalities(config).execute_with(|| {
        let _ = create_moderator();
        assert_err!(
            moderate_post(origin, INVLAID_POST_ID, good_rationale()),
            ERROR_POST_DOES_NOT_EXIST
        );
    });
}

// Successfull extrinsics
// -----------------------------------------------------------------------------

#[test]
fn archive_then_unarchive_category_successfully() {
    let config = default_genesis_config();
    let forum_sudo = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let category_id = create_root_category(forum_sudo.clone());
        assert_ok!(archive_category(forum_sudo.clone(), category_id.clone(),));
        // TODO get category by id and assert archived == true.

        assert_ok!(unarchive_category(forum_sudo, category_id,));
        // TODO get category by id and assert archived == false.
    });
}

#[test]
fn delete_then_undelete_category_successfully() {
    let config = default_genesis_config();
    let forum_sudo = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let category_id = create_root_category(forum_sudo.clone());
        assert_ok!(delete_category(forum_sudo.clone(), category_id.clone(),));
        // TODO get category by id and assert deleted == true.

        assert_ok!(undelete_category(forum_sudo.clone(), category_id.clone(),));
        // TODO get category by id and assert deleted == false.
    });
}

// TODO Consider to fix the logic of the forum module
// #[test]
// fn cannot_unarchive_not_archived_category() {
//     let config = default_genesis_config();
//     let forum_sudo = OriginType::Signed(config.forum_sudo);

//     build_test_externalities(config).execute_with(|| {
//         let category_id = create_root_category(forum_sudo.clone());

//         // TODO bug in a logic! it should not be possible. !!!

//         assert_err!(
//             archive_category(
//                 forum_sudo.clone(),
//                 category_id.clone(),
//             ),
//             "... TODO expect error ..."
//         );
//     });
// }

// TODO Consider to fix the logic of the forum module
// #[test]
// fn cannot_undelete_not_deleted_category() {
//     let config = default_genesis_config();
//     let forum_sudo = OriginType::Signed(config.forum_sudo);

//     build_test_externalities(config).execute_with(|| {
//         let category_id = create_root_category(forum_sudo.clone());
//         assert_err!(
//             delete_category(
//                 forum_sudo.clone(),
//                 category_id.clone(),
//             ),
//             "... TODO expect error ..."
//         );
//     });
// }

// With archived / deleted category, moderated thread
// -----------------------------------------------------------------------------

#[test]
fn cannot_create_subcategory_in_archived_category() {
    let config = default_genesis_config();
    let forum_sudo = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let category_id = create_root_category(forum_sudo.clone());
        assert_ok!(archive_category(forum_sudo.clone(), category_id.clone(),));
        assert_create_category(
            forum_sudo,
            Some(category_id),
            Err(ERROR_ANCESTOR_CATEGORY_IMMUTABLE),
        );
    });
}

#[test]
fn cannot_create_subcategory_in_deleted_category() {
    let config = default_genesis_config();
    let forum_sudo = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let category_id = create_root_category(forum_sudo.clone());
        assert_ok!(delete_category(forum_sudo.clone(), category_id.clone(),));
        assert_create_category(
            forum_sudo,
            Some(category_id),
            Err(ERROR_ANCESTOR_CATEGORY_IMMUTABLE),
        );
    });
}

#[test]
fn cannot_create_thread_in_archived_category() {
    let config = default_genesis_config();
    let forum_sudo = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let category_id = create_root_category(forum_sudo.clone());
        assert_ok!(archive_category(forum_sudo.clone(), category_id.clone(),));
        assert_create_thread(
            create_forum_member(),
            category_id,
            Err(ERROR_ANCESTOR_CATEGORY_IMMUTABLE),
        );
    });
}

#[test]
fn cannot_create_thread_in_deleted_category() {
    let config = default_genesis_config();
    let forum_sudo = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let category_id = create_root_category(forum_sudo.clone());
        assert_ok!(delete_category(forum_sudo.clone(), category_id.clone(),));
        assert_create_thread(
            create_forum_member(),
            category_id,
            Err(ERROR_ANCESTOR_CATEGORY_IMMUTABLE),
        );
    });
}

#[test]
fn cannot_create_post_in_thread_of_archived_category() {
    let config = default_genesis_config();
    let forum_sudo = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let category_id = create_root_category(forum_sudo.clone());
        let thread_id = TestForumModule::next_thread_id();
        assert_create_thread(create_forum_member(), category_id, Ok(()));
        assert_ok!(archive_category(forum_sudo.clone(), category_id.clone(),));
        assert_create_post(
            create_forum_member(),
            thread_id,
            Err(ERROR_ANCESTOR_CATEGORY_IMMUTABLE),
        );
    });
}

#[test]
fn cannot_create_post_in_thread_of_deleted_category() {
    let config = default_genesis_config();
    let forum_sudo = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let category_id = create_root_category(forum_sudo.clone());
        let thread_id = TestForumModule::next_thread_id();
        assert_create_thread(create_forum_member(), category_id, Ok(()));
        assert_ok!(delete_category(forum_sudo.clone(), category_id.clone(),));
        assert_create_post(
            create_forum_member(),
            thread_id,
            Err(ERROR_ANCESTOR_CATEGORY_IMMUTABLE),
        );
    });
}

#[test]
fn cannot_create_post_in_moderated_thread() {
    let config = default_genesis_config();
    let forum_sudo = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let (_, _, thread_id) = create_root_category_and_moderator_and_thread(forum_sudo.clone());
        assert_ok!(moderate_thread(
            forum_sudo,
            thread_id.clone(),
            good_rationale()
        ));
        assert_create_post(
            create_forum_member(),
            thread_id,
            Err(ERROR_THREAD_MODERATED),
        );
    });
}

#[test]
fn cannot_edit_post_in_moderated_thread() {
    let config = default_genesis_config();
    let forum_sudo = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let (member_origin, _, thread_id, post_id) =
            create_root_category_and_moderator_and_thread_and_post(forum_sudo.clone());
        assert_ok!(moderate_thread(forum_sudo, thread_id, good_rationale()));
        assert_err!(
            TestForumModule::edit_post_text(mock_origin(member_origin), post_id, good_rationale()),
            ERROR_THREAD_MODERATED
        );
    });
}

// TODO impl
// #[test]
// fn cannot_edit_moderated_post() {}



// fn set_moderator_category
#[test]
fn set_moderator_category_successfully() {
    /*
     * Create an initial state with two levels of categories, where
     * leaf category is deleted, and then try to undelete.
     */
    let config = default_genesis_config();
    let sudo_member = config.forum_sudo;
    let forum_sudo = OriginType::Signed(config.forum_sudo);
    println!("forum sudo id is {}", sudo_member);

    build_test_externalities(config).execute_with(|| {
        let (_, category_id, _, _) =
            create_root_category_and_thread_and_post(forum_sudo.clone());

        let first_moderator_id = 1;
        // Ensure init value is false
        assert_eq!(
            TestForumModule::category_by_moderator(category_id, first_moderator_id),
            false
        );

        assert_eq!(
            TestForumModule::set_moderator_category(
                Origin::signed(default_genesis_config().forum_sudo),
                category_id,
                sudo_member,
                true,
            ),
            Ok(())
        );

        // Ensure the value updated successfully
        assert_eq!(
            TestForumModule::category_by_moderator(category_id, first_moderator_id),
            true
        );
    });
}


/*
 * set_max_category_depth
 * ==============================================================================
 *
 */

#[test]
fn set_max_category_depth_successfully() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin_depth = config.max_category_depth;


    build_test_externalities(config).execute_with(|| {
        // Ensure that forum sudo is default
        assert_eq!(TestForumModule::max_category_depth(), origin_depth);

        // Unset forum sudo
        assert_ok!(TestForumModule::set_max_category_depth(
            Origin::signed(forum_sudo),
            2
        ));

        // max depth updated
        assert_eq!(TestForumModule::max_category_depth(), 2);
    });
}


/*
 * up post
 * ==============================================================================
 *
 */
#[test]
fn up_post_successfully() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let (_, _, _, post_id) = create_root_category_and_thread_and_post(origin);
        assert_ok!(TestForumModule::thumb_up_post(
            Origin::signed(forum_sudo),
            post_id,
            true
        ));
        assert_eq!(TestForumModule::reaction_by_post(post_id, forum_sudo) |  PostReaction::UP, PostReaction::UP);
    });

}

/*
 * down post
 * ==============================================================================
 *
 */
#[test]
fn down_post_successfully() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let (_, _, _, post_id) = create_root_category_and_thread_and_post(origin);
        assert_ok!(TestForumModule::thumb_down_post(
            Origin::signed(forum_sudo),
            post_id,
            true
        ));
        assert_eq!(TestForumModule::reaction_by_post(post_id, forum_sudo) |  PostReaction::DOWN, PostReaction::DOWN);
    });

}

/*
 * like post
 * ==============================================================================
 *
 */
#[test]
fn like_post_successfully() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let (_, _, _, post_id) = create_root_category_and_thread_and_post(origin);
        assert_ok!(TestForumModule::like_post(
            Origin::signed(forum_sudo),
            post_id,
            true
        ));
        assert_eq!(TestForumModule::reaction_by_post(post_id, forum_sudo) |  PostReaction::LIKE, PostReaction::LIKE);
    });

}

/*
 * create_thread_with_poll
 * ==============================================================================
 *
 */
#[test]
fn create_thread_with_poll_successfully() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(config.forum_sudo);
}