use super::*;

/// Enum, representing either `SingleInputPropertyValue` or `VecInputPropertyValue`
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum InputPropertyValue<EntityId> {
    Single(InputValue<EntityId>),
    Vector(VecInputValue<EntityId>),
}

impl<EntityId> InputPropertyValue<EntityId> {
    pub fn as_single_value(&self) -> Option<&InputValue<EntityId>> {
        if let InputPropertyValue::Single(single_value) = self {
            Some(single_value)
        } else {
            None
        }
    }

    pub fn as_vec_value(&self) -> Option<&VecInputValue<EntityId>> {
        if let InputPropertyValue::Vector(vec_value) = self {
            Some(vec_value)
        } else {
            None
        }
    }

    pub fn as_vec_value_mut(&mut self) -> Option<&mut VecInputValue<EntityId>> {
        if let InputPropertyValue::Vector(vec_value) = self {
            Some(vec_value)
        } else {
            None
        }
    }

    /// Retrieve all involved `entity_id`'s, if current `InputPropertyValue` is reference
    pub fn get_involved_entities(&self) -> Option<Vec<EntityId>> {
        match self {
            InputPropertyValue::Single(single_property_value) => {
                if let Some(entity_id) = single_property_value.get_involved_entity() {
                    Some(vec![entity_id])
                } else {
                    None
                }
            }
            InputPropertyValue::Vector(vector_property_value) => {
                vector_property_value.get_involved_entities()
            }
        }
    }
}

impl<EntityId> Default for InputPropertyValue<EntityId> {
    fn default() -> Self {
        InputPropertyValue::Single(InputValue::default())
    }
}

/// InputValue enum representation, related to corresponding `SingleInputPropertyValue` structure
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum InputValue<EntityId> {
    Bool(bool),
    Uint16(u16),
    Uint32(u32),
    Uint64(u64),
    Int16(i16),
    Int32(i32),
    Int64(i64),
    Text(Vec<u8>),
    // Used to pass text value, which respective hash should be stored
    TextToHash(Vec<u8>),
    Reference(EntityId),
}

impl<EntityId> Default for InputValue<EntityId> {
    fn default() -> InputValue<EntityId> {
        Self::Bool(false)
    }
}

impl<EntityId> InputValue<EntityId> {
    /// Retrieve involved `entity_id`, if current `InputValue` is reference
    pub fn get_involved_entity(&self) -> Option<EntityId> {
        if let InputValue::Reference(entity_id) = self {
            Some(*entity_id)
        } else {
            None
        }
    }
}

/// Vector value enum representation
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum VecInputValue<EntityId> {
    Bool(Vec<bool>),
    Uint16(Vec<u16>),
    Uint32(Vec<u32>),
    Uint64(Vec<u64>),
    Int16(Vec<i16>),
    Int32(Vec<i32>),
    Int64(Vec<i64>),
    // Used to pass text vec value, which respective hashes should be stored
    TextToHash(Vec<Vec<u8>>),
    Text(Vec<Vec<u8>>),
    Reference(Vec<EntityId>),
}

impl<EntityId> Default for VecInputValue<EntityId> {
    fn default() -> Self {
        Self::Bool(vec![])
    }
}

impl<EntityId> VecInputValue<EntityId> {
    /// Retrieve all involved `entity_id`'s, if current `VecInputValue` is reference
    pub fn get_involved_entities(&self) -> Option<Vec<EntityId>> {
        if let Self::Reference(entity_ids) = self {
            Some(entity_ids.to_owned())
        } else {
            None
        }
    }
}
