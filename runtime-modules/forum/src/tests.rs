#![cfg(test)]

use super::*;
use crate::mock::*;
/// test cases are arranged as two layers.
/// first layer is each method in defined in module.
/// second layer is each parameter of the specific method.

/*
 * update_category_membership_of_moderator_origin
 */
#[test]
// test case for check if origin is forum lead
fn update_category_membership_of_moderator_origin() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let moderator_id = forum_lead;
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        update_category_membership_of_moderator_mock(
            origin,
            moderator_id,
            category_id,
            true,
            Ok(()),
        );
        update_category_membership_of_moderator_mock(
            NOT_FORUM_LEAD_ORIGIN,
            moderator_id,
            category_id,
            true,
            Err(Error::OriginNotForumLead),
        );
    });
}

#[test]
// test case for check whether category is existed.
fn update_category_membership_of_moderator_category() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let moderator_id = forum_lead;
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        update_category_membership_of_moderator_mock(
            origin.clone(),
            moderator_id,
            category_id,
            true,
            Ok(()),
        );
        update_category_membership_of_moderator_mock(
            origin.clone(),
            moderator_id,
            INVLAID_CATEGORY_ID,
            true,
            Err(Error::CategoryDoesNotExist),
        );
    });
}

#[test]
// test case for check if origin is forum lead
fn create_category_origin() {
    let origins = vec![FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_ORIGIN];
    let results = vec![Ok(()), Err(Error::OriginNotForumLead)];
    for index in 0..origins.len() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            create_category_mock(
                origins[index].clone(),
                None,
                good_category_title(),
                good_category_description(),
                results[index].clone(),
            );
        });
    }
}

#[test]
// test case for check if parent category is archived or not existing.
fn create_category_parent() {
    let parents = vec![Some(1), Some(2), Some(3)];
    let results = vec![
        Ok(()),
        Err(Error::AncestorCategoryImmutable),
        Err(Error::CategoryDoesNotExist),
    ];

    for index in 0..parents.len() {
        let config = default_genesis_config();
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        build_test_externalities(config).execute_with(|| {
            create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
            create_category_mock(
                origin.clone(),
                Some(1),
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
            update_category_archival_status_mock(
                origin.clone(),
                PrivilegedActor::Lead,
                2,
                true,
                Ok(()),
            );

            create_category_mock(
                origin.clone(),
                parents[index],
                good_category_title(),
                good_category_description(),
                results[index],
            );
        });
    }
}

#[test]
// test case set category depth
fn create_category_depth() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let max_depth = <Runtime as Trait>::MaxCategoryDepth::get();
        for i in 0..(max_depth + 1) {
            let parent_category_id = match i {
                0 => None,
                _ => Some(i),
            };
            let expected_result = match i {
                _ if i >= max_depth => Err(Error::MaxValidCategoryDepthExceeded),
                _ => Ok(()),
            };

            create_category_mock(
                origin.clone(),
                parent_category_id,
                good_category_title(),
                good_category_description(),
                expected_result,
            );
        }
    });
}

/*
 ** update_category
 */
#[test]
// test if category updator is forum lead
fn update_category_archival_status_origin() {
    let origins = [FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_ORIGIN];
    let results = vec![Ok(()), Err(Error::OriginNotForumLead)];

    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        build_test_externalities(config).execute_with(|| {
            let category_id = create_category_mock(
                origin,
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
            update_category_archival_status_mock(
                origins[index].clone(),
                PrivilegedActor::Lead,
                category_id,
                true,
                results[index],
            );
        });
    }
}

#[test]
// test case for new setting actually not update category status
fn update_category_archival_status_no_change() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        update_category_archival_status_mock(
            origin,
            PrivilegedActor::Lead,
            category_id,
            false,
            Err(Error::CategoryNotBeingUpdated),
        );
    });
}

#[test]
// test case for editing nonexistent category
fn update_category_archival_status_category_exists() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        update_category_archival_status_mock(
            origin.clone(),
            PrivilegedActor::Lead,
            1,
            true,
            Ok(()),
        );
        update_category_archival_status_mock(
            origin.clone(),
            PrivilegedActor::Lead,
            2,
            true,
            Err(Error::CategoryDoesNotExist),
        );
    });
}

