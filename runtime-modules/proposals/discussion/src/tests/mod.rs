mod mock;

use frame_support::assert_noop;
use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_system::RawOrigin;
use frame_system::{EventRecord, Phase};

use crate::*;

pub(crate) use mock::Balances;
pub(crate) use mock::*;

struct EventFixture;
impl EventFixture {
    fn assert_events(expected_raw_events: Vec<RawEvent<u64, u64, u64>>) {
        let expected_events = expected_raw_events
            .iter()
            .map(|ev| EventRecord {
                phase: Phase::Initialization,
                event: mock::Event::Discussions(ev.clone()),
                topics: vec![],
            })
            .collect::<Vec<EventRecord<_, _>>>();

        let actual_events: Vec<_> = System::events()
            .into_iter()
            .filter(|e| match e.event {
                mock::Event::Discussions(..) => true,
                _ => false,
            })
            .collect();
        assert_eq!(actual_events, expected_events);
    }
}

#[allow(dead_code)]
struct TestPostEntry {
    post_id: u64,
    text: Vec<u8>,
    edition_number: u32,
}

#[allow(dead_code)]
struct TestThreadEntry {
    thread_id: u64,
    title: Vec<u8>,
}

fn assert_thread_content(thread_entry: TestThreadEntry, post_entries: Vec<TestPostEntry>) {
    assert!(<ThreadById<Test>>::contains_key(thread_entry.thread_id));

    let actual_thread = <ThreadById<Test>>::get(thread_entry.thread_id);
    let expected_thread = DiscussionThread {
        activated_at: 0,
        author_id: 1,
        mode: Default::default(),
    };
    assert_eq!(actual_thread, expected_thread);

    for post_entry in post_entries {
        let actual_post =
            <PostThreadIdByPostId<Test>>::get(thread_entry.thread_id, post_entry.post_id);
        let expected_post = DiscussionPost {
            author_id: 1,
            cleanup_pay_off: RepayableBloatBond::new(<Test as Config>::PostDeposit::get(), None),
            last_edited: frame_system::Pallet::<Test>::block_number(),
        };

        assert_eq!(actual_post, expected_post);
    }
}

#[allow(dead_code)]
struct DiscussionFixture {
    pub title: Vec<u8>,
    pub origin: RawOrigin<u64>,
    pub author_id: u64,
    pub mode: ThreadMode<u64>,
}

impl Default for DiscussionFixture {
    fn default() -> Self {
        DiscussionFixture {
            title: b"title".to_vec(),
            origin: RawOrigin::Signed(1),
            author_id: 1,
            mode: ThreadMode::Open,
        }
    }
}

impl DiscussionFixture {
    fn with_mode(self, mode: ThreadMode<u64>) -> Self {
        Self { mode, ..self }
    }

    fn create_discussion_and_assert(&self, result: Result<u64, DispatchError>) -> Option<u64> {
        let create_discussion_result =
            Discussions::create_thread(self.author_id, self.mode.clone());

        assert_eq!(create_discussion_result, result);

        create_discussion_result.ok()
    }
}

struct PostFixture {
    pub text: Vec<u8>,
    pub origin: RawOrigin<u128>,
    pub thread_id: u64,
    pub post_id: Option<u64>,
    pub author_id: u64,
    pub initial_balance: u64,
    pub account_id: u128,
    pub editable: bool,
}

impl PostFixture {
    fn default_for_thread(thread_id: u64) -> Self {
        PostFixture {
            text: b"text".to_vec(),
            author_id: 1,
            thread_id,
            origin: RawOrigin::Signed(1),
            post_id: None,
            initial_balance: ed() + <Test as Config>::PostDeposit::get(),
            account_id: 1,
            editable: true,
        }
    }

    fn with_account_id(self, account_id: u128) -> Self {
        PostFixture { account_id, ..self }
    }

    fn with_origin(self, origin: RawOrigin<u128>) -> Self {
        PostFixture { origin, ..self }
    }

    fn with_author(self, author_id: u64) -> Self {
        PostFixture { author_id, ..self }
    }

    fn with_editable(self, editable: bool) -> Self {
        PostFixture { editable, ..self }
    }

    fn change_thread_id(self, thread_id: u64) -> Self {
        PostFixture { thread_id, ..self }
    }

    fn change_post_id(self, post_id: u64) -> Self {
        PostFixture {
            post_id: Some(post_id),
            ..self
        }
    }

