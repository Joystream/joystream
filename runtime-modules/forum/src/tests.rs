#![cfg(test)]

use super::*;
use crate::mock::*;
use frame_support::assert_err;
use frame_support::traits::Currency;

/// test cases are arranged as two layers.
/// first layer is each method in defined in module.
/// second layer is each parameter of the specific method.

/*
 * update_category_membership_of_moderator_origin
 */
#[test]
// test case for check if origin is forum lead
fn update_category_membership_of_moderator_origin() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
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
            Err(Error::<Runtime>::OriginNotForumLead.into()),
        );
    });
}

#[test]
// test case for check whether category is existed.
fn update_category_membership_of_moderator_category() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
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
            Err(Error::<Runtime>::CategoryDoesNotExist.into()),
        );
    });
}

#[test]
// test an attempt to slash category_membership_of_moderator when provided moderator is not given category moderator.
fn update_category_membership_category_moderator_does_not_exist() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
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
            false,
            Err(Error::<Runtime>::CategoryModeratorDoesNotExist.into()),
        );
    });
}

#[test]
// test case for check if origin is forum lead
fn create_category_origin() {
    let origins = vec![FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_ORIGIN];
    let results = vec![Ok(()), Err(Error::<Runtime>::OriginNotForumLead.into())];
    for index in 0..origins.len() {
        with_test_externalities(|| {
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
        Err(Error::<Runtime>::AncestorCategoryImmutable.into()),
        Err(Error::<Runtime>::CategoryDoesNotExist.into()),
    ];

    for index in 0..parents.len() {
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        with_test_externalities(|| {
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
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
        let max_depth = <Runtime as Trait>::MaxCategoryDepth::get();
        for i in 0..(max_depth + 1) {
            let parent_category_id = match i {
                0 => None,
                _ => Some(i),
            };
            let expected_result = match i {
                _ if i >= max_depth => Err(Error::<Runtime>::MaxValidCategoryDepthExceeded.into()),
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
    let results = vec![Ok(()), Err(Error::<Runtime>::OriginNotForumLead.into())];

    for index in 0..origins.len() {
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        with_test_externalities(|| {
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
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
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
            Err(Error::<Runtime>::CategoryNotBeingUpdated.into()),
        );
    });
}

#[test]
// test case for editing nonexistent category
fn update_category_archival_status_category_exists() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
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
            Err(Error::<Runtime>::CategoryDoesNotExist.into()),
        );
    });
}

#[test]
// test if moderator can archive category
fn update_category_archival_status_moderator() {
    let moderators = [FORUM_MODERATOR_ORIGIN_ID];
    let origins = [FORUM_MODERATOR_ORIGIN];

    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
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
            Err(Error::<Runtime>::ModeratorCantUpdateCategory.into()),
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
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let initial_balance = 10_000_000;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            forum_lead,
            category_id,
            thread_id,
            good_post_text(),
            true,
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
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Err(Error::<Runtime>::AncestorCategoryImmutable.into()),
        );

        // can't add more posts to thread inside category
        create_post_mock(
            origin.clone(),
            forum_lead,
            forum_lead,
            category_id,
            thread_id,
            good_post_text(),
            true,
            Err(Error::<Runtime>::AncestorCategoryImmutable.into()),
        );

        // can't update post
        edit_post_text_mock(
            origin.clone(),
            forum_lead,
            category_id,
            thread_id,
            post_id,
            good_post_new_text(),
            Err(Error::<Runtime>::AncestorCategoryImmutable.into()),
        );

        // can't update thread
        edit_thread_metadata_mock(
            origin.clone(),
            forum_lead,
            category_id,
            thread_id,
            good_thread_new_metadata(),
            Err(Error::<Runtime>::AncestorCategoryImmutable.into()),
        );
    });
}

#[test]
// test if category updator is forum lead
fn update_category_description_origin() {
    let origins = [FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_ORIGIN];
    let results = vec![Ok(()), Err(Error::<Runtime>::OriginNotForumLead.into())];

    for index in 0..origins.len() {
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        with_test_externalities(|| {
            let category_id = create_category_mock(
                origin,
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
            update_category_description_mock(
                origins[index].clone(),
                PrivilegedActor::Lead,
                category_id,
                good_category_description_new(),
                results[index],
            );
        });
    }
}

#[test]
// test case for new setting actually not update category description
fn update_category_description_no_change() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        update_category_description_mock(
            origin,
            PrivilegedActor::Lead,
            category_id,
            good_category_description(),
            Err(Error::<Runtime>::CategoryNotBeingUpdated.into()),
        );
    });
}

