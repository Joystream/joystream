#![cfg(test)]

use frame_support::{
    impl_outer_event, impl_outer_origin, parameter_types,
    traits::{Currency, OnFinalize, OnInitialize},
};

use codec::Encode;
use common::membership::{MemberOriginValidator, MembershipInfoProvider};
use frame_support::ensure;
use frame_support::traits::LockIdentifier;
use frame_system::ensure_signed;
use sp_arithmetic::Perbill;
use sp_io::TestExternalities;
use sp_runtime::testing::{Header, H256};
use sp_runtime::traits::{BlakeTwo256, Convert, Hash, IdentityLookup};
use sp_runtime::{DispatchError, DispatchResult, ModuleId, Permill};
use staking_handler::LockComparator;

// crate import
use crate::{
    types::*, AccountDataOf, GenesisConfig, TokenDataOf, TokenIssuanceParametersOf, Trait,
    TransferPolicyOf,
};

// Crate aliases
pub type TokenId = <Test as Trait>::TokenId;
pub type TokenData = TokenDataOf<Test>;
pub type UploadContext = UploadContextOf<Test>;
pub type SingleDataObjectUploadParams = SingleDataObjectUploadParamsOf<Test>;
pub type WhitelistParams = WhitelistParamsOf<Test>;
pub type TokenSaleParams = TokenSaleParamsOf<Test>;
pub type TokenSale = TokenSaleOf<Test>;
pub type IssuanceParams = TokenIssuanceParametersOf<Test>;
pub type VestingScheduleParams = VestingScheduleParamsOf<Test>;
pub type IssuanceState = OfferingStateOf<Test>;
pub type TransferPolicyParams = TransferPolicyParamsOf<Test>;
pub type AccountData = AccountDataOf<Test>;
pub type AccountId = <Test as frame_system::Trait>::AccountId;
pub type BlockNumber = <Test as frame_system::Trait>::BlockNumber;
pub type Balance = TokenBalanceOf<Test>;
pub type JoyBalance = JoyBalanceOf<Test>;
pub type Policy = TransferPolicyOf<Test>;
pub type Hashing = <Test as frame_system::Trait>::Hashing;
pub type HashOut = <Test as frame_system::Trait>::Hash;
pub type VestingSchedule = VestingScheduleOf<Test>;
pub type MemberId = u64;
pub type CollectiveFlip = randomness_collective_flip::Module<Test>;

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;

impl_outer_origin! {
    pub enum Origin for Test {}
}

mod token {
    pub use crate::Event;
}

#[macro_export]
macro_rules! last_event_eq {
    ($e:expr) => {
        assert_eq!(System::events().last().unwrap().event, TestEvent::token($e));
    };
}

#[macro_export]
macro_rules! origin {
    ($a: expr) => {
        Origin::signed($a)
    };
}

impl_outer_event! {
    pub enum TestEvent for Test {
        token<T>,
        frame_system<T>,
        balances<T>,
        storage<T>,
        membership<T>,
    }
}