#[test]
// test if moderator can archive category
fn update_category_archival_status_moderator() {
    let moderators = [FORUM_MODERATOR_ORIGIN_ID];
    let origins = [FORUM_MODERATOR_ORIGIN];

    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        // unprivileged moderator will fail to update category
        update_category_archival_status_mock(
            origins[0].clone(),
            PrivilegedActor::Moderator(moderators[0]),
            category_id,
            true,
            Err(Error::ModeratorCantUpdateCategory),
        );

        // give permision to moderate category itself
        update_category_membership_of_moderator_mock(
            origin.clone(),
            moderators[0],
            category_id,
            true,
            Ok(()),
        );

        // moderator associated with category will succeed
        update_category_archival_status_mock(
            origins[0].clone(),
            PrivilegedActor::Moderator(moderators[0]),
            category_id,
            true,
            Ok(()),
        );
    });
}

#[test]
// test if moderator can archive category
fn update_category_archival_status_lock_works() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );

        let post_id = create_post_mock(
            origin.clone(),
            forum_lead,
            category_id,
            thread_id,
            good_post_text(),
            Ok(()),
        );

        update_category_archival_status_mock(
            origin.clone(),
            PrivilegedActor::Lead,
            1,
            true,
            Ok(()),
        );

        // can't add more threads
        create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Err(Error::AncestorCategoryImmutable),
        );

        // can't add more posts to thread inside category
        create_post_mock(
            origin.clone(),
            forum_lead,
            category_id,
            thread_id,
            good_post_text(),
            Err(Error::AncestorCategoryImmutable),
        );

        // can't update post
        edit_post_text_mock(
            origin.clone(),
            forum_lead,
            category_id,
            thread_id,
            post_id,
            good_post_new_text(),
            Err(Error::AncestorCategoryImmutable),
        );

        // can't update thread
        edit_thread_title_mock(
            origin.clone(),
            forum_lead,
            category_id,
            thread_id,
            good_thread_new_title(),
            Err(Error::AncestorCategoryImmutable),
        );
    });
}

#[test]
// test category can be deleted
fn delete_category() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        assert!(<CategoryById<Runtime>>::exists(category_id));
        delete_category_mock(origin.clone(), PrivilegedActor::Lead, category_id, Ok(()));
        assert!(!<CategoryById<Runtime>>::exists(category_id));
    });
}

#[test]
// test category can't be deleted when it has subcategories
fn delete_category_non_empty_subcategories() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        create_category_mock(
            origin.clone(),
            Some(category_id),
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        delete_category_mock(
            origin.clone(),
            PrivilegedActor::Lead,
            category_id,
            Err(Error::CategoryNotEmptyCategories),
        );
    });
}

#[test]
// test category can't be deleted when it contains threads
fn delete_category_non_empty_threads() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );

        delete_category_mock(
            origin.clone(),
            PrivilegedActor::Lead,
            category_id,
            Err(Error::CategoryNotEmptyThreads),
        );
    });
}

#[test]
// test category can't be deleted by moderator only if he is moderating one of parent categories
fn delete_category_need_ancestor_moderation() {
    let moderators = [FORUM_MODERATOR_ORIGIN_ID];
    let origins = [FORUM_MODERATOR_ORIGIN];

    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id_1 = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        let category_id_2 = create_category_mock(
            origin.clone(),
            Some(category_id_1),
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        // without any permissions, moderator can't delete category
        delete_category_mock(
            origins[0].clone(),
            PrivilegedActor::Moderator(moderators[0]),
            category_id_2,
            Err(Error::ModeratorCantDeleteCategory),
        );

        // give permision to moderate category itself
        update_category_membership_of_moderator_mock(
            origin.clone(),
            moderators[0],
            category_id_2,
            true,
            Ok(()),
        );

        // without permissions to moderate only category itself, moderator can't delete category
        delete_category_mock(
            origins[0].clone(),
            PrivilegedActor::Moderator(moderators[0]),
            category_id_2,
            Err(Error::ModeratorCantDeleteCategory),
        );

        // give permision to moderate parent category
        update_category_membership_of_moderator_mock(
            origin.clone(),
            moderators[0],
            category_id_1,
            true,
            Ok(()),
        );

        // check number of subcategories is correct
        assert_eq!(
            <CategoryById<Runtime>>::get(category_id_1).num_direct_subcategories,
            1,
        );

        // with permissions to moderate parent category, delete will work
        delete_category_mock(
            origins[0].clone(),
            PrivilegedActor::Moderator(moderators[0]),
            category_id_2,
            Ok(()),
        );

        // check that subcategory count was decreased
        assert_eq!(
            <CategoryById<Runtime>>::get(category_id_1).num_direct_subcategories,
            0,
        );
    });
}