#[test]
// test case for editing nonexistent category
fn update_category_description_does_not_exist() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
        create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        update_category_description_mock(
            origin.clone(),
            PrivilegedActor::Lead,
            1,
            good_category_description_new(),
            Ok(()),
        );
        update_category_description_mock(
            origin.clone(),
            PrivilegedActor::Lead,
            2,
            good_category_description_new(),
            Err(Error::<Runtime>::CategoryDoesNotExist.into()),
        );
    });
}

#[test]
// test if moderator can update category description
fn update_category_description_moderator() {
    let moderators = [FORUM_MODERATOR_ORIGIN_ID];
    let origins = [FORUM_MODERATOR_ORIGIN];

    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        // unprivileged moderator will fail to update category
        update_category_title_mock(
            origins[0].clone(),
            PrivilegedActor::Moderator(moderators[0]),
            category_id,
            good_category_description_new(),
            Err(Error::<Runtime>::ModeratorCantUpdateCategory.into()),
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
        update_category_description_mock(
            origins[0].clone(),
            PrivilegedActor::Moderator(moderators[0]),
            category_id,
            good_category_description_new(),
            Ok(()),
        );
    });
}

#[test]
// test if category updator is forum lead
fn update_category_title_origin() {
    let origins = [FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_ORIGIN];
    let results = vec![Ok(()), Err(Error::<Runtime>::OriginNotForumLead.into())];

    for index in 0..origins.len() {
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        with_test_externalities(|| {
            let category_id = create_category_mock(
                origin,
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
            update_category_title_mock(
                origins[index].clone(),
                PrivilegedActor::Lead,
                category_id,
                good_category_title_new(),
                results[index],
            );
        });
    }
}

#[test]
// test case for new setting actually not update category title
fn update_category_title_no_change() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        update_category_title_mock(
            origin,
            PrivilegedActor::Lead,
            category_id,
            good_category_title(),
            Err(Error::<Runtime>::CategoryNotBeingUpdated.into()),
        );
    });
}

#[test]
// test case for editing nonexistent category
fn update_category_title_does_not_exist() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
        create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        update_category_title_mock(
            origin.clone(),
            PrivilegedActor::Lead,
            1,
            good_category_title_new(),
            Ok(()),
        );
        update_category_title_mock(
            origin.clone(),
            PrivilegedActor::Lead,
            2,
            good_category_title_new(),
            Err(Error::<Runtime>::CategoryDoesNotExist.into()),
        );
    });
}

#[test]
// test if moderator can update category title
fn update_category_title_moderator() {
    let moderators = [FORUM_MODERATOR_ORIGIN_ID];
    let origins = [FORUM_MODERATOR_ORIGIN];

    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        // unprivileged moderator will fail to update category
        update_category_title_mock(
            origins[0].clone(),
            PrivilegedActor::Moderator(moderators[0]),
            category_id,
            good_category_title_new(),
            Err(Error::<Runtime>::ModeratorCantUpdateCategory.into()),
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
        update_category_title_mock(
            origins[0].clone(),
            PrivilegedActor::Moderator(moderators[0]),
            category_id,
            good_category_title_new(),
            Ok(()),
        );
    });
}

#[test]
// test category can be deleted
fn delete_category() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        assert!(<CategoryById<Runtime>>::contains_key(category_id));
        delete_category_mock(origin.clone(), PrivilegedActor::Lead, category_id, Ok(()));
        assert!(!<CategoryById<Runtime>>::contains_key(category_id));
    });
}

#[test]
// test category can't be deleted when it has subcategories
fn delete_category_non_empty_subcategories() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
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
            Err(Error::<Runtime>::CategoryNotEmptyCategories.into()),
        );
    });
}

#[test]
// test category can't be deleted when it contains threads
fn delete_category_non_empty_threads() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let initial_balance = 10_000_000;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            Err(Error::<Runtime>::CategoryNotEmptyThreads.into()),
        );
    });
}