// Trait constants
parameter_types! {
    // --------- frame_system::Trait parameters ---------------------
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
    // --------- Pallet Project Token parameters ---------------------
    pub const TokenModuleId: ModuleId = ModuleId(*b"m__Token");
    pub const MaxVestingBalancesPerAccountPerToken: u8 = 3;
    pub const BlocksPerYear: u32 = 5259487; // blocks every 6s
    pub const MinRevenueSplitDuration: u64 = 10;
    pub const MinSaleDuration: u32 = 10;
    // --------- balances::Trait parameters ---------------------------
    pub const ExistentialDeposit: u128 = 10;
    // constants for storage::Trait
    pub const MaxNumberOfDataObjectsPerBag: u64 = 4;
    pub const MaxDistributionBucketFamilyNumber: u64 = 4;
    // FIXME: Currently this must be >= ExistentialDeposit (see: https://github.com/Joystream/joystream/issues/3510)
    // When trying to deposit an amount < ExistentialDeposit into storage module account, we'd get:
    // Err(DispatchError::Module { index: 0, error: 4, message: Some("ExistentialDeposit") })
    pub const DataObjectDeletionPrize: u64 = 15;
    pub const StorageModuleId: ModuleId = ModuleId(*b"mstorage"); // module storage
    pub const BlacklistSizeLimit: u64 = 1;
    pub const MaxNumberOfPendingInvitationsPerDistributionBucket: u64 = 1;
    pub const StorageBucketsPerBagValueConstraint: storage::StorageBucketsPerBagValueConstraint =
        storage::StorageBucketsPerBagValueConstraint {min: 3, max_min_diff: 7};
    pub const InitialStorageBucketsNumberForDynamicBag: u64 = 3;
    pub const MaxRandomIterationNumber: u64 = 3;
    pub const DefaultMemberDynamicBagNumberOfStorageBuckets: u64 = 3;
    pub const DefaultChannelDynamicBagNumberOfStorageBuckets: u64 = 4;
    pub const DistributionBucketsPerBagValueConstraint: storage::DistributionBucketsPerBagValueConstraint =
    storage::StorageBucketsPerBagValueConstraint {min: 3, max_min_diff: 7};
    pub const MaxDataObjectSize: u64 = 1_000_000_000;
    // constants for membership::Trait
    pub const DefaultMembershipPrice: u64 = 100;
    pub const InvitedMemberLockId: [u8; 8] = [2; 8];
    pub const StakingCandidateLockId: [u8; 8] = [3; 8];
    pub const CandidateStake: u64 = 100;
    pub const DefaultInitialInvitationBalance: u64 = 100;
    pub const ReferralCutMaximumPercent: u8 = 50;
}

impl frame_system::Trait for Test {
    type BaseCallFilter = ();
    type Origin = Origin;
    type Call = ();
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = TestEvent;
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type DbWeight = ();
    type BlockExecutionWeight = ();
    type ExtrinsicBaseWeight = ();
    type MaximumExtrinsicWeight = ();
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
    type AccountData = balances::AccountData<u128>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type PalletInfo = ();
    type SystemWeightInfo = ();
}

impl storage::Trait for Test {
    type Event = TestEvent;
    type DataObjectId = u64;
    type StorageBucketId = u64;
    type DistributionBucketIndex = u64;
    type DistributionBucketFamilyId = u64;
    type DistributionBucketOperatorId = u64;
    type ChannelId = u64;
    type BlacklistSizeLimit = BlacklistSizeLimit;
    type ModuleId = StorageModuleId;
    type StorageBucketsPerBagValueConstraint = StorageBucketsPerBagValueConstraint;
    type DefaultMemberDynamicBagNumberOfStorageBuckets =
        DefaultMemberDynamicBagNumberOfStorageBuckets;
    type DefaultChannelDynamicBagNumberOfStorageBuckets =
        DefaultChannelDynamicBagNumberOfStorageBuckets;
    type MaxDistributionBucketFamilyNumber = MaxDistributionBucketFamilyNumber;
    type DistributionBucketsPerBagValueConstraint = DistributionBucketsPerBagValueConstraint;
    type MaxNumberOfPendingInvitationsPerDistributionBucket =
        MaxNumberOfPendingInvitationsPerDistributionBucket;
    type ContentId = u64;
    type MaxDataObjectSize = MaxDataObjectSize;

    type StorageWorkingGroup = StorageWG;
    type DistributionWorkingGroup = DistributionWG;
    type MaxRandomIterationNumber = MaxRandomIterationNumber;
    type DataObjectDeletionPrize = DataObjectDeletionPrize;
    type Randomness = CollectiveFlip;
}

impl common::MembershipTypes for Test {
    type MemberId = u64;
    type ActorId = u64;
}