    fn with_initial_balance(self, initial_balance: u64) -> Self {
        PostFixture {
            initial_balance,
            ..self
        }
    }

    fn add_post_and_assert(&mut self, result: DispatchResult) -> Option<u64> {
        balances::Pallet::<Test>::make_free_balance_be(&self.account_id, self.initial_balance);
        let initial_balance = balances::Pallet::<Test>::usable_balance(&self.account_id);
        let add_post_result = Discussions::add_post(
            self.origin.clone().into(),
            self.author_id,
            self.thread_id,
            self.text.clone(),
            self.editable,
        );

        assert_eq!(add_post_result, result);

        if result.is_ok() {
            let post_id = <PostCount>::get();
            self.post_id = Some(post_id);
            if self.editable {
                assert!(<PostThreadIdByPostId<Test>>::contains_key(
                    self.thread_id,
                    post_id
                ));
                assert_eq!(
                    balances::Pallet::<Test>::usable_balance(&self.account_id),
                    initial_balance - <Test as Config>::PostDeposit::get()
                );
            } else {
                assert!(!<PostThreadIdByPostId<Test>>::contains_key(
                    self.thread_id,
                    post_id
                ));
            }
        }

        self.post_id
    }

    fn delete_post_and_assert(&mut self, result: DispatchResult) -> Option<u64> {
        let post =
            PostThreadIdByPostId::<Test>::get(self.thread_id, self.post_id.unwrap_or_default());
        let bloat_bond_reciever = post.cleanup_pay_off.get_recipient(&self.account_id);
        let bloat_bond_reciever_initial_balance =
            balances::Pallet::<Test>::free_balance(bloat_bond_reciever);
        let add_post_result = Discussions::delete_post(
            self.origin.clone().into(),
            self.author_id,
            self.post_id.unwrap(),
            self.thread_id,
            true,
        );

        assert_eq!(add_post_result, result);

        if result.is_ok() {
            assert_eq!(
                balances::Pallet::<Test>::free_balance(bloat_bond_reciever),
                bloat_bond_reciever_initial_balance + <Test as Config>::PostDeposit::get()
            );
            assert!(!<PostThreadIdByPostId<Test>>::contains_key(
                self.thread_id,
                self.post_id.unwrap()
            ));
        }

        self.post_id
    }

    fn update_post_with_text_and_assert(&mut self, new_text: Vec<u8>, result: DispatchResult) {
        let add_post_result = Discussions::update_post(
            self.origin.clone().into(),
            self.thread_id,
            self.post_id.unwrap(),
            new_text,
        );

        assert_eq!(add_post_result, result);
    }

    fn update_post_and_assert(&mut self, result: DispatchResult) {
        self.update_post_with_text_and_assert(self.text.clone(), result);
    }
}

#[test]
fn create_discussion_call_succeeds() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        discussion_fixture.create_discussion_and_assert(Ok(1));
    });
}

#[test]
fn create_post_call_succeeds_editable() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(thread_id).with_editable(true);

        post_fixture.add_post_and_assert(Ok(()));
    });
}

#[test]
fn delete_post_call_succeeds() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(thread_id).with_editable(true);

        post_fixture.add_post_and_assert(Ok(()));
        post_fixture.delete_post_and_assert(Ok(()));
    });
}

#[test]
fn delete_post_call_fails_with_invalid_user() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(thread_id).with_editable(true);

        post_fixture.add_post_and_assert(Ok(()));
        post_fixture
            .with_origin(RawOrigin::Signed(12))
            .with_author(13)
            .with_account_id(13)
            .delete_post_and_assert(Err(DispatchError::Other("Invalid author")));
    });
}

#[test]
fn delete_post_call_fails_with_incorrect_user() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(thread_id).with_editable(true);

        post_fixture.add_post_and_assert(Ok(()));
        post_fixture
            .with_origin(RawOrigin::Signed(10))
            .with_author(10)
            .with_account_id(10)
            .delete_post_and_assert(Err(Error::<Test>::CannotDeletePost.into()));
    });
}

