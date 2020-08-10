use super::*;
use runtime_primitives::traits::Hash;

/// Enum, representing either `OutputValue` or `VecOutputPropertyValue`
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum OutputPropertyValue<T: Trait> {
    Single(OutputValue<T>),
    Vector(VecOutputPropertyValue<T>),
}

impl<T: Trait> OutputPropertyValue<T> {
    pub fn as_single_value(&self) -> Option<&OutputValue<T>> {
        if let OutputPropertyValue::Single(single_value) = self {
            Some(single_value)
        } else {
            None
        }
    }

    pub fn as_vec_property_value(&self) -> Option<&VecOutputPropertyValue<T>> {
        if let OutputPropertyValue::Vector(vec_property_value) = self {
            Some(vec_property_value)
        } else {
            None
        }
    }

    pub fn as_vec_property_value_mut(&mut self) -> Option<&mut VecOutputPropertyValue<T>> {
        if let OutputPropertyValue::Vector(vec_property_value) = self {
            Some(vec_property_value)
        } else {
            None
        }
    }

    /// Update `Self` with provided `OutputPropertyValue`
    pub fn update(&mut self, mut new_value: Self) {
        if let (Some(vec_property_value), Some(new_vec_property_value)) = (
            self.as_vec_property_value_mut(),
            new_value.as_vec_property_value_mut(),
        ) {
            new_vec_property_value.nonce = vec_property_value.nonce;
        }
        *self = new_value
    }

    /// Retrieve all involved `entity_id`'s, if current `OutputPropertyValue` is reference
    pub fn get_involved_entities(&self) -> Option<Vec<T::EntityId>> {
        match self {
            OutputPropertyValue::Single(single_property_value) => {
                if let Some(entity_id) = single_property_value.get_involved_entity() {
                    Some(vec![entity_id])
                } else {
                    None
                }
            }
            OutputPropertyValue::Vector(vector_property_value) => vector_property_value
                .get_vec_value_ref()
                .get_involved_entities(),
        }
    }

    /// Compute hash from unique property value and its respective property_id
    pub fn compute_unique_hash(&self, property_id: PropertyId) -> T::Hash {
        match self {
            OutputPropertyValue::Single(output_value) => {
                (property_id, output_value).using_encoded(<T as system::Trait>::Hashing::hash)
            }
            OutputPropertyValue::Vector(vector_output_value) => {
                // Do not hash nonce
                let vector_output_value = vector_output_value.get_vec_value_ref();

                (property_id, vector_output_value)
                    .using_encoded(<T as system::Trait>::Hashing::hash)
            }
        }
    }
}

impl<T: Trait> Default for OutputPropertyValue<T> {
    fn default() -> Self {
        OutputPropertyValue::Single(OutputValue::default())
    }
}

/// OutputValue enum representation, related to corresponding `SingleOutputPropertyValue` structure
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Hash, Clone, PartialEq, PartialOrd, Ord, Eq, Debug)]
pub enum OutputValue<T: Trait> {
    Bool(bool),
    Uint16(u16),
    Uint32(u32),
    Uint64(u64),
    Int16(i16),
    Int32(i32),
    Int64(i64),
    Text(Vec<u8>),
    Hash(T::Hash),
    Reference(T::EntityId),
}

impl<T: Trait> Default for OutputValue<T> {
    fn default() -> OutputValue<T> {
        Self::Bool(false)
    }
}

impl<T: Trait> OutputValue<T> {
    /// Retrieve involved `entity_id`, if current `OutputValue` is reference
    pub fn get_involved_entity(&self) -> Option<T::EntityId> {
        if let OutputValue::Reference(entity_id) = self {
            Some(*entity_id)
        } else {
            None
        }
    }
}

/// Consists of `VecOutputPropertyValue` enum representation and `nonce`, used to avoid vector data race update conditions
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, Debug, PartialEq, Eq)]
pub struct VecOutputPropertyValue<T: Trait> {
    vec_value: VecOutputValue<T>,
    nonce: T::Nonce,
}

impl<T: Trait> VecOutputPropertyValue<T> {
    /// Increase nonce by 1
    fn increment_nonce(&mut self) -> T::Nonce {
        self.nonce += T::Nonce::one();
        self.nonce
    }

    pub fn new(vec_value: VecOutputValue<T>, nonce: T::Nonce) -> Self {
        Self { vec_value, nonce }
    }

    /// Retrieve `VecOutputValue`
    pub fn get_vec_value(self) -> VecOutputValue<T> {
        self.vec_value
    }

    /// Retrieve `VecOutputValue` by reference
    pub fn get_vec_value_ref(&self) -> &VecOutputValue<T> {
        &self.vec_value
    }

    fn len(&self) -> usize {
        match &self.vec_value {
            VecOutputValue::Bool(vec) => vec.len(),
            VecOutputValue::Uint16(vec) => vec.len(),
            VecOutputValue::Uint32(vec) => vec.len(),
            VecOutputValue::Uint64(vec) => vec.len(),
            VecOutputValue::Int16(vec) => vec.len(),
            VecOutputValue::Int32(vec) => vec.len(),
            VecOutputValue::Int64(vec) => vec.len(),
            VecOutputValue::Text(vec) => vec.len(),
            VecOutputValue::Hash(vec) => vec.len(),
            VecOutputValue::Reference(vec) => vec.len(),
        }
    }

