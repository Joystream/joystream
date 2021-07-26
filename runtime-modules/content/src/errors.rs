use crate::*;
use frame_support::decl_error;

decl_error! {
    /// Content directory errors
    pub enum Error for Module<T: Trait> {
        /// Feature Not Implemented
        FeatureNotImplemented,

        // Curator Management Errors
        // -------------------------

        /// Curator under provided curator id is not a member of curaror group under given id
        CuratorIsNotAMemberOfGivenCuratorGroup,

        /// Curator under provided curator id is already a member of curaror group under given id
        CuratorIsAlreadyAMemberOfGivenCuratorGroup,

        /// Given curator group does not exist
        CuratorGroupDoesNotExist,

        /// Max number of curators per group limit reached
        CuratorsPerGroupLimitReached,

        /// Curator group is not active
        CuratorGroupIsNotActive,

        /// Curator id is not a worker id in content working group
        CuratorIdInvalid,

        /// Member Id invalid
        MemberIdInvalid,

        /// Account does not match thread author
        AccountDoesNotMatchThreadAuthor,

        /// Account does not match Post author
        AccountDoesNotMatchPostAuthor,

        /// Moderator canont update category
        ModeratorCantUpdateCategory,

        // Authentication Errors
        // ---------------------

        /// Lead authentication failed
        LeadAuthFailed,

        /// Member authentication failed
        MemberAuthFailed,

        /// Curator authentication failed
        CuratorAuthFailed,

        /// Expected root or signed origin
        BadOrigin,

        /// Operation cannot be perfomed with this Actor
        ActorNotAuthorized,

        /// This content actor cannot own a channel
        ActorCannotOwnChannel,

        /// A Channel or Video Category does not exist.
        CategoryDoesNotExist,

        /// A Post does not exist.
        PostDoesNotExist,

        /// Channel does not exist
        ChannelDoesNotExist,

        /// Video does not exist
        VideoDoesNotExist,

        /// Video in season can`t be removed (because order is important)
        VideoInSeason,

        /// Curators can only censor non-curator group owned channels
        CannotCensoreCuratorGroupOwnedChannels,

        /// thread does not exists
        ThreadDoesNotExist,

        /// category does not exists
        ForumCategoryDoesNotExist,

        /// non empty threads for a category
        CategoryNotEmptyThreads,

        /// non empty subcategories for a category
        CategoryNotEmptySubCategories,

        /// Error encountered when transversing forum categories
        PathLengthShouldBeGreaterThanZero,

        /// Error encountered when transversing forum categories
        MapSizeLimit,

        /// Ancestor category immutable
        AncestorCategoryImmutable,

        /// maximum category depth exceeded
        MaxValidCategoryDepthExceeded,

        /// maximum category depth exceeded
        CategoryModeratorDoesNotExist,

        /// Subreddit cannot be Modified
        SubredditCannotBeModified,


    }
}
