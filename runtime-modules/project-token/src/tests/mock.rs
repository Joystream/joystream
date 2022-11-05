#![cfg(test)]

use frame_support::{
    parameter_types,
    traits::{Currency, OnFinalize, OnInitialize},
};

use common::locks::{BoundStakingAccountLockId, InvitedMemberLockId};
use common::membership::{MemberOriginValidator, MembershipInfoProvider};
use frame_support::{
    ensure,
    traits::{ConstU16, ConstU32, ConstU64, LockIdentifier, WithdrawReasons},
    PalletId,
};
use frame_system::ensure_signed;
use sp_arithmetic::Perbill;
use sp_io::TestExternalities;
use sp_runtime::testing::{Header, H256};
use sp_runtime::traits::{BlakeTwo256, Convert, IdentityLookup};
use sp_runtime::{DispatchError, DispatchResult, Permill};
use sp_std::convert::{TryFrom, TryInto};
use staking_handler::{LockComparator, StakingHandler};

// crate import
pub(crate) use crate::utils::{build_merkle_path_helper, generate_merkle_root_helper};
use crate::{
    types::*, AccountDataOf, Config, TokenDataOf, TokenIssuanceParametersOf, TransferPolicyOf,
};

use crate as token;

// Crate aliases
pub type TokenId = <Test as Config>::TokenId;
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
pub type ConfigAccountData = ConfigAccountDataOf<Test>;
pub type AccountId = <Test as frame_system::Config>::AccountId;
pub type BlockNumber = <Test as frame_system::Config>::BlockNumber;
pub type Balance = TokenBalanceOf<Test>;
pub type JoyBalance = JoyBalanceOf<Test>;
pub type Policy = TransferPolicyOf<Test>;
pub type Hashing = <Test as frame_system::Config>::Hashing;
pub type HashOut = <Test as frame_system::Config>::Hash;
pub type VestingSchedule = VestingScheduleOf<Test>;
pub type Moment = <Test as pallet_timestamp::Config>::Moment;
pub type MemberId = u64;

#[macro_export]
macro_rules! last_event_eq {
    ($e:expr) => {
        assert_eq!(System::events().last().unwrap().event, Event::Token($e))
    };
}

#[macro_export]
macro_rules! origin {
    ($a: expr) => {
        Origin::signed($a)
    };
}

// Config constants
parameter_types! {
    // --------- frame_system::Config parameters ---------------------
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
    // --------- Pallet Project Token parameters ---------------------
    pub const TokenModuleId: PalletId = PalletId(*b"m__Token");
    pub const MaxVestingSchedulesPerAccountPerToken: u32 = 3;
    pub const BlocksPerYear: u32 = 5259487; // blocks every 6s
    // --------- balances::Config parameters ---------------------------
    pub const ExistentialDeposit: u128 = 10;
    // constants for storage::Config
    pub const MaxNumberOfDataObjectsPerBag: u64 = 4;
    pub const MaxDistributionBucketFamilyNumber: u64 = 4;
    pub const DataObjectDeletionPrize: u64 = 15;
    pub const StorageModuleId: PalletId = PalletId(*b"mstorage"); // module storage
    pub const BlacklistSizeLimit: u64 = 1;
    pub const MaxNumberOfPendingInvitationsPerDistributionBucket: u32 = 1;
    pub const InitialStorageBucketsNumberForDynamicBag: u64 = 3;
    pub const MaxRandomIterationNumber: u64 = 3;
    pub const DefaultMemberDynamicBagNumberOfStorageBuckets: u32 = 3;
    pub const DefaultChannelDynamicBagNumberOfStorageBuckets: u32 = 4;
    pub const MaxDataObjectSize: u64 = 1_000_000_000;
    pub const MinStorageBucketsPerBag: u32 = 3;
    pub const MaxStorageBucketsPerBag: u32 = 10;
    pub const MinDistributionBucketsPerBag: u32 = 3;
    pub const MaxDistributionBucketsPerBag: u32 = 10;
    pub const MaxNumberOfOperatorsPerDistributionBucket: u32 = 5;
    // constants for membership::Config
    pub const DefaultMembershipPrice: u64 = 100;
    pub const CandidateStake: u64 = 100;
    pub const DefaultInitialInvitationBalance: u64 = 100;
    pub const DefaultMemberInvitesCount: u32 = 2;
    pub const ReferralCutMaximumPercent: u8 = 50;
}

