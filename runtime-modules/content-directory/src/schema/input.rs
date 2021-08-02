use super::*;

/// Enum, representing either `SingleInputPropertyValue` or `VecInputPropertyValue`
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq)]
pub enum InputPropertyValue<T: Config> {
    Single(InputValue<T>),
    Vector(VecInputValue<T>),
}

impl<T: Config> core::fmt::Debug for InputPropertyValue<T> {
    fn fmt(&self, formatter: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        write!(formatter, "InputPropertyValue {:?}", self)
    }
}

impl<T: Config> InputPropertyValue<T> {
    pub fn as_single_value(&self) -> Option<&InputValue<T>> {
        if let InputPropertyValue::Single(single_value) = self {
            Some(single_value)
        } else {
            None
        }
    }

    pub fn as_vec_value(&self) -> Option<&VecInputValue<T>> {
        if let InputPropertyValue::Vector(vec_value) = self {
            Some(vec_value)
        } else {
            None
        }
    }

    pub fn as_vec_value_mut(&mut self) -> Option<&mut VecInputValue<T>> {
        if let InputPropertyValue::Vector(vec_value) = self {
            Some(vec_value)
        } else {
            None
        }
    }

    /// Retrieve all involved `entity_id`'s, if current `InputPropertyValue` is reference
    pub fn get_involved_entities(&self) -> Option<Vec<T::EntityId>> {
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

impl<T: Config> Default for InputPropertyValue<T> {
    fn default() -> Self {
        InputPropertyValue::Single(InputValue::default())
    }
}

/// InputValue enum representation, related to corresponding `SingleInputPropertyValue` structure
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq)]
pub enum InputValue<T: Config> {
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
    Reference(T::EntityId),
}

impl<T: Config> core::fmt::Debug for InputValue<T> {
    fn fmt(&self, formatter: &mut core::fmt::Formatter<'_>) -> sp_std::fmt::Result {
        write!(formatter, "InputValue {:?}", self)
    }
}

impl<T: Config> Default for InputValue<T> {
    fn default() -> InputValue<T> {
        Self::Bool(false)
    }
}

impl<T: Config> InputValue<T> {
    /// Retrieve involved `entity_id`, if current `InputValue` is reference
    pub fn get_involved_entity(&self) -> Option<T::EntityId> {
        if let InputValue::Reference(entity_id) = self {
            Some(*entity_id)
        } else {
            None
        }
    }
}

/// Vector value enum representation
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Clone, PartialEq, Eq)]
pub enum VecInputValue<T: Config> {
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
    Reference(Vec<T::EntityId>),
}

impl<T: Config> Default for VecInputValue<T> {
    fn default() -> Self {
        Self::Bool(vec![])
    }
}

impl<T: Config> VecInputValue<T> {
    /// Retrieve all involved `entity_id`'s, if current `VecInputValue` is reference
    pub fn get_involved_entities(&self) -> Option<Vec<T::EntityId>> {
        if let Self::Reference(entity_ids) = self {
            Some(entity_ids.to_owned())
        } else {
            None
        }
    }
}
