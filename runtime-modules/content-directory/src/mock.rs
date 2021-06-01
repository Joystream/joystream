#![cfg(test)]

use crate::InputValidationLengthConstraint;
use crate::*;
use core::iter::FromIterator;
use frame_support::traits::{OnFinalize, OnInitialize};
pub use frame_support::{
    assert_err, assert_ok, impl_outer_event, impl_outer_origin, parameter_types,
};
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use std::cell::RefCell;

/// Runtime Types

pub type ClassId = <Runtime as Trait>::ClassId;
pub type EntityId = <Runtime as Trait>::EntityId;
pub type Nonce = <Runtime as Trait>::Nonce;
pub type Hashed = <Runtime as frame_system::Trait>::Hash;

pub type TestCuratorId = CuratorId<Runtime>;
pub type CuratorGroupId = <Runtime as Trait>::CuratorGroupId;
pub type MemberId = <Runtime as common::membership::Trait>::MemberId;

/// Origins

pub const LEAD_ORIGIN: u64 = 1;

pub const FIRST_CURATOR_ORIGIN: u64 = 2;
pub const SECOND_CURATOR_ORIGIN: u64 = 3;

pub const FIRST_MEMBER_ORIGIN: u64 = 4;
pub const SECOND_MEMBER_ORIGIN: u64 = 5;
pub const UNKNOWN_ORIGIN: u64 = 7777;

/// Runtime Id's

pub const FIRST_CURATOR_ID: TestCuratorId = 1;
pub const SECOND_CURATOR_ID: TestCuratorId = 2;

pub const FIRST_CURATOR_GROUP_ID: CuratorGroupId = 1;
pub const SECOND_CURATOR_GROUP_ID: CuratorGroupId = 2;

pub const FIRST_MEMBER_ID: MemberId = 1;
pub const SECOND_MEMBER_ID: MemberId = 2;

pub const FIRST_CLASS_ID: ClassId = 1;
pub const SECOND_CLASS_ID: ClassId = 2;

pub const FIRST_ENTITY_ID: EntityId = 1;
pub const SECOND_ENTITY_ID: EntityId = 2;
pub const THIRD_ENTITY_ID: EntityId = 3;

pub const UNKNOWN_CLASS_ID: ClassId = 111;
pub const UNKNOWN_ENTITY_ID: EntityId = 222;
pub const UNKNOWN_PROPERTY_ID: PropertyId = 333;
pub const UNKNOWN_SCHEMA_ID: SchemaId = 444;

pub const UNKNOWN_CURATOR_GROUP_ID: CuratorGroupId = 555;
pub const UNKNOWN_CURATOR_ID: CuratorGroupId = 555;
pub const UNKNOWN_MEMBER_ID: CuratorGroupId = 777;

pub const FIRST_SCHEMA_ID: SchemaId = 0;
pub const SECOND_SCHEMA_ID: SchemaId = 1;

pub const FIRST_PROPERTY_ID: SchemaId = 0;
pub const SECOND_PROPERTY_ID: SchemaId = 1;

impl_outer_origin! {
    pub enum Origin for Runtime {}
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, Default, PartialEq, Eq, Debug)]
pub struct Runtime;
parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
}

thread_local! {
    static PROPERTY_NAME_CONSTRAINT: RefCell<InputValidationLengthConstraint> = RefCell::new(InputValidationLengthConstraint::default());
    static PROPERTY_DESCRIPTION_CONSTRAINT: RefCell<InputValidationLengthConstraint> = RefCell::new(InputValidationLengthConstraint::default());
    static CLASS_NAME_CONSTRAINT: RefCell<InputValidationLengthConstraint> = RefCell::new(InputValidationLengthConstraint::default());
    static CLASS_DESCRIPTION_CONSTRAINT: RefCell<InputValidationLengthConstraint> = RefCell::new(InputValidationLengthConstraint::default());
    static MAX_NUMBER_OF_CLASSES: RefCell<MaxNumber> = RefCell::new(0);
    static MAX_NUMBER_OF_MAINTAINERS_PER_CLASS: RefCell<MaxNumber> = RefCell::new(0);
    static MAX_NUMBER_OF_SCHEMAS_PER_CLASS: RefCell<MaxNumber> = RefCell::new(0);
    static MAX_NUMBER_OF_PROPERTIES_PER_CLASS: RefCell<MaxNumber> = RefCell::new(0);
    static MAX_NUMBER_OF_ENTITIES_PER_CLASS: RefCell<EntityId> = RefCell::new(0);
    static MAX_NUMBER_OF_CURATORS_PER_GROUP: RefCell<MaxNumber> = RefCell::new(0);
    static MAX_NUMBER_OF_OPERATIONS_DURING_ATOMIC_BATCHING: RefCell<MaxNumber> = RefCell::new(0);
    static VEC_MAX_LENGTH_CONSTRAINT: RefCell<VecMaxLength> = RefCell::new(0);
    static TEXT_MAX_LENGTH_CONSTRAINT: RefCell<TextMaxLength> = RefCell::new(0);
    static HASHED_TEXT_MAX_LENGTH_CONSTRAINT: RefCell<HashedTextMaxLength> = RefCell::new(Some(0));
    static INDIVIDUAL_ENTITIES_CREATION_LIMIT: RefCell<EntityId> = RefCell::new(0);
}