#[test]
// test category can't be deleted by moderator only if he is moderating one of parent categories
fn delete_category_need_ancestor_moderation() {
    let moderators = [FORUM_MODERATOR_ORIGIN_ID];
    let origins = [FORUM_MODERATOR_ORIGIN];

    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
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
            Err(Error::<Runtime>::ModeratorCantDeleteCategory.into()),
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
            Err(Error::<Runtime>::ModeratorCantDeleteCategory.into()),
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
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
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
    let origins = [FORUM_LEAD_ORIGIN, NOT_FORUM_MEMBER_ORIGIN];
    let forum_user_ids = [FORUM_LEAD_ORIGIN_ID, NOT_FORUM_MEMBER_ORIGIN_ID];
    let results = vec![
        Ok(()),
        Err(Error::<Runtime>::ForumUserIdNotMatchAccount.into()),
    ];
    for index in 0..origins.len() {
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        let initial_balance = 10_000_000;
        with_test_externalities(|| {
            balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

            assert_eq!(
                balances::Module::<Runtime>::free_balance(&forum_lead),
                initial_balance
            );
            let category_id = create_category_mock(
                origin,
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
            create_thread_mock(
                origins[index].clone(),
                forum_user_ids[index],
                forum_user_ids[index],
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
// test thread creator needs minimum balance
fn create_thread_balance() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(
            &forum_lead,
            BalanceOf::<Runtime>::max_value(),
        );

        let category_id = create_category_mock(
            origin,
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        let first_thread_id = create_thread_mock(
            FORUM_LEAD_ORIGIN,
            forum_lead,
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );

        let second_thread_id = create_thread_mock(
            FORUM_LEAD_ORIGIN,
            forum_lead,
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );

        let first_state_cleanup_treasury_account: <Runtime as frame_system::Trait>::AccountId =
            <Runtime as Trait>::ModuleId::get().into_sub_account(first_thread_id);
        let second_state_cleanup_treasury_account: <Runtime as frame_system::Trait>::AccountId =
            <Runtime as Trait>::ModuleId::get().into_sub_account(second_thread_id);

        assert_ne!(
            first_state_cleanup_treasury_account,
            second_state_cleanup_treasury_account
        );
    });
}

#[test]
// test if timestamp of poll start time and end time are valid
fn create_thread_poll_timestamp() {
    let expiration_diff = 10;
    let results = vec![Ok(()), Err(Error::<Runtime>::PollTimeSetting.into())];

    for index in 0..results.len() {
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let initial_balance = 10_000_000;
        let origin = OriginType::Signed(forum_lead);

        with_test_externalities(|| {
            balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

            change_current_time(1);
            let poll = generate_poll_input_timestamp_cases(index, expiration_diff);
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
fn edit_thread_metadata() {
    let forum_users = [NOT_FORUM_LEAD_ORIGIN_ID, NOT_FORUM_LEAD_2_ORIGIN_ID];
    let origins = [NOT_FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_2_ORIGIN];

    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
        balances::Module::<Runtime>::make_free_balance_be(
            &NOT_FORUM_LEAD_ORIGIN_ID,
            initial_balance,
        );
        balances::Module::<Runtime>::make_free_balance_be(
            &NOT_FORUM_LEAD_2_ORIGIN_ID,
            initial_balance,
        );

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
            forum_users[0],
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );

        // check author can edit text
        edit_thread_metadata_mock(
            origins[0].clone(),
            forum_users[0],
            category_id,
            thread_id,
            good_thread_new_metadata(),
            Ok(()),
        );

        // check non-author is forbidden from editing text
        edit_thread_metadata_mock(
            origins[1].clone(),
            forum_users[1],
            category_id,
            thread_id,
            good_thread_new_metadata(),
            Err(Error::<Runtime>::AccountDoesNotMatchThreadAuthor.into()),
        );
    });
}

/*
 ** update_category
 */

#[test]
// test if thread creator can delete thread
fn delete_thread() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
        balances::Module::<Runtime>::make_free_balance_be(
            &NOT_FORUM_LEAD_ORIGIN_ID,
            initial_balance,
        );

        let mut current_balance = initial_balance;

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&forum_lead),
            current_balance
        );

        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        let thread_id = create_thread_mock(
            NOT_FORUM_LEAD_ORIGIN.clone(),
            NOT_FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_ORIGIN_ID,
            category_id,
            good_thread_title(),
            good_thread_text(),
            Some(generate_poll_input(10)),
            Ok(()),
        );

        current_balance -= <Runtime as Trait>::ThreadDeposit::get();
        current_balance -= <Runtime as Trait>::PostDeposit::get();

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&NOT_FORUM_LEAD_ORIGIN_ID),
            current_balance
        );

        let _ = create_post_mock(
            NOT_FORUM_LEAD_ORIGIN.clone(),
            NOT_FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_ORIGIN_ID,
            category_id,
            thread_id,
            good_post_text(),
            true,
            Ok(()),
        );

        vote_on_poll_mock(
            FORUM_LEAD_ORIGIN.clone(),
            forum_lead,
            thread_id,
            category_id,
            1,
            Ok(()),
        );

        current_balance -= <Runtime as Trait>::PostDeposit::get();

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&NOT_FORUM_LEAD_ORIGIN_ID),
            current_balance
        );

        // check poll votes exist.
        assert!(<PollVotes<Runtime>>::contains_key(thread_id, forum_lead));

        update_category_membership_of_moderator_mock(
            FORUM_MODERATOR_ORIGIN.clone(),
            FORUM_MODERATOR_ORIGIN_ID,
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
            NOT_FORUM_MODERATOR_ORIGIN.clone(),
            NOT_FORUM_MODERATOR_ORIGIN_ID,
            NOT_FORUM_MODERATOR_ORIGIN_ID,
            category_id,
            thread_id,
            Err(Error::<Runtime>::ForumUserIdNotMatchAccount.into()),
        );

        // moderator not associated with thread will fail to delete it
        delete_thread_mock(
            FORUM_MODERATOR_2_ORIGIN.clone(),
            FORUM_MODERATOR_2_ORIGIN_ID,
            FORUM_MODERATOR_2_ORIGIN_ID,
            category_id,
            thread_id,
            Err(Error::<Runtime>::ForumUserIdNotMatchAccount.into()),
        );

        // moderator will not delete thread
        delete_thread_mock(
            FORUM_MODERATOR_ORIGIN.clone(),
            FORUM_MODERATOR_ORIGIN_ID,
            FORUM_MODERATOR_ORIGIN_ID,
            category_id,
            thread_id,
            Err(Error::<Runtime>::ForumUserIdNotMatchAccount.into()),
        );

        // forum lead will not delete thread
        delete_thread_mock(
            origin.clone(),
            forum_lead,
            forum_lead,
            category_id,
            thread_id,
            Err(Error::<Runtime>::AccountDoesNotMatchThreadAuthor.into()),
        );

        // another user will not delete thread
        delete_thread_mock(
            NOT_FORUM_LEAD_2_ORIGIN.clone(),
            NOT_FORUM_LEAD_2_ORIGIN_ID,
            NOT_FORUM_LEAD_2_ORIGIN_ID,
            category_id,
            thread_id,
            Err(Error::<Runtime>::AccountDoesNotMatchThreadAuthor.into()),
        );

        // thread creator will delete thread
        delete_thread_mock(
            NOT_FORUM_LEAD_ORIGIN.clone(),
            NOT_FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_ORIGIN_ID,
            category_id,
            thread_id,
            Ok(()),
        );

        // check poll voting data was deleted
        assert!(!<PollVotes<Runtime>>::contains_key(thread_id, forum_lead));
        current_balance += <Runtime as Trait>::ThreadDeposit::get();

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&NOT_FORUM_LEAD_ORIGIN_ID),
            current_balance
        );

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

    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            Err(Error::<Runtime>::ModeratorModerateOriginCategory.into()),
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
            Err(Error::<Runtime>::ModeratorModerateOriginCategory.into()),
        );

        // moderator associated only with the second category will fail to move thread
        move_thread_mock(
            origins[0].clone(),
            moderators[0],
            category_id_1,
            thread_id,
            category_id_2,
            Err(Error::<Runtime>::ModeratorModerateDestinationCategory.into()),
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

    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            Err(Error::<Runtime>::ThreadMoveInvalid.into()),
        );
    });
}

