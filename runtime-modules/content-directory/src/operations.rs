use crate::{
    PropertyId, PropertyValue, SchemaId, SinglePropertyValue, Trait, Value, VecPropertyValue,
    VecValue,
};
use codec::{Decode, Encode};
use rstd::collections::btree_map::BTreeMap;
use rstd::prelude::*;

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub enum ParametrizedPropertyValue<T: Trait> {
    /// Same fields as normal PropertyValue
    PropertyValue(PropertyValue<T>),

    /// This is the index of an operation creating an entity in the transaction/batch operations
    InternalEntityJustAdded(u32), // should really be usize but it doesn't have Encode/Decode support

    /// Vector of mix of Entities already existing and just added in a recent operation
    InternalEntityVec(Vec<ParameterizedEntity<T>>),
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub enum ParameterizedEntity<T: Trait> {
    InternalEntityJustAdded(u32),
    ExistingEntity(T::EntityId),
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct ParametrizedClassPropertyValue<T: Trait> {
    /// Index is into properties vector of class.
    pub in_class_index: PropertyId,

    /// Value of property with index `in_class_index` in a given class.
    pub value: ParametrizedPropertyValue<T>,
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct CreateEntityOperation<T: Trait> {
    pub class_id: T::ClassId,
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct UpdatePropertyValuesOperation<T: Trait> {
    pub entity_id: ParameterizedEntity<T>,
    pub new_parametrized_property_values: Vec<ParametrizedClassPropertyValue<T>>,
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct AddSchemaSupportToEntityOperation<T: Trait> {
    pub entity_id: ParameterizedEntity<T>,
    pub schema_id: SchemaId,
    pub parametrized_property_values: Vec<ParametrizedClassPropertyValue<T>>,
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub enum OperationType<T: Trait> {
    CreateEntity(CreateEntityOperation<T>),
    UpdatePropertyValues(UpdatePropertyValuesOperation<T>),
    AddSchemaSupportToEntity(AddSchemaSupportToEntityOperation<T>),
}

pub fn parametrized_entity_to_entity_id<T: Trait>(
    created_entities: &BTreeMap<usize, T::EntityId>,
    entity: ParameterizedEntity<T>,
) -> Result<T::EntityId, &'static str> {
    match entity {
        ParameterizedEntity::ExistingEntity(entity_id) => Ok(entity_id),
        ParameterizedEntity::InternalEntityJustAdded(op_index_u32) => {
            let op_index = op_index_u32 as usize;
            Ok(*created_entities
                .get(&op_index)
                .ok_or("EntityNotCreatedByOperation")?)
        }
    }
}

pub fn parametrized_property_values_to_property_values<T: Trait>(
    created_entities: &BTreeMap<usize, T::EntityId>,
    parametrized_property_values: Vec<ParametrizedClassPropertyValue<T>>,
) -> Result<BTreeMap<PropertyId, PropertyValue<T>>, &'static str> {
    let mut class_property_values = BTreeMap::new();

    for parametrized_class_property_value in parametrized_property_values.into_iter() {
        let property_value = match parametrized_class_property_value.value {
            ParametrizedPropertyValue::PropertyValue(value) => value,
            ParametrizedPropertyValue::InternalEntityJustAdded(
                entity_created_in_operation_index,
            ) => {
                // Verify that referenced entity was indeed created created
                let op_index = entity_created_in_operation_index as usize;
                let entity_id = created_entities
                    .get(&op_index)
                    .ok_or("EntityNotCreatedByOperation")?;
                PropertyValue::Single(SinglePropertyValue::new(Value::Reference(*entity_id)))
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
                                .ok_or("EntityNotCreatedByOperation")?;
                            entities.push(*entity_id);
                        }
                    }
                }
                PropertyValue::Vector(VecPropertyValue::new(
                    VecValue::Reference(entities),
                    T::Nonce::default(),
                ))
            }
        };

        class_property_values.insert(
            parametrized_class_property_value.in_class_index,
            property_value,
        );
    }

    Ok(class_property_values)
}