pub struct PropertyNameLengthConstraint;
impl Get<InputValidationLengthConstraint> for PropertyNameLengthConstraint {
    fn get() -> InputValidationLengthConstraint {
        PROPERTY_NAME_CONSTRAINT.with(|v| *v.borrow())
    }
}

pub struct PropertyDescriptionLengthConstraint;
impl Get<InputValidationLengthConstraint> for PropertyDescriptionLengthConstraint {
    fn get() -> InputValidationLengthConstraint {
        PROPERTY_DESCRIPTION_CONSTRAINT.with(|v| *v.borrow())
    }
}

pub struct ClassNameLengthConstraint;
impl Get<InputValidationLengthConstraint> for ClassNameLengthConstraint {
    fn get() -> InputValidationLengthConstraint {
        CLASS_NAME_CONSTRAINT.with(|v| *v.borrow())
    }
}

pub struct ClassDescriptionLengthConstraint;
impl Get<InputValidationLengthConstraint> for ClassDescriptionLengthConstraint {
    fn get() -> InputValidationLengthConstraint {
        CLASS_DESCRIPTION_CONSTRAINT.with(|v| *v.borrow())
    }
}

pub struct MaxNumberOfClasses;
impl Get<MaxNumber> for MaxNumberOfClasses {
    fn get() -> MaxNumber {
        MAX_NUMBER_OF_CLASSES.with(|v| *v.borrow())
    }
}

pub struct MaxNumberOfMaintainersPerClass;
impl Get<MaxNumber> for MaxNumberOfMaintainersPerClass {
    fn get() -> MaxNumber {
        MAX_NUMBER_OF_MAINTAINERS_PER_CLASS.with(|v| *v.borrow())
    }
}

pub struct MaxNumberOfCuratorsPerGroup;
impl Get<MaxNumber> for MaxNumberOfCuratorsPerGroup {
    fn get() -> MaxNumber {
        MAX_NUMBER_OF_CURATORS_PER_GROUP.with(|v| *v.borrow())
    }
}

pub struct MaxNumberOfSchemasPerClass;
impl Get<MaxNumber> for MaxNumberOfSchemasPerClass {
    fn get() -> MaxNumber {
        MAX_NUMBER_OF_SCHEMAS_PER_CLASS.with(|v| *v.borrow())
    }
}

pub struct MaxNumberOfPropertiesPerSchema;
impl Get<MaxNumber> for MaxNumberOfPropertiesPerSchema {
    fn get() -> MaxNumber {
        MAX_NUMBER_OF_PROPERTIES_PER_CLASS.with(|v| *v.borrow())
    }
}

pub struct MaxNumberOfOperationsDuringAtomicBatching;
impl Get<MaxNumber> for MaxNumberOfOperationsDuringAtomicBatching {
    fn get() -> MaxNumber {
        MAX_NUMBER_OF_OPERATIONS_DURING_ATOMIC_BATCHING.with(|v| *v.borrow())
    }
}

pub struct VecMaxLengthConstraint;
impl Get<VecMaxLength> for VecMaxLengthConstraint {
    fn get() -> VecMaxLength {
        VEC_MAX_LENGTH_CONSTRAINT.with(|v| *v.borrow())
    }
}

pub struct TextMaxLengthConstraint;
impl Get<TextMaxLength> for TextMaxLengthConstraint {
    fn get() -> TextMaxLength {
        TEXT_MAX_LENGTH_CONSTRAINT.with(|v| *v.borrow())
    }
}

pub struct HashedTextMaxLengthConstraint;
impl Get<HashedTextMaxLength> for HashedTextMaxLengthConstraint {
    fn get() -> HashedTextMaxLength {
        HASHED_TEXT_MAX_LENGTH_CONSTRAINT.with(|v| *v.borrow())
    }
}

pub struct MaxNumberOfEntitiesPerClass;
impl Get<EntityId> for MaxNumberOfEntitiesPerClass {
    fn get() -> EntityId {
        MAX_NUMBER_OF_ENTITIES_PER_CLASS.with(|v| *v.borrow())
    }
}

pub struct IndividualEntitiesCreationLimit;
impl Get<EntityId> for IndividualEntitiesCreationLimit {
    fn get() -> EntityId {
        INDIVIDUAL_ENTITIES_CREATION_LIMIT.with(|v| *v.borrow())
    }
}

impl frame_system::Trait for Runtime {
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
    type PalletInfo = ();
    type AccountData = ();
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type SystemWeightInfo = ();
}

mod test_events {
    pub use crate::Event;
}

impl_outer_event! {
    pub enum TestEvent for Runtime {
        test_events<T>,
        frame_system<T>,
    }
}