/*
 ** vote_on_poll
 */
#[test]
// test if poll submitter is a forum user
fn vote_on_poll_origin() {
    let origins = vec![FORUM_LEAD_ORIGIN, NOT_FORUM_MEMBER_ORIGIN];
    let results = vec![
        Ok(()),
        Err(Error::<Runtime>::ForumUserIdNotMatchAccount.into()),
    ];
    let expiration_diff = 10;

    for index in 0..origins.len() {
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        let initial_balance = 10_000_000;
        with_test_externalities(|| {
            balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
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
                forum_lead,
                category_id,
                good_thread_title(),
                good_thread_text(),
                Some(generate_poll_input(expiration_diff)),
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
fn vote_on_poll_fails_on_double_voting() {
    let expiration_diff = 10;
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let initial_balance = 10_000_000;

    with_test_externalities(|| {
        Balances::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

        let category_id = create_category_mock(
            FORUM_LEAD_ORIGIN.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        let thread_id = create_thread_mock(
            FORUM_LEAD_ORIGIN.clone(),
            forum_lead,
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            Some(generate_poll_input(expiration_diff)),
            Ok(()),
        );

        vote_on_poll_mock(
            FORUM_LEAD_ORIGIN.clone(),
            forum_lead,
            thread_id,
            category_id,
            1,
            Ok(()),
        );

        vote_on_poll_mock(
            FORUM_LEAD_ORIGIN.clone(),
            forum_lead,
            thread_id,
            category_id,
            1,
            Err(Error::<Runtime>::AlreadyVotedOnPoll.into()),
        );
    });
}

#[test]
// test if poll metadata created
fn vote_on_poll_exists() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            Err(Error::<Runtime>::PollNotExist.into()),
        );
    });
}

#[test]
// test if forum reject poll submit after expiration
fn vote_on_poll_expired() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let expiration_diff = 10;
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            Some(generate_poll_input(expiration_diff)),
            Ok(()),
        );
        change_current_time(expiration_diff + 1);
        vote_on_poll_mock(
            origin.clone(),
            forum_lead,
            category_id,
            thread_id,
            1,
            Err(Error::<Runtime>::PollCommitExpired.into()),
        );
    });
}