#[test]
// test if lead can delete root category
fn delete_category_root_by_lead() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        delete_category_mock(origin.clone(), PrivilegedActor::Lead, category_id, Ok(()));
    });
}

/*
 ** create_thread
 */
#[test]
// test if thread creator is valid forum user
fn create_thread_origin() {
    let origins = [NOT_FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_2_ORIGIN];
    let forum_user_id = NOT_FORUM_LEAD_ORIGIN_ID;
    let results = vec![Ok(()), Err(Error::ForumUserIdNotMatchAccount)];
    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        build_test_externalities(config).execute_with(|| {
            let category_id = create_category_mock(
                origin,
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
            create_thread_mock(
                origins[index].clone(),
                forum_user_id,
                category_id,
                good_thread_title(),
                good_thread_text(),
                None,
                results[index],
            );
        });
    }
}

#[test]
// test if timestamp of poll start time and end time are valid
fn create_thread_poll_timestamp() {
    let expiration_diff = 10;
    let results = vec![Ok(()), Err(Error::PollTimeSetting)];

    for index in 0..results.len() {
        let config = default_genesis_config();
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);

        build_test_externalities(config).execute_with(|| {
            change_current_time(1);
            let poll = generate_poll_timestamp_cases(index, expiration_diff);
            change_current_time(index as u64 * expiration_diff + 1);

            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );

            create_thread_mock(
                origin.clone(),
                forum_lead,
                category_id,
                good_thread_title(),
                good_thread_text(),
                Some(poll),
                results[index],
            );
        });
    }
}

#[test]
// test if author can edit thread's title
fn edit_thread_title() {
    let forum_users = [NOT_FORUM_LEAD_ORIGIN_ID, NOT_FORUM_LEAD_2_ORIGIN_ID];
    let origins = [NOT_FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_2_ORIGIN];

    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        // create thread by author
        let thread_id = create_thread_mock(
            origins[0].clone(),
            forum_users[0],
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );

        // check author can edit text
        edit_thread_title_mock(
            origins[0].clone(),
            forum_users[0],
            category_id,
            thread_id,
            good_thread_new_title(),
            Ok(()),
        );

        // check non-author is forbidden from editing text
        edit_thread_title_mock(
            origins[1].clone(),
            forum_users[1],
            category_id,
            thread_id,
            good_thread_new_title(),
            Err(Error::AccountDoesNotMatchThreadAuthor),
        );
    });
}

/*
 ** update_category
 */
#[test]
// test if category updator is forum lead
fn update_thread_archival_status_origin() {
    let origins = [FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_ORIGIN];
    let results = vec![Ok(()), Err(Error::OriginNotForumLead)];

    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        build_test_externalities(config).execute_with(|| {
            let category_id = create_category_mock(
                origin,
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );

            let thread_id = create_thread_mock(
                origins[0].clone(),
                forum_lead,
                category_id,
                good_thread_title(),
                good_thread_text(),
                None,
                Ok(()),
            );
            update_thread_archival_status_mock(
                origins[index].clone(),
                PrivilegedActor::Lead,
                category_id,
                thread_id,
                true,
                results[index],
            );
        });
    }
}

#[test]
// test case for new setting actually not update thread status
fn update_thread_archival_status_no_change() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );
        update_thread_archival_status_mock(
            origin,
            PrivilegedActor::Lead,
            category_id,
            thread_id,
            false,
            Err(Error::ThreadNotBeingUpdated),
        );
    });
}