#[test]
fn delete_post_call_fails_with_any_user_before_post_lifetime() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(thread_id).with_editable(true);

        post_fixture.add_post_and_assert(Ok(()));

        let current_block = frame_system::Pallet::<Test>::block_number();

        run_to_block(current_block + <Test as Config>::PostLifeTime::get());

        post_fixture
            .with_origin(RawOrigin::Signed(10))
            .with_author(10)
            .with_account_id(10)
            .delete_post_and_assert(Err(Error::<Test>::CannotDeletePost.into()));
    });
}

#[test]
fn delete_post_call_succeds_with_any_user_after_post_lifetime() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(thread_id).with_editable(true);

        post_fixture.add_post_and_assert(Ok(()));

        // Erasing manually to prevent circular dependency with proposal codex
        <ThreadById<Test>>::remove(thread_id);

        let current_block = frame_system::Pallet::<Test>::block_number();

        run_to_block(current_block + <Test as Config>::PostLifeTime::get());

        post_fixture
            .with_origin(RawOrigin::Signed(10))
            .with_author(10)
            .with_account_id(10)
            .delete_post_and_assert(Ok(()));
    });
}

#[test]
fn delete_post_call_succeds_with_bloat_bond_repaid_to_correct_account() {
    let creator_id: <Test as frame_system::Config>::AccountId = 1;
    let remover_id: <Test as frame_system::Config>::AccountId = 2;
    let post_deposit = <Test as Config>::PostDeposit::get();

    let test_cases = [
        (
            ed() + post_deposit, // locked balance
            creator_id,          // expected bloat bond reciever
        ),
        (
            ed() + 1,   // locked balance
            creator_id, // expected bloat bond reciever
        ),
        (
            ed(),       // locked balance
            remover_id, // expected bloat bond reciever
        ),
    ];

    for case in test_cases {
        let (locked_balance, bloat_bond_reciever) = case;
        initial_test_ext().execute_with(|| {
            let creator_balance = ed() + post_deposit;
            let _ = Balances::make_free_balance_be(&creator_id, creator_balance);
            let _ = Balances::make_free_balance_be(&remover_id, ed());
            set_invitation_lock(&creator_id, locked_balance);

            let discussion_fixture = DiscussionFixture::default();
            let thread_id = discussion_fixture
                .create_discussion_and_assert(Ok(1))
                .unwrap();

            Discussions::add_post(
                RawOrigin::Signed(creator_id).into(),
                creator_id as u64,
                thread_id,
                b"text".to_vec(),
                true,
            )
            .unwrap();
            let post_id = Discussions::post_count();

            // Remove the thread and skip PostLifeTime blocks to make the post
            // removeable by anyone
            <ThreadById<Test>>::remove(thread_id);
            let current_block = frame_system::Pallet::<Test>::block_number();
            run_to_block(current_block + <Test as Config>::PostLifeTime::get());

            // Delete the post as different user
            Discussions::delete_post(
                RawOrigin::Signed(remover_id).into(),
                remover_id as u64,
                post_id,
                thread_id,
                true,
            )
            .unwrap();

            // Make sure bloat bond was removed from module account
            let module_account_id = Discussions::module_account_id();
            assert_eq!(Balances::usable_balance(module_account_id), ed());
            // Make sure the correct account recieved the bloat bond
            assert_eq!(
                Balances::free_balance(bloat_bond_reciever),
                ed() + post_deposit
            );
        });
    }
}

#[test]
fn create_post_call_fails_editable_insufficient_funds() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(thread_id)
            .with_editable(true)
            .with_initial_balance(<Test as Config>::PostDeposit::get() - 1);

        post_fixture.add_post_and_assert(Err(Error::<Test>::InsufficientBalanceForPost.into()));
    });
}

#[test]
fn create_post_call_succeeds_non_editable() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(thread_id)
            .with_editable(false)
            .with_initial_balance(0);

        post_fixture.add_post_and_assert(Ok(()));
    });
}

struct ChangeThreadModeFixture {
    pub origin: RawOrigin<u128>,
    pub thread_id: u64,
    pub member_id: u64,
    pub mode: ThreadMode<u64>,
}

impl ChangeThreadModeFixture {
    fn default_for_thread_id(thread_id: u64) -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            thread_id,
            member_id: 1,
            mode: ThreadMode::Open,
        }
    }

    fn with_mode(self, mode: ThreadMode<u64>) -> Self {
        Self { mode, ..self }
    }

    fn with_member_id(self, member_id: u64) -> Self {
        Self { member_id, ..self }
    }

    fn with_origin(self, origin: RawOrigin<u128>) -> Self {
        Self { origin, ..self }
    }

    fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Discussions::change_thread_mode(
            self.origin.clone().into(),
            self.member_id,
            self.thread_id,
            self.mode.clone(),
        );

        assert_eq!(actual_result, expected_result);
    }
}

