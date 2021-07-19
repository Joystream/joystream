// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![allow(clippy::type_complexity)]

#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};

use codec::{Codec, Decode, Encode};
pub use frame_support::dispatch::DispatchResult;
use frame_support::traits::{Currency, ExistenceRequirement};
use frame_support::weights::Weight;
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage, ensure, traits::Get, Parameter,
};
use frame_system::ensure_signed;
use sp_arithmetic::traits::{BaseArithmetic, One};
pub use sp_io::storage::clear_prefix;
use sp_runtime::traits::{AccountIdConversion, MaybeSerialize, Member};
use sp_runtime::{ModuleId, SaturatedConversion};
use sp_std::collections::btree_set::BTreeSet;
use sp_std::fmt::Debug;
use sp_std::prelude::*;

use common::membership::MemberOriginValidator;
use common::working_group::WorkingGroupAuthenticator;

mod mock;
mod tests;

mod benchmarking;

/// Type for keeping track of number of posts in a thread
pub type NumberOfPosts = u64;

/// Moderator ID alias for the actor of the system.
pub type ModeratorId<T> = common::ActorId<T>;

/// Forum user ID alias for the member of the system.
pub type ForumUserId<T> = common::MemberId<T>;
type WeightInfoForum<T> = <T as Trait>::WeightInfo;

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

/// Alias for the thread
pub type ThreadOf<T> = Thread<
    ForumUserId<T>,
    <T as Trait>::CategoryId,
    <T as pallet_timestamp::Trait>::Moment,
    <T as frame_system::Trait>::Hash,
    BalanceOf<T>,
>;

type Balances<T> = balances::Module<T>;

/// pallet_forum WeightInfo.
/// Note: This was auto generated through the benchmark CLI using the `--weight-trait` flag
pub trait WeightInfo {
    fn create_category(i: u32, j: u32, k: u32) -> Weight;
    fn update_category_membership_of_moderator_new() -> Weight;
    fn update_category_membership_of_moderator_old() -> Weight;
    fn update_category_archival_status_lead(i: u32) -> Weight;
    fn update_category_archival_status_moderator(i: u32) -> Weight;
    fn update_category_title_lead(i: u32, j: u32) -> Weight;
    fn update_category_title_moderator(i: u32, j: u32) -> Weight;
    fn update_category_description_lead(i: u32, j: u32) -> Weight;
    fn update_category_description_moderator(i: u32, j: u32) -> Weight;
    fn delete_category_lead(i: u32) -> Weight;
    fn delete_category_moderator(i: u32) -> Weight;
    fn create_thread(j: u32, k: u32, i: u32) -> Weight;
    fn edit_thread_title(i: u32, j: u32) -> Weight;
    fn delete_thread(i: u32) -> Weight;
    fn move_thread_to_category_lead(i: u32) -> Weight;
    fn move_thread_to_category_moderator(i: u32) -> Weight;
    fn vote_on_poll(i: u32, j: u32) -> Weight;
    fn moderate_thread_lead(i: u32, k: u32) -> Weight;
    fn moderate_thread_moderator(i: u32, k: u32) -> Weight;
    fn add_post(i: u32, j: u32) -> Weight;
    fn react_post(i: u32) -> Weight;
    fn edit_post_text(i: u32, j: u32) -> Weight;
    fn moderate_post_lead(i: u32, j: u32) -> Weight;
    fn moderate_post_moderator(i: u32, j: u32) -> Weight;
    fn delete_posts(i: u32, j: u32, k: u32) -> Weight;
    fn set_stickied_threads_lead(i: u32, j: u32) -> Weight;
    fn set_stickied_threads_moderator(i: u32, j: u32) -> Weight;
}

pub trait Trait:
    frame_system::Trait
    + pallet_timestamp::Trait
    + common::membership::MembershipTypes
    + balances::Trait
{
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    type CategoryId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

    type ThreadId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

    type PostId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

    type PostReactionId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

    /// Base deposit for any thread (note: thread creation also needs a `PostDeposit` since
    /// creating a thread means also creating a post)
    type ThreadDeposit: Get<Self::Balance>;

    /// Deposit needed to create a post
    type PostDeposit: Get<Self::Balance>;

    /// Maximum depth for nested categories
    type MaxCategoryDepth: Get<u64>;

    /// Maximum number of blocks before a post can be erased by anyone
    type PostLifeTime: Get<Self::BlockNumber>;

    /// Type defining the limits for different Storage items in the forum pallet
    type MapLimits: StorageLimits;

    /// The forum module Id, used to derive the account Id to hold the thread bounty
    type ModuleId: Get<ModuleId>;

    /// Weight information for extrinsics in this pallet.
    type WeightInfo: WeightInfo;

    /// Working group pallet integration.
    type WorkingGroup: common::working_group::WorkingGroupAuthenticator<Self>;

    /// Validates member id and origin combination
    type MemberOriginValidator: MemberOriginValidator<
        Self::Origin,
        common::MemberId<Self>,
        Self::AccountId,
    >;

    fn calculate_hash(text: &[u8]) -> Self::Hash;
}

/// Upper bounds for storage maps and double maps. Needed to prevent potential block exhaustion during deletion, etc.
/// MaxSubcategories, MaxThreadsInCategory, and MaxPostsInThread should be reasonably small because when the category is deleted
/// all of it's subcategories with their threads and posts will be iterated over and deleted.
pub trait StorageLimits {
    /// Maximum direct subcategories in a category
    type MaxSubcategories: Get<u64>;

    /// Maximum moderator count for a single category
    type MaxModeratorsForCategory: Get<u64>;

    /// Maximum total of all existing categories
    type MaxCategories: Get<u64>;

    /// Maximum number of poll alternatives
    type MaxPollAlternativesNumber: Get<u64>;
}

/// Represents all poll alternative text hashes and vote count for each one
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct PollAlternative<Hash> {
    /// hash of alternative description
    pub alternative_text_hash: Hash,

    /// Vote count for the alternative
    pub vote_count: u32,
}

/// Represents all poll alternative texts and vote count for each one
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct PollAlternativeInput {
    /// alternative description
    pub alternative_text: Vec<u8>,

    /// Vote count for the alternative
    pub vote_count: u32,
}

/// Represents a poll input
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct PollInput<Timestamp> {
    /// description
    pub description: Vec<u8>,

    /// pallet_timestamp of poll end
    pub end_time: Timestamp,

    /// Alternative description and count
    pub poll_alternatives: Vec<PollAlternativeInput>,
}

/// Represents a poll
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct Poll<Timestamp, Hash> {
    /// hash of description
    pub description_hash: Hash,

    /// pallet_timestamp of poll end
    pub end_time: Timestamp,

    /// Alternative description and count
    pub poll_alternatives: Vec<PollAlternative<Hash>>,
}

/// Represents a thread post
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub struct Post<ForumUserId, ThreadId, Hash, Balance, BlockNumber> {
    /// Id of thread to which this post corresponds.
    pub thread_id: ThreadId,

    /// Hash of current text
    pub text_hash: Hash,

    /// Author of post.
    pub author_id: ForumUserId,

    /// Cleanup pay off
    pub cleanup_pay_off: Balance,

    /// When it was created or last edited
    pub last_edited: BlockNumber,
}

/// Represents a thread
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Debug, Eq)]
pub struct Thread<ForumUserId, CategoryId, Moment, Hash, Balance> {
    /// Title hash
    pub title_hash: Hash,

    /// Category in which this thread lives
    pub category_id: CategoryId,

    /// Author of post.
    pub author_id: ForumUserId,

    /// poll description.
    pub poll: Option<Poll<Moment, Hash>>,

    /// Pay off by deleting
    pub cleanup_pay_off: Balance,

    /// Number of posts in the thread
    pub number_of_posts: NumberOfPosts,
}

/// Represents a category
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Category<CategoryId, ThreadId, Hash> {
    /// Title
    pub title_hash: Hash,

    /// Description
    pub description_hash: Hash,

    /// Whether category is archived.
    pub archived: bool,

    /// Number of subcategories, needed for emptiness checks when trying to delete category
    pub num_direct_subcategories: u32,

    // Number of threads in category, needed for emptiness checks when trying to delete category
    pub num_direct_threads: u32,

    pub num_direct_moderators: u32,

    /// Parent category, if child of another category, otherwise this category is a root category
    pub parent_category_id: Option<CategoryId>,

    /// Sticky threads list
    pub sticky_thread_ids: Vec<ThreadId>,
}

#[derive(Encode, Decode, Clone, PartialEq, Eq)]
pub enum PrivilegedActor<T: Trait> {
    Lead,
    Moderator(ModeratorId<T>),
}