#[test]
// test case for editing nonexistent thread
fn update_thread_archival_status_thread_exists() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );
        update_thread_archival_status_mock(
            origin.clone(),
            PrivilegedActor::Lead,
            category_id,
            thread_id,
            true,
            Ok(()),
        );
        update_thread_archival_status_mock(
            origin.clone(),
            PrivilegedActor::Lead,
            category_id,
            thread_id + 1,
            true,
            Err(Error::ThreadDoesNotExist),
        );
    });
}

#[test]
// test if moderator can archive thread
fn update_thread_archival_status_moderator() {
    let moderators = [FORUM_MODERATOR_ORIGIN_ID];
    let origins = [FORUM_MODERATOR_ORIGIN];

    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );

        // unprivileged moderator will fail to update category
        update_thread_archival_status_mock(
            origins[0].clone(),
            PrivilegedActor::Moderator(moderators[0]),
            category_id,
            thread_id,
            true,
            Err(Error::ModeratorCantUpdateCategory),
        );

        // give permision to moderate category itself
        update_category_membership_of_moderator_mock(
            origin.clone(),
            moderators[0],
            category_id,
            true,
            Ok(()),
        );

        // moderator associated with category will succeed
        update_thread_archival_status_mock(
            origins[0].clone(),
            PrivilegedActor::Moderator(moderators[0]),
            category_id,
            thread_id,
            true,
            Ok(()),
        );
    });
}

#[test]
// test if moderator can archive thread
fn update_thread_archival_status_lock_works() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );

        let post_id = create_post_mock(
            origin.clone(),
            forum_lead,
            category_id,
            thread_id,
            good_post_text(),
            Ok(()),
        );

        update_thread_archival_status_mock(
            origin.clone(),
            PrivilegedActor::Lead,
            category_id,
            thread_id,
            true,
            Ok(()),
        );

        // can't add more posts to thread inside category
        create_post_mock(
            origin.clone(),
            forum_lead,
            category_id,
            thread_id,
            good_post_text(),
            Err(Error::ThreadImmutable),
        );

        // can't update post
        edit_post_text_mock(
            origin.clone(),
            forum_lead,
            category_id,
            thread_id,
            post_id,
            good_post_new_text(),
            Err(Error::ThreadImmutable),
        );

        // can't update thread
        edit_thread_title_mock(
            origin.clone(),
            forum_lead,
            category_id,
            thread_id,
            good_thread_new_title(),
            Err(Error::ThreadImmutable),
        );
    });
}

#[test]
// test if moderator can delete thread
fn delete_thread() {
    let moderators = [
        FORUM_MODERATOR_ORIGIN_ID,
        FORUM_MODERATOR_2_ORIGIN_ID,
        NOT_FORUM_LEAD_ORIGIN_ID,
    ];
    let origins = [
        FORUM_MODERATOR_ORIGIN,
        FORUM_MODERATOR_2_ORIGIN,
        NOT_FORUM_LEAD_ORIGIN,
    ];

    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );

        let post_id = create_post_mock(
            origin.clone(),
            forum_lead,
            category_id,
            thread_id,
            good_post_text(),
            Ok(()),
        );

        update_category_membership_of_moderator_mock(
            origin.clone(),
            moderators[0],
            category_id,
            true,
            Ok(()),
        );

        // check number of category's threads match before delete
        assert_eq!(
            <CategoryById<Runtime>>::get(category_id).num_direct_threads,
            1
        );

        // regular user will fail to delete the thread
        delete_thread_mock(
            origins[2].clone(),
            moderators[2],
            category_id,
            thread_id,
            Err(Error::ModeratorIdNotMatchAccount),
        );

        // moderator not associated with thread will fail to delete it
        delete_thread_mock(
            origins[1].clone(),
            moderators[1],
            category_id,
            thread_id,
            Err(Error::ModeratorCantUpdateCategory),
        );

        // moderator will delete thread
        delete_thread_mock(
            origins[0].clone(),
            moderators[0],
            category_id,
            thread_id,
            Ok(()),
        );

        // check thread's post was deleted
        assert!(!<PostById<Runtime>>::exists(thread_id, post_id));

        // check category's thread count was decreased
        assert_eq!(
            <CategoryById<Runtime>>::get(category_id).num_direct_threads,
            0
        );
    });
}