impl Trait for Runtime {
    type Event = TestEvent;
    type Nonce = u64;
    type ClassId = u64;
    type EntityId = u64;
    type CuratorGroupId = u64;
    type PropertyNameLengthConstraint = PropertyNameLengthConstraint;
    type PropertyDescriptionLengthConstraint = PropertyDescriptionLengthConstraint;
    type ClassNameLengthConstraint = ClassNameLengthConstraint;
    type ClassDescriptionLengthConstraint = ClassDescriptionLengthConstraint;
    type MaxNumberOfClasses = MaxNumberOfClasses;
    type MaxNumberOfMaintainersPerClass = MaxNumberOfMaintainersPerClass;
    type MaxNumberOfCuratorsPerGroup = MaxNumberOfCuratorsPerGroup;
    type MaxNumberOfSchemasPerClass = MaxNumberOfSchemasPerClass;
    type MaxNumberOfPropertiesPerSchema = MaxNumberOfPropertiesPerSchema;
    type MaxNumberOfOperationsDuringAtomicBatching = MaxNumberOfOperationsDuringAtomicBatching;
    type VecMaxLengthConstraint = VecMaxLengthConstraint;
    type TextMaxLengthConstraint = TextMaxLengthConstraint;
    type HashedTextMaxLengthConstraint = HashedTextMaxLengthConstraint;
    type MaxNumberOfEntitiesPerClass = MaxNumberOfEntitiesPerClass;
    type IndividualEntitiesCreationLimit = IndividualEntitiesCreationLimit;
    type WorkingGroup = ();
    type MemberOriginValidator = ();
}

impl common::working_group::WorkingGroupAuthenticator<Runtime> for () {
    fn ensure_worker_origin(
        _origin: <Runtime as frame_system::Trait>::Origin,
        _worker_id: &<Runtime as common::membership::Trait>::ActorId,
    ) -> DispatchResult {
        unimplemented!()
    }

    fn ensure_leader_origin(_origin: <Runtime as frame_system::Trait>::Origin) -> DispatchResult {
        unimplemented!()
    }

    fn get_leader_member_id() -> Option<<Runtime as common::membership::Trait>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(account_id: &<Runtime as frame_system::Trait>::AccountId) -> bool {
        let lead_account_id = ensure_signed(Origin::signed(LEAD_ORIGIN)).unwrap();

        *account_id == lead_account_id
    }

    fn is_worker_account_id(
        account_id: &<Runtime as frame_system::Trait>::AccountId,
        worker_id: &<Runtime as common::membership::Trait>::ActorId,
    ) -> bool {
        let first_curator_account_id = ensure_signed(Origin::signed(FIRST_CURATOR_ORIGIN)).unwrap();
        let second_curator_account_id =
            ensure_signed(Origin::signed(SECOND_CURATOR_ORIGIN)).unwrap();
        (first_curator_account_id == *account_id && FIRST_CURATOR_ID == *worker_id)
            || (second_curator_account_id == *account_id && SECOND_CURATOR_ID == *worker_id)
    }
}

impl common::membership::Trait for Runtime {
    type MemberId = u64;
    type ActorId = u64;
}

impl common::membership::MemberOriginValidator<Origin, u64, u64> for () {
    fn ensure_member_controller_account_origin(
        _origin: Origin,
        _member_id: u64,
    ) -> Result<u64, DispatchError> {
        unimplemented!()
    }

    fn is_member_controller_account(member_id: &u64, account_id: &u64) -> bool {
        let unknown_member_account_id = ensure_signed(Origin::signed(UNKNOWN_ORIGIN)).unwrap();
        *member_id < MaxNumberOfEntitiesPerClass::get() && unknown_member_account_id != *account_id
    }
}

pub struct ExtBuilder {
    property_name_constraint: InputValidationLengthConstraint,
    property_description_constraint: InputValidationLengthConstraint,
    class_name_constraint: InputValidationLengthConstraint,
    class_description_constraint: InputValidationLengthConstraint,
    max_number_of_classes: MaxNumber,
    max_number_of_maintainers_per_class: MaxNumber,
    max_number_of_schemas_per_class: MaxNumber,
    max_number_of_properties_per_class: MaxNumber,
    max_number_of_entities_per_class: EntityId,
    max_number_of_curators_per_group: MaxNumber,
    max_number_of_operations_during_atomic_batching: MaxNumber,
    vec_max_length_constraint: VecMaxLength,
    text_max_length_constraint: TextMaxLength,
    hashed_text_max_length_constraint: HashedTextMaxLength,
    individual_entities_creation_limit: EntityId,
}