impl<T: Trait> core::fmt::Debug for PrivilegedActor<T> {
    fn fmt(&self, formatter: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            PrivilegedActor::Lead => write!(formatter, "PrivilegedActor {{ Lead }}"),
            PrivilegedActor::Moderator(moderator_id) => {
                write!(formatter, "PrivilegedActor {{ {:?} }}", moderator_id)
            }
        }
    }
}

/// Represents a sequence of categories which have child-parent relatioonship
/// where last element is final ancestor, or root, in the context of the category tree.
type CategoryTreePath<CategoryId, ThreadId, Hash> =
    Vec<(CategoryId, Category<CategoryId, ThreadId, Hash>)>;

type CategoryTreePathArg<CategoryId, ThreadId, Hash> =
    [(CategoryId, Category<CategoryId, ThreadId, Hash>)];

decl_error! {
    /// Forum predefined errors
    pub enum Error for Module<T: Trait> {
        /// Origin doesn't correspond to any lead account
        OriginNotForumLead,

        /// Forum user id not match its account.
        ForumUserIdNotMatchAccount,

        /// Moderator id not match its account.
        ModeratorIdNotMatchAccount,

        // Errors about thread.

        /// Thread not authored by the given user.
        AccountDoesNotMatchThreadAuthor,

        /// Thread does not exist
        ThreadDoesNotExist,

        /// Moderator can't moderate category containing thread.
        ModeratorModerateOriginCategory,

        /// Moderator can't moderate destination category.
        ModeratorModerateDestinationCategory,

        /// Origin is the same as the destination.
        ThreadMoveInvalid,

        /// Thread not being updated.
        ThreadNotBeingUpdated,

        /// Not enough balance to create thread
        InsufficientBalanceForThreadCreation,

        // Errors about post.

        /// Post does not exist.
        PostDoesNotExist,

        /// Account does not match post author.
        AccountDoesNotMatchPostAuthor,

        /// Not enough balance to post
        InsufficientBalanceForPost,

        // Errors about category.

        /// Category not being updated.
        CategoryNotBeingUpdated,

        /// Ancestor category immutable, i.e. deleted or archived
        AncestorCategoryImmutable,

        /// Maximum valid category depth exceeded.
        MaxValidCategoryDepthExceeded,

        /// Category does not exist.
        CategoryDoesNotExist,

        /// Provided moderator is not given category moderator
        CategoryModeratorDoesNotExist,

        /// Category still contains some threads.
        CategoryNotEmptyThreads,

        /// Category still contains some subcategories.
        CategoryNotEmptyCategories,

        /// No permissions to delete category.
        ModeratorCantDeleteCategory,

        /// No permissions to update category.
        ModeratorCantUpdateCategory,

        /// Duplicates for the stickied thread id collection.
        StickiedThreadIdsDuplicates,

        // Errors about poll.

        /// Poll items number too short.
        PollAlternativesTooShort,

        /// Poll not exist.
        PollNotExist,

        /// Poll date setting is wrong.
        PollTimeSetting,

        /// Poll data committed is wrong.
        PollData,

        /// Poll data committed after poll expired.
        PollCommitExpired,

        /// Forum user has already voted.
        AlreadyVotedOnPoll,

        // Error data migration

        /// data migration not done yet.
        DataMigrationNotDone,

        // Error for limited size

        /// Maximum size of storage map exceeded
        MapSizeLimit,

        /// Category path len should be greater than zero
        PathLengthShouldBeGreaterThanZero,
    }
}

decl_storage! {
    trait Store for Module<T: Trait> as Forum_1_1 {
        /// Map category identifier to corresponding category.
        pub CategoryById get(fn category_by_id) config(): map hasher(blake2_128_concat) T::CategoryId => Category<T::CategoryId, T::ThreadId, T::Hash>;

        /// Category identifier value to be used for the next Category created.
        pub NextCategoryId get(fn next_category_id) config(): T::CategoryId;

        /// Counter for all existing categories.
        pub CategoryCounter get(fn category_counter) config(): T::CategoryId;

        /// Map thread identifier to corresponding thread.
        pub ThreadById get(fn thread_by_id) config(): double_map hasher(blake2_128_concat)
            T::CategoryId, hasher(blake2_128_concat) T::ThreadId => ThreadOf<T>;

        /// Thread identifier value to be used for next Thread in threadById.
        pub NextThreadId get(fn next_thread_id) config(): T::ThreadId;

        /// Post identifier value to be used for for next post created.
        pub NextPostId get(fn next_post_id) config(): T::PostId;

        /// Moderator set for each Category
        pub CategoryByModerator get(fn category_by_moderator) config(): double_map
            hasher(blake2_128_concat) T::CategoryId, hasher(blake2_128_concat) ModeratorId<T> => ();

        /// If data migration is done, set as configible for unit test purpose
        pub DataMigrationDone get(fn data_migration_done) config(): bool;

        /// Unique thread poll voters. This private double map prevents double voting.
        PollVotes get(fn poll_votes_by_thread_id_by_forum_user_id): double_map
            hasher(blake2_128_concat) T::ThreadId,
            hasher(blake2_128_concat) ForumUserId<T> => bool;

        /// Map post identifier to corresponding post.
        pub PostById get(fn post_by_id) config(): double_map hasher(blake2_128_concat) T::ThreadId,
            hasher(blake2_128_concat) T::PostId =>
                                                Post<
                                                    ForumUserId<T>,
                                                    T::ThreadId,
                                                    T::Hash,
                                                    BalanceOf<T>,
                                                    T::BlockNumber
                                                >;
    }
}

