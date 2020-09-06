use crate::{Error, InputPropertyValue, InputValue, PropertyId, SchemaId, Trait, VecInputValue};
use codec::{Decode, Encode};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::prelude::*;

/// Parametrized entity property value
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub enum ParametrizedPropertyValue<T: Trait> {
    /// Same fields as normal InputPropertyValue
    InputPropertyValue(
        InputPropertyValue<<T as system::Trait>::Hashing, <T as system::Trait>::Hash, T::EntityId>,
    ),

    /// This is the index of an operation creating an entity in the transaction/batch operations
    InternalEntityJustAdded(u32), // should really be usize but it doesn't have Encode/Decode support

    /// Vector of mix of Entities already existing and just added in a recent operation
    InternalEntityVec(Vec<ParameterizedEntity<T>>),
}

/// Parametrized entity
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub enum ParameterizedEntity<T: Trait> {
    InternalEntityJustAdded(u32),
    ExistingEntity(T::EntityId),
}

/// Parametrized class property value
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct ParametrizedClassPropertyValue<T: Trait> {
    /// Index is into properties vector of class.
    pub in_class_index: PropertyId,

    /// InputValue of property with index `in_class_index` in a given class.
    pub value: ParametrizedPropertyValue<T>,
}

/// Operation, that represents `Entity` creation
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct CreateEntityOperation<T: Trait> {
    /// Class of an Entity
    pub class_id: T::ClassId,
}

/// Operation, that represents property values update
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct UpdatePropertyValuesOperation<T: Trait> {
    /// Entity id to perfrom operation
    pub entity_id: ParameterizedEntity<T>,
    /// Property values, that should be updated
    pub new_parametrized_property_values: Vec<ParametrizedClassPropertyValue<T>>,
}

/// Operation, that represents adding `Entity` `Schema` support
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct AddSchemaSupportToEntityOperation<T: Trait> {
    /// Entity id to perfrom operation
    pub entity_id: ParameterizedEntity<T>,
    /// Schema id defined on `Class` level to be added to the `Entity`
    pub schema_id: SchemaId,
    /// Property values, that should be added for the underlying schema_id
    pub parametrized_property_values: Vec<ParametrizedClassPropertyValue<T>>,
}

/// The type of operation performed
#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub enum OperationType<T: Trait> {
    CreateEntity(CreateEntityOperation<T>),
    UpdatePropertyValues(UpdatePropertyValuesOperation<T>),
    AddSchemaSupportToEntity(AddSchemaSupportToEntityOperation<T>),
}

/// Retrieve entity_id of parametrized `Entity`
pub fn parametrized_entity_to_entity_id<T: Trait>(
    created_entities: &BTreeMap<usize, T::EntityId>,
    entity: ParameterizedEntity<T>,
) -> Result<T::EntityId, Error<T>> {
    match entity {
        ParameterizedEntity::ExistingEntity(entity_id) => Ok(entity_id),
        ParameterizedEntity::InternalEntityJustAdded(op_index_u32) => {
            let op_index = op_index_u32 as usize;
            Ok(*created_entities
                .get(&op_index)
                .ok_or(Error::<T>::EntityNotCreatedByOperation)?)
        }
    }
}

/// Convert parametrized property values into property values
pub fn parametrized_property_values_to_property_values<T: Trait>(
    created_entities: &BTreeMap<usize, T::EntityId>,
    parametrized_property_values: Vec<ParametrizedClassPropertyValue<T>>,
) -> Result<
    BTreeMap<
        PropertyId,
        InputPropertyValue<<T as system::Trait>::Hashing, <T as system::Trait>::Hash, T::EntityId>,
    >,
    Error<T>,
> {
    let mut class_property_values = BTreeMap::new();

    for parametrized_class_property_value in parametrized_property_values.into_iter() {
        let property_value = match parametrized_class_property_value.value {
            ParametrizedPropertyValue::InputPropertyValue(value) => value,
            ParametrizedPropertyValue::InternalEntityJustAdded(
                entity_created_in_operation_index,
            ) => {
                // Verify that referenced entity was indeed created created
                let op_index = entity_created_in_operation_index as usize;
                let entity_id = created_entities
                    .get(&op_index)
                    .ok_or(Error::<T>::EntityNotCreatedByOperation)?;
                InputPropertyValue::Single(InputValue::Reference(*entity_id))
            }
            ParametrizedPropertyValue::InternalEntityVec(parametrized_entities) => {
                let mut entities: Vec<T::EntityId> = vec![];

                for parametrized_entity in parametrized_entities.into_iter() {
                    match parametrized_entity {
                        ParameterizedEntity::ExistingEntity(id) => entities.push(id),
                        ParameterizedEntity::InternalEntityJustAdded(
                            entity_created_in_operation_index,
                        ) => {
                            let op_index = entity_created_in_operation_index as usize;
                            let entity_id = created_entities
                                .get(&op_index)
                                .ok_or(Error::<T>::EntityNotCreatedByOperation)?;
                            entities.push(*entity_id);
                        }
                    }
                }
                InputPropertyValue::Vector(VecInputValue::Reference(entities))
            }
        };

        class_property_values.insert(
            parametrized_class_property_value.in_class_index,
            property_value,
        );
    }

    Ok(class_property_values)
}
