#![cfg(test)]

use super::*;
use crate::mock::*;
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
// test an attempt to add moderator to a category when provided moderator_id is not an existing worker id
fn update_category_membership_fails_when_moderator_worker_does_not_exist() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    with_test_externalities(|| {
        let moderator_id = 9999;
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
            Err(DispatchError::Other("Worker doesnt exist")),
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
                results[index],
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
        let max_depth = <Runtime as Config>::MaxCategoryDepth::get();
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
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            good_thread_metadata(),
            good_thread_text(),
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
            good_thread_metadata(),
            good_thread_text(),
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
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            good_thread_metadata(),
            good_thread_text(),
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
            balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

            assert_eq!(
                balances::Pallet::<Runtime>::free_balance(&forum_lead),
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
                good_thread_metadata(),
                good_thread_text(),
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
        balances::Pallet::<Runtime>::make_free_balance_be(
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
            good_thread_metadata(),
            good_thread_text(),
            Ok(()),
        );

        let second_thread_id = create_thread_mock(
            FORUM_LEAD_ORIGIN,
            forum_lead,
            forum_lead,
            category_id,
            good_thread_metadata(),
            good_thread_text(),
            Ok(()),
        );

        let first_state_cleanup_treasury_account: <Runtime as frame_system::Config>::AccountId =
            <Runtime as Config>::ModuleId::get().into_sub_account_truncating(first_thread_id);
        let second_state_cleanup_treasury_account: <Runtime as frame_system::Config>::AccountId =
            <Runtime as Config>::ModuleId::get().into_sub_account_truncating(second_thread_id);

        assert_ne!(
            first_state_cleanup_treasury_account,
            second_state_cleanup_treasury_account
        );
    });
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
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
        balances::Pallet::<Runtime>::make_free_balance_be(
            &NOT_FORUM_LEAD_ORIGIN_ID,
            initial_balance,
        );
        balances::Pallet::<Runtime>::make_free_balance_be(
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
            good_thread_metadata(),
            good_thread_text(),
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

#[test]
fn create_thread_fails_on_non_existing_category() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let initial_balance = 10_000_000;

    with_test_externalities(|| {
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&forum_lead),
            initial_balance
        );
        let invalid_category_id = 100;
        create_thread_mock(
            FORUM_LEAD_ORIGIN,
            FORUM_LEAD_ORIGIN_ID,
            FORUM_LEAD_ORIGIN_ID,
            invalid_category_id,
            good_thread_metadata(),
            good_thread_text(),
            Err(Error::<Runtime>::CategoryDoesNotExist.into()),
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
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
        balances::Pallet::<Runtime>::make_free_balance_be(
            &NOT_FORUM_LEAD_ORIGIN_ID,
            initial_balance,
        );

        let mut current_balance = initial_balance;

        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&forum_lead),
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
            good_thread_metadata(),
            good_thread_text(),
            Ok(()),
        );

        current_balance -= <Runtime as Config>::ThreadDeposit::get();
        current_balance -= <Runtime as Config>::PostDeposit::get();

        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&NOT_FORUM_LEAD_ORIGIN_ID),
            current_balance
        );

        // Delete original post first to allow thread deletion
        delete_post_mock(
            NOT_FORUM_LEAD_ORIGIN.clone(),
            NOT_FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_ORIGIN_ID,
            category_id,
            thread_id,
            TestForumModule::next_post_id() - 1,
            Ok(()),
            false,
        );

        current_balance += <Runtime as Config>::PostDeposit::get();

        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&NOT_FORUM_LEAD_ORIGIN_ID),
            current_balance
        );

        update_category_membership_of_moderator_mock(
            origin.clone(),
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

        current_balance += <Runtime as Config>::ThreadDeposit::get();

        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&NOT_FORUM_LEAD_ORIGIN_ID),
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
fn delete_thread_fails_with_outstanding_posts() {
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Pallet::<Runtime>::make_free_balance_be(
            &NOT_FORUM_LEAD_ORIGIN_ID,
            initial_balance,
        );

        let category_id = create_category_mock(
            FORUM_LEAD_ORIGIN.clone(),
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
            good_thread_metadata(),
            good_thread_text(),
            Ok(()),
        );

        delete_thread_mock(
            NOT_FORUM_LEAD_ORIGIN.clone(),
            NOT_FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_ORIGIN_ID,
            category_id,
            thread_id,
            Err(Error::<Runtime>::CannotDeleteThreadWithOutstandingPosts.into()),
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
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            good_thread_metadata(),
            good_thread_text(),
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
fn category_updated_successfully_on_thread_moving() {
    let moderator = FORUM_MODERATOR_ORIGIN_ID;
    let moderator_origin = FORUM_MODERATOR_ORIGIN;

    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            good_thread_metadata(),
            good_thread_text(),
            Ok(()),
        );

        // set incomplete permissions for first user (only category 1)
        update_category_membership_of_moderator_mock(
            origin.clone(),
            moderator,
            category_id_1,
            true,
            Ok(()),
        );

        // give the rest of necessary permissions to the first moderator
        update_category_membership_of_moderator_mock(
            origin.clone(),
            moderator,
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

        // move in one direction
        move_thread_mock(
            moderator_origin.clone(),
            moderator,
            category_id_1,
            thread_id,
            category_id_2,
            Ok(()),
        );

        assert_eq!(
            TestForumModule::thread_by_id(category_id_2, thread_id).category_id,
            category_id_2
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

        // move in opposite direction
        move_thread_mock(
            moderator_origin.clone(),
            moderator,
            category_id_2,
            thread_id,
            category_id_1,
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

        assert_eq!(
            TestForumModule::thread_by_id(category_id_1, thread_id).category_id,
            category_id_1
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
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            good_thread_metadata(),
            good_thread_text(),
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
 ** moderate_thread
 */

#[test]
// test if thread moderator registered as valid moderator
fn moderate_thread_origin_ok() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            good_thread_metadata(),
            good_thread_text(),
            Ok(()),
        );
        // Delete original post first to allow thread deletion
        delete_post_mock(
            origin.clone(),
            forum_lead,
            forum_lead,
            category_id,
            thread_id,
            TestForumModule::next_post_id() - 1,
            Ok(()),
            false,
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

#[test]
fn moderate_thread_fails_with_outstanding_posts() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            good_thread_metadata(),
            good_thread_text(),
            Ok(()),
        );
        moderate_thread_mock(
            origin,
            moderator_id,
            category_id,
            thread_id,
            good_moderation_rationale(),
            Err(Error::<Runtime>::CannotDeleteThreadWithOutstandingPosts.into()),
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
            balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
            balances::Pallet::<Runtime>::make_free_balance_be(
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
                good_thread_metadata(),
                good_thread_text(),
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
        let initial_balance = <Runtime as Config>::PostDeposit::get()
            + <Runtime as Config>::ThreadDeposit::get()
            + <Runtime as balances::Config>::ExistentialDeposit::get();

        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&forum_lead),
            initial_balance
        );

        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            forum_lead,
            category_id,
            good_thread_metadata(),
            good_thread_text(),
            Ok(()),
        );

        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&forum_lead),
            <Runtime as balances::Config>::ExistentialDeposit::get()
        );

        balances::Pallet::<Runtime>::make_free_balance_be(
            &forum_lead,
            <Runtime as Config>::PostDeposit::get() - 1,
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
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
        balances::Pallet::<Runtime>::make_free_balance_be(
            &NOT_FORUM_LEAD_ORIGIN_ID,
            initial_balance,
        );
        balances::Pallet::<Runtime>::make_free_balance_be(
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
            good_thread_metadata(),
            good_thread_text(),
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
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
        balances::Pallet::<Runtime>::make_free_balance_be(
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
            good_thread_metadata(),
            good_thread_text(),
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
            balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
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
                good_thread_metadata(),
                good_thread_text(),
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
            balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
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
                good_thread_metadata(),
                good_thread_text(),
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

#[test]
fn moderate_post_fails_when_insufficient_permissions_or_invalid_post_path() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
        let moderator_id = forum_lead;

        // Create 2 categories
        for _ in 1..=2 {
            create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
        }

        // Add moderator to the 2nd category
        update_category_membership_of_moderator_mock(origin.clone(), moderator_id, 2, true, Ok(()));

        // Create a thread (along with initial post) in each category
        for i in 1..=2 {
            create_thread_mock(
                origin.clone(),
                forum_lead,
                forum_lead,
                i,
                good_thread_metadata(),
                good_thread_text(),
                Ok(()),
            );
        }

        // Try all possible combinations of category, thread and post ids from 1 to 3
        // (this will include cases like: invalid but exsiting category, invalid and non-existing category,
        // invalid but existing thread, invalid and non-existing thread etc.)
        for category_id in 1..=3 {
            for thread_id in 1..=3 {
                for post_id in 1..=3 {
                    // exclude the only valid combination
                    if (category_id, thread_id, post_id) == (2, 2, 2) {
                        continue;
                    }
                    let expected_error = match category_id {
                        1 => Err(Error::<Runtime>::ModeratorCantUpdateCategory.into()),
                        2 => Err(Error::<Runtime>::PostDoesNotExist.into()),
                        _ => Err(Error::<Runtime>::CategoryDoesNotExist.into()),
                    };
                    // assert failure
                    moderate_post_mock(
                        origin.clone(),
                        moderator_id,
                        category_id,
                        thread_id,
                        post_id,
                        good_moderation_rationale(),
                        expected_error,
                    );
                }
            }
        }
    });
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
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);
        balances::Pallet::<Runtime>::make_free_balance_be(
            &NOT_FORUM_LEAD_ORIGIN_ID,
            initial_balance,
        );

        let mut current_balance = initial_balance;

        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&forum_lead),
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
            good_thread_metadata(),
            good_thread_text(),
            Ok(()),
        );

        current_balance -= <Runtime as Config>::ThreadDeposit::get();
        current_balance -= <Runtime as Config>::PostDeposit::get();

        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&NOT_FORUM_LEAD_ORIGIN_ID),
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

        current_balance -= <Runtime as Config>::PostDeposit::get();

        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&NOT_FORUM_LEAD_ORIGIN_ID),
            current_balance
        );

        update_category_membership_of_moderator_mock(
            origin.clone(),
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

        current_balance += <Runtime as Config>::PostDeposit::get();

        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&NOT_FORUM_LEAD_ORIGIN_ID),
            current_balance
        );
    });
}

