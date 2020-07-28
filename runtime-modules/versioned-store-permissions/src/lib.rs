// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use codec::Codec;
use frame_support::{decl_module, decl_storage, ensure, Parameter};
use sp_arithmetic::traits::BaseArithmetic;
use sp_runtime::traits::{MaybeSerialize, Member};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::vec::Vec;

//TODO: Convert errors to the Substrate decl_error! macro.
/// Result with string error message. This exists for backward compatibility purpose.
pub type DispatchResult = Result<(), &'static str>;

// EntityId, ClassId -> should be configured on versioned_store::Trait
pub use versioned_store::{ClassId, ClassPropertyValue, EntityId, Property, PropertyValue};

mod constraint;
mod credentials;
mod mock;
mod operations;
mod permissions;
mod tests;

pub use constraint::*;
pub use credentials::*;
pub use operations::*;
pub use permissions::*;

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

pub type ClassPermissionsType<T> =
    ClassPermissions<ClassId, <T as Trait>::Credential, u16, <T as system::Trait>::BlockNumber>;

pub trait Trait: system::Trait + versioned_store::Trait {
    /// Type that represents an actor or group of actors in the system.
    type Credential: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + Clone
        + MaybeSerialize
        + Eq
        + PartialEq
        + Ord;

    /// External type for checking if an account has specified credential.
    type CredentialChecker: CredentialChecker<Self>;

    /// External type used to check if an account has permission to create new Classes.
    type CreateClassPermissionsChecker: CreateClassPermissionsChecker<Self>;
}