#[test]
// test if moderator can move thread between two categories he moderates
fn move_thread_moderator_permissions() {
    let moderators = [FORUM_MODERATOR_ORIGIN_ID, FORUM_MODERATOR_2_ORIGIN_ID];
    let origins = [FORUM_MODERATOR_ORIGIN, FORUM_MODERATOR_2_ORIGIN];

    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id_1 = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        let category_id_2 = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        // sanity check
        assert_ne!(category_id_1, category_id_2);

        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id_1,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );

        // moderator not associated with any category will fail to move thread
        move_thread_mock(
            origins[0].clone(),
            moderators[0],
            category_id_1,
            thread_id,
            category_id_2,
            Err(Error::ModeratorModerateOriginCategory),
        );

        // set incomplete permissions for first user (only category 1)
        update_category_membership_of_moderator_mock(
            origin.clone(),
            moderators[0],
            category_id_1,
            true,
            Ok(()),
        );
        // set incomplete permissions for second user (only category 2)
        update_category_membership_of_moderator_mock(
            origin.clone(),
            moderators[1],
            category_id_2,
            true,
            Ok(()),
        );

        // moderator associated only with the first category will fail to move thread
        move_thread_mock(
            origins[1].clone(),
            moderators[1],
            category_id_1,
            thread_id,
            category_id_2,
            Err(Error::ModeratorModerateOriginCategory),
        );

        // moderator associated only with the second category will fail to move thread
        move_thread_mock(
            origins[0].clone(),
            moderators[0],
            category_id_1,
            thread_id,
            category_id_2,
            Err(Error::ModeratorModerateDestinationCategory),
        );

        // give the rest of necessary permissions to the first moderator
        update_category_membership_of_moderator_mock(
            origin.clone(),
            moderators[0],
            category_id_2,
            true,
            Ok(()),
        );

        // check counters of threads in category
        assert_eq!(
            <CategoryById<Runtime>>::get(category_id_1).num_direct_threads,
            1,
        );
        assert_eq!(
            <CategoryById<Runtime>>::get(category_id_2).num_direct_threads,
            0,
        );

        // moderator associated with both categories will succeed to move thread
        move_thread_mock(
            origins[0].clone(),
            moderators[0],
            category_id_1,
            thread_id,
            category_id_2,
            Ok(()),
        );

        // check counters of threads in category
        assert_eq!(
            <CategoryById<Runtime>>::get(category_id_1).num_direct_threads,
            0,
        );
        assert_eq!(
            <CategoryById<Runtime>>::get(category_id_2).num_direct_threads,
            1,
        );
    });
}

#[test]
// test if error is thrown when origin and destination category is the same
fn move_thread_invalid_move() {
    let moderators = [FORUM_MODERATOR_ORIGIN_ID];
    let origins = [FORUM_MODERATOR_ORIGIN];

    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );

        // set permissions
        update_category_membership_of_moderator_mock(
            origin.clone(),
            moderators[0],
            category_id,
            true,
            Ok(()),
        );

        move_thread_mock(
            origins[0].clone(),
            moderators[0],
            category_id,
            thread_id,
            category_id,
            Err(Error::ThreadMoveInvalid),
        );
    });
}

/*
 ** vote_on_poll
 */
#[test]
// test if poll submitter is a forum user
fn vote_on_poll_origin() {
    let origins = vec![FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_ORIGIN];
    let results = vec![Ok(()), Err(Error::ForumUserIdNotMatchAccount)];
    let expiration_diff = 10;

    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        build_test_externalities(config).execute_with(|| {
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
            let thread_id = create_thread_mock(
                origin.clone(),
                forum_lead,
                category_id,
                good_thread_title(),
                good_thread_text(),
                Some(generate_poll(expiration_diff)),
                Ok(()),
            );

            vote_on_poll_mock(
                origins[index].clone(),
                forum_lead,
                thread_id,
                category_id,
                1,
                results[index],
            );
        });
    }
}

#[test]
// test if poll metadata created
fn vote_on_poll_exists() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );
        vote_on_poll_mock(
            origin.clone(),
            forum_lead,
            thread_id,
            category_id,
            1,
            Err(Error::PollNotExist),
        );
    });
}