impl Default for ExtBuilder {
    fn default() -> Self {
        Self {
            property_name_constraint: InputValidationLengthConstraint::new(1, 49),
            property_description_constraint: InputValidationLengthConstraint::new(1, 500),
            class_name_constraint: InputValidationLengthConstraint::new(1, 49),
            class_description_constraint: InputValidationLengthConstraint::new(1, 500),
            max_number_of_classes: 100,
            max_number_of_maintainers_per_class: 10,
            max_number_of_schemas_per_class: 20,
            max_number_of_properties_per_class: 40,
            max_number_of_entities_per_class: 400,
            max_number_of_curators_per_group: 50,
            max_number_of_operations_during_atomic_batching: 500,
            vec_max_length_constraint: 200,
            text_max_length_constraint: 5000,
            hashed_text_max_length_constraint: Some(25000),
            individual_entities_creation_limit: 50,
        }
    }
}

impl ExtBuilder {
    pub fn set_associated_consts(&self) {
        PROPERTY_NAME_CONSTRAINT.with(|v| *v.borrow_mut() = self.property_name_constraint);
        PROPERTY_DESCRIPTION_CONSTRAINT
            .with(|v| *v.borrow_mut() = self.property_description_constraint);
        CLASS_NAME_CONSTRAINT.with(|v| *v.borrow_mut() = self.class_name_constraint);
        CLASS_DESCRIPTION_CONSTRAINT.with(|v| *v.borrow_mut() = self.class_description_constraint);
        MAX_NUMBER_OF_CLASSES.with(|v| *v.borrow_mut() = self.max_number_of_classes);
        MAX_NUMBER_OF_MAINTAINERS_PER_CLASS
            .with(|v| *v.borrow_mut() = self.max_number_of_maintainers_per_class);
        MAX_NUMBER_OF_SCHEMAS_PER_CLASS
            .with(|v| *v.borrow_mut() = self.max_number_of_schemas_per_class);
        MAX_NUMBER_OF_PROPERTIES_PER_CLASS
            .with(|v| *v.borrow_mut() = self.max_number_of_properties_per_class);
        MAX_NUMBER_OF_ENTITIES_PER_CLASS
            .with(|v| *v.borrow_mut() = self.max_number_of_entities_per_class);
        MAX_NUMBER_OF_CURATORS_PER_GROUP
            .with(|v| *v.borrow_mut() = self.max_number_of_curators_per_group);
        MAX_NUMBER_OF_OPERATIONS_DURING_ATOMIC_BATCHING
            .with(|v| *v.borrow_mut() = self.max_number_of_operations_during_atomic_batching);
        VEC_MAX_LENGTH_CONSTRAINT.with(|v| *v.borrow_mut() = self.vec_max_length_constraint);
        TEXT_MAX_LENGTH_CONSTRAINT.with(|v| *v.borrow_mut() = self.text_max_length_constraint);
        HASHED_TEXT_MAX_LENGTH_CONSTRAINT
            .with(|v| *v.borrow_mut() = self.hashed_text_max_length_constraint);
        INDIVIDUAL_ENTITIES_CREATION_LIMIT
            .with(|v| *v.borrow_mut() = self.individual_entities_creation_limit);
    }

    pub fn build(self, config: GenesisConfig<Runtime>) -> sp_io::TestExternalities {
        self.set_associated_consts();
        let mut t = frame_system::GenesisConfig::default()
            .build_storage::<Runtime>()
            .unwrap();
        config.assimilate_storage(&mut t).unwrap();
        t.into()
    }
}

// This function basically just builds a genesis storage key/value store according to
// our desired mockup.

fn default_content_directory_genesis_config() -> GenesisConfig<Runtime> {
    GenesisConfig {
        class_by_id: vec![],
        entity_by_id: vec![],
        curator_group_by_id: vec![],
        next_class_id: 1,
        next_entity_id: 1,
        next_curator_group_id: 1,
    }
}

pub fn with_test_externalities<R, F: FnOnce() -> R>(f: F) -> R {
    let default_genesis_config = default_content_directory_genesis_config();
    /*
        Events are not emitted on block 0.
        So any dispatchable calls made during genesis block formation will have no events emitted.
        https://substrate.dev/recipes/2-appetizers/4-events.html
    */
    let func = || {
        run_to_block(1);
        f()
    };

    ExtBuilder::default()
        .build(default_genesis_config)
        .execute_with(func)
}

pub fn generate_text(len: usize) -> Vec<u8> {
    vec![b'x'; len]
}

impl<ClassId: Default + BaseArithmetic + Clone + Copy> Property<ClassId> {
    pub fn required(mut self) -> Self {
        self.required = true;
        self
    }

    pub fn unique(mut self) -> Self {
        self.unique = true;
        self
    }
}

// Events

type RawTestEvent = RawEvent<
    CuratorGroupId,
    TestCuratorId,
    ClassId,
    EntityId,
    EntityController<MemberId>,
    EntityCreationVoucher<Runtime>,
    bool,
    Actor<CuratorGroupId, TestCuratorId, MemberId>,
    Nonce,
    Option<ReferenceCounterSideEffects<Runtime>>,
    Option<(EntityId, EntityReferenceCounterSideEffect)>,
    u32,
    ClassPermissions<CuratorGroupId>,
    Property<ClassId>,
    InputPropertyValue<Runtime>,
    InputValue<Runtime>,
    OperationType<Runtime>,
