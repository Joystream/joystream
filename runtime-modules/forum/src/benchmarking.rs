#![cfg(feature = "runtime-benchmarks")]
use super::*;
use balances::Module as Balances;
use core::convert::TryInto;
use frame_benchmarking::{account, benchmarks};
use frame_support::storage::StorageMap;
use frame_support::traits::Currency;
use frame_system::Module as System;
use frame_system::{EventRecord, RawOrigin};
use membership::Module as Membership;
use sp_runtime::traits::Bounded;
use sp_std::collections::btree_set::BTreeSet;
use working_group::{
    ApplicationById, ApplicationId, ApplyOnOpeningParameters, OpeningById, OpeningId, OpeningType,
    StakeParameters, StakePolicy, WorkerById,
};

// We create this trait because we need to be compatible with the runtime
// in the mock for tests. In that case we need to be able to have `membership_id == account_id`
// We can't create an account from an `u32` or from a memberhsip_dd,
// so this trait allows us to get an account id from an u32, in the case of `64` which is what
// the mock use we get the parameter as a return.
// In the case of `AccountId32` we use the method provided by `frame_benchmarking` to get an
// AccountId.
pub trait CreateAccountId {
    fn create_account_id(id: u32) -> Self;
}

impl CreateAccountId for u128 {
    fn create_account_id(id: u32) -> Self {
        id.into()
    }
}

impl CreateAccountId for sp_core::crypto::AccountId32 {
    fn create_account_id(id: u32) -> Self {
        account::<Self>("default", id, SEED)
    }
}

// The forum working group instance alias.
pub type ForumWorkingGroupInstance = working_group::Instance1;

// Alias for forum working group
type ForumGroup<T> = working_group::Module<T, ForumWorkingGroupInstance>;

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

const SEED: u32 = 0;
const MAX_BYTES: u32 = 16384;
const MAX_POSTS: u32 = 500;
const MAX_THREADS: u32 = 500;

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> (8 * byte_number)) as u8
}