type UncheckedExtrinsic = frame_system::mocking::MockUncheckedExtrinsic<Test>;
type Block = frame_system::mocking::MockBlock<Test>;

frame_support::construct_runtime!(
    pub enum Test where
        Block = Block,
        NodeBlock = Block,
        UncheckedExtrinsic = UncheckedExtrinsic,
    {
        System: frame_system,
        Balances: balances,
        Timestamp: pallet_timestamp,
        Membership: membership::{Pallet, Call, Storage, Event<T>},
        Storage: storage::{Pallet, Call, Storage, Event<T>},
        Token: token::{Pallet, Call, Storage, Config<T>, Event<T>},
    }
);

impl storage::Config for Test {
    type Event = Event;
    type DataObjectId = u64;
    type StorageBucketId = u64;
    type DistributionBucketIndex = u64;
    type DistributionBucketFamilyId = u64;
    type DistributionBucketOperatorId = u64;
    type ChannelId = u64;
    type BlacklistSizeLimit = BlacklistSizeLimit;
    type ModuleId = StorageModuleId;
    type MinStorageBucketsPerBag = MinStorageBucketsPerBag;
    type MaxStorageBucketsPerBag = MaxStorageBucketsPerBag;
    type MinDistributionBucketsPerBag = MinDistributionBucketsPerBag;
    type MaxDistributionBucketsPerBag = MaxDistributionBucketsPerBag;
    type DefaultMemberDynamicBagNumberOfStorageBuckets =
        DefaultMemberDynamicBagNumberOfStorageBuckets;
    type DefaultChannelDynamicBagNumberOfStorageBuckets =
        DefaultChannelDynamicBagNumberOfStorageBuckets;
    type MaxDistributionBucketFamilyNumber = MaxDistributionBucketFamilyNumber;
    type MaxNumberOfPendingInvitationsPerDistributionBucket =
        MaxNumberOfPendingInvitationsPerDistributionBucket;
    type MaxNumberOfOperatorsPerDistributionBucket = MaxNumberOfOperatorsPerDistributionBucket;
    type ContentId = u64;
    type MaxDataObjectSize = MaxDataObjectSize;
    type StorageWorkingGroup = StorageWG;
    type DistributionWorkingGroup = DistributionWG;
    type ModuleAccountInitialBalance = ExistentialDeposit;
    type WeightInfo = ();
}

impl common::MembershipTypes for Test {
    type MemberId = u64;
    type ActorId = u64;
}