>;

pub fn get_test_event(raw_event: RawTestEvent) -> TestEvent {
    TestEvent::test_events(raw_event)
}

pub fn assert_event(tested_event: TestEvent, number_of_events_after_call: usize) {
    // Ensure  runtime events length is equal to expected number of events after call
    assert_eq!(System::events().len(), number_of_events_after_call);

    // Ensure  last emitted event is equal to expected one
    assert_eq!(System::events().iter().last().unwrap().event, tested_event);
}

pub fn assert_failure(
    call_result: DispatchResult,
    expected_error: Error<Runtime>,
    number_of_events_before_call: usize,
) {
    // Ensure  call result is equal to expected error
    assert_err!(call_result, expected_error);

    // Ensure  no other events emitted after call
    assert_eq!(System::events().len(), number_of_events_before_call);
}

// Curator groups

pub fn next_curator_group_id() -> CuratorGroupId {
    TestModule::next_curator_group_id()
}

pub fn add_curator_group(lead_origin: u64) -> DispatchResult {
    TestModule::add_curator_group(Origin::signed(lead_origin))
}

pub fn remove_curator_group(lead_origin: u64, curator_group_id: CuratorGroupId) -> DispatchResult {
    TestModule::remove_curator_group(Origin::signed(lead_origin), curator_group_id)
}

pub fn add_curator_to_group(
    lead_origin: u64,
    curator_group_id: CuratorGroupId,
    curator_id: TestCuratorId,
) -> DispatchResult {
    TestModule::add_curator_to_group(Origin::signed(lead_origin), curator_group_id, curator_id)
}

pub fn remove_curator_from_group(
    lead_origin: u64,
    curator_group_id: CuratorGroupId,
    curator_id: TestCuratorId,
) -> DispatchResult {
    TestModule::remove_curator_from_group(Origin::signed(lead_origin), curator_group_id, curator_id)
}

pub fn set_curator_group_status(
    lead_origin: u64,
    curator_group_id: CuratorGroupId,
    is_active: bool,
) -> DispatchResult {
    TestModule::set_curator_group_status(Origin::signed(lead_origin), curator_group_id, is_active)
}

pub fn curator_group_by_id(curator_group_id: CuratorGroupId) -> CuratorGroup<TestCuratorId> {
    TestModule::curator_group_by_id(curator_group_id)
}

pub fn curator_group_exists(curator_group_id: CuratorGroupId) -> bool {
    CuratorGroupById::<Runtime>::contains_key(curator_group_id)
}

// Classes

pub enum ClassType {
    Valid,
    NameTooLong,
    NameTooShort,
    DescriptionTooLong,
    DescriptionTooShort,
    InvalidMaximumEntitiesCount,
    InvalidDefaultVoucherUpperBound,
    DefaultVoucherUpperBoundExceedsMaximumEntitiesCount,
    MaintainersLimitReached,
    CuratorGroupDoesNotExist,
}

pub fn get_class_for(class_type: ClassType) -> Class<EntityId, ClassId, CuratorGroupId> {
    let mut class = create_class_with_default_permissions();
    match class_type {
        ClassType::Valid => (),
        ClassType::NameTooShort => {
            class.set_name(generate_text(
                ClassNameLengthConstraint::get().min() as usize - 1,
            ));
        }
        ClassType::NameTooLong => {
            class.set_name(generate_text(
                ClassNameLengthConstraint::get().max() as usize + 1,
            ));
        }
        ClassType::DescriptionTooLong => {
            class.set_description(generate_text(
                ClassDescriptionLengthConstraint::get().max() as usize + 1,
            ));
        }
        ClassType::DescriptionTooShort => {
            class.set_description(generate_text(
                ClassDescriptionLengthConstraint::get().min() as usize - 1,
            ));
        }
        ClassType::InvalidMaximumEntitiesCount => {
            class.set_maximum_entities_count(MaxNumberOfEntitiesPerClass::get() + 1);
        }
        ClassType::InvalidDefaultVoucherUpperBound => {
            class.set_default_entity_creation_voucher_upper_bound(
                IndividualEntitiesCreationLimit::get() + 1,
            );
        }
        ClassType::DefaultVoucherUpperBoundExceedsMaximumEntitiesCount => {
            class.set_maximum_entities_count(5);

            class.set_maximum_entities_count(3);
        }
        ClassType::MaintainersLimitReached => {
            let mut maintainers = BTreeSet::new();
            for curator_group_id in 1..=(MaxNumberOfMaintainersPerClass::get() + 1) {
                maintainers.insert(curator_group_id as CuratorGroupId);
            }
            class.get_permissions_mut().set_maintainers(maintainers);
        }
        ClassType::CuratorGroupDoesNotExist => {
            let maintainers = BTreeSet::from_iter(vec![UNKNOWN_CURATOR_GROUP_ID].into_iter());
            class.get_permissions_mut().set_maintainers(maintainers);
        }
    };

    class
}