/*
 ** moderate_thread
 */

#[test]
// test if thread moderator registered as valid moderator
fn moderate_thread_origin_ok() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
    let origins = vec![FORUM_LEAD_ORIGIN, NOT_FORUM_MEMBER_ORIGIN];
    let accounts = vec![FORUM_LEAD_ORIGIN_ID, NOT_FORUM_MEMBER_ORIGIN_ID];
    let results = vec![
        Ok(()),
        Err(Error::<Runtime>::ForumUserIdNotMatchAccount.into()),
    ];
    for index in 0..origins.len() {
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        let initial_balance = 10_000_000;
        with_test_externalities(|| {
            balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
            balances::Module::<Runtime>::make_free_balance_be(
                &NOT_FORUM_MEMBER_ORIGIN_ID,
                initial_balance,
            );
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
                forum_lead,
                category_id,
                good_thread_title(),
                good_thread_text(),
                None,
                Ok(()),
            );
            create_post_mock(
                origins[index].clone(),
                accounts[index],
                forum_lead,
                category_id,
                thread_id,
                good_post_text(),
                true,
                results[index],
            );
        });
    }
}

#[test]
// test that we can't add editable posst without enough balance but we can add a non-editable one.
fn add_post_balance() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
        let initial_balance = <Runtime as Trait>::PostDeposit::get()
            + <Runtime as Trait>::ThreadDeposit::get()
            + <Runtime as balances::Trait>::ExistentialDeposit::get();

        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&forum_lead),
            initial_balance
        );

        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&forum_lead),
            <Runtime as balances::Trait>::ExistentialDeposit::get()
        );

        balances::Module::<Runtime>::make_free_balance_be(
            &forum_lead,
            <Runtime as Trait>::PostDeposit::get() - 1,
        );

        // Can't create an editable post without enough balance
        create_post_mock(
            FORUM_LEAD_ORIGIN,
            forum_lead,
            forum_lead,
            category_id,
            thread_id,
            good_post_text(),
            true,
            Err(Error::<Runtime>::InsufficientBalanceForPost.into()),
        );

        // No balance requirements for non-editable posts
        create_post_mock(
            FORUM_LEAD_ORIGIN,
            forum_lead,
            forum_lead,
            category_id,
            thread_id,
            good_post_text(),
            false,
            Ok(()),
        );
    });
}

