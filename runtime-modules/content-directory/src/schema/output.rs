use super::*;
use sp_runtime::traits::Hash;

/// Enum, representing either `StoredValue` or `VecStoredPropertyValue`
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum StoredPropertyValue<Nonce, Hash, EntityId> {
    Single(StoredValue<Hash, EntityId>),
    Vector(VecStoredPropertyValue<Nonce, Hash, EntityId>),
}

impl<Nonce, Hash, EntityId> StoredPropertyValue<Nonce, Hash, EntityId> {
    /// Returns single property value by reference if `StoredPropertyValue` is Single
    pub fn as_single_value(&self) -> Option<&StoredValue<Hash, EntityId>> {
        if let StoredPropertyValue::Single(single_value) = self {
            Some(single_value)
        } else {
            None
        }
    }

    /// Returns vector property value by reference if `StoredPropertyValue` is Single
    pub fn as_vec_property_value(&self) -> Option<&VecStoredPropertyValue<Nonce, Hash, EntityId>> {
        if let StoredPropertyValue::Vector(vec_property_value) = self {
            Some(vec_property_value)
        } else {
            None
        }
    }

    /// Returns vector property value by mutable reference if `StoredPropertyValue` is Single
    pub fn as_vec_property_value_mut(
        &mut self,
    ) -> Option<&mut VecStoredPropertyValue<Nonce, Hash, EntityId>> {
        if let StoredPropertyValue::Vector(vec_property_value) = self {
            Some(vec_property_value)
        } else {
            None
        }
    }

    /// Update `Self` with provided `StoredPropertyValue`
    pub fn update(&mut self, mut new_value: Self) {
        if let (Some(vec_property_value), Some(new_vec_property_value)) = (
            self.as_vec_property_value_mut(),
            new_value.as_vec_property_value_mut(),
        ) {
            new_vec_property_value.nonce = vec_property_value.nonce;
        }
        *self = new_value
    }

    /// Retrieve all involved `entity_id`'s, if current `StoredPropertyValue` is reference
    pub fn get_involved_entities(&self) -> Option<Vec<EntityId>> {
        match self {
            StoredPropertyValue::Single(single_property_value) => {
                if let Some(entity_id) = single_property_value.get_involved_entity() {
                    Some(vec![entity_id])
                } else {
                    None
                }
            }
            StoredPropertyValue::Vector(vector_property_value) => vector_property_value
                .get_vec_value_ref()
                .get_involved_entities(),
        }
    }

    /// Compute hash from unique property value and its respective property_id
    pub fn compute_unique_hash(&self, property_id: PropertyId) -> Hash {
        match self {
            StoredPropertyValue::Single(output_value) => {
                (property_id, output_value).using_encoded(system::Trait::Hashing::hash)
            }
            StoredPropertyValue::Vector(vector_output_value) => {
                vector_output_value.compute_unique_hash(property_id)
            }
        }
    }
}

impl<Nonce, Hash, EntityId> Default for StoredPropertyValue<Nonce, Hash, EntityId> {
    fn default() -> Self {
        StoredPropertyValue::Single(StoredValue::<Hash, EntityId>::default())
    }
}

/// StoredValue enum representation, related to corresponding `SingleStoredPropertyValue` structure
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Hash, Clone, PartialEq, PartialOrd, Ord, Eq, Debug)]
pub enum StoredValue<Hash, EntityId> {
    Bool(bool),
    Uint16(u16),
    Uint32(u32),
    Uint64(u64),
    Int16(i16),
    Int32(i32),
    Int64(i64),
    Text(Vec<u8>),
    Hash(Hash),
    Reference(EntityId),
}

impl<Hash, EntityId> Default for StoredValue<Hash, EntityId> {
    fn default() -> StoredValue<Hash, EntityId> {
        Self::Bool(false)
    }
}

impl<Hash, EntityId> StoredValue<Hash, EntityId> {
    /// Retrieve involved `entity_id`, if current `StoredValue` is reference
    pub fn get_involved_entity(&self) -> Option<EntityId> {
        if let StoredValue::Reference(entity_id) = self {
            Some(*entity_id)
        } else {
            None
        }
    }
}

/// Consists of `VecStoredPropertyValue` enum representation and `nonce`, used to avoid vector data race update conditions
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, Debug, PartialEq, Eq)]
pub struct VecStoredPropertyValue<Nonce, Hash, EntityId> {
    vec_value: VecStoredValue<Hash, EntityId>,
    nonce: Nonce,
}

impl<Nonce, Hash, EntityId> VecStoredPropertyValue<Nonce, Hash, EntityId> {
    /// Compute hash from unique vec property value and its respective property_id
    pub fn compute_unique_hash(&self, property_id: PropertyId) -> Hash {
        // Do not hash nonce
        (property_id, &self.vec_value).using_encoded(system::Trait::Hashing::hash)
    }

    /// Increase nonce by 1
    fn increment_nonce(&mut self) -> Nonce {
        self.nonce += Nonce::one();
        self.nonce
    }

    /// Create new `VecStoredPropertyValue` from `vec value` provided and `nonce`
    pub fn new(vec_value: VecStoredValue<Hash, EntityId>, nonce: Nonce) -> Self {
        Self { vec_value, nonce }
    }

    /// Retrieve `VecStoredValue`
    pub fn get_vec_value(self) -> VecStoredValue<Hash, EntityId> {
        self.vec_value
    }

    /// Retrieve `VecStoredValue` by reference
    pub fn get_vec_value_ref(&self) -> &VecStoredValue<Hash, EntityId> {
        &self.vec_value
    }