pub fn create_simple_class(lead_origin: u64, class_type: ClassType) -> DispatchResult {
    let class = get_class_for(class_type);
    TestModule::create_class(
        Origin::signed(lead_origin),
        class.get_name().to_owned(),
        class.get_description().to_owned(),
        class.get_permissions_ref().to_owned(),
        class.get_maximum_entities_count(),
        class.get_default_entity_creation_voucher_upper_bound(),
    )
}

pub fn create_class_with_default_permissions() -> Class<EntityId, ClassId, CuratorGroupId> {
    Class::new(
        ClassPermissions::default(),
        generate_text(ClassNameLengthConstraint::get().max() as usize),
        generate_text(ClassDescriptionLengthConstraint::get().max() as usize),
        MaxNumberOfEntitiesPerClass::get(),
        IndividualEntitiesCreationLimit::get(),
    )
}

pub fn add_maintainer_to_class(
    lead_origin: u64,
    class_id: ClassId,
    curator_group_id: CuratorGroupId,
) -> DispatchResult {
    TestModule::add_maintainer_to_class(Origin::signed(lead_origin), class_id, curator_group_id)
}

pub fn remove_maintainer_from_class(
    lead_origin: u64,
    class_id: ClassId,
    curator_group_id: CuratorGroupId,
) -> DispatchResult {
    TestModule::remove_maintainer_from_class(
        Origin::signed(lead_origin),
        class_id,
        curator_group_id,
    )
}

pub fn update_class_permissions(
    lead_origin: u64,
    class_id: ClassId,
    updated_any_member: Option<bool>,
    updated_entity_creation_blocked: Option<bool>,
    updated_all_entity_property_values_locked: Option<bool>,
    updated_maintainers: Option<BTreeSet<CuratorGroupId>>,
) -> DispatchResult {
    TestModule::update_class_permissions(
        Origin::signed(lead_origin),
        class_id,
        updated_any_member,
        updated_entity_creation_blocked,
        updated_all_entity_property_values_locked,
        updated_maintainers,
    )
}

pub fn add_class_schema(
    lead_origin: u64,
    class_id: ClassId,
    existing_properties: BTreeSet<PropertyId>,
    new_properties: Vec<Property<ClassId>>,
) -> DispatchResult {
    TestModule::add_class_schema(
        Origin::signed(lead_origin),
        class_id,
        existing_properties,
        new_properties,
    )
}

pub fn update_class_schema_status(
    lead_origin: u64,
    class_id: ClassId,
    schema_id: SchemaId,
    status: bool,
) -> DispatchResult {
    TestModule::update_class_schema_status(Origin::signed(lead_origin), class_id, schema_id, status)
}

pub fn next_class_id() -> ClassId {
    TestModule::next_class_id()
}

pub fn class_by_id(class_id: ClassId) -> Class<EntityId, ClassId, CuratorGroupId> {
    TestModule::class_by_id(class_id)
}

pub fn class_exists(class_id: ClassId) -> bool {
    ClassById::<Runtime>::contains_key(class_id)
}

// Vouchers

pub fn update_entity_creation_voucher(
    lead_origin: u64,
    class_id: ClassId,
    controller: EntityController<MemberId>,
    maximum_entities_count: EntityId,
) -> DispatchResult {
    TestModule::update_entity_creation_voucher(
        Origin::signed(lead_origin),
        class_id,
        controller,
        maximum_entities_count,
    )
}

pub fn entity_creation_vouchers(
    class_id: ClassId,
    entity_controller: &EntityController<MemberId>,
) -> EntityCreationVoucher<Runtime> {
    TestModule::entity_creation_vouchers(class_id, entity_controller)
}

pub fn entity_creation_voucher_exists(
    class_id: ClassId,
    entity_controller: &EntityController<MemberId>,
) -> bool {
    EntityCreationVouchers::<Runtime>::contains_key(class_id, entity_controller)
}

// Entities

pub fn entity_exists(entity_id: EntityId) -> bool {
    EntityById::<Runtime>::contains_key(entity_id)
}

pub fn entity_by_id(entity_id: EntityId) -> Entity<ClassId, MemberId, Hashed, EntityId, Nonce> {
    TestModule::entity_by_id(entity_id)
}

pub fn next_entity_id() -> EntityId {
    TestModule::next_entity_id()
}

pub fn create_entity(
    origin: u64,
    class_id: ClassId,
    actor: Actor<CuratorGroupId, TestCuratorId, MemberId>,
) -> DispatchResult {
    TestModule::create_entity(Origin::signed(origin), class_id, actor)
}

pub fn remove_entity(
    origin: u64,
    actor: Actor<CuratorGroupId, TestCuratorId, MemberId>,
    entity_id: EntityId,
) -> DispatchResult {
    TestModule::remove_entity(Origin::signed(origin), actor, entity_id)
}

pub fn update_entity_permissions(
    lead_origin: u64,
    entity_id: EntityId,
    updated_frozen: Option<bool>,
    updated_referenceable: Option<bool>,
) -> DispatchResult {
    TestModule::update_entity_permissions(
        Origin::signed(lead_origin),
        entity_id,
        updated_frozen,
        updated_referenceable,
    )
}