#[test]
fn update_post_call_succeeds() {
    initial_test_ext().execute_with(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(thread_id);

        post_fixture.add_post_and_assert(Ok(()));
        post_fixture.update_post_and_assert(Ok(()));

        EventFixture::assert_events(vec![
            RawEvent::ThreadCreated(1, 1),
            RawEvent::PostCreated(
                1,
                1,
                post_fixture.thread_id,
                post_fixture.text.clone(),
                post_fixture.editable,
            ),
            RawEvent::PostUpdated(1, 1, post_fixture.thread_id, post_fixture.text.clone()),
        ]);
    });
}

#[test]
fn update_post_call_fails_because_of_the_wrong_author() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(thread_id)
            .with_origin(RawOrigin::Signed(12))
            .with_account_id(12)
            .with_author(12);

        post_fixture.add_post_and_assert(Ok(()));

        post_fixture = post_fixture.with_origin(RawOrigin::Signed(5));

        post_fixture.update_post_and_assert(Err(DispatchError::Other("Invalid author")));
    });
}

#[test]
fn thread_content_check_succeeded() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture1 = PostFixture::default_for_thread(thread_id);
        let post_id1 = post_fixture1.add_post_and_assert(Ok(())).unwrap();

        let mut post_fixture2 = PostFixture::default_for_thread(thread_id);
        let post_id2 = post_fixture2.add_post_and_assert(Ok(())).unwrap();
        post_fixture1.update_post_with_text_and_assert(b"new_text".to_vec(), Ok(()));

        assert_thread_content(
            TestThreadEntry {
                thread_id,
                title: b"title".to_vec(),
            },
            vec![
                TestPostEntry {
                    post_id: post_id1,
                    text: b"new_text".to_vec(),
                    edition_number: 1,
                },
                TestPostEntry {
                    post_id: post_id2,
                    text: b"text".to_vec(),
                    edition_number: 0,
                },
            ],
        );
    });
}

#[test]
fn add_post_call_with_invalid_thread_failed() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();
        discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(2);
        post_fixture.add_post_and_assert(Err(Error::<Test>::ThreadDoesntExist.into()));
    });
}

#[test]
fn add_post_call_with_invitation_locked_funds_succeeded() {
    let user_id: <Test as frame_system::Config>::AccountId = 1;
    let post_deposit = <Test as Config>::PostDeposit::get();

    let test_cases = [
        (
            ed() + post_deposit, // locked balance
            Some(user_id),       // expected bloat bond `restricted_to` value
        ),
        (
            ed() + 1,      // locked balance
            Some(user_id), // expected bloat bond reciever
        ),
        (
            ed(), // locked balance
            None, // expected bloat bond reciever
        ),
    ];

    for case in test_cases {
        let (locked_balance, bloat_bond_restricted_to) = case;
        initial_test_ext().execute_with(|| {
            let user_balance = ed() + post_deposit;
            let _ = Balances::make_free_balance_be(&user_id, user_balance);
            set_invitation_lock(&user_id, locked_balance);

            let discussion_fixture = DiscussionFixture::default();
            let thread_id = discussion_fixture
                .create_discussion_and_assert(Ok(1))
                .unwrap();

            Discussions::add_post(
                RawOrigin::Signed(user_id).into(),
                user_id as u64,
                thread_id,
                b"text".to_vec(),
                true,
            )
            .unwrap();
            let post_id = Discussions::post_count();

            let module_account_id = Discussions::module_account_id();
            assert_eq!(
                Balances::usable_balance(module_account_id),
                ed() + <Test as Config>::PostDeposit::get()
            );
            assert_eq!(
                PostThreadIdByPostId::<Test>::get(thread_id, post_id).cleanup_pay_off,
                RepayableBloatBond::new(post_deposit, bloat_bond_restricted_to)
            );
            assert_eq!(
                System::account(user_id).data,
                balances::AccountData {
                    free: ed(),
                    reserved: 0,
                    misc_frozen: locked_balance,
                    fee_frozen: 0
                }
            )
        });
    }
}