impl Trait for Test {
    type Event = TestEvent;
    type Balance = u128;
    type TokenId = u64;
    type BlockNumberToBalance = Block2Balance;
    type DataObjectStorage = storage::Module<Self>;
    type ModuleId = TokenModuleId;
    type JoyExistentialDeposit = ExistentialDeposit;
    type MaxVestingBalancesPerAccountPerToken = MaxVestingBalancesPerAccountPerToken;
    type BlocksPerYear = BlocksPerYear;
    type MemberOriginValidator = TestMemberships;
    type MembershipInfoProvider = TestMemberships;
    type MinRevenueSplitDuration = MinRevenueSplitDuration;
}

// Working group integration
pub struct StorageWG;
pub struct DistributionWG;

impl common::working_group::WorkingGroupBudgetHandler<u64, u128> for StorageWG {
    fn get_budget() -> u128 {
        unimplemented!()
    }

    fn set_budget(_new_value: u128) {
        unimplemented!()
    }

    fn try_withdraw(_account_id: &u64, _amount: u128) -> DispatchResult {
        unimplemented!()
    }
}

impl common::working_group::WorkingGroupBudgetHandler<u64, u128> for DistributionWG {
    fn get_budget() -> u128 {
        unimplemented!()
    }

    fn set_budget(_new_value: u128) {
        unimplemented!()
    }

    fn try_withdraw(_account_id: &u64, _amount: u128) -> DispatchResult {
        unimplemented!()
    }
}

impl common::working_group::WorkingGroupAuthenticator<Test> for StorageWG {
    fn ensure_worker_origin(
        origin: <Test as frame_system::Trait>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        let account_id = ensure_signed(origin)?;
        ensure!(
            account_id == DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID,
            DispatchError::BadOrigin,
        );
        Ok(())
    }

    fn ensure_leader_origin(origin: <Test as frame_system::Trait>::Origin) -> DispatchResult {
        let account_id = ensure_signed(origin)?;
        ensure!(
            account_id == STORAGE_WG_LEADER_ACCOUNT_ID,
            DispatchError::BadOrigin,
        );
        Ok(())
    }

    fn get_leader_member_id() -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn get_worker_member_id(
        _: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Trait>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Trait>::AccountId,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        unimplemented!()
    }

    fn worker_exists(worker_id: &<Test as common::membership::MembershipTypes>::ActorId) -> bool {
        Self::ensure_worker_exists(worker_id).is_ok()
    }

    fn ensure_worker_exists(
        worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        let allowed_storage_providers = vec![DEFAULT_STORAGE_PROVIDER_ID];
        ensure!(
            allowed_storage_providers.contains(worker_id),
            DispatchError::Other("Invailid worker"),
        );
        Ok(())
    }
}

impl common::working_group::WorkingGroupAuthenticator<Test> for DistributionWG {
    fn ensure_worker_origin(
        origin: <Test as frame_system::Trait>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        let account_id = ensure_signed(origin)?;
        ensure!(
            account_id == DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID,
            DispatchError::BadOrigin,
        );
        Ok(())
    }

    fn ensure_leader_origin(origin: <Test as frame_system::Trait>::Origin) -> DispatchResult {
        let account_id = ensure_signed(origin)?;
        ensure!(
            account_id == DISTRIBUTION_WG_LEADER_ACCOUNT_ID,
            DispatchError::BadOrigin,
        );
        Ok(())
    }

    fn get_leader_member_id() -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn get_worker_member_id(
        _: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Trait>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Trait>::AccountId,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        unimplemented!()
    }

    fn worker_exists(worker_id: &<Test as common::membership::MembershipTypes>::ActorId) -> bool {
        Self::ensure_worker_exists(worker_id).is_ok()
    }

    fn ensure_worker_exists(
        worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        let allowed_storage_providers = vec![DEFAULT_DISTRIBUTION_PROVIDER_ID];
        ensure!(
            allowed_storage_providers.contains(worker_id),
            DispatchError::Other("Invailid worker"),
        );
        Ok(())
    }
}

/// Implement pallet balances trait for Test
impl balances::Trait for Test {
    type Balance = u128;
    type DustRemoval = ();
    type Event = TestEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = ();
    type MaxLocks = ();
}

/// Implement pallet_timestamp trait for Test
impl pallet_timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