pub fn add_schema_support_to_entity(
    origin: u64,
    actor: Actor<CuratorGroupId, TestCuratorId, MemberId>,
    entity_id: EntityId,
    schema_id: SchemaId,
    new_property_values: BTreeMap<PropertyId, InputPropertyValue<Runtime>>,
) -> DispatchResult {
    TestModule::add_schema_support_to_entity(
        Origin::signed(origin),
        actor,
        entity_id,
        schema_id,
        new_property_values,
    )
}

pub fn update_entity_property_values(
    origin: u64,
    actor: Actor<CuratorGroupId, TestCuratorId, MemberId>,
    entity_id: EntityId,
    new_property_values: BTreeMap<PropertyId, InputPropertyValue<Runtime>>,
) -> DispatchResult {
    TestModule::update_entity_property_values(
        Origin::signed(origin),
        actor,
        entity_id,
        new_property_values,
    )
}

pub fn clear_entity_property_vector(
    origin: u64,
    actor: Actor<CuratorGroupId, TestCuratorId, MemberId>,
    entity_id: EntityId,
    in_class_schema_property_id: PropertyId,
) -> DispatchResult {
    TestModule::clear_entity_property_vector(
        Origin::signed(origin),
        actor,
        entity_id,
        in_class_schema_property_id,
    )
}

pub fn insert_at_entity_property_vector(
    origin: u64,
    actor: Actor<CuratorGroupId, TestCuratorId, MemberId>,
    entity_id: EntityId,
    in_class_schema_property_id: PropertyId,
    index_in_property_vector: VecMaxLength,
    property_value: InputValue<Runtime>,
    nonce: Nonce,
) -> DispatchResult {
    TestModule::insert_at_entity_property_vector(
        Origin::signed(origin),
        actor,
        entity_id,
        in_class_schema_property_id,
        index_in_property_vector,
        property_value,
        nonce,
    )
}

pub fn remove_at_entity_property_vector(
    origin: u64,
    actor: Actor<CuratorGroupId, TestCuratorId, MemberId>,
    entity_id: EntityId,
    in_class_schema_property_id: PropertyId,
    index_in_property_vector: VecMaxLength,
    nonce: Nonce,
) -> DispatchResult {
    TestModule::remove_at_entity_property_vector(
        Origin::signed(origin),
        actor,
        entity_id,
        in_class_schema_property_id,
        index_in_property_vector,
        nonce,
    )
}

pub fn transfer_entity_ownership(
    origin: u64,
    entity_id: EntityId,
    new_controller: EntityController<MemberId>,
    new_property_value_references_with_same_owner_flag_set: BTreeMap<
        PropertyId,
        InputPropertyValue<Runtime>,
    >,
) -> DispatchResult {
    TestModule::transfer_entity_ownership(
        Origin::signed(origin),
        entity_id,
        new_controller,
        new_property_value_references_with_same_owner_flag_set,
    )
}

// Transaction

pub fn transaction(
    origin: u64,
    actor: Actor<CuratorGroupId, TestCuratorId, MemberId>,
    operations: Vec<OperationType<Runtime>>,
) -> DispatchResult {
    TestModule::transaction(Origin::signed(origin), actor, operations)
}

pub enum InvalidPropertyType {
    NameTooLong,
    NameTooShort,
    DescriptionTooLong,
    DescriptionTooShort,
    TextIsTooLong,
    TextHashIsTooLong,
    VecIsTooLong,
}

impl Property<ClassId> {
    pub fn default_with_name(name_len: usize) -> Self {
        let name = generate_text(name_len);
        let description = generate_text(PropertyDescriptionLengthConstraint::get().min() as usize);
        Self {
            name,
            description,
            ..Property::<ClassId>::default()
        }
    }

    pub fn with_name_and_type(
        name_len: usize,
        property_type: PropertyType<ClassId>,
        required: bool,
        unique: bool,
    ) -> Self {
        let name = generate_text(name_len);
        let description = generate_text(PropertyDescriptionLengthConstraint::get().min() as usize);
        Self {
            name,
            description,
            property_type,
            required,
            unique,
            ..Property::<ClassId>::default()
        }
    }