#[test]
// test if forum reject poll submit after expiration
fn vote_on_poll_expired() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let expiration_diff = 10;

    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            Some(generate_poll(expiration_diff)),
            Ok(()),
        );
        change_current_time(expiration_diff + 1);
        vote_on_poll_mock(
            origin.clone(),
            forum_lead,
            category_id,
            thread_id,
            1,
            Err(Error::PollCommitExpired),
        );
    });
}

/*
 ** moderate_thread
 */

#[test]
// test if thread moderator registered as valid moderator
fn moderate_thread_origin_ok() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let moderator_id = forum_lead;
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        update_category_membership_of_moderator_mock(
            origin.clone(),
            moderator_id,
            category_id,
            true,
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );
        moderate_thread_mock(
            origin,
            moderator_id,
            category_id,
            thread_id,
            good_moderation_rationale(),
            Ok(()),
        );
    });
}

/*
 ** add_post
 */

#[test]
// test if post origin registered as forum user
fn add_post_origin() {
    let origins = vec![FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_ORIGIN];
    let results = vec![Ok(()), Err(Error::ForumUserIdNotMatchAccount)];
    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        build_test_externalities(config).execute_with(|| {
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );

            let thread_id = create_thread_mock(
                origin.clone(),
                forum_lead,
                category_id,
                good_thread_title(),
                good_thread_text(),
                None,
                Ok(()),
            );
            create_post_mock(
                origins[index].clone(),
                forum_lead,
                category_id,
                thread_id,
                good_post_text(),
                results[index],
            );
        });
    }
}

#[test]
// test if post text can be edited by author
fn edit_post_text() {
    let config = default_genesis_config();
    let forum_users = [NOT_FORUM_LEAD_ORIGIN_ID, NOT_FORUM_LEAD_2_ORIGIN_ID];
    let origins = [NOT_FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_2_ORIGIN];

    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);

    build_test_externalities(config).execute_with(|| {
        // prepare category and thread
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );

        // create post by author
        let post_id = create_post_mock(
            origins[0].clone(),
            forum_users[0],
            category_id,
            thread_id,
            good_post_text(),
            Ok(()),
        );

        // check author can edit text
        edit_post_text_mock(
            origins[0].clone(),
            forum_users[0],
            category_id,
            thread_id,
            post_id,
            good_post_new_text(),
            Ok(()),
        );

        // check non-author is forbidden from editing text
        edit_post_text_mock(
            origins[1].clone(),
            forum_users[1],
            category_id,
            thread_id,
            post_id,
            good_post_new_text(),
            Err(Error::AccountDoesNotMatchPostAuthor),
        );
    });
}

/*
 ** react_post
 */
#[test]
// test if post react take effect
fn react_post() {
    // three reations to post, test them one by one.
    let reactions = vec![0, 1, 2];
    for index in 0..reactions.len() {
        let config = default_genesis_config();
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = FORUM_LEAD_ORIGIN;

        build_test_externalities(config).execute_with(|| {
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );

            let thread_id = create_thread_mock(
                origin.clone(),
                forum_lead,
                category_id,
                good_thread_title(),
                good_thread_text(),
                None,
                Ok(()),
            );
            let post_id = create_post_mock(
                origin.clone(),
                forum_lead,
                category_id,
                thread_id,
                good_post_text(),
                Ok(()),
            );
            react_post_mock(
                origin.clone(),
                forum_lead,
                category_id,
                thread_id,
                post_id,
                reactions[index],
                Ok(()),
            );
        });
    }
}

/*
 ** moderate_post
 */

#[test]
// test if post moderator registered
fn moderate_post_origin() {
    let origins = vec![FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_ORIGIN];
    let results = vec![Ok(()), Err(Error::ModeratorIdNotMatchAccount)];
    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        build_test_externalities(config).execute_with(|| {
            let moderator_id = forum_lead;

            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
            update_category_membership_of_moderator_mock(
                origin.clone(),
                moderator_id,
                category_id,
                true,
                Ok(()),
            );

            let thread_id = create_thread_mock(
                origin.clone(),
                forum_lead,
                category_id,
                good_thread_title(),
                good_thread_text(),
                None,
                Ok(()),
            );
            let post_id = create_post_mock(
                origin.clone(),
                forum_lead,
                category_id,
                thread_id,
                good_post_text(),
                Ok(()),
            );
            moderate_post_mock(
                origins[index].clone(),
                moderator_id,
                category_id,
                thread_id,
                post_id,
                good_moderation_rationale(),
                results[index],
            );
        });
    }
}