/// Implement membership trait for Test
impl membership::Trait for Test {
    type Event = TestEvent;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type WorkingGroup = Wg;
    type DefaultInitialInvitationBalance = DefaultInitialInvitationBalance;
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InvitedMemberLockId>;
    type StakingCandidateStakingHandler =
        staking_handler::StakingManager<Self, StakingCandidateLockId>;
    type CandidateStake = CandidateStake;
    type WeightInfo = ();
}

impl LockComparator<u128> for Test {
    fn are_locks_conflicting(new_lock: &LockIdentifier, existing_locks: &[LockIdentifier]) -> bool {
        if *new_lock == InvitedMemberLockId::get() {
            existing_locks.contains(new_lock)
        } else {
            false
        }
    }
}

pub struct Wg;
impl common::working_group::WorkingGroupBudgetHandler<u64, u128> for Wg {
    fn get_budget() -> u128 {
        unimplemented!()
    }

    fn set_budget(_new_value: u128) {
        unimplemented!()
    }

    fn try_withdraw(_account_id: &u64, _amount: u128) -> DispatchResult {
        unimplemented!()
    }
}

impl common::working_group::WorkingGroupAuthenticator<Test> for Wg {
    fn ensure_worker_origin(
        _origin: <Test as frame_system::Trait>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!()
    }

    fn ensure_leader_origin(_origin: <Test as frame_system::Trait>::Origin) -> DispatchResult {
        unimplemented!()
    }

    fn get_leader_member_id() -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn get_worker_member_id(
        _: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Trait>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Trait>::AccountId,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        unimplemented!()
    }

    fn worker_exists(_worker_id: &<Test as common::membership::MembershipTypes>::ActorId) -> bool {
        unimplemented!();
    }

    fn ensure_worker_exists(
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!();
    }
}

pub struct TestMemberships {}

// Mock MembershipInfoProvider impl
impl MembershipInfoProvider<Test> for TestMemberships {
    fn controller_account_id(
        member_id: common::MemberId<Test>,
    ) -> Result<AccountId, DispatchError> {
        if member_id < 1000 {
            return Ok(member_id + 1000);
        }

        Err(DispatchError::Other("no account found"))
    }
}

// Mock MemberOriginValidator impl
impl MemberOriginValidator<Origin, u64, u64> for TestMemberships {
    fn ensure_member_controller_account_origin(
        origin: Origin,
        member_id: u64,
    ) -> Result<u64, DispatchError> {
        let sender = ensure_signed(origin)?;
        ensure!(
            Self::is_member_controller_account(&member_id, &sender),
            DispatchError::Other("origin signer not a member controller account"),
        );
        Ok(sender)
    }

    fn is_member_controller_account(member_id: &u64, account_id: &u64) -> bool {
        *member_id < 1000 && *account_id == 1000 + *member_id
    }
}

/// Genesis config builder
pub struct GenesisConfigBuilder {
    pub(crate) account_info_by_token_and_member: Vec<(TokenId, MemberId, AccountData)>,
    pub(crate) token_info_by_id: Vec<(TokenId, TokenData)>,
    pub(crate) next_token_id: TokenId,
    pub(crate) bloat_bond: JoyBalance,
    pub(crate) symbol_used: Vec<(HashOut, ())>,
    pub(crate) min_sale_duration: BlockNumber,
    pub(crate) min_revenue_split_duration: BlockNumber,
    pub(crate) min_revenue_split_time_to_start: BlockNumber,
    pub(crate) sale_platform_fee: Permill,
}

/// test externalities + initial balances allocation
pub fn build_test_externalities_with_balances(
    config: GenesisConfig<Test>,
    balances: Vec<(AccountId, Balance)>,
) -> TestExternalities {
    let mut t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    config.assimilate_storage(&mut t).unwrap();

    balances::GenesisConfig::<Test> { balances }
        .assimilate_storage(&mut t)
        .unwrap();

    let mut test_scenario = Into::<sp_io::TestExternalities>::into(t.clone());

    // Make sure we are not in block 1 where no events are emitted
    test_scenario.execute_with(|| increase_block_number_by(1));

    test_scenario
}