#[test]
fn add_post_call_with_insufficient_locked_funds_fails() {
    initial_test_ext().execute_with(|| {
        let user_id: <Test as frame_system::Config>::AccountId = 1;

        let user_balance = ed() + <Test as Config>::PostDeposit::get() - 1;
        let _ = Balances::make_free_balance_be(&user_id, user_balance);
        set_invitation_lock(&user_id, user_balance);

        let discussion_fixture = DiscussionFixture::default();
        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        assert_noop!(
            Discussions::add_post(
                RawOrigin::Signed(user_id).into(),
                user_id as u64,
                thread_id,
                b"text".to_vec(),
                true,
            ),
            Error::<Test>::InsufficientBalanceForPost
        );

        // Increase balance by 1, but lock ED and those funds with another, not-allowed lock
        let _ = Balances::deposit_creating(&user_id, 1);
        set_staking_candidate_lock(&user_id, ed() + 1);

        assert_noop!(
            Discussions::add_post(
                RawOrigin::Signed(user_id).into(),
                user_id as u64,
                thread_id,
                b"text".to_vec(),
                true,
            ),
            Error::<Test>::InsufficientBalanceForPost
        );
    });
}

#[test]
fn add_post_call_with_incompatible_locked_funds_fails() {
    initial_test_ext().execute_with(|| {
        let user_id: <Test as frame_system::Config>::AccountId = 1;

        let user_balance = ed() + <Test as Config>::PostDeposit::get();
        let _ = Balances::make_free_balance_be(&user_id, user_balance);
        set_staking_candidate_lock(&user_id, user_balance);

        let discussion_fixture = DiscussionFixture::default();
        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        assert_noop!(
            Discussions::add_post(
                RawOrigin::Signed(user_id).into(),
                user_id as u64,
                thread_id,
                b"text".to_vec(),
                true,
            ),
            Error::<Test>::InsufficientBalanceForPost
        );
    });
}

#[test]
fn update_post_call_with_invalid_post_failed() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();
        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture1 = PostFixture::default_for_thread(thread_id);
        post_fixture1.add_post_and_assert(Ok(())).unwrap();

        let mut post_fixture2 = post_fixture1.change_post_id(2);
        post_fixture2.update_post_and_assert(Err(Error::<Test>::PostDoesntExist.into()));
    });
}

#[test]
fn update_post_call_with_invalid_thread_failed() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();
        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture1 = PostFixture::default_for_thread(thread_id);
        post_fixture1.add_post_and_assert(Ok(())).unwrap();

        let mut post_fixture2 = post_fixture1.change_thread_id(2);
        post_fixture2.update_post_and_assert(Err(Error::<Test>::ThreadDoesntExist.into()));
    });
}

#[test]
fn discussion_thread_and_post_counters_are_valid() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();
        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture1 = PostFixture::default_for_thread(thread_id);
        let _ = post_fixture1.add_post_and_assert(Ok(())).unwrap();

        assert_eq!(Discussions::thread_count(), 1);
        assert_eq!(Discussions::post_count(), 1);
    });
}

#[test]
fn change_thread_mode_succeeds() {
    initial_test_ext().execute_with(|| {
        /*
           Events are not emitted on block 0.
           So any dispatchable calls made during genesis block formation will have no events emitted.
           https://substrate.dev/recipes/2-appetizers/4-events.html
        */
        run_to_block(1);

        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let thread_mode = ThreadMode::Closed(vec![2, 3]);
        let change_thread_mode_fixture = ChangeThreadModeFixture::default_for_thread_id(thread_id)
            .with_mode(thread_mode.clone());
        change_thread_mode_fixture.call_and_assert(Ok(()));

        EventFixture::assert_events(vec![
            RawEvent::ThreadCreated(1, 1),
            RawEvent::ThreadModeChanged(1, thread_mode, change_thread_mode_fixture.member_id),
        ]);
    });
}

#[test]
fn change_mode_failed_with_invalid_origin() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let change_thread_mode_fixture = ChangeThreadModeFixture::default_for_thread_id(thread_id)
            .with_origin(RawOrigin::Root)
            .with_member_id(12);
        change_thread_mode_fixture.call_and_assert(Err(DispatchError::Other("Invalid author")));
    });
}

