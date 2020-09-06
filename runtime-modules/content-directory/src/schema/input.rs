use super::*;
use sp_runtime::traits::Hash;

/// Enum, representing either `SingleInputPropertyValue` or `VecInputPropertyValue`
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum InputPropertyValue<
    Hashing: Hash<Output = HashType> + MaybeSerializeDeserialize,
    HashType: Parameter
        + Member
        + MaybeSerializeDeserialize
        + Debug
        + MaybeDisplay
        + SimpleBitOps
        + Ord
        + Default
        + Copy
        + CheckEqual
        + sp_std::hash::Hash
        + AsRef<[u8]>
        + AsMut<[u8]>
        + MaybeMallocSizeOf,
    EntityId,
> {
    Single(InputValue<Hashing, HashType, EntityId>),
    Vector(VecInputValue<Hashing, HashType, EntityId>),
}

impl<
        Hashing: Hash<Output = HashType> + MaybeSerializeDeserialize,
        HashType: Parameter
            + Member
            + MaybeSerializeDeserialize
            + Debug
            + MaybeDisplay
            + SimpleBitOps
            + Ord
            + Default
            + Copy
            + CheckEqual
            + sp_std::hash::Hash
            + AsRef<[u8]>
            + AsMut<[u8]>
            + MaybeMallocSizeOf,
        EntityId,
    > InputPropertyValue<Hashing, HashType, EntityId>
{
    pub fn as_single_value(&self) -> Option<&InputValue<Hashing, HashType, EntityId>> {
        if let InputPropertyValue::Single(single_value) = self {
            Some(single_value)
        } else {
            None
        }
    }

    pub fn as_vec_value(&self) -> Option<&VecInputValue<Hashing, HashType, EntityId>> {
        if let InputPropertyValue::Vector(vec_value) = self {
            Some(vec_value)
        } else {
            None
        }
    }

    pub fn as_vec_value_mut(&mut self) -> Option<&mut VecInputValue<Hashing, HashType, EntityId>> {
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

impl<
        Hashing: Hash<Output = HashType> + MaybeSerializeDeserialize,
        HashType: Parameter
            + Member
            + MaybeSerializeDeserialize
            + Debug
            + MaybeDisplay
            + SimpleBitOps
            + Ord
            + Default
            + Copy
            + CheckEqual
            + sp_std::hash::Hash
            + AsRef<[u8]>
            + AsMut<[u8]>
            + MaybeMallocSizeOf,
        EntityId,
    > Default for InputPropertyValue<Hashing, HashType, EntityId>
{
    fn default() -> Self {
        InputPropertyValue::Single(InputValue::default())
    }
}

/// InputValue enum representation, related to corresponding `SingleInputPropertyValue` structure
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum InputValue<
    Hashing: Hash<Output = HashType> + MaybeSerializeDeserialize,
    HashType: Parameter
        + Member
        + MaybeSerializeDeserialize
        + Debug
        + MaybeDisplay
        + SimpleBitOps
        + Ord
        + Default
        + Copy
        + CheckEqual
        + sp_std::hash::Hash
        + AsRef<[u8]>
        + AsMut<[u8]>
        + MaybeMallocSizeOf,
    EntityId,
> {
    Bool(bool),
    Uint16(u16),
    Uint32(u32),
    Uint64(u64),
    Int16(i16),
    Int32(i32),
    Int64(i64),
    Text(Vec<u8>),
    // Used to pass text value, which respective hash should be stored
    TextToHash(Hashing, Vec<u8>),
    Reference(EntityId),
}

impl<
        Hashing: Hash<Output = HashType> + MaybeSerializeDeserialize,
        HashType: Parameter
            + Member
            + MaybeSerializeDeserialize
            + Debug
            + MaybeDisplay
            + SimpleBitOps
            + Ord
            + Default
            + Copy
            + CheckEqual
            + sp_std::hash::Hash
            + AsRef<[u8]>
            + AsMut<[u8]>
            + MaybeMallocSizeOf,
        EntityId,
    > Default for InputValue<Hashing, HashType, EntityId>
{
    fn default() -> Self {
        Self::Bool(false)
    }
}

impl<
        Hashing: Hash<Output = HashType> + MaybeSerializeDeserialize,
        HashType: Parameter
            + Member
            + MaybeSerializeDeserialize
            + Debug
            + MaybeDisplay
            + SimpleBitOps
            + Ord
            + Default
            + Copy
            + CheckEqual
            + sp_std::hash::Hash
            + AsRef<[u8]>
            + AsMut<[u8]>
            + MaybeMallocSizeOf,
        EntityId,
    > InputValue<Hashing, HashType, EntityId>
{
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
pub enum VecInputValue<
    Hashing: Hash<Output = HashType> + MaybeSerializeDeserialize,
    HashType: Parameter
        + Member
        + MaybeSerializeDeserialize
        + Debug
        + MaybeDisplay
        + SimpleBitOps
        + Ord
        + Default
        + Copy
        + CheckEqual
        + sp_std::hash::Hash
        + AsRef<[u8]>
        + AsMut<[u8]>
        + MaybeMallocSizeOf,
    EntityId,
> {
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
    Reference(Hashing, Vec<EntityId>),
}

impl<
        Hashing: Hash<Output = HashType> + MaybeSerializeDeserialize,
        HashType: Parameter
            + Member
            + MaybeSerializeDeserialize
            + Debug
            + MaybeDisplay
            + SimpleBitOps
            + Ord
            + Default
            + Copy
            + CheckEqual
            + sp_std::hash::Hash
            + AsRef<[u8]>
            + AsMut<[u8]>
            + MaybeMallocSizeOf,
        EntityId,
    > Default for VecInputValue<Hashing, HashType, EntityId>
{
    fn default() -> Self {
        Self::Bool(vec![])
    }
}

impl<
        Hashing: Hash<Output = HashType> + MaybeSerializeDeserialize,
        HashType: Parameter
            + Member
            + MaybeSerializeDeserialize
            + Debug
            + MaybeDisplay
            + SimpleBitOps
            + Ord
            + Default
            + Copy
            + CheckEqual
            + sp_std::hash::Hash
            + AsRef<[u8]>
            + AsMut<[u8]>
            + MaybeMallocSizeOf,
        EntityId,
    > VecInputValue<Hashing, HashType, EntityId>
{
    /// Retrieve all involved `entity_id`'s, if current `VecInputValue` is reference
    pub fn get_involved_entities(&self) -> Option<Vec<EntityId>> {
        if let Self::Reference(entity_ids) = self {
            Some(entity_ids.to_owned())
        } else {
            None
        }
    }
}
