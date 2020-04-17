// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use codec::{Codec, Decode, Encode};
use rstd::collections::{btree_map::BTreeMap, btree_set::BTreeSet};
use rstd::prelude::*;
use runtime_primitives::traits::{MaybeSerialize, MaybeSerializeDeserialize, One, Zero, Member, SimpleArithmetic};
use srml_support::{decl_module, decl_storage, dispatch, ensure, traits::Get, Parameter};

#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};

// EntityId, ClassId -> should be configured on content_directory::Trait

mod constraint;
mod credentials;
mod errors;
mod example;
mod mock;
mod operations;
mod permissions;
mod tests;

pub use constraint::*;
pub use credentials::*;
pub use errors::*;
pub use operations::*;
pub use permissions::*;

pub trait Trait: system::Trait {
    /// Type that represents an actor or group of actors in the system.
    type Credential: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + Clone
        + MaybeSerialize
        + Eq
        + PartialEq
        + Ord;

    type Nonce: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + Clone
        + One
        + Zero
        + MaybeSerializeDeserialize
        + Eq
        + PartialEq
        + Ord;

    /// Security/configuration constraints

    type PropertyNameConstraint: Get<InputValidationLengthConstraint>;

    type PropertyDescriptionConstraint: Get<InputValidationLengthConstraint>;

    type ClassNameConstraint: Get<InputValidationLengthConstraint>;

    type ClassDescriptionConstraint: Get<InputValidationLengthConstraint>;

    /// External type for checking if an account has specified credential.
    type CredentialChecker: CredentialChecker<Self>;

    /// External type used to check if an account has permission to create new Classes.
    type CreateClassPermissionsChecker: CreateClassPermissionsChecker<Self>;
}

/// Trait for checking if an account has specified Credential
pub trait CredentialChecker<T: Trait> {
    fn account_has_credential(account: &T::AccountId, credential: T::Credential) -> bool;
}

/// An implementation where no account has any credential. Effectively
/// only the system will be able to perform any action on the versioned store.
impl<T: Trait> CredentialChecker<T> for () {
    fn account_has_credential(_account: &T::AccountId, _credential: T::Credential) -> bool {
        false
    }
}

/// An implementation that calls into multiple checkers. This allows for multiple modules
/// to maintain AccountId to Credential mappings.
impl<T: Trait, X: CredentialChecker<T>, Y: CredentialChecker<T>> CredentialChecker<T> for (X, Y) {
    fn account_has_credential(account: &T::AccountId, group: T::Credential) -> bool {
        X::account_has_credential(account, group) || Y::account_has_credential(account, group)
    }
}

/// Trait for externally checking if an account can create new classes in the versioned store.
pub trait CreateClassPermissionsChecker<T: Trait> {
    fn account_can_create_class_permissions(account: &T::AccountId) -> bool;
}

/// An implementation that does not permit any account to create classes. Effectively
/// only the system can create classes.
impl<T: Trait> CreateClassPermissionsChecker<T> for () {
    fn account_can_create_class_permissions(_account: &T::AccountId) -> bool {
        false
    }
}

/// Length constraint for input validation
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, Copy, PartialEq, Eq, Debug)]
pub struct InputValidationLengthConstraint {
    /// Minimum length
    pub min: u16,

    /// Difference between minimum length and max length.
    /// While having max would have been more direct, this
    /// way makes max < min unrepresentable semantically,
    /// which is safer.
    pub max_min_diff: u16,
}

impl InputValidationLengthConstraint {
    pub fn new(min: u16, max_min_diff: u16) -> Self {
        Self { min, max_min_diff }
    }

    /// Helper for computing max
    pub fn max(self) -> u16 {
        self.min + self.max_min_diff
    }

    pub fn ensure_valid(
        self,
        len: usize,
        too_short_msg: &'static str,
        too_long_msg: &'static str,
    ) -> Result<(), &'static str> {
        let length = len as u16;
        if length < self.min {
            Err(too_short_msg)
        } else if length > self.max() {
            Err(too_long_msg)
        } else {
            Ok(())
        }
    }
}

pub type ClassId = u64;
pub type EntityId = u64;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct Class<T: Trait> {
    /// Permissions for an instance of a Class in the versioned store.

    #[cfg_attr(feature = "std", serde(skip))]
    class_permissions: ClassPermissionsType<T>,
    /// All properties that have been used on this class across different class schemas.
    /// Unlikely to be more than roughly 20 properties per class, often less.
    /// For Person, think "height", "weight", etc.
    pub properties: Vec<Property>,

    /// All scehmas that are available for this class, think v0.0 Person, v.1.0 Person, etc.
    pub schemas: Vec<Schema>,

    pub name: Vec<u8>,
    pub description: Vec<u8>,
}

impl<T: Trait> Default for Class<T> {
    fn default() -> Self {
        Self {
            class_permissions: ClassPermissionsType::<T>::default(),
            properties: vec![],
            schemas: vec![],
            name: vec![],
            description: vec![],
        }
    }
}

impl<T: Trait> Class<T> {
    fn new(
        class_permissions: ClassPermissionsType<T>,
        name: Vec<u8>,
        description: Vec<u8>,
    ) -> Self {
        Self {
            class_permissions,
            properties: vec![],
            schemas: vec![],
            name,
            description,
        }
    }

    fn is_active_schema(&self, schema_index: u16) -> bool {
        // Such indexing is safe, when length bounds were previously checked
        self.schemas[schema_index as usize].is_active
    }

    fn update_schema_status(&mut self, schema_index: u16, schema_status: bool) {
        // Such indexing is safe, when length bounds were previously checked
        self.schemas[schema_index as usize].is_active = schema_status;
    }

    fn get_permissions_mut(&mut self) -> &mut ClassPermissionsType<T> {
        &mut self.class_permissions
    }

    fn get_permissions(&self) -> &ClassPermissionsType<T> {
        &self.class_permissions
    }

    fn refresh_last_permissions_update(&mut self) {
        self.class_permissions.last_permissions_update = <system::Module<T>>::block_number();
    }
}

pub type ClassPermissionsType<T> =
    ClassPermissions<ClassId, <T as Trait>::Credential, u16, <T as system::Trait>::BlockNumber>;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct Entity<T: Trait> {
    /// The class id of this entity.
    pub class_id: ClassId,

    /// What schemas under which this entity of a class is available, think
    /// v.2.0 Person schema for John, v3.0 Person schema for John
    /// Unlikely to be more than roughly 20ish, assuming schemas for a given class eventually stableize, or that very old schema are eventually removed.
    pub supported_schemas: BTreeSet<u16>, // indices of schema in corresponding class

    /// Values for properties on class that are used by some schema used by this entity!
    /// Length is no more than Class.properties.
    pub values: BTreeMap<u16, PropertyValue>,

    /// Map, representing relation between entity vec_values index and nonce, where vec_value was updated
    /// Used to avoid race update conditions
    pub vec_value_nonces: BTreeMap<u16, T::Nonce>,
    // pub deleted: bool,
}

impl<T: Trait> Default for Entity<T> {
    fn default() -> Self {
        Self {
            class_id: ClassId::default(),
            supported_schemas: BTreeSet::new(),
            values: BTreeMap::new(),
            vec_value_nonces: BTreeMap::new(),
        }
    }
}

impl<T: Trait> Entity<T> {
    fn new(
        class_id: ClassId,
        supported_schemas: BTreeSet<u16>,
        values: BTreeMap<u16, PropertyValue>,
    ) -> Self {
        Self {
            class_id,
            supported_schemas,
            values,
            ..Entity::default()
        }
    }
}

/// A schema defines what properties describe an entity
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct Schema {
    /// Indices into properties vector for the corresponding class.
    pub properties: Vec<u16>,
    pub is_active: bool,
}

impl Default for Schema {
    fn default() -> Self {
        Self {
            properties: vec![],
            // Default schema status
            is_active: true,
        }
    }
}