    /// Clear current `vec_value`
    pub fn clear(&mut self) {
        match &mut self.vec_value {
            VecOutputValue::Bool(vec) => *vec = vec![],
            VecOutputValue::Uint16(vec) => *vec = vec![],
            VecOutputValue::Uint32(vec) => *vec = vec![],
            VecOutputValue::Uint64(vec) => *vec = vec![],
            VecOutputValue::Int16(vec) => *vec = vec![],
            VecOutputValue::Int32(vec) => *vec = vec![],
            VecOutputValue::Int64(vec) => *vec = vec![],
            VecOutputValue::Text(vec) => *vec = vec![],
            VecOutputValue::Hash(vec) => *vec = vec![],
            VecOutputValue::Reference(vec) => *vec = vec![],
        }
    }

    /// Perform removal at given `index_in_property_vec`, increment `nonce`
    pub fn remove_at(&mut self, index_in_property_vec: VecMaxLength) {
        fn remove_at_checked<T>(vec: &mut Vec<T>, index_in_property_vec: VecMaxLength) {
            if (index_in_property_vec as usize) < vec.len() {
                vec.remove(index_in_property_vec as usize);
            }
        }

        match &mut self.vec_value {
            VecOutputValue::Bool(vec) => remove_at_checked(vec, index_in_property_vec),
            VecOutputValue::Uint16(vec) => remove_at_checked(vec, index_in_property_vec),
            VecOutputValue::Uint32(vec) => remove_at_checked(vec, index_in_property_vec),
            VecOutputValue::Uint64(vec) => remove_at_checked(vec, index_in_property_vec),
            VecOutputValue::Int16(vec) => remove_at_checked(vec, index_in_property_vec),
            VecOutputValue::Int32(vec) => remove_at_checked(vec, index_in_property_vec),
            VecOutputValue::Int64(vec) => remove_at_checked(vec, index_in_property_vec),
            VecOutputValue::Text(vec) => remove_at_checked(vec, index_in_property_vec),
            VecOutputValue::Hash(vec) => remove_at_checked(vec, index_in_property_vec),
            VecOutputValue::Reference(vec) => remove_at_checked(vec, index_in_property_vec),
        }

        self.increment_nonce();
    }

    /// Insert provided `OutputValue` at given `index_in_property_vec`, increment `nonce`
    pub fn insert_at(&mut self, index_in_property_vec: VecMaxLength, single_value: OutputValue<T>) {
        fn insert_at<T>(vec: &mut Vec<T>, index_in_property_vec: VecMaxLength, value: T) {
            if (index_in_property_vec as usize) < vec.len() {
                vec.insert(index_in_property_vec as usize, value);
            }
        }

        match (&mut self.vec_value, single_value) {
            (VecOutputValue::Bool(vec), OutputValue::Bool(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecOutputValue::Uint16(vec), OutputValue::Uint16(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecOutputValue::Uint32(vec), OutputValue::Uint32(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecOutputValue::Uint64(vec), OutputValue::Uint64(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecOutputValue::Int16(vec), OutputValue::Int16(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecOutputValue::Int32(vec), OutputValue::Int32(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecOutputValue::Int64(vec), OutputValue::Int64(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }

            // Match by move, when https://github.com/rust-lang/rust/issues/68354 stableize
            (VecOutputValue::Text(vec), OutputValue::Text(ref value)) => {
                insert_at(vec, index_in_property_vec, value.to_owned())
            }
            (VecOutputValue::Reference(vec), OutputValue::Reference(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            _ => return,
        }

        self.increment_nonce();
    }

    /// Ensure `VecOutputPropertyValue` nonce is equal to the provided one.
    /// Used to to avoid possible data races, when performing vector specific operations
    pub fn ensure_nonce_equality(&self, new_nonce: T::Nonce) -> dispatch::Result {
        ensure!(
            self.nonce == new_nonce,
            ERROR_PROP_VALUE_VEC_NONCES_DOES_NOT_MATCH
        );
        Ok(())
    }

    /// Ensure, provided `index_in_property_vec` is valid index of `VecOutputValue`
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

/// Vector value enum representation, related to corresponding `VecOutputPropertyValue` structure
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Hash, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum VecOutputValue<T: Trait> {
    Bool(Vec<bool>),
    Uint16(Vec<u16>),
    Uint32(Vec<u32>),
    Uint64(Vec<u64>),
    Int16(Vec<i16>),
    Int32(Vec<i32>),
    Int64(Vec<i64>),
    Hash(Vec<T::Hash>),
    Text(Vec<Vec<u8>>),
    Reference(Vec<T::EntityId>),
}

impl<T: Trait> Default for VecOutputValue<T> {
    fn default() -> Self {
        Self::Bool(vec![])
    }
}

impl<T: Trait> VecOutputValue<T> {
    /// Retrieve all involved `entity_id`'s, if current `VecOutputValue` is reference
    pub fn get_involved_entities(&self) -> Option<Vec<T::EntityId>> {
        if let Self::Reference(entity_ids) = self {
            Some(entity_ids.to_owned())
        } else {
            None
        }
    }
}