decl_storage! {
    trait Store for Module<T: Trait> as VersionedStorePermissions {
      /// ClassPermissions of corresponding Classes in the versioned store
      pub ClassPermissionsByClassId get(fn class_permissions_by_class_id): map hasher(blake2_128_concat)
        ClassId => ClassPermissionsType<T>;

      /// Owner of an entity in the versioned store. If it is None then it is owned by the system.
      pub EntityMaintainerByEntityId get(fn entity_maintainer_by_entity_id): map hasher(blake2_128_concat)
        EntityId => Option<T::Credential>;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        /// Sets the admins for a class
        #[weight = 10_000_000] // TODO: adjust weight
        fn set_class_admins(
            origin,
            class_id: ClassId,
            admins: CredentialSet<T::Credential>
        ) -> DispatchResult {
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
        #[weight = 10_000_000] // TODO: adjust weight
        fn set_class_entity_permissions(
            origin,
            with_credential: Option<T::Credential>,
            class_id: ClassId,
            entity_permissions: EntityPermissions<T::Credential>
        ) -> DispatchResult {
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

        #[weight = 10_000_000] // TODO: adjust weight
        fn set_class_entities_can_be_created(
            origin,
            with_credential: Option<T::Credential>,
            class_id: ClassId,
            can_be_created: bool
        ) -> DispatchResult {
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

        #[weight = 10_000_000] // TODO: adjust weight
        fn set_class_add_schemas_set(
            origin,
            with_credential: Option<T::Credential>,
            class_id: ClassId,
            credential_set: CredentialSet<T::Credential>
        ) -> DispatchResult {
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

        #[weight = 10_000_000] // TODO: adjust weight
        fn set_class_create_entities_set(
            origin,
            with_credential: Option<T::Credential>,
            class_id: ClassId,
            credential_set: CredentialSet<T::Credential>
        ) -> DispatchResult {
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

        #[weight = 10_000_000] // TODO: adjust weight
        fn set_class_reference_constraint(
            origin,
            with_credential: Option<T::Credential>,
            class_id: ClassId,
            constraint: ReferenceConstraint<ClassId, u16>
        ) -> DispatchResult {
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
        // ) -> DispatchResult {
        //     ensure_root(origin)?;

        //     // ensure entity exists in the versioned store
        //     let _ = Self::get_class_id_by_entity_id(entity_id)?;

        //     <EntityMaintainerByEntityId<T>>::mutate(entity_id, |maintainer| {
        //         *maintainer = new_maintainer;
        //     });

        //     Ok(())
        // }

        // Permissioned proxy calls to versioned store
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_class(
            origin,
            name: Vec<u8>,
            description: Vec<u8>,
            class_permissions: ClassPermissionsType<T>
        ) -> DispatchResult {
            let raw_origin = Self::ensure_root_or_signed(origin)?;

            let can_create_class = match raw_origin {
                system::RawOrigin::Root => true,
                system::RawOrigin::Signed(sender) => {
                    T::CreateClassPermissionsChecker::account_can_create_class_permissions(&sender)
                },
                _ => false
            };

            if can_create_class {
                let class_id = <versioned_store::Module<T>>::create_class(name, description)?;

                // is there a need to assert class_id is unique?

                <ClassPermissionsByClassId<T>>::insert(&class_id, class_permissions);

                Ok(())
            } else {
                Err("NotPermittedToCreateClass")
            }
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_class_with_default_permissions(
            origin,
            name: Vec<u8>,
            description: Vec<u8>
        ) -> DispatchResult {
            Self::create_class(origin, name, description, ClassPermissions::default())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn add_class_schema(
            origin,
            with_credential: Option<T::Credential>,
            class_id: ClassId,
            existing_properties: Vec<u16>,
            new_properties: Vec<Property>
        ) -> DispatchResult {
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
                    let _schema_index = <versioned_store::Module<T>>::add_class_schema(class_id, existing_properties, new_properties)?;
                    Ok(())
                }
            )
        }

        /// Creates a new entity of type class_id. The maintainer is set to be either None if the origin is root, or the provided credential
        /// associated with signer.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_entity(
            origin,
            with_credential: Option<T::Credential>,
            class_id: ClassId
        ) -> DispatchResult {
            let raw_origin = Self::ensure_root_or_signed(origin)?;
            let _entity_id = Self::do_create_entity(&raw_origin, with_credential, class_id)?;
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn add_schema_support_to_entity(
            origin,
            with_credential: Option<T::Credential>,
            as_entity_maintainer: bool,
            entity_id: EntityId,
            schema_id: u16, // Do not type alias u16!! - u16,
            property_values: Vec<ClassPropertyValue>
        ) -> DispatchResult {
            let raw_origin = Self::ensure_root_or_signed(origin)?;
            Self::do_add_schema_support_to_entity(&raw_origin, with_credential, as_entity_maintainer, entity_id, schema_id, property_values)
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_entity_property_values(
            origin,
            with_credential: Option<T::Credential>,
            as_entity_maintainer: bool,
            entity_id: EntityId,
            property_values: Vec<ClassPropertyValue>
        ) -> DispatchResult {
            let raw_origin = Self::ensure_root_or_signed(origin)?;
            Self::do_update_entity_property_values(&raw_origin, with_credential, as_entity_maintainer, entity_id, property_values)
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn transaction(origin, operations: Vec<Operation<T::Credential>>) -> DispatchResult {
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
                let entity_id = <versioned_store::Module<T>>::create_entity(class_id)?;

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

    fn do_update_entity_property_values(
        raw_origin: &system::RawOrigin<T::AccountId>,
        with_credential: Option<T::Credential>,
        as_entity_maintainer: bool,
        entity_id: EntityId,
        property_values: Vec<ClassPropertyValue>,
    ) -> DispatchResult {
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
                <versioned_store::Module<T>>::update_entity_property_values(
                    entity_id,
                    property_values,
                )
            },
        )
    }

    fn do_add_schema_support_to_entity(
        raw_origin: &system::RawOrigin<T::AccountId>,
        with_credential: Option<T::Credential>,
        as_entity_maintainer: bool,
        entity_id: EntityId,
        schema_id: u16,
        property_values: Vec<ClassPropertyValue>,
    ) -> DispatchResult {
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
                <versioned_store::Module<T>>::add_schema_support_to_entity(
                    entity_id,
                    schema_id,
                    property_values,
                )
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
                                <EntityMaintainerByEntityId<T>>::contains_key(entity_id),
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

    /// Returns the stored class permissions if exist, error otherwise.
    fn ensure_class_permissions(
        class_id: ClassId,
    ) -> Result<ClassPermissionsType<T>, &'static str> {
        ensure!(
            <ClassPermissionsByClassId<T>>::contains_key(class_id),
            "ClassPermissionsNotFoundByClassId"
        );
        Ok(Self::class_permissions_by_class_id(class_id))
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
    ) -> DispatchResult
    where
        Predicate: FnOnce(&ClassPermissionsType<T>, &AccessLevel<T::Credential>) -> DispatchResult,
        Mutate: FnOnce(&mut ClassPermissionsType<T>) -> DispatchResult,
    {
        let access_level = Self::derive_access_level(raw_origin, with_credential, None)?;
        let mut class_permissions = Self::ensure_class_permissions(class_id)?;

        predicate(&class_permissions, &access_level)?;
        mutate(&mut class_permissions)?;
        class_permissions.last_permissions_update = <system::Module<T>>::block_number();
        <ClassPermissionsByClassId<T>>::insert(class_id, class_permissions);
        Ok(())
    }

    fn is_system(
        _: &ClassPermissionsType<T>,
        access_level: &AccessLevel<T::Credential>,
    ) -> DispatchResult {
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
        Predicate: FnOnce(&ClassPermissionsType<T>, &AccessLevel<T::Credential>) -> DispatchResult,
        Callback: FnOnce(
            &ClassPermissionsType<T>,
            &AccessLevel<T::Credential>,
        ) -> Result<R, &'static str>,
    {
        let access_level =
            Self::derive_access_level(raw_origin, with_credential, as_entity_maintainer)?;
        let class_permissions = Self::ensure_class_permissions(class_id)?;

        predicate(&class_permissions, &access_level)?;
        callback(&class_permissions, &access_level)
    }

    fn get_class_id_by_entity_id(entity_id: EntityId) -> Result<ClassId, &'static str> {
        // use a utility method on versioned_store module
        ensure!(
            versioned_store::EntityById::contains_key(entity_id),
            "EntityNotFound"
        );
        let entity = <versioned_store::Module<T>>::entity_by_id(entity_id);
        Ok(entity.class_id)
    }

    // Ensures property_values of type Internal that point to a class,
    // the target entity and class exists and constraint allows it.
    fn ensure_internal_property_values_permitted(
        source_class_id: ClassId,
        property_values: &[ClassPropertyValue],
    ) -> DispatchResult {
        for property_value in property_values.iter() {
            if let PropertyValue::Internal(ref target_entity_id) = property_value.value {
                // get the class permissions for target class
                let target_class_id = Self::get_class_id_by_entity_id(*target_entity_id)?;
                // assert class permissions exists for target class
                let class_permissions = Self::class_permissions_by_class_id(target_class_id);

                // ensure internal reference is permitted
                match class_permissions.reference_constraint {
                    ReferenceConstraint::NoConstraint => Ok(()),
                    ReferenceConstraint::NoReferencingAllowed => {
                        Err("EntityCannotReferenceTargetEntity")
                    }
                    ReferenceConstraint::Restricted(permitted_properties) => {
                        if permitted_properties.contains(&PropertyOfClass {
                            class_id: source_class_id,
                            property_index: property_value.in_class_index,
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
}