decl_event!(
    pub enum Event<T>
    where
        <T as Trait>::CategoryId,
        ModeratorId = ModeratorId<T>,
        <T as Trait>::ThreadId,
        <T as Trait>::PostId,
        <T as frame_system::Trait>::Hash,
        ForumUserId = ForumUserId<T>,
        <T as Trait>::PostReactionId,
        PrivilegedActor = PrivilegedActor<T>,
        PollInput = PollInput<<T as pallet_timestamp::Trait>::Moment>,
    {
        /// A category was introduced
        CategoryCreated(CategoryId, Option<CategoryId>, Vec<u8>, Vec<u8>),

        /// An arhical status of category with given id was updated.
        /// The second argument reflects the new archival status of the category.
        CategoryArchivalStatusUpdated(CategoryId, bool, PrivilegedActor),

        /// A title of category with given id was updated.
        /// The second argument reflects the new title hash of the category.
        CategoryTitleUpdated(CategoryId, Hash, PrivilegedActor),

        /// A discription of category with given id was updated.
        /// The second argument reflects the new description hash of the category.
        CategoryDescriptionUpdated(CategoryId, Hash, PrivilegedActor),

        /// A category was deleted
        CategoryDeleted(CategoryId, PrivilegedActor),

        /// A thread with given id was created.
        /// A third argument reflects the initial post id of the thread.
        ThreadCreated(CategoryId, ThreadId, PostId, ForumUserId, Vec<u8>, Vec<u8>, Option<PollInput>),

        /// A thread with given id was moderated.
        ThreadModerated(ThreadId, Vec<u8>, PrivilegedActor, CategoryId),

        /// A thread with given id was updated.
        /// The second argument reflects the new archival status of the thread.
        ThreadUpdated(ThreadId, bool, PrivilegedActor, CategoryId),

        /// A thread with given id was moderated.
        ThreadTitleUpdated(ThreadId, ForumUserId, CategoryId, Vec<u8>),

        /// A thread was deleted.
        ThreadDeleted(ThreadId, ForumUserId, CategoryId, bool),

        /// A thread was moved to new category
        ThreadMoved(ThreadId, CategoryId, PrivilegedActor, CategoryId),

        /// Post with given id was created.
        PostAdded(PostId, ForumUserId, CategoryId, ThreadId, Vec<u8>, bool),

        /// Post with givne id was moderated.
        PostModerated(PostId, Vec<u8>, PrivilegedActor, CategoryId, ThreadId),

        /// Post with givne id was deleted.
        PostDeleted(Vec<u8>, ForumUserId, Vec<(CategoryId, ThreadId, PostId, bool)>),

        /// Post with given id had its text updated.
        /// The second argument reflects the number of total edits when the text update occurs.
        PostTextUpdated(PostId, ForumUserId, CategoryId, ThreadId, Vec<u8>),

        /// Thumb up post
        PostReacted(ForumUserId, PostId, PostReactionId, CategoryId, ThreadId),

        /// Vote on poll
        VoteOnPoll(ThreadId, u32, ForumUserId, CategoryId),

        /// Sticky thread updated for category
        CategoryStickyThreadUpdate(CategoryId, Vec<ThreadId>, PrivilegedActor),

        /// An moderator ability to moderate a category and its subcategories updated
        CategoryMembershipOfModeratorUpdated(ModeratorId, CategoryId, bool),
    }
);

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        /// Predefined errors
        type Error = Error<T>;

        fn deposit_event() = default;

        /// Exports const

        /// Deposit needed to create a post
        const PostDeposit: BalanceOf<T> = T::PostDeposit::get();

        /// Deposit needed to create a thread
        const ThreadDeposit: BalanceOf<T> = T::ThreadDeposit::get();

        /// Enable a moderator can moderate a category and its sub categories.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoForum::<T>::update_category_membership_of_moderator_new()
            .max(WeightInfoForum::<T>::update_category_membership_of_moderator_old())]
        fn update_category_membership_of_moderator(origin, moderator_id: ModeratorId<T>, category_id: T::CategoryId, new_value: bool) -> DispatchResult {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;
            clear_prefix(b"Forum ForumUserById");

            let account_id = ensure_signed(origin)?;

            Self::ensure_can_update_category_membership_of_moderator(account_id, &category_id, &moderator_id, new_value)?;

            //
            // == MUTATION SAFE ==
            //

            if new_value {
                <CategoryByModerator<T>>::insert(category_id, moderator_id, ());

                <CategoryById<T>>::mutate(category_id, |category| category.num_direct_moderators += 1);
            } else {
                <CategoryByModerator<T>>::remove(category_id, moderator_id);

                <CategoryById<T>>::mutate(category_id, |category| category.num_direct_moderators -= 1);
            }

            // Generate event
            Self::deposit_event(RawEvent::CategoryMembershipOfModeratorUpdated(moderator_id, category_id, new_value));

            Ok(())
        }


        /// Add a new category.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W + V + X)` where:
        /// - `W` is the category depth
        /// - `V` is the length of the category title.
        /// - `X` is the length of the category description.
        /// - DB:
        ///    - O(W)
        /// # </weight>
        #[weight = WeightInfoForum::<T>::create_category(
            T::MaxCategoryDepth::get() as u32,
            title.len().saturated_into(),
            description.len().saturated_into()
        )]
        fn create_category(origin, parent_category_id: Option<T::CategoryId>, title: Vec<u8>, description: Vec<u8>) -> DispatchResult {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let account_id = ensure_signed(origin)?;

            Self::ensure_can_create_category(account_id, &parent_category_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Get next category id
            let next_category_id = <NextCategoryId<T>>::get();

            // Create new category
            let new_category = Category {
                title_hash: T::calculate_hash(title.as_slice()),
                description_hash: T::calculate_hash(description.as_slice()),
                archived: false,
                num_direct_subcategories: 0,
                num_direct_threads: 0,
                num_direct_moderators: 0,
                parent_category_id,
                sticky_thread_ids: vec![],
            };

            // Insert category in map
            <CategoryById<T>>::mutate(next_category_id, |value| *value = new_category);

            // Update other next category id
            <NextCategoryId<T>>::mutate(|value| *value += One::one());

            // Update total category count
            <CategoryCounter<T>>::mutate(|value| *value += One::one());

            // If not root, increase parent's subcategories counter
            if let Some(tmp_parent_category_id) = parent_category_id {
                <CategoryById<T>>::mutate(tmp_parent_category_id, |c| {
                    c.num_direct_subcategories += 1;
                });
            }

            // Generate event
            Self::deposit_event(RawEvent::CategoryCreated(
                    next_category_id,
                    parent_category_id,
                    title,
                    description
                ));

            Ok(())
        }

        /// Update archival status
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W)` where:
        /// - `W` is the category depth
        /// - DB:
        ///    - O(W)
        /// # </weight>
        #[weight = WeightInfoForum::<T>::update_category_archival_status_lead(
            T::MaxCategoryDepth::get() as u32,
        ).max(WeightInfoForum::<T>::update_category_archival_status_moderator(
            T::MaxCategoryDepth::get() as u32,
        ))]
        fn update_category_archival_status(origin, actor: PrivilegedActor<T>, category_id: T::CategoryId, new_archival_status: bool) -> DispatchResult {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let account_id = ensure_signed(origin)?;

            // Ensure actor can update category
            let category = Self::ensure_can_moderate_category(&account_id, &actor, &category_id)?;

            // No change, invalid transaction
            if new_archival_status == category.archived {
                return Err(Error::<T>::CategoryNotBeingUpdated.into())
            }

            //
            // == MUTATION SAFE ==
            //

            // Mutate category, and set possible new change parameters
            <CategoryById<T>>::mutate(category_id, |c| c.archived = new_archival_status);

            // Generate event
            Self::deposit_event(
                RawEvent::CategoryArchivalStatusUpdated(category_id, new_archival_status, actor)
            );

            Ok(())
        }

        /// Update category title
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W + V)` where:
        /// - `W` is the category depth
        /// - `V` is the length of the category title.
        /// - DB:
        ///    - O(W)
        /// # </weight>
        #[weight = WeightInfoForum::<T>::update_category_title_lead(
            T::MaxCategoryDepth::get() as u32,
            title.len().saturated_into(),
        ).max(WeightInfoForum::<T>::update_category_title_moderator(
            T::MaxCategoryDepth::get() as u32,
            title.len().saturated_into(),
        ))]
        fn update_category_title(origin, actor: PrivilegedActor<T>, category_id: T::CategoryId, title: Vec<u8>) -> DispatchResult {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let account_id = ensure_signed(origin)?;

            // Ensure actor can update category
            let category = Self::ensure_can_moderate_category(&account_id, &actor, &category_id)?;

            let title_hash = T::calculate_hash(title.as_slice());

            // No change, invalid transaction
            if title_hash == category.title_hash {
                return Err(Error::<T>::CategoryNotBeingUpdated.into())
            }

            //
            // == MUTATION SAFE ==
            //

            // Mutate category, and set possible new change parameters
            <CategoryById<T>>::mutate(category_id, |c| c.title_hash = title_hash);

            // Generate event
            Self::deposit_event(
                RawEvent::CategoryTitleUpdated(category_id, title_hash, actor)
            );

            Ok(())
        }

        /// Update category description
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W)` where:
        /// - `W` is the category depth
        /// - `V` is the length of the category description.
        /// - DB:
        ///    - O(W)
        /// # </weight>
        #[weight = WeightInfoForum::<T>::update_category_description_lead(
            T::MaxCategoryDepth::get() as u32,
            description.len().saturated_into(),
        ).max(WeightInfoForum::<T>::update_category_description_moderator(
            T::MaxCategoryDepth::get() as u32,
            description.len().saturated_into(),
        ))]
        fn update_category_description(origin, actor: PrivilegedActor<T>, category_id: T::CategoryId, description: Vec<u8>) -> DispatchResult {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let account_id = ensure_signed(origin)?;

            // Ensure actor can update category
            let category = Self::ensure_can_moderate_category(&account_id, &actor, &category_id)?;

            let description_hash = T::calculate_hash(description.as_slice());

            // No change, invalid transaction
            if description_hash == category.description_hash {
                return Err(Error::<T>::CategoryNotBeingUpdated.into())
            }

            //
            // == MUTATION SAFE ==
            //

            // Mutate category, and set possible new change parameters
            <CategoryById<T>>::mutate(category_id, |c| c.description_hash = description_hash);

            // Generate event
            Self::deposit_event(
                RawEvent::CategoryDescriptionUpdated(category_id, description_hash, actor)
            );

            Ok(())
        }

        /// Delete category
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W)` where:
        /// - `W` is the category depth
        /// - DB:
        ///    - O(W)
        /// # </weight>
        #[weight = WeightInfoForum::<T>::delete_category_lead(
            T::MaxCategoryDepth::get() as u32,
        ).max(WeightInfoForum::<T>::delete_category_moderator(
            T::MaxCategoryDepth::get() as u32,
        ))]
        fn delete_category(origin, actor: PrivilegedActor<T>, category_id: T::CategoryId) -> DispatchResult {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let account_id = ensure_signed(origin)?;

            let category = Self::ensure_can_delete_category(account_id, &actor, &category_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Delete category
            <CategoryById<T>>::remove(category_id);
            if let Some(parent_category_id) = category.parent_category_id {
                <CategoryById<T>>::mutate(parent_category_id, |tmp_category| tmp_category.num_direct_subcategories -= 1);
            }

            // Update total category count
            <CategoryCounter<T>>::mutate(|value| *value -= One::one());

            // Store the event
            Self::deposit_event(RawEvent::CategoryDeleted(category_id, actor));

            Ok(())
        }

        /// Create new thread in category with poll
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W + V + X + Y)` where:
        /// - `W` is the category depth
        /// - `V` is the length of the thread title.
        /// - `X` is the length of the thread text.
        /// - `Y` is the number of poll alternatives.
        /// - DB:
        ///    - O(W)
        /// # </weight>
        #[weight = WeightInfoForum::<T>::create_thread(
            title.len().saturated_into(),
            text.len().saturated_into(),
            T::MaxCategoryDepth::get() as u32,
        )]
        fn create_thread(
            origin,
            forum_user_id: ForumUserId<T>,
            category_id: T::CategoryId,
            title: Vec<u8>,
            text: Vec<u8>,
            poll_input: Option<PollInput<T::Moment>>,
        ) -> DispatchResult {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let account_id = ensure_signed(origin)?;

            Self::ensure_can_create_thread(&account_id, &forum_user_id, &category_id)?;

            // Ensure poll is valid
            if let Some(ref data) = poll_input {
                // Check all poll alternatives
                Self::ensure_poll_alternatives_length_is_valid(&data.poll_alternatives)?;

                // Check poll self information
                Self::ensure_poll_input_is_valid(data)?;
            }

            //
            // == MUTATION SAFE ==
            //

            // Create and add new thread
            let new_thread_id = <NextThreadId<T>>::get();

            // Reserve cleanup pay off in the thread account plus the cost of creating the
            // initial thread
            Self::transfer_to_state_cleanup_treasury_account(
                T::ThreadDeposit::get() + T::PostDeposit::get(),
                new_thread_id,
                &account_id
            )?;

            // Hash poll description and poll alternatives description
            let poll = poll_input.clone().map(Self::from_poll_input);

            // Build a new thread
            let new_thread = Thread {
                category_id,
                title_hash: T::calculate_hash(&title),
                author_id: forum_user_id,
                poll,
                cleanup_pay_off: T::ThreadDeposit::get(),
                number_of_posts: 0,
            };

            // Store thread
            <ThreadById<T>>::mutate(category_id, new_thread_id, |value| {
                *value = new_thread.clone()
            });

            // Add inital post to thread
            let initial_post_id = Self::add_new_post(
                new_thread_id,
                category_id,
                &text,
                forum_user_id,
                true,
            );

            // Update next thread id
            <NextThreadId<T>>::mutate(|n| *n += One::one());

            // Update category's thread counter
            <CategoryById<T>>::mutate(category_id, |c| c.num_direct_threads += 1);

            // Generate event
            Self::deposit_event(
                RawEvent::ThreadCreated(
                    category_id,
                    new_thread_id,
                    initial_post_id,
                    forum_user_id,
                    title,
                    text,
                    poll_input,
                )
            );

            Ok(())
        }

        /// Edit thread title
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W + V)` where:
        /// - `W` is the category depth
        /// - `V` is the length of the thread title.
        /// - DB:
        ///    - O(W)
        /// # </weight>
        #[weight = WeightInfoForum::<T>::edit_thread_title(
            T::MaxCategoryDepth::get() as u32,
            new_title.len().saturated_into(),
        )]
        fn edit_thread_title(origin, forum_user_id: ForumUserId<T>, category_id: T::CategoryId, thread_id: T::ThreadId, new_title: Vec<u8>) -> DispatchResult {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let account_id = ensure_signed(origin)?;

            let thread = Self::ensure_can_edit_thread_title(account_id, &category_id, &thread_id, &forum_user_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Update thread title
            let title_hash = T::calculate_hash(&new_title);
            <ThreadById<T>>::mutate(thread.category_id, thread_id, |thread| thread.title_hash = title_hash);

            // Store the event
            Self::deposit_event(
                RawEvent::ThreadTitleUpdated(
                    thread_id,
                    forum_user_id,
                    category_id,
                    new_title,
                )
            );

            Ok(())
        }

        /// Delete thread
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W)` where:
        /// - `W` is the category depth
        /// - DB:
        ///    - O(W)
        /// # </weight>
        #[weight = WeightInfoForum::<T>::delete_thread(T::MaxCategoryDepth::get() as u32)]
        fn delete_thread(
            origin,
            forum_user_id: ForumUserId<T>,
            category_id: T::CategoryId,
            thread_id: T::ThreadId,
            hide: bool,
        ) -> DispatchResult {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let account_id = ensure_signed(origin)?;

            let thread = Self::ensure_can_delete_thread(
                &account_id,
                &forum_user_id,
                &category_id,
                &thread_id
            )?;

            //
            // == MUTATION SAFE ==
            //

            // Pay off to thread deleter
            Self::pay_off(thread_id, thread.cleanup_pay_off, &account_id)?;

            // Delete thread
            Self::delete_thread_inner(thread.category_id, thread_id);

            // Store the event
            Self::deposit_event(RawEvent::ThreadDeleted(
                    thread_id,
                    forum_user_id,
                    category_id,
                    hide,
                ));

            Ok(())
        }

        /// Move thread to another category
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W)` where:
        /// - `W` is the category depth
        /// - DB:
        ///    - O(W)
        /// # </weight>
        #[weight = WeightInfoForum::<T>::move_thread_to_category_lead(
            T::MaxCategoryDepth::get() as u32,
        ).max(WeightInfoForum::<T>::move_thread_to_category_moderator(
            T::MaxCategoryDepth::get() as u32,
        ))]
        fn move_thread_to_category(origin, actor: PrivilegedActor<T>, category_id: T::CategoryId, thread_id: T::ThreadId, new_category_id: T::CategoryId) -> DispatchResult {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let account_id = ensure_signed(origin)?;

            // Make sure moderator move between selected categories
            let thread = Self::ensure_can_move_thread(account_id, &actor, &category_id, &thread_id, &new_category_id)?;

            //
            // == MUTATION SAFE ==
            //

            <ThreadById<T>>::remove(thread.category_id, thread_id);
            <ThreadById<T>>::insert(new_category_id, thread_id, thread.clone());
            <CategoryById<T>>::mutate(thread.category_id, |category| category.num_direct_threads -= 1);
            <CategoryById<T>>::mutate(new_category_id, |category| category.num_direct_threads += 1);

            // Store the event
            Self::deposit_event(
                RawEvent::ThreadMoved(thread_id, new_category_id, actor, category_id)
            );

            Ok(())
        }

        /// Submit a poll
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W + V)` where:
        /// - `W` is the category depth,
        /// - `V` is the number of poll alternatives.
        /// - DB:
        ///    - O(W)
        /// # </weight>
        #[weight = WeightInfoForum::<T>::vote_on_poll(
            T::MaxCategoryDepth::get() as u32,
            <T::MapLimits as StorageLimits>::MaxPollAlternativesNumber::get() as u32
        )]
        fn vote_on_poll(origin, forum_user_id: ForumUserId<T>, category_id: T::CategoryId, thread_id: T::ThreadId, index: u32) -> DispatchResult {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let account_id = ensure_signed(origin)?;

            // get forum user id.
            Self::ensure_is_forum_user(&account_id, &forum_user_id)?;

            // Get thread
            let (_, thread) = Self::ensure_thread_is_mutable(&category_id, &thread_id)?;

            let category_id = thread.category_id;

            // Make sure poll exist
            let poll = Self::ensure_vote_is_valid(thread, index, &thread_id, &forum_user_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Store new poll alternative statistics
            let new_poll_alternatives: Vec<PollAlternative<T::Hash>> = poll.poll_alternatives
                .iter()
                .enumerate()
                .map(|(old_index, old_value)| if index as usize == old_index
                    { PollAlternative {
                        alternative_text_hash: old_value.alternative_text_hash,
                        vote_count: old_value.vote_count + 1,
                    }
                    } else {
                        old_value.clone()
                    })
                .collect();

            Self::ensure_poll_alternatives_length_is_valid(&new_poll_alternatives)?;

            // Update thread with one object
            <ThreadById<T>>::mutate(category_id, thread_id, |value| {
                *value = Thread {
                    poll: Some( Poll {
                        poll_alternatives: new_poll_alternatives,
                        ..poll
                    }),
                    ..(value.clone())
                }
            });

            // Update unique votes collection.
            <PollVotes<T>>::insert(&thread_id, &forum_user_id, true);

            // Store the event
            Self::deposit_event(
                RawEvent::VoteOnPoll(thread_id, index, forum_user_id, category_id)
            );

            Ok(())
        }

        /// Moderate thread
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W + V + X)` where:
        /// - `W` is the category depth,
        /// - `V` is the number of thread posts,
        /// - `X` is the length of the rationale
        /// - DB:
        ///    - O(W + V)
        /// # </weight>
        #[weight = WeightInfoForum::<T>::moderate_thread_lead(
            T::MaxCategoryDepth::get() as u32,
            rationale.len().saturated_into(),
        ).max(
            WeightInfoForum::<T>::moderate_thread_moderator(
                T::MaxCategoryDepth::get() as u32,
                rationale.len().saturated_into(),
            )
        )]
        fn moderate_thread(origin, actor: PrivilegedActor<T>, category_id: T::CategoryId, thread_id: T::ThreadId, rationale: Vec<u8>) -> DispatchResult {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let account_id = ensure_signed(origin)?;

            // Ensure actor is allowed to moderate post
            let thread = Self::ensure_can_moderate_thread(&account_id, &actor, &category_id, &thread_id)?;

            //
            // == MUTATION SAFE ==
            //

            Self::slash_thread_account(thread_id, thread.cleanup_pay_off);

            // Delete thread
            Self::delete_thread_inner(thread.category_id, thread_id);

            // Generate event
            Self::deposit_event(
                RawEvent::ThreadModerated(thread_id, rationale, actor, category_id)
            );

            Ok(())
        }

        /// Add post
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W + V)` where:
        /// - `W` is the category depth,
        /// - `V` is the length of the text
        /// - DB:
        ///    - O(W)
        /// # </weight>
        #[weight = WeightInfoForum::<T>::add_post(
            T::MaxCategoryDepth::get() as u32,
            text.len().saturated_into(),
        )]
        fn add_post(
            origin,
            forum_user_id: ForumUserId<T>,
            category_id: T::CategoryId,
            thread_id: T::ThreadId,
            text: Vec<u8>,
            editable: bool,
        ) -> DispatchResult {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let account_id = ensure_signed(origin)?;

            // Make sure thread exists and is mutable
            let _ = Self::ensure_can_add_post(&account_id, &forum_user_id, &category_id, &thread_id)?;

            if editable {
                ensure!(
                    Self::ensure_enough_balance(T::PostDeposit::get(), &account_id),
                    Error::<T>::InsufficientBalanceForPost
                );
            }

            //
            // == MUTATION SAFE ==
            //

            if editable {
                // Shouldn't fail since we checked in `ensure_can_add_post` that the account
                // has enough balance.
                Self::transfer_to_state_cleanup_treasury_account(
                    T::PostDeposit::get(),
                    thread_id,
                    &account_id
                )?;
            }

            // Add new post
            let post_id = Self::add_new_post(
                    thread_id,
                    category_id,
                    text.as_slice(),
                    forum_user_id,
                    editable,
                );

            // Generate event
            Self::deposit_event(
                RawEvent::PostAdded(post_id, forum_user_id, category_id, thread_id, text, editable)
            );

            Ok(())
        }

        /// Like or unlike a post.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W)` where:
        /// - `W` is the category depth,
        /// - DB:
        ///    - O(W)
        /// # </weight>
        #[weight = WeightInfoForum::<T>::react_post(
            T::MaxCategoryDepth::get() as u32,
        )]
        fn react_post(origin, forum_user_id: ForumUserId<T>, category_id: T::CategoryId, thread_id: T::ThreadId, post_id: T::PostId, react: T::PostReactionId) -> DispatchResult {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let account_id = ensure_signed(origin)?;

            // Check that account is forum member
            Self::ensure_is_forum_user(&account_id, &forum_user_id)?;

            // Make sure the thread exists and is mutable
            Self::ensure_thread_is_mutable(&category_id, &thread_id)?;

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(
                RawEvent::PostReacted(forum_user_id, post_id, react, category_id, thread_id)
            );

            Ok(())
        }

        /// Edit post text
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W + V)` where:
        /// - `W` is the category depth,
        /// - `V` is the length of the new text
        /// - DB:
        ///    - O(W)
        /// # </weight>
        #[weight = WeightInfoForum::<T>::edit_post_text(
            T::MaxCategoryDepth::get() as u32,
            new_text.len().saturated_into(),
        )]
        fn edit_post_text(
            origin,
            forum_user_id: ForumUserId<T>,
            category_id: T::CategoryId,
            thread_id: T::ThreadId,
            post_id: T::PostId,
            new_text: Vec<u8>
        ) -> DispatchResult {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let account_id = ensure_signed(origin)?;

            // Check that account is forum member
            Self::ensure_is_forum_user(&account_id, &forum_user_id)?;

            // Make sure there exists a mutable post with post id `post_id`
            let mut post = Self::ensure_post_is_mutable(&category_id, &thread_id, &post_id)?;

            // Signer does not match creator of post with identifier postId
            ensure!(post.author_id == forum_user_id, Error::<T>::AccountDoesNotMatchPostAuthor);

            //
            // == MUTATION SAFE ==
            //

            // Update post text
            let text_hash = T::calculate_hash(&new_text);
            post.text_hash = text_hash;
            post.last_edited = frame_system::Module::<T>::block_number();

            <PostById<T>>::insert(thread_id, post_id, post);

            // Generate event
            Self::deposit_event(RawEvent::PostTextUpdated(
                    post_id,
                    forum_user_id,
                    category_id,
                    thread_id,
                    new_text
                ));

            Ok(())
        }

        /// Moderate post
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W + V)` where:
        /// - `W` is the category depth,
        /// - `V` is the length of the rationale
        /// - DB:
        ///    - O(W)
        /// # </weight>
        #[weight = WeightInfoForum::<T>::moderate_post_lead(
            T::MaxCategoryDepth::get() as u32,
            rationale.len().saturated_into(),
        ).max(WeightInfoForum::<T>::moderate_post_moderator(
            T::MaxCategoryDepth::get() as u32,
            rationale.len().saturated_into(),
        ))]
        fn moderate_post(origin, actor: PrivilegedActor<T>, category_id: T::CategoryId, thread_id: T::ThreadId, post_id: T::PostId, rationale: Vec<u8>) -> DispatchResult {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let account_id = ensure_signed(origin)?;

            // Ensure actor is allowed to moderate post and post is editable
            let post = Self::ensure_can_moderate_post(
                account_id,
                &actor,
                &category_id,
                &thread_id,
                &post_id
            )?;

            //
            // == MUTATION SAFE ==
            //

            Self::slash_thread_account(thread_id, post.cleanup_pay_off);

            Self::delete_post_inner(category_id, thread_id, post_id);

            // Generate event
            Self::deposit_event(
                RawEvent::PostModerated(post_id, rationale, actor, category_id, thread_id)
            );

            Ok(())
        }

        /// Delete post from storage.
        /// You need to provide a vector of posts to delete in the form
        /// (T::CategoryId, T::ThreadId, T::PostId, bool)
        /// where the last bool is whether you want to hide it apart from deleting it
        ///
        /// ## Weight
        /// `O (W + V + P)` where:
        /// - `W` is the category depth,
        /// - `V` is the length of the rationale
        /// - `P` is the number of posts to delete
        /// - DB:
        ///    - O(W + P)
        /// # </weight>
        #[weight = WeightInfoForum::<T>::delete_posts(
            T::MaxCategoryDepth::get() as u32,
            rationale.len().saturated_into(),
            posts.len().saturated_into(),
        )]
        fn delete_posts(
            origin,
            forum_user_id: ForumUserId<T>,
            posts: Vec<(T::CategoryId, T::ThreadId, T::PostId, bool)>,
            rationale: Vec<u8>,
        ) -> DispatchResult {

            // Check only unique post instances.
            let unique_posts: BTreeSet<_> = posts.into_iter().collect();

            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let account_id = ensure_signed(origin)?;

            let mut deleting_posts = BTreeSet::new();
            for (category_id, thread_id, post_id, hide) in &unique_posts {
                // Ensure actor is allowed to moderate post and post is editable
                let post = Self::ensure_can_delete_post(
                    &account_id,
                    &forum_user_id,
                    &category_id,
                    &thread_id,
                    &post_id,
                    *hide,
                )?;

                deleting_posts.insert((category_id, thread_id, post_id, post));
            }

            //
            // == MUTATION SAFE ==
            //

            for (category_id, thread_id, post_id, post) in deleting_posts {
                // Pay off to thread deleter
                Self::pay_off(*thread_id, post.cleanup_pay_off, &account_id)?;

                Self::delete_post_inner(*category_id, *thread_id, *post_id);
            }

            // Generate event
            Self::deposit_event(
                RawEvent::PostDeleted(rationale, forum_user_id, unique_posts.into_iter().collect())
            );

            Ok(())
        }

        /// Set stickied threads for category
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W + V)` where:
        /// - `W` is the category depth,
        /// - `V` is the length of the stickied_ids
        /// - DB:
        ///    - O(W + V)
        /// # </weight>
        #[weight = WeightInfoForum::<T>::set_stickied_threads_lead(
            T::MaxCategoryDepth::get() as u32,
            stickied_ids.len().saturated_into(),
        ).max(
            WeightInfoForum::<T>::set_stickied_threads_moderator(
                T::MaxCategoryDepth::get() as u32,
                stickied_ids.len().saturated_into(),
            )
        )]
        fn set_stickied_threads(origin, actor: PrivilegedActor<T>, category_id: T::CategoryId, stickied_ids: Vec<T::ThreadId>) -> DispatchResult {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let account_id = ensure_signed(origin)?;

            Self::ensure_can_set_stickied_threads(account_id, &actor, &category_id, &stickied_ids)?;

            //
            // == MUTATION SAFE ==
            //

            // Update category
            <CategoryById<T>>::mutate(category_id, |category| category.sticky_thread_ids = stickied_ids.clone());

            // Generate event
            Self::deposit_event(
                RawEvent::CategoryStickyThreadUpdate(category_id, stickied_ids, actor)
            );

            Ok(())
        }
    }
}

impl<T: Trait> Module<T> {
    /// Hash poll description and poll alternatives descriptions, coverting `PollInput` into `Poll`
    fn from_poll_input(poll_input: PollInput<T::Moment>) -> Poll<T::Moment, T::Hash> {
        Poll {
            description_hash: T::calculate_hash(poll_input.description.as_slice()),
            poll_alternatives: poll_input
                .poll_alternatives
                .into_iter()
                .map(|poll_alternative| PollAlternative {
                    alternative_text_hash: T::calculate_hash(
                        poll_alternative.alternative_text.as_slice(),
                    ),
                    vote_count: poll_alternative.vote_count,
                })
                .collect(),
            end_time: poll_input.end_time,
        }
    }

    fn slash_thread_account(thread_id: T::ThreadId, amount: BalanceOf<T>) {
        let thread_account_id = T::ModuleId::get().into_sub_account(thread_id);
        let _ = Balances::<T>::slash(&thread_account_id, amount);
    }

    fn pay_off(
        thread_id: T::ThreadId,
        amount: BalanceOf<T>,
        account_id: &T::AccountId,
    ) -> DispatchResult {
        let state_cleanup_treasury_account = T::ModuleId::get().into_sub_account(thread_id);
        <Balances<T> as Currency<T::AccountId>>::transfer(
            &state_cleanup_treasury_account,
            account_id,
            amount,
            ExistenceRequirement::AllowDeath,
        )
    }

    fn transfer_to_state_cleanup_treasury_account(
        amount: BalanceOf<T>,
        thread_id: T::ThreadId,
        account_id: &T::AccountId,
    ) -> DispatchResult {
        let state_cleanup_treasury_account = T::ModuleId::get().into_sub_account(thread_id);
        <Balances<T> as Currency<T::AccountId>>::transfer(
            account_id,
            &state_cleanup_treasury_account,
            amount,
            ExistenceRequirement::AllowDeath,
        )
    }

    pub fn add_new_post(
        thread_id: T::ThreadId,
        category_id: T::CategoryId,
        text: &[u8],
        author_id: ForumUserId<T>,
        editable: bool,
    ) -> T::PostId {
        // Make and add initial post
        let new_post_id = <NextPostId<T>>::get();

        // Update next post id
        <NextPostId<T>>::mutate(|n| *n += One::one());

        if editable {
            // Build a post
            let new_post = Post {
                text_hash: T::calculate_hash(text),
                thread_id,
                author_id,
                cleanup_pay_off: T::PostDeposit::get(),
                last_edited: frame_system::Module::<T>::block_number(),
            };

            <PostById<T>>::insert(thread_id, new_post_id, new_post);
        }

        let mut thread = <ThreadById<T>>::get(category_id, thread_id);
        thread.number_of_posts = thread.number_of_posts.saturating_add(1);

        <ThreadById<T>>::mutate(category_id, thread_id, |value| *value = thread);

        new_post_id
    }

    fn delete_thread_inner(category_id: T::CategoryId, thread_id: T::ThreadId) {
        // Delete thread
        <ThreadById<T>>::remove(category_id, thread_id);

        // Remove all thread poll votes.
        <PollVotes<T>>::remove_prefix(thread_id);

        // decrease category's thread counter
        <CategoryById<T>>::mutate(category_id, |category| category.num_direct_threads -= 1);
    }

    fn delete_post_inner(category_id: T::CategoryId, thread_id: T::ThreadId, post_id: T::PostId) {
        if <ThreadById<T>>::contains_key(category_id, thread_id) {
            let mut thread = <ThreadById<T>>::get(category_id, thread_id);
            thread.number_of_posts = thread.number_of_posts.saturating_sub(1);

            <ThreadById<T>>::mutate(category_id, thread_id, |value| *value = thread);
        }

        <PostById<T>>::remove(thread_id, post_id);
    }

    // Ensure poll is valid
    fn ensure_poll_input_is_valid(poll: &PollInput<T::Moment>) -> Result<(), Error<T>> {
        // Poll end time must larger than now
        if poll.end_time < <pallet_timestamp::Module<T>>::now() {
            return Err(Error::<T>::PollTimeSetting);
        }

        Ok(())
    }

    // Ensure poll alternative size is valid
    fn ensure_poll_alternatives_length_is_valid<K>(alternatives: &[K]) -> Result<(), Error<T>> {
        Self::ensure_map_limits::<<<T>::MapLimits as StorageLimits>::MaxPollAlternativesNumber>(
            alternatives.len() as u64,
        )?;

        ensure!(
            alternatives.len() as u64 >= 2,
            Error::<T>::PollAlternativesTooShort
        );

        Ok(())
    }

    fn ensure_post_is_mutable(
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
        post_id: &T::PostId,
    ) -> Result<Post<ForumUserId<T>, T::ThreadId, T::Hash, BalanceOf<T>, T::BlockNumber>, Error<T>>
    {
        // If the post is stored then it's mutable
        let post = Self::ensure_post_exists(category_id, thread_id, post_id)?;

        // and make sure thread is mutable
        Self::ensure_thread_is_mutable(category_id, thread_id)?;

        Ok(post)
    }

    // TODO: change this name, since it's no longer descriptive
    fn ensure_post_exists(
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
        post_id: &T::PostId,
    ) -> Result<Post<ForumUserId<T>, T::ThreadId, T::Hash, BalanceOf<T>, T::BlockNumber>, Error<T>>
    {
        if !<ThreadById<T>>::contains_key(category_id, thread_id) {
            return Err(Error::<T>::PostDoesNotExist);
        }

        if !<PostById<T>>::contains_key(thread_id, post_id) {
            return Err(Error::<T>::PostDoesNotExist);
        }

        Ok(<PostById<T>>::get(thread_id, post_id))
    }

    fn ensure_can_moderate_post(
        account_id: T::AccountId,
        actor: &PrivilegedActor<T>,
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
        post_id: &T::PostId,
    ) -> Result<Post<ForumUserId<T>, T::ThreadId, T::Hash, BalanceOf<T>, T::BlockNumber>, Error<T>>
    {
        // Ensure the moderator can moderate the category
        Self::ensure_can_moderate_category(&account_id, &actor, &category_id)?;

        // Make sure post exists and is mutable
        let post = if Self::thread_exists(category_id, thread_id) {
            Self::ensure_post_is_mutable(&category_id, &thread_id, &post_id)?
        } else {
            <PostById<T>>::get(thread_id, post_id)
        };

        Ok(post)
    }

    fn ensure_can_delete_post(
        account_id: &T::AccountId,
        forum_user_id: &ForumUserId<T>,
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
        post_id: &T::PostId,
        hide: bool,
    ) -> Result<Post<ForumUserId<T>, T::ThreadId, T::Hash, BalanceOf<T>, T::BlockNumber>, Error<T>>
    {
        let post = if Self::thread_exists(category_id, thread_id) {
            Self::ensure_post_is_mutable(&category_id, &thread_id, &post_id)?
        } else {
            <PostById<T>>::get(thread_id, post_id)
        };

        // Check that account is forum member
        Self::ensure_is_forum_user(&account_id, &forum_user_id)?;

        // Signer does not match creator of post with identifier postId
        ensure!(
            post.author_id == *forum_user_id
                || Self::anyone_can_delete_post(&post, &thread_id, &category_id) && !hide,
            Error::<T>::AccountDoesNotMatchPostAuthor
        );

        Ok(post)
    }

    fn anyone_can_delete_post(
        post: &Post<ForumUserId<T>, T::ThreadId, T::Hash, BalanceOf<T>, T::BlockNumber>,
        thread_id: &T::ThreadId,
        category_id: &T::CategoryId,
    ) -> bool {
        frame_system::Module::<T>::block_number() >= T::PostLifeTime::get() + post.last_edited
            && !Self::thread_exists(&category_id, &thread_id)
    }

    fn thread_exists(category_id: &T::CategoryId, thread_id: &T::ThreadId) -> bool {
        <ThreadById<T>>::contains_key(category_id, thread_id)
    }

    fn ensure_thread_is_mutable(
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
    ) -> Result<(Category<T::CategoryId, T::ThreadId, T::Hash>, ThreadOf<T>), Error<T>> {
        // Make sure thread exists
        let thread = Self::ensure_thread_exists(category_id, thread_id)?;

        // and corresponding category is mutable
        let category = Self::ensure_category_is_mutable(category_id)?;

        Ok((category, thread))
    }

    fn ensure_thread_exists(
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
    ) -> Result<ThreadOf<T>, Error<T>> {
        if !<ThreadById<T>>::contains_key(category_id, thread_id) {
            return Err(Error::<T>::ThreadDoesNotExist);
        }

        Ok(<ThreadById<T>>::get(category_id, thread_id))
    }

    fn ensure_can_edit_thread_title(
        account_id: T::AccountId,
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
        forum_user_id: &ForumUserId<T>,
    ) -> Result<ThreadOf<T>, Error<T>> {
        // Check that account is forum member
        Self::ensure_is_forum_user(&account_id, &forum_user_id)?;

        // Ensure thread is mutable
        let (_, thread) = Self::ensure_thread_is_mutable(category_id, thread_id)?;

        // Ensure forum user is author of the thread
        Self::ensure_is_thread_author(&thread, forum_user_id)?;

        Ok(thread)
    }

    fn ensure_is_thread_author(
        thread: &ThreadOf<T>,
        forum_user_id: &ForumUserId<T>,
    ) -> Result<(), Error<T>> {
        ensure!(
            thread.author_id == *forum_user_id,
            Error::<T>::AccountDoesNotMatchThreadAuthor
        );

        Ok(())
    }

    fn ensure_actor_role(
        account_id: &T::AccountId,
        actor: &PrivilegedActor<T>,
    ) -> Result<(), Error<T>> {
        match actor {
            PrivilegedActor::Lead => {
                Self::ensure_is_forum_lead_account(account_id)?;
            }
            PrivilegedActor::Moderator(moderator_id) => {
                Self::ensure_is_moderator_account(account_id, &moderator_id)?;
            }
        };
        Ok(())
    }

    // Ensure forum user is lead - check via account
    fn ensure_is_forum_lead_account(account_id: &T::AccountId) -> Result<(), Error<T>> {
        let is_lead = T::WorkingGroup::is_leader_account_id(account_id);

        ensure!(is_lead, Error::<T>::OriginNotForumLead);
        Ok(())
    }

    /// Ensure forum user id registered and its account id matched
    fn ensure_is_forum_user(
        account_id: &T::AccountId,
        forum_user_id: &ForumUserId<T>,
    ) -> Result<(), Error<T>> {
        let is_member =
            T::MemberOriginValidator::is_member_controller_account(forum_user_id, account_id);

        ensure!(is_member, Error::<T>::ForumUserIdNotMatchAccount);
        Ok(())
    }

    /// Ensure moderator id registered and its account id matched - check via account
    fn ensure_is_moderator_account(
        account_id: &T::AccountId,
        moderator_id: &ModeratorId<T>,
    ) -> Result<(), Error<T>> {
        let is_moderator = T::WorkingGroup::is_worker_account_id(account_id, moderator_id);

        ensure!(is_moderator, Error::<T>::ModeratorIdNotMatchAccount);

        Ok(())
    }

    // Ensure actor can manipulate thread.
    fn ensure_can_moderate_thread(
        account_id: &T::AccountId,
        actor: &PrivilegedActor<T>,
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
    ) -> Result<ThreadOf<T>, Error<T>> {
        // Check that account is forum member
        Self::ensure_can_moderate_category(account_id, actor, category_id)?;

        let thread = Self::ensure_thread_exists(category_id, thread_id)?;

        Ok(thread)
    }

    // Ensure actor can manipulate thread.
    fn ensure_can_delete_thread(
        account_id: &T::AccountId,
        forum_user_id: &ForumUserId<T>,
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
    ) -> Result<ThreadOf<T>, Error<T>> {
        // Ensure thread exists and is mutable
        let (_, thread) = Self::ensure_thread_is_mutable(category_id, thread_id)?;

        // Check that account is forum member
        Self::ensure_is_forum_user(&account_id, &forum_user_id)?;

        // Ensure forum user is author of the thread
        Self::ensure_is_thread_author(&thread, &forum_user_id)?;

        Ok(thread)
    }

    fn ensure_can_move_thread(
        account_id: T::AccountId,
        actor: &PrivilegedActor<T>,
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
        new_category_id: &T::CategoryId,
    ) -> Result<ThreadOf<T>, Error<T>> {
        ensure!(
            category_id != new_category_id,
            Error::<T>::ThreadMoveInvalid,
        );

        let thread = Self::ensure_can_moderate_thread(&account_id, actor, category_id, thread_id)
            .map_err(|_| Error::<T>::ModeratorModerateOriginCategory)?;

        Self::ensure_can_moderate_category_path(actor, new_category_id)
            .map_err(|_| Error::<T>::ModeratorModerateDestinationCategory)?;

        Ok(thread)
    }

    fn ensure_category_is_mutable(
        category_id: &T::CategoryId,
    ) -> Result<Category<T::CategoryId, T::ThreadId, T::Hash>, Error<T>> {
        let category_tree_path = Self::build_category_tree_path(&category_id);

        Self::ensure_can_mutate_in_path_leaf(&category_tree_path)?;

        Ok(category_tree_path[0].1.clone())
    }

    fn ensure_can_mutate_in_path_leaf(
        category_tree_path: &CategoryTreePathArg<T::CategoryId, T::ThreadId, T::Hash>,
    ) -> Result<(), Error<T>> {
        // Is parent category directly or indirectly deleted or archived category
        ensure!(
            !category_tree_path
                .iter()
                .any(|(_, c): &(_, Category<T::CategoryId, T::ThreadId, T::Hash>)| c.archived),
            Error::<T>::AncestorCategoryImmutable
        );

        Ok(())
    }

    fn ensure_can_add_subcategory_path_leaf(
        parent_category_id: &T::CategoryId,
    ) -> Result<(), Error<T>> {
        // Get the path from parent category to root
        let category_tree_path =
            Self::ensure_valid_category_and_build_category_tree_path(parent_category_id)?;

        let max_category_depth: u64 = T::MaxCategoryDepth::get();

        // Check if max depth reached
        if category_tree_path.len() as u64 >= max_category_depth {
            return Err(Error::<T>::MaxValidCategoryDepthExceeded);
        }

        Self::ensure_can_mutate_in_path_leaf(&category_tree_path)?;

        Ok(())
    }

    /// Build category tree path and validate them
    fn ensure_valid_category_and_build_category_tree_path(
        category_id: &T::CategoryId,
    ) -> Result<CategoryTreePath<T::CategoryId, T::ThreadId, T::Hash>, Error<T>> {
        ensure!(
            <CategoryById<T>>::contains_key(category_id),
            Error::<T>::CategoryDoesNotExist
        );

        // Get path from parent to root of category tree.
        let category_tree_path = Self::build_category_tree_path(&category_id);

        if category_tree_path.is_empty() {
            debug_assert!(
                false,
                "Should not fail! {:?}",
                Error::<T>::PathLengthShouldBeGreaterThanZero
            );
            Err(Error::<T>::PathLengthShouldBeGreaterThanZero)
        } else {
            Ok(category_tree_path)
        }
    }

    /// Builds path and populates in `path`.
    /// Requires that `category_id` is valid
    fn build_category_tree_path(
        category_id: &T::CategoryId,
    ) -> CategoryTreePath<T::CategoryId, T::ThreadId, T::Hash> {
        // Get path from parent to root of category tree.
        let mut category_tree_path = vec![];

        Self::_build_category_tree_path(category_id, &mut category_tree_path);

        category_tree_path
    }

    /// Builds path and populates in `path`.
    /// Requires that `category_id` is valid
    fn _build_category_tree_path(
        category_id: &T::CategoryId,
        path: &mut CategoryTreePath<T::CategoryId, T::ThreadId, T::Hash>,
    ) {
        // Grab category
        let category = <CategoryById<T>>::get(*category_id);

        // Add category to path container
        path.push((*category_id, category.clone()));

        // Make recursive call on parent if we are not at root
        if let Some(parent_category_id) = category.parent_category_id {
            assert!(<CategoryById<T>>::contains_key(parent_category_id));

            Self::_build_category_tree_path(&parent_category_id, path);
        }
    }

    fn ensure_can_delete_category(
        account_id: T::AccountId,
        actor: &PrivilegedActor<T>,
        category_id: &T::CategoryId,
    ) -> Result<Category<T::CategoryId, T::ThreadId, T::Hash>, Error<T>> {
        // Check actor's role
        Self::ensure_actor_role(&account_id, actor)?;

        // Ensure category exists
        let category = Self::ensure_category_exists(category_id)?;

        // Ensure category is empty
        ensure!(
            category.num_direct_threads == 0,
            Error::<T>::CategoryNotEmptyThreads,
        );
        ensure!(
            category.num_direct_subcategories == 0,
            Error::<T>::CategoryNotEmptyCategories,
        );

        // check moderator's privilege
        if let Some(parent_category_id) = category.parent_category_id {
            Self::ensure_can_moderate_category_path(actor, &parent_category_id)
                .map_err(|_| Error::<T>::ModeratorCantDeleteCategory)?;

            Ok(category)
        } else {
            // category is root - only lead can delete it
            match actor {
                PrivilegedActor::Lead => Ok(category),
                PrivilegedActor::Moderator(_) => Err(Error::<T>::ModeratorCantDeleteCategory),
            }
        }
    }

    /// check if an account can moderate a category.
    fn ensure_can_moderate_category(
        account_id: &T::AccountId,
        actor: &PrivilegedActor<T>,
        category_id: &T::CategoryId,
    ) -> Result<Category<T::CategoryId, T::ThreadId, T::Hash>, Error<T>> {
        // Ensure actor's role
        Self::ensure_actor_role(account_id, actor)?;

        Self::ensure_can_moderate_category_path(actor, category_id)
    }

    // check that moderator is allowed to manipulate category in hierarchy
    fn ensure_can_moderate_category_path(
        actor: &PrivilegedActor<T>,
        category_id: &T::CategoryId,
    ) -> Result<Category<T::CategoryId, T::ThreadId, T::Hash>, Error<T>> {
        fn check_moderator<T: Trait>(
            category_tree_path: &CategoryTreePathArg<T::CategoryId, T::ThreadId, T::Hash>,
            moderator_id: &ModeratorId<T>,
        ) -> Result<(), Error<T>> {
            for item in category_tree_path {
                if <CategoryByModerator<T>>::contains_key(item.0, moderator_id) {
                    return Ok(());
                }
            }

            Err(Error::<T>::ModeratorCantUpdateCategory)
        }

        let category_tree_path =
            Self::ensure_valid_category_and_build_category_tree_path(category_id)?;

        match actor {
            PrivilegedActor::Lead => (),
            PrivilegedActor::Moderator(moderator_id) => {
                check_moderator::<T>(&category_tree_path, moderator_id)?
            }
        };

        let category = category_tree_path[0].1.clone();

        Ok(category)
    }

    fn ensure_can_update_category_membership_of_moderator(
        account_id: T::AccountId,
        category_id: &T::CategoryId,
        moderator_id: &ModeratorId<T>,
        new_value: bool,
    ) -> Result<(), Error<T>> {
        // Not signed by forum LEAD
        Self::ensure_is_forum_lead_account(&account_id)?;

        // ensure category exists.
        let category = Self::ensure_category_exists(category_id)?;

        if new_value {
            Self::ensure_map_limits::<<<T>::MapLimits as StorageLimits>::MaxModeratorsForCategory>(
                category.num_direct_moderators as u64,
            )?;
        } else {
            ensure!(
                <CategoryByModerator<T>>::contains_key(category_id, moderator_id),
                Error::<T>::CategoryModeratorDoesNotExist
            );
        }

        Ok(())
    }

    fn ensure_category_exists(
        category_id: &T::CategoryId,
    ) -> Result<Category<T::CategoryId, T::ThreadId, T::Hash>, Error<T>> {
        ensure!(
            <CategoryById<T>>::contains_key(&category_id),
            Error::<T>::CategoryDoesNotExist
        );

        Ok(<CategoryById<T>>::get(category_id))
    }

    fn ensure_can_create_category(
        account_id: T::AccountId,
        parent_category_id: &Option<T::CategoryId>,
    ) -> Result<Option<Category<T::CategoryId, T::ThreadId, T::Hash>>, Error<T>> {
        // Not signed by forum LEAD
        Self::ensure_is_forum_lead_account(&account_id)?;

        Self::ensure_map_limits::<<<T>::MapLimits as StorageLimits>::MaxCategories>(
            <CategoryCounter<T>>::get().into() as u64,
        )?;

        // If not root, then check that we can create in parent category
        if let Some(tmp_parent_category_id) = parent_category_id {
            // Can we mutate in this category?
            Self::ensure_can_add_subcategory_path_leaf(&tmp_parent_category_id)?;

            let parent_category = <CategoryById<T>>::get(tmp_parent_category_id);

            Self::ensure_map_limits::<<<T>::MapLimits as StorageLimits>::MaxSubcategories>(
                parent_category.num_direct_subcategories as u64,
            )?;

            return Ok(Some(parent_category));
        }

        Ok(None)
    }

    fn ensure_can_create_thread(
        account_id: &T::AccountId,
        forum_user_id: &ForumUserId<T>,
        category_id: &T::CategoryId,
    ) -> Result<Category<T::CategoryId, T::ThreadId, T::Hash>, Error<T>> {
        // Check that account is forum member
        Self::ensure_is_forum_user(account_id, &forum_user_id)?;

        let category = Self::ensure_category_is_mutable(category_id)?;

        // The balance for creation of thread is the base cost plus the cost of a single post
        let minimum_balance = T::ThreadDeposit::get() + T::PostDeposit::get();
        ensure!(
            Self::ensure_enough_balance(minimum_balance, &account_id),
            Error::<T>::InsufficientBalanceForThreadCreation
        );

        Ok(category)
    }

    fn ensure_enough_balance(balance: BalanceOf<T>, account_id: &T::AccountId) -> bool {
        Balances::<T>::usable_balance(account_id) >= balance
    }

    fn ensure_can_add_post(
        account_id: &T::AccountId,
        forum_user_id: &ForumUserId<T>,
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
    ) -> Result<(Category<T::CategoryId, T::ThreadId, T::Hash>, ThreadOf<T>), Error<T>> {
        // Check that account is forum member
        Self::ensure_is_forum_user(account_id, &forum_user_id)?;

        let (category, thread) = Self::ensure_thread_is_mutable(category_id, thread_id)?;

        Ok((category, thread))
    }

    fn ensure_can_set_stickied_threads(
        account_id: T::AccountId,
        actor: &PrivilegedActor<T>,
        category_id: &T::CategoryId,
        stickied_ids: &[T::ThreadId],
    ) -> Result<Category<T::CategoryId, T::ThreadId, T::Hash>, Error<T>> {
        // Ensure actor can moderate the category
        let category = Self::ensure_can_moderate_category(&account_id, &actor, &category_id)?;

        // Ensure all thread id valid and is under the category
        // Helps to prevent thread ID duplicates.
        let mut unique_stickied_ids = BTreeSet::<T::ThreadId>::new();

        // Ensure all thread id valid and is under the category
        for thread_id in stickied_ids {
            // Check for ID duplicates.
            if unique_stickied_ids.contains(thread_id) {
                return Err(Error::<T>::StickiedThreadIdsDuplicates);
            } else {
                unique_stickied_ids.insert(*thread_id);
            }

            Self::ensure_thread_exists(&category_id, thread_id)?;
        }

        Ok(category)
    }

    /// Check the vote is valid
    fn ensure_vote_is_valid(
        thread: ThreadOf<T>,
        index: u32,
        thread_id: &T::ThreadId,
        forum_user_id: &ForumUserId<T>,
    ) -> Result<Poll<T::Moment, T::Hash>, Error<T>> {
        // Ensure poll exists
        let poll = thread.poll.ok_or(Error::<T>::PollNotExist)?;

        // No previous votes for a forum user.
        ensure!(
            !Self::poll_votes_by_thread_id_by_forum_user_id(thread_id, forum_user_id),
            Error::<T>::AlreadyVotedOnPoll
        );

        // Poll not expired
        if poll.end_time < <pallet_timestamp::Module<T>>::now() {
            Err(Error::<T>::PollCommitExpired)
        } else {
            let alternative_length = poll.poll_alternatives.len();
            // The selected alternative index is valid
            if index as usize >= alternative_length {
                Err(Error::<T>::PollData)
            } else {
                Ok(poll)
            }
        }
    }

    // supposed to be called before mutations - checks if next entity can be added
    fn ensure_map_limits<U: Get<u64>>(current_amount: u64) -> Result<(), Error<T>> {
        fn check_limit<T: Trait>(amount: u64, limit: u64) -> Result<(), Error<T>> {
            if amount >= limit {
                return Err(Error::<T>::MapSizeLimit);
            }

            Ok(())
        }

        check_limit(current_amount, U::get())
    }

    /// Ensure data migration is done
    fn ensure_data_migration_done() -> Result<(), Error<T>> {
        if DataMigrationDone::get() {
            Ok(())
        } else {
            Err(Error::<T>::DataMigrationNotDone)
        }
    }
}