/// test externalities
pub fn build_test_externalities(config: GenesisConfig<Test>) -> TestExternalities {
    build_test_externalities_with_balances(config, vec![])
}

/// test externalities with empty Chain State and specified balance allocation
pub fn build_default_test_externalities_with_balances(
    balances: Vec<(AccountId, Balance)>,
) -> TestExternalities {
    build_test_externalities_with_balances(GenesisConfigBuilder::new_empty().build(), balances)
}

/// Moving past n blocks
pub fn increase_block_number_by(n: u64) {
    let init_block = System::block_number();
    (0..=n).for_each(|offset| {
        <Token as OnFinalize<u64>>::on_finalize(System::block_number());
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(init_block.saturating_add(offset));
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <Token as OnInitialize<u64>>::on_initialize(System::block_number());
    })
}

// helper macros

#[macro_export]
macro_rules! member {
    ($id:expr) => {
        (
            MemberId::from($id as u64),
            AccountId::from($id as u64 + 1000),
        )
    };
}

#[macro_export]
macro_rules! account {
    ($acc:expr) => {
        AccountId::from($acc as u64)
    };
}

#[macro_export]
macro_rules! token {
    ($id:expr) => {
        TokenId::from($id as u64)
    };
}

#[macro_export]
macro_rules! balance {
    ($bal:expr) => {
        Balance::from($bal as u128)
    };
}

#[macro_export]
macro_rules! rate {
    ($r:expr) => {
        BlockRate(Perquintill::from_percent($r))
    };
}

#[macro_export]
macro_rules! yearly_rate {
    ($r:expr) => {
        YearlyRate(Permill::from_percent($r))
    };
}

#[macro_export]
macro_rules! joy {
    ($bal:expr) => {
        JoyBalance::from($bal as u128)
    };
}

#[macro_export]
macro_rules! block {
    ($b:expr) => {
        BlockNumber::from($b as u32)
    };
}

// Modules aliases
pub type Token = crate::Module<Test>;
pub type System = frame_system::Module<Test>;
pub type Balances = balances::Module<Test>;

// ------ General constants ---------------
pub const DEFAULT_BLOAT_BOND: u128 = 0;
pub const DEFAULT_INITIAL_ISSUANCE: u128 = 1_000_000;
pub const MIN_REVENUE_SPLIT_DURATION: u64 = 10;
pub const MIN_REVENUE_SPLIT_TIME_TO_START: u64 = 10;

// ------ Sale Constants ---------------------
pub const DEFAULT_SALE_UNIT_PRICE: u128 = 10;
pub const DEFAULT_SALE_DURATION: u64 = 100;

// ------ Revenue Split constants ------------
pub const DEFAULT_SALE_PURCHASE_AMOUNT: u128 = 1000;
pub const DEFAULT_SPLIT_ALLOCATION: u128 = 1000;
pub const DEFAULT_SPLIT_DURATION: u64 = 100;
pub const DEFAULT_SPLIT_PARTICIPATION: u128 = 100_000;
pub const DEFAULT_SPLIT_JOY_DIVIDEND: u128 = 100; // (participation / issuance) * allocation

// ------ Storage Constants ------------------
pub const STORAGE_WG_LEADER_ACCOUNT_ID: u64 = 100001;
pub const DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID: u64 = 100002;
pub const DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID: u64 = 100003;
pub const DISTRIBUTION_WG_LEADER_ACCOUNT_ID: u64 = 100004;
pub const DEFAULT_STORAGE_PROVIDER_ID: u64 = 10;
pub const DEFAULT_DISTRIBUTION_PROVIDER_ID: u64 = 12;

// Merkle tree Helpers
#[derive(Debug)]
pub(crate) struct IndexItem {
    index: usize,
    side: MerkleSide,
}