#[test]
// test if post text can be edited by author
fn edit_post_text() {
    let forum_users = [NOT_FORUM_LEAD_ORIGIN_ID, NOT_FORUM_LEAD_2_ORIGIN_ID];
    let origins = [NOT_FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_2_ORIGIN];

    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);

    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
        balances::Module::<Runtime>::make_free_balance_be(
            &NOT_FORUM_LEAD_ORIGIN_ID,
            initial_balance,
        );
        balances::Module::<Runtime>::make_free_balance_be(
            &NOT_FORUM_LEAD_2_ORIGIN_ID,
            initial_balance,
        );

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
            forum_users[0],
            category_id,
            thread_id,
            good_post_text(),
            true,
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
            Err(Error::<Runtime>::AccountDoesNotMatchPostAuthor.into()),
        );
    });
}

#[test]
// can't edit non-editable post
fn edit_non_editable_post_text() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);

    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
        balances::Module::<Runtime>::make_free_balance_be(
            &NOT_FORUM_LEAD_ORIGIN_ID,
            initial_balance,
        );

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
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );

        // create post by author
        let post_id = create_post_mock(
            origin.clone(),
            forum_lead,
            forum_lead,
            category_id,
            thread_id,
            good_post_text(),
            false,
            Ok(()),
        );

        // check non-author is forbidden from editing text
        edit_post_text_mock(
            origin.clone(),
            forum_lead,
            category_id,
            thread_id,
            post_id,
            good_post_new_text(),
            Err(Error::<Runtime>::PostDoesNotExist.into()),
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
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = FORUM_LEAD_ORIGIN;
        let initial_balance = 10_000_000;

        with_test_externalities(|| {
            balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
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
                forum_lead,
                category_id,
                thread_id,
                good_post_text(),
                true,
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
    let origins = vec![FORUM_LEAD_ORIGIN, NOT_FORUM_MODERATOR_ORIGIN];
    let results = vec![
        Ok(()),
        Err(Error::<Runtime>::ModeratorIdNotMatchAccount.into()),
    ];
    for index in 0..origins.len() {
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        let initial_balance = 10_000_000;
        with_test_externalities(|| {
            balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
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
                forum_lead,
                category_id,
                thread_id,
                good_post_text(),
                true,
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

/*
 * Delete post
*/

#[test]
// Test that post creator can delete it
fn delete_post_creator() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
        balances::Module::<Runtime>::make_free_balance_be(
            &NOT_FORUM_LEAD_ORIGIN_ID,
            initial_balance,
        );

        let mut current_balance = initial_balance;

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&forum_lead),
            current_balance
        );

        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        let thread_id = create_thread_mock(
            NOT_FORUM_LEAD_ORIGIN.clone(),
            NOT_FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_ORIGIN_ID,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );

        current_balance -= <Runtime as Trait>::ThreadDeposit::get();
        current_balance -= <Runtime as Trait>::PostDeposit::get();

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&NOT_FORUM_LEAD_ORIGIN_ID),
            current_balance
        );

        let post_id = create_post_mock(
            NOT_FORUM_LEAD_ORIGIN.clone(),
            NOT_FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_ORIGIN_ID,
            category_id,
            thread_id,
            good_post_text(),
            true,
            Ok(()),
        );

        current_balance -= <Runtime as Trait>::PostDeposit::get();

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&NOT_FORUM_LEAD_ORIGIN_ID),
            current_balance
        );

        update_category_membership_of_moderator_mock(
            FORUM_MODERATOR_ORIGIN.clone(),
            FORUM_MODERATOR_ORIGIN_ID,
            category_id,
            true,
            Ok(()),
        );

        // regular user will fail to delete the thread
        delete_post_mock(
            NOT_FORUM_MODERATOR_ORIGIN.clone(),
            NOT_FORUM_MODERATOR_ORIGIN_ID,
            NOT_FORUM_MODERATOR_ORIGIN_ID,
            category_id,
            thread_id,
            post_id,
            Err(Error::<Runtime>::ForumUserIdNotMatchAccount.into()),
            false,
        );

        // moderator not associated with thread will fail to delete it
        delete_post_mock(
            FORUM_MODERATOR_2_ORIGIN.clone(),
            FORUM_MODERATOR_2_ORIGIN_ID,
            FORUM_MODERATOR_2_ORIGIN_ID,
            category_id,
            thread_id,
            post_id,
            Err(Error::<Runtime>::ForumUserIdNotMatchAccount.into()),
            false,
        );

        // moderator will not delete thread
        delete_post_mock(
            FORUM_MODERATOR_ORIGIN.clone(),
            FORUM_MODERATOR_ORIGIN_ID,
            FORUM_MODERATOR_ORIGIN_ID,
            category_id,
            thread_id,
            post_id,
            Err(Error::<Runtime>::ForumUserIdNotMatchAccount.into()),
            false,
        );

        // forum lead will not delete thread
        delete_post_mock(
            origin.clone(),
            forum_lead,
            forum_lead,
            category_id,
            thread_id,
            post_id,
            Err(Error::<Runtime>::AccountDoesNotMatchPostAuthor.into()),
            false,
        );

        // another user will not delete thread
        delete_post_mock(
            NOT_FORUM_LEAD_2_ORIGIN.clone(),
            NOT_FORUM_LEAD_2_ORIGIN_ID,
            NOT_FORUM_LEAD_2_ORIGIN_ID,
            category_id,
            thread_id,
            post_id,
            Err(Error::<Runtime>::AccountDoesNotMatchPostAuthor.into()),
            false,
        );

        // post creator will delete thread
        delete_post_mock(
            NOT_FORUM_LEAD_ORIGIN.clone(),
            NOT_FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_ORIGIN_ID,
            category_id,
            thread_id,
            post_id,
            Ok(()),
            true,
        );

        current_balance += <Runtime as Trait>::PostDeposit::get();

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&NOT_FORUM_LEAD_ORIGIN_ID),
            current_balance
        );
    });
}

