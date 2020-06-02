#![cfg(test)]

use crate::*;
use std::cell::RefCell;

use crate::InputValidationLengthConstraint;
use primitives::H256;
use runtime_primitives::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
pub use srml_support::{assert_err, assert_ok};
use srml_support::{impl_outer_event, impl_outer_origin, parameter_types};

/// Runtime Types

type ClassId = <Runtime as Trait>::ClassId;
type EntityId = <Runtime as Trait>::EntityId;
type Nonce = <Runtime as Trait>::Nonce;

type CuratorId = <Runtime as ActorAuthenticator>::CuratorId;
type CuratorGroupId = <Runtime as ActorAuthenticator>::CuratorGroupId;
type MemberId = <Runtime as ActorAuthenticator>::MemberId;

/// Origins

pub const LEAD_ORIGIN: u64 = 1;

pub const FIRST_CURATOR_ORIGIN: u64 = 2;
pub const SECOND_CURATOR_ORIGIN: u64 = 3;

pub const FIRST_MEMBER_ORIGIN: u64 = 4;
pub const SECOND_MEMBER_ORIGIN: u64 = 5;

/// Runtime Id's

pub const FIRST_CURATOR_ID: CuratorId = 1;
pub const SECOND_CURATOR_ID: CuratorId = 2;

pub const FIRST_CURATOR_GROUP_ID: CuratorGroupId = 1;
pub const SECOND_CURATOR_GROUP_ID: CuratorGroupId = 2;

pub const FIRST_MEMBER_ID: MemberId = 1;
pub const SECOND_MEMBER_ID: MemberId = 2;

pub const FIRST_CLASS_ID: ClassId = 1;
pub const SECOND_CLASS_ID: ClassId = 2;

pub const FIRST_ENTITY_ID: EntityId = 1;
pub const SECOND_ENTITY_ID: EntityId = 2;

pub const UNKNOWN_CLASS_ID: ClassId = 111;
pub const UNKNOWN_ENTITY_ID: EntityId = 222;
pub const UNKNOWN_PROPERTY_ID: PropertyId = 333;
pub const UNKNOWN_SCHEMA_ID: SchemaId = 444;

pub const FIRST_SCHEMA_ID: SchemaId = 0;
pub const SECOND_SCHEMA_ID: SchemaId = 1;

pub const FIRST_PROPERTY_ID: SchemaId = 0;
pub const SECOND_PROPERTY_ID: SchemaId = 1;

/// Nonces

pub const ZERO_NONCE: Nonce = 0;
pub const FIRST_NONCE: Nonce = 1;
pub const SECOND_NONCE: Nonce = 2;

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

pub struct MaxNumberOfPropertiesPerClass;
impl Get<MaxNumber> for MaxNumberOfPropertiesPerClass {
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

impl system::Trait for Runtime {
    type Origin = Origin;
    type Index = u64;
    type Call = ();
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = TestEvent;
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
}

mod test_events {
    pub use crate::Event;
}

impl_outer_event! {
    pub enum TestEvent for Runtime {
        test_events<T>,
    }
}

impl Trait for Runtime {
    type Event = TestEvent;

    type Nonce = u64;

    type ClassId = u64;
    type EntityId = u64;

    type PropertyNameLengthConstraint = PropertyNameLengthConstraint;
    type PropertyDescriptionLengthConstraint = PropertyDescriptionLengthConstraint;
    type ClassNameLengthConstraint = ClassNameLengthConstraint;
    type ClassDescriptionLengthConstraint = ClassDescriptionLengthConstraint;

    type MaxNumberOfClasses = MaxNumberOfClasses;
    type MaxNumberOfMaintainersPerClass = MaxNumberOfMaintainersPerClass;
    type MaxNumberOfSchemasPerClass = MaxNumberOfSchemasPerClass;
    type MaxNumberOfPropertiesPerClass = MaxNumberOfPropertiesPerClass;
    type MaxNumberOfEntitiesPerClass = MaxNumberOfEntitiesPerClass;

    type MaxNumberOfCuratorsPerGroup = MaxNumberOfCuratorsPerGroup;

    type MaxNumberOfOperationsDuringAtomicBatching = MaxNumberOfOperationsDuringAtomicBatching;

    type VecMaxLengthConstraint = VecMaxLengthConstraint;
    type TextMaxLengthConstraint = TextMaxLengthConstraint;

    type IndividualEntitiesCreationLimit = IndividualEntitiesCreationLimit;
}

impl ActorAuthenticator for Runtime {
    type CuratorId = u64;
    type MemberId = u64;
    type CuratorGroupId = u64;