impl Config for Test {
    type Event = Event;
    type Balance = u128;
    type TokenId = u64;
    type BlockNumberToBalance = Block2Balance;
    type DataObjectStorage = storage::Module<Self>;
    type ModuleId = TokenModuleId;
    type JoyExistentialDeposit = ExistentialDeposit;
    type MaxVestingSchedulesPerAccountPerToken = MaxVestingSchedulesPerAccountPerToken;
    type BlocksPerYear = BlocksPerYear;
    type WeightInfo = ();
    type MemberOriginValidator = TestMemberships;
    type MembershipInfoProvider = TestMemberships;
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
        origin: <Test as frame_system::Config>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        let account_id = ensure_signed(origin)?;
        ensure!(
            account_id == DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID,
            DispatchError::BadOrigin,
        );
        Ok(())
    }

    fn ensure_leader_origin(origin: <Test as frame_system::Config>::Origin) -> DispatchResult {
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

    fn is_leader_account_id(_account_id: &<Test as frame_system::Config>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Config>::AccountId,
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
        origin: <Test as frame_system::Config>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        let account_id = ensure_signed(origin)?;
        ensure!(
            account_id == DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID,
            DispatchError::BadOrigin,
        );
        Ok(())
    }

    fn ensure_leader_origin(origin: <Test as frame_system::Config>::Origin) -> DispatchResult {
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

    fn is_leader_account_id(_account_id: &<Test as frame_system::Config>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Config>::AccountId,
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

impl frame_system::Config for Test {
    type BaseCallFilter = frame_support::traits::Everything;
    type BlockWeights = ();
    type BlockLength = ();
    type DbWeight = ();
    type Origin = Origin;
    type Call = Call;
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = Event;
    type BlockHashCount = ConstU64<250>;
    type Version = ();
    type PalletInfo = PalletInfo;
    type AccountData = balances::AccountData<u128>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type SystemWeightInfo = ();
    type SS58Prefix = ConstU16<42>;
    type OnSetCode = ();
    type MaxConsumers = frame_support::traits::ConstU32<16>;
}

impl pallet_timestamp::Config for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

impl balances::Config for Test {
    type Balance = u128;
    type DustRemoval = ();
    type Event = Event;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type MaxLocks = ();
    type MaxReserves = ConstU32<2>;
    type ReserveIdentifier = [u8; 8];
    type WeightInfo = ();
}

/// Implement membership trait for Test
impl membership::Config for Test {
    type Event = Event;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type WorkingGroup = Wg;
    type DefaultInitialInvitationBalance = DefaultInitialInvitationBalance;
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InvitedMemberLockId>;
    type StakingCandidateStakingHandler =
        staking_handler::StakingManager<Self, BoundStakingAccountLockId>;
    type CandidateStake = CandidateStake;
    type WeightInfo = ();
    type DefaultMemberInvitesCount = DefaultMemberInvitesCount;
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
        _origin: <Test as frame_system::Config>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!()
    }

    fn ensure_leader_origin(_origin: <Test as frame_system::Config>::Origin) -> DispatchResult {
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

    fn is_leader_account_id(_account_id: &<Test as frame_system::Config>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Config>::AccountId,
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
        membership::Module::<Test>::controller_account_id(member_id).or_else(|_| {
            if member_id < 1000 {
                return Ok(member_id + 1000);
            }

            Err(DispatchError::Other("no account found"))
        })
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
            membership::Module::<Test>::is_member_controller_account(&member_id, &sender)
                || Self::is_member_controller_account(&member_id, &sender),
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
    pub(crate) account_info_by_token_and_member: Vec<(TokenId, MemberId, ConfigAccountData)>,
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
    config: token::GenesisConfig<Test>,
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
pub fn build_test_externalities(config: token::GenesisConfig<Test>) -> TestExternalities {
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
pub const DEFAULT_SPLIT_REVENUE: u128 = 1000;
pub const DEFAULT_SPLIT_RATE: Permill = Permill::from_percent(10);
pub const DEFAULT_SPLIT_DURATION: u64 = 100;
pub const DEFAULT_SPLIT_PARTICIPATION: u128 = 100_000;
pub const DEFAULT_SPLIT_JOY_DIVIDEND: u128 = 10; // (participation / issuance) * revenue * rate

// ------ Bonding Curve Constants ------------
pub const DEFAULT_BONDING_AMOUNT: u128 = 1000;
pub const DEFAULT_UNBONDING_AMOUNT: u128 = 100;

// ------ Storage Constants ------------------
pub const STORAGE_WG_LEADER_ACCOUNT_ID: u64 = 100001;
pub const DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID: u64 = 100002;
pub const DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID: u64 = 100003;
pub const DISTRIBUTION_WG_LEADER_ACCOUNT_ID: u64 = 100004;
pub const DEFAULT_STORAGE_PROVIDER_ID: u64 = 10;
pub const DEFAULT_DISTRIBUTION_PROVIDER_ID: u64 = 12;

#[macro_export]
macro_rules! merkle_root {
    [$($vals:expr),*] => {
        generate_merkle_root_helper::<Test, _>(&vec![$($vals,)*]).pop().unwrap()
    };
}

#[macro_export]
macro_rules! merkle_proof {
    ($idx:expr,[$($vals:expr),*]) => {
        MerkleProofOf::<Test>::new(build_merkle_path_helper::<Test, _>(&vec![$($vals,)*], $idx as usize))
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

pub fn ed() -> Balance {
    ExistentialDeposit::get()
}

pub fn set_invitation_lock(who: &<Test as frame_system::Config>::AccountId, amount: Balance) {
    <Test as membership::Config>::InvitedMemberStakingHandler::lock_with_reasons(
        &who,
        amount,
        WithdrawReasons::except(WithdrawReasons::TRANSACTION_PAYMENT),
    );
}

pub fn set_staking_candidate_lock(
    who: &<Test as frame_system::Config>::AccountId,
    amount: Balance,
) {
    <Test as membership::Config>::StakingCandidateStakingHandler::lock(&who, amount);
}
