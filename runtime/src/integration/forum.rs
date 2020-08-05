/*
 * Forum module integration
 *
 * ForumUserRegistry could have been implemented directly on
 * the membership module, and likewise ForumUser on Profile,
 * however this approach is more loosely coupled.
 *
 * Further exploration required to decide what the long
 * run convention should be.
 */

use crate::{AccountId, Runtime};

/// Shim registry which will proxy ForumUserRegistry behaviour to the members module
pub struct ShimMembershipRegistry {}

impl forum::ForumUserRegistry<AccountId> for ShimMembershipRegistry {
    fn get_forum_user(id: &AccountId) -> Option<forum::ForumUser<AccountId>> {
        if membership::Module::<Runtime>::is_member_account(id) {
            // For now we don't retrieve the members profile since it is not used for anything,
            // but in the future we may need it to read out more
            // information possibly required to construct a
            // ForumUser.

            // Now convert member profile to a forum user
            Some(forum::ForumUser { id: id.clone() })
        } else {
            None
        }
    }
}