#[test]
fn delete_post_fails_for_non_existing_posts() {
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Pallet::<Runtime>::make_free_balance_be(
            &NOT_FORUM_LEAD_ORIGIN_ID,
            initial_balance,
        );

        for _ in 1..=2 {
            create_category_mock(
                FORUM_LEAD_ORIGIN.clone(),
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
        }

        for i in 1..=2 {
            create_thread_mock(
                NOT_FORUM_LEAD_ORIGIN.clone(),
                NOT_FORUM_LEAD_ORIGIN_ID,
                NOT_FORUM_LEAD_ORIGIN_ID,
                i,
                good_thread_metadata(),
                good_thread_text(),
                Ok(()),
            );
        }

        // Try all possible combinations of category, thread and post ids from 1 to 3
        // (this will include cases like: invalid but exsiting category, invalid and non-existing category,
        // invalid but existing thread, invalid and non-existing thread etc.)
        for category_id in 1..=3 {
            for thread_id in 1..=3 {
                for post_id in 1..=3 {
                    // exclude the only 2 valid combinations
                    if (category_id, thread_id, post_id) == (1, 1, 1)
                        || (category_id, thread_id, post_id) == (2, 2, 2)
                    {
                        continue;
                    }
                    delete_post_mock(
                        NOT_FORUM_LEAD_ORIGIN.clone(),
                        NOT_FORUM_LEAD_ORIGIN_ID,
                        NOT_FORUM_LEAD_ORIGIN_ID,
                        category_id,
                        thread_id,
                        post_id,
                        Err(Error::<Runtime>::PostDoesNotExist.into()),
                        false,
                    );
                }
            }
        }
    });
}