#[test]
fn set_stickied_threads_ok() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let moderator_id = forum_lead;
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        update_category_membership_of_moderator_mock(
            origin.clone(),
            moderator_id,
            category_id,
            true,
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );
        set_stickied_threads_mock(origin, moderator_id, category_id, vec![thread_id], Ok(()));
    });
}

#[test]
fn set_stickied_threads_wrong_moderator() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let moderator_id = forum_lead;
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );
        set_stickied_threads_mock(
            origin,
            moderator_id,
            category_id,
            vec![thread_id],
            Err(Error::ModeratorCantUpdateCategory),
        );
    });
}

#[test]
fn set_stickied_threads_thread_not_exists() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let moderator_id = forum_lead;
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        update_category_membership_of_moderator_mock(
            origin.clone(),
            moderator_id,
            category_id,
            true,
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );
        let wrong_thread_id = thread_id + 1;
        set_stickied_threads_mock(
            origin,
            moderator_id,
            category_id,
            vec![wrong_thread_id],
            Err(Error::ThreadDoesNotExist),
        );
    });
}

#[test]
fn test_migration_not_done() {
    let config = migration_not_done_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let forum_user_id = 1;
        let moderator_id = 1;
        let category_id = 1;
        let thread_id = 1;
        let post_id = 1;

        assert_eq!(
            TestForumModule::create_category(
                mock_origin(origin.clone()),
                None,
                good_category_title(),
                good_category_description()
            ),
            Err(Error::DataMigrationNotDone),
        );

        assert_eq!(
            TestForumModule::create_thread(
                mock_origin(origin.clone()),
                forum_user_id,
                category_id,
                good_thread_title(),
                good_thread_text(),
                None,
            ),
            Err(Error::DataMigrationNotDone),
        );

        assert_eq!(
            TestForumModule::add_post(
                mock_origin(origin.clone()),
                forum_user_id,
                category_id,
                thread_id,
                good_post_text(),
            ),
            Err(Error::DataMigrationNotDone),
        );

        assert_eq!(
            TestForumModule::moderate_thread(
                mock_origin(origin.clone()),
                PrivilegedActor::Moderator(moderator_id),
                category_id,
                thread_id,
                good_moderation_rationale(),
            ),
            Err(Error::DataMigrationNotDone),
        );

        assert_eq!(
            TestForumModule::moderate_post(
                mock_origin(origin.clone()),
                PrivilegedActor::Moderator(moderator_id),
                category_id,
                thread_id,
                post_id,
                good_moderation_rationale(),
            ),
            Err(Error::DataMigrationNotDone),
        );
    });
}

#[test]
// test storage limits are enforced
fn storage_limit_checks() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        // test max subcategories limit
        let max = <<<Runtime as Trait>::MapLimits as StorageLimits>::MaxSubcategories>::get();
        for i in 0..max {
            create_category_mock(
                origin.clone(),
                Some(category_id),
                good_category_title(),
                good_category_description(),
                match i {
                    _ if i == max => Err(Error::MapSizeLimit),
                    _ => Ok(()),
                },
            );
        }

        // test max threads in category
        let max = <<<Runtime as Trait>::MapLimits as StorageLimits>::MaxThreadsInCategory>::get();
        for i in 0..max {
            create_thread_mock(
                origin.clone(),
                forum_lead,
                category_id,
                good_thread_title(),
                good_thread_text(),
                None,
                match i {
                    _ if i == max => Err(Error::MapSizeLimit),
                    _ => Ok(()),
                },
            );
        }
    });

    let config = default_genesis_config();
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );

        // test max posts in thread
        let max = <<<Runtime as Trait>::MapLimits as StorageLimits>::MaxPostsInThread>::get();
        // starting from 1 because create_thread_mock creates one post by itself
        for i in 1..max {
            create_post_mock(
                origin.clone(),
                forum_lead,
                category_id,
                thread_id,
                good_post_text(),
                match i {
                    _ if i == max => Err(Error::MapSizeLimit),
                    _ => Ok(()),
                },
            );
        }
    });
}