fn assert_last_event<T: Trait>(generic_event: <T as Trait>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn member_funded_account<T: Trait + membership::Trait + balances::Trait>(
    id: u32,
) -> (T::AccountId, T::MemberId)
where
    T::AccountId: CreateAccountId,
{
    let account_id = T::AccountId::create_account_id(id);
    let handle = handle_from_id::<T>(id);

    let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

    let params = membership::BuyMembershipParameters {
        root_account: account_id.clone(),
        controller_account: account_id.clone(),
        handle: Some(handle),
        metadata: Vec::new(),
        referrer_id: None,
    };

    Membership::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();

    let _ = Balances::<T>::make_free_balance_be(&account_id, BalanceOf::<T>::max_value());

    let member_id = T::MemberId::from(id.try_into().unwrap());
    Membership::<T>::add_staking_account_candidate(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id,
    )
    .unwrap();
    Membership::<T>::confirm_staking_account(
        RawOrigin::Signed(account_id.clone()).into(),
        member_id,
        account_id.clone(),
    )
    .unwrap();

    (account_id, member_id)
}

// Method to generate a distintic valid handle
// for a membership. For each index.
fn handle_from_id<T: membership::Trait>(id: u32) -> Vec<u8> {
    let min_handle_length = 1;

    let mut handle = vec![];

    for i in 0..4 {
        handle.push(get_byte(id, i));
    }

    while handle.len() < (min_handle_length as usize) {
        handle.push(0u8);
    }

    handle
}

fn insert_a_leader<
    T: Trait + membership::Trait + working_group::Trait<ForumWorkingGroupInstance> + balances::Trait,
>(
    id: u64,
) -> T::AccountId
where
    T::AccountId: CreateAccountId,
{
    let (caller_id, member_id) = member_funded_account::<T>(id as u32);

    let (opening_id, application_id) = add_and_apply_opening::<T>(
        &T::Origin::from(RawOrigin::Root),
        &caller_id,
        &member_id,
        &OpeningType::Leader,
    );

    let mut successful_application_ids = BTreeSet::<ApplicationId>::new();
    successful_application_ids.insert(application_id);
    ForumGroup::<T>::fill_opening(
        RawOrigin::Root.into(),
        opening_id,
        successful_application_ids,
    )
    .unwrap();

    let actor_id =
        <T as common::membership::MembershipTypes>::ActorId::from(id.try_into().unwrap());
    assert!(WorkerById::<T, ForumWorkingGroupInstance>::contains_key(
        actor_id
    ));

    caller_id
}

fn insert_a_worker<
    T: Trait + membership::Trait + working_group::Trait<ForumWorkingGroupInstance> + balances::Trait,
>(
    leader_account_id: T::AccountId,
    id: u64,
) -> T::AccountId
where
    T::AccountId: CreateAccountId,
{
    let (caller_id, member_id) = member_funded_account::<T>(id as u32);

    let leader_origin = RawOrigin::Signed(leader_account_id);

    let (opening_id, application_id) = add_and_apply_opening::<T>(
        &T::Origin::from(leader_origin.clone()),
        &caller_id,
        &member_id,
        &OpeningType::Regular,
    );

    let mut successful_application_ids = BTreeSet::<ApplicationId>::new();
    successful_application_ids.insert(application_id);
    ForumGroup::<T>::fill_opening(leader_origin.into(), opening_id, successful_application_ids)
        .unwrap();

    let actor_id =
        <T as common::membership::MembershipTypes>::ActorId::from(id.try_into().unwrap());
    assert!(WorkerById::<T, ForumWorkingGroupInstance>::contains_key(
        actor_id
    ));

    caller_id
}

fn add_and_apply_opening<T: Trait + working_group::Trait<ForumWorkingGroupInstance>>(
    add_opening_origin: &T::Origin,
    applicant_account_id: &T::AccountId,
    applicant_member_id: &T::MemberId,
    job_opening_type: &OpeningType,
) -> (OpeningId, ApplicationId) {
    let opening_id = add_opening_helper::<T>(add_opening_origin, job_opening_type);

    let application_id =
        apply_on_opening_helper::<T>(applicant_account_id, applicant_member_id, &opening_id);

    (opening_id, application_id)
}

fn add_opening_helper<T: Trait + working_group::Trait<ForumWorkingGroupInstance>>(
    add_opening_origin: &T::Origin,
    job_opening_type: &OpeningType,
) -> OpeningId {
    ForumGroup::<T>::add_opening(
        add_opening_origin.clone(),
        vec![],
        *job_opening_type,
        StakePolicy {
            stake_amount:
                <T as working_group::Trait<ForumWorkingGroupInstance>>::MinimumApplicationStake::get(
                ),
            leaving_unstaking_period: <T as
                working_group::Trait<ForumWorkingGroupInstance>>::MinUnstakingPeriodLimit::get() + One::one(),
        },
        Some(One::one()),
    )
    .unwrap();

    let opening_id = ForumGroup::<T>::next_opening_id() - 1;

    assert!(
        OpeningById::<T, ForumWorkingGroupInstance>::contains_key(opening_id),
        "Opening not added"
    );

    opening_id
}

fn apply_on_opening_helper<T: Trait + working_group::Trait<ForumWorkingGroupInstance>>(
    applicant_account_id: &T::AccountId,
    applicant_member_id: &T::MemberId,
    opening_id: &OpeningId,
) -> ApplicationId {
    ForumGroup::<T>::apply_on_opening(
        RawOrigin::Signed((*applicant_account_id).clone()).into(),
        ApplyOnOpeningParameters::<T> {
            member_id: *applicant_member_id,
            opening_id: *opening_id,
            role_account_id: applicant_account_id.clone(),
            reward_account_id: applicant_account_id.clone(),
            description: vec![],
            stake_parameters: StakeParameters {
                stake: <T as working_group::Trait<ForumWorkingGroupInstance>>::MinimumApplicationStake::get(),
                staking_account_id: applicant_account_id.clone()
            },
        },
    )
    .unwrap();

    let application_id = ForumGroup::<T>::next_application_id() - 1;

    assert!(
        ApplicationById::<T, ForumWorkingGroupInstance>::contains_key(application_id),
        "Application not added"
    );

    application_id
}

fn create_new_category<T: Trait>(
    account_id: T::AccountId,
    parent_category_id: Option<T::CategoryId>,
    title: Vec<u8>,
    description: Vec<u8>,
) -> T::CategoryId {
    let category_id = Module::<T>::next_category_id();

    Module::<T>::create_category(
        RawOrigin::Signed(account_id).into(),
        parent_category_id,
        title,
        description,
    )
    .unwrap();

    assert!(<CategoryById<T>>::contains_key(category_id));
    category_id
}

fn create_new_thread<T: Trait>(
    account_id: T::AccountId,
    forum_user_id: crate::ForumUserId<T>,
    category_id: T::CategoryId,
    title: Vec<u8>,
    text: Vec<u8>,
    poll: Option<PollInput<T::Moment>>,
) -> T::ThreadId {
    Module::<T>::create_thread(
        RawOrigin::Signed(account_id).into(),
        forum_user_id,
        category_id,
        title,
        text,
        poll,
    )
    .unwrap();
    Module::<T>::next_thread_id() - T::ThreadId::one()
}

fn add_thread_post<T: Trait>(
    account_id: T::AccountId,
    forum_user_id: crate::ForumUserId<T>,
    category_id: T::CategoryId,
    thread_id: T::ThreadId,
    text: Vec<u8>,
) -> T::PostId {
    Module::<T>::add_post(
        RawOrigin::Signed(account_id).into(),
        forum_user_id,
        category_id,
        thread_id,
        text,
        true,
    )
    .unwrap();
    Module::<T>::next_post_id() - T::PostId::one()
}

fn good_poll_alternative_text() -> Vec<u8> {
    b"poll alternative".to_vec()
}

fn good_poll_description() -> Vec<u8> {
    b"poll description".to_vec()
}

/// Generates poll input
pub fn generate_poll_input<T: Trait>(
    expiration_diff: T::Moment,
    alternatives_number: u32,
) -> PollInput<T::Moment> {
    PollInput {
        description: good_poll_description(),
        end_time: pallet_timestamp::Module::<T>::now() + expiration_diff,
        poll_alternatives: {
            let mut alternatives = vec![];
            for _ in 0..alternatives_number {
                alternatives.push(good_poll_alternative_text());
            }
            alternatives
        },
    }
}

/// Generates categories tree
pub fn generate_categories_tree<T: Trait>(
    caller_id: T::AccountId,
    category_depth: u32,
    moderator_id: Option<ModeratorId<T>>,
) -> (T::CategoryId, Option<T::CategoryId>) {
    let mut parent_category_id = None;
    let mut category_id = T::CategoryId::default();

    let categories_counter_before_tree_construction = <Module<T>>::category_counter();

    let text = vec![0u8].repeat(MAX_BYTES as usize);

    for n in 0..category_depth {
        if n > 1 {
            parent_category_id = Some((n as u64).into());
        }

        category_id = create_new_category::<T>(
            caller_id.clone(),
            parent_category_id,
            text.clone(),
            text.clone(),
        );

        if let Some(moderator_id) = moderator_id {
            // Set up category membership of moderator.
            Module::<T>::update_category_membership_of_moderator(
                RawOrigin::Signed(caller_id.clone()).into(),
                moderator_id,
                category_id,
                true,
            )
            .unwrap();
        }
    }

    assert_eq!(
        categories_counter_before_tree_construction + (category_depth as u64).into(),
        <Module<T>>::category_counter()
    );

    (category_id, parent_category_id)
}

benchmarks! {
    where_clause { where
        T: balances::Trait,
        T: membership::Trait,
        T: working_group::Trait<ForumWorkingGroupInstance> ,
        T::AccountId: CreateAccountId
    }

    _{  }

    create_category{
        let lead_id = 0;

        let caller_id =
            insert_a_leader::<T>(lead_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let j in 0 .. MAX_BYTES;

        let k in 0 .. MAX_BYTES;

        let title = vec![0u8].repeat(j as usize);

        let description = vec![0u8].repeat(k as usize);

        // Generate categories tree
        let (_, parent_category_id) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        let parent_category = parent_category_id.map(Module::<T>::category_by_id);

        let category_counter = <Module<T>>::category_counter();

    }: _ (RawOrigin::Signed(caller_id), parent_category_id, title.clone(), description.clone())
    verify {

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

            let category_id = Module::<T>::next_category_id() - T::CategoryId::one();
            assert_eq!(Module::<T>::category_by_id(category_id), new_category);
            assert_eq!(<Module<T>>::category_counter(), category_counter + T::CategoryId::one());

            if let (Some(parent_category), Some(parent_category_id)) = (parent_category, parent_category_id) {
                assert_eq!(
                    Module::<T>::category_by_id(parent_category_id).num_direct_subcategories,
                    parent_category.num_direct_subcategories + 1
                );
            }
            assert_last_event::<T>(
                RawEvent::CategoryCreated(
                    category_id,
                    parent_category_id,
                    title,
                    description
                ).into()
            );
    }

    update_category_membership_of_moderator_new{
        let moderator_id = 0;

        let caller_id =
            insert_a_leader::<T>(moderator_id);

        let text = vec![0u8].repeat(MAX_BYTES as usize);

        // Create category
        let category_id = create_new_category::<T>(caller_id.clone(), None, text.clone(), text.clone());

        let new_value_flag = true;

    }: update_category_membership_of_moderator(
        RawOrigin::Signed(caller_id), ModeratorId::<T>::from((moderator_id).try_into().unwrap()), category_id, new_value_flag
    )
    verify {
        let num_direct_moderators = 1;

        let new_category = Category {
            title_hash: T::calculate_hash(text.as_slice()),
            description_hash: T::calculate_hash(text.as_slice()),
            archived: false,
            num_direct_subcategories: 0,
            num_direct_threads: 0,
            num_direct_moderators,
            parent_category_id: None,
            sticky_thread_ids: vec![],
        };

        assert_eq!(Module::<T>::category_by_id(category_id), new_category);
        assert!(<CategoryByModerator<T>>::contains_key(category_id, ModeratorId::<T>::from((moderator_id).try_into().unwrap())));

        assert_last_event::<T>(
            RawEvent::CategoryMembershipOfModeratorUpdated(
                ModeratorId::<T>::from((moderator_id).try_into().unwrap()), category_id, new_value_flag
            ).into()
        );

    }

    update_category_membership_of_moderator_old{
        let moderator_id = 0;

        let caller_id =
            insert_a_leader::<T>(moderator_id);

        let text = vec![0u8].repeat(MAX_BYTES as usize);

        // Create category
        let category_id = create_new_category::<T>(caller_id.clone(), None, text.clone(), text.clone());

        // Set up category membership of moderator.
        Module::<T>::update_category_membership_of_moderator(
            RawOrigin::Signed(caller_id.clone()).into(), ModeratorId::<T>::from((moderator_id).try_into().unwrap()), category_id, true
        ).unwrap();

        let new_value_flag = false;

    }: update_category_membership_of_moderator(
        RawOrigin::Signed(caller_id), ModeratorId::<T>::from((moderator_id).try_into().unwrap()), category_id, new_value_flag
    )
    verify {
        let num_direct_moderators = 0;

        let new_category = Category {
            title_hash: T::calculate_hash(text.as_slice()),
            description_hash: T::calculate_hash(text.as_slice()),
            archived: false,
            num_direct_subcategories: 0,
            num_direct_threads: 0,
            num_direct_moderators,
            parent_category_id: None,
            sticky_thread_ids: vec![],
        };

        assert_eq!(Module::<T>::category_by_id(category_id), new_category);
        assert!(!<CategoryByModerator<T>>::contains_key(category_id, ModeratorId::<T>::from((moderator_id).try_into().unwrap())));

        assert_last_event::<T>(
            RawEvent::CategoryMembershipOfModeratorUpdated(
                ModeratorId::<T>::from((moderator_id).try_into().unwrap()), category_id, new_value_flag
            ).into()
        );
    }

    update_category_archival_status_lead{
        let lead_id = 0;

        let caller_id =
            insert_a_leader::<T>(lead_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let new_archival_status = true;

        // Generate categories tree
        let (category_id, parent_category_id) = generate_categories_tree::<T>(caller_id.clone(), i, None);


    }: update_category_archival_status(RawOrigin::Signed(caller_id), PrivilegedActor::Lead, category_id, new_archival_status)
    verify {
        let text = vec![0u8].repeat(MAX_BYTES as usize);

        let new_category = Category {
            title_hash: T::calculate_hash(text.as_slice()),
            description_hash: T::calculate_hash(text.as_slice()),
            archived: new_archival_status,
            num_direct_subcategories: 0,
            num_direct_threads: 0,
            num_direct_moderators: 0,
            parent_category_id,
            sticky_thread_ids: vec![],
        };

        assert_eq!(Module::<T>::category_by_id(category_id), new_category);
        assert_last_event::<T>(
            RawEvent::CategoryArchivalStatusUpdated(
                category_id,
                new_archival_status,
                PrivilegedActor::Lead
            ).into()
        );
    }

    update_category_archival_status_moderator{
        let moderator_id = 0;

        let caller_id =
            insert_a_leader::<T>(moderator_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let new_archival_status = true;

        // Generate categories tree
        let (category_id, parent_category_id) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        let moderator_id = ModeratorId::<T>::from(moderator_id.try_into().unwrap());

        // Set up category membership of moderator.
        Module::<T>::update_category_membership_of_moderator(
            RawOrigin::Signed(caller_id.clone()).into(), moderator_id, category_id, true
        ).unwrap();

    }: update_category_archival_status(RawOrigin::Signed(caller_id), PrivilegedActor::Moderator(moderator_id), category_id, new_archival_status)
    verify {
        let text = vec![0u8].repeat(MAX_BYTES as usize);

        let new_category = Category {
            title_hash: T::calculate_hash(text.as_slice()),
            description_hash: T::calculate_hash(text.as_slice()),
            archived: new_archival_status,
            num_direct_subcategories: 0,
            num_direct_threads: 0,
            num_direct_moderators: 1,
            parent_category_id,
            sticky_thread_ids: vec![],
        };

        assert_eq!(Module::<T>::category_by_id(category_id), new_category);
        assert_last_event::<T>(
            RawEvent::CategoryArchivalStatusUpdated(
                category_id,
                new_archival_status,
                PrivilegedActor::Moderator(moderator_id)
            ).into()
        );
    }

    update_category_title_lead{
        let lead_id = 0;

        let caller_id =
            insert_a_leader::<T>(lead_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let j in 0 .. MAX_BYTES - 1;

        let new_title = vec![0u8].repeat(j as usize);

        // Generate categories tree
        let (category_id, parent_category_id) = generate_categories_tree::<T>(caller_id.clone(), i, None);


    }: update_category_title(RawOrigin::Signed(caller_id), PrivilegedActor::Lead, category_id, new_title.clone())
    verify {
        let text = vec![0u8].repeat(MAX_BYTES as usize);
        let new_title_hash = T::calculate_hash(new_title.as_slice());

        let new_category = Category {
            title_hash: new_title_hash,
            description_hash: T::calculate_hash(text.as_slice()),
            archived: false,
            num_direct_subcategories: 0,
            num_direct_threads: 0,
            num_direct_moderators: 0,
            parent_category_id,
            sticky_thread_ids: vec![],
        };

        assert_eq!(Module::<T>::category_by_id(category_id), new_category);
        assert_last_event::<T>(
            RawEvent::CategoryTitleUpdated(
                category_id,
                new_title_hash,
                PrivilegedActor::Lead
            ).into()
        );
    }

    update_category_title_moderator{
        let moderator_id = 0;

        let caller_id =
            insert_a_leader::<T>(moderator_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;


        let j in 0 .. MAX_BYTES - 1;

        let new_title = vec![0u8].repeat(j as usize);

        // Generate categories tree
        let (category_id, parent_category_id) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        let moderator_id = ModeratorId::<T>::from(moderator_id.try_into().unwrap());

        // Set up category membership of moderator.
        Module::<T>::update_category_membership_of_moderator(
            RawOrigin::Signed(caller_id.clone()).into(), moderator_id, category_id, true
        ).unwrap();

    }: update_category_title(RawOrigin::Signed(caller_id), PrivilegedActor::Moderator(moderator_id), category_id, new_title.clone())
    verify {
        let text = vec![0u8].repeat(MAX_BYTES as usize);
        let new_title_hash = T::calculate_hash(new_title.as_slice());

        let new_category = Category {
            title_hash: new_title_hash,
            description_hash: T::calculate_hash(text.as_slice()),
            archived: false,
            num_direct_subcategories: 0,
            num_direct_threads: 0,
            num_direct_moderators: 1,
            parent_category_id,
            sticky_thread_ids: vec![],
        };

        assert_eq!(Module::<T>::category_by_id(category_id), new_category);
        assert_last_event::<T>(
            RawEvent::CategoryTitleUpdated(
                category_id,
                new_title_hash,
                PrivilegedActor::Moderator(moderator_id)
            ).into()
        );
    }

    update_category_description_lead{
        let lead_id = 0;

        let caller_id =
            insert_a_leader::<T>(lead_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let j in 0 .. MAX_BYTES - 1;

        let new_description = vec![0u8].repeat(j as usize);

        // Generate categories tree
        let (category_id, parent_category_id) = generate_categories_tree::<T>(caller_id.clone(), i, None);


    }: update_category_description(RawOrigin::Signed(caller_id), PrivilegedActor::Lead, category_id, new_description.clone())
    verify {
        let text = vec![0u8].repeat(MAX_BYTES as usize);
        let new_description_hash = T::calculate_hash(new_description.as_slice());

        let new_category = Category {
            title_hash: T::calculate_hash(text.as_slice()),
            description_hash: new_description_hash,
            archived: false,
            num_direct_subcategories: 0,
            num_direct_threads: 0,
            num_direct_moderators: 0,
            parent_category_id,
            sticky_thread_ids: vec![],
        };

        assert_eq!(Module::<T>::category_by_id(category_id), new_category);
        assert_last_event::<T>(
            RawEvent::CategoryDescriptionUpdated(
                category_id,
                new_description_hash,
                PrivilegedActor::Lead
            ).into()
        );
    }

    update_category_description_moderator{
        let moderator_id = 0;

        let caller_id =
            insert_a_leader::<T>(moderator_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;


        let j in 0 .. MAX_BYTES - 1;

        let new_description = vec![0u8].repeat(j as usize);

        // Generate categories tree
        let (category_id, parent_category_id) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        let moderator_id = ModeratorId::<T>::from(moderator_id.try_into().unwrap());

        // Set up category membership of moderator.
        Module::<T>::update_category_membership_of_moderator(
            RawOrigin::Signed(caller_id.clone()).into(), moderator_id, category_id, true
        ).unwrap();

    }: update_category_description(RawOrigin::Signed(caller_id), PrivilegedActor::Moderator(moderator_id), category_id, new_description.clone())
    verify {
        let text = vec![0u8].repeat(MAX_BYTES as usize);
        let new_description_hash = T::calculate_hash(new_description.as_slice());

        let new_category = Category {
            title_hash: T::calculate_hash(text.as_slice()),
            description_hash: new_description_hash,
            archived: false,
            num_direct_subcategories: 0,
            num_direct_threads: 0,
            num_direct_moderators: 1,
            parent_category_id,
            sticky_thread_ids: vec![],
        };

        assert_eq!(Module::<T>::category_by_id(category_id), new_category);
        assert_last_event::<T>(
            RawEvent::CategoryDescriptionUpdated(
                category_id,
                new_description_hash,
                PrivilegedActor::Moderator(moderator_id)
            ).into()
        );
    }

    delete_category_lead {

        let lead_id = 0;

        let caller_id =
            insert_a_leader::<T>(lead_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        // Generate categories tree
        let (category_id, parent_category_id) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        let category_counter = <Module<T>>::category_counter();

    }: delete_category(RawOrigin::Signed(caller_id), PrivilegedActor::Lead, category_id)
    verify {
        let text = vec![0u8].repeat(MAX_BYTES as usize);

        let new_category: Category<T::CategoryId, T::ThreadId, <T as frame_system::Trait>::Hash> = Category {
            title_hash: T::calculate_hash(text.as_slice()),
            description_hash: T::calculate_hash(text.as_slice()),
            archived: false,
            num_direct_subcategories: 0,
            num_direct_threads: 0,
            num_direct_moderators: 0,
            parent_category_id: None,
            sticky_thread_ids: vec![],
        };

        if let Some(parent_category_id) = parent_category_id {
            // Ensure number of direct subcategories for parent category decremented successfully
            assert_eq!(Module::<T>::category_by_id(parent_category_id).num_direct_subcategories, 0);
        }

        assert_eq!(<Module<T>>::category_counter(), category_counter - T::CategoryId::one());

        // Ensure category removed successfully
        assert!(!<CategoryById<T>>::contains_key(category_id));

        assert_last_event::<T>(
            RawEvent::CategoryDeleted(category_id, PrivilegedActor::Lead).into()
        );
    }

    delete_category_moderator {

        let lead_id = 0;

        let caller_id =
            insert_a_leader::<T>(lead_id);

        let i in 3 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let moderator_id = ModeratorId::<T>::from(lead_id.try_into().unwrap());

        // Generate categories tree
        let (category_id, parent_category_id) = generate_categories_tree::<T>(caller_id.clone(), i, Some(moderator_id));

        let category_counter = <Module<T>>::category_counter();

    }: delete_category(RawOrigin::Signed(caller_id), PrivilegedActor::Moderator(moderator_id), category_id)
    verify {
        let text = vec![0u8].repeat(MAX_BYTES as usize);

        let new_category: Category<T::CategoryId, T::ThreadId, <T as frame_system::Trait>::Hash> = Category {
            title_hash: T::calculate_hash(text.as_slice()),
            description_hash: T::calculate_hash(text.as_slice()),
            archived: false,
            num_direct_subcategories: 0,
            num_direct_threads: 0,
            num_direct_moderators: 1,
            parent_category_id: None,
            sticky_thread_ids: vec![],
        };

        if let Some(parent_category_id) = parent_category_id {
            // Ensure number of direct subcategories for parent category decremented successfully
            assert_eq!(Module::<T>::category_by_id(parent_category_id).num_direct_subcategories, 0);
        }

        assert_eq!(<Module<T>>::category_counter(), category_counter - T::CategoryId::one());

        // Ensure category removed successfully
        assert!(!<CategoryById<T>>::contains_key(category_id));

        assert_last_event::<T>(
            RawEvent::CategoryDeleted(category_id, PrivilegedActor::Moderator(moderator_id)).into()
        );
    }

    create_thread {
        let forum_user_id = 0;
        let caller_id =
            insert_a_leader::<T>(forum_user_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let j in 0 .. MAX_BYTES;

        let k in 0 .. MAX_BYTES;

        let z in 1 .. (<<<T as Trait>::MapLimits as StorageLimits>::MaxPollAlternativesNumber>::get() - 1) as u32;

        // Generate categories tree
        let (category_id, _) = generate_categories_tree::<T>(caller_id.clone(), i, None);
        let mut category = Module::<T>::category_by_id(category_id);

        let metadata = vec![0u8].repeat(j as usize);

        let text = vec![0u8].repeat(k as usize);

        let expiration_diff = 1010u32.into();

        let poll_input = if z == 1 {
            None
        } else {
            // min number of poll alternatives is set to 2
            Some(generate_poll_input::<T>(expiration_diff, z))
        };

        let next_thread_id = Module::<T>::next_thread_id();
        let next_post_id = Module::<T>::next_post_id();
        let initial_balance = Balances::<T>::usable_balance(&caller_id);

    }: _ (RawOrigin::Signed(caller_id.clone()), forum_user_id.saturated_into(), category_id, metadata.clone(), text.clone(), poll_input.clone())
    verify {

        assert_eq!(
            Balances::<T>::usable_balance(&caller_id),
            initial_balance - T::ThreadDeposit::get() - T::PostDeposit::get(),
        );

        // Ensure category num_direct_threads updated successfully.
        category.num_direct_threads+=1;
        assert_eq!(Module::<T>::category_by_id(category_id), category);

        // Ensure initial post added successfully
        let new_post = Post {
            text_hash: T::calculate_hash(&text),
            author_id: forum_user_id.saturated_into(),
            thread_id: next_thread_id,
            last_edited: System::<T>::block_number(),
            cleanup_pay_off: T::PostDeposit::get(),
        };

        // Ensure new thread created successfully
        let new_thread = Thread {
            category_id,
            author_id: forum_user_id.saturated_into(),
            poll: poll_input.clone().map(<Module<T>>::from_poll_input),
            cleanup_pay_off: T::ThreadDeposit::get(),
            number_of_posts: 1,
        };

        assert_eq!(Module::<T>::thread_by_id(category_id, next_thread_id), new_thread);
        assert_eq!(Module::<T>::next_thread_id(), next_thread_id + T::ThreadId::one());


        assert_eq!(
            Module::<T>::post_by_id(next_thread_id, next_post_id),
            new_post
        );

        assert_eq!(Module::<T>::next_post_id(), next_post_id + T::PostId::one());

        assert_last_event::<T>(
            RawEvent::ThreadCreated(
                category_id,
                next_thread_id,
                next_post_id,
                forum_user_id.saturated_into(),
                metadata,
                text,
                poll_input,
            ).into()
        );
    }

    edit_thread_metadata {
        let forum_user_id = 0;

        let caller_id =
            insert_a_leader::<T>(forum_user_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let j in 0 .. MAX_BYTES;

        // Generate categories tree
        let (category_id, _) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        // Create thread
        let thread_id = create_new_thread::<T>(
            caller_id.clone(), forum_user_id.saturated_into(), category_id,
            vec![1u8].repeat(MAX_BYTES as usize), vec![1u8].repeat(MAX_BYTES as usize), None
        );
        let thread = Module::<T>::thread_by_id(category_id, thread_id);

        let new_metadata = vec![0u8].repeat(j as usize);

    }: _ (RawOrigin::Signed(caller_id), forum_user_id.saturated_into(), category_id, thread_id, new_metadata.clone())
    verify {
        assert_eq!(Module::<T>::thread_by_id(category_id, thread_id), thread);

        assert_last_event::<T>(
            RawEvent::ThreadMetadataUpdated(
                thread_id,
                forum_user_id.saturated_into(),
                category_id,
                new_metadata
            ).into()
        );
    }

    delete_thread {
        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;
        let hide = false;

        let forum_user_id = 0;
        let caller_id =
            insert_a_leader::<T>(forum_user_id);

        // Generate categories tree
        let (category_id, _) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        // Create thread
        let expiration_diff = 10u32.into();
        let poll = Some(
            generate_poll_input::<T>(expiration_diff, (<<<T as Trait>::MapLimits as StorageLimits>::MaxPollAlternativesNumber>::get() - 1) as u32)
        );
        let text = vec![1u8].repeat(MAX_BYTES as usize);

        let thread_id = create_new_thread::<T>(
            caller_id.clone(), forum_user_id.saturated_into(), category_id,
            text.clone(), text, poll
        );

        // Add poll voting.
        for idx in 1..(T::MaxWorkerNumberLimit::get() - 1) {
            let member_id = idx.into();
            let member_account_id = insert_a_worker::<T>(caller_id.clone(), member_id);

            let alternative_idx = 1;
            Module::<T>::vote_on_poll(
                RawOrigin::Signed(member_account_id.clone()).into(),
                member_id.saturated_into(),
                category_id,
                thread_id,
                alternative_idx
            ).unwrap();
        }

        let mut category = Module::<T>::category_by_id(category_id);

        let initial_balance = Balances::<T>::usable_balance(&caller_id);
    }: _(
        RawOrigin::Signed(caller_id.clone()),
        forum_user_id.saturated_into(),
        category_id,
        thread_id,
        hide
    )
    verify {

        // Ensure that balance is paid off
        assert_eq!(
            Balances::<T>::usable_balance(&caller_id),
            initial_balance +
            T::ThreadDeposit::get()
        );

        // Ensure category num_direct_threads updated successfully.
        category.num_direct_threads-=1;
        assert_eq!(Module::<T>::category_by_id(category_id), category);

        // Ensure thread was successfully deleted
        assert!(!<ThreadById<T>>::contains_key(category_id, thread_id));
        assert_eq!(<PollVotes<T>>::iter_prefix_values(&thread_id).count(), 0);

        assert_last_event::<T>(
            RawEvent::ThreadDeleted(
                thread_id,
                forum_user_id.saturated_into(),
                category_id,
                hide
            ).into()
        );
    }

    move_thread_to_category_lead {
        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let forum_user_id = 0;
        let text = vec![1u8].repeat(MAX_BYTES as usize);

        let caller_id =
            insert_a_leader::<T>(forum_user_id);

        // If category depth is less or equal to one, create two separate categories
        let (category_id, new_category_id) = if i <= 2 {
            let category_id = create_new_category::<T>(
                caller_id.clone(),
                None,
                text.clone(),
                text.clone(),
            );

            let new_category_id = create_new_category::<T>(
                caller_id.clone(),
                None,
                text.clone(),
                text.clone(),
            );

            (category_id, new_category_id)
        } else {
            // Generate categories tree
            let (category_id, parent_category_id) = generate_categories_tree::<T>(caller_id.clone(), i, None);

            (category_id, parent_category_id.unwrap())
        };

        // Create thread
        let thread_id = create_new_thread::<T>(caller_id.clone(), forum_user_id.saturated_into(), category_id, text.clone(), text, None);
        let thread = Module::<T>::thread_by_id(category_id, thread_id);

        let mut category = Module::<T>::category_by_id(category_id);
        let mut new_category = Module::<T>::category_by_id(new_category_id);

    }: move_thread_to_category(RawOrigin::Signed(caller_id), PrivilegedActor::Lead, category_id, thread_id, new_category_id)
    verify {
        // Ensure thread was successfully moved to the new category
        category.num_direct_threads-=1;
        new_category.num_direct_threads+=1;

        assert_eq!(Module::<T>::category_by_id(category_id), category);
        assert_eq!(Module::<T>::category_by_id(new_category_id), new_category);

        assert!(!<ThreadById<T>>::contains_key(category_id, thread_id));
        assert_eq!(Module::<T>::thread_by_id(new_category_id, thread_id), thread);

        assert_last_event::<T>(
            RawEvent::ThreadMoved(
                thread_id,
                new_category_id,
                PrivilegedActor::Lead,
                category_id
            ).into()
        );
    }

    move_thread_to_category_moderator {
        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let forum_user_id = 0;
        let text = vec![1u8].repeat(MAX_BYTES as usize);

        let caller_id =
            insert_a_leader::<T>(forum_user_id);

        // If category depth is less or equal to one, create two separate categories
        let (category_id, new_category_id) = if i <= 2 {
            let category_id = create_new_category::<T>(
                caller_id.clone(),
                None,
                text.clone(),
                text.clone(),
            );

            let new_category_id = create_new_category::<T>(
                caller_id.clone(),
                None,
                text.clone(),
                text.clone(),
            );

            (category_id, new_category_id)
        } else {
            // Generate categories tree
            let (category_id, parent_category_id) = generate_categories_tree::<T>(caller_id.clone(), i, None);

            (category_id, parent_category_id.unwrap())
        };

        // Create thread
        let thread_id = create_new_thread::<T>(caller_id.clone(), forum_user_id.saturated_into(), category_id, text.clone(), text, None);
        let thread = Module::<T>::thread_by_id(category_id, thread_id);

        let moderator_id = ModeratorId::<T>::from(forum_user_id.try_into().unwrap());

        // Set up categories membership of moderator.
        Module::<T>::update_category_membership_of_moderator(
            RawOrigin::Signed(caller_id.clone()).into(), moderator_id, category_id, true
        ).unwrap();

        // Set up categories membership of moderator.
        Module::<T>::update_category_membership_of_moderator(
            RawOrigin::Signed(caller_id.clone()).into(), moderator_id, new_category_id, true
        ).unwrap();

        let mut category = Module::<T>::category_by_id(category_id);
        let mut new_category = Module::<T>::category_by_id(new_category_id);

    }: move_thread_to_category(RawOrigin::Signed(caller_id), PrivilegedActor::Moderator(moderator_id), category_id, thread_id, new_category_id)
    verify {
        // Ensure thread was successfully moved to the new category
        category.num_direct_threads-=1;
        new_category.num_direct_threads+=1;

        assert_eq!(Module::<T>::category_by_id(category_id), category);
        assert_eq!(Module::<T>::category_by_id(new_category_id), new_category);

        assert!(!<ThreadById<T>>::contains_key(category_id, thread_id));
        assert_eq!(Module::<T>::thread_by_id(new_category_id, thread_id), thread);

        assert_last_event::<T>(
            RawEvent::ThreadMoved(
                thread_id,
                new_category_id,
                PrivilegedActor::Moderator(moderator_id),
                category_id
            ).into()
        );
    }

    vote_on_poll {

        let forum_user_id = 0;
        let caller_id =
            insert_a_leader::<T>(forum_user_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let j in 2 .. (<<<T as Trait>::MapLimits as StorageLimits>::MaxPollAlternativesNumber>::get() - 1) as u32;

        // Generate categories tree
        let (category_id, _) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        // Create thread
        let expiration_diff = 10u32.into();
        let poll_input = Some(generate_poll_input::<T>(expiration_diff, j));
        let text = vec![1u8].repeat(MAX_BYTES as usize);

        let thread_id = create_new_thread::<T>(
            caller_id.clone(), forum_user_id.saturated_into(), category_id,
            text.clone(), text, poll_input
        );

        let mut thread = Module::<T>::thread_by_id(category_id, thread_id);

    }: _ (RawOrigin::Signed(caller_id), forum_user_id.saturated_into(), category_id, thread_id, j - 1)
    verify {
        // Store new poll alternative statistics
        if let Some(ref mut poll) = thread.poll {
            let new_poll_alternatives: Vec<PollAlternative<T::Hash>> = poll.poll_alternatives.iter()
                .enumerate()
                .map(|(old_index, old_value)| if (j - 1) as usize == old_index
                    { PollAlternative {
                        alternative_text_hash: old_value.alternative_text_hash,
                        vote_count: old_value.vote_count + 1,
                    }
                    } else {
                        old_value.clone()
                    })
            .collect();

            poll.poll_alternatives = new_poll_alternatives;
        }

        assert_eq!(Module::<T>::thread_by_id(category_id, thread_id), thread);
        assert!(<PollVotes<T>>::get(thread_id, forum_user_id.saturated_into::<ForumUserId<T>>()));

        assert_last_event::<T>(
            RawEvent::VoteOnPoll(
                thread_id,
                j - 1,
                forum_user_id.saturated_into(),
                category_id
            ).into()
        );
    }

    moderate_thread_lead {
        let lead_id = 0;

        let caller_id =
            insert_a_leader::<T>(lead_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let k in 0 .. MAX_BYTES;

        // Generate categories tree
        let (category_id, _) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        // Create thread
        let expiration_diff = 10u32.into();
        let poll = Some(
            generate_poll_input::<T>(expiration_diff, (<<<T as Trait>::MapLimits as StorageLimits>::MaxPollAlternativesNumber>::get() - 1) as u32)
        );

        let text = vec![1u8].repeat(MAX_BYTES as usize);
        let thread_id = create_new_thread::<T>(
            caller_id.clone(), (lead_id as u64).saturated_into(), category_id,
            text.clone(), text, poll
        );

        let mut category = Module::<T>::category_by_id(category_id);

        let rationale = vec![0u8].repeat(k as usize);

    }: moderate_thread(RawOrigin::Signed(caller_id), PrivilegedActor::Lead, category_id, thread_id, rationale.clone())
    verify {
        // Thread balance was correctly slashed
        let thread_account_id = T::ModuleId::get().into_sub_account(thread_id);
        assert_eq!(
           Balances::<T>::free_balance(&thread_account_id),
           T::PostDeposit::get()
        );

        // Ensure category num_direct_threads updated successfully.
        category.num_direct_threads-=1;
        assert_eq!(Module::<T>::category_by_id(category_id), category);

        // Ensure thread was successfully deleted
        assert!(!<ThreadById<T>>::contains_key(category_id, thread_id));

        assert_last_event::<T>(
            RawEvent::ThreadModerated(
                thread_id,
                rationale,
                PrivilegedActor::Lead,
                category_id
            ).into()
        );
    }

    moderate_thread_moderator {
        let lead_id = 0;

        let caller_id =
            insert_a_leader::<T>(lead_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;


        let k in 0 .. MAX_BYTES;

        // Generate categories tree
        let (category_id, _) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        // Create thread
        let expiration_diff = 10u32.into();
        let poll = Some(
            generate_poll_input::<T>(expiration_diff, (<<<T as Trait>::MapLimits as StorageLimits>::MaxPollAlternativesNumber>::get() - 1) as u32)
        );

        let text = vec![1u8].repeat(MAX_BYTES as usize);
        let thread_id = create_new_thread::<T>(
            caller_id.clone(), (lead_id as u64).saturated_into(), category_id,
            text.clone(), text, poll
        );

        let moderator_id = ModeratorId::<T>::from(lead_id.try_into().unwrap());

        // Set up category membership of moderator.
        Module::<T>::update_category_membership_of_moderator(
            RawOrigin::Signed(caller_id.clone()).into(), moderator_id, category_id, true
        ).unwrap();

        let mut category = Module::<T>::category_by_id(category_id);

        let rationale = vec![0u8].repeat(k as usize);

    }: moderate_thread(RawOrigin::Signed(caller_id), PrivilegedActor::Moderator(moderator_id), category_id, thread_id, rationale.clone())
    verify {
        // Thread balance was correctly slashed
        let thread_account_id = T::ModuleId::get().into_sub_account(thread_id);
        assert_eq!(
           Balances::<T>::free_balance(&thread_account_id),
           T::PostDeposit::get()
        );


        // Ensure category num_direct_threads updated successfully.
        category.num_direct_threads-=1;
        assert_eq!(Module::<T>::category_by_id(category_id), category);

        // Ensure thread was successfully deleted
        assert!(!<ThreadById<T>>::contains_key(category_id, thread_id));

        assert_last_event::<T>(
            RawEvent::ThreadModerated(
                thread_id,
                rationale,
                PrivilegedActor::Moderator(moderator_id),
                category_id
            ).into()
        );
    }

    add_post {

        let forum_user_id = 0;
        let caller_id =
            insert_a_leader::<T>(forum_user_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let j in 0 .. MAX_BYTES;

        let text = vec![0u8].repeat(j as usize);

        // Generate categories tree
        let (category_id, _) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        // Create thread
        let thread_id = create_new_thread::<T>(
            caller_id.clone(), forum_user_id.saturated_into(), category_id,
            vec![0u8].repeat(MAX_BYTES as usize), vec![0u8].repeat(MAX_BYTES as usize), None
        );

        let thread = Module::<T>::thread_by_id(category_id, thread_id);
        let post_id = Module::<T>::next_post_id();

        let initial_balance = Balances::<T>::usable_balance(&caller_id);
    }: _ (RawOrigin::Signed(caller_id.clone()), forum_user_id.saturated_into(), category_id, thread_id, text.clone(), true)
    verify {
        assert_eq!(
            Balances::<T>::usable_balance(&caller_id),
            initial_balance - T::PostDeposit::get()
        );

        // Ensure initial post added successfully
        let new_post = Post {
            text_hash: T::calculate_hash(&text),
            author_id: forum_user_id.saturated_into(),
            thread_id,
            last_edited: System::<T>::block_number(),
            cleanup_pay_off: T::PostDeposit::get(),
        };

        assert_eq!(Module::<T>::post_by_id(thread_id, post_id), new_post);

        assert_eq!(Module::<T>::next_post_id(), post_id + T::PostId::one());

        assert_last_event::<T>(
            RawEvent::PostAdded(
                post_id,
                forum_user_id.saturated_into(),
                category_id,
                thread_id,
                text,
                true,
            ).into()
        );
    }

    react_post {

        let forum_user_id = 0;
        let caller_id =
            insert_a_leader::<T>(forum_user_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        // Generate categories tree
        let (category_id, _) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        // Create thread
        let expiration_diff = 10u32.into();
        let poll = Some(
            generate_poll_input::<T>(expiration_diff, (<<<T as Trait>::MapLimits as StorageLimits>::MaxPollAlternativesNumber>::get() - 1) as u32)
        );
        let text = vec![1u8].repeat(MAX_BYTES as usize);

        let thread_id = create_new_thread::<T>(
            caller_id.clone(), forum_user_id.saturated_into(), category_id,
            text.clone(), text.clone(), poll
        );

        let post_id = add_thread_post::<T>(caller_id.clone(), forum_user_id.saturated_into(), category_id, thread_id, text);

        let react = T::PostReactionId::one();

    }: _ (RawOrigin::Signed(caller_id), forum_user_id.saturated_into(), category_id, thread_id, post_id, react)
    verify {
        assert_last_event::<T>(
            RawEvent::PostReacted(
                forum_user_id.saturated_into(),
                post_id,
                react,
                category_id,
                thread_id
            ).into()
        );
    }

    edit_post_text {
        let forum_user_id = 0;
        let caller_id =
            insert_a_leader::<T>(forum_user_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let j in 0 .. MAX_BYTES;

        // Generate categories tree
        let (category_id, _) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        // Create thread
        let expiration_diff = 10u32.into();
        let poll = Some(
            generate_poll_input::<T>(expiration_diff, (<<<T as Trait>::MapLimits as StorageLimits>::MaxPollAlternativesNumber>::get() - 1) as u32)
        );
        let text = vec![1u8].repeat(MAX_BYTES as usize);

        let thread_id = create_new_thread::<T>(
            caller_id.clone(), forum_user_id.saturated_into(), category_id,
            text.clone(), text.clone(), poll
        );

        let post_id = add_thread_post::<T>(caller_id.clone(), forum_user_id.saturated_into(), category_id, thread_id, text);

        let mut post = Module::<T>::post_by_id(thread_id, post_id);

        let new_text = vec![0u8].repeat(j as usize);

    }: _ (RawOrigin::Signed(caller_id), forum_user_id.saturated_into(), category_id, thread_id, post_id, new_text.clone())
    verify {

        // Ensure post text updated successfully.
        post.text_hash = T::calculate_hash(&new_text);
        post.last_edited = System::<T>::block_number();

        assert_eq!(
            Module::<T>::post_by_id(thread_id, post_id),
            post
        );

        assert_last_event::<T>(
            RawEvent::PostTextUpdated(
                post_id,
                forum_user_id.saturated_into(),
                category_id,
                thread_id,
                new_text
            ).into()
        );

    }

    moderate_post_lead {
        let forum_user_id = 0;
        let caller_id =
            insert_a_leader::<T>(forum_user_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let j in 0 .. MAX_BYTES;

        // Generate categories tree
        let (category_id, _) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        // Create thread
        let expiration_diff = 10u32.into();
        let poll = Some(
            generate_poll_input::<T>(expiration_diff, (<<<T as Trait>::MapLimits as StorageLimits>::MaxPollAlternativesNumber>::get() - 1) as u32)
        );
        let text = vec![1u8].repeat(MAX_BYTES as usize);

        let thread_id = create_new_thread::<T>(
            caller_id.clone(), forum_user_id.saturated_into(), category_id,
            text.clone(), text.clone(), poll
        );
        let post_id = add_thread_post::<T>(caller_id.clone(), forum_user_id.saturated_into(), category_id, thread_id, text);

        let mut thread = Module::<T>::thread_by_id(category_id, thread_id);

        let rationale = vec![0u8].repeat(j as usize);

    }: moderate_post(RawOrigin::Signed(caller_id), PrivilegedActor::Lead, category_id, thread_id, post_id, rationale.clone())
    verify {
        thread.number_of_posts -= 1;
        assert_eq!(Module::<T>::thread_by_id(category_id, thread_id), thread);

        assert!(!<PostById<T>>::contains_key(thread_id, post_id));

        assert_last_event::<T>(
            RawEvent::PostModerated(
                post_id,
                rationale,
                PrivilegedActor::Lead,
                category_id,
                thread_id
            ).into()
        );
    }

    moderate_post_moderator {
        let forum_user_id = 0;
        let caller_id =
            insert_a_leader::<T>(forum_user_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let j in 0 .. MAX_BYTES;

        // Generate categories tree
        let (category_id, _) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        // Create thread
        let expiration_diff = 10u32.into();
        let poll = Some(
            generate_poll_input::<T>(expiration_diff, (<<<T as Trait>::MapLimits as StorageLimits>::MaxPollAlternativesNumber>::get() - 1) as u32)
        );
        let text = vec![1u8].repeat(MAX_BYTES as usize);

        let thread_id = create_new_thread::<T>(
            caller_id.clone(), forum_user_id.saturated_into(), category_id,
            text.clone(), text.clone(), poll
        );
        let post_id = add_thread_post::<T>(caller_id.clone(), forum_user_id.saturated_into(), category_id, thread_id, text);

        let mut thread = Module::<T>::thread_by_id(category_id, thread_id);

        let moderator_id = ModeratorId::<T>::from(forum_user_id.try_into().unwrap());

        // Set up category membership of moderator.
        Module::<T>::update_category_membership_of_moderator(
            RawOrigin::Signed(caller_id.clone()).into(), moderator_id, category_id, true
        ).unwrap();

        let rationale = vec![0u8].repeat(j as usize);

    }: moderate_post(RawOrigin::Signed(caller_id), PrivilegedActor::Moderator(moderator_id), category_id, thread_id, post_id, rationale.clone())
    verify {
        thread.number_of_posts -= 1;
        assert_eq!(Module::<T>::thread_by_id(category_id, thread_id), thread);

        assert!(!<PostById<T>>::contains_key(thread_id, post_id));

        assert_last_event::<T>(
            RawEvent::PostModerated(
                post_id,
                rationale,
                PrivilegedActor::Moderator(moderator_id),
                category_id,
                thread_id
            ).into()
        );
    }

    delete_posts {
        let forum_user_id = 0;
        let caller_id =
            insert_a_leader::<T>(forum_user_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let j in 0 .. MAX_BYTES;

        let k in 1 .. MAX_POSTS;

        // Generate categories tree
        let (category_id, _) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        // Create thread
        let expiration_diff = 10u32.into();
        let poll = Some(
            generate_poll_input::<T>(expiration_diff, (<<<T as Trait>::MapLimits as StorageLimits>::MaxPollAlternativesNumber>::get() - 1) as u32)
        );
        let text = vec![1u8].repeat(MAX_BYTES as usize);

        let thread_id = create_new_thread::<T>(
            caller_id.clone(), forum_user_id.saturated_into(), category_id,
            text.clone(), text.clone(), poll
        );
        let hide = false;
        let mut posts = BTreeMap::new();
        for _ in 0 .. k {
            posts.insert(
                ExtendedPostIdObject {
                    category_id,
                    thread_id,
                    post_id: add_thread_post::<T>(
                        caller_id.clone(),
                        forum_user_id.saturated_into(),
                        category_id,
                        thread_id,
                        vec![0u8],
                    ),
                },
                hide
            );
        }

        let post_id = add_thread_post::<T>(caller_id.clone(), forum_user_id.saturated_into(), category_id, thread_id, text);

        let mut thread = Module::<T>::thread_by_id(category_id, thread_id);

        let moderator_id = ModeratorId::<T>::from(forum_user_id.try_into().unwrap());

        // Set up category membership of moderator.
        Module::<T>::update_category_membership_of_moderator(
            RawOrigin::Signed(caller_id.clone()).into(), moderator_id, category_id, true
        ).unwrap();

        let rationale = vec![0u8].repeat(j as usize);

    }: _(
        RawOrigin::Signed(caller_id),
        forum_user_id.saturated_into(),
        posts.clone(),
        rationale.clone()
    )
    verify {
        thread.number_of_posts -= k as u64;
        assert_eq!(Module::<T>::thread_by_id(category_id, thread_id), thread);

        for (extended_post, _) in &posts {
            assert!(!<PostById<T>>::contains_key(extended_post.thread_id, extended_post.post_id));
        }

        assert_last_event::<T>(
            RawEvent::PostDeleted(
                rationale,
                forum_user_id.saturated_into(),
                posts,
            ).into()
        );
    }

    set_stickied_threads_lead {
        let forum_user_id = 0;
        let caller_id =
            insert_a_leader::<T>(forum_user_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let j in 0 .. MAX_THREADS;

        // Generate categories tree
        let (category_id, parent_category_id) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        // Create threads
        let expiration_diff = 1010u32.into();
        let poll = Some(
            generate_poll_input::<T>(expiration_diff, (<<<T as Trait>::MapLimits as StorageLimits>::MaxPollAlternativesNumber>::get() - 1) as u32)
        );
        let text = vec![1u8].repeat(MAX_BYTES as usize);

        let stickied_ids: Vec<T::ThreadId> = (0..j)
            .into_iter()
            .map(|_| create_new_thread::<T>(
                caller_id.clone(), forum_user_id.saturated_into(), category_id,
                text.clone(), text.clone(), poll.clone()
            )).collect();

        let mut category =  Module::<T>::category_by_id(category_id);

    }: set_stickied_threads(RawOrigin::Signed(caller_id), PrivilegedActor::Lead, category_id, stickied_ids.clone())
    verify {
        // Ensure category stickied_ids updated successfully.
        category.sticky_thread_ids = stickied_ids;
        assert_eq!(Module::<T>::category_by_id(category_id), category);

        assert_last_event::<T>(
            RawEvent::CategoryStickyThreadUpdate(
                category_id,
                category.sticky_thread_ids,
                PrivilegedActor::Lead
            ).into()
        );
    }

    set_stickied_threads_moderator {
        let forum_user_id = 0;
        let caller_id =
            insert_a_leader::<T>(forum_user_id);

        let i in 1 .. (T::MaxCategoryDepth::get() + 1) as u32;

        let j in 0 .. MAX_THREADS;

        // Generate categories tree
        let (category_id, parent_category_id) = generate_categories_tree::<T>(caller_id.clone(), i, None);

        // Create threads
        let expiration_diff = 1010u32.into();
        let poll = Some(
            generate_poll_input::<T>(expiration_diff, (<<<T as Trait>::MapLimits as StorageLimits>::MaxPollAlternativesNumber>::get() - 1) as u32)
        );
        let text = vec![1u8].repeat(MAX_BYTES as usize);

        let stickied_ids: Vec<T::ThreadId> = (0..j)
            .into_iter()
            .map(|_| create_new_thread::<T>(
                caller_id.clone(), forum_user_id.saturated_into(), category_id,
                text.clone(), text.clone(), poll.clone()
            )).collect();

        let moderator_id = ModeratorId::<T>::from(forum_user_id.try_into().unwrap());

        // Set up category membership of moderator.
        Module::<T>::update_category_membership_of_moderator(
            RawOrigin::Signed(caller_id.clone()).into(), moderator_id, category_id, true
        ).unwrap();

        let mut category =  Module::<T>::category_by_id(category_id);

    }: set_stickied_threads(RawOrigin::Signed(caller_id), PrivilegedActor::Moderator(moderator_id), category_id, stickied_ids.clone())
    verify {
        // Ensure category stickied_ids updated successfully.
        category.sticky_thread_ids = stickied_ids;
        assert_eq!(Module::<T>::category_by_id(category_id), category);

        assert_last_event::<T>(
            RawEvent::CategoryStickyThreadUpdate(
                category_id,
                category.sticky_thread_ids,
                PrivilegedActor::Moderator(moderator_id)
            ).into()
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mock::*;
    use frame_support::assert_ok;

    #[test]
    fn test_create_category() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_create_category::<Runtime>());
        });
    }

    #[test]
    fn test_update_category_membership_of_moderator_new() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_update_category_membership_of_moderator_new::<Runtime>());
        });
    }

    #[test]
    fn test_update_category_membership_of_moderator_old() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_update_category_membership_of_moderator_old::<Runtime>());
        });
    }

    #[test]
    fn test_update_category_archival_status_lead() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_update_category_archival_status_lead::<Runtime>());
        });
    }

    #[test]
    fn test_update_category_archival_status_moderator() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_update_category_archival_status_moderator::<
                Runtime,
            >());
        });
    }

    #[test]
    fn test_delete_category_lead() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_delete_category_lead::<Runtime>());
        });
    }

    #[test]
    fn test_delete_category_moderator() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_delete_category_moderator::<Runtime>());
        });
    }

    #[test]
    fn test_create_thread() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_create_thread::<Runtime>());
        });
    }

    #[test]
    fn test_edit_thread_metadata() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_edit_thread_metadata::<Runtime>());
        });
    }

    #[test]
    fn test_delete_thread() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_delete_thread::<Runtime>());
        });
    }

    #[test]
    fn test_move_thread_to_category_lead() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_move_thread_to_category_lead::<Runtime>());
        });
    }

    #[test]
    fn test_move_thread_to_category_moderator() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_move_thread_to_category_moderator::<Runtime>());
        });
    }

    #[test]
    fn test_vote_on_poll() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_vote_on_poll::<Runtime>());
        });
    }

    #[test]
    fn test_moderate_thread_lead() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_moderate_thread_lead::<Runtime>());
        });
    }

    #[test]
    fn test_moderate_thread_moderator() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_moderate_thread_moderator::<Runtime>());
        });
    }

    #[test]
    fn test_add_post() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_add_post::<Runtime>());
        });
    }

    #[test]
    fn test_react_post() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_react_post::<Runtime>());
        });
    }

    #[test]
    fn test_edit_post_text() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_edit_post_text::<Runtime>());
        });
    }

    #[test]
    fn test_moderate_post_lead() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_moderate_post_lead::<Runtime>());
        });
    }

    #[test]
    fn test_moderate_post_moderator() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_moderate_post_moderator::<Runtime>());
        });
    }

    #[test]
    fn test_set_stickied_threads_moderator() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_set_stickied_threads_moderator::<Runtime>());
        });
    }

    #[test]
    fn test_set_stickied_threads_lead() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_set_stickied_threads_lead::<Runtime>());
        });
    }

    #[test]
    fn test_update_category_title_lead() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_update_category_title_lead::<Runtime>());
        });
    }

    #[test]
    fn test_update_category_title_moderator() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_update_category_title_moderator::<Runtime>());
        });
    }

    #[test]
    fn test_update_category_description_lead() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_update_category_description_lead::<Runtime>());
        });
    }

    #[test]
    fn test_update_category_description_moderator() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_update_category_description_moderator::<
                Runtime,
            >());
        });
    }

    #[test]
    fn test_delete_posts() {
        with_test_externalities(|| {
            assert_ok!(test_benchmark_delete_posts::<Runtime>());
        });
    }
}