    fn len(&self) -> usize {
        match &self.vec_value {
            VecStoredValue::Bool(vec) => vec.len(),
            VecStoredValue::Uint16(vec) => vec.len(),
            VecStoredValue::Uint32(vec) => vec.len(),
            VecStoredValue::Uint64(vec) => vec.len(),
            VecStoredValue::Int16(vec) => vec.len(),
            VecStoredValue::Int32(vec) => vec.len(),
            VecStoredValue::Int64(vec) => vec.len(),
            VecStoredValue::Text(vec) => vec.len(),
            VecStoredValue::Hash(vec) => vec.len(),
            VecStoredValue::Reference(vec) => vec.len(),
        }
    }

    /// Clear current `vec_value`
    pub fn clear(&mut self) {
        match &mut self.vec_value {
            VecStoredValue::Bool(vec) => *vec = vec![],
            VecStoredValue::Uint16(vec) => *vec = vec![],
            VecStoredValue::Uint32(vec) => *vec = vec![],
            VecStoredValue::Uint64(vec) => *vec = vec![],
            VecStoredValue::Int16(vec) => *vec = vec![],
            VecStoredValue::Int32(vec) => *vec = vec![],
            VecStoredValue::Int64(vec) => *vec = vec![],
            VecStoredValue::Text(vec) => *vec = vec![],
            VecStoredValue::Hash(vec) => *vec = vec![],
            VecStoredValue::Reference(vec) => *vec = vec![],
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
            VecStoredValue::Bool(vec) => remove_at_checked(vec, index_in_property_vec),
            VecStoredValue::Uint16(vec) => remove_at_checked(vec, index_in_property_vec),
            VecStoredValue::Uint32(vec) => remove_at_checked(vec, index_in_property_vec),
            VecStoredValue::Uint64(vec) => remove_at_checked(vec, index_in_property_vec),
            VecStoredValue::Int16(vec) => remove_at_checked(vec, index_in_property_vec),
            VecStoredValue::Int32(vec) => remove_at_checked(vec, index_in_property_vec),
            VecStoredValue::Int64(vec) => remove_at_checked(vec, index_in_property_vec),
            VecStoredValue::Text(vec) => remove_at_checked(vec, index_in_property_vec),
            VecStoredValue::Hash(vec) => remove_at_checked(vec, index_in_property_vec),
            VecStoredValue::Reference(vec) => remove_at_checked(vec, index_in_property_vec),
        }

        self.increment_nonce();
    }

    /// Insert provided `StoredValue` at given `index_in_property_vec`, increment `nonce`
    pub fn insert_at(
        &mut self,
        index_in_property_vec: VecMaxLength,
        single_value: StoredValue<Hash, EntityId>,
    ) {
        fn insert_at<T>(vec: &mut Vec<T>, index_in_property_vec: VecMaxLength, value: T) {
            if (index_in_property_vec as usize) < vec.len() {
                vec.insert(index_in_property_vec as usize, value);
            }
        }

        match (&mut self.vec_value, single_value) {
            (VecStoredValue::Bool(vec), StoredValue::Bool(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecStoredValue::Uint16(vec), StoredValue::Uint16(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecStoredValue::Uint32(vec), StoredValue::Uint32(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecStoredValue::Uint64(vec), StoredValue::Uint64(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecStoredValue::Int16(vec), StoredValue::Int16(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecStoredValue::Int32(vec), StoredValue::Int32(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            (VecStoredValue::Int64(vec), StoredValue::Int64(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }

            // Match by move, when https://github.com/rust-lang/rust/issues/68354 stableize
            (VecStoredValue::Text(vec), StoredValue::Text(ref value)) => {
                insert_at(vec, index_in_property_vec, value.to_owned())
            }
            (VecStoredValue::Reference(vec), StoredValue::Reference(value)) => {
                insert_at(vec, index_in_property_vec, value)
            }
            _ => return,
        }

        self.increment_nonce();
    }

    /// Ensure `VecStoredPropertyValue` nonce is equal to the provided one.
    /// Used to to avoid possible data races, when performing vector specific operations
    pub fn ensure_nonce_equality<T: Trait>(&self, new_nonce: Nonce) -> Result<(), Error<T>> {
        ensure!(
            self.nonce == new_nonce,
            Error::<T>::PropertyValueVecNoncesDoesNotMatch
        );
        Ok(())
    }

    /// Ensure, provided `index_in_property_vec` is valid index of `VecStoredValue`
    pub fn ensure_index_in_property_vector_is_valid<T: Trait>(
        &self,
        index_in_property_vec: VecMaxLength,
    ) -> Result<(), Error<T>> {
        ensure!(
            (index_in_property_vec as usize) <= self.len(),
            Error::<T>::EntityPropertyValueVectorIndexIsOutOfRange
        );

        Ok(())
    }
}

/// Vector value enum representation, related to corresponding `VecStoredPropertyValue` structure
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Hash, PartialEq, Eq, PartialOrd, Ord, Debug)]
pub enum VecStoredValue<Hash, EntityId> {
    Bool(Vec<bool>),
    Uint16(Vec<u16>),
    Uint32(Vec<u32>),
    Uint64(Vec<u64>),
    Int16(Vec<i16>),
    Int32(Vec<i32>),
    Int64(Vec<i64>),
    Hash(Vec<Hash>),
    Text(Vec<Vec<u8>>),
    Reference(Vec<EntityId>),
}

impl<Hash, EntityId> Default for VecStoredValue<Hash, EntityId> {
    fn default() -> Self {
        Self::Bool(vec![])
    }
}

impl<Hash, EntityId> VecStoredValue<Hash, EntityId> {
    /// Retrieve all involved `entity_id`'s, if current `VecStoredValue` is reference
    pub fn get_involved_entities(&self) -> Option<Vec<EntityId>> {
        if let Self::Reference(entity_ids) = self {
            Some(entity_ids.to_owned())
        } else {
            None
        }
    }
}