    // Consider lazy_static crate?

    fn is_lead(account_id: &Self::AccountId) -> bool {
        let lead_account_id = ensure_signed(Origin::signed(LEAD_ORIGIN)).unwrap();
        *account_id == lead_account_id
    }

    fn is_curator(curator_id: &Self::CuratorId, account_id: &Self::AccountId) -> bool {
        let first_curator_account_id = ensure_signed(Origin::signed(FIRST_CURATOR_ORIGIN)).unwrap();
        let second_curator_account_id =
            ensure_signed(Origin::signed(SECOND_CURATOR_ORIGIN)).unwrap();
        (first_curator_account_id == *account_id && FIRST_CURATOR_ID == *curator_id)
            || (second_curator_account_id == *account_id && SECOND_CURATOR_ID == *curator_id)
    }

    fn is_member(member_id: &Self::MemberId, account_id: &Self::AccountId) -> bool {
        let first_member_account_id = ensure_signed(Origin::signed(FIRST_MEMBER_ORIGIN)).unwrap();
        let second_member_account_id = ensure_signed(Origin::signed(SECOND_MEMBER_ORIGIN)).unwrap();
        (first_member_account_id == *account_id && FIRST_MEMBER_ID == *member_id)
            || (second_member_account_id == *account_id && SECOND_MEMBER_ID == *member_id)
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

    individual_entities_creation_limit: EntityId,
}

impl Default for ExtBuilder {
    fn default() -> Self {
        Self {
            property_name_constraint: InputValidationLengthConstraint::new(1, 49),
            property_description_constraint: InputValidationLengthConstraint::new(0, 500),
            class_name_constraint: InputValidationLengthConstraint::new(1, 49),
            class_description_constraint: InputValidationLengthConstraint::new(0, 500),

            max_number_of_classes: 1000,
            max_number_of_maintainers_per_class: 10,
            max_number_of_schemas_per_class: 20,
            max_number_of_properties_per_class: 40,
            max_number_of_entities_per_class: 400,

            max_number_of_curators_per_group: 100,

            max_number_of_operations_during_atomic_batching: 500,

            vec_max_length_constraint: 200,
            text_max_length_constraint: 5000,

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

        INDIVIDUAL_ENTITIES_CREATION_LIMIT
            .with(|v| *v.borrow_mut() = self.individual_entities_creation_limit);
    }

    pub fn build(self, config: GenesisConfig<Runtime>) -> runtime_io::TestExternalities {
        self.set_associated_consts();
        let mut t = system::GenesisConfig::default()
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
    ExtBuilder::default()
        .build(default_genesis_config)
        .execute_with(f)
}

pub fn generate_text(len: usize) -> Vec<u8> {
    vec![b'x'; len]
}

impl<T: Trait> Property<T> {
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
    CuratorId,
    ClassId,
    EntityId,
    EntityController<Runtime>,
    EntityCreationVoucher<Runtime>,
    bool,
    Actor<Runtime>,
    Nonce,
>;

pub fn get_test_event(raw_event: RawTestEvent) -> TestEvent {
    TestEvent::test_events(raw_event)
}

pub fn assert_event_success(tested_event: TestEvent, number_of_events_after_call: usize) {
    // Ensure  runtime events length is equal to expected number of events after call
    assert_eq!(System::events().len(), number_of_events_after_call);

    // Ensure  last emitted event is equal to expected one
    assert!(matches!(
            System::events()
                .iter()
                .last(),
            Some(last_event) if last_event.event == tested_event
    ));
}

pub fn assert_failure(
    call_result: Result<(), &str>,
    expected_error: &str,
    number_of_events_before_call: usize,
) {
    // Ensure  call result is equal to expected error
    assert!(matches!(
        call_result,
        Err(call_result) if call_result == expected_error
    ));

    // Ensure  no other events emitted after call
    assert_eq!(System::events().len(), number_of_events_before_call);
}

// Curator groups

pub fn next_curator_group_id() -> CuratorGroupId {
    TestModule::next_curator_group_id()
}

pub fn add_curator_group(lead_origin: u64) -> Result<(), &'static str> {
    TestModule::add_curator_group(Origin::signed(lead_origin))
}

pub fn remove_curator_group(
    lead_origin: u64,
    curator_group_id: CuratorGroupId,
) -> Result<(), &'static str> {
    TestModule::remove_curator_group(Origin::signed(lead_origin), curator_group_id)
}

pub fn add_curator_to_group(
    lead_origin: u64,
    curator_group_id: CuratorGroupId,
    curator_id: CuratorId,
) -> Result<(), &'static str> {
    TestModule::add_curator_to_group(Origin::signed(lead_origin), curator_group_id, curator_id)
}

pub fn remove_curator_from_group(
    lead_origin: u64,
    curator_group_id: CuratorGroupId,
    curator_id: CuratorId,
) -> Result<(), &'static str> {
    TestModule::remove_curator_from_group(Origin::signed(lead_origin), curator_group_id, curator_id)
}

pub fn set_curator_group_status(
    lead_origin: u64,
    curator_group_id: CuratorGroupId,
    is_active: bool,
) -> Result<(), &'static str> {
    TestModule::set_curator_group_status(Origin::signed(lead_origin), curator_group_id, is_active)
}