#[test]
// Test that not creator of a post can delete it after N blocks
fn delete_post_not_creator() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
        balances::Module::<Runtime>::make_free_balance_be(
            &NOT_FORUM_LEAD_ORIGIN_ID,
            initial_balance,
        );

        let mut current_balance = initial_balance;

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&forum_lead),
            current_balance
        );

        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        let thread_id = create_thread_mock(
            NOT_FORUM_LEAD_ORIGIN.clone(),
            NOT_FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_ORIGIN_ID,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );

        current_balance -= <Runtime as Trait>::ThreadDeposit::get();
        current_balance -= <Runtime as Trait>::PostDeposit::get();

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&NOT_FORUM_LEAD_ORIGIN_ID),
            current_balance
        );

        let post_id = create_post_mock(
            NOT_FORUM_LEAD_ORIGIN.clone(),
            NOT_FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_ORIGIN_ID,
            category_id,
            thread_id,
            good_post_text(),
            true,
            Ok(()),
        );

        current_balance -= <Runtime as Trait>::PostDeposit::get();

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&NOT_FORUM_LEAD_ORIGIN_ID),
            current_balance
        );

        update_category_membership_of_moderator_mock(
            FORUM_MODERATOR_ORIGIN.clone(),
            FORUM_MODERATOR_ORIGIN_ID,
            category_id,
            true,
            Ok(()),
        );

        delete_thread_mock(
            NOT_FORUM_LEAD_ORIGIN.clone(),
            NOT_FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_ORIGIN_ID,
            category_id,
            thread_id,
            Ok(()),
        );

        // post creator will not delete thread now
        delete_post_mock(
            NOT_FORUM_LEAD_2_ORIGIN.clone(),
            NOT_FORUM_LEAD_2_ORIGIN_ID,
            NOT_FORUM_LEAD_2_ORIGIN_ID,
            category_id,
            thread_id,
            post_id,
            Err(Error::<Runtime>::AccountDoesNotMatchPostAuthor.into()),
            false,
        );

        current_balance += <Runtime as Trait>::ThreadDeposit::get();

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&NOT_FORUM_LEAD_ORIGIN_ID),
            current_balance
        );

        let current_block = System::block_number();
        run_to_block(current_block + <Runtime as Trait>::PostLifeTime::get());

        let not_creator_balance =
            balances::Module::<Runtime>::free_balance(&NOT_FORUM_LEAD_2_ORIGIN_ID);

        // not post creator wil not be able to delete hiding the post
        delete_post_mock(
            NOT_FORUM_LEAD_2_ORIGIN.clone(),
            NOT_FORUM_LEAD_2_ORIGIN_ID,
            NOT_FORUM_LEAD_2_ORIGIN_ID,
            category_id,
            thread_id,
            post_id,
            Err(Error::<Runtime>::AccountDoesNotMatchPostAuthor.into()),
            true,
        );

        // not post creator will delete thread now
        delete_post_mock(
            NOT_FORUM_LEAD_2_ORIGIN.clone(),
            NOT_FORUM_LEAD_2_ORIGIN_ID,
            NOT_FORUM_LEAD_2_ORIGIN_ID,
            category_id,
            thread_id,
            post_id,
            Ok(()),
            false,
        );

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&NOT_FORUM_LEAD_ORIGIN_ID),
            current_balance
        );

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&NOT_FORUM_LEAD_2_ORIGIN_ID),
            not_creator_balance + <Runtime as Trait>::PostDeposit::get()
        );
    });
}