#[test]
fn change_mode_failed_with_invalid_thread_id() {
    initial_test_ext().execute_with(|| {
        let invalid_thread_id = 12;

        let change_thread_mode_fixture =
            ChangeThreadModeFixture::default_for_thread_id(invalid_thread_id);
        change_thread_mode_fixture.call_and_assert(Err(Error::<Test>::ThreadDoesntExist.into()));
    });
}

#[test]
fn change_mode_failed_with_not_thread_author_or_councilor() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let change_thread_mode_fixture = ChangeThreadModeFixture::default_for_thread_id(thread_id)
            .with_origin(RawOrigin::Signed(12))
            .with_member_id(12);
        change_thread_mode_fixture.call_and_assert(Err(Error::<Test>::NotAuthorOrCouncilor.into()));
    });
}

#[test]
fn change_thread_mode_succeeds_with_councilor() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let change_thread_mode_fixture = ChangeThreadModeFixture::default_for_thread_id(thread_id)
            .with_member_id(2)
            .with_origin(RawOrigin::Signed(2));
        change_thread_mode_fixture.call_and_assert(Ok(()));
    });
}

#[test]
fn create_post_call_succeeds_with_closed_mode_by_author() {
    initial_test_ext().execute_with(|| {
        let mode = ThreadMode::Closed(vec![2, 11]);
        let discussion_fixture = DiscussionFixture::default().with_mode(mode);

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(thread_id)
            .with_origin(RawOrigin::Signed(1))
            .with_author(1);

        post_fixture.add_post_and_assert(Ok(()));
    });
}

#[test]
fn create_post_call_succeeds_with_closed_mode_by_councilor() {
    initial_test_ext().execute_with(|| {
        let mode = ThreadMode::Closed(vec![2, 11]);
        let discussion_fixture = DiscussionFixture::default().with_mode(mode);

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(thread_id)
            .with_origin(RawOrigin::Signed(2))
            .with_account_id(2)
            .with_author(2);

        post_fixture.add_post_and_assert(Ok(()));
    });
}

#[test]
fn create_post_call_succeeds_with_closed_mode_by_white_listed_member() {
    initial_test_ext().execute_with(|| {
        let mode = ThreadMode::Closed(vec![2, 11]);
        let discussion_fixture = DiscussionFixture::default().with_mode(mode);

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(thread_id)
            .with_origin(RawOrigin::Signed(11))
            .with_account_id(11)
            .with_author(11);

        post_fixture.add_post_and_assert(Ok(()));
    });
}

#[test]
fn create_post_call_fails_with_closed_mode_by_not_allowed_member() {
    initial_test_ext().execute_with(|| {
        let mode = ThreadMode::Closed(vec![2, 10]);
        let discussion_fixture = DiscussionFixture::default().with_mode(mode);

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let mut post_fixture = PostFixture::default_for_thread(thread_id)
            .with_origin(RawOrigin::Signed(11))
            .with_author(11);

        post_fixture.add_post_and_assert(Err(Error::<Test>::CannotPostOnClosedThread.into()));
    });
}

#[test]
fn change_thread_mode_fails_with_exceeded_max_author_list_size() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let change_thread_mode_fixture = ChangeThreadModeFixture::default_for_thread_id(thread_id)
            .with_mode(ThreadMode::Closed(vec![2, 3, 4, 5, 6]));
        change_thread_mode_fixture
            .call_and_assert(Err(Error::<Test>::MaxWhiteListSizeExceeded.into()));
    });
}

#[test]
fn change_thread_mode_fails_with_invalid_whitelisted_member_id() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture = DiscussionFixture::default();

        let thread_id = discussion_fixture
            .create_discussion_and_assert(Ok(1))
            .unwrap();

        let change_thread_mode_fixture = ChangeThreadModeFixture::default_for_thread_id(thread_id)
            .with_mode(ThreadMode::Closed(vec![2, 3, 9999]));
        change_thread_mode_fixture
            .call_and_assert(Err(Error::<Test>::WhitelistedMemberDoesNotExist.into()));
    });
}

#[test]
fn create_discussion_call_fails_with_exceeded_max_author_list_size() {
    initial_test_ext().execute_with(|| {
        let discussion_fixture =
            DiscussionFixture::default().with_mode(ThreadMode::Closed(vec![2, 3, 4, 5, 6]));

        discussion_fixture
            .create_discussion_and_assert(Err(Error::<Test>::MaxWhiteListSizeExceeded.into()));
    });
}
