use super::*;

/// Enum, representing either `SingleInputPropertyValue` or `VecInputPropertyValue`
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum InputPropertyValue<T: Trait> {
    Single(SingleInputPropertyValue<T>),
    Vector(VecInputPropertyValue<T>),
}

impl<T: Trait> InputPropertyValue<T> {
    pub fn as_single_property_value(&self) -> Option<&SingleInputPropertyValue<T>> {
        if let InputPropertyValue::Single(single_property_value) = self {
            Some(single_property_value)
        } else {
            None
        }
    }

    pub fn as_vec_property_value(&self) -> Option<&VecInputPropertyValue<T>> {
        if let InputPropertyValue::Vector(vec_property_value) = self {
            Some(vec_property_value)
        } else {
            None
        }
    }

    pub fn as_vec_property_value_mut(&mut self) -> Option<&mut VecInputPropertyValue<T>> {
        if let InputPropertyValue::Vector(vec_property_value) = self {
            Some(vec_property_value)
        } else {
            None
        }
    }

    /// Retrieve all involved `entity_id`'s, if current `InputPropertyValue` is reference
    pub fn get_involved_entities(&self) -> Option<Vec<T::EntityId>> {
        match self {
            InputPropertyValue::Single(single_property_value) => {
                if let Some(entity_id) = single_property_value.get_value_ref().get_involved_entity()
                {
                    Some(vec![entity_id])
                } else {
                    None
                }
            }
            InputPropertyValue::Vector(vector_property_value) => vector_property_value
                .get_vec_value()
                .get_involved_entities(),
        }
    }
}

impl<T: Trait> Default for InputPropertyValue<T> {
    fn default() -> Self {
        InputPropertyValue::Single(SingleInputPropertyValue::default())
    }
}

/// `InputValue` enum wrapper
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct SingleInputPropertyValue<T: Trait> {
    value: InputValue<T>,
}

impl<T: Trait> Default for SingleInputPropertyValue<T> {
    fn default() -> Self {
        Self {
            value: InputValue::default(),
        }
    }
}

impl<T: Trait> SingleInputPropertyValue<T> {
    pub fn new(value: InputValue<T>) -> Self {
        Self { value }
    }

    /// Get inner `InputValue` by reference
    pub fn get_value_ref(&self) -> &InputValue<T> {
        &self.value
    }

    /// Get inner `InputValue`
    pub fn get_value(self) -> InputValue<T> {
        self.value
    }
}

/// InputValue enum representation, related to corresponding `SingleInputPropertyValue` structure
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum InputValue<T: Trait> {
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

impl<T: Trait> Default for InputValue<T> {
    fn default() -> InputValue<T> {
        Self::Bool(false)
    }
}

impl<T: Trait> InputValue<T> {
    /// Retrieve involved `entity_id`, if current `InputValue` is reference
    pub fn get_involved_entity(&self) -> Option<T::EntityId> {
        if let InputValue::Reference(entity_id) = self {
            Some(*entity_id)
        } else {
            None
        }
    }
}

/// Consists of `VecInputPropertyValue` enum representation and `nonce`, used to avoid vector data race update conditions
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VecInputPropertyValue<T: Trait> {
    vec_value: VecInputValue<T>,
    nonce: T::Nonce,
}

impl<T: Trait> VecInputPropertyValue<T> {
    pub fn new(vec_value: VecInputValue<T>, nonce: T::Nonce) -> Self {
        Self { vec_value, nonce }
    }

    pub fn unzip(self) -> (VecInputValue<T>, T::Nonce) {
        (self.vec_value, self.nonce)
    }

    /// Retrieve `VecInputValue` by reference
    pub fn get_vec_value(&self) -> &VecInputValue<T> {
        &self.vec_value
    }

    fn len(&self) -> usize {
        match &self.vec_value {
            VecInputValue::Bool(vec) => vec.len(),
            VecInputValue::Uint16(vec) => vec.len(),
            VecInputValue::Uint32(vec) => vec.len(),
            VecInputValue::Uint64(vec) => vec.len(),
            VecInputValue::Int16(vec) => vec.len(),
            VecInputValue::Int32(vec) => vec.len(),
            VecInputValue::Int64(vec) => vec.len(),
            VecInputValue::Text(vec) => vec.len(),
            VecInputValue::TextToHash(vec) => vec.len(),
            VecInputValue::Reference(vec) => vec.len(),
        }
    }

    /// Ensure `VecInputPropertyValue` nonce is equal to the provided one.
    /// Used to to avoid possible data races, when performing vector specific operations
    pub fn ensure_nonce_equality(&self, new_nonce: T::Nonce) -> dispatch::Result {
        ensure!(
            self.nonce == new_nonce,
            ERROR_PROP_VALUE_VEC_NONCES_DOES_NOT_MATCH
        );
        Ok(())
    }

    /// Ensure, provided `index_in_property_vec` is valid index of `VecInputValue`
    pub fn ensure_index_in_property_vector_is_valid(
        &self,
        index_in_property_vec: VecMaxLength,
    ) -> dispatch::Result {
        ensure!(
            (index_in_property_vec as usize) <= self.len(),
            ERROR_ENTITY_PROP_VALUE_VECTOR_INDEX_IS_OUT_OF_RANGE
        );

        Ok(())
    }
}

/// Vector value enum representation, related to corresponding `VecInputPropertyValue` structure
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum VecInputValue<T: Trait> {
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

impl<T: Trait> Default for VecInputValue<T> {
    fn default() -> Self {
        Self::Bool(vec![])
    }
}

impl<T: Trait> VecInputValue<T> {
    /// Retrieve all involved `entity_id`'s, if current `VecInputValue` is reference
    pub fn get_involved_entities(&self) -> Option<Vec<T::EntityId>> {
        if let Self::Reference(entity_ids) = self {
            Some(entity_ids.to_owned())
        } else {
            None
        }
    }
}
