use crate::{ClassId, EntityId, PropertyId, PropertyValue, SchemaId, Trait};
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
    InternalEntityVec(Vec<ParameterizedEntity>),
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub enum ParameterizedEntity {
    InternalEntityJustAdded(u32),
    ExistingEntity(EntityId),
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct ParametrizedClassPropertyValue<T: Trait> {
    /// Index is into properties vector of class.
    pub in_class_index: PropertyId,

    /// Value of property with index `in_class_index` in a given class.
    pub value: ParametrizedPropertyValue<T>,
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct CreateEntityOperation {
    pub class_id: ClassId,
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct UpdatePropertyValuesOperation<T: Trait> {
    pub entity_id: ParameterizedEntity,
    pub new_parametrized_property_values: Vec<ParametrizedClassPropertyValue<T>>,
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct AddSchemaSupportToEntityOperation<T: Trait> {
    pub entity_id: ParameterizedEntity,
    pub schema_id: SchemaId,
    pub parametrized_property_values: Vec<ParametrizedClassPropertyValue<T>>,
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub enum OperationType<T: Trait> {
    CreateEntity(CreateEntityOperation),
    UpdatePropertyValues(UpdatePropertyValuesOperation<T>),
    AddSchemaSupportToEntity(AddSchemaSupportToEntityOperation<T>),
}

#[derive(Encode, Decode, Eq, PartialEq, Clone, Debug)]
pub struct Operation<Credential, T: Trait> {
    pub with_credential: Option<Credential>,
    pub as_entity_maintainer: bool,
    pub operation_type: OperationType<T>,
}

pub fn parametrized_entity_to_entity_id(
    created_entities: &BTreeMap<usize, EntityId>,
    entity: ParameterizedEntity,
) -> Result<EntityId, &'static str> {
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
    created_entities: &BTreeMap<usize, EntityId>,
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
                PropertyValue::Reference(*entity_id)
            }
            ParametrizedPropertyValue::InternalEntityVec(parametrized_entities) => {
                let mut entities: Vec<EntityId> = vec![];

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

                PropertyValue::ReferenceVec(entities, T::Nonce::default())
            }
        };

        class_property_values.insert(
            parametrized_class_property_value.in_class_index,
            property_value,
        );
    }

    Ok(class_property_values)
}