    pub fn invalid(invalid_property_type: InvalidPropertyType) -> Property<ClassId> {
        let mut default_property = Property::<ClassId>::default_with_name(
            PropertyNameLengthConstraint::get().min() as usize,
        );
        match invalid_property_type {
            InvalidPropertyType::NameTooLong => {
                default_property.name =
                    generate_text(PropertyNameLengthConstraint::get().max() as usize + 1);
            }
            InvalidPropertyType::NameTooShort => {
                default_property.name =
                    generate_text(PropertyNameLengthConstraint::get().min() as usize - 1);
            }
            InvalidPropertyType::DescriptionTooLong => {
                default_property.description =
                    generate_text(PropertyDescriptionLengthConstraint::get().max() as usize + 1);
            }
            InvalidPropertyType::DescriptionTooShort => {
                default_property.description =
                    generate_text(PropertyDescriptionLengthConstraint::get().min() as usize - 1);
            }
            InvalidPropertyType::TextIsTooLong => {
                default_property.property_type =
                    PropertyType::<ClassId>::single_text(TextMaxLengthConstraint::get() + 1);
            }
            InvalidPropertyType::TextHashIsTooLong => {
                if let Some(hashed_text_max_len) = HashedTextMaxLengthConstraint::get() {
                    default_property.property_type =
                        PropertyType::<ClassId>::single_text_hash(Some(hashed_text_max_len + 1));
                }
            }
            InvalidPropertyType::VecIsTooLong => {
                default_property.property_type = PropertyType::<ClassId>::vec_reference(
                    FIRST_CLASS_ID,
                    true,
                    VecMaxLengthConstraint::get() + 1,
                );
            }
        };
        default_property
    }
}

impl PropertyType<ClassId> {
    pub fn vec_reference(
        class_id: ClassId,
        same_controller: bool,
        max_length: VecMaxLength,
    ) -> PropertyType<ClassId> {
        let vec_type = Type::<ClassId>::Reference(class_id, same_controller);
        let vec_reference = VecPropertyType::<ClassId>::new(vec_type, max_length);
        PropertyType::<ClassId>::Vector(vec_reference)
    }

    pub fn vec_text(
        text_max_len: TextMaxLength,
        vec_max_length: VecMaxLength,
    ) -> PropertyType<ClassId> {
        let vec_type = Type::<ClassId>::Text(text_max_len);
        let vec_text = VecPropertyType::<ClassId>::new(vec_type, vec_max_length);
        PropertyType::<ClassId>::Vector(vec_text)
    }

    pub fn single_text(text_max_len: TextMaxLength) -> PropertyType<ClassId> {
        let text_type = Type::<ClassId>::Text(text_max_len);
        PropertyType::<ClassId>::Single(text_type)
    }

    pub fn single_text_hash(text_hash_max_len: HashedTextMaxLength) -> PropertyType<ClassId> {
        let text_type = Type::<ClassId>::Hash(text_hash_max_len);
        PropertyType::<ClassId>::Single(text_type)
    }

    pub fn vec_text_hash(
        text_hash_max_len: HashedTextMaxLength,
        vec_max_length: VecMaxLength,
    ) -> PropertyType<ClassId> {
        let vec_type = Type::<ClassId>::Hash(text_hash_max_len);
        let vec_text_hash = VecPropertyType::<ClassId>::new(vec_type, vec_max_length);
        PropertyType::<ClassId>::Vector(vec_text_hash)
    }
}

impl<T: Trait> InputPropertyValue<T> {
    pub fn vec_reference(entity_ids: Vec<EntityId>) -> InputPropertyValue<Runtime> {
        let vec_value = VecInputValue::<Runtime>::Reference(entity_ids);
        InputPropertyValue::<Runtime>::Vector(vec_value)
    }

    pub fn vec_text(texts: Vec<Vec<u8>>) -> InputPropertyValue<Runtime> {
        let vec_value = VecInputValue::<Runtime>::Text(texts);
        InputPropertyValue::<Runtime>::Vector(vec_value)
    }

    pub fn vec_text_to_hash(texts: Vec<Vec<u8>>) -> InputPropertyValue<Runtime> {
        let vec_value = VecInputValue::<Runtime>::TextToHash(texts);
        InputPropertyValue::<Runtime>::Vector(vec_value)
    }

    pub fn single_text(text_len: TextMaxLength) -> InputPropertyValue<Runtime> {
        let text_value = InputValue::<Runtime>::Text(generate_text(text_len as usize));
        InputPropertyValue::<Runtime>::Single(text_value)
    }

    pub fn single_text_to_hash(text_len: TextMaxLength) -> InputPropertyValue<Runtime> {
        let text_value = InputValue::<Runtime>::TextToHash(generate_text(text_len as usize));
        InputPropertyValue::<Runtime>::Single(text_value)
    }
}

impl From<InboundReferenceCounter> for EntityReferenceCounterSideEffect {
    fn from(inbound_rc: InboundReferenceCounter) -> Self {
        Self {
            total: inbound_rc.total as i32,
            same_owner: inbound_rc.same_owner as i32,
        }
    }
}

impl EntityReferenceCounterSideEffect {
    pub fn new(total: i32, same_owner: i32) -> Self {
        Self { total, same_owner }
    }
}

impl PropertyLockingPolicy {
    pub fn new(is_locked_from_maintainer: bool, is_locked_from_controller: bool) -> Self {
        Self {
            is_locked_from_maintainer,
            is_locked_from_controller,
        }
    }
}

// Assign back to type variables so we can make dispatched calls of these modules later.
pub type System = frame_system::Module<Runtime>;
pub type TestModule = Module<Runtime>;

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <TestModule as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <TestModule as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}