#[test]
fn set_stickied_threads_ok() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );
        set_stickied_threads_mock(
            origin.clone(),
            moderator_id,
            category_id,
            vec![thread_id],
            Ok(()),
        );

        let thread_id_deleted = create_thread_mock(
            origin.clone(),
            forum_lead,
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );
        moderate_thread_mock(
            origin.clone(),
            moderator_id,
            category_id,
            thread_id_deleted,
            good_moderation_rationale(),
            Ok(()),
        );
        // Cannot set a deleted thread as sticky.
        set_stickied_threads_mock(
            origin,
            moderator_id,
            category_id,
            vec![thread_id, thread_id_deleted],
            Err(Error::<Runtime>::ThreadDoesNotExist.into()),
        );
    });
}

#[test]
fn set_stickied_threads_fails_with_duplicated_ids() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;

    with_test_externalities(|| {
        Balances::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            vec![thread_id, thread_id],
            Err(Error::<Runtime>::StickiedThreadIdsDuplicates.into()),
        );
    });
}

#[test]
fn set_stickied_threads_wrong_moderator() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            Err(Error::<Runtime>::ModeratorCantUpdateCategory.into()),
        );
    });
}

#[test]
fn set_stickied_threads_thread_not_exists() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            Err(Error::<Runtime>::ThreadDoesNotExist.into()),
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

        assert_err!(
            TestForumModule::create_category(
                mock_origin(origin.clone()),
                None,
                good_category_title(),
                good_category_description()
            ),
            Error::<Runtime>::DataMigrationNotDone,
        );

        assert_err!(
            TestForumModule::create_thread(
                mock_origin(origin.clone()),
                forum_user_id,
                category_id,
                good_thread_title(),
                good_thread_text(),
                None,
            ),
            Error::<Runtime>::DataMigrationNotDone,
        );

        assert_err!(
            TestForumModule::add_post(
                mock_origin(origin.clone()),
                forum_user_id,
                category_id,
                thread_id,
                good_post_text(),
                true,
            ),
            Error::<Runtime>::DataMigrationNotDone,
        );

        assert_err!(
            TestForumModule::moderate_thread(
                mock_origin(origin.clone()),
                PrivilegedActor::Moderator(moderator_id),
                category_id,
                thread_id,
                good_moderation_rationale(),
            ),
            Error::<Runtime>::DataMigrationNotDone,
        );

        assert_err!(
            TestForumModule::moderate_post(
                mock_origin(origin.clone()),
                PrivilegedActor::Moderator(moderator_id),
                category_id,
                thread_id,
                post_id,
                good_moderation_rationale(),
            ),
            Error::<Runtime>::DataMigrationNotDone,
        );
    });
}

#[test]
// test storage limits are enforced
fn storage_limit_checks() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;

    // test MaxSubcategories and MaxThreadsInCategory
    with_test_externalities(|| {
        balances::Module::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
                    _ if i == max => Err(Error::<Runtime>::MapSizeLimit.into()),
                    _ => Ok(()),
                },
            );
        }
    });

    // test MaxModeratorsForCategory
    with_test_externalities(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        let max: usize =
            <<<Runtime as Trait>::MapLimits as StorageLimits>::MaxModeratorsForCategory>::get()
                as usize;
        for i in 0..max {
            let moderator_id = EXTRA_MODERATORS[i];
            update_category_membership_of_moderator_mock(
                origin.clone(),
                moderator_id,
                category_id,
                true,
                match i {
                    _ if i == max => Err(Error::<Runtime>::MapSizeLimit.into()),
                    _ => Ok(()),
                },
            );
        }
    });

    // test MaxCategories
    with_test_externalities(|| {
        let max: usize =
            <<<Runtime as Trait>::MapLimits as StorageLimits>::MaxCategories>::get() as usize;
        for i in 0..max {
            create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                match i {
                    _ if i == max => Err(Error::<Runtime>::MapSizeLimit.into()),
                    _ => Ok(()),
                },
            );
        }
    });
}