pub(crate) fn index_path_helper(len: usize, index: usize) -> Vec<IndexItem> {
    // used as a helper function to generate the correct sequence of indexes used to
    // construct the merkle path necessary for membership proof
    let mut idx = index;
    assert!(idx > 0); // index starting at 1
    let floor_2 = |x: usize| (x >> 1) + (x % 2);
    let mut path = Vec::new();
    let mut prev_len: usize = 0;
    let mut el = len;
    while el != 1 {
        if idx % 2 == 1 && idx == el {
            path.push(IndexItem {
                index: prev_len + idx,
                side: MerkleSide::Left,
            });
        } else {
            match idx % 2 {
                1 => path.push(IndexItem {
                    index: prev_len + idx + 1,
                    side: MerkleSide::Right,
                }),
                _ => path.push(IndexItem {
                    index: prev_len + idx - 1,
                    side: MerkleSide::Left,
                }),
            };
        }
        prev_len += el;
        idx = floor_2(idx);
        el = floor_2(el);
    }
    return path;
}

pub(crate) fn generate_merkle_root_helper<E: Encode>(
    collection: &[E],
) -> Vec<<Test as frame_system::Trait>::Hash> {
    // generates merkle root from the ordered sequence collection.
    // The resulting vector is structured as follows: elements in range
    // [0..collection.len()) will be the tree leaves (layer 0), elements in range
    // [collection.len()..collection.len()/2) will be the nodes in the next to last layer (layer 1)
    // [layer_n_length..layer_n_length/2) will be the number of nodes in layer(n+1)
    assert!(!collection.is_empty());
    let mut out = Vec::new();
    for e in collection.iter() {
        out.push(Hashing::hash(&e.encode()));
    }

    let mut start: usize = 0;
    let mut last_len = out.len();
    //let mut new_len = out.len();
    let mut max_len = last_len >> 1;
    let mut rem = last_len % 2;

    // range [last..(maxlen >> 1) + (maxlen % 2)]
    while max_len != 0 {
        last_len = out.len();
        for i in 0..max_len {
            out.push(Hashing::hash(
                &[out[start + 2 * i], out[start + 2 * i + 1]].encode(),
            ));
        }
        if rem == 1 {
            out.push(Hashing::hash(
                &[out[last_len - 1], out[last_len - 1]].encode(),
            ));
        }
        let new_len: usize = out.len() - last_len;
        rem = new_len % 2;
        max_len = new_len >> 1;
        start = last_len;
    }
    out
}

/// Generates merkle proof (Hash, Side) for element collection[index_for_proof]
pub(crate) fn build_merkle_path_helper<E: Encode + Clone>(
    collection: &[E],
    index_for_proof: usize,
) -> Vec<(<Test as frame_system::Trait>::Hash, MerkleSide)> {
    let merkle_tree = generate_merkle_root_helper(collection);
    // builds the actual merkle path with the hashes needed for the proof
    let index_path = index_path_helper(collection.len(), index_for_proof + 1);
    index_path
        .iter()
        .map(|idx_item| (merkle_tree[idx_item.index - 1], idx_item.side))
        .collect()
}

#[macro_export]
macro_rules! merkle_root {
    [$($vals:expr),*] => {
        generate_merkle_root_helper(&vec![$($vals,)*]).pop().unwrap()
    };
}

#[macro_export]
macro_rules! merkle_proof {
    ($idx:expr,[$($vals:expr),*]) => {
        MerkleProofOf::<Test>::new(build_merkle_path_helper(&vec![$($vals,)*], $idx as usize))
    };
}

#[macro_export]
#[cfg(feature = "std")]
macro_rules! assert_approx_eq {
    ($x: expr, $y: expr, $eps: expr) => {
        let abs_diff = $x.max($y).saturating_sub($x.min($y));
        assert!(abs_diff < $eps)
    };
}

// utility types
pub struct Block2Balance {}

impl Convert<BlockNumber, Balance> for Block2Balance {
    fn convert(block: BlockNumber) -> Balance {
        block as u128
    }
}

pub fn increase_account_balance(account_id: &AccountId, balance: Balance) {
    let _ = Balances::deposit_creating(account_id, balance);
}