#[test]
fn set_stickied_threads_ok() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;
    with_test_externalities(|| {
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            good_thread_metadata(),
            good_thread_text(),
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
            good_thread_metadata(),
            good_thread_text(),
            Ok(()),
        );
        // Delete original post first to allow thread deletion
        delete_post_mock(
            origin.clone(),
            forum_lead,
            forum_lead,
            category_id,
            thread_id_deleted,
            TestForumModule::next_post_id() - 1,
            Ok(()),
            false,
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
            good_thread_metadata(),
            good_thread_text(),
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
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            good_thread_metadata(),
            good_thread_text(),
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
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

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
            good_thread_metadata(),
            good_thread_text(),
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
// test storage limits are enforced
fn storage_limit_checks() {
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    let initial_balance = 10_000_000;

    // test MaxSubcategories and MaxThreadsInCategory
    with_test_externalities(|| {
        balances::Pallet::<Runtime>::make_free_balance_be(&forum_lead, initial_balance);

        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        // test max subcategories limit
        let max = <<<Runtime as Config>::MapLimits as StorageLimits>::MaxSubcategories>::get();
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
            <<<Runtime as Config>::MapLimits as StorageLimits>::MaxModeratorsForCategory>::get()
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
            <<<Runtime as Config>::MapLimits as StorageLimits>::MaxCategories>::get() as usize;
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