impl Schema {
    fn new(properties: Vec<u16>) -> Self {
        Self {
            properties,
            // Default schema status
            is_active: true,
        }
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Property {
    pub prop_type: PropertyType,
    pub required: bool,
    pub name: Vec<u8>,
    pub description: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug)]
pub enum PropertyType {
    // Single value:
    Bool,
    Uint16,
    Uint32,
    Uint64,
    Int16,
    Int32,
    Int64,
    Text(u16),
    Reference(ClassId),

    // Vector of values.
    // The first u16 value is the max length of this vector.
    BoolVec(u16),
    Uint16Vec(u16),
    Uint32Vec(u16),
    Uint64Vec(u16),
    Int16Vec(u16),
    Int32Vec(u16),
    Int64Vec(u16),

    /// The first u16 value is the max length of this vector.
    /// The second u16 value is the max length of every text item in this vector.
    TextVec(u16, u16),

    /// The first u16 value is the max length of this vector.
    /// The second ClassId value tells that an every element of this vector
    /// should be of a specific ClassId.
    ReferenceVec(u16, ClassId),
    // External(ExternalProperty),
    // ExternalVec(u16, ExternalProperty),
}

impl Default for PropertyType {
    fn default() -> Self {
        PropertyType::Bool
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum PropertyValue {
    // Single value:
    Bool(bool),
    Uint16(u16),
    Uint32(u32),
    Uint64(u64),
    Int16(i16),
    Int32(i32),
    Int64(i64),
    Text(Vec<u8>),
    Reference(EntityId),

    // Vector of values:
    BoolVec(Vec<bool>),
    Uint16Vec(Vec<u16>),
    Uint32Vec(Vec<u32>),
    Uint64Vec(Vec<u64>),
    Int16Vec(Vec<i16>),
    Int32Vec(Vec<i32>),
    Int64Vec(Vec<i64>),
    TextVec(Vec<Vec<u8>>),
    ReferenceVec(Vec<EntityId>),
    // External(ExternalPropertyType),
    // ExternalVec(Vec<ExternalPropertyType>),
}

impl PropertyValue {
    fn is_vec(&self) -> bool {
        match self {
            PropertyValue::BoolVec(_)
            | PropertyValue::Uint16Vec(_)
            | PropertyValue::Uint32Vec(_)
            | PropertyValue::Uint64Vec(_)
            | PropertyValue::Int16Vec(_)
            | PropertyValue::Int32Vec(_)
            | PropertyValue::Int64Vec(_)
            | PropertyValue::TextVec(_)
            | PropertyValue::ReferenceVec(_) => true,
            _ => false,
        }
    }

    fn vec_clear(&mut self) {
        match self {
            PropertyValue::BoolVec(vec) => *vec = vec![],
            PropertyValue::Uint16Vec(vec) => *vec = vec![],
            PropertyValue::Uint32Vec(vec) => *vec = vec![],
            PropertyValue::Uint64Vec(vec) => *vec = vec![],
            PropertyValue::Int16Vec(vec) => *vec = vec![],
            PropertyValue::Int32Vec(vec) => *vec = vec![],
            PropertyValue::Int64Vec(vec) => *vec = vec![],
            PropertyValue::TextVec(vec) => *vec = vec![],
            PropertyValue::ReferenceVec(vec) => *vec = vec![],
            _ => (),
        }
    }

    fn vec_remove_at(&mut self, index_in_property_vec: u32) {
        fn remove_at_checked<T>(vec: &mut Vec<T>, index_in_property_vec: u32) {
            if (index_in_property_vec as usize) < vec.len() {
                vec.remove(index_in_property_vec as usize);
            }
        }

        match self {
            PropertyValue::BoolVec(vec) => remove_at_checked(vec, index_in_property_vec),
            PropertyValue::Uint16Vec(vec) => remove_at_checked(vec, index_in_property_vec),
            PropertyValue::Uint32Vec(vec) => remove_at_checked(vec, index_in_property_vec),
            PropertyValue::Uint64Vec(vec) => remove_at_checked(vec, index_in_property_vec),
            PropertyValue::Int16Vec(vec) => remove_at_checked(vec, index_in_property_vec),
            PropertyValue::Int32Vec(vec) => remove_at_checked(vec, index_in_property_vec),
            PropertyValue::Int64Vec(vec) => remove_at_checked(vec, index_in_property_vec),
            PropertyValue::TextVec(vec) => remove_at_checked(vec, index_in_property_vec),
            PropertyValue::ReferenceVec(vec) => remove_at_checked(vec, index_in_property_vec),
            _ => (),
        }
    }

    fn vec_insert_at(&mut self, index_in_property_vec: u32, property_value: Self) {
        fn insert_at<T>(vec: &mut Vec<T>, index_in_property_vec: u32, value: T) {
            if (index_in_property_vec as usize) < vec.len() {
                vec.insert(index_in_property_vec as usize, value);
            }
        }

        match (self, property_value) {
            (PropertyValue::BoolVec(vec), PropertyValue::Bool(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (PropertyValue::Uint16Vec(vec), PropertyValue::Uint16(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (PropertyValue::Uint32Vec(vec), PropertyValue::Uint32(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (PropertyValue::Uint64Vec(vec), PropertyValue::Uint64(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (PropertyValue::Int16Vec(vec), PropertyValue::Int16(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (PropertyValue::Int32Vec(vec), PropertyValue::Int32(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (PropertyValue::Int64Vec(vec), PropertyValue::Int64(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (PropertyValue::TextVec(vec), PropertyValue::Text(ref value)) => {
                insert_at(vec, index_in_property_vec, value.to_owned())
            }
            (PropertyValue::ReferenceVec(vec), PropertyValue::Reference(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            _ => (),
        }
    }
}

impl Default for PropertyValue {
    fn default() -> Self {
        PropertyValue::Bool(false)
    }
}

// Shortcuts for faster readability of match expression:
use PropertyType as PT;
use PropertyValue as PV;

decl_storage! {
    trait Store for Module<T: Trait> as ContentDirectory {
        /// ClassPermissions of corresponding Classes in the versioned store
        pub ClassById get(class_by_id) config(): linked_map ClassId => Class<T>;

        pub EntityById get(entity_by_id) config(): map EntityId => Entity<T>;

        /// Owner of an entity in the versioned store. If it is None then it is owned by the system.
        pub EntityMaintainerByEntityId get(entity_maintainer_by_entity_id): linked_map EntityId => Option<T::Credential>;

        pub NextClassId get(next_class_id) config(): ClassId;

        pub NextEntityId get(next_entity_id) config(): EntityId;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {


        /// Sets the admins for a class
        fn set_class_admins(
            origin,
            class_id: ClassId,
            admins: CredentialSet<T::Credential>
        ) -> dispatch::Result {
            let raw_origin = Self::ensure_root_or_signed(origin)?;

            Self::mutate_class_permissions(
                &raw_origin,
                None,
                Self::is_system, // root origin
                class_id,
                |class_permissions| {
                    class_permissions.admins = admins;
                    Ok(())
                }
            )
        }

        // Methods for updating concrete permissions

        fn set_class_entity_permissions(
            origin,
            with_credential: Option<T::Credential>,
            class_id: ClassId,
            entity_permissions: EntityPermissions<T::Credential>
        ) -> dispatch::Result {
            let raw_origin = Self::ensure_root_or_signed(origin)?;

            Self::mutate_class_permissions(
                &raw_origin,
                with_credential,
                ClassPermissions::is_admin,
                class_id,
                |class_permissions| {
                    class_permissions.entity_permissions = entity_permissions;
                    Ok(())
                }
            )
        }

        fn set_class_entities_can_be_created(
            origin,
            with_credential: Option<T::Credential>,
            class_id: ClassId,
            can_be_created: bool
        ) -> dispatch::Result {
            let raw_origin = Self::ensure_root_or_signed(origin)?;

            Self::mutate_class_permissions(
                &raw_origin,
                with_credential,
                ClassPermissions::is_admin,
                class_id,
                |class_permissions| {
                    class_permissions.entities_can_be_created = can_be_created;
                    Ok(())
                }
            )
        }

        fn set_class_add_schemas_set(
            origin,
            with_credential: Option<T::Credential>,
            class_id: ClassId,
            credential_set: CredentialSet<T::Credential>
        ) -> dispatch::Result {
            let raw_origin = Self::ensure_root_or_signed(origin)?;

            Self::mutate_class_permissions(
                &raw_origin,
                with_credential,
                ClassPermissions::is_admin,
                class_id,
                |class_permissions| {
                    class_permissions.add_schemas = credential_set;
                    Ok(())
                }
            )
        }

        fn set_class_update_schemas_status_set(
            origin,
            with_credential: Option<T::Credential>,
            class_id: ClassId,
            credential_set: CredentialSet<T::Credential>
        ) -> dispatch::Result {
            let raw_origin = Self::ensure_root_or_signed(origin)?;

            Self::mutate_class_permissions(
                &raw_origin,
                with_credential,
                ClassPermissions::is_admin,
                class_id,
                |class_permissions| {
                    class_permissions.update_schemas_status = credential_set;
                    Ok(())
                }
            )
        }

        fn set_class_create_entities_set(
            origin,
            with_credential: Option<T::Credential>,
            class_id: ClassId,
            credential_set: CredentialSet<T::Credential>
        ) -> dispatch::Result {
            let raw_origin = Self::ensure_root_or_signed(origin)?;

            Self::mutate_class_permissions(
                &raw_origin,
                with_credential,
                ClassPermissions::is_admin,
                class_id,
                |class_permissions| {
                    class_permissions.create_entities = credential_set;
                    Ok(())
                }
            )
        }

        fn set_class_reference_constraint(
            origin,
            with_credential: Option<T::Credential>,
            class_id: ClassId,
            constraint: ReferenceConstraint<ClassId, u16>
        ) -> dispatch::Result {
            let raw_origin = Self::ensure_root_or_signed(origin)?;

            Self::mutate_class_permissions(
                &raw_origin,
                with_credential,
                ClassPermissions::is_admin,
                class_id,
                |class_permissions| {
                    class_permissions.reference_constraint = constraint;
                    Ok(())
                }
            )
        }

        // Setting a new maintainer for an entity may require having additional constraints.
        // So for now it is disabled.
        // pub fn set_entity_maintainer(
        //     origin,
        //     entity_id: EntityId,
        //     new_maintainer: Option<T::Credential>
        // ) -> dispatch::Result {
        //     ensure_root(origin)?;

        //     // ensure entity exists in the versioned store
        //     let _ = Self::get_class_id_by_entity_id(entity_id)?;

        //     <EntityMaintainerByEntityId<T>>::mutate(entity_id, |maintainer| {
        //         *maintainer = new_maintainer;
        //     });

        //     Ok(())
        // }

        // Permissioned proxy calls to versioned store

        pub fn create_class(
            origin,
            name: Vec<u8>,
            description: Vec<u8>,
            class_permissions: ClassPermissionsType<T>
        ) -> dispatch::Result {
            Self::ensure_can_create_class(origin)?;

            Self::ensure_class_name_is_valid(&name)?;

            Self::ensure_class_description_is_valid(&description)?;

            // is there a need to assert class_id is unique?

            let class_id = NextClassId::get();

            let class = Class::new(class_permissions, name, description);

            <ClassById<T>>::insert(&class_id, class);

            // Increment the next class id:
            NextClassId::mutate(|n| *n += 1);

            Ok(())
        }

        pub fn create_class_with_default_permissions(
            origin,
            name: Vec<u8>,
            description: Vec<u8>
        ) -> dispatch::Result {
            Self::create_class(origin, name, description, ClassPermissions::default())
        }

        pub fn add_class_schema(
            origin,
            with_credential: Option<T::Credential>,
            class_id: ClassId,
            existing_properties: Vec<u16>,
            new_properties: Vec<Property>
        ) -> dispatch::Result {
            let raw_origin = Self::ensure_root_or_signed(origin)?;

            Self::if_class_permissions_satisfied(
                &raw_origin,
                with_credential,
                None,
                ClassPermissions::can_add_class_schema,
                class_id,
                |_class_permissions, _access_level| {
                    // If a new property points at another class,
                    // at this point we don't enforce anything about reference constraints
                    // because of the chicken and egg problem. Instead enforcement is done
                    // at the time of creating an entity.
                    let _schema_index = Self::append_class_schema(class_id, existing_properties, new_properties)?;
                    Ok(())
                }
            )
        }

        pub fn update_class_schema_status(
            origin,
            with_credential: Option<T::Credential>,
            class_id: ClassId,
            schema_id: u16, // Do not type alias u16!! - u16,
            is_active: bool
        ) -> dispatch::Result {
            let raw_origin = Self::ensure_root_or_signed(origin)?;

            Self::if_class_permissions_satisfied(
                &raw_origin,
                with_credential,
                None,
                ClassPermissions::can_update_schema_status,
                class_id,
                |_class_permissions, _access_level| {
                    // If a new property points at another class,
                    // at this point we don't enforce anything about reference constraints
                    // because of the chicken and egg problem. Instead enforcement is done
                    // at the time of creating an entity.
                    Self::complete_class_schema_status_update(class_id, schema_id, is_active)?;
                    Ok(())
                }
            )
        }

        /// Creates a new entity of type class_id. The maintainer is set to be either None if the origin is root, or the provided credential
        /// associated with signer.
        pub fn create_entity(
            origin,
            with_credential: Option<T::Credential>,
            class_id: ClassId
        ) -> dispatch::Result {
            let raw_origin = Self::ensure_root_or_signed(origin)?;
            let _entity_id = Self::do_create_entity(&raw_origin, with_credential, class_id)?;
            Ok(())
        }

        pub fn add_schema_support_to_entity(
            origin,
            with_credential: Option<T::Credential>,
            as_entity_maintainer: bool,
            entity_id: EntityId,
            schema_id: u16, // Do not type alias u16!! - u16,
            property_values: BTreeMap<u16, PropertyValue>
        ) -> dispatch::Result {
            let raw_origin = Self::ensure_root_or_signed(origin)?;
            Self::do_add_schema_support_to_entity(&raw_origin, with_credential, as_entity_maintainer, entity_id, schema_id, property_values)
        }

        pub fn update_entity_property_values(
            origin,
            with_credential: Option<T::Credential>,
            as_entity_maintainer: bool,
            entity_id: EntityId,
            property_values: BTreeMap<u16, PropertyValue>
        ) -> dispatch::Result {
            let raw_origin = Self::ensure_root_or_signed(origin)?;
            Self::do_update_entity_property_values(&raw_origin, with_credential, as_entity_maintainer, entity_id, property_values)
        }

        pub fn clear_entity_property_vector(
            origin,
            with_credential: Option<T::Credential>,
            as_entity_maintainer: bool,
            entity_id: EntityId,
            in_class_schema_property_id: u16
        ) -> dispatch::Result {
            let raw_origin = Self::ensure_root_or_signed(origin)?;
            Self::do_clear_entity_property_vector(&raw_origin, with_credential, as_entity_maintainer, entity_id, in_class_schema_property_id)
        }

        pub fn remove_at_entity_property_vector(
            origin,
            with_credential: Option<T::Credential>,
            as_entity_maintainer: bool,
            entity_id: EntityId,
            in_class_schema_property_id: u16,
            index_in_property_vec: u32,
            nonce: T::Nonce
        ) -> dispatch::Result {
            let raw_origin = Self::ensure_root_or_signed(origin)?;
            Self::do_remove_at_entity_property_vector(&raw_origin, with_credential, as_entity_maintainer, entity_id, in_class_schema_property_id, index_in_property_vec, nonce)
        }

        pub fn insert_at_entity_property_vector(
            origin,
            with_credential: Option<T::Credential>,
            as_entity_maintainer: bool,
            entity_id: EntityId,
            in_class_schema_property_id: u16,
            index_in_property_vec: u32,
            property_value: PropertyValue,
            nonce: T::Nonce
        ) -> dispatch::Result {
            let raw_origin = Self::ensure_root_or_signed(origin)?;
            Self::do_insert_at_entity_property_vector(
                &raw_origin,
                with_credential,
                as_entity_maintainer,
                entity_id,
                in_class_schema_property_id,
                index_in_property_vec,
                property_value,
                nonce
            )
        }

        pub fn transaction(origin, operations: Vec<Operation<T::Credential>>) -> dispatch::Result {
            // This map holds the EntityId of the entity created as a result of executing a CreateEntity Operation
            // keyed by the indexed of the operation, in the operations vector.
            let mut entity_created_in_operation: BTreeMap<usize, EntityId> = BTreeMap::new();

            let raw_origin = Self::ensure_root_or_signed(origin)?;

            for (op_index, operation) in operations.into_iter().enumerate() {
                match operation.operation_type {
                    OperationType::CreateEntity(create_entity_operation) => {
                        let entity_id = Self::do_create_entity(&raw_origin, operation.with_credential, create_entity_operation.class_id)?;
                        entity_created_in_operation.insert(op_index, entity_id);
                    },
                    OperationType::UpdatePropertyValues(update_property_values_operation) => {
                        let entity_id = operations::parametrized_entity_to_entity_id(&entity_created_in_operation, update_property_values_operation.entity_id)?;
                        let property_values = operations::parametrized_property_values_to_property_values(&entity_created_in_operation, update_property_values_operation.new_parametrized_property_values)?;
                        Self::do_update_entity_property_values(&raw_origin, operation.with_credential, operation.as_entity_maintainer, entity_id, property_values)?;
                    },
                    OperationType::AddSchemaSupportToEntity(add_schema_support_to_entity_operation) => {
                        let entity_id = operations::parametrized_entity_to_entity_id(&entity_created_in_operation, add_schema_support_to_entity_operation.entity_id)?;
                        let schema_id = add_schema_support_to_entity_operation.schema_id;
                        let property_values = operations::parametrized_property_values_to_property_values(&entity_created_in_operation, add_schema_support_to_entity_operation.parametrized_property_values)?;
                        Self::do_add_schema_support_to_entity(&raw_origin, operation.with_credential, operation.as_entity_maintainer, entity_id, schema_id, property_values)?;
                    }
                }
            }

            Ok(())
        }
    }
}

impl<T: Trait> Module<T> {
    fn ensure_root_or_signed(
        origin: T::Origin,
    ) -> Result<system::RawOrigin<T::AccountId>, &'static str> {
        match origin.into() {
            Ok(system::RawOrigin::Root) => Ok(system::RawOrigin::Root),
            Ok(system::RawOrigin::Signed(account_id)) => Ok(system::RawOrigin::Signed(account_id)),
            _ => Err("BadOrigin:ExpectedRootOrSigned"),
        }
    }

    fn ensure_can_create_class(origin: T::Origin) -> Result<(), &'static str> {
        let raw_origin = Self::ensure_root_or_signed(origin)?;

        let can_create_class = match raw_origin {
            system::RawOrigin::Root => true,
            system::RawOrigin::Signed(sender) => {
                T::CreateClassPermissionsChecker::account_can_create_class_permissions(&sender)
            }
            _ => false,
        };
        ensure!(can_create_class, "NotPermittedToCreateClass");
        Ok(())
    }

    fn do_create_entity(
        raw_origin: &system::RawOrigin<T::AccountId>,
        with_credential: Option<T::Credential>,
        class_id: ClassId,
    ) -> Result<EntityId, &'static str> {
        Self::if_class_permissions_satisfied(
            raw_origin,
            with_credential,
            None,
            ClassPermissions::can_create_entity,
            class_id,
            |_class_permissions, access_level| {
                let entity_id = Self::perform_entity_creation(class_id);

                // Note: mutating value to None is equivalient to removing the value from storage map
                <EntityMaintainerByEntityId<T>>::mutate(
                    entity_id,
                    |maintainer| match access_level {
                        AccessLevel::System => *maintainer = None,
                        AccessLevel::Credential(credential) => *maintainer = Some(*credential),
                        _ => *maintainer = None,
                    },
                );

                Ok(entity_id)
            },
        )
    }

    fn perform_entity_creation(class_id: ClassId) -> EntityId {
        let entity_id = NextEntityId::get();

        let new_entity = Entity::<T>::new(class_id, BTreeSet::new(), BTreeMap::new());

        // Save newly created entity:
        EntityById::insert(entity_id, new_entity);

        // Increment the next entity id:
        NextEntityId::mutate(|n| *n += 1);

        entity_id
    }

    fn do_update_entity_property_values(
        raw_origin: &system::RawOrigin<T::AccountId>,
        with_credential: Option<T::Credential>,
        as_entity_maintainer: bool,
        entity_id: EntityId,
        property_values: BTreeMap<u16, PropertyValue>,
    ) -> dispatch::Result {
        let class_id = Self::get_class_id_by_entity_id(entity_id)?;

        Self::ensure_internal_property_values_permitted(class_id, &property_values)?;

        let as_entity_maintainer = if as_entity_maintainer {
            Some(entity_id)
        } else {
            None
        };

        Self::if_class_permissions_satisfied(
            raw_origin,
            with_credential,
            as_entity_maintainer,
            ClassPermissions::can_update_entity,
            class_id,
            |_class_permissions, _access_level| {
                Self::complete_entity_property_values_update(entity_id, property_values)
            },
        )
    }

    fn do_clear_entity_property_vector(
        raw_origin: &system::RawOrigin<T::AccountId>,
        with_credential: Option<T::Credential>,
        as_entity_maintainer: bool,
        entity_id: EntityId,
        in_class_schema_property_id: u16,
    ) -> dispatch::Result {
        let class_id = Self::get_class_id_by_entity_id(entity_id)?;

        let as_entity_maintainer = if as_entity_maintainer {
            Some(entity_id)
        } else {
            None
        };

        Self::if_class_permissions_satisfied(
            raw_origin,
            with_credential,
            as_entity_maintainer,
            ClassPermissions::can_update_entity,
            class_id,
            |_class_permissions, _access_level| {
                Self::complete_entity_property_vector_cleaning(
                    entity_id,
                    in_class_schema_property_id,
                )
            },
        )
    }

    fn do_remove_at_entity_property_vector(
        raw_origin: &system::RawOrigin<T::AccountId>,
        with_credential: Option<T::Credential>,
        as_entity_maintainer: bool,
        entity_id: EntityId,
        in_class_schema_property_id: u16,
        index_in_property_vec: u32,
        nonce: T::Nonce
    ) -> dispatch::Result {
        let class_id = Self::get_class_id_by_entity_id(entity_id)?;

        let as_entity_maintainer = if as_entity_maintainer {
            Some(entity_id)
        } else {
            None
        };

        Self::if_class_permissions_satisfied(
            raw_origin,
            with_credential,
            as_entity_maintainer,
            ClassPermissions::can_update_entity,
            class_id,
            |_class_permissions, _access_level| {
                Self::complete_remove_at_entity_property_vector(
                    entity_id,
                    in_class_schema_property_id,
                    index_in_property_vec,
                    nonce
                )
            },
        )
    }

    fn do_insert_at_entity_property_vector(
        raw_origin: &system::RawOrigin<T::AccountId>,
        with_credential: Option<T::Credential>,
        as_entity_maintainer: bool,
        entity_id: EntityId,
        in_class_schema_property_id: u16,
        index_in_property_vec: u32,
        property_value: PropertyValue,
        nonce: T::Nonce
    ) -> dispatch::Result {
        let class_id = Self::get_class_id_by_entity_id(entity_id)?;

        let as_entity_maintainer = if as_entity_maintainer {
            Some(entity_id)
        } else {
            None
        };

        Self::if_class_permissions_satisfied(
            raw_origin,
            with_credential,
            as_entity_maintainer,
            ClassPermissions::can_update_entity,
            class_id,
            |_class_permissions, _access_level| {
                Self::complete_insert_at_entity_property_vector(
                    entity_id,
                    in_class_schema_property_id,
                    index_in_property_vec,
                    property_value,
                    nonce
                )
            },
        )
    }

    pub fn complete_class_schema_status_update(
        class_id: ClassId,
        schema_id: u16, // Do not type alias u16!! - u16,
        schema_status: bool,
    ) -> dispatch::Result {
        // Check that schema_id is a valid index of class schemas vector:
        Self::ensure_class_schema_id_exists(&Self::class_by_id(class_id), schema_id)?;
        <ClassById<T>>::mutate(class_id, |class| {
            class.update_schema_status(schema_id, schema_status)
        });
        Ok(())
    }

    pub fn complete_entity_property_values_update(
        entity_id: EntityId,
        new_property_values: BTreeMap<u16, PropertyValue>,
    ) -> dispatch::Result {
        Self::ensure_known_entity_id(entity_id)?;

        let (entity, class) = Self::get_entity_and_class(entity_id);

        // Get current property values of an entity as a mutable vector,
        // so we can update them if new values provided present in new_property_values.
        let mut updated_values = entity.values;
        let mut vec_value_nonces = entity.vec_value_nonces;
        let mut updated = false;
        // Iterate over a vector of new values and update corresponding properties
        // of this entity if new values are valid.
        for (id, new_value) in new_property_values.into_iter() {
            // Try to find a current property value in the entity
            // by matching its id to the id of a property with an updated value.
            if let Some(current_prop_value) = updated_values.get_mut(&id) {
                // Get class-level information about this property
                if let Some(class_prop) = class.properties.get(id as usize) {
                    // Validate a new property value against the type of this property
                    // and check any additional constraints like the length of a vector
                    // if it's a vector property or the length of a text if it's a text property.
                    Self::ensure_property_value_to_update_is_valid(&new_value, class_prop)?;

                    // Update a current prop value in a mutable vector, if a new value is valid.
                    *current_prop_value = new_value;
                    if current_prop_value.is_vec() {
                        // Update last block of vec prop value if update performed
                        Self::refresh_vec_value_nonces(id, &mut vec_value_nonces);
                    }
                    updated = true;
                }
            } else {
                // Throw an error if a property was not found on entity
                // by an in-class index of a property update.
                return Err(ERROR_UNKNOWN_ENTITY_PROP_ID);
            }
        }

        // If property values should be updated:
        if updated {
            <EntityById<T>>::mutate(entity_id, |entity| {
                entity.values = updated_values;
                entity.vec_value_nonces = vec_value_nonces;
            });
        }

        Ok(())
    }

    fn refresh_vec_value_nonces(
        id: u16,
        vec_value_nonces: &mut BTreeMap<u16, T::Nonce>,
    ) {
        if let Some(nonce) = vec_value_nonces.get_mut(&id) {
            *nonce += T::Nonce::one();
        } else {
            // If there no nonce entry under a given key, we need to initialize it manually with one nonce, as given entity value exist 
            // and first vec value specific operation was already performed
            vec_value_nonces.insert(id, T::Nonce::one());
        }
    }

    fn complete_entity_property_vector_cleaning(
        entity_id: EntityId,
        in_class_schema_property_id: u16,
    ) -> dispatch::Result {
        Self::ensure_known_entity_id(entity_id)?;
        let entity = Self::entity_by_id(entity_id);

        match entity.values.get(&in_class_schema_property_id) {
            Some(current_prop_value) if current_prop_value.is_vec() => (),
            Some(_) => return Err(ERROR_PROP_VALUE_UNDER_GIVEN_INDEX_IS_NOT_A_VECTOR),
            _ =>
            // Throw an error if a property was not found on entity
            // by an in-class index of a property update.
            {
                return Err(ERROR_UNKNOWN_ENTITY_PROP_ID)
            }
        }

        // Clear property value vector:
        <EntityById<T>>::mutate(entity_id, |entity| {
            if let Some(current_property_value_vec) =
                entity.values.get_mut(&in_class_schema_property_id)
            {
                current_property_value_vec.vec_clear();
            }
            Self::refresh_vec_value_nonces(
                in_class_schema_property_id,
                &mut entity.vec_value_nonces,
            );
        });

        Ok(())
    }

    fn complete_remove_at_entity_property_vector(
        entity_id: EntityId,
        in_class_schema_property_id: u16,
        index_in_property_vec: u32,
        nonce: T::Nonce
    ) -> dispatch::Result {
        Self::ensure_known_entity_id(entity_id)?;
        let entity = Self::entity_by_id(entity_id);

        // Ensure property value vector nonces equality to avoid possible data races,
        // when performing vector specific operations
        Self::ensure_nonce_equality(
            in_class_schema_property_id,
            &entity.vec_value_nonces,
            nonce
        )?;

        match entity.values.get(&in_class_schema_property_id) {
            Some(current_prop_value) if current_prop_value.is_vec() => (),
            Some(_) => return Err(ERROR_PROP_VALUE_UNDER_GIVEN_INDEX_IS_NOT_A_VECTOR),
            _ =>
            // Throw an error if a property was not found on entity
            // by an in-class index of a property update.
            {
                return Err(ERROR_UNKNOWN_ENTITY_PROP_ID)
            }
        }

        // Remove property value vector
        <EntityById<T>>::mutate(entity_id, |entity| {
            if let Some(current_prop_value) = entity.values.get_mut(&in_class_schema_property_id) {
                current_prop_value.vec_remove_at(index_in_property_vec)
            }
            Self::refresh_vec_value_nonces(
                in_class_schema_property_id,
                &mut entity.vec_value_nonces,
            );
        });

        Ok(())
    }

    fn complete_insert_at_entity_property_vector(
        entity_id: EntityId,
        in_class_schema_property_id: u16,
        index_in_property_vec: u32,
        property_value: PropertyValue,
        nonce: T::Nonce
    ) -> dispatch::Result {
        Self::ensure_known_entity_id(entity_id)?;

        let (entity, class) = Self::get_entity_and_class(entity_id);

        // Ensure property value vector nonces equality to avoid possible data races,
        // when performing vector specific operations
        Self::ensure_nonce_equality(
            in_class_schema_property_id,
            &entity.vec_value_nonces,
            nonce
        )?;
        // Get class-level information about this property
        if let Some(class_prop) = class.properties.get(in_class_schema_property_id as usize) {
            // Try to find a current property value in the entity
            // by matching its id to the id of a property with an updated value.
            match entity.values.get(&in_class_schema_property_id) {
                Some(entity_prop_value) if entity_prop_value.is_vec() => {
                    // Validate a new property value against the type of this property
                    // and check any additional constraints like the length of a vector
                    // if it's a vector property or the length of a text if it's a text property.
                    Self::ensure_prop_value_can_be_insert_at_prop_vec(
                        &property_value,
                        entity_prop_value,
                        class_prop,
                    )?;
                }
                Some(_) => return Err(ERROR_PROP_VALUE_UNDER_GIVEN_INDEX_IS_NOT_A_VECTOR),
                _ => (),
            }
        } else {
            // Throw an error if a property was not found on entity
            // by an in-class index of a property update.
            {
                return Err(ERROR_UNKNOWN_ENTITY_PROP_ID);
            }
        }

        // Insert property value into property value vector
        <EntityById<T>>::mutate(entity_id, |entity| {
            if let Some(current_prop_value) = entity.values.get_mut(&in_class_schema_property_id) {
                current_prop_value.vec_insert_at(index_in_property_vec, property_value)
            }
            Self::refresh_vec_value_nonces(
                in_class_schema_property_id,
                &mut entity.vec_value_nonces,
            );
        });

        Ok(())
    }

    fn do_add_schema_support_to_entity(
        raw_origin: &system::RawOrigin<T::AccountId>,
        with_credential: Option<T::Credential>,
        as_entity_maintainer: bool,
        entity_id: EntityId,
        schema_id: u16,
        property_values: BTreeMap<u16, PropertyValue>,
    ) -> dispatch::Result {
        // class id of the entity being updated
        let class_id = Self::get_class_id_by_entity_id(entity_id)?;

        Self::ensure_internal_property_values_permitted(class_id, &property_values)?;

        let as_entity_maintainer = if as_entity_maintainer {
            Some(entity_id)
        } else {
            None
        };

        Self::if_class_permissions_satisfied(
            raw_origin,
            with_credential,
            as_entity_maintainer,
            ClassPermissions::can_update_entity,
            class_id,
            |_class_permissions, _access_level| {
                Self::add_entity_schema_support(entity_id, schema_id, property_values)
            },
        )
    }

    /// Derives the AccessLevel the caller is attempting to act with.
    /// It expects only signed or root origin.
    fn derive_access_level(
        raw_origin: &system::RawOrigin<T::AccountId>,
        with_credential: Option<T::Credential>,
        as_entity_maintainer: Option<EntityId>,
    ) -> Result<AccessLevel<T::Credential>, &'static str> {
        match raw_origin {
            system::RawOrigin::Root => Ok(AccessLevel::System),
            system::RawOrigin::Signed(account_id) => {
                if let Some(credential) = with_credential {
                    if T::CredentialChecker::account_has_credential(&account_id, credential) {
                        if let Some(entity_id) = as_entity_maintainer {
                            // is entity maintained by system
                            ensure!(
                                <EntityMaintainerByEntityId<T>>::exists(entity_id),
                                "NotEnityMaintainer"
                            );
                            // ensure entity maintainer matches
                            match Self::entity_maintainer_by_entity_id(entity_id) {
                                Some(maintainer_credential)
                                    if credential == maintainer_credential =>
                                {
                                    Ok(AccessLevel::EntityMaintainer)
                                }
                                _ => Err("NotEnityMaintainer"),
                            }
                        } else {
                            Ok(AccessLevel::Credential(credential))
                        }
                    } else {
                        Err("OriginCannotActWithRequestedCredential")
                    }
                } else {
                    Ok(AccessLevel::Unspecified)
                }
            }
            _ => Err("BadOrigin:ExpectedRootOrSigned"),
        }
    }

    /// Returns the stored class if exist, error otherwise.
    fn ensure_class_exists(class_id: ClassId) -> Result<Class<T>, &'static str> {
        ensure!(<ClassById<T>>::exists(class_id), ERROR_CLASS_NOT_FOUND);
        Ok(Self::class_by_id(class_id))
    }

    /// Derives the access level of the caller.
    /// If the predicate passes, the mutate method is invoked.
    fn mutate_class_permissions<Predicate, Mutate>(
        raw_origin: &system::RawOrigin<T::AccountId>,
        with_credential: Option<T::Credential>,
        // predicate to test
        predicate: Predicate,
        // class permissions to perform mutation on if it exists
        class_id: ClassId,
        // actual mutation to apply.
        mutate: Mutate,
    ) -> dispatch::Result
    where
        Predicate:
            FnOnce(&ClassPermissionsType<T>, &AccessLevel<T::Credential>) -> dispatch::Result,
        Mutate: FnOnce(&mut ClassPermissionsType<T>) -> dispatch::Result,
    {
        let access_level = Self::derive_access_level(raw_origin, with_credential, None)?;
        let class = Self::ensure_class_exists(class_id)?;
        predicate(class.get_permissions(), &access_level)?;
        <ClassById<T>>::mutate(class_id, |inner_class| {
            //It is safe to not check for an error here, as result always be  Ok(())
            let _ = mutate(inner_class.get_permissions_mut());
            // Refresh last permissions update block number.
            inner_class.refresh_last_permissions_update();
        });
        Ok(())
    }

    fn is_system(
        _: &ClassPermissionsType<T>,
        access_level: &AccessLevel<T::Credential>,
    ) -> dispatch::Result {
        if *access_level == AccessLevel::System {
            Ok(())
        } else {
            Err("NotRootOrigin")
        }
    }

    /// Derives the access level of the caller.
    /// If the peridcate passes the callback is invoked. Returns result of the callback
    /// or error from failed predicate.
    fn if_class_permissions_satisfied<Predicate, Callback, R>(
        raw_origin: &system::RawOrigin<T::AccountId>,
        with_credential: Option<T::Credential>,
        as_entity_maintainer: Option<EntityId>,
        // predicate to test
        predicate: Predicate,
        // class permissions to test
        class_id: ClassId,
        // callback to invoke if predicate passes
        callback: Callback,
    ) -> Result<R, &'static str>
    where
        Predicate:
            FnOnce(&ClassPermissionsType<T>, &AccessLevel<T::Credential>) -> dispatch::Result,
        Callback: FnOnce(
            &ClassPermissionsType<T>,
            &AccessLevel<T::Credential>,
        ) -> Result<R, &'static str>,
    {
        let access_level =
            Self::derive_access_level(raw_origin, with_credential, as_entity_maintainer)?;
        let class = Self::ensure_class_exists(class_id)?;
        let class_permissions = class.get_permissions();
        predicate(class_permissions, &access_level)?;
        callback(class_permissions, &access_level)
    }

    fn get_class_id_by_entity_id(entity_id: EntityId) -> Result<ClassId, &'static str> {
        // use a utility method on versioned_store module
        ensure!(<EntityById<T>>::exists(entity_id), "EntityNotFound");
        let entity = Self::entity_by_id(entity_id);
        Ok(entity.class_id)
    }

    // Ensures property_values of type Reference that point to a class,
    // the target entity and class exists and constraint allows it.
    fn ensure_internal_property_values_permitted(
        source_class_id: ClassId,
        property_values: &BTreeMap<u16, PropertyValue>,
    ) -> dispatch::Result {
        for (in_class_index, property_value) in property_values.iter() {
            if let PropertyValue::Reference(ref target_entity_id) = property_value {
                // get the class permissions for target class
                let target_class_id = Self::get_class_id_by_entity_id(*target_entity_id)?;
                // assert class permissions exists for target class
                let class = Self::class_by_id(target_class_id);

                // ensure internal reference is permitted
                match &class.get_permissions().reference_constraint {
                    ReferenceConstraint::NoConstraint => Ok(()),
                    ReferenceConstraint::NoReferencingAllowed => {
                        Err("EntityCannotReferenceTargetEntity")
                    }
                    ReferenceConstraint::Restricted(permitted_properties) => {
                        if permitted_properties.contains(&PropertyOfClass {
                            class_id: source_class_id,
                            property_index: *in_class_index,
                        }) {
                            Ok(())
                        } else {
                            Err("EntityCannotReferenceTargetEntity")
                        }
                    }
                }?;
            }
        }

        // if we reach here all Internal properties have passed the constraint check
        Ok(())
    }

    fn ensure_nonce_equality(
        in_class_schema_property_id: u16,
        vec_value_nonces: &BTreeMap<u16, T::Nonce>,
        nonce: T::Nonce
    ) -> dispatch::Result {
        if let Some(vec_value_nonce) = vec_value_nonces.get(&in_class_schema_property_id) {
            ensure!(
                *vec_value_nonce == nonce,
                ERROR_PROP_VALUE_VEC_NONCES_DOES_NOT_MATCH
            );
        } else {
            ensure!(
                nonce == T::Nonce::zero(),
                ERROR_PROP_VALUE_VEC_NONCES_DOES_NOT_MATCH
            );
        }
        Ok(())
    }

    /// Returns an index of a newly added class schema on success.
    pub fn append_class_schema(
        class_id: ClassId,
        existing_properties: Vec<u16>,
        new_properties: Vec<Property>,
    ) -> Result<u16, &'static str> {
        Self::ensure_known_class_id(class_id)?;

        let non_empty_schema = !existing_properties.is_empty() || !new_properties.is_empty();

        ensure!(non_empty_schema, ERROR_NO_PROPS_IN_CLASS_SCHEMA);

        let class = <ClassById<T>>::get(class_id);

        // TODO Use BTreeSet for prop unique names when switched to Substrate 2.
        // There is no support for BTreeSet in Substrate 1 runtime.
        // use rstd::collections::btree_set::BTreeSet;
        let mut unique_prop_names = BTreeSet::new();
        for prop in class.properties.iter() {
            unique_prop_names.insert(prop.name.clone());
        }

        for prop in new_properties.iter() {
            Self::ensure_property_name_is_valid(&prop.name)?;
            Self::ensure_property_description_is_valid(&prop.description)?;

            // Check that the name of a new property is unique within its class.
            ensure!(
                !unique_prop_names.contains(&prop.name),
                ERROR_PROP_NAME_NOT_UNIQUE_IN_CLASS
            );
            unique_prop_names.insert(prop.name.clone());
        }

        // Check that existing props are valid indices of class properties vector:
        let has_unknown_props = existing_properties
            .iter()
            .any(|&prop_id| prop_id >= class.properties.len() as u16);
        ensure!(
            !has_unknown_props,
            ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_PROP_INDEX
        );

        // Check validity of Internal(ClassId) for new_properties.
        let has_unknown_internal_id = new_properties.iter().any(|prop| match prop.prop_type {
            PropertyType::Reference(other_class_id) => !<ClassById<T>>::exists(other_class_id),
            _ => false,
        });
        ensure!(
            !has_unknown_internal_id,
            ERROR_CLASS_SCHEMA_REFERS_UNKNOWN_INTERNAL_ID
        );

        // Use the current length of schemas in this class as an index
        // for the next schema that will be sent in a result of this function.
        let schema_idx = class.schemas.len() as u16;

        let mut schema = Schema::new(existing_properties);

        let mut updated_class_props = class.properties;
        new_properties.into_iter().for_each(|prop| {
            let prop_id = updated_class_props.len() as u16;
            updated_class_props.push(prop);
            schema.properties.push(prop_id);
        });

        <ClassById<T>>::mutate(class_id, |class| {
            class.properties = updated_class_props;
            class.schemas.push(schema);
        });

        Ok(schema_idx)
    }

    pub fn add_entity_schema_support(
        entity_id: EntityId,
        schema_id: u16,
        property_values: BTreeMap<u16, PropertyValue>,
    ) -> dispatch::Result {
        Self::ensure_known_entity_id(entity_id)?;

        let (entity, class) = Self::get_entity_and_class(entity_id);

        // Check that schema_id is a valid index of class schemas vector:
        Self::ensure_class_schema_id_exists(&class, schema_id)?;

        // Ensure class schema is active
        Self::ensure_class_schema_is_active(&class, schema_id)?;

        // Check that schema id is not yet added to this entity:
        Self::ensure_schema_id_is_not_added(&entity, schema_id)?;

        let class_schema_opt = class.schemas.get(schema_id as usize);
        let schema_prop_ids = class_schema_opt.unwrap().properties.clone();

        let current_entity_values = entity.values.clone();
        let mut appended_entity_values = entity.values;

        for prop_id in schema_prop_ids.iter() {
            if current_entity_values.contains_key(prop_id) {
                // A property is already added to the entity and cannot be updated
                // while adding a schema support to this entity.
                continue;
            }

            let class_prop = &class.properties[*prop_id as usize];

            // If a value was not povided for the property of this schema:
            if let Some(new_value) = property_values.get(prop_id) {
                Self::ensure_property_value_to_update_is_valid(new_value, class_prop)?;

                appended_entity_values.insert(*prop_id, new_value.to_owned());
            } else {
                // All required prop values should be are provided
                if class_prop.required {
                    return Err(ERROR_MISSING_REQUIRED_PROP);
                }
                // Add all missing non required schema prop values as PropertyValue::None
                else {
                    appended_entity_values.insert(*prop_id, PropertyValue::Bool(false));
                }
            }
        }

        <EntityById<T>>::mutate(entity_id, |entity| {
            // Add a new schema to the list of schemas supported by this entity.
            entity.supported_schemas.insert(schema_id);

            // Update entity values only if new properties have been added.
            if appended_entity_values.len() > entity.values.len() {
                entity.values = appended_entity_values;
            }
        });

        Ok(())
    }

    // Commented out for now <- requested by Bedeho.
    // pub fn delete_entity(entity_id: EntityId) -> dispatch::Result {
    //     Self::ensure_known_entity_id(entity_id)?;

    //     let is_deleted = EntityById::get(entity_id).deleted;
    //     ensure!(!is_deleted, ERROR_ENTITY_ALREADY_DELETED);

    //     EntityById::mutate(entity_id, |x| {
    //         x.deleted = true;
    //     });

    //     Self::deposit_event(RawEvent::EntityDeleted(entity_id));
    //     Ok(())
    // }

    // Helper functions:
    // ----------------------------------------------------------------

    pub fn ensure_known_class_id(class_id: ClassId) -> dispatch::Result {
        ensure!(<ClassById<T>>::exists(class_id), ERROR_CLASS_NOT_FOUND);
        Ok(())
    }

    pub fn ensure_known_entity_id(entity_id: EntityId) -> dispatch::Result {
        ensure!(<EntityById<T>>::exists(entity_id), ERROR_ENTITY_NOT_FOUND);
        Ok(())
    }

    pub fn ensure_class_schema_id_exists(class: &Class<T>, schema_id: u16) -> dispatch::Result {
        ensure!(
            schema_id < class.schemas.len() as u16,
            ERROR_UNKNOWN_CLASS_SCHEMA_ID
        );
        Ok(())
    }

    pub fn ensure_class_schema_is_active(class: &Class<T>, schema_id: u16) -> dispatch::Result {
        ensure!(
            class.is_active_schema(schema_id),
            ERROR_CLASS_SCHEMA_NOT_ACTIVE
        );
        Ok(())
    }

    pub fn ensure_schema_id_is_not_added(entity: &Entity<T>, schema_id: u16) -> dispatch::Result {
        let schema_not_added = !entity.supported_schemas.contains(&schema_id);
        ensure!(schema_not_added, ERROR_SCHEMA_ALREADY_ADDED_TO_ENTITY);
        Ok(())
    }

    pub fn ensure_valid_internal_prop(value: &PropertyValue, prop: &Property) -> dispatch::Result {
        match (value, prop.prop_type) {
            (PV::Reference(entity_id), PT::Reference(class_id)) => {
                Self::ensure_known_class_id(class_id)?;
                Self::ensure_known_entity_id(*entity_id)?;
                let entity = Self::entity_by_id(entity_id);
                ensure!(
                    entity.class_id == class_id,
                    ERROR_INTERNAL_PROP_DOES_NOT_MATCH_ITS_CLASS
                );
                Ok(())
            }
            _ => Ok(()),
        }
    }

    pub fn is_unknown_internal_entity_id(id: PropertyValue) -> bool {
        if let PropertyValue::Reference(entity_id) = id {
            !<EntityById<T>>::exists(entity_id)
        } else {
            false
        }
    }

    pub fn get_entity_and_class(entity_id: EntityId) -> (Entity<T>, Class<T>) {
        let entity = <EntityById<T>>::get(entity_id);
        let class = ClassById::get(entity.class_id);
        (entity, class)
    }

    pub fn ensure_property_value_to_update_is_valid(
        value: &PropertyValue,
        prop: &Property,
    ) -> dispatch::Result {
        Self::ensure_prop_value_matches_its_type(value, prop)?;
        Self::ensure_valid_internal_prop(value, prop)?;
        Self::validate_max_len_if_text_prop(value, prop)?;
        Self::validate_max_len_if_vec_prop(value, prop)?;
        Ok(())
    }

    pub fn ensure_prop_value_can_be_insert_at_prop_vec(
        value: &PropertyValue,
        entity_prop_value: &PropertyValue,
        prop: &Property,
    ) -> dispatch::Result {
        fn validate_prop_vec_len_after_value_insert<T>(vec: &[T], max_len: u16) -> bool {
            vec.len() < max_len as usize
        }

        let is_valid_len = match (value, entity_prop_value, prop.prop_type) {
            // Single values
            (PV::Bool(_), PV::BoolVec(vec), PT::BoolVec(max_len)) => {
                validate_prop_vec_len_after_value_insert(vec, max_len)
            }
            (PV::Uint16(_), PV::Uint16Vec(vec), PT::Uint16Vec(max_len)) => {
                validate_prop_vec_len_after_value_insert(vec, max_len)
            }
            (PV::Uint32(_), PV::Uint32Vec(vec), PT::Uint32Vec(max_len)) => {
                validate_prop_vec_len_after_value_insert(vec, max_len)
            }
            (PV::Uint64(_), PV::Uint64Vec(vec), PT::Uint64Vec(max_len)) => {
                validate_prop_vec_len_after_value_insert(vec, max_len)
            }
            (PV::Int16(_), PV::Int16Vec(vec), PT::Int16Vec(max_len)) => {
                validate_prop_vec_len_after_value_insert(vec, max_len)
            }
            (PV::Int32(_), PV::Int32Vec(vec), PT::Int32Vec(max_len)) => {
                validate_prop_vec_len_after_value_insert(vec, max_len)
            }
            (PV::Int64(_), PV::Int64Vec(vec), PT::Int64Vec(max_len)) => {
                validate_prop_vec_len_after_value_insert(vec, max_len)
            }
            (PV::Text(text_item), PV::TextVec(vec), PT::TextVec(vec_max_len, text_max_len)) => {
                if validate_prop_vec_len_after_value_insert(vec, vec_max_len) {
                    Self::validate_max_len_of_text(text_item, text_max_len)?;
                    true
                } else {
                    false
                }
            }
            (
                PV::Reference(entity_id),
                PV::ReferenceVec(vec),
                PT::ReferenceVec(vec_max_len, class_id),
            ) => {
                Self::ensure_known_class_id(class_id)?;
                if validate_prop_vec_len_after_value_insert(vec, vec_max_len) {
                    Self::ensure_known_entity_id(*entity_id)?;
                    let entity = Self::entity_by_id(entity_id);
                    ensure!(
                        entity.class_id == class_id,
                        ERROR_INTERNAL_PROP_DOES_NOT_MATCH_ITS_CLASS
                    );
                    true
                } else {
                    false
                }
            }
            _ => return Err(ERROR_PROP_VALUE_TYPE_DOESNT_MATCH_INTERNAL_ENTITY_VECTOR_TYPE),
        };

        ensure!(is_valid_len, ERROR_ENTITY_PROP_VALUE_VECTOR_IS_TOO_LONG);
        Ok(())
    }

    pub fn validate_max_len_if_text_prop(
        value: &PropertyValue,
        prop: &Property,
    ) -> dispatch::Result {
        match (value, &prop.prop_type) {
            (PV::Text(text), PT::Text(max_len)) => Self::validate_max_len_of_text(text, *max_len),
            _ => Ok(()),
        }
    }

    pub fn validate_max_len_of_text(text: &[u8], max_len: u16) -> dispatch::Result {
        if text.len() <= max_len as usize {
            Ok(())
        } else {
            Err(ERROR_TEXT_PROP_IS_TOO_LONG)
        }
    }

    pub fn validate_max_len_if_vec_prop(
        value: &PropertyValue,
        prop: &Property,
    ) -> dispatch::Result {
        fn validate_vec_len<T>(vec: &[T], max_len: u16) -> bool {
            vec.len() <= max_len as usize
        }

        let is_valid_len = match (value, prop.prop_type) {
            (PV::BoolVec(vec), PT::BoolVec(max_len)) => validate_vec_len(vec, max_len),
            (PV::Uint16Vec(vec), PT::Uint16Vec(max_len)) => validate_vec_len(vec, max_len),
            (PV::Uint32Vec(vec), PT::Uint32Vec(max_len)) => validate_vec_len(vec, max_len),
            (PV::Uint64Vec(vec), PT::Uint64Vec(max_len)) => validate_vec_len(vec, max_len),
            (PV::Int16Vec(vec), PT::Int16Vec(max_len)) => validate_vec_len(vec, max_len),
            (PV::Int32Vec(vec), PT::Int32Vec(max_len)) => validate_vec_len(vec, max_len),
            (PV::Int64Vec(vec), PT::Int64Vec(max_len)) => validate_vec_len(vec, max_len),

            (PV::TextVec(vec), PT::TextVec(vec_max_len, text_max_len)) => {
                if validate_vec_len(vec, vec_max_len) {
                    for text_item in vec.iter() {
                        Self::validate_max_len_of_text(text_item, text_max_len)?;
                    }
                    true
                } else {
                    false
                }
            }

            (PV::ReferenceVec(vec), PT::ReferenceVec(vec_max_len, class_id)) => {
                Self::ensure_known_class_id(class_id)?;
                if validate_vec_len(vec, vec_max_len) {
                    for entity_id in vec.iter() {
                        Self::ensure_known_entity_id(*entity_id)?;
                        let entity = Self::entity_by_id(entity_id);
                        ensure!(
                            entity.class_id == class_id,
                            ERROR_INTERNAL_PROP_DOES_NOT_MATCH_ITS_CLASS
                        );
                    }
                    true
                } else {
                    false
                }
            }

            _ => true,
        };

        if is_valid_len {
            Ok(())
        } else {
            Err(ERROR_VEC_PROP_IS_TOO_LONG)
        }
    }

    pub fn ensure_prop_value_matches_its_type(
        value: &PropertyValue,
        prop: &Property,
    ) -> dispatch::Result {
        ensure!(
            Self::does_prop_value_match_type(value, prop),
            ERROR_PROP_VALUE_DONT_MATCH_TYPE
        );
        Ok(())
    }

    pub fn does_prop_value_match_type(value: &PropertyValue, prop: &Property) -> bool {
        // A non required property can be updated to None:
        if !prop.required && *value == PV::Bool(false) {
            return true;
        }
        match (value, &prop.prop_type) {
                // Single values
                (PV::Bool(_),     PT::Bool) |
                (PV::Uint16(_),   PT::Uint16) |
                (PV::Uint32(_),   PT::Uint32) |
                (PV::Uint64(_),   PT::Uint64) |
                (PV::Int16(_),    PT::Int16) |
                (PV::Int32(_),    PT::Int32) |
                (PV::Int64(_),    PT::Int64) |
                (PV::Text(_),     PT::Text(_)) |
                (PV::Reference(_), PT::Reference(_)) |
                // Vectors:
                (PV::BoolVec(_),     PT::BoolVec(_)) |
                (PV::Uint16Vec(_),   PT::Uint16Vec(_)) |
                (PV::Uint32Vec(_),   PT::Uint32Vec(_)) |
                (PV::Uint64Vec(_),   PT::Uint64Vec(_)) |
                (PV::Int16Vec(_),    PT::Int16Vec(_)) |
                (PV::Int32Vec(_),    PT::Int32Vec(_)) |
                (PV::Int64Vec(_),    PT::Int64Vec(_)) |
                (PV::TextVec(_),     PT::TextVec(_, _)) |
                (PV::ReferenceVec(_), PT::ReferenceVec(_, _)) => true,
                // (PV::External(_), PT::External(_)) => true,
                // (PV::ExternalVec(_), PT::ExternalVec(_, _)) => true,
                _ => false,
            }
    }

    pub fn ensure_property_name_is_valid(text: &[u8]) -> dispatch::Result {
        T::PropertyNameConstraint::get().ensure_valid(
            text.len(),
            ERROR_PROPERTY_NAME_TOO_SHORT,
            ERROR_PROPERTY_NAME_TOO_LONG,
        )
    }

    pub fn ensure_property_description_is_valid(text: &[u8]) -> dispatch::Result {
        T::PropertyDescriptionConstraint::get().ensure_valid(
            text.len(),
            ERROR_PROPERTY_DESCRIPTION_TOO_SHORT,
            ERROR_PROPERTY_DESCRIPTION_TOO_LONG,
        )
    }

    pub fn ensure_class_name_is_valid(text: &[u8]) -> dispatch::Result {
        T::ClassNameConstraint::get().ensure_valid(
            text.len(),
            ERROR_CLASS_NAME_TOO_SHORT,
            ERROR_CLASS_NAME_TOO_LONG,
        )
    }

    pub fn ensure_class_description_is_valid(text: &[u8]) -> dispatch::Result {
        T::ClassDescriptionConstraint::get().ensure_valid(
            text.len(),
            ERROR_CLASS_DESCRIPTION_TOO_SHORT,
            ERROR_CLASS_DESCRIPTION_TOO_LONG,
        )
    }
}