pub fn curator_group_by_id(curator_group_id: CuratorGroupId) -> CuratorGroup<Runtime> {
    TestModule::curator_group_by_id(curator_group_id)
}

pub fn curator_group_exists(curator_group_id: CuratorGroupId) -> bool {
    CuratorGroupById::<Runtime>::exists(curator_group_id)
}

// Classes

pub fn create_class_with_default_permissions() -> Class<Runtime> {
    Class::new(
        ClassPermissions::default(),
        generate_text(ClassNameLengthConstraint::get().max() as usize),
        generate_text(ClassDescriptionLengthConstraint::get().max() as usize),
        MaxNumberOfEntitiesPerClass::get(),
        IndividualEntitiesCreationLimit::get(),
    )
}

pub fn create_simple_class_with_default_permissions(lead_origin: u64) -> Result<(), &'static str> {
    TestModule::create_class(
        Origin::signed(lead_origin),
        generate_text(ClassNameLengthConstraint::get().max() as usize),
        generate_text(ClassDescriptionLengthConstraint::get().max() as usize),
        ClassPermissions::default(),
        MaxNumberOfEntitiesPerClass::get(),
        IndividualEntitiesCreationLimit::get(),
    )
}

pub fn add_maintainer_to_class(
    lead_origin: u64,
    class_id: ClassId,
    curator_group_id: CuratorGroupId,
) -> Result<(), &'static str> {
    TestModule::add_maintainer_to_class(Origin::signed(lead_origin), class_id, curator_group_id)
}

pub fn remove_maintainer_from_class(
    lead_origin: u64,
    class_id: ClassId,
    curator_group_id: CuratorGroupId,
) -> Result<(), &'static str> {
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
) -> Result<(), &'static str> {
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
    new_properties: Vec<Property<Runtime>>,
) -> Result<(), &'static str> {
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
) -> Result<(), &'static str> {
    TestModule::update_class_schema_status(Origin::signed(lead_origin), class_id, schema_id, status)
}

pub fn next_class_id() -> ClassId {
    TestModule::next_class_id()
}

pub fn class_by_id(class_id: ClassId) -> Class<Runtime> {
    TestModule::class_by_id(class_id)
}

pub fn class_exists(class_id: ClassId) -> bool {
    ClassById::<Runtime>::exists(class_id)
}

// Vouchers

pub fn update_entity_creation_voucher(
    lead_origin: u64,
    class_id: ClassId,
    controller: EntityController<Runtime>,
    maximum_entities_count: EntityId,
) -> Result<(), &'static str> {
    TestModule::update_entity_creation_voucher(
        Origin::signed(lead_origin),
        class_id,
        controller,
        maximum_entities_count,
    )
}

pub fn entity_creation_vouchers(
    class_id: ClassId,
    entity_controller: EntityController<Runtime>,
) -> Option<EntityCreationVoucher<Runtime>> {
    TestModule::entity_creation_vouchers(class_id, entity_controller)
}

// Entities

pub fn entity_exists(entity_id: EntityId) -> bool {
    EntityById::<Runtime>::exists(entity_id)
}

pub fn entity_by_id(entity_id: EntityId) -> Entity<Runtime> {
    TestModule::entity_by_id(entity_id)
}

pub fn next_entity_id() -> EntityId {
    TestModule::next_entity_id()
}

pub fn create_entity(
    lead_origin: u64,
    class_id: ClassId,
    actor: Actor<Runtime>,
) -> Result<(), &'static str> {
    TestModule::create_entity(Origin::signed(lead_origin), class_id, actor)
}

// Assign back to type variables so we can make dispatched calls of these modules later.
pub type System = system::Module<Runtime>;
pub type TestModule = Module<Runtime>;
